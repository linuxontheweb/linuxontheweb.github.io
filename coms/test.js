
//Imports«

const util = LOTW.api.util;
const globals = LOTW.globals;
const{isArr,isStr,isEOF,log,jlog,cwarn,cerr, sleep}=util;
const{ShellMod, SHELL_ERROR_CODES}=globals;
const{E_SUC, E_ERR} = SHELL_ERROR_CODES;
const {Com} = ShellMod.comClasses;
const{Desk}=LOTW;

//»

//Commands«

const com_pipe = class extends Com{//«
	run(){
		if (!this.pipeFrom){
			this.no("Not in a pipe line");
		}
	}
	pipeIn(val){
		this.out(val);
	}
	pipeDone(){
		this.ok();
	}
/*
	pipeIn(val){
		this.out(val);
		if (isEOF(val)) this.ok();
	}
*/
}//»
const com_deadpipe = class extends Com{/*«*/
	run(){
		if (!this.pipeFrom){
			this.no("not in a pipe line");
		}
	}
	pipeDone(){
		this.ok();
	}
/*
	pipeIn(val){
//	this.out(val);
log("Dropping", val);
		if (isEOF(val)) this.ok();
	}
*/
}/*»*/
const com_badret=class extends Com{run(){this.end("SOME STRING RETURNED HAHAHA!?!?!");}}
const com_noret=class extends Com{run(){this.end();}}
const com_nullret=class extends Com{run(){this.end(null);}}
const com_badobj=class extends Com{run(){this.out({});this.no();}}
const com_badarrobj=class extends Com{run(){this.out([{}]);this.no();}}
const com_oktypedarr=class extends Com{run(){this.out(new Uint8Array([0,1,2,3,4]));this.ok();}}
const com_badtypedarr=class extends Com{run(){this.out(new Int32Array([0,1,2,3,4]));this.no();}}
const com_weirdarr=class extends Com{run(){this.out(["1) This line is a string","2) This line is also a string (but not the next one)",{},"4) This line is a string again!"]);this.ok();}}
const com_hang = class extends Com{/*«*/
	run(){
		this.inf("forever is a loooooong time!!!");
	}
}/*»*/
const com_norun=class extends Com{init(){this.ok(`Hi,this is from the init phase of '${this.name}'`);}}

//»

const coms = {//«

pipe: com_pipe,
deadpipe: com_deadpipe,
badret: com_badret,
noret: com_noret,
nullret: com_nullret,
badobj: com_badobj,
badarrobj: com_badarrobj,
oktypedarr: com_oktypedarr,
badtypedarr: com_badtypedarr,
weirdarr: com_weirdarr,
hang: com_hang,
norun: com_norun

}//»

const opts = {//«
//echodelay:{s:{d: 3}}
}//»

export {coms, opts};

