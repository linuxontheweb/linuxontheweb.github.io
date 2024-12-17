/*Here lies a small little "window manager," invokable via "Ctrl+Alt+0",«
which will allow us to make quick/dirty rearrangements to the windows
kept in globals.boundWins (created via the 'bindwin' command).

I just want to be able to
1) select a window (via spacebar)
2) move it around in the list via arrow keys
3) change  the visible window order via 'Enter'

This should give us a sense of rearranging tabs, without the need to take our
hands off of the keyboard.

Let's select the window with its number and then move it with arrows (LEFT/RIGHT)
if the list is horizontal and (UP/DOWN) if it is vertical.

Want a hotkey to switch the orientation of the window list. How about "/".

»*/

//Imports«
const{globals}=LOTW;
const{log, cwarn, cerr, isnum, make, mkdv} = LOTW.api.util;
const{boundWins}=globals;
//»

export const app = function(Win, Desk) {

//Var«
//»

//Dom«

const Main = Win.Main;

const DEF_FLEX_DIR = "row";
let FLEX_DIR=DEF_FLEX_DIR;

let win_div;
let win_divs;
let cur_win;
//boundWins = [<1-9>: {win: Window, desc: "Something here"},...];

//»

//Funcs«

const render=()=>{//«

if (win_div) win_div._del();
cur_win = null;
win_divs = [];
win_div = mkdv();
win_div.style.cssText=`
display: flex;
flex-direction: ${FLEX_DIR};
`;
for (let i=1; i <= 9; i++){
	let n = i+"";
	let obj = boundWins[n];
	let dv = mkdv();
dv.style.cssText=`
text-align: center;
flex-grow: 1;
border: 1px dotted gray;
margin: 3px;
`;
	let mess;
	if (!obj) {
		mess="&nbsp;&nbsp;&nbsp;&nbsp;";
		dv.innerHTML=`<span style="font-size: 21px;"><i>${n}</i></span><br>${mess}`;
	}
	else {
		mess = obj.desc;
		dv.innerHTML=`<span style="font-size: 21px;"><b>${n}</b></span><br>${mess}`;
	}
	win_div._add(dv);
	dv._obj
	if (obj) {
		dv._obj = obj;
		win_divs[i] = {elem: dv, obj, iter: i};
	}
}
Main._add(win_div);
};//»
const move_div=(incr)=>{//«
if (!cur_win) return;
let nodes = Array.from(win_div.childNodes);
let len = nodes.length;
let which = nodes.indexOf(cur_win.elem);
if ((incr===-1&&which===0)||(incr===1&&which===len-1)) return;
if (incr===-1){//«
	let prev_sib = cur_win.elem.previousSibling;
	cur_win.elem._del();
	win_div.insertBefore(cur_win.elem, prev_sib);
}//»
else{//«
	let next_sib = cur_win.elem.nextSibling;
	cur_win.elem._del();
	if (next_sib.nextSibling){
		win_div.insertBefore(cur_win.elem, next_sib.nextSibling);
	}
	else{
		win_div.appendChild(cur_win.elem);
	}
}//»
};/*»*/

//»

this.onappinit=()=>{//«
render();
}//»
this.onkill=()=>{//«
};//»
this.onescape=()=>{//«
if (cur_win){
cur_win.elem._bgcol="";
cur_win=null;
render();
return true;
}
return false;
}/*»*/
this.onblur=()=>{//«
	if (!cur_win) return;
	cur_win.elem._bgcol="";
	cur_win=null;
	render();
};//»
this.onfocus=()=>{render();};
this.onkeydown=(e,k)=>{//«

let marr;

if (k==="/_"){//«
if (cur_win) return;
//log("SWITCH LIST!");
if (FLEX_DIR==="row") FLEX_DIR = "column";
else FLEX_DIR = "row";
render();
}//»
else if (marr = k.match(/^([1-9])_$/)){//«
if (cur_win) return;
let got_win = win_divs[parseInt(marr[1])];
if (!got_win) return;
cur_win = got_win;
got_win.elem._bgcol="#330";
}//»
else if (k==="LEFT_"){//«
	if (FLEX_DIR !== "row") return;
	move_div(-1);
}
else if (k==="RIGHT_"){
	if (FLEX_DIR !== "row") return;
	move_div(1);
}
else if (k==="UP_"){
	if (FLEX_DIR !== "column") return;
	move_div(-1);
}
else if (k==="DOWN_"){
	if (FLEX_DIR !== "column") return;
	move_div(1);
}//»
else if (k==="ENTER_"){//«
	if (!cur_win) return;
	let nodes = Array.from(win_div.childNodes);
	let len = nodes.length;
	let which = nodes.indexOf(cur_win.elem);
	if (cur_win.iter===which+1) return;
	for (let i=0; i < len; i++){
		let win = nodes[i];
		let num = (i+1)+"";
		if (win._obj){
			win._obj.win.bindNum=num;
			boundWins[num] = win._obj;
		}
		else boundWins[num] = undefined;
	}
	cur_win = null;
	render();
}//»

};//»

}
