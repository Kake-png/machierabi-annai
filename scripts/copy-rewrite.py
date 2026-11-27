#!/usr/bin/env python3
"""駅ページの本文（要約・特徴・確認点・暮らしのメモ）を書き直すための道具。

  書き出し: python3 -I scripts/copy-rewrite.py export <slug,slug,...|all> > batch.json
  照合のみ: python3 -I scripts/copy-rewrite.py check  batch.json
  反映:     python3 -I scripts/copy-rewrite.py apply  batch.json

batch.json は {slug: {"summary": str, "strengths": [..], "cautions": [..],
"notes": {..}, "practical": {..}, "_drops": [..]}} の形。書き直したい項目だけ入れればよい。

照合（事実を変えないための機械チェック）:
  - 数字（距離・分・金額・日付・番号）、英字、カタカナ語を駅ごとに集め、
    書き直し前にあったものが書き直し後にも（どこか1か所以上に）残っているかを確かめる。
    項目間の移動と、同じ名前の重複をまとめるのは可。
  - 書き直し後に、元の文章になかった数字が増えていないかを確かめる（数字の捏造防止）。
  - わざと消すもの（重複・作業メモ由来の語など）は "_drops" に書いた分だけ許す。
"""
import json, re, sys, unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "public" / "assets"
IMPORTED = [("imported-stations.js", "IMPORTED_STATIONS"), ("imported-batch6.js", "BATCH6_STATIONS"), ("imported-batches7-12.js", "NEW_STATIONS")]
FIELDS = ("summary", "strengths", "cautions", "notes", "practical")


def load_imported():
    out = {}
    for file, var in IMPORTED:
        text = (ASSETS / file).read_text(encoding="utf-8")
        prefix = f"export const {var} = "
        line = next(l for l in text.split("\n") if l.startswith(prefix))
        for st in json.loads(line[len(prefix):].rstrip(";")):
            out[st["slug"]] = (file, var, st)
    return out


def load_manual():
    """data.js に直接書かれた駅（15駅）。node で評価して値を取る。"""
    import subprocess
    js = r'''
import("%s").then(({ATLAS_DATA})=>{const out={};for(const s of ATLAS_DATA.stations){out[s.slug]={summary:s.editorialSummary,strengths:s.strengths,cautions:s.cautions,notes:s.notes,practical:s.practical}};console.log(JSON.stringify(out))})
''' % (ASSETS / "data.js").as_posix()
    res = subprocess.run(["node", "--input-type=module", "-e", js], capture_output=True, text=True, check=True)
    return json.loads(res.stdout)


def flatten(entry):
    parts = []
    for key in FIELDS:
        value = entry.get(key)
        if isinstance(value, str):
            parts.append(value)
        elif isinstance(value, list):
            parts.extend(value)
        elif isinstance(value, dict):
            parts.extend(v for v in value.values() if isinstance(v, str))
    return "\n".join(parts)


def norm(text):
    return unicodedata.normalize("NFKC", text)


def tokens(text):
    t = norm(text)
    nums = re.findall(r"\d+(?:[.:]\d+)*", t)
    latin = [w.lower() for w in re.findall(r"[A-Za-z][A-Za-z0-9&'.+-]*", t) if len(w) > 1]
    kata = re.findall(r"[ァ-ヴヵヶー]{2,}", t)
    return Counter(nums), Counter(latin), Counter(kata)


def merged(original, edit):
    out = {}
    for key in FIELDS:
        if key in edit:
            if isinstance(original.get(key), dict):
                out[key] = {**original.get(key, {}), **edit[key]}
            else:
                out[key] = edit[key]
        else:
            out[key] = original.get(key)
    return out


