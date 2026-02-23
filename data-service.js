"use strict";

(function initTimelineDataService(global) {
  const STORAGE_KEY = "timeline_people_cache_v1";
  const PHOTO_OVERRIDES_STORAGE_KEY = "timeline_photo_overrides_v1";
  const DEFAULT_TABLE_NAME = "people";
  const CURRENT_YEAR = new Date().getFullYear();
  let cachedClient = null;
  let hasPhotoUrlColumn = null;

  function getConfig() {
    return global.SUPABASE_CONFIG || {};
  }

  function isSupabaseConfigured() {
    const config = getConfig();
    return Boolean(config.url && config.anonKey);
  }

  function getTableName() {
    const config = getConfig();
    return config.tableName || DEFAULT_TABLE_NAME;
  }

  function getSupabaseClient() {
    if (cachedClient) return cachedClient;
    if (!isSupabaseConfigured() || !global.supabase?.createClient) return null;
    const config = getConfig();
    cachedClient = global.supabase.createClient(config.url, config.anonKey);
    return cachedClient;
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

  function parseAchievements(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // keep plain-text split below
      }
      return trimmed
        .split(/\n|;/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  function parseNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function parsePhotoUrl(value) {
    const text = String(value || "").trim();
    return text || undefined;
  }

  function readPhotoOverrides() {
    try {
      const raw = global.localStorage.getItem(PHOTO_OVERRIDES_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      const next = {};
      Object.entries(parsed).forEach(([id, url]) => {
        const cleanId = String(id || "").trim();
        const cleanUrl = parsePhotoUrl(url);
        if (!cleanId || !cleanUrl) return;
        next[cleanId] = cleanUrl;
      });
      return next;
    } catch {
      return {};
    }
  }

  function writePhotoOverrides(overrides) {
    try {
      global.localStorage.setItem(PHOTO_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides || {}));
    } catch {
      // Ignore quota errors.
    }
  }

  function applyPhotoOverrides(people) {
    const overrides = readPhotoOverrides();
    if (!overrides || Object.keys(overrides).length === 0) return people;
    return people.map((person) => {
      const override = overrides[person.id];
      if (!override || person.photoUrl) return person;
      return { ...person, photoUrl: override };
    });
  }

  function syncPhotoOverride(person) {
    const id = String(person?.id || "").trim();
    if (!id) return;
    const overrides = readPhotoOverrides();
    if (person.photoUrl) {
      overrides[id] = person.photoUrl;
    } else {
      delete overrides[id];
    }
    writePhotoOverrides(overrides);
  }

  function removePhotoOverride(id) {
    const key = String(id || "").trim();
    if (!key) return;
    const overrides = readPhotoOverrides();
    if (!(key in overrides)) return;
    delete overrides[key];
    writePhotoOverrides(overrides);
  }

  function isMissingPhotoUrlColumnError(error) {
    const message = String(error?.message || "").toLowerCase();
    const details = String(error?.details || "").toLowerCase();
    const hint = String(error?.hint || "").toLowerCase();
    const text = `${message} ${details} ${hint}`;
    return text.includes("photo_url") && (text.includes("column") || text.includes("schema cache"));
  }

  function normalizePerson(rawInput) {
    const raw = rawInput || {};
    const initialId = String(raw.id || raw.slug || "").trim();
    const surnameBase = extractSurname(raw.name);
    const id = initialId || slugify(surnameBase || raw.name) || `person-${Date.now()}-${Math.round(Math.random() * 9999)}`;
    const birthYear = parseNumber(raw.birthYear ?? raw.birth_year, null);
    if (!Number.isFinite(birthYear)) return null;

    let deathYear = raw.deathYear ?? raw.death_year;
    let deathDate = String(raw.deathDate ?? raw.death_date ?? "").trim();
    const isLivingFlag = Boolean(raw.isLiving || raw.is_living || deathDate === "по н.в.");

    if (isLivingFlag) {
      deathYear = CURRENT_YEAR;
      deathDate = "по н.в.";
    } else {
      deathYear = parseNumber(deathYear, birthYear);
      if (!deathDate) deathDate = String(deathYear);
    }

    const birthDate = String(raw.birthDate ?? raw.birth_date ?? birthYear).trim();
    const achievements = parseAchievements(raw.achievements);

    return {
      id,
      name: String(raw.name || "").trim(),
      category: String(raw.category || "science").trim(),
      birthYear,
      deathYear,
      birthDate,
      deathDate,
      summary: String(raw.summary || "").trim(),
      achievements,
      wikiTitle: String(raw.wikiTitle || raw.wiki_title || "").trim() || undefined,
      photoUrl: parsePhotoUrl(raw.photoUrl ?? raw.photo_url ?? raw.portraitUrl ?? raw.portrait_url)
    };
  }

  function dbRowFromPerson(person) {
    const row = {
      slug: person.id,
      name: person.name,
      category: person.category,
      birth_year: person.birthYear,
      death_year: person.deathDate === "по н.в." ? null : person.deathYear,
      birth_date: person.birthDate,
      death_date: person.deathDate,
      summary: person.summary,
      achievements: person.achievements,
      wiki_title: person.wikiTitle || null,
      is_living: person.deathDate === "по н.в."
    };
    if (hasPhotoUrlColumn !== false) {
      row.photo_url = person.photoUrl || null;
    }
    return row;
  }

  function personFromDbRow(row) {
    return normalizePerson({
      id: row.slug || row.id,
      name: row.name,
      category: row.category,
      birth_year: row.birth_year,
      death_year: row.death_year,
      birth_date: row.birth_date,
      death_date: row.death_date,
      summary: row.summary,
      achievements: row.achievements,
      wiki_title: row.wiki_title,
      photo_url: row.photo_url,
      is_living: row.is_living
    });
  }

  function readLocalPeople() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizePerson).filter(Boolean);
    } catch {
      return [];
    }
  }

  function writeLocalPeople(people) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
    } catch {
      // Ignore quota errors.
    }
  }

  function ensureUniqueId(list, desired) {
    const used = new Set(list.map((item) => item.id));
    if (!used.has(desired)) return desired;
    let index = 2;
    while (used.has(`${desired}-${index}`)) {
      index += 1;
    }
    return `${desired}-${index}`;
  }

  async function ensureAdminSession(client) {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data?.session) throw new Error("Требуется вход администратора.");
    return data.session;
  }

  async function fetchPeople(seedPeople) {
    const seed = Array.isArray(seedPeople) ? seedPeople.map(normalizePerson).filter(Boolean) : [];
    const local = applyPhotoOverrides(readLocalPeople());
    let people = local.length ? local : applyPhotoOverrides(seed);
    let source = local.length ? "local" : "seed";
    const client = getSupabaseClient();

    if (!client) {
      writeLocalPeople(people);
      return { people, source, supabase: false };
    }

    try {
      const { data, error } = await client
        .from(getTableName())
        .select("*")
        .order("birth_year", { ascending: true });

      if (error) throw error;
      const fetchedRaw = Array.isArray(data) ? data.map(personFromDbRow).filter(Boolean) : [];
      const fetched = applyPhotoOverrides(fetchedRaw);
      if (fetched.length > 0) {
        people = fetched;
        source = "supabase";
      } else if (!people.length) {
        source = "supabase";
      }
      writeLocalPeople(people);
      return { people, source, supabase: true };
    } catch {
      writeLocalPeople(people);
      return { people, source, supabase: true };
    }
  }

  async function listPeople() {
    const result = await fetchPeople([]);
    return result.people;
  }

  async function createPerson(rawPerson) {
    const normalized = normalizePerson(rawPerson);
    if (!normalized || !normalized.name || !normalized.summary) {
      throw new Error("Заполните обязательные поля: имя, годы жизни и краткое описание.");
    }

    const client = getSupabaseClient();
    const local = applyPhotoOverrides(readLocalPeople());

    if (!client) {
      normalized.id = ensureUniqueId(local, normalized.id);
      const next = [...local, normalized].sort((a, b) => a.birthYear - b.birthYear);
      writeLocalPeople(next);
      syncPhotoOverride(normalized);
      return normalized;
    }

    await ensureAdminSession(client);
    let payload = dbRowFromPerson(normalized);
    let response = await client.from(getTableName()).insert(payload).select("*").single();
    if (response.error && isMissingPhotoUrlColumnError(response.error)) {
      hasPhotoUrlColumn = false;
      payload = dbRowFromPerson(normalized);
      response = await client.from(getTableName()).insert(payload).select("*").single();
    }
    if (response.error) throw response.error;
    if (hasPhotoUrlColumn !== false) hasPhotoUrlColumn = true;

    const saved = personFromDbRow(response.data);
    const finalSaved = saved.photoUrl ? saved : { ...saved, photoUrl: normalized.photoUrl };
    syncPhotoOverride(finalSaved);
    const merged = [...local.filter((item) => item.id !== finalSaved.id), finalSaved].sort((a, b) => a.birthYear - b.birthYear);
    writeLocalPeople(merged);
    return finalSaved;
  }

  async function updatePerson(originalId, rawPerson) {
    const normalized = normalizePerson(rawPerson);
    if (!normalized || !originalId) throw new Error("Не удалось обновить запись.");

    const client = getSupabaseClient();
    const local = applyPhotoOverrides(readLocalPeople());

    if (!client) {
      const next = local.map((item) => (item.id === originalId ? { ...normalized } : item));
      writeLocalPeople(next);
      syncPhotoOverride(normalized);
      return normalized;
    }

    await ensureAdminSession(client);
    let payload = dbRowFromPerson(normalized);
    let response = await client
      .from(getTableName())
      .update(payload)
      .eq("slug", originalId)
      .select("*")
      .single();
    if (response.error && isMissingPhotoUrlColumnError(response.error)) {
      hasPhotoUrlColumn = false;
      payload = dbRowFromPerson(normalized);
      response = await client
        .from(getTableName())
        .update(payload)
        .eq("slug", originalId)
        .select("*")
        .single();
    }
    if (response.error) throw response.error;
    if (hasPhotoUrlColumn !== false) hasPhotoUrlColumn = true;

    const saved = personFromDbRow(response.data);
    const finalSaved = saved.photoUrl ? saved : { ...saved, photoUrl: normalized.photoUrl };
    syncPhotoOverride(finalSaved);
    const merged = [...local.filter((item) => item.id !== originalId), finalSaved].sort((a, b) => a.birthYear - b.birthYear);
    writeLocalPeople(merged);
    return finalSaved;
  }

  async function deletePerson(id) {
    if (!id) throw new Error("Не указан id персоны.");
    const client = getSupabaseClient();
    const local = applyPhotoOverrides(readLocalPeople());

    if (!client) {
      writeLocalPeople(local.filter((person) => person.id !== id));
      removePhotoOverride(id);
      return;
    }

    await ensureAdminSession(client);
    const { error } = await client.from(getTableName()).delete().eq("slug", id);
    if (error) throw error;
    writeLocalPeople(local.filter((person) => person.id !== id));
    removePhotoOverride(id);
  }

  async function login(email, password) {
    const client = getSupabaseClient();
    if (!client) throw new Error("Supabase не настроен.");
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function logout() {
    const client = getSupabaseClient();
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  async function getSession() {
    const client = getSupabaseClient();
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data?.session || null;
  }

  function onAuthStateChange(callback) {
    const client = getSupabaseClient();
    if (!client) return { data: { subscription: { unsubscribe() {} } } };
    return client.auth.onAuthStateChange(callback);
  }

  global.TimelineDataService = {
    isSupabaseConfigured,
    getSupabaseClient,
    getTableName,
    fetchPeople,
    listPeople,
    createPerson,
    updatePerson,
    deletePerson,
    login,
    logout,
    getSession,
    onAuthStateChange
  };
})(window);
