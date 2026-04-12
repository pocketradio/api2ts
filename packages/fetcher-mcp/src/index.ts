import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fetchPage } from "./tools/fetch-page.js";
import { followLinks } from "./tools/follow-links.js";

const server = new McpServer({ name: "fetcher-mcp", version: "0.1.0" });

server.registerTool("fetch_page", { inputSchema: { url: z.string() } }, async ({ url }) => ({
  content: [{ type: "text", text: await fetchPage(url) }],
}));

server.registerTool(
  "follow_links",
  { inputSchema: { url: z.string(), selector: z.string().optional() } },
  async ({ url, selector }) => ({
    content: [{ type: "text", text: JSON.stringify(await followLinks(url, selector)) }],
  })
);


// wire server to stdin/out
const transport = new StdioServerTransport();
await server.connect(transport);