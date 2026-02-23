"use strict";

const BASE_CATEGORIES = {
  science: "Наука",
  philosophy: "Философия",
  politics: "Политика",
  art: "Искусство",
  exploration: "Исследования и космос",
  technology: "Технологии",
  psychology: "Психология"
};
const CATEGORY_STORAGE_KEY = "timeline_categories_v1";

const CURRENT_YEAR = new Date().getFullYear();
const service = window.TimelineDataService;

const authStatus = document.querySelector("#auth-status");
const authError = document.querySelector("#auth-error");
const loginPanel = document.querySelector("#login-panel");
const sessionPanel = document.querySelector("#session-panel");
const sessionLabel = document.querySelector("#session-label");
const loginForm = document.querySelector("#login-form");
const loginButton = document.querySelector("#login-btn");
const logoutButton = document.querySelector("#logout-btn");
const adminEditorSection = document.querySelector("#admin-editor");

const editorTitle = document.querySelector("#editor-title");
const storageModeNode = document.querySelector("#storage-mode");
const personForm = document.querySelector("#person-form");
const resetButton = document.querySelector("#reset-btn");
const saveButton = document.querySelector("#save-btn");

const nameInput = document.querySelector("#person-name");
const categoryInput = document.querySelector("#person-category");
const birthYearInput = document.querySelector("#birth-year");
const deathYearInput = document.querySelector("#death-year");
const livingInput = document.querySelector("#is-living");
const birthDateInput = document.querySelector("#birth-date");
const deathDateInput = document.querySelector("#death-date");
const summaryInput = document.querySelector("#person-summary");
const achievementsInput = document.querySelector("#person-achievements");
const wikiTitleInput = document.querySelector("#wiki-title");
const photoUrlInput = document.querySelector("#photo-url");
const newCategoryNameInput = document.querySelector("#new-category-name");
const addCategoryButton = document.querySelector("#add-category-btn");
const newCategoryHint = document.querySelector("#new-category-hint");
const categoriesList = document.querySelector("#categories-list");

const listSearchInput = document.querySelector("#list-search");
const listMeta = document.querySelector("#list-meta");
const tableBody = document.querySelector("#people-body");
const messageNode = document.querySelector("#admin-message");

const state = {
  editingId: null,
  people: [],
  session: null,
  source: "seed",
  categories: { ...BASE_CATEGORIES },
  listQuery: "",
  loginPending: false,
  savePending: false,
  logoutPending: false,
  categoryPending: false
};

function showMessage(text, kind = "info") {
  messageNode.textContent = text;
  messageNode.className = kind === "error" ? "admin-message error" : "admin-message";
}

function setAuthError(text = "") {
  authError.textContent = text;
}

function setLoginPending(isPending) {
  state.loginPending = isPending;
  if (!loginButton) return;
  loginButton.classList.toggle("is-loading", isPending);
  loginButton.disabled = isPending;

  const emailInput = document.querySelector("#login-email");
  const passwordInput = document.querySelector("#login-password");
  if (emailInput) emailInput.disabled = isPending;
  if (passwordInput) passwordInput.disabled = isPending;
  renderTable();
  renderCategoryManager();
}

function updateEditorControlsState() {
  if (!personForm) return;
  const shouldDisable = state.savePending || state.logoutPending || state.categoryPending || !canMutate();
  const controls = personForm.querySelectorAll("input, textarea, select, button");
  controls.forEach((control) => {
    control.disabled = shouldDisable;
  });
  if (!shouldDisable) syncLivingFields();
}

function setSavePending(isPending) {
  state.savePending = isPending;
  if (!saveButton || !personForm) return;
  saveButton.classList.toggle("is-loading", isPending);
  updateEditorControlsState();
  renderTable();
  renderCategoryManager();
}

function setLogoutPending(isPending) {
  state.logoutPending = isPending;
  if (logoutButton) {
    logoutButton.classList.toggle("is-loading", isPending);
    logoutButton.disabled = isPending;
  }
  updateEditorControlsState();
  renderTable();
  renderCategoryManager();
}

