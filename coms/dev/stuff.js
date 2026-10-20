(()=>{"use strict";const LIBNAME="dev.stuff";
//Imports«

//const{globals, Desk}=LOTW;
const {Com} = LOTW.globals.ShellMod.comClasses;
const{isArr,isStr,isEOF,log,jlog,cwarn,cerr}=LOTW.api.util;
//»

//Init«

let ctx = LOTW.globals.audio.ctx;;

if (!ctx) {
	ctx = new AudioContext();
	LOTW.globals.audio.ctx = ctx;
}

let outgain = ctx.createGain();
outgain.connext(ctx);

//»


//Commands«
const com_date = class extends Com{
	run(){
let arr = (new Date()+"").split(" ");
let tz1 = arr[6][1]
let tz2 = arr[7][0];
let tz3 = arr[8][0];
let tz = `${tz1}${tz2}${tz3}`;
let str = `${arr[0]} ${arr[1]} ${arr[2]} ${arr[4]} ${tz} ${arr[3]}`;

this.out(str);

		this.ok();
	}
}
//»

const coms = {//«
	date: com_date,
}//»

const onkill = ()=>{
log("KILL!");
outgain.disconnect();
};

LOTW.coms[LIBNAME] = {coms, onkill};

})();

