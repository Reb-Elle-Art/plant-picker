// Flower Research Tracker — browser app

let allFlowers = [];
let favorites = [];
let compareList = [];
let activeFilters = {};
let viewMode = 'cards';

// ─── Load data ───────────────────────────────────────────────

async function loadData() {
  const [flowersRes, favsRes] = await Promise.all([
    fetch('data/flowers-grouped.json'),
    fetch('data/favorites.json').catch(() => ({ json: () => [] }))
  ]);
  allFlowers = await flowersRes.json();
  favorites = await favsRes.json();
  render();
}

// ─── Favorites (localStorage) ──────────────────────────────

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

// ─── Compare ───────────────────────────────────────────────

function isInCompare(id) {
  return compareList.includes(id);
}

function toggleCompare(id) {
  if (compareList.includes(id)) {
    compareList = compareList.filter(f => f !== id);
  } else {
    if (compareList.length >= 3) {
      compareList.shift();
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

    const imageHtml = f.image
      ? `<img src="${f.image}" alt="${f.name}" class="flower-img" loading="lazy" onerror="this.style.display='none'">`
      : '';

    const varietyCount = f.varieties ? f.varieties.length : 1;
    const varietyLabel = varietyCount > 1 ? `${varietyCount} varieties` : '';

    card.innerHTML = `
      ${imageHtml}
      <h3>${f.name}</h3>
      <p class="scientific">${f.scientific_name}</p>
      ${varietyLabel ? `<span class="variety-count">${varietyLabel}</span>` : ''}
      <div class="badges">${buildBadges(f)}</div>
      <p class="details">
        ${f.varieties?.[0]?.height_inches ? `<strong>${f.varieties[0].height_inches}in</strong> tall · ` : ''}
        ${f.varieties?.[0]?.duration ? `${capitalize(f.varieties[0].duration)} · ` : ''}
        ${f.varieties?.[0]?.sun_needs ? `${capitalize(f.varieties[0].sun_needs.replace('_', ' '))}` : ''}
      </p>
      ${f.image_source ? `<p class="img-source">Photo: ${f.image_source}</p>` : ''}
      <button class="compare-btn">${isInCompare(f.id) ? 'Remove from Compare' : 'Add to Compare'}</button>
    `;

    card.addEventListener('click', e => {
      if (e.target.classList.contains('compare-btn')) {
        toggleCompare(f.id);
      } else {
        openFlowerModal(f.id);
      }
    });

    container.appendChild(card);
  });
}

