/**
 * STUDENT HUB - FETCH API DATA EXPLORER (events.js)
 * Basic level, easy-to-understand implementation of:
 * 1. Fetch API (reading external JSON files)
 * 2. Dynamic HTML Rendering
 * 3. Real-time Search
 * 4. Category Filtering
 * 5. Multi-criteria Sorting
 * 6. Numbered Pagination Controls
 */

// ==========================================================================
// 1. GLOBAL APPLICATION STATE
// ==========================================================================
const appState = {
  activeDataset: 'events',    // 'events' | 'students' | 'notices' | 'faqs'
  rawData: [],                // All items loaded from JSON
  filteredData: [],           // Items after search, filter, and sorting
  searchQuery: '',            // Search box keyword
  selectedCategory: 'all',    // Current category filter
  selectedSort: 'default',    // Current sort option
  currentPage: 1,             // Active page number
  itemsPerPage: 6             // Number of items per page
};

// Dataset configurations (JSON filenames & metadata)
const DATASETS = {
  events: {
    file: 'events.json',
    title: 'CAMPUS EVENTS & WORKSHOPS',
    subtitle: 'Upcoming workshops, webinars, and activities loaded dynamically from events.json',
    searchPlaceholder: 'Search events by title, description, or location...'
  },
  students: {
    file: 'students.json',
    title: 'STUDENT DIRECTORY',
    subtitle: 'Active student profiles, academic departments, and skills loaded from students.json',
    searchPlaceholder: 'Search students by name, department, or skills...'
  },
  notices: {
    file: 'notices.json',
    title: 'CAMPUS NOTICE BOARD',
    subtitle: 'Official academic circulars, deadlines, and alerts loaded from notices.json',
    searchPlaceholder: 'Search notices by title, department, or priority...'
  },
  faqs: {
    file: 'faqs.json',
    title: 'STUDENT FAQS & HELP',
    subtitle: 'Frequently asked questions and guides loaded dynamically from faqs.json',
    searchPlaceholder: 'Search questions or keywords...'
  }
};

// ==========================================================================
// 2. DOM ELEMENT REFERENCES
// ==========================================================================
const dom = {
  explorerTitle: document.getElementById('explorerTitle'),
  explorerSubtitle: document.getElementById('explorerSubtitle'),
  searchInput: document.getElementById('searchControlInput'),
  categoryFilter: document.getElementById('categoryFilterSelect'),
  sortSelect: document.getElementById('sortSelect'),
  pageSizeSelect: document.getElementById('pageSizeSelect'),
  resultsCount: document.getElementById('resultsCountText'),
  clearFiltersBtn: document.getElementById('clearFiltersBtn'),
  cardsContainer: document.getElementById('dataCardsContainer'),
  paginationContainer: document.getElementById('paginationControls'),
  datasetTabBtns: document.querySelectorAll('.dataset-tab-btn')
};

// ==========================================================================
// 3. FETCH API: LOAD DATA FROM EXTERNAL JSON FILE
// ==========================================================================
/**
 * Loads an external JSON file using standard Fetch API.
 * Uses try...catch for robust error handling.
 */
async function loadExternalData(datasetKey) {
  const config = DATASETS[datasetKey];
  if (!config) return [];

  // Show loading indicator
  showLoadingState();

  try {
    // Basic Fetch API Call
    const response = await fetch(config.file);
    
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`Fetch API warning for ${config.file}:`, error);

    // Fallback: If opened directly via file:// where browser blocks fetch,
    // load from embedded fallback script tag if present
    const fallbackScript = document.getElementById(`${datasetKey}-fallback-data`);
    if (fallbackScript) {
      try {
        return JSON.parse(fallbackScript.textContent);
      } catch (parseErr) {
        console.error('Fallback parse failed:', parseErr);
      }
    }
    throw error;
  }
}

// ==========================================================================
// 4. DATA PIPELINE: SEARCH, FILTER & SORT
// ==========================================================================
/**
 * Applies search query, category filter, and sort order to raw data.
 */
