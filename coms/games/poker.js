/*7/11/25: Getting back into an LOTW workflow with poker logic«

How in the HELL can you backwards traverse without all chance nodes being actual
nodes?

Perhaps each chance node must also include the array index of its parent chance node.



MCCFR: THIS EXAMPLE IS STUPID!«

// Monte Carlo CFR for 2-player NLHE with suit-abstracted hands
class CFRNode {
  constructor(hand, board, pot, stack, actions) {//«
    this.hand = hand; // e.g., "AKQJTe5"
    this.board = board;
    this.pot = pot;
    this.stack = stack;
    this.actions = actions; // ['fold', 'call', 'raise']
    this.regretSum = new Array(actions.length).fill(0);
    this.strategySum = new Array(actions.length).fill(0);
    this.strategy = new Array(actions.length).fill(1 / actions.length);
  }//»
  getStrategy() {//«
    let normalizingSum = 0;
    for (let i = 0; i < this.actions.length; i++) {
      this.strategy[i] = Math.max(0, this.regretSum[i]);
      normalizingSum += this.strategy[i];
    }
    if (normalizingSum > 0) {
      for (let i = 0; i < this.actions.length; i++) {
        this.strategy[i] /= normalizingSum;
      }
    } else {
      for (let i = 0; i < this.actions.length; i++) {
        this.strategy[i] = 1 / this.actions.length;
      }
    }
    for (let i = 0; i < this.actions.length; i++) {
      this.strategySum[i] += this.strategy[i];
    }
    return this.strategy;
  }//»
  getAverageStrategy() {//«
    let normalizingSum = 0;
    let avgStrategy = new Array(this.actions.length).fill(0);
    for (let i = 0; i < this.actions.length; i++) {
      normalizingSum += this.strategySum[i];
    }
    if (normalizingSum > 0) {
      for (let i = 0; i < this.actions.length; i++) {
        avgStrategy[i] = this.strategySum[i] / normalizingSum;
      }
    } else {
      for (let i = 0; i < this.actions.length; i++) {
        avgStrategy[i] = 1 / this.actions.length;
      }
    }
    return avgStrategy;
  }//»
}

class CFR {
  constructor() {//«
    this.nodes = new Map();
    this.iterations = 100000;
  }//»
  async runCFR() {//«
    let util = 0;
    for (let i = 0; i < this.iterations; i++) {
      let deck = shuffleDeck();
      let hands = dealHands(deck, 2);
      let board = dealBoard(deck);
      let handAbstracted = abstractHand(hands[0], board); // e.g., "AKQJTe5"
      util += await this.cfr(handAbstracted, board, 100, 1000, ['fold', 'call', 'raise'], 1);
    }
    return util / this.iterations;
  }//»
  async cfr(hand, board, pot, stack, actions, player) {//«
    let nodeKey = `${hand}:${board}:${pot}:${stack}`;
    if (!this.nodes.has(nodeKey)) {
      this.nodes.set(nodeKey, new CFRNode(hand, board, pot, stack, actions));
    }
    let node = this.nodes.get(nodeKey);
    let strategy = node.getStrategy();
    let util = new Array(actions.length).fill(0);
    let nodeUtil = 0;

    for (let i = 0; i < actions.length; i++) {
      if (strategy[i] > 0) {
        let nextPot = pot;
        let nextStack = stack;
        if (actions[i] === 'fold') {
          util[i] = -pot / 2;
        } else if (actions[i] === 'call') {
          nextPot += stack / 2;
          nextStack -= stack / 2;
          util[i] = await evaluateTerminal(hand, board, nextPot);
        } else if (actions[i] === 'raise') {
          nextPot += stack;
          nextStack -= stack;
          util[i] = await this.cfr(hand, board, nextPot, nextStack, actions, 3 - player);
        }
        nodeUtil += strategy[i] * util[i];
      }
    }

    for (let i = 0; i < actions.length; i++) {
      let regret = util[i] - nodeUtil;
      node.regretSum[i] += regret;
    }

    return nodeUtil;
  }//»
  async saveStrategy() {//«
    let strategyData = {};
    for (let [key, node] of this.nodes) {
      strategyData[key] = node.getAverageStrategy();
    }
    await fs.writeFile('/path/to/strategy.json', JSON.stringify(strategyData));
  }//»
}

const abstractHand=(hand, board)=>{//«
// Placeholder for hand/board abstraction
  // Implement suit-abstracted hand representation (e.g., "AKQJTe5")
  return hand + board + 'e5'; // Simplified placeholder
}//»
const shuffleDeck=()=>{//«
// Placeholder for deck shuffling
  let deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}//»
const dealHands=(deck, numPlayers)=>{//«
// Placeholder for dealing hands
  let hands = [];
  for (let i = 0; i < numPlayers; i++) {
    hands.push([deck[i * 2], deck[i * 2 + 1]]);
  }
  return hands;
}//»
const dealBoard=(deck)=>{//«
// Placeholder for dealing board
  return deck.slice(2 * 2, 2 * 2 + 5); // Flop + Turn + River
}//»
async const evaluateTerminal=(hand, board, pot)=>{//«
// Placeholder for terminal node evaluation
  // Implement hand strength evaluation
  return Math.random() * pot; // Simplified placeholder
}//»
async const main=()=>{//«
  let cfr = new CFR();
  let util = await cfr.runCFR();
  await cfr.saveStrategy();
  return util;
}//»

main();

//»

» */

/*7/5/25: Now: to resume "just programming"!«

Our goal is to build 169 expert-level game trees for 2-9 handed NLHE, from AA -> 32o
For each of these trees, we know that the postflop *structures* of the trees are
identical, and if there are N (e.g. 10-20) possible betting/raising/calling sequences
that can lead to those trees, then we can just use 1 actual tree and implement arrays
for the internal data payloads. We'll just need a flag somewhere to describe which
exact pathway we are on.

Let's build the following increasingly unabstracted game trees:

1) Ranks only (AKo == AKs).
2) Simple flush flags: Suits connect with: 
	a. both holes
	b. 1 hole
	c. no holes (board only)
3) Simple flush flags enhanced: Suits connect with: 
	a. both holes
	b. High hole only
	c. Low hole only
	d. no holes (board only)
4) Then use our s/t/x suit abstractions with increasing threshold granularity.

To build ranks only, we just need to know the remaining numbers of each suit.
AA
	A: 2
	K-2: 4
AK
	A: 3
	K: 3
	Q-2: 4
etc.

Use the largest string of duplicates of the highest ranks first.
AA
	AAX
		AAK
		AAQ
		...
	AKK
	AKX
		AKQ
		AKJ
		...
	AQQ
	AQX
		AQJ
		AQT
		...
	(AJJ, AJX, ..., A22, KKK, KKQ, KKJ, ... 333, 332, 322, 222)
AK
	AA[K-2]
	AKK
	AK[Q-2]
	AQQ
	AQ[J-2]
	...
AQ
	AA[K-2]
	AKK
	...
KK
	...
KQ
	...
...	
QQ
	...
QJ
	...
...	


Let's use JavaScript to build a data structure of how the various poker ranks: 
AKQJT98765432 (use T instead of 10)
may build hands, from the hole cards to the river cards, such that only the 
possible rank combinations are given (the suits are abstracted away).

The data structure should be built with an algorithm that first uses the highest ranks, 
and the longest possible sequence of duplicates per rank. The hole ranks will be
sorted from highest to lowest, so KA -> AK, as will the board ranks, so 2JQ -> QJ2.
Whenever the string is length >= 5, the hole cards are in the first 2 positions (rank-sorted),
and the board cards are in the remaining positions (rank-sorted).

The end result should be:

{//Final data structure
	AA: {//Hole ranks (2 cards)
		AAAAK: { //Hole + flop (5 ranks)
			AAAAKK: [ //Hole + turn (6 ranks)
				"AAAAKKK",  // Hole + river (7 ranks)
				"AAAAKKQ", // Hole + river
				...
			],
		},
		AAAKK: { //Hole + flop
			AAAKKK: [ //Hole + turn
				"AAAKKKK",  // Hole + river
				"AAAKKKQ", // Hole + river
				...
			],
		},
		//...(AAAKQ - AA222)
	},
	AK:{
		AKAAA:{
			//...
		},
		AKAAK:{
			//...
		},
		//...
		AKKKK:{
			//...
		}
	}
	//... (AQ - 32)
	22:{
		22AAA:{
			//...
		}
		//...
	}
}

So we start with the hand "AA" and finish with "22". The goal is to create a
hierarchical structure that includes all possible rank-sorted Hold 'em style
poker hands, such that the rank-sorted hole cards are concatenated with 
the rank-sorted board cards.

»*/

//Imports«

//const{globals, Desk}=LOTW;
const {Com} = LOTW.globals.ShellMod.comClasses;
const{log,jlog,cwarn,cerr}=LOTW.api.util;
//»


