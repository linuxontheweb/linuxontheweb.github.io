
//Terminal Imports«

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
//"esprima",
"test"
];

if (dev_mode){
//	ADD_COMS.push("shell");
}

const ShellMod = globals.ShellMod;
const Shell = ShellMod.Shell;

//»


//Terminal«

let USE_ONDEVRELOAD = false;
let USE_DEVPARSER = false;

LOTW.apps["local.Terminal"] = class {

/*«
let this.#readLineCb;
let this.#readLinePromptLen;
let this.#getChCb, this.#getChDefCh;
let this.#doContinue = false;
»*/
//Private Vars«
#readLineCb;
#readLinePromptLen;
#getChCb;
#getChDefCh;
#doContinue;
//»
constructor(Win){//«


this.Win=Win;

this.shellMod = globals.ShellMod;
this.shell = globals.ShellMod.Shell;
//const ShellMod = globals.ShellMod;
//const Shell = ShellMod.Shell;

//const TABSIZE = 4;
this.tabSize=4;
//const TABSIZE_MIN_1 = TABSIZE-1;
this.tabSizeMin1 = this.tabSize-1;
//const {main, Desk, statusBar: status_bar} = Win;
this.main = Win.main;
this.mainWin = Win.main;
this.Desk = Win.Desk;
this.statusBar = Win.statusBar;
//const topwin = Win;
//const winid = topwin.id;
//const termobj = this;
//const Term = this;
//this.appClass = "cli";
//let appclass = "cli";
this.appClass="cli";

//let this.isEditor = false;
this.isEditor = false;
//let this.isPager = false;
this.isPager = false;

//const CURSOR_ID = `cursor_${winid}`;

//const ENV = globals.TERM_ENV;
this.env = globals.TERM_ENV;

//Editor mode constants for the renderer (copy/pasted from vim.js)«
//XKIUO
this.modes={
command:1,
insert:2,
replace:3,
visLine:4,
visMark:5,
visBlock:6,
cutBuffer:7,
lineWrap:8,
symbol: 9,
file: 10,
complete: 11,
ref: 12
};
/*«
const COMMAND_MODE = 1;
const this.modes.insert = 2;
const this.modes.replace = 3;
const this.modes.visLine = 4;
const this.modes.visMark = 5;
const this.modes.visBlock = 6;
const this.modes.cutBuffer = 7;
const this.modes.lineWrap = 8;
const this.modes.symbol = 9;
const this.modes.file = 10;
const this.modes.complete = 11;
const this.modes.ref = 12;
»*/
//»

this.paragraphSelectMode = true;
//let this.paragraphSelectMode = true; //Toggle with Ctrl+Alt+p«
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

With this.paragraphSelectMode turned on, the system clipboard will contain the following
text upon executing the do_copy_buffer command with Cltr+Alt+a (a_CA).

-------------------------------------
These are a bunch of words that I'm writing, so I can seem very literate, and this is a crazily-hyphenated-word!

Here comes another paragraph...
-------------------------------------

The actual line buffer in the editor is left unchanged. This is just a convenience function
to allow for seamless copying between the editor and web-like applications that handle their 
own formatting of paragraphs.

Toggling of this.paragraphSelectMode is now done with Ctrl+Alt+p (p_CA).

»*/

//let highlight_actor_bg = false;
this.highlightActorBg = false;
this.actorHighlightColor="#101010";

//vim row folds
this.rowFoldColor = "rgb(160,160,255)";

//let did_init = false;
this.didInit = false;
//this.Desk = Desk;
this.winid = this.Win.id;
this.cursorId = `cursor_${this.winid}`;
this.numId = this.winid.split("_")[1];
//this.topwin = Win;

//let kill_funcs = []; 

//let this.minTermWid = 15;
this.minTermWid = 15;
//let terminal_locked  = false;

//let this.isScrolling = false;
this.isScrolling = false;
//let wheel_iter;
this.wheelIter = undefined;
//let dblclick_timeout;
this.dblClickTimeout = undefined;
this.downEvt = null;
//let downevt=null;

//let MAX_TAB_SIZE=256;
this.maxTabSize = 256;
//const com_completers = ["help", "app", "appicon", "lib", "import"];
this.comCompleters = ["help", "app", "appicon", "lib", "import"];
//const STAT_OK=1;
//const STAT_WARNING=2;
//const STAT_ERROR=3;
this.stat={
	ok: 1,
	warning: 2,
	error: 3
};

//let nrows, this.nCols;
this.nRows = undefined;
this.nCols = undefined;
//let x=0, y=0;
this.x=0;
this.y=0;
//let w,h;
this.w=undefined;
this.h=undefined;
//let xhold,yhold;
this.xHold=undefined;
this.yHold=undefined;
//let this.holdX, hold_y;
this.holdX=undefined;
this.holdY=undefined;
this.actor=undefined;
//let actor;
//let editor;
//let pager;

//let num_ctrl_d = 0;
this.numCtrlD = 0;
//let CLEAN_COPIED_STRING_MODE = false;
this.cleanCopiedStringMode=false;
//let DO_EXTRACT_PROMPT = true;
this.doExtractPrompt = true;
//const MAX_OVERLAY_LENGTH = 42;
this.maxOverlayLength=42;
//let this.overlayTimer = null;
this.overlayTimer=null;
//let TERMINAL_IS_LOCKED = false;
this.terminalIsLocked=false;
//let buffer_scroll_num = null;
//let buffer_hold;
this.bufferHold=undefined;
//let this.lineHeight;
this.lineHeight=undefined;
//let FF = "monospace";
this.ff = "monospace";
//let FW = "600";
//let FW = "500";
this.fw="500";
//let this.curBG = "#00f";
this.curBG="#00f";
//let this.curFG = "#fff";
this.curFG="#fff";
//let CURBG_BLURRED = "#444";
this.curBGBlurred = "#444";
//let OVERLAYOP = "0.66";
this.overlayOp="0.66";
//let TCOL = "#e3e3e3";
this.tCol = "#e3e3e3";
//let topwin_focused = true;
this.topwinFocused=true;
//let no_prompt_mode = false;
this.noPromptMode=false;

//let this.minHeight;
this.minHeight=undefined;

//let com_scroll_mode = false;
this.comScrollMode=false;

//let this.numStatLines = 0;
this.numStatLines=0;
//let this.scrollNum = 0;
this.scrollNum=0;
//let scrollnum_hold;
this.scrollNumHold=undefined;
//let min_fs = 8;
this.minFs=8;
//let this.defFs = 24;
this.defFs=24;
//let this.grFs;
this.grFs = undefined;
//this.this.scrollNum = this.scrollNum;
//this.ENV = ENV;

//let max_fmt_len = 4997;
this.maxFmtLen=4997;

//let last_com_str=null;
this.lastComStr=null;
//let last_mode;
this.lastMode=undefined;
//let this.rootState = null;
this.rootState = null;
//let cur_shell = null;
this.curShell = null;
//let shell_class = null;
//let dev_shell_class = null;
//let ls_padding = 2;
this.lsPadding = 2;
//let await_next_tab = null;
this.awaitNextTab=null;
//let cur_prompt_line = 0;
this.curPromptLine=0;
//let this.curScrollCommand;
this.curScrollCommand=undefined;
//let prompt_str;
this.promptStr=undefined;
//let prompt_len;
this.promptLen = undefined;
//let buf_lines = [];
this.lines=[];
//let lines = [];
//let line_colors = [];
this.lineColors=[];
//let this.linesHold2;
this.linesHold2=undefined;
//let this.linesHold;
this.linesHold=undefined;
//let this.lineColorsHold;
this.lineColorsHold=undefined;

//let this.currentCutStr = "";
this.currentCutStr="";

//let history = [];
this.history=[];

//let command_hold = null;
this.commandHold=null;
//let command_pos_hold = 0;
this.commandPosHold = null;
//let bufpos = 0;
this.bufPos=0;
//let sleeping = null;
this.sleeping=null;
//let cur_ps1;
this.curPS1 = undefined;
//const OK_READLINE_SYMS=["DEL_","BACK_","LEFT_", "RIGHT_"];
this.okReadlineSyms = ["DEL_","BACK_","LEFT_", "RIGHT_"];
//let this.statSpans;
this.statSpans=undefined;
//let hold_terminal_screen;
this.holdTerminalScreen=undefined;
//let cur_dir;

this.makeDOMElem();

}//»

makeDOMElem(){//«

const{main}=this;
//log("WINID", winid);
//let this.bgCol = "#080808";
this.bgCol="#080808";

let overdiv = make('div');//«
overdiv._pos="absolute";
overdiv._loc(0,0);
overdiv._w="100%";
overdiv._h="100%";
this.Win.overdiv=overdiv;
//»
let wrapdiv = make('div');//«
wrapdiv.id="termwrapdiv_"+this.winid;
wrapdiv._bgcol=this.bgCol;
wrapdiv._pos="absolute";
wrapdiv._loc(0,0);

wrapdiv._tcol = this.tCol;
wrapdiv._fw = this.fw;
wrapdiv._ff = this.ff;
wrapdiv.style.whiteSpace = "pre";
//»
let tabdiv = make('div');//«
tabdiv.id="termtabdiv_"+this.winid;
tabdiv.style.userSelect = "text"
tabdiv._w="100%";
tabdiv._pos="absolute";
tabdiv.onmousedown=(e)=>{downevt=e;};
tabdiv.onmouseup=e=>{//«
	if (!downevt) return;
	let d = util.dist(e.clientX,e.clientY,downevt.clientX, downevt.clientY);
	if (d < 10) return;
//	focus_or_copy();
	this.focusOrCopy();
};//»
tabdiv.onclick=e=>{//«
	e.stopPropagation();
	if (this.dblClickTimeout){
		clearTimeout(this.dblClickTimeout);
//		dbldblclick_timeoutick_timeout
		this.dblClickTimeout=null;
		setTimeout(()=>{
			this.focusOrCopy();
		},333);
		return;
	}
	setTimeout(()=>{
		this.focusOrCopy();
	},500);
};//»
tabdiv.ondblclick = e => {
	e.stopPropagation();
//	dblclick_timeout = setTimeout(focus_or_copy, 500);
this.dblClickTimeout = setTimeout(()=>{
	this.focusOrCopy();
}, 500);
}
tabdiv._loc(0,0);
tabdiv.style.tabSize = this.tabSize;
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
textarea = make('textarea');
textarea.id = `textarea_${this.Win.id}`;
textarea._noinput = true;
textarea.width = 1;
textarea.height = 1;
textarea.style.opacity = 0;
textarea.focus();

areadiv = make('div');
areadiv._pos="absolute";
areadiv._loc(0,0);
areadiv._z=-1;
if (textarea) {
	areadiv.appendChild(textarea);
}
main._tcol="black";
main._bgcol=this.bgCol;

//let overlay;«

let fakediv = make('div');
fakediv.innerHTML = '<div style="opacity: '+this.overlayOp+';border-radius: 15px; font-size: xx-large; padding: 0.2em 0.5em; position: absolute; -webkit-user-select: none; transition: opacity 180ms ease-in; color: rgb(16, 16, 16); background-color: rgb(240, 240, 240); font-family: monospace;"></div>';
let overlay = fakediv.childNodes[0];
overlay.id = "overlay_"+this.winid;

//»

//Listeners«
const onpaste = e =>{//«
//	if (pager) return;
	textarea.value="";
	setTimeout(()=>{
		let val = textarea.value;
		if (!(val&&val.length)) return;
		if (this.isEditor) this.actor.check_paste(val);
		else dopaste();
	}
	,25);
}//»
textarea.onpaste = onpaste;
main.onwheel=e=>{//«
	if (!this.sleeping){
		let dy = e.deltaY;
		if (!this.isScrolling){
			if (!this.scrollNum) return;
			if (dy > 0) return;
			scrollnum_hold = this.scrollNum;
			this.isScrolling = true;
			wheel_iter = 0;
		}
		let skip_factor = 10;
/*
		if (this.env.SCROLL_SKIP_FACTOR){
			let got = this.env.SCROLL_SKIP_FACTOR.ppi();
			if (!Number.isFinite(got)) cwarn(`Invalid SCROLL_SKIP_FACTOR: ${this.env.SCROLL_SKIP_FACTOR}`);
			else skip_factor = got;
		}
*/
		wheel_iter++;
		if (wheel_iter%skip_factor) return;
		if (dy < 0) dy = Math.ceil(4*dy);
		else dy = Math.floor(4*dy);
		if (!dy) return;
		this.scrollNum += dy;
		if (this.scrollNum < 0) this.scrollNum = 0;
		else if (this.scrollNum >= scrollnum_hold) {
			this.scrollNum = scrollnum_hold;
			this.isScrolling = false;
		}
		this.render();
	}
};//»
main.onscroll=e=>{e.preventDefault();this.scrollMiddle();};
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

this.tabsize = parseInt(tabdiv.style.tabSize);
this.textarea = textarea; 
this.areadiv = areadiv;
this.tabdiv=tabdiv;
this.wrapdiv = wrapdiv;
this.overlay = overlay;

}//»

//Util«
stat(mess){status_bar.innerText=mess;};
async getLineFromPager(arr, name){//«
	if (!await util.loadMod(DEF_PAGER_MOD_NAME)) {
		return poperr("Could not load the pager module");
	}
	let less = new NS.mods[DEF_PAGER_MOD_NAME](this);
	if (await less.init(arr, name, {lineSelect: true, opts: {}})) return arr[less.y+less.this.scrollNum];

}//»
async selectFromHistory( path ) {//«
	let arr = await path.toLines();
	if (!isArr(arr) && arr.length) {
cwarn("No history lines from", path);
		return;
	}
	this.curScrollCommand = await get_line_from_pager(arr, path.split("/").pop());
	if (this.curScrollCommand) this.insertCurScroll();
	this.render();
}
//»

async saveSpecialCommand ()  {//«
	let s = this.getComArr().join("");
	if (!s.match(/[a-z]/i)) {
log("Not saving", s);
		return;
	}
	if (await fsapi.writeFile(HISTORY_PATH_SPECIAL, `${s}\n`, {append: true})) return this.doOverlay(`Saved special: ${s}`);
	poperr(`Could not write to: ${HISTORY_PATH_SPECIAL}!`);
};
//»
async writeToHistory(str){//«
	if (!await fsapi.writeFile(HISTORY_PATH, `${str}\n`, {append: true})) {
cwarn(`Could not write to history: ${HISTORY_PATH}`);
	}
};
//»
async saveHistory(){//«
	if (!await fsapi.writeFile(HISTORY_PATH, this.history.join("\n")+"\n")){
		poperr(`Problem writing command history to: ${HISTORY_PATH}`);
	}
};
//»
togglePaste(){//«
	const{textarea}=this;
	if (textarea){
		textarea._del();
		textarea = null;	
		this.doOverlay("Pasting is off");
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
	this.doOverlay("Pasting is on");

}
//»

dopaste(){//«
	let val = this.textarea.value;
	if (val && val.length) handle_insert(val);
	this.textarea.value="";
};
//»
checkScrolling(){//«
	if (this.isScrolling){
		this.scrollNum = scrollnum_hold;
		this.isScrolling = false;
		this.render();
		return true;
	}
	return false;
}
//»

wrapLine(str){//«
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
}
//»

fmtLs(arr, lens, ret, types, color_ret, col_arg){//«
//const fmt_ls=(arr, lens, ret, types, color_ret, start_from, col_arg)=>{

/*_TODO_: In Linux, the ls command lists out (alphabetically sorted) by columns, but 
here we are doing a row-wise listing! Doing this in a column-wise fashion (cleanly and 
efficiently) is an outstanding issue...*/
const{w}=this;
	let pad = this.lsPadding;
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
			tot_len+=this.lsPadding;
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
			this.fmtLs(arr, lens, ret, types, color_ret, (num_cols - 1));
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
}
//»
fmt2(str, type, maxlen){//«
    if (type) str = type + ": " + str;
    let ret = [];
    let w = this.w;
    let dopad = 0;
    if (maxlen&&maxlen < w) {
        dopad = Math.floor((w - maxlen)/2);
        this.w = maxlen;
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
fmt(str, startx){//«
	if (str === this.EOF) return [];
	let use_max_len = this.getMaxLen();
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
		while((ln.length+doadd) >= this.w) {
			iter++;
			let val = ln.slice(0,this.w-doadd);
			if (do_wide) val = val.replace(/\x03/g, "");
			ret.push(val);
			ln = ln.slice(this.w-doadd);
			str = ln;
			doadd = 0;
		}
	}
	if (do_wide) ret.push(ln.replace(/\x03/g, ""));
	else ret.push(ln);
	return ret;
}
//»
fmtLinesSync(arr, startx){//«
    let all = [];
	let usestart = startx;
    for (let i=0; i < arr.length; i++) {
		all = all.concat(this.fmt(arr[i],usestart));
		usestart = 0;
	}
    return all;
}
//»

objToString(obj ){//«
	if (obj.id) return `[object ${obj.constructor.name}(${obj.id})]`;
	return `[object ${obj.constructor.name}]`;
}
//»
async getHistory(val){//«
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
}
//»
scrollMiddle(){//«
	const{main}=this;
	let y1 = main.scrollTop;
	main.scrollTop=(main.scrollHeight-main.clientHeight)/2;
	let y2 = main.scrollTop;
}
//»
focusOrCopy(){//«
	let sel = window.getSelection();
	if (sel.isCollapsed)this.textarea&&this.textarea.focus();
	else do_clipboard_copy();
}
//»

getHomedir(){//«
	if (this.rootState) return "/";
	return globals.HOME_PATH;
}
//»
getBuffer(if_str){//«
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
	if (this.actor && this.actor.get_lines) uselines = this.actor.get_lines();//in foldmode, vim's lines contain fold markers
	else uselines = this.lines;
	for (let i=0; i < uselines.length; i++) {
		ln = uselines[i].join("").replace(/\u00a0/g, " ");
		if (if_str) ret +=  ln + "\n"
		else ret.push(ln);
	}

	if (this.actor && (this.paragraphSelectMode || this.actor.parSel)){//Paragraph select mode
		if (if_str) ret = ret.split("\n");
		ret = linesToParas(ret);
		if (if_str) ret = paras.join("\n");
		else ret = paras;
	}

	return ret;
}
//»
curDateStr(){//«
	let d = new Date();
	return (d.getMonth()+1) + "/" + d.getDate() + "/" + d.getFullYear().toString().substr(2);
}
//»
extractPromptFromStr(str){//«
	if (!DO_EXTRACT_PROMPT) return str;
	let prstr = this.getPromptStr();
	let re = new RegExp("^"+prstr.replace("$","\\$"));
	if (re.test(str)) str = str.substr(prstr.length);
	return str;
}
//»
copyText(str, mess){//«
	const{textarea}=this;
	const SCISSORS_ICON = "\u2702";
	if (!textarea) return;
	if (!mess) mess = SCISSORS_ICON;
	textarea.focus();
	textarea.value = str;
	textarea.select();
	document.execCommand("copy")
	this.doOverlay(mess);
}
//»
doClearLine(){//«
	if (this.curShell) return;
	let str="";
	for (let i = this.lines.length; i > this.y+this.scrollNum+1; i--) str = this.lines.pop().join("") + str;
	let ln = this.lines[this.y+this.scrollNum];
	str = ln.slice(this.x).join("") + str;
	this.lines[this.y+this.scrollNum] = ln.slice(0, this.x);	
	if (this.curPromptLine < this.scrollNum) {
		this.scrollNum -= (this.scrollNum - this.curPromptLine);
		this.y=0;
	}
	this.currentCutStr = str;
	this.render();
}
//»
doCopyBuffer()  {//«
	copy_text(get_buffer(true), "Copied: entire buffer");
}//»

doClipboardCopy(if_buffer, strarg){//«
	const{textarea}=this;
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
//		str = extract_prompt_from_str(str);
		str = this.extractPromptFromStr(str);
	}
	else {
//cwarn("Do you really ever want this string to be stripped of newlines and the prompt? CLEAN_COPIED_STRING_MODE==false !!!");
	}

	do_copy(str);
	textarea&&textarea.focus();
	this.doOverlay(`Copied: ${str.slice(0,9)}...`);
}
//»
doClipboardPaste(){//«
	if (!textarea) return;
	textarea.value = "";
	document.execCommand("paste")
}
//»
doOverlay(strarg){//«
	let str;
	if (strarg) {
		str = strarg;
		if (str.length > MAX_OVERLAY_LENGTH) str = str.slice(0,MAX_OVERLAY_LENGTH)+"...";
	}
	else str = this.w+"x"+this.h;
	this.overlay.innerText = str;
	if (this.overlayTimer) clearTimeout(this.overlayTimer);
	else this.main.appendChild(this.overlay);
	util.center(this.overlay, this.main);
	this.overlayTimer = setTimeout(()=>{
		this.overlayTimer = null;
		this.overlay._del();
	}, 1500);
}
//»
setNewFs(val){//«
	this.grFs = val;
	localStorage.Terminal_fs = this.grFs;
	wrapdiv._fs = this.grFs;
	this.resize();
}
//»
getMaxLen(){//«
	let max_len = this.maxFmtLen;
	let maxlenarg = this.env['MAX_FMT_LEN'];
	if (maxlenarg && maxlenarg.match(/^[0-9]+$/)) max_len = parseInt(maxlenarg);
	return max_len;
}
//»
checkLineLen(dy){//«
	if (!dy) dy = 0;
	if (this.lines[this.cy()+dy].length > this.w) {
		let diff = this.lines[this.cy()+dy].length-this.w;
		for (let i=0; i < diff; i++) this.lines[this.cy()+dy].pop();
	}
}
//»
cx(){//«
	return this.x;
}//»

cy(){//«
	return this.y + this.scrollNum;
}//»
trimLines(){while (this.curPromptLine+1 != this.lines.length) this.lines.pop();}
//»
//Render«

render(opts={}){//«
const{tabdiv}=this;
//Var«

//	let actor = editor||pager;
	const{actor}=this;
	let stat_x;
	if (actor) {
//this.stat
//		({stat_x}=this.actor); 
		stat_x = actor.stat_x;
		this.x=actor.x;
		this.y=actor.y;
		this.scrollNum = actor.scroll_num;
//		({stat_x, x,y,this.scrollNum}=actor); 
		if (!stat_x) stat_x = this.x;
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

	if (this.isEditor) ({mode,symbol,seltop,selbot,selleft,selright,selmark,opts,num_lines,ry}=actor);
	if (!(this.nCols&&this.nRows)) return;
	let visual_line_mode = (mode===this.modes.visLine) || line_select_mode;
	if (line_select_mode) seltop = selbot = this.scrollNum+this.y;
	
	if (mode===this.modes.ref||mode===this.modes.symbol||mode===this.modes.complete){
		visual_line_mode = true;
		seltop = selbot = this.y+this.scrollNum;
	}
	let visual_block_mode = mode===this.modes.visBlock;
	let visual_mark_mode = mode===this.modes.visMark;
	let visual_mode = visual_line_mode || visual_mark_mode || visual_block_mode;
	let docursor = false;
	if (opts.noCursor){}
	else if (!this.terminalIsLocked) docursor = true;
	let usescroll = this.scrollNum;
//	let is_buf_scroll = false;
//	if (buffer_scroll_num!==null) {
//		usescroll = buffer_scroll_num;
//		is_buf_scroll = true;
//	}
	let scry=usescroll;
	let slicefrom = scry;
	let sliceto = scry + this.nRows;
	let uselines=[];
	let is_str = false;
	let x_scroll = 0;
	let usex = this.x-x_scroll;
	let outarr = [];
	let donum;
//»
	for (let i=slicefrom; i < sliceto; i++) {//«
		let ln = this.lines[i];
		if (ln){
			uselines.push(ln.slice());
			continue;
		}
		if (!this.isEditor){
			uselines.push([""]);
			continue;
		}
		let noline = ['<span style="color: #6c97c4;">~</span>'];
		noline._noline = true;
		uselines.push(noline);
	}//»
	let len = uselines.length;//«
	if (len + this.numStatLines != this.h) donum = this.h - this.numStatLines;
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
		let colobj = this.lineColors[curnum];

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
					useleft = (curnum==this.cy())?this.x:selmark;
				}
				else if (selbot===curnum){
					useleft = 0;
					useright = (curnum==this.cy())?this.x:selmark;
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
				arr[0]=`<span style="color:${this.rowFoldColor};">${arr[0]}`
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
if (num2 > this.w) {
//console.log("LONGLINE");
	break;
}
			}
		}//»

		if (!(this.isPager||stat_input_type||this.isScrolling)) {//«
//		if (!(this.isPager||is_buf_scroll||stat_input_type||this.isScrolling)) {
			if (docursor && i==this.y) {
				let usebg;
				if (!this.topwinFocused) usebg = this.curBGBlurred;
//				else if (this.ssh_immediate_mode) usebg = CURBG_SSH_MODE;
				else usebg = this.curBG;
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
				let sty = `background-color:${usebg};color:${this.curFG}`;
				arr[usex] = pre+`<span id="${this.cursorId}" style="${sty}">${usech}</span>`;
			}
		}//»

		let s = arr.join("");
		if (actor && !arr._noline && this.highlightActorBg) outarr.push(`<span style="background-color:${this.actorHighlightColor};">${s}</span>`);
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
			arr[stat_x] = `<span style="background-color:${this.curBG};color:${this.curFG}">${arr[stat_x]}</span>`;
			if (visual_mode&&stat_input_type===":") {
//			if (visual_line_mode&&stat_input_type===":") {
//				usestr = `${stat_input_type}'&lt;,'&gt;${arr.join("")}`;
				usestr = `:'&lt;,'&gt;${arr.join("")}`;
			}
			else {
				usestr = stat_input_type + arr.join("");
			}
		}//»
		else if (this.isEditor) {//«
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
				if (mode === this.modes.insert) mess = "-- INSERT --";
				else if (mode === this.modes.replace) mess = "-- REPLACE --";
				else if (mode == this.modes.symbol) {
					if (symbol) mess = `-- SYMBOL: ${symbol} --`;
					else mess = "-- SYMBOL --";
				}
				else if (mode == this.modes.ref) {
					if (symbol) mess = `-- REF: ${symbol} --`;
					else mess = "-- REF --";
				}
				else if (mode === this.modes.complete) {
					mess = `-- COMPLETE: ${symbol} --`;
				}
				else if (visual_line_mode) mess = "-- VISUAL LINE --";
				else if (visual_mark_mode) mess = "-- VISUAL --";
				else if (visual_block_mode) mess = "-- VISUAL BLOCK --";
				else if (mode === this.modes.file) mess = "-- FILE --";
				else if (mode === this.modes.cutBuffer) mess = `-- CUT BUFFER: ${actor.cur_cut_buffer+1}/${actor.num_cut_buffers} --`;
				else if (mode === this.modes.lineWrap) mess = "-- LINE WRAP --";
				messln = mess.length;
			}//»
			let per;
			let t,b;
			if (this.scrollNum==0) t = true;
			if (!this.lines[sliceto-1]) b=true;
			if (t&&b) per = "All";
			else if (t) per="Top";
			else if (b) per = "Bot";
			else {
				if (Number.isFinite(ry)) {
					per = Math.floor(100*ry/num_lines)+"%";
				}
				else {
					let val = Math.floor(100*(this.scrollNum/(num_lines-1)));
					per = (val)+"%";
				}
			}
			let perln = per.length;
			let perx = this.w-5;
			if (perln > 4) per = "?%";
			per = "\x20".repeat(4-perln)+per;
			let lncol;
			if (mode===this.modes.lineWrap){
				lncol = (actor.line_wrap_y+1)+","+(actor.line_wrap_x+1);
			}
			else{
				lncol = (ry+1)+","+(this.x+1);
			}
			let lncolln = lncol.length;
			let lncolx = this.w - 18;
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
		else if(this.isPager){//«
			let per = Math.floor(100*(usescroll+donum)/this.lines.length);
			if (per > 100) per = 100;
			let usename = (actor.fname+" ")||"";
			usestr = `${usename}${per}% of ${this.lines.length} lines (press q to quit)`;
			if (!stat_input_type) usestr = '<span style=background-color:#aaa;color:#000>'+usestr+'</span>'
		}//»
		update_stat_lines([usestr]);
	}//»
	if (this.minHeight && this.h < this.minHeight){
		tabdiv.innerHTML=`<center><span style="background-color:#f00;color:#fff;">Min height: ${this.minHeight}</span></center>`;
	}
	else {
		tabdiv.innerHTML = outarr.join("\n");
	}
}//»
refresh(opts){this.render(opts);}
generateStatHtml(){//«
const{statdiv}=this;
	this.statSpans = [];
	statdiv.innerHTML="";
	let n_cont_lines = this.nRows - this.numStatLines;
	let s='';
	for (let i=0; i < n_cont_lines; i++) {
		let sp = make('div');
		sp.innerHTML=" ";
		statdiv.appendChild(sp);
	}
	for (let i=0; i < this.numStatLines; i++) {
		let sp = make('div');
		sp.innerHTML=" ";
		this.statSpans.push(sp);
		statdiv.appendChild(sp);
	}
}
//»
updateStatLines(arr){//«
if (!this.numStatLines) return;
	let arrlen = arr.length;
	if (arrlen!=this.numStatLines){
cerr("What is the array size different from the this.numStatLines????");
		return;
	}
	if (arrlen==1) {
		this.statSpans[0].innerHTML=arr[0];
		return;
	}
	for (let i=0; i < this.numStatLines; i++) this.statSpans[i].innerHTML = arr[i];
}
//»

