import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export type ServerConfig = {
  name: string; // like fetcher or analzyer
  command: string;
  args: string[]; // cli args passed after the cmd. like ["xyz/index.js"]
};

export class McpClientManager {

  private clients = new Map<string, Client>(); // key : servername , val : client instance

  async connect(configs: ServerConfig[]): Promise<void> {
    for (const config of configs) {
      const transport = new StdioClientTransport({ command: config.command, args: config.args });
      const client = new Client({ name: "api2ts", version: "0.1.0" });
      await client.connect(transport);
      this.clients.set(config.name, client);
    }
  }

  async callTool(serverName: string, toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const client = this.clients.get(serverName);
    if (!client) throw new Error(`no MCP client registered for server: ${serverName}`);
    const result = await client.callTool({ name: toolName, arguments: args });
    return result;
  }

  async listTools(serverName: string): Promise<string[]> {
    const client = this.clients.get(serverName);
    if (!client) throw new Error(`no MCP client registered for server: ${serverName}`);
    const result = await client.listTools();
    return result.tools.map((t) => t.name);
  }

  async disconnect(): Promise<void> {
    for (const client of this.clients.values()) {
      await client.close();
    }
    this.clients.clear();
  }

}