// Ghép artifact/ thành MỘT tệp HTML chạy độc lập (nhúng mammoth, docx và lời nhắc từ server/prompts.js).
// Dùng: node scripts/build-artifact.mjs [đường_dẫn_ra]   (mặc định artifact/dist/tro-ly-phan-bien.html)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYSTEM_TEMPLATE, SYSTEM_REVIEWER } from '../server/prompts.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => fs.readFileSync(path.join(root, p), 'utf8');
// Trình xuất bản từ chối ký tự U+FFFD thô; trong thư viện nó chỉ nằm trong chuỗi ký tự nên đổi sang dạng thoát có cùng nghĩa.
const safe = (js) => js.replace(/<\/script/gi, '<\\/script').replace(/\uFFFD/g, '\\uFFFD');
const out = process.argv[2] || path.join(root, 'artifact/dist/tro-ly-phan-bien.html');

const prompts = `const SYSTEM_TEMPLATE = ${JSON.stringify(SYSTEM_TEMPLATE)};\nconst SYSTEM_REVIEWER = ${JSON.stringify(SYSTEM_REVIEWER)};`;
const app = ['artifact/core.js', 'artifact/pipeline.js', 'artifact/ui.js'].map(rd).join('\n');
const html = `${rd('artifact/head.html')}\n${rd('artifact/body.html')}
<script>${safe(rd('node_modules/mammoth/mammoth.browser.min.js'))}</script>
<script>${safe(rd('node_modules/docx/dist/index.iife.js'))}</script>
<script>
${safe(prompts)}
${safe(app)}
</script>
`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`${out} (${(html.length / 1048576).toFixed(2)} MB)`);
