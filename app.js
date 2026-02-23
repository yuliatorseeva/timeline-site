"use strict";

const BASE_CATEGORIES = {
  science: { label: "Наука", color: "#6cae95" },
  philosophy: { label: "Философия", color: "#c79743" },
  politics: { label: "Политика", color: "#d87a53" },
  art: { label: "Искусство", color: "#8d9cd6" },
  exploration: { label: "Исследования и космос", color: "#58a0b4" },
  technology: { label: "Технологии", color: "#9a8bb7" },
  psychology: { label: "Психология", color: "#b9866a" }
};

const PEOPLE = Array.isArray(window.TIMELINE_SEED_PEOPLE) ? window.TIMELINE_SEED_PEOPLE : [];

const SEARCH_INPUT = document.querySelector("#search-input");
const RESULTS_COUNT = document.querySelector("#results-count");
const AXIS = document.querySelector("#timeline-axis");
const LANES = document.querySelector("#timeline-lanes");
const DETAILS = document.querySelector("#person-details");
const LEGEND = document.querySelector("#legend");
const TIMELINE_READOUT = document.querySelector("#timeline-readout");
const DATA_SOURCE_NOTE = document.querySelector("#data-source-note");
const VIEWPORT = document.querySelector("#timeline-viewport");
const ERA_PILLS = document.querySelector("#era-pills");
const ZOOM_RANGE = document.querySelector("#zoom-range");
const PARALLAX_LAYERS = Array.from(document.querySelectorAll(".parallax-layer"));
const dataService = window.TimelineDataService || null;
const CATEGORY_STORAGE_KEY = "timeline_categories_v1";
const CATEGORY_COLOR_PALETTE = [
  "#6cae95",
  "#c79743",
  "#d87a53",
  "#8d9cd6",
  "#58a0b4",
  "#9a8bb7",
  "#b9866a",
  "#7aa1d2",
  "#d08d5d",
  "#79ab7b"
];

const BASE_ROW_HEIGHT = 56;
const ROW_GAP_PX = 10;
const MIN_BAR_PX = 86;
const AXIS_PADDING_X = 56;
const ACTIVE_SEGMENT_JOIN_YEARS = 34;
const GAP_COMPRESSION_BASE = 0.22;
const WIKI_API_URL = "https://ru.wikipedia.org/w/api.php";
const PORTRAIT_SIZE = 200;
const portraitCache = new Map();
const REDUCE_MOTION_MEDIA = window.matchMedia("(prefers-reduced-motion: reduce)");
const HAS_HOVER_MEDIA = window.matchMedia("(hover: hover)");

const state = {
  people: [...PEOPLE],
  categories: { ...BASE_CATEGORIES },
  query: "",
  category: "all",
  selectedId: null,
  detailsRequestId: 0,
  zoom: Number(ZOOM_RANGE?.value ?? 140),
  filteredPeople: [],
  layoutMetrics: null,
  dataSource: "seed"
};

const ERAS = [
  { id: "ancient", label: "Античность", year: -500 },
  { id: "middle-ages", label: "Средневековье", year: 900 },
  { id: "renaissance", label: "Возрождение", year: 1500 },
  { id: "modern", label: "Новое время", year: 1800 },
  { id: "twentieth", label: "XX век", year: 1930 },
  { id: "today", label: "Современность", year: 2005 }
];

