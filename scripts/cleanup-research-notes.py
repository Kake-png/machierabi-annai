"""研究ノート由来の本文から、裏取り作業の経過メモ（判定・再確認・batch番号・OSRMなど）を取り除く。

一度きりの整理用スクリプト。対象は public/assets/imported-*.js の駅データ（写真・路線ラベルは対象外）。
事実（店名・距離・所要時間・出典名）は残し、作業の記録だけを消す。元の文章は git の履歴に残る。

使い方: python3 -I scripts/cleanup-research-notes.py [--write]
--write なしの場合は変更内容を表示するだけ。
"""
import json
import re
import sys
from pathlib import Path

FILES = [
    "public/assets/imported-stations.js",
    "public/assets/imported-batch6.js",
    "public/assets/imported-batches7-12.js",
]
STATION_ARRAYS = {"IMPORTED_STATIONS", "BATCH6_STATIONS", "NEW_STATIONS"}

# 文の中の置き換え（事実は残す）
INLINE_RULES = [
    (re.compile(r"【再確認[^】]*】\s*"), ""),
    # batch番号つきの括弧：出典名だけ残す。空になれば括弧ごと消す
    (re.compile(r"（batch-\d+[^（）]*）"), ""),
    (re.compile(r"、batch-\d+(?:で採用した根拠|で採用|の計測)"), ""),
    (re.compile(r"（[^（）]*?(?:未確認|未確定|記載なし)[^（）]*）"), ""),
    # 経路計算（OSM/OSRM）の書き方を、読者向けの距離・時間にする
    (re.compile(r"(\S+?)から(\S+?)のOSM線までOSRM\s*([\d.]+)m＝(\d+)分"), r"\1から\2まで約\3m（徒歩約\4分）"),
    (re.compile(r"OSMの(\S+?)までOSRM\s*([\d.]+)m＝(\d+)分"), r"\1まで約\2m（徒歩約\3分）"),
    (re.compile(r"OSMの(\S+?)までOSRM徒歩(\d+)分・自転車(\d+)分"), r"\1まで徒歩約\2分・自転車約\3分"),
    (re.compile(r"浅草線 浅草駅（OSM駅点）からホッピー通りまでOSRM 浅草駅参考点から(\d+)m＝(\d+)分（[^（）]*）"), r"浅草駅からホッピー通りまで約\1m（徒歩約\2分）"),
    (re.compile(r"への徒歩はOSRM\s*([\d.]+)m＝(\d+)分"), r"まで約\1m（徒歩約\2分）"),
    (re.compile(r"まで([\d.]+)m＝(\d+)分"), r"まで約\1m（徒歩約\2分）"),
    (re.compile(r"（OSRM推計）"), "（推計）"),
    (re.compile(r"OSMの"), ""),
    (re.compile(r"OSM："), ""),
    (re.compile(r"\s*w\d{5,}\s*"), ""),
    (re.compile(r"、?OSM形状から算出"), ""),
    (re.compile(r"OSRM自転車\s*"), "自転車で"),
    (re.compile(r"OSRM\s*"), "徒歩"),
    (re.compile(r"徒歩([\d,.]+)m＝(\d+)分"), r"約\1m（徒歩約\2分）"),
    (re.compile(r"自転車で([\d,.]+)m＝(\d+)分"), r"自転車で約\1m（約\2分）"),
    (re.compile(r"形状で約|OSMポリゴン約"), "面積約"),
    (re.compile(r"^(?:境界の最寄り点|境界最寄り点|境界)まで"), "公園の端まで"),
    (re.compile(r"境界の最寄り点まで|の境界まで"), "の端まで"),
    (re.compile(r"（OSM参考点）|（OSM n\d+）|国土地理院の住所検索で座標化し、"), ""),
    (re.compile(r"駅参考点から|駅参照点→接続地点の"), "駅から"),
    (re.compile(r"自転車で経路([\d.]+)m"), r"自転車で約\1m"),
    (re.compile(r"徒歩で([\d,.]+)m＝(\d+)分"), r"約\1m（徒歩約\2分）"),
    (re.compile(r"（推計、距離は記録なし）"), "（推計）"),
    (re.compile(r"(?<![約\d,.])([\d,.]+)m＝(\d+)分"), r"約\1m（徒歩約\2分）"),
    (re.compile(r"(?:の最寄り点|の代表点|上の点|最寄り点)まで"), "まで"),
    (re.compile(r"cycleway"), "自転車道"),
    (re.compile(r"(施設|図書館|建物)点まで"), r"\1まで"),
    (re.compile(r"（元調査の地図経路）"), "（地図上の経路での目安）"),
    (re.compile(r"受領調査で約(\d+)分の推計"), r"約\1分（推計）"),
    (re.compile(r"ことを確認（[^（）]*）$"), ""),
    (re.compile(r"ことを確認$"), ""),
    # 「AだがBは未確認」→ A
    (re.compile(r"^(.+?)が[^、が]*は未確認$"), r"\1"),
]

# 文ごと消す（読者にとって情報がない作業メモ）
DROP_SENTENCE = re.compile(
    r"^判定は変更なし$|判定保留$|資料は取得していない$|再確認していない$|資料で確認でき(?:なかった|ず)|^[^、]{1,30}は未確認$"
    r"|は圏外または未確認$|新しい資料|の値のまま$|として判定$"
)


def clean_text(text: str, drop_sentences: bool = True) -> str:
    sentences = [s.strip() for s in text.split("。")]
    trailing_period = text.rstrip().endswith("。")
    kept = []
    for s in sentences:
        if not s:
            continue
        for pattern, repl in INLINE_RULES:
            s = pattern.sub(repl, s).strip()
        if not s or (drop_sentences and DROP_SENTENCE.search(s)):
            continue
        kept.append(s)
    out = "。".join(kept)
    if kept and trailing_period:
        out += "。"
    return out


def walk(value, path, changes):
    if isinstance(value, str):
        # 「住む前の確認点」「概要」などは、未確認であること自体が読者への注意なので文は消さない
        drop = ".notes." in path or ".practical." in path
        new = clean_text(value, drop) if any(k in value for k in ("再確認", "batch-", "OSRM", "OSM", "点まで", "m＝", "未確認", "未確定", "判定", "資料", "調査", "確認", "記載なし")) else value
        if not new.strip():
            new = value
        if new != value:
            changes.append((path, value, new))
        return new
    if isinstance(value, list):
        return [walk(v, f"{path}[{i}]", changes) for i, v in enumerate(value)]
    if isinstance(value, dict):
        return {k: walk(v, f"{path}.{k}", changes) for k, v in value.items()}
    return value


def main():
    write = "--write" in sys.argv
    total = 0
    for name in FILES:
        path = Path(name)
        lines = path.read_text(encoding="utf-8").split("\n")
        for i, line in enumerate(lines):
            m = re.match(r"export const (\w+) = (.*);$", line)
            if not m or m.group(1) not in STATION_ARRAYS:
                continue
            data = json.loads(m.group(2))
            changes = []
            cleaned = [walk(st, st.get("slug", "?"), changes) for st in data]
            total += len(changes)
            for p, old, new in changes:
                print(f"--- {p}\n  旧: {old}\n  新: {new}")
            lines[i] = f"export const {m.group(1)} = {json.dumps(cleaned, ensure_ascii=False, separators=(',', ':'))};"
        if write:
            path.write_text("\n".join(lines), encoding="utf-8")
    print(f"変更: {total} 箇所", "(書き込み済み)" if write else "(確認のみ)")


if __name__ == "__main__":
    main()
