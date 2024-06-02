
//«

import { util, api as capi } from "util";
import { globals } from "config";
const{strnum, isarr, isstr, isnum, isobj, log, jlog, cwarn, cerr}=util;
const{NS, fs}=globals;
const fsapi = fs.api;

//»

const com_poker = async(args, o)=>{//«
const {term, opts} = o;
/*«
The only relevant drawing considerations are: 

How many cards will give us:
1) a flush
2) a straight

Using:
1) Both hole cards
2) One hole card
3) The other hole card

In the case that using either hole card gives us hands in the same
target class as both hole cards, we have an extra bonus in the form of 
taking a "hand making" card out of circulation.

For example:
Holding 2 A's with a board of: KQJT

Or holding 2 clubs with a board of 4 clubs

The concept of draws for repetition-type hands doesn't make sense because:

1) In the case of draws for pairs (3 outstanding cards), the target hand class
value is too low to be be useful as a "made hand".

2) In the case of draws for trips (2 outstanding cards), the odds of making a
"made hand" are (usually) too low to be significant in making a change in
for any reasonable pot odds.

To get trips (or full house from 2 pair), there are 2 cards.
To get 2 pairs, there are 3 cards.


Need to be able to determine drawing odds for straights and flushes on the flop
and turn.

When there are open-ended straight flush possibilities, there are 9 flushing
suits + 8 straighting ranks - 2 duplicates = 15 cards.

Scoring 5 card poker hands:
8.974010 -> 0.480306

Classes:
0 Hi
1 Pair
2 2Pair
3 Trip
4 Straight
5 Flush
6 FullHouse
7 Quads
8 StraightFlush

This takes 5 card deck ranks from High Ace = E to Low Ace = 1, and
converts them into an integer, which can be used as the fractional
part of a full hand rank, with integer part (the hand "class") from 0 (high card) to 8
(straight flush). All 5 ranks are included in the fractional part, such that
the "effective" ranks are used first, for example:

Full house twos over threes:
6.22233 = 6.139827

Full house twos over kings (D):
6.222DD = 6.139997

Full house threes over twos:
6.33322 = 6.209698

Full house kings (D) over twos:
6.DDD22 = 6.908578

Full house kings over aces:
6.DDDEE = 6.908782

Full house aces (E) over kings (D):
6.EEEDD = 6.978653

Pair 5's + A J 8:
1.55EB8 = 1.351928

High Card: A + K Q J 9:
0.EDCB9 = 0.974009

High Card Q + J 9 6 3:
0.CB963 = 0.833891

High Card 7 + 5 4 3 2: (Worst hand)
0.75432 = 0.480306

Straight: 5432A:
4.54321 = 4.344865

Straight Flush: AKQJT: (Best hand)
8.EDCBA = 8.974010

Quad 2's + 3:
7.22223 = 7.139811

Quad A's + K:
7.EEEED = 7.978669

»*/
let got = args.shift();
if (!got) return;

let arr = got.split("");
if (arr.length !== 5) return {err: "Need 5 digits"}
let nums=[];
let iter=0;
let val=0;
for (let c of arr){
	if (!c.match(/[1-9A-E]/i)) return {err: "The only legal digits are [1-9A-E]"}
	let b = parseInt(c, 16);
	let exp = 16**(4-iter);
	let n = b * exp;
	val+=n;
	iter++;
}
return {out: `${val}`};

};//»

//const com_test=()=>{
//};

export const coms = {//«

test: com_test

};//»