function slugifyCategory(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function labelFromCategoryKey(key) {
  const normalized = String(key || "")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function readStoredCategories() {
  try {
    const raw = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const categories = {};
    Object.entries(parsed).forEach(([key, label]) => {
      const normalizedKey = slugifyCategory(key);
      const normalizedLabel = String(label || "").trim();
      if (!normalizedKey || !normalizedLabel) return;
      categories[normalizedKey] = normalizedLabel;
    });
    return categories;
  } catch {
    return {};
  }
}

function pickCategoryColor(key) {
  let hash = 0;
  const input = String(key || "");
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % CATEGORY_COLOR_PALETTE.length;
  return CATEGORY_COLOR_PALETTE[index];
}

function syncCategoryRegistry() {
  const merged = { ...BASE_CATEGORIES };
  const stored = readStoredCategories();

  Object.entries(stored).forEach(([key, label]) => {
    if (merged[key]) {
      merged[key] = { ...merged[key], label };
      return;
    }
    merged[key] = { label, color: pickCategoryColor(key) };
  });

  state.people.forEach((person) => {
    const key = slugifyCategory(person?.category);
    if (!key) return;
    if (!merged[key]) {
      merged[key] = { label: labelFromCategoryKey(key), color: pickCategoryColor(key) };
    }
  });

  state.categories = merged;
  if (state.category !== "all" && !state.categories[state.category]) {
    state.category = "all";
  }
}

function getCategoryMeta(category) {
  const key = slugifyCategory(category);
  if (state.categories[key]) return state.categories[key];
  return {
    label: labelFromCategoryKey(key || category),
    color: pickCategoryColor(key || category)
  };
}

function shouldReduceMotion() {
  return REDUCE_MOTION_MEDIA.matches;
}

function formatYear(year) {
  return year < 0 ? `${Math.abs(year)} до н.э.` : `${year}`;
}

function formatPersonYears(person) {
  if (person.deathDate === "по н.в.") {
    return `${formatYear(person.birthYear)} - по н.в.`;
  }
  return `${formatYear(person.birthYear)} - ${formatYear(person.deathYear)}`;
}

function chooseTickStep(pxPerYear) {
  const steps = [5, 10, 25, 50, 100, 200, 500];
  for (const step of steps) {
    if (step * pxPerYear >= 76) {
      return step;
    }
  }
  return 500;
}

function renderLegend() {
  if (!LEGEND) return;

  LEGEND.innerHTML = "";
  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "legend-item legend-button";
  allButton.dataset.category = "all";
  allButton.textContent = "Все категории";
  allButton.addEventListener("click", () => {
    state.category = "all";
    render();
  });
  LEGEND.append(allButton);

  Object.entries(state.categories).forEach(([key, category]) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "legend-item legend-button";
    item.dataset.category = key;
    item.addEventListener("click", () => {
      state.category = key;
      render();
    });

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.background = category.color;
    swatch.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.textContent = category.label;

    item.append(swatch, text);
    LEGEND.append(item);
  });

  updateCategoryButtonsState();
}

function updateCategoryButtonsState() {
  const buttons = LEGEND?.querySelectorAll(".legend-button") ?? [];
  buttons.forEach((button) => {
    const isActive = button.dataset.category === state.category;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderEraPills() {
  ERA_PILLS.innerHTML = "";
  for (const era of ERAS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "era-pill";
    button.dataset.year = String(era.year);
    button.textContent = era.label;
    button.addEventListener("click", () => {
      jumpToYear(era.year);
      setActiveEraPill(era.id);
    });
    button.dataset.era = era.id;
    ERA_PILLS.append(button);
  }
}

function setActiveEraPill(id) {
  const pills = ERA_PILLS.querySelectorAll(".era-pill");
  pills.forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.era === id);
  });
}

function getFilteredPeople() {
  const query = state.query.trim().toLowerCase();

  return state.people.filter((person) => {
    const categoryKey = slugifyCategory(person.category);
    const categoryMatch = state.category === "all" || categoryKey === state.category;
    if (!categoryMatch) return false;
    if (!query) return true;

    const categoryMeta = getCategoryMeta(categoryKey);
    const blob = [person.name, categoryMeta.label, person.summary, person.achievements.join(" ")]
      .join(" ")
      .toLowerCase();

    return blob.includes(query);
  }).sort((a, b) => a.birthYear - b.birthYear);
}

function buildActiveSegments(people) {
  const sorted = [...people].sort((a, b) => a.birthYear - b.birthYear);
  const segments = [];
  let current = {
    start: sorted[0].birthYear,
    end: sorted[0].deathYear
  };

  for (let index = 1; index < sorted.length; index += 1) {
    const person = sorted[index];
    if (person.birthYear <= current.end + ACTIVE_SEGMENT_JOIN_YEARS) {
      current.end = Math.max(current.end, person.deathYear);
      continue;
    }

    segments.push(current);
    current = { start: person.birthYear, end: person.deathYear };
  }

  segments.push(current);
  return segments;
}

function buildTimelineMetrics(people) {
  if (!people.length) return null;

  const minYear = Math.min(...people.map((person) => person.birthYear));
  const maxYear = Math.max(...people.map((person) => person.deathYear));
  const yearRange = Math.max(1, maxYear - minYear);

  const viewportWidth = Math.max(760, VIEWPORT.clientWidth || 760);
  const zoomFactor = Math.max(0.74, state.zoom / 140);
  const densityPerCentury = people.length / Math.max(1, yearRange / 100);
  const activeRateRaw = (1.14 * zoomFactor) * Math.min(1.58, 0.9 + Math.sqrt(densityPerCentury) * 0.17);
  const gapRateRaw = activeRateRaw * Math.min(0.36, GAP_COMPRESSION_BASE + densityPerCentury * 0.01);

  const segments = buildActiveSegments(people);
  const rawPieces = [];
  let cursorYear = minYear;
  let cursorX = 0;

  for (const segment of segments) {
    const segmentStart = Math.max(minYear, segment.start);
    const segmentEnd = Math.min(maxYear, segment.end);

    if (segmentStart > cursorYear) {
      const gapLength = segmentStart - cursorYear;
      const gapWidth = gapLength * gapRateRaw;
      rawPieces.push({
        type: "gap",
        startYear: cursorYear,
        endYear: segmentStart,
        rate: gapRateRaw,
        startX: cursorX,
        endX: cursorX + gapWidth
      });
      cursorX += gapWidth;
      cursorYear = segmentStart;
    }

    if (segmentEnd > cursorYear) {
      const activeLength = segmentEnd - cursorYear;
      const activeWidth = activeLength * activeRateRaw;
      rawPieces.push({
        type: "active",
        startYear: cursorYear,
        endYear: segmentEnd,
        rate: activeRateRaw,
        startX: cursorX,
        endX: cursorX + activeWidth
      });
      cursorX += activeWidth;
      cursorYear = segmentEnd;
    }
  }

  if (cursorYear < maxYear) {
    const tailLength = maxYear - cursorYear;
    rawPieces.push({
      type: "gap",
      startYear: cursorYear,
      endYear: maxYear,
      rate: gapRateRaw,
      startX: cursorX,
      endX: cursorX + tailLength * gapRateRaw
    });
  }

  if (rawPieces.length === 0) {
    rawPieces.push({
      type: "active",
      startYear: minYear,
      endYear: maxYear,
      rate: activeRateRaw,
      startX: 0,
      endX: Math.max(1, yearRange * activeRateRaw)
    });
  }

  const rawInnerWidth = Math.max(1, rawPieces[rawPieces.length - 1].endX);
  const minTargetInner = Math.max(viewportWidth - AXIS_PADDING_X * 2, 620);
  const maxTargetInner =
    viewportWidth *
      Math.max(1.25, 1.2 + zoomFactor * 1.35 + Math.min(1.5, densityPerCentury * 0.14)) -
    AXIS_PADDING_X * 2;

  let scaleFactor = 1;
  if (rawInnerWidth < minTargetInner) {
    scaleFactor = minTargetInner / rawInnerWidth;
  } else if (rawInnerWidth > maxTargetInner) {
    scaleFactor = maxTargetInner / rawInnerWidth;
  }
  scaleFactor = Math.max(0.55, Math.min(2.6, scaleFactor));

  const pieces = rawPieces.map((piece) => ({
    ...piece,
    rate: piece.rate * scaleFactor,
    startX: piece.startX * scaleFactor,
    endX: piece.endX * scaleFactor
  }));

  const innerWidth = Math.max(1, rawInnerWidth * scaleFactor);
  const timelineWidth = Math.max(viewportWidth, Math.ceil(innerWidth + AXIS_PADDING_X * 2));

  const findPieceByYear = (year) => {
    for (let index = 0; index < pieces.length; index += 1) {
      const piece = pieces[index];
      if (year >= piece.startYear && year <= piece.endYear) return piece;
    }
    return pieces[pieces.length - 1];
  };

  const findPieceByX = (x) => {
    for (let index = 0; index < pieces.length; index += 1) {
      const piece = pieces[index];
      if (x >= piece.startX && x <= piece.endX) return piece;
    }
    return pieces[pieces.length - 1];
  };

  const yearToX = (year) => {
    const safeYear = Math.max(minYear, Math.min(maxYear, year));
    const piece = findPieceByYear(safeYear);
    return AXIS_PADDING_X + piece.startX + (safeYear - piece.startYear) * piece.rate;
  };

  const xToYear = (absoluteX) => {
    const localX = Math.max(0, Math.min(innerWidth, absoluteX - AXIS_PADDING_X));
    const piece = findPieceByX(localX);
    if (piece.rate <= 0) return piece.startYear;
    return piece.startYear + (localX - piece.startX) / piece.rate;
  };

  return {
    minYear,
    maxYear,
    yearRange,
    timelineWidth,
    activeRate: activeRateRaw * scaleFactor,
    densityPerCentury,
    yearToX,
    xToYear
  };
}

function layoutPeople(people) {
  if (people.length === 0) {
    return {
      items: [],
      rowsCount: 0,
      rowHeight: BASE_ROW_HEIGHT,
      timelineWidth: 640,
      metrics: null
    };
  }

  const metrics = buildTimelineMetrics(people);
  const density = metrics.densityPerCentury;
  const rowHeight = Math.max(46, Math.min(62, BASE_ROW_HEIGHT - density * 0.5));
  const rowGapPx = Math.max(7, ROW_GAP_PX - density * 0.35);
  const labelBaseWidth = Math.max(90, Math.min(138, 126 - density * 4.3 - (state.zoom - 140) * 0.12));

  const rowsEnd = [];
  const items = [...people]
    .sort((a, b) => a.birthYear - b.birthYear)
    .map((person) => {
      const left = metrics.yearToX(person.birthYear);
      const right = metrics.yearToX(person.deathYear);
      const rawWidth = Math.max(10, right - left);
      const nameWidthBoost = Math.min(40, person.name.length * 2.1);
      const minWidth = Math.max(MIN_BAR_PX, Math.min(172, labelBaseWidth + nameWidthBoost));
      const width = Math.max(minWidth, rawWidth);

      let row = 0;
      while (row < rowsEnd.length && left <= rowsEnd[row] + rowGapPx) {
        row += 1;
      }

      rowsEnd[row] = left + width;

      return {
        ...person,
        row,
        left,
        width,
        yearsShort: formatPersonYears(person)
      };
    });

  const farRight = Math.max(...items.map((person) => person.left + person.width));
  const timelineWidth = Math.max(metrics.timelineWidth, Math.ceil(farRight + AXIS_PADDING_X * 0.6));

  return {
    items,
    rowsCount: rowsEnd.length,
    rowHeight,
    timelineWidth,
    metrics: { ...metrics, timelineWidth }
  };
}

function renderAxis(metrics, timelineWidth) {
  AXIS.innerHTML = "";
  const steps = [5, 10, 25, 50, 100, 200, 500];
  const majorStep = chooseTickStep(metrics.activeRate);
  const majorIndex = steps.indexOf(majorStep);
  const minorStep = majorIndex > 0 ? steps[majorIndex - 1] : null;

  let lastMajorX = Number.NEGATIVE_INFINITY;
  if (minorStep && minorStep * metrics.activeRate >= 36) {
    let lastMinorX = Number.NEGATIVE_INFINITY;
    const minorStart = Math.floor(metrics.minYear / minorStep) * minorStep;
    for (let year = minorStart; year <= metrics.maxYear; year += minorStep) {
      if (year % majorStep === 0) continue;
      const left = metrics.yearToX(year);
      if (left - lastMinorX < 28) continue;
      const tick = document.createElement("span");
      tick.className = "axis-tick minor";
      tick.style.left = `${Math.max(0, Math.min(timelineWidth, left))}px`;
      AXIS.append(tick);
      lastMinorX = left;
    }
  }

  const majorStart = Math.floor(metrics.minYear / majorStep) * majorStep;
  for (let year = majorStart; year <= metrics.maxYear; year += majorStep) {
    const left = metrics.yearToX(year);
    if (left - lastMajorX < 70) continue;
    const tick = document.createElement("span");
    tick.className = "axis-tick major";
    tick.style.left = `${Math.max(0, Math.min(timelineWidth, left))}px`;

    const label = document.createElement("span");
    label.textContent = formatYear(year);
    tick.append(label);
    AXIS.append(tick);
    lastMajorX = left;
  }
}

function updateTimelineReadout() {
  if (!TIMELINE_READOUT) return;
  const metrics = state.layoutMetrics;
  if (!metrics) {
    TIMELINE_READOUT.textContent = "";
    return;
  }

  const visibleStartYear = metrics.xToYear(VIEWPORT.scrollLeft);
  const visibleEndYear = metrics.xToYear(VIEWPORT.scrollLeft + VIEWPORT.clientWidth);
  const from = Math.round(Math.max(metrics.minYear, visibleStartYear));
  const to = Math.round(Math.min(metrics.maxYear, visibleEndYear));
  TIMELINE_READOUT.textContent = `Видимый период: ${formatYear(from)} - ${formatYear(to)}`;
}

function getCurrentLayoutMetrics(people) {
  if (!people.length) return null;
  return buildTimelineMetrics(people);
}

function jumpToYear(year) {
  const metrics = state.layoutMetrics ?? getCurrentLayoutMetrics(state.filteredPeople);
  if (!metrics) return;
  const clampedYear = Math.max(metrics.minYear, Math.min(metrics.maxYear, year));
  const pointX = metrics.yearToX(clampedYear);
  const targetScrollLeft = Math.max(0, pointX - VIEWPORT.clientWidth * 0.5);
  VIEWPORT.scrollTo({
    left: targetScrollLeft,
    behavior: shouldReduceMotion() ? "auto" : "smooth"
  });
}

function focusPersonInViewport(person) {
  if (!person) return;
  const centerX = person.left + person.width / 2;
  const targetScrollLeft = Math.max(0, centerX - VIEWPORT.clientWidth * 0.5);
  VIEWPORT.scrollTo({
    left: targetScrollLeft,
    behavior: shouldReduceMotion() ? "auto" : "smooth"
  });
}

function setActiveItem() {
  const pills = LANES.querySelectorAll(".life-pill");
  pills.forEach((pill) => {
    const isActive = pill.dataset.id === state.selectedId;
    pill.classList.toggle("active", isActive);
    pill.setAttribute("aria-pressed", String(isActive));
  });
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function extractThumbnail(queryData) {
  if (!queryData?.query?.pages) return null;
  const pages = Object.values(queryData.query.pages);
  for (const page of pages) {
    if (page?.thumbnail?.source) return page.thumbnail.source;
  }
  return null;
}

async function fetchPortraitUrl(person) {
  const manualUrl = String(person?.photoUrl || "").trim();
  if (manualUrl) {
    portraitCache.set(person.id, manualUrl);
    return manualUrl;
  }

  if (portraitCache.has(person.id)) {
    return portraitCache.get(person.id);
  }

  const candidateTitles = [...new Set([person.wikiTitle, person.name].filter(Boolean))];

  for (const title of candidateTitles) {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      prop: "pageimages",
      pithumbsize: String(PORTRAIT_SIZE),
      titles: title,
      redirects: "1"
    });

    try {
      const response = await fetch(`${WIKI_API_URL}?${params.toString()}`);
      if (!response.ok) continue;
      const data = await response.json();
      const thumbnail = extractThumbnail(data);
      if (thumbnail) {
        portraitCache.set(person.id, thumbnail);
        return thumbnail;
      }
    } catch {
      // Ignore network/API issues and fallback to initials.
    }
  }

  portraitCache.set(person.id, null);
  return null;
}

async function applyPortrait(person, imageEl, fallbackEl, requestId) {
  const portraitUrl = await fetchPortraitUrl(person);
  if (!imageEl.isConnected) return;
  if (state.detailsRequestId !== requestId || state.selectedId !== person.id) return;

  if (portraitUrl) {
    imageEl.src = portraitUrl;
    imageEl.hidden = false;
    fallbackEl.hidden = true;
    return;
  }

  imageEl.hidden = true;
  fallbackEl.hidden = false;
}

function renderDetails(person) {
  state.detailsRequestId += 1;
  const requestId = state.detailsRequestId;

  if (!person) {
    DETAILS.className = "details-card empty";
    DETAILS.innerHTML = "<p>Ничего не найдено по заданному фильтру.</p>";
    DETAILS.classList.add("is-visible");
    return;
  }

  DETAILS.className = "details-card";
  DETAILS.innerHTML = "";

  const head = document.createElement("div");
  head.className = "details-head";

  const avatar = document.createElement("div");
  avatar.className = "details-avatar";
  avatar.setAttribute("aria-hidden", "true");

  const image = document.createElement("img");
  image.className = "details-avatar-img";
  image.alt = `Портрет: ${person.name}`;
  image.width = 84;
  image.height = 84;
  image.loading = "lazy";
  image.decoding = "async";
  image.hidden = true;

  const fallback = document.createElement("span");
  fallback.className = "details-avatar-fallback";
  fallback.textContent = getInitials(person.name);

  image.addEventListener("error", () => {
    image.hidden = true;
    fallback.hidden = false;
  });

  avatar.append(image, fallback);

  const heading = document.createElement("div");
  heading.className = "details-heading";

  const name = document.createElement("h3");
  name.textContent = person.name;

  const meta = document.createElement("p");
  meta.className = "details-meta";
  const categoryLabel = getCategoryMeta(person.category).label;
  meta.textContent = `${categoryLabel} · ${person.birthDate} - ${person.deathDate}`;
  heading.append(name, meta);
  head.append(avatar, heading);

  const summary = document.createElement("p");
  summary.className = "details-summary";
  summary.textContent = person.summary;

  const list = document.createElement("ul");
  list.className = "details-achievements";
  person.achievements.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    list.append(item);
  });

  DETAILS.append(head, summary, list);
  applyPortrait(person, image, fallback, requestId);

  if (shouldReduceMotion()) {
    DETAILS.classList.add("is-visible");
  } else {
    requestAnimationFrame(() => {
      DETAILS.classList.add("is-visible");
    });
  }
}

