'use strict';

const editMode = location.pathname.endsWith('/admin.html');
const conf = window.BIERWELT_CONFIG || {};
const statusEl = document.getElementById('status');
const aliases = window.COUNTRY_ALIASES || {};

const normalize = x => String(x || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/ß/g, 'ss')
  .replace(/ø/g, 'o')
  .replace(/æ/g, 'ae')
  .trim()
  .replace(/\s+/g, ' ');

const lookup = Object.fromEntries(
  Object.entries(aliases).map(([n, c]) => [normalize(n), c])
);

const selected = new Set();
let features = [], geoLayer = null, map = null, db = null, ready = false;

function say(s) {
  if (statusEl) statusEl.textContent = s;
}

function name(f) {
  const p = f.properties || {};
  return p.ADMIN || p.name || p.NAME || 'Unbekannt';
}

function code(f) {
  const p = f.properties || {};
  const countryName = normalize(name(f));

  // Sonderfälle bei Ländernamen
  const specialCodes = {
    'france': 'FRA',
    'frankreich': 'FRA',
    'norway': 'NOR',
    'norwegen': 'NOR',
    'norge': 'NOR',
    'trinidad and tobago': 'TTO',
    'trinidad & tobago': 'TTO',
    'trinidad und tobago': 'TTO',
    'trinidad tobago': 'TTO'
  };

  if (specialCodes[countryName]) {
    return specialCodes[countryName];
  }

  // Bekannte Namen aus aliases.js berücksichtigen
  if (lookup[countryName]) {
    return lookup[countryName];
  }

  // Standard-Ländercodes aus den Kartendaten
  for (const k of [
    'ISO3166-1-Alpha-3',
    'ISO_A3',
    'iso_a3',
    'ADM0_A3',
    'GU_A3'
  ]) {
    const v = String(p[k] || '').toUpperCase();

    if (/^[A-Z]{3}$/.test(v) && v !== '---') {
      return v;
    }
  }

  return '';
}

function countryColor(c) {
  const n = Array.from(c).reduce(
    (a, x) => a * 27 + x.charCodeAt(0), 0
  );
  const hue = (n * 137.508) % 360;
  return `hsl(${hue.toFixed(2)}, 72%, 48%)`;
}

function style(f) {
  const c = code(f);
  return {
    color: '#5f6976',
    weight: 0.65,
    fillColor: selected.has(c) ? countryColor(c) : '#e5e9ed',
    fillOpacity: 0.91
  };
}

function render() {
  if (geoLayer) geoLayer.setStyle(style);

  const names = features
    .filter(f => selected.has(code(f)))
    .map(name)
    .sort((a, b) => a.localeCompare(b, 'de'));

  document.getElementById('selected').textContent =
    names.join(' · ') || 'Noch keine Länder';

  document.getElementById('count').textContent =
    String(selected.size);
}

function findCode(s) {
  const n = normalize(s);

  if (lookup[n]) return lookup[n];

  const specialCodes = {
    'france': 'FRA',
    'frankreich': 'FRA',
    'norway': 'NOR',
    'norwegen': 'NOR',
    'norge': 'NOR',
    'trinidad and tobago': 'TTO',
    'trinidad & tobago': 'TTO',
    'trinidad und tobago': 'TTO',
    'trinidad tobago': 'TTO'
  };

  if (specialCodes[n]) return specialCodes[n];

  const f = features.find(x =>
    normalize(name(x)) === n ||
    normalize(x.properties?.name) === n
  );

  return f ? code(f) : null;
}

