#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}  ============================================${NC}"
echo -e "${CYAN}    🎲 MONOPOLY ONLINE - Automatischer Start${NC}"
echo -e "${CYAN}  ============================================${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}  [FEHLER] Node.js ist nicht installiert!${NC}"
    echo "  Installiere es von: https://nodejs.org"
    echo "  Oder: brew install node (Mac) / sudo apt install nodejs (Linux)"
    exit 1
fi
echo -e "${GREEN}  [OK]${NC} Node.js $(node -v) gefunden"

# Check ngrok
if ! command -v ngrok &> /dev/null; then
    echo ""
    echo -e "${YELLOW}  ==============================================${NC}"
    echo -e "${YELLOW}   ngrok nicht gefunden! So installierst du es:${NC}"
    echo -e "${YELLOW}  ==============================================${NC}"
    echo ""
    echo "  Mac:   brew install ngrok"
    echo "  Linux: curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.tgz | sudo tar xvz -C /usr/local/bin"
    echo ""
    echo "  Dann:"
    echo "  1. Gratis-Account: https://dashboard.ngrok.com/signup"
    echo "  2. Auth-Token kopieren von:"
    echo "     https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "  3. Ausführen: ngrok config add-authtoken DEIN_TOKEN"
    echo "  4. Dieses Skript erneut starten!"
    echo ""
    exit 1
fi
echo -e "${GREEN}  [OK]${NC} ngrok gefunden"

# Start server in background
echo ""
echo "  [....] Starte Monopoly Server..."
cd "$(dirname "$0")"
node server.js &
SERVER_PID=$!
sleep 2

if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${GREEN}  [OK]${NC} Server läuft! (PID: $SERVER_PID)"
else
    echo -e "${RED}  [FEHLER] Server konnte nicht gestartet werden!${NC}"
    exit 1
fi

# Cleanup on exit
cleanup() {
    echo ""
    echo "  Beende Server..."
    kill $SERVER_PID 2>/dev/null
    echo "  Tschüss! 👋"
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start ngrok
echo ""
echo -e "${CYAN}  ============================================${NC}"
echo -e "${CYAN}   Gleich erscheint deine öffentliche URL!${NC}"
echo -e "${CYAN}   Schicke sie an deine Freunde.${NC}"
echo -e "${CYAN}  ============================================${NC}"
echo ""
echo "  Drücke Strg+C zum Beenden."
echo ""

ngrok http 3000

# When ngrok exits, clean up
cleanup
