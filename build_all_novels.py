import os
import sys
import json
import re
import shutil
import time
import urllib.parse
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
    if re.search(r"[\U0001F1E6-\U0001F1FF]{2,}", s):
        return None
    return s

def build_lmgip(base_reader_dir):
    print("\n--- BUILDING: Let Me Game In Peace ---")
    source_dir = r"G:\books\Let_Me_Game_in_Peace_-_Twelve-Winged_Dark_Seraphim\EPUB"
    novel_dir = os.path.join(base_reader_dir, "data", "lmgip")
    chaps_dir = os.path.join(novel_dir, "chapters")
    os.makedirs(chaps_dir, exist_ok=True)

    # Copy cover
    cover_src = os.path.join(source_dir, "cover.jpg")
    if os.path.exists(cover_src):
        shutil.copy2(cover_src, os.path.join(novel_dir, "cover.jpg"))

    # TOC from existing lmgip data if already built, or parse nav.xhtml
    old_toc = os.path.join(base_reader_dir, "data", "toc.json")
    if os.path.exists(old_toc):
        with open(old_toc, "r", encoding="utf-8") as f:
            toc = json.load(f)
        all_chapters = toc["chapters"]
        volumes_data = toc["volumes"]
    else:
        nav_path = os.path.join(source_dir, "nav.xhtml")
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

    with open(os.path.join(novel_dir, "toc.json"), "w", encoding="utf-8") as f:
        json.dump({
            "id": "lmgip",
            "title": "Let Me Game In Peace",
            "author": "Twelve-Winged Dark Seraphim",
            "total_chapters": len(all_chapters),
            "volumes": volumes_data,
            "chapters": all_chapters
        }, f, ensure_ascii=False)

    # Move or copy existing chapters if they exist in data/chapters
    old_chaps_dir = os.path.join(base_reader_dir, "data", "chapters")
    if os.path.exists(old_chaps_dir):
        print("Copying existing LMGIP chapter JSONs...")
        for c in all_chapters:
            src = os.path.join(old_chaps_dir, f"{c['id']}.json")
            dst = os.path.join(chaps_dir, f"{c['id']}.json")
            if os.path.exists(src) and not os.path.exists(dst):
                shutil.copy2(src, dst)
    print(f"LMGIP complete with {len(all_chapters)} chapters.")

