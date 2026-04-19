/**
 * Loads environment variables from .env.local (priority) then .env.
 * Import this at the VERY TOP of any script that needs env vars.
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });
