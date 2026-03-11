# 🌍 Monopoly Online – Weltweit spielen

Zwei Wege, damit Freunde von überall mitmachen können.

---

## 🚀 Option 1: ngrok (Schnell & Einfach)

> Dein PC ist der Server. ngrok erstellt einen Tunnel ins Internet.
> **Perfekt für:** Schnelle Spielrunden, kein Account nötig für Mitspieler.

### Schritt 1: ngrok installieren

**Windows:**
```bash
# Mit winget (Windows 10+):
winget install ngrok

# ODER: https://ngrok.com/download herunterladen und entpacken
```

**Mac:**
```bash
brew install ngrok
```

**Linux:**
```bash
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.tgz | sudo tar xvz -C /usr/local/bin
```

### Schritt 2: Gratis-Account erstellen (einmalig)

1. Gehe zu https://dashboard.ngrok.com/signup (gratis)
2. Kopiere deinen Auth-Token von https://dashboard.ngrok.com/get-started/your-authtoken
3. Führe einmalig aus:
```bash
ngrok config add-authtoken DEIN_TOKEN_HIER
```

### Schritt 3: Starten

```bash
# Terminal 1: Server starten
cd monopoly-online
node server.js

# Terminal 2: Tunnel öffnen
ngrok http 3000
```

ngrok zeigt dir dann sowas:
```
Forwarding   https://a1b2c3d4.ngrok-free.app -> http://localhost:3000
```

### Schritt 4: Link teilen

Schicke deinen Freunden die `https://xxxxx.ngrok-free.app` URL.
Fertig! Die öffnen den Link und können sofort mitspielen.

### Vorteile
- ✅ In 2 Minuten online
- ✅ Kein Deployment, kein Git nötig
- ✅ HTTPS automatisch dabei
- ✅ Kostenlos für gelegentliches Spielen

### Nachteile
- ❌ Dein PC muss an sein und der Server laufen
- ❌ URL ändert sich bei jedem Neustart (kostenlos)
- ❌ Gratis-Version zeigt eine "Visit Site"-Zwischenseite
- ❌ Latenz kann höher sein (Daten gehen über ngrok-Server)

---

## ☁️ Option 2: Cloud-Deployment (Dauerhaft Online)

> Das Spiel läuft auf einem Server im Internet. Immer erreichbar.
> **Perfekt für:** Regelmäßiges Spielen, feste URL.

Ich erkläre 3 Anbieter (alle haben Gratis-Tiers):

---

### Option 2a: Render.com (Empfohlen für Einsteiger)

#### Schritt 1: Vorbereitung

Erstelle eine `package.json` im `monopoly-online` Ordner:
```json
{
  "name": "monopoly-online",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=18"
  }
}
```

#### Schritt 2: Auf GitHub hochladen

```bash
cd monopoly-online
git init
git add .
git commit -m "Monopoly Online"
# Erstelle ein neues Repo auf github.com, dann:
git remote add origin https://github.com/DEIN-NAME/monopoly-online.git
git push -u origin main
```

#### Schritt 3: Auf Render deployen

1. Gehe zu https://render.com und erstelle einen Gratis-Account
2. Klicke **"New" → "Web Service"**
3. Verbinde dein GitHub-Repo
4. Einstellungen:
   - **Name:** monopoly-online
   - **Runtime:** Node
   - **Build Command:** (leer lassen)
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
5. Klicke **"Deploy"**

Du bekommst eine URL wie: `https://monopoly-online.onrender.com`

#### Wichtig für Render:
Der Server muss den PORT aus der Umgebungsvariable lesen.
Das tut er bereits! (`process.env.PORT || 3000`)

#### Vorteile
- ✅ Immer online (du musst keinen PC laufen lassen)
- ✅ Feste URL
- ✅ HTTPS inklusive
- ✅ Auto-Deploy bei Git Push

#### Nachteile
- ❌ Gratis-Tier schläft nach 15 Min Inaktivität (Cold Start ~30 Sek)
- ❌ Braucht GitHub-Account
- ❌ Bei sehr vielen Spielern könnte die Leistung nicht reichen

---

### Option 2b: Railway.app

#### Schritt 1: Gleiche Vorbereitung wie Render (package.json + GitHub)

#### Schritt 2: Deployen

1. Gehe zu https://railway.app und logge dich mit GitHub ein
2. Klicke **"New Project" → "Deploy from GitHub repo"**
3. Wähle dein Repo
4. Railway erkennt automatisch Node.js
5. Gehe zu **Settings → Networking → Generate Domain**

Du bekommst: `https://monopoly-online-production.up.railway.app`

#### Vorteile
- ✅ Noch einfacher als Render (fast 0 Konfiguration)
- ✅ Kein Cold Start (schläft nicht ein)
- ✅ 5$/Monat Gratis-Guthaben

#### Nachteile
- ❌ 5$ Gratis-Guthaben pro Monat (reicht locker für Monopoly)
- ❌ Braucht Kreditkarte zur Verifikation

---

### Option 2c: Fly.io

#### Schritt 1: Fly CLI installieren

**Windows:**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**Mac/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

#### Schritt 2: Account & Deploy

```bash
cd monopoly-online

# Einmalig: Account erstellen
fly auth signup

# App erstellen
fly launch
# Wähle: Region nahe bei dir, Free tier

# Deployen
fly deploy
```

Du bekommst: `https://monopoly-online.fly.dev`

#### Vorteile
- ✅ Sehr schnell (Server weltweit verteilt)
- ✅ 3 kostenlose VMs
- ✅ WebSocket-Support out of the box

#### Nachteile
- ❌ CLI-basiert (etwas technischer)
- ❌ Braucht Kreditkarte zur Verifikation

---

## 📊 Vergleich

| Feature              | ngrok           | Render          | Railway         | Fly.io          |
|----------------------|-----------------|-----------------|-----------------|-----------------|
| **Aufwand**          | 2 Min           | 10 Min          | 5 Min           | 10 Min          |
| **Kosten**           | Gratis          | Gratis          | 5$/Mo Guthaben  | Gratis          |
| **PC muss an sein?** | Ja              | Nein            | Nein            | Nein            |
| **Feste URL?**       | Nein (wechselt) | Ja              | Ja              | Ja              |
| **Cold Start?**      | Nein            | Ja (30 Sek)     | Nein            | Nein            |
| **Git nötig?**       | Nein            | Ja              | Ja              | Ja              |
| **Kreditkarte?**     | Nein            | Nein            | Ja              | Ja              |
| **Am besten für**    | Schnell testen  | Einsteiger      | Keine Ausfälle  | Performance     |

---

## 💡 Meine Empfehlung

- **Nur mal schnell mit Freunden spielen?** → ngrok
- **Regelmäßig spielen, einfach einrichten?** → Render.com
- **Maximale Verfügbarkeit?** → Railway oder Fly.io