function applySearchFilterSort() {
  const query = appState.searchQuery.toLowerCase().trim();
  const category = appState.selectedCategory;
  const sort = appState.selectedSort;
  const type = appState.activeDataset;

  // 1. FILTER: Search & Category
  let result = appState.rawData.filter(item => {
    // Category match
    const itemCategory = item.category || item.department || '';
    const matchesCategory = (category === 'all') || (itemCategory.toLowerCase() === category.toLowerCase());

    // Search query match (searches multiple fields based on dataset type)
    let matchesSearch = true;
    if (query) {
      if (type === 'events') {
        matchesSearch = (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      } else if (type === 'students') {
        const skillsStr = Array.isArray(item.skills) ? item.skills.join(' ').toLowerCase() : '';
        matchesSearch = (
          item.name.toLowerCase().includes(query) ||
          item.department.toLowerCase().includes(query) ||
          item.year.toLowerCase().includes(query) ||
          skillsStr.includes(query)
        );
      } else if (type === 'notices') {
        matchesSearch = (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.department.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      } else if (type === 'faqs') {
        matchesSearch = (
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      }
    }

    return matchesCategory && matchesSearch;
  });

  // 2. SORT: Multi-criteria sorting
  result.sort((a, b) => {
    switch (sort) {
      case 'title-asc': {
        const titleA = (a.title || a.name || a.question || '').toLowerCase();
        const titleB = (b.title || b.name || b.question || '').toLowerCase();
        return titleA.localeCompare(titleB);
      }
      case 'title-desc': {
        const titleA = (a.title || a.name || a.question || '').toLowerCase();
        const titleB = (b.title || b.name || b.question || '').toLowerCase();
        return titleB.localeCompare(titleA);
      }
      case 'date-desc': {
        if (a.date && b.date) return b.date.localeCompare(a.date);
        return 0;
      }
      case 'date-asc': {
        if (a.date && b.date) return a.date.localeCompare(b.date);
        return 0;
      }
      case 'gpa-desc': {
        return (b.gpa || 0) - (a.gpa || 0);
      }
      case 'popularity-desc': {
        const popA = a.seats || a.helpfulCount || 0;
        const popB = b.seats || b.helpfulCount || 0;
        return popB - popA;
      }
      default:
        // Default ID sort
        return (a.id || 0) - (b.id || 0);
    }
  });

  appState.filteredData = result;

  // Show/hide clear filters button
  if (dom.clearFiltersBtn) {
    const isFiltered = query !== '' || category !== 'all' || sort !== 'default';
    dom.clearFiltersBtn.style.display = isFiltered ? 'inline-block' : 'none';
  }
}

// ==========================================================================
// 5. PAGINATION LOGIC
// ==========================================================================
/**
 * Slices the filtered array to get the items for the current page.
 */
function getPaginatedItems() {
  const startIndex = (appState.currentPage - 1) * appState.itemsPerPage;
  const endIndex = startIndex + appState.itemsPerPage;
  return appState.filteredData.slice(startIndex, endIndex);
}

/**
 * Calculates total pages.
 */
function getTotalPages() {
  return Math.ceil(appState.filteredData.length / appState.itemsPerPage) || 1;
}

// ==========================================================================
// 6. DYNAMIC HTML RENDERING (CARD TEMPLATES)
// ==========================================================================

// Helper: Format date string
function formatReadableDate(dateString) {
  if (!dateString) return { month: 'DATE', day: '--', full: '' };
  const d = new Date(dateString + 'T00:00:00');
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.toLocaleDateString('en-US', { day: 'numeric' }),
    full: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
}

// 1. Template: Event Card
function createEventCardHTML(item) {
  const dateObj = formatReadableDate(item.date);
  return `
    <article class="event-card" data-id="${item.id}">
      <div class="event-card-top">
        <div class="event-calendar-badge">
          <span class="cal-month">${dateObj.month}</span>
          <span class="cal-day">${dateObj.day}</span>
        </div>
        <div class="event-card-info">
          <span class="event-category-pill">${escapeHTML(item.category)}</span>
          <h3 class="event-title">${escapeHTML(item.title)}</h3>
          <div class="event-meta-row">
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: -1px; margin-right: 3px;">
                <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              ${escapeHTML(item.time || 'TBA')}
            </span>
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: -1px; margin-right: 3px;">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
              </svg>
              ${escapeHTML(item.location || 'Campus')}
            </span>
          </div>
          <p class="event-desc">${escapeHTML(item.description)}</p>
        </div>
      </div>
      <div class="event-card-bottom">
        <span class="event-seats-tag">${item.seats || 50} Seats Available</span>
        <button type="button" class="event-action-btn" onclick="handleEventRegister('${escapeHTML(item.title)}')">
          Attend Event
        </button>
      </div>
    </article>
  `;
}

// 2. Template: Student Profile Card
function createStudentCardHTML(item) {
  const skillsHTML = (item.skills || [])
    .map(skill => `<span class="skill-tag">${escapeHTML(skill)}</span>`)
    .join('');

  return `
    <article class="student-card" data-id="${item.id}">
      <div class="student-card-header">
        <img src="${item.avatar}" alt="${escapeHTML(item.name)}" class="student-avatar-img"
             onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\' fill=\\'%237C8363\\'><circle cx=\\'50\\' cy=\\'50\\' r=\\'50\\' fill=\\'%23EBF0DF\\'/><circle cx=\\'50\\' cy=\\'40\\' r=\\'18\\' fill=\\'%237C8363\\'/><path d=\\'M25 85c0-14 12-24 25-24s25 10 25 24\\' fill=\\'%237C8363\\'/></svg>';">
        <div class="student-header-info">
          <h3 class="student-name">${escapeHTML(item.name)}</h3>
          <div class="student-dept">${escapeHTML(item.department)}</div>
        </div>
      </div>
      <div class="student-badges-row">
        <span class="student-year-pill">${escapeHTML(item.year)}</span>
        <span class="student-gpa-pill">GPA: ${item.gpa.toFixed(2)}</span>
      </div>
      <div class="student-skills-wrap">
        ${skillsHTML}
      </div>
      <a href="mailto:${item.email}" class="student-email-link">Email: ${escapeHTML(item.email)}</a>
    </article>
  `;
}

// 3. Template: Notice Card
function createNoticeCardHTML(item) {
  const priorityClass = (item.priority || 'normal').toLowerCase();
  const dateObj = formatReadableDate(item.date);

  return `
    <article class="notice-card priority-${priorityClass}" data-id="${item.id}">
      <div>
        <div class="notice-top-meta">
          <span class="notice-priority-badge ${priorityClass}">${escapeHTML(item.priority || 'Normal')} Priority</span>
          <span class="notice-date-text">${dateObj.full}</span>
        </div>
        <h3 class="notice-title">${escapeHTML(item.title)}</h3>
        <p class="notice-content">${escapeHTML(item.description)}</p>
      </div>
      <div class="notice-dept-footer">
        Department: ${escapeHTML(item.department || 'Administration')}
      </div>
    </article>
  `;
}

// 4. Template: FAQ Card
function createFAQCardHTML(item) {
  return `
    <article class="faq-card" data-id="${item.id}">
      <div>
        <span class="faq-category-tag">Category: ${escapeHTML(item.category || 'General')}</span>
        <h3 class="faq-question-title">${escapeHTML(item.question)}</h3>
        <p class="faq-answer-text">${escapeHTML(item.answer)}</p>
      </div>
      <div class="faq-card-footer">
        <span>Helpful to ${item.helpfulCount || 0} students</span>
        <button type="button" class="helpful-btn" onclick="handleHelpfulClick(this, ${item.id})">
          Helpful
        </button>
      </div>
    </article>
  `;
}

// Helper: Escape HTML to prevent injection
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// ==========================================================================
// 7. MAIN RENDER FUNCTION
// ==========================================================================
function renderUI() {
  applySearchFilterSort();

  const totalFiltered = appState.filteredData.length;
  const totalPages = getTotalPages();

  // If current page is beyond total pages after filtering, reset to page 1
  if (appState.currentPage > totalPages) {
    appState.currentPage = 1;
  }

  const paginatedItems = getPaginatedItems();

  // 1. Update Results Count Text
  if (totalFiltered === 0) {
    dom.resultsCount.textContent = 'No records match your criteria.';
  } else {
    const startNum = (appState.currentPage - 1) * appState.itemsPerPage + 1;
    const endNum = Math.min(startNum + appState.itemsPerPage - 1, totalFiltered);
    dom.resultsCount.textContent = `Showing ${startNum}–${endNum} of ${totalFiltered} ${appState.activeDataset}`;
  }

  // 2. Render Cards Grid
  if (paginatedItems.length === 0) {
    dom.cardsContainer.innerHTML = `
      <div class="empty-results-box">
        <div class="empty-results-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7C8363" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <h3 class="empty-results-title">No Matching Results Found</h3>
        <p class="empty-results-desc">Try clearing your search query or changing the category filter.</p>
        <button type="button" class="event-action-btn" onclick="resetAllFilters()">Clear All Filters</button>
      </div>
    `;
  } else {
    let cardsHTML = '';
    paginatedItems.forEach(item => {
      switch (appState.activeDataset) {
        case 'events':
          cardsHTML += createEventCardHTML(item);
          break;
        case 'students':
          cardsHTML += createStudentCardHTML(item);
          break;
        case 'notices':
          cardsHTML += createNoticeCardHTML(item);
          break;
        case 'faqs':
          cardsHTML += createFAQCardHTML(item);
          break;
      }
    });
    dom.cardsContainer.innerHTML = cardsHTML;
  }

  // 3. Render Numbered Pagination Controls
  renderPaginationControls(totalPages);
}

// ==========================================================================
// 8. PAGINATION CONTROLS GENERATOR
// ==========================================================================
function renderPaginationControls(totalPages) {
  if (!dom.paginationContainer) return;

  if (totalPages <= 1) {
    dom.paginationContainer.innerHTML = '';
    return;
  }

  let paginationHTML = '';

  // Previous Page Button
  const isFirstPage = appState.currentPage === 1;
  paginationHTML += `
    <button type="button" class="page-btn" ${isFirstPage ? 'disabled' : ''} onclick="goToPage(${appState.currentPage - 1})">
      &larr; Prev
    </button>
  `;

  // Numbered Page Buttons
  for (let i = 1; i <= totalPages; i++) {
    // Show first, last, current, and adjacent pages
    if (i === 1 || i === totalPages || (i >= appState.currentPage - 1 && i <= appState.currentPage + 1)) {
      const isActive = i === appState.currentPage;
      paginationHTML += `
        <button type="button" class="page-btn ${isActive ? 'active' : ''}" onclick="goToPage(${i})">
          ${i}
        </button>
      `;
    } else if (i === appState.currentPage - 2 || i === appState.currentPage + 2) {
      paginationHTML += `<span class="page-dots">...</span>`;
    }
  }

  // Next Page Button
  const isLastPage = appState.currentPage === totalPages;
  paginationHTML += `
    <button type="button" class="page-btn" ${isLastPage ? 'disabled' : ''} onclick="goToPage(${appState.currentPage + 1})">
      Next &rarr;
    </button>
  `;

  dom.paginationContainer.innerHTML = paginationHTML;
}

// Navigation handler for pagination buttons
function goToPage(pageNumber) {
  const totalPages = getTotalPages();
  if (pageNumber < 1 || pageNumber > totalPages) return;

  appState.currentPage = pageNumber;
  renderUI();

  // Scroll smoothly back to top of data section
  dom.cardsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================================================
// 9. DYNAMIC CATEGORY FILTER POPULATION
// ==========================================================================
function populateCategoryDropdown() {
  if (!dom.categoryFilter) return;

  // Extract unique categories from raw data
  const categories = new Set();
  appState.rawData.forEach(item => {
    const cat = item.category || item.department;
    if (cat) categories.add(cat);
  });

  const sortedCats = Array.from(categories).sort();

  // Build <option> elements
  let optionsHTML = '<option value="all">All Categories</option>';
  sortedCats.forEach(cat => {
    const isSelected = appState.selectedCategory.toLowerCase() === cat.toLowerCase();
    optionsHTML += `<option value="${escapeHTML(cat)}" ${isSelected ? 'selected' : ''}>${escapeHTML(cat)}</option>`;
  });

  dom.categoryFilter.innerHTML = optionsHTML;
}

// Update Sort Dropdown options tailored to dataset
function updateSortDropdownOptions() {
  if (!dom.sortSelect) return;

  let optionsHTML = `
    <option value="default">Sort by: Default</option>
    <option value="title-asc">Title: A &rarr; Z</option>
    <option value="title-desc">Title: Z &rarr; A</option>
  `;

  if (appState.activeDataset === 'events' || appState.activeDataset === 'notices') {
    optionsHTML += `
      <option value="date-desc">Date: Newest First</option>
      <option value="date-asc">Date: Soonest First</option>
    `;
  }

  if (appState.activeDataset === 'students') {
    optionsHTML += `<option value="gpa-desc">GPA: Highest First</option>`;
  }

  if (appState.activeDataset === 'events') {
    optionsHTML += `<option value="popularity-desc">Seats: Highest First</option>`;
  } else if (appState.activeDataset === 'faqs') {
    optionsHTML += `<option value="popularity-desc">Most Helpful</option>`;
  }

  dom.sortSelect.innerHTML = optionsHTML;
  dom.sortSelect.value = appState.selectedSort;
}

// ==========================================================================
// 10. SWITCH DATASET (EVENTS / STUDENTS / NOTICES / FAQS)
// ==========================================================================
async function switchDataset(datasetKey) {
  if (!DATASETS[datasetKey]) return;

  appState.activeDataset = datasetKey;
  appState.currentPage = 1;
  appState.searchQuery = '';
  appState.selectedCategory = 'all';
  appState.selectedSort = 'default';

  // Update tabs active state
  dom.datasetTabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === datasetKey);
  });

  // Update headers & placeholder
  const config = DATASETS[datasetKey];
  if (dom.explorerTitle) dom.explorerTitle.textContent = config.title;
  if (dom.explorerSubtitle) dom.explorerSubtitle.textContent = config.subtitle;
  if (dom.searchInput) {
    dom.searchInput.value = '';
    dom.searchInput.placeholder = config.searchPlaceholder;
  }

  updateSortDropdownOptions();

  try {
    const data = await loadExternalData(datasetKey);
    appState.rawData = data;
    populateCategoryDropdown();
    renderUI();
  } catch (err) {
    dom.cardsContainer.innerHTML = `
      <div class="empty-results-box">
        <div class="empty-results-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3 class="empty-results-title">Failed to Load ${config.file}</h3>
        <p class="empty-results-desc">Error fetching data. Please ensure the JSON file is present.</p>
      </div>
    `;
  }
}

// Loading UI State
function showLoadingState() {
  if (dom.cardsContainer) {
    dom.cardsContainer.innerHTML = `
      <div class="loading-box">
        <div class="loading-spinner"></div>
        <p style="font-weight: 600; color: #5A5A5A;">Fetching data via Fetch API...</p>
      </div>
    `;
  }
}

// Reset all filters
function resetAllFilters() {
  appState.searchQuery = '';
  appState.selectedCategory = 'all';
  appState.selectedSort = 'default';
  appState.currentPage = 1;

  if (dom.searchInput) dom.searchInput.value = '';
  if (dom.categoryFilter) dom.categoryFilter.value = 'all';
  if (dom.sortSelect) dom.sortSelect.value = 'default';

  renderUI();
}

// Global action handlers for card buttons
window.handleEventRegister = function(eventTitle) {
  if (typeof showToast === 'function') {
    showToast(`Registered for event: "${eventTitle}"!`);
  } else {
    alert(`Registered for event: "${eventTitle}"!`);
  }
};

window.handleHelpfulClick = function(btn, faqId) {
  btn.disabled = true;
  btn.innerHTML = '✓ Liked';
  btn.style.backgroundColor = 'var(--color-olive-light, #EBF0DF)';
  btn.style.color = 'var(--color-olive-dark, #626A4D)';
  if (typeof showToast === 'function') {
    showToast('Thank you for your feedback!');
  }
};

// ==========================================================================
// 11. EVENT LISTENERS
// ==========================================================================
function setupEventListeners() {
  // 1. Live Search Input
  if (dom.searchInput) {
    dom.searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value;
      appState.currentPage = 1; // Reset to page 1 on search
      renderUI();
    });
  }

  // 2. Category Filter
  if (dom.categoryFilter) {
    dom.categoryFilter.addEventListener('change', (e) => {
      appState.selectedCategory = e.target.value;
      appState.currentPage = 1; // Reset to page 1 on filter
      renderUI();
    });
  }

  // 3. Sort Select
  if (dom.sortSelect) {
    dom.sortSelect.addEventListener('change', (e) => {
      appState.selectedSort = e.target.value;
      renderUI();
    });
  }

  // 4. Items Per Page Select
  if (dom.pageSizeSelect) {
    dom.pageSizeSelect.addEventListener('change', (e) => {
      appState.itemsPerPage = parseInt(e.target.value, 10) || 6;
      appState.currentPage = 1;
      renderUI();
    });
  }

  // 5. Dataset Tabs
  dom.datasetTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      switchDataset(target);
    });
  });

  // 6. Clear Filters Button
  if (dom.clearFiltersBtn) {
    dom.clearFiltersBtn.addEventListener('click', resetAllFilters);
  }
}

// ==========================================================================
// 12. INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  switchDataset('events'); // Load Events by default
});
