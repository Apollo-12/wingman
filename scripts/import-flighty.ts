import "./lib/load-env";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Papa from "papaparse";
import { supabaseAdmin } from "./lib/supabase-admin";
import { runInBatches } from "./lib/batch";
import { matchAircraftType } from "./lib/aircraft-matcher";
import { matchAirportByIata, matchAirlineByIcao } from "./lib/ref-matchers";
import type { Database } from "@/lib/supabase/database.types";
import { fetchAll } from "./lib/fetch-all";

// ─── Types ──────────────────────────────────────────────────────────────────

type FlightyRow = {
  Date: string;
  Airline: string;
  Flight: string;
  From: string;
  To: string;
  "Dep Terminal": string;
  "Dep Gate": string;
  "Arr Terminal": string;
  "Arr Gate": string;
  Canceled: string;
  "Diverted To": string;
  "Gate Departure (Scheduled)": string;
  "Gate Departure (Actual)": string;
  "Take off (Scheduled)": string;
  "Take off (Actual)": string;
  "Landing (Scheduled)": string;
  "Landing (Actual)": string;
  "Gate Arrival (Scheduled)": string;
  "Gate Arrival (Actual)": string;
  "Aircraft Type Name": string;
  "Tail Number": string;
  PNR: string;
  Seat: string;
  "Seat Type": string;
  "Cabin Class": string;
  "Flight Reason": string;
  Notes: string;
  "Flight Flighty ID": string;
  "Airline Flighty ID": string;
  "Departure Airport Flighty ID": string;
  "Arrival Airport Flighty ID": string;
  "Diverted To Airport Flighty ID": string;
  "Aircraft Type Flighty ID": string;
};

type FlightInsert = Database["public"]["Tables"]["flights"]["Insert"];

// ─── Small utilities ───────────────────────────────────────────────────────

/** Empty-string -> null, trimmed. */
function clean(s: string | undefined | null): string | null {
  if (s == null) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

/**
 * Converts a Flighty timestamp ("2006-07-11T12:00", no TZ) to a UTC ISO
 * string. Flighty stores times in the LOCAL timezone of each airport
 * (e.g. takeoff in CDG local, landing in destination local). Without
 * per-airport timezone lookup, we append "Z" so Postgres stores them
 * as-is without any shift. Duration calculations will be approximate
 * when the flight crosses timezones — a known limitation we'll fix
 * in a later iteration if needed.
 */
function toIsoOrNull(ts: string | null | undefined): string | null {
  const t = clean(ts);
  if (!t) return null;
  if (t.includes("T")) {
    // Already ISO-ish; append Z if missing a timezone marker
    if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(t)) return t;
    return `${t}:00Z`.replace(/::00Z$/, ":00Z"); // normalize to HH:MM:SSZ
  }
  return null;
}

/** Map Flighty cabin class to our enum, best-effort. */
function mapCabinClass(csv: string | null): FlightInsert["cabin_class"] | null {
  if (!csv) return null;
  const s = csv.trim().toLowerCase();
  if (s === "economy" || s === "coach") return "economy";
  if (s === "premium economy" || s === "premium") return "premium_economy";
  if (s === "business") return "business";
  if (s === "first") return "first";
  return null;
}

function mapSeatType(csv: string | null): FlightInsert["seat_type"] | null {
  if (!csv) return null;
  const s = csv.trim().toLowerCase();
  if (s === "window") return "window";
  if (s === "middle") return "middle";
  if (s === "aisle") return "aisle";
  return "other";
}

