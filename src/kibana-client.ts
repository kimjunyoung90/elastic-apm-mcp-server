export class KibanaClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(kibanaUrl: string, username: string, password: string) {
    this.baseUrl = kibanaUrl.replace(/\/$/, "");
    const credentials = Buffer.from(`${username}:${password}`).toString("base64");
    this.headers = {
      Authorization: `Basic ${credentials}`,
      "kbn-xsrf": "true",
      "x-elastic-internal-origin": "kibana",
      "Content-Type": "application/json",
    };
  }

  async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const res = await fetch(url.toString(), { headers: this.headers });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Kibana API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  async getServices(start: string, end: string, environment?: string) {
    return this.request<any>("/internal/apm/services", {
      start,
      end,
      environment: environment ?? "ENVIRONMENT_ALL",
      probability: "1",
      documentType: "transactionMetric",
      rollupInterval: "60m",
      kuery: "",
      useDurationSummary: "true",
    });
  }

  async getServiceOverview(serviceName: string, start: string, end: string, environment?: string) {
    const env = environment ?? "ENVIRONMENT_ALL";
    const base = `/internal/apm/services/${encodeURIComponent(serviceName)}`;
    const common = {
      start,
      end,
      environment: env,
      probability: "1",
      documentType: "transactionMetric",
      rollupInterval: "60m",
      kuery: "",
    };

    const [transactions, errors] = await Promise.all([
      this.request<any>(`${base}/transactions/groups/main_statistics`, {
        ...common,
        transactionType: "request",
        latencyAggregationType: "avg",
        useDurationSummary: "true",
      }),
      this.request<any>(`${base}/errors/groups/main_statistics`, {
        start,
        end,
        environment: env,
        kuery: "",
      }),
    ]);

    return { transactions, errors };
  }

  async getErrors(serviceName: string, start: string, end: string, environment?: string) {
    return this.request<any>(
      `/internal/apm/services/${encodeURIComponent(serviceName)}/errors/groups/main_statistics`,
      {
        start,
        end,
        environment: environment ?? "ENVIRONMENT_ALL",
        kuery: "",
      }
    );
  }

  async getTransactions(
    serviceName: string,
    start: string,
    end: string,
    transactionType: string = "request",
    environment?: string
  ) {
    return this.request<any>(
      `/internal/apm/services/${encodeURIComponent(serviceName)}/transactions/groups/main_statistics`,
      {
        start,
        end,
        transactionType,
        environment: environment ?? "ENVIRONMENT_ALL",
        latencyAggregationType: "avg",
        documentType: "transactionMetric",
        rollupInterval: "60m",
        kuery: "",
        useDurationSummary: "true",
      }
    );
  }
}
