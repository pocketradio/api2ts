import * as cheerio from "cheerio";

export type Param = {
  name: string;
  in: "query" | "path" | "header" | "body";
  required: boolean;
  type: string;
};

export type Endpoint = {
  method: string;
  path: string;
  description: string;
  params: Param[];
};

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
const METHOD_PATH_RE = new RegExp(`\\b(${METHODS.join("|")})\\s+(/[\\w/{}.:_~%-]*)`, "gi");

function extractPathParams(path: string): Param[] {
  return [...path.matchAll(/\{(\w+)\}/g)].map((m) => ({
    name: m[1], //  m[0] is the full match including braces "{id}". m[1] is the captured word inside it, "id". without braces
    in: "path",
    required: true,
    type: "string",
  }));
}


// this fn adds all endpoints to the accumulator map
// deduplication to ensure each endpt appears only once. hence the key 
function upsert(acc: Map<string, Endpoint>, method: string, path: string, description: string) {
  const key = `${method.toUpperCase()} ${path}`;
  if (!acc.has(key)) {
    acc.set(key, {
      method: method.toUpperCase(),
      path,
      description: description.trim(),
      params: extractPathParams(path),
    });
  }
}

export async function parseDocs(html: string): Promise<Endpoint[]> {


  // follows a priority order : codeblock > headings > tables > entire text
  // so if it wins in an earlier one, upsert sets it in the map. ( so next ones in order will be ignored implicitly )

  const $ = cheerio.load(html);
  $("script, style, nav, footer").remove();

  const acc = new Map<string, Endpoint>();


  // codeblocks ( paras )
  $("code, pre").each((_, el) => {
    for (const m of $(el).text().matchAll(METHOD_PATH_RE)) {
      const desc = $(el).closest("section, div, li").find("p").first().text();
      upsert(acc, m[1], m[2], desc);
    }
  });

  //headings
  $("h1, h2, h3, h4").each((_, el) => {
    for (const m of $(el).text().matchAll(METHOD_PATH_RE)) {
      const desc = $(el).next("p").text() || $(el).next().text();
      upsert(acc, m[1], m[2], desc);
    }
  });


  //tables
  $("table").each((_, table) => {
    const headers = $(table)
      .find("th")
      .map((_, th) => $(th).text().toLowerCase().trim())
      .get();
    const methodCol = headers.findIndex((h) => h.includes("method"));
    const pathCol = headers.findIndex(
      (h) => h.includes("path") || h.includes("endpoint") || h.includes("url")
    );
    const descCol = headers.findIndex((h) => h.includes("desc"));
    if (methodCol === -1 || pathCol === -1) return;

    $(table)
      .find("tr")
      .each((_, row) => {
        const cells = $(row)
          .find("td")
          .map((_, td) => $(td).text().trim())
          .get();
        if (!cells.length) return;
        const method = cells[methodCol]?.toUpperCase();
        const path = cells[pathCol];
        if (!method || !METHODS.includes(method) || !path?.startsWith("/")) return;
        upsert(acc, method, path, descCol >= 0 ? (cells[descCol] ?? "") : "");
      });
  });


  for (const m of $.root().text().matchAll(METHOD_PATH_RE)) {
    upsert(acc, m[1], m[2], "");
  }

  return [...acc.values()];
}
