import { SAFETY_DATA } from "./safety-data.js?v=3";

// 駅ページの「治安の数字」の章。画面(app.js)と静的HTML(build.mjs)で同じ関数を使う。
// 数字は警視庁が公開した町丁別の認知件数を、駅から半径800mで数え直したもの。人口では割らない。
const ITEMS = [
  { key: "home", label: "住まいの被害", scope: "空き巣・忍込み・居空き" },
  { key: "street", label: "暴力・ひったくり", scope: "強盗・暴行・傷害・ひったくり" },
  { key: "bike", label: "自転車盗", scope: "自転車の盗難" }
];

export const safetyEntryFor = (station, data = SAFETY_DATA) => data.stations[station.slug] || null;

// 東京都以外の駅。県警は町丁ごとの件数を（同じ罪種の範囲では）公開していないため、東京の駅と同じ方法では数えられない。
const PREFECTURE_POLICE = [
  [/神奈川|横浜|川崎/u, "神奈川県警察"],
  [/千葉|船橋|市川|松戸/u, "千葉県警察"],
  [/埼玉|蕨|戸田/u, "埼玉県警察"]
];
const policeFor = (station) => PREFECTURE_POLICE.find(([pattern]) => pattern.test(station.area || ""))?.[1] || null;

// 年平均の件数を、日常の感覚に近い言い方にする。
export const countText = (n) => (n >= 10 ? String(Math.round(n)) : String(n.toFixed(1)).replace(/\.0$/, ""));

export const frequencyText = (n, years = 3) => {
  if (n <= 0) return `${years}年間に1件もありません`;
  if (n >= 24) return `1か月に${Math.round(n / 12)}件ほど`;
  if (n >= 12) return "1か月に1件ほど";
  const months = Math.round(12 / n);
  if (months <= 1) return "1か月に1件ほど";
  if (months === 12) return "1年に1件";
  if (months >= 24) return `${Math.round(months / 12)}年に1件ほど`;
  return `${months}か月に1件ほど`;
};

const rankText = (item, total) => {
  const first = item.n === 0 ? "件数が最も少ない側" : `${total}駅中、少ない方から${item.rank}番目`;
  return item.ties > 1 && item.n > 0 ? `${first}（同じ件数の駅が${item.ties}駅）` : first;
};

export const safetyHtml = (station, escapeHtml, data = SAFETY_DATA) => {
  const entry = safetyEntryFor(station, data);
  if (!entry) {
    const police = policeFor(station);
    if (!police) return "";
    return `<section class="content-section safety-section" id="safety"><h2>治安の数字</h2><p class="safety-lead">${escapeHtml(station.name)}駅は、東京の掲載駅と同じ方法では数えられないため、件数とランクを出していません。</p><div class="safety-premise"><h3>理由：駅のまわりだけの件数が公開されていません</h3><p>東京の駅は、警視庁が町丁（「◯◯一丁目」の単位）ごとに公開している件数を、駅から半径${data.radiusM}mで合計しています。調べた範囲では、${escapeHtml(police)}が公開している空き巣・暴行などの件数は市区町村ごとの合計で、駅のまわりだけを取り出すことができません。市区町村全体の件数を駅の数字として載せると、東京の駅との比較を誤らせるため、載せていません。</p></div><p class="safety-note">市区町村ごとの件数は、${escapeHtml(police)}の犯罪統計で確認できます。</p></section>`;
  }
  const partial = entry.partial?.length ? entry.partial : null;
  const rows = ITEMS.map(({ key, label, scope }) => {
    const item = entry[key];
    if (partial) return `<li class="safety-row"><div class="safety-grade is-none" aria-label="${escapeHtml(label)}はランクなし"><span>—</span></div><div class="safety-body"><h3>${escapeHtml(label)}<small>${escapeHtml(scope)}</small></h3><p class="safety-count"><strong>年平均${countText(item.n)}件</strong><span>東京都側だけの件数</span></p><p class="safety-rank">都県境にかかるため、順位とランクは出していません</p></div></li>`;
    return `<li class="safety-row"><div class="safety-grade" aria-label="${escapeHtml(label)}は${item.grade}ランク"><span>${item.grade}</span></div><div class="safety-body"><h3>${escapeHtml(label)}<small>${escapeHtml(scope)}</small></h3><p class="safety-count"><strong>年平均${countText(item.n)}件</strong><span>${escapeHtml(frequencyText(item.n, data.years.length))}</span></p><p class="safety-rank">${escapeHtml(rankText(item, data.stationCount))}</p></div></li>`;
  }).join("");
  return `<section class="content-section safety-section" id="safety"><h2>治安の数字</h2><p class="safety-lead">${escapeHtml(station.name)}駅から半径${data.radiusM}m（徒歩10分ほど）で、警察が認知した件数の年平均です（${data.years[0]}〜${data.years[data.years.length - 1]}年の${data.years.length}年分）。</p>${partial ? `<p class="safety-border">半径${data.radiusM}mの一部が${escapeHtml(partial.join("・"))}にかかります。その部分は警視庁のデータに含まれないため、件数は実際より少なく出ます。ほかの駅と比べられないので、順位とランクは出していません。</p>` : ""}<div class="safety-premise"><h3>読む前に：同じ人口でも、土地の使われ方で件数は変わります</h3><p>駅前に飲食店街・オフィス・商業施設がある駅は、昼も夜も人が集まるため、住んでいる人の割合が同じでも件数が多く出る傾向があります。住宅地が中心の駅は、人の出入りが少ない分、件数が少なく出ます。この章は、街の使われ方の違いを含めた「件数の多さ」を並べたもので、住む人ひとりひとりの被害の起こりやすさを示すものではありません。</p></div><ul class="safety-list">${rows}</ul>${partial ? "" : `<p class="safety-legend">A〜Eは東京の掲載${data.stationCount}駅の中での位置です。Aが件数の少ない側、Eが多い側で、各ランクにおよそ5分の1の駅が入ります。良し悪しの判定ではありません。</p>`}<p class="safety-note">屋内での暴行・傷害も含み、場所の区別はありません。町丁の代表点が駅から${data.radiusM}m以内にあるものを合計しています。</p><p class="safety-note">出典：警視庁「区市町村の町丁別、罪種別及び手口別認知件数」（${data.years[0]}〜${data.years[data.years.length - 1]}年）、東京都、<a href="https://creativecommons.org/licenses/by/4.0/deed.ja" rel="noopener">クリエイティブ・コモンズ・ライセンス 表示4.0 国際</a>。町丁の位置：Geolonia「住所データ」、<a href="https://creativecommons.org/licenses/by/4.0/deed.ja" rel="noopener">CC BY 4.0</a>。いずれも当サイトが駅ごとに集計・加工しています。</p></section>`;
};
