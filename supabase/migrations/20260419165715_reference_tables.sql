-- ============================================================================
-- Migration 001: Reference tables
-- ----------------------------------------------------------------------------
-- These tables hold static reference data shared by all users:
--  - airports     (seeded from OurAirports)
--  - airlines     (seeded from OpenFlights)
--  - aircraft_types (seeded from OpenFlights + manual curation)
--
-- They are readable by every authenticated user (RLS allows SELECT only).
-- Writes are done by service_role scripts only (seed jobs).
-- ============================================================================

-- ─── airports ───────────────────────────────────────────────────────────────
create table public.airports (
    id              bigint generated always as identity primary key,
    iata_code       text unique,          -- 3 letters, e.g. "CDG". NULL for small airports.
    icao_code       text unique,          -- 4 letters, e.g. "LFPG". Always present.
    name            text not null,        -- "Paris Charles de Gaulle"
    city            text,
    country         text,
    country_code    text,                 -- ISO 3166-1 alpha-2, e.g. "FR"
    latitude        double precision not null,
    longitude       double precision not null,
    elevation_ft    integer,
    timezone        text,                 -- IANA tz, e.g. "Europe/Paris"
    type            text,                 -- "large_airport", "medium_airport", "small_airport", ...
    scheduled_service boolean default false,
    created_at      timestamptz not null default now()
);

comment on table public.airports is 'Global airports reference (seeded from OurAirports).';

-- Indexes for the queries we will actually run
create index airports_iata_idx on public.airports (iata_code) where iata_code is not null;
create index airports_icao_idx on public.airports (icao_code) where icao_code is not null;
create index airports_country_idx on public.airports (country_code);
-- For "find nearest airport" queries later on (using lat/lon range scans)
create index airports_lat_lon_idx on public.airports (latitude, longitude);

-- ─── airlines ───────────────────────────────────────────────────────────────
create table public.airlines (
    id              bigint generated always as identity primary key,
    iata_code       text,                 -- 2 letters, e.g. "AF". Can be NULL for cargo / defunct.
    icao_code       text,                 -- 3 letters, e.g. "AFR". Usually present.
    name            text not null,        -- "Air France"
    callsign        text,                 -- "AIRFRANS"
    country         text,
    active          boolean default true,
    logo_url        text,                 -- Optional override. Default pattern uses airhex.com.
    created_at      timestamptz not null default now()
);

comment on table public.airlines is 'Airlines reference (seeded from OpenFlights, enriched manually).';

-- A single airline can share IATA with another defunct one; constraint is intentional non-unique.
create index airlines_iata_idx on public.airlines (iata_code) where iata_code is not null;
create index airlines_icao_idx on public.airlines (icao_code) where icao_code is not null;
create index airlines_active_idx on public.airlines (active);

-- ─── aircraft_types ─────────────────────────────────────────────────────────
-- The "family" column is the key to Alexandre's stats preference:
-- count all 777 variants (777-200, 777-300, 777-300ER, 777-9) as "777" if desired,
-- or drill down to the exact variant. Family is curated manually during seeding.
create table public.aircraft_types (
    id              bigint generated always as identity primary key,
    icao_code       text unique,          -- e.g. "B77W" for 777-300ER
    iata_code       text,                 -- e.g. "77W"
    name            text not null,        -- "Boeing 777-300ER"
    manufacturer    text,                 -- "Boeing", "Airbus", "Embraer", ...
    family          text,                 -- "777", "A320", "E-Jet" (groups variants)
    model           text,                 -- "777-300ER", "A320neo"
    variant         text,                 -- "ER", "neo", "LR", NULL for base
    category        text,                 -- "widebody", "narrowbody", "regional", "turboprop"
    engine_count    integer,
    engine_type     text,                 -- "jet", "turboprop", "piston"
    created_at      timestamptz not null default now()
);

comment on table public.aircraft_types is 'Aircraft types with family grouping for flexible stats filtering.';

create index aircraft_types_icao_idx on public.aircraft_types (icao_code);
create index aircraft_types_family_idx on public.aircraft_types (family);
create index aircraft_types_manufacturer_idx on public.aircraft_types (manufacturer);

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- Reference tables are readable by any authenticated user.
-- Writes are blocked by default (no policy = deny). Seed scripts use service_role.

alter table public.airports enable row level security;
alter table public.airlines enable row level security;
alter table public.aircraft_types enable row level security;

create policy "airports_select_authenticated"
    on public.airports for select
    to authenticated
    using (true);

create policy "airlines_select_authenticated"
    on public.airlines for select
    to authenticated
    using (true);

create policy "aircraft_types_select_authenticated"
    on public.aircraft_types for select
    to authenticated
    using (true);
