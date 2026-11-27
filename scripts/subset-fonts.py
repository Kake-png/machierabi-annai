#!/usr/bin/env python3
"""Zen Maru Gothic を、サイトで実際に使っている文字を含む分割ファイルだけ public/assets/fonts/ に置く。

使い方: python3 -I scripts/subset-fonts.py <@fontsource/zen-maru-gothic のディレクトリ>
fonts.css は unicode-range 付きなので、含まれない文字は OS 標準フォントで表示される。
文字を大きく追加したときは再実行する。
"""
import re, shutil, sys
from pathlib import Path

src = Path(sys.argv[1])
root = Path(__file__).resolve().parent.parent
pub = root / "public"
out = pub / "assets" / "fonts"
WEIGHTS = [400, 700]

used = set()
for p in pub.rglob("*"):
    if p.suffix in {".html", ".js", ".css", ".json", ".txt", ".xml"} and "fonts" not in p.parts:
        used.update(p.read_text(encoding="utf-8", errors="ignore"))
used = {ord(c) for c in used if ord(c) > 0x7f or c.isprintable()}

def ranges(spec):
    for part in spec.split(","):
        part = part.strip()[2:]
        if "-" in part:
            a, b = part.split("-")
            yield int(a, 16), int(b, 16)
        else:
            yield int(part, 16), int(part, 16)

out.mkdir(parents=True, exist_ok=True)
for f in out.glob("*"):
    f.unlink()
css = ["/* Zen Maru Gothic (SIL OFL 1.1) — scripts/subset-fonts.py が生成。使用文字を含む分割のみ */"]
kept = 0
for w in WEIGHTS:
    text = (src / f"{w}.css").read_text()
    for block in re.findall(r"@font-face\s*\{.*?\}", text, re.S):
        m = re.search(r"unicode-range:\s*([^;]+);", block)
        file = re.search(r"url\(\./files/([^)]+?\.woff2)\)", block).group(1)
        rs = list(ranges(m.group(1)))
        latin = "latin" in file and "ext" not in file
        if not latin and not any(lo <= c <= hi for lo, hi in rs for c in used):
            continue
        shutil.copy(src / "files" / file, out / file)
        kept += 1
        css.append(
            "@font-face{font-family:'Zen Maru Gothic';font-style:normal;font-display:swap;"
            f"font-weight:{w};src:url(/assets/fonts/{file}) format('woff2');unicode-range:{m.group(1)}}}"
        )
(pub / "assets" / "fonts.css").write_text("\n".join(css) + "\n", encoding="utf-8")
shutil.copy(src / "LICENSE", out / "LICENSE-ZenMaruGothic.txt")
print("kept", kept, "files;", sum(f.stat().st_size for f in out.glob("*.woff2")) // 1024, "KB")
