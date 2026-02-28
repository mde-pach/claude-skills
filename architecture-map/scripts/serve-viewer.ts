#!/usr/bin/env bun
/**
 * serve-viewer.ts
 *
 * Tiny local server that serves the Mermaid viewer + the target .md file.
 * Opens the browser automatically.
 *
 * Usage:
 *   bun run serve-viewer.ts <path-to-architecture.md> [--port 4321]
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import { parseArgs } from "node:util";

const { values: flags, positionals } = parseArgs({
  options: {
    port: { type: "string", default: "4321" },
  },
  allowPositionals: true,
});

const mdPath = positionals[0];
if (!mdPath || !existsSync(resolve(mdPath))) {
  console.error("Usage: bun run serve-viewer.ts <path-to-file.md> [--port 4321]");
  console.error(mdPath ? `File not found: ${resolve(mdPath)}` : "No file path provided.");
  process.exit(1);
}

const resolvedMdPath = resolve(mdPath);
const port = Number(flags.port);
const fileName = basename(resolvedMdPath);

const VIEWER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title id="page-title">Architecture Map</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; }
    header { padding: 1.5rem 2rem; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    header h1 { font-size: 1.5rem; font-weight: 600; }
    header .meta { font-size: 0.8rem; color: #64748b; }
    header .stats { font-size: 0.85rem; color: #94a3b8; }
    nav { display: flex; gap: 0.5rem; padding: 1rem 2rem; border-bottom: 1px solid #1e293b; flex-wrap: wrap; }
    nav button { padding: 0.5rem 1rem; border: 1px solid #334155; border-radius: 0.5rem; background: #1e293b; color: #e2e8f0; cursor: pointer; font-size: 0.85rem; transition: all 0.15s; white-space: nowrap; }
    nav button:hover { background: #334155; }
    nav button.active { background: #4f46e5; border-color: #4f46e5; color: #fff; }
    .container { padding: 2rem; overflow: auto; min-height: 60vh; }
    .container svg { max-width: 100%; height: auto; transition: transform 0.15s; transform-origin: top center; }
    .controls { position: fixed; bottom: 1.5rem; right: 1.5rem; display: flex; gap: 0.5rem; z-index: 10; }
    .controls button { width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; border: 1px solid #334155; background: #1e293b; color: #e2e8f0; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; }
    .controls button:hover { background: #334155; }
    .loading { padding: 4rem; text-align: center; color: #64748b; }
    .error { padding: 2rem; color: #f87171; background: #1e1215; border: 1px solid #7f1d1d; border-radius: 0.5rem; margin: 2rem; font-family: monospace; white-space: pre-wrap; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1 id="title">Architecture Map</h1>
      <div class="meta" id="filepath"></div>
    </div>
    <span class="stats" id="stats"></span>
  </header>
  <nav id="tabs"></nav>
  <div class="container" id="container">
    <div class="loading">Loading...</div>
  </div>
  <div class="controls">
    <button onclick="zoomDiagram(-0.15)" title="Zoom out">\u2212</button>
    <button onclick="zoomDiagram(0.15)" title="Zoom in">+</button>
    <button onclick="zoomDiagram(0)" title="Reset">\u27F2</button>
  </div>

  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      flowchart: { useMaxWidth: false, htmlLabels: true },
    });

    let diagrams = {};
    let scale = 1;
    const tabs = document.getElementById('tabs');
    const container = document.getElementById('container');

    function parseMd(text) {
      const out = {};
      const blocks = text.split('\`\`\`mermaid');
      const headers = text.split('\\n').filter(l => l.startsWith('## ')).map(l => l.replace('## ', ''));
      for (let i = 1; i < blocks.length; i++) {
        const code = blocks[i].split('\`\`\`')[0].trim();
        const name = headers[i - 1] || 'Diagram ' + i;
        out[name] = code;
      }
      return out;
    }

    let renderCount = 0;
    async function renderDiagram(name) {
      tabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      [...tabs.querySelectorAll('button')].find(b => b.textContent === name)?.classList.add('active');
      scale = 1;
      const id = 'mmd-' + (++renderCount);
      container.innerHTML = '<div id="' + id + '"></div>';
      try {
        const { svg } = await mermaid.render(id + '-svg', diagrams[name]);
        document.getElementById(id).innerHTML = svg;
      } catch (e) {
        container.innerHTML = '<div class="error">Mermaid render error:\\n' + e.message + '</div>';
      }
    }

    window.zoomDiagram = (delta) => {
      if (delta === 0) scale = 1;
      else scale = Math.max(0.2, Math.min(4, scale + delta));
      const svg = container.querySelector('svg');
      if (svg) svg.style.transform = 'scale(' + scale + ')';
    };

    // Load the .md from the server
    const resp = await fetch('/__md__');
    if (!resp.ok) {
      container.innerHTML = '<div class="error">Failed to load file: ' + resp.statusText + '</div>';
    } else {
      const text = await resp.text();
      const meta = resp.headers.get('X-File-Name') || 'ARCHITECTURE.md';
      const filePath = resp.headers.get('X-File-Path') || '';

      diagrams = parseMd(text);
      document.getElementById('title').textContent = meta;
      document.getElementById('page-title').textContent = meta;
      document.getElementById('filepath').textContent = filePath;

      const count = Object.keys(diagrams).length;
      document.getElementById('stats').textContent = count + ' diagram' + (count !== 1 ? 's' : '');

      tabs.innerHTML = '';
      Object.keys(diagrams).forEach((name, i) => {
        const btn = document.createElement('button');
        btn.textContent = name;
        btn.onclick = () => renderDiagram(name);
        if (i === 0) btn.classList.add('active');
        tabs.appendChild(btn);
      });

      const first = Object.keys(diagrams)[0];
      if (first) renderDiagram(first);
    }
  </script>
</body>
</html>`;

const server = Bun.serve({
  port,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/__md__") {
      const content = readFileSync(resolvedMdPath, "utf-8");
      return new Response(content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-File-Name": fileName,
          "X-File-Path": resolvedMdPath,
        },
      });
    }

    // Serve the viewer for any other path
    return new Response(VIEWER_HTML, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
});

const url = `http://localhost:${server.port}`;
console.log(`\n  Serving: ${resolvedMdPath}`);
console.log(`  Viewer:  ${url}\n`);

// Open browser
Bun.spawn(["open", url]);
