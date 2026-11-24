(function () {
  'use strict';

  const DATA = window.CARAMEL_DATA || { heroSlides: [], projects: [], reviews: [] };
  const CFG = window.CARAMEL_CONFIG || {};

  // =========================================================================
  // 1. Sticky Header & Mobile Drawer
  // =========================================================================
  const header = document.getElementById('siteHeader');
  const burgerBtn = document.getElementById('burgerBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');

  function syncHeader() {
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 36);
    }
  }
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  if (burgerBtn && mobileDrawer) {
    burgerBtn.addEventListener('click', () => {
      const open = mobileDrawer.classList.toggle('is-open');
      burgerBtn.setAttribute('aria-expanded', String(open));
    });
    mobileDrawer.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('click', () => {
        mobileDrawer.classList.remove('is-open');
        burgerBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // =========================================================================
  // 2. Hero Showcase Slider
  // =========================================================================
  const heroImgs = document.querySelectorAll('.hero__slide-img');
  const heroDots = document.querySelectorAll('.hero__dot');
  const heroBadge = document.getElementById('heroBadge');
  const heroSlideTitle = document.getElementById('heroSlideTitle');
  const heroSlideSpecs = document.getElementById('heroSlideSpecs');
  let heroIndex = 0;
  let heroTimer = null;

  function setHeroSlide(idx) {
    if (!DATA.heroSlides.length || !heroImgs.length) return;
    heroIndex = (idx + DATA.heroSlides.length) % DATA.heroSlides.length;
    heroImgs.forEach((img, i) => img.classList.toggle('is-active', i === heroIndex));
    heroDots.forEach((dot, i) => dot.classList.toggle('is-active', i === heroIndex));
    const slide = DATA.heroSlides[heroIndex];
    if (heroBadge) heroBadge.textContent = slide.badge;
    if (heroSlideTitle) heroSlideTitle.textContent = slide.title;
    if (heroSlideSpecs) heroSlideSpecs.textContent = slide.specs;
  }

  function restartHeroTimer() {
    if (heroTimer) clearInterval(heroTimer);
    heroTimer = setInterval(() => setHeroSlide(heroIndex + 1), 6200);
  }

  heroDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      setHeroSlide(Number(dot.dataset.slide || 0));
      restartHeroTimer();
    });
  });
  restartHeroTimer();

  // =========================================================================
  // 3. Live Portfolio Filtering & Bento Rendering
  // =========================================================================
  const filtersEl = document.getElementById('portfolioFilters');
  const gridEl = document.getElementById('portfolioGrid');
  const moreWrap = document.getElementById('portfolioMoreWrap');
  const showAllBtn = document.getElementById('showAllProjectsBtn');

  const CATEGORIES = [
    { key: 'all', label: 'Все работы' },
    { key: 'Кухня', label: 'Кухни' },
    { key: 'Распашной шкаф', label: 'Распашные шкафы' },
    { key: 'Шкаф-купе', label: 'Шкафы-купе' },
    { key: 'Гардеробная', label: 'Гардеробные' },
    { key: 'Корпусная мебель', label: 'Корпусная мебель' }
  ];

  let activeCategory = 'all';
  let expandedAll = false;
  const INITIAL_LIMIT = 10;

  function renderFilterButtons() {
    if (!filtersEl) return;
    filtersEl.innerHTML = CATEGORIES.map((cat) => {
      const count = cat.key === 'all'
        ? DATA.projects.length
        : DATA.projects.filter((p) => p.category === cat.key).length;
      const activeCls = cat.key === activeCategory ? 'is-active' : '';
      return `
        <button type="button" class="filter-btn ${activeCls}" data-cat="${cat.key}">
          <span>${cat.label}</span>
          <span class="filter-btn__count">${count}</span>
        </button>
      `;
    }).join('');

    filtersEl.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat || 'all';
        renderFilterButtons();
        renderPortfolio();
      });
    });
  }

  function renderPortfolio() {
    if (!gridEl) return;
    const filtered = activeCategory === 'all'
      ? DATA.projects
      : DATA.projects.filter((p) => p.category === activeCategory);

    const shouldSlice = activeCategory === 'all' && !expandedAll && filtered.length > INITIAL_LIMIT;
    const visible = shouldSlice ? filtered.slice(0, INITIAL_LIMIT) : filtered;

    gridEl.innerHTML = visible.map((proj) => {
      const wideCls = proj.wide && activeCategory === 'all' ? 'p-card--wide' : '';
      const multiBadge = proj.images.length > 1
        ? `<span class="p-card__multi">${proj.images.length} фото</span>`
        : '';
      const tagsHtml = (proj.tags || []).slice(0, 4).map((t) => `<span class="p-tag">${t}</span>`).join('');

      return `
        <article class="p-card ${wideCls}" data-project-id="${proj.id}" tabindex="0" role="button" aria-label="Открыть проект: ${proj.title}">
          <div class="p-card__media">
            <img src="${proj.images[0]}" alt="${proj.title}" loading="lazy">
            <div class="p-card__badges">
              <span class="p-card__cat">${proj.category}</span>
              ${multiBadge}
            </div>
          </div>
          <div class="p-card__body">
            <div>
              <div class="p-card__client">${proj.clientTag || 'Реальный объект Caramel'}</div>
              <h3 class="p-card__title">${proj.title}</h3>
              <p class="p-card__spec">${proj.facades}</p>
              <div class="p-card__tags">${tagsHtml}</div>
            </div>
            <div class="p-card__foot">
              <span>Разбор материалов и фото</span>
              <span>Открыть →</span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    if (showAllBtn) {
      showAllBtn.style.display = shouldSlice ? 'inline-flex' : 'none';
      showAllBtn.textContent = `Показать все ${DATA.projects.length} выполненные работы`;
    }

    gridEl.querySelectorAll('.p-card').forEach((card) => {
      card.addEventListener('click', () => openProjectModal(card.dataset.projectId));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProjectModal(card.dataset.projectId);
        }
      });
    });
  }

  if (showAllBtn) {
    showAllBtn.addEventListener('click', () => {
      expandedAll = true;
      renderPortfolio();
    });
  }

  renderFilterButtons();
  renderPortfolio();

  // =========================================================================
  // 4. Project Lightbox Modal
  // =========================================================================
  const projectModal = document.getElementById('projectModal');
  const closeProjectModalBtn = document.getElementById('closeProjectModal');
  const pmMainImg = document.getElementById('pmMainImg');
  const pmThumbs = document.getElementById('pmThumbs');
  const pmCategory = document.getElementById('pmCategory');
  const pmTitle = document.getElementById('pmTitle');
  const pmClient = document.getElementById('pmClient');
  const pmFacades = document.getElementById('pmFacades');
  const pmHardware = document.getElementById('pmHardware');
  const pmTask = document.getElementById('pmTask');
  const pmVkLink = document.getElementById('pmVkLink');
  const pmOrderSimilarBtn = document.getElementById('pmOrderSimilarBtn');
  let currentProject = null;

  function openProjectModal(projectId) {
    const proj = DATA.projects.find((p) => p.id === projectId);
    if (!proj || !projectModal) return;
    currentProject = proj;

    pmCategory.textContent = proj.category;
    pmTitle.textContent = proj.title;
    pmClient.textContent = proj.clientTag || '';
    pmFacades.textContent = proj.facades;
    pmHardware.textContent = proj.hardware;
    pmTask.textContent = proj.task;
    pmVkLink.href = proj.vkUrl || CFG.vkGroupUrl;

    pmMainImg.src = proj.images[0];
    pmMainImg.alt = proj.title;

    if (proj.images.length > 1) {
      pmThumbs.style.display = 'flex';
      pmThumbs.innerHTML = proj.images.map((src, idx) => `
        <button type="button" class="thumb-btn ${idx === 0 ? 'is-active' : ''}" data-src="${src}">
          <img src="${src}" alt="Ракурс ${idx + 1}">
        </button>
      `).join('');
      pmThumbs.querySelectorAll('.thumb-btn').forEach((tb) => {
        tb.addEventListener('click', () => {
          pmThumbs.querySelectorAll('.thumb-btn').forEach((b) => b.classList.remove('is-active'));
          tb.classList.add('is-active');
          pmMainImg.src = tb.dataset.src;
        });
      });
    } else {
      pmThumbs.style.display = 'none';
      pmThumbs.innerHTML = '';
    }

    projectModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeProjectModal() {
    if (!projectModal) return;
    projectModal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (closeProjectModalBtn) closeProjectModalBtn.addEventListener('click', closeProjectModal);
  if (projectModal) {
    projectModal.addEventListener('click', (e) => {
      if (e.target === projectModal) closeProjectModal();
    });
  }
  if (pmOrderSimilarBtn) {
    pmOrderSimilarBtn.addEventListener('click', () => {
      const title = currentProject ? `Расчёт по проекту: «${currentProject.title}»` : 'Расчёт похожего проекта';
      closeProjectModal();
      openCallbackModal(title);
    });
  }

  // =========================================================================
  // 5. Render Verbatim Customer Reviews
  // =========================================================================
  const reviewsGrid = document.getElementById('reviewsGrid');
  if (reviewsGrid && DATA.reviews.length) {
    reviewsGrid.innerHTML = DATA.reviews.slice(0, 6).map((rev) => {
      const photoHtml = rev.photo
        ? `<div class="rev-card__photo"><img src="${rev.photo}" alt="Фото мебели заказчика (${rev.author})" loading="lazy"></div>`
        : '';
      return `
        <article class="rev-card">
          <div>
            <div class="rev-card__head">
              <div>
                <div class="rev-card__author">${rev.author}</div>
                <div class="rev-card__order">${rev.order}</div>
              </div>
              <span class="rev-card__date">${rev.date}</span>
            </div>
            ${photoHtml ? `<div style="margin-top:14px;">${photoHtml}</div>` : ''}
            <p class="rev-card__text" style="margin-top:14px;">«${rev.text}»</p>
          </div>
          <a href="${rev.sourceUrl}" target="_blank" rel="noopener noreferrer" class="rev-card__link">
            Проверить оригинал отзыва во ВКонтакте ↗
          </a>
        </article>
      `;
    }).join('');
  }

  // =========================================================================
  // 6. Choice Pills & Honest 1-Day Calculation Brief
  // =========================================================================
  const briefState = {
    furnitureType: 'Кухня',
    timeline: 'В ближайшее время',
    budget: '150–200 т.р.',
    channel: 'Telegram',
    modalChannel: 'Telegram'
  };

  function syncBriefSummary() {
    const map = {
      sumType: briefState.furnitureType,
      sumTimeline: briefState.timeline,
      sumBudget: briefState.budget,
      sumChannel: briefState.channel
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  }

  document.querySelectorAll('[data-choice-group]').forEach((group) => {
    const key = group.dataset.choiceGroup;
    group.querySelectorAll('.choice-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        group.querySelectorAll('.choice-pill').forEach((p) => p.classList.remove('is-selected'));
        pill.classList.add('is-selected');
        briefState[key] = pill.dataset.value || '';
        syncBriefSummary();
      });
    });
  });
  syncBriefSummary();

  // =========================================================================
  // 7. Quick Callback Modal & Keyboard Escape
  // =========================================================================
  const callbackModal = document.getElementById('callbackModal');
  const closeCallbackBtn = document.getElementById('closeCallbackModal');
  const cbTitle = document.getElementById('cbTitle');
  const cbContext = document.getElementById('cbContext');

  function openCallbackModal(contextTitle) {
    if (!callbackModal) return;
    if (cbTitle) cbTitle.textContent = contextTitle || 'Записаться на бесплатный замер';
    if (cbContext) cbContext.value = contextTitle || 'Запись на замер';
    callbackModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeCallbackModal() {
    if (!callbackModal) return;
    callbackModal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-open-callback]').forEach((btn) => {
    btn.addEventListener('click', () => openCallbackModal(btn.dataset.openCallback));
  });
  if (closeCallbackBtn) closeCallbackBtn.addEventListener('click', closeCallbackModal);
  if (callbackModal) {
    callbackModal.addEventListener('click', (e) => {
      if (e.target === callbackModal) closeCallbackModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProjectModal();
      closeCallbackModal();
    }
  });

  // =========================================================================
  // 8. Phone Input Mask (+7 (XXX) XXX-XX-XX) & Lead Delivery
  // =========================================================================
  function formatRuPhone(raw) {
    let digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (digits[0] === '8' || digits[0] === '7') digits = '7' + digits.slice(1);
    else digits = '7' + digits;
    digits = digits.slice(0, 11);

    let out = '+7';
    if (digits.length > 1) out += ' (' + digits.slice(1, 4);
    if (digits.length >= 4) out += ') ' + digits.slice(4, 7);
    if (digits.length >= 7) out += '-' + digits.slice(7, 9);
    if (digits.length >= 9) out += '-' + digits.slice(9, 11);
    return out;
  }

  document.querySelectorAll('.phone-mask').forEach((inp) => {
    inp.addEventListener('input', () => {
      inp.value = formatRuPhone(inp.value);
    });
    inp.addEventListener('focus', () => {
      if (!inp.value) inp.value = '+7 (';
    });
    inp.addEventListener('blur', () => {
      if (inp.value === '+7 (') inp.value = '';
    });
  });

  const toastBox = document.getElementById('toastBox');
  let toastTimer = null;
  function showToast(msg) {
    if (!toastBox) return;
    toastBox.textContent = msg;
    toastBox.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastBox.classList.remove('is-visible'), 5200);
  }

  async function submitLead(payload) {
    const digits = (payload.phone || '').replace(/\D/g, '');
    if (digits.length < 11) {
      showToast('Пожалуйста, укажите полный номер телефона из 11 цифр.');
      return false;
    }

    const endpoints = Array.isArray(CFG.endpoints) ? CFG.endpoints : [];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          if (json && json.ok) return true;
        }
      } catch (_) {
        // Пробуем следующий обработчик или демо-режим
      }
    }

    if (CFG.demoModeFallback) {
      return true;
    }
    return false;
  }

  const briefForm = document.getElementById('briefForm');
  if (briefForm) {
    briefForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('briefName').value.trim();
      const phone = document.getElementById('briefPhone').value.trim();
      const comment = document.getElementById('briefComment').value.trim();
      const hasSketch = document.getElementById('hasSketchCheck').checked;

      const details = [
        `Вид мебели: ${briefState.furnitureType}`,
        `Срок покупки: ${briefState.timeline}`,
        `Планируемый бюджет: ${briefState.budget}`,
        hasSketch ? 'Есть готовый эскиз / расчёт другого салона' : null,
        comment ? `Комментарий: ${comment}` : null
      ].filter(Boolean).join('\n');

      const ok = await submitLead({
        source: 'Анкета расчёта за 1 день',
        name,
        phone,
        messenger: briefState.channel,
        details
      });

      if (ok) {
        briefForm.reset();
        showToast(`Спасибо, ${name || 'заявка принята'}! Владислав подготовит расчёт и свяжется с вами (${briefState.channel}).`);
      }
    });
  }

  const callbackForm = document.getElementById('callbackForm');
  if (callbackForm) {
    callbackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('cbName').value.trim();
      const phone = document.getElementById('cbPhone').value.trim();
      const note = document.getElementById('cbNote').value.trim();
      const context = document.getElementById('cbContext').value;

      const ok = await submitLead({
        source: context,
        name,
        phone,
        messenger: briefState.modalChannel,
        details: note
      });

      if (ok) {
        callbackForm.reset();
        closeCallbackModal();
        showToast(`Заявка отправлена! Свяжемся с вами удобным способом (${briefState.modalChannel}).`);
      }
    });
  }
})();
