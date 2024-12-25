/*12/24/24: How about a background console to be used for the outputs of:
1)
	~$ some_command.sh &

2) Running scripts/commands in a "screen mode" application like vim?

*/
//«Notes
/*12/19/24: @EIOFJKL: In ondevreload, need a way to "refresh" command modules like «
vim (and log) that are currently running.
»*/
/*12/18/24:«

A "log" is an array inside the consoleLog object of util. If we call nlog, this
is a "named log", such that the first arg is the "name", which will show up
after the array subscript on the screen. It might be truncated here, but the
whole name will go on the bottom when it is highlighted. So we can have a log
command that uses the current "inspect" command in order to show an easily
keyboard-traversable array of logged objects.  I think we are going to want to
"auto refresh"

[0]<Opt Name here>: <value>...

»*/
/*12/14/24: IMPORTANT: In-vim dev and putting the choice for sh.devexecute or sh.execute«
on the level of the ScriptCom @WLKUIYDP rather than in the Terminal @PLDYHJKU.
So now everything manually entered into the terminal passes through to the old school
parsing/execution engine.

Let's just do the development in vim for a Runtime class by way of doing a
URL.createObjectURL script.

We will just put text like this into vim:

<----------------------   START   ----------------------->

LOTW.globals.ShellMod.Runtime = class {

	constructor(ast, term, opts={}){
		this.ast = ast;
		this.term = term;
		this.opts = opts;
	}

	async execute(){

		//Do stuff with this.ast

	}

}

<----------------------    END    ----------------------->

Then a certain function in vim will get the string, and do:
let url = Object.createObjectURL(new Blob([str]));

Then we can make a script with this, which we can hold in a variable like:
cur_shellmod_dev_script, and then delete it from the DOM tree whenever we
do it again.

»*/
/*12/13/24: Now with our shell logic nicely "bundled up", we can start thinking about it as«
a "real" object with various parts (like methods) that we can add to it from
the outside, in order to develop our own logic that gets added onto it, for
example, in our own vim. ShellMod is like a "top level" LOTW module (like under
lotw/mods), and the ShellMod.Shell 'new function()' keeps all the nitty-gritty
implementation details nicely bundled up. This function has an execute method
that does the old style of "flat" (naive) parsing, while the devparse method is
the interface into the new _DevParser class (it currently just "compiles" to an
ast... with no executing of anything).
»*/
/*@DLOPOEIRU: Why is there a scroll_into_view here? This messes up the line that«
the cursor is on, when we are inside of a multi-line command line:
<---   TERMINAL WIDTH   ----->

~$ echo blah blah blah hahah h
ooo hoooo thing in the place i
s something that is

Say the cursor is editing the "echo" command at the very beginning. Every time
you do keydown, the scroll_into_view causes the cursor to jump to the last line
(where "something" is). The x-position will be whatever position it was on
the first line (or at the end of the last line if the x was past it).

We *still do* need to do a scroll_into_view, when the lines are at the bottom
of the screen (which I see now that simply doing Ctrl+e, or even just holding
down the left arrow still does the proper scrolling.) So, it might be just the
best to keep everything as it is for now (so we don't have to worry about the
case when doing scroll_into_view would put the cursor in an
offscreen/negative-y position).

»*/
//»
//«Global Shell Options

//let USE_ONDEVRELOAD = true;
let USE_ONDEVRELOAD = false;

//let USE_DEVPARSER = false;
let USE_DEVPARSER = true;

//»

//Imports«

const util = LOTW.api.util;
const globals = LOTW.globals;
const{Desk}=LOTW;
const {
	strNum,
	isArr,
	isStr,
	isNum,
	isObj,
	isNode,
	isDir,
	isFile,
	isErr,
	make,
	kc,
	log,
	jlog,
	cwarn,
	cerr,
	normPath,
	linesToParas,
	isBool,
	isEOF,
	sleep
} = util;
const NS = LOTW;
const {
	KC,
	DEF_PAGER_MOD_NAME,
//	NS,
	TEXT_EDITOR_APP,
	LINK_APP,
	FOLDER_APP,
	FS_TYPE,
	MOUNT_TYPE,
	SHM_TYPE,
	fs,
	isMobile,
	dev_mode,
	admin_mode,
	EOF
} = globals;
const fsapi = fs.api;
const widgets = NS.api.widgets;
const {poperr} = widgets;

const HISTORY_FOLDER = `${globals.HOME_PATH}/.history`;
const HISTORY_PATH = `${HISTORY_FOLDER}/shell.txt`;
const HISTORY_PATH_SPECIAL = `${HISTORY_FOLDER}/shell_special.txt`;
const LEFT_KEYCODE = KC.LEFT;

const DEL_MODS=[
//	"util.less",
	"term.vim",
	"term.log"
];
const DEL_COMS=[
//	"audio"
//	"yt",
//	"test",
	"fs",
//	"mail"
//	"esprima",
//"shell"
];
const ADD_COMS=[
//"esprima"
];

if (dev_mode){
//	ADD_COMS.push("shell");
}
//»

//Terminal«

