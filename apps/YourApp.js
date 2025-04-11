export const app = class {
	constructor(Win){
		this.Win = Win;
	}
	onappinit(){
		this.Win.Main.innerHTML='<center><h1>Your awesome app goes here!</h1></center>';
	}
	onblur(){
	//Handle window blur event
	}
	onfocus(){
	//Handle window focus event
console.warn(`Focused!`);
	}
	onkill(){
	//Handle window "kill" event
console.warn(`Closed!`);
	}
	onkeydown(e){
	//Handle key down
console.log(`Got: ${e.key}`);
	}
}