const generatePokerHands = (startingHand) => {//«
    // Constants for ranks and iteration limit
    const result = {};
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const MAX_ITERATIONS = 5000000;
    let iterationCount = 0;

    // Validate starting hand (e.g., "AA", "AKs", "AKo")
    if (!startingHand || startingHand.length < 2 || startingHand.length > 3 ||
        !ranks.includes(startingHand[0]) || !ranks.includes(startingHand[1])) {
        throw new Error('Invalid starting hand format');
    }
    const isPair = startingHand[0] === startingHand[1];
    if (isPair && startingHand.length !== 2) {
        throw new Error('Pairs must have exactly 2 characters');
    }
    if (!isPair && startingHand.length !== 3) {
        throw new Error('Non-pairs must end with s or o');
    }
    if (!isPair && !['s', 'o'].includes(startingHand[2])) {
        throw new Error('Non-pairs must end with s or o');
    }

    // Extract base hole cards and suitedness
    const isSuited = startingHand.includes('s');
    const baseHole = startingHand.slice(0, 2);
    const sortedHole = ranks.indexOf(baseHole[0]) <= ranks.indexOf(baseHole[1]) ? baseHole : baseHole[1] + baseHole[0];

    // Helper: Count distinct ranks in the board
    const getDistinctBoardRanks = (board) => {
        return new Set(board.split('')).size;
    };

    // Helper: Get max possible suit-connecting cards
    const getMaxSuits = (board) => {
        const distinctBoardRanks = getDistinctBoardRanks(board);
        return isSuited ? distinctBoardRanks + 2 : distinctBoardRanks + 1;
    };

    // Helper: Validate if a suit count is possible for the round
    const isValidSuitCount = (round, suitCount) => {
        if (round === 'flop') return suitCount >= 3;
        if (round === 'turn') return suitCount >= 3;
        if (round === 'river') return suitCount >= 4;
        return false;
    };

    // Helper: Check for nut flush blocker
    const hasNutFlushBlocker = (holeRanks, maxSuitCount, isPair) => {
        if (!holeRanks.includes(0)) return false; // No Ace, no blocker
        if (isPair) {
            // For AA, assume one Ace can match a board suit (conservative for blockers)
            return maxSuitCount >= 1; // Any board suit can be blocked by an Ace
        }
        return true; // Non-pair with an Ace can block a board suit
    };

    // Helper: Assign valid flush statuses based on constraints
    const assignStatuses = (round, board, maxSuits, prevStatus = '') => {
        const statuses = new Set();
        const prevSuitCount = prevStatus.match(/\d$/) ? parseInt(prevStatus.match(/\d$/)[0]) : 0;
        const distinctBoardRanks = getDistinctBoardRanks(board);
        // Estimate maxSuitCount based on distinct ranks
        const maxSuitCount = round === 'flop' ? Math.min(3, distinctBoardRanks) :
                            round === 'turn' ? Math.min(4, distinctBoardRanks) :
                            Math.min(5, distinctBoardRanks);
        const suitsWithTwo = maxSuitCount === 2 ? (distinctBoardRanks === 3 ? 1 : distinctBoardRanks - 1) : 0;

        // Handle 'a' (board-driven flush draw)
        const totalDistinctRanks = new Set([...baseHole.split(''), ...board.split('')]).size;
        const minDistinctRanks = round === 'river' ? 5 : round === 'turn' ? 4 : 3;
        if (totalDistinctRanks >= minDistinctRanks && isValidSuitCount(round, maxSuitCount)) {
            statuses.add('a');
        }

        // Handle 'b' categories (no player flush draw)
        const holeRanks = baseHole.split('').map(r => ranks.indexOf(r));
        if (round === 'flop') {
            if (maxSuitCount <= 1) { // Rainbow board
                if (hasNutFlushBlocker(holeRanks, maxSuitCount, isPair)) {
                    statuses.add('B1');
                } else {
                    statuses.add('b1');
                }
            } else if (maxSuitCount === 2) {
                if (hasNutFlushBlocker(holeRanks, maxSuitCount, isPair)) {
                    statuses.add('B2');
                } else {
                    statuses.add('b2');
                }
            }
        } else if (round === 'turn') {
            if (maxSuitCount <= 1) {
                statuses.add('b0');
            } else if (maxSuitCount === 2 && suitsWithTwo === 1) {
                if (hasNutFlushBlocker(holeRanks, maxSuitCount, isPair)) {
                    statuses.add('B2');
                } else {
                    statuses.add('b2');
                }
            } else if (maxSuitCount === 2 && suitsWithTwo >= 2) {
                if (hasNutFlushBlocker(holeRanks, maxSuitCount, isPair)) {
                    statuses.add('B22');
                } else {
                    statuses.add('b22');
                }
            }
        } else if (round === 'river') {
            if (maxSuitCount <= 2) { // No flush possible for any player
                statuses.add('b0');
            }
        }

        // Handle unsuited hands (c: lower rank connects, d: higher rank or pair)
        if (!isSuited) {
            if (totalDistinctRanks >= minDistinctRanks) {
                if (round === 'flop' && (!prevStatus || prevStatus === 'c3') && isValidSuitCount(round, 3)) {
                    if (maxSuits >= 3) statuses.add('c3');
                } else if ((round === 'turn' || round === 'river') && (!prevStatus || prevStatus === 'c3') && isValidSuitCount(round, 3)) {
                    if (maxSuits >= 4) statuses.add('c4');
                    if (round === 'river' && maxSuits >= 5) statuses.add('c5');
                }
            }
            if (totalDistinctRanks >= minDistinctRanks) {
                if (round === 'flop' && (!prevStatus || prevStatus === 'd3') && isValidSuitCount(round, 3)) {
                    if (maxSuits >= 3) statuses.add('d3');
                } else if ((round === 'turn' || round === 'river') && (!prevStatus || ['d3', 'd4'].includes(prevStatus)) && isValidSuitCount(round, 3)) {
                    if (maxSuits >= 4) statuses.add('d4');
                    if (round === 'river' && maxSuits >= 5) statuses.add('d5');
                }
            }
            return Array.from(statuses);
        }

        // Handle suited hands (e: both hole cards connect)
        if (totalDistinctRanks >= minDistinctRanks) {
            if (round === 'flop' && (!prevStatus || prevStatus === 'e3') && isValidSuitCount(round, 3)) {
                if (maxSuits >= 3) statuses.add('e3');
            } else if (round === 'turn' && prevStatus === 'e3' && isValidSuitCount(round, 3)) {
                if (maxSuits >= 4) statuses.add('e4');
                if (maxSuits >= 5) statuses.add('e5');
                if (maxSuits >= 6) statuses.add('e6');
            } else if (round === 'river' && prevStatus.startsWith('e')) {
                if (prevSuitCount === 3 && maxSuits >= 4) statuses.add('e4');
                if ((prevSuitCount === 3 || prevSuitCount === 4) && maxSuits >= 5) statuses.add('e5');
                if ((prevSuitCount === 3 || prevSuitCount === 4 || prevSuitCount === 5) && maxSuits >= 6) statuses.add('e6');
                if ((prevSuitCount === 3 || prevSuitCount === 4 || prevSuitCount === 5 || prevSuitCount === 6) && maxSuits >= 7) statuses.add('e7');
            }
        }
        return Array.from(statuses);
    };

    // Generate all possible flops
    const generateFlops = () => {
        if (++iterationCount > MAX_ITERATIONS) {
            throw new Error('Infinite loop detected in generateFlops');
        }

//        const flops = {};
        const flops = [];
        const usedRanks = baseHole.split('');
        const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

        for (let i = 0; i < availableRanks.length; i++) {
            for (let j = i; j < availableRanks.length; j++) {
                for (let k = j; k < availableRanks.length; k++) {
                    const flopRanks = [availableRanks[i], availableRanks[j], availableRanks[k]];
                    const combinedRanks = [...usedRanks, ...flopRanks];
                    if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
                    const sortedFlop = flopRanks.sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
//return sortedFlop;
flops.push(`${baseHole}${sortedFlop}`);
/*
                    const maxSuits = getMaxSuits(sortedFlop);
                    const flushStatuses = assignStatuses('flop', sortedFlop, maxSuits);
                    for (let status of flushStatuses) {
                        const flopKey = baseHole + sortedFlop + status;
                        if (flopKey.length === 6 || flopKey.length === 7) {
//                            flops[flopKey] = generateTurns(flopKey);
flops.push(flopKey);
                        }
                    }
*/
                }
            }
        }
        return flops;
    };

    // Generate all possible turns for a given flop
    const generateTurns = (flopKey) => {
        if (++iterationCount > MAX_ITERATIONS) {
            throw new Error('Infinite loop detected in generateTurns');
        }

        const turns = {};
        const usedRanks = flopKey.replace(/[soa-e0-7]/g, '').split('');
        const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);
        const prevStatus = flopKey.match(/[a-e][0-7]?$/)[0];

        for (let i = 0; i < availableRanks.length; i++) {
            const turnCard = availableRanks[i];
            const board = flopKey.slice(2, 5) + turnCard;
            const combinedRanks = [...usedRanks, turnCard];
            if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
            const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
            const maxSuits = getMaxSuits(sortedBoard);
            const flushStatuses = assignStatuses('turn', sortedBoard, maxSuits, prevStatus);
            for (let status of flushStatuses) {
                const turnKey = baseHole + sortedBoard + status;
                turns[turnKey] = generateRivers(turnKey);
            }
        }
        return turns;
    };

    // Generate all possible rivers for a given turn
    const generateRivers = (turnKey) => {
        if (++iterationCount > MAX_ITERATIONS) {
            throw new Error('Infinite loop detected in generateRivers');
        }

        const rivers = [];
        const usedRanks = turnKey.replace(/[soa-e0-7]/g, '').split('');
        const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);
        const prevStatus = turnKey.match(/[a-e][0-7]?$/)[0];

        for (let i = 0; i < availableRanks.length; i++) {
            const riverCard = availableRanks[i];
            const board = turnKey.slice(2, 6) + riverCard;
            const combinedRanks = [...usedRanks, riverCard];
            if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
            const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
            const maxSuits = getMaxSuits(sortedBoard);
            const flushStatuses = assignStatuses('river', sortedBoard, maxSuits, prevStatus);
            for (let status of flushStatuses) {
                const riverKey = baseHole + sortedBoard + status;
                rivers.push(riverKey);
            }
        }
        return rivers;
    };

    // Generate the tree for the sorted starting hand
	return generateFlops().join("\n");
//    result[sortedHole] = generateFlops();
//    return result;
};/* » */

