// Builds ONE self-contained file: dist-standalone/finvero.html
// Double-click it to open the site in any browser — no server, no install needed.
//
//   npm run build:single
//
// It bundles the React code with esbuild and generates the Tailwind CSS with
// Tailwind's own compiler, then inlines both into the HTML file.

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const searchPaths = [root, ...(process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)]
const load = (name) => require(require.resolve(name, { paths: searchPaths }))
const resolveFile = (name) => require.resolve(name, { paths: searchPaths })

const esbuild = load('esbuild')
const { compile } = load('tailwindcss')

// ── 1. JavaScript bundle ──────────────────────────────────────────────
const js = await esbuild.build({
  entryPoints: [path.join(root, 'src/main.jsx')],
  bundle: true,
  write: false,
  minify: true,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  loader: { '.js': 'jsx', '.jsx': 'jsx', '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"production"' },
  nodePaths: searchPaths.map((p) => (p.endsWith('node_modules') ? p : path.join(p, 'node_modules'))).concat(searchPaths),
  logLevel: 'warning',
})
const jsCode = js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')

// ── 2. Tailwind CSS ───────────────────────────────────────────────────
function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) walk(p, out)
    else if (/\.(jsx?|html)$/.test(f.name)) out.push(p)
  }
  return out
}
const sources = [...walk(path.join(root, 'src')), path.join(root, 'index.html')]
const candidates = new Set()
for (const file of sources) {
  const text = fs.readFileSync(file, 'utf8')
  for (const raw of text.split(/[\s"'`]+/)) {
    if (!raw) continue
    candidates.add(raw)
    // Also try the token without surrounding punctuation (e.g. "{'px-4" or "px-4',")
    const trimmed = raw.replace(/^[({,;:]+/, '').replace(/[,;)}]+$/, '')
    if (trimmed) candidates.add(trimmed)
    // Class names wrapped in template placeholders or JSX braces
    for (const part of raw.split(/[{}]/)) if (part) candidates.add(part)
  }
}

const cssEntry = path.join(root, 'src/index.css')
const loadStylesheet = async (id, base) => {
  let file
  if (id === 'tailwindcss') file = resolveFile('tailwindcss/index.css')
  else if (id.startsWith('tailwindcss/')) file = resolveFile(id.endsWith('.css') ? id : `${id}.css`)
  else file = path.resolve(base, id)
  return { path: file, base: path.dirname(file), content: fs.readFileSync(file, 'utf8') }
}
const compiler = await compile(fs.readFileSync(cssEntry, 'utf8'), {
  base: path.dirname(cssEntry),
  from: cssEntry,
  loadStylesheet,
})
let css = compiler.build([...candidates])
try {
  css = (await esbuild.transform(css, { loader: 'css', minify: true })).code
} catch {
  /* keep unminified CSS if the minifier dislikes something */
}

// ── 3. Assemble the HTML ──────────────────────────────────────────────
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
html = html.replace('</head>', () => `<style>${css}</style>\n</head>`)
html = html.replace(/<script type="module" src="\/src\/main\.jsx"><\/script>/, () => `<script>${jsCode}</script>`)

const outDir = path.join(root, 'dist-standalone')
fs.mkdirSync(outDir, { recursive: true })
const out = path.join(outDir, 'finvero.html')
fs.writeFileSync(out, html)
// Also emit a deployable copy (Vercel / any static host) with SPA routing support
const dist = path.join(root, 'dist')
fs.mkdirSync(dist, { recursive: true })
fs.writeFileSync(path.join(dist, 'index.html'), html)
for (const f of fs.existsSync(path.join(root, 'public')) ? fs.readdirSync(path.join(root, 'public')) : []) {
  fs.copyFileSync(path.join(root, 'public', f), path.join(dist, f))
}
console.log(`✔ Built ${path.relative(root, out)}  (${(html.length / 1024).toFixed(0)} KB)`)
