/**
 * Multi-Novel Web Reader
 * Supports: Let Me Game In Peace, The King's Avatar, Super Gene
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
  let currentView = 'home'; // 'home' | 'reader'
  let currentVolFilter = 'all';

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
  const homeView = document.getElementById('home-view');
  const readerView = document.getElementById('reader-view');
  const appHeader = document.getElementById('app-header');
  const headerNovelTitle = document.getElementById('header-novel-title');
  const headerChapterTitle = document.getElementById('header-chapter-title');
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

  // Home Hero elements
  const novelSwitchBar = document.getElementById('novel-switch-bar');
  const novelCoverImg = document.getElementById('novel-cover-img');
  const novelTitleEl = document.getElementById('novel-title');
  const novelAuthorEl = document.getElementById('novel-author');
  const metaChaptersEl = document.getElementById('meta-chapters');
  const metaVolumesEl = document.getElementById('meta-volumes');
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

  // Buttons
  const btnHome = document.getElementById('btn-home');
  const btnLibrary = document.getElementById('btn-library');
  const btnMobileLibrary = document.getElementById('btn-mobile-library');
  const btnChapters = document.getElementById('btn-chapters');
  const btnSettings = document.getElementById('btn-settings');
  const btnMobileChapters = document.getElementById('btn-mobile-chapters');
  const btnMobileSettings = document.getElementById('btn-mobile-settings');

  // Modals
  const modalLibrary = document.getElementById('modal-library');
  const btnCloseLibrary = document.getElementById('btn-close-library');
  const libraryCardsList = document.getElementById('library-cards-list');

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

      renderNovelSwitchBar();
      renderLibraryCards();

      // Determine initial novel from URL or localStorage
      parseInitialRoute();
    } catch (err) {
      console.error('Error loading novels index:', err);
    }
  }

  function parseInitialRoute() {
    const hash = window.location.hash || '';

    // Route format: #<novelId>/<chapterId> or #<novelId>
    let matchedNovel = 'lmgip';
    let matchedChapter = null;

    const parts = hash.replace(/^#/, '').split('/');
    if (parts[0]) {
      const found = novels.find(n => n.id === parts[0].toLowerCase());
      if (found) {
        matchedNovel = found.id;
        if (parts[1]) {
          matchedChapter = parseInt(parts[1], 10);
        }
      } else {
        // Fallback: check #chapter-X legacy
        const legacyMatch = hash.match(/#chapter-(\d+)/);
        if (legacyMatch) {
          matchedChapter = parseInt(legacyMatch[1], 10);
        }
      }
    } else {
      try {
        const savedNovel = localStorage.getItem('novel_reader_current_novel');
        if (savedNovel && novels.some(n => n.id === savedNovel)) {
          matchedNovel = savedNovel;
        }
      } catch (e) {}
    }

    switchNovel(matchedNovel, matchedChapter);
    window.addEventListener('hashchange', handleHashChange);
  }

  function handleHashChange() {
    const hash = window.location.hash || '';
    const parts = hash.replace(/^#/, '').split('/');
    if (!parts[0] || parts[0] === 'home') {
      showHomeView();
      return;
    }

    const novel = novels.find(n => n.id === parts[0].toLowerCase());
    if (novel) {
      if (parts[1]) {
        const chNum = parseInt(parts[1], 10);
        if (currentNovelId !== novel.id) {
          switchNovel(novel.id, chNum);
        } else {
          showReaderView(chNum);
        }
      } else {
        if (currentNovelId !== novel.id) {
          switchNovel(novel.id, null);
        } else {
          showHomeView();
        }
      }
    }
  }

  // --- NOVEL SWITCHING ---
  async function switchNovel(novelId, targetChapter = null) {
    currentNovelId = novelId;
    currentNovel = novels.find(n => n.id === novelId) || novels[0];

    try {
      localStorage.setItem('novel_reader_current_novel', novelId);
    } catch (e) {}

    // Update active tab & header title
    headerNovelTitle.textContent = `${currentNovel.title} ▾`;
    document.title = `${currentNovel.title} - Web Reader`;

    document.querySelectorAll('.novel-switch-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.novel === novelId);
    });

    document.querySelectorAll('.library-card-item').forEach(c => {
      c.classList.toggle('active', c.dataset.novel === novelId);
    });

    // Update Hero Card
    novelCoverImg.src = currentNovel.cover;
    novelTitleEl.textContent = currentNovel.title;
    novelAuthorEl.textContent = currentNovel.author;
    metaChaptersEl.textContent = `${currentNovel.total_chapters.toLocaleString()} Chapters`;
    metaVolumesEl.textContent = `${currentNovel.volumes_count} Volumes`;
    novelSynopsisEl.textContent = currentNovel.synopsis;

    // Fetch this novel's TOC
    await fetchTOC(novelId);

    // Navigate to chapter or home
    if (targetChapter && targetChapter >= 1 && targetChapter <= currentNovel.total_chapters) {
      showReaderView(targetChapter);
    } else {
      showHomeView();
    }
  }

  function renderNovelSwitchBar() {
    novelSwitchBar.innerHTML = '';
    novels.forEach(n => {
      const tab = document.createElement('div');
      tab.className = `novel-switch-tab ${n.id === currentNovelId ? 'active' : ''}`;
      tab.dataset.novel = n.id;
      tab.innerHTML = `
        <span class="novel-tab-dot"></span>
        <span>${escapeHTML(n.title)}</span>
        <span class="novel-tab-badge">${n.total_chapters} ch</span>
      `;
      tab.addEventListener('click', () => {
        if (currentNovelId !== n.id) {
          window.location.hash = `#${n.id}`;
        }
      });
      novelSwitchBar.appendChild(tab);
    });
  }

  function renderLibraryCards() {
    libraryCardsList.innerHTML = '';
    novels.forEach(n => {
      const card = document.createElement('div');
      card.className = `library-card-item ${n.id === currentNovelId ? 'active' : ''}`;
      card.dataset.novel = n.id;
      card.innerHTML = `
        <img src="${n.cover}" alt="${escapeHTML(n.title)}" class="library-card-thumb" onerror="this.style.display='none'">
        <div class="library-card-details">
          <div class="library-card-title">${escapeHTML(n.title)}</div>
          <div class="library-card-author">By ${escapeHTML(n.author)}</div>
          <div class="library-card-stats">${n.total_chapters} Chapters • ${n.status}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        closeModals();
        window.location.hash = `#${n.id}`;
      });
      libraryCardsList.appendChild(card);
    });
  }

  // --- FETCH TOC FOR CURRENT NOVEL ---
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

  // --- HOME VIEW LOGIC ---
  function updateContinueButton() {
    let last = 1;
    try {
      const stored = localStorage.getItem(`novel_last_chapter_${currentNovelId}`);
      if (stored) last = parseInt(stored, 10);
    } catch (e) {}

    currentChapterId = last;
    if (last > 1 && tocData) {
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

    const frag = document.createDocumentFragment();
    chaptersToRender.forEach(c => {
      const card = document.createElement('div');
      card.className = `chapter-card-item ${c.id === currentChapterId ? 'current-reading' : ''}`;
      card.innerHTML = `
        <span class="chapter-card-num">Chapter ${c.id}</span>
        <span class="chapter-card-title">${escapeHTML(c.title)}</span>
      `;
      card.addEventListener('click', () => {
        navigateToChapter(c.id);
      });
      frag.appendChild(card);
    });

    chapterListContainer.appendChild(frag);
  }

  // --- READER VIEW LOGIC ---
  async function showReaderView(chapterId) {
    currentChapterId = chapterId;
    currentView = 'reader';

    homeView.style.display = 'none';
    readerView.style.display = 'block';
    document.body.classList.add('in-reader-mode');
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Update Header
    headerNovelTitle.textContent = currentNovel.title;
    headerChapterTitle.textContent = `Ch. ${chapterId}`;
    if (tocData) {
      const chapMeta = tocData.chapters.find(c => c.id === chapterId);
      if (chapMeta) {
        headerChapterTitle.textContent = `Ch. ${chapterId}: ${chapMeta.title.replace(/^Chapter\s+\d+\s*[-:]?\s*/i, '')}`;
      }
    }

    // Save Last Read for current novel
    try {
      localStorage.setItem(`novel_last_chapter_${currentNovelId}`, chapterId);
    } catch (e) {}

    // Reset navigation visibility to show header initially
    setNavVisibility(false);
    lastScrollY = 0;

    await loadChapterContent(chapterId);
    updateNavButtons();
  }

  function showHomeView() {
    currentView = 'home';
    homeView.style.display = 'block';
    readerView.style.display = 'none';
    document.body.classList.remove('in-reader-mode');
    headerNovelTitle.textContent = `${currentNovel ? currentNovel.title : 'Novels'} ▾`;
    headerChapterTitle.textContent = '';
    setNavVisibility(false);
    updateContinueButton();
  }

  async function loadChapterContent(id) {
    chapterBodyEl.innerHTML = '<div class="loading-state">Loading chapter content...</div>';
    chapterTitleEl.textContent = `Chapter ${id}`;
    chapterVolumeTag.textContent = '';

    try {
      const res = await fetch(`data/${currentNovelId}/chapters/${id}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      currentChapterData = data;

      chapterTitleEl.textContent = data.title;
      chapterVolumeTag.textContent = data.volume || '';

      let html = '';
      data.paragraphs.forEach(p => {
        html += `<p>${p}</p>`;
      });
      chapterBodyEl.innerHTML = html;

      restoreScrollPosition(id);
    } catch (err) {
      console.error('Error loading chapter:', err);
      chapterBodyEl.innerHTML = `
        <div class="loading-state" style="color:#ef4444;">
          Failed to load Chapter ${id} for ${escapeHTML(currentNovel.title)}.
        </div>`;
    }
  }

  function restoreScrollPosition(id) {
    try {
      const key = `novel_scroll_${currentNovelId}_${id}`;
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
    const total = tocData ? tocData.total_chapters : 1000;
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
    const total = tocData ? tocData.total_chapters : 1000;
    if (id < 1 || id > total) return;
    window.location.hash = `#${currentNovelId}/${id}`;
    closeModals();
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

  function openLibraryModal() {
    modalLibrary.style.display = 'flex';
  }

  function openSettingsModal() {
    modalSettings.style.display = 'flex';
  }

  function closeModals() {
    modalLibrary.style.display = 'none';
    modalChapters.style.display = 'none';
    modalSettings.style.display = 'none';
  }

  // --- EVENT LISTENERS ---
  function initEventListeners() {
    // Header Buttons
    btnHome.addEventListener('click', () => {
      if (currentView === 'reader') {
        window.location.hash = `#${currentNovelId}`;
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    headerNovelTitle.addEventListener('click', openLibraryModal);
    btnLibrary.addEventListener('click', openLibraryModal);
    btnMobileLibrary.addEventListener('click', openLibraryModal);
    btnChapters.addEventListener('click', openChaptersModal);
    btnSettings.addEventListener('click', openSettingsModal);
    btnMobileChapters.addEventListener('click', openChaptersModal);
    btnMobileSettings.addEventListener('click', openSettingsModal);

    // Modal Close
    btnCloseLibrary.addEventListener('click', closeModals);
    btnCloseChapters.addEventListener('click', closeModals);
    btnCloseSettings.addEventListener('click', closeModals);

    modalLibrary.addEventListener('click', e => {
      if (e.target === modalLibrary) closeModals();
    });
    modalChapters.addEventListener('click', e => {
      if (e.target === modalChapters) closeModals();
    });
    modalSettings.addEventListener('click', e => {
      if (e.target === modalSettings) closeModals();
    });

    // Home Actions
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
      const total = tocData ? tocData.total_chapters : 1000;
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
        const total = tocData ? tocData.total_chapters : 1000;
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
        const total = tocData ? tocData.total_chapters : 1000;
        if (currentView === 'reader' && currentChapterId < total) {
          navigateToChapter(currentChapterId + 1);
        }
      } else if (e.key === 't' || e.key === 'T' || e.key === 'c' || e.key === 'C') {
        if (modalChapters.style.display === 'flex') {
          closeModals();
        } else {
          openChaptersModal();
        }
      } else if (e.key === 'l' || e.key === 'L') {
        if (modalLibrary.style.display === 'flex') {
          closeModals();
        } else {
          openLibraryModal();
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