function renderTimeline(people) {
  LANES.innerHTML = "";

  if (people.length === 0) {
    AXIS.innerHTML = "";
    LANES.style.height = "auto";
    AXIS.style.width = "100%";
    LANES.style.width = "100%";
    state.layoutMetrics = null;
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "По этим фильтрам персон не найдено.";
    LANES.append(empty);
    renderDetails(null);
    return;
  }

  const { items, rowsCount, rowHeight, timelineWidth, metrics } = layoutPeople(people);
  state.layoutMetrics = metrics;
  LANES.style.height = `${Math.max(220, rowsCount * rowHeight)}px`;
  AXIS.style.width = `${timelineWidth}px`;
  LANES.style.width = `${timelineWidth}px`;
  renderAxis(metrics, timelineWidth);

  items.forEach((person, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "life-pill";
    button.dataset.id = person.id;
    button.setAttribute("role", "listitem");
    button.style.left = `${person.left}px`;
    button.style.width = `${person.width}px`;
    button.style.top = `${person.row * rowHeight}px`;
    button.style.setProperty("--pill-color", getCategoryMeta(person.category).color);
    button.style.setProperty("--entry-delay", `${Math.min(index, 28) * 18}ms`);
    button.setAttribute("aria-label", `${person.name}, ${person.birthDate} - ${person.deathDate}`);

    const name = document.createElement("span");
    name.className = "person-name";
    name.textContent = person.name;

    const years = document.createElement("span");
    years.className = "person-years";
    years.textContent = person.yearsShort;

    button.append(name, years);
    button.addEventListener("click", () => {
      state.selectedId = person.id;
      setActiveItem();
      renderDetails(person);
      focusPersonInViewport(person);
    });
    LANES.append(button);

    if (shouldReduceMotion()) {
      button.classList.add("is-visible");
    } else {
      requestAnimationFrame(() => {
        button.classList.add("is-visible");
      });
    }
  });

  const selectedExists = items.some((person) => person.id === state.selectedId);
  if (!selectedExists) {
    state.selectedId = items[0].id;
  }

  setActiveItem();
  const selectedPerson = items.find((person) => person.id === state.selectedId);
  renderDetails(selectedPerson);

  if (selectedPerson) {
    if (shouldReduceMotion()) {
      focusPersonInViewport(selectedPerson);
    } else {
      requestAnimationFrame(() => {
        focusPersonInViewport(selectedPerson);
      });
    }
  }
}

