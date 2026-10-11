/**
 * Donghua Web Novel Reader
 * Supports Library Bookshelf, Novel Details & TOC, and Distraction-free Chapter Reader
 */

(function () {
  'use strict';

  // --- STATE ---
  let novels = [];
  let currentNovelId = 'lmgip';
  let currentNovel = null;
  let tocData = null;
  let currentChapterId = 1;
  let currentChapterData = null;
  let currentView = 'library'; // 'library' | 'novel' | 'reader'
  let currentVolFilter = 'all';
  let shelfFilter = 'all';

  const defaultSettings = {
    theme: 'dark',
    customBg: '#181818',
    customText: '#e2ded7',
    fontFamily: "'Literata', Georgia, serif",
    fontSize: 18,
    lineHeight: 1.7,
    contentWidth: '760px',
    textAlign: 'left'
  };

  let settings = Object.assign({}, defaultSettings);

  // --- DOM ELEMENTS ---
  const libraryView = document.getElementById('library-view');
  const novelDetailView = document.getElementById('novel-detail-view');
  const readerView = document.getElementById('reader-view');

  const appHeader = document.getElementById('app-header');
  const btnHeaderBack = document.getElementById('btn-header-back');
  const headerLogoText = document.getElementById('header-logo-text');
  const headerNovelTitle = document.getElementById('header-novel-title');
  const headerChapterTitle = document.getElementById('header-chapter-title');
  const btnChapters = document.getElementById('btn-chapters');
  const btnSettings = document.getElementById('btn-settings');
  const mobileBottomNav = document.getElementById('mobile-bottom-nav');

  let lastScrollY = window.scrollY || 0;
  let isNavHidden = false;

  function setNavVisibility(hidden) {
    isNavHidden = hidden;
    if (hidden) {
      appHeader.classList.add('header-hidden');
      if (mobileBottomNav) mobileBottomNav.classList.add('nav-hidden');
    } else {
      appHeader.classList.remove('header-hidden');
      if (mobileBottomNav) mobileBottomNav.classList.remove('nav-hidden');
    }
  }

  // Library Bookshelf Elements
  const spotlightSection = document.getElementById('spotlight-section');
  const novelsGrid = document.getElementById('novels-grid');
  const countAll = document.getElementById('count-all');
  const countReading = document.getElementById('count-reading');
  const countCompleted = document.getElementById('count-completed');

  // Novel Detail View Elements
  const btnBackToLibrary = document.getElementById('btn-back-to-library');
  const novelCoverImg = document.getElementById('novel-cover-img');
  const novelTitleEl = document.getElementById('novel-title');
  const novelAuthorEl = document.getElementById('novel-author');
  const metaChaptersEl = document.getElementById('meta-chapters');
  const metaVolumesEl = document.getElementById('meta-volumes');
  const metaStatusEl = document.getElementById('meta-status');
  const novelSynopsisEl = document.getElementById('novel-synopsis');
  const btnContinue = document.getElementById('btn-continue-reading');
  const continueText = document.getElementById('continue-text');
  const btnBrowseChapters = document.getElementById('btn-browse-chapters');

  // Search and Jump
  const tocSearch = document.getElementById('toc-search');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const jumpInput = document.getElementById('jump-input');
  const btnJumpGo = document.getElementById('btn-jump-go');
  const volumePillsContainer = document.getElementById('volume-pills');
  const chapterListContainer = document.getElementById('chapter-list');

  // Reader elements
  const chapterVolumeTag = document.getElementById('chapter-volume-tag');
  const chapterTitleEl = document.getElementById('chapter-title');
  const chapterBodyEl = document.getElementById('chapter-body');

  // Mobile Bottom Nav Buttons
  const btnMobileLibrary = document.getElementById('btn-mobile-library');
  const btnMobileChapters = document.getElementById('btn-mobile-chapters');
  const btnMobileSettings = document.getElementById('btn-mobile-settings');

  // Modals
  const modalChapters = document.getElementById('modal-chapters');
  const modalChaptersTitle = document.getElementById('modal-chapters-title');
  const btnCloseChapters = document.getElementById('btn-close-chapters');
  const modalSearch = document.getElementById('modal-search');
  const modalVolumePills = document.getElementById('modal-volume-pills');
  const modalChaptersList = document.getElementById('modal-chapters-list');

  const modalSettings = document.getElementById('modal-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');

  // Settings inputs
  const fontSizeSlider = document.getElementById('font-size-slider');
  const fontSizeVal = document.getElementById('font-size-val');
  const fontDecBtn = document.getElementById('font-dec');
  const fontIncBtn = document.getElementById('font-inc');
  const lineHeightSlider = document.getElementById('line-height-slider');
  const lineHeightVal = document.getElementById('line-height-val');
  const pickerBg = document.getElementById('picker-bg');
  const pickerText = document.getElementById('picker-text');
  const btnResetColors = document.getElementById('btn-reset-colors');

  // --- INITIALIZATION ---
  async function init() {
    loadSettings();
    applySettings();
    initEventListeners();
    await fetchNovelsIndex();
  }

  // --- SETTINGS PERSISTENCE & APPLICATION ---
  function loadSettings() {
    try {
      const saved = localStorage.getItem('novel_reader_settings');
      if (saved) {
        settings = Object.assign({}, defaultSettings, JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load settings', e);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem('novel_reader_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  }

  function applySettings() {
    const root = document.documentElement;
    const body = document.body;

    if (settings.theme === 'custom') {
      body.setAttribute('data-theme', 'custom');
      root.style.setProperty('--bg-color', settings.customBg);
      root.style.setProperty('--text-color', settings.customText);
      root.style.setProperty('--card-bg', adjustBrightness(settings.customBg, 15));
      root.style.setProperty('--btn-bg', adjustBrightness(settings.customBg, 22));
    } else {
      body.setAttribute('data-theme', settings.theme);
      root.style.removeProperty('--bg-color');
      root.style.removeProperty('--text-color');
      root.style.removeProperty('--card-bg');
      root.style.removeProperty('--btn-bg');
    }

    root.style.setProperty('--font-family', settings.fontFamily);
    root.style.setProperty('--font-size', settings.fontSize + 'px');
    root.style.setProperty('--line-height', settings.lineHeight);
    root.style.setProperty('--content-width', settings.contentWidth);
    root.style.setProperty('--text-align', settings.textAlign);

    if (fontSizeSlider) fontSizeSlider.value = settings.fontSize;
    if (fontSizeVal) fontSizeVal.textContent = settings.fontSize + 'px';
    if (lineHeightSlider) lineHeightSlider.value = settings.lineHeight;
    if (lineHeightVal) lineHeightVal.textContent = settings.lineHeight;
    if (pickerBg) pickerBg.value = settings.customBg;
    if (pickerText) pickerText.value = settings.customText;

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === settings.theme);
    });

    document.querySelectorAll('.font-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.font === settings.fontFamily);
    });

    document.querySelectorAll('[data-width]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.width === settings.contentWidth);
    });

    document.querySelectorAll('[data-align]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.align === settings.textAlign);
    });
  }

  function adjustBrightness(hex, percent) {
    if (!hex || hex[0] !== '#') return hex;
    let num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  // --- FETCH NOVELS INDEX ---
  async function fetchNovelsIndex() {
    try {
      const res = await fetch('data/novels.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      novels = await res.json();

      updateShelfCounters();
      renderSpotlightCard();
      renderNovelsGrid();

      parseInitialRoute();
      window.addEventListener('hashchange', handleHashChange);
    } catch (err) {
      console.error('Error loading novels index:', err);
    }
  }

  function getUserNovelProgress(novelId) {
    try {
      const val = localStorage.getItem(`novel_last_chapter_${novelId}`);
      if (val !== null && !isNaN(parseInt(val, 10))) {
        return parseInt(val, 10);
      }
    } catch (e) {}
    return null;
  }

  function getNovelUserStatus(novel) {
    if (!novel) return { status: 'unread', label: 'Unread', chapter: 1 };
    const saved = getUserNovelProgress(novel.id);
    if (saved === null) {
      return { status: 'unread', label: 'Unread', chapter: 1 };
    }
    if (saved >= novel.total_chapters) {
      return { status: 'completed', label: 'Finished', chapter: saved };
    }
    return { status: 'reading', label: `Ch. ${saved} / ${novel.total_chapters}`, chapter: saved };
  }

  function getMostRecentlyReadNovel() {
    try {
      const active = localStorage.getItem('novel_reader_current_novel');
      if (active && novels.some(n => n.id === active)) {
        return novels.find(n => n.id === active);
      }
    } catch (e) {}
    const reading = novels.find(n => getNovelUserStatus(n).status === 'reading');
    return reading || novels[0];
  }

  // --- VIEW 1: LIBRARY BOOKSHELF HOMEPAGE ---
  function showLibraryView() {
    currentView = 'library';
    libraryView.style.display = 'block';
    novelDetailView.style.display = 'none';
    readerView.style.display = 'none';
    document.body.classList.remove('in-reader-mode');

    // Header state
    btnHeaderBack.title = 'Library';
    headerLogoText.style.display = 'inline-block';
    headerNovelTitle.textContent = '';
    headerChapterTitle.textContent = '';
    btnChapters.style.display = 'none';
    setNavVisibility(false);

    document.title = 'Donghua Web Novel Reader';
    updateShelfCounters();
    renderSpotlightCard();
    renderNovelsGrid();
  }

  function updateShelfCounters() {
    if (!countAll) return;
    countAll.textContent = novels.length;
    countReading.textContent = novels.filter(n => getNovelUserStatus(n).status === 'reading').length;
    countCompleted.textContent = novels.filter(n => getNovelUserStatus(n).status === 'completed').length;
  }

  function renderSpotlightCard() {
    if (!spotlightSection || novels.length === 0) return;
    const novel = getMostRecentlyReadNovel();
    const userProg = getNovelUserStatus(novel);
    const isCurrentlyReading = userProg.status === 'reading';
    const isFinished = userProg.status === 'completed';
    const chapterToRead = isFinished ? 1 : userProg.chapter;

    let badgeText = '⭐ Featured Novel';
    let buttonText = 'Start Reading (Ch. 1)';
    let progressTag = `${novel.total_chapters.toLocaleString()} Chapters`;

    if (isCurrentlyReading) {
      badgeText = '🟢 Currently Reading';
      buttonText = `Resume Ch. ${chapterToRead}`;
      progressTag = `Ch. ${chapterToRead} of ${novel.total_chapters}`;
    } else if (isFinished) {
      badgeText = '🏆 Finished';
      buttonText = 'Re-read from Ch. 1';
      progressTag = `Completed (${novel.total_chapters} Ch.)`;
    }

    spotlightSection.innerHTML = `
      <div class="spotlight-card">
        <div class="novel-cover-wrap" style="width:140px; min-width:120px;">
          <img src="${novel.cover}" alt="${escapeHTML(novel.title)}" class="novel-cover" loading="lazy" decoding="async" onerror="this.src='${novel.cover_fallback||novel.cover}'">
        </div>
        <div class="novel-info">
          <div class="spotlight-badge">${badgeText}</div>
          <h2 class="novel-title" style="font-size:24px; cursor:pointer;" onclick="location.hash='#novel/${novel.id}'">${escapeHTML(novel.title)}</h2>
          <p class="novel-author">By <span>${escapeHTML(novel.author)}</span></p>
          <div class="novel-meta-tags">
            <span class="meta-tag">${progressTag}</span>
            <span class="meta-tag">${novel.volumes_count} Volumes</span>
            <span class="meta-tag">${novel.status}</span>
          </div>
          <p class="novel-synopsis" style="margin-bottom:18px;">${escapeHTML(novel.synopsis)}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" onclick="location.hash='#read/${novel.id}/${chapterToRead}'">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>${buttonText}</span>
            </button>
            <button class="btn btn-secondary" onclick="location.hash='#novel/${novel.id}'">
              <span>View Chapters</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderNovelsGrid() {
    if (!novelsGrid) return;
    novelsGrid.innerHTML = '';

    let list = novels;
    if (shelfFilter === 'reading') {
      list = list.filter(n => getNovelUserStatus(n).status === 'reading');
    } else if (shelfFilter === 'completed') {
      list = list.filter(n => getNovelUserStatus(n).status === 'completed');
    }

    if (list.length === 0) {
      novelsGrid.innerHTML = '<div class="loading-state" style="grid-column: 1/-1;">No novels in this filter.</div>';
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach(n => {
      const userProg = getNovelUserStatus(n);
      const isReading = userProg.status === 'reading';
      const isFinished = userProg.status === 'completed';

      let badgeHtml = '';
      let readBtnText = 'Start Reading';
      let targetCh = 1;

      if (isReading) {
        badgeHtml = `<span class="status-badge reading">🟢 Ch. ${userProg.chapter} / ${n.total_chapters}</span>`;
        readBtnText = `Resume Ch. ${userProg.chapter}`;
        targetCh = userProg.chapter;
      } else if (isFinished) {
        badgeHtml = `<span class="status-badge completed">🏆 Finished</span>`;
        readBtnText = `Re-read Ch. 1`;
        targetCh = 1;
      } else {
        badgeHtml = `<span class="status-badge" style="background:var(--btn-bg); color:var(--text-muted); border:1px solid var(--card-border);">✨ Unread</span>`;
        readBtnText = 'Read (Ch. 1)';
        targetCh = 1;
      }

      const card = document.createElement('div');
      card.className = 'novel-grid-card';
      card.innerHTML = `
        <div class="novel-grid-thumb-wrap" style="cursor:pointer;">
          <img src="${n.cover}" alt="${escapeHTML(n.title)}" class="novel-grid-thumb" loading="lazy" decoding="async" onerror="this.src='${n.cover_fallback||n.cover}'">
        </div>
        <div class="novel-grid-info">
          <div class="novel-grid-top">
            ${badgeHtml}
            <span style="font-size:11px; color:var(--text-muted);">${n.status}</span>
          </div>
          <h3 class="novel-grid-title" title="${escapeHTML(n.title)}" style="cursor:pointer;">${escapeHTML(n.title)}</h3>
          <div class="novel-grid-author">By ${escapeHTML(n.author)}</div>
          <div class="novel-grid-stats">${n.total_chapters.toLocaleString()} Chapters • ${n.volumes_count} Volumes</div>
          <div class="novel-grid-synopsis">${escapeHTML(n.synopsis)}</div>
          <div class="novel-grid-actions">
            <button class="btn btn-primary btn-small btn-grid-read">
              ${readBtnText}
            </button>
            <button class="btn btn-secondary btn-small btn-grid-chaps">
              Chapters
            </button>
          </div>
        </div>
      `;

      card.querySelector('.novel-grid-thumb-wrap').addEventListener('click', () => {
        window.location.hash = `#novel/${n.id}`;
      });
      card.querySelector('.novel-grid-title').addEventListener('click', () => {
        window.location.hash = `#novel/${n.id}`;
      });
      card.querySelector('.btn-grid-read').addEventListener('click', () => {
        window.location.hash = `#read/${n.id}/${targetCh}`;
      });
      card.querySelector('.btn-grid-chaps').addEventListener('click', () => {
        window.location.hash = `#novel/${n.id}`;
      });

      frag.appendChild(card);
    });

    novelsGrid.appendChild(frag);
  }

  // --- VIEW 2: NOVEL DETAIL & TABLE OF CONTENTS ---
  async function showNovelDetailView(novelId) {
    const novel = novels.find(n => n.id === novelId);
    if (!novel) {
      showLibraryView();
      return;
    }

    currentNovelId = novel.id;
    currentNovel = novel;
    currentView = 'novel';

    try {
      localStorage.setItem('novel_reader_current_novel', novel.id);
    } catch (e) {}

    libraryView.style.display = 'none';
    novelDetailView.style.display = 'block';
    readerView.style.display = 'none';
    document.body.classList.remove('in-reader-mode');
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Header State
    headerLogoText.style.display = 'none';
    headerNovelTitle.textContent = novel.title;
    headerChapterTitle.textContent = '';
    btnChapters.style.display = 'none';
    setNavVisibility(false);
    document.title = `${novel.title} - Donghua Reader`;

    // Populate Hero Card
    novelCoverImg.src = novel.cover;
    novelCoverImg.dataset.fallback = novel.cover_fallback || novel.cover;
    novelTitleEl.textContent = novel.title;
    novelAuthorEl.textContent = novel.author;
    metaChaptersEl.textContent = `${novel.total_chapters.toLocaleString()} Chapters`;
    metaVolumesEl.textContent = `${novel.volumes_count} Volumes`;
    metaStatusEl.textContent = novel.status || 'Completed Story';
    novelSynopsisEl.textContent = novel.synopsis;

    // Fetch this novel's TOC
    await fetchTOC(novel.id);
  }

  async function fetchTOC(novelId) {
    try {
      chapterListContainer.innerHTML = '<div class="loading-state">Loading chapters...</div>';
      const res = await fetch(`data/${novelId}/toc.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      tocData = await res.json();

      currentVolFilter = 'all';
      renderVolumePills();
      renderChapterList();
      renderModalVolumePills();
      updateContinueButton();
    } catch (err) {
      console.error(`Error loading TOC for ${novelId}:`, err);
      chapterListContainer.innerHTML = `
        <div class="loading-state" style="color:#ef4444;">
          Failed to load Table of Contents for ${escapeHTML(currentNovel.title)}.
        </div>`;
    }
  }

  function updateContinueButton() {
    const saved = getUserNovelProgress(currentNovelId);
    const last = saved !== null ? saved : 1;
    currentChapterId = last;
    if (saved !== null && saved > 1 && tocData) {
      const chap = tocData.chapters.find(c => c.id === last);
      const cleanTitle = chap ? chap.title.replace(/^Chapter\s+\d+\s*[-:]?\s*/i, '') : '';
      continueText.textContent = `Continue Ch. ${last}: ${cleanTitle}`;
    } else {
      continueText.textContent = 'Start Reading (Ch. 1)';
    }
  }

  function renderVolumePills() {
    if (!tocData || !tocData.volumes) return;
    volumePillsContainer.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = `vol-pill ${currentVolFilter === 'all' ? 'active' : ''}`;
    allBtn.dataset.vol = 'all';
    allBtn.textContent = `All (1-${tocData.total_chapters})`;
    allBtn.addEventListener('click', () => filterByVolume('all'));
    volumePillsContainer.appendChild(allBtn);

    tocData.volumes.forEach(vol => {
      const pill = document.createElement('button');
      pill.className = `vol-pill ${currentVolFilter === vol.volume ? 'active' : ''}`;
      pill.dataset.vol = vol.volume;
      const count = vol.chapter_ids.length;
      const start = vol.chapter_ids[0];
      const end = vol.chapter_ids[count - 1];
      pill.textContent = `${vol.volume} (${start}-${end})`;
      pill.addEventListener('click', () => filterByVolume(vol.volume));
      volumePillsContainer.appendChild(pill);
    });
  }

  function filterByVolume(vol) {
    currentVolFilter = vol;
    document.querySelectorAll('#volume-pills .vol-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.vol === vol);
    });
    renderChapterList();
  }

  function renderChapterList() {
    if (!tocData) return;
    const query = (tocSearch.value || '').trim().toLowerCase();
    chapterListContainer.innerHTML = '';

    let chaptersToRender = tocData.chapters;

    if (currentVolFilter !== 'all') {
      chaptersToRender = chaptersToRender.filter(c => c.volume === currentVolFilter);
    }

    if (query) {
      chaptersToRender = chaptersToRender.filter(c => {
        const idMatch = c.id.toString() === query;
        const titleMatch = c.title.toLowerCase().includes(query);
        return idMatch || titleMatch;
      });
    }

    if (chaptersToRender.length === 0) {
      chapterListContainer.innerHTML = '<div class="loading-state">No chapters found matching your search.</div>';
      return;
    }

    const savedProg = getUserNovelProgress(currentNovelId);
    const frag = document.createDocumentFragment();
    chaptersToRender.forEach(c => {
      const card = document.createElement('div');
      card.className = `chapter-card-item ${savedProg !== null && c.id === savedProg ? 'current-reading' : ''}`;
      card.innerHTML = `
        <span class="chapter-card-num">Chapter ${c.id}</span>
        <span class="chapter-card-title">${escapeHTML(c.title)}</span>
      `;
      card.addEventListener('click', () => {
        window.location.hash = `#read/${currentNovelId}/${c.id}`;
      });
      frag.appendChild(card);
    });

    chapterListContainer.appendChild(frag);
  }

  // --- VIEW 3: CHAPTER READER VIEW ---
  async function showReaderView(novelId, chapterId) {
    const novel = novels.find(n => n.id === novelId);
    if (!novel) {
      showLibraryView();
      return;
    }

    currentNovelId = novel.id;
    currentNovel = novel;
    currentChapterId = chapterId;
    currentView = 'reader';

    try {
      localStorage.setItem('novel_reader_current_novel', novel.id);
      localStorage.setItem(`novel_last_chapter_${novel.id}`, chapterId);
    } catch (e) {}

    libraryView.style.display = 'none';
    novelDetailView.style.display = 'none';
    readerView.style.display = 'block';
    document.body.classList.add('in-reader-mode');
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Header State
    headerLogoText.style.display = 'none';
    headerNovelTitle.textContent = novel.title;
    headerChapterTitle.textContent = `Ch. ${chapterId}`;
    btnChapters.style.display = 'inline-flex';

    setNavVisibility(false);
    lastScrollY = 0;

    if (!tocData || tocData.id !== novelId) {
      fetchTOC(novelId).catch(console.error);
    }

    await loadChapterContent(novelId, chapterId);
    updateNavButtons();
  }

  async function loadChapterContent(novelId, chapterId) {
    chapterBodyEl.innerHTML = '<div class="loading-state">Loading chapter content...</div>';
    chapterTitleEl.textContent = `Chapter ${chapterId}`;
    chapterVolumeTag.textContent = '';

    try {
      const res = await fetch(`data/${novelId}/chapters/${chapterId}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      currentChapterData = data;

      chapterTitleEl.textContent = data.title;
      chapterVolumeTag.textContent = data.volume || '';
      document.title = `${data.title} - ${currentNovel.title}`;

      let html = '';
      data.paragraphs.forEach(p => {
        html += `<p>${p}</p>`;
      });
      chapterBodyEl.innerHTML = html;

      restoreScrollPosition(novelId, chapterId);
    } catch (err) {
      console.error('Error loading chapter:', err);
      chapterBodyEl.innerHTML = `
        <div class="loading-state" style="color:#ef4444;">
          Failed to load Chapter ${chapterId} for ${escapeHTML(currentNovel.title)}.
        </div>`;
    }
  }

  function restoreScrollPosition(novelId, id) {
    try {
      const key = `novel_scroll_${novelId}_${id}`;
      const savedY = sessionStorage.getItem(key);
      if (savedY) {
        window.scrollTo({ top: parseInt(savedY, 10), behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    } catch (e) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  function updateNavButtons() {
    const total = currentNovel ? currentNovel.total_chapters : 1000;
    const isFirst = currentChapterId <= 1;
    const isLast = currentChapterId >= total;

    document.querySelectorAll('.btn-prev-chapter').forEach(btn => {
      btn.disabled = isFirst;
    });

    document.querySelectorAll('.btn-next-chapter').forEach(btn => {
      btn.disabled = isLast;
    });
  }

  function navigateToChapter(id) {
    const total = currentNovel ? currentNovel.total_chapters : 1000;
    if (id < 1 || id > total) return;
    window.location.hash = `#read/${currentNovelId}/${id}`;
    closeModals();
  }

  // --- ROUTING ---
  function parseInitialRoute() {
    const hash = window.location.hash || '';
    handleRouteString(hash);
  }

  function handleHashChange() {
    const hash = window.location.hash || '';
    handleRouteString(hash);
  }

  function handleRouteString(hash) {
    const clean = hash.replace(/^#/, '').trim();
    if (!clean || clean === 'library') {
      showLibraryView();
      return;
    }

    const parts = clean.split('/');

    // Formats:
    // 1. #read/<novelId>/<chapterId>
    if (parts[0] === 'read' && parts[1] && parts[2]) {
      showReaderView(parts[1], parseInt(parts[2], 10));
      return;
    }

    // 2. #novel/<novelId>
    if (parts[0] === 'novel' && parts[1]) {
      showNovelDetailView(parts[1]);
      return;
    }

    // 3. #<novelId>/<chapterId> (shortcut)
    const directNovel = novels.find(n => n.id === parts[0].toLowerCase());
    if (directNovel) {
      if (parts[1]) {
        showReaderView(directNovel.id, parseInt(parts[1], 10));
      } else {
        showNovelDetailView(directNovel.id);
      }
      return;
    }

    // Default to Library
    showLibraryView();
  }

  // --- CHAPTER DRAWER MODAL ---
  function renderModalVolumePills() {
    if (!tocData || !tocData.volumes) return;
    modalVolumePills.innerHTML = '';
    modalChaptersTitle.textContent = `${currentNovel.title} - Chapters`;

    const allBtn = document.createElement('button');
    allBtn.className = 'vol-pill active';
    allBtn.dataset.vol = 'all';
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', () => filterModalVolumes('all'));
    modalVolumePills.appendChild(allBtn);

    tocData.volumes.forEach(vol => {
      const pill = document.createElement('button');
      pill.className = 'vol-pill';
      pill.dataset.vol = vol.volume;
      pill.textContent = vol.volume;
      pill.addEventListener('click', () => filterModalVolumes(vol.volume));
      modalVolumePills.appendChild(pill);
    });
  }

  let modalVolFilter = 'all';
  function filterModalVolumes(vol) {
    modalVolFilter = vol;
    modalVolumePills.querySelectorAll('.vol-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.vol === vol);
    });
    renderModalChaptersList();
  }

  function renderModalChaptersList() {
    if (!tocData) return;
    const query = (modalSearch.value || '').trim().toLowerCase();
    modalChaptersList.innerHTML = '';

    let list = tocData.chapters;
    if (modalVolFilter !== 'all') {
      list = list.filter(c => c.volume === modalVolFilter);
    }
    if (query) {
      list = list.filter(c => c.id.toString() === query || c.title.toLowerCase().includes(query));
    }

    const frag = document.createDocumentFragment();
    list.forEach(c => {
      const item = document.createElement('div');
      item.className = `drawer-chapter-item ${c.id === currentChapterId ? 'current' : ''}`;
      item.textContent = c.title;
      item.addEventListener('click', () => {
        navigateToChapter(c.id);
      });
      frag.appendChild(item);
    });

    modalChaptersList.appendChild(frag);
  }

  function openChaptersModal() {
    modalChapters.style.display = 'flex';
    modalSearch.value = '';
    renderModalChaptersList();
    setTimeout(() => {
      const currentEl = modalChaptersList.querySelector('.current');
      if (currentEl) currentEl.scrollIntoView({ block: 'center' });
    }, 50);
  }

  function openSettingsModal() {
    modalSettings.style.display = 'flex';
  }

  function closeModals() {
    modalChapters.style.display = 'none';
    modalSettings.style.display = 'none';
  }

  // --- EVENT LISTENERS ---
  function initEventListeners() {
    // Header back / library button
    btnHeaderBack.addEventListener('click', () => {
      if (currentView === 'reader') {
        window.location.hash = `#novel/${currentNovelId}`;
      } else if (currentView === 'novel') {
        window.location.hash = '#library';
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    btnBackToLibrary.addEventListener('click', () => {
      window.location.hash = '#library';
    });

    headerNovelTitle.addEventListener('click', () => {
      if (currentView === 'reader') {
        window.location.hash = `#novel/${currentNovelId}`;
      }
    });

    btnChapters.addEventListener('click', openChaptersModal);
    btnSettings.addEventListener('click', openSettingsModal);

    // Mobile Bottom Nav
    btnMobileLibrary.addEventListener('click', () => {
      window.location.hash = '#library';
    });
    btnMobileChapters.addEventListener('click', openChaptersModal);
    btnMobileSettings.addEventListener('click', openSettingsModal);

    // Shelf Filters
    document.querySelectorAll('.shelf-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.shelf-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        shelfFilter = btn.dataset.filter;
        renderNovelsGrid();
      });
    });

    // Modal Close
    btnCloseChapters.addEventListener('click', closeModals);
    btnCloseSettings.addEventListener('click', closeModals);

    modalChapters.addEventListener('click', e => {
      if (e.target === modalChapters) closeModals();
    });
    modalSettings.addEventListener('click', e => {
      if (e.target === modalSettings) closeModals();
    });

    // Novel Detail Actions
    btnContinue.addEventListener('click', () => {
      navigateToChapter(currentChapterId || 1);
    });

    btnBrowseChapters.addEventListener('click', () => {
      document.getElementById('toc-section').scrollIntoView({ behavior: 'smooth' });
    });

    // Search and Jump
    tocSearch.addEventListener('input', () => {
      btnClearSearch.style.display = tocSearch.value ? 'block' : 'none';
      renderChapterList();
    });

    btnClearSearch.addEventListener('click', () => {
      tocSearch.value = '';
      btnClearSearch.style.display = 'none';
      renderChapterList();
    });

    modalSearch.addEventListener('input', renderModalChaptersList);

    btnJumpGo.addEventListener('click', executeJump);
    jumpInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') executeJump();
    });

    function executeJump() {
      const val = parseInt(jumpInput.value, 10);
      const total = currentNovel ? currentNovel.total_chapters : 1000;
      if (!isNaN(val) && val >= 1 && val <= total) {
        navigateToChapter(val);
        jumpInput.value = '';
      } else {
        alert(`Please enter a valid chapter number between 1 and ${total}.`);
      }
    }

    // Prev / Next Chapter Buttons
    document.querySelectorAll('.btn-prev-chapter').forEach(btn => {
      btn.addEventListener('click', () => {
        if (currentChapterId > 1) navigateToChapter(currentChapterId - 1);
      });
    });

    document.querySelectorAll('.btn-next-chapter').forEach(btn => {
      btn.addEventListener('click', () => {
        const total = currentNovel ? currentNovel.total_chapters : 1000;
        if (currentChapterId < total) navigateToChapter(currentChapterId + 1);
      });
    });

    document.querySelectorAll('.btn-toc-jump').forEach(btn => {
      btn.addEventListener('click', openChaptersModal);
    });

    // Reading Settings Controls
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        settings.theme = btn.dataset.theme;
        applySettings();
        saveSettings();
      });
    });

    pickerBg.addEventListener('input', e => {
      settings.theme = 'custom';
      settings.customBg = e.target.value;
      applySettings();
      saveSettings();
    });

    pickerText.addEventListener('input', e => {
      settings.theme = 'custom';
      settings.customText = e.target.value;
      applySettings();
      saveSettings();
    });

    btnResetColors.addEventListener('click', () => {
      settings.theme = 'dark';
      settings.customBg = defaultSettings.customBg;
      settings.customText = defaultSettings.customText;
      applySettings();
      saveSettings();
    });

    document.querySelectorAll('.font-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        settings.fontFamily = btn.dataset.font;
        applySettings();
        saveSettings();
      });
    });

    fontSizeSlider.addEventListener('input', e => {
      settings.fontSize = parseInt(e.target.value, 10);
      applySettings();
      saveSettings();
    });

    fontDecBtn.addEventListener('click', () => {
      if (settings.fontSize > 14) {
        settings.fontSize -= 1;
        applySettings();
        saveSettings();
      }
    });

    fontIncBtn.addEventListener('click', () => {
      if (settings.fontSize < 32) {
        settings.fontSize += 1;
        applySettings();
        saveSettings();
      }
    });

    lineHeightSlider.addEventListener('input', e => {
      settings.lineHeight = parseFloat(e.target.value);
      applySettings();
      saveSettings();
    });

    document.querySelectorAll('[data-width]').forEach(btn => {
      btn.addEventListener('click', () => {
        settings.contentWidth = btn.dataset.width;
        applySettings();
        saveSettings();
      });
    });

    document.querySelectorAll('[data-align]').forEach(btn => {
      btn.addEventListener('click', () => {
        settings.textAlign = btn.dataset.align;
        applySettings();
        saveSettings();
      });
    });

    // Scroll handling: Auto-hide header & bottom nav on scroll down, reveal on scroll up
    window.addEventListener('scroll', () => {
      if (currentView !== 'reader') return;

      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY > 60 && delta > 8) {
        if (!isNavHidden) {
          setNavVisibility(true);
        }
      } else if (delta < -10 || currentScrollY <= 20) {
        if (isNavHidden) {
          setNavVisibility(false);
        }
      }

      lastScrollY = Math.max(0, currentScrollY);

      if (currentChapterId) {
        sessionStorage.setItem(`novel_scroll_${currentNovelId}_${currentChapterId}`, Math.round(currentScrollY));
      }
    }, { passive: true });

    // Laptop hover near top of screen reveals header
    window.addEventListener('mousemove', e => {
      if (currentView !== 'reader') return;
      if (e.clientY <= 30 && isNavHidden) {
        setNavVisibility(false);
      }
    }, { passive: true });

    // Tap reading area toggles navigation on/off
    const readerContainer = document.getElementById('reader-container');
    if (readerContainer) {
      readerContainer.addEventListener('click', e => {
        if (currentView !== 'reader') return;
        if (e.target.closest('button, a, input, select, textarea, .btn')) return;
        const sel = window.getSelection();
        if (sel && sel.toString().length > 0) return;

        setNavVisibility(!isNavHidden);
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', e => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (currentView === 'reader' && currentChapterId > 1) {
          navigateToChapter(currentChapterId - 1);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        const total = currentNovel ? currentNovel.total_chapters : 1000;
        if (currentView === 'reader' && currentChapterId < total) {
          navigateToChapter(currentChapterId + 1);
        }
      } else if (e.key === 't' || e.key === 'T' || e.key === 'c' || e.key === 'C') {
        if (currentView === 'reader') {
          if (modalChapters.style.display === 'flex') {
            closeModals();
          } else {
            openChaptersModal();
          }
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (modalSettings.style.display === 'flex') {
          closeModals();
        } else {
          openSettingsModal();
        }
      } else if (e.key === 'Escape') {
        closeModals();
      }
    });
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
