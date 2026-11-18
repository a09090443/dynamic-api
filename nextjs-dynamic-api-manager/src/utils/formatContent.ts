/** 格式化 JSON 或 XML；兩者都無法解析時回傳 null（呼叫端不改動內容） */
export function formatContent(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    // 不是 JSON，改試 XML
  }

  if (typeof DOMParser === 'undefined' || !text.startsWith('<')) return null;
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) return null;
  return formatXml(text);
}

function formatXml(xml: string): string {
  const tokens = xml.replace(/>\s*</g, '><').split(/(?=<)|(?<=>)/).filter((t) => t.trim() !== '');
  let depth = 0;
  const lines: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.startsWith('</')) {
      depth = Math.max(depth - 1, 0);
      lines.push('  '.repeat(depth) + t);
    } else if (t.startsWith('<')) {
      const selfClosing = t.endsWith('/>') || t.startsWith('<?') || t.startsWith('<!');
      // <a>text</a> 放在同一行
      const next = tokens[i + 1];
      const close = tokens[i + 2];
      if (!selfClosing && next && !next.startsWith('<') && close && close.startsWith('</')) {
        lines.push('  '.repeat(depth) + t + next + close);
        i += 2;
        continue;
      }
      lines.push('  '.repeat(depth) + t);
      if (!selfClosing) depth++;
    } else {
      lines.push('  '.repeat(depth) + t.trim());
    }
  }
  return lines.join('\n');
}