function setCategoryActionPending(isPending) {
  state.categoryPending = isPending;
  if (addCategoryButton) {
    addCategoryButton.classList.toggle("is-loading", isPending);
  }
  updateEditorControlsState();
  renderTable();
  renderCategoryManager();
}

function isUiLocked() {
  return state.loginPending || state.savePending || state.logoutPending || state.categoryPending;
}

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function extractSurname(name) {
  const cleaned = String(name || "")
    .replace(/[.,;:!?()"'`«»]/g, " ")
    .trim();
  if (!cleaned) return "";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  return parts[parts.length - 1];
}

function generateUniquePersonId(name, excludedId = null) {
  const surname = extractSurname(name);
  const base = slugify(surname || name) || "person";
  const used = new Set(
    state.people
      .map((person) => String(person?.id || "").trim().toLowerCase())
      .filter(Boolean)
  );

  if (excludedId) {
    used.delete(String(excludedId).trim().toLowerCase());
  }

  if (!used.has(base.toLowerCase())) return base;

  let index = 2;
  while (used.has(`${base}-${index}`.toLowerCase())) {
    index += 1;
  }
  return `${base}-${index}`;
}

function slugifyCategoryKey(text) {
  return String(text || "")
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
    const normalized = {};
    Object.entries(parsed).forEach(([key, label]) => {
      const slug = slugifyCategoryKey(key);
      const cleanLabel = String(label || "").trim();
      if (!slug || !cleanLabel) return;
      normalized[slug] = cleanLabel;
    });
    return normalized;
  } catch {
    return {};
  }
}

function writeStoredCategories() {
  try {
    const persisted = {};
    Object.entries(state.categories).forEach(([key, label]) => {
      if (BASE_CATEGORIES[key]) {
        if (label !== BASE_CATEGORIES[key]) {
          persisted[key] = label;
        }
      } else {
        persisted[key] = label;
      }
    });
    window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    // Ignore storage errors.
  }
}

function mergeCategoriesFromPeople(people) {
  const merged = { ...BASE_CATEGORIES, ...readStoredCategories() };
  people.forEach((person) => {
    const key = slugifyCategoryKey(person?.category || "");
    if (!key) return;
    if (!merged[key]) {
      merged[key] = labelFromCategoryKey(key);
    }
  });
  state.categories = merged;
}

function getDefaultCategoryId() {
  if (state.categories.science) return "science";
  const first = Object.keys(state.categories)[0];
  return first || "science";
}

function getCategoryLabel(category) {
  const direct = String(category || "").trim();
  if (state.categories[direct]) return state.categories[direct];
  const slug = slugifyCategoryKey(direct);
  return state.categories[slug] || labelFromCategoryKey(slug || direct);
}

function isSystemCategory(key) {
  return Boolean(BASE_CATEGORIES[key]);
}

function getCategoryUsageMap() {
  const usage = {};
  state.people.forEach((person) => {
    const key = slugifyCategoryKey(person?.category || "");
    if (!key) return;
    usage[key] = (usage[key] || 0) + 1;
  });
  return usage;
}

function pickFallbackCategory(excludedKey) {
  if (state.categories.science && excludedKey !== "science") return "science";
  const keys = Object.keys(state.categories);
  return keys.find((key) => key !== excludedKey) || null;
}

function canMutate() {
  if (!service) return false;
  if (!service?.isSupabaseConfigured()) return true;
  return Boolean(state.session);
}

function mapAuthError(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "");

  if (code === "invalid_credentials") {
    return "Неверный email или пароль. Проверьте данные или сбросьте пароль в Supabase Auth.";
  }
  if (code === "email_not_confirmed") {
    return "Email не подтвержден. Подтвердите email в Supabase или отключите подтверждение в настройках Auth.";
  }
  if (code === "invalid_api_key") {
    return "Неверный Supabase ключ. Укажите Publishable key в supabase-config.js.";
  }
  if (message.toLowerCase().includes("failed to fetch")) {
    return "Нет соединения с Supabase. Проверьте URL проекта и интернет.";
  }
  return message || "Ошибка авторизации.";
}