function render() {
  const filtered = getFilteredPeople();
  state.filteredPeople = filtered;
  RESULTS_COUNT.textContent = String(filtered.length);
  renderTimeline(filtered);
  updateCategoryButtonsState();
  syncActiveEraWithScroll();
  updateTimelineReadout();
}

function updateDataSourceNote() {
  if (!DATA_SOURCE_NOTE) return;
  const sourceMap = {
    supabase: "Источник данных: Supabase",
    "supabase-error": "Источник данных: Supabase (ошибка загрузки)",
    local: "Источник данных: localStorage",
    seed: "Источник данных: встроенный набор"
  };
  DATA_SOURCE_NOTE.textContent = sourceMap[state.dataSource] || "";
}

async function loadPeopleFromService() {
  if (!dataService) {
    state.people = [...PEOPLE];
    state.dataSource = "seed";
    updateDataSourceNote();
    return;
  }

  const isSupabaseConfigured =
    typeof dataService.isSupabaseConfigured === "function" && dataService.isSupabaseConfigured();

  try {
    const result = isSupabaseConfigured
      ? await dataService.fetchPeople([], { preferSupabaseOnly: true })
      : await dataService.fetchPeople(PEOPLE);
    const loaded = Array.isArray(result.people) ? result.people : [];
    if (!isSupabaseConfigured && !loaded.length) {
      state.people = [...PEOPLE];
      state.dataSource = "seed";
    } else {
      state.people = loaded;
      state.dataSource = isSupabaseConfigured ? "supabase" : result.source || "seed";
    }
  } catch {
    if (isSupabaseConfigured) {
      state.people = [];
      state.dataSource = "supabase-error";
    } else {
      state.people = [...PEOPLE];
      state.dataSource = "seed";
    }
  }

  updateDataSourceNote();
  syncCategoryRegistry();
  renderLegend();
}

