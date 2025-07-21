/*URKSPLK: In order to reload the terminal AND the shell with the same Alt+r keypress,«
we have to call Win.reload({appOnly: true}), otherwise there'd be an infinite loop.

The interesting part of passwordMode is @DYWUEORK, where there is a tineout in the toString
method of the new String's, so that the output is the actual letter before the timeout
and then a "*" after it. This mimics the way that cellfonez typically handle password
inputs. Also of relevance is the bit @WZZKUDJK that takes the valueOf() of each individual
character, which is necessary for password mode chars to return the "real" string rather
than, e.g. "********".
» */
/*5/6/25: Just put the shell into mods/lang/shell.js.«
Now need to figure out how to deal with the onreload situation:
1) In normal REPL mode, we might want to reload the terminal app (this file) or the shell
2) For each submode (like vim), we might want to reload it or something that it is controlling
(like a development app window whose code we are editing and we don't want to have to switch to 
in order to reload it)

*We deal with it much like the onescape situation (and the old ondevreload situation).

»*/
//Notes«
/*4/3/25: Need to make sure that the verydumbhack @SAYEJSLSJ actually works for all
permutations of command line history heredoc editing. So test this out with multiple
heredocs.
*/
/*4/2/25:
Just created an updated version of handleLetterPress, and added an adjustLinesAdd method 
as a helper for helping with the overflow.

Now need an updated handleBackspace @MSKEUTJDK

*/
/*4/1/25: In handleLineStr (esp for history scrolling) @PAKJSHFK, just created«
a lastln variable in order to do backward/forward linking of "implicit" line continuations (via
_contPrev/_contNext variables tagged to the relevant lines), so that we can
unambiguously know how to treat the various kinds of edits vis-a-vis these
lines. So, when we are backspacing the beginning of a wrapped line onto a previous
shorter line (previous lines can only ever be shorter when inserted via the history scrolling
mechanism)...

So, let's look at handleBackspace @GFUIABRM, which is a really old/crappy algorithm
that is really just meant for standard (non-history inserted) 1-character adjustments.

It's actually the stuff @JEPOIKLMJYH
BL
»*/
/*3/31/25: In order to do readline editing, in handleArrow @SBSORJJS Just added the check for:«
	if (this.curShell && !this.readLineCb) return

In Term.handleEnter @VSHEUROJ: Just added forceNewline (instead of the lower level crap...),
which internally updates curPromptLine (which is important for when we are starting a heredoc).
We want to update curPromptLine *AFTER EVERY ENTER*.

@KSDJJSAKJR: Just went ahead and directly set promptLen. Should probably just get rid
of ALL readLinePromptLen's, since we want to simplify the idea of what/where a "prompt line"
is.

Now we are having problems keeping track of where we are in terms of being in the
top/interactive level (including in sub parsers that need to do line continuations),
and being in scripts. Right now, script text is being placed into finalComStr @AGRHSORJF.
@SAKROAP, when making a script just deleted comopts.isInteractive.

@SEYIAW: JUST ADDED MAINPARSER TO THE OPTS TO COMPILE!!!

»*/
/*3/30/25: TODO XXX POSSIBLE BUG XXX TODO«

@WSFOKGKDH: For comsubs we were doing tok.raw, but this was *NOT* being updated properly
when doing multiline stuff like:

$ echo $(
> ls
> )

...so we switched it to tok.val, and everything was working okay.

!!!   SO NOW WE NEED TO SEE ABOUT *EITHER* PROPERLY UPDATING tok.raw *OR* JUST USING tok.val 
IF THAT IS APPROPRIATE, WHICH BEGS THE QUESTION: WHY DOES tok.raw EVEN EXIST?   !!!


The heredoc parsing error @SGFKGLSJR occurs when you are editing a heredoc in a
multi-line command, and you happened to edit the heredoc.delim token (e.g. "eof" or 
"EOF" somesuch nonsense). In pure interactive mode, the REPL keeps on going until
you complete all the heredocs, and in pure script mode, the error right after the
one we are barfing with ("warning: heredoc delimited by end-of-file") happens when
we run out of lines. So we were searching for a combination of script (until running out),
followed by the interactive (until all matches). But seeing as this is trying to
"mix and match" radically different pathways, it isn't too easy to get working, and
it doesn't seem worth the effort simply because the user is trying to do something as
trivial as editing one of the previously matching delimeter tokens. If we actually *do*
want to change a delimeter, we just need to make sure that both the beginning and
the ending ones are changed to the same one!



@WMPLKXED: Here is the *FINAL* command string (after all of the scanner/parser 
continuation prompts, if any, have finished), with embedded newlines. We can save this
to command history by replacing the newlines with tabs (since tabs are *NEVER* inside
of interactive shell scripts), then upon scrolling the history, we have to split the
string on tabs, and then put all of the lines onto the terminal.

Now scrutinizing handleBackspace @MSKEUTJDK. Just want to enable basic multi-line editing...


»*/
//»

//This means that the terminal app window is reloaded by Ctrl+r (there is no onreload on the app)
//let USE_ONRELOAD = false;

const RELOAD_LIBS=[
//"games.poker",
"games.cfr"
];

let RELOAD_TERM_ONRELOAD = false;

//This means that the terminal app's onreload method is set to _onreload (to reload the shell)
let USE_ONRELOAD = true;
//let NO_ONRELOAD = false;
//Terminal Imports«
const NS = LOTW;
const util = LOTW.api.util;
const globals = LOTW.globals;
const{Desk}=LOTW;
const {//«
	strNum,
	isArr,
	isStr,
	isNum,
	isObj,
	isNode,
	isDir,
	isFile,
	isFunc,
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
	sleep,
	mkOverlay
} = util;//»
const {//«
	KC,
	DEF_PAGER_MOD_NAME,
	TEXT_EDITOR_APP,
	LINK_APP,
	FOLDER_APP,
	FS_TYPE,
	MOUNT_TYPE,
	SHM_TYPE,

    DIR_TYPE,
    LINK_TYPE,
    BAD_LINK_TYPE,
    IDB_DATA_TYPE,

	fs,
	isMobile,
	dev_mode,
	admin_mode,
	EOF,
//	nodejs_mode,
	TERM_STAT_TYPES,
	VIM_MODES
} = globals;//»

const TAB_KC = KC['TAB'];
const RIGHT_KC = KC['RIGHT'];
const UP_KC = KC['UP'];
const DOWN_KC = KC['DOWN'];
const DEL_KC = KC['DEL'];

const INT_ALNUM_RE = /[0-9\p{Letter}]/u;
const INT_ALNUM_PRINT_RE = /[\x20-\x7E\p{Letter}]/u;

//const PRINTABLE_RE = /[\p{Print}]/u;
/*
RIGHT
UP
DOWN
DEL
*/


const{STAT_NONE,STAT_OK,STAT_WARN,STAT_ERR} = TERM_STAT_TYPES;
const {
	COMMAND_MODE,
	INSERT_MODE,
	REPLACE_MODE,
	VIS_LINE_MODE,
	VIS_MARK_MODE,
	VIS_BLOCK_MODE,
	CUT_BUFFER_MODE,
	LINE_WRAP_MODE,
	SYMBOL_MODE,
	FILE_MODE,
	COMPLETE_MODE,
	REF_MODE
} = VIM_MODES;

const fsapi = fs.api;
const widgets = LOTW.api.widgets;
const {poperr} = widgets;

const HISTORY_FOLDER = `${globals.HOME_PATH}/.history`;
const HISTORY_PATH = `${HISTORY_FOLDER}/shell.txt`;
const HISTORY_PATH_SPECIAL = `${HISTORY_FOLDER}/shell_special.txt`;
const LEFT_KEYCODE = KC.LEFT;

const DEL_MODS=[
//	"term.less",
//	"term.vim",
//	"term.log"
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
//"test"
];

if (dev_mode){
//	ADD_COMS.push("shell");
}


//»

//Terminal«

