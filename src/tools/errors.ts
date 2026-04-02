import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { KibanaClient } from "../kibana-client.js";

export function registerErrorTools(server: McpServer, client: KibanaClient) {
  server.tool(
    "get_errors",
    "특정 서비스의 에러 그룹을 조회합니다",
    {
      serviceName: z.string().describe("서비스 이름"),
      start: z.string().describe("조회 시작 시간 (ISO 8601)"),
      end: z.string().describe("조회 종료 시간 (ISO 8601)"),
      environment: z.string().optional().describe("환경 필터"),
    },
    async ({ serviceName, start, end, environment }) => {
      const data = await client.getErrors(serviceName, start, end, environment);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );
}
