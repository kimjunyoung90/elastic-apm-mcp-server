# elastic-apm-mcp-server

Kibana API를 통해 APM 데이터(서비스 목록, 트랜잭션 성능, 에러, 런타임 메트릭)를 조회하는 MCP 서버입니다.

## 요구사항

- Node.js 18 이상
- Kibana 8.x (Kibana 내부 엔드포인트를 사용하므로 버전에 따라 동작이 달라질 수 있습니다)

## 설정

Claude Desktop 또는 Claude Code 설정에 다음을 추가합니다. 별도 설치 없이 `npx`로 바로 실행됩니다.

### Claude Code

CLI로 바로 추가:

```bash
claude mcp add elastic-apm \
  -e KIBANA_URL=http://your-kibana-host:5601 \
  -e KIBANA_USERNAME=your-username \
  -e KIBANA_PASSWORD=your-password \
  -- npx -y elastic-apm-mcp-server
```

또는 `~/.claude/settings.json`에 직접 추가:

```json
{
  "mcpServers": {
    "elastic-apm": {
      "command": "npx",
      "args": ["-y", "elastic-apm-mcp-server"],
      "env": {
        "KIBANA_URL": "http://your-kibana-host:5601",
        "KIBANA_USERNAME": "your-username",
        "KIBANA_PASSWORD": "your-password"
      }
    }
  }
}
```

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) 에 동일한 형식으로 추가합니다.

### 환경변수

| 환경변수 | 필수 | 설명 |
|----------|------|------|
| `KIBANA_URL` | O | Kibana 접속 URL |
| `KIBANA_USERNAME` | O | Kibana 사용자 이름 |
| `KIBANA_PASSWORD` | O | Kibana 비밀번호 |

## 제공 도구

| 도구 | 설명 |
|------|------|
| `list_services` | APM에 등록된 서비스 목록 조회 |
| `get_service_overview` | 특정 서비스의 트랜잭션 성능과 에러 요약 조회 |
| `get_transactions` | 특정 서비스의 트랜잭션 성능 통계 조회 |
| `get_errors` | 특정 서비스의 에러 그룹 조회 |
| `get_service_metrics` | 특정 서비스의 CPU/메모리 등 런타임 메트릭 조회 (agent 종류별 상이) |
| `get_transaction_samples` | 특정 트랜잭션의 샘플 트레이스(traceId) 조회, 느린 트랜잭션 필터링 가능 |
| `get_trace` | trace ID로 트랜잭션 전체 span(워터폴)을 조회하여 병목 구간 파악 |

## 사용 예시

MCP 설정 후 Claude에게 자연어로 요청하면 됩니다.

- "APM 서비스 목록 보여줘"
- "auth-service의 최근 1시간 에러 조회해줘"
- "payment-service 트랜잭션 성능 확인해줘"
- "payment-service에서 제일 느린 요청 하나 까서 어디서 시간 쓰는지 보여줘"

## License

ISC
