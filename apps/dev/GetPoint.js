
//Imports«

const{isarr, isstr, isnum, isobj, make, log, jlog, cwarn, cerr}=LOTW.api.util;

//»

export const app = function(Win, Desk) {

//Var«

let Main = Win.main;

//»

//Funcs«

const get_point=async()=>{
let rv = await Win.selectPoint({isRelative: true});
log(rv);
};

//»

//«
this.onappinit=async()=>{//«
Win.main.innerHTML="<h1>Har, things, places, lor, lor, lor<h1>";
}//»
this.onkill=()=>{//«
};//»
this.onkeydown=(e,k)=>{//«
	if (k=="SPACE_"){
		get_point();
	}
};//»
this.onkeyup=(e,k)=>{
	if (k=="SPACE_"){
	}
};

//»

}
