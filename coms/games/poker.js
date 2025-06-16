//Imports«

const {Com} = LOTW.globals.ShellMod.comClasses;
const{isArr,isStr,isEOF,log,jlog,cwarn,cerr}=LOTW.api.util;

//»

//Commands«
const com_poker = class extends Com {
	run(){
		this.ok("Hello Poker2: That was honslerativity!!!!!");
	}
}
//»

const coms = {//«
	poker: com_poker,
}//»

export { coms };

