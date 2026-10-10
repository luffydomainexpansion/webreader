import os
import sys
import json
import re
import shutil
import time
from bs4 import BeautifulSoup

def clean_paragraph(p_html):
    s = p_html.strip()
    if not s:
        return None
    lower_s = s.lower()
    if "oceanofpdf.com" in lower_s:
        return None
    if re.fullmatch(r"[0-9a-f]{24}", s):
        return None
    if "stolen from" in lower_s or "novelbin" in lower_s:
        return None
    if "the novel will be updated first on this website" in lower_s or "come back and continue reading" in lower_s:
        return None
    # Remove regional indicator flags (NovelBin anti-crawler spam)
    if re.search(r"[\U0001F1E6-\U0001F1FF]{2,}", s):
        return None
    return s

def build():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    epub_dir = os.path.join(base_dir, "EPUB")
    out_dir = os.path.dirname(__file__)
    data_dir = os.path.join(out_dir, "data")
    chaps_dir = os.path.join(data_dir, "chapters")

    os.makedirs(chaps_dir, exist_ok=True)

    # Copy cover image
    cover_src = os.path.join(epub_dir, "cover.jpg")
    if os.path.exists(cover_src):
        shutil.copy2(cover_src, os.path.join(out_dir, "cover.jpg"))

    print("Parsing nav.xhtml Table of Contents...")
    nav_path = os.path.join(epub_dir, "nav.xhtml")
    with open(nav_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    toc_nav = soup.find("nav", {"epub:type": "toc"})
    top_ol = toc_nav.find("ol", recursive=False)

    volumes_data = []
    all_chapters = []

    for li in top_ol.find_all("li", recursive=False):
        vol_a = li.find("a", recursive=False)
        vol_title = vol_a.text.strip() if vol_a else "Volume"
        vol_ol = li.find("ol", recursive=False)
        vol_chaps = []
        if vol_ol:
            for c_li in vol_ol.find_all("li", recursive=False):
                c_a = c_li.find("a")
                if c_a:
                    href = c_a.get("href", "")
                    c_title = c_a.text.strip()
                    m = re.search(r"chapter_(\d+)\.xhtml", href)
                    c_num = int(m.group(1)) if m else len(all_chapters) + 1
                    item = {"id": c_num, "title": c_title, "volume": vol_title}
                    vol_chaps.append(c_num)
                    all_chapters.append(item)
        volumes_data.append({"volume": vol_title, "chapter_ids": vol_chaps})

    print(f"Parsed {len(volumes_data)} volumes and {len(all_chapters)} chapters.")

    toc_file = os.path.join(data_dir, "toc.json")
    with open(toc_file, "w", encoding="utf-8") as f:
        json.dump({
            "title": "Let Me Game In Peace",
            "author": "Twelve-Winged Dark Seraphim",
            "total_chapters": len(all_chapters),
            "volumes": volumes_data,
            "chapters": all_chapters
        }, f, ensure_ascii=False)

    chap_to_vol = {c["id"]: c["volume"] for c in all_chapters}

    print("Extracting and cleaning chapters...")
    t0 = time.time()
    written = 0

    for c_meta in all_chapters:
        cid = c_meta["id"]
        file_path = os.path.join(epub_dir, f"chapter_{cid}.xhtml")
        if not os.path.exists(file_path):
            continue

        with open(file_path, "r", encoding="utf-8") as f:
            html = f.read()

        title_match = re.search(r"<h1>(.*?)</h1>", html, re.DOTALL)
        title = title_match.group(1).strip() if title_match else c_meta["title"]

        raw_paras = re.findall(r"<p>(.*?)</p>", html, re.DOTALL)
        cleaned_paras = []
        for rp in raw_paras:
            cp = clean_paragraph(rp)
            if cp:
                cleaned_paras.append(cp)

        chapter_data = {
            "id": cid,
            "title": title,
            "volume": chap_to_vol.get(cid, ""),
            "paragraphs": cleaned_paras
        }

        out_path = os.path.join(chaps_dir, f"{cid}.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(chapter_data, f, ensure_ascii=False)

        written += 1

    t1 = time.time()
    print(f"Generated {written} clean chapter JSON files in {t1 - t0:.2f} seconds.")

if __name__ == "__main__":
    build()
