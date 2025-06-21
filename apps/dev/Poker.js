//Imports«
const{mk, log, cwarn, cerr}=LOTW.api.util;
//»

//Globals«

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const DECK = [];
for (let suit of SUITS) for (let rank of RANKS) DECK.push({ rank, suit });

//»


export const app = class{

constructor(Win){//«

this.Win = Win;
this.Main = Win.Main;

const {id} = Win;
this.id = id;

this.appBodyId = `${id}_appbody`;
this.potId = `${id}_pot`;
this.ctrlId = `${id}_controls`;
this.statCl = `${id}_status`;
this.butCl = `${id}_button`;
this.tableId = `${id}_poker-table`;
this.commCardsId = `${id}_community-cards`;
this.betRingId = `${id}_bet-ring`;

this.gameState = {//«
	num: 0,
	players: [],
	communityCards: [],
	pot: 0,
	currentPlayer: 0,
	dealer: 0,
	phase: 'setup',
	currentBet: 0,
	deck: [],
}//»

this.makeDOM();
}//»

makeDOM(){//«

const{id, Main} = this;
//CSS«
//Main._pos="relative";
Main._bgcol="#1a3c34"; 
Main._dis="flex";
Main.style.justifyContent="center";
Main.style.alignItems="center";
Main._pad="";
Main._over="hidden";
/*«
#${id}_appbody { 
	margin: 0; 
	padding: 0; 
	background: #1a3c34; 
	font-family: Arial, sans-serif; 
	color: #fff; 
	display: flex; 
	justify-content: center; 
	align-items: center; 
//	height: 100vh; 
	height: 500px;
	font-size: 18px; 
}
»*/
const styleElem = mk('style');
styleElem.innerHTML=`
#${this.tableId} { 
	position: absolute; 
	width: 800px; 
	height: 400px; 
	background: #2e7d32; 
	border-radius: 50%; 
	border: 10px solid #3e2723; 
	display: flex; 
	justify-content: center; 
	align-items: center; 
}
#${this.betRingId} { 
	position: absolute; 
	width: 500px; 
	height: 250px; 
	border-radius: 50%; 
	border: 1px solid #000; 
	display: flex; 
}
#${this.ctrlId} { 
	position: absolute; 
	top: 5px; 
	left: 5px; 
	background: rgba(0, 0, 0, 0.7); 
	padding: 7px; 
	border-radius: 5px; 
	display: flex; 
	flex-direction: column; 
	align-items: center; 
	z-index: 10; 
}
#${id}_community-cards { 
	position: absolute; 
	top: 50%; left: 50%; 
	transform: translate(-50%, -50%); 
	display: flex; gap: 5px; 
}
.${id}_bet { 
	color: #fff;
	position: absolute;
	width: 30px; 
	height: 30px; 
//	border: 1px solid #000; 
//	border-radius: 3px; 
	text-align: center; 
	line-height: 30px; 
	margin: 0 2px; 
	font-size: 18px;
	font-weight: bold;
}
.${id}_dealer-button {
	position: absolute; 
	display: none;
	width: 15px; 
	height: 15px; 
	border-radius: 50%; 
	border: 2px solid #ccc; 
	background-color: #000;
}
.${id}_player { 
	position: absolute; 
	width: 90px; 
	height: 90px; 
	background: #333; 
	border: 2px solid #fff; 
	border-radius: 5px; 
	display: flex; flex-direction: column; 
	justify-content: center; 
	align-items: center; 
}
.${id}_player.active { border-color: #ffd700; }
.${id}_cards { margin-top: 5px; }
.${id}_card { 
	display: inline-block; 
	width: 35px; 
	height: 30px; 
	background: #fff; 
	border: 1px solid #000; 
	border-radius: 3px; 
	text-align: center; 
	line-height: 30px; 
	margin: 0 2px; 
	font-size: 24px;
	font-weight: bold;
}
.${id}_folded {
	color: #000;
	background: #999; 
}
.${id}_card.red { color: #cc0000; }
.${id}_card.black { color: #000000; }
.${id}_setup { 
	position: absolute; 
	top: 5px; 
	left: 5px; 
	background: #424242; 
	padding: 10px; 
	border-radius: 5px; 
}
#${id}_controls button { 
	padding: 10px 20px; 
	background: #202050; 
	color: #fff; 
	border: none; 
	border-radius: 5px; 
	cursor: pointer; 
	font-size: 18px; 
}
.${id}_controls button:hover { background: #0277bd; }
.${id}_controls button:disabled { background: #616161; cursor: not-allowed; }
#${id}_pot { 
	position: absolute; 
	top: 5px;
	right: 5px;
	font-size: 24px;
	font-weight: bold;
	color: #eee;
}
.${id}_setup label { margin-right: 10px; }
.${id}_setup select, .setup button { padding: 5px; margin: 5px; }
`;
//»
document.head.appendChild(styleElem);
this.styleElem = styleElem;

//HTML_STR«

//	display: flex; 
//	justify-content: center; 
//	align-items: center; 
//<div id="${this.appBodyId}"></div>
Main.innerHTML = `
<div id="${this.potId}">Pot: $0</div>
<div id="${this.ctrlId}" style="display: none;">
	<div class="${this.statCl}"></div>
	<div>
		<button class="${this.butCl}">Fold</button>
		<button class="${this.butCl}">Call</button>
		<button class="${this.butCl}">Raise</button>
		<button class="${this.butCl}">All-In</button>
	</div>
</div>
<div id="${this.tableId}">
	<div id="${this.commCardsId}"></div>
</div>
<div id="${this.betRingId}">
</div>
`;

this.tableElem = document.getElementById(this.tableId);
this.controlsElem = document.getElementById(this.ctrlId);
this.betRingElem = document.getElementById(this.betRingId);
this.potElem = document.getElementById(this.potId);
this.commCardsElem = document.getElementById(this.commCardsId);

//»
/*
<div class="${id}_setup">
	<label>Players: <select id="${id}_num-players"></select></label>
	<div id="${id}_player-types"></div>
</div>
*/

}//»

curPlayer(){//«
//log(this.gameState.players);
//log(this.gameState.currentPlayer);
	return this.gameState.players[this.gameState.currentPlayer];
}//»
curType(){//«
	return this.gameState.players[this.gameState.currentPlayer].type;
}//»
incCurPlayer(){//«
this.gameState.currentPlayer=(this.gameState.currentPlayer+1) % this.numPlayers;
}//»
curNum(){//«
	return this.gameState.currentPlayer+1;
}//»
stat(message){//«
//	document.querySelector('.status')
//	statusElem.textContent = message;
	log(message);
}//»
updatePlayerDisplay(){//«
	const{id}=this;
	this.gameState.players.forEach((player, i) => {
		const playerDiv = document.querySelector(`.${id}_player-${i}`);
		if (playerDiv) {
			playerDiv.classList.toggle('active', i === this.gameState.currentPlayer && player.inHand && !player.allIn);
			const cardsDiv = playerDiv.querySelector(`.${id}_cards`);
			if (!player.inHand) {
				cardsDiv.innerHTML=`<span class="${id}_card folded">X</span><span class="${id}_card folded">X</span>`;
			}
			else {
				cardsDiv.innerHTML = player.hand.map(card => `<span class="${id}_card ${card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'}">${card.rank}${card.suit}</span>`).join('');
			}
			playerDiv.innerHTML = `Player ${i + 1}<br>$${player.chips}${player.allIn ? ' (All-In)' : ''}<div class="${id}_cards">${cardsDiv.innerHTML}</div>`;
		}
	});
}//»
updateCommunityCards(){//«
	const{id}=this;
	this.commCardsElem.innerHTML = this.gameState.communityCards.map(
		(card) => {
			return `<span class="${id}_card ${card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'}">${card.rank}${card.suit}</span>`;
		}
	).join('');
}//»
updatePot(){//«
//	document.querySelector('.pot')
	this.potElem.textContent = `Pot: $${this.gameState.pot}`;
}//»

shuffle(array){//«
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}//»
dealCard(){//«
	return this.gameState.deck.pop();
}//»
dealHands(){//«
	for (let i = 0; i < 2; i++) {
		for (let player of this.gameState.players) {
			if (player.inHand) player.hand.push(this.dealCard());
		}
	}
}//»

automatedAction(){//«
	const player = this.gameState.players[this.gameState.currentPlayer];
	if (!player.inHand || player.allIn) {
		this.nextPlayer();
		return;
	}

	let action;
	switch (player.strategy) {
		case 'random':
			action = ['fold', 'call', 'raise', 'all-in'][Math.floor(Math.random() * 4)];
			break;
		case 'foldbot':
			action = 'fold';
			break;
		case 'expert':
			action = this.expertStrategy(player);
			break;
		default:
			action = 'call';
	}

	if (action === 'raise') {
		const raiseAmount = Math.min(this.gameState.currentBet * 2, player.chips + player.bet);
		if (raiseAmount === player.chips + player.bet) action = 'all-in';
		if (action === 'all-in') {
			player.allIn = true;
			player.bet += player.chips;
		this.gameState.pot += player.chips;
			player.chips = 0;
		this.gameState.currentBet = Math.max(this.gameState.currentBet, player.bet);
			this.stat(`Player ${player.id + 1} goes all-in with $${player.bet}`);
		} 
		else {
			player.chips -= raiseAmount - player.bet;
		this.gameState.pot += raiseAmount - player.bet;
			player.bet = raiseAmount;
		this.gameState.currentBet = raiseAmount;
			this.stat(`Player ${player.id + 1} raises to $${raiseAmount}`);
		}
	} 
	else if (action === 'call') {
		const callAmount = Math.min(this.gameState.currentBet - player.bet, player.chips);
		if (callAmount === player.chips) {
			player.allIn = true;
			player.bet += player.chips;
		this.gameState.pot += player.chips;
			player.chips = 0;
			this.stat(`Player ${player.id + 1} goes all-in to call $${player.bet}`);
		} 
		else {
			player.chips -= callAmount;
		this.gameState.pot += callAmount;
			player.bet = this.gameState.currentBet;
			this.stat(`Player ${player.id + 1} calls $${callAmount}`);
		}
	} 
	else if (action === 'all-in') {
		player.allIn = true;
		player.bet += player.chips;
	this.gameState.pot += player.chips;
		player.chips = 0;
	this.gameState.currentBet = Math.max(this.gameState.currentBet, player.bet);
		this.stat(`Player ${player.id + 1} goes all-in with $${player.bet}`);
	} 
	else {
		player.inHand = false;
		this.stat(`Player ${player.id + 1} folds`);
	}
	this.updatePlayerDisplay();
	this.updatePot();
	this.nextPlayer();
}//»
expertStrategy(player){//«
	const handStrength = this.evaluateHand(player.hand, this.gameState.communityCards);
	if (handStrength > 0.7 && player.chips > 0) return 'raise';
	if (handStrength > 0.4 && player.chips > 0) return 'call';
	if (handStrength > 0.6 && player.chips === 0) return 'all-in';
	return 'fold';
}//»
evaluateHand(hand, community){//«
	const allCards = [...hand, ...community];
	return Math.random();
}//»
playerAction(action){//«
	const player = this.gameState.players[this.gameState.currentPlayer];
	if (!player.inHand || player.allIn) {//«
		this.nextPlayer();
		return;
	}//»
	if (action === 'raise') {//«
		const raiseAmount = Math.min(this.gameState.currentBet * 2, player.chips + player.bet);
		if (raiseAmount === player.chips + player.bet) {
			player.allIn = true;
			player.bet += player.chips;
			player.total += player.bet;
			this.gameState.pot += player.chips;
			player.chips = 0;
			this.gameState.currentBet = Math.max(this.gameState.currentBet, player.bet);
			this.stat(`Player ${player.id + 1} goes all-in with $${player.bet}`);
		} 
		else {
			player.chips -= raiseAmount - player.bet;
			this.gameState.pot += raiseAmount - player.bet;
			player.bet = raiseAmount;
			player.total += player.bet;
			this.gameState.currentBet = raiseAmount;
			this.stat(`Player ${player.id + 1} raises to $${raiseAmount}`);
		}
	}//»
	else if (action === 'call') {//«
		const callAmount = Math.min(this.gameState.currentBet - player.bet, player.chips);
		if (callAmount === player.chips) {
			player.allIn = true;
			player.bet += player.chips;
			player.total += player.bet;
			this.gameState.pot += player.chips;
			player.chips = 0;
			this.stat(`Player ${player.id + 1} goes all-in to call $${player.bet}`);
		} 
		else {
			player.chips -= callAmount;
			this.gameState.pot += callAmount;
			player.bet += callAmount;
			player.total += player.bet;
			this.stat(`Player ${player.id + 1} calls $${callAmount}`);
		}
	}//»
	else if (action === 'all-in') {//«
		player.allIn = true;
		player.bet += player.chips;
		player.total += player.bet;
		this.gameState.pot += player.chips;
		player.chips = 0;
		this.gameState.currentBet = Math.max(this.gameState.currentBet, player.bet);
		this.stat(`Player ${player.id + 1} goes all-in with $${player.bet}`);
	} //»
	else {//«
		player.inHand = false;
		this.stat(`Player ${player.id + 1} folds`);
	}//»
	player.betDiv.innerHTML=`${player.bet}`;
	this.controlsElem.style.display = 'none';
	this.updatePot();
	this.nextPlayer();
	this.updatePlayerDisplay();
}//»
actionKey(k){//«
	let a;
	if (k=="f_") a = "fold";
	else if (k=="c_") a = "call";
	else if (k=="r_") a = "raise";
	else if (k=="a_") a = "all-in";
	else {
		return;
	}
	this.playerAction(a);
}//»

nextPlayer(){//«

	let activePlayers = this.gameState.players.filter(p => p.inHand && !p.allIn).length;
	let playersInHand = this.gameState.players.filter(p => p.inHand).length;
	let allInCount = this.gameState.players.filter(p => p.allIn && p.inHand).length;

	if (playersInHand <= 1) {
		this.endHand();
		return;
	}

	let betsEqual = this.gameState.players.every(p => !p.inHand || p.allIn || p.bet === this.gameState.currentBet);
	// If one player is all-in and bets are unequal, allow the other to act
	if (allInCount > 0 && !betsEqual && activePlayers > 0) {
		this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % this.gameState.players.length;
		while (this.gameState.players[this.gameState.currentPlayer].inHand || this.gameState.players[this.gameState.currentPlayer].allIn) {
			this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % this.gameState.players.length;
		}
		this.stat(`Player ${this.gameState.currentPlayer + 1}'s turn`);
		if (this.curType() !== 'live') {
			this.automatedAction();
		} 
		else {
			this.controlsElem.style.display = 'flex';
		}
		return;
	}

	// If bets are equal or all remaining players are all-in, proceed to next phase or end hand
	if (betsEqual || activePlayers === 0) {
		if (this.gameState.phase !== 'river') {
			this.nextPhase();
		} 
		else {
			this.endHand();
		}
		return;
	}

	// Normal case: find next non-all-in, in-hand player
	this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % this.gameState.players.length;
	let startPlayer = this.gameState.currentPlayer;
	let looped = false;
	while (!this.gameState.players[this.gameState.currentPlayer].inHand || this.gameState.players[this.gameState.currentPlayer].allIn) {
		this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % this.gameState.players.length;
		if (this.gameState.currentPlayer === startPlayer) {
			looped = true;
			break;
		}
	}
	// If we looped without finding a valid player, bets must be settled
	if (looped) {
		if (this.gameState.phase !== 'river') {
			this.nextPhase();
		}
		else {
			this.endHand();
		}
		return;
	}

	this.stat(`Player ${this.gameState.currentPlayer + 1}'s turn`);
	this.updatePlayerDisplay();

	if (this.curType() !== 'live') {
		this.automatedAction();
	} 
	else {
		this.controlsElem.style.display = 'flex';
	}
}//»
nextPhase(){//«
this.gameState.currentBet = 0;
this.gameState.players.forEach(p => p.bet = 0);
	if (this.gameState.phase === 'preflop') {
		let b1 = this.dealCard();
		let b2 = this.dealCard();
		let b3 = this.dealCard();
		this.stat(`Flop: ${b1.rank}${b1.suit} ${b2.rank}${b2.suit} ${b3.rank}${b3.suit}`);
	this.gameState.communityCards = [b1, b2, b3];
	this.gameState.phase = 'flop';
	} 
	else if (this.gameState.phase === 'flop') {
		let b4 = this.dealCard();
		this.stat(`Turn: ${b4.rank}${b4.suit}`);
	this.gameState.communityCards.push(b4);
	this.gameState.phase = 'turn';
	} 
	else if (this.gameState.phase === 'turn') {
		let b5 = this.dealCard();
		this.stat(`River: ${b5.rank}${b5.suit}`);
	this.gameState.communityCards.push(b5);
	this.gameState.phase = 'river';
	} 
	else {
		this.endHand();
		return;
	}

	this.updateCommunityCards();
this.gameState.currentPlayer = (this.gameState.dealer + 1) % this.gameState.players.length;
	let startPlayer = this.gameState.currentPlayer;
	let looped = false;
	while (!this.gameState.players[this.gameState.currentPlayer].inHand || this.gameState.players[this.gameState.currentPlayer].allIn) {
	this.gameState.currentPlayer = (this.gameState.currentPlayer + 1) % this.gameState.players.length;
		if (this.gameState.currentPlayer === startPlayer) {
			looped = true;
			break;
		}
	}
	if (looped && this.gameState.players.filter(p => p.inHand).length > 1) {
		if (this.gameState.phase !== 'river') {
			this.nextPhase();
		} 
		else {
			this.endHand();
		}
		return;
	}
	this.stat(`Player ${this.gameState.currentPlayer + 1}'s turn`);
	this.updatePlayerDisplay();
	if (this.curType() !== 'live') {
		this.automatedAction();
	} 
	else {
		this.controlsElem.style.display = 'flex';
	}
}//»
endHand(){//«
	const winner = this.gameState.players.find(p => p.inHand) ||this.gameState.players[0];
	winner.chips +=this.gameState.pot;
	this.stat(`Player ${winner.id + 1} wins $${this.gameState.pot}`);
this.gameState.pot = 0;
this.gameState.communityCards = [];
this.gameState.players.forEach(p => {
		p.hand = [];
		p.inHand = true;
		p.bet = 0;
		p.allIn = false;
		p.betDiv.innerHTML="";
	});

	document.getElementById(`${this.id}_dealer-button-${this.gameState.dealer}`).style.display="";

	this.gameState.dealer = (this.gameState.dealer + 1) % this.gameState.players.length;
	this.gameState.phase = 'preflop';
	this.gameState.deck = [...DECK];
	this.shuffle(this.gameState.deck);
	this.updateCommunityCards();
	this.updatePlayerDisplay();
	this.updatePot();
	this.gameState.num++;
	this.startGame();
}//»

initPlayers(){//«
	const{id, tableElem, betRingElem, playerTypes, numPlayers}=this;

	this.gameState.players = [];

	tableElem.querySelectorAll(`.${id}_player`).forEach(el => el.remove());

	const tableWidth = 800;
	const tableHeight = 400;
	const radiusX = tableWidth / 2;
	const radiusY = tableHeight / 2;
	const angleStep = (2 * Math.PI) / numPlayers;

	const betWidth = 500;
	const betHeight = 250;
	const betRadX = betWidth/2;
	const betRadY = betHeight/2;

	for (let i = 0; i < numPlayers; i++) {
		const angle = i * angleStep - Math.PI / 2;
		let player_off = 40;
		const player_x = radiusX + radiusX * Math.cos(angle) - player_off;
		const player_y = radiusY + radiusY * Math.sin(angle) - player_off;

		const bet_x = betRadX + betRadX * Math.cos(angle) - 20;
		const bet_y = betRadY + betRadY * Math.sin(angle) - 20;


		let but_angle_off = 0.25;
		const but_x = (tableWidth / 2) + radiusX * Math.cos(angle+but_angle_off);
		const but_y = (tableHeight / 2) + radiusY * Math.sin(angle+but_angle_off);
		const butDiv = document.createElement('div');
		butDiv.className = `${id}_dealer-button`;
		butDiv.id = `${id}_dealer-button-${i}`;
		butDiv.style.left = `${but_x}px`;
		butDiv.style.top = `${but_y}px`;

		const playerDiv = document.createElement('div');
		playerDiv.className = `${id}_player ${id}_player-${i}`;
		playerDiv.style.left = `${player_x}px`;
		playerDiv.style.top = `${player_y}px`;
		const betDiv = document.createElement('div');
		betDiv.className = `${id}_bet`;
		betDiv.style.left = `${bet_x}px`;
		betDiv.style.top = `${bet_y}px`;

		tableElem.appendChild(playerDiv);
		tableElem.appendChild(butDiv);

		betRingElem.appendChild(betDiv);

		const player = {
			id: i,
			type: playerTypes[i],
			chips: 1000,
			hand: [],
			inHand: true,
			bet: 0,
			total: 0,
			strategy: playerTypes[i],
			allIn: false,
			betDiv
		};

		playerDiv.innerHTML = `Player ${i + 1}<br>$${player.chips}<div class="${id}_cards"></div>`;
		this.gameState.players.push(player);

	}
}//»
startGame(){//«
	const{id}=this;
	cwarn(`Starting game: ${this.gameState.num}`);
	this.numPlayers = this.playerTypes.length;
	this.gameState.phase = 'preflop';
	this.gameState.deck = [...DECK];
	this.shuffle(this.gameState.deck);
	this.initPlayers();
	this.dealHands();

	this.stat(`Player ${this.gameState.dealer+1} has the dealer button`);
	let butDiv = document.getElementById(`${id}_dealer-button-${this.gameState.dealer}`);
	butDiv.style.display="block";

	this.gameState.currentPlayer = (this.gameState.dealer + 1) % this.numPlayers;
	this.gameState.currentBet = 10;
	let sb_player = this.curPlayer();
	sb_player.chips -= Math.min(10, sb_player.chips);
	sb_player.bet = Math.min(10, sb_player.chips);
	sb_player.total = sb_player.bet;
	sb_player.betDiv.innerHTML = `${sb_player.bet}`;
	this.stat(`Player ${this.curNum()} bets ${sb_player.bet} in the small blind`);
	this.gameState.pot += Math.min(10, sb_player.chips);

	if (sb_player.chips === 0) {
		sb_player.allIn = true;
	}

	this.incCurPlayer();

	let bb_player = this.curPlayer();
	bb_player.chips -= Math.min(20, bb_player.chips);
	bb_player.bet = Math.min(20, bb_player.chips);
	bb_player.total = bb_player.bet;
	bb_player.betDiv.innerHTML = `${bb_player.bet}`;
	this.stat(`Player ${this.curNum()} bets ${bb_player.bet} in the big blind`);
	this.gameState.pot += Math.min(20, bb_player.chips);
	if (bb_player.chips === 0) {
		bb_player.allIn = true;
	}
	this.gameState.currentBet = 20;

	this.incCurPlayer();

	this.updatePlayerDisplay();
	this.updatePot();
	this.stat(`Player ${this.gameState.currentPlayer + 1}'s turn`);
	if (this.curType() !== 'live' || this.curPlayer().allIn) {
		this.automatedAction();
	}
	else {
		this.controlsElem.style.display = 'flex';
	}
}//»

onkill(){//«
this.styleElem.remove();
this.reInit = this.appArg
}//»
onappinit(arg={}){//«
arg = arg.reInit || arg;
this.appArg = arg;
this.playerTypes = arg.playerTypes;
this.startGame();
}//»
onkeydown(e, k){//«
//let k = e.key;
//return;
if (this.controlsElem.style.display === "none" || this.gameState.players[this.gameState.currentPlayer].type !== 'live') return;
this.actionKey(k);

}//»

}







