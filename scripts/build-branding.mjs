#!/usr/bin/env node
// Derive branding from assets/cerulean.svg. Use --check to verify SVGs,
// or --png to export raster assets with Chrome (CHROME_PATH overrides discovery).
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'assets');
const icon = readFileSync(join(assets, 'cerulean.svg'), 'utf8');
const contents = icon.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*<title[^>]*>.*?<\/title>/, '');
const mark = (x, y, size) => `<g transform="translate(${x} ${y}) scale(${size / 200})">${contents}</g>`;
const svg = (width, height, title, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title">
  <title id="title">${title}</title>
${body}
</svg>\n`;
const outputs = new Map([
  ['cerulean-wordmark.svg', svg(720, 200, 'Cerulean', `  <rect width="720" height="200" rx="32" fill="#F5F8F9"/>
${mark(24, 24, 152)}
  <text x="210" y="128" fill="#103747" font-family="Georgia, 'Times New Roman', serif" font-size="86">Cerulean</text>`)],
  ['cerulean-social.svg', svg(1280, 640, 'Cerulean — Another feature request? Groundbreaking.', `  <rect width="1280" height="640" fill="#F5F8F9"/>
${mark(88, 168, 280)}
  <text x="424" y="302" fill="#103747" font-family="Georgia, 'Times New Roman', serif" font-size="110">Cerulean</text>
  <text x="430" y="366" fill="#103747" font-family="Arial, sans-serif" font-size="29">Another feature request? Groundbreaking.</text>
  <text x="430" y="421" fill="#426575" font-family="Arial, sans-serif" font-size="23">Impeccable work. Withering commentary.</text>`)],
]);
let stale = false;
for (const [name, content] of outputs) {
  const path = join(assets, name);
  if (process.argv.includes('--check')) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== content) {
      console.error(`stale: assets/${name}`);
      stale = true;
    }
  } else writeFileSync(path, content);
}
if (stale) process.exit(1);
if (process.argv.includes('--png')) {
  const chrome = process.env.CHROME_PATH || (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome');
  const temporary = mkdtempSync(join(tmpdir(), 'cerulean-branding-'));
  for (const [name, width, height, source] of [
    ['cerulean-avatar.png', 512, 512, icon],
    ['cerulean-social.png', 1280, 640, outputs.get('cerulean-social.svg')],
  ]) {
    const page = join(temporary, `${name}.html`);
    writeFileSync(page, `<!doctype html><style>html,body{margin:0;width:100%;height:100%;background:${name.includes('avatar') ? '#0B7DA6' : '#F5F8F9'}}svg{display:block;width:100%;height:100%}</style>${source}`);
    execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
      `--window-size=${width},${height}`,
      `--screenshot=${join(assets, name)}`, pathToFileURL(page).href], { stdio: 'pipe', timeout: 30000 });
  }
}
console.log(process.argv.includes('--check') ? 'branding SVGs are up to date' : 'branding assets generated');
