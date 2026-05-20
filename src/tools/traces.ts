import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { KibanaClient } from "../kibana-client.js";
import { summarizeTrace } from "../trace-waterfall.js";

export function registerTraceTools(server: McpServer, client: KibanaClient) {
  server.tool(
    "get_transaction_samples",
    "Span 상세 조회 / 느린 요청 분석의 1단계 — 특정 트랜잭션의 실제 샘플 trace(traceId/transactionId)를 찾습니다. sampleRangeFrom/To(마이크로초)로 latency 범위를 좁혀 느린 요청만 골라낼 수 있고, 얻은 traceId를 get_trace에 넘겨 span 단위 병목을 분석합니다",
    {
      serviceName: z.string().describe("서비스 이름"),
      transactionName: z
        .string()
        .describe("트랜잭션 이름 (get_transactions/get_service_overview의 결과 key)"),
      start: z.string().describe("조회 시작 시간 (ISO 8601)"),
      end: z.string().describe("조회 종료 시간 (ISO 8601)"),
      transactionType: z
        .string()
        .default("request")
        .describe("트랜잭션 타입 (e.g. request, messaging)"),
      environment: z.string().optional().describe("환경 필터"),
      sampleRangeFrom: z
        .string()
        .optional()
        .describe("샘플 latency 하한 (마이크로초). 느린 트랜잭션만 보려면 지정"),
      sampleRangeTo: z
        .string()
        .optional()
        .describe("샘플 latency 상한 (마이크로초)"),
    },
    async ({
      serviceName,
      transactionName,
      start,
      end,
      transactionType,
      environment,
      sampleRangeFrom,
      sampleRangeTo,
    }) => {
      const data = await client.getTransactionSamples(
        serviceName,
        transactionName,
        start,
        end,
        transactionType,
        environment,
        sampleRangeFrom,
        sampleRangeTo
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.tool(
    "get_trace",
    "Span 상세 조회 / 트랜잭션 병목 분석 — 한 trace의 내부 span 워터폴을 조회합니다. \"느린 요청에서 어디가 병목인지\", \"DB 쿼리/외부 호출/내부 처리 중 어느 구간이 시간을 썼는지\" 분석할 때 사용합니다. 응답은 parent-child 트리(자식은 duration 내림차순) + self time 기준 상위 5개 병목(topBottlenecks)으로 자동 가공되어 반환됩니다. traceId는 get_transaction_samples로 얻으세요",
    {
      traceId: z.string().describe("트레이스 ID"),
      start: z.string().describe("조회 시작 시간 (ISO 8601)"),
      end: z.string().describe("조회 종료 시간 (ISO 8601)"),
      entryTransactionId: z
        .string()
        .optional()
        .describe("진입 트랜잭션 ID (Kibana 버전에 따라 필요, get_transaction_samples 결과의 transactionId)"),
    },
    async ({ traceId, start, end, entryTransactionId }) => {
      const data = await client.getTrace(traceId, start, end, entryTransactionId);
      const summary = summarizeTrace(data);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
      };
    }
  );
}