//»
//Curses«

getGrid(){//«
	const{tabdiv, wrapdiv}=this;
	let tdiv = tabdiv;
	if (!(wrapdiv._w&&wrapdiv._h)) {
		if (this.Win.killed) return;
cerr("DIMS NOT SET");
		return;
	}
	let usech = "X";

	let str = "";
	let iter = 0;
	wrapdiv._over="auto";
	while (true) {
		if (this.Win.killed) return;
		str+=usech;
		tdiv.innerHTML = str;
		if (tdiv.scrollWidth > wrapdiv._w) {
			tdiv.innerHTML = usech.repeat(str.length-1);
			wrapdiv._w = tdiv.clientWidth;
			this.nCols = str.length - 1;
			break;
		}
		iter++;
		if (iter > 10000) {
log(wrapdiv);
			cwarn("INFINITE LOOP ALERT DOING WIDTH: " + tdiv.scrollWidth + " > " + this.w);
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
			this.nRows = newarr.length;
			break;
		}
		str+="\n"+usech;
		iter++;
		if (iter > 10000) {
log(wrapdiv);
			return cwarn("INFINITE LOOP ALERT DOING HEIGHT: " + tdiv.scrollHeight + " > " + this.h);
		}
	}
	tdiv.innerHTML="";
	wrapdiv._over="hidden";
}
//»
clearTable(){//«
	this.lines = [];
	this.lineColors = [];
	this.y=0;
	this.scrollNum = 0;
	this.render();
}
//»
clear(){//«
//log("????");
//const clear=(if_keep_buffer)=>{
//	clear_table(if_keep_buffer);
	clear_table();
//	if (if_keep_buffer) this.curPromptLine = y;
}

