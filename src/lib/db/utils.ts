// Pure utility functions — safe to import in both server and client components.
// No Node.js APIs, no database access.

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function generateSlug(
  firstPersonName: string,
  secondPersonName?: string
): string {
  const names = secondPersonName
    ? `${firstPersonName}-${secondPersonName}`
    : firstPersonName;
  return names
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}
