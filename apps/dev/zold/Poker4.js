/*Just put this into a web worker and add in logic to periodically pull the
objects into the main thread where they can be combined (by trivially adding
the t (total chips awarded) and n (number of trials) fields together). Then,
they can be saved to JSON file.



dev.old.Poker3 has all of the logic for connecting everything with Tensorflow and
doing the epsilon-greedy (reinforcement learning) algorithm.
*/
//Imports«

import { util, api as capi } from "util";
import { globals } from "config";
const{strnum, isarr, isstr, isnum, isobj, log, jlog, cwarn, cerr, make}=util;
const {NS} = globals;
const wdg = NS.api.widgets;
const {poperr, popup, popin} = wdg;

//»

//export const app = function(Win) {«
export const app = function(Win) {
//»

//Var«

let HOLES={};
let FLOPS={};
let TURNS={};
let RIVERS={};

let PokerPlayerClass;

const NAMES = ["Lemmy", "Harfun", "Noon", "Zernt", "Gorpe", "Falkis", "Telch", "Reempt", "Degno"];
//const NAMES = ["Lemmy", "Harfunkle"];
//const HERO = "Reempt";
const MAX_NUM_HANDS = 100;
//let TEXT_ONLY = true;
let TEXT_ONLY = false;
//let TENS_ARE_T = false;
let TENS_ARE_T = true;

const ALL_IN_SYMBOL ="\u{2020}";
const ALL_IN_SPACE =` ${ALL_IN_SYMBOL}`;
let HIDE_HAND_DIVS = true;
//let HIDE_HAND_DIVS = false;
let ALL_SHOWING = !HIDE_HAND_DIVS;
const NUM_ITERS = 20;
//const NUM_ITERS = 200;

//Hand class rankings«

const STRFL=9;
const QUAD=8;
const FULL=7;
const FLUSH=6;
const STRAIT=5;
const TRIP=4;
const TWOPR=3;
const PAIR=2;
const HIGH=1;

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

/*
const STR_DECK=[//«
	"2 d","2 s","2 h","2 c",
	"3 d","3 s","3 h","3 c",
	"4 d","4 s","4 h","4 c",
	"5 d","5 s","5 h","5 c",
	"6 d","6 s","6 h","6 c",
	"7 d","7 s","7 h","7 c",
	"8 d","8 s","8 h","8 c",
	"9 d","9 s","9 h","9 c",
	"10 d","10 s","10 h","10 c",
	"J d","J s","J h","J c",
	"Q d","Q s","Q h","Q c",
	"K d","K s","K h","K c",
	"A d","A s","A h","A c",
];//»
*/

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


let last_bettor;
let num_table_cards;
let round_num;
let table_cards;
let deck;
let players;
let all_players = [];
let start_position;
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

let hole_ranks;
let table_ranks;
let table_suits;
let table_suit_types;
let table_rank_types;
let table_ranks_ch;

let await_enter_cb;

//»

//DOM«

const hand_divs = [];

const {Main} = Win;

Win.makeScrollable();
Main._fs=24;
//Main._bgcol="#030315";
Main._bgcol="#030315";
let pre = make('pre');
//pre.innerHTML=`<div>Our hero in this game is: ${HERO}.</div><div>${ALL_IN_SYMBOL} indicates an "all-in" player.</div>`;
//pre.innerHTML=`<div>${ALL_IN_SYMBOL} indicates an "all-in" player.</div>`;
Main._add(pre);

//»
//Util«

const sleep=(ms)=>{//«
	if (!ms) ms = 0;
	return new Promise((Y,N)=>{
		setTimeout(Y, ms);
	});
};//»

//Logging«

const LOGDBG=-1;
const LOGINF=0;
const LOGWRN=1;
const LOGERR=2;
const LOGSPC=3;
const LOGNIL=Infinity;
//const LOGLEVEL = LOGDBG;
//const LOGLEVEL = LOGSPC;
const LOGLEVEL = LOGINF;
//const LOGLEVEL = LOGNIL;

const all_logs=[];

let hand_div;

const dolog = (which, ...arg) => {
//log(...arg);
	if (typeof which === "string") throw new Error("Do not call me directly!");
	if (which < LOGLEVEL) return;
//	console.log(...arg)
//	all_logs.push(...arg);
let d = make('div');
d.innerHTML = arg;
hand_div.appendChild(d);
//pre.appendChild(d);

};
const logd=(...arg)=>{
	dolog(LOGDBG, ...arg);
};
const logi=(...arg)=>{
	dolog(LOGINF, ...arg);
};
const loge=(...arg)=>{
	dolog(LOGERR, ...arg);
};
const logw=(...arg)=>{
	dolog(LOGWRN, ...arg);
};
const logs=(...arg)=>{
	dolog(LOGSPC, ...arg);
};

//»

//»

//Poker«

//Util«

const log_bet = (player) => {//«
	let name = player.name;
//	if (name===HERO) name=`*${name}*`;
	let bet = player.total_bet_in_round;
	let if_chips = player.chips;
//	let _last_bet = last_bet === null ? 0 : last_bet;
	let _last_bet;
	if (last_bettor) _last_bet = last_bettor.total_bet_in_round;
	else _last_bet = 0;
	let all_in="";
//	if (!if_chips) all_in=" [all-in]";
	if (!if_chips) all_in = ALL_IN_SPACE;
	if (!_last_bet){
		if (!bet) logi(`${cur_pos+1}) ${name}: Check `);
		else {
			logi(`${cur_pos+1}) ${name}: Bet ${bet}${all_in}`);
		}
		return;
	}
	if (bet > _last_bet) {
		logi(`${cur_pos+1}) ${name}: Raise ${bet}${all_in}`);
	}
	else logi(`${cur_pos+1}) ${name}: Call${all_in}`);
	
}//»
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
	s = s.replace(/  $/,"");
	return s;
};//»
const get_hand_str = (player, round) => {//«

	let {hand,hand_rank_ch} = player;
	if (round === PREFLOP_ROUND) return get_hole_hand_str(hand);
	let fl_type;

	let r1 = hand_rank_ch[0];
	let r2 = hand_rank_ch[1];

	let r3 = table_ranks_ch[0];
	let r4 = table_ranks_ch[1];
	let r5 = table_ranks_ch[2];

	let s1 = hand[0]%4;
	let s2 = hand[1]%4;
	let s3 = table_suits[0];
	let s4 = table_suits[1];
	let s5 = table_suits[2];

	if (round === FLOP_ROUND){//«
		if (s1 === s2){
			if (table_suit_types[s1]==3){
				fl_type="4";
//log("Flopped a flush (4)");
			}
			else if (table_suit_types[s1]==2){
				fl_type="3";
//log("Flopped a flush draw (3)");
			}
			else{
				fl_type="0";
//log("No flush draw (same suit)");
			}
		}
		else{
			if (table_suit_types[s1]==3){
				fl_type="2";
//log("Flopped a flush draw (2)");
			}
			else if (table_suit_types[s2]==3){
				fl_type="2";
//log("Flopped a flush draw (2)");
			}
			else{
				fl_type="0";
//log("No flush draw (different suits)");
			}
		}
		return `${r1}${r2}${r3}${r4}${r5}-${fl_type}`;
	}//»

	let r6 = table_ranks_ch[3];
	let s6 = table_suits[3];
	if (round === TURN_ROUND){//«
		if (s1 === s2){
			if (table_suit_types[s1]>2){
//log("Turned obvious flush (3)");
				fl_type = "3";
			}
			else if (table_suit_types[s1]==2){
//log("Turned subtle flush draw (4)");
				fl_type="4";
			}
			else{
//log("No flush draw (same suit)");
				fl_type="0";
			}
		}
		else{
			if (table_suit_types[s1]==4){
//log("Turned screaming flush (1)");
				fl_type="1";
			}
			else if (table_suit_types[s2]==4){
//log("Turned screaming flush (1)");
				fl_type="1";
			}
			else if (table_suit_types[s1]==3){
//log("Turned obvious flush draw (2)");
				fl_type="2";
			}
			else if (table_suit_types[s2]==3){
//log("Turned obvious flush draw (2)");
				fl_type="2";
			}
			else{
//log("No flush draw (different suits)");
				fl_type="0";
			}
		}
//log(str);
		return `${r1}${r2}${r3}${r4}${r5}${r6}-${fl_type}`;
	}//»

	let r7 = table_ranks_ch[4];
	let s7 = table_suits[4];
	if (s1==s2){//«
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

	return `${r1}${r2}${r3}${r4}${r5}${r6}${r7}-${fl_type}`;

};//»

//»

class PokerPlayer {//«

//«

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

//»

constructor(arg){//«

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
};//»
call(){//«
//	let _last_bet = last_bet === null ? 0 : last_bet;
	let _last_bet;
	if (last_bettor) _last_bet = last_bettor.total_bet_in_round;
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
};//»
raise(amt){//«
//cwarn("RAISE");
	let tot = this.call()+amt;
	if (tot > this.chips) return this.chips;
	return tot;
};//»
_act(act){//«
	let _last_bet;
	if (last_bettor) _last_bet = last_bettor.total_bet_in_round;
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

	if (round_num === PREFLOP_ROUND) {
		if (hole_per > 0.775) return this._act(ACTION_RAISE);
		if (hole_per > 0.54) return this._act(ACTION_CALL);
		return this._act(ACTION_FOLD);
	}
	if (round_num === FLOP_ROUND){
		let score = evaluate(this.hand.concat(table_cards)).score;
		//SCORE_PR_8
		if (score < SCORE_PR_8) return this._act(ACTION_FOLD);
		if (score < SCORE_PR_A) return this._act(ACTION_CALL);
		return this._act(ACTION_RAISE);
	}
	else if (round_num === TURN_ROUND){
		let score = evaluate_all_turn(this.hand.concat(table_cards)).score;
		//SCORE_PR_A
		if (score < SCORE_PR_A) return this._act(ACTION_FOLD);
		if (score < SCORE_PR_8_7) return this._act(ACTION_CALL);
		return this._act(ACTION_RAISE);
	}
	else{
		let score = evaluate_all_river(this.hand.concat(table_cards)).score;
		if (score < SCORE_PR_8_7) return this._act(ACTION_FOLD);
		if (score < SCORE_TRP_2) return this._act(ACTION_CALL);
		return this._act(ACTION_RAISE);
	}

}

};//»

class AllInPlayer extends PokerPlayer{//«

record(){//«

let diff = this.chips - this.starting_chips;

let str1 = get_hand_str(this, PREFLOP_ROUND);
let o1 = HOLES[str1];
if (!o1) {
	o1 = {t:0, n: 0};
	HOLES[str1] = o1;
}
o1.t+=diff; o1.n++;

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
//logi(all);
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
const create_players = () => {//«
	deck = new Uint8Array(CARDS_PER_DECK);
	num_players = NAMES.length;
	players = [];
	for (let i = 0; i < num_players; i++) {
		let card_num = 0;
		let hand = [];
		while (card_num < NUM_HOLE_CARDS) {
			const n = Math.floor(CARDS_PER_DECK*Math.random());
			if (deck[n]) continue;
			deck[n] = 1;
			hand[card_num] = n;
			card_num++;	
		}
		let nm = NAMES[i];
//		let player = new PokerPlayer({name: nm, hand});
		let player = new PokerPlayerClass({name: nm, hand});
//		if (nm===HERO) hero = player;
		players[i] = player;
	}
}//»
const showdown = () => {//«

//Evaluate the hands«

let total_awarded = 0;
let pot_num=0;
let active_players=[];
let num_folded = 0;
let c = table_cards;

for (let i=0; i < players.length; i++){
	let player = players[i];
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
		pot -= diff;
logi(`${diff} chips have been returned to ${p1.name}`);
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

//logi(`*****   Showdown #${pot_num+1} between ${active_players.length-num_folded} players   *****`);
//Set this to zero after reporting on the first showdown
//This is just a cosmetic variable not internally _used_ for anything
num_folded = 0;
//logi(`*****          The pot is ${cur_pot}           *****`);
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
extra_chips += cur_pot - (chips_per_winner * winners.length);

if (winners.length > 1){//«
	logd(`The pot will be split ${winners.length}-ways`);
}//»
for (let winner of winners){//«
	winner.chips += chips_per_winner;
	total_awarded += chips_per_winner;
}//»
let net_per_winner = chips_per_winner - cur_total_bet;//«
if (net_per_winner > 0) {
	for (let player of winners){
		num_winners++;
//		logi(`${player.name}: +${net_per_winner}`);
	}
}//»

for (let player of losers){//«
//	if (!player.folded) logi(`${player.name}: ${-cur_total_bet}`);
};//»
if (!num_winners){//«
//	logi("No net winners");
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
	active_players[0].chips += pot - total_awarded;
	active_players = [];
}//»

pot_num++;

}//»

if (!new_hand()) return true;
return next(true);

};//»
const post_blinds = () => {//«

	let bb_pos = last_cur_pos - 1;
	if (bb_pos < 0) bb_pos = players_in_action - 1;
	let sb_pos = bb_pos - 1;
	if (sb_pos < 0)
	sb_pos = players_in_action - 1;

	let sb_player = players[sb_pos];
	sb_player.chips -= SMALL_BLIND;
	sb_player.last_bet = SMALL_BLIND;
	sb_player.total_bet_in_round = SMALL_BLIND;
	sb_player.total_bet = SMALL_BLIND;

	let bb_player = players[bb_pos];
	bb_player.chips -= BIG_BLIND;
	bb_player.last_bet = BIG_BLIND;
	bb_player.total_bet_in_round = BIG_BLIND;
	bb_player.total_bet = BIG_BLIND;

	pot = BIG_BLIND + SMALL_BLIND;
	last_bet = BIG_BLIND;
	last_bettor = bb_player;
	logi(`${sb_pos+1}) ${sb_player.name} posted ${SMALL_BLIND} in the small blind`);
	logi(`${bb_pos+1}) ${bb_player.name} posted ${BIG_BLIND} in the big blind`);

};//»
const new_hand = () => {//«
	if (hand_num === MAX_NUM_HANDS) return false;
	if (hand_num > 0){
		for (let player of players){
			player.record();
		}
	}
	hand_num++;
/*
	let main_hand_div = make('div');
	hand_div = make('div');
	hand_divs.push(hand_div);
	if (HIDE_HAND_DIVS) {
		hand_div._dis="none";
	}
	((d)=>{
		main_hand_div.onclick=(e)=>{
			if (d._dis=="none") d._dis="";
			else d._dis="none";
		};
	})(hand_div);
	pre.appendChild(main_hand_div);
	main_hand_div.innerHTML=`<hr>Hand number: ${hand_num}`;
	main_hand_div.appendChild(hand_div);
*/
	create_players();
	players_in_action = players.length;
	table_cards = [];
	table_ranks = [];
	table_ranks_ch = [];
	table_suits = [];
	table_suit_types = [0,0,0,0];
	table_rank_types=[0,0,0,0,0,0,0,0,0,0,0,0,0];
	num_table_cards = 0;
	round_num = 0;
	last_cur_pos++;
	if (last_cur_pos == players.length){
		last_cur_pos = 0;
	}
	cur_pos = last_cur_pos;
	pot = 0;
//	logi(`>>>  Pre-flop  |  Pot: ${pot}  <<<`);
	return true;
};//»
const next = (no_advance) => {//«
	if (!no_advance) {
		cur_pos++;
		if (cur_pos == num_players) cur_pos = 0;
	}
	let player = players[cur_pos];
	let start_player = player;
	if (player === last_bettor) return deal_cards();
	while (player.all_in || player.folded){
		cur_pos++;
		if (cur_pos == num_players) cur_pos = 0;
		player = players[cur_pos];
		if (player === start_player || player === last_bettor) return deal_cards();
	}
	return player;
};//»

const deal_cards = () => {//«

if (round_num === RIVER_ROUND) return showdown();

round_num++;
last_bettor = null;
last_bet = null;
cur_pos = last_cur_pos;
let round_name = ROUNDS[round_num];
let cards_to_deal = CARDS_PER_ROUND[round_num];
for (let i=0; i < cards_to_deal;){//«
	const n = Math.floor(CARDS_PER_DECK*Math.random());
	if (deck[n]) continue;
	deck[n] = 1;
	table_cards[num_table_cards] = n;
	let r = Math.floor(n/4);
	table_ranks[num_table_cards] = r;
	table_rank_types[r]++;
	table_ranks_ch[num_table_cards] = RANK_TO_CH[r];
	let s = n%4;
	table_suits[num_table_cards] = s;
	table_suit_types[s]++;
	num_table_cards++;
	i++;
}//»
//log(table_suit_types);
table_ranks_ch = table_ranks_ch.sort();
for (let player of players) {
	if (player.all_in) {
//		if (player.record) player.record();
	}
	else player.last_bet = null;
	player.total_bet_in_round = 0;
}


let table_cards_str = cards_to_str(table_cards);

//logi(`>>>  ${round_name}  |  Pot: ${pot}  <<<`);
//logi(`>>>  ${table_cards_str}  <<<`);

return next(true);

};//»
const game_loop = () => {//«
/*
This simulates a game in which the button moves around a table, so that different
named (though currently identical) players are given chances to play at every position.
The new_hand function calls create_players, so there are always the same number of
players at the table with the same number of starting chips.
*/
	new_hand();
	let cur_bet;
	while (true) {
		let player =  next();
		if (player === true) return;
		cur_bet = player.act();
		if (cur_bet == FOLD_ACTION){//«
//			logi(`${cur_pos+1}) ${player.name}: Fold`);
			player.folded = true;
			players_in_action--;
			if (players_in_action == 1){
				if (!new_hand()) return;
			}
			continue;
		}//»
		pot += cur_bet;
		player.last_bet = cur_bet;
		player.total_bet += cur_bet;
		player.total_bet_in_round += cur_bet;
		player.chips -= cur_bet;

		if (!player.chips) player.all_in = true;

//		log_bet(player);

		if (!last_bettor) {
			last_bettor = player;
		}
		else if (player.total_bet_in_round > last_bettor.total_bet_in_round){
			last_bettor = player;
		}
	}

};//»


//»

//Obj/CB«

this.onappinit=async()=>{//«

hole_ranks = await ("/home/me/Desktop/POKERRANKS.json".toJSON());
if (!hole_ranks) return;

//PokerPlayerClass = SimplePokerPlayer;
PokerPlayerClass = AllInPlayer;
game_loop();

log(HOLES);
log(FLOPS);
log(TURNS);
log(RIVERS);

};//»
this.onkeydown=(e,k)=>{//«

if (k==="ENTER_A"){
	let dis;
	if (ALL_SHOWING) dis="none";
	else dis = "";
	hand_divs.forEach(d=>d._dis=dis);
	ALL_SHOWING = !ALL_SHOWING;
}

};//»

//»
//};«
}
//»





