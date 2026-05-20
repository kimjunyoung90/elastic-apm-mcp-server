#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { KibanaClient } from "./kibana-client.js";
import { registerServiceTools } from "./tools/services.js";
import { registerErrorTools } from "./tools/errors.js";
import { registerTransactionTools } from "./tools/transactions.js";
import { registerMetricTools } from "./tools/metrics.js";
import { registerTraceTools } from "./tools/traces.js";

const kibanaUrl = process.env.KIBANA_URL;
const username = process.env.KIBANA_USERNAME;
const password = process.env.KIBANA_PASSWORD;

if (!kibanaUrl || !username || !password) {
  console.error("KIBANA_URL, KIBANA_USERNAME, KIBANA_PASSWORD environment variables are required");
  process.exit(1);
}

const client = new KibanaClient(kibanaUrl, username, password);

const server = new McpServer(
  {
    name: "elastic-apm-mcp-server",
    version: "1.0.0",
  },
  {
    instructions: `Elastic APM 데이터를 Kibana 내부 API로 조회하는 MCP 서버입니다. 모든 도구의 시간 범위는 ISO 8601 (start, end).

용도별 도구:
- 서비스 목록: list_services
- 서비스 한 줄 요약(트랜잭션 + 에러): get_service_overview
- 트랜잭션 성능 (avg / p95 / p99): get_transactions
- 에러 그룹: get_errors
- 런타임 메트릭 (CPU/메모리, agent 종류별 응답 상이): get_service_metrics

Span 상세 조회 / 느린 요청 병목 분석 (2단계 워크플로우):
1) get_transaction_samples — 특정 트랜잭션의 샘플 traceId 찾기. sampleRangeFrom/To(μs)로 느린 요청만 골라낼 수 있음.
2) get_trace — 그 traceId의 span 워터폴 조회. 응답은 parent-child 트리 + self time 상위 5개 병목(topBottlenecks)으로 자동 가공되어, DB·외부 호출·내부 처리 중 어디가 병목인지 즉시 파악 가능.`,
  }
);

registerServiceTools(server, client);
registerErrorTools(server, client);
registerTransactionTools(server, client);
registerMetricTools(server, client);
registerTraceTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
