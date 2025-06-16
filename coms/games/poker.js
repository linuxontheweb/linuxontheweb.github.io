//Imports«

const {Com} = LOTW.globals.ShellMod.comClasses;
const{log,jlog,cwarn,cerr,isPosInt}=LOTW.api.util;

//»

//Util«

const HITOLOW = (a,b)=>{if (a<b)return 1; if (a>b) return -1;};
const DIE=s=>{throw new Error(s);};
const NOCARDS=()=>{throw new Error("THe deck is out of cards");};
const POKER_RANK_CHS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const POKER_RANK_WORDS = [ "Two","Three","Four","Five","Sixe","Seven","Eight","Nine","Ten","Jack","Queen","King","Ace" ];

//this.rankSymbols = 

const evaluate = (hand, opts={}) => {//«

const {ifScore} = opts;

//const RANK = POKER_RANK_WORDS;

const STRFL = 9;

//High multi-rank
const QUAD = 8;
const FULL = 7;

//Multi-suit
const FLUSH = 6;

//Sequential
const STRAIT = 5;

//Low multi-rank
const TRIP = 4;
const TWOPR = 3;
const PAIR = 2;
const HIGH = 1;


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
/*Uncomment this for inline sorting of the ranks«
	let t;
	switch (ncards){
		case 2:{
			if (r<r1){r2=r1;r1=r;}
			else r2=r;
			break;
		}
		case 3:{
			if (r<r2){
				r3=r2;r2=r;
				if (r2<r1){t=r2;r2=r1;r1=t;}
			}
			else r3=r;
			break;
		}
		case 4:{
			if (r<r3){
				r4=r3;r3=r;
				if (r3<r2){
					t=r3;r3=r2;r2=t;
					if (r2<r1){t=r2;r2=r1;r1=t;}
				}
			}
			else r4=r;
			break;
		}
		case 5:{
			if (r<r4){
				r5=r4;r4=r;
				if (r4<r3){
					t=r4;r4=r3;r3=t;
					if (r3<r2){
						t=r3;r3=r2;r2=t;
						if (r2<r1){t=r2;r2=r1;r1=t;}
					}
				}
			}
			else r5=r;
			break;
		}
	}
»*/
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
let left = [];

if (is_pair){//«

	if (is_trips){//«

		if (is_quads){//«

			hand_class = QUAD;
			hand_rank = 1<<29;
			hand_rank |= quad_rank << 20;
			if (!ifScore) {
				if (r1!=quad_rank) left.push(r1);
				if (r2!=quad_rank) left.push(r2);
				if (r3!=quad_rank) left.push(r3);
				if (r4!=quad_rank) left.push(r4);
				if (r5!=quad_rank) left.push(r5);
				str_hand=`Quad ${POKER_RANK_WORDS[quad_rank]}s`;
			}

		}//»
		else if (is_fullhouse){//«

			hand_class = FULL;
			hand_rank = 1<<28;
			hand_rank |= trips_rank << 20;
			str_hand=`${POKER_RANK_WORDS[trips_rank]}s over`;
			if (pair_rank1 === trips_rank){
				hand_rank |= pair_rank2 << 16;
				str_hand+=` ${POKER_RANK_WORDS[pair_rank2]}s`;
			}
			else{
				hand_rank |= pair_rank1 << 16;
				str_hand+=` ${POKER_RANK_WORDS[pair_rank1]}s`;
			}

		}//»
		else{//trips«

			hand_class = TRIP;
			hand_rank = 1<<25;
			hand_rank |= trips_rank << 20;

			if (!ifScore) {
				if (r1!=trips_rank) left.push(r1);
				if (r2!=trips_rank) left.push(r2);
				if (r3!=trips_rank) left.push(r3);
				if (r4!=trips_rank) left.push(r4);
				if (r5!=trips_rank) left.push(r5);
				str_hand=`Trip ${POKER_RANK_WORDS[trips_rank]}s`;
			}

		}//»

	}//»
	else if (is_2pair){//«

		hand_class = TWOPR;
		hand_rank = 1<<24;
		if (pair_rank1 > pair_rank2){
			hand_rank |= pair_rank1 << 20;
			hand_rank |= pair_rank2 << 16;
			str_hand=`${POKER_RANK_WORDS[pair_rank1]}s and ${POKER_RANK_WORDS[pair_rank2]}s`;
		}
		else{
			hand_rank |= pair_rank2 << 20;
			hand_rank |= pair_rank1 << 16;
			str_hand=`${POKER_RANK_WORDS[pair_rank2]}s and ${POKER_RANK_WORDS[pair_rank1]}s`;
		}
		if (!ifScore) {
			if (!(r1==pair_rank1||r1==pair_rank2)) left.push(r1);
			if (!(r2==pair_rank1||r2==pair_rank2)) left.push(r2);
			if (!(r3==pair_rank1||r3==pair_rank2)) left.push(r3);
			if (!(r4==pair_rank1||r4==pair_rank2)) left.push(r4);
			if (!(r5==pair_rank1||r5==pair_rank2)) left.push(r5);
		}

	}//»
	else{//just a pair//«

		hand_class = PAIR;
		hand_rank = 1<<23;
		hand_rank |= pair_rank1 << 16;
		if (!ifScore) {
			if (r1!=pair_rank1) left.push(r1);
			if (r2!=pair_rank1) left.push(r2);
			if (r3!=pair_rank1) left.push(r3);
			if (r4!=pair_rank1) left.push(r4);
			if (r5!=pair_rank1) left.push(r5);
			str_hand=`${POKER_RANK_WORDS[pair_rank1]}s`;
		}
	}//»

}//»
else if (is_straight){//Straight/Straight-flush«

	if (is_flush){

		hand_class = STRFL;
		hand_rank = 1<<30;
		hand_rank |= hi << 16;
		str_hand = `${str_hand} flush`;
		str_hand=`${POKER_RANK_WORDS[hi]} high straight flush`;

	}
	else{

		hand_class = STRAIT;
		hand_rank = 1<<26;
		hand_rank |= hi << 16;
		str_hand=`${POKER_RANK_WORDS[hi]} high straight`;

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

			hand_class = STRFL;
			hand_rank = 1<<30;
			hand_rank |= 3<<16;//The 5 is the high card
			str_hand=`Five high straight flush`;

		}
		else {

			hand_class = FLUSH;
			hand_rank = 1<<27;
			hand_rank |= hi << 16;
			if (!ifScore) {
				if (r1!=hi) left.push(r1);
				if (r2!=hi) left.push(r2);
				if (r3!=hi) left.push(r3);
				if (r4!=hi) left.push(r4);
				if (r5!=hi) left.push(r5);
				str_hand=`${POKER_RANK_WORDS[hi]} high flush`;
			}

		}
	}//»
	else if (is_straight){//«

		hand_class = STRAIT;
		hand_rank = 1<<26;
		hand_rank |= 3<<16;//The 5 is the high card
		str_hand=`Five high straight`;

	}//»
	else {//«

		hand_class = HIGH;
		hand_rank = 1<<22;
		hand_rank |= hi << 16;

		if (!ifScore) {
			if (r1!=hi) left.push(r1);
			if (r2!=hi) left.push(r2);
			if (r3!=hi) left.push(r3);
			if (r4!=hi) left.push(r4);
			if (r5!=hi) left.push(r5);
			str_hand=`${POKER_RANK_WORDS[hi]} high`;
		}

	}//»

}//»