function renderTable(flowers, container) {
  container.className = 'table-view';

  const headers = ['Name', 'Varieties', 'Season', 'Sun', 'Water', 'Zone', 'Duration', ''];
  let html = '<tr>';
  headers.forEach(h => html += `<th>${h}</th>`);
  html += '</tr>';

  flowers.forEach(f => {
    const inCompare = isInCompare(f.id);
    const varietyCount = f.varieties ? f.varieties.length : 1;
    const firstVar = f.varieties?.[0] || {};
    html += `
      <tr>
        <td><strong>${f.name}</strong></td>
        <td>${varietyCount > 1 ? varietyCount + ' varieties' : '-'}</td>
        <td>${(firstVar.bloom_season || []).join(', ')}</td>
        <td>${firstVar.sun_needs || '-'}</td>
        <td>${firstVar.water_needs || '-'}</td>
        <td>${(firstVar.hardiness_zones || []).join(', ')}</td>
        <td>${firstVar.duration || '-'}</td>
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
  const firstVar = f.varieties?.[0] || f;
  
  (firstVar.bloom_season || []).forEach(s => html += `<span class="badge season-${s}">${capitalize(s)}</span>`);
  if (firstVar.duration) html += `<span class="badge duration-${firstVar.duration}">${capitalize(firstVar.duration)}</span>`;
  if (firstVar.deer_resistant) html += `<span class="badge">Deer Resistant</span>`;
  if (firstVar.pollinator_friendly) html += `<span class="badge pollinator">Pollinators</span>`;
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
    const firstVar = f.varieties?.[0] || {};
    const imgHtml = f.image ? `<img src="${f.image}" alt="${f.name}" class="compare-img" loading="lazy" onerror="this.style.display='none'">` : '';
    return `
      <div class="compare-item">
        ${imgHtml}
        <h4>${f.name}</h4>
        <p class="sci">${f.scientific_name}</p>
        <p><strong>Bloom:</strong> ${(firstVar.bloom_season || []).join(', ')}</p>
        <p><strong>Sun:</strong> ${firstVar.sun_needs || '-'}</p>
        <p><strong>Water:</strong> ${firstVar.water_needs || '-'}</p>
        <p><strong>Zones:</strong> ${(firstVar.hardiness_zones || []).join(', ')}</p>
        <p><strong>Height:</strong> ${firstVar.height_inches ? firstVar.height_inches + '"' : '-'}</p>
        <p><strong>Notes:</strong> ${firstVar.notes || '-'}</p>
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

// ─── Flower Detail Modal ──────────────────────────────────

function openFlowerModal(flowerId) {
  const flower = allFlowers.find(f => f.id === flowerId);
  if (!flower) return;

  const modal = document.getElementById('flower-modal');
  const mainImg = document.getElementById('modal-main-img');
  const thumbsContainer = document.getElementById('modal-thumbnails');
  const varietiesContainer = document.getElementById('modal-varieties');

  // Set title and scientific name
  document.getElementById('modal-title').textContent = flower.name;
  document.getElementById('modal-scientific').textContent = flower.scientific_name || '';

  // Handle images
  const images = flower.images || (flower.image ? [flower.image] : []);
  
  if (images.length > 0) {
    mainImg.src = images[0];
    mainImg.alt = flower.name;
    
    thumbsContainer.innerHTML = '';
    images.forEach((imgUrl, idx) => {
      const thumb = document.createElement('img');
      thumb.src = imgUrl;
      thumb.alt = `${flower.name} photo ${idx + 1}`;
      if (idx === 0) thumb.classList.add('active');
      thumb.addEventListener('click', () => {
        mainImg.src = imgUrl;
        thumbsContainer.querySelectorAll('img').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
      thumbsContainer.appendChild(thumb);
    });
  } else {
    mainImg.src = '';
    thumbsContainer.innerHTML = '';
  }

  // Show varieties
  const varieties = flower.varieties || [];
  if (varieties.length > 1) {
    varietiesContainer.innerHTML = `
      <h3>Varieties</h3>
      <div class="varieties-grid">
        ${varieties.map((v, idx) => `
          <div class="variety-card ${idx === 0 ? 'active' : ''}" data-variety="${v.id}">
            ${flower.images?.[0] ? `<img src="${flower.images[0]}" alt="${v.name}" loading="lazy">` : ''}
            <h4>${v.name}</h4>
            <p class="var-detail">
              ${v.height_inches ? `<strong>${v.height_inches}in</strong> tall · ` : ''}
              ${v.duration ? capitalize(v.duration) : ''}
            </p>
            <p class="var-detail">${(v.bloom_season || []).map(capitalize).join(', ')}</p>
            <p class="var-detail">${(v.flower_color || []).map(capitalize).join(', ')}</p>
          </div>
        `).join('')}
      </div>
    `;
    varietiesContainer.style.display = 'block';
    
    // Click on variety to see details
    varietiesContainer.querySelectorAll('.variety-card').forEach(card => {
      card.addEventListener('click', () => {
        const varId = card.dataset.variety;
        const varData = varieties.find(v => v.id === varId);
        if (varData) {
          showVarietyDetail(varData);
          varietiesContainer.querySelectorAll('.variety-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
        }
      });
    });
    
    // Show first variety details
    showVarietyDetail(varieties[0]);
  } else if (varieties.length === 1) {
    varietiesContainer.style.display = 'none';
    showVarietyDetail(varieties[0]);
  }

  // Show modal
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function showVarietyDetail(v) {
  document.getElementById('modal-height').innerHTML = v.height_inches
    ? `<strong>Height:</strong> ${v.height_inches} inches`
    : '';
  document.getElementById('modal-sun').innerHTML = v.sun_needs
    ? `<strong>Sun:</strong> ${capitalize(v.sun_needs.replace('_', ' '))}`
    : '';
  document.getElementById('modal-water').innerHTML = v.water_needs
    ? `<strong>Water:</strong> ${capitalize(v.water_needs)}`
    : '';
  document.getElementById('modal-zones').innerHTML = (v.hardiness_zones && v.hardiness_zones.length)
    ? `<strong>Zones:</strong> ${v.hardiness_zones.join(', ')}`
    : '';
  document.getElementById('modal-colors').innerHTML = (v.flower_color && v.flower_color.length)
    ? `<strong>Colors:</strong> ${v.flower_color.map(capitalize).join(', ')}`
    : '';
  document.getElementById('modal-notes').textContent = v.notes || '';
}

function closeFlowerModal() {
  const modal = document.getElementById('flower-modal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function setupModal() {
  const modal = document.getElementById('flower-modal');
  const closeBtn = document.getElementById('modal-close');

  closeBtn.addEventListener('click', closeFlowerModal);

  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeFlowerModal();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeFlowerModal();
    }
  });
}

// ─── Boot ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setupFilters();
  setupModal();
  loadData();
});
