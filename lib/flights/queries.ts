import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

/**
 * Fetches all flights for the currently authenticated user.
 *
 * Joins reference tables to get human-readable names in a single round-trip.
 * Ordered by scheduled_date DESC (most recent first).
 *
 * RLS ensures this returns only the caller's flights.
 */
export async function getUserFlights(supabase: Client) {
  return supabase
    .from("flights")
    .select(
      `
      id,
      flight_number,
      scheduled_date,
      status,
      distance_km,
      duration_minutes,
      airline:airlines ( iata_code, name ),
      departure_airport:airports!flights_departure_airport_id_fkey ( iata_code, city, name ),
      arrival_airport:airports!flights_arrival_airport_id_fkey ( iata_code, city, name ),
      aircraft_type:aircraft_types ( name, family )
      `,
    )
    .order("scheduled_date", { ascending: false });
}

/**
 * Counts total flights for the user. Useful for stats teasers.
 */
export async function countUserFlights(supabase: Client) {
  return supabase.from("flights").select("*", { count: "exact", head: true });
}
