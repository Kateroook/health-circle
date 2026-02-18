export function cleanObj(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => {
      if (v === undefined || v === null) return false; // undefined / null
      if (typeof v === "string" && v.trim() === "") return false; // empty string
      if (Array.isArray(v) && v.length === 0) return false; // empty array
      if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) return false;
      return true;
    }),
  );
}
