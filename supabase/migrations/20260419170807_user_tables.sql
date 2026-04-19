-- ============================================================================
-- Migration 002: User tables
-- ----------------------------------------------------------------------------
-- These tables hold per-user data:
--  - profiles      (extends auth.users with app-specific fields)
--  - flights       (the heart of Wingman: one row per flight taken or planned)
--  - flight_photos (optional, lazy-loaded; user-uploaded boarding passes etc.)
--
-- RLS enforces that each user can ONLY read/write their own rows.
-- Reference tables (airports/airlines/aircraft_types) are joined by ID.
-- ============================================================================

-- ─── profiles ───────────────────────────────────────────────────────────────
-- Supabase auth stores users in auth.users (managed). We extend it with a
-- public.profiles row keyed by the same UUID, for fields we actually use.
create table public.profiles (
    id              uuid primary key references auth.users (id) on delete cascade,
    display_name    text,
    home_airport_id bigint references public.airports (id) on delete set null,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

comment on table public.profiles is 'App-specific user fields; one row per auth.users.id.';

-- ─── flights ────────────────────────────────────────────────────────────────
-- Core table. Mirrors the Flighty CSV export structure, plus some extras.

create type public.flight_status as enum (
    'scheduled',
    'completed',
    'canceled',
    'diverted'
);

create type public.cabin_class as enum (
    'economy',
    'premium_economy',
    'business',
    'first'
);

create type public.seat_type as enum (
    'window',
    'middle',
    'aisle',
    'other'
);

create type public.flight_reason as enum (
    'leisure',
    'business',
    'commute',
    'crew',
    'other'
);

create table public.flights (
    id                          uuid primary key default gen_random_uuid(),
    user_id                     uuid not null references auth.users (id) on delete cascade,

    -- Core identifiers
    flight_number               text,                       -- e.g. "AF011"
    airline_id                  bigint references public.airlines (id) on delete set null,

    -- Route
    departure_airport_id        bigint not null references public.airports (id) on delete restrict,
    arrival_airport_id          bigint not null references public.airports (id) on delete restrict,
    diverted_to_airport_id      bigint references public.airports (id) on delete set null,

    -- Scheduled date (day of the flight, for calendar grouping and imports)
    scheduled_date              date not null,

    -- Timestamps (all UTC). Flighty provides four sched + four actual.
    gate_departure_scheduled    timestamptz,
    gate_departure_actual       timestamptz,
    takeoff_scheduled           timestamptz,
    takeoff_actual              timestamptz,
    landing_scheduled           timestamptz,
    landing_actual              timestamptz,
    gate_arrival_scheduled      timestamptz,
    gate_arrival_actual         timestamptz,

    -- Gates / terminals
    dep_terminal                text,
    dep_gate                    text,
    arr_terminal                text,
    arr_gate                    text,

    -- Aircraft
    aircraft_type_id            bigint references public.aircraft_types (id) on delete set null,
    tail_number                 text,                       -- e.g. "F-GSQA"

    -- Booking
    pnr                         text,
    seat                        text,                       -- e.g. "12A"
    seat_type                   public.seat_type,
    cabin_class                 public.cabin_class,

    -- Meta
    flight_reason               public.flight_reason,
    notes                       text,
    status                      public.flight_status not null default 'scheduled',

    -- Computed fields (populated by triggers in migration 003)
    distance_km                 integer,
    duration_minutes            integer,

    -- External IDs (for deduping imports from Flighty / other sources)
    external_ids                jsonb default '{}'::jsonb,

    created_at                  timestamptz not null default now(),
    updated_at                  timestamptz not null default now()
);

comment on table public.flights is 'Per-user flight log. RLS restricts access to owner only.';

-- Dedup guard: a given Flighty ID cannot be imported twice by the same user.
-- (The external_ids jsonb uses key "flighty" for the Flighty flight ID.)
create unique index flights_user_flighty_id_uidx
    on public.flights (user_id, (external_ids ->> 'flighty'))
    where external_ids ->> 'flighty' is not null;

-- Indexes for common queries
create index flights_user_date_idx on public.flights (user_id, scheduled_date desc);
create index flights_user_status_idx on public.flights (user_id, status);
create index flights_departure_airport_idx on public.flights (departure_airport_id);
create index flights_arrival_airport_idx on public.flights (arrival_airport_id);
create index flights_aircraft_type_idx on public.flights (aircraft_type_id);
create index flights_airline_idx on public.flights (airline_id);

-- ─── flight_photos ──────────────────────────────────────────────────────────
-- Optional per-flight photos (boarding passes, window views, ...).
-- Actual file lives in Supabase Storage; this table stores only the path.
create table public.flight_photos (
    id          uuid primary key default gen_random_uuid(),
    flight_id   uuid not null references public.flights (id) on delete cascade,
    user_id     uuid not null references auth.users (id) on delete cascade,
    storage_path text not null,
    caption     text,
    created_at  timestamptz not null default now()
);

comment on table public.flight_photos is 'Photos attached to a flight. Actual file in Supabase Storage.';

create index flight_photos_flight_idx on public.flight_photos (flight_id);
create index flight_photos_user_idx on public.flight_photos (user_id);

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- This is the magic: 1 line per policy and your data is bulletproof.
-- Without this, anyone with your publishable key could read everyone's flights.

alter table public.profiles enable row level security;
alter table public.flights enable row level security;
alter table public.flight_photos enable row level security;

-- profiles: a user can only see and edit their own profile row
create policy "profiles_select_own"
    on public.profiles for select
    to authenticated
    using ((select auth.uid()) = id);

create policy "profiles_insert_own"
    on public.profiles for insert
    to authenticated
    with check ((select auth.uid()) = id);

create policy "profiles_update_own"
    on public.profiles for update
    to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

-- flights: same logic, on user_id
create policy "flights_select_own"
    on public.flights for select
    to authenticated
    using ((select auth.uid()) = user_id);

create policy "flights_insert_own"
    on public.flights for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "flights_update_own"
    on public.flights for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

create policy "flights_delete_own"
    on public.flights for delete
    to authenticated
    using ((select auth.uid()) = user_id);

-- flight_photos: same logic
create policy "flight_photos_select_own"
    on public.flight_photos for select
    to authenticated
    using ((select auth.uid()) = user_id);

create policy "flight_photos_insert_own"
    on public.flight_photos for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "flight_photos_update_own"
    on public.flight_photos for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

create policy "flight_photos_delete_own"
    on public.flight_photos for delete
    to authenticated
    using ((select auth.uid()) = user_id);

-- ─── Auto-create profile on signup ──────────────────────────────────────────
-- When Supabase creates a new auth.users row (signup), automatically mirror it
-- into public.profiles. Saves us from doing it from the app every time.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id)
    values (new.id);
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();