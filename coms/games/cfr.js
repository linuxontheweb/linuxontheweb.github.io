//« 7/21/25: This file exists to implement Marc Lanctot's (UAlberta, Maastricht, etc) 
// stuff on the open internets.

//»


//Imports«

//const{globals, Desk}=LOTW;
const {Com} = LOTW.globals.ShellMod.comClasses;
const{log,jlog,cwarn,cerr}=LOTW.api.util;
//»

//KuhnTrainer.java«
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

/*Orig«

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

//bluff.h //«

#ifndef __BLUFF_H__
#define __BLUFF_H__

#include <sys/timeb.h>

#include <cmath>
#include <string>
#include <limits>
#include <map>
#include <set>
#include <list>
#include <vector>
#include <iostream>

#include "infosetstore.h"

#define P1DICE   1
#define P2DICE   1
#define DIEFACES 6

// The number assigned to the "calling bluff action".
// Also an upper bound for |A(I)|, equal to 13 in Bluff(1,1)
#define BLUFFBID (((P1DICE+P2DICE)*DIEFACES)+1)

#include "defs.h"

struct GameState
{
  int p1roll;           // the outcome of p1's roll
  int p2roll;           // the outcome of p2's roll
  int curbid;           // current bid (between 1 and 13)
  int prevbid;          // prev bid from last turn
  int callingPlayer;    // the player calling bluff (1 or 2)

  GameState()
  {
    p1roll = p2roll = curbid = prevbid = 0;
    callingPlayer = 0;
  }
};

struct Infoset
{
  double cfr[BLUFFBID];
  double totalMoveProbs[BLUFFBID];
  double curMoveProbs[BLUFFBID];

  int actionshere;
  unsigned long long lastUpdate;
};

// game-specific function defs (implemented in bluff.cpp)
bool terminal(GameState & gs);
double payoff(GameState & gs, int player);
double payoff(int bid, int bidder, int callingPlayer, int p1roll, int p2roll, int player);
int whowon(GameState & gs);
int whowon(GameState & gs, int & delta);
int whowon(int bid, int bidder, int callingPlayer, int p1roll, int p2roll, int & delta);
void init();
double getChanceProb(int player, int outcome);
void convertbid(int & dice, int & face, int bid);
int countMatchingDice(const GameState & gs, int player, int face);
void getRoll(int * roll, int chanceOutcome, int player);  // currently array must be size 3 (may contain 0s)
int numChanceOutcomes(int player);

// util function defs (implemented in util.cpp)
std::string to_string(double i);
std::string to_string(unsigned long long i);
std::string to_string(int i);
int to_int(std::string str);
unsigned long long to_ull(std::string str);
double to_double(std::string str);
void getSortedKeys(std::map<int,bool> & m, std::list<int> & kl);
void split(std::vector<std::string> & tokens, const std::string line, char delimiter);
unsigned long long pow2(int i);
void bubsort(int * array, int size);
std::string infosetkey_to_string(unsigned long long infosetkey);
bool replace(std::string& str, const std::string& from, const std::string& to);
std::string getCurDateTime();
void seedCurMicroSec();
double unifRand01();

// solver-specific function defs
void newInfoset(Infoset & is, int actionshere);
unsigned long long getInfosetKey(GameState & gs, int player, unsigned long long bidseq);
void getInfoset(GameState & gs, int player, unsigned long long bidseq, Infoset & is, unsigned long long & infosetkey, int actionshere);
void initInfosets();
void initSeqStore();
void allocSeqStore();
double computeBestResponses(bool avgFix);
double computeBestResponses(bool avgFix, double & p1value, double & p2value);
void report(std::string filename, double totaltime, double bound, double conv);
void dumpInfosets(std::string prefix);
void dumpSeqStore(std::string prefix);
void dumpMetaData(std::string prefix, double totaltime);
void loadMetaData(std::string file);
double getBoundMultiplier(std::string algorithm);
double evaluate();
unsigned long long absConvertKey(unsigned long long fullkey);
void setBRTwoFiles();
void estimateValue();
void loadUCTValues(Infoset & is, int actions);
void saveUCTValues(Infoset & is, int actions);
void UCTBR(int fixed_player);
void fsiBR(int fixed_player);
double absComputeBestResponses(bool abs, bool avgFix, double & p1value, double & p2value);
double absComputeBestResponses(bool abs, bool avgFix);

// sampling (impl in sampling.cpp)
void sampleMoveAvg(Infoset & is, int actionshere, int & index, double & prob);
void sampleChanceEvent(int player, int & outcome, double & prob);
void sampleMoveAvg(Infoset & is, int actionshere, int & index, double & prob);
int sampleAction(Infoset & is, int actionshere, double & sampleprob, double epsilon, bool firstTimeUniform);

// global variables
class InfosetStore;
extern InfosetStore iss;                 // the strategies are stored in here (for both players)
extern int iscWidth;                     // number of bits for chance outcome
extern unsigned long long iter;          // the current iteration
extern std::string filepref;             // prefix path for saving files
extern double cpWidth;                   // used for timing/stats
extern double nextCheckpoint;            // used for timing/stats
extern unsigned long long ntNextReport;  // used for timing/stats
extern unsigned long long ntMultiplier;  // used for timing/stats
extern unsigned long long nodesTouched;  // used for timing/stats

class StopWatch
{
  timeb tstart, tend;
public:
  StopWatch() { ftime(&tstart); }
  void reset() { ftime(&tstart); }
  double stop()
  {
    ftime(&tend);
    return ((tend.time*1000 + tend.millitm)
            - (tstart.time*1000 + tstart.millitm) ) / 1000.0;
  }
};

#endif
//»
//bluff.cpp «
// * Info about this game from a run of bluffcounter.cpp:
// *
// * storing 2 doubles per iapair + 2 doubles per infoset
// * want size of index to be at least double # infosets (then 2 doubles per index size)
// *
// * for 1,1:
// *   p1 infosets 12288, p2 infosets 12288, total: 24576
// *   infoset actions pairs, p1 p2 total = 24570 24570 49140


#include <iostream>
#include <string>
#include <cstring>
#include <map>
#include <cassert>
#include <cstdlib>
#include <ctime>
#include <set>

#include "bluff.h"
#include "infosetstore.h"
#include "sys/time.h"

#define LOC(b,r,c)  b[r*3 + c]

using namespace std;

// global variables
InfosetStore iss;
string filepref = "scratch/";
unsigned long long iter;
int iscWidth = 0;
double cpWidth = 10.0;
double nextCheckpoint = cpWidth;
unsigned long long nodesTouched = 0;
unsigned long long ntNextReport = 1000000;  // nodes touched base timing
unsigned long long ntMultiplier = 2;  // nodes touched base timing

// key is roll, value is # of time it shows up. Used only when determining chance outcomes
map<int,int> outcomes;

// probability of this chance move. indexed as 0-5 or 0-20
// note: CO/co stand for "chance outcome"
static int numChanceOutcomes1 = 0;
static int numChanceOutcomes2 = 0;
static double * chanceProbs1 = NULL;
static double * chanceProbs2 = NULL;
static int * chanceOutcomes1 = NULL;
static int * chanceOutcomes2 = NULL;
static int * bids = NULL;

static StopWatch stopwatch;

double getChanceProb(int player, int outcome)
{
  // outcome >= 1, so must subtract 1 from it
  int co = (player == 1 ? numChanceOutcomes1 : numChanceOutcomes2);
  assert(outcome-1 >= 0 && outcome-1 < co);
  double * cp = (player == 1 ? chanceProbs1 : chanceProbs2);
  return cp[outcome-1];
}

int numChanceOutcomes(int player)
{
  return (player == 1 ? numChanceOutcomes1 : numChanceOutcomes2);
}

void unrankco(int i, int * roll, int player)
{
  int num = 0;
  int * chanceOutcomes = (player == 1 ? chanceOutcomes1 : chanceOutcomes2);
  num = chanceOutcomes[i];

  assert(num > 0);

  int numDice = (player == 1 ? P1DICE : P2DICE);

  for (int j = numDice-1; j >= 0; j--)
  {
    roll[j] = num % 10;
    num /= 10;
  }
}


void initBids()
{
  bids = new int[BLUFFBID-1];
  int nextWildDice = 1;
  int idx = 0;
  for (int dice = 1; dice <= P1DICE + P2DICE; dice++)
  {
    for (int face = 1; face <= DIEFACES-1; face++)
    {
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

}

unsigned long long getInfosetKey(GameState & gs, int player, unsigned long long bidseq)
{
  unsigned long long infosetkey = bidseq;
  infosetkey <<= iscWidth;
  if (player == 1)
  {
    infosetkey |= gs.p1roll;
    infosetkey <<= 1;
  }
  else if (player == 2)
  {
    infosetkey |= gs.p2roll;
    infosetkey <<= 1;
    infosetkey |= 1;
  }

  return infosetkey;
}

void getInfoset(GameState & gs, int player, unsigned long long bidseq, Infoset & is, unsigned long long & infosetkey, int actionshere)
{
  infosetkey = getInfosetKey(gs, player, bidseq);
  bool ret = iss.get(infosetkey, is, actionshere, 0);
  assert(ret);
}

int ceiling_log2(int val)
{
  int exp = 1, num = 2;
  do {
    if (num > val) { return exp; }
    num *= 2;
    exp++;
  }
  while (true);
}

int intpow(int x, int y)
{
  if (y == 0) return 1;
  return x * intpow(x, y-1);
}

void nextRoll(int * roll, int size)
{
  for (int i = size-1; i >= 0; i--)
  {
    // Try to increment if by 1.
    if (roll[i] < DIEFACES) {
      // if possible, do it and then set everything to the right back to 1
      roll[i]++;
      for (int j = i+1; j < size; j++)
        roll[j] = 1;

      return;
    }
  }
}

int getRollBase10(int * roll, int size)
{
  int multiplier = 1;
  int val = 0;
  for (int i = size-1; i >= 0; i--)
  {
    val += roll[i]*multiplier;
    multiplier *= 10;
  }

  return val;
}

void determineChanceOutcomes(int player)
{
  int dice = (player == 1 ? P1DICE : P2DICE);
  int rolls[dice];
  for (int r = 0; r < dice; r++) rolls[r] = 1;
  outcomes.clear();

  int permutations = intpow(DIEFACES, dice);
  int p;

  for (p = 0; p < permutations; p++) {

    // first, make a copy
    int rollcopy[dice];
    memcpy(rollcopy, rolls, dice*sizeof(int));

    // now sort
    bubsort(rollcopy, dice);

    // now convert to an integer in base 10
    int key = getRollBase10(rollcopy, dice);

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

  map<int,int>::iterator iter;
  int idx = 0;
  for (iter = outcomes.begin(); iter != outcomes.end(); iter++) {
    chanceOutcomes[idx] = iter->first;
    idx++;
  }

  bubsort(chanceOutcomes, numChanceOutcomes);

  for (int c = 0; c < numChanceOutcomes; c++) {
    int key = chanceOutcomes[c];
    chanceProbs[c] = static_cast<double>(outcomes[key]) / static_cast<double>(permutations);
    //cout << "player " << player << " roll " << key << " prob " << chanceProbs[c] << endl;
  }
}

void init()
{
  assert(bids == NULL);

  cout << "Initializing Bluff globals..." << endl;

  seedCurMicroSec();

  determineChanceOutcomes(1);
  determineChanceOutcomes(2);

  // iscWidth if the number of bits needed to encode the chance outcome in the integer
  int maxChanceOutcomes = (numChanceOutcomes1 > numChanceOutcomes2 ? numChanceOutcomes1 : numChanceOutcomes2);
  iscWidth = ceiling_log2(maxChanceOutcomes);

  initBids();

  cout << "Globals are: " << numChanceOutcomes1 << " " << numChanceOutcomes2 << " " << iscWidth << endl;
}


void newInfoset(Infoset & is, int actions)
{
  is.actionshere = actions;
  is.lastUpdate = 0;

  for (int i = 0; i < actions; i++)
  {
    is.cfr[i] = 0.0;
    is.totalMoveProbs[i] = 0.0;
    is.curMoveProbs[i] = 1.0 / actions;
  }
}

bool terminal(GameState & gs)
{
  return (gs.curbid == BLUFFBID);
}

// a bid is from 1 to 12, for example
void convertbid(int & dice, int & face, int bid)
{
  if (P1DICE == 1 && P2DICE == 1)
  {
    dice = (bid - 1) / DIEFACES + 1;
    face = bid % DIEFACES;
    if (face == 0) face = DIEFACES;

    assert(dice >= 1 && dice <= 2);
    assert(face >= 1 && face <= DIEFACES);
  }
  else
  {
    // stored in an array.
    int size = (P1DICE+P2DICE)*DIEFACES;
    assert((bid-1) >= 0 && (bid-1) < size);

    dice = bids[bid-1] / 10;
    face = bids[bid-1] % 10;
  }
}

void getRoll(int * roll, int chanceOutcome, int player)
{
  unrankco(chanceOutcome-1, roll, player);
}

int countMatchingDice(const GameState & gs, int player, int face)
{
  int roll[3] = {0,0,0};
  int matchingDice = 0;
  int dice = (player == 1 ? P1DICE : P2DICE);

  if (dice == 1)
  {
    if (player == 1)
      roll[1] = gs.p1roll;
    else if (player == 2)
      roll[1] = gs.p2roll;
  }
  else if (dice == 2)
  {
    if (player == 1)
      unrankco(gs.p1roll-1, roll, 1);
    else if (player == 2)
      unrankco(gs.p2roll-1, roll, 2);
  }

  for (int i = 0; i < 3; i++)
    if (roll[i] == face || roll[i] == DIEFACES)
      matchingDice++;

  return matchingDice;
}

int whowon(int bid, int bidder, int callingPlayer, int p1roll, int p2roll, int & delta)
{
  int dice = 0, face = 0;
  convertbid(dice, face, bid);

  assert(bidder != callingPlayer);

  // get the dice

  int p1rollArr[P1DICE];
  int p2rollArr[P2DICE];

  unrankco(p1roll-1, p1rollArr, 1);
  unrankco(p2roll-1, p2rollArr, 2);

  // now check the number of matches

  int matching = 0;

  for (int i = 0; i < P1DICE; i++)
    if (p1rollArr[i] == face || p1rollArr[i] == DIEFACES)
      matching++;

  for (int j = 0; j < P2DICE; j++)
    if (p2rollArr[j] == face || p2rollArr[j] == DIEFACES)
      matching++;

  delta = matching - dice;
  if (delta < 0) delta *= -1;

  if (matching >= dice)
  {
    return bidder;
  }
  else
  {
    return callingPlayer;
  }
}

int whowon(GameState & gs, int & delta)
{
  int bidder = 3 - gs.callingPlayer;
  return whowon(gs.prevbid, bidder, gs.callingPlayer, gs.p1roll, gs.p2roll, delta);
}

int whowon(GameState & gs)
{
  int bidder = 3 - gs.callingPlayer;
  int delta = 0;
  return whowon(gs.prevbid, bidder, gs.callingPlayer, gs.p1roll, gs.p2roll, delta);
}

double payoff(int winner, int player, int delta)
{
  // first thing: if it's an exact match, calling player loses 1 die
  // may as well set delta to 1 in this case
  if (delta == 0) delta = 1;

  double p1payoff = 0.0;

  if
    (P1DICE == 1 && P2DICE == 1) return (winner == player ? 1.0 : -1.0);
  else
  {
    assert(false);
  }

  return (player == 1 ? p1payoff : -p1payoff);
}

// In these functions "delta" represents the number of dice the bid is off by (not relevant for (1,1))
// Returns payoff for Liar's Dice (delta always equal to 1)
double payoff(int winner, int player)
{
  return payoff(winner, player, 1);
}

// this is the function called by all the algorithms.
// Now set to use the delta
double payoff(GameState & gs, int player)
{
  int delta = 0;
  int winner = whowon(gs, delta);
  return payoff(winner, player, delta);
}

double payoff(int bid, int bidder, int callingPlayer, int p1roll, int p2roll, int player)
{
  int delta = 0;
  int winner = whowon(bid, bidder, callingPlayer, p1roll, p2roll, delta);
  return payoff(winner, player);
}

void report(string filename, double totaltime, double bound, double conv)
{
  filename = filepref + filename;
  cout << "Reporting to " + filename + " ... " << endl;
  ofstream outf(filename.c_str(), ios::app);
  outf << iter << " " << totaltime << " " << bound << " " << conv << " " << nodesTouched << endl;
  outf.close();
}

void dumpInfosets(string prefix)
{
  string filename = filepref + prefix + "." + to_string(iter) + ".dat";
  cout << "Dumping infosets to " + filename + " ... " << endl;
  iss.dumpToDisk(filename);
}

// not even sure what I used this "meta data" for, if I ever used it....
void dumpMetaData(string prefix, double totaltime)
{
  string filename = filepref + prefix + "." + to_string(iter) + ".dat";
  cout << "Dumping metadeta to " + filename + " ... " << endl;

  ofstream outf(filename.c_str(), ios::binary);
  if (!outf.is_open()) {
    cerr << "Could not open meta data file for writing." << endl;
    return;
  }

  outf.write(reinterpret_cast<const char *>(&iter), sizeof(iter));
  outf.write(reinterpret_cast<const char *>(&nodesTouched), sizeof(nodesTouched));
  outf.write(reinterpret_cast<const char *>(&ntNextReport), sizeof(ntNextReport));
  outf.write(reinterpret_cast<const char *>(&ntMultiplier), sizeof(ntMultiplier));
  outf.write(reinterpret_cast<const char *>(&totaltime), sizeof(totaltime));

  outf.close();
}

void loadMetaData(std::string filename)
{
  ifstream inf(filename.c_str(), ios::binary);
  if (!inf.is_open()) {
    cerr << "Could not open meta data file." << endl;
    return;
  }

  double totaltime = 0;

  inf.read(reinterpret_cast<char *>(&iter), sizeof(iter));
  inf.read(reinterpret_cast<char *>(&nodesTouched), sizeof(nodesTouched));
  inf.read(reinterpret_cast<char *>(&ntNextReport), sizeof(ntNextReport));
  inf.read(reinterpret_cast<char *>(&ntMultiplier), sizeof(ntMultiplier));
  inf.read(reinterpret_cast<char *>(&totaltime), sizeof(totaltime));

  inf.close();
}

// Does a recursive tree walk setting up the information sets, creating the initial strategies
void initInfosets(GameState & gs, int player, int depth, unsigned long long bidseq)
{
  if (terminal(gs))
    return;

  // check for chance nodes
  if (gs.p1roll == 0)
  {
    for (int i = 1; i <= numChanceOutcomes1; i++)
    {
      GameState ngs = gs;
      ngs.p1roll = i;

      initInfosets(ngs, player, depth+1, bidseq);
    }

    return;
  }
  else if (gs.p2roll == 0)
  {
    for (int i = 1; i <= numChanceOutcomes2; i++)
    {
      GameState ngs = gs;
      ngs.p2roll = i;

      initInfosets(ngs, player, depth+1, bidseq);
    }

    return;
  }

  int maxBid = (gs.curbid == 0 ? BLUFFBID-1 : BLUFFBID);
  int actionshere = maxBid - gs.curbid;

  assert(actionshere > 0);
  Infoset is;
  newInfoset(is, actionshere);

  for (int i = gs.curbid+1; i <= maxBid; i++)
  {
    if (depth == 2 && i == (gs.curbid+1)) {
      cout << "InitTrees. iss stats = " << iss.getStats() << endl;
    }

    GameState ngs = gs;
    ngs.prevbid = gs.curbid;
    ngs.curbid = i;
    ngs.callingPlayer = player;
    unsigned long long newbidseq = bidseq;
    newbidseq |= (1ULL << (BLUFFBID-i));

    initInfosets(ngs, (3-player), depth+1, newbidseq);
  }

  unsigned infosetkey = 0;
  infosetkey = bidseq;
  infosetkey <<= iscWidth;
  if (player == 1)
  {
    infosetkey |= gs.p1roll;
    infosetkey <<= 1;
    iss.put(infosetkey, is, actionshere, 0);
  }
  else if (player == 2)
  {
    infosetkey |= gs.p2roll;
    infosetkey <<= 1;
    infosetkey |= 1;
    iss.put(infosetkey, is, actionshere, 0);
  }
}

void initInfosets()
{
  unsigned long long bidseq = 0;

  GameState gs;

  cout << "Initialize info set store..." << endl;
  // # doubles in total, size of index (must be at least # infosets)
  // 2 doubles per iapair + 2 per infoset =
  if (P1DICE == 1 && P2DICE == 1 && DIEFACES == 6)
    iss.init(147432, 100000);
  else
  {
    cerr << "initInfosets not defined for this PXDICE + DIEFACES" << endl;
  }

  assert(iss.getSize() > 0);

  cout << "Initializing info sets..." << endl;
  stopwatch.reset();
  initInfosets(gs, 1, 0, bidseq);

  cout << "time taken = " << stopwatch.stop() << " seconds." << endl;
  iss.stopAdding();

  cout << "Final iss stats: " << iss.getStats() << endl;
  stopwatch.reset();

  string filename = filepref + "iss.initial.dat";

  cout << "Dumping information sets to " << filename << endl;
  iss.dumpToDisk(filename);
}
//»
//infosetstore.h //«
// * A memory-efficent hash table for storing information sets. 
#ifndef __INFOSETSTORE_H__
#define __INFOSETSTORE_H__

#include <string>
#include <fstream>

#include "bluff.h"

struct Infoset; 

class InfosetStore
{
  // stores the position of each infoset in the large table
  // unlike in bluffpt, this is a hash table that uses linear probing
  unsigned long long * indexKeys; 
  unsigned long long * indexVals; 
  unsigned long long indexSize;
 
  // returns the position into the large table or indexSize if not found
  // hashIndex is set to the index of the hash table where this key would go
  unsigned long long getPosFromIndex(unsigned long long infoset_key, unsigned long long & hashIndex); 

  // use this one if you don't care about the hashIndex
  unsigned long long getPosFromIndex(unsigned long long infoset_key);

  // To avoid large contiguous portions of memory, store as rows of bitsets
  double ** tablerows;

  // total items to be stored
  // size in bytes of each
  // # bytes per row
  // # rows
  unsigned long long size; 
  unsigned long long rowsize;
  unsigned long long rows;

  // last row is the leftover (smaller)
  unsigned long long lastRowSize;

  // are we added infosets to this store? when doing so, we update the infoset counter
  // and add info to the index. when not doing so, we assume the index will get us our
  // position and simply replace what's there
  bool addingInfosets;
  unsigned long long nextInfosetPos;
  unsigned long long added;

  bool get_priv(unsigned long long infoset_key, Infoset & infoset, int moves, int firstmove); 
  void put_priv(unsigned long long infoset_key, Infoset & infoset, int moves, int firstmove); 

  void next(unsigned long long & row, unsigned long long & col, unsigned long long & pos, unsigned long long & curRowSize); 

public:

  InfosetStore()
  {
    tablerows = NULL;
  }

  void destroy()
  {
    if (tablerows != NULL)
    {
      delete [] indexKeys; 
      delete [] indexVals;

      for (unsigned int i = 0; i < rows; i++) 
        delete [] tablerows[i];
    
      delete [] tablerows;
    }

    tablerows = NULL;
  }

  ~InfosetStore()
  {
    destroy(); 
  }
  
  unsigned long long getSize() { return size; }

  // First param: total # of doubles needed. 
  //   Should be the total # of (infoset,action) pairs times 2 (2 doubles each)
  // Second param: size of index. 
  //   Should be the max number taken by an infoset key represented as an integer + 1
  void init(unsigned long long _size, unsigned long long _indexsize);
  std::string getStats();

  void stopAdding() { addingInfosets = false; } 
  unsigned long long getNextPos() { return nextInfosetPos; }
  unsigned long long getAdded() { return added; }

  bool get(unsigned long long infoset_key, Infoset & infoset, int moves, int firstmove); 
  void put(unsigned long long infoset_key, Infoset & infoset, int moves, int firstmove); 

  void writeBytes(std::ofstream & out, void * addr, unsigned int num);  
  void readBytes(std::ifstream & in, void * addr, unsigned int num); 

  void dumpToDisk(std::string filename);
  bool readFromDisk(std::string filename);

  bool contains(unsigned long long infoset_key);

  void printValues(); 
  void computeBound(double & sum_RTimm1, double & sum_RTimm2); 

  // used to save memory when evaluation strategies from 2 diff strat files
  void importValues(int player, std::string filename);

  void clear(); 
  void copy(InfosetStore & dest);
};

#endif
//»
//infosetstore.cpp //«

#include <iostream>
#include <cassert>
#include <cstring>
#include <cstdlib>

#include "infosetstore.h"

#define ROWS 100

using namespace std;

static unsigned long long totalLookups = 0; 
static unsigned long long totalMisses = 0; 

// First param: total # of doubles needed. 
//   Should be the total # of (infoset,action) pairs times 2 (2 doubles each)
// Second param: size of index. 
//   Should be the max number taken by an infoset key represented as an integer + 1
void InfosetStore::init(unsigned long long _size, unsigned long long _indexsize)
{
  cout << "IS: init" << endl; 

  size = _size;
  indexSize = _indexsize; 

  rowsize = size / (ROWS-1); 
  lastRowSize = size - rowsize*(ROWS-1);
  rows = ROWS;

  int i = 0; 
  while (lastRowSize > rowsize) // will sometimes happen when _size is small 
  { 
    i++;
    rows = ROWS-i;
    rowsize = size / (rows-1); 
    lastRowSize = size - rowsize*(rows-1);
  }

  assert(i >= 0 && i <= 99); 

  cout << "IS: stats " << getStats() << endl;
  cout << "IS: allocating memory.. " << endl;

  // allocate the index
  indexKeys = new unsigned long long [indexSize];
  indexVals = new unsigned long long [indexSize];
  for (unsigned long long i = 0; i < indexSize; i++) 
    indexKeys[i] = indexVals[i] = size;   // used to indicate that no entry is present

  // allocate the rows 
  tablerows = new double* [rows];
  assert(tablerows != NULL);
  for (unsigned long long i = 0; i < rows; i++) 
  {
    if (i != (rows-1))
    {
      tablerows[i] = new double[rowsize];
      assert(tablerows[i] != NULL);
      for (unsigned long long j = 0; j < rowsize; j++)
        tablerows[i][j] = 0.0;
    }
    else 
    {
      tablerows[i] = new double[lastRowSize];
      assert(tablerows[i] != NULL);
      for (unsigned int j = 0; j < lastRowSize; j++)
        tablerows[i][j] = 0.0;
    }
  }

  // set to adding information sets
  addingInfosets = true;
  nextInfosetPos = 0;
  added = 0;
  
  cout << "IS: init done. " << endl;
}

string InfosetStore::getStats() 
{
  string str; 
  str += (to_string(size) + " "); 
  str += (to_string(rowsize) + " "); 
  str += (to_string(rows) + " "); 
  str += (to_string(lastRowSize) + " "); 
  str += (to_string(added) + " "); 
  str += (to_string(nextInfosetPos) + " "); 
  str += (to_string(totalLookups) + " "); 
  str += (to_string(totalMisses) + " "); 

  double avglookups =   static_cast<double>(totalLookups + totalMisses) 
                      / static_cast<double>(totalLookups); 

  double percent_full = static_cast<double>(nextInfosetPos) /  static_cast<double>(size) * 100.0;  

  str += (to_string(avglookups) + " ");
  str += (to_string(percent_full) + "\% full"); 
  return str;
}

void InfosetStore::next(unsigned long long & row, unsigned long long & col, unsigned long long & pos, unsigned long long & curRowSize)
{
  pos++;
  col++; 
  
  if (col >= curRowSize) {
    col = 0; 
    row++;
    curRowSize = (row < (rows-1) ? rowsize : lastRowSize);
  }
}

bool InfosetStore::get(unsigned long long infoset_key, Infoset & infoset, int moves, int firstmove)
{
  return get_priv(infoset_key, infoset, moves, firstmove);
}

void InfosetStore::put(unsigned long long infoset_key, Infoset & infoset, int moves, int firstmove)
{
  put_priv(infoset_key, infoset, moves, firstmove);
}


bool InfosetStore::contains(unsigned long long infoset_key)
{
  assert(infoset_key < indexSize); 
  unsigned long long pos = getPosFromIndex(infoset_key); 
  return (pos >= size ? false : true);
}
  
unsigned long long InfosetStore::getPosFromIndex(unsigned long long infoset_key)
{
  unsigned long long hi = 0;
  return getPosFromIndex(infoset_key, hi); 
}
  
unsigned long long InfosetStore::getPosFromIndex(unsigned long long infoset_key, unsigned long long & hashIndex)
{
  unsigned long long start = infoset_key % indexSize; 
  unsigned long long misses = 0; 

  for (unsigned long long i = start; misses < indexSize; misses++)
  {
    if (indexKeys[i] == infoset_key && indexVals[i] < size) 
    {
      // cache hit 
      totalLookups++; 
      totalMisses += misses;
      hashIndex = i; 
      return indexVals[i]; 
    }
    else if (indexVals[i] >= size) // index keys can be >= size since they're arbitrary, but not values!
    {
      totalLookups++; 
      totalMisses += misses;
      hashIndex = i;
      return size; 
    }

    i = i+1; 
    if (i >= indexSize)
      i = 0; 
  }

  // should be large enough to hold everything
  assert(false); 
  return 0;
}

bool InfosetStore::get_priv(unsigned long long infoset_key, Infoset & infoset, int moves, int firstmove)
{
  unsigned long long row, col, pos, curRowSize;

  pos = getPosFromIndex(infoset_key);  // uses a hash table
  if (pos >= size) return false;

  row = pos / rowsize;
  col = pos % rowsize;
  curRowSize = (row < (rows-1) ? rowsize : lastRowSize);

  // get the number of moves
  assert(row < rows); assert(col < curRowSize); assert(pos < size); 
  unsigned long long x; 
  double y = tablerows[row][col];
  assert(sizeof(x) == sizeof(double));
  memcpy(&x, &y, sizeof(x)); 
  infoset.actionshere = static_cast<int>(x); 
  assert(infoset.actionshere > 0);
  next(row, col, pos, curRowSize);
  
  // get the lastupdate
  assert(row < rows); assert(col < curRowSize);  assert(pos < size); 
  y = tablerows[row][col];
  assert(sizeof(x) == sizeof(double));
  memcpy(&x, &y, sizeof(x)); 
  infoset.lastUpdate = x; 
  next(row, col, pos, curRowSize);

  for (int i = 0, m = firstmove; i < moves; i++,m++) 
  {
    assert(row < rows);
    assert(col < curRowSize); 
    assert(pos < size); 
    infoset.cfr[m] = tablerows[row][col];

    next(row, col, pos, curRowSize);

    assert(row < rows);
    assert(col < curRowSize); 
    assert(pos < size); 
    infoset.totalMoveProbs[m] = tablerows[row][col];

    next(row, col, pos, curRowSize); 
  }

  // now do the usual regret matching to get the curMoveProbs

  double totPosReg = 0.0;
  bool all_negative = true;

  for (int i = 0, m = firstmove; i < moves; i++, m++) 
  {
    int movenum = m;
    double cfr = infoset.cfr[movenum];
    CHKDBL(cfr);

    if (cfr > 0.0)
    {
      totPosReg = totPosReg + cfr;
      all_negative = false;
    }
  }

  double probSum = 0.0;

  for (int i = 0, m = firstmove; i < moves; i++, m++) 
  {
    int movenum = m;

    if (!all_negative)
    {
      if (infoset.cfr[movenum] <= 0.0)
      {
        infoset.curMoveProbs[movenum] = 0.0;
      }
      else
      {
        assert(totPosReg >= 0.0);
        if (totPosReg > 0.0)  // regret-matching
          infoset.curMoveProbs[movenum] = infoset.cfr[movenum] / totPosReg;

      }
    }
    else
    {
      infoset.curMoveProbs[movenum] = 1.0/moves;
    }

    CHKPROB(infoset.curMoveProbs[movenum]);
    probSum += infoset.curMoveProbs[movenum];
  }

  return true;
}

void InfosetStore::put_priv(unsigned long long infoset_key, Infoset & infoset, int moves, int firstmove)
{
  unsigned long long row, col, pos, curRowSize;

  assert(moves > 0);
  bool newinfoset = false; 

  unsigned long long hashIndex = 0;
  unsigned long long thepos = getPosFromIndex(infoset_key, hashIndex);  
  if (addingInfosets && thepos >= size)
  {
    newinfoset = true; 

    // new infoset to be added at the end
    assert(nextInfosetPos < size); 

    // only add it if it's a new info set
    pos = nextInfosetPos;
    row = nextInfosetPos / rowsize;
    col = nextInfosetPos % rowsize;
    curRowSize = (row < (rows-1) ? rowsize : lastRowSize);
    
    //index[infoset_key] = pos;
    assert(pos < size); 
    indexKeys[hashIndex] = infoset_key;
    indexVals[hashIndex] = pos;

    //cout << "Adding infosetkey: " << infoset_key << endl; 
  }
  else 
  {
    // we've seen this one before, load it
    newinfoset = false; 

    //pos = index[infoset_key];
    //pos = indexVals[hashIndex]; 
    assert(thepos < size); 
    pos = thepos; 
    row = pos / rowsize;
    col = pos % rowsize;
    curRowSize = (row < (rows-1) ? rowsize : lastRowSize);
  }
  
  // store the number of moves at this infoset
  assert(row < rows);
  assert(col < curRowSize); 
  assert(pos < size); 
  unsigned long long x = moves;
  double y; 
  assert(sizeof(x) == sizeof(double));
  memcpy(&y, &x, sizeof(x));
  tablerows[row][col] = y; 
  next(row, col, pos, curRowSize);

  // store the last update iter of this infoset
  assert(row < rows);
  assert(col < curRowSize); 
  assert(pos < size); 
  x = infoset.lastUpdate;
  assert(sizeof(x) == sizeof(double));
  memcpy(&y, &x, sizeof(x));
  tablerows[row][col] = y; 
  next(row, col, pos, curRowSize);

  // moves are from 1 to moves, so write them in order. 
  // first, regret, then avg. strat
  for (int i = 0, m = firstmove; i < moves; i++, m++) 
  { 
    //cout << "pos = " << pos << ", row = " << row << endl;
    if (row >= rows) {
      cout << "iss stats: " << iss.getStats() << endl;
    }

    assert(row < rows);
    assert(col < curRowSize); 
    assert(pos < size); 
    CHKDBL(infoset.cfr[m]); 
    tablerows[row][col] = infoset.cfr[m];

    next(row, col, pos, curRowSize);

    assert(row < rows);
    assert(col < curRowSize); 
    assert(pos < size); 
    tablerows[row][col] = infoset.totalMoveProbs[m];

    next(row, col, pos, curRowSize); 
    
  }

  if (newinfoset && addingInfosets)
  {
    nextInfosetPos = pos;
    added++;
  }
}
  
void InfosetStore::printValues()
{
  for (unsigned int i = 0; i < indexSize; i++) 
  {
    if (indexVals[i] < size) 
    {
      // this is a valid position
      unsigned long long row, col, pos, curRowSize;
      pos = indexVals[i];
      row = pos / rowsize;
      col = pos % rowsize;
      curRowSize = (row < (rows-1) ? rowsize : lastRowSize);

      cout << "infosetkey = " << indexKeys[i]; 
      cout << ", infosetkey_str = " << infosetkey_to_string(indexKeys[i]);

      // read # actions
      unsigned long long actionshere = 0;
      assert(sizeof(actionshere) == sizeof(double)); 
      memcpy(&actionshere, &tablerows[row][col], sizeof(actionshere)); 
      next(row, col, pos, curRowSize);
      
      // read the integer
      unsigned long long lastUpdate = 0;
      double x = tablerows[row][col];
      memcpy(&lastUpdate, &x, sizeof(actionshere)); 
      next(row, col, pos, curRowSize);

      cout << ", actions = " << actionshere << ", lastUpdate = " << lastUpdate << endl;

      for (unsigned long long a = 0; a < actionshere; a++) 
      {
        // cfr
        assert(row < rows);
        assert(col < curRowSize); 
        cout << "  cfr[" << a << "]=" << tablerows[row][col]; 
      
        next(row, col, pos, curRowSize);
        // total move probs
        cout << "  tmp[" << a << "]=" << tablerows[row][col]; 
        cout << endl;

        next(row, col, pos, curRowSize);
        // next cfr
      }

      cout << endl;
    }
  }
}

void InfosetStore::clear()
{
  for (unsigned int i = 0; i < indexSize; i++) 
  {
    if (indexVals[i] < size) 
    {
      // this is a valid position
      unsigned long long row, col, pos, curRowSize;
      pos = indexVals[i];
      row = pos / rowsize;
      col = pos % rowsize;
      curRowSize = (row < (rows-1) ? rowsize : lastRowSize);

      // read # actions
      unsigned long long actionshere = 0;
      assert(sizeof(actionshere) == sizeof(double)); 
      memcpy(&actionshere, &tablerows[row][col], sizeof(actionshere)); 
      next(row, col, pos, curRowSize);
      
      // read the integer
      unsigned long long lastUpdate = 0;
      double x = tablerows[row][col];
      memcpy(&lastUpdate, &x, sizeof(actionshere)); 
      tablerows[row][col] = 0.0;
      next(row, col, pos, curRowSize);

      for (unsigned long long a = 0; a < actionshere; a++) 
      {
        // cfr
        assert(row < rows);
        assert(col < curRowSize); 

        tablerows[row][col] = 0.0;
      
        next(row, col, pos, curRowSize);
        // total move probs
        
        tablerows[row][col] = 0.0;

        next(row, col, pos, curRowSize);
        // next cfr
      }
    }
  }
}

void InfosetStore::computeBound(double & sum_RTimm1, double & sum_RTimm2)
{
  for (unsigned int i = 0; i < indexSize; i++) 
  {
    if (indexVals[i] < size) 
    {
      // which player is it?
      unsigned long long key = indexKeys[i]; 
      double & b = (key % 2 == 0 ? sum_RTimm1 : sum_RTimm2); 

      // this is a valid position
      unsigned long long row, col, pos, curRowSize;
      pos = indexVals[i];
      row = pos / rowsize;
      col = pos % rowsize;
      curRowSize = (row < (rows-1) ? rowsize : lastRowSize);

      // read # actions
      unsigned long long actionshere = 0;
      assert(sizeof(actionshere) == sizeof(double)); 
      memcpy(&actionshere, &tablerows[row][col], sizeof(actionshere)); 
      next(row, col, pos, curRowSize);
      
      // read the integer
      unsigned long long lastUpdate = 0;
      double x = tablerows[row][col];
      memcpy(&lastUpdate, &x, sizeof(actionshere)); 
      next(row, col, pos, curRowSize);

      double max = NEGINF;
      for (unsigned long long a = 0; a < actionshere; a++) 
      {
        // cfr
        assert(row < rows);
        assert(col < curRowSize); 

        double cfr = tablerows[row][col]; 
        CHKDBL(cfr);
        if (cfr > max)
          max = cfr; 
      
        next(row, col, pos, curRowSize);
        // total move probs
        next(row, col, pos, curRowSize);
        // next cfr
      }

      assert(max > NEGINF);

      double delta = max; 
      delta = MAX(0.0, delta); 

      b += delta; 
    }
  }

  sum_RTimm1 /= static_cast<double>(iter); 
  sum_RTimm2 /= static_cast<double>(iter); 
}



void InfosetStore::writeBytes(std::ofstream & out, void * addr, unsigned int num)
{
  out.write(reinterpret_cast<const char *>(addr), num); 
}

void InfosetStore::readBytes(std::ifstream & in, void * addr, unsigned int num)  
{
  in.read(reinterpret_cast<char *>(addr), num); 
}

void InfosetStore::dumpToDisk(std::string filename) 
{
  ofstream out(filename.c_str(), ios::out | ios::binary); 
  assert(out.is_open()); 

  assert(sizeof(unsigned long long) == 8); 
  assert(sizeof(double) == 8);

  // some integers
  writeBytes(out, &indexSize, 8);
  writeBytes(out, &size, 8);
  writeBytes(out, &rowsize, 8);
  writeBytes(out, &rows, 8);
  writeBytes(out, &lastRowSize, 8);

  // the index
  for (unsigned long long i = 0; i < indexSize; i++)
  {
    writeBytes(out, indexKeys + i, 8); 
    writeBytes(out, indexVals + i, 8); 
  }

  // the table
  unsigned long long pos = 0, row = 0, col = 0, curRowSize = rowsize; 
  while (pos < size) 
  {
    writeBytes(out, tablerows[row] + col, 8);  
    next(row, col, pos, curRowSize); 
  }

  out.close();
}

void InfosetStore::copy(InfosetStore & dest)
{
  dest.destroy();

  dest.indexSize = indexSize;
  dest.size = size;
  dest.rowsize = rowsize;
  dest.rows = rows;
  dest.lastRowSize = lastRowSize;

  dest.indexKeys = new unsigned long long [indexSize];
  dest.indexVals = new unsigned long long [indexSize];
  for (unsigned long long i = 0; i < indexSize; i++)
  {
    dest.indexKeys[i] = indexKeys[i];
    dest.indexVals[i] = indexVals[i];
  }

  dest.tablerows = new double* [rows];
  assert(dest.tablerows != NULL);
  for (unsigned long long i = 0; i < rows; i++) 
  {
    if (i != (rows-1))
    {
      dest.tablerows[i] = new double[rowsize];
      assert(dest.tablerows[i] != NULL);
    }
    else 
    {
      dest.tablerows[i] = new double[lastRowSize];
      assert(dest.tablerows[i] != NULL);
    }
  }

  unsigned long long pos = 0, row = 0, col = 0, curRowSize = rowsize; 
  while (pos < size) 
  {
    dest.tablerows[row][col] = tablerows[row][col];
    next(row, col, pos, curRowSize); 
  }
}


bool InfosetStore::readFromDisk(std::string filename)
{
  addingInfosets = false; 
  nextInfosetPos = 0; 
  added = 0; 

  ifstream in(filename.c_str(), ios::in | ios::binary); 
  //assert(in.is_open());  
  if (!in.is_open())
    return false; 

  // some integers
  readBytes(in, &indexSize, 8);        
  readBytes(in, &size, 8);        
  readBytes(in, &rowsize, 8);        
  readBytes(in, &rows, 8);        
  readBytes(in, &lastRowSize, 8);        
 
  // the index
  indexKeys = new unsigned long long [indexSize]; 
  indexVals = new unsigned long long [indexSize]; 
  for (unsigned long long i = 0; i < indexSize; i++)
  {
    readBytes(in, indexKeys + i, 8); 
    readBytes(in, indexVals + i, 8); 
  }

  // table rows (allocation)
  tablerows = new double* [rows];
  assert(tablerows != NULL);
  for (unsigned long long i = 0; i < rows; i++) 
  {
    if (i != (rows-1))
    {
      tablerows[i] = new double[rowsize];
      assert(tablerows[i] != NULL);
      for (unsigned long long j = 0; j < rowsize; j++)
        tablerows[i][j] = 0.0;
    }
    else 
    {
      tablerows[i] = new double[lastRowSize];
      assert(tablerows[i] != NULL);
      for (unsigned int j = 0; j < lastRowSize; j++)
        tablerows[i][j] = 0.0;
    }
  }

  // tablerows (read from disk)
  unsigned long long pos = 0, row = 0, col = 0, curRowSize = rowsize; 
  while (pos < size) 
  {
    readBytes(in, tablerows[row] + col, 8);  
    next(row, col, pos, curRowSize); 
  }

  in.close();

  return true;
}

// replace one of the players strategies with one loaded from a 
// different file
void InfosetStore::importValues(int player, string filename)
{
  ifstream in(filename.c_str(), ios::in | ios::binary);

  unsigned long long oIndexSize = 0, osize = 0, orowsize = 0, orows = 0, olastRowSize = 0;
  
  readBytes(in, &oIndexSize, 8);        
  readBytes(in, &osize, 8);        
  readBytes(in, &orowsize, 8);        
  readBytes(in, &orows, 8);        
  readBytes(in, &olastRowSize, 8);        

  assert(oIndexSize == indexSize);
  assert(osize == size);
  assert(orowsize == rowsize);
  assert(orows == rows);
  assert(olastRowSize == lastRowSize);

  unsigned long long maskresult = player - 1; 

  for (unsigned int i = 0; i < oIndexSize; i++)
  {
    Infoset is;

    // next index element
    streampos sp = (5 + i*2); sp = sp*8;
    in.seekg(sp);

    unsigned long long key = 0, val = 0;
    readBytes(in, &key, 8);
    readBytes(in, &val, 8);

    if ((key & 1ULL) == maskresult && val < size)
    {
      streampos fp = 5;
      fp += oIndexSize*2;
      fp += val;
      fp = fp*8;

      in.seekg(fp);

      unsigned long long actionshere = 0;
      unsigned long long lastUpdate = 0;
      
      readBytes(in, &actionshere, 8);
      readBytes(in, &lastUpdate, 8);

      is.actionshere = static_cast<int>(actionshere);
      is.lastUpdate = lastUpdate;

      assert(actionshere <= BLUFFBID);

      for (unsigned long long a = 0; a < actionshere; a++)
      {
        double * cfrptr = is.cfr;
        double * tmpptr = is.totalMoveProbs;
        readBytes(in, cfrptr + a, 8);
        readBytes(in, tmpptr + a, 8);
      }

      put(key, is, static_cast<int>(actionshere), 0); 
    }
  }
}

//»

//cfr.cpp //«

#include <cassert>
#include <iostream>
#include <cstdlib>

#include "bluff.h"

using namespace std; 

static unsigned long long nextReport = 1;
static unsigned long long reportMult = 2;

// This is Vanilla CFR. See my thesis, Algorithm 1 (Section 2.2.2)
double cfr(GameState & gs, int player, int depth, unsigned long long bidseq, 
           double reach1, double reach2, double chanceReach, int phase, int updatePlayer)
{
  // at terminal node?
  if (terminal(gs))
  {
    return payoff(gs, updatePlayer);
  }

  nodesTouched++;

  // Chances nodes at the top of the tree. If p1roll and p2roll not set, we're at a chance node
  if (gs.p1roll == 0) 
  {
    double EV = 0.0; 

    for (int i = 1; i <= numChanceOutcomes(1); i++) 
    {
      GameState ngs = gs; 
      ngs.p1roll = i; 
      double newChanceReach = getChanceProb(1,i)*chanceReach;

      EV += getChanceProb(1,i)*cfr(ngs, player, depth+1, bidseq, reach1, reach2, newChanceReach, phase, updatePlayer); 
    }

    return EV;
  }
  else if (gs.p2roll == 0)
  {
    double EV = 0.0; 

    for (int i = 1; i <= numChanceOutcomes(2); i++)
    {
      GameState ngs = gs; 
      ngs.p2roll = i; 
      double newChanceReach = getChanceProb(2,i)*chanceReach;

      EV += getChanceProb(2,i)*cfr(ngs, player, depth+1, bidseq, reach1, reach2, newChanceReach, phase, updatePlayer); 
    }

    return EV;
  }

  // Check for cuts. This is the pruning optimization described in Section 2.2.2 of my thesis. 
  if (phase == 1 && (   (player == 1 && updatePlayer == 1 && reach2 <= 0.0)
                     || (player == 2 && updatePlayer == 2 && reach1 <= 0.0)))
  {
    phase = 2; 
  }

  if (phase == 2 && (   (player == 1 && updatePlayer == 1 && reach1 <= 0.0)
                     || (player == 2 && updatePlayer == 2 && reach2 <= 0.0)))
  {
    return 0.0;
  }

  // declare the variables 
  Infoset is;
  unsigned long long infosetkey = 0;
  double stratEV = 0.0;
  int action = -1;

  int maxBid = (gs.curbid == 0 ? BLUFFBID-1 : BLUFFBID);
  int actionshere = maxBid - gs.curbid; 

  assert(actionshere > 0);
  double moveEVs[actionshere]; 
  for (int i = 0; i < actionshere; i++) 
    moveEVs[i] = 0.0;

  // get the info set (also set is.curMoveProbs using regret matching)
  getInfoset(gs, player, bidseq, is, infosetkey, actionshere); 

  // iterate over the actions
  for (int i = gs.curbid+1; i <= maxBid; i++) 
  {
    // there is a valid action here
    action++;
    assert(action < actionshere);

    unsigned long long newbidseq = bidseq;
    double moveProb = is.curMoveProbs[action]; 
    double newreach1 = (player == 1 ? moveProb*reach1 : reach1); 
    double newreach2 = (player == 2 ? moveProb*reach2 : reach2); 

    GameState ngs = gs; 
    ngs.prevbid = gs.curbid;
    ngs.curbid = i; 
    ngs.callingPlayer = player;
    newbidseq |= (1ULL << (BLUFFBID-i)); 
    
    double payoff = cfr(ngs, 3-player, depth+1, newbidseq, newreach1, newreach2, chanceReach, phase, updatePlayer); 
   
    moveEVs[action] = payoff; 
    stratEV += moveProb*payoff; 
  }

  // post-traversals: update the infoset
  double myreach = (player == 1 ? reach1 : reach2); 
  double oppreach = (player == 1 ? reach2 : reach1); 

  if (phase == 1 && player == updatePlayer) // regrets
  {
    for (int a = 0; a < actionshere; a++)
    {
      // Multiplying by chanceReach here is important in games that have non-uniform chance outcome 
      // distributions. In Bluff(1,1) it is actually not needed, but in general it is needed (e.g. 
      // in Bluff(2,1)). 
      is.cfr[a] += (chanceReach*oppreach)*(moveEVs[a] - stratEV); 
    }
  }

  if (phase >= 1 && player == updatePlayer) // av. strat
  {
    for (int a = 0; a < actionshere; a++)
    {
      is.totalMoveProbs[a] += myreach*is.curMoveProbs[a]; 
    }
  }

  // save the infoset back to the store if needed
  if (player == updatePlayer) {
    iss.put(infosetkey, is, actionshere, 0); 
  }

  return stratEV;
}

int main(int argc, char ** argv)
{
  unsigned long long maxIters = 0; 
  init();

  if (argc < 2)
  {
    initInfosets();
    exit(-1);
  }
  else 
  { 
    string filename = argv[1];
    cout << "Reading the infosets from " << filename << "..." << endl;
    iss.readFromDisk(filename);

    if (argc >= 3)
      maxIters = to_ull(argv[2]);
  }  
  
  // get the iteration
  string filename = argv[1];
  vector<string> parts; 
  split(parts, filename, '.'); 
  if (parts.size() != 3 || parts[1] == "initial")
    iter = 1; 
  else
    iter = to_ull(parts[1]); 
  cout << "Set iteration to " << iter << endl;
  iter = MAX(1,iter);

  unsigned long long bidseq = 0; 
    
  StopWatch stopwatch;
  double totaltime = 0; 

  cout << "Starting CFR iterations" << endl;

  for (; true; iter++)
  {
    GameState gs1; 
    bidseq = 0; 
    double ev1 = cfr(gs1, 1, 0, bidseq, 1.0, 1.0, 1.0, 1, 1);
    
    GameState gs2; 
    bidseq = 0; 
    double ev2 = cfr(gs2, 1, 0, bidseq, 1.0, 1.0, 1.0, 1, 2);

    if (iter % 10 == 0)
    { 
      cout << "."; cout.flush(); 
      totaltime += stopwatch.stop();
      stopwatch.reset();
    }

    if (iter == 1 || nodesTouched >= ntNextReport)
    {
      cout << endl;

      cout << "total time: " << totaltime << " seconds." << endl; 
      cout << "Done iteration " << iter << endl;

      cout << "ev1 = " << ev1 << ", ev2 = " << ev2 << endl;

      // This bound is the right-hand side of Theorem 3 from the original CFR paper.
      // \sum_{I \in \II_i} R_{i,imm}^{T,+}(I)

      cout << "Computing bounds... "; cout.flush(); 
      double b1 = 0.0, b2 = 0.0;
      iss.computeBound(b1, b2); 
      cout << " b1 = " << b1 << ", b2 = " << b2 << ", bound = " << (2.0*MAX(b1,b2)) << endl;

      double conv = 0.0;
      double p1value = 0.0;
      double p2value = 0.0;
      conv = computeBestResponses(false, p1value, p2value);

      report("cfr.bluff11.report.txt", totaltime, (2.0*MAX(b1,b2)), conv);
      //dumpInfosets("iss");

      cout << endl;

      nextCheckpoint += cpWidth;
      nextReport *= reportMult;
      ntNextReport *= ntMultiplier;

      stopwatch.reset(); 
    }

    if (iter == maxIters) break;
  }
}
//»

»*/

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
	this.#tend = new Date().getTime();
