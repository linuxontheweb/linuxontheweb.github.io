/*
samples/sec * cycles/sec
cycles/sample 
constructor this.phase = 0;
let cyclePos = this.phase % 1;
this.phase += this.sampleTime * freq;

let v = Math.sin(cyclePos * 2 * Math.PI);
let normVal = (v + 1) / 2;
*/
const log=(...args)=>{console.log(...args);}

let wave = new Float32Array(sampleRate);
let PI = Math.PI;
let TWOPI = 2*PI;
let inc = PI/sampleRate;
for (let i=0, iter=0; i <= PI; i+=inc, iter++){
	wave[iter] = Math.sin(i);
}
let cur_sample = 0;
let did_log = false;
let phase = 0;
let secs_per_sample = 1/sampleRate;
class MultiFreqAudioNode1 extends AudioWorkletProcessor{//«

	static get parameterDescriptors() {//«
		return [
{
	name:"frequency",
	automationRate:"k-rate",
	defaultValue:"440",
	//minValue:"",
	//maxValue:"",
}
/*
			{
				name:"center",
				automationRate:"k-rate",
				defaultValue:"0",
	//			minValue:"",
	//			maxValue:"",
			},
			{
				name:"range",
				automationRate:"k-rate",
				defaultValue:"0",
			},
			{
				name:"step",
				automationRate:"k-rate",
				defaultValue:"0",
			}
*/
		]
	}//»

process(ins, outs, params){
let freq = params["frequency"][0];

let out = outs[0][0];
let len = out.length;
let range = 0.005;
let range_half = range/2;
for (let i=0; i < len; i++){
let val = Math.sin(TWOPI * (freq + (Math.random() * range - range_half)) * (currentTime + secs_per_sample*i));
out[i] = val;
}

if (!did_log) {
//log(freq);
did_log=true;
}
//cur_sample
	return true;
}

}//»

registerProcessor("multi-freq-audio-node-1", MultiFreqAudioNode1);