def check(batch, originals):
    problems = []
    for slug, edit in batch.items():
        if slug not in originals:
            problems.append(f"{slug}: 駅が見つからない")
            continue
        before = originals[slug]
        after = merged(before, edit)
        drops = Counter()
        for d in edit.get("_drops", []):
            for c in tokens(d):
                drops.update(c)
        b, a = tokens(flatten(before)), tokens(flatten(after))
        names = ("数字", "英字", "カタカナ")
        for name, bc, ac in zip(names, b, a):
            missing = set(bc) - set(ac) - set(drops)
            if missing:
                problems.append(f"{slug}: 消えた{name} {sorted(missing)}")
        new_nums = set(a[0]) - set(b[0])
        if new_nums:
            problems.append(f"{slug}: 元にない数字が増えた {sorted(new_nums)}")
        for key in ("notes", "practical"):
            for k, v in (edit.get(key) or {}).items():
                if k not in (before.get(key) or {}):
                    problems.append(f"{slug}: {key}.{k} は元にない項目")
                if not str(v).strip():
                    problems.append(f"{slug}: {key}.{k} が空")
    return problems


def js_string_replace(text, old, new):
    """data.js 内の "..." 文字列リテラルを1か所だけ置き換える。"""
    old_lit = json.dumps(old, ensure_ascii=False)
    new_lit = json.dumps(new, ensure_ascii=False)
    if text.count(old_lit) != 1:
        raise SystemExit(f"data.js で一意に見つからない: {old[:40]}…（{text.count(old_lit)}件）")
    return text.replace(old_lit, new_lit)


def apply(batch, imported, manual):
    files = {}
    data_js = (ASSETS / "data.js").read_text(encoding="utf-8")
    for slug, edit in batch.items():
        edit = {k: v for k, v in edit.items() if not k.startswith("_")}
        if slug in imported:
            file, var, st = imported[slug]
            for key, value in edit.items():
                st[key] = {**st.get(key, {}), **value} if isinstance(value, dict) else value
            files.setdefault(file, var)
        else:
            before = manual[slug]
            for key, value in edit.items():
                if isinstance(value, dict):
                    for k, v in value.items():
                        data_js = js_string_replace(data_js, before[key][k], v)
                elif isinstance(value, list):
                    for old, new in zip(before[key], value):
                        if old != new:
                            data_js = js_string_replace(data_js, old, new)
                    if len(value) != len(before[key]):
                        raise SystemExit(f"{slug}: {key} の個数は変えない（data.js の駅）")
                else:
                    data_js = js_string_replace(data_js, before[key], value)
    (ASSETS / "data.js").write_text(data_js, encoding="utf-8")
    by_file = {}
    for slug, (file, var, st) in imported.items():
        by_file.setdefault(file, (var, []))[1].append(st)
    for file, var in files.items():
        path = ASSETS / file
        lines = path.read_text(encoding="utf-8").split("\n")
        prefix = f"export const {var} = "
        i = next(k for k, l in enumerate(lines) if l.startswith(prefix))
        lines[i] = prefix + json.dumps(by_file[file][1], ensure_ascii=False, separators=(",", ":")) + ";"
        path.write_text("\n".join(lines), encoding="utf-8")


def main():
    cmd, arg = sys.argv[1], sys.argv[2]
    imported = load_imported()
    manual_all = load_manual()
    originals = {slug: {k: st.get(k) for k in FIELDS} for slug, (_, _, st) in imported.items()}
    manual = {s: v for s, v in manual_all.items() if s not in imported}
    originals.update(manual)
    if cmd == "export":
        slugs = list(originals) if arg == "all" else arg.split(",")
        print(json.dumps({s: originals[s] for s in slugs}, ensure_ascii=False, indent=1))
        return
    batch = json.loads(Path(arg).read_text(encoding="utf-8"))
    problems = check(batch, originals)
    for p in problems:
        print("NG", p)
    if problems:
        raise SystemExit(1)
    print(f"OK: {len(batch)}駅、数字・英字・カタカナ語の欠落と数字の追加なし")
    if cmd == "apply":
        apply(batch, imported, manual)
        print("反映しました")


if __name__ == "__main__":
    main()
