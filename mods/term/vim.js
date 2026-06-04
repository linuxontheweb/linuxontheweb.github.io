(()=>{"use strict";const MODNAME="term.vim";
/* CAUTIONARY TALE TO ***ALWAYS*** SET NUM_LINES, WHEN SETTING LINES«

FIXED @WEUTJOEJ: VERY SUBTLE BUG TO SET LINES BUT NOT NUM_LINES!!!

a & ENTER_ C j_C j_CAS X d END_

After deleting a cut buffer of 2 lines, we find ourselves on a buffer of
1 line. But when pressing END_, it apparently thinks that it is a 2-line
buffer...

»*/
//ISSUE IN ONESCAPE W/ CANCELLING OVERWRITE QUERIES @HSRRDFDF
/* Need to call REALY on SELTOP before feeding it it SCROLL_TO !!! «

@SJDUIRHJKED !!!!!!!!!!

SCROLLLLLLL TOOOOOOOOOOO REALLLLLLLLLLLLYYYYYYYYYYY(SELLLLLLLLLTOPPPPPPPPP)

		scroll_to(realy(seltop), {noSetSel: true});

UGH!!!!!! SELECTION LOCATIONS ARE NOT "REALITY BASED THINGS" (WHICH SCROLL_TO IS!!!!)


6/3/26
HERE WE ARE A DAY LATER AFTER LEARNING THIS LESSON:
@WIRKGNDJ

»*/
/*Failed tests«

Initial strings don't match

79x5 (faketerm dimensions)

I CAN'T REPRODUCE THIS MANUALLY

a ENTER_ ENTER_C ESC_ o ENTER_ , ESC_ HOME_ G V x L

vimtest: ABORTING (RY IS UNDEFINED)

NOTE: w/o the final 'L', this works. All it does is put the cursor on
the bottom line.

@EKSHTKDH: This error showed up on the console while testing, now I'm
putting a THROW on it.


»*/
/* NON-STANDARD VIM MODES «

LINE_WRAP_MODE (Alt+l): Since there is no option to 'set wrap' here, the default
way that this treats of the issue of editing long lines is to keep the 
cursor at the right edge of the screen, which can be quite annoying since
you can't see ahead of you. This mode
takes the current line and wraps it like vim's 'set wrap' mode, except
there are no other lines on the screen (a new buffer is created for the
current line). This mode only allows for editing the line, 1 character
at a time. Pressing Enter "commits" the changes, and the user is returned
to the main screen. Hitting escape throws away any changes, and returns
to the main screen. There are no "normal mode" operations available here,
like selecting/cutting blocks of text. 

FILE_MODE (Ctrl+o): You will be prompted for a file to open, and tab
completion should help you. The file will open in another buffer. 
This buffer is "read only". It mainly exists to get selected lines into 
your active "yank buffer" (which you can then insert via "p" or "P")

CUT_BUFFER_MODE (X): If you have cut any lines, you can view them
all here, starting from the most recent, with the left/right arrow
keys (adding the Alt-key scrolls immediately to the first/last cuts).
Pressing 'd' deletes that particular cut. Pressing Enter makes that
cut your active "yank buffer".

SYMBOL_MODE (s or S): Upon entering the mode, all of the "interesting"
sequences of characters (currently, whatever is >= MIN_COMPLETE_WORD_LEN)
are collected and put into a buffer. You can then use the up/down arrow
key to find the one you want, and Enter "selects" it by inserting it into
the main buffer. Additionally, you can type letters to narrow the 
list down. Using the upper-case version inserts the selected word
(puts it before the cursor), while the lower-case version appends it .

COMPLETE_MODE (Ctrl+p): This works just like SYMBOL_MODE, except that the
string of letters preceding your cursor, after the first non-alpha-numeric
character (including newline), are used to automatically narrow down the
symbol list. If only there is only one possible match, the SYMBOL_MODE buffer
will not be shown, and the autocompletion will take place immediately.
This mode is "full screen", as opposed to the way "real" vim pops up a 
sub-window.

REF_MODE (<none>): This mode is under construction, and is meant to work
somewhat like SYMBOL_MODE, except that the possible list of words is not
taken from the current buffer, but must be supplied by the user via the
command line argument: "--ref=<ref_list_name>". Here, <ref_list_name>, should
key into a list that is kept in the globals.refs object. When the user
selects a word, the autocompleted value is not the word itself, but rather a
(possibly very long and complicated) textual string that the word refers to.
So, the "list" is technically a map-like object that the selected word keys
into. For example, if the word map is:

{
	yawny: "Life is like a box of air",
	yummy: "Life is like a box of chocolates",
	rainy: "It was a dark and stormy night"
}

...typing "y" will narrow down the word list to "yawny" and "yummy", and
typing another "u" will further narrow it down to "yummy". Pressing Enter
will automatically insert the string "Life is like a box of chocolates" into
your main buffer.

»*/

//Historical development notes (and old programs) are kept in doc/dev/VIM
//«Notes

//@SRKTLDM: To enable automatic line wrapping

/* USE_NEWLINE_REPLACE «

If 'USE_NEWLINE_REPLACE' is true, "\\r" in the replace string (2 chars: '\'
followed by 'r'), is turned into the newline character: "\n", and the
resulting string is split apart, via split("\n"). For trivial examples, it
works, but once multiple newlines are being inserted over multiple line
selections (as in VIS_LINE_MODE), then all of the variables in
search_and_replace() get out of whack, and even if the result looks good, the
undo feature isn't able to get it back to the original state.

»*/

/*5/25/26 BUG: Cutting to the end of the file (fixed?)«
WHEN CUTTING TO THE BOTTOM OF THE FILE, FROM A Y POSITION > 0, THE
LINE ABOVE THE CURSOR DISAPPEARS AFTER UNDO'ING IT!?!?!?!?!?

So we need to know:
1) What is the action that was created for delete_to_bottom?

@NFBFUTKD, we are undoing the multi-line delete, which works for
deleting everything BEFORE the last line, but when the last line
is involved, the fileChomp condition is invoked, which turns on
the keepFirst variable, and this is what happens:

	lines.splice(y+scroll_num, keepFirst ? 1 : 0, ...arr);

This means that we are deleting the line at y+scroll_num.

Now, fileChomp means add1=1 (as opposed to 0), and this is looking
like the right way. I have no idea what the point about removing
the first line was supposed to be about.

keepFirst is what happens when we chomp the *ENTIRE* file. In
that case, the cursor is on the first line, which we need to
keep. Otherwise, the cursor gets moved up to the line above it.

lines.splice(y+scroll_num+add1, keepFirst?1:0, ...arr);

»*/
/*5/24/25: Getting search_and_replace to insert newlines: «

 :s/} /}\r\t/

so this:
	if (blah) {
		//...
	} else if (...) {
		//...
	}

becomes this:
	if (blah) {
		//...
	}
	else if (...) {
		//...
	}

@RSJGPSK is where we are collecting up the "\r"s in the subtitution
string, and @ZMKLOPIJH is where we are inserting newlines. 

Vim allows us to match and replace a newline by:

s/\n/BLAH/

so executing this just on the food line:

food
sports

... becomes: 

foodBLAHsports

And executing it on a selection of both lines becomes:

foodBLAHsportsBLAH

For our purposes, we can use it to match an end-of-line (/$/)
that might have some stuff before it, so that

s/d\n/lBLAH/

...becomes:

foolBLAHsports

So we can replace the "\n" with a "$" in our pattern string,
and flag to the replacement section that we are *deleting*
the end-of-the-line, as well as the characters that preceded
it..

If someone has stuff *after* it, like:

s/\nsports/BLAH/

...so that:

food
sports

... becomes:

foodBLAH

Then we can just tell them that since we are using a one-line-at-a-time
pattern matching algorithm (rather than character-based), we are forced 
to disallow that idiom.

»*/
/*5/24/26: BUG: DEL/BACK in line wrap mode (fixed???)«

In line wrap mode (via l_A), when we backspace/delete so that the
number of lines is reduced by 1, then the new bottom line suddenly
disappears!

THE OFFENDING LOGIC SEEMS TO BE @EUSJFKG, WHICH DETECTS THE EDGE
CASES OF BEING AT THE BOTTOM OF THE FILE AND THE END OF THE LINE...

WE WERE BIZARRELY DOING LINES.SPLICE() IN A CONDITION THAT 
***CLEARLY*** CALLED FOR LINES.POP()!!!!

»*/
/*5/23/26: BUG: Deleting to the bottom of the file (fixed?)«

Undo'ing this deletion doesn't work because the throw @WRUGLGN 
(in undo) is invoked.

The fix is @HDPSKDN, in scroll_to, where we check *early* there
for: 'if (fileChomp && (scroll_to_num == end_ry + 1))'
then:
  scroll_to(scroll_to_num-1);
  nobreak_enter({fromNewline: true, noAct: true});

»*/

/*12/18/25: Developing commands internally with vim«

I want to iterate on the note (below) from 12/24/25 @SMERUTJ so that the file I
am working on is interpreted as a command library, and the commands can get
exported into some Terminal's shell as "dev.<comname>" (let's reserve
"dev.WHATEVER") for only commands that go through this vim-based workflow.  The
relevant workflow begins @SDHRYWOEL1, upon hitting the r_CA hotkey.  So instead
of dealing in the LOTW.apps namespace, we want to use (something like)
LOTW.coms["local.<base_filename>"].

Then by way of another terminal's API, I want to be able to automatically
load/reload the library in its com_env and send a CLI string into it.

Now there is a very crude little workflow there (@SDHRYWOEL2) to use Ctrl+Alr+r to initialize
a "slave terminal" (accessible as reload_win.app).

Then Alt+r will load/reload that terminal's command environment with the command
libary we are editing in vim, such that each new command is accessible as dev.<modname>.<comname>.

Then ":x <command_goes_here>" will save <command_goes_here> into 
the global variable 'cur_background_command', so that 
the Ctrl+Alt+x shortcut @KSJTUSHF calls reload_win.app.autoTypeCommand(cur_background_command).

Sample file contents:

<FILE BEGIN>
const {Com}=LOTW.globals.ShellMod.comClasses; 
class com_mycom extends Com{ 
	static getOpts(){return {q:{1}};}
	run(){ 
		this.ok("HI"); 
	} 
}; 
const coms={ 
	mycom: com_mycom 
}; 
LOTW.coms["local.<base_file_name>"]={coms}; 
<FILE END>

If the file is named "newcoms.js" (or vim is invoked with --dev-name=newcoms),
then after reloading with Alt+,r reload_win.app will have the command, 'dev.newcoms.mycom' 
in its command environment, and then running this in vim:
:x dev.newcoms.mycom -q blah hoo fooey
...will send the command string "dev.newcoms.mycom -q blah hoo fooey" to that 
controlled terminal.
»*/

//»
//Imports«

//import { util, api as capi } from "util";
const util = LOTW.api.util;
//import { globals } from "config";
const globals = LOTW.globals;
const{
fsMod: fs,
dev_mode,
ShellMod,
NS
}=globals;
const{
	TERM_STAT_TYPES,
	VIM_MODES,
}=globals.term;
const{
	FS_TYPE,
	USERS_TYPE,
	SHM_TYPE,
}=globals.fs;
const{isArr, isStr, isEOF, log, jlog, cwarn, cerr, consoleLog: con}=LOTW.api.util;
const{STAT_NONE,STAT_OK,STAT_WARN,STAT_ERR} = TERM_STAT_TYPES;
const {
//Standard vim modes
	COMMAND_MODE,
	INSERT_MODE,
	REPLACE_MODE,
	VIS_LINE_MODE,
	VIS_MARK_MODE,
	VIS_BLOCK_MODE,

//My own concoctions
	FILE_MODE,
	LINE_WRAP_MODE,

	CUT_BUFFER_MODE,
	SYMBOL_MODE,
	COMPLETE_MODE,

	REF_MODE

} = VIM_MODES;
//log(C);
//const{log:clog, nlog: cnlog}=consoleLog;
const fsapi = fs.api;
const {widgets} = NS.api;
const {popkey, popok, poperr} = widgets;
const LO2HI = (a, b)=>{if(a>b)return 1;else if (a<b)return -1;return 0;};
const HI2LO = (a, b)=>{if(a>b)return -1;else if (a<b)return 1;return 0;};
const NOOP=()=>{};
const NUM=(v)=>Number.isFinite(v);


//»

LOTW.mods[MODNAME] = function(Term) {

//Vim«


//Imports«
this.comName="vim";
const{
	topwin,
	Desk,
	tabdiv
} = Term;
let{ w, h } = Term;

const cur_dir = Term.env.cwd.cwd;
const never_render= !tabdiv;

//let{
//w,h, cursor_id, mainWin
//} = Term;

//»
//Var«

const vim = this;
let killed;
let mode, mode_hold, stat_input_type;

let appclass = "editor";
let hold_screen_state;
let actions=[];
let act_iter=0;

let undos=[];

let fold_mode = true;
//let fold_mode = false;

let AUTO_INSERT_ON_LINE_SEEKS = false;
//let AUTO_INSERT_ON_LINE_SEEKS = true;

let use_devreload;
let no_save_mode = false;
let one_line_mode;
let quit_on_enter;
//let has_internal_tabs;

let SYNTAX_TIMEOUT_MS = 1500;
let syntax_timeout;

const overrides=["c_A", "f_CAS"];
const PREV_DEF_SYMS=[
	"TAB_", 
	"j_C", 
	"v_C", 
	"l_C", 
	"r_C"
];

const USE_NEWLINE_REPLACE = true;

//const OK_DIRTY_QUIT = true;
const OK_DIRTY_QUIT = false;
const QUIT_WHEN_DIRTY_DEFAULT_YES=true;

const MIN_COMPLETE_WORD_LEN = 4;

const MARKS={};
let command_str;
let initial_str;

let cut_buffers = [];

let add_splice_lines = 0;
let splice_hold;

let is_root = false;

let app_cb;
let reload_script;
let reload_win;
let hold_overrides;

//let yank_buffer = [[]];
let yank_buffer;
/*«
yank_buffer=[
["2", "3", "4"],
["2", "3", "4"]
];
yank_buffer._type="M";
let yank_buffer = [
	["A", "A", "A", "A", "A", "A",],
	["B", "B", "B", "B", "B", "B",],
	["C", "C", "C", "C", "C", "C",],
	["D", "D", "D", "D", "D", "D",],
	["E", "E", "E", "E", "E", "E",],
	["F", "F", "F", "F", "F", "F",]
];
yank_buffer._type="B";
»*/

let lines;
let hold_lines;
let stdin_lines;
let line_colors;
let real_line_colors;

let lens;
let stat_x;
let x=0,y=0,scroll_num=0, ry=0;
let scroll_hold_x=0;
let num_real_lines;

let histories = globals.vim.histories;
if (!histories){
	histories = {command: [], search: []};
	globals.vim.histories = histories;
}
this.command_history = histories.command;
this.search_history = histories.search;
let WRAP_LENGTH = 85;
let NUM_ESCAPES_TO_ESCAPE=2;

let NO_CTRL_N=false;
let hist_iter=0;
let last_updown = false;
let no_render=false;

let alt_screen_escape_handler = null;
let num_escapes = 0;
let waiting = false;
let pretty;
let cur_background_command;

//Any changes to the mode variables MUST be updated in Terminal.js @XKIUO
//WKOIPUHN
const COMMAND_OR_EDIT_MODES=[
	COMMAND_MODE,
	INSERT_MODE,
	REPLACE_MODE
];
//const NO_EDIT_MODES = [LINE_WRAP_MODE];

let DEF_BACKGROUND_COMMAND = 'echo "REPLACE THIS WITH A BETTER COMMAND!"';
const SAVE_AS_MODE = "Save As: ";
const FILE_OPEN_MODE = "Open: ";

const PATH_COMPLETER_MODES=[
SAVE_AS_MODE, FILE_OPEN_MODE
];

let x_hold;
let y_hold;

let stat_com_x_hold;

let	num_completion_tabs;//«
let cur_completion_name;
let cur_completion_dir;
let cur_completion_str;
//»

const RESERVED_FOLD_CHAR = "\xd7";
const OPEN_FOLD_CHAR = "\xab";
const END_FOLD_CHAR = "\xbb";

//let cur_number_str = "";

let cur_undo;

let mark_pos;
let cur_pos;
let edit_sel_start, seltop, selbot;
let edit_sel_mark, selleft, selright;
let edit_fname;
let edit_fobj, edit_fobj_hold;
let edit_fullpath;
let edit_ftype;
let edit_show_col = true;
let edit_kill_cb = null;

let dirty_flag = false;

let stat_message, stat_message_type;
let stat_cb;
let stat_com_arr;
let enter_cb;

let	num_stat_lines = 1;

//let toggle_hold_y = null;
//let toggle_hold_x = null;

const Action = function(x,y,ch,time,opts={}){//«
	undos = [];
    this.x=x;
    this.y=y;
    this.ch=ch;
    this.time = time;
	this.opts = opts;
	this.n = actions.length;
};//»

let VALIDATE_JSON_ON_SAVE = true;
let MAX_LEN_TO_VALIDATE_JSON = 10000;

const MIN_WORD_LEN = 3;
let symbols;
let symbol;

let symbol_len;

let ALLWORDS;
let ALLWORDSYMBOLS;
let ALLWORDS_HASH;
let SYMBOLS;
let SYMBOL_WORDS;

//»

//Render«

const render = (opts={}, which) => {
if (killed) return;

{// Fix x-coordinate issues «

/*We are considering bad/impossible x-coordinates to be a temporary style flaw, 
while bad y-coordinates are evil errors that the logic of the system needs to
show under its own auspices.
*/

	let ln = curarr();//let ln = curln(true);
	if (ln._fold) {
		x=0;
	}
	else {
		let len = ln.length;
		let usex;
		if (last_updown) usex = scroll_hold_x;
		else usex = x;

		if (usex <= 0) x=0;
		else if (mode == INSERT_MODE || mode == REPLACE_MODE) {
			if (usex > len) x = len;
		}
		else if (usex >= len) {
			x = len-1;
			if (x < 0) x = 0;
		}
		else x = usex;
	}
}//»

	if (no_render || never_render) return;

	if (SYNTAX===JS_SYNTAX)	js_syntax_screen();
	maybe_scroll();

	let outarr = [];
	let usex = x;
	let usescroll = scroll_num;

	let visual_line_mode;	
	if (mode===VIS_LINE_MODE || mode===REF_MODE||mode===SYMBOL_MODE||mode===COMPLETE_MODE){
		visual_line_mode = true;
		if (mode===SYMBOL_MODE||mode===COMPLETE_MODE){
			seltop = selbot = y + scroll_num;
		}
	}

	let visual_block_mode = mode===VIS_BLOCK_MODE;
	let visual_mark_mode = mode===VIS_MARK_MODE;
	let visual_mode = visual_line_mode || visual_mark_mode || visual_block_mode;

	let uselines=[];
	let slice_from_y = scroll_num;
	let slice_to_y = scroll_num + Term.nRows;
	for (let i=slice_from_y; i < slice_to_y; i++) {//«
		let ln = lines[i];
		if (ln){
			uselines.push(ln.slice());
			continue;
		}
		let noline = ['<span style="color: #6c97c4;">~</span>'];
		noline._noline = true;
		uselines.push(noline);
	}//»
	let donum = uselines.length-num_stat_lines;

	let slice_from_x = 0;
	let slice_to_x;

	if (mode!==LINE_WRAP_MODE) {//Keep the cursor (non-jarringly) at the end of the right edge of the screen when it would otherwise be off screen.
		let diff = usex - w + 1;
		let no_colors = false;
		if (diff > 0){
			slice_from_x = diff;
			if (slice_from_x && (visual_mark_mode || visual_block_mode)) {
				selleft -= slice_from_x;
				selright -= slice_from_x;
			}
			usex-=slice_from_x;
			slice_to_x = diff + w;
			no_colors = true;
		}
	}
	for (let i = 0; i < donum; i++) {//«
		let arr = uselines[i];
		let ch0 = arr[0];
		let is_folded = arr[0]=="\xd7";
		if (!is_folded && slice_from_x) arr = arr.slice(slice_from_x, slice_to_x);
		else arr = arr.slice(0, w);
		let ind;
		while((ind=arr.indexOf("&"))>-1) arr[ind] = "&amp;";
		while((ind=arr.indexOf("<"))>-1) arr[ind] = "&lt;";
		while((ind=arr.indexOf(">"))>-1) arr[ind] = "&gt;";

		if (!arr||(arr.length==1&&arr[0]=="")) arr = [" "];
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
					useleft = (curnum==cy())?x:edit_sel_mark;
				}
				else if (selbot===curnum){
					useleft = 0;
					useright = (curnum==cy())?x:edit_sel_mark;
				}
				else{
throw new Error("Weird condition detected in visual mark mode involving curnum (current line number), seltop (selection top) and selbot (selection bottom)!");
				}
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
		else if (is_folded){//Folded row«
//This marker is reserved as the first character for folded rows
			if (tabdiv._x) arr=[];
			else {
//Term.rowFoldColor = "rgb(160,160,255)";
				arr[0]=`<span style="color:rgb(160,160,255);">${arr[0]}`
				arr[arr.length-1]=`${arr[arr.length-1]}</span>`;
			}
		}//»
		else if (colobj){//«
			let nums = Object.keys(colobj);
			for (let numstr of nums) {
				if (numstr.match(/^_/)) continue;
				let num1 = parseInt(numstr);
				let obj = colobj[numstr];
				if (obj[0] < 1){
cwarn(`Invalid length in the color obj: ${obj[0]} (want >= 1)`);
log(obj);
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
				if (num2 > w) break;
			}
		}//»

		if (i==y && !stat_input_type) {//«
			let usebg;
			if (!Term.isFocused) usebg = Term.curBGBlurred;
			else usebg = Term.curBG;
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
			let sty = `background-color:${usebg};color:${Term.curFG}`;
			arr[usex] = pre+`<span id="${Term.cursorId}" style="${sty}">${usech}</span>`;
		}//»

		let s = arr.join("");
		outarr.push(s);

	}//»

	let stat_str;
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
		arr[stat_x] = `<span style="background-color:${Term.curBG};color:${Term.curFG}">${arr[stat_x]}</span>`;
		if (visual_mode&&stat_input_type===":") {
			stat_str = `:'&lt;,'&gt;${arr.join("")}`;
		}
		else {
			stat_str = stat_input_type + arr.join("");
		}
	}//»
	else {//«
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

			stat_message=null;
			stat_message_type=null;

		}//»
		else {//«
			if (mode === INSERT_MODE) mess = "-- INSERT --";			
			else if (mode === REPLACE_MODE) mess = "-- REPLACE --";			
			else if (mode === SYMBOL_MODE) {
				if (symbol) mess = `-- SYMBOL: ${symbol} --`;
				else mess = "-- SYMBOL --";
			}
			else if (mode === REF_MODE) {
				if (symbol) mess = `-- REF: ${symbol} --`;
				else mess = "-- REF --";
			}
			else if (mode === COMPLETE_MODE) mess = `-- COMPLETE: $symbol} --`;			
			else if (visual_line_mode) mess = "-- VISUAL LINE --";
			else if (visual_mark_mode) mess = "-- VISUAL --";
			else if (visual_block_mode) mess = "-- VISUAL BLOCK --";
			else if (mode === FILE_MODE) mess = "-- FILE --";
			else if (mode === CUT_BUFFER_MODE) mess = `-- CUT BUFFER: ${cur_cut_buffer+1}/${cut_buffers.length} --`;
			else if (mode === LINE_WRAP_MODE) mess = "-- LINE WRAP --";
			messln = mess.length;
		}//»
		let per;
		let t,b;
		if (scroll_num==0) t = true;
		if (!lines[slice_to_y-1]) b=true;
		if (t&&b) per = "All";
		else if (t) per="Top";
		else if (b) per = "Bot";
		else {
			if (Number.isFinite(ry)) {
				per = Math.floor(100*ry/num_real_lines)+"%";
			}
			else {
				let val = Math.floor(100*(scroll_num/(num_real_lines-1)));
				per = (val)+"%";
			}
		}
		let perln = per.length;
		let perx = w-5;
		if (perln > 4) per = "?%";
		per = "\x20".repeat(4-perln)+per;
		let lncol;
		if (mode===LINE_WRAP_MODE) lncol = (line_wrap_y+1)+","+(line_wrap_x()+1);		
		else lncol = (ry+1)+","+(x+1);		
		let lncolln = lncol.length;
		let lncolx = w - 18;
		let diff = lncolx - messln;
		if (diff <= 0) diff = 1;
		let diff2 = (perx - lncolx - lncolln);
		if (diff2 <= 0) diff2 = 1;
		let spaces = "\x20".repeat(diff) + lncol + "\x20".repeat(diff2)+per;
		let str = mess + spaces;
		stat_str = `<span>${str}</span>`;
	}//»
	outarr.push(stat_str);
	tabdiv.innerHTML = outarr.join("\n");

};
this.render = render;
//»

//Util«

const THROW = s => {//«
let err;
if (s instanceof Error) err = s;
else err = new Error(s);
if (never_render){
killed = err;
quit();
}
else throw err;
};//»

const line_wrap_x = () => {//«
	let _cy = y+scroll_num;
	if (!_cy) return x;
	return ((_cy) * w) + x;
};//»
const warn_if_fold_visual=()=>{//«
	if (fold_mode && (mode===VIS_BLOCK_MODE || mode === VIS_MARK_MODE)){
		stat_warn("Paging keys not available in this mode");
		return true;
	}
	return false;
}//»

const send_lines_to_gui=(if_wrap)=>{//«
	let arr = get_edit_lines({str: true});
	let str;
	if (if_wrap) str = util.linesToParas(arr).join("\n");
	else str = arr.join("\n");
//SRKTLDM
//Uncomment this to do auto line wrapping (And comment out the above)
	Desk.api.openTextEditor({appArgs: {text: str, selected: true}});
};//»
const write_to_host=async()=>{//«
if (!dev_mode){
	return;
}
if (!edit_fname) return stat_warn("No filename given for the host");
let body = get_edit_save_arr()[0]+"\n";
let rv = await fetch(`/_host?file=${edit_fname}`, {method:"POST", body});
let txt = await rv.text();
if (!rv.ok) return stat_err(txt);
stat(txt);

};//»

const validate_initial_str=async()=>{//«
	let str = get_edit_save_arr()[0]; 
	if (str == initial_str) return;
cwarn("INITIAL");
log(initial_str);
cwarn("CURRENT");
log(str);
	poperr("The initial strings do not match");
};//»
const cur_sha1=async(s)=>{//«
let str = get_edit_save_arr()[0];
let sha1 = await util.sha1(str);
if (s) cwarn(`${s}: ${sha1}`);
else cwarn(sha1);
//log(str);
};//»
const is_command_or_edit_mode=()=>{return COMMAND_OR_EDIT_MODES.includes(mode);};


const check_odd_escapes=(arr, iter)=>{//«
	let j=iter-1;
	let num_esc=0;
	while (j>=0 && arr[j]=="\\"){
		num_esc++;
		j--;
	}
	return (num_esc%2);
};//»
const set_sel_mark = ()=> {//«
/*

For visual_block_mode, we need an array for the lines between
seltop and selbot. 

*/
//	if (!(visual_mode||visual_block_mode)) return;
	if (!(mode===VIS_MARK_MODE||mode===VIS_BLOCK_MODE)) return;
	let ln = curarr();
	if (x==edit_sel_mark) selleft=selright=x;
	else if (x < edit_sel_mark){
		selleft = x;
		selright = edit_sel_mark;
	}
	else{
		selleft = edit_sel_mark;
		selright = x;
	}
	cur_pos = {x, y: cy()};
}//»
const get_marker_coords = () =>{//«
	let x1,y1,x2,y2;
	if (cur_pos.y == mark_pos.y) {
		y1=y2 = cur_pos.y;
		if (mark_pos.x < cur_pos.x) {
			x1 = mark_pos.x;
			x2 = cur_pos.x;
		}
		else{
			x2 = mark_pos.x;
			x1 = cur_pos.x;
		}
	}
	else if (cur_pos.y < mark_pos.y) {
		y1 = cur_pos.y;
		x1 = cur_pos.x;
		y2 = mark_pos.y;
		x2 = mark_pos.x;
	} 
	else {
		y2 = cur_pos.y;
		x2 = cur_pos.x;
		y1 = mark_pos.y;
		x1 = mark_pos.x;
	}
return [x1, y1, x2, y2];
};//»
const real_seltop=()=>{if(!fold_mode)return seltop;return lens[seltop];};
const real_selbot=()=>{if(!fold_mode)return selbot;return lens[selbot];};
const realy=(num)=>{if(!fold_mode)return num;return lens[num];};

const set_ry = () => {//«
	let _cy = y+scroll_num;
	if (!fold_mode) {
		ry = _cy;
		return;
	}
	ry=lens[_cy];
	if (!Number.isFinite(ry)){
/*«
if (_cy === lens.length){
lines.push([]);
lens.push(lens[lens.length-1]+1);
ry=lens[_cy];
cwarn("CAUGHT THIS DUMB BUG, NOW HAVE RY", ry);
return;
}
»*/
//log(`cy: ${_cy}, y: ${y}, scroll_num: ${scroll_num}, lens.length: ${lens.length}`);
//cwarn(`_cy === lens.length: ${_cy === lens.length}`);
//log(lens);
//EDPOPLKIUK
//cerr("RY IS UNDEFINED");
//		throw new Error("WHAT IS RY DOING BEING UNDEFINED???????");
return THROW("ABORTING (RY IS UNDEFINED)");
	}
};//»
const set_line_lens = ()=>{//«
	if (!fold_mode) {
		num_real_lines = lines.length;
		return;
	}
	num_real_lines = 1;
	if (!lines.length){
		lens=[0];
		ry = 0;
		return;
	}
	lens = [];
	let start = 0;
	for (let ln of lines) {
		lens.push(start);
		if (ln._fold) {
			start+=ln._foldlen;
		}
		else {
			start++;
		}
	}
//CKJEPOIL
	num_real_lines = start;
	if (!num_real_lines) num_real_lines = 1;
	set_ry();
};//»
const dup = (arr) =>{//«
	let out=[];
	for (let ln of arr) out.push(ln.slice());
	return out;
};//»
const have_fold = (add) => {//«
	if (!fold_mode) return false;
	if (!add) add=0;
	return lines[cy(add)]._fold;
};//»
const reset_display=()=>{//«
//	if (alt_screen_escape_handler) {
//		alt_screen_escape_handler();
//		alt_screen_escape_handler = null;
//	}
	stat_cb = null;
//	stat_input_type = null;
	x=0;y=0;scroll_num=0;
	mode = COMMAND_MODE;
	mode_hold = undefined;
	set_ry();
	stat_warn("Display reset");
//	render({},107);
};//»
const scr_h = ()=>{return Term.h - num_stat_lines;};
const at_screen_bottom = () => {return y === Term.h - num_stat_lines - 1;};
const at_file_end = ()=>{return y+scroll_num === lines.length - 1;};
/*
const timestr=(stamp)=>{//«
	let msdiff = (new Date).getTime() - stamp;
	let secsago = Math.floor(msdiff/1000);
	if (secsago < 60) return `${secsago} secs ago`;
	let daysago = Math.floor(msdiff/86400000);
	let str = ((new Date(stamp))+"").split(" ")[4];
	if (daysago) str = `${str} (${daysago} days ago)`;
	return str;
};//»
*/
const timestr=(stamp)=>{//«
return "";
//return `${act_iter-stamp} steps ago`;
//	return str;
};//»
const try_clipboard_copy=()=>{//«
//This lets you use Ctrl+v to copy vim's yank_buffer SOMEWHERE ELSE ON YOUR COMPUTER
	if (!yank_buffer) return;
	let s = '';
	for (let ln of yank_buffer) s+= ln.join("")+"\n";
	Term.clipboardCopy(s);
};//»
const echo_file_path=()=>{//«
	let nm = edit_fname ? edit_fname : "New File"
	if (lines.length==1 && !lines[0].length) stat(`"${nm}"`);
	else stat_file(num_real_lines, get_edit_save_arr()[0].length);
};//»
const try_dopretty=async()=>{//«
	if (pretty) return do_pretty();
//	if (!(is_normal_mode(true)||visual_line_mode)) {
	if (!(is_normal_mode(true)||mode === VIS_LINE_MODE)) {
		stat_warn("Pretty printing requires normal, insert or visual lines!");
		return;
	}
/*«
	stat("Loading the pretty module...");
	let modret = await util.getMod("util.pretty");
	if (!modret) return stat_render("No pretty module");
	stat("Done");
	pretty = modret.getmod().js;
»*/
	do_pretty();
};//»
const stat_file=(len, chars)=>{//«
	let nm = edit_fname;
	if (!nm) nm = "New File";
	stat(`"${nm}" ${len}L, ${chars}C`);
};//»
const stat_timer=(mess,ms)=>{setTimeout(()=>{stat(mess)},ms);};
const set_stat=(mess)=>{stat_message=mess;stat_message_type=null;};
const set_stat_ok=(mess)=>{stat_message=mess;stat_message_type=STAT_OK;};
const set_stat_warn=(mess)=>{stat_message=mess;stat_message_type=STAT_WARN;};
const set_stat_err=(mess)=>{stat_message=mess;stat_message_type=STAT_ERR;};
const cancel=()=>{stat_render("Cancelled");};
const quit = (if_reload) => {//«
	command_str =  undefined;
//	Term.is_dirty = false;
//	Term.is_editing = false;
	Term.overrides = hold_overrides;
	if (edit_fobj) {
		edit_fobj.unlockFile();
		delete Term.curEditNode;
	}
	if (reload_win) {
		delete LOTW.apps[reload_win.appName];
		let ind = topwin.childWins.indexOf(reload_win);
		if (ind < 0){
cerr("The reload_win was not in topwin.childWins!?!?!");
		}
		else{
			topwin.childWins.splice(ind, 1);
		}
		delete reload_win.ownedBy;
		reload_win.close();
	}
	delete Term.actor;
//	delete Term.isEditor;
	app_cb(!if_reload);
	Term.render();
};
this.quit = quit;
//»
const warn_stdin=()=>{stat_warn(`stdin: ${stdin_lines.length} lines`);};

const cx = () => {return x;}
const curnum = (addx)=>{//«
	if (!addx) return y+scroll_num;
	return y+scroll_num+addx;
}//»
const cy = curnum;
const stat_ok=mess=>{stat_message=mess;stat_message_type=STAT_OK;render({},13);};
const stat_warn=mess=>{stat_message=mess;stat_message_type=STAT_WARN;render({},14);};
const stat_err=mess=>{stat_message=mess;stat_message_type=STAT_ERR;render({},15);};
const stat_render=(mess)=>{stat_message=mess;stat_message_type=STAT_NONE;render({},16);};
const stat = stat_render;
const is_vis_mode=()=>{//«
	let m = mode;
	return (m===VIS_LINE_MODE || m===VIS_MARK_MODE || m===VIS_BLOCK_MODE);
};//»
const is_normal_mode = edit_ok => {//«
	if (stat_input_type) return false;
	let m = mode;
	if (edit_ok) return (m===INSERT_MODE || m===REPLACE_MODE || m === COMMAND_MODE);
	return m === COMMAND_MODE;
};//»
const is_edit_mode = () => {return (mode == INSERT_MODE || mode == REPLACE_MODE);};
const maybe_quit=()=>{//«
if (this.autoMode) return;
	if (!dirty_flag) return quit();
	if (OK_DIRTY_QUIT) return quit();

	if (QUIT_WHEN_DIRTY_DEFAULT_YES) stat_message = "Really quit? [Y/n]";
	else stat_message = "Really quit? [y/N]";
	render();
	stat_cb = (ch)=>{
		stat_cb = null;
		if (ch=="y"||ch=="Y") return quit();
		if (QUIT_WHEN_DIRTY_DEFAULT_YES){
			if (ch=="ENTER_") return quit();
		}
		render();
	}
}//»
const curarr = addy => {//«
//const curarr=addy=>{return curln(true, addy)};
	if (!addy) addy = 0;
	let ln = lines[y+scroll_num+addy];
	if (!isArr(ln)) ln = [];
	return ln;
}//»
const curlen = (addy) => {//«
	if (!addy) addy = 0;
	let ln = lines[y+scroll_num+addy];
	if (!ln) return;
	return ln.length;
};//»
const curfold=(addy=0)=>{//«
	let ln = lines[y+scroll_num+addy];
	return ln && ln._fold;
};//»
const curch = (addx) => {//«
	let _cy = y+scroll_num;
	let ln = lines[_cy];
/*XMNRJMR
TypeError: Cannot read properties of undefined (reading '-2')
    at curch (vim.js?v=6692513:1634:11)
    at Object.seek_prev_word [as LEFT_C] (vim.js?v=6692513:3724:13)
    at LOTW.mods.<computed>.onkeydown (vim.js?v=6692513:7826:23)


TypeError: Cannot read properties of undefined (reading '0')
    at curch (vim.js?v=2017610:1641:22)
    at del_ch (vim.js?v=2017610:6966:7)
    at do_undo (vim.js?v=2017610:5243:6)
    at do_undo_prepend (vim.js?v=2017610:5046:3)

    at curch (vim.js?v=2017610:1641:22)
    at Object.goto_matching_brace [as '] (vim.js?v=2017610:4452:10)


    at curch (vim.js?v=2017610:1642:11)
    at Object.seek_prev_word [as b] (vim.js?v=2017610:3732:13)


    at Object.seek_prev_word [as LEFT_C] (vim.js?v=9436458:3748:13)
*/
	if (!addx) return ln[x];
	return ln[x+addx];
}//»
const set_sel_end = () => {//«
	let m = mode;
//	if (!(visual_line_mode||visual_mode||visual_block_mode)) return;
	if (!(m===VIS_LINE_MODE || m===VIS_MARK_MODE || m===VIS_BLOCK_MODE)) return;
	if (cy() == edit_sel_start) seltop=selbot=cy();
	else if (cy() < edit_sel_start) {
		seltop = cy();
		selbot = edit_sel_start;
	}
	else {
		seltop = edit_sel_start;
		selbot = cy();
	}
	set_sel_mark();

}//»
const set_edit_mode = (ch)=>{//«
	open_line_if_folded();
	if (ch == "A"){
		seek_line_end();
		if (curch()) x++;
	}
	else if (ch=="a"&&curch()) {
		x++;
	}
	else if (ch == "I") seek_line_start();
	mode = INSERT_MODE;
	render();
};//»
const set_tab_size_cb=()=>{//«
	stat_cb=c=>{
		stat_cb=null;
		if (c && c.length==1){
			if (c.match(/^[1-9]$/)){
				Term.setTabSize(parseInt(c));
				render();
			}
			else if (c.match(/^[a-fA-F]$/)){
				Term.setTabSize(parseInt(`0x${c}`));
				render();
			}
			else stat_warn(`Invalid tab size: '${c}'`);
		}
		else render();
	};
	stat("tabsize (1-F)?");
};//»

//»
//Fold«

const open_folds_in_line_range = (nlines) => {//«
//Ensure that an entire range of lines starting from cy() are clear of folds.
	let _cy = y+scroll_num;
	for (let i=0; i <= nlines; i++){
		let ln = lines[i+_cy];
//log(i+_cy);
//log(ln);
		if (!ln) {
if (i+_cy === lines.length) return;
//log(lines);
//SKFMGKEJ
return THROW(`No line found: in lines[${i+_cy}] (i=${i}, cy=${_cy})`);
		}

//log(ln);

		if (ln._fold){
			open_fold(ln._fold, {noInnerFolds: false});
		}
	}
};//»
const check_if_folded=(num)=>{//«
    if (!fold_mode) return false;
    if (!num && num!==0) num = cy();
	let ln = lines[num];
	if (!ln){
		return false;
	}
    return ln._fold;
}//»
const toggle_if_folded=(opts)=>{//«

/*EKSHTKDH
    at toggle_if_folded (1334:31)
    at seek_line_end (3310:2)
    at Object.$ (7165:11)
*/
	if (!lines[cy()]) return THROW(`toggle_if_folded: NO LINE at lines[${cy()}]`);
	if (fold_mode && lines[cy()]._fold) {
		toggle_cur_fold(opts);
	}
}//»
const create_open_fold=()=>{//«
	let _ry = cy();
	print_chars(`//${OPEN_FOLD_CHAR}`,{ins: true});
//	print_chars(`//1`,{ins: true});
	render();
}//»
const create_closed_fold=()=>{//«
	print_chars(`//${END_FOLD_CHAR}`,{ins: true});
//	print_chars(`//2`,{ins: true});
	render();
}//»
const have_open_fold_marker=(ln)=>{//«
/*WHFKGKT
Cannot read properties of undefined (reading 'indexOf')
    at have_open_fold_marker (vim.js?v=2837382:1710:12)
    at have_fold_marker (vim.js?v=2837382:1715:38)
    at insert_fold (vim.js?v=2837382:6336:29)
    at handle_visual_key (vim.js?v=2837382:7342:4)
    at handle_press (vim.js?v=2837382:7245:3)
*/
	return ln.indexOf(OPEN_FOLD_CHAR) > -1;
};//»
const have_end_fold_marker=(ln)=>{//«
	return ln.indexOf(END_FOLD_CHAR) > -1;
};//»
const have_fold_marker=(ln)=>{
	return have_open_fold_marker(ln)||have_end_fold_marker(ln);
};
const open_all_folds = (if_keep_y) => {//«
	let _ry = ry;
	for (let ln of lines) {
		if (ln._fold) {
			open_fold(ln._fold, {noInnerFolds: true});
		}
	}
	if (if_keep_y) scroll_to(_ry);
};//»
const reinit_folds=()=>{//«
	x=y=scroll_num=0;
	lines=get_folded_lines(get_edit_lines({str: true}));
	set_line_lens();
	line_colors=[];
//	Term.setLines(lines, line_colors);
};//»

const await_z_command=()=>{//«
	stat_cb=c=>{
		stat_cb=null;
		if (c=="o"||c=="O"){
			if (!curfold()) return;//if (!curln(true)._fold) return;
			toggle_cur_fold({noInnerFolds: c=="O"});
		}
		else if (c=="m") reinit_folds();
		else if (c=="a") open_all_folds();
		render({},40);
	};
	stat("z");
}//»
const await_g_command=()=>{//«
	stat_cb=c=>{
		stat_cb=null;
		if (c=="g") {
			y = 0;
			scroll_num = 0;
			x = 0;
			set_ry();
		}
		else if (c=="M") {
			x = Math.floor(curarr().length/2);
		}
		else if (c=="e") {
			seek_prev_end_word();
		}
		render({},40);
	};
	stat("g");
}//»
const await_mark_command=()=>{//«
	stat_cb=c=>{
		stat_cb=null;
if (c.length == 1) {
	MARKS[c]=ry;
}
//log(c);
//log(MARKS);
		render({},40);
	};
	stat("mark");
}//»
const await_jump_command=()=>{//«
	stat_cb=c=>{
		stat_cb=null;
if (c.length == 1) {
		let num = MARKS[c];
		if (Number.isFinite(num)) {
			if (num >= num_real_lines) num = num_real_lines-1;
			scroll_to(num, {doRender: true});
		}
		else stat(`'${c}': Mark not set`);
}
else render();
	};
	stat("goto");
}//»

const open_fold = (lnsarg, opts={})=>{//«
	let {noInnerFolds, useOffset, offsetFoldEnd} = opts;
	let uselines;
	if (!lnsarg._par) uselines = lines;
	else uselines = lnsarg._par;
	let idx = uselines.indexOf(lnsarg._line);
if (idx < 0){//«
cwarn("!!!!!!!    DO NOT IGNORE THIS ERROR    !!!!!");
cwarn("!!!!!!!    STOP WHAT YOU ARE DOING     !!!!!");
cerr("_line property not found in the uselines array!!!");
log(lnsarg);
log(lnsarg._line);
log(uselines);
return;
}
//»
	let fold = uselines[idx]._fold;
	if (offsetFoldEnd){
		useOffset = true;
		fold._offset = fold.length-1;
	}
	for (let ln of fold){
		if (ln._fold) {
			if (noInnerFolds) {
				open_fold(ln._fold, opts);
			}
			else ln._fold._par = uselines;
		}
	}
	if (fold._offset){
		if (!useOffset) delete fold._offset;
		else {
			y+=fold._offset;
		}
	}
	if (fold._x_offset){
		if (!useOffset) delete fold._x_offset;
		else x = fold._x_offset;
	}

	uselines.splice(idx, 1, ...fold);
if (!uselines.length){
cerr("HOWWWWW CAN THERE BE NO USELINES.LENGTH????");
}
	delete uselines[idx]._fold;

	set_line_lens();

	let ln = fold[0];
	if (SYNTAX && !ln._multi && ln.length >= 2 && ln[0]==="/" && ln[1]==="*"){
		syntax_multiline_comments();
	}
}//»

const open_prev_line_if_folded = () => {//«
	let ln = curarr(-1);
	if (!ln._fold) return;
	let _ry = ry;
	open_fold(ln._fold);
	scroll_to(_ry);
};//»

const open_line_if_folded = (dy=0) => {//«
	let ln = curarr(dy);
	if (!ln._fold) return;
	let _ry = ry;
	open_fold(ln._fold);
	scroll_to(_ry);
};//»

const close_fold = (i, offset) =>{//«
const _close_fold = (lns, i, offset) =>{//«
	let depth = 1;
	let start_ln = lns[i];
	let real_start_ln = i;
	let fold_len;
	let inner_folds = [];
	let internal_fold_length = 0;
	let fold;
	for (let j=i+1; j < lns.length; j++){//«
		let real_ln = j;
		if (lns[j]._fold) {
			internal_fold_length += lns[j]._foldlen-1;
			inner_folds.push(lns[j]._fold);
			continue;
		}
		if (have_open_fold_marker(lns[j])) depth++;
		else if (have_end_fold_marker(lns[j])) depth--;
		if (depth==0){//«
			let n = j - i + 1;
			fold = [];
			fold._offset = offset;
			fold._x_offset = x;
			let add_n = 0;
			for (let k=0; k < n; k++){
				let ln = lns[k+i];
				if (ln._fold) {
					add_n += ln._foldlen-1;
				}
				fold.push(ln);
			}
			let lnstr = start_ln.join("").replace(/\xab/,"");
			lnstr = lnstr.replace(/^\/\x2f/,"");
			lnstr = lnstr.replace(/\/\x2f\s*$/,"");
			lnstr = lnstr.replace(/^\/\*/,"");
			lnstr = lnstr.replace(/\/\*\x2f\s*$/,"");
			let str = (`\xd7--${(n+add_n+"").padStart(3, " ")} lines: ${lnstr.regstr()}`);
			if (str.length < w) str = str.padEnd(w,"-");
			let lnarr = str.split("");
//SJUNMRUIO
			lns.splice(i, n, lnarr);
			lnarr._fold = fold;
			fold._line = lnarr;
			lnarr._foldlen = fold.length+internal_fold_length;
			fold._foldlen = lnarr._foldlen;
			for (let f of inner_folds) f._par = fold;
			break;
		}//»
	}//»
	return fold;
};//»
	_close_fold(lines, i, offset);
	y=i-scroll_num;
	x=0;
	if (y<0) {
		scroll_num+=y;
		y=0;
	}
	set_line_lens();
	render({},33);
}//»
const toggle_cur_fold = (opts={}) =>{//«
	if (!fold_mode) return;
	let _cy = cy();
	let lns = lines[cy()]._fold;
//log(lns);
	if (lns) {
//		open_fold(lns, {noInnerFolds: true});
		open_fold(lns, opts);
		render({},34);
		return;
	}
//	toggle_hold_y = y;
//	toggle_hold_x = x;

	if (have_open_fold_marker(lines[_cy])) return close_fold(_cy);
	let depth = 1;
	let start_i = _cy-1;
	for (let i=start_i; i>=0; i--) {
		if (lines[i]._fold) continue;
		else if (have_end_fold_marker(lines[i])) depth++;
		else if (have_open_fold_marker(lines[i])) depth--;
		if (depth==0){
			close_fold(i, start_i-i+1);
			return;
		}
	}

	if (curch() === RESERVED_FOLD_CHAR){
log(_cy);
log(lines);
cwarn(`Found RESERVED_FOLD_CHAR \\xd7 (${RESERVED_FOLD_CHAR}). Folds must need emergency repair mode!!!`);
	}

}//»

const make_indent_fold=()=>{//«
	let start=cy();
	let end;
	let ln = curarr(1);//let ln = curln(true,1);
	if (!ln) return;
	let use=ln[0];
	if (!(use=="\x20"||use=="\x09")) return;
	ln = curarr();//ln = curln(true);
	let ln0 = ln;
	let ln1;
	let indent=0;
	for(let i=0; i < ln.length; i++) {
		if(ln[i]!=use)break;
		indent++;
	}
	let len=lines.length;
	let k=0;
	LOOP: for (let i=start+1;i<len;i++){
		k++;
		if (k>100000) {
cerr("INFIN?");
			return;
		}
		let ln = lines[i];
		if (!ln.length) continue;
		for (let j=0; j < indent-1; j++){
			k++;
			if (k>100000) return;
			if (ln[j]!=use){
				return;
			}
		}
		if (ln[indent]!=use) {
			end=i;
			ln1 = ln;
			break;
		}
	}

	if (!(start && end && start < end)) return;
	ln0.push("/","/", OPEN_FOLD_CHAR);
	ln1.push("/","/", END_FOLD_CHAR);
	lines[start]=ln0;
	lines[end]=ln1;
	render({},26);

};//»
const get_folded_lines=(lns, arrarg, if_init)=>{//«
	let depth = 0;
	let max_depth=0;
	let start_i;
	let have_open=false;
	let ret = [];
	let hidden_fold_lines = 0;

	if (isArr(lns[0])){
		let newlns = [];
		for (let ln of lns){
			newlns.push(ln.join(""));
		}
		lns = newlns;
	}
	for (let i=0; i < lns.length; i++){
		let ln = lns[i];
/*
		if(if_init && !has_internal_tabs){
			if (ln.match(/^[^\t]\t+/)) {
				has_internal_tabs = true;
cwarn("INTERNAL TAB DETECTED ON LINE", i+1);
			}
		}
*/
		if (have_open_fold_marker(ln)) {//«
			if (depth==0) {
				start_i = i;
				have_open = true;
			}
			depth++;
			max_depth++;
		}//»
		else if (have_end_fold_marker(ln)) {//«
			if (depth>0) depth--;
		}//»

		if (have_open&&depth==0){//«
			let n = i - start_i + 1;
			let nstr = n+"";
			nstr = nstr.padStart(3, " ");
			have_open = false;
			let lnstr = lns[start_i].replace(/\xab/,"");
			lnstr = lnstr.replace(/^\/\x2f/,"");
			lnstr = lnstr.replace(/\/\x2f\s*$/,"");
			lnstr = lnstr.replace(/^\/\*/,"");
			lnstr = lnstr.replace(/\/\*\x2f\s*$/,"");

			let str = (`\xd7--${nstr} lines: ${lnstr.regstr()}`);
			if (str.length < w) str = str.padEnd(w,"-");
			let lnarr = str.split("");
			ret.push(lnarr);
			let arr = [];
			let str_arr = [];
			for (let j=0; j < n; j++) {
				let str_ln = lns[j+start_i];
				if (j > 0 && j < n-1) str_arr.push(str_ln);
				arr.push(str_ln.split(""));
			}
			lnarr._fold = arr;
			arr._line = lnarr;
			if (arrarg){
				arrarg.splice(start_i-hidden_fold_lines+1, n, lnarr);
				arr._par = arrarg;
			}
			arr._foldlen = arr.length;
			lnarr._foldlen = arr.length;
			hidden_fold_lines += arr.length-1;
			if (max_depth > 1) get_folded_lines(str_arr, arr);
		}//»
		else if (!have_open){//«
			let ln = lns[i];
			ret.push(ln.split(""));
		}//»
	}
	if (have_open){//«
		for (let i=start_i; i<lns.length; i++) {
			ret.push(lns[i].split(""));
		}
	}//»
	return ret;
}//»
const copy_fold_lines=(lns, all)=>{//«
	for (let ln of lns){
		if (ln._fold) all.push(...copy_fold_lines(ln._fold, []));
		else all.push(ln.slice());
	}
	return all;
};//»

//»
//Save/Devel«

let is_saving = false;

const test_js=()=>{//«
	let scr = document.createElement('script');
	if (stat_message_type) {
		stat(" ");
	}
	document.head.appendChild(scr);
	const onerror = (e)=>{
		stat_err(e);
	};
	setTimeout(()=>{
		scr._del();
		if (window.onerror===onerror) {
			delete window.onerror;
		}
	}, 500);
	window.onerror=onerror;
	let str = `()=>{\n${get_edit_str()}\n}`;;
	scr.src = URL.createObjectURL(new Blob([str]));
};//»
const send_command_to_reload_win=()=>{//«
	if (!reload_win){
		return;
	}
	if (!cur_background_command) cur_background_command = DEF_BACKGROUND_COMMAND;
cwarn("UNCOMMENT THE LINE BELOW WHEN Terminal.js IS UPDATED");
//	reload_win.app.autoTypeCommand(cur_background_command);

//When the above line is uncommented, delete everything below...
	let term_app = reload_win.app;
	if (term_app.sleeping || term_app.curShell){
cwarn(`Skipping: '${cur_background_command}'`);
		return;
	}
	for (let c of cur_background_command) term_app.handleLetterPress(c);
	term_app.handleEnter({noSave: true});
};//»
const toggle_reload_win=async()=>{//«
if (!use_devreload){
stat_warn("ondevreload was not enabled!");
return;
}
if (!topwin) return;
//SDHRYWOEL2
	if (reload_win){
		let ind = topwin.childWins.indexOf(reload_win);
		if (ind < 0){
cerr("The reload_win was not in topwin.childWins!?!?!");
		}
		else{
			topwin.childWins.splice(ind, 1);
		}
		delete reload_win.ownedBy;
		reload_win.close();
		reload_win = null;
		stat("'reload_win' deleted");
		return;
	}

	reload_win = await Desk.api.openApp("Terminal", {force: true});
	if (!reload_win){
		stat_err("Could not get the window");
		return;
	}

	reload_win.ownedBy = topwin;
	topwin.childWins.push(reload_win);
};//»
const reload_dev_win=async()=>{//«
	if (!reload_win) {
		stat_warn(`No "reload window" was found! (use Ctrl+Alt+r)`);
		return;
	}
	let devname = this.comOpts["dev-name"] || (edit_fobj && edit_fobj.baseName);
	if (!devname){
		stat_warn("No 'dev name' found!");
		return;
	}
	if (reload_script) reload_script._del();
	reload_script = document.createElement('script');
	reload_script.onload=()=>{
		let gotlib = LOTW.coms[`local.${devname}`];
		if (!gotlib){
			return stat_err(`LOTW.coms[local.${devname}]: not found!`);
		}
		let gotcoms = gotlib.coms;
		let com_env = reload_win.app.env.coms;
		let num = 0;
		for (let comname in gotcoms){
			let gotcom = gotcoms[comname];
			com_env[`dev.${devname}.${comname}`] = gotcom;
			num++;
		}
		stat_ok(`Loaded ${num} commands`);
	};
	reload_script.onerror=(e)=>{
cerr(e);
	};
	let str = `function(){"use strict";${get_edit_str()}}`;
	reload_script.src = URL.createObjectURL(new Blob([`(${str})()`]));
	document.head.appendChild(reload_script);
}//»
const ondevreload=()=>{//«
	return reload_dev_win();
};//»

const get_edit_lines = (opts={})=>{//«
	let {copy, str, from, to}=opts;
	let linesout=[];
	let uselines = hold_lines?hold_lines:lines;
	let s;
	if (!Number.isFinite(from)) from = 0;
	if (!Number.isFinite(to)) to = uselines.length;
	if (fold_mode){
		const do_fold = (_from, _to, _lns) => {
			for (let i = _from; i < _to; i++){
				let ln = _lns[i]
				let fold = ln._fold;
				if (fold){
					do_fold(0, fold.length, fold);
				}
				else {
					if (str) linesout.push(ln.join(""));
					else linesout.push(ln);
				}
			}
		};
		do_fold(from, to, uselines);
	}
	else if (str){
		for (let i=from; i < to; i++) linesout.push(uselines[i].join(""));
	}
	else if (!copy) {
		for (let i=from; i < to; i++) linesout.push(uselines[i]);
	}
	else{
		linesout = [];
		for (let i=from; i < to; i++) linesout.push(...uselines[i].slice());
	}
	return linesout;
}
this.get_lines = get_edit_lines;
//»
const get_edit_save_arr = () =>{//«
	let str = "";
	let uselines=get_edit_lines();
	for (let ln of uselines) {
		if (!ln) break;
		str += ln.join("")+"\n";
	}
	return [str.replace(/\n$/,""), uselines.length];
};
const get_edit_str = ()=>{return get_edit_save_arr()[0];};
//»
const try_revert = ()=>{//«
	if (!edit_fobj_hold) return;
	stat_message+=" (reverting)";
	edit_fobj = edit_fobj_hold;
	edit_fullpath = edit_fobj.fullpath;
	edit_ftype = edit_fobj.type;
	edit_fobj_hold = undefined;
}//»

const try_save = (if_saveas)=>{//«
	if (no_save_mode) return stat_warn("no_save_mode is on!");
	if (is_saving) {
		return stat_warn(`is_saving: ${is_saving}`);
	}
	is_saving = true;
	if (edit_fullpath&&!if_saveas) {
		return edit_save();
	}
	init_stat_input(SAVE_AS_MODE);
	render({}, 110);
};//»
const try_save_as=(opts={})=>{//«
	if (!edit_fullpath) return try_save();
	try_save(true);	
};//»
const edit_save = async(if_nostat, com_opts={})=>{//«
if (this.autoMode) return;
	let write_err = "";
	const write_cb_func = async(node)=>{//«
//	const write_cb_func = async(ret)=>{
		if (node) {
//We were doing a "save as" from another file, so we need to unlock it since we
//aren't using that file anymore
			if (edit_fobj_hold){
				edit_fobj_hold.unlockFile();
				edit_fobj_hold = null;
			}

//			let {node} = ret;
			if (!edit_fobj){
				edit_fobj = node;
				edit_fullpath = edit_fobj.fullpath;
				edit_ftype = edit_fobj.type;
				Term.curEditNode = edit_fobj;
				edit_fobj.lockFile();
			}
			if (Desk) Desk.make_icon_if_new(node);
			if (!if_nostat) {
				if (write_err) stat_message_type = STAT_ERR;
				stat_message = `${edit_fname} ${numlines+add_splice_lines}L, ${node.size}C written${write_err}`;
//				stat_message = `${edit_fname} ${numlines+add_splice_lines}L, ${ret.size}C written${write_err}`;
			}
			else{
log("Saved",node.size);
			}
			dirty_flag = false;
//			Term.is_dirty = false;
if (com_opts.doQuit){
quit();
}
		}
		else {
			stat_message = "The file could not be saved";
			try_revert();
		}
		render({},73);
		is_saving = false;
//		return !Term.is_dirty;
		return !dirty_flag;
	};//»
	let arr = get_edit_save_arr();
	if (detect_fold_error(arr)) {
		is_saving = false;
		return;
	}
	let val = arr[0];
	let numlines = arr[1];
	if (val && !val.match(/\n$/)) val = val + "\n";
	if (this.saveFunc){
/*
This is largely for applications that internally call vim in order to set a field
on an FSNode of type = IDB_DATA_TYPE. When this function exists, there should
*PROBABLY ALREADY BE* an FSNode with a particular full path in the filesystem.
Meaning that this should always be a simple "Save" call rather than any kind of
"Save As" call.
*/

		let rv = await this.saveFunc(val);
		stat_message = rv.mess;
		stat_message_type = rv.type||STAT_NONE;
		if (rv.type===STAT_OK){
			dirty_flag = false;
//			Term.is_dirty = false;
		}
		is_saving = false;
		render();
		return;
	}
//	let opts={retObj: true};
	let usepath = edit_fullpath;
	let OK_TYPES=[FS_TYPE, USERS_TYPE];
	if (!OK_TYPES.includes(edit_ftype)){
		if (usepath.match(/\/dev\/shm/)) {
		}
		else {
			stat_message = `Invalid file system type:  ${edit_ftype}`;
			try_revert();
			render({},80);
			is_saving = false;
			return;
		}
	}
	let rv;
	if (VALIDATE_JSON_ON_SAVE && usepath.match(/\.(json|app)$/i) && val.length < MAX_LEN_TO_VALIDATE_JSON){
		try{
			JSON.parse(val);
		}
		catch(e){
cerr(e);
			write_err = " (bad JSON)";
		}
	}
	let node;
	if (!edit_fobj) {//«
		node = await fsapi.writeFile(usepath, val);
/*«
		if (edit_ftype === USERS_TYPE){
			node = await fsapi.writeFile(usepath, val);
//			if (node) rv = {node, size: node.size};
		}
		else {
//			rv = await fsapi.saveFsByPath(usepath, val, opts);
			node = await fsapi.saveFsByPath(usepath, val);//IN BLOCK COMMENT
		}
*/
//log(rv);
/*
if (!(rv&&rv.node)){
stat_err("There was a problem writing the file (see console)");
cwarn("Here is the returned value from saveFsByPath");
log(rv);
return;
}
»*/
	}//»
	else {//«
		let par = edit_fobj.par;
//		if (par.type === FS_TYPE && !await fsapi.checkDirPerm(par)){
//		if (!await fsapi.checkDirPerm(par)){
		if (!par.okWrite){
			stat_err("Permission denied");
			return;
		}
//		rv = await edit_fobj.setValue(val, opts);
		if (await edit_fobj.setValue(val)){
			node = edit_fobj;
		}
/*«
if (!(rv&&rv.node)){
stat_err("There was a problem writing the file (see console)");
cwarn("Here is the returned value from node.setValue");
log(rv);
is_saving = false;
return;
}
»*/
	}//»
//	return write_cb_func(rv);
	return write_cb_func(node);
}
//»
const save_as = async (name)=>{//«

const err=s=>{//«
	stat_message = s;
	try_revert();
	stat_message_type = STAT_ERR;
	x = this.hold_x;
	render({},82);
};//»
const checkok = () =>{//«
	rtype = rootobj.type;
	if (!(rtype==FS_TYPE||rtype==SHM_TYPE||rtype==USERS_TYPE)) return `Cannot create file type: ${rootobj.type}`;
//	if (!fs.check_fs_dir_perm(parobj,is_root)) return `Permission denied: ${fname}`;
	if (!parobj.okWrite) return `Permission denied: ${fname}`;
	return true;
}; //» 
const save_ok = ifnew => {//«
	if (edit_fobj) {
		edit_fobj_hold = edit_fobj;
		edit_fobj = undefined;
	}
	edit_fullpath = path;
	edit_fname = fname;
	edit_ftype = rtype;
	edit_save();
};//»

if (!name.match(/^[-/a-z0-9_~.]+$/i)) {//«
	stat_message = "Invalid characters in the name (want /^[-/a-z0-9_~.]$/i)";
	try_revert();
	render({},83);
	return;
}//»
name = name.replace(/^~\x2f/, `${globals.user.home_path}/`);
let path = util.normPath(name, cur_dir);
let arr = path.split("/");
let fname = arr.pop();
let pardir = arr.join("/");
if (!pardir) pardir = "/";
if (!fname) return err("No file name given");
let parobj = await fsapi.pathToNode(pardir);
if (!parobj) return err(`${pardir}: directory not found`);
let rtype;
let rootobj;
rootobj = parobj.root;
let rv = checkok();
if (isStr(rv)) return err(rv);
//MDOPILKL
let gotkid = parobj.kids[fname];
if (!gotkid) {
	return save_ok(true);
}
if (gotkid.writeLocked()){
	stat_message = `${fname}: the file is write locked`;
	try_revert();
	stat_message_type = STAT_ERR;
	render();
	return;
}
stat_cb = ch=>{
	stat_cb = null;
	if (ch=="y"||ch=="Y") save_ok();
	else {
		stat_message = "Cancelled";
		try_revert();
		render({},84);
	}
}
stat_warn(`${fname}: file exists! Overwrite? [y/N]`);

}//»

//»
//Stat/Com«

const do_history_arrow=sym=>{//«
	let hist;
	let sim = stat_input_type;
	if (sim==":") hist = this.command_history;
	else if (sim=="?"||sim=="/") hist = this.search_history;
	if (!hist) return;
	if (sym=="UP_") hist_iter++;
	else hist_iter--;
	if (hist_iter<0) {
		hist_iter=0;
		return;
	}
	else if (hist_iter>hist.length){
		hist_iter = hist.length;
		return;
	}
	if (hist_iter==0){
		stat_com_arr=[];
		stat_x=0;
	}
	else{
		stat_com_arr = hist[hist_iter-1].split("");
		stat_x=stat_com_arr.length;
	}
}//»

const init_stat_input = which => {//«
	num_completion_tabs = 0;
	stat_com_arr=[];
	stat_x=0;
	stat_input_type = which;
	render({},67);
};//»

const get_cur_spaces = (which, x_is_max)=>{//«
	let ln = curarr();
	if (!ln.length || ln._fold) return {word: null};
	let ch = ln[x];
	if (ch!=which) return {word: null};
	let _x = x;
	let arr;
	if (x_is_max) arr=[];
	while (_x>=0){
		ch = ln[_x];
		if (ch!=which){
			_x++;
			break;
		}
		else{
			if (arr) arr.unshift(ch);
			if (_x===0) break;
		}
		_x--;
	}
	if (x_is_max) return {word: arr.join(""), x: _x};
	let start_x = _x;
	let len = ln.length-1;
	let spcs='';
	while (_x <= len){
		ch = ln[_x];
		if (ch != which) break;
		spcs+=ch;
		_x++;
	}
	return {word: spcs, x: start_x};
};//»
const get_cur_word = (x_is_max, if_stat)=>{//«
	let use_x;
	let ln;
	if (if_stat) {
		ln = stat_com_arr;
		use_x = stat_x;
	}
	else {
		ln = ln = lines[y+scroll_num];
		use_x = x;
	}
	if (!ln.length || ln._fold) return {word: null};
//log(ln);
//log(use_x);
	let ch = ln[use_x];
	if (!ch || !ch.match(/\w/)) return {word: null};
/*« QJEJRKTM
With this, am getting : TypeError: Cannot read properties of undefined 
(reading 'match'), because use_x == 5 && ln.length == 4.
The '#' character below is what causes this

i
y
c
w
3
ENTER_
x
q
]
z
ESC_
I
H
i
(
ENTER_
 
^
g
M
ESC_
?
i
^
2
ENTER_
[
A
;
Y
ESC_
r
G
a
z
ENTER_
H
4
b
=
ESC_
-
H
?
I
ENTER_
~
X
C
q
ESC_
;
Y
L
z
i
7
v
C
o
ESC_
Q
q
v
S
ENTER_
A
l
L
E
ESC_
#
l
e
y
ENTER_
X
A
F
p
ESC_
6
*
f
M
ENTER_
C
P
i
.
ESC_
/
$
i
\
ENTER_
+
`
:
I
»*/
//	if (!ch.match(/\w/)) return {word: null};
	let _x = use_x;
	let arr;
	if (x_is_max) arr=[];
	while (_x>=0){
		ch = ln[_x];
		if (!ch.match(/\w/)){
			_x++;
			break;
		}
		else{
			if (arr) arr.unshift(ch);
			if (_x===0) break;
		}
		_x--;
	}
	if (x_is_max) return {word: arr.join(""), x: _x};
	let start_x = _x;
	let len = ln.length-1;
	let wrd='';
	while (_x <= len){
		ch = ln[_x];
		if (!ch.match(/\w/)) break;
		wrd+=ch;
		_x++;
	}
	return {word: wrd, x: start_x};
};//»
const detect_fold_error=arrarg=>{//«
	let arr;
	if (!arrarg) arr = get_edit_save_arr();
	else arr = arrarg;
	let val = arr[0];
	let lnarr = val.split("\n");
	for (let i=0;i < lnarr.length; i++){
		let ln = lnarr[i];
		if (ln.match(/^\xd7--/)){
cerr("Fold error detected, line: ", i);
			stat_err(`Fold error detected, line: ${i+1}`);
			return true;
		}
	}
	return false;
};//»

const handle_tab_path_completion = async(if_ctrl, gotpath, stat_com_pref)=>{//«
	if (if_ctrl) num_completion_tabs = 0;
//	let gotpath;
//	gotpath = stat_com_arr.join("").trim();
	let usedir, usename;
	if(!num_completion_tabs) {//«
		if (gotpath.match(/^\//)){
			let arr = gotpath.split("/");
			usename = arr.pop();
			usedir = ("/"+arr.join("/")).regpath();
		}

		else if (gotpath.match(/^~\//)){
			let arr = gotpath.split("/");
			arr.shift();
			usename = arr.pop();
			usedir = (globals.user.home_path+arr.join("/")).regpath();
//			gotpath = gotpath.replace(/^~/, globals.home_path);
		}

		else if (gotpath.match(/\//)){
			let arr = gotpath.split("/");
			usename = arr.pop();
			usedir = cur_dir+"/"+arr.join("/");
		}
		else {
			usedir = cur_dir;
			usename = gotpath;
		}
		if (!usename)usename="";
		stat_com_x_hold = x;
		cur_completion_str = gotpath;
		cur_completion_name = usename;
		cur_completion_dir = usedir;
	}//»
	let rv = await Term.getDirContents(cur_completion_dir, cur_completion_name);
	if (!rv.length) return;
	rv.push([cur_completion_name]);
	if (!num_completion_tabs) {
		num_completion_tabs = 0;
	}

	let which = rv[num_completion_tabs%rv.length];
	let str = which[0].slice(cur_completion_name.length);
	let is_folder;
	if (which[1]=="Folder") {
		str=str+"/";
		is_folder = true;
	}
	stat_com_arr=(stat_com_pref+(cur_completion_str+str)).split("");
	stat_x=stat_com_arr.length;
	render({},81);

	if (is_folder&&rv.length==1) num_completion_tabs=0;
	else num_completion_tabs++;

};//»
const handle_edit_input_enter = async()=> {//«

	let inp_type = stat_input_type;
	stat_input_type = undefined;
	let com = stat_com_arr.join("").trim();

	if (inp_type==SAVE_AS_MODE) save_as(com);
	else if (inp_type==FILE_OPEN_MODE) init_file_mode(com);
	else if (inp_type==":") {//«
		if (!com) return render({},86)
		this.command_history.unshift(com);
		let marr;
//SPOLUITJ
if (marr = com.match(/^(%)?s(b)?\/(.*)$/)){//«
	if (mode===VIS_LINE_MODE && marr[1]){
		stat_err("'%': Invalid range modifier in visual line mode");
		return;
	}
	search_and_replace(marr[3], {file: marr[1], exact: marr[2]});
	return;
}//»
		if (com.match(/^\d+$/)) {
			if (!last_updown) {
				scroll_hold_x = x;
			}
			last_updown = true;
			let n = parseInt(com)-1;
			if (n < 0) return render();
			scroll_to(n, {doRender: true});
			return;
		}
		else if (marr = com.match(/^x +(.*)$/)){
			cur_background_command = marr[1];
//			Term.executeBackgroundCommand(cur_background_command);
//			render();
stat_ok("Saved to cur_background_command");
			return;
		}
		else if (marr = com.match(/^tab +(.*)$/)){
			let num = marr[1];
			if (Term.setTabSize(num)) return stat_ok(`Tab size is set to: ${num}`);
			stat_err("Error: invalid tab size");
			return;
		}
		else if (mode===VIS_LINE_MODE){
//			stat_err("Invalid command in visual line mode");
			stat_err("Unknown command: " + com);
			return;
		};
		if (com=="q"||com=="quit") maybe_quit();
		else if (com=="q!"||com=="quit!") quit();
		else if (marr = com.match(/^w(rite)?( +(.+))?$/)){
			let fname = marr[3];
			if (!fname){
				if (edit_fullpath) return edit_save();
				stat_err("No file name given");
				return;
			}
			save_as(fname);
			return;
		}
		else if (com=="wq"){
			if (!edit_fullpath){
				stat_err("No file name");
				return;
			}
			edit_save(false, {doQuit: true});
			return;
		}
		else if (marr = com.match(/^set( +(.+))?$/)){//«
			if (!marr[2]) return stat("Nothing to set!");
			let arr = marr[2].split(/ +/);
			let assignment = arr.shift();
			if (!assignment) return stat("Nothing to set!");
			let setarr = assignment.split("=");
			let which = setarr[0];
			let arg = setarr[1];
			if (which=="wraplen"){
				if (!arg) return stat("No arg given!");
				let num = arg.ppi();
				if (!num) return stat_err(`Invalid arg to 'wraplen': ${arg}`);
				WRAP_LENGTH = num;
				stat_ok(`OK: wraplen=${arg}`);
			}
			else if (which=="no_ctrl_n"){
				if (arg=="1"||arg=="true") NO_CTRL_N=true;
				else if (arg=="0"||arg=="false") NO_CTRL_N=false;
				else return stat_warn("Invalid argument to 'no_ctrl_n'");
				stat_ok(`OK: no_ctrl_n=${NO_CTRL_N}`);
			}
		}//»
		else if (com==="stdin"){
			if (!stdin_lines) stat_warn("No lines received from stdin");
			else init_file_mode("*stdin*",{isStdin: true});
		}
		else stat_err("Unknown command: " + com);
	}//»
	else if (inp_type=="|"){//«
		let got = com.ppi();
		if (isNaN(got)){
			render();
			return;
		}
//		let n = parseInt(com)-1;
		let n=got-1;
		let ln = curarr();//let ln = curln(true);
		if (ln._fold){
stat_warn("Please unfold the line!");
return;
		}
		let len = ln.length;
		if (n<0) n=0;
		else if (n > len) n = len;//else if (n > curln(true).length) n = curln(true).length;
		x=n;
		if (is_vis_mode()) set_sel_mark();
		render();
	}//»
	else if (inp_type=="/"||inp_type=="?"){//«
		if (!com) return render();
		let exact = false;
		let marr;
		if (marr = com.match(/^<(.+)>$/)){
			com = marr[1];
			exact = true;
		}
		this.search_history.unshift(com);
		find_word(com,{reverse: inp_type=="?", exact});
	}//»
	else{
		stat_warn("Handle enter for input type: " + inp_type);
	}

};//»

//»
//Modes«

//Visual Selection«

const init_auto_visual_line_mode=()=>{//«
	if (!is_normal_mode()) return;
	mode = VIS_LINE_MODE;

	edit_sel_start = seltop = selbot = cy();
	for (let _y = cy(); _y >= 0; _y--){
//log("_y", _y);
		let ln = lines[_y];
		if (ln._fold) continue;

		if (ln.join("").match(/^[\s\t]*$/)){
//			if (isNaN(seltop)) edit_sel_start = seltop = _y;
			break;
		}
		edit_sel_start = seltop = _y;
//log("TOP", seltop);
	}
	for (let _y = cy(1); _y < lines.length; _y++){
		let ln = lines[_y];
		if (ln._fold) continue;
		if (ln.join("").match(/^[\s\t]*$/)){
//			if (isNaN(selbot)) selbot = _y;
			break;
		}
		selbot = _y;
	}
	x=0;
	scroll_to(realy(seltop), {noSetSel: true});
	render();
}//»
const init_visual_line_mode=()=>{//«
	if (!is_normal_mode()) return;
	mode = VIS_LINE_MODE;
	edit_sel_start=seltop=selbot=cy();
	render({},96);
};//»
const init_visual_marker_mode = () =>{//«
	if (!is_normal_mode()) return;
	if (fold_mode){
		if (have_fold()) return stat_warn("Fold detected. Not starting visual marker mode.");
	}
	mode = VIS_MARK_MODE;
	cur_pos = mark_pos = {x, y: cy()};
	edit_sel_start=seltop=selbot=cy();
	edit_sel_mark=selleft=selright=x;
	render();
};//»
const init_visual_block_mode=()=>{//«
	if (!is_normal_mode()) return;
	if (have_fold()) return stat_warn("Fold detected. Not starting visual mode.");
	mode=VIS_BLOCK_MODE;
	edit_sel_start=seltop=selbot=cy();
	edit_sel_mark=selleft=selright=x;
	render({},101);
};//»

//»
//Cut Buffer«

let cur_cut_buffer;
const init_cut_buffer_mode=()=>{//«
	if (!cut_buffers.length) return stat_warn("No cut buffers!");
	cur_cut_buffer = 0;
	stat_cb=(k)=>{
		if (UPDOWN_FUNCS[k]) return UPDOWN_FUNCS[k]();
		if (k=="ENTER_"){
			yank_buffer = cut_buffers[cur_cut_buffer];
			cut_buffers.splice(cur_cut_buffer, 1);
			cut_buffers.unshift(yank_buffer);
			alt_screen_escape_handler();
			return;
		}
		if (k=="LEFT_"){
			if (cur_cut_buffer == 0) return;
			cur_cut_buffer--;
		}
		else if (k=="LEFT_A"){
			if (cur_cut_buffer == 0) return;
			cur_cut_buffer=0;
		}
		else if (k=="RIGHT_"){
			if (cur_cut_buffer == cut_buffers.length-1) return;
			cur_cut_buffer++;
		}
		else if (k=="RIGHT_A"){
			if (cur_cut_buffer == cut_buffers.length-1) return;
			cur_cut_buffer=cut_buffers.length-1;
		}
		else if (k=="d"){
			cut_buffers.splice(cur_cut_buffer, 1);
			if (!cut_buffers.length) return alt_screen_escape_handler();
			if (cur_cut_buffer == cut_buffers.length) cur_cut_buffer--;
		}
		y=scroll_num=0;
		lines = cut_buffers[cur_cut_buffer];
// WEUTJOEJ: FIXED!!!
		num_real_lines = lines.length;
		render();
	};

	let hx=x,hy=y,hscr=scroll_num,hry=ry;
	let hnumlns = num_real_lines;
	x=y=scroll_num=ry=0;
	let hold_fold = fold_mode;
	fold_mode = false;
/*No need to set the global 'lines' variable since we are not (currently) using any
functions outside of this scope.
*/
	hold_lines = lines;
	lines = cut_buffers[0];
	num_real_lines = lines.length;
//	Term.setLines(lines, []);
	alt_screen_escape_handler = no_render => {//«
		stat_cb = null;
		alt_screen_escape_handler = null;
		x=hx;
		y=hy;
		ry = hry;
		scroll_num = hscr;
//		set_ry();
		fold_mode = hold_fold;
		lines = hold_lines;
		num_real_lines = hnumlns;
//		num_real_lines = lines.length;
		hold_lines = null;
//		Term.setLines(lines, line_colors);
		mode = COMMAND_MODE;
		if (!no_render) render();
	};//»
	mode = CUT_BUFFER_MODE;
	render();
};//»

//»
//Symbols/Complete«

const get_all_words=(not_this_word)=>{//«
	let lns = get_edit_save_arr()[0].split("\n");
	let all=[];
	for (let ln of lns){
		let arr = ln.split(/\W+/);
		all.push(...arr);
	}
	if (not_this_word){
		let ind1 = all.indexOf(not_this_word);
//DJKUYTKM
		if (ind1 > -1 && (ind1 === all.lastIndexOf(not_this_word))){
			all.splice(ind1, 1);
		}
	}
	ALLWORDS = all.sort().uniq().filter((word)=>word.length>=MIN_COMPLETE_WORD_LEN&&word[0].match(/^[^0-9]/));
}//»
const update_symbols = () => {//«
	let uselines;
	let sym = symbol;
	if (!sym){
		uselines = SYMBOLS;
	}
	else {
//		let re = new RegExp("^"+sym);
		let re = new RegExp(sym);
		uselines = SYMBOLS.filter(w=>{return re.test(w);});
	}
	lines = [];
	for (let ln of uselines){
		lines.push([...ln]);
	}
	if (!lines.length) lines=[[]];
	y=scroll_num=0;
	set_ry();
//	Term.setLines(lines, []);
	num_real_lines = lines.length;
	render();
};//»
const handle_symbol_ch=ch=>{//«
	if (!ch.match(/\w/)) {
		unused_keydowns.push(keydown_iter);
		return;
	}
	symbol+=ch;
	update_symbols();
	render();
};//»
const handle_symbol_keydown=(sym)=>{//«
	if (sym.match(/^._/)) return;
	if (sym==="ENTER_"){
		return enter_cb();
	}
	if (sym=="BACK_"){
		let sym = symbol;
		let len = sym.length
		if (!len) return;
		if (symbol_len && len===symbol_len) return;
		sym=sym.slice(0, len-1);
		symbol = sym;
		update_symbols();
		render();
	}
};//»

let cur_refs;

const init_symbol_mode = (opts={})=>{//«
//SMKJFHSO
//cwarn("SYMBOL");
	let ln = curarr();//let ln = curln(true);
	if (ln._fold) {
		stat_warn("Fold detected");
		return;
	}
	symbol = "";

	if (opts.ref){//«
		if (!this.comOpts.refs) return stat_warn("Must use the --refs option!");
		cur_refs = globals.refs[this.comOpts.refs];
		if (!cur_refs) stat_err(`${this.comOpts.refs}: not found in globals.refs!?!?`);
		SYMBOLS = Object.keys(cur_refs).sort();
		mode = REF_MODE;
	}//»
	else{//«
		get_all_words();
		mode = SYMBOL_MODE;
		if (symbols){
			SYMBOLS = ALLWORDS.concat(symbols).sort();
		}
		else{
			SYMBOLS = ALLWORDS;
		}
	}//»

	hold_lines = lines;
	let hold_colors = line_colors;
	let hx=x,hy=y,hscr=scroll_num;
	let hry = ry;
	if (ln.length && opts.adv) x++;
	x=y=scroll_num=0;
	ry = 0;
	let hold_fold = fold_mode;
	fold_mode = false;
	lines = [];
	for (let w of SYMBOLS){
		if (w.length) lines.push([...w]);
	}
	if (!lines.length) lines=[[]];
//	Term.setLines(lines, []);
//XKLORPT
	num_real_lines = lines.length;
	enter_cb = () => {//«
		if (mode===SYMBOL_MODE) {//«
//WNKRLKGL
			let ln;
			if (lines[y+scroll_num]){
				ln = lines[y+scroll_num].join("").split(/\s+/)[0];
			}

			enter_cb = null;
			alt_screen_escape_handler(true);
			if (ln&&ln.length) {
// ZJMGKHD
//				print_chars(ln,{ins: opts.adv});
// WHAT IS GOING ON HERE?????
/*
If we are at x=0, with nothing on the lines, then we MUST insert.
*/
let must_insert = x==0 && !curarr().length;
				print_chars(ln,{ins:must_insert || !opts.adv});
//				print_chars(ln,{ins:!opts.adv});
//				adjust_cursor();
			}
			render();
		}//»
		else if (mode===REF_MODE){//«
//SNDHDJG
			let nm;
			if (lines[y+scroll_num]){
				nm = lines[y+scroll_num].join("").split(/\s+/)[0];
			}
			enter_cb = null;
			alt_screen_escape_handler(true);
			let got = cur_refs[nm];
			if (!got){
				return stat_warn(`${nm}: no ref found`);
			}
			let arr = (got+"").split("\n");
			let out = [];
			for (let ln of arr){
				ln = ln.replace(/\xab/g,"").replace(/\xbb/g,"");
				ln = ln.replace(/\/\/ *$/,"");
				out.push(ln);
			}
			do_paste((`${nm} = `+out.join("\n")), {before: opts.before});
			stat(`Using ref: '${nm}'`);
		}//»
	};//»
	alt_screen_escape_handler = no_render => {//«
		alt_screen_escape_handler = null;
		x=hx;
		y=hy;
		ry = hry;
		scroll_num = hscr;
		fold_mode = hold_fold;
		lines = hold_lines;
		hold_lines = null;
		line_colors = hold_colors;
//		Term.setLines(lines, line_colors);
//		set_ry();
//MDKIUTHS
		set_line_lens();
		mode = COMMAND_MODE;
//log(x, curarr().length);
//log(x, curarr().length);
		if (!no_render) render();
	};//»
	render();

}//»
const init_complete_mode=async(opts={})=>{//«
	const try_print=(val)=>{//«
		let rem = val.slice(wrd.length);
		if (rem) {
			if (opts.stat) {
				stat_com_arr.splice(stat_x, 0, ...rem);
				stat_x += rem.length;
			}
			else print_chars(rem);
		}
		render();
	};//»
/*
What is the current word?
*/
//cwarn("COMPLETE");
//ASJDIRNR
if (mode===REPLACE_MODE) return;
	let use_x;
	if (opts.stat)use_x = stat_x;
	else use_x = x;
	if (use_x===0) return;
	if (opts.stat) stat_x--;
	else x--;
	let rv = get_cur_word(true, opts.stat);
	if (opts.stat) stat_x++;
	else x++;
	let wrd = rv.word;
	if (!wrd) return;
//WOLMFGHJ
	get_all_words(wrd);

//	if (!ALLWORDS) get_all_words();
	let re = new RegExp("^"+wrd);
	let usewords;
	if (ALLWORDSYMBOLS) usewords = ALLWORDSYMBOLS;
	else usewords = ALLWORDS;
	let matches = usewords.filter(w=>{return re.test(w);});
	if (!matches.length) {
		return stat("No matches");
	}
	if (matches.length===1) {
		try_print(matches[0]);
		return;
	}
	SYMBOLS = matches.slice();
	let hold_fold = fold_mode;
	hold_lines = lines;
	let hold_colors = line_colors;
	let hx=x,hy=y,hscr=scroll_num;
	let sit_hold = stat_input_type;
	let stat_x_hold = stat_x;
	let mode_hold = mode;
//	mode_hold = mode;
	mode = COMPLETE_MODE;
	stat_input_type = undefined;
	x=y=scroll_num=0;
	fold_mode = false;
	symbol = wrd;
	symbol_len = wrd.length;
	lines = [];
	for (let w of matches){
		if (w.length) lines.push([...w]);
	}
	if (!lines.length) lines=[[]];
//	Term.setLines(lines, []);
	num_real_lines = lines.length;
	enter_cb = () => {//«
let ln;
//XBCJFLERN
if (lines[y+scroll_num]){
	ln = lines[y+scroll_num].join("").split(/\s+/)[0];
}
		enter_cb = null;
		alt_screen_escape_handler(true);
		if (ln&&ln.length) try_print(ln)
	};//»
	alt_screen_escape_handler = no_render => {//«
		stat_input_type = sit_hold;
		stat_x = stat_x_hold;
		alt_screen_escape_handler = null;
		symbol_len = undefined;
		x=hx;
		y=hy;
		fold_mode = hold_fold;
		scroll_num = hscr;
		lines = hold_lines;
		hold_lines = null;
		line_colors = hold_colors;
//		Term.setLines(lines, line_colors);
//		set_ry();
		set_line_lens();
		mode = mode_hold;
		if (!no_render) render();
	};//»
	render();
};//»

//»
//File yank«

const init_file_mode = async(fname, opts={}) => {//«

let arr;
if (opts.isStdin){
	arr = stdin_lines;
}
else {
//log("FNAME");
	let str = await fname.toText({cwd:Term.env.cwd.cwd});
	if (!isStr(str)) return render();
	arr = str.split(/\r?\n/);
}

hold_lines = lines;
let hold_colors = line_colors;
let hx=x,hy=y,hscr=scroll_num;
x=y=scroll_num=0;

alt_screen_escape_handler = no_render => {//«
	x=hx;
	y=hy;
	scroll_num = hscr;
	lines = hold_lines;
	hold_lines = null;
	line_colors = hold_colors;
	set_line_lens();
	mode = COMMAND_MODE;
	if (!no_render) render();
};//»

if (fold_mode) lines = get_folded_lines(arr);
else {
	lines = [];
	for(let ln of arr) lines.push(ln.split(""));
	if (!lines.length) lines=[[]];
}
//Term.setLines(lines, []);
set_line_lens();
mode = FILE_MODE;
render();

};//»
const handle_file_ch=ch=>{//«
//log("FILE CH", ch);
//cwarn("?????", ch);
	handle_file_keydown(ch);
};//»
const handle_file_keydown=(sym)=>{//«

const init_line_mode = () => {//«
	mode_hold = FILE_MODE;
	mode = VIS_LINE_MODE;
	edit_sel_start=seltop=selbot=cy();
	render({},96);
};//»
const init_marker_mode = () => {//«
	if (fold_mode){
		if (have_fold()) return stat_warn("Fold detected. Not starting visual mode.");
	}
	mode_hold = FILE_MODE;
	mode = VIS_MARK_MODE;
	cur_pos = mark_pos = {x, y: cy()};
	edit_sel_start=seltop=selbot=cy();
	edit_sel_mark=selleft=selright=x;
	render();
};//»
const init_block_mode = () => {//«
	if (have_fold()) return stat_warn("Fold detected. Not starting visual mode.");
	mode_hold = FILE_MODE;
//	mode_hold = mode_hold;
	mode=VIS_BLOCK_MODE;
	edit_sel_start=seltop=selbot=cy();
	edit_sel_mark=selleft=selright=x;
	render({},101);
};//»

	if (sym==="RIGHT_") right();
	else if (sym==="LEFT_") left();
	else if (sym==="ENTER_") toggle_cur_fold();
	else if (sym==="v_C") init_block_mode();
//	else if (sym==="v_") init_marker_mode();
	else if (sym==="v") init_marker_mode();
//	else if (sym==="v_S") init_line_mode();
	else if (sym==="V") init_line_mode();
	else unused_keydowns.push(keydown_iter);

};//»

//»
//Line wrap«

let line_wrap_y;
let num_line_wrap_actions;
const init_line_wrap_mode=()=>{//«
	let ln = curarr();
	if (ln._fold){
		return stat_warn("Please unfold first!");
	}
//WHRKRYTKY
	if (is_edit_mode() && x > 0 && x == ln.length) x--;
	ln = ln.join("");
	if (ln.match(/\xac/)) return stat_warn(`metacharacter detected (\xac)`);
	line_wrap_y = ry;
	let hold_fold = fold_mode;
	fold_mode = false;
	hold_lines = lines;
	if (!ln.length){lines=[[]];}
	else {
		lines = [];
		ln = ln.replace(/\t/g,"\xac").split("");
		while (ln.length) {
			lines.push([...ln.splice(0,w)]);
		}
	}

	let hx=x,hy=y,hscr=scroll_num;
	let _cy = hy+hscr;
	scroll_num = 0;
	y = Math.floor(hx/w);
	x = hx%w;
	num_real_lines = lines.length;
	num_line_wrap_actions = 0;
	alt_screen_escape_handler = async if_enter => {//«
		if (if_enter) {
			let ln = lines.flat().join("");
			ln = ln.replace(/\xac/g,"\t");
			hold_lines[_cy] = ln.split("");
			x = line_wrap_x();
		}
		else {
			for (let i=0; i < num_line_wrap_actions; i++) actions.pop();
			x = hx;
		}
		alt_screen_escape_handler = null;
		y=hy;
		scroll_num = hscr;
		fold_mode = hold_fold;
		lines = hold_lines;
		hold_lines = null;
		set_line_lens();
		mode = COMMAND_MODE;
		render();
	};//»
	mode = LINE_WRAP_MODE;
	render();
};//»
const handle_linewrap_key=(sym)=>{//«

if (sym=="ENTER_"){
	alt_screen_escape_handler(true);
	return;
}
//TSKJLDLJS
if (sym==="\x20_C"){//«
	if (cy()==lines.length-1){
		let ln = curarr();
		if (x==ln.length-1){
			if (curch()==" ") return;
			if (x===w-1){
				lines.push([" "]);
				x=0;
				down();
			}
			else {
				ln.push(" ");
				x++;
			}
			render();
		}
//		actions.push(new Action(line_wrap_x(), line_wrap_y, " ", Date.now(), {adv: true}));
		actions.push(new Action(line_wrap_x(), line_wrap_y, " ", act_iter++, {adv: true}));
		num_line_wrap_actions++;
	}
	return;
}//»
let origsym = sym;
if (sym=="TAB_") {
	sym="\xac";
	origsym = "\t";//TWKITUIYP
}
if (sym.length==1){//«
	let ln = curarr();
	ln.splice(x, 0, sym);
//	actions.push(new Action(line_wrap_x(), line_wrap_y, origsym, Date.now(), {adv: true}));
	actions.push(new Action(line_wrap_x(), line_wrap_y, origsym, act_iter++, {adv: true}));
	num_line_wrap_actions++;
	if (ln.length > w){
		let ch = ln.pop();
		let iter=0;
		while (ch){
			if (cy(iter)===lines.length-1){
				lines.push([]);
			}
			iter++;
			ln = curarr(iter);
			ln.unshift(ch);
			if (ln.length > w) ch = ln.pop();
			else ch = null;
		}
	}
	x++;
	if (x===w) {
		x=0;
		down();
	}
	else if (x===ln.length) x--;
	render();
	return;
}//»
if (sym=="BACK_"){//«
	if (x==0) {
		if (cy()==0) return;
		up();
		x=w-1;
	}
	else x--;
}//»
else if (sym=="DEL_"){}
else{
	unused_keydowns.push(keydown_iter);
	cerr(`WHAT SYM IN LINEWRAP MODE: ${sym}`);
	return;
}

let ln = curarr();
let have_ch = ln.splice(x, 1)[0];
let add1;
let adv;
if (sym=="BACK_"){
	adv=true;
	add1=1;
}
else{
	adv=false;
	add1=0;
}
//actions.push(new Action(line_wrap_x()+add1, line_wrap_y, have_ch, Date.now(), { adv, neg: true} ));
actions.push(new Action(line_wrap_x()+add1, line_wrap_y, have_ch, act_iter++, { adv, neg: true} ));
num_line_wrap_actions++;

let _cy = cy();
//EUSJFKG

if (_cy===lines.length-1){//«
	if (x === ln.length){
		if (x>0) x--;
		else if (_cy > 0){
			up();
			lines.pop();
			x = curlen()-1;
			if (x<0) x=0;
		}
	}
}//»
else if (ln.length === w-1){//«
	for (let i=1; ln = lines[_cy+i]; i++) {
		let ch = ln[0];
		if (ch) {
			ln.splice(0,1);
			lines[_cy+i-1].push(ch);
			if (!ln.length) {
// HOW COULD THIS CASE MEAN WE NEED TO DO ANYTHING OTHER THAN POPPING
				lines.pop(); //lines.splice(i+1, 1);// NOOOOOOO!!!!!!!!!
			}
			if (!lines.length) lines = [[]];
		}
	}
}//»

render();

};
//»

//»

//»
//Move/Scroll«

const cur_to = (yarg) => {//«
	y=yarg;
	while (!lines[y+scroll_num]) y--;
	if (y < 0) y = 0;
	x=0;
	set_ry();
	render();
};//»

const check_del_fold_offset=()=>{//«
	let ln = curarr();
	if (ln._fold) {
		delete ln._fold._offset;
		delete ln._fold._x_offset;
	}
};//»
const check_visual_up = () =>{//«
	if (((mode===VIS_BLOCK_MODE || mode === VIS_MARK_MODE)) && fold_mode && cy() > 0){
		if (have_fold(-1)) return stat_warn("Fold detected");
	}
	return true;
};//»
const check_visual_motion=if_down=>{//«
//	if ((visual_mode||visual_block_mode) && fold_mode && ((if_down && cy() < lines.length-1)||(!if_down && cy()>0))){
	if ((mode===VIS_BLOCK_MODE || mode === VIS_MARK_MODE) && fold_mode && ((if_down && cy() < lines.length-1)||(!if_down && cy()>0))){
		let add_1;
		if (if_down) add_1=1;
		else add_1 = -1;
		if (have_fold(add_1)) return stat_warn("Fold detected");
	}
	return true;
};//»

const seek_line_start=()=>{//«
	toggle_if_folded();
	x = 0;
	set_sel_end();
}//»
const seek_line_end = ()=>{//«
	toggle_if_folded();
	x = curlen();
	if (mode!==INSERT_MODE && x > 0) {
		x--;
	}
	set_sel_end();
}//»
const seek_prev_word=()=>{//«
	toggle_if_folded({offsetFoldEnd: true});
	let addi=0;
	for (let i=0;;i--) {
		let ch1 = curch(i-2);
		let ch2 = curch(i-1);
		if (!ch1){
			if (ch2&&ch2.match(/\w/)){
				if (mode !== LINE_WRAP_MODE) break;
			}
		}
		else if (!ch2) {
			break;
		}
		if (ch1&&ch1.match(/\s|\W/)&&ch2.match(/\w/)) break;
		addi++;
		if (x-addi <= 0) {
			break;
		}
	}
	x-=addi+1;
	if (x<0) {
		if (cy() > 0) {
			up();
			toggle_if_folded({offsetFoldEnd: true});
			x = curarr().length;
			seek_prev_word(true);
			return;
		}
		x=0;
	}
	set_sel_mark();
	render({},51);
};//»
const seek_next_word = (if_from_continue) => {//«
	const try_next=()=>{//«
		if (cy() < lines.length-1) {
			down();
			seek_next_word(true);
		}
		else{
			x--;
			if (x<0) x=0;
			render();
		}
	};//»
	toggle_if_folded();
	if (!curarr()) return THROW("NO CURARR HERE!!!");
	if (!curch()) {
		try_next();
		return;
	}
	let addi=0;
	for (let i=1;;i++) {
		let ch1 = curch(i-1);
		if (ch1&&if_from_continue && ch1.match(/\w/)) {
			if (mode !== LINE_WRAP_MODE) {
				addi--;
				break;
			}
		}
		let ch2 = curch(i);
		if (!ch2) break;
		if (ch1&&ch1.match(/\s|\W/)&&ch2.match(/\w/)) break;
		addi++;
	}
	x+=addi+1;
	if (x==curarr().length) return try_next();
	set_sel_mark();
	render({},53);
}//»
const seek_end_word = () => {//«
	const do_seek_end = (if_from_continue)=>{//«
		const try_next=()=>{//«
							//log("NEXT");
			if (cy() < lines.length-1) {
				down();
				x=0;
				do_seek_end(true);
			}
			else{
				x--;
				if (x<0) x=0;
				render();
			}
		};//»
		toggle_if_folded();
		let ch1 = curch();
		if (!ch1) {
			try_next();
			return;
		}
		let ch2 = curch(1);
		if (!ch2) {
			try_next();
			return;
		}
		if (ch1.match(/\w/) && ch2 && ch2.match(/\W/)) x++;
		let addi=0;
		for (let i=0;;i++) {
			let ch1 = curch(i);
			if (ch1&&if_from_continue && ch1.match(/\W/)) {
				if (mode !== LINE_WRAP_MODE) {
					addi--;
					break;
				}
			}
			let ch2 = curch(i+1);
			if (!ch2) {
				break;
			}
			if (ch1&&ch1.match(/\w/)&&ch2.match(/\W/)) break;
			addi++;
		}
		x+=addi;
		if (x < 0) x = 0;
		if (x==curarr().length) return try_next();
		set_sel_mark();
		render({},53);
	}//»
	let arr = curarr();
	let ch = arr[x];
	let ch2 = arr[x+1];
	//In the middle of a word
	if (ch && ch2 && ch.match(/\w/) && ch2.match(/\w/)) {
		do_seek_end();
		return 
	}
	//Not in middle, find the start of the next word
	seek_next_word();
	arr = curarr();
	ch = arr[x];
	ch2 = arr[x+1];
	//This is a 1 character word: either at the end of a line or not
	if (ch && (!ch2 || (ch2 && ch.match(/\w/) && ch2.match(/\W/)))) {
		return;
	}
	//At the beginning of a multi-character word
	do_seek_end();
}//»
const seek_prev_end_word = () => {//«

	const at_end = () => {
		let arr = curarr();
		let ch1 = arr[x];
		let ch2 = arr[x+1];
		if (ch1 && ch1.match(/\w/) && (!ch2 || ch2.match(/\W/))) return true;
		return false;
	};
	const in_mid = () => {
		let arr = curarr();
		let ch0 = arr[x-1];
		let ch1 = arr[x];
		let ch2 = arr[x+1];
		if (ch0 && ch0.match(/\w/) && ch1 && ch1.match(/\w/)) return true;
		return false;
	};

	if (in_mid()){
		seek_prev_word();
	}
	seek_prev_word();
	if (at_end()) {
		return;
	}
	seek_end_word();

};//»

const maybe_scroll = () =>{//«
    if (maybe_scrdown_one()){
        while (maybe_scrdown_one()){}
        return;
    }
    while (maybe_scrup_one()){}
};//»
const maybe_scrup_one = () => {//«
    if (!scroll_num || y >= 0) return false;
    scroll_num--;
    y++;
    return true;
};//»
const maybe_scrdown_one = () => {//«
    if (y < Term.h-num_stat_lines) return false;
    scroll_num++;
    y--;
    return true;
};//»

const scroll_up = (n, opts={} )=>{//«
	let {moveCur, noRender, noSetSel}=opts;
	if (scroll_num - n < 0) return;
	let new_scroll = scroll_num - n;
	scroll_to(realy(new_scroll + y));
	if (!noSetSel) set_sel_end();
	if (!noRender) render();
	return true;
};//»
const scroll_down = (n, opts={}) => {//«
	let {moveCur}=opts;
	scroll_num += n;
//log("DOWN IN", y, scroll_num);
	if (moveCur) {
		y-=n;
		if (y < 0) y=0;
	}
	while (!lines[scroll_num] && scroll_num > 0) scroll_num--;
	while (!lines[y+scroll_num] && y > 0) y--;
//log("DOWN OUT", y, scroll_num);
if (y + scroll_num < 0){
return THROW("SCRDOWN < 0???");
}
//	adjust_cursor();
	set_sel_end();
	set_ry();
	render({},60);
};//»

const scroll_to = (num, opts={})=>{//«
//openFoldHits means that we should open up folds that we have scrolled to
const check_ry=()=>{//«
	let llen= lines.length;
	let _cy = y+scroll_num;
	if (_cy < llen) {//«
		set_ry();
		if (ry===num){
		}
		else{
render();
return THROW(`ry(${ry+1}) !== num(${num+1})`);
		}
	}//»
	else if (_cy === llen) {//«
		if (fileChomp) {
			lines.push([]);
			set_line_lens();
			if (ry !== num){
render();
return THROW(`ry(${ry+1}) !== num(${num+1})`);
			}
		}
		else{//«
/*
log("UNDOS");
log(undos);
log("ACTIONS");
log(actions);
log("CUR_UNDO");
log(cur_undo);
*/
render();

return THROW(`!!! cy (${_cy}) === lines.length (${llen}) (no fileChomp) !!!`);
		}//»
	}//»
	else{//«
render();
return THROW(`!!! cy (${_cy}) > lines.length (${llen}) !!!`);
	}//»
}//»
	no_render = true;
	let { openFoldHits, allowInnerFolds , doRender, fileChomp } = opts;
	let llen = lines.length;
	let end_ry = num_real_lines - 1; // let end_ry = realy(llen-1);
	if (fileChomp) {
		if (num == end_ry + 1){
//HDPSKDN
			scroll_to(num-1);
			nobreak_enter({fromNewline: true, noAct: true});
			return;
		}
		else if (num == end_ry){}
else{
//cwarn(`GOT fileChomp, BUT EXPECTED num(${num}) === end_ry(${end_ry}) [ + 1 ] !!!`);
}
	}
	if (num > end_ry) num = end_ry;

	let nlines = Term.h - num_stat_lines;
	let lines_to_bot = scroll_num + nlines - 1;
	let diff = lines_to_bot - llen;
	if (diff > 0) lines_to_bot -= diff+1;
	let realtop = realy(scroll_num);

// First we need to check to see if the line is on the current screen.
// If so, we just want to set the y value without scrolling
// If the number we are looking for is before the bottom and after the top
	let realbot = realy(lines_to_bot);
	if (num >= realtop && num <= realbot) {//«
		for (let i=0; i < nlines; i++){
			let n = realy(scroll_num+i);
			if (n===undefined) break;
			if (n < num) continue;//Keep going
			else if (n > num) break;
			let ln = lines[scroll_num+i];
			y=i;
			set_ry();
			check_ry();
//log(i, ry, !!ln._fold, openFoldHits);
			if (ln._fold && openFoldHits) {
				open_fold(ln._fold, {noInnerFolds: !allowInnerFolds});
			}
			check_ry();
			no_render = false;
			if (doRender) render();
			return;
		}
	}//»
	let scrh = scroll_num;
	scroll_num = 0;
	let add = 0;
	let yh = y;
	for (y=0; y < lines.length; y++){//«
		if (y+add==num){
			y = num-add;
			if (lines[y]._fold && openFoldHits) {
				open_fold(lines[y]._fold);
			}
			break;
		}
		let fold = lines[y]._fold;
		if (!fold) continue;
		let len = lines[y]._foldlen;
		if (y+add+len>num){
			open_fold(fold, {noInnerFolds: !allowInnerFolds});
			continue;
		}
		add+=len-1;
	}//»
/*
In the special case where we start with no scroll_num, and the line
we are jumping to doesn't require scrolling to fit on the screen...
*/
	if (scrh === 0 && y <= nlines - 1) {
	}
	else {
		scroll_num = y;
		y=0;
		if (!opts.noSetSel) set_sel_end();
	}
//	adjust_cursor();
	check_ry();//This caused a THROW 
	no_render = false;
	if (doRender) render();

};//»

const do_home=()=>{//«
	y = scroll_num = 0;
//	adjust_cursor();
	set_sel_end();
	set_ry();
	render({},55);
};//»
const home=()=>{//«
	if (warn_if_fold_visual()) return;
	do_home();
}//»

const do_end=()=>{//«
//	scroll_num = lines.length-1;
//	y=0;
//	adjust_cursor();
//	set_sel_end();
//	set_ry();

	scroll_to(num_real_lines - 1);
	render({},56);
};//»
const end=()=>{//«
	if (warn_if_fold_visual()) return;
	do_end();
}//»

const do_pgup=()=>{//«
	if (scroll_num == 0) {
		if (y > 0) {
//CDKLOPOE
//VERY VERY TRICKY BUG HERE WHEN Y WAS SET AND RETURNING WITHOUT CALLING SET_RY()!!!!!
			y = 0;
			set_ry();//<---!!!!!!!!!!!!!!!!!!! THIS WASN'T HERE BEFORE !!!!!!!!!!!!!!!

//			adjust_cursor();
			set_sel_end();
			render({},57);
		}
		return;
	}
	if (scroll_num - h > 0) {
		scroll_num -= h;
	}
	else scroll_num = 0;

	if (y + scroll_num < 0){
		y=0;
		scroll_num = 0;
	}
//	adjust_cursor();
	set_sel_end();
	set_ry();
	render({},58);
};//»
const pgup=()=>{//«
	if (warn_if_fold_visual()) return;

	do_pgup();
}//»

const do_pgdn=()=>{scroll_down(scr_h());};
const pgdn=()=>{//«
	if (warn_if_fold_visual()) return;
	do_pgdn();
}//»

const up_one_line=(if_seek_end)=>{//«
	let _y = cy();
	let ln = lines[_y-1];
	if (!ln) {
		if (y>0) return true;
		return false;
	}
	let usex = scroll_hold_x;
	if (if_seek_end) x = ln.length;
	else if (usex >= ln.length) {
		if (mode===INSERT_MODE) x = ln.length;
		else if (ln.length) {
			x = ln.length-1;
		}
		else x=0;
	}

	else x = usex;
	if (x==-1) x=0;
	return true;
}//»
const up = () => {//«
	if (y > 0) {
		if (!up_one_line()) return;
		y--;
		if (check_if_folded()) x=0;
		set_sel_end();
	}
	else if (scroll_num > 0) {
		if (!up_one_line()) return;
		
		scroll_num--;
		if (check_if_folded()) x=0;
		set_sel_end();
	}
	set_ry();
	render({},61);
}//»

const do_down = ()=>{//«
	let ln = lines[y + scroll_num + 1];
	if (y+num_stat_lines < h-1) y++;
	else scroll_num++;
	let usex = scroll_hold_x;
	if (check_if_folded()) x=0;
	else if (usex >= ln.length) {
		if (mode===INSERT_MODE) x = ln.length;
		else if (ln.length) x = ln.length-1;
		else x=0;
	}
	else x = usex;
	set_sel_end();
	set_ry();
	render({},63);
};//»
const down = ()=>{//«
	if (!(y + scroll_num < lines.length-1)) return;
	do_down();
}//»

const left = () => {//«
	if (x > 0) {
		x--;
	}
	else if (cy() > 0){
		if (mode === LINE_WRAP_MODE){
			up();
			x = curarr().length-1;
		}
	}
	set_sel_mark();
	render({},52);
}//»

const right = ()=>{//«
	toggle_if_folded();
	if (mode===INSERT_MODE){
		if (curch(1)||curch()) {
			x++;
			render({},54);
		}
	}
	else if (!curch(1)) {
		if (mode === LINE_WRAP_MODE){
			if (cy() < lines.length-1) {
				down();
				x=0;
				render();
			}
		}
		return;
	}
	else {
		x++;
		set_sel_mark();
	}
	render({},54);

}//»

//»
//Search/Replace«

let cur_search;
//let escape_regex_metachars = true;
let escape_regex_metachars = false;

const toggle_regex_escape_mode=()=>{//«
	escape_regex_metachars = !escape_regex_metachars;
	Term.doOverlay(`RegEx escape mode: ${escape_regex_metachars?"on":"off"}`);
}//»
const escape_metachars = word => {//«
//							 /   [   ]   (   )   {   }   |
	return word.replace(/([?*+.\x2f\x5b\x5d\x28\x29\x7b\x7d\x7c])/g, "\\$1");
};//»
const resume_search=(if_rev)=>{//«
	if (cur_search) {
		if (if_rev===true) cur_search.reverse = true;
		else if (if_rev===false) cur_search.reverse = false;
		find_word(cur_search.word, {exact: cur_search.exact, reverse: cur_search.reverse});
	}
};//»

const try_word_match=(ln, word, if_exact, xoff, reverse)=>{//«
//cwarn(reverse);
	let lnstr;
	if (isStr(ln)) lnstr = ln;
	else lnstr = ln.join("");
if (reverse) {
	lnstr = lnstr.slice(0, xoff-1).split("").reverse().join("");
	word = word.split("").reverse().join("");
}
else {
	lnstr = lnstr.slice(xoff);
}
	if (!lnstr) return;
	if (escape_regex_metachars) word = escape_metachars(word);
	let rv; 
try {
	if (if_exact) rv = (new RegExp("\\b"+word+"\\b")).exec(lnstr);
	else rv = (new RegExp(word)).exec(lnstr);
}
catch(e){
//cwarn("CAUGHT!");
//log(e.message);
stat_err(`${e.message}`);
return null;
}
	if (!rv) return null;
	if (reverse){
		return {index: xoff - rv.index - word.length - 1};
	}
	return {index: xoff + rv.index};
};//»
const find_word_in_fold_lines=(lns, wrd, if_exact, xoff, if_rev, stack, iter)=>{//«
	let start_i;
	let to = lns.length;
	let inc;
	if (if_rev){
		start_i = lns.length-1;
		inc = -1;
	}
	else{
		start_i = 0;
		inc = 1;
	}
	let itr = 0;
	for (let i=start_i; itr < to; i+=inc, itr++){
		let ln = lns[i];
		if (if_rev) xoff = ln.length+1;
		else xoff = 0;
		if (ln._fold) {
			let rv = find_word_in_fold_lines(ln._fold, wrd, if_exact, xoff, if_rev, stack, iter);
			if (rv) {
				iter.i+=i;
				stack.push(ln._fold);
				return rv;
			}
		}
		let rv = try_word_match(ln, wrd, if_exact, xoff, if_rev);
		if (rv) {
			iter.i+=i;
			return rv;
		}
	}
}//»
const find_word = (word, opts={})=>{//«
	if (!word) return render();
	let {exact, reverse, noAdv, endY} = opts;
	if (!(exact || escape_regex_metachars)){
		try{
			(new RegExp(word));
		}
		catch(e){
			stat_err(`Invalid regex: ${word}`);
			return;
		}
	}

// YEKTGJEM
// WHEN DO WE CLEAR THIS OUT???
	cur_search = {word, exact, reverse, noAdv, endY};

	let hold_scroll = scroll_num;
//	y = y + scroll_num;
	if (!noAdv) x++;
	scroll_num = 0;
	let start_ry = ry;
	let end_ry = endY;
	let iter=0;
	let is_first = true;
	let did_wrap = false;
	let got_match = false;
	while (true) {//«
		iter++;
		if (iter >= 100000){
/*WPLKMBGH
    at find_word (vim.js?v=2017610:4373:7)
    at resume_search (vim.js?v=2017610:4276:3)
    at Object.n (vim.js?v=2017610:7543:9)
*/
throw new Error("INFLOOP WUT WUT HARHARHAR");
		}
		let ln = lines[y];
if (!ln){
return THROW(`NO LINE IN FIND_WORD LOOP (y=${y})`);
}
		if (ln._fold){//«
			let stack = [ln._fold];
			let iter={i:0};
//			let rv = find_word_in_fold_lines(ln._fold, word, exact, is_first?x:0, reverse, stack, iter);
			let rv = find_word_in_fold_lines(ln._fold, word, exact, x, reverse, stack, iter);
			if (rv){
				got_match = true;
				for (let f of stack) open_fold(f);
				x = rv.index;
				y+=iter.i;
				set_ry();
				break;
			}
			is_first = false;
		}//»
		else {//«
//WMJYUI
			let rv = try_word_match(ln, word, exact, x, reverse);
			if (rv){
				got_match = true;
				x = rv.index;
				break;
			}
			is_first = false;
		}//»
		if (reverse){
			y--;
			if (y<0) {
				y=lines.length-1;
				did_wrap = true;
			}
			x = curarr().length+1;
		}
		else {
			y++;
			if (y===lines.length) {
				y=0;
				did_wrap = true;
			}
			x = 0;
		}
		set_ry();
		if (ry===start_ry){
			break;
		}
		else if (Number.isFinite(end_ry) && ry === end_ry){
			break;
		}
	}//»
	scroll_num = hold_scroll;
	scroll_to(ry);
	set_line_lens();
	let mess;
	if (exact) mess=`<${word}>`
	else if (!escape_regex_metachars) mess=`/${word}/`;
	else mess=`"${word}"`
	if (!got_match) mess = `${mess} (no matches)`;
	else if (did_wrap) mess = `${mess} (wrapped)`;
	let len = curarr().length;
	if (x > 0 && len > 0 && x >= len){
		x = len - 1;
	}
	if (is_vis_mode()) set_sel_end();
	stat(mess);

}//»

const goto_matching_brace=()=>{//«

let lnarr = curarr();
if (lnarr._fold) return;
const OK_CHARS=["{","}","(",")","[","]"];
let ch = curch();
if (!ch) return;
let ind = OK_CHARS.indexOf(ch);
if (ind < 0) return;
let match;
let is_forward;
if (!(ind%2)) {
	match = OK_CHARS[ind+1];
	is_forward = true;
}
else {
	match = OK_CHARS[ind-1];
}
let lnslen = lines.length;
let stack_num = 0;
let ok_y, ok_x;
let start_y = scroll_num+y;
if (is_forward) {//«

let use_y; 
let use_x;

let addy=0;
if (x+1 === lnarr.length){
	use_x=-1;
	addy=1;
}
else{
	use_x = x;
}
OUTERLOOP1: for(let i=y+scroll_num+addy; i < lnslen; i++){
	let ln = lines[i];
	if (ln._fold) {
		continue;
	}
	let lnlen = ln.length;
	let j;
	if (i===y+scroll_num+addy){
		j = use_x+1;
	}
	else j = 0;
	for (; j < lnlen; j++){
		let c = ln[j];
		if (c === match){
			if (stack_num) {
				stack_num--;
			}
			else {
				ok_y = i;
				ok_x = j;
				break OUTERLOOP1;
			}
		}
		else if (c===ch) {
			stack_num++;
		}
	}
}
}//»
else{//«

let use_y; 
let use_x;
if (x === 0){
	let iter=1;
	let startx;
	for (let i=y+scroll_num-iter; i >= 0; iter++, i--){
		let ar = curarr(-iter);
		if (!ar._fold && ar.length){
			startx = curarr(-iter).length - 1;
			use_y = y+scroll_num-iter;
			use_x = startx;
			break;
		}
	}
}
else{
	use_y = y+scroll_num;
	use_x = x-1;
}

OUTERLOOP2: for(let i=use_y; i >= 0; i--){
	let ln = lines[i];
	if (ln._fold) continue;
	let lnlen = ln.length;
	let j;
	if (i===use_y) j = use_x;
	else j = ln.length-1;
		for (; j >=0 ; j--){
			let c = ln[j];
			if (c === match){
				if (stack_num) stack_num--;
				else {
					ok_y = i;
					ok_x = j;
					break OUTERLOOP2;
				}
			}
			else if (c===ch) stack_num++;
		}
	}
}//»
if (Number.isFinite(ok_x)){
	if (start_y!==ok_y) {
		scroll_to(realy(ok_y));
	}
	x=ok_x;
	render();
}
else{
stat_warn(`matching '${match}' not found`);
}
};//»

const get_confirmation = (lno, ind, len, out)=>{//«
	return new Promise((Y,N)=>{
		stat_cb = (ch)=>{
			stat_cb = null;
			if (ch=="q") return Y(null);
			else if (ch=="n") return Y(false);
			else if (ch=="y") Y(true);
		};
//		visual_block_mode = true;
		mode=VIS_BLOCK_MODE;
		edit_sel_start=seltop=selbot=lno;
//		x=selleft;
		selleft=ind;
		selright=ind+len-1;
		stat_message = "replace with '"+out+"' (y/n/q)?";
//		render({noCursor:true}, 68);
		render();
//		visual_block_mode = false;
		mode=COMMAND_MODE;
	});
};//»
const search_and_replace = async(arr, opts={})=>{//«

//Var«

	let if_entire_file = opts.file;
	let if_exact_word = opts.exact;

// Using a single time means that for confirming replacements, we are
// using the time that this function was called rather than the time
// that the confirmation was done.

//	let time = Date.now();
let time = act_iter++;
	let do_num_lines;
	let x_mark = 0;
	let perm_x_mark = 0;
	let last_slice_to;
	let hold_slice_to;
	let slice_to;
//	let mode = mode;
	let num_replaced = 0;

//»

	//Parse the regex string and compile it with new RegExp«

	let pat=[];
	let sub=[];
	let multiline_sub = false;
	let num_extra_lines = 0;
	let mods=[];
	let ch, ch1;
	let fail = false;
	let have_sub = false;
	let have_pat = false;
	let ok_mods=["c","g","i"];
	for (let i=0; i<arr.length; i++){//«
		ch = arr[i];
		ch1 = arr[i+1];
		if (ch=="\\"){//«
			if (!ch1){
				fail = true;
				break;
			}
			if (!have_sub) pat.push({esc:ch1});
			else {
				sub.push({esc:ch1});
			}
			i++;
		}//»
		else if (ch=="/"){//«
			if (!have_sub) have_sub = true;
			else if (!have_pat) have_pat = true;
			else {
				fail = true;
				break;
			}
		}//»
		else if (!have_sub) pat.push(ch);
		else if (!have_pat) {
			sub.push(ch);
		}
		else {//«
			if (!ok_mods.includes(ch)){
				fail = true;
				break;
			}
			mods.push(ch);
		}//»
	}//»
	if (!(have_sub&&have_pat)) fail = true;
	if (fail) {
		set_ry();
		return stat_err("Invalid pattern");
	}
	let modstr="";
	let is_global;
	let is_confirming;	
	if (mods.includes("c")) is_confirming = true;
	if (mods.includes("g")) {
		is_global = true;
	}
	if (mods.includes("i")) modstr+="i";
	let pat_str="";
	let delete_newline;
	for (let i=0; i < pat.length; i++){//«
		let c = pat[i];
		if (c.esc) {
			if (c.esc == "n"){
				if (i != pat.length - 1){
					return stat_warn("Not currently supporting non-EOL newline matching");
				}
				delete_newline = true;
				pat_str += "$";
			}
			else {
				pat_str+="\\"+c.esc;
			}
		}
//		if (c.esc) pat_str+=c.esc;
		else pat_str+=c;
	}//»
	if (if_exact_word) pat_str = `\\b${pat_str}\\b`;
	let sub_str="";
	let say_sub;
	if (is_confirming) say_sub = "";
	for (let c of sub){//«
		if (c.esc) {
			let e = c.esc;
			if (is_confirming) say_sub += `\\${e}`;
			if (e == "t"){
				sub_str+="\t";
			}
//RSJGPSK
			else if (e == "r"){
				if (USE_NEWLINE_REPLACE) {
					sub_str += "\n";
				}
				else sub_str += "\\r";
				num_extra_lines++;
				multiline_sub = true;
			}
			else sub_str+=e;
		}
		else {
			sub_str+=c;
			if (is_confirming) say_sub += c;
		}
	}//»

	if (escape_regex_metachars) pat_str = escape_metachars(pat_str);
	let re;
	try {
		re = new RegExp(pat_str, modstr);
log(`PAT <${pat_str}>`)
log(re);
log(`SUB <${modstr}>`);
	}
	catch(e){
cerr(e);
		set_ry();
		stat_err(e.message);
		return;
	}//»

/*Prepare for the replace loop by setting x/y/width values,«
scrolling to the target line, and opening the necessary folds.
*/
	if (is_vis_mode()){//«
/*

All slice_to's must be adjusted according to the difference between the
match and sub_str lengths.

*/
		if (mode===VIS_BLOCK_MODE){
if (delete_newline){
return stat_warn("No newline deletions w/ markers!");
}
			x_mark = perm_x_mark = selleft;
			slice_to = selright+1;
			hold_slice_to = slice_to;
		}
		else if (mode===VIS_MARK_MODE){
if (delete_newline){
return stat_warn("No newline deletions w/ markers!");
}
			let [x1, y1, x2, y2] = get_marker_coords();
			x_mark = x1;
//EUTHFMG
			last_slice_to = x2+1;
		}
		open_all_sel_folds();
		do_num_lines = selbot - seltop + 1;
		scroll_to(realy(seltop));
	}//»
	else {//«
		if (if_entire_file){
			open_all_folds();
			scroll_num = 0;
			y = 0;
			ry = 0;
			do_num_lines = lines.length;
		}
		else{
			let ln = curarr();
			if (ln._fold) open_fold(ln._fold);
			scroll_num = cy();
			y=0;
			set_ry();
			do_num_lines = 1;
		}
	}//»
//»

	for (let i=0; i < do_num_lines; i++){//«
		let lnarr = lines[y+scroll_num];
		let lnstr = lnarr.join("");
		let is_last_line = i+1===do_num_lines;
		let marr;
		if (is_last_line && last_slice_to) slice_to = last_slice_to;
		if (slice_to) lnstr = lnstr.slice(x_mark, slice_to);
		else lnstr = lnstr.slice(x_mark);
		if (!(marr = re.exec(lnstr))) {//No match!«
			if (i+1 == do_num_lines) break;
			scroll_to(ry+1);
			x_mark = perm_x_mark;
			if (hold_slice_to) slice_to = hold_slice_to;
			continue;
		}//»
		let match_idx = marr.index;
		let match_x = match_idx+x_mark;
		let match_len = marr[0].length;

		if (is_confirming){//«
			x = match_x;
			render();
			let rv = await get_confirmation(y+scroll_num, match_x, match_len, say_sub);
			if (rv === true){}
			else if (rv === null) break;
			else if (rv === false){//«
				if (is_global){//«
					x_mark+=match_idx+match_len;
					i--;
					continue;
				}//»
				x_mark = perm_x_mark;
				if (i+1 == do_num_lines) break;
				scroll_to(ry+1);
				if (hold_slice_to) slice_to = hold_slice_to;
				continue;
			}//»
			else{//«
log(rv);
return THROW("What is the return value from get_confirmation?");
			}//»

		}//»

		let buf = lnarr.splice(match_x, match_len);
		num_replaced++;
		actions.push(new Action(match_x, ry, [buf], time, {neg: true, ins: true}));

//ZMKLOPIJH
let use_sub_str;
if (USE_NEWLINE_REPLACE && num_extra_lines){//«

let lns = sub_str.split("\n");
let iter=0;
let len_min1 = lns.length-1;
for (let ln of lns){

	use_sub_str = ln;
	if (ln.length) {
		if (iter==0) {
//			x = x_mark;
			x = match_x;
			print_chars(ln, {ins: true, time});
//			print_chars(ln);
		}
		else {
			x = 0;
			print_chars(ln, {ins: true, time});
		}
	}
	if (iter<len_min1){
		x = match_x + ln.length;
//		do_enter();
		do_enter({time});
		lnarr = lines[y+scroll_num];

x = 0;
match_x = 0;
match_idx = 0;
x_mark = 0;

	}
	iter++;
}

/*«

First splice lns[0] into the current line like below, so
that 'sub_str' becomes 'lns[0]', then do_enter(), and
do_num_lines++;

For the last line (lns[lns.length-1]), do not call do_enter().
This line might have zero length:

s/hi/hi\r/

in which case we skip the insertion (lnarr.splice()) step, due
to a zero length string.

But what about the issues (below) with is_global?

There, we are adjusting the x-location within the initial line
that we were searching, which is now broken into parts.
So it seems that every time we do_enter, we can just reset
x_mark, slice_to and in the case of VIS_MARK_MODE, last_slice_to,
which is set @EUTHFMG.

For VIS_BLOCK_MODE, we have: 
- slice_to: selright + 1
- hold_slice_to: slice_to
- x_mark: selleft
- perm_x_mark: by default, this is 0, but for this mode, it is set
to selleft. When starting on another line, x_mark gets reset to
this value.

So then in doing global replace with newlines in VIS_BLOCK_MODE, 
x_mark must get set to 0, when continuing the search on the same 
(now split apart) "line". When we finally get onto another line, 
x_mark must get set back to perm_x_mark.

»*/

}//»
else {
	use_sub_str = sub_str;
	lnarr.splice(match_x, 0, ...sub_str);
	actions.push(new Action(match_x, ry, [[...sub_str]], time, {ins: true}));
}

if (delete_newline && !at_file_end()) {//«
	down();
	x=0;
	do_backspace({time});
/*

If this is happening in a multi-line selection, we need to redo this
same line for as many lines there are in the selection. We shouldn't
be doing the scroll_to(ry+1) at the end of this loop;
Also, we know that 'is_global' issues never apply to newline deletion, 
since there obviously can only be 1 newline per line.

But then, what about the x_mark, perm_x_mark, slice_to and 
hold_slice_to issues?

*/
	continue;
}//»

		if (is_global){//«
			let diff = use_sub_str.length - match_len;
			if (is_last_line && last_slice_to) last_slice_to += diff;
			else if (slice_to) slice_to += diff;
			x_mark+=match_idx+use_sub_str.length;
			i--;
			continue;
		}//»
		x_mark = perm_x_mark;

		if (hold_slice_to) slice_to = hold_slice_to;
		if (i+1 == do_num_lines) break;

		scroll_to(ry+1);
	}//»

	mode=COMMAND_MODE;
	set_ry();
	stat(`Replaced: ${num_replaced}`);

};//»

//»
//Undo/Redo«

const redo_end = (tm)=>{//«
if (killed) return;
//	stat_message = `Redo change from: ${timestr(tm)}`;
	real_line_colors=[];
	set_ry();
	if (x>0 && x===curarr().length) x--;
	render();
	do_syntax_timeout();
	return true;
};//»
const undo_end = (tm)=>{//«
//	stat_message = `Undo change from: ${timestr(tm)}`;
if (killed) return;
	set_ry();
	real_line_colors=[];
	if (x>0 && x===curarr().length) {
		x--;
	}
	render();
	do_syntax_timeout();
}//»

const do_redo = (chg) => {//«
	let ch = chg.ch;
	let len = ch.length;
	let {isViz, neg, ins, adv, isBlock, opts, keepFirst, fileChomp} = chg.opts;
	if (chg.y!==ry) scroll_to(chg.y, {openFoldHits: true});
	else open_line_if_folded();

	if (isViz) open_folds_in_line_range(chg.ch.length);
	
	x = chg.x;
	if (isStr(ch)) {
		if (ch=="\n"){//«
			if (neg){
				x=0;
				y++;
				set_ry();
				do_backspace({noAct: true});
			}
			else {
				do_enter({noAct: true});
			}
		}//»
		else{//«
			if (neg){
				if (len > 1) {
					curarr().splice(x, len);//if (len > 1) curln(true).splice(x, len);
				}
				else {
					if (adv) x--;
					del_ch({noAct: true});
				}
			}
			else{
				if (len > 1) curarr().splice(x, 0, ...ch);//if (len > 1) curln(true).splice(x, 0, ...ch);
				else {
					print_ch(ch, {noAct: true});
					if (adv) x++;
				}
			}
		}//»
	}
	else{
		if (neg) {//«
			if (ins){//«
//IKLMDGTY
				let _y = cy();
				let to = len-1;

				if (!to){
					lines[_y].splice(x, ch[0].length);
				}
				else {
					let tolen = ch[to].length;
					let rem=[];		
					for (let i=0; i <= to; i++){
						let ln = lines[_y+i];
						if (i==0){
							ln.splice(x, ln.length-x);
						}
						else if (i===to){
							let rem = lines.splice(_y+i, 1)[0].slice(tolen);
							lines[_y+i-1]=lines[_y+i-1].concat(rem);
							if (!lines.length) lines = [[]];
						}
						else{
							lines.splice(_y+i, 1);
							if (!lines.length) lines = [[]];
							i--;
							to--;
						}
					}
				}
			}//»
			else if (isBlock){//«
				let _y = cy();
				let to = len-1;
				for (let i=0; i <= to; i++){
					let ln = lines[_y+i];
					ln.splice(x, ch[i].length);
				}
			}//»
			else if (keepFirst){
//log("r1");
				lines[y+scroll_num] = [];
				if (len > 1) {
					lines.splice(y+scroll_num+1, len-1);
					if (!lines.length) lines = [[]];
				}
			}
			else {
//log("r2", y+scroll_num, len);
				lines.splice(y+scroll_num, len);
				if (!lines.length) lines = [[]];
				if (y+scroll_num === lines.length){
					y--;
				}
			}
		}//»
		else{//«
			if (isBlock){//«
//Redoing a block insert can have side effects that undoing a block delete cannot
				let {pads, newlines} = chg.opts;
				let _y = cy();
				let to = len-1;
				for (let i=0; i < newlines; i++) lines.push([]);
				for (let i=0; i <= to; i++){
					let ln = curarr();//let ln = curln(true);
					let npads = pads[i];
					for (let j=0; j < npads; j++) ln.push(" ");
					ln.splice(x, 0, ...ch[i]);
					y++;
				}
				y--;
			}//»
			else if (ins){//«
				let _y = cy();
				let to = len-1;
				if (!to){
					lines[_y].splice(x, 0, ...ch[0]);
				}
				else {
					let rem=[];		
					for (let i=0; i <= to; i++){
						let ln = lines[_y];
						if (i==0){
							rem = ln.splice(x, ln.length-x);
							ln.splice(x, 0, ...ch[0]);
						}
						else if (i==to){
							let arr = ch[to].concat(rem);
							lines.splice(_y, 0, [...arr]);
						}
						else{
							let arr = ch[i];
							lines.splice(_y, 0, [...arr]);
						}
						_y++;
					}
				}
			}//»
			else{//«
				let add1 = 0;
				if (fileChomp) add1 = 1;
				let arr;
				if (fold_mode) arr = get_folded_lines(ch);
				else arr = dup(ch);
//				lines.splice(y+scroll_num, keepFirst ? 1 : 0, ...arr);
				lines.splice(y+scroll_num+add1, keepFirst ? 1 : 0, ...arr);
				if (!lines.length) lines = [[]];
			}//»
	
	}//»
		set_line_lens();
	}
}//»
const do_undo = (chg)=>{//«

	let {neg, ins, adv, isBlock, opts, keepFirst, fileChomp, data, isViz, prependSpace} = chg.opts;

/* How we can be on a line that needs to be opened in order to undo it,
but nowhere here are we opening it in that situation.
c_A i o_A ENTER_ l_A ENTER_ ENTER_ u V \x20 l_C i
*/

	if (chg.y!==ry) scroll_to(chg.y, {openFoldHits: true});
	else open_line_if_folded();

	if (isViz) {
		open_folds_in_line_range(chg.ch.length);
	}

	let ch = chg.ch;
	let len = ch.length;
	let act;
	x = chg.x;
	if (isStr(ch)) {
		if (ch=="\n"){//«
			if (neg) {
//XMGHGOR
				do_enter({noAct: true, data});
			}
			else {
//log("HIHI");
//				x=0;
//				open_prev_line_if_folded();
//				do_backspace({noAct: true});
//do_del_enter({noAct: true});
//log(12345);
//				del_ch({noAct: true});

				if (curfold()) open_line_if_folded();
				else open_line_if_folded(1);

				down();
				x=0;
				do_backspace({noAct: true});
			}
		}//»
		else {//«
			if (neg){
				if (len > 1) curarr().splice(x, 0, ...ch);//if (len > 1) curln(true).splice(x, 0, ...ch);
				else {
					if (adv) x--;
					print_ch(ch, {noAct: true});
					if (adv) x++;
				}
			}
			else{
				if (len > 1) curarr().splice(x, len);//if (len > 1) curln(true).splice(x, len);
				else {
					del_ch({noAct: true});
//					del_ch({noAct: true, prependSpace});
				}
			}
		}//»
	}
	else{
		if (neg) {//«
			if (isBlock){//«
				let _y = cy();
				let to = ch.length-1;
				for (let i=0; i <= to; i++){
					let ln = lines[_y+i];
//RYBFJFI
//WAS THIS UNDEFINED SOMEHOW???
					ln.splice(x, 0, ...ch[i]);
				}
			}//»
			else if (ins){//«
				let _y = cy();
				let to = ch.length-1;
				let rem=[];		
				if (!to){
					lines[_y].splice(x, 0, ...ch[0]);
				}
				else {
					for (let i=0; i <= to; i++){
						let ln = lines[_y];
						if (i==0){
							rem = ln.splice(x, ln.length-x);
							ln.splice(x, 0, ...ch[0]);
						}
						else if (i===to){
							_y++;
							let arr = ch[to].concat(rem);
							lines.splice(_y, 0, [...arr]);
						}
						else{
							_y++;
							let arr = ch[i];
							lines.splice(_y, 0, [...arr]);
						}
					}
				}
			}//»
			else{//«
//NFBFUTKD
//log("u1");
				let add1;
				if (fileChomp) add1 = 1;
				else add1 = 0;
				let arr;
				if (fold_mode) arr = get_folded_lines(ch);
				else arr = dup(ch);
//				lines.splice(y+scroll_num, keepFirst ? 1 : 0, ...arr);
				lines.splice(y+scroll_num+add1, keepFirst?1:0, ...arr);
				if (!lines.length) lines = [[]];
			}//»
		}//»
		else{//«
			if (isBlock){//«
				let {pads} = chg.opts;
				let _y = cy();
				let to = ch.length;
				for (let i=0; i < to; i++){
					let ln = curarr();//let ln = curln(true);
					let npads = pads[i];
					ln.splice(x, ch[i].length);
					if (npads) ln.splice(x-npads, npads);
					y++;
				}
				y--;
			}//»
			else if (ins){//«
				let _y = cy();
				let to = ch.length-1;
				let rem=[];		
				if (!to){
					lines[_y].splice(x, ch[0].length);
				}
				else {
					for (let i=0; i <= to; i++){
						let ln = lines[_y];
						if (i==0){
							ln.splice(x, ln.length-x);
							_y++;
						}
						else if (i===to){
let rem = lines.splice(_y, 1)[0];
if (!lines.length) lines = [[]];
//log("REM",rem);
if (rem){
	lines[_y-1] = lines[_y-1].concat(rem.slice(ch[to].length));
}
else{
cwarn("IS THIS GOING TO SCREW UP UNDO_ALL (OR SAVE IT?!?!?)");
}
/*SJFMGKG

vim.js?v=3970803:5025 Uncaught (in promise) TypeError: Cannot read properties
of undefined (reading 'slice')
at do_undo (vim.js?v=3970803:5025:45)

rem.slice() !!!

PROBLEM @RYBFJFI!?!?!

*/
						}
						else{
							lines.splice(_y, 1);
							if (!lines.length) lines = [[]];
						}
					}
				}
			}//»
			else if (keepFirst){
				lines[y+scroll_num] = [];
				if (ch.length > 1){
					lines.splice(y+scroll_num+1, ch.length-1);
					if (!lines.length) lines = [[]];
				}
			}
			else {
				let got = lines.splice(y+scroll_num, ch.length);
				if (!lines.length) lines = [[]];
				if (fileChomp) {
					y--;
				}
			}
		}//»

		if (y+scroll_num === lines.length && fileChomp) {
cwarn("HIHIHIHIHI!?!?!");
			lines.push([]);
		}			

		set_line_lens();
	}
}//»

const do_undo_prepend=(chg)=>{//«
	open_folds_in_line_range(chg.opts.selBot - chg.opts.selTop);
	let a = chg;
	let tm = chg.time;
	while (tm === a.time){//«
		if (a !== chg) actions.pop();
		undos.push(a);
		do_undo(a);
		a = actions[actions.length-1];
		if (!(a&&a.opts.prependSpace)) break;
	}//»
	undo_end(tm);
};//»
const do_redo_prepend=(chg)=>{//«
	open_folds_in_line_range(chg.opts.selBot - chg.opts.selTop);
	let u = chg;
	let tm = chg.time;
	while (tm === u.time){//«
		if (u !== chg) undos.pop();
		actions.push(u);
		do_redo(u);
		u = undos[undos.length-1];
		if (!(u&&u.opts.prependSpace)) break;
	}//»
	redo_end(tm);
};//»

const redo = (o={}) => {//«

let {time, chr, single}=o;
let chg = undos.pop();
if (!chg) {
	stat("Current state")
	return false;
}
if (chg.opts.prependSpace) return do_redo_prepend(chg);

let tm = chg.time;
let ch = chg.ch;
let openFoldHits;
let {neg, fileChomp, isLines, isViz, isBlockInsert} = chg.opts;
if (isLines && !neg) openFoldHits = false;
else openFoldHits = true;
x = chg.x;
//log(chg.y, ry);


//QLKMNYUHY
if (isViz) open_folds_in_line_range(ch.length);

actions.push(chg);
do_redo(chg);

if (!undos.length || single) return redo_end(tm);
let u = undos[undos.length-1];
let c = u.ch;
if (isStr(ch)&&ch.length==1){//«
	if (ch === "\n"){//Consecutive newlines«
		if (neg){
//Delete a previous newline
			while (c === "\n" && u.opts.neg && u.y === ry - 1 && !check_if_folded(-1)){
				undos.pop();
				actions.push(u);
				y--;
				set_ry();
				do_redo(u);
				u = undos[undos.length-1];
				if (!u) break;
				c = u.ch;
			}
		}
		else {
//Redoing a deleted newline
			while (c === "\n" && !u.opts.neg && u.y === ry){
				undos.pop();
				actions.push(u);
				do_redo(u);
				u = undos[undos.length-1];
				if (!u) break;
				c = u.ch;
			}
//NFUYWKJGH
//Dumbhack to allow the visual blocks that were inserted after the row padding at
//the bottom of the file was creaated.
			if (isBlockInsert && u && u.opts.isBlock && u.time === tm){
				real_line_colors=[];
				set_ry();
				redo();
				return;
			}
		}
	}//»
	else {//Adjacent characters on the same line«
		while(u.y == ry && isStr(c) && c.length == 1 && c !== "\n" && (u.x == x || u.x == x-1 || u.x == x+1)) {
			undos.pop();
			actions.push(u);
			do_redo(u);
			u = undos[undos.length-1];
			if (!u) break;
			c = u.ch;
		}
	}//»
}//»
else{//«
//	while (u.y===ry && u.time===tm){
	while (u.time===tm){
		if (u.y!==ry){
			scroll_to(u.y);
		}
		undos.pop();
		actions.push(u);
		do_redo(u);
		u = undos[undos.length-1];
		if (!u) break;
	}
}//»

return redo_end(tm);

};//»
const undo = async (o={}) => {//«
	let {time, chr, single}=o;
	let chg = actions.pop();
	if (!chg) {//«
		scroll_num=x=y=0;
		set_ry();
		stat("Initial state")
		validate_initial_str();
		return false;
	}//»
	if (chg.opts.prependSpace) {
		try {do_undo_prepend(chg);}catch(e){THROW(e);}
		return;
	}
	cur_undo = chg;
	let tm = chg.time;
	let ch = chg.ch;
	let openFoldHits;
	let {neg, fileChomp, isLines, isViz} = chg.opts;
	undos.push(chg);
	do_undo(chg);
	if (!actions.length || single) return undo_end(tm);

	let a = actions[actions.length-1];
	let c = a.ch;

	if (isStr(ch) && ch.length==1){//«
		if (ch === "\n"){//Consecutive newlines«
			if (neg){//« Redoing a deleted newline
				while (a.time == tm || 
					(c === "\n" && a.opts.neg && a.y === ry - 1)){

					actions.pop();
					undos.push(a);
//					do_undo(a);
					try {do_undo(a);}catch(e){return THROW(e);}
					a = actions[actions.length-1];
					if (!a) break;
					c = a.ch;
				}
			}//»
			else {// Undoing a newline (via backspace from next line down, x=0)«
				while (a.time == tm || 
						(c === "\n" && !a.opts.neg && a.y === ry-1 && 
													!check_if_folded(-1))){
					actions.pop();
					undos.push(a);
//					do_undo(a);
					try {do_undo(a);}catch(e){return THROW(e);}
					a = actions[actions.length-1];
					if (!a) break;
					c = a.ch;
				}
			}//»
		}//»
		else {//Adjacent characters on the same line«
			while(a.time == tm || 
				(a.y == ry && isStr(c) && c.length == 1 && c !== "\n" 
								&& (a.x == x || a.x == x-1 || a.x == x+1))) {
				actions.pop();
				undos.push(a);
//				do_undo(a);
				try {do_undo(a);}catch(e){return THROW(e);}
				a = actions[actions.length-1];
				if (!a) break;
				c = a.ch;
			}
		}//»
	}//»
	else if (isArr(ch)){//« "yank buffer"-like (multi-line) changes
		while (a.time===tm){
			actions.pop();
			undos.push(a);
//			do_undo(a);
			try {do_undo(a);}catch(e){return THROW(e);}
			a = actions[actions.length-1];
			if (!a) break;
		}
	}//»
else{
return THROW("UNKNOWN CHANGE TYPE: EXPECTED A SINGLE CHAR OR A LINES ARRAY!!!");
}

	return undo_end(tm);


};//»

const undo_all=async()=>{//«
	if (!is_command_or_edit_mode()) return;
	while (actions.length) {
		if (killed) return;
		undo();
	}
	reinit_folds();
	stat("Initial state");
//	validate_initial_str();
};//»
const redo_all=async()=>{//«
	if (!is_command_or_edit_mode()) return;
	while (undos.length) {
		if (killed) return;
		redo();
	}
	stat("Current state");
};//»

//»
//Syntax«

//Var«
//let real_line_colors=[];
const NO_SYNTAX=0;
const JS_SYNTAX=1;

let SYNTAX=NO_SYNTAX;
//let SYNTAX=JS_SYNTAX;
const KEYWORDS=[
"async",
"await",
"break",
"case",
"catch",
"class",
"const",
"continue",
"constructor",
"debugger",
"default",
"delete",
"do",
"else",
"export",
"extends",
"finally",
"for",
"if",
"import",
"in",
"instanceof",
"new",
"return",
"super",
"switch",
"throw",
"try",
"typeof",
"while",
"with",
"implements",
"interface",
"package",
"private",
"protected",
"null",
"undefined"
];
const LIGHT_RED="#ff998f";
//const LIGHT_RED="#ffaa9f";
const RED="#ff3333";

//const JS_KEYWORD_COL = "#af5f00";
//const JS_KEYWORD_COL = "#b7a000";
const JS_KEYWORD_COL = "#b39301";
//const JS_DEC_COL = "#06989a";
const JS_DEC_COL = "#01acb3";
const JS_COMMENT_COL = LIGHT_RED;
//const JS_QUOTE_COL= "#f66";
const JS_QUOTE_COL= LIGHT_RED;
const JS_BOOL_COL = LIGHT_RED;
const PAREN_COL = "#bba";
//const JS_COMMENT_COL = "#ef2929";
//const JS_QUOTE_COL="#c00";
let KEYWORD_STR='';
for (let c of KEYWORDS) KEYWORD_STR+="\\b"+c+"\\b"+"|";
KEYWORD_STR=KEYWORD_STR.slice(0,KEYWORD_STR.length-1);

const DECS = ["LOTW","function","this","var","let"];
let DEC_STR='';
for (let c of DECS) DEC_STR+="\\b"+c+"\\b"+"|";
DEC_STR=DEC_STR.slice(0,DEC_STR.length-1);

const BRACES = ["{","}","[","]"];
let BRACES_STR = "{|}|\\[|\\]";

const BOOLS=["true","false"];
const BOOL_STR="\\btrue\\b|\\bfalse\\b";

const C_COMMENT = "//";
const SQUOTE = "'";
const DQUOTE = '"';
const C_OPEN_COMMENT_PAT = "/\\x2a";
const C_CLOSE_COMMENT_PAT = "\\x2a/";
const C_OPEN_COMMENT = "/\x2a";
const C_CLOSE_COMMENT = "\x2a/";
const BACKTICK = "\x60"; 
//const JS_STR="("+BRACES_STR+"|"+PARENS_STR+"|"+BOOL_STR+"|"+KEYWORD_STR+"|"+DEC_STR+"|"+C_COMMENT+"|"+C_OPEN_COMMENT_PAT+"|"+C_CLOSE_COMMENT_PAT+"|"+BACKTICK+"|"+SQUOTE+"|"+DQUOTE+")";
const JS_STR="("+BRACES_STR+"|"+BOOL_STR+"|"+KEYWORD_STR+"|"+DEC_STR+"|"+C_COMMENT+"|"+C_OPEN_COMMENT_PAT+"|"+C_CLOSE_COMMENT_PAT+"|"+BACKTICK+"|"+SQUOTE+"|"+DQUOTE+")";
const ALPHA_JS_STR="("+BOOL_STR+"|"+KEYWORD_STR+"|"+DEC_STR+")";
const ALPHA_JS_RE = new RegExp(ALPHA_JS_STR);

//»
const parse_js_syntax_line=(arr_or_ln, is_str)=>{//«
	const mkobj=(pos, len, col, which)=>{
		colobj[pos]=[len, col, "", which, pos];
	};
	let _state, _type;
	let _statei, _stateln, _col;
	let _end;
	let colobj=[];
	if(!arr_or_ln) return;
	let ln;
	let arr;
//	let is_multi = arr_or_ln._multi;
	if (is_str) {
		ln = arr_or_ln;
		arr = ln.split("");
	}
	else {
		ln = arr_or_ln.join("");
		arr = arr_or_ln;
	}
	if (!ln) {
		return colobj;
	}
	let marr;
	let type = null;
	let from=0;
	let to = ln.length-1;
	let JS_RE  = new RegExp(JS_STR,"g");
	let didnum = 0;
	if (arr_or_ln._multi) {
		_type = C_OPEN_COMMENT;
		_col = JS_COMMENT_COL;
	}
	else {
	while (marr = JS_RE.exec(ln)){
		didnum++;
		let tok = marr[1];
		let i = marr.index;
		if (!_state){//«
			if (KEYWORDS.includes(tok)){
				mkobj(i,tok.length, JS_KEYWORD_COL, "kw");
				continue;
			}
			if (DECS.includes(tok)){
				mkobj(i,tok.length, JS_DEC_COL, "dec");
				continue;
			}
			if (BRACES.includes(tok)){
				mkobj(i,1, "#06989a");
				continue;
			}
			if (BOOLS.includes(tok)){
				mkobj(i,tok.length, JS_BOOL_COL, "bool");
				continue;
			}
			let c1 = arr[i]||" ";
			let col;
			if (tok==DQUOTE||tok==SQUOTE||tok==BACKTICK) {
				if (check_odd_escapes(arr, i)) continue;
				col=JS_QUOTE_COL;
			}
			else if (tok==C_COMMENT||tok==C_OPEN_COMMENT) col=JS_COMMENT_COL;
			else col="";
			if (tok==C_COMMENT){
				mkobj(i, arr.length-i, col, "//");
				break;
			}
//			_stateln = _ry;
			_statei = i;
			_col=col;
			_state = true;
			_type = tok;
			type = tok;
		}//»
		else {//«
			if (type==tok){
				if (check_odd_escapes(arr, i)) continue;
				mkobj(_statei, i-_statei+1, _col, tok);
				_state = false;
				_type=null;
				_col=null;
				type=null;
			}
			else if (tok==C_CLOSE_COMMENT&&_type==C_OPEN_COMMENT){
				mkobj(_statei, i-_statei+2, _col,_type);
//				if (_stateln==_ry) mkobj(_statei, i-_statei+2, _col,_type);
//				else {
//					mkobj(0, i+2, _col, _type);
//					_end = i+2;
//				}
				_state=false;
				_type=null;
				_col=null;
			}
//«
//			else if (tok==BACKTICK&&_type==BACKTICK){
//				if (check_odd_escapes(arr, i)) continue;
//				if (_stateln==_ry) mkobj(_statei, i-_statei+1, _col,_type);
//				else mkobj(0, i+1, _col, _type);
//				_state = false;
//				_type=null;
//				_col=null;
//			}
//»
			else if (type==C_OPEN_COMMENT){
//log("STATE OPEN");
			}
			else{
//console.warn("SYNTAX WHAT?????????", tok, _type);
didnum=0;
			}
		}//»
	}
	}

	if (!didnum && (_type==C_OPEN_COMMENT||_type==BACKTICK))mkobj(0, arr.length, _col);
	else if (_state && (type==SQUOTE||type==DQUOTE)){
		mkobj(_statei, arr.length-_statei, _col, type);
		_state = false;
	}
	else if (_state) mkobj(_statei, arr.length-_statei, _col, _type);
	if (!(_type==C_OPEN_COMMENT||_type==BACKTICK)){
		_type=null;
		_state=null;
	}
	_statei=null;
//log(colobj);
	return colobj;
}//»
const js_syntax_screen=()=>{//«
	let to = scroll_num+h-num_stat_lines;
	let _ry;
	for (let i=scroll_num; i < to; i++){
		let ln = lines[i];
		if (!ln || ln._fold) {
			continue;
		}
		let col;
		if (fold_mode) col = real_line_colors[lens[i]];
		else col = real_line_colors[i];
		if (col) {
			line_colors[i] = col;
			continue;
		}
		if (!ln.length) continue;
		col = parse_js_syntax_line(ln);
//log(col);
		if (fold_mode) real_line_colors[lens[i]] = col;
		else real_line_colors[i] = col;
		line_colors[i] = col;
	}
}//»

const del_syntax_multiline_comments=()=>{//«
	real_line_colors=[];
	for (let ln of lines) delete ln._multi;
	render();
}//»
const syntax_multiline_comments=()=>{//«
	let len = lines.length;
	let open = false;
	let type;
	real_line_colors = [];
	for (let i=0; i < len; i++){
		let ln = lines[i];
		if (ln._fold) continue;
		let str = ln.join("");
		if (open){
			if (str.match(/\x2a\x2f/)) {
				open = false;
				ln._multi = true;
			}
			else ln._multi = true;
		}
		else {
			if (str.match(/\x2f\x2a/)) {
				ln._multi = true;
				open = true;
				type="c";
			}
			else ln._multi = false;
		}
	}
	render();
};//»

//»
//Edit«

//Simple/Helpers«

const yank_file=()=>{//«
	mode = VIS_LINE_MODE;
	seltop=0;
	selbot=lines.length-1;
	delete_lines({copy:true});
//	adjust_cursor();
//log(x, cy());
	stat("Yanked file");
};//»

const insert_hex_ch=()=>{//«
	let s='';
	stat_cb = ch => {
		if(ch=="ENTER_"){
			stat_cb = null;
			if (s) {
				let ch = '"\\u{'+s+'}"';
				if (ch && ch.match(/^\w$/)) print_ch(ch);
			}
			render();
			return;
		}
		if (!(ch&&ch.match(/^[0-9a-f]$/i))) {
			stat_cb=null;
			stat_err("Invalid token");
			return;
		}
		if (s.length==5) {
			stat_cb=null;
			return render();
		}
		s+=ch;
//		stat_x++;
		stat(s);
	};
	stat("hex");
}//»
const insert_comment=()=>{//«
	stat_cb=c=>{
		stat_cb=null;
		let ln = lines[cy()];
		let lno = cy();
		if(c=="s"){//«
			print_chars("//", {ins: true});
			x++;
		}//»
		else if (c=="i"){//«
			print_chars("/**/", {ins: true});
			x--;
		}//»
		else if (c=="m"){//«
			let newln0 = lines[lno];
			x=0;
			print_chars(`/*${OPEN_FOLD_CHAR}`, {ins: true});
			nobreak_enter();
			nobreak_enter();
			let ry0 = lno;
			let newln1 = lines[lno+1];
			x=0;
			print_chars(`${END_FOLD_CHAR}*/`, {ins: true});
			x=0;
			y--;
			set_ry();
			syntax_multiline_comments();
		}//»
		mode=INSERT_MODE;
		render({},39);
	};
	stat("cm");
};//»
const insert_quote=()=>{//«
	const map={s:"'",d:'"',b:"`"};
	stat_cb=c=>{
		stat_cb=null;
		let got = map[c];
		if (got){
			print_chars(got+got,{ins: true});
			x--;
		}
		render({},41);
	};
	stat("qu");
};//»
const insert_kw=(opts={})=>{//«
	const map={
		l:"let",
		c:"const",
		f:"function"
	};
	stat_cb = c => {
		stat_cb = null;
		let got = map[c];
		if (!got) return;
		let ln = curarr();
		if (x==0 && !ln.length) opts.ins = true;
		let {ins} = opts;
		if (x==0 && (!ln[0] || ins)) print_chars(got,opts);
		else {
			if (!(ln[x-1]==" "||ln[x-1]=="\t")) got=" "+got;
			print_chars(got,opts);
		}
		let x1 = x+1;
		let ch = ln[x+1];
		if (ch && !(ch==" " || ch == "\t")) {
			x++;
			print_ch(" ");
		}
		render({},42);
	};
	stat("kw");
}//»

const delete_mode = (yank) => {//«
	stat_cb=c=>{
		stat_cb=null;
		if (c==="d") delete_line(cy(),{yank});
		else if (c==="W") delete_word({toEnd: true, yank});
		else if (c==="w") delete_word({yank});
		else if (c==="S") delete_word({spaces: true, toEnd: true, yank});
		else if (c==="s") delete_word({spaces: true, yank});
		else if (c==="T") delete_word({tabs: true, toEnd: true, yank});
		else if (c==="t") delete_word({tabs: true, yank});
		else if (c==="i") {
			delete_stdin_lines({yank});
		}
		else { 
			if (yank) stat_warn(`Unknown yank mode char`);
			else stat_warn(`Unknown delete mode char`);
		}
	};
	if (yank) stat("y");
	else stat("d");
};//»

const del = () => {//«
	if (check_if_folded(cy())) return;
	if (mode!==INSERT_MODE) return;
	if (!curarr().length) return;
	if (mode===VIS_LINE_MODE) delete_first_space();
	else {
		del_ch();
		do_syntax_timeout();
		render();
	}
}//»

const open_all_sel_folds = (opts={})=>{//«
	if (!is_vis_mode()) return;
	let {checkVisual, usex} = opts;
	if (!usex) usex = 0;
	let have_ch = null;
	let y_is_bot = selbot === cy();

	for (let i=seltop; i <= selbot; i++) {
/*DNPLJGU«

vim.js?v=2017610:6046 Uncaught (in promise) TypeError: 
					Cannot read properties of undefined (reading '_fold')
    at open_all_sel_folds (vim.js?v=2017610:6046:10)
    at delete_lines (vim.js?v=2017610:6817:14)
    at Object.do_justify [as j_C] (vim.js?v=2017610:6671:2)


 at open_all_sel_folds (vim.js?v=2837382:5996:10)
    at delete_lines (vim.js?v=2837382:6760:14)
    at do_justify (vim.js?v=2837382:6621:2)
    at Object.j_CAS (vim.js?v=2837382:7601:1)

    at open_all_sel_folds (vim.js?v=2017610:6046:10)
    at delete_lines (vim.js?v=2017610:6817:14)
    at delete_line (vim.js?v=2017610:6867:2)
    at Object.handle_ch_del [as x] (vim.js?v=2017610:6948:3)
    at handle_press (vim.js?v=2017610:7304:49)

    at open_all_sel_folds (vim.js?v=2017610:6046:10)
    at delete_lines (vim.js?v=2017610:6817:14)
    at do_pretty (vim.js?v=2017610:6609:2)
    at Object.try_dopretty [as p_A] (vim.js?v=2017610:1463:2)

    at open_all_sel_folds (vim.js?v=2017610:6046:10)
    at insert_line_comments (vim.js?v=2017610:6339:2)
    at handle_visual_key (vim.js?v=2017610:7402:21)
    at handle_press (vim.js?v=2017610:7302:3)
»*/
		let ln = lines[i];
if (!ln){
return THROW(`NO LINE: SELTOP(${seltop}) SELBOT(${selbot})`);
}
		if (ln._fold) {
			let len = ln._foldlen;
			open_fold(ln._fold, {noInnerFolds: true});
			selbot += len - 1;
			if (y_is_bot) {
				y+=len-1;
				set_ry();
			}
		}
		if (!checkVisual) continue

		ln = lines[i];
		if (have_ch === null){
			have_ch = ln[usex];
			if (!(have_ch == " " || have_ch == "\t")){
//cwarn("no valid whitespace char found");
return;
			}
		}
		else if (ln[usex]!==have_ch){
//cwarn("char not the same");
return;
		}
	}
	return have_ch;

};//»

const prepend_space=(ch)=>{//«
if (!curarr().length){
return;
}
	let usex;
	if (mode===VIS_BLOCK_MODE) usex = selleft;
	else usex = 0;
	let tm = act_iter++;
	let real_seltop = realy(seltop);
	let real_selbot = realy(selbot);
	open_all_sel_folds();
	for (let i=seltop,iter=0; i<= selbot; i++,iter++) {
		real_line_colors[real_seltop+iter]=undefined;
		let ln = lines[i];
		ln.splice(usex,0,ch);
		actions.push(new Action(usex, real_seltop+iter, ch, tm, {prependSpace: true, selTop: real_seltop, selBot: real_selbot}));
	}
	if (mode===VIS_BLOCK_MODE) {
		selleft++;
		selright++;
		x++;
	}
	render({},17);
	dirty_flag = true;
//	Term.is_dirty = true;
};//»
const delete_first_space=()=>{//«
	let usex;
	if (mode===VIS_BLOCK_MODE) {
		if (selleft === 0) return;
		usex = selleft-1;
	}
	else usex = 0;
//	let tm = Date.now();
	let tm = act_iter++;
	let real_seltop = lens[seltop];
	let real_selbot = lens[selbot];
	let use_ch = open_all_sel_folds({checkVisual: true, usex});
	if (!use_ch) return;
	for (let i=seltop,iter=0; i<= selbot; i++,iter++) {
		real_line_colors[real_seltop+iter]=undefined;
		lines[i].splice(usex, 1);
		actions.push(new Action(usex, real_seltop+iter, use_ch, tm, {prependSpace: true, selTop: real_seltop, selBot: real_selbot, neg: true}));
	}
	if (mode===VIS_BLOCK_MODE) {
		selleft--;
		selright--;
		x--;
	}
	render();
	dirty_flag = true;
//	Term.is_dirty = true;
};//»
const try_empty_line_del=()=>{//«
	if (!curlen()){//if (!curln(true).length){
//		edit_insert=true;
		mode = INSERT_MODE;
		no_render=true;
		down();
		do_backspace();
//		edit_insert=false;
		mode = COMMAND_MODE;
		no_render=false;
		render({},49);
	}
};//»

const do_null_del = ()=>{//«
	let ln = curarr();//let ln = curln(true);
	let usex = null;
	if (!curch() && curch(1)) usex=x;
	else if (!curch(1) && curch(2)) usex=x+1;
	else if (ln.length > x+1){
		if (!curch()||!curch(1)){
cwarn("Detected numerous nulls, doing line join and split!");
			lines[y+scroll_num] = ln.join("").split("");
			stat("Null bytes deleted");
			return;
		}
	}
	if (!NUM(usex)) return;
	let arr = ln.splice(usex, 1);
	lines[y+scroll_num] = ln.slice();
	stat("Null byte deleted");
};//»
const clear_nulls_from_cur_ln = () => {//«
	let ln = curarr();//let ln = curln(true);
	let len = ln.length;
	let num = 0;
	for (let i = 0; i < len; i++) {
		if (ln[i] == "") {
			num++;
			ln.splice(i, 1);
			len--;
			i--;
		}
	}
	stat_warn(`${num} nulls found in the line`);
};//»
const clear_nulls_from_file = () => {//«
	let num = 0;
	for (let ln of lines) {
		let len = ln.length;
		for (let i = 0; i < len; i++) {
			if (ln[i] == "") {
				num++;
				ln.splice(i, 1);
				len--;
				i--;
			}
		}
	}
	stat_warn(`${num} nulls found in the file`);
};//»

//»

const do_paste = (val, opts={}) => {//«
	if (!val) return;
	let lns = val.split(/\r?\n/);
	if (!lns[0]) lns.shift();
	if (!lns[lns.length-1]) lns.pop();
	if (!lns.length) return;
	if (stat_input_type){
		for (let ch of lns[0]) handle_press(ch);
	}
	else {
		yank_buffer = [];
		yank_buffer._type = "L";
		for (let ln of lns) yank_buffer.push([...ln]);
		if (opts.before) handle_paste("P");
		else handle_paste("p");
	}
};//»
const handle_paste = async (which, opts = {}) => {//«

let {keepFirst, doFold} = opts;
if (!yank_buffer) return;
if (stat_input_type){
	let s = yank_buffer[0];
	stat_com_arr.splice(x, 0, ...s);
	x=0;
	render();
	return;
}

let _scrh = scroll_num;
let _y = y;
let _cy = y+scroll_num;
let hold_x = x;
let hold_ry = ry;
let yb = yank_buffer;
let typ = yb._type;
if (!typ) {
	return;
}
//let time = opts.time || Date.now();
let time = opts.time || act_iter++;
let to = yb.length-1;
let fileChomp;
if (typ=="B"){//Block«
	open_folds_in_line_range(to);
	if (which=="p" && curlen()) x++;
	let diff = y+scroll_num+to-lines.length+1;
	if (diff > 0){//«
		scroll_num=lines.length-1;
		y=0;
		x=0;
		set_ry();
		for (let i=0; i < diff; i++) nobreak_enter({time, isBlockInsert: true});
		x=hold_x;
		y=_y;
		scroll_num = _scrh;
		set_ry();
	}//»
	let _x = x;
	let pads = [];
	let newlines = 0;

	for (let i=0; i <= to; i++){
		let buf = yb[i];
		let ln = curarr();
		let len = ln.length;
		pads.push(_x-len);
		if (len < _x){
			ln.push(..." ".repeat(_x-len));
			x=_x;
		}
		ln.splice(x, 0, ...buf);
		y++;
		if (i < to && !lines[cy()]){
return THROW(`i(${i} < to(${to}) && !lines[cy()])`);
		}
	}
	y=_y;
	actions.push(new Action(_x, ry, yb, time, {isBlock: true, pads, isViz: true}));
}//»
else if (typ==="M"){//Marker«
	let ln = curarr();
	if (ln._fold) return stat_warn("Fold detected");

	let ch = yb;
	let to = _cy + ch.length-1;
	let len = ch.length;	
	let rem=[];		
	if (which==="p" && curlen()) x++;//if (which==="p" && curln().length) x++;
	actions.push(new Action(x, ry, yb, time, {ins: true, isViz: true}));
	for (let i=_cy, j=0; i <= to; i++, j++){
		let ln = lines[i];
		if (i==_cy){
			if (len > 1) rem = ln.splice(x, ln.length-x);
			ln.splice(x, 0, ...ch[j]);
			if (len==1) x+=ch[j].length-1;
		}
		else if (i==to){
			let arr = ch[j].concat(rem);
			lines.splice(i, 0, [...arr]);
		}
		else{
			let arr = ch[j];
			lines.splice(i, 0, [...arr]);
		}
	}

}//»
else if (typ==="L"){//Line«
	x=0;
	if (which==="p"){
		if (at_file_end()) {
			lines.push([]);
			y++;
			set_line_lens();
//			nobreak_enter();
			fileChomp = true;
		}
		else {
			down();
		}
		_cy++;
		_y++;
	}
	else if (!curarr().length) keepFirst = true;
	actions.push(new Action(0, ry, dup(yank_buffer), time, {keepFirst, fileChomp, isLines: true, isViz: true}));
//WIJKFLPIT   !!!!!   THIS IS WRONG   !!!!!
//	lines.splice(_cy, 0, ...yank_buffer);
//						 ^^^^^^^^^^^^^^
	if (fileChomp) keepFirst = true;
	if (doFold && fold_mode){
		let lns = get_folded_lines(yank_buffer);
		lines.splice(y+scroll_num, keepFirst ? 1 : 0, ...lns);
	}
	else lines.splice(y+scroll_num, keepFirst ? 1 : 0, ...dup(yank_buffer));
	if (!lines.length) lines = [[]];
}//»
else {
log(yank_buffer);
cwarn("HANDLEPASTEWUTTYPE");
}
let ind = cut_buffers.indexOf(yb);
if (ind > -1) cut_buffers.splice(ind, 1);

scroll_num = _scrh;
y = _y;
//adjust_cursor();
set_line_lens();
real_line_colors=[];
if (!opts.noRender) render();

};//»

const insert_line_comments=()=>{//«
	open_all_sel_folds();
//	let time = Date.now();
	let time = act_iter++;
	scroll_to(real_seltop(), {noSetSel: true});
	let diff = selbot - seltop;
	let _y = y;
	for (let i=0; i <= diff; i++){
		x=0;
		print_chars("//",{time, ins: true});

//If we are at the bottom, set_ry() blows up...
if (!lines[y+scroll_num+1]) break;
		y++;
		set_ry();

	}
	y=_y;
	set_ry();
	x=0;
	mode = COMMAND_MODE;
	render();
};//»
const insert_multiline_comment=()=>{//«
	open_all_sel_folds();
//	let time = Date.now();
	let time = act_iter++;
	if (seltop === selbot) return;
	let _ry = ry;
	scroll_to(real_seltop(), {noSetSel: true});
	x = 0;
	print_ch("/", {time});
	x = 1;
	print_ch("*", {time});
	scroll_to(real_selbot(), {noSetSel: true});
	x = curarr().length;
	print_ch("*", {time});
	x++;
	print_ch("/", {time});
	scroll_to(_ry);
//	mode = COMMAND_MODE;
	render();
};//»
const insert_fold = (opts={}) => {//«
	if (seltop === selbot) return;
	open_all_sel_folds();
	let ln1 = lines[seltop];
	let ln2 = lines[selbot];
if (!ln1){
cerr(`NO LINE @SELTOP: ${seltop}`);
return THROW("ABORTING");
}
if (!ln2){
cerr(`NO LINE @SELBOT: ${selbot}`);
return THROW("ABORTING");
}
	if (have_fold_marker(ln1)||have_fold_marker(ln2)) {
		stat("Fold marker detected");
		return;
	}
//	let time = Date.now();
	let time = act_iter++;
	scroll_to(real_seltop(), {noSetSel: true});
	let ln1len = ln1.length;
	let ln2len = ln2.length;
	if (ln1len > 1 && ln2len > 1 && ln1[0]=="/" && ln1[1]=="*" && ln2[ln2len-2]=="*" && ln2[ln2len-1]=="/"){
		x = 2;
		print_ch(OPEN_FOLD_CHAR, {time});
		scroll_to(real_selbot(), {noSetSel: true});
		x = ln2len-2;
		print_ch(END_FOLD_CHAR, {time});
	}
	else if (opts.multiLine){
		x=0;
		print_chars(`/*${OPEN_FOLD_CHAR}`,{ins: true,time});
		scroll_to(real_selbot(), {noSetSel: true});
		x = ln2len-1;
		print_chars(`${END_FOLD_CHAR}*/`,{time});
	}
	else if (ln1len > 1 && ln2len > 1 && ln1[0]=="/" && ln1[1]=="/" && ln2[0]=="/" && ln2[1]=="/"){
		x = ln1len;
		print_ch(OPEN_FOLD_CHAR, {time});
		scroll_to(real_selbot(), {noSetSel: true});
		x = ln2len;
		print_ch(END_FOLD_CHAR, {time});
	}
	else {
		x = ln1len-1;
		print_chars(`//${OPEN_FOLD_CHAR}`, {time});
		scroll_to(real_selbot(), {noSetSel: true});
		x = ln2len-1;
		print_chars(`//${END_FOLD_CHAR}`, {time});
	}
	mode = COMMAND_MODE;
	render();
};//»

const do_something_to_lines = (opts={}) => {//«
//const do_trim_lines = (opts={}) => {
	let {trim, regspace}=opts;
	open_all_sel_folds();
//	scroll_to(seltop);
	scroll_to(real_seltop());
//	let time = Date.now();
	let time = act_iter++;
	delete_lines({time, keepFirst: true, keepMode: true});
if (!yank_buffer) {
	render();
	return;
}
	let to = yank_buffer.length;
	let arr = [];
	for (let i=0; i < to; i++){
		let ln = yank_buffer[i];
		if (!ln.length) {
			arr.push([]);
			continue;
		}
		if (trim)arr.push([...ln.join("").trim()]);
		else if (regspace)arr.push([...ln.join("").regstr()]);
	}
//log(arr);
	yank_buffer = arr;
	yank_buffer._type="L";
	handle_paste("P", {time, keepFirst: true});
	render();
}//»
const do_pad_lines = (opts={}) => {//«
	let {padBlankLines} = opts;
	open_all_sel_folds();
// WIRKGNDJ   vvvvvv<<<<<<<<<<<<----------- !!!!!!!!!!!!!!!!
//	scroll_to(seltop);
	scroll_to(real_seltop());
//	let time = Date.now();
	let time = act_iter++;
	delete_lines({time, keepFirst: true, keepMode: true});
	if (!yank_buffer) return;
	let to = yank_buffer.length;
	let arr = [];
	for (let i=0; i < to; i++){
		let ln = yank_buffer[i];
		if (!ln.length) {
			if (padBlankLines) arr.push([" "]);
			else arr.push([]);
			continue;
		}
		if (ln[ln.length-1]===" ") {
			arr.push(ln);
			continue;
		}
		let sl = ln.slice();
		sl.push(" ");
		arr.push(sl);
	}
	yank_buffer = arr;
	yank_buffer._type="L";
	handle_paste("P", {time, keepFirst: true});
	render();
}//»
const do_changecase=(if_lower)=>{//«
	if (!is_vis_mode()) return;
	let m = mode;
	mode = VIS_LINE_MODE;
	let typ;
	let lft, rgt;
	let x1, x2;
	if (m===VIS_MARK_MODE) {//«
		if (cur_pos.y === mark_pos.y) {
			if (cur_pos.x < mark_pos.x) {
				x1 = cur_pos.x;
				x2 = mark_pos.x;
			}
			else {
				x1 = mark_pos.x;
				x2 = cur_pos.x;
			}
		}
		else if (cur_pos.y < mark_pos.y) {
			x1 = cur_pos.x;
			x2 = mark_pos.x;
		} 
		else {
			x1 = mark_pos.x;
			x2 = cur_pos.x;
		}
	}//»
	else if (m===VIS_BLOCK_MODE) {//«
		lft = selleft;
		rgt = selright;
	}
//»
//	let time = Date.now();
	let time = act_iter++;
	delete_lines({time, keepFirst: true});
	if (!yank_buffer) return;
	let arr=[];
/*«These are the exact same algorithms, except that one calls toLowerCase 
while the other calls toUpperCase. I wanted to do 2 big outer tests rather than several
small inner tests because the inner ones would be performed on every character
in the line. So if it needs to be changed, just change one, copy it, then
replace all of the toLowerCase's with toUpperCase's (or vice versa).
»*/
	if (if_lower){//«
		for (let i=0; i < yank_buffer.length; i++){
			let ln = yank_buffer[i];
			let a = [];
			for (let j=0; j < ln.length; j++){
				let ch = ln[j];
				if (m===VIS_LINE_MODE) a.push(ch.toLowerCase());
				else if (m===VIS_BLOCK_MODE){
					if (j < lft || j > rgt) a.push(ch);
					else a.push(ch.toLowerCase());
				}
				else{
					let n = i+seltop;
					if (seltop===selbot){
						if (j >= x1 && j <= x2) a.push(ch.toLowerCase());
						else a.push(ch);
					}
					else {
						if (n===seltop){
							if (j < x1) a.push(ch);
							else a.push(ch.toLowerCase());
						}
						else if (n===selbot){
							if (j > x2) a.push(ch);
							else a.push(ch.toLowerCase());
						}
						else a.push(ch.toLowerCase());
					}
				}
			}
			arr.push(a);
		}
	}//»
	else {//«
		for (let i=0; i < yank_buffer.length; i++){
			let ln = yank_buffer[i];
			let a = [];
			for (let j=0; j < ln.length; j++){
				let ch = ln[j];
				if (m===VIS_LINE_MODE) a.push(ch.toUpperCase());
				else if (m===VIS_BLOCK_MODE){
					if (j < lft || j > rgt) a.push(ch);
					else a.push(ch.toUpperCase());
				}
				else{
					let n = i+seltop;
					if (seltop===selbot){
						if (j >= x1 && j <= x2) a.push(ch.toUpperCase());
						else a.push(ch);
					}
					else {
						if (n===seltop){
							if (j < x1) a.push(ch);
							else a.push(ch.toUpperCase());
						}
						else if (n===selbot){
							if (j > x2) a.push(ch);
							else a.push(ch.toUpperCase());
						}
						else a.push(ch.toUpperCase());
					}
				}
			}
			arr.push(a);
		}
	}//»
	yank_buffer = arr;
	yank_buffer._type="L";
	handle_paste("P", {time, noRender: true, keepFirst: true});
	if (m===VIS_MARK_MODE) {
		x = x1;
	}
	else if (m===VIS_BLOCK_MODE){
		x = lft;
	}
	render();
};//»
const do_pretty=()=>{//«
	if (is_normal_mode(true)){
		seltop=selbot=cy();
		mode = VIS_LINE_MODE;
	}
	if (mode!==VIS_LINE_MODE) return;
//	let time = Date.now();
	let time = act_iter++;
	delete_lines({time, keepFirst: true});
	if (!yank_buffer) return;
	let s='';
	for (let ln of yank_buffer) s+=ln.join("")+"\n";
	let ar = pretty(s,{indent_with_tabs:1}).split("\n");
	yank_buffer = [];
	for (let ln of ar) yank_buffer.push(ln.split(""));
	yank_buffer._type="L";
	handle_paste("P", {time, keepFirst: true});
};//»
const do_justify = () => {//«
const fmt=(str,opts={})=>{//«
	let{
		maxlen,
		nopad
	}=opts;
	let ret = [];
	let dopad = 0;
	if (maxlen&&maxlen < w) {
		if (!nopad) dopad = Math.floor((w - maxlen)/2);
		w = maxlen;
	}

	let wordarr = str.split(/\x20+/);
	let ln="";
	let m;
	for (let i=0; i < wordarr.length; i++){
		let w1 = wordarr[i];
		let gotlen = (ln + " " + w1).length;
// Breaking consecutive non-whitespace char strings along hyphen (-), emdash (—), and forward-slash (/)

		if (gotlen > w && (m=w1.match(/^([a-z]+[-\/\u2014])([-\/\u2014a-z]+[a-z])/i))){
			if ((ln + " " + m[1]).length < w){
				ln = ln + " " + m[1];
				w1 = m[2];
			}
		}
		gotlen = (ln + " " + w1).length;
		if (gotlen >= w){
			if (dopad) ret.push((" ".repeat(dopad))+ln);
			else ret.push(ln);
			ln = w1;
		}
		else {
			if (!ln) ln = w1;
			else ln += " " + w1;
		}
		if (i+1==wordarr.length) {
			if (dopad) ret.push((" ".repeat(dopad))+ln);
			else ret.push(ln);
		}
	}
	return ret.join("\n");
};//»
	let holdx = x;
	let holdy = y;
	if (is_normal_mode(true)){
		seltop=selbot=cy();
		mode = VIS_LINE_MODE;
	}
	if (mode !== VIS_LINE_MODE) return;
//	let time = Date.now();
	let time = act_iter++;
	delete_lines({time, keepFirst: true});
	if (!yank_buffer) return;
	let s='';
	for (let ln of yank_buffer) s+=ln.join("")+" ";
	let ar = fmt(s,{maxlen:WRAP_LENGTH,nopad:true}).split("\n");
	yank_buffer = [];
	for (let ln of ar) yank_buffer.push(ln.split(""));
	yank_buffer._type="L";
	handle_paste("P", {time, keepFirst: true});
}//»
const do_line_wrap=async()=>{//«

//WUIOPHMDL
	if (mode !== VIS_LINE_MODE || mode_hold === FILE_MODE) return;

//	let time = Date.now();
	let time = act_iter++;
	delete_lines({time, keepFirst: true});
	if (!yank_buffer) return;
	let s='';
	for (let ln of yank_buffer) s+=ln.join("");
	s = s.replace(/[\x20\t]*([-:{};=+><(),])[\x20\t]*/g,"$1");
	if (!s) return;
	let chars = [...s];
	yank_buffer = [chars];
	yank_buffer._type="L";
	actions.push(new Action(0, real_seltop(), dup(yank_buffer), time, {keepFirst: true}));
	lines[seltop] = chars;
	render();

};//»
const do_delete_lines = (from, to, opts={})=>{//«
	let{copy, time, keepFirst}=opts;
	if (opts.yank) copy = true;
//	let tm = time || Date.now();
	let tm = time || act_iter++;
	let diff = to-from+1;

let use_ry = realy(from);

//log(seltop, selbot);
//If we are deleting the entire file, we need to keep one line
	if (diff === lines.length) {
		keepFirst = true;
	}
	if (copy){
		let out = [];
		for (let i=from; i <= to; i++) {
			let ln = lines[i];
			if (ln._fold) out.push(...copy_fold_lines(ln._fold, []));
			else out.push(ln.slice());
		}
		yank_buffer = out;
	}
	else {
		let fileChomp = false;
		if (keepFirst && diff == 1){
/*SHKTMGK
vim.jsUncaught (in promise) TypeError: Cannot read properties of undefined (reading 'slice')
 at do_delete_lines (6335:31)
 at delete_lines (6446:3)
 at do_pretty (6215:2)
 at Object.try_dopretty [as p_A] (1138:2)
*/

			if (!lines[from]) return THROW("NOTHING TO SLICE 1");
			yank_buffer = [lines[from].slice()];
			lines[from] = [];
		}
		else if (keepFirst){
/*ERNJTPL
vim.jsUncaught (in promise) TypeError: Cannot read properties of undefined (reading 'slice')
    at do_delete_lines (6718:31)
    at delete_lines (6805:3)
    at do_justify (6663:2)
    at Object.j_CAS (7643:1)
*/	
			if (!lines[from]) return THROW("NOTHING TO SLICE 2");
			yank_buffer = [lines[from].slice()];
			lines[from] = [];
			yank_buffer.push(...dup(lines.splice(from+1, diff-1)));
			if (!lines.length) lines = [[]];
		}
		else {
			yank_buffer = dup(lines.splice(from, diff));
			if (!lines.length) lines = [[]];
			if (cy()===lines.length){
				y--;
				fileChomp = true;
				set_ry();
			}
		}
		if (yank_buffer.flat().length) cut_buffers.unshift(yank_buffer);
//log(ry);
		actions.push(new Action(0, use_ry, yank_buffer, tm, {neg: true, keepFirst, fileChomp, isLines: true, isViz: true}));
//		actions.push(new Action(0, ry, yank_buffer, tm, {neg: true, keepFirst, fileChomp, isLines: true, isViz: true}));
	}
};//»
const do_delete_marker = (y1, x1, y2, x2, opts={})=>{//«

	let {copy, time, toUpper}=opts;
	let out=[];
	if (y1===y2) {
		if (copy) out = [lines[y1].slice(x1, x2+1)];
		else out = [lines[y1].splice(x1, x2-x1+1)];
	}
	else {
		for (let i=y1; i <= y2; i++){
			let ln = lines[i];
			if (i===y1){
				if (copy) out.push(ln.slice(x1));
				else out.push(ln.splice(x1, ln.length - x1));
			}
			else if (i==y2){
				if (copy) out.push(ln.slice(0,x2+1));
				else{
					out.push(ln.splice(0, x2+1));
					lines[i-1]=lines[i-1].concat(ln);
					lines.splice(i, 1);
					if (!lines.length) lines = [[]];
				}
			}
			else{
				if (copy) out.push(ln.slice());
				else {
					out.push(...lines.splice(i, 1));
					if (!lines.length) lines = [[]];
					i--;
					y2--;
				}
			}
		}
	}
	yank_buffer = out;
	if (!copy) {
		if (y1 !== y2) {
			set_line_lens();
		}
//		actions.push(new Action(x1, realy(y1), out, Date.now(), {ins: true, neg: true, isViz: true}));
		actions.push(new Action(x1, realy(y1), out, act_iter++, {ins: true, neg: true, isViz: true}));
		if (yank_buffer.flat().length) cut_buffers.unshift(yank_buffer);
		x=x1;
	}
};//»
const do_delete_block=async(top,bot,left,right,opts={})=>{//«
	let {copy, time, toUpper}=opts;
	yank_buffer=[];
//	let tm = time||(new Date).getTime();
	let tm = time||act_iter++;

	for (let i=top; i <= bot; i++) {
		let ln = lines[i];
		let a;
		if (copy) a = ln.slice(left,right+1);
		else a = ln.splice(left,right-left+1);
		yank_buffer.push(a);
	}
	if (!copy) {
		x = left;
		actions.push(new Action(left, ry, dup(yank_buffer), tm, {neg: true, isBlock: true, isViz: true}));
		if (yank_buffer.flat().length) cut_buffers.unshift(yank_buffer);
	}
}//»
const delete_lines = async(opts={}) =>{//«
	let {copy, time}=opts;
//KOPLIERT
	if (!copy && mode_hold === FILE_MODE) return;
	let _scrh = scroll_num;
	if (mode===VIS_LINE_MODE){//«
		if (!copy) open_all_sel_folds();
//SJDUIRHJKED
//                vvvvvvvvvvvv-------!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		scroll_to(realy(seltop), {noSetSel: true});
//		scroll_to(seltop, {noSetSel: true});
//		if (seltop===selbot && !curarr().length){
//		}
//else {
		do_delete_lines(seltop, selbot, opts);
		yank_buffer._type = "L";//Line"
//}
	}//»
	else if (mode===VIS_BLOCK_MODE){//«
		open_all_sel_folds();
		scroll_to(realy(seltop), {noSetSel: true});
		set_ry();
		do_delete_block(seltop, selbot, selleft, selright, opts);
		yank_buffer._type = "B";//Block
	}//»
	else if (mode===VIS_MARK_MODE){//«
		open_all_sel_folds();
		set_sel_mark();
		let [x1, y1, x2, y2] = get_marker_coords();
		scroll_to(realy(seltop), {noSetSel: true});
		x = x1;
		do_delete_marker(y1, x1, y2, x2, opts);
		yank_buffer._type = "M";//Marker
	}//»

//ODBFKEJ
	if (mode_hold === FILE_MODE) {
		mode = FILE_MODE;
//		delete mode_hold;
		mode_hold = undefined;
	}
	else if (!opts.keepMode) mode=COMMAND_MODE;
	set_line_lens();
	real_line_colors=[];
	if (x>0 && x===curarr().length) x--;

	render({},45);
};//»
const delete_stdin_lines = (opts={}) =>{//«
	if (!stdin_lines) return stat_warn("No lines received from stdin");
	yank_buffer = stdin_lines;
	yank_buffer._type="L";
	stat(`Yank buffer has: ${yank_buffer.length} lines`);
	if (!opts.yank) {
		stdin_lines = null;
		if (yank_buffer.flat().length) cut_buffers.unshift(yank_buffer);
	}
};//»
const delete_line = (yarg, opts = {}) => {//«
	mode=VIS_LINE_MODE;
	let usey = yarg || cy();
	seltop=selbot=usey;
	delete_lines(opts);
//	adjust_cursor();
};//»
/*
const delete_to_end=()=>{//«
	if (mode !== COMMAND_MODE) return;
	let ln = curarr();//let ln = curln(true);
	if (x===ln.length) return;
	yank_buffer = [ln.splice(x)];
	yank_buffer._type = "M";
//	actions.push(new Action(x, ry, yank_buffer, Date.now(), {neg: true, ins: true}));
	actions.push(new Action(x, ry, yank_buffer, act_iter++, {neg: true, ins: true}));
	if (x > 0) x--;
	render();
};//»
const delete_to_top=()=>{//«
	if (mode !== COMMAND_MODE) return;
	if (cy()==0) return;
	mode = VIS_LINE_MODE;
	seltop = 0;
	selbot = cy();
	delete_lines();
//	adjust_cursor();
	mode = COMMAND_MODE;
};//»
const delete_to_bottom=()=>{//«
	if (mode !== COMMAND_MODE) return;
	let llen_min1 = lines.length-1;
	if (cy()==llen_min1) {
		if (!curarr()._fold) return;
	}
	mode = VIS_LINE_MODE;
	seltop = cy();
	selbot = llen_min1;
	delete_lines();
//	adjust_cursor();
	mode = COMMAND_MODE;
};//»
*/
const delete_word = (opts={})=>{//«

	let wrd;
	let copy = opts.yank;
	if (opts.spaces) wrd = get_cur_spaces(" ");
	else if (opts.tabs) wrd = get_cur_spaces("\t");
	else wrd = get_cur_word();
	let word = wrd.word;
	if (!word) return render();
	let wrdx = wrd.x;
	{
		let end = wrdx + word.length;
		let ln = curarr();
//Need to gobble up *all* trailing spaces
		while (ln[end]&&(ln[end]==" "||ln[end]=="\t")){
			word+=ln[end];
			end++;
		}
	}
	if (opts.toEnd) {
		let rest = word.slice(x - wrdx);
		if (!rest) return render();
		do_delete_marker(cy(), x, cy(), x+rest.length-1, {copy});
	}
	else{
		let _x = x;
		x = wrdx;
		do_delete_marker(cy(), x, cy(), x+word.length-1, {copy});
		if (copy) x = _x;
	}

	yank_buffer._type="M";
	if (x>0 && x===curarr().length) x--;
	render();

};//»

const handle_ch_del = ()=>{//«
	let ln = curarr();
	if (ln._fold) return;
	if (!ln.length) {
		if (cy()==0) return;
		delete_line();
		return;
	}
	del_ch();
	render();
};//»
/*
const do_del_enter = (opts={}) => {//«
if (x == curarr().length && !at_file_end()){
down();
x=0;
do_backspace(opts);
return;
}
};//»
*/
const del_ch = (opts={}) =>{//«
	let ln = curarr();//let ln = curln(true);
	if (!curch()) {
//if (opts.prependSpace) return;
		if (!ln.length){
			delete_line(cy(), opts);
			return;
		}
//YSURMIR
		if (x == ln.length && !at_file_end()){
			down();
			x=0;
			do_backspace(opts);
		}
		return;
	}
	real_line_colors[ry]=undefined;
	let have_ch = ln[x];
	let {noAct, time} = opts;
//  let tm = time || (new Date).getTime();
    let tm = time || act_iter++;

	let at_line_end = x===ln.length-1;
	let ch = ln.splice(x, 1)[0];
    if (!noAct) {
		actions.push(new Action(x, ry, ch, tm, {neg: true} ));
	}
if (at_line_end) left();
//	if (at_line_end) left();
	dirty_flag = true;
//	Term.is_dirty = true;
	return have_ch;
};//»
const print_chars = (s, opts={}) =>{//«
	let {ins}=opts;
	let arr=s.split("");
	if (!(ins||mode===INSERT_MODE)) x++;
	if (!opts.time) opts.time = act_iter++;
	for(let ch of arr){
		print_ch(ch, opts);
		x++;
	}
	if (mode!==INSERT_MODE) x--;
};//»

const do_syntax_timeout=()=>{//«
//return;
	if (syntax_timeout) clearTimeout(syntax_timeout);
	syntax_timeout=setTimeout(()=>{
//cwarn("DO MULTILINE!");
		syntax_multiline_comments();
		syntax_timeout = null;
	}, SYNTAX_TIMEOUT_MS);
};//»

const print_ch = (ch, opts={}) => {//«
if (!ch){
//UROPLKMHGBGT
cwarn("null/empty byte", ch);
return;
}
	let {noAct, time, fromHandler} = opts;
	let ln = curarr();
	if (ln._fold) {
		open_fold(ln._fold);
		x=0;
		ln = curarr();
	}

//    let tm = time || (new Date).getTime();
    let tm = time || act_iter++;
    if (!noAct) {
//log(x);
		actions.push(new Action(x, ry, ch, tm, {adv: true}));
	}
	ln.splice(x, 0, ch);
	if (fromHandler){
		x++;
		render();
		do_syntax_timeout();

	}

	dirty_flag = true;
//	Term.is_dirty = true;
	real_line_colors[ry]=undefined;
	return true;
}//»

const replace_char = (ch, opts={})=>{//«
//	let time = Date.now();
	let time = act_iter++;
//	let at_line_end = x === (curlen() - 1);
	let at_line_end = x != 0 && x === (curlen() - 1);
	let past_line_end = x === curlen();
	let gotch;
	if (x==0 && !curarr().length) return;

//else {
else if (!past_line_end){
	gotch = del_ch({time});
//log(`<${gotch}>`);
}

// WHAT DO I DO HERE ???
// DSJRKFH
//	let did_inc = false;
///*
	if (at_line_end) {
		x++;
	}
	if (opts.toUpper && gotch && gotch.toUpperCase) ch = gotch.toUpperCase();
	if (ch==="\n") return enter({time});
	print_ch(ch,{time});
//This means we are in REPLACE_MODE
	if (opts.fromHandler) {
		x++;
		render();
		do_syntax_timeout();
	}
};//»
const replace_one_char = () => {//«
	let ln = curarr();//let ln = curln(true);
	if (ln._fold) return;
	if (!ln[x]) return;
	stat_cb=c=>{
		stat_cb=null;

		if (c) {
			if (c.length == 1) {
				replace_char(c);
			}
else if (c==="\x20_") replace_char(" ");
else if (c==="TAB_") replace_char("\t");
else if (c==="ENTER_"){
replace_char("\n");
}
//let arr = curarr();
		}
		render();
	};
	stat("r");
};//»

const tab = (opts={}) => {//«
	let {shift, ctrl}=opts;
	let m = mode;
	if (m===COMMAND_MODE||ctrl){
		init_complete_mode();
	}
	if (shift||ctrl) return;
	if (m===INSERT_MODE) {
		print_ch("\t");
		x++;
		render();
	}
};//»

const do_enter = (opts={}) =>{//«
	let {noAct, time, num, data}=opts;
//    let tm = time || (new Date).getTime();
    let tm = time || act_iter++;
	let arr = curarr();//let arr = curln(true);
	let start = arr.splice(0,x);
	if (arr._multi) start._multi = true;
	let end = arr;
	let linenum = curnum();
	lines[linenum] = start;
	lines.splice(curnum(1), 0, end);
	if (SYNTAX) {
		real_line_colors = [];
	}
	let _y = cy();
    if (!noAct) {
		actions.push(new Action(x, ry, "\n", tm, {isBlockInsert: opts.isBlockInsert}));
	}
	x = 0;
	y++;
	if (y+num_stat_lines == Term.h) {
		scroll_num++;
		y--;
	}
	set_line_lens();
}//»
const enter = (opts={})=>{//«
	if (quit_on_enter){
log("Got line", lines[0].join(""));
quit();
	}
	else if (one_line_mode){
		stat_warn("one_line_mode is on!");
		return;
	}
	let {noBreak}=opts;
	let did_toggle=false;
	no_render=true;
	if (check_if_folded(cy())) {//The current line is folded«
		if (noBreak) {//Want a non-breaking space«
			if (!lines[cy()+1]) {//The fold is sitting on the bottom«
				toggle_cur_fold();
				end();
				enter(opts);
				y--;
				toggle_cur_fold();
//UEJKMNUYJ
				y++;
				set_ry();
				no_render=false;
				return;
			}//»
			no_render=true;
			down();
			enter();
			up();
			no_render=false;
			return;
		}//»
		else {//«
//			toggle_cur_fold();
//			did_toggle=true;
		}//»
	}//»
	else if (noBreak) {
		x = curlen();//x = curln().length;
	}
	do_enter(opts);
//	if (did_toggle) toggle_cur_fold();
	no_render=false;
	set_line_lens();
	render({},47);
	dirty_flag = true;
//	Term.is_dirty = true;
}//»
const newline = (which) =>{//«
	if (one_line_mode){
		stat_warn("one_line_mode is on!");
		return;
	}
	if (which == "o") {
		nobreak_enter({fromNewline: true});
	}
	else {
		x=0;
		mode = INSERT_MODE;
		enter({fromNewline: true});
		y--;
		set_ry();//THE CASE OF THE DEADLY ***NOT*** SETTING OF RY
//FGJKUYTEPOI
	}
	mode = INSERT_MODE;
	render();
}//»
const nobreak_enter = (opts={}) => {opts.noBreak=true;enter(opts);};

const do_backspace = (opts={})=>{//«
	let {noAct, time, noRender, data} = opts;
//    let tm = time || (new Date).getTime();
    let tm = time || act_iter++;
	let have_ch;
	if (fold_mode){//«
		let fold;
		let _cy = cy();
		const do_open=()=>{//«
			let _ry=ry;
			open_fold(fold);
			scroll_to(_ry);
		};//»
		if (fold = check_if_folded(_cy)) {
			if (!(_cy > 0 && !curarr(-1).length)) return stat_warn("Fold detected");
		}
		else if (x == 0 && _cy > 0 && (fold = check_if_folded(_cy-1))) return stat_warn("Fold detected");
	}//»
	if (x > 0) {//«
		let ln = curarr();
		real_line_colors[ry]=undefined;
		have_ch = ln[x-1];
		if (!noAct) {
			actions.push(new Action(x, ry, have_ch, tm, {adv: true, neg: true} ));
		}
		x--;
		ln.splice(x, 1);
		dirty_flag = true;
//		Term.is_dirty = true;
	}//»
	else if (y > 0||scroll_num > 0) {//«
		real_line_colors=[];
		if (y > 0) y--;
		else scroll_num--;
		let thisln = curarr();
		let nextln = curarr(1);
		let n = y + scroll_num;
		if (!thisln.length){
			lines.splice(n, 1);
			if (!lines.length) lines = [[]];
			x=0;
		}
		else {
			lines[n] = thisln.concat(nextln);
			lines.splice(n+1, 1);
			if (!lines.length) lines = [[]];
			x = thisln.length;
		}
		set_line_lens();
		if (!noAct) {
			actions.push(new Action(x, ry, "\n", tm, {neg: true, data} ));
		}
		dirty_flag = true;
//		Term.is_dirty = true;
		set_ry();
	}//»
	if (!noRender) render({},50);
};//»
const backspace = () => {//«
	if (is_normal_mode()) return try_empty_line_del();
	if (mode!==INSERT_MODE) return;
	do_backspace();
	do_syntax_timeout();
}//»

//»
//Keys/Shortcuts«

const handle_press = ch =>{//«
	let mess;
	last_updown = false;
//	let mode = mode;
	if (stat_cb) return stat_cb(ch);

	if (stat_input_type) handle_stat_char(ch);
	else if (mode===INSERT_MODE) {
		print_ch(ch,{fromHandler: true});
	}
	else if (mode===REPLACE_MODE) {
		open_line_if_folded();
		replace_char(ch, {fromHandler: true});
	}
	else if (mode===REF_MODE||mode===SYMBOL_MODE||mode===COMPLETE_MODE) {
		handle_symbol_ch(ch);
	}
	else if (mode===FILE_MODE) handle_file_ch(ch);
	else if (mode===VIS_LINE_MODE||mode===VIS_MARK_MODE||mode===VIS_BLOCK_MODE) {
		handle_visual_key(ch);
	}
	else if (KEY_CHAR_FUNCS[ch]) KEY_CHAR_FUNCS[ch]();
	else unused_keydowns.push(keydown_iter);
	
};//»
const handle_stat_char=ch=>{//«
	if (stat_com_arr===true) {
		stat_com_arr = [];
		return;
	}
	num_completion_tabs = 0;
	stat_com_arr.splice(stat_x, 0, ch);
	stat_x++;
	render({},90);
};//»
const handle_stat_input_keydown = (sym) => {//«
	if (sym=="TAB_"||sym=="TAB_C") {
		let sit = stat_input_type;
		if (PATH_COMPLETER_MODES.includes(sit)) {
//		if (sit===SAVE_AS_MODE) {
			handle_tab_path_completion(sym==="TAB_C", stat_com_arr.join("").trim(), "");
			return; 
		}
		let marr;
		if (sit===":"&&(marr=stat_com_arr.join("").match(/^(w(rite)? +)(.+)$/))){
			return handle_tab_path_completion(sym==="TAB_C", marr[3], marr[1]);
		}
		init_complete_mode({stat: true});
		return;
	}
	num_completion_tabs = 0;
	if (sym=="ENTER_") return handle_edit_input_enter();
	if (sym=="LEFT_"){
		if (stat_x > 0) stat_x--;
	}
	else if(sym=="RIGHT_"){
		if(stat_x<stat_com_arr.length)stat_x++;
	}
	else if (sym == "BACK_") {//«
		if (stat_x > 0) {
			stat_x--;
			stat_com_arr.splice(stat_x, 1);
		} 
		else {
// WYIROSKJ
// Needed to add "is_saving = false" so this file could be saved (without 
// refusing to save and giving the warning: is_saving=true).
			is_saving = false;
			stat_input_type = "";
		}
	}//»
	else if(sym=="DEL_"){if(stat_com_arr.length)stat_com_arr.splice(stat_x,1);}
	else if(sym=="a_C"){
		if(stat_x==0)return;
//		stat_x=0;
	}
	else if(sym=="e_C"){
		if(stat_x==stat_com_arr.length) return;
//		stat_x=stat_com_arr.length;
	}
	else if (sym=="UP_"||sym=="DOWN_") do_history_arrow(sym);
	else{
		let func = KEY_DOWN_FUNCS[sym];
		if (func === init_complete_mode){
			init_complete_mode({stat: true});
		}
		else unused_keydowns.push(keydown_iter);
	}
//	else if (KEY_DOWN_FUNCS[sym])
	render({},98);
};//»
const handle_stat_cb_keydown=(sym)=>{//«
	if (sym.match(/^._S?$/)) return;
	stat_cb(sym);
//	if (sym==="ENTER_") return stat_cb(sym);
};//»

const handle_visual_key=ch=>{//«
	let s;
	let mess;
	let m = mode;
	if (ch==":"||ch=="?"||ch=="/") init_stat_input(ch);
	else if (ch=="n") resume_search(false);
	else if (ch=="x"||ch=="y") {
		let o={};
		if (ch=="y") o.copy=true;
		delete_lines(o);
	}
	else if (m===VIS_LINE_MODE){//«
		if (ch==" ") {
			prepend_space(" ");
		}
		else if (ch=="f"){
			insert_fold();
		}
		else if (ch=="F"){
			insert_fold({multiLine: true});
		}
		else if (ch=="m") insert_multiline_comment();
		else if (ch=="s") insert_line_comments();
		else if (ch=="p") do_pad_lines({padBlankLines: true});
		else if (ch=="t") do_something_to_lines({trim: true});
		else if (ch=="r") do_something_to_lines({regspace: true});
		else unused_keydowns.push(keydown_iter);
	}//»
	else if (m===VIS_MARK_MODE){//«
		if (ch=="|"){
			init_stat_input(ch);
		}
		else if (ch=="*"||ch=="#"){
			if (seltop!==selbot) return;
			let str = curarr().slice(selleft, selright+1);
			if (!str.length) return;
			mode=COMMAND_MODE;
			find_word(str.join(""), {exact: false, reverse: ch==="#"});
		}
		else if (ch=="w"){
			seek_next_word();

		}
		else if (ch=="b"){
			seek_prev_word();
		}
		else unused_keydowns.push(keydown_iter);
	}//»
//	else if (m===VIS_BLOCK_MODE) {
//		if (ch==" ") {
//			prepend_space(" ");
//		}
//		else unused_keydowns.push(keydown_iter);
//	}
	else unused_keydowns.push(keydown_iter);

};//»

//XXXXXXXXXXXX
/*«
const handle_multi_func=(fn)=>{
	let num = parseInt(cur_number_str);
log(`HANDLE MULTI`, num);
log(fn);
	cur_number_str = "";
	for (let i=0; i < num; i++){
		fn();
	}
};»*/
const KEY_CHAR_FUNCS={//«

//	X: do_null_del,
//Edit (Action needed)
	h: left,
	l: right,
	j: down,
	k: up,
	G: end,
///*
	H:()=>{cur_to(0)},
	M:()=>{
		let scrh = scr_h();
		let boty = lines.length - scroll_num;
		let usey = boty < scrh? boty : scrh;
		cur_to(Math.floor(usey/2));
	},
	L:()=>{
		let scrh = scr_h() - 1;
		let boty = lines.length - scroll_num;
		let usey = boty < scrh? boty : scrh;
		cur_to(usey);
//		cur_to(Term.h-1-num_stat_lines);
	},
//*/
	w: seek_next_word,
	e: seek_end_word,

	b: seek_prev_word,

//e: seek end word

	x: handle_ch_del,
	O: ()=>{newline("O")},
	o: ()=>{newline("o")},
	p: ()=>{handle_paste("p", {doFold: true})},//After
	P: ()=>{handle_paste("P", {doFold: true})},//Before

//	D: delete_to_end,
//	T: delete_to_top,
//	B: delete_to_bottom,

	C: try_clipboard_copy,

//No Action needed below

//Undo/Redo
	u: undo,
//	r: redo,
//	U:()=>{undo({single: true})},
//	R:()=>{redo({single: true})},

//Modes

	a: ()=>{ set_edit_mode("a") },
	A: ()=>{ set_edit_mode("A") },
	i: ()=>{ set_edit_mode("i") },
	I: ()=>{ set_edit_mode("I") },
	m: await_mark_command,
	"`":await_jump_command,
	s:()=>{init_symbol_mode({adv: true})},
	S: init_symbol_mode,
	X: init_cut_buffer_mode,

	v: init_visual_marker_mode,
	V: init_visual_line_mode,

//	L: init_line_wrap_mode,
//	e:()=>{
//		init_symbol_mode({ref: true});
//	},
//	E:()=>{
//		init_symbol_mode({ref: true, before: true});
//	},

	r: ()=>{
		open_line_if_folded();
		replace_one_char();
	},
	R:()=>{
		open_line_if_folded();
		mode = REPLACE_MODE;
		render();
	},
	y: ()=>{delete_mode(true)},
	d: delete_mode,
	c: insert_comment,
	z: await_z_command,
	g: await_g_command,
	"/": ()=>{ init_stat_input("/") },
	"?": ()=>{ init_stat_input("?") },
	":": ()=>{ init_stat_input(":") },
	"|": ()=>{ init_stat_input("|") },

//	Y: yank_file,
	f: echo_file_path,

//Find
	n:()=>{resume_search(false)},
//	b:()=>{resume_search(true)},
	"*":()=>{find_word(get_cur_word().word,{exact:true});},
	"#":()=>{find_word(get_cur_word().word,{exact:true,reverse:true});},
	"'":goto_matching_brace,

//Cursor
	"0":()=>{seek_line_start();render();},
	"^":()=>{
		let str = curarr().join("");
		let rv = str.match(/\S/);//Find first non-whitespace
		if (!rv) return;
		x = rv.index;
		render();
	},
	"$":()=>{seek_line_end();render();},

//Scroll
//	g: vcenter_cursor,
//	" ":scroll_screen_to_cursor,
//	"[":scroll_left,
//	"]":scroll_right,
//	"}":()=>{
//		x_scroll_terminal({toRightEdge: true});
//	},
//	"{":()=>{
//		x_scroll_terminal({toLeftEdge: true});
//	},

}//»
const KEY_DOWN_EDIT_FUNCS={//«
	TAB_: tab,
	TAB_S: ()=>{tab({shift: true})},
	TAB_C: ()=>{tab({ctrl: true})},
	TAB_CS: ()=>{tab({shift: true, ctrl: true})},
	DEL_: del,
	BACK_: backspace,
	ENTER_: enter,
	ENTER_C: nobreak_enter,
};//»
const KEY_DOWN_FUNCS={//«
r_C:()=>{
//	e.preventDefault();
	if (!is_normal_mode(true)) return;
	if (mode == INSERT_MODE){
//		cwarn("CTRL_R INSERT");
	}
	else redo();

},
e_C:()=>{
	if (is_edit_mode()) {
		seek_line_end();
		render();
	}
//	else scroll_down(1,{moveCur:true});
},
a_C:()=>{
	if (is_edit_mode()) {
		seek_line_start()
		render();
	}
},
d_C:()=>{scroll_down(Math.floor(Term.h/2));},
y_C:()=>{scroll_up(1,{moveCur:true});},
u_C:()=>{scroll_up(Math.floor(Term.h/2));},

//u_C: do_changecase,
//u_CA: ()=>{do_changecase(true);},

c_CAS:()=>{send_lines_to_gui();},
t_CAS:()=>{send_lines_to_gui(true);},
//Edit (must apply Action)
h_A: insert_hex_ch,
o_A: create_open_fold,
c_A: create_closed_fold,
p_A: try_dopretty,
j_C: do_justify,
l_C: do_line_wrap,
l_A: init_line_wrap_mode,
//Non-editing (No Action needed below)

//KSJTUSHF
x_CA: send_command_to_reload_win,
/*
w_CAS:()=>{//«
//get_all_words();
//cwarn(`GOT: ${ALLWORDS.length} WORDS (MIN_WORD_LEN == ${MIN_WORD_LEN})`);
},//»
s_CAS:()=>{//«
	let vimvars = globals.vim;
	let val = get_edit_str();
	val=`(function(){"use strict";${val}})()`;
	let url = URL.createObjectURL(new Blob([val]));
	let scr = document.createElement('script');
	scr.onload=()=>{
		if (vimvars.curDevScript) {
			document.head.removeChild(vimvars.curDevScript);
		}
		vimvars.curDevScript = scr;
con.log("LOADOKAY!");
	};
	scr.onerror=(e)=>{
log("GOT SYNTAX ERROR???");
cerr(e);
	};
	scr.src = url;
	document.head.appendChild(scr);
},//»
*/
//Init/Toggle modes
p_C: init_complete_mode,
v_C: init_visual_block_mode,
v_CAS: init_auto_visual_line_mode,
j_CAS:()=>{
if (!is_normal_mode(true)) return;
init_auto_visual_line_mode();
do_justify();
},
//p_CAS: Term.togglePaste,
m_CAS: toggle_regex_escape_mode,

//Display
//o_CAS: reset_display,
q_C: syntax_multiline_comments,

//Scroll
// _C: scroll_screen_to_cursor,
//"]_C":scroll_right,
//"[_C":scroll_left,

//Open/Save/Quit
s_C: try_save,
s_CS: try_save_as,
o_C: ()=>{init_stat_input(FILE_OPEN_MODE)},
x_C: maybe_quit,

//Dev

r_CA: toggle_reload_win,
"._CAS": set_tab_size_cb,
j_CA: test_js,
i_CA: write_to_host,
u_CAS:()=>{
undo_all();
},
r_CAS:()=>{
redo_all();
},

/*OLD/WEIRD
s_CAS:async()=>{//«
if (!vim.sendFunc) {
	stat_warn("Sending not enabled");
	return;
}
if (Term.is_dirty) {
	stat_warn("Please save before sending!");
	return;
}
let arr = get_edit_save_arr();
if (detect_fold_error(arr)) {
	return;
}
edit_fobj.unlockFile();
delete Term.curEditNode;
edit_fobj = null;
await vim.sendFunc(arr[0]);
quit();

},//»
z_CAS:()=>{//«
let ln = curarr();
if (ln._fold) return stat_warn("Fold detected");
ln = ln.join("");
let marr;
if (marr = ln.match(/^const +([a-z_]+) *= *(async)?(.*)/)){
let asnc = (marr[2]&&marr[2]+" ")||"";
if (!marr[3].match(/^ *\(/)){
	ln = asnc+marr[1].toCamel()+"("+marr[3].replace(/=>/,")");
}
else{
	ln = asnc+marr[1].toCamel()+""+marr[3].replace(/=>/,"");
}
delete_line(cy());
yank_buffer = [[...ln]];
yank_buffer._type="L";
handle_paste("P");
//stat("Can paste the changed line!");
}
else{
stat_warn("No matches!");
}
}//»
*/
};//»

const LEFTRIGHT_FUNCS={//«
	LEFT_: left,
	RIGHT_: right,
	LEFT_C: seek_prev_word,
	RIGHT_C: seek_next_word,
};//»
const UPDOWN_FUNCS={//«
	UP_:up,
	DOWN_:down,
	PGDOWN_S: () => {
		if (lines[cy() + h - 1]) {
			scroll_num++;
			if (y>0) y--;
			set_ry();
			render({},102);
		}
	},
	PGUP_S: () => {
		if (scroll_num) {
			scroll_num--;
			if (y < h-2) y++;
			set_ry();
			render({},103);
		}
	},
	PGUP_: pgup,
	PGDOWN_:pgdn,
	HOME_:home,
	END_:end
};//»
const LINE_WRAP_SYMS=["DEL_","BACK_","TAB_", "ENTER_", "\x20_C"];

this.onkeyup=(e, sym)=>{//«
//keydown_iter++;
	if (sym==="TAB_") {
		if (reload_win && reload_win._z_hold){
			reload_win.winElem.style.zIndex = reload_win._z_hold;
			delete reload_win._z_hold;
		}
	}
};//»

/*
this.onkeypress=(e, sym, code)=>{//«
keydown_iter++;
	let mode = mode;
		if (code < 32 || code > 126) return;
		if (mode===LINE_WRAP_MODE){
			handle_linewrap_key(sym);
			return;
		}
		return handle_press(sym);
};//»
*/

let keydown_iter=-1;
let unused_keydowns = [];
this.onkeydown=async(e, sym, code)=>{//«
//if (this.autoMode) return;
if (killed) return;
keydown_iter++;

	if (sym.match(/^_[CAS]+$/)) return;
	num_escapes=0;
//	let mode = mode;
	if (e && PREV_DEF_SYMS.includes(sym)) e.preventDefault();
	if (sym.match(/^[\x20-\x7f]_S?$/)) {
		if (mode===LINE_WRAP_MODE){
			handle_linewrap_key(e.key);
			return;
		}
		return handle_press(e.key);
	}
	if (stat_cb) {//«
//		if (sym.match(/^._S?$/)) return;
		stat_cb(sym);
		return;
	}//»
	if (stat_input_type) return handle_stat_input_keydown(sym);
	if (sym=="ENTER_") {//«
		if (mode===COMMAND_MODE) return toggle_cur_fold({useOffset: true});
	}//»
	if (UPDOWN_FUNCS[sym]) {//«
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		if (!last_updown) {
			scroll_hold_x = x;
		}
		last_updown = true;
		check_del_fold_offset();
		UPDOWN_FUNCS[sym]();
		return;
	}//»
	last_updown = false;
	if (mode===REF_MODE||mode===SYMBOL_MODE||mode===COMPLETE_MODE) {
		handle_symbol_keydown(sym);
	}
	else if (mode===FILE_MODE) {
		handle_file_keydown(sym);
	}
	else if (LEFTRIGHT_FUNCS[sym]){
		LEFTRIGHT_FUNCS[sym]();
	}
	else if (mode === LINE_WRAP_MODE){
		if (LINE_WRAP_SYMS.includes(sym)){
			handle_linewrap_key(sym);
		}
		else{
			unused_keydowns.push(keydown_iter);
		}
	}
	else if (KEY_DOWN_EDIT_FUNCS[sym]){//«
		if (mode === INSERT_MODE) {
			KEY_DOWN_EDIT_FUNCS[sym]();
		}
		else if (mode === REPLACE_MODE) {
			if (sym==="TAB_"){
				handle_press("\t");
			}
			else if (sym === "ENTER_") {
				enter();
			}
			else unused_keydowns.push(keydown_iter);
		}
//		else if (mode === VIS_LINE_MODE || mode === VIS_BLOCK_MODE) {
		else if (mode === VIS_LINE_MODE) {
			if (sym==="BACK_") delete_first_space(); 
			else if (sym==="TAB_") prepend_space("\t");
			else unused_keydowns.push(keydown_iter);
		}
		else if (sym==="TAB_") {
			if (reload_win&&!reload_win._z_hold){
				reload_win._z_hold = reload_win.winElem.style.zIndex;
				reload_win.winElem._z = topwin.winElem.style.zIndex+1;
			}
			else unused_keydowns.push(keydown_iter);
		}
	}//»
	else if (KEY_DOWN_FUNCS[sym]) {
		KEY_DOWN_FUNCS[sym]();	
	}
	else{
		unused_keydowns.push(keydown_iter);
	}
}//»

//»

//«Obj/CB

this.onescape=()=>{//«
keydown_iter++;
if (!document.getSelection().isCollapsed){
window.getSelection().removeAllRanges();
return true;
}

//HSRRDFDF
//WHAT TO DO HERE WHEN CANCELLING STAT_CB OF OVERWRITE???
	is_saving = false;
	if (stat_cb){
		if (mode===CUT_BUFFER_MODE) alt_screen_escape_handler();
		else {
			stat_cb = null;
			render();
		}
		return true;
	}
	if (stat_input_type){
		is_saving = false;
		stat_input_type = undefined;
		render();
		return true;
	}
	if (alt_screen_escape_handler){
//CDOKWNFG
		if (mode_hold){
			mode = mode_hold;
//			delete mode_hold;
mode_hold = undefined;
			render();
			return true;
		}
		alt_screen_escape_handler();
		alt_screen_escape_handler = null;
		return true;
	}
	if (mode===INSERT_MODE||mode===REPLACE_MODE){
		mode = COMMAND_MODE;
//log("???", x, curarr().length );
		if (x>0&&x===curarr().length) {

			x--;
//log("!!!", x, curarr().length );
		}
		if (stdin_lines) warn_stdin();
		else render();
		return true;
	}
	if (is_vis_mode()){
		mode = COMMAND_MODE;
		if (stdin_lines) warn_stdin();
		else render();
		return true;
	}
	if (stdin_lines) warn_stdin();
	if (num_escapes<NUM_ESCAPES_TO_ESCAPE){
		num_escapes++;
		return true;
	}
	num_escapes = 0;
	return true;
};
//this.onescape = onescape;

//»
this.onreload =()=>{//«
	if (reload_win && use_devreload){
		ondevreload();
		return;
	}
	quit(true);
};//»
this.save=try_save;
this.checkPaste = val => {//«
	if (mode === INSERT_MODE || stat_input_type) {
		do_paste(val);
	}
	else{
		stat_warn("Not pasting!");
	}
};//»
this.set_allow_paste_cb = () => {//«
	stat_cb = ch=>{
		stat_cb = null;
		if (ch=="n"||ch=="N") {
			stat_message="Cancelled";
			render({},3);
			return;
		}
		else do_paste();
	}
};//»
this.resize=(warg,harg)=>{//«
	w = warg;
	h = harg;
	render({},4);
};//»
//defineProperty«
Object.defineProperty(this,"lines",{get:()=>{
let all = get_edit_lines({str: true});
return all;
}});
Object.defineProperty(this,"isDirty",{get:()=>{return dirty_flag;}});
Object.defineProperty(this,"unusedKeydowns",{get:()=>{return unused_keydowns;}});
Object.defineProperty(this,"initStr",{get:()=>{return initial_str;}});
Object.defineProperty(this,"curStr",{get:()=>{return get_edit_save_arr()[0];}});
Object.defineProperty(this,"isEditing",{get:()=>{
	return mode === INSERT_MODE || mode === REPLACE_MODE;
}
});
Object.defineProperty(this, "getAllSyms",{get:()=>{
for (let k in KEY_DOWN_FUNCS){
log(k);
}
}});
Object.defineProperty(this,"fatalErr",{get:()=>{return killed;}});


//»

//»

//Init«

this.init = async(arg, patharg, o, mods)=>{
initial_str = arg;
let opts;
({opts, symbols}=o);
({pretty}=mods);
//log(pretty);
if (symbols){
SYMBOL_WORDS=symbols.map(w=>w.split(/\s+/)[0]);
}
command_str = o.command_str;
this.comOpts = opts;
this.parSel = opts.parsel;
no_save_mode = opts.nosave;
one_line_mode = opts.one;
quit_on_enter = opts.enterquit;

return new Promise((Y,N)=>{

app_cb = Y;
//this.cb = app_cb;

let len = arg.length;
let linesarg = arg.split(/\r?\n/);
edit_fobj = o.node;

if (edit_fobj) {
	if (edit_fobj.writeLocked()) {
//THROW("WE SHOULD NOT HAVE A WRITE_LOCKED FILE!!!");
topwin._fatal(new Error("This is a 'write locked' file!"));
	}
	else {
		edit_fobj.lockFile();
		Term.curEditNode = edit_fobj;
	}
}
	
//edit_fname = null;
edit_fullpath = patharg;
edit_ftype = o.type;
dirty_flag = false;
Term.actor = vim;
mode = COMMAND_MODE;
this.isEditor = true;

if (patharg) {
	let arr = patharg.split("/");
	edit_fname = arr.pop();
	let ext = edit_fname.split(".").pop();
	if (ext) {
		if (ext.match(/^js(on)?$/i)) SYNTAX = JS_SYNTAX;
		else SYNTAX=NO_SYNTAX;
	}
}

lines=[];
line_colors = [];
real_line_colors = [];
if (fold_mode) {
	lines = get_folded_lines(linesarg, null, true);
	set_line_lens();
}
else{
	for(let ln of linesarg) {
		lines.push(ln.split(""));
	}
}


if (opts.r||opts["dev-name"]||opts["use-dev-reload"]) {
	use_devreload = ondevreload;
cwarn("Using ondevreload");
}
this.fname = edit_fname;

syntax_multiline_comments();
//cwarn(lines.length);
//log(JSON.stringify(lines));

if (opts.insert) set_edit_mode("i");
else if (!edit_fname) {
	if (no_save_mode) render();
	else stat('"New File"');
}
else if (lines.length==1 && !lines[0].length) stat(`"${edit_fname}" [New]`);
else stat_file(linesarg.length, len);


});
/*
setTimeout(async()=>{
	let modret = await util.getMod("util.pretty");
	pretty = modret.getmod().js;
},0);
*/
}
//»
this.addLines=linesarg=>{//«
	let newlines = [];
    if (isArr(linesarg)) {
        for (let i = 0; i < linesarg.length; i++) {
            newlines.push(linesarg[i].split(""));
        }
    }
    else if (isStr(linesarg)) newlines.push(linesarg.split(""));
    else if (isEOF(linesarg)) return;
    else {
cwarn("WHAT KINDA LINESARGGGGG????");
log(linesarg);
return;
    }
	if (!stdin_lines) stdin_lines = newlines;
	else stdin_lines.push(...newlines);

};//»

//»

//}; End vim mod«
}
//»

//«OLD
/*
const vcenter_cursor=()=>{//«
//	let toy = Math.floor((h-num_stat_lines)/2)-1;
	if (y+scroll_num<toy) {
		y += scroll_num;
		scroll_num = 0;
		set_ry();
		return;
	}
	let diff = y - toy;
	if (diff<0) scroll_up(-diff);
	else scroll_down(diff);
	y-=diff;
	set_ry();
	render();
};//»
*/
//»

})();
