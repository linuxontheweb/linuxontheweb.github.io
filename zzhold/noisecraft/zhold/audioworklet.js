const log=(...args)=>{console.log(...args)};
const cwarn=(...args)=>{console.warn(...args)};
const cerr=(...args)=>{console.error(...args)};
import { AudioGraph } from './audiograph.js';

const castFuncs = {//«
    toInt:(val) => {
        return (new Int32Array([val]))[0];
    },
    toFloat:(val) => {
        return (new Float64Array([val]))[0];
    },
    toDouble:(val) => {
        return (new Float64Array([val]))[0];
    }
};//»
//Var«
let genSamples;
let	f64View;
let	i64View;
let	i32View;
let midiIn;
let output;
let output_plus_128;
let output_plus_256;

const MAX_SECS_PER_DELAY_BUFFER = 10;
//»
const init = async msg => {//«
	let buf = msg.buffer;
	let obj = msg.nodeObj;
	let mod = await WebAssembly.instantiate(buf, {
		Math: Math,
		Funcs: castFuncs,
		console: {
			log1: console.log,
			log2: console.log,
			log3: console.log,
			log4: console.log
		}
	});

	let exports = mod.instance.exports;
	let mem = exports.mem;
	mem.grow(1000); 
	let membuf = mem.buffer;
	f64View = new Float64Array(membuf);
	i64View = new BigInt64Array(membuf);
	i32View = new Int32Array(membuf);
//	init(msg.nodeObj);
	genSamples = exports.genSamples;
	let keys = Object.keys(obj);
	for (let k of keys){
		let n = obj[k];
		let p = n.ptr/8;
		let intp = n.ptr/4;
		if (k.match(/^(knob|const)/)){
			let val = n.params.value;
			f64View[p] = val;
		}
		else if (k.match(/^midiin/)){
			midiIn = p;
		}
		else if (k.match(/^clock/)){
			let val = n.params.value;
			f64View[p+1] = val;
		}
		else if (k.match(/^(saw|sine|tri|noise|pulse)/)){
			f64View[p+1] = n.params.minVal;
			f64View[p+2] = n.params.maxVal;
		}
		else if (k==="output"){
			output = n/8;
			output_plus_128 = output+128;
			output_plus_256 = output+256;
		}
		else if(k.match(/^delaybuffer/)){
	//		delaybuffer = n/8;
		}
		else if(k.match(/^delay/)){
			i32View[intp+2] = 48000*MAX_SECS_PER_DELAY_BUFFER;
		}
		else if (!k.match(/^(slide|adsr|filter|hold)/)){
cerr("WUTNODE");
log(n);
		}
	}
	f64View[0]=0.3;
	f64View[1]=0.3;
//log(genSamples);
//log(f64View);
}
//»

class NCAudioWorklet extends AudioWorkletProcessor {

    constructor(){//«
        super();
        this.port.onmessage = this.onmessage.bind(this);
        this.audioGraph = new AudioGraph(
			44100,
			this.port.postMessage.bind(this.port)
        );
    }//»

	onmessage(event) {//«
		let msg = event.data;
		if (msg.buffer){
			init(msg);
		}

	}//»

    process(inputs, outputs, parameters) {//«
		if (!genSamples) return true;
		genSamples();
		let ch0 = f64View.slice(output, output_plus_128);
		let ch1 = f64View.slice(output + 128, output_plus_256);
		outputs[0][0].set(ch0);
		outputs[0][1].set(ch1);
/*«
        for (let i = 0; i < outChannel0.length; i++)
        {
            let [leftVal, rightVal] = this.audioGraph.genSample();
            outChannel0[i] = leftVal;
            outChannel1[i] = rightVal;
        }
»*/
        return true;
    }//»

}

registerProcessor('noisecraft-generator', NCAudioWorklet)

