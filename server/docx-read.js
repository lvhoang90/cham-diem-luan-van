import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import JSZip from 'jszip';
import { dropLeaderLines } from './pdf-layout.js';

export class DocxError extends Error {}

/** Nhận .docx hoặc PDF có lớp chữ; chọn bộ đọc theo đuôi tệp. */
export async function readDocument(buffer, filename) {
  if (/\.pdf$/i.test(filename || '')) {
    const { readPdf } = await import('./pdf-read.js');
    return readPdf(buffer, filename);
  }
  return readDocx(buffer, filename);
}


/** Kiểm tra tệp thật sự là .docx rồi tách thành các khối văn bản có đánh số đoạn. */
export async function readDocx(buffer, filename) {
  if (!/\.docx$/i.test(filename || '')) {
    throw new DocxError(`Tệp "${filename}" không phải định dạng .docx hoặc .pdf. Với tệp .doc, hãy lưu lại từ Word bằng "Save as → Word Document (.docx)".`);
  }
  if (!buffer || buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new DocxError(`Tệp "${filename}" không phải tệp Word hợp lệ (có thể bị hỏng hoặc chỉ đổi đuôi tệp).`);
  }
  let zip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new DocxError(`Không mở được tệp "${filename}". Tệp có thể bị hỏng.`);
  }
  if (!zip.file('word/document.xml')) {
    throw new DocxError(`Tệp "${filename}" không có nội dung văn bản Word (thiếu word/document.xml).`);
  }

  let html;
  try {
    ({ value: html } = await mammoth.convertToHtml(
      { buffer },
      { convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: 'x', alt: '[hình/biểu đồ]' })) },
    ));
  } catch {
    throw new DocxError(`Không đọc được nội dung tệp "${filename}".`);
  }
  const blocks = dropLeaderLines(htmlToBlocks(html));
  if (blocks.length === 0) {
    throw new DocxError(`Tệp "${filename}" không có văn bản đọc được (có thể chỉ chứa hình ảnh/bản scan).`);
  }
  const chars = blocks.reduce((s, b) => s + b.text.length, 0);
  const words = blocks.reduce((s, b) => s + (b.text.match(/\S+/g) || []).length, 0);
  return { filename, blocks, chars, words };
}

const clean = (s) => s.replace(/\s+/g, ' ').trim();

export function htmlToBlocks(html) {
  const $ = cheerio.load(`<body>${html}</body>`);
  $('img').each((_, el) => { $(el).replaceWith(' [hình/biểu đồ] '); });
  const blocks = [];
  const push = (kind, text, extra = {}) => {
    const t = clean(text);
    if (t) blocks.push({ kind, text: t, ...extra });
  };
  const walkList = (el, depth) => {
    $(el).children('li').each((_, li) => {
      const own = $(li).clone();
      own.children('ul,ol').remove();
      push('li', own.text(), { depth });
      $(li).children('ul,ol').each((__, sub) => walkList(sub, depth + 1));
    });
  };
  $('body').children().each((_, el) => {
    const tag = el.tagName?.toLowerCase();
    if (/^h[1-6]$/.test(tag)) push('heading', $(el).text(), { level: Number(tag[1]) });
    else if (tag === 'p') {
      const inner = $(el).html().trim();
      const allBold = /^<strong>[\s\S]*<\/strong>$/.test(inner) && !/<\/strong>[\s\S]*<strong>/.test(inner);
      push(allBold ? 'bold' : 'p', $(el).text());
    } else if (tag === 'ul' || tag === 'ol') walkList(el, 0);
    else if (tag === 'table') {
      $(el).find('tr').each((__, tr) => {
        const cells = $(tr).children('td,th').map((___, td) => clean($(td).text())).get();
        if (cells.some(Boolean)) {
          push('row', cells.join(' | '), { cells: cells.map((c) => c || '[ô trống]') });
        }
      });
    } else push('p', $(el).text());
  });
  return blocks;
}

/** Gắn số đoạn toàn cục cho nhiều tệp để mô hình và hệ thống trích dẫn vị trí thống nhất. */
export function buildCorpus(files) {
  let n = 0;
  const corpus = files.map((f, fi) => ({
    fileIndex: fi + 1,
    filename: f.filename,
    blocks: f.blocks.map((b) => ({ ...b, n: ++n })),
  }));
  return corpus;
}

export function blockLine(b) {
  switch (b.kind) {
    case 'heading': return `[¶${b.n}] ${'#'.repeat(b.level)} ${b.text}`;
    case 'bold': return `[¶${b.n}] **${b.text}**`;
    case 'li': return `[¶${b.n}] ${'  '.repeat(b.depth || 0)}• ${b.text}`;
    case 'row': return `[¶${b.n}] | ${b.cells.join(' | ')} |`;
    default: return `[¶${b.n}] ${b.text}`;
  }
}

export function corpusToText(corpus, { withFileTags = true } = {}) {
  return corpus
    .map((f) => {
      const body = f.blocks.map(blockLine).join('\n');
      return withFileTags ? `<tai_lieu tep="${f.fileIndex}" ten="${f.filename.replace(/"/g, "'")}">\n${body}\n</tai_lieu>` : body;
    })
    .join('\n\n');
}

export const corpusChars = (corpus) => corpus.reduce((s, f) => s + f.blocks.reduce((a, b) => a + b.text.length + 8, 0), 0);
