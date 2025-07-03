
//Imports«

//const{globals, Desk}=LOTW;
const {Com} = LOTW.globals.ShellMod.comClasses;
const{log,jlog,cwarn,cerr}=LOTW.api.util;
//»


function generateAbstractRepresentationsForVariant(holeVariant, round, primaryThreshold, secondaryThreshold) {/* « */
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
}/* » */

// Reuses getAbstractRepresentation with dynamic thresholds and suit precedence
function getAbstractRepresentation(cards, primaryThreshold, secondaryThreshold) {/* « */
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
}/* » */

//Commands«
const com_poker = class extends Com{
	run(){
const {args} = this;
if (args.length !== 4) {
	this.out(`Usage: hole round thresh1 thresh2`);
	this.no();
	return 
}
//let which = this.args.shift();
//if (!which) return this.no(`Need a hand!`);
try{
//let set = generateFlopAbstractRepresentationsForVariant(which);

let set = generateAbstractRepresentationsForVariant(args[0], args[1], parseInt(args[2]), parseInt(args[3]));

log(set);
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

/*
const com_poker = class extends Com{//«
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
Desk.api.openApp("dev.Poker", {force: true, appArgs: {playerTypes: this.args}});
this.ok();
}
}//»

function generateFlopAbstractRepresentationsForVariant(holeVariant) {//«
// Generates unique suit-abstracted flop representations for a specific hole card variant
// Input: holeVariant (e.g., "AA", "Q9o", "AKs")
// Output: Set of strings (e.g., "Ax9xKxQxJx", "AsKsQsJs9s")
    // Step 1: Validate and parse hole variant
    if (typeof holeVariant !== "string" || !/^[2-9TJQKA]{2}[os]?$/.test(holeVariant)) {
        throw new Error("Invalid hole variant format (e.g., 'AA', 'Q9o', 'AKs')");
    }
    const rank1 = holeVariant[0]; // e.g., "A"
    const rank2 = holeVariant[1]; // e.g., "A" or "K"
    const suited = holeVariant[2] === "s"; // true for suited, false for offsuit or pair
    const isPair = rank1 === rank2;

    // Step 2: Assign canonical real hole cards
    let holeCards;
    if (isPair) {
        // Pairs (e.g., AA): Use two different suits (e.g., AdAh)
        holeCards = [`${rank1}d`, `${rank1}h`];
    } else if (suited) {
        // Suited (e.g., AKs): Same suit (e.g., AdKd)
        holeCards = [`${rank1}d`, `${rank2}d`];
    } else {
        // Offsuit (e.g., AKo): Different suits (e.g., AdKh)
        holeCards = [`${rank1}d`, `${rank2}h`];
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

    // Step 5: Generate board combinations (C(50, 3) = 19,600)
    const remainingDeck = deck.filter(card => !holeCards.includes(card));
    for (let k = 0; k < remainingDeck.length - 2; k++) {
        for (let l = k + 1; l < remainingDeck.length - 1; l++) {
            for (let m = l + 1; m < remainingDeck.length; m++) {
                const boardCards = [remainingDeck[k], remainingDeck[l], remainingDeck[m]];
                const hand = [...holeCards, ...boardCards];

                // Step 6: Get abstract representation
                const abstractHand = getAbstractRepresentation(hand, 4, 3);

                // Step 7: Add to Set
                abstractSet.add(abstractHand);
            }
        }
    }

    // Step 8: Return unique representations
    return abstractSet;
}//»
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
function getAbstractRepresentation(cards) {//«
    // Validate input: ensure 5-7 cards
    if (!Array.isArray(cards) || cards.length < 5 || cards.length > 7) {
        throw new Error("Input must be an array of 5-7 cards");
    }

    // Determine round based on card count
    const round = cards.length === 5 ? "flop" : cards.length === 6 ? "turn" : "river";

    // Set suit count thresholds based on round
    const primaryThreshold = 3; // 3+ cards for "s" (all rounds)
    const secondaryThreshold = round === "river" ? 3 : 2; // 3 for river, 2 for flop/turn

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

    // Step 6: Apply thresholds (no forced "s")
    if (!primarySuit || maxCount < primaryThreshold) {
        primarySuit = null;
        secondarySuit = null;
    } else if (secondMaxCount < secondaryThreshold) {
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
        const sortedByRank = Object.keys(rankGroups).sort((a, b) => rankOrder[b] - rankOrder[a]);
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

*/
