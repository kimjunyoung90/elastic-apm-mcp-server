import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { KibanaClient } from "../kibana-client.ts";

export function registerTransactionTools(server: McpServer, client: KibanaClient) {
  server.tool(
    "get_transactions",
    "특정 서비스의 트랜잭션 성능 통계를 조회합니다",
    {
      serviceName: z.string().describe("서비스 이름"),
      start: z.string().describe("조회 시작 시간 (ISO 8601)"),
      end: z.string().describe("조회 종료 시간 (ISO 8601)"),
      transactionType: z
        .string()
        .default("request")
        .describe("트랜잭션 타입 (e.g. request, messaging)"),
      environment: z.string().optional().describe("환경 필터"),
    },
    async ({ serviceName, start, end, transactionType, environment }) => {
      const data = await client.getTransactions(
        serviceName,
        start,
        end,
        transactionType,
        environment
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );
}