function syncLivingFields() {
  const isLiving = livingInput.checked;
  deathYearInput.disabled = isLiving;
  deathDateInput.disabled = isLiving;
  if (isLiving) {
    deathYearInput.value = String(CURRENT_YEAR);
    deathDateInput.value = "по н.в.";
  }
}

function resetForm() {
  state.editingId = null;
  editorTitle.textContent = "Добавить персону";
  personForm.reset();
  categoryInput.value = getDefaultCategoryId();
  if (newCategoryNameInput) newCategoryNameInput.value = "";
  if (newCategoryHint) newCategoryHint.textContent = "";
  syncLivingFields();
}

function fillCategorySelect(selectedCategory = categoryInput.value) {
  categoryInput.innerHTML = "";
  const entries = Object.entries(state.categories).sort((first, second) =>
    first[1].localeCompare(second[1], "ru")
  );
  entries.forEach(([key, label]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = label;
    categoryInput.append(option);
  });

  const fallback = getDefaultCategoryId();
  categoryInput.value = state.categories[selectedCategory] ? selectedCategory : fallback;
}

function addCategoryFromInput() {
  const rawLabel = String(newCategoryNameInput?.value || "").trim();
  if (!rawLabel) {
    if (newCategoryHint) newCategoryHint.textContent = "Введите название новой категории.";
    return;
  }
  const key = slugifyCategoryKey(rawLabel);
  if (!key) {
    if (newCategoryHint) newCategoryHint.textContent = "Не удалось сформировать id категории.";
    return;
  }

  const existingLabel = state.categories[key];
  if (existingLabel) {
    fillCategorySelect(key);
    if (newCategoryHint) {
      newCategoryHint.textContent = `Категория уже существует: ${existingLabel} (${key}).`;
    }
    showMessage(`Категория уже существует: ${existingLabel}.`);
    return;
  }

  const duplicateLabel = Object.values(state.categories).some((label) => {
    return String(label).toLowerCase() === rawLabel.toLowerCase();
  });
  if (duplicateLabel) {
    if (newCategoryHint) newCategoryHint.textContent = `Категория с названием "${rawLabel}" уже есть.`;
    showMessage(`Категория с названием "${rawLabel}" уже есть.`, "error");
    return;
  }

  state.categories[key] = rawLabel;
  writeStoredCategories();
  fillCategorySelect(key);
  renderCategoryManager();
  if (newCategoryNameInput) newCategoryNameInput.value = "";
  if (newCategoryHint) newCategoryHint.textContent = `Добавлено: ${rawLabel} (${key})`;
  showMessage(`Категория добавлена: ${rawLabel}`);
}

