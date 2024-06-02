
importScripts("/mods/util/nn/tf.es2017.min.js");


const log=(...args)=>{console.log(...args);};
const cwarn=(...args)=>{console.warn(...args);};
const cerr=(...args)=>{console.error(...args);};


//SnakeGameAgent«


class SnakeGameAgent {
  /**
   * Constructor of SnakeGameAgent.
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
   */
  constructor(game, config) {
    assertPositiveInteger(config.epsilonDecayFrames);

    this.game = game;

    this.epsilonInit = config.epsilonInit;
    this.epsilonFinal = config.epsilonFinal;
    this.epsilonDecayFrames = config.epsilonDecayFrames;
    this.epsilonIncrement_ = (this.epsilonFinal - this.epsilonInit) /
        this.epsilonDecayFrames;

    this.onlineNetwork =
        createDeepQNetwork(game.height,  game.width, NUM_ACTIONS);
    this.targetNetwork =
        createDeepQNetwork(game.height,  game.width, NUM_ACTIONS);
    // Freeze taget network: it's weights are updated only through copying from
    // the online network.
    this.targetNetwork.trainable = false;

    this.optimizer = tf.train.adam(config.learningRate);

    this.replayBufferSize = config.replayBufferSize;
    this.replayMemory = new ReplayMemory(config.replayBufferSize);
    this.frameCount = 0;
    this.reset();
  }

  reset() {
    this.cumulativeReward_ = 0;
    this.fruitsEaten_ = 0;
    this.game.reset();
  }

  /**
   * Play one step of the game.
   *
   * @returns {number | null} If this step leads to the end of the game,
   *   the total reward from the game as a plain number. Else, `null`.
   */
  playStep() {
    this.epsilon = this.frameCount >= this.epsilonDecayFrames ?
        this.epsilonFinal :
        this.epsilonInit + this.epsilonIncrement_  * this.frameCount;
    this.frameCount++;

    // The epsilon-greedy algorithm.
    let action;
    const state = this.game.getState();
    if (Math.random() < this.epsilon) {
      // Pick an action at random.
      action = getRandomAction();
    } else {
      // Greedily pick an action based on online DQN output.
      tf.tidy(() => {
        const stateTensor =
            getStateTensor(state, this.game.height, this.game.width)
        action = ALL_ACTIONS[
            this.onlineNetwork.predict(stateTensor).argMax(-1).dataSync()[0]];
      });
    }

    const {state: nextState, reward, done, fruitEaten} = this.game.step(action);

    this.replayMemory.append([state, action, reward, done, nextState]);

    this.cumulativeReward_ += reward;
    if (fruitEaten) {
      this.fruitsEaten_++;
    }
    const output = {
      action,
      cumulativeReward: this.cumulativeReward_,
      done,
      fruitsEaten: this.fruitsEaten_
    };
    if (done) {
      this.reset();
    }
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
          batch.map(example => example[0]), this.game.height, this.game.width);
      const actionTensor = tf.tensor1d(
          batch.map(example => example[1]), 'int32');
      const qs = this.onlineNetwork.apply(stateTensor, {training: true})
          .mul(tf.oneHot(actionTensor, NUM_ACTIONS)).sum(-1);

      const rewardTensor = tf.tensor1d(batch.map(example => example[2]));
      const nextStateTensor = getStateTensor(
          batch.map(example => example[4]), this.game.height, this.game.width);
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
//SnakeGame«

//import {assertPositiveInteger, getRandomInteger} from './utils';

const DEFAULT_HEIGHT = 16;
const DEFAULT_WIDTH = 16;
const DEFAULT_NUM_FRUITS = 1;
const DEFAULT_INIT_LEN = 4;

// TODO(cais): Tune these parameters.
const NO_FRUIT_REWARD = -0.2;
const FRUIT_REWARD = 10;
const DEATH_REWARD = -10;
// TODO(cais): Explore adding a "bad fruit" with a negative reward.

const ACTION_GO_STRAIGHT = 0;
const ACTION_TURN_LEFT = 1;
const ACTION_TURN_RIGHT = 2;

const ALL_ACTIONS = [ACTION_GO_STRAIGHT, ACTION_TURN_LEFT, ACTION_TURN_RIGHT];
const NUM_ACTIONS = ALL_ACTIONS.length;

/**
 * Generate a random action among all possible actions.
 *
 * @return {0 | 1 | 2} Action represented as a number.
 */
function getRandomAction() {
  return getRandomInteger(0, NUM_ACTIONS);
}

class SnakeGame {
  /**
   * Constructor of SnakeGame.
   *
   * @param {object} args Configurations for the game. Fields include:
   *   - height {number} height of the board (positive integer).
   *   - width {number} width of the board (positive integer).
   *   - numFruits {number} number of fruits present on the screen
   *     at any given step.
   *   - initLen {number} initial length of the snake.
   */
  constructor(args) {
    if (args == null) {
      args = {};
    }
    if (args.height == null) {
      args.height = DEFAULT_HEIGHT;
    }
    if (args.width == null) {
      args.width = DEFAULT_WIDTH;
    }
    if (args.numFruits == null) {
      args.numFruits = DEFAULT_NUM_FRUITS;
    }
    if (args.initLen == null) {
      args.initLen = DEFAULT_INIT_LEN;
    }

    assertPositiveInteger(args.height, 'height');
    assertPositiveInteger(args.width, 'width');
    assertPositiveInteger(args.numFruits, 'numFruits');
    assertPositiveInteger(args.initLen, 'initLen');

    this.height_ = args.height;
    this.width_ = args.width;
    this.numFruits_ = args.numFruits;
    this.initLen_ = args.initLen;

    this.reset();
  }