def build_tka(base_reader_dir):
    print("\n--- BUILDING: The King's Avatar ---")
    source_dir = r"G:\books\the_kings_avatar_1-1728\EPUB"
    novel_dir = os.path.join(base_reader_dir, "data", "tka")
    chaps_dir = os.path.join(novel_dir, "chapters")
    os.makedirs(chaps_dir, exist_ok=True)

    # Copy cover
    cover_src = os.path.join(source_dir, "image.jpg")
    if os.path.exists(cover_src):
        shutil.copy2(cover_src, os.path.join(novel_dir, "cover.jpg"))

    # Parse nav.xhtml
    nav_path = os.path.join(source_dir, "nav.xhtml")
    with open(nav_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    toc_nav = soup.find("nav", {"epub:type": "toc"})
    links = toc_nav.find_all("a") if toc_nav else []

    all_chapters = []
    # Group in chunks of 100 as volumes
    volumes_data = []

    for idx, a in enumerate(links, 1):
        href = a.get("href", "")
        title = a.text.strip()
        vol_num = (idx - 1) // 100 + 1
        vol_name = f"Volume {vol_num} (Ch. {(vol_num-1)*100+1}-{min(vol_num*100, len(links))})"
        all_chapters.append({
            "id": idx,
            "title": title,
            "volume": vol_name,
            "href": href
        })

    # Group into volumes_data
    vol_dict = {}
    for c in all_chapters:
        v = c["volume"]
        if v not in vol_dict:
            vol_dict[v] = []
        vol_dict[v].append(c["id"])

    volumes_data = [{"volume": k, "chapter_ids": v} for k, v in vol_dict.items()]

    with open(os.path.join(novel_dir, "toc.json"), "w", encoding="utf-8") as f:
        json.dump({
            "id": "tka",
            "title": "The King's Avatar",
            "author": "Butterfly Blue",
            "total_chapters": len(all_chapters),
            "volumes": volumes_data,
            "chapters": all_chapters
        }, f, ensure_ascii=False)

    print(f"Extracting {len(all_chapters)} chapters for The King's Avatar...")
    t0 = time.time()
    for c in all_chapters:
        fpath = os.path.join(source_dir, c["href"])
        if not os.path.exists(fpath):
            continue
        with open(fpath, "r", encoding="utf-8") as f:
            html = f.read()

        title_match = re.search(r"<h1>(.*?)</h1>", html, re.DOTALL)
        title = re.sub(r"<[^>]+>", "", title_match.group(1)).strip() if title_match else c["title"]

        raw_paras = re.findall(r"<p>(.*?)</p>", html, re.DOTALL)
        cleaned_paras = []
        for rp in raw_paras:
            cp = clean_paragraph(rp)
            if cp:
                cleaned_paras.append(cp)

        cdata = {
            "id": c["id"],
            "title": title,
            "volume": c["volume"],
            "paragraphs": cleaned_paras
        }
        with open(os.path.join(chaps_dir, f"{c['id']}.json"), "w", encoding="utf-8") as f:
            json.dump(cdata, f, ensure_ascii=False)

    print(f"The King's Avatar built in {time.time() - t0:.2f} seconds.")

def build_supergene(base_reader_dir):
    print("\n--- BUILDING: Super Gene ---")
    source_dir = r"G:\books\Super Gene"
    novel_dir = os.path.join(base_reader_dir, "data", "supergene")
    chaps_dir = os.path.join(novel_dir, "chapters")
    os.makedirs(chaps_dir, exist_ok=True)

    # Copy cover
    cover_src = os.path.join(source_dir, "cover.jpeg")
    if os.path.exists(cover_src):
        shutil.copy2(cover_src, os.path.join(novel_dir, "cover.jpg"))

    opf_path = os.path.join(source_dir, "content.opf")
    with open(opf_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    manifest = {item.get("id"): item.get("href") for item in soup.find_all("item")}
    spine = [itemref.get("idref") for itemref in soup.find_all("itemref")]

    chapter_files = []
    for sid in spine:
        href = manifest.get(sid)
        if not href or "titlepage" in href:
            continue
        decoded = urllib.parse.unquote(href)
        fpath = os.path.join(source_dir, decoded.replace("/", os.sep))
        if os.path.exists(fpath):
            chapter_files.append(fpath)

    all_chapters = []
    print(f"Extracting {len(chapter_files)} chapters for Super Gene...")
    t0 = time.time()

    for idx, fpath in enumerate(chapter_files, 1):
        with open(fpath, "r", encoding="utf-8") as f:
            html = f.read()

        title_match = re.search(r"<h1>(.*?)</h1>", html, re.DOTALL)
        raw_title = title_match.group(1).strip() if title_match else f"Chapter {idx}"
        title = re.sub(r"<[^>]+>", "", raw_title).strip()

        # Group in chunks of 100 as volumes
        vol_num = (idx - 1) // 100 + 1
        vol_name = f"Volume {vol_num} (Ch. {(vol_num-1)*100+1}-{min(vol_num*100, len(chapter_files))})"

        raw_paras = re.findall(r"<p>(.*?)</p>", html, re.DOTALL)
        cleaned_paras = []
        for rp in raw_paras:
            cp = clean_paragraph(rp)
            if cp:
                cleaned_paras.append(cp)

        cdata = {
            "id": idx,
            "title": title,
            "volume": vol_name,
            "paragraphs": cleaned_paras
        }
        with open(os.path.join(chaps_dir, f"{idx}.json"), "w", encoding="utf-8") as f:
            json.dump(cdata, f, ensure_ascii=False)

        all_chapters.append({
            "id": idx,
            "title": title,
            "volume": vol_name
        })

    # Group into volumes_data
    vol_dict = {}
    for c in all_chapters:
        v = c["volume"]
        if v not in vol_dict:
            vol_dict[v] = []
        vol_dict[v].append(c["id"])

    volumes_data = [{"volume": k, "chapter_ids": v} for k, v in vol_dict.items()]

    with open(os.path.join(novel_dir, "toc.json"), "w", encoding="utf-8") as f:
        json.dump({
            "id": "supergene",
            "title": "Super Gene",
            "author": "Twelve-Winged Dark Seraphim",
            "total_chapters": len(all_chapters),
            "volumes": volumes_data,
            "chapters": all_chapters
        }, f, ensure_ascii=False)

    print(f"Super Gene built in {time.time() - t0:.2f} seconds ({len(all_chapters)} chapters).")

def build_index(base_reader_dir):
    novels = [
        {
            "id": "lmgip",
            "title": "Let Me Game In Peace",
            "author": "Twelve-Winged Dark Seraphim",
            "total_chapters": 1905,
            "volumes_count": 20,
            "status": "Completed",
            "cover": "data/lmgip/cover.jpg",
            "synopsis": "After the dimensional storms, dimensional zones appeared with immortals, monsters, angels, and devils. While everyone hunts dimensional creatures risking their lives, Zhou Wen plays on a mysterious phone and obtains drops effortlessly from within the game."
        },
        {
            "id": "tka",
            "title": "The King's Avatar",
            "author": "Butterfly Blue",
            "total_chapters": 1729,
            "volumes_count": 18,
            "status": "Completed",
            "cover": "data/tka/cover.jpg",
            "synopsis": "In the online game Glory, Ye Xiu is regarded as a textbook and a top-tier pro-player. Kicked from the team due to management disputes, he becomes a night manager at an Internet Cafe. When Glory launches its tenth server, he throws himself into the game once again."
        },
        {
            "id": "supergene",
            "title": "Super Gene",
            "author": "Twelve-Winged Dark Seraphim",
            "total_chapters": 3463,
            "volumes_count": 35,
            "status": "Completed",
            "cover": "data/supergene/cover.jpg",
            "synopsis": "In the magnificent interstellar era, humanity evolved to enter God's Sanctuary. By consuming the flesh of sacred-blood creatures, humans obtain geno points and evolve to godlike ranks. Han Sen, mocked as the 'Ass Man', begins his rise to supremacy by hunting dimensional creatures as Dollar."
        }
    ]

    with open(os.path.join(base_reader_dir, "data", "novels.json"), "w", encoding="utf-8") as f:
        json.dump(novels, f, indent=2, ensure_ascii=False)
    print("\nNovels index saved in data/novels.json.")

def main():
    reader_dir = os.path.abspath(os.path.dirname(__file__))
    build_lmgip(reader_dir)
    build_tka(reader_dir)
    build_supergene(reader_dir)
    build_index(reader_dir)
    print("\nALL 3 NOVELS COMPILED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
