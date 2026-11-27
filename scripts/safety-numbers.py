#!/usr/bin/env python3
"""駅ごとの「治安の数字」を作る。

使い方:
  python3 -I scripts/safety-numbers.py <geolonia latest.csv> 2023=R5.csv 2024=R6.csv 2025=R7.csv

入力:
  * 警視庁「区市町村の町丁別、罪種別及び手口別認知件数」(cp932のCSV)を西暦=ファイルで何年分か。
    年ごとのぶれ(特に空き巣は年0〜4件)をならすため、駅ごとに年平均にする
  * geolonia/japanese-addresses の data/latest.csv (町丁ごとの代表点の緯度経度)
  * 駅の座標は public/assets/data.js から読む(node で書き出す)

出力: public/assets/safety-data.js
  駅から半径800mに代表点がある町丁の件数を、種類ごとに合計する。
  人口では割らない。同じ広さで数えた件数を、東京の掲載駅どうしで並べて
  5段階(A=少ない側 … E=多い側)にする。
"""
import csv
import json
import math
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RADIUS_M = 800
CATEGORIES = {
    "home": ["侵入窃盗空き巣", "侵入窃盗忍込み", "侵入窃盗居空き"],
    "street": ["凶悪犯強盗", "粗暴犯暴行", "粗暴犯傷害", "非侵入窃盗ひったくり"],
    "bike": ["非侵入窃盗自転車盗"],
}
GRADES = "ABCDE"
KAN = "〇一二三四五六七八九"


def kanji_number(n):
    n = int(n)
    if n < 10:
        return KAN[n]
    if n < 20:
        return "十" + (KAN[n - 10] if n > 10 else "")
    return KAN[n // 10] + "十" + (KAN[n % 10] if n % 10 else "")


def normalize(name):
    name = name.replace("ヶ", "ケ").replace("ヵ", "カ")
    return re.sub(
        r"([０-９]+)丁目",
        lambda m: kanji_number(unicodedata.normalize("NFKC", m.group(1))) + "丁目",
        name,
    )


def haversine(lat1, lng1, lat2, lng2):
    p = math.pi / 180
    a = math.sin((lat2 - lat1) * p / 2) ** 2 + math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lng2 - lng1) * p / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(a))


def load_stations():
    script = (
        f"import {{ATLAS_DATA}} from '{ROOT}/public/assets/data.js';"
        "console.log(JSON.stringify(ATLAS_DATA.stations.map(s=>({slug:s.slug,name:s.name,area:s.area,lat:s.lat,lng:s.lng}))));"
    )
    out = subprocess.run(["node", "--input-type=module", "-e", script], check=True, capture_output=True, text=True).stdout
    stations = json.loads(out)
    # 東京都の駅だけが対象。area は「東京都港区」「品川区」のように揺れている。
    return [s for s in stations if s["area"].startswith("東京都") or (s["area"].endswith("区") and "市" not in s["area"])]


def read_year(path, geo, cities):
    """1年分のCSVから、(代表点, 行) の一覧と、座標が見つからず除いた件数を返す。"""
    with open(path, encoding="cp932") as f:
        rows = list(csv.reader(f))
    index = {h: i for i, h in enumerate(rows[0])}
    towns, missed = [], 0
    for r in rows[1:]:
        name = r[0]
        if name.endswith("計") or "以下不詳" in name or name in cities:
            continue
        point = geo.get(normalize(name))
        if point:
            towns.append((point, r))
        else:
            missed += int(r[index["総合計"]])
    return index, towns, missed


def main():
    geo_csv = sys.argv[1]
    year_files = sorted((int(a.split("=")[0]), a.split("=")[1]) for a in sys.argv[2:])

    geo, cities, outside = {}, set(), []
    with open(geo_csv, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if not r["緯度"] or not r["経度"]:
                continue
            if r["都道府県名"] in ("神奈川県", "埼玉県", "千葉県"):
                # 都県境の判定用。東京の外の町丁は、警視庁のデータに件数がない
                outside.append((float(r["緯度"]), float(r["経度"]), r["都道府県名"] + r["市区町村名"]))
                continue
            if r["都道府県名"] != "東京都":
                continue
            cities.add(r["市区町村名"])
            geo.setdefault(normalize(r["市区町村名"] + r["大字町丁目名"]), (float(r["緯度"]), float(r["経度"])))

    stations = load_stations()
    years = [y for y, _ in year_files]
    totals = {s["slug"]: {k: 0 for k in [*CATEGORIES, "all", "towns"]} for s in stations}
    for year, path in year_files:
        index, towns, missed = read_year(path, geo, cities)
        print(f"{year}: towns_used={len(towns)} missed_crimes={missed}")
        for s in stations:
            t = totals[s["slug"]]
            inside = [(point, r) for point, r in towns if haversine(s["lat"], s["lng"], point[0], point[1]) <= RADIUS_M]
            for _, r in inside:
                t["all"] += int(r[index["総合計"]])
                for k, cols in CATEGORIES.items():
                    t[k] += sum(int(r[index[n]]) for n in cols)
            if year == years[-1]:  # 町丁の数は年によって少し違うので、最新年のものを使う
                t["towns"] = len(inside)

    # 半径800mの一部が他県にかかる駅は、その部分の件数がなく少なく出るため、順位づけから外す
    partial = {}
    for st in stations:
        places = sorted({name for lat, lng, name in outside if haversine(st["lat"], st["lng"], lat, lng) <= RADIUS_M})
        if places:
            partial[st["slug"]] = places

    avg = {}
    for slug, t in totals.items():
        avg[slug] = {k: round(v / len(years), 1) for k, v in t.items() if k != "towns"}
        avg[slug]["towns"] = t["towns"]
    ranked = {slug: c for slug, c in avg.items() if slug not in partial}
    n = len(ranked)
    result = {}
    for slug, c in avg.items():
        entry = {"towns": c["towns"], "all": c["all"]}
        if slug in partial:
            entry["partial"] = partial[slug]
        for k in CATEGORIES:
            if slug in partial:
                entry[k] = {"n": c[k]}
                continue
            less = sum(1 for o in ranked.values() if o[k] < c[k])
            equal = sum(1 for o in ranked.values() if o[k] == c[k])
            percentile = (less + equal / 2) / n  # 同数の駅は真ん中の位置にそろえる
            entry[k] = {"n": c[k], "rank": less + 1, "ties": equal, "grade": GRADES[min(4, int(percentile * 5))]}
        result[slug] = entry

    data = {
        "years": years,
        "radiusM": RADIUS_M,
        "stationCount": n,
        "stations": result,
    }
    out = ROOT / "public/assets/safety-data.js"
    out.write_text("export const SAFETY_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"ranked={n} partial={partial} years={years}")
    for slug in ["kitasenju", "ikebukuro", "yukigayaotsuka"]:
        print(slug, json.dumps(result[slug], ensure_ascii=False))
    for k in CATEGORIES:
        dist = {}
        for e in result.values():
            if "grade" not in e[k]:
                continue
            dist.setdefault(e[k]["grade"], []).append(e[k]["n"])
        print(k, {g: (min(v), max(v), len(v)) for g, v in sorted(dist.items())})


if __name__ == "__main__":
    main()
