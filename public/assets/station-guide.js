// First SEO editorial cohort. Copy is based on existing station research, not new safety ratings.
// Rent remains linked to the current verified station data.
const entries = {
  chitosekarasuyama: ["京王線・商店街・図書館", "駅前に商店街のえるもーる烏山があり、烏山図書館まで徒歩約2分（経路推計）。使える路線は京王線だけです。通勤先までの経路と、深夜に食品を買える店があるかは物件ごとに確かめてください。"],
  gotanda: ["3路線・買い物・帰宅経路", "山手線・浅草線・池上線の3路線が使えます。駅の周りで外食も日常の買い物も済みます。繁華街側・川沿い・坂の上の住宅地で夜の雰囲気がかなり違うので、物件を選ぶときは使う出口と帰り道を一緒に見てください。"],
  kitasenju: ["交通・商業施設・河川敷", "5路線が使えるので、通勤先に合わせて路線を選べます。駅前にマルイとルミネ、宿場町通り商店街があり、隅田川・荒川の河川敷も歩いて行けます。深夜まで開いている食品店は、調べた範囲の徒歩圏では見つかりませんでした。"],
  togoshiginza: ["商店街・池上線・浅草線", "東急池上線の戸越銀座駅と都営浅草線の戸越駅を、歩いて使い分けられます。帰り道に長い商店街を通って買い物できます。商店街のどのあたりに住むかで最寄り駅と買い物の動線が変わるので、物件から駅まで実際に歩いてみてください。"],
  kameari: ["千代田線直通・買い物・映画館", "常磐線各駅停車がそのまま千代田線に乗り入れます。駅前にアリオ亀有などの商業施設とゆうろーど商店街があり、買い物と映画は駅の近くで済みます。東京・品川方面へは直通しないので、乗り換えが必要です。"],
  numabe: ["多摩川・散歩・自転車", "多摩川の河川敷まで徒歩約3分（調査時の目安）で、散歩やサイクリングにすぐ出られます。大田図書館も歩いて行けます。使える路線は東急多摩川線だけです。深夜に開いている店と、服を買える店は近くにあるか確かめてください。"],
  mizue: ["駅前の買い物・都営新宿線", "駅前のラパーク瑞江とドン・キホーテで、食品も衣料品も買えます。江戸川の自転車歩行者専用道路へは自転車で行けます。使える路線は都営新宿線だけです。図書館までは徒歩18分、大きな公園までは徒歩約20分です。"],
  heiwajima: ["京急線・公園・映画館", "京急本線で品川へも羽田空港へも出られます。平和の森公園とシネマサンシャイン平和島は歩いて行けます。衣料品店と深夜営業の食品店は、調べた範囲の徒歩圏では見つかりませんでした。"],
  fudomae: ["目黒線・食品店・公園", "東急目黒線の駅で、駅前で食品が買えます。休日は林試の森公園や目黒川沿いを歩いて行けます。ほかの路線の駅（五反田・目黒）までは徒歩16分。徒歩7分圏に服の店はなく、映画館も歩いて行ける範囲では見つかりませんでした。"],
  ryogoku: ["総武線・大江戸線・隅田川", "総武線各駅停車と大江戸線が使えます。隅田川沿いの散歩道、両国国技館、江戸NORENが近くにあり、錦糸町へは総武線で1駅です。衣料品の店は少なく、大きな公園と映画館は歩いて行ける範囲では見つかりませんでした。"]
};
export const pilotStationSlugs = Object.freeze(Object.keys(entries));
// All stations use their original editorial research; the ten edited entries remain explicit overrides.
const themes = {
  street:"商店街", shopping:"買い物", library:"図書館", large_bookstore:"大型書店", cinema:"映画館", reuse:"リユース店", park:"公園", river:"川沿い", cycle:"サイクリング", sea:"海・港", view:"夜景", late:"深夜の買い物", drinks:"飲み歩き", expressway:"高速道路", airport:"羽田アクセス", shinkansen:"新幹線アクセス", racecourse:"競馬場アクセス", multi:"複数路線"
};
const order = Object.keys(themes);
function researchEntry(station) {
  const labels = order.filter(tag => station.evidence[tag]?.status === "verified" && station.evidence[tag]?.value === true).slice(0,3).map(tag=>themes[tag]);
  const focus = labels.length ? labels.join("・") : "交通・生活環境";
  const original = station.editorialSummary?.trim() || station.summary;
  // Preserve the individual research summary rather than invent new factual claims.
  // Avoid duplicating rent (which is separately sourced) or obsolete comparisons from small batches.
  const caution = (station.cautions || []).find(s=>typeof s==="string" && s.trim() && !/家賃|相場|万円|最も|未確定|未確認/.test(s));
  const intro = original + (caution && !original.includes(caution) ? "住む前の確認点："+caution.replace(/[。！!]+$/u,"")+"。" : "");
  return [focus,intro];
}
export function stationGuide(station) {
  const [focus, intro] = entries[station.slug] || researchEntry(station);
  const rent = station.rentStatus === "verified" && Number.isFinite(station.rent1k)
    ? `1K参考家賃${station.rent1k.toFixed(2)}万円。` : "";
  return {
    intro,
    title: `${station.name}駅の住みやすさ・家賃｜${focus}｜街えらび案内所`,
    description: `${station.name}駅周辺の住みやすさを、${focus}などから紹介。${rent}${intro.split("。").filter(Boolean).slice(0,2).join("。")}。`
  };
}
export function relatedGuideStations(station, stations) {
  const distance = (a,b) => Math.hypot((a.lng-b.lng)*Math.cos((a.lat+b.lat)/2*Math.PI/180), a.lat-b.lat);
  return stations.filter(candidate => candidate.slug !== station.slug)
    .map(candidate => ({candidate, score: candidate.tags.filter(tag => station.tags.includes(tag)).length, distance: distance(station,candidate)}))
    .sort((a,b) => b.score-a.score || a.distance-b.distance)
    .slice(0,3).map(({candidate})=>candidate);
}

