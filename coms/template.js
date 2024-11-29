
//Imports«

const util = LOTW.api.util;
const globals = LOTW.globals;
const{isArr,isStr,isEOF,log,jlog,cwarn,cerr}=util;
const{comClasses, SHELL_ERROR_CODES}=globals;
const{E_SUC, E_ERR} = SHELL_ERROR_CODES;
const {Com} = comClasses;
const{Desk}=LOTW;

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



const opts = {//«

}//»

export {coms, opts};

