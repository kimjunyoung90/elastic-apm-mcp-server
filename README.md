# Elastic APM Monitor MCP Server

Kibana APM API를 통해 서비스 목록, 트랜잭션 성능, 에러를 조회하는 MCP 서버입니다.

## 제공 도구

| 도구 | 설명 |
|------|------|
| `list_services` | APM에 등록된 서비스 목록 조회 |
| `get_service_overview` | 특정 서비스의 트랜잭션 성능과 에러 요약 조회 |
| `get_transactions` | 특정 서비스의 트랜잭션 성능 통계 조회 |
| `get_errors` | 특정 서비스의 에러 그룹 조회 |

## 설치

```bash
git clone <repo-url>
cd elastic-apm-monitor
npm install
```

## 환경변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성합니다.

```bash
cp .env.example .env
```

```env
KIBANA_URL=http://your-kibana-host:5601
KIBANA_USERNAME=your-username
KIBANA_PASSWORD=your-password
```

## MCP 연결 설정

Claude Desktop 또는 Claude Code 설정에 다음을 추가합니다.

```json
{
  "mcpServers": {
    "elastic-apm": {
      "command": "npx",
      "args": ["tsx", "/path/to/elastic-apm-monitor/src/index.ts"],
      "env": {
        "KIBANA_URL": "http://your-kibana-host:5601",
        "KIBANA_USERNAME": "your-username",
        "KIBANA_PASSWORD": "your-password"
      }
    }
  }
}
```
