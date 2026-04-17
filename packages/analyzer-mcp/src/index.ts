import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { parseDocs } from "./tools/parse-docs.js";
import { inferSchema } from "./tools/infer-schema.js";
import { detectAuth } from "./tools/detect-auth.js";
import { testEndpoint } from "./tools/test-endpoint.js";

const server = new McpServer({ name: "analyzer-mcp", version: "0.1.0" });

server.registerTool("parse_docs",
  {
    description: "Parse raw HTML from an API docs page and extract a structured list of endpoints.",
    inputSchema: { html: z.string() }
  },
  async ({ html }) => ({
    content: [{ type: "text", text: JSON.stringify(await parseDocs(html)) }],
  }));

server.registerTool("infer_schema",
  {
    description: "Infer a TypeScript type string from one or more JSON response examples.",
    inputSchema: { examples: z.array(z.unknown()) }
  },
  async ({ examples }) => ({
    content: [{ type: "text", text: await inferSchema(examples) }],
  }));

server.registerTool("detect_auth",
  {
    description: "Detect the authentication pattern from HTTP response headers.",
    inputSchema: { headers: z.record(z.string()) }
  },
  async ({ headers }) => ({
    content: [{ type: "text", text: JSON.stringify(await detectAuth(headers)) }],
  }));

server.registerTool("test_endpoint",
  {
    description: "Send a real HTTP request to verify an endpoint is live and see its response.",
    inputSchema: {
      method: z.string(),
      url: z.string(),
      headers: z.record(z.string()).optional(),
      body: z.unknown().optional(),
    }
  },
  async ({ method, url, headers, body }) => ({
    content: [
      { type: "text", text: JSON.stringify(await testEndpoint(method, url, headers ?? {}, body)) }
    ],
  }));

const transport = new StdioServerTransport();
await server.connect(transport);
