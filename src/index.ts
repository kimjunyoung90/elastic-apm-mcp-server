#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { KibanaClient } from "./kibana-client.js";
import { registerServiceTools } from "./tools/services.js";
import { registerErrorTools } from "./tools/errors.js";
import { registerTransactionTools } from "./tools/transactions.js";

const kibanaUrl = process.env.KIBANA_URL;
const username = process.env.KIBANA_USERNAME;
const password = process.env.KIBANA_PASSWORD;

if (!kibanaUrl || !username || !password) {
  console.error("KIBANA_URL, KIBANA_USERNAME, KIBANA_PASSWORD environment variables are required");
  process.exit(1);
}

const client = new KibanaClient(kibanaUrl, username, password);

const server = new McpServer({
  name: "elastic-apm-mcp-server",
  version: "1.0.0",
});

registerServiceTools(server, client);
registerErrorTools(server, client);
registerTransactionTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