function readAchievements() {
  return achievementsInput.value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function collectPersonFromForm() {
  const name = nameInput.value.trim();
  if (!name) throw new Error("Укажите имя.");

  const birthYear = Number(birthYearInput.value);
  if (!Number.isFinite(birthYear)) throw new Error("Укажите корректный год рождения.");

  const isLiving = livingInput.checked;
  let deathYear = Number(deathYearInput.value);
  if (isLiving) {
    deathYear = CURRENT_YEAR;
  } else if (!Number.isFinite(deathYear)) {
    throw new Error("Укажите корректный год смерти.");
  }

  const summary = summaryInput.value.trim();
  if (!summary) throw new Error("Добавьте краткое описание.");

  const achievements = readAchievements();
  if (!achievements.length) throw new Error("Добавьте хотя бы одно достижение.");

  const id = state.editingId || generateUniquePersonId(name);

  const birthDate = birthDateInput.value.trim() || String(birthYear);
  const deathDate = isLiving ? "по н.в." : (deathDateInput.value.trim() || String(deathYear));

  return {
    id,
    name,
    category: categoryInput.value || getDefaultCategoryId(),
    birthYear,
    deathYear,
    birthDate,
    deathDate,
    summary,
    achievements,
    wikiTitle: wikiTitleInput.value.trim() || undefined,
    photoUrl: photoUrlInput.value.trim() || undefined
  };
}

function fillForm(person) {
  state.editingId = person.id;
  editorTitle.textContent = `Редактирование: ${person.name}`;

  nameInput.value = person.name || "";
  const categoryKey = slugifyCategoryKey(person.category || "");
  if (categoryKey && !state.categories[categoryKey]) {
    state.categories[categoryKey] = labelFromCategoryKey(categoryKey);
    writeStoredCategories();
    fillCategorySelect(categoryKey);
  } else {
    fillCategorySelect(categoryKey || getDefaultCategoryId());
  }
  birthYearInput.value = String(person.birthYear ?? "");
  deathYearInput.value = String(person.deathYear ?? "");
  livingInput.checked = person.deathDate === "по н.в.";
  birthDateInput.value = person.birthDate || "";
  deathDateInput.value = person.deathDate || "";
  summaryInput.value = person.summary || "";
  achievementsInput.value = Array.isArray(person.achievements) ? person.achievements.join("\n") : "";
  wikiTitleInput.value = person.wikiTitle || "";
  photoUrlInput.value = person.photoUrl || "";
  syncLivingFields();
}

function setStorageMode(source) {
  const map = {
    supabase: "Источник: Supabase",
    local: "Источник: localStorage",
    seed: "Источник: встроенный набор"
  };
  storageModeNode.textContent = map[source] || `Источник: ${source}`;
}

function applySearch(people) {
  const query = state.listQuery.trim().toLowerCase();
  if (!query) return people;
  return people.filter((person) => {
    const categoryLabel = getCategoryLabel(person.category);
    const combined = `${person.id} ${person.name} ${person.category} ${categoryLabel}`.toLowerCase();
    return combined.includes(query);
  });
}

function renderTable() {
  tableBody.innerHTML = "";
  const editable = canMutate();
  const uiLocked = isUiLocked();
  const filtered = applySearch(state.people);
  listMeta.textContent = `Всего: ${state.people.length} · Показано: ${filtered.length}`;

  if (!filtered.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "Персоны не найдены.";
    row.append(cell);
    tableBody.append(row);
    return;
  }

  filtered.forEach((person) => {
    const row = document.createElement("tr");
    const disabledAttr = uiLocked ? "disabled" : "";
    const actionsCell = editable
      ? `
        <div class="table-actions">
          <button class="admin-btn secondary js-edit" type="button" ${disabledAttr}>Изменить</button>
          <button class="admin-btn js-delete" type="button" ${disabledAttr}>
            <span class="btn-label">Удалить</span>
            <span class="btn-spinner" aria-hidden="true"></span>
          </button>
        </div>
      `
      : `<span class="readonly-badge">Только просмотр</span>`;

    row.innerHTML = `
      <td>${person.id}</td>
      <td>${person.name}</td>
      <td>${getCategoryLabel(person.category)}</td>
      <td>${person.birthDate} - ${person.deathDate}</td>
      <td>${actionsCell}</td>
    `;

    if (editable) {
      row.querySelector(".js-edit").addEventListener("click", () => {
        if (isUiLocked()) return;
        fillForm(person);
        showMessage(`Открыто редактирование: ${person.name}`);
      });

      row.querySelector(".js-delete").addEventListener("click", async () => {
        if (isUiLocked()) return;
        if (!canMutate()) {
          showMessage("Для удаления нужен вход администратора.", "error");
          return;
        }
        const ok = confirm(`Удалить "${person.name}"?`);
        if (!ok) return;

        const rowButtons = row.querySelectorAll("button");
        const deleteButton = row.querySelector(".js-delete");
        rowButtons.forEach((button) => {
          button.disabled = true;
        });
        deleteButton.classList.add("is-loading");

        try {
          await service.deletePerson(person.id);
          await loadPeople();
          if (state.editingId === person.id) resetForm();
          showMessage(`Персона удалена: ${person.name}`);
        } catch (error) {
          showMessage(error.message || "Не удалось удалить персону.", "error");
        } finally {
          if (row.isConnected) {
            rowButtons.forEach((button) => {
              button.disabled = false;
            });
            deleteButton.classList.remove("is-loading");
          }
        }
      });
    }

    tableBody.append(row);
  });
}

function renderCategoryManager() {
  if (!categoriesList) return;
  categoriesList.innerHTML = "";

  const entries = Object.entries(state.categories).sort((first, second) =>
    first[1].localeCompare(second[1], "ru")
  );

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "categories-empty";
    empty.textContent = "Категории пока не созданы.";
    categoriesList.append(empty);
    return;
  }

  const usageMap = getCategoryUsageMap();
  const readonly = !canMutate() || isUiLocked();

  entries.forEach(([key, label]) => {
    const row = document.createElement("div");
    row.className = "category-row";

    const meta = document.createElement("div");
    meta.className = "category-meta";

    const nameNode = document.createElement("span");
    nameNode.className = "category-name";
    nameNode.textContent = label;

    const keyNode = document.createElement("span");
    keyNode.className = "category-key";
    keyNode.textContent = key;

    const countNode = document.createElement("span");
    countNode.className = "category-count";
    countNode.textContent = `персон: ${usageMap[key] || 0}`;

    const kindNode = document.createElement("span");
    kindNode.className = "category-kind";
    kindNode.textContent = isSystemCategory(key) ? "системная" : "пользовательская";

    meta.append(nameNode, keyNode, countNode, kindNode);

    const actions = document.createElement("div");
    actions.className = "category-actions";

    const renameInput = document.createElement("input");
    renameInput.type = "text";
    renameInput.className = "category-rename-input";
    renameInput.value = label;
    renameInput.disabled = readonly;

    const renameButton = document.createElement("button");
    renameButton.type = "button";
    renameButton.className = "admin-btn secondary";
    renameButton.textContent = "Переименовать";
    renameButton.disabled = readonly;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "admin-btn secondary";
    deleteButton.textContent = "Удалить";
    deleteButton.disabled = readonly || isSystemCategory(key);
    if (isSystemCategory(key)) {
      deleteButton.title = "Системную категорию удалить нельзя.";
    }

    renameInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      renameButton.click();
    });

    renameButton.addEventListener("click", async () => {
      if (isUiLocked()) return;
      if (!canMutate()) {
        showMessage("Для изменения категорий нужен вход администратора.", "error");
        return;
      }

      const nextLabel = renameInput.value.trim();
      if (!nextLabel) {
        showMessage("Название категории не может быть пустым.", "error");
        return;
      }

      const currentLabel = state.categories[key] || label;
      if (nextLabel === currentLabel) {
        showMessage("Название категории не изменилось.");
        return;
      }

      const duplicate = Object.entries(state.categories).find(([otherKey, otherLabel]) => {
        return otherKey !== key && String(otherLabel).toLowerCase() === nextLabel.toLowerCase();
      });
      if (duplicate) {
        showMessage(`Категория "${nextLabel}" уже существует.`, "error");
        return;
      }

      try {
        setCategoryActionPending(true);
        state.categories[key] = nextLabel;
        writeStoredCategories();
        fillCategorySelect(key);
        showMessage(`Категория переименована: ${nextLabel}`);
      } catch (error) {
        showMessage(error.message || "Не удалось переименовать категорию.", "error");
      } finally {
        setCategoryActionPending(false);
      }
    });

    deleteButton.addEventListener("click", async () => {
      if (isUiLocked()) return;
      if (!canMutate()) {
        showMessage("Для изменения категорий нужен вход администратора.", "error");
        return;
      }
      if (isSystemCategory(key)) {
        showMessage("Системную категорию удалить нельзя.", "error");
        return;
      }

      const fallbackKey = pickFallbackCategory(key);
      if (!fallbackKey) {
        showMessage("Нужна хотя бы одна категория для переноса персон.", "error");
        return;
      }

      const assigned = state.people.filter((person) => {
        return slugifyCategoryKey(person?.category || "") === key;
      });
      const fallbackLabel = getCategoryLabel(fallbackKey);
      const confirmText =
        assigned.length > 0
          ? `Удалить категорию "${label}"? ${assigned.length} персон(ы) будут перенесены в "${fallbackLabel}".`
          : `Удалить категорию "${label}"?`;
      if (!confirm(confirmText)) return;

      try {
        setCategoryActionPending(true);

        if (assigned.length > 0) {
          for (const person of assigned) {
            const payload = { ...person, category: fallbackKey };
            await service.updatePerson(person.id, payload);
          }
        }

        delete state.categories[key];
        writeStoredCategories();
        await loadPeople();

        if (state.editingId) {
          const editingPerson = state.people.find((person) => person.id === state.editingId);
          if (editingPerson) {
            fillForm(editingPerson);
          } else {
            resetForm();
          }
        }

        showMessage(`Категория удалена: ${label}`);
      } catch (error) {
        showMessage(error.message || "Не удалось удалить категорию.", "error");
      } finally {
        setCategoryActionPending(false);
      }
    });

    actions.append(renameInput, renameButton, deleteButton);
    row.append(meta, actions);
    categoriesList.append(row);
  });
}

