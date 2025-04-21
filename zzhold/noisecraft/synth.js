import { assert } from './utils.js';

export function pulseOsc(time, freq, duty)//«
{
// Pulse/square oscillator
    var cyclePos = (time * freq) % 1;
    return (cyclePos < duty)? -1:1;
};//»
export function noise()//«
{
// Produces noise in the [-1, 1] range
    return 2 * Math.random() - 1;
};//»
export function distort(x, amount){
	amount = Math.min(Math.max(amount, 0), 1);
	amount -= 0.01;
	var k = 2 * amount / (1 - amount);
	var y = (1 + k) * x / (1 + k * Math.abs(x));
	return y;
}

export function lerp(x, y0, y1)//«
{
// Linear interpolation between two values
    if (x >= 1)
        return y1;

    return y0 + x * (y1 - y0);
};//»
export function eerp(x, yL, yR, exp){//«
// Exponential interpolation function
// x ranges from 0 to 1
    if (x >= 1)
    {
        return 0;
    }

    return yL + Math.pow(x, exp) * (yR - yL);
};//»
export function expRamp(t, tMax, v0, v1){//«
// Exponential ramp function
    if (Math.sign(v0) == -Math.sign(v1))
        return v0;

    if (v0 == 0)
        return v0;

    return v0 * Math.pow(v1 / v0, t / tMax);
}//»

export function ADEnv(time, attack, decay){//«
// Attack-decay envelope
    if (time < attack)
    {
        return eerp(time/attack, 0, 1, 0.66);
    }

    time = time - attack;

    if (time < decay)
    {
        return eerp(time/decay, 1, 0, 0.66);
    }

    return 0;
};//»

//ADSREnv«
export function ADSREnv(){
/**
Attack-decay-sustain-release envelope
*/
    // Current state
    this.state = 'off';

    this.startTime = 0;

    this.startVal = 0;
}
ADSREnv.prototype.reset = function (){
    ADSREnv.call(this);
}
ADSREnv.prototype.eval = function (curTime, gate, attack, decay, susVal, release) {

	switch (this.state){

		case 'off': {
			if (gate > 0) {
				this.state = 'attack';
				this.startTime = curTime;
				this.startVal = 0;
			}
			return 0;
		}
		break;

		case 'attack': {
			let time = curTime - this.startTime;

			if (time > attack) {
				this.state = 'decay';
				this.startTime = curTime;
				return 1;
			}

			return lerp(time / attack, this.startVal, 1);
		}
		break;

		case 'decay': {
			let time = curTime - this.startTime;

			let curVal = lerp(time / decay, 1, susVal);

			if (gate <= 0) {
				this.state = 'release';
				this.startTime = curTime;
				this.startVal = curVal;
				return curVal;
			}

			if (time > decay) {
				this.state = 'sustain';
				this.startTime = curTime;
				return susVal;
			}

			return curVal;
		}
		break;

		case 'sustain': {
			if (gate <= 0) {
				this.state = 'release';
				this.startTime = curTime;
				this.startVal = susVal;
			}
			return susVal;
		}
		break;

		case 'release': {
			let time = curTime - this.startTime;
			if (time > release) {
				this.state = 'off';
				return 0;
			}
			let curVal = lerp(time / release, this.startVal, 0)
			if (gate > 0) {
				this.state = 'attack';
				this.startTime = curTime;
				this.startVal = curVal;
			}
			return curVal;
		}
		break;

	}

	throw 'invalid envelope state';

}
//»

//«
export function TwoPoleFilter()//«
{
/**
Basic IIR, 2-pole, resonant Low Pass Filter (LPF)
*/
    this.s0 = 0;
    this.s1 = 0;
}//»
TwoPoleFilter.prototype.apply = function (s, cutoff, resonance){
	assert (!isNaN(s), 'NaN value fed in TwoPoleFilter');
	cutoff = Math.min(cutoff, 1);
	resonance = Math.max(resonance, 0)

	var c = Math.pow(0.5, (1 - cutoff) / 0.125);
	var r = Math.pow(0.5, (resonance + 0.125) / 0.125);
	var mrc = 1 - r * c;

	var v0 = this.s0;
	var v1 = this.s1;

	v0 = (mrc * v0) - (c * v1) + (c * s);
	v1 = (mrc * v1) + (c * v0);
	s = v1;

	this.s0 = v0;
	this.s1 = v1;

	return s;
};
//»

