(()=>{"use strict";const APPNAME="dev.BinEdit";

/*11/27/26: When editing the values, doing render() reverts back to the old values while
make_lines() uses the new value that was put into bytes.
*/
/*11/26/26:«

Want to escape the cur_span, and reset it at the upper right corner.

»*/

//«
const util = LOTW.api.util;
const globals = LOTW.globals;
//import { util, api as capi } from "util";
//import { globals } from "config";
const{NS}=globals;
const{log,cwarn,cerr, make, mkdv, isStr, toBytes}=util;

const{popin, popup}=globals.api.widgets;

const USE_CHAR_W = 16;
//»

LOTW.apps[APPNAME] = function(Win) {

//Var«

const {Main, Desk} = Win;

let MAX_PG_SZ = 25000;
let lines;
let text_lines;
let bin_lines;
let bytes;
let nb, nb_len;
let nb_done;
let nlns;
let text_mode = false;
let x=0;
let y=0, scroll_num=0;
let w,h;
let ch_w;
let nrows,ncols;

let FF = "monospace";
let FW = "500";
let CURBG = "#00f";
let CURFG = "#fff";
let OVERLAYOP = "0.42";
let TCOL = "#e3e3e3";
let is_loading = false;
let stop_loading = false;
let did_stop_loading;
let check_stop_loading_interval;

let killed = false;
let start_byte;
let char_w;

let BASE=16;
let is_going_to = false;
let mouse_mode = true;

//»

//DOM«
let cur_span;
let cur_line;

let wrapdiv = make('div');
wrapdiv._bgcol="#000";
wrapdiv._pos="absolute";
//wrapdiv._loc(0,0);
//wrapdiv._r = 0;
wrapdiv._tcol = TCOL;
wrapdiv._fw = FW;
wrapdiv._ff = FF;
wrapdiv._fs=28;

wrapdiv.webkitFontSmoothing="antialiased";

wrapdiv.style.whiteSpace = "pre";

Main.appendChild(wrapdiv);
Main._over = "hidden";

//log(wrapdiv);
let tabdiv = make('div');
//tabdiv._padl="100px";
//tabdiv._w="100%";
tabdiv.style.userSelect = "text"
tabdiv._pos="absolute";
tabdiv.onclick=e=>{
    e.stopPropagation();
    setTimeout(_=>{
        if (window.getSelection().isCollapsed) textarea.focus();
    },10);
}
//log(wrapdiv);
tabdiv.style.tabSize = 4;

let numdiv = make('div');
numdiv._pos="absolute";
numdiv._loc(0,0);
numdiv._w=100;
numdiv._h="100%";
numdiv._over="hidden";
//numdiv._bgcol="#002";
wrapdiv.appendChild(numdiv);

wrapdiv.tabdiv = tabdiv;
wrapdiv.appendChild(tabdiv);

tabdiv._x=numdiv._w + 100;

let textarea = make('textarea');//«
textarea.id = `textarea_${Win.id}`;
textarea.width = 1;
textarea.height = 1;
textarea.style.opacity = 0;
let areadiv = make('div');
areadiv._pos="absolute";
areadiv._loc(0,0);
areadiv._z=-1;
areadiv.appendChild(textarea);
this.areadiv = areadiv;
this.textarea = textarea; 
Main._tcol="black";
Main._bgcol="black";
Main._fs=19;
Main.appendChild(areadiv);
textarea.focus();
//»

const statbar = Win.statusBar;
statbar._w="100%";
statbar._dis="flex";
statbar.style.justifyContent="space-between";

const messdiv=mkdv();
const loaddiv = mkdv();
const perdiv=mkdv();
perdiv._padr=5;
statbar._add(messdiv, loaddiv, perdiv);

let cursor_mode = true;

//»

//Funcs«

const set_val_of_cursor=(val)=>{//«
//log(bin_lines[ln_num][ln_x], bin_lines[ln_num][ln_x+1], `(${text_lines[ln_num][ln_x]})`);

	let ch_num = cur_pos();
	let byt;
	if (isStr(val)) byt = parseInt(`0x${val}`);
	else if (Number.isFinite(val)) byt = val;
//log(`bytes[${ch_num}] = ${byt}`);
	bytes[ch_num] = byt;
//log(bytes);
	let binch = byt.toString(16).lpad(2,"0")
//bin_lines[ln_num]
let ln_num = y+scroll_num;
let ln_x = x * 3;
bin_lines[ln_num][ln_x] = binch[0];
bin_lines[ln_num][ln_x+1] = binch[1];
if (byt >= 0x20 && byt <= 0x7e){
let ch = String.fromCharCode(byt);
cwarn(`${byt} -> ${ch}`);
	text_lines[ln_num][ln_x] = ch;
}
else{
	text_lines[ln_num][ln_x] = "\xa0";
}
	return binch;

};//»
const get_val_of_cursor=()=>{//«

//	let over_x = USE_CHAR_W + x;
//	let ry = (y+scroll_num-1)*USE_CHAR_W;
//	log(x, y, scroll_num);
//	let ch_num = ry+over_x;
	let ch_num = cur_pos();
	let byt = bytes[ch_num];
	let binch = byt.toString(16).lpad(2,"0")
	return binch;

};//»
const cur_pos = ()=>{//«
	let over_x = USE_CHAR_W + x;
	let ry = (y+scroll_num-1)*USE_CHAR_W;
	let ch_num = ry+over_x;
	return ch_num;
};//»

const stat=(opts={})=>{//«
	messdiv.innerText='Spacebar toggles ascii view. Use the arrow/paging keys to scroll';
	if (is_loading) loaddiv.innerText=`Loading: ${Math.floor(100*(nb_done/nb))}%`;
	else if (opts.go_to) loaddiv.innerHTML=opts.go_to.toString(BASE);
	else loaddiv.innerText="";
	let from = scroll_num * (ch_w);
	let to = (scroll_num + h) * (ch_w);
	if (to > nb) to = nb;
	perdiv.innerText=`${from} - ${to} / ${nb}`;
};//»
const getgrid=()=>{//«
    let tdiv = tabdiv;
    let usech = "X";
    let str = "";
    let iter = 0;
    wrapdiv._over="auto";
//log("USE_CHAR_W", USE_CHAR_W);
    while (true) {
        if (Win.killed) return;
        str+=usech;
        tdiv.innerHTML = str;
//log();
        if (USE_CHAR_W || ( tdiv.scrollWidth+100 > wrapdiv._w )) {
			tdiv.innerHTML = usech.repeat(str.length-1);
//          wrapdiv._w = tdiv.clientWidth;
			ncols = str.length - 1;
			char_w = Math.floor(ncols/3)
			if (!USE_CHAR_W) break;
			else if (char_w === USE_CHAR_W) break;
//log(ncols, char_w);
        }
        iter++;
        if (iter > 1000) {
log(wrapdiv);
            cwarn("INFINITE LOOP ALERT DOING WIDTH: " + tdiv.scrollWidth + " > " + w);
            return
        }
    }
    str = usech;
    iter = 0;
    while (true) {
        tdiv.innerHTML = str;
        if (tdiv.scrollHeight > wrapdiv._h) {
            let newarr = str.split("\n");
            newarr.pop();
            tdiv.innerHTML = newarr.join("\n");
            wrapdiv._h = tdiv.clientHeight;
            nrows = newarr.length;
            break;
        }
        str+="\n"+usech;
        iter++;
        if (iter > 100000) {
log(wrapdiv);
            return cwarn("INFINITE LOOP ALERT DOING HEIGHT: " + tdiv.scrollHeight + " > " + h);
        }
    }
    tdiv.innerHTML="";
    wrapdiv._over="hidden";
}//»
const render=(opts={})=>{//«
//log(x, y, scroll_num);
	let {fast, go_to}=opts;
	go_to = cur_pos();
//cwarn("GOTO", go_to);
	if (text_mode) lines = text_lines;
	else {
		lines = bin_lines;
//log(lines);
	}
	if (!lines) return;
	let usescroll = scroll_num;
	let scry = usescroll;
	let slicefrom = scry;
	let sliceto = scry + nrows;
	let uselines=[];
	numdiv.innerHTML="";
	tabdiv.innerHTML="";
	let from = scroll_num * (ch_w);
	let lnno = 0;

	for (let i=slicefrom; i < sliceto; i++) {
		let ln = lines[i];
		if (!ln) uselines.push([""]);
		else {
			let newln = ln.slice(0,w);
			uselines.push(newln);
		}
		let ndv = make('div');
		ndv.innerHTML=(((scroll_num + lnno) * (ch_w)).toString(BASE)).padStart(nb_len, "0");
		numdiv._add(ndv);
		lnno++;
	}
	let outarr = [];
	let len = uselines.length;
	let donum = len;
	let iter=0;
	for (let i = 0; i < donum; i++) {
		let arr = uselines[i];
		let ind;
		let ln = arr.join("");
		if (fast){
			outarr.push(ln);
		}
		else {
			let lnarr = ln.split(" ");
			lnarr.pop();
			let lndv = mkdv();
//			if (!cur_line) cur_line = lndv
			for (let n of lnarr){
				let nsp = make("span");
				nsp._which = iter+from;
				nsp.on=()=>{
					nsp._bgcol="#00f";
					nsp._tcol="#ccc";
					nsp._fw="bold";
				};
				if (Number.isFinite(go_to)){
					if (iter+from===go_to){
						if (cur_span) cur_span.off();
						cur_span = nsp;
						nsp.on();
					}
				}
				nsp.off=()=>{
					loaddiv.innerHTML="";
					nsp._bgcol="";
					nsp._tcol="";
					nsp._fw="";
				};
				nsp.innerHTML = n+"&nbsp;";
				lndv.appendChild(nsp);
				iter++;
			}
			tabdiv.appendChild(lndv);
			if (i==y) {
				cur_line = lndv;
			}
		}
	}
	if (fast) tabdiv.innerText = outarr.join("\n");
	stat({go_to});
};//»
const make_lines=(which)=>{//«
	if (is_loading) return;
	bin_lines=[];
	text_lines=[];
	let _pgsz = ch_w*h;
	let pgsz = _pgsz;
	while (pgsz < MAX_PG_SZ) pgsz += _pgsz;
	let i=0;
	let finished = false;
	is_loading = true;
	nb_done = i;
	const dopage=()=>{
		if (stop_loading){
			did_stop_loading = true;
			return;
		}
		if (killed) return;
		let to = i+pgsz;
		if (to >= nb) {
			to = nb;
			finished = true;
		}
		stat();
		for (; i < to; i+=ch_w){
			nb_done = i;
			let binln=[];
			let txtln = [];
			for (let j=i; j < i+ch_w; j++){
				if (j >= nb) break;
				let byt = bytes[j];
				let binch = byt.toString(16).lpad(2,"0")
				binln.push(binch[0],binch[1]," ")
				if (byt >= 33 && byt <= 126) txtln.push(String.fromCharCode(byt),"\xa0"," ");
				else{
					txtln.push("\xa0","\xa0"," ");
				}
/*
				else {
					txtln.push(
					'<span style="opacity:0.75"'
					binch[0],binch[1], 
					'</span>'," "
					)
				}
*/
//				else txtln.push("\xa0","\xa0"," ");
			}
			text_lines.push(txtln);
			bin_lines.push(binln);
		}
		if (finished) {
			is_loading = false;
			stat();
			if (start_byte){
				scroll_num = Math.floor(start_byte/Math.floor(ncols/3));
				render();	
			}
		}
		else {
			setTimeout(()=>{
				dopage();
			},0);
		}
	}
	dopage();
	render({go_to: 0});
};//»

const resize=(if_init)=>{//«
	if (!lines) return;
	start_byte = char_w*scroll_num;
	let char_w_hold = char_w;
	wrapdiv._w=Main.clientWidth;
	wrapdiv._h=Main.clientHeight;
    ncols=nrows=0;
	getgrid();
	if (char_w === char_w_hold) return render();
	if (check_stop_loading_interval) {
		clearInterval(check_stop_loading_interval);
		check_stop_loading_interval = null;
	}
	if (!is_loading) return reinit();
	did_stop_loading = false;
	stop_loading = true;
	check_stop_loading_interval = setInterval(()=>{
		if (did_stop_loading){
			clearInterval(check_stop_loading_interval);
			check_stop_loading_interval = null;
			did_stop_loading = false;
			stop_loading = false;
			reinit();
		}
	}, 0);
};//»
const reinit=()=>{//«
	is_loading = false;
	tabdiv.innerHTML="";
	init();
}//»
const init = () =>{//«
	y=0;
	scroll_num=0;
	wrapdiv._w=Main.clientWidth;
	wrapdiv._h=Main.clientHeight;
    ncols=nrows=0;
    getgrid();
    if (!(ncols&&nrows)) return;
    w = ncols;
    h = nrows;
	ch_w = Math.floor(ncols/3);
	make_lines();
//	render({go_to: 0});
};//»

const goto_num = async()=>{//«
	if (is_going_to) return;
	is_going_to = true;

	let num = await popin(`Goto: 0-${nb-1}`, {enterOK: true});
	is_going_to = false;
	if (!num) return;
	num = parseInt(num);
	if (isNaN(num)) return;
	if (num<0) num=0;
	else if (num > nb-1) num = nb-1;
	scroll_num = Math.floor(num/ch_w);
	render({go_to: num});
}//»

const try_del_bytes = async()=>{//«

log("BACKSPACE");
let num_str = await popin(`Delete how many bytes?`, {enterOK: true});
if (!num_str) return;
let num = num_str.ppi();
if (isNaN(num)) return;
log(`DO DEL: ${num}`);
/*Get two slices: 0 -> x-num
*/
let pos = cur_pos();
if (num > pos){
cwarn(`Cannot delete > cur_pos(${pos}) bytes`);
return;
}
let slice1 = bytes.slice(0, pos - num);
let slice2 = bytes.slice(pos);
let new_blob = new Blob([slice1, slice2]);
let new_bytes = await toBytes(new_blob);
bytes = new_bytes;
nb = bytes.length;
nb_len = (nb.toString(BASE)).length;
for (let i=0; i < num; i++) key_left();
make_lines();

};//»
const try_ins_bytes = async()=>{//«
log("ADD NULL CH");

let num_str = await popin(`Add how many nulls?`, {enterOK: true});
if (!num_str) return;
let num = num_str.ppi();
if (isNaN(num)) return;
let pos = cur_pos();
log(`Add ${num} bytes at pos: ${pos}`);
//log(pos);
let begin = bytes.slice(0, pos);
let end = bytes.slice(pos);
let added = new Uint8Array(num);
//log
let new_blob = new Blob([begin, added, end]);
//log(new_blob);
start_byte = 0;
bytes = await toBytes(new_blob);
//log(bytes);
nb = bytes.length;
nb_len = (nb.toString(BASE)).length;
init();
//make_lines();
//log(bin_lines);
};//»

const key_left = ()=>{//«
if (!cur_span || cur_span.toggled) return;
if (cur_span.previousSibling){//«
	cur_span.off();
	cur_span = cur_span.previousSibling;
	cur_span.on();
	x--;
}//»
else if (cur_line.previousSibling){//«
	y--;
	cur_line = cur_line.previousSibling;
	cur_span.off();
	x = cur_line.children.length-1;
	cur_span = cur_line.children[x];
	cur_span.on();
}//»
else if (scroll_num > 0){//«
	scroll_num--;
	render();
	cur_line = tabdiv.children[0];
	x = cur_line.children.length - 1;
	cur_span.off();
	cur_span = cur_line.children[x];
	cur_span.on();
}//»
//log(cur_pos());
//log("POS", cur_pos());
//log("POS", cur_pos(), get_val_of_cursor());
};//»
const key_right = ()=>{//«
if (!cur_span || cur_span.toggled) return;
if (cur_span.nextSibling){//«
	cur_span.off();
	cur_span = cur_span.nextSibling;
	cur_span.on();
	x++;
}//»
else if (cur_line.nextSibling){//«
	y++;
	cur_span.off();
	cur_line = cur_line.nextSibling;
	x=0;
	cur_span = cur_line.children[x];
	cur_span.on();
}//»
else{//«
	scroll_num++;
	render();
	x=0;
	cur_line = tabdiv.children[tabdiv.children.length-1];
	cur_span.off();
	cur_span = cur_line.children[x];
	cur_span.on();
}//»
//log("POS", cur_pos(), get_val_of_cursor());
}//»
const key_down = ()=> {//«
	if (cur_span.toggled) return;
//log("cur_line", cur_line);
//log("cur_line.nextSibling", cur_line.nextSibling);
	if (cur_line.nextSibling){
//log(2);
		y++;
		cur_line = cur_line.nextSibling;
		cur_span.off();
		cur_span = cur_line.children[x];
		cur_span.on();
	}
	else{
//log(3);
//log("SCROLL DOWN");
//log("cur_line.nextSibling", !!cur_line.nextSibling);
		scroll_num++;
		render();
		cur_line = tabdiv.children[tabdiv.children.length-1];
		if (cur_line.children[x]) {
//log(4);
			cur_span.off();
			cur_span = cur_line.children[x];
			cur_span.on();
		}
		else{
//log(5);
			scroll_num--;
			render();
		}
	}
//log(cur_pos());
//log("POS", cur_pos());
//log("POS", cur_pos(), get_val_of_cursor());
}//»
const key_up = ()=>{//«
//	if (!cur_span) return;

	if (!cur_span) {
		if (scroll_num == 0) return;
		scroll_num--;
		render();
		return;
	}
	if (cur_span.toggled) return;

	if (cur_line.previousSibling){
		y--;
		cur_line = cur_line.previousSibling;
		cur_span.off();
		cur_span = cur_line.children[x];
		cur_span.on();
	}
	else if (scroll_num > 0){
		scroll_num--;
		render();
		cur_line = tabdiv.children[0];
		cur_span.off()
		cur_span = cur_line.children[x];
		cur_span.on()
	}
	else{
//			cwarn("TOP!");
	}

//log("POS", cur_pos(), get_val_of_cursor());
//log("POS", cur_pos());
//log(cur_pos());
}//»

const key_enter = ()=>{//«
if (!cur_span) return;
if (text_mode){
cwarn("Not editing value in text mode");
return;
}
if (cur_span.toggled) {//«
let strval;
let newval = cur_span._input.value;
if (newval.match(/^[0-9a-f][0-9a-f]$/i)){
cwarn("NEW VAL", newval);
strval = set_val_of_cursor(parseInt(`0x${newval}`));
}
else{
cwarn("Ignoring the value");
	strval = get_val_of_cursor();
}
	cur_span.innerHTML=`${strval[0]}${strval[1]} `;
	delete cur_span.toggled;
	cur_span.on();
//	render();
}//»
else {//«
//log("TOGGLE");
	cur_span.toggled=true;
	cur_span.off();
	//log(cur_span);
	let r = cur_span.getBoundingClientRect();
	let inp = make("input");
	inp.onmousedown = (e) => {//«
		e.stopPropagation();
		inp.focus();
	};//»
	inp.onclick=e=>{//«
		e.stopPropagation();
		inp.focus();
	}//»
	inp.oninput=(e)=>{//«
//cwarn(`${e.data}`);
		let dat = e.data;
		if (dat===null) return;
		let val = inp.value;
		if (!dat.match(/[0-9a-f]/i)){
			if (val.length==1) inp.value="";
			else if (val.length==2){
				if (dat == val[0]) inp.value = val[1];
				else if (dat == val[1]) inp.value = val[0];
			}
		}
	}//» 
	inp.style.maxWidth = `${r.width-7}px`;
	inp.setAttribute("maxlength", 2);
	inp._ff="monospace";
	inp.type="text";
	inp._fs = 21;
	cur_span.innerHTML="";
	cur_span._add(inp);
	cur_span._input = inp;
	let binch = get_val_of_cursor();
	inp.value = binch;
	inp.focus();
	inp.select();
}//»
}//»

const key_pgdown = ()=>{//«
	if (cur_span && cur_span.toggled) return;
	if(scroll_num+1+h>lines.length)return;
	scroll_num+=h;
	if (scroll_num+h > lines.length) scroll_num = lines.length-h;
	render();
	cur_line = tabdiv.children[tabdiv.children.length-1];
	if (cur_span) cur_span.off();
	cur_span = cur_line.children[x];
	cur_span.on();
};//»
const key_pgup = ()=>{//«
	if (cur_span && cur_span.toggled) return;
	scroll_num -=h;
	if (scroll_num<0)scroll_num=0;
	render();
	cur_line = tabdiv.children[0];
	if (cur_span) cur_span.off();
	cur_span = cur_line.children[x];
	cur_span.on();
};//»
const key_home = ()=> {//«
	if (cur_span && cur_span.toggled) return;
	if (scroll_num == 0 ) return;
	scroll_num=0;
	render();
};//»
const key_end = ()=> {//«
	if (cur_span && cur_span.toggled) return;
	if (scroll_num == lines.length-h) return;
	scroll_num = lines.length-h;
	render();
};//»

const toggle_text_mode = ()=>{//«
	text_mode = !text_mode;
	render();
};//»
const toggle_base_of_line_nums = ()=> {//«
	if (BASE==10) BASE=16;
	else BASE=10;
	nb_len = (nb.toString(BASE)).length;
	render();
}//»

//»

//CBs«

this.onresize=resize;
this.onloadfile=arg=>{//«
//cwarn("BINEDIT!!!");
	start_byte = 0;
	bytes=arg;
	nb = bytes.length;
	nb_len = (nb.toString(BASE)).length;
	init();
};//»
this.onkill = () => {//«
	killed = true;
	lines = text_lines = bin_lines = null;
	if (check_stop_loading_interval){
		clearInterval(check_stop_loading_interval);
	}
};//»
this.onappinit = ()=>{
bytes = new Uint8Array(0);
cwarn("APPINIT");
};
const open_new_window = ()=>{
cwarn("OPEN NEW!");
}
const save_context_cb = async()=>{
cwarn(`SAVE_CB (FP:${!!Win.fullpath})`);
log(`FP<${Win.fullpath}>`);
if (globals.read_only) return popup("Cannot save in 'read only' mode");
let rv = await Win.saveFile();
if (Number.isFinite(rv)) {
    messdiv.innerText = `${rv} bytes written`;
//  Win.saveFlash();
}
};
this.getContext = ()=>{//«
//  if (view_only) return [];
    let as="";
    if (!Win.fullpath) as = "\xa0as...";
//  let use_save = view_only ? undefined : save_context_cb;
    let arr = ["New::Alt+w", open_new_window, `Save${as}::Ctrl+s`, save_context_cb]
/*«
    if (!Win.fullpath){
        arr.push("Set\xa0file\xa0extension");
        let ext_func_arr=[];
        for (let i=0; i < EXTENSIONS.length; i++){
            if (i===USE_EXT) continue;
            ext_func_arr.push(EXTENSIONS[i],()=>{USE_EXT = i;});
        }
        arr.push(ext_func_arr);
        arr.push(`Current\xa0Ext:\xa0${EXTENSIONS[USE_EXT]}`,null);
    }
»*/
    return arr;
};//»
this.getValue = ()=>{
return bytes;
};

this.onescape=()=>{//«
//log("ESCAPE!");
if (!cur_span) return;
if (cur_span.toggled) {
	let binch = get_val_of_cursor();
	cur_span.innerHTML=`${binch[0]}${binch[1]} `;
	delete cur_span.toggled;
	render({go_to: cur_pos()});
//	cur_span.on();
}
return true;
};//»
this.onkeydown=async(e,k)=>{//«

if (k=="ENTER_") key_enter();
else if (k=="RIGHT_") key_right();
else if(k=="LEFT_") key_left();
else if (k=="DOWN_") key_down();
else if (k=="UP_") key_up();

else if(k=="PGDOWN_") key_pgdown();
else if(k=="PGUP_") key_pgup();
else if (k=="HOME_") key_home();
else if (k=="END_") key_end();
else if (k=="\x20_") toggle_text_mode();
	
else if (k=="/_") goto_num();
else if (k=="h_") toggle_base_of_line_nums();

else if (k=="RIGHT_C") try_ins_bytes();
else if (k=="LEFT_C") try_del_bytes();
	
else if (k=="m_"){//«
	let ln_num = y+scroll_num;
	let ln_x = x * 3;
	log(bin_lines[ln_num][ln_x], bin_lines[ln_num][ln_x+1], `(${text_lines[ln_num][ln_x]})`);
}//»
else if (k=="p_"){//«
cwarn(cur_pos());
}//»
else if (k=="l_"){//«
log(cur_line, cur_line.nextSibling);
}//»
else if (k=="r_"){//«
cwarn("RENDER");
render();
}//»
else if (k=="s_C"){
//cwarn("SAVE???");
save_context_cb();
}
};//»


log("dev.BinEdit");

//»

}

/*
this.onkeyup=(e,k)=>{
	if (["DOWN_","UP_","PGDOWN_","PGUP_"].includes(k)) render();
};
*/
})();
