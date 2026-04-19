import "./lib/load-env";
import Papa from "papaparse";
import { supabaseAdmin } from "./lib/supabase-admin";
import { runInBatches } from "./lib/batch";

// OpenFlights airlines.dat (mirror on GitHub, stable URL)
const OPENFLIGHTS_AIRLINES_URL =
  "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat";

// airlines.dat has no header row; columns are:
// 0: Airline ID, 1: Name, 2: Alias, 3: IATA, 4: ICAO,
// 5: Callsign, 6: Country, 7: Active ("Y"/"N")
type AirlineRow = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

type AirlineInsert = {
  iata_code: string | null;
  icao_code: string | null;
  name: string;
  callsign: string | null;
  country: string | null;
  active: boolean;
};

function cleanField(value: string): string | null {
  if (!value || value === "\\N" || value === "-" || value === "") {
    return null;
  }
  return value.trim();
}

async function main() {
  console.log("⬇️  Downloading OpenFlights airlines.dat...");
  const res = await fetch(OPENFLIGHTS_AIRLINES_URL);
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }
  const csv = await res.text();
  console.log(`   Got ${(csv.length / 1024).toFixed(1)} KB`);

  console.log("🧩 Parsing...");
  const parsed = Papa.parse<AirlineRow>(csv, {
    header: false,
    skipEmptyLines: true,
  });

  console.log(`   Parsed ${parsed.data.length.toLocaleString()} raw rows`);

  console.log("🔍 Filtering & mapping...");
  const airlines: AirlineInsert[] = parsed.data
    .filter((row) => row.length >= 8)
    .map((row) => ({
      iata_code: cleanField(row[3]),
      icao_code: cleanField(row[4]),
      name: row[1]?.trim() || "",
      callsign: cleanField(row[5]),
      country: cleanField(row[6]),
      active: row[7] === "Y",
    }))
    // Need at least a name AND one of iata/icao to be useful
    .filter((a) => a.name.length > 0 && (a.iata_code || a.icao_code));

  console.log(`   Kept ${airlines.length.toLocaleString()} airlines`);

  console.log("🧹 Wiping existing airlines table...");
  const { error: wipeError } = await supabaseAdmin
    .from("airlines")
    .delete()
    .gte("id", 0);
  if (wipeError) {
    throw new Error(`Wipe failed: ${wipeError.message}`);
  }

  console.log("📤 Inserting in batches of 500...");
  await runInBatches(airlines, 500, async (batch, i, total) => {
    const { error } = await supabaseAdmin.from("airlines").insert(batch);
    if (error) {
      throw new Error(`Batch ${i}/${total} failed: ${error.message}`);
    }
    const done = i * 500;
    const pct = Math.min(100, Math.round((done / airlines.length) * 100));
    process.stdout.write(`\r   Batch ${i}/${total}  (~${pct}%)`);
  });
  process.stdout.write("\n");

  console.log("✅ Done!");
  console.log(`   ${airlines.length.toLocaleString()} airlines inserted.`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
