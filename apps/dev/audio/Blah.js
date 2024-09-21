
const NS = window._OS_;
const {globals} = NS;
const {log, cwarn, cerr} = NS.api.util;

export const app = function(Win){

//Var«

let ctx;
let out_gain;
//let lowpass;

let OSC1_FREQ = 440;

//let DIST1_FAC = 1;

let GAIN1 = 0.33;

let NOISE_RANGE = 100;
let NOISE_STEP = 1;

let knob;
let knob_num = 1;
let knob_name = `Freq (${knob_num})`;
let gain1;

const MIDINOTES=(()=>{//«
    let arr = [];
    for (let i=0; i < 128; i++) arr[i]=13.75*(2**((i-9)/12));
    return arr;
})();//»

//»
//Funcs«

const makeNoise = which => {//«

	let NOISE_BUF_SECS = 2;
	let samp_rate = ctx.sampleRate;
	let noise_buf_sz = samp_rate*NOISE_BUF_SECS;
	let buf = ctx.createBuffer(1, noise_buf_sz, samp_rate);
	let outbuf = buf.getChannelData(0);

	if (which == "white") {
		for (let i=0; i < noise_buf_sz; i++) outbuf[i] = Math.random() * 2- 1;
	}
	else if (which=="pink") {
		let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
		for (let i = 0; i < noise_buf_sz; i++) {
			let rand = Math.random() * 2 - 1;
			b0 = 0.99886 * b0 + rand * 0.0555179;
			b1 = 0.99332 * b1 + rand * 0.0750759;
			b2 = 0.96900 * b2 + rand * 0.1538520;
			b3 = 0.86650 * b3 + rand * 0.3104856;
			b4 = 0.55000 * b4 + rand * 0.5329522;
			b5 = -0.7616 * b5 - rand * 0.0168980;
			outbuf[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + rand * 0.5362;
			outbuf[i] *= 0.11;
			b6 = rand * 0.115926;
		}
	}
	else if (which=="brown") {
		let last=0;
		for (let i = 0; i < noise_buf_sz; i++) {
			let rand = Math.random() * 2 - 1;
			outbuf[i] = (last + (0.02 * rand)) / 1.02;
			last = outbuf[i];
			outbuf[i] *= 3.5; // (roughly) compensate for gain
		}
	}
	else{
		throw new Error(`What kind of noise buffer do you want? (got ${which})`);
	}
	return buf;

}//»
const makeDistortionCurve=(amount)=>{//«
	let k = typeof amount === "number" ? amount : 50;
	let n_samples = 44100;
	let curve = new Float32Array(n_samples);
	let deg = Math.PI / 180;
	for (let i = 0; i < n_samples; i++) {
		let x = (i * 2) / n_samples - 1;
		curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
	}
	return curve;
}//»

const trigger=()=>{//«
	let num_pulses = 32;
	let hi = 1;
	let lo = 0;
	let tm = ctx.currentTime;
	let start_off = 1/16;
	let note_dur = 1/24;
	let att_fac = 1/75;
	let dec_fac = 1/75;
	for (let i=0; i < num_pulses; i++){
		gain1.gain.setTargetAtTime(hi, tm, att_fac);
		gain1.gain.setTargetAtTime(lo, tm+note_dur, dec_fac);
		tm+=start_off;
	}
	gain1.gain.setTargetAtTime(0, tm, dec_fac);
}//»
const toggle_mute=()=>{//«
	let useval = out_gain.gain.value === 0 ? 1 : 0;
	out_gain.gain.value = useval;
}//»

//»
this.onappinit=async()=>{//«

ctx = globals.audioCtx || new AudioContext();
globals.audioCtx = ctx;

//makeNoise("whitezzz");
//await ctx.audioWorklet.addModule("/mods/audio/multi_freq_worklet.js?");

out_gain = ctx.createGain();
out_gain.gain.value=1;
let osc1 = ctx.createOscillator();//«

osc1.frequency.value = OSC1_FREQ;

if (globals.apps.midiCtl){

	knob = globals.apps.midiCtl.onregisterknob(knob_num, knob_name, val=>{
		osc1.frequency.value = MIDINOTES[val];
	});

}
else{
cwarn("No midiCtl");
}

//let dist1 = ctx.createWaveShaper();
//dist1.curve = makeDistortionCurve(DIST1_FAC);
//osc1.connect(dist1);

gain1 = ctx.createGain();
gain1.gain.value = 0;


osc1.start();
osc1.connect(gain1);
gain1.connect(out_gain);


//»

out_gain.connect(ctx.destination);
	
};//»
this.onkeydown=(e,k)=>{//«

if (k=="SPACE_"){
	trigger();
}
else if (k=="ENTER_"){
}

};//»
this.onkill=()=>{//«
	out_gain && out_gain.disconnect();
	if (knob) {
		globals.apps.midiCtl.onunregisterknob(knob_num, knob);
	}
};//»

}
