
//«
import { assert, isPosInt } from './utils.js';
import { NODE_SCHEMA } from './model.js';
import * as synth from './synth.js';
import * as music from './music.js';
//»

const log=(...args)=>{console.log(...args)};

export class AudioGraph{//«

    constructor(sampleRate, send){//«
        assert (sampleRate == 44100);
        this.sampleRate = sampleRate;

        // Current playback position in seconds
        this.playPos = 0;

        // Compiled code to generate audio samples
        this._genSample = null;

        // Method to send messages to the main thread
        this.send = send;

        // Stateful audio processing nodes, indexed by nodeId
        this.nodes = [];
    }//»
    newUnit(unit){//«
//     * Update the audio graph given a new compiled unit
        // Note that we don't delete any nodes, even if existing nodes are
        // currently not listed in the compiled unit, because currently
        // disconnected nodes may get reconnected, and deleting things like
        // delay lines would lose their current state.
        // All nodes get garbage collected when the playback is stopped.

        // For each audio node
        for (let nodeId in unit.nodes){
            let nodeState = unit.nodes[nodeId];

            let nodeClass = (
                nodeState.type in NODE_CLASSES?
                NODE_CLASSES[nodeState.type]:
                AudioNode
            );


            // If a node with this nodeId is already mapped
            if (this.nodes[nodeId])
            {
                let node = this.nodes[nodeId];

                // The existing node must have the same type
                assert (node instanceof nodeClass);

                // Update the node's state
                node.setState(nodeState);
            }
            else
            {
                // Create a new audio node
                this.nodes[nodeId] = new nodeClass(
                    nodeId,
                    nodeState,
                    this.sampleRate,
                    this.send
                );

            }
        }

        // Create the sample generation function
        this._genSample = new Function(
            'time',
            'nodes',
            unit.src
        );
//log(this._genSample);
    }//»
    parseMsg(msg){//«
        let node = ('nodeId' in msg)? this.nodes[msg.nodeId]:null;

        switch (msg.type)
        {
            case 'NEW_UNIT':
            this.newUnit(msg.unit);
            break;

            case 'SET_PARAM':
            node.setParam(msg.paramName, msg.value);
            break;

            case 'SET_STATE':
            node.setState(msg.state);
            break;

            case 'SET_CELL':
            node.setCell(msg.patIdx, msg.stepIdx, msg.rowIdx, msg.value);
            break;

            case 'QUEUE_PATTERN':
            node.queuePattern(msg.patIdx, msg.patData);
            break;

            case 'NOTE_ON':
            node.noteOn(msg.noteNo, msg.velocity);
            break;

            default:
            throw new TypeError('unknown message type');
        }
    }//»
    genSample(){//«
//     * Generate one [left, right] pair of audio samples
        if (!this._genSample)
            return [0, 0];

        this.playPos += 1 / 44100;
        return this._genSample(this.playPos, this.nodes);
    }//»

}//»

class AudioNode{//«
    constructor(id, state, sampleRate, send){//«
        this.nodeId = id;
        this.state = state;
        this.params = state.params;
        this.sampleRate = sampleRate;
        this.sampleTime = 1 / sampleRate;
        this.send = send;
    }//»

    /**
     * Set a parameter value on a given node
     */
    setParam(paramName, value){//«
        assert (paramName in this.params);
        this.params[paramName] = value;
    }//»

    /**
     * Set/update the entire state for this node
     */
    setState(state){//«
        this.state = state;
        this.params = state.params;
    }//»
}//»

//Osc«

class NoiseOsc extends AudioNode{//«
	constructor(id, state, sampleRate, send){
		super(id, state, sampleRate, send);
	}

