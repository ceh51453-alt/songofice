/**
 * Backwards-compatible entry point.
 *
 * Geography is world-scoped now; existing Westeros imports keep working while
 * new systems should prefer `content/world/geography`.
 */
export * from "../world/geography";
