//Notes«

/*The evolution of game situations:«

Game scenarios:

1) All-in only
2) All-in or fold
3) Standard bet (i.e. 10 chips), call or fold
4) Standard bet, 1 standard raise, call or fold
5) Any bet (in a range), call or fold
6) Any bet (up to all-in), call or fold
7) Any bet (in a range), 1 standard raise, call or fold
8) Any bet (in a range), any 1 raise (in a range), call or fold
9) Any bet (up to all-in), any 1 raise (up to all-in), call or fold
10) Any bet (in a range), 1 standard raise, 1 standard reraise, call or fold
11) Actual limit Texas hold 'em betting structure and rules
12) Actual no-limit Texas hold 'em betting structure and rules

All we are trying to do with this listing is to show the many permutations of a
game that each increase the level of complexity of the game ('all-in only'
games are the most trivial games, and can be considered as the equivalent of
"no-ops" in programming), and require more sophisticated players in order to
succeed. The expectation values (EVs) of the hands (169 pre-flop, 108,602 flop,
165,295 turn rank, and 3,456 turn suit classes) are specific to the particular
game contexts, which include the game rules as well as the list of "players"
(i.e. functions and initialization variables) that were involved in playing the
game. For every game scenario, the resulting EVs of the hands (and of the
players) are entirely new rather than being the mere refinements of the results
of previously played game scenarios.

For any game, we can determine the EVs of the hands in all rounds, even when
there is no betting action in a given hand due to being all-in. In these cases,
the later hands get to "inherit" the results of the given all-in bet. So, the
'all-in only' game will be able to calculate the "brute force" EVs of all flop
and turn hands (and river hands?) as well as the given hole cards. These EVs
can then be used as inputs to the action functions (i.e. members of an 
"environment" variable that is a member of an options argument) of the later
game scenarios (but are not part of the EV outputs, except in an indirect
sense).

The EVs of the players within given game situations are the only results that
ultimately matter here. Each of the players should have their own system of
weights and biases that go into making their more-or-less "game theoretical"
decisions. We can include players from previous game situations (such as the
all-in-only bots) in order to validate the (hopefully improved) skills of the
current generation of players.

»*/
/*Named hand classes«

There are: 108,602 possible "flop classes", such that all ranks are accounted for,
and all 4-or-5-to-the-flush suit combinations (they are listed below @SDIUNMGHTO).

The turn is different because one must choose between the "suited classes" (for
flush draws) and the "ranked classes" (for all non-flushes including straight
draws). The unaccounted case of a suit+rank draw is not included because 1) it
would involve a large amount of complexity, 2) only the straight-flush makes
this draw and 3) there aren't enough of these draws to make any real difference
in terms of the long term averages when it comes to betting on the turn . When
we're on the the river and any straight flushes really *do* matter, then we will
know very well if __we__ have it (making our hand a good one), and we will also
know if __the board__ has it (possibly counterfitting our own hand of trips,
other straight or other flush).

There are: 165,295 possible "turn rank classes" (which completely ignore
suitful considerations). These go from AAAAKK to 222233, with all possible
pairs, 2 pairs, trips, straights, full houses and quads accounted for.

There are: 3,744 calculated "turn suit classes". For these, we have 4 possible
suit combinations: s-ssss (1: made "screaming" flush), s-sss (2: obvious flush
draw), ss-sss (3: made obvious flush), ss-ss (4: subtle flush draw), which
cross with ~91 hole rank types and using 13 highest board rank types.  There
might be some impossible cases included here.

There are 2,144,935 possible "river rank classes". Which are all of the turn
ranks multiplied by all the ranks, with all of the "5-of-a-kinds" filtered out.
We can think of calculating the EVs of all of these permutations as a longer
term project that is not very crucial for strategic reasons because the EVs of
river hands can be well approximated by comparing the following hand scores: 1)
the best 7 card score, 2) The score of the board cards only, 3) the score of
our 2 hole cards plus the best 3 board cards, 4) the score of 1 hole card plus
the best 4 board cards, 5) the score of the other hole card plus the best 4
board cards. This lets us know how much our hand improves the board. In the
cases where the board has a straight flush or quads and our own hand does not
take any part in the score, then we know that we have a relatively bad hand.
There are also 45*44 == 1980 different possible hands. So in the worst case, we
can take the time to calculate what percentile our own hand is against all other
hands (where calculating each hand score requires 21 different 5 card evaluations).
This calculation makes sense in a "live game", where we should be expected to 
spend at least a second or two making up our minds, but ir probably wouldn't make 
too much sense in simulations.


There are 1,872 "river suit classes", which just takes the calculated turn suit
classes above, and uses only the made flush types ('-1' and '-3'), since draws
do not exist at the river stage. This also includes some impossible types,
i.e. A4-1, A3-1 and A2-1. A5-1 works: Ah | 5h 4h 3h 2h. In this case, our Ace is
*not* higher than the board cards.

»*/
/*«For every round but the river, every player has a named hand class, 
and there is a cycle like this:

1) First, for every hand, everyone goes all-in. This tells us which of the
hands lose in pure blind chance draw games.

2) Seond, for every hand, add the fold option based on not wanting to lose. So
the choice is binary: go all-in or fold.  This allows us to weight the
frequency of the classes of hands we might face in later rounds during the
all-in simulations.

3) Third, replace the all-in option with betting and add the check/call option.
So for every hand, the choice is between a) betting (if first to act), b)
calling (and checking), or c) folding. The inclusion of betting and calling
(and elimination of the all-in option) allows us to begin to develop realistic
points of view in terms of betting strategy (i.e. weighing pot odds vs
expectation values).

4) Last, add the raise option into the mixture.  So for every hand, the choice
is between a) betting (if first to act)/raising (if not first to act)
b) calling (and checking) or c) folding.  The inclusion of raising allows us to fully
realize our points of view in terms of betting strategy (i.e. do we play to win
or to not lose?).

»*/
/*Possible suits on flop: 4 and 5«

SDIUNMGHTO
1) Not suited (always an option regardless of ranks, we treat 3-suited as unsuited)
2) s-sss obvious flush danger (no board pair, trips or 2 pair)
3) ss-ss subtle flush danger (no hole pair, trips or 2 pair) 
4) Flush ss-sss (no pairs)

»*/

