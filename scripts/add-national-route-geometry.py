import json,re,sys
from pathlib import Path
features=json.load(open(sys.argv[1],encoding='utf-8'))['features']
src=Path('public/assets/route-geometry.json');out=json.loads(src.read_text())
labels=json.loads(Path('public/assets/imported-batches7-12.js').read_text().split('export const NEW_ROUTE_LABELS = ')[1].rsplit(';',1)[0])
# Specific operators and railway names from the national railway data.
manual={'京王線':('京王電鉄','京王線'),'日暮里・舎人ライナー':('東京都','日暮里・舎人ライナー'),'JR青梅線':('東日本旅客鉄道','青梅線'),'JR総武線快速':('東日本旅客鉄道','総武線'),'JR常磐線':('東日本旅客鉄道','常磐線'),'多摩モノレール':('多摩都市モノレール','多摩都市モノレール線'),'つくばエクスプレス':('首都圏新都市鉄道','常磐新線'),'都電荒川線（王子駅前）':('東京都','荒川線'),'東武スカイツリーライン':('東武鉄道','伊勢崎線'),'東武アーバンパークライン':('東武鉄道','野田線'),'東武東上線':('東武鉄道','東上本線'),'東京メトロ千代田線 北綾瀬支線':('東京地下鉄','9号線千代田線')}
ops={'東京メトロ':'東京地下鉄','都営':'東京都','東武':'東武鉄道','京成':'京成電鉄','京王':'京王電鉄','小田急':'小田急電鉄','西武':'西武鉄道','東急':'東急電鉄'}
added=[]
for id,label in labels.items():
 if id in out:continue
 if label=='東京メトロ千代田線 北綾瀬支線':continue
 pair=manual.get(label)
 if not pair:
  for prefix,op in ops.items():
   if label.startswith(prefix):
    name=label[len(prefix):]; matches={(f['properties']['N02_004'],f['properties']['N02_003']) for f in features if f['properties']['N02_004']==op and f['properties']['N02_003'].endswith(name)}
    if len(matches)==1:pair=matches.pop()
    break
 if not pair:continue
 selected=[f for f in features if (f['properties']['N02_004'],f['properties']['N02_003'])==pair]
 if selected:
  out[id]={'type':'FeatureCollection','features':[{'type':'Feature','properties':{},'geometry':f['geometry']} for f in selected]};added.append((id,label,len(selected)))
src.write_text(json.dumps(out,separators=(',',':')));print('ADDED',added)
