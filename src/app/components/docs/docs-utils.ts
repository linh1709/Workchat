/* ============ MARKDOWN RENDERER ============ */
export function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, '<h3 class="text-[15px] text-gray-800 mt-5 mb-2" style="font-weight:600">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-[17px] text-gray-800 mt-6 mb-2" style="font-weight:600">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-[20px] text-gray-900 mt-6 mb-3" style="font-weight:700">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del class="text-gray-400">$1</del>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-[12px]">$1</code>')
    .replace(/^```(\w*)\n([\s\S]*?)```$/gm, '<pre class="bg-gray-900 text-gray-100 rounded-xl p-4 my-3 overflow-x-auto text-[12px] leading-relaxed"><code>$2</code></pre>')
    .replace(/^- \[x\] (.+)$/gm, '<div class="flex items-center gap-2 py-0.5"><span class="w-4 h-4 rounded border-2 border-cyan-500 bg-cyan-500 flex items-center justify-center text-white text-[10px]">✓</span><span class="line-through text-gray-400">$1</span></div>')
    .replace(/^- \[ \] (.+)$/gm, '<div class="flex items-center gap-2 py-0.5"><span class="w-4 h-4 rounded border-2 border-gray-300 shrink-0"></span><span>$1</span></div>')
    .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 py-0.5"><span class="text-cyan-500 mt-1 shrink-0">•</span><span>$1</span></div>')
    .replace(/^\d+\. (.+)$/gm, '<div class="flex items-start gap-2 py-0.5 pl-1"><span class="text-gray-400 shrink-0 tabular-nums">$1.</span><span>$1</span></div>')
    .replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-3 border-cyan-400 pl-4 py-1 my-2 text-gray-500 italic bg-cyan-50/50 rounded-r-lg pr-3">$1</blockquote>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-cyan-600 hover:underline" target="_blank">$1</a>')
    .replace(/^---$/gm, '<hr class="border-gray-200 my-4" />')
    .replace(/\n\n/g, '<div class="h-3"></div>')
    .replace(/\n/g, '<br/>');
}

/* Convert markdown to rich HTML for WYSIWYG editing */
export function markdownToEditorHtml(md: string): string {
  let html = md;
  const codeBlocks: string[] = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/gm, (_m, _lang, code) => {
    codeBlocks.push(`<pre style="background:#F4F5F7;color:#172B4D;border:1px solid #DFE1E6;border-radius:3px;padding:16px;margin:12px 0;overflow-x:auto;font-size:12px;line-height:1.6;font-family:monospace"><code>${code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre>`);
    return `%%CODEBLOCK${codeBlocks.length - 1}%%`;
  });
  html = html.replace(/`([^`]+)`/g, '<code style="background:#F4F5F7;color:#e53e3e;padding:2px 6px;border-radius:3px;font-size:12px;font-family:monospace">$1</code>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');
  html = html.replace(/^> (.+)$/gm, '<blockquote style="border-left:2px solid #DFE1E6;padding:4px 10px;margin:8px 0;color:#6B778C;font-style:italic">$1</blockquote>');
  html = html.replace(/^- \[x\] (.+)$/gm, '<div style="display:flex;align-items:center;gap:8px;padding:2px 0"><input type="checkbox" checked disabled style="accent-color:#0052CC"><s style="color:#6B778C">$1</s></div>');
  html = html.replace(/^- \[ \] (.+)$/gm, '<div style="display:flex;align-items:center;gap:8px;padding:2px 0"><input type="checkbox" disabled>$1</div>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li style="list-style-type:decimal">$2</li>');
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#0052CC;text-decoration:underline" target="_blank">$1</a>');
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #DFE1E6;margin:16px 0">');
  codeBlocks.forEach((block, i) => { html = html.replace(`%%CODEBLOCK${i}%%`, block); });
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  html = `<p>${html}</p>`;
  return html;
}

/* Convert HTML back to markdown for export */
export function htmlToMarkdown(html: string): string {
  let md = html;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n');
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<u>(.*?)<\/u>/gi, '$1');
  md = md.replace(/<s>(.*?)<\/s>/gi, '~~$1~~');
  md = md.replace(/<del>(.*?)<\/del>/gi, '~~$1~~');
  md = md.replace(/<strike>(.*?)<\/strike>/gi, '~~$1~~');
  md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n');
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<hr[^>]*\/?>/gi, '---\n');
  md = md.replace(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<div[^>]*>/gi, '\n');
  md = md.replace(/<\/div>/gi, '');
  md = md.replace(/<p[^>]*>/gi, '\n');
  md = md.replace(/<\/p>/gi, '\n');
  md = md.replace(/<[^>]+>/g, '');
  md = md.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

/* Get plain text from HTML */
export function getPlainText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.innerText || div.textContent || '';
}

/* Extract headings from HTML */
export function getHtmlHeadings(html: string): { level: number; text: string }[] {
  const results: { level: number; text: string }[] = [];
  const regex = /<h([1-4])[^>]*>(.*?)<\/h\1>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const div = document.createElement('div');
    div.innerHTML = match[2];
    results.push({ level: parseInt(match[1]), text: div.textContent || '' });
  }
  return results;
}
