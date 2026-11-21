/**
 * 格式化結果：
 * - ok：格式化後的內容。
 * - invalid：不是有效的 JSON 或 XML（含空白內容）。
 * - unsafe：是合法 XML，但含 xml:space、DOCTYPE 內部子集等排版可能改變意義的結構。
 * 失敗時呼叫端不改動內容，並依 reason 提示原因。
 */
export type FormatResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'invalid' | 'unsafe' };

/**
 * 格式化 JSON 或 XML。
 *
 * 只調整結構之間的空白與縮排，不改變資料本身：
 * - JSON 不經過 JSON.stringify，數字字面值（大整數、1.10、1e400）與字串逐字保留。
 * - XML 的 CDATA、註解、處理指令、屬性值與文字節點維持原文；含文字或 CDATA 的元素整段原樣輸出。
 */
export function formatContent(raw: string): FormatResult {
  const text = raw.trim();
  if (!text) return { ok: false, reason: 'invalid' };

  let isJson = true;
  try {
    JSON.parse(text);
  } catch {
    isJson = false;
  }
  if (isJson) return { ok: true, text: reindentJson(text) };

  if (typeof DOMParser === 'undefined' || !text.startsWith('<')) return { ok: false, reason: 'invalid' };
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) return { ok: false, reason: 'invalid' };
  // 已確認是合法 XML，formatXml 回傳 null 代表結構無法安全排版
  const formatted = formatXml(text);
  return formatted === null ? { ok: false, reason: 'unsafe' } : { ok: true, text: formatted };
}

const isJsonSpace = (ch: string) => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';

/** 逐字元掃描已驗證為合法的 JSON，只改字串以外的空白 */
function reindentJson(text: string): string {
  let out = '';
  let depth = 0;
  let i = 0;
  const n = text.length;
  const newline = () => '\n' + '  '.repeat(depth);

  while (i < n) {
    const ch = text[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < n && text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j + 1;
    } else if (isJsonSpace(ch)) {
      i++;
    } else if (ch === '{' || ch === '[') {
      const closer = ch === '{' ? '}' : ']';
      let j = i + 1;
      while (j < n && isJsonSpace(text[j])) j++;
      if (text[j] === closer) {
        out += ch + closer;
        i = j + 1;
      } else {
        depth++;
        out += ch + newline();
        i++;
      }
    } else if (ch === '}' || ch === ']') {
      depth--;
      out += newline() + ch;
      i++;
    } else if (ch === ',') {
      out += ',' + newline();
      i++;
    } else if (ch === ':') {
      out += ': ';
      i++;
    } else {
      // 數字、true、false、null：原樣複製
      out += ch;
      i++;
    }
  }
  return out;
}

type XmlNode =
  | { kind: 'element'; open: string; close: string; start: number; end: number; children: XmlNode[]; selfClosing: boolean }
  | { kind: 'text'; raw: string }
  | { kind: 'cdata' | 'comment' | 'pi' | 'doctype'; raw: string };

/** 解析成節點樹，保留每個節點的原文；遇到無法安全處理的結構回傳 null */
function parseXml(xml: string): XmlNode[] | null {
  const root: XmlNode[] = [];
  const stack: Extract<XmlNode, { kind: 'element' }>[] = [];
  const push = (node: XmlNode) => (stack.length ? stack[stack.length - 1].children : root).push(node);
  const n = xml.length;
  let i = 0;

  const until = (from: number, marker: string) => {
    const at = xml.indexOf(marker, from);
    return at < 0 ? -1 : at + marker.length;
  };

  while (i < n) {
    if (xml[i] !== '<') {
      const next = xml.indexOf('<', i);
      const end = next < 0 ? n : next;
      push({ kind: 'text', raw: xml.slice(i, end) });
      i = end;
      continue;
    }
    let end: number;
    if (xml.startsWith('<!--', i)) {
      end = until(i + 4, '-->');
      if (end < 0) return null;
      push({ kind: 'comment', raw: xml.slice(i, end) });
    } else if (xml.startsWith('<![CDATA[', i)) {
      end = until(i + 9, ']]>');
      if (end < 0) return null;
      push({ kind: 'cdata', raw: xml.slice(i, end) });
    } else if (xml.startsWith('<?', i)) {
      end = until(i + 2, '?>');
      if (end < 0) return null;
      push({ kind: 'pi', raw: xml.slice(i, end) });
    } else if (xml.startsWith('<!', i)) {
      // DOCTYPE：含內部子集（[...]）時不處理
      const close = xml.indexOf('>', i);
      const bracket = xml.indexOf('[', i);
      if (close < 0 || (bracket >= 0 && bracket < close)) return null;
      end = close + 1;
      push({ kind: 'doctype', raw: xml.slice(i, end) });
    } else if (xml.startsWith('</', i)) {
      const close = xml.indexOf('>', i);
      if (close < 0) return null;
      end = close + 1;
      const el = stack.pop();
      if (!el) return null;
      el.close = xml.slice(i, end);
      el.end = end;
    } else {
      // 開始標籤：略過引號內的 >（屬性值）
      let j = i + 1;
      let quote = '';
      while (j < n) {
        const ch = xml[j];
        if (quote) {
          if (ch === quote) quote = '';
        } else if (ch === '"' || ch === "'") {
          quote = ch;
        } else if (ch === '>') {
          break;
        }
        j++;
      }
      if (j >= n) return null;
      end = j + 1;
      const open = xml.slice(i, end);
      const selfClosing = open.endsWith('/>');
      const el: Extract<XmlNode, { kind: 'element' }> = { kind: 'element', open, close: '', start: i, end, children: [], selfClosing };
      push(el);
      if (!selfClosing) stack.push(el);
    }
    i = end;
  }
  return stack.length ? null : root;
}

const isBlank = (node: XmlNode) => node.kind === 'text' && node.raw.trim() === '';

function formatXml(xml: string): string | null {
  // xml:space="preserve" 的空白有意義，不重排
  if (/\bxml:space\s*=/.test(xml)) return null;
  const nodes = parseXml(xml);
  if (!nodes) return null;

  const lines: string[] = [];
  const render = (node: XmlNode, depth: number) => {
    const pad = '  '.repeat(depth);
    if (node.kind !== 'element') {
      lines.push(pad + node.raw);
      return;
    }
    const structural = node.children.filter((c) => !isBlank(c));
    const hasContent = node.children.some((c) => c.kind === 'cdata' || (c.kind === 'text' && !isBlank(c)));
    if (node.selfClosing || hasContent || structural.length === 0) {
      // 葉節點或混合內容：整段原文輸出，文字、CDATA 與內部空白都不動
      lines.push(pad + xml.slice(node.start, node.end));
      return;
    }
    lines.push(pad + node.open);
    for (const child of structural) render(child, depth + 1);
    lines.push(pad + node.close);
  };
  for (const node of nodes) {
    if (!isBlank(node)) render(node, 0);
  }
  return lines.join('\n');
}