	update(){
		let minVal = this.params.minVal;
		let maxVal = this.params.maxVal;
		let range = maxVal - minVal;
		return minVal + range * Math.random();
	}
}//»
class PulseOsc extends AudioNode{//«

constructor(id, state, sampleRate, send) {
	super(id, state, sampleRate, send);
	this.phase = 0;
}

update(freq, duty){
	let minVal = this.params.minVal;
	let maxVal = this.params.maxVal;
	this.phase += this.sampleTime * freq;
	let cyclePos = this.phase % 1;
	return (cyclePos < duty)? minVal:maxVal;
}

}//»
class SawOsc extends AudioNode{//«

constructor(id, state, sampleRate, send){
	super(id, state, sampleRate, send);
	this.phase = 0;
}

update(freq){
	let minVal = this.params.minVal;
	let maxVal = this.params.maxVal;
	this.phase += this.sampleTime * freq;
	let cyclePos = this.phase % 1;
	return minVal + cyclePos * (maxVal - minVal);
}

}//»
class SineOsc extends AudioNode{//«

constructor(id, state, sampleRate, send) {
	super(id, state, sampleRate, send);
	this.phase = 0;
	this.syncSgn = false;
}

update(freq, sync) {
	let minVal = this.params.minVal;
	let maxVal = this.params.maxVal;

	if (!this.syncSgn && sync > 0)
		this.phase = 0;

	this.syncSgn = (sync > 0);

	let cyclePos = this.phase % 1;
	this.phase += this.sampleTime * freq;

	let v = Math.sin(cyclePos * 2 * Math.PI);
	let normVal = (v + 1) / 2;

	return minVal + normVal * (maxVal - minVal);
}

}//»
class TriOsc extends AudioNode{//«

constructor(id, state, sampleRate, send){
	super(id, state, sampleRate, send);
	this.phase = 0;
}

update(freq){
	let minVal = this.params.minVal;
	let maxVal = this.params.maxVal;
	this.phase += this.sampleTime * freq;
	let cyclePos = this.phase % 1;
	let normVal = (cyclePos < 0.5)? (2 * cyclePos):(1 - 2 * (cyclePos - 0.5));
	return minVal + normVal * (maxVal - minVal);
}

}//»

//»
//Clock«

class Clock extends AudioNode{//«

constructor(id, state, sampleRate, send){
	super(id, state, sampleRate, send);
	this.phase = 0;
}

update(){
	let freq = music.CLOCK_PPQ * this.params.value / 60;
	let duty = 0.5;
	this.phase += this.sampleTime * freq;
	let cyclePos = this.phase % 1;

	// Note that the clock starts high so that it will
	// trigger immediately upon starting
	return (cyclePos < duty)? 1:-1;
}

}//»
class ClockDiv extends AudioNode{//«

constructor(id, state, sampleRate, send){

super(id, state, sampleRate, send);
	// Last clock sign at the input (positive/negative)
	this.inSgn = true;

	// Current clock sign at the output (positive/negative)
	// We start high to trigger immediately upon starting,
	// just like the Clock node
	this.outSgn = true;

	// Number of input ticks since the last output tick
	this.clockCnt = 0;
}

update(clock){
	// Current clock sign at the input
	let curSgn = (clock > 0);
	// If the input clock sign just flipped
	if (this.inSgn != curSgn){
		// Count all edges, both rising and falling
		this.clockCnt++;
		// If we've reached the division factor
		if (this.clockCnt >= this.params.factor){
			// Reset the clock count
			this.clockCnt = 0;
			// Flip the output clock sign
			this.outSgn = !this.outSgn;
		}
	}
	this.inSgn = curSgn;
	return this.outSgn? 1:-1;
}

}//»
class ClockOut extends AudioNode{//«

constructor(id, state, sampleRate, send){
	super(id, state, sampleRate, send);
	// Last clock sign at the input (positive/negative)
	this.inSgn = false;
}

update(time, clock){
	// Current clock sign at the input
	let curSgn = (clock > 0);

	// If the input clock sign just went positive (rising edge)
	if (curSgn && this.inSgn != curSgn){
		// Send a clock pulse back to the main thread
		this.send({
			type: 'CLOCK_PULSE',
			nodeId: this.nodeId,
			time: time
		});
	}

	this.inSgn = curSgn;
}
}//»

//»
//Sequencers«

class Sequencer extends AudioNode{//«

    constructor(id, state, sampleRate, send){//«

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
    }//»
    setState(state){//«
    /**
     * Set/update the entire state for this node
     */
        AudioNode.prototype.setState.call(this, state);

        this.patIdx = state.curPattern;
    }//»
    setCell(patIdx, stepIdx, rowIdx, value){//«
    /**
     * Set a given cell in a step sequencer
     */
    /**
     * Set a given cell in a step sequencer
     */
        let pattern = this.state.patterns[patIdx];
        pattern[stepIdx][rowIdx] = value;
    }//»
    queuePattern(patIdx, patData){//«
    /**
     * Queue the next pattern to play
     */
        console.log(`got queuePattern, patIdx=${patIdx}`);

        this.state.patterns[patIdx] = patData;
        this.nextPat = patIdx;
    }//»
    trigRow(rowIdx, time){//«
    /**
     * Trigger a note at this row
     */
        throw Error('each sequencer must implement trigRow');
    }//»
    update(time, clock, gateTime){//«
    /**
     * Takes the current time and clock signal as input.
     * Produces frequency and gate signals as output.
     */
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
//»

}//»
class MonoSeq extends Sequencer{//«

