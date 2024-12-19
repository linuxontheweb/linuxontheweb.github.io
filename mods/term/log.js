/*12/18/24: Each item in the log at least has a 'v'alue, and possibly an 'i'teration 
(a sequence number based on a single log invocation) and a 'n'ame. If there is a
name, we want to use up to MAX_NAME_CHARS in the side menu, and put the whole thing
(up to the screen width) in the bottom, whenever it is highlighted (in the main menu
screen).
*/
/*11/6/24: «

This was conceived as a basic menuing scheme (a main menu with submenus with
subsubmenus, etc), but morphed into a general object/array viewer/analyzer. It
currently toggles true/false values with the spacebar. I want to be able to
edit strings and numbers. If there is a key (e.g. Key1) with an object value,
it looks for a '_val' property in the object (using hasOwnProperty, and then
considers the value of the '_val' key to be value of Key1. So the object with
the '_val' key can be used to keep application-specific meta information, such
as setting permissible ranges for numbers, etc.

Now we should be able to do the same thing with HTML elements (maybe gotten by
using DOMParser.parseFromString("<html>...</html>")) using the DOM traversal
methods after testing for whether it is an instanceof HTMLElement.  So instead
of extracting keys, we just look for Node.childNodes. Then, using the efficient
document introspection methods we develop, we can do mapping functions between
"well-known" HTML idioms (i.e. from popular internet domains) and JS objects.

»*/
//Imports«
const util = LOTW.api.util;
const globals = LOTW.globals;
const{consoleLog, strNum, isArr, isStr, isObj, isBool, isNum, log, jlog, cwarn, cerr}=util;
const{Word}=globals.ShellMod.seqClasses;
const isWord=val=>{return val instanceof Word;};

//»

