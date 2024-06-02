//Imports«

import { util, api as capi } from "util";
import {globals} from "config";
const {NS}=globals;
const {fs} = NS.api;
const{log, cwarn, cerr, isnum, make, mkdv} = util;

//»

export const app = function(Win, Desk) {

//Var«

let Main = Win.main;
let workers = [];
let intervals = [];

//let HOLES;
let FLOPS;
let TURNS;
let RIVERS;

let numThreads;

//const MINS_PER_POLL = 5;
//const SECS_PER_POLL = MINS_PER_POLL * 60;
//const MS_PER_POLL = 1000 * SECS_PER_POLL;
let MINS_PER_POLL, MS_PER_POLL;

let itersPerCycle;

let interval;

//»

//Funcs«

const start_worker=()=>{//«

	let worker = new Worker(`/mods/workers/poker.js?r=${(Math.random()+"").slice(12)}`);
	workers.push(worker);
cwarn(`Starting worker: ${workers.length}`);
//	worker.postMessage({id: workers.length});
	if (itersPerCycle){
		worker.postMessage(JSON.stringify({itersPerCycle}));
	}
	worker.onmessage=e=>{
		if (e.data.FLOPS) add_all(e.data);
	};
	intervals.push(setInterval(()=>{
		worker.postMessage("POLL");
	}, MS_PER_POLL));

}//»
const add_all = async(o) => {//«
/*
let holes = o.HOLES;//«
let keys = Object.keys(holes);
for (let k of keys){
	let h = holes[k];
	let H = HOLES[k];
	if (H){
		H.n+=h.n;
		H.t+=h.t;
	}
	else{
		HOLES[k] = h;
	}
}
//»
*/
let flops = o.FLOPS;//«
let keys = Object.keys(flops);
for (let k of keys){
	let f = flops[k];
	let F = FLOPS[k];
	if (F){
		F.n+=f.n;
		F.t+=f.t;
	}
	else{
		FLOPS[k] = f;
	}
}//»
let turns = o.TURNS;//«
keys = Object.keys(turns);
for (let k of keys){
	let T = TURNS[k];
	let t = turns[k];
	if (T){
		T.n+=t.n;
		T.t+=t.t;
	}
	else{
		TURNS[k] = t;
	}
}//»
let rivers = o.RIVERS;//«
keys = Object.keys(rivers);
for (let k of keys){
	let R = RIVERS[k];
	let r = rivers[k];
	if (R){
		R.n+=r.n;
		R.t+=r.t;
	}
	else{
		RIVERS[k] = r;
	}
}//»

//log("Holes",Object.keys(HOLES).length);
//log("Flops",Object.keys(FLOPS).length);
//log("Turns",Object.keys(TURNS).length);
//log("Rivers",Object.keys(RIVERS).length);

//await fs.writeFile(`/home/me/.data/poker/HOLE_EV.json`, JSON.stringify(HOLES));
await fs.writeFile(`/home/me/.data/poker/FLOP_EV.json`, JSON.stringify(FLOPS));
await fs.writeFile(`/home/me/.data/poker/TURN_EV.json`, JSON.stringify(TURNS));
await fs.writeFile(`/home/me/.data/poker/RIVER_EV.json`, JSON.stringify(RIVERS));

cwarn("Saved!");

};//»
const init = async (arg) => {//«

if (arg.minsPerPoll){
	MINS_PER_POLL = arg.minsPerPoll;
	if (!Number.isFinite(MINS_PER_POLL) && MINS_PER_POLL >= 1){
cerr(`Invalid number of minutes per poll!!!`);
		return;
	}
}
else{
	MINS_PER_POLL = 1;
}
cwarn(`Minutes per poll: ${MINS_PER_POLL}`);
MS_PER_POLL = 60000 * MINS_PER_POLL;

if (arg.numThreads){
	numThreads = arg.numThreads;
}
else numThreads = 1;

if (!Number.isFinite(numThreads) && numThreads > 0){
	cerr(`Invalid number of threads!!!`);
	return;
}

if (arg.itersPerCycle){
	itersPerCycle = arg.itersPerCycle;
	if (!Number.isFinite(itersPerCycle) && itersPerCycle > 1000){
		cerr(`Invalid itersPerCycle!!!`);
		return;
	}
}

cwarn(`numThreads: ${numThreads}`);

//HOLES = await `/home/me/.data/poker/HOLE_EV.json`.toJSON();
//if (!HOLES) HOLES={};
FLOPS = await `/home/me/.data/poker/FLOP_EV.json`.toJSON();
if (!FLOPS) FLOPS={};
TURNS = await `/home/me/.data/poker/TURN_EV.json`.toJSON();
if (!TURNS) TURNS={};
RIVERS = await `/home/me/.data/poker/RIVER_EV.json`.toJSON();
if (!RIVERS) RIVERS = {};
//log("HOLES",HOLES);

start_worker();
//numThreads--;

if (numThreads > 1) {

	let ms_between_threads = MS_PER_POLL / numThreads;
	numThreads--;
	let interval = setInterval(()=>{
		start_worker();
		numThreads--;
		if (!numThreads){
			clearInterval(interval);
cwarn("All workers have been started");
		}
	}, ms_between_threads);

}


};//»

//»

//Obj/CB«

this.onappinit=init;
this.onkill=()=>{//«
	for (let worker of workers) {
		worker.terminate();
	}
	for (let interval of intervals) {
		clearInterval(interval);
	}
};//»
this.onkeydown=(e,k)=>{//«
//	if (k=="SPACE_") worker.postMessage("TOGGLE");
//	else if (k=="ENTER_") worker.postMessage("POLL");
};//»

//»

}










/*«

const init = async()=>{//«
	const model = tf.sequential();
	model.add(tf.layers.dense({units: 1, inputShape: [1]}));
	// Prepare the model for training: Specify the loss and the optimizer.
	model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});
	// Generate some synthetic data for training. (y = 2x - 1)
	const xs = tf.tensor2d([-1, 0, 1, 2, 3, 4], [6, 1]);
	const ys = tf.tensor2d([-3, -1, 1, 3, 5, 7], [6, 1]);

	// Train the model using the data.
log("Start");
let now = Date.now();
	await model.fit(xs, ys, {epochs: 250});
log(`Done: ${Date.now() - now}ms`);
	// Use the model to do inference on a data point the model hasn't seen.
	// Should print approximately 39.
	//  document.getElementById('micro-out-div').innerText =
	let val = model.predict(tf.tensor2d([20], [1, 1])).dataSync();
log(val);
}//»

»*/

