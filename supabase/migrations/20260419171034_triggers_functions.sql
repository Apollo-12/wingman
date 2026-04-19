-- ============================================================================
-- Migration 003: Triggers & helper functions
-- ----------------------------------------------------------------------------
-- Automates derived fields so the app layer stays simple:
--  - flights.distance_km        = haversine(dep_airport, arr_airport)
--  - flights.duration_minutes   = landing_actual - takeoff_actual (fallback: scheduled)
--  - *.updated_at               = now() on every UPDATE
-- ============================================================================

-- ─── set_updated_at() ───────────────────────────────────────────────────────
-- Generic trigger function: bumps the updated_at column to now() on UPDATE.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger profiles_set_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();

create trigger flights_set_updated_at
    before update on public.flights
    for each row execute function public.set_updated_at();

-- ─── haversine_km() ─────────────────────────────────────────────────────────
-- Great-circle distance in kilometers between two lat/lon pairs.
-- Accurate enough for flight stats (< 0.5% error vs true geodesic).
create function public.haversine_km(
    lat1 double precision,
    lon1 double precision,
    lat2 double precision,
    lon2 double precision
)
returns double precision
language sql
immutable
as $$
    select 2 * 6371 * asin(
        sqrt(
            sin(radians(lat2 - lat1) / 2) ^ 2
            + cos(radians(lat1)) * cos(radians(lat2))
            * sin(radians(lon2 - lon1) / 2) ^ 2
        )
    );
$$;

-- ─── compute_flight_derived_fields() ────────────────────────────────────────
-- Called before INSERT or UPDATE on flights: populates distance_km and
-- duration_minutes from the referenced airports and timestamps.
create function public.compute_flight_derived_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    dep record;
    arr record;
    takeoff timestamptz;
    landing timestamptz;
begin
    -- Distance: use diverted_to if present, else arrival_airport
    select latitude, longitude into dep
    from public.airports where id = new.departure_airport_id;

    select latitude, longitude into arr
    from public.airports
    where id = coalesce(new.diverted_to_airport_id, new.arrival_airport_id);

    if dep is not null and arr is not null then
        new.distance_km = round(public.haversine_km(
            dep.latitude, dep.longitude,
            arr.latitude, arr.longitude
        ))::int;
    end if;

    -- Duration: prefer actual timestamps, fall back to scheduled
    takeoff := coalesce(new.takeoff_actual, new.takeoff_scheduled);
    landing := coalesce(new.landing_actual, new.landing_scheduled);

    if takeoff is not null and landing is not null and landing > takeoff then
        new.duration_minutes = extract(epoch from (landing - takeoff))::int / 60;
    end if;

    return new;
end;
$$;

create trigger flights_compute_derived_fields
    before insert or update on public.flights
    for each row execute function public.compute_flight_derived_fields();