function renderAuthState() {
  if (!service) {
    setLoginPending(false);
    setSavePending(false);
    setLogoutPending(false);
    state.categoryPending = false;
    authStatus.textContent = "Ошибка: data-service.js не загружен.";
    loginForm.querySelectorAll("input, button").forEach((node) => {
      node.disabled = true;
    });
    loginPanel.classList.remove("is-hidden");
    sessionPanel.classList.add("is-hidden");
    adminEditorSection.classList.add("is-hidden");
    updateEditorControlsState();
    setAuthError("Сервис данных недоступен.");
    renderTable();
    renderCategoryManager();
    return;
  }

  const configured = service?.isSupabaseConfigured();
  if (!configured) {
    setLoginPending(false);
    setSavePending(false);
    setLogoutPending(false);
    state.categoryPending = false;
    authStatus.textContent = "Supabase не настроен. Доступен только локальный режим.";
    loginForm.querySelectorAll("input, button").forEach((node) => {
      node.disabled = true;
    });
    loginPanel.classList.add("is-hidden");
    sessionPanel.classList.add("is-hidden");
    adminEditorSection.classList.remove("is-hidden");
    updateEditorControlsState();
    setAuthError("");
    renderTable();
    renderCategoryManager();
    return;
  }

  loginForm.querySelectorAll("input, button").forEach((node) => {
    node.disabled = false;
  });

  if (state.session?.user?.email) {
    setLoginPending(false);
    setSavePending(false);
    setLogoutPending(false);
    state.categoryPending = false;
    authStatus.textContent = `Вход выполнен: ${state.session.user.email}`;
    sessionLabel.textContent = `Вы вошли как ${state.session.user.email}`;
    loginPanel.classList.add("is-hidden");
    sessionPanel.classList.remove("is-hidden");
    adminEditorSection.classList.remove("is-hidden");
    updateEditorControlsState();
    setAuthError("");
  } else {
    setSavePending(false);
    setLogoutPending(false);
    state.categoryPending = false;
    authStatus.textContent = "Не авторизован. Для записи в Supabase войдите в админку.";
    loginPanel.classList.remove("is-hidden");
    sessionPanel.classList.add("is-hidden");
    adminEditorSection.classList.add("is-hidden");
    updateEditorControlsState();
    setLoginPending(false);
  }

  renderTable();
  renderCategoryManager();
}

