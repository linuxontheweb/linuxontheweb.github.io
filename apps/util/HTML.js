

//import { util, api as capi } from "util";
//import { globals } from "config";
const util = LOTW.api.util;
const globals = LOTW.globals;

//export const app = function(arg) {
export const app = function(Win, Desk) {

//Imports«


const{fs}=globals;
const{log,cwarn,cerr, make,mkdv,mk,mksp}=util;
const Main = Win.main;
Win.makeScrollable();
//const Win = Main.top;

//»

//Var«

const BADTAGS = ["SCRIPT","IFRAME"];

//»

//DOM«

Main._over="auto";
//Main._bgcol="#fff";
Main.style.userSelect="text";

//»

const set_html = text => {//«

	let parser = new DOMParser();
	let doc = parser.parseFromString(text, "text/html");
	let tot=0;
	for (let tag of BADTAGS){
		let arr = Array.from(doc.body.getElementsByTagName(tag));
		let iter=0;
		while (arr.length) {
			tot++;
			let node = arr.shift();
			node.parentNode.removeChild(node);
		}
	}
	Main.innerHTML = doc.body.innerHTML;
	Win.statusBar.innerHTML = `${tot} nodes deleted`;
//let mess_arr = doc.getElementsByClassName("message-bubble");
//log(mess_arr);

};//»

//OBJ/CB«

this.onappinit=(args={})=>{
	if (args.text) set_html(args.text);
};

this.onloadfile=bytes=>{
	set_html(util.bytesToStr(bytes));
};

this.onkeydown = function(e,s) {//«
};//»
this.onkeyup=(e)=>{//«
};//»
this.onkeypress=e=>{//«
};//»
this.onkill = function() {//«
};//»
this.onresize = function() {//«
};//»
this.onfocus=()=>{//«
};//»
this.onblur=()=>{//«
};//»

//»

}

