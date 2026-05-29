(()=>{"use strict";const LIBNAME="fs";

/*5/26/26: After playing around with an "automation_mode" in vim, «
I'm thinking it is better to devote another command (vimtest) for automated test
suites performed on vim. So instead of seeing vim performing acts of
"self-control" in a live Terminal session, I instead want to load the vim
module (via vimtest, below) and pass it a fake Terminal object. This way, since
there is no terminal attached to vim, there is no chance of the automation
suite being "interfered with" by live users, and I don't need to mess with
vim's internal logic (an 'automation_mode' flag, etc.) in order to ensure this.
We will call all the key handler events directly from the vimtest command. The
most we should need/want to do in vim, itself, is expose certain functions to
the outside world, e.g. in order to validate the consistency of
undo_all/redo_all. The stuff I did from earlier this morning along these lines
is in ~/zzhold/AUTOVIM.js.

Invoke it like this:

$ vimtest <command_file> [<opt_init_file>]

... where command file is filled with commands (mostly keydown/keypress
events), parsed something like in AUTOVIM.js, and opt_init_file is the file (if
any) that vim will be automatically editing.

I am thinking that it might actually be *important* to not have any clue about what
is happening internally, as opposed to how, earlier this morning, I was wanting
to effect a certain visually inspectable outcome. So we will be psychologically
"freed up" to generate and send out a lot of random key sequences, which can
then be validated by various commands. In the event that we attain invalid
results, we can narrow down to the offending section, by iteratively cutting
the range of key strokes in half to see if there are issues with the first or
second half. Then we can continue this "cutting in half" form of approximation
again. We'll actually do this on a line-by-line basis, and then do the same
thing on the commands contained in the offending line itself.

To test this testing mode, we should insert some kind of randomization in vim
that makes a mistake. So, to make a mistake 1% of the time, we can invoke vim
something like:

$ vim --mistake=0.01

... in order to artificially create a mismatch between the Actions that are
saved (one-off issues w/x and y coordinates, etc.) and what the user actually
intended. This "random mistake" mode will then put a comment onto the Action
about how it intentionally screwed up, and so the job of the testing suite will
be to find the offending Action. In this "test-the-testing-mode" mode it is
important to attach this comment in order to verify the mistake. When there are
actual programming mistakes in the vim logic, it is a self-documenting mistake,
such that the state of the program during the execution of the action is the
only "verification" that is needed.

To reiterate: it doesn't *really* matter whether there is a mistake in a) the
values that are saved by a particular Action or b) in the logic of an editing
function (that Actions enable the undo'ing/redo'ing of). Rather, the fact
that there is a *mismatch* between the two is what truly matters.

There is a very small chance that, in our "testing-the-testing-mode" mode, we
could (purposefully) make an "error" in recording an Action that in fact
corrects an error-condition in vim's logic. This happy mistake shouldn't really
be of any consequence: we didn't know about anys errors prior to testing (or we
would have fixed them) , and we will simply *continue* not to know about them.
We'll just need to keep on testing in order to (finally) discover them.

»*/

/*5/23/26 Bug (fixed!?)//«

JUST GOT A FATAL ERROR from com_grep. The terminal said:
"The output array and colors array are not equal length!"

This was caused by an issue in shell.js: Com.fmtColLn.

In grep, when multiple files are specified on the command line,
we are supposed to prepend the results with the name of the file.

In get_file_lines_from_args (@RIHGJD), since we are returning a 
return object anyway, we can also return some kind of a map
between line numbers and file names.
»*/
/*9/3/25: Have been doing a major update to piping logic in shell.js. //«

The derived commands should define pipeIn methods for streaming purposes, and
pipeDone methods in order to receive every all at once in a JS array, after the
EOF has been received.  com_brep uses a highly non-trivial piping logic using
Uint8Array's.

»*/

//Imports«

//import { util, api as capi } from "util";
//import { globals } from "config";
const util = LOTW.api.util;
const globals = LOTW.globals;
const {
	isArr,
	isStr,
	isEOF,
	isErr,
	log,
	jlog,
	cwarn,
	cerr,
	normPath
} = util;
const {
	fsMod,
	NS,
//	comClasses,
	ShellMod,
	admin_mode
} = globals;
const{
	DEF_EDITOR_MOD_NAME,
	DEF_PAGER_MOD_NAME,
	SHELL_ERROR_CODES,
}=globals.term;
const{
	FS_TYPE,
	MOUNT_TYPE,
	SHM_TYPE,
	USERS_TYPE
}=globals.fs;
const{
	TEXT_EDITOR_APP,
	LINK_APP,
	FOLDER_APP,
}=globals.app;
//const{comClasses}
const fsapi = fsMod.api;
const widgets = NS.api.widgets;
const {pathToNode}=fsapi;
const{E_SUC, E_ERR} = SHELL_ERROR_CODES;
//const {Com, ErrCom, make_error_com} = comClasses;
const {Com} = ShellMod.comClasses;
const{Desk}=LOTW;
const{make_icon_if_new}=Desk;
//»

//Var«
//To allow writing of files even if there is an external lock on it, change this to true
const allow_write_locked = false;

//»

//Funcs«
//RIHGJD
const get_file_lines_from_args = async(args, cur_dir, errcb)=>{//«
//const get_file_lines_from_args = async(args, term, errcb)=>{
	let err = [];
	let out = [];
	let name_map = [];
	let ln_map = [];
	const fullterr=(arg)=>{
		if (errcb) errcb(`${fullpath}: ${arg}`);
		else err.push(`${fullpath}: ${arg}`);
	};
	let fullpath;
//  let file_num  = args.length;
let files = args.slice().reverse();
let file_num = -1;
let line_num = 0;
	while (files.length) {
//	while (args.length) {
file_num++;
		fullpath = normPath(files.pop(), cur_dir);
//		fullpath = normPath(args.shift(), cur_dir);
		let node = await fsapi.pathToNode(fullpath);
		if (!node) {
			fullterr(`no such file or directory`);
			continue;
		}
		if (node.appName === FOLDER_APP) {
			fullterr(`is a directory`);
			continue;
		}
		let typ = node.type;
		if (typ==FS_TYPE) {
			if (!node.blobId) {
				fullterr(`no associated blob`);
				continue;
			}
		}
		else if (typ==MOUNT_TYPE||typ==SHM_TYPE){
		}
		else{
			fullterr(`invalid type: '${typ}'`);
			continue;
		}

		let val = await node.getValue({text: true});
		if (!isStr(val)) {
			fullterr("An unexpected value was returned");
			continue;
		}
		let arr = val.split("\n");
		let ln_iter = 1;
		for (let ln of arr) {
			name_map[line_num] = file_num;
			ln_map[line_num] = ln_iter;
			out.push(ln);
			line_num++;
			ln_iter++;
		}
	}
	return {err, out, name_map, ln_map};
};//»

//»

const com_vimtest = class extends Com{//«
#escHandler;

static getOpts(){//«
	return {
		s:{},
		l:{}
	}
}//»
async init() {//«

let NOOP = ()=>{};
let faketerm = {//«
	env:{
		cwd: {
			cwd: this.term.env.cwd.cwd
		}
	},
	clipboardCopy: NOOP,
	quitNewScreen: ()=>{
		this.editor.cb();
	},
	initNewScreen: (a1,a2,a3,a4, arg)=>{
		this.#escHandler = arg.onescape;
	},
	setLines: NOOP,
	resetXScroll: NOOP, 
	doOverlay: NOOP, 
	getDirContents: this.term.getDirContents,
	w: 80,
	h: 25,
};//»
if (!await util.loadMod(DEF_EDITOR_MOD_NAME)) {
	this.no("could not load the editor module");
	return;
}
this.editor = new NS.mods[DEF_EDITOR_MOD_NAME](faketerm);

let fullpath;
let node, typ;
let command_str = "vim";
let opts = {};

this.awaitCb = this.editor.init("", fullpath, {
	node,
	type: typ,
	command_str,
	opts,
});

}//»
async run(){//«

const {editor} = this;

//Key helpers«
const keydown=(sym, num=0)=>{//«
	if (!num) return editor.onkeydown(0, sym);
	for (let i=0; i < num; i++){
		editor.onkeydown(0, sym);
	}
};//»
const d = keydown;
const ent = (num=0) => { keydown("ENTER_", num); }
const entC = (num=0) => { keydown("ENTER_C", num); }
const bk = (num=0) => { keydown("BACK_", num); }
const up = (num=0) => { keydown("UP_", num); }
const dn = (num=0) => { keydown("DOWN_", num); }
const lft = (num=0) => { keydown("LEFT_", num); }
const rgt = (num=0) => { keydown("RIGHT_", num); }
const esc = (num=0) =>{//«
	if (!num) return this.#escHandler();
	for (let i=0; i < num; i++) this.#escHandler();
};//»
const quit = (if_force) => {//«
	esc(6);
	editor.onkeypress(0, ":");
	editor.onkeypress(0, "q");
	if (if_force) editor.onkeypress(0, "!");
	editor.onkeydown(0, "ENTER_");
};//»

//»

this.inf("Running vim...");
let comstr = "iThis is the thing in the time of the place!!!";
let comarr = comstr.split("");
for (let com of comarr){
	editor.onkeypress(0, com);
}
ent(5);
comstr = "RAMBULLICARRR ON THE ON THE ON THE ON THE ONTHEONTHE";
comarr = comstr.split("");
for (let com of comarr){
	editor.onkeypress(0, com);
}
bk(9);
comstr = "wwwwwwwwwwwwwww";
comarr = comstr.split("");
for (let com of comarr){
	editor.onkeypress(0, com);
}

esc();
log(this.editor.lines);
d("u_CAS");
log(this.editor.lines);
d("r_CAS");
log(this.editor.lines);
quit(true);

await this.awaitCb;

//log(this.editor.lines);

this.ok("OK");

}//»
cancel(){//«
this.editor.cb();
}//»

}//»

const com_vim = class extends Com{//«
static getOpts(){//«
	return {
		s:{
			r: 1,//use ondevreload
			d: 3,//Use development file for the vim module
		},
		l: {
			pipeok: 1,
			parsel: 1,
			nosave: 1,
			one: 1,
			insert: 1,
			enterquit: 1,
			"convert-markers": 1,
			"reload-win": 3,
			symbols: 3,
			"force-stdout": 1,
			"dev-name": 3,
			refs: 3,
			"use-dev-reload": 1,
			termdev: 1,
		}
	};
}//»
async init(){//«
	if (this.term.actor) {
		return this.no(`the screen is already grabbed by: '${this.term.actor.comName}'`);
	}
	let {args, opts, command_str, term}=this;
	let use_mod_name;
	if (opts.d) {//«
// Use a local file (in LOTW's own sandbox) for the vim module's text
		use_mod_name = "local.dev.vim";
		let txt = await opts.d.toText(this.env.cwd);
		if (!isStr(txt)) return this.no(`${opts.d}: file not found`);
		let url = URL.createObjectURL(new Blob([`(function(){"use strict";${txt}})()`]));
		let scr;
		try {
			scr = await util.makeScript(url);
		}
		catch(e){
cerr(e);
			this.no(e.message);
			return;
		}
	}//»
	else if (!await util.loadMod(DEF_EDITOR_MOD_NAME)) {//«
// Offline?
		this.no("could not load the editor module");
		return;
	}//»
	else use_mod_name = DEF_EDITOR_MOD_NAME;
	
	this.editor = new NS.mods[use_mod_name](this.term);

// DON'T SHIFT IT OFF THE PATH BECAUSE WE MIGHT CALL init() AGAIN (@WJGHDMG)//«
// WHILE LOCALLY EDITING/RELOADING VIM W/ THE Alt+r HOTKEY!!!
//	let path = args.shift(); //NO!!!!!//»

	let path = args[0];
	let val;
	let node;
	let parnode;
	let fullpath;
	let typ;
	let symbols;
	if (opts.symbols){//«
		let rv = await opts.symbols.toText(this.env.cwd);
		if (!rv) return this.no(`${opts.symbols}: symbol file not found`);
		rv = rv.split("\n");
		symbols=[];
		for (let ln of rv){
			let s = ln.trim();
			if (s.match(/^\w/)) symbols.push(s);
		}
	}//»
	if (opts.refs){
		if (!globals.refs[opts.refs]) return this.no(`${opts.refs}: not found in globals.refs`);
	}
	if (!path) {
		if (this.stdin) val = this.stdin;
		else val="";
	}
	else {//«
		fullpath = normPath(path, this.env.cwd.cwd);
		node = await fsapi.pathToNode(fullpath);
		if (!node){//«
			let badlink = await fsapi.pathToNode(fullpath, true);
			if (badlink){
/*« While it might seem strange to allow the editing of a "bad link", 
that is how Linux works: as long as the parent directory of the symlink is
writable, then a new file, using the last path part in symlink, will be created.

In Linux:

$ ln -s path/to/some/file.txt mylink

As long as "path/to/some" is a valid/writable directory, then 
when invoking:

$ vim mylink

... a file named "file.txt" will be created there upon saving it in vim.

But if it can't be written, then "real" vim will allow you to pretend like you
are editing a file like normal, and when you try to save it, it gives you the
error: "Can't open linked file for writing".

The LOTW system won't even let you pretend to edit a file that
can't be written: the error comes on the command line, and the vim
screen never shows.

»*/
				fullpath = badlink.link;
			}
			let arr = fullpath.split("/");
			let nm = arr.pop();
			let path = arr.join("/");
			parnode = await fsapi.pathToNode(path);
			if (!parnode) return this.no(`${path}: no such directory`);
			if (!parnode.okWrite) return this.no(`${fullpath}: permission denied`);
			val = "";
			typ = parnode.root.type;
		}//»
		else {//«
			if (node.writeLocked()) return this.no(`${path}: is locked by another application`);
			if (node.appName === FOLDER_APP) return this.no(`${fullpath}: is a directory`);
			val = await node.getValue({text:true});
			if (!isStr(val)){
cwarn("Here are the contents...");
log(val);
				return this.no(`${path}: could not get the contents (see console)`);
			}
			typ = node.root.type;
		}//»
		if (!opts.pipeok) this.noPipe = true;
	}//»
	this.awaitCb = this.editor.init(val, fullpath, {
		node,
		type: typ,
		command_str,
		opts,
		symbols,
	});
}//»

async run(){//«
//If this is true, we do a clean exit
//Otherwise, we need to dev reload
	while (!await this.awaitCb){
		let scr = document.getElementById(`script_mods.${DEF_EDITOR_MOD_NAME}`);
		if (scr) scr._del();
		else{
//cwarn(`VIM SCRIPT NOT FOUND!?!?!`);
		}
		delete NS.mods[DEF_EDITOR_MOD_NAME];
		this.term.refresh();
//WJGHDMG
		await this.init();
	}
	if (this.pipeTo || this.opts["force-stdout"]){
		this.out(this.editor.get_lines({str: true}).join("\n"));
	}
	else if (this.redirLines){
		let lns = this.editor.get_lines({str: true});
		this.redirLines.push(...lns);
	}
	this.ok();
}//»
cancel(){//«
//This method is never invoked because vim eats up the ^C that *would* cancel it
//this.killed = true;
//this.editor.quit();
//this.ok();
}//»
/*
pipeIn(val){//«
	if (this.killed) return;
	if (this.noPipe) return;
	this.editor.addLines(val);
}//»
*/

}//»

//Commands«
//const Com = SimpleCommand;
/*«
const com_ = class extends Com{
async init(){
}
async run(){
}
}
»*/

const ADMIN_COM = class extends Com{run(){this.no("must be in 'admin mode'!");}};

const com_brep = class extends Com{//«
/*«

Want a series of numbers for "from" and another series for "to". The only question is
how we represent these series (i.e. aaa,bbb,ccc xxx,yyy,zzz):

But I really just want to replace all 0xab with 0xc2 0xab and all 0xbb with 0xc2 0xbb.

First, we will assume hex and then allow flags for decimal and octal.

This is how we translated our file with non-utf8-encoded upper-ascii characters
(in DASH.c) into utf8-encoded ones (in OUT.c):

$ brep Desktop/DASH.c ab c2,ab | brep bb c2,bb > OUT.c

We could also have done this without redirects (writing to an output file named as an
argument, but it was more fun getting...)

»*/

async init(){//«
	let{args, no}=this;
	this.binPipe = true;
	let s1 = args.shift();
	let s2 = args.shift();
	if (!(s1&&s2)){
		return no("Need two sequences of hex bytes, e.g.: aa,bb cc,dd,ee");
	}
	let seq1=[];
	let seq2=[];
	for (let s of s1.split(",")){
		let n = parseInt(s, 16);
		if (isNaN(n)||n<0||n>255){
			return no(`${s}: invalid hex number`);
		}
		seq1.push(n);
	}
	for (let s of s2.split(",")){
		let n = parseInt(s, 16);
		if (isNaN(n)||n<0||n>255){
			return no(`${s}: invalid hex number`);
		}
		seq2.push(n);
	}

	if (!(seq1.length && seq2.length)){
		return no("Could not determine both sequences!?!?");
	}
	this.seq1 = seq1;
	this.seq2 = seq2;

	if (!(this.pipeFrom || args.length)) return no("not in pipe and no file args!");
	if (args.length > 1) return no("too many arguments");
	let f = args.shift();
	if (!f) {
		return;
	}
	let node = await f.toNode(this.env.cwd);
	if (!node){
		return no(`${f}: Not found`);
	}
	let bytes = await node.bytes;
	if (!(bytes instanceof Uint8Array)) return no(`${f}: no bytes were returned`);
	this.bytes = bytes;
	this.noStdin = true;

}//»
doBrep(){//«
	let bytes = this.bytes;
	let len = bytes.length;
	let bout = new Uint8Array(len*10);
	let i1=0;
	let i2=0;
	let seq1 = this.seq1;
	let seq2 = this.seq2;
	let seq1_0 = seq1[0];
	let seq1len = seq1.length;
	let seq1len_min1 = seq1len-1;
	let seq2len = seq2.length;

	WHILE_LOOP: while(true){//«
		if (i1 >= len) break;
		if (bytes[i1]===seq1_0){
			if (seq1len > 1){
				for (let i=i1+1, iter=1; i < i1+seq1len; i++){
					if (bytes[i]!==seq1[iter]){
						bout[i2]=bytes[i1];
						i1++;
						i2++;
						continue WHILE_LOOP;
					}
					iter++;
				}
			}
			bout.set(seq2, i2);
		}
		else{
			bout[i2]=bytes[i1];
			i1++;
			i2++;
			continue;
		}
		i1+=seq1len;
		i2+=seq2len;
	}//»

	let bytes2 = bout.slice(0, i2);
	this.out(bytes2);
	this.ok();

}//»
run(){
	if (this.noStdin) this.doBrep();
}
/*
pipeDone(bytes){
//This should be a Uint8Array. Need to update Com._pipeIn.
//log(bytes);
this.bytes = bytes;
this.doBrep();
//this.err("PLEASE IMPLEMENT THE CORRECT PIPING LOGIC!!!");
//this.no();
}
pipeIn(val){//Commented out«
	if (this.noStdin) return;
	if (isEOF(val)){
		this.doBrep();
		return;
	}
	if (!val instanceof Uint8Array){
		return;
	}
	if (!this.bytes) this.bytes = val;
	else{
		let hold = this.bytes;
		let bytes = new Uint8Array(hold.length + val.length);
		bytes.set(hold, 0);
		bytes.set(val, hold.length);
		this.bytes = bytes;
	}
}//»
*/
}//»
const com_less = class extends Com{//«
static getOpts(){
	return {l:{parsel:1}};
}
async init(){//«
	if (this.term.actor) {
		return this.no(`the screen is already grabbed by: '${this.term.actor.comName}'`);
	}
	if (!await util.loadMod(DEF_PAGER_MOD_NAME)) {
		this.no("could not load the pager module");
		return;
	}
	this.pager = new NS.mods[DEF_PAGER_MOD_NAME](this.term);
	this.pager.exitChars=["q"];
	let path = this.args[0];
//	let path = this.args.shift();
	let arr;
	let name;
	if (!path) {
		if (this.haveStdin) {
			arr=[];
//			use_stdin = true;
			name = "*stdin*";
		}
		else{
			arr = this.term.getBuffer();
			name = "*buffer*";
		}
	}
	else {
		let fullpath = normPath(path, this.env.cwd.cwd);
		let node = await fsapi.pathToNode(fullpath);
		if (!node) {
			return this.no(`${fullpath}: no such file or directory`);
		}
		if (node.appName === FOLDER_APP) {
			return this.no(`${fullpath}: is a directory`);
		}
		let val = await node.getValue({text:true});
		if (val) arr = val.split("\n");
		else if (val === null){
			return this.no(`${fullpath}: could not get the contents`);
		}
		else arr = [];
		name = node.name;
	}

//Imitate a multiline selection
//	let sels=[];
//	for (let ln of arr) sels.push(false);
//	this.pager.multilineSels = sels;
//	this.awaitCb = this.pager.init(arr, name, {opts, lineSelect: true});

	this.awaitCb = this.pager.init(arr, name, {opts:this.opts});
	this.#readStdin();
}//»
async #readStdin(){//«
	if (!this.useStdin) return;
	while (true){
		let rv = await this.readStdinChunk();
		if (isEOF(rv)){
			break;
		}
		this.pager.addLines([rv]);
	}
}//»
async run(){//«
	while (!await this.awaitCb){
		let scr = document.getElementById(`script_mods.${DEF_PAGER_MOD_NAME}`);
		if (scr) scr._del();
		else{
cwarn(`LESS SCRIPT NOT FOUND!?!?!`);
		}
		delete NS.mods[DEF_PAGER_MOD_NAME];
		this.term.refresh();
		await this.init();
	}
	this.ok();
}//»

}//»

const com_grep = class extends Com{//«
//#re;
static getOpts(){
return {s: {n: 1}};
}
async init(){//«
	let patstr = this.args.shift();
	if (!patstr) {
		this.no("no pattern given");
		return;
	}

	try {
		this.re = new RegExp(patstr);
	}
	catch(e) {
		this.no("invalid pattern: " + patstr);
		return;
	}
//	if (!this.args.length && !this.pipeFrom) this.no("no file args and not in a pipeline!");
}//»
async run(){//«
	if (this.killed) return;
	let{args}=this;
	let have_error = false;
	const err=mess=>{
		if (!mess) return;
		have_error=true;
		this.err(mess);
	};
	if (!args.length){
		while (true){
			let rv = await this.readStdinChunk();
			if (isEOF(rv)){
				break;
			}
			this.doGrep(rv);
		}
		this.ok();
		return;
	}
	let rv = await get_file_lines_from_args(args, this.env.cwd.cwd, err);
	if (rv.out&&rv.out.length) this.doGrep(rv.out, rv.name_map, rv.ln_map);
	have_error?this.no():this.ok();	
}//»
doGrep(val, name_map=[], ln_map = []){//«
	const re = this.re;
	if (!re) return;
	let arr;
	if (isStr(val)) arr=[val];
	else if (!isArr(val)){
		cwarn("Dropping", val);
		return;
	}
	else arr = val;	

	let is_term = this.isTermOut;
	let marr;
	let iter = 0;
	const files = this.args;
	let use_lnnums = this.opts.n;
	for (let ln of arr){
		let prepend;
		if (Number.isFinite(name_map[iter])) {
			if (use_lnnums){
				prepend = `${files[name_map[iter]]}:${ln_map[iter]}`;
			}
			else {
				prepend = `${files[name_map[iter]]}`;
			}
		}
		else prepend = "";

		if (is_term) {
			if (marr = re.exec(ln)) {
				if (!marr[0].length) this.out(`${prepend}:${ln}`);//This apparently matched an empty string
				else{
					let ln_str;
					let obj;
					if (prepend) {
						ln_str = `${prepend}:${ln}`;
						obj = this.fmtColLn(ln_str, marr.index+prepend.length+1, marr[0].length, "#f99");
					}
					else {
						ln_str = ln;
						obj = this.fmtColLn(ln_str, marr.index, marr[0].length, "#f99");
					}
					this.out(obj.lines.join("\n"), {colors: obj.colors, didFmt: true});
				}
			}
		}
		else{
			if (re.test(ln)) {
				if (prepend) this.out(`${prepend}:${ln}`);
				else this.out(ln);
			}
		}
		iter++;
	}
}//»

}//»
const com_wc = class extends Com{//«
//#noPipe;
async init(){
//	if (!this.args.length && !this.pipeFrom && !this.stdin) this.no("no args, no stdin, and not in a pipeline");
//	if (!this.args.length && !this.pipeFrom) return this.no("no file args and not in a pipeline!");
	if (this.args.length || this.stdin){
		this.noPipe = true;
	}
	this.lines=0;
	this.words=0;
	this.chars=0;
}
doWC(val){
	const {out}=this;
	let lines = this.lines;
	let words = this.words;
	let chars = this.chars;
	let arr;
	if (isStr(val)) {
		arr=[val];
	}
	else if (!isArr(val)){
cwarn("Dropping", val);
		return;
	}
	else arr = val;	
//log(arr);
	lines+=arr.length
	for (let ln of arr){
		chars+=ln.length;
//log(`<${ln}>`);
		ln = ln.replace(/^\s+/,"");
		ln = ln.replace(/\s+$/,"");
//		let word_arr = ln.split(/\x20+/);
		let word_arr = ln.split(/\s+/);
		if (word_arr.length===1 && word_arr[0]==="") continue;
		words+=word_arr.length;
	}
	this.lines=lines;
	this.words=words;
	this.chars=chars;
}
sendCount(){
	this.out(`${this.lines} ${this.words} ${this.chars+this.lines}`);
}
async run(){
	if (this.killed) return;
	let{args, out}=this;
	if (this.noArgs){
		while (true){
			let rv = await this.readStdinChunk();
			if (isEOF(rv)){
				break;
			}
			this.doWC(rv);
		}
		this.sendCount();
		this.ok();
		return;
	}
/*
	if (!args.length) {
		if (this.stdin){
			this.doWC(this.stdin);
			this.sendCount();
			this.ok();
		}
		return;
	}
*/
	let have_error = false;
	const err=mess=>{
		if (!mess) return;
		have_error=true;
		this.err(mess);
	};
	let rv = await get_file_lines_from_args(args, this.env.cwd.cwd, err);
//	if (rv.err && rv.err.length) err(rv.err);
	if (rv.out&&rv.out.length) this.doWC(rv.out);
	this.sendCount();
	have_error?this.no():this.ok();	
}
/*«
pipeIn(val){
	if (this.killed || this.noPipe) return;
//	if (isEOF(val)){
//		this.out(val);
//		this.sendCount();
//		this.ok();
//		return;
//	}
	this.doWC(val.split("\n"));
}
pipeDone(){
	if (this.killed || this.noPipe) return;
	this.sendCount();
	this.ok();
}»*/
}//»
const com_touch = class extends Com{//«

init(){
	if (!this.args.length) {
		this.no("missing file operand");
	}	
}
async run(){
	let{args, term}=this;
	let have_error=false;
	const err=mess=>{
		this.err(mess);
		have_error = true;
	};
	while (args.length) {
		let path = args.shift();
		let fullpath = normPath(path, this.env.cwd.cwd);
		let node = await pathToNode(fullpath);
		if (node) {
			continue; 
		}
		let arr = fullpath.split("/");
		let fname = arr.pop();
		let parpath = arr.join("/");
		let parnode = await pathToNode(parpath);
		if (!(parnode && parnode.appName === FOLDER_APP)) {
			err(`${parpath}: Not a directory`);
			continue; 
		}
		let OK_TYPES = [FS_TYPE, SHM_TYPE, USERS_TYPE];
		if (!OK_TYPES.includes(parnode.type)) {
			err(`${fullpath}: The parent directory has an unsupported type: '${parnode.type}'`);
			continue; 
		}
		if (!parnode.okWrite) {
 			err(`${path}: Permission denied`);
			continue;
		}
		let newnode = await fsapi.touchFile(parnode, fname);
		if (!newnode) err(`${fullpath}: The file could not be created`);
		else make_icon_if_new(newnode);
	}
	have_error?this.no():this.ok();	
}

}//»
const com_mv = class extends Com{//«
	init(){
		if (!this.args.length) {
			this.no(`missing operand`);
		}
	}
	async run(){
		let{term, args}=this;
		if (!args.length) return;
		let have_error = false;
		const err=mess=>{
			if(!mess)return;
			have_error=true;
			this.err(mess);
		};
		await fsapi.comMv(args, {if_cp: false, exports: {cberr: err, werr: err, cur_dir: this.env.cwd.cwd, termobj: term}});
		have_error?this.no():this.ok();	
	}
}//»
const com_cp = class extends Com{//«
	init(){
		if (!this.args.length) {
			this.no(`missing operand`);
		}
	}
	async run(){
		let{term, args}=this;
		if (!args.length) return;
		let have_error = false;
		const err=mess=>{
			if(!mess)return;
			have_error=true;
			this.err(mess);
		};
		await fsapi.comMv(args, {if_cp: true, exports: {cberr: err, werr: err, cur_dir: this.env.cwd.cwd, termobj: term}});
		have_error?this.no():this.ok();	
	}
}//»
const com_mkdir = class extends Com{//«

async run(){
	let{args,term}=this;
	let have_error=false;
	const err=(mess)=>{if(!mess)return;have_error=true;this.err(mess);};
	if (!args.length) {
		err("missing operand");
	}
	while (args.length) {
		let path = args.shift();
		let fullpath = normPath(path, this.env.cwd.cwd);
		let node = await fsapi.pathToNode(fullpath);
		if (node) {
			err(`${fullpath}: the file or directory exists`);
			continue;
		}
		let arr = fullpath.split("/");
		let fname = arr.pop();
		let parpath = arr.join("/");
		if (!parpath) {
			err(`${fullpath}: permission denied`);
			continue;
		}
		let parnode = await fsapi.pathToNode(parpath);
		if (!(parnode && parnode.appName === FOLDER_APP)) {
			err(`${parpath}: not a directory`);
			continue; 
		}
		let OK_TYPES = [FS_TYPE, SHM_TYPE, USERS_TYPE];
		if (!OK_TYPES.includes(parnode.type)) {
			err(`${fullpath}: the parent directory has an unsupported type: '${parnode.type}'`);
			continue; 
		}
//		if (!await fsapi.checkDirPerm(parnode)) {
		if (!parnode.okWrite) {
//		if (parnode.type === FS_TYPE && !await fsapi.checkDirPerm(parnode)) {
			err(`${fullpath}: permission denied`);
			continue;
		}
		let newdir = await fsapi.mkDir(parnode, fname);
		if (!newdir) err(`${fullpath}: the directory could not be created`);
		else make_icon_if_new(newdir);
	}
	have_error?this.no():this.ok();	
}

}//»
const com_rmdir = class extends Com{//«
static getOpts(){//«
	return {
		s:{
			r:1, R:1
		},
		l:{
			recursive: 1
		}
	};
}//»
async run(){
	let{args,term}=this;
	let have_error=false;
	const err=(mess)=>{if(!mess)return;have_error=true;this.err(mess);};
	if (!args.length) {
		err("missing operand");
	}
	else {
		await fsapi.doFsRm(args, err, {CWD: this.env.cwd.cwd, FULLDIRS: false, dirsOnly: true});
	}

	have_error?this.no():this.ok();	
}

}//»
const com_rm = class extends Com{//«

async run(){
	let{args,term, env, opts}=this;
	let have_error=false;
	let is_recur = (opts.recursive || opts.R || opts.r);
	const err=(mess)=>{if(!mess)return;have_error=true;this.err(mess);};
	if (!args.length) {
		err("missing operand");
	}
	else if(is_recur && 
		!(isStr(env.NUCLEAR_OPTION)&&env.NUCLEAR_OPTION.match(/^i am crazy$/i))){
		err("recursive removal not enabled");
	}
	else{
		let okargs=[];
		let cwd = this.env.cwd.cwd
		for (let path of args){
			let fullpath = normPath(path, cwd);
			let node = await fsapi.pathToNode(fullpath, true);
			if (!node) {
				err(`${path}: no such file or directory`);
				continue;
			}
			if (!is_recur && node.appName===FOLDER_APP){
				err(`${path}: is a directory`);
				continue;
			}
			okargs.push(node.fullpath);
		}
		await fsapi.doFsRm(okargs, err, {CWD: cwd, FULLDIRS: is_recur});
	}
	have_error?this.no():this.ok();	
}

}//»
const com_ln = class extends Com{//«

async run(){
	let{args,term}=this;
	const err=(mess)=>{
		this.err(mess);
		this.no();
	};
	if (!args.length) {
		return err("missing file operand");
	}
	if (args.length==1){
		return err("missing link name");
	}
	if (args.length>2){
		return err("too many arguments");
	}

	let target = args.shift();
	let path = args.shift();

	let target_node = await fsapi.pathToNode(normPath(target, this.env.cwd.cwd));
	if (!target_node) {
		return err("the target does not exist");
	}
	if (target_node.type != FS_TYPE || target_node.appName === FOLDER_APP){
		return err("the link cannot be created");
	}
	let blobid = target_node.blobId;
	if (!Number.isFinite(blobid)) {
		if (target_node.data) {
			return err("the target node is a data node");
		}
		return err("the target node does not have an associated blob in the blob store");
	}

//	if (!await fsapi.checkDirPerm(target_node.par)) {
	if (!target_node.par.okWrite) {
		return err(`${target_node.par.fullpath}: permission denied`);
	}

	let fullpath = normPath(path, this.env.cwd.cwd);
	let node = await fsapi.pathToNode(fullpath, true);
	if (node) {
		return err(`${path}: already exists`);
	}
	let arr = fullpath.split("/");
	let fname = arr.pop();
	let parpath = arr.join("/");
	let parnode = await fsapi.pathToNode(parpath);

	if (!(parnode && parnode.appName === FOLDER_APP)) {
		return err(`${parpath}: not a directory`);
	}
	if (parnode.type !== FS_TYPE) {
		return err(`${fullpath}: the parent directory is not of type '${FS_TYPE}'`);
	}
//	if (!await fsapi.checkDirPerm(parnode)) {
	if (!parnode.okWrite) {
		return err(`${path}: permission denied`);
	}
	let newnode = await fsapi.makeHardLink(parnode, fname, blobid);
	if (!newnode) {
		return err(`${path}: the link could not be created`);
	}
	this.suc(`${fname} -> blobId(${blobid})`);
	this.ok();
}
}//»
const com_symln = class extends Com{//«

async run(){
	let{args,term}=this;
	const err=(mess)=>{
		this.err(mess);
		this.no();
	};
	if (!args.length) {
		return err("missing file operand");
	}
	if (args.length==1){
		return err("missing link name");
	}
	if (args.length>2){
		return err("too many arguments");
	}
	let target = args.shift();
	let path = args.shift();

	let fullpath = normPath(path, this.env.cwd.cwd);
	let node = await fsapi.pathToNode(fullpath, true);
	if (node) {
		return err(`${path}: already exists`);
	}
	let arr = fullpath.split("/");
	let fname = arr.pop();
	let parpath = arr.join("/");
	let parnode = await fsapi.pathToNode(parpath);
	if (!(parnode && parnode.appName === FOLDER_APP)) {
		return err(`${parpath}: not a directory`);
	}
	if (parnode.type !== FS_TYPE) {
		return err(`${fullpath}: the parent directory is not of type '${FS_TYPE}'`);
	}
//	if (!await fsapi.checkDirPerm(parnode)) {
	if (!parnode.okWrite) {
		return err(`${path}: permission denied`);
	}
	let newnode = await fsapi.makeLink(parnode, fname, target, normPath(target, this.env.cwd.cwd));
	if (!newnode) {
		return err(`${path}: the link could not be created`);
	}
	this.suc(`${fname} -> ${target}`);
	this.ok();
}

}//»
const com_dl = class extends Com{//«
static getOpts(){
	return {s:{n:3,},l:{name:2}};
}
async init(){
	const{opts, env, args}=this;
	let nargs = args.length;
	if (!nargs && !this.pipeFrom) return this.no("no file args and not in a pipeline!");
	if (!nargs){
		this.name = opts.name || opts.n || env["DL_NAME"] || "DL-OUT.txt";
//		this.lines=[];
	}
	else if(nargs > 1){
		this.no("too many arguments");
	}
	else{
		this.noPipe=true;
	}
}
doDL(){
	let val;
	if (this.lines) val = this.lines.join("\n");
	else if (this.buffer) val = this.buffer;
	else{
		this.no("NO LINES OR BUFFER?!?!?!");
return;
	}
	util.download(new Blob([val]), this.name);
	this.ok();
}
async run(){
	const{args}=this;
	if (this.killed || !args.length) return;
	let path = args.shift();
	let fullpath = normPath(path, this.env.cwd.cwd);
	let node = await fsapi.pathToNode(fullpath);
	if (!node) {
		this.no(`${fullpath}: the file could not be found`);
		return;
	}
	if (!node.isFile){
		this.no(`${fullpath}: not a regular file`);
		return;
	}
	this.buffer = await node.bytes;
	this.name = node.name;
	this.doDL();
}
/*«
pipeDone(lines){
	if (this.noPipe) return;
	this.lines = lines;
	this.doDL();
}
pipeIn(val){//Commented out
	if (this.noPipe) return;
	if (isEOF(val)){
		this.out(val);
		this.doDL();
		return;
	}
	if (isStr(val)) this.lines.push(val);
	else if (isArr(val)) this.lines.push(...val);
	else{
cwarn("WUTISTHIS", val);
	}
}
»*/
}//»
const com_blobs = class extends Com{//«
async run(){
	const{args, term}=this;
	let out = [];
	let nargs = args.length;
	let cur_dir = this.env.cwd.cwd;
	if (nargs){
		for (let arg of args){
			if (nargs > 1) out.push(`${arg}:`);
			if (arg.match(/^[0-9]+$/)) arg = parseInt(arg);
			else{
				let got = await fsapi.pathToNode(normPath(arg, cur_dir));
				if (got && Number.isFinite(got.blobId)) out.push(got.blobId+"");
				else out.push("?");
				if (nargs > 1) out.push("");
				continue;
			}
			let rows = await fsapi.getNodesByBlobId(arg);
			if (!rows.length) out.push("-");
			for (let row of rows){
				let path = await fsapi.getPathByDirId(row.parId);
				if (!path) out.push(`?/${row.name}`);
				else out.push(`${path}/${row.name}`);
			}
			if (nargs > 1) out.push("");
		}
	}
	else {
		let dir = await fsapi.getBlobDir();
		let ents = dir.entries();
//log(ents);
		let tot=0;
		let num=0;

		for await (const [k, v] of ents){
			num++;
			let f = await v.getFile();
			let arr = (f.lastModifiedDate+"").split(" ");
			arr.shift();
			arr.pop();
			arr.pop();
			arr.pop();
			arr.pop();
			let date = arr.join(" ");
			let sz = f.size;
			tot+=sz;
			out.push(`${k}:  ${sz}  ${date}`);
		}
		out.push("");
		out.push("Totals");
		out.push(`Entries: ${num}`);
		out.push(`Size: ${tot}`);
	}
	if (out.length)  this.out(out.join("\n"));
	this.ok();
}
}//»
const com_purge = class extends Com{//«

async run(){
	if (globals.read_only) return this.no("Read only");

	const{args}=this;
	let have_error = false;
	const err=(mess)=>{
		have_error=true;
		this.err(mess);
	}
	let dir = await fsapi.getBlobDir();
	for (let arg of args){
		if (!arg.match(/^[0-9]+$/)) {
			err(`skipping invalid blob id: '${arg}'`);
			continue;
		}
		let rows = await fsapi.getNodesByBlobId(parseInt(arg));
		if (rows.length){
			err(`${arg}: not purging (${rows.length} entries)`);
			continue;
		}
		try{
			await dir.removeEntry(arg);
		}
		catch(e){
			err(`${arg}: ${e.message}`);
		}
	}
	have_error?this.no():this.ok();	
}

}//»
const com_clearstorage = class extends Com{//«
async run(){
	let {term, no}=this; 
	if (globals.read_only) return no("Read only");
	
    let ret = await widgets.popyesno(`Clear EVERYTHING in storage?`,{reverse: true});
	if (!ret) return no("not clearing");
    await fsapi.clearStorage();
	Desk.clear_desk_icons();
	this.ok("please refresh the page!");
}
}//»

/*
const com_unmount = async (args,opts, _) => {//«
	let {term}=_; 
	const terr=(arg)=>{return {err: arg};};
    let mntdir = fs.root.kids.mnt;
    let mntkids = mntdir.kids
    let name = args.shift();
    if (!name) return terr("Mount name not given!");
	if (!mntkids[name]) return terr(`${name}: Not mounted`);
	delete mntkids[name];
};//»
const com_mount = async (args,opts, _) => {//«
	let {term}=_; 
	const terr=(arg)=>{return {err: arg};};
	let rv = await fsapi.mountDir(args.shift());//In a multiline comment!!!
	if (isStr(rv)) return terr(rv);
	else if (rv!==true) return terr(`Unknown response: ${rv}`);
}//»
*/

//»

const coms = {//«

_blobs: com_blobs,
//brep: com_brep,
wc: com_wc,
grep: com_grep,
dl: com_dl,
less:com_less,
mkdir: com_mkdir,
rmdir: com_rmdir,
mv:com_mv,
cp:com_cp,
rm:com_rm,
symln:com_symln,
ln:com_ln,
vim:com_vim,
vimtest: com_vimtest,
touch:com_touch,

}//»

if (admin_mode){//«
	coms._purge = com_purge;
	coms._clearstorage = com_clearstorage;
}
else{
	coms._purge = ADMIN_COM;
	coms._clearstorage = ADMIN_COM;
}//»

LOTW.coms[LIBNAME] = {coms};

})();

