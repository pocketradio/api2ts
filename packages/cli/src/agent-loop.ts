import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import Anthropic from "@anthropic-ai/sdk";
import type { Tool, MessageParam, ToolResultBlockParam } from "@anthropic-ai/sdk/resources/messages";
import type { McpClientManager } from "./mcp-client.js";

export type AgentOptions = {
  url: string;
};

const client = new AnthropicBedrock() as unknown as Anthropic; // forces a typecast.

export async function runAgent(options: AgentOptions, mcp: McpClientManager): Promise<void> {
  
  // both of these will be an array of Tools
  const fetcherTools = await mcp.listTools("fetcher") 
  const analyzerTools = await mcp.listTools("analyzer")
  
  const allTools = [...fetcherTools, ...analyzerTools]
  const toolToServer = new Map<string, string>();

  fetcherTools.forEach((t) => { // each t is a Tool
    toolToServer.set(t.name, "fetcher")
  })

  analyzerTools.forEach((t) => {
    toolToServer.set(t.name, "analyzer")
  })

  const messages: MessageParam[] = [
    {
      role : "user",
      content: `Reverse engineer the API documented at ${options.url}. Crawl the docs, discover all endpoints, infer request/response schemas, detect auth patterns, and generate a typed TypeScript client.`,
    }
  ]

  while(true){
    const response = await client.messages.create({
      model: "us.anthropic.claude-sonnet-4-20250514-v1:0",
      max_tokens: 4096,
      system: "You are api2ts, a tool that reverse engineers APIs. Use the available tools to crawl documentation, extract endpoints, and generate typed TypeScript clients.",
      tools: allTools,
      messages,
    });
    
    messages.push({
      role : "assistant",
      content : response.content
    })

    if (response.stop_reason === "end_turn"){
      for ( const block of response.content ){
        if (block.type === "text"){
          console.log(block.text);
        }
      }
      break;
    }


    // if not end , then execute each tool call and collect res
    const toolResults: ToolResultBlockParam[] = [];

    for (const block of response.content){
      if (block.type === "tool_use" ){
        
        const server = toolToServer.get(block.name) // find which mcp server owns it
        if (!server) throw new Error(`Unknown tool: ${block.name}`);
        console.log(`→ calling ${block.name} on ${server}`);

        const res = await mcp.callTool(server, block.name, block.input as Record<string, unknown>) as { content : {type : string, text : string}[]}
        // record <string,unk> because calltool's args parameter expects that as the type. so casting is necessary otherwise it'll assume it as unknown

        toolResults.push({
          type : "tool_result",
          tool_use_id : block.id,
          // content : JSON.stringify(res) // calltool returns unknown. content field on TRBP expects string. 
          content : res.content.map((c) => c.text).join("\n") // remove extra wrapper to save tokens
        })
      }
    

    }
    //send resutls back to llm:
    messages.push({
      role : "user",
      content : toolResults
    })
  }

}
