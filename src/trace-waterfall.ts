type TraceNode = {
  kind: "transaction" | "span";
  id: string;
  parentId?: string;
  service: string;
  name: string;
  type?: string;
  subtype?: string;
  resource?: string;
  durationUs: number;
  timestampUs: number;
  children: TraceNode[];
  selfUs: number;
};

function parseDoc(doc: any): TraceNode | null {
  const evt = doc?.processor?.event;
  if (evt === "transaction") {
    const id = doc.transaction?.id;
    if (!id) return null;
    return {
      kind: "transaction",
      id,
      parentId: doc.parent?.id,
      service: doc.service?.name ?? "",
      name: doc.transaction?.name ?? "",
      type: doc.transaction?.type,
      durationUs: doc.transaction?.duration?.us ?? 0,
      timestampUs: doc.timestamp?.us ?? 0,
      children: [],
      selfUs: 0,
    };
  }
  if (evt === "span") {
    const id = doc.span?.id;
    if (!id) return null;
    return {
      kind: "span",
      id,
      parentId: doc.parent?.id,
      service: doc.service?.name ?? "",
      name: doc.span?.name ?? "",
      type: doc.span?.type,
      subtype: doc.span?.subtype,
      resource: doc.span?.destination?.service?.resource,
      durationUs: doc.span?.duration?.us ?? 0,
      timestampUs: doc.timestamp?.us ?? 0,
      children: [],
      selfUs: 0,
    };
  }
  return null;
}

function toMs(us: number) {
  return Math.round(us / 1000);
}

function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function renderNode(n: TraceNode, rootUs: number): any {
  const out: any = {
    kind: n.kind,
    service: n.service,
    name: n.name,
    duration_ms: toMs(n.durationUs),
    self_ms: toMs(n.selfUs),
    pctOfRoot: pct(n.durationUs, rootUs),
  };
  if (n.type) out.type = n.type;
  if (n.subtype) out.subtype = n.subtype;
  if (n.resource) out.resource = n.resource;
  if (n.children.length) {
    out.children = n.children.map((c) => renderNode(c, rootUs));
  }
  return out;
}

function flatten(n: TraceNode, acc: TraceNode[] = []): TraceNode[] {
  acc.push(n);
  for (const c of n.children) flatten(c, acc);
  return acc;
}

export function summarizeTrace(raw: any) {
  const docs: any[] = raw?.traceItems?.traceDocs ?? [];
  const errorDocs: any[] = raw?.traceItems?.errorDocs ?? [];

  const nodes = new Map<string, TraceNode>();
  for (const doc of docs) {
    const n = parseDoc(doc);
    if (n) nodes.set(n.id, n);
  }

  const roots: TraceNode[] = [];
  for (const n of nodes.values()) {
    if (n.parentId && nodes.has(n.parentId)) {
      nodes.get(n.parentId)!.children.push(n);
    } else {
      roots.push(n);
    }
  }

  const finalize = (n: TraceNode) => {
    n.children.sort((a, b) => b.durationUs - a.durationUs);
    n.children.forEach(finalize);
    const childSum = n.children.reduce((s, c) => s + c.durationUs, 0);
    n.selfUs = Math.max(0, n.durationUs - childSum);
  };
  roots.forEach(finalize);
  roots.sort((a, b) => b.durationUs - a.durationUs);

  const rootUs = roots[0]?.durationUs ?? 0;
  const allNodes = roots.flatMap((r) => flatten(r));

  const topBottlenecks = [...allNodes]
    .sort((a, b) => b.selfUs - a.selfUs)
    .slice(0, 5)
    .map((n) => ({
      kind: n.kind,
      service: n.service,
      name: n.name,
      type: n.type,
      subtype: n.subtype,
      resource: n.resource,
      self_ms: toMs(n.selfUs),
      duration_ms: toMs(n.durationUs),
      pctOfRoot: pct(n.durationUs, rootUs),
    }));

  const entry = raw?.entryTransaction;

  return {
    summary: {
      rootDuration_ms: toMs(rootUs),
      totalItems: raw?.traceItems?.traceDocsTotal ?? allNodes.length,
      errorCount: errorDocs.length,
      exceedsMax: raw?.traceItems?.exceedsMax ?? false,
      topBottlenecks,
    },
    waterfall: roots.map((r) => renderNode(r, rootUs)),
    entryTransaction: entry
      ? {
          service: entry.service?.name,
          name: entry.transaction?.name,
          duration_ms: toMs(entry.transaction?.duration?.us ?? 0),
          timestamp: entry["@timestamp"],
          url: entry.url?.full,
          http: entry.http,
        }
      : undefined,
  };
}
