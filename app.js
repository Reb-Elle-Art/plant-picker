// Flower Research Tracker — browser app

let allFlowers = [];
let favorites = [];
let compareList = [];
let activeFilters = {};
let viewMode = 'cards';

// ─── Load data ───────────────────────────────────────────────

async function loadData() {
  const [flowersRes, favsRes] = await Promise.all([
    fetch('data/flowers.json'),
    fetch('data/favorites.json').catch(() => ({ json: () => [] }))
  ]);
  allFlowers = await flowersRes.json();
  favorites = await favsRes.json();
  render();
}

// ─── Favorites (localStorage) ────────────────────────────────

function saveFavorites() {
  localStorage.setItem('flower-favorites', JSON.stringify(favorites));
}

function loadFavoritesFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('flower-favorites') || '[]');
  } catch {
    return [];
  }
}

function isFavorite(id) {
  return favorites.includes(id);
}

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }
  saveFavorites();
  render();
}

// ─── Compare ────────────────────────────────────────────────

function isInCompare(id) {
  return compareList.includes(id);
}

function toggleCompare(id) {
  if (compareList.includes(id)) {
    compareList = compareList.filter(f => f !== id);
  } else {
    if (compareList.length >= 3) {
      compareList.shift(); // drop oldest
    }
    compareList.push(id);
  }
  render();
}

// ─── Filtering ──────────────────────────────────────────────

function applyFilters(flowers) {
  return flowers.filter(flower => {
    // bloom season — any checked season must match
    if (activeFilters.bloom_season?.length) {
      const seasons = flower.bloom_season || [];
      if (!activeFilters.bloom_season.some(s => seasons.includes(s))) return false;
    }

    // duration — any checked duration must match
    if (activeFilters.duration?.length) {
      if (!activeFilters.duration.includes(flower.duration)) return false;
    }

    // sun needs — any checked sun must match
    if (activeFilters.sun_needs?.length) {
      if (!activeFilters.sun_needs.includes(flower.sun_needs)) return false;
    }

    // water needs — any checked water must match
    if (activeFilters.water_needs?.length) {
      if (!activeFilters.water_needs.includes(flower.water_needs)) return false;
    }

    // flower color — color must overlap with any checked color
    if (activeFilters.flower_color?.length) {
      const colors = (flower.flower_color || []).map(c => c.toLowerCase());
      const normalizedChecked = activeFilters.flower_color.map(c => c.toLowerCase());
      if (!normalizedChecked.some(c => colors.includes(c))) return false;
    }

    // deer resistant
    if (activeFilters.deer_resistant?.length) {
      if (!flower.deer_resistant) return false;
    }

    // pollinator friendly
    if (activeFilters.pollinator_friendly?.length) {
      if (!flower.pollinator_friendly) return false;
    }

    return true;
  });
}

// ─── Render ─────────────────────────────────────────────────

function render() {
  favorites = loadFavoritesFromStorage();
  const filtered = applyFilters(allFlowers);
  const countEl = document.getElementById('count');
  countEl.textContent = `${filtered.length} flowers`;

  const grid = document.getElementById('flowers-grid');
  grid.innerHTML = '';

  if (viewMode === 'table') {
    renderTable(filtered, grid);
  } else {
    renderCards(filtered, grid);
  }

  renderCompareBar();
  renderComparePanel();
}

function renderCards(flowers, container) {
  container.className = 'grid-view';

  flowers.forEach(f => {
    const card = document.createElement('div');
    card.className = [
      'flower-card',
      isFavorite(f.id) ? 'selected' : '',
      isInCompare(f.id) ? 'in-compare' : ''
    ].join(' ');

    card.innerHTML = `
      <h3>${f.common_name}</h3>
      <p class="scientific">${f.scientific_name}</p>
      <div class="badges">${buildBadges(f)}</div>
      <p class="details">
        ${f.height_inches ? `<strong>${f.height_inches}in</strong> tall · ` : ''}
        ${f.duration ? `${capitalize(f.duration)} · ` : ''}
        ${f.sun_needs ? `${capitalize(f.sun_needs.replace('_', ' '))}` : ''}
      </p>
      <p class="details">${f.notes || ''}</p>
      <button class="compare-btn">${isInCompare(f.id) ? 'Remove from Compare' : 'Add to Compare'}</button>
    `;

    card.addEventListener('click', e => {
      if (e.target.classList.contains('compare-btn')) {
        toggleCompare(f.id);
      } else {
        toggleFavorite(f.id);
      }
    });

    container.appendChild(card);
  });
}

