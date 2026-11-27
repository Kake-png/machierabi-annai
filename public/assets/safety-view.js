import { SAFETY_DATA } from "./safety-data.js?v=2";

// 駅ページの「治安の数字」の章。画面(app.js)と静的HTML(build.mjs)で同じ関数を使う。
// 数字は警視庁が公開した町丁別の認知件数を、駅から半径800mで数え直したもの。人口では割らない。
const ITEMS = [
  { key: "home", label: "住まいの被害", scope: "空き巣・忍込み・居空き" },
  { key: "street", label: "暴力・ひったくり", scope: "強盗・暴行・傷害・ひったくり" },
  { key: "bike", label: "自転車盗", scope: "自転車の盗難" }
];

export const safetyEntryFor = (station, data = SAFETY_DATA) =>
  data.pilot.includes(station.slug) ? data.stations[station.slug] || null : null;

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
  if (!entry) return "";
  const rows = ITEMS.map(({ key, label, scope }) => {
    const item = entry[key];
    return `<li class="safety-row"><div class="safety-grade" aria-label="${escapeHtml(label)}は${item.grade}ランク"><span>${item.grade}</span></div><div class="safety-body"><h3>${escapeHtml(label)}<small>${escapeHtml(scope)}</small></h3><p class="safety-count"><strong>年平均${countText(item.n)}件</strong><span>${escapeHtml(frequencyText(item.n, data.years.length))}</span></p><p class="safety-rank">${escapeHtml(rankText(item, data.stationCount))}</p></div></li>`;
  }).join("");
  return `<section class="content-section safety-section" id="safety"><h2>治安の数字</h2><p class="safety-lead">${escapeHtml(station.name)}駅から半径${data.radiusM}m（徒歩10分ほど）で、警察が認知した件数の年平均です（${data.years[0]}〜${data.years[data.years.length - 1]}年の${data.years.length}年分）。</p><div class="safety-premise"><h3>読む前に：同じ人口でも、土地の使われ方で件数は変わります</h3><p>駅前に飲食店街・オフィス・商業施設がある駅は、昼も夜も人が集まるため、住んでいる人の割合が同じでも件数が多く出る傾向があります。住宅地が中心の駅は、人の出入りが少ない分、件数が少なく出ます。この章は、街の使われ方の違いを含めた「件数の多さ」を並べたもので、住む人ひとりひとりの被害の起こりやすさを示すものではありません。</p></div><ul class="safety-list">${rows}</ul><p class="safety-legend">A〜Eは東京の掲載${data.stationCount}駅の中での位置です。Aが件数の少ない側、Eが多い側で、各ランクにおよそ5分の1の駅が入ります。良し悪しの判定ではありません。</p><p class="safety-note">屋内での暴行・傷害も含み、場所の区別はありません。出典：警視庁「区市町村の町丁別、罪種別及び手口別認知件数」（${data.years[0]}〜${data.years[data.years.length - 1]}年）。町丁の代表点が駅から${data.radiusM}m以内にあるものを合計しています。</p></section>`;
};
