/**
 * Small bridge for the APIs documented by Xiaohongshu on 2026-10-30.
 * https://miniapp-sandbox.xiaohongshu.com/minitool/doc
 * No UA sniffing or external requests: an ordinary XHS webview is not a mini tool.
 */
type BridgeResponse = { errMsg?: string; filePath?: string };
type WindowRect = { top: number; bottom: number };
type MiniToolBridge = {
  writeTempFile?: (options: { data: string }) => Promise<BridgeResponse>;
  saveImageToPhotosAlbum?: (options: { filePath: string }) => Promise<BridgeResponse>;
  postNote?: (options: {
    title: string;
    content: string;
    pageType: 'photo_publish';
    mediaInfo: { image_resources: Array<{ url: string }> };
  }) => Promise<BridgeResponse>;
  getWindowInfo?: () => Promise<{
    windowHeight: number;
    safeArea?: WindowRect;
    menuButtons?: { back?: WindowRect | null; me?: WindowRect | null; share?: WindowRect | null };
  }>;
};

type XhsEnvironment = {
  miniTool?: MiniToolBridge;
  launchOptions?: { miniToolEnv?: { buildVersion?: number | string } };
};

export type PlatformCapabilities = {
  platform: 'xiaohongshu' | 'web';
  saveImage: boolean;
  composeNote: boolean;
};

export type PlatformImageActionResult = {
  status: 'saved' | 'submitted' | 'cancelled' | 'unsupported' | 'error';
  message: string;
};

function getEnvironment(): XhsEnvironment | null {
  try {
    if (typeof window === 'undefined') return null;
    return (window as Window & { xhs?: XhsEnvironment }).xhs ?? null;
  } catch {
    return null;
  }
}

export function isXiaohongshuMiniTool(): boolean {
  return Boolean(getEnvironment()?.miniTool);
}

export function getPlatformCapabilities(): PlatformCapabilities {
  const xhs = getEnvironment();
  const bridge = xhs?.miniTool;
  const buildVersion = Number(xhs?.launchOptions?.miniToolEnv?.buildVersion) || 0;
  const clientVersion = Math.floor(buildVersion / 1000);
  return {
    platform: bridge ? 'xiaohongshu' : 'web',
    // If the host reports its version, respect the documented 9.42 minimum.
    // Some hosts expose only the bridge: method detection remains usable there.
    saveImage: Boolean(bridge && typeof bridge.saveImageToPhotosAlbum === 'function'
      && (!clientVersion || clientVersion >= 9420)),
    composeNote: Boolean(bridge && typeof bridge.postNote === 'function'),
  };
}

/** Native capsules use container coordinates, so avoid counting the status bar twice. */
export async function getPlatformWindowInsets(): Promise<{ top: number; bottom: number } | null> {
  const bridge = getEnvironment()?.miniTool;
  if (!bridge?.getWindowInfo) return null;
  try {
    const info = await bridge.getWindowInfo();
    if (!Number.isFinite(info.windowHeight) || info.windowHeight <= 0) return null;
    const visible = info.menuButtons ? [info.menuButtons.back, info.menuButtons.me, info.menuButtons.share] : [];
    const tops = [info.safeArea?.top ?? 0, ...visible.map((rect) => rect?.bottom ?? 0)]
      .filter((value) => Number.isFinite(value) && value >= 0 && value < info.windowHeight);
    return {
      top: Math.max(0, ...tops),
      bottom: info.safeArea && Number.isFinite(info.safeArea.bottom)
        ? Math.max(0, info.windowHeight - info.safeArea.bottom) : 0,
    };
  } catch { return null; }
}

function isImageDataUrl(value: string): boolean {
  return /^data:image\/(?:png|jpe?g|webp);base64,[a-z\d+/=\s]+$/i.test(value);
}

function bridgeError(error: unknown): PlatformImageActionResult {
  const details = typeof error === 'object' && error !== null
    ? (error as { errMsg?: unknown; message?: unknown; name?: unknown })
    : {};
  const message = `${details.errMsg ?? ''} ${details.message ?? ''} ${details.name ?? ''}`;
  if (/cancel|abort|取消/i.test(message)) {
    return { status: 'cancelled', message: '已取消，结果仍保留在这里。' };
  }
  return { status: 'error', message: '暂时没能完成，请重试。你的结果仍保留在这里。' };
}

async function checkedCall<T extends BridgeResponse>(result: Promise<T>): Promise<T> {
  if (!result || typeof result.then !== 'function') {
    throw new Error('The mini tool bridge did not return a Promise.');
  }
  const response = await result;
  // A bridge may resolve with a failed response instead of rejecting.
  if (response?.errMsg && !/:ok(?:\s|$)/.test(response.errMsg)) throw response;
  return response;
}

async function prepareImage(bridge: MiniToolBridge, imageDataUrl: string): Promise<string> {
  if (!isImageDataUrl(imageDataUrl)) throw new Error('Expected a generated local image.');
  // Native bridge payloads are smaller with a temporary file. Never persist this
  // path: the container can invalidate it after the current action.
  if (typeof bridge.writeTempFile !== 'function') return imageDataUrl;
  const response = await checkedCall(bridge.writeTempFile({ data: imageDataUrl }));
  if (typeof response?.filePath !== 'string' || !response.filePath
    || /^(?:https?:|data:)/i.test(response.filePath)) {
    throw new Error('The image bridge did not return a local file handle.');
  }
  return response.filePath;
}

/** Call only after the user clicks Save. Permission refusal never deletes results. */
export async function saveResultImage(imageDataUrl: string): Promise<PlatformImageActionResult> {
  const bridge = getEnvironment()?.miniTool;
  if (!getPlatformCapabilities().saveImage || !bridge?.saveImageToPhotosAlbum) {
    return { status: 'unsupported', message: '当前环境暂不支持保存到相册。' };
  }
  try {
    const filePath = await prepareImage(bridge, imageDataUrl);
    await checkedCall(bridge.saveImageToPhotosAlbum({ filePath }));
    return { status: 'saved', message: '已保存到相册。' };
  } catch (error) {
    return bridgeError(error);
  }
}

/**
 * Opens the native editor, where the user can edit, cancel, or publish.
 * A successful callback is not proof that moderation approved a public post.
 * The caller supplies already privacy-filtered text; no reading/question is read here.
 */
export async function openResultNoteComposer(options: {
  imageDataUrl: string;
  title?: string;
  content?: string;
}): Promise<PlatformImageActionResult> {
  const bridge = getEnvironment()?.miniTool;
  if (!getPlatformCapabilities().composeNote || !bridge?.postNote) {
    return { status: 'unsupported', message: '当前环境暂不支持打开小红书发布页。' };
  }
  try {
    const url = await prepareImage(bridge, options.imageDataUrl);
    await checkedCall(bridge.postNote({
      title: Array.from(options.title ?? '我的猫咪塔罗').slice(0, 20).join(''),
      content: Array.from(options.content ?? '').slice(0, 1000).join(''),
      pageType: 'photo_publish',
      mediaInfo: { image_resources: [{ url }] },
    }));
    return { status: 'submitted', message: '已交给小红书处理，发布状态以平台显示为准。' };
  } catch (error) {
    return bridgeError(error);
  }
}
