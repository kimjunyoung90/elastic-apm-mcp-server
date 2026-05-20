import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { KibanaClient } from "../kibana-client.js";

export function registerMetricTools(server: McpServer, client: KibanaClient) {
  server.tool(
    "get_service_metrics",
    "특정 서비스의 CPU/메모리 등 런타임 메트릭 차트를 조회합니다 (agent 종류에 따라 반환 메트릭이 달라짐: JVM은 heap/non-heap/GC/thread, Node.js는 RSS/heap/CPU 등)",
    {
      serviceName: z.string().describe("서비스 이름"),
      agentName: z
        .string()
        .describe("APM agent 종류 (e.g. java, nodejs, go, python, dotnet, ruby)"),
      start: z.string().describe("조회 시작 시간 (ISO 8601)"),
      end: z.string().describe("조회 종료 시간 (ISO 8601)"),
      environment: z.string().optional().describe("환경 필터"),
      serviceRuntimeName: z
        .string()
        .optional()
        .describe("서비스 런타임 이름 (Kibana 버전에 따라 필요, e.g. OpenJDK)"),
    },
    async ({ serviceName, agentName, start, end, environment, serviceRuntimeName }) => {
      const data = await client.getServiceMetrics(
        serviceName,
        agentName,
        start,
        end,
        environment,
        serviceRuntimeName
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );
}