  /**
   * Reset the state of the game.
   *
   * @return {object} Initial state of the game.
   *   See the documentation of `getState()` for details.
   */
  reset() {
    this.initializeSnake_();
    this.fruitSquares_ = null;
    this.makeFruits_();
    return this.getState();
  }

  /**
   * Perform a step of the game.
   *
   * @param {0 | 1 | 2 | 3} action The action to take in the current step.
   *   The meaning of the possible values:
   *     0 - left
   *     1 - top
   *     2 - right
   *     3 - bottom
   * @return {object} Object with the following keys:
   *   - `reward` {number} the reward value.
   *     - 0 if no fruit is eaten in this step
   *     - 1 if a fruit is eaten in this step
   *   - `state` New state of the game after the step.
   *   - `fruitEaten` {boolean} Whether a fruit is easten in this step.
   *   - `done` {boolean} whether the game has ended after this step.
   *     A game ends when the head of the snake goes off the board or goes
   *     over its own body.
   */
  step(action) {
    const [headY, headX] = this.snakeSquares_[0];

    // Calculate the coordinates of the new head and check whether it has
    // gone off the board, in which case the game will end.
    let done;
    let newHeadY;
    let newHeadX;

    this.updateDirection_(action);
    if (this.snakeDirection_ === 'l') {
      newHeadY = headY;
      newHeadX = headX - 1;
      done = newHeadX < 0;
    } else if (this.snakeDirection_ === 'u') {
      newHeadY = headY - 1;
      newHeadX = headX;
      done = newHeadY < 0
    } else if (this.snakeDirection_ === 'r') {
      newHeadY = headY;
      newHeadX = headX + 1;
      done = newHeadX >= this.width_;
    } else if (this.snakeDirection_ === 'd') {
      newHeadY = headY + 1;
      newHeadX = headX;
      done = newHeadY >= this.height_;
    }

    // Check if the head goes over the snake's body, in which case the
    // game will end.
    for (let i = 1; i < this.snakeSquares_.length; ++i) {
      if (this.snakeSquares_[i][0] === newHeadY &&
          this.snakeSquares_[i][1] === newHeadX) {
        done = true;
      }
    }

    let fruitEaten = false;
    if (done) {
      return {reward: DEATH_REWARD, done, fruitEaten};
    }

    // Update the position of the snake.
    this.snakeSquares_.unshift([newHeadY, newHeadX]);

    // Check if a fruit is eaten.
    let reward = NO_FRUIT_REWARD;
    for (let i = 0; i < this.fruitSquares_.length; ++i) {
      const fruitYX = this.fruitSquares_[i];
      if (fruitYX[0] === newHeadY && fruitYX[1] === newHeadX) {
        reward = FRUIT_REWARD;
        fruitEaten = true;
        this.fruitSquares_.splice(i, 1);
        this.makeFruits_();
        break;
      }
    }
    if (!fruitEaten) {
      // Pop the tail off if and only if the snake didn't eat a fruit in this
      // step.
      this.snakeSquares_.pop();
    }

    const state = this.getState();
    return {reward, state, done, fruitEaten};
  }

