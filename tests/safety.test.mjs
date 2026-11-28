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

test("東京の駅には件数とランク、東京以外の駅には数えられない理由を出す", () => {
  assert.match(safetyHtml({ slug: "shinagawa", name: "品川", area: "東京都港区" }, escapeHtml), /class="safety-grade"/);
  const outside = safetyHtml({ slug: "kawasaki", name: "川崎", area: "川崎市川崎区" }, escapeHtml);
  assert.match(outside, /id="safety"/);
  assert.match(outside, /神奈川県警察/);
  assert.doesNotMatch(outside, /class="safety-grade"/);
  assert.equal(safetyHtml({ slug: "nowhere", name: "架空", area: "大阪府" }, escapeHtml), "");
});

test("都県境にかかる駅は、件数だけを出して順位とランクを出さない", () => {
  const html = safetyHtml({ slug: "futakotamagawa", name: "二子玉川", area: "東京都世田谷区" }, escapeHtml);
  assert.match(html, /神奈川県川崎市高津区/);
  assert.match(html, /東京都側だけの件数/);
  assert.doesNotMatch(html, /safety-grade" aria-label="[^"]*は[A-E]ランク/);
  assert.equal(SAFETY_DATA.stations.futakotamagawa.street.grade, undefined);
});

test("都県境の駅を除く東京の駅すべてにA〜Eのランクと件数が入っている", () => {
  const entries = Object.values(SAFETY_DATA.stations).filter((entry) => !entry.partial);
  assert.equal(entries.length, SAFETY_DATA.stationCount);
  assert.equal(Object.keys(SAFETY_DATA.stations).length, 117);
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

test("ランクは東京の中央値に対する倍率の固定しきい値で決まり、順位も残る", () => {
  const steps = SAFETY_DATA.ratioSteps;
  assert.deepEqual(steps, [0.5, 0.8, 1.25, 2]);
  for (const [slug, entry] of Object.entries(SAFETY_DATA.stations)) {
    if (entry.partial) continue;
    for (const key of ["home", "street", "bike"]) {
      const item = entry[key];
      const expected = "ABCDE"[steps.filter((t) => item.n / SAFETY_DATA.medians[key] >= t).length];
      assert.equal(item.grade, expected, `${slug} ${key}`);
      assert.ok(Number.isInteger(item.rank) && item.rank >= 1, `${slug} ${key} rank`);
    }
  }
  const html = safetyHtml({ slug: "kitasenju", name: "北千住", area: "東京都足立区" }, (x) => x);
  assert.match(html, /東京の駅の中央値（年/);
  assert.match(html, /112駅中、少ない方から/);
});
