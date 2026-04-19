import "./lib/load-env";
import { supabaseAdmin } from "./lib/supabase-admin";
import { AIRCRAFT_TYPES } from "./data/aircraft-types";

async function main() {
  console.log(`📦 Loading ${AIRCRAFT_TYPES.length} curated aircraft types...`);

  console.log("🧹 Wiping existing aircraft_types table...");
  const { error: wipeError } = await supabaseAdmin
    .from("aircraft_types")
    .delete()
    .gte("id", 0);
  if (wipeError) {
    throw new Error(`Wipe failed: ${wipeError.message}`);
  }

  console.log("📤 Inserting...");
  const { error } = await supabaseAdmin
    .from("aircraft_types")
    .insert(AIRCRAFT_TYPES);

  if (error) {
    throw new Error(`Insert failed: ${error.message}`);
  }

  console.log("✅ Done!");
  console.log(`   ${AIRCRAFT_TYPES.length} aircraft types inserted.`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