//  return ((tend.time*1000 + tend.millitm) - (tstart.time*1000 + tstart.millitm) ) / 1000.0;
	return (this.#tend - this.#tstart) / 1000;
  }
};//»

function _InfosetStore() {//«

//infosetstore
//#define ROWS 100
const ROWS = 100

//using namespace std;

//static unsigned long long totalLookups = 0; 
let totalLookups = 0; 

//static unsigned long long totalMisses = 0; 
let totalMisses = 0; 


//class InfosetStore {
return class {

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
//  unsigned long long size; 
#size;
//  unsigned long long rowsize;
#rowsize;
//  unsigned long long rows;
#rows;

// last row is the leftover (smaller)
//unsigned long long lastRowSize;
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
//  unsigned long long row, col, pos, curRowSize;
  let row, col, pos, curRowSize;

//  pos = getPosFromIndex(infoset_key);  // uses a hash table
  pos = getPosFromIndex1(infoset_key);  // uses a hash table
  if (pos >= size) return false;

  row = pos / rowsize;
  col = pos % rowsize;
  curRowSize = (row < (rows-1) ? rowsize : lastRowSize);

  // get the number of moves
  assert(row < rows); assert(col < curRowSize); assert(pos < size); 
//  unsigned long long x; 
  let x; 
//  double y = tablerows[row][col];
  let y = tablerows[row][col];
  assert(sizeof(x) == sizeof(double));
  memcpy(&x, &y, sizeof(x)); 
  infoset.actionshere = static_cast<int>(x); 
  assert(infoset.actionshere > 0);
  this.#next(row, col, pos, curRowSize);
  
  // get the lastupdate
  assert(row < rows); assert(col < curRowSize);  assert(pos < size); 
  y = tablerows[row][col];
  assert(sizeof(x) == sizeof(double));
  memcpy(&x, &y, sizeof(x)); 
  infoset.lastUpdate = x; 
  this.#next(row, col, pos, curRowSize);

  for (let i = 0, m = firstmove; i < moves; i++,m++) {
//  for (int i = 0, m = firstmove; i < moves; i++,m++) {
    assert(row < rows);
    assert(col < curRowSize); 
    assert(pos < size); 
    infoset.cfr[m] = tablerows[row][col];

    this.#next(row, col, pos, curRowSize);

    assert(row < rows);
    assert(col < curRowSize); 
    assert(pos < size); 
    infoset.totalMoveProbs[m] = tablerows[row][col];

    this.#next(row, col, pos, curRowSize); 
  }

  // now do the usual regret matching to get the curMoveProbs

//  double totPosReg = 0.0;
  let totPosReg = 0.0;
//  bool all_negative = true;
  let all_negative = true;

  for (let i = 0, m = firstmove; i < moves; i++, m++) {
//  for (int i = 0, m = firstmove; i < moves; i++, m++) {
//    int movenum = m;
    let movenum = m;
//	double cfr = infoset.cfr[movenum];
    let cfr = infoset.cfr[movenum];
//	CHKDBL(cfr);

    if (cfr > 0.0) {
      totPosReg = totPosReg + cfr;
      all_negative = false;
    }
  }

//  double probSum = 0.0;
  let probSum = 0.0;

  for (let i = 0, m = firstmove; i < moves; i++, m++) {
//  for (int i = 0, m = firstmove; i < moves; i++, m++) {
    let movenum = m;
//	int movenum = m;

    if (!all_negative) {
      if (infoset.cfr[movenum] <= 0.0) {
        infoset.curMoveProbs[movenum] = 0.0;
      }
      else {
        assert(totPosReg >= 0.0);
        if (totPosReg > 0.0)  // regret-matching
          infoset.curMoveProbs[movenum] = infoset.cfr[movenum] / totPosReg;

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
//  unsigned long long row, col, pos, curRowSize;
  let row, col, pos, curRowSize;

  assert(moves > 0);
//  bool newinfoset = false; 
  let newinfoset = false; 

//  unsigned long long hashIndex = 0;
  let hashIndex = 0;

//unsigned long long thepos = getPosFromIndex(infoset_key, hashIndex);  
//unsigned long long thepos = getPosFromIndex2(infoset_key, hashIndex);  
  let thepos = getPosFromIndex2(infoset_key, hashIndex);  
  if (addingInfosets && thepos >= size) {
    newinfoset = true; 

    // new infoset to be added at the end
    assert(nextInfosetPos < size); 

    // only add it if it's a new info set
    pos = nextInfosetPos;
    row = nextInfosetPos / rowsize;
    col = nextInfosetPos % rowsize;
    curRowSize = (row < (rows-1) ? rowsize : lastRowSize);
    
    //index[infoset_key] = pos;
    assert(pos < size); 
    indexKeys[hashIndex] = infoset_key;
    indexVals[hashIndex] = pos;

    //log("Adding infosetkey: " << infoset_key); 
  }
  else {
    // we've seen this one before, load it
    newinfoset = false; 

    //pos = index[infoset_key];
    //pos = indexVals[hashIndex]; 
    assert(thepos < size); 
    pos = thepos; 
    row = pos / rowsize;
    col = pos % rowsize;
    curRowSize = (row < (rows-1) ? rowsize : lastRowSize);
  }
  
  // store the number of moves at this infoset
  assert(row < rows);
  assert(col < curRowSize); 
  assert(pos < size); 
//unsigned long long x = moves;
  let x = moves;
//double y; 
  let y; 
  assert(sizeof(x) == sizeof(double));
  memcpy(&y, &x, sizeof(x));
  tablerows[row][col] = y; 
  this.#next(row, col, pos, curRowSize);

  // store the last update iter of this infoset
  assert(row < rows);
  assert(col < curRowSize); 
  assert(pos < size); 
  x = infoset.lastUpdate;
  assert(sizeof(x) == sizeof(double));
  memcpy(&y, &x, sizeof(x));
  tablerows[row][col] = y; 
  this.#next(row, col, pos, curRowSize);

  // moves are from 1 to moves, so write them in order. 
  // first, regret, then avg. strat
  for (let i = 0, m = firstmove; i < moves; i++, m++) { 
//  for (int i = 0, m = firstmove; i < moves; i++, m++) { 
    //log("pos = " << pos << ", row = " << row);
    if (row >= rows) {
      log("iss stats: " << iss.getStats());
    }

    assert(row < rows);
    assert(col < curRowSize); 
    assert(pos < size); 
    CHKDBL(infoset.cfr[m]); 
    tablerows[row][col] = infoset.cfr[m];

    this.#next(row, col, pos, curRowSize);

    assert(row < rows);
    assert(col < curRowSize); 
    assert(pos < size); 
    tablerows[row][col] = infoset.totalMoveProbs[m];

    this.#next(row, col, pos, curRowSize); 
    
  }

  if (newinfoset && addingInfosets) {
    nextInfosetPos = pos;
    added++;
  }
}//»
#next(row, col, pos, curRowSize) {//«
//void next(unsigned long long & row, unsigned long long & col, unsigned long long & pos, unsigned long long & curRowSize); 
  pos++;
  col++; 
  
  if (col >= curRowSize) {
    col = 0; 
    row++;
    curRowSize = (row < (rows-1) ? rowsize : lastRowSize);
  }
}//»

//public:

constructor(){//«
//  InfosetStore(){
	this.tablerows = null;
}//»

destroy() {//«
//void destroy() {
	if (tablerows != NULL)
	{
	  delete [] indexKeys; 
	  delete [] indexVals;

	  for (unsigned int i = 0; i < rows; i++) 
		delete [] tablerows[i];

	  delete [] tablerows;
	}

	tablerows = NULL;
}//»

/*«~InfosetStore()
~InfosetStore() {
	destroy(); 
}
»*/

getSize() { //«
//  unsigned long long getSize() { return size; }
	return size; 
}//»

  // returns the position into the large table or indexSize if not found
  // hashIndex is set to the index of the hash table where this key would go

getPosFromIndex1(infoset_key) {//«
// use this one if you don't care about the hashIndex
// unsigned long long getPosFromIndex(unsigned long long infoset_key);
//  unsigned long long hi = 0;
  let hi = 0;
  return this.getPosFromIndex2(infoset_key, hi); 
}//»
getPosFromIndex2(infoset_key, hashIndex) {//«
//  unsigned long long getPosFromIndex(unsigned long long infoset_key, unsigned long long & hashIndex); 
//  unsigned long long start = infoset_key % indexSize; 
  let start = infoset_key % indexSize; 
//  unsigned long long misses = 0; 
  let misses = 0; 

  for (let i = start; misses < indexSize; misses++) {
//  for (unsigned long long i = start; misses < indexSize; misses++) {
    if (indexKeys[i] == infoset_key && indexVals[i] < size)  {
      // cache hit 
      totalLookups++; 
      totalMisses += misses;
      hashIndex = i; 
      return indexVals[i]; 
    }
    else if (indexVals[i] >= size){// index keys can be >= size since they're arbitrary, but not values!
      totalLookups++; 
      totalMisses += misses;
      hashIndex = i;
      return size; 
    }

    i = i+1; 
    if (i >= indexSize)
      i = 0; 
  }

  // should be large enough to hold everything
  assert(false); 
  return 0;
}//»

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

  let i = 0; 
  while (lastRowSize > rowsize) {// will sometimes happen when _size is small 
    i++;
    this.#rows = ROWS-i;
    this.#rowsize = size / (rows-1); 
    this.#lastRowSize = size - rowsize*(rows-1);
  }

  assert(i >= 0 && i <= 99); 

  log("IS: stats " << getStats());
  log("IS: allocating memory.. ");

  // allocate the index
//indexKeys = new unsigned long long [indexSize];
  this.#indexKeys = new Array(this.#indexSize);
//indexVals = new unsigned long long [indexSize];
  this.#indexVals = new Array(this.#indexSize);
  for (let i = 0; i < this.#indexSize; i++) 
//for (unsigned long long i = 0; i < indexSize; i++) 
	this.#indexKeys[i] = this.#indexVals[i] = size;   // used to indicate that no entry is present

  // allocate the rows 
// To avoid large contiguous portions of memory, store as rows of bitsets
// double ** tablerows;
//  this.#tablerows = new double* [this.#rows];
	this.#tablerows = new Array(this.#rows);
  assert(tablerows != NULL);
//  for (unsigned long long i = 0; i < rows; i++) {
	for (let i = 0; i < this.#rows; i++) {
		if (i != (this.#rows-1)) {
//			tablerows[i] = new double[rowsize];
			this.#tablerows[i] = new Array(this.#rowsize);
			assert(tablerows[i] != NULL);
			for (let j = 0; j < this.#rowsize; j++) {
//			for (unsigned long long j = 0; j < rowsize; j++) {
		        this.#tablerows[i][j] = 0.0;
			}
    	}
		else {
//			tablerows[i] = new double[lastRowSize];
			this.#tablerows[i] = new Array(lastRowSize);
			assert(tablerows[i] != NULL);
			for (let j = 0; j < this.#lastRowSize; j++){
//			for (unsigned int j = 0; j < lastRowSize; j++){
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

getStats(){//«
//  std::string getStats();
//  string str; 
	let str="";
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
	str += (this.#size + " "); 
	str += (this.#rowsize + " "); 
	str += (this.#rows + " "); 
	str += (this.#lastRowSize + " "); 
	str += (this.#added + " "); 
	str += (this.#nextInfosetPos + " "); 
	str += (totalLookups + " "); 
	str += (totalMisses + " "); 

//  double avglookups =   static_cast<double>(totalLookups + totalMisses) / static_cast<double>(totalLookups); 
	let avglookups = (totalLookups + totalMisses) / (totalLookups); 

//  double percent_full = static_cast<double>(nextInfosetPos) /  static_cast<double>(size) * 100.0;  
	let percent_full = (this.#nextInfosetPos) /  (this.#size) * 100.0;  

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
readBytes(in, addr,  num) {//«
//  void readBytes(std::ifstream & in, void * addr, unsigned int num); 
  in.read(reinterpret_cast<char *>(addr), num); 
}//»
dumpToDisk(filename) {//«
//  void dumpToDisk(std::string filename);
  ofstream out(filename.c_str(), ios::out | ios::binary); 
  assert(out.is_open()); 

  assert(sizeof(unsigned long long) == 8); 
  assert(sizeof(double) == 8);

  // some integers
  writeBytes(out, &indexSize, 8);
  writeBytes(out, &size, 8);
  writeBytes(out, &rowsize, 8);
  writeBytes(out, &rows, 8);
  writeBytes(out, &lastRowSize, 8);

  // the index
  for (let i = 0; i < this.#indexSize; i++) {
//  for (unsigned long long i = 0; i < indexSize; i++) {
    writeBytes(out, indexKeys + i, 8); 
    writeBytes(out, indexVals + i, 8); 
  }

  // the table
//  unsigned long long pos = 0, row = 0, col = 0, curRowSize = rowsize; 
  let pos = 0, row = 0, col = 0, curRowSize = rowsize; 
  while (pos < size) {
    this.writeBytes(out, tablerows[row] + col, 8);  
    this.#next(row, col, pos, curRowSize); 
  }

  out.close();
}//»
readFromDisk(filename) {//«
//  bool readFromDisk(std::string filename);
  this.#addingInfosets = false; 
  this.#nextInfosetPos = 0; 
  this.#added = 0; 

  ifstream in(filename.c_str(), ios::in | ios::binary); 
  //assert(in.is_open());  
  if (!in.is_open())
    return false; 

  // some integers
  this.readBytes(in, &indexSize, 8);        
  this.readBytes(in, &size, 8);        
  this.readBytes(in, &rowsize, 8);        
  this.readBytes(in, &rows, 8);        
  this.readBytes(in, &lastRowSize, 8);        
 
  // the index
  this.#indexKeys = new unsigned long long [indexSize]; 
  this.#indexVals = new unsigned long long [indexSize]; 
  for (let i = 0; i < indexSize; i++) {
//  for (unsigned long long i = 0; i < indexSize; i++) {
    this.readBytes(in, indexKeys + i, 8); 
    this.readBytes(in, indexVals + i, 8); 
  }

  // table rows (allocation)
//  tablerows = new double* [rows];
  this.#tablerows = new Array(this.#rows);
  assert(tablerows != NULL);
//for (unsigned long long i = 0; i < rows; i++) {
  for (let i = 0; i < rows; i++) {
    if (i != (rows-1)) {
      this.#tablerows[i] = new double[rowsize];
      assert(tablerows[i] != NULL);
      for (let j = 0; j < this.#rowsize; j++) {
//      for (unsigned long long j = 0; j < rowsize; j++)
        this.#tablerows[i][j] = 0.0;
	  }
    }
    else {
//      tablerows[i] = new double[lastRowSize];
      this.#tablerows[i] = new Array(this.#lastRowSize);
      assert(tablerows[i] != NULL);
      for (let j = 0; j < this.#lastRowSize; j++){
//      for (unsigned int j = 0; j < lastRowSize; j++){
        this.#tablerows[i][j] = 0.0;
      }
    }
  }

  // tablerows (read from disk)
//  unsigned long long pos = 0, row = 0, col = 0, curRowSize = rowsize; 
  let pos = 0, row = 0, col = 0, curRowSize = rowsize; 
  while (pos < size) {
    this.readBytes(in, this.#tablerows[row] + col, 8);  
    this.#next(row, col, pos, curRowSize); 
  }

  in.close();

  return true;
}//»
contains(infoset_key) {//«
//  bool contains(unsigned long long infoset_key);
  assert(infoset_key < indexSize); 
//  unsigned long long pos = getPosFromIndex(infoset_key); 
//  unsigned long long pos = getPosFromIndex1(infoset_key); 
  let pos = getPosFromIndex1(infoset_key); 
  return (pos >= size ? false : true);
}//»
printValues(){//«
//  void printValues(); 
//  for (unsigned int i = 0; i < indexSize; i++) {
  for (let i = 0; i < indexSize; i++) {
    if (this.#indexVals[i] < size) {
      // this is a valid position
//      unsigned long long row, col, pos, curRowSize;
      let row, col, pos, curRowSize;
      pos = indexVals[i];
      row = pos / rowsize;
      col = pos % rowsize;
      curRowSize = (row < (rows-1) ? rowsize : lastRowSize);

      log("infosetkey = " , indexKeys[i]); 
      log(", infosetkey_str = " , infosetkey_to_string(indexKeys[i]));

      // read # actions
//      unsigned long long actionshere = 0;
      let actionshere = 0;
      assert(sizeof(actionshere) == sizeof(double)); 
      memcpy(&actionshere, &tablerows[row][col], sizeof(actionshere)); 
      this.#next(row, col, pos, curRowSize);
      
      // read the integer
//      unsigned long long lastUpdate = 0;
      let lastUpdate = 0;
//      double x = tablerows[row][col];
      let x = this.#tablerows[row][col];
      memcpy(&lastUpdate, &x, sizeof(actionshere)); 
      this.#next(row, col, pos, curRowSize);

      log(", actions = " , actionshere , ", lastUpdate = " , lastUpdate);

//      for (unsigned long long a = 0; a < actionshere; a++){
      for (let a = 0; a < actionshere; a++){
        // cfr
        assert(row < rows);
        assert(col < curRowSize); 
        log("  cfr[" , a , "]=" , tablerows[row][col]); 
      
        this.#next(row, col, pos, curRowSize);
        // total move probs
        log("  tmp[" , a , "]=" , tablerows[row][col]); 
//      cout << endl;
        this.#next(row, col, pos, curRowSize);
        // next cfr
      }

//      cout << endl;
    }
  }
}//»
computeBound(sum_RTimm1, sum_RTimm2){//«
//  void computeBound(double & sum_RTimm1, double & sum_RTimm2); 
  for (let i = 0; i < this.#indexSize; i++) {
//  for (unsigned int i = 0; i < indexSize; i++) {
    if (indexVals[i] < size){
      // which player is it?
//      unsigned long long key = indexKeys[i]; 
      let key = indexKeys[i]; 
      double & b = (key % 2 == 0 ? sum_RTimm1 : sum_RTimm2); 

      // this is a valid position
//      unsigned long long row, col, pos, curRowSize;
      let row, col, pos, curRowSize;
      pos = indexVals[i];
      row = pos / rowsize;
      col = pos % rowsize;
      curRowSize = (row < (rows-1) ? rowsize : lastRowSize);

      // read # actions
//      unsigned long long actionshere = 0;
      let actionshere = 0;
      assert(sizeof(actionshere) == sizeof(double)); 
      memcpy(&actionshere, &tablerows[row][col], sizeof(actionshere)); 
      this.#next(row, col, pos, curRowSize);
      
      // read the integer
//      unsigned long long lastUpdate = 0;
      let lastUpdate = 0;
//      double x = tablerows[row][col];
      let x = tablerows[row][col];
      memcpy(&lastUpdate, &x, sizeof(actionshere)); 
      this.#next(row, col, pos, curRowSize);

//      double max = NEGINF;
      let max = -Infinity;
//      for (unsigned long long a = 0; a < actionshere; a++) {
      for (let a = 0; a < actionshere; a++) {
        // cfr
        assert(row < rows);
        assert(col < curRowSize); 

//        double cfr = tablerows[row][col]; 
        let cfr = this.#tablerows[row][col]; 
        CHKDBL(cfr);
        if (cfr > max)
          max = cfr; 
      
        this.#next(row, col, pos, curRowSize);
        // total move probs
        this.#next(row, col, pos, curRowSize);
        // next cfr
      }

      assert(max > NEGINF);

//      double delta = max; 
      let delta = max; 
//    delta = MAX(0.0, delta); 
      delta = Math.max(0.0, delta); 

      b += delta; 
    }
  }

  sum_RTimm1 /= static_cast<double>(iter); 
  sum_RTimm2 /= static_cast<double>(iter); 
}//»
  // used to save memory when evaluation strategies from 2 diff strat files
importValues(player, filename) {//«
//  void importValues(int player, std::string filename);
  ifstream in(filename.c_str(), ios::in | ios::binary);

//  unsigned long long oIndexSize = 0, osize = 0, orowsize = 0, orows = 0, olastRowSize = 0;
  let oIndexSize = 0, osize = 0, orowsize = 0, orows = 0, olastRowSize = 0;
  
  this.readBytes(in, &oIndexSize, 8);        
  this.readBytes(in, &osize, 8);        
  this.readBytes(in, &orowsize, 8);        
  this.readBytes(in, &orows, 8);        
  this.readBytes(in, &olastRowSize, 8);        

  assert(oIndexSize == indexSize);
  assert(osize == size);
  assert(orowsize == rowsize);
  assert(orows == rows);
  assert(olastRowSize == lastRowSize);

//  unsigned long long maskresult = player - 1; 
  let maskresult = player - 1; 

  for (let i = 0; i < oIndexSize; i++) {
//for (unsigned int i = 0; i < oIndexSize; i++) {
    Infoset is;

    // next index element
    streampos sp = (5 + i*2); sp = sp*8;
    in.seekg(sp);

//    unsigned long long key = 0, val = 0;
    let key = 0, val = 0;
    this.readBytes(in, &key, 8);
    this.readBytes(in, &val, 8);

    if ((key & 1ULL) == maskresult && val < size) {
      streampos fp = 5;
      fp += oIndexSize*2;
      fp += val;
      fp = fp*8;

      in.seekg(fp);

//    unsigned long long actionshere = 0;
      let actionshere = 0;
//    unsigned long long lastUpdate = 0;
      let lastUpdate = 0;
      
      this.readBytes(in, &actionshere, 8);
      this.readBytes(in, &lastUpdate, 8);

//    is.actionshere = static_cast<int>(actionshere);
      is.actionshere = actionshere;
      is.lastUpdate = lastUpdate;

      assert(actionshere <= BLUFFBID);

//    for (unsigned long long a = 0; a < actionshere; a++) {
      for (let a = 0; a < actionshere; a++) {
        double * cfrptr = is.cfr;
        double * tmpptr = is.totalMoveProbs;
        this.readBytes(in, cfrptr + a, 8);
        this.readBytes(in, tmpptr + a, 8);
      }

//    put(key, is, static_cast<int>(actionshere), 0); 
      this.put(key, is, actionshere, 0); 
    }
  }
}//»
clear() {//«
//void clear(); 

//  for (unsigned int i = 0; i < indexSize; i++) {
  for (let i = 0; i < indexSize; i++) {
    if (this.#indexVals[i] < size) {
      // this is a valid position
//      unsigned long long row, col, pos, curRowSize;
      let row, col, pos, curRowSize;
      pos = this.#indexVals[i];
      row = pos / this.#rowsize;
      col = pos % this.#rowsize;
      curRowSize = (row < (rows-1) ? this.#rowsize : this.#lastRowSize);

      // read # actions
//    unsigned long long actionshere = 0;
      let actionshere = 0;
      assert(sizeof(actionshere) == sizeof(double)); 
      memcpy(&actionshere, &tablerows[row][col], sizeof(actionshere)); 
      this.#next(row, col, pos, curRowSize);
      
      // read the integer
//    unsigned long long lastUpdate = 0;
      let lastUpdate = 0;
//    double x = tablerows[row][col];
      let x = this.#tablerows[row][col];
      memcpy(&lastUpdate, &x, sizeof(actionshere)); 
      this.#tablerows[row][col] = 0.0;
      this.#next(row, col, pos, curRowSize);

//      for (unsigned long long a = 0; a < actionshere; a++) {
      for (let a = 0; a < actionshere; a++) {
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
//  void copy(InfosetStore & dest);
  dest.destroy();

  dest.indexSize = this.#indexSize;
  dest.size = this.#size;
  dest.rowsize = this.#rowsize;
  dest.rows = this.#rows;
  dest.lastRowSize = this.#lastRowSize;

//  dest.indexKeys = new unsigned long long [indexSize];
  dest.indexKeys = new Array(this.#indexSize);
// dest.indexVals = new unsigned long long [indexSize];
  dest.indexVals = new Array(this.#indexSize);
//  for (unsigned long long i = 0; i < indexSize; i++) {
  for (let i = 0; i < this.#indexSize; i++) {
    dest.indexKeys[i] = this.#indexKeys[i];
    dest.indexVals[i] = this.#indexVals[i];
  }

//  dest.tablerows = new double* [rows];
  dest.tablerows = new Array(this.#rows);
  assert(dest.tablerows != NULL);
//  for (unsigned long long i = 0; i < rows; i++) {
  for (let i = 0; i < this.#rows; i++) {
    if (i != (this.#rows-1)) {
//    dest.tablerows[i] = new double[rowsize];
      dest.tablerows[i] = new Array(this.#rowsize);
      assert(dest.tablerows[i] != NULL);
    }
    else {
//    dest.tablerows[i] = new double[lastRowSize];
      dest.tablerows[i] = new Array(lastRowSize);
      assert(dest.tablerows[i] != NULL);
    }
  }

//  unsigned long long pos = 0, row = 0, col = 0, curRowSize = rowsize; 
  let pos = 0, row = 0, col = 0, curRowSize = rowsize; 
  while (pos < this.#size) {
    dest.tablerows[row][col] = this.#tablerows[row][col];
    next(row, col, pos, curRowSize); 
  }
}//»

};

}//»

const InfosetStore = _InfosetStore();

function Bluff(){//«

const P1DICE = 1;
const P2DICE = 1;
const DIEFACES = 6;

//#define BLUFFBID (((P1DICE+P2DICE)*DIEFACES)+1)
const BLUFFBID = (((P1DICE+P2DICE)*DIEFACES)+1);

//#define LOC(b,r,c)  b[r*3 + c]

//using namespace std;

// global variables
//InfosetStore iss;
const iss = new InfosetStore();
//string filepref = "scratch/";
const filepref = "scratch/";
//unsigned long long iter;
let iter;
//int iscWidth = 0;
let iscWidth = 0;
//double cpWidth = 10.0;
let cpWidth = 10.0;
//double nextCheckpoint = cpWidth;
let nextCheckpoint = cpWidth;
//unsigned long long nodesTouched = 0;
let nodesTouched = 0;
//unsigned long long ntNextReport = 1000000;  // nodes touched base timing
let ntNextReport = 1000000;
//unsigned long long ntMultiplier = 2;  // nodes touched base timing
let ntMultiplier = 2;

// key is roll, value is # of time it shows up. Used only when determining chance outcomes
//map<int,int> outcomes;
const outcomes = {};

// probability of this chance move. indexed as 0-5 or 0-20
// note: CO/co stand for "chance outcome"
//static int numChanceOutcomes1 = 0;
let numChanceOutcomes1 = 0;
//static int numChanceOutcomes2 = 0;
let numChanceOutcomes2 = 0;
//static double * chanceProbs1 = NULL;
let chanceProbs1 = null;
//static double * chanceProbs2 = NULL;
let chanceProbs2 = null;
//static int * chanceOutcomes1 = NULL;
let chanceOutcomes1 = null;
//static int * chanceOutcomes2 = NULL;
let chanceOutcomes2 = null;
//static int * bids = NULL;
let bid = null;
//static StopWatch stopwatch;
const stopwatch= new StopWatch();

getChanceProb(player, outcome){//«
//double getChanceProb(int player, int outcome){
  // outcome >= 1, so must subtract 1 from it
  int co = (player == 1 ? numChanceOutcomes1 : numChanceOutcomes2);
  assert(outcome-1 >= 0 && outcome-1 < co);
  double * cp = (player == 1 ? chanceProbs1 : chanceProbs2);
  return cp[outcome-1];
}//»

numChanceOutcomes(player){//«
//int numChanceOutcomes(int player){
  return (player == 1 ? numChanceOutcomes1 : numChanceOutcomes2);
}//»

unrankco(i, roll, layer){//«
//void unrankco(int i, int * roll, int player){
  int num = 0;
  int * chanceOutcomes = (player == 1 ? chanceOutcomes1 : chanceOutcomes2);
  num = chanceOutcomes[i];

  assert(num > 0);

  int numDice = (player == 1 ? P1DICE : P2DICE);

  for (int j = numDice-1; j >= 0; j--)
  {
    roll[j] = num % 10;
    num /= 10;
  }
}//»

initBids(){//«
//void initBids(){
  bids = new int[BLUFFBID-1];
  int nextWildDice = 1;
  int idx = 0;
  for (int dice = 1; dice <= P1DICE + P2DICE; dice++)
  {
    for (int face = 1; face <= DIEFACES-1; face++)
    {
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

getInfosetKey(gs, player, bidseq){//«
//unsigned long long getInfosetKey(GameState & gs, int player, unsigned long long bidseq){
  unsigned long long infosetkey = bidseq;
  infosetkey <<= iscWidth;
  if (player == 1)
  {
    infosetkey |= gs.p1roll;
    infosetkey <<= 1;
  }
  else if (player == 2)
  {
    infosetkey |= gs.p2roll;
    infosetkey <<= 1;
    infosetkey |= 1;
  }

  return infosetkey;
}//»

getInfoset(gs, player, bidseq, is, infosetkey, actionshere){//«
//void getInfoset(GameState & gs, int player, unsigned long long bidseq, Infoset & is, unsigned long long & infosetkey, int actionshere){
  infosetkey = getInfosetKey(gs, player, bidseq);
  bool ret = iss.get(infosetkey, is, actionshere, 0);
  assert(ret);
}//»

ceiling_log2(val){//«
//int ceiling_log2(int val){
  int exp = 1, num = 2;
  do {
    if (num > val) { return exp; }
    num *= 2;
    exp++;
  }
  while (true);
}//»

intpow(x, y){//«
//int intpow(int x, int y){
  if (y == 0) return 1;
  return x * intpow(x, y-1);
}//»

nextRoll(roll, size){//«
//void nextRoll(int * roll, int size){
  for (int i = size-1; i >= 0; i--)
  {
    // Try to increment if by 1.
    if (roll[i] < DIEFACES) {
      // if possible, do it and then set everything to the right back to 1
      roll[i]++;
      for (int j = i+1; j < size; j++)
        roll[j] = 1;

      return;
    }
  }
}//»

getRollBase10(roll, ize) {//«
//int getRollBase10(int * roll, int size) {
  int multiplier = 1;
  int val = 0;
  for (int i = size-1; i >= 0; i--)
  {
    val += roll[i]*multiplier;
    multiplier *= 10;
  }

  return val;
}//»

determineChanceOutcomes(player){//«
//void determineChanceOutcomes(int player){
  int dice = (player == 1 ? P1DICE : P2DICE);
  int rolls[dice];
  for (int r = 0; r < dice; r++) rolls[r] = 1;
  outcomes.clear();

  int permutations = intpow(DIEFACES, dice);
  int p;

  for (p = 0; p < permutations; p++) {

    // first, make a copy
    int rollcopy[dice];
    memcpy(rollcopy, rolls, dice*sizeof(int));

    // now sort
    bubsort(rollcopy, dice);

    // now convert to an integer in base 10
    int key = getRollBase10(rollcopy, dice);

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

  map<int,int>::iterator iter;
  int idx = 0;
  for (iter = outcomes.begin(); iter != outcomes.end(); iter++) {
    chanceOutcomes[idx] = iter->first;
    idx++;
  }

  bubsort(chanceOutcomes, numChanceOutcomes);

  for (int c = 0; c < numChanceOutcomes; c++) {
    int key = chanceOutcomes[c];
    chanceProbs[c] = static_cast<double>(outcomes[key]) / static_cast<double>(permutations);
    //cout << "player " << player << " roll " << key << " prob " << chanceProbs[c] << endl;
  }
}//»

init(){//«
//void init(){
  assert(bids == NULL);

  cout << "Initializing Bluff globals..." << endl;

  seedCurMicroSec();

  determineChanceOutcomes(1);
  determineChanceOutcomes(2);

  // iscWidth if the number of bits needed to encode the chance outcome in the integer
  int maxChanceOutcomes = (numChanceOutcomes1 > numChanceOutcomes2 ? numChanceOutcomes1 : numChanceOutcomes2);
  iscWidth = ceiling_log2(maxChanceOutcomes);

  initBids();

  cout << "Globals are: " << numChanceOutcomes1 << " " << numChanceOutcomes2 << " " << iscWidth << endl;
}//»


newInfoset(is, actions){//«
//void newInfoset(Infoset & is, int actions){
  is.actionshere = actions;
  is.lastUpdate = 0;

  for (int i = 0; i < actions; i++)
  {
    is.cfr[i] = 0.0;
    is.totalMoveProbs[i] = 0.0;
    is.curMoveProbs[i] = 1.0 / actions;
  }
}//»

terminal(gs){//«
//bool terminal(GameState & gs){
  return (gs.curbid == BLUFFBID);
}//»

// a bid is from 1 to 12, for example
convertbid(dice, face, bid) {//«
//void convertbid(int & dice, int & face, int bid) {
  if (P1DICE == 1 && P2DICE == 1)
  {
    dice = (bid - 1) / DIEFACES + 1;
    face = bid % DIEFACES;
    if (face == 0) face = DIEFACES;

    assert(dice >= 1 && dice <= 2);
    assert(face >= 1 && face <= DIEFACES);
  }
  else
  {
    // stored in an array.
    int size = (P1DICE+P2DICE)*DIEFACES;
    assert((bid-1) >= 0 && (bid-1) < size);

    dice = bids[bid-1] / 10;
    face = bids[bid-1] % 10;
  }
}//»

getRoll(roll, chanceOutcome, player){//«
//void getRoll(int * roll, int chanceOutcome, int player){
  unrankco(chanceOutcome-1, roll, player);
}//»

countMatchingDice(gs, player, face){//«
//int countMatchingDice(const GameState & gs, int player, int face){
  int roll[3] = {0,0,0};
  int matchingDice = 0;
  int dice = (player == 1 ? P1DICE : P2DICE);

  if (dice == 1)
  {
    if (player == 1)
      roll[1] = gs.p1roll;
    else if (player == 2)
      roll[1] = gs.p2roll;
  }
  else if (dice == 2)
  {
    if (player == 1)
      unrankco(gs.p1roll-1, roll, 1);
    else if (player == 2)
      unrankco(gs.p2roll-1, roll, 2);
  }

  for (int i = 0; i < 3; i++)
    if (roll[i] == face || roll[i] == DIEFACES)
      matchingDice++;

  return matchingDice;
}//»

whowon6(bid, bidder, callingPlayer, p1roll, p2roll, delta){//«
//int whowon(int bid, int bidder, int callingPlayer, int p1roll, int p2roll, int & delta){
  int dice = 0, face = 0;
  convertbid(dice, face, bid);

  assert(bidder != callingPlayer);

  // get the dice

  int p1rollArr[P1DICE];
  int p2rollArr[P2DICE];

  unrankco(p1roll-1, p1rollArr, 1);
  unrankco(p2roll-1, p2rollArr, 2);

  // now check the number of matches

  int matching = 0;

  for (int i = 0; i < P1DICE; i++)
    if (p1rollArr[i] == face || p1rollArr[i] == DIEFACES)
      matching++;

  for (int j = 0; j < P2DICE; j++)
    if (p2rollArr[j] == face || p2rollArr[j] == DIEFACES)
      matching++;

  delta = matching - dice;
  if (delta < 0) delta *= -1;

  if (matching >= dice)
  {
    return bidder;
  }
  else
  {
    return callingPlayer;
  }
}//»

whowon2(gs, delta){//«
//int whowon(GameState & gs, int & delta){
  int bidder = 3 - gs.callingPlayer;
  return whowon(gs.prevbid, bidder, gs.callingPlayer, gs.p1roll, gs.p2roll, delta);
}//»

whowon1(gs){//«
//int whowon(GameState & gs){
  int bidder = 3 - gs.callingPlayer;
  int delta = 0;
  return whowon(gs.prevbid, bidder, gs.callingPlayer, gs.p1roll, gs.p2roll, delta);
}//»

payoff(winner, player, delta){//«
  // first thing: if it's an exact match, calling player loses 1 die
  // may as well set delta to 1 in this case
  if (delta == 0) delta = 1;

  double p1payoff = 0.0;

  if
    (P1DICE == 1 && P2DICE == 1) return (winner == player ? 1.0 : -1.0);
  else
  {
    assert(false);
  }

  return (player == 1 ? p1payoff : -p1payoff);
}//»

// In these functions "delta" represents the number of dice the bid is off by (not relevant for (1,1))
// Returns payoff for Liar's Dice (delta always equal to 1)
payoff_wp(winner, player){//«
//double payoff(int winner, int player){
  return payoff(winner, player, 1);
}//»

// this is the function called by all the algorithms.
// Now set to use the delta
payoff_gp(gs, player) {//«
//double payoff(GameState & gs, int player) {
  int delta = 0;
  int winner = whowon(gs, delta);
  return payoff(winner, player, delta);
}//»

payoff6(bid, bidder, callingPlayer, p1roll, p2roll, player) {//«
//double payoff(int bid, int bidder, int callingPlayer, int p1roll, int p2roll, int player) {
  int delta = 0;
  int winner = whowon(bid, bidder, callingPlayer, p1roll, p2roll, delta);
  return payoff(winner, player);
}//»

report(filename, totaltime, bound, conv){//«
//void report(string filename, double totaltime, double bound, double conv){
  filename = filepref + filename;
  cout << "Reporting to " + filename + " ... " << endl;
  ofstream outf(filename.c_str(), ios::app);
  outf << iter << " " << totaltime << " " << bound << " " << conv << " " << nodesTouched << endl;
  outf.close();
}//»

dumpInfosets(prefix){//«
//void dumpInfosets(string prefix){
  string filename = filepref + prefix + "." + to_string(iter) + ".dat";
  cout << "Dumping infosets to " + filename + " ... " << endl;
  iss.dumpToDisk(filename);
}//»

// not even sure what I used this "meta data" for, if I ever used it....
dumpMetaData(prefix, totaltime) {//«
//void dumpMetaData(string prefix, double totaltime) {
  string filename = filepref + prefix + "." + to_string(iter) + ".dat";
  cout << "Dumping metadeta to " + filename + " ... " << endl;

  ofstream outf(filename.c_str(), ios::binary);
  if (!outf.is_open()) {
    cerr << "Could not open meta data file for writing." << endl;
    return;
  }

  outf.write(reinterpret_cast<const char *>(&iter), sizeof(iter));
  outf.write(reinterpret_cast<const char *>(&nodesTouched), sizeof(nodesTouched));
  outf.write(reinterpret_cast<const char *>(&ntNextReport), sizeof(ntNextReport));
  outf.write(reinterpret_cast<const char *>(&ntMultiplier), sizeof(ntMultiplier));
  outf.write(reinterpret_cast<const char *>(&totaltime), sizeof(totaltime));

  outf.close();
}//»

loadMetaData(filename) {//«
//void loadMetaData(std::string filename) {
  ifstream inf(filename.c_str(), ios::binary);
  if (!inf.is_open()) {
    cerr << "Could not open meta data file." << endl;
    return;
  }

  double totaltime = 0;

  inf.read(reinterpret_cast<char *>(&iter), sizeof(iter));
  inf.read(reinterpret_cast<char *>(&nodesTouched), sizeof(nodesTouched));
  inf.read(reinterpret_cast<char *>(&ntNextReport), sizeof(ntNextReport));
  inf.read(reinterpret_cast<char *>(&ntMultiplier), sizeof(ntMultiplier));
  inf.read(reinterpret_cast<char *>(&totaltime), sizeof(totaltime));

  inf.close();
}//»

// Does a recursive tree walk setting up the information sets, creating the initial strategies
initInfosets(gs, player, depth, bidseq) {//«
//void initInfosets(GameState & gs, int player, int depth, unsigned long long bidseq) {
  if (terminal(gs))
    return;

  // check for chance nodes
  if (gs.p1roll == 0)
  {
    for (int i = 1; i <= numChanceOutcomes1; i++)
    {
      GameState ngs = gs;
      ngs.p1roll = i;

      initInfosets(ngs, player, depth+1, bidseq);
    }

    return;
  }
  else if (gs.p2roll == 0)
  {
    for (int i = 1; i <= numChanceOutcomes2; i++)
    {
      GameState ngs = gs;
      ngs.p2roll = i;

      initInfosets(ngs, player, depth+1, bidseq);
    }

    return;
  }

  int maxBid = (gs.curbid == 0 ? BLUFFBID-1 : BLUFFBID);
  int actionshere = maxBid - gs.curbid;

  assert(actionshere > 0);
  Infoset is;
  newInfoset(is, actionshere);

  for (int i = gs.curbid+1; i <= maxBid; i++)
  {
    if (depth == 2 && i == (gs.curbid+1)) {
      cout << "InitTrees. iss stats = " << iss.getStats() << endl;
    }

    GameState ngs = gs;
    ngs.prevbid = gs.curbid;
    ngs.curbid = i;
    ngs.callingPlayer = player;
    unsigned long long newbidseq = bidseq;
    newbidseq |= (1ULL << (BLUFFBID-i));

    initInfosets(ngs, (3-player), depth+1, newbidseq);
  }

  unsigned infosetkey = 0;
  infosetkey = bidseq;
  infosetkey <<= iscWidth;
  if (player == 1)
  {
    infosetkey |= gs.p1roll;
    infosetkey <<= 1;
    iss.put(infosetkey, is, actionshere, 0);
  }
  else if (player == 2)
  {
    infosetkey |= gs.p2roll;
    infosetkey <<= 1;
    infosetkey |= 1;
    iss.put(infosetkey, is, actionshere, 0);
  }
}//»

initInfosets() {//«
//void initInfosets() {
  unsigned long long bidseq = 0;

  GameState gs;

  cout << "Initialize info set store..." << endl;
  // # doubles in total, size of index (must be at least # infosets)
  // 2 doubles per iapair + 2 per infoset =
  if (P1DICE == 1 && P2DICE == 1 && DIEFACES == 6)
    iss.init(147432, 100000);
  else
  {
    cerr << "initInfosets not defined for this PXDICE + DIEFACES" << endl;
  }

  assert(iss.getSize() > 0);

  cout << "Initializing info sets..." << endl;
  stopwatch.reset();
  initInfosets(gs, 1, 0, bidseq);

  cout << "time taken = " << stopwatch.stop() << " seconds." << endl;
  iss.stopAdding();

  cout << "Final iss stats: " << iss.getStats() << endl;
  stopwatch.reset();

  string filename = filepref + "iss.initial.dat";

  cout << "Dumping information sets to " << filename << endl;
  iss.dumpToDisk(filename);
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