// 似ている駅カードの中身。同一文面になりがちな自動要約の代わりに、
// 家賃の差・共通の条件数・その駅にだけある条件／ない条件を出す。
export function relatedCardFacts(station, candidate) {
  const shared = candidate.tags.filter((tag) => station.tags.includes(tag));
  const extra = candidate.tags.filter((tag) => !station.tags.includes(tag));
  const missing = station.tags.filter((tag) => !candidate.tags.includes(tag));
  const diff = Math.round((candidate.rent1k - station.rent1k) * 100) / 100;
  return { rent: candidate.rent1k, diff, shared, extra, missing };
}
export function relatedCardBody(station, candidate, tagLabels, escape) {
  const f = relatedCardFacts(station, candidate);
  const diffText = Math.abs(f.diff) < 0.05 ? `${escape(station.name)}とほぼ同じ` : `${escape(station.name)}より${Math.abs(f.diff).toFixed(2)}万円${f.diff < 0 ? "安い" : "高い"}`;
  const names = (tags) => tags.slice(0, 3).map((tag) => escape(tagLabels[tag])).join("・") + (tags.length > 3 ? ` ほか${tags.length - 3}件` : "");
  return `<dl class="related-facts">`
    + `<div><dt>1K家賃の目安</dt><dd><strong>${f.rent.toFixed(2)}</strong>万円<small>${diffText}</small></dd></div>`
    + `<div><dt>共通の条件</dt><dd><strong>${f.shared.length}</strong>件</dd></div>`
    + (f.extra.length ? `<div class="related-diff"><dt>こちらにもある</dt><dd>${names(f.extra)}</dd></div>` : "")
    + (f.missing.length ? `<div class="related-diff"><dt>こちらにはない</dt><dd>${names(f.missing)}</dd></div>` : "")
    + `</dl>`;
}