function syncActiveEraWithScroll() {
  const metrics = state.layoutMetrics ?? getCurrentLayoutMetrics(state.filteredPeople);
  if (!metrics) return;
  const centerPx = VIEWPORT.scrollLeft + VIEWPORT.clientWidth / 2;
  const centerYear = metrics.xToYear(centerPx);
  let nearest = ERAS[0];
  let smallestDistance = Number.POSITIVE_INFINITY;

  for (const era of ERAS) {
    const distance = Math.abs(era.year - centerYear);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      nearest = era;
    }
  }

  setActiveEraPill(nearest.id);
  updateTimelineReadout();
}

function bindEvents() {
  SEARCH_INPUT.addEventListener("input", (event) => {
    state.query = event.currentTarget.value;
    render();
  });

  ZOOM_RANGE.addEventListener("input", (event) => {
    state.zoom = Number(event.currentTarget.value);
    render();
  });

  VIEWPORT.addEventListener(
    "wheel",
    (event) => {
      if (!event.shiftKey) return;
      event.preventDefault();
      VIEWPORT.scrollLeft += event.deltaY;
    },
    { passive: false }
  );

  VIEWPORT.addEventListener(
    "scroll",
    () => {
      syncActiveEraWithScroll();
    },
    { passive: true }
  );

  window.addEventListener(
    "resize",
    () => {
      render();
    },
    { passive: true }
  );
}

