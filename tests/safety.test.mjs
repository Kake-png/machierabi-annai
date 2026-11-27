import assert from "node:assert/strict";
import test from "node:test";
import { SAFETY_DATA } from "../public/assets/safety-data.js";
import { countText, frequencyText, safetyHtml, safetyEntryFor } from "../public/assets/safety-view.js";

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

test("件数を日常の言い方に直す", () => {
  assert.equal(frequencyText(0), "3年間に1件もありません");
  assert.equal(frequencyText(1), "1年に1件");
  assert.equal(frequencyText(3), "4か月に1件ほど");
  assert.equal(frequencyText(12), "1か月に1件ほど");
  assert.equal(frequencyText(221), "1か月に18件ほど");
  assert.equal(frequencyText(0.3), "3年に1件ほど");
  assert.equal(frequencyText(1.7), "7か月に1件ほど");
  assert.equal(countText(3), "3");
  assert.equal(countText(4.3), "4.3");
  assert.equal(countText(69.3), "69");
});

test("試作の駅だけに章を出し、それ以外は何も出さない", () => {
  assert.match(safetyHtml({ slug: "ikebukuro", name: "池袋" }, escapeHtml), /id="safety"/);
  assert.equal(safetyHtml({ slug: "shinagawa", name: "品川" }, escapeHtml), "");
});

test("東京の117駅すべてにA〜Eのランクと件数が入っている", () => {
  const entries = Object.values(SAFETY_DATA.stations);
  assert.equal(entries.length, SAFETY_DATA.stationCount);
  for (const entry of entries) {
    for (const key of ["home", "street", "bike"]) {
      assert.match(entry[key].grade, /^[A-E]$/);
      assert.ok(Number.isFinite(entry[key].n) && entry[key].n >= 0);
    }
  }
});

test("章に『安全』『危険』の語を使わず、出典と判定ではない旨を書く", () => {
  const html = safetyHtml({ slug: "kitasenju", name: "北千住" }, escapeHtml);
  assert.doesNotMatch(html, /安全|危険|治安が(?:良|悪)/);
  assert.match(html, /警視庁/);
  assert.match(html, /良し悪しの判定ではありません/);
  assert.ok(safetyEntryFor({ slug: "kitasenju" }));
  // 土地の使われ方の説明は、数字の前（章の頭）に置く。
  assert.ok(html.indexOf("土地の使われ方") < html.indexOf('class="safety-list"'));
});
