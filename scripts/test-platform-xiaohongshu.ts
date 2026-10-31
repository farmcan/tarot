import assert from 'node:assert/strict';
import {
  getPlatformCapabilities, isXiaohongshuMiniTool,
  openResultNoteComposer, saveResultImage,
} from '../site/src/platform/xiaohongshu';

// Contract tests with a simulated bridge; these do not claim XHS device acceptance.
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const imageDataUrl = 'data:image/png;base64,aGVsbG8=';
const calls: Array<{ action: string; options: unknown }> = [];
const install = (xhs?: unknown) => Object.defineProperty(globalThis, 'window', {
  configurable: true, value: xhs ? { xhs } : {},
});

try {
  install();
  assert.equal(isXiaohongshuMiniTool(), false);
  assert.deepEqual(getPlatformCapabilities(), { platform: 'web', saveImage: false, composeNote: false });
  assert.equal((await saveResultImage(imageDataUrl)).status, 'unsupported');
  assert.equal((await openResultNoteComposer({ imageDataUrl })).status, 'unsupported');

  const miniTool = {
    writeTempFile: async (options: unknown) => {
      calls.push({ action: 'prepare', options });
      return { errMsg: 'writeTempFile:ok', filePath: 'xhsfile://generated-result.png' };
    },
    saveImageToPhotosAlbum: async (options: unknown) => {
      calls.push({ action: 'save', options }); return { errMsg: 'saveImageToPhotosAlbum:ok' };
    },
    postNote: async (options: unknown) => {
      calls.push({ action: 'note', options }); return { errMsg: 'postNote:ok' };
    },
  };
  install({ miniTool, launchOptions: { miniToolEnv: { buildVersion: 9420004 } } });
  assert.equal(isXiaohongshuMiniTool(), true);
  assert.deepEqual(getPlatformCapabilities(), { platform: 'xiaohongshu', saveImage: true, composeNote: true });
  assert.equal((await saveResultImage(imageDataUrl)).status, 'saved');
  assert.deepEqual(calls.pop(), { action: 'save', options: { filePath: 'xhsfile://generated-result.png' } });
  assert.equal((await openResultNoteComposer({ imageDataUrl, title: '猫'.repeat(30), content: '测'.repeat(1200) })).status, 'submitted');
  const note = calls.pop()?.options as { title: string; content: string; mediaInfo: unknown };
  assert.equal(note.title.length, 20);
  assert.equal(note.content.length, 1000);
  assert.deepEqual(note.mediaInfo, { image_resources: [{ url: 'xhsfile://generated-result.png' }] });

  const beforeInvalid = calls.length;
  assert.equal((await saveResultImage('https://example.com/private.png')).status, 'error');
  assert.equal(calls.length, beforeInvalid, 'external images never enter the native bridge');

  install({ miniTool, launchOptions: { miniToolEnv: { buildVersion: 9419999 } } });
  assert.equal((await saveResultImage(imageDataUrl)).status, 'unsupported', 'build suffix does not satisfy client version');

  install({ miniTool: { saveImageToPhotosAlbum: async () => { throw { errMsg: 'saveImageToPhotosAlbum:fail cancel' }; } } });
  assert.equal((await saveResultImage(imageDataUrl)).status, 'cancelled');
  install({ miniTool: { postNote: async () => { throw { errMsg: 'postNote:fail user cancel' }; } } });
  assert.equal((await openResultNoteComposer({ imageDataUrl })).status, 'cancelled');

  install({ miniTool: { saveImageToPhotosAlbum: async () => ({ errMsg: 'saveImageToPhotosAlbum:fail auth denied' }) } });
  assert.equal((await saveResultImage(imageDataUrl)).status, 'error', 'resolved failure is not success');
  install({ miniTool: { saveImageToPhotosAlbum: () => undefined } });
  assert.equal((await saveResultImage(imageDataUrl)).status, 'error', 'missing bridge completion is not success');
  install({ miniTool: { ...miniTool, writeTempFile: async () => ({ errMsg: 'writeTempFile:ok' }) } });
  assert.equal((await saveResultImage(imageDataUrl)).status, 'error', 'missing local file is not success');
  install({ miniTool: { saveImageToPhotosAlbum: async (options: unknown) => {
    calls.push({ action: 'direct', options }); return { errMsg: 'saveImageToPhotosAlbum:ok' };
  } } });
  assert.equal((await saveResultImage(imageDataUrl)).status, 'saved');
  assert.deepEqual(calls.pop(), { action: 'direct', options: { filePath: imageDataUrl } });

  console.log('Xiaohongshu bridge contract checks passed (simulated host).');
} finally {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
}
