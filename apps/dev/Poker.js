/*
The total reported in the showdown doesn't include the river bets?
*/
/*«
Object.getOwnPropertyNames(LOTW.apps["dev.Poker"].prototype)
getters:

curPlayer
curType
curPlayerNum

keep:

constructor
playerAction
automatedAction
nextPlayer
nextPhase
newHand
endHand
initPlayers
startGame

»*/
/*«
The inner area is for the community cards and the pot

The "pot ring" is the next outer ring, where the total bets of all previous rounds
are tallied. If an all-in player could not cover the bet of an earlier, this will
be less than everyone still in who has covered their bets.

The "bet ring" is the outermost level where the bets are placed for the current hand.
»*/

//Imports«
const{mk, log, cwarn, cerr}=LOTW.api.util;
//»

let SILENT = false;
//let SILENT = true;

//Globals«

const DECK = [];
{
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
let i = 0;
for (let rank of RANKS) {
	for (let suit of SUITS) {
		DECK.push({ i, rank, suit });
		i++;
	}
}
//log(DECK);
}

const TABLE_WID = 800;
const TABLE_HGT = 400;

const BET_RING_WID = 600;
const BET_RING_HGT = 250;

const POT_RING_WID = 330;
const POT_RING_HGT = 145

//»

export const app = class {

constructor(Win){//«

this.id = Win.id;
this.Win = Win;
this.Main = Win.Main;
this.statBar = this.Win.statusBar;
this.makeDOM();

}//»

makeDOM(){//«

this.tableWid = TABLE_WID;
this.tableHgt = TABLE_HGT;
this.betRingWid = BET_RING_WID;
this.betRingHgt = BET_RING_HGT;
this.potRingWid = POT_RING_WID;
this.potRingHgt = POT_RING_HGT;

this.radiusX = this.tableWid / 2;
this.radiusY = this.tableHgt / 2;

this.betRadX = this.betRingWid/2;
this.betRadY = this.betRingHgt/2;

this.potRadX = this.potRingWid/2;
this.potRadY = this.potRingHgt/2;

const{id, Main} = this;

let potId = `${id}_pot`;
let ctrlId = `${id}_controls`;
let statCl = `${id}_status`;
let butCl = `${id}_button`;
let tableId = `${id}_poker-table`;
let commCardsId = `${id}_community-cards`;
let betRingId = `${id}_bet-ring`;
let potRingId = `${id}_pot-ring`;

//CSS«
Main._bgcol="#200904"; 
Main._dis="flex";
Main.style.justifyContent="center";
Main.style.alignItems="center";
Main._pad="";
Main._over="hidden";
const styleElem = mk('style');
styleElem.innerHTML=`
#${tableId} { 
	position: absolute; 
	width: ${this.tableWid}px; 
	height: ${this.tableHgt}px; 
//	background: #2e7d32; 
	background: #1e5d22; 
	border-radius: 50%; 
	border: 10px solid #3e2723; 
	display: flex; 
	justify-content: center; 
	align-items: center; 
}
#${betRingId} { 
	position: absolute; 
	width: ${this.betRingWid}px; 
	height: ${this.betRingHgt}px; 
//	border-radius: 50%; 
//	border: 1px dotted  #000; 
	display: flex; 
}
#${potRingId} { 
	position: absolute; 
	width: ${this.potRingWid}px; 
	height: ${this.potRingHgt}px; 
//	border-radius: 50%; 
//	border: 1px dotted  #000; 
	display: flex; 
}
#${ctrlId} { 
	position: absolute; 
	top: 5px; 
	right: 5px; 
	background: rgba(0, 0, 0, 0.7); 
	padding: 7px; 
	border-radius: 5px; 
	display: flex; 
	flex-direction: column; 
	align-items: center; 
	z-index: 10; 
}
#${commCardsId} { 
	position: absolute; 
	top: 50%; left: 50%; 
	transform: translate(-50%, -50%); 
	display: flex;
	gap: 5px; 
	min-width: 224px;
	min-height: 32px;
//	border: 1px dotted black;
//	border-radius: 3px; 
}
#${potId} { 
	position: absolute; 
	top: 5px;
	left: 5px;
	width: auto;
	height: auto;
//	top: 55%;
//	left: 50%; 
//	transform: translate(-50%, -50%); 
	font-size: 28px;
	font-weight: bold;
	color: #eee;
//	border: 1px dotted #ccc;
//	border-radius: 3px; 
}
#${ctrlId} button { 
	padding: 10px 20px; 
	background: #202050; 
	color: #fff; 
	border: none; 
	border-radius: 5px; 
	cursor: pointer; 
	font-size: 18px; 
}
.${id}_bet { 
	color: #fff;
	position: absolute;
	width: 30px; 
	height: 30px; 
//	border: 1px dotted  #000; 
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
	border: 2px solid #fff; 
	border-radius: 5px; 
	display: flex; 
	flex-direction: column; 
	justify-content: center; 
	align-items: center; 
}
.${id}_player.current {
	border-color: #ffd700;
}
.${id}_player.folded { 
	border-color: #ccc;
	background: #333;
	color: #ccc;
}
.${id}_active-player { 
	background: #444;
	color: #fff;
}
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
.${id}_folded-card {
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
.${id}_controls button:hover { background: #0277bd; }
.${id}_controls button:disabled { background: #616161; cursor: not-allowed; }
.${id}_setup label { margin-right: 10px; }
.${id}_setup select, .setup button { padding: 5px; margin: 5px; }
`;
//»
document.head.appendChild(styleElem);

//HTML«
Main.innerHTML = `
<div id="${ctrlId}" style="display: none;">
<div class="${statCl}"></div>
<div>
<button class="${butCl}">Fold</button>
<button class="${butCl}">Call</button>
<button class="${butCl}">Raise</button>
<button class="${butCl}">All-In</button>
</div>
</div>
<div id="${tableId}">
<div id="${commCardsId}"></div>
</div>
<div id="${betRingId}"></div>
<div id="${potRingId}"></div>
<div id="${potId}"></div>
`;
this.tableElem = document.getElementById(tableId);
this.controlsElem = document.getElementById(ctrlId);
this.betRingElem = document.getElementById(betRingId);
this.potRingElem = document.getElementById(potRingId);
this.potElem = document.getElementById(potId);
this.commCardsElem = document.getElementById(commCardsId);

//»

this.styleElem = styleElem;

}//»

get curPlayer(){//«
	return this.gameState.players[this.gameState.currentPlayer];
}//»
get curType(){//«
	return this.gameState.players[this.gameState.currentPlayer].type;
}//»
get curPlayerNum(){//«
	return this.gameState.currentPlayer;
}//»

incCurPlayer(){//«
	this.gameState.currentPlayer=(this.gameState.currentPlayer+1) % this.numPlayers;
}//»
stat(message, opts={}){//«
	this.statBar.textContent = message;
if (SILENT) return;
if (opts.warn) cwarn(message);
else log(message);
}//»
updatePlayerDisplay(){//«
	const{id}=this;
//log(this.gameState.currentPlayer);
	this.gameState.players.forEach((player, i) => {
		const playerDiv = document.querySelector(`.${id}_player-${i}`);
		if (playerDiv) {
			playerDiv.classList.toggle('current', i === this.gameState.currentPlayer && player.inHand && !player.allIn);
			const cardsDiv = playerDiv.querySelector(`.${id}_cards`);
			if (!player.inHand) {
				cardsDiv.innerHTML=`<span class="${id}_card ${id}_folded-card">&nbsp;</span><span class="${id}_card ${id}_folded-card">&nbsp;</span>`;
			}
			else {
				cardsDiv.innerHTML = player.hand.map(card => `<span class="${id}_card ${card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'}">${card.rank}${card.suit}</span>`).join('');
			}
//			playerDiv.innerHTML = `Player ${i + 1}<br>${player.chips}${player.allIn ? ' (All-In)' : ''}<div class="${id}_cards">${cardsDiv.innerHTML}</div>`;
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
	this.potElem.textContent = `${this.gameState.pot}`;
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
	const player = this.curPlayer;
	if (!player.inHand || player.allIn) {
		this.nextPlayer();
		return;
	}

	let action;
	switch (player.strategy) {//«
		case 'random':
			action = ['fold', 'call', 'raise', 'all-in'][Math.floor(Math.random() * 4)];
			break;
		case 'foldbot':
			action = 'fold';
			break;
		case 'shovebot':
			action = 'all-in';
			break;
		case 'expert':
			action = this.expertStrategy(player);
			break;
		default:
			action = 'call';
	}//»
	this.playerAction(action);
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

evaluate(hand, readable, score_only){//«
readable = true;
//Parameters to evaluate:
//@hand: array of 5 integers in the range 0-51 (the player's cards)
//@readable: boolean (a humanly readable representation of the hand)
//@score_only: boolean (only return the basic score, and not any tie-breaking cards)

const POKER_RANK_WORDS = [ "Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Jack","Queen","King","Ace" ];

const RANK_STRFL = 9;

//High multi-rank
const RANK_QUAD = 8;
const RANK_FULL = 7;

//Multi-suit
const RANK_FLUSH = 6;

//Sequential
const RANK_STRAIT = 5;

//Low multi-rank
const RANK_TRIP = 4;
const RANK_TWOPR = 3;
const RANK_PAIR = 2;
const RANK_HIGH = 1;


//Tracks the number of duplicates for each rank
const dups=[0,0,0,0,0,0,0,0,0,0,0,0,0];

const c1 = hand[0];
const suit1 = c1%4;//first suit
let handlen = hand.length;
let r1 = Math.floor(c1/4);//first rank
dups[r1]=1;

let r2,r3,r4,r5;//«
let hi = r1;
let lo = r1;

let is_pair;
let is_trips;
let is_quads;
let is_2pair;
let pair_rank1;
let pair_rank2;
let trips_rank;
let quad_rank;
let c2,c3,c4,c5;
let hand_len = hand.length;
let is_flush;
if (hand_len < 5) is_flush = false;
else is_flush = true;

//»
for (let i=1; i < hand_len; i++) {//«
	let num = hand[i];
	if (is_flush&&Math.floor(num%4)!==suit1)is_flush=false;
	const r = Math.floor(num/4);
	switch (i){//Unsorted ranks«
		case 1:{r2=r;c2=num;break;}
		case 2:{r3=r;c3=num;break;}
		case 3:{r4=r;c4=num;break;}
		case 4:{r5=r;c5=num;break;}
	}//»
//OLDRANKSORTINGHERE
	dups[r]+=1;
	const ndup = dups[r];
	if (ndup == 1) {//«
		if (r > hi) hi = r;
		else if (r < lo) lo = r;
	}
	else if (ndup == 2) {
		if (is_pair) {
			is_2pair = true;
			pair_rank2 = r;
		}
		else{
			pair_rank1 = r;
		}
		is_pair = true;
	}
	else if (ndup == 3) {
		is_trips = true;
		trips_rank = r;
	}
	else if (ndup == 4) {
		is_quads = true;
		quad_rank = r;
	}//»
}//»

const diff = hi-lo;
let is_straight = !is_pair && handlen == 5 && diff == 4;
const is_fullhouse = is_2pair && is_trips;
let hand_rank;
let hand_class;
let str_hand;
let rem_cards = [];//At most 4 integers depending on the hand

if (is_pair){//«

	if (is_trips){//«

		if (is_quads){//«

			hand_class = RANK_QUAD;
			hand_rank = 1<<29;
			hand_rank |= quad_rank << 20;
			if (!score_only) {
				if (r1!=quad_rank) rem_cards.push(r1);
				if (r2!=quad_rank) rem_cards.push(r2);
				if (r3!=quad_rank) rem_cards.push(r3);
				if (r4!=quad_rank) rem_cards.push(r4);
				if (r5!=quad_rank) rem_cards.push(r5);
				if (readable) str_hand=`Quad ${POKER_RANK_WORDS[quad_rank]}s`;
			}

		}//»
		else if (is_fullhouse){//«

			hand_class = RANK_FULL;
			hand_rank = 1<<28;
			hand_rank |= trips_rank << 20;
			if (readable) str_hand=`${POKER_RANK_WORDS[trips_rank]}s over`;
			if (pair_rank1 === trips_rank){
				hand_rank |= pair_rank2 << 16;
				if (readable) str_hand+=` ${POKER_RANK_WORDS[pair_rank2]}s`;
			}
			else{
				hand_rank |= pair_rank1 << 16;
				if (readable) str_hand+=` ${POKER_RANK_WORDS[pair_rank1]}s`;
			}

		}//»
		else{//trips«

			hand_class = RANK_TRIP;
			hand_rank = 1<<25;
			hand_rank |= trips_rank << 20;

			if (!score_only) {
				if (r1!=trips_rank) rem_cards.push(r1);
				if (r2!=trips_rank) rem_cards.push(r2);
				if (r3!=trips_rank) rem_cards.push(r3);
				if (r4!=trips_rank) rem_cards.push(r4);
				if (r5!=trips_rank) rem_cards.push(r5);
				if (readable) str_hand=`Trip ${POKER_RANK_WORDS[trips_rank]}s`;
			}

		}//»

	}//»
	else if (is_2pair){//«

		hand_class = RANK_TWOPR;
		hand_rank = 1<<24;
		if (pair_rank1 > pair_rank2){
			hand_rank |= pair_rank1 << 20;
			hand_rank |= pair_rank2 << 16;
			if (readable) str_hand=`${POKER_RANK_WORDS[pair_rank1]}s and ${POKER_RANK_WORDS[pair_rank2]}s`;
		}
		else{
			hand_rank |= pair_rank2 << 20;
			hand_rank |= pair_rank1 << 16;
			if (readable) str_hand=`${POKER_RANK_WORDS[pair_rank2]}s and ${POKER_RANK_WORDS[pair_rank1]}s`;
		}
		if (!score_only) {
			if (!(r1==pair_rank1||r1==pair_rank2)) rem_cards.push(r1);
			if (!(r2==pair_rank1||r2==pair_rank2)) rem_cards.push(r2);
			if (!(r3==pair_rank1||r3==pair_rank2)) rem_cards.push(r3);
			if (!(r4==pair_rank1||r4==pair_rank2)) rem_cards.push(r4);
			if (!(r5==pair_rank1||r5==pair_rank2)) rem_cards.push(r5);
		}

	}//»
	else{//just a pair//«

		hand_class = RANK_PAIR;
		hand_rank = 1<<23;
		hand_rank |= pair_rank1 << 16;
		if (!score_only) {
			if (r1!=pair_rank1) rem_cards.push(r1);
			if (r2!=pair_rank1) rem_cards.push(r2);
			if (r3!=pair_rank1) rem_cards.push(r3);
			if (r4!=pair_rank1) rem_cards.push(r4);
			if (r5!=pair_rank1) rem_cards.push(r5);
			if (readable) str_hand=`${POKER_RANK_WORDS[pair_rank1]}s`;
		}
	}//»

}//»
else if (is_straight){//Straight/Straight-flush«

	if (is_flush){

		hand_class = RANK_STRFL;
		hand_rank = 1<<30;
		hand_rank |= hi << 16;
		if (readable) str_hand =`${POKER_RANK_WORDS[hi]} high straight flush`;

	}
	else{

		hand_class = RANK_STRAIT;
		hand_rank = 1<<26;
		hand_rank |= hi << 16;
		if (readable) str_hand=`${POKER_RANK_WORDS[hi]} high straight`;

	}
}//»
else{//5-high Straight (Straight-Flush) and hi card only«

if (handlen == 5 && diff==12){//«
if ((r1==hi&&r2==lo)||(r1==lo&&r2==hi)){
if (!(r3>3||r4>3||r5>3)) is_straight=true;
}
else if ((r1==hi&&r3==lo)||(r1==lo&&r3==hi)){
if (!(r2>3||r4>3||r5>3)) is_straight=true;
}
else if ((r1==hi&&r4==lo)||(r1==lo&&r4==hi)){
if (!(r3>3||r2>3||r5>3)) is_straight=true;
}
else if ((r1==hi&&r5==lo)||(r1==lo&&r5==hi)){
if (!(r3>3||r4>3||r2>3)) is_straight=true;
}
else if ((r2==hi&&r3==lo)||(r2==lo&&r3==hi)){
if (!(r1>3||r4>3||r5>3)) is_straight=true;
}
else if ((r2==hi&&r4==lo)||(r2==lo&&r4==hi)){
if (!(r3>3||r1>3||r5>3)) is_straight=true;
}
else if ((r2==hi&&r5==lo)||(r2==lo&&r5==hi)){
if (!(r3>3||r4>3||r1>3)) is_straight=true;
}
else if ((r3==hi&&r4==lo)||(r3==lo&&r4==hi)){
if (!(r1>3||r2>3||r5>3)) is_straight=true;
}
else if ((r3==hi&&r5==lo)||(r3==lo&&r5==hi)){
if (!(r1>3||r4>3||r2>3)) is_straight=true;
}
else if ((r4==hi&&r5==lo)||(r4==lo&&r5==hi)){
if (!(r1>3||r2>3||r3>3)) is_straight=true;
}
}//»

	if (is_flush) {//«
		if (is_straight) {

			hand_class = RANK_STRFL;
			hand_rank = 1<<30;
			hand_rank |= 3<<16;//The 5 is the high card
			if (readable) str_hand=`Five high straight flush`;

		}
		else {

			hand_class = RANK_FLUSH;
			hand_rank = 1<<27;
			hand_rank |= hi << 16;
			if (!score_only) {
				if (r1!=hi) rem_cards.push(r1);
				if (r2!=hi) rem_cards.push(r2);
				if (r3!=hi) rem_cards.push(r3);
				if (r4!=hi) rem_cards.push(r4);
				if (r5!=hi) rem_cards.push(r5);
				if (readable) str_hand=`${POKER_RANK_WORDS[hi]} high flush`;
			}

		}
	}//»
	else if (is_straight){//«

		hand_class = RANK_STRAIT;
		hand_rank = 1<<26;
		hand_rank |= 3<<16;//The 5 is the high card
		if (readable) str_hand=`Five high straight`;

	}//»
	else {//«

		hand_class = RANK_HIGH;
		hand_rank = 1<<22;
		hand_rank |= hi << 16;

		if (!score_only) {
			if (r1!=hi) rem_cards.push(r1);
			if (r2!=hi) rem_cards.push(r2);
			if (r3!=hi) rem_cards.push(r3);
			if (r4!=hi) rem_cards.push(r4);
			if (r5!=hi) rem_cards.push(r5);
			if (readable) str_hand=`${POKER_RANK_WORDS[hi]} high`;
		}

	}//»

}//»

return {
	left: rem_cards,
	class: hand_class,
	score: hand_rank,
	text: str_hand,
};

}//»
evaluateAllRiver(a){//«
const{evaluate} = this;
//We always have 7 cards here
//Using both hole cards
let h1=evaluate([a[0],a[1],a[4],a[5],a[6]]),//12 --567
h2=evaluate([a[0],a[1],a[3],a[5],a[6]]),//12 -4-67
h3=evaluate([a[0],a[1],a[3],a[4],a[6]]),//12 -45-7
h4=evaluate([a[0],a[1],a[3],a[4],a[5]]),//12 -456-
h5=evaluate([a[0],a[1],a[2],a[5],a[6]]),//12 3--67
h6=evaluate([a[0],a[1],a[2],a[4],a[6]]),//12 3-5-7
h7=evaluate([a[0],a[1],a[2],a[4],a[5]]),//12 3-56-
h8=evaluate([a[0],a[1],a[2],a[3],a[6]]),//12 34--7
h9=evaluate([a[0],a[1],a[2],a[3],a[5]]),//12 34-6-
h10=evaluate([a[0],a[1],a[2],a[3],a[4]]),//12 345--

//Using 1 hole card
h11=evaluate([a[1],a[3],a[4],a[5],a[6]]),//-2 -4567
h12=evaluate([a[1],a[2],a[4],a[5],a[6]]),//-2 3-567
h13=evaluate([a[1],a[2],a[3],a[5],a[6]]),//-2 34-67
h14=evaluate([a[1],a[2],a[3],a[4],a[6]]),//-2 345-7
h15=evaluate([a[1],a[2],a[3],a[4],a[5]]),//-2 3456-
h16=evaluate([a[0],a[3],a[4],a[5],a[6]]),//1- -4567
h17=evaluate([a[0],a[2],a[4],a[5],a[6]]),//1- 3-567
h18=evaluate([a[0],a[2],a[3],a[5],a[6]]),//1- 34-67
h19=evaluate([a[0],a[2],a[3],a[4],a[6]]),//1- 345-7
h20=evaluate([a[0],a[2],a[3],a[4],a[5]]),//1- 3456-

//Using 0 hole cards
h21=evaluate([a[2],a[3],a[4],a[5],a[6]]);//-- 34567

let all = [h1,h2,h3,h4,h5,h6,h7,h8,h9,h10,h11,h12,h13,h14,h15,h16,h17,h18,h19,h20,h21];
all = all.sort((a,b)=>{
	if (a.score > b.score) return -1;
	if (a.score < b.score) return 1;
	return 0;
});

return all[0];

}//»
showdown(players){//«
const {gameState} = this;
const {communityCards} = gameState;

//log(players);
//log(communityCards);
for (let p of players){
	p.numHand = p.hand.map(c => c.i);
}
let c = communityCards.map(c => c.i);
//log(players)
//log(c);
//log(comm);
//return;

//Evaluate the hands«

let total_awarded = 0;
let active_players=players;
let num_folded = 0;
//let c = table_cards;

for (let i=0; i < active_players.length; i++){
	let player = active_players[i];
//Folded players are considered "active" because of their chip contribution to
//the main pot, but they are given a fake hand evaluation that cannot possibly
//beat anything in a showdown. The hypothetical case in which every player at
//this point has folded cannot logically exist.
//	if (!player.result) {
//No one who pushes all-in before the river will have a result
	player.result = this.evaluateAllRiver([player.numHand[0], player.numHand[1], c[0],c[1],c[2],c[3],c[4]]);
//	}
//	active_players.push(player);
}
//log(active_players);
//»
//Compare the hands and award the pot(s)
/*
{//Give back the difference to whoever has contributed more than anyone to the pot«

	let sorted = active_players
	.filter(player=>{return !player.folded;})
	.sort((a,b)=>{
		if (a.total > b.total) return -1;
		if (a.total < b.total) return 1;
		return 0;
	});
	let p1 = sorted[0];
	let p2 = sorted[1];
	let diff = (p1.total - p2.total);
	if (diff){
		p1.total -= diff;
		p1.chips += diff;
		pot -= diff;
	}
}//»
*/
//let pot_num = 1;
let pot_num = 1;
while (active_players.length) {
if (pot_num==1) {
	this.stat(`Main Pot Showdown (Pot #${pot_num})`, {warn: true});
}
else {
	this.stat(`Side Pot Showdown (Pot #${pot_num})`, {warn: true});
}
//this.stat();
for (let p of active_players) {
	this.stat(`Player ${p.id+1} has: ${p.result.text} (in for ${p.total} chips)`);
}
//pot_iter++;
//The first iteration of this loop is the main pot, followed by any side pots
//(side pots result from the players that are forced to go all-in upon calling
//because they could not cover the bet on the table)

let num_winners=0;

let low_bet = Infinity;//«
//YTSHJKFSMROS
let folded_bets = 0;
let num_folded_players = 0;
for (let player of active_players) {
	if (player.folded) {
		folded_bets+=player.total;
		num_folded_players++;
	}
	else if (player.total < low_bet) low_bet = player.total;
}
let cur_total_bet = low_bet;
let cur_pot = folded_bets + cur_total_bet * (active_players.length - num_folded_players);
//»

//Set this to zero after reporting on the first showdown
//This is just a cosmetic variable not internally _used_ for anything
num_folded = 0;
let sorted = active_players.sort((a,b)=>{//«
	if (a.result.score > b.result.score) return -1;
	if (a.result.score < b.result.score) return 1;
	return 0;
});//»
let hi = sorted[0].result.score;//«
let winners = sorted.filter(player=>{
	return player.result.score == hi;
});
let losers = sorted.filter(player=>{
	return player.result.score < hi;
});

//»

//Test the kickers
if (winners.length > 1){//«
	let hi = 0;
	for (let winner of winners){
		let sorted = winner.result.left.sort((a,b)=>{
			if (a > b) return -1;
			if (a < b) return 1;
			return 0;
		});
		let s='';
		for (let num of sorted){
			if (num < 10) num='0'+num;
			s+=num;
		}
		let val = parseInt(s);
		if (val > hi) hi = val;
		winner.kicker_value = val;
	}
	if (hi) {
		let new_winners=[];
		for (let winner of winners){
			if (winner.kicker_value == hi) new_winners.push(winner);
			else losers.push(winner);
		}
		winners = new_winners;
	}
}//»

//Make the number of chips an integer
let chips_per_winner = Math.floor(cur_pot / winners.length);
//Any extra chips should get awarded to the game winner

//extra_chips += cur_pot - (chips_per_winner * winners.length);

for (let winner of winners){//«
	this.stat(`Player ${winner.id+1} wins with ${winner.result.text}`, {warn: true});
	winner.chips += chips_per_winner;
	total_awarded += chips_per_winner;
}//»
let net_per_winner = chips_per_winner - cur_total_bet;//«
if (net_per_winner > 0) {
	for (let player of winners){
		num_winners++;
	}
}//»

for (let i=0; i < active_players.length; i++){//«
	let player = active_players[i];
	player.total-=cur_total_bet;
	if (player.total < 1){
		active_players.splice(i, 1);
		i--;
	}
}
if (active_players.length==1){//«
//	active_players[0].chips += pot - total_awarded;
	active_players = [];
}//»

//*/

pot_num++;

}//»

}//»

resetBetStates() {//«
	this.gameState.currentBet = -1;
	this.gameState.players.forEach(p => {
		let pot = parseInt(p.potDiv.innerText || "0");
		pot += p.bet >= 0 ? p.bet : 0;
		p.potDiv.innerText = pot;
		p.bet = -1;
		p.betDiv.innerHTML = '';
	});
	this.gameState.bigBlindActed = false;
	this.gameState.raisesThisRound = 0; // Reset raise counter
}//»
setTableGuiDims(){//«

}//»
initGameState() {//«
	this.gameState = {
		num: 0,
		players: [],
		communityCards: [],
		pot: 0,
		currentPlayer: 0,
		dealer: 0,
		currentBet: -1,
		deck: [],
		bigBlindActed: false,
		raisesThisRound: 0 // Add raise counter
	};
}//»

initPlayerDOM(i){//«

	const{id, radiusX, radiusY, betRadX, betRadY, potRadX, potRadY, tableWid, tableHgt, angleStep}=this;

	const angle = i * this.angleStep - Math.PI / 2;
	let player_off = 40;
	let but_angle_off = 0.25;

	const player_x = radiusX + radiusX * Math.cos(angle) - player_off;
	const player_y = radiusY + radiusY * Math.sin(angle) - player_off;

	const bet_x = betRadX + betRadX * Math.cos(angle) - 20;
	const bet_y = betRadY + betRadY * Math.sin(angle) - 20;

	const pot_x = potRadX + potRadX * Math.cos(angle) - 20;
	const pot_y = potRadY + potRadY * Math.sin(angle) - 20;

	const but_x = (tableWid/ 2) + radiusX * Math.cos(angle+but_angle_off);
	const but_y = (tableHgt / 2) + radiusY * Math.sin(angle+but_angle_off);
	const butDiv = document.createElement('div');
	butDiv.className = `${id}_dealer-button`;
	butDiv.id = `${id}_dealer-button-${i}`;
	butDiv.style.left = `${but_x}px`;
	butDiv.style.top = `${but_y}px`;

	const playerDiv = document.createElement('div');
	playerDiv.className = `${id}_player ${id}_active-player ${id}_player-${i}`;
	playerDiv.style.left = `${player_x}px`;
	playerDiv.style.top = `${player_y}px`;

	const betDiv = document.createElement('div');
	betDiv.className = `${id}_bet`;
	betDiv.style.left = `${bet_x}px`;
	betDiv.style.top = `${bet_y}px`;

	const potDiv = document.createElement('div');
	potDiv.className = `${id}_bet`;
	potDiv.style.left = `${pot_x}px`;
	potDiv.style.top = `${pot_y}px`;
	this.tableElem.appendChild(playerDiv);
	this.tableElem.appendChild(butDiv);

	this.betRingElem.appendChild(betDiv);
	this.potRingElem.appendChild(potDiv);

	return [playerDiv, betDiv, potDiv];

}//»
initPlayers(){//«
	const{id, playerTypes, numPlayers}=this;
	this.angleStep = (2 * Math.PI) / numPlayers;
	this.gameState.players = [];
	for (let i = 0; i < numPlayers; i++) {

		const playerType = this.playerTypes[i];
		const [playerDiv, betDiv, potDiv] = this.initPlayerDOM(i);

		const player = {
			id: i,
			type: playerType,
			chips: 1000,
			hand: [],
			inHand: true,
			bet: -1,
			total: 0,
			strategy: playerType,
			allIn: false,
			betDiv,
			potDiv,
			elem: playerDiv
		};
		playerDiv.innerHTML = `Player ${i + 1}<br>${player.chips}<div class="${id}_cards"></div>`;

		this.stat(`Player ${i+1} is a "${player.type}" type`);
		this.gameState.players.push(player);
	}

}//»
startGame() {//«
	const { id } = this;
	this.stat(`Starting game: ${this.gameState.num}`, {warn: true});
	this.gameState.phase = 'preflop';
	this.gameState.deck = [...DECK];
	this.shuffle(this.gameState.deck);

	this.dealHands();
	this.gameState.raisesThisRound = 0; // Initialize raise counter

	this.stat(`Player ${this.gameState.dealer + 1} has the dealer button`);
	let butDiv = document.getElementById(`${id}_dealer-button-${this.gameState.dealer}`);
	butDiv.style.display = "block";

	this.gameState.currentPlayer = (this.gameState.dealer + 1) % this.numPlayers;
	this.gameState.currentBet = 10;
	let sb_player = this.curPlayer;
	sb_player.chips -= Math.min(10, sb_player.chips);
	sb_player.bet = Math.min(10, sb_player.chips);
	sb_player.total = sb_player.bet;
	sb_player.betDiv.innerHTML = `${sb_player.bet}`;
	this.stat(`Player ${this.curPlayerNum + 1} bets ${sb_player.bet} in the small blind`);
	this.gameState.pot += Math.min(10, sb_player.chips);

	if (sb_player.chips === 0) {
		sb_player.allIn = true;
	}

	this.incCurPlayer();

	let bb_player = this.curPlayer;
	bb_player.chips -= Math.min(20, bb_player.chips);
	bb_player.bet = Math.min(20, bb_player.chips);
	bb_player.total = bb_player.bet;
	bb_player.betDiv.innerHTML = `${bb_player.bet}`;
	this.stat(`Player ${this.curPlayerNum + 1} bets ${bb_player.bet} in the big blind`);
	this.gameState.pot += Math.min(20, bb_player.chips);
	if (bb_player.chips === 0) {
		bb_player.allIn = true;
	}
	this.gameState.currentBet = 20;

	this.incCurPlayer();

	this.updatePlayerDisplay();
	this.updatePot();
	this.stat(`Player ${this.curPlayerNum + 1}'s turn`);
	if (this.curType !== 'live' || this.curPlayer.allIn) {
		this.automatedAction();
	} else {
		this.controlsElem.style.display = 'flex';
	}
}//»

nextPlayer() {//«
	const { gameState } = this;
	let activePlayers = gameState.players.filter(p => p.inHand && !p.allIn).length;
	let playersInHand = gameState.players.filter(p => p.inHand).length;
	let bigBlindIndex = (gameState.dealer + 2) % gameState.players.length;

	if (playersInHand <= 1) {
		this.endHand();
		return;
	}

	let betsEqual = gameState.players.every(p => !p.inHand || p.allIn || (p.bet >= 0 && p.bet === gameState.currentBet));

	if (betsEqual && (gameState.phase !== 'preflop' || gameState.bigBlindActed)) {
		if (gameState.phase !== 'river') {
			this.nextPhase();
		} else {
			this.endHand();
		}
		return;
	}

	this.incCurPlayer();
	let startPlayer = gameState.currentPlayer;
	while (!gameState.players[gameState.currentPlayer].inHand || gameState.players[gameState.currentPlayer].allIn) {
		this.incCurPlayer();
		if (gameState.currentPlayer === startPlayer) {
			if (betsEqual || activePlayers <= 1) {
				if (gameState.phase !== 'river') {
					this.nextPhase();
				} else {
					this.endHand();
				}
				return;
			}
		}
	}

	this.stat(`Player ${gameState.currentPlayer + 1}'s turn`);

	this.updatePlayerDisplay();
	if (this.curType !== 'live') {
		this.automatedAction();
	} else {
		this.controlsElem.style.display = 'flex';
	}
}//»
playerAction(action) {//«
	const player = this.curPlayer;
	if (!player.inHand || player.allIn) {
		this.nextPlayer();
		return;
	}

	const bigBlindIndex = (this.gameState.dealer + 2) % this.gameState.players.length;
	const isBigBlind = this.gameState.currentPlayer === bigBlindIndex;

	if (action === 'raise') {
		if (this.gameState.raisesThisRound >= 3) {
			this.stat(`Raise limit reached, player ${player.id + 1} cannot raise`);
			return;
		}
		const minRaise = this.gameState.currentBet <= 0 ? 20 : this.gameState.currentBet * 2;
		const raiseAmount = Math.min(minRaise, player.chips + (player.bet < 0 ? 0 : player.bet));
		if (raiseAmount === player.chips + (player.bet < 0 ? 0 : player.bet)) {
			player.allIn = true;
			this.gameState.pot += player.chips;
			player.bet = player.bet < 0 ? player.chips : player.bet + player.chips;
			player.total += player.chips; // Increment by chips added to pot
			player.chips = 0;
			this.gameState.currentBet = Math.max(this.gameState.currentBet, player.bet);
			this.gameState.raisesThisRound++;
			this.stat(`Player ${player.id + 1} goes all-in with ${player.bet}`);
			if (isBigBlind) this.gameState.bigBlindActed = true;
		} else {
			const chipsToRaise = raiseAmount - (player.bet < 0 ? 0 : player.bet);
			player.chips -= chipsToRaise;
			this.gameState.pot += chipsToRaise;
			player.bet = raiseAmount;
			player.total += chipsToRaise; // Increment by chips added to pot
			this.gameState.currentBet = raiseAmount;
			this.gameState.raisesThisRound++;
			this.stat(`Player ${player.id + 1} raises to ${raiseAmount}`);
			if (isBigBlind) this.gameState.bigBlindActed = true;
		}
	}
	else if (action === 'call') {
		const callAmount = this.gameState.currentBet < 0 ? 0 : Math.min(this.gameState.currentBet - (player.bet < 0 ? 0 : player.bet), player.chips);
		if (callAmount === player.chips) {
			player.allIn = true;
			player.bet = player.bet < 0 ? player.chips : player.bet + player.chips;
			this.gameState.pot += player.chips;
			player.total += player.chips; // Increment by chips added to pot
			player.chips = 0;
			this.stat(`Player ${player.id + 1} goes all-in to call ${player.bet}`);
			if (isBigBlind) this.gameState.bigBlindActed = true;
		} else {
			player.chips -= callAmount;
			this.gameState.pot += callAmount;
			player.bet = player.bet < 0 ? callAmount : player.bet + callAmount;
			player.total += callAmount; // Increment by chips added to pot
			this.gameState.currentBet = Math.max(this.gameState.currentBet, player.bet);
			this.stat(`Player ${player.id + 1} ${callAmount === 0 ? 'checks' : `calls ${callAmount}`}`);
			if (isBigBlind) this.gameState.bigBlindActed = true;
		}
	} else if (action === 'all-in') {
		if (this.gameState.raisesThisRound >= 3 && player.chips + (player.bet < 0 ? 0 : player.bet) > this.gameState.currentBet) {
			this.stat(`Raise limit reached, player ${player.id + 1} cannot go all-in to raise`);
			return;
		}
		player.allIn = true;
		this.gameState.pot += player.chips;
		const newBet = player.bet < 0 ? player.chips : player.bet + player.chips;
		if (newBet > this.gameState.currentBet) {
			this.gameState.raisesThisRound++;
		}
		player.bet = newBet;
		player.total += player.chips; // Increment by chips added to pot
		this.gameState.currentBet = Math.max(this.gameState.currentBet, player.bet);
		player.chips = 0;
		this.stat(`Player ${player.id + 1} goes all-in with ${player.bet}`);
		if (isBigBlind) this.gameState.bigBlindActed = true;
	} else {
		player.inHand = false;
		this.stat(`Player ${player.id + 1} folds`);
		player.elem.classList.toggle('folded', true);
		if (isBigBlind) this.gameState.bigBlindActed = true;
	}

	player.betDiv.innerHTML = player.bet >= 0 ? `${player.bet}` : '';
	this.controlsElem.style.display = 'none';
	this.updatePot();
	this.nextPlayer();
	this.updatePlayerDisplay();
}//»
nextPhase() {//«
   const { gameState } = this;
   this.resetBetStates();
   if (gameState.phase === 'preflop') {
	   let b1 = this.dealCard();
	   let b2 = this.dealCard();
	   let b3 = this.dealCard();
	   this.stat(`Flop: ${b1.rank}${b1.suit} ${b2.rank}${b2.suit} ${b3.rank}${b3.suit}`);
	   gameState.communityCards = [b1, b2, b3];
	   gameState.phase = 'flop';
   } else if (gameState.phase === 'flop') {
	   let b4 = this.dealCard();
	   this.stat(`Turn: ${b4.rank}${b4.suit}`);
	   gameState.communityCards.push(b4);
	   gameState.phase = 'turn';
   } else if (gameState.phase === 'turn') {
	   let b5 = this.dealCard();
	   this.stat(`River: ${b5.rank}${b5.suit}`);
	   gameState.communityCards.push(b5);
	   gameState.phase = 'river';
   } else {
	   this.endHand();
	   return;
   }
   this.updateCommunityCards();
   gameState.currentPlayer = (gameState.dealer + 1) % gameState.players.length;
   let startPlayer = gameState.currentPlayer;
   while (!gameState.players[gameState.currentPlayer].inHand || gameState.players[gameState.currentPlayer].allIn) {
	   this.incCurPlayer();
	   if (gameState.currentPlayer === startPlayer) {
		   if (gameState.players.filter(p => p.inHand).length > 1) {
			   if (gameState.phase !== 'river') {
				   this.nextPhase();
			   } else {
				   this.endHand();
			   }
		   }
		   return;
	   }
   }
   this.stat(`Player ${gameState.currentPlayer + 1}'s turn`);
   this.updatePlayerDisplay();
   if (this.curType !== 'live') {
	   this.automatedAction();
   } else {
	   this.controlsElem.style.display = 'flex';
   }
}//»
resetGameState(){//«
	const{gameState}=this;
	gameState.pot = 0;
	gameState.communityCards = [];
	gameState.bigBlindActed = false;
	this.commCardsElem.innerHTML = "";
	gameState.players.forEach(p => {
//		p.elem.classList.toggle('current', false);
		p.elem.classList.toggle('folded', false);
		p.hand = [];
		p.inHand = true;
		p.allIn = false;
		p.bet = -1;
		p.total = 0;
//		p.chips
		p.betDiv.innerHTML="";
		p.potDiv.innerHTML="";
	});
}//»
newHand(){//«
	const{gameState}=this;
	gameState.num++;
	document.getElementById(`${this.id}_dealer-button-${gameState.dealer}`).style.display="none";
	gameState.dealer = (gameState.dealer + 1) % gameState.players.length;
//	document.getElementById(`${this.id}_dealer-button-${gameState.dealer}`).style.display="";
	this.resetGameState();
	this.startGame();
}//»
endHand(){//«
	const {gameState} = this;
	let activePlayers = gameState.players.filter(p => p.inHand);
	if (activePlayers.length > 1) {
//cwarn(`END STATE WITH ${activePlayers.length} PLAYERS`);
		this.showdown(activePlayers);
	}
	this.gameState.phase="ended";
}//»

onkill(){//«
	this.styleElem.remove();
	this.reInit = this.appArg
}//»
onappinit(arg={}){//«

arg = arg.reInit || arg;
this.appArg = arg;
this.playerTypes = arg.playerTypes || ["live", "live"];
this.numPlayers = this.playerTypes.length;
this.initGameState();
this.initPlayers();
this.startGame();

}//»
onkeydown(e, k){//«

if (k==="ENTER_"){
	if (this.gameState.phase==="ended"){
		this.newHand();
	}
	return;
}
if (this.controlsElem.style.display !== "none" && this.curType === 'live') {
	this.actionKey(k);
}

}//»

}




