// events.js
// Loads events.json and drives the search / filter / sort / pagination
// controls on the Events page.

(function () {
  "use strict";

  // ---- State -------------------------------------------------------
  // Everything the UI needs to redraw itself lives in one place, so any
  // control just updates `state` and calls render().
  const state = {
    all: [],          // every event, as read from the JSON
    search: "",        // current search box text (lowercased)
    category: "all",   // current category filter
    sort: "date-asc",  // current sort order
    pageSize: 6,        // how many events one "page" adds
    visibleCount: 6,    // how many events are currently sliced into view
  };

  // ---- DOM references ------------------------------------------------
  const els = {
    list: document.getElementById("events-list"),
    empty: document.getElementById("empty-state"),
    results: document.getElementById("results-count"),
    search: document.getElementById("search-input"),
    category: document.getElementById("category-filter"),
    sort: document.getElementById("sort-select"),
    loadMoreWrap: document.getElementById("load-more-wrap"),
    loadMoreBtn: document.getElementById("load-more-btn"),
  };

  // ---- Data loading ---------------------------------------------------
  // Tries a real fetch() first (works when the page is served over
  // http/https). If that fails - e.g. the file was just double-clicked
  // and opened as file:// , where browsers block fetch of local files -
  // it falls back to the identical JSON embedded in the page itself.
  async function loadEvents() {
    try {
      const response = await fetch("events.json");
      if (!response.ok) throw new Error("Network response was not OK");
      return await response.json();
    } catch (err) {
      console.warn("fetch(events.json) failed, using embedded fallback data:", err);
      const fallback = document.getElementById("events-fallback-data");
      return JSON.parse(fallback.textContent);
    }
  }

  // ---- Helpers ---------------------------------------------------------
  function formatDate(isoDate) {
    const d = new Date(isoDate + "T00:00:00");
    return {
      month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      day: d.toLocaleDateString("en-US", { day: "numeric" }),
      full: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    };
  }

  function uniqueCategories(events) {
    return [...new Set(events.map((e) => e.category))].sort();
  }

  // Populate the <select> once we know what categories exist in the data.
  function populateCategoryFilter(events) {
    uniqueCategories(events).forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      els.category.appendChild(opt);
    });
  }

  // ---- Core pipeline: filter -> sort -> slice --------------------------
  function getVisibleEvents() {
    const term = state.search.trim().toLowerCase();

    // filter: by search term (title + description) and category
    const filtered = state.all.filter((event) => {
      const matchesSearch =
        term === "" ||
        event.title.toLowerCase().includes(term) ||
        event.description.toLowerCase().includes(term) ||
        event.location.toLowerCase().includes(term);
      const matchesCategory = state.category === "all" || event.category === state.category;
      return matchesSearch && matchesCategory;
    });

    // sort: by date or title, ascending or descending
    const sorted = [...filtered].sort((a, b) => {
      switch (state.sort) {
        case "date-asc":
          return a.date.localeCompare(b.date);
        case "date-desc":
          return b.date.localeCompare(a.date);
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    // slice: only take the first N for the current "page"
    const visible = sorted.slice(0, state.visibleCount);

    return { visible, totalMatching: sorted.length };
  }

  // ---- Rendering ---------------------------------------------------------
  function render() {
    const { visible, totalMatching } = getVisibleEvents();

    // results count
    els.results.textContent =
      totalMatching === 0
        ? ""
        : `Showing ${visible.length} of ${totalMatching} event${totalMatching === 1 ? "" : "s"}`;

    // empty state
    els.empty.hidden = totalMatching !== 0;
    els.list.hidden = totalMatching === 0;

    // event rows
    els.list.innerHTML = "";
    visible.forEach((event) => {
      els.list.appendChild(buildEventRow(event));
    });

    // load more button only shows if there's more to reveal
    const hasMore = totalMatching > visible.length;
    els.loadMoreBtn.hidden = !hasMore;
  }

  function buildEventRow(event) {
    const date = formatDate(event.date);

    const row = document.createElement("article");
    row.className = "event-row";

    row.innerHTML = `
      <div class="event-date" aria-hidden="true">
        <span class="event-date-month">${date.month}</span>
        <span class="event-date-day">${date.day}</span>
      </div>
      <div class="event-body">
        <div class="event-heading">
          <h3 class="event-title">${escapeHtml(event.title)}</h3>
          <span class="event-tag event-tag--${slugify(event.category)}">${escapeHtml(event.category)}</span>
        </div>
        <p class="event-meta">${escapeHtml(date.full)} · ${escapeHtml(event.time)} · ${escapeHtml(event.location)}</p>
        <p class="event-desc">${escapeHtml(event.description)}</p>
      </div>
    `;
    return row;
  }

  function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Event wiring --------------------------------------------------
  function resetPaging() {
    state.visibleCount = state.pageSize;
  }

  els.search.addEventListener("input", (e) => {
    state.search = e.target.value;
    resetPaging();
    render();
  });

  els.category.addEventListener("change", (e) => {
    state.category = e.target.value;
    resetPaging();
    render();
  });

  els.sort.addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });

  els.loadMoreBtn.addEventListener("click", () => {
    state.visibleCount += state.pageSize;
    render();
  });

  // ---- Init -------------------------------------------------------------
  async function init() {
    els.results.textContent = "Loading events…";
    try {
      const events = await loadEvents();
      state.all = events;
      populateCategoryFilter(events);
      render();
    } catch (err) {
      console.error("Could not load events:", err);
      els.results.textContent = "";
      els.list.hidden = true;
      els.empty.hidden = false;
      els.empty.textContent = "Events couldn't be loaded right now. Please try again later.";
    }
  }

  init();
})();