    constructor(id, state, sampleRate, send){//«
        super(id, state, sampleRate, send);

        // Generate the scale notes
        this.scale = music.genScale(state.scaleRoot, state.scaleName, state.numOctaves);

        // Current gate state
        this.gateState = 'off';

        // Time the last note was triggered
        this.trigTime = 0;

        // Frequency of the note being held
        this.freq = 0;
    }//»
    setState(state){//«
    /**
     * Set/update the entire state for this node
     */
        Sequencer.prototype.setState.call(this, state);

        // Generate the scale notes
        this.scale = music.genScale(state.scaleRoot, state.scaleName, state.numOctaves);
    }//»
    setCell(patIdx, stepIdx, rowIdx, value){//«
    /**
     * Set a given cell in a step sequencer
     */
        // Clear all other notes at this step
        let pattern = this.state.patterns[patIdx];
        let numRows = pattern[stepIdx].length;
        for (let i = 0; i < numRows; ++i)
            pattern[stepIdx][i] = 0;

        Sequencer.prototype.setCell.call(this, patIdx, stepIdx, rowIdx, value);
    }//»
    trigRow(rowIdx, time){//«
    /**
     * Trigger a note at this row
     */
        this.gateState = 'pretrig';
        this.trigTime = time;
        let note = this.scale[rowIdx];
        this.freq = note.getFreq();
    }//»
    update(time, clock, gateTime){//«
    /**
     * Takes the current time and clock signal as input.
     * Produces frequency and gate signals as output.
     */
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
    }//»

}//»
class GateSeq extends Sequencer{//«

    constructor(id, state, sampleRate, send){//«
        super(id, state, sampleRate, send);

        // Generate the scale notes
        this.numRows = state.numRows;

        // Current gate states
        this.gateState = (new Array(this.numRows)).fill('off');

        // Time when the gate was triggered
        this.trigTime = (new Array(this.numRows)).fill(0);

        // Gate output values, one per row
        this.gates = (new Array(this.numRows)).fill(0);
    }//»
    setState(state){//«
    /**
     * Set/update the entire state for this node
     */
        Sequencer.prototype.setState.call(this, state);

        this.numRows = state.numRows;
        this.gateState = (new Array(this.numRows)).fill('off');
        this.trigTime = (new Array(this.numRows)).fill(0);
        this.gates = (new Array(this.numRows)).fill(0);
    }//»
    setCell(patIdx, stepIdx, rowIdx, value){//«
    /**
     * Set a given cell in a step sequencer
     */
        Sequencer.prototype.setCell.call(this, patIdx, stepIdx, rowIdx, value);
    }//»
    trigRow(rowIdx, time){//«
    /**
     * Trigger a note at this row
     */
        this.gateState[rowIdx] = 'pretrig';
        this.trigTime[rowIdx] = time;
    }//»
    update(time, clock, gateTime){//«
    /**
     * Takes the current time and clock signal as input.
     * Produces frequency and gate signals as output.
     */
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
    }//»

}//»

//»

class ADSRNode extends AudioNode{//«
    constructor(id, state, sampleRate, send)
    {
        super(id, state, sampleRate, send);
        this.env = new synth.ADSREnv();
    }

    update(time, gate, attack, decay, susVal, release)
    {
        return this.env.eval(time, gate, attack, decay, susVal, release)
    }
}//»
class Delay extends AudioNode{//«
    constructor(id, state, sampleRate, send)
    {
        super(id, state, sampleRate, send);

        // Stateful delay line object
        this.delay = new synth.Delay(sampleRate);
    }
}//»
class Distort extends AudioNode{//«

constructor(id, state, sampleRate, send){
	super(id, state, sampleRate, send);
}

update(x, amount){
	amount = Math.min(Math.max(amount, 0), 1);
	amount -= 0.01;

	var k = 2 * amount / (1 - amount);
	var y = (1 + k) * x / (1 + k * Math.abs(x));
	return y;
//	return synth.distort(input, amount);
}

}//»
class Hold extends AudioNode{//«
    constructor(id, state, sampleRate, send)
    {
        super(id, state, sampleRate, send);

        // Value currently being held
        this.value = 0;

        // Current trig input sign (positive/negative)
        this.trigSgn = false;
    }

    write(value, trig)
    {
        if (!this.trigSgn && trig > 0)
            this.value = value;

        this.trigSgn = (trig > 0);
    }

    read()
    {
        return this.value;
    }
}//»
class Slide extends AudioNode{//«
    constructor(id, state, sampleRate, send)
    {
        super(id, state, sampleRate, send);

        // Current state
        this.s = 0;
    }

    update(input, rate)
    {
        // Remap so the useful range is around [0, 1]
        rate = rate * 1000;

        if (rate < 1)
            rate = 1;

        this.s += (1 / rate) * (input - this.s);

        return this.s;
    }
}//»
class Filter extends AudioNode{//«
	constructor(id, state, sampleRate, send){
		super(id, state, sampleRate, send);
		this.filter = new synth.TwoPoleFilter();
	}

