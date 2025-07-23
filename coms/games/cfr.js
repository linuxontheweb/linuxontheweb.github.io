/* Example weird C++ idiom @WMNGHKHF
This is just a fancy way to assign to onf of two struct fields: gs.p2roll or gs.p1roll
double getPayoff(GameState gs, int fixed_player, int oppChanceOutcome){
	int & oppRoll = (updatePlayer == 1 ? gs.p2roll : gs.p1roll); 
	oppRoll = oppChanceOutcome;
}
*/
//« 7/21/25: This file exists to implement Marc Lanctot (UAlberta, Maastricht, etc) 
// and company's stuff on the open internets.
//»

//Imports«
//const{globals, Desk}=LOTW;
const {Com} = LOTW.globals.ShellMod.comClasses;
const{log,jlog,cwarn,cerr}=LOTW.api.util;
//»

//KuhnTrainer«
//Example from An "Introduction to Counterfactual Regret Minimization" (p. 11)
//https://www.ma.imperial.ac.uk/~dturaev/neller-lanctot.pdf

//import java.util.Arrays;
//import java.util.Random;
//import java.util.TreeMap;

//Kuhn Poker definitions
//const ITERATIONS = 1000000;

const KuhnTrainer = () => {//«

//const ITERATIONS = 1000;
const nodeMap = {};

const PASS = 0, BET = 1, NUM_ACTIONS = 2;
//public static final Random random = new Random();

class Node {//«

	constructor(){//«

//	String infoSet;
//	double[] regretSum = new double[NUM_ACTIONS],
//	strategy = new double[NUM_ACTIONS],
//	strategySum = new double[NUM_ACTIONS];

//		this.strategy = new Array(NUM_ACTIONS);

//		this.regretSum = new Array(NUM_ACTIONS);
		this.regretSum = [0, 0];

//		this.strategySum = new Array(NUM_ACTIONS);
		this.strategySum = [0, 0];
	}//»

	getStrategy(realizationWeight) {//«
//	private double[] getStrategy(double realizationWeight) {//
	//Get current information set mixed strategy through regret-matching
		const { regretSum, strategySum } = this;
//		let strategy = new Array(NUM_ACTIONS);
		let strategy = [];

		let normalizingSum = 0;
		for (let a = 0; a < NUM_ACTIONS; a++) {
			strategy[a] = regretSum[a] > 0 ? regretSum[a] : 0;
			normalizingSum += strategy[a];
		}
		for (let a = 0; a < NUM_ACTIONS; a++) {
			if (normalizingSum > 0) {
				strategy[a] /= normalizingSum;
			}
			else {
				strategy[a] = 1.0 / NUM_ACTIONS;
			}
			strategySum[a] += realizationWeight * strategy[a];
		}
		return strategy;
	}//»

	 getAverageStrategy() {//«
//	public double[] getAverageStrategy() {//
	//Get average information set mixed strategy across all training iterations 
		const { strategySum } = this;
//		double[] avgStrategy = new double[NUM_ACTIONS];
//		let avgStrategy = new Array(NUM_ACTIONS);
		let avgStrategy = [];
		let normalizingSum = 0;
		for (let a = 0; a < NUM_ACTIONS; a++) {
			normalizingSum += strategySum[a];
		}
		for (let a = 0; a < NUM_ACTIONS; a++) {
			if (normalizingSum > 0) avgStrategy[a] = strategySum[a] / normalizingSum;
			else avgStrategy[a] = 1.0 / NUM_ACTIONS;
		}
		return avgStrategy;
	}//»

	toString() {//«
//	public String toString() {//
	//Get information set string representation
//		return String.format("%4s: %s", infoSet, Arrays.toString(getAverageStrategy()));
		let s = this.infoSet;
		let avg_strat = this.getAverageStrategy();
//		for (let i=0; i < NUM_ACTIONS; i++){
//			s+= ` ${avg_strat[i]}`;
//		}
		for (let strat of avg_strat){
			s+= ` ${strat.toFixed(4)}`;
		}
		return s;
	}//»

}//»

//public TreeMap<String, Node> nodeMap = new TreeMap<String, Node>();
//const nodeMap = new Map;

const cfr = (cards, history, p0, p1) => {//«
//private double cfr(int[] cards, String history, double p0, double p1) {//
//Counterfactual regret minimization iteration

	let plays = history.length;
	let player = plays % 2;
	let opponent = 1 - player;
	//Return payoff for terminal states
	if (plays > 1) {
//		let terminalPass = history.charAt(plays - 1) == ’p’;
		let terminalPass = history[plays - 1] == "p";
//		let doubleBet = history.substring(plays - 2, plays).equals("bb");
		let doubleBet = history.slice(plays - 2, plays) == "bb";
		let isPlayerCardHigher = cards[player] > cards[opponent];
		if (terminalPass) {
			if (history == "pp") {
				return isPlayerCardHigher ? 1 : -1;
			}
			else {
				return 1;
			}
		}
		else if (doubleBet) {
			return isPlayerCardHigher ? 2 : -2;
		}
	}
	let infoSet = cards[player] + history;
	//Get information set node or create it if nonexistant

//	let node = nodeMap.get(infoSet);
	let node = nodeMap[infoSet];
//	if (node == null) {
	if (!node) {
		node = new Node();
		node.infoSet = infoSet;
//		nodeMap.put(infoSet, node);
		nodeMap[infoSet] = node;
	}
	//For each action, recursively call cfr with additional history and probability

//	double[] strategy = node.getStrategy(player == 0 ? p0 : p1);
	let strategy = node.getStrategy(player == 0 ? p0 : p1);

//	double[] util = new double[NUM_ACTIONS];
//	let util = new Array(NUM_ACTIONS);
	let util = [];
	let nodeUtil = 0;
	for (let a = 0; a < NUM_ACTIONS; a++) {
		let nextHistory = history + (a == 0 ? "p" : "b");
		util[a] = player == 0 ?
			-cfr(cards, nextHistory, p0 * strategy[a], p1) :
			-cfr(cards, nextHistory, p0, p1 * strategy[a]);
		nodeUtil += strategy[a] * util[a];
	}
	//For each action, compute and accumulate counterfactual regret
	for (let a = 0; a < NUM_ACTIONS; a++) {
		let regret = util[a] - nodeUtil;
		node.regretSum[a] += (player == 0 ? p1 : p0) * regret;
	}
	return nodeUtil;
}//»
const train=(iterations)=>{//«
//Train Kuhn poker
if (!(Number.isFinite(iterations) && iterations > 0)) {
cerr("Invalid iterations");
return;
}
//	int[] cards = {1, 2, 3};
	let cards = [1, 2, 3];
	let util = 0;
	for (let i = 0; i < iterations; i++) {
		//Shuffle cards
		for (let c1 = cards.length - 1; c1 > 0; c1--) {
			let c2 = Math.floor(Math.random() * (c1 + 1))
			let tmp = cards[c1];
			cards[c1] = cards[c2];
			cards[c2] = tmp;
		}
		util += cfr(cards, "", 1, 1);
	}
	console.log("Average game value: " + util / iterations);
	for (let key in nodeMap) {
//	for (let n of nodeMap.values()) {
//	for (Node n : nodeMap.values()) {
		console.log(nodeMap[key].toString());
	}

}//»
return train

};//»

//»

//Bluff Dice«

/*C++

//defs.h «
#define FSICFR         0
#define FSIPCS         0

#define ABS(x) ((x) >= 0 ? (x) : (-(x)))
#define CHKDBL(x)    { int c = fpclassify(x); if (!(c == FP_NORMAL || c == FP_ZERO)) cout << "x = " << x << endl; assert(c == FP_NORMAL || c == FP_ZERO); }
#define CHKPROB(x)   CHKDBL((x)); assert((x) >= 0.0 && (x) <= 1.0)
#define CHKPROBNZ(x) CHKDBL((x)); assert((x) > 0.0 && (x) <= 1.0)
#define ABS(x)       ((x) >= 0 ? (x) : (-(x)))
#define MAX(x,y)     ((x) > (y) ? (x) : (y))
#define ASSERTEQZERO(x)    assert((ABS((x))) < 0.00000000000001)

//static const size_t SIZE_MAX = std::numeric_limits<std::size_t>::max();

#define NEGINF   -100000000.0
#define POSINF   -100000000.0

// note: no support for diefaces other than 6 for P1DICE != 1 or P2DICE != 1

#define VAL11 (-0.0271317829457364)
#define VAL21 (0.6189107786524395)
#define VAL12 (-0.5882679528387005)
#define VAL22 (0.01265214009195285)
#define VAL31 (0.8645693929896585)
#define VAL13 (-0.8497395132282245)
#define VAL32 (0.0)

// these need to be defined for PCS
#if P1DICE == 1
#define P1CO 6
#elif P1DICE == 2
#define P1CO 21
#elif P1DICE == 3
#define P1CO 56
#elif P1DICE == 4
#define P1CO 126
#elif P1DICE == 5
#define P1CO 252
#endif

#if P2DICE == 1
#define P2CO 6
#elif P2DICE == 2
#define P2CO 21
#elif P2DICE == 3
#define P2CO 56
#elif P2DICE == 4
#define P2CO 126
#elif P2DICE == 5
#define P2CO 252
#endif

#if P1CO > P2CO
#define MAXCO P1CO
#else
#define MAXCO P2CO
#endif

// for probing
#define ISKMAX 10
#define ACTMAX 10 
#if 0
#if (P1DICE + P2DICE) == 2 
#define ISKMAX 131072   // 2^17 (12 for actions, 3 for die, 1 for player + 1)
#define ACTMAX 13 
#elif (P1DICE + P2DICE) == 3
#define ISKMAX 33554432 // 2^25 (18 for actions, 5 for die, 1 for player + 1)
#define ACTMAX 19 
#elif (P1DICE + P2DICE) == 4
#define ISKMAX 10 // 2^25 (18 for actions, 5 for die, 1 for player + 1)
#define ACTMAX 10 
#else
#error "P1DICE + P2DICE not defined for probing"
#endif
#endif
//»

*/

