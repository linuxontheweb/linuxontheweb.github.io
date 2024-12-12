/*12/12/24: NEW TERMINAL: (not really) "REWRITTEN" (not really) "FROM THE GROUND UP"«

Simply copy & paste everything in our working terminal into here.

This is about the ability to "think" LOTW, and to respond accordingly.

For example, kill_register is a concept in the Terminal, that I'm pretty sure
doesn't have any code pathways to register any kill_funcs (although it does
have a pathway to *call* them onkill->execute_kill_funcs()).

It was used pretty heavily used in the old 'root/code/mods/util/shell.js' module,
for example:

builtins = {
//...
'sleep': args => {//«
	let arg1 = args.shift();
	if (!arg1) {
		suse("seconds");
		return;
	}
	let time_str = toks_to_string([arg1]);
	let time_arr;
	if (time_str && time_str.match(/^[0-9]+(\.[0-9]+)?$/)) {
		let time = parseFloat(time_str);
		let msecs = parseInt((Math.floor(time * 10000)) / 10);
		if (typeof(msecs) == "number") {
			const end_sleep = () => {
				if (!sleep_timer) return;
				sleep_timer = null;
				cbok();
			};
			let sleep_timer = setTimeout(end_sleep, msecs);
			kill_register(killcb => {
				end_sleep();
				killcb && killcb();
			});
			global_timeouts.push(sleep_timer);
			return;
		}
	}
	cberr("could not parse args");
},
//»
//...
}

Let's do a clean template string for the DOM.

»*/
//Imports«
const util = LOTW.api.util;
const globals = LOTW.globals;
const{Desk}=LOTW;

const {
	strNum,
	isArr,
	isStr,
	isNum,
	isObj,
	isNode,
	isDir,
	isFile,
	isErr,
	make,
	kc,
	log,
	jlog,
	cwarn,
	cerr,
	normPath,
	linesToParas,
	isBool,
	isEOF,
	sleep
} = util;
//»

export const app=function(Win){

this.onappinit=()=>{//«

cwarn("APPINIT", Win.id);

}//»

//«key event callbacks
this.onkeydown=(e,k)=>{

}
this.onkeyup=(e,k)=>{

}
this.onkeypress=(e,k)=>{

}
//»

}
