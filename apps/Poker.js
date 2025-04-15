/*«
Fundamental combinatorial theory:

Poker, as a game to be solved via all possible concrete combinations (without
any abstractions) is technically impractical. So, our idea is to make an
abstraction of particular suits, while staying perfectly concrete with the
ranks.

2 representations of all flop and later rounds:

1) Rank-only (disregard all suits):
12-345
12-3456
12-34567

2) Ranks-of-same-suits (3-5 cards):
3-to-flush: (flop only)
1-23
12-3

4-to-flush: (flop or turn)
1-234
12-34

1-234
12-34

5-to-flush: (flop, turn, river)
1-2345
12-345


cmty = community

Here, we are only going to focus on FLOP and TURN rounds, and both of those
rounds are going to have "rank-type" and "flush-type" ways of representing the
hands.  We will always return the rank representation. If there are 0 or 1
cards needed for a flush, then we will also return the flush representation. On
the flop, we can also return the flush representation if our hole cards
participate in 2 cards needed.

Question: On the flop, should we ever return the flush representation if our
hole cards are suited, and 1 cmty card has the same suit?  Or, what if we are
holding an Ace that matches the suit of 2 of the cmty cards? What about a King?
Or Queen? At what point should we disregard the 1+2-to-a-flush draw? Why would
we ever need to disregard it?

Want to separate "flush-type" hands from "rank-type" hands, so that the given
player is playing *either* a flush game or a rank game on the turn. Our
thinking is that there is only one combination hand (straight flush), which
does not occur often enough to be statistically significant enough for a "first
approximation" type of algorithmic solution to poker.

»*/

/*«
Just put this into a web worker and add in logic to periodically pull the
objects into the main thread where they can be combined (by trivially adding
the t (total chips awarded) and n (number of trials) fields together). Then,
they can be saved to JSON file.

HOW CAN THERE BE FLOP HANDS LIKE:
687AA-4 ?
3J9JQ-4 ?
6KAKK-3 ?
4A2QQ-3 ?

Had to get rid of @AZKOPLMNTY

Need to sort:


dev.old.Poker3 has all of the logic for connecting everything with Tensorflow and
doing the epsilon-greedy (reinforcement learning) algorithm.
»*/
//«
/*
const log=(...args)=>{console.log(...args);};
const cwarn=(...args)=>{console.warn(...args);};
const cerr=(...args)=>{console.error(...args);};
*/
const{mkdv, log, cwarn, cerr}=LOTW.api.util;
//»

//SimplePokerPlayer uses this (comes from an old file named POKERRANKS.json)
let hole_ranks;

//Var«

let stopped = false;

//let HOLES={};
let FLOPS={};
let TURNS={};
let RIVERS={};

let PokerPlayerClass;

const NAMES = ["Lemmy", "Harfun", "Noon", "Zernt", "Gorpe", "Falkis", "Telch", "Reempt", "Degno"];
//const NAMES = ["Lemmy", "Harfunkle"];
//const HERO = "Reempt";
//const MAX_NUM_HANDS = 100;
//const SLEEP_EVERY_NUM_HANDS = 5000;
//const SLEEP_EVERY_NUM_HANDS = 5000;
let SLEEP_EVERY_NUM_HANDS = 100;
//let TEXT_ONLY = true;
let TEXT_ONLY = false;
//let TENS_ARE_T = false;
let TENS_ARE_T = true;

//const ALL_IN_SYMBOL ="\u{2020}";
//const ALL_IN_SPACE =` ${ALL_IN_SYMBOL}`;
//let HIDE_HAND_DIVS = true;
//let HIDE_HAND_DIVS = false;
//let ALL_SHOWING = !HIDE_HAND_DIVS;

//const NUM_ITERS = 20;
//const NUM_ITERS = 200;

let num_batches = 0;

//Hand class rankings«

/*

For our "first approximation" purposes, straight flushes DO NOT EXIST. The interesting
thing about poker is that:

1) it sets rank type hands up against suit type hands.
2) it sets sequential rank hands up against multi rank hands.

So we have 4 classes of hands:

- High multi-rank
- Multi-suit
- Sequential
- Low multi-rank

*/
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

//»
//Human-readable card strings«

// d s h c
// ♦ ♠ ♥ ♣

/*To represent cards in a human-readable way, there are 2 choices:«
1) TEXT_ONLY
	a) true: text (e.g. 2h, Js)
	b) false: HTML (with graphical suit characters, suit colors, and light card backgrounds)
2) TENS_ARE_T
	a) true: Tens as 'T' (keeps all cards the same width)
	b) false: Tens as '10' (standard card deck)
»*/

let STR_DECK;

const HAND_PR_8 = [24, 25];
const HAND_PR_A = [48, 48];
const HAND_8_7 = [24,25,20,21];

