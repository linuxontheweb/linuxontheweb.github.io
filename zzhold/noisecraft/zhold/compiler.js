/*
This file is a non-trivial example of writing JS as walt 
code: https://github.com/ballercat/walt
This source goes into walt.compile, then the wasm goes into WebAssembly.instantiate();

//See com_walt in coms/extra.js
let wasm = walt.compile(src);

ket mod = WebAssembly.instantiate(wasm, {...});
let exports = mod.instance.exports;
let mem = exports.mem;
let func = exports.<funcName>;
mem.grow(1000);
buf = mem.buffer;
f64View = new Float64Array(buf);
i64View = new BigInt64Array(buf);
i32View = new Int32Array(buf)

*/
//«
import { assert, treeCopy } from './utils.js';
import { NODE_SCHEMA } from './model.js';
import * as music from './music.js';
import * as synth from './synth.js';

//»
const SAMPLES_PER_FRAME = 128;
const SAMPLE_RATE = 48000;
const SAMPLE_TIME = 1/SAMPLE_RATE;
const MAX_SECS_PER_BUFFER = 10;

const log=(...args)=>{console.log(...args)};
const cwarn=(...args)=>{console.warn(...args)};
const cerr=(...args)=>{console.error(...args)};

function splitNodes(graph){//«
/**
 * Split delay and hold nodes into two pseudo-nodes to break cycles.
 * Note: this function assumes that all nodes inside modules have been
 * inlined, and there are no modules in the input.
 */
    // Copy the graph before modifying it
    graph = treeCopy(graph);

    // Find max node id used in the graph
    let maxId = 0;
    for (let nodeId in graph.nodes)
    {
        maxId = Math.max(maxId, nodeId);
    }

    // Mapping of ids of delay nodes that were
    // split to the new output nodes
    let splitMap = {};

    // For each node
    for (let nodeId in graph.nodes)
    {
        let node = graph.nodes[nodeId];

        if (node.type != 'Delay' && node.type != 'Hold')
            continue;

        // The write node writes takes two inputs, produces no outputs
        let writeNode = {...node};
        writeNode.type = (node.type == 'Delay')? 'delay_write':'hold_write';
        writeNode.originalNode = node;
        writeNode.originalId = nodeId;
        writeNode.ins = node.ins;
        let writeNodeId = String(++maxId);
        graph.nodes[writeNodeId] = writeNode;

        // The read node takes no inputs, produces an output
        let readNode = {...node};
        readNode.type = (node.type == 'Delay')? 'delay_read':'hold_read';
        readNode.originalId = nodeId;
        readNode.ins = [];
        let readNodeId = String(++maxId);
        graph.nodes[readNodeId] = readNode;

        // Keep track of the read nodes
        splitMap[nodeId] = readNodeId;

        // Remove the original delay node
        delete graph.nodes[nodeId];
    }

    // Fixup the node connections to/from delays
    for (let nodeId in graph.nodes)
    {
        let node = graph.nodes[nodeId];

        // For all input side ports
        for (var i = 0; i < node.ins.length; ++i)
        {
            if (!node.ins[i])
                continue;

            let [srcId, srcPort] = node.ins[i];

            if (srcId in splitMap)
            {
                node.ins[i] = [splitMap[srcId], 0];
            }
        }
    }

    return graph;
}//»

function topoSort(graph){//«
/**
 * Topologically sort the nodes in a graph (Kahn's algorithm)
 * Note: this function assumes that all nodes inside modules have been
 * inlined, and there are no more modules in the input.
 */
    // Count the number of input edges going into a node
    function countInEdges(nodeId)
    {
        let node = graph.nodes[nodeId];
        let numIns = 0;

        for (let i = 0; i < node.ins.length; ++i)
        {
            let edge = node.ins[i];

            if (!edge)
                continue;

            if (remEdges.has(edge))
                continue;

            numIns++;
        }

        return numIns;
    }

    // Set of nodes with no incoming edges
    let S = [];

    // List sorted in reverse topological order
    let L = [];

    // Map of input-side edges removed from the graph
    let remEdges = new WeakSet();

    // Map of each node to a list of outgoing edges
    let outEdges = new Map();

    // Populate the initial list of nodes without input edges
    for (let nodeId in graph.nodes)
    {
        if (countInEdges(nodeId) == 0)
        {
            S.push(nodeId);
        }
    }

    // Initialize the set of list of output edges for each node
    for (let nodeId in graph.nodes)
    {
        outEdges.set(nodeId, []);
    }

    // Populate the list of output edges for each node
    for (let nodeId in graph.nodes)
    {
        let node = graph.nodes[nodeId];

        // For each input of this node
        for (let i = 0; i < node.ins.length; ++i)
        {
            let edge = node.ins[i];

            if (!edge)
                continue;

            let [srcId, srcPort] = node.ins[i];
            let srcOuts = outEdges.get(srcId);
            srcOuts.push([nodeId, edge]);
        }
    }

    // While we have nodes with no inputs
    while (S.length > 0)
    {
        // Remove a node from S, add it at the end of L
        var nodeId = S.pop();
        L.push(nodeId);

        // Get the list of output edges for this node
        let nodeOuts = outEdges.get(nodeId);

        // For each outgoing edge
        for (let [dstId, edge] of nodeOuts)
        {
            // Mark the edge as removed
            remEdges.add(edge);

            // If the node has no more incoming edges
            if (countInEdges(dstId) == 0)
                S.push(dstId);
        }
    }

    // If the topological ordering doesn't include all the nodes
    if (L.length != Object.keys(graph.nodes).length)
    {
        throw SyntaxError('graph contains cycles');
    }

    return L;
}//»

