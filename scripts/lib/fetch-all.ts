import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

type PublicTable = keyof Database["public"]["Tables"];
type RowOf<T extends PublicTable> = Database["public"]["Tables"][T]["Row"];

/**
 * Fetches ALL rows from a Supabase table, bypassing the default 1000-row limit
 * by paginating with .range(). Use for reference tables (airports, airlines)
 * that we load fully into memory for fast matching.
 */
export async function fetchAll<T extends PublicTable>(
  supabase: Client,
  table: T,
  pageSize = 1000,
): Promise<RowOf<T>[]> {
  const rows: RowOf<T>[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, to);

    if (error) {
      throw new Error(`fetchAll(${String(table)}) failed: ${error.message}`);
    }
    if (!data || data.length === 0) break;

    rows.push(...(data as unknown as RowOf<T>[]));
    if (data.length < pageSize) break; // last page
    from += pageSize;
  }

  return rows;
}