export const app = function(Win) {

//Var«

const ShellMod = globals.ShellMod;
const Shell = ShellMod.Shell;

const TABSIZE = 4;
const TABSIZE_MIN_1 = TABSIZE-1;

const {main, Desk, statusBar: status_bar} = Win;
const topwin = Win;
const winid = topwin.id;
const termobj = this;
const Term = this;
//this.appClass = "cli";
let appclass = "cli";

let is_editor = false;
let is_pager = false;

const CURSOR_ID = `cursor_${winid}`;
this.cursor_id = CURSOR_ID;
this.mainWin = main;

const ENV = globals.TERM_ENV;

//Editor mode constants for the renderer (copy/pasted from vim.js)«
//XKIUO
const COMMAND_MODE = 1;
const INSERT_MODE = 2;
const REPLACE_MODE = 3;
const VIS_LINE_MODE = 4;
const VIS_MARK_MODE = 5;
const VIS_BLOCK_MODE = 6;
const CUT_BUFFER_MODE = 7;
const LINE_WRAP_MODE = 8;
const SYMBOL_MODE = 9;
const FILE_MODE = 10;
const COMPLETE_MODE = 11;

//»

let PARAGRAPH_SELECT_MODE = true; //Toggle with Ctrl+Alt+p«
/*
When using the text editor, we have to manually insert line breaks inside of paragraphs
at the end of every line:

-------------------------------------
These are a bunch of words that I'm   
writing, so I can seem very
literate, and this is a crazily-
hyphenated-word!

Here comes another paragraph...
-------------------------------------

With PARAGRAPH_SELECT_MODE turned on, the system clipboard will contain the following
text upon executing the do_copy_buffer command with Cltr+Alt+a (a_CA).

-------------------------------------
These are a bunch of words that I'm writing, so I can seem very literate, and this is a crazily-hyphenated-word!

Here comes another paragraph...
-------------------------------------

The actual line buffer in the editor is left unchanged. This is just a convenience function
to allow for seamless copying between the editor and web-like applications that handle their 
own formatting of paragraphs.

Toggling of PARAGRAPH_SELECT_MODE is now done with Ctrl+Alt+p (p_CA).

»*/

let highlight_actor_bg = false;
let ACTOR_HIGHLIGHT_COLOR = "#101010";
//let ACTOR_HIGHLIGHT_COLOR = "#141414";

//vim row folds
let ROW_FOLD_COLOR = "rgb(160,160,255)";

let did_init = false;
this.Desk = Desk;
this.winid = winid;
this.numId = winid.split("_")[1];
this.topwin = topwin;

let kill_funcs = []; 

let MIN_TERM_WID = 15;
//let terminal_locked  = false;

let is_scrolling = false;
let wheel_iter;
let dblclick_timeout;
let downevt=null;

let MAX_TAB_SIZE=256;
const com_completers = ["help", "app", "appicon", "lib", "import"];

const STAT_OK=1;
const STAT_WARNING=2;
const STAT_ERROR=3;

let nrows, ncols;
let x=0, y=0;
let w,h;
let xhold,yhold;
let hold_x, hold_y;

let actor;
//let editor;
//let pager;

let num_ctrl_d = 0;
let CLEAN_COPIED_STRING_MODE = false;
let DO_EXTRACT_PROMPT = true;
const MAX_OVERLAY_LENGTH = 42;
let overlay_timer = null;
let TERMINAL_IS_LOCKED = false;
//let buffer_scroll_num = null;
let buffer_hold;
let line_height;

let FF = "monospace";
//let FW = "600";
let FW = "500";
let CURBG = "#00f";
let CURFG = "#fff";
let CURBG_SSH_MODE = "#C00";
let CURBG_BLURRED = "#444";
let OVERLAYOP = "0.66";
let TCOL = "#e3e3e3";

let topwin_focused = true;
let no_prompt_mode = false;

let min_height;

let com_scroll_mode = false;

let num_stat_lines = 0;
let scroll_num = 0;
let scrollnum_hold;

let min_fs = 8;
let def_fs = 24;
let gr_fs;

this.scroll_num = scroll_num;
this.ENV = ENV;

let max_scroll_num=50;
let max_fmt_len = 4997;

let last_com_str=null;
let last_mode;

let root_state = null;
let cur_shell = null;
//let shell_class = null;
//let dev_shell_class = null;
let ls_padding = 2;
let await_next_tab = null;

let cur_prompt_line = 0;
let cur_scroll_command;
let prompt_str;
let prompt_len;
//let buf_lines = [];
let lines = [];
let line_colors = [];
let lines_hold_2;
let lines_hold;
let line_colors_hold;

let current_cut_str = "";

let history = [];

let command_hold = null;
let command_pos_hold = 0;
let bufpos = 0;

let sleeping = null;

let cur_ps1;

const OK_READLINE_SYMS=["DEL_","BACK_","LEFT_", "RIGHT_"];
let stat_spans;

let hold_terminal_screen;
//let cur_dir;

//»

//DOM«
let BGCOL = "#080808";
let overdiv = make('div');//«
overdiv._pos="absolute";
overdiv._loc(0,0);
overdiv._w="100%";
overdiv._h="100%";
topwin.overdiv=overdiv;
//»
let wrapdiv = make('div');//«
wrapdiv.id="termwrapdiv_"+winid;
wrapdiv._bgcol=BGCOL;
wrapdiv._pos="absolute";
wrapdiv._loc(0,0);
wrapdiv._tcol = TCOL;
wrapdiv._fw = FW;
wrapdiv._ff = FF;
wrapdiv.style.whiteSpace = "pre";
//»
let tabdiv = make('div');//«
tabdiv.id="termtabdiv_"+winid;
tabdiv.style.userSelect = "text"
tabdiv._w="100%";
tabdiv._pos="absolute";
tabdiv.onmousedown=(e)=>{downevt=e;};
tabdiv.onmouseup=e=>{//«
	if (!downevt) return;
	let d = util.dist(e.clientX,e.clientY,downevt.clientX, downevt.clientY);
	if (d < 10) return;
	focus_or_copy();
};//»
tabdiv.onclick=e=>{//«
	e.stopPropagation();
	if (dblclick_timeout){
		clearTimeout(dblclick_timeout);
		dblclick_timeout=null;
		setTimeout(focus_or_copy,333);
		return;
	}
	setTimeout(focus_or_copy,500);
};//»
tabdiv.ondblclick=e=>{e.stopPropagation();dblclick_timeout=setTimeout(focus_or_copy,500);}
tabdiv._loc(0,0);
tabdiv.style.tabSize = TABSIZE;
this.tabsize = parseInt(tabdiv.style.tabSize);
wrapdiv.tabdiv = tabdiv;
//»
let statdiv = make('div');
statdiv._w="100%";
statdiv._h="100%";
statdiv._pos="absolute";
statdiv._loc(0,0);
//log(statdiv);
let textarea;
let areadiv;
if (!isMobile) {
	textarea = make('textarea');
	textarea.id = `textarea_${Win.id}`;
	textarea._noinput = true;
	textarea.width = 1;
	textarea.height = 1;
	textarea.style.opacity = 0;
	textarea.focus();
	this.textarea = textarea; 
}

	areadiv = make('div');
	areadiv._pos="absolute";
	areadiv._loc(0,0);
	areadiv._z=-1;
	if (textarea) {
		areadiv.appendChild(textarea);
	}
	this.areadiv = areadiv;
	main._tcol="black";
	main._bgcol=BGCOL;

//let overlay;«

let fakediv = make('div');
fakediv.innerHTML = '<div style="opacity: '+OVERLAYOP+';border-radius: 15px; font-size: xx-large; padding: 0.2em 0.5em; position: absolute; -webkit-user-select: none; transition: opacity 180ms ease-in; color: rgb(16, 16, 16); background-color: rgb(240, 240, 240); font-family: monospace;"></div>';
let overlay = fakediv.childNodes[0];
overlay.id = "overlay_"+winid;

//»

//Listeners«
const onpaste = e =>{//«
//	if (pager) return;
	textarea.value="";
	setTimeout(()=>{
		let val = textarea.value;
		if (!(val&&val.length)) return;
		if (is_editor) actor.check_paste(val);
		else dopaste();
	}
	,25);
}//»
if (textarea) textarea.onpaste = onpaste;
main.onwheel=e=>{//«
	if (!sleeping){
		let dy = e.deltaY;
		if (!is_scrolling){
			if (!scroll_num) return;
			if (dy > 0) return;
			scrollnum_hold = scroll_num;
			is_scrolling = true;
			wheel_iter = 0;
		}
		let skip_factor = 10;
/*
		if (ENV.SCROLL_SKIP_FACTOR){
			let got = ENV.SCROLL_SKIP_FACTOR.ppi();
			if (!Number.isFinite(got)) cwarn(`Invalid SCROLL_SKIP_FACTOR: ${ENV.SCROLL_SKIP_FACTOR}`);
			else skip_factor = got;
		}
*/
		wheel_iter++;
		if (wheel_iter%skip_factor) return;
		if (dy < 0) dy = Math.ceil(4*dy);
		else dy = Math.floor(4*dy);
		if (!dy) return;
		scroll_num += dy;
		if (scroll_num < 0) scroll_num = 0;
		else if (scroll_num >= scrollnum_hold) {
			scroll_num = scrollnum_hold;
			is_scrolling = false;
		}
		render();
	}
};//»
main.onscroll=e=>{e.preventDefault();scroll_middle();};
main.onclick=()=>{
	textarea&&textarea.focus();
}
overdiv.onmousemove = e=>{//«
	e.stopPropagation();
	if (Desk) Desk.mousemove(e);
};//»
//»
wrapdiv.appendChild(tabdiv);
main.appendChild(wrapdiv);
main.appendChild(areadiv);
//»

//Util«

const stat=mess=>{status_bar.innerText=mess;};

const get_line_from_pager=async(arr, name)=>{//«

	if (!await util.loadMod(DEF_PAGER_MOD_NAME)) {
		return poperr("Could not load the pager module");
	}
	let less = new NS.mods[DEF_PAGER_MOD_NAME](this);
	if (await less.init(arr, name, {lineSelect: true, opts: {}})) return arr[less.y+less.scroll_num];

}//»
const select_from_history = async path => {//«
	let arr = await path.toLines();
	if (!isArr(arr) && arr.length) {
cwarn("No history lines from", path);
		return;
	}
	cur_scroll_command = await get_line_from_pager(arr, path.split("/").pop());
	if (cur_scroll_command) insert_cur_scroll();
	render();
}//»

const save_special_command = async () => {//«
	let s = get_com_arr().join("");
	if (!s.match(/[a-z]/i)) {
log("Not saving", s);
		return;
	}
	if (await fsapi.writeFile(HISTORY_PATH_SPECIAL, `${s}\n`, {append: true})) return do_overlay(`Saved special: ${s}`);
	poperr(`Could not write to: ${HISTORY_PATH_SPECIAL}!`);
};//»
const write_to_history = async(str)=>{//«
	if (!await fsapi.writeFile(HISTORY_PATH, `${str}\n`, {append: true})) {
cwarn(`Could not write to history: ${HISTORY_PATH}`);
	}
};//»
const save_history = async()=>{//«
	if (!await fsapi.writeFile(HISTORY_PATH, history.join("\n")+"\n")){
		poperr(`Problem writing command history to: ${HISTORY_PATH}`);
	}
};//»
const execute_kill_funcs=(cb)=>{//«
	let iter = -1;
	let dokill=()=>{
		iter++;
		let fn = kill_funcs[iter];
		if (!fn) {
			kill_funcs = [];
			if (cb) cb();
			return
		}
		fn(dokill);
	}
	dokill();
};//»
const toggle_paste=()=>{//«

	if (textarea){
		textarea._del();
		textarea = null;	
		do_overlay("Pasting is off");
		return;
	}
	textarea = make('textarea');
	textarea._noinput = true;
	textarea.width = 1;
	textarea.height = 1;
	textarea.style.opacity = 0;
	textarea.onpaste = onpaste;
	areadiv.appendChild(textarea);
	textarea.focus();
	do_overlay("Pasting is on");

};//»

const dopaste=()=>{//«
	let val = textarea.value;
	if (val && val.length) handle_insert(val);
	textarea.value="";
}
//»
const check_scrolling=()=>{//«
	if (is_scrolling){
		scroll_num = scrollnum_hold;
		is_scrolling = false;
		render();
		return true;
	}
	return false;
}//»

const wrap_line = (str)=>{//«
	str = str.replace(/\t/g,"\x20".rep(this.tabsize));
	let out = '';
	let w = this.w;
	while (str.length > w){
		if (!out) out = str.slice(0,w);
		else out = out+"\n"+str.slice(0,w);
		str = str.slice(w);
	}
	if (str.length>0){
		if (!out) out = str;
		else out = out+"\n"+str;
	}
	return out;
};//»

const fmt_ls = (arr, lens, ret, types, color_ret, col_arg)=>{//«
//const fmt_ls=(arr, lens, ret, types, color_ret, start_from, col_arg)=>{

/*_TODO_: In Linux, the ls command lists out (alphabetically sorted) by columns, but 
here we are doing a row-wise listing! Doing this in a column-wise fashion (cleanly and 
efficiently) is an outstanding issue...*/

	let pad = ls_padding;
//	if (!start_from) start_from=0;
	if (col_arg == 1) {//«
		for (let i=0; i < arr.length; i++) {
			if (w >= arr[i].length) ret.push(arr[i]);
			else {
				let iter = 0;
//JSOJPRI
				while (true) {
					let str = arr[i].substr(iter, iter+w);
					if (!str) break;
					ret.push(str);
					iter += w;
				}
			}
		}
		return;
	}//»
	const min_col_wid=(col_num, use_cols)=>{//«
		let max_len = 0;
		let got_len;
		let use_pad = pad;
		for (let i=col_num; i < num ; i+=use_cols) {
			if (i+1 == use_cols) use_pad = 0;
			got_len = lens[i]+use_pad;
			if (got_len > max_len) max_len = got_len;
		}
		return max_len;
	};//»
	let num = arr.length;
	let col_wids = [];
	let col_pos = [0];
	let max_cols = col_arg;
	if (!max_cols) {

//SURMPLRK
//Just need to find the number of entries that would fit on the first row.
//The next rows (if there are any) cannot possibly raise the max_cols value.
//If it changes, the next rows can only make max_cols go down.
//It is absolutely insane to assume to that each file name is 1 character long!!! (This makes max_cols ridiculously big, e.g. 80/3 => 26.666666)
//                    v---------------------------------------^^^^^^^^^^^^^^^^
//		let min_wid = 1 + pad;
//		max_cols = Math.floor(w/min_wid);
//		if (arr.length < max_cols) max_cols = arr.length;

//Updated to this:
		let tot_len = 0;
		for (let i=0; i < arr.length; i++){
			tot_len += arr[i].length;
			if (tot_len > w) {
				max_cols = i;
				if (!max_cols) {
//This means that the first name is too big, and so we will only have a 1 column listing
					max_cols = 1;
				}
				break;
			}
			tot_len+=ls_padding;
		}
		if (!max_cols) {
//We never broke out of the loop, so we can put the entire listing on one line,
//meaning that there are as many columns as there are directory entries.
			max_cols = arr.length;
		}
//End update

	}

	let num_rows = Math.floor(num/max_cols);
	let num_cols = max_cols;
	let rem = num%num_cols;
	let tot_wid = 0;
	let min_wid;
	for (let i=0; i < max_cols; i++) {
		min_wid = min_col_wid(i, num_cols);
		tot_wid += min_wid;
		if (tot_wid > w) {
//			fmt_ls(arr, lens, ret, types, color_ret, start_from, (num_cols - 1));
			fmt_ls(arr, lens, ret, types, color_ret, (num_cols - 1));
			return;
		}
		col_wids.push(min_wid);
		col_pos.push(tot_wid);
	}
	col_pos.pop();
	let matrix = [];
	let row_num;
	let col_num;
	let cur_row = -1;
	let xpos;
	for (let i=0; i < num; i++) {
		let typ;
		if (types) typ = types[i];
		let color;
		if (typ==ShellMod.var.dirType) color="#909fff";
		else if (typ==ShellMod.var.linkType) color="#0cc";
		else if (typ==ShellMod.var.badLinkType) color="#f00";
		else if (typ==ShellMod.var.idbDataType) color="#cc0";
		col_num = Math.floor(i%num_cols);
		row_num = Math.floor(i/num_cols);

		if (row_num != cur_row) {
			matrix.push([]);
			xpos=0;
		}
		let nm = arr[i];
		let str = nm + " ".rep(col_wids[col_num] - nm.length);
		matrix[row_num][col_num] = str;
		if (color_ret) {
//			let use_row_num = row_num+start_from;
			let use_row_num = row_num;
			if (!color_ret[use_row_num]) color_ret[use_row_num] = {};
			let uselen = nm.length;
			if (arr[i].match(/\/$/)) uselen--;
			if (color) color_ret[use_row_num][xpos] = [uselen, color];
		}
		xpos += str.length;
		cur_row = row_num;
	}
	for (let i=0; i < matrix.length; i++) ret.push(matrix[i].join(""));
	return;
};//»
const fmt2=(str, type, maxlen)=>{//«
    if (type) str = type + ": " + str;
    let ret = [];
    let w = this.w;
    let dopad = 0;
    if (maxlen&&maxlen < w) {
        dopad = Math.floor((w - maxlen)/2);
        w = maxlen;
    }

    let wordarr = str.split(/\x20+/);
    let curln = "";
    for (let i=0; i < wordarr.length; i++){
        let w1 = wordarr[i];
        if (((curln + " " + w1).length) >= w){
            if (dopad) ret.push((" ".repeat(dopad))+curln);
            else ret.push(curln);
            curln = w1;
        }
        else {
            if (!curln) curln = w1;
            else curln += " " + w1;
        }
        if (i+1==wordarr.length) {
            if (dopad) ret.push((" ".repeat(dopad))+curln);
            else ret.push(curln);
        }
    }
    return ret;
}
//»
const fmt = (str, startx)=>{//«
	if (str === this.EOF) return [];
	let use_max_len = get_max_len();
	if (str instanceof Blob) str = "[Blob " + str.type + " ("+str.size+")]"
	else if (str.length > use_max_len) str = str.slice(0, use_max_len)+"...";
	
//	if (type) str = type + ": " + str;
	let ret = [];
	let iter =  0;
	let do_wide = null;
	let marr;
	if (str.match && str.match(/[\x80-\xFE]/)) {
		do_wide = true;
		let arr = str.split("");
		for (let i=0; i < arr.length; i++) {
			if (arr[i].match(/[\x80-\xFE]/)) {
				arr.splice(i+1, 0, "\x03");
				i++;
			}
		}
		str = arr.join("");
	}
	let doadd = 0;
	if (startx) doadd = startx;
	if (!str.split) str = str+"";
	let arr = str.split("\n");
	let ln;
	for (ln of arr) {
		while((ln.length+doadd) >= w) {
			iter++;
			let val = ln.slice(0,w-doadd);
			if (do_wide) val = val.replace(/\x03/g, "");
			ret.push(val);
			ln = ln.slice(w-doadd);
			str = ln;
			doadd = 0;
		}
	}
	if (do_wide) ret.push(ln.replace(/\x03/g, ""));
	else ret.push(ln);
	return ret;
};//»
const fmt_lines_sync=(arr, startx)=>{//«
    let all = [];
	let usestart = startx;
    for (let i=0; i < arr.length; i++) {
		all = all.concat(fmt(arr[i],usestart));
		usestart = 0;
	}
    return all;
};//»

const obj_to_string = obj =>{//«
	if (obj.id) return `[object ${obj.constructor.name}(${obj.id})]`;
	return `[object ${obj.constructor.name}]`;
};//»
const get_history=async(val)=>{//«
	let fnode = await fsapi.pathToNode(HISTORY_FOLDER);
	if (!fnode){
		if (!await fsapi.mkDir(globals.HOME_PATH, ".history")){
cerr("Could not make the .history folder!");
			return;
		}
	}
	else if (fnode.appName !== FOLDER_APP){
		cwarn("History directory path is NOT a directory!!!");
		return;
	}
	let node = await fsapi.pathToNode(HISTORY_PATH);
	if (!node) return;
	let text = await node.text;
	if (!text) return;
	return text.split("\n");
}//»
const scroll_middle=()=>{//«
	let y1 = main.scrollTop;
	main.scrollTop=(main.scrollHeight-main.clientHeight)/2;
	let y2 = main.scrollTop;
};//»
const focus_or_copy=()=>{//«
	let sel = window.getSelection();
	if (sel.isCollapsed)textarea&&textarea.focus();
	else do_clipboard_copy();
};//»

const get_homedir=()=>{//«
	if (root_state) return "/";
	return globals.HOME_PATH;
};//»
const get_buffer = (if_str)=>{//«
//const get_buffer = (if_str, if_no_buf)=>{
	let ret=[];
	if (if_str) ret = "";
	let ln;

/*«
	if (!if_no_buf) {
		if (buf_lines) {
			for (let i=0; i < buf_lines.length; i++) {
				ln = buf_lines[i].join("").replace(/\u00a0/g, " ");
				if (if_str) ret +=  ln + "\n"
				else ret.push(ln);
			}
		}
	}
»*/

//	let actor = editor || pager;
	let uselines;
	if (actor && actor.get_lines) uselines = actor.get_lines();//in foldmode, vim's lines contain fold markers
	else uselines = lines;
	for (let i=0; i < uselines.length; i++) {
		ln = uselines[i].join("").replace(/\u00a0/g, " ");
		if (if_str) ret +=  ln + "\n"
		else ret.push(ln);
	}

	if (actor && (PARAGRAPH_SELECT_MODE || actor.parSel)){//Paragraph select mode
		if (if_str) ret = ret.split("\n");
		ret = linesToParas(ret);
		if (if_str) ret = paras.join("\n");
		else ret = paras;
	}

	return ret;
};
this.real_get_buffer=get_buffer;
this.get_buffer=()=>{return get_buffer();}
this.get_history = ()=>{
	return history;
};
//»
const cur_date_str=()=>{//«
	let d = new Date();
	return (d.getMonth()+1) + "/" + d.getDate() + "/" + d.getFullYear().toString().substr(2);
};//»
const extract_prompt_from_str=(str)=>{//«
	if (!DO_EXTRACT_PROMPT) return str;
	let prstr = get_prompt_str();
	let re = new RegExp("^"+prstr.replace("$","\\$"));
	if (re.test(str)) str = str.substr(prstr.length);
	return str;
};//»
const copy_text=(str, mess)=>{//«
	const SCISSORS_ICON = "\u2702";
	if (!textarea) return;
	if (!mess) mess = SCISSORS_ICON;
	textarea.focus();
	textarea.value = str;
	textarea.select();
	document.execCommand("copy")
	do_overlay(mess);
};//»
const do_clear_line=()=>{//«
	if (cur_shell) return;
	let str="";
	for (let i = lines.length; i > y+scroll_num+1; i--) str = lines.pop().join("") + str;
	let ln = lines[y+scroll_num];
	str = ln.slice(x).join("") + str;
	lines[y+scroll_num] = ln.slice(0, x);	
	if (cur_prompt_line < scroll_num) {
		scroll_num -= (scroll_num - cur_prompt_line);
		y=0;
	}
	current_cut_str = str;
	render();
};//»
const do_copy_buffer = () => { copy_text(get_buffer(true), "Copied: entire buffer"); };
const do_clipboard_copy=(if_buffer, strarg)=>{//«
const do_copy=str=>{//«
    if (!str) return;
    str = str.replace(/^[\/a-zA-Z]*[$#] /,"");
    let copySource = make("pre");
    copySource.textContent = str;
    copySource.style.cssText = "-webkit-user-select: text;position: absolute;top: -99px";
    document.body.appendChild(copySource);
    let selection = document.getSelection();
    let anchorNode = selection.anchorNode;
    let anchorOffset = selection.anchorOffset;
    let focusNode = selection.focusNode;
    let focusOffset = selection.focusOffset;
    selection.selectAllChildren(copySource);

    document.execCommand("copy")
    if (selection.extend) {
        selection.collapse(anchorNode, anchorOffset);
        selection.extend(focusNode, focusOffset)
    }
    copySource._del();
}//»
	let str;
	if (strarg) str = strarg;
	else if (if_buffer) str = get_buffer(true);
	else str = getSelection().toString()
	if (CLEAN_COPIED_STRING_MODE) {
		str = str.replace(/\n/g,"");
		str = extract_prompt_from_str(str);
	}
	else {
//cwarn("Do you really ever want this string to be stripped of newlines and the prompt? CLEAN_COPIED_STRING_MODE==false !!!");
	}

	do_copy(str);
	textarea&&textarea.focus();
	do_overlay(`Copied: ${str.slice(0,9)}...`);
};//»
const do_clipboard_paste=()=>{//«
	if (!textarea) return;
	textarea.value = "";
	document.execCommand("paste")
};//»
const do_overlay=(strarg)=>{//«
	let str;
	if (strarg) {
		str = strarg;
		if (str.length > MAX_OVERLAY_LENGTH) str = str.slice(0,MAX_OVERLAY_LENGTH)+"...";
	}
	else str = w+"x"+h;
	overlay.innerText = str;
	if (overlay_timer) clearTimeout(overlay_timer);
	else main.appendChild(overlay);
	util.center(overlay, main);
	overlay_timer = setTimeout(()=>{
		overlay_timer = null;
		overlay._del();
	}, 1500);
};
this.do_overlay = do_overlay;
//»
const set_new_fs=(val)=>{//«
	gr_fs = val;
	localStorage.Terminal_fs = gr_fs;
	wrapdiv._fs = gr_fs;
	resize();
};//»
const get_max_len=()=>{//«
	let max_len = max_fmt_len;
	let maxlenarg = ENV['MAX_FMT_LEN'];
	if (maxlenarg && maxlenarg.match(/^[0-9]+$/)) max_len = parseInt(maxlenarg);
	return max_len;
};//»
const check_line_len=(dy)=>{//«
	if (!dy) dy = 0;
	if (lines[cy()+dy].length > w) {
		let diff = lines[cy()+dy].length-w;
		for (let i=0; i < diff; i++) lines[cy()+dy].pop();
	}
};//»
const cx=()=>{return x;}
const cy=()=>{return y + scroll_num;}
const trim_lines=()=>{while (cur_prompt_line+1 != lines.length) lines.pop();};

//»
//Render«

const render = (opts={})=>{

//Var«

//	let actor = editor||pager;
	let stat_x;
	if (actor) {
		({stat_x, x,y,scroll_num}=actor);
		if (!stat_x) stat_x = x;
	}
	let seltop;
	let selbot;
	let selleft;
	let selright;
	let selmark;
	let stat_input_type;
	let stat_com_arr;
	let stat_message, stat_message_type;
	let num_lines;
	let ry;
	let mode;
	let symbol;
	let line_select_mode;

//WKKYTUHJ
	if (actor) ({stat_input_type,stat_com_arr,stat_message,stat_message_type, line_select_mode}=actor);
	if (!stat_input_type) stat_input_type="";
//	if (editor) ({splice_mode, macro_mode,visual_block_mode,tab_lines,visual_line_mode,visual_mode,show_marks,seltop,selbot,selleft,selright,selmark,error_cursor, opts, num_lines, ry}=editor);

	if (is_editor) ({mode,symbol,seltop,selbot,selleft,selright,selmark,opts,num_lines,ry}=actor);
	if (!(ncols&&nrows)) return;
	let visual_line_mode = (mode===VIS_LINE_MODE) || line_select_mode;
	if (line_select_mode) seltop = selbot = scroll_num+y;
	
	if (mode===SYMBOL_MODE||mode===COMPLETE_MODE){
		visual_line_mode = true;
		seltop = selbot = y+scroll_num;
	}
	let visual_block_mode = mode===VIS_BLOCK_MODE;
	let visual_mark_mode = mode===VIS_MARK_MODE;
	let visual_mode = visual_line_mode || visual_mark_mode || visual_block_mode;
	let docursor = false;
	if (opts.noCursor){}
	else if (!TERMINAL_IS_LOCKED) docursor = true;
	let usescroll = scroll_num;
//	let is_buf_scroll = false;
//	if (buffer_scroll_num!==null) {
//		usescroll = buffer_scroll_num;
//		is_buf_scroll = true;
//	}
	let scry=usescroll;
	let slicefrom = scry;
	let sliceto = scry + nrows;
	let uselines=[];
	let is_str = false;
	let x_scroll = 0;
	let usex = x-x_scroll;
	let outarr = [];
	let donum;
//»
	for (let i=slicefrom; i < sliceto; i++) {//«
		let ln = lines[i];
		if (ln){
			uselines.push(ln.slice());
			continue;
		}
		if (!is_editor){
			uselines.push([""]);
			continue;
		}
		let noline = ['<span style="color: #6c97c4;">~</span>'];
		noline._noline = true;
		uselines.push(noline);
	}//»
	let len = uselines.length;//«
	if (len + num_stat_lines != h) donum = h - num_stat_lines;
	else donum = len;//»
	for (let i = 0; i < donum; i++) {//«
		let ind;
		let arr = uselines[i];
		while((ind=arr.indexOf("&"))>-1) arr[ind] = "&amp;";
		while((ind=arr.indexOf("<"))>-1) arr[ind] = "&lt;";
		while((ind=arr.indexOf(">"))>-1) arr[ind] = "&gt;";

		if (!arr||(arr.length==1&&arr[0]=="")) arr = [" "];
		let gotit = arr.indexOf(null);
		if (gotit > -1) arr[gotit] = " ";
		let curnum = i+usescroll;
		let colobj = line_colors[curnum];

		if (visual_mode&&seltop<=curnum&&selbot>=curnum){//«

			if (visual_line_mode) {//«
				let ln_min1 = arr.length-1;
				if (ln_min1 == -1) ln_min1=0;
				arr[0] = '<span style="background-color:#aaa;color:#000;">'+(arr[0]||" ");
				arr[ln_min1] = (arr[ln_min1]||" ")+'</span>';
			}//»
			else if (visual_mark_mode){//«
				let useleft, useright;
				if (seltop==curnum && selbot==curnum){
					useleft = selleft;
					useright = selright;
				}
				else if (curnum > seltop && curnum < selbot){
					useleft = 0;
					useright = arr.length-1;
				}
				else if (seltop===curnum){
					useright = arr.length-1;
					useleft = (curnum==cy())?x:selmark;
				}
				else if (selbot===curnum){
					useleft = 0;
					useright = (curnum==cy())?x:selmark;
				}
				else{
throw new Error("WUTUTUTU");
				}
				useleft -= x_scroll;
				useright -= x_scroll;
				if (useleft < 0) useleft = 0;
				if (useright < 0) useright = 0;
				let str = '<span style="color:#000;background-color:#aaa;">'+(arr[useleft]||" ");
				arr[useleft]=str;
				if (useright == -1) useright = 0;
				if (arr[useright]) arr[useright] = arr[useright]+"</span>";
				else arr[useright] = "</span>";
			}//»
			else {//visual_block_mode«
				let str;
				if (arr[selleft]) str = '<span style="color:#000;background-color:#aaa;">'+(arr[selleft]||"");
				else str = " ";
				arr[selleft]=str;
				if (arr[selright]) arr[selright] = arr[selright]+"</span>";
				else arr[selright] = "</span>";
			}//»

		}//»
		else if (arr[0]=="\xd7"){//Folded row«
//This marker is reserved as the first character for folded rows
			if (tabdiv._x) arr=[];
			else {
				arr[0]=`<span style="color:${ROW_FOLD_COLOR};">${arr[0]}`
				arr[arr.length-1]=`${arr[arr.length-1]}</span>`;
			}
		}//»
		else if (colobj){//«
//		else if (colobj){
			let nums = Object.keys(colobj);
			for (let numstr of nums) {
				if (numstr.match(/^_/)) continue;
				let num1 = parseInt(numstr)-x_scroll;
				let obj = colobj[numstr];
				let num2 = num1 + obj[0]-1;
				let col = obj[1];
				let bgcol = obj[2];
				let str = '<span style="color:'+col+";";
				if (bgcol) str += "background-color:"+bgcol+";"
				if (!arr[num1]) str += '"> ';
				else str += '">'+arr[num1];
				arr[num1] = str;
				if (arr[num2]) arr[num2] = arr[num2]+"</span>";
				else arr[num2] = "</span>";
//log(2, arr);
if (num2 > w) {
//console.log("LONGLINE");
	break;
}
			}
		}//»

		if (!(is_pager||stat_input_type||is_scrolling)) {//«
//		if (!(is_pager||is_buf_scroll||stat_input_type||is_scrolling)) {
			if (docursor && i==y) {
				let usebg;
				if (!topwin_focused) usebg = CURBG_BLURRED;
//				else if (this.ssh_immediate_mode) usebg = CURBG_SSH_MODE;
				else usebg = CURBG;
				if (!arr[usex]||arr[usex]=="\x00") arr[usex]=" ";
				else if (arr[usex]=="\n") arr[usex] = " <br>";
				let ch = arr[usex]||" ";
				let pre="";
				let usech;
				if (ch.match(/^</)&&!ch.match(/>$/)){
					let arr = ch.split(">");
					usech = arr.pop();
					pre = arr[0]+">";
				}
				else usech = ch;
				if (!usech.length) usech = " ";
				let sty = `background-color:${usebg};color:${CURFG}`;
				arr[usex] = pre+`<span id="${CURSOR_ID}" style="${sty}">${usech}</span>`;
			}
		}//»

		let s = arr.join("");
		if (actor && !arr._noline && highlight_actor_bg) outarr.push(`<span style="background-color:${ACTOR_HIGHLIGHT_COLOR};">${s}</span>`);
		else outarr.push(s);

	}//»
	if (actor) {//«
		let usestr;
		if (stat_input_type) {//«
			let arr,ind;
			if (!stat_com_arr.slice) arr = [];
			else arr = stat_com_arr.slice();
			while((ind=arr.indexOf("&"))>-1) arr[ind] = "&amp;";
			while((ind=arr.indexOf("<"))>-1) arr[ind] = "&lt;";
			while((ind=arr.indexOf(">"))>-1) arr[ind] = "&gt;";
			if (stat_input_type=="s/") arr.push("/");
			if (!arr[stat_x]) arr[stat_x] = " ";
			let arrstr=arr.join("");
			arr[stat_x] = `<span style="background-color:${CURBG};color:${CURFG}">${arr[stat_x]}</span>`;
			if (visual_mode&&stat_input_type===":") {
//			if (visual_line_mode&&stat_input_type===":") {
//				usestr = `${stat_input_type}'&lt;,'&gt;${arr.join("")}`;
				usestr = `:'&lt;,'&gt;${arr.join("")}`;
			}
			else {
				usestr = stat_input_type + arr.join("");
			}
		}//»
		else if (is_editor) {//«
			let mess="", messtype, messln=0;
			if (stat_message) {//«
				mess = stat_message;
				messln = mess.length;
				mess = mess.replace(/&/g,"&amp;");
				mess = mess.replace(/</g,"&lt;");

				let typ = stat_message_type;
				let bgcol=null;
				let tcol="#000";
				if (typ==STAT_OK) bgcol="#090";
				else if (typ==STAT_WARNING) bgcol="#dd6";
				else if (typ==STAT_ERROR) {
					bgcol="#c44";
					tcol="#fff";
				}
				if (bgcol) mess = `<span style="color:${tcol};background-color:${bgcol}">${mess}</span>`;

//				editor.stat_message=null;
				actor.stat_message=null;
				actor.stat_message_type=null;
			}//»
			else {//«
				if (mode === INSERT_MODE) mess = "-- INSERT --";
				else if (mode === REPLACE_MODE) mess = "-- REPLACE --";
				else if (mode == SYMBOL_MODE) {
					if (symbol) mess = `-- SYMBOL: ${symbol} --`;
					else mess = "-- SYMBOL --";
				}
				else if (mode === COMPLETE_MODE) {
					mess = `-- COMPLETE: ${symbol} --`;
				}
				else if (visual_line_mode) mess = "-- VISUAL LINE --";
				else if (visual_mark_mode) mess = "-- VISUAL --";
				else if (visual_block_mode) mess = "-- VISUAL BLOCK --";
				else if (mode === FILE_MODE) mess = "-- FILE --";
				else if (mode === CUT_BUFFER_MODE) mess = `-- CUT BUFFER: ${actor.cur_cut_buffer+1}/${actor.num_cut_buffers} --`;
				else if (mode === LINE_WRAP_MODE) mess = "-- LINE WRAP --";
				messln = mess.length;
			}//»
			let per;
			let t,b;
			if (scroll_num==0) t = true;
			if (!lines[sliceto-1]) b=true;
			if (t&&b) per = "All";
			else if (t) per="Top";
			else if (b) per = "Bot";
			else {
				if (Number.isFinite(ry)) {
					per = Math.floor(100*ry/num_lines)+"%";
				}
				else {
					let val = Math.floor(100*scroll_num/lines.length-1);
					per = (val)+"%";
				}
			}
			let perln = per.length;
			let perx = w-5;
			if (perln > 4) per = "?%";
			per = "\x20".repeat(4-perln)+per;
			let lncol;
			if (mode===LINE_WRAP_MODE){
				lncol = (actor.line_wrap_y+1)+","+(actor.line_wrap_x+1);
			}
			else{
				lncol = (ry+1)+","+(x+1);
			}
			let lncolln = lncol.length;
			let lncolx = w - 18;
			let diff = lncolx - messln;
			if (diff <= 0) diff = 1;
			let diff2 = (perx - lncolx - lncolln);
			if (diff2 <= 0) diff2 = 1;
			let spaces = "\x20".repeat(diff) + lncol + "\x20".repeat(diff2)+per;
			let str = mess + spaces;
			usestr = `<span>${str}</span>`;

		}//»
		else if (stat_message){//«
			usestr = stat_message;
			usestr = usestr.replace(/&/g,"&amp;");
			usestr = usestr.replace(/</g,"&lt;");
			stat_message = null;
		}//»
		else if(is_pager){//«
			let per = Math.floor(100*(usescroll+donum)/lines.length);
			if (per > 100) per = 100;
			let usename = (actor.fname+" ")||"";
			usestr = `${usename}${per}% of ${lines.length} lines (press q to quit)`;
			if (!stat_input_type) usestr = '<span style=background-color:#aaa;color:#000>'+usestr+'</span>'
		}//»
		update_stat_lines([usestr]);
	}//»
	if (min_height && h < min_height){
		tabdiv.innerHTML=`<center><span style="background-color:#f00;color:#fff;">Min height: ${min_height}</span></center>`;
	}
	else {
		tabdiv.innerHTML = outarr.join("\n");
	}
};

const generate_stat_html=()=>{//«
	stat_spans = [];
	statdiv.innerHTML="";
	let n_cont_lines = nrows - num_stat_lines;
	let s='';
	for (let i=0; i < n_cont_lines; i++) {
		let sp = make('div');
		sp.innerHTML=" ";
		statdiv.appendChild(sp);
	}
	for (let i=0; i < num_stat_lines; i++) {
		let sp = make('div');
		sp.innerHTML=" ";
		stat_spans.push(sp);
		statdiv.appendChild(sp);
	}
};//»
const update_stat_lines=(arr)=>{//«
if (!num_stat_lines) return;
	let arrlen = arr.length;
	if (arrlen!=num_stat_lines){
cerr("What is the array size different from the num_stat_lines????");
		return;
	}
	if (arrlen==1) {
		stat_spans[0].innerHTML=arr[0];
		return;
	}
	for (let i=0; i < num_stat_lines; i++) stat_spans[i].innerHTML = arr[i];
};//»

//»
//Curses«

const getgrid=()=>{//«
	let tdiv = tabdiv;
	if (!(wrapdiv._w&&wrapdiv._h)) {
		if (topwin.killed) return;
cerr("DIMS NOT SET");
		return;
	}
	let usech = "X";

	let str = "";
	let iter = 0;
	wrapdiv._over="auto";
	while (true) {
		if (topwin.killed) return;
		str+=usech;
		tdiv.innerHTML = str;
		if (tdiv.scrollWidth > wrapdiv._w) {
			tdiv.innerHTML = usech.repeat(str.length-1);
			wrapdiv._w = tdiv.clientWidth;
			ncols = str.length - 1;
			break;
		}
		iter++;
		if (iter > 10000) {
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
		if (iter > 10000) {
log(wrapdiv);
			return cwarn("INFINITE LOOP ALERT DOING HEIGHT: " + tdiv.scrollHeight + " > " + h);
		}
	}
	tdiv.innerHTML="";
	wrapdiv._over="hidden";
};//»
const clear_table=()=>{//«
	lines = [];
	line_colors = [];
	y=0;
	scroll_num = 0;
	render();
};//»
const clear=()=>{//«
//log("????");
//const clear=(if_keep_buffer)=>{
//	clear_table(if_keep_buffer);
	clear_table();
//	if (if_keep_buffer) cur_prompt_line = y;
};
//»
const shift_line=(x1, y1, x2, y2)=>{//«
	let uselines = lines;
	let str_arr = [];
	let start_len = 0;
	if (uselines[scroll_num + y1]) {
		str_arr = uselines[scroll_num + y1].slice(x1);
		start_len = uselines[scroll_num + y1].length;
	}
	if (y1 == (y2 + 1)) {
		if (uselines[scroll_num + y2]) uselines[scroll_num + y2] = uselines[scroll_num + y2].concat(str_arr);
		uselines.splice(y1 + scroll_num, 1);
	}
	return str_arr;
};//»
const line_break=()=>{//«
	if (lines[lines.length-1] && !lines[lines.length-1].length) return;
	lines.push([]);
	y++;
	scroll_into_view();
	render();
};//»
const scroll_into_view=(which)=>{//«
	if (!h) return;
	const doscroll=()=>{//«
		if (lines.length-scroll_num+num_stat_lines <= h) return false;
		else {
			if (y>=h) {
				scroll_num=lines.length-h+num_stat_lines;
				y=h-1;
			}
			else {
				scroll_num++;
				y--;
			}
			return true;
		}
	};//»
	let did_scroll = false;
	while (doscroll()) did_scroll = true;
	y=lines.length - 1 - scroll_num;
	return did_scroll;
};
this.scroll_into_view = scroll_into_view;
//»
const resize = () => {//«
	if (topwin.killed) return;
	wrapdiv._w = main._w;
	wrapdiv._h = main._h;
	let oldw = w;
	let oldh = h;
	ncols=nrows=0;
	tabdiv._dis="";
	wrapdiv._bgcol=BGCOL;
	main._bgcol=BGCOL;
	getgrid();
	if (ncols < MIN_TERM_WID){
		tabdiv._dis="none";
		wrapdiv._bgcol="#400";
		main._bgcol="#400";
//		terminal_locked = true;
		this.locked = true;
		do_overlay(`Min\xa0width:\xa0${MIN_TERM_WID}`);
		return;
	}
	if (!(ncols&&nrows)) {
		this.locked = true;
//		terminal_locked = true;
		return;
	}
	this.locked = false;
//	terminal_locked = false;
	w = ncols;
	h = nrows;
	if (!(oldw==w&&oldh==h)) do_overlay();
	this.w = w;
	this.h = h;
	line_height = wrapdiv.clientHeight/h;
	scroll_into_view();
	scroll_middle();

/* Not this...
	if (editor){
	 	generate_stat_html();
		if (editor.resize) {
			editor.resize(w,h);
			return;
		}
	}
	else if (pager){
	 	generate_stat_html();
	}
*/
//But this...
	if (num_stat_lines) generate_stat_html();
	if (actor && actor.resize){
		actor.resize(w,h);
		return;
	}

	render();
};
//»

//»
//Execute/Parse/Prompt«

const execute = async(str, opts={})=>{//«
	ENV['USER'] = globals.CURRENT_USER;
//	cur_shell = this.shell;
	cur_shell = new Shell(this);
	let gotstr = str.trim();

	str = str.replace(/\x7f/g, "");

	let env = {};
	for (let k in ENV){
		env[k]=ENV[k];
	}
	let heredocScanner=async(eof_tok)=>{
		let doc = [];
		let didone = false;
		let prmpt="> ";
		let rv;
		while (true){
			let rv = await this.read_line(prmpt);
			if (rv===eof_tok) break;
			doc.push(rv);
			didone = true;
		}
		return doc;
	};

//PLDYHJKU
	await cur_shell.execute(str,{env, heredocScanner, isInteractive: true});
	if (opts.noSave) return;

	let ind = history.indexOf(gotstr);
	if (ind >= 0) {
		history.splice(ind, 1);
	}
	else{
		write_to_history(gotstr);
	}
	history.push(gotstr);
};
//»

const get_com_pos=()=>{//«
	let add_x=0;
	if (cy() > cur_prompt_line) {
		add_x = w - prompt_len + x;
		for (let i=cur_prompt_line+1; i < cy(); i++) add_x+=w;
	}
	else add_x = x - prompt_len;
	return add_x;
};//»
const get_com_arr=(from_x)=>{//«
	let uselines = lines;
	let com_arr = [];
	let j, line;
	for (let i = cur_prompt_line; i < uselines.length; i++) {
		line = uselines[i];
		if (i==cur_prompt_line) j=prompt_len;
		else j=0;
		let len = line.length;
		for (; j < len; j++) com_arr.push(line[j]);
		if (len < w && i < uselines.length-1) com_arr.push("\n");
	}
	return com_arr;
};
//»
const get_command_arr=async (dir, arr, pattern)=>{//«
	const dokids = kids=>{
		if (!kids) return;
		let keys = Object.keys(kids);
		for (let k of keys){
			let app = kids[k].appName;
			if ((!app||app=="Com") && re.test(k)){
				match_arr.push([k, "Command"]);
			}
		}
	};
	let match_arr = [];
	let re = new RegExp("^" + pattern);
	for (let i=0; i < arr.length; i++) {
		let com = arr[i];
		if (pattern == "") {
			if (com.match(/^_/)) continue
			match_arr.push([com, "Command"]);
		}
		else if (re.test(com)) match_arr.push([arr[i], "Command"]);
	}
	return match_arr;
};//»
const get_prompt_str=()=>{//«
	let str;
	let user = ENV.USER;
	str = this.cur_dir.replace(/^\/+/, "/");
	str = str+"$";
	if ((new RegExp("^/home/"+user+"\\$$")).test(str)) str = "~$";
	else if ((new RegExp("^/home/"+user+"/")).test(str)) str = str.replace(/^\/home\/[^\/]+\x2f/,"~/");
	return str + " ";
};//»
const set_prompt = (opts={}) => {//«
	let use_str = opts.prompt || get_prompt_str();

	topwin.title=use_str.replace(/..$/,"");
	
	let plines;
	if (use_str==="") plines = [[""]];
	else{
		if (use_str.length+1 >= w) use_str = "..."+use_str.substr(-(w-5));
		plines = [use_str.split("")];
	}
	let line;
	let use_col = null;
	let len_min1;
	if (!lines.length) {
		lines = plines;
		len_min1 = lines.length-1;
		cur_prompt_line = 0;
	}
	else {
		len_min1 = lines.length-1;
		line = plines.shift();
		if (!lines[len_min1][0]) lines[len_min1] = line;
		else {
			lines.push(line);
			len_min1++;
		}
		if (use_col) line_colors[len_min1] = {'0': [line.length, use_col]};
		while(plines.length) {
			line = plines.shift();
			lines.push(line);
			len_min1++;
			if (use_col) line_colors[len_min1] = {'0': [line.length, use_col]};
		}
		cur_prompt_line = len_min1;
		scroll_into_view();
	}
	prompt_len = lines[len_min1].length;
	if (prompt_len==1 && lines[len_min1][0]==="") prompt_len=0;
	x=prompt_len;
	y=lines.length - 1 - scroll_num;
};
//»
const insert_cur_scroll = () => {//«
	com_scroll_mode = false;
	if (lines_hold_2) lines = lines_hold_2.slice(0, lines.length);
	let str = cur_scroll_command;
	let arr = fmt_lines_sync(str.split("\n"), prompt_len);
	let curarr = get_prompt_str().split("");
	for (let i=0; i < arr.length; i++) {
		let charr = arr[i].split("");
		for (let j=0; j < charr.length; j++) curarr.push(charr[j]);
		lines[cur_prompt_line + i] = curarr;
		y = cur_prompt_line + i - scroll_num;
		x = curarr.length;
		curarr = [];
	}
	if (x == w-1) {
		x=0;
		y++;
	}
	cur_scroll_command = null;
	return str;
};//»
const get_dir_contents = async(dir, pattern, opts={})=>{//«
	let {if_cd, if_keep_ast} = opts;
	const domatch=async()=>{//«
		kids = ret.kids;
		keys = Object.keys(kids);
		let match_arr = [];
		if (!if_keep_ast) pattern = pattern.replace(/\*/g, "[a-zA-Z_]*");
		pattern = pattern.replace(/\xa0/g, " ");
		let re = new RegExp("^" + pattern.replace(/\./g,"\\."));
		for (let i=0; i < keys.length; i++) {
			let key = keys[i];
			if (key=="."||key=="..") continue;
			let kid = kids[key];
			if (!root_state){
				let cur = kid;
				while (cur.treeroot !== true) {
					if (cur.rootonly === true) {
						kid = null;
						break;
					}
					cur = cur.par;
				}
				if (!kid) continue;
			}
			let useapp = kid.appName;
//			if (if_cd && useapp !== FOLDER_APP) continue;
			let ret = [keys[i], useapp];
			if (useapp == "Link") ret.push(kid.link);
			if (pattern == "" || re.test(keys[i])) match_arr.push(ret);
		}
		return match_arr;
	};//»
	if (dir===null) throw new Error("get_dir_contents() no dir!");
	let ret = await fsapi.pathToNode(dir);
	if (!(ret&&ret.appName==FOLDER_APP)) return [];
	let type = ret.type;
	let kids=ret.kids;
	let keys=Object.keys(kids);
	if (type==FS_TYPE&&!ret.done) {
		let ret2 = await fsapi.popDir(ret,{});
		if (!ret2) return [];
		ret.done = true;
		ret.kids = ret2;
	}
	return domatch();
};
//»

//»
//Response«

let do_continue = false;

this.continue = (str) => {//«
	do_continue = true;
	set_prompt({prompt:"> "});
	scroll_into_view();
	sleeping = null;
	bufpos = 0;
	setTimeout(()=>{cur_shell = null;},10);
	render();
};//»
const response_end = (opts={}) => {//«
	if (!did_init) return;

//Why does this line exist???
//	if (pager) return;
	if (is_pager) return;

	do_continue = false;
	set_prompt();
	scroll_into_view();
	sleeping = null;
	bufpos = 0;
//if (!opts.)
//	setTimeout(()=>{cur_shell = null;},10);
	cur_shell = null;
	render();
};
this.response_end = response_end;
//»
const response_err=(out)=>{
response(out, {isErr: true});
}
this.resperr = response_err;
const response = (out, opts={})=>{//«
	if (!isStr(out)) Win._fatal(new Error("Non-string given to terminal.response"));
	let {didFmt, colors, pretty, isErr, isSuc, isWrn, isInf, inBack} = opts;
if (inBack){
if (isErr){
cerr(out);
}
else if (isWrn){
cwarn(out);
}
else{
log(out);
}
return;
}
	out = out.split("\n");
/*
	else if (!out) return;
	else if (!isArr(out)){
log("STDOUT");
log(out);
return;
	}
	else if (out instanceof Uint8Array) out = [`Uint8Array(${out.length})`];
*/
//WOPIUTHSDKL
	let use_color;
	if (isErr) use_color = "#f99";
	else if (isSuc) use_color = "#7f7";
	else if (isWrn) use_color = "#ff7";
	else if (isInf) use_color = "#aaf";

/*'actor' means there is a non-terminal screen.
This can happen, e.g. with errors with screen-based commands inside of pipelines,
since all "message" kinds of output *ALWAYS* go to the terminal (rather than 
propagating through the pipeline).
*/
/*
	if (actor){
		let s = out.join("\n");
		if (use_color) console.log("%c"+s, `color: ${use_color}`);
		else console.log(s);
		return;
	}
*/
	if (colors) {
		if (!didFmt){
			let e = new Error(`A colors array was provided, but the output lines have not been formatted!`);
			Win._fatal(e);
			throw e;
		}
		if (colors.length !== out.length){
log("response lines",out);
log("response colors",colors);
			let e = new Error(`The output array and colors array are not equal length!`);
			Win._fatal(e);
			throw e;
		}

	}
	else colors = [];

/*The response mechanism is *ONLY* meant for the terminal's REPL mode. If there is
an 'actor' in a pipeline, and a previous command in the pipeline has some non-output-stream
message, then it always gets sent here, so we need to make sure we are putting the message
into the appropriate lines (otherwise, the message gets primted onto the actor's screen.
*/
	let use_lines, use_line_colors;
	if (hold_terminal_screen){
		use_line_colors = hold_terminal_screen.line_colors;
		use_lines = hold_terminal_screen.lines;
	}
	else {
		use_lines = lines;
		use_line_colors = line_colors;
	}

	if (use_lines.length && !use_lines[use_lines.length-1].length) use_lines.pop();

	let len = out.length;
	for (let i=0, curnum = use_lines.length; i < len; i++){
		let ln = out[i];
		let col = colors[i];
		if (didFmt){
			use_lines[curnum] = ln.split("");
			use_line_colors[curnum] = col;
			curnum++;
			continue;
		}
		let arr;
		if (pretty) arr = fmt2(ln);
		else arr = fmt(ln);
		for (let l of arr){
			use_lines[curnum] = l.split("");
			if (use_color) use_line_colors[curnum] = {0: [l.length, use_color]};
			else use_line_colors[curnum] = col;
			curnum++;
		}
	}
};
this.response = response;
//»

//»
//Keys/Handlers«

const do_ctrl_D=()=>{//«
cwarn("Calling do_ctrl_D!!! (nothing doing)");
};//»
const do_ctrl_C=()=>{//«
	if (cur_shell) {
		ENV['?'] = 0;
		if (cur_shell.stdin) {
			cur_shell.stdin(null, true);
			delete cur_shell.stdin;
		}
		execute_kill_funcs();
	}
/*
	else if (this.ssh_client){
		if (this.ssh_immediate_mode){
			delete this.ssh_immediate_mode;
			response("Immediate mode off");
			response_end();
			return;
		}
		this.ssh_client.close();
	}
*/
	else {
		handle_priv(null,"^".charCodeAt(), null, true);
		handle_priv(null,"C".charCodeAt(), null, true);
		root_state = null;
		bufpos = 0;
		command_hold = null;
		ENV['?'] = 0;
		response_end();
	}
};//»

const handle_insert=val=>{//«
	let arr = val.split("");
	let gotspace = false;
	for (let ch of arr) {
		let code = ch.charCodeAt();
		if (!(code >= 32 && code <= 126)) {
			if (code==10) continue;
			code = 32;
		}
		if (code==32) {
			if (gotspace) continue;
			gotspace = true;
		}
		else gotspace = false;
		handle_priv(null,code, null, true);
	}
};//»
const handle_line_str=(str, from_scroll, uselen, if_no_render)=>{//«
	let did_fail = false;
	const copy_lines=(arr, howmany)=>{//«
		let newarr = [];
		for (let i=0; i <= howmany; i++) {
			let ln = arr[i];
			if (!ln) {
				did_fail = true;
				ln = [" "];
			}
			newarr.push(ln);
		}
		return newarr;
	}//»
	if (str=="") {}
	else if (!str) return;
	let curnum = cur_prompt_line;
	let curx;
	if (typeof uselen=="number") curx=uselen;
	else curx = prompt_len;
	lines_hold_2 = lines;
	if (!com_scroll_mode) {
		lines = copy_lines(lines, cur_prompt_line)
		if (did_fail) {
			clear();
			return 
		}
	}
	lines[lines.length-1] = lines[lines.length-1].slice(0, prompt_len);
	let curpos = prompt_len;
	cur_scroll_command = str;
	let arr = str.split("\n");
	let addlines = 0;
	for (let lnstr of arr) {
		let i;
		if (!lnstr) lnstr = "";
		for (i=curnum;lnstr.length>0;i++) {
			let curln = lines[i];
			if (!curln) curln = [];
			let strbeg = lnstr.slice(0,w-curpos);
			curx = curpos + strbeg.length;
			curln.push(...strbeg);
			lines[i] = curln;
			lnstr = lnstr.slice(w-curpos);
			if (lnstr.length > 0) {
				curnum++;
				curx = 0;
			}
			curpos = 0;
			addlines++;
		}
		curnum++;
	}
	scroll_into_view();
	y = lines.length-1-scroll_num;
	x = curx;
	if (x==w) {
		y++;
		if (!lines[y+scroll_num]) {
			lines.push([]);
		}
		x=0;
		scroll_into_view();
	}
	if (!if_no_render) render();
};
//»
const do_get_dir_contents = async(use_dir, tok, tok0, arr_pos) => {//«
	let ret = await get_dir_contents(use_dir, tok, {if_cd: tok0==="cd"});
	if (!ret.length) return;
	docontents(ret, use_dir, tok, arr_pos);
};//»
const response_com_names = arr => {//«
	let arr_pos = get_com_pos();
	let repeat_arr = get_com_arr();
	let name_lens = [];
	for (let nm of arr) name_lens.push(nm.length);
	let command_return = [];
	fmt_ls(arr, name_lens, command_return);
	response(command_return.join("\n"), {didFmt: true});
	response_end();
	for (let i=0; i < repeat_arr.length; i++) handle_letter_press(repeat_arr[i]);
	let xoff = repeat_arr.length - arr_pos;
	for (let i=0; i < xoff; i++) handle_arrow(LEFT_KEYCODE,"");
	render();
};
this.response_com_names=response_com_names;
//»
const docontents = async(contents, use_dir, tok, arr_pos)=>{//«
	if (contents.length == 1) {//«

//METACHAR_ESCAPE

//\x22 -> "
//\x27 -> '
//\x60 -> `
//\x5b -> [
		let chars = contents[0][0].replace(/[ \x22\x27\x5b\x60#~{<>$|&!;()]/g, "\\$&").split("");
		let type = contents[0][1];
		tok = tok.replace(/\*$/,"");
		let str = tok;
		let handle_chars = '';
		for (let i=tok.length; i < chars.length; i++) {
			let gotch = chars[i];
			str+=gotch;
//			handle_letter_press(gotch);
			handle_chars+=gotch;
		}
		if (type==FOLDER_APP) {
//			handle_letter_press("/");//"/"
			handle_chars+="/";
			let rv = await fsapi.popDirByPath(use_dir+"/"+str,{root:root_state});
			if (!rv) return cerr("hdk76FH3");
		}
		else if (type=="appDir"||type=="libDir"){
//			handle_letter_press(".");//"/"
			handle_chars+=".";
		}
		else if (type=="Link") {
			let link = contents[0][2];
			if (!link){
cwarn("WHAT DOES THIS MEAN: contents[0][2]?!?!?!?");
			}
			else if (!link.match(/^\x2f/)) {
//cwarn("handle_tab():  GOWDA link YO NOT FULLPATH LALA");
			}
			else {
				let obj = await fsapi.pathToNode(link);
				if (obj&&obj.appName==FOLDER_APP) {
					if (await_next_tab) {
//						handle_letter_press("/");
						handle_chars+="/";
					}
					await_next_tab = true;
				}
				else {
					if (!lines[cy()][cx()]) {
//						handle_letter_press(" ");
						handle_chars+=" ";
					}
				}
			}
		}
		else {
			if (!lines[cy()][cx()]) {
//				handle_letter_press(" ");
				handle_chars+=" ";
			}
		}
//		if (this.ssh_server) return this.ssh_server.send(JSON.stringify({chars: handle_chars}));
		for (let c of handle_chars) handle_letter_press(c);
	}//»
	else if (contents.length > 1) {//«
		if (await_next_tab) {//«
			let diff = cy() - cur_prompt_line;
//			let repeat_arr = get_com_arr();
			let ret_arr = [];
			for (let i=0; i < contents.length; i++) {
				let arr = contents[i];
				let nm = arr[0];
				if (arr[1]===FOLDER_APP) nm+="/";
				ret_arr.push(nm);
			}
			let names_sorted = ret_arr.sort();
//			if (this.ssh_server) {
//				return this.ssh_server.send(JSON.stringify({names: names_sorted}));
//			}
			response_com_names(names_sorted);
		}//»
		else {//«
			if (!tok.length) {await_next_tab = true;return;}
			let max_len = tok.length;
			let got_substr = "";
			let curstr = tok;
			let curpos = tok.length;
			TABLOOP: while(true) {
				let curch = null;
				for (let arr of contents) {
					let word = arr[0];
					if (curpos == word.length) break TABLOOP;
					if (!curch) curch = word[curpos];
					else if (curch!==word[curpos]) break TABLOOP;
				}
				curstr += curch;
				curpos++;
			}
			got_substr = curstr;

			let got_rest = got_substr.substr(tok.length);
			if (got_rest.length > 0) {
				if (contents.length > 1)await_next_tab = true;
				else await_next_tab = null;
				
				let chars = got_rest.split("");
				for (let i=0; i < chars.length; i++) {
					let gotch = chars[i];
					if (gotch == " ") gotch = "\xa0";
					handle_letter_press(gotch);
				}
			}
			else await_next_tab = true;
		}//»
	}//»
};//»
const handle_tab = async(pos_arg, arr_arg)=>{//«
	if (cur_scroll_command) insert_cur_scroll();
	let contents;
	let use_dir = this.cur_dir;
//	if (this.ssh_server){}
//	else if (cur_shell) return;
	if (cur_shell) return;
	let arr_pos;
	let arr;
	if (pos_arg) arr_pos = pos_arg;
	else arr_pos = get_com_pos();
	if (arr_arg) arr = arr_arg;
	else arr = get_com_arr();

	let tok = "";
	let new_arr = arr.slice(0, arr_pos);
	let com_str = new_arr.join("");
	new_arr = com_str.split(/ +/);
	if (!new_arr[0] && new_arr[1]) new_arr.shift();
	let tokpos = new_arr.length;
	if (tokpos > 1) {
		if (new_arr[new_arr.length-2].match(/[\x60\(&|;] *$/)) tokpos = 1;
	}
	let tok0 = new_arr[0];
	if ((com_str.match(/[\x22\x27]/g)||[]).length===1){//\x22=" \x27='«

//At the end of a string with exactly one non-backtick quote character...
//Just a quick and dirty way to do tab completion with quotes

		let have_quote;
		let s="";

		for (let i=arr_pos-1; i >=0; i--){
			let ch = arr[i];
			if (ch.match(/[\x22\x27]/)){
				have_quote = ch;
				break;
			}
			s=`${ch}${s}`;
		}
		if (s.match(/\x2f/)){
			if (s.match(/^\x2f/)) use_dir="";
			let ar = s.split("/");
			s = ar.pop();
			use_dir=`${use_dir}/${ar.join("/")}`;
		}
//GYWJNFGHXP
		let use_str= s.replace(/([\[(+*?])/g,"\\$1");
		let ret = await get_dir_contents(use_dir, use_str,{if_cd: tok0==="cd", if_keep_ast: true});//, async ret => {
		if (!ret.length) return;
		if(ret.length===1){
			let rem = ret[0][0].slice(s.length);
			for (let ch of rem) handle_letter_press(ch);
			if (ret[0][1]===FOLDER_APP){
				handle_letter_press("/");
				await_next_tab = true;
			}
			else if (ret[0][1]==="Link"){
				let obj = await fsapi.pathToNode(`${use_dir}/${use_str}${rem}`);
				if (obj && obj.appName===FOLDER_APP){
					handle_letter_press("/");
					await_next_tab = true;
				}
				else handle_letter_press(have_quote);
			}
			else handle_letter_press(have_quote);
			return;
		}
		if (await_next_tab){
			contents = ret;
			docontents(contents, use_dir, tok, arr_pos);
			return;
		}
		let all=[];
		for (let ar of ret) all.push(ar[0]);
		let rem = util.sharedStart(all).slice(s.length);
		for (let ch of rem) handle_letter_press(ch);
		await_next_tab = true;
		return;
	}//»
	tok = new_arr.pop();
	tok = tok.replace(/^[^<>=]*[<>=]+/,"")
	if (tok.match(/^[^\x60;|&(]*[\x60;|&(][\/.a-zA-Z_]/)) {
		tok = tok.replace(/^[^\x60;|&(]*[\x60;|&(]/,"");
		tokpos = 1;
	}
	let got_path = null;
	if (tok.match(/\x2f/)) {//«
		tok = tok.replace(/^~\x2f/, "/home/"+ENV.USER+"/");
		got_path = true;
		let dir_arr = tok.split("/");
		tok = dir_arr.pop();
		let dir_str;
		let new_dir_str;
		if (dir_arr.length == 1 && dir_arr[0] == "") new_dir_str = "/";
		else {
			dir_str = dir_arr.join("/");
			let use_cur = this.cur_dir;
			if (dir_str.match(/^\x2f/)) use_cur = null;
			new_dir_str = util.getFullPath(dir_str, this.cur_dir);
		}
		use_dir = new_dir_str;
	}//»
	let nogood = null;
	if (!(!got_path && (tokpos==1||(tokpos>1 && com_completers.includes(tok0))))) return do_get_dir_contents(use_dir, tok, tok0, arr_pos);
	if (tokpos==1) {
//		contents = await get_command_arr(use_dir, BUILTINS, tok)
		contents = await get_command_arr(use_dir, Object.keys(Shell.activeCommands), tok)
	}
	else {
		if (tok0 == "help"){
			contents = await get_command_arr(use_dir, Object.keys(Shell.activeCommands), tok)
		}
		else if (tok0 == "lib" || tok0 == "import"){
			contents = await get_command_arr(use_dir, await util.getList("/site/coms/"), tok)
		}
		else if (tok0 == "app" || tok0 == "appicon"){
//			contents = await get_command_arr(use_dir, await util.getAppList(), tok)
			contents = await get_command_arr(use_dir, await util.getList("/site/apps/"), tok)
		}

	}
	if (contents && contents.length) docontents(contents, use_dir, tok, arr_pos);
	else do_get_dir_contents(use_dir, tok, tok0, arr_pos);
};
this.handle_tab = handle_tab;
//»
const handle_arrow=(code, mod, sym)=>{//«

	if (mod == "") {//«
		if (code == KC['UP']) {//«
			if (cur_shell) return;
			if (bufpos < history.length) {
				if (command_hold == null && bufpos == 0) {
					command_hold = get_com_arr().join("");
					command_pos_hold = get_com_pos() + prompt_len;
				}
				bufpos++;
			}
			else return;
			let str = history[history.length - bufpos];
			if (str) {
				let diffy = scroll_num - cur_prompt_line;
				while (cur_prompt_line+1 != lines.length) { 
if (!lines.length){
console.error("COULDA BEEN INFINITE LOOP: "+(cur_prompt_line+1) +" != "+lines.length);
break;
}
					lines.pop();
				}
				handle_line_str(str.trim(), true);
				com_scroll_mode = true;
			}
		}//»
		else if (code == KC['DOWN']) {//«
			if (cur_shell) return;
			if (bufpos > 0) bufpos--;
			else return;
			if (command_hold==null) return;
			let pos = history.length - bufpos;
			if (bufpos == 0) {
				trim_lines();
				handle_line_str(command_hold.replace(/\n$/,""),null,null,true);
				x = command_pos_hold;
				command_hold = null;
				render();
			}
			else {
				let str = history[history.length - bufpos];
				if (str) {
					trim_lines();
					handle_line_str(str.trim(), true);
					com_scroll_mode = true;
				}
			}
		}//»
		else if (code == LEFT_KEYCODE) {//«
			if (cur_scroll_command) {
				insert_cur_scroll();
			}
			if (cx() == 0) {
				if (cy() == 0) return;
				if (cy() > cur_prompt_line) {
					if (y==0) {
						scroll_num--;
					}
					else y--;
					x = lines[cy()].length;
					if (x==w) x--;
					if (x<0) x = 0;
					render();
					return;
				}
				else return;
			}
			if (cy()==cur_prompt_line && x==prompt_len) return;
			x--;
			render();

		}//»
		else if (code == KC["RIGHT"]) {//«
			if (cur_scroll_command) insert_cur_scroll();
//Or if this is less than w-2 with a newline for a CONT like current CLI environment.
			let nextline = lines[cy()+1];
			let thisline = lines[cy()];
			let thisch = thisline[cx()];
			let thislinelen = thisline.length;

			if (x == w-1 || ((x < w-1) && nextline && ((x==0&&!thislinelen) || (x==lines[cy()].length)))) {//«
				if (x<w-1){
					if (!thisch) {
						if (!nextline) return;
					}
				}
				else if (!thisch) return;
				if (lines[cy() + 1]) {
					x=0;
					if (y+1==h) scroll_num++;
					else y++;
					render();
				}
				else { 
					lines.push([]);
					x=0;
					y++;
					if (!scroll_into_view(9)) render();
					return;
				}
			}//»
			else {
				if (x==thislinelen||!thisch) return;
				x++;
				render();
			}
		}//»
	}//»
	else if (mod=="C") {//«
		if (kc(code,"UP")) {//«
			if (bufpos < history.length) {
				if (command_hold == null && bufpos == 0) {
					command_hold = get_com_arr().join("");
					command_pos_hold = get_com_pos() + prompt_len;
				}
				bufpos++;
			}
			else return;

			let re = new RegExp("^" + command_hold);
			for (let i = history.length - bufpos; bufpos <= history.length; bufpos++) {
				let str = history[history.length - bufpos];
				if (re.test(str)) {
					trim_lines();
					handle_line_str(str.trim(), true);
					com_scroll_mode = true;
					break;
				}
			}
		}//»
		else if (kc(code,"DOWN")) {//«
			if (bufpos > 0 && command_hold) bufpos--;
			else return;
			let re = new RegExp("^" + command_hold);
			for (let i = history.length - bufpos; bufpos > 0; bufpos--) {
				let str = history[history.length - bufpos];
				if (re.test(str)) {
					trim_lines();
					handle_line_str(str.trim(), true);
					com_scroll_mode = true;
					return;
				}
			}
			if (command_hold) {
				trim_lines();
				handle_line_str(command_hold.trim(), true);
				com_scroll_mode = true;
				command_hold = null;
			}
			else {
			}
		}//»
		else if (kc(code,"LEFT")) {//«
			if (cur_scroll_command) insert_cur_scroll();
			let arr = get_com_arr();
			let pos;
			let start_x;
			let char_pos = null;
			let use_pos = null;
			let add_x = get_com_pos();
			if (add_x==0) return;
			start_x = add_x;
			if (arr[add_x] && arr[add_x] != " " && arr[add_x-1] == " ") add_x--;
			if (!arr[add_x] || arr[add_x] == " ") {
				add_x--;
				while(add_x > 0 && (!arr[add_x] || arr[add_x] == " ")) add_x--;
				char_pos = add_x;
			}
			else char_pos = add_x;
			if (char_pos > 0 && arr[char_pos-1] == " ") use_pos = char_pos;
			while(char_pos > 0 && arr[char_pos] != " ") char_pos--;
			if (char_pos == 0) use_pos = 0;
			else use_pos = char_pos+1;
			for (let i=0; i < start_x - use_pos; i++) handle_arrow(LEFT_KEYCODE, "");
		}//»
		else if (kc(code,"RIGHT")) {//«
			if (cur_scroll_command) insert_cur_scroll();
			let arr;
			arr = get_com_arr();
			let pos;
			let start_x;
			let char_pos = null;
			let use_pos = null;
			let add_x = get_com_pos();
			if (add_x == arr.length) return;
			else if (!arr[add_x]) return;
			start_x = add_x;
			if (arr[add_x] != " ") {
				add_x++;
				while(add_x != arr.length && arr[add_x] != " ") add_x++;
				char_pos = add_x;
				if (char_pos == arr.length) use_pos = char_pos;
				else {
					char_pos++;
					while(char_pos != arr.length && arr[char_pos] == " ") char_pos++;
					use_pos = char_pos;
				}
			}
			else {
				add_x++;
				while(add_x != arr.length && arr[add_x] == " ") add_x++;
				use_pos = add_x;
			}
			for (let i=0; i < use_pos - start_x; i++) handle_arrow(KC["RIGHT"], "");
		}//»
	}//»

};//»
const handle_page=(sym)=>{//«
	if (sym=="HOME_") {//«
		if (cur_shell) return;
		if (bufpos < history.length) {
			if (command_hold == null && bufpos == 0) {
				command_hold = get_com_arr().join("");
				command_pos_hold = get_com_pos() + prompt_len;
			}
			bufpos = history.length;
			let str = history[0];
			if (str) {
				trim_lines();
				handle_line_str(str.trim(), true);
			}
		}
	}//»
	else if (sym=="END_") {//«
		if (cur_shell) return;
		if (bufpos > 0) {
			bufpos = 0;
			if (command_hold!=null) {
				trim_lines();
				handle_line_str(command_hold.trim(), true);
				command_hold = null;
			}
		}
	}//»
};//»
const handle_backspace=()=>{//«
	let prevch = lines[cy()][cx()-1];
	if (((y+scroll_num) ==  cur_prompt_line) && (x == prompt_len)) return;
	else {
		let do_check = true;
		let is_zero = null;
		if (cx()==0 && y==0) return;
		if (cx()==0 && (cy()-1) < cur_prompt_line) return;
		if (cur_scroll_command) insert_cur_scroll();
		if (cx()==0 && cy() > 0) {//«
//JEPOIKLMJYH
			if (lines[cy()].length < w) {//«
				let char_arg = lines[cy()][0];
				if (char_arg) {
					check_line_len(-1);
					is_zero = true;
					lines[cy()].splice(x, 1);
					lines[cy()-1].pop();
					lines[cy()-1].push(char_arg);
					y--;
					x = lines[cy()].length - 1;
					render();
				}
				else {
					lines[cy()-1].pop();
					lines.splice(cy(), 1);
					y--;
					x=lines[cy()].length;
					check_line_len();
					render();
					return;
				}
			}//»
			else {//«
				y--;
				do_check = true;
				lines[cy()].pop();
				x = lines[cy()].length;
				render();
			}//»
		}//»
		else {//«
			x--;
			lines[cy()].splice(x, 1);
		}//»
		let usey=2;
		if (!is_zero) {
			usey = 1;
			do_check = true;
		}
		if (do_check && lines[cy()+usey] && lines[cy()].length == w-1) {//«
			let char_arg = lines[cy()+usey][0];
			if (char_arg) lines[cy()].push(char_arg);
			else lines.splice(cy()+usey, 1);
			if(lines[cy()+usey]) {//«
				lines[cy()+usey].splice(0, 1);
				let line;
				for (let i=usey+1; line = lines[cy()+i]; i++) {
					let char_arg = line[0];
					if (char_arg) {
						line.splice(0,1);
						lines[cy()+i-1].push(char_arg);
						if (!line.length) lines.splice(i+1, 1);
					}
				}
			}//»
		}//»
	}
	render();
};//»
const handle_delete=(mod)=>{//«
	if (mod == "") {
		if (lines[cy()+1]) {
			handle_arrow(KC.RIGHT, "");
			handle_backspace();
		}
		else {
			lines[cy()].splice(x, 1);
			render();
		}
	}
};
//»
const handle_enter = async(opts={})=>{//«
	if (!sleeping){
		bufpos = 0;
		command_hold = null;
		let str;
		if (cur_shell) return;
		else {//«
			if (cur_scroll_command) str = insert_cur_scroll();
			else str = get_com_arr().join("");
			if (!do_continue && !str) {
				ENV['?']="0";
				response_end();
				return;
			}
		}//»
		x=0;
		y++;
		lines.push([]);
		if (!do_continue && (!str || str.match(/^ +$/))) {
			return response_end();
		}
		if (str) {
			last_com_str = str;
		}
		scroll_into_view();
		render();
		await execute(str, opts);
		sleeping = null;
	}
};//»
const handle_letter_press=(char_arg, if_no_render)=>{//«
	const dounshift=(uselines)=>{//«
		if ((uselines[cy()].length) > w) {
			let use_char = uselines[cy()].pop()
			if (!uselines[cy()+1]) uselines[cy()+1] = [use_char];
			else uselines[cy()+1].unshift(use_char);
			if (x==w) {
				x=0;
				y++;
			}
			for (let i=1; line = uselines[cy()+i]; i++) {
				if (line.length > w) {
					if (uselines[cy()+i+1]) uselines[cy()+i+1].unshift(line.pop());
					else uselines[cy()+i+1] = [line.pop()];
				}
				else {
					if (uselines[cy()+i-1].length > w) {
						line.unshift(uselines[cy()+i-1].pop());
					}
				}
			}
		}
	};//»
//	if (this.ssh_server){
//		this.ssh_server.send(JSON.stringify({press: char_arg}));
//		return;
//	}
	let line;
	if (lines && lines[scroll_num + y]) {
		if ((x) < lines[scroll_num + y].length && lines[scroll_num + y][0]) {
			lines[scroll_num + y].splice(x, 0, char_arg);
			shift_line(x-1, y, x, y);
		}
	}

	let usex = x+1;
	let usey = y;
	y = usey;

	let endch = null;
	let didinc = false;
	if (usex == w) {
		if (lines[cy()][cx()+1]) endch = lines[cy()].pop();
		didinc = true;
		usey++;
		usex=0;
	}
	if (!lines[cy()]) {//«
		lines[cy()] = [];
		lines[cy()][0] = char_arg;
	}//»
	else if (lines[cy()] && char_arg) {//«
		let do_line = null;
		if (lines[cy()][x]) do_line = true;
		lines[cy()][x] = char_arg;
	}//»
	let ln = lines[scroll_num+usey];
	if (ln && ln[usex]) {//«
		if (x+1==w) {
			if (!didinc) {
				usey++;
				usex=0;
			}
			if (endch) {
				if (!ln||!ln.length||ln[0]===null) lines[scroll_num+usey] = [endch];
				else ln.unshift(endch);	
			}
		}
		else usex = x+1;
	}//»
	else {//«
		if (!ln||!ln.length||ln[0]===null) {
			lines[scroll_num+usey] = [endch];
		}
	}//»
	x = usex;
	y = usey;
	dounshift(lines);
//DLOPOEIRU
//	scroll_into_view(8);
	if (!if_no_render) render();
	if (textarea) textarea.value = "";
};
this.handle_letter_press = handle_letter_press;
//»
const handle_priv=(sym, code, mod, ispress, e)=>{//«
	if (sleeping) {
		if (ispress || sym=="BACK_") return;
	}
	if (cur_shell){//«
		if (sym==="c_C") {
//			cur_shell.cancelled_time = (new Date).getTime();
			cur_shell.cancel();
			cur_shell = null;
			sleeping = false;
			response("^C");
			response_end();
			return;
		}
		else if (getch_cb){
			if (ispress) {
				sleeping = true;
				getch_cb(e.key);
				getch_cb = null;
			}
			else {
				if (sym=="ENTER_"){
					sleeping = true;
					getch_cb(getch_def_ch);
					getch_def_ch = undefined;
				}
				return;
			}
		}
		else if (read_line_cb){
			if (ispress || OK_READLINE_SYMS.includes(sym)){
				if ((sym==="LEFT_" || sym=="BACK_") && x==read_line_prompt_len && y+scroll_num == cur_prompt_line+1) return;
			}
			else if (sym==="ENTER_"){
				let s='';
				let from = cur_prompt_line+1;
				for (let i=from; i < lines.length; i++) {
					if (i==from) {
						s+=lines[i].slice(read_line_prompt_len).join("");
					}
					else {
						s+=lines[i].join("");
					}
				}
				read_line_cb(s);
				read_line_cb = null;
				sleeping = true;
				return;
			}
			else{
				return;
			}
		}
		else return;
	}//»
	if (!lines[cy()]) {//«
		if (code == 75 && alt) return;
		else {
			if (cy() > 1 && !lines[cy()-1]) set_prompt();
			else {
				lines[cy()] = [null];
			}
		}
	}//»
	let ret = null;
 	if (ispress) {//«
		num_ctrl_d = 0;
//		if (buffer_scroll_num!==null){
//			buffer_scroll_num = null;
//			x = hold_x;
//			y = hold_y;
//			render();
//		}
		if (cur_scroll_command) insert_cur_scroll();
		if (code == 0) return;
		else if (code == 1 || code == 2) code = 32;
		else if (code == 8226 || code == 9633) code = "+".charCodeAt();
		else if (code == 8211) code = "-".charCodeAt();
		else if (code == 3) {}
		else if (code < 32) code = 127;
		handle_letter_press(String.fromCharCode(code)); 
		return;
	}//»
	if (sym == "d_C") return do_ctrl_D();
	num_ctrl_d = 0;
	if (code >= 37 && code <= 40) handle_arrow(code, mod, sym);
	else if (sym == "HOME_"|| sym == "END_") handle_page(sym);
	else if (code == KC['DEL']) handle_delete(mod);
	else if (sym == "p_CAS") toggle_paste();
	else if (sym == "TAB_") handle_tab();
	else if (sym == "BACK_")  handle_backspace();
	else if (sym == "ENTER_") handle_enter();
	else if (sym == "c_C") do_ctrl_C();
	else if (sym == "k_C") do_clear_line();
	else if (sym == "y_C") {
		for (let i=0; i < current_cut_str.length; i++) handle_letter_press(current_cut_str[i]);
	}
	else if (sym == "b_CAS") {
log("BGLINES");
	}
	else if (sym == "c_CAS") {
		clear();
		response_end();
	}
	else if (sym=="a_C") {//«
		e.preventDefault();
		if (cur_scroll_command) insert_cur_scroll();
		x=prompt_len;
		y=cur_prompt_line - scroll_num;
		if (y<0) {
			scroll_num+=y;
			y=0;
		}
		render();
	}//»
	else if (sym=="e_C") {//«
		if (cur_scroll_command) insert_cur_scroll();
		y=lines.length-scroll_num-1;
		if (y>=h){
			scroll_num+=y-h+1
			y=h-1;
		}
		if (lines[cy()].length == 1 && !lines[cy()][0]) x = 0;
		else x=lines[cy()].length;
		render();
	}//»
	else if (sym == "l_A"){
	}
	else if (sym == "g_CAS"){
		save_special_command();
	}
	else if (sym=="h_CAS"){
		select_from_history(HISTORY_PATH);
	}
	else if (sym=="s_CAS"){
		select_from_history(HISTORY_PATH_SPECIAL);
	}
	else if (sym=="r_CAS"){
if (!dev_mode){
cwarn("Not dev_mode");
return;
}
//VMUIRPOIUYT
if (Term.ondevreload) delete Term.ondevreload;
else Term.ondevreload = ondevreload;
//log(`ondevreload == ${!!Term.ondevreload}`);
//cwarn("Reload the terminal:", !Term.ondevreload);
do_overlay(`Reload terminal: ${!Term.ondevreload}`);
	}
else if (sym=="d_CAS"){

}
else if (sym=="s_CA"){
if (!dev_mode) return;
USE_DEVPARSER = !USE_DEVPARSER;
do_overlay(`Use Dev Parser: ${USE_DEVPARSER}`);

}
};
//»
const handle=(sym, e, ispress, code, mod)=>{//«
	let marr;
	if (this.locked) {
		return;
	}
	if (is_scrolling){
		if (!ispress) {
			if (sym.match(/^[A-Z]+_$/)){
				if (sym==="SPACE_") return;
			}
			else return;
		}
		scroll_num = scrollnum_hold;
		is_scrolling = false;
		render();
		return;
	}
	if (e && sym=="d_C") e.preventDefault();
	if (!ispress) {//«
		if (sym == "=_C") {
			e.preventDefault();
			set_new_fs(gr_fs+1);
			return;
		}
		else if (sym == "-_C") {
			e.preventDefault();
			if (gr_fs-1 <= min_fs) return;
			set_new_fs(gr_fs-1);
			return;
		}
		else if (sym=="0_C") {
			gr_fs = def_fs;
			set_new_fs(gr_fs);
			return;
		}
		else if (sym=="c_CS") return do_clipboard_copy();
		else if (sym=="v_CS") return do_clipboard_paste();
		else if (sym=="a_CA") return do_copy_buffer();
		else if (sym=="p_CA"){
			PARAGRAPH_SELECT_MODE = !PARAGRAPH_SELECT_MODE;
			do_overlay(`Paragraph select: ${PARAGRAPH_SELECT_MODE}`);
			return;
		}
	}//»
	if (code == KC['TAB'] && e) e.preventDefault();
	else await_next_tab = null;
	if (e&&sym=="o_C") e.preventDefault();

	if (actor){
if (ispress){
if (actor.onkeypress) actor.onkeypress(e, sym, code);
}
else{
if (actor.onkeydown) actor.onkeydown(e ,sym, code);
}
//		actor.key_handler(sym, e, ispress, code);
		return;
	}
	if (ispress){}
	else if (!sym) return;

	handle_priv(sym, code, mod, ispress, e);
};
//»

//»
//Init«

const init = async(appargs={})=>{
	ENV['USER'] = globals.CURRENT_USER;
	this.cur_dir = get_homedir();
	this.cwd = this.cur_dir;
	let gotfs = localStorage.Terminal_fs;
	if (gotfs) {
		let val = strNum(gotfs);
		if (isNum(val,true)) gr_fs = val;
		else {
			gr_fs = def_fs;
			delete localStorage.Terminal_fs;
		}
	}
	else gr_fs = def_fs;
	wrapdiv._fs = gr_fs;
	resize();
	let {reInit} = appargs;
	if (!reInit) reInit = {};
	let {termBuffer, addMessage, commandStr, histories, useOnDevReload} = reInit;
	if (isBool(useOnDevReload)) USE_ONDEVRELOAD = useOnDevReload;
	if (termBuffer) history = termBuffer;
	else {
		let arr = await get_history();
		if (!arr) history = [];
		else {
			arr.pop();
			arr = arr.reverse();
			arr = util.uniq(arr);
			history = arr.reverse();
		}
	}
	let init_prompt = `LOTW shell\x20(${winid.replace("_","#")})`
	if(dev_mode){
		init_prompt+=`\nReload terminal: ${!USE_ONDEVRELOAD}`;
		init_prompt+=`\nDev Parser: ${USE_DEVPARSER}`;
	}
	if (admin_mode){
		init_prompt+=`\nAdmin mode: true`;
	}
	if (addMessage) init_prompt = `${addMessage}\n${init_prompt}`;
	let env_file_path = `${this.cur_dir}/.env`; 
	let env_lines = await env_file_path.toLines();
	if (env_lines) {
		let rv = ShellMod.util.addToEnv(env_lines, ENV, {if_export: true});
		if (rv.length){
			init_prompt+=`\n${env_file_path}:\n`+rv.join("\n");
		}
	}
	response(init_prompt);
	if (!dev_mode) {
		response(`Hint: The LOTW shell is currently for non-algorithmic "one-liners" like:`, {isWrn: true});
		response(`  $ cat some files here || echo "That didn't quite work!"`, {isWrn: true});
	}
	did_init = true;
	sleeping = false;
	set_prompt();
	render();
	await ShellMod.util.doImports(ADD_COMS, cwarn);
	if (commandStr) {
		for (let c of commandStr) handle_letter_press(c); 
		handle_enter({noSave: true});
	};
	if (USE_ONDEVRELOAD) Term.ondevreload = ondevreload;

};

//»
//Obj/CB«

//Var«
let read_line_cb;
let read_line_prompt_len;
let getch_cb, getch_def_ch;
//»
this.stat = stat;
this.getch = async(promptarg, def_ch)=>{//«
	if (promptarg){
		for (let ch of promptarg) handle_letter_press(ch);
	}
	sleeping = false;
	return new Promise((Y,N)=>{
		getch_def_ch = def_ch;
		getch_cb = Y;
	});
};//»
this.read_line = async(promptarg)=>{//«
	if (lines[lines.length-1]&&lines[lines.length-1].length){
		line_break();
		cur_prompt_line = y+scroll_num-1;
	}
	x=0;
	sleeping = false;
	if (promptarg){
		read_line_prompt_len = promptarg.length;
		for (let ch of promptarg) handle_letter_press(ch);
	}
	else read_line_prompt_len = 0;
	x = read_line_prompt_len;
	return new Promise((Y,N)=>{
		read_line_cb = Y;
	});
};//»
this.onappinit = init;

const onescape = () => {//«
	textarea&&textarea.focus();
	if (check_scrolling()) return true;
	if (status_bar.innerText){
		status_bar.innerText = "";
		return true;
	}
	return false;
}
this.onescape = onescape;
//»
this.onsave=()=>{//«
//	if (editor) editor.save();
	if (actor && actor.save) actor.save();
}//»
const ondevreload = async() => {//«
	do_overlay("ondevreload: start");

//EIOFJKL
	let use_str;
	if (cur_shell){
		use_str = cur_shell.commandStr;
		cur_shell.cancel();
		response_end();
	}
	ShellMod.util.deleteMods(DEL_MODS);
	if (use_str){
		handle_line_str(use_str);
		handle_enter();
	}
//	ShellMod.util.deleteComs(DEL_COMS);
//	await ShellMod.util.doImports(ADD_COMS, cerr);
	do_overlay("ondevreload: done");
};//»

this.onkill = (if_dev_reload)=>{//«
	execute_kill_funcs();
	if (this.cur_edit_node) this.cur_edit_node.unlockFile();
	if (!if_dev_reload) {
		return save_history();
	}

	this.reInit={
		termBuffer: history,
		useOnDevReload: !!Term.ondevreload
	};
//	let actor = editor||pager;
	if (actor) {
		this.reInit.commandStr = actor.command_str;
	}

	ShellMod.util.deleteMods(DEL_MODS);
	ShellMod.util.deleteComs(DEL_COMS);

//	delete globals.shell_commands;
//	delete globals.shell_command_options;

	save_history();

}//»
this.onfocus=()=>{//«
	this.isFocused = true;
	topwin_focused=true;
	if (cur_scroll_command) insert_cur_scroll();
	render();
	textarea&&textarea.focus();
}//»
this.onblur=()=>{//«
	this.isFocused = false;
	topwin_focused=false;
	render();
	if (cur_scroll_command) insert_cur_scroll();
	textarea && textarea.blur();
}//»
this.onresize = resize;
this.onkeydown=(e,sym,mod)=>{handle(sym,e,false,e.keyCode,mod);};
this.onkeypress=(e)=>{handle(e.key,e,true,e.charCode,"");};
this.onkeyup=(e,sym)=>{
if (actor&&actor.onkeyup) actor.onkeyup(e, sym);
};
this.overrides = {//«
	"UP_C": 1,
	"DOWN_C": 1,
	"LEFT_C": 1,
	"RIGHT_C": 1,
	"UP_CA": 1,
	"DOWN_CA": 1,
	"LEFT_CA": 1,
	"RIGHT_CA": 1,
	"h_CAS": 1,
	"d_CAS": 1,
	"c_CAS": 1,
	"o_CAS": 1,
	"l_C": 1,
	"k_C": 1,
	"l_A":1,
//	"c_A":1
};//»
//Terminal-specific methods

//Editor/Pager specific«
this.reset_x_scroll=()=>{tabdiv._x=0;};
this.x_scroll_terminal=(opts={})=>{//«

let {amt, toRightEdge, toLeftEdge} = opts;
let _x = tabdiv._x;
let cw = tabdiv.clientWidth;
let sw = tabdiv.scrollWidth;
let xdiff;
let usex = null;
if (amt) xdiff = amt;
else {
	if (toRightEdge){
		usex = cw - sw;
	}
	else if (toLeftEdge){
		usex = 0;
	}
	else {
		xdiff = cw/2;
		if (opts.right){
			xdiff = -xdiff;
		}
		else if (opts.left){
		}
	}
}
if (xdiff){
	_x+=xdiff;
	if (_x > 0) _x = 0;
	tabdiv._x = _x;
}
else if (usex !== null) tabdiv._x = usex;
else {
return cwarn("x_scroll_terminal: nothing to do!!!");
}
render();
};//»
this.clipboard_copy=(s)=>{do_clipboard_copy(null,s);};

this.set_lines = (linesarg, colorsarg)=>{//«
	lines = linesarg;
	line_colors = colorsarg;
};//»
//this.init_new_screen = (actor_arg, classarg, new_lines, new_colors, n_stat_lines, escape_fn) => {
this.init_new_screen = (actor_arg, classarg, new_lines, new_colors, n_stat_lines, funcs={}) => {//«
	let escape_fn = funcs.onescape;
	let dev_reload_fn = funcs.ondevreload;
//	let screen = {actor, appclass, lines, line_colors, x, y, scroll_num, num_stat_lines, onescape: termobj.onescape};
	let screen = {actor, appclass, lines, line_colors, x, y, scroll_num, num_stat_lines, funcs: {onescape: termobj.onescape, ondevreload: termobj.ondevreload}};
	if (!actor) hold_terminal_screen = screen;
	termobj.onescape = escape_fn;
	termobj.ondevreload = dev_reload_fn;
	actor = actor_arg;

	appclass = classarg;
	is_editor = appclass == "editor";
	is_pager = appclass == "pager";

	lines = new_lines;
	line_colors = new_colors;
	scroll_num=x=y=0;
	num_stat_lines=n_stat_lines;
	if (num_stat_lines) {
		wrapdiv.appendChild(statdiv);
		generate_stat_html();
	}
	return screen;

};//»
this.quit_new_screen = (screen) => {//«
if (screen === hold_terminal_screen) hold_terminal_screen = null;
let old_actor = actor;
({actor, appclass, lines, line_colors, x, y, scroll_num, num_stat_lines} = screen);
is_editor = appclass == "editor";
is_pager = appclass == "pager";
if (!screen.funcs) screen.funcs = {};
termobj.onescape = screen.funcs.onescape;
termobj.ondevreload = screen.funcs.ondevreload;

if (!num_stat_lines){
	statdiv._del();
}
tabdiv._x = 0;
if (old_actor&&old_actor.cb) {
	old_actor.cb(screen);
}
};//»

//»
this.wrap_line = wrap_line;
this.dopaste=dopaste;
this.refresh = render;
this.fmt = fmt;
this.break=line_break;
this.fmt_ls = fmt_ls;
this.fmt2 = fmt2;
this.clear=clear;
this.get_dir_contents=get_dir_contents;
this.get_homedir = get_homedir;
this.set_tab_size = (s)=>{//«
	if (!s.match(/[0-9]+/)) return;
	let n = parseInt(s);
	if (n==0||n>MAX_TAB_SIZE) return;
	tabdiv.style.tabSize = n;
	this.tabsize = tabdiv.style.tabSize;
	return true;
};//»
this.try_kill=()=>{//«
	if (is_editor) {
//		editor.set_stat_message("Really close the window? [y/N]");
		actor.stat_message="Really close the window? [Y/n]";
		render();
		actor.set_ask_close_cb();
	}
	else{
cwarn("TRY_KILL CALLED BUT is_editor == false!");
	}
}//»
this.toggle_paste = toggle_paste;
this.cur_white=()=>{CURBG="#ddd";CURFG="#000";}
this.cur_blue=()=>{CURBG="#00f";CURFG="#fff";}
this.execute_background_command=s=>{

	let shell = new Shell(this, true);
	let env = {};
	for (let k in ENV){
		env[k]=ENV[k];
	}
	shell.execute(s,{env, noRespEnd: true});

};
this.execute = async (s)=>{//«
	if (cur_shell){
cwarn("Sleeping");
		return false;
	}
	await execute(s);
	cur_shell = null;
//	response_end();
//log();
//	sleeping = null;
	return true;
};//»
Object.defineProperty(this,"lines",{//«
	get:()=>{
		let all;
		if (is_editor) all = actor.lines;
		else {
			all = [];
			for (let ln of lines) all.push(ln.join(""));
		}
		return all;
	}
});//»
Object.defineProperty(this,"actor",{get:()=>actor});
Object.defineProperty(this,"useDevParser",{get:()=>USE_DEVPARSER});

//»

}; 

//»