/*
const generatePokerHands = (startingHand) => {//«

// Constants for ranks, suits, and iteration limit«
const result = {};
const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const suits = ['s', 'h', 'd', 'c'];
const MAX_ITERATIONS = 5000000;
let iterationCount = 0;
//»
// Validate starting hand (e.g., "AA", "AKs", "AKo")«
if (!startingHand){
	let out='';
	for (let r of ranks){
		out += `${r}${r}\n`;
	}
	let first = 0;
	for (let i=first; i<ranks.length-1; i++){
		for (let j=first+1; j<ranks.length; j++){
			out+=`${ranks[i]}${ranks[j]}s\n${ranks[i]}${ranks[j]}o\n`;
		}
		first++;
	}
	return out.replace(/\n$/,"");
}
if (startingHand.length < 2 || startingHand.length > 3 ||
		!ranks.includes(startingHand[0]) || !ranks.includes(startingHand[1])) {
	throw new Error('Invalid starting hand format');
}
const isPair = startingHand[0] === startingHand[1];
if (isPair && startingHand.length !== 2) {
	throw new Error('Pairs must have exactly 2 characters');
}
if (!isPair && startingHand.length !== 3) {
	throw new Error('Non-pairs must have exactly 3 characters');
}
if (!isPair && !['s', 'o'].includes(startingHand[2])) {
	throw new Error('Non-pairs must end with s or o');
}
//»
// Extract base hole cards and suitedness«
const isSuited = startingHand.includes('s');
const baseHole = startingHand.slice(0, 2);
const sortedHole = ranks.indexOf(baseHole[0]) <= ranks.indexOf(baseHole[1]) ? baseHole : baseHole[1] + baseHole[0];
//»

const getDistinctBoardRanks = (board) => {//«
// Helper: Count distinct ranks in the board
	return new Set(board.split('')).size;
};//»

const getMaxSuits = (board) => {//«
// Helper: Get max possible suit-connecting cards
// - For suited hands: 2 hole cards + distinct board ranks
// - For unsuited: 1 hole card + distinct board ranks
	const distinctBoardRanks = getDistinctBoardRanks(board);
	return isSuited ? distinctBoardRanks + 2 : distinctBoardRanks + 1;
};//»

const isValidSuitCount = (round, suitCount) => {//«
// Helper: Validate if a suit count is possible for the round
	if (round === 'flop') return suitCount === 3;
	if (round === 'turn') return suitCount >= 4;
	if (round === 'river') return suitCount >= 4; // 4 for draw, 5+ for flush
	return false;
};//»

const hasNutFlushBlocker = (board, holeSuits, boardSuits) => {//«
// Helper: Check for nut flush blocker
// Simulate suit assignment to check if a hole card is the highest non-board card of a suit
	const suitCounts = {};
		boardSuits.forEach(suit => {
		suitCounts[suit] = (suitCounts[suit] || 0) + 1;
	});
	const maxSuitCount = Math.max(...Object.values(suitCounts), 0);
	if (maxSuitCount < 2) return false; // Need at least 2 cards of a suit for blocker relevance
	const primarySuit = Object.keys(suitCounts).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b, null);
	const boardRanksInSuit = boardSuits.map((suit, idx) => suit === primarySuit ? ranks.indexOf(board[idx]) : -1).filter(r => r >= 0);
	const maxBoardRank = Math.max(...boardRanksInSuit, -1);
	const holeRanks = baseHole.split('').map(r => ranks.indexOf(r));
	return holeSuits.some((suit, idx) => suit === primarySuit && holeRanks[idx] < maxBoardRank);
};//»

const assignStatuses = (round, board, maxSuits, prevStatus = '') => {//«
// Helper: Assign valid flush statuses based on constraints
	const statuses = new Set();
	const prevSuitCount = prevStatus.match(/\d$/) ? parseInt(prevStatus.match(/\d$/)[0]) : 0;

	// Simulate board suits to check flush potential
	const boardSuits = Array(board.length).fill('').map((_, i) => suits[i % suits.length]);
	const suitCounts = {};
	boardSuits.forEach(suit => {
		suitCounts[suit] = (suitCounts[suit] || 0) + 1;
	});
	const maxSuitCount = Math.max(...Object.values(suitCounts), 0);
	const suitsWithTwo = Object.values(suitCounts).filter(count => count === 2).length;

	// Handle 'a' (board-driven flush draw)
	const totalDistinctRanks = new Set([...baseHole.split(''), ...board.split('')]).size;
	const minDistinctRanks = round === 'river' ? 5 : round === 'turn' ? 4 : 3;
	if (totalDistinctRanks >= minDistinctRanks && isValidSuitCount(round, maxSuitCount)) {
		statuses.add('a');
	}

	// Handle 'b' categories (no player flush draw)
	if (round === 'flop') {//«
		if (maxSuitCount <= 1) { // Rainbow board
			const primarySuit = Object.keys(suitCounts).length ? Object.keys(suitCounts)[0] : null;
			const holeSuits = isSuited ? [startingHand[2] === 's' ? 's' : 'h', startingHand[2] === 's' ? 's' : 'h'] : ['s', 'h'];
			if (primarySuit && hasNutFlushBlocker(board, holeSuits, boardSuits)) {
				statuses.add('B1');
			}
			else {
				statuses.add('b1');
			}
		}
	}//»
	else if (round === 'turn') {//«
		if (maxSuitCount <= 1) {
			statuses.add('b0');
		}
		else if (maxSuitCount === 2 && suitsWithTwo === 1) {
			const primarySuit = Object.keys(suitCounts).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b, null);
			const holeSuits = isSuited ? [startingHand[2] === 's' ? 's' : 'h', startingHand[2] === 's' ? 's' : 'h'] : ['s', 'h'];
			if (hasNutFlushBlocker(board, holeSuits, boardSuits)) {
				statuses.add('B2');
			}
			else {
				statuses.add('b2');
			}
		}
		else if (maxSuitCount === 2 && suitsWithTwo >= 2) {
			const primarySuit = Object.keys(suitCounts).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b, null);
			const holeSuits = isSuited ? [startingHand[2] === 's' ? 's' : 'h', startingHand[2] === 's' ? 's' : 'h'] : ['s', 'h'];
			if (hasNutFlushBlocker(board, holeSuits, boardSuits)) {
				statuses.add('B22');
			}
			else {
				statuses.add('b22');
			}
		}
	}//»
	else if (round === 'river') {//«
		if (maxSuitCount <= 2) { // No flush possible for any player
			statuses.add('b0');
		}
	}//»

	// Handle unsuited hands (c: lower rank connects, d: higher rank or pair)
	if (!isSuited) {//«
		if (!isPair && totalDistinctRanks >= minDistinctRanks) {
			if (round === 'flop' && (!prevStatus || prevStatus === 'c3') && isValidSuitCount(round, 3)) {
				if (maxSuits >= 3) statuses.add('c3');
			}
			else if ((round === 'turn' || round === 'river') && (!prevStatus || prevStatus === 'c3') && isValidSuitCount(round, 4)) {
				if (maxSuits >= 4) statuses.add('c4');
				if (round === 'river' && maxSuits >= 5) statuses.add('c5');
			}
		}
		if (totalDistinctRanks >= minDistinctRanks) {
			if (round === 'flop' && (!prevStatus || prevStatus === 'd3') && isValidSuitCount(round, 3)) {
				if (maxSuits >= 3) statuses.add('d3');
			}
			else if ((round === 'turn' || round === 'river') && (!prevStatus || prevStatus === 'd3') && isValidSuitCount(round, 4)) {
				if (maxSuits >= 4) statuses.add('d4');
				if (round === 'river' && maxSuits >= 5) statuses.add('d5');
			}
		}
		return Array.from(statuses);
	}//»

	// Handle suited hands (e: both hole cards connect)
	if (totalDistinctRanks >= minDistinctRanks) {//«
		if (round === 'flop' && (!prevStatus || prevStatus === 'e3') && isValidSuitCount(round, 3)) {
			if (maxSuits >= 3) statuses.add('e3');
		}
		else if (round === 'turn' && prevStatus === 'e3' && isValidSuitCount(round, 4)) {
			if (maxSuits >= 4) statuses.add('e4');
			if (maxSuits >= 5) statuses.add('e5');
			if (maxSuits >= 6) statuses.add('e6');
		}
		else if (round === 'river' && prevStatus.startsWith('e')) {
			if (prevSuitCount === 3 && maxSuits >= 4) statuses.add('e4');
			if ((prevSuitCount === 3 || prevSuitCount === 4) && maxSuits >= 5) statuses.add('e5');
			if ((prevSuitCount === 3 || prevSuitCount === 4 || prevSuitCount === 5) && maxSuits >= 6) statuses.add('e6');
			if ((prevSuitCount === 3 || prevSuitCount === 4 || prevSuitCount === 5 || prevSuitCount === 6) && maxSuits >= 7) statuses.add('e7');
		}
	}//»
	return Array.from(statuses);
};//»

const generateRivers = (turnKey) => {//«
	if (++iterationCount > MAX_ITERATIONS) {
		throw new Error('Infinite loop detected in generateRivers');
	}

	const rivers = [];
	const usedRanks = turnKey.replace(/[soa-e0-7]/g, '').split('');
	const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);
	const prevStatus = turnKey.match(/[a-e][0-7]?$/)[0];

	for (let i = 0; i < availableRanks.length; i++) {
		const riverCard = availableRanks[i];
		const board = turnKey.slice(2, 6) + riverCard;
		const combinedRanks = [...usedRanks, riverCard];
		if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
		const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
		const maxSuits = getMaxSuits(sortedBoard);
		const flushStatuses = assignStatuses('river', sortedBoard, maxSuits, prevStatus);
		for (let status of flushStatuses) {
			const riverKey = baseHole + sortedBoard + status;
			rivers.push(riverKey);
		}
	}
	return rivers;
};//»
const generateTurns = (flopKey) => {//«
	if (++iterationCount > MAX_ITERATIONS) {
		throw new Error('Infinite loop detected in generateTurns');
	}

	const turns = {};
	const usedRanks = flopKey.replace(/[soa-e0-7]/g, '').split('');
	const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);
	const prevStatus = flopKey.match(/[a-e][0-7]?$/)[0];

	for (let i = 0; i < availableRanks.length; i++) {
		const turnCard = availableRanks[i];
		const board = flopKey.slice(2, 5) + turnCard;
		const combinedRanks = [...usedRanks, turnCard];
		if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
		const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
		const maxSuits = getMaxSuits(sortedBoard);
		const flushStatuses = assignStatuses('turn', sortedBoard, maxSuits, prevStatus);
		for (let status of flushStatuses) {
			const turnKey = baseHole + sortedBoard + status;
			turns[turnKey] = generateRivers(turnKey);
		}
	}
	return turns;
};//»
const generateFlops = () => {//«
	if (++iterationCount > MAX_ITERATIONS) {
		throw new Error('Infinite loop detected in generateFlops');
	}
//	const flops = {};
	const flops = [];
	const usedRanks = baseHole.split('');
	const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);
	for (let i = 0; i < availableRanks.length; i++) {
		for (let j = i; j < availableRanks.length; j++) {
			for (let k = j; k < availableRanks.length; k++) {
				const flopRanks = [availableRanks[i], availableRanks[j], availableRanks[k]];
				const combinedRanks = [...usedRanks, ...flopRanks];
				if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
				const sortedFlop = flopRanks.sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
				const maxSuits = getMaxSuits(sortedFlop);
				const flushStatuses = assignStatuses('flop', sortedFlop, maxSuits);
				for (let status of flushStatuses) {
					const flopKey = baseHole + sortedFlop + status;
					if (flopKey.length === 6 || flopKey.length === 7) {
	//					flops[flopKey] = generateTurns(flopKey);
						flops.push(flopKey);
					}
				}
			}
		}
	}
	return flops;
};//»

// Generate the tree for the sorted starting hand
//  result[sortedHole] = generateFlops();
//result[startingHand] = generateFlops();
//return result;
let arr = generateFlops() || [];
return arr.join("\n");
//return generateFlops();
};//»
*/
/*
const generatePokerHands = (startingHand) => {//«
    // Constants for ranks, suits, and iteration limit
    const result = {};
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const suits = ['s', 'h', 'd', 'c'];
    const MAX_ITERATIONS = 5000000;
    let iterationCount = 0;

    // Validate starting hand (e.g., "AA", "AKs", "AKo")
    if (!startingHand || startingHand.length < 2 || startingHand.length > 3 ||
        !ranks.includes(startingHand[0]) || !ranks.includes(startingHand[1])) {
        throw new Error('Invalid starting hand format');
    }
    const isPair = startingHand[0] === startingHand[1];
    if (isPair && startingHand.length !== 2) {
        throw new Error('Pairs must have exactly 2 characters');
    }
    if (!isPair && startingHand.length !== 3) {
        throw new Error('Non-pairs must have exactly 3 characters');
    }
    if (!isPair && !['s', 'o'].includes(startingHand[2])) {
        throw new Error('Non-pairs must end with s or o');
    }

    // Extract base hole cards and suitedness
    const isSuited = startingHand.includes('s');
    const baseHole = startingHand.slice(0, 2);
    const sortedHole = ranks.indexOf(baseHole[0]) <= ranks.indexOf(baseHole[1]) ? baseHole : baseHole[1] + baseHole[0];

    // Helper: Count distinct ranks in the board
    const getDistinctBoardRanks = (board) => {
        return new Set(board.split('')).size;
    };

    // Helper: Get max possible suit-connecting cards
    const getMaxSuits = (board) => {
        const distinctBoardRanks = getDistinctBoardRanks(board);
        return isSuited ? distinctBoardRanks + 2 : distinctBoardRanks + 1;
    };

    // Helper: Validate if a suit count is possible for the round
    const isValidSuitCount = (round, suitCount) => {
        if (round === 'flop') return suitCount >= 3;
        if (round === 'turn') return suitCount >= 3; // Changed to 3 for turn flush draw
        if (round === 'river') return suitCount >= 4;
        return false;
    };

    // Helper: Check for nut flush blocker
    const hasNutFlushBlocker = (board, holeRanks) => {
        // Check if any hole card is an Ace (index 0)
        return holeRanks.includes(0); // Ace in hole cards blocks nut flush for any board suit
    };

    // Helper: Assign valid flush statuses based on constraints
    const assignStatuses = (round, board, maxSuits, prevStatus = '') => {
        const statuses = new Set();
        const prevSuitCount = prevStatus.match(/\d$/) ? parseInt(prevStatus.match(/\d$/)[0]) : 0;

        // Simulate board suits to check flush potential
        const boardSuits = Array(board.length).fill('').map((_, i) => suits[i % suits.length]);
        const suitCounts = {};
        boardSuits.forEach(suit => {
            suitCounts[suit] = (suitCounts[suit] || 0) + 1;
        });
        const maxSuitCount = Math.max(...Object.values(suitCounts), 0);
        const suitsWithTwo = Object.values(suitCounts).filter(count => count === 2).length;

        // Handle 'a' (board-driven flush draw)
        const totalDistinctRanks = new Set([...baseHole.split(''), ...board.split('')]).size;
        const minDistinctRanks = round === 'river' ? 5 : round === 'turn' ? 4 : 3;
        if (totalDistinctRanks >= minDistinctRanks && isValidSuitCount(round, maxSuitCount)) {
            statuses.add('a');
        }

        // Handle 'b' categories (no player flush draw)
        if (round === 'flop') {
            if (maxSuitCount <= 1) { // Rainbow board
                const holeRanks = baseHole.split('').map(r => ranks.indexOf(r));
                if (hasNutFlushBlocker(board, holeRanks)) {
                    statuses.add('B1');
                } else {
                    statuses.add('b1');
                }
            } else if (maxSuitCount === 2) {
                const primarySuit = Object.keys(suitCounts).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b, null);
                const holeRanks = baseHole.split('').map(r => ranks.indexOf(r));
                if (hasNutFlushBlocker(board, holeRanks)) {
                    statuses.add('B2');
                } else {
                    statuses.add('b2');
                }
            }
        } else if (round === 'turn') {
            if (maxSuitCount <= 1) {
                statuses.add('b0');
            } else if (maxSuitCount === 2 && suitsWithTwo === 1) {
                const primarySuit = Object.keys(suitCounts).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b, null);
                const holeRanks = baseHole.split('').map(r => ranks.indexOf(r));
                if (hasNutFlushBlocker(board, holeRanks)) {
                    statuses.add('B2');
                } else {
                    statuses.add('b2');
                }
            } else if (maxSuitCount === 2 && suitsWithTwo >= 2) {
                const primarySuit = Object.keys(suitCounts).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b, null);
                const holeRanks = baseHole.split('').map(r => ranks.indexOf(r));
                if (hasNutFlushBlocker(board, holeRanks)) {
                    statuses.add('B22');
                } else {
                    statuses.add('b22');
                }
            }
        } else if (round === 'river') {
            if (maxSuitCount <= 2) { // No flush possible for any player
                statuses.add('b0');
            }
        }

        // Handle unsuited hands (c: lower rank connects, d: higher rank or pair)
        if (!isSuited) {
            if (!isPair && totalDistinctRanks >= minDistinctRanks) {
                if (round === 'flop' && (!prevStatus || prevStatus === 'c3') && isValidSuitCount(round, 3)) {
                    if (maxSuits >= 3) statuses.add('c3');
                } else if ((round === 'turn' || round === 'river') && (!prevStatus || prevStatus === 'c3') && isValidSuitCount(round, 3)) {
                    if (maxSuits >= 4) statuses.add('c4');
                    if (round === 'river' && maxSuits >= 5) statuses.add('c5');
                }
            }
            if (totalDistinctRanks >= minDistinctRanks) {
                if (round === 'flop' && (!prevStatus || prevStatus === 'd3') && isValidSuitCount(round, 3)) {
                    if (maxSuits >= 3) statuses.add('d3');
                } else if ((round === 'turn' || round === 'river') && (!prevStatus || prevStatus === 'd3') && isValidSuitCount(round, 3)) {
                    if (maxSuits >= 4) statuses.add('d4');
                    if (round === 'river' && maxSuits >= 5) statuses.add('d5');
                }
            }
            return Array.from(statuses);
        }

        // Handle suited hands (e: both hole cards connect)
        if (totalDistinctRanks >= minDistinctRanks) {
            if (round === 'flop' && (!prevStatus || prevStatus === 'e3') && isValidSuitCount(round, 3)) {
                if (maxSuits >= 3) statuses.add('e3');
            } else if (round === 'turn' && prevStatus === 'e3' && isValidSuitCount(round, 3)) {
                if (maxSuits >= 4) statuses.add('e4');
                if (maxSuits >= 5) statuses.add('e5');
                if (maxSuits >= 6) statuses.add('e6');
            } else if (round === 'river' && prevStatus.startsWith('e')) {
                if (prevSuitCount === 3 && maxSuits >= 4) statuses.add('e4');
                if ((prevSuitCount === 3 || prevSuitCount === 4) && maxSuits >= 5) statuses.add('e5');
                if ((prevSuitCount === 3 || prevSuitCount === 4 || prevSuitCount === 5) && maxSuits >= 6) statuses.add('e6');
                if ((prevSuitCount === 3 || prevSuitCount === 4 || prevSuitCount === 5 || prevSuitCount === 6) && maxSuits >= 7) statuses.add('e7');
            }
        }
        return Array.from(statuses);
    };

    // Generate all possible flops
    const generateFlops = () => {
        if (++iterationCount > MAX_ITERATIONS) {
            throw new Error('Infinite loop detected in generateFlops');
        }

//        const flops = {};
        const flops = [];
        const usedRanks = baseHole.split('');
        const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

        for (let i = 0; i < availableRanks.length; i++) {
            for (let j = i; j < availableRanks.length; j++) {
                for (let k = j; k < availableRanks.length; k++) {
                    const flopRanks = [availableRanks[i], availableRanks[j], availableRanks[k]];
                    const combinedRanks = [...usedRanks, ...flopRanks];
                    if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
                    const sortedFlop = flopRanks.sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
                    const maxSuits = getMaxSuits(sortedFlop);
                    const flushStatuses = assignStatuses('flop', sortedFlop, maxSuits);
                    for (let status of flushStatuses) {
                        const flopKey = baseHole + sortedFlop + status;
                        if (flopKey.length === 6 || flopKey.length === 7) {
//                            flops[flopKey] = generateTurns(flopKey);
flops.push(flopKey);
                        }
                    }
                }
            }
        }
        return flops;
    };

    // Generate all possible turns for a given flop
    const generateTurns = (flopKey) => {
        if (++iterationCount > MAX_ITERATIONS) {
            throw new Error('Infinite loop detected in generateTurns');
        }

        const turns = {};
        const usedRanks = flopKey.replace(/[soa-e0-7]/g, '').split('');
        const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);
        const prevStatus = flopKey.match(/[a-e][0-7]?$/)[0];

        for (let i = 0; i < availableRanks.length; i++) {
            const turnCard = availableRanks[i];
            const board = flopKey.slice(2, 5) + turnCard;
            const combinedRanks = [...usedRanks, turnCard];
            if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
            const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
            const maxSuits = getMaxSuits(sortedBoard);
            const flushStatuses = assignStatuses('turn', sortedBoard, maxSuits, prevStatus);
            for (let status of flushStatuses) {
                const turnKey = baseHole + sortedBoard + status;
                turns[turnKey] = generateRivers(turnKey);
            }
        }
        return turns;
    };

    // Generate all possible rivers for a given turn
    const generateRivers = (turnKey) => {
        if (++iterationCount > MAX_ITERATIONS) {
            throw new Error('Infinite loop detected in generateRivers');
        }

        const rivers = [];
        const usedRanks = turnKey.replace(/[soa-e0-7]/g, '').split('');
        const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);
        const prevStatus = turnKey.match(/[a-e][0-7]?$/)[0];

        for (let i = 0; i < availableRanks.length; i++) {
            const riverCard = availableRanks[i];
            const board = turnKey.slice(2, 6) + riverCard;
            const combinedRanks = [...usedRanks, riverCard];
            if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
            const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
            const maxSuits = getMaxSuits(sortedBoard);
            const flushStatuses = assignStatuses('river', sortedBoard, maxSuits, prevStatus);
            for (let status of flushStatuses) {
                const riverKey = baseHole + sortedBoard + status;
                rivers.push(riverKey);
            }
        }
        return rivers;
    };

    // Generate the tree for the sorted starting hand
let arr = generateFlops() || [];
return arr.join("\n");
//return generateFlops();
//    result[sortedHole] = generateFlops();
//    return result;
};//»
*/

