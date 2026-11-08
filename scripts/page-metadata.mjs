// Editorial choices use confirmed station conditions, rather than guessed rankings.
const themes = {
  movies: ['映画館が近い街・駅を探す｜アクセスと暮らしの比較', '映画館を日常的に利用したい人へ。確認済みの劇場へのアクセスと駅ごとの特徴、1K参考家賃を比較。東京・神奈川・千葉の掲載駅から住む街を探せます。'],
  books: ['本屋・図書館が近い街・駅を探す｜選び方と比較', '本屋と図書館のどちらをよく使う？徒歩圏に施設がある掲載駅を、具体的な施設とアクセス、1K参考家賃で比較。両方ある駅も探せます。'],
  cycling: ['サイクリングコースに出やすい街・駅を探す', '週末に長いコースへ走り出したい人へ。整備されたサイクリングコースの入口へのアクセス、駅の特徴、1K参考家賃を比べて住む街を探せます。'],
  'night-walk': ['夜景を楽しめる街・駅を探す｜場所と利用時間', '夜景スポットへ行きやすい街を探す人へ。水辺や展望地点の場所、駅からのアクセス、夜に利用できる時間の注意点を掲載駅ごとに紹介します。'],
  strolling: ['散歩が楽しい街・駅を探す｜公園・水辺・商店街', '公園や川沿い、海・港、商店街を歩きたい人へ。散歩先の種類と駅からのアクセスを比べ、東京・神奈川・千葉の掲載駅から暮らす街を探せます。'],
  drinking: ['飲み歩きできる街・駅を探す｜酒場街へのアクセス', '街を歩いて店を選べる酒場街を探す人へ。自駅の徒歩圏と直通で行ける近隣駅を分けて紹介。行き先の根拠と1K参考家賃を駅ごとに確認できます。'],
  'weekend-mobility': ['週末旅行に出やすい街・駅を探す｜羽田・新幹線駅・高速', '飛行機、新幹線、車で週末に出かけたい人へ。羽田空港・新幹線停車駅への直通と、高速道路入口へのアクセスを別々に見て掲載駅を比較します。'],
  'car-life': ['高速入口に出やすい街・駅を探す｜車の経路推計', '車で遠出しやすい街を探す人へ。駅近くの車道から高速入口までの渋滞を含まない経路推計をもとに、15分以内の掲載駅と注意点を紹介します。']
};
const stationChoices = {
 oimachi:['映画館・夜景','cinema','view'], omori:['映画館・図書館','cinema','library'], kamata:['サイクリング・図書館','cycle','library'],
 osaki:['図書館・夜景','library','view'], gotanda:['図書館・夜景','library','view'], musashikoyama:['図書館・公園','library','park'],
 togoshiginza:['図書館・商店街','library','street'], nakanobu:['図書館・商店街','library','street'], hatanodai:['図書館・公園','library','park'],
 ookayama:['図書館・公園','library','park'], jiyugaoka:['図書館・夜景','library','view'], 'keikyu-kamata':['サイクリング・図書館','cycle','library'],
 kawasaki:['映画館・サイクリング','cinema','cycle'], musashikosugi:['サイクリング・図書館','cycle','library'], yokohama:['映画館・夜景','cinema','view']
};
export function themeMetadata(id) { if (!themes[id]) throw Error(`Missing theme metadata: ${id}`); return {title:themes[id][0],description:themes[id][1]}; }
export function stationMetadata(station) {
  const selected=["cinema","cycle","library","park","view","street","shopping"].filter(t=>station.tags.includes(t)).slice(0,2);
  const labels={cinema:"映画館",cycle:"サイクリング",library:"図書館",park:"公園",view:"夜景",street:"商店街",shopping:"買い物"};
  const choice=stationChoices[station.slug] || [selected.map(t=>labels[t]).join("・") || "暮らし",...selected];
  const [label,...tags]=choice;
  for(const tag of tags) if(!station.tags.includes(tag)||station.evidence[tag]?.status!=='verified'||station.evidence[tag]?.value!==true) throw Error(`${station.slug}: unverified metadata ${tag}`);
  const description = `${station.name}駅周辺で住む街を探す人へ。${station.summary.replace(/施設名・アクセス・確認日は各条件の根拠で確認できます。$/, '')}交通・1K参考家賃と条件の根拠・出典を確認できます。`;
  return {title:`${station.name}駅の住みやすさ｜${label}を楽しむ街探し｜街えらび案内所`,description};
}
