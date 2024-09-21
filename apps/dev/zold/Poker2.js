/*
Steps: 

1) @MKWMKJYUTVBS: Figure out an actual Q network for this poker situation
Probably just try out 1 or 2 fully connected dense layers...

2) Uncomment these:
	@EUIKMJHYURPO 
	@MKDLOPIYTGH

*/
/*«

@EMKIIOPLKJHYTF: game.Step() is the crucial part of everything, since it
determines the reward based on a player's action.  

It returns: {reward, state, done, fruitEaten} to agent.playStep, which is the
generic function to determine (@WMKMJUIOPBN) whether the epsilon value will
allow the agent to "explore" with a random move, or use the current dqn network
weights with model.predict. The newly returned state is appended to
replayMemory as nextState:

this.replayMemory.append([state, action, reward, done, nextState]);

»*/
/*//nodeFileSystem«


//io_utils«

//import {getModelArtifactsInfoForJSON, toArrayBuffer} from './io_utils';
// * Convert an ArrayBuffer to a Buffer.
export function toBuffer(ab: ArrayBuffer): Buffer {
  const view = new Uint8Array(ab);
  return Buffer.from(view); // copies data
}

// * Convert a Buffer or an Array of Buffers to an ArrayBuffer.
// * If the input is an Array of Buffers, they will be concatenated in the
// * specified order to form the output ArrayBuffer.
export function toArrayBuffer(buf: Buffer|Buffer[]): ArrayBuffer {
  if (Array.isArray(buf)) {
    // An Array of Buffers.
    let totalLength = 0;
    for (const buffer of buf) {
      totalLength += buffer.length;
    }

    const ab = new ArrayBuffer(totalLength);
    const view = new Uint8Array(ab);
    let pos = 0;
    for (const buffer of buf) {
      pos += buffer.copy(view, pos);
    }
    return ab;
  } else {
    // A single Buffer. Return a copy of the underlying ArrayBuffer slice.
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
}

// TODO(cais): Use explicit tfc.io.ModelArtifactsInfo return type below once it
// is available.
// * Populate ModelArtifactsInfo fields for a model with JSON topology.
// * @param modelArtifacts
// * @returns A ModelArtifactsInfo object.
export function getModelArtifactsInfoForJSON(
    modelArtifacts: tfc.io.ModelArtifacts) {
  if (modelArtifacts.modelTopology instanceof ArrayBuffer) {
    throw new Error('Expected JSON model topology, received ArrayBuffer.');
  }
  return {
    dateSaved: new Date(),
    modelTopologyType: 'JSON',
    modelTopologyBytes: modelArtifacts.modelTopology == null ?
        0 :
        Buffer.byteLength(JSON.stringify(modelArtifacts.modelTopology), 'utf8'),
    weightSpecsBytes: modelArtifacts.weightSpecs == null ?
        0 :
        Buffer.byteLength(JSON.stringify(modelArtifacts.weightSpecs), 'utf8'),
    weightDataBytes: modelArtifacts.weightData == null ?
        0 :
        modelArtifacts.weightData.byteLength,
  };
}
//»

//file_system«

////import * as tfc from '@tensorflow/tfjs-core';
//import * as fs from 'fs';
//import {dirname, join, resolve} from 'path';
//import {promisify} from 'util';

//const stat = promisify(fs.stat);
//const writeFile = promisify(fs.writeFile);
//const readFile = promisify(fs.readFile);
//const mkdir = promisify(fs.mkdir);

// tslint:disable-next-line:max-line-length

//import * as tfc from '@tensorflow/tfjs-core';


function doesNotExistHandler(name: string): (e: NodeJS.ErrnoException) =>
    never {
  return e => {
    switch (e.code) {
      case 'ENOENT':
        throw new Error(`${name} ${e.path} does not exist: loading failed`);
      default:
        throw e;
    }
  };
}

export class NodeFileSystem implements tfc.io.IOHandler {
  static readonly URL_SCHEME = 'file://';

  protected readonly path: string|string[];

  readonly MODEL_JSON_FILENAME = 'model.json';
  readonly WEIGHTS_BINARY_FILENAME = 'weights.bin';
  readonly MODEL_BINARY_FILENAME = 'tensorflowjs.pb';

//   * Constructor of the NodeFileSystem IOHandler.
//   * @param path A single path or an Array of paths.
//   *   For saving: expects a single path pointing to an existing or nonexistent directory. If the directory does not exist, it will be created.
//   *   For loading:
//-If the model has JSON topology(e.g.,`tf.Model`),a single path pointing to the JSON file(usually named `model.json`)is expected.  The JSON file is expected to contain `modelTopology` and/or `weightsManifest`. If `weightManifest` exists,the values of the weights will be loaded from relative paths(relative to the directory of `model.json`)as contained in `weightManifest`.
//-If the model has binary(protocol buffer GraphDef)topology,an Array of two paths is expected:the first path should point to the .pb file and the second path should point to the weight manifest JSON file.
  constructor(path: string|string[]) {
    if (Array.isArray(path)) {
      tfc.util.assert(
          path.length === 2,
          () => 'file paths must have a length of 2, ' +
              `(actual length is ${path.length}).`);
      this.path = path.map(p => resolve(p));
    } else {
      this.path = resolve(path);
    }
  }

  async save(modelArtifacts: tfc.io.ModelArtifacts):
      Promise<tfc.io.SaveResult> {
    if (Array.isArray(this.path)) {
      throw new Error('Cannot perform saving to multiple paths.');
    }

    await this.createOrVerifyDirectory();

    if (modelArtifacts.modelTopology instanceof ArrayBuffer) {
      throw new Error(
          'NodeFileSystem.save() does not support saving model topology ' +
          'in binary format yet.');
      // TODO(cais, nkreeger): Implement this. See
      //   https://github.com/tensorflow/tfjs/issues/343
    } else {
      const weightsBinPath = join(this.path, this.WEIGHTS_BINARY_FILENAME);
      const weightsManifest = [{
        paths: [this.WEIGHTS_BINARY_FILENAME],
        weights: modelArtifacts.weightSpecs
      }];
      const modelJSON = {
        modelTopology: modelArtifacts.modelTopology,
        weightsManifest,
      };
      const modelJSONPath = join(this.path, this.MODEL_JSON_FILENAME);
      await writeFile(modelJSONPath, JSON.stringify(modelJSON), 'utf8');
      await writeFile(
          weightsBinPath, Buffer.from(modelArtifacts.weightData), 'binary');

      return {
        // TODO(cais): Use explicit tfc.io.ModelArtifactsInfo type below once it
        // is available.
        // tslint:disable-next-line:no-any
        modelArtifactsInfo: getModelArtifactsInfoForJSON(modelArtifacts) as any
      };
    }
  }
  async load(): Promise<tfc.io.ModelArtifacts> {
    return Array.isArray(this.path) ? this.loadBinaryModel() :
                                      this.loadJSONModel();
  }

  protected async loadBinaryModel(): Promise<tfc.io.ModelArtifacts> {
    const topologyPath = this.path[0];
    const weightManifestPath = this.path[1];
    const topology =
        await stat(topologyPath).catch(doesNotExistHandler('Topology Path'));
    const weightManifest =
        await stat(weightManifestPath)
            .catch(doesNotExistHandler('Weight Manifest Path'));

    // `this.path` can be either a directory or a file. If it is a file, assume
    // it is model.json file.
    if (!topology.isFile()) {
      throw new Error('File specified for topology is not a file!');
    }
    if (!weightManifest.isFile()) {
      throw new Error('File specified for the weight manifest is not a file!');
    }

    const modelTopology = await readFile(this.path[0]);
    const weightsManifest = JSON.parse(await readFile(this.path[1], 'utf8'));

    const modelArtifacts: tfc.io.ModelArtifacts = {
      modelTopology,
    };
    const [weightSpecs, weightData] =
        await this.loadWeights(weightsManifest, this.path[1]);

    modelArtifacts.weightSpecs = weightSpecs;
    modelArtifacts.weightData = weightData;

    return modelArtifacts;
  }

  protected async loadJSONModel(): Promise<tfc.io.ModelArtifacts> {
    const path = this.path as string;
    const info = await stat(path).catch(doesNotExistHandler('Path'));

    // `path` can be either a directory or a file. If it is a file, assume
    // it is model.json file.
    if (info.isFile()) {
      const modelJSON = JSON.parse(await readFile(path, 'utf8'));

      const modelArtifacts: tfc.io.ModelArtifacts = {
        modelTopology: modelJSON.modelTopology,
      };
      if (modelJSON.weightsManifest != null) {
        const [weightSpecs, weightData] =
            await this.loadWeights(modelJSON.weightsManifest, path);
        modelArtifacts.weightSpecs = weightSpecs;
        modelArtifacts.weightData = weightData;
      }
      return modelArtifacts;
    } else {
      throw new Error(
          'The path to load from must be a file. Loading from a directory ' +
          'is not supported.');
    }
  }

  private async loadWeights(
      weightsManifest: tfc.io.WeightsManifestConfig,
      path: string): Promise<[tfc.io.WeightsManifestEntry[], ArrayBuffer]> {
    const dirName = dirname(path);
    const buffers: Buffer[] = [];
    const weightSpecs: tfc.io.WeightsManifestEntry[] = [];
    for (const group of weightsManifest) {
      for (const path of group.paths) {
        const weightFilePath = join(dirName, path);
        const buffer = await readFile(weightFilePath)
                           .catch(doesNotExistHandler('Weight file'));
        buffers.push(buffer);
      }
      weightSpecs.push(...group.weights);
    }
    return [weightSpecs, toArrayBuffer(buffers)];
  }

//For each item in `this.path`, creates a directory at the path or verify
//that the path exists as a directory.
  protected async createOrVerifyDirectory() {
    const paths = Array.isArray(this.path) ? this.path : [this.path];
    for (const path of paths) {
      try {
        await mkdir(path);
      } catch (e) {
        if (e.code === 'EEXIST') {
          if ((await stat(path)).isFile()) {
            throw new Error(
                `Path ${path} exists as a file. The path must be ` +
                `nonexistent or point to a directory.`);
          }
          // else continue, the directory exists
        } else {
          throw e;
        }
      }
    }
  }
}

export const nodeFileSystemRouter = (url: string|string[]) => {
  if (Array.isArray(url)) {
    if (url.every(
            urlElement => urlElement.startsWith(NodeFileSystem.URL_SCHEME))) {
      return new NodeFileSystem(url.map(
          urlElement => urlElement.slice(NodeFileSystem.URL_SCHEME.length)));
    } else {
      return null;
    }
  } else {
    if (url.startsWith(NodeFileSystem.URL_SCHEME)) {
      return new NodeFileSystem(url.slice(NodeFileSystem.URL_SCHEME.length));
    } else {
      return null;
    }
  }
};
// Registration of `nodeFileSystemRouter` is done in index.ts.

// * Factory function for Node.js native file system IO Handler.
 *
// * @param path A single path or an Array of paths.
//For saving:expects a single path pointing to an existing or nonexistent directory. If the directory does not exist,it will be created.
//For loading:
//-If the model has JSON topology(e.g.,`tf.Model`),a single path pointing to the JSON file(usually named `model.json`)is expected.  The JSON file is expected to contain `modelTopology` and/or `weightsManifest`. If `weightManifest` exists,the values of the weights will be loaded from relative paths(relative to the directory of `model.json`)as contained in `weightManifest`.
// If the model has binary(protocol buffer GraphDef)topology,an Array of two paths is expected:the first path should point to the .pb file and the second path should point to the weight manifest JSON file.

export function fileSystem(path: string|string[]): NodeFileSystem {
  return new NodeFileSystem(path);
}
//»

tf.io.registerLoadRouter(nodeFileSystemRouter);
tf.io.registerSaveRouter(nodeFileSystemRouter);

//»*/