//»

//Imports«

import { util, api as capi } from "util";
import {globals} from "config";

const{isarr, isstr, isnum, isobj, make, log, jlog, cwarn, cerr}=util;
const {NS} = globals;
const {fs, widgets} = NS.api;

const {popin, poperr} = widgets;

//»

export const app = function(Win, Desk) {

//Var«

let Main = Win.main;

let turns, flops;
let all_flops = [];
let waiting = false;
let flop_suits;
let turn_suits;
let turn_ranks;
let river_ranks;
let river_suits;

const RANKS=[//«
	"A",
	"K",
	"Q",
	"J",
	"T",
	"9",
	"8",
	"7",
	"6",
	"5",
	"4",
	"3",
	"2",
];//»

//»

//Funcs«

const do_ranks_popin = async () => {//«
	if (!flops){
		poperr(`The flops aren't available!!!`);
		return;
	}
	if (waiting) return;
	let rv = await popin("What?");
	waiting = false;
	let arr = rv.split(/ */);
	if (!arr[0]) arr.shift();
	if (!arr[arr.length-1]) arr.pop();
	let out = [];
	for (let ch of arr){
		ch = ch.toUpperCase();
		if (!RANKS.includes(ch)){
			cerr(`Invalid char: '${ch}'`);
			return;
		}
		out.push(ch);
	}
	arr = out;
	let len = arr.length;
	if (len == 5){
	let h1 = arr[0];
	let h2 = arr[1];
	let s;
	if (h1 < h2) s=`${h1}${h2}`;
	else s=`${h2}${h1}`;

	let tmp;//«
	let r1 = arr[2];
	let r2 = arr[3];
	let r3 = arr[4];
	if (r2 < r1){
		tmp = r1;
		r1 = r2;
		r2 = tmp;
	}
	if (r3 < r2){
		tmp = r2;
		r2 = r3;
		r3 = tmp;
		if (r2 < r1){
			tmp = r1;
			r1 = r2;
			r2 = tmp;
		}
	}//»

	s+=`${r1}${r2}${r3}`;

	let ind = flops.indexOf(s);
log(`Input: <<<${rv}>>>`);
	if (ind < 0){
cerr(`!!! Not found: ${s} !!!`);
	}
	else{
log(`${s} === ${flops[ind]}  @flops[${ind}]`);
	}

	}
	else if (len == 6){
cwarn("Not doing 6 cards (yet)", arr);
	}
	else{
cwarn("Skipping", arr);
	}

};//»

const make_all_ranks = async () => {//«

const pairs = [];
for (let i=0; i < RANKS.length; i++){//«
	let r1 = RANKS[i];
	for (let j=i; j < RANKS.length; j++){
		let r2 = RANKS[j];
		if (r1 < r2) pairs.push(`${r1}${r2}`);
		else pairs.push(`${r2}${r1}`);
	}
}//»
let trips = [];
for (let p of pairs){//«
	for (let r3 of RANKS) {
		let r1 = p[0];
		let r2 = p[1];
		let tmp;
		if (r2 < r1){
			tmp = r1;
			r1 = r2;
			r2 = tmp;
		}
		if (r3 < r2){
			tmp = r2;
			r2 = r3;
			r3 = tmp;
			if (r2 < r1){
				tmp = r1;
				r1 = r2;
				r2 = tmp;
			}
		}
		trips.push(`${r1}${r2}${r3}`);
	}
}//»
trips = trips.uniq();
let flop_ranks=[];
for (let p of pairs){//«
	for (let t of trips){
		let s = `${p}${t}`;
		let arr = s.split("");
		if (arr.uniq().length > 1) {
			flop_ranks.push(s);
		}
	}
}//»
flop_ranks = flop_ranks.uniq();
let turn_ranks = [];
for (let f of flop_ranks){//«
	let f1 = f[0];
	let f2 = f[1];
	for (let r4 of RANKS){
		let r1 = f[2];
		let r2 = f[3];
		let r3 = f[4];
		let tmp;
		if (r2 < r1){//«
			tmp = r1;
			r1 = r2;
			r2 = tmp;
		}//»
		if (r3 < r2){//«
			tmp = r2;
			r2 = r3;
			r3 = tmp;
			if (r2 < r1){
				tmp = r1;
				r1 = r2;
				r2 = tmp;
			}
		}//»
		if (r4 < r3){//«
			tmp = r3;
			r3 = r4;
			r4 = tmp;
			if (r3 < r2){
				tmp = r2;
				r2 = r3;
				r3 = tmp;
				if (r2 < r1){
					tmp = r1;
					r1 = r2;
					r2 = tmp;
				}
			}
		}//»
		let types={};
		types[f1]=1;
		types[f2] && types[f2]++ || (types[f2] = 1);
		types[r1] && types[r1]++ || (types[r1] = 1);
		types[r2] && types[r2]++ || (types[r2] = 1);
		types[r3] && types[r3]++ || (types[r3] = 1);
		types[r4] && types[r4]++ || (types[r4] = 1);
		if (types[f1] == 5 || types[f2] == 5 || types[r1] == 5 || types[r2] == 5 || types[r3] == 5 || types[r4] == 5) continue;
		turn_ranks.push(`${f1}${f2}${r1}${r2}${r3}${r4}`);
	}
}//»
turn_ranks = turn_ranks.uniq();

await fs.writeFile(`/home/me/Desktop/FLOPRANKS.json`, JSON.stringify(flop_ranks));
await fs.writeFile(`/home/me/Desktop/TURNRANKS.json`, JSON.stringify(turn_ranks));

}//»

const make_all_flops = async()=>{//«

for (let f of flops){
let r1 = f[0];
let r2 = f[1];
let r3 = f[2];
let r4 = f[3];
let r5 = f[4];
let uniq = f.split("").uniq();
let num_ranks = uniq.length
if (num_ranks == 5){
	all_flops.push(`${f}-1`);
	all_flops.push(`${f}-2`);
	all_flops.push(`${f}-3`);
	all_flops.push(`${f}-4`);
}
else if (num_ranks == 4){
//always 1 pair
	all_flops.push(`${f}-1`);
//If hole cards pair, they can have the 4-suit pattern: s-sss
//If the board pairs, there cannot be s-sss (only r3 and r4 will be the same)

//2006: "AK226-2"

//1771: "AK388-2"

	if (r3 !== r4 && r4 !== r5) all_flops.push(`${f}-2`);
//If hole cards pair, they cannot have the 4-suit pattern: ss-ss
	if (r1!==r2) {
		all_flops.push(`${f}-3`);
	}
}
else {
//3 of a kind or 2 pair
	all_flops.push(`${f}-1`);
}

}
log(all_flops);
await fs.writeFile(`/home/me/Desktop/FLOPRANKSSUITS.json`, JSON.stringify(all_flops));
//log(all_flops.length);
//log(all_flops.uniq().length);
cwarn("OK!!!!");



};//»

const make_turn_suits=async()=>{//«

const pairs = [];
for (let i=0; i < RANKS.length; i++){//«
	let r1 = RANKS[i];
	for (let j=i; j < RANKS.length; j++){
		let r2 = RANKS[j];
		if (r1 < r2) pairs.push(`${r1}${r2}`);
		else pairs.push(`${r2}${r1}`);
	}
}//»
//let ranks = RANKS.slice(0, 12);
let ranks = RANKS;
let out=[];
for (let p of pairs){
	let p1 = p[0];
	let p2 = p[1];
	let is_pair = p1===p2;
	let to = is_pair ? 3 : 5;
//	let to = is_pair ? 2 : 4;
	for (let r of ranks){
//When any hole card pairs the board means this isn't a suited condition
		if (p1 === r || p2 === r) continue;
		let s;
		if (is_pair) s = p1 + r;
		else s = p1+p2+r;
		for (let i=1; i < to; i++){
			out.push(`${s}-${i}`);
		}
	}
}
log(out);
let rv = await fs.writeFile(`/home/me/Desktop/TURNSUITS.json`, JSON.stringify(out));
//let rv = await fs.writeNewFile(`/home/me/Desktop/TURNSUITS.json`, JSON.stringify(out), {reject: true});
//log(rv);
//if (!rv){
//log("COULD NOT WRITE THE NEW FILE");
//return;
//}
cwarn("OKAY DONE!!!!!");

};//»

const make_river_ranks=async()=>{//«

let all = [];
for (let t of turn_ranks){
	let a = t.split("");
	let r1 = t[0];
	let r2 = t[1];
	for (let r7 of RANKS){
		let r3 = t[2];
		let r4 = t[3];
		let r5 = t[4];
		let r6 = t[5];

		let tmp;
		if (r4 < r3){//«
			tmp = r3;
			r3 = r4;
			r4 = tmp;
		}//»
		if (r5 < r4){//«
			tmp = r4;
			r4 = r5;
			r5 = tmp;
			if (r4 < r3){//«
				tmp = r3;
				r3 = r4;
				r4 = tmp;
			}//»
		}//»
		if (r6 < r5){//«
			tmp = r5;
			r5 = r6;
			r6 = tmp;
			if (r5 < r4){//«
				tmp = r4;
				r4 = r5;
				r5 = tmp;
				if (r4 < r3){//«
					tmp = r3;
					r3 = r4;
					r4 = tmp;
				}//»
			}//»
		}//»
		if (r7 < r6){//«
		tmp = r6;
		r6 = r7;
		r7 = tmp;
			if (r6 < r5){//«
				tmp = r5;
				r5 = r6;
				r6 = tmp;
				if (r5 < r4){//«
					tmp = r4;
					r4 = r5;
					r5 = tmp;
					if (r4 < r3){//«
						tmp = r3;
						r3 = r4;
						r4 = tmp;
					}//»
				}//»
			}//»
		}//»
		let types={};
		types[r1]=1;
		types[r2] && types[r2]++ || (types[r2] = 1);
		types[r3] && types[r3]++ || (types[r3] = 1);
		types[r4] && types[r4]++ || (types[r4] = 1);
		types[r5] && types[r5]++ || (types[r5] = 1);
		types[r6] && types[r6]++ || (types[r6] = 1);
		types[r7] && types[r7]++ || (types[r7] = 1);
		if (types[r1] > 4 || types[r2] > 4 || types[r3] > 4 || types[r4] > 4 || types[r5] > 4 || types[r6] > 4 || types[r7] > 4) continue;
		all.push(`${r1}${r2}${r3}${r4}${r5}${r6}${r7}`);
	}
}
log(all);
let rv = await fs.writeFile(`/home/me/Desktop/RIVERRANKS.json`, JSON.stringify(all));
cwarn("OKAY", rv)

};//»

const make_river_suits=async()=>{//«
	let all = turn_suits.filter((s)=>{return s.match(/[13]$/);});
	//log(all);
	let rv = await fs.writeFile(`/home/me/Desktop/RIVERSUITS.json`, JSON.stringify(all));
	log(rv);
};//»

//»

//«

this.onappinit=async()=>{//«

//river_suits = await `/home/me/Desktop/RIVERSUITS.json`.toJSON();
//log("River suits");
//log(river_suits);

turn_suits = await `/home/me/Desktop/TURNSUITS.json`.toJSON();
log("Turn suits");
log(turn_suits);

//make_river_suits();
//log(turn_suits);
//make_turn_suits();
//flop_suits = await `/home/me/Desktop/FLOPRANKSSUITS.json`.toJSON();
//log(flop_suits);
//flops = await `/home/me/Desktop/FLOPRANKS.json`.toJSON();
//log(flops);
//make_all_flops();
//turn_ranks = await `/home/me/Desktop/TURNRANKS.json`.toJSON();
//make_river_ranks();
//log(turn_ranks);
//river_ranks = await `/home/me/Desktop/RIVERRANKS.json`.toJSON();
//log(river_ranks);
}//»
this.onkill=()=>{//«
};//»
this.onkeydown=(e,k)=>{//«
	if (k=="SPACE_"){
//		do_ranks_popin();
	}
};//»

//»

}