function renderTable(flowers, container) {
  container.className = 'table-view';

  const headers = ['Name', 'Scientific', 'Season', 'Color', 'Sun', 'Water', 'Zone', 'Duration', 'Height', ''];
  let html = '<tr>';
  headers.forEach(h => html += `<th>${h}</th>`);
  html += '</tr>';

  flowers.forEach(f => {
    const inCompare = isInCompare(f.id);
    html += `
      <tr>
        <td><strong>${f.common_name}</strong></td>
        <td><em>${f.scientific_name}</em></td>
        <td>${(f.bloom_season || []).join(', ')}</td>
        <td>${(f.flower_color || []).join(', ')}</td>
        <td>${f.sun_needs || '-'}</td>
        <td>${f.water_needs || '-'}</td>
        <td>${(f.hardiness_zones || []).join(', ')}</td>
        <td>${f.duration || '-'}</td>
        <td>${f.height_inches ? f.height_inches + '"' : '-'}</td>
        <td><button class="compare-btn small" data-id="${f.id}">${inCompare ? 'Remove' : 'Compare'}</button></td>
      </tr>
    `;
  });

  container.innerHTML = html;
  container.querySelectorAll('.compare-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleCompare(btn.dataset.id));
  });
}

function buildBadges(f) {
  let html = '';
  (f.bloom_season || []).forEach(s => html += `<span class="badge season-${s}">${capitalize(s)}</span>`);
  if (f.duration) html += `<span class="badge duration-${f.duration}">${capitalize(f.duration)}</span>`;
  if (f.deer_resistant) html += `<span class="badge">Deer Resistant</span>`;
  if (f.pollinator_friendly) html += `<span class="badge pollinator">Pollinators</span>`;
  return html;
}

// ─── Compare bar (bottom) ─────────────────────────────────

function renderCompareBar() {
  const bar = document.getElementById('compare-bar');
  const count = document.getElementById('compare-bar-count');
  count.textContent = `${compareList.length} selected`;
  bar.className = compareList.length > 0 ? '' : 'hidden';
}

function renderComparePanel() {
  const panel = document.getElementById('compare-panel');
  const panelCount = document.getElementById('compare-count');
  const items = document.getElementById('compare-items');
  panelCount.textContent = compareList.length;
  panel.className = compareList.length > 0 ? '' : 'hidden';

  items.innerHTML = compareList.map(id => {
    const f = allFlowers.find(x => x.id === id);
    if (!f) return '';
    return `
      <div class="compare-item">
        <h4>${f.common_name}</h4>
        <p class="sci">${f.scientific_name}</p>
        <p><strong>Bloom:</strong> ${(f.bloom_season || []).join(', ')}</p>
        <p><strong>Sun:</strong> ${f.sun_needs || '-'}</p>
        <p><strong>Water:</strong> ${f.water_needs || '-'}</p>
        <p><strong>Zones:</strong> ${(f.hardiness_zones || []).join(', ')}</p>
        <p><strong>Height:</strong> ${f.height_inches ? f.height_inches + '"' : '-'}</p>
        <p><strong>Notes:</strong> ${f.notes || '-'}</p>
      </div>
    `;
  }).join('');
}

// ─── Event listeners ────────────────────────────────────────

function setupFilters() {
  document.querySelectorAll('#filters input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const field = cb.name;
      if (!activeFilters[field]) activeFilters[field] = [];
      if (cb.checked) {
        activeFilters[field].push(cb.value);
      } else {
        activeFilters[field] = activeFilters[field].filter(v => v !== cb.value);
      }
      render();
    });
  });

  document.getElementById('clear-filters').addEventListener('click', () => {
    activeFilters = {};
    document.querySelectorAll('#filters input[type="checkbox"]').forEach(cb => cb.checked = false);
    render();
  });

  document.getElementById('view-cards').addEventListener('click', () => {
    viewMode = 'cards';
    document.getElementById('view-cards').classList.add('active');
    document.getElementById('view-table').classList.remove('active');
    render();
  });

  document.getElementById('view-table').addEventListener('click', () => {
    viewMode = 'table';
    document.getElementById('view-table').classList.add('active');
    document.getElementById('view-cards').classList.remove('active');
    render();
  });

  document.getElementById('open-compare').addEventListener('click', () => {
    document.getElementById('compare-panel').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('clear-compare').addEventListener('click', () => {
    compareList = [];
    render();
  });
}

// ─── Utils ─────────────────────────────────────────────────

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Boot ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setupFilters();
  loadData();
});