async function loadMap() {
  map = L.map('map', {
    worldCopyJump: true,
    minZoom: 1,
    maxZoom: 7
  }).setView([19, 5], 2);

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }
  ).addTo(map);

  const r = await fetch(
    'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
  );

  if (!r.ok) {
    throw Error('Kartendaten konnten nicht geladen werden');
  }

  const data = await r.json();
  features = data.features || [];

  // Färöer ergänzen, falls sie nicht enthalten sind
  if (!features.some(f => code(f) === 'FRO')) {
    features.push({
      type: 'Feature',
      properties: {
        ADMIN: 'Färöer',
        ISO_A3: 'FRO'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-7.7, 62.1],
          [-7.35, 62.35],
          [-6.8, 62.4],
          [-6.45, 62.25],
          [-6.55, 61.95],
          [-6.95, 61.8],
          [-7.35, 61.85],
          [-7.7, 62.1]
        ]]
      }
    });
  }

  data.features = features;

  geoLayer = L.geoJSON(data, {
    style,
    onEachFeature: (f, l) => {
      l.bindTooltip(name(f));

      if (editMode) {
        l.on('click', () => {
          const c = code(f);
          if (!c) return;

          if (selected.has(c)) {
            selected.delete(c);
          } else {
            selected.add(c);
          }

          render();
          say('Noch nicht gespeichert.');
        });
      }
    }
  }).addTo(map);

  ready = true;
  render();
}

async function loadCountries() {
  const { data, error } = await db
    .from('map_state')
    .select('countries')
    .eq('id', 1)
    .single();

  if (error) throw error;

  selected.clear();

  for (const c of (data.countries || [])) {
    selected.add(c);
  }

  render();

  say(editMode
    ? 'Bereit. Du kannst Länder bearbeiten.'
    : 'Aktueller Stand geladen.'
  );
}

function configured() {
  return /^https:\/\/.+\.supabase\.co\/?$/.test(conf.url || '') &&
    conf.anonKey &&
    !conf.anonKey.startsWith('DEIN');
}

async function start() {
  if (!configured()) {
    say('Bitte zuerst Supabase in config.js einrichten.');
    return;
  }

  if (!window.supabase) {
    say('Supabase-Bibliothek konnte nicht geladen werden.');
    return;
  }

  db = window.supabase.createClient(conf.url, conf.anonKey);

  if (editMode) {
    const { data: { session } } = await db.auth.getSession();

    if (session) {
      showEditor();
    } else {
      setupLogin();
    }
  } else {
    try {
      await loadMap();
      await loadCountries();
    } catch (e) {
      say('Fehler beim Laden: ' + e.message);
    }
  }
}

function setupLogin() {
  document.getElementById('loginBtn').onclick = async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const target = document.getElementById('loginStatus');
    target.textContent = 'Anmeldung läuft …';

    const { error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      target.textContent =
        'Anmeldung fehlgeschlagen: ' + error.message;
      return;
    }

    showEditor();
  };
}

async function showEditor() {
  document.getElementById('login').classList.add('hidden');
  document.getElementById('editor').classList.remove('hidden');

  document.getElementById('logoutBtn').onclick = async () => {
    await db.auth.signOut();
    location.reload();
  };

  document.getElementById('addBtn').onclick = () => {
    if (!ready) return;

    const input = document.getElementById('countries');
    const missing = [];

    for (const n of input.value
      .split(/[,;\n]+/)
      .map(x => x.trim())
      .filter(Boolean)) {

      const c = findCode(n);

      if (c) {
        selected.add(c);
      } else {
        missing.push(n);
      }
    }

    input.value = '';
    render();

    say(missing.length
      ? 'Nicht erkannt: ' + missing.join(', ')
      : 'Länder hinzugefügt. Bitte speichern.'
    );
  };

  document.getElementById('countries').onkeydown = e => {
    if (e.key === 'Enter') {
      document.getElementById('addBtn').click();
    }
  };

  document.getElementById('clearBtn').onclick = () => {
    if (!confirm(
      'Wirklich alle Länder abwählen? Noch nicht gespeichert.'
    )) return;

    selected.clear();
    render();
    say('Alle abgewählt. Bitte speichern.');
  };

  document.getElementById('saveBtn').onclick = async () => {
    const b = document.getElementById('saveBtn');
    b.disabled = true;
    say('Speichere …');

    const { error } = await db
      .from('map_state')
      .update({
        countries: [...selected].sort(),
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);

    b.disabled = false;

    say(error
      ? 'Speichern fehlgeschlagen: ' + error.message
      : 'Gespeichert! Deine Freunde sehen die Änderung beim nächsten Öffnen oder Neuladen.'
    );
  };

  try {
    await loadMap();
    await loadCountries();
  } catch (e) {
    say('Fehler: ' + e.message);
  }
}

start();
