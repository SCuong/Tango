import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';

const root = resolve(__dirname, '../../..');
const publicFile = (path: string) => resolve(root, 'public', path.replace(/^\//, ''));

/** Width, height, and color type from a PNG header. */
function pngInfo(path: string) {
  const bytes = readFileSync(publicFile(path));
  expect(bytes.subarray(1, 4).toString('ascii'), path).toBe('PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colorType: bytes[25] };
}

describe('official Tango app icon', () => {
  const manifest = JSON.parse(readFileSync(publicFile('manifest.webmanifest'), 'utf-8'));

  it('keeps the app name and PWA settings', () => {
    expect(manifest.name).toBe('Tango — Japanese for Vietnamese');
    expect(manifest.short_name).toBe('Tango');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
  });

  it('lists 192 and 512 PNG icons plus a 512 maskable icon, all present at their declared size', () => {
    const icons = manifest.icons as { src: string; sizes: string; type: string; purpose: string }[];
    expect(icons.map((icon) => `${icon.src} ${icon.sizes} ${icon.purpose}`)).toEqual([
      '/icon-192.png 192x192 any',
      '/icon-512.png 512x512 any',
      '/icon-maskable-512.png 512x512 maskable',
    ]);
    for (const icon of icons) {
      expect(icon.type).toBe('image/png');
      const [w, h] = icon.sizes.split('x').map(Number);
      expect(pngInfo(icon.src), icon.src).toMatchObject({ width: w, height: h });
    }
  });

  it('links the PNG favicons and the Apple touch icon from index.html', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf-8');
    expect(html).toContain('<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />');
    expect(html).toContain('<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />');
    expect(html).toContain('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />');
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(pngInfo('/favicon-32.png')).toMatchObject({ width: 32, height: 32 });
    expect(pngInfo('/favicon-16.png')).toMatchObject({ width: 16, height: 16 });
    expect(pngInfo('/apple-touch-icon.png')).toMatchObject({ width: 180, height: 180 });
  });

  it('removes the old temporary SVG icons everywhere', () => {
    expect(existsSync(publicFile('icon.svg'))).toBe(false);
    expect(existsSync(publicFile('icon-maskable.svg'))).toBe(false);
    const sw = readFileSync(publicFile('sw.js'), 'utf-8');
    expect(sw).not.toContain('icon.svg');
    // The app shell caches icons that exist
    const shell = JSON.parse(sw.match(/const SHELL = (\[[^\]]*\]);/)![1].replace(/'/g, '"')) as string[];
    for (const path of shell.filter((entry) => entry !== '/')) expect(existsSync(publicFile(path)), path).toBe(true);
  });
});
