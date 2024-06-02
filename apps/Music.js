//Imports«
import { util, api as capi } from "util";
import {globals} from "config";
const{ log, cwarn, cerr, isnum} = util;
const {NS} = globals;
const {fs} = NS.api;
//»

export const app = function(Win, Desk) {

//Var«


let Main = Win.main;
let midi = globals.midi;
let did_set_cb = false;
let chord_mode = true;
let chord_note_cutoff = 79;

const OFFSETS=[ 0,2,4,5,7,9,11,12,14,16,17,19,21,23,24];
const NUM_NOTES = 20;
const notes = [];
const on_notes={};
let CURVE_VALS = [0,0.25,0.20,0.20,0.20,0.10,0];
let cur_note = 0;
let note_offset=0;

let ctx = globals.audioCtx || new AudioContext();
globals.audioCtx = ctx;

let main_gain = ctx.createGain();
main_gain.connect(ctx.destination);

//Notes«

let NOTE_TO_MIDI={};
let MIDI_TO_NOTE=[];

const MIDINOTES=(()=>{//«
//const noteToFreq=note=>{
//	let a = 440; //frequency of A (common value is 440Hz)
//	return (a / 32) * (2 ** ((note - 9) / 12));
//} 
	let arr = [];
	for (let i=0; i < 128; i++) arr[i]=13.75*(2**((i-9)/12));
	return arr;
})();//»
const NOTEMAP=(()=>{//«
	let notes=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
	let obj = {};
	let iter=0;
	OUTERLOOP: for (let j=-1; j <= 9; j++){
		for (let i=0; i < notes.length; i++){
			if (iter>127) break OUTERLOOP;
			let n = notes[i];
			let s = `${n}${j}`;
			let v = MIDINOTES[iter];
			obj[s] = v;
			MIDI_TO_NOTE[iter] = s;
			NOTE_TO_MIDI[s]=iter;
			if (n=="C#") {
				obj[`Db${j}`]=v;
				NOTE_TO_MIDI[`Db${j}`]=iter;
			}
			else if (n=="D#") {
				obj[`Eb${j}`]=v;
				NOTE_TO_MIDI[`Eb${j}`]=iter;
			}
			else if (n=="F#") {
				obj[`Gb${j}`]=v;
				NOTE_TO_MIDI[`Gb${j}`]=iter;
			}
			else if (n=="G#") {
				obj[`Ab${j}`]=v;
				NOTE_TO_MIDI[`Ab${j}`]=iter;
			}
			else if (n=="A#") {
				obj[`Bb${j}`]=v;
				NOTE_TO_MIDI[`Bb${j}`]=iter;
			}
			else if (n=="E") {
				obj[`Fb${j}`] = v;
				NOTE_TO_MIDI[`Fb${j}`]=iter;
			}
			else if (n=="F") {
				obj[`E#${j}`] = v;
				NOTE_TO_MIDI[`E#${j}`]=iter;
			}
			else if (n=="C") {
				obj[`B#${j}`] = MIDINOTES[iter+12];
				NOTE_TO_MIDI[`B#${j}`]=iter+12;
			}
			else if (n=="B") {
				obj[`Cb${j}`] = MIDINOTES[iter-12];
				NOTE_TO_MIDI[`Cb${j}`]=iter-12;
			}
			iter++;
		}
	}
	return obj;
})();//»


//»

//»

//Funcs«

const Note = function(which){//«
	let o = ctx.createOscillator();
	let g = ctx.createGain();
	let gain = g.gain;
	gain.value = 0;
	o.connect(g);
	o.start();
	g.connect(main_gain);

this.play=(val)=>{
	o.frequency.value = MIDINOTES[val];
	gain.setValueCurveAtTime(CURVE_VALS, ctx.currentTime, 0.5);
};

this.on=val=>{//«
	let tm = ctx.currentTime;
	o.frequency.value = MIDINOTES[val];
	gain.linearRampToValueAtTime(0.25, tm+0.0125);
	gain.linearRampToValueAtTime(0.10, tm+0.1);
	on_notes[MIDI_TO_NOTE[val]] = this;
};//»
this.off=()=>{//«
//log("OFF???");
//	gain.setTargetAtTime(0, ctx.currentTime-1, 0.1);
	gain.linearRampToValueAtTime(0, ctx.currentTime+0.5);

};//»

};//»

const try_set_cb=()=>{//«
	if (!midi) return cwarn("No midi!");
	if (did_set_cb) return;
	midi.set_cb(midi_cb);
	did_set_cb = true;
log("midi_cb: set");
}//»
const make_notes=()=>{//«
	for (let i=0; i < NUM_NOTES; i++){
		let n = new Note(i);
		notes.push(n);
	}
};//»
const midi_cb = e => {//«

//if (!main_gain) return;

let dat = e.data;
let v1 = dat[0]
let v2 = dat[1]
let v3 = dat[2]
if (v1==144){
	v2+=note_offset;
	if (chord_mode && v2 > chord_note_cutoff) v2 -= 12;
	let n = notes[cur_note];
	n.play(v2);
	cur_note++;
	if (cur_note === notes.length) cur_note = 0;
	return;
}
if (v1==192){
note_offset = OFFSETS[v2];
log(`Change key ${note_offset}`);
return;
}
//log(v1,v2,v3);
if (v1==176){
if (v2==5){
chord_note_cutoff = v3;
log(`chord_note_cutoff ${v3}`);
}
//log(v2);
}
//log(v1,v2,v3);

/*
else if (v1==128){
	let str = MIDI_TO_NOTE[v2];
	let n = on_notes[str];

	if (!n) return cwarn("NOTE NOT FOUND?!?!?!");
	n.off();
	delete on_notes[str];
}
*/
};//»

//»

//«

this.onappinit=async()=>{//«
	try_set_cb();	
	make_notes();
}//»
this.onkill=()=>{//«
	main_gain && main_gain.disconnect();
	midi && midi.rm_cb(midi_cb);
};//»
this.onkeydown=(e,k)=>{//«
	if (k=="SPACE_"){
chord_mode = !chord_mode;
log(`chord_mode: ${chord_mode}`);
	}
	else if (k=="m_"){
		try_set_cb();
	}
	else if (k=="v_"){
	}
};//»
this.onkeyup=(e,k)=>{//«

if (k=="SPACE_"){

}

};//»
this.ontextinput=str=>{
/*

When developing something like a modular synth app, we can receive the routing
graph string here and create a new Function with it by passing the audio
context as the first argument. If we are creating a "source type" node, we just
need to receive an output node (like Gain or Oscillator) that has a connect
method. Otherwise, a "filter type" node will need an input node that we can
call connect with and an output node that has a connect method, which will end
up at the destination.

*/

log("IN", str);
};

//»

}