export const app = class {

//Private Vars«

//#readLineCb;
//#readLineStr;
//#readLineStartLine;
//#getChCb;
//#getChDefCh;

//»
constructor(Win){//«

this.Win=Win;

this.main = Win.main;
this.mainWin = Win.main;
this.Desk = Win.Desk;
this.statusBar = Win.statusBar;
this.appClass="cli";
this.isEditor = false;
this.isPager = false;
this.env={};
this.env['USER'] = globals.CURRENT_USER;
//this.env = globals.TERM_ENV;
this.ENV = this.env;
//this.funcs = globals.TERM_FUNCS;
this.funcs={};
//Editor mode constants for the renderer (copy/pasted from vim.js)«
/*
this.modes= {
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
*/
//»

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
text upon executing the this.doCopyBuffer command with Cltr+Alt+a (a_CA).

-------------------------------------
These are a bunch of words that I'm writing, so I can seem very literate, and this is a crazily-hyphenated-word!

Here comes another paragraph...
-------------------------------------

The actual line buffer in the editor is left unchanged. This is just a convenience function
to allow for seamless copying between the editor and web-like applications that handle their 
own formatting of paragraphs.

Toggling of this.paragraphSelectMode is now done with Ctrl+Alt+p (p_CA).

»*/
this.paragraphSelectMode = true;

this.isScrolling = false;
this.didInit = false;
this.winid = this.Win.id;
this.cursorId = `cursor_${this.winid}`;
this.numId = this.winid.split("_")[1];

this.tabSize=4;
this.minTermWid = 15;
this.minHistStrLen = 8;
this.maxTabSize = 256;
this.comCompleters = ["help", "app", "appicon", "lib", "import"];
//this.okReadlineSyms = ["DEL_","BACK_","LEFT_", "RIGHT_"];
this.okReadlineSyms = ["DEL_","BACK_","LEFT_", "LEFT_C", "RIGHT_", "RIGHT_C", "a_C", "e_C"];
/*
this.stat={
	none: 0,
	ok: 1,
	warning: 2,
	error: 3
};
*/
this.x=0;
this.y=0;
this.numCtrlD = 0;
this.cleanCopiedStringMode=false;
this.doExtractPrompt = true;
this.maxOverlayLength=42;
this.terminalIsLocked=false;

//vim row folds
this.rowFoldColor = "rgb(160,160,255)";
this.bgCol="#080808";
this.ff = "monospace";
this.fw="500";
this.curBG="#00f";
this.curFG="#fff";
this.curBGBlurred = "#444";
//this.overlayOp="0.66";
this.tCol = "#e3e3e3";
this.highlightActorBg = false;
this.actorHighlightColor="#101010";

this.noPromptMode=false;
this.comScrollMode=false;

this.bufPos=0;
this.curPromptLine=0;
this.numStatLines=0;
this.scrollNum=0;
this.minFs=8;
this.defFs=24;
this.maxFmtLen=4997;
this.rootState = false;
this.lsPadding = 2;
this.lines=[];
this.lineColors=[];
this.currentCutStr="";
this.history=[];

this.env['USER'] = globals.CURRENT_USER;
this.cur_dir = this.getHomedir();
this.cwd = this.cur_dir;

this.makeDOMElem();

this.setFontSize();
this.resize({isInit: true});

}//»

//«DOM
makeDOMElem(){//«

const{main}=this;
main._tcol="black";
main._bgcol=this.bgCol;

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
tabdiv.onmousedown=(e)=>{
	this.downEvt=e;
};
tabdiv.onmouseup=e=>{//«
	if (!this.downEvt) return;
	let d = util.dist(e.clientX,e.clientY,this.downEvt.clientX, this.downEvt.clientY);
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
tabdiv.ondblclick = e => {//«
	e.stopPropagation();
	this.dblClickTimeout = setTimeout(()=>{
		this.focusOrCopy();
	}, 500);
};//»
tabdiv._loc(0,0);
tabdiv.style.tabSize = this.tabSize;
wrapdiv.tabdiv = tabdiv;
//»
let bgdiv = make('div');
bgdiv._w="100%";
bgdiv._h="100%";
bgdiv._pos="absolute";
bgdiv._loc(0,0);

let statdiv = make('div');//«
statdiv._w="100%";
statdiv._h="100%";
statdiv._pos="absolute";
statdiv._loc(0,0);
//»
let textarea = make('textarea');//«
textarea.id = `textarea_${this.Win.id}`;
textarea._noinput = true;
textarea.width = 1;
textarea.height = 1;
textarea.style.opacity = 0;
textarea.focus();
//»
let areadiv = make('div');//«
areadiv._pos="absolute";
areadiv._loc(0,0);
areadiv._z=-1;
areadiv.appendChild(textarea);
//»

//let overlay;«

//const overlay = mkOverlay({id: this.winid});

//»

//Listeners«
main.onwheel=e=>{//«
	if (!this.sleeping){
		let dy = e.deltaY;
		if (!this.isScrolling){
			if (!this.scrollNum) return;
			if (dy > 0) return;
			this.scrollNumHold = this.scrollNum;
			this.isScrolling = true;
//			wheel_iter = 0;
			this.wheelIter=0;
		}
		let skip_factor = 10;
/*
		if (this.env.SCROLL_SKIP_FACTOR){
			let got = this.env.SCROLL_SKIP_FACTOR.ppi();
			if (!Number.isFinite(got)) cwarn(`Invalid SCROLL_SKIP_FACTOR: ${this.env.SCROLL_SKIP_FACTOR}`);
			else skip_factor = got;
		}
*/
		this.wheelIter++;
//		wheel_iter++;
		if (this.wheelIter%skip_factor) return;
		if (dy < 0) dy = Math.ceil(4*dy);
		else dy = Math.floor(4*dy);
		if (!dy) return;
		this.scrollNum += dy;
		if (this.scrollNum < 0) this.scrollNum = 0;
		else if (this.scrollNum >= this.scrollNumHold) {
			this.scrollNum = this.scrollNumHold;
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

wrapdiv.appendChild(bgdiv);
wrapdiv.appendChild(tabdiv);
main.appendChild(wrapdiv);
main.appendChild(areadiv);

this.tabSize = parseInt(tabdiv.style.tabSize);
this.textarea = textarea; 
this.areadiv = areadiv;
this.tabdiv = tabdiv;
this.bgdiv = bgdiv;
this.wrapdiv = wrapdiv;
//this.overlay = overlay;
this.statdiv = statdiv;

this.Win.mkOverlay();
this.doOverlay = (str) => {
	this.Win.doOverlay(str);
};
//textarea.onpaste = this.onPaste;
textarea.onpaste=(e)=>{
	this.onPaste(e);
};

}//»
//»
//Execute«

async execute(str, opts={}){//«

	const shell = new this.Shell(this);

	this.curShell = shell;
	str = str.replace(/\x7f/g, "");
	await this.curShell.execute(str, {
		env: this.env,
		term: this,
		isInteractive: true,
		shell: this.curShell,
		heredocScanner:eof=>{return this.heredocScanner(eof);},
	});
	if (this.curShell.cancelled) {
		this.responseEnd();
		return;
	}
	let save_str;
//cwarn("EXE",this.curShell.parser.mainParser.id, this.curShell.parser.mainParser.finalComStr);
//GADLFJGMG
	if (this.curShell.parser.mainParser.finalComStr) save_str = this.curShell.parser.mainParser.finalComStr.replace(/\n/g, "\t");
//log(this.curShell.parser);
	this.responseEnd();
	if (opts.noSave) return;
	await this.updateHistory(save_str);
}//»
executeBackgroundCommand(s){//«

	let shell = new this.Shell(this, true);
	let env = {};
	for (let k in this.env){
		env[k]=this.env[k];
	}
	shell.execute(s,{env});

}//»

//»
//Util«

async loadShell(){//«
	if (!globals.ShellMod) {
		if (!await util.loadMod("lang.shell")) {
			this.Win._fatal(new Error("Could not load the shell module"));
			return;
		}
		globals.ShellMod = new LOTW.mods["lang.shell"]();
		globals.ShellMod.init();
	}
	this.ShellMod = globals.ShellMod;
	this.Shell = globals.ShellMod.Shell;
}//»
//MSFUNPEJ
get termLines(){//«
	if (this.holdTerminalScreen) return this.holdTerminalScreen.lines;
	return this.lines;
}//»
get termLineColors(){//«
	if (this.holdTerminalScreen) return this.holdTerminalScreen.lineColors;
	return this.lineColors;
}//»

onPaste(e){//«
//	if (pager) return;
	let{textarea} = this;
	textarea.value="";
	setTimeout(()=>{
		let val = textarea.value;
		if (!(val&&val.length)) return;
		if (this.isEditor) this.actor.check_paste(val);
		else this.doPaste();
	}
	,25);
}//»
setFontSize(){//«
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
}//»

tryKill(){//«
	if (this.isEditor) {
		this.actor.stat_message="Really close the window? [Y/n]";
		this.render();
		this.actor.set_ask_close_cb();
	}
	else{
cwarn("TRY_KILL CALLED BUT this.isEditor == false!");
	}
}
//»
forceNewline(){//«
	const{lines}=this;
	if (lines[lines.length-1]&&lines[lines.length-1].length){
		this.lineBreak();
//		this.curPromptLine = this.y+this.scrollNum-1;
		this.curPromptLine = this.y+this.scrollNum;
	}
	this.x=0;
	this.scrollIntoView();
}//»
async getch(promptarg, def_ch){//«
	this.forceNewline();
	if (promptarg){
		for (let ch of promptarg) this.handleLetterPress(ch);
	}
	this.sleeping = false;
	return new Promise((Y,N)=>{
		this.getChDefCh = def_ch;
		this.getChCb = Y;
	});
}
//»
async heredocScanner(eof_tok){//«
	let doc = [];
	let prmpt="> ";
	while (true){
		let rv = await this.readLine(prmpt);
		if (rv === EOF) return EOF;
		if (rv===eof_tok) {
			break;
		}
		doc.push(rv);
	}
	return doc;
}//»
async readLine(promptarg, opts={}){//«
	const{lines}=this;
	this.sleeping = false;
	if (!this.actor) {
		this.forceNewline();
		if (promptarg){
//			this.#readLinePromptLen = promptarg.length;
			this.promptLen = promptarg.length;
			for (let ch of promptarg) this.handleLetterPress(ch);
		}
//		else this.#readLinePromptLen = 0;
		else this.promptLen = 0;
//KSDJJSAKJR
//		this.promptLen = this.#readLinePromptLen;
//		this.x = this.#readLinePromptLen;
		this.x = this.promptLen;
	}
	this.readLineStartLine = this.cy();//WMNYTUE
	this.passwordMode = opts.passwordMode;
	return new Promise((Y,N)=>{
//XKLRYTJTK
		if (this.actor) this.readLineStr="";
		this.readLineCb = Y;
	});
}
//»
setTabSize(arg){//«
	if (isStr(arg)){
		if (!arg.match(/^[0-9]+$/)) {
cwarn(`Invalid arg to setTabSize: '${arg}'`);
			return;
		}
	}
	let n = parseInt(arg);
	if (!Number.isFinite(n)){
cwarn(`Invalid arg to setTabSize: '${arg}'`);
		return;
	}
	if (n==0||n>this.maxTabSize) return;
	this.tabdiv.style.tabSize = n;
	this.tabSize = n;
	return true;
}
//»
curWhite(){this.curBG="#ddd";this.curFG="#000";}
curBlue(){this.curBG="#00f";this.curFG="#fff";}
stat(mess){this.statusBar.innerText=mess;};
async getLineFromPager(arr, name){//«
	if (!await util.loadMod(DEF_PAGER_MOD_NAME)) {
		return poperr("Could not load the pager module");
	}
	let less = new LOTW.mods[DEF_PAGER_MOD_NAME](this);
	if (await less.init(arr, name, {lineSelect: true, opts: {}})) return arr[less.y+less.scroll_num];

}//»
async selectFromHistory(path){//«
	let arr = await path.toLines();
	if (!(isArr(arr) && arr.length)) {
cwarn("No history lines from", path);
		return;
	}
	let str = await this.getLineFromPager(arr, path.split("/").pop());
	if (str) this.handleLineStr(str);
	this.render();
}
//*/
//»

togglePaste(){//«
	let{textarea, areadiv}=this;
	if (textarea){
		textarea._del();
		this.textarea = null;	
		this.doOverlay("Pasting is off");
		return;
	}
	textarea = make('textarea');
	textarea._noinput = true;
	textarea.width = 1;
	textarea.height = 1;
	textarea.style.opacity = 0;
//	textarea.onpaste = onpaste;
	areadiv.appendChild(textarea);
	textarea.focus();
	this.textarea = textarea;
	this.doOverlay("Pasting is on");
//	textarea.onpaste = this.onPaste;
	textarea.onpaste=(e)=>{
		this.onPaste(e);
	};
}
//»

doPaste(){//«
	let val = this.textarea.value;
	if (val && val.length) this.handleInsert(val);
	this.textarea.value="";
};
//»
checkScrolling(){//«
	if (this.isScrolling){
		this.scrollNum = this.scrollNumHold;
		this.isScrolling = false;
		this.render();
		return true;
	}
	return false;
}
//»

wrapLine(str){//«
	str = str.replace(/\t/g,"\x20".rep(this.tabSize));
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
	else this.doClipboardCopy();
}
//»

getHomedir(){//«
	if (this.rootState) return "/";
	return globals.HOME_PATH;
}
//»
getBuffer(if_str){//«
	let ret=[];
	if (if_str) ret = "";
	let ln;
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
//		ret = linesToParas(ret);
		let paras = linesToParas(ret);
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
	if (!this.doExtractPrompt) return str;
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
doCopyBuffer()  {//«
	this.copyText(this.getBuffer(true), "Copied: entire buffer");
}//»

doClipboardCopy(if_buffer, strarg){//«
	const{textarea}=this;
	if (!textarea) return;
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
	else if (if_buffer) str = this.getBuffer(true);
	else str = getSelection().toString()
	if (this.cleanCopiedStringMode) {
		str = str.replace(/\n/g,"");
//		str = extract_prompt_from_str(str);
		str = this.extractPromptFromStr(str);
	}
	else {
//cwarn("Do you really ever want this string to be stripped of newlines and the prompt? this.cleanCopiedStringMode==false !!!");
	}

	if (this.paragraphSelectMode) {
//cwarn("PARAMODE!");
//		str = str.split("\n").join("");
		str = linesToParas(str, {toStr: true});
//log(str);
	}
	do_copy(str);
	this.textarea.focus();
	this.doOverlay(`Copied: ${str.slice(0,9)}...`);
}
//»
doClipboardPaste(){//«
	if (!this.textarea) return;
	this.textarea.value = "";
	document.execCommand("paste")
}
//»
setNewFs(val){//«
	this.grFs = val;
	localStorage.Terminal_fs = this.grFs;
	this.wrapdiv._fs = this.grFs;
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
cy(){//«
	return this.y + this.scrollNum;
}//»


//»
//Render«

render(opts={}){//«

	const{tabdiv, actor}=this;
//Var«

//	let actor = editor||pager;
//	const{actor}=this;
	let stat_x;
	if (actor) {
		stat_x = actor.stat_x;
		this.x=actor.x;
		this.y=actor.y;
		this.scrollNum = actor.scroll_num;
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

	if (this.isEditor) ({mode,symbol,seltop,selbot,selleft,selright,selmark,opts,num_lines,ry}=actor);
	if (!(this.nCols&&this.nRows)) return;
//	let visual_line_mode = (mode===this.modes.visLine) || line_select_mode;
	let visual_line_mode = (mode===VIS_LINE_MODE) || line_select_mode;
	if (line_select_mode) seltop = selbot = this.scrollNum+this.y;
	
//	if (mode===this.modes.ref||mode===this.modes.symbol||mode===this.modes.complete){
	if (mode===REF_MODE||mode===SYMBOL_MODE||mode===COMPLETE_MODE){
		visual_line_mode = true;
		seltop = selbot = this.y+this.scrollNum;
	}
//	let visual_block_mode = mode===this.modes.visBlock;
	let visual_block_mode = mode===VIS_BLOCK_MODE;
//	let visual_mark_mode = mode===this.modes.visMark;
	let visual_mark_mode = mode===VIS_MARK_MODE;
	let visual_mode = visual_line_mode || visual_mark_mode || visual_block_mode;
	let docursor = false;
	if (opts.noCursor){}
	else if (!(this.terminalIsLocked||this.isPager||stat_input_type||this.isScrolling)) docursor = true;
	let usescroll = this.scrollNum;
	let scry=usescroll;
	let slicefrom = scry;
	let sliceto = scry + this.nRows;
	let uselines=[];
	let is_str = false;
//	let x_scroll = 0;
//	let usex = this.x-x_scroll;
	let usex = this.x;
	let outarr = [];
	let donum;
//»
	let push_empty_line = !(this.isEditor||this.isPager);
	for (let i=slicefrom; i < sliceto; i++) {//«
		let ln = this.lines[i];
//		if (ln&&ln.length){
		if (ln){
			uselines.push(ln.slice());
			continue;
		}
		if (push_empty_line){
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
//log(donum);

//	if (docursor&&i==this.y&&this.isEditor&&mode!==LINE_WRAP_MODE) {
	let slice_from = 0;
	let slice_to;
/*

Simple hack to keep the cursor (non-jarringly) at the end of the right edge of
the screen when it would otherwise be off screen.

*/
	if (docursor&&this.isEditor&&mode!==LINE_WRAP_MODE) {
/*
		let ln = uselines[this.y];
		let marr = ln.match(/^(\t+)/);
		if (marr){
			let n_tabs = marr[1].length;
//log(n_tabs);
//			let rem_chars = usex - n_tabs;
//			x_wid = n_tabs*this.tabWid + rem_chars*this.cellWid;
		}
*/
		let diff = usex - this.w + 1;
		let no_colors = false;
		if (diff > 0){
			slice_from = diff;
			usex-=slice_from;
			slice_to = diff + this.w;
			no_colors = true;
		}
//		this.setXScroll(arr.slice(0, usex).join(""), usex);
	}
	for (let i = 0; i < donum; i++) {//«

		let arr = uselines[i];
		if (slice_from) arr = arr.slice(slice_from, slice_to);
		else arr = arr.slice(0, this.w);
//DOCURSOR
		let ind;
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
//				useleft -= x_scroll;
//				useright -= x_scroll;
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
//				let num1 = parseInt(numstr)-x_scroll;
				let num1 = parseInt(numstr);
				let obj = colobj[numstr];
if (obj[0] < 1){
cwarn("GOT INVALID colobj", obj);
continue;
}
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

		if (docursor&&i==this.y) {//«
//		if (!(this.isPager||stat_input_type||this.isScrolling)) {
			let usebg;
			if (!this.isFocused) usebg = this.curBGBlurred;
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
		}//»

		let s = arr.join("");
		if (actor && !arr._noline && this.highlightActorBg) outarr.push(`<span style="background-color:${this.actorHighlightColor};">${s}</span>`);
		else outarr.push(s);

	}//»

	if (actor) {//Status line«
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
				if (typ==STAT_OK) {
					bgcol="#070";
					tcol="#fff";
				}
				else if (typ==STAT_WARN) bgcol="#dd6";
				else if (typ==STAT_ERR) {
					bgcol="#900";
					tcol="#fff";
				}
				if (bgcol) mess = `<span style="color:${tcol};background-color:${bgcol}">${mess}</span>`;

//				editor.stat_message=null;
				actor.stat_message=null;
				actor.stat_message_type=null;
			}//»
			else {//«
//				if (mode === this.modes.insert) mess = "-- INSERT --";
				if (mode === INSERT_MODE) mess = "-- INSERT --";
//				else if (mode === this.modes.replace) mess = "-- REPLACE --";
				else if (mode === REPLACE_MODE) mess = "-- REPLACE --";
//				else if (mode == this.modes.symbol) {
				else if (mode === SYMBOL_MODE) {
					if (symbol) mess = `-- SYMBOL: ${symbol} --`;
					else mess = "-- SYMBOL --";
				}
//				else if (mode == this.modes.ref) {
				else if (mode === REF_MODE) {
					if (symbol) mess = `-- REF: ${symbol} --`;
					else mess = "-- REF --";
				}
//				else if (mode === this.modes.complete) {
				else if (mode === COMPLETE_MODE) {
					mess = `-- COMPLETE: ${symbol} --`;
				}
				else if (visual_line_mode) mess = "-- VISUAL LINE --";
				else if (visual_mark_mode) mess = "-- VISUAL --";
				else if (visual_block_mode) mess = "-- VISUAL BLOCK --";
//				else if (mode === this.modes.file) mess = "-- FILE --";
				else if (mode === FILE_MODE) mess = "-- FILE --";
//				else if (mode === this.modes.cutBuffer) mess = `-- CUT BUFFER: ${actor.cur_cut_buffer+1}/${actor.num_cut_buffers} --`;
				else if (mode === CUT_BUFFER_MODE) mess = `-- CUT BUFFER: ${actor.cur_cut_buffer+1}/${actor.num_cut_buffers} --`;
//				else if (mode === this.modes.lineWrap) mess = "-- LINE WRAP --";
				else if (mode === LINE_WRAP_MODE) mess = "-- LINE WRAP --";
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
//			if (mode===this.modes.lineWrap){
			if (mode===LINE_WRAP_MODE){
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
		this.updateStatLines([usestr]);
		if (actor.multilineSels){
			let sels = actor.multilineSels;
			let stys = this.bgRowStyles;
			for (let i=0; i < donum; i++){
				stys[i].backgroundColor=sels[i+scry]?"#555":"";
			}
		}
	}//»

	if (this.minHeight && this.h < this.minHeight){
		tabdiv.innerHTML=`<center><span style="background-color:#f00;color:#fff;">Min height: ${this.minHeight}</span></center>`;
	}
	else {
		tabdiv.innerHTML = outarr.join("\n");
	}
}//»
resetXScroll(){//«
	this.tabdiv._x=0;
}//»
setXScroll(ln, usex){//«
	const{tabdiv}=this;
	tabdiv._x=0;
	if (!ln.length) return;
	let x_wid;
	if (ln.match(/[^\t]\t/)){//«
/*
There are embedded tabs here, so we have to do this the hard way
*/
		let cells=0;
		let chars=0;
		let tbsz = this.tabSize;
		for (let i=0; i < usex; i++){
			if (ln[i]=="\t"){
				cells++;
				if (chars===tbsz) cells++;
				chars=0;
			}
			else{
				if (chars===tbsz){
					cells++;
					chars=1;
				}
				else chars++;
			}
		}
		if (chars===tbsz) {
			cells++;
			chars=0;
		}
		x_wid = cells*this.tabWid + chars*this.cellWid;
	}//»
	else if(ln[0]==="\t") {//«
//A leading tab with no embedded tabs... a simple calculation
		let marr = ln.match(/^(\t+)/);
		if (marr){
			let n_tabs = marr[1].length;
			let rem_chars = usex - n_tabs;
			x_wid = n_tabs*this.tabWid + rem_chars*this.cellWid;
		}
	}//»
	else if (!ln.match(/\t/)){//«
//No tabs, just single width characters.
		x_wid = usex * this.cellWid;
	}//»
	if (!x_wid) return;
	let scrw = this.screenWid;
	let cellw = this.cellWid;
	let dx = scrw/2;
//log(dx, this.w);
	let diff = scrw - x_wid;
//log(dx, scrw);
	while(diff < cellw){
		tabdiv._x-=dx;
		diff += dx;
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
cerr("What is the array size different from the numStatLines????");
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
//Cursor/Curses«

getGrid(){//«

	const{tabdiv, wrapdiv}=this;
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
		tabdiv.innerHTML = str;
		if (tabdiv.scrollWidth > wrapdiv._w) {
			tabdiv.innerHTML = usech.repeat(str.length-1);
			wrapdiv._w = tabdiv.clientWidth;
			this.nCols = str.length - 1;
			break;
		}
		iter++;
		if (iter > 1000) {
log(wrapdiv);
			cwarn("INFINITE LOOP ALERT DOING WIDTH: " + tabdiv.scrollWidth + " > " + this.w);
			return 
		}
	}
//SDOIP
	this.cellWid = wrapdiv._w/this.nCols;
	this.tabWid = this.tabSize * this.cellWid;
	this.screenWid = wrapdiv._w;
//log(this.tabWid);
//log(this.cellWid);
	str = usech;
	iter = 0;
	while (true) {
		tabdiv.innerHTML = str;
		if (tabdiv.scrollHeight > wrapdiv._h) {
			let newarr = str.split("\n");
			newarr.pop();
			tabdiv.innerHTML = newarr.join("\n");
			wrapdiv._h = tabdiv.clientHeight;
			this.nRows = newarr.length;
			break;
		}
		str+="\n"+usech;
		iter++;
		if (iter > 1000) {
log(wrapdiv);
			return cwarn("INFINITE LOOP ALERT DOING HEIGHT: " + tabdiv.scrollHeight + " > " + this.h);
		}
	}
	tabdiv.innerHTML="";
	wrapdiv._over="hidden";
}
//»
clear(){//«
	this.lines = [];
	this.lineColors = [];
	this.y=0;
	this.scrollNum = 0;
	this.render();
}//»
lineBreak(){//«
	const{lines}=this;
	if (lines[lines.length-1] && !lines[lines.length-1].length) return;
	lines.push([]);
	this.y++;
	this.scrollIntoView();
	this.render();
}
//»
scrollIntoView(opts={}){//«
	if (!this.h) return;
	const{lines}=this;
	const doscroll=()=>{//«
		if (lines.length-this.scrollNum+this.numStatLines <= this.h) return false;
		else {
			if (this.y>=this.h) {
				this.scrollNum=lines.length-this.h+this.numStatLines;
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
	if (!opts.noSetY) this.y=lines.length - 1 - this.scrollNum;
	return did_scroll;
}//»
setBgRows(){//«
//SJRMSJR
	this.bgdiv.innerHTML = "<div> </div>".repeat(this.nRows);
	let arr = Array.from(this.bgdiv.children);
	let stys=[];
	for (let div of arr){
		stys.push(div.style);
	}
	this.bgRowStyles = stys;
}//»
resize(opts={}) {//«
	if (this.Win.killed) return;
	const{actor, tabdiv, wrapdiv, main}=this;
	let {isInit}=opts;
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
		this.isLocked = true;
		this.doOverlay(`Min\xa0width:\xa0${this.minTermWid}`);
		return;
	}
	if (!(this.nCols&&this.nRows)) {
		this.isLocked = true;
		return;
	}
	this.isLocked = false;
	let ins_str = null;
	if(!(actor || this.sleeping || this.curShell)){
		ins_str = this.getComArr().join("");
		if (ins_str){
//			this.popPromptLines();
			this.trimLines();
		}
		if (!isInit) this.lines.pop();
	}
//	if (!isInit) this.lines.pop();
	this.w = this.nCols;
	this.h = this.nRows;
//	if (!isInit) this.setPrompt();
	if (!isInit && ins_str !== null) this.setPrompt();
	if (ins_str){
		this.handleLineStr(ins_str);
	}
	if (!(oldw==this.w&&oldh==this.h)) this.doOverlay(this.w+"x"+this.h);
	this.lineHeight = wrapdiv.clientHeight/this.h;
	this.setBgRows();
	this.scrollIntoView();
	this.scrollMiddle();
	if (this.numStatLines) this.generateStatHtml();
	if (actor){
		if (actor.resize) actor.resize(this.w,this.h);
		return;
	}
	this.render();
}
//»
checkNegY(){//«
	if (this.y<0) {
		this.scrollNum+=this.y;
		this.y=0;
		this.render();
	}
}//»
charLeft(no_render){//«
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
			if (!no_render) this.render();
			return;
		}
		else return;
	}
	if (this.cy()==this.curPromptLine && this.x==this.promptLen) return;
	this.x--;
	if (!no_render) this.render();
}//»
charRight(no_render){//«

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
			if (!no_render) this.render();
		}
		else { 
			this.lines.push([]);
			this.x=0;
			this.y++;
			if (!this.scrollIntoView()) {
				if (!no_render) this.render();
			}
			return;
		}
	}//»
	else {
		if (this.x==thislinelen||!thisch) return;
		this.x++;
		if (!no_render) this.render();
	}
}//»
wordOver(is_left){//«
	const getch = () => {
		return this.lines[this.y+this.scrollNum][this.x];
	};
	const curpos = () => {
		return [this.x, this.y+this.scrollNum];
	};
	const samepos = (pos1, pos2) => {
		return pos1[0]===pos2[0] && pos1[1] === pos2[1];
	};
	is_left ? this.charLeft(true) : this.charRight(true);
	let pos1 = curpos();	
	let ch = getch();
	let have_space = !INT_ALNUM_RE.test(ch);
	if (have_space){
//Rewind to the end of a word
		while (true){
			is_left ? this.charLeft(true) : this.charRight(true);
			let ch = getch();
//			if (ch && ch.match(/^[a-zA-Z0-9]$/)) break;
			if (INT_ALNUM_RE.test(ch)) break;
			let pos2 = curpos();
			if (samepos(pos1, pos2)) break;
			pos1 = pos2;
		}
	}

	pos1 = curpos();	
	while (true){
		is_left ? this.charLeft(true) : this.charRight(true);
		let ch = getch();
//		if (ch==" "){
//		if (ch && !ch.match(/^[a-zA-Z0-9]$/)){
		if (ch && !INT_ALNUM_RE.test(ch)) {
			is_left ? this.charRight(true) : null;
			break;
		}
//		else if (is_left && ch && ch.match(/^[a-zA-Z0-9]$/)&& this.x === 0 && !this.lines[this.y+this.scrollNum]._contPrev){
		else if (is_left && ch && INT_ALNUM_RE.test(ch) && this.x === 0 && !this.lines[this.y+this.scrollNum]._contPrev){
			break;
		}
		else if (!is_left && !ch){
			break;
		}
		let pos2 = curpos();
		if (samepos(pos1, pos2)) break;
		pos1 = pos2;
	}
	this.render();
}//»
seekLineStart(){//«
//	this.setXStart();
	this.x=this.promptLen;
	this.y=this.curPromptLine - this.scrollNum;
	this.checkNegY();
	this.render();
}//»
seekLineEnd(){//«
	this.y=this.lines.length-this.scrollNum-1;
	if (this.y>=this.h){
		this.scrollNum+=this.y-this.h+1
		this.y=this.h-1;
	}
	if (this.lines[this.cy()].length == 1 && !this.lines[this.cy()][0]) this.x = 0;
	else this.x=this.lines[this.cy()].length;
	this.render();
}//»

adjustLinesAdd(charg, fromy){//«
/*This is for lines that are overflowing after splicing in a character.
charg is whatever is left over from the previous line
fromy is the line number where we start this process
*/
/*
THe trivial case is that there is no line at fromy
Here we need to check the line at fromy to see if it is a continuation.
If not, we simply insert a new line, and call this a continuation.
*/
	const{lines, w} = this;
	let ln = lines[fromy];
	let prevln = lines[fromy-1];
//cwarn(charg, fromy);
	if (!ln){
//The trivial case is that there is no line at fromy (we are at the end of the buffer)
//cwarn("Push a new line");
		ln = [charg];
		ln._contPrev = prevln;
		prevln._contNext = ln;
		lines.push(ln);
		return;
	}
	if (!ln._contPrev){
//This is *not* continued from the previous line, so insert one before this one
//This case depends on weird stuff like history completion of multiline commands
//cwarn("Create a new line and splice it in");
		ln = [charg];
		ln._contPrev = prevln;
		prevln._contNext = ln;
		lines.splice(fromy, 0, ln);
		return;
	}

//	while (ln._contPrev){
	while (true){
		ln.unshift(charg);
		if (ln.length <= w) break;
		charg = ln.pop();
//log("CH",charg);
		let prev = ln;
		ln = lines[++fromy];
		if (ln) {
			if (ln._contPrev) continue;
		}
		ln = [charg];
		ln._contPrev = prev;
		prev._contNext = ln;
		lines.splice(fromy, 0, ln);
//		lines.push(ln);
		break;
	}

}//»


//»
//History/Saving«

historyUp(){//«

	if (!(this.bufPos < this.history.length)) return;
	if (this.commandHold == null && this.bufPos == 0) {
		this.commandHold = this.getComArr().join("");
		this.commandPosHold = this.getComPos() + this.promptLen;
	}
	else if (this.bufPos){
//Always update the history to include any edits made (that weren't entered as commands)
		this.history[this.history.length - this.bufPos] = this.getComArr().join("");
	}
	this.bufPos++;
	let str = this.history[this.history.length - this.bufPos];
	if (!str) return;

//	this.popPromptLines();
	this.trimLines();
//.replace(/\n/g, "\t")
//	this.handleLineStr(str.trim());
	this.handleLineStr(str.trim().replace(/\t/g, "\n"));
	this.comScrollMode = true;
	this.checkNegY();
}//»
historyDown(){//«

	if (!(this.bufPos > 0)) return;

//Always update the history to include any edits made (that weren't entered as commands)
	this.history[this.history.length - this.bufPos] = this.getComArr().join("");

	this.bufPos--;
	if (this.commandHold==null) return;
	let pos = this.history.length - this.bufPos;
	if (this.bufPos == 0) {
		this.trimLines();
		this.handleLineStr(this.commandHold.replace(/\n$/,"").replace(/\t/g, "\n"),true);
		this.x = this.commandPosHold;
		this.commandHold = null;
		this.render();
	}
	else {
		let str = this.history[this.history.length - this.bufPos];
		if (str) {
			this.trimLines();
			this.handleLineStr(str.trim().replace(/\t/g, "\n"));
			this.comScrollMode = true;
		}
	}
	this.checkNegY();
}//»
historyUpMatching(){//«
	if (!(this.bufPos < this.history.length)) return;
	if (this.commandHold == null && this.bufPos == 0) {
		this.commandHold = this.getComArr().join("");
		this.commandPosHold = this.getComPos() + this.promptLen;
	}
	this.bufPos++;
	let re = new RegExp("^" + this.commandHold);
	for (let i = this.history.length - this.bufPos; this.bufPos <= this.history.length; this.bufPos++) {
		let str = this.history[this.history.length - this.bufPos];
		if (re.test(str)) {
			this.trimLines();
			this.handleLineStr(str.trim());
			this.comScrollMode = true;
			break;
		}
	}
}//»
historyDownMatching(){//«
	if (!(this.bufPos > 0 && this.commandHold)) return;
	this.bufPos--;
	let re = new RegExp("^" + this.commandHold);
	for (let i = this.history.length - this.bufPos; this.bufPos > 0; this.bufPos--) {
		let str = this.history[this.history.length - this.bufPos];
		if (re.test(str)) {
			this.trimLines();
			this.handleLineStr(str.trim());
			this.comScrollMode = true;
			return;
		}
	}
	if (this.commandHold) {
		this.trimLines();
		this.handleLineStr(this.commandHold.trim());
		this.comScrollMode = true;
		this.commandHold = null;
	}
}//»
async saveSpecialCommand(){//«
	let s = this.getComArr().join("");
	if (!s.match(/[a-z]/i)) {
log("Not saving", s);
		return;
	}
	if (await fsapi.writeFile(HISTORY_PATH_SPECIAL, `${s}\n`, {append: true})) return this.doOverlay(`Saved special: ${s}`);
	poperr(`Could not write to: ${HISTORY_PATH_SPECIAL}!`);
};
//»
async appendToHistory(str){//«
	if (!await fsapi.writeFile(HISTORY_PATH, `${str}\n`, {append: true})) {
cwarn(`Could not write to history: ${HISTORY_PATH}`);
	}
};
//»
addToHistoryBuffer(str){//«
	if (!str || str==this.history[this.history.length-1]){
		return false;
	}
	let ind = this.history.indexOf(str);
	if (ind >= 0) {
		this.history.splice(ind, 1);
	}
	this.history.push(str);
	return true;
}//»
async updateHistory(str){//«
	if (!this.addToHistoryBuffer(str)) return;
	if (str.length >= this.minHistStrLen){
		await this.appendToHistory(str);
	}
}//»
async initHistory(termBuffer){//«
	if (termBuffer) {
		this.history = termBuffer;
		return;
	}
	let arr = await this.getHistory();
	if (!arr) this.history = [];
	else {
		arr.pop();
		arr = arr.reverse();
		arr = util.uniq(arr);
		this.history = arr.reverse();
	}
}//»

/*
async saveHistory(){//«
	if (!await fsapi.writeFile(HISTORY_PATH, this.history.join("\n")+"\n")){
		poperr(`Problem writing command history to: ${HISTORY_PATH}`);
	}
};

//»
*/

//»
//Prompt/Command line«

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
	const{lines}=this;
	let com_arr = [];
	let j, line;
	for (let i = this.curPromptLine; i < lines.length; i++) {
		line = lines[i];
//if (!line){
//cwarn("??? NO LINE ???", i);
//break;
//}
		if (i==this.curPromptLine) j=this.promptLen;
		else j=0;
		let len = line.length;
		for (; j < len; j++) com_arr.push(line[j]);
		if (len < this.w && i < lines.length-1) com_arr.push("\n");
	}
	return com_arr;
}
//»
async getCommandArr (dir, arr, pattern){//«
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
//	return str + " ";
	str = str + " ";
	if (str.length+1 >= this.w) {
		let len_half = Math.floor((this.w - 5)/2);
		let half_1 = str.slice(0, len_half);
		let half_2 = str.slice(str.length - len_half);
		str = `${half_1}...${half_2}`;
	}
	return str;
}
//»
setPrompt() {//«
	let prompt_str = this.getPromptStr();
	this.Win.title=prompt_str.replace(/..$/,"");
	let len_min1;
	let lnarr = prompt_str.split("");
	if (!this.lines.length) {
		this.lines = [lnarr];
		len_min1 = this.lines.length-1;
		this.curPromptLine = 0;
	}
	else {
		len_min1 = this.lines.length-1;
		if (!this.lines[len_min1][0]) this.lines[len_min1] = lnarr;
		else {
			this.lines.push(lnarr);
			len_min1++;
		}
		this.curPromptLine = len_min1;
		this.scrollIntoView();
	}
	this.promptLen = this.lines[len_min1].length;
	if (this.promptLen==1 && this.lines[len_min1][0]==="") this.promptLen=0;
	this.x=this.promptLen;
	this.y=this.lines.length - 1 - this.scrollNum;
}//»

trimLines() {//«
	let cpl_plus1 = this.curPromptLine+1;
//cwarn(`${this.lines.length} > ${cpl_plus1} ???`);
	while (this.lines.length > cpl_plus1) {
		this.lines.pop();
	}
}//»

insertCutStr(){//«
	for (let i=0; i < this.currentCutStr.length; i++) this.handleLetterPress(this.currentCutStr[i]);
}//»
doClearLine(){//«

	const{lines}=this;
	if (this.curShell) return;
	let str="";
	for (let i = lines.length; i > this.y+this.scrollNum+1; i--) str = lines.pop().join("") + str;
	let ln = lines[this.y+this.scrollNum];
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


//»
//Tab completion«

async quoteCompletion(use_dir, tok0, arr, arr_pos){//«
//At the end of a string with exactly one non-backtick quote character...
//Just a quick and dirty way to do tab completion with quotes

	let contents;
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
	let use_str= s.replace(/([\[(+*?])/g,"\\$1");
	let ret = await this.getDirContents(use_dir, use_str,{if_cd: tok0==="cd", if_keep_ast: true});
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
		this.doContents(contents, use_dir, "", arr_pos);
		return;
	}
	let all=[];
	for (let ar of ret) all.push(ar[0]);
	let rem = util.sharedStart(all).slice(s.length);
	for (let ch of rem) this.handleLetterPress(ch);
	this.awaitNextTab = true;

}//»
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
async doGetDirContents(use_dir, tok, tok0, arr_pos)  {//«
	let ret = await this.getDirContents(use_dir, tok, {if_cd: tok0==="cd"});
	if (!ret.length) return;
	this.doContents(ret, use_dir, tok, arr_pos);
}//»
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
			this.responseComNames(names_sorted);
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
async doCompletion(){//«

	let contents;
	let use_dir = this.cur_dir;
	let arr_pos = this.getComPos();
	let arr = this.getComArr();

	let new_arr = arr.slice(0, arr_pos);
	let com_str = new_arr.join("");
	new_arr = com_str.split(/ +/);
	if (!new_arr[0] && new_arr[1]) new_arr.shift();
	let tokpos = new_arr.length;
	if (tokpos > 1) {
		if (new_arr[new_arr.length-2].match(/[\x60\(&|;] *$/)) tokpos = 1;
	}
	let tok0 = new_arr[0];
	if ((com_str.match(/[\x22\x27]/g)||[]).length===1){
		this.quoteCompletion(use_dir, tok0, arr, arr_pos);
		return;
	}
	let tok = new_arr.pop();
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
	if (!(!got_path && (tokpos==1||(tokpos>1 && this.comCompleters.includes(tok0))))) {
		return this.doGetDirContents(use_dir, tok, tok0, arr_pos);
	}
	if (tokpos==1) {
		contents = await this.getCommandArr(use_dir, Object.keys(this.ShellMod.activeCommands), tok)
	}
	else {
		if (tok0 == "help"){
			contents = await this.getCommandArr(use_dir, Object.keys(this.ShellMod.activeCommands), tok)
		}
		else if (tok0 == "lib" || tok0 == "import"){
			contents = await this.getCommandArr(use_dir, await util.getList("/site/coms/"), tok)
		}
		else if (tok0 == "app" || tok0 == "appicon"){
			contents = await this.getCommandArr(use_dir, await util.getList("/site/apps/"), tok)
		}

	}
	if (contents && contents.length) this.doContents(contents, use_dir, tok, arr_pos);
	else this.doGetDirContents(use_dir, tok, tok0, arr_pos);
}//»

//»
//Response/Format«

fmtLs(arr, lens, ret, types, color_ret, col_arg){//«

/*_TODO_: In Linux, the ls command lists out (alphabetically sorted) by columns, but 
here we are doing a row-wise listing! Doing this in a column-wise fashion (cleanly and 
efficiently) is an outstanding issue...*/
	const{w}=this;
//	const{dirType, linkType, badLinkType, idbDataType}=ShellMod.var;
	let pad = this.lsPadding;
//	if (!start_from) start_from=0;
	if (col_arg == 1) {//«
		for (let i=0; i < arr.length; i++) {
			if (w >= arr[i].length) ret.push(arr[i]);
			else {
				let iter = 0;
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
		if (typ==DIR_TYPE) color="#909fff";
		else if (typ==LINK_TYPE) color="#0cc";
		else if (typ==BAD_LINK_TYPE) color="#f00";
		else if (typ==IDB_DATA_TYPE) color="#cc0";
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
//This does soft-wrapping (introduces line breaks at spaces before 'w' chars)
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
//This does hard-wrapping (introduces line breaks exactly at 'w' chars)
	const{w}=this;
	if (str === this.EOF) return [];
	let use_max_len = this.getMaxLen();
	if (str instanceof Blob) str = "[Blob " + str.type + " ("+str.size+")]"
	else if (str.length > use_max_len) str = str.slice(0, use_max_len)+"...";
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

async respInit(addMessage){//«

	let init_prompt = `LOTW shell`;
	if (!Desk.isFake) init_prompt +=`\x20(${this.winid.replace("_","#")})`
	if (admin_mode){
		init_prompt+=`\nAdmin mode: true`;
	}
	if (addMessage) init_prompt = `${addMessage}\n${init_prompt}`;
	let env_file_path = `${this.cur_dir}/.env`; 
	let env_lines = await env_file_path.toLines();
	if (env_lines) {
		let rv = this.ShellMod.util.addToEnv(env_lines, this.env, {if_export: true});
//		let rv = add_to_env(env_lines, this.env, {if_export: true});
		if (rv.length){
			init_prompt+=`\n${env_file_path}:\n`+rv.join("\n");
		}
	}

if (dev_mode){
	let rv = await this.ShellMod.util.doImports(ADD_COMS, cwarn);
//	let rv = await do_imports(ADD_COMS, cwarn);
if (rv) init_prompt += "\nImported libs: "+rv;
}
	this.response(init_prompt);

}//»
responseComNames(arr) {//«
	let arr_pos = this.getComPos();
	let repeat_arr = this.getComArr();
	let name_lens = [];
	for (let nm of arr) name_lens.push(nm.length);
	let command_return = [];
	this.fmtLs(arr, name_lens, command_return);
	this.response(command_return.join("\n"), {didFmt: true});
	this.responseEnd();
	for (let i=0; i < repeat_arr.length; i++) this.handleLetterPress(repeat_arr[i]);
	let xoff = repeat_arr.length - arr_pos;
	for (let i=0; i < xoff; i++) this.handleArrow(LEFT_KEYCODE,"");
	this.render();
}
//»
responseEnd(opts={})  {//«
	if (!this.didInit) return;

//Why does (did) this line exist???
//	if (this.isPager) return;

//	this.#doContinue = false;

	this.setPrompt();
	this.scrollIntoView();
	this.sleeping = null;
	this.bufPos = 0;
	this.curShell = null;
	this.render();

}
//»
response(out, opts={}){//«
	if (isEOF(out)) return;

/*
The response mechanism is *ONLY* meant for the terminal's REPL mode. If there
is an 'actor' in a pipeline, and a previous command in the pipeline has some
non-output-stream message (like an error message), then it always gets sent
here, so we need to make sure we are putting the message into the appropriate
lines array (otherwise, the message gets printed onto the actor's screen.
*/

	const{termLines: lines, termLineColors: line_colors}=this;
	let readline_lines;
	if (Number.isFinite(this.readLineStartLine)) {
		readline_lines = [];
		while (lines.length > this.readLineStartLine) readline_lines.unshift(lines.pop());
	}

	if (!isStr(out)) {
//cwarn("Here is the non-string object");
//This is not a bug since it is perfectly "okay" (I think) to pass aribtrary objects
//*through* a pipeline... but not out the end of it.
if (out.toString instanceof Function){
	out = out.toString();
}
else {
log(out);
		let str = `non-String object found in output stream (see console)`;
		if (opts.name) str = `${opts.name}: ${str}`;
		out = `sh: ${str}`;
		opts = {isWrn: true};
}
	}

	let {didFmt, colors, pretty, isErr, isSuc, isWrn, isInf, noBr} = opts;
//log();
	if (out == "" && out.isNL){
		out=" \n ";
	}
	else if (!out.noChomp && out.match(/\n$/)){
cwarn("Chomping ending NEWLINE!!!");
		out = out.replace(/\n$/,"");
	}
	out = out.split("\n");
/*«
	else if (!out) return;
	else if (!isArr(out)){
log("STDOUT");
log(out);
return;
	}
	else if (out instanceof Uint8Array) out = [`Uint8Array(${out.length})`];
»*/
//WOPIUTHSDKL
	let use_color;
	if (isErr) use_color = "#f99";
	else if (isSuc) use_color = "#7f7";
	else if (isWrn) use_color = "#ff7";
	else if (isInf) use_color = "#bbf";

	if (colors) {
//The two fatal results are major bugs, and should be treated "calamitously"
		if (!didFmt){
			let e = new Error(`A colors array was provided, but the output lines have not been formatted!`);
			this.Win._fatal(e);
			throw e;
		}
		if (colors.length !== out.length){
log("response lines",out);
log("response colors",colors);
			let e = new Error(`The output array and colors array are not equal length!`);
			this.Win._fatal(e);
			throw e;
		}

	}
	else colors = [];

	if (lines.length && (noBr || !lines[lines.length-1].length)) {
		let gotln = lines.pop();
	}
	let len = out.length;
	let curnum = lines.length;
	for (let i=0; i < len; i++){
		let ln = out[i];
		let col = colors[i];
		if (didFmt){
			lines[curnum] = ln.split("");
			line_colors[curnum] = col;
			curnum++;
			continue;
		}
		let arr;
		if (pretty) arr = this.fmt2(ln);
		else arr = this.fmt(ln);
		for (let l of arr){
			lines[curnum] = l.split("");
			if (use_color) line_colors[curnum] = {0: [l.length, use_color]};
			else line_colors[curnum] = col;
			curnum++;
		}
	}
	if (readline_lines){
		lines.push(...readline_lines);
		this.readLineStartLine = curnum;//QCKLURYH
		this.scrollIntoView();
	}
}
//»

//»

//Key handlers«

termAlwaysEats(sym, e){//«
	if (sym == "=_C") {
		e.preventDefault();
		this.setNewFs(this.grFs+1);
		return true;
	}
	else if (sym == "-_C") {
		e.preventDefault();
		if (this.grFs-1 <= this.minFs) return true;
		this.setNewFs(this.grFs-1);
		return true;
	}
	else if (sym=="0_C") {
		this.grFs = this.defFs;
		this.setNewFs(this.grFs);
		return true;
	}
	else if (sym=="c_CS") {
		this.doClipboardCopy();
		return true; 
	}
	else if (sym=="v_CS") {
		this.doClipboardPaste();
		return true;
	}
	else if (sym=="a_CA") {
		 this.doCopyBuffer();
		return true;
	}
	else if (sym=="p_CA"){
		this.paragraphSelectMode = !this.paragraphSelectMode;
		this.doOverlay(`Paragraph select: ${this.paragraphSelectMode}`);
		return true;
	}
	return false;
}//»

doCtrlD(){//«
this.numCtrlD++;
this.doOverlay(`Ctrl+d: ${this.numCtrlD}`);
//cwarn("Calling do_ctrl_D!!! (nothing doing)");
};//»
doCtrlC(){//«
	if (this.curShell) {
		this.env['?'] = 0;
		if (this.curShell.stdin) {
			this.curShell.stdin(null, true);
			delete this.curShell.stdin;
		}
	}
	else {
		this.handleKey(null,"^".charCodeAt(), null, true);
		this.handleKey(null,"C".charCodeAt(), null, true);
		this.rootState = null;
		this.bufPos = 0;
		this.commandHold = null;
		this.env['?'] = 0;
		this.responseEnd();
	}
}
//»
handleLetterPress(char_arg, no_render){//«
	const{lines, w} = this;
	const end=()=>{
		if (no_render) return;
		this.render();
	};
	let {x} = this;
	let y = this.cy();

	const ln = lines[y];
//DYWUEORK
	if (this.passwordMode){
		char_arg = new String(char_arg);
		let then = window.performance.now();
		char_arg.toString=()=>{
			if (window.performance.now() - then < 100) return char_arg;
			return "*";
		};
	}
	if (!ln[x]) ln[x] = char_arg;
	else ln.splice(x, 0, char_arg);
	x+=1;
	this.x = x;
	let endch;
	let fromy;
	if (x === w){
		endch = ln[x];
		if (endch) ln.pop();
		this.x = 0;
		if (this.y===this.h-1){
			this.scrollNum++;
		}
		else{
			this.y++;
		}
		fromy = this.y + this.scrollNum;
//		this.scrollIntoView({noSetY: true});
	}
	else if (ln.length <= w){
		return end();
	}
	else{
		endch = ln.pop();
	//The cursor is before the end and the line is too long
		fromy = this.y+1 + this.scrollNum;
	}

	if (!endch){
//This always means that we are at the *VERY END* of the terminal buffer, so the
//new line always gets trivially pushed onto the end
		let newln = [];
		ln._contNext = newln;
		newln._contPrev = ln;
//		lines.push(newln);
		lines.splice(fromy, 0, newln);
		return end();
	}
	this.adjustLinesAdd(endch, fromy);
	end();
}//»
handleInsert(val){//«
	let num_skipped = 0;
	let lines = val.split("\n");
	for (let i=0; i < lines.length; i++){
		let ln = lines[i];
		let arr = ln.split("");
		for (let ch of arr) {
			if (!INT_ALNUM_PRINT_RE.test(ch)){
				num_skipped++;
				ch = " ";
			}
			this.handleKey(null, ch.charCodeAt(), null, true);
		}
		if (i < lines.length - 1){
			this.lines.push([]);
			this.x=0;
			this.y++;
		}
	}
	if (num_skipped) this.doOverlay(`Skipped: ${num_skipped} chars`);
	this.scrollIntoView();
	this.render();
}//»
handleLineStr(str, if_no_render){//«
//handleLineStr(str, from_scroll, uselen, if_no_render){
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
	let cpl = this.curPromptLine;
//	let curnum = this.curPromptLine;
	let curnum = cpl;
	let curx = this.promptLen;
	this.linesHold2 = this.lines;
	if (!this.comScrollMode) {
//		this.lines = copy_lines(this.lines, this.curPromptLine)
		this.lines = copy_lines(this.lines, cpl)
		if (did_fail) {
			this.clear();
			return 
		}
	}
	this.lines[this.lines.length-1] = this.lines[this.lines.length-1].slice(0, this.promptLen);
	let curpos = this.promptLen;
	let arr = str.split("\n");
	let addlines = 0;
//log(arr);
	for (let lnstr of arr) {
		let i;
		let lastln;
		if (!lnstr) {
//			if (curnum !== this.curPromptLine) {
			if (curnum !== cpl) {
				this.lines[curnum] = [];
				lastln = null;
			}
			curnum++;
			continue;
		}
//PAKJSHFK
		for (i=curnum;lnstr.length>0;i++) {
			let curln = this.lines[i];
			if (!curln) curln = [];
			let strbeg = lnstr.slice(0,this.w-curpos);
			curx = curpos + strbeg.length;
			curln.push(...strbeg);
			this.lines[i] = curln;
			lnstr = lnstr.slice(this.w-curpos);
			if (lastln){
				lastln._contNext = curln;
				curln._contPrev = lastln;
			}
			if (lnstr.length > 0) {
				curnum++;
				curx = 0;
				lastln = curln;
			}
			else{
				lastln = null;
			}
			curpos = 0;
			addlines++;
		}
		curnum++;
	}
	this.y = this.lines.length-1-this.scrollNum;
//	this.scrollIntoView();
	this.x = curx;
	if (this.x==this.w) {
		this.y++;
		if (!this.lines[this.y+this.scrollNum]) {
			this.lines.push([]);
		}
		this.x=0;
	}
	this.scrollIntoView();

//If the prompt is offscreen, scroll forward as much as possible in order to show as much
//of the command as possible. For commands that take up too many lines, the prompt will
//always be offscreen, since we are keeping the cursor on the last line of the command.
	if (cpl - this.scrollNum < 0){
		let h_min_1 = this.h-1;
		let y = this.y;
		let scr_num = this.scrollNum;
		while (y < h_min_1 && scr_num > 0) {
			y++;
			scr_num--;
			if (scr_num === cpl) break;
		}
		this.y = y;
		this.scrollNum = scr_num;
	}

	if (!if_no_render) this.render();
}//»
handleTab(){//«
	if (this.curShell) return;
	this.doCompletion();
}//»
handleArrow(code, mod, sym){//«
//SBSORJJS
	if (this.curShell && !this.readLineCb) {
//	if (this.curShell) {
		return;
	}
	if (mod == "") {//«
		if (code == UP_KC) this.historyUp();
		else if (code == DOWN_KC) this.historyDown();
		else if (code == LEFT_KEYCODE) this.charLeft();
		else if (code == RIGHT_KC) this.charRight();
	}//»
	else if (mod=="C") {//«
		if (kc(code,"UP")) this.historyUpMatching();
		else if (kc(code,"DOWN")) this.historyDownMatching();
		else if (kc(code,"LEFT")) {
			this.wordOver(true);
		}
		else if (kc(code,"RIGHT")) {
			this.wordOver(false);
		}
	}//»
}//»
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
				this.trimLines();
				this.handleLineStr(str.trim());
			}
		}
	}//»
	else if (sym=="END_") {//«
		if (this.curShell) return;
		if (this.bufPos > 0) {
			this.bufPos = 0;
			if (this.commandHold!=null) {
				this.trimLines();
				this.handleLineStr(this.commandHold.trim());
				this.commandHold = null;
			}
		}
	}//»
}
//»
handleBackspace(){//MSKEUTJDK«
const{w}=this;
/*
If we are at 0 and backing onto a line that is less than the width, then we need to 
try to fill that line with the extra characters that are on the current line.
*/

//Return if we've hit the prompt
	if (((this.y+this.scrollNum) ==  this.curPromptLine) && (this.x == this.promptLen)) return;

//At the top of the screen, and we're not scrolling back with a backspace
//	if (this.x==0 && this.y==0) {
//		return;
//	}
//Not quite sure what this means. We are apparently on the curPromptLine, with a prompt of 0 length
	if (this.x==0 && (this.cy()-1) < this.curPromptLine) return;

	let is_zero;

	if (this.x > 0){//«
//Simple rubout on the same line.
		this.x--;
		this.lines[this.cy()].splice(this.x, 1);
	}//»
//Everything below backs onto the previous line...
	else if (!this.lines[this.cy()][0]){//«
//Just a very simple matter of deleting a newline
		if (this.lines[this.cy()-1].length == w) this.lines[this.cy()-1].pop();
//cwarn("DEL NEWLINE");
		if (this.lines[this.cy()-1]._contNext) delete this.lines[this.cy()-1]._contNext;
		this.lines.splice(this.cy(), 1);
		this.y--;
		this.x = this.lines[this.cy()].length;
		this.render();
		return;
	}//»
	else if (!this.lines[this.cy()-1].length){
		this.lines.splice(this.cy()-1, 1);
		this.y--;
		if (this.y == -1) {
			this.y = 0;
			this.scrollNum--;
		}
		this.render();
		return;
	}
	else {//«
//JEPOIKLMJYH
//Backing onto the prev line, which means we are
		let thisln = this.lines[this.cy()];
		let prevln = this.lines[this.cy()-1];
		let donum = this.w - prevln.length;
		is_zero = true;
		let gotchs;
		if (donum){
			gotchs = thisln.splice(0, donum);
		}
		else{
			gotchs = thisln.splice(0, donum+1);
			prevln.pop();
		}
		prevln.push(...gotchs);
		if (!thisln.length){
			this.lines.splice(this.cy(), 1);
		}
		else{
			thisln._contPrev = prevln;
			prevln._contNext = thisln;
		}
		this.y--;
		this.x = prevln.length - (gotchs.length);
	}//»
	if (this.y == -1) {
		this.y = 0;
		this.scrollNum--;
	}

	this.adjustLinesDel(is_zero ? 1: 0);
	this.render();
	return;


//	let usey = is_zero ? 2 : 1;
//	let usey = is_zero ? 1: 0;
//GFUIABRM

	if (this.lines[this.cy()+usey]) {//«
		if (this.lines[this.cy()].length == this.w-1) {
			let char_arg = this.lines[this.cy()+usey][0];
			if (char_arg) this.lines[this.cy()].push(char_arg);
			else this.lines.splice(this.cy()+usey, 1);
			if(this.lines[this.cy()+usey]) {//«
				this.lines[this.cy()+usey].splice(0, 1);
				let line;
				for (let i=usey+1; line = this.lines[this.cy()+i]; i++) {
//log(line);
					let char_arg = line[0];
					if (char_arg) {
						line.splice(0,1);
						this.lines[this.cy()+i-1].push(char_arg);
						if (!line.length) this.lines.splice(i+1, 1);
					}
				}
			}//»
		}
		else{
			if (!this.lines[this.cy()+usey-1].length){
				this.lines.splice(this.cy()+usey-1, 1);
			}
		}
	}//»
	this.render();

}//»
adjustLinesDel(adj){//«
	const {lines}=this;
	let{x, w}=this;
	let y = this.cy()+adj;
	let ln = lines[y]
///*
	if (!ln){
		lines.push([]);
//cwarn("NO LINE HERE", y);
		return;
	}
//	if (ln._contNext && !ln._contNext.length){
//		delete ln._contNext;
//		return;
//	}
//	if (ln && !ln.length){
//		return;
//	}
	while(ln && ln.length < w && ln._contNext){
		let diff = w - ln.length;
		let chars = ln._contNext.splice(0, diff);
		ln.push(...chars);
		if (!ln._contNext.length){
//log(ln._contNext);
//log("????");
			delete ln._contNext;
			lines.splice(y+1, 1);
			break;
		}
		ln = ln._contNext;
		y++;
//		didone = true;
	}
}//»
handleDelete(mod){//«
	if (mod == "") {
		if (this.lines[this.cy()+1]) {
			this.handleArrow(KC.RIGHT, "");
			this.handleBackspace();
		}
		else {
			this.lines[this.cy()].splice(this.x, 1);
			this.render();
		}
	}
}//»
async handleEnter(opts={}){//«
	if (this.sleeping) return;
	this.bufPos = 0;
	this.commandHold = null;
	if (this.curShell) return;
	let str = this.getComArr().join("");
	if (str.match(/^ *$/)) {
		this.responseEnd();
		return;
	}
	this.x=0;

//VSHEUROJ
//	this.y++;
//	this.lines.push([]);
//	this.scrollIntoView();
	this.forceNewline();

	this.render();
	await this.execute(str, opts);
	this.sleeping = null;
}//»
handleReadlineEnter(){//«
	let is_pass = this.passwordMode;
	this.passwordMode = false;
	if (this.actor){
//HWURJIJE
		this.readLineCb(this.readLineStr);
		this.readLineCb = null;
		this.readLineStartLine = null;
		return;
	}
	const{lines}=this;
	let rv = [];
//This '1' ONLY correct when the line does not wrap
	let from = this.readLineStartLine;
	let a;
	for (let i=from; i < lines.length; i++) {
		let a = i===from ? lines[i].slice(this.promptLen) : lines[i];
		for (let c of a){rv.push(c.valueOf());}//WZZKUDJK
	}
	rv = rv.join("");
	if (!rv && !is_pass){
		rv = new String("");
		rv.isNL = true;
	}
	this.readLineCb(rv);
	this.readLineCb = null;
	this.readLineStartLine = null;
	this.sleeping = true;
	this.forceNewline();
//log(this.curPromptLine);
}//»
handleKey(sym, code, mod, ispress, e){//«
	const{lines}=this;
	if (this.sleeping) {
		if (ispress || sym=="BACK_") return;
	}
	if (this.curShell){//«

		if (sym==="c_C") {//«
			this.curShell.cancel();
			this.curShell = null;
			this.sleeping = false;
			this.response("^C");
			this.responseEnd();
			return;
		}//»
		else if (this.getChCb){//«
			if (ispress) {
				this.sleeping = true;
				this.getChCb(e.key);
				this.getChCb = null;
			}
			else {
				if (sym=="ENTER_"){
					this.sleeping = true;
					this.getChCb(this.getChDefCh);
					this.getChDefCh = undefined;
				}
				return;
			}
		}//»
		else if (this.readLineCb){//«
//this.okReadlineSyms = ["DEL_","BACK_","LEFT_", "RIGHT_"];
			if (ispress || this.okReadlineSyms.includes(sym)){
				if (this.actor){
//VEOMRUI
					if (ispress) {
						this.readLineStr+=String.fromCharCode(code);
						if (this.readLineStr.length === this.w){
							this.readLineCb(this.readLineStr);
							this.readLineStr="";
						}
					}
					return;
				}
//				if ((sym==="LEFT_" || sym=="BACK_") && this.x==this.#readLinePromptLen && this.y+this.scrollNum == this.curPromptLine+1) return;
//				if ((sym==="LEFT_" || sym=="BACK_") && this.x==this.#readLinePromptLen && this.y+this.scrollNum == this.readLineStartLine) {
				if ((sym==="LEFT_" || sym=="BACK_") && this.x==this.promptLen && this.y+this.scrollNum == this.readLineStartLine) {
					return;
				}
//LOUORPR
//else: let the 'ispress' characters/okReadlineSyms (DEL_, BACK_, LEFT_, RIGHT_) pass through...
			}
			else if (sym==="ENTER_"){
				this.handleReadlineEnter();
				return;
			}
			else{
				return;
			}
		}//»
		else return;

	}//»

//log("IS THIS EVER TRUE???", !this.lines[this.cy()]);
//Try uncommenting the above line to see if the stuff below would ever get executed....
/*I'm not sure what all this was originally for...
	if (!this.lines[this.cy()]) {//«
		if (code == 75 && alt) return;
		else {
			if (this.cy() > 1 && !this.lines[this.cy()-1]) this.setPrompt();
			else {
				this.lines[this.cy()] = [null];
			}
		}
	}//»
*/

	if (ispress) {//«
		this.numCtrlD = 0;
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
	if (code >= 37 && code <= 40) {
		this.handleArrow(code, mod, sym);
		return;
	}
//	if (code == KC['DEL']) {
	if (code == DEL_KC) {
		this.handleDelete(mod);
		return;
	}
	switch(sym) {
		case "HOME_":
		case "END_":
			this.handlePage(sym)
			break;
		case "p_CAS":
			this.togglePaste();
			break;
		case "TAB_": 
			this.handleTab();
			break;
		case "BACK_":  
			this.handleBackspace();
			break;
		case "ENTER_": 
			this.handleEnter();
			break;
		case "c_C": 
			this.doCtrlC();
			break;
		case "k_C": 
			this.doClearLine();
			break;
		case "y_C": 
			this.insertCutStr();
			break;
/*
		case "c_CAS": 
			this.clear();
			this.responseEnd();
			break;	
*/
		case "a_C": 
			e.preventDefault();
			this.seekLineStart();
			break;
		case "e_C": 
			this.seekLineEnd();
			break;
		case "g_CAS":
			this.saveSpecialCommand();
			break;
		case "h_CAS":
			this.selectFromHistory(HISTORY_PATH);
			break;	
		case "s_CAS":
			this.selectFromHistory(HISTORY_PATH_SPECIAL);
			break;
		case "r_CAS": {//«
			if (!dev_mode){
cwarn("Not dev_mode");
				return;
			}
			//VMUIRPOIUYT
			if (this.onreload) delete this.onreload;
			else this.onreload = this._onreload;
			this.doOverlay(`Reload terminal: ${!this.onreload}`);
			break;
		}//»
	}
/*«
	else if (sym == "HOME_"|| sym == "END_") this.handlePage(sym);
	else if (sym == "p_CAS") this.togglePaste();
	else if (sym == "TAB_") this.handleTab();
	else if (sym == "BACK_")  this.handleBackspace();
	else if (sym == "ENTER_") this.handleEnter();
	else if (sym == "c_C") this.doCtrlC();
	else if (sym == "k_C") this.doClearLine();
	else if (sym == "y_C") this.insertCutStr();
	else if (sym == "c_CAS") {
		this.clear();
		this.responseEnd();
	}
	else if (sym=="a_C") {//«
		e.preventDefault();
		this.seekLineStart();
	}//»
	else if (sym=="e_C") this.seekLineEnd();
	else if (sym == "g_CAS") this.saveSpecialCommand();
	else if (sym=="h_CAS") this.selectFromHistory(HISTORY_PATH);
	
	else if (sym=="s_CAS"){
		this.selectFromHistory(HISTORY_PATH_SPECIAL);
	}
»*/
///*
//else if (sym=="d_CAS"){
//}
//*/
}

//»

onkeydown(e,sym,mod){//«
//onkeydown(e,sym,mod){this.oldHandleKey(e, sym, false,e.keyCode,mod);}
	if (this.isLocked) {
		return;
	}
	if (this.isScrolling){//«
		if (sym.match(/^[A-Z]+_$/)){//This means it is something like UP_ or DOWN_
			if (sym==="SPACE_") return;
		}
		else return;
		this.scrollNum = this.scrollNumHold;
		this.isScrolling = false;
		this.render();
		return;
	}//»
	if (e && sym=="d_C") e.preventDefault();
	if (this.termAlwaysEats(sym, e)) return;
	let code = e.keyCode;
//	if (code == KC['TAB'] && e) e.preventDefault();
	if (code === TAB_KC && e) e.preventDefault();
	else this.awaitNextTab = null;

	if (e&&sym=="o_C") e.preventDefault();
	if (this.readLineCb){
		if (sym=="c_C"){
//RMLDURHTJ
			this.readLineCb(EOF);
			this.readLineCb = null;
			this.readLineStartLine = null;
			this.doOverlay("Readline: cancelled");
			this.curShell.cancel();
			return;
		}
		this.handleKey(sym, code, mod, false, e);
		return;
	}

//CLKIRYUT
	const{actor}=this;
	if (actor){
		if (actor.onkeydown) actor.onkeydown(e ,sym, code);
		return;
	}
	if (!sym) return;
	this.handleKey(sym, code, mod, false, e);
}//»
onkeypress(e){//«
//onkeypress(e){this.oldHandleKey(e, e.key, true,    e.charCode,"");}
//onkeypress(e, sym, mod){
//	let sym = e.key;
	if (this.isLocked) {
		return;
	}
	if (this.isScrolling){//«
		this.scrollNum = this.scrollNumHold;
		this.isScrolling = false;
		this.render();
		return;
	}//»
/*
Should we look for a readLineCb here and send it into handleKey before the actor grabs it?
But then we need to check that we are putting it into the terminal's lines array,
rather than the lines array of the current actor.
*/
	if (this.readLineCb){
		this.handleKey(e.key, e.keyCode, "", true, e);
		return;
	}
	const{actor}=this;
	if (actor){
//		if (actor.onkeypress) actor.onkeypress(e, sym, code);
		if (actor.onkeypress) actor.onkeypress(e, e.key, e.keyCode);
		return;
	}
//handleKey(sym, code, mod, ispress, e){
//	this.handleKey(sym, code, mod, true, e);
	this.handleKey(e.key, e.keyCode, "", true, e);
}//»
onkeyup(e,sym){//«
	if (this.actor&&this.actor.onkeyup) this.actor.onkeyup(e, sym);
}//»

//»

//System callbacks«

async _reloadShell(){//«
//globals.ShellMod = new 

delete LOTW.mods["lang.shell"];
delete globals.ShellMod;

delete globals.shell_commands;
delete globals.shell_command_options;

delete this.ShellMod;
delete this.Shell;
this.doOverlay("Reload ShellMod...");
await this.loadShell();
this.doOverlay("Okay!");
//URKSPLK
//Uncomment this to reload the terminal also!
if (RELOAD_TERM_ONRELOAD) await this.Win.reload({appOnly: true});
//log(this.Win);

}//»
async _reloadLibs(arr){//«
	for (let mod of arr){
		if (!this.ShellMod.allLibs[mod]) continue;
		this.doOverlay(`Delete: ${mod}`);
		await this.ShellMod.util.deleteMods([mod]);
		await this.ShellMod.util.doImports([mod], cerr);
	}
}//»
async _onreload(){//«

//Just reload the shell (if working on a devtest command)
//	await this._reloadShell();

//	await this._reloadLibs(["games.poker"]);
	await this._reloadLibs(RELOAD_LIBS);

}//»

onkill(if_dev_reload){//«
	if (this.curEditNode) this.curEditNode.unlockFile();
	if (!if_dev_reload) {
		return;
	}

	this.reInit={
		termBuffer: this.history,
//		useOnDevReload: !!this.ondevreload
	};

	if (this.actor) {
		this.reInit.commandStr = this.actor.command_str;
	}
//log(DEL_MODS);
	this.ShellMod.util.deleteMods(DEL_MODS);
	this.ShellMod.util.deleteComs(DEL_COMS);

//	delete globals.shell_commands;
//	delete globals.shell_command_options;
}
//»

async onappinit(appargs={}){//«

	await this.loadShell();
	let {reInit} = appargs;
	if (!reInit) {
		reInit = {};
	}
//	if (!NO_ONRELOAD) this.onreload = this._onreload;
	if (USE_ONRELOAD) this.onreload = this._onreload;
//	let {termBuffer, addMessage, commandStr, histories, useOnDevReload} = reInit;
	let {termBuffer, addMessage, commandStr, histories} = reInit;
	await this.initHistory(termBuffer);
	await this.respInit(addMessage);
	this.didInit = true;
	this.sleeping = false;
	this.isFocused = true;
	this.setPrompt();
	this.render();
//	this.onfocus();
	if (commandStr) {
		for (let c of commandStr) this.handleLetterPress(c); 
		this.handleEnter({noSave: true});
	};
}//»

onescape(){//«
	this.textarea.focus();
	if (this.checkScrolling()) return true;
	if (this.statusBar.innerText){
		this.statusBar.innerText = "";
		return true;
	}
	return false;
}//»
onsave(){//«
	const{actor}=this;
//	if (editor) editor.save();
	if (actor && actor.save) actor.save();
}
//»

onfocus(){//«
	this.isFocused=true;
	this.textarea.focus();
	this.render();
}
//»
onblur(){//«
	this.isFocused=false;
	this.textarea.blur();
	this.render();
}
//»

onresize(){this.resize();}

//»

//Alt screen apps (vim, less, etc.)«

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
clipboardCopy(s){this.doClipboardCopy(null,s);}
setLines(linesarg, colorsarg){//«
	this.lines = linesarg;
	this.lineColors = colorsarg;
}//»
initNewScreen(actor_arg, classarg, new_lines, new_colors, n_stat_lines, funcs={}){//«
	const{actor}=this;
	let escape_fn = funcs.onescape;
	let reload_fn = funcs.onreload;
//	let screen = {actor, appclass, this.lines, this.lineColors, x, y, this.scrollNum, this.numStatLines, onescape: termobj.onescape};
	let screen = {
		actor: this.actor,
		appcClass: this.appClass,
		lines: this.lines,
		lineColors: this.lineColors,
		x: this.x,
		y: this.y,
		scrollNum: this.scrollNum,
		numStatLines: this.numStatLines,
		funcs: {
			onescape: this.onescape,
			onreload: this.onreload
		}
	};
	if (!this.actor) this.holdTerminalScreen = screen;
	this.onescape = escape_fn;
	if (!reload_fn) this.onreload=()=>{
//cwarn("DEFAULT RELOAD FN");
this.doOverlay("Default onreload called");
	};
	else this.onreload = reload_fn;

	this.actor = actor_arg;

	this.appClass = classarg;
	this.isEditor = classarg == "editor";
	this.isPager = classarg == "pager";

	this.lines = new_lines;
	this.lineColors = new_colors;
	this.scrollNum=this.x=this.y=0;
	this.numStatLines=n_stat_lines;
	if (this.numStatLines) {
		this.wrapdiv.appendChild(this.statdiv);
		this.wrapdiv.appendChild(this.tabdiv);
		this.generateStatHtml();
	}
	return screen;
}//»
quitNewScreen(screen, opts={}){//«
//	const{actor}=this;
	let actor;
	if (screen === this.holdTerminalScreen) this.holdTerminalScreen = null;
	let old_actor = this.actor;
	this.actor = screen.actor;
	this.appClass = screen.appClass;
	this.lines = screen.lines;
	this.lineColors = screen.lineColors;
	this.x=screen.x;
	this.y=screen.y;
	this.scrollNum = screen.scrollNum;
	this.numStatLines = screen.numStatLines;

	this.isEditor = this.appClass == "editor";
	this.isPager = this.appClass == "pager";
	if (!screen.funcs) screen.funcs = {};
	this.onescape = screen.funcs.onescape;
	this.onreload = screen.funcs.onreload;
	
	if (!this.numStatLines){
		this.statdiv._del();
	}
	this.tabdiv._x = 0;
	if (old_actor&&old_actor.cb) {
//		old_actor.cb(screen);
		old_actor.cb(!opts.reload);
	}
}//»

//»

}; 

//»


