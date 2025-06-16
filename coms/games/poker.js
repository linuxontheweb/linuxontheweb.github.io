//Imports«

const {Com} = LOTW.globals.ShellMod.comClasses;
const{log,jlog,cwarn,cerr}=LOTW.api.util;

//»

class Card {/* « */
constructor(rank, suit, rankSymbol, suitEmoji) {
	this.rank = rank;
	this.suit = suit;
	this.rankSymbol = rankSymbol;
	this.suitEmoji = suitEmoji;
}

toLiteral() {
	return `${this.rank}-${this.suit}`;
}

toPictograph() {
	return `${this.rankSymbol}-${this.suitEmoji}`;
}
}/* » */
class Deck {/* « */

constructor(type) {/* « */
	this.type = type;
	if (type !== 'standard') {
	  throw new Error('Only "standard" deck type is supported');
	}
	this.cards = [];
	this.dealt = [];
	this.suits = [];
	this.rankSymbols = [];
	this.suitEmojis = {};
	this.numRanks = 0;
	this.initializeStandardDeck();
}/* » */

initializeStandardDeck() {/* « */
this.suits = ['spades', 'hearts', 'diamonds', 'clubs'];
this.rankSymbols = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
this.suitEmojis = {
  spades: '\u{2660}',
  hearts: '\u{2665}',
  diamonds: '\u{2666}',
  clubs: '\u{2663}'
};
this.numRanks = this.rankSymbols.length;

let index = 0;
for (let suit of this.suits) {
  for (let rank = 1; rank <= this.numRanks; rank++) {
	this.cards[index] = new Card(rank, suit, this.rankSymbols[rank - 1], this.suitEmojis[suit]);
	this.dealt[index] = 0;
	index++;
  }
}
}/* » */

deal(index) {/* « */
if (index < 0 || index >= this.cards.length || this.dealt[index] === 1) {
  return null;
}
this.dealt[index] = 1;
return this.cards[index];
}/* » */

getIndexFromLiteral(literal) {/* « */
const [rankStr, suit] = literal.split('-');
const rank = parseInt(rankStr);
const suitIndex = this.suits.indexOf(suit);
if (rank < 1 || rank > this.numRanks || suitIndex === -1) {
  return -1;
}
return (suitIndex * this.numRanks) + (rank - 1);
}/* » */
getIndexFromPictograph(pictograph) {/* « */
const [rankSymbol, emoji] = pictograph.split('-');
const rank = this.rankSymbols.indexOf(rankSymbol) + 1;
const suit = Object.keys(this.suitEmojis).find(key => this.suitEmojis[key] === emoji);
if (!suit || rank < 1) {
  return -1;
}
const suitIndex = this.suits.indexOf(suit);
return (suitIndex * this.numRanks) + (rank - 1);
}/* » */
getRankFromIndex(index) {/* « */
if (index < 0 || index >= this.cards.length) {
  return -1;
}
return this.cards[index].rank;
}/* » */
getRankFromLiteral(literal) {/* « */
const index = this.getIndexFromLiteral(literal);
return this.getRankFromIndex(index);
}/* » */
getRankFromPictograph(pictograph) {/* « */
const index = this.getIndexFromPictograph(pictograph);
return this.getRankFromIndex(index);
}/* » */

toString(){/* « */
return `Deck(${this.type})`;
}/* » */

}/* » */

class Player {/* « */
constructor(index) {
	this.name = `${index + 1}`;
	this.cards = [];
}
}/* » */

class Dealer {

constructor(deckType, players, cardsPerPlayer) {/* « */
	this.deck = new Deck(deckType);
	this.players = players;
	this.cardsPerPlayer = cardsPerPlayer;
	this.validateDeal();
}/* » */
validateDeal() {/* « */
	const totalCards = this.players.length * this.cardsPerPlayer;
	if (totalCards <= 0 || totalCards > this.deck.cards.length) {
	  throw new Error('Invalid number of cards to deal');
	}
}/* » */
deal() {/* « */
	let availableIndices = Array.from({ length: this.deck.cards.length }, (_, i) => i);
	for (let player of this.players) {
		player.cards = [];
		for (let i = 0; i < this.cardsPerPlayer; i++) {
			if (availableIndices.length === 0) break;
			const randomIndex = Math.floor(Math.random() * availableIndices.length);
			const cardIndex = availableIndices.splice(randomIndex, 1)[0];
			const card = this.deck.deal(cardIndex);
			if (card) player.cards.push(card);
		}
	}
}/* » */

}

//Commands«
const com_poker = class extends Com {
	run(){

let numPlayers = 4;
let numCards = 5;
let players = [];
for (let i=0; i <numPlayers; i++){
let player = new Player(i);
players.push(player);
}
let dealer = new Dealer("standard", players, numCards);
dealer.deal();
log(players);
//log(dealer);

//		this.ok("Hello Poker2: That was honslerativity!!!!!");
//let deck = new Deck("standard");
//log(deck);
//this.out(deck);
this.ok();
	}
}
//»

const coms = {//«
	poker: com_poker,
}//»

export { coms };