return {
	left,
	class: hand_class,
	score: hand_rank,
	text: str_hand,
};

}//»

//»

class Card {//«

constructor(index, rank, suit, rankSymbol, suitUnicode) {
	this.index = index;
	this.rank = rank;
	this.suit = suit;
	this.rankSymbol = rankSymbol;
	this.suitUnicode = suitUnicode;
}

toLiteral() {
	return `${this.rank}-${this.suit}`;
}

toPictograph() {
	return eval ( '"' + `${this.rankSymbol}-\\u{${this.suitUnicode.toString(16)}}` + '"' );
}

}//»
class Deck {//«

constructor(type) {//«
	this.type = type;
	if (type !== 'standard') {
	  DIE('Only "standard" deck type is supported');
	}
	this.cards = [];
	this.dealt = [];
	this.suits = [];
	this.rankSymbols = null;
	this.suitEmojis = {};
	this.numRanks = 0;
	this.initializeStandardDeck();
}//»
initializeStandardDeck() {//«
/*
this.suits = [
	{name: 'spades', unicode: 9828}, 
	{name: 'hearts', unicode: 9825},
	{name: 'diamonds', unicode: 9826},
	{name: 'clubs', unicode: 9831}
];
*/
this.suits = [
	{name: 'spades', unicode: 9824}, 
	{name: 'hearts', unicode: 9829},
	{name: 'diamonds', unicode: 9830},
	{name: 'clubs', unicode: 9827}
];
this.rankSymbols = POKER_RANK_CHS;
this.numRanks = this.rankSymbols.length;

let index = 0;
/*
for (let suit of this.suits) {
	for (let rank = 0; rank < this.numRanks; rank++) {
		this.cards[index] = new Card(index, rank+1, suit.name, this.rankSymbols[rank], suit.unicode);
		this.dealt[index] = 0;
		index++;
	}
}
*/
for (let rank = 0; rank < this.numRanks; rank++) {
	for (let suit of this.suits) {
		this.cards[index] = new Card(index, rank+1, suit.name, this.rankSymbols[rank], suit.unicode);
		this.dealt[index] = 0;
		index++;
	}
}

}//»
deal(index) {//«
	if (index < 0 || index >= this.cards.length || this.dealt[index] === 1) {
		return null;
	}
	this.dealt[index] = 1;
	return this.cards[index];
}//»
toString(){//«
return `Deck(${this.type})`;
}//»

}//»
class Player {//«
	constructor(index) {
		this.name = `Player${index + 1}`;
		this.cards = [];
	}
	getHoleIndexes(){
		let arr = [];
		for (let card of this.cards) arr.push(card.index);
		return arr;
	}
	showUnicodeCards(){
		let s = '';
		for (let card of this.cards){
			s+= card.toPictograph() + " ";
		}
		return s;
	}
	showCards(){
		let s = '';
		for (let card of this.cards){
			s+= card.toLiteral() + " ";
		}
		return s;
	}
}//»
class Dealer {//«

constructor(deckType, cardsPerPlayer) {//«
//constructor(deckType, players, table, cardsPerPlayer) {
	this.deck = new Deck(deckType);
	this.availableIndices = Array.from({ length: this.deck.cards.length }, (_, i) => i);
	this.table = null;
	this.cardsPerPlayer = cardsPerPlayer;
	this.dealtToPlayers = false;
//	this.validateDeal();
}//»
dealToBoard(numCards) {//«
	for (let i = 0; i < numCards; i++) {
		if (this.availableIndices.length === 0) return NOCARDS();
		const randomIndex = Math.floor(Math.random() * this.availableIndices.length);
		const cardIndex = this.availableIndices.splice(randomIndex, 1)[0];
		if (this.deck.dealt[cardIndex]) continue;
		const card = this.deck.deal(cardIndex);
		this.table.board.push(card);
	}
}//»
dealToPlayers(){//«
	if (this.dealtToPlayers) DIE("Already dealt to players");
	for (let player of this.table.players) {
		player.cards = [];
		for (let i = 0; i < this.cardsPerPlayer; i++) {
			if (this.availableIndices.length === 0) return NOCARDS();
			const randomIndex = Math.floor(Math.random() * this.availableIndices.length);
			const cardIndex = this.availableIndices.splice(randomIndex, 1)[0];
			if (this.deck.dealt[cardIndex]) continue;
			const card = this.deck.deal(cardIndex);
			player.cards.push(card);
		}
	}
	this.dealtToPlayers = true;
}//»

/*
validateDeal() {//«
	const totalCards = this.players.length * this.cardsPerPlayer;
	if (totalCards <= 0 || totalCards > this.deck.cards.length) {
		DIE('Invalid number of cards to deal');
	}
}//»
*/
}//»
class Table {//«

constructor(dealer, numPlayers, numBoardCards){//«
	this.dealer = dealer;
	this.board = [];
	this.buttonPos = 0;
	if (isPosInt(numPlayers) && numPlayers >= 2) {
		this.players = new Array(numPlayers);
		for (let i=0; i < numPlayers; i++){
			let player = new Player(i);
			this.players[i] = player;
		}
	}
	else {
		DIE(`Invalid value for numPlayers: '${numPlayers}' (want Integer >= 2)`);
	}

	if (isPosInt(numBoardCards)) {
		this.numBoardCards = numBoardCards;
	}
	else if (numBoardCards){
		DIE(`Invalid value for numBoardCards: '${numBoardCards}' (want 0 or positive integer)`);
	}
}//»
incButton(){//«
	let pos = this.buttonPos;
	let start_pos = pos;
	pos++;
	let len = this.players.length;
	while(true){
		if (pos === len) pos = 0;
		if (pos === start_pos) DIE(`Could not find an active player`);
		if (this.players[pos]){
			this.buttonPos = pos;
			return pos;
		}
		pos++;
	}
}//»
showPlayerCards(){//«
	let s='';
	for (let i=0; i < this.players.length; i++){
		let player = this.players[i];
		s+= `${player.name}: ${player.showCards()}\n`;
	}
	return s;
}//»
	getBoardIndexes(){
		let arr = [];
		for (let card of this.board) arr.push(card.index);
		return arr;
	}
	showUnicodeCards(){
		let s = '';
		for (let card of this.board){
			s+= card.toPictograph() + " ";
		}
		return s;
	}

}//»
class Game {//«

constructor(type, numPlayers){//«
	this.type = type;
	this.numPlayers = numPlayers;
	this.dealer = null;
	this.table = null;
	switch (type){
		case "sillygame":
			this.makeSillyGame();
			break;
		default:
			DIE(`No such game: ${type}`);
	}
}//»
makeSillyGame(){//«

	let numHoleCards = 2;
	let numBoardCards = 3;
	this.dealer = new Dealer("standard", numHoleCards);
	this.table = new Table(this.dealer, this.numPlayers, numBoardCards);
	this.dealer.table = this.table;

}//»

}//»

