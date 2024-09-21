const log=(...args)=>{console.log(...args);}
let curval1 = null;
let curval2 = null;
let curval3 = null;
//let didlog1, didlog2, didlog3

class RandomWalkAudioNode1 extends AudioWorkletProcessor{//«

	static get parameterDescriptors() {//«
		return [
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
		]
	}//»

process(ins, outs, params){

	let ctr = params["center"][0];
	let rng = params["range"][0];
	let step = params["step"][0];

	let floor = ctr - rng/2;
	let ceil = ctr + rng/2;
	if (curval1===null){
		curval1 = (Math.random()*rng - rng/2) + ctr;
	}
	else{
		let dir = Math.random() < 0.5 ? 1 : -1;
		curval1 += dir * step;
//log(floor, curval1, ceil);
		if (curval1 < floor) curval1 = floor;
		else if(curval1 > ceil) curval1 = ceil;
	}
	outs[0][0].fill(curval1);
	return true;
}

}//»

class RandomWalkAudioNode2 extends AudioWorkletProcessor{//«

	static get parameterDescriptors() {//«
		return [
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
		]
	}//»

process(ins, outs, params){

	let ctr = params["center"][0];
	let rng = params["range"][0];
	let step = params["step"][0];

	let floor = ctr - rng/2;
	let ceil = ctr + rng/2;

	if (curval2===null){
		curval2 = (Math.random()*rng - rng/2) + ctr;
	}
	else{
		let dir = Math.random() < 0.5 ? 1 : -1;
		curval2 += dir * step;
		if (curval2 < floor) curval2 = floor;
		else if(curval2 > ceil) curval2 = ceil;
	}
//console.log(curval2);
//console.log(2, curval2);
	outs[0][0].fill(curval2);
	return true;
}

}//»

class RandomWalkAudioNode3 extends AudioWorkletProcessor{//«

	static get parameterDescriptors() {//«
		return [
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
		]
	}//»

process(ins, outs, params){

	let ctr = params["center"][0];
	let rng = params["range"][0];
	let step = params["step"][0];

	let floor = ctr - rng/2;
	let ceil = ctr + rng/2;

	if (curval3===null){
		curval3 = (Math.random()*rng - rng/2) + ctr;
	}
	else{
		let dir = Math.random() < 0.5 ? 1 : -1;
		curval3 += dir * step;
		if (curval3 < floor) curval3 = floor;
		else if(curval3 > ceil) curval3 = ceil;
	}
//console.log(3, curval3);
	outs[0][0].fill(curval3);
	return true;
}

}//»

registerProcessor("random-walk-audio-node-1", RandomWalkAudioNode1);
registerProcessor("random-walk-audio-node-2", RandomWalkAudioNode2);
registerProcessor("random-walk-audio-node-3", RandomWalkAudioNode3);


