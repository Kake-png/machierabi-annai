#!/usr/bin/env python3
"""駅ごとの「治安の数字」を作る。

使い方:
  python3 -I scripts/safety-numbers.py <警視庁 町丁別CSV(R7.csv)> <geolonia latest.csv> [公表年]

入力:
  * 警視庁「区市町村の町丁別、罪種別及び手口別認知件数」(cp932のCSV)
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


def main():
    crime_csv, geo_csv = sys.argv[1], sys.argv[2]
    year = int(sys.argv[3]) if len(sys.argv) > 3 else 2025

    geo, cities = {}, set()
    with open(geo_csv, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["都道府県名"] != "東京都" or not r["緯度"] or not r["経度"]:
                continue
            cities.add(r["市区町村名"])
            geo.setdefault(normalize(r["市区町村名"] + r["大字町丁目名"]), (float(r["緯度"]), float(r["経度"])))

    with open(crime_csv, encoding="cp932") as f:
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

    stations = load_stations()
    counts = {}
    for s in stations:
        c = {k: 0 for k in CATEGORIES}
        c["all"] = 0
        c["towns"] = 0
        for (lat, lng), r in towns:
            if haversine(s["lat"], s["lng"], lat, lng) <= RADIUS_M:
                c["towns"] += 1
                c["all"] += int(r[index["総合計"]])
                for k, cols in CATEGORIES.items():
                    c[k] += sum(int(r[index[n]]) for n in cols)
        counts[s["slug"]] = c

    n = len(stations)
    result = {}
    for slug, c in counts.items():
        entry = {"towns": c["towns"], "all": c["all"]}
        for k in CATEGORIES:
            less = sum(1 for o in counts.values() if o[k] < c[k])
            equal = sum(1 for o in counts.values() if o[k] == c[k])
            percentile = (less + equal / 2) / n  # 同数の駅は真ん中の位置にそろえる
            entry[k] = {"n": c[k], "rank": less + 1, "ties": equal, "grade": GRADES[min(4, int(percentile * 5))]}
        result[slug] = entry

    data = {
        "year": year,
        "radiusM": RADIUS_M,
        "stationCount": n,
        "pilot": ["kitasenju", "ikebukuro", "yukigayaotsuka"],
        "stations": result,
    }
    out = ROOT / "public/assets/safety-data.js"
    out.write_text("export const SAFETY_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"stations={n} towns_used={len(towns)} missed_crimes={missed}")
    for slug in data["pilot"]:
        print(slug, json.dumps(result[slug], ensure_ascii=False))


if __name__ == "__main__":
    main()
