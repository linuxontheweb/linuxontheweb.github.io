/*6/9/25: Codifying a standard workflow that works with our vim implementation's "naitivity"
about lines wrapped onto different lines, but that represent a single "logical line" (with
no newlines, e.g. real vim's ":set wrap"). Our util api exports linesToParas, which
transforms the lines array:
["this is line one hermmm", "", "this is line #3, slermmm", "and", "slarr", "1", "2"]

Into the string:
`this is line one hermmm

this is line #3, slermmm and slarr 1 2`


j_CAS: Automate init_auto_visual_line_mode and do_justify (j_C), so that we recover
vim's paragraph justification: "gwip"

t_CAS: Send the entire file, using linesToParas into either a new TextEdit window.
with the text selected, so it can quickly be copied. 

let str = util.linesToParas(get_edit_lines({str: true})).join("\n");
Desk.api.openTextEditor({appArgs: {text: str, selected: true}});

With this workflow, we can create text in vim to be exported in the system's
clipboard in order to, e.g. input into other website's textarea's.

*/
/*6/7/25: FATAL PERFORMANCE BUG (FIXED): WITH LONG LINES, THE RENDERER DOES *NOT* «
CHOP THE LINES, AND THE FULL LINES ARE IN THE DOM, AND FILES WITH VERY LONG LINES 
TAKE FOREVER TO RENDER!!!

Options for being able to use files with arbitrary tabs scattered throughout,
in normal editing mode (LINE_WRAP_MODE will wrap very long lines):
1) ":tab 1" 
2) set_tab_size_cb("1") (via "._CAS"), 

...in order to set the terminal's tab size to 1. This will ensure that the
terminal's "tab naive" implementation of slicing all lines to fit the width
will give proper results, and the cursor will be kept at the right edge when
the cursor has gone beyond it.
»*/
/*1/25/25: When doing Ctrl+p "autocomplete", I don't want the current word«
included, if there are only one of them. So now @WOLMFGHJ, we are passing in
an argument to get_all_words, which tests to see (@DJKUYTKM) if the indexOf
and lastIndexOf values of the given word are the same (which would mean that 
there is only one occurrence of them).

Just updated init_line_wrap_mode, in order to deal with the same 'num_lines'
issue referenced in the note from 12/27/24. There, I reset num_lines just
after calling 'Term.setLines', then I called 'set_line_lens' inside the
alt_screen_escape_handler. THIS IS VERY VERY IMPORTANT QUALITY CONTROL
TYPE STUFF HERE!!!

»*/
//Historical development notes (and old code) are kept in doc/dev/VIM
//«Notes
/*12/29/24: Just did some internal tab detection logic to decide whether it would«
be safe to determine the "graphical" x position by way of multiplying the number
of leading tabs by tab size and then adding the rest of the remaining characters.
Not sure if this is really necessary because this is all about detecting the "physical"
location of the cursor, which is done on a single line basis, every terminal render
cycle.
»*/
//12/28/24: BUG: I WASN'T ABLE TO ESCAPE FROM INSERT MODE!?!?!?!?
/*12/27/24  !!!  IMPORTANT: the 'num_lines' variable  !!!  «
@ZPLROTUS: Here we are exporting num_lines to the terminal's renderer. This variable 
is important because the length of the lines array is different from the logical
number of lines in the file whenever there are folds. So we need to update this
variable (like @CKJEPOIL) whenever the logical number of lines changes (rather than
the length of the lines array).

JUST FIGURED OUT RIGHT NOW WHAT GOT ME THINKING ABOUT THIS YESTERDAY, AND WHAT
WENT WRONG: WHEN GOING INTO DIFFERENT MODES, LIKE SYMBOL_MODE or REF_MODE
@SMKJFHSO, THE num_lines variable is NOT updated... So now @XKLORPT, we are
updating the num_lines, then we are setting it back in alt_screen_escape_handler
@MDKIUTHS. THIS IS SOMETHING WE WILL NEED TO LOOK FOR IN OTHER MODES THAT
ARE LIKE THIS (SUCH AS FILE_MODE and COMPLETE_MODE)!!!!!!!!!.

OKAY, THIS IS STARTING TO LOOK OK BECAUSE WE JUST WENT INTO COMPLETE_MODE AND
ADDED num_lines = lines.length and set_line_lens() in the relevant places.

Let't do a hotkey that turns
const blah_hoo_hi=(...)=>{
to
blahHooHi(...){
...
»*/
/*12/26/24: Now, REF_MODE, invoked by 'e' (paste after)  or 'E' (paste before),«
in order to insert functions (or anything else that allows for "stringification") 
that are "exported" via globals.refs.<SOME_NS>. We currently flatten out all the
namespaces of globals.refs onto cur_refs (which potentially overwrites
references with the same name that are "exported" by other apps/mods/coms/etc).
»*/
/*12/25/24: Just found out that you do r_CA in order to begin to create«
an application while editing your file, which should at least have this:

LOTW.apps["local.<AppNameHere>"] = function(Win){
}

If your file is named "Something.js", vim will figure out that <AppNameHere> is
"Something". Otherwise, if you are in a new file state, you must explicitly pass 
the "dev-name" flag, like so:
~$ vim --dev-name="Something" 

Then, I use "x_CA" to send a background command into the terminal, which is currently
just the path to a shell script, because scripts are what get sent through the 
development parsing pathway, which I'm using a local LOTW file (RUNTIME.js, now being
saved in lotw/zzhold/writes, which can be done in dev_mode via i_CA=>write_to_host)
in order to develop.

To summarize:

r_CA: to begin the process of local app development, with this module's 'reload_win' variable 
set to the window under development.

r_A: to use vim's own ondevreload in order to call reload_win.reload().
(This still works even if the terminal's own ON_DEVRELOAD == false.)

x_CA: Sends either DEF_BACKGROUND_COMMAND or the most recent command line sent
via the new ':x command --line here', which is really currently just for
sending scripts (rather than actual command lines of internal JS commands) into
Term.execute_background_command.

i_CA: Saves the currently edited file to lotw/zzhold/writes/<FileNameHere>.

j_CA: Attempts to create a non-evaluating script (wrapped in a ()=>{}) in order
to check for syntax errors (via test_js), using window.onerror.

»*/
//12/24/24: I want to send backgrounded commands to the terminal here.«
let DEF_BACKGROUND_COMMAND = "./hoom.sh";
//»
/*12/17/24: Yesterday I created the 'goto_matching_brace' functionality«
that attempts to find the matching "}","]" or ")" when a "{", "[", or "("
is under the cursor (and vice versa). Use it with the "'" key.
»*/
/*12/15/24: Now, need to create a hotkey to add a class called 'Runtime'«
on LOTW.globals.ShellMod. We'll do this by doing URL.createObjectURL
on the text in here...

Down in KEY_DOWN_FUNCS @KSJTUSHF, I just made a command to refresh the
"completer words" list (via w_CAS) and another to do that thing I just talked
about above (via s_CAS). Then it puts the curDevScript var onto it. Putting
this onto global was because we are often changing/reloading/refreshing vim.js
(this file) itself while working all this stuff out.

I'm also going to want a hotkey here to run commands into a terminal. By doing
it *that* way we can send the commands directly into a "dev" pathway in the
terminal. 

Now I'm thinking about using my console only for "major" errors like (SyntaxError),
and using other pathways (in-line with the LOTW system) to do debugging of complex 
objects that are currently output through console.log(...).

»*/
/*11/30/24: While doing "visual line select" in "file mode", it gave an«
error like: "yank_buffer is not iterable" when trying to do a weird
operation like do_line_wrap, so @WUIOPHMDL, we are checking for the
mode_hold variable, and then returning. I guess "file mode" was only to
be for line selection/"yanking" purposes (rather than any kind of editing).

In delete_lines @KOPLIERT, we are checking for the existence of the 'copy'
attribute, when mode_hold === FILE_MODE;

Perhaps we should have:
const vis_line_edit_ok=()=>{
	if (this.mode === VIS_LINE_MODE && this.mode_hold !== FILE_MODE) return true;
	return false;
};
»*/
/*11/29/24: When going into alternate modes, there is not a global varible called«
'hold_lines', where we keep the actual editor lines.
»*/
/*11/20/24: Reading the comments below (from ~2.5 weeks ago), I had a hard time«
"decifering" them. They now seem to me to be very abstract, and of very little "real
world" utility value. I have just dropped in a file with tons of fold markers in them
(0xab and 0xbb), but these are not understood as the actual text characters for the
open an fold characters, which are (presumably) utf8-encoded as 0xc2 0xab and 0xc2 0xbb.
In other words, the only characters that have a one-byte representation in the binary
layer are lower-ascii. So I need to find a simple solution here for changing the non-utf8
encoded characters of 0xab and 0xbb to the utf8-encoded forms described above.
»*/
/*11/3/24«
All functions whose only input is an array of lines and don't require any state
information from the editor (or whatever other kinds of applications might want
a transformation function) can be offloaded into an external scope, and then
imported in. These can even exist as strings of text, to have 'new Function'
called on them (we can do a simple scan so that no "dangerous" global words,
like 'window', 'document', 'navigator', 'eval', 'btoa', 'Function' or partial matches
of 'key', 'mouse', 'touch', 'code', 'crypt' are in these strings).

These should be attached to an "imports" object, so that they can easily be referenced via
string. Then we need a key bindings object that associates these function names with a
keysym. Actually, I don't know why we distinguish between keydown and keypress functions.
Everything should be keydown (i.e. handle_ch_del, which is applied in handle_press, as a
member of KEY_CHAR_FUNCS with the 'x' key should rather be applied in).

»*/
/*11/1/24«

Need to disambiguate between *internal* and *external* functions, and allow for
the arbitrary rebinding of keys to the external ones. The external ones should
have a standard interface, i.e. they are handed an array of lines, and should
return another array. These lines will typically be sliced from the original,
after the user does some visual selection (lines, marker, or block).

Want a decently long setInterval (every ~60sec) that checks when the last
destructive edit was done (given where dirty_flag is set to true), and does
various tasks such as auto saving/generating new word lists.  Now we have
Desk.api.allKeysUp, so we can check if that is true before doing any kind of
"major" tasks (we don't want to interrupt anyone who is currently inputting (or
doing) anything (maybe as fast as possible by holding a key or keys down). The
only problem here is if the user changes browser window focus between the keydown
and keyup events (will just need to wait until that specific keys has another
keyup with that key while the browser window is in focus).

»*/
//»
//Imports«

//import { util, api as capi } from "util";
const util = LOTW.api.util;
//import { globals } from "config";
const globals = LOTW.globals;
const{
dev_mode,
ShellMod,
TERM_STAT_TYPES,
VIM_MODES,
}=globals;
const{isArr, isStr, isEOF, log, jlog, cwarn, cerr, consoleLog: con}=LOTW.api.util;
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
//log(C);
//const{log:clog, nlog: cnlog}=consoleLog;
const{fs,FS_TYPE,SHM_TYPE,NS}=globals;
const fsapi = fs.api;
const {widgets} = NS.api;
const {popkey, popok, poperr} = widgets;
const LO2HI = (a, b)=>{if(a>b)return 1;else if (a<b)return -1;return 0;};
const HI2LO = (a, b)=>{if(a>b)return -1;else if (a<b)return 1;return 0;};
const NOOP=()=>{};
const NUM=(v)=>Number.isFinite(v);


//»

//Vim«

