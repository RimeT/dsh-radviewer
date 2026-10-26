import styles from './styles.css?raw';
import { messages } from './messages.ts';
import { baseName } from './study.ts';
import { parseSessionFile, Viewer } from './Viewer.tsx';

const PAGE_ID = '@local/dsh-medview';
const VOLUME_ID = '@local/dsh-medview/volume';

interface RemoteError {
  message?: string;
  code?: string;
}
interface RemoteResult<T> {
  ok: boolean;
  value?: T;
  error?: RemoteError;
}

interface WorkspaceFiles {
  list(sessionId: string, path: string, signal: AbortSignal): Promise<RemoteResult<{ path: string; entries: { name: string; type: 'file' | 'directory' | 'other' }[] }>>;
  readBytes(sessionId: string, path: string, options: Record<string, never>, signal: AbortSignal): Promise<RemoteResult<{ data: Uint8Array }>>;
}

interface PluginContext {
  effect(callback: () => void | (() => void)): void;
  locale: {
    register(ns: string, locale: string, dict: Record<string, string>): () => void;
    bind(ns: string): (key: string, params?: Record<string, string | number>) => string;
  };
  sidebarRightTabs: {
    register(definition: Record<string, unknown>): () => void;
  };
  slots: {
    inject(name: string, callback: () => void | (() => void)): void;
    register(definition: Record<string, unknown>, component: unknown): () => void;
  };
  remote: { workspaceFiles: WorkspaceFiles };
}

export const inject = ['slots', 'locale', 'sidebarRightTabs', 'remote', 'remote.workspaceFiles'];

function readers(ctx: PluginContext, sessionId: string) {
  return {
    listDir(path: string, signal: AbortSignal) {
      return ctx.remote.workspaceFiles.list(sessionId, path, signal);
    },
    readBytes(path: string, signal: AbortSignal) {
      return ctx.remote.workspaceFiles.readBytes(sessionId, path, {}, signal);
    },
  };
}

function titleFromAddress(address: string): string {
  const parsed = parseSessionFile(address);
  const name = baseName(parsed?.path || address);
  return name.replace(/\.nii\.gz$/i, '').replace(/\.nii$/i, '').replace(/\.dcm$/i, '') || name;
}

export function apply(ctx: PluginContext): void {
  ctx.effect(() => {
    const style = document.createElement('style');
    style.dataset.plugin = PAGE_ID;
    style.textContent = styles;
    document.head.appendChild(style);
    return () => style.remove();
  });

  ctx.effect(() => {
    const stopEnglish = ctx.locale.register('medview', 'en', messages.en);
    const stopChinese = ctx.locale.register('medview', 'zh', messages.zh);
    return () => {
      stopEnglish();
      stopChinese();
    };
  });

  const t = ctx.locale.bind('medview');
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: PAGE_ID,
    kind: 'medview',
    keepMounted: true,
    title: () => t('tab.title'),
    guide: [{
      id: 'open',
      order: 40,
      title: () => t('guide.title'),
      description: () => t('guide.description'),
    }],
  }));
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: VOLUME_ID,
    kind: 'medview-volume',
    priority: 'extension',
    patterns: ['*.nii', '*.nii.gz', '*.dcm'],
    multiple: true,
    keepMounted: true,
    canOpen: (address: string) => /\.(?:nii(?:\.gz)?|dcm)(?:[?#]|$)/i.test(address),
    title: (address: string) => titleFromAddress(address),
  }));

  ctx.slots.inject('sidebar.right.pane.tab', () => {
    const definition = (key: string) => ({
      name: 'sidebar.right.pane.tab',
      key,
      locale: 'medview',
      inject: (sessionId: string) => readers(ctx, sessionId),
    });
    const stopPage = ctx.slots.register(definition(PAGE_ID), Viewer);
    const stopVolume = ctx.slots.register(definition(VOLUME_ID), Viewer);
    return () => {
      stopPage();
      stopVolume();
    };
  });
}
