//« 7/21/25: This file exists to implement Marc Lanctot's (UAlberta, Maastricht, etc) 
// stuff on the open internets.

//»

/*«

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

//Imports«

//const{globals, Desk}=LOTW;
const {Com} = LOTW.globals.ShellMod.comClasses;
const{log,jlog,cwarn,cerr}=LOTW.api.util;
//»

//KuhnTrainer.java«
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


