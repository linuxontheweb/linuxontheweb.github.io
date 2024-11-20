//Imports«

const {globals} = LOTW;
const {log, cwarn, cerr} = LOTW.api.util;

//»

//Var«

let midiAccess;
let knob_vals = [];
let knobs = [undefined,[],[],[],[],[],[],[],[]];

//»

const midi_in = e => {//«

let dat = e.data;
let v1=dat[0];
let v2=dat[1];
let v3=dat[2];
if (v1==176){//Knob«

let cur = knob_vals[v2];

if (cur === undefined){
	knob_vals[v2] = v3;
log(`Knob(${v2}) initialized to ${v3}`);
	return;
}

let arr = knobs[v2];
for (let knob of arr){
	if (!knob.active) continue;
	if (knob.val === cur || knob.val === undefined) {
		knob.cb(v3);
		knob.val = v3;
	}
}

knob_vals[v2] = v3;

}//»

};//»
const Knob = function(cb){//«
	this.cb = cb;
};//»

export const mod=function(){

this.reset_knob_vals=()=>{//«
	knob_vals = [];
};//»
this.register_knob = (which, cb, opts={}) => {//«
	let arr = knobs[which];
	if (!arr){
cerr("Invalid knob number", which);
		return;
	}
	let knob = new Knob(cb);
	if (Number.isFinite(opts.initVal)) knob.val = opts.initVal;
	if (opts.noActivate) knob.active = false;
	else knob.active = true;
	arr.push(knob);
	return knob;
};//»
this.unregister_knob = (which, knob) => {//«
	let arr = knobs[which];
	if (!arr){
cerr("Invalid knob number", which);
		return;
	}
	let ind = arr.indexOf(knob);
	if (ind < 0){
cwarn("The knob does not exist in knob array:", which);
		return;
	}
	arr.splice(ind, 1);
};//»

this.get_midi = async(reinit) => {//«
	if (reinit){}
	else if (midiAccess) {
cwarn("Already have midi");
//log(knobs);
		return true;
	}
	midiAccess = await navigator.requestMIDIAccess({sysex: false});
	if (!midiAccess){
cerr("Could not get midi access");
		return;
	}
	const try_inputs = ()=>{//«
		let inputs = midiAccess.inputs.values();
		for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
			if (!input.value.name.match(/^Midi Through Port/)) {
//log(input);
				input.value.onmidimessage = midi_in;
			}
		}
	}//»
	midiAccess.onstatechange = e => {//«

		if (e instanceof MIDIConnectionEvent) {
if (e.port instanceof MIDIInput) {
log(`Midi input: ${e.port.connection}`);
}
else if (e.port instanceof MIDIOutput) {
//log(e);
log(`Midi output: ${e.port.connection}`);
}
else{
log(e);
}
		}
		else {
cwarn("WHAT MIDISTATECHANGE EVENT?");
log(e);
return;
		}
		try_inputs();
	};//»
	try_inputs();
	return true;
};//»

}