  updateDirection_(action) {
    if (this.snakeDirection_ === 'l') {
      if (action === ACTION_TURN_LEFT) {
        this.snakeDirection_ = 'd';
      } else if (action === ACTION_TURN_RIGHT) {
        this.snakeDirection_ = 'u';
      }
    } else if (this.snakeDirection_ === 'u') {
      if (action === ACTION_TURN_LEFT) {
        this.snakeDirection_ = 'l';
      } else if (action === ACTION_TURN_RIGHT) {
        this.snakeDirection_ = 'r';
      }
    } else if (this.snakeDirection_ === 'r') {
      if (action === ACTION_TURN_LEFT) {
        this.snakeDirection_ = 'u';
      } else if (action === ACTION_TURN_RIGHT) {
        this.snakeDirection_ = 'd';
      }
    } else if (this.snakeDirection_ === 'd') {
      if (action === ACTION_TURN_LEFT) {
        this.snakeDirection_ = 'r';
      } else if (action === ACTION_TURN_RIGHT) {
        this.snakeDirection_ = 'l';
      }
    }
  }

  /**
   * Get the current direction of the snake.
   *
   * @returns {'l' | 'u' | 'r' | 'd'} Current direction of the snake.
   */
  get snakeDirection() {
    return this.snakeDirection_;
  }

  initializeSnake_() {
    /**
     * @private {Array<[number, number]>} Squares currently occupied by the
     * snake.
     *
     * Each element is a length-2 array representing the [y, x] coordinates of
     * the square. The array is ordered such that the first element is the
     * head of the snake and the last one is the tail.
     */
    this.snakeSquares_ = [];

    // Currently, the snake will start from a completely-straight and
    // horizontally-posed state.
    const y = getRandomInteger(0, this.height_);
    let x = getRandomInteger(this.initLen_ - 1, this.width_);
    for (let i = 0; i < this.initLen_; ++i) {
      this.snakeSquares_.push([y, x - i]);
    }

    /**
     * Current snake direction {'l' | 'u' | 'r' | 'd'}.
     *
     * Currently, the snake will start from a completely-straight and
     * horizontally-posed state. The initial direction is always right.
     */
    this.snakeDirection_ = 'r';
  }

  /**
   * Generate a number of new fruits at a random locations.
   *
   * The number of frtuis created is such that the total number of
   * fruits will be equal to the numFruits specified during the
   * construction of this object.
   *
   * The fruits will be created at unoccupied squares of the board.
   */
  makeFruits_() {
    if (this.fruitSquares_ == null) {
      this.fruitSquares_ = [];
    }
    const numFruits = this.numFruits_ - this.fruitSquares_.length;
    if (numFruits <= 0) {
      return;
    }

    const emptyIndices = [];
    for (let i = 0; i < this.height_; ++i) {
      for (let j = 0; j < this.width_; ++j) {
	      emptyIndices.push(i * this.width_ + j);
      }
    }

    // Remove the squares occupied by the snake from the empty indices.
    const occupiedIndices = [];
    this.snakeSquares_.forEach(yx => {
      occupiedIndices.push(yx[0] * this.width_ + yx[1]);
    });
    occupiedIndices.sort((a, b) => a - b);  // TODO(cais): Possible optimization?
    for (let i = occupiedIndices.length - 1; i >= 0; --i) {
      emptyIndices.splice(occupiedIndices[i], 1);
    }

    for (let i = 0; i < numFruits; ++i) {
      const fruitIndex = emptyIndices[getRandomInteger(0, emptyIndices.length)];
      const fruitY = Math.floor(fruitIndex / this.width_);
      const fruitX = fruitIndex % this.width_;
      this.fruitSquares_.push([fruitY, fruitX]);
      if (numFruits > 1) {
	      emptyIndices.splice(emptyIndices.indexOf(fruitIndex), 1);
      }
    }
  }

  get height() {
    return this.height_;
  }

  get width() {
    return this.width_;
  }

