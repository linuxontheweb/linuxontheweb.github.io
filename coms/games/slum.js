/*7/29/25 @WIJGLM: Why would we ever want to output this stuff if we are just trying
to make files?
*/
//Imports«

//const{globals, Desk}=LOTW;
const {Com} = LOTW.globals.ShellMod.comClasses;
const{log,jlog,cwarn,cerr}=LOTW.api.util;
//»
//«
//This is supposed to be Game::NumSuits()
const NUMSUITS = 4;
//#define Rank(card)           (card / Game::NumSuits())
//#define Suit(card)           (card % Game::NumSuits())

Factorial(n) {//«
//static int Factorial(int n) {
  if (n == 0) return 1;
  if (n == 1) return 1;
  return n * Factorial(n - 1);
}//»

//Params«

//#include "io.h"
//#include "params.h"

const P_STRING = 1;
const P_INT = 2;
const P_DOUBLE = 3;
const P_BOOLEAN = 4;

class ParamValue{}

class Params {//«
//private:

//std::vector<std::string> param_names_;
#param_names_;
//std::vector<ParamType> param_types_;
#param_types_;
//std::vector<ParamValue> param_values_;
#param_values_;

constructor(){//«
	this.#param_names_=[];
	this.#param_types_=[];
	this.#param_values_=[];
}//»

AddParam(name, ptype) {//«
//void Params::AddParam(const string &name, ParamType ptype) {
	this.#param_names_.push(name);
	this.#param_types_.push(ptype);
//	ParamValue v;
	let v = new ParamValue();
	v.s = "";
	v.i = 0;
	v.d = 0.0;
	v.set = false;
	this.#param_values_.push(v);
}//»
#GetParamIndex(name) {//«
//int Params::GetParamIndex(const char *name) const {
	let i;
	let num_params = this.#param_names_.size();
	for (i = 0; i < num_params; ++i) {
		if (! strcmp(this.#param_names_[i].c_str(), name)) break;
	}
	if (i == num_params) {
		fprintf(stderr, "Unknown param name: %s\n", name);
		exit(-1);
	}
	return i;
}//»
ReadFromFile(filename) {//«
//void Params::ReadFromFile(const char *filename) {
	Reader reader(filename);
//	string line;
	let line;
	while (reader.GetLine(&line)) {
		if (line[0] == '#') continue;
//		let len = line.size();
		let len = line.length;
		let i;
		for (i = 0; i < len && line[i] != ' ' && line[i] != '\t'; ++i) ;
		if (i == len) {
			fprintf(stderr, "Couldn't find whitespace on line\n");
			exit(-1);
		}
		if (i == 0) {
			fprintf(stderr, "Initial whitespace on line\n");
			exit(-1);
		}
//		string param_name(line, 0, i);
		let param_name = lines.substr(0, i);
//		let j = this.#GetParamIndex(param_name.c_str());
		let j = this.#GetParamIndex(param_name);
//		ParamType ptype = param_types_[j];
		let ptype = this.#param_types_[j];
		while (i < len && (line[i] == ' ' || line[i] == '\t')) ++i;
		if (i == len) {
			fprintf(stderr, "No value after whitespace on line\n");
			exit(-1);
		}
//		ParamValue v;
		let v = new ParamValue();
		v.set = true;
		if (ptype == P_STRING) {
//			v.s = string(line, i, len - i);
			v.s = line.substr(i, len-i);
		}
		else if (ptype == P_INT) {
//			if (sscanf(line + i, "%i", &v.i) != 1) {
			v.d = parseInt(line.slice(i));
			if (!Number.isFinite(v.d)) {
				fprintf(stderr, "Couldn't parse int value from line: %s\n", line);
				exit(-1);
			}
		}
		else if (ptype == P_DOUBLE) {
//			if (sscanf(line + i, "%lf", &v.d) != 1) {
			v.d = parseFloat(line.slice(i));
			if (!Number.isFinite(v.d)) {
				fprintf(stderr, "Couldn't parse double value from line: %s\n", line);
				exit(-1);
			}
		}
		else if (ptype == P_BOOLEAN) {
//			if (! strcmp(line + i, "true")) {
			if (line.slice(i) === "true")) {
				v.i = 1;
			}
//			else if (! strcmp(line + i, "false")) {
			else if (line.slice(i) === "false")) {
				v.i = 0;
			}
			else {
				fprintf(stderr, "Couldn't parse boolean value from line: %s\n", line);
				exit(-1);
			}
		}
		this.#param_values_[j] = v;
	}
}//»
GetStringValue(name) {//«
//string Params::GetStringValue(const char *name) const {
	let i = this.#GetParamIndex(name);
	if (param_types_[i] != P_STRING) {
		fprintf(stderr, "Param %s not string\n", name);
		exit(-1);
	}
	return param_values_[i].s;
}//»
GetIntValue(name) {//«
//int Params::GetIntValue(const char *name) const {
	let i = this.#GetParamIndex(name);
	if (param_types_[i] != P_INT) {
		fprintf(stderr, "Param %s not int\n", name);
		exit(-1);
	}
	return param_values_[i].i;
}//»
GetDoubleValue(name) {//«
//double Params::GetDoubleValue(const char *name) const {
	let i = this.#GetParamIndex(name);
	if (param_types_[i] != P_DOUBLE) {
		fprintf(stderr, "Param %s not double\n", name);
		exit(-1);
	}
	return param_values_[i].d;
}//»
GetBooleanValue(name) {//«
//bool Params::GetBooleanValue(const char *name) const {
	let i = this.#GetParamIndex(name);
	if (param_types_[i] != P_BOOLEAN) {
		fprintf(stderr, "Param %s not boolean\n", name);
		exit(-1);
	}
	return (bool)param_values_[i].i;
}//»
IsSet(name) {//«
//bool Params::IsSet(const char *name) const {
	let i = this.#GetParamIndex(name);
	return param_values_[i].set;
}//»

};//»

/*
enum ParamType {//«
  P_STRING,
  P_INT,
  P_DOUBLE,
  P_BOOLEAN
};//»
struct ParamValue {//«
  bool set;
  std::string s;
  int i;
  double d;
};//»
class Params {//«
public:
  Params(void);
  ~Params(void);
  void AddParam(const std::string &name, ParamType ptype);
  void ReadFromFile(const char *filename);
  bool IsSet(const char *name) const;
  std::string GetStringValue(const char *name) const;
  int GetIntValue(const char *name) const;
  double GetDoubleValue(const char *name) const;
  bool GetBooleanValue(const char *name) const;
private:
  int GetParamIndex(const char *name) const;

  std::vector<std::string> param_names_;
  std::vector<ParamType> param_types_;
  std::vector<ParamValue> param_values_;
};//»
*/

//Headers«


//»

//»

