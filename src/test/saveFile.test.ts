import { describe, it, expect, vi, beforeEach } from 'vitest';

let native = false;
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => native, getPlatform: () => (native ? 'android' : 'web') },
}));
const { writeFile, share, saveAs } = vi.hoisted(() => ({
  writeFile: vi.fn(async (_opts: unknown) => ({ uri: 'file:///cache/report.pdf' })),
  share: vi.fn(async (_opts: unknown) => ({})),
  saveAs: vi.fn(),
}));
vi.mock('@capacitor/filesystem', () => ({ Filesystem: { writeFile }, Directory: { Cache: 'CACHE' } }));
vi.mock('@capacitor/share', () => ({ Share: { share } }));
vi.mock('file-saver', () => ({ saveAs }));

import { saveBlob } from '@/lib/saveFile';

describe('saveBlob', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('web: uses a normal browser download', async () => {
    native = false;
    const blob = new Blob(['hi']);
    await saveBlob(blob, 'a.pdf');
    expect(saveAs).toHaveBeenCalledWith(blob, 'a.pdf');
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('native: writes to cache as base64 and opens the share sheet', async () => {
    native = true;
    await saveBlob(new Blob(['hello']), 'My Shop/report?.pdf');
    expect(saveAs).not.toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalledTimes(1);
    const arg = (writeFile.mock.calls[0] as unknown[])[0] as { path: string; data: string; directory: string };
    expect(arg.path).toBe('My Shop_report_.pdf'); // unsafe path characters removed
    expect(arg.data).toBe(btoa('hello'));
    expect(arg.directory).toBe('CACHE');
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: 'file:///cache/report.pdf' }));
  });
});
