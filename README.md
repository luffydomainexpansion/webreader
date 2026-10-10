# Web Novel Reader (3 Novels)

A lightweight, modern, responsive static web novel reader designed for comfortable reading on phones, tablets, and laptops.

## Included Novels (7,097 Total Chapters)
1. 🎮 **Let Me Game In Peace** (1,905 Chapters, 20 Volumes) — Author: *Twelve-Winged Dark Seraphim*
2. 🏆 **The King's Avatar** (1,729 Chapters, 18 Volumes) — Author: *Butterfly Blue*
3. 🧬 **Super Gene** (3,463 Chapters, 35 Volumes) — Author: *Twelve-Winged Dark Seraphim*

---

## Features
- **One Unified Reader & Library**: Switch between novels seamlessly from the home screen tabs or the top **Library** button.
- **Independent Reading Progress**: Each novel automatically remembers your last-read chapter and scroll position in `localStorage`.
- **Distraction-Free Reading Mode**:
  - The top header and chapter title automatically slide out of view as you scroll down to read.
  - Hovering near the top of the screen on a laptop/desktop brings the header down smoothly.
  - Tapping anywhere on the reading canvas toggles controls.
  - Zero progress bar lines or watermark clutter.
- **7 Themes & Custom Colors**:
  - Dark Charcoal, OLED Pitch Black (battery saver for phone OLED screens), Warm Beige Paper, Classic Sepia, Clean Light, Midnight Blue, Forest Dark.
  - Custom background and text color pickers.
- **Typography Controls**:
  - Fonts: Literata, Georgia (Serif), Merriweather, Lora, System Sans, Roboto.
  - Adjustable Font Size & Line Spacing sliders with `A-` / `A+` buttons.
  - Reading Width (Narrow, Normal, Wide, Full) and Alignment (Left, Justified).
- **Laptop Keyboard Navigation**:
  - `←` / `A`: Previous Chapter
  - `→` / `D`: Next Chapter
  - `T` / `C`: Open Chapter List
  - `L`: Open Novels Library
  - `S`: Open Reader Settings
  - `Esc`: Close open drawers

---

## How to Read & Host

### 1. Locally on Laptop & Phone (Same Wi-Fi)
1. Double-click `start_reader.bat` (or run `python serve.py`).
2. Opens `http://localhost:8000` automatically on your laptop.
3. Open the phone URL printed in the terminal (e.g. `http://192.168.1.X:8000`) on your phone or tablet on the same Wi-Fi.

### 2. Deploy to Render (e.g. `webreader.onrender.com`)
1. Push this `web_reader` folder to a GitHub repository.
2. Go to [render.com](https://render.com) and click **New +** -> **Static Site**.
3. Connect your repository.
4. Set:
   - **Publish directory**: `web_reader` (or `.` if the repo is just this folder).
5. Choose your subdomain (e.g. `webreader` to get `webreader.onrender.com`).
6. Click **Create Static Site**. It will deploy for free!

### 3. Deploy to Vercel / Netlify / Cloudflare Pages
- **Vercel**: Import your repo, set Root Directory to `web_reader`, and click Deploy.
- **Netlify**: Drag and drop the `web_reader` folder directly into [app.netlify.com/drop](https://app.netlify.com/drop).