//»
shiftLine(x1, y1, x2, y2){//«
	let uselines = this.lines;
	let str_arr = [];
	let start_len = 0;
	if (uselines[this.scrollNum + y1]) {
		str_arr = uselines[this.scrollNum + y1].slice(x1);
		start_len = uselines[this.scrollNum + y1].length;
	}
	if (y1 == (y2 + 1)) {
		if (uselines[this.scrollNum + y2]) uselines[this.scrollNum + y2] = uselines[this.scrollNum + y2].concat(str_arr);
		uselines.splice(y1 + this.scrollNum, 1);
	}
	return str_arr;
}
//»
lineBreak(){//«
	if (this.lines[this.lines.length-1] && !this.lines[this.lines.length-1].length) return;
	this.lines.push([]);
	this.y++;
	this.scrollIntoView();
	this.render();
}
//»
scrollIntoView(which){//«
	if (!this.h) return;
	const doscroll=()=>{//«
		if (this.lines.length-this.scrollNum+this.numStatLines <= this.h) return false;
		else {
			if (this.y>=this.h) {
				this.scrollNum=this.lines.length-this.h+this.numStatLines;
				this.y=this.h-1;
			}
			else {
				this.scrollNum++;
				this.y--;
			}
			return true;
		}
	};//»
	let did_scroll = false;
	while (doscroll()) did_scroll = true;
	this.y=this.lines.length - 1 - this.scrollNum;
	return did_scroll;
}
//»
resize()  {//«
	const{actor, tabdiv, wrapdiv, main}=this;
	if (this.Win.killed) return;
	wrapdiv._w = main._w;
	wrapdiv._h = main._h;
	let oldw = this.w;
	let oldh = this.h;
	this.nCols=this.nRows=0;
	tabdiv._dis="";
	wrapdiv._bgcol=this.bgCol;
	main._bgcol=this.bgCol;
	this.getGrid();
	if (this.nCols < this.minTermWid){
		tabdiv._dis="none";
		wrapdiv._bgcol="#400";
		main._bgcol="#400";
//		terminal_locked = true;
		this.locked = true;
		this.doOverlay(`Min\xa0width:\xa0${this.minTermWid}`);
		return;
	}
	if (!(this.nCols&&this.nRows)) {
		this.locked = true;
//		terminal_locked = true;
		return;
	}
	this.locked = false;
//	terminal_locked = false;
	this.w = this.nCols;
	this.h = this.nRows;
	if (!(oldw==this.w&&oldh==this.h)) this.doOverlay();
	this.lineHeight = wrapdiv.clientHeight/this.h;
	this.scrollIntoView();
	this.scrollMiddle();

/* Not this...
	if (editor){
	 	this.generateStatHtml();
		if (editor.resize) {
			editor.resize(this.w,this.h);
			return;
		}
	}
	else if (pager){
	 	this.generateStatHtml();
	}
*/
//But this...
	if (this.numStatLines) this.generateStatHtml();
	if (actor && actor.resize){
		actor.resize(this.w,this.h);
		return;
	}

	this.render();
}
//»