/*Old«
//«
if (k=="Escape"){
wrn("Game reset!");
	this.newGame();
	return;
}
if (this.gameState.phase==='setup'){
	if (k=="ENTER_") {
//Check for at least one live player...
if (!this.getPlayerTypes().includes("live")) {
wrn(`Must have at least one "live" player!`);
return;
}
		return this.startGame();
	}

	if (k.match(/^[2-9]$/)){
		numPlayersSelect.value = k;
		this.updateNumPlayers();
	}
	return;
}
//»
newGame(){//«
const {id}=this;
this.gameState = {
		num: this.gameState.num+1,
		players: [],
		communityCards: [],
		pot: 0,
		currentPlayer: 0,
		dealer: 0,
		phase: 'setup',
		currentBet: 0,
		deck: [],
	};

//	setupElem.style.display = 'block';
	this.controlsElem.style.display = 'none';
	this.commCardsElem.innerHTML = '';
	this.potElem.textContent = 'Pot: $0';
//	statusElem.textContent = '';
	this.tableElem.querySelectorAll(`.${id}_player`).forEach(el => el.remove());
	this.tableElem.querySelectorAll(`.${id}_dealer-button`).forEach(el => el.remove());
	this.betRingElem.querySelectorAll(`.${id}_bet`).forEach(el => el.remove());

}//»
getPlayerTypes(){//«
	playerTypes = Array.from(document.querySelectorAll('.player-type')).map(select => select.value);
	return playerTypes;
}//»
updateNumPlayers(){//«
	const num = parseInt(numPlayersSelect.value);
	playerTypesDiv.innerHTML = '';
	for (let i = 0; i < num; i++) {
		const select = document.createElement('select');
		select.className = 'player-type';
		['live', 'random', 'foldbot', 'expert'].forEach(type => {
			const option = document.createElement('option');
			option.value = type;
			option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
			select.appendChild(option);
		});
		playerTypesDiv.appendChild(select);
		playerTypesDiv.appendChild(document.createElement('br'));
	}
}//»
»*/