const getSuitAbstractedHand=(cards)=>{//«
    // Validate input: 5 (flop), 6 (turn), or 7 (river) cards
    if (!cards || ![5, 6, 7].includes(cards.length)) {
        throw new Error('Input must be 5, 6, or 7 cards (hole + board)');
    }

    // Constants for ranks and suits
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const suits = ['s', 'h', 'd', 'c'];

    // Split into hole and board cards
    const holeCards = cards.slice(0, 2); // First two cards are hole cards
    const boardCards = cards.slice(2).sort((a, b) => ranks.indexOf(a[0]) - ranks.indexOf(b[0])); // Sort board by rank
    const roundName = cards.length === 5 ? 'flop' : cards.length === 6 ? 'turn' : 'river';

    // Validate cards
    for (let card of cards) {
        if (!ranks.includes(card[0]) || !suits.includes(card[1])) {
            throw new Error(`Invalid card: ${card}`);
        }
    }

    // Extract hand notation
    const isSuited = holeCards[0][1] === holeCards[1][1];
    const handRanks = holeCards.map(card => ranks.indexOf(card[0])).sort((a, b) => a - b); // Sort by index (high to low)
    const handNotation = ranks[handRanks[0]] + ranks[handRanks[1]]; // No suit indicator

    // Get board notation (distinct ranks, sorted high to low)
    const boardRanks = boardCards.map(card => card[0]);
    const distinctBoardRanks = [...new Set(boardRanks)].sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b));
    const boardNotation = distinctBoardRanks.join('');

    // Count suits on the board
    const suitCounts = {};
    const boardSuits = boardCards.map(card => card[1]);
    boardSuits.forEach(suit => {
        suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    });
    const maxSuitCount = Math.max(...Object.values(suitCounts), 0);
    const suitsWithTwo = Object.values(suitCounts).filter(count => count === 2).length;

    // Helper: Check for nut flush blocker
    const hasNutFlushBlocker = (holeCards, boardCards, targetSuit) => {
        const boardRanksInSuit = boardCards.filter(card => card[1] === targetSuit).map(card => ranks.indexOf(card[0]));
        const maxBoardRank = boardRanksInSuit.length ? Math.min(...boardRanksInSuit) : Infinity; // Lower index = higher rank
        const holeRanksInSuit = holeCards.filter(card => card[1] === targetSuit).map(card => ranks.indexOf(card[0]));
        return holeRanksInSuit.includes(0); // Only Ace (index 0) is nut flush blocker
    };

    // Determine primary suit
    const holeSuits = holeCards.map(card => card[1]);
    let primarySuit = null;
    if (maxSuitCount >= 2) {
        primarySuit = Object.keys(suitCounts).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b, null);
    } else if (maxSuitCount === 1) {
        // For rainbow flop, prioritize suit matching hole cards
        const matchingSuit = boardSuits.find(suit => holeSuits.includes(suit));
        primarySuit = matchingSuit || Object.keys(suitCounts)[0] || null;
    }

    // Determine status
    let status = '';
    if (roundName === 'flop') {
        if (maxSuitCount >= 3) {
            // Board has 3 cards of one suit
            if (isSuited && primarySuit && holeSuits[0] === primarySuit) {
                status = `e${suitCounts[primarySuit] + 2}`;
            } else if (!isSuited && primarySuit && holeSuits.includes(primarySuit)) {
                const idx = holeSuits.indexOf(primarySuit);
                const count = suitCounts[primarySuit] + 1;
                if (count >= 3) { // Require 3+ for flush draw
                    if (idx === 0 && handRanks[0] < handRanks[1]) { // Higher rank = lower index
                        status = `d${count}`;
                    } else {
                        status = `c${count}`;
                    }
                } else {
                    status = 'a';
                }
            } else {
                status = 'a';
            }
        } else if (maxSuitCount === 2 && primarySuit) {
            // Board has 2 cards of one suit
            if (isSuited && holeSuits[0] === primarySuit) {
                status = `e${suitCounts[primarySuit] + 2}`; // e4
            } else if (!isSuited && holeSuits.includes(primarySuit)) {
                const idx = holeSuits.indexOf(primarySuit);
                const count = suitCounts[primarySuit] + 1;
                if (count >= 3) { // Require 3+ for flush draw
                    if (idx === 0 && handRanks[0] < handRanks[1]) {
                        status = `d${count}`;
                    } else {
                        status = `c${count}`;
                    }
                } else {
                    if (hasNutFlushBlocker(holeCards, boardCards, primarySuit)) {
                        status = 'B2';
                    } else {
                        status = 'b2';
                    }
                }
            } else {
                if (hasNutFlushBlocker(holeCards, boardCards, primarySuit)) {
                    status = 'B2';
                } else {
                    status = 'b2';
                }
            }
        } else if (maxSuitCount === 1 && primarySuit) {
            // Rainbow board with one matching suit
            if (isSuited && holeSuits[0] === primarySuit) {
                const count = suitCounts[primarySuit] + 2;
                if (count >= 3) { // Require 3+ for flush draw
                    status = `e${count}`;
                } else {
                    if (hasNutFlushBlocker(holeCards, boardCards, primarySuit)) {
                        status = 'B1';
                    } else {
                        status = 'b1';
                    }
                }
            } else if (!isSuited && holeSuits.includes(primarySuit)) {
                const idx = holeSuits.indexOf(primarySuit);
                const count = suitCounts[primarySuit] + 1;
                if (count >= 3) { // Require 3+ for flush draw
                    if (idx === 0 && handRanks[0] < handRanks[1]) {
                        status = `d${count}`;
                    } else {
                        status = `c${count}`;
                    }
                } else {
                    if (hasNutFlushBlocker(holeCards, boardCards, primarySuit)) {
                        status = 'B1';
                    } else {
                        status = 'b1';
                    }
                }
            } else {
                if (hasNutFlushBlocker(holeCards, boardCards, primarySuit)) {
                    status = 'B1';
                } else {
                    status = 'b1';
                }
            }
        } else {
            // No suits on board or no matching suits
            status = 'b1';
        }
    } else if (roundName === 'turn') {
        if (maxSuitCount >= 3) {
            // Board has 3+ cards of one suit
            if (isSuited && primarySuit && holeSuits[0] === primarySuit) {
                const count = suitCounts[primarySuit] + 2;
                if (count >= 3) { // Require 3+ for flush draw
                    status = `e${count}`;
                } else {
                    status = 'a';
                }
            } else if (!isSuited && primarySuit && holeSuits.includes(primarySuit)) {
                const idx = holeSuits.indexOf(primarySuit);
                const count = suitCounts[primarySuit] + 1;
                if (count >= 3) { // Require 3+ for flush draw
                    if (idx === 0 && handRanks[0] < handRanks[1]) {
                        status = `d${count}`;
                    } else {
                        status = `c${count}`;
                    }
                } else {
                    status = 'a';
                }
            } else {
                status = 'a';
            }
        } else if (maxSuitCount === 2) {
            if (suitsWithTwo === 1) {
                // Single suit with 2 cards
                if (isSuited && primarySuit && holeSuits[0] === primarySuit) {
                    const count = suitCounts[primarySuit] + 2;
                    if (count >= 3) { // Require 3+ for flush draw
                        status = `e${count}`;
                    } else {
                        if (hasNutFlushBlocker(holeCards, boardCards, primarySuit)) {
                            status = 'B2';
                        } else {
                            status = 'b2';
                        }
                    }
                } else if (!isSuited && primarySuit && holeSuits.includes(primarySuit)) {
                    const idx = holeSuits.indexOf(primarySuit);
                    const count = suitCounts[primarySuit] + 1;
                    if (count >= 3) { // Require 3+ for flush draw
                        if (idx === 0 && handRanks[0] < handRanks[1]) {
                            status = `d${count}`;
                        } else {
                            status = `c${count}`;
                        }
                    } else {
                        if (hasNutFlushBlocker(holeCards, boardCards, primarySuit)) {
                            status = 'B2';
                        } else {
                            status = 'b2';
                        }
                    }
                } else {
                    if (hasNutFlushBlocker(holeCards, boardCards, primarySuit)) {
                        status = 'B2';
                    } else {
                        status = 'b2';
                    }
                }
            } else if (suitsWithTwo >= 2) {
                // Two suits with 2 cards each
                const twoSuit = Object.keys(suitCounts).find(suit => suitCounts[suit] === 2);
                if (isSuited && twoSuit && holeSuits[0] === twoSuit) {
                    const count = suitCounts[twoSuit] + 2;
                    if (count >= 3) { // Require 3+ for flush draw
                        status = `e${count}`;
                    } else {
                        if (hasNutFlushBlocker(holeCards, boardCards, twoSuit)) {
                            status = 'B22';
                        } else {
                            status = 'b22';
                        }
                    }
                } else if (!isSuited && twoSuit && holeSuits.includes(twoSuit)) {
                    const idx = holeSuits.indexOf(twoSuit);
                    const count = suitCounts[twoSuit] + 1;
                    if (count >= 3) { // Require 3+ for flush draw
                        if (idx === 0 && handRanks[0] < handRanks[1]) {
                            status = `d${count}`;
                        } else {
                            status = `c${count}`;
                        }
                    } else {
                        if (hasNutFlushBlocker(holeCards, boardCards, twoSuit)) {
                            status = 'B22';
                        } else {
                            status = 'b22';
                        }
                    }
                } else {
                    if (hasNutFlushBlocker(holeCards, boardCards, twoSuit)) {
                        status = 'B22';
                    } else {
                        status = 'b22';
                    }
                }
            }
        } else {
            // No flush possible
            status = 'b0';
        }
    } else if (roundName === 'river') {
        if (maxSuitCount >= 4) {
            // Board has 4+ cards of one suit
            if (isSuited && primarySuit && holeSuits[0] === primarySuit) {
                const count = suitCounts[primarySuit] + 2;
                if (count >= 5) { // Require 5+ for flush
                    status = `e${count}`;
                } else {
                    status = 'a';
                }
            } else if (!isSuited && primarySuit && holeSuits.includes(primarySuit)) {
                const idx = holeSuits.indexOf(primarySuit);
                const count = suitCounts[primarySuit] + 1;
                if (count >= 5) { // Require 5+ for flush
                    if (idx === 0 && handRanks[0] < handRanks[1]) {
                        status = `d${count}`;
                    } else {
                        status = `c${count}`;
                    }
                } else {
                    status = 'a';
                }
            } else {
                status = 'a';
            }
        } else {
            // No flush possible
            status = 'b0';
        }
    }

    // Return suit-abstracted hand representation
    return `${handNotation}${boardNotation}${status}`;
}//»