class GameState {//«

//  int p1roll;           // the outcome of p1's roll
//  int p2roll;           // the outcome of p2's roll
//  int curbid;           // current bid (between 1 and 13)
//  int prevbid;          // prev bid from last turn
//  int callingPlayer;    // the player calling bluff (1 or 2)

constructor () {
//  GameState() {
	this.p1roll = this.p2roll = this.curbid = this.prevbid = 0;
	this.callingPlayer = 0;
}

};//»
class Infoset {//«
//struct Infoset {
/*
  double cfr[BLUFFBID];
  double totalMoveProbs[BLUFFBID];
  double curMoveProbs[BLUFFBID];

  int actionshere;
  unsigned long long lastUpdate;
*/
};//»
class StopWatch {//«
//  timeb tstart, tend;
#tstart;
#tend;
//public:
//StopWatch() { ftime(&tstart); }
constructor(){
	this.#tstart = new Date().getTime();
}
reset() { 
//	ftime(&tstart); 
	this.#tstart = new Date().getTime();
}
stop() {
//  double stop() {
//  ftime(&tend);
//  return ((tend.time*1000 + tend.millitm) - (tstart.time*1000 + tstart.millitm) ) / 1000.0;
	this.#tend = new Date().getTime();
	return (this.#tend - this.#tstart) / 1000;
}

};//»

function Util(){//«

//#include "bluff.h"

const to_string = (i) => {//«
//string to_string(int i) {
//std::string to_string(double i) {
//std::string to_string(unsigned long long i) {
	ostringstream oss;
	oss << i;
	return oss.str();
}//»
const to_ull = (str) => {//«
//unsigned long long to_ull(string str) {
	stringstream stmT;
	unsigned long long iR;

	stmT << str;
	stmT >> iR;

	return iR;
}//»
const to_int = (str) => {//«
//int to_int(string str) {
  stringstream stmT;
  int iR;

  stmT << str;
  stmT >> iR;

  return iR;
}//»
const to_double = (str) => {//«
//double to_double(string str) {
  stringstream stmT;
  double iR;

  stmT << str;
  stmT >> iR;

  return iR;
}//»
const getSortedKeys = (m, kl) => {//«
//void getSortedKeys(map<int,bool> & m, list<int> & kl) {
	map<int,bool>::iterator iter;
	for (iter = m.begin(); iter != m.end(); iter++) {
		kl.push_back(iter->first);
	}

	kl.sort();
}//»
const replace = (str, from, to) => {//«
//bool replace(std::string& str, const std::string& from, const std::string& to) {
	size_t start_pos = str.find(from);
	if(start_pos == std::string::npos) return false;
	str.replace(start_pos, from.length(), to);
	return true;
}//»
const split = (tokens, line, delimiter) => {//«
//void split(vector<string> & tokens, const string line, char delimiter) {
// if there is none, then return just the string itself
//  (already works like this)
//if (line.find(delimiter) == string::npos)
//{
//  tokens.push_back(line);
//  return;
//}

	string::size_type index = 0;

	while (index < line.length()) {
		string::size_type new_index = line.find(delimiter, index);
		if (new_index == string::npos) {
			tokens.push_back(line.substr(index));
			break;
		}
		else {
			tokens.push_back(line.substr(index, new_index - index));
			index = new_index+1;
		}
	}

	// special case with token as the last character
	if (index == line.length()) tokens.push_back("");

}//»
const pow2 = (i) => {//«
//unsigned long long pow2(int i) {
	int answer = 1;//Was: ull
	return (answer << i);
}//»
const bubsort = (array, size) => {//«
//void bubsort(int * array, int size) {
	let swapped_flag;//Was: bool
	do {
		swapped_flag = false;
		let i;//Was: int
		for (i = 0; i < (size-1); i++) {
			if (array[i] > array[i+1]) {// sort increasing
				let tmp = array[i];//Was: int
				array[i] = array[i+1];
				array[i+1] = tmp;
				swapped_flag = true;
			}
		}
	}
	while (swapped_flag);
}//»
const infosetkey_to_string = (infosetkey) => {//«
//string infosetkey_to_string(unsigned long long infosetkey) {
	let player = (infosetkey & 1) + 1;//Was: int
	infosetkey >>= 1;
	let str = "P" + to_string(player);//Was: string
	//Was: int
	let roll = infosetkey & (pow2(iscWidth) - 1); // for iscWidth = 3, 2**3 - 1 = 8-1 = 7
	infosetkey >>= iscWidth;

	str += (" " + to_string(roll));

	for (let i = 1; i < BLUFFBID; i++) {//Was: int
		let bit = (infosetkey >> (BLUFFBID-i)) & 1;//Was: int
		if (bit == 1) {
			let dice, face;//Was: int
			convertbid(dice, face, i);
			str += (" " + to_string(dice) + "-" + to_string(face));
		}
	}
	return str;
}//»
const getCurDateTime = () => {//«
//string getCurDateTime() {
	char str[200] = { 0 };

	time_t tval = time(NULL);
	struct tm * tmptr = localtime(&tval);
	strftime(str, 200, "%Y-%m-%d %H:%M:%S", tmptr);

	string cppstr = str;
	return cppstr;
}//»
const seedCurMicroSec = () => {//«
//void seedCurMicroSec() {
/*
	struct timeval tv;
	gettimeofday(&tv, NULL);

	#if defined(_WIN32) || defined(_WIN64)
	srand(tv.tv_usec);
	#else
	srand48(tv.tv_usec);
	#endif
*/
}//»
const unifRand01 = () => {//«
//double unifRand01() {
/*
  #if defined(_WIN32) || defined(_WIN64)
  // adding the 1 here just seems outright wrong, but if I don't add it then this sometimes returns 1
  // and the code breaks. I spent some time searching for a better answer and could not one without 
  // a dependency to boost.
  return (static_cast<double>(rand()) / (RAND_MAX+1));
  #else
  return drand48();
  #endif
*/
	return Math.random();
}//»

}//»
function InfosetStore_NS() {//«

//infosetstore
//#define ROWS 100
const ROWS = 100

//st: static
let totalLookups = 0;//Was:st ull

let totalMisses = 0;//Was:st ull

return class {
//class InfosetStore {

//Private vars«
// stores the position of each infoset in the large table
// unlike in bluffpt, this is a hash table that uses linear probing

//unsigned long long * indexKeys; 
#indexKeys;
//unsigned long long * indexVals; 
#indexVals;
//unsigned long long indexSize;
#indexSize;

// To avoid large contiguous portions of memory, store as rows of bitsets
// double ** tablerows;
#tablerows;

// total items to be stored
// size in bytes of each
// # bytes per row
// # rows
// unsigned long long size; 
#size;
// unsigned long long rowsize;
#rowsize;
// unsigned long long rows;
#rows;

// last row is the leftover (smaller)
// unsigned long long lastRowSize;
#lastRowSize;

// are we added infosets to this store? when doing so, we update the infoset counter
// and add info to the index. when not doing so, we assume the index will get us our
// position and simply replace what's there
//bool addingInfosets;
#addingInfosets;
//unsigned long long nextInfosetPos;
#nextInfosetPos;
//unsigned long long added;
#added;
//»

#get_priv(infoset_key, infoset, moves, firstmove) {//«
//bool get_priv(unsigned long long infoset_key, Infoset & infoset, int moves, int firstmove); 
//unsigned long long row, col, pos, curRowSize;
	let row, col, pos, curRowSize;

	//pos = getPosFromIndex(infoset_key);  // uses a hash table
	pos = this.getPosFromIndex1(infoset_key);  // uses a hash table
	if (pos >= size) return false;

	row = pos / this.#rowsize;
	col = pos % this.#rowsize;
	curRowSize = (row < (this.#rows-1) ? this.#rowsize : this.#lastRowSize);

	// get the number of moves
	assert(row < this.#rows); assert(col < curRowSize); assert(pos < this.#size); 
	let x;//unsigned long long x; 
	let y = this.#tablerows[row][col];//double y = tablerows[row][col];
	assert(sizeof(x) == sizeof(double));
	memcpy(&x, &y, sizeof(x)); 
	infoset.actionshere = static_cast<int>(x); 
	assert(infoset.actionshere > 0);
	this.#next(row, col, pos, curRowSize);

	// get the lastupdate
	assert(row < this.#rows); assert(col < this.#curRowSize);  assert(pos < this.#size); 
	y = this.#tablerows[row][col];
	assert(sizeof(x) == sizeof(double));
	memcpy(&x, &y, sizeof(x)); 
	infoset.lastUpdate = x; 
	this.#next(row, col, pos, curRowSize);

	for (let i = 0, m = firstmove; i < moves; i++,m++) {//Was: int
		assert(row < this.#rows);
		assert(col < this.#curRowSize); 
		assert(pos < this.#size); 
		infoset.cfr[m] = this.#tablerows[row][col];
		this.#next(row, col, pos, curRowSize);
		assert(row < this.#rows);
		assert(col < this.#curRowSize); 
		assert(pos < this.#size); 
		infoset.totalMoveProbs[m] = this.#tablerows[row][col];
		this.#next(row, col, pos, curRowSize); 
	}
	// now do the usual regret matching to get the curMoveProbs
	let totPosReg = 0.0;////Was: dbl
	let all_negative = true;////Was: bool
	for (let i = 0, m = firstmove; i < moves; i++, m++) {//Was: int
		let movenum = m;//Was: int
		let cfr = infoset.cfr[movenum];//Was: double
		//	CHKDBL(cfr);
		if (cfr > 0.0) {
			totPosReg = totPosReg + cfr;
			all_negative = false;
		}
	}
	let probSum = 0.0;//Was: dbl
	for (let i = 0, m = firstmove; i < moves; i++, m++) {//Was: int
		let movenum = m;//int movenum = m;
		if (!all_negative) {
			if (infoset.cfr[movenum] <= 0.0) {
				infoset.curMoveProbs[movenum] = 0.0;
			}
			else {
				assert(totPosReg >= 0.0);
				if (totPosReg > 0.0) {// regret-matching
					infoset.curMoveProbs[movenum] = infoset.cfr[movenum] / totPosReg;
				}
			}
		}
		else {
			infoset.curMoveProbs[movenum] = 1.0/moves;
		}
		CHKPROB(infoset.curMoveProbs[movenum]);
		probSum += infoset.curMoveProbs[movenum];
	}
	return true;
}//»
#put_priv(infoset_key, infoset, moves, firstmove) {//«
//void put_priv(unsigned long long infoset_key, Infoset & infoset, int moves, int firstmove); 
	let row, col, pos, curRowSize;// unsigned long long row, col, pos, curRowSize;
	assert(moves > 0);
	let newinfoset = false; //bool newinfoset = false; 

	let hashIndex = 0; //unsigned long long hashIndex = 0;

	//unsigned long long thepos = getPosFromIndex(infoset_key, hashIndex);  
	//unsigned long long thepos = getPosFromIndex2(infoset_key, hashIndex);  
	let thepos = this.getPosFromIndex2(infoset_key, hashIndex);  
	if (this.#addingInfosets && thepos >= this.#size) {
		newinfoset = true; 
		// new infoset to be added at the end
		assert(this.#nextInfosetPos < this.#size); 
		// only add it if it's a new info set
		pos = this.#nextInfosetPos;
		row = this.#nextInfosetPos / this.#rowsize;
		col = this.#nextInfosetPos % this.#rowsize;
		curRowSize = (row < (this.#rows-1) ? this.#rowsize : this.#lastRowSize);
		//index[infoset_key] = pos;
		assert(pos < this.#size); 
		this.#indexKeys[hashIndex] = infoset_key;
		this.#indexVals[hashIndex] = pos;
		//log("Adding infosetkey: " << infoset_key); 
	}
	else {
		// we've seen this one before, load it
		newinfoset = false; 
		//pos = index[infoset_key];
		//pos = indexVals[hashIndex]; 
		assert(thepos < this.#size); 
		pos = thepos; 
		row = pos / this.#rowsize;
		col = pos % this.#rowsize;
		curRowSize = (row < (this.#rows-1) ? this.#rowsize : this.#lastRowSize);
	}

	// store the number of moves at this infoset
	assert(row < this.#rows);
	assert(col < this.#curRowSize); 
	assert(pos < this.#size); 
	let x = moves;//Was: ull
	let y;//Was: dbl
	assert(sizeof(x) == sizeof(double));
	memcpy(&y, &x, sizeof(x));
	this.#tablerows[row][col] = y; 
	this.#next(row, col, pos, curRowSize);

	// store the last update iter of this infoset
	assert(row < this.#rows);
	assert(col < this.#curRowSize); 
	assert(pos < this.#size); 
	x = infoset.lastUpdate;
	assert(sizeof(x) == sizeof(double));
	memcpy(&y, &x, sizeof(x));
	this.#tablerows[row][col] = y; 
	this.#next(row, col, pos, curRowSize);

	// moves are from 1 to moves, so write them in order. 
	// first, regret, then avg. strat
	for (let i = 0, m = firstmove; i < moves; i++, m++) { //Was: int
		//log("pos = " << pos << ", row = " << row);
		if (row >= this.#rows) {
			log("iss stats: " << iss.getStats());
		}

		assert(row < this.#rows);
		assert(col < this.#curRowSize); 
		assert(pos < this.#size); 
		CHKDBL(infoset.cfr[m]); 
		this.#tablerows[row][col] = infoset.cfr[m];

		this.#next(row, col, pos, curRowSize);

		assert(row < this.#rows);
		assert(col < this.#curRowSize); 
		assert(pos < this.#size); 
		this.#tablerows[row][col] = infoset.totalMoveProbs[m];

		this.#next(row, col, pos, curRowSize); 

	}

	if (newinfoset && this.#addingInfosets) {
		this.#nextInfosetPos = pos;
		this.#added++;
	}
}//»
#next(row, col, pos, curRowSize) {//«
//void next(unsigned long long & row, unsigned long long & col, unsigned long long & pos, unsigned long long & curRowSize); 
	pos++;
	col++; 

	if (col >= curRowSize) {
		col = 0; 
		row++;
		curRowSize = (row < (this.#rows-1) ? this.#rowsize : this.#lastRowSize);
	}
}//»

//public:

constructor(){//«
//  InfosetStore(){
	this.#tablerows = null;
}//»
destroy() {//«
//void destroy() {
	if (tablerows != NULL) {
		delete [] indexKeys; 
		delete [] indexVals;

		for (let i = 0; i < this.#rows; i++) {//Was: uint
			delete [] tablerows[i];
		}
		delete [] tablerows;
	}

	tablerows = NULL;
}//»
/*«~InfosetStore()
~InfosetStore() {
	destroy(); 
}
»*/
init(_size, _indexsize) {//«

// First param: total # of doubles needed. 
//   Should be the total # of (infoset,action) pairs times 2 (2 doubles each)
// Second param: size of index. 
//   Should be the max number taken by an infoset key represented as an integer + 1

//void init(unsigned long long _size, unsigned long long _indexsize);
	log("IS: init"); 

	this.#size = _size;
	this.#indexSize = _indexsize; 

	this.#rowsize = size / (ROWS-1); 
	this.#lastRowSize = size - rowsize*(ROWS-1);
	this.#rows = ROWS;

	let i = 0; //Was: int
	while (this.#lastRowSize > this.#rowsize) {// will sometimes happen when _size is small 
		i++;
		this.#rows = ROWS-i;
		this.#rowsize = size / (rows-1); 
		this.#lastRowSize = size - rowsize*(rows-1);
	}

	assert(i >= 0 && i <= 99); 

	log("IS: stats " << getStats());
	log("IS: allocating memory.. ");

	// allocate the index
	this.#indexKeys = new Array(this.#indexSize);//Was: ull[]
	this.#indexVals = new Array(this.#indexSize);//Was: ull[]
	for (let i = 0; i < this.#indexSize; i++) { //Was: ull
		this.#indexKeys[i] = this.#indexVals[i] = size;   // used to indicate that no entry is present
	}
	// allocate the rows 
	// To avoid large contiguous portions of memory, store as rows of bitsets
	// double ** tablerows;
	//  this.#tablerows = new double* [this.#rows];
	this.#tablerows = new Array(this.#rows);
	assert(tablerows != NULL);
	for (let i = 0; i < this.#rows; i++) {//Was: ull
		if (i != (this.#rows-1)) {
			this.#tablerows[i] = new Array(this.#rowsize);//Was: dbl[]
			assert(tablerows[i] != NULL);
			for (let j = 0; j < this.#rowsize; j++) {//Was: ull
				this.#tablerows[i][j] = 0.0;
			}
		}
		else {
			this.#tablerows[i] = new Array(this.#lastRowSize);//Was: dbl[]
			assert(tablerows[i] != NULL);
			for (let j = 0; j < this.#lastRowSize; j++){//Was: uint
				this.#tablerows[i][j] = 0.0;
			}
		}
	}

	// set to adding information sets
	this.#addingInfosets = true;
	this.#nextInfosetPos = 0;
	this.#added = 0;

	log("IS: init done. ");
}//»
getSize() { //«
//  unsigned long long getSize() { return size; }
	return this.#size; 
}//»
  // returns the position into the large table or indexSize if not found
  // hashIndex is set to the index of the hash table where this key would go
getPosFromIndex1(infoset_key) {//«
// use this one if you don't care about the hashIndex
// unsigned long long getPosFromIndex(unsigned long long infoset_key);
	let hi = 0;//Was: ull
	return this.getPosFromIndex2(infoset_key, hi); 
}//»
getPosFromIndex2(infoset_key, hashIndex) {//«
//unsigned long long getPosFromIndex(unsigned long long infoset_key, unsigned long long & hashIndex); 
	let start = infoset_key % this.#indexSize; //Was: ull
	let misses = 0; //Was: ull
	for (let i = start; misses < this.#indexSize; misses++) {//Was: ull
		if (this.#indexKeys[i] == infoset_key && this.#indexVals[i] < size)  {
			// cache hit 
			totalLookups++; 
			totalMisses += misses;
			hashIndex = i; 
			return this.#indexVals[i]; 
		}
		else if (indexVals[i] >= size){// index keys can be >= size since they're arbitrary, but not values!
			totalLookups++; 
			totalMisses += misses;
			hashIndex = i;
			return size; 
		}
		i = i+1; 
		if (i >= this.#indexSize) i = 0; 
	}

	// should be large enough to hold everything
	assert(false); 
	return 0;
}//»
getStats(){//«
//  std::string getStats();
//  string str; 
/*
  str += (to_string(size) + " "); 
  str += (to_string(rowsize) + " "); 
  str += (to_string(rows) + " "); 
  str += (to_string(lastRowSize) + " "); 
  str += (to_string(added) + " "); 
  str += (to_string(nextInfosetPos) + " "); 
  str += (to_string(totalLookups) + " "); 
  str += (to_string(totalMisses) + " "); 
*/
	let str="";
	str += (this.#size + " "); 
	str += (this.#rowsize + " "); 
	str += (this.#rows + " "); 
	str += (this.#lastRowSize + " "); 
	str += (this.#added + " "); 
	str += (this.#nextInfosetPos + " "); 
	str += (totalLookups + " "); 
	str += (totalMisses + " "); 

	let avglookups = (totalLookups + totalMisses) / (totalLookups); //Was: dbl

	let percent_full = (this.#nextInfosetPos) /  (this.#size) * 100.0;  //Was: dbl

	str += (avglookups + " ");
	str += (percent_full + "% full"); 
	return str;

}//»
stopAdding() { //«
	this.#addingInfosets = false;
} //»
getNextPos() { //«
//unsigned long long getNextPos() { 
	return this.#nextInfosetPos; 
}//»
getAdded() { //«
//unsigned long long getAdded() { 
	return this.#added; 
}//»
get(infoset_key, infoset, moves, firstmove){//«
//bool get(unsigned long long infoset_key, Infoset & infoset, int moves, int firstmove); 
	return this.#get_priv(infoset_key, infoset, moves, firstmove);
}//»
put(infoset_key, infoset, moves, firstmove) {//«
//void put(unsigned long long infoset_key, Infoset & infoset, int moves, int firstmove); 
	this.#put_priv(infoset_key, infoset, moves, firstmove);
}//»
writeBytes(out, addr, num){//«
//  void writeBytes(std::ofstream & out, void * addr, unsigned int num);  
	out.write(reinterpret_cast<const char *>(addr), num); 
}//»
dumpToDisk(filename) {//«
//void dumpToDisk(std::string filename);
	ofstream out(filename.c_str(), ios::out | ios::binary); 
	assert(out.is_open()); 

	assert(sizeof(unsigned long long) == 8); 
	assert(sizeof(double) == 8);

	// some integers
	this.writeBytes(out, &indexSize, 8);
	this.writeBytes(out, &size, 8);
	this.writeBytes(out, &rowsize, 8);
	this.writeBytes(out, &rows, 8);
	this.writeBytes(out, &lastRowSize, 8);

	// the index
	for (let i = 0; i < this.#indexSize; i++) {//Was: ull
		this.writeBytes(out, indexKeys + i, 8); 
		this.writeBytes(out, indexVals + i, 8); 
	}

	//the table
	//unsigned long long pos = 0, row = 0, col = 0, curRowSize = rowsize; 
	let pos = 0, row = 0, col = 0, curRowSize = rowsize; 
	while (pos < size) {
		this.writeBytes(out, this.tablerows[row] + col, 8);  
		this.#next(row, col, pos, curRowSize); 
	}

	out.close();
}//»
readBytes(in, addr,  num) {//«
//  void readBytes(std::ifstream & in, void * addr, unsigned int num); 
	in.read(reinterpret_cast<char *>(addr), num); 
}//»
readFromDisk(filename) {//«
//bool readFromDisk(std::string filename);
	this.#addingInfosets = false; 
	this.#nextInfosetPos = 0; 
	this.#added = 0; 

	ifstream in(filename.c_str(), ios::in | ios::binary); 
	//assert(in.is_open());  
	if (!in.is_open()) return false; 

	// some integers
	this.readBytes(in, &indexSize, 8);        
	this.readBytes(in, &size, 8);        
	this.readBytes(in, &rowsize, 8);        
	this.readBytes(in, &rows, 8);        
	this.readBytes(in, &lastRowSize, 8);        

	// the index
	this.#indexKeys = new Array(indexSize);//Was: ull[]
	this.#indexVals = new Array(indexSize);//Was: ull[]
	for (let i = 0; i < indexSize; i++) {//Was: ull
		this.readBytes(in, indexKeys + i, 8); 
		this.readBytes(in, indexVals + i, 8); 
	}

	// table rows (allocation)
	this.#tablerows = new Array(this.#rows);//Was: dbl* []
	assert(tablerows != NULL);
	for (let i = 0; i < this.#rows; i++) {//Was: ull
		if (i != (this.#rows-1)) {
			this.#tablerows[i] = new Array(this.#rowsize);//Was: dbl[]
			assert(tablerows[i] != NULL);
			for (let j = 0; j < this.#rowsize; j++) {//Was: ull
				this.#tablerows[i][j] = 0.0;
			}
		}
		else {
			this.#tablerows[i] = new Array(this.#lastRowSize);//Was: dbl[]
			assert(tablerows[i] != NULL);
			for (let j = 0; j < this.#lastRowSize; j++){//Was: uint
				this.#tablerows[i][j] = 0.0;
			}
		}
	}

	// tablerows (read from disk)
	let pos = 0, row = 0, col = 0, curRowSize = rowsize; //Was: ull
	while (pos < size) {
		this.readBytes(in, this.#tablerows[row] + col, 8);  
		this.#next(row, col, pos, curRowSize); 
	}

	in.close();

	return true;
}//»
contains(infoset_key) {//«
//bool contains(unsigned long long infoset_key);
	assert(infoset_key < indexSize); 
	let pos = this.getPosFromIndex1(infoset_key); //Was: ull
	return (pos >= size ? false : true);
}//»
printValues(){//«
//void printValues(); 
	for (let i = 0; i < this.#indexSize; i++) {//Was: uint
		if (this.#indexVals[i] < this.#size) {
			// this is a valid position
			let row, col, pos, curRowSize;//Was: ull
			pos = this.#indexVals[i];
			row = pos / this.#rowsize;
			col = pos % this.#rowsize;
			curRowSize = (row < (this.#rows-1) ? this.#rowsize : this.#lastRowSize);

			log("infosetkey = " , this.#indexKeys[i]); 
			log(", infosetkey_str = " , infosetkey_to_string(this.#indexKeys[i]));

			// read # actions
			let actionshere = 0;//Was: ull
			assert(sizeof(actionshere) == sizeof(double)); 
			memcpy(&actionshere, &tablerows[row][col], sizeof(actionshere)); 
			this.#next(row, col, pos, curRowSize);

			// read the integer
			let lastUpdate = 0;//Was: ull
			let x = this.#tablerows[row][col];//Was: dbl
			memcpy(&lastUpdate, &x, sizeof(actionshere)); 
			this.#next(row, col, pos, curRowSize);
			log(", actions = " , actionshere , ", lastUpdate = " , lastUpdate);
			for (let a = 0; a < actionshere; a++){//Was: ull
				// cfr
				assert(row < rows);
				assert(col < curRowSize); 
				log("  cfr[" , a , "]=" , tablerows[row][col]); 
				this.#next(row, col, pos, curRowSize);
				// total move probs
				log("  tmp[" , a , "]=" , tablerows[row][col]); 
				// cout << endl;
				this.#next(row, col, pos, curRowSize);
				// next cfr
			}
			//      cout << endl;
		}
	}
}//»
computeBound(sum_RTimm1, sum_RTimm2){//«
//  void computeBound(double & sum_RTimm1, double & sum_RTimm2); 
	for (let i = 0; i < this.#indexSize; i++) {//Was: uint
		if (indexVals[i] < size){
			// which player is it?
			let key = indexKeys[i]; //Was: ull
			double & b = (key % 2 == 0 ? sum_RTimm1 : sum_RTimm2); 

			// this is a valid position
			let row, col, pos, curRowSize;//Was: ull
			pos = this.#indexVals[i];
			row = pos / this.#rowsize;
			col = pos % this.#rowsize;
			curRowSize = (row < (this.#rows-1) ? this.#rowsize : this.#lastRowSize);

			// read # actions
			let actionshere = 0;//Was: ull
			assert(sizeof(actionshere) == sizeof(double)); 
			memcpy(&actionshere, &tablerows[row][col], sizeof(actionshere)); 
			this.#next(row, col, pos, curRowSize);

			// read the integer
			let lastUpdate = 0;//Was: ull
			let x = this.#tablerows[row][col];//Was: dbl
			memcpy(&lastUpdate, &x, sizeof(actionshere)); 
			this.#next(row, col, pos, curRowSize);

			let max = NEGINF;//Was: dbl
			for (let a = 0; a < actionshere; a++) {//Was: ull
				// cfr
				assert(row < rows);
				assert(col < curRowSize); 

				let cfr = this.#tablerows[row][col]; //Was: dbl
				CHKDBL(cfr);
				if (cfr > max) max = cfr; 

				this.#next(row, col, pos, curRowSize);
				// total move probs
				this.#next(row, col, pos, curRowSize);
				// next cfr
			}
			assert(max > NEGINF);
			let delta = max; //Was: dbl
			//delta = MAX(0.0, delta); 
			delta = Math.max(0.0, delta); 
			b += delta; 
		}
	}

//	sum_RTimm1 /= static_cast<double>(iter); 
	sum_RTimm1 /= iter; 
//	sum_RTimm2 /= static_cast<double>(iter); 
	sum_RTimm2 /= iter;
}//»
importValues(player, filename) {//«
  // used to save memory when evaluation strategies from 2 diff strat files
//  void importValues(int player, std::string filename);
	ifstream in(filename.c_str(), ios::in | ios::binary);

	let oIndexSize = 0, osize = 0, orowsize = 0, orows = 0, olastRowSize = 0;//Was: ull

	this.readBytes(in, &oIndexSize, 8);        
	this.readBytes(in, &osize, 8);        
	this.readBytes(in, &orowsize, 8);        
	this.readBytes(in, &orows, 8);        
	this.readBytes(in, &olastRowSize, 8);        

	assert(oIndexSize == this.#indexSize);
	assert(osize == this.#size);
	assert(orowsize == this.#rowsize);
	assert(orows == this.#rows);
	assert(olastRowSize == this.#lastRowSize);

	let maskresult = player - 1;//Was: ull

	for (let i = 0; i < oIndexSize; i++) {//Was: uint
		Infoset is;

		// next index element
		streampos sp = (5 + i*2); sp = sp*8;
		in.seekg(sp);

		let key = 0, val = 0;//Was: ull
		this.readBytes(in, &key, 8);
		this.readBytes(in, &val, 8);

		if ((key & 1ULL) == maskresult && val < size) {
			streampos fp = 5;
			fp += oIndexSize*2;
			fp += val;
			fp = fp*8;

			in.seekg(fp);

			let actionshere = 0;//Was: ull
			let lastUpdate = 0;//Was: ull

			this.readBytes(in, &actionshere, 8);
			this.readBytes(in, &lastUpdate, 8);

			is.actionshere = actionshere;//static_cast<int>(actionshere);
			is.lastUpdate = lastUpdate;

			assert(actionshere <= BLUFFBID);

			for (let a = 0; a < actionshere; a++) {//Was: ull
				double * cfrptr = is.cfr;
				double * tmpptr = is.totalMoveProbs;
				this.readBytes(in, cfrptr + a, 8);
				this.readBytes(in, tmpptr + a, 8);
			}

			//put(key, is, static_cast<int>(actionshere), 0); 
			this.put(key, is, actionshere, 0); 
		}
	}
}//»
clear() {//«
//void clear(); 

	for (let i = 0; i < indexSize; i++) {//Was: uint
		if (this.#indexVals[i] < size) {
		// this is a valid position
			let row, col, pos, curRowSize;//Was: ull
			pos = this.#indexVals[i];
			row = pos / this.#rowsize;
			col = pos % this.#rowsize;
			curRowSize = (row < (this.#rows-1) ? this.#rowsize : this.#lastRowSize);

			// read # actions
			let actionshere = 0;//Was: ull
			assert(sizeof(actionshere) == sizeof(double)); 
			memcpy(&actionshere, &tablerows[row][col], sizeof(actionshere)); 
			this.#next(row, col, pos, curRowSize);

			// read the integer
			let lastUpdate = 0;//Was: ull
			let x = this.#tablerows[row][col];//Was: dbl
			memcpy(&lastUpdate, &x, sizeof(actionshere)); 
			this.#tablerows[row][col] = 0.0;
			this.#next(row, col, pos, curRowSize);

			for (let a = 0; a < actionshere; a++) {//Was: ull
				// cfr
				assert(row < rows);
				assert(col < curRowSize); 
				this.#tablerows[row][col] = 0.0;
				this.#next(row, col, pos, curRowSize);
				// total move probs
				this.#tablerows[row][col] = 0.0;
				this.#next(row, col, pos, curRowSize);
				// next cfr
			}
		}
	}
}//»
copy(dest){//«
//void copy(InfosetStore & dest);
	dest.destroy();

	dest.indexSize = this.#indexSize;
	dest.size = this.#size;
	dest.rowsize = this.#rowsize;
	dest.rows = this.#rows;
	dest.lastRowSize = this.#lastRowSize;

	dest.indexKeys = new Array(this.#indexSize);//Was: ull[]
	dest.indexVals = new Array(this.#indexSize);//Was: ull[]
	for (let i = 0; i < this.#indexSize; i++) {//Was: ull
		dest.indexKeys[i] = this.#indexKeys[i];
		dest.indexVals[i] = this.#indexVals[i];
	}

	dest.tablerows = new Array(this.#rows);//Was: dbl* []
	assert(dest.tablerows != NULL);
	for (let i = 0; i < this.#rows; i++) {//Was: ull
		if (i != (this.#rows-1)) {
			dest.tablerows[i] = new Array(this.#rowsize);//Was: dbl[]
			assert(dest.tablerows[i] != NULL);
		}
		else {
			dest.tablerows[i] = new Array(lastRowSize);//Was: dbl[]
			assert(dest.tablerows[i] != NULL);
		}
	}

	let pos = 0, row = 0, col = 0, curRowSize = rowsize;//Was: ull
	while (pos < this.#size) {
		dest.tablerows[row][col] = this.#tablerows[row][col];
		next(row, col, pos, curRowSize); 
	}
}//»

};

}

const InfosetStore = InfosetStore_NS);
//»
function Bluff_NS(){//«

//Var«
const P1DICE = 1;
const P2DICE = 1;
const DIEFACES = 6;

//#define BLUFFBID (((P1DICE+P2DICE)*DIEFACES)+1)
const BLUFFBID = (((P1DICE+P2DICE)*DIEFACES)+1);

//#define LOC(b,r,c)  b[r*3 + c]

//using namespace std;

// OLD global variables//«
//InfosetStore iss;
//string filepref = "scratch/";
//unsigned long long iter;
//int iscWidth = 0;
//double cpWidth = 10.0;
//double nextCheckpoint = cpWidth;
//unsigned long long nodesTouched = 0;
//unsigned long long ntNextReport = 1000000;  // nodes touched base timing
//unsigned long long ntMultiplier = 2;  // nodes touched base timing
//static int numChanceOutcomes1 = 0;
//static int numChanceOutcomes2 = 0;
//static double * chanceProbs1 = NULL;
//static double * chanceProbs2 = NULL;
//static int * chanceOutcomes1 = NULL;
//static int * chanceOutcomes2 = NULL;
//static int * bids = NULL;
//»

const iss = new InfosetStore();
const filepref = "scratch/";
let iter;//ITER
let iscWidth = 0;
let cpWidth = 10.0;
let nextCheckpoint = cpWidth;
let nodesTouched = 0;

let ntNextReport = 1000000;
let ntMultiplier = 2;

//key is roll, value is # of time it shows up. Used only when determining chance outcomes
//map<int,int> outcomes;
const outcomes = {};

// probability of this chance move. indexed as 0-5 or 0-20
// note: CO/co stand for "chance outcome"

let numChanceOutcomes1 = 0;
let numChanceOutcomes2 = 0;
let chanceProbs1 = null;
let chanceProbs2 = null;
let chanceOutcomes1 = null;
let chanceOutcomes2 = null;
let bid = null;
//static StopWatch stopwatch;
//Should probably use a start method because the constructor starts it here
const stopwatch = new StopWatch();
//»

const initInfosets = (gs, player, depth, bidseq) => {//«
//void initInfosets(GameState & gs, int player, int depth, unsigned long long bidseq) {
// Does a recursive tree walk setting up the information sets, creating the initial strategies

	if (terminal(gs)) return;

	// check for chance nodes
	if (gs.p1roll == 0) {
		for (let i = 1; i <= numChanceOutcomes1; i++) {//Was: int
			GameState ngs = gs;
			//let ngs = gs;
			ngs.p1roll = i;
			initInfosets(ngs, player, depth+1, bidseq);
		}
		return;
	}
	else if (gs.p2roll == 0) {
		for (let i = 1; i <= numChanceOutcomes2; i++) {//Was: int
			GameState ngs = gs;
			//let ngs = gs;
			ngs.p2roll = i;

			initInfosets(ngs, player, depth+1, bidseq);
		}
		return;
	}

	let maxBid = (gs.curbid == 0 ? BLUFFBID-1 : BLUFFBID);//Was: int
	let actionshere = maxBid - gs.curbid;//Was: int

	assert(actionshere > 0);
	Infoset is;
	newInfoset(is, actionshere);

	for (let i = gs.curbid+1; i <= maxBid; i++) {//Was: int
		if (depth == 2 && i == (gs.curbid+1)) {
			log("InitTrees. iss stats = " , iss.getStats());
		}

		GameState ngs = gs;
		ngs.prevbid = gs.curbid;
		ngs.curbid = i;
		ngs.callingPlayer = player;
		let newbidseq = bidseq;//Was: ull
		newbidseq |= (1ULL << (BLUFFBID-i));

		initInfosets(ngs, (3-player), depth+1, newbidseq);
	}

	let infosetkey = 0;//Was: unsigned
	infosetkey = bidseq;
	infosetkey <<= iscWidth;
	if (player == 1) {
		infosetkey |= gs.p1roll;
		infosetkey <<= 1;
		iss.put(infosetkey, is, actionshere, 0);
	}
	else if (player == 2) {
		infosetkey |= gs.p2roll;
		infosetkey <<= 1;
		infosetkey |= 1;
		iss.put(infosetkey, is, actionshere, 0);
	}
}//»
const initInfosets = () => {//«
//void initInfosets() {
	let bidseq = 0;//Was: ull
	GameState gs;
	log("Initialize info set store...");
	// # doubles in total, size of index (must be at least # infosets)
	// 2 doubles per iapair + 2 per infoset =
//  iss = InfosetStore
	if (P1DICE == 1 && P2DICE == 1 && DIEFACES == 6) iss.init(147432, 100000);
	else {
		cerr("initInfosets not defined for this PXDICE + DIEFACES");
	}

	assert(iss.getSize() > 0);

	log("Initializing info sets...");
	stopwatch.reset();
	this.initInfosets(gs, 1, 0, bidseq);

	log("time taken = " , stopwatch.stop() , " seconds.");
	iss.stopAdding();

	log("Final iss stats: " , iss.getStats());
	stopwatch.reset();

	let filename = filepref + "iss.initial.dat";//Was: string

	log("Dumping information sets to " , filename);
	iss.dumpToDisk(filename);
}//»
const initBids = () => {//«
//void initBids(){
	bids = new Array(BLUFFBID-1);//Was: int[]
	let nextWildDice = 1;//Was: int
	let idx = 0;//Was: int
	for (let dice = 1; dice <= P1DICE + P2DICE; dice++) {//Was: int
		for (let face = 1; face <= DIEFACES-1; face++) {//Was: int
			bids[idx] = dice*10 + face;
			idx++;
		}
		if (dice % 2 == 1) {
			bids[idx] = nextWildDice*10 + DIEFACES;
			idx++;
			nextWildDice++;
		}
	}
	for(; nextWildDice <= (P1DICE+P2DICE); nextWildDice++) {
		bids[idx] = nextWildDice*10 + DIEFACES;
		idx++;
	}
	assert(idx == BLUFFBID-1);
}//»
const init = () => {//WMNH«
//void init(){
	assert(bids == NULL);
	log("Initializing Bluff globals...");
	seedCurMicroSec();
	determineChanceOutcomes(1);
	determineChanceOutcomes(2);
	// iscWidth if the number of bits needed to encode the chance outcome in the integer
	let maxChanceOutcomes = (numChanceOutcomes1 > numChanceOutcomes2 ? numChanceOutcomes1 : numChanceOutcomes2);//Was: int
	iscWidth = ceiling_log2(maxChanceOutcomes);
	initBids();
	log("Globals are: " , numChanceOutcomes1 , " " , numChanceOutcomes2 , " " , iscWidth);
}//»

const getChanceProb = (player, outcome) => {//«
//double getChanceProb(int player, int outcome){
// outcome >= 1, so must subtract 1 from it
	let co = (player == 1 ? numChanceOutcomes1 : numChanceOutcomes2);//Was: int
	assert(outcome-1 >= 0 && outcome-1 < co);
	let cp = (player == 1 ? chanceProbs1 : chanceProbs2);//Was: double *
	return cp[outcome-1];
}//»
const numChanceOutcomes = (player) => {//«
//int numChanceOutcomes(int player){
	return (player == 1 ? numChanceOutcomes1 : numChanceOutcomes2);
}//»
const unrankco = (i, roll, layer) => {//«
//void unrankco(int i, int * roll, int player){
	let num = 0;//Was: int
	let chanceOutcomes = (player == 1 ? chanceOutcomes1 : chanceOutcomes2);//Was: int *
	num = chanceOutcomes[i];
	assert(num > 0);

	let numDice = (player == 1 ? P1DICE : P2DICE);//Was: int

	for (let j = numDice-1; j >= 0; j--) {//Was: int
		roll[j] = num % 10;
		num /= 10;
	}
}//»
const getInfosetKey = (gs, player, bidseq) => {//«
//unsigned long long getInfosetKey(GameState & gs, int player, unsigned long long bidseq){
	let infosetkey = bidseq;//Was: ull
	infosetkey <<= iscWidth;
	if (player == 1) {
		infosetkey |= gs.p1roll;
		infosetkey <<= 1;
	}
	else if (player == 2) {
		infosetkey |= gs.p2roll;
		infosetkey <<= 1;
		infosetkey |= 1;
	}

	return infosetkey;
}//»
const getInfoset = (gs, player, bidseq, is, infosetkey, actionshere) => {//«
//void getInfoset(GameState & gs, int player, unsigned long long bidseq, Infoset & is, unsigned long long & infosetkey, int actionshere){
	infosetkey = getInfosetKey(gs, player, bidseq);
	let ret = iss.get(infosetkey, is, actionshere, 0);//Was: bool
	assert(ret);
}//»
const ceiling_log2 = (val) => {//«
//int ceiling_log2(int val){
	let exp = 1, num = 2;//Was: int
	do {
		if (num > val) return exp; 
		num *= 2;
		exp++;
	}
	while (true);
}//»
const intpow = (x, y) => {//«
//int intpow(int x, int y){
	if (y == 0) return 1;
	return x * intpow(x, y-1);
}//»
const nextRoll = (roll, size) => {//«
//void nextRoll(int * roll, int size){
	for (let i = size-1; i >= 0; i--) {//Was: int
		// Try to increment if by 1.
		if (roll[i] < DIEFACES) {
			// if possible, do it and then set everything to the right back to 1
			roll[i]++;
			for (let j = i+1; j < size; j++) roll[j] = 1;
			return;
		}
	}
}//»
const getRollBase10 = (roll, ize) => {//«
//int getRollBase10(int * roll, int size) {
	let multiplier = 1;//Was: int
	//int val = 0;
	let val = 0;
	//for (int i = size-1; i >= 0; i--) {
	for (let i = size-1; i >= 0; i--) {
		val += roll[i]*multiplier;
		multiplier *= 10;
	}
	return val;
}//»
const determineChanceOutcomes = (player) => {//«
//void determineChanceOutcomes(int player){
	let dice = (player == 1 ? P1DICE : P2DICE);//Was: int
	let rolls = new Array(dice);//Was: int[]
	for (let r = 0; r < dice; r++) rolls[r] = 1;//Was: int
	outcomes.clear();

	let permutations = intpow(DIEFACES, dice);//Was: int
	let p;//Was: int

	for (p = 0; p < permutations; p++) {
		// first, make a copy
		let rollcopy = new Array(dice);//Was: int[]
		memcpy(rollcopy, rolls, dice*sizeof(int));
		// now sort
		bubsort(rollcopy, dice);
		// now convert to an integer in base 10
		let key = getRollBase10(rollcopy, dice);//Was: int
		// now increment the counter for this key in the map
		outcomes[key] += 1;
		// next roll
		nextRoll(rolls, dice);
	}

	assert(p == permutations);

	int & numChanceOutcomes = (player == 1 ? numChanceOutcomes1 : numChanceOutcomes2);
	double* & chanceProbs = (player == 1 ? chanceProbs1 : chanceProbs2);
	int* & chanceOutcomes = (player == 1 ? chanceOutcomes1 : chanceOutcomes2);

	// now, transfer the map keys to the array
	numChanceOutcomes = outcomes.size();
	chanceProbs = new double[numChanceOutcomes];
	chanceOutcomes = new int[numChanceOutcomes];

	let idx = 0;//Was: int
	map<int,int>::iterator iter;
	//outcomes:
	//Was: map<int,int> outcomes;
	//Now: const outcomes = {};
	for (iter = outcomes.begin(); iter != outcomes.end(); iter++) {
		chanceOutcomes[idx] = iter->first;
		idx++;
	}

	bubsort(chanceOutcomes, numChanceOutcomes);

	for (let c = 0; c < numChanceOutcomes; c++) {//Was: int
		//int key = chanceOutcomes[c];
		let key = chanceOutcomes[c];
		//  chanceProbs[c] = static_cast<double>(outcomes[key]) / static_cast<double>(permutations);
		chanceProbs[c] = outcomes[key] / permutations;
		//cout << "player " << player << " roll " << key << " prob " << chanceProbs[c] << endl;
	}
}//»
const newInfoset = (is, actions) => {//«
//void newInfoset(Infoset & is, int actions){
	is.actionshere = actions;
	is.lastUpdate = 0;

	for (let i = 0; i < actions; i++) {//Was: int
		is.cfr[i] = 0.0;
		is.totalMoveProbs[i] = 0.0;
		is.curMoveProbs[i] = 1.0 / actions;
	}
}//»
const terminal = (gs) => {//YWRK«
//bool terminal(GameState & gs){
	return (gs.curbid == BLUFFBID);
}//»
const convertbid = (dice, face, bid) => {//«
// a bid is from 1 to 12, for example
//void convertbid(int & dice, int & face, int bid) {
	if (P1DICE == 1 && P2DICE == 1) {
		dice = (bid - 1) / DIEFACES + 1;
		face = bid % DIEFACES;
		if (face == 0) face = DIEFACES;
		assert(dice >= 1 && dice <= 2);
		assert(face >= 1 && face <= DIEFACES);
	}
	else {
		// stored in an array.
		let size = (P1DICE+P2DICE)*DIEFACES;//Was: int
		assert((bid-1) >= 0 && (bid-1) < size);

		dice = bids[bid-1] / 10;
		face = bids[bid-1] % 10;
	}
}//»
const getRoll = (roll, chanceOutcome, player) => {//«
//void getRoll(int * roll, int chanceOutcome, int player){
	unrankco(chanceOutcome-1, roll, player);
}//»
const countMatchingDice = (gs, player, face) => {//«
//int countMatchingDice(const GameState & gs, int player, int face){

//int roll[3] = {0,0,0};
	let roll  = [0,0,0];

	let matchingDice = 0;//Was: int
	let dice = (player == 1 ? P1DICE : P2DICE);//Was: int

	if (dice == 1) {
		if (player == 1) roll[1] = gs.p1roll;
		else if (player == 2) roll[1] = gs.p2roll;
	}
	else if (dice == 2) {
		if (player == 1) unrankco(gs.p1roll-1, roll, 1);
		else if (player == 2) unrankco(gs.p2roll-1, roll, 2);
	}

	for (let i = 0; i < 3; i++) {
		if (roll[i] == face || roll[i] == DIEFACES) matchingDice++;
	}

	return matchingDice;
}//»
const whowon6 = (bid, bidder, callingPlayer, p1roll, p2roll, delta) => {//«
//int whowon(int bid, int bidder, int callingPlayer, int p1roll, int p2roll, int & delta){
	let dice = 0, face = 0;//Was: int
	convertbid(dice, face, bid);
	assert(bidder != callingPlayer);

	// get the dice
	let p1rollArr = new Array(P1DICE);//Was: int[]
	let p2rollArr = new Array(P2DICE);//Was: int[]
	unrankco(p1roll-1, p1rollArr, 1);
	unrankco(p2roll-1, p2rollArr, 2);
	// now check the number of matches
	let matching = 0;//Was: int

	for (let i = 0; i < P1DICE; i++) {//Was: int
		if (p1rollArr[i] == face || p1rollArr[i] == DIEFACES) matching++;
	}

	for (let j = 0; j < P2DICE; j++) {//Was: int
		if (p2rollArr[j] == face || p2rollArr[j] == DIEFACES) matching++;
	}

	delta = matching - dice;
	if (delta < 0) delta *= -1;

	if (matching >= dice) {
		return bidder;
	}
	else {
		return callingPlayer;
	}
}//»
const whowon2 = (gs, delta) => {//«
//int whowon(GameState & gs, int & delta){
	let bidder = 3 - gs.callingPlayer;//Was: int
	return whowon(gs.prevbid, bidder, gs.callingPlayer, gs.p1roll, gs.p2roll, delta);
}//»
const whowon1 = (gs) => {//«
//int whowon(GameState & gs){
	let bidder = 3 - gs.callingPlayer;//Was: int
	let delta = 0;//Was: int
	return whowon(gs.prevbid, bidder, gs.callingPlayer, gs.p1roll, gs.p2roll, delta);
}//»
const payoff = (winner, player, delta) => {//«
//double payoff(int winner, int player, int delta)
// first thing: if it's an exact match, calling player loses 1 die
// may as well set delta to 1 in this case
	if (delta == 0) delta = 1;

	//  double p1payoff = 0.0;
	let p1payoff = 0.0;

	if (P1DICE == 1 && P2DICE == 1) return (winner == player ? 1.0 : -1.0);
	else {
		assert(false);
	}

	return (player == 1 ? p1payoff : -p1payoff);
}//»

// In these functions "delta" represents the number of dice the bid is off by (not relevant for (1,1))
// Returns payoff for Liar's Dice (delta always equal to 1)
const payoff_wp = (winner, player) => {//«
//double payoff(int winner, int player){
	return payoff(winner, player, 1);
}//»

// this is the function called by all the algorithms.
// Now set to use the delta
const payoff_gp = (gs, player) => {//«
//double payoff(GameState & gs, int player) {
	let delta = 0;//Was: int
	let winner = whowon(gs, delta);//Was: int
	return payoff(winner, player, delta);
}//»
const payoff6 = (bid, bidder, callingPlayer, p1roll, p2roll, player) => {//«
//double payoff(int bid, int bidder, int callingPlayer, int p1roll, int p2roll, int player) {
	let delta = 0;//Was: int
	let winner = whowon(bid, bidder, callingPlayer, p1roll, p2roll, delta);//Was: int
	return payoff(winner, player);
}//»
const report = (filename, totaltime, bound, conv) => {//«
//void report(string filename, double totaltime, double bound, double conv){
	filename = filepref + filename;
	log("Reporting to " + filename + " ... ");
	ofstream outf(filename.c_str(), ios::app);
	outf << iter << " " << totaltime << " " << bound << " " << conv << " " << nodesTouched << endl;
	outf.close();
}//»
const dumpInfosets = (prefix) => {//«
//void dumpInfosets(string prefix){
	let filename = filepref + prefix + "." + to_string(iter) + ".dat";//Was: string
	log("Dumping infosets to " + filename + " ... ");
	iss.dumpToDisk(filename);
}//»

// not even sure what I used this "meta data" for, if I ever used it....
const dumpMetaData = (prefix, totaltime) =>  {//«
//void dumpMetaData(string prefix, double totaltime) {
	let filename = filepref + prefix + "." + to_string(iter) + ".dat";//Was: string
	log("Dumping metadeta to " + filename + " ... ");

	ofstream outf(filename.c_str(), ios::binary);
	if (!outf.is_open()) {
		cerr("Could not open meta data file for writing.");
		return;
	}

	outf.write(reinterpret_cast<const char *>(&iter), sizeof(iter));
	outf.write(reinterpret_cast<const char *>(&nodesTouched), sizeof(nodesTouched));
	outf.write(reinterpret_cast<const char *>(&ntNextReport), sizeof(ntNextReport));
	outf.write(reinterpret_cast<const char *>(&ntMultiplier), sizeof(ntMultiplier));
	outf.write(reinterpret_cast<const char *>(&totaltime), sizeof(totaltime));

	outf.close();
}//»
const loadMetaData = (filename) => {//«
//void loadMetaData(std::string filename) {
	ifstream inf(filename.c_str(), ios::binary);
	if (!inf.is_open()) {
		cerr("Could not open meta data file.");
		return;
	}

	let totaltime = 0;//Was: dbl

	inf.read(reinterpret_cast<char *>(&iter), sizeof(iter));
	inf.read(reinterpret_cast<char *>(&nodesTouched), sizeof(nodesTouched));
	inf.read(reinterpret_cast<char *>(&ntNextReport), sizeof(ntNextReport));
	inf.read(reinterpret_cast<char *>(&ntMultiplier), sizeof(ntMultiplier));
	inf.read(reinterpret_cast<char *>(&totaltime), sizeof(totaltime));

	inf.close();
}//»

}//»
function BR_NS(){// Best Response «

//Globals«

let mccfrAvgFix = false;//Was: static bool
static vector<unsigned long long> oppChanceOutcomes; // all roll outcomes

//»

const getInfoset=(infosetkey, is, bidseq, player, actionshere, chanceOutcome)=>{//«
//void getInfoset(unsigned long long & infosetkey, Infoset & is, unsigned long long bidseq, int player,  
// int actionshere, int chanceOutcome) {
// only called at opponent (fixed player) nodes in computeActionDist
// get the information set for update player where the chance outcome is replaced by the specified one
	infosetkey = bidseq << iscWidth; 
	infosetkey |= chanceOutcome; 
	infosetkey <<= 1; 
	if (player == 2) infosetkey |= 1; 

	bool ret = false; 

	ret = iss.get(infosetkey, is, actionshere, 0); 

	if (!ret) cerr("infoset get failed, infosetkey = " , infosetkey);
	assert(ret);  
}//»
const getMoveProb = (is, action, actionshere) => {//«
//double getMoveProb(Infoset & is, int action, int actionshere) {
	let den = 0.0; //Was: dbl
	for (let a = 0; a < actionshere; a++) {//Was: int
		if (is.totalMoveProbs[a] > 0.0) den += is.totalMoveProbs[a];
	}
	if (den > 0.0) return (is.totalMoveProbs[action] / den); 
	else return (1.0 / actionshere);
}//»
const fixAvStrat=(infosetkey, is, actionshere, myreach) => {//«
//void fixAvStrat(unsigned long long infosetkey, Infoset & is, int actionshere, double myreach) {
// This implements the average strategy patch needed by optimisitc averaging, from section 4.4 of my thesis.
// This function should never be called by this code base because optimistic averaging is not included here.
	if (iter > is.lastUpdate) {
		for (let a = 0; a < actionshere; a++) {//Was: int
			let inc =   (iter - is.lastUpdate)//Was: dbl
				   * myreach
				   * is.curMoveProbs[a];

			is.totalMoveProbs[a] += inc; 
		}
		iss.put(infosetkey, is, actionshere, 0); 
	}
}//»

const computeActionDist=(bidseq, player, fixed_player, oppActionDist, action, newOppReach, actionshere)=>{//«
//void computeActionDist(unsigned long long bidseq, int player, int fixed_player, 
//                       NormalizerMap & oppActionDist, int action, FVector<double> & newOppReach, 
//                       int actionshere){
// Compute the weight for this action over all chance outcomes
// Used for determining probability of action
// Done only at fixed_player nodes
	let weight = 0.0; //Was: dbl

	// for all possible chance outcomes
	for (let i = 0; i < oppChanceOutcomes.size(); i++) {//Was: uint
		let CO = (fixed_player == 1 ? numChanceOutcomes(1) : numChanceOutcomes(2));//Was: uint
		assert(oppChanceOutcomes.size() == CO);
		let chanceOutcome = oppChanceOutcomes[i]; //Was: int

		// get the information set that corresponds to it
		Infoset is;
		let infosetkey = 0; //Was: ull
		getInfoset(infosetkey, is, bidseq, player, actionshere, chanceOutcome); 

		// apply out-of-date mccfr patch if needed. note: we know it's always the fixed player here
		if (mccfrAvgFix) fixAvStrat(infosetkey, is, actionshere, newOppReach[i]); 
		let oppProb = getMoveProb(is, action, actionshere); //Was: dbl
		CHKPROB(oppProb); 
		newOppReach[i] = newOppReach[i] * oppProb; 
		weight += getChanceProb(fixed_player, chanceOutcome)*newOppReach[i]; 
	}

	CHKDBL(weight);
	oppActionDist.add(action, weight); 
}//»
const getPayoff = (gs, fixed_player, oppChanceOutcome) => {//«
//double getPayoff(GameState gs, int fixed_player, int oppChanceOutcome){
// return the payoff of this game state if the opponent's chance outcome is replaced by specified 
	let updatePlayer = 3-fixed_player; //Was: int
//WMNGHKHF
	int & oppRoll = (updatePlayer == 1 ? gs.p2roll : gs.p1roll); 
	oppRoll = oppChanceOutcome;

	return payoff(gs, updatePlayer); 
}//»
const expectimaxbr = (gs, bidseq, player, fixed_player, depth, oppReach) => {//«
//double expectimaxbr(GameState gs, unsigned long long bidseq, int player, int fixed_player, int depth, FVector<double> & oppReach) {
	assert(fixed_player == 1 || fixed_player == 2); 

	let updatePlayer = 3-fixed_player;//Was: int

	// opponent never players here, don't choose this!
	if (player == updatePlayer && oppReach.allEqualTo(0.0)) return NEGINF;

	if (terminal(gs)) {
		if (oppReach.allEqualTo(0.0)) return NEGINF;

		NormalizerVector oppDist; 

		for (let i = 0; i < oppChanceOutcomes.size(); i++) {//Was: uint
			oppDist.push_back(getChanceProb(fixed_player, oppChanceOutcomes[i])*oppReach[i]); 
		}
		oppDist.normalize(); 

		let expPayoff = 0.0; //Was: dbl

		for (let i = 0; i < oppChanceOutcomes.size(); i++) {//Was: uint
			let payoff = getPayoff(gs, fixed_player, oppChanceOutcomes[i]); //Was: dbl
			CHKPROB(oppDist[i]); 
			CHKDBL(payoff); 
			expPayoff += (oppDist[i] * payoff); 
		}

		return expPayoff; 
	}

	// check for chance node
	if (gs.p1roll == 0) {
		// on fixed player chance nodes, just use any die roll
		if (fixed_player == 1) {
			GameState ngs = gs; 
			ngs.p1roll = 1;  // assign a dummy outcome, never used

			FVector<double> newOppReach = oppReach; 
			return expectimaxbr(ngs, bidseq, player, fixed_player, depth+1, newOppReach);
		}
		else {
			let EV = 0.0; //Was: dbl
			for (let i = 1; i <= numChanceOutcomes(1); i++) {//Was: int
				GameState ngs = gs; 
				ngs.p1roll = i; 
				FVector<double> newOppReach = oppReach; 
				EV += getChanceProb(1,i) * expectimaxbr(ngs, bidseq, player, fixed_player, depth+1, newOppReach);
			}
			return EV;
		}
	}
	else if (gs.p2roll == 0) {
		// on fixed player chance nodes, just use any die roll
		if (fixed_player == 2) {
			GameState ngs = gs; 
			ngs.p2roll = 1; // assign a dummy outcome, never used
			FVector<double> newOppReach = oppReach; 
			return expectimaxbr(ngs, bidseq, player, fixed_player, depth+1, newOppReach);
		}
		else {
			let EV = 0.0; //Was: dbl
			for (let i = 1; i <= numChanceOutcomes(2); i++) {//Was: int
				GameState ngs = gs; 
				ngs.p2roll = i; 
				FVector<double> newOppReach = oppReach; 
				EV += getChanceProb(2,i) * expectimaxbr(ngs, bidseq, player, fixed_player, depth+1, newOppReach);
			}
			return EV;
		}
	}

	// declare variables and get # actions available
	let EV = 0.0; //Was: dbl

	let maxBid = (gs.curbid == 0 ? BLUFFBID-1 : BLUFFBID);//Was: int
	let actionshere = maxBid - gs.curbid; //Was: int
	assert(actionshere > 0);

	// iterate over the moves 
	let maxEV = NEGINF;//Was: dbl
	let childEVs = new Array(actionshere);//Was: dbl[]
	let action = -1;//Was: int
	NormalizerMap oppActionDist;

	for (let i = gs.curbid+1; i <= maxBid; i++) {//Was: int
		action++;    

		let childEV = 0;//Was: dbl
		FVector<double> newOppReach = oppReach;

		if (player == fixed_player) {
			computeActionDist(bidseq, player, fixed_player, oppActionDist, action, newOppReach, actionshere); 
		}
		// state transition + recursion
		GameState ngs = gs; 
		ngs.prevbid = gs.curbid;
		ngs.curbid = i; 
		ngs.callingPlayer = player;
		let newbidseq = bidseq;//Was: ull
		newbidseq |= (1ULL << (BLUFFBID-i)); 

		childEV = expectimaxbr(ngs, newbidseq, 3-player, fixed_player, depth+1, newOppReach);

		// post recurse
		if (player == updatePlayer)  {
			// check if higher than current max
			if (childEV >= maxEV) {
				maxEV = childEV;
			}
		}
		else if (player == fixed_player) {
			assert(action >= 0 && action < actionshere);
			childEVs[action] = childEV; 
		}
	}

	// post move iteration
	if (player == updatePlayer) {
		EV = maxEV;
	}
	else if (player == fixed_player) {
		assert(static_cast<int>(oppActionDist.size()) == actionshere);
		oppActionDist.normalize(); 
		for (let i = 0; i < actionshere; i++) {//Was: int
			CHKPROB(oppActionDist[i]); 
			CHKDBL(childEVs[i]); 
			EV += (oppActionDist[i] * childEVs[i]); 
		}
	}
	assert(updatePlayer != fixed_player); 
	assert(updatePlayer + fixed_player == 3); 

	return EV; 
}//»
const computeBestResponses = (avgFix) => {//«
//double computeBestResponses(bool avgFix){
	let p1value = 0.0;//Was: dbl
	let p2value = 0.0;//Was: dbl
	return computeBestResponses(avgFix, p1value, p2value);
}//»
const computeBestResponses = (avgFix, p1value, p2value) => {//«
//double computeBestResponses(bool avgFix, double & p1value, double & p2value){
	mccfrAvgFix = avgFix;

	log("Computing ISS bounds... "); 
	//cout.flush(); 
	let b1 = 0.0, b2 = 0.0;//Was: dbl
	iss.computeBound(b1, b2); 
	log(" b1 = " , b1 , ", b2 = " , b2 , ", bound = " , (2.0*MAX(b1,b2)));

	// fill chance outcomes for player 1
	oppChanceOutcomes.clear();
	for (let i = 1; i <= numChanceOutcomes(1); i++) {//Was: int
		oppChanceOutcomes.push_back(i); 
	}

	log("Running best response, fp = 1 ... "); 
	//cout.flush(); 

	StopWatch sw; 

	GameState gs1; 
	let bidseq = 0; //Was: ull
	FVector<double> reach1(numChanceOutcomes(1), 1.0); 
	p2value = expectimaxbr(gs1, bidseq, 1, 1, 0, reach1);

	log("time taken: " , sw.stop() , " seconds."); 
	cout.precision(15);
	log("p2value = " , p2value); 

	// fill chance outcomes for player 2
	oppChanceOutcomes.clear();
	for (let i = 1; i <= numChanceOutcomes(2); i++) {//Was: int
		oppChanceOutcomes.push_back(i); 
	}

	log("Running best response, fp = 2 ... "); 
	//cout.flush(); 

	sw.reset(); 

	GameState gs2; bidseq = 0;
	FVector<double> reach2(numChanceOutcomes(2), 1.0); 
	p1value = expectimaxbr(gs2, bidseq, 1, 2, 0, reach2);

	log("time taken: " , sw.stop() , " seconds."); 
	cout.precision(15);
	log("p1value = " , p1value); 

	let conv = p1value + p2value; //Was: dbl

	cout.precision(15);
	log("iter = " , iter , " nodes = " , nodesTouched , " conv = " , conv); 

	return conv;
}//»

}//»
function BluffCounter_NS(){//«
/*
- bluffcounter.cpp is used to count the number of information sets and
  (infoset,action) pairs. These numbers are needed to create the strategies
  files. You won't need to use it at all if you just run Bluff(1,1) but if you
  want to implement a different game, then you can use this file as a place to
  start to create strategies files for your game.
*/
// How many dice per player?
const P1D = 1;
const P2D = 1;
const DICE = (P1D+P2D);
const BIDS = (DICE*6);

// Number of last moves you're allowed to recall for imperfect recall
// Used only for imperfect recall abstractions, not used by this code base
const RECALL = 7;

// Number of chance event outcomes at chance nodes.
const P1CO = 6;
const P2CO = 6;

let p1totalTurns = 0;
let p2totalTurns = 0;
let p1totalActions = 0;
let p2totalActions = 0;
let totalLeaves = 0;

map<unsigned long long,int> iapairs;

let iscWidth = 3;//Was: int

const binrep = (num) => {//«
//string binrep(unsigned long long num) {
  let s = "";//Was: string
  for (let i = 0; i < 64; i++) {//Was: int
    let bit = 1; //Was: ull
    bit <<= i;
    let n = num & bit; //Was: ull
    s = (n > 0 ? "1" : "0") + s; 
  }

  return s;
}//»
const pow2 = (i) => {//«
//unsigned long long pow2(int i) {
	let answer = 1;//Was: ull
	return (answer << i); 
}//»

// Traverse the entire tree, counting the number of (information set, action pairs)
const bcount = (cbid, player, depth) => {//«
//void bcount(int cbid, int player, int depth) {
	if (cbid >= (BIDS+1)) {
		totalLeaves++;
		return;
	}

	let numbids = (cbid == 0 ? BIDS : BIDS+1);//Was: int
	let actions = numbids - (cbid+1) + 1;//Was: int
	unsigned long & totalTurns = (player == 1 ? p1totalTurns : p2totalTurns); 
	unsigned long & totalActions = (player == 1 ? p1totalActions : p2totalActions); 
	totalTurns++; 
	totalActions += actions; 

	for (let b = cbid+1; b <= numbids; b++) {//Was: int
		if (depth == 0) log("Depth 0, b = " , b);
		bcount(b, 3-player, depth+1);
	}
}//»
const countnoabs = () => {//«
//void countnoabs() {
	bcount(0, 1, 0); 

	log("for public tree:");
	log("  p1totalTurns = " , p1totalTurns);
	log("  p2totalTurns = " , p2totalTurns);
	log("  totalLeaves = " , totalLeaves);
	let totalseqs = (p1totalTurns + p2totalTurns);//Was: ull
	log("total sequences = " , totalseqs);
	log("p1 info sets = " , (p1totalTurns*P1CO));
	log("p2 info sets = " , (p2totalTurns*P2CO));
	let ttlinfosets = (p1totalTurns*P1CO) + (p2totalTurns*P2CO);//Was: ull
	log("total info sets = " , ttlinfosets);
	log("p1totalActions = " , p1totalActions);
	log("p2totalActions = " , p2totalActions);


	let iapairs1 = (p1totalActions*P1CO);//Was: ul
	let iapairs2 = (p1totalActions*P2CO);//Was: ul
	let totaliap = (iapairs1+iapairs2);//Was: ul
	log("infoset actions pairs, p1 p2 total = " , iapairs1 , " " , iapairs2 , " " , totaliap);

	let td = (totaliap*2 + ttlinfosets*2);//Was: ul
	log("total doubles needed = " , td , ", bytes needed = " , (td*8));

	log("cache size ~ " , (ttlinfosets*4) , " entries =~ " , (ttlinfosets*4*2)*8 , " bytes");

	let ttlbytes = ((td*8) + (ttlinfosets*4*2)*8); //Was: ull
	log("total bytes = " , ttlbytes , " ( = " , (ttlbytes / (1024.0*1024.0*1024.0)) , " GB)");
}//»
const nextbid = (bidseq, maxBid) => {//«
//bool nextbid(int * bidseq, int maxBid) {
	for (let i = RECALL-1; i >= 0; i--) {//Was: int
		let roffset = (RECALL-1)-i; //Was: int
		if (bidseq[i] < (maxBid-roffset)) {
			bidseq[i]++;
			for (let j = i+1; j < RECALL; j++) {//Was: int
				bidseq[j] = bidseq[j-1]+1;
			}
			return true;
		}
	}
	return false;
}//»

// This is for imperfect recall abstractions. Not used by this code base, 
// but I left it in case your game has abstraction, maybe this will be helpful
const countabs2 = () => {//«
//void countabs2() {
//int bidseq[RECALL] = { 0 }; 
	let bidseq = new Array(RECALL);; 
	let ret = true;//Was: bool
	let first = true;//Was: bool
	let maxBid = 6*DICE;//Was: int
	let bluffBid = maxBid+1;//Was: int

	while(ret) {
		let numzeroes = 0;//Was: int
		for (let i = 0; i < RECALL; i++) {//Was: int
			if (bidseq[i] == 0) numzeroes++; 
		}
		let curbid = bidseq[RECALL-1];//Was: int
		let actions = bluffBid-curbid;//Was: int
		if (first) actions--;

		assert(actions >= 0 && actions <= maxBid);

		let player = 0;//Was: int
		if (numzeroes > 0) {
			if (RECALL % 2 == 0) {
				if (numzeroes % 2 == 0) player = 1;
				else player = 2; 
			}
			else {
				if (numzeroes % 2 == 1) player = 1;
				else player = 2; 
			}
		}
		else if (bidseq[0] == 1) {
			if (RECALL % 2 == 0) player = 1; 
			else player = 2;
		}

		// player = 0 means both players can share this bid sequence
		if (player == 1 || player == 0) {
			p1totalTurns++;
			p1totalActions += actions;
		}
		if (player == 2 || player == 0) {
			p2totalTurns++;
			p2totalActions += actions;
		}

		ret = nextbid(bidseq, maxBid); 
		first = false;
	}

	log("recall = " , RECALL);
	log("p1totalTurns = " , p1totalTurns);
	log("p2totalTurns = " , p2totalTurns);
	log("p1totalActions = " , p1totalActions);
	log("p2totalActions = " , p2totalActions);

	let iapairs1 = (p1totalActions*P1CO);//Was: ulong
	let iapairs2 = (p1totalActions*P2CO);//Was: ulong
	let totaliap = (iapairs1+iapairs2);//Was: ulong

	log("ia pairs p1 p2 total = " , iapairs1 , " " , iapairs2 , " " , totaliap);

	let infosets1 = (p1totalTurns*P1CO);//Was: ull
	let infosets2 = (p2totalTurns*P2CO);//Was: ull
	let totalInfosets = infosets1 + infosets2; //Was: ull

	let btotalindex = totalInfosets*16*4; //Was: ull
	let tdoubles = (totaliap*2 + totalInfosets*2);//Was: ull
	let btotalis = tdoubles*8;//Was: ull

	log("infosets p1 p2 total = " , infosets1 , " " , infosets2 , " " , totalInfosets);
	log("total doubles for infoset store (2 per infoset + 2 per iapair) = " , tdoubles);

	//  cout << endl;

	let vfsi_iss = (totaliap*2 + totalInfosets*4);//Was: ull
	log("total doubles for Vanilla FSI using infoset store (4 per infoset + 2 per iapair) = "  , vfsi_iss);

	vfsi_iss += (4*2*totalInfosets); // index

	log(" ( = " , (vfsi_iss*8) / (1024.0*1024.0*1024.0) , " GB)");

	let totalseqs = (p1totalTurns + p2totalTurns);//Was: ull
	log("total sequences, 4 * total seq = " , totalseqs , ", " , (4*totalseqs));
	let fsidoubles = (totalseqs + totaliap*2 + infosets1*3*P2CO + infosets2*3*P1CO);//Was: ull
	log("total doubles for FSIPCS with using SS (1 per sequence + 2 per iapair\n" , "                  + 3*P1CO per p2 infoset and 3*P2CO per p1 infoset, for fsi) = " , fsidoubles);

	fsidoubles += (4*2*totalseqs); // index

	log("FSIPCS using SS gigabytes estimate: " , (fsidoubles*8)/(1024.0*1024.0*1024.0));

	// one actionshere per sequence   
	// then 2 per infoset action pair
	// and 3 per infoset (reach1, reach2, value)

	let vfsi_ss = (totalseqs + totaliap*2 + totalInfosets*3); //Was: ull
	log("total doubles for vanilla FSI using SS: " , vfsi_ss); 
	vfsi_ss += (4*2*totalseqs); // index
	log(" ( = " , (vfsi_ss*8)/(1024.0*1024.0*1024.0) , " GB with index)");

	//  cout << endl;

	log("totals: iapairs, doubles, 4*infosets: " , totaliap , " " , tdoubles , " " , (4*totalInfosets));
	log("bytes is index total = " , btotalis , " " , btotalindex , " " , (btotalis+btotalindex));
	log("Note: Sizes assume for infoset store: 2 doubles per infoset + 2 doubles per iapair, ");
	log("                   for index: indexsize = 4*#infosets, and 2 doubles per index size . ");
}//»
const main = () => {//«
//int main() {
  // iscWidth is the number of bits needed by the chance outcome
  // in our case, six possibilties, 3 bits
	iscWidth = 3;
	countnoabs();
	//countabs2();
	return 0;
}//»

}//»
function Sampling(){//«

//#include "bluff.h"

const sampleChanceEvent = (player, outcome, prob) => {//«
//void sampleChanceEvent(int player, int & outcome, double & prob) {
	let co = (player == 1 ? numChanceOutcomes(1) : numChanceOutcomes(2));//Was: int

	let roll = unifRand01();//Was: double
	let sum = 0.0;//Was: double
	for (let i = 0; i < co; i++) {//Was: int
		let pr = getChanceProb(player, i+1);//Was: double

		if (roll >= sum && roll < sum+pr) {
			outcome = (i+1);
			prob = pr;
			return;
		}
		sum += pr;
	}
	log("roll = " , roll);
	assert(false);
}//»
const sampleMoveAvg = (is, actionshere, index, prob) => {//«
//void sampleMoveAvg(Infoset & is, int actionshere, int & index, double & prob){
	let den = 0;//Was: double
	for (let i = 0; i < actionshere; i++) {//Was: int
		den += is.totalMoveProbs[i];
	}
	let roll = unifRand01();//Was: double
	let sum = 0.0;//Was: int
	for (let i = 0; i < actionshere; i++) {//Was:uint
		let iprob = (den > 0.0 ? (is.totalMoveProbs[i] / den) : (1.0 / actionshere));//Was: double
		CHKPROB(prob);
		if (roll >= sum && roll < sum+iprob) {
			index = i;
			prob = iprob;
			return;
		}
		sum += iprob;
	}
	assert(false);
}//»
const sampleAction = (is, actionshere, sampleprob, epsilon, firstTimeUniform) => {//«
//int sampleAction(Infoset & is, int actionshere, double & sampleprob, double epsilon, bool firstTimeUniform) {

// **Only do this when enabled by firstTimeUniform:
// if this infoset has never been updated: choose entirely randomly
// reason: there is no regret yet, hence no strategy.
	let eps = 0.0;//Was: double
	if (firstTimeUniform) eps = (is.lastUpdate == 0 ? 1.0 : epsilon);
	else eps = epsilon;

	// build the distribution to sample from
	//  double dist[actionshere];
	let dist = new Array(actionshere);
	for (let a = 0; a < actionshere; a++) {//Was: int
		dist[a] = eps*(1.0 / actionshere) + (1.0-eps)*is.curMoveProbs[a];
	}
	let roll = unifRand01();//Was: double
	let sum = 0.0;//Was: double
	for (let a = 0; a < actionshere; a++) {//Was: int
		if (roll >= sum && roll < sum+dist[a]) {
			sampleprob = dist[a];
			return a;
		}
		sum += dist[a];
	}

	assert(false);
	return -1;
}//»

}//»
function PCS_NS(){// Public Chance Sampling«

//Headers«

//#include "bluff.h"
//#include "svector.h"

//»

//template <unsigned int SIZE>
class SVector {//«
//static vector
// Provides all the functionality of FVector but uses static 
// SIZEs to avoid dynamic memory allocations.
// Also: assumes doubles since we don't use it for anything else.
// double elements[SIZE];
#elements;
//public:  
SVector() { //«
	for (let i = 0; i < SIZE; i++) {//Was: uint
		elements[i] = 0.0;
	}
}//»
SVector(ival) {//«
//ival: double
	for (let i = 0; i < SIZE; i++) {//Was: uint
		elements[i] = ival;
	}
}//»
get_const(n) {//double«
//n: int
	return elements[n]; 
}//»
getSize() { return SIZE; }
allEqualTo(elem) {//bool«
//elem: double
	for (let i = 0; i < SIZE; i++) {//Was: uint
		if (elements[i] != elem) return false; 
	}
	return true;
}//»
to_string() {//std::string«
	let str = "[";//Was: string
	for (let i = 0; i < SIZE; i++) { //Was: uint
		std::ostringstream oss; 
		oss << elements[i]; 
		str = str + oss.str(); 
		if (i < (SIZE-1)) str = str + " "; 
	}
	str = str + "]";
	return str; 
}//»
assertprob() { //«
	for (let i = 0; i < SIZE; i++) {//Was: uint
		assert(elements[i] >= 0.0 && elements[i] <= 1.0); 
	}
}//»
reset(val) {//«
//val: double
	for (let i = 0; i < SIZE; i++) {//Was: uint
		elements[i] = val;
	}
}//»

double& operator[](int n) { return elements[n]; }
SVector<SIZE> & operator= (const SVector<SIZE> & other) {//«
	assert(SIZE == other.getSize());
	for (let i = 0; i < SIZE; i++) {//Was: uint
		elements[i] = other.elements[i]; 
	}
	return (*this);
}//»
SVector<SIZE> & operator+=(SVector<SIZE> & right) {//«
	assert(SIZE == right.getSize()); 
	for (let i = 0; i < SIZE; i++) {//Was: uint
		elements[i] += right[i]; 
	}
	return (*this);
}//»
SVector<SIZE> & operator*=(SVector<SIZE> & right) {//«
// non-standard element by element multiply
	assert(SIZE == right.getSize()); 

	for (let i = 0; i < SIZE; i++) {//Was: uint
		elements[i] *= right[i]; 
	}
	return (*this);
}//»
SVector<SIZE> & operator*=(double factor) {//«
	for (let i = 0; i < SIZE; i++) {
		elements[i] *= factor;  
	}
	return (*this);
}//»

};//»

//std::ostream &operator<<(std::ostream &o,  const SVector<SIZE> &v);

//Globals«

typedef SVector<P1CO> covector1;
typedef SVector<P2CO> covector2;

//»

const handleLeaf = (gs, updatePlayer, reach1, reach2, result1, result2) => {//«
//void handleLeaf(GameState & gs, int updatePlayer, covector1 & reach1, covector2 & reach2, 
//                covector1 & result1, covector2 & result2) {
	let upco = (updatePlayer == 1 ? P1CO : P2CO); //Was: int
	let opco = (updatePlayer == 1 ? P2CO : P1CO);//Was: int

	assert(upco > 0); 
	assert(opco > 0); 

	let opponent = 3 - updatePlayer;//Was: int

	// because it's strictly alternating
	let bidder = 3 - gs.callingPlayer;//Was: int

	let oppNonzero = 0;//Was: int
	for (let j = 0; j < opco; j++) {//Was: int
		if (updatePlayer == 1 && reach2[j] > 0) oppNonzero++;
		else if (updatePlayer == 2 && reach1[j] > 0) oppNonzero++;
	}

	// Here we apply the "n^2 -> n" trick described in the paper. 
	// So, now we collapse the vector of opponent's reach probabilities from an
	// element per chance outcome to an element per situation that effects the payoff.
	// In Bluff specifically: the only thing that matters is the number of dice the
	// opponent has that match the face of the final bid. So we group the reach 
	// probabilities over opponent chance outcome for each matching number of dice
	// For a better explanation, see the paper. 

	let quantity, face;//Was: int
	convertbid(quantity, face, gs.prevbid);
	let oppDice = (updatePlayer == 1 ? P2DICE : P1DICE);//Was: int
	//  double opp_probs[oppDice+1];
	let opp_probs = new Array (oppDice+1);
	for (let i = 0; i < oppDice+1; i++) {//Was: int
		opp_probs[i] = 0.0;
	}
	for (let o = 0; o < opco; o++) {//Was: int
		if (opponent == 1) gs.p1roll = o+1;
		else if (opponent == 2) gs.p2roll = o+1;

		let d = countMatchingDice(gs, opponent, face); //Was: int

		if (updatePlayer == 1) opp_probs[d] += getChanceProb(opponent, o+1)*reach2[o]; 
		else if (updatePlayer == 2) opp_probs[d] += getChanceProb(opponent, o+1)*reach1[o]; 
	}

	// Now, we need to construct a vector that contains a payoff per chance outcome 
	// of the updatePlayer

	for (let o = 0; o < upco; o++) {//Was: int
		// iterate over the update player's outcomes. 
		let val = 0.0; //Was: dbl
		if (updatePlayer == 1) gs.p1roll = o+1;
		else if (updatePlayer == 2) gs.p2roll = o+1;
		let myd = countMatchingDice(gs, updatePlayer, face);//Was: int
		for (let j = 0; j < oppDice+1; j++) {//Was: int
			let payoffToBidder = (myd+j >= quantity ? 1.0 : -1.0);//Was: dbl
			let payoff = (updatePlayer == bidder ? payoffToBidder : -payoffToBidder); //Was: dbl
			val += payoff*opp_probs[j];
		}
		if (updatePlayer == 1) result1[o] = val; 
		else if (updatePlayer == 2) result2[o] = val;
	}
}//»
const pcs = (gs, player, depth, bidseq, updateplayer, reach1, reach2, phase, result1, result2) => {//«
//void pcs(gamestate & gs, int player, int depth, unsigned long long bidseq, 
// int updateplayer, covector1 & reach1, covector2 & reach2, 
// int phase, covector1 & result1, covector2 & result2){
	reach1.assertprob();
	reach2.assertprob();

	// check if we're at a terminal node

	if (terminal(gs)) {
		handleLeaf(gs, updatePlayer, reach1, reach2, result1, result2);
		return;
	}

	nodesTouched++;

	// chance nodes (just bogus entries)
	// note: for expected values to make sense, should iterate over each move.

	if (gs.p1roll == 0) {
		GameState ngs = gs; 
		ngs.p1roll = 1;       
		pcs(ngs, player, depth+1, bidseq, updatePlayer, reach1, reach2, phase, result1, result2);
		return;
	}
	else if (gs.p2roll == 0) {
		GameState ngs = gs; 
		ngs.p2roll = 1;       
		pcs(ngs, player, depth+1, bidseq, updatePlayer, reach1, reach2, phase, result1, result2);
		return;
	}

	// cuts?
	if (phase == 1) {
		if (iter > 1 && updatePlayer == 1 && player == 1 && reach2.allEqualTo(0.0)) {
			phase = 2;
		}
		else if (iter > 1 && updatePlayer == 2 && player == 2 && reach1.allEqualTo(0.0)) {
			phase = 2; 
		}
	}

	if (phase == 2) {
		if (iter > 1 && updatePlayer == 1 && player == 1 && reach1.allEqualTo(0.0)) {
			result1.reset(0.0);
			result2.reset(0.0);
			return;
		}
		if (iter > 1 && updatePlayer == 2 && player == 2 && reach2.allEqualTo(0.0)) {
			result1.reset(0.0);
			result2.reset(0.0);
			return;
		}
	}

	// declare the variables
	let co = (player == 1 ? P1CO : P2CO);//Was: int

	let action = -1;//Was: int
	let maxBid = (gs.curbid == 0 ? BLUFFBID-1 : BLUFFBID);//Was: int
	let actionshere = maxBid - gs.curbid; //Was: int
	assert(actionshere > 0);

	// get the infosets here (one per outcome)

	let infosetkeys = new Array(co);//Was: ull[]
	Infoset is[co];  

	// only one of these is used
	covector1 moveEVs1[actionshere];
	covector2 moveEVs2[actionshere];

	for (let i = 0; i < co; i++) {//Was: int
		let outcome = i+1;//Was: int
		infosetkeys[i] = bidseq; 
		infosetkeys[i] <<= iscWidth; 
		if (player == 1) {
			infosetkeys[i] |= outcome; 
			infosetkeys[i] <<= 1; 
			// get the info set (also set is.curMoveProbs using regret matching)
			let ret = iss.get(infosetkeys[i], is[i], actionshere, 0);//Was: bool
			assert(ret);
		}
		else if (player == 2) {
			infosetkeys[i] |= outcome; 
			infosetkeys[i] <<= 1; 
			infosetkeys[i] |= 1; 
			// get the info set (also set is.curMoveProbs using regret matching)
			let ret = iss.get(infosetkeys[i], is[i], actionshere, 0);//Was: bool
			assert(ret);
		}
	}

	// iterate over the actions

	for (let i = gs.curbid+1; i <= maxBid; i++) {//Was: int
		action++;
		assert(action < actionshere);
		// only one of these is used
		covector1 moveProbs1;
		covector2 moveProbs2;
		for (let o = 0; o < co; o++) {//Was: int
			if (player == 1) moveProbs1[o] = is[o].curMoveProbs[action];
			else if (player == 2) moveProbs2[o] = is[o].curMoveProbs[action]; 
		}
		covector1 EV1; 
		covector2 EV2; 
		covector1 newReach1 = reach1; 
		covector2 newReach2 = reach2; 
		if (player == 1) newReach1 *= moveProbs1; 
		if (player == 2) newReach2 *= moveProbs2;
		GameState ngs = gs; 
		ngs.prevbid = gs.curbid;
		ngs.curbid = i; 
		ngs.callingPlayer = player;
		newbidseq = bidseq;//Was: ull
		newbidseq |= (1ULL << (BLUFFBID-i)); 

		pcs(ngs, 3-player, depth+1, newbidseq, updatePlayer, newReach1, newReach2, phase, EV1, EV2); 

		if (player == updatePlayer) {
			if (player == 1) {
				moveEVs1[action] = EV1;
				EV1 *= moveProbs1;
				result1 += EV1;
			}
			else if (player == 2) {
				moveEVs2[action] = EV2;
				EV2 *= moveProbs2;
				result2 += EV2;
			}
		}
		else {
			if (updatePlayer == 1) result1 += EV1;
			else if (updatePlayer == 2) result2 += EV2;
		}
	}

	// now the real stuff, cfr updates

	if (player == updatePlayer && phase == 1) {
		// regrets will be changed, so make sure to indicate it to prob updater
		for (let o = 0; o < co; o++) is[o].lastUpdate = iter;//Was: int

		for (let o = 0; o < co; o++) {//Was: int
			for (let a = 0; a < actionshere; a++) {//Was: int
				let moveEV = (player == 1 ? moveEVs1[a][o] : moveEVs2[a][o]);//Was: double
				let resulto = (player == 1 ? result1[o] : result2[o]); //Was: double
				is[o].cfr[a] += (moveEV - resulto); 
			}
		}
	}

	if (player == updatePlayer && phase <= 2) {
		for (let o = 0; o < co; o++) {//Was: int
			for (let a = 0; a < actionshere; a++) {//Was: int
				let my_prob = (player == 1 ? reach1[o] : reach2[o]);//Was: double
				// update total probs
				is[o].totalMoveProbs[a] += my_prob*is[o].curMoveProbs[a];
			}
		}
	}

	if (player == updatePlayer) {
		for (let o = 0; o < co; o++) {//Was: int
			iss.put(infosetkeys[o], is[o], actionshere, 0); 
		}
	}

}//»

const main = (argc, argv) => {//«
	let maxNodesTouched = 0; //Was: ull
	let maxIters = 0; //Was: ull
	init();

	if (argc < 2) {
		initInfosets();
		exit(-1);
	}
	else { 
		let filename = argv[1];//Was: string
		log("Reading the infosets from " , filename , "...");
		iss.readFromDisk(filename);

		if (argc >= 3) maxIters = to_ull(argv[2]);
	}  

	// get the iteration
	let filename = argv[1];//Was: string
	vector<string> parts; 
	split(parts, filename, '.'); 
	if (parts.size() != 3 || parts[1] == "initial") iter = 1; 
	else iter = to_ull(parts[1]); 
	log("Set iteration to " , iter);
	iter = MAX(1,iter);

	unsigned long long bidseq = 0; 

	StopWatch stopwatch;
	double totaltime = 0; 

	log("Starting PCS iterations");

	for (; true; iter++) {
		covector1 reach1(1.0); 
		covector2 reach2(1.0); 
		covector1 result1; 
		covector2 result2;

		GameState gs1; 
		bidseq = 0; 
		pcs(gs1, 1, 0, bidseq, 1, reach1, reach2, 1, result1, result2);

		GameState gs2; 
		bidseq = 0; 
		reach1.reset(1.0);
		reach2.reset(1.0);
		pcs(gs2, 1, 0, bidseq, 2, reach1, reach2, 1, result1, result2);

		if (iter % 10 == 0) { 
			log("."); 
			totaltime += stopwatch.stop();
			stopwatch.reset();
		}

		// it's a bit unfair to compare to other algorithms using nodes touched for PCS since 
		// significantly more work done per node touched, which is why we compared by time 

		if ((maxNodesTouched > 0 && nodesTouched >= maxNodesTouched) ||
			(maxNodesTouched == 0 && nodesTouched >= ntNextReport)) {

			log("total time: " , totaltime , " seconds."); 
			log("Done iteration " , iter);

			log("Computing bounds... "); 
			//cout.flush(); 
			let b1 = 0.0, b2 = 0.0;//Was: double
			iss.computeBound(b1, b2); 
			log(" b1 = " , b1 , ", b2 = " , b2 , ", bound = " , (2.0*MAX(b1,b2)));

			ntNextReport *= ntMultiplier; // need this here, before dumping metadata

			let conv = computeBestResponses(false);//Was: double
			report("pcs.bluff11.report.txt", totaltime, (2.0*MAX(b1,b2)), conv);
			//dumpInfosets("iss");

			stopwatch.reset(); 

			if (maxNodesTouched > 0 && nodesTouched >= maxNodesTouched) break;
		}

		if (iter == maxIters) break;
	}
}//»

}//»
function CFR_NS(){//«

let nextReport = 1;//Was: static ull
let reportMult = 2;//Was: static ull

//GS = GameState
const cfr = (gs, player, depth, bidseq, reach1, reach2, chanceReach, phase, updatePlayer) => {//«
//		   GS &  int	 int	ull		dbl		dbl		dbl			 int	int 		-> double
// This is Vanilla CFR. See my thesis, Algorithm 1 (Section 2.2.2)
//double cfr(GameState & gs, int player, int depth, unsigned long long bidseq, double reach1, double reach2, double chanceReach, int phase, int updatePlayer) {

//GameState gs (struct):«
//  int p1roll;           // the outcome of p1's roll
//  int p2roll;           // the outcome of p2's roll
//  int curbid;           // current bid (between 1 and 13)
//  int prevbid;          // prev bid from last turn
//  int callingPlayer;    // the player calling bluff (1 or 2)
//»

  // at terminal node?
//YWRK return (gs.curbid == BLUFFBID);
	if (terminal(gs)) {
		return payoff(gs, updatePlayer);
	}
	nodesTouched++;//NS: Bluff

	// Chances nodes at the top of the tree. If p1roll and p2roll not set, we're at a chance node
	if (gs.p1roll == 0) {//«
		let EV = 0.0;//Was: double 
		for (let i = 1; i <= numChanceOutcomes(1); i++) {//Was: int
			GameState ngs = gs; 
			ngs.p1roll = i; 
			let newChanceReach = getChanceProb(1,i)*chanceReach;//Was: double
			EV += getChanceProb(1,i)*cfr(ngs, player, depth+1, bidseq, reach1, reach2, newChanceReach, phase, updatePlayer); 
		}
		return EV;
	}//»
	else if (gs.p2roll == 0) {//«
		let EV = 0.0; //Was: double
		for (let i = 1; i <= numChanceOutcomes(2); i++) {//Was: int
			GameState ngs = gs; 
			ngs.p2roll = i; 
			let newChanceReach = getChanceProb(2,i)*chanceReach;//Was: double
			EV += getChanceProb(2,i)*cfr(ngs, player, depth+1, bidseq, reach1, reach2, newChanceReach, phase, updatePlayer); 
		}
		return EV;
	}//»

	// Check for cuts. This is the pruning optimization described in Section 2.2.2 of my thesis. 
	if (phase == 1 && (   (player == 1 && updatePlayer == 1 && reach2 <= 0.0) ||//«
		 (player == 2 && updatePlayer == 2 && reach1 <= 0.0))) {
		phase = 2; 
	}//»
	if (phase == 2 && (   (player == 1 && updatePlayer == 1 && reach1 <= 0.0) ||//«
		 (player == 2 && updatePlayer == 2 && reach2 <= 0.0))) {
		return 0.0;
	}//»

	// declare the variables 
	Infoset is;
	let infosetkey = 0;//Was: ull
	let stratEV = 0.0;//Was: double
	let action = -1;//Was: int

	let maxBid = (gs.curbid == 0 ? BLUFFBID-1 : BLUFFBID);//Was: int
	let actionshere = maxBid - gs.curbid; //Was: int

	assert(actionshere > 0);
	//double moveEVs[actionshere]; 
	let moveEVs = new Array(actionshere);
//Was: int
	for (let i = 0; i < actionshere; i++) moveEVs[i] = 0.0;

	// get the info set (also set is.curMoveProbs using regret matching)
	getInfoset(gs, player, bidseq, is, infosetkey, actionshere); 

	// iterate over the actions
	for (let i = gs.curbid+1; i <= maxBid; i++) {//Was: int«
		// there is a valid action here
		action++;
		assert(action < actionshere);

		let newbidseq = bidseq;//Was: ull
		let moveProb = is.curMoveProbs[action]; //Was: double
		let newreach1 = (player == 1 ? moveProb*reach1 : reach1); //Was: double
		let newreach2 = (player == 2 ? moveProb*reach2 : reach2); //Was: double

		GameState ngs = gs; 
		ngs.prevbid = gs.curbid;
		ngs.curbid = i; 
		ngs.callingPlayer = player;
		newbidseq |= (1ULL << (BLUFFBID-i)); 

		let payoff = cfr(ngs, 3-player, depth+1, newbidseq, newreach1, newreach2, chanceReach, phase, updatePlayer); //Was: double

		moveEVs[action] = payoff; 
		stratEV += moveProb*payoff; 
	}//»

	// post-traversals: update the infoset
	let myreach = (player == 1 ? reach1 : reach2); //Was: double
	let oppreach = (player == 1 ? reach2 : reach1); //Was: double

	if (phase == 1 && player == updatePlayer) {// regrets«
		for (let a = 0; a < actionshere; a++) {//Was: int
		// Multiplying by chanceReach here is important in games that have non-uniform chance outcome 
		// distributions. In Bluff(1,1) it is actually not needed, but in general it is needed (e.g. 
		// in Bluff(2,1)). 
			is.cfr[a] += (chanceReach*oppreach)*(moveEVs[a] - stratEV); 
		}
	}//»

	if (phase >= 1 && player == updatePlayer) {// av. strat«
		for (let a = 0; a < actionshere; a++) {//Was: int
			is.totalMoveProbs[a] += myreach*is.curMoveProbs[a]; 
		}
	}//»

	// save the infoset back to the store if needed
	if (player == updatePlayer) {//«
		iss.put(infosetkey, is, actionshere, 0); 
	}//»

	return stratEV;
}//»
const main = (argc, argv) => {//«
//int main(int argc, char ** argv) {
//unsigned long long maxIters = 0; 
	let maxIters = 0; 
	init();//WMNH

	if (argc < 2) {
		initInfosets();
		exit(-1);
	}
	else { 
		let filename = argv[1];//Was: string
		log("Reading the infosets from " , filename , "...");
		iss.readFromDisk(filename);

		if (argc >= 3)
		maxIters = to_ull(argv[2]);
	}  

	// get the iteration
	let filename = argv[1];//Was: string
	vector<string> parts; 
	split(parts, filename, '.'); 

//iter is defined in bluff.h: @ITER
	if (parts.size() != 3 || parts[1] == "initial") iter = 1; 
	else iter = to_ull(parts[1]); 
	log("Set iteration to " , iter);
	iter = MAX(1,iter);

	let bidseq = 0;//Was: ull

	StopWatch stopwatch;
	//double totaltime = 0; 
	let totaltime = 0; 

	log("Starting CFR iterations");

	for (; true; iter++) {//«
		GameState gs1; 
		bidseq = 0; 
		let ev1 = cfr(gs1, 1, 0, bidseq, 1.0, 1.0, 1.0, 1, 1);//Was: double

		GameState gs2; 
		bidseq = 0; 
		let ev2 = cfr(gs2, 1, 0, bidseq, 1.0, 1.0, 1.0, 1, 2);//Was: double

		if (iter % 10 == 0) {//«
			log("."); 
//No newlines here!
//cout << "."; 
//cout.flush(); 
			totaltime += stopwatch.stop();
			stopwatch.reset();
		}//»
		if (iter == 1 || nodesTouched >= ntNextReport) {//«
			//cout << endl;

			log("total time: " , totaltime , " seconds."); 
			log("Done iteration " , iter);

			log("ev1 = " , ev1 , ", ev2 = " , ev2);

			// This bound is the right-hand side of Theorem 3 from the original CFR paper.
			// \sum_{I \in \II_i} R_{i,imm}^{T,+}(I)

			log("Computing bounds... ");
			//	  cout.flush(); //???
			let b1 = 0.0, b2 = 0.0;//Was: double
			iss.computeBound(b1, b2); 
			log(" b1 = " , b1 , ", b2 = " , b2 , ", bound = " , (2.0*MAX(b1,b2)));

			let conv = 0.0;//Was: double
			let p1value = 0.0;//Was: double
			let p2value = 0.0;//Was: double
			conv = computeBestResponses(false, p1value, p2value);

			report("cfr.bluff11.report.txt", totaltime, (2.0*MAX(b1,b2)), conv);
		//dumpInfosets("iss");

		//  cout << endl;

			nextCheckpoint += cpWidth;
			nextReport *= reportMult;
			ntNextReport *= ntMultiplier;

			stopwatch.reset(); 
		}//»

		if (iter == maxIters) break;
	}//»
}//»

}//»

//»

//Commands«

const com_train = class extends Com{//«

run(){
const {args} = this;
if (!args[0]) return this.no("Usage: train <iterations>");
const train = KuhnTrainer();
train(parseInt(args[0]));
//log(train);
this.ok();
}

}//»

//»

const coms = {//«
	train: com_train,
}//»

export {coms};


