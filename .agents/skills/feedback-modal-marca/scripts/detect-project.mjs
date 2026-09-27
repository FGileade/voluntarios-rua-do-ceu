#!/usr/bin/env node
// Lê o projeto atual (somente leitura) e imprime um perfil JSON usado pela skill
// feedback-modal-marca para adaptar o modal de avisos/confirmações à aplicação.
// Uso: node detect-project.mjs [raiz-do-projeto]
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || process.cwd());
const IGNORE = new Set(['skills', 'node_modules', 'dist', 'build', '.git', '.next', 'coverage', 'outputs', 'checkpoints', 'functions', '.vercel']);
const CODE_EXT = /\.(tsx?|jsx?|vue|svelte|html|mjs)$/;

const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => { try { return fs.readFileSync(path.join(root, p), 'utf8'); } catch { return ''; } };
const readJson = (p) => { try { return JSON.parse(read(p)); } catch { return null; } };

function walk(dir, out = [], depth = 0) {
  if (depth > 6) return out;
  let entries = [];
  try { entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (IGNORE.has(e.name) || e.name.startsWith('.')) continue;
    const rel = path.posix.join(dir, e.name);
    if (e.isDirectory()) walk(rel, out, depth + 1);
    else out.push(rel);
  }
  return out;
}

const pkg = readJson('package.json') || {};
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
const has = (...names) => names.filter((n) => deps[n]);
const files = walk('.');
const codeFiles = files.filter((f) => CODE_EXT.test(f));

// --- Framework / linguagem / estilo / ícones -------------------------------
let framework = 'desconhecido';
if (deps.next) framework = 'next';
else if (deps.react) framework = 'react';
else if (deps.vue || deps.nuxt) framework = deps.nuxt ? 'nuxt' : 'vue';
else if (deps.svelte) framework = 'svelte';
else if (deps['@angular/core']) framework = 'angular';
else if (files.some((f) => f.endsWith('.html'))) framework = 'html-vanilla';

const bundler = deps.vite ? 'vite' : deps.next ? 'next' : deps['react-scripts'] ? 'cra' : deps.webpack ? 'webpack' : null;
const typescript = !!deps.typescript || exists('tsconfig.json');
const tailwindVersion = deps.tailwindcss ? String(deps.tailwindcss).replace(/[^\d.]/g, '') : null;
const iconLib = has('lucide-react', 'lucide-vue-next', 'react-icons', '@heroicons/react', '@phosphor-icons/react', '@fortawesome/fontawesome-svg-core')[0] || null;
const animationLib = has('motion', 'framer-motion')[0] || null;

// --- Sistema de avisos que já existe ---------------------------------------
const alertLibs = has('sweetalert2', 'react-hot-toast', 'react-toastify', 'sonner', 'notistack', 'antd', '@mui/material', 'vue-toastification');
const nativeCalls = { alert: 0, confirm: 0, prompt: 0 };
const nativeFiles = new Set();
let existingProvider = null;
for (const f of codeFiles) {
  const txt = read(f);
  for (const k of Object.keys(nativeCalls)) {
    const m = txt.match(new RegExp(`(?<![\\w.$])(?:window\\.)?${k}\\(`, 'g'));
    if (m) { nativeCalls[k] += m.length; nativeFiles.add(f); }
  }
  if (!existingProvider && /FeedbackProvider|ToastProvider|NotificationProvider|DialogProvider/.test(txt) && /createContext/.test(txt)) existingProvider = f;
}

// --- Ponto de entrada, CSS global, pasta pública ---------------------------
const pick = (cands) => cands.find(exists) || null;
const entry = pick(['src/main.tsx', 'src/main.jsx', 'src/index.tsx', 'src/index.jsx', 'src/main.ts', 'src/main.js', 'app/layout.tsx', 'pages/_app.tsx']);
const rootComponent = pick(['src/App.tsx', 'src/App.jsx', 'src/App.vue', 'app/layout.tsx', 'pages/_app.tsx']);
const globalCss = pick(['src/index.css', 'src/styles.css', 'src/global.css', 'src/app.css', 'app/globals.css', 'styles/globals.css', 'src/styles/global.css']);
const publicDir = pick(['public', 'static', 'src/assets']);
const contextDir = ['src/context', 'src/contexts', 'src/providers', 'src/store'].find(exists) || 'src/context';
const componentsDir = ['src/components', 'components', 'src/ui'].find(exists) || 'src/components';

// --- Marca: nome, logo, cores, idioma --------------------------------------
const manifestPath = pick(['public/manifest.json', 'public/manifest.webmanifest', 'manifest.json']);
const manifest = manifestPath ? readJson(manifestPath) : null;
const indexHtml = read('index.html') || read('public/index.html');
const title = (indexHtml.match(/<title>([^<]*)<\/title>/i) || [])[1] || null;
const lang = (indexHtml.match(/<html[^>]*\blang="([^"]+)"/i) || [])[1] || manifest?.lang || null;

const logoCandidates = files
  .filter((f) => /\.(png|svg|webp|jpe?g)$/i.test(f) && /logo|brand|marca|icon-192|favicon/i.test(f) && !/node_modules/.test(f))
  .sort((a, b) => (/logo/i.test(b) ? 1 : 0) - (/logo/i.test(a) ? 1 : 0) || a.length - b.length)
  .slice(0, 8);

const cssTxt = globalCss ? read(globalCss) : '';
const cssVars = {};
for (const m of cssTxt.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsl[a]?\([^)]+\))/g)) cssVars[m[1]] = m[2];
const fontVars = {};
for (const m of cssTxt.matchAll(/(--font-[\w-]+)\s*:\s*([^;]+);/g)) fontVars[m[1]] = m[2].trim();
const bodyBg = (cssTxt.match(/body\s*\{[^}]*background(?:-color)?\s*:\s*([^;]+);/) || [])[1] || null;

const zIndexes = [...cssTxt.matchAll(/z-index\s*:\s*(\d+)/g)].map((m) => +m[1]);
const tsAlias = readJson('tsconfig.json')?.compilerOptions?.paths || null;

// --- Recursos de agentes/regras do projeto ---------------------------------
const projectRules = ['AGENTS.md', 'CLAUDE.md', 'PRD.md', 'README.md'].filter(exists);
const existingSkills = exists('skills') ? fs.readdirSync(path.join(root, 'skills')).filter((n) => !n.startsWith('.')) : [];

const profile = {
  root,
  stack: { framework, bundler, typescript, tailwindVersion, iconLib, animationLib, hasReactPortals: framework === 'react' || framework === 'next' },
  paths: { entry, rootComponent, globalCss, publicDir, contextDir, componentsDir, tsAlias },
  brand: {
    appName: manifest?.name || title || pkg.name || null,
    shortName: manifest?.short_name || null,
    description: manifest?.description || null,
    themeColor: manifest?.theme_color || null,
    backgroundColor: manifest?.background_color || null,
    language: lang,
    logoCandidates,
    cssColorVars: cssVars,
    fontVars,
    bodyBackground: bodyBg,
    maxZIndexInCss: zIndexes.length ? Math.max(...zIndexes) : null
  },
  existingFeedback: {
    provider: existingProvider,
    thirdPartyLibs: alertLibs,
    nativeCalls,
    filesWithNativeCalls: [...nativeFiles].sort()
  },
  projectRules,
  existingSkills
};

console.log(JSON.stringify(profile, null, 2));

