"use strict";

(function initTimelineDataService(global) {
  const STORAGE_KEY = "timeline_people_cache_v1";
  const DEFAULT_TABLE_NAME = "people";
  const CURRENT_YEAR = new Date().getFullYear();
  let cachedClient = null;

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
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
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

  function normalizePerson(rawInput) {
    const raw = rawInput || {};
    const initialId = String(raw.id || raw.slug || "").trim();
    const id = initialId || slugify(raw.name) || `person-${Date.now()}-${Math.round(Math.random() * 9999)}`;
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
      wikiTitle: String(raw.wikiTitle || raw.wiki_title || "").trim() || undefined
    };
  }

  function dbRowFromPerson(person) {
    return {
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
    const local = readLocalPeople();
    let people = local.length ? local : seed;
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
      const fetched = Array.isArray(data) ? data.map(personFromDbRow).filter(Boolean) : [];
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
    const local = readLocalPeople();

    if (!client) {
      normalized.id = ensureUniqueId(local, normalized.id);
      const next = [...local, normalized].sort((a, b) => a.birthYear - b.birthYear);
      writeLocalPeople(next);
      return normalized;
    }

    await ensureAdminSession(client);
    const payload = dbRowFromPerson(normalized);
    const { data, error } = await client.from(getTableName()).insert(payload).select("*").single();
    if (error) throw error;

    const saved = personFromDbRow(data);
    const merged = [...local.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.birthYear - b.birthYear);
    writeLocalPeople(merged);
    return saved;
  }

  async function updatePerson(originalId, rawPerson) {
    const normalized = normalizePerson(rawPerson);
    if (!normalized || !originalId) throw new Error("Не удалось обновить запись.");

    const client = getSupabaseClient();
    const local = readLocalPeople();

    if (!client) {
      const next = local.map((item) => (item.id === originalId ? { ...normalized } : item));
      writeLocalPeople(next);
      return normalized;
    }

    await ensureAdminSession(client);
    const payload = dbRowFromPerson(normalized);
    const { data, error } = await client
      .from(getTableName())
      .update(payload)
      .eq("slug", originalId)
      .select("*")
      .single();
    if (error) throw error;

    const saved = personFromDbRow(data);
    const merged = [...local.filter((item) => item.id !== originalId), saved].sort((a, b) => a.birthYear - b.birthYear);
    writeLocalPeople(merged);
    return saved;
  }

  async function deletePerson(id) {
    if (!id) throw new Error("Не указан id персоны.");
    const client = getSupabaseClient();
    const local = readLocalPeople();

    if (!client) {
      writeLocalPeople(local.filter((person) => person.id !== id));
      return;
    }

    await ensureAdminSession(client);
    const { error } = await client.from(getTableName()).delete().eq("slug", id);
    if (error) throw error;
    writeLocalPeople(local.filter((person) => person.id !== id));
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
