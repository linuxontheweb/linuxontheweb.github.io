//Imports«
import { util, api as capi } from "util";
import {globals} from "config";

const{ log, cwarn, cerr, isnum, make, mkdv} = util;
//»

export const app = function(Win, Desk) {

//Var«

let Main = Win.main;

//»

//Worker str«
let str = `
const log=(...args)=>{console.log(...args);}
let flag = false;
let num_messages = 0;
let stop = false;
let num_cycles = 0;
onmessage=(e)=>{
	if (e.data==="ENTER_") stop = true;
	else if (e.data==="SPACE_") flag = true;
	num_messages++;
};
const do_it=()=>{
	if (flag){
		self.postMessage("Mess: "+num_messages+" Cycles:"+num_cycles);
		flag = false;
	}
	else if (stop){
		self.postMessage("STOPPED> Mess: "+num_messages+" Cycles:"+num_cycles);
		return;
	}
	setTimeout(()=>{
		num_cycles++;
		let start = Date.now();
		let to = start + 1000;
		while(true){
			if (Date.now() > to){
				do_it();
				break;
			}
		}
	},0);
};
do_it();

`;
//»

//Create worker«
let url = URL.createObjectURL(new Blob([str]));
let worker = new Worker(url);
worker.onmessage=(e)=>{
	log(e.data);
};
//»

this.onkill=()=>{//«
worker.terminate();
log(worker);
};//»
this.onkeydown=(e,k)=>{//«
	worker.postMessage(k);
}//»
this.onappinit=()=>{//«


}//»

}