if (TEXT_ONLY){
	if (TENS_ARE_T) STR_DECK=[//«
		"2d","2s","2h","2c",
		"3d","3s","3h","3c",
		"4d","4s","4h","4c",
		"5d","5s","5h","5c",
		"6d","6s","6h","6c",
		"7d","7s","7h","7c",
		"8d","8s","8h","8c",
		"9d","9s","9h","9c",
		"Td","Ts","Th","Tc",
		"Jd","Js","Jh","Jc",
		"Qd","Qs","Qh","Qc",
		"Kd","Ks","Kh","Kc",
		"Ad","As","Ah","Ac",
	];//»
	else STR_DECK=[//«
		"2d","2s","2h","2c",//0
		"3d","3s","3h","3c",//4
		"4d","4s","4h","4c",//8
		"5d","5s","5h","5c",//12
		"6d","6s","6h","6c",//16
		"7d","7s","7h","7c",//20
		"8d","8s","8h","8c",//24
		"9d","9s","9h","9c",//28
		"10d","10s","10h","10c",//32
		"Jd","Js","Jh","Jc",//36
		"Qd","Qs","Qh","Qc",//40
		"Kd","Ks","Kh","Kc",//44
		"Ad","As","Ah","Ac",//48
	];//»
}
else{
	if (TENS_ARE_T) STR_DECK=[//«
		"2<span class='cardsuitd'>♦</span>",
		"2<span class='cardsuits'>♠</span>",
		"2<span class='cardsuith'>♥</span>",
		"2<span class='cardsuitc'>♣</span>",
		"3<span class='cardsuitd'>♦</span>",
		"3<span class='cardsuits'>♠</span>",
		"3<span class='cardsuith'>♥</span>",
		"3<span class='cardsuitc'>♣</span>",
		"4<span class='cardsuitd'>♦</span>",
		"4<span class='cardsuits'>♠</span>",
		"4<span class='cardsuith'>♥</span>",
		"4<span class='cardsuitc'>♣</span>",
		"5<span class='cardsuitd'>♦</span>",
		"5<span class='cardsuits'>♠</span>",
		"5<span class='cardsuith'>♥</span>",
		"5<span class='cardsuitc'>♣</span>",
		"6<span class='cardsuitd'>♦</span>",
		"6<span class='cardsuits'>♠</span>",
		"6<span class='cardsuith'>♥</span>",
		"6<span class='cardsuitc'>♣</span>",
		"7<span class='cardsuitd'>♦</span>",
		"7<span class='cardsuits'>♠</span>",
		"7<span class='cardsuith'>♥</span>",
		"7<span class='cardsuitc'>♣</span>",
		"8<span class='cardsuitd'>♦</span>",
		"8<span class='cardsuits'>♠</span>",
		"8<span class='cardsuith'>♥</span>",
		"8<span class='cardsuitc'>♣</span>",
		"9<span class='cardsuitd'>♦</span>",
		"9<span class='cardsuits'>♠</span>",
		"9<span class='cardsuith'>♥</span>",
		"9<span class='cardsuitc'>♣</span>",
		"T<span class='cardsuitd'>♦</span>",
		"T<span class='cardsuits'>♠</span>",
		"T<span class='cardsuith'>♥</span>",
		"T<span class='cardsuitc'>♣</span>",
		"J<span class='cardsuitd'>♦</span>",
		"J<span class='cardsuits'>♠</span>",
		"J<span class='cardsuith'>♥</span>",
		"J<span class='cardsuitc'>♣</span>",
		"Q<span class='cardsuitd'>♦</span>",
		"Q<span class='cardsuits'>♠</span>",
		"Q<span class='cardsuith'>♥</span>",
		"Q<span class='cardsuitc'>♣</span>",
		"K<span class='cardsuitd'>♦</span>",
		"K<span class='cardsuits'>♠</span>",
		"K<span class='cardsuith'>♥</span>",
		"K<span class='cardsuitc'>♣</span>",
		"A<span class='cardsuitd'>♦</span>",
		"A<span class='cardsuits'>♠</span>",
		"A<span class='cardsuith'>♥</span>",
		"A<span class='cardsuitc'>♣</span>",

	];//»
	else STR_DECK=[//«
		"2<span class='cardsuitd'>♦</span>",
		"2<span class='cardsuits'>♠</span>",
		"2<span class='cardsuith'>♥</span>",
		"2<span class='cardsuitc'>♣</span>",
		"3<span class='cardsuitd'>♦</span>",
		"3<span class='cardsuits'>♠</span>",
		"3<span class='cardsuith'>♥</span>",
		"3<span class='cardsuitc'>♣</span>",
		"4<span class='cardsuitd'>♦</span>",
		"4<span class='cardsuits'>♠</span>",
		"4<span class='cardsuith'>♥</span>",
		"4<span class='cardsuitc'>♣</span>",
		"5<span class='cardsuitd'>♦</span>",
		"5<span class='cardsuits'>♠</span>",
		"5<span class='cardsuith'>♥</span>",
		"5<span class='cardsuitc'>♣</span>",
		"6<span class='cardsuitd'>♦</span>",
		"6<span class='cardsuits'>♠</span>",
		"6<span class='cardsuith'>♥</span>",
		"6<span class='cardsuitc'>♣</span>",
		"7<span class='cardsuitd'>♦</span>",
		"7<span class='cardsuits'>♠</span>",
		"7<span class='cardsuith'>♥</span>",
		"7<span class='cardsuitc'>♣</span>",
		"8<span class='cardsuitd'>♦</span>",
		"8<span class='cardsuits'>♠</span>",
		"8<span class='cardsuith'>♥</span>",
		"8<span class='cardsuitc'>♣</span>",
		"9<span class='cardsuitd'>♦</span>",
		"9<span class='cardsuits'>♠</span>",
		"9<span class='cardsuith'>♥</span>",
		"9<span class='cardsuitc'>♣</span>",
		"10<span class='cardsuitd'>♦</span>",
		"10<span class='cardsuits'>♠</span>",
		"10<span class='cardsuith'>♥</span>",
		"10<span class='cardsuitc'>♣</span>",
		"J<span class='cardsuitd'>♦</span>",
		"J<span class='cardsuits'>♠</span>",
		"J<span class='cardsuith'>♥</span>",
		"J<span class='cardsuitc'>♣</span>",
		"Q<span class='cardsuitd'>♦</span>",
		"Q<span class='cardsuits'>♠</span>",
		"Q<span class='cardsuith'>♥</span>",
		"Q<span class='cardsuitc'>♣</span>",
		"K<span class='cardsuitd'>♦</span>",
		"K<span class='cardsuits'>♠</span>",
		"K<span class='cardsuith'>♥</span>",
		"K<span class='cardsuitc'>♣</span>",
		"A<span class='cardsuitd'>♦</span>",
		"A<span class='cardsuits'>♠</span>",
		"A<span class='cardsuith'>♥</span>",
		"A<span class='cardsuitc'>♣</span>",

	];//»
}

