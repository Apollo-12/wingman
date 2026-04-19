/**
 * Runs an async function over an array in batches of a given size.
 * Useful for bulk-inserting thousands of rows into Supabase without
 * exceeding request size limits.
 *
 * @example
 *   await runInBatches(rows, 500, async (batch) => {
 *     await supabase.from("airports").insert(batch);
 *   });
 */
export async function runInBatches<T>(
  items: T[],
  batchSize: number,
  fn: (batch: T[], batchIndex: number, total: number) => Promise<void>,
): Promise<void> {
  const totalBatches = Math.ceil(items.length / batchSize);
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize) + 1;
    await fn(batch, batchIndex, totalBatches);
  }
}