// Generate and output the structure
//const pokerHands = generatePokerHands();
//console.log(JSON.stringify(pokerHands, null, 2));

//Commands«
//const com_

const com_poker = class extends Com{
init(){
}
run(){
const {args}=this;
const types=['live', 'random', 'foldbot', 'shovebot', 'expert'];
if (args.length < 2 || args.length > 10){
return this.no("need 2-10 args, each one of: live|random|foldbot|shovebot|expert");
}

for (let arg of args){
    if (!types.includes(arg)){
        return this.no(`Unknwn type: '${arg}'`);
    }
}
LOTW.Desk.api.openApp("dev.Poker", {force: true, appArgs: {playerTypes: this.args}});

this.ok();
}
}
const com_genhands = class extends Com{//«
	run(){
const {args} = this;
//try{
let hand = args[0];
const pokerHands = generatePokerHands(hand);
//log(pokerHands);
this.out(pokerHands);
//log(pokerHands);
//log(pokerHands.AKo.AKAAKb1);
/*
log(pokerHands.AKo.AKAAAb);
log(pokerHands.AKo.AKAAAc);
log(pokerHands.AKo.AKAAAd);
*/
//let
/*
a) The hole has no suited connections with a board that has a flush draw.
b) The hole has no suited connections with a board that has no flush draw.
c) A suit-connected hole+board such that the lowest ranked suit connects with the board's suits.
d) A suit-connected hole+board such that the highest ranked suit connects with the board's suits. This option will be used in the case the hole cards are the same rank (a pair).
e) A suit-connected hole+board, such that both hole cards connect with the board's suits.
*/
//log(pokerHands.AA.AAAAKd);
/*
let hand_no_suit = hand.replace(/[so]$/, "");
for (let c of ["a", "b", "c3", "d3", "e3"]){

log(c, pokerHands[hand][`${hand_no_suit}432${c}`]);
}
*/
//log(pokerHands[hand]["22222b"]);
//log("", pokerHands[hand][hand+"432b"]);
//log("", pokerHands[hand][hand+"432c"]);
//log("", pokerHands[hand][hand+"432d"]);
//log("", pokerHands[hand][hand+"432e"]);
//log(pokerHands[hand].AA432b);
//log(pokerHands[hand].AA432d);
//this.out(JSON.stringify(pokerHands));

this.ok();
//}
//catch(e){
//	this.no(e.message);
//}
	}
}//»
const com_hand2abs = class extends Com{//«
	run(){
		const {args} = this;
		try{
			let rep = getSuitAbstractedHand(args);
			this.out(rep);
			this.ok();
		}
		catch(e){
			this.no(e.message);
		}
	}
}//»

//»

const coms = {//«
	poker: com_poker,
	hand2abs: com_hand2abs,
	genhands: com_genhands
}//»

export {coms};