//»
const RANK=[//«
"Two",
"Three",
"Four",
"Five",
"Sixe",
"Seven",
"Eight",
"Nine",
"Ten",
"Jack",
"Queen",
"King",
"Ace"
];//»
const RANK_TO_CH=[//«
"2",
"3",
"4",
"5",
"6",
"7",
"8",
"9",
"T",
"J",
"Q",
"K",
"A"
];//»

const BET_AMOUNT = 2;
const SMALL_BLIND = 1;
const BIG_BLIND = 2;

const ROUNDS=["Pre-Flop","Flop","Turn","River"];

const CARDS_PER_ROUND=[0,3,1,1];
const NUM_HOLE_CARDS = 2;

const CARDS_PER_DECK = 52;
const NUM_ROUNDS = 4;
const FOLD_ACTION = -1;
const FOLD_AND_SHOW_ACTION = -2;
const STARTING_CHIPS = 100;
const TOTAL_STARTING_CHIPS = STARTING_CHIPS * NAMES.length;

const ACTION_FOLD = 0;
const ACTION_CALL = 1;
const ACTION_RAISE = 2;

const ALL_ACTIONS = [ACTION_FOLD, ACTION_CALL, ACTION_RAISE];
const NUM_ACTIONS = ALL_ACTIONS.length;

const PREFLOP_ROUND = 0;
const FLOP_ROUND = 1;
const TURN_ROUND = 2;
const RIVER_ROUND = 3;

const SCORE_PR_8 =   8781824;
const SCORE_PR_A =   9175040;
const SCORE_PR_8_7 = 23396352;
const SCORE_TRP_2 =  33554432;

//»

//Util«

const sleep = (ms) =>{//«
	if (!ms) ms = 0;
	return new Promise((Y,N)=>{
		setTimeout(Y, ms);
	});
};//»

const get_hole_hand_str=hand=>{//«

const h1 = hand[0];
const h2 = hand[1];

let r1 = Math.floor(h1/4);
let r2 = Math.floor(h2/4);
if (r1 > r2){
	let t = r1;
	r1 = r2;
	r2 = t;
}

const s1 = h1%4;
const s2 = h2%4;
const s = s1==s2?"s":"o";
let str = `${RANK_TO_CH[r2]}${RANK_TO_CH[r1]}${s}`;
//log(cards_to_str, );
//log(h1, h2, s1, s2, s1==s2, str, cards_to_str(hand));
return str;
};//»
const cards_to_str=(arr)=>{//«
	let s = '';
	if (TEXT_ONLY){
		for (let card of arr) s+=`${STR_DECK[card]} `;
	}
	else {
		for (let card of arr) s+=`<span class="card">${STR_DECK[card]}</span>`+"  ";
	}
//	s = s.replace(/  $/,"");
	return s.trim();
};//»