  /**
   * Get plain JavaScript representation of the game state.
   *
   * @return An object with two keys:
   *   - s: {Array<[number, number]>} representing the squares occupied by
   *        the snake. The array is ordered in such a way that the first
   *        element corresponds to the head of the snake and the last
   *        element corresponds to the tail.
   *   - f: {Array<[number, number]>} representing the squares occupied by
   *        the fruit(s).
   */
  getState() {
    return {
      "s": this.snakeSquares_.slice(),
      "f": this.fruitSquares_.slice()
    }
  }
}

/**
 * Get the current state of the game as an image tensor.
 *
 * @param {object | object[]} state The state object as returned by
 *   `SnakeGame.getState()`, consisting of two keys: `s` for the snake and
 *   `f` for the fruit(s). Can also be an array of such state objects.
 * @param {number} h Height.
 * @param {number} w With.
 * @return {tf.Tensor} A tensor of shape [numExamples, height, width, 2] and
 *   dtype 'float32'
 *   - The first channel uses 0-1-2 values to mark the snake.
 *     - 0 means an empty square.
 *     - 1 means the body of the snake.
 *     - 2 means the haed of the snake.
 *   - The second channel uses 0-1 values to mark the fruits.
 *   - `numExamples` is 1 if `state` argument is a single object or an
 *     array of a single object. Otherwise, it will be equal to the length
 *     of the state-object array.
 */

function getStateTensor(state, h, w) {
  if (!Array.isArray(state)) {
    state = [state];
  }
  const numExamples = state.length;
  // TODO(cais): Maintain only a single buffer for efficiency.
  const buffer = tf.buffer([numExamples, h, w, 2]);

  for (let n = 0; n < numExamples; ++n) {
    if (state[n] == null) {
      continue;
    }
    // Mark the snake.
    state[n].s.forEach((yx, i) => {
      buffer.set(i === 0 ? 2 : 1, n, yx[0], yx[1], 0);
    });

    // Mark the fruit(s).
    state[n].f.forEach(yx => {
      buffer.set(1, n, yx[0], yx[1], 1);
    });
  }
  return buffer.toTensor();
}
//»

//dqn«


function createDeepQNetwork(h, w, numActions) {
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

  const model = tf.sequential();
  model.add(tf.layers.conv2d({
    filters: 128,
    kernelSize: 3,
    strides: 1,
    activation: 'relu',
    inputShape: [h, w, 2]
  }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.conv2d({
    filters: 256,
    kernelSize: 3,
    strides: 1,
    activation: 'relu'
  }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.conv2d({
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
}

/**
 * Copy the weights from a source deep-Q network to another.
 *
 * @param {tf.LayersModel} destNetwork The destination network of weight
 *   copying.
 * @param {tf.LayersModel} srcNetwork The source network for weight copying.
 */
function copyWeights(destNetwork, srcNetwork) {
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
}
//»
//Utils«


/**
 * Generate a random integer >= min and < max.
 *
 * @param {number} min Lower bound, inclusive.
 * @param {number} max Upper bound, exclusive.
 * @return {number} The random integers.
 */
function getRandomInteger(min, max) {
  // Note that we don't reuse the implementation in the more generic
  // `getRandomIntegers()` (plural) below, for performance optimization.
  return Math.floor((max - min) * Math.random()) + min;
}

/**
 * Generate a given number of random integers >= min and < max.
 *
 * @param {number} min Lower bound, inclusive.
 * @param {number} max Upper bound, exclusive.
 * @param {number} numIntegers Number of random integers to get.
 * @return {number[]} The random integers.
 */
function getRandomIntegers(min, max, numIntegers) {
  const output = [];
  for (let i = 0; i < numIntegers; ++i) {
    output.push(Math.floor((max - min) * Math.random()) + min);
  }
  return output;
}


function assertPositiveInteger(x, name) {
  if (!Number.isInteger(x)) {
    throw new Error(
        `Expected ${name} to be an integer, but received ${x}`);
  }
  if (!(x > 0)) {
    throw new Error(
        `Expected ${name} to be a positive number, but received ${x}`);
  }
}

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
 * @param {SnakeGameAgent} agent The agent to train.
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
  let summaryWriter;
  if (logDir != null) {
    summaryWriter = tf.node.summaryFileWriter(logDir);
  }

  for (let i = 0; i < agent.replayBufferSize; ++i) {
if (!(i%200)) log(`${i} < ${agent.replayBufferSize}`);
    agent.playStep();
  }

  // Moving averager: cumulative reward across 100 most recent 100 episodes.
  const rewardAverager100 = new MovingAverager(100);
  // Moving averager: fruits eaten across 100 most recent 100 episodes.
  const eatenAverager100 = new MovingAverager(100);

  const optimizer = tf.train.adam(learningRate);
  let tPrev = new Date().getTime();
  let frameCountPrev = agent.frameCount;
  let averageReward100Best = -Infinity;
  while (true) {
    agent.trainOnReplayBatch(batchSize, gamma, optimizer);
    const {cumulativeReward, done, fruitsEaten} = agent.playStep();
    if (done) {
      const t = new Date().getTime();
      const framesPerSecond =
          (agent.frameCount - frameCountPrev) / (t - tPrev) * 1e3;
      tPrev = t;
      frameCountPrev = agent.frameCount;

      rewardAverager100.append(cumulativeReward);
      eatenAverager100.append(fruitsEaten);
      const averageReward100 = rewardAverager100.average();
      const averageEaten100 = eatenAverager100.average();

      console.log(
          `Frame #${agent.frameCount}: ` +
          `cumulativeReward100=${averageReward100.toFixed(1)}; ` +
          `eaten100=${averageEaten100.toFixed(2)} ` +
          `(epsilon=${agent.epsilon.toFixed(3)}) ` +
          `(${framesPerSecond.toFixed(1)} frames/s)`);
      if (summaryWriter != null) {
        summaryWriter.scalar(
            'cumulativeReward100', averageReward100, agent.frameCount);
        summaryWriter.scalar('eaten100', averageEaten100, agent.frameCount);
        summaryWriter.scalar('epsilon', agent.epsilon, agent.frameCount);
        summaryWriter.scalar(
            'framesPerSecond', framesPerSecond, agent.frameCount);
      }
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
async function main() {//«
//  const args = parseArguments();
//  if (args.gpu) {
//    tf = require('@tensorflow/tfjs-node-gpu');
//  } else {
//    tf = require('@tensorflow/tfjs-node');
//  }
//  console.log(`args: ${JSON.stringify(args, null, 2)}`);

const args={//«
	height:9,
	width:9,
	numFruits:1,
	initLen: 2,
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


  const game = new SnakeGame({
    height: args.height,
    width: args.width,
    numFruits: args.numFruits,
    initLen: args.initLen
  });
  const agent = new SnakeGameAgent(game, {
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

let did_start = false;
onmessage=(e)=>{
	if (e.data==="START") {
		if (did_start) return;
		did_start = true;
cwarn("STARTING...");
		main();
	}
};







/*parseArguments«
function parseArguments() {//«
  const parser = new argparse.ArgumentParser({
    description: 'Training script for a DQN that plays the snake game'
  });
  parser.addArgument('--gpu', {
    action: 'storeTrue',
    help: 'Whether to use tfjs-node-gpu for training ' +
    '(requires CUDA GPU, drivers, and libraries).'
  });
  parser.addArgument('--height', {
    type: 'int',
    defaultValue: 9,
    help: 'Height of the game board.'
  });
  parser.addArgument('--width', {
    type: 'int',
    defaultValue: 9,
    help: 'Width of the game board.'
  });
  parser.addArgument('--numFruits', {
    type: 'int',
    defaultValue: 1,
    help: 'Number of fruits present on the board at any given time.'
  });
  parser.addArgument('--initLen', {
    type: 'int',
    defaultValue: 2,
    help: 'Initial length of the snake, in number of squares.'
  });
  parser.addArgument('--cumulativeRewardThreshold', {
    type: 'float',
    defaultValue: 100,
    help: 'Threshold for cumulative reward (its moving ' +
    'average) over the 100 latest games. Training stops as soon as this ' +
    'threshold is reached (or when --maxNumFrames is reached).'
  });
  parser.addArgument('--maxNumFrames', {
    type: 'float',
    defaultValue: 1e6,
    help: 'Maximum number of frames to run durnig the training. ' +
    'Training ends immediately when this frame count is reached.'
  });
  parser.addArgument('--replayBufferSize', {
    type: 'int',
    defaultValue: 1e4,
    help: 'Length of the replay memory buffer.'
  });
  parser.addArgument('--epsilonInit', {
    type: 'float',
    defaultValue: 0.5,
    help: 'Initial value of epsilon, used for the epsilon-greedy algorithm.'
  });
  parser.addArgument('--epsilonFinal', {
    type: 'float',
    defaultValue: 0.01,
    help: 'Final value of epsilon, used for the epsilon-greedy algorithm.'
  });
  parser.addArgument('--epsilonDecayFrames', {
    type: 'int',
    defaultValue: 1e5,
    help: 'Number of frames of game over which the value of epsilon ' +
    'decays from epsilonInit to epsilonFinal'
  });
  parser.addArgument('--batchSize', {
    type: 'int',
    defaultValue: 64,
    help: 'Batch size for DQN training.'
  });
  parser.addArgument('--gamma', {
    type: 'float',
    defaultValue: 0.99,
    help: 'Reward discount rate.'
  });
  parser.addArgument('--learningRate', {
    type: 'float',
    defaultValue: 1e-3,
    help: 'Learning rate for DQN training.'
  });
  parser.addArgument('--syncEveryFrames', {
    type: 'int',
    defaultValue: 1e3,
    help: 'Frequency at which weights are sync\'ed from the online network ' +
    'to the target network.'
  });
  parser.addArgument('--savePath', {
    type: 'string',
    defaultValue: './models/dqn',
    help: 'File path to which the online DQN will be saved after training.'
  });
  parser.addArgument('--logDir', {
    type: 'string',
    defaultValue: null,
    help: 'Path to the directory for writing TensorBoard logs in.'
  });
  return parser.parseArgs();
}//»
»*/


