import {EVIDENCE_SUMMARIES} from "./evidence-summaries.js?v=54";
const escape = (value = "") => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// 「A／B／C」の羅列は文章ではなく一覧なので、項目ごとに1行で表示する（括弧内の／では区切らない）。
function splitSlashList(text) {
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
function reasonBody(text) {
  const at = text.indexOf("：");
  const head = at > 0 ? text.slice(0, at) : "";
  const rest = at > 0 ? text.slice(at + 1) : text;
  const items = splitSlashList(rest.replace(/。$/u, ""));
  if (items.length < 3) return `<p>${escape(text.replace(/。$/u, ""))}</p>`;
  return `${head ? `<p class="reason-label">${escape(head)}</p>` : ""}<ul class="reason-list">${items.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>`;
}
// 条件ごとの短い根拠（一覧表示用）。1文目だけを返す。
export function conditionBrief(station, tag) {
  const record = station.evidence?.[tag];
  if (!record || record.status !== "verified" || !record.value) return "";
  const brief = EVIDENCE_SUMMARIES[`${station.slug}::${tag}`] || String(record.text || "");
  return (brief.split(/(?<=。)/u)[0] || "").replace(/。$/u, "").trim();
}
// 「各条件の根拠を参照」だけの欄は、該当する条件の短い根拠に置き換える（中身のない定型文を出さない）。
export const PLACEHOLDER_SENTENCE = /[^。]*(?:条件の(?:根拠|理由・出典)を|運行日や行き先は路線ごとに確認できます|交通状況により変わります)[^。]*。?/gu;
const FIELD_TAGS = { car: ["expressway"], outdoors: ["park", "river", "cycle", "sea"], evening: ["late", "drinks", "view"], weekend: ["cinema", "park", "view"], daily: ["shopping", "street", "late"], atmosphere: ["street", "drinks"] };
const FIELD_EMPTY = { car: "高速入口が近い条件には、調べた範囲では当てはまりません。", outdoors: "大きな公園・川・サイクリングコース・海の条件には、調べた範囲では当てはまりません。", evening: "夜景・飲み歩き・深夜の食品買い物の条件には、調べた範囲では当てはまりません。" };
export function noteWithFacts(station, field, text, tagLabels) {
  const raw = String(text || "");
  const kept = raw.replace(PLACEHOLDER_SENTENCE, "").trim();
  if (kept && kept !== raw.trim()) return kept;
  if (kept) return raw;
  const facts = (FIELD_TAGS[field] || []).filter((tag) => station.tags.includes(tag))
    .map((tag) => [tag, conditionBrief(station, tag)]).filter(([, brief]) => brief)
    .map(([tag, brief]) => `${tagLabels[tag]}：${brief}。`);
  return facts.join("") || FIELD_EMPTY[field] || "";
}
export function evidenceHtml(station, data) {
  const verified = station.tags;
  const pending = Object.keys(data.tagLabels).filter((tag) => station.evidence[tag].status === "pending");
  const negative = Object.keys(data.tagLabels).filter((tag) => station.evidence[tag].status === "verified" && !station.evidence[tag].value);
  return `<section class="content-section evidence-section" id="evidence"><h2>条件に合う理由・出典</h2>
    ${verified.length ? `<div class="evidence-list compact-evidence">${verified.map((tag) => {
      const record=station.evidence[tag];
      const brief = EVIDENCE_SUMMARIES[`${station.slug}::${tag}`] || record.text.split(/(?<=。)/u)[0];
      const preview = brief.length > 100 ? `${brief.slice(0, 99)}…` : brief;
      return `<div class="condition-reason" id="evidence-${escape(tag)}"><div class="condition-reason-heading"><h3>${escape(data.tagLabels[tag])}</h3>${reasonBody(preview)}</div><details class="evidence-full evidence-condition"><summary aria-label="${escape(data.tagLabels[tag])}の詳しい理由と出典"><span class="sr-only">詳しい理由と出典</span></summary><div class="evidence-body"><p>${escape(record.text)}</p><p class="evidence-date">確認 ${escape(record.checkedAt)}</p><ul>${record.sourceIds.map(id=>`<li><a href="${escape(data.factSources[id].url)}" rel="external noopener">${escape(data.factSources[id].title)}</a></li>`).join('')}</ul></div></details></div>`;
    }).join('')}</div>` : '<p>条件別の出典は確認中です。</p>'}
    ${negative.length ? `<details class="pending-evidence"><summary>調べた範囲で条件外（${negative.length}件）</summary><dl>${negative.map((tag) => `<div><dt>${escape(data.tagLabels[tag])}</dt><dd>${escape(station.evidence[tag].text)} <small>確認 ${escape(station.evidence[tag].checkedAt)}</small></dd></div>`).join("")}</dl><p>新設・小規模施設までの完全な網羅を保証するものではありません。</p></details>` : ""}
    ${pending.length ? `<details class="pending-evidence"><summary>確認待ちの条件（${pending.length}件）</summary><p>${pending.map((tag) => escape(data.tagLabels[tag])).join("・")}</p><p>施設の規模や入口までの経路などを確認中です。候補に含まれないことは、その施設が存在しないという意味ではありません。</p></details>` : ""}
    <div class="data-note">1K参考相場：<strong>${station.rent1k.toFixed(2)}万円</strong>（${escape(station.rentCheckedAt)}確認）。<a href="${escape(station.rentSourceUrl)}" rel="external noopener">HOME’Sの駅別出典</a> <details class="rent-method"><summary>相場の算出方法</summary><p>${escape(station.rentMethod)}</p></details> · <a href="/criteria/">判定基準</a> · <a href="/data-status/">全駅の確認状況</a></div>
  </section>`;
}