const get_hand_str = (player, round) => {//«

	let {hand,hand_rank_ch} = player;
	if (round === PREFLOP_ROUND) return get_hole_hand_str(hand);

	let r1 = hand_rank_ch[0];
	let r2 = hand_rank_ch[1];

	let r3 = table_ranks_ch[0];
	let r4 = table_ranks_ch[1];
	let r5 = table_ranks_ch[2];

	let s1 = hand[0]%4;
	let s2 = hand[1]%4;

	let tmp;

	if (round === FLOP_ROUND){//«
		let table_suit_types = flop_suit_types;
		let fl_type;
		if (s1 === s2){
			if (table_suit_types[s1]===3){
				fl_type="4";
//log("Flopped a flush (4)");
			}
			else if (table_suit_types[s1]===2){
				fl_type="3";
//log("Flopped a flush draw (3)");
			}
			else{
				fl_type="0";
//log("No flush draw (same suit)");
			}
		}
		else{
			if (table_suit_types[s1]===3){
				fl_type="2";
//log("Flopped a flush draw (2)");
			}
			else if (table_suit_types[s2]===3){
				fl_type="2";
//log("Flopped a flush draw (2)");
			}
			else{
				fl_type="0";
//log("No flush draw (different suits)");
			}
		}
//Need to sort r3,r4,r5
//C-like sort algo
/*
		if (r4 < r3){//«
			tmp = r3;
			r3 = r4;
			r4 = tmp;
		}//»
		if (r5 < r4){//«
			tmp = r4;
			r4 = r5;
			r5 = tmp;
			if (r4 < r3){
				tmp = r3;
				r3 = r4;
				r4 = tmp;
			}
		}//»
		return `${r1}${r2}${r3}${r4}${r5}-${fl_type}`;
*/

		let a = [r3,r4,r5].sort();
		return `${r1}${r2}${a[0]}${a[1]}${a[2]}-${fl_type}`;

	}//»

	let r6 = table_ranks_ch[3];
	if (round === TURN_ROUND){//«
		let table_suit_types = turn_suit_types;
		let fl_type;
		if (s1 === s2){
			if (table_suit_types[s1]>2){
//log("Turned obvious flush (3)");
				fl_type = "3";
			}
			else if (table_suit_types[s1]===2){
//log("Turned subtle flush draw (4)");
				fl_type="4";
			}
			else{
//log("No flush draw (same suit)");
				fl_type="0";
			}
		}
		else{
			if (table_suit_types[s1]===4){
//log("Turned screaming flush (1)");
				fl_type="1";
			}
			else if (table_suit_types[s2]===4){
//log("Turned screaming flush (1)");
				fl_type="1";
			}
			else if (table_suit_types[s1]===3){
//log("Turned obvious flush draw (2)");
				fl_type="2";
			}
			else if (table_suit_types[s2]===3){
//log("Turned obvious flush draw (2)");
				fl_type="2";
			}
			else{
//log("No flush draw (different suits)");
				fl_type="0";
			}
		}
/*C-like sort algo«
		if (r4 < r3){//«
			tmp = r3;
			r3 = r4;
			r4 = tmp;
		}//»
		if (r5 < r4){//«
			tmp = r4;
			r4 = r5;
			r5 = tmp;
			if (r4 < r3){
				tmp = r3;
				r3 = r4;
				r4 = tmp;
			}
		}//»
		if (r6 < r5){//«
			tmp = r5;
			r5 = r6;
			r6 = tmp;
			if (r5 < r4){
				tmp = r4;
				r4 = r5;
				r5 = tmp;
				if (r4 < r3){
					tmp = r3;
					r3 = r4;
					r4 = tmp;
				}
			}
		}//»
»*/
		let a = [r3,r4,r5,r6].sort();
		return `${r1}${r2}${a[0]}${a[1]}${a[2]}${a[3]}-${fl_type}`;
//		return `${r1}${r2}${r3}${r4}${r5}${r6}-${fl_type}`;
	}//»
	else {//«
		let table_suit_types = river_suit_types;
		let fl_type;
		if (s1===s2){//«
			if (table_suit_types[s1]>2){
//log("Have river flush (same hole suits)");
				fl_type = "1";
			}
			else{
				fl_type = "0";
			}
		}
		else if (table_suit_types[s1]>3){
//log("Have river flush (diff hole suits)");
			fl_type = "2";
		}
		else if (table_suit_types[s2]>3){
//log("Have river flush (diff hole suits)");
			fl_type = "2";
		}
		else fl_type = "0";
//»
	/*C-like sort algo«
		if (r4 < r3){//«
			tmp = r3;
			r3 = r4;
			r4 = tmp;
		}//»
		if (r5 < r4){//«
			tmp = r4;
			r4 = r5;
			r5 = tmp;
			if (r4 < r3){
				tmp = r3;
				r3 = r4;
				r4 = tmp;
			}
		}//»
		if (r6 < r5){//«
			tmp = r5;
			r5 = r6;
			r6 = tmp;
			if (r5 < r4){
				tmp = r4;
				r4 = r5;
				r5 = tmp;
				if (r4 < r3){
					tmp = r3;
					r3 = r4;
					r4 = tmp;
				}
			}
		}//»
		if (r7 < r6){//«
			tmp = r6;
			r6 = r7;
			r7 = tmp;
			if (r6 < r5){
				tmp = r5;
				r5 = r6;
				r6 = tmp;
				if (r5 < r4){
					tmp = r4;
					r4 = r5;
					r5 = tmp;
					if (r4 < r3){
						tmp = r3;
						r3 = r4;
						r4 = tmp;
					}
				}
			}
		}//»
	»*/
		let a = [r3,r4,r5,r6,table_ranks_ch[4]].sort();
//		return `${r1}${r2}${r3}${r4}${r5}${r6}${r7}-${fl_type}`;
		return `${r1}${r2}${a[0]}${a[1]}${a[2]}${a[3]}${a[4]}-${fl_type}`;
	}//»

};//»
const evaluate = (hand, opts={}) => {//«
let {ifScore} = opts;

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
				str_hand=`Quad ${RANK[quad_rank]}s`;
			}

		}//»
		else if (is_fullhouse){//«

			hand_class = FULL;
			hand_rank = 1<<28;
			hand_rank |= trips_rank << 20;
			str_hand=`${RANK[trips_rank]}s over`;
			if (pair_rank1 === trips_rank){
				hand_rank |= pair_rank2 << 16;
				str_hand+=` ${RANK[pair_rank2]}s`;
			}
			else{
				hand_rank |= pair_rank1 << 16;
				str_hand+=` ${RANK[pair_rank1]}s`;
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
				str_hand=`Trip ${RANK[trips_rank]}s`;
			}

		}//»

	}//»
	else if (is_2pair){//«

		hand_class = TWOPR;
		hand_rank = 1<<24;
		if (pair_rank1 > pair_rank2){
			hand_rank |= pair_rank1 << 20;
			hand_rank |= pair_rank2 << 16;
			str_hand=`${RANK[pair_rank1]}s and ${RANK[pair_rank2]}s`;
		}
		else{
			hand_rank |= pair_rank2 << 20;
			hand_rank |= pair_rank1 << 16;
			str_hand=`${RANK[pair_rank2]}s and ${RANK[pair_rank1]}s`;
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
			str_hand=`${RANK[pair_rank1]}s`;
		}
	}//»

}//»
else if (is_straight){//Straight/Straight-flush«

	if (is_flush){

		hand_class = STRFL;
		hand_rank = 1<<30;
		hand_rank |= hi << 16;
		str_hand = `${str_hand} flush`;
		str_hand=`${RANK[hi]} high straight flush`;

	}
	else{

		hand_class = STRAIT;
		hand_rank = 1<<26;
		hand_rank |= hi << 16;
		str_hand=`${RANK[hi]} high straight`;

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
				str_hand=`${RANK[hi]} high flush`;
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
			str_hand=`${RANK[hi]} high`;
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
const evaluate_all_river = (a) => {//«
//We always have 7 cards here
//Using both hole cards
let h1=evaluate([a[0],a[1],a[4],a[5],a[6]]),//12 --567
h2=evaluate([a[0],a[1],a[3],a[5],a[6]]),//12 -4-67
h3=evaluate([a[0],a[1],a[3],a[4],a[6]]),//12 -45-7
h4=evaluate([a[0],a[1],a[3],a[4],a[5]]),//12 -456-
h5=evaluate([a[0],a[1],a[2],a[5],a[6]]),//12 3--67
h6=evaluate([a[0],a[1],a[2],a[4],a[6]]),//12 3-5-7
h7=evaluate([a[0],a[1],a[2],a[4],a[5]]),//12 3-56-
h8=evaluate([a[0],a[1],a[2],a[3],a[6]]),//12 34--7
h9=evaluate([a[0],a[1],a[2],a[3],a[5]]),//12 34-6-
h10=evaluate([a[0],a[1],a[2],a[3],a[4]]),//12 345--

//Using 1 hole card
h11=evaluate([a[1],a[3],a[4],a[5],a[6]]),//-2 -4567
h12=evaluate([a[1],a[2],a[4],a[5],a[6]]),//-2 3-567
h13=evaluate([a[1],a[2],a[3],a[5],a[6]]),//-2 34-67
h14=evaluate([a[1],a[2],a[3],a[4],a[6]]),//-2 345-7
h15=evaluate([a[1],a[2],a[3],a[4],a[5]]),//-2 3456-
h16=evaluate([a[0],a[3],a[4],a[5],a[6]]),//1- -4567
h17=evaluate([a[0],a[2],a[4],a[5],a[6]]),//1- 3-567
h18=evaluate([a[0],a[2],a[3],a[5],a[6]]),//1- 34-67
h19=evaluate([a[0],a[2],a[3],a[4],a[6]]),//1- 345-7
h20=evaluate([a[0],a[2],a[3],a[4],a[5]]),//1- 3456-

//Using 0 hole cards
h21=evaluate([a[2],a[3],a[4],a[5],a[6]]);//-- 34567

let all = [h1,h2,h3,h4,h5,h6,h7,h8,h9,h10,h11,h12,h13,h14,h15,h16,h17,h18,h19,h20,h21];
all = all.sort((a,b)=>{
	if (a.score > b.score) return -1;
	if (a.score < b.score) return 1;
	return 0;
});

return all[0];

};//»
const evaluate_all_turn = (a, opts={}) => {//«

//We always have 6 cards here
//Using both hole cards

let h1=evaluate([a[1],a[2],a[3],a[4],a[5]], opts),    //-23456
h2=evaluate([a[0],a[2],a[3],a[4],a[5]], opts),    //1-3456
h3=evaluate([a[0],a[1],a[3],a[4],a[5]], opts),    //12-456
h4=evaluate([a[0],a[1],a[2],a[4],a[5]], opts),    //123-56
h5=evaluate([a[0],a[1],a[2],a[3],a[5]], opts),    //1234-6
h6=evaluate([a[0],a[1],a[2],a[3],a[4]], opts);    //12345-

//Using 1 hole card

return ([h1,h2,h3,h4,h5,h6].sort((a,b)=>{
	if (a.score > b.score) return -1;
	if (a.score < b.score) return 1;
	return 0;
}))[0];

//return all[0];

};//»

//»

/*«Player*/

class PokerPlayer {//«

//«
/*
hand;
hand_rank_ch;
name;
chips;
starting_chips;
result;
folded;
all_in;
total_bet;
last_bet;
total_bet_in_round;
*/
//»

constructor(game, arg){//«
	this.game = game;
	this.hand = arg.hand;
	let r1 = RANK_TO_CH[Math.floor(arg.hand[0]/4)];
	let r2 = RANK_TO_CH[Math.floor(arg.hand[1]/4)];
	let tmp;
	if (r2 < r1){
		tmp = r1;
		r1 = r2;
		r2 = tmp;
	}
	this.hand_rank_ch = [r1, r2];
	this.name = arg.name;
	this.chips = STARTING_CHIPS;
	this.starting_chips = STARTING_CHIPS;
	this.result = null;
	this.folded = false;
	this.all_in = false;
	this.total_bet = 0;
	this.last_bet = null;
	this.total_bet_in_round = 0;

}//»

bet(amt){//«
	if (amt > this.chips) return this.chips;
	return amt;
}//»
call(){//«
//	let _last_bet = last_bet === null ? 0 : last_bet;
	let _last_bet;
	if (this.game.lastBettor) _last_bet = this.game.lastBettor.total_bet_in_round;
	else _last_bet = 0;
	if (_last_bet > this.chips) return this.chips;
	let diff = _last_bet - this.total_bet_in_round;
	if (diff < 0) return 0;
	return diff;
/*«
	if (this.last_bet !== null) {
		let diff = _last_bet - this.last_bet;
		if (diff < 0) return 0;
		return diff;
	}
	return _last_bet;
»*/
}//»
raise(amt){//«
//cwarn("RAISE");
	let tot = this.call()+amt;
	if (tot > this.chips) return this.chips;
	return tot;
}//»
_act(act){//«
	let _last_bet;
	if (this.game.lastBettor) _last_bet = this.game.lastBettor.total_bet_in_round;
	else _last_bet = 0;
	if (act === ACTION_FOLD) {
//If last_bet == 0, this is a game theoretically senseless move
		if (!_last_bet) return 0;
		return FOLD_ACTION;
	}
	if (act === ACTION_CALL) {
//If last_bet == 0, this is a check
		return this.call();
	}
	if (_last_bet) return this.raise(_last_bet);
	return this.bet(BET_AMOUNT);
}//»

}//»

class SimplePokerPlayer extends PokerPlayer {//«

act(){

	let hand_str = get_hole_hand_str(this.hand);
	let hole_per = hole_ranks[hand_str].per;

	if (this.game.roundNum === PREFLOP_ROUND) {
		if (hole_per > 0.775) return this._act(ACTION_RAISE);
		if (hole_per > 0.54) return this._act(ACTION_CALL);
		return this._act(ACTION_FOLD);
	}
	if (this.game.roundNum === FLOP_ROUND){
		let score = evaluate(this.hand.concat(this.game.tableCards)).score;
		//SCORE_PR_8
		if (score < SCORE_PR_8) return this._act(ACTION_FOLD);
		if (score < SCORE_PR_A) return this._act(ACTION_CALL);
		return this._act(ACTION_RAISE);
	}
	else if (this.game.roundNum === TURN_ROUND){
		let score = evaluate_all_turn(this.hand.concat(this.game.tableCards)).score;
		//SCORE_PR_A
		if (score < SCORE_PR_A) return this._act(ACTION_FOLD);
		if (score < SCORE_PR_8_7) return this._act(ACTION_CALL);
		return this._act(ACTION_RAISE);
	}
	else{
		let score = evaluate_all_river(this.hand.concat(this.game.tableCards)).score;
		if (score < SCORE_PR_8_7) return this._act(ACTION_FOLD);
		if (score < SCORE_TRP_2) return this._act(ACTION_CALL);
		return this._act(ACTION_RAISE);
	}

}

};//»
class AllInPlayer extends PokerPlayer{//«

record(){//«

let diff = this.chips - this.starting_chips;
/*
let str1 = get_hand_str(this, PREFLOP_ROUND);
let o1 = HOLES[str1];
if (!o1) {
	o1 = {t:0, n: 0};
	HOLES[str1] = o1;
}
o1.t+=diff; o1.n++;
*/

let str2 = get_hand_str(this, FLOP_ROUND);
let o2 = FLOPS[str2];
if (!o2) {
	o2 = {t:0, n: 0};
	FLOPS[str2] = o2;
}
o2.t+=diff; o2.n++;

let str3 = get_hand_str(this, TURN_ROUND);
let o3 = TURNS[str3];
if (!o3) {
	o3 = {t:0, n: 0};
	TURNS[str3] = o3;
}
o3.t+=diff; o3.n++;

let str4 = get_hand_str(this, RIVER_ROUND);
let o4 = RIVERS[str4];
if (!o4) {
	o4 = {t:0, n: 0};
	RIVERS[str4] = o4;
}
o4.t+=diff; o4.n++;

}//»

act(){
	return this.raise(this.chips);
}

}//»

/*»*/

//Game«

/*
newHand() calls createPlayers, which creates a brand new table of players, but it
also keeps some state via lastCurPos. It isn't so important to keep a realistic tally
involving bankrolls.
*/
class Game {

constructor(app){/*«*/
/*«

let last_bettor;
let num_table_cards;
let round_num;
let table_cards;
let deck;
let players;
//let num_players = NAMES.length;
let num_players;
let extra_chips;
let cur_pos;
let last_cur_pos = -1;
let last_bet;
let pot;
let game;
let players_in_action;
let hand_num = 0;
//let hero;

let table_ranks;
let table_suits;
//let table_suit_types;
let flop_suit_types;
let turn_suit_types;
let river_suit_types;
let table_rank_types;
let table_ranks_ch;
»*/

this.app=app;
this.extraChips = 0;
this.lastCurPos = 0;
this.handNum = 0;
//this.finished = false;

}/*»*/

showdown(){//«
cwarn("SHOWDOWN!");
//Evaluate the hands«

let total_awarded = 0;
let pot_num=0;
let active_players=[];
let num_folded = 0;
let c = this.tableCards;

for (let i=0; i < this.players.length; i++){
	let player = this.players[i];
//Folded players are considered "active" because of their chip contribution to
//the main pot, but they are given a fake hand evaluation that cannot possibly
//beat anything in a showdown. The hypothetical case in which every player at
//this point has folded cannot logically exist.
	if (player.folded) {
		player.result = {score: -1};
		num_folded++;
	}
	else if (!player.result) {
//No one who pushes all-in before the river will have a result
		player.result = evaluate_all_river([player.hand[0], player.hand[1], c[0],c[1],c[2],c[3],c[4]]);
	}
	active_players.push(player);
}
//»
//Compare the hands and award the pot(s)«

{//Give back the difference to whoever has contributed more than anyone to the pot
	let sorted = active_players
	.filter(player=>{return !player.folded;})
	.sort((a,b)=>{
		if (a.total_bet > b.total_bet) return -1;
		if (a.total_bet < b.total_bet) return 1;
		return 0;
	});
	let p1 = sorted[0];
	let p2 = sorted[1];
	let diff = (p1.total_bet - p2.total_bet);
	if (diff){
		p1.total_bet -= diff;
		p1.chips += diff;
		this.pot -= diff;
	}
}


while (active_players.length) {
//The first iteration of this loop is the main pot, followed by any side pots
//(side pots result from the players that are forced to go all-in upon calling
//because they could not cover the bet on the table)

let num_winners=0;

let low_bet = Infinity;//«
//YTSHJKFSMROS
let folded_bets = 0;
let num_folded_players = 0;
for (let player of active_players) {
	if (player.folded) {
		folded_bets+=player.total_bet;
		num_folded_players++;
	}
	else if (player.total_bet < low_bet) low_bet = player.total_bet;
}
let cur_total_bet = low_bet;
let cur_pot = folded_bets + cur_total_bet * (active_players.length - num_folded_players);
//»

//Set this to zero after reporting on the first showdown
//This is just a cosmetic variable not internally _used_ for anything
num_folded = 0;
for (let player of active_players){//«
	if (player.folded) continue;
if (TEXT_ONLY){
//	logi(`${player.name}:  >>>  ${STR_DECK[player.hand[0]]}  ${STR_DECK[player.hand[1]]}  <<<  ${player.result.text}`);
}
else {
//	logi(`${player.name}:  >>>  <span class="card">${STR_DECK[player.hand[0]]}</span>  <span class="card">${STR_DECK[player.hand[1]]}</span>  <<<  ${player.result.text}`);
}
}//»
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

//»

//Test the kickers
if (winners.length > 1){//«
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
			else losers.push(winner);
		}
		winners = new_winners;
	}
}//»

//Make the number of chips an integer
let chips_per_winner = Math.floor(cur_pot / winners.length);
//Any extra chips should get awarded to the game winner
this.extraChips += cur_pot - (chips_per_winner * winners.length);
cwarn("WINNERS");
for (let winner of winners){//«
	winner.chips += chips_per_winner;
//log(winner);
log(`${winner.name}:${winner.result.text} (${winner.chips})`);
//log();
	total_awarded += chips_per_winner;
}//»
let net_per_winner = chips_per_winner - cur_total_bet;//«
if (net_per_winner > 0) {
	for (let player of winners){
		num_winners++;
	}
}//»

for (let i=0; i < active_players.length; i++){//«
	let player = active_players[i];
	player.total_bet-=cur_total_bet;
	if (player.folded || player.total_bet < 1){
		active_players.splice(i, 1);
		i--;
	}
}
//»
if (active_players.length==1){//«
	active_players[0].chips += this.pot - total_awarded;
	active_players = [];
}//»

pot_num++;

}//»

this.finished = true;
//if (!await this.newHand()) return true;
//return this.nextPlayer(true);

}//»
postBlinds(){//«

	let bb_pos = this.lastCurPos - 1;
	if (bb_pos < 0) bb_pos = this.playersInAction - 1;
	let sb_pos = bb_pos - 1;
	if (sb_pos < 0)
	sb_pos = this.playersInAction - 1;

	let sb_player = this.players[sb_pos];
	sb_player.chips -= SMALL_BLIND;
	sb_player.this.lastBet = SMALL_BLIND;
	sb_player.total_bet_in_round = SMALL_BLIND;
	sb_player.total_bet = SMALL_BLIND;

	let bb_player = this.players[bb_pos];
	bb_player.chips -= BIG_BLIND;
	bb_player.this.lastBet = BIG_BLIND;
	bb_player.total_bet_in_round = BIG_BLIND;
	bb_player.total_bet = BIG_BLIND;

	this.pot = BIG_BLIND + SMALL_BLIND;
	this.lastBet = BIG_BLIND;
	this.lastBettor = bb_player;

}//»

dealCards(){//«

//if (this.roundNum === RIVER_ROUND) return await this.showdown();
//if (this.roundNum === RIVER_ROUND) return await this.showdown();

this.app.action.innerHTML= "";
this.roundNum++;
this.lastBettor = null;
this.lastBet = null;
this.curPos = this.lastCurPos;
let round_name = ROUNDS[this.roundNum];
let suit_types;
if (this.roundNum === FLOP_ROUND){
	this.flopSuitTypes = [0,0,0,0];
	suit_types = this.flopSuitTypes;
}
else if (this.roundNum === TURN_ROUND){
	this.turnSuitTypes = this.flopSuitTypes.slice();
	suit_types = this.turnSuitTypes;
}
else if (this.roundNum === RIVER_ROUND){
	this.riverSuitTypes = this.turnSuitTypes.slice();
	suit_types = this.riverSuitTypes;
}

let cards_to_deal = CARDS_PER_ROUND[this.roundNum];
//cwarn(`DEAL: ${this.roundNum} (${cards_to_deal})`);
for (let i=0; i < cards_to_deal;){//«

	const n = Math.floor(CARDS_PER_DECK*Math.random());
	if (this.deck[n]) continue;
	this.deck[n] = 1;

	this.tableCards[this.numTableCards] = n;

	let r = Math.floor(n/4);
	this.tableRanks[this.numTableCards] = r;
	this.tableRanksCh[this.numTableCards] = RANK_TO_CH[r];
	this.tableRankTypes[r]++;

	let s = n%4;
	this.tableSuits[this.numTableCards] = s;
//	table_suit_types[s]++;
	suit_types[s]++;

	this.numTableCards++;
	i++;

}//»
this.app.board.innerHTML = cards_to_str(this.tableCards);
//AZKOPLMNTY
//table_ranks_ch = table_ranks_ch.sort();

for (let player of this.players) {
	if (player.all_in) {
	}
	else player.last_bet = null;
	player.total_bet_in_round = 0;
}

//return this.nextPlayer(true);

}//»

createPlayers(){//«
	this.deck = new Uint8Array(CARDS_PER_DECK);
	this.numPlayers = NAMES.length;
	this.players = [];
	for (let i = 0; i < this.numPlayers; i++) {
		let card_num = 0;
		let hand = [];
		while (card_num < NUM_HOLE_CARDS) {
			const n = Math.floor(CARDS_PER_DECK*Math.random());
			if (this.deck[n]) continue;
			this.deck[n] = 1;
			hand[card_num] = n;
			card_num++;	
		}
		let nm = NAMES[i];
		let player = new PokerPlayerClass(this, {name: nm, hand});
		this.players[i] = player;
	}
	this.app.renderPlayers();
}//»
nextPlayer(no_advance){//«
	if (!no_advance) {
		this.curPos++;
		if (this.curPos == this.numPlayers) this.curPos = 0;
	}
//log(this.players);
//log(this.curPos);
	let player = this.players[this.curPos];
//log(player);
	let start_player = player;
	if (player === this.lastBettor){
//		return this.dealCards();
		return false;
	}
	while (player.all_in || player.folded){
		this.curPos++;
		if (this.curPos == this.numPlayers) this.curPos = 0;
		player = this.players[this.curPos];
		if (player === start_player || player === this.lastBettor) {
//			return this.dealCards();
			return false;
		}
	}
	return player;
}//»
newHand(){//«
/*
	if (this.handNum > 0){
		for (let player of this.players){
			player.record();
		}
	}
*/
	this.finished = false;
	this.handNum++;
	this.app.board.innerHTML = "";
cwarn(`HAND: ${this.handNum}`);
/*
	if (!(hand_num%SLEEP_EVERY_NUM_HANDS)){
		num_batches++;
if (!(hand_num%(100*SLEEP_EVERY_NUM_HANDS))){
log(`HAND: ${hand_num}`);
}
		await sleep();
	}
*/
//	if (stopped) return false;
	this.createPlayers();
	this.playersInAction = this.players.length;
	this.tableCards = [];
	this.tableRanks = [];
	this.tableRanksCh = [];
	this.tableSuits = [];
//	table_suit_types = [0,0,0,0];

	this.tableRankTypes=[0,0,0,0,0,0,0,0,0,0,0,0,0];
	this.numTableCards = 0;
	this.roundNum = 0;
	this.lastCurPos++;
	if (this.lastCurPos == this.players.length){
		this.lastCurPos = 0;
	}
	this.curPos = this.lastCurPos;
	this.pot = 0;
//	this.dealCards();
//	return true;
}//»
gameStep(){/*«*/
if (this.finished){
cwarn("DONE");
return;
}
	let cur_bet;
	let player =  this.nextPlayer();
	if (!player) {
		if (this.roundNum === RIVER_ROUND) {
			this.showdown();
		}
		else {
			this.dealCards();
		}
		return;
	}
	cur_bet = player.act();
	this.app.action.innerHTML= `${player.name}: ${cur_bet}`;
	if (cur_bet == FOLD_ACTION){//«
		player.folded = true;
		this.playersInAction--;
		if (this.playersInAction == 1){
			this.finished = true;
			return;
		}
//		continue;
		return;
	}//»
	this.pot += cur_bet;
	player.last_bet = cur_bet;
	player.total_bet += cur_bet;
	player.total_bet_in_round += cur_bet;
	player.chips -= cur_bet;

	if (!player.chips) player.all_in = true;

	if (!this.lastBettor) {
		this.lastBettor = player;
	}
	else if (player.total_bet_in_round > this.lastBettor.total_bet_in_round){
		this.lastBettor = player;
	}

}/*»*/

async gameLoop(){//«
/*
This simulates a game in which the button moves around a table, so that different
named (though currently identical) players are given chances to play at every position.
The New_hand function calls create_players, so there are always the same number of
players at the table with the same number of starting chips.
*/
//	await this.newHand();
	this.newHand();
	this.dealCards();
	let cur_bet;
	while (true) {
		await sleep();
		let player =  this.nextPlayer();
		if (!player) {
			if (this.roundNum === RIVER_ROUND) {
				this.showdown();
			}
			return;
		}
		cur_bet = player.act();
		if (cur_bet == FOLD_ACTION){//«
			player.folded = true;
			this.playersInAction--;
			if (this.playersInAction == 1){
//				if (!await this.newHand()) return;
				return;
			}
			continue;
		}//»
		this.pot += cur_bet;
		player.last_bet = cur_bet;
		player.total_bet += cur_bet;
		player.total_bet_in_round += cur_bet;
		player.chips -= cur_bet;

		if (!player.chips) player.all_in = true;

		if (!this.lastBettor) {
			this.lastBettor = player;
		}
		else if (player.total_bet_in_round > this.lastBettor.total_bet_in_round){
			this.lastBettor = player;
		}
	}

}//»

}


