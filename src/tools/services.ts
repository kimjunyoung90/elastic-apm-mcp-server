import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { KibanaClient } from "../kibana-client.ts";

export function registerServiceTools(server: McpServer, client: KibanaClient) {
  server.tool(
    "list_services",
    "APM에 등록된 서비스 목록을 조회합니다",
    {
      start: z.string().describe("조회 시작 시간 (ISO 8601, e.g. 2026-04-01T00:00:00Z)"),
      end: z.string().describe("조회 종료 시간 (ISO 8601)"),
      environment: z.string().optional().describe("환경 필터 (e.g. production, staging)"),
    },
    async ({ start, end, environment }) => {
      const data = await client.getServices(start, end, environment);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "get_service_overview",
    "특정 서비스의 트랜잭션 성능과 에러 요약을 조회합니다",
    {
      serviceName: z.string().describe("서비스 이름"),
      start: z.string().describe("조회 시작 시간 (ISO 8601)"),
      end: z.string().describe("조회 종료 시간 (ISO 8601)"),
      environment: z.string().optional().describe("환경 필터"),
    },
    async ({ serviceName, start, end, environment }) => {
      const data = await client.getServiceOverview(serviceName, start, end, environment);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );
}
