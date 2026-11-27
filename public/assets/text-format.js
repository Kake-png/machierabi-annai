// 「A／B／C」の羅列と、本文に混ざった出典名・更新日を、文章の意味を変えずに見分けやすくする。
// 対象：暮らしのポイント（editorial.notes）、要点（practical）など、研究ノートから自動生成された本文。

// 「A／B／C」の羅列は文章ではなく一覧として扱う（括弧内の／では区切らない）。
export function splitSlashList(text) {
  const items = [];
  let depth = 0, cur = "";
  for (const ch of text) {
    if ("（(".includes(ch)) depth++;
    if ("）)".includes(ch)) depth = Math.max(0, depth - 1);
    if (ch === "／" && depth === 0) { items.push(cur.trim()); cur = ""; } else cur += ch;
  }
  items.push(cur.trim());
  return items.filter(Boolean);
}

// 「【再確認 2026-11-08】」のような角括弧の注記、
// 「GO TOKYO（2025-12-19更新）：」「さんたつ（…、2023-10-07更新）：」のような
// 「出典名（…更新／公開…）：」、「（ieagent 2025-06-18更新）」のような文末の注記を検出する。
// 出典名らしき直前の語に数字が含まれる場合（「全長420m（…更新）」など）は、
// その語を事実の一部とみなし、括弧の中身だけを対象にする。
const CITATION_PATTERN = /(【[^】]{1,40}】)|([^()（）。、\n]{1,24})?([（(][^（）()]{0,120}?(?:更新|公開)[^（）()]{0,30}?[）)])(\s*[:：])?/gu;

function annotateCitations(text, escapeHtml) {
  let result = "";
  let last = 0;
  let match;
  CITATION_PATTERN.lastIndex = 0;
  while ((match = CITATION_PATTERN.exec(text))) {
    const [whole, bracketOnly, nameToken, parenPart, colonPart] = match;
    const start = match.index;
    if (bracketOnly) {
      result += escapeHtml(text.slice(last, start));
      result += `<small class="note-source">${escapeHtml(bracketOnly)}</small>`;
      last = start + whole.length;
      continue;
    }
    const hasDigitName = nameToken && /\d/.test(nameToken);
    const citationStart = hasDigitName ? start + nameToken.length : start;
    result += escapeHtml(text.slice(last, citationStart));
    result += `<small class="note-source">${escapeHtml(text.slice(citationStart, start + whole.length))}</small>`;
    last = start + whole.length;
  }
  result += escapeHtml(text.slice(last));
  return result;
}

// 本文を文単位に分け、3項目以上の「／」羅列は箇条書きに、それ以外は段落にする。
// 出典名・更新日はannotateCitationsで小さく表示する（削除はしない）。
export function renderNoteBody(text = "", escapeHtml) {
  const sentences = String(text).split("。").map((s) => s.trim()).filter(Boolean);
  const listBlocks = [];
  const proseSentences = [];
  for (const sentence of sentences) {
    const items = splitSlashList(sentence);
    if (items.length >= 3) listBlocks.push(items);
    else proseSentences.push(sentence);
  }
  const listHtml = listBlocks.map((items) => `<ul class="note-list">${items.map((item) => `<li>${annotateCitations(item, escapeHtml)}</li>`).join("")}</ul>`).join("");
  const proseHtml = proseSentences.length ? `<p>${proseSentences.map((sentence) => `${annotateCitations(sentence, escapeHtml)}。`).join("")}</p>` : "";
  // 「…は各条件の根拠を参照」のような案内文は、根拠欄へのリンクにする
  return (listHtml + proseHtml).replace(/各条件の(根拠|理由・出典)/gu, '<a href="#evidence">各条件の$1</a>');
}
