"use strict";

const CATEGORIES = {
  science: "Наука",
  philosophy: "Философия",
  politics: "Политика",
  art: "Искусство",
  exploration: "Исследования и космос",
  technology: "Технологии",
  psychology: "Психология"
};

const CURRENT_YEAR = new Date().getFullYear();
const service = window.TimelineDataService;

const authStatus = document.querySelector("#auth-status");
const loginForm = document.querySelector("#login-form");
const logoutButton = document.querySelector("#logout-btn");

const editorTitle = document.querySelector("#editor-title");
const storageModeNode = document.querySelector("#storage-mode");
const personForm = document.querySelector("#person-form");
const resetButton = document.querySelector("#reset-btn");
const saveButton = document.querySelector("#save-btn");

const idInput = document.querySelector("#person-id");
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

const listSearchInput = document.querySelector("#list-search");
const listMeta = document.querySelector("#list-meta");
const tableBody = document.querySelector("#people-body");
const messageNode = document.querySelector("#admin-message");

const state = {
  editingId: null,
  people: [],
  session: null,
  source: "seed",
  listQuery: ""
};

function showMessage(text, kind = "info") {
  messageNode.textContent = text;
  messageNode.className = kind === "error" ? "admin-message error" : "admin-message";
}

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function canMutate() {
  if (!service) return false;
  if (!service?.isSupabaseConfigured()) return true;
  return Boolean(state.session);
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
  categoryInput.value = "science";
  syncLivingFields();
}

function fillCategorySelect() {
  categoryInput.innerHTML = "";
  Object.entries(CATEGORIES).forEach(([key, label]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = label;
    categoryInput.append(option);
  });
  categoryInput.value = "science";
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

  const manualId = idInput.value.trim();
  const generatedId = slugify(name);
  const id = manualId || generatedId || `person-${Date.now()}`;

  const birthDate = birthDateInput.value.trim() || String(birthYear);
  const deathDate = isLiving ? "по н.в." : (deathDateInput.value.trim() || String(deathYear));

  return {
    id,
    name,
    category: categoryInput.value,
    birthYear,
    deathYear,
    birthDate,
    deathDate,
    summary,
    achievements,
    wikiTitle: wikiTitleInput.value.trim() || undefined
  };
}

function fillForm(person) {
  state.editingId = person.id;
  editorTitle.textContent = `Редактирование: ${person.name}`;

  idInput.value = person.id || "";
  nameInput.value = person.name || "";
  categoryInput.value = person.category || "science";
  birthYearInput.value = String(person.birthYear ?? "");
  deathYearInput.value = String(person.deathYear ?? "");
  livingInput.checked = person.deathDate === "по н.в.";
  birthDateInput.value = person.birthDate || "";
  deathDateInput.value = person.deathDate || "";
  summaryInput.value = person.summary || "";
  achievementsInput.value = Array.isArray(person.achievements) ? person.achievements.join("\n") : "";
  wikiTitleInput.value = person.wikiTitle || "";
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
    const combined = `${person.id} ${person.name} ${person.category}`.toLowerCase();
    return combined.includes(query);
  });
}

function renderTable() {
  tableBody.innerHTML = "";
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
    row.innerHTML = `
      <td>${person.id}</td>
      <td>${person.name}</td>
      <td>${CATEGORIES[person.category] || person.category}</td>
      <td>${person.birthDate} - ${person.deathDate}</td>
      <td>
        <div class="table-actions">
          <button class="admin-btn secondary js-edit" type="button">Изменить</button>
          <button class="admin-btn js-delete" type="button">Удалить</button>
        </div>
      </td>
    `;

    row.querySelector(".js-edit").addEventListener("click", () => {
      fillForm(person);
      showMessage(`Открыто редактирование: ${person.name}`);
    });

    row.querySelector(".js-delete").addEventListener("click", async () => {
      if (!canMutate()) {
        showMessage("Для удаления нужен вход администратора.", "error");
        return;
      }
      const ok = confirm(`Удалить "${person.name}"?`);
      if (!ok) return;
      try {
        await service.deletePerson(person.id);
        await loadPeople();
        if (state.editingId === person.id) resetForm();
        showMessage(`Персона удалена: ${person.name}`);
      } catch (error) {
        showMessage(error.message || "Не удалось удалить персону.", "error");
      }
    });

    tableBody.append(row);
  });
}

function renderAuthState() {
  if (!service) {
    authStatus.textContent = "Ошибка: data-service.js не загружен.";
    loginForm.querySelectorAll("input, button").forEach((node) => {
      node.disabled = true;
    });
    saveButton.disabled = true;
    return;
  }

  const configured = service?.isSupabaseConfigured();
  if (!configured) {
    authStatus.textContent = "Supabase не настроен. Доступен только локальный режим.";
    loginForm.querySelectorAll("input, button").forEach((node) => {
      node.disabled = true;
    });
    saveButton.disabled = false;
    return;
  }

  loginForm.querySelectorAll("input, button").forEach((node) => {
    node.disabled = false;
  });

  if (state.session?.user?.email) {
    authStatus.textContent = `Вход выполнен: ${state.session.user.email}`;
    saveButton.disabled = false;
  } else {
    authStatus.textContent = "Не авторизован. Для записи в Supabase войдите в админку.";
    saveButton.disabled = true;
  }
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
  state.people = result.people.sort((a, b) => a.birthYear - b.birthYear);
  state.source = result.source;
  setStorageMode(state.source);
  renderTable();
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

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.querySelector("#login-email").value.trim();
    const password = document.querySelector("#login-password").value;
    if (!email || !password) {
      showMessage("Введите email и пароль.", "error");
      return;
    }
    try {
      await service.login(email, password);
      await refreshSession();
      showMessage("Вход выполнен.");
    } catch (error) {
      showMessage(error.message || "Ошибка входа.", "error");
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      await service.logout();
      await refreshSession();
      showMessage("Вы вышли из админки.");
    } catch (error) {
      showMessage(error.message || "Не удалось выйти.", "error");
    }
  });

  personForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!canMutate()) {
      showMessage("Для сохранения в Supabase требуется вход администратора.", "error");
      return;
    }

    try {
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
    }
  });
}

async function init() {
  if (!service) {
    renderAuthState();
    showMessage("Не удалось инициализировать слой данных.", "error");
    return;
  }

  fillCategorySelect();
  syncLivingFields();
  bindEvents();
  await refreshSession();
  await loadPeople();
  service.onAuthStateChange(async () => {
    await refreshSession();
  });
}

init();
