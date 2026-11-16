import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';

const saved: { blob: Blob; name: string }[] = [];
vi.mock('@/lib/saveFile', async () => {
  const actual = await vi.importActual<typeof import('@/lib/saveFile')>('@/lib/saveFile');
  return {
    ...actual,
    saveBlob: vi.fn(async (blob: Blob, name: string) => { saved.push({ blob, name }); }),
  };
});

import { exportToExcel, exportToWord, formatDataForExport } from '@/utils/exportUtils';
import { escapeHtml } from '@/lib/saveFile';

const readBlob = (blob: Blob, as: 'text' | 'buffer'): Promise<string | ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string | ArrayBuffer);
    r.onerror = () => reject(r.error);
    if (as === 'text') r.readAsText(blob); else r.readAsArrayBuffer(blob);
  });

describe('escapeHtml', () => {
  it('escapes markup so user data cannot inject HTML', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
    expect(escapeHtml(`"Tom" & 'Jerry'`)).toBe('&quot;Tom&quot; &amp; &#39;Jerry&#39;');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(5)).toBe('5');
  });
});

describe('exportToExcel', () => {
  beforeEach(() => { saved.length = 0; });

  it('keeps the header row and every data row (regression: header used to overwrite rows 1-3)', async () => {
    const data = [
      { Product: 'A', Qty: 1 },
      { Product: 'B', Qty: 2 },
      { Product: 'C', Qty: 3 },
    ];
    await exportToExcel(data, 'report', 'My Shop');
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe('report.xlsx');

    const buf = await readBlob(saved[0].blob, 'buffer');
    const wb = XLSX.read(new Uint8Array(buf as ArrayBuffer), { type: 'array' });
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets['Report'], { header: 1 });
    expect(rows[0]).toEqual(['Business: My Shop']);
    // row 4 is the table header, rows 5-7 are ALL the data
    expect(rows[3]).toEqual(['Product', 'Qty']);
    expect(rows.slice(4)).toEqual([['A', 1], ['B', 2], ['C', 3]]);
  });
});

describe('exportToWord', () => {
  it('escapes cell values', async () => {
    saved.length = 0;
    await exportToWord([{ Name: '<script>x</script>' }], 'doc', 'Shop <b>', 'Title');
    const text = (await readBlob(saved[0].blob, 'text')) as string;
    expect(text).not.toContain('<script>');
    expect(text).toContain('&lt;script&gt;');
    expect(text).toContain('Shop &lt;b&gt;');
  });
});

describe('formatDataForExport quotations', () => {
  const fc = (n: number) => `TZS ${n}`;
  it('formats VAT percentage and defaults a missing one to 0%', () => {
    const [a, b] = formatDataForExport(
      [{ id: 1, vatPercentage: 18 }, { id: 2 }], 'quotations', fc
    ) as Record<string, string>[];
    expect(a['VAT %']).toBe('18%');
    expect(b['VAT %']).toBe('0%'); // regression: used to be "undefined%"
  });
});
