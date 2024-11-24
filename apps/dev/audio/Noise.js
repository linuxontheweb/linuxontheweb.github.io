
const NS = LOTW;
const {globals} = NS;
const {log, cwarn, cerr} = NS.api.util;

export const app = function(Win){

//Var«

let ctx;
let out_gain;

//»
//Funcs«

const makeNoise = which => {//«

	let NOISE_BUF_SECS = 10;
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
//			outbuf[i] = (last + (0.02 * rand)) / 1.02;
			outbuf[i] = (last + (0.01 * rand)) / 1.01;
			last = outbuf[i];
			outbuf[i] *= 3.5; // (roughly) compensate for gain
		}
	}
	else{
		throw new Error(`What kind of noise buffer do you want? (got ${which})`);
	}
	return buf;

}//»

const toggle_mute=()=>{//«
	let useval = out_gain.gain.value === 0 ? 1 : 0;
	out_gain.gain.value = useval;
}//»

//»
this.onappinit=async()=>{//«

ctx = globals.audioCtx || new AudioContext();
globals.audioCtx = ctx;
let node = ctx.createBufferSource();
let buf = makeNoise("brown");
node.buffer = buf;
node.loop=true;
node.start();

out_gain = ctx.createGain();
out_gain.gain.value=1;
node.connect(out_gain);
out_gain.connect(ctx.destination);
	
};//»
this.onkeydown=(e,k)=>{//«

if (k=="SPACE_"){
toggle_mute();
}
else if (k=="ENTER_"){
}

};//»
this.onkill=()=>{//«
	out_gain && out_gain.disconnect();
};//»

}
