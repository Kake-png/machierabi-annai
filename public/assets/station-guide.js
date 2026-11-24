// First SEO editorial cohort. Copy is based on existing station research, not new safety ratings.
// Rent remains linked to the current verified station data.
const entries = {
  chitosekarasuyama: ["京王線・商店街・図書館", "京王線沿線で商店街を日常の買い物に使いたい人や、図書館を身近に利用したい人に向いた街です。駅前にはえるもーる烏山があり、烏山図書館へは徒歩約2分（経路推計）。利用路線は京王線のみなので、通勤先への経路や深夜の買い物も確認しておきましょう。"],
  gotanda: ["3路線・買い物・帰宅経路", "山手線・浅草線・池上線を使い分けたい人にとって交通の選択肢が多い街です。駅周辺で外食や日常の買い物ができる一方、繁華街、川沿い、坂上の住宅地では夜の環境が異なります。物件を選ぶ際は利用する出口と帰宅経路を合わせて確認しましょう。"],
  kitasenju: ["交通・商業施設・河川敷", "複数路線で通勤先を選びたい人や、駅前の商業施設と商店街を使い分けたい人に向いた街です。マルイやルミネ、宿場町通り商店街があり、隅田川・荒川の河川敷も暮らしの候補になります。深夜営業の食品店は調査範囲で条件に合う店を確認できていないため、帰宅時間に合わせて確認しましょう。"],
  togoshiginza: ["商店街・池上線・浅草線", "帰宅途中に商店街で買い物をしたい人に向いた街です。東急池上線の戸越銀座駅と都営浅草線の戸越駅を徒歩で使い分けられます。長い商店街のどの区間に住むかで最寄り駅や買い物の動線が変わるため、物件まで実際に歩いて確認しましょう。"],
  kameari: ["千代田線直通・買い物・映画館", "常磐線各駅停車から千代田線へ直通でき、駅前の買い物や映画を日常に取り入れたい人に向いた街です。アリオ亀有や駅前の商業施設、ゆうろーど商店街があります。東京・品川方面への直通を重視する場合は乗換経路も確認しておきましょう。"],
  numabe: ["多摩川・散歩・自転車", "多摩川の河川敷で散歩やサイクリングを楽しみたい人に向いた街です。河川敷まで徒歩約3分（調査時の目安）で、大田図書館も徒歩圏にあります。利用路線は東急多摩川線のみで、深夜の買い物や衣料品の購入先は事前に確認しておくとよいでしょう。"],
  mizue: ["駅前の買い物・都営新宿線", "駅前で食品や衣料品などの買い物を済ませたい人に向いた街です。ラパーク瑞江やドン・キホーテがあり、江戸川の自転車歩行者専用道路へも自転車でアクセスできます。都営新宿線のみを利用するため通勤経路を確認し、図書館や大きな公園までの距離も考慮しましょう。"],
  heiwajima: ["京急線・公園・映画館", "京急本線で品川や羽田空港方面へ移動したい人、公園や映画館を休日に利用したい人に向いた街です。平和の森公園やシネマサンシャイン平和島が徒歩圏にあります。衣料品店や深夜営業の食品店は調査範囲の徒歩条件に合う店を確認できていないため、生活時間に合わせて確認しましょう。"],
  fudomae: ["目黒線・食品店・公園", "東急目黒線を利用しながら、駅前で食品を買い、休日に公園や川沿いを歩きたい人に向いた街です。林試の森公園や目黒川が徒歩圏にあります。別路線の駅までの距離や、衣料品・映画などのためにどこへ出かけるかも考えておきましょう。"],
  ryogoku: ["総武線・大江戸線・隅田川", "総武線各駅停車や大江戸線を使い、休日に隅田川沿いの散歩を楽しみたい人に向いた街です。両国国技館や江戸NORENが身近にあり、錦糸町へも総武線で移動できます。衣料品店や大型公園・映画館へのアクセスは、普段の過ごし方に合わせて確認しましょう。"]
};
export const pilotStationSlugs = Object.freeze(Object.keys(entries));
export function stationGuide(station) {
  const entry = entries[station.slug];
  if (!entry) return null;
  const [focus, intro] = entry;
  const rent = station.rentStatus === "verified" && Number.isFinite(station.rent1k)
    ? `1K参考家賃${station.rent1k.toFixed(2)}万円。` : "";
  return {
    intro,
    title: `${station.name}駅の住みやすさ・家賃｜${focus}｜街えらび案内所`,
    description: `${station.name}駅周辺の住みやすさを、${focus}などから紹介。${rent}${intro.split("。")[0]}。条件別の根拠・出典も掲載しています。`
  };
}
export function relatedGuideStations(station, stations) {
  const distance = (a,b) => Math.hypot((a.lng-b.lng)*Math.cos((a.lat+b.lat)/2*Math.PI/180), a.lat-b.lat);
  return stations.filter(candidate => candidate.slug !== station.slug)
    .map(candidate => ({candidate, score: candidate.tags.filter(tag => station.tags.includes(tag)).length, distance: distance(station,candidate)}))
    .sort((a,b) => b.score-a.score || a.distance-b.distance)
    .slice(0,3).map(({candidate})=>candidate);
}
