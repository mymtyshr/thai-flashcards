// Claude Artifact 用の、1枚のHTMLを作る。使い方： node artifact/build.mjs 出力先.html
// アプリ本体（app.js・style.css）は、ふつうのブラウザ版と同じものを使い、差し替え部分（artifact/host.js）だけを足す。
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');
const out = process.argv[2];
if (!out) { console.error('出力先を指定してください'); process.exit(1); }

const nav = read('index.html').match(/<nav class="tabbar"[\s\S]*?<\/nav>/)[0];
const safeJs = (s) => s.replace(/<\/(script)/gi, '<\\/$1');
const css = read('style.css') + `
/* Artifact用：画面の端（ノッチ・システムバー）を避ける */
.wrap { padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.tabbar { padding-left: env(safe-area-inset-left, 0px); padding-right: env(safe-area-inset-right, 0px); }
`;

const html = `<title>タイ語マイフレーズ</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}
</style>
<main id="view" class="wrap"><p class="sub">読み込み中…</p></main>

${nav}

<div id="toast" role="status" aria-live="polite"></div>
<script>
${safeJs(read('artifact/host.js'))}
</script>
<script>
(function () {
  var src = ${JSON.stringify(safeJs(read('app.js')))};
  function start() { var s = document.createElement('script'); s.textContent = src; document.body.appendChild(s); }
  window.thaiHost.ready.then(start, start);
})();
</script>
`;
writeFileSync(out, html);
console.log(`書き出しました: ${out}（${html.length} 文字）`);