export function detectCycles(graph){//«
/**
 * Detect cycles in a graph of nodes
 */
    try
    {
        topoSort(splitNodes(graph));
        // A graph sorted with no issues has no cycle
        return false;
    }
    catch (err)
    {
        // The only error thrown from topoSort is the SyntaxError, indicating a cycle
        return true;
    }
}//»

export function compile(graph){//«
//log(graph);

//Compile a sound-generating function from a graph of nodes
let waltSrc=`
export const mem: Memory = { initial: 0, max: 1000 };

import { random: MathFunc0 } from 'Math';

import { floor: MathFunc1 } from 'Math';
import { abs: MathFunc1 } from 'Math';
import { sin: MathFunc1 } from 'Math';

import { min: MathFunc2 } from 'Math';
import { max: MathFunc2 } from 'Math';
import { pow: MathFunc2 } from 'Math';

import { toInt: MathFunc3 } from 'Funcs';
import { toFloat: MathFunc4 } from 'Funcs';
import { toDouble: MathFunc5 } from 'Funcs';

import { log1: Log1 } from 'console';
import { log2: Log2 } from 'console';
import { log3: Log3 } from 'console';
import { log4: Log4 } from 'console';

type MathFunc0 = () => f64;
type MathFunc1 = (f64) => f64;
type MathFunc2 = (f64, f64) => f64;
type MathFunc3 = (f64) => i32;
type MathFunc4 = (i32) => f64;
type MathFunc5 = (f32) => f64;

type Log1 = (f64) => void;
type Log2 = (i32, f64) => void;
type Log3 = (i32, f64, f64) => void;
type Log4 = (i32, f64, f64, f64) => void;


`;
function outName(nodeId, idx){//«
	assert (typeof nodeId == 'number' || typeof nodeId == 'string');
	return 'n' + nodeId + '_' + idx;
}//»
/*
function inVal(node, idx){//«
	let schema = NODE_SCHEMA[node.type];
	let defVal = schema.ins[idx].default;

	if (!node.ins[idx])
	return defVal;

	let [srcId, portIdx] = node.ins[idx];
	let srcNode = graph.nodes[srcId];
	return outName(srcId, portIdx);
}//»
*/

function inVal(node, idx){//«
	let t = node.type;
	let schema = NODE_SCHEMA[t];
	let defVal = schema.ins[idx].default;

	if (!node.ins[idx]) {
		if (defVal === 0.5) return "floatHalf";
		else if (defVal === 0) {
			if (t=="Slide"||t=="Filter") return "floatZero";
			return "int64Zero";
		}
		else if (defVal === 1) {
			if (t=="Slide"||t=="Filter") return "floatOne";
			return "int64One";
		}
		return `toDouble(${defVal})`;
	}

	let [srcId, portIdx] = node.ins[idx];
	let srcNode = graph.nodes[srcId];
	return outName(srcId, portIdx);
}//»

function addLine(str){//«
	if (src)
		src += '\n';
	src += '    ' + str;
}//»
function addLet(name, str){//«
	addLine('let ' + name + ' = ' + str);
}//»
function addDef(nodeId, str){//«
	addLet(outName(nodeId, 0), str);
}//»

graph = splitNodes(graph);// Split nodes to break cycles

let order = topoSort(graph);// Produce a topological sort of the graph
//console.log('num nodes in topo order: ', order.length);

let audioOutId = null;// Find the audio output node

let nodeObj = {};
let objTypes=[//«
"Hold",
"Noise",
"Clock",
"Knob",
"Delay",
"MidiIn",
"Saw",
"Tri",
"Sine",
"ADSR",
"Const",
"Random",
"Pulse",
"Slide",
"Filter"
];//»
let objLens={//«
	Knob: 1,
	Hold: 2,
	Clock: 2,
	Delay: 2,//There are two int32 indexes (read & write), plus an int32 length and padding
	Noise: 2,
	Saw: 3,
	Tri: 3,
	Pulse: 3,
	Sine: 4,
	MidiIn: 2,
	leftGain: 1,
	rightGain: 1,
	ADSR: 3,
	Filter: 2,
	Slide: 1,
	Const: 1
};//»
//«
waltSrc+=(`
type OutGain = { value: f64 };
type Saw = { phase: f64, min: f64, max: f64 };
type Knob = { value: f64 };
type Clock = { phase: f64, value: f64 };
type MidiIn = { freq: f64, gate: i64 };
type ADSR = { state: i64, startTime: f64, startVal: f64 };
type Filter = { s0: f64, s1: f64 };
type Tri = { phase: f64, min: f64, max: f64 };
type Noise = { min: f64, max: f64 };
type Pulse = { phase: f64, min: f64, max: f64 };
type Sine = { phase: f64, syncSign: i64, min: f64, max: f64 };
type Const = { value: f64 };
type Delay = { readIdx: i32, writeIdx: i32 , bufLen: i32, padding: i32 };
type Hold = { value: f64, trigSign: i64 };
type Slide = { s: f64 };

const sampleRate: f64 = ${SAMPLE_RATE};
const sampleTime: f64 = ${SAMPLE_TIME};
const samplesPerFrame: i32 = ${SAMPLES_PER_FRAME};
let playPos: f64 = 0.0;
const intZero: i32 = 0;
const int64Zero: i64 = 0;
const intOne: i32 = 1;
const int64One: i64 = 1;
const intTwo: i32 = 2;
const int256: i32 = 256;
const floatZero: f64 = 0.0;
const floatOne: f64 = 1.0;
//const floatNegOne: f64 = -1.0;
const floatTwo: f64 = 2.0;
const floatSixty: f64 = 60.0;
const floatThousand: f64 = 1000.0;
const floatHalf: f64 = 0.5;
const floatEighth: f64 = 0.125;
const floatHundredth: f64 = 0.01;

const twoPI: f64 = 6.283185307179586;

const CLOCK_PPQ: f64 = 24.0;


const OFF: i64 = 0;
const ATTACK: i64 = 1;
const DECAY: i64 = 2;
const SUSTAIN: i64 = 3;
const RELEASE: i64 = 4;

const leftGain: OutGain = 0;
const rightGain: OutGain = 8;
`);
//»
let curPtr = 16;
let num_delays = 0;
let delbuf_map={
};
for (let nodeId of order){//«
	let node = graph.nodes[nodeId];
if (nodeId=="95"){
//log("HI95", node);
}
	if (node.type == 'AudioOut'){
		if (audioOutId !== null)
		throw 'there can be only one AudioOut node';
		audioOutId = nodeId;
	}
let t = node.type;
if (objTypes.includes(t)) {
	let id = `${node.type.toLowerCase()}${nodeId}`;
	let o = {ptr: curPtr, params: node.params, name: node.name};
	nodeObj[id] = o;
	waltSrc+=(`const ${id}: ${node.type} = ${curPtr};\n`);
	curPtr+=8*objLens[node.type];
}
else if (t==="delay_read"){
	let id = `delay${node.originalId}`;
	let o = {ptr: curPtr, params: node.params, name: `Delay`};
	nodeObj[id] = o;
	waltSrc+=(`const ${id}: Delay = ${curPtr};\n`);
	curPtr += 8*2;
	delbuf_map[id] = num_delays;
	num_delays++;
}
else if (t==="hold_read"){
	let id = `hold${node.originalId}`;
	let o = {ptr: curPtr, params: node.params, name: `Hold`};
	nodeObj[id] = o;
	waltSrc+=(`const ${id}: Hold = ${curPtr};\n`);
	curPtr += 8*2;
}
else if (t==="MonoSeq"){
cwarn(nodeId,node);
}
else if (["Notes", "Mul","Add","Scope","Distort","AudioOut","delay_write", "hold_write"].includes(t)){}
else{
cerr("Unknown node",node);
}
//log(node);
}//»
//«
waltSrc+=(`
const outputBase: i32 = ${curPtr/8};
const output: f64[] = 0;
let ITER: i32 = 0;
`);
//»
nodeObj.output = curPtr;

//if (num_delays > 1){
//	cerr("THERE ARE TOO MANY DELAYS!!!", num_delays);
//}
let delptr_map = {};
curPtr += SAMPLES_PER_FRAME * 2 * 8;
for (let i=0; i < num_delays; i++){

let id = `delaybuffer${i}`;
waltSrc+=(`
const delayBase${i}: i32 = ${curPtr/8};
const ${id}: f64[] = 0;
`);
nodeObj[id] = curPtr;
curPtr += MAX_SECS_PER_BUFFER * SAMPLE_RATE*8;
}

//«
waltSrc+=(`
function lerp(x: f64, y0: f64, y1: f64): f64 {
    if (x >= floatOne) {
		return y1;
	}
    return y0 + x * (y1 - y0);
}
function distort(x: f64, amount: f64): f64 {
	amount = min(max(amount, floatZero), floatOne);
	amount -= floatHundredth;
	let k: f64 = floatTwo * amount / (floatOne - amount);
	let y: f64 = (floatOne + k) * x / (floatOne + k * abs(x));
	return y;
}
//function updateADSR(this: ADSR, curTime: f64, gate: i64, attack: f64, decay: f64, susVal: f64, release: f64): f64 {
function updateADSR(this: ADSR, curTime: f64, gate: f64, attack: f64, decay: f64, susVal: f64, release: f64): f64 {
	if (this.state == OFF) {
//		if (gate > 0) {
		if (gate > floatZero) {
			this.state = ATTACK;
			this.startTime = curTime;
			this.startVal = floatZero;
		}
		return floatZero;
	}
	else if (this.state == ATTACK) {
		let time: f64 = curTime - this.startTime;
		if (time > attack) {
			this.state = DECAY;
			this.startTime = curTime;
			return floatOne;
		}
		return lerp(time / attack, this.startVal, floatOne);
	}
	else if (this.state == DECAY) {
		let time: f64 = curTime - this.startTime;
		let curVal: f64 = lerp(time / decay, floatOne, susVal);
//		if (gate <= 0) {
		if (gate <= floatZero) {
			this.state = RELEASE;
			this.startTime = curTime;
			this.startVal = curVal;
			return curVal;
		}
		if (time > decay) {
			this.state = SUSTAIN;
			this.startTime = curTime;
			return susVal;
		}
		return curVal;
	}
	else if (this.state == SUSTAIN) {
//		if (gate <= 0) {
		if (gate <= floatZero) {
			this.state = RELEASE;
			this.startTime = curTime;
			this.startVal = susVal;
		}
		return susVal;
	}
	else if (this.state == RELEASE) {
		let time: f64 = curTime - this.startTime;
		if (time > release) {
			this.state = OFF;
			return floatZero;
		}
		let curVal: f64 = lerp(time / release, this.startVal, floatZero);
//		if (gate > 0) {
		if (gate > floatZero) {
			this.state = ATTACK;
			this.startTime = curTime;
			this.startVal = curVal;
		}
		return curVal;
	}
	return floatZero;
}
function updateFilter(this: Filter, s: f64, cutoff: f64, resonance: f64): f64 {
	cutoff = min(cutoff, floatOne);
	resonance = max(resonance, floatZero);
	let c: f64 = pow(floatHalf, (floatOne - cutoff) / floatEighth);
	let r: f64 = pow(floatHalf, (resonance + floatEighth) / floatEighth);
	let mrc: f64 = floatOne - r * c;
	let v0: f64 = this.s0;
	let v1: f64 = this.s1;
	v0 = (mrc * v0) - (c * v1) + (c * s);
	v1 = (mrc * v1) + (c * v0);
	s = v1;
	this.s0 = v0;
	this.s1 = v1;
	return s;
}
function updateSaw(this: Saw, freq: f64): f64 {
	let minVal: f64 = this.min;
	this.phase += sampleTime * freq;
	let cyclePos: f64 = this.phase - floor(this.phase);
//	log(this.phase, cyclePos);
	let diff: f64 = this.max - minVal;
	return minVal + cyclePos * (this.max - minVal);
}
function updateClock(this: Clock): f64 {
	let freq: f64 = CLOCK_PPQ * this.value / floatSixty;
	this.phase += sampleTime * freq;
	let cyclePos: f64 = this.phase - floor(this.phase);
	if (cyclePos < floatHalf){
		return floatOne;
	}
	return -floatOne;
}
function updateSlide(this: Slide, input: f64, rate: f64): f64 {
	rate = rate * floatThousand;
	if (rate < floatOne) {
		rate = floatOne;
	}
	this.s += (floatOne / rate) * (input - this.s);
	return this.s;
}
function updateSine(this: Sine, freq: f64, sync: i64): f64{
	let minVal: f64 = this.min;
	let maxVal: f64 = this.max;
	if (this.syncSign == int64Zero && sync > int64Zero) {
		this.phase = floatZero;
	}
//	this.syncSign = (sync > intZero);
	if (sync > int64Zero){
		this.syncSign = int64One;
	}
	else{
		this.syncSign = int64Zero;
	}
	let cyclePos: f64 = this.phase - floor(this.phase);
	this.phase += sampleTime * freq;
	let v: f64 = sin(cyclePos * twoPI);
	let normVal: f64 = (v + floatOne) / floatTwo;
	return minVal + normVal * (maxVal - minVal);
}
function updateNoise(this: Noise): f64 {
	let minVal: f64 = this.min;
	let range: f64 = this.max - minVal;
	return minVal + range * random();
}
function updateTri(this: Tri, freq: f64): f64 {
	let normVal: f64 = floatZero;
	let minVal: f64 = this.min;
	let maxVal: f64 = this.max;
	this.phase += sampleTime * freq;
	let cyclePos: f64 = this.phase - floor(this.phase);
	if (cyclePos < floatHalf){
		normVal = (floatTwo * cyclePos);
	}
	else{
		normVal = floatOne - floatTwo * (cyclePos - floatHalf);
	}
	//let normVal: f64 = (cyclePos < floatHalf) ? (floatTwo * cyclePos):(floatOne - floatTwo * (cyclePos - floatHalf));
	return minVal + normVal * (maxVal - minVal);
}
//	if (ITER % 4800 == 0){
//log1(toFloat(this.bufLen));
//log1(delayTime);
//	}
//	ITER = ITER+1;
function updatePulse(this: Pulse, freq: f64, duty: f64): f64 {
	this.phase += sampleTime * freq;
	let cyclePos: f64 = this.phase - floor(this.phase);
	if (cyclePos < duty){
		return this.min;
	}
	return this.max;
//	return (cyclePos < duty) ? this.min:this.max;
}
function holdWrite(this: Hold, value: f64, trig: f64): void {
//function holdWrite(this: Hold, value: f64, trig: i64): void {
//	if (this.trigSign == int64Zero && trig > int64Zero) {
	let trigSignIsZero: bool = false;
	if (this.trigSign == int64Zero) {
		trigSignIsZero = true;
	}
//	let trigIsPos: bool = trig > floatZero;
	let trigIsPos: bool = false;
	if (trig > floatZero) {
		trigIsPos = true;
	}
//	if (this.trigSign == int64Zero && trig > floatZero) {
	if (trigSignIsZero && trigIsPos) {
		this.value = value;
	}
//	if (trig > int64Zero){
	if (trig > floatZero){
		this.trigSign = int64One;
	}
	else{
		this.trigSign = int64Zero;
	}
}
function holdRead(this: Hold): f64 {
	return this.value;
}
function delayWrite(this: Delay, buffer: f64[], baseIdx: i32, s: f64, delayTime: f64): void {   
	let bufLen: i32 = this.bufLen;
	this.writeIdx = ((this.writeIdx + intOne) % bufLen);
	buffer[baseIdx + this.writeIdx] = s;
	let numSamples: f64 = min(
		floor(sampleRate * delayTime),
		toFloat(bufLen) - floatOne
	);
	this.readIdx = this.writeIdx - toInt(numSamples);
//	if (this.readIdx < intZero) {
	if (this.readIdx < baseIdx) {
		this.readIdx += bufLen;
	}
}
function delayRead(this: Delay, buffer: f64[], baseIdx: i32): f64 {
	return buffer[baseIdx + this.readIdx];
}

`);//»

let src = '';
waltSrc+='\nfunction genSample(curTime: f64, iter: i32): void {\n';
const addToWaltSrc=(s)=>{
waltSrc+=s;
};
// Set of stateful nodes that are relevant for audio synthesis
let audioNodes = {};

for (let nodeId of order){//«

let node = graph.nodes[nodeId];
//console.log(`compiling ${node.type}, nodeId=${nodeId}`);

if (node.type == 'Add'){//«
	addDef(nodeId, inVal(node, 0) + ' + ' + inVal(node, 1));
 addToWaltSrc(`let n${nodeId}_0: f64 = ${inVal(node, 0)}  +  ${inVal(node, 1)};\n`);
//addToWaltSrc(`log(iter, n${nodeId}_0);\n`);
	continue;
}//»
if (node.type == 'ADSR'){//«
	audioNodes[nodeId] = node;
	addDef(
		nodeId,
		`nodes[${nodeId}].update(` +
		`time,` +
		`${inVal(node, 0)},` +
		`${inVal(node, 1)},` +
		`${inVal(node, 2)},` +
		`${inVal(node, 3)},` +
		`${inVal(node, 4)})`
	);
//log("[updateADSR]");
//log(synth.ADSREnv.prototype.eval.toString());

addToWaltSrc(`let n${nodeId}_0: f64 = updateADSR(adsr${nodeId}, curTime, ${inVal(node, 0)}, ${inVal(node, 1)}, ${inVal(node, 2)}, ${inVal(node, 3)}, ${inVal(node, 4)});\n`);
//addToWaltSrc(`log(iter, n${nodeId}_0);\n`);
//log(nodes[nodeId]);
//log(node);
	continue;
}//»
if (node.type == 'AudioOut'){//«
// Multiply by 0.5 to manage loudness and help avoid clipping
	addLet(outName(nodeId, 0), '0.3 * ' + inVal(node, 0));
	addLet(outName(nodeId, 1), '0.3 * ' + inVal(node, 1));
//addToWaltSrc(`let ${outName(nodeId, 0)}: f64 = leftGain.value * ${inVal(node, 0)};\n`);
//addToWaltSrc(`let ${outName(nodeId, 1)}: f64 = rightGain.value * ${inVal(node, 1)};\n`);
addToWaltSrc(`let ${outName(nodeId, 0)}: f64 = 0.3 * ${inVal(node, 0)};\n`);
addToWaltSrc(`let ${outName(nodeId, 1)}: f64 = 0.3 * ${inVal(node, 1)};\n`);
//addToWaltSrc(`log(iter, ${outName(nodeId, 0)});\n`);
	continue;
}//»
if (node.type == 'BitCrush'){//«
	audioNodes[nodeId] = node;
	addDef(nodeId, `nodes[${nodeId}].update(${inVal(node, 0)})`);
	continue;
}//»
if (node.type == 'Clock'){//«
	audioNodes[nodeId] = node;
	addDef(nodeId, `nodes[${nodeId}].update()`);
 addToWaltSrc(`let n${nodeId}_0: f64 = updateClock(clock${nodeId});\n`);
/*
addToWaltSrc(`
if (ITER % 4800 == 0){
log2(ITER/4800, n${nodeId}_0);
}
ITER = ITER+1;
`);
*/
	continue;
}//»
if (node.type == 'ClockDiv'){//«
	audioNodes[nodeId] = node;
	addDef(nodeId, `nodes[${nodeId}].update(${inVal(node, 0)})`);
	continue;
}//»
if (node.type == 'ClockOut'){//«
	audioNodes[nodeId] = node;
	addDef(nodeId, `nodes[${nodeId}].update(time, ${inVal(node, 0)})`);
	continue;
}//»
if (node.type == 'Const'){//«
	audioNodes[nodeId] = node;
	addDef(nodeId, `nodes[${nodeId}].params.value`);
addToWaltSrc(`let n${nodeId}_0: f64 = const${nodeId}.value;\n`);
	continue;
}//»
if (node.type == 'delay_write'){//«
//function delayWrite(this: Delay, buffer: f64[], s: f64, delayTime: f64): void {   
	audioNodes[node.originalId] = node.originalNode;
	addLine(`nodes[${node.originalId}].delay.write(${inVal(node, 0)}, ${inVal(node, 1)})`);
let idstr = `delay${node.originalId}`;
let n = delbuf_map[idstr];
addToWaltSrc(`delayWrite(delay${node.originalId}, delaybuffer${n}, delayBase${n}, ${inVal(node, 0)}, ${inVal(node,1)});\n`);
	continue;
}//»
if (node.type == 'delay_read'){//«
//function delayRead(this: Delay, buffer: f64[]): f64 {
	addDef(nodeId, `nodes[${node.originalId}].delay.read()`);

//log(delbuf_map);
//log(node);
let idstr = `delay${node.originalId}`;
let n = delbuf_map[idstr];
addToWaltSrc('let ' + outName(nodeId, 0) + ': f64 = ' + `delayRead(delay${node.originalId}, delaybuffer${n}, delayBase${n});\n`);

//cwarn("DELAY_READ");
	continue;
}//»
if (node.type == 'Distort'){//«
	audioNodes[nodeId] = node;
	addDef(nodeId, `nodes[${nodeId}].update(${inVal(node, 0)}, ${inVal(node, 1)})`);
//log("[updateDistort]")
//log(synth.distort.toString());
 //waltSrc+=(`let n${nodeId}_0: f64 = updateDistort(distort${nodeId}, ${inVal(node, 0)}, ${inVal(node, 1)});\n`);
addToWaltSrc(`let n${nodeId}_0: f64 = distort(${inVal(node, 0)}, ${inVal(node, 1)});\n`);
//addToWaltSrc(`log(iter, n${nodeId}_0);\n`);
	continue;
}//»
if (node.type == 'Div'){//«
	// Avoid dividing by zero because that can lead to NaN values being produced
	addDef(nodeId, inVal(node, 1) + '? (' + inVal(node, 0) + ' / ' + inVal(node, 1) + '):0');
	continue;
}//»
if (node.type == 'Equal'){//«
	addDef(nodeId, inVal(node, 0) + ' == ' + inVal(node, 1));
	continue;
}//»
if (node.type == 'Filter'){//«
	audioNodes[nodeId] = node;
	addDef(
		nodeId,
		`nodes[${nodeId}].update(${inVal(node, 0)}, ${inVal(node, 1)}, ${inVal(node, 2)})`
	);
//log("[updateFilter]");
//log(synth.TwoPoleFilter.prototype.apply.toString());
 addToWaltSrc(`let n${nodeId}_0: f64 = updateFilter(filter${nodeId}, ${inVal(node, 0)}, ${inVal(node, 1)}, ${inVal(node, 2)});\n`);
//addToWaltSrc(`log(iter, n${nodeId}_0);\n`);
	continue;
}//»
if (node.type == 'Fold'){//«
	audioNodes[nodeId] = node;
	addDef(
		nodeId, 
		`nodes[${nodeId}].update(${inVal(node, 0)},${inVal(node,1)});`
	);
	continue;
}//»
if (node.type == 'Greater'){//«
	addDef(nodeId, inVal(node, 0) + ' > ' + inVal(node, 1));
	continue;
}//»
if (node.type == 'hold_write'){//«
	audioNodes[node.originalId] = node.originalNode;
	addLine(`nodes[${node.originalId}].write(${inVal(node, 0)}, ${inVal(node, 1)})`);
addToWaltSrc(`holdWrite(hold${node.originalId}, ${inVal(node, 0)}, ${inVal(node,1)});\n`);
	continue;
}//»
if (node.type == 'hold_read'){//«
	addDef(nodeId, `nodes[${node.originalId}].read()`);
addToWaltSrc('let ' + outName(nodeId, 0) + ': f64 = ' + `holdRead(hold${node.originalId});\n`);
	continue;
}//»
if (node.type == 'Knob'){//«
	audioNodes[nodeId] = node;
	addDef(nodeId, `nodes[${nodeId}].params.value`);
 addToWaltSrc(`let n${nodeId}_0: f64 = knob${nodeId}.value;\n`);
//addToWaltSrc(`log(iter, n${nodeId}_0);\n`);
	continue;
}//»
if (node.type == 'MidiIn'){//«
	audioNodes[nodeId] = node;
	addLine(
		`let [${outName(nodeId, 0)}, ${outName(nodeId, 1)}] = ` +
		`nodes[${nodeId}].update()`
	);
addToWaltSrc(`let ${outName(nodeId, 0)}: f64 = midiin${nodeId}.freq;\n`);
addToWaltSrc(`let ${outName(nodeId, 1)}: i64 = midiin${nodeId}.gate;\n`);
//addToWaltSrc(`log(${outName(nodeId, 1)}, ${outName(nodeId, 0)});\n`);
	continue;
}//»
if (node.type == 'Mod'){//«
// Modulo
	addDef(nodeId, inVal(node, 0) + ' % ' + inVal(node, 1));
	// Prevent NaN values because they will propagate through everything
	addLine(`${outName(nodeId, 0)} = isNaN(${outName(nodeId, 0)})? 0:${outName(nodeId, 0)}`);
	continue;
}//»
if (node.type == 'GateSeq'){//«
	audioNodes[nodeId] = node;
	// Assemble the output names (one gate output per row)
	let outNames = '';
	for (let i = 0; i < node.numRows; ++i){
		if (i > 0)
			outNames += ', ';
		outNames += outName(nodeId, i);
	}
	addLine(
		`let [${outNames}] = ` +
		`nodes[${nodeId}].update(time, ${inVal(node, 0)}, ${inVal(node, 1)})`
	);
	continue;
}//»
if (node.type == 'MonoSeq'){//«
	audioNodes[nodeId] = node;

	addLine(
		`let [${outName(nodeId, 0)}, ${outName(nodeId, 1)}] = ` +
		`nodes[${nodeId}].update(time, ${inVal(node, 0)}, ${inVal(node, 1)})`
	);

addToWaltSrc(`let n${nodeId}_0: f64 = 440.0;\n`);
addToWaltSrc(`let n${nodeId}_1: i64 = int64One;\n`);

	continue;
}//»
if (node.type == 'Module'){//«
// Temporary so the compiler doesn't error when it sees a module
	continue;
}//»
if (node.type == 'Mul'){//«
	addDef(nodeId, inVal(node, 0) + ' * ' + inVal(node, 1));
 addToWaltSrc(`let n${nodeId}_0: f64 = ${inVal(node, 0)}  *  ${inVal(node, 1)};\n`);
//addToWaltSrc(`log(iter, n${nodeId}_0);\n`);
	continue;
}//»
if (node.type == 'Noise'){//«
	audioNodes[nodeId] = node;
	addDef(nodeId, `nodes[${nodeId}].update()`);
addToWaltSrc(`let n${nodeId}_0: f64 = updateNoise(noise${nodeId});\n`);
	continue;
}//»
if (node.type == 'Nop'){//«
	addDef(nodeId, inVal(node, 0));
	continue;
}//»
if (node.type == 'Notes'){//«
	continue;
}//»
if (node.type == 'Pulse'){//«
	audioNodes[nodeId] = node;
	addDef(nodeId, `nodes[${nodeId}].update(${inVal(node, 0)}, ${inVal(node, 1)})`);
addToWaltSrc(`let n${nodeId}_0: f64 = updatePulse(pulse${nodeId}, ${inVal(node, 0)}, ${inVal(node, 1)});\n`);

	continue;
}//»
if (node.type == 'Saw'){//«
	audioNodes[nodeId] = node;
	addDef(nodeId, `nodes[${nodeId}].update(${inVal(node, 0)})`);
 addToWaltSrc(`let n${nodeId}_0: f64 = updateSaw(saw${nodeId}, ${inVal(node, 0)});\n`);
//if (nodeId===7) {
//addToWaltSrc(`log(iter, n${nodeId}_0);\n`);
//}
/*
log("[Saw.update]");
log(`update(freq){
    let minVal = this.params.minVal;
    let maxVal = this.params.maxVal;
    this.phase += this.sampleTime * freq;
    let cyclePos = this.phase % 1;
    return minVal + cyclePos * (maxVal - minVal);
}
`);
*/
	continue;
}//»
if (node.type == 'Scope'){//«
	audioNodes[nodeId] = node;
	addDef(nodeId, `nodes[${nodeId}].update(${inVal(node, 0)})`);
	continue;
}//»
if (node.type == 'Sine'){//«
	audioNodes[nodeId] = node;
	addDef(nodeId, `nodes[${nodeId}].update(${inVal(node, 0)}, ${inVal(node, 1)})`);
addToWaltSrc(`let n${nodeId}_0: f64 = updateSine(sine${nodeId}, ${inVal(node, 0)}, ${inVal(node, 1)});\n`);

	continue;
}//»
if (node.type == 'Slide'){//«
	audioNodes[nodeId] = node;
	addDef(nodeId, `nodes[${nodeId}].update(${inVal(node, 0)}, ${inVal(node, 1)})`);
addToWaltSrc(`let n${nodeId}_0: f64 = updateSlide(slide${nodeId}, ${inVal(node, 0)}, ${inVal(node, 1)});\n`);

	continue;
}//»
if (node.type == 'Sub'){//«
	addDef(nodeId, inVal(node, 0) + ' - ' + inVal(node, 1));
 addToWaltSrc(`let n${nodeId}_0: f64 = ${inVal(node, 0)}  -  ${inVal(node, 1)};\n`);
	continue;
}//»
if (node.type == 'Tri'){//«
	audioNodes[nodeId] = node;
	addDef(nodeId, `nodes[${nodeId}].update(${inVal(node, 0)})`);
addToWaltSrc(`let n${nodeId}_0: f64 = updateTri(tri${nodeId}, ${inVal(node, 0)});\n`);
//addToWaltSrc(`log1(n${nodeId}_0);\n`);

	continue;
}//»

throw 'unknown node type "' + node.type + '"';

}//»

// Return the audio output values
if (audioOutId != null){
	addLine('return [' + outName(audioOutId, 0) + ', ' + outName(audioOutId, 1) + ']');
addToWaltSrc(`

output[outputBase+iter] = ${outName(audioOutId, 0)};
//log(outputBase+iter, ${outName(audioOutId, 0)});
output[outputBase+iter+samplesPerFrame] = ${outName(audioOutId, 1)};
//output[iter+intOne] = ${outName(audioOutId, 1)};

`);
//addToWaltSrc(`output[iter] = ${outName(audioOutId, 0)};\n`);
//addToWaltSrc(`output[iter+1] = ${outName(audioOutId, 1)};\n`);
}
else{
	addLine('return [0, 0]');
}

//console.log(`function(time, nodes){\n${src}\n}`);
waltSrc+="}"
waltSrc+=`
export function genSamples(): void {
	let i: i32 = intZero;
//	let to: i32 = samplesPerFrame * intTwo;
//	for (i=intZero; i < to; i=i+intTwo){
	for (i=intZero; i < samplesPerFrame; i=i+intOne){
		genSample(playPos, i);
		playPos = playPos + sampleTime;
	}
}
`;
//log(waltSrc);
//log(nodeObj);
// This will be assembled into an audio processing graph
// by the audio thread (audioworklet.js)
return {
// Compiled source code of the genSample function
src: src,
waltSrc: waltSrc,
nodeObj: nodeObj,
// Set of nodes that are relevant for audio processing,
// indexed by nodeId
nodes: audioNodes
};
}//»

