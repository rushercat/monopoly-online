// ═══════════════════════════════════════════════════
//  MONOPOLY ONLINE – Node.js + ws Library
// ═══════════════════════════════════════════════════
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;

// ── MIME types ──
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.ico': 'image/x-icon',
};

// ── HTTP Server ──
const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
    res.end(data);
  });
});

// ── WebSocket Server (ws library) ──
const wss = new WebSocketServer({ server });
const clients = new Map();
const playerTokens = new Map();

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const [ws] of clients) {
    try { if (ws.readyState === 1) ws.send(msg); } catch {}
  }
}

function sendTo(ws, data) {
  try { if (ws.readyState === 1) ws.send(JSON.stringify(data)); } catch {}
}

// ── GAME STATE ──
const SPACES = [
  { id: 0, name: 'LOS', type: 'go' },
  { id: 1, name: 'Badstraße', type: 'property', group: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50 },
  { id: 2, name: 'Gemeinschaftsfeld', type: 'community' },
  { id: 3, name: 'Turmstraße', type: 'property', group: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50 },
  { id: 4, name: 'Einkommensteuer', type: 'tax', amount: 200 },
  { id: 5, name: 'Südbahnhof', type: 'railroad', price: 200 },
  { id: 6, name: 'Chausseestraße', type: 'property', group: 'lblue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50 },
  { id: 7, name: 'Ereignisfeld', type: 'chance' },
  { id: 8, name: 'Elisenstraße', type: 'property', group: 'lblue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50 },
  { id: 9, name: 'Poststraße', type: 'property', group: 'lblue', price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50 },
  { id: 10, name: 'Gefängnis', type: 'jail' },
  { id: 11, name: 'Seestraße', type: 'property', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100 },
  { id: 12, name: 'Elektrizitätswerk', type: 'utility', price: 150 },
  { id: 13, name: 'Hafenstraße', type: 'property', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100 },
  { id: 14, name: 'Neue Straße', type: 'property', group: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100 },
  { id: 15, name: 'Westbahnhof', type: 'railroad', price: 200 },
  { id: 16, name: 'Münchner Straße', type: 'property', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100 },
  { id: 17, name: 'Gemeinschaftsfeld', type: 'community' },
  { id: 18, name: 'Wiener Straße', type: 'property', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100 },
  { id: 19, name: 'Berliner Straße', type: 'property', group: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100 },
  { id: 20, name: 'Frei Parken', type: 'free' },
  { id: 21, name: 'Theaterstraße', type: 'property', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150 },
  { id: 22, name: 'Ereignisfeld', type: 'chance' },
  { id: 23, name: 'Museumsstraße', type: 'property', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150 },
  { id: 24, name: 'Opernplatz', type: 'property', group: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150 },
  { id: 25, name: 'Nordbahnhof', type: 'railroad', price: 200 },
  { id: 26, name: 'Lessingstraße', type: 'property', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150 },
  { id: 27, name: 'Schillerstraße', type: 'property', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150 },
  { id: 28, name: 'Wasserwerk', type: 'utility', price: 150 },
  { id: 29, name: 'Goethestraße', type: 'property', group: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150 },
  { id: 30, name: 'Gehe ins Gefängnis', type: 'gotojail' },
  { id: 31, name: 'Rathausplatz', type: 'property', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200 },
  { id: 32, name: 'Hauptstraße', type: 'property', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200 },
  { id: 33, name: 'Gemeinschaftsfeld', type: 'community' },
  { id: 34, name: 'Bahnhofstraße', type: 'property', group: 'green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200 },
  { id: 35, name: 'Hauptbahnhof', type: 'railroad', price: 200 },
  { id: 36, name: 'Ereignisfeld', type: 'chance' },
  { id: 37, name: 'Parkstraße', type: 'property', group: 'dblue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200 },
  { id: 38, name: 'Zusatzsteuer', type: 'tax', amount: 100 },
  { id: 39, name: 'Schlossallee', type: 'property', group: 'dblue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200 },
];

const GROUP_MEMBERS = {};
SPACES.forEach(s => { if (s.group) { if (!GROUP_MEMBERS[s.group]) GROUP_MEMBERS[s.group] = []; GROUP_MEMBERS[s.group].push(s.id); } });

const CHANCE_CARDS = [
  { text: 'Rücke vor bis auf LOS.', action: 'moveto', dest: 0 },
  { text: 'Gehe in das Gefängnis.', action: 'jail' },
  { text: 'Gehe zurück auf die Badstraße.', action: 'moveto', dest: 1 },
  { text: 'Rücke vor bis zur Schlossallee.', action: 'moveto', dest: 39 },
  { text: 'Rücke vor zum Südbahnhof.', action: 'moveto', dest: 5 },
  { text: 'Die Bank zahlt dir 50€ Dividende.', action: 'gain', amount: 50 },
  { text: 'Du erhältst 150€.', action: 'gain', amount: 150 },
  { text: 'Zahle 15€ Strafe.', action: 'pay', amount: 15 },
  { text: 'Straßenreparatur: 40€/Haus, 115€/Hotel.', action: 'repair', house: 40, hotel: 115 },
  { text: 'Vorsitzender gewählt – zahle jedem 50€.', action: 'payall', amount: 50 },
  { text: 'Rücke vor zum Opernplatz.', action: 'moveto', dest: 24 },
  { text: 'Gehe zum Westbahnhof.', action: 'moveto', dest: 15 },
  { text: 'Rücke vor zur Theaterstraße.', action: 'moveto', dest: 21 },
  { text: 'Gefängnis-Freikarte!', action: 'jailcard' },
  { text: 'Gehe 3 Felder zurück.', action: 'back3' },
];
const COMMUNITY_CARDS = [
  { text: 'Rücke vor bis auf LOS.', action: 'moveto', dest: 0 },
  { text: 'Gehe in das Gefängnis.', action: 'jail' },
  { text: 'Bankfehler zu deinen Gunsten – 200€.', action: 'gain', amount: 200 },
  { text: 'Arztrechnung – zahle 50€.', action: 'pay', amount: 50 },
  { text: 'Du erbst 100€.', action: 'gain', amount: 100 },
  { text: 'Schönheitswettbewerb – 10€.', action: 'gain', amount: 10 },
  { text: 'Steuerrückzahlung – 20€.', action: 'gain', amount: 20 },
  { text: 'Krankenhausgebühren – 100€.', action: 'pay', amount: 100 },
  { text: 'Beratungshonorar – 25€.', action: 'gain', amount: 25 },
  { text: 'Straßenreparatur: 45€/Haus, 115€/Hotel.', action: 'repair', house: 45, hotel: 115 },
  { text: 'Gefängnis-Freikarte!', action: 'jailcard' },
  { text: 'Lebensversicherung – 100€.', action: 'gain', amount: 100 },
  { text: 'Schulgeld – 150€.', action: 'pay', amount: 150 },
  { text: 'Geburtstag – jeder zahlt dir 10€.', action: 'collectall', amount: 10 },
];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

let game = null;
function createGame() {
  game = {
    phase: 'lobby', players: [], currentPlayer: 0,
    turnPhase: 'roll', doublesCount: 0, lastDice: [1, 1],
    properties: {}, freeParkingPot: 0, log: [],
    chanceDeck: shuffle([...CHANCE_CARDS]),
    communityDeck: shuffle([...COMMUNITY_CARDS]),
    pendingOffer: null,
    initRolls: {},   // playerIdx -> { d1, d2, total }
    turnOrder: [],    // sorted player indices after init roll
  };
}
createGame();

function addLog(msg) { game.log.push(msg); if (game.log.length > 100) game.log.shift(); }

function getState(forPlayerIdx) {
  return {
    phase: game.phase,
    players: game.players.map(p => ({
      name: p.name, color: p.color, money: p.money,
      pos: p.pos, bankrupt: p.bankrupt, inJail: p.inJail,
      jailTurns: p.jailTurns, jailFreeCards: p.jailFreeCards, connected: p.connected,
    })),
    currentPlayer: game.currentPlayer, turnPhase: game.turnPhase,
    doublesCount: game.doublesCount, lastDice: game.lastDice,
    properties: game.properties, freeParkingPot: game.freeParkingPot,
    log: game.log, you: forPlayerIdx, pendingOffer: game.pendingOffer,
    initRolls: game.initRolls, turnOrder: game.turnOrder,
  };
}

function broadcastState() {
  for (const [ws, info] of clients) {
    sendTo(ws, { type: 'state', state: getState(info.playerIdx) });
  }
}

// ── GAME LOGIC ──
const PLAYER_COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835'];

function calcRent(spaceId) {
  const sp = SPACES[spaceId]; const prop = game.properties[spaceId];
  if (!prop) return 0; const owner = prop.owner;
  if (sp.type === 'railroad') {
    const c = [5, 15, 25, 35].filter(id => game.properties[id] && game.properties[id].owner === owner).length;
    return [25, 50, 100, 200][c - 1] || 25;
  }
  if (sp.type === 'utility') {
    const c = [12, 28].filter(id => game.properties[id] && game.properties[id].owner === owner).length;
    return c === 2 ? (game.lastDice[0] + game.lastDice[1]) * 10 : (game.lastDice[0] + game.lastDice[1]) * 4;
  }
  if (sp.type === 'property') {
    if (prop.houses > 0) return sp.rent[prop.houses];
    const g = GROUP_MEMBERS[sp.group];
    return (g && g.every(id => game.properties[id] && game.properties[id].owner === owner)) ? sp.rent[0] * 2 : sp.rent[0];
  }
  return 0;
}

function checkBankrupt(pl, idx) {
  if (pl.money < 0) {
    pl.bankrupt = true; addLog(`💀 ${pl.name} ist bankrott!`);
    Object.keys(game.properties).forEach(sid => { if (game.properties[sid].owner === idx) delete game.properties[sid]; });
    const alive = game.players.filter(p => !p.bankrupt);
    if (alive.length <= 1) { game.phase = 'gameover'; if (alive.length === 1) addLog(`🏆 ${alive[0].name} gewinnt!`); }
  }
}

function goToJail(pl) { pl.pos = 10; pl.inJail = true; pl.jailTurns = 0; addLog(`🔒 ${pl.name} geht ins Gefängnis!`); }

function executeCard(pl, idx, card) {
  addLog(`📋 Karte: ${card.text}`);
  switch (card.action) {
    case 'moveto': movePlayerTo(pl, idx, card.dest, true); return;
    case 'jail': goToJail(pl); break;
    case 'gain': pl.money += card.amount; addLog(`💰 ${pl.name} erhält ${card.amount}€.`); break;
    case 'pay': pl.money -= card.amount; game.freeParkingPot += card.amount; addLog(`💸 ${pl.name} zahlt ${card.amount}€ → Topf.`); checkBankrupt(pl, idx); break;
    case 'repair': {
      let cost = 0;
      Object.values(game.properties).forEach(prop => { if (prop.owner === idx) cost += prop.houses === 5 ? card.hotel : prop.houses * card.house; });
      pl.money -= cost; game.freeParkingPot += cost; addLog(`🔧 ${pl.name} zahlt ${cost}€ → Topf.`); checkBankrupt(pl, idx); break;
    }
    case 'payall': {
      let t = 0; game.players.forEach((o, oi) => { if (oi !== idx && !o.bankrupt) { t += card.amount; o.money += card.amount; } });
      pl.money -= t; checkBankrupt(pl, idx); break;
    }
    case 'collectall': game.players.forEach((o, oi) => { if (oi !== idx && !o.bankrupt) { o.money -= card.amount; pl.money += card.amount; } }); break;
    case 'jailcard': pl.jailFreeCards++; addLog(`🎫 ${pl.name} hat eine Gefängnis-Freikarte!`); break;
    case 'back3': pl.pos = (pl.pos - 3 + 40) % 40; landOn(pl, idx); return;
  }
}

function landOn(pl, idx) {
  const sp = SPACES[pl.pos]; addLog(`📍 ${pl.name} landet auf ${sp.name}.`);
  switch (sp.type) {
    case 'property': case 'railroad': case 'utility':
      if (game.properties[pl.pos] && game.properties[pl.pos].owner !== idx) {
        const owner = game.players[game.properties[pl.pos].owner];
        if (!owner.bankrupt) { const r = calcRent(pl.pos); addLog(`💸 ${pl.name} zahlt ${r}€ Miete an ${owner.name}.`); pl.money -= r; owner.money += r; checkBankrupt(pl, idx); }
      } break;
    case 'tax': addLog(`💸 ${pl.name} zahlt ${sp.amount}€ Steuer → Topf.`); pl.money -= sp.amount; game.freeParkingPot += sp.amount; checkBankrupt(pl, idx); break;
    case 'gotojail': goToJail(pl); break;
    case 'chance': { if (game.chanceDeck.length === 0) game.chanceDeck = shuffle([...CHANCE_CARDS]); executeCard(pl, idx, game.chanceDeck.pop()); return; }
    case 'community': { if (game.communityDeck.length === 0) game.communityDeck = shuffle([...COMMUNITY_CARDS]); executeCard(pl, idx, game.communityDeck.pop()); return; }
    case 'free': if (game.freeParkingPot > 0) { addLog(`🎉 ${pl.name} kassiert ${game.freeParkingPot}€ vom Topf!`); pl.money += game.freeParkingPot; game.freeParkingPot = 0; } break;
  }
}

function movePlayer(pl, idx, steps) {
  const oldPos = pl.pos; const newPos = (pl.pos + steps) % 40;
  if (newPos < oldPos || (oldPos !== 0 && newPos === 0)) { pl.money += 200; addLog(`${pl.name} → LOS +200€.`); }
  pl.pos = newPos; game.turnPhase = 'postroll'; landOn(pl, idx);
}

function movePlayerTo(pl, idx, dest, collectGo) {
  if (collectGo && dest < pl.pos) { pl.money += 200; addLog(`${pl.name} → LOS +200€.`); }
  pl.pos = dest; landOn(pl, idx);
}

// ── ACTION HANDLERS ──
function handleAction(playerIdx, action) {
  if (game.phase !== 'playing') return;
  const pl = game.players[playerIdx]; if (!pl || pl.bankrupt) return;

  switch (action.type) {
    case 'roll': {
      if (game.currentPlayer !== playerIdx || game.turnPhase !== 'roll') return;
      const d1 = Math.floor(Math.random() * 6) + 1, d2 = Math.floor(Math.random() * 6) + 1;
      game.lastDice = [d1, d2]; const total = d1 + d2, isDouble = d1 === d2;
      addLog(`🎲 ${pl.name} würfelt ${d1}+${d2}=${total}${isDouble ? ' (Pasch!)' : ''}`);
      if (pl.inJail) {
        if (isDouble) { pl.inJail = false; pl.jailTurns = 0; addLog(`${pl.name} ist frei (Pasch)!`); movePlayer(pl, playerIdx, total); }
        else { pl.jailTurns++; if (pl.jailTurns >= 3) { pl.inJail = false; pl.jailTurns = 0; pl.money -= 50; addLog(`${pl.name} zahlt 50€ → frei.`); movePlayer(pl, playerIdx, total); } else { addLog(`${pl.name} bleibt im Gefängnis (${pl.jailTurns}/3).`); game.turnPhase = 'postroll'; game.doublesCount = 0; } }
      } else {
        if (isDouble) { game.doublesCount++; if (game.doublesCount >= 3) { addLog(`3x Pasch → Gefängnis!`); goToJail(pl); game.turnPhase = 'postroll'; game.doublesCount = 0; break; } } else { game.doublesCount = 0; }
        movePlayer(pl, playerIdx, total);
      } break;
    }
    case 'buy': {
      if (game.currentPlayer !== playerIdx || game.turnPhase !== 'postroll') return;
      const sp = SPACES[pl.pos]; if (!['property', 'railroad', 'utility'].includes(sp.type) || game.properties[pl.pos] || pl.money < sp.price) return;
      pl.money -= sp.price; game.properties[pl.pos] = { owner: playerIdx, houses: 0 }; addLog(`🏠 ${pl.name} kauft ${sp.name} für ${sp.price}€.`); break;
    }
    case 'build': {
      if (game.currentPlayer !== playerIdx || game.turnPhase !== 'postroll') return;
      const sid = action.spaceId, sp = SPACES[sid]; if (!sp || sp.type !== 'property') return;
      const prop = game.properties[sid]; if (!prop || prop.owner !== playerIdx) return;
      const g = GROUP_MEMBERS[sp.group]; if (!g || !g.every(id => game.properties[id] && game.properties[id].owner === playerIdx)) return;
      if (prop.houses >= 5 || pl.money < sp.houseCost) return;
      const minH = Math.min(...g.map(id => game.properties[id]?.houses || 0)); if (prop.houses > minH) return;
      pl.money -= sp.houseCost; prop.houses++; addLog(`🏗️ ${pl.name} baut auf ${sp.name} (${prop.houses === 5 ? 'Hotel' : prop.houses + ' Häuser'}).`); break;
    }
    case 'payjail': {
      if (game.currentPlayer !== playerIdx || !pl.inJail || pl.money < 50) return;
      pl.money -= 50; pl.inJail = false; pl.jailTurns = 0; addLog(`${pl.name} zahlt 50€ → frei.`); game.turnPhase = 'roll'; break;
    }
    case 'usejailcard': {
      if (game.currentPlayer !== playerIdx || !pl.inJail || pl.jailFreeCards <= 0) return;
      pl.jailFreeCards--; pl.inJail = false; pl.jailTurns = 0; addLog(`🎫 ${pl.name} nutzt Freikarte.`); game.turnPhase = 'roll'; break;
    }
    case 'endturn': {
      if (game.currentPlayer !== playerIdx || game.turnPhase !== 'postroll') return;
      const isDouble = game.lastDice[0] === game.lastDice[1];
      if (isDouble && game.doublesCount > 0 && game.doublesCount < 3 && !pl.inJail) { game.turnPhase = 'roll'; addLog(`🎲 ${pl.name} darf nochmal (Pasch).`); }
      else {
        game.doublesCount = 0;
        do { game.currentPlayer = (game.currentPlayer + 1) % game.players.length; } while (game.players[game.currentPlayer].bankrupt && game.players.filter(p => !p.bankrupt).length > 1);
        game.turnPhase = 'roll'; addLog(`── ${game.players[game.currentPlayer].name} ist am Zug ──`);
      } break;
    }
    case 'trade_offer': {
      const { to, offerMoney, requestMoney, offerProps, requestProps } = action;
      if (to < 0 || to >= game.players.length || to === playerIdx || game.players[to].bankrupt) return;
      if (offerMoney > pl.money || requestMoney > game.players[to].money) return;
      game.pendingOffer = { from: playerIdx, to, offerMoney, requestMoney, offerProps: offerProps || [], requestProps: requestProps || [], round: (game.pendingOffer?.round || 0) + 1 };
      addLog(`📨 ${pl.name} sendet Angebot an ${game.players[to].name}.`); break;
    }
    case 'trade_accept': {
      const o = game.pendingOffer; if (!o || o.to !== playerIdx) return;
      const sender = game.players[o.from], receiver = game.players[o.to];
      if (o.offerMoney > 0) { sender.money -= o.offerMoney; receiver.money += o.offerMoney; }
      if (o.requestMoney > 0) { receiver.money -= o.requestMoney; sender.money += o.requestMoney; }
      o.offerProps.forEach(sid => { if (game.properties[sid]) game.properties[sid].owner = o.to; });
      o.requestProps.forEach(sid => { if (game.properties[sid]) game.properties[sid].owner = o.from; });
      addLog(`🤝 Handel: ${sender.name} ⇄ ${receiver.name}`); game.pendingOffer = null; break;
    }
    case 'trade_reject': {
      const o = game.pendingOffer; if (!o || o.to !== playerIdx) return;
      addLog(`❌ ${pl.name} lehnt ab.`); game.pendingOffer = null; break;
    }
    case 'trade_counter': {
      const o = game.pendingOffer; if (!o || o.to !== playerIdx) return;
      const { offerMoney, requestMoney, offerProps, requestProps } = action;
      if (offerMoney > pl.money || requestMoney > game.players[o.from].money) return;
      game.pendingOffer = { from: playerIdx, to: o.from, offerMoney, requestMoney, offerProps: offerProps || [], requestProps: requestProps || [], round: o.round + 1 };
      addLog(`✏️ ${pl.name} sendet Gegenangebot.`); break;
    }
    case 'trade_cancel': {
      if (game.pendingOffer && (game.pendingOffer.from === playerIdx || game.pendingOffer.to === playerIdx)) {
        addLog(`❌ ${pl.name} bricht Handel ab.`); game.pendingOffer = null;
      } break;
    }
  }
  broadcastState();
}

// ── WEBSOCKET CONNECTION HANDLING ──
wss.on('connection', (ws) => {
  const clientId = crypto.randomUUID();
  clients.set(ws, { id: clientId, playerIdx: -1 });
  console.log(`[+] Client connected (${clientId}). Total: ${clients.size}`);

  sendTo(ws, { type: 'welcome', id: clientId, spaces: SPACES, groupMembers: GROUP_MEMBERS });
  sendTo(ws, { type: 'state', state: getState(-1) });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const info = clients.get(ws);
      if (!info) return;

      switch (msg.type) {
        case 'join': {
          if (game.phase !== 'lobby') { sendTo(ws, { type: 'error', text: 'Spiel läuft bereits.' }); return; }
          if (game.players.length >= 4) { sendTo(ws, { type: 'error', text: 'Spiel ist voll (max 4).' }); return; }
          const name = (msg.name || 'Spieler').substring(0, 16);
          const idx = game.players.length;
          const token = crypto.randomUUID();
          game.players.push({ name, color: PLAYER_COLORS[idx], money: 1500, pos: 0, bankrupt: false, inJail: false, jailTurns: 0, jailFreeCards: 0, connected: true });
          info.playerIdx = idx;
          playerTokens.set(token, idx);
          addLog(`👋 ${name} ist beigetreten! (${game.players.length}/4)`);
          sendTo(ws, { type: 'joined', playerIdx: idx, token });
          broadcastState();
          break;
        }
        case 'rejoin': {
          const token = msg.token;
          if (!token || !playerTokens.has(token)) { sendTo(ws, { type: 'error', text: 'Ungültiger Token.' }); sendTo(ws, { type: 'state', state: getState(-1) }); return; }
          const idx = playerTokens.get(token);
          if (idx >= 0 && game.players[idx]) {
            info.playerIdx = idx; game.players[idx].connected = true;
            addLog(`🔄 ${game.players[idx].name} ist wieder da!`);
            sendTo(ws, { type: 'rejoined', playerIdx: idx }); broadcastState();
          } break;
        }
        case 'start': {
          if (game.phase !== 'lobby' || game.players.length < 2) { sendTo(ws, { type: 'error', text: 'Mind. 2 Spieler nötig.' }); return; }
          game.phase = 'rolling_order'; game.initRolls = {}; game.turnOrder = [];
          addLog(`🎲 Alle Spieler würfeln um die Reihenfolge!`);
          broadcastState(); break;
        }
        case 'action': {
          if (info.playerIdx < 0) return;
          // Init roll during rolling_order phase
          if (msg.action.type === 'init_roll' && game.phase === 'rolling_order') {
            const pi = info.playerIdx;
            if (game.initRolls[pi]) return; // already rolled
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;
            game.initRolls[pi] = { d1, d2, total: d1 + d2 };
            addLog(`🎲 ${game.players[pi].name} würfelt ${d1}+${d2} = ${d1 + d2}`);
            // Check if all players have rolled
            const allRolled = game.players.every((_, i) => game.initRolls[i]);
            if (allRolled) {
              // Sort by total descending, then determine turn order
              const sorted = game.players.map((_, i) => i).sort((a, b) => game.initRolls[b].total - game.initRolls[a].total);
              game.turnOrder = sorted;
              // Reorder players array and fix property owners
              const newPlayers = sorted.map(i => game.players[i]);
              // Create mapping old index -> new index
              const indexMap = {};
              sorted.forEach((oldIdx, newIdx) => { indexMap[oldIdx] = newIdx; });
              // Fix property owners
              Object.values(game.properties).forEach(p => { if (indexMap[p.owner] !== undefined) p.owner = indexMap[p.owner]; });
              // Fix player tokens mapping
              const newTokenMap = new Map();
              for (const [token, oldIdx] of playerTokens) {
                if (indexMap[oldIdx] !== undefined) newTokenMap.set(token, indexMap[oldIdx]);
              }
              playerTokens.clear();
              for (const [token, newIdx] of newTokenMap) playerTokens.set(token, newIdx);
              // Fix client playerIdx
              for (const [, ci] of clients) {
                if (ci.playerIdx >= 0 && indexMap[ci.playerIdx] !== undefined) ci.playerIdx = indexMap[ci.playerIdx];
              }
              // Reassign colors
              newPlayers.forEach((p, i) => { p.color = PLAYER_COLORS[i]; });
              game.players = newPlayers;
              game.currentPlayer = 0;
              game.turnPhase = 'roll';
              game.phase = 'playing';
              // Log order
              const orderStr = game.players.map((p, i) => `${i + 1}. ${p.name} (${game.initRolls[sorted[i]].total})`).join(', ');
              addLog(`📊 Reihenfolge: ${orderStr}`);
              addLog(`🎮 Spiel gestartet! ${game.players[0].name} beginnt.`);
            }
            broadcastState();
            return;
          }
          // Abort game
          if (msg.action.type === 'abort') {
            const pName = (info.playerIdx >= 0 && game.players[info.playerIdx]) ? game.players[info.playerIdx].name : 'Jemand';
            createGame(); playerTokens.clear();
            for (const [, ci] of clients) ci.playerIdx = -1;
            addLog(`🛑 ${pName} hat das Spiel abgebrochen. Zurück zur Lobby.`);
            broadcastState();
            return;
          }
          if (game.phase !== 'playing') return;
          handleAction(info.playerIdx, msg.action); break;
        }
        case 'reset': {
          createGame(); playerTokens.clear();
          for (const [, ci] of clients) ci.playerIdx = -1;
          addLog('🔄 Neues Spiel.'); broadcastState(); break;
        }
      }
    } catch (e) { console.error('Message error:', e.message); }
  });

  ws.on('close', () => {
    const info = clients.get(ws);
    if (info && info.playerIdx >= 0 && game.players[info.playerIdx]) {
      game.players[info.playerIdx].connected = false;
      addLog(`⚡ ${game.players[info.playerIdx].name} getrennt.`);
    }
    clients.delete(ws);
    console.log(`[-] Client disconnected. Total: ${clients.size}`);
    broadcastState();
  });

  ws.on('error', () => { clients.delete(ws); });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎲 MONOPOLY ONLINE läuft auf Port ${PORT}\n`);
});
