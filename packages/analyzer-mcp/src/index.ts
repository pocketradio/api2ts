import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { parseDocs } from "./tools/parse-docs.js";

const server = new McpServer({ name: "analyzer-mcp", version: "0.1.0" });

server.registerTool("parse_docs", 
  {
    description: "Parse raw HTML from an API docs page and extract a structured list of endpoints.",
    inputSchema: { html: z.string() } 
  }, 
  
  async ({ html }) => ({
    content: [{ type: "text", text: JSON.stringify(await parseDocs(html)) }],
  }));

const transport = new StdioServerTransport();
await server.connect(transport);
