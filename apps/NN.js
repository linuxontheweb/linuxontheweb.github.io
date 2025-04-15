const{log}=LOTW.api.util;

export const app = class {
	constructor(Win){
		this.Win = Win;
	}
	async train(){
log("IN");
	  await this.model.fit(this.boards, this.labels, { epochs: 100 });
 log('Training done!');
	}
	async main(){
// Define the model
const model = tf.sequential();
model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [9] })); // Hidden layer
model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // Output: win probability
model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });
// Fake data: boards (X=1, O=-1, empty=0) and labels (1=win for X, 0=not win)
const boards = tf.tensor2d([
  [1, -1, 0, 0, 1, 0, 0, 0, 1], // X wins (diagonal)
  [-1, 1, 0, 1, -1, 0, 0, 0, -1], // No win
  // Add more examples...
], [2, 9]);

const labels = tf.tensor2d([[1], [0]]);

this.model=model;
this.boards=boards;
this.labels=labels;

await this.train();

// Predict for a new board
const newBoard = tf.tensor2d([[1, -1, 0, 0, 1, 0, 0, 0, 1]], [1, 9]);
model.predict(newBoard).print(); // Outputs ~1 (win) or ~0 (no win)

	}
	onappinit(){
		this.main();
	}
	onkill(){
	}
	onkeydown(e){
	}
}

