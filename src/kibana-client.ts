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

  async getServiceOverview(
    serviceName: string,
    start: string,
    end: string,
    environment?: string,
    latencyAggregationType: string = "avg"
  ) {
    const env = environment ?? "ENVIRONMENT_ALL";
    const base = `/internal/apm/services/${encodeURIComponent(serviceName)}`;
    const isAvg = latencyAggregationType === "avg";
    const txParams: Record<string, string> = {
      start,
      end,
      environment: env,
      transactionType: "request",
      latencyAggregationType,
      kuery: "",
      documentType: isAvg ? "transactionMetric" : "transactionEvent",
      rollupInterval: "60m",
    };
    if (isAvg) {
      txParams.useDurationSummary = "true";
    }

    const [transactions, errors] = await Promise.all([
      this.request<any>(`${base}/transactions/groups/main_statistics`, txParams),
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

  async getServiceMetrics(
    serviceName: string,
    agentName: string,
    start: string,
    end: string,
    environment?: string,
    serviceRuntimeName?: string
  ) {
    const params: Record<string, string> = {
      start,
      end,
      agentName,
      environment: environment ?? "ENVIRONMENT_ALL",
      kuery: "",
    };
    if (serviceRuntimeName) {
      params.serviceRuntimeName = serviceRuntimeName;
    }
    return this.request<any>(
      `/internal/apm/services/${encodeURIComponent(serviceName)}/metrics/charts`,
      params
    );
  }

  async getTransactions(
    serviceName: string,
    start: string,
    end: string,
    transactionType: string = "request",
    environment?: string,
    latencyAggregationType: string = "avg"
  ) {
    const isAvg = latencyAggregationType === "avg";
    const params: Record<string, string> = {
      start,
      end,
      transactionType,
      environment: environment ?? "ENVIRONMENT_ALL",
      latencyAggregationType,
      documentType: isAvg ? "transactionMetric" : "transactionEvent",
      rollupInterval: "60m",
      kuery: "",
    };
    if (isAvg) {
      params.useDurationSummary = "true";
    }
    return this.request<any>(
      `/internal/apm/services/${encodeURIComponent(serviceName)}/transactions/groups/main_statistics`,
      params
    );
  }

  async getTransactionSamples(
    serviceName: string,
    transactionName: string,
    start: string,
    end: string,
    transactionType: string = "request",
    environment?: string,
    sampleRangeFrom?: string,
    sampleRangeTo?: string
  ) {
    const params: Record<string, string> = {
      start,
      end,
      transactionType,
      transactionName,
      environment: environment ?? "ENVIRONMENT_ALL",
      kuery: "",
    };
    if (sampleRangeFrom) {
      params.sampleRangeFrom = sampleRangeFrom;
    }
    if (sampleRangeTo) {
      params.sampleRangeTo = sampleRangeTo;
    }
    return this.request<any>(
      `/internal/apm/services/${encodeURIComponent(serviceName)}/transactions/traces/samples`,
      params
    );
  }

  async getTrace(traceId: string, start: string, end: string, entryTransactionId?: string) {
    const params: Record<string, string> = { start, end };
    if (entryTransactionId) {
      params.entryTransactionId = entryTransactionId;
    }
    return this.request<any>(`/internal/apm/traces/${encodeURIComponent(traceId)}`, params);
  }
}
