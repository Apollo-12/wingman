import type { Database } from "@/lib/supabase/database.types";

type Airport = Database["public"]["Tables"]["airports"]["Row"];
type Airline = Database["public"]["Tables"]["airlines"]["Row"];

/**
 * Resolves a 3-letter IATA airport code to an airports row.
 * Flighty exports IATA codes in From/To/Diverted To columns.
 */
export function matchAirportByIata(
  iataCode: string | null | undefined,
  airports: Airport[],
): Airport | null {
  if (!iataCode) return null;
  const code = iataCode.trim().toUpperCase();
  if (code.length !== 3) return null;
  return airports.find((a) => a.iata_code === code) ?? null;
}

/**
 * Resolves a 3-letter ICAO airline code to an airlines row.
 *
 * Flighty exports the ICAO code in the "Airline" column (e.g. MAS for
 * Malaysia Airlines, AFR for Air France). We prefer active airlines in
 * case an ICAO code was reassigned over the years.
 */
export function matchAirlineByIcao(
  icaoCode: string | null | undefined,
  airlines: Airline[],
): Airline | null {
  if (!icaoCode) return null;
  const code = icaoCode.trim().toUpperCase();
  if (code.length !== 3) return null;

  const matches = airlines.filter((a) => a.icao_code === code);
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Multiple airlines with the same ICAO (rare, happens with reassignments).
  // Prefer active ones.
  const active = matches.find((a) => a.active);
  return active ?? matches[0];
}
