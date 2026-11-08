// Theme articles use verified station evidence for examples and full candidate lists.
export function themeContent(theme, data, escape) {
  const trip = [['airport','飛行機で出かける'],['shinkansen','新幹線で出かける'],['expressway','車で出かける']];
  const selected = (s, tag) => s.tags.includes(tag) && s.evidence[tag]?.status === 'verified';
  const articles = {
    books: {
      lead: '本を買う日も、借りる日も。駅からの帰り道に本と出会える街を探します。',
      heading: '本屋と図書館、どちらをよく使う？',
      paragraphs: ['図書館は借りて読む場所、大型本屋は新刊や専門書を見比べる場所です。両方を重視するなら、片方だけ近い駅と区別して候補を見てください。このページにはどちらか一方を満たす駅も含まれます。', '掲載条件は図書館が徒歩15分以内、大型本屋が徒歩10分以内。近さだけでなく、駅ページで施設名、売場の根拠、利用する出口を確かめられます。開館・営業時間や在庫は訪問前に施設で確認してください。'],
      points: ['両方ほしいなら、地図の「本屋と図書館の両方」で絞る', '一方で十分なら、下の各駅に付いた条件ラベルを見る', '帰宅途中の動線は、駅ページの施設と出口を確認する'],
      picks: [['musashisakai','図書館と本屋の両方'],['oimachi','駅直結の本屋'],['kichijoji','大型本屋と図書館']]
    },
    movies: {
      lead: '思い立った日に映画を観に行ける距離か。映画館を日常の選択肢にしたい人向けの街探しです。',
      heading: '映画館の「近さ」と街の使い方を分けて考える',
      paragraphs: ['このページは、駅から利用できる映画館を確認した掲載駅を集めています。映画館があることと、観たい作品が上映されることは別です。よく観る作品や終映後の帰宅時間も合わせて考えると、住む場所として比べやすくなります。', '駅の詳細には確認した施設とアクセスの根拠があります。上映作品、レイトショー、営業状況は日ごとに変わるため、実際に出かける前に劇場の案内をご確認ください。'],
      points: ['駅と劇場の位置関係を見る', '映画の前後に使いたい施設も駅ページで確認する', '上映・終映時刻は劇場の当日案内を見る'],
      picks: [['oimachi','駅直結の映画館'],['kawasaki','東西の映画館'],['kichijoji','駅近くの映画館']]
    },
    drinking: {
      lead: '店が数軒あるだけでなく、街を歩きながら一軒ずつ選べる場所を探します。',
      heading: '自駅の酒場街か、近隣駅の酒場街か',
      paragraphs: ['飲食店の件数だけでは、飲み歩く楽しさは測れません。ここでは通りや街として回遊できる酒場街を対象にしています。自駅の徒歩圏にある場合と、直通10分以内の近隣駅へ出かける場合が混在するため、各駅の理由で行き先を確認してください。', '近隣駅の酒場街を利用する駅では、帰りの終電や徒歩距離も暮らしやすさに関わります。店の営業日・営業時間は変わるため、訪問前に各店の最新案内をご確認ください。'],
      points: ['駅ページで酒場街が自駅か近隣駅かを見る', '街の範囲や回遊の根拠を確認する', '夜の帰路・利用する路線も合わせて比べる'],
      picks: [['kamata','自駅・バーボンロード'],['akabane','一番街とOK横丁'],['shimokitazawa','街を巡る酒場群']]
    },
    strolling: {
      lead: '大きな公園、水辺、商店街。歩きたい景色から暮らす駅を選びます。',
      heading: '「散歩しやすい」は一つの条件ではありません',
      paragraphs: ['このページには、公園、川・河原、海・港、商店街のいずれかを確認した駅を載せています。全ての駅が四つを満たすわけではありません。緑の中で過ごしたいのか、水辺を歩きたいのか、買い物も兼ねたいのかで候補が変わります。', '公園は面積と徒歩圏、川や海は実際に歩ける場所へのアクセスを区別して記録しています。水辺の一部は自転車での到達を含むため、徒歩だけを希望する場合は駅の詳細を確認してください。'],
      points: ['公園・川・海・商店街のラベルから目的を決める', '駅ページで目的地と到達方法を確認する', '開園時間や通行条件を現地の案内で確認する'],
      picks: [['omori','公園と商店街'],['tamagawa','公園と多摩川'],['musashisakai','緑道と商店街']]
    },
    cycling: {
      lead: '週末に長いコースへ走り出しやすい駅を探します。',
      heading: 'コースまでの道も、住む場所選びの一部',
      paragraphs: ['対象は長く続く整備されたサイクリングコースです。短い公園周回や一般車道を走るだけの観光ルートとは分けています。駅からコースの入口まで自転車で向かう目安は15分以内です。', 'コース自体の長さと、家から走り始めるまでのアクセスは別の話です。駅ページで採用したコース名と接続地点を見て、実際に住む候補地からの道や横断箇所を確かめてください。'],
      points: ['採用したコースと入口を確認する', '途中の橋や押し歩き区間にも目を通す', '駐輪・保管場所は物件ごとに確認する'],
      picks: [['numabe','多摩川沿いの長いコース'],['tsurumi','鶴見川沿いのコース'],['shinkoiwa','荒川河川敷のコース']]
    },
    'night-walk': {
      lead: '帰り道の延長に、夜の景色を楽しめる場所がある街を探します。',
      heading: '夜景の質と、夜に利用できる時間を確認する',
      paragraphs: ['水辺の灯りも、一般公開の展望地点も対象です。駅から徒歩20分以内という距離に加えて、夜景を楽しめる場所としての根拠を確認しています。小さな橋や単に暗くなった公園だけを夜景スポットとは扱いません。', '展望施設には閉館時刻があり、屋外の水辺は天候や足元の状態が変わります。駅ページで場所と利用条件を確認し、実際の訪問前には施設や自治体の最新案内も見てください。'],
      points: ['水辺か展望施設か、見たい景色を選ぶ', '閉館時刻・季節による変更を確認する', '夜の帰路と足元を無理なく歩けるか考える'],
      picks: [['yokohama','水辺の夜景散歩'],['kawasaki','公開の展望ロビー'],['tamagawa','川越しの街の灯り']]
    },
    'weekend-mobility': {
      lead: '飛行機、新幹線、車。週末の出発方法から住む駅を考えます。',
      heading: '旅行の仕方で、便利な駅は変わる',
      paragraphs: ['羽田空港へ乗換なしで行けること、新幹線の停車駅へ乗換なしで行けること、高速道路入口まで車で出やすいことを別々に確認しています。候補駅の一覧は、三つのうち一つでも満たす駅を含みます。三つとも必要なら地図の絞り込みを使ってください。', '「新幹線駅へ直通」は新幹線そのものに乗換なしで乗れる意味ではありません。空港行きも便や乗り場を確認し、車の所要時間は交通状況で変わる点に注意してください。'],
      points: ['飛行機・新幹線・車のうち使う手段を選ぶ', '各手段の候補駅を見比べる', '路線、便、道路の方向を駅ページで確認する'],
      picks: [['oimachi','三つの手段を比較'],['kamata','羽田行きと品川方面'],['kawasaki','空港バスと新幹線駅方面']]
    },
    'car-life': {
      lead: '休日に車で出かけたい人へ、高速入口へのアクセスから駅を探します。',
      heading: '入口が近くても、実際の運転時間は変わる',
      paragraphs: ['このページは駅近くの車道から高速入口までの経路推計15分以内を目安にした掲載駅です。駅の出口から歩く時間や自宅からの運転時間ではありません。入口の方向やETC専用などの条件は駅ページの根拠で確認してください。', '所要時間には、渋滞を含まない経路推計と日時を指定した地図の予測が混在します。確認した日時や方法は駅ごとの根拠をご覧ください。休日に使うなら、出発時刻を指定した地図サービスでもう一度確認するのが実用的です。駐車場の確保や幹線道路への出やすさは物件の場所で変わります。'],
      points: ['向かいたい方向の入口か確認する', '使う日時の交通状況で所要時間を見直す', '物件からの出発経路と駐車場を別に確認する'],
      picks: [['oimachi','五反田入口方面'],['ogikubo','高井戸入口方面'],['kawasaki','川崎周辺の入口']]
    }
  };
  const introductions = {
    books:'駅の近くに本屋や図書館があると、読みたい本が決まっていない日も、帰り道に棚を眺められます。品ぞろえを比べたい人と、気軽に借りたい人では、選びたい街も変わります。',
    movies:'仕事帰りに一本観て帰る日も、休日に気になる作品を選ぶ日も。映画館が生活圏にあると、映画に行くためだけに遠出する必要がなくなります。',
    drinking:'飲み歩く街を選ぶとき、店の数だけでは雰囲気はわかりません。駅を降りてどんな通りを歩き、どんな店に立ち寄れそうか。街のまとまりから考えてみます。',
    strolling:'休日の散歩先は、公園の緑、水辺の開放感、店先を眺める商店街とさまざまです。毎日歩く街だからこそ、気分に合う景色を探してみましょう。',
    cycling:'自転車を出してからコースにたどり着くまでの道も、休日の走りやすさを左右します。多摩川、鶴見川、荒川を例に、川沿いへ出やすい駅を見てみましょう。',
    'night-walk':'水辺の灯りを歩きながら眺めるか、展望施設から街を見渡すか。夜景の楽しみ方は場所によって違います。帰り道に寄れる景色から、暮らす街を探します。',
    'weekend-mobility':'金曜の夜に旅へ出る、朝から車で遠出する。よく使う移動手段から考えると、休日の行き先と普段の住まい選びがつながります。',
    'car-life':'休日に車を出すなら、高速入口までのアクセスは住む場所を考える材料の一つ。方向の違う入口や駅周辺の道路にも目を向けながら候補を比べます。'
  };
  const article = articles[theme.id];
  if (!article) throw Error(`Missing theme article: ${theme.id}`);
  const mapLink = tags => {
    const params = new URLSearchParams({tags:tags.join(','),match:theme.matchMode === 'all' ? 'all' : 'any',themes:''});
    // Only preselect a hobby when its conditions exactly match the guide.
    const hobby = tags.length === 1 ? {cinema:'movies',cycle:'cycling',drinks:'drinks'}[tags[0]] : null;
    if (hobby) { params.set('hobbies',hobby); params.set('autoRequired',tags[0]); }
    return `/?${params}#atlas`;
  };
  const overall = {
    movies: {label: '映画館のある駅を地図で探す', tags: ['cinema'], hobby: 'movies'},
    cycling: {label: 'サイクリングの条件で地図から探す', tags: ['cycle'], hobby: 'cycling'},
    drinking: {label: '飲み歩きの条件で地図から探す', tags: ['drinks'], hobby: 'drinks'},
    books: {label: '本屋と図書館の両方を地図で探す', tags: ['large_bookstore','library'], hobby: 'reading', note: 'このページは、どちらか一方に該当する駅も紹介しています。'},
    'weekend-mobility': {label: '羽田・新幹線・高速道路のすべてを地図で探す', tags: ['airport','shinkansen','expressway'], hobby: 'travel', note: 'このページは、いずれか一つに該当する駅も紹介しています。'},
    'night-walk': {label: '夜景の条件で地図から探す', tags: ['view']},
    'car-life': {label: '高速道路の条件で地図から探す', tags: ['expressway']},
    strolling: {label: '公園・川・海・商店街のすべてを地図で探す', tags: ['park','river','sea','street'], note: 'このページは、いずれか一つに該当する駅も紹介しています。'}
  }[theme.id];
  if (!overall) throw Error(`Missing theme search link: ${theme.id}`);
  const overallParams = new URLSearchParams({tags: overall.tags.join(','), match:'all', themes:''});
  if (overall.hobby) { overallParams.set('hobbies', overall.hobby); overallParams.set('autoRequired', overall.tags.join(',')); }
  const overallLink = `<div class="theme-primary-search"><a class="theme-map-link theme-primary-map-link" href="/?${escape(overallParams.toString())}#atlas">${escape(overall.label)} →</a>${overall.note ? `<p>${escape(overall.note)}</p>` : ''}</div>`;
  const brief = (s, tag) => {
    const text = s.evidence[tag].text;
    if(tag === 'view' && s.slug === 'musashikosugi') return '東急スクエア4F展望デッキは駅直結。通常21時まで、12月〜3月は17時までのため夜景目的では季節に注意';
    if(tag === 'expressway') {
      const entry = text.match(/([\p{Script=Han}\p{Script=Katakana}ー]+入口)（([^）]+)）/u);
      return text;
    }
    if(tag === 'large_bookstore' && /取材|運営者資料|現行|候補を/.test(text.slice(0,35))) return '大型本屋の条件に該当。店舗・アクセスは駅の詳細へ';
    if(tag === 'street' && /対象を|現行|公式店舗|組合の/.test(text.slice(0,30))) return '駅周辺に条件を満たす商店街';
    if(tag === 'drinks') return text;
    if(tag === 'river' && /現に|対象を/.test(text.slice(0,20))) return '川沿いの散歩先あり。経路と所要の目安は駅の詳細へ';
    if(tag === 'sea' && text.length > 160) return '海・運河沿いの散歩先あり。経路と所要の目安は駅の詳細へ';
    if(tag === 'park' && /市の面積|調査/.test(text.slice(0,20))) return '3ha以上の公園へ徒歩15分以内の距離換算';
    const sentences = text.match(/[^。]+。?/g) || [text];
    const result = sentences.slice(0,tag === 'view' ? 3 : 1).join('');
    return result.length > 160 ? `${data.tagLabels[tag]}の条件に該当。施設・アクセスは駅の詳細へ` : result;
  };
  const editorialAngles = {
    books:['図書館も本屋も生活の動線に入れたい人なら、両方の場所を比べたい駅です。','駅直結の本屋に立ち寄りやすく、移動や買い物と読書を組み合わせやすい駅です。','本を探す時間と街歩きを一緒に楽しみたい人は、本屋と図書館の位置を見てみてください。'],
    movies:['駅から映画館へ立ち寄りやすい場所を選びたい人向けです。','映画を見る前後の食事や買い物も含めて、駅の東西を見比べられます。','駅周辺で映画と街歩きを組み合わせたい人は、劇場までの道を確認してみてください。'],
    drinking:['蒲田を目的地にするなら、駅周辺の通りを歩きながら店を選ぶ楽しみがあります。','駅近くにまとまった酒場街を歩きたい人は、通りの雰囲気を比べたいところです。','細い通りを巡りながら、気になる店を探したい人に向いた街です。'],
    strolling:['買い物の通りと公園の両方を散歩先にしたい人は、それぞれの位置を比べられます。','公園の緑と川沿いの景色を、休日の過ごし方に取り入れたい人向けです。','駅周辺の商店街と緑のある道を、目的に合わせて歩き分けられます。'],
    cycling:['多摩川沿いを走りたい人は、駅から河川敷へ出る道を確認したい駅です。','鶴見川沿いを目的にするなら、コースに接続する場所から住まいまでの道も見ておきたいところです。','荒川方面へ走りに行く人は、河川敷までの接続地点を確認して比べられます。'],
    'night-walk':['水辺を歩きながら街の明かりを楽しみたい人は、夜の帰り道も含めて考えたい街です。','屋内の展望場所を利用したい場合は、開いている時間を先に確認しておきましょう。','川の向こうに広がる街の灯りを、散歩と一緒に楽しみたい人向けです。'],
    'weekend-mobility':['空港、新幹線駅、車のそれぞれの条件を比較したいときの候補です。','羽田方面や新幹線への乗り継ぎを考えながら、普段の移動も比べたい駅です。','空港や新幹線駅へ出る経路に加えて、車を使う休日の動線も比べられます。'],
    'car-life':['都心方面から高速へ出る経路を調べる際に、入口の方向を確認したい駅です。','中央道方面を利用したい人は、高井戸周辺までの経路を見てみましょう。','川崎周辺の入口を使う場合も、向かう方向と入口の条件を確認したいところです。']
  };
  const featured = article.picks.map(([slug, label], index) => {
    const station = data.stations.find(s => s.slug === slug);
    if (!station || !theme.tags.some(tag => selected(station, tag))) throw Error(`Unverified theme example: ${theme.id}/${slug}`);
    const facts = theme.tags.filter(tag => selected(station, tag));
    const photo = data.sources[station.images?.[0]];
    const photoHtml = photo ? `<figure><img src="/${escape(photo.file)}" alt="${escape(photo.alt)}" loading="lazy" width="640" height="480"><figcaption>${escape(photo.date)}撮影 · ${escape(photo.author)} · <a href="${escape(photo.licenseUrl)}">${escape(photo.license)}</a> · <a href="${escape(photo.sourceUrl)}">写真の出典</a></figcaption></figure>` : '';
    return `<article class="theme-feature">${photoHtml}<div class="theme-feature-body"><p class="theme-feature-label">${escape(label)}</p><h3><a href="/station/${escape(slug)}/">${escape(station.name)}駅</a></h3><p>${escape(editorialAngles[theme.id][index])}</p><p>${escape(brief(station,facts[0]))}</p>${facts.slice(1,3).map(tag=>`<p>${escape(brief(station,tag))}</p>`).join('')}<p>${escape((station.strengths || []).slice(0,2).join('。'))}</p><p class="theme-feature-meta">${facts.map(tag => escape(data.tagLabels[tag])).join(' · ')} · 1K参考家賃 ${Number.isFinite(station.rent1k) ? escape(station.rent1k.toFixed(2))+'万円' : '未確認'}</p><a class="theme-detail" href="/station/${escape(slug)}/#evidence">この駅の理由・出典を見る →</a></div></article>`;
  }).join('');
  const articleHtml = `<div class="theme-article-lead"><p>${escape(article.lead)}</p><p>${escape(introductions[theme.id])}</p><nav aria-label="この記事の内容"><a href="#theme-guide">選び方</a><a href="#theme-examples">駅の例</a><a href="#theme-all">全候補</a></nav></div><section class="theme-article-section" id="theme-guide"><h2>${escape(article.heading)}</h2>${article.paragraphs.map(p => `<p>${escape(p)}</p>`).join('')}<div class="theme-checklist"><h3>比べるときの確認点</h3><ul>${article.points.map(p => `<li>${escape(p)}</li>`).join('')}</ul></div></section><section class="theme-article-section" id="theme-examples"><div class="theme-article-heading"><div><p class="theme-overline">駅の例</p><h2>それぞれの街で、どんな暮らしができる？</h2></div><p>掲載条件が確認できた駅から、違いが見える例を挙げています。順位付けではありません。</p></div><div class="theme-feature-grid">${featured}</div></section>`;
  const rows = tags => data.stations.filter(s=>tags.some(t=>selected(s,t))).map(s=> {
    const facts=tags.filter(t=>selected(s,t));
    return `<li class="theme-station"><div class="theme-station-heading"><h3><a href="/station/${escape(s.slug)}/">${escape(s.name)}駅</a></h3><span>${escape(s.area)}</span></div><ul class="theme-facts">${facts.slice(0,2).map(t=>`<li><span>${escape(data.tagLabels[t])}</span>${escape(brief(s,t))}</li>`).join('')}</ul><p class="theme-station-meta">1K参考家賃 ${Number.isFinite(s.rent1k)?escape(s.rent1k.toFixed(2))+'万円':'未確認'} · ${escape(s.lines.slice(0,3).join('・'))}${s.lines.length>3?' ほか':''}</p><a class="theme-detail" href="/station/${escape(s.slug)}/">駅の詳細・出典を見る →</a></li>`;
  }).join('');
  const section=(tags,title)=>{const cards=rows(tags);const count=data.stations.filter(s=>tags.some(t=>selected(s,t))).length;return `<section class="theme-results"><h3>${escape(title)}</h3>${cards?`<details class="theme-all-stations"><summary>候補をすべて見る（${count}駅）</summary><ul class="theme-stations">${cards}</ul></details>`:'<p>この条件の掲載駅は現在ありません。</p>'}<a class="theme-map-link" href="${escape(mapLink(tags))}">この条件で地図から探す →</a></section>`;};
  const count=data.stations.filter(s=>theme.tags.some(tag=>selected(s,tag))).length;
  return `${articleHtml}<div class="theme-search-block">${overallLink}<p class="theme-scope">東京・神奈川・千葉の掲載駅から紹介。${escape(theme.criteria.join('／'))}。 <a href="/criteria/">判定基準</a></p></div><section class="theme-article-section theme-all-section" id="theme-all"><div class="theme-article-heading"><div><p class="theme-overline">全候補</p><h2>条件に合う掲載駅を探す</h2></div><p>このページでは${count}駅が対象です。駅ごとの条件と1K参考家賃を確認できます。</p></div>${theme.id==='weekend-mobility'?trip.map(([tag,title])=>section([tag],title)).join(''):section(theme.tags,'候補駅')}</section><p class="theme-footnote">家賃は1Kの参考相場。出典・確認日、施設や経路の注意点は各駅の詳細へ。写真は撮影時点の記録です。</p><p><a href="/themes/">← 暮らし別の一覧</a></p>`;
}
