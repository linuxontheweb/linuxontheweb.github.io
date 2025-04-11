
//Imports«

//const{globals, Desk}=LOTW;
const {Com} = LOTW.globals.ShellMod.comClasses;
//const{isArr,isStr,isEOF,log,jlog,cwarn,cerr}=LOTW.api.util;
//»

//Commands«
const com_template = class extends Com{
	run(){
		this.ok("I'm a template command!");
	}
}
//»

const coms = {//«
	template: com_template,
}//»

export {coms};