class Game{//«

#game_name_;
#max_street_;
#num_players_;
#num_ranks_;
#num_suits_;
#small_blind_;
#big_blind_;
#ante_;
#num_cards_in_deck_;
#num_card_permutations_;
#first_to_act_;
#num_cards_for_street_;
#num_hole_card_pairs_;
#num_board_cards_;

GameName() {return this.#game_name_;}
MaxStreet() {return this.#max_street_;}
NumPlayers() {return this.#num_players_;}
NumRanks() {return this.#num_ranks_;}
HighRank() {return this.#num_ranks_ - 1;}
NumSuits() {return this.#num_suits_;}
MaxCard() { return MakeCard(num_ranks_ - 1, num_suits_ - 1); }
FirstToAct(st) {return this.#first_to_act_[st];}
SmallBlind() {return this.#small_blind_;}
BigBlind() {return this.#big_blind_;}
Ante() {return this.#ante_;}
NumCardsForStreet(st){return this.#num_cards_for_street_[st];}
NumHoleCardPairs(st){return this.#num_hole_card_pairs_[st];}
NumBoardCards(st){return this.#num_board_cards_[st];}
NumCardsInDeck(void) {return num_cards_in_deck_;}

Initialize(params) {//«
	this.#game_name_ = params.GetStringValue("GameName");
	this.#max_street_ = params.GetIntValue("MaxStreet");
	this.#num_players_ = params.GetIntValue("NumPlayers");
	this.#num_ranks_ = params.GetIntValue("NumRanks");
	if (this.#num_ranks_ == 0) {
		fprintf(stderr, "There must be at least one rank\n");
		exit(-1);
	}
	this.#num_suits_ = params.GetIntValue("NumSuits");
	if (this.#num_suits_ == 0) {
		fprintf(stderr, "There must be at least one suit\n");
		exit(-1);
	}
	this.#num_cards_in_deck_ = this.#num_ranks_ * this.#num_suits_;
	vector<int> ftav;
	ParseInts(params.GetStringValue("FirstToAct"), &ftav);
	if ((int)ftav.size() != this.#max_street_ + 1) {
		fprintf(stderr, "Expected %i values in FirstToAct\n", this.#max_street_ + 1);
		exit(-1);
	}
	this.#first_to_act_.reset(new int[this.#max_street_ + 1]);
	for (let st = 0; st <= this.#max_street_; ++st) {
		this.#first_to_act_[st] = ftav[st];
	}
	this.#num_cards_for_street_.reset(new int[this.#max_street_ + 1]);
	this.#num_cards_for_street_[0] = params.GetIntValue("NumHoleCards");
	if (this.#max_street_ >= 1) {
		if (! params.IsSet("NumFlopCards")) {
			fprintf(stderr, "NumFlopCards param needs to be set\n");
			exit(-1);
		}
		this.#num_cards_for_street_[1] = params.GetIntValue("NumFlopCards");
	}
	if (this.#max_street_ >= 2) this.#num_cards_for_street_[2] = 1;
	if (this.#max_street_ >= 3) this.#num_cards_for_street_[3] = 1;
	this.#ante_ = params.GetIntValue("Ante");
	this.#small_blind_ = params.GetIntValue("SmallBlind");
	this.#big_blind_ = params.GetIntValue("BigBlind");

	// Calculate num_card_permutations_, the number of ways of dealing out
	// the cards to both players and the board.
	// This assumes a two player game.
	this.#num_card_permutations_ = 1ULL;
	let num_cards_left = this.#num_cards_in_deck_;
	for (let p = 0; p < 2; ++p) {
		let num_hole_cards = this.#num_cards_for_street_[0];
		let multiplier = 1;
		for (let n = (num_cards_left - num_hole_cards) + 1;
			n <= num_cards_left; ++n) {
			multiplier *= n;
		}
		this.#num_card_permutations_ *= multiplier / Factorial(num_hole_cards);
		num_cards_left -= num_hole_cards;
	}
	for (let s = 1; s <= this.#max_street_; ++s) {
		let num_street_cards = this.#num_cards_for_street_[s];
		let multiplier = 1;
		for (let n = (num_cards_left - num_street_cards) + 1; n <= num_cards_left; ++n) {
			multiplier *= n;
		}
		this.#num_card_permutations_ *= multiplier / Factorial(num_street_cards);
		num_cards_left -= num_street_cards;
	}
	this.#num_hole_card_pairs_.reset(new int[this.#max_street_ + 1]);
	this.#num_board_cards_.reset(new int[this.#max_street_ + 1]);
	let num_board_cards = 0;
	for (let st = 0; st <= this.#max_street_; ++st) {
		if (st >= 1) num_board_cards += this.#num_cards_for_street_[st];
		this.#num_board_cards_[st] = num_board_cards;
		// Num cards left in deck after all board cards dealt
		let num_remaining = this.#num_cards_in_deck_ - num_board_cards;
		if (this.#num_cards_for_street_[0] == 2) {
			this.#num_hole_card_pairs_[st] = (num_remaining * (num_remaining - 1)) / 2;
		}
		else if (this.#num_cards_for_street_[0] == 1) {
			this.#num_hole_card_pairs_[st] = num_remaining;
		}
		else {
			fprintf(stderr, "Game::Game: Expected 1 or 2 hole cards\n");
			exit(-1);
		}
	}
}//»
StreetPermutations(street) {//«
// Assume the hole cards for each player have been dealt out and the board
// cards for any street prior to the given street.  How many ways of dealing
// out the next street are there?
let num_cards_left = this.#num_cards_in_deck_;
num_cards_left -= 2 * this.#num_cards_for_street_[0];
for (let s = 1; s < street; ++s) {
num_cards_left -= this.#num_cards_for_street_[s];
}
let num_street_cards = this.#num_cards_for_street_[street];
let multiplier = 1;
for (let n = (num_cards_left - num_street_cards) + 1; n <= num_cards_left; ++n) {
multiplier *= n;
}
return multiplier / Factorial(num_street_cards);
}//»
StreetPermutations2(street) {//«
// Assume the hole cards for *ourselves only* have been dealt out and the board
// cards for any street prior to the given street.  How many ways of dealing
// out the next street are there?
  let num_cards_left = this.#num_cards_in_deck_;
  num_cards_left -= this.#num_cards_for_street_[0];
  for (let s = 1; s < street; ++s) {
    num_cards_left -= this.#num_cards_for_street_[s];
  }
  let num_street_cards = this.#num_cards_for_street_[street];
  let multiplier = 1;
  for (let n = (num_cards_left - num_street_cards) + 1; n <= num_cards_left; ++n) {
    multiplier *= n;
  }
  return multiplier / Factorial(num_street_cards);
}//»
StreetPermutations3(street) {//«
// Assume only that the board cards for any street prior to the given street.  How many ways of
// dealing out the next street are there?
  let num_cards_left = this.#num_cards_in_deck_;
  for (let s = 1; s < street; ++s) {
    num_cards_left -= this.#num_cards_for_street_[s];
  }
  let num_street_cards = this.#num_cards_for_street_[street];
  let multiplier = 1;
  for (let n = (num_cards_left - num_street_cards) + 1; n <= num_cards_left; ++n) {
    multiplier *= n;
  }
  return multiplier / Factorial(num_street_cards);
}//»
BoardPermutations(street) {//«
// Assume the hole cards for each player have been dealt out and the board
// cards for any street prior to the given street.  How many ways of dealing
// out the remainder of the board are there?
  let num_cards_left = this.#num_cards_in_deck_;
  num_cards_left -= 2 * this.#num_cards_for_street_[0];
  for (let s = 1; s < street; ++s) {
    num_cards_left -= this.#num_cards_for_street_[s];
  }
  let num_permutations = 1;
  for (let s = street; s <= this.#max_street_; ++s) {
    let num_street_cards = this.#num_cards_for_street_[s];
    let multiplier = 1;
    for (let n = (num_cards_left - num_street_cards) + 1; n <= num_cards_left; ++n) {
      multiplier *= n;
    }
    num_permutations *= multiplier / Factorial(num_street_cards);
    num_cards_left -= num_street_cards;
  }
  return num_permutations;
}//»

}//»

//Cards«


const OutputRank = (rank) => {//«
//void OutputRank(int rank) {
if (rank < 8) {
	printf("%i", rank + 2);
}
else if (rank == 8) {
	printf("T");
}
else if (rank == 9) {
	printf("J");
}
else if (rank == 10) {
	printf("Q");
}
else if (rank == 11) {
	printf("K");
}
else if (rank == 12) {
	printf("A");
}
else {
	fprintf(stderr, "Illegal rank %i\n", rank);
	exit(-1);
}
}//»
const OutputCard = (card) => {//«
//void OutputCard(Card card) {
	let rank = Math.floor(card / NUMSUITS);
	let suit = card % NUMSUITS;

	OutputRank(rank);
	switch (suit) {
		case 0: printf("c"); break;
		case 1: printf("d"); break;
		case 2: printf("h"); break;
		case 3: printf("s"); break;
		default: 
			fprintf(stderr, "Illegal suit\n");
			exit(-1);
	}
}//»
const CardName = (c, name) => {//«
//void CardName(Card c, string *name) {
  name = "";
  let rank = Math.floor(c / NUMSUITS);
  let suit = c % NUMSUITS;

  if (rank < 8) {
    name += rank + 50;
  }
  else if (rank == 8) {
    name += "T";
  }
  else if (rank == 9) {
    name += "J";
  }
  else if (rank == 10) {
    name += "Q";
  }
  else if (rank == 11) {
    name += "K";
  }
  else if (rank == 12) {
    name += "A";
  }
  switch (suit) {
  case 0:
    name += "c"; break;
  case 1:
    name += "d"; break;
  case 2:
    name += "h"; break;
  case 3:
    name += "s"; break;
  default:
    fprintf(stderr, "Illegal suit\n");
    exit(-1);
  }
}//»
const OutputTwoCards = (c1, c2) => {//«
//void OutputTwoCards(Card c1, Card c2) {
  OutputCard(c1);
  printf(" ");
  OutputCard(c2);
}//»
const OutputTwoCards = (cards) => {//«
//void OutputTwoCards(const Card *cards) {
  OutputTwoCards(cards[0], cards[1]);
}//»
const OutputThreeCards = (c1, c2, c3) => {//«
//void OutputThreeCards(Card c1, Card c2, Card c3) {
  OutputCard(c1);
  printf(" ");
  OutputCard(c2);
  printf(" ");
  OutputCard(c3);
}//»
const OutputThreeCards = (cards) => {//«
//void OutputThreeCards(const Card *cards) {
  OutputThreeCards(cards[0], cards[1], cards[2]);
}//»
const OutputFourCards = (c1, c2, c3, c4) => {//«
//void OutputFourCards(Card c1, Card c2, Card c3, Card c4) {
  OutputCard(c1);
  printf(" ");
  OutputCard(c2);
  printf(" ");
  OutputCard(c3);
  printf(" ");
  OutputCard(c4);
}//»
const OutputFourCards = (cards) => {//«
//void OutputFourCards(const Card *cards) {
  OutputFourCards(cards[0], cards[1], cards[2], cards[3]);
}//»
const OutputFiveCards = (c1, c2, c3, c4, c5) => {//«
//void OutputFiveCards(Card c1, Card c2, Card c3, Card c4, Card c5) {
  OutputCard(c1);
  printf(" ");
  OutputCard(c2);
  printf(" ");
  OutputCard(c3);
  printf(" ");
  OutputCard(c4);
  printf(" ");
  OutputCard(c5);
}//»
const OutputFiveCards = (cards) => {//«
//void OutputFiveCards(const Card *cards) {
  OutputFiveCards(cards[0], cards[1], cards[2], cards[3], cards[4]);
}//»
const OutputSixCards = (c1, c2, c3, c4, c5, c6) => {//«
//void OutputSixCards(Card c1, Card c2, Card c3, Card c4, Card c5, Card c6) {
  OutputCard(c1);
  printf(" ");
  OutputCard(c2);
  printf(" ");
  OutputCard(c3);
  printf(" ");
  OutputCard(c4);
  printf(" ");
  OutputCard(c5);
  printf(" ");
  OutputCard(c6);
}//»
const OutputSixCards = (cards) => {//«
//void OutputSixCards(const Card *cards) {
  OutputSixCards(cards[0], cards[1], cards[2], cards[3], cards[4], cards[5]);
}//»
const OutputSevenCards = (c1, c2, c3, c4, c5, c6, c7) => {//«
//void OutputSevenCards(Card c1, Card c2, Card c3, Card c4, Card c5, Card c6, Card c7) {
  OutputCard(c1);
  printf(" ");
  OutputCard(c2);
  printf(" ");
  OutputCard(c3);
  printf(" ");
  OutputCard(c4);
  printf(" ");
  OutputCard(c5);
  printf(" ");
  OutputCard(c6);
  printf(" ");
  OutputCard(c7);
}//»
const OutputSevenCards = (cards) => {//«
//void OutputSevenCards(const Card *cards) {
  OutputSevenCards(cards[0], cards[1], cards[2], cards[3], cards[4], cards[5], cards[6]);
}//»
const OutputNCards = (cards, n) => {//«
//void OutputNCards(const Card *cards, int n) {
  for (let i = 0; i < n; ++i) {
    if (i > 0) printf(" ");
    OutputCard(cards[i]);
  }
}//»
const MakeCard = (rank, suit) => {//«
//Card MakeCard(int rank, int suit) {
//  return rank * Game::NumSuits() + suit;
	return rank * NUMSUITS + suit;
}//»
const ParseCard = (str) => {//«
//Card ParseCard(const char *str) {
  let c = str[0];
  let rank;
  if (c >= '0' && c <= '9') {
    rank = (c - '0') - 2;
  }
  else if (c == 'A') {
    rank = 12;
  }
  else if (c == 'K') {
    rank = 11;
  }
  else if (c == 'Q') {
    rank = 10;
  }
  else if (c == 'J') {
    rank = 9;
  }
  else if (c == 'T') {
    rank = 8;
  }
  else {
    fprintf(stderr, "Couldn't parse card rank\n");
    fprintf(stderr, "Str %s\n", str);
    exit(-1);
  }
  c = str[1];
  if (c == 'c') {
    return MakeCard(rank, 0);
  }
  else if (c == 'd') {
    return MakeCard(rank, 1);
  }
  else if (c == 'h') {
    return MakeCard(rank, 2);
  }
  else if (c == 's') {
    return MakeCard(rank, 3);
  }
  else {
    fprintf(stderr, "Couldn't parse card suit\n");
    fprintf(stderr, "Str %s\n", str);
    exit(-1);
  }
}//»
const ParseTwoCards = (str, space_separated, cards) => {//«
//void ParseTwoCards(const char *str, bool space_separated, Card *cards) {
	cards[0] = ParseCard(str);
	if (space_separated) {
//		cards[1] = ParseCard(str + 3);
		cards[1] = ParseCard(str.slice(3));
	}
	else {
//	cards[1] = ParseCard(str + 2);
		cards[1] = ParseCard(str.slice(2));
	}
}//»
const ParseThreeCards = (str, space_separated, cards) => {//«
//void ParseThreeCards(const char *str, bool space_separated, Card *cards) {
  cards[0] = ParseCard(str);
  if (space_separated) {
    cards[1] = ParseCard(str + 3);
    cards[2] = ParseCard(str + 6);
  }
  else {
    cards[1] = ParseCard(str + 2);
    cards[2] = ParseCard(str + 4);
  }
}//»
const ParseFourCards = (str, space_separated, cards) => {//«
//void ParseFourCards(const char *str, bool space_separated, Card *cards) {
  cards[0] = ParseCard(str);
  if (space_separated) {
    cards[1] = ParseCard(str + 3);
    cards[2] = ParseCard(str + 6);
    cards[3] = ParseCard(str + 8);
  }
  else {
    cards[1] = ParseCard(str + 2);
    cards[2] = ParseCard(str + 4);
    cards[3] = ParseCard(str + 6);
  }
}//»
const ParseFiveCards = (str, space_separated, cards) => {//«
//void ParseFiveCards(const char *str, bool space_separated, Card *cards) {
  cards[0] = ParseCard(str);
  if (space_separated) {
    cards[1] = ParseCard(str + 3);
    cards[2] = ParseCard(str + 6);
    cards[3] = ParseCard(str + 8);
    cards[4] = ParseCard(str + 12);
  }
  else {
    cards[1] = ParseCard(str + 2);
    cards[2] = ParseCard(str + 4);
    cards[3] = ParseCard(str + 6);
    cards[4] = ParseCard(str + 8);
  }
}//»
const InCards = (c, cards, num_cards) => {//«
//bool InCards(Card c, const Card *cards, int num_cards) {
  for (let i = 0; i < num_cards; ++i) if (c == cards[i]) return true;
  return false;
}//»
const MaxSuit = (board, num_board) => {//«
//int MaxSuit(Card *board, int num_board) {
  let max_suit = Suit(board[0]);
  for (let i = 1; i < num_board; ++i) {
    let s = Suit(board[i]);
    if (s > max_suit) max_suit = s;
  }
  return max_suit;
}//»

//»

const CreateGameParams = () => {//«
//unique_ptr<Params> CreateGameParams(void) {
//	unique_ptr<Params> params(new Params());
	let params = new Params();
	params.AddParam("GameName", P_STRING);
	params.AddParam("NumRanks", P_INT);
	params.AddParam("NumSuits", P_INT);
	params.AddParam("StackSize", P_INT);
	params.AddParam("MaxStreet", P_INT);
	params.AddParam("NumHoleCards", P_INT);
	params.AddParam("NumFlopCards", P_INT);
	params.AddParam("Ante", P_INT);
	params.AddParam("SmallBlind", P_INT);
	params.AddParam("FirstToAct", P_STRING);
	params.AddParam("BigBlind", P_INT);
	params.AddParam("NumPlayers", P_INT);
	return params;
}//»

//hand_evaluator«

class HandEvaluator {//«
constructor(){}
Create(name) {//«
//HandEvaluator *HandEvaluator::Create(const string &name) {
//	if (! strncmp(name.c_str(), "leduc", 5)) {
	if (name.match/^leduc/) {
		return new LeducHandEvaluator();
	}
	else {
	// Assume some form of Holdem if not leduc
		return new HoldemHandEvaluator();
	}
}//»
};//»
/*«
class HandEvaluator {//«
public:
  HandEvaluator(void);
  virtual ~HandEvaluator(void);
  static HandEvaluator *Create(const std::string &name);
  virtual int Evaluate(Card *cards, int num_cards) = 0;

private:
};//»
class HoldemHandEvaluator : public HandEvaluator {//«
 public:
  HoldemHandEvaluator(void);
  ~HoldemHandEvaluator(void);
  int Evaluate(Card *cards, int num_cards);

  static const int kMaxHandVal = 775905;
  static const int kStraightFlush = 775892;
  static const int kQuads = 775723;
  static const int kFullHouse = 775554;
  static const int kFlush = 404261;
  static const int kStraight = 404248;
  static const int kThreeOfAKind = 402051;
  static const int kTwoPair = 399854;
  static const int kPair = 371293;
  static const int kNoPair = 0;

  // Values for four-card Holdem
  static const int kH4MaxHandVal = 31109;
  static const int kH4Quads = 31096;
  static const int kH4ThreeOfAKind = 30927;
  static const int kH4TwoPair = 30758;
  static const int kH4Pair = 28561;
  static const int kH4NoPair = 0;
 private:
  int EvaluateTwo(Card *cards);
  int EvaluateThree(Card *cards);
  int EvaluateFour(Card *cards);

  int *ranks_;
  int *suits_;
  int *rank_counts_;
  int *suit_counts_;
};//»
class LeducHandEvaluator : public HandEvaluator {//«
 public:
  LeducHandEvaluator(void);
  ~LeducHandEvaluator(void);
  int Evaluate(Card *cards, int num_cards);
};//»
LeducHandEvaluator::LeducHandEvaluator(void) : HandEvaluator() {//«
}//»
LeducHandEvaluator::~LeducHandEvaluator(void) {//«
}//»
int LeducHandEvaluator::Evaluate(Card *cards, int num_cards) {//«
  int r0 = Rank(cards[0]);
  int r1 = Rank(cards[1]);
  int hr, lr;
  if (r0 > r1) {hr = r0; lr = r1;}
  else         {hr = r1; lr = r0;}
  if (hr == 2) {
    if (lr == 2)      return 5;
    else if (lr == 1) return 2;
    else              return 1;
  } else if (hr == 1) {
    if (lr == 1)      return 4;
    else              return 0;
  } else {
                      return 3;
  }
}//»
»*/

const kMaxHandVal = 775905;
const kStraightFlush = 775892;
const kQuads = 775723;
const kFullHouse = 775554;
const kFlush = 404261;
const kStraight = 404248;
const kThreeOfAKind = 402051;
const kTwoPair = 399854;
const kPair = 371293;
const kNoPair = 0;

// Values for four-card Holdem
const kH4MaxHandVal = 31109;
const kH4Quads = 31096;
const kH4ThreeOfAKind = 30927;
const kH4TwoPair = 30758;
const kH4Pair = 28561;
const kH4NoPair = 0;

class HoldemHandEvaluator extends HandEvaluator {

#ranks_;
#suits_;
#rank_counts_;
#suit_counts_;

constructor(){/* « */
	this.super();
	this.#ranks_ = new Array(7);
	this.#suits_ = new Array(7);
	this.#rank_counts_ = new Array(13);
	this.#suit_counts_ = new Array(4);
}/* » */
destroy(){/* « */
	delete this.#ranks_;
	delete this.#suits_;
	delete this.#rank_counts_;
	delete this.#suit_counts_;
}/* » */

EvaluateTwo(cards) {//«
//int HoldemHandEvaluator::EvaluateTwo(Card *cards) {
// Return values between 0 and 90
	let r0 = Math.floor(cards[0] / NUMSUITS);
	let r1 = Math.floor(cards[1] / NUMSUITS);
	if (r0 == r1) {
		return 78 + r0;
	}
	let hr, lr;
	if (r0 > r1) {hr = r0; lr = r1;}
	else {hr = r1; lr = r0;}
	if (hr == 1) {
		return 0;       // 0
	}
	else if (hr == 2) {
		return 1 + lr;  // 1-2
	}
	else if (hr == 3) {
		return 3 + lr;  // 3-5
	}
	else if (hr == 4) {
		return 6 + lr;  // 6-9
	}
	else if (hr == 5) {
		return 10 + lr; // 10-14
	}
	else if (hr == 6) {
		return 15 + lr; // 15-20
	}
	else if (hr == 7) {
		return 21 + lr; // 21-27
	}
	else if (hr == 8) {
		return 28 + lr; // 28-35
	}
	else if (hr == 9) {
		return 36 + lr; // 36-44
	}
	else if (hr == 10) {
		return 45 + lr; // 45-54
	}
	else if (hr == 11) {
		return 55 + lr; // 55-65
	}
	else { // hr == 12
		return 66 + lr; // 66-77
	}
}//»
EvaluateThree(cards) {//«
//int HoldemHandEvaluator::EvaluateThree(Card *cards) {
// Returns values between 0 and 2378 (inclusive)
// 13 trips - 2366-2378
// 169 (13 * 13) pairs (some values not possible) - 2197 - 2365
// 2197 no-pairs (some values not possible) - 0...2196
	let r0 = Math.floor(cards[0] / NUMSUITS);
	let r1 = Math.floor(cards[1] / NUMSUITS);
	let r2 = Math.floor(cards[2] / NUMSUITS);
	if (r0 == r1 && r1 == r2) {
		return 2366 + r0;
	}
	else if (r0 == r1 || r0 == r2 || r1 == r2) {
		let pr_rank, kicker;
		if (r0 == r1) {
			pr_rank = r0;
			kicker = r2;
		}
		else if (r0 == r2) {
			pr_rank = r0;
			kicker = r1;
		}
		else {
			pr_rank = r1;
			kicker = r0;
		}
		return 2197 + pr_rank * 13 + kicker;
	}
	else {
		let hr, mr, lr;
		if (r0 > r1) {
			if (r1 > r2) {
				hr = r0; mr = r1; lr = r2;
			}
			else if (r0 > r2) {
				hr = r0; mr = r2; lr = r1;
			}
			else {
				hr = r2; mr = r0; lr = r1;
			}
		}
		else if (r0 > r2) {
			hr = r1; mr = r0; lr = r2;
		}
		else if (r2 > r1) {
			hr = r2; mr = r1; lr = r0;
		}
		else {
			hr = r1; mr = r2; lr = r0;
		}
		return hr * 169 + mr * 13 + lr;
	}
}//»
EvaluateFour(cards) {//«
//int HoldemHandEvaluator::EvaluateFour(Card *cards) {
// Return values between 0 and 31108
// 31096...31108: quads
// 30927...31095: three-of-a-kind
// 30758...30926: two-pair
// 28561...30757: pair
// 0...28560:     no-pair
// Next 715 (?) for no-pair
	for (let r = 0; r <= 12; ++r) rank_counts_[r] = 0;
	for (let i = 0; i < 4; ++i) {
		++rank_counts_[Math.floor(cards[i] / NUMSUITS)];
	}
	let pair_rank1 = -1, pair_rank2 = -1;
	for (let r = 12; r >= 0; --r) {
		if (rank_counts_[r] == 4) {
			return kH4Quads + r;
		}
		else if (rank_counts_[r] == 3) {
			let kicker = -1;
			for (let r = 12; r >= 0; --r) {
				if (rank_counts_[r] == 1) {
					kicker = r;
					break;
				}
			}
			return kH4ThreeOfAKind + 13 * r + kicker;
		}
		else if (rank_counts_[r] == 2) {
			if (pair_rank1 == -1) {
				pair_rank1 = r;
			}
			else {
				pair_rank2 = r;
				break;
			}
		}
	}
	if (pair_rank2 >= 0) {
		return pair_rank1 * 13 + pair_rank2 + kH4TwoPair;
	}
	if (pair_rank1 >= 0) {
		let kicker1 = -1, kicker2 = -1;
		for (let r = 12; r >= 0; --r) {
			if (rank_counts_[r] == 1) {
				if (kicker1 == -1) {
					kicker1 = r;
				}
				else {
					kicker2 = r;
					break;
				}
			}
		}
		return pair_rank1 * 169 + kicker1 * 13 + kicker2 + kH4Pair;
	}
	let kicker1 = -1, kicker2 = -1, kicker3 = -1, kicker4 = -1;
	for (let r = 12; r >= 0; --r) {
		if (rank_counts_[r] == 1) {
			if (kicker1 == -1) kicker1 = r;
			else if (kicker2 == -1) kicker2 = r;
			else if (kicker3 == -1) kicker3 = r;
			else kicker4 = r;
		}
	}
	return kicker1 * 2197 + kicker2 * 169 + kicker3 * 13 + kicker4;
}//»
Evaluate(cards, num_cards) {//«
//int HoldemHandEvaluator::Evaluate(Card *cards, int num_cards) {
	if (num_cards == 2) {
		return this.EvaluateTwo(cards);
	}
	else if (num_cards == 3) {
		return this.EvaluateThree(cards);
	}
	else if (num_cards == 4) {
		return this.EvaluateFour(cards);
	}
	for (let r = 0; r <= 12; ++r) this.#rank_counts_[r] = 0;
	for (let s = 0; s < 4; ++s) this.#suit_counts_[s] = 0;
	for (let i = 0; i < num_cards; ++i) {
		let c = cards[i];
		let r = Math.floor(c / NUMSUITS);
		this.#ranks_[i] = r;
		++this.#rank_counts_[r];
		let s = c % NUMSUITS;
		this.#suits_[i] = s;
		++this.#suit_counts_[s];
	}
	let flush_suit = -1;
	for (let s = 0; s < 4; ++s) {
		if (this.#suit_counts_[s] >= 5) {
			flush_suit = s;
			break;
		}
	}
	// Need to handle straights with ace as low
	let r = 12;
	let straight_rank = -1;
	while (true) {
	// See if there are 5 ranks (r, r-1, r-2, etc.) such that there is at
	// least one card in each rank.  In other words, there is an r-high
	// straight.
		let r1 = r;
		let end = r - 4;
		while (r1 >= end && ((r1 > -1 && this.#rank_counts_[r1] > 0) || (r1 == -1 && this.#rank_counts_[12] > 0))) {
			--r1;
		}
		if (r1 == end - 1) {
			// We found a straight
			if (flush_suit >= 0) {
				// There is a flush on the board
				if (straight_rank == -1) straight_rank = r;
				// Need to check for straight flush.  Count how many cards between
				// end and r are in the flush suit.
				let num = 0;
				for (let i = 0; i < num_cards; ++i) {
					if (this.#suits_[i] == flush_suit && ((this.#ranks_[i] >= end && this.#ranks_[i] <= r) || (end == -1 && this.#ranks_[i] == 12))) {
					// This assumes we have no duplicate cards in input
						++num;
					}
				}
				if (num == 5) {
					return kStraightFlush + r;
				}
				// Can't break yet - there could be a straight flush at a lower rank
				// Can only decrement r by 1.  (Suppose cards are:
				// 4c5c6c7c8c9s.)
				--r;
				if (r < 3) break;
			}
			else {
				straight_rank = r;
				break;
			}
		}
		else {
		// If we get here, there was no straight ending at r.  We know there
		// are no cards with rank r1.  Therefore r can jump to r1 - 1.
			r = r1 - 1;
			if (r < 3) break;
		}
	}
	let three_rank = -1;
	let pair_rank = -1;
	let pair2_rank = -1;
	for (let r = 12; r >= 0; --r) {
		let ct = this.#rank_counts_[r];
		if (ct == 4) {
			let hr = -1;
			for (let i = 0; i < num_cards; ++i) {
				let r1 = this.#ranks_[i];
				if (r1 != r && r1 > hr) hr = r1;
			}
			return kQuads + r * 13 + hr;
		}
		else if (ct == 3) {
			if (three_rank == -1) {
				three_rank = r;
			}
			else if (pair_rank == -1) {
				pair_rank = r;
			}
		}
		else if (ct == 2) {
			if (pair_rank == -1) {
				pair_rank = r;
			}
			else if (pair2_rank == -1) {
				pair2_rank = r;
			}
		}
	}
	if (three_rank >= 0 && pair_rank >= 0) {
		return kFullHouse + three_rank * 13 + pair_rank;
	}
	if (flush_suit >= 0) {
		let hr1 = -1, hr2 = -1, hr3 = -1, hr4 = -1, hr5 = -1;
		for (let i = 0; i < num_cards; ++i) {
			if (this.#suits_[i] == flush_suit) {
				let r = this.#ranks_[i];
				if (r > hr1) {
					hr5 = hr4; hr4 = hr3; hr3 = hr2; hr2 = hr1; hr1 = r;
				}
				else if (r > hr2) {
					hr5 = hr4; hr4 = hr3; hr3 = hr2; hr2 = r;
				}
				else if (r > hr3) {
					hr5 = hr4; hr4 = hr3; hr3 = r;
				}
				else if (r > hr4) {
					hr5 = hr4; hr4 = r;
				}
				else if (r > hr5) {
					hr5 = r;
				}
			}
		}
		return kFlush + hr1 * 28561 + hr2 * 2197 + hr3 * 169 + hr4 * 13 + hr5;
	}
	if (straight_rank >= 0) {
		return kStraight + straight_rank;
	}
	if (three_rank >= 0) {
		let hr1 = -1, hr2 = -1;
		for (let i = 0; i < num_cards; ++i) {
			let r = this.#ranks_[i];
			if (r != three_rank) {
				if (r > hr1) {
					hr2 = hr1; hr1 = r;
				}
				else if (r > hr2) {
					hr2 = r;
				}
			}
		}
		if (num_cards == 3) {
			// No kicker
			return kThreeOfAKind + three_rank * 169;
		}
		else if (num_cards == 4) {
			// Only one kicker
			return kThreeOfAKind + three_rank * 169 + hr1 * 13;
		}
		else {
			// Two kickers
			return kThreeOfAKind + three_rank * 169 + hr1 * 13 + hr2;
		}
	}
	if (pair2_rank >= 0) {
		let hr1 = -1;
		for (let i = 0; i < num_cards; ++i) {
			let r = this.#ranks_[i];
			if (r != pair_rank && r != pair2_rank && r > hr1) hr1 = r;
		}
		if (num_cards < 5) {
			// No kicker
			return kTwoPair + pair_rank * 169 + pair2_rank * 13;
		}
		else {
			// Encode two pair ranks plus kicker
			return kTwoPair + pair_rank * 169 + pair2_rank * 13 + hr1;
		}
	}
	if (pair_rank >= 0) {
		let hr1 = -1, hr2 = -1, hr3 = -1;
		for (let i = 0; i < num_cards; ++i) {
			let r = this.#ranks_[i];
			if (r != pair_rank) {
				if (r > hr1) {
					hr3 = hr2; hr2 = hr1; hr1 = r;
				}
				else if (r > hr2) {
					hr3 = hr2; hr2 = r;
				}
				else if (r > hr3) {
					hr3 = r;
				}
			}
		}
		if (num_cards == 3) {
			// One kicker
			return kPair + pair_rank * 2197 + hr1 * 169;
		}
		else if (num_cards == 4) {
			// Two kickers
			return kPair + pair_rank * 2197 + hr1 * 169 + hr2 * 13;
		}
		else {
			// Three kickers
			return kPair + pair_rank * 2197 + hr1 * 169 + hr2 * 13 + hr3;
		}
	}

	let hr1 = -1, hr2 = -1, hr3 = -1, hr4 = -1, hr5 = -1;
	for (let i = 0; i < num_cards; ++i) {
		let r = this.#ranks_[i];
		if (r > hr1) {
			hr5 = hr4; hr4 = hr3; hr3 = hr2; hr2 = hr1; hr1 = r;
		}
		else if (r > hr2) {
			hr5 = hr4; hr4 = hr3; hr3 = hr2; hr2 = r;
		}
		else if (r > hr3) {
			hr5 = hr4; hr4 = hr3; hr3 = r;
		}
		else if (r > hr4) {
			hr5 = hr4; hr4 = r;
		}
		else if (r > hr5) {
			hr5 = r;
		}
	}
	if (num_cards == 3) {
		// Encode top three ranks
		return kNoPair + hr1 * 28561 + hr2 * 2197 + hr3 * 169;
	}
	else if (num_cards == 4) {
		// Encode top four ranks
		return kNoPair + hr1 * 28561 + hr2 * 2197 + hr3 * 169 + hr4 * 13;
	}
	else {
		// Encode top five ranks
		return kNoPair + hr1 * 28561 + hr2 * 2197 + hr3 * 169 + hr4 * 13 + hr5;
	}

}//»

}


//»

//build_hand_value_tree«

//Headers«

#include "cards.h"
#include "files.h"
#include "game.h"
#include "game_params.h"
#include "hand_evaluator.h"
#include "io.h"
#include "params.h"

//»

const DealOneCard = () => {//«
//const DealOneCard = (void) => {
	let max_card = Game.MaxCard();
	let c1;
//	int *tree = new int[max_card + 1];
	let tree = new Array(max_card + 1);
	for (c1 = 0; c1 <= max_card; ++c1) {
//WIJGLM
		OutputCard(c1);//??? WHY ???
		printf("\n");//??? WHY ???
		fflush(stdout);//??? WHY ???
		let i1 = c1;
		tree[i1] = Math.floor(c1 / NUMSUITS);
	}
//	char buf[500];
//	let buf = new Array(500);
//	sprintf(buf, "%s/hand_value_tree.%s.%i.%i.1", Files::StaticBase(), Game::GameName().c_str(), Game::NumRanks(), Game::NumSuits());
	let buf = `"${Files.StaticBase()}/hand_value_tree.${Game.GameName()}.${Game.NumRanks()}.${Game.NumSuits()}.1"`;
	Writer writer(buf);
	for (int i1 = 0; i1 <= max_card; ++i1) {
		writer.WriteInt(tree[i1]);
	}
}//»
const DealTwoCards = (he) => {//«
//const DealTwoCards = (HandEvaluator *he) => {
	let max_card = Game.MaxCard();
//  Card cards[2];
	let cards = new Array(2);
	let c1, c2;
//	int **tree = new int *[max_card + 1];
	let tree = new Array(max_card + 1);
	for (c1 = 1; c1 <= max_card; ++c1) {
		OutputCard(c1);
		printf("\n");
		fflush(stdout);
		cards[0] = c1;
		let i1 = c1;
//		int *tree1 = new int[i1];
		let tree1 = new Array(i1);
		tree[i1] = tree1;
		for (c2 = 0; c2 < c1; ++c2) {
			printf("  ");
			OutputCard(c2);
			printf("\n");
			fflush(stdout);
			cards[1] = c2;
			tree1[c2] = he.Evaluate(cards, 2);
		}
	}
//	char buf[500];
//	sprintf(buf, "%s/hand_value_tree.%s.%i.%i.2", Files::StaticBase(), Game::GameName().c_str(), Game::NumRanks(), Game::NumSuits());
	let buf = `"${Files.StaticBase()}/hand_value_tree.${Game.GameName()}.${Game.NumRanks()}.${Game.NumSuits()}.2"`;
	Writer writer(buf);
	for (int i1 = 1; i1 <= max_card; ++i1) {
		int *tree1 = tree[i1];
		for (int i2 = 0; i2 < i1; ++i2) {
			writer.WriteInt(tree1[i2]);
		}
	}
}//»
const DealThreeCards = (he) => {//«
	let max_card = Game.MaxCard();
	//  Card cards[3];
	let cards = new Array(3);
	let c1, c2, c3;
//	int ***tree = new int **[max_card + 1];
	let tree = new Array(max_card + 1);
	for (c1 = 2; c1 <= max_card; ++c1) {
		OutputCard(c1);
		printf("\n");
		fflush(stdout);
		cards[0] = c1;
		int i1 = c1;
		let tree1 = new Array(i1);
		tree[i1] = tree1;
		for (c2 = 1; c2 < c1; ++c2) {
			cards[1] = c2;
			int i2 = c2;
			let tree2 = new Array(i2);
			tree1[i2] = tree2;
			for (c3 = 0; c3 < c2; ++c3) {
				cards[2] = c3;
				int i3 = c3;
				tree2[i3] = he.Evaluate(cards, 3);
			}
		}
	}
//	char buf[500];
//	sprintf(buf, "%s/hand_value_tree.%s.%i.%i.3", Files::StaticBase(), Game::GameName().c_str(), Game::NumRanks(), Game::NumSuits());
	let buf = `"${Files.StaticBase()}/hand_value_tree.${Game.GameName()}.${Game.NumRanks()}.${Game.NumSuits()}.3"`;
	Writer writer(buf);
	for (int i1 = 2; i1 <= max_card; ++i1) {
		let tree1 = tree[i1];
		for (int i2 = 1; i2 < i1; ++i2) {
			let tree2 = tree1[i2];
			for (int i3 = 0; i3 < i2; ++i3) {
				writer.WriteInt(tree2[i3]);
			}
		}
	}
}//»
const DealFourCards = (he) => {//«
	let max_card = Game.MaxCard();
	//  Card cards[4];
	let cards = new Array(4);
	let c1, c2, c3, c4;
	let tree = new Array(max_card + 1);
	for (c1 = 3; c1 <= max_card; ++c1) {
		OutputCard(c1);
		printf("\n");
		fflush(stdout);
		cards[0] = c1;
		int i1 = c1;
		let tree1 = new Array(i1);
		tree[i1] = tree1;
		for (c2 = 2; c2 < c1; ++c2) {
			cards[1] = c2;
			int i2 = c2;
			let tree2 = new Array(i2);
			tree1[i2] = tree2;
			for (c3 = 1; c3 < c2; ++c3) {
				cards[2] = c3;
				int i3 = c3;
				let tree3 = new Array(i3);
				tree2[i3] = tree3;
				for (c4 = 0; c4 < c3; ++c4) {
					cards[3] = c4;
					int i4 = c4;
					tree3[i4] = he.Evaluate(cards, 4);
				}
			}
		}
	}
//	char buf[500];
//	sprintf(buf, "%s/hand_value_tree.%s.%i.%i.4", Files::StaticBase(), Game::GameName().c_str(), Game::NumRanks(), Game::NumSuits());
	let buf = `"${Files.StaticBase()}/hand_value_tree.${Game.GameName()}.${Game.NumRanks()}.${Game.NumSuits()}.4"`;
	Writer writer(buf);
	for (int i1 = 3; i1 <= max_card; ++i1) {
		let tree1 = tree[i1];
		for (int i2 = 2; i2 < i1; ++i2) {
			let tree2 = tree1[i2];
			for (int i3 = 1; i3 < i2; ++i3) {
				let tree3 = tree2[i3];
				for (int i4 = 0; i4 < i3; ++i4) {
					writer.WriteInt(tree3[i4]);
				}
			}
		}
	}
}//»
// Is this Holdem specific?
const DealFiveCards = (he) => {//«
	let max_card = Game.MaxCard();
	//  Card cards[7];
	let cards = new Array(7);
	let c1, c2, c3, c4, c5;
	let tree = new Array(max_card + 1);
	for (c1 = 4; c1 <= max_card; ++c1) {
		OutputCard(c1);
		printf("\n");
		fflush(stdout);
		cards[0] = c1;
		int i1 = c1;
		let tree1 = new Array(i1);
		tree[i1] = tree1;
		for (c2 = 3; c2 < c1; ++c2) {
			fflush(stdout);
			cards[1] = c2;
			int i2 = c2;
			let tree2 = new Array(i2);
			tree1[i2] = tree2;
			for (c3 = 2; c3 < c2; ++c3) {
				cards[2] = c3;
				int i3 = c3;
				let tree3 = new Array(i3);
				tree2[i3] = tree3;
				for (c4 = 1; c4 < c3; ++c4) {
					cards[3] = c4;
					int i4 = c4;
					let tree4 = new Array(i4);
					tree3[i4] = tree4;
					for (c5 = 0; c5 < c4; ++c5) {
						cards[4] = c5;
						int i5 = c5;
						tree4[i5] = he.Evaluate(cards, 5);
					}
				}
			}
		}
	}
//	char buf[500];
//	sprintf(buf, "%s/hand_value_tree.%s.%i.%i.5", Files::StaticBase(), Game::GameName().c_str(), Game::NumRanks(), Game::NumSuits());
	let buf = `"${Files.StaticBase()}/hand_value_tree.${Game.GameName()}.${Game.NumRanks()}.${Game.NumSuits()}.5"`;
	Writer writer(buf);
	for (int i1 = 4; i1 <= max_card; ++i1) {
		let tree1 = tree[i1];
		for (int i2 = 3; i2 < i1; ++i2) {
			let tree2 = tree1[i2];
			for (int i3 = 2; i3 < i2; ++i3) {
				let tree3 = tree2[i3];
				for (int i4 = 1; i4 < i3; ++i4) {
					let tree4 = tree3[i4];
					for (int i5 = 0; i5 < i4; ++i5) {
						writer.WriteInt(tree4[i5]);
					}
				}
			}
		}
	}
}//»
const DealSixCards = (he) => {//«
	let max_card = Game.MaxCard();
	//  Card cards[7];
	let cards = new Array(7);
	let c1, c2, c3, c4, c5, c6;
	let tree = new Array(max_card + 1);
	for (c1 = 5; c1 <= max_card; ++c1) {
		OutputCard(c1);
		printf("\n");
		fflush(stdout);
		cards[0] = c1;
		int i1 = c1;
		let tree1 = new Array(i1);
		tree[i1] = tree1;
		for (c2 = 4; c2 < c1; ++c2) {
			cards[1] = c2;
			int i2 = c2;
			let tree2 = new Array(i2);
			tree1[i2] = tree2;
			for (c3 = 3; c3 < c2; ++c3) {
				cards[2] = c3;
				int i3 = c3;
				let tree3 = new Array(i3);
				tree2[i3] = tree3;
				for (c4 = 2; c4 < c3; ++c4) {
					cards[3] = c4;
					int i4 = c4;
					let tree4 = new Array(i4);
					tree3[i4] = tree4;
					for (c5 = 1; c5 < c4; ++c5) {
						cards[4] = c5;
						int i5 = c5;
						let tree5 = new Array(i5);
						tree4[i5] = tree5;
						for (c6 = 0; c6 < c5; ++c6) {
							cards[5] = c6;
							int i6 = c6;
							tree5[i6] = he.Evaluate(cards, 6);
						}
					}
				}
			}
		}
	}
//	char buf[500];
//	sprintf(buf, "%s/hand_value_tree.%s.%i.%i.6", Files::StaticBase(), Game::GameName().c_str(), Game::NumRanks(), Game::NumSuits());
	let buf = `"${Files.StaticBase()}/hand_value_tree.${Game.GameName()}.${Game.NumRanks()}.${Game.NumSuits()}.6"`;
	Writer writer(buf);
	for (int i1 = 5; i1 <= max_card; ++i1) {
		let tree1 = tree[i1];
		for (int i2 = 4; i2 < i1; ++i2) {
			let tree2 = tree1[i2];
			for (int i3 = 3; i3 < i2; ++i3) {
				let tree3 = tree2[i3];
				for (int i4 = 2; i4 < i3; ++i4) {
					let tree4 = tree3[i4];
					for (int i5 = 1; i5 < i4; ++i5) {
						let tree5 = tree4[i5];
						for (int i6 = 0; i6 < i5; ++i6) {
							writer.WriteInt(tree5[i6]);
						}
					}
				}
			}
		}
	}
}//»
// This is not as general as it could be.  Holdem specific.
const DealSevenCards = (he) => {//«
	let max_card = Game.MaxCard();
	//  Card cards[7];
	let cards = new Array(7);
	let c1, c2, c3, c4, c5, c6, c7;
	let tree = new Array(max_card + 1);
	for (c1 = 6; c1 <= max_card; ++c1) {
		OutputCard(c1);
		printf("\n");
		fflush(stdout);
		cards[0] = c1;
		int i1 = c1;
		let tree1 = new Array(i1);
		tree[i1] = tree1;
		for (c2 = 5; c2 < c1; ++c2) {
			printf("  ");
			OutputCard(c2);
			printf("\n");
			fflush(stdout);
			cards[1] = c2;
			int i2 = c2;
			let tree2 = new Array(i2);
			tree1[i2] = tree2;
			for (c3 = 4; c3 < c2; ++c3) {
				cards[2] = c3;
				int i3 = c3;
				let tree3 = new Array(i3);
				tree2[i3] = tree3;
				for (c4 = 3; c4 < c3; ++c4) {
					cards[3] = c4;
					int i4 = c4;
					let tree4 = new Array(i4);
					tree3[i4] = tree4;
					for (c5 = 2; c5 < c4; ++c5) {
						cards[4] = c5;
						int i5 = c5;
						let tree5 = new Array(i5);
						tree4[i5] = tree5;
						for (c6 = 1; c6 < c5; ++c6) {
							cards[5] = c6;
							int i6 = c6;
							let tree6 = new Array(i6);
							tree5[i6] = tree6;
							for (c7 = 0; c7 < c6; ++c7) {
								cards[6] = c7;
								int i7 = c7;
								tree6[i7] = he.Evaluate(cards, 7);
							}
						}
					}
				}
			}
		}
	}
//	char buf[500];
//	sprintf(buf, "%s/hand_value_tree.%s.%i.%i.7", Files::StaticBase(),Game::GameName().c_str(), Game::NumRanks(), Game::NumSuits());
	let buf = `"${Files.StaticBase()}/hand_value_tree.${Game.GameName()}.${Game.NumRanks()}.${Game.NumSuits()}.7"`;
	Writer writer(buf);
	for (int i1 = 6; i1 <= max_card; ++i1) {
		let tree1 = tree[i1];
		for (int i2 = 5; i2 < i1; ++i2) {
			let tree2 = tree1[i2];
			for (int i3 = 4; i3 < i2; ++i3) {
				let tree3 = tree2[i3];
				for (int i4 = 3; i4 < i3; ++i4) {
					let tree4 = tree3[i4];
					for (int i5 = 2; i5 < i4; ++i5) {
						let tree5 = tree4[i5];
						for (int i6 = 1; i6 < i5; ++i6) {
							let tree6 = tree5[i6];
							for (int i7 = 0; i7 < i6; ++i7) {
								writer.WriteInt(tree6[i7]);
							}
						}
					}
				}
			}
		}
	}
}//»
const Usage = (prog_name) => {//«
	fprintf(stderr, "USAGE: %s <config file>\n", prog_name);
	exit(-1);
}//»
const main = (argc, argv) => {//«
//int main(int argc, char *argv[]) {
	if (argc != 2) Usage(argv[0]);
	Files::Init();
	unique_ptr<Params> game_params = CreateGameParams();
	game_params->ReadFromFile(argv[1]);
	Game::Initialize(*game_params);

	HandEvaluator *he = HandEvaluator::Create(Game::GameName());
	int num_cards = 0;
	for (int s = 0; s <= Game::MaxStreet(); ++s) {
		num_cards += Game::NumCardsForStreet(s);
	}
	if (num_cards == 1) {
		DealOneCard();
	}
	else if (num_cards == 2) {
		DealTwoCards(he);
	}
	else if (num_cards == 3) {
		DealThreeCards(he);
	}
	else if (num_cards == 4) {
		DealFourCards(he);
	}
	else if (num_cards == 5) {
		DealFiveCards(he);
	}
	else if (num_cards == 6) {
		DealSixCards(he);
	}
	else if (num_cards == 7) {
		DealSevenCards(he);
	}
	else {
		fprintf(stderr, "Unsupported number of cards: %u\n", num_cards);
		exit(-1);
	}
	delete he;
}//»

//»

//»

//Commands«

const com_slum= class extends Com{
	init(){
	}
	run(){
		const {args}=this;
		this.ok();
	}
}

//»

const coms = {//«
slum: com_slum
}//»

export {coms};