//Imports«

import { util, api as capi } from "util";
import { globals } from "config";
const{strnum, isarr, isstr, isnum, isobj, log, jlog, cwarn, cerr, make}=util;
const {NS} = globals;
const wdg = NS.api.widgets;
const {poperr, popup, popin} = wdg;

//»

//Var: NAMES, etc.«
const NAMES = ["Lemmy", "Harfun", "Reempt", "Noon", "Zernt", "Gorpe", "Falkis", "Telch", "Degno"];
//const NAMES = ["Lemmy", "Harfunkle"];
const HERO = "Reempt";
const MAX_NUM_HANDS = 1;
const NUM_MATCHES = 1;
const MIN_BET = 3;
//let TEXT_ONLY = true;
let TEXT_ONLY = false;
//let TENS_ARE_T = false;
let TENS_ARE_T = true;
//»

//export const app = function(Win) {«
export const app = function(Win) {
//»

//Var«

//Hand class rankings«

const STRFL=9;
const QUAD=8;
const FULL=7;
const FLUSH=6;
const STRAIT=5;
const TRIP=4;
const TWOPR=3;
const PAIR=2;
const HIGH=1;

//»
//Human-readable card strings«

// d s h c
// ♦ ♠ ♥ ♣

/*To represent cards in a human-readable way, there are 2 choices:«
1) TEXT_ONLY
	a) true: text (e.g. 2h, Js)
	b) false: HTML (with graphical suit characters, suit colors, and light card backgrounds)
2) TENS_ARE_T
	a) true: Tens as 'T' (keeps all cards the same width)
	b) false: Tens as '10' (standard card deck)
»*/

let STR_DECK;

const HAND_PR_8 = [24, 25];
const HAND_PR_A = [48, 48];
const HAND_8_7 = [24,25,20,21];

if (TEXT_ONLY){
	if (TENS_ARE_T) STR_DECK=[//«
		"2d","2s","2h","2c",
		"3d","3s","3h","3c",
		"4d","4s","4h","4c",
		"5d","5s","5h","5c",
		"6d","6s","6h","6c",
		"7d","7s","7h","7c",
		"8d","8s","8h","8c",
		"9d","9s","9h","9c",
		"Td","Ts","Th","Tc",
		"Jd","Js","Jh","Jc",
		"Qd","Qs","Qh","Qc",
		"Kd","Ks","Kh","Kc",
		"Ad","As","Ah","Ac",
	];//»
	else STR_DECK=[//«
		"2d","2s","2h","2c",//0
		"3d","3s","3h","3c",//4
		"4d","4s","4h","4c",//8
		"5d","5s","5h","5c",//12
		"6d","6s","6h","6c",//16
		"7d","7s","7h","7c",//20
		"8d","8s","8h","8c",//24
		"9d","9s","9h","9c",//28
		"10d","10s","10h","10c",//32
		"Jd","Js","Jh","Jc",//36
		"Qd","Qs","Qh","Qc",//40
		"Kd","Ks","Kh","Kc",//44
		"Ad","As","Ah","Ac",//48
	];//»
}
else{
	if (TENS_ARE_T) STR_DECK=[//«
		"2<span class='cardsuitd'>♦</span>",
		"2<span class='cardsuits'>♠</span>",
		"2<span class='cardsuith'>♥</span>",
		"2<span class='cardsuitc'>♣</span>",
		"3<span class='cardsuitd'>♦</span>",
		"3<span class='cardsuits'>♠</span>",
		"3<span class='cardsuith'>♥</span>",
		"3<span class='cardsuitc'>♣</span>",
		"4<span class='cardsuitd'>♦</span>",
		"4<span class='cardsuits'>♠</span>",
		"4<span class='cardsuith'>♥</span>",
		"4<span class='cardsuitc'>♣</span>",
		"5<span class='cardsuitd'>♦</span>",
		"5<span class='cardsuits'>♠</span>",
		"5<span class='cardsuith'>♥</span>",
		"5<span class='cardsuitc'>♣</span>",
		"6<span class='cardsuitd'>♦</span>",
		"6<span class='cardsuits'>♠</span>",
		"6<span class='cardsuith'>♥</span>",
		"6<span class='cardsuitc'>♣</span>",
		"7<span class='cardsuitd'>♦</span>",
		"7<span class='cardsuits'>♠</span>",
		"7<span class='cardsuith'>♥</span>",
		"7<span class='cardsuitc'>♣</span>",
		"8<span class='cardsuitd'>♦</span>",
		"8<span class='cardsuits'>♠</span>",
		"8<span class='cardsuith'>♥</span>",
		"8<span class='cardsuitc'>♣</span>",
		"9<span class='cardsuitd'>♦</span>",
		"9<span class='cardsuits'>♠</span>",
		"9<span class='cardsuith'>♥</span>",
		"9<span class='cardsuitc'>♣</span>",
		"T<span class='cardsuitd'>♦</span>",
		"T<span class='cardsuits'>♠</span>",
		"T<span class='cardsuith'>♥</span>",
		"T<span class='cardsuitc'>♣</span>",
		"J<span class='cardsuitd'>♦</span>",
		"J<span class='cardsuits'>♠</span>",
		"J<span class='cardsuith'>♥</span>",
		"J<span class='cardsuitc'>♣</span>",
		"Q<span class='cardsuitd'>♦</span>",
		"Q<span class='cardsuits'>♠</span>",
		"Q<span class='cardsuith'>♥</span>",
		"Q<span class='cardsuitc'>♣</span>",
		"K<span class='cardsuitd'>♦</span>",
		"K<span class='cardsuits'>♠</span>",
		"K<span class='cardsuith'>♥</span>",
		"K<span class='cardsuitc'>♣</span>",
		"A<span class='cardsuitd'>♦</span>",
		"A<span class='cardsuits'>♠</span>",
		"A<span class='cardsuith'>♥</span>",
		"A<span class='cardsuitc'>♣</span>",

	];//»
	else STR_DECK=[//«
		"2<span class='cardsuitd'>♦</span>",
		"2<span class='cardsuits'>♠</span>",
		"2<span class='cardsuith'>♥</span>",
		"2<span class='cardsuitc'>♣</span>",
		"3<span class='cardsuitd'>♦</span>",
		"3<span class='cardsuits'>♠</span>",
		"3<span class='cardsuith'>♥</span>",
		"3<span class='cardsuitc'>♣</span>",
		"4<span class='cardsuitd'>♦</span>",
		"4<span class='cardsuits'>♠</span>",
		"4<span class='cardsuith'>♥</span>",
		"4<span class='cardsuitc'>♣</span>",
		"5<span class='cardsuitd'>♦</span>",
		"5<span class='cardsuits'>♠</span>",
		"5<span class='cardsuith'>♥</span>",
		"5<span class='cardsuitc'>♣</span>",
		"6<span class='cardsuitd'>♦</span>",
		"6<span class='cardsuits'>♠</span>",
		"6<span class='cardsuith'>♥</span>",
		"6<span class='cardsuitc'>♣</span>",
		"7<span class='cardsuitd'>♦</span>",
		"7<span class='cardsuits'>♠</span>",
		"7<span class='cardsuith'>♥</span>",
		"7<span class='cardsuitc'>♣</span>",
		"8<span class='cardsuitd'>♦</span>",
		"8<span class='cardsuits'>♠</span>",
		"8<span class='cardsuith'>♥</span>",
		"8<span class='cardsuitc'>♣</span>",
		"9<span class='cardsuitd'>♦</span>",
		"9<span class='cardsuits'>♠</span>",
		"9<span class='cardsuith'>♥</span>",
		"9<span class='cardsuitc'>♣</span>",
		"10<span class='cardsuitd'>♦</span>",
		"10<span class='cardsuits'>♠</span>",
		"10<span class='cardsuith'>♥</span>",
		"10<span class='cardsuitc'>♣</span>",
		"J<span class='cardsuitd'>♦</span>",
		"J<span class='cardsuits'>♠</span>",
		"J<span class='cardsuith'>♥</span>",
		"J<span class='cardsuitc'>♣</span>",
		"Q<span class='cardsuitd'>♦</span>",
		"Q<span class='cardsuits'>♠</span>",
		"Q<span class='cardsuith'>♥</span>",
		"Q<span class='cardsuitc'>♣</span>",
		"K<span class='cardsuitd'>♦</span>",
		"K<span class='cardsuits'>♠</span>",
		"K<span class='cardsuith'>♥</span>",
		"K<span class='cardsuitc'>♣</span>",
		"A<span class='cardsuitd'>♦</span>",
		"A<span class='cardsuits'>♠</span>",
		"A<span class='cardsuith'>♥</span>",
		"A<span class='cardsuitc'>♣</span>",

	];//»
}

/*
const STR_DECK=[//«
	"2 d","2 s","2 h","2 c",
	"3 d","3 s","3 h","3 c",
	"4 d","4 s","4 h","4 c",
	"5 d","5 s","5 h","5 c",
	"6 d","6 s","6 h","6 c",
	"7 d","7 s","7 h","7 c",
	"8 d","8 s","8 h","8 c",
	"9 d","9 s","9 h","9 c",
	"10 d","10 s","10 h","10 c",
	"J d","J s","J h","J c",
	"Q d","Q s","Q h","Q c",
	"K d","K s","K h","K c",
	"A d","A s","A h","A c",
];//»
*/

//»
const RANK=[//«
"Two",
"Three",
"Four",
"Five",
"Sixe",
"Seven",
"Eight",
"Nine",
"Ten",
"Jack",
"Queen",
"King",
"Ace"
];//»
const RANK_TO_CH=[//«
"2",
"3",
"4",
"5",
"6",
"7",
"8",
"9",
"T",
"J",
"Q",
"K",
"A"
];//»

const BET_AMOUNT = 2;
const SMALL_BLIND = 1;
const BIG_BLIND = 2;

const ROUNDS=["Pre-Flop","Flop","Turn","River"];

const CARDS_PER_ROUND=[0,3,1,1];
const NUM_HOLE_CARDS = 2;

const CARDS_PER_DECK = 52;
const NUM_ROUNDS = 4;
const FOLD_ACTION = -1;
const FOLD_AND_SHOW_ACTION = -2;
const STARTING_CHIPS = 100;
const TOTAL_STARTING_CHIPS = STARTING_CHIPS * NAMES.length;

const ACTION_FOLD = 0;
const ACTION_CALL = 1;
const ACTION_RAISE = 2;

const ALL_ACTIONS = [ACTION_FOLD, ACTION_CALL, ACTION_RAISE];
const NUM_ACTIONS = ALL_ACTIONS.length;


const PREFLOP_ROUND = 0;
const FLOP_ROUND = 1;
const TURN_ROUND = 2;
const RIVER_ROUND = 3;

const SCORE_PR_8 =   8781824;
const SCORE_PR_A =   9175040;
const SCORE_PR_8_7 = 23396352;
const SCORE_TRP_2 =  33554432;


let last_bettor;
let num_table_cards;
let round_num;
let table_cards;
let deck;
let players;
let all_players = [];
let start_position;
//let num_players = NAMES.length;
let num_players;
let extra_chips;
let cur_pos;
let last_cur_pos = -1;
let last_bet;
let pot;
let game;
let players_in_action;
let hand_num = 0;
let hero;

let hole_ranks;

let await_enter_cb;

//»

//DOM«

const {Main} = Win;

Win.makeScrollable();
Main._fs=24;
//Main._bgcol="#030315";
Main._bgcol="#030315";
let pre = make('pre');
Main._add(pre);

//»
//Util«

const sleep=(ms)=>{//«
	if (!ms) ms = 0;
	return new Promise((Y,N)=>{
		setTimeout(Y, ms);
	});
};//»
const await_enter=()=>{//«
	return new Promise((Y,N)=>{
		await_enter_cb = Y;
	});
};//»

const getRandomInteger=(min, max)=>{//«
  // Note that we don't reuse the implementation in the more generic
  // `getRandomIntegers()` (plural) below, for performance optimization.
  return Math.floor((max - min) * Math.random()) + min;
}//»
const getRandomIntegers=(min, max, numIntegers)=>{//«
  const output = [];
  for (let i = 0; i < numIntegers; ++i) {
    output.push(Math.floor((max - min) * Math.random()) + min);
  }
  return output;
}//»
const assertPositiveInteger=(x, name)=>{//«
  if (!Number.isInteger(x)) {
    throw new Error(
        `Expected ${name} to be an integer, but received ${x}`);
  }
  if (!(x > 0)) {
    throw new Error(
        `Expected ${name} to be a positive number, but received ${x}`);
  }
}//»

function getRandomAction() {//«
  return getRandomInteger(0, NUM_ACTIONS);
}
//»
//Logging«

const LOGDBG=-1;
const LOGINF=0;
const LOGWRN=1;
const LOGERR=2;
const LOGSPC=3;
const LOGNIL=Infinity;
//const LOGLEVEL = LOGDBG;
//const LOGLEVEL = LOGSPC;
const LOGLEVEL = LOGINF;
//const LOGLEVEL = LOGNIL;

const all_logs=[];

const dolog = (which, ...arg) => {
//log(...arg);
	if (typeof which === "string") throw new Error("Do not call me directly!");
	if (which < LOGLEVEL) return;
//	console.log(...arg)
//	all_logs.push(...arg);
let d = make('div');
d.innerHTML = arg;
pre.appendChild(d);
//log(...arg);
};
const logd=(...arg)=>{
	dolog(LOGDBG, ...arg);
};
const logi=(...arg)=>{
	dolog(LOGINF, ...arg);
};
const loge=(...arg)=>{
	dolog(LOGERR, ...arg);
};
const logw=(...arg)=>{
	dolog(LOGWRN, ...arg);
};
const logs=(...arg)=>{
	dolog(LOGSPC, ...arg);
};

//»

//»
//DQN«

//PokerAgent«


class PokerAgent {
  /**«
   * Constructor of PokerAgent.
   *
   * @param {SnakeGame} game A game object.
   * @param {object} config The configuration object with the following keys:
   *   - `replayBufferSize` {number} Size of the replay memory. Must be a
   *     positive integer.
   *   - `epsilonInit` {number} Initial value of epsilon (for the epsilon-
   *     greedy algorithm). Must be >= 0 and <= 1.
   *   - `epsilonFinal` {number} The final value of epsilon. Must be >= 0 and
   *     <= 1.
   *   - `epsilonDecayFrames` {number} The # of frames over which the value of
   *     `epsilon` decreases from `episloInit` to `epsilonFinal`, via a linear
   *     schedule.
   *   - `learningRate` {number} The learning rate to use during training.
»   */
  constructor(game, config) {
    assertPositiveInteger(config.epsilonDecayFrames);

    this.game = game;

    this.epsilonInit = config.epsilonInit;
    this.epsilonFinal = config.epsilonFinal;
    this.epsilonDecayFrames = config.epsilonDecayFrames;
    this.epsilonIncrement_ = (this.epsilonFinal - this.epsilonInit) /
        this.epsilonDecayFrames;

/*MKDLOPIYTGH
    this.onlineNetwork = createDeepQNetwork(NUM_ACTIONS);
    this.targetNetwork = createDeepQNetwork(NUM_ACTIONS);
    // Freeze taget network: it's weights are updated only through copying from
    // the online network.
    this.targetNetwork.trainable = false;
    this.optimizer = tf.train.adam(config.learningRate);
*/


    this.replayBufferSize = config.replayBufferSize;
    this.replayMemory = new ReplayMemory(config.replayBufferSize);
    this.frameCount = 0;
    this.reset();
  }

  reset() {
    this.cumulativeReward_ = 0;
//    this.fruitsEaten_ = 0;
    this.game.reset();
  }

  /**
   * Play one step of the game.
   *
   * @returns {number | null} If this step leads to the end of the game,
   *   the total reward from the game as a plain number. Else, `null`.
   */
  async playStep() {
    this.epsilon = this.frameCount >= this.epsilonDecayFrames ? this.epsilonFinal :
        this.epsilonInit + this.epsilonIncrement_  * this.frameCount;
    this.frameCount++;
    let action;
    const state = this.game.getState();
    action = getRandomAction();

/*EUIKMJHYURPO
    if (Math.random() < this.epsilon) {//WMKMJUIOPBN
      action = getRandomAction();
    } else {
      tf.tidy(() => {// pick an action based on online DQN output.
        const stateTensor = getStateTensor(state);
        action = ALL_ACTIONS[this.onlineNetwork.predict(stateTensor).argMax(-1).dataSync()[0]];
      });
    }
*/
    const {state: nextState, reward, done} = await this.game.step(action);
    this.replayMemory.append([state, action, reward, done, nextState]);
    this.cumulativeReward_ += reward;
    const output={action, cumulativeReward: this.cumulativeReward_, done};
    if (done) this.reset();
    return output;
  }

  /**
   * Perform training on a randomly sampled batch from the replay buffer.
   *
   * @param {number} batchSize Batch size.
   * @param {number} gamma Reward discount rate. Must be >= 0 and <= 1.
   * @param {tf.train.Optimizer} optimizer The optimizer object used to update
   *   the weights of the online network.
   */
  trainOnReplayBatch(batchSize, gamma, optimizer) {
    // Get a batch of examples from the replay buffer.
    const batch = this.replayMemory.sample(batchSize);
    const lossFunction = () => tf.tidy(() => {
      const stateTensor = getStateTensor(
          batch.map(example => example[0]));
      const actionTensor = tf.tensor1d(
          batch.map(example => example[1]), 'int32');
      const qs = this.onlineNetwork.apply(stateTensor, {training: true})
          .mul(tf.oneHot(actionTensor, NUM_ACTIONS)).sum(-1);

      const rewardTensor = tf.tensor1d(batch.map(example => example[2]));
      const nextStateTensor = getStateTensor(
          batch.map(example => example[4]));
      const nextMaxQTensor =
          this.targetNetwork.predict(nextStateTensor).max(-1);
      const doneMask = tf.scalar(1).sub(
          tf.tensor1d(batch.map(example => example[3])).asType('float32'));
      const targetQs =
          rewardTensor.add(nextMaxQTensor.mul(doneMask).mul(gamma));
      return tf.losses.meanSquaredError(targetQs, qs);
    });

    // Calculate the gradients of the loss function with repsect to the weights
    // of the online DQN.
    const grads = tf.variableGrads(lossFunction);
    // Use the gradients to update the online DQN's weights.
    optimizer.applyGradients(grads.grads);
    tf.dispose(grads);
    // TODO(cais): Return the loss value here?
  }
}


//»

//dqn«

const getStateTensor = (state) => {//«
//const getStateTensor=(state, h, w)=>{
//OLD Snake: Get the current state of the game as an image tensor.//«
//@param {object | object[]} state The state object as returned by
//  `SnakeGame.getState()`, consisting of two keys: `s` for the snake and
//  `f` for the fruit(s). Can also be an array of such state objects.
//@param {number} h Height.
//@param {number} w With.
//@return {tf.Tensor} A tensor of shape [numExamples, height, width, 2] and
//  dtype 'float32'
//  - The first channel uses 0-1-2 values to mark the snake.
//    - 0 means an empty square.
//    - 1 means the body of the snake.
//    - 2 means the head of the snake.
//  - The second channel uses 0-1 values to mark the fruits.
//  - `numExamples` is 1 if `state` argument is a single object or an
//    array of a single object. Otherwise, it will be equal to the length
//    of the state-object array.//»
  if (!Array.isArray(state)) {
    state = [state];
  }
  const numExamples = state.length;
// TODO(cais): Maintain only a single buffer for efficiency.
//  const buffer = tf.buffer([numExamples, h, w, 2]);
  const buffer = tf.buffer([numExamples, 54, 1]);

  for (let n = 0; n < numExamples; ++n) {
    if (state[n] == null) continue;
	buffer.set(state.shift(), n, 0, 0);//Position first
	buffer.set(state.shift(), n, 1, 0);//Bet next
//The card numbers are the only thing left in the state
	for (let c of state){
		buffer.set(1,	//Boolean flag
				n,		//Example number
				c+2,	//Card number (0-51)
				0		//Only 1 "layer" in this "image"
			);
	}
/*Old snake«
    // Mark the snake.
    state[n].s.forEach((yx, i) => {
      buffer.set(i === 0 ? 2 : 1, n, yx[0], yx[1], 0);
    });

    // Mark the fruit(s).
    state[n].f.forEach(yx => {
      buffer.set(1, n, yx[0], yx[1], 1);
    });
»*/
  }
  return buffer.toTensor();
}//»
const createDeepQNetwork=(numActions)=>{//«
//function createDeepQNetwork(h, w, numActions) {
/*«
  if (!(Number.isInteger(h) && h > 0)) {
    throw new Error(`Expected height to be a positive integer, but got ${h}`);
  }
  if (!(Number.isInteger(w) && w > 0)) {
    throw new Error(`Expected width to be a positive integer, but got ${w}`);
  }
  if (!(Number.isInteger(numActions) && numActions > 1)) {
    throw new Error(
        `Expected numActions to be a integer greater than 1, ` +
        `but got ${numActions}`);
  }
»*/

//MKWMKJYUTVBS

  const model = tf.sequential();
  model.add(tf.layers.conv1d({
    filters: 128,
    kernelSize: 3,
    strides: 1,
    activation: 'relu',
//  inputShape: [h, w, 2]
//  inputShape: [1, 54, 1]
    inputShape: [54, 1]
//  inputShape: [54, 1, 1]
  }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.conv1d({
    filters: 256,
    kernelSize: 3,
    strides: 1,
    activation: 'relu'
  }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.conv1d({
    filters: 256,
    kernelSize: 3,
    strides: 1,
    activation: 'relu'
  }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({units: 100, activation: 'relu'}));
  model.add(tf.layers.dropout({rate: 0.25}));
  model.add(tf.layers.dense({units: numActions}));
  return model;
}//»
const copyWeights=(destNetwork, srcNetwork)=>{//«
/**
 * Copy the weights from a source deep-Q network to another.
 *
 * @param {tf.LayersModel} destNetwork The destination network of weight
 *   copying.
 * @param {tf.LayersModel} srcNetwork The source network for weight copying.
 */
  // https://github.com/tensorflow/tfjs/issues/1807:
  // Weight orders are inconsistent when the trainable attribute doesn't
  // match between two `LayersModel`s. The following is a workaround.
  // TODO(cais): Remove the workaround once the underlying issue is fixed.
  let originalDestNetworkTrainable;
  if (destNetwork.trainable !== srcNetwork.trainable) {
    originalDestNetworkTrainable = destNetwork.trainable;
    destNetwork.trainable = srcNetwork.trainable;
  }

  destNetwork.setWeights(srcNetwork.getWeights());

  // Weight orders are inconsistent when the trainable attribute doesn't
  // match between two `LayersModel`s. The following is a workaround.
  // TODO(cais): Remove the workaround once the underlying issue is fixed.
  // `originalDestNetworkTrainable` is null if and only if the `trainable`
  // properties of the two LayersModel instances are the same to begin
  // with, in which case nothing needs to be done below.
  if (originalDestNetworkTrainable != null) {
    destNetwork.trainable = originalDestNetworkTrainable;
  }
}//»

//»
//Replay«


/** Replay buffer for DQN training. */
class ReplayMemory {
  /**
   * Constructor of ReplayMemory.
   *
   * @param {number} maxLen Maximal buffer length.
   */
  constructor(maxLen) {
    this.maxLen = maxLen;
    this.buffer = [];
    for (let i = 0; i < maxLen; ++i) {
      this.buffer.push(null);
    }
    this.index = 0;
    this.length = 0;

    this.bufferIndices_ = [];
    for (let i = 0; i < maxLen; ++i) {
      this.bufferIndices_.push(i);
    }
  }

  /**
   * Append an item to the replay buffer.
   *
   * @param {any} item The item to append.
   */
  append(item) {
    this.buffer[this.index] = item;
    this.length = Math.min(this.length + 1, this.maxLen);
    this.index = (this.index + 1) % this.maxLen;
  }

  /**
   * Randomly sample a batch of items from the replay buffer.
   *
   * The sampling is done *without* replacement.
   *
   * @param {number} batchSize Size of the batch.
   * @return {Array<any>} Sampled items.
   */
  sample(batchSize) {
    if (batchSize > this.maxLen) {
      throw new Error(
          `batchSize (${batchSize}) exceeds buffer length (${this.maxLen})`);
    }
    tf.util.shuffle(this.bufferIndices_);

    const out = [];
    for (let i = 0; i < batchSize; ++i) {
      out.push(this.buffer[this.bufferIndices_[i]]);
    }
    return out;
  }
}
//»
//Train«

class MovingAverager {//«
  constructor(bufferLength) {
    this.buffer = [];
    for (let i = 0; i < bufferLength; ++i) {
      this.buffer.push(null);
    }
  }

  append(x) {
    this.buffer.shift();
    this.buffer.push(x);
  }

  average() {
    return this.buffer.reduce((x, prev) => x + prev) / this.buffer.length;
  }
}//»
async function train(//«
    agent, batchSize, gamma, learningRate, cumulativeRewardThreshold,
    maxNumFrames, syncEveryFrames, savePath, logDir) {

/*«
 * Train an agent to play the snake game.
 *
 * @param {PokerAgent} agent The agent to train.
 * @param {number} batchSize Batch size for training.
 * @param {number} gamma Reward discount rate. Must be a number >= 0 and <= 1.
 * @param {number} learnigRate
 * @param {number} cumulativeRewardThreshold The threshold of moving-averaged
 *   cumulative reward from a single game. The training stops as soon as this
 *   threshold is achieved.
 * @param {number} maxNumFrames Maximum number of frames to train for.
 * @param {number} syncEveryFrames The frequency at which the weights are copied
 *   from the online DQN of the agent to the target DQN, in number of frames.
 * @param {string} savePath Path to which the online DQN of the agent will be
 *   saved upon the completion of the training.
 * @param {string} logDir Directory to which TensorBoard logs will be written
 *   during the training. Optional.
» */

  for (let i = 0; i < agent.replayBufferSize; ++i) {
//	if (!(i%200)) log(`${i} < ${agent.replayBufferSize}`);
	log(`${i} < ${agent.replayBufferSize}`);
    await agent.playStep();
	await sleep();
  }

  // Moving averager: cumulative reward across 100 most recent 100 episodes.
  const rewardAverager100 = new MovingAverager(100);
  const optimizer = tf.train.adam(learningRate);
  let tPrev = new Date().getTime();
  let frameCountPrev = agent.frameCount;
  let averageReward100Best = -Infinity;
  while (true) {
	await sleep();
    agent.trainOnReplayBatch(batchSize, gamma, optimizer);
    const {cumulativeReward, done} = await agent.playStep();
    if (done) {
      const t = new Date().getTime();
      const framesPerSecond =
          (agent.frameCount - frameCountPrev) / (t - tPrev) * 1e3;
      tPrev = t;
      frameCountPrev = agent.frameCount;

      rewardAverager100.append(cumulativeReward);
      const averageReward100 = rewardAverager100.average();
      console.log(
          `Frame #${agent.frameCount}: ` +
          `cumulativeReward100=${averageReward100.toFixed(1)}; ` +
          `(epsilon=${agent.epsilon.toFixed(3)}) ` +
          `(${framesPerSecond.toFixed(1)} frames/s)`);

      if (averageReward100 >= cumulativeRewardThreshold ||
          agent.frameCount >= maxNumFrames) {
cwarn("DONE AND SAVE!");
//log(agent.onlineNetwork.save);
        // TODO(cais): Save online network.
        break;
      }
      if (averageReward100 > averageReward100Best) {
        averageReward100Best = averageReward100;
cwarn("SAVE");
//log(agent.onlineNetwork.save);
/*
        if (savePath != null) {
          if (!fs.existsSync(savePath)) {
            mkdir('-p', savePath);
          }
          await agent.onlineNetwork.save(`file://${savePath}`);
          console.log(`Saved DQN to ${savePath}`);
        }
*/
      }
    }
    if (agent.frameCount % syncEveryFrames === 0) {
      copyWeights(agent.targetNetwork, agent.onlineNetwork);
      console.log('Sync\'ed weights from online network to target network');
    }
  }
}//»

//»

//»

//Poker«

//Util«

const log_bet = (player) => {//«
	let name = player.name;
	if (name===HERO) name=`*${name}*`;
	let bet = player.total_bet_in_round;
	let if_chips = player.chips;
//	let _last_bet = last_bet === null ? 0 : last_bet;
	let _last_bet;
	if (last_bettor) _last_bet = last_bettor.total_bet_in_round;
	else _last_bet = 0;
	let all_in="";
	if (!if_chips) all_in=" [all-in]";
	if (!_last_bet){
		if (!bet) logi(`${cur_pos+1}) ${name}: Check `);
		else {
			logi(`${cur_pos+1}) ${name}: Bet ${bet}${all_in}`);
		}
		return;
	}
	if (bet > _last_bet) {
		logi(`${cur_pos+1}) ${name}: Raise ${bet}${all_in}`);
	}
	else logi(`${cur_pos+1}) ${name}: Call${all_in}`);
	
}//»
const get_hand_str=hand=>{//«
const h1 = hand[0];
const h2 = hand[1];

let r1 = Math.floor(h1/4);
let r2 = Math.floor(h2/4);
if (r1 > r2){
	let t = r1;
	r1 = r2;
	r2 = t;
}

const s1 = h1%4;
const s2 = h2%4;
const s = s1==s2?"s":"o";
let str = `${RANK_TO_CH[r2]}${RANK_TO_CH[r1]}${s}`;
//log(cards_to_str, );
//log(h1, h2, s1, s2, s1==s2, str, cards_to_str(hand));
return str;
};//»
const cards_to_str=(arr)=>{//«
	let s = '';
	if (TEXT_ONLY){
		for (let card of arr) s+=`${STR_DECK[card]} `;
	}
	else {
		for (let card of arr) s+=`<span class="card">${STR_DECK[card]}</span>`+"  ";
	}
	s = s.replace(/  $/,"");
	return s;
};//»

const get_showdown_reward=()=>{//«
	return hero.chips - hero.starting_chips;
};//»
const _showdown = async() =>{//«
	showdown();
	let reward = get_showdown_reward();
	await new_hand();
	return {state: game.getState(), reward, done: true};
};//»

//»

const PokerGame = function(){//«

this.step = game_step;
this.getState=()=>{//«
/*This is a compact representation of the game state which will be an array«
of 2,5,6 or 7 numbers for the cards and a position, and bet % of pot.
{
	cards: Int[2]|Int[5]|Int[6]|Int[7],
	pos: Int,
	bet: Float
}
Or, just a very simple array:

[pos, bet, ...cards]

This will be input into getStateTensor, which exapands the cards into 52

»*/

let num_to_last_bettor=0;
let pos = cur_pos;
//FFFFFFFFFFFFFF
let iter=0;
//cwarn("Find num to last bettor...");
while (true) {
	iter++;
	if (iter > 100){
		throw new Error("INFLOOP WUTWUTWUTWUT LORZZZZZZZ");
		return;
	}
	let player = players[pos];
	if (player == last_bettor){
		break;
	}
	if (player.folded || player.all_in) {
		pos++;
		if (pos == num_players) pos = 0;
		if (pos == cur_pos) {
			break;
		};
		continue;
	}
	pos++;
	if (pos == num_players) pos = 0;
	if (pos == cur_pos) {
		num_to_last_bettor--;
		break;
	};
	num_to_last_bettor++;
}

let use_bet;
let _last_bet = last_bet === null ? 0 : last_bet;

if (!pot) use_bet = 0;
else use_bet = _last_bet/pot;

//log(`pos: ${num_to_last_bettor}  bet: ${use_bet}  cards: `, table_cards);
let arr = [num_to_last_bettor, use_bet, ...table_cards];
//log(arr);
return arr;
//return [num_to_last_bettor, use_bet, ...table_cards];

};//»
this.reset=()=>{//«

//cwarn("reset");

};//»

};//»
const PokerPlayer = function(arg){//«

const {hand, name} = arg;

let hand_str = get_hand_str(hand);
let hole_per = hole_ranks[hand_str].per;
//log(name, hole_per);

const bet = amt => {//«
	if (amt > this.chips) return this.chips;
	return amt;
};//»
const call = () => {//«
//	let _last_bet = last_bet === null ? 0 : last_bet;
	let _last_bet;
	if (last_bettor) _last_bet = last_bettor.total_bet_in_round;
	else _last_bet = 0;
	if (_last_bet > this.chips) return this.chips;
	let diff = _last_bet - this.total_bet_in_round;
	if (diff < 0) return 0;
	return diff;
/*«
	if (this.last_bet !== null) {
		let diff = _last_bet - this.last_bet;
		if (diff < 0) return 0;
		return diff;
	}
	return _last_bet;
»*/
};//»
const raise = amt => {//«
//cwarn("RAISE");
	let tot = call()+amt;
	if (tot > this.chips) return this.chips;
	return tot;
};//»
const _act = (act)=>{//«
//	let _last_bet = last_bet === null ? 0 : last_bet;

	let _last_bet;
	if (last_bettor) _last_bet = last_bettor.total_bet_in_round;
	else _last_bet = 0;

	if (act === ACTION_FOLD) {
//If last_bet == 0, this is a game theoretically senseless move
		if (!_last_bet) return 0;
		return FOLD_ACTION;
	}
	if (act === ACTION_CALL) {
//If last_bet == 0, this is a check
		return call();
	}
	if (_last_bet) return raise(_last_bet);
	return bet(BET_AMOUNT);
};//»
this._act = _act;

this.act=()=>{//«

//CCCCCCC
if (round_num === PREFLOP_ROUND) {
	if (hole_per > 0.775) return _act(ACTION_RAISE);
	if (hole_per > 0.54) return _act(ACTION_CALL);
	return _act(ACTION_FOLD);
}
if (round_num === FLOP_ROUND){
	let score = evaluate(hand.concat(table_cards)).score;
	//SCORE_PR_8
	if (score < SCORE_PR_8) return _act(ACTION_FOLD);
	if (score < SCORE_PR_A) return _act(ACTION_CALL);
	return _act(ACTION_RAISE);
}
else if (round_num === TURN_ROUND){
	let score = evaluate_all_turn(hand.concat(table_cards)).score;
	//SCORE_PR_A
	if (score < SCORE_PR_A) return _act(ACTION_FOLD);
	if (score < SCORE_PR_8_7) return _act(ACTION_CALL);
	return _act(ACTION_RAISE);
}
else{
	let score = evaluate_all_river(hand.concat(table_cards)).score;
	if (score < SCORE_PR_8_7) return _act(ACTION_FOLD);
	if (score < SCORE_TRP_2) return _act(ACTION_CALL);
	return _act(ACTION_RAISE);
}

//	let act = getRandomAction();
//	return _act(act);

};//»

//Properties«

this.hand = hand;
this.chips = STARTING_CHIPS;
this.starting_chips = STARTING_CHIPS;
this.result = null;
this.folded = false;
this.all_in = false;
this.name = name;
this.total_bet = 0;
this.last_bet = null;
this.total_bet_in_round = 0;

//»

};//»

const evaluate = (hand, opts={}) => {//«
let {ifScore} = opts;

const dups=[0,0,0,0,0,0,0,0,0,0,0,0,0];
const c1 = hand[0];
const suit1 = c1%4;//first suit
let handlen = hand.length;
let r1 = Math.floor(c1/4);//first rank
dups[r1]=1;

let r2,r3,r4,r5;//«
let hi = r1;
let lo = r1;

let is_pair;
let is_trips;
let is_quads;
let is_2pair;
let pair_rank1;
let pair_rank2;
let trips_rank;
let quad_rank;
let c2,c3,c4,c5;
let hand_len = hand.length;
let is_flush;
if (hand_len < 5) is_flush = false;
else is_flush = true;
//»
for (let i=1; i < hand_len; i++) {//«
	let num = hand[i];
	if (is_flush&&Math.floor(num%4)!==suit1)is_flush=false;
	const r = Math.floor(num/4);
	switch (i){//Unsorted ranks«
		case 1:{r2=r;c2=num;break;}
		case 2:{r3=r;c3=num;break;}
		case 3:{r4=r;c4=num;break;}
		case 4:{r5=r;c5=num;break;}
	}//»
/*Uncomment this for inline sorting of the ranks«
	let t;
	switch (ncards){
		case 2:{
			if (r<r1){r2=r1;r1=r;}
			else r2=r;
			break;
		}
		case 3:{
			if (r<r2){
				r3=r2;r2=r;
				if (r2<r1){t=r2;r2=r1;r1=t;}
			}
			else r3=r;
			break;
		}
		case 4:{
			if (r<r3){
				r4=r3;r3=r;
				if (r3<r2){
					t=r3;r3=r2;r2=t;
					if (r2<r1){t=r2;r2=r1;r1=t;}
				}
			}
			else r4=r;
			break;
		}
		case 5:{
			if (r<r4){
				r5=r4;r4=r;
				if (r4<r3){
					t=r4;r4=r3;r3=t;
					if (r3<r2){
						t=r3;r3=r2;r2=t;
						if (r2<r1){t=r2;r2=r1;r1=t;}
					}
				}
			}
			else r5=r;
			break;
		}
	}
»*/
	dups[r]+=1;
	const ndup = dups[r];
	if (ndup == 1) {//«
		if (r > hi) hi = r;
		else if (r < lo) lo = r;
	}
	else if (ndup == 2) {
		if (is_pair) {
			is_2pair = true;
			pair_rank2 = r;
		}
		else{
			pair_rank1 = r;
		}
		is_pair = true;
	}
	else if (ndup == 3) {
		is_trips = true;
		trips_rank = r;
	}
	else if (ndup == 4) {
		is_quads = true;
		quad_rank = r;
	}//»
}//»

const diff = hi-lo;
let is_straight = !is_pair && handlen == 5 && diff == 4;
const is_fullhouse = is_2pair && is_trips;
let hand_rank;
let hand_class;
let str_hand;
let left = [];

if (is_pair){//«

	if (is_trips){//«

		if (is_quads){//«

			hand_class = QUAD;
			hand_rank = 1<<29;
			hand_rank |= quad_rank << 20;
			if (!ifScore) {
				if (r1!=quad_rank) left.push(r1);
				if (r2!=quad_rank) left.push(r2);
				if (r3!=quad_rank) left.push(r3);
				if (r4!=quad_rank) left.push(r4);
				if (r5!=quad_rank) left.push(r5);
				str_hand=`Quad ${RANK[quad_rank]}s`;
			}

		}//»
		else if (is_fullhouse){//«

			hand_class = FULL;
			hand_rank = 1<<28;
			hand_rank |= trips_rank << 20;
			str_hand=`${RANK[trips_rank]}s over`;
			if (pair_rank1 === trips_rank){
				hand_rank |= pair_rank2 << 16;
				str_hand+=` ${RANK[pair_rank2]}s`;
			}
			else{
				hand_rank |= pair_rank1 << 16;
				str_hand+=` ${RANK[pair_rank1]}s`;
			}

		}//»
		else{//trips«

			hand_class = TRIP;
			hand_rank = 1<<25;
			hand_rank |= trips_rank << 20;

			if (!ifScore) {
				if (r1!=trips_rank) left.push(r1);
				if (r2!=trips_rank) left.push(r2);
				if (r3!=trips_rank) left.push(r3);
				if (r4!=trips_rank) left.push(r4);
				if (r5!=trips_rank) left.push(r5);
				str_hand=`Trip ${RANK[trips_rank]}s`;
			}

		}//»

	}//»
	else if (is_2pair){//«

		hand_class = TWOPR;
		hand_rank = 1<<24;
		if (pair_rank1 > pair_rank2){
			hand_rank |= pair_rank1 << 20;
			hand_rank |= pair_rank2 << 16;
			str_hand=`${RANK[pair_rank1]}s and ${RANK[pair_rank2]}s`;
		}
		else{
			hand_rank |= pair_rank2 << 20;
			hand_rank |= pair_rank1 << 16;
			str_hand=`${RANK[pair_rank2]}s and ${RANK[pair_rank1]}s`;
		}
		if (!ifScore) {
			if (!(r1==pair_rank1||r1==pair_rank2)) left.push(r1);
			if (!(r2==pair_rank1||r2==pair_rank2)) left.push(r2);
			if (!(r3==pair_rank1||r3==pair_rank2)) left.push(r3);
			if (!(r4==pair_rank1||r4==pair_rank2)) left.push(r4);
			if (!(r5==pair_rank1||r5==pair_rank2)) left.push(r5);
		}

	}//»
	else{//just a pair//«

		hand_class = PAIR;
		hand_rank = 1<<23;
		hand_rank |= pair_rank1 << 16;
		if (!ifScore) {
			if (r1!=pair_rank1) left.push(r1);
			if (r2!=pair_rank1) left.push(r2);
			if (r3!=pair_rank1) left.push(r3);
			if (r4!=pair_rank1) left.push(r4);
			if (r5!=pair_rank1) left.push(r5);
			str_hand=`${RANK[pair_rank1]}s`;
		}
	}//»

}//»
else if (is_straight){//Straight/Straight-flush«

	if (is_flush){

		hand_class = STRFL;
		hand_rank = 1<<30;
		hand_rank |= hi << 16;
		str_hand = `${str_hand} flush`;
		str_hand=`${RANK[hi]} high straight flush`;

	}
	else{

		hand_class = STRAIT;
		hand_rank = 1<<26;
		hand_rank |= hi << 16;
		str_hand=`${RANK[hi]} high straight`;

	}
}//»
else{//5-high Straight (Straight-Flush) and hi card only«

if (handlen == 5 && diff==12){//«
if ((r1==hi&&r2==lo)||(r1==lo&&r2==hi)){
if (!(r3>3||r4>3||r5>3)) is_straight=true;
}
else if ((r1==hi&&r3==lo)||(r1==lo&&r3==hi)){
if (!(r2>3||r4>3||r5>3)) is_straight=true;
}
else if ((r1==hi&&r4==lo)||(r1==lo&&r4==hi)){
if (!(r3>3||r2>3||r5>3)) is_straight=true;
}
else if ((r1==hi&&r5==lo)||(r1==lo&&r5==hi)){
if (!(r3>3||r4>3||r2>3)) is_straight=true;
}
else if ((r2==hi&&r3==lo)||(r2==lo&&r3==hi)){
if (!(r1>3||r4>3||r5>3)) is_straight=true;
}
else if ((r2==hi&&r4==lo)||(r2==lo&&r4==hi)){
if (!(r3>3||r1>3||r5>3)) is_straight=true;
}
else if ((r2==hi&&r5==lo)||(r2==lo&&r5==hi)){
if (!(r3>3||r4>3||r1>3)) is_straight=true;
}
else if ((r3==hi&&r4==lo)||(r3==lo&&r4==hi)){
if (!(r1>3||r2>3||r5>3)) is_straight=true;
}
else if ((r3==hi&&r5==lo)||(r3==lo&&r5==hi)){
if (!(r1>3||r4>3||r2>3)) is_straight=true;
}
else if ((r4==hi&&r5==lo)||(r4==lo&&r5==hi)){
if (!(r1>3||r2>3||r3>3)) is_straight=true;
}
}//»

	if (is_flush) {//«
		if (is_straight) {

			hand_class = STRFL;
			hand_rank = 1<<30;
			hand_rank |= 3<<16;//The 5 is the high card
			str_hand=`Five high straight flush`;

		}
		else {

			hand_class = FLUSH;
			hand_rank = 1<<27;
			hand_rank |= hi << 16;
			if (!ifScore) {
				if (r1!=hi) left.push(r1);
				if (r2!=hi) left.push(r2);
				if (r3!=hi) left.push(r3);
				if (r4!=hi) left.push(r4);
				if (r5!=hi) left.push(r5);
				str_hand=`${RANK[hi]} high flush`;
			}

		}
	}//»
	else if (is_straight){//«

		hand_class = STRAIT;
		hand_rank = 1<<26;
		hand_rank |= 3<<16;//The 5 is the high card
		str_hand=`Five high straight`;

	}//»
	else {//«

		hand_class = HIGH;
		hand_rank = 1<<22;
		hand_rank |= hi << 16;

		if (!ifScore) {
			if (r1!=hi) left.push(r1);
			if (r2!=hi) left.push(r2);
			if (r3!=hi) left.push(r3);
			if (r4!=hi) left.push(r4);
			if (r5!=hi) left.push(r5);
			str_hand=`${RANK[hi]} high`;
		}

	}//»

}//»

return {
	left,
	class: hand_class,
	score: hand_rank,
	text: str_hand,
};

}//»
const evaluate_all_river = (a) => {//«
//We always have 7 cards here
//Using both hole cards
let h1=evaluate([a[0],a[1],a[4],a[5],a[6]]),//12 --567
h2=evaluate([a[0],a[1],a[3],a[5],a[6]]),//12 -4-67
h3=evaluate([a[0],a[1],a[3],a[4],a[6]]),//12 -45-7
h4=evaluate([a[0],a[1],a[3],a[4],a[5]]),//12 -456-
h5=evaluate([a[0],a[1],a[2],a[5],a[6]]),//12 3--67
h6=evaluate([a[0],a[1],a[2],a[4],a[6]]),//12 3-5-7
h7=evaluate([a[0],a[1],a[2],a[4],a[5]]),//12 3-56-
h8=evaluate([a[0],a[1],a[2],a[3],a[6]]),//12 34--7
h9=evaluate([a[0],a[1],a[2],a[3],a[5]]),//12 34-6-
h10=evaluate([a[0],a[1],a[2],a[3],a[4]]),//12 345--

//Using 1 hole card
h11=evaluate([a[1],a[3],a[4],a[5],a[6]]),//-2 -4567
h12=evaluate([a[1],a[2],a[4],a[5],a[6]]),//-2 3-567
h13=evaluate([a[1],a[2],a[3],a[5],a[6]]),//-2 34-67
h14=evaluate([a[1],a[2],a[3],a[4],a[6]]),//-2 345-7
h15=evaluate([a[1],a[2],a[3],a[4],a[5]]),//-2 3456-
h16=evaluate([a[0],a[3],a[4],a[5],a[6]]),//1- -4567
h17=evaluate([a[0],a[2],a[4],a[5],a[6]]),//1- 3-567
h18=evaluate([a[0],a[2],a[3],a[5],a[6]]),//1- 34-67
h19=evaluate([a[0],a[2],a[3],a[4],a[6]]),//1- 345-7
h20=evaluate([a[0],a[2],a[3],a[4],a[5]]),//1- 3456-

//Using 0 hole cards
h21=evaluate([a[2],a[3],a[4],a[5],a[6]]);//-- 34567

let all = [h1,h2,h3,h4,h5,h6,h7,h8,h9,h10,h11,h12,h13,h14,h15,h16,h17,h18,h19,h20,h21];
//logi(all);
all = all.sort((a,b)=>{
	if (a.score > b.score) return -1;
	if (a.score < b.score) return 1;
	return 0;
});

return all[0];

};//»
const evaluate_all_turn = (a, opts={}) => {//«

//We always have 6 cards here
//Using both hole cards

let h1=evaluate([a[1],a[2],a[3],a[4],a[5]], opts),    //-23456
h2=evaluate([a[0],a[2],a[3],a[4],a[5]], opts),    //1-3456
h3=evaluate([a[0],a[1],a[3],a[4],a[5]], opts),    //12-456
h4=evaluate([a[0],a[1],a[2],a[4],a[5]], opts),    //123-56
h5=evaluate([a[0],a[1],a[2],a[3],a[5]], opts),    //1234-6
h6=evaluate([a[0],a[1],a[2],a[3],a[4]], opts);    //12345-

//Using 1 hole card

return ([h1,h2,h3,h4,h5,h6].sort((a,b)=>{
	if (a.score > b.score) return -1;
	if (a.score < b.score) return 1;
	return 0;
}))[0];

//return all[0];

};//»
const create_players = () => {//«
	deck = new Uint8Array(CARDS_PER_DECK);
	num_players = NAMES.length;
//	let hands = [];
	players = [];
	for (let i = 0; i < num_players; i++) {
		let card_num = 0;
		let hand = [];
		while (card_num < NUM_HOLE_CARDS) {
			const n = Math.floor(CARDS_PER_DECK*Math.random());
			if (deck[n]) continue;
			deck[n] = 1;
			hand[card_num] = n;
			card_num++;	
		}
		let nm = NAMES[i];
		let player = new PokerPlayer({name: nm, hand});
		if (nm===HERO) hero = player;
		players[i] = player;
	}
}//»
const showdown = () => {//«
//HHHHHHHHHHHHHHHHHHHHH

//Evaluate the hands«

let total_awarded = 0;
let pot_num=0;
let active_players=[];
let num_folded = 0;
let c = table_cards;

for (let i=0; i < players.length; i++){
	let player = players[i];
//Folded players are considered "active" because of their chip contribution to
//the main pot, but they are given a fake hand evaluation that cannot possibly
//beat anything in a showdown. The hypothetical case in which every player at
//this point has folded cannot logically exist.
	if (player.folded) {
		player.result = {score: -1};
		num_folded++;
	}
	else if (!player.result) {
//No one who pushes all-in before the river will have a result
		player.result = evaluate_all_river([player.hand[0], player.hand[1], c[0],c[1],c[2],c[3],c[4]]);
	}
	active_players.push(player);
}
//»
//Compare the hands and award the pot(s)«

{//Give back the difference to whoever has contributed more than anyone to the pot
	let sorted = active_players
	.filter(player=>{return !player.folded;})
	.sort((a,b)=>{
		if (a.total_bet > b.total_bet) return -1;
		if (a.total_bet < b.total_bet) return 1;
		return 0;
	});
	let p1 = sorted[0];
	let p2 = sorted[1];
	let diff = (p1.total_bet - p2.total_bet);
	if (diff){
		p1.total_bet -= diff;
		p1.chips += diff;
		pot -= diff;
logd(`${diff} chips have been returned to ${p1.name}`);
	}
}


while (active_players.length) {
//The first iteration of this loop is the main pot, followed by any side pots
//(side pots result from the players that are forced to go all-in upon calling
//because they could not cover the bet on the table)

let num_winners=0;
let low_bet = Infinity;//«
//YTSHJKFSMROS
let folded_bets = 0;
let num_folded_players = 0;
for (let player of active_players) {
	if (player.folded) {
		folded_bets+=player.total_bet;
		num_folded_players++;
	}
	else if (player.total_bet < low_bet) low_bet = player.total_bet;
}
let cur_total_bet = low_bet;
let cur_pot = folded_bets + cur_total_bet * (active_players.length - num_folded_players);
//»

logi(`*****   Showdown #${pot_num+1} between ${active_players.length-num_folded} players   *****`);
//Set this to zero after reporting on the first showdown
//This is just a cosmetic variable not internally _used_ for anything
num_folded = 0;
logi(`*****          The pot is ${cur_pot}           *****`);
for (let player of active_players){//«
	if (player.folded) continue;
//	logi(`${player.name}:  >>>  ${STR_DECK[player.hand[0]]}  ${STR_DECK[player.hand[1]]}  <<<  ${player.result.text}`);
if (TEXT_ONLY){
	logi(`${player.name}:  >>>  ${STR_DECK[player.hand[0]]}  ${STR_DECK[player.hand[1]]}  <<<  ${player.result.text}`);
}
else {
	logi(`${player.name}:  >>>  <span class="card">${STR_DECK[player.hand[0]]}</span>  <span class="card">${STR_DECK[player.hand[1]]}</span>  <<<  ${player.result.text}`);
}
}//»
let sorted = active_players.sort((a,b)=>{//«
	if (a.result.score > b.result.score) return -1;
	if (a.result.score < b.result.score) return 1;
	return 0;
});//»
let hi = sorted[0].result.score;//«
let winners = sorted.filter(player=>{
	return player.result.score == hi;
});
let losers = sorted.filter(player=>{
	return player.result.score < hi;
});

//»

//Test the kickers
if (winners.length > 1){//«
	let hi = 0;
	for (let winner of winners){
		let sorted = winner.result.left.sort((a,b)=>{
			if (a > b) return -1;
			if (a < b) return 1;
			return 0;
		});
		let s='';
		for (let num of sorted){
			if (num < 10) num='0'+num;
			s+=num;
		}
		let val = parseInt(s);
		if (val > hi) hi = val;
		winner.kicker_value = val;
	}
	if (hi) {
		let new_winners=[];
		for (let winner of winners){
			if (winner.kicker_value == hi) new_winners.push(winner);
			else losers.push(winner);
		}
		winners = new_winners;
	}
}//»

//Make the number of chips an integer
let chips_per_winner = Math.floor(cur_pot / winners.length);
//Any extra chips should get awarded to the game winner
extra_chips += cur_pot - (chips_per_winner * winners.length);

if (winners.length > 1){//«
	logd(`The pot will be split ${winners.length}-ways`);
}//»
for (let winner of winners){//«
	winner.chips += chips_per_winner;
	total_awarded += chips_per_winner;
}//»
let net_per_winner = chips_per_winner - cur_total_bet;//«
if (net_per_winner > 0) {
	for (let player of winners){
		num_winners++;
		logi(`${player.name}: +${net_per_winner}`);
	}
}//»

for (let player of losers){//«
	if (!player.folded) logi(`${player.name}: ${-cur_total_bet}`);
};//»
if (!num_winners){//«
	logi("No net winners");
}//»
for (let i=0; i < active_players.length; i++){//«
	let player = active_players[i];
	player.total_bet-=cur_total_bet;
	if (player.folded || player.total_bet < 1){
		active_players.splice(i, 1);
		i--;
	}
}
//»
if (active_players.length==1){//«
	active_players[0].chips += pot - total_awarded;
	active_players = [];
}//»

pot_num++;

}//»

};//»
const post_blinds = () => {//«

	let bb_pos = last_cur_pos - 1;
	if (bb_pos < 0) bb_pos = players_in_action - 1;
	let sb_pos = bb_pos - 1;
	if (sb_pos < 0)
	sb_pos = players_in_action - 1;

	let sb_player = players[sb_pos];
	sb_player.chips -= SMALL_BLIND;
	sb_player.last_bet = SMALL_BLIND;
	sb_player.total_bet_in_round = SMALL_BLIND;
	sb_player.total_bet = SMALL_BLIND;

	let bb_player = players[bb_pos];
	bb_player.chips -= BIG_BLIND;
	bb_player.last_bet = BIG_BLIND;
	bb_player.total_bet_in_round = BIG_BLIND;
	bb_player.total_bet = BIG_BLIND;

	pot = BIG_BLIND + SMALL_BLIND;
	last_bet = BIG_BLIND;
	last_bettor = bb_player;
	logi(`${sb_pos+1}) ${sb_player.name} posted ${SMALL_BLIND}`);
	logi(`${bb_pos+1}) ${bb_player.name} posted ${BIG_BLIND}`);

};//»
const new_hand = async () => {//«

	hand_num++;
	logi(`<hr>Hand number: ${hand_num}`);
	if (hand_num>1){
		await await_enter();
	}
	create_players();
	players_in_action = players.length;
	table_cards = [];
	num_table_cards = 0;
	round_num = 0;
	last_cur_pos++;
	if (last_cur_pos == players.length){
		last_cur_pos = 0;
	}
	cur_pos = last_cur_pos;
	post_blinds();
	logi(`>>>  Pre-flop  |  Pot: ${pot}  <<<`);
	await seek_to_hero(true);

};//»
const next = (no_advance) => {//«
	if (!no_advance) {
		cur_pos++;
		if (cur_pos == num_players) cur_pos = 0;
	}
	let player = players[cur_pos];
	if (player === last_bettor) return deal_cards();
	while (player.all_in || player.folded){
		cur_pos++;
		if (cur_pos == num_players) cur_pos = 0;
		player = players[cur_pos];
		if (player === last_bettor) return deal_cards();
	}
	return player;
};//»
const deal_cards = () => {//«

if (round_num === RIVER_ROUND) return _showdown();

round_num++;
//GGGGGGGGGGGG
last_bettor = null;
last_bet = null;
for (let player of players) {
	player.last_bet = null;
	player.total_bet_in_round = 0;
}
cur_pos = last_cur_pos;
let round_name = ROUNDS[round_num];
let cards_to_deal = CARDS_PER_ROUND[round_num];
for (let i=0; i < cards_to_deal;){//«
	const n = Math.floor(CARDS_PER_DECK*Math.random());
	if (deck[n]) continue;
	deck[n] = 1;
	table_cards[num_table_cards] = n;
	num_table_cards++;
	i++;
}//»
let table_cards_str = cards_to_str(table_cards);

logi(`>>>  ${round_name}  |  Pot: ${pot}  <<<`);
logi(`>>>  ${table_cards_str}  <<<`);

return next(true);

};//»
const play_rest_of_hand = async () =>{//«

//JJJJJJJJJJJJJJJ
/*This is called because our hero has gone all in, and we need to
return {state, reward, done: true}, based on this decision.
*/
let rv = await seek_to_hero();
let iter=0;
while (!(rv && rv.done === true)){
	iter++;
	if (iter > 100){
//cerr("INFLOOP DOOP ZLOOP!?!?!?!?");
throw new Error(`Infinite loop ${iter} > 100`);
		return;
	}
	rv = await seek_to_hero();
}
return rv;

};//»
const game_step = async(action) => {//«

	let cur_bet = hero._act(action);
	if (cur_bet == FOLD_ACTION){
		logi(`${cur_pos+1}) *${hero.name}*: Fold`);
		await new_hand();
		return {state: game.getState(), reward: 0, done: true};
	}

	pot += cur_bet;
	hero.last_bet = cur_bet;
	hero.total_bet_in_round += cur_bet;
	hero.total_bet += cur_bet;
	hero.chips -= cur_bet;

	if (!hero.chips) {
		hero.all_in = true;
		logi(`${cur_pos+1}) *${hero.name}*: ${cur_bet} [all-in]`);
		if (!last_bettor) {
			last_bettor = hero;
		}
		else if (hero.total_bet_in_round > last_bettor.total_bet_in_round){
			last_bettor = hero;
		}
		return play_rest_of_hand();
	}

	log_bet(hero);

	if (!last_bettor) {
		last_bettor = hero;
	}
	else if (hero.total_bet_in_round > last_bettor.total_bet_in_round){
		last_bettor = hero;
	}

	let rv = await seek_to_hero();
	if (rv && rv.done === true) return rv;
	if (cur_bet) return {state: game.getState(), reward: -cur_bet, done: false};
	return {state: game.getState(), reward: 0, done: false};

};//»
const seek_to_hero = async (if_no_adv) => {//«

	let cur_bet;
	let iter = 0;

	while (true) {
//INF_LOOP«
		iter++;
		if (iter > 10000){
cerr("INFLOOP?????????");
			break;
		}
//»

		let player = await next(if_no_adv);
		if (player.done === true) return player;
		if_no_adv = false;

		if (player === hero) return;
		cur_bet = player.act();

		if (cur_bet == FOLD_ACTION){//«
			logi(`${cur_pos+1}) ${player.name}: Fold`);
			player.folded = true;
			players_in_action--;
			if (players_in_action == 1){
				if (hero.folded){
					throw new Error("There are 1 players_in_action, but the hero has folded!?!?!");
					return;
				}
				await new_hand();
				return {state: game.getState(), reward: pot, done: true};
			}
			continue;
		}//»

		pot += cur_bet;
		player.last_bet = cur_bet;
		player.total_bet += cur_bet;
		player.total_bet_in_round += cur_bet;
		player.chips -= cur_bet;

		if (!player.chips) player.all_in = true;

		log_bet(player);

		if (!last_bettor) {
			last_bettor = player;
		}
		else if (player.total_bet_in_round > last_bettor.total_bet_in_round){
			last_bettor = player;
		}
	}

};//»

async function main() {//«

const args={//«
	replayBufferSize: 1e4,
	epsilonInit:0.5,
	epsilonFinal:0.01,
	epsilonDecayFrames:1e5,
	learningRate:1e-3,
	batchSize: 64,
	gamma: 0.99, 
	cumulativeRewardThreshold:100,
	maxNumFrames:1e6,
	syncEveryFrames:1e3,
	savePath: './models/dqn', 
	logDir:null
};//»

	game = new PokerGame();
	await new_hand();
	const agent = new PokerAgent(game, {
		replayBufferSize: args.replayBufferSize,
		epsilonInit: args.epsilonInit,
		epsilonFinal: args.epsilonFinal,
		epsilonDecayFrames: args.epsilonDecayFrames,
		learningRate: args.learningRate
	});


  await train(
      agent, args.batchSize, args.gamma, args.learningRate,
      args.cumulativeRewardThreshold, args.maxNumFrames,
      args.syncEveryFrames, args.savePath, args.logDir);


}//»

//»

//Obj/CB«

this.onappinit=async()=>{//«
//return;
let node = await ("/home/me/Desktop/ranks.json".toNode());
if (!node) return;
hole_ranks = JSON.parse(await node.text);
main();

};//»
this.onkeydown=(e,k)=>{//«

if (k==="ENTER_"){
	if (await_enter_cb){
		await_enter_cb();
		await_enter_cb=undefined;
	}
}

};//»

//»
//};«
}
//»








//Old«

/*Poker«
//Old Poker«

const play_hand = async() => {//«

//Var«

const table_cards = [];
let num_table_cards = 0;

let pot = 0;

let players_in_action = players.length;
let num_folded_players = 0;

//»

//Loop through the betting rounds«
ROUND_LOOP: for (let round=0; round < NUM_ROUNDS; round++){

//«

let cards_to_deal = CARDS_PER_ROUND[round];
let round_name = ROUNDS[round];
let num_in_betting = 0;

for (let i=0; i < cards_to_deal;){//«
	const n = Math.floor(CARDS_PER_DECK*Math.random());
	if (deck[n]) continue;
	deck[n] = 1;
	table_cards[num_table_cards]=n;
	num_table_cards++;
	i++;
}//»

let table_score=0;
if (table_cards.length){//«
//	get_straight_potential(table_cards);
	let table_cards_str = cards_to_str(table_cards);
	table_score = evaluate([...table_cards], {ifScore: true});
	logi(`>>>  ${round_name}  |  Pot: ${pot}  <<<`);
	logi(`>>>  ${table_cards_str}  <<<`);
}//»

for (let player of players){//«
	player.last_bet = null;
	if (player.folded||player.all_in) continue;
	num_in_betting++;		
}//»

if (num_in_betting < 2) continue;

let pos = start_position;
let cur_bet;
let last_bet = null;
let last_bettor;

//»

BET_LOOP: while(true){//«

let player = players[pos];

//Scan forward to see who is still in the betting action

if (player.folded || player.all_in) {//«

	let start_pos = pos;
	while (player.folded||player.all_in){//«
		pos++;
		if (pos == players.length) pos = 0;
		if (pos == start_pos) {
//AAAAAAAAAAAA Old play_hand
			break BET_LOOP;
		}
		player = players[pos];
	}//»

}//»

if (Number.isFinite(last_bet) && Number.isFinite(player.last_bet) && player.last_bet >= last_bet){//«
	break;
}//»

if (player == last_bettor) {
	break BET_LOOP;
}

//if (player.name==HERO) {
//cur_bet = parseInt(await popin("Amount?"));
//}

//else cur_bet = player.act(table_cards, table_score, pot, last_bet, round);

cur_bet = player.act(table_cards, table_score, pot, last_bet, round);


if (cur_bet > player.chips){//«
	loge(`Accountant: '${player.name}' attempted to bet more than their stack`);
	cur_bet = player.chips;
}//»
if (cur_bet < 0){//This is a folding action«

	if (cur_bet === FOLD_AND_SHOW_ACTION) {
//		if (player.total_bet) logi(`${player.name}: fold (-${player.total_bet}) and show >>>   ${STR_DECK[player.hand[0]]} | ${STR_DECK[player.hand[1]]}   <<<`);	
//		else logi(`${player.name}: fold and show >>>   ${STR_DECK[player.hand[0]]} | ${STR_DECK[player.hand[1]]}   <<<`);	
if (TEXT_ONLY){
	logi(`${player.name}: folds and shows >>>  ${STR_DECK[player.hand[0]]}  ${STR_DECK[player.hand[1]]}  <<<`);	
}
else {
	logi(`${player.name}: folds and shows >>>  <span class="card">${STR_DECK[player.hand[0]]}</span>  <span class="card">${STR_DECK[player.hand[1]]}</span>  <<<`);	
}

	}
	else {
//		if (player.total_bet) logi(`${player.name}: fold (-${player.total_bet})`);	
//		else logi(`${player.name}: fold`);	

		logi(`${player.name}: folds`);	

	}
	
	player.folded = true;
	players_in_action--;
	if (players_in_action==1){//«
		let have_diff = false;
		for (let player of players){
			if (player.folded) continue;
			let net = pot - player.total_bet;
			if (net){
				have_diff = true;
				logi(`${player.name}: +${net}`);
			}
			player.chips+=pot;
		}
		if (!have_diff){
//			logi("The hand is over");
		}
		return;
	}//»
	num_folded_players++;

}//»
else {//Check, bet, call or raise«

//let per = `${Math.round(100*cur_bet/player.chips)}%`;
//let pot_per;
//if (pot){
//	pot_per = `${Math.round(100*cur_bet/pot)}%`;
//}
//else pot_per="-";
pot += cur_bet;
player.last_bet = cur_bet;

player.chips -= cur_bet;
player.total_bet += cur_bet;

if (!player.chips) {//All-in«

	let verb;
	if (Number.isFinite(last_bet)&&last_bet > 0){
		if (cur_bet > last_bet) verb=`raises to`;
		else verb='calls';
	}
	else{
		verb = `bets`;
	}
	logi(`${player.name}: ${verb} ${cur_bet} (all-in)`);
//	logi(`${player.name}: ${verb}:  ${cur_bet}  100%  ${pot_per}`);
	player.all_in = true;

}//»
else {//«

	if  (!cur_bet) logi(`${player.name}: checks`);
	else if (last_bet){
//cur_bet can be less than last_bet because it is just equalizing what they had
//previously put in.
//		if  (cur_bet > last_bet)  logi(`${player.name}: raise:  ${cur_bet}  ${per}  ${pot_per}`);
//		else  logi(`${player.name}: call:  ${cur_bet}  ${per}  ${pot_per}`);
		if  (cur_bet > last_bet)  logi(`${player.name}: raises to ${cur_bet}`);
		else logi(`${player.name}: calls ${cur_bet}`);
	}
	else {
//		logi(`${player.name}: bet:  ${cur_bet}  ${per}  ${pot_per}`);
		logi(`${player.name}: bets ${cur_bet}`);
	}

}//»

}//»

if (!Number.isFinite(last_bet)&&cur_bet>=0){//«
	last_bet = cur_bet;
}
else if (cur_bet >= last_bet) {
	last_bet = cur_bet;
}//»

last_bettor = player;
pos++;
if (pos == players.length) pos = 0;

}//End BET_LOOP»

}//End ROUND_LOOP

if (!pot){
	logs(`After all betting there is no pot`);
	return;
}

//»

//Evaluate the hands«

let total_awarded = 0;
let pot_num=0;
let active_players=[];
let num_folded = 0;
let c = table_cards;

for (let i=0; i < players.length; i++){
	let player = players[i];
//Folded players are considered "active" because of their chip contribution to
//the main pot, but they are given a fake hand evaluation that cannot possibly
//beat anything in a showdown. The hypothetical case in which every player at
//this point has folded cannot logically exist.
	if (player.folded) {
		player.result = {score: -1};
		num_folded++;
	}
	else if (!player.result) {
//No one who pushes all-in before the river will have a result
		player.result = evaluate_all_river([player.hand[0], player.hand[1], c[0],c[1],c[2],c[3],c[4]]);
	}
	active_players.push(player);
}
//»
//Compare the hands and award the pot(s)«

{//Give back the difference to whoever has contributed more than anyone to the pot
	let sorted = active_players
	.filter(player=>{return !player.folded;})
	.sort((a,b)=>{
		if (a.total_bet > b.total_bet) return -1;
		if (a.total_bet < b.total_bet) return 1;
		return 0;
	});
	let p1 = sorted[0];
	let p2 = sorted[1];
	let diff = (p1.total_bet - p2.total_bet);
	if (diff){
		p1.total_bet -= diff;
		p1.chips += diff;
		pot -= diff;
logd(`${diff} chips have been returned to ${p1.name}`);
	}
}


while (active_players.length) {

//The first iteration of this loop is the main pot, followed by any side pots
//(side pots result from the players that are forced to go all-in upon calling
//because they could not cover the bet on the table)

let num_winners=0;
let low_bet = Infinity;//«
//YTSHJKFSMROS
let folded_bets = 0;
let num_folded_players = 0;
for (let player of active_players) {
	if (player.folded) {
		folded_bets+=player.total_bet;
		num_folded_players++;
	}
	else if (player.total_bet < low_bet) low_bet = player.total_bet;
}
let cur_total_bet = low_bet;
let cur_pot = folded_bets + cur_total_bet * (active_players.length - num_folded_players);
//»

logi(`*****   Showdown #${pot_num+1} between ${active_players.length-num_folded} players   *****`);
//Set this to zero after reporting on the first showdown
//This is just a cosmetic variable not internally _used_ for anything
num_folded = 0;
logi(`*****          The pot is ${cur_pot}           *****`);
for (let player of active_players){//«
	if (player.folded) continue;
//	logi(`${player.name}:  >>>  ${STR_DECK[player.hand[0]]}  ${STR_DECK[player.hand[1]]}  <<<  ${player.result.text}`);
if (TEXT_ONLY){
	logi(`${player.name}:  >>>  ${STR_DECK[player.hand[0]]}  ${STR_DECK[player.hand[1]]}  <<<  ${player.result.text}`);
}
else {
	logi(`${player.name}:  >>>  <span class="card">${STR_DECK[player.hand[0]]}</span>  <span class="card">${STR_DECK[player.hand[1]]}</span>  <<<  ${player.result.text}`);
}
}//»
let sorted = active_players.sort((a,b)=>{//«
	if (a.result.score > b.result.score) return -1;
	if (a.result.score < b.result.score) return 1;
	return 0;
});//»
let hi = sorted[0].result.score;//«
let winners = sorted.filter(player=>{
	return player.result.score == hi;
});
let losers = sorted.filter(player=>{
	return player.result.score < hi;
});

//»

//Test the kickers
if (winners.length > 1){//«
	let hi = 0;
	for (let winner of winners){
		let sorted = winner.result.left.sort((a,b)=>{
			if (a > b) return -1;
			if (a < b) return 1;
			return 0;
		});
		let s='';
		for (let num of sorted){
			if (num < 10) num='0'+num;
			s+=num;
		}
		let val = parseInt(s);
		if (val > hi) hi = val;
		winner.kicker_value = val;
	}
	if (hi) {
		let new_winners=[];
		for (let winner of winners){
			if (winner.kicker_value == hi) new_winners.push(winner);
			else losers.push(winner);
		}
		winners = new_winners;
	}
}//»

//Make the number of chips an integer
let chips_per_winner = Math.floor(cur_pot / winners.length);
//Any extra chips should get awarded to the game winner
extra_chips += cur_pot - (chips_per_winner * winners.length);

if (winners.length > 1){//«
	logd(`The pot will be split ${winners.length}-ways`);
}//»
for (let winner of winners){//«
	winner.chips += chips_per_winner;
	total_awarded += chips_per_winner;
}//»
let net_per_winner = chips_per_winner - cur_total_bet;//«
if (net_per_winner > 0) {
	for (let player of winners){
		num_winners++;
		logi(`${player.name}: +${net_per_winner}`);
	}
}//»

for (let player of losers){//«
	if (!player.folded) logi(`${player.name}: ${-cur_total_bet}`);
};//»
if (!num_winners){//«
	logi("No net winners");
}//»
for (let i=0; i < active_players.length; i++){//«
	let player = active_players[i];
	player.total_bet-=cur_total_bet;
	if (player.folded || player.total_bet < 1){
		active_players.splice(i, 1);
		i--;
	}
}
//»
if (active_players.length==1){//«
	active_players[0].chips += pot - total_awarded;
	active_players = [];
}//»

pot_num++;

}//»

}//»
const play_match = async() => {//«

//Var«
let num_hands_played = 0;
start_position = 0;
players = [];
//»

//Loop through each poker hand«

//A 'hand' is a unit of play that relates to a cycle of betting and ends either with
//1) All but one player folding
//2) 2 or more players going to one or more showdowns to determine the hand winner(s)
for (let i=0; i < MAX_NUM_HANDS; i++){

	num_hands_played++;
	logi("                                                       ");
	logi(`===================     Hand: ${i+1}     =================`);
	deck = new Uint8Array(CARDS_PER_DECK);
//Deal to the (possibly newly created) players«
	let hands = [];
	for (let j = 0; j < num_players; j++) {
		let card_num = 0;
		let hand = [];
		while (card_num < NUM_HOLE_CARDS) {
			const n = Math.floor(CARDS_PER_DECK*Math.random());
			if (deck[n]) continue;
			deck[n] = 1;
			hand[card_num] = n;
			card_num++;	
		}
		if (i==0){
			let player = new PokerPlayer({name: NAMES[j], hand});
			all_players[j] = player;
			players[j] = player;
		}
		else players[j].hand = hand;
		hands[j] = get_hand_str(hand);
	}//»
//Basic accounting of chips before playing«
	let tot_chips = 0;
	for (let i=0; i < players.length; i++){
		tot_chips += players[i].chips;
		let player = players[i];
		let nm = player.name;
		if (nm==HERO) logi(`${nm}: ${player.chips} ${cards_to_str(player.hand)}`);
		else logi(`${nm}: ${player.chips}`);
	}
	if (tot_chips+extra_chips!==TOTAL_STARTING_CHIPS){
		let diff = TOTAL_STARTING_CHIPS - tot_chips;
		if (diff) {
loge(`????????????     ACCOUNTING ERROR     ????????????`);
loge(`tot_chips(${tot_chips}) + extra_chips(${extra_chips}) !== TOTAL_STARTING_CHIPS(${TOTAL_STARTING_CHIPS})`);
			return;
		}
		else{
			logs(`Accountant: now removing ${extra_chips} extra chips from circulation`);
			extra_chips = 0;
		}
	}
//»
	logi("-----------------------------------------------------");
	await play_hand(players);

//Remove players with no chips and reset the player states«
	let new_players = [];
	for (let j=0; j < players.length; j++){//«
		let player = players[j];
		if (!player.chips) {
			continue;
		}
		player.folded = false;
		player.all_in = false;
		player.result = null;
		player.total_bet = 0;
		new_players.push(player);
	}//»
	players = new_players;
	num_players = players.length;
//»
//Break the match loop if everyone else is out«
	if (players.length == 1){
		break;
	}
	else if (players.length == 0){
		throw new Error("How can we have 0 players left?");
	}
//»
	start_position++;
	if (start_position >= players.length) start_position = 0;

}

//»

//Final tally«
logi("                                                      ");
logi(`!!!!!!!!!!!     Results after ${num_hands_played} hands     !!!!!!!!!!!`);
let num_left_with_chips = 0;
let last_player_with_chips;
for (let player of all_players){
	if (player.chips){
		last_player_with_chips = player;
		num_left_with_chips++;
	}
	logi(`${player.name}: ${player.chips}`);
}
if (num_left_with_chips == 1){
	logi(`${last_player_with_chips.name}: Game winner `);
	if (extra_chips){
		logi(`Accountant: ${last_player_with_chips.name} is awarded ${extra_chips} extra chips`);
		last_player_with_chips.chips+=extra_chips;
	}
}
else if (extra_chips){
	logi(`Accountant: there are ${extra_chips} extra chips`);
}
logi("                                                      ");

//»

}//»
const play_matches=async()=>{//«

//	logi(`Betting actions are recorded in this format:`);
//	logi(`[player]: [action]:  [number of chips]  [stack %]  [pot %]`);
for (let i=0; i < NUM_MATCHES; i++) {
	extra_chips = 0;
	num_players = NAMES.length;
	await play_match();
}

//pre.innerHTML = all_logs.join("\n");
//log(all_logs);

}//»

//»
»*/

/*«
//const POKER = {};
//if (!globals.poker) globals.poker = POKER;
//let HOLE_CARDS;
//globals.poker = POKER;
//const HOLE_CARDS = {};
//POKER.hole_cards = HOLE_CARDS;
let node = await ("/home/me/.data/poker/all-in_trials.json".toNode());
if (!node) return;
HOLE_CARDS = JSON.parse(await node.text);
POKER.hole_cards = HOLE_CARDS;
log(HOLE_CARDS);
»*/

/*«
	if (k=="SPACE_"){
if (!HOLE_CARDS){
cwarn("NOHOLECARDS!!!");
return;
}
		play_matches();
//let num_done = 0;
num_done+=NUM_MATCHES;
log(num_done);
	}
»*/
//»

/*«
	if (players[0].chips > players[1].chips){

		let h0 = hands[0];
		if (!HOLE_CARDS[h0]) HOLE_CARDS[h0]={w:0, l:0, t:0};
		HOLE_CARDS[h0].w++;

		let h1 = hands[1];
		if (!HOLE_CARDS[h1]) HOLE_CARDS[h1]={w:0, l:0, t:0};
		HOLE_CARDS[h1].l++;

	}
	else if (players[0].chips < players[1].chips){

		let h0 = hands[0];
		if (!HOLE_CARDS[h0]) HOLE_CARDS[h0]={w:0, l:0, t:0};
		HOLE_CARDS[h0].l++;

		let h1 = hands[1];
		if (!HOLE_CARDS[h1]) HOLE_CARDS[h1]={w:0, l:0, t:0};
		HOLE_CARDS[h1].w++;

	}
	else{

		let h0 = hands[0];
		if (!HOLE_CARDS[h0]) HOLE_CARDS[h0]={w:0, l:0, t:0};
		HOLE_CARDS[h0].t++;

		let h1 = hands[1];
		if (!HOLE_CARDS[h1]) HOLE_CARDS[h1]={w:0, l:0, t:0};
		HOLE_CARDS[h1].t++;

	}
»*/