	update(input, cutoff, reso){
		return this.filter.apply(input, cutoff, reso);
	}
}//»
class Fold extends AudioNode{//«
    /**
     * I create a new Wavefold node.
     *
     * @param  {Number}  id - id of this node
     * @param  {Object}  state - initial state
     * @param  {Number}  sampleRate - audio sample rate
     * @param  {Function}  send - event handler
     */
    constructor(id, state, sampleRate, send) {
        super(id, state, sampleRate, send);
        // redundant ctor
    }

    /*«Distort incoming audio signal by "folding".
     *
     * <blockquote style="background-color:whitesmoke">
     *  assume x is <em>[input]</em> and amp is <em>[rate]</em>
     *  <pre>
     *    f(x) = x * amp
     *    g(x) = 4(abs(0.25x+0.25-round(0.25x+0.25))-0.25)
     *    g(f(x)) => out
     *  </pre>
     * </blockquote>
     * See {@link  https://www.keithmcmillen.com/blog/simple-synthesis-part-8-wavefolding/}
     * and {@link https://jatinchowdhury18.medium.com/complex-nonlinearities-episode-6-wavefolding-9529b5fe4102}
     *
     * @param  {Sample}  input - signal
     * @param  {PositiveReal}  rate - amplitude of fold
     * @returns  {Sample}
     »*/
    update(input, rate){
        // Make it so rate 0 means input unaltered because
        // NoiseCraft knobs default to the [0, 1] range
        if (rate < 0) rate = 0;
        rate = rate + 1;

        input = input * rate;
        return 4 * (Math.abs(0.25 * input + 0.25 - Math.round(0.25 * input + 0.25)) - 0.25);
    }
}//»

class Scope extends AudioNode{//«
    constructor(id, state, sampleRate, send)
    {
        super(id, state, sampleRate, send);

        const SEND_SIZE = NODE_SCHEMA.Scope.sendSize;
        const SEND_RATE = NODE_SCHEMA.Scope.sendRate;

        // How often to gather samples
        this.sampleInterv = sampleRate / (SEND_SIZE * SEND_RATE);
        assert (isPosInt(this.sampleInterv));

        // Buffer of samples to be send
        this.buffer = new Array(SEND_SIZE);

        // How many samples we've seen in total
        this.numSamples = 0;

        // How many samples we have ready to send
        this.numReady = 0;
    }

    update(inVal)
    {
        if (this.numSamples % this.sampleInterv == 0)
        {
            this.buffer[this.numReady] = inVal;
            this.numReady++;

            if (this.numReady == this.buffer.length)
            {
                // Send the current step back to the main thread
                this.send({
                    type: 'SEND_SAMPLES',
                    nodeId: this.nodeId,
                    samples: this.buffer
                });

                this.numReady = 0;
            }
        }

        this.numSamples++;
    }
}//»
class MidiIn extends AudioNode{//«
    constructor(id, state, sampleRate, send)
    {
        super(id, state, sampleRate, send);

        // Current note being held
        this.noteNo = 0;

        // Frequency of the note being held
        this.freq = 0;

        // Current gate state
        this.gateState = 'off';
    }

    noteOn(noteNo, velocity)
    {
        if (velocity > 0)
        {
            this.noteNo = noteNo;
            this.freq = music.Note(noteNo).getFreq();
            this.gateState = 'pretrig';
        }
        else
        {
            if (noteNo == this.noteNo)
            {
                this.noteNo = 0;
                this.gateState = 'off';
            }
        }
    }

    update()
    {
        // The pretrig state serves to force the gate to go to
        // zero for at least one cycle so that ADSR envelopes
        // can be retriggered if already active.
        switch (this.gateState)
        {
            case 'pretrig':
				this.gateState = 'on';
				return [0, 0];

            case 'on':
				return [this.freq, 1];

            case 'off':
				return [this.freq, 0];

            default:
				assert (false);
        }
    }
}//»

let NODE_CLASSES ={//«
    ADSR: ADSRNode,
    Clock: Clock,
    ClockDiv: ClockDiv,
    ClockOut: ClockOut,
    Delay: Delay,
    Distort: Distort,
    Hold: Hold,
    Noise: NoiseOsc,
    Pulse: PulseOsc,
    Saw: SawOsc,
    Sine: SineOsc,
    Tri: TriOsc,
    Scope: Scope,
    Slide: Slide,
    Filter: Filter,
    Fold: Fold,
    MidiIn: MidiIn,
    MonoSeq: MonoSeq,
    GateSeq: GateSeq,
};//»


