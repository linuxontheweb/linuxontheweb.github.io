(()=>{"use strict";const APPNAME="dev.Counter";

const{
log, cwarn, cerr, make, mkdv
} = LOTW.api.util;
let timer;
let numdiv;
let iter = 1;
const run_anim = () => {
	const doit = () => {
		iter++;
		numdiv.innerHTML = `${iter}`;
		timer = setTimeout(doit, 100);
	};
	timer = setTimeout(doit, 100);
};

const toggle_anim = () => {
	if (timer) {
		clearTimeout(timer);
		timer = null;
	}
	else{
		run_anim();
	}
};
;

LOTW.apps[APPNAME] = class {
	constructor(Win){
		this.Win = Win;
	}
onappinit(){
//	this.Win.Main.innerHTML='<center><h1>Your awesome app goes here!</h1></center>';
//let div - 
const main = this.Win.Main;
//log(mkdv);
numdiv = mkdv();
this.numdiv = numdiv;
numdiv._ta = "center";
main._add(numdiv);
numdiv.innerHTML = "1";
this.onresize();
//run_anim();
}
onresize(){

this.numdiv._fs = 0.85 * this.Win.h;

}
	onkill(){
	//Handle window "kill" event
//console.warn(`Closed!`);
clearTimeout(timer);
	}
	onkeydown(e, sym){
	//Handle key down
//console.log(`Got: ${e.key}`);
if (sym === " _"){
toggle_anim();
}
	}
}

})();
