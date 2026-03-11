# 🎲 Monopoly Online

Deutsches Monopoly für 2-4 Spieler im Browser – läuft über einen lokalen Server.

## Starten

```bash
cd monopoly-online
node server.js
```

Dann im Browser öffnen: **http://localhost:3000**

## Andere Spieler einladen

Spieler im **gleichen WLAN/Netzwerk** können über deine lokale IP beitreten:

1. Finde deine IP:
   - **Windows:** `ipconfig` → IPv4-Adresse (z.B. `192.168.1.42`)
   - **Mac/Linux:** `ifconfig` oder `ip addr` → z.B. `192.168.1.42`
2. Andere öffnen: `http://192.168.1.42:3000`

## Spielablauf

1. Jeder Spieler öffnet die URL und gibt einen Namen ein → **Beitreten**
2. Wenn 2-4 Spieler in der Lobby sind → **Spiel starten**
3. Nur der aktive Spieler sieht Aktions-Buttons (Würfeln, Kaufen, Bauen, Handeln)
4. Handelsangebote werden in Echtzeit an den Partner geschickt
5. Der Partner kann **Annehmen**, **Ablehnen** oder ein **Gegenangebot** machen

## Features

- Komplettes deutsches Monopoly-Spielfeld
- Würfeln mit Pasch-Regel (3x = Gefängnis)
- Grundstücke kaufen, Häuser & Hotels bauen
- Ereignis- & Gemeinschaftskarten
- Frei-Parken-Topf (Hausregel)
- Handel mit Angebot/Gegenangebot-System
- Responsive Skalierung (Vollbild-fähig)
- 0 externe Abhängigkeiten (reines Node.js)

## Voraussetzungen

- Node.js (v16+)
- Kein `npm install` nötig!
