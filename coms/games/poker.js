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
/* » */
	// Helper: Count distinct ranks in the board«
	const getDistinctBoardRanks = (board) => {
		return new Set(board.split('')).size;
	};
/* » */
	// Helper: Get max possible suit-connecting cards«
	// - For suited hands: 2 hole cards + distinct board ranks
	// - For unsuited: 1 hole card + distinct board ranks
	const getMaxSuits = (board) => {
		const distinctBoardRanks = getDistinctBoardRanks(board);
		return isSuited ? distinctBoardRanks + 2 : distinctBoardRanks + 1;
	};
/* » */
	// Helper: Validate if a suit count is possible for the round«
	const isValidSuitCount = (round, suitCount) => {
		if (round === 'flop') return suitCount === 3;
		if (round === 'turn') return suitCount >= 4;
		if (round === 'river') return suitCount >= 4; // 4 for draw, 5+ for flush
		return false;
	};
/* » */
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
	};/* » */

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
	};/* » */
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
	};/* » */
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
	};/* » */

	// Generate the tree for the sorted starting hand
	result[sortedHole] = generateFlops();
	return result;
};//»

/*
const generatePokerHands = (startingHand) => {
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
};
*/
/*«
const generatePokerHands = (startingHand) => {
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
};
*//* » */
/*
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
*/
/*Updated version with betting logic (DON'T ACTUALLY USE THIS VERSION!!!)«
const generatePokerHands = (startingHand) => {
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
};
»*/


/*
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
*/

// Generate and output the structure
//const pokerHands = generatePokerHands();
//console.log(JSON.stringify(pokerHands, null, 2));

//Commands«
const com_poker = class extends Com{
	run(){
const {args} = this;
try{
let hand = args[0];
const pokerHands = generatePokerHands(hand);
log(pokerHands);
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
///*
let hand_no_suit = hand.replace(/[so]$/, "");
for (let c of ["a", "b", "c3", "d3", "e3"]){

log(c, pokerHands[hand][`${hand_no_suit}432${c}`]);
}
//*/
//log(pokerHands[hand]["22222b"]);
//log("", pokerHands[hand][hand+"432b"]);
//log("", pokerHands[hand][hand+"432c"]);
//log("", pokerHands[hand][hand+"432d"]);
//log("", pokerHands[hand][hand+"432e"]);
//log(pokerHands[hand].AA432b);
//log(pokerHands[hand].AA432d);
//this.out(JSON.stringify(pokerHands));

this.ok();
}
catch(e){
	this.no(e.message);
}
	}
}
//»

const coms = {//«
	poker: com_poker,
}//»

export {coms};









/*OLD«

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

