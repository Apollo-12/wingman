import type { Database } from "@/lib/supabase/database.types";

type AircraftType = Database["public"]["Tables"]["aircraft_types"]["Row"];

/**
 * Maps messy CSV aircraft names to our canonical ICAO codes.
 *
 * Flighty's "Aircraft Type Name" column uses free-text names that don't
 * perfectly match our seeded names (spaces, variant letters, etc.).
 * This map encodes the known synonyms we've seen in real CSVs.
 *
 * Add entries here as you encounter new names during imports.
 */
const AIRCRAFT_NAME_SYNONYMS: Record<string, string> = {
  // Boeing 777 family - Flighty puts a space before "ER"
  "boeing 777-200 er": "B772", // 777-200ER -> 777-200 (same ICAO in our schema)
  "boeing 777-300 er": "B77W",

  // Boeing 767-400 - Flighty drops the "ER" suffix (only variant ever produced)
  "boeing 767-400": "B764",

  // Dash 6 variant
  "dhc-6 twin otter": "DHC6",

  // Dash 8 variants - Flighty uses "DHC-8-xxx Dash 8"
  "dhc-8-100 dash 8": "DH8A",
  "dhc-8-200 dash 8": "DH8B",
  "dhc-8-300 dash 8": "DH8C",
  "dhc-8-400 dash 8q": "DH8D",
  "dhc-8-400 dash 8": "DH8D",

  // Bombardier CRJ with trailing spaces / variant wording
  "bombardier crj900": "CRJ9",
  "bombardier crj700": "CRJ7",
  "bombardier crj200": "CRJ2",
  "bombardier crj1000": "CRJX",

  // Flighty sometimes lumps ATR 42 and ATR 72 together when unknown
  "atr 42 / atr 72": "AT72", // default to ATR 72 (more common)

  // Generic helicopter catch-all
  "bell helicopter": "HELI",
  helicopter: "HELI",

  // Embraer E-Jet family - Flighty drops the "E" prefix
  "embraer 170": "E170",
  "embraer 190": "E190",
  "embraer 195": "E195",

  // Embraer ERJ family - Flighty writes "RJ" instead of "ERJ-"
  "embraer rj135": "E135",
  "embraer rj145": "E145",
};

/**
 * Normalizes an aircraft name for matching: lowercased, trimmed,
 * multiple whitespace collapsed to single space.
 */
function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Resolves a free-text aircraft name to an aircraft_types row ID.
 * Returns null if no match can be found.
 *
 * Matching strategy, in order:
 *   1. Exact match on normalized name (no case, no extra spaces)
 *   2. Synonym lookup (hand-curated in AIRCRAFT_NAME_SYNONYMS)
 *   3. Return null (caller decides what to do)
 */
export function matchAircraftType(
  csvName: string | null | undefined,
  aircraftTypes: AircraftType[],
): AircraftType | null {
  if (!csvName) return null;

  const normalized = normalize(csvName);

  // 1. Exact match on normalized name
  const exactMatch = aircraftTypes.find(
    (at) => normalize(at.name) === normalized,
  );
  if (exactMatch) return exactMatch;

  // 2. Synonym lookup
  const synonymIcao = AIRCRAFT_NAME_SYNONYMS[normalized];
  if (synonymIcao) {
    const byIcao = aircraftTypes.find((at) => at.icao_code === synonymIcao);
    if (byIcao) return byIcao;
  }

  return null;
}