export const mod = function(termobj) {

//Var«
let MAX_NAME_CHARS = 8;
let SHOW_MAX_OBJ_KEYS = 5;

//const MAIN_STAT_STR = "Console";

const menu = consoleLog.getLog()

const {//«
	wrap_line,
	refresh,
	topwin,
	quit_new_screen,
	h
} = termobj;//»
let appclass="pager";
let hold_screen_state;

let lines=[], line_colors=[];
//for (let i=0; i< 21; i++){
//	lines[i]=[...`Line: ${i}`];
//}

let x=0,y=0,scroll_num=0;
let stack = [];
let path = [];

let stat_message, stat_message_type;
let stat_input_mode;
let stat_com_arr;
let num_stat_lines = 1;

let curobj;
let min_key_len;
const NEW_LOGS_MESS = "!!! New logs !!!";
let is_message;
//»

//Funcs«


const log_cb=(if_clear)=>{//«
if (if_clear) {
	curobj = menu;
	x=0;
	y=0;
	scroll_num=0;
	stack = [];
	path = [];
}
if (curobj===menu){
set_main_menu({clear: if_clear});
render();
}
else{
stat_message = NEW_LOGS_MESS;
is_message = true;
render();
}
};
consoleLog.addCb(log_cb);
//»
const okint = val=>{//«
    if (typeof val == "number") return true;
    if (typeof val == "string") {
        return (val.match(/^0x[0-9a-fA-F]+$/)||val.match(/^0o[0-7]+$/)||val.match(/^[0-9]+$/));
    }
    return false;
};//»        
const quit=(rv)=>{//«
	consoleLog.rmCb(log_cb);
	delete this.command_str;
	this.killed = true;
	quit_new_screen(hold_screen_state);
};//»
const render = () => {//«
	refresh();
};//»

const set_main_menu=(opts={})=>{//«

curobj = menu;
lines.splice(0, lines.length);
line_colors.splice(0, line_colors.length);
min_key_len = 0;
if (!curobj.length) {
	if (opts.clear) stat_message = "[Cleared]";
	else stat_message="[Empty]";
	is_message = false;
	render();
	return;
}
let keys=[];
let vals=[];
for (let o of menu){
	let addlen;
	let nm;
	if (o.n < MAX_NAME_CHARS) nm = o.n;
	else nm = o.n.slice(0, MAX_NAME_CHARS);
	if (Number.isFinite(o.i)) {
		nm+=`[${o.i+1}]`;
	}
	else addlen = 0;
	if (nm.length > min_key_len) min_key_len = nm.length;
	keys.push(nm);
	vals.push(o.v);
}
for (let iter=0; iter < keys.length; iter++){
	let k = keys[iter];
	let val = vals[iter];
	let col;
	if (isObj(val)) {
		let keys=Object.keys(val);
		let use_keys = keys.slice(0, SHOW_MAX_OBJ_KEYS);
		if (keys.length > SHOW_MAX_OBJ_KEYS){
			val = ` {${use_keys.join(",")},[+${keys.length-SHOW_MAX_OBJ_KEYS}]}`;
		}
		else{
			val = ` {${use_keys.join(",")}}`;
		}
	}
	else if (isArr(val)) val = ` [${Object.keys(val).length}]`;
	else if (isStr(val)) {
		val = ` "${val}"`;
		col="#f99";
	}
	else if (isBool(val)){
		val = ` ${val}`;
		col="#9f9";
	}
	else if (isNum(val)){
		val = ` ${val}`;
		col="#bbf";
	}
	else{
cerr("What in the hell is this thing???");
log(val)
	}
	k = k.padEnd(min_key_len, " ");
	lines.push([...k,":", ...val]);
if (col) line_colors[iter]={[k.length+1]: [val.length, col]};
}
//if (opts.statVal) stat_val();
stat_val();
render();

};//»
const set_menu=(obj,opts={})=>{//«
	curobj = obj;
	lines.splice(0, lines.length);
	line_colors.splice(0, line_colors.length);
	let keys = Object.keys(obj);
	if (isArr(obj)) {
		min_key_len = (obj.length+"").length;
	}
	else{
		min_key_len=0;
		keys.forEach(k=>{
			if (k.length > min_key_len)  min_key_len=k.length;
		});
	}
	let iter=0;
	for (let k of keys) {
		let val = obj[k];
		let col;
		if (isWord(val)){
			val = ` Word(${val.val.join("")})`;
		}
		else if (isObj(val)) {
			let keys=Object.keys(val);
			let use_keys = keys.slice(0, SHOW_MAX_OBJ_KEYS);
			if (keys.length > SHOW_MAX_OBJ_KEYS){
				val = ` {${use_keys.join(",")},[+${keys.length-SHOW_MAX_OBJ_KEYS}]}`;
			}
			else{
				val = ` {${use_keys.join(",")}}`;
			}
		}
		else if (isArr(val)) val = ` [${Object.keys(val).length}]`;
		else if (isStr(val)) {
			val = ` "${val}"`;
			col="#f99";
		}
		else if (isBool(val)){
			val = ` ${val}`;
			col="#9f9";
		}
		else if (isNum(val)){
			val = ` ${val}`;
			col="#bbf";
		}
		else{
cerr(`WHAT IS THIS KEY: '${k}'`);
log(val)
		}
		k = k.padEnd(min_key_len, " ");
		lines.push([...k,":", ...val]);
if (col) line_colors[iter]={[k.length+1]: [val.length, col]};
		iter++;
	}
	if (opts.statVal) stat_val();
	render();
};//»
const menu_key=(num)=>{//«
	let use_num;
	if (Number.isFinite(num)) use_num = num;
	else use_num = y+scroll_num;
	let o = menu[use_num];
//if (!o) return "";
	let nm = o.n;
	if (Number.isFinite(o.i)) nm+=`[${o.i+1}]`;
	return nm;
};/*»*/
const path_str=(no_root)=>{//«
//	if (!path.length) return no_root?"":"/";
	if (!path.length) return "";
	if (path.length===1) return path[0];
	return path.join(" / ");
};//»
const cur_key=()=>{//«
	if (curobj===menu) return menu_key();
	return lines[y+scroll_num].join("").slice(0, min_key_len).trim();
}//»
const stat_val=()=>{//«
if (curobj===menu && !menu.length){
stat_message = "[Empty]";
render();
return;
}
	let val;
	let k = cur_key();
	if (curobj===menu){
		val = menu[y+scroll_num].v;
	}
	else{
		val = curobj[k];
	}
	let which;
	if (isStr(val)) which = "string";
	else if (isBool(val)) which="boolean";
	else if (isNum(val)) which="number";
	else if (isObj(val)) which="object";
	else if (isArr(val)) which="array";
	else which="?";
	if (!path.length) stat_message = `${k} (${which})`
	else stat_message = `${path_str()} / ${k} (${which})`;
	is_message = false;
};//»

//»
//Obj/CB«

const onescape=()=>{//«
if (is_message){
stat_message = null;
stat_val();
render();
return true;
}
//	if (stat_message!==MAIN_STAT_STR) {
//		stat_message=MAIN_STAT_STR;
//		render();
//		return true;
//	}
	return false;
};//»
this.onkeydown=(e, sym, code)=>{//«
	if (curobj===menu && !curobj.length) return;

/*
	if (this.stat_input_type) {//«
		if (sym=="ENTER_") {//«
			this.stat_input_type = false;
//			if (stat_com_arr.length) {
//				line_colors.splice(0,line_colors.length)
//				do_scroll_search(true);
//			}
			return;
		}//»
		else if (sym=="LEFT_") {//«
			if (x > 0) x--;
		}//»
		else if (sym=="RIGHT_") {//«
			if (x < stat_com_arr.length) x++;
		}//»
		else if (sym=="BACK_") {//«
			if (x>0) {
				x--;
				stat_com_arr.splice(x, 1);
			}
			else {
				this.stat_input_type = false;
			}
		}//»
		else if (sym=="DEL_") {//«
			if (stat_com_arr.length) {
				stat_com_arr.splice(x, 1);
			}
		}//»
		else if (sym=="a_C") {//«
			if (x==0) return;
			x=0;
		}//»
		else if (sym=="e_C") {//«
			if (x==stat_com_arr.length) return;
			x=stat_com_arr.length;
		}//»
		render();
		return;
	}//»
*/

	if (sym=="UP_") {//«
		if (y>0)y--
		else if (scroll_num>0)scroll_num--;
		else return;
		stat_val();
		render();
	}//»
	else if (sym=="DOWN_") {//«
		if (y+scroll_num === lines.length-1) return;
		if (y<termobj.h - num_stat_lines-1){
			y++;
		}
		else if (y+scroll_num+num_stat_lines < lines.length){
			scroll_num++;
		}
		stat_val();
		render();
	}//»
	else if (sym=="SPACE_"){//«
/*
		let k = cur_key();
		let val = curobj[k];
		let isobj=false;
		if (isObj(val)&&val.hasOwnProperty("_val")) {
			isobj=true;
			val = val._val;
		}
		if (isBool(val)) val = !val;
		else if (isNum(val)){
log("SET NUM");
		}
		else if (isStr(val)){
log("SET STR");
		}
		else{
return;
		}
		if(isobj) curobj[k]._val = val;
		else curobj[k]=val;
		set_menu(curobj);	
*/
	}//»
	else if (sym=="PGUP_") {//«
		e.preventDefault();
		if (scroll_num == 0) {
			y=0;
			render();
			return;
		}
		let donum;
		if (scroll_num - termobj.h > 0) {
			donum = termobj.h;
			scroll_num -= termobj.h-1;
		}
		else scroll_num = 0;
		stat_val();
		render();
	}//»
	else if (sym=="PGDOWN_") {//«
		e.preventDefault();
		let donum = termobj.h-1;
//		if (scroll_num + donum-num_stat_lines >= lines.length) {
		if (scroll_num + donum >= lines.length) {
//log("!!!");
			y = lines.length-1-scroll_num;
			stat_val();
			render();
			return;
		}
		scroll_num += donum;
		if (scroll_num + termobj.h-num_stat_lines > lines.length) {
			scroll_num = lines.length - termobj.h + num_stat_lines;
			if (scroll_num < 0) scroll_num = 0;
		}
		else{
		}
		y=0;
		stat_val();
		render();
	}//»
	else if (sym=="HOME_"||sym===",_") {//«
//		if (scroll_num == 0) return;
		scroll_num = 0;
		y=0;
		stat_val();
		render();
	}//»
	else if (sym=="END_"||sym==="._") {//«
		if (scroll_num + termobj.h - num_stat_lines >= lines.length) {
			if (y < lines.length-1){
				y = lines.length-1;
				stat_val();
				render();
			}
			return;
		}
		scroll_num = lines.length - termobj.h + num_stat_lines;
		y = lines.length-1-scroll_num;
		if (scroll_num < 0) scroll_num = 0;
//		y=0;
		stat_val();
		render();
	}//»
else if (sym=="ENTER_"){//«
//	let k = cur_key();
//	let v = curobj[k];
	let k, v;
	if (curobj===menu) {
		k = y+scroll_num;
		v = menu[k].v;
	}
	else {
		k = cur_key();
		v = curobj[k];
	}
	if (isWord(v)){
cwarn(k, v);
	}
	else if (isObj(v)||isArr(v)){
		stack.push([curobj, k, y, scroll_num]);
		if (curobj===menu) path.push(menu_key());
		else path.push(k);
		stat_message = path_str();
		is_message = false;
		y=scroll_num=0;
		set_menu(v,{statVal: true});
	}
	else{
cwarn(k, v);
	}
}//»
else if (sym=="LEFT_"){//«
	let arr = stack.pop();
	if (!arr){
		stat_message = "Can't go back";
		is_message = true;
		stat_message_type = 2;
		render();
		return;
	}
	path.pop();
	if (path.length===0) stat_message = "/";
	else if (path.length===1) stat_message = "/ "+path[0];
	else stat_message = "/ "+path.join(" / ");
	y=arr[2];
	scroll_num=arr[3];
	is_message = false;
	if (!path.length) set_main_menu();
	else set_menu(arr[0], {statVal: true});
}//»
else if (sym==="c_CAS"){
//cwarn("CLEAR");
consoleLog.clear();
//render();
}
}//»
this.onkeypress=(e, sym, code)=>{//«
	if (sym==="q"){
		quit();
	}
}//»

//»
//defineProperty«
Object.defineProperty(this,"x",{get:()=>x});
Object.defineProperty(this,"y",{get:()=>y});
Object.defineProperty(this,"scroll_num",{get:()=>scroll_num});
Object.defineProperty(this,"stat_com_arr",{get:()=>stat_com_arr});
Object.defineProperty(this, "stat_message", {
	get: () => stat_message,
	set: (s) => stat_message = s
});
Object.defineProperty(this, "stat_message_type", {
	get: () => stat_message_type
});
Object.defineProperty(this,"line_select_mode",{get:()=>true});
//»
this.quit = quit;
this.init = (o={})=>{//«
//this.topMenu = menuobj;
//this.init = (linesarg, fname, o={})=>{
//jlog(menuobj);
let {opts}=o;
this.command_str = o.command_str;
return new Promise((Y,N)=>{
	this.cb=Y;
	hold_screen_state = termobj.init_new_screen(this, appclass, lines, line_colors, num_stat_lines, onescape);
//	stat_message="/";
//	stat_message = MAIN_STAT_STR;
	set_main_menu();
});



}//»

}