function mapFlightReason(
  csv: string | null,
): FlightInsert["flight_reason"] | null {
  if (!csv) return null;
  const s = csv.trim().toLowerCase();
  if (s === "leisure" || s === "personal") return "leisure";
  if (s === "business" || s === "work") return "business";
  if (s === "commute") return "commute";
  if (s === "crew") return "crew";
  return "other";
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // 1. Resolve user ID ------------------------------------------------------
  const userEmail = process.argv[2];
  const csvPath = process.argv[3];

  if (!userEmail || !csvPath) {
    console.error(
      "Usage: npm run import:flighty -- <email> <path-to-csv>\n" +
        "Example: npm run import:flighty -- me@example.com private/flighty-export.csv",
    );
    process.exit(1);
  }

  console.log(`🔐 Looking up user: ${userEmail}`);
  const { data: usersPage, error: usersError } =
    await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) {
    throw new Error(`User lookup failed: ${usersError.message}`);
  }
  const user = usersPage.users.find((u) => u.email === userEmail);
  if (!user) {
    throw new Error(`No user found for email ${userEmail}`);
  }
  console.log(`   Found user_id: ${user.id}`);

  // 2. Load reference tables into memory (paginated, no 1000-row cap) ------
  console.log("📚 Loading reference tables...");
  const [airports, airlines, aircraftTypes] = await Promise.all([
    fetchAll(supabaseAdmin, "airports"),
    fetchAll(supabaseAdmin, "airlines"),
    fetchAll(supabaseAdmin, "aircraft_types"),
  ]);
  console.log(
    `   ${airports.length.toLocaleString()} airports, ${airlines.length.toLocaleString()} airlines, ${aircraftTypes.length} aircraft types`,
  );

  // 3. Parse CSV -----------------------------------------------------------
  console.log(`📄 Reading CSV: ${csvPath}`);
  const csvText = readFileSync(resolve(csvPath), "utf-8");
  const parsed = Papa.parse<FlightyRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    console.warn(`   ⚠️  ${parsed.errors.length} parse warnings (non-fatal)`);
  }
  console.log(`   ${parsed.data.length} rows parsed`);

  // 4. Transform & validate -----------------------------------------------
  console.log("🔄 Transforming rows...");
  const flightsToInsert: FlightInsert[] = [];
  const warnings: string[] = [];
  const skipped: string[] = [];

  for (const [i, row] of parsed.data.entries()) {
    const lineNumber = i + 2; // +1 for header, +1 for 1-based display
    const label = `line ${lineNumber} (${row.Date} ${row.Airline}${row.Flight} ${row.From}→${row.To})`;

    // Resolve FKs
    const depAirport = matchAirportByIata(row.From, airports);
    const arrAirport = matchAirportByIata(row.To, airports);
    const divertedAirport = row["Diverted To"]
      ? matchAirportByIata(row["Diverted To"], airports)
      : null;
    const airline = matchAirlineByIcao(row.Airline, airlines);
    const aircraft = matchAircraftType(
      row["Aircraft Type Name"],
      aircraftTypes,
    );

    // Hard requirement: we must have both airports
    if (!depAirport || !arrAirport) {
      skipped.push(
        `${label} — airport not found: ${!depAirport ? row.From : ""} ${!arrAirport ? row.To : ""}`.trim(),
      );
      continue;
    }

    // Soft warnings: log but don't skip
    if (row.Airline && !airline) {
      warnings.push(`${label} — airline not found: ${row.Airline}`);
    }
    if (row["Aircraft Type Name"] && !aircraft) {
      warnings.push(
        `${label} — aircraft not found: "${row["Aircraft Type Name"]}"`,
      );
    }

    const canceled = row.Canceled?.trim().toLowerCase() === "true";
    const isDiverted = !!divertedAirport;
    const status: Database["public"]["Enums"]["flight_status"] = canceled
      ? "canceled"
      : isDiverted
        ? "diverted"
        : // We don't know from the CSV if it's future or past without date compare.
          // Default to "completed" for imported historical data.
          "completed";

    flightsToInsert.push({
      user_id: user.id,
      flight_number: clean(row.Flight),
      airline_id: airline?.id ?? null,
      departure_airport_id: depAirport.id,
      arrival_airport_id: arrAirport.id,
      diverted_to_airport_id: divertedAirport?.id ?? null,
      scheduled_date: row.Date,
      gate_departure_scheduled: toIsoOrNull(row["Gate Departure (Scheduled)"]),
      gate_departure_actual: toIsoOrNull(row["Gate Departure (Actual)"]),
      takeoff_scheduled: toIsoOrNull(row["Take off (Scheduled)"]),
      takeoff_actual: toIsoOrNull(row["Take off (Actual)"]),
      landing_scheduled: toIsoOrNull(row["Landing (Scheduled)"]),
      landing_actual: toIsoOrNull(row["Landing (Actual)"]),
      gate_arrival_scheduled: toIsoOrNull(row["Gate Arrival (Scheduled)"]),
      gate_arrival_actual: toIsoOrNull(row["Gate Arrival (Actual)"]),
      dep_terminal: clean(row["Dep Terminal"]),
      dep_gate: clean(row["Dep Gate"]),
      arr_terminal: clean(row["Arr Terminal"]),
      arr_gate: clean(row["Arr Gate"]),
      aircraft_type_id: aircraft?.id ?? null,
      tail_number: clean(row["Tail Number"]),
      pnr: clean(row.PNR),
      seat: clean(row.Seat),
      seat_type: mapSeatType(clean(row["Seat Type"])),
      cabin_class: mapCabinClass(clean(row["Cabin Class"])),
      flight_reason: mapFlightReason(clean(row["Flight Reason"])),
      notes: clean(row.Notes),
      status,
      external_ids: row["Flight Flighty ID"]
        ? { flighty: row["Flight Flighty ID"] }
        : {},
    });
  }

  console.log(`   ✅ ${flightsToInsert.length} flights ready to insert`);
  if (skipped.length > 0) {
    console.log(`   ⏭️  ${skipped.length} skipped:`);
    skipped.forEach((s) => console.log(`      - ${s}`));
  }
  if (warnings.length > 0) {
    console.log(`   ⚠️  ${warnings.length} warnings:`);
    warnings.forEach((w) => console.log(`      - ${w}`));
  }

  // 5. Dry-run mode --------------------------------------------------------
  if (process.argv.includes("--dry-run")) {
    console.log("\n🧪 Dry run — no data inserted.");
    return;
  }

  // 6. Dedup against existing flights, then plain insert -------------------
  // PostgREST's upsert doesn't support partial unique indexes (our flighty
  // dedup index has a WHERE clause). So we dedup manually: fetch existing
  // flighty_ids for this user, skip already-imported ones, then insert.
  console.log("🔎 Checking for already-imported flights...");
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("flights")
    .select("external_ids")
    .eq("user_id", user.id);
  if (existingError) {
    throw new Error(`Existing check failed: ${existingError.message}`);
  }

  const alreadyImportedIds = new Set(
    (existing ?? [])
      .map((r) => {
        const ids = r.external_ids as Record<string, string> | null;
        return ids?.flighty;
      })
      .filter((id): id is string => Boolean(id)),
  );

  const toInsert = flightsToInsert.filter((f) => {
    const flightyId = (f.external_ids as Record<string, string> | undefined)
      ?.flighty;
    return !flightyId || !alreadyImportedIds.has(flightyId);
  });

  const skippedDupes = flightsToInsert.length - toInsert.length;
  if (skippedDupes > 0) {
    console.log(
      `   Skipping ${skippedDupes} flights already imported (dedup on Flighty ID).`,
    );
  }

  if (toInsert.length === 0) {
    console.log("\n✅ Nothing to insert — all flights already in DB.");
    return;
  }

  console.log(`\n📤 Inserting ${toInsert.length} flights...`);
  await runInBatches(toInsert, 200, async (batch, i, total) => {
    const { error } = await supabaseAdmin.from("flights").insert(batch);
    if (error) {
      throw new Error(`Batch ${i}/${total} failed: ${error.message}`);
    }
    const done = Math.min(i * 200, toInsert.length);
    process.stdout.write(
      `\r   Batch ${i}/${total}  (${done}/${toInsert.length})`,
    );
  });
  process.stdout.write("\n");

  console.log("\n✅ Import complete!");
}

main().catch((err) => {
  console.error("\n❌ Import failed:", err);
  process.exit(1);
});
