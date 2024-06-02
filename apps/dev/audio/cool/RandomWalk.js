/*Created a "random walk" k-rate signal generator in order to control parameters that
can use a range within which a random walker can walk, as well as a step size. If
a given step is outside of the range, it is clipped to the boundary. The ratio:
step_size/range should probably be between 5% and 20% in order to give interesting
results. 

Here, we combine it with cyclical oscillators to try to make the results even more 
interesting.

mod->modg->osc.detune
random_walk->osc.detune

modfmod->modfmodg->mod.detune

*/

const NS = window._OS_;
const {globals} = NS;
const {log, cwarn, cerr} = NS.api.util;

export const app = function(Win){

//«

let ctx;
let out_gain;
//let lowpass;

let OSC1_FREQ = 330;
let OSC2_FREQ = 435;
let OSC3_FREQ = 445;

let DIST1_FAC = 1;

let GAIN1 = 0.33;
//let GAIN2 = 0.33;
//let GAIN3 = 0.33;
let GAIN2 = 0;
let GAIN3 = 0;

let MOD1_FREQ = 4;
let MOD2_FREQ = 6;
let MOD3_FREQ = 7;

let MODG_GAIN = 200;//mod->modg->osc.detune

let MODFMOD_FREQ = 0.075;
let MODFMOD_GAIN = 1200;//modfmod->modfmodg->mod.detune

let RAND_WALK_RANGE = 6;//noise->osc.detune

let RAND_WALK_STEP = 2;

//»
//«
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

//»
this.onappinit=async()=>{//«

ctx = globals.audioCtx || new AudioContext();
globals.audioCtx = ctx;

await ctx.audioWorklet.addModule("/mods/audio/random_walk_worklet.js");

out_gain = ctx.createGain();
out_gain.gain.value=1;

let osc1 = ctx.createOscillator();//«
osc1.frequency.value = OSC1_FREQ;

let dist1 = ctx.createWaveShaper();
dist1.curve = makeDistortionCurve(DIST1_FAC);
osc1.connect(dist1);

let gain1 = ctx.createGain();
gain1.gain.value = GAIN1;

let noise1 = new AudioWorkletNode(ctx, "random-walk-audio-node-1");//«
let range1 = noise1.parameters.get("range");
let center1 = noise1.parameters.get("center");
let step1 = noise1.parameters.get("step");
range1.value = RAND_WALK_RANGE;
step1.value = RAND_WALK_STEP;

noise1.connect(osc1.detune);

//»

let mod1 = ctx.createOscillator();//«

//real[0] = 0.5;
//imag[0] = 0.5;
//real[1] = 1;
//imag[1] = 0;

let wave = ctx.createPeriodicWave(
	new Float32Array([0.5, 1, 0.5]),
	new Float32Array([0, 0, 0]),
	{ disableNormalization: false }
);

let mod1fmod = ctx.createOscillator();
//mod1fmod.setPeriodicWave(wave);

let mod1fmodg = ctx.createGain();
mod1fmodg.gain.value = MODFMOD_GAIN;
mod1fmod.frequency.value = MODFMOD_FREQ;
mod1fmod.start();
mod1fmod.connect(mod1fmodg);
mod1fmodg.connect(mod1.detune);

mod1.frequency.value = MOD1_FREQ;

let mod1g = ctx.createGain();
mod1g.gain.value = MODG_GAIN;

mod1.start();
mod1.connect(mod1g);

mod1g.connect(osc1.detune);

//»

osc1.start();
dist1.connect(gain1);
gain1.connect(out_gain);


//»

let osc2 = ctx.createOscillator();//«
osc2.frequency.value = OSC2_FREQ;

let gain2 = ctx.createGain();
gain2.gain.value = GAIN2;

let noise2 = new AudioWorkletNode(ctx, "random-walk-audio-node-2");
let range2 = noise2.parameters.get("range");
let center2 = noise2.parameters.get("center");
let step2 = noise2.parameters.get("step");
range2.value = RAND_WALK_RANGE;
step2.value = RAND_WALK_STEP;

let mod2 = ctx.createOscillator();//«

let mod2fmod = ctx.createOscillator();
let mod2fmodg = ctx.createGain();
mod2fmodg.gain.value = MODFMOD_GAIN;
mod2fmod.frequency.value = MODFMOD_FREQ;
mod2fmod.start();
mod2fmod.connect(mod1fmodg);
mod2fmodg.connect(mod1.detune);

mod2.frequency.value = MOD2_FREQ;

let mod2g = ctx.createGain();
mod2g.gain.value = MODG_GAIN;
mod2.start();
mod2.connect(mod1g);

//»

osc2.start();
osc2.connect(gain2);
gain2.connect(out_gain);
mod2g.connect(osc2.detune);
noise2.connect(osc2.detune);

//»

let osc3 = ctx.createOscillator();//«
osc3.frequency.value = OSC3_FREQ;

let gain3 = ctx.createGain();
gain3.gain.value = GAIN3;

let noise3 = new AudioWorkletNode(ctx, "random-walk-audio-node-3");
let range3 = noise3.parameters.get("range");
let center3 = noise3.parameters.get("center");
let step3 = noise3.parameters.get("step");
range3.value = RAND_WALK_RANGE;
step3.value = RAND_WALK_STEP;

let mod3 = ctx.createOscillator();//«

let mod3fmod = ctx.createOscillator();
let mod3fmodg = ctx.createGain();
mod3fmodg.gain.value = MODFMOD_GAIN;
mod3fmod.frequency.value = MODFMOD_FREQ;
mod3fmod.start();
mod3fmod.connect(mod1fmodg);
mod3fmodg.connect(mod1.detune);

mod3.frequency.value = MOD3_FREQ;

let mod3g = ctx.createGain();
mod3g.gain.value = MODG_GAIN;
mod3.start();
mod3.connect(mod1g);

//»

osc3.start();
osc3.connect(gain3);
gain3.connect(out_gain);
mod3g.connect(osc3.detune);
noise3.connect(osc3.detune);

//»


out_gain.connect(ctx.destination);
	
};//»
this.onkeydown=(e,k)=>{

if (k=="SPACE_"){
	let useval = out_gain.gain.value === 0 ? 1 : 0;
	out_gain.gain.value = useval;
}

};
this.onkill=()=>{
	out_gain && out_gain.disconnect();
};

}
