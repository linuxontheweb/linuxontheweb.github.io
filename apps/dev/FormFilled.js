(()=>{"use strict";const APPNAME="dev.FormFilled";
/*9/2/26: The controlled form that simply exists for its graphical
"look and feel". Every sort of functionaliy can be offloaded to
the bottomWin (FormFiller).
*/

const{
log, cwarn, cerr,
make, mkdv, mksp,
sleep
}=LOTW.api.util;

const wdg = LOTW.api.widgets;
const {poperr, popok} = wdg;

const mkinp = () => { return make("input"); };
const mkbr = () => { return make("br"); };

const FORM_LABELS = ["Val 1", "Op", "Val 2"];
const FORM_VALUES = [Math.PI+"", "-", Math.E+""];
const INPUTS = [];

let paused = false;
const resume = () => {//«
	return new Promise((Y,N)=>{
		let which = 0;
		let interval = setInterval(()=>{
			if (paused){
				which++;
log(`PAUSED: ${which}`);
			}
			else {
				clearInterval(interval);
				Y();
			}
		}, 250);
	});
};//»
const run_animation = async () => {//«

await sleep(750);
/*
setTimeout(()=>{
	paused = true;
	setTimeout(()=>{
		paused = false;
	}, 2000);
}, 500);
*/

for (let i=0; i < INPUTS.length; i++){
let inp = INPUTS[i];
let val = FORM_VALUES[i];
for (let ch of val){
if (paused) await resume();
//log(ch);
inp.value += ch;
await sleep(150);
}
}

};//»

LOTW.apps[APPNAME] = class {//«
	constructor(Win){/*«*/
		Win.title = APPNAME;
		this.Win = Win;
		this.Main = Win.Main;
	}/*»*/
togglePaused(){//«
	paused = !paused;
}//»
makeDOM(){//«
let {Main} = this.Win;
Main._ta = "center";
//Main._add(mkbr());
let header = mkdv();
header.innerHTML = "<h3>Automated Form</h3>";
Main._add(header);
//Main._add(mkbr());
//let inputs = [];
for (let field of FORM_LABELS){//«
let sp = mksp();
sp.innerHTML = `${field}:&nbsp;`;
Main._add(sp);
let inp = mkinp();
inp._fs = "24px";
INPUTS.push(inp);
inp.disabled = true;
inp._bgcol = "#ddd";
inp.size = 15;

Main._add(inp);

Main._add(mkbr());
Main._add(mkbr());

}//»
this.makePauseButton();
this.makeDoneButton();

}//»
makeDoneButton(){//«

	let {Main} = this.Win;
	let but = make("button");
	this.doneBut = but;
	but.disabled = true;
	but.innerHTML = "Submit";
	Main._add(but);
	but.onclick = ()=>{//«
		let str = "";
		for (let inp of INPUTS) {
			str += inp.value;
		}
		let rv = eval(str);
		let exp = `${str} = ${rv}`;
		popok(exp, {title: "Final Results"});
	};//»

}//»
makePauseButton(){//«

	let {Main} = this.Win;
	let but = make("button");
	but._marr = 20;
	this.pauseBut = but;
	but.innerHTML = "Pause";
	Main._add(but);
	but.onclick = ()=>{//«
		paused = !paused;
log(`PAUSED: ${paused}`);
	};//»

}//»
async onappinit(){//«

//this.Win.Main.innerHTML='<center><h1>Form filled prototype</h1></center>';
this.makeDOM();
await run_animation();
this.pauseBut.disabled = true;
this.doneBut.disabled = false;

}//»

}//»

})();
