function inferType(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";

  if (Array.isArray(value)) {
    return value.length === 0 ? "unknown[]" : `${inferType(value[0])}[]`;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const fields: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      fields.push(`${key}: ${inferType(val)}`);
    }
    return `{ ${fields.join("; ")} }`;
  }

  return "unknown";
}

export async function inferSchema(examples: unknown[]): Promise<string> {

  if (examples.length === 0) return "unknown";
  return inferType(examples[0]);

  // for now using first example only 
  // multi example merging to detect optional fields for later  
}
