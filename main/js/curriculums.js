(function () {
  const search = document.getElementById('curriculum-search');
  if (!search) return;
  const topic = document.getElementById('curriculum-topic');
  const grade = document.getElementById('curriculum-grade');
  const sort = document.getElementById('curriculum-sort');
  const pageSize = document.getElementById('curriculum-page-size');
  const pagination = document.getElementById('curriculum-pagination');
  const grid = document.getElementById('curriculum-grid');
  const cards = Array.from(grid.querySelectorAll('.curriculum-card'));
  const count = document.getElementById('curriculum-count');
  const empty = document.getElementById('curriculum-empty');
  const normalize = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const searchable = new Map(cards.map(card => [card, normalize(card.textContent)]));
  let currentPage = 1;

  function restore() {
    const params = new URLSearchParams(location.search);
    search.value = params.get('q') || '';
    topic.value = params.get('topic') || '';
    if (!topic.value) topic.value = '';
    grade.value = params.get('grade') || '';
    if (!grade.value) grade.value = '';
    sort.value = params.get('sort') || 'original';
    if (!sort.value) sort.value = 'original';
    const requestedSize = params.get('size');
    pageSize.value = ['12', '24', 'all'].includes(requestedSize) ? requestedSize : requestedSize === '60' ? 'all' : '12';
    const requestedPage = Number(params.get('page'));
    currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    filter(false);
  }

  function addPageButton(label, page, disabled, active = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.disabled = disabled;
    button.setAttribute('aria-label', /^\d+$/.test(label) ? `Page ${label}` : `${label} page`);
    if (active) button.setAttribute('aria-current', 'page');
    button.addEventListener('click', () => {
      currentPage = page;
      filter(true, true);
      grid.focus({ preventScroll: true });
      document.getElementById('curriculum-library').scrollIntoView({ behavior: 'instant' });
    });
    pagination.appendChild(button);
  }

  function filter(updateUrl = true, pushHistory = false) {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    const sorted = [...cards];
    if (sort.value !== 'original') {
      sorted.sort((a, b) => a.dataset.title.localeCompare(b.dataset.title, 'en') * (sort.value === 'za' ? -1 : 1));
    }
    const matching = sorted.filter(card => terms.every(term => searchable.get(card).includes(term)) && (!topic.value || card.dataset.topics.split('|').includes(topic.value)) && (!grade.value || card.dataset.grades.split('|').includes(grade.value)));
    const size = pageSize.value === 'all' ? cards.length : Number(pageSize.value);
    const pages = Math.max(1, Math.ceil(matching.length / size));
    currentPage = Math.min(currentPage, pages);
    const start = (currentPage - 1) * size;
    const shown = new Set(matching.slice(start, start + size));
    sorted.forEach(card => {
      card.hidden = !shown.has(card);
      grid.appendChild(card);
    });
    count.textContent = matching.length ? `Showing ${start + 1}–${Math.min(start + size, matching.length)} of ${matching.length} lessons` : '0 lessons found';
    empty.hidden = matching.length !== 0;
    pagination.replaceChildren();
    pagination.hidden = pages <= 1;
    if (pages > 1) {
      addPageButton('Previous', currentPage - 1, currentPage === 1);
      for (let i = 1; i <= pages; i++) addPageButton(String(i), i, false, i === currentPage);
      addPageButton('Next', currentPage + 1, currentPage === pages);
    }
    if (updateUrl) {
      const url = new URL(location.href);
      [['q', search.value.trim()], ['topic', topic.value], ['grade', grade.value], ['sort', sort.value === 'original' ? '' : sort.value], ['size', pageSize.value === '12' ? '' : pageSize.value], ['page', currentPage === 1 ? '' : String(currentPage)]].forEach(([key, value]) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key));
      history[pushHistory ? 'pushState' : 'replaceState'](null, '', url);
    }
  }

  function reset() {
    search.value = '';
    topic.value = '';
    grade.value = '';
    sort.value = 'original';
    pageSize.value = '12';
    currentPage = 1;
    filter();
    search.focus();
  }
  function changeFilter() { currentPage = 1; filter(); }
  search.addEventListener('input', changeFilter);
  topic.addEventListener('change', changeFilter);
  grade.addEventListener('change', changeFilter);
  sort.addEventListener('change', changeFilter);
  pageSize.addEventListener('change', changeFilter);
  document.getElementById('curriculum-reset').addEventListener('click', reset);
  document.getElementById('curriculum-empty-reset').addEventListener('click', reset);
  window.addEventListener('popstate', restore);
  window.addEventListener('pageshow', restore);
  restore();
})();
