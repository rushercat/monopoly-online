const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),{WebSocketServer}=require('ws');
const PORT=process.env.PORT||3000;
const MIME={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};
const server=http.createServer((req,res)=>{let fp=path.join(__dirname,'public',req.url==='/'?'index.html':req.url);fs.readFile(fp,(err,data)=>{if(err){res.writeHead(404);res.end('404');return;}res.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream','Access-Control-Allow-Origin':'*'});res.end(data);});});
const wss=new WebSocketServer({server}),clients=new Map(),playerTokens=new Map();
function sendTo(ws,d){try{if(ws.readyState===1)ws.send(JSON.stringify(d));}catch{}}
const GO=['brown','lblue','pink','orange','red','yellow','green','dblue','rail','util'];
function gsk(sp){if(sp.type==='railroad')return GO.indexOf('rail');if(sp.type==='utility')return GO.indexOf('util');return sp.group?GO.indexOf(sp.group):99;}
const SPACES=[
{id:0,name:'LOS',type:'go'},{id:1,name:'Badstraße',type:'property',group:'brown',price:60,rent:[2,10,30,90,160,250],houseCost:50},
{id:2,name:'Gemeinschaftsfeld',type:'community'},{id:3,name:'Turmstraße',type:'property',group:'brown',price:60,rent:[4,20,60,180,320,450],houseCost:50},
{id:4,name:'Einkommensteuer',type:'tax',amount:200},{id:5,name:'Südbahnhof',type:'railroad',price:200},
{id:6,name:'Chausseestraße',type:'property',group:'lblue',price:100,rent:[6,30,90,270,400,550],houseCost:50},
{id:7,name:'Ereignisfeld',type:'chance'},{id:8,name:'Elisenstraße',type:'property',group:'lblue',price:100,rent:[6,30,90,270,400,550],houseCost:50},
{id:9,name:'Poststraße',type:'property',group:'lblue',price:120,rent:[8,40,100,300,450,600],houseCost:50},
{id:10,name:'Gefängnis',type:'jail'},{id:11,name:'Seestraße',type:'property',group:'pink',price:140,rent:[10,50,150,450,625,750],houseCost:100},
{id:12,name:'Elektrizitätswerk',type:'utility',price:150},{id:13,name:'Hafenstraße',type:'property',group:'pink',price:140,rent:[10,50,150,450,625,750],houseCost:100},
{id:14,name:'Neue Straße',type:'property',group:'pink',price:160,rent:[12,60,180,500,700,900],houseCost:100},
{id:15,name:'Westbahnhof',type:'railroad',price:200},{id:16,name:'Münchner Straße',type:'property',group:'orange',price:180,rent:[14,70,200,550,750,950],houseCost:100},
{id:17,name:'Gemeinschaftsfeld',type:'community'},{id:18,name:'Wiener Straße',type:'property',group:'orange',price:180,rent:[14,70,200,550,750,950],houseCost:100},
{id:19,name:'Berliner Straße',type:'property',group:'orange',price:200,rent:[16,80,220,600,800,1000],houseCost:100},
{id:20,name:'Frei Parken',type:'free'},{id:21,name:'Theaterstraße',type:'property',group:'red',price:220,rent:[18,90,250,700,875,1050],houseCost:150},
{id:22,name:'Ereignisfeld',type:'chance'},{id:23,name:'Museumsstraße',type:'property',group:'red',price:220,rent:[18,90,250,700,875,1050],houseCost:150},
{id:24,name:'Opernplatz',type:'property',group:'red',price:240,rent:[20,100,300,750,925,1100],houseCost:150},
{id:25,name:'Nordbahnhof',type:'railroad',price:200},{id:26,name:'Lessingstraße',type:'property',group:'yellow',price:260,rent:[22,110,330,800,975,1150],houseCost:150},
{id:27,name:'Schillerstraße',type:'property',group:'yellow',price:260,rent:[22,110,330,800,975,1150],houseCost:150},
{id:28,name:'Wasserwerk',type:'utility',price:150},{id:29,name:'Goethestraße',type:'property',group:'yellow',price:280,rent:[24,120,360,850,1025,1200],houseCost:150},
{id:30,name:'Gehe ins Gefängnis',type:'gotojail'},{id:31,name:'Rathausplatz',type:'property',group:'green',price:300,rent:[26,130,390,900,1100,1275],houseCost:200},
{id:32,name:'Hauptstraße',type:'property',group:'green',price:300,rent:[26,130,390,900,1100,1275],houseCost:200},
{id:33,name:'Gemeinschaftsfeld',type:'community'},{id:34,name:'Bahnhofstraße',type:'property',group:'green',price:320,rent:[28,150,450,1000,1200,1400],houseCost:200},
{id:35,name:'Hauptbahnhof',type:'railroad',price:200},{id:36,name:'Ereignisfeld',type:'chance'},
{id:37,name:'Parkstraße',type:'property',group:'dblue',price:350,rent:[35,175,500,1100,1300,1500],houseCost:200},
{id:38,name:'Zusatzsteuer',type:'tax',amount:100},{id:39,name:'Schlossallee',type:'property',group:'dblue',price:400,rent:[50,200,600,1400,1700,2000],houseCost:200}];
const GM={};SPACES.forEach(s=>{if(s.group){if(!GM[s.group])GM[s.group]=[];GM[s.group].push(s.id);}});
const CC=[{text:'Rücke vor bis auf LOS.',action:'moveto',dest:0},{text:'Gehe in das Gefängnis.',action:'jail'},{text:'Gehe zurück auf die Badstraße.',action:'moveto',dest:1},{text:'Rücke vor zur Schlossallee.',action:'moveto',dest:39},{text:'Rücke vor zum Südbahnhof.',action:'moveto',dest:5},{text:'Bank zahlt 50€ Dividende.',action:'gain',amount:50},{text:'Du erhältst 150€.',action:'gain',amount:150},{text:'Zahle 15€ Strafe.',action:'pay',amount:15},{text:'Reparatur: 40€/Haus, 115€/Hotel.',action:'repair',house:40,hotel:115},{text:'Vorsitzender – zahle jedem 50€.',action:'payall',amount:50},{text:'Rücke zum Opernplatz.',action:'moveto',dest:24},{text:'Gehe zum Westbahnhof.',action:'moveto',dest:15},{text:'Rücke zur Theaterstraße.',action:'moveto',dest:21},{text:'Gefängnis-Freikarte!',action:'jailcard'},{text:'3 Felder zurück.',action:'back3'}];
const CK=[{text:'Rücke vor bis auf LOS.',action:'moveto',dest:0},{text:'Gehe in das Gefängnis.',action:'jail'},{text:'Bankfehler – 200€.',action:'gain',amount:200},{text:'Arztrechnung – 50€.',action:'pay',amount:50},{text:'Erbschaft – 100€.',action:'gain',amount:100},{text:'Schönheitswettbewerb – 10€.',action:'gain',amount:10},{text:'Steuerrückzahlung – 20€.',action:'gain',amount:20},{text:'Krankenhaus – 100€.',action:'pay',amount:100},{text:'Beratungshonorar – 25€.',action:'gain',amount:25},{text:'Reparatur: 45€/Haus, 115€/Hotel.',action:'repair',house:45,hotel:115},{text:'Gefängnis-Freikarte!',action:'jailcard'},{text:'Versicherung – 100€.',action:'gain',amount:100},{text:'Schulgeld – 150€.',action:'pay',amount:150},{text:'Geburtstag – jeder zahlt 10€.',action:'collectall',amount:10}];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const PC=['#e53935','#1e88e5','#43a047','#fdd835'];
let game=null;
function createGame(){game={phase:'lobby',players:[],currentPlayer:0,turnPhase:'roll',doublesCount:0,lastDice:[1,1],properties:{},freeParkingPot:0,log:[],chanceDeck:shuffle([...CC]),communityDeck:shuffle([...CK]),pendingOffer:null,initRolls:{},turnOrder:[],auction:null};}
createGame();
let auctionTimer=null;
function clearAuction(){if(auctionTimer){clearTimeout(auctionTimer);auctionTimer=null;}game.auction=null;}
function startAuction(spaceId,starterIdx){
  clearAuction();
  game.auction={spaceId,highBid:0,highBidder:-1,endTime:Date.now()+10000,startedBy:starterIdx};
  addLog(`🔨 ${SPACES[spaceId].name} wird versteigert! 10 Sekunden...`,'#888');
  auctionTimer=setTimeout(endAuction,10000);
  broadcastState();
}
function endAuction(){
  if(!game.auction)return;
  const a=game.auction;const sp=SPACES[a.spaceId];
  if(a.highBidder>=0&&a.highBid>0){
    const winner=game.players[a.highBidder];
    winner.money-=a.highBid;
    game.properties[a.spaceId]={owner:a.highBidder,houses:0,mortgaged:false};
    addLog(`🔨 ${winner.name} gewinnt ${sp.name} für ${a.highBid}€!`,winner.color);
  }else{addLog(`🔨 Keine Gebote – ${sp.name} bleibt bei der Bank.`,'#888');}
  clearAuction();broadcastState();
}
function cc(){return game.players.length?game.players[game.currentPlayer]?.color||'#888':'#888';}
function addLog(msg,color){game.log.push({text:msg,color:color||cc()});if(game.log.length>100)game.log.shift();}
function getState(fi){return{phase:game.phase,players:game.players.map(p=>({name:p.name,color:p.color,money:p.money,pos:p.pos,bankrupt:p.bankrupt,inJail:p.inJail,jailTurns:p.jailTurns,jailFreeCards:p.jailFreeCards,connected:p.connected})),currentPlayer:game.currentPlayer,turnPhase:game.turnPhase,doublesCount:game.doublesCount,lastDice:game.lastDice,properties:game.properties,freeParkingPot:game.freeParkingPot,log:game.log,you:fi,pendingOffer:game.pendingOffer,initRolls:game.initRolls,turnOrder:game.turnOrder,groupOrder:GO,auction:game.auction?{spaceId:game.auction.spaceId,highBid:game.auction.highBid,highBidder:game.auction.highBidder,endTime:game.auction.endTime}:null};}
function broadcastState(){for(const[ws,info]of clients)sendTo(ws,{type:'state',state:getState(info.playerIdx)});}
function calcRent(sid){const sp=SPACES[sid],prop=game.properties[sid];if(!prop||prop.mortgaged)return 0;const ow=prop.owner;if(sp.type==='railroad'){const c=[5,15,25,35].filter(id=>game.properties[id]&&game.properties[id].owner===ow&&!game.properties[id].mortgaged).length;return[25,50,100,200][c-1]||25;}if(sp.type==='utility'){const c=[12,28].filter(id=>game.properties[id]&&game.properties[id].owner===ow&&!game.properties[id].mortgaged).length;return c===2?(game.lastDice[0]+game.lastDice[1])*10:(game.lastDice[0]+game.lastDice[1])*4;}if(sp.type==='property'){if(prop.houses>0)return sp.rent[prop.houses];const g=GM[sp.group];return(g&&g.every(id=>game.properties[id]&&game.properties[id].owner===ow&&!game.properties[id].mortgaged))?sp.rent[0]*2:sp.rent[0];}return 0;}
function mv(sid){return Math.floor(SPACES[sid].price/2);}
function umc(sid){return Math.floor(mv(sid)*1.1);}
function autoRescue(pl,idx){if(pl.money>=0)return;let hp=Object.entries(game.properties).filter(([,p])=>p.owner===idx&&p.houses>0).map(([s,p])=>({sid:+s,prop:p,sp:SPACES[+s]}));while(pl.money<0&&hp.length>0){hp.sort((a,b)=>b.prop.houses-a.prop.houses);const t=hp[0],r=Math.floor(t.sp.houseCost/2);t.prop.houses--;pl.money+=r;addLog(`🏚️ ${pl.name} verkauft Haus auf ${t.sp.name} (+${r}€)`);hp=hp.filter(h=>h.prop.houses>0);}if(pl.money<0){const ml=Object.entries(game.properties).filter(([,p])=>p.owner===idx&&!p.mortgaged&&p.houses===0).map(([s])=>+s);for(const sid of ml){if(pl.money>=0)break;const v=mv(sid);game.properties[sid].mortgaged=true;pl.money+=v;addLog(`🏦 ${pl.name} Hypothek auf ${SPACES[sid].name} (+${v}€)`);}}}
function checkBankrupt(pl,idx){if(pl.money<0)autoRescue(pl,idx);if(pl.money<0){pl.bankrupt=true;addLog(`💀 ${pl.name} ist bankrott!`);Object.keys(game.properties).forEach(s=>{if(game.properties[s].owner===idx)delete game.properties[s];});const alive=game.players.filter(p=>!p.bankrupt);if(alive.length<=1){game.phase='gameover';if(alive.length===1)addLog(`🏆 ${alive[0].name} gewinnt!`);}}}
function goToJail(pl){pl.pos=10;pl.inJail=true;pl.jailTurns=0;addLog(`🔒 ${pl.name} ins Gefängnis!`);}
function execCard(pl,idx,card){addLog(`📋 ${card.text}`);switch(card.action){case'moveto':moveTo(pl,idx,card.dest,true);return;case'jail':goToJail(pl);break;case'gain':pl.money+=card.amount;addLog(`💰 +${card.amount}€`);break;case'pay':pl.money-=card.amount;game.freeParkingPot+=card.amount;addLog(`💸 -${card.amount}€ → Topf`);checkBankrupt(pl,idx);break;case'repair':{let c=0;Object.values(game.properties).forEach(p=>{if(p.owner===idx)c+=p.houses===5?card.hotel:p.houses*card.house;});pl.money-=c;game.freeParkingPot+=c;addLog(`🔧 -${c}€ → Topf`);checkBankrupt(pl,idx);break;}case'payall':{let t=0;game.players.forEach((o,oi)=>{if(oi!==idx&&!o.bankrupt){t+=card.amount;o.money+=card.amount;}});pl.money-=t;checkBankrupt(pl,idx);break;}case'collectall':game.players.forEach((o,oi)=>{if(oi!==idx&&!o.bankrupt){o.money-=card.amount;pl.money+=card.amount;}});break;case'jailcard':pl.jailFreeCards++;addLog(`🎫 Gefängnis-Freikarte!`);break;case'back3':pl.pos=(pl.pos-3+40)%40;landOn(pl,idx);return;}}
function landOn(pl,idx){const sp=SPACES[pl.pos];addLog(`📍 ${pl.name} → ${sp.name}`);switch(sp.type){case'property':case'railroad':case'utility':if(game.properties[pl.pos]&&game.properties[pl.pos].owner!==idx){const pr=game.properties[pl.pos],ow=game.players[pr.owner];if(!ow.bankrupt&&!pr.mortgaged){const r=calcRent(pl.pos);addLog(`💸 ${pl.name} zahlt ${r}€ an ${ow.name}`);pl.money-=r;ow.money+=r;checkBankrupt(pl,idx);}else if(pr.mortgaged){addLog(`🏦 ${sp.name} hat Hypothek – keine Miete`);}}break;case'tax':addLog(`💸 -${sp.amount}€ Steuer → Topf`);pl.money-=sp.amount;game.freeParkingPot+=sp.amount;checkBankrupt(pl,idx);break;case'gotojail':goToJail(pl);break;case'chance':{if(!game.chanceDeck.length)game.chanceDeck=shuffle([...CC]);execCard(pl,idx,game.chanceDeck.pop());return;}case'community':{if(!game.communityDeck.length)game.communityDeck=shuffle([...CK]);execCard(pl,idx,game.communityDeck.pop());return;}case'free':if(game.freeParkingPot>0){addLog(`🎉 ${pl.name} kassiert ${game.freeParkingPot}€!`);pl.money+=game.freeParkingPot;game.freeParkingPot=0;}break;}}
function moveP(pl,idx,steps){const o=pl.pos,n=(pl.pos+steps)%40;if(n<o||(o!==0&&n===0)){pl.money+=200;addLog(`→ LOS +200€`);}pl.pos=n;game.turnPhase='postroll';landOn(pl,idx);}
function moveTo(pl,idx,dest,cg){if(cg&&dest<pl.pos){pl.money+=200;addLog(`→ LOS +200€`);}pl.pos=dest;landOn(pl,idx);}
function handleAction(pi,action){if(game.phase!=='playing')return;const pl=game.players[pi];if(!pl||pl.bankrupt)return;
// Block most actions during auction (only bid allowed)
if(game.auction&&action.type!=='bid'&&action.type!=='abort')return;
switch(action.type){
case'roll':{if(game.currentPlayer!==pi||game.turnPhase!=='roll')return;const d1=Math.floor(Math.random()*6)+1,d2=Math.floor(Math.random()*6)+1;game.lastDice=[d1,d2];const t=d1+d2,db=d1===d2;addLog(`🎲 ${d1}+${d2}=${t}${db?' (Pasch!)':''}`);if(pl.inJail){if(db){pl.inJail=false;pl.jailTurns=0;addLog(`Frei (Pasch)!`);moveP(pl,pi,t);}else{pl.jailTurns++;if(pl.jailTurns>=3){pl.inJail=false;pl.jailTurns=0;pl.money-=50;addLog(`50€ → frei`);moveP(pl,pi,t);}else{addLog(`Gefängnis (${pl.jailTurns}/3)`);game.turnPhase='postroll';game.doublesCount=0;}}}else{if(db){game.doublesCount++;if(game.doublesCount>=3){addLog(`3x Pasch → Gefängnis!`);goToJail(pl);game.turnPhase='postroll';game.doublesCount=0;break;}}else game.doublesCount=0;moveP(pl,pi,t);}break;}
case'buy':{if(game.currentPlayer!==pi||game.turnPhase!=='postroll')return;const sp=SPACES[pl.pos];if(!['property','railroad','utility'].includes(sp.type)||game.properties[pl.pos]||pl.money<sp.price)return;pl.money-=sp.price;game.properties[pl.pos]={owner:pi,houses:0,mortgaged:false};addLog(`🏠 ${pl.name} kauft ${sp.name} (${sp.price}€)`);break;}
case'auction_start':{if(game.currentPlayer!==pi||game.turnPhase!=='postroll')return;const sp=SPACES[pl.pos];if(!['property','railroad','utility'].includes(sp.type)||game.properties[pl.pos])return;addLog(`🔨 ${pl.name} will ${sp.name} nicht kaufen → Auktion!`);startAuction(pl.pos,pi);return;}
case'bid':{if(!game.auction)return;const a=game.auction;const amount=parseInt(action.amount);if(![10,50,100].includes(amount))return;const newBid=a.highBid+amount;if(pl.money<newBid)return;a.highBid=newBid;a.highBidder=pi;a.endTime=Date.now()+10000;addLog(`🔨 ${pl.name} bietet ${newBid}€!`,pl.color);if(auctionTimer)clearTimeout(auctionTimer);auctionTimer=setTimeout(endAuction,10000);broadcastState();return;}
case'build':{if(game.currentPlayer!==pi||game.turnPhase!=='postroll')return;const sid=action.spaceId,sp=SPACES[sid];if(!sp||sp.type!=='property')return;const pr=game.properties[sid];if(!pr||pr.owner!==pi||pr.mortgaged)return;const g=GM[sp.group];if(!g||!g.every(id=>game.properties[id]&&game.properties[id].owner===pi&&!game.properties[id].mortgaged))return;if(pr.houses>=5||pl.money<sp.houseCost)return;const mn=Math.min(...g.map(id=>game.properties[id]?.houses||0));if(pr.houses>mn)return;pl.money-=sp.houseCost;pr.houses++;addLog(`🏗️ ${sp.name} (${pr.houses===5?'Hotel':pr.houses+'H'})`);break;}
case'mortgage':{const sid=action.spaceId,pr=game.properties[sid];if(!pr||pr.owner!==pi||pr.mortgaged||pr.houses>0)return;const sp=SPACES[sid];if(sp.group&&GM[sp.group]&&GM[sp.group].some(gid=>{const gp=game.properties[gid];return gp&&gp.owner===pi&&gp.houses>0;}))return;const v=mv(sid);pr.mortgaged=true;pl.money+=v;addLog(`🏦 Hypothek: ${sp.name} (+${v}€)`);break;}
case'unmortgage':{const sid=action.spaceId,pr=game.properties[sid];if(!pr||pr.owner!==pi||!pr.mortgaged)return;const c=umc(sid);if(pl.money<c)return;pr.mortgaged=false;pl.money-=c;addLog(`✅ Hypothek gelöst: ${SPACES[sid].name} (-${c}€)`);break;}
case'sell_house':{if(game.currentPlayer!==pi||game.turnPhase!=='postroll')return;const sid=action.spaceId,sp=SPACES[sid];if(!sp||sp.type!=='property')return;const pr=game.properties[sid];if(!pr||pr.owner!==pi||pr.houses<=0)return;const g=GM[sp.group];if(g){const maxH=Math.max(...g.map(id=>game.properties[id]?.houses||0));if(pr.houses<maxH)return;}const refund=Math.floor(sp.houseCost/2);pr.houses--;pl.money+=refund;addLog(`🏚️ ${pl.name} verkauft Haus auf ${sp.name} (+${refund}€)`);break;}
case'payjail':{if(game.currentPlayer!==pi||!pl.inJail||pl.money<50)return;pl.money-=50;pl.inJail=false;pl.jailTurns=0;addLog(`50€ → frei`);game.turnPhase='roll';break;}
case'usejailcard':{if(game.currentPlayer!==pi||!pl.inJail||pl.jailFreeCards<=0)return;pl.jailFreeCards--;pl.inJail=false;pl.jailTurns=0;addLog(`🎫 Freikarte!`);game.turnPhase='roll';break;}
case'endturn':{if(game.currentPlayer!==pi||game.turnPhase!=='postroll')return;const db=game.lastDice[0]===game.lastDice[1];if(db&&game.doublesCount>0&&game.doublesCount<3&&!pl.inJail){game.turnPhase='roll';addLog(`🎲 Nochmal (Pasch)`);}else{game.doublesCount=0;do{game.currentPlayer=(game.currentPlayer+1)%game.players.length;}while(game.players[game.currentPlayer].bankrupt&&game.players.filter(p=>!p.bankrupt).length>1);game.turnPhase='roll';addLog(`── ${game.players[game.currentPlayer].name} ist dran ──`);}break;}
case'trade_offer':{const{to,offerMoney,requestMoney,offerProps,requestProps}=action;if(to<0||to>=game.players.length||to===pi||game.players[to].bankrupt)return;if(offerMoney>pl.money||requestMoney>game.players[to].money)return;game.pendingOffer={from:pi,to,offerMoney,requestMoney,offerProps:offerProps||[],requestProps:requestProps||[],round:(game.pendingOffer?.round||0)+1};addLog(`📨 Angebot an ${game.players[to].name}`);break;}
case'trade_accept':{const o=game.pendingOffer;if(!o||o.to!==pi)return;const s=game.players[o.from],r=game.players[o.to];if(o.offerMoney>0){s.money-=o.offerMoney;r.money+=o.offerMoney;}if(o.requestMoney>0){r.money-=o.requestMoney;s.money+=o.requestMoney;}o.offerProps.forEach(sid=>{if(game.properties[sid])game.properties[sid].owner=o.to;});o.requestProps.forEach(sid=>{if(game.properties[sid])game.properties[sid].owner=o.from;});addLog(`🤝 ${s.name} ⇄ ${r.name}`);game.pendingOffer=null;break;}
case'trade_reject':{const o=game.pendingOffer;if(!o||o.to!==pi)return;addLog(`❌ Abgelehnt`);game.pendingOffer=null;break;}
case'trade_counter':{const o=game.pendingOffer;if(!o||o.to!==pi)return;const{offerMoney,requestMoney,offerProps,requestProps}=action;if(offerMoney>pl.money||requestMoney>game.players[o.from].money)return;game.pendingOffer={from:pi,to:o.from,offerMoney,requestMoney,offerProps:offerProps||[],requestProps:requestProps||[],round:o.round+1};addLog(`✏️ Gegenangebot`);break;}
case'trade_cancel':{if(game.pendingOffer&&(game.pendingOffer.from===pi||game.pendingOffer.to===pi)){addLog(`❌ Handel abgebrochen`);game.pendingOffer=null;}break;}
}broadcastState();}
wss.on('connection',(ws)=>{const cid=crypto.randomUUID();clients.set(ws,{id:cid,playerIdx:-1});
sendTo(ws,{type:'welcome',id:cid,spaces:SPACES,groupMembers:GM,groupOrder:GO});sendTo(ws,{type:'state',state:getState(-1)});
ws.on('message',(raw)=>{try{const msg=JSON.parse(raw.toString()),info=clients.get(ws);if(!info)return;switch(msg.type){
case'join':{if(game.phase!=='lobby'){sendTo(ws,{type:'error',text:'Spiel läuft.'});return;}if(game.players.length>=4){sendTo(ws,{type:'error',text:'Voll.'});return;}const name=(msg.name||'Spieler').substring(0,16),idx=game.players.length,token=crypto.randomUUID();game.players.push({name,color:PC[idx],money:1500,pos:0,bankrupt:false,inJail:false,jailTurns:0,jailFreeCards:0,connected:true});info.playerIdx=idx;playerTokens.set(token,idx);addLog(`👋 ${name} beigetreten (${game.players.length}/4)`,'#888');sendTo(ws,{type:'joined',playerIdx:idx,token});broadcastState();break;}
case'rejoin':{const token=msg.token;if(!token||!playerTokens.has(token)){sendTo(ws,{type:'error',text:'Ungültiger Token.'});sendTo(ws,{type:'state',state:getState(-1)});return;}const idx=playerTokens.get(token);if(idx>=0&&game.players[idx]){info.playerIdx=idx;game.players[idx].connected=true;addLog(`🔄 ${game.players[idx].name} wieder da!`,'#888');sendTo(ws,{type:'rejoined',playerIdx:idx});broadcastState();}break;}
case'start':{if(game.phase!=='lobby'||game.players.length<2){sendTo(ws,{type:'error',text:'Mind. 2 Spieler.'});return;}game.phase='rolling_order';game.initRolls={};game.turnOrder=[];addLog(`🎲 Alle würfeln!`,'#888');broadcastState();break;}
case'action':{if(info.playerIdx<0)return;
if(msg.action.type==='init_roll'&&game.phase==='rolling_order'){const pi=info.playerIdx;if(game.initRolls[pi])return;const d1=Math.floor(Math.random()*6)+1,d2=Math.floor(Math.random()*6)+1;game.initRolls[pi]={d1,d2,total:d1+d2};addLog(`🎲 ${game.players[pi].name}: ${d1}+${d2}=${d1+d2}`,game.players[pi].color);if(game.players.every((_,i)=>game.initRolls[i])){
// Sort players by roll, highest first - just determines who STARTS
const sorted=game.players.map((_,i)=>i).sort((a,b)=>game.initRolls[b].total-game.initRolls[a].total);
game.turnOrder=sorted;
// Set starting player to whoever rolled highest (don't swap anything!)
game.currentPlayer=sorted[0];
game.turnPhase='roll';game.phase='playing';
// Build order string showing play order from starting player
const orderNames=[];let ci=sorted[0];for(let n=0;n<game.players.length;n++){orderNames.push(`${n+1}. ${game.players[ci].name} (${game.initRolls[ci].total})`);ci=(ci+1)%game.players.length;}
addLog(`📊 Reihenfolge: ${orderNames.join(', ')}`,'#888');addLog(`🎮 ${game.players[game.currentPlayer].name} beginnt!`);}broadcastState();return;}
if(msg.action.type==='abort'){clearAuction();const pn=(info.playerIdx>=0&&game.players[info.playerIdx])?game.players[info.playerIdx].name:'?';createGame();playerTokens.clear();for(const[,ci]of clients)ci.playerIdx=-1;addLog(`🛑 ${pn} hat abgebrochen.`,'#888');broadcastState();return;}
if(game.phase!=='playing')return;handleAction(info.playerIdx,msg.action);break;}
case'reset':{clearAuction();createGame();playerTokens.clear();for(const[,ci]of clients)ci.playerIdx=-1;addLog('🔄 Neu.','#888');broadcastState();break;}
}}catch(e){console.error(e.message);}});
ws.on('close',()=>{const info=clients.get(ws);if(info&&info.playerIdx>=0&&game.players[info.playerIdx]){game.players[info.playerIdx].connected=false;addLog(`⚡ ${game.players[info.playerIdx].name} getrennt.`,'#888');}clients.delete(ws);broadcastState();});
ws.on('error',()=>{clients.delete(ws);});});
server.listen(PORT,'0.0.0.0',()=>{console.log(`\n🎲 MONOPOLY ONLINE v2 – Port ${PORT}\n`);});
