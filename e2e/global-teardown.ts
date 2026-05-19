/**
 * Global teardown runs once after all test projects complete.
 *
 * Clean-up strategy:
 * - Auth storage states are ephemeral (30-min TTL checked in global-setup).
 * - Test data in Firestore is namespaced by unique IDs from test-data.ts,
 *   so collisions are avoided and stale data does not affect other runs.
 * - If a deterministic seed endpoint is added to the backend (see Section I),
 *   teardown should call it to purge test data.
 *
 * Currently this is intentionally minimal — Firestore test data is left in
 * place because each test creates uniquely-named records that don't conflict.
 * For production CI, add a cleanup API or Firebase Admin batch delete.
 */
async function globalTeardown() {
  console.log("[global-teardown] Cleanup complete");
}

export default globalTeardown;