//export const mod = function(Term) {«
export const mod = function(Term) {
//»

//Imports«
this.comName="vim";
const{
	cur_dir,
	refresh,
//	onescape,
	topwin,
//	quit_new_screen,
//	x_scroll_terminal,
//	get_dir_contents,
//getDir
	Desk
} = Term;

let{
w,h, cursor_id, mainWin
} = Term;
//»
//Var«

const vim = this;

let appclass = "editor";
let hold_screen_state;
let actions=[];
let undos=[];

let fold_mode = true;
//let fold_mode = false;

//let FOLD_MARKERS_IN_TERM_WIDTH = true;
let FOLD_MARKERS_IN_TERM_WIDTH = false;

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
const PREV_DEF_SYMS=["TAB_", "j_C", "v_C", "l_C"];

//const OK_DIRTY_QUIT = true;
const OK_DIRTY_QUIT = false;
const QUIT_WHEN_DIRTY_DEFAULT_YES=true;

const MIN_COMPLETE_WORD_LEN = 4;

const MARKS={};

let initial_str;

let cut_buffers = [];

let add_splice_lines = 0;
let splice_hold;

let is_root = false;

let app_cb;

let reload_win;
let hold_overrides;

let yank_buffer;
/*«
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
let num_lines;

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
let pretty = null;
let cur_background_command;

//Any changes to the mode variables MUST be updated in Terminal.js @XKIUO
//WKOIPUHN
const COMMAND_OR_EDIT_MODES=[
	COMMAND_MODE,
	INSERT_MODE,
	REPLACE_MODE
];
//const NO_EDIT_MODES = [LINE_WRAP_MODE];

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

let symbol_len;

let ALLWORDS;
let ALLWORDSYMBOLS;
let ALLWORDS_HASH;
let SYMBOLS;
let SYMBOL_WORDS;

//»
//Util«

const render = (opts={}, which) =>{//«
	if (no_render) {
//	if (no_render||undo_redo_all_mode) {
		return;
	}
	if (SYNTAX===JS_SYNTAX)	js_syntax_screen();
if (x < 0){
cerr(`WHY IS x(${x}) < 0? `);
x=0;
}
	this.opts = opts;
	maybe_scroll();
	Term.refresh();
}//»

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
const THROW=s=>{throw new Error(s);};
const is_command_or_edit_mode=()=>{return COMMAND_OR_EDIT_MODES.includes(this.mode);};

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
	if (!(this.mode===VIS_MARK_MODE||this.mode===VIS_BLOCK_MODE)) return;
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
log(`cy: ${_cy}, y: ${y}, scroll_num: ${scroll_num}`);
cwarn(`_cy === lens.length: ${_cy === lens.length}`);
log(lens);
//EDPOPLKIUK
		throw new Error("WHAT IS RY DOING BEING UNDEFINED???????");
	}
};//»
const set_line_lens = ()=>{//«
	if (!fold_mode) {
		num_lines = lines.length;
		return;
	}
	num_lines = 0;
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
	num_lines = start;
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
//	this.stat_input_type = null;
	x=0;y=0;scroll_num=0;
	this.mode = COMMAND_MODE;
	set_ry();
	stat_warn("Display reset");
//	render({},107);
};//»
const at_screen_bottom = () => {return y === Term.h - num_stat_lines - 1;};
const at_file_end = ()=>{return y+scroll_num === lines.length - 1;};
const timestr=(stamp)=>{//«
	let msdiff = (new Date).getTime() - stamp;
	let secsago = Math.floor(msdiff/1000);
	if (secsago < 60) return `${secsago} secs ago`;
	let daysago = Math.floor(msdiff/86400000);
	let str = ((new Date(stamp))+"").split(" ")[4];
	if (daysago) str = `${str} (${daysago} days ago)`;
	return str;
};//»
const try_clipboard_copy=()=>{//«
//This lets you use Ctrl+v to copy vim's yank_buffer SOMEWHERE ELSE ON YOUR COMPUTER
	if (!yank_buffer) return;
	let s = '';
	for (let ln of yank_buffer) s+= ln.join("")+"\n";
	Term.clipboard_copy(s);
};//»
const echo_file_path=()=>{//«
	let nm = edit_fname ? edit_fname : "New File"
	if (lines.length==1 && !lines[0].length) stat(`"${nm}"`);
	else stat_file(num_lines, get_edit_save_arr()[0].length);
};//»
const try_dopretty=async()=>{//«
	if (pretty) return do_pretty();
//	if (!(is_normal_mode(true)||visual_line_mode)) {
	if (!(is_normal_mode(true)||this.mode === VIS_LINE_MODE)) {
		stat_warn("Pretty printing requires normal, insert or visual lines!");
		return;
	}
	stat("Loading the pretty module...");
	let modret = await util.getMod("util.pretty");
	if (!modret) return stat_render("No pretty module");
	stat("Done");
	pretty = modret.getmod().js;
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
const quit=(if_reload)=>{//«
	delete this.command_str;
	Term.is_dirty = false;
	Term.is_editing = false;
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
	Term.quitNewScreen(hold_screen_state, {reload: if_reload});
//	quit_new_screen(hold_screen_state);
//log(quit_new_screen);
};//»
const warn_stdin=()=>{stat_warn(`stdin: ${stdin_lines.length} lines`);};
const onescape=()=>{//«
	if (stat_cb){
		if (this.mode===CUT_BUFFER_MODE) alt_screen_escape_handler();
		else {
			stat_cb = null;
			render();
		}
		return true;
	}
	if (this.stat_input_type){
		is_saving = false;
		this.stat_input_type = null;
		render();
		return true;
	}
	if (alt_screen_escape_handler){
		alt_screen_escape_handler();
		alt_screen_escape_handler = null;
		return true;
	}
	if (this.mode===INSERT_MODE||this.mode===REPLACE_MODE){
		this.mode = COMMAND_MODE;
		if (x>0&&x===(curarr().length)) x--;
		if (stdin_lines) warn_stdin();
		else render();
		return true;
	}
	if (is_vis_mode()){
		this.mode = COMMAND_MODE;
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
};//»

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
	let m = this.mode;
	return (m===VIS_LINE_MODE || m===VIS_MARK_MODE || m===VIS_BLOCK_MODE);
};//»
const is_normal_mode = edit_ok => {//«
	if (this.stat_input_type) return false;
	let m = this.mode;
	if (edit_ok) return (m===INSERT_MODE || m === COMMAND_MODE);
	return m === COMMAND_MODE;
//	if (edit_ok) return (!(m===VIS_LINE_MODE || m===VIS_MARK_MODE || m===VIS_BLOCK_MODE || this.stat_input_type));
//	return (!(m===INSERT_MODE || m===VIS_LINE_MODE || m===VIS_MARK_MODE || m===VIS_BLOCK_MODE || this.stat_input_type));
};//»
/*
const is_normal_mode = edit_ok => {//«
	let m = this.mode;
	if (edit_ok) return (!(m===VIS_LINE_MODE || m===VIS_MARK_MODE || m===VIS_BLOCK_MODE || this.stat_input_type));
	return (!(m===INSERT_MODE || m===VIS_LINE_MODE || m===VIS_MARK_MODE || m===VIS_BLOCK_MODE || this.stat_input_type));
};//»
*/
const maybe_quit=()=>{//«
//	if (!edit_fobj || viewOnly || OK_DIRTY_QUIT || !dirty_flag) return quit();
	if (!edit_fobj || OK_DIRTY_QUIT || !dirty_flag) return quit();
	if (QUIT_WHEN_DIRTY_DEFAULT_YES) stat_message = "Really quit? [Y/n]";
	else stat_message = "Really quit? [y/N]";
	render({},18);
	stat_cb = (ch)=>{
		stat_cb = null;
		if (ch=="y"||ch=="Y") return quit();
		if (QUIT_WHEN_DIRTY_DEFAULT_YES){
			if (ch=="ENTER_") return quit();
		}
		render({},19);
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
	if (!addx) return ln[x];
	return ln[x+addx];
}//»
const set_sel_end = () => {//«
	let m = this.mode;
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
	if (ch=="a"&&curch()) x++;
	this.mode = INSERT_MODE;
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

const check_if_folded=(num)=>{//«
    if (!fold_mode) return false;
    if (!num && num!==0) num = cy();
	let ln = lines[num];
	if (!ln){
		return false;
	}
    return ln._fold;
}//»
const toggle_if_folded=()=>{//«
	if (fold_mode && lines[cy()]._fold) {
		toggle_cur_fold();
	}
}//»
const create_open_fold=()=>{//«
	let _ry = cy();
	print_chars(`//${OPEN_FOLD_CHAR}`,{ins: true});
	render();
}//»
const create_closed_fold=()=>{//«
	print_chars(`//${END_FOLD_CHAR}`,{ins: true});
	render();
}//»
const have_open_fold_marker=(ln)=>{//«
	if (FOLD_MARKERS_IN_TERM_WIDTH){
		return (ln.slice(0, w).indexOf(OPEN_FOLD_CHAR)) > -1;
	}
	return ln.indexOf(OPEN_FOLD_CHAR) > -1;
};//»
const have_end_fold_marker=(ln)=>{//«
	if (FOLD_MARKERS_IN_TERM_WIDTH){
		return (ln.slice(0, w).indexOf(END_FOLD_CHAR)) > -1;
	}
	return ln.indexOf(END_FOLD_CHAR) > -1;
};//»
const have_fold_marker=(ln)=>{return have_open_fold_marker(ln)||have_end_fold_marker(ln);};
const open_all_folds = (if_keep_y) => {//«
	let hold_y = ry;
	for (let ln of lines) {
		if (ln._fold) {
			open_fold(ln._fold, {noInnerFolds: true});
		}
	}
	if (if_keep_y) scroll_to(hold_y);
};//»
const reinit_folds=()=>{//«
	x=y=scroll_num=0;
	lines=get_folded_lines(get_edit_lines({str: true}));
	set_line_lens();
	line_colors=[];
	Term.setLines(lines, line_colors);
};//»

const await_fold_command=()=>{//«
	stat_cb=c=>{
		stat_cb=null;
		if (c=="o"||c=="O"){
			if (!curfold()) return;//if (!curln(true)._fold) return;
			toggle_cur_fold({noInnerFolds: c=="O"});
		}
		else if (c=="m"){
			reinit_folds();
		}
		else if (c=="a"){
			open_all_folds();
		}
		render({},40);
	};
	stat("fold");
}//»
const await_mark_command=()=>{//«
	stat_cb=c=>{
		stat_cb=null;
		MARKS[c]=ry;
		render({},40);
	};
	stat("mark");
}//»
const await_jump_command=()=>{//«
	stat_cb=c=>{
		stat_cb=null;
		let num = MARKS[c];
		if (Number.isFinite(num)) {
			if (num >= num_lines) num = num_lines-1;
			scroll_to(num);
		}
		else stat(`'${c}': Mark not set`);
//		render();
	};
	stat("goto");
}//»

const open_fold = (lnsarg, opts={})=>{//«
	let {noInnerFolds, useOffset} = opts;
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
	let _y = ry;
	open_fold(ln._fold);
	scroll_to(_y);
};//»
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
const close_fold = (i, offset) =>{//«
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
const toggle_reload_win=async()=>{//«
if (!use_devreload){
stat_warn("ondevreload was not enabled!");
return;
}
	if (reload_win){
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
		reload_win = null;
		stat("'reload_win' deleted");
		return;
	}

	let devname = this.comOpts["dev-name"] || (edit_fobj && edit_fobj.baseName);
	if (!devname){
		stat_err("Must give 'dev-name' argument or save the file!");
		return;
	}
	let appname = `local.${devname}`;
	if (LOTW.apps[appname]){
		stat_err(`The app name: ${appname} is already in use!`);
		return;
	}
	reload_win = await Desk.api.openApp(appname, {dataUrl: URL.createObjectURL(new Blob([`(function(){"use strict";${get_edit_str()}})()`]))});
	if (!reload_win){
		stat_err("Could not get the window");
		return;
	}
	reload_win.ownedBy = topwin;
	topwin.childWins.push(reload_win);
};//»
const reload_dev_win=async()=>{//«
//Want to be able to pass in a command line flag to delete the local app/mod
//that we are editing in this file.
	if (!reload_win) {
stat_warn(`No "reload window" was found! (use Ctrl+Alt+r)`);
		return;
	}
	if (!reload_win._data_url){
cwarn("NO RELOAD_WIN._DATA_URL!!?");
	}
	else{
		URL.revokeObjectURL(reload_win._data_url);
	}
	stat("Reloading...");
	let rv = await reload_win.reload({noShow: true, dataUrl: URL.createObjectURL(new Blob([`(function(){"use strict";${get_edit_str()}})()`]))});
	stat("Done!");
}/*»*/
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
	if (edit_fullpath&&!if_saveas) return edit_save();
	init_stat_input("Save As: ");
	render({}, 110);
};//»
const try_save_as=(opts={})=>{//«
	if (!edit_fullpath) return try_save();
	try_save(true);	
};//»
const edit_save = async(if_nostat, com_opts={})=>{//«
	let write_err = "";
	const write_cb_func = async(ret)=>{//«
		if (ret) {
//We were doing a "save as" from another file, so we need to unlock it since we
//aren't using that file anymore
			if (edit_fobj_hold){
				edit_fobj_hold.unlockFile();
				edit_fobj_hold = null;
			}

			let {node} = ret;
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
				stat_message = `${edit_fname} ${numlines+add_splice_lines}L, ${ret.size}C written${write_err}`;
			}
			else{
	log("Saved",ret.size);
			}
			dirty_flag = false;
			Term.is_dirty = false;
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
		return !Term.is_dirty;
	};//»
	let arr = get_edit_save_arr();
	if (detect_fold_error(arr)) {
		is_saving = false;
		return;
	}
	let val = arr[0];
	let numlines = arr[1];
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
			Term.is_dirty = false;
		}
		is_saving = false;
		render();
		return;
	}
	let opts={retObj: true};
	let usepath = edit_fullpath;
	let OK_TYPES=[FS_TYPE];
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
	if (!edit_fobj) {
		rv = await fsapi.saveFsByPath(usepath, val, opts);
if (!(rv&&rv.node)){
stat_err("There was a problem writing the file (see console)");
cwarn("Here is the returned value from saveFsByPath");
log(rv);
return;
}
	}
	else {
		let par = edit_fobj.par;
		if (par.type === FS_TYPE && !await fsapi.checkDirPerm(par)){
			stat_err("Permission denied");
			return;
		}
		rv = await edit_fobj.setValue(val, opts);
if (!(rv&&rv.node)){
stat_err("There was a problem writing the file (see console)");
cwarn("Here is the returned value from node.setValue");
log(rv);
is_saving = false;
return;
}
	}
	return write_cb_func(rv);
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
	if (!(rtype==FS_TYPE||rtype==SHM_TYPE)) return `Cannot create file type: ${rootobj.type}`;
	if (!fs.check_fs_dir_perm(parobj,is_root)) return `Permission denied: ${fname}`;
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
name = name.replace(/^~\x2f/, `${globals.home_path}/`);
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
	let sim = this.stat_input_type;
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
	this.stat_input_type = which;
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
	let ch = ln[use_x];
	if (!ch.match(/\w/)) return {word: null};
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
	if(!num_completion_tabs) {/*«*/
		if (gotpath.match(/^\//)){
			let arr = gotpath.split("/");
			usename = arr.pop();
			usedir = ("/"+arr.join("/")).regpath();
		}

		else if (gotpath.match(/^~\//)){
			let arr = gotpath.split("/");
			arr.shift();
			usename = arr.pop();
			usedir = (globals.home_path+arr.join("/")).regpath();
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
	}/*»*/
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

	let inp_type = this.stat_input_type;
	this.stat_input_type = null;
	let com = stat_com_arr.join("").trim();

	if (inp_type=="Save As: ") save_as(com);
	else if (inp_type=="Open: ") init_file_mode(com);
	else if (inp_type==":") {//«
		if (!com) return render({},86)
		this.command_history.unshift(com);
		let marr;
//SPOLUITJ
if (marr = com.match(/^(%)?s(b)?\/(.*)$/)){//«
	if (this.mode===VIS_LINE_MODE && marr[1]){
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
			Term.execute_background_command(cur_background_command);
			render();
			return;
		}
		else if (marr = com.match(/^tab +(.*)$/)){
			let num = marr[1];
			if (Term.setTabSize(num)) return stat_ok(`Tab size is set to: ${num}`);
			stat_err("Error: invalid tab size");
			return;
		}
		else if (this.mode===VIS_LINE_MODE){
//			stat_err("Invalid command in visual line mode");
			stat_err("Unknown command: " + com);
			return;
		};
		if (com=="q"||com=="quit")maybe_quit();
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
		let n = parseInt(com)-1;
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
	this.mode = VIS_LINE_MODE;
	for (let _y = cy(); _y >= 0; _y--){
		let ln = lines[_y];
		if (ln._fold) continue;
		if (ln.join("").match(/^[\s\t]*$/)){
			break;
		}
		edit_sel_start=seltop = _y;
	}
	for (let _y = cy(1); _y < lines.length; _y++){
		let ln = lines[_y];
		if (ln._fold) continue;
		if (ln.join("").match(/^[\s\t]*$/)){
			break;
		}
		selbot = _y;
	}
	x=0;
	scroll_to(realy(seltop), {noSetSel: true});
//	scroll_to(real_seltop(), {noSetSel: true});
	render();
}//»
const init_visual_line_mode=()=>{//«
	if (!is_normal_mode()) return;
	this.mode = VIS_LINE_MODE;
	edit_sel_start=seltop=selbot=cy();
	render({},96);
};//»
const init_visual_marker_mode = () =>{//«
	if (!is_normal_mode()) return;
	if (fold_mode){
		if (have_fold()) return stat_warn("Fold detected. Not starting visual marker mode.");
	}
	this.mode = VIS_MARK_MODE;
	cur_pos = mark_pos = {x, y: cy()};
	edit_sel_start=seltop=selbot=cy();
	edit_sel_mark=selleft=selright=x;
	render();
};//»
const init_visual_block_mode=()=>{//«
	if (!is_normal_mode()) return;
	if (have_fold()) return stat_warn("Fold detected. Not starting visual mode.");
	this.mode=VIS_BLOCK_MODE;
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
		Term.setLines(lines, []);
		render();
	};

	let hx=x,hy=y,hscr=scroll_num;
	x=y=scroll_num=0;
	let hold_fold = fold_mode;
	fold_mode = false;
/*No need to set the global 'lines' variable since we are not (currently) using any
functions outside of this scope.
*/
	hold_lines = lines;
	lines = cut_buffers[0];
	Term.setLines(lines, []);
	alt_screen_escape_handler = no_render => {//«
		stat_cb = null;
		alt_screen_escape_handler = null;
		x=hx;
		y=hy;
		scroll_num = hscr;
		set_ry();
		fold_mode = hold_fold;
		lines = hold_lines;
		hold_lines = null;
		Term.setLines(lines, line_colors);
		this.mode = COMMAND_MODE;
		if (!no_render) render();
	};//»
	this.mode = CUT_BUFFER_MODE;
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
	let sym = this.symbol;
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
	y=scroll_num=0;
	set_ry();
	Term.setLines(lines, []);
	num_lines = lines.length;
	render();
};//»
const handle_symbol_ch=ch=>{//«
	if (!ch.match(/\w/)) return;
	this.symbol+=ch;
	update_symbols();
	render();
};//»
const handle_symbol_keydown=(sym)=>{//«
	if (sym.match(/^._/)) return;
	if (sym==="ENTER_"){
		return enter_cb();
	}
	if (sym=="BACK_"){
		let sym = this.symbol;
		let len = sym.length
		if (!len) return;
		if (symbol_len && len===symbol_len) return;
		sym=sym.slice(0, len-1);
		this.symbol = sym;
		update_symbols();
		render();
	}
};//»

let cur_refs;

const init_symbol_mode = (opts={})=>{//«
//SMKJFHSO
	let ln = curarr();//let ln = curln(true);
	if (ln._fold) {
		stat_warn("Fold detected");
		return;
	}
	this.symbol="";

	if (opts.ref){//«
		if (!this.comOpts.refs) return stat_warn("Must use the --refs option!");
		cur_refs = globals.refs[this.comOpts.refs];
		if (!cur_refs) stat_err(`${this.comOpts.refs}: not found in globals.refs!?!?`);
		SYMBOLS = Object.keys(cur_refs).sort();
		this.mode = REF_MODE;
	}//»
	else{//«
		get_all_words();
		this.mode = SYMBOL_MODE;
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
	if (ln.length && opts.adv) x++;
	x=y=scroll_num=0;
	let hold_fold = fold_mode;
	fold_mode = false;
	lines = [];
	for (let w of SYMBOLS){
		if (w.length) lines.push([...w]);
	}
	Term.setLines(lines, []);
//XKLORPT
	num_lines = lines.length;
	enter_cb = () => {//«
		if (this.mode===SYMBOL_MODE) {
			let ln = lines[y+scroll_num].join("").split(/\s+/)[0];
			enter_cb = null;
			alt_screen_escape_handler(true);
			if (ln&&ln.length) print_chars(ln,{ins:true});
			render();
		}
		else if (this.mode===REF_MODE){
			let nm = lines[y+scroll_num].join("").split(/\s+/)[0];
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
		}
	};//»
	alt_screen_escape_handler = no_render => {//«
		alt_screen_escape_handler = null;
		x=hx;
		y=hy;
		fold_mode = hold_fold;
		scroll_num = hscr;
		lines = hold_lines;
		hold_lines = null;
		line_colors = hold_colors;
		Term.setLines(lines, line_colors);
//		set_ry();
//MDKIUTHS
		set_line_lens();
		this.mode = COMMAND_MODE;
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
	let sit_hold = this.stat_input_type;
	let stat_x_hold = stat_x;
	let mode_hold = this.mode;
	this.mode = COMPLETE_MODE;
	delete this.stat_input_type;
	x=y=scroll_num=0;
	fold_mode = false;
	lines = [];
	this.symbol = wrd;
	symbol_len = wrd.length;
	for (let w of matches){
		if (w.length) lines.push([...w]);
	}
	Term.setLines(lines, []);
	num_lines = lines.length;
	enter_cb = () => {//«
		let ln = lines[y+scroll_num].join("").split(/\s+/)[0];
		enter_cb = null;
		alt_screen_escape_handler(true);
		if (ln&&ln.length) try_print(ln)
	};//»
	alt_screen_escape_handler = no_render => {//«
		this.stat_input_type = sit_hold;
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
		Term.setLines(lines, line_colors);
//		set_ry();
		set_line_lens();
		this.mode = mode_hold;
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
	let str = await fname.toText({cwd:Term.cwd});
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
	Term.setLines(lines, line_colors);
	set_line_lens();
	this.mode = COMMAND_MODE;
	if (!no_render) render();
};//»

if (fold_mode) lines = get_folded_lines(arr);
else {
	lines = [];
	for(let ln of arr) lines.push(ln.split(""));
}
Term.setLines(lines, []);
set_line_lens();
this.mode = FILE_MODE;
render();

};//»
const handle_file_ch=ch=>{//«
log("FILE CH", ch);
};//»
const handle_file_keydown=(sym)=>{//«

const init_line_mode = () => {//«
	this.mode_hold = FILE_MODE;
	this.mode = VIS_LINE_MODE;
	edit_sel_start=seltop=selbot=cy();
	render({},96);
};//»
const init_marker_mode = () => {//«
	if (fold_mode){
		if (have_fold()) return stat_warn("Fold detected. Not starting visual mode.");
	}
	this.mode_hold = FILE_MODE;
	this.mode = VIS_MARK_MODE;
	cur_pos = mark_pos = {x, y: cy()};
	edit_sel_start=seltop=selbot=cy();
	edit_sel_mark=selleft=selright=x;
	render();
};//»
const init_block_mode = () => {//«
	if (have_fold()) return stat_warn("Fold detected. Not starting visual mode.");
	this.mode_hold = FILE_MODE;
//	this.mode_hold = mode_hold;
	this.mode=VIS_BLOCK_MODE;
	edit_sel_start=seltop=selbot=cy();
	edit_sel_mark=selleft=selright=x;
	render({},101);
};//»

	if (sym==="RIGHT_") right();
	else if (sym==="LEFT_") left();
	else if (sym==="ENTER_") toggle_cur_fold();
	else if (sym==="v_C") init_block_mode();
	else if (sym==="v_") init_marker_mode();
	else if (sym==="v_S") init_line_mode();
//init_block_mode();

};//»

//»
//Line wrap«

let line_wrap_y;
let num_line_wrap_actions;
const init_line_wrap_mode=()=>{//«
//NFYYRHSLKH
//	let ln = curln(true);
//	let ln = curln();
	let ln = curarr();
	if (ln._fold){
		return stat_warn("Please unfold first!");
	}
	ln = ln.join("");
	if (ln.match(/\xac/)) return stat_warn(`metacharacter detected (\xac)`);
	line_wrap_y = ry;
	let hold_fold = fold_mode;
	fold_mode = false;
	hold_lines = lines;
	let _w = Term.w;
	if (!ln.length){lines=[[]];}
	else {
		lines = [];
		ln = ln.replace(/\t/g,"\xac").split("");
		while (ln.length) {
			lines.push([...ln.splice(0,_w)]);
		}
	}
	let hx=x,hy=y,hscr=scroll_num;
	let _cy = hy+hscr;
	scroll_num = 0;
	y = Math.floor(hx/Term.w);
	x = hx%Term.w;
	Term.resetXScroll();
	Term.setLines(lines, []);
	num_lines = lines.length;
	num_line_wrap_actions = 0;
	alt_screen_escape_handler = async if_enter => {//«
		if (if_enter) {
			let ln = lines.flat().join("");
			ln = ln.replace(/\xac/g,"\t");
			hold_lines[_cy] = ln.split("");
			x = this.line_wrap_x;
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
//		set_ry();
		Term.setLines(lines, line_colors);
		set_line_lens();
		this.mode = COMMAND_MODE;
		render();
//		scroll_screen_to_cursor();
	};//»
	this.mode = LINE_WRAP_MODE;
	render();
};//»
const handle_linewrap_key=(sym)=>{//«

if (sym=="ENTER_"){
	alt_screen_escape_handler(true);
	return;
}
//TSKJLDLJS
if (sym==="SPACE_C"){//«
	if (cy()==lines.length-1){
		let ln = curarr();
		if (x==ln.length-1){
			if (curch()==" ") return;
			if (x===Term.w-1){
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
		actions.push(new Action(this.line_wrap_x, line_wrap_y, " ", Date.now(), {adv: true}));
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
	actions.push(new Action(this.line_wrap_x, line_wrap_y, origsym, Date.now(), {adv: true}));
	num_line_wrap_actions++;
	if (ln.length > Term.w){
		let ch = ln.pop();
		let iter=0;
		while (ch){
			if (cy(iter)===lines.length-1){
				lines.push([]);
			}
			iter++;
			ln = curarr(iter);
			ln.unshift(ch);
			if (ln.length > Term.w) ch = ln.pop();
			else ch = null;
		}
	}
	x++;
	if (x===Term.w) {
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
		x=Term.w-1;
	}
	else x--;
}//»
else if (sym=="DEL_"){}
else{
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
actions.push(new Action(this.line_wrap_x+add1, line_wrap_y, have_ch, Date.now(), { adv, neg: true} ));
num_line_wrap_actions++;

let _cy = cy();

if (_cy===lines.length-1){//«
	if (x === ln.length){
		if (x>0) x--;
		else if (_cy > 0){
			up();
			lines.pop();
			x = curlen()-1;//x = curln().length-1;
			if (x<0) x=0;
		}
	}
}//»
else if (ln.length === Term.w-1){//«
	for (let i=1; ln = lines[_cy+i]; i++) {
		let ch = ln[0];
		if (ch) {
			ln.splice(0,1);
			lines[_cy+i-1].push(ch);
			if (!ln.length) lines.splice(i+1, 1);
		}
	}
}//»

render();

};
//»

//»

//»
//Move/Scroll«

const check_cursor = ()=>{//«
return new Promise((Y,N)=>{
let cur = document.getElementById(cursor_id);
if (!cur) return Y(null);
let intobs = new IntersectionObserver((ents)=>{
    ents.forEach(ent => {
        let d = ent.target;
        if (ent.isIntersecting) {
			Y(true);
        }
        else{
			Y(cur.getBoundingClientRect());
        }
		intobs.unobserve(cur);
    });
}, {
    root: mainWin,
    rootMargin: '0px',
    threshold: 1.0
});
intobs.observe(cur);
});
};//»
/*
const scroll_screen_to_cursor=async()=>{//«
	let rv = await check_cursor();
//log(rv);
	if (rv===true) return;
	if (rv===null) return;
	let xpos = rv.x;
	let val;
	if (xpos>0)val = -(xpos-mainWin.clientWidth+100);
	else if (xpos < 0) val = -(xpos-100);
//log(val);
	if (!val) return;
	x_scroll_terminal({amt: val});
};//»
const scroll_left=()=>{//«
	x_scroll_terminal({left: true});
};//»
const scroll_right=()=>{//«
	x_scroll_terminal({right: true});
};//»
*/
const maybe_scrdown_one = () => {//«
    if (y < Term.h-num_stat_lines) return false;
    scroll_num++;
    y--;
    return true;
};//»
const maybe_scrup_one = () => {//«
    if (!scroll_num || y >= 0) return false;
    scroll_num--;
    y++;
    return true;
};//»
const maybe_scroll = () =>{//«
    if (maybe_scrdown_one()){
        while (maybe_scrdown_one()){}
        return;
    }
    while (maybe_scrup_one()){}
};//»

const check_del_fold_offset=()=>{//«
	let ln = curarr();
	if (ln._fold) {
		delete ln._fold._offset;
		delete ln._fold._x_offset;
	}
};//»
const warn_if_fold_visual=()=>{//«
//	if (fold_mode && (visual_block_mode || visual_mode)){
	if (fold_mode && (this.mode===VIS_BLOCK_MODE || this.mode === VIS_MARK_MODE)){
		stat_warn("Paging keys not available in this mode");
		return true;
	}
	return false;
}//»
const check_visual_up = () =>{//«
//	if ((visual_mode||visual_block_mode) && fold_mode && cy() > 0){
	if (((this.mode===VIS_BLOCK_MODE || this.mode === VIS_MARK_MODE)) && fold_mode && cy() > 0){
		if (have_fold(-1)) return stat_warn("Fold detected");
	}
	return true;
};//»
const check_visual_motion=if_down=>{//«
//	if ((visual_mode||visual_block_mode) && fold_mode && ((if_down && cy() < lines.length-1)||(!if_down && cy()>0))){
	if ((this.mode===VIS_BLOCK_MODE || this.mode === VIS_MARK_MODE) && fold_mode && ((if_down && cy() < lines.length-1)||(!if_down && cy()>0))){
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
	x = curlen();//x = curln().length;
	if (this.mode!==INSERT_MODE && x > 0) {
		x--;
	}
	set_sel_end();
}//»

const adjust_cursor=()=>{//«
	let ln = curarr();//let ln = curln(true);
	if (ln._fold) {
		x=0;
		return;
	}
	let usex;
	if (last_updown) usex = scroll_hold_x;
	else usex = x;

	if (usex > ln.length) x = ln.length;
	else x = usex;
}//»
const home=()=>{//«
	if (warn_if_fold_visual()) return;
	y = scroll_num = 0;
	adjust_cursor();
	set_sel_end();
	set_ry();
	render({},55);
}//»
const end=()=>{//«
	if (warn_if_fold_visual()) return;
	scroll_num = lines.length-1;
	y=0;
	adjust_cursor();
	set_sel_end();
	set_ry();
	render({},56);
}//»
const seek_prev_word=()=>{//«
	let addi=0;
	for (let i=0;;i--) {
		let ch1 = curch(i-2);
		let ch2 = curch(i-1);
		if (!ch1){
			if (ch2&&ch2.match(/\w/)){
				if (this.mode !== LINE_WRAP_MODE) break;
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
			x = curarr().length;
			seek_prev_word(true);
			return;
		}
		x=0;
	}
	set_sel_mark();
	render({},51);
};//»
const left = ()=>{//«
	if (x > 0) {
		x--;
	}
	else if (cy() > 0){
		if (this.mode === LINE_WRAP_MODE){
			up();
			x = curarr().length-1;
		}
	}
/*«
	else {
		if (this.mode!==INSERT_MODE) return;
		if (y > 0) {
			if (!up_one_line(true)) return;
			y--;
		}
		else if (scroll_num > 0) {
			if (!up_one_line(true)) return;
			scroll_num--;
		}
	}
»*/
	set_sel_mark();
	render({},52);
}//»
const seek_next_word = (if_from_continue)=>{//«
	const try_next=()=>{
		if (cy() < lines.length-1) {
			down();
			x=0;
			seek_next_word(true);
		}
		else{
			x--;
			if (x<0) x=0;
			render();
		}
	};
	toggle_if_folded();
	if (!curch()) {
		try_next();
		return;
	}
	let addi=0;
	for (let i=1;;i++) {
		let ch1 = curch(i-1);
		if (ch1&&if_from_continue && ch1.match(/\w/)) {
			if (this.mode !== LINE_WRAP_MODE) {
				addi--;
				break;
			}
		}
		let ch2 = curch(i);
		if (!ch2) break;
		if (ch1&&ch1.match(/\s|\W/)&&ch2.match(/\w/)) break;
//		if ((ch1===" "||ch1=="\t")&&(ch2!==" "&&ch2!="\t")) break;
		addi++;
	}
	x+=addi+1;
	if (x==curarr().length) return try_next();
	set_sel_mark();
	render({},53);
}//»
const right = ()=>{//«
	toggle_if_folded();
//	if (edit_insert){
	if (this.mode===INSERT_MODE){
		if (curch(1)||curch()) {
			x++;
			render({},54);
		}
	}
	else if (!curch(1)) {
		if (this.mode === LINE_WRAP_MODE){
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
const vcenter_cursor=()=>{//«
	let toy = Math.floor((h-num_stat_lines)/2)-1;
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
const pgup=()=>{//«
	if (warn_if_fold_visual()) return;
	if (scroll_num == 0) {
		if (y > 0) {
//CDKLOPOE
//VERY VERY TRICKY BUG HERE WHEN Y WAS SET AND RETURNING WITHOUT CALLING SET_RY()!!!!!
			y = 0;
			set_ry();//<---!!!!!!!!!!!!!!!!!!! THIS WASN'T HERE BEFORE !!!!!!!!!!!!!!!

			adjust_cursor();
			set_sel_end();
			render({},57);
		}
		return;
	}
	if (scroll_num - h > 0) {
		scroll_num -= h;
	}
	else scroll_num = 0;
	adjust_cursor();
	set_sel_end();
	set_ry();
	render({},58);
}//»
const scroll_up = (n, opts={} )=>{//«
/*XMJKUYHGT«
HERE LIES THE PREVIOUS VERSION THAT TOOK A LITTLE WHILE TO FIX...
the point being that Y and SCROLL_NUM must fit together like a well-oiled Italian glove

const scroll_up = (n, opts={} )=>{//«
	let {moveCur, noRender, noSetSel}=opts;
	if (scroll_num - n < 0) return;
	scroll_num-=n;
	if (moveCur) {
		y+=n;
		let maxy = h-num_stat_lines-1;
		if (y > maxy) {
			y = maxy;
		}
	}
//	adjust_cursor();
	if (!noSetSel) set_sel_end();
	if (!noRender) render();
	return true;
};//»
»*/

	let {moveCur, noRender, noSetSel}=opts;
	if (scroll_num - n < 0) return;
	scroll_num-=n;
	if (moveCur) {
		y+=n;
		let maxy = h-num_stat_lines-1;
		let diff = y - maxy;
		if (diff > 0) {
			scroll_num += diff;
			y = maxy;
		}
	}
	set_ry();
	if (!noSetSel) set_sel_end();
	if (!noRender) render();
	return true;
};//»
const scroll_down = (n, opts={}) => {//«
//THROW("SHOULD NOT CALL SCROLL_DOWN!!!");

	let {moveCur}=opts;
	if (scroll_num + n >= lines.length) {
		if (scroll_num + y < lines.length-1) {
			y = lines.length-1-scroll_num;
			adjust_cursor();
			set_sel_end();
			set_ry();
			render({},59);
		}
		return;
	}
	scroll_num += n;
	if (scroll_num + h - num_stat_lines > lines.length) {
		scroll_num = lines.length - h + num_stat_lines;
		if (scroll_num < 0) scroll_num = 0;
	}
	if (moveCur) {
		y-=n;
		if (y < 0) y=0;
	}
	adjust_cursor();
	set_sel_end();
	set_ry();
	render({},60);
};//»

const pgdn=()=>{//«
//log("Not doing page down");
	if (warn_if_fold_visual()) return;
	scroll_down(h - num_stat_lines);
}//»
const up_one_line=(if_seek_end)=>{//«
	let _y = cy();
	let ln = lines[_y-1];
	if (!ln) {
		if (y>0) return true;
		return false;
	}
//	if (!check_visual_motion(false)) return;
	let usex = scroll_hold_x;
	if (if_seek_end) x = ln.length;
	else if (usex >= ln.length) {
//		if (edit_insert) x = ln.length;
		if (this.mode===INSERT_MODE) x = ln.length;
		else if (ln.length) x = ln.length-1;
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
		render({},61);
	}
	else if (scroll_num > 0) {
		if (!up_one_line()) return;
		scroll_num--;
		if (check_if_folded()) x=0;
		set_sel_end();
		render({},62);
	}
	set_ry();
}//»
const down = ()=>{//«
	if (!(y + scroll_num < lines.length-1)) return;
	let ln = lines[y + scroll_num + 1];
	if (y+num_stat_lines < h-1) y++;
	else scroll_num++;
	let usex = scroll_hold_x;
	if (check_if_folded()) x=0;
	else if (usex >= ln.length) {
		if (this.mode===INSERT_MODE) x = ln.length;
		else if (ln.length) x = ln.length-1;
		else x=0;
	}
	else x = usex;
	set_sel_end();
	set_ry();
	render({},63);
}//»

const scroll_to = (num, opts={})=>{//«
//openFoldHits means that we should open up folds that we have scrolled to
const check_ry=()=>{//«
	let llen= lines.length;
	let _cy = y+scroll_num;
//log(`_cy(${_cy}) < llen(${llen})`);
	if (_cy < llen) {//«
		set_ry();
		if (ry===num){
//log(`OK: ${ry} === ${num}`);
		}
		else{
render();
THROW(`ry(${ry+1}) !== num(${num+1})`);
		}
	}//»
	else if (_cy === llen) {//«
		if (fileChomp) {
//log("Have file chomp...");
			lines.push([]);
			set_line_lens();
			if (ry !== num){
render();
THROW(`ry(${ry+1}) !== num(${num+1})`);
			}
		}
		else{//«
log("UNDOS");
log(undos);
log("ACTIONS");
log(actions);
log("CUR_UNDO");
log(cur_undo);
render();
THROW(`!!! cy (${_cy}) === lines.length (${llen}) (no fileChomp) !!!`);

		}//»
	}//»
	else{//«
render();
THROW(`!!! cy (${_cy}) > lines.length (${llen}) !!!`);
	}//»
}//»
//cwarn("SCROLL_TO", num);
	no_render = true;
	let { openFoldHits, allowInnerFolds , doRender, fileChomp } = opts;
	let llen = lines.length;
	let end_ry = realy(llen-1);
	let last_ln = lines[lines.length-1];
	if (num > end_ry && last_ln._fold) {
		if (num===end_ry+last_ln._foldlen && fileChomp){
		}
		else {
			open_fold(last_ln._fold);
		}
	}
	let nlines = Term.h - num_stat_lines;
	let lines_to_bot = scroll_num + nlines - 1;
	let diff = lines_to_bot - llen;
	if (diff > 0) lines_to_bot -= diff+1;
	let realtop = realy(scroll_num);

//First we need to check to see if the line is on the current screen.
//If so, we just want to set the y value without scrolling
//If the number we are looking for is before the bottom and after the top
	let realbot = realy(lines_to_bot);
	if (num >= realtop && num <= realbot) {//«
		for (let i=0; i < nlines; i++){
//			let n = realy(realtop+i);<----- WRONG!!!!!!!!!!!!!!
			let n = realy(scroll_num+i);
			if (n===undefined) break;
			if (n < num) continue;//Keep going
			else if (n > num) break;
			let ln = lines[scroll_num+i];
			y=i;
			set_ry();
			check_ry();
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
VCJKLOPLF
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

	check_ry();//This caused a THROW 

	no_render = false;
	if (doRender) render();
};//»
const open_folds_in_line_range = (nlines) => {//«
//Ensure that an entire range of lines starting from cy() are clear of folds.
	let _cy = y+scroll_num;
	for (let i=0; i <= nlines; i++){
		let ln = lines[i+_cy];
		if (!ln) {
if (i+_cy === lines.length) return;
log(lines);
THROW(`No line found: in lines[${i+_cy}] (i=${i}, cy=${_cy})`);
		}
		if (ln._fold){
			open_fold(ln._fold, {noInnerFolds: false});
		}
	}
};//»

//»
//Search/Replace«

let cur_search;
let escape_regex_metachars = true;
//let escape_regex_metachars = false;

const toggle_regex_escape_mode=()=>{//«
	escape_regex_metachars = !escape_regex_metachars;
	Term.do_overlay(`RegEx escape mode: ${escape_regex_metachars?"on":"off"}`);
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

const try_word_match=(ln, word, if_exact, xoff)=>{//«
	let lnstr;
	if (isStr(ln)) lnstr = ln;
	else lnstr = ln.join("");
	lnstr = lnstr.slice(xoff);
	if (!lnstr) return;
	if (escape_regex_metachars) word = escape_metachars(word);
	if (if_exact) return (new RegExp("\\b"+word+"\\b")).exec(lnstr);
	return (new RegExp(word)).exec(lnstr);
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
		if (ln._fold) {
			let rv = find_word_in_fold_lines(ln._fold, wrd, if_exact, 0, if_rev, stack, iter);
			if (rv) {
				iter.i+=i;
				stack.push(ln._fold);
				return rv;
			}
		}
		let rv = try_word_match(ln, wrd, if_exact, 0);
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
	cur_search = {word, exact, reverse, noAdv, endY};
	y = y+scroll_num;
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
		if (iter >= 1000000){
throw new Error("INFLOOP WUT WUT HARHARHAR");
		}
		let ln = lines[y];
		if (ln._fold){//«
			let stack = [ln._fold];
			let iter={i:0};
			let rv = find_word_in_fold_lines(ln._fold, word, exact, is_first?x:0, reverse, stack, iter);
			if (rv){
				got_match = true;
				for (let f of stack) open_fold(f);
				if (is_first) x+=rv.index;
				else x=rv.index;
				y+=iter.i;
				break;
			}
			is_first = false;
		}//»
		else {//«
			let rv = try_word_match(ln, word, exact, is_first?x:0);
			if (rv){
				got_match = true;
				if (is_first) x+=rv.index;
				else x=rv.index;
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
		}
		else {
			y++;
			if (y===lines.length) {
				y=0;
				did_wrap = true;
			}
		}
		set_ry();
		if (ry===start_ry){
			break;
		}
		else if (Number.isFinite(end_ry) && ry === end_ry){
			break;
		}
	}//»
	scroll_num = y;
	y=0;
	set_line_lens();
	let mess;
	if (exact) mess=`<${word}>`
	else if (!escape_regex_metachars) mess=`/${word}/`;
	else mess=`"${word}"`
	if (!got_match) mess = `${mess} (no matches)`;
	else if (did_wrap) mess = `${mess} (wrapped)`;
	if (is_vis_mode()) set_sel_end();
	stat(mess);

}//»

const get_confirmation = (lno, ind, len, out)=>{//«
	return new Promise((Y,N)=>{
		stat_cb = (ch)=>{
			stat_cb = null;
			if (ch=="q") return Y(null);
			else if (ch=="n") return Y(false);
			else if (ch=="y") Y(true);
		};
//		visual_block_mode = true;
		this.mode=VIS_BLOCK_MODE;
		edit_sel_start=seltop=selbot=lno;
//		x=selleft;
		selleft=ind;
		selright=ind+len-1;
		stat_message = "replace with '"+out+"' (y/n/q)?";
//		render({noCursor:true}, 68);
		render();
//		visual_block_mode = false;
		this.mode=COMMAND_MODE;
	});
};//»
//const search_and_replace = async(arr, if_entire_file, if_exact_word)=>{
const search_and_replace = async(arr, opts={})=>{//«
	let if_entire_file = opts.file;
	let if_exact_word = opts.exact;
	let num_replaced = 0;
//Var«

//Using a single time means that for confirming replacements, we are using the
//time that this function was called rather than the time that the confirmation
//was done.
	let time = Date.now();
	let do_num_lines;
	let xoff = 0;
	let perm_x_off = 0;
	let last_slice_to;
	let hold_slice_to;
	let slice_to;
	let mode = this.mode;
//»
	//Parse the regex string and compile it with new RegExp«

	let pat=[];
	let sub=[];
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
			else sub.push({esc:ch1});
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
		else if (!have_pat) sub.push(ch);
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
	let pat_str="";
	for (let c of pat){
		if (c.esc) pat_str+="\\"+c.esc;
		else pat_str+=c;
	}
	if (if_exact_word) pat_str = `\\b${pat_str}\\b`;
	let sub_str="";
	for (let c of sub){
		if (c.esc) sub_str+="\\"+c.esc;
		else sub_str+=c;
	}
	if (escape_regex_metachars) pat_str = escape_metachars(pat_str);
	//log(pat_str);
	let re;
	let modstr="";
	let is_global;
	let is_confirming;	
	if (mods.includes("c")) is_confirming = true;
	if (mods.includes("g")) {
		is_global = true;
	}
	if (mods.includes("i")) modstr+="i";
	try {
		re = new RegExp(pat_str, modstr);
	}
	catch(e){
	cerr(e);
		set_ry();
		stat_err(e.message);
		return;
	}
	//»
	if (is_vis_mode()){//«
/*
All slice_to's must be adjusted according to the difference between the match and 
sub_str lengths.
*/
		if (mode===VIS_BLOCK_MODE){
			xoff = perm_x_off = selleft;
			slice_to = selright+1;
			hold_slice_to = slice_to;
		}
		else if (mode===VIS_MARK_MODE){
			let [x1, y1, x2, y2] = get_marker_coords();
			xoff = x1;
			last_slice_to = x2+1;
		}
		open_all_sel_folds();
		do_num_lines = selbot - seltop + 1;
		scroll_to(realy(seltop));
	}//»
	else{//«
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
	for (let i=0; i < do_num_lines; i++){//«
		let lnarr = lines[y+scroll_num];
		let lnstr = lnarr.join("");
		let is_last_line = i+1===do_num_lines;
		let marr;
		if (is_last_line && last_slice_to) slice_to = last_slice_to;
		if (slice_to) lnstr = lnstr.slice(xoff, slice_to);
		else lnstr = lnstr.slice(xoff);
		if (!(marr = re.exec(lnstr))) {
			if (i+1 == do_num_lines) break;
			scroll_to(ry+1);
			xoff = perm_x_off;
			if (hold_slice_to) slice_to = hold_slice_to;
			continue;
		}
		let ind = marr.index;
		let len = marr[0].length;
		let usex = ind+xoff;
		if (is_confirming){//«
			x = usex;
			render();
//			await scroll_screen_to_cursor();
			let rv = await get_confirmation(y+scroll_num, usex, len, sub_str);
			if (rv === true){}
			else if (rv === null) break;
			else if (rv === false){//«
				if (is_global){//«
					xoff+=ind+len;
					i--;
					continue;
				}//»
				xoff = perm_x_off;
				if (i+1 == do_num_lines) break;
				scroll_to(ry+1);
				if (hold_slice_to) slice_to = hold_slice_to;
				continue;
			}//»
			else{//«
log(rv);
THROW("What is the return value from get_confirmation?");
			}//»
		}//»
//ZMKLOPIJH
		let buf = lnarr.splice(usex, len);
		num_replaced++;
		actions.push(new Action(usex, ry, [buf], time, {neg: true, ins: true}));
		lnarr.splice(usex, 0, ...sub_str);
		actions.push(new Action(usex, ry, [[...sub_str]], time, {ins: true}));
		if (is_global){//«
			let diff = sub_str.length - len;
			if (is_last_line && last_slice_to) last_slice_to += diff;
			else if (slice_to) slice_to += diff;
			xoff+=ind+sub_str.length;
			i--;
			continue;
		}//»
		xoff = perm_x_off;
		if (hold_slice_to) slice_to = hold_slice_to;
		if (i+1 == do_num_lines) break;
		scroll_to(ry+1);
	}//»
	this.mode=COMMAND_MODE;
	set_ry();
	stat(`Replaced: ${num_replaced}`);
//	render();

};//»

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

//»
//Undo/Redo«

const do_undo = (chg)=>{//«
	let ch = chg.ch;
	let len = ch.length;
	let {neg, ins, adv, isBlock, opts, keepFirst, fileChomp} = chg.opts;
	let act;
	x = chg.x;
	if (isStr(ch)) {
		if (ch=="\n"){//«
			if (neg) {
				do_enter({noAct: true});
			}
			else {
				x=0;
				open_prev_line_if_folded();
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
				if (fileChomp) keepFirst = true;
				let arr;
				if (fold_mode) arr = get_folded_lines(ch);
				else arr = dup(ch);
				lines.splice(y+scroll_num, keepFirst ? 1 : 0, ...arr);
			}//»
		}//»
		else{//«
			if (isBlock){//«
//				let {pads, newlines} = chg.opts;
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
/*«
				for (let i=0; i < newlines; i++){
					let ln = lines[lines.length-1];
					if (ln.length){
//MVHUIJKO
jlog(ln);
cerr(`Have ln.length with ${i}/${newlines} newlines`);
break;
					}
					lines.pop();
					y--;
				}
»*/
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
							lines[_y-1] = lines[_y-1].concat(rem.slice(ch[to].length));
						}
						else{
							lines.splice(_y, 1);
						}
					}
				}
			}//»
			else if (keepFirst){
				lines[y+scroll_num] = [];
				if (ch.length > 1){
					lines.splice(y+scroll_num+1, ch.length-1);
				}
			}
			else {
				let got = lines.splice(y+scroll_num, ch.length);
				if (fileChomp) {
					y--;
				}
			}
		}//»
		set_line_lens();
	}
}//»
const do_redo = (chg) => {//«
	let ch = chg.ch;
	let len = ch.length;
	let {neg, ins, adv, isBlock, opts, keepFirst, fileChomp} = chg.opts;
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
				if (len > 1) curarr().splice(x, len);//if (len > 1) curln(true).splice(x, len);
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
						}
						else{
							lines.splice(_y+i, 1);
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
				lines[y+scroll_num] = [];
				if (len > 1) {
					lines.splice(y+scroll_num+1, len-1);
				}
			}
			else {
				lines.splice(y+scroll_num, len);
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
							_y++;
						}
						else if (i===to){
							let arr = ch[to].concat(rem);
							lines.splice(_y, 0, [...arr]);
						}
						else{
							let arr = ch[i];
							lines.splice(_y, 0, [...arr]);
						}
					}
				}
			}//»
			else{//«
				if (fileChomp) keepFirst = true;
				let arr;
				if (fold_mode) arr = get_folded_lines(ch);
				else arr = dup(ch);
				lines.splice(y+scroll_num, keepFirst ? 1 : 0, ...arr);
			}//»
		}//»
		set_line_lens();
	}
}//»

const undo = (o={}) => {//«
//log("UNDO!");
//log(actions.length);
const _end = ()=>{//«
	stat_message = `Undo change from: ${timestr(tm)}`;
	set_ry();
	real_line_colors=[];
	if (x>0 && x===curarr().length) {
		x--;
	}
	render();
	do_syntax_timeout();
}//»
	let {time, chr, single}=o;//«
	let chg = actions.pop();
	if (!chg) {
		scroll_num=x=y=0;
		set_ry();
		stat("Initial state")
		validate_initial_str();
		return false;
	}
	cur_undo = chg;
	let tm = chg.time;
	let ch = chg.ch;
	let openFoldHits;
	let {neg, prependSpace, selTop, selBot, fileChomp, isLines, isViz} = chg.opts;
	if (prependSpace) openFoldHits = false;
	else openFoldHits = true;
	let usey;
	let usex;
	if (ch=="\n") {
		if (neg) {
			usex = chg.x;
			usey = chg.y;
		}
		else {
			usex = 0;
			usey = chg.y+1;
		}
	}
	else {
		if (prependSpace) usey = selTop
		else usey = chg.y;
		usex = chg.x;
	}//»
	x = usex;
//log(`ry(${ry}) !== usey(${usey})`);
	if (ry !== usey) {//«
		scroll_to(usey, {openFoldHits, fileChomp});
if (ry !== usey){
THROW(`Could NOT scroll_to ${usey}`);
}
	}//»
//XKJMNHGY
	if (isViz) open_folds_in_line_range(ch.length);
	if (prependSpace){//«
		let scroll_num_hold = scroll_num;
		let yhold = y;
		open_folds_in_line_range(selBot - selTop);
		scroll_to(chg.y);
		let a = chg;
		while (tm === a.time){//«
			let diff = ry - a.y;
			if (diff == 1) {
				y--;
				ry--;
				actions.pop();
			}
			else if (diff == -1) {
				y++;
				ry++;
				actions.pop();
			}
			else if (diff){
throw new Error(`WHAT IS THIS DIFF IN PREPENDSPACE 1111: ${diff}`);
			}
			undos.push(a);
			do_undo(a);
			a = actions[actions.length-1];
			if (!(a&&a.opts.prependSpace)) break;
		}//»
		y = yhold;
		scroll_num = scroll_num_hold;
	}//»
	else {//«
		undos.push(chg);
		do_undo(chg);
		if (!actions.length || single) return _end();
		let a = actions[actions.length-1];
		let c = a.ch;
		if (isStr(ch)&&ch.length==1){//«
			if (ch === "\n"){//Consecutive newlines«
				if (neg){
//Redoing a deleted newline
					while (c === "\n" && a.opts.neg && a.y === ry - 1){
						actions.pop();
						undos.push(a);
						do_undo(a);
						a = actions[actions.length-1];
						if (!a) break;
						c = a.ch;
					}
				}
				else {
	//Delete a previous newline
					while (c === "\n" && !a.opts.neg && a.y === ry-1 && !check_if_folded(-1)){
						actions.pop();
						undos.push(a);
						do_undo(a);
						a = actions[actions.length-1];
						if (!a) break;
						c = a.ch;
					}
				}
			}//»
			else {//Adjacent characters on the same line«
				while(a.y == ry && isStr(c) && c.length == 1 && c !== "\n" && (a.x == x || a.x == x-1 || a.x == x+1)) {
//				while(a.y == ry && a.opts.neg === neg && isStr(c) && c.length == 1 && c !== "\n" && (a.x == x || a.x == x-1 || a.x == x+1)) {
					actions.pop();
					undos.push(a);
					do_undo(a);
					a = actions[actions.length-1];
					if (!a) break;
					c = a.ch;
				}
			}//»
		}//»
		else{//«
//			while (a.y===ry && a.time===tm){
			while (a.time===tm){
				actions.pop();
				undos.push(a);
				if (a.y!==ry){
					scroll_to(a.y);
				}
				do_undo(a);
				a = actions[actions.length-1];
				if (!a) break;
			}
		}//»
	}//»
	return _end();

};//»
const redo = (o={}) => {//«

const _end = ()=>{//«
	stat_message = `Redo change from: ${timestr(tm)}`;
	real_line_colors=[];
	set_ry();
	if (x>0 && x===curarr().length) x--;
	render();
	do_syntax_timeout();
	return true;
}//»

let {time, chr, single}=o;//«
let chg = undos.pop();
if (!chg) {
	stat("Current state")
	return false;
}
let tm = chg.time;
let ch = chg.ch;
let openFoldHits;
let {neg, prependSpace, selTop, selBot, fileChomp, isLines, isViz, isBlockInsert} = chg.opts;
if (prependSpace) openFoldHits = false;
else if (isLines && !neg) openFoldHits = false;
else openFoldHits = true;
x = chg.x;
if (chg.y !== ry){
	scroll_to(chg.y, {openFoldHits, fileChomp});
if (chg.y !== ry){
log(fileChomp, chg.y, ry);
log(lines);
THROW(`Could NOT scroll_to ${chg.y}`);
}
//	undos.push(chg);
//	stat(`Set for redo on line ${ry+1}`);
//	return;
}
//»
//QLKMNYUHY
if (isViz) open_folds_in_line_range(ch.length);
if (prependSpace){//«
	let scroll_num_hold = scroll_num;
	let yhold = y;
	open_folds_in_line_range(selBot - selTop);
	let u = chg;
	while (tm === u.time){
		let diff = ry - u.y;
		if (diff == 1) {
			y--;
			ry--;
			undos.pop();
		}
		else if (diff == -1) {
			y++;
			ry++;
			undos.pop();
		}
		else if (diff){
throw new Error(`WHAT IS THIS DIFF IN PREPENDSPACE 2222: ${diff}`);
		}
		actions.push(u);
		do_redo(u);
		u = undos[undos.length-1];
		if (!(u&&u.opts.prependSpace)) break;
	}
	scroll_num = scroll_num_hold;
	y=yhold;
}//»
else {//«
	actions.push(chg);
	do_redo(chg);
	if (!undos.length || single) return _end();
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
//		while (u.y===ry && u.time===tm){
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

}//»

return _end();

};//»

/*
let undo_redo_all_mode = false;
const undo_all=async()=>{//«
	if (!is_command_or_edit_mode()) return;
	undo_redo_all_mode = true;
	while (actions.length) undo();
	undo_redo_all_mode = false;
	reinit_folds();
	stat("Initial state");
	validate_initial_str();
};//»
const redo_all=async()=>{//«
	if (!is_command_or_edit_mode()) return;
	undo_redo_all_mode = true;
	while (undos.length) redo();
	undo_redo_all_mode = false;
	stat("Current state");
};//»
*/

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
//	visual_line_mode = true;
	this.mode = VIS_LINE_MODE;
	seltop=0;
	selbot=lines.length-1;
	delete_lines({copy:true});
	stat("Yanked file");
};//»

const insert_hex_ch=()=>{//«
	let s='';
	stat_cb = ch => {
		if(ch=="ENTER_"){
			stat_cb = null;
			if (s) {
				print_ch(eval('"\\u{'+s+'}"'));
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
		this.mode=INSERT_MODE;
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
//	if (!edit_insert) return;
	if (this.mode!==INSERT_MODE) return;
//	if (visual_line_mode) delete_first_space();
	if (this.mode===VIS_LINE_MODE) delete_first_space();
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
		let ln = lines[i];
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
cwarn("no valid whitespace char found");
return;
			}
		}
		else if (ln[usex]!==have_ch){
cwarn("char not the same");
return;
		}
	}
	return have_ch;

};//»

const prepend_space=(ch)=>{//«
	let usex;
	if (this.mode===VIS_BLOCK_MODE) usex = selleft;
	else usex = 0;
	let tm = Date.now();
	let real_seltop = realy(seltop);
	let real_selbot = realy(selbot);
	open_all_sel_folds();
	for (let i=seltop,iter=0; i<= selbot; i++,iter++) {
		real_line_colors[real_seltop+iter]=undefined;
		let ln = lines[i];
		ln.splice(usex,0,ch);
		actions.push(new Action(usex, real_seltop+iter, ch, tm, {prependSpace: true, selTop: real_seltop, selBot: real_selbot}));
	}
	if (this.mode===VIS_BLOCK_MODE) {
		selleft++;
		selright++;
		x++;
	}
	render({},17);
	dirty_flag = true;
	Term.is_dirty = true;
};//»
const delete_first_space=()=>{//«
	let usex;
	if (this.mode===VIS_BLOCK_MODE) {
		if (selleft === 0) return;
		usex = selleft-1;
	}
	else usex = 0;
	let tm = Date.now();
	let real_seltop = lens[seltop];
	let real_selbot = lens[selbot];
	let use_ch = open_all_sel_folds({checkVisual: true, usex});
	if (!use_ch) return;
	for (let i=seltop,iter=0; i<= selbot; i++,iter++) {
		real_line_colors[real_seltop+iter]=undefined;
		lines[i].splice(usex, 1);
		actions.push(new Action(usex, real_seltop+iter, use_ch, tm, {prependSpace: true, selTop: real_seltop, selBot: real_selbot, neg: true}));
	}
	if (this.mode===VIS_BLOCK_MODE) {
		selleft--;
		selright--;
		x--;
	}
	render();
	dirty_flag = true;
	Term.is_dirty = true;
};//»
const try_empty_line_del=()=>{//«
	if (!curlen()){//if (!curln(true).length){
//		edit_insert=true;
		this.mode = INSERT_MODE;
		no_render=true;
		down();
		do_backspace();
//		edit_insert=false;
		this.mode = COMMAND_MODE;
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
	let lns = val.split("\n");
	yank_buffer = [];
	yank_buffer._type = "L";
	for (let ln of lns) yank_buffer.push([...ln]);
	if (opts.before) handle_paste("P");
	else handle_paste("p");
};//»
const handle_paste = async (which, opts = {}) => {//«

let {keepFirst, doFold} = opts;
if (!yank_buffer) return;
if (this.stat_input_type){
	let s = yank_buffer[0];
	stat_com_arr.splice(x, 0, ...s);
//	x=s.length;
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
let time = opts.time || Date.now();
let to = yb.length-1;
let fileChomp;
if (typ=="B"){//Block«
	if (which=="p" && curlen()) x++;//if (which=="p" && curln().length) x++;
	open_folds_in_line_range(to);
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
THROW(`i(${i} < to(${to}) && !lines[cy()])`);
//			newlines++;
//			lines.push([]);
		}
	}
	y=_y;
//	actions.push(new Action(_x, ry, yb, time, {isBlock: true, pads, newlines, isViz: true}));
	actions.push(new Action(_x, ry, yb, time, {isBlock: true, pads, isViz: true}));
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
}//»
else if (typ==="M"){//Marker«
	let ln = curarr();
	if (ln._fold) return stat_warn("Fold detected");
	if (which==="p" && curlen()) x++;//if (which==="p" && curln().length) x++;
	actions.push(new Action(x, ry, yb, time, {ins: true, isViz: true}));

	let ch = yb;
	let to = _cy + ch.length-1;
	let len = ch.length;	
	let rem=[];		
	for (let i=_cy, j=0; i <= to; i++, j++){
		let ln = lines[i];
		if (i==_cy){
//			if (i!==to) rem = ln.splice(x, ln.length-x);
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
else {
log(yank_buffer);
cwarn("HANDLEPASTEWUTTYPE");
}
let ind = cut_buffers.indexOf(yb);
if (ind > -1) cut_buffers.splice(ind, 1);
//log(cut_buffers.length);

scroll_num = _scrh;
y = _y;
set_line_lens();
real_line_colors=[];
if (!opts.noRender) render();

};//»

const insert_line_comments=()=>{//«
	open_all_sel_folds();
	let time = Date.now();
	scroll_to(real_seltop(), {noSetSel: true});
	let diff = selbot - seltop;
	let _y = y;
	for (let i=0; i <= diff; i++){
		x=0;
		print_chars("//",{time, ins: true});
		y++;
		set_ry();
	}
	y=_y;
	set_ry();
	x=0;
	this.mode = COMMAND_MODE;
	render();
};//»
const insert_multiline_comment=()=>{//«
	open_all_sel_folds();
	let time = Date.now();
	if (seltop === selbot) return;
	let _y = ry;
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
	scroll_to(_y);
//	this.mode = COMMAND_MODE;
	render();
};//»
const insert_fold = (opts={}) => {//«
	if (seltop === selbot) return;
	open_all_sel_folds();
	let ln1 = lines[seltop];
	let ln2 = lines[selbot];
	if (have_fold_marker(ln1)||have_fold_marker(ln2)) {
		stat("Fold marker detected");
		return;
	}
	let time = Date.now();
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
	this.mode = COMMAND_MODE;
	render();
};//»

const do_something_to_lines = (opts={}) => {//«
//const do_trim_lines = (opts={}) => {
	let {trim, regspace}=opts;
	y = seltop - scroll_num;
	set_ry();
	open_all_sel_folds();
	let time = Date.now();
	delete_lines({time, keepFirst: true, keepMode: true});
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
	yank_buffer = arr;
	yank_buffer._type="L";
	handle_paste("P", {time, keepFirst: true});
	render();
}//»
const do_pad_lines = (opts={}) => {//«
	let {padBlankLines} = opts;
	y = seltop - scroll_num;
	set_ry();
	open_all_sel_folds();
	let time = Date.now();
	delete_lines({time, keepFirst: true, keepMode: true});
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
	let m = this.mode;
	this.mode = VIS_LINE_MODE;
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
	let time = Date.now();
	delete_lines({time, keepFirst: true});
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
		this.mode = VIS_LINE_MODE;
	}
	if (this.mode!==VIS_LINE_MODE) return;
	let time = Date.now();
	delete_lines({time, keepFirst: true});
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
	let w = Term.w;
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
		this.mode = VIS_LINE_MODE;
	}
	if (this.mode !== VIS_LINE_MODE) return;
	let time = Date.now();
	delete_lines({time, keepFirst: true});
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
	if (this.mode !== VIS_LINE_MODE || this.mode_hold === FILE_MODE) return;

	let time = Date.now();
	delete_lines({time, keepFirst: true});
	let s='';
	for (let ln of yank_buffer) s+=ln.join("");
	s = s.replace(/[\x20\t]*([-:{};=+><(),])[\x20\t]*/g,"$1");
	let chars = [...s];
	yank_buffer = [chars];
	yank_buffer._type="L";

	actions.push(new Action(0, lens[seltop], dup(yank_buffer), time, {keepFirst: true}));
	lines[seltop] = chars;
	render();

};//»
const do_delete_lines = (from, to, opts={})=>{//«
	let{copy, time, keepFirst}=opts;
	let tm = time || Date.now();
	let diff = to-from+1;

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
			yank_buffer = [lines[from].slice()];
			lines[from] = [];
		}
		else if (keepFirst){
			yank_buffer = [lines[from].slice()];
			lines[from] = [];
			yank_buffer.push(...dup(lines.splice(from+1, diff-1)));
		}
		else {
			yank_buffer = dup(lines.splice(from, diff));
			if (cy()===lines.length){
				y--;
				fileChomp = true;
			}
		}
		if (yank_buffer.flat().length) cut_buffers.unshift(yank_buffer);
		actions.push(new Action(0, ry, yank_buffer, tm, {neg: true, keepFirst, fileChomp, isLines: true, isViz: true}));
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
				}
			}
			else{
				if (copy) out.push(ln.slice());
				else {
					out.push(...lines.splice(i, 1));
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
		actions.push(new Action(x1, realy(y1), out, Date.now(), {ins: true, neg: true, isViz: true}));
		if (yank_buffer.flat().length) cut_buffers.unshift(yank_buffer);
		x=x1;
	}
};//»
const do_delete_block=async(top,bot,left,right,opts={})=>{//«
	let {copy, time, toUpper}=opts;
	yank_buffer=[];
	let tm = time||(new Date).getTime();
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
	if (!copy && this.mode_hold === FILE_MODE) return;
	let _scrh = scroll_num;
	if (this.mode===VIS_LINE_MODE){//«
		if (!copy) open_all_sel_folds();
		y = seltop - scroll_num;
		set_ry();
		do_delete_lines(seltop, selbot, opts);
		yank_buffer._type = "L";//Line"
	}//»
	else if (this.mode===VIS_BLOCK_MODE){//«
		open_all_sel_folds();
		y = seltop - scroll_num;
		set_ry();
		do_delete_block(seltop, selbot, selleft, selright, opts);
		yank_buffer._type = "B";//Block
	}//»
	else if (this.mode===VIS_MARK_MODE){//«
		open_all_sel_folds();
		set_sel_mark();
		let [x1, y1, x2, y2] = get_marker_coords();
		y = seltop - scroll_num;
		x = x1;
		do_delete_marker(y1, x1, y2, x2, opts);
		yank_buffer._type = "M";//Marker
	}//»
	if (this.mode_hold === FILE_MODE) {
		this.mode = FILE_MODE;
		delete this.mode_hold;
	}
	else if (!opts.keepMode) this.mode=COMMAND_MODE;
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
	this.mode=VIS_LINE_MODE;
	let usey = yarg || cy();
	seltop=selbot=usey;
	delete_lines(opts);
};//»

const delete_to_end=()=>{//«
	if (this.mode !== COMMAND_MODE) return;
	let ln = curarr();//let ln = curln(true);
	if (x===ln.length) return;
	yank_buffer = [ln.splice(x)];
	yank_buffer._type = "M";
	actions.push(new Action(x, ry, yank_buffer, Date.now(), {neg: true, ins: true}));
	if (x > 0) x--;
	render();
};//»
const delete_to_top=()=>{//«
	if (this.mode !== COMMAND_MODE) return;
	if (cy()==0) return;
	this.mode = VIS_LINE_MODE;
	seltop = 0;
	selbot = cy();
	delete_lines();
	this.mode = COMMAND_MODE;
};//»
const delete_to_bottom=()=>{//«
	if (this.mode !== COMMAND_MODE) return;
	let llen_min1 = lines.length-1;
	if (cy()==llen_min1) {
		if (!curarr()._fold) return;
	}
	this.mode = VIS_LINE_MODE;
	seltop = cy();
	selbot = llen_min1;
	delete_lines();
	this.mode = COMMAND_MODE;
};//»
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
	let ln = curarr();//let ln = curln(true);
	if (ln._fold) return;
	if (!ln.length) {
		delete_line();
		return;
	}
	del_ch();
	render();
};//»
const del_ch = (opts={}) =>{//«
	if (!curch()) {
		if (curch(1)) do_null_del();
		return;
	}
	let ln = curarr();//let ln = curln(true);
	real_line_colors[ry]=undefined;
	let have_ch = ln[x];
	let {noAct, time} = opts;
    let tm = time || (new Date).getTime();

	let at_line_end = x===ln.length-1;
	let ch = ln.splice(x, 1)[0];
    if (!noAct) {
//		undos=[];
		actions.push(new Action(x, ry, ch, tm, {neg: true} ));
	}
	if (at_line_end) left();
/*
	if (SYNTAX){
		if (fold_mode) real_line_colors[ry] = undefined;
		else real_line_colors[y+scroll_num] = undefined;
	}
*/
	dirty_flag = true;
	Term.is_dirty = true;
	return have_ch;
};//»

const print_chars = (s, opts={}) =>{//«
	let {ins}=opts;
	let arr=s.split("");
//	if (!(ins||edit_insert)) x++;
	if (!(ins||this.mode===INSERT_MODE)) x++;
	if (!opts.time) opts.time = Date.now();
	for(let ch of arr){
		print_ch(ch, opts);
		x++;
	}
//	if (!edit_insert) x--;
	if (this.mode!==INSERT_MODE) x--;
};//»

const do_syntax_timeout=()=>{
//return;
	if (syntax_timeout) clearTimeout(syntax_timeout);
	syntax_timeout=setTimeout(()=>{
//cwarn("DO MULTILINE!");
		syntax_multiline_comments();
		syntax_timeout = null;
	}, SYNTAX_TIMEOUT_MS);
};
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
/*
	if (!has_internal_tabs){
		if (ch==="\t") {
			if (x > 0 && ln.slice(0,x).join("").match(/^[^\t]+/)){
				has_internal_tabs = true;
				stat_message = "Internal tab detected";
				stat_message_type = STAT_WARN;
			}
		}
		else if (ln[x]==="\t"){
			has_internal_tabs = true;
			stat_message = "Internal tab detected";
			stat_message_type = STAT_WARN;
		}
	}
*/

    let tm = time || (new Date).getTime();
    if (!noAct) {
		actions.push(new Action(x, ry, ch, tm, {adv: true}));
	}
	ln.splice(x, 0, ch);
	if (fromHandler){
		x++;
		render();
		do_syntax_timeout();
	}
	dirty_flag = true;
	Term.is_dirty = true;
	real_line_colors[ry]=undefined;
	return true;
}//»

const replace_char = (ch, opts={})=>{//«
	let time = Date.now();
	let at_line_end = x === (curlen() - 1);//let at_line_end = x === (curln(true).length - 1);
	let gotch = del_ch({time});
	if (at_line_end) x++;
	if (opts.toUpper && gotch && gotch.toUpperCase) ch = gotch.toUpperCase();
	print_ch(ch,{time});
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
		if (c && c.length == 1) replace_char(c);
		render();
	};
	stat(".");
};//»

const tab = (opts={}) => {//«
	let {shift, ctrl}=opts;
	let m = this.mode;
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
	let {noAct, time, num}=opts;
    let tm = time || (new Date).getTime();
	let arr = curarr();//let arr = curln(true);
	let start = arr.splice(0,x);
	if (arr._multi) start._multi = true;
	let end = arr;
	let linenum = curnum();
	lines[linenum] = start;
	if (end.length) lines.splice(curnum(1), 0, end);
	else {
		lines.splice(curnum(1), 0, []);
	}
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
//	set_ry();
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
	Term.is_dirty = true;
}//»
const newline = (which) =>{//«
	if (one_line_mode){
		stat_warn("one_line_mode is on!");
		return;
	}
	if (which == "o") {
		nobreak_enter();
	}
	else {
		x=0;
		this.mode = INSERT_MODE;
		enter();
		y--;
		set_ry();//THE CASE OF THE DEADLY ***NOT*** SETTING OF RY
//FGJKUYTEPOI
	}
	this.mode = INSERT_MODE;
	render();
}//»
const nobreak_enter = (opts={}) => {opts.noBreak=true;enter(opts);};

const do_backspace = (opts={})=>{//«
	let {noAct, time, noRender} = opts;
    let tm = time || (new Date).getTime();
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
//			if (!(_cy > 0 && !curarr(-1).length)) do_open();
			if (!(_cy > 0 && !curarr(-1).length)) return stat_warn("Fold detected");
		}
//		else if (x == 0 && _cy > 0 && (fold = check_if_folded(_cy-1))) do_open();
		else if (x == 0 && _cy > 0 && (fold = check_if_folded(_cy-1))) return stat_warn("Fold detected");
	}//»
	if (x > 0) {//«
		let ln = curarr();//let ln = curln(true);
		real_line_colors[ry]=undefined;
		have_ch = ln[x-1];
		if (!noAct) {
//			undos = [];
			actions.push(new Action(x, ry, have_ch, tm, {adv: true, neg: true} ));
		}
		x--;
		ln.splice(x, 1);
		dirty_flag = true;
		Term.is_dirty = true;
	}//»
	else if (y > 0||scroll_num > 0) {//«
		real_line_colors=[];
		if (y > 0) y--;
		else scroll_num--;
//		set_ry();
		let thisln = curarr();//let thisln = curln(true);
		let nextln = curarr(1);//let nextln = curln(true,1);
		let n = y + scroll_num;
		if (!thisln.length){
			lines.splice(n, 1);
			x=0;
		}
		else {
			lines[n] = thisln.concat(nextln);
			lines.splice(n+1, 1);
			x = thisln.length;
		}
		set_line_lens();
		if (!noAct) {
//			undos = [];
			actions.push(new Action(x, ry, "\n", tm, {neg: true} ));
		}
		dirty_flag = true;
		Term.is_dirty = true;
	}//»
	set_ry();
	if (!noRender) render({},50);
};//»
const backspace = ()=>{//«
	if (is_normal_mode())return try_empty_line_del();
	if (this.mode!==INSERT_MODE) return;
	do_backspace();
	do_syntax_timeout();
}//»

//»
//Keys/Shortcuts«

const handle_press=(ch)=>{//«
//const handle_press=(code)=>{

	let mess;
	last_updown = false;
//	toggle_hold_y = null;
//	toggle_hold_x = null;
//	if (code < 32 || code > 126) return;
	let mode = this.mode;
//	let ch = String.fromCharCode(code);
	if (stat_cb) return stat_cb(ch);

	if (this.stat_input_type) handle_stat_char(ch);
	else if (mode===INSERT_MODE) print_ch(ch,{fromHandler: true});
	else if (mode===REPLACE_MODE) replace_char(ch, {fromHandler: true});
	else if (mode===REF_MODE||mode===SYMBOL_MODE||mode===COMPLETE_MODE) handle_symbol_ch(ch);
	else if (mode===FILE_MODE) handle_file_ch(ch);
	else if (mode===VIS_LINE_MODE||mode===VIS_MARK_MODE||mode===VIS_BLOCK_MODE) handle_visual_key(ch);
	else if (KEY_CHAR_FUNCS[ch]) KEY_CHAR_FUNCS[ch]();

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
const handle_stat_input_keydown=(sym)=>{//«
	if (sym=="TAB_"||sym=="TAB_C") {
		let sit = this.stat_input_type;

		if (sit==="Save As: ") return handle_tab_path_completion(sym==="TAB_C", stat_com_arr.join("").trim(), "");
		let marr;
		if (sit===":"&&(marr=stat_com_arr.join("").match(/^(w(rite)? +)(.+)$/))){
			return handle_tab_path_completion(sym==="TAB_C", marr[3], marr[1]);
		}
		init_complete_mode({stat: true});
		return;
	}
	num_completion_tabs = 0;
	if (sym=="ENTER_") return handle_edit_input_enter();
	if (sym=="LEFT_"){if (stat_x > 0) stat_x--;}
	else if(sym=="RIGHT_"){if(stat_x<stat_com_arr.length)stat_x++;}
	else if (sym == "BACK_") {//«
		if (stat_x > 0) {
			stat_x--;
			stat_com_arr.splice(stat_x, 1);
		} 
		else this.stat_input_type = "";
	}//»
	else if(sym=="DEL_"){if(stat_com_arr.length)stat_com_arr.splice(stat_x,1);}
	else if(sym=="a_C"){if(stat_x==0)return;stat_x=0;}
	else if(sym=="e_C"){if(stat_x==stat_com_arr.length)return;stat_x=stat_com_arr.length;}
	else if (sym=="UP_"||sym=="DOWN_") do_history_arrow(sym);
	else{
		let func = KEY_DOWN_FUNCS[sym];
		if (func === init_complete_mode){
			init_complete_mode({stat: true});
		}
	}
//	else if (KEY_DOWN_FUNCS[sym])
	render({},98);
};//»
const handle_stat_cb_keydown=(sym)=>{//«
	if (sym.match(/^._S?$/)) return;
	stat_cb(sym);
//	if (sym==="ENTER_") return stat_cb(sym);
};//»
const handle_seek_line_end=()=>{seek_line_end();if(is_normal_mode()&&AUTO_INSERT_ON_LINE_SEEKS)set_edit_mode("a");render();};
const handle_seek_line_start=()=>{seek_line_start();if(is_normal_mode()&&AUTO_INSERT_ON_LINE_SEEKS)set_edit_mode("i");render();};

const handle_visual_key=ch=>{//«
	let s;
	let mess;
	let m = this.mode;
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
	}//»
	else if (m===VIS_MARK_MODE){//«
		if (ch=="|"){
			init_stat_input(ch);
		}
		if (ch=="*"||ch=="&"){
			if (seltop!==selbot) return;
			let str = curarr().slice(selleft, selright+1);
			if (!str.length) return;
			this.mode=COMMAND_MODE;
			find_word(str.join(""), {exact: false, reverse: ch==="&"});
		}
	}//»
	else if (m===VIS_BLOCK_MODE) {
		if (ch==" ") {
			prepend_space(" ");
		}
	}

};//»

const KEY_CHAR_FUNCS={//«

//	X: do_null_del,
//Edit (Action needed)
	x: handle_ch_del,
	O: ()=>{newline("O")},
	o: ()=>{newline("o")},
	p: ()=>{handle_paste("p", {doFold: true})},//After
	P: ()=>{handle_paste("P", {doFold: true})},//Before
	D: delete_to_end,
	T: delete_to_top,
	B: delete_to_bottom,

	C: try_clipboard_copy,

//No Action needed below

//Undo/Redo
	u: undo,
	r: redo,
	U:()=>{undo({single: true})},
	R:()=>{redo({single: true})},

//Modes

	a: ()=>{ set_edit_mode("a") },
	i: ()=>{ set_edit_mode("i") },
	I: ()=>{ set_edit_mode("I") },
	m: await_mark_command,
	"`":await_jump_command,
	s:()=>{init_symbol_mode({adv: true})},
	S: init_symbol_mode,
	X: init_cut_buffer_mode,
	l: init_line_wrap_mode,
	e:()=>{
		init_symbol_mode({ref: true});
	},
	E:()=>{
		init_symbol_mode({ref: true, before: true});
	},

	".": replace_one_char,
	">":()=>{
		this.mode = REPLACE_MODE;
		render();
	},
	y: ()=>{delete_mode(true)},
	d: delete_mode,
	h: insert_hex_ch,
	c: insert_comment,
	z: await_fold_command,

	"/": ()=>{ init_stat_input("/") },
	"?": ()=>{ init_stat_input("?") },
	":": ()=>{ init_stat_input(":") },
	"|": ()=>{ init_stat_input("|") },

	Y: yank_file,
	f: echo_file_path,

//Find
	n:()=>{resume_search(false)},
	b:()=>{resume_search(true)},
	"*":()=>{find_word(get_cur_word().word,{exact:true});},
	"&":()=>{find_word(get_cur_word().word,{exact:true,reverse:true});},
	"'":goto_matching_brace,

//Cursor
	"0":()=>{seek_line_start();render();},
	"$":()=>{seek_line_end();render();},

//Scroll
	g: vcenter_cursor,
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
//Edit (must apply Action)
t_CAS:()=>{
	let str = util.linesToParas(get_edit_lines({str: true})).join("\n");
	Desk.api.openTextEditor({appArgs: {text: str, selected: true}});
},
o_A: create_open_fold,
c_A: create_closed_fold,
p_A: try_dopretty,
j_C: do_justify,
l_C: do_line_wrap,
u_C: do_changecase,
u_CA: ()=>{do_changecase(true);},

//Non-editing (No Action needed below)

//KSJTUSHF
x_CA:()=>{
	if (!cur_background_command) cur_background_command = DEF_BACKGROUND_COMMAND;
//	if (!cur_background_command) return stat_err("No command (please use :x)");
	Term.execute_background_command(cur_background_command);
},
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
v_: init_visual_marker_mode,
v_S: init_visual_line_mode,
v_CAS: init_auto_visual_line_mode,
j_CAS:()=>{
if (!is_normal_mode(true)) return;
init_auto_visual_line_mode();
do_justify();
},
p_CAS: Term.toggle_paste,
m_CAS: toggle_regex_escape_mode,

//Display
o_CAS: reset_display,
q_C: syntax_multiline_comments,

//Scroll
//SPACE_C: scroll_screen_to_cursor,
//"]_C":scroll_right,
//"[_C":scroll_left,

//Open/Save/Quit/Dev
j_CA: test_js,
i_CA: write_to_host,
s_C: try_save,
s_CS: try_save_as,
r_CA:toggle_reload_win,
o_C: ()=>{init_stat_input("Open: ")},
x_C: maybe_quit,
"._CAS":set_tab_size_cb,
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

/*
let rv = await vim.sendFunc(val);
if (!(rv && isStr(rv.mess))) return;
stat_message = rv.mess;
stat_message_type = rv.type||STAT_NONE;
render();
*/
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
};//»
const LEFTRIGHT_FUNCS={//«
	LEFT_: left,
	RIGHT_: right,
	LEFT_C: seek_prev_word,
	RIGHT_C: seek_next_word,
	e_C: handle_seek_line_end, 
	a_C: handle_seek_line_start
};//»
const LINE_WRAP_SYMS=["DEL_","BACK_","TAB_", "ENTER_", "SPACE_C"];

this.onkeyup=(e, sym)=>{//«
	if (sym==="TAB_") {
		if (reload_win && reload_win._z_hold){
			reload_win.winElem.style.zIndex = reload_win._z_hold;
			delete reload_win._z_hold;
		}
	}
};//»
this.onkeypress=(e, sym, code)=>{//«
	let mode = this.mode;
		if (code < 32 || code > 126) return;
		if (mode===LINE_WRAP_MODE){
			handle_linewrap_key(sym);
			return;
		}
		return handle_press(sym);
};//»
this.onkeydown=async(e, sym, code)=>{//«
	if (sym.match(/^_[CAS]+$/)) return;
	num_escapes=0;
	let mode = this.mode;
	if (e && PREV_DEF_SYMS.includes(sym)) e.preventDefault();
	if (stat_cb) {//«
		if (sym.match(/^._S?$/)) return;
		stat_cb(sym);
		return 
	}//»
	if (this.stat_input_type) return handle_stat_input_keydown(sym);
	if (sym=="ENTER_") {//«
		if (mode===COMMAND_MODE) return toggle_cur_fold({useOffset: true});
	}//»
	if (UPDOWN_FUNCS[sym]) {/*«*/
		if (!last_updown) {
			scroll_hold_x = x;
		}
		last_updown = true;
		check_del_fold_offset();
		UPDOWN_FUNCS[sym]();
		return;
	}/*»*/
	last_updown = false;
	if (mode===REF_MODE||mode===SYMBOL_MODE||mode===COMPLETE_MODE) return handle_symbol_keydown(sym);
	if (mode===FILE_MODE) return handle_file_keydown(sym);
	if (LEFTRIGHT_FUNCS[sym]){//«
		LEFTRIGHT_FUNCS[sym]();
		return;
	}//»
	if (mode === LINE_WRAP_MODE){//«
		if (LINE_WRAP_SYMS.includes(sym)){
			handle_linewrap_key(sym);
		}
		return;
	}//»
	if (KEY_DOWN_EDIT_FUNCS[sym]){//«
		if (mode!==INSERT_MODE) {
			if (mode === VIS_LINE_MODE || mode === VIS_BLOCK_MODE) {
				if (sym==="BACK_") delete_first_space(); 
				else if (sym==="TAB_") prepend_space("\t");
			}
			else if (sym==="TAB_"){
				if (reload_win&&!reload_win._z_hold){
					reload_win._z_hold = reload_win.winElem.style.zIndex;
					reload_win.winElem._z = topwin.winElem.style.zIndex+1;
				}
			}
			return;
		}
		KEY_DOWN_EDIT_FUNCS[sym]();
		return;
	}//»
	KEY_DOWN_FUNCS[sym] && KEY_DOWN_FUNCS[sym]();	
}//»

//»

//«Obj/CB

this.save=try_save;
//this.set_stat_message=arg=>{stat_message=arg;this.stat_message=arg;};
//this.unset_stat_message=()=>{stat_message=null;stat_message_type=null;};
this.set_ask_close_cb = () =>{//«
	stat_cb = ch => {
		stat_cb = null;
		if (ch=="n"||ch=="N") {
			stat_message = "Not closing!";
			render({},1);
		}
		else {
			if (edit_fobj) {
				edit_fobj.unlockFile();
				delete Term.curEditNode;
			}
			if (app_cb) app_cb();
			topwin.forceKill();
		}
	}
}//»
this.check_paste = val => {
//	if (this.mode===COMMAND_MODE) this.mode=INSERT_MODE;
	if (this.mode===COMMAND_MODE || this.mode === INSERT_MODE || this.stat_input_type) do_paste(val);
};
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
//Object.defineProperty(this,"x_scroll",{get:()=>x_scroll});
Object.defineProperty(this,"x",{get:()=>x});
Object.defineProperty(this,"y",{get:()=>y});
//Object.defineProperty(this,"has_internal_tabs",{get:()=>has_internal_tabs});
Object.defineProperty(this,"scroll_num",{get:()=>scroll_num});
Object.defineProperty(this,"stat_com_arr",{get:()=>stat_com_arr});
Object.defineProperty(this, "stat_message", {
	get: () => stat_message,
	set: (s) => stat_message = s
});
Object.defineProperty(this,"stat_x",{get:()=>stat_x});
Object.defineProperty(this,"ry",{get:()=>{//«
	if (!fold_mode) return y+scroll_num;
	return lens[y+scroll_num];
}});//»
Object.defineProperty(this,"fullpath",{get:()=>edit_fullpath});
//Object.defineProperty(this,"num_lines",{get:()=>num_lines});
//ZPLROTUS
Object.defineProperty(this,"num_lines",{get:()=>num_lines});
Object.defineProperty(this,"stat_message_type",{
	get:()=>stat_message_type,
	set:(val)=>{
		stat_message_type = val;
	}
});
Object.defineProperty(this,"seltop",{get:()=>seltop});
Object.defineProperty(this,"selbot",{get:()=>selbot});
Object.defineProperty(this,"selleft",{get:()=>selleft});
Object.defineProperty(this,"selright",{get:()=>selright});
Object.defineProperty(this,"selmark",{get:()=>edit_sel_mark});
Object.defineProperty(this,"lines",{get:()=>{
let all = get_edit_lines({str: true});
return all;
}});
Object.defineProperty(this,"cur_cut_buffer",{get:()=>cur_cut_buffer});
Object.defineProperty(this,"num_cut_buffers",{get:()=>cut_buffers.length});
Object.defineProperty(this,"line_wrap_x",{
	get:()=>{
		let _cy = y+scroll_num;
		if (!_cy) return x;
		return ((_cy) * Term.w) + x;
	}
});
Object.defineProperty(this,"line_wrap_y",{get:()=>line_wrap_y});
//»

//»

//Init«

this.init = async(arg, patharg, o)=>{
initial_str = arg;
let opts;
({opts, symbols}=o);
if (symbols){
SYMBOL_WORDS=symbols.map(w=>w.split(/\s+/)[0]);
}
this.command_str = o.command_str;
this.comOpts = opts;
this.parSel = opts.parsel;
no_save_mode = opts.nosave;
one_line_mode = opts.one;
quit_on_enter = opts.enterquit;
return new Promise((Y,N)=>{

app_cb = Y;
this.cb = app_cb;

let len = arg.length;
let linesarg = arg.split(/\r?\n/);
let old = Term.overrides;
hold_overrides = old;
let overs = {};
if (old) {
	for (let k in old){
		overs[k] = old[k];
	}
}
for (let str of overrides) overs[str]=1;
Term.overrides = overs;

//let typearg = o.type;
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
	
Term.is_editing = true;
edit_fullpath = patharg;
edit_ftype = o.type;
this.mode = COMMAND_MODE;
dirty_flag = false;
Term.is_dirty = false;
edit_fname = null;

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
//		if (!has_internal_tabs && ln.match(/^[^\t]\t+/)) has_internal_tabs = true;
		lines.push(ln.split(""));
	}
}

//if (has_internal_tabs){
//cwarn("INTERNAL TABS?!?!?");
//}

//Term.setLines(lines, line_colors);
//Term.init_edit_mode(this, num_stat_lines);
//hold_screen_state = Term.init_new_screen(vim, appclass, lines, line_colors, num_stat_lines, onescape);
//let use_reload;
if (opts.r||opts["dev-name"]||opts["use-dev-reload"]) {
//	use_reload = ondevreload;
	use_devreload = ondevreload;
cwarn("Using ondevreload");
}
//hold_screen_state = Term.initNewScreen(vim, appclass, lines, line_colors, num_stat_lines, {onescape, ondevreload: use_reload});
hold_screen_state = Term.initNewScreen(vim, appclass, lines, line_colors, num_stat_lines, {onescape, onreload: ()=>{
//cwarn("HI VIM RELOAD!!!");
quit(true);
}});
this.fname = edit_fname;

syntax_multiline_comments();

if (opts.insert) set_edit_mode("i");
else if (!edit_fname) {
	if (no_save_mode) render();
	else stat('"New File"');
}
else if (lines.length==1 && !lines[0].length) stat(`"${edit_fname}" [New]`);
else stat_file(linesarg.length, len);


});

setTimeout(async()=>{
	let modret = await util.getMod("util.pretty");
	pretty = modret.getmod().js;
},0);

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

};/*»*/
this.quit = quit;
//}; End vim mod«
}
//»

//»
