/*OLD«

const getSuitAbstractedHand=(cards)=>{//«
    // Validate input: 5 (flop), 6 (turn), or 7 (river) cards
    if (!cards || ![5, 6, 7].includes(cards.length)) {
        throw new Error('Input must be 5, 6, or 7 cards (hole + board)');
    }

    // Constants for ranks and suits
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const suits = ['s', 'h', 'd', 'c'];

    // Split into hole and board cards
    const holeCards = cards.slice(0, 2); // First two cards are hole cards
    const boardCards = cards.slice(2).sort((a, b) => ranks.indexOf(a[0]) - ranks.indexOf(b[0])); // Sort board by rank
    const roundName = cards.length === 5 ? 'flop' : cards.length === 6 ? 'turn' : 'river';

    // Validate cards
    for (let card of cards) {
        if (!ranks.includes(card[0]) || !suits.includes(card[1])) {
            throw new Error(`Invalid card: ${card}`);
        }
    }

    // Extract hand notation
    const isSuited = holeCards[0][1] === holeCards[1][1];
    const handRanks = holeCards.map(card => ranks.indexOf(card[0])).sort((a, b) => a - b); // Sort by index (high to low)
//  const handNotation = ranks[handRanks[0]] + ranks[handRanks[1]] + (isSuited ? 's' : 'o');
  	const handNotation = ranks[handRanks[0]] + ranks[handRanks[1]];

    // Get board notation (distinct ranks, sorted high to low)
    const boardRanks = boardCards.map(card => card[0]);
    const distinctBoardRanks = [...new Set(boardRanks)].sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b));
    const boardNotation = distinctBoardRanks.join('');

    // Count suits on the board
    const suitCounts = {};
    const boardSuits = boardCards.map(card => card[1]);
    boardSuits.forEach(suit => {
        suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    });
    const maxSuitCount = Math.max(...Object.values(suitCounts), 0);
    const suitsWithTwo = Object.values(suitCounts).filter(count => count === 2).length;

    // Helper: Check if flush is possible for any player
    const isFlushPossible = (round, suitCount) => {
        if (round === 'flop') return suitCount >= 3;
        if (round === 'turn') return suitCount >= 3;
        if (round === 'river') return suitCount >= 4;
        return false;
    };

    // Helper: Check for nut flush blocker
    const hasNutFlushBlocker = (holeCards, boardCards, targetSuit) => {
        const boardRanksInSuit = boardCards.filter(card => card[1] === targetSuit).map(card => ranks.indexOf(card[0]));
        const maxBoardRank = boardRanksInSuit.length ? Math.min(...boardRanksInSuit) : Infinity; // Lower index = higher rank
        const holeRanksInSuit = holeCards.filter(card => card[1] === targetSuit).map(card => ranks.indexOf(card[0]));
        return holeRanksInSuit.includes(0); // Only Ace (index 0) is nut flush blocker
    };

    // Determine status
    let status = '';
    if (isFlushPossible(roundName, maxSuitCount)) {
        // Board has flush potential (3+ cards on flop/turn, 4+ on river)
        const primarySuit = Object.keys(suitCounts).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b, null);
        const holeSuits = holeCards.map(card => card[1]);

        if (isSuited && holeSuits[0] === primarySuit) {
            // Suited hand connects to primary suit
            const count = suitCounts[primarySuit] + 2;
            if ((roundName === 'flop' && count >= 3) || (roundName === 'turn' && count >= 4) || (roundName === 'river' && count >= 5)) {
                status = `e${count}`;
            }
        } else if (!isSuited && holeSuits.includes(primarySuit)) {
            // One hole card connects to primary suit
            const idx = holeSuits.indexOf(primarySuit);
            const count = suitCounts[primarySuit] + 1;
            if ((roundName === 'flop' && count >= 3) || (roundName === 'turn' && count >= 4) || (roundName === 'river' && count >= 5)) {
                if (idx === 0 && handRanks[0] < handRanks[1]) { // Higher rank = lower index
                    status = `d${count}`;
                } else {
                    status = `c${count}`;
                }
            }
        } else {
            // No hole cards connect to primary suit
            status = 'a';
        }
    } else {
        // No flush possible for player, check opponent flush potential
        if (roundName === 'flop') {
            if (maxSuitCount <= 1) { // Rainbow board
                const primarySuit = Object.keys(suitCounts)[0] || null;
                if (primarySuit && hasNutFlushBlocker(holeCards, boardCards, primarySuit)) {
                    status = 'B1';
                } else {
                    status = 'b1';
                }
            }
        } else if (roundName === 'turn') {
            if (maxSuitCount <= 1) {
                status = 'b0';
            } else if (maxSuitCount === 2 && suitsWithTwo === 1) {
                const primarySuit = Object.keys(suitCounts).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b, null);
                if (hasNutFlushBlocker(holeCards, boardCards, primarySuit)) {
                    status = 'B2';
                } else {
                    status = 'b2';
                }
            } else if (maxSuitCount === 2 && suitsWithTwo >= 2) {
                const primarySuit = Object.keys(suitCounts).find(suit => suitCounts[suit] === 2);
                if (hasNutFlushBlocker(holeCards, boardCards, primarySuit)) {
                    status = 'B22';
                } else {
                    status = 'b22';
                }
            }
        } else if (roundName === 'river') {
            status = 'b0'; // No flush possible with max 2 cards of a suit
        }
    }

    // Return suit-abstracted hand representation
    return `${handNotation}${boardNotation}${status}`;
}//»

const generatePokerHands = (startingHand) => {//«

	// Constants for ranks, suits, and iteration limit«
	const result = {};
	const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
	const suits = ['s', 'h', 'd', 'c'];
	const MAX_ITERATIONS = 5000000;
	let iterationCount = 0;

	// Validate starting hand (e.g., "AA", "AKs", "AKo")
	if (!startingHand || startingHand.length < 2 || startingHand.length > 3 ||
		!ranks.includes(startingHand[0]) || !ranks.includes(startingHand[1])) {
		throw new Error('Invalid starting hand format');
	}
	const isPair = startingHand[0] === startingHand[1];
	if (isPair && startingHand.length !== 2) {
		throw new Error('Pairs must have exactly 2 characters');
	}
	if (!isPair && startingHand.length !== 3) {
		throw new Error('Non-pairs must have exactly 3 characters');
	}
	if (!isPair && !['s', 'o'].includes(startingHand[2])) {
		throw new Error('Non-pairs must end with s or o');
	}

	// Extract base hole cards and suitedness
	const isSuited = startingHand.includes('s');
	const baseHole = startingHand.slice(0, 2);
	const sortedHole = ranks.indexOf(baseHole[0]) <= ranks.indexOf(baseHole[1]) ? baseHole : baseHole[1] + baseHole[0];
//»
	// Helper: Count distinct ranks in the board«
	const getDistinctBoardRanks = (board) => {
		return new Set(board.split('')).size;
	};
//»
	// Helper: Get max possible suit-connecting cards«
	// - For suited hands: 2 hole cards + distinct board ranks
	// - For unsuited: 1 hole card + distinct board ranks
	const getMaxSuits = (board) => {
		const distinctBoardRanks = getDistinctBoardRanks(board);
		return isSuited ? distinctBoardRanks + 2 : distinctBoardRanks + 1;
	};
//»
	// Helper: Validate if a suit count is possible for the round«
	const isValidSuitCount = (round, suitCount) => {
		if (round === 'flop') return suitCount === 3;
		if (round === 'turn') return suitCount >= 4;
		if (round === 'river') return suitCount >= 4; // 4 for draw, 5+ for flush
		return false;
	};
//»
	// Helper: Assign valid flush statuses based on constraints«
	const assignStatuses = (round, board, maxSuits, prevStatus = '') => {
		const statuses = new Set();
		const prevSuitCount = prevStatus.match(/\d$/) ? parseInt(prevStatus.match(/\d$/)[0]) : 0;

		// Always include 'a' (board-driven flush draw) and 'b' (no flush draw)
		// - 'a' requires enough distinct ranks (4 on turn, 5 on river for draw)
		const totalDistinctRanks = new Set([...baseHole.split(''), ...board.split('')]).size;
		const minDistinctRanks = round === 'river' ? 5 : round === 'turn' ? 4 : 3;
		if (totalDistinctRanks >= minDistinctRanks) statuses.add('a');
		statuses.add('b');

		// Handle unsuited hands (c: lower rank connects, d: higher rank or pair)
		if (!isSuited) {
			if (!isPair && totalDistinctRanks >= minDistinctRanks) {
				if (round === 'flop' && (!prevStatus || prevStatus === 'c3') && isValidSuitCount(round, 3)) {
					if (maxSuits >= 3) statuses.add('c3');
				} else if ((round === 'turn' || round === 'river') && (!prevStatus || prevStatus === 'c3') && isValidSuitCount(round, 4)) {
					if (maxSuits >= 4) statuses.add('c4');
					if (round === 'river' && maxSuits >= 5) statuses.add('c5');
				}
			}
			if (totalDistinctRanks >= minDistinctRanks) {
				if (round === 'flop' && (!prevStatus || prevStatus === 'd3') && isValidSuitCount(round, 3)) {
					if (maxSuits >= 3) statuses.add('d3');
				} else if ((round === 'turn' || round === 'river') && (!prevStatus || prevStatus === 'd3') && isValidSuitCount(round, 4)) {
					if (maxSuits >= 4) statuses.add('d4');
					if (round === 'river' && maxSuits >= 5) statuses.add('d5');
				}
			}
			return Array.from(statuses);
		}

		// Handle suited hands (e: both hole cards connect)
		if (totalDistinctRanks >= minDistinctRanks) {
			if (round === 'flop' && (!prevStatus || prevStatus === 'e3') && isValidSuitCount(round, 3)) {
				if (maxSuits >= 3) statuses.add('e3');
			} else if (round === 'turn' && prevStatus === 'e3' && isValidSuitCount(round, 4)) {
				if (maxSuits >= 4) statuses.add('e4');
				if (maxSuits >= 5) statuses.add('e5');
				if (maxSuits >= 6) statuses.add('e6');
			} else if (round === 'river' && prevStatus.startsWith('e')) {
				if (prevSuitCount === 3 && maxSuits >= 4) statuses.add('e4');
				if ((prevSuitCount === 3 || prevSuitCount === 4) && maxSuits >= 5) statuses.add('e5');
				if ((prevSuitCount === 3 || prevSuitCount === 4 || prevSuitCount === 5) && maxSuits >= 6) statuses.add('e6');
				if ((prevSuitCount === 3 || prevSuitCount === 4 || prevSuitCount === 5 || prevSuitCount === 6) && maxSuits >= 7) statuses.add('e7');
			}
		}
		return Array.from(statuses);
	};//»

	// Generate all possible flops«
	const generateFlops = () => {
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in generateFlops');
		}

		const flops = {};
		const usedRanks = baseHole.split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

		for (let i = 0; i < availableRanks.length; i++) {
			for (let j = i; j < availableRanks.length; j++) {
				for (let k = j; k < availableRanks.length; k++) {
					const flopRanks = [availableRanks[i], availableRanks[j], availableRanks[k]];
					const combinedRanks = [...usedRanks, ...flopRanks];
					if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
					const sortedFlop = flopRanks.sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
					const maxSuits = getMaxSuits(sortedFlop);
					const flushStatuses = assignStatuses('flop', sortedFlop, maxSuits);
					for (let status of flushStatuses) {
						const flopKey = baseHole + sortedFlop + status;
						if (flopKey.length === 6 || flopKey.length === 7) {
							flops[flopKey] = generateTurns(flopKey);
						}
					}
				}
			}
		}
		return flops;
	};//»
	// Generate all possible turns for a given flop«
	const generateTurns = (flopKey) => {
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in generateTurns');
		}

		const turns = {};
		const usedRanks = flopKey.replace(/[soa-e0-7]/g, '').split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);
		const prevStatus = flopKey.match(/[a-e][0-7]?$/)[0];

		for (let i = 0; i < availableRanks.length; i++) {
			const turnCard = availableRanks[i];
			const board = flopKey.slice(2, 5) + turnCard;
			const combinedRanks = [...usedRanks, turnCard];
			if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
			const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
			const maxSuits = getMaxSuits(sortedBoard);
			const flushStatuses = assignStatuses('turn', sortedBoard, maxSuits, prevStatus);
			for (let status of flushStatuses) {
				const turnKey = baseHole + sortedBoard + status;
				turns[turnKey] = generateRivers(turnKey);
			}
		}
		return turns;
	};//»
	// Generate all possible rivers for a given turn«
	const generateRivers = (turnKey) => {
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in generateRivers');
		}

		const rivers = [];
		const usedRanks = turnKey.replace(/[soa-e0-7]/g, '').split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);
		const prevStatus = turnKey.match(/[a-e][0-7]?$/)[0];

		for (let i = 0; i < availableRanks.length; i++) {
			const riverCard = availableRanks[i];
			const board = turnKey.slice(2, 6) + riverCard;
			const combinedRanks = [...usedRanks, riverCard];
			if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
			const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
			const maxSuits = getMaxSuits(sortedBoard);
			const flushStatuses = assignStatuses('river', sortedBoard, maxSuits, prevStatus);
			for (let status of flushStatuses) {
				const riverKey = baseHole + sortedBoard + status;
				rivers.push(riverKey);
			}
		}
		return rivers;
	};//»

	// Generate the tree for the sorted starting hand
	result[sortedHole] = generateFlops();
	return result;
};//»
const generatePokerHands = (startingHand) => {//«
	const result = {};
	const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
	const suits = ['s', 'h', 'd', 'c'];
	const MAX_ITERATIONS = 5000000; // Infinite loop protection limit
	let iterationCount = 0;

	const isSuited = startingHand.includes('s');

	const getFlushStatuses = (hole, board) => {
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in getFlushStatuses');
		}
		const totCards = 2 + board.length;
		const isTurn = totCards === 6;
		const isRiver = totCards === 7;
		const holeRanks = hole.replace(/[so]/g, '').split('');
		const holeIsPair = holeRanks[0] == holeRanks[1];
		const boardRanks = board.split('');
		const boardSuitCount = isTurn ? 4 : 3;
		const boardHasPairOrMore = boardRanks.some(r => boardRanks.filter(br => br === r).length >= 2);
		const boardHasTripsOrMore = boardRanks.some(r => boardRanks.filter(br => br === r).length >= 3);
		const boardHasQuads = boardRanks.some(r => boardRanks.filter(br => br === r).length >= 4);
		const allRanks = [...holeRanks, ...boardRanks];
		const distinctRanks = new Set(allRanks).size;
		const minDistinctRanks = isRiver ? 5 : isTurn ? 4 : 3; // 4 for flop/turn, 5 for river
		const statuses = new Set();

		// Deterministic flush status assignment
		if (!isSuited) {
			// For unsuited hands (e.g., AA, AKo), include 'a' (flush draw, no connection) and 'b' (no flush draw)
			if (!boardHasPairOrMore && distinctRanks >= minDistinctRanks) statuses.add('a');
			statuses.add('b');
			if (!holeIsPair && distinctRanks >= minDistinctRanks) statuses.add('c');//Only non-pairs get c
			if (distinctRanks >= minDistinctRanks) statuses.add('d');//Pairs and non-pairs get d
			return Array.from(statuses);
		}

		// Always include 'a' (no suited connection, flush draw) if no pair/trips
		if (!boardHasPairOrMore && distinctRanks >= minDistinctRanks) statuses.add('a');
		statuses.add('b'); // Always include 'b' (no flush draw)
		if ((totCards === 5 && !boardHasPairOrMore) || (totCards === 6 && !boardHasTripsOrMore) || (totCards === 7  && !boardHasQuads)) {
			if (distinctRanks >= minDistinctRanks) statuses.add('e');
		}
		return Array.from(statuses);
	};

	const generateFlops = (hole) => {
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in generateFlops');
		}

		const flops = {};
		const usedRanks = hole.replace(/[so]/g, '').split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

		for (let i = 0; i < availableRanks.length; i++) {
			for (let j = i; j < availableRanks.length; j++) {
				for (let k = j; k < availableRanks.length; k++) {
					const flopRanks = [availableRanks[i], availableRanks[j], availableRanks[k]];
					const combinedRanks = [...usedRanks, ...flopRanks];
					if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
					const sortedFlop = flopRanks.sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
					const flushStatuses = getFlushStatuses(hole, sortedFlop);
					for (let status of flushStatuses) {
						const flopKey = hole.replace(/[so]/g, '') + sortedFlop + status;
						if (flopKey.length === 6) {
							flops[flopKey] = generateTurns(flopKey);
						}
					}
				}
			}
		}
		return flops;
	};

	const generateTurns = (flopKey) => {
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in generateTurns');
		}

		const baseHole = flopKey.slice(0, 2);
		const turns = {};
		const usedRanks = flopKey.replace(/[soa-e]/g, '').split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

		for (let i = 0; i < availableRanks.length; i++) {
			const turnCard = availableRanks[i];
			const board = flopKey.slice(2, 5) + turnCard;
			const combinedRanks = [...usedRanks, turnCard];
			if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
			const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
			const flushStatuses = getFlushStatuses(baseHole, sortedBoard);
			for (let status of flushStatuses) {
				const turnKey = baseHole + sortedBoard + status;
				turns[turnKey] = generateRivers(turnKey);
			}
		}
		return turns;
	};

	const generateRivers = (turnKey) => {
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in generateRivers');
		}

		const baseHole = turnKey.slice(0, 2);
		const rivers = [];
		const usedRanks = turnKey.replace(/[soa-e]/g, '').split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

		for (let i = 0; i < availableRanks.length; i++) {
			const riverCard = availableRanks[i];
			const board = turnKey.slice(2, 6) + riverCard;
			const combinedRanks = [...usedRanks, riverCard];
			if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
			const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
			const flushStatuses = getFlushStatuses(baseHole, sortedBoard);
			for (let status of flushStatuses) {
				const riverKey = baseHole + sortedBoard + status;
				rivers.push(riverKey);
			}
		}
		return rivers;
	};

	if (startingHand.length >= 2 && ranks.includes(startingHand[0]) && ranks.includes(startingHand[1])) {
		const sortedHole = ranks.indexOf(startingHand[0]) <= ranks.indexOf(startingHand[1]) ? startingHand : startingHand[1] + startingHand[0];
		result[sortedHole] = generateFlops(sortedHole);
	}

	return result;
};//»
const generatePokerHands = (startingHand) => {//«
	const result = {};
	const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
	const suits = ['s', 'h', 'd', 'c'];
	const MAX_ITERATIONS = 1250000; // Infinite loop protection limit
	let iterationCount = 0;

	const isSuited = startingHand.includes('s');

	const getFlushStatuses = (hole, board) => {
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in getFlushStatuses');
		}
		const totCards = 2 + board.length;
		const isTurn = totCards === 6;
		const holeRanks = hole.replace(/[so]/g, '').split('');
		const holeIsPair = holeRanks[0] == holeRanks[1];
		const boardRanks = board.split('');
		const boardSuitCount = isTurn ? 4 : 3;
		const boardHasPairOrMore = boardRanks.some(r => boardRanks.filter(br => br === r).length >= 2);
		const boardHasTripsOrMore = boardRanks.some(r => boardRanks.filter(br => br === r).length >= 3);
		const boardHasQuads = boardRanks.some(r => boardRanks.filter(br => br === r).length >= 4);
		const statuses = new Set();

		// Deterministic flush status assignment
		if (!isSuited) {
			// For unsuited hands (e.g., AA, AKo), include 'a' (flush draw, no connection) and 'b' (no flush draw)
			if (!boardHasPairOrMore) statuses.add('a');
			statuses.add('b');
			if (!holeIsPair) statuses.add('c');//Only non-pairs get c
			statuses.add('d');//Pairs and non-pairs get d
			return Array.from(statuses);
		}

		// Always include 'a' (no suited connection, flush draw) if no pair/trips
		if (!boardHasPairOrMore) statuses.add('a');
		statuses.add('b'); // Always include 'b' (no flush draw)
		if ((totCards === 5 && !boardHasPairOrMore) || (totCards === 6 && !boardHasTripsOrMore) || (totCards === 7  && !boardHasQuads)) {
			statuses.add('e');
		}
		return Array.from(statuses);
	};

	const generateFlops = (hole) => {
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in generateFlops');
		}

		const flops = {};
		const usedRanks = hole.replace(/[so]/g, '').split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

		for (let i = 0; i < availableRanks.length; i++) {
			for (let j = i; j < availableRanks.length; j++) {
				for (let k = j; k < availableRanks.length; k++) {
					const flopRanks = [availableRanks[i], availableRanks[j], availableRanks[k]];
					const combinedRanks = [...usedRanks, ...flopRanks];
					if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
					const sortedFlop = flopRanks.sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
					const flushStatuses = getFlushStatuses(hole, sortedFlop);
					for (let status of flushStatuses) {
						const flopKey = hole.replace(/[so]/g, '') + sortedFlop + status;
						if (flopKey.length === 6) {
							flops[flopKey] = generateTurns(flopKey);
						}
					}
				}
			}
		}
		return flops;
	};

	const generateTurns = (flopKey) => {
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in generateTurns');
		}

		const baseHole = flopKey.slice(0, 2);
		const turns = {};
		const usedRanks = flopKey.replace(/[soa-e]/g, '').split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

		for (let i = 0; i < availableRanks.length; i++) {
			const turnCard = availableRanks[i];
			const board = flopKey.slice(2, 5) + turnCard;
			const combinedRanks = [...usedRanks, turnCard];
			if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
			const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
			const flushStatuses = getFlushStatuses(baseHole, sortedBoard);
			for (let status of flushStatuses) {
				const turnKey = baseHole + sortedBoard + status;
				turns[turnKey] = generateRivers(turnKey);
			}
		}
		return turns;
	};

	const generateRivers = (turnKey) => {
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in generateRivers');
		}

		const baseHole = turnKey.slice(0, 2);
		const rivers = [];
		const usedRanks = turnKey.replace(/[soa-e]/g, '').split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

		for (let i = 0; i < availableRanks.length; i++) {
			const riverCard = availableRanks[i];
			const board = turnKey.slice(2, 6) + riverCard;
			const combinedRanks = [...usedRanks, riverCard];
			if (combinedRanks.some(r => combinedRanks.filter(cr => cr === r).length > 4)) continue;
			const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
			const flushStatuses = getFlushStatuses(baseHole, sortedBoard);
			for (let status of flushStatuses) {
				const riverKey = baseHole + sortedBoard + status;
				rivers.push(riverKey);
			}
		}
		return rivers;
	};

	if (startingHand.length >= 2 && ranks.includes(startingHand[0]) && ranks.includes(startingHand[1])) {
		const sortedHole = ranks.indexOf(startingHand[0]) <= ranks.indexOf(startingHand[1]) ? startingHand : startingHand[1] + startingHand[0];
		result[sortedHole] = generateFlops(sortedHole);
	}

	return result;
};//»
const generatePokerHands = (startingHand) => {//«
	const result = {};
	const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
	const suits = ['s', 'h', 'd', 'c'];
	const MAX_ITERATIONS = 1250000; // Infinite loop protection limit
	let iterationCount = 0;

	const isSuited = startingHand.includes('s');

	const getFlushStatuses = (hole, board) => {//«
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in getFlushStatuses');
		}
		const totCards = 2 + board.length;
		const isTurn = totCards === 6;
		const holeRanks = hole.replace(/[so]/g, '').split('');
		const holeIsPair = holeRanks[0] == holeRanks[1];
		const boardRanks = board.split('');
		const boardSuitCount = isTurn ? 4 : 3;
		const boardHasPairOrMore = boardRanks.some(r => boardRanks.filter(br => br === r).length >= 2);
		const boardHasTripsOrMore = boardRanks.some(r => boardRanks.filter(br => br === r).length >= 3);
		const boardHasQuads = boardRanks.some(r => boardRanks.filter(br => br === r).length >= 4);
		const statuses = new Set();

		// Deterministic flush status assignment
		if (!isSuited) {
			// For unsuited hands (e.g., AA, AKo), include 'a' (flush draw, no connection) and 'b' (no flush draw)
			if (!boardHasPairOrMore) statuses.add('a');
			statuses.add('b');
			if (!holeIsPair) statuses.add('c');//Only non-pairs get c
			statuses.add('d');//Pairs and non-pairs get d
			return Array.from(statuses);
		}

		// Always include 'a' (no suited connection, flush draw) if no pair/trips
		if (!boardHasPairOrMore) statuses.add('a');
		statuses.add('b'); // Always include 'b' (no flush draw)
		if ((totCards === 5 && !boardHasPairOrMore) || (totCards === 6 && !boardHasTripsOrMore) || (totCards === 7  && !boardHasQuads)) {
			statuses.add('e');
		}
		return Array.from(statuses);
	};//»

	const generateRivers = (turnKey) => {//«
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in generateRivers');
		}

		const baseHole = turnKey.slice(0, 2);

		const rivers = [];
		const usedRanks = turnKey.replace(/[soa-e]/g, '').split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);
		for (let i = 0; i < availableRanks.length; i++) {
			const riverCard = availableRanks[i];
			const board = turnKey.slice(2, 6) + riverCard;
			const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
			const flushStatuses = getFlushStatuses(baseHole, sortedBoard);
			for (let status of flushStatuses) {
				const riverKey = baseHole + sortedBoard + status;
				rivers.push(riverKey);
			}
		}
		return rivers;
	};//»
	const generateTurns = (flopKey) => {//«
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in generateTurns');
		}

		const baseHole = flopKey.slice(0, 2);

		const turns = {};
		const usedRanks = flopKey.replace(/[soa-e]/g, '').split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

		for (let i = 0; i < availableRanks.length; i++) {
			const turnCard = availableRanks[i];
			const board = flopKey.slice(2, 5) + turnCard;
			const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
			const flushStatuses = getFlushStatuses(baseHole, sortedBoard);
			for (let status of flushStatuses) {
				const turnKey = baseHole + sortedBoard + status;
				turns[turnKey] = generateRivers(turnKey);
			}
		}
		return turns;
	};//»
	const generateFlops = (hole) => {//«
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in generateFlops');
		}

		const flops = {};
		const usedRanks = hole.replace(/[so]/g, '').split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

		for (let i = 0; i < availableRanks.length; i++) {
			for (let j = i; j < availableRanks.length; j++) {
				for (let k = j; k < availableRanks.length; k++) {
					const flopRanks = [availableRanks[i], availableRanks[j], availableRanks[k]];
					const sortedFlop = flopRanks.sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
					const flushStatuses = getFlushStatuses(hole, sortedFlop);
					for (let status of flushStatuses) {
						const flopKey = hole.replace(/[so]/g, '') + sortedFlop + status;
						if (flopKey.length === 6) {
							flops[flopKey] = generateTurns(flopKey);
						}
					}
				}
			}
		}
		return flops;
	};//»

	if (startingHand.length >= 2 && ranks.includes(startingHand[0]) && ranks.includes(startingHand[1])) {
		const sortedHole = ranks.indexOf(startingHand[0]) <= ranks.indexOf(startingHand[1]) ? startingHand : startingHand[1] + startingHand[0];
		result[sortedHole] = generateFlops(sortedHole);
	}

	return result;
};//»
const generatePokerHands = (startingHand) => {//«
	const result = {};
	const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
	const suits = ['s', 'h', 'd', 'c'];
	const MAX_ITERATIONS = 2000000; // Adjusted for offsuit non-pair complexity
	let iterationCount = 0;

	const isSuited = startingHand.includes('s');
	const bettingActions = ['fold', 'call', 'raise']; // Simple betting actions

	const getFlushStatuses = (hole, board) => {
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in getFlushStatuses');
		}

		const totCards = 2 + board.length;
		const isTurn = totCards === 6;
		const isRiver = totCards === 7;
		const holeRanks = hole.replace(/[so]/g, '').split('');
		const holeIsPair = holeRanks[0] === holeRanks[1];
		const boardRanks = board.split('');
		const boardHasPairOrMore = boardRanks.some(r => boardRanks.filter(br => br === r).length >= 2);
		const boardHasTripsOrMore = boardRanks.some(r => boardRanks.filter(br => br === r).length >= 3);
		const boardHasQuads = boardRanks.some(r => boardRanks.filter(br => br === r).length >= 4);

		const statuses = new Set();

		// Unsuited hands (e.g., AA, AKo)
		if (!isSuited) {
			if (!boardHasPairOrMore) statuses.add('a');
			statuses.add('b');
			if (!holeIsPair) {
				statuses.add('c');
				statuses.add('d');
			}
			if (holeIsPair) statuses.add('d');
			return Array.from(statuses);
		}

		// Suited hands (e.g., AKs, AAs)
		if (!boardHasPairOrMore) statuses.add('a');
		statuses.add('b');
		if ((totCards === 5 && !boardHasPairOrMore) || (totCards === 6 && !boardHasTripsOrMore) || (totCards === 7 && !boardHasQuads)) {
			statuses.add('e');
		}
		if (!holeIsPair) {
			if (ranks.indexOf(holeRanks[0]) < ranks.indexOf(holeRanks[1])) {
				statuses.add('c');
				statuses.add('d');
			} else {
				statuses.add('d');
				statuses.add('c');
			}
		}
		if (holeIsPair) statuses.add('d');

		return Array.from(statuses);
	};

	const generateFlops = (hole) => {
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in generateFlops');
		}

		const flops = {};
		const usedRanks = hole.replace(/[so]/g, '').split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

		for (let i = 0; i < availableRanks.length; i++) {
			for (let j = i; j < availableRanks.length; j++) {
				for (let k = j; k < availableRanks.length; k++) {
					const flopRanks = [availableRanks[i], availableRanks[j], availableRanks[k]];
					const sortedFlop = flopRanks.sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
					const flushStatuses = getFlushStatuses(hole, sortedFlop);
					for (let status of flushStatuses) {
						const flopKey = hole.replace(/[so]/g, '') + sortedFlop + status;
						if (flopKey.length === 6) {
							const bettingNodes = {};
							for (let action of bettingActions) {
								bettingNodes[action] = generateTurns(flopKey);
							}
							flops[flopKey] = { chance: sortedFlop, betting: bettingNodes };
						}
					}
				}
			}
		}
		return flops;
	};

	const generateTurns = (flopKey) => {
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in generateTurns');
		}

		const baseHole = flopKey.slice(0, 2);
		const turns = {};
		const usedRanks = flopKey.replace(/[soa-e]/g, '').split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

		for (let i = 0; i < availableRanks.length; i++) {
			const turnCard = availableRanks[i];
			const board = flopKey.slice(2, 5) + turnCard;
			const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
			const flushStatuses = getFlushStatuses(baseHole, sortedBoard);
			for (let status of flushStatuses) {
				const turnKey = baseHole + sortedBoard + status;
				const bettingNodes = {};
				for (let action of bettingActions) {
					bettingNodes[action] = generateRivers(turnKey);
				}
				turns[turnKey] = { chance: sortedBoard, betting: bettingNodes };
			}
		}
		return turns;
	};

	const generateRivers = (turnKey) => {
		if (++iterationCount > MAX_ITERATIONS) {
			throw new Error('Infinite loop detected in generateRivers');
		}

		const baseHole = turnKey.slice(0, 2);
		const rivers = [];
		const usedRanks = turnKey.replace(/[soa-e]/g, '').split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

		for (let i = 0; i < availableRanks.length; i++) {
			const riverCard = availableRanks[i];
			const board = turnKey.slice(2, 6) + riverCard;
			const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
			const flushStatuses = getFlushStatuses(baseHole, sortedBoard);
			for (let status of flushStatuses) {
				const riverKey = baseHole + sortedBoard + status;
				const bettingNodes = {};
				for (let action of bettingActions) {
					bettingNodes[action] = { terminal: true, outcome: action === 'fold' ? 'fold' : 'showdown' };
				}
				rivers.push({ chance: riverKey, betting: bettingNodes });
			}
		}
		return rivers;
	};

	if (startingHand.length >= 2 && ranks.includes(startingHand[0]) && ranks.includes(startingHand[1])) {
		const sortedHole = ranks.indexOf(startingHand[0]) <= ranks.indexOf(startingHand[1]) ? startingHand : startingHand[1] + startingHand[0];
		const preflopBetting = {};
		for (let action of bettingActions) {
			preflopBetting[action] = generateFlops(sortedHole);
		}
		result[sortedHole] = { chance: sortedHole, betting: preflopBetting };
	}

	return result;
};//»
const generatePokerHands=(startingHand)=>{//«

	const result = {};
	const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

	const generateFlops=(hole)=>{//«
		const flops = {};
		const usedRanks = hole.split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

		// Generate 3-card flops
		for (let i = 0; i < availableRanks.length; i++) {
			for (let j = i; j < availableRanks.length; j++) {
				for (let k = j; k < availableRanks.length; k++) {
					const flop = [availableRanks[i], availableRanks[j], availableRanks[k]].sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
					const flopKey = hole + flop;
					if (flopKey.length === 5) {
						flops[flopKey] = generateTurns(flopKey);
					}
				}
			}
		}

		return flops;
	};//»
	const generateTurns=(flopKey)=>{//«
		const turns = {};
		const usedRanks = flopKey.split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

		// Generate turn card
		for (let i = 0; i < availableRanks.length; i++) {
			const turnCard = availableRanks[i];
			const board = flopKey.slice(2) + turnCard;
			const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
			const turnKey = flopKey.slice(0, 2) + sortedBoard;
			turns[turnKey] = generateRivers(turnKey);
		}
		return turns;
	};//»
	const generateRivers=(turnKey)=>{//«
		const rivers = [];
		const usedRanks = turnKey.split('');
		const availableRanks = ranks.filter(r => usedRanks.filter(u => u === r).length < 4);

		// Generate river card
		for (let i = 0; i < availableRanks.length; i++) {
			const riverCard = availableRanks[i];
			const board = turnKey.slice(2) + riverCard;
			const sortedBoard = board.split('').sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b)).join('');
			const riverKey = turnKey.slice(0, 2) + sortedBoard;
			rivers.push(riverKey);
		}

		return rivers;
	};//»

	// Strip suit designations (e.g., "AKs" -> "AK", "AKo" -> "AK")
	const hole = startingHand.replace(/[so]/g, '');

	// Validate and process hole cards
	if (hole.length === 2 && ranks.includes(hole[0]) && ranks.includes(hole[1])) {
		// Ensure hole cards are sorted (e.g., KA -> AK)
		const sortedHole = ranks.indexOf(hole[0]) <= ranks.indexOf(hole[1]) ? hole : hole[1] + hole[0];
		result[sortedHole] = generateFlops(sortedHole);
	}

	return result;
}//»

function generateAbstractRepresentationsForVariant(holeVariant, round, primaryThreshold, secondaryThreshold) {//«
// Generates unique suit-abstracted representations for a specific hole card variant and round
// Input:
// - holeVariant: e.g., "AA", "Q9o", "AKs"
// - round: "flop" (5 cards), "turn" (6 cards), "river" (7 cards)
// - primaryThreshold: Min cards for "s" (e.g., 3 for flush draws)
// - secondaryThreshold: Min cards for "t" (e.g., 2 for blockers, 0 for none)
// Output: Set of strings (e.g., "Ax9xKxQxJx" for flop, "AsKsQsJs9sTt2t" for river)
// Notes:
// - Flop: ~2544–4338 abstractions per variant (e.g., AA=2544, AKo=4338)
// - Turn: ~30,000–50,000 abstractions (est.)
// - River: ~100,000–200,000 abstractions (est.)
    // Step 1: Validate inputs
    if (typeof holeVariant !== "string" || !/^[2-9TJQKA]{2}[os]?$/.test(holeVariant)) {
        throw new Error("Invalid hole variant format (e.g., 'AA', 'Q9o', 'AKs')");
    }
    if (!["flop", "turn", "river"].includes(round)) {
        throw new Error("Round must be 'flop', 'turn', or 'river'");
    }
    const boardSize = round === "flop" ? 3 : round === "turn" ? 4 : 5;
    if (!Number.isInteger(primaryThreshold) || primaryThreshold < 1 || primaryThreshold > boardSize + 2) {
        throw new Error(`primaryThreshold must be an integer between 1 and ${boardSize + 2}`);
    }
    if (!Number.isInteger(secondaryThreshold) || secondaryThreshold < 0 || secondaryThreshold > boardSize + 2) {
        throw new Error(`secondaryThreshold must be an integer between 0 and ${boardSize + 2}`);
    }
    if (secondaryThreshold > primaryThreshold) {
        throw new Error("secondaryThreshold must not exceed primaryThreshold");
    }

    // Step 2: Parse hole variant and assign canonical real hole cards
    const rank1 = holeVariant[0];
    const rank2 = holeVariant[1];
    const suited = holeVariant[2] === "s";
    const isPair = rank1 === rank2;
    let holeCards;
    if (isPair) {
        holeCards = [`${rank1}d`, `${rank1}h`]; // e.g., AdAh for AA
    } else if (suited) {
        holeCards = [`${rank1}d`, `${rank2}d`]; // e.g., AdKd for AKs
    } else {
        holeCards = [`${rank1}d`, `${rank2}h`]; // e.g., AdKh for AKo
    }

    // Step 3: Define the deck (52 cards)
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
    const suits = ["c", "h", "s", "d"];
    const deck = [];
    for (const rank of ranks) {
        for (const suit of suits) {
            deck.push(rank + suit); // e.g., "Ad", "9h"
        }
    }

    // Step 4: Initialize Set for unique abstract representations
    const abstractSet = new Set();

    // Step 5: Generate board combinations based on round
    const remainingDeck = deck.filter(card => !holeCards.includes(card));
    if (round === "flop") {
        // Flop: C(50, 3) = 19,600 boards
        for (let k = 0; k < remainingDeck.length - 2; k++) {
            for (let l = k + 1; l < remainingDeck.length - 1; l++) {
                for (let m = l + 1; m < remainingDeck.length; m++) {
                    const boardCards = [remainingDeck[k], remainingDeck[l], remainingDeck[m]];
                    const hand = [...holeCards, ...boardCards];
                    const abstractHand = getAbstractRepresentation(hand, primaryThreshold, secondaryThreshold);
                    abstractSet.add(abstractHand);
                }
            }
        }
    } else if (round === "turn") {
        // Turn: C(50, 4) = 230,300 boards
        for (let k = 0; k < remainingDeck.length - 3; k++) {
            for (let l = k + 1; l < remainingDeck.length - 2; l++) {
                for (let m = l + 1; m < remainingDeck.length - 1; m++) {
                    for (let n = m + 1; n < remainingDeck.length; n++) {
                        const boardCards = [remainingDeck[k], remainingDeck[l], remainingDeck[m], remainingDeck[n]];
                        const hand = [...holeCards, ...boardCards];
                        const abstractHand = getAbstractRepresentation(hand, primaryThreshold, secondaryThreshold);
                        abstractSet.add(abstractHand);
                    }
                }
            }
        }
    } else {
        // River: C(50, 5) = 2,118,760 boards
        for (let k = 0; k < remainingDeck.length - 4; k++) {
            for (let l = k + 1; l < remainingDeck.length - 3; l++) {
                for (let m = l + 1; m < remainingDeck.length - 2; m++) {
                    for (let n = m + 1; n < remainingDeck.length - 1; n++) {
                        for (let o = n + 1; o < remainingDeck.length; o++) {
                            const boardCards = [remainingDeck[k], remainingDeck[l], remainingDeck[m], remainingDeck[n], remainingDeck[o]];
                            const hand = [...holeCards, ...boardCards];
                            const abstractHand = getAbstractRepresentation(hand, primaryThreshold, secondaryThreshold);
                            abstractSet.add(abstractHand);
                        }
                    }
                }
            }
        }
    }

    // Step 6: Return unique representations
    return abstractSet;
}//»

// Reuses getAbstractRepresentation with dynamic thresholds and suit precedence
function getAbstractRepresentation(cards, primaryThreshold, secondaryThreshold) {//«
// Converts real hand (2 hole + 3/4/5 board cards) to suit-abstracted representation
// Input:
// - cards: Array of 5-7 strings, each a card (e.g., ["Ad", "Ah", "Js", "9h", "8c"])
// - primaryThreshold: Min cards for primary suit ("s"), e.g., 3 (flush draw), 2 (looser), 4 (stricter)
// - secondaryThreshold: Min cards for secondary suit ("t"), e.g., 2 (blockers), 3 (stricter), 0 (no "t")
// Output: 10/12/14-character string (e.g., "AsAtJs9s8x")
// Notes:
// - primaryThreshold=2, secondaryThreshold=1: Fine-grained, ~700,000+ flop abstractions, detailed flush/blocker tracking
// - primaryThreshold=3, secondaryThreshold=2: Balanced, ~200,000–300,000 flop abstractions, focus on strong flush draws
// - primaryThreshold=4, secondaryThreshold=3: Coarse, ~100,000 flop abstractions, only strong flush/blocker hands
// - secondaryThreshold=0: No "t", simpler trees, fewer abstractions
//log(primaryThreshold, secondaryThreshold);
    // Validate input: ensure 5-7 cards
    if (!Array.isArray(cards) || cards.length < 5 || cards.length > 7) {
        throw new Error("Input must be an array of 5-7 cards");
    }

    // Validate thresholds
    if (!Number.isInteger(primaryThreshold) || primaryThreshold < 1 || primaryThreshold > cards.length) {
        throw new Error(`primaryThreshold must be an integer between 1 and ${cards.length}`);
    }
    if (!Number.isInteger(secondaryThreshold) || secondaryThreshold < 0 || secondaryThreshold > cards.length) {
        throw new Error(`secondaryThreshold must be an integer between 0 and ${cards.length}`);
    }
    if (secondaryThreshold > primaryThreshold) {
        throw new Error("secondaryThreshold must not exceed primaryThreshold");
    }

    // Step 1: Parse cards and check for duplicates
    const parsedCards = [];
    const seenCards = new Set();
    for (const card of cards) {
        if (typeof card !== "string" || card.length < 2) {
            throw new Error(`Invalid card format: ${card}`);
        }
        const rank = card.slice(0, -1);
        const suit = card.slice(-1);
        if (!["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"].includes(rank)) {
            throw new Error(`Invalid rank: ${rank}`);
        }
        if (!["c", "h", "s", "d"].includes(suit)) {
            throw new Error(`Invalid suit: ${suit}`);
        }
        if (seenCards.has(card)) {
            throw new Error(`Duplicate card detected: ${card}`);
        }
        seenCards.add(card);
        parsedCards.push({ rank, suit });
    }

    // Step 2: Order cards (hole cards by rank, then board cards by rank)
    const rankOrder = { "2": 0, "3": 1, "4": 2, "5": 3, "6": 4, "7": 5, "8": 6, "9": 7, 
                        "T": 8, "J": 9, "Q": 10, "K": 11, "A": 12 };
    const holeCards = parsedCards.slice(0, 2).sort((a, b) => rankOrder[b.rank] - rankOrder[a.rank]);
    const boardCards = parsedCards.slice(2).sort((a, b) => rankOrder[b.rank] - rankOrder[a.rank]);
    const orderedCards = [...holeCards, ...boardCards];

    // Step 3: Count suits for primary and secondary suit assignment
    const suitCounts = { c: 0, h: 0, s: 0, d: 0 };
    orderedCards.forEach(card => suitCounts[card.suit]++);

    // Step 4: Find candidate primary and secondary suits by count
    let primarySuit = null;
    let secondarySuit = null;
    let maxCount = 0;
    let secondMaxCount = 0;
    for (const suit of ["c", "h", "s", "d"]) {
        if (suitCounts[suit] > maxCount) {
            secondarySuit = primarySuit;
            secondMaxCount = maxCount;
            primarySuit = suit;
            maxCount = suitCounts[suit];
        } else if (suitCounts[suit] > secondMaxCount && suit !== primarySuit) {
            secondarySuit = suit;
            secondMaxCount = suitCounts[suit];
        }
    }

    // Step 5: Handle tie case by checking order of appearance
    if (maxCount === secondMaxCount && primarySuit && secondarySuit) {
        for (const card of orderedCards) {
            if (card.suit === primarySuit) {
                break;
            } else if (card.suit === secondarySuit) {
                [primarySuit, secondarySuit] = [secondarySuit, primarySuit];
                break;
            }
        }
    }

    // Step 6: Apply dynamic thresholds
    if (!primarySuit || maxCount < primaryThreshold) {
        primarySuit = null;
        secondarySuit = null;
    } else if (secondaryThreshold > 0 && secondMaxCount < secondaryThreshold) {
        secondarySuit = null;
    }

    // Step 7: Group cards by rank to assign suits in precedence order
    const rankGroups = {};
    orderedCards.forEach((card, index) => {
        if (!rankGroups[card.rank]) {
            rankGroups[card.rank] = [];
        }
        rankGroups[card.rank].push({ suit: card.suit, index });
    });

    // Step 8: Assign abstract suits with precedence (s > t > x) within same-rank groups
    const abstractSuits = new Array(cards.length).fill("x");
    if (primarySuit) {
        // Collect all cards eligible for "s" or "t"
        const eligibleCards = [];
        orderedCards.forEach((card, index) => {
            if (card.suit === primarySuit || card.suit === secondarySuit) {
                eligibleCards.push({ suit: card.suit, index, rank: card.rank });
            }
        });

        // Sort cards by rank group, then suit precedence (s > t)
        const sortedByRank = Object.keys(rankGroups).sort((a, b) => rankOrder[b] - rankOrder[a.rank]);
        for (const rank of sortedByRank) {
            const group = rankGroups[rank];
            const groupIndices = group.map(card => card.index);
            const groupSuits = group.map(card => card.suit);

            // Count available "s" and "t" suits in this rank group
            let sCount = groupSuits.filter(suit => suit === primarySuit).length;
            let tCount = secondarySuit ? groupSuits.filter(suit => suit === secondarySuit).length : 0;

            // Assign suits in order: "s" first, then "t", then "x"
            for (const index of groupIndices) {
                if (sCount > 0) {
                    abstractSuits[index] = "s";
                    sCount--;
                } else if (tCount > 0) {
                    abstractSuits[index] = "t";
                    tCount--;
                } else {
                    abstractSuits[index] = "x";
                }
            }
        }
    }

    // Step 9: Build abstract representation
    const abstractCards = orderedCards.map((card, index) => {
        return card.rank + abstractSuits[index];
    });

    // Step 10: Concatenate to 10/12/14-character string
    return abstractCards.join("");
}//»

»*/

