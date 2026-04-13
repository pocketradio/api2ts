#!/usr/bin/env node

// to directly run as a CLI cmd without typing node first ^^

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { runAgent } from "./agent-loop.js";
import { McpClientManager } from "./mcp-client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// import.meta.url -> gives full file path -> strip the filename with FUTP -> dir
// all this because esm doesnt have __dirname builtin. so recreate.

const { positionals } = parseArgs({
  args: process.argv.slice(2), // slice drops first 2 args. 
  options: {},
  allowPositionals: true,
});


/*
eg. process.argv ( this comes from cmdline ) -> ["node", "xyz.js", "https://...."]
then slice(2) drops first two , leaving just user input ( the url they type )

*/

const url = positionals[0];

if (!url) {
  console.error("Usage: api2ts <url>");
  process.exit(1);
}

const mcp = new McpClientManager();


// spawn both servers as child processes
await mcp.connect([
  {
    name: "fetcher",
    command: "node",
    args: [resolve(__dirname, "../../fetcher-mcp/dist/index.js")],
  },
  {
    name: "analyzer",
    command: "node",
    args: [resolve(__dirname, "../../analyzer-mcp/dist/index.js")],
  },
]);


try {
  await runAgent({ url }, mcp);
} 

finally { // kills child processes if agent crashes 
  await mcp.disconnect();
}
