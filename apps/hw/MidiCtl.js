//Imports«
const NS = window._OS_;
const {globals} = NS;
const {log, cwarn, cerr, mkdv, getMod} = NS.api.util;

let midiCtl = globals.mods.midiCtl || {knobs:[]};
globals.mods.midiCtl = midiCtl;
let knobs = midiCtl.knobs;
let curknob = midiCtl.curKnob;
//»

const Knob = function(_knob, name){//«

let d = mkdv();
d.style.textAlign="center";
let nmdv = mkdv();
d._add(nmdv);
nmdv._fs = 18;
nmdv._fw = "bold";
nmdv.innerHTML=name;
let valdv = mkdv();
valdv.innerHTML="?";
valdv._fs = 21;
d._add(valdv);

d._knob = this;
d._mar = 5;
d._pad = 7;
d._bgcol="#004";
d._w=100;
d._bor = "1px solid transparent";
this.div = d;
this.knob = _knob;
this.on=()=>{
	d._bor = "1px solid #aaa";
};
this.off=()=>{
	d._bor = "1px solid transparent";
};
this.toggle_status = () => {
	_knob.active = !_knob.active;
	if (_knob.active) d._bgcol = "#004";
	else d._bgcol = "#400";
};
this.update = val => {
	valdv.innerHTML = Math.floor(100*(val/127))+"%";
};
d.onclick = this.toggle_status;
_knob.div = d;

};//»

export const app = function(Win){

//Var«

let killed = false;

let midi_mod;

//»

//DOM«

const {Main, Desk, status_bar} = Win;
Main._overy="auto";
Main._overx="hidden";

const icondv = mkdv();
icondv.id=`icondiv_${Win.id}`;
icondv._mar=5;
icondv.main = Main;
icondv.win = Main.top;
icondv._pos = "relative";
icondv._dis="flex";
icondv.style.flexBasis=`100px`;
icondv.style.flexShrink=0;
icondv.style.flexGrow=0;
icondv.style.flexWrap="wrap";
Main._add(icondv);

//»

const prev_knob_on=()=>{//«
	if (killed) return;
	let prev = curknob.div.previousSibling
	if (!prev) prev = icondv.lastChild;
	prev = prev._knob;
	curknob.off();
	prev.on();
	curknob = prev;
};//»
const next_knob_on=()=>{//«
	if (killed) return;
	let next = curknob.div.nextSibling;
	if (!next) next = icondv.firstChild;
	next = next._knob;
	curknob.off();
	next.on();
	curknob = next;
};//»

this.onappinit=async()=>{//«

midi_mod = await getMod("hw.midi");

if (!midi_mod) {
cerr("midi mod???");
	return;
}
if (!await midi_mod.get_midi()){
cerr("NO MIDI!?!!?");
	return;
}
for (let knob of knobs){
	icondv._add(knob.div);
}

/*«

//if (knobs.length){//«
//	for (let i=1; i<=8; i++){
//		let knob = knobs[i];
//		if (!knob) continue;
//log("ADD",knob);
//		icondv._add(knob.div);
//	}

//}//»
if (knobs.length){//«

	for (let i=1; i<=8; i++){
		let knob = knobs[i];
		if (!knob) continue;
		icondv._add(knob.div);
	}

}//»
else {//«

	for (let i=1; i<=8; i++){
		let cb = val => {knob.update(val);};
		let _knob = midi_mod.register_knob(i, cb, {initVal: 0});
		let knob = new Knob(_knob, i);
		knob.update(0);
		icondv._add(knob.div);
		knobs[i] = knob;
	}

	curknob = knobs[1];

}//»
»*/

if (curknob) curknob.on();
globals.apps.midiCtl = this;

};//»

this.onregisterknob=(knob_num, name, cb, opts={})=>{//«
	let _knob = midi_mod.register_knob(knob_num, (val)=>{
		cb(val);
		knob.update(val);
	}, opts);
	let knob = new Knob(_knob, name);
	if (Number.isFinite(opts.initVal)) knob.update(opts.initVal);
	icondv._add(knob.div);
	if (!knobs.length){
		curknob = knob;
		curknob.on();
	}
	knobs.push(knob);
	return knob;
};//»
this.onunregisterknob=(knob_num, knob)=>{//«
	let ind = knobs.indexOf(knob);
	if (ind < 0){
cwarn("What knob is this?", knob);
		return;
	}
	knobs.splice(ind, 1);
	if (!knobs.length){
		curknob = null;
	}
	else if (knob === curknob){
		next_knob_on();
	}
	knob.div._del();
	midi_mod.unregister_knob(knob_num, knob.knob);
};//»
this.onkill = ()=>{//«
	midiCtl.curKnob = curknob;
	killed = true;
};//»
this.onkeydown=(e,k)=>{//«

if (!curknob) return;
if (k==="LEFT_"){
	prev_knob_on();
}
else if (k==="RIGHT_"){
	next_knob_on();
}
else if (k=="SPACE_"){
curknob.toggle_status();
}
};//»

}


