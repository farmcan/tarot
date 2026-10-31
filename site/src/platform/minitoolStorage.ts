export type MiniToolScene = 'daily' | 'relationship' | 'choice';
export type MiniToolSnapshot = { version: 1; scene: MiniToolScene; cardId: string; createdAt: string };
const KEY = 'miaotarot:minitool:last-result:v1';
type NativeStorage = {
  getStorage?: (options: { key: string }) => Promise<{ data?: string | null }>;
  setStorage?: (options: { key: string; data: string }) => Promise<unknown>;
  removeStorage?: (options: { key: string }) => Promise<unknown>;
  getLaunchOptions?: () => Promise<{ miniToolEnv?: { buildVersion?: number | string } }>;
};

async function nativeStorage(): Promise<{ bridge: NativeStorage | null; useNative: boolean }> {
  const xhs = (window as Window & { xhs?: {
    miniTool?: NativeStorage;
    launchOptions?: { miniToolEnv?: { buildVersion?: number | string } };
  } }).xhs;
  if (!xhs?.miniTool) return { bridge: null, useNative: false };
  let build = Number(xhs.launchOptions?.miniToolEnv?.buildVersion) || 0;
  if (!build && typeof xhs.miniTool.getLaunchOptions === 'function') {
    try { build = Number((await xhs.miniTool.getLaunchOptions()).miniToolEnv?.buildVersion) || 0; } catch { /* version remains unknown */ }
  }
  return { bridge: xhs.miniTool, useNative: Math.floor(build / 1000) >= 9460 };
}

export function validateMiniToolSnapshot(value: unknown, allowedIds: readonly string[]): MiniToolSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<MiniToolSnapshot>;
  if (item.version !== 1 || !['daily', 'relationship', 'choice'].includes(item.scene ?? '')
    || typeof item.cardId !== 'string' || !allowedIds.includes(item.cardId)
    || typeof item.createdAt !== 'string' || !Number.isFinite(Date.parse(item.createdAt))) return null;
  // Reconstruct a closed schema: question text or unexpected fields never persist.
  return { version: 1, scene: item.scene!, cardId: item.cardId, createdAt: item.createdAt };
}

export async function loadMiniToolSnapshot(allowedIds: readonly string[]): Promise<MiniToolSnapshot | null> {
  try {
    const { bridge, useNative } = await nativeStorage();
    let data: string | null | undefined;
    if (useNative) {
      if (!bridge?.getStorage) return null;
      data = (await bridge.getStorage({ key: KEY })).data;
    } else data = window.localStorage.getItem(KEY);
    return data ? validateMiniToolSnapshot(JSON.parse(data), allowedIds) : null;
  } catch { return null; }
}

export async function saveMiniToolSnapshot(snapshot: MiniToolSnapshot): Promise<boolean> {
  try {
    const { bridge, useNative } = await nativeStorage();
    const data = JSON.stringify({ version: 1, scene: snapshot.scene, cardId: snapshot.cardId, createdAt: snapshot.createdAt });
    if (useNative) {
      if (!bridge?.setStorage) return false;
      const pending = bridge.setStorage({ key: KEY, data });
      if (!pending || typeof pending.then !== 'function') return false;
      const result = await pending;
      const errMsg = (result as { errMsg?: string } | null)?.errMsg;
      if (errMsg && !/:ok(?:\s|$)/.test(errMsg)) return false;
    } else window.localStorage.setItem(KEY, data);
    return true;
  } catch { return false; }
}

export async function clearMiniToolSnapshot(): Promise<boolean> {
  try {
    const { bridge, useNative } = await nativeStorage();
    if (useNative) {
      if (!bridge?.removeStorage) return false;
      const pending = bridge.removeStorage({ key: KEY });
      if (!pending || typeof pending.then !== 'function') return false;
      const result = await pending;
      const errMsg = (result as { errMsg?: string } | null)?.errMsg;
      if (errMsg && !/:ok(?:\s|$)/.test(errMsg)) return false;
    } else window.localStorage.removeItem(KEY);
    return true;
  } catch { return false; }
}