//»

PokerPlayerClass = AllInPlayer;
//PokerPlayerClass = SimplePokerPlayer;

export const app = class{

constructor(Win){/*«*/
	this.Win=Win;
	this.main = Win.Main;
}/*»*/

renderPlayers(){/*«*/
let ps = this.game.players;
let s=``;
for (let p of ps){
let cstr = cards_to_str(p.hand);
s+=`<div style="font-size:120%;text-align:center;"><div>${p.name}</div><div>${cstr}</div><div>${p.chips}</div></div>`;
}
//log(s);
this.players.innerHTML = s;
//log(p.name);

//log(this.game.players);
}/*»*/
makeDOM(){/*«*/
	let pldv = mkdv();
	pldv._dis = "flex";
	pldv.style.justifyContent = "space-between";
	let a = mkdv();
	a._fs="125%";
	let b = mkdv();
	b._ta="center";
	b._fs="125%";

	this.players = pldv;
	this.action = a;
	this.board = b;
	this.main._add(pldv);
	this.main._add(a);
	this.main._add(b);
}/*»*/

onappinit(){/*«*/

this.makeDOM();
this.game = new Game(this);

this.game.newHand();
//log(this.game);
}/*»*/
onkill(){/*«*/
	stopped = true;
}/*»*/
onkeydown(e, k){/*«*/

if(k==="SPACE_"){
	this.game.gameStep();
}
else if (k==="n_"){
if (!this.game.finished){
cwarn("NOTDONE!");
return;
}
this.game.newHand();

}
}/*»*/

}

