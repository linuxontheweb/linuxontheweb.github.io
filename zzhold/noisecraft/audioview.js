const log=(...args)=>{console.log(...args)};

import { assert } from './utils.js';
import * as model from './model.js';
import { compile } from './compiler.js';
//let destinationNode;
export class AudioView {

    constructor(model, ctx, destination){//«
		this.destination = destination;
        this.model = model;
        model.addView(this);

        // Web Audio context
        this.audioCtx = ctx;

        // Background audio thread
        this.audioWorklet = null;

        // Latest compiled unit
        this.unit = null;
    }//»

    update(state, action){//«
        // These actions are ignored by the audio view
        if (action instanceof model.MoveNodes ||
            action instanceof model.SetNodeName ||
            action instanceof model.SetCurStep ||
            action instanceof model.SetPattern ||
            action instanceof model.SendSamples ||
            action instanceof model.ClockPulse)
        {
            return;
        }

        if (action instanceof model.Play)
        {
            this.playAudio(state);
            return;
        }

        if (action instanceof model.Stop)
        {
            this.stopAudio();
            return;
        }

        if (action instanceof model.SetParam)
        {
            this.send({
                type: 'SET_PARAM',
                nodeId: action.nodeId,
                paramName: action.paramName,
                value: action.value
            });

            return;
        }

        if (action instanceof model.ToggleCell)
        {
            this.send({
                type: 'SET_CELL',
                nodeId: action.nodeId,
                patIdx: action.patIdx,
                stepIdx: action.stepIdx,
                rowIdx: action.rowIdx,
                value: action.value
            });

            return;
        }

        if (action instanceof model.QueuePattern)
        {
            let node = state.nodes[action.nodeId];

            this.send({
                type: 'QUEUE_PATTERN',
                nodeId: action.nodeId,
                patIdx: action.patIdx,
                patData: node.patterns[action.patIdx]
            });

            return;
        }

        // TODO: use this for ExtendPattern, ShrinkPattern as well
        if (action instanceof model.SetScale)
        {
            this.send({
                type: 'SET_STATE',
                nodeId: action.nodeId,
                state: state.nodes[action.nodeId]
            });

            return;
        }

        if (action instanceof model.NoteOn)
        {
            this.send({
                type: 'NOTE_ON',
                nodeId: action.nodeId,
                noteNo: action.noteNo,
                velocity: action.velocity
            });

            return;
        }

//        console.log('recompile unit');

        // Compile a new unit from the project state
        this.unit = compile(state);
        this.send({
            type: 'NEW_UNIT',
            unit: this.unit
        });
    }//»

    async playAudio(state){//«
//        assert (!this.audioCtx);

//        this.audioCtx = new AudioContext({
//            latencyHint: 'interactive',
//            sampleRate: 44100
//        });

        // This seems to be necessary for Safari
//        this.audioCtx.resume();

        await this.audioCtx.audioWorklet.addModule('/new/noisecraft/audioworklet.js');

        this.audioWorklet = new AudioWorkletNode(
            this.audioCtx,
            'sample-generator',
            { outputChannelCount: [2] }
        );

        // Callback to receive messages from the audioworklet
        this.audioWorklet.port.onmessage = this.onmessage.bind(this);

        this.audioWorklet.connect(this.destination);

        // Compile a new unit from the project state
        this.unit = compile(state);
        this.send({
            type: 'NEW_UNIT',
            unit: this.unit
        });
    }//»

    stopAudio(){//«
        assert (this.audioCtx);

        this.audioWorklet.disconnect();
        this.audioWorklet = null;

        this.audioCtx.close();
        this.audioCtx = null;
    }//»

    send(msg){//«
        assert (msg instanceof Object);
        if (!this.audioWorklet)
			return;

        this.audioWorklet.port.postMessage(msg);
    }//»

    onmessage(event){//«
        // If playback is stopped, ignore any remaining
        // messages from the audio thread
        if (!this.audioCtx)
            return;

        let msg = event.data;

        switch (msg.type)
        {
            case 'SET_CUR_STEP':
            this.model.update(new model.SetCurStep(msg.nodeId, msg.stepIdx));
            break;

            case 'SET_PATTERN':
            this.model.update(new model.SetPattern(msg.nodeId, msg.patIdx));
            break;

            case 'SEND_SAMPLES':
            this.model.update(new model.SendSamples(msg.nodeId, msg.samples));
            break;

            case 'CLOCK_PULSE':
            this.model.update(new model.ClockPulse(msg.nodeId, msg.time));
            break;
        }
    }//»

}
