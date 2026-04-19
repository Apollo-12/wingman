import "./lib/load-env";
import Papa from "papaparse";
import { supabaseAdmin } from "./lib/supabase-admin";
import { runInBatches } from "./lib/batch";

const OURAIRPORTS_CSV_URL =
  "https://davidmegginson.github.io/ourairports-data/airports.csv";

type OurAirportsRow = {
  id: string;
  ident: string;
  type: string;
  name: string;
  latitude_deg: string;
  longitude_deg: string;
  elevation_ft: string;
  continent: string;
  iso_country: string;
  iso_region: string;
  municipality: string;
  scheduled_service: string;
  gps_code: string;
  iata_code: string;
  local_code: string;
  home_link: string;
  wikipedia_link: string;
  keywords: string;
};

type AirportInsert = {
  iata_code: string | null;
  icao_code: string | null;
  name: string;
  city: string | null;
  country: string | null;
  country_code: string | null;
  latitude: number;
  longitude: number;
  elevation_ft: number | null;
  type: string | null;
  scheduled_service: boolean;
};

async function main() {
  console.log("⬇️  Downloading OurAirports CSV...");
  const res = await fetch(OURAIRPORTS_CSV_URL);
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }
  const csv = await res.text();
  console.log(`   Got ${(csv.length / 1024 / 1024).toFixed(1)} MB of CSV`);

  console.log("🧩 Parsing...");
  const parsed = Papa.parse<OurAirportsRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    console.warn(`   ⚠️  ${parsed.errors.length} parse warnings (non-fatal)`);
  }
  console.log(`   Parsed ${parsed.data.length.toLocaleString()} raw rows`);

  console.log("🔍 Filtering (keeping airports with an IATA code)...");
  const airports: AirportInsert[] = parsed.data
    .filter((row) => row.iata_code && row.iata_code.length === 3)
    .map((row) => ({
      iata_code: row.iata_code || null,
      icao_code: row.gps_code || row.ident || null,
      name: row.name,
      city: row.municipality || null,
      country: null, // OurAirports only provides country_code; full name can be enriched later
      country_code: row.iso_country || null,
      latitude: parseFloat(row.latitude_deg),
      longitude: parseFloat(row.longitude_deg),
      elevation_ft: row.elevation_ft ? parseInt(row.elevation_ft, 10) : null,
      type: row.type || null,
      scheduled_service: row.scheduled_service === "yes",
    }))
    .filter((a) => Number.isFinite(a.latitude) && Number.isFinite(a.longitude));

  console.log(`   Kept ${airports.length.toLocaleString()} airports with IATA`);

  console.log("🧹 Wiping existing airports table...");
  // We start fresh every time this script runs to keep it idempotent.
  // Safe because airports is a reference table with no user FKs yet.
  const { error: wipeError } = await supabaseAdmin
    .from("airports")
    .delete()
    .gte("id", 0);
  if (wipeError) {
    throw new Error(`Wipe failed: ${wipeError.message}`);
  }

  console.log("📤 Inserting in batches of 500...");
  await runInBatches(airports, 500, async (batch, i, total) => {
    const { error } = await supabaseAdmin.from("airports").insert(batch);
    if (error) {
      throw new Error(`Batch ${i}/${total} failed: ${error.message}`);
    }
    const done = i * 500;
    const pct = Math.min(100, Math.round((done / airports.length) * 100));
    process.stdout.write(`\r   Batch ${i}/${total}  (~${pct}%)`);
  });
  process.stdout.write("\n");

  console.log("✅ Done!");
  console.log(`   ${airports.length.toLocaleString()} airports inserted.`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
