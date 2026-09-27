#!/usr/bin/env node
// Preenche os templates da skill com os valores da aplicação de destino.
// Uso: node render-templates.mjs valores.json
// valores.json: { "root": ".", "modalDir": "src/components", "contextDir": "src/context",
//                 "cssFile": "src/feedback.css", "values": { "BRAND_NAME": "...", ... } }
// Não sobrescreve arquivos existentes (aborta com aviso) para nunca apagar trabalho do projeto.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(here, '..', 'assets');
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const root = path.resolve(cfg.root || '.');
const ext = cfg.typescript === false ? 'jsx' : 'tsx';

const jobs = [
  ['GlobalFeedbackModal.tsx.tmpl', path.join(cfg.modalDir, `GlobalFeedbackModal.${ext}`)],
  ['BrandLoadingOverlay.tsx.tmpl', path.join(cfg.modalDir, `BrandLoadingOverlay.${ext}`)],
  ['FeedbackContext.tsx.tmpl', path.join(cfg.contextDir, `FeedbackContext.${ext}`)],
  ['feedback.css.tmpl', cfg.cssFile]
];

const required = ['BRAND_NAME', 'BRAND_LABEL', 'LOGO_SRC', 'ACCENT', 'ACCENT_SOFT', 'ACCENT_GLOW', 'ACCENT_HOVER_BORDER',
  'PRIMARY', 'PRIMARY_HOVER', 'PRIMARY_SHADOW', 'SURFACE_FROM', 'SURFACE_TO', 'BACKDROP', 'Z_INDEX', 'MONO_FONT'];
const missing = required.filter((k) => cfg.values?.[k] === undefined);
if (missing.length) { console.error('Faltam valores:', missing.join(', ')); process.exit(1); }

for (const [tmpl, dest] of jobs) {
  const out = path.join(root, dest);
  if (fs.existsSync(out)) { console.warn(`PULADO (já existe): ${dest}`); continue; }
  let txt = fs.readFileSync(path.join(assets, tmpl), 'utf8');
  txt = txt.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => cfg.values[k] ?? `{{${k}}}`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, txt);
  console.log(`CRIADO: ${dest}`);
}