//Commands«
const com_poker = class extends Com {
	run(){
const{args}=this;
let type = args.shift();
let num = args.shift();
if (!(type&&num)) return this.no(`Usage: <type> <num_players>`);
if (!num.match(/^[2-9]$/)) return this.no(`arg #2 must be 2-9`);
num = parseInt(num);
let game = new Game(type, num);
game.dealer.dealToPlayers();
game.dealer.dealToBoard(3);

let board_arr = game.table.getBoardIndexes();
let players = game.table.players;
//let player0 = game.table.players[0];
//let player1 = game.table.players[1];

//cwarn("SHOW");
this.out("Board:   "+game.table.showUnicodeCards());
//let holes = [];
let hands = [];
for (let player of players) {
	this.out(`${player.name}: ${player.showUnicodeCards()}`);
	player.result = evaluate(player.getHoleIndexes().concat(board_arr));
}

//let hole_arr_0 = player0.getHoleIndexes();
//let hole_arr_1 = player1.getHoleIndexes();

let active_players = players;

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
//Test the kickers
if (winners.length > 1){//«
//cwarn("TEST KICKERS!");
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
			else {
//Unshifting makes it go to the top of the losers
				losers.unshift(winner);
			}
		}
		winners = new_winners;
	}
}//»
this.out("WINNERS");
for (let winner of winners){
	let left_str = '';
	for (let rnk of winner.result.left.sort(HITOLOW)){
		left_str += POKER_RANK_CHS[rnk];
	}
this.out(`${winner.name}: ${winner.result.text} (${left_str})`);
}
this.out("LOSERS");
for (let loser of losers){
	let left_str = '';
	for (let rnk of loser.result.left.sort(HITOLOW)){
		left_str += POKER_RANK_CHS[rnk];
	}
this.out(`${loser.name}: ${loser.result.text} (${left_str})`);
}