function initParallax() {
  if (!PARALLAX_LAYERS.length || shouldReduceMotion()) return;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let targetScroll = window.scrollY;
  let currentScroll = window.scrollY;
  let frameId = 0;

  const update = () => {
    frameId = 0;
    currentX += (targetX - currentX) * 0.09;
    currentY += (targetY - currentY) * 0.09;
    currentScroll += (targetScroll - currentScroll) * 0.08;

    const maxScrollable = Math.max(1, document.body.scrollHeight - window.innerHeight);
    const scrollProgress = currentScroll / maxScrollable;

    PARALLAX_LAYERS.forEach((layer) => {
      const depth = Number(layer.dataset.parallaxDepth ?? 0);
      const translateX = currentX * depth;
      const translateY = currentY * depth + scrollProgress * 24 * depth;
      layer.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    });

    const moving =
      Math.abs(targetX - currentX) > 0.02 ||
      Math.abs(targetY - currentY) > 0.02 ||
      Math.abs(targetScroll - currentScroll) > 0.12;

    if (moving) frameId = requestAnimationFrame(update);
  };

  const requestFrame = () => {
    if (!frameId) frameId = requestAnimationFrame(update);
  };

  if (HAS_HOVER_MEDIA.matches) {
    window.addEventListener(
      "pointermove",
      (event) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        targetX = ((event.clientX - centerX) / centerX) * 7.5;
        targetY = ((event.clientY - centerY) / centerY) * 7.5;
        requestFrame();
      },
      { passive: true }
    );

    window.addEventListener(
      "pointerleave",
      () => {
        targetX = 0;
        targetY = 0;
        requestFrame();
      },
      { passive: true }
    );
  }

  window.addEventListener(
    "scroll",
    () => {
      targetScroll = window.scrollY;
      requestFrame();
    },
    { passive: true }
  );

  requestFrame();
}

async function init() {
  renderEraPills();
  setActiveEraPill("modern");
  bindEvents();
  initParallax();
  await loadPeopleFromService();
  render();
}

init();