async function refreshSession() {
  if (!service) return;
  try {
    state.session = await service.getSession();
  } catch {
    state.session = null;
  }
  renderAuthState();
}

async function loadPeople() {
  if (!service) return;
  const result = await service.fetchPeople([]);
  const selectedCategory = categoryInput.value || getDefaultCategoryId();
  state.people = result.people.sort((a, b) => a.birthYear - b.birthYear);
  mergeCategoriesFromPeople(state.people);
  fillCategorySelect(selectedCategory);
  state.source = result.source;
  setStorageMode(state.source);
  renderTable();
  renderCategoryManager();
}

function bindEvents() {
  livingInput.addEventListener("change", syncLivingFields);
  resetButton.addEventListener("click", () => {
    resetForm();
    showMessage("Форма очищена.");
  });

  listSearchInput.addEventListener("input", (event) => {
    state.listQuery = event.currentTarget.value;
    renderTable();
  });

  if (newCategoryNameInput && newCategoryHint) {
    newCategoryNameInput.addEventListener("input", (event) => {
      const text = String(event.currentTarget.value || "").trim();
      if (!text) {
        newCategoryHint.textContent = "";
        return;
      }
      const key = slugifyCategoryKey(text);
      newCategoryHint.textContent = key ? `ID категории: ${key}` : "";
    });
    newCategoryNameInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      addCategoryButton?.click();
    });
  }

  if (addCategoryButton) {
    addCategoryButton.addEventListener("click", () => {
      if (isUiLocked()) return;
      if (!canMutate()) {
        showMessage("Для изменения категорий нужен вход администратора.", "error");
        return;
      }
      addCategoryFromInput();
    });
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isUiLocked()) return;

    const email = document.querySelector("#login-email").value.trim();
    const password = document.querySelector("#login-password").value;
    if (!email || !password) {
      setAuthError("Введите email и пароль.");
      showMessage("Введите email и пароль.", "error");
      return;
    }
    try {
      setAuthError("");
      setLoginPending(true);
      await service.login(email, password);
      await refreshSession();
      showMessage("Вход выполнен.");
    } catch (error) {
      const readableError = mapAuthError(error);
      setAuthError(readableError);
      showMessage(readableError, "error");
    } finally {
      setLoginPending(false);
    }
  });

  logoutButton.addEventListener("click", async () => {
    if (state.logoutPending || state.savePending || state.categoryPending) return;
    try {
      setLogoutPending(true);
      await service.logout();
      await refreshSession();
      setAuthError("");
      showMessage("Вы вышли из админки.");
    } catch (error) {
      showMessage(error.message || "Не удалось выйти.", "error");
    } finally {
      setLogoutPending(false);
    }
  });

  personForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.savePending || state.logoutPending || state.categoryPending) return;

    if (!canMutate()) {
      showMessage("Для сохранения в Supabase требуется вход администратора.", "error");
      return;
    }

    try {
      setSavePending(true);
      const payload = collectPersonFromForm();
      if (state.editingId) {
        await service.updatePerson(state.editingId, payload);
        showMessage(`Персона обновлена: ${payload.name}`);
      } else {
        await service.createPerson(payload);
        showMessage(`Персона добавлена: ${payload.name}`);
      }
      await loadPeople();
      resetForm();
    } catch (error) {
      showMessage(error.message || "Не удалось сохранить персону.", "error");
    } finally {
      setSavePending(false);
    }
  });
}

async function init() {
  if (!service) {
    renderAuthState();
    showMessage("Не удалось инициализировать слой данных.", "error");
    return;
  }

  mergeCategoriesFromPeople([]);
  fillCategorySelect(getDefaultCategoryId());
  renderCategoryManager();
  syncLivingFields();
  bindEvents();
  await refreshSession();
  await loadPeople();
  service.onAuthStateChange(async () => {
    await refreshSession();
  });
}

init();
