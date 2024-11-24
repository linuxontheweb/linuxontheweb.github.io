//Imports«

import { util, api as capi } from "util";
import { globals } from "config";
const{isarr, isstr, isnum, isobj, make, KC, kc, log, jlog, cwarn, cerr}=util;

//»

export const app = function(Win) {

//Var«

let ONVOL = 0.66;
let cur_vol = ONVOL;
let hold_gain;

//Midi Notes«

let NOTE_TO_MIDI={};
let MIDI_TO_NOTE=[];
const MIDINOTES=(()=>{//«
//const noteToFreq=note=>{
//    let a = 440; //frequency of A (common value is 440Hz)
//    return (a / 32) * (2 ** ((note - 9) / 12));
//} 
	let arr = [];
	for (let i=0; i < 128; i++) arr[i]=13.75*(2**((i-9)/12));
	return arr;
})();//»
const MIDICENTS=(()=>{//«
//const noteToFreq=note=>{
//    let a = 440; //frequency of A (common value is 440Hz)
//    return (a / 32) * (2 ** ((note - 9) / 12));
//} 
	let arr = [];
	for (let i=0; i < 12800; i++) arr[i]=1375*(2**((i-900)/1200));
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

//log(MIDINOTES);
//log(NOTEMAP);
//log(NOTE_TO_MIDI);
//log(MIDI_TO_NOTE);
/*Midi values 

*/

//»
//Vowels«
//Vowels created with createPeriodicWave with all harmonics passing through bandpass filters of Q=10.
let VOWELS=[

[490, 1350, 1690, "er"],
[730, 1090, 2440, "aah"],
[520, 1190, 2390, "uh"],
[660, 1720, 2410, "ah"],
[300, 870, 2240, "oo"],
[570, 640, 2410, "aw"],
[270, 2290, 3010, "ee"],
[530, 1840, 2480, "eh"],
[390, 1990, 2550, "ih"],
[440, 1020, 2240, "ou"]
]

let cur_vowel = 0;
let num_vowels = VOWELS.length;

//»

/*Midi to Freq Examples«
32 = 51.9
38 = 73.4
43 = 97.9988
47 = 123.47
50 = 156.8
55 = 195.99
57 = 220
59 = 246.94
»*/

let midi = globals.midi;

//log(globals.midi);
//const NUM_TO_MIDI=[32,35,38,41,44,47,50,53,56];
let LOWPASS_FREQ = 750;
let LOWPASS_Q = 1;

let SET_VOWEL_EVERY_MS = 250;
let SET_VOWEL_EVERY_SEC = SET_VOWEL_EVERY_MS/1000;

let OMOD_FREQ = 2;
let OMOD_GAIN = 200;

let DETRANGE = 0;
let DETRANGE_HALF = DETRANGE/2;

let SET_DET_EVERY = 12;

let base_midi = 50;
let midi_range = 20;
let high_midi = base_midi + midi_range;

let cur_midi = Math.floor((base_midi+high_midi)/2);
let base_midi_cents = base_midi*100;

let MIDI_NUM_STEP = 1;

let NUM_HARM_PARTIALS = 15;
//let basefreq = MIDICENTS[base_midi_cents]/100;

//let muted = true;
let muted = false;

let loop_iter=-1;
let do_trigger = false;

let TRIGGER_EVERY_MS = 7000;

let next_vowel_set;
let next_vowel_trigger;

let voice;

let wave_table;

let omod;
let formant_filt_1;
let formant_filt_2;
let formant_filt_3;
let lowpass;
let base_freq_range_cents = 12;
//let f1, f2, f3;
let AMP_CURVE_DECAY = 0.5;
let AMP_CURVE_ITERS = 10;
let CURVE_SECS=3.5;
let amp_gain;

let rafId;

//Web Audio«


let ctx = globals.audioCtx || new AudioContext();
globals.audioCtx = ctx;

const OUT = ctx.createBiquadFilter();
OUT.frequency.value=1000;
const LINEOUT = ctx.createGain();
const OUTGAIN = LINEOUT.gain;
if (muted) OUTGAIN.value=0;
else OUTGAIN.value = cur_vol;
//LINEOUT.connect(OUT);
LINEOUT.connect(ctx.destination);

//»

//»

//DOM«

const {Main} = Win;

Main._fs=64;
Main._dis="flex";
Main.style.alignItems="center";
Main.style.justifyContent="center";

Win.statusBar.innerHTML="0-9 to change vowels | Space to play";

//»

//Funcs«
let did_set_cb = false;
const midi_cb=(e)=>{
let dat = e.data;
let v1 = dat[0]
let v2 = dat[1]
let v3 = dat[2]
if (v1==176){
if (v2==1){
let got = Math.floor(v3/4)+1;
if (got===SET_DET_EVERY) return;
SET_DET_EVERY = got;
log("Skip", SET_DET_EVERY);
}
else if (v2==2){

let got = Math.floor(v3/1)*25;
if (got===DETRANGE) return;
DETRANGE = got;
DETRANGE_HALF = DETRANGE/2;
log("Detune range", DETRANGE);

}
else if (v2==3){

voice.set_mod_freq(v3/10);

}
else if (v2==4){

voice.set_mod_gain(10*v3);

}
else if (v2==8){

cur_vol = ONVOL*v3/128;
OUTGAIN.value = cur_vol;
log("Volume", v3/128);
}
//log(v2,v3);
}
};
const try_set_cb=()=>{//«
    if (!midi) return cwarn("No midi!");
    if (did_set_cb) return;
    midi.set_cb(midi_cb);
    did_set_cb = true;
log("midi_cb: set");
}//»
const trigger=()=>{//«

try{
		amp_gain.gain.setValueCurveAtTime(AMP_CURVE, now(0), CURVE_SECS);
}catch(e){
	amp_gain.gain.cancelScheduledValues(now(0));
	amp_gain.gain.setValueCurveAtTime(AMP_CURVE, now(0), CURVE_SECS);
}

};//»
const make_wavetable=()=>{//«

let reals=[0,1];
let imags=[0,0];
//let if_even=false;
//let if_even=true;

//Even harmonics (higher ring)
//let real = new Float32Array([0,1,0.66,0,0.33,0,0.166]);
//let imag = new Float32Array([0,0,0,0,0,0,0]);

//Odd harmonics (a gong)
for (let i=2; i <= NUM_HARM_PARTIALS; i++){
//	if (if_even) reals[i]=i%2?0:1;
//	else reals[i]=i%2;
	reals[i]=1;
	imags[i]=0;
}
//log(reals);
//let real = new Float32Array([0,1,0,0.66,0,0.33,0,0.166]);
//let imag = new Float32Array([0,0,0,0,0,0,0,0]);
let real = new Float32Array(reals);
let imag = new Float32Array(imags);

wave_table = ctx.createPeriodicWave(real, imag, {disableNormalization: false});

}//»
const midi_cents_to_freq=(cents)=>{return MIDICENTS[cents]/100;};

const con=(node1,node2)=>{node1.connect(node2);};
const cons=(arr)=>{let to=arr.length-1;for(let i=0;i<to;i++)arr[i].connect(arr[i+1]);};
const conp=(arg1,arg2)=>{//«
	let arr1;
	if (arg1.connect) arr1 = [arg1];
	else if (arg1.length) arr1 = arg1;
	else throw "Bad arg1";

	let arr2;
	if (arg2.connect) arr2 = [arg2];
	else if (arg2.length) arr2 = arg2;
	else throw "Bad arg2";

	for (let n1 of arr1){
		for (let n2 of arr2) n1.connect(n2);
	}
};//»

const osc = (freq, type)=>{//«
    let o = ctx.createOscillator();
    o.frequency.value = freq;
    if (type) o.type=type;
    o.start();
    return o;
};//»
const sin = freq=>{return  osc(freq, "sine")};
const tri = (freq)=>{return osc(freq, "triangle");};
const saw = (freq)=>{return osc(freq, "sawtooth");};
const sqr = (freq)=>{return osc(freq, "square");};

const gn = (val)=>{//«
    let g = ctx.createGain();
    if (Number.isFinite(val)) g.gain.value = val;
    return g;
};//»
const bqf = (freq, type) => {//«
	let f = ctx.createBiquadFilter();
	if (freq) f.frequency.value = freq;
	if (type) f.type = type;
	f.Q.value = 10.0000001;
	return f;
};//»
const now=(add)=>{if(!add)add=0;return ctx.currentTime+add;};
const vol=val=>{//«
	if(OUTGAIN.value===val) return;
	OUTGAIN.value=val;
///	OUTGAIN.exponentialRampToValueAtTime(1, ctx.currentTime+0.5);
};//»

//»

const Voice = function(cents){//«

let noise1 = new AudioWorkletNode(ctx, "random-walk-audio-node-1");
let range1 = noise1.parameters.get("range");
let center1 = noise1.parameters.get("center");
let step1 = noise1.parameters.get("step");
range1.value = 800;
//center1.value = -100;
step1.value = 20;

let o1 = osc(midi_cents_to_freq(cents));
let g1 = gn(1);
o1.setPeriodicWave(wave_table);
o1.connect(g1);

let omod = sin(OMOD_FREQ);
let omodg = gn(OMOD_GAIN);
omod.connect(omodg);
//omodg.connect(o1.detune);
noise1.connect(o1.detune);

conp(g1,[formant_filt_1,formant_filt_2,formant_filt_3]);
conp([formant_filt_1,formant_filt_2,formant_filt_3], lowpass);

this.set_mod_freq=(freq)=>{
	omod.frequency.value = freq;
}
this.set_mod_gain=(gain)=>{
	omodg.gain.value = gain;
}

this.set_freq=(cents, tm)=>{//«

//let tm = now(0.5);
o1.frequency.exponentialRampToValueAtTime(midi_cents_to_freq(cents), tm);

};//»

}//»

const do_loop=(stamp)=>{//«
//return;
//if (!next_vowel_trigger) next_vowel_trigger = stamp+TRIGGER_EVERY_MS;
if (do_trigger) {
if (!next_vowel_trigger || stamp > next_vowel_trigger){
	next_vowel_trigger = stamp+TRIGGER_EVERY_MS;
	trigger();
}
}

if (!next_vowel_set||stamp > next_vowel_set){
	next_vowel_set = stamp+SET_VOWEL_EVERY_MS;
//	cur_vowel++;
//	if (cur_vowel===num_vowels) cur_vowel = 0;
	cur_vowel = Math.floor(Math.random()*num_vowels);
	let vow = VOWELS[cur_vowel];
	let tm = now(SET_VOWEL_EVERY_SEC);
	formant_filt_1.frequency.linearRampToValueAtTime(vow[0], tm);
	formant_filt_2.frequency.linearRampToValueAtTime(vow[1], tm);
	formant_filt_3.frequency.linearRampToValueAtTime(vow[2], tm);

//	let which = Math.floor(Math.random()*10);
	let dir = Math.random() < 0.5 ? 1:-1;;
	cur_midi += dir*MIDI_NUM_STEP;
	if (cur_midi < base_midi) cur_midi = base_midi;
	else if (cur_midi > high_midi) cur_midi = high_midi;
//log(cur_midi);
	voice.set_freq(cur_midi*100,tm);

}
if (!(loop_iter%SET_DET_EVERY)) {
	let v1 = Math.random()*DETRANGE - DETRANGE_HALF;
	let v2 = Math.random()*DETRANGE - DETRANGE_HALF;
	let v3 = Math.random()*DETRANGE - DETRANGE_HALF;
	formant_filt_1.detune.value = v1;
	formant_filt_2.detune.value = v2;
	formant_filt_3.detune.value = v3;
}
loop_iter++;
rafId = requestAnimationFrame(do_loop);

};//»

let AMP_CURVE =//«
[
0,
0.0078125, 
0.015625, 
0.03125, 
0.0625, 
0.125, 
0.25, 
0.5, 
1,
0.5, 
0.25, 
0.125, 
0.0625, 
0.03125, 
0.015625, 
0.0078125, 
0
]//»

const init=async()=>{//«
await ctx.audioWorklet.addModule("/mods/audio/random_walk_worklet.js");

try_set_cb();
/*«
{
	AMP_CURVE=[0.0625, 0.125, 0.25];
	let CURAMP=0.5;
	for (let i=0; i < AMP_CURVE_ITERS; i++){
		AMP_CURVE.push(CURAMP);
		CURAMP*=AMP_CURVE_DECAY;
	}
	AMP_CURVE.push(0);
//log(AMP_CURVE);
}
»*/

make_wavetable();

let vow = VOWELS[cur_vowel];
formant_filt_1=bqf(vow[0],"bandpass");
formant_filt_2=bqf(vow[1],"bandpass");
formant_filt_3=bqf(vow[2],"bandpass");

lowpass = bqf(LOWPASS_FREQ, "lowpass");
lowpass.Q.value = LOWPASS_Q;

voice = new Voice(base_midi_cents);

//log(voice);
//conp([formant_filt_1,formant_filt_2,formant_filt_3],lowpass);
if (do_trigger) {
	amp_gain = gn();
	amp_gain.gain.value = 0;

	lowpass.connect(amp_gain);

	amp_gain.connect(LINEOUT);
}
else{
	lowpass.connect(LINEOUT);
}
//lowpass.connect(OUTGAIN);
//conp([formant_filt_1,formant_filt_2,formant_filt_3],LINEOUT);

if (!muted) rafId = requestAnimationFrame(do_loop);

}//»

//OBJ/CB«

this.onappinit=init;

this.onloadfile=bytes=>{};
this.onkeydown = function(e,s) {//«
//	if (s==="SPACE_") vol(1);
	let marr;
	if (s==="SPACE_") {
if (do_trigger) trigger();
else {
	if (muted) {
		OUTGAIN.value = cur_vol;
		rafId = requestAnimationFrame(do_loop);
	}
	else {
		OUTGAIN.value = 0;
		cancelAnimationFrame(rafId);
	}
	muted = !muted;
}
	}
	else if (marr = s.match(/^([1-9])_$/)){
		if (do_trigger || muted) return;
//		voice.set_freq(0,now());
		let which = parseInt(marr[1])-1;
		cur_midi = base_midi+which*MIDI_NUM_STEP;
		if (cur_midi < base_midi) cur_midi = base_midi;
		else if (cur_midi > high_midi) cur_midi = high_midi;
//log(cur_midi);
		voice.set_freq(cur_midi*100,now(0.01));
		cancelAnimationFrame(rafId);
		setTimeout(()=>{
			rafId = requestAnimationFrame(do_loop);
		}, 1000);

/*«
let vow = VOWELS[parseInt(marr[1])];
Main.innerHTML = vow[3];
formant_filt_1.frequency.value=vow[0];
formant_filt_2.frequency.value=vow[1];
formant_filt_3.frequency.value=vow[2];
»*/
	}
}//»
this.onkeyup=(e)=>{//«
//	if (e.code=="Space") vol(0);
};//»
this.onkeypress=e=>{//«
};//»
this.onkill = function() {//«
//	OUT.disconnect();
	LINEOUT.disconnect();
	cancelAnimationFrame(rafId);
    midi && midi.rm_cb(midi_cb);
//	PLUG.disconnect();
}//»
this.onresize = function() {//«
}//»
this.onwinfocus=()=>{//«
if (Number.isFinite(hold_gain)) OUTGAIN.value = hold_gain;
}//»
this.onwinblur=()=>{//«
hold_gain = OUTGAIN.value;
OUTGAIN.value = 0;

}//»

//»

}






/*
const getcurve=()=>{//«
	let NUM=100;
	let NUM_HALF=50;
	let USEMULT=-2.5;
//	let USEMULT=-2.5;
	let USECLIP=false;
	const CURVE=(x,opts={mult:1, clip:true})=>{
		let num_half_cycles = 1;
		let val = 1-(0.5*(1-Math.cos((num_half_cycles*x*Math.PI/NUM))));
		let flat = (x-NUM_HALF)/NUM_HALF;
		let got = 1+(2*-val);
		let diff = got-flat;
		let isneg = x < NUM_HALF;
		let mdf = opts.mult*diff-flat;
		if (opts.clip) {
			if (isneg) {
				if( mdf < 0) mdf = 0;
			}
			else {
				if (mdf > 0) mdf = 0;
			}
		}

		let rv = 0.5*(mdf)+0.5;
		if (rv > 1 && opts.clip) rv = 1;
		else if (rv < 0 && opts.clip) rv = 0;
		return rv;
	};
    let arr = new Float32Array(NUM+1);
    for (let i=0; i<=NUM; i++){
        let y = CURVE(i,{mult:USEMULT, clip: USECLIP});
        arr[i]=2*(0.5-y);
    };
    return arr;
//log(arr);
}//»
*/