//»
//Execute/Parse/Prompt«

async execute(str, opts={}){//«
	this.env['USER'] = globals.CURRENT_USER;
//	cur_shell = this.shell;
	this.curShell = new this.shell(this);
	let gotstr = str.trim();

	str = str.replace(/\x7f/g, "");

	let env = {};
	for (let k in this.env){
		env[k]=this.env[k];
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
	await this.curShell.execute(str,{env, heredocScanner, isInteractive: true});
	this.responseEnd();
	if (opts.noSave) return;

	let ind = this.history.indexOf(gotstr);
	if (ind >= 0) {
		this.history.splice(ind, 1);
	}
	else{
cwarn("NOT WRITING!!!", gotstr);
//		write_to_history(gotstr);
	}
	this.history.push(gotstr);
}
//»
/*
async execute(s){//«
	if (this.curShell){
cwarn("Sleeping");
		return false;
	}
	await execute(s);
	this.curShell = null;
//	this.responseEnd();
//log();
//	this.sleeping = null;
	return true;
}
//»
*/

getComPos(){//«
	let add_x=0;
	if (this.cy() > this.curPromptLine) {
		add_x = this.w - this.promptLen + this.x;
		for (let i=this.curPromptLine+1; i < this.cy(); i++) add_x+=this.w;
	}
	else add_x = this.x - this.promptLen;
	return add_x;
}
//»
getComArr(from_x){//«
	let uselines = this.lines;
	let com_arr = [];
	let j, line;
	for (let i = this.curPromptLine; i < uselines.length; i++) {
		line = uselines[i];
		if (i==this.curPromptLine) j=this.promptLen;
		else j=0;
		let len = line.length;
		for (; j < len; j++) com_arr.push(line[j]);
		if (len < this.w && i < uselines.length-1) com_arr.push("\n");
	}
	return com_arr;
}
//»
async getCommandArr (dir, arr, pattern){//«
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
}
//»
getPromptStr(){//«
	let str;
	let user = this.env.USER;
	str = this.cur_dir.replace(/^\/+/, "/");
	str = str+"$";
	if ((new RegExp("^/home/"+user+"\\$$")).test(str)) str = "~$";
	else if ((new RegExp("^/home/"+user+"/")).test(str)) str = str.replace(/^\/home\/[^\/]+\x2f/,"~/");
	return str + " ";
}
//»
setPrompt(opts={})  {//«
	let use_str = opts.prompt || this.getPromptStr();

	this.Win.title=use_str.replace(/..$/,"");
	
	let plines;
	if (use_str==="") plines = [[""]];
	else{
		if (use_str.length+1 >= this.w) use_str = "..."+use_str.substr(-(this.w-5));
		plines = [use_str.split("")];
	}
	let line;
	let use_col = null;
	let len_min1;
	if (!this.lines.length) {
		this.lines = plines;
		len_min1 = this.lines.length-1;
		this.curPromptLine = 0;
	}
	else {
		len_min1 = this.lines.length-1;
		line = plines.shift();
		if (!this.lines[len_min1][0]) this.lines[len_min1] = line;
		else {
			this.lines.push(line);
			len_min1++;
		}
		if (use_col) this.lineColors[len_min1] = {'0': [line.length, use_col]};
		while(plines.length) {
			line = plines.shift();
			this.lines.push(line);
			len_min1++;
			if (use_col) this.lineColors[len_min1] = {'0': [line.length, use_col]};
		}
		this.curPromptLine = len_min1;
		this.scrollIntoView();
	}
	this.promptLen = this.lines[len_min1].length;
	if (this.promptLen==1 && this.lines[len_min1][0]==="") this.promptLen=0;
	this.x=this.promptLen;
	this.y=this.lines.length - 1 - this.scrollNum;
}
//»
insertCurScroll()  {//«
	com_scroll_mode = false;
	if (this.linesHold2) this.lines = this.linesHold2.slice(0, this.lines.length);
	let str = this.curScrollCommand;
	let arr = fmt_lines_sync(str.split("\n"), this.promptLen);
	let curarr = this.getPromptStr().split("");
	for (let i=0; i < arr.length; i++) {
		let charr = arr[i].split("");
		for (let j=0; j < charr.length; j++) curarr.push(charr[j]);
		this.lines[this.curPromptLine + i] = curarr;
		this.y = this.curPromptLine + i - this.scrollNum;
		this.x = curarr.length;
		curarr = [];
	}
	if (this.x == this.w-1) {
		this.x=0;
		this.y++;
	}
	this.curScrollCommand = null;
	return str;
}
//»
async getDirContents(dir, pattern, opts={}){//«
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
			if (!this.rootState){
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
	if (dir===null) throw new Error("this.getDirContents() no dir!");
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
}
//»

//»
//Response«

continue(str){//«
	this.#doContinue = true;
	this.setPrompt({prompt:"> "});
	this.scrollIntoView();
	this.sleeping = null;
	this.bufPos = 0;
	setTimeout(()=>{this.curShell = null;},10);
	this.render();
}
//»
responseEnd(opts={})  {//«
	if (!this.didInit) return;

//Why does this line exist???
//	if (pager) return;
	if (this.isPager) return;

	this.#doContinue = false;
	this.setPrompt();
	this.scrollIntoView();
	this.sleeping = null;
	this.bufPos = 0;
//if (!opts.)
//	setTimeout(()=>{this.curShell = null;},10);
	this.curShell = null;
	this.render();
}
//»
responseErr(out){//«
this.response(out, {isErr: true});
}//»
response(out, opts={}){//«
	const{actor}=this;
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
	if (this.holdTerminalScreen){
		use_line_colors = this.holdTerminalScreen.line_colors;
		use_lines = this.holdTerminalScreen.lines;
	}
	else {
		use_lines = this.lines;
		use_line_colors = this.lineColors;
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
		else arr = this.fmt(ln);
		for (let l of arr){
			use_lines[curnum] = l.split("");
			if (use_color) use_line_colors[curnum] = {0: [l.length, use_color]};
			else use_line_colors[curnum] = col;
			curnum++;
		}
	}
}
//»

//»
//Keys/Handlers«

doCtrlD(){//«
cwarn("Calling do_ctrl_D!!! (nothing doing)");
};//»
doCtrlC(){//«
	if (this.curShell) {
		this.env['?'] = 0;
		if (this.curShell.stdin) {
			this.curShell.stdin(null, true);
			delete this.curShell.stdin;
		}
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
		this.handlePriv(null,"^".charCodeAt(), null, true);
		this.handlePriv(null,"C".charCodeAt(), null, true);
		this.rootState = null;
		this.bufPos = 0;
		this.commandHold = null;
		this.env['?'] = 0;
		this.responseEnd();
	}
}
//»

handleInsert(val){//«
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
		this.handlePriv(null,code, null, true);
	}
}
//»
handleLineStr(str, from_scroll, uselen, if_no_render){//«
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
	let curnum = this.curPromptLine;
	let curx;
	if (typeof uselen=="number") curx=uselen;
	else curx = this.promptLen;
	this.linesHold2 = this.lines;
	if (!com_scroll_mode) {
		this.lines = copy_lines(this.lines, this.curPromptLine)
		if (did_fail) {
			clear();
			return 
		}
	}
	this.lines[this.lines.length-1] = this.lines[this.lines.length-1].slice(0, this.promptLen);
	let curpos = this.promptLen;
	this.curScrollCommand = str;
	let arr = str.split("\n");
	let addlines = 0;
	for (let lnstr of arr) {
		let i;
		if (!lnstr) lnstr = "";
		for (i=curnum;lnstr.length>0;i++) {
			let curln = this.lines[i];
			if (!curln) curln = [];
			let strbeg = lnstr.slice(0,this.w-curpos);
			curx = curpos + strbeg.length;
			curln.push(...strbeg);
			this.lines[i] = curln;
			lnstr = lnstr.slice(this.w-curpos);
			if (lnstr.length > 0) {
				curnum++;
				curx = 0;
			}
			curpos = 0;
			addlines++;
		}
		curnum++;
	}
	this.scrollIntoView();
	this.y = this.lines.length-1-this.scrollNum;
	this.x = curx;
	if (this.x==this.w) {
		this.y++;
		if (!this.lines[this.y+this.scrollNum]) {
			this.lines.push([]);
		}
		this.x=0;
		this.scrollIntoView();
	}
	if (!if_no_render) this.render();
}
//»
async doGetDirContents(use_dir, tok, tok0, arr_pos)  {//«
	let ret = await this.getDirContents(use_dir, tok, {if_cd: tok0==="cd"});
	if (!ret.length) return;
	this.doContents(ret, use_dir, tok, arr_pos);
}
//»
responseComNames(arr ) {//«
	let arr_pos = this.getComPos();
	let repeat_arr = this.getComArr();
	let name_lens = [];
	for (let nm of arr) name_lens.push(nm.length);
	let command_return = [];
	fmt_ls(arr, name_lens, command_return);
	this.response(command_return.join("\n"), {didFmt: true});
	this.responseEnd();
	for (let i=0; i < repeat_arr.length; i++) this.handleLetterPress(repeat_arr[i]);
	let xoff = repeat_arr.length - arr_pos;
	for (let i=0; i < xoff; i++) handle_arrow(LEFT_KEYCODE,"");
	this.render();
}
//»
async doContents(contents, use_dir, tok, arr_pos){//«
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
//			this.handleLetterPress(gotch);
			handle_chars+=gotch;
		}
		if (type==FOLDER_APP) {
//			this.handleLetterPress("/");//"/"
			handle_chars+="/";
			let rv = await fsapi.popDirByPath(use_dir+"/"+str,{root:this.rootState});
			if (!rv) return cerr("hdk76FH3");
		}
		else if (type=="appDir"||type=="libDir"){
//			this.handleLetterPress(".");//"/"
			handle_chars+=".";
		}
		else if (type=="Link") {
			let link = contents[0][2];
			if (!link){
cwarn("WHAT DOES THIS MEAN: contents[0][2]?!?!?!?");
			}
			else if (!link.match(/^\x2f/)) {
//cwarn("this.handleTab():  GOWDA link YO NOT FULLPATH LALA");
			}
			else {
				let obj = await fsapi.pathToNode(link);
				if (obj&&obj.appName==FOLDER_APP) {
					if (this.awaitNextTab) {
//						this.handleLetterPress("/");
						handle_chars+="/";
					}
					this.awaitNextTab = true;
				}
				else {
					if (!this.lines[this.cy()][this.x]) {
//						this.handleLetterPress(" ");
						handle_chars+=" ";
					}
				}
			}
		}
		else {
			if (!this.lines[this.cy()][this.x]) {
//				this.handleLetterPress(" ");
				handle_chars+=" ";
			}
		}
//		if (this.ssh_server) return this.ssh_server.send(JSON.stringify({chars: handle_chars}));
		for (let c of handle_chars) this.handleLetterPress(c);
	}//»
	else if (contents.length > 1) {//«
		if (this.awaitNextTab) {//«
			let diff = this.cy() - this.curPromptLine;
//			let repeat_arr = this.getComArr();
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
			if (!tok.length) {this.awaitNextTab = true;return;}
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
				if (contents.length > 1)this.awaitNextTab = true;
				else this.awaitNextTab = null;
				
				let chars = got_rest.split("");
				for (let i=0; i < chars.length; i++) {
					let gotch = chars[i];
					if (gotch == " ") gotch = "\xa0";
					this.handleLetterPress(gotch);
				}
			}
			else this.awaitNextTab = true;
		}//»
	}//»
}
//»
async handleTab(pos_arg, arr_arg){//«
	if (this.curScrollCommand) this.insertCurScroll();
	let contents;
	let use_dir = this.cur_dir;
//	if (this.ssh_server){}
//	else if (this.curShell) return;
	if (this.curShell) return;
	let arr_pos;
	let arr;
	if (pos_arg) arr_pos = pos_arg;
	else arr_pos = this.getComPos();
	if (arr_arg) arr = arr_arg;
	else arr = this.getComArr();

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
		let ret = await this.getDirContents(use_dir, use_str,{if_cd: tok0==="cd", if_keep_ast: true});//, async ret => {
		if (!ret.length) return;
		if(ret.length===1){
			let rem = ret[0][0].slice(s.length);
			for (let ch of rem) this.handleLetterPress(ch);
			if (ret[0][1]===FOLDER_APP){
				this.handleLetterPress("/");
				this.awaitNextTab = true;
			}
			else if (ret[0][1]==="Link"){
				let obj = await fsapi.pathToNode(`${use_dir}/${use_str}${rem}`);
				if (obj && obj.appName===FOLDER_APP){
					this.handleLetterPress("/");
					this.awaitNextTab = true;
				}
				else this.handleLetterPress(have_quote);
			}
			else this.handleLetterPress(have_quote);
			return;
		}
		if (this.awaitNextTab){
			contents = ret;
			this.doContents(contents, use_dir, tok, arr_pos);
			return;
		}
		let all=[];
		for (let ar of ret) all.push(ar[0]);
		let rem = util.sharedStart(all).slice(s.length);
		for (let ch of rem) this.handleLetterPress(ch);
		this.awaitNextTab = true;
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
		tok = tok.replace(/^~\x2f/, "/home/"+this.env.USER+"/");
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
	if (!(!got_path && (tokpos==1||(tokpos>1 && this.comCompleters.includes(tok0))))) return this.doGetDirContents(use_dir, tok, tok0, arr_pos);
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
	if (contents && contents.length) this.doContents(contents, use_dir, tok, arr_pos);
	else this.doGetDirContents(use_dir, tok, tok0, arr_pos);
}
//»
handleArrow(code, mod, sym){//«
	if (mod == "") {//«
		if (code == KC['UP']) {//«
			if (this.curShell) return;
			if (this.bufPos < this.history.length) {
				if (this.commandHold == null && this.bufPos == 0) {
					this.commandHold = this.getComArr().join("");
					this.commandPosHold = this.getComPos() + this.promptLen;
				}
				this.bufPos++;
			}
			else return;
			let str = this.history[this.history.length - this.bufPos];
			if (str) {
				let diffy = this.scrollNum - this.curPromptLine;
				while (this.curPromptLine+1 != this.lines.length) { 
if (!this.lines.length){
console.error("COULDA BEEN INFINITE LOOP: "+(this.curPromptLine+1) +" != "+this.lines.length);
break;
}
					this.lines.pop();
				}
				handle_line_str(str.trim(), true);
				com_scroll_mode = true;
			}
		}//»
		else if (code == KC['DOWN']) {//«
			if (this.curShell) return;
			if (this.bufPos > 0) this.bufPos--;
			else return;
			if (this.commandHold==null) return;
			let pos = this.history.length - this.bufPos;
			if (this.bufPos == 0) {
				trim_lines();
				handle_line_str(this.commandHold.replace(/\n$/,""),null,null,true);
				this.x = this.commandPosHold;
				this.commandHold = null;
				this.render();
			}
			else {
				let str = this.history[this.history.length - this.bufPos];
				if (str) {
					trim_lines();
					handle_line_str(str.trim(), true);
					com_scroll_mode = true;
				}
			}
		}//»
		else if (code == LEFT_KEYCODE) {//«
			if (this.curScrollCommand) {
				this.insertCurScroll();
			}
			if (this.x == 0) {
				if (this.cy() == 0) return;
				if (this.cy() > this.curPromptLine) {
					if (this.y==0) {
						this.scrollNum--;
					}
					else this.y--;
					this.x = this.lines[this.cy()].length;
					if (this.x==this.w) this.x--;
					if (this.x<0) this.x = 0;
					this.render();
					return;
				}
				else return;
			}
			if (this.cy()==this.curPromptLine && this.x==this.promptLen) return;
			this.x--;
			this.render();

		}//»
		else if (code == KC["RIGHT"]) {//«
			if (this.curScrollCommand) this.insertCurScroll();
//Or if this is less than w-2 with a newline for a CONT like current CLI environment.
			let nextline = this.lines[this.cy()+1];
			let thisline = this.lines[this.cy()];
			let thisch = thisline[this.x];
			let thislinelen = thisline.length;

			if (this.x == this.w-1 || ((this.x < this.w-1) && nextline && ((this.x==0&&!thislinelen) || (this.x==this.lines[this.cy()].length)))) {//«
				if (this.x<this.w-1){
					if (!thisch) {
						if (!nextline) return;
					}
				}
				else if (!thisch) return;
				if (this.lines[this.cy() + 1]) {
					this.x=0;
					if (this.y+1==this.h) this.scrollNum++;
					else this.y++;
					this.render();
				}
				else { 
					this.lines.push([]);
					this.x=0;
					this.y++;
					if (!this.scrollIntoView(9)) this.render();
					return;
				}
			}//»
			else {
				if (this.x==thislinelen||!thisch) return;
				this.x++;
				this.render();
			}
		}//»
	}//»
	else if (mod=="C") {//«
		if (kc(code,"UP")) {//«
			if (this.bufPos < this.history.length) {
				if (this.commandHold == null && this.bufPos == 0) {
					this.commandHold = this.getComArr().join("");
					this.commandPosHold = this.getComPos() + this.promptLen;
				}
				this.bufPos++;
			}
			else return;

			let re = new RegExp("^" + this.commandHold);
			for (let i = this.history.length - this.bufPos; this.bufPos <= this.history.length; this.bufPos++) {
				let str = this.history[this.history.length - this.bufPos];
				if (re.test(str)) {
					trim_lines();
					handle_line_str(str.trim(), true);
					com_scroll_mode = true;
					break;
				}
			}
		}//»
		else if (kc(code,"DOWN")) {//«
			if (this.bufPos > 0 && this.commandHold) this.bufPos--;
			else return;
			let re = new RegExp("^" + this.commandHold);
			for (let i = this.history.length - this.bufPos; this.bufPos > 0; this.bufPos--) {
				let str = this.history[this.history.length - this.bufPos];
				if (re.test(str)) {
					trim_lines();
					handle_line_str(str.trim(), true);
					com_scroll_mode = true;
					return;
				}
			}
			if (this.commandHold) {
				trim_lines();
				handle_line_str(this.commandHold.trim(), true);
				com_scroll_mode = true;
				this.commandHold = null;
			}
			else {
			}
		}//»
		else if (kc(code,"LEFT")) {//«
			if (this.curScrollCommand) this.insertCurScroll();
			let arr = this.getComArr();
			let pos;
			let start_x;
			let char_pos = null;
			let use_pos = null;
			let add_x = this.getComPos();
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
			if (this.curScrollCommand) this.insertCurScroll();
			let arr;
			arr = this.getComArr();
			let pos;
			let start_x;
			let char_pos = null;
			let use_pos = null;
			let add_x = this.getComPos();
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

}
//»
handlePage(sym){//«
	if (sym=="HOME_") {//«
		if (this.curShell) return;
		if (this.bufPos < this.history.length) {
			if (this.commandHold == null && this.bufPos == 0) {
				this.commandHold = this.getComArr().join("");
				this.commandPosHold = this.getComPos() + this.promptLen;
			}
			this.bufPos = this.history.length;
			let str = this.history[0];
			if (str) {
				trim_lines();
				handle_line_str(str.trim(), true);
			}
		}
	}//»
	else if (sym=="END_") {//«
		if (this.curShell) return;
		if (this.bufPos > 0) {
			this.bufPos = 0;
			if (this.commandHold!=null) {
				trim_lines();
				handle_line_str(this.commandHold.trim(), true);
				this.commandHold = null;
			}
		}
	}//»
}
//»
handleBackspace(){//«
	let prevch = this.lines[this.cy()][this.x-1];
	if (((this.y+this.scrollNum) ==  this.curPromptLine) && (this.x == this.promptLen)) return;
	else {
		let do_check = true;
		let is_zero = null;
		if (this.x==0 && this.y==0) return;
		if (this.x==0 && (this.cy()-1) < this.curPromptLine) return;
		if (this.curScrollCommand) this.insertCurScroll();
		if (this.x==0 && this.cy() > 0) {//«
//JEPOIKLMJYH
			if (this.lines[this.cy()].length < this.w) {//«
				let char_arg = this.lines[this.cy()][0];
				if (char_arg) {
					check_line_len(-1);
					is_zero = true;
					this.lines[this.cy()].splice(this.x, 1);
					this.lines[this.cy()-1].pop();
					this.lines[this.cy()-1].push(char_arg);
					this.y--;
					this.x = this.lines[this.cy()].length - 1;
					this.render();
				}
				else {
					this.lines[this.cy()-1].pop();
					this.lines.splice(this.cy(), 1);
					this.y--;
					this.x=this.lines[this.cy()].length;
					check_line_len();
					this.render();
					return;
				}
			}//»
			else {//«
				this.y--;
				do_check = true;
				this.lines[this.cy()].pop();
				this.x = this.lines[this.cy()].length;
				this.render();
			}//»
		}//»
		else {//«
			this.x--;
			this.lines[this.cy()].splice(this.x, 1);
		}//»
		let usey=2;
		if (!is_zero) {
			usey = 1;
			do_check = true;
		}
		if (do_check && this.lines[this.cy()+usey] && this.lines[this.cy()].length == this.w-1) {//«
			let char_arg = this.lines[this.cy()+usey][0];
			if (char_arg) this.lines[this.cy()].push(char_arg);
			else this.lines.splice(this.cy()+usey, 1);
			if(this.lines[this.cy()+usey]) {//«
				this.lines[this.cy()+usey].splice(0, 1);
				let line;
				for (let i=usey+1; line = this.lines[this.cy()+i]; i++) {
					let char_arg = line[0];
					if (char_arg) {
						line.splice(0,1);
						this.lines[this.cy()+i-1].push(char_arg);
						if (!line.length) this.lines.splice(i+1, 1);
					}
				}
			}//»
		}//»
	}
	this.render();
}
//»
handleDelete(mod){//«
	if (mod == "") {
		if (this.lines[this.cy()+1]) {
			handle_arrow(KC.RIGHT, "");
			this.handleBackspace();
		}
		else {
			this.lines[this.cy()].splice(this.x, 1);
			this.render();
		}
	}
}
//»
async handleEnter(opts={}){//«
	if (!this.sleeping){
		this.bufPos = 0;
		this.commandHold = null;
		let str;
		if (this.curShell) return;
		else {//«
			if (this.curScrollCommand) str = this.insertCurScroll();
			else str = this.getComArr().join("");
			if (!this.#doContinue && !str) {
				this.env['?']="0";
				this.responseEnd();
				return;
			}
		}//»
		this.x=0;
		this.y++;
		this.lines.push([]);
		if (!this.#doContinue && (!str || str.match(/^ +$/))) {
			return this.responseEnd();
		}
		if (str) {
			this.lastComStr = str;
		}
		this.scrollIntoView();
		this.render();
		await this.execute(str, opts);
		this.sleeping = null;
	}
}
//»
handleLetterPress(char_arg, if_no_render){//«
	const dounshift=(uselines)=>{//«
		if ((uselines[this.cy()].length) > this.w) {
			let use_char = uselines[this.cy()].pop()
			if (!uselines[this.cy()+1]) uselines[this.cy()+1] = [use_char];
			else uselines[this.cy()+1].unshift(use_char);
			if (this.x==this.w) {
				this.x=0;
				this.y++;
			}
			for (let i=1; line = uselines[this.cy()+i]; i++) {
				if (line.length > this.w) {
					if (uselines[this.cy()+i+1]) uselines[this.cy()+i+1].unshift(line.pop());
					else uselines[this.cy()+i+1] = [line.pop()];
				}
				else {
					if (uselines[this.cy()+i-1].length > this.w) {
						line.unshift(uselines[this.cy()+i-1].pop());
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
	if (this.lines && this.lines[this.scrollNum + this.y]) {
		if ((this.x) < this.lines[this.scrollNum + this.y].length && this.lines[this.scrollNum + this.y][0]) {
			this.lines[this.scrollNum + this.y].splice(this.x, 0, char_arg);
			shift_line(this.x-1, this.y, this.x, this.y);
		}
	}

	let usex = this.x+1;
	let usey = this.y;
	this.y = usey;

	let endch = null;
	let didinc = false;
	if (usex == this.w) {
		if (this.lines[this.cy()][this.x+1]) endch = this.lines[this.cy()].pop();
		didinc = true;
		usey++;
		usex=0;
	}
	if (!this.lines[this.cy()]) {//«
		this.lines[this.cy()] = [];
		this.lines[this.cy()][0] = char_arg;
	}//»
	else if (this.lines[this.cy()] && char_arg) {//«
		let do_line = null;
		if (this.lines[this.cy()][this.x]) do_line = true;
		this.lines[this.cy()][this.x] = char_arg;
	}//»
	let ln = this.lines[this.scrollNum+usey];
	if (ln && ln[usex]) {//«
		if (this.x+1==this.w) {
			if (!didinc) {
				usey++;
				usex=0;
			}
			if (endch) {
				if (!ln||!ln.length||ln[0]===null) this.lines[this.scrollNum+usey] = [endch];
				else ln.unshift(endch);	
			}
		}
		else usex = this.x+1;
	}//»
	else {//«
		if (!ln||!ln.length||ln[0]===null) {
			this.lines[this.scrollNum+usey] = [endch];
		}
	}//»
	this.x = usex;
	this.y = usey;
	dounshift(this.lines);
//DLOPOEIRU
//	this.scrollIntoView(8);
	if (!if_no_render) this.render();
	this.textarea.value = "";
}
//»
handlePriv(sym, code, mod, ispress, e){//«
	if (this.sleeping) {
		if (ispress || sym=="BACK_") return;
	}
	if (this.curShell){//«
		if (sym==="c_C") {
//			this.curShell.cancelled_time = (new Date).getTime();
			this.curShell.cancel();
			this.curShell = null;
			this.sleeping = false;
			this.response("^C");
			this.responseEnd();
			return;
		}
		else if (this.#getChCb){
			if (ispress) {
				this.sleeping = true;
				this.#getChCb(e.key);
				this.#getChCb = null;
			}
			else {
				if (sym=="ENTER_"){
					this.sleeping = true;
					this.#getChCb(this.#getChDefCh);
					this.#getChDefCh = undefined;
				}
				return;
			}
		}
		else if (this.#readLineCb){
			if (ispress || OK_READLINE_SYMS.includes(sym)){
				if ((sym==="LEFT_" || sym=="BACK_") && this.x==this.#readLinePromptLen && this.y+this.scrollNum == this.curPromptLine+1) return;
			}
			else if (sym==="ENTER_"){
				let s='';
				let from = this.curPromptLine+1;
				for (let i=from; i < this.lines.length; i++) {
					if (i==from) {
						s+=this.lines[i].slice(this.#readLinePromptLen).join("");
					}
					else {
						s+=this.lines[i].join("");
					}
				}
				this.#readLineCb(s);
				this.#readLineCb = null;
				this.sleeping = true;
				return;
			}
			else{
				return;
			}
		}
		else return;
	}//»
	if (!this.lines[this.cy()]) {//«
		if (code == 75 && alt) return;
		else {
			if (this.cy() > 1 && !this.lines[this.cy()-1]) this.setPrompt();
			else {
				this.lines[this.cy()] = [null];
			}
		}
	}//»
	let ret = null;
 	if (ispress) {//«
		this.numCtrlD = 0;
		if (this.curScrollCommand) this.insertCurScroll();
		if (code == 0) return;
		else if (code == 1 || code == 2) code = 32;
		else if (code == 8226 || code == 9633) code = "+".charCodeAt();
		else if (code == 8211) code = "-".charCodeAt();
		else if (code == 3) {}
		else if (code < 32) code = 127;
		this.handleLetterPress(String.fromCharCode(code)); 
		return;
	}//»
	if (sym == "d_C") return this.doCtrlD();
	this.numCtrlD = 0;
	if (code >= 37 && code <= 40) this.handleArrow(code, mod, sym);
	else if (sym == "HOME_"|| sym == "END_") this.handlePage(sym);
	else if (code == KC['DEL']) this.handleDelete(mod);
	else if (sym == "p_CAS") this.togglePaste();
	else if (sym == "TAB_") this.handleTab();
	else if (sym == "BACK_")  this.handleBackspace();
	else if (sym == "ENTER_") this.handleEnter();
	else if (sym == "c_C") this.doCtrlC();
	else if (sym == "k_C") this.doClearLine();
	else if (sym == "y_C") {
		for (let i=0; i < this.currentCutStr.length; i++) this.handleLetterPress(this.currentCutStr[i]);
	}
	else if (sym == "b_CAS") {
log("BGLINES");
	}
	else if (sym == "c_CAS") {
		clear();
		this.responseEnd();
	}
	else if (sym=="a_C") {//«
		e.preventDefault();
		if (this.curScrollCommand) this.insertCurScroll();
		this.x=this.promptLen;
		this.y=this.curPromptLine - this.scrollNum;
		if (this.y<0) {
			this.scrollNum+=this.y;
			this.y=0;
		}
		this.render();
	}//»
	else if (sym=="e_C") {//«
		if (this.curScrollCommand) this.insertCurScroll();
		this.y=this.lines.length-this.scrollNum-1;
		if (this.y>=this.h){
			this.scrollNum+=this.y-this.h+1
			this.y=this.h-1;
		}
		if (this.lines[this.cy()].length == 1 && !this.lines[this.cy()][0]) this.x = 0;
		else this.x=this.lines[this.cy()].length;
		this.render();
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
if (this.ondevreload) delete this.ondevreload;
else this.ondevreload = ondevreload;
//log(`ondevreload == ${!!this.ondevreload}`);
//cwarn("Reload the terminal:", !this.ondevreload);
this.doOverlay(`Reload terminal: ${!this.ondevreload}`);
	}
else if (sym=="d_CAS"){

}
else if (sym=="s_CA"){
if (!dev_mode) return;
USE_DEVPARSER = !USE_DEVPARSER;
this.doOverlay(`Use Dev Parser: ${USE_DEVPARSER}`);

}
}
//»
handle(sym, e, ispress, code, mod){//«
	const{actor}=this;
	let marr;
	if (this.locked) {
		return;
	}
	if (this.isScrolling){
		if (!ispress) {
			if (sym.match(/^[A-Z]+_$/)){
				if (sym==="SPACE_") return;
			}
			else return;
		}
		this.scrollNum = scrollnum_hold;
		this.isScrolling = false;
		this.render();
		return;
	}
	if (e && sym=="d_C") e.preventDefault();
	if (!ispress) {//«
		if (sym == "=_C") {
			e.preventDefault();
			set_new_fs(this.grFs+1);
			return;
		}
		else if (sym == "-_C") {
			e.preventDefault();
			if (this.grFs-1 <= min_fs) return;
			set_new_fs(this.grFs-1);
			return;
		}
		else if (sym=="0_C") {
			this.grFs = this.defFs;
			set_new_fs(this.grFs);
			return;
		}
		else if (sym=="c_CS") return do_clipboard_copy();
		else if (sym=="v_CS") return do_clipboard_paste();
		else if (sym=="a_CA") return do_copy_buffer();
		else if (sym=="p_CA"){
			this.paragraphSelectMode = !this.paragraphSelectMode;
			this.doOverlay(`Paragraph select: ${this.paragraphSelectMode}`);
			return;
		}
	}//»
	if (code == KC['TAB'] && e) e.preventDefault();
	else this.awaitNextTab = null;
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

	this.handlePriv(sym, code, mod, ispress, e);
}
//»

//»

async onappinit(appargs={}){//«
cwarn(12345);
	this.env['USER'] = globals.CURRENT_USER;
	this.cur_dir = this.getHomedir();
	this.cwd = this.cur_dir;
	let gotfs = localStorage.Terminal_fs;
	if (gotfs) {
		let val = strNum(gotfs);
		if (isNum(val,true)) this.grFs = val;
		else {
			this.grFs = this.defFs;
			delete localStorage.Terminal_fs;
		}
	}
	else this.grFs = this.defFs;
	this.wrapdiv._fs = this.grFs;
	this.resize();
	let {reInit} = appargs;
	if (!reInit) reInit = {};
	let {termBuffer, addMessage, commandStr, histories, useOnDevReload} = reInit;
	if (isBool(useOnDevReload)) USE_ONDEVRELOAD = useOnDevReload;
	if (termBuffer) this.history = termBuffer;
	else {
		let arr = await this.getHistory();
		if (!arr) this.history = [];
		else {
			arr.pop();
			arr = arr.reverse();
			arr = util.uniq(arr);
			this.history = arr.reverse();
		}
	}
	let init_prompt = `LOTW shell\x20(${this.winid.replace("_","#")})`
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
		let rv = ShellMod.util.addToEnv(env_lines, this.env, {if_export: true});
		if (rv.length){
			init_prompt+=`\n${env_file_path}:\n`+rv.join("\n");
		}
	}
{
	let rv = await ShellMod.util.doImports(ADD_COMS, cwarn);
if (rv) init_prompt += "\nImported libs: "+rv;
}
	this.response(init_prompt);
	if (!dev_mode) {
		this.response(`Hint: The LOTW shell is currently for non-algorithmic "one-liners" like:`, {isWrn: true});
		this.response(`  $ cat some files here || echo "That didn't quite work!"`, {isWrn: true});
	}
	this.didInit = true;
	this.sleeping = false;
	this.setPrompt();
	this.render();
	if (commandStr) {
		for (let c of commandStr) this.handleLetterPress(c); 
		this.handleEnter({noSave: true});
	};
	if (USE_ONDEVRELOAD) this.ondevreload = this._ondevreload;
}//»

//Obj/CB«

async getch (promptarg, def_ch){//«
	if (promptarg){
		for (let ch of promptarg) this.handleLetterPress(ch);
	}
	this.sleeping = false;
	return new Promise((Y,N)=>{
		this.#getChDefCh = def_ch;
		this.#getChCb = Y;
	});
}
//»
async readLine(promptarg){//«
	if (this.lines[this.lines.length-1]&&this.lines[this.lines.length-1].length){
		line_break();
		this.curPromptLine = this.y+this.scrollNum-1;
	}
	this.x=0;
	this.sleeping = false;
	if (promptarg){
		this.#readLinePromptLen = promptarg.length;
		for (let ch of promptarg) this.handleLetterPress(ch);
	}
	else this.#readLinePromptLen = 0;
	this.x = this.#readLinePromptLen;
	return new Promise((Y,N)=>{
		this.#readLineCb = Y;
	});
}
//»

onescape(){//«
	textarea&&textarea.focus();
	if (check_scrolling()) return true;
	if (status_bar.innerText){
		status_bar.innerText = "";
		return true;
	}
	return false;
}
//»
onsave(){//«
	const{actor}=this;
//	if (editor) editor.save();
	if (actor && actor.save) actor.save();
}
//»
async _ondevreload(){//«

/*«
	this.doOverlay("ondevreload: start");

//EIOFJKL
	let use_str;
	if (this.curShell){
		use_str = this.curShell.commandStr;
		this.curShell.cancel();
		this.responseEnd();
	}
//	await load_new_shell();
	ShellMod.util.deleteMods(DEL_MODS);
	if (use_str){
		handle_line_str(use_str);
		this.handleEnter();
	}
//	ShellMod.util.deleteComs(DEL_COMS);
//	await ShellMod.util.doImports(ADD_COMS, cerr);
	this.doOverlay("ondevreload: done");
»*/

}
//»

onkill(if_dev_reload){//«
	const{actor}=this;
//	execute_kill_funcs();
	if (this.cur_edit_node) this.cur_edit_node.unlockFile();
	if (!if_dev_reload) {
		return save_history();
	}

	this.reInit={
		termBuffer: this.history,
		useOnDevReload: !!this.ondevreload
	};
//	let actor = editor||pager;
	if (actor) {
		this.reInit.commandStr = actor.command_str;
	}

	ShellMod.util.deleteMods(DEL_MODS);
	ShellMod.util.deleteComs(DEL_COMS);

	delete globals.shell_commands;
	delete globals.shell_command_options;

	save_history();

}
//»
onfocus(){//«
//cwarn("FOCUS!");
	this.isFocused = true;
	this.topwinFocused=true;
	if (this.curScrollCommand) this.insertCurScroll();
	this.render();
	this.textarea.focus();

}
//»
onblur(){//«
//cwarn("BLUR");
	this.isFocused = false;
	this.topwinFocused=false;
	this.render();
	if (this.curScrollCommand) this.insertCurScroll();
	this.textarea.blur();
}
//»
onresize(){
	this.resize();
}
onkeydown(e,sym,mod){
//log("DOWN", e);
	this.handle(sym,e,false,e.keyCode,mod);
}
onkeypress(e) {
//log("PRESS", e);
	this.handle(e.key, e, true, e.charCode, "");
}
onkeyup(e,sym){
const{actor}=this;
if (actor&&actor.onkeyup) actor.onkeyup(e, sym);
}
//Terminal-specific methods

//Editor/Pager specific«
resetXScroll(){tabdiv._x=0;}
xScrollTerminal(opts={}){//«

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
this.render();
}
//»
clipboardCopy(s){do_clipboard_copy(null,s);}

setLines(linesarg, colorsarg){//«
	this.lines = linesarg;
	this.lineColors = colorsarg;
}//»
//this.init_new_screen = (actor_arg, classarg, new_lines, new_colors, n_stat_lines, escape_fn) => {
initNewScreen(actor_arg, classarg, new_lines, new_colors, n_stat_lines, funcs={}){//«
	const{actor}=this;
	let escape_fn = funcs.onescape;
	let dev_reload_fn = funcs.ondevreload;
//	let screen = {actor, appclass, this.lines, this.lineColors, x, y, this.scrollNum, this.numStatLines, onescape: termobj.onescape};
	let screen = {
		actor,
		appclass: this.appClass,
		lines: this.lines,
		line_colors: this.lineColors,
		x: this.x,
		y: this.y,
		scroll_num: this.scrollNum,
		num_stat_lines: this.numStatLines,
		funcs: {
			onescape: this.onescape,
			ondevreload: this.ondevreload
		}
	};
	if (!this.actor) this.holdTerminalScreen = screen;
	termobj.onescape = escape_fn;
	termobj.ondevreload = dev_reload_fn;
	this.actor = actor_arg;

	this.appClass = classarg;
	this.isEditor = appclass == "editor";
	this.isPager = appclass == "pager";

	this.lines = new_lines;
	this.lineColors = new_colors;
	this.scrollNum=this.x=this.y=0;
	this.numStatLines=n_stat_lines;
	if (this.numStatLines) {
		this.wrapdiv.appendChild(statdiv);
		this.generateStatHtml();
	}
	return screen;

}//»
quitNewScreen(screen){//«
//	const{actor}=this;
	let actor;
	if (screen === this.holdTerminalScreen) this.holdTerminalScreen = null;
	let old_actor = this.actor;
	({
		actor,
		appclass,
		lines: this.lines,
		line_colors: this.lineColors,
		x: this.x,
		y: this.y,
		scroll_num: this.scrollNum,
		num_stat_lines: this.numStatLines
	} = screen);

	this.actor = actor;
	this.isEditor = appclass == "editor";
	this.isPager = appclass == "pager";
	if (!screen.funcs) screen.funcs = {};
	termobj.onescape = screen.funcs.onescape;
	termobj.ondevreload = screen.funcs.ondevreload;
	
	if (!this.numStatLines){
		this.statdiv._del();
	}
	this.tabdiv._x = 0;
	if (old_actor&&old_actor.cb) {
		old_actor.cb(screen);
	}
}//»

//»
setTabSize(s){//«
	if (!s.match(/[0-9]+/)) return;
	let n = parseInt(s);
	if (n==0||n>MAX_TAB_SIZE) return;
	tabdiv.style.tabSize = n;
	this.tabsize = tabdiv.style.tabSize;
	return true;
}
//»
tryKill(){//«
	if (this.isEditor) {
//		editor.set_stat_message("Really close the window? [y/N]");
		actor.stat_message="Really close the window? [Y/n]";
		this.render();
		actor.set_ask_close_cb();
	}
	else{
cwarn("TRY_KILL CALLED BUT this.isEditor == false!");
	}
}
//»
curWhite(){this.curBG="#ddd";this.curFG="#000";}
curBlue(){this.curBG="#00f";this.curFG="#fff";}
executeBackgroundCommand(s){//«

	let shell = new Shell(this, true);
	let env = {};
	for (let k in this.env){
		env[k]=this.env[k];
	}
	this.shell.execute(s,{env});

}//»
get useDevParser(){//«
	return USE_DEVPARSER;
}//»

//»

}; 

//»