export function KrajeskiFilter()//«
{
/**
Original code by Aaron Krajeski
http://song-swap.com/MUMT618/aaron/Presentation/demo.html
*/
    this.state = [0,0,0,0,0];
    this.delay = [0,0,0,0,0];

    this.drive = 1.0
    this.gComp = 1.0;

    this.setCutoff(1000);
    this.setResonance(0.1);
}//»
KrajeskiFilter.prototype.apply = function (s, cutoff, resonance){//«
    // FIXME
    var samples = [s];
    var n = 1;

    // FIXME
    this.setCutoff(20000 * cutoff);
    this.setResonance(resonance);

    var g = this.g;
    var gRes = this.gRes;
    var gComp = this.gComp;
    var drive = this.drive;
    var state = this.state;
    var delay = this.delay;

    assert (!isNaN(g));
    assert (!isNaN(gRes));
    assert (!isNaN(gComp));
    assert (!isNaN(drive), 'drive is NaN');

	for (var s = 0; s < n; ++s)
	{
		state[0] = Math.tanh(drive * (samples[s] - 4 * gRes * (state[4] - gComp * samples[s])));

		for (var i = 0; i < 4; i++)
		{
			state[i+1] = g * (0.3 / 1.3 * state[i] + 1 / 1.3 * delay[i] - state[i + 1]) + state[i + 1];
			delay[i] = state[i];
		}

		samples[s] = state[4];
	}

    return samples[0];
}//»
KrajeskiFilter.prototype.setResonance = function (resonance){//«
    var wc = this.wc;
	this.gRes = resonance * (1.0029 + 0.0526 * wc - 0.926 * Math.pow(wc, 2) + 0.0218 * Math.pow(wc, 3));
}//»
KrajeskiFilter.prototype.setCutoff = function (cutoff){//«
/**
The cutoff value is a frequency in Hertz
Unstable above 15KHz (clicks and pops)
*/
    var sampleRate = 44100;
	var wc = 2 * Math.PI * cutoff / sampleRate;
    this.wc = wc;
	this.g = 0.9892 * wc - 0.4342 * Math.pow(wc, 2) + 0.1381 * Math.pow(wc, 3) - 0.0202 * Math.pow(wc, 4);
}//»

export class Delay{//«
/**
 * Delay line, implemented as a circular buffer
 * */
    constructor(sampleRate)
    {
        // Maximum delay time
        const MAX_DELAY_TIME = 10;

        this.sampleRate = sampleRate;
        this.buffer = new Float32Array(MAX_DELAY_TIME * sampleRate);
        this.buffer.fill(0);

        // Write and read positions in the buffer
        this.writeIdx = 0;
        this.readIdx = 0;
    }

    reset()
    {
        this.buffer.fill(0);
        this.writeIdx = 0;
        this.readIdx = 0;
    }

    /**
     * Write a sample into the delay line
     * This is intentionally structured so that both inputs are in the
     * write function, so that the delay line can be split into two nodes
     * one with no inputs.
     */
    write(s, delayTime)
    {
        this.writeIdx = (this.writeIdx + 1) % this.buffer.length;
        this.buffer[this.writeIdx] = s;

        // Calculate how far in the past to read
        let numSamples = Math.min(
            Math.floor(this.sampleRate * delayTime),
            this.buffer.length - 1
        );

        this.readIdx = this.writeIdx - numSamples;

        // If past the start of the buffer, wrap around
        if (this.readIdx < 0)
            this.readIdx += this.buffer.length;
    }

    read(delayTime)
    {
        return this.buffer[this.readIdx];
    }
}//»

