function slugify(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function memberIdFromName(name: string) {
  return `member-${slugify(name)}`;
}

function teamIdFromName(name: string) {
  return `team-${slugify(name)}`;
}

function uniqueDirectoryId(
  prefix: "member" | "team",
  name: string,
  existingIds: string[],
) {
  const baseId = `${prefix}-${slugify(name) || "new"}`;
  let id = baseId;
  let suffix = 2;
  while (existingIds.includes(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return id;
}

export { memberIdFromName, teamIdFromName, uniqueDirectoryId };