/*

class Sequencer extends AudioNode{//«
    constructor(id, state, sampleRate, send)
    {
        super(id, state, sampleRate, send);
        // Current clock sign (positive/negative)
        this.clockSgn = false;
        // Number of clock ticks until the next step is triggered
        this.clockCnt = 0;
        // Next step to trigger
        this.nextStep = 0;
        // Currently playing pattern
        this.patIdx = state.curPattern;
        // Next pattern that is queued for playback
        this.nextPat = undefined;
    }

//Set/update the entire state for this node
    setState(state)
    {
        AudioNode.prototype.setState.call(this, state);

        this.patIdx = state.curPattern;
    }

//Set a given cell in a step sequencer
    setCell(patIdx, stepIdx, rowIdx, value)
    {
        let pattern = this.state.patterns[patIdx];
        pattern[stepIdx][rowIdx] = value;
    }

//Queue the next pattern to play
    queuePattern(patIdx, patData)
    {
        console.log(`got queuePattern, patIdx=${patIdx}`);

        this.state.patterns[patIdx] = patData;
        this.nextPat = patIdx;
    }

//Trigger a note at this row
    trigRow(rowIdx, time)
    {
        throw Error('each sequencer must implement trigRow');
    }

//Takes the current time and clock signal as input.
//Produces frequency and gate signals as output.
    update(time, clock, gateTime) {
        if (!this.clockSgn && clock > 0)
        {
            // If we are at the beginning of a new sequencer step
            if (this.clockCnt == 0)
            {
                var grid = this.state.patterns[this.patIdx];

                this.clockCnt = music.CLOCK_PPS;
                var stepIdx = this.nextStep % grid.length;
                this.nextStep++;

                // Send the current step back to the main thread
                this.send({
                    type: 'SET_CUR_STEP',
                    nodeId: this.nodeId,
                    stepIdx: stepIdx
                });

                // For each row
                for (var rowIdx = 0; rowIdx < grid[stepIdx].length; ++rowIdx)
                {
                    if (!grid[stepIdx][rowIdx])
                        continue

                    // Trigger this row
                    this.trigRow(rowIdx, time);
                }

                // If this is the last step of this pattern
                if (stepIdx === grid.length - 1)
                {
                    this.nextStep = 0;
                    if (this.nextPat !== undefined)
                    {
                        // Send the pattern change to the main thread
                        this.send({
                            type: 'SET_PATTERN',
                            nodeId: this.nodeId,
                            patIdx: this.nextPat
                        });
                        // Move to the next pattern
                        this.patIdx = this.nextPat;
                        this.nextPat = undefined;
                    }
                }
            }
            this.clockCnt--;
        }
        // Store the sign of the clock signal for this cycle
        this.clockSgn = (clock > 0);
    }
}//»
class MonoSeq extends Sequencer{//«
    constructor(id, state, sampleRate, send)
    {
        super(id, state, sampleRate, send);
        // Generate the scale notes
        this.scale = music.genScale(state.scaleRoot, state.scaleName, state.numOctaves);
        // Current gate state
        this.gateState = 'off';
        // Time the last note was triggered
        this.trigTime = 0;
        // Frequency of the note being held
        this.freq = 0;
    }

//Set/update the entire state for this node
    setState(state)
    {
        Sequencer.prototype.setState.call(this, state);
        // Generate the scale notes
        this.scale = music.genScale(state.scaleRoot, state.scaleName, state.numOctaves);
    }

//Set a given cell in a step sequencer
    setCell(patIdx, stepIdx, rowIdx, value)
    {
        // Clear all other notes at this step
        let pattern = this.state.patterns[patIdx];
        let numRows = pattern[stepIdx].length;
        for (let i = 0; i < numRows; ++i)
            pattern[stepIdx][i] = 0;

        Sequencer.prototype.setCell.call(this, patIdx, stepIdx, rowIdx, value);
    }

//Trigger a note at this row
    trigRow(rowIdx, time)
    {
        this.gateState = 'pretrig';
        this.trigTime = time;
        let note = this.scale[rowIdx];
        this.freq = note.getFreq();
    }

//Takes the current time and clock signal as input.
//Produces frequency and gate signals as output.
    update(time, clock, gateTime){
        Sequencer.prototype.update.call(this, time, clock, gateTime);
        assert (!isNaN(this.freq), 'MonoSeq freq is NaN');
        // The pretrig state serves to force the gate to go to
        // zero for at least one cycle so that ADSR envelopes
        // can be retriggered if already active.
        switch (this.gateState)
        {
            case 'off':
            return [this.freq, 0];
            case 'pretrig':
            this.gateState = 'on';
            return [0, 0];
            case 'on':
            {
                // If we are past the end of the note
                if (time - this.trigTime > gateTime)
                {
                    this.gateState = 'off';
                    this.trigTime = 0;
                }
                return [this.freq, 1];
            }
            default:
            assert (false);
        }
    }
}//»
class GateSeq extends Sequencer{//«
    constructor(id, state, sampleRate, send)
    {
        super(id, state, sampleRate, send);

        // Generate the scale notes
        this.numRows = state.numRows;

        // Current gate states
        this.gateState = (new Array(this.numRows)).fill('off');

        // Time when the gate was triggered
        this.trigTime = (new Array(this.numRows)).fill(0);

        // Gate output values, one per row
        this.gates = (new Array(this.numRows)).fill(0);
    }

//     * Set/update the entire state for this node
    setState(state)
    {
        Sequencer.prototype.setState.call(this, state);

        this.numRows = state.numRows;
        this.gateState = (new Array(this.numRows)).fill('off');
        this.trigTime = (new Array(this.numRows)).fill(0);
        this.gates = (new Array(this.numRows)).fill(0);
    }

//     * Set a given cell in a step sequencer
    setCell(patIdx, stepIdx, rowIdx, value)
    {
        Sequencer.prototype.setCell.call(this, patIdx, stepIdx, rowIdx, value);
    }

//     * Trigger a note at this row
    trigRow(rowIdx, time)
    {
        this.gateState[rowIdx] = 'pretrig';
        this.trigTime[rowIdx] = time;
    }

//     * Takes the current time and clock signal as input.
//     * Produces frequency and gate signals as output.
    update(time, clock, gateTime)
    {
        Sequencer.prototype.update.call(this, time, clock, gateTime);

        // For each row
        for (let i = 0; i < this.numRows; ++i)
        {
            // The pretrig state serves to force the gate to go to
            // zero for at least one cycle so that ADSR envelopes
            // can be retriggered if already active.
            switch (this.gateState[i])
            {
                case 'pretrig':
                this.gateState[i] = 'on';
                break;

                case 'on':
                {
                    // If we are past the end of the note
                    if (time - this.trigTime[i] > gateTime)
                    {
                        this.gateState[i] = 'off';
                        this.trigTime[i] = 0;
                    }
                }
                break;

                case 'off':
                break;

                default:
                assert (false);
            }

            this.gates[this.numRows - (i+1)] = (this.gateState[i] == 'on')? 1:0;
        }

        // Return the gate values (one per row)
        return this.gates;
    }
}//»

*/