//log(winners);
//if (rv0.score === rv1.score)
//log(rv0);
//log(rv1);
this.ok();

	}
}
//»

const coms = {//«
	poker: com_poker,
}//»

export { coms };






/*OLD«
getIndexFromLiteral(literal) {//«
const [rankStr, suit] = literal.split('-');
const rank = parseInt(rankStr);
const suitIndex = this.suits.indexOf(suit);
if (rank < 1 || rank > this.numRanks || suitIndex === -1) {
  return -1;
}
return (suitIndex * this.numRanks) + (rank - 1);
}//»
getRankFromIndex(index) {//«
if (index < 0 || index >= this.cards.length) {
  return -1;
}
return this.cards[index].rank;
}//»
getRankFromLiteral(literal) {//«
const index = this.getIndexFromLiteral(literal);
return this.getRankFromIndex(index);
}//»
getIndexFromPictograph(pictograph) {//«
const [rankSymbol, emoji] = pictograph.split('-');
const rank = this.rankSymbols.indexOf(rankSymbol) + 1;
const suit = Object.keys(this.suitEmojis).find(key => this.suitEmojis[key] === emoji);
if (!suit || rank < 1) {
  return -1;
}
const suitIndex = this.suits.indexOf(suit);
return (suitIndex * this.numRanks) + (rank - 1);
}//»
getRankFromPictograph(pictograph) {//«
const index = this.getIndexFromPictograph(pictograph);
return this.getRankFromIndex(index);
}//»
»*/


