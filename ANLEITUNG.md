# Meine Bierwelt – Einrichtung ohne Programmierkenntnisse

Du erhältst zwei Seiten:
- `index.html`: öffentliche Karte für deine Freunde (nur ansehen).
- `admin.html`: deine geschützte Bearbeitungsseite mit Login.

Änderungen werden in Supabase gespeichert. Freunde sehen sie beim nächsten Öffnen oder Aktualisieren des Links. Eine bereits geöffnete Seite aktualisiert sich nicht automatisch im Hintergrund.

## 1. Supabase einrichten
1. Kostenloses Konto bei https://supabase.com erstellen und ein Projekt anlegen.
2. In **Authentication → Users** einen eigenen Benutzer mit E-Mail und Passwort anlegen. E-Mail nach Möglichkeit bestätigen.
3. In **Authentication → Providers → Email** öffentliche Registrierungen deaktivieren, damit keine fremden Konten entstehen.
4. Im **SQL Editor** den Inhalt von `supabase.sql` einfügen. ZUVOR `DEINE_EMAIL@BEISPIEL.DE` durch genau die E-Mail aus Schritt 2 ersetzen. SQL ausführen.
5. Unter **Project Settings → API** (oder **Connect → API keys**) die **Project URL** und den **publishable / anon key** kopieren.
6. In `config.js` `DEINE_SUPABASE_URL` und `DEIN_SUPABASE_PUBLISHABLE_KEY` ersetzen. **Niemals service_role/secret key** in die Webseite kopieren.

## 2. Kostenlos veröffentlichen mit GitHub Pages
1. Auf https://github.com anmelden.
2. Neues **öffentliches Repository** erstellen, z. B. `meine-bierwelt`.
3. Alle Dateien aus diesem Ordner im Repository hochladen (auf oberster Ebene, nicht als ZIP).
4. In **Settings → Pages → Build and deployment** als Source **Deploy from a branch**, Branch **main**, Ordner **/(root)** wählen und speichern.
5. Nach kurzer Zeit wird die Adresse angezeigt: `https://DEIN-BENUTZERNAME.github.io/meine-bierwelt/`.
6. Diesen Link an deine Freunde schicken.

## 3. Länder bearbeiten
- Öffne `https://DEIN-BENUTZERNAME.github.io/meine-bierwelt/admin.html`.
- Melde dich mit deinem Supabase-Konto an.
- Länder eingeben oder auf die Karte klicken.
- **Änderungen speichern** drücken.
- Freunde sehen den neuen Stand beim nächsten Laden der öffentlichen Seite.

## Wichtig
- GitHub Pages ist öffentlich; jeder mit dem Link kann die Karte sehen.
- Nur dein freigegebenes Login darf die Länderliste ändern (Supabase Row Level Security).
- Die GeoJSON-Grenzen und Kartenkacheln werden online geladen; die Seite braucht Internet.
- Die Färöer werden separat behandelt. Wenn die GeoJSON-Quelle sie nicht enthält, erscheint ein vereinfachter Umriss.
- Die Farben sind stabil pro Ländercode. Sehr ähnliche Farbtöne sind möglich, aber Länder werden nicht alle orange dargestellt.
- Die Webseite zeigt eine Länderliste, keine privaten Daten oder Zugangsdaten.
- GitHub und Supabase haben kostenlose Angebote mit Nutzungsgrenzen.
