# 🚀 SCHNELLSTART: In 5 Minuten online spielen

## Was du brauchst
- **Node.js** → https://nodejs.org (LTS Version)
- **ngrok** → https://ngrok.com/download

## Einmalig einrichten (5 Min)

### 1. ngrok installieren

**Windows (eine Option wählen):**
```
winget install ngrok
```
ODER von https://ngrok.com/download die .exe herunterladen und in den monopoly-online Ordner legen.

**Mac:**
```
brew install ngrok
```

**Linux:**
```
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.tgz | sudo tar xvz -C /usr/local/bin
```

### 2. Gratis ngrok-Account erstellen

1. Öffne https://dashboard.ngrok.com/signup
2. Registriere dich (kostenlos, E-Mail reicht)
3. Gehe zu https://dashboard.ngrok.com/get-started/your-authtoken
4. Kopiere den Token und führe aus:

```
ngrok config add-authtoken 2abc123xyz_DEIN_TOKEN_HIER
```

Fertig! Das musst du nur **einmal** machen.

---

## Jedes Mal zum Spielen

### Windows:
Doppelklick auf `START-WINDOWS.bat`

### Mac/Linux:
```bash
cd monopoly-online
./start.sh
```

### Oder manuell:
```bash
# Terminal 1:
cd monopoly-online
node server.js

# Terminal 2:
ngrok http 3000
```

---

## Link an Freunde schicken

ngrok zeigt dir eine URL wie:
```
https://a1b2-203-0-113-42.ngrok-free.app
```

**Diese URL an deine Freunde schicken!** Die öffnen sie im Browser und können sofort mitspielen.

Beim ersten Öffnen zeigt ngrok eine "Visit Site"-Seite → einfach auf **"Visit Site"** klicken.

---

## Spielablauf

1. Alle öffnen die URL
2. Jeder gibt seinen Namen ein → **Beitreten**
3. Wenn alle da sind → **Spiel starten**
4. Spielen! 🎲

---

## Häufige Fragen

**"ngrok wird nicht gefunden"**
→ Stelle sicher dass ngrok im PATH ist, oder lege ngrok.exe direkt in den monopoly-online Ordner.

**"Meine Freunde sehen eine Fehlerseite"**
→ Sie müssen auf "Visit Site" klicken (ngrok Gratis-Zwischenseite).

**"Ich wurde getrennt"**
→ Einfach Seite neu laden. Der Server erkennt dich automatisch wieder.

**"Neue URL bei jedem Start?"**
→ Ja, bei ngrok gratis. Für eine feste URL brauchst du ngrok Pro (ab 8$/Monat) oder nutze stattdessen einen Cloud-Server (siehe ONLINE-GUIDE.md).

**"Wie viele können gleichzeitig spielen?"**
→ 2-4 Spieler pro Spiel. Zuschauer können auch zuschauen (sehen das Board).
