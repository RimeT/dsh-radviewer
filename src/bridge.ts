import { studiesFromListing, joinPath, type DirEntry } from './study.ts';
import { classifyMedicalPath, normalizeMedicalPath, sessionFileAddress } from '../medview-path.js';

interface Listed {
  path: string;
  entries: readonly DirEntry[];
}

interface ListResult {
  ok: boolean;
  value?: Listed;
}

export interface MedicalBridge {
  sidebarRight: {
    mounted: {
      getSnapshot(): string | undefined;
      subscribe(listener: () => void): () => void;
    };
    openResourceIn(sessionId: string, address: string, options?: { kind?: string }): void;
    openTabIn(sessionId: string, kind: string): void;
  };
  sessions: {
    retain(sessionId: string, options: { source: string }): {
      release(): void;
      binding: {
        eventSource: {
          getSnapshot(): { change: { kind: string; entries?: readonly EventEntry[] } };
          subscribe(listener: () => void): () => void;
        };
      };
    };
  };
  remote: {
    workspaceFiles: {
      list(sessionId: string, path: string, signal: AbortSignal): Promise<ListResult>;
    };
  };
}

interface OpenMeta {
  medview?: string;
  path?: string;
  supported?: boolean;
}

interface EventEntry {
  type: string;
  event?: {
    type?: string;
    seq?: number;
    data?: {
      meta?: OpenMeta;
      message?: { toolCallId?: string; isError?: boolean };
      commandId?: string;
      name?: string;
      args?: string;
      kind?: string;
      subCallId?: string;
      isError?: boolean;
    };
  };
}

export function watchMedicalOpens(ctx: MedicalBridge): () => void {
  const seen = new Set<string>();
  const commands = new Map<string, string>();
  let currentId: string | undefined;
  let release = () => {};
  let stopEvents = () => {};
  let openAbort = new AbortController();

  const follow = () => {
    const sessionId = ctx.sidebarRight.mounted.getSnapshot();
    if (sessionId === currentId) return;
    currentId = sessionId;
    stopEvents();
    release();
    stopEvents = () => {};
    release = () => {};
    if (!sessionId) return;
    let reference: ReturnType<MedicalBridge['sessions']['retain']>;
    try {
      reference = ctx.sessions.retain(sessionId, { source: 'medview' });
    } catch {
      return;
    }
    release = () => reference.release();
    const source = reference.binding.eventSource;
    stopEvents = source.subscribe(() => {
      const change = source.getSnapshot().change;
      if (change.kind !== 'append' || !change.entries) return;
      for (const entry of change.entries) handle(sessionId, entry);
    });
  };

  function handle(sessionId: string, entry: EventEntry) {
    if (entry.type !== 'event' || !entry.event) return;
    const event = entry.event;
    const data = event.data;
    if (!data) return;
    if (event.type === 'tool/result') {
      acceptOpen(sessionId, data.message?.toolCallId ?? `tool:${event.seq}`, data.meta, data.message?.isError === true);
      return;
    }
    if (event.type === 'tool/ptc-dispatch' && data.name === 'medview_open') {
      acceptOpen(sessionId, data.subCallId ?? `ptc:${event.seq}`, data.meta, data.isError === true);
      return;
    }
    if (event.type === 'command/run' && data.name === 'radviewer' && data.commandId) {
      commands.set(data.commandId, data.args ?? '');
      return;
    }
    if (event.type === 'command/done' && data.commandId && commands.has(data.commandId)) {
      const raw = commands.get(data.commandId) ?? '';
      commands.delete(data.commandId);
      if (data.kind !== 'success') return;
      const id = `cmd:${data.commandId}`;
      if (seen.has(id)) return;
      seen.add(id);
      const path = normalizeMedicalPath(raw);
      if (!path) {
        try { ctx.sidebarRight.openTabIn(sessionId, 'medview'); } catch { /* the column may not be mounted yet */ }
        return;
      }
      requestOpen(sessionId, path);
    }
  }

  function acceptOpen(sessionId: string, id: string, meta: OpenMeta | undefined, failed: boolean) {
    if (failed || !meta || meta.medview !== 'open' || meta.supported !== true) return;
    if (seen.has(id)) return;
    seen.add(id);
    requestOpen(sessionId, meta.path ?? '');
  }

  function requestOpen(sessionId: string, path: string) {
    openAbort.abort();
    openAbort = new AbortController();
    const signal = openAbort.signal;
    void openMedical(ctx, sessionId, path, signal);
  }

  const stopMounted = ctx.sidebarRight.mounted.subscribe(follow);
  follow();
  return () => {
    stopMounted();
    stopEvents();
    release();
    openAbort.abort();
  };
}

async function openMedical(ctx: MedicalBridge, sessionId: string, rawPath: string, signal: AbortSignal) {
  const path = normalizeMedicalPath(rawPath);
  const format = classifyMedicalPath(path);
  if (!path || format === 'unknown') return;
  let target = path;
  if (format === 'folder') {
    const found = await firstStudyFile(ctx, sessionId, path, signal);
    if (!found || signal.aborted) return;
    target = found;
  }
  if (signal.aborted) return;
  try {
    ctx.sidebarRight.openResourceIn(sessionId, sessionFileAddress(sessionId, target), { kind: 'medview-volume' });
  } catch {
    /* an address the tab cannot claim stays closed */
  }
}

async function firstStudyFile(ctx: MedicalBridge, sessionId: string, path: string, signal: AbortSignal): Promise<string | undefined> {
  const listed = await list(ctx, sessionId, path, signal);
  if (!listed) return undefined;
  const direct = studiesFromListing(listed.path || path, listed.entries)[0]?.imagePaths[0];
  if (direct) return direct;
  const subs = listed.entries.filter((entry) => entry.type === 'directory').slice(0, 12);
  for (const sub of subs) {
    if (signal.aborted) return undefined;
    const child = joinPath(listed.path || path, sub.name);
    const nested = await list(ctx, sessionId, child, signal);
    if (!nested) continue;
    const found = studiesFromListing(nested.path || child, nested.entries)[0]?.imagePaths[0];
    if (found) return found;
  }
  return undefined;
}

async function list(ctx: MedicalBridge, sessionId: string, path: string, signal: AbortSignal): Promise<Listed | undefined> {
  try {
    const result = await ctx.remote.workspaceFiles.list(sessionId, path, signal);
    if (!result.ok || !result.value) return undefined;
    return result.value;
  } catch {
    return undefined;
  }
}
