/*Setting environment variables (10/5/2024):

Normally this is done through .bashrc files, using export. But I don't want to mess with
the complexity of machine-reading text files. Right now, the ENV variable is set here, which
forces us to manually set all environment vars on the command line. I want ENV
to be a global variable (which I just added into config.js as globals.TERM_ENV).

Now to set persistent vars to ENV, just save them to ~/.env, e.g.:
VAR1=Something
BLAH=What in the hell

*/
/*Making a data file«
const com_mkdat = async(args, o)=>{
	const {term, opts, stdin} = o;
	let f = args.shift();
	if (!f) return;
	let arr = await f.toParNodeAndName(term);
	if (!arr) return {err: `Not found: ${f}`};
	let par = arr[0];
	let name = arr[1];
	let fullpath = arr[2];
	let kid = await fullpath.toNode();
//Updating
	if (kid) {
if (!kid.data) return {err: "Not a data node!"}
if (!await kid.setValue({type: "harko99998", FROYNKMISCH: 4321.8765})) return {err: "Could not set value"};
log(kid);
log(kid.data);
return;
	}
//Creating data node
	kid = await fsapi.writeDataFile(fullpath, {value: 1, type: "number"});
};
»*/
/*Notes (September 2024)«
9/6/2024:
Made a global variable, "appclass".

Got rid of all things dealing with "ssh" (which is just a stupid amount of complexity
for the real world benefit that is received).

9/5/2024:

@XOPIUYTK
Looking at the editor/pager specific functions like init_edit_mode and init_pager_mode,
as well as modequit, in order to see how this can be improved and generalized to allow
for more novel applications. Want a generic workflow for entering and leaving different
application screens. The newly invoked application needs to get a handle on the 
terminal's current lines array. Then, upon quitting, it needs to give this back to
the terminal. We need the ability to do abitrarily deep recursions of applications
calling applications as submodes, calling applications as submodes...

Now after revamping everything:
It looks like the way we are switching the terminal's onescape handler back and forth
is the only thing that (almost certainly) won't allow use to do arbitrary recursion,
and we are going to need to need to attach it to the various screen_state objects.

And now it looks good for doing our crazy recursion idea.

Took out @SKLIOPMN, because this is a trivial function that unnecessarily complicates
the logic with application specific purposes.

Updated on 9/4/2024:

@SURMPLRK: The algorithm has been improved because the max_cols was being
initialized to stupidly high values, given normal terminal widths, causing
fmt_ls to be recursively called waaaay too many times.  

Also @JSOJPRI, which now has a while(true) loop, that *looks like* it *should*
always break...
»*/

//Notes (Old)«
/*Broken (now fixed)://«
1) Make a file with the 'touch' command
2) Use the '_blobs' command to verify there is no saved blob
3) Put something in that file with vim (this bug doesn't happen with shell redirects)
4) Verify that it has a saved blob with the '_blobs' command
5) Refresh the page
6) Verify that is no longer has a saved blob with the '_blobs' command
//»*/
//Issues«
/*@JEPOIKLMJYH: I don't understand why this was giving errors on backspaces
after pressing the up key in order to scroll back in history, but now it isn't!!
*/
//»
/*"Importing" command libraries via com_import is [NO LONGER] a deprecated solution.«
Instead, use the ALL_LIBS object, which stores the names of all of the 
commands, under an array that is keyed by the name of the given command
library in coms/, but just without the ending '.js'. This is a very
robust, quick&dirty solution to a problem that is made more complex with
something like an "import" command.
»*/
/*Websockets are used in a kind of ssh mechanism.«

The 'ssh' command allows for 1 'server' terminal and 1 'client' terminal to
connect to the Node.js backend via websockets. The server terminal should have
all relevant environment variables set before executing the 'ssh --server' command, 
which locks the terminal.

"ssh immediate mode" means that the client sends everything after the prompt
to the ssh server. This is set via 'ssh -i'. While in immediate mode, it
can be terminated via Ctrl+c. Otherwise, any arguments to the ssh command
are interpreted as a command to be passed along to the server. This means
that all of the normal piping and redirections should work.

»*/
//»

//Development mod deleting«

const DEL_MODS=[
//	"util.less",
	"util.vim",
	"util.email",
//	"webmparser"
//	"pager"
];
const DEL_COMS=[
//"audio"
//	"yt",
//	"test",
	"fs",
];
//»

//Imports«

import { util, api as capi } from "util";
import { globals } from "config";
const{strnum, isarr, isstr, isnum, isobj, make, kc, log, jlog, cwarn, cerr}=util;
const {
	KC,
	DEF_PAGER_MOD_NAME,
	NS,
	TEXT_EDITOR_APP,
	LINK_APP,
	FOLDER_APP,
	FS_TYPE,
	MOUNT_TYPE,
	SHM_TYPE,
	fs,
	isMobile,
	shell_libs,
	dev_mode
} = globals;
const fsapi = fs.api;
const widgets = NS.api.widgets;
const {poperr} = widgets;
const {normPath}=capi;
const {pathToNode}=fsapi;

const HISTORY_FOLDER = `${globals.HOME_PATH}/.history`;
const HISTORY_PATH = `${HISTORY_FOLDER}/shell.txt`;
const HISTORY_PATH_SPECIAL = `${HISTORY_FOLDER}/shell_special.txt`;
const LEFT_KEYCODE = KC.LEFT;


//»

//Shell«

//Var«

const NO_SET_ENV_VARS = ["USER"];

const ALIASES={
	c: "clear",
	la: "ls -a"
//	ai: "appicon"
};

//const ALLOW_REDIRECT_CLOBBER = false;
const ALLOW_REDIRECT_CLOBBER = true;

const FS_COMS=[//«
	"_purge",
	"_clearstorage",
	"_blobs",
	"wc",
	"grep",
	"dl",
	"less",
	"cat",
	"mkdir",
	"rmdir",
	"mv",
	"cp",
	"rm",
	"symln",
	"ln",
	"vim",
	"touch",
//"gunttt"
//	"mount",
//	"unmount",
];//»

/*
const TEST_COMS=[
	"test"
];
const YT_COMS=[
	"ytsrch",
	"ytthing",
	"ytvid",
	"ytdl"
];
*/
const ALL_LIBS = {
//	audio:["midiup"],
	fs: FS_COMS,
//	test: TEST_COMS,
//	yt: YT_COMS
};

const ASSIGN_RE = /^([_a-zA-Z][_a-zA-Z0-9]*(\[[_a-zA-Z0-9]+\])?)=(.*)/;

//Maximum length of a line entered into the terminal (including lines in scripts)
const MAX_LINE_LEN = 256;

//To allow writing of files even if there is an external lock on it, change this to true
//const allow_write_locked = false;

const NOOP=()=>{return TERM_ERR;};
const TERM_OK = 0;
const TERM_ERR = 1;

const DIRECTORY_TYPE = "d";
const LINK_TYPE = "l";
const BAD_LINK_TYPE = "b";
const IDB_DATA_TYPE = "i";//Data structures that are stored directly in the indexedDB Nodes table

//»

//Helper funcs«

const sleep = (ms)=>{//«
	if (!Number.isFinite(ms)) ms = 0;
	return new Promise((Y,N)=>{
		setTimeout(Y, ms);
	});
};//»
const hang=()=>{return new Promise((Y,N)=>{});};
const get_options = (args, com, opts={}) => {//«
	const getlong = opt => {
		let re = new RegExp("^" + opt);
		let numhits = 0;
		let okkey;
		for (let k of lkeys) {
			if (re.exec(k)) {
				numhits++;
				okkey = k;
			}
		}
		if (!numhits) {
			err.push(`${com}: invalid option: '${opt}'`);
			return null;
		} else if (numhits == 1) return okkey;
		else {
			err.push(`${com}: option: '${opt}' has multiple hits`);
			return null;
		}
	};
	let err = [];
	let sopts = opts.SHORT || opts.s;
	let lopts = opts.LONG || opts.l;
	let getall = opts.ALL;
//	let getall = true;
	let obj = {};
	let arg_start = null;
	let arg_end = null;
	let arg1, arg2;
	let marr;
	let ch;
	let ret;
	if (!sopts) sopts = {};
	if (!lopts) lopts = {};
	let lkeys = Object.keys(lopts);
	for (let i = 0; i < args.length;) {
		if (isobj(args[i])) {
			i++;
			continue;
		}
		if (args[i].toString() == "--") {
			args.splice(i, 1);
			return [obj, err];
		}
		else if (marr = args[i].match(/^-([a-zA-Z][a-zA-Z]+)$/)) {
			let arr = marr[1].split("");
			for (let j = 0; j < arr.length; j++) {
				ch = arr[j];
//				if (sopts[ch] === 2 || sopts[ch] === 3) {
				if (!getall && (sopts[ch] === 2 || sopts[ch] === 3)) {
					if (i === 0) obj[ch] = arr.slice(1).join("");
					else err.push(`${com}: option: '${ch}' requires args`);
				}
				else if (getall || sopts[ch] === 1) obj[ch] = true;
				else if (!sopts[ch]) err.push(`${com}: invalid option: '${ch}'`);
				else err.push(`${com}: option: '${ch}' has an invalid option definition: ${sopts[ch]}`);
			}
			args.splice(i, 1);
		}
		else if (marr = args[i].match(/^-([a-zA-Z])$/)) {
			ch = marr[1];
			if (getall){
				if (!args[i + 1]) err.push(`${com}: option: '${ch}' requires an arg`);
				obj[ch] = args[i + 1];
				args.splice(i, 2);
			}
			else if (!sopts[ch]) {
				err.push(`${com}: invalid option: '${ch}'`);
				args.splice(i, 1);
			} else if (sopts[ch] === 1) {
				obj[ch] = true;
				args.splice(i, 1);
			} else if (sopts[ch] === 2) {
				err.push(`${com}: option: '${ch}' is an optional arg`);
				args.splice(i, 1);
			} else if (sopts[ch] === 3) {
				if (!args[i + 1]) err.push(`${com}: option: '${ch}' requires an arg`);
				obj[ch] = args[i + 1];
				args.splice(i, 2);
			} else {
				err.push(`${com}: option: '${ch}' has an invalid option definition: ${sopts[ch]}`);
				args.splice(i, 1);
			}
		} else if (marr = args[i].match(/^--([a-zA-Z][-a-zA-Z]+)=(.+)$/)) {
			if (getall || (ret = getlong(marr[1]))) {
				if (getall) ret = marr[1];
				obj[ret] = marr[2];
			}
			args.splice(i, 1);
		} else if (marr = args[i].match(/^--([a-zA-Z][-a-zA-Z]+)=$/)) {
			if (getall || (ret = getlong(marr[1]))) {
				if (getall) ret = marr[1];
				obj[ret] = args[i + 1];
				if (args[i + 1]) args.splice(i + 1, 2);
				else args.splice(i, 1);
			} else args.splice(i, 1);
		} else if (marr = args[i].match(/^--([a-zA-Z][-a-zA-Z]+)$/)) {
			if (getall || (ret = getlong(marr[1]))) {
				if (getall) ret = marr[1];
				if (getall || (lopts[marr[1]] === 1 || lopts[marr[1]] === 2)) obj[ret] = true;
				else if (lopts[marr[1]] === 3) err.push(`${com}: long option: '${marr[1]}' requires an arg"`);
				else if (lopts[marr[1]]) err.push(`${com}: long option: '${marr[1]}' has an invalid option definition: ${lopts[marr[1]]}`);
				else if (!lopts[marr[1]]) err.push(`${com}: invalid long option: '${marr[1]}`);
				args.splice(i, 1);
			} else args.splice(i, 1);
		} 
		else if (marr = args[i].match(/^(---+[a-zA-Z][-a-zA-Z]+)$/)) {
			err.push(`${com}: invalid option: '${marr[1]}'`);
			args.splice(i, 1);
		}
		else i++;
	}
	return [obj, err];
}//»
const add_to_env=(arr, env, opts)=>{//«
	let {term, if_export} = opts;
	let marr;
	let use;
	let err = [];
	use = arr[0];
	let assigns = {};
	while (use) {
		let which;
		const next=()=>{
			arr.shift();
			if (arr[0]===" ") arr.shift();
			use = arr[0];
		};
		marr = ASSIGN_RE.exec(use);
		if (!marr){
			if (!if_export) break;
			else{
				err.push(`sh: '${use}': not a valid identifier`);
				next();
				continue;
			}
		}
		which = marr[1];
		if (NO_SET_ENV_VARS.includes(which)){
			err.push(`${which}: cannot set the constant environment variable`);
			next();
			continue;
		}
		assigns[which]=marr[3];
//		env[which]=marr[3];
		next();
	}
	if (!arr.length && !if_export){
		env = term.ENV;
	}
	for (let k in assigns){
		env[k]=assigns[k];
	}
	return err;
};//»
const term_error=(term, arg)=>{//«
//	if (isstr(arg)) arg = term.fmt2(arg);
	term.response(arg);
};//»
const term_out=(term, arg)=>{//«
	if (isstr(arg)) arg = term.fmt(arg);
	term.response(arg);
};//»
const write_to_redir=async(term, str, redir, env)=>{//«
	let op = redir.shift();
	let fname = redir.shift();
	if (!fname) return {err:`Missing operand to the redirection operator`};
	let fullpath = normPath(fname, term.cur_dir);
	let node = await fsapi.pathToNode(fullpath);
	if (node) {
		if (node.type == FS_TYPE && op===">" && !ALLOW_REDIRECT_CLOBBER) {
			if (env.CLOBBER_OK==="true"){}
			else return {err: `Not clobbering the file (ALLOW_REDIRECT_CLOBBER==${ALLOW_REDIRECT_CLOBBER})`};
		}
		if (node.write_locked()){
			return {err:`${fname}: the file is "write locked" (${node.write_locked()})`};
		}
		if (node.data){
			return {err:`${fname}: cannot write to the data file`};
		}
	}
	let patharr = fullpath.split("/");
	patharr.pop();
	let parpath = patharr.join("/");
	if (!parpath) return {err:`${fname}: Permission denied`};
	let parnode = await fsapi.pathToNode(parpath);
	let typ = parnode.type;
	if (!(parnode&&parnode.appName===FOLDER_APP&&(typ===FS_TYPE||typ===SHM_TYPE||typ=="dev"))) return {err:`${fname}: Invalid or unsupported path`};
	if (typ===FS_TYPE && !await fsapi.checkDirPerm(parnode)) {
		return {err:`${fname}: Permission denied`};
	}
	if (!await fsapi.writeFile(fullpath, str, {append: op===">>"})) return {err:`${fname}: Could not write to the file`};
	return {};
};//»
const curly_expansion = (word) => {//«
	let marr;
	let out = false;
	if (marr = (word.match(/(.*){(\d+)\.\.(\d+)}(.*)/) ||word.match(/(.*){([a-z])\.\.([a-z])}(.*)/)||word.match(/(.*){([A-Z])\.\.([A-Z])}(.*)/))){
		out = [];
		let is_num;
		let from, to;
		if (marr[2].match(/\d/)){
			is_num = true;
			from = parseInt(marr[2]);
			to = parseInt(marr[3]);
		}
		else {
			from = marr[2].charCodeAt();
			to = marr[3].charCodeAt();
		}
		let pre = marr[1];
		let post = marr[4];
		let inc;
		if (from > to)inc=-1;
		else inc = 1;
		if (from <= to) {
			for (let i = from; i <= to; i++){
				let ch;
				if (is_num) ch = i;
				else ch = String.fromCharCode(i);
				out.push(`${pre}${ch}${post}`);
			}
		}
		else{
			for (let i = from; i >= to; i--){
				let ch;
				if (is_num) ch = i;
				else ch = String.fromCharCode(i);
				out.push(`${pre}${ch}${post}`);
			}
		}

	}
	return out;
}//»
const all_expansions=async(arr, term)=>{//«
	let {ENV, cur_dir} = term;
	let err;
	for (let i=0; i < arr.length; i++){
		let word = arr[i].word;
		if (!word) continue;
		let marr;
		let rv;
		let use_cur_dir = cur_dir;
		let say_path = "";
		if (i>0 && arr[i-1].ds=="$") {
			let got = ENV[word];
			if (!got) arr.splice(i-1, 2);
			else{
				arr[i-1] = {t:"word",word: got};
				arr.splice(i, 1);
			}
		}
		else if (word.match(/[*?]/)||word.match(/\[[-0-9a-z]+\]/i)) {
			if (word.match(/\x2f/)){
				let path_arr = word.split("/");
				if (word.match(/^\x2f/)) {
					path_arr.shift();
					word = path_arr.pop();
					say_path = "/"+path_arr.join("/");
					use_cur_dir = say_path;
				}
				else if (path_arr.length && path_arr[0]) {
					word = path_arr.pop();
					use_cur_dir = normPath(path_arr.join("/"), cur_dir);
					say_path = path_arr.join("/");
				}
			}
			let fpat = word.replace(/\*/g, ".*").replace(/\?/g, ".");
			let re;
			try{ 
				re = new RegExp("^" + fpat + "$");
			}
			catch(e){
				err = e.message;
				continue;
			}
			let dir = await pathToNode(use_cur_dir);
			if (!dir) continue;
			if (!dir.done) await fsapi.popDir(dir);
			let kids = dir.kids;
			let keys = Object.keys(kids);
			let did_splice = false;
			for (let k of keys){
				if (k=="."||k=="..") continue;
				if (re.test(k)) {
					if (!did_splice) {
						arr.splice(i, 1);
						i--;
						did_splice = true;
					}
					if (say_path && !say_path.match(/\x2f$/)) say_path = `${say_path}/`;
					arr.splice(i, 0, {t:"word", word: `${say_path}${k}`});
					i++;
				}
			}
		}
		else if (rv = curly_expansion(word)){
			const do_exp=(arr, out)=>{
				for (let wrd of arr){
					let rv = curly_expansion(wrd);
					if (rv) do_exp(rv, out);
					else out.push({t:"word", word: wrd});
				}
				return out;
			};
			try{
				let all = do_exp(rv, []);
				arr.splice(i, 1, ...all);
				i+=all.length-1;
			}catch(e){
cerr(e);
				err = `${e.message} (${word})`;
			}
		}
	}
	return err;
}//»

const get_file_lines_from_args=async(args, term)=>{//«
	let err = [];
	let out = [];
	const fullterr=(arg)=>{
		err.push(`${fullpath}: ${arg}`);
		return TERM_ERR;
	};
	let fullpath;
	while (args.length) {
		fullpath = normPath(args.shift(), term.cur_dir);
		let node = await fsapi.pathToNode(fullpath);
		if (!node) {
			fullterr(`No such file or directory`);
			continue;
		}
		let typ = node.type;
		if (typ==FS_TYPE) {
			if (!node.blobId) {
				continue;
			}
		}
		else if (typ==MOUNT_TYPE){
		}
		else{
	cwarn(`Skipping: ${fullpath} (type=${typ})`);
			continue;
		}

		if (node.appName === FOLDER_APP) {
			fullterr(`Is a directory`);
			continue;
		}
		let val = await node.text;
		if (!isstr(val)) {
			fullterr("An unexpected value was returned");
			continue;
		}
		let arr = val.split("\n");
		for (let ln of arr) out.push(ln);
	}
	return {err, out};
};//»
const get_libs = async()=>{//«
	let coms = await "/site/coms".toNode();
	let all = [];
	const getkids = dir =>{
		for (let nm in dir){
			if (nm.match(/^\./)) continue;
			let kid = dir[nm];
			if (kid.kids) getkids(kid.kids);
			else{
				let parts = kid.fullpath.split("/");
				parts.pop();
				parts.shift();
				parts.shift();
				parts.shift();
				parts.shift();
				if (parts.length) all.push(parts.join(".")+`.${kid.baseName}`);
				else all.push(kid.baseName);
			}
		}
	};
	getkids(coms.kids);
	return all;
};//»

const lines_to_paras = lns => {//«
	let paras = [];
	let curln = "";
	for (let ln of lns){
		if (ln.match(/^\s*$/)){
			if (curln) {
				paras.push(curln);
				curln = "";
			}
			paras.push("");
			continue;
		}
		if (ln.match(/-\s*$/)) ln = ln.replace(/-\s+$/,"-");
		else ln = ln.replace(/\s*$/," ");
		curln = curln + ln;
	}
	if (curln) paras.push(curln);
	return paras;
}//»

//»

//Builtin commands«

//Command functions«

/*
const com_ = async(args, o)=>{
	const {term, opts, stdin} = o;
};
*/

const com_smtp = async(args, o)=>{//«
// smtp   email_text_file_path   to   Subject goes here...
// echo   Here is the email text...  |  smtp   to   Subject goes here...
	const {term, stdin, opts} = o;
//	let from = term.ENV.EMAIL_FROM;
//	if (!from) return {err: "No EMAIL_FROM in the environment!"}
	let to_paras = opts["to-paras"]||opts.p;
//cwarn("PARAS", to_paras);
	let txt;
	if (stdin) {
		txt = stdin.join("\n");
	}
	else {
		let path = await args.shift();
		if (!path) return {err:"No file to send"};
		let node = await path.toNode(term);
		if (!node) return {err: `${path}: not found`};
		txt = await node.text;
	}
	if (!txt.match(/[a-z]/i)) return {err: "No lower ascii alphabetic characters were found in the message"};
	if (to_paras) {
		txt = lines_to_paras(txt.split("\n")).join("\n");
	}
	let to = await args.shift();
	if (!to) return {err:"No one to send to"}
	if (!to.match(/^\w+@\w+\.[a-z]+$/i)) return {err: "Bad looking email address"};

	let sub = args.join(" ");
	if (!sub) return {err: "No subject given"}
cwarn("TO",to);
cwarn("SUB",sub);
cwarn(`TEXT: ${txt.length} chars`);
//log(txt);
//return;
//	let rv = await fetch(`/_smtp?to=${encodeURIComponent(to)}&from=${encodeURIComponent(from)}&subject=${encodeURIComponent(sub)}`, {method:"POST", body: txt});
	let rv = await fetch(`/_smtp?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(sub)}`, {method:"POST", body: txt});
	if (!(rv&&rv.ok&&rv.text)) {
log(rv);
		return {err: "An unknown response was received from smtp service"}
	}
	txt = await rv.text();
cwarn(txt);
	if (rv.ok) return txt;
	return {err: txt.split("\n")[0]};

};//»
const com_imap = async(args, o)=>{//«

	let rv = await fetch(`/_imap`);
	let out = await rv.text();
	if (!rv.ok) {
		let val = out.split("\n")[0];
		return {err: out};
	}
	return {out};

};//»
const com_email = async(args, o)=>{//«

/*

l:{adduser:3,deluser:3,setuser:3}

For adduser, deluser, and curuser options (and other administration tasks), we can send
this information into init, which can take care of the users/curuser file (and the
table adding/deleting if needed), and then return before invoking init_new_screen/set_screen.

adduser: add to the users file and make the tables
deluser: rm from the users file and delete the tables (after a prompt screen)
setuser: write the given user email to the curuser file, and use this user for the next session. 
This must be checked against available users who were added with adduser.

*/

	const {term, opts, stdin, command_str} = o;
    if (!await capi.loadMod("util.email")) {
        return {err: "Could not load the email module"};
    }
    let email = new NS.mods["util.email"](term);
    let rv = await email.init({command: command_str});
    if (isstr(rv)){
        return {err: rv};
    }

};//»
const com_termlines=(args,o)=>{//«
	const {term, opts, stdin} = o;
	let idstr = args.shift();
	if (!idstr) return {err:"No winid given"}
	let id = idstr.ppi();
	if (isNaN(id)) return {err:"Invalid id: want a positive integer"}
	let win = document.getElementById(`win_${id}`);
	if (!win) return {err:"No window with that id"};
	if (win._winObj.appName!=="Terminal") return {err:"Not a terminal"};
	return {out: win._winObj.app.lines};
//	return win._winObj.app.lines;
};//»
const com_test = async(args, o)=>{//«
	const {term, opts, stdin} = o;
//let re = /THIS/y;
let arr = [
" ",
" ",
" ",
" ",
"T","H","I","S",
" ",
" ",
" ",
" ",
"T","H","I","S",
" ",
" ",
" ",
" ",
" ",
" ",
" ",
" ",
"T","H","I","S"
];
let re = new RegExp("THIS","y");
//let ln = "    THIS    THIS    THIS    ";
let ln = arr.join("")

log(re, ln);
let pos=0;
while(pos < ln.length){
re.lastIndex = pos;
let rv = re.exec(ln);
if (rv){
log(pos, rv);
}
pos++;
}

};//»
const com_parse = async(args, o)=>{//«
	const {term, opts, stdin} = o;
	if (stdin){//«
		try{
			return {out: JSON.parse(stdin)};
		}
		catch(e){
			return {err: "Invalid JSON in stdin"};
		}
	}//»
	let f = args.shift();
	if (!f) return;
	let node = await f.toNode(term);
	if (!node) return {err: `Not found: ${f}`};
	let txt = await node.text;
	if (!txt) return {err: `No text in: ${f}`};
	try{
		return {out: JSON.parse(txt)};
	}
	catch(e){
		return {err: "Invalid JSON in file"};
	}
};//»
const com_curcol = async(args, o)=>{//«
	const {term, opts, stdin} = o;
	let which = args.shift();
	if (which=="white"){
		term.cur_white();
	}
	else if (which=="blue"){
		term.cur_blue();
	}
};//»
const com_getch = async(args, opts)=>{//«
	const {term} = opts;
	let err=[];
	let use_prompt = "";
	let ch = await term.getch(use_prompt);
	return {out: `Got: ${ch}`};
};//»
const com_read = async(args, o)=>{//«
	const {term, opts} = o;
	let err=[];
	let use_prompt = opts.prompt;
	if (use_prompt && use_prompt.length > term.w - 3){
		return {err:`The prompt is too wide (have ${use_prompt.length}, max = ${term.w - 4})`};
	}
	let ln = await term.read_line(use_prompt);
	let vals = ln.trim().split(/ +/);
	while (args.length){
		let arg = args.shift();
		if (NO_SET_ENV_VARS.includes(arg)) {
			err.push(`Refusing to modify read-only variable: ${arg}`);
			vals.shift();
			continue;
		}
		let useval;
		if (!args.length) {
			if (vals.length) useval = vals.join(" ");
		}
		else useval = vals.shift();
		if (!useval) useval = "";
		term.ENV[arg] = useval;
	}
	return {err};
};//»
const com_export = async(args, opts)=>{return {err: add_to_env(args, opts.term.ENV, {if_export: true})};};
const com_hist=(args, opts)=>{return {out: opts.term.get_history()};};
const com_clear=(args, opts)=>{opts.term.clear();};
const com_pwd=(args, opts)=>{return {out: opts.term.cur_dir};};
const com_echo = async (args, opts) => {return {out: args.join(" ").split("\n")};};
const com_help = async(args, opts)=>{//«
	let help = globals.shell_help;
	if (!help){
		try{
			help = (await import("shell_help")).help_text;
		}catch(e){
			return {err: "Could not load the help module"};
		}
		globals.shell_help = help;
	}
	let out = [];
	let nargs = args.length;
	if (!args.length) args = ["help"];
	while (args.length){
		if (out.length) out.push("");
		let which = args.shift();
		if (nargs > 1) out.push(`${which}:`);
		let txt = help[which];
		if (!txt) out.push("not found");
		else out.push(...txt.split("\n"));
	}
	return {out, pretty: true};
};//»
const com_ls = async (args, o) => {//«
	const send_out=s=>{
		if (inpipe) out.push(s);
		else out.push(...term.fmt(s));
	};
	if (!args.length) args.push("./");
	let err = [];
	let out = [];
	let colors = [];
	let {inpipe, term, add_rows, opts={}} = o;
	let nargs = args.length;
	let dir_was_last = false;
	let all = opts.all||opts.a;
	let recur = opts.recursive || opts.R;
	const do_path = async(node_or_path)=>{
		let node;
		let wants_dir;
		let path;
		let regpath;
		if (isstr(node_or_path)){
			path = node_or_path;
			wants_dir = node_or_path.match(/\x2f$/);
			regpath = normPath(node_or_path, term.cur_dir);
			node = await fsapi.pathToNode(regpath, !wants_dir);
		}
		else {
			node = node_or_path;
			regpath = path = node.fullpath;
		}
		let recur_dirs;
		if (recur) recur_dirs = [];
		if (!node) {
			dir_was_last = false;
			err.push(`${regpath}: No such file or directory`);
			return;
		}
		if (node.appName !== FOLDER_APP) {
			if (wants_dir) {
				err.push(`${regpath}: Not a directory`);
				return;
			}
			if (dir_was_last) out.push("");
			dir_was_last = false;
			if (node.appName==LINK_APP){
				send_out(`${node.name} -> ${node.symLink}`);
				return;
			}
			let sz = "?";
			if (node.type === FS_TYPE) {
				let file = await node._file;
				if (file) sz = file.size;
			}
			else if (Number.isFinite(node.size)) sz = node.size;
			send_out(`${node.name} ${sz}`);
			return;
		}
		if (!node.done) await fsapi.popDir(node);
		dir_was_last = true;
		let kids = node.kids;
		let arr = kids._keys;
		let names=[];
		let lens = [];
		let types = [];
		if (out.length && nargs > 1 || recur) out.push("");
		if (nargs > 1 || recur) send_out(`${path}:`);
		let s = "";
		let dir_arr = [];
		for (let nm of arr){
			if (!all) {
				if (nm=="."||nm=="..") continue;
				if (nm.match(/^\./)) continue;
			}
			if (inpipe) out.push(nm);
			dir_arr.push(nm);
		}
		if (recur){
			for (let nm of dir_arr){
				let n = kids[nm];
				if (nm=="."||nm=="..") continue;
				if (n.appName === FOLDER_APP) recur_dirs.push(n);
			}
		}
		dir_arr = dir_arr.sort();
		if (inpipe) {
			out.push(...dir_arr);
		}
		else {//«
			for (let nm of dir_arr){
				let n = kids[nm];
				if (nm.match(/\x20/)){
					nm=`'${nm}'`;
				}
				if (n.appName===FOLDER_APP) {
					types.push(DIRECTORY_TYPE);
				}
				else if (n.appName==="Link") {
					if (!await n.ref) types.push(BAD_LINK_TYPE);
					else types.push(LINK_TYPE);
				}
				else if (n.blobId === IDB_DATA_TYPE) types.push(IDB_DATA_TYPE);
				else types.push(null);
			}
			let name_lens = [];
			for (let nm of dir_arr) name_lens.push(nm.length);
			let ret = [];
			term.fmt_ls(dir_arr, name_lens, ret, types, colors, out.length+err.length+add_rows);
			out.push(...ret);
		}//»
		if (recur) {
			for (let dir of recur_dirs) await do_path(dir);
		}
	};
	while (args.length) {
		await do_path(args.shift());
	}
	return {err, out, didFmt: true, colors};
};
//»
const com_cd = async (args, opts) => {//«
	const e=s=>{return {err: [s]}}
	let res;
	let got_dir, dir_str, dirobj;
	let {term}=opts;
	const cd_end = () => {
		if (!got_dir.match(/^\x2f/)) got_dir = `/${got_dir}`;
		term.cur_dir = got_dir;
		term.cwd = got_dir;
	};
	if (!args.length) {
		got_dir = term.get_homedir();
		cd_end();
		return TERM_OK;
	}
	let saypath = args[0];
	let regpath = normPath(saypath, term.cur_dir);
	let ret = await fsapi.pathToNode(regpath);
	if (!ret) {
		return e(`${saypath}: No such file or directory`);
	}
	if (ret.appName != FOLDER_APP) {
		return e(`${saypath}: Not a directory`);
	}
	got_dir = regpath;
	cd_end();

};//»
const com_env = async (args, opts) => {//«
	if (args.length) return {err:"Arguments are not supported"};
	let {term}=opts; 
	let env = term.ENV;
	let keys = env._keys;
	let out = [];
	for (let key of keys){
		let val = env[key];
		out.push(`${key}=${val}`);
	}
	return {out};
};//»
const com_app = async (args, opts) => {//«
	let {term}=opts; 
	let err = [];
	const terr=(arg)=>{
		err.push(arg);
	};
	let list;
	if (!args.length) {
		list = await capi.getList("/site/apps/");
		return {out: list};
	}
	for (let appname of args){
		if (list && !list.includes(appname)) {
			err.push(`${appname}: app not found`);
			continue;
		}
		term.Desk.api.openApp(appname);
	}
	return {err};
};//»
const com_appicon=async(args, opts)=>{//«
	if (!args.length) return {out: await capi.getList("/site/apps/")};
	return {out: JSON.stringify({app: args.shift()})};
};//»
const com_open = async (args, opts) => {//«
	let {term}=opts; 
	let err = [];
	const terr=(arg)=>{err.push(arg);};
	if (!args.length) {
		terr(`open: missing operand`);
		return {err};
	}
	for (let path of args) {
		let fullpath = normPath(path, term.cur_dir);
		let node = await fsapi.pathToNode(fullpath);
		if (!node) {
			terr(`${path}: No such file or directory`);
			continue;
		}
		term.Desk.open_file_by_path(node.fullpath);
	}
	return {err};
};//»
const com_epoch=()=>{return {out:Math.round((new Date).getTime()/1000)+""};};
const com_true=()=>{return {code: 0, out: "I'm true"};};
const com_false=()=>{return {code: 1, out: "I'm false"};};
const com_msleep = async(args, opts)=>{//«
	let ms = parseInt(args.shift());
	if (!Number.isFinite(ms)) ms = 0;
	await sleep(ms);
};//»
const com_libs = async (args, o) => {//«
	return {
		out: await capi.getList("/site/coms/")
	};
};//»
const com_lib = async(args, o)=>{//«
	const {term, opts, stdin} = o;
	let lib = args.shift();
	if (!lib) return {err: "no lib given!"};
	let hold = lib;
	let got = ALL_LIBS[lib] || NS.coms[lib];
	if (got){
		return {out: Object.keys(got)};
	}
	lib = lib.replace(/\./g,"/");
	let path = `/coms/${lib}.js`;
	try{
		const coms = (await import(path)).coms;
		return {out: Object.keys(coms)};
	}catch(e){
cerr(e);
		return {err: `The library: '${hold}' could not be loaded!`};
	}
};//»
const com_import=async(args, opts)=>{//«
	let {term}=opts;
	let err = [];
	const terr=(arg)=>{err.push(arg);};
	for (let arg of args){
		if (ALL_LIBS[arg] || NS.coms[arg]) {
			terr(`${arg}: Already loaded`);
			continue;
		}   
		try{
			let modpath = arg.replace(/\./g,"/");
			const coms = (await import(`/coms/${modpath}.js`)).coms;
			NS.coms[arg] = coms;
			let iter=0;
			for (let com in coms){
				if (shell_commands[com]){
					terr(`${com}: already exists`);
					continue;
				}   
				shell_commands[com] = coms[com];
				iter++;
			}
			terr(`imported ${iter} commands from '${arg}'`);
			BUILTINS = shell_commands._keys;
		}catch(e){
			terr(`${arg}: Error importing the module`);
cerr(e);
		}
	}
	return {err};
};//»

/*
const com_hi = async(args, o)=>{//«
	const {term, opts} = o;
	if (term.ssh_server) return {out: "Ready to serve"};
	return {err: "Not connected"}
};//»
const com_ssh = async(args, o)=>{//«
//let server_response_cb;
const server_response=()=>{
	return new Promise((Y,N)=>{
		ws.server_response_cb = Y;
	});
};
const open_socket = () => {//«
return new Promise((Y,N)=>{
const WS_URL = 'wss://192.168.1.100:4443/';
cwarn(`Using WS_URL: ${WS_URL}`)
s = new WebSocket(WS_URL);
//s = new WebSocket('wss://192.168.0.98:4443/');

s.onclose=()=>{//«
cwarn("Socket closed!");
	if (is_client) {
		delete ws.client;
		delete term.ssh_client;
		delete term.ssh_immediate_mode;
	}
	else {
		delete ws.server;
		delete term.ssh_server;
		delete term.locked;
	}
	term.response("Socket closed");
	term.response_end();
};//»
s.onopen=(e)=>{//«
	if (is_client) {
		ws.client = s;
		term.ssh_client = s;
		if (opts.i) {
			term.ssh_immediate_mode = true;
			s.send("pwd");
		}
	}
	else {
		ws.server = s;
		term.ssh_server = s;
		term.locked = true;
	}
	Y();
};//»
s.onmessage=async(e)=>{//«
	let txt = await e.data.text();
	if (is_server){
		let out = [];
		let o = JSON.parse(txt);
		if (o.com) {
			let out = [];
			let err = [];
//			await term.shell.execute(o.com, {script_out: out});
			await term.shell.execute(o.com, {ssh_out: out, ssh_err: err});
			s.send(JSON.stringify({cwd: term.cur_dir, out: out.join("\n"), err: err.join("\n")}));
		}
		else if (o.tab){
			term.handle_tab(o.pos, o.com_arr);
		}
		else{
cwarn("Found non 'com' in server.onmessage...");
log(o);
		}
	}
	else{

		let o = JSON.parse(txt);
		if (o.cwd) {
			term.ssh_cwd = o.cwd;
			let use_cb;
			if (ws.server_response_cb) use_cb = ws.server_response_cb;
			else use_cb = term.response;
			if (o.err) use_cb(o.err.split("\n"));
			if (o.out) use_cb(o.out.split("\n"));
			if (ws.server_response_cb) delete ws.server_response_cb;
			else term.response_end();
		}
		else if (o.chars){
			let chars = o.chars;
			for (let c of chars) term.handle_letter_press(c);
		}
		else if (o.names){
			term.response_com_names(o.names);
		}
		else{
cwarn("What in client.onmessage...");
log(o);
		}
	
	}
};//»

});
};//»
const {term, opts} = o;

let s;
let is_client = opts.client||opts.c;
let is_server = opts.server||opts.s;
let do_close = opts.x;
let mess;
if (!globals.ws) globals.ws = {};
let ws = globals.ws;
if (!ws) return {err: "Not connected"}
if (!is_client && opts.i){
	if (!ws.client) return {err: "Not a client"}
	term.ssh_immediate_mode = true;
	return {out: "Immediate mode on"};
}
if (do_close) {//«
	if (ws.client) {
		ws.client.close();
		delete ws.client;
		return {out: "Client closed"};
	}
	if (ws.server) {
		ws.server.close();
		delete ws.server;
		return {out: "Server closed"};
	}
	return {err: "Nothing to close!"};
}//»
if (args.length){
	if (ws.client) {
		ws.client.send(args.join(" "));
		return {out: await server_response()};
	}
	return {err: "Nowhere to send to!"};
}
if (!(is_client||is_server)) return {err: "Need -s or -c specified"}
if (is_client) {//«
	if (ws.client) return {err: "Already a client"}
	if (ws.server) return {err: "Cannot connect as a client (already a server)"}
	mess="Client";
}
else {
	if (ws.server) return {err: "Already a server"}
	if (ws.client) return {err: "Cannot connect as a server (already a client)"}
	mess="Server";
}//»
await open_socket();
s.send(mess);
if (is_client) {
	if (opts.i){
		await sleep(100);
		s.send(JSON.stringify({com: "pwd"}));
		await server_response();
	}
	return {out: `The ssh client is up${opts.i?" (immediate mode)":""}`}
}
term.response(["The ssh server is up","(terminal locked)"]);
term.scroll_into_view();
term.refresh({noCursor: true});
await hang();

};//»
const com_meta = async(args, o)=>{//«
	let {term}=o;
	let {cwd} = term;
	let file = args.shift();
	if (!file) return {err: "No file"}
	let node = await file.toNode({cwd});
	if (!node) return {err: `${file}: not found`}
	let s = await node.text;
	if (!s) return {err: "No file text"}
	let rv;
	try {
		rv = eval(`(async()=>{${s}})()`);
	}
	catch(e){
cerr(e);
		return {err: e.message};
	}
	return rv;
};//»
const com_pokerruns = async(args, o)=>{//«
	let poker = globals.poker;
	if (!(poker&&poker.hole_cards)) return;
	let hands = poker.hole_cards;
	let text = JSON.stringify(hands);
	let node = await ("/home/me/.data/poker/all-in_trials.json".toNode());
	if (node){
		let rv = await node.setValue(text);
		if (rv && rv.size){
			return {out: `Saved: ${rv.size}`}
		}
	}
	return {out: text};
}//»
const com_pokerhands = async(args, o)=>{//«
	let poker = globals.poker;
	if (!(poker&&poker.hole_cards)) return;
	let hands = poker.hole_cards;
	let keys = Object.keys(hands);
	let arr = [];
	for (let k of keys){
		let o = {};
		o.hand = k;
		o.val = hands[k];
		arr.push(o);
	}
	let all = [];
	let sorted = arr.sort((_a,_b)=>{
		let a = _a.val;
		let b = _b.val;
		let aper = (a.w+a.t) / (a.w+a.l+a.t);
		let bper = (b.w+b.t) / (b.w+b.l+b.t);
		_a.per = aper;
		_b.per = bper;
		if (aper > bper) return -1;
		if (aper < bper) return 1;
		return 0;
	});
	let len = sorted.length;
	let out = {};
	arr = [];
	sorted.forEach((o, idx)=>{
		let per = ((len-idx)/len).toFixed(3);
		out[o.hand] = {rank: per, per: o.per.toFixed(3)};
		arr.push(`${idx}) ${o.hand} ${o.per.toFixed(3)}`);
	});
//log(arr);
	return {out: JSON.stringify(out)};
};//»
*/

//»

const command_options = {//«
/*
l: long options
s: short options

1 means that the option does not have an argument
2 means that the option *may* have an argument
3 means that the option requires an argument

Any argument for a short option requires a mediating space. Below, the '4' is the
argument for the 'x' option.

~$ mycommand -x 4 filename.js

Long options may be given an argument like this:

~$ dosomething --like-this="Right here" to_some.json

*/
//	ssh:{//«
//		s:{c:1, s:1, x:1, i: 1},
//		l:{client: 1, server: 1}
//	},//»
email:{
//	s:{a:1,d:1},
	l:{adduser:3,deluser:3,setuser:3}
},
	ls: {//«
		s: {
			a: 1,
//			l: 1,
//			r: 1,
			R: 1
		},
		l: {
//			long: 1,
			all: 1,
			recursive: 1
		}
	},//»
	rm: {//«
		s:{
			r:1, R:1
		},
		l:{
			recursive: 1
		}
	},//»
	vim:{//«
		l: {
			parsel: 1,
			nosave: 1,
			one: 1,
			insert: 1,
			enterquit: 1,
			"convert-markers": 1,
			"text-input-win": 3,
			"reload-win": 3,
			symbols: 3,
			'keylog-file': 3,
			'num-keylog-steps':3,
//			"is-meta-app": 1,
//			'switch-lns-win': 3,
//			'meta-com-win': 3,
//			'meta-com-args': 3,
		}
	},//»
	less:{l:{parsel:1}},
	dl:{s:{n:3,},l:{name:2}},
	read:{l:{prompt:3}},
	ytsrch:{s:{v:1, c:1, p:1},l:{video:1,channel:1,playlist:1}},
	ytthing:{l:{list:1,items:1,channel:1}},
	ytdl:{s:{p:3, n:1},l:{port:3,name:1}},
	smtp:{
		s:{p:1},
		l:{"to-paras":1}
	}

};//»

const shell_commands={//«
curcol: com_curcol, 
parse: com_parse,
getch: com_getch,
read: com_read,
true: com_true,
false: com_false,
epoch: com_epoch,
hist: com_hist,
help: com_help,
import: com_import,
libs: com_libs,
lib: com_lib,
export: com_export,
pwd: com_pwd,
clear: com_clear,
cd:com_cd,
ls:com_ls,
echo:com_echo,
env:com_env,
app:com_app,
appicon:com_appicon,
open:com_open,
msleep: com_msleep,
email: com_email,
imap: com_imap,
smtp: com_smtp,
//pokerruns: com_pokerruns,
//pokerhands: com_pokerhands,
//termlines: com_termlines,
//hi: com_hi,
//ssh: com_ssh,
//meta: com_meta,
};
if (dev_mode){

shell_commands.test = com_test;
//log();
}


for (let coms in NS.coms){
	for (let com in coms){
		if (!shell_commands[com]){
			shell_commands[com] = coms[com];
			continue;
		}
	}
}
//»

//Init«
for (let k in ALL_LIBS){
	let arr = ALL_LIBS[k];
	for (let com of arr) shell_commands[com]=k;

}

let BUILTINS = shell_commands._keys;

//»

//»

//Shell object«

const Shell = function(term){

//Var«

/*Very dumbhack to implement cancellations of hanging commands, e.g. that might do fetching,«
so that no output from a cancelled command is sent to the terminal, although
whatever the command might be doing to keep it busy is still happening, so it
is up to the shell user to be aware of what is going on behind the scenes:

In shell.execute("command --line -is here"), the first local variable that is
set is started_time (@WIMNNUYDKL).

There is a global cancelled_time that is set when we do a Ctrl+c when the shell is busy.

Immediately after every 'await' in shell.execute(), we do the following check:

if (started_time < cancelled_time) return;

»*/
this.cancelled_time = 0;

//»
//Funcs«

const execute_file=async (comword, cur_dir, env)=>{//«

	const e=s=>{
		return `sh: ${comword}: ${s}`;
	};
	let node = await fsapi.pathToNode(normPath(comword, cur_dir));
	if (!node) return e(`not found`);
	let app = node.appName;
	if (app===FOLDER_APP) return e("is a directory");
	if (app!==TEXT_EDITOR_APP) return e("not a text file");
	if (!comword.match(/\.sh$/i)){
		return e(`only executing files with '.sh' extension`);
	}
	let text = await node.text;
	if (!text) return e("no text returned");
	let rv;
	let lines = text.split("\n");
	let out = [];
	for (let ln of lines){
		let com = ln.trim();
		if (!com) continue;
		await this.execute(com, {script_out: out, env});
	}
	return out;
};//»

//»

//Parse«

//Var«
const CONTROL_WORDS = ["if", "then", "elif", "else", "fi", "do", "while", "until", "for", "in", "done", "select", "case", "esac"];
const shell_metas = [" ", "\t", "|", "&", ";", "(", ")", "<", ">"];
const shell_c_op = [";;&", "||", "&&", ";;", ";&", "|&", "((", "&", ";", "|", "(", ")"];
const shell_r_op = ["<<<", "&>>", "<>", ">>", "<<", "<&", "&>", ">&", ">", "<"];
//»

const shell_escapes = line_arr => {//«
	for (let i = 0; i < line_arr.length; i++) {
		let arr = line_arr[i].split("");
		for (let j = 0; j < arr.length; j++) {
			if (arr[j] == "\\") {
				if (arr[j + 1]) {
					let obj = {
						"t": "esc",
						"esc": arr[j + 1]
					};
					arr[j] = obj;
					arr.splice(j + 1, 1);
					j--;
				}
			}
		}
		line_arr[i] = arr;
	}
	return line_arr;
};//»
const shell_quote_strings = (line_arr) => {//«
	let qtype = null;
	let qarr = [];
	let orig_line_num;
	let orig_pos;
	let ds = null;
	OUTERLOOP: for (let i = 0; i < line_arr.length; i++) {
		let arr = line_arr[i];
		for (let j = 0; j < arr.length; j++) {
			let chneg1 = arr[j - 1];
			let ch = arr[j];
			let ch2 = arr[j + 1];
			let ch3 = arr[j + 2];
			if (!qtype && ((((ch == '"' || ch == "'" || ch == "\x60") || (ch == "<" && ch2 == "<" && ch3 && ch3 != "<" && (j == 0 || (j > 0 && chneg1 != "<"))))))) {
				if (ch == "<") return "sh: heredocs are not implemented";
				qtype = ch;
				orig_line_num = i;
				if (arr[j - 1] == "$") {
					if (ch == "'") {
						arr.splice(j - 1, 1);
						ds = true;
						j--;
					} else if (ch == '"') {
						arr.splice(j - 1, 1);
						j--;
					}
				}
				orig_pos = j;
			} else if (qtype) {
				if (ch == qtype || (!ds && qtype == "'" && ch.esc == "'")) {
					if (ch.esc == "'") qarr.push("\\");
					else if (ch.esc === "\x60") qtype = "\x60";
					line_arr[orig_line_num].splice(orig_pos, 2, {
						t: 'quote',
						'$': ds,
						quote_t: qtype,
						quote: qarr
					});
					qtype = null;
					ds = null;
					qarr = [];
					if (i > orig_line_num) {
						let rem = arr.splice(j);
						for (let k = 1; k < rem.length; k++) line_arr[orig_line_num].push(rem[k]);
						line_arr.splice(i, 1);
						i = orig_line_num;
						arr = line_arr[i];
						j = orig_pos + j + 1;
					} else j -= 1;
				} else {
					if (!ds && qtype == "'" && ch.esc) {
						qarr.push("\\");
						qarr.push(ch.esc);
					} else if (ch.esc && (qtype == "\x60" || qtype == '"')) {
//There are no escapes in double quotes except $,\x60,and \
						if (ch.esc == "$" || ch.esc == "\x60" || ch.esc == "\\") qarr.push(ch);
						else {
							if (qtype == '"' && ch.esc != '"') {
								qarr.push("\\");
							} else if (qtype == "\x60" && ch.esc != "\x60") {
								qarr.push("\\");
							}
							qarr.push(ch.esc);
						}
					} else qarr.push(ch);
					arr.splice(j, 1);
					j--;
				}
			}
		}
		if (qtype) {
			qarr.push("\n");
			if (i > orig_line_num) {
				line_arr.splice(i, 1);
				i--;
			}
		}
	}
	if (qtype) return "Unterminated quote";
	else {
		let line = line_arr[line_arr.length - 1];
		let lasttok = line[line.length - 1];
		if (lasttok === "\\") return "Newline escapes are not implemented";
	}
	return line_arr;
};//»
const shell_tokify = line_arr => {//«
	let lnnum = 1;
	let wordnum = 0;
//	const badtok=(tok, num)=>{return `sh: unsupported token (${num}): '${tok}'`;};
	const badtok=(tok, num)=>{return `sh: unsupported token: '${tok}'`;};
	const mkword=(str)=>{return{t:"word",word:str,ln:lnnum,wn:(wordnum++)}};
	const mkrop=(str)=>{return{t:"r_op",r_op:str,ln:lnnum}};
	const mkcop=(str)=>{return{c:"c_op",c_op:str,ln:lnnum}};
	const mkds=(str)=>{return{t:"ds",ds:"$",ln:lnnum}};
//	const mknl=()=>{return{t:"c_op",c_op:"nl",nl:true,ln:lnnum};};
	const add_to_pipe=()=>{//«
		if (ret[0]===" ") ret.shift();
		if (ret[ret.length-1]==" ") ret.pop();
		pipe.push(ret);
		ret = [];
	};//»
	if (line_arr == null) return null;
	let ret = [];
	let pipe = [];
	let word = null;
	for (let i = 0; i < line_arr.length; i++) {
		let arr = line_arr[i];
		for (let j = 0; j < arr.length; j++) {
			let ch = arr[j];
			let ch1 = arr[j+1];
			if (ch==" " &&ch1=="#") break;
			if (shell_metas.includes(ch)) {//«
				if (word) ret.push(mkword(word.join("")));
				if (ch == "\t" || ch == " ") {
					let usej = null;
					for (let k = j + 1;
						(arr[k] == " " || arr[k] == "\t"); k++) usej = k;
					if (usej) j = usej;
					ret.push(" ");
				} else {
					let next = arr[j + 1];
					if (next && shell_metas.includes(next)) {//«
						let comb = ch + next;
						if (shell_c_op.includes(comb)) {
							if (comb=="||"||comb=="&&"){
								ret.push(mkcop(comb));
								j++;
							}
							else return badtok(comb, 1);
						}
						else if (shell_r_op.includes(comb)) {
							if (comb==">>") {
								ret.push(mkrop(comb));
								j++;
							}
							else return badtok(comb, 2);
						}
						else {
							if (ch===">"||ch==">>") ret.push(mkrop(ch));
							else if (ch=="|"||ch==";") ret.push(mkcop(ch));
//							else if (ch=="|") add_to_pipe();
							else return badtok(ch, 3);
						}
					}//»
					else {
						if (ch===">"||ch==">>") ret.push(mkrop(ch));
						else if (ch=="|"||ch==";") ret.push(mkcop(ch));
//						else if (ch=="|") add_to_pipe();
						else return badtok(ch, 4);
					}
				}
				word = null;
			}//»
			else {//«
				if (!word) {
//A word array isn't in effect
//					if (ch == "{" || ch == "}" || ch == ",") ret.push(mkword(ch));
					if (ch == "\n") ret.push(ch);
					else if (ch == "$") ret.push(mkds());
					else if (typeof(ch) == "string") word = [ch];
					else if (typeof(ch) == "object") ret.push(ch);
				} else if (ch == "$") {
					ret.push(mkword(word.join("")));
					word = null;
					ret.push(mkds());
				} else {
//					if (ch == "{" || ch == "}" || ch == ",") {
//						ret.push(mkword(word.join("")));
//						ret.push(mkword(ch));
//						word = null;
//					} 
					if (ch == "\n") {
						ret.push(mkword(word.join("")));
						ret.push(ch);
						word = null;
					} else if (ch.t == "esc") {
						if (ch.esc == "{" || ch.esc == "}" || ch.esc == ",") {
							ret.push(mkword(word.join("")));
							ret.push(ch);
							word = null;
						} else {
							ret.push(mkword(word.join("")));
							ret.push(ch);
							word = null;
						}
					} else if (typeof(ch) == "string" && ((ch != " " && ch != "(" && ch != ")"))) {
						word.push(ch);
					} else {
						ret.push(mkword(word.join("")));
						ret.push(ch);
						word = null;
					}
				}
			}//»
		}
		if (word) {
			let useword = word.join("");
			let pushnl = true;
			if (useword.match(/\\$/)) {
				useword = useword.replace(/\\$/, "");
				pushnl = null;
			}
			if (useword) ret.push(mkword(useword));
		} else {
		}
		word = null;
	}
//	add_to_pipe();
//	if (!pipe[pipe.length-1].length){
//		return "Unterminated pipeline";
//	}
//	return pipe;
	return ret;
};//»

//»

//Instead of trying to create a theoretically beautiful shell.execute algorithm, I 
/*«wanted to instead provide explicit commentary on the one that should hopefully "just work"

Support for: 
- parsing long and short options
- single quote escaping via '$': echo $'1\n2\n3'
- escaping spaces: touch some\ file.txt
- environment variable setting and substitution
- redirects: '>', '>>'
- pipelines
- file globbing
- curly brace expansion: touch file{1..10}.txt
- backquote command substitution

Bottom line:
For anything that doesn't quite work, try to get it to work without creating too much confusion
in the code or breaking any functionality that is more worthy

»*/

this.execute=async(command_str, opts={})=>{//«
const terr=(arg, if_script)=>{//«
if (script_out){
	script_out.push(arg);
}
//else if (ssh_err){
//	ssh_err.push(arg);
//}
else {
	term.response(arg);
	if (!if_script) term.response_end();
}
};//»

//WIMNNUYDKL
let started_time = (new Date).getTime();
let no_response_end;
//Cancel test function
const can=()=>{return started_time < this.cancelled_time;};

//let {script_out, ssh_out, ssh_err, env, addRows}=opts;
let {script_out, env, addRows}=opts;
let rv;

//Where does the output go?
let redir;

//This is only used for pipeline commands that are after the first command
// cat somefile.txt | these | might | use | the | stdin | array
let stdin;

//This tells all commands with color output (currently just ls) the number of rows to add to the objects
//that at used in response() to add to line_colors[]
let add_rows = addRows || 0;

//Refuse and enter command that seems too long for our taste
if (command_str.length > MAX_LINE_LEN) return terr(`'${command_str.slice(0,10)} ...': line length > MAX_LINE_LEN(${MAX_LINE_LEN})`, script_out);

command_str = command_str.replace(/^ +/,"");

//Only for creating newlines in single quotes: $'1\n2' and escaping spaces outside of quotes
let arr = shell_escapes([command_str]);

//Makes quote objects from single, double and backtick quotes. Fails if not terminated
arr = shell_quote_strings(arr);
if (isstr(arr)) return terr(term.fmt(arr), script_out);

/*
This creates word objects and '$' objects.
It also creates '>' and '>>' redirections as well as pipelines.
All unsupported tokens (redirects like '<' and control like ';') cause failure
*/
let toks = shell_tokify(arr);
let com = [];
let all = [];
for (let tok of toks){
	if (tok.c_op){
		all.push({com});
		com = [];
		all.push(tok);
	}
	else{
		com.push(tok);
	}
}
if (com.length) all.push({com});

let all2 = [];
let pipe = [];
for (let tok of all){
	if (tok.c_op && tok.c_op != "|"){
		all2.push({pipe});
		pipe = [];
		all2.push(tok);
	}
	else if (!tok.c_op){
		pipe.push(tok);
	}
}
if (pipe.length) all2.push({pipe});

let all3 = [];
let andlist = [];
for (let tok of all2){
	if (tok.c_op && tok.c_op != "&&"){
		all3.push({andlist});
		andlist = [];
		all3.push(tok);
	}
	else if (!tok.c_op){
		andlist.push(tok);
	}
}
if (andlist.length) all3.push({andlist});

let statements = [];
let orlist = [];
for (let tok of all3){
	if (tok.c_op && tok.c_op != "||"){
		statements.push({orlist});
		orlist = [];
	}
	else if (!tok.c_op){
		orlist.push(tok);
	}
}
if (orlist.length) statements.push({orlist});

for (let state of statements) {

	let lastandcode;
//Loop until one returns true
	for (let oriter = 0; oriter < state.orlist.length; oriter++) {//«
		let orlist = state.orlist[oriter];

//Loop while every returns true
		let lastpipecode;

		for (let anditer = 0; anditer < orlist.andlist.length; anditer++) {//«

			let andlist = orlist.andlist[anditer];

			let pipe = andlist.pipe;

//Need the rv of every pipe (which is collected from the last command)
			let lastcomcode;

			while (pipe.length) {//«
				let arr = pipe.shift().com;
				let args=[];

/*
1) Environment variable substitution
2) File globbing '*', '?' and character ranges [a-zA-Z0-9]
3) Curly brace expansion:

$ echo file{0..3}.txt
file0.txt file1.txt file2.txt file3.txt
*/
				rv = await all_expansions(arr, term);
				if (can()) return;
				term.response(rv);
				let inpipe = pipe.length;

/*
- Turn quote objects into word objects
- Single quotes that start with '$' look for internal escapes (currently only newline)
- Backquotes are executed and replaced with the output
*/
				for (let i=0; i < arr.length; i++){//«
					let tok = arr[i];
					let typ = tok.t;
					let val = tok[typ];
					if (typ==="quote") { 
						let typ = tok.quote_t;
						let ds = tok['$'];
						let outstr='';
						for (let ch of val){
							if (isobj(ch)&&ch.t=="esc"){
								if (ch.esc=="n"&&typ=="'"&&ds) outstr+="\n";
								else outstr+=ch.esc;
							}
							else outstr+=ch;
						}
						val = outstr;
						if (typ=="\x60") {
							let out=[];
							add_rows = await this.execute(val, {script_out: out, env, addRows: add_rows});
							if (can()) return;
							if (isstr(out)) val = out;
							else if (isarr(out)&&out.length) val = out.join(" ");
							else val = "";
						}
						arr[i]={t:"word", word: val, from_quote: true};
					}
				}//»

/*
All sequences of non-whitespace separated quotes and words are concatenated:
~$ echo "q 1"A"q 2""q 3"B   "q 4"C"q       5"D"q 6"
q 1Aq 2q 3B q 4Cq       5Dq 6
*/
				for (let i=0; i < arr.length-1; i++){//«
					let tok0 = arr[i];
					let tok1 = arr[i+1];
					let have_quote = tok0.from_quote || tok1.from_quote;
					if (tok0.word && tok1.word && have_quote){
						arr[i] = {t: "word", word: `${tok0.word}${tok1.word}`, from_quote: true}
						arr.splice(i+1, 1);
						i--;
					}
				}//»

//Concatenate all sequences of escaped spaces and words
// ~$ touch this\ is\ cool.txt
				for (let i=0; i < arr.length-1; i++){//«
					let tok0 = arr[i];
					let tok1 = arr[i+1];
					if (tok0.esc === " " || tok1.esc === " "){
						arr[i] = {t: "word", word: `${tok0.word||" "}${tok1.word||" "}`, esc: tok1.esc}
						arr.splice(i+1, 1);
						i--;
					}
				}//»

/*
- Create redirection objects
- Objects are converted into strings ({t:"word", word: "blah"} -> "blah")
- Replace tilde with home path
*/
				for (let i=0; i < arr.length; i++){//«
					let tok = arr[i];
					let typ = tok.t;
					let val = tok[typ];
					if (tok===" "){
						continue;
					}
					if (typ==="r_op"){
						let rop = tok.r_op;
						if (!(rop==">"||rop==">>")) {
							return terr(`sh: unsupported operator: '${tok.r_op}'`, script_out);
						}
						let tok2 = arr[i+1];
						if (!tok2) return terr("sh: syntax error near unexpected token `newline'");
						if (tok2.t == "quote") tok2={t: "word", word: tok2.quote.join("")}
						if (tok2==" ") {
							i++;
							tok2 = arr[i+1];
						}
						if (!(tok2 && tok2.t==="word")) return terr(`sh: invalid or missing redirection operand`, script_out);
						arr.splice(i+1, 1);
						val = null;
						redir = [tok.r_op, tok2.word];
					}
					if (val) {
						if (val.match(/^~/)){
							if (val==="~") val = globals.HOME_PATH;
							else if (val.match(/^~\x2f/)) val = globals.HOME_PATH+val.slice(1);
						}
						args.push(val);
					}
				}//»

				arr = args;

//Set environment variables (exports to terminal's environment if there is nothing left)
				rv = add_to_env(arr, env, {term});
				add_rows+=rv.length;
				term.response(rv);
				if (arr[0]==" ") arr.shift();

//Get the command. Immediately return if not found.
				let comword = arr.shift();
				if (!comword) {
					return terr("", script_out);
				}

//Replace with an alias if we can
				let alias = ALIASES[comword];
				if (alias){
//This should allow aliases that expand with options...
					let ar = alias.split(/\x20+/);
					alias = ar.shift();
					if (ar.length){
						arr.unshift(...ar);
					}
				}
				let usecomword = alias||comword;
				let com = shell_commands[usecomword];

//If we have a string rather than a function, do the command library importing routine
				if (isstr(com)){//«
					let lib = shell_libs[com];
					if (!lib){
						try{
							let r = (Math.random()+"").slice(12);
							lib = (await import(`/coms/${com}.js?v=${r}`)).coms;
							if (can()) return;
						}catch(e){
							if (can()) return;
cerr(e);
							terr(`sh: command library: '${com}' could not be loaded`);
							return ++add_rows;
						}
						shell_libs[com] = lib;
					}
					let gotcom = lib[usecomword];
					if (!(gotcom instanceof Function)){
						terr(`sh: '${usecomword}' is invalid or missing in command library: '${com}'`);
						return ++add_rows;
					}
					com = gotcom;
				}//»

//Not found!
				if (!com) {//«
//If the user attempts to use, e.g. 'if', let them know that this isn't that kind of shell
					if (CONTROL_WORDS.includes(comword)){
						terr(`sh: control structures are not implemented`, script_out);
						return ++add_rows;
					}
//It doesn't look like a file.
					if (!comword.match(/\x2f/)) {
						terr(`sh: ${comword}: command not found`, script_out);
						return ++add_rows;
					}

//Try to execute a "shell script"
					let rv = await execute_file(comword, term.cur_dir, env);
					if (can()) return;
					if (isstr(rv)) {
						terr(rv, script_out);
						return ++add_rows;
					}

//Collect the stdin (used as optional input for the next command) for pipelines
					if (inpipe) stdin = rv;
					else {
						if (script_out){
							 if (rv && rv.length) script_out.push(...rv);
						}
						else{
							term.response(rv);
							term.response_end();
						}
					}
					continue;
				}//»

//Look for the command's options
				let opts;
				let gotopts = command_options[usecomword];

//Parse the options and fail if there is an error message
				rv = get_options(arr, usecomword, gotopts);
				if (rv[1]&&rv[1][0]) {
					add_rows++;
					term.response(rv[1][0]);
					continue;
				}
				opts = rv[0];

//Run command
				rv = await com(arr, {redir, script_out, stdin, inpipe, term, add_rows, env, opts, command_str});
				if (can()) return;
				if (!rv) rv = {};
				if (isstr(rv)) rv = {out: rv};
				let {out, err, colors, didFmt, pretty, code, noEnd} = rv;
				no_response_end = noEnd;
				let invalid = !Number.isFinite(code);
				if (err && err.length) {
//					if (term.ssh_server){}
//					else {
					if (isstr(err)) err = [err];
					add_rows+=err.length;
					if (invalid) code = 1;
					term.response(err);
//					}
				}
				else if (invalid) code = 0;
				lastcomcode = code;
				if (out) {//«
					if (isstr(out)) out=[out];
					if (redir&&redir.length){
						if (isarr(out)) out = out.join("\n");
						let {err} = await write_to_redir(term, out, redir, env);
						if (can()) return;
						if (err) {
							add_rows++;
							term.response(err);
						}
						stdin = [];
					}
//Set the stdin for the next command
					else if (inpipe) {
						stdin = out;
					}
//					else if (!(script_out||ssh_out)){
					else if (!script_out){
//Print the output
						term.response(out,{didFmt, colors, pretty});
					}
					else{
					}
				}//»
				else stdin = null;

//If we are expecting to collect the output of a script or command substitition, collect the output

				if (!inpipe) {
if (script_out) {
	script_out.push(...out);
}
/*
if (ssh_out){
	if (redir && term.ssh_server){
cwarn("SKIPPING OUTPUT WITH REDIR IN TERM.SSH_SERVER...");
	}
	else if (out && out.length) ssh_out.push(...out);
}
if (ssh_err){
	if (err && err.length) ssh_err.push(...err);
}
*/
				}


			}//»
			lastpipecode = lastcomcode;
			if (lastpipecode > 0) break;

		}//»

		lastandcode = lastpipecode;
		if (lastandcode == 0) break;

	}//»

}

//In a script, refresh rather than returning to the prompt

//if (script_out||ssh_out) {
if (script_out) {
//	if (!term.ssh_server) term.refresh();
	term.refresh();
//	return {out: script_out, addRows: add_rows};
	return add_rows;
}


//Command line input returns to prompt
if (!no_response_end) term.response_end();

}//»

};

//»

//»

//Terminal«

//Issues«
/*@GYWJNFGHXP: Just started on a "solution" to the issue referenced on the Bug below.«

For now, we are doing replacements for open paren, open square brace and plus sign.
What about period, asterisk and question mark?


We now allow for the tab completion like:

$ cat 'Some (weird) f<TAB>

to become:

$ cat 'Some (weird) filename.txt'

But this also actually works when we are at the beginning:

$ 'Some (weird) f<TAB>

becomes:

$ 'Some (weird) filename.txt'

...this is *really* only supposed to search in the command pathway.

»*/
/*Bug found on Feb. 14, 2023://«

There seems to be an issue with commands that wrap around that have long
arguments (like filenames) with embedded spaces that are escaped. Say
the terminal is only like 40 chars wide:

$ ls /home/me/videos/This\ is\ a\ video\
with\ embedded\ spaces.mp4

There was actually a line break inserted here in the command history, probably
related to doing a tab completion that had to wrap around.

I want to implement tab completions that are inside of quotes (like bash does).
Given a file named "file with spaces.txt", doing:

$ cat 'file w<TAB>

...should complete to:

$ cat 'file with spaces.txt'

There needs to be some basic parsing done to ensure that this does not work,
i.e. there should be an odd number of non-escaped quotes.

$ cat ' 'file w<TAB>

//»*/
//»

export const app = function(Win) {

//Var«

const TABSIZE = 4;
const TABSIZE_MIN_1 = TABSIZE-1;

const {main, Desk} = Win;
const topwin = Win;
const winid = topwin.id;
const termobj = this;
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

let MIN_TERM_WID = 20;
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
let buffer_scroll_num = null;
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
let shell = null;
let ls_padding = 2;
let await_next_tab = null;

let cur_prompt_line = 0;
let line_continue_flag = false;
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
	let d = capi.dist(e.clientX,e.clientY,downevt.clientX, downevt.clientY);
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


const get_line_from_pager=async(arr, name)=>{//«

	if (!await capi.loadMod(DEF_PAGER_MOD_NAME)) {
		return poperr("Could not load the pager module");
	}
	let less = new NS.mods[DEF_PAGER_MOD_NAME](this);
	if (await less.init(arr, name, {lineSelect: true, opts: {}})) return arr[less.y+less.scroll_num];

}//»
const select_from_history = async path => {//«
	let arr = await path.toLines();
	if (!isarr(arr) && arr.length) {
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

const fmt_ls=(arr, lens, ret, types, color_ret, start_from, col_arg)=>{//«

/*_TODO_: In Linux, the ls command lists out (alphabetically sorted) by columns, but 
here we are doing a row-wise listing! Doing this in a column-wise fashion (cleanly and 
efficiently) is an outstanding issue...*/

	let pad = ls_padding;
	if (!start_from) start_from=0;
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
			fmt_ls(arr, lens, ret, types, color_ret, start_from, (num_cols - 1));
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
		if (typ==DIRECTORY_TYPE) color="#909fff";
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
//		let str = arr[i] + " ".rep(col_wids[col_num] - arr[i].length);
		let str = nm + " ".rep(col_wids[col_num] - nm.length);
		matrix[row_num][col_num] = str;
		if (color_ret) {
			let use_row_num = row_num+start_from;
			if (!color_ret[use_row_num]) color_ret[use_row_num] = {};
//			let uselen = arr[i].length;
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

const delete_mods=()=>{//«
	for (let m of DEL_MODS){
		let scr = document.getElementById(`script_mods.${m}`);
		if (scr) scr._del();
		delete NS.mods[m];
		NS.mods[m]=undefined;
	}
	for (let m of DEL_COMS){
		delete shell_libs[m];
	}
};//»
const do_delete_mods = () => {//«
	let s="";
	if (DEL_MODS.length) s+=`Deleted mods: ${DEL_MODS.join(",")}`;
	if (DEL_COMS.length) {
		if (s) s+="\n";
		s+=`Deleted coms: ${DEL_COMS.join(",")}`;
	}
	if (s){
		delete_mods();
		if (this.reInit) {
			this.reInit.addMessage=s;
			cwarn(`${s}`);
		}
		else do_overlay(s);
	}
}//»

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
		ret = lines_to_paras(ret);
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
	capi.center(overlay, main);
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
	let is_buf_scroll = false;
	if (buffer_scroll_num!==null) {
		usescroll = buffer_scroll_num;
		is_buf_scroll = true;
	}
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


		if (!(is_pager||is_buf_scroll||stat_input_type||is_scrolling)) {//«
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
			stat_message = null;
		}//»
		else if(is_pager){//«
			let per = Math.floor(100*(usescroll+donum)/lines.length);
			if (per > 100) per = 100;
			usestr = `${actor.fname} ${per}% of ${lines.length} lines (press q to quit)`;
			if (!stat_input_type) usestr = '<span style=background-color:#aaa;color:#000>'+usestr+'</span>'
		}//»
		update_stat_lines([usestr]);
	}//»
	if (min_height && h < min_height){
		tabdiv.innerHTML=`<center><span style="background-color:#f00;color:#fff;">Min height: ${min_height}</span></center>`;
	}
	else tabdiv.innerHTML = outarr.join("\n");
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
//const clear_table=(if_keep_buf)=>{
//	if (if_keep_buf) {
//		buf_lines = buf_lines.concat(lines.slice(0, scroll_num));
//		lines =  lines.slice(scroll_num);
//		line_colors =  line_colors.slice(scroll_num);
//	}
//	else {
	lines = [];
	line_colors = [];
//	}
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
//Parse/Prompt«

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
const execute = async(str, if_init, halt_on_fail)=>{//«

	ENV['USER'] = globals.CURRENT_USER;
	cur_shell = shell;
	let gotstr = str.trim();

	str = str.replace(/\x7f/g, "");

	let env = {};
	for (let k in ENV){
		env[k]=ENV[k];
	}

//	if (this.ssh_client && this.ssh_immediate_mode) this.ssh_client.send(JSON.stringify({com: str}));
//	else shell.execute(str,{env});
	shell.execute(str,{env});

	let ind = history.indexOf(gotstr);
	if (ind >= 0) {
		history.splice(ind, 1);
	}
	else{
		await fsapi.writeFile(HISTORY_PATH, `${gotstr}\n`, {append: true});
	}
	history.push(gotstr);

};
//»
const get_prompt_str=()=>{//«
	let str;
	let user = ENV.USER;
//	if (this.ssh_immediate_mode && this.ssh_cwd) str = this.ssh_cwd.replace(/^\/+/, "/");
//	else str = this.cur_dir.replace(/^\/+/, "/");
	str = this.cur_dir.replace(/^\/+/, "/");
	str = str+"$";
	if ((new RegExp("^/home/"+user+"\\$$")).test(str)) str = "~$";
	else if ((new RegExp("^/home/"+user+"/")).test(str)) str = str.replace(/^\/home\/[^\/]+\x2f/,"~/");
	return str + " ";
};//»

/*Old complicated prompt crap«
const get_prompt_str=()=>{//«
	let goodch = ["u", "U", "h", "H", "d", "t", "w"];
	let gotps = ENV.PS1;
	let ds = "\$";
	if (root_state) {
		ds = "#"; 
		gotps = "\\w" + ds;
	}
	else if (!gotps) gotps = "\\w" + ds;
	cur_ps1 = gotps;
	let arr = cur_ps1.split("");
	let str = "";
	for (let i=0; i < arr.length; i++) {
		let c = arr[i];
		let c1 = arr[i+1];
		if (c == "\\" && c1 && goodch.includes(c1)) {
			if (c1 == "w") {
				if (this.ssh_immediate_mode && this.ssh_cwd){
					str += this.ssh_cwd.replace(/^\/+/, "/");
				}
				else str += this.cur_dir.replace(/^\/+/, "/");
			}
			else if (c1 == "u" || c1 == "U") {
				if (ENV.USER) {
					if (c1 == "u") str += ENV.USER.toLowerCase();
					else str += ENV.USER;
				}
				else str += "user";
			}
			else if (c1 == "h" || c1 == "H") {
				if (ENV.HOSTNAME) {
					if (c1 == "h") str += ENV.HOSTNAME.toLowerCase();
					else  str += ENV.HOSTNAME;
				}
				else str += "home";
			}
			else if (c1 == "t") str += new Date().toTimeString().split(" ")[0];
			else if (c1 == "d") str += cur_date_str();
			i++;
		}
		else str += c;
	}
	cur_prompt = str;
	if (ENV.USER) {
		if ((new RegExp("^/home/"+ENV.USER+"\\$$")).test(cur_prompt)) {
			cur_prompt = "~$";
		}
		else if ((new RegExp("^/home/"+ENV.USER+"/")).test(cur_prompt)) cur_prompt = cur_prompt.replace(/^\/home\/[^\/]+\x2f/,"~/");
	}
	cur_prompt=cur_prompt.replace(/ *$/, " ");
	return cur_prompt.replace(/ /g, "\xa0");
};//»
»*/

const set_prompt=(opts={})=>{//«
	let if_nopush = opts.NOPUSH;
	let if_noscroll = opts.NOSCROLL;
	let use_str = get_prompt_str();

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
		if (line_continue_flag) lines[len_min1] = lines[len_min1].concat(line);
//		else if (if_force) {
//			lines.push(line);
//			len_min1++;
//		}
		else {
			if (!lines[len_min1][0]) lines[len_min1] = line;
			else {
				lines.push(line);
				len_min1++;
			}
		}
		if (use_col) line_colors[len_min1] = {'0': [line.length, use_col]};
		while(plines.length) {
			line = plines.shift();
			lines.push(line);
			len_min1++;
			if (use_col) line_colors[len_min1] = {'0': [line.length, use_col]};
		}
		if (!if_noscroll) {
			cur_prompt_line = len_min1;
			scroll_into_view();
		}
	}
	prompt_len = lines[len_min1].length;
	if (prompt_len==1 && lines[len_min1][0]==="") prompt_len=0;
	x=prompt_len;
	y=lines.length - 1 - scroll_num;
	line_continue_flag = false;
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
			if (if_cd && useapp !== FOLDER_APP) continue;
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

const response_end = () => {//«
	if (!did_init) return;

//Why does this line exist???
//	if (pager) return;
	if (is_pager) return;

	set_prompt();
	scroll_into_view();
	sleeping = null;
	bufpos = 0;
	setTimeout(()=>{cur_shell = null;},10);
	render();
};
this.response_end = response_end;
//»

const response = (out, opts={})=>{//«
	if (isstr(out)) out = [out];
	else if (!out) return;
	else if (!isarr(out)){
log("STDOUT");
log(out);
return;
	}

	let {didFmt, colors, pretty} = opts;
	if (colors) {
		for (let i=0; i < colors.length; i++) line_colors[scroll_num + y + i] = colors[i];
	}
	if (lines.length && !lines[lines.length-1].length) lines.pop();
	for (let ln of out){
		if (didFmt){
			lines.push(ln.split(""));
			continue;
		}
		let arr;
		if (pretty) arr = fmt2(ln);
		else arr = fmt(ln);
		for (let l of arr){
			lines.push(l.split(""));
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
		if (!lines[y+scroll_num]) lines.push([]);
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
	response(command_return, {didFmt: true});
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
//	if (this.ssh_immediate_mode && this.ssh_client){
//		this.ssh_client.send(JSON.stringify({tab: true, pos: arr_pos, com_arr: arr}));
//		return;
//	}
	let tok = "";
	let new_arr = arr.slice(0, arr_pos);
	let com_str = new_arr.join("");
	new_arr = com_str.split(/ +/);
	if (!new_arr[0] && new_arr[1]) new_arr.shift();
	let tokpos = new_arr.length;
	if (tokpos > 1) {
		if (new_arr[new_arr.length-2].match(/[\x60\(|;] *$/)) tokpos = 1;
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
		let rem = capi.sharedStart(all).slice(s.length);
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
			new_dir_str = capi.getFullPath(dir_str, this.cur_dir);
		}
		use_dir = new_dir_str;
	}//»
	let nogood = null;
	if (!(!got_path && (tokpos==1||(tokpos>1 && com_completers.includes(tok0))))) return do_get_dir_contents(use_dir, tok, tok0, arr_pos);
	if (tokpos==1) {
		contents = await get_command_arr(use_dir, BUILTINS, tok)
	}
	else {
		if (tok0 == "help"){
			contents = await get_command_arr(use_dir, BUILTINS, tok)
		}
		else if (tok0 == "lib" || tok0 == "import"){
			contents = await get_command_arr(use_dir, await capi.getList("/site/coms/"), tok)
		}
		else if (tok0 == "app" || tok0 == "appicon"){
//			contents = await get_command_arr(use_dir, await capi.getAppList(), tok)
			contents = await get_command_arr(use_dir, await capi.getList("/site/apps/"), tok)
		}

	}
	if (contents && contents.length) docontents(contents, use_dir, tok, arr_pos);
	else do_get_dir_contents(use_dir, tok, tok0, arr_pos);
};
this.handle_tab = handle_tab;
//»

const handle_buffer_scroll=(if_up)=>{//«
	if (buffer_scroll_num===null) {
		buffer_scroll_num = scroll_num;
		scroll_cursor_y = y;
		hold_x = x;
		hold_y = y;
	}
	let n = buffer_scroll_num;
	if (if_up) {//«
		if (n == 0) return;
		let donum;
		if (n - h > 0) {
			donum = h;
			n -= h;
		}
		else n = 0;
		y=0;
	}//»
	else {//«
		let donum = h;
		if (n + donum >= lines.length) return;
		n += donum;
		if (n + h > lines.length) {
			n = lines.length - h;
			if (n < 0) n = 0;
		}
		y=0;
	}//»
	buffer_scroll_num = n;
	render();
};//»
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
/*«
				if (diffy > 0) {
					y=0;
					scroll_num -= diffy;
					cur_prompt_line = scroll_num;
					set_prompt({NOPUSH:1, NOSCROLL:1});
				}
				else y = cur_prompt_line;
»*/
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
/*«
					let diffy = scroll_num - cur_prompt_line;
					if (diffy > 0) {
						y=0;
						scroll_num -= diffy;
						cur_prompt_line = scroll_num;
						set_prompt({NOPUSH:1, NOSCROLL:1});
					}
»*/
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
const handle_enter = async(if_paste)=>{//«
	if (!sleeping){
		bufpos = 0;
		command_hold = null;
		let str;
		if (cur_shell) {//«
//cwarn("Enter with cur_shell!!!");
//			let ret = get_com_arr(1);
//			if (str == null) return response_end();
//			str = ret.join("");
			return;
		}//»
		else {//«
			if (cur_scroll_command) str = insert_cur_scroll();
			else str = get_com_arr().join("");
			if (!str) {
				ENV['?']="0";
				response_end();
				return;
			}
		}//»
		x=0;
		y++;
		lines.push([]);
		if (!str || str.match(/^ +$/)) return response_end();
		if (str) {
			last_com_str = str;
		}
		if (!if_paste) sleeping = true;
		scroll_into_view();
		render();
		await execute(str);
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
	scroll_into_view(8);
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
			cur_shell.cancelled_time = (new Date).getTime();
			cur_shell = null;
			sleeping = false;
			response("^C");
			response_end();
			return;
		}
		else if (getch_cb){
			if (ispress) {
				getch_cb(e.key);
				getch_cb = null;
			}
			else return;
		}
		else if (read_line_cb){
			if (ispress || OK_READLINE_SYMS.includes(sym)){
				if ((sym==="LEFT_" || sym=="BACK_") && x==read_line_prompt_len && y+scroll_num == cur_prompt_line+1) return;
			}
			else if (sym==="ENTER_"){
				let s='';
				let from = cur_prompt_line+1;
				for (let i=from; i < lines.length; i++) {
					if (i==from) s+=lines[i].slice(read_line_prompt_len).join("");
					else s+=lines[i].join("");
				}
				read_line_cb(s);
				read_line_cb = null;
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
			else lines[cy()] = [null];
		}
	}//»

	let ret = null;
 	if (ispress) {//«
		num_ctrl_d = 0;
		if (buffer_scroll_num!==null){
			buffer_scroll_num = null;
			x = hold_x;
			y = hold_y;
			render();
		}
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
	if (buffer_scroll_num!==null){
		buffer_scroll_num = null;
		x = hold_x;
		y = hold_y;
		render();
	}
	if (code >= 37 && code <= 40) handle_arrow(code, mod, sym);
	else if (sym == "HOME_"|| sym == "END_") handle_page(sym);
	else if (code == KC['DEL']) handle_delete(mod);
	else if (sym == "p_CAS") toggle_paste();
	else if (sym == "TAB_") {
		handle_tab();
	}
	else if (sym == "BACK_")  handle_backspace();
	else if (sym == "ENTER_") handle_enter();
	else if (sym == "c_C") do_ctrl_C();
	else if (sym == "k_C") do_clear_line();
	else if (sym == "y_C") {
		for (let i=0; i < current_cut_str.length; i++) handle_letter_press(current_cut_str[i]);
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
//	else if (sym=="l_A") log(line_colors);
		do_delete_mods();
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
};
//»
const handle=(sym, e, ispress, code, mod)=>{//«
	let marr;
//	this.locked = true;
	if (this.locked) {
//		if (sym=="c_C" && this.ssh_server) {
//			this.ssh_server.close();
//		}
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

//SKLIOPMN
//	if (editor && sym=="s_CAS"){
//		highlight_actor_bg = !highlight_actor_bg;
//		do_overlay(`Line highlighting: ${highlight_actor_bg}`);
//		render();
//		return;
//	}

	if (actor){
		actor.key_handler(sym, e, ispress, code);
		return;
	}
/*
	if (pager) {//«
		pager.key_handler(sym, e, ispress, code);
		return 
	}//»
	else if (editor) return editor.key_handler(sym, e, ispress, code);
*/
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
		let val = strnum(gotfs);
		if (isnum(val,true)) gr_fs = val;
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
	let {termBuffer, addMessage, commandStr, histories} = reInit;
//	let gotbuf = reInit.termBuffer;
	if (termBuffer) history = termBuffer;
	else {
		let arr = await get_history();
		if (!arr) history = [];
		else {
			arr.pop();
			arr = arr.reverse();
			arr = capi.uniq(arr);
			history = arr.reverse();
		}
	}
	let init_prompt = `System shell\x20(${winid.replace("_","#")})`;
	if (addMessage) init_prompt = `${addMessage}\n${init_prompt}`;
	let env_file_path = `${this.cur_dir}/.env`; 
	let env_lines = await env_file_path.toLines();
	if (env_lines) {
		let rv = add_to_env(env_lines, ENV, {if_export: true});
		if (rv.length){
			init_prompt+=`\n${env_file_path}:\n`+rv.join("\n");
		}
	}
	response(init_prompt.split("\n"));
	did_init = true;
	sleeping = false;
	shell = new Shell(this);
	this.shell = shell;
	set_prompt();
	render();
	if (commandStr) {
		for (let c of commandStr) handle_letter_press(c); 
		handle_enter();
	};
};

//»
//Obj/CB«

let read_line_cb;
let read_line_prompt_len;
let getch_cb;

this.getch = async(promptarg)=>{//«
	if (promptarg){
		for (let ch of promptarg) handle_letter_press(ch);
	}
	return new Promise((Y,N)=>{
		getch_cb = Y;
	});
};//»
this.read_line = async(promptarg)=>{//«
	if (promptarg){
		read_line_prompt_len = promptarg.length;
		for (let ch of promptarg) handle_letter_press(ch);
	}
	else read_line_prompt_len = 0;
	return new Promise((Y,N)=>{
		read_line_cb = Y;
	});
};//»
this.kill_register = (funcarg)=>{kill_funcs.push(funcarg);}
this.kill_unregister = (funcarg)=>{//«
	let which = kill_funcs.indexOf(funcarg);
	if (which < 0) {
cerr("Could not find the funcarg");
		return;
	}       
	kill_funcs.splice(which, 1);
}//» 
this.onappinit = init;

const onescape = () => {//«
	textarea&&textarea.focus();
	if (check_scrolling()) return true;
	let dorender=false;
	if (buffer_scroll_num !== null) {
		buffer_scroll_num = null;
		x = hold_x;
		y = hold_y;
		dorender = true;
	}
	if (dorender) return true;
	return false;
}
this.onescape = onescape;
//»
this.onsave=()=>{//«
//	if (editor) editor.save();
	if (actor && actor.save) actor.save();
}//»

this.onkill = (if_dev_reload)=>{//«
	execute_kill_funcs();
	if (this.cur_edit_node) this.cur_edit_node.unlockFile();
//	if (this.ssh_server) this.ssh_server.close();
//	else if (this.ssh_client) this.ssh_client.close();
	if (!if_dev_reload) {
		return save_history();
	}

	this.reInit={
		termBuffer: history,
	};
//	let actor = editor||pager;
	if (actor) {
		this.reInit.commandStr = actor.command_str;
	}
	do_delete_mods();
	save_history();

}//»
this.onfocus=()=>{//«
	topwin_focused=true;
	if (cur_scroll_command) insert_cur_scroll();
	render();
	textarea&&textarea.focus();
}//»
this.onblur=()=>{//«
	topwin_focused=false;
	render();
	if (cur_scroll_command) insert_cur_scroll();
	textarea && textarea.blur();
}//»
this.onresize = resize;
this.onkeydown=(e,sym,mod)=>{handle(sym,e,false,e.keyCode,mod);};
this.onkeypress=(e)=>{handle(e.key,e,true,e.charCode,"");};
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

//Need to combine generalize these 4 functions as init_new_screen.



/*

We used to call set_lines (unnecessarily) from pager, just to empty out the
line_colors. But we call this because we actually set a new empty array. We
need to keep this for certain advanced use cases, such as toggling between
pager formats, and dealing with row folding issues in vim.

*/

this.set_lines = (linesarg, colorsarg)=>{//«
	lines = linesarg;
	line_colors = colorsarg;
};//»

/*XOPIUYTK
this.hold_lines = ()=>{//«
//This is a completely wrong idea.
	lines_hold = lines;
	line_colors_hold = line_colors;
};//»
this.init_edit_mode=(ed, nstatlns)=>{//«
	wrapdiv.appendChild(statdiv);
	yhold=y;
	xhold=x;
	scrollnum_hold = scroll_num;
	scroll_num=x=y=0;
	editor = ed;
	num_stat_lines=nstatlns;
	generate_stat_html();
	this.editor = editor;
};//»
this.init_pager_mode=(pg, nstatlns)=>{//«
	wrapdiv.appendChild(statdiv);
	yhold=y;
	xhold=x;
	scrollnum_hold = scroll_num;
	scroll_num=x=y=0;
	pager = pg;
	num_stat_lines=nstatlns;
	generate_stat_html();
};//»
*/

//Pass our new onescape's into here???
this.init_new_screen = (actor_arg, classarg, new_lines, new_colors, n_stat_lines, escape_fn) => {//«

	let screen = {actor, appclass, lines, line_colors, x, y, scroll_num, num_stat_lines, onescape: termobj.onescape};
	termobj.onescape = escape_fn;
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

let old_actor = actor;
({actor, appclass, lines, line_colors, x, y, scroll_num, num_stat_lines} = screen);

is_editor = appclass == "editor";
is_pager = appclass == "pager";

termobj.onescape = screen.onescape;
if (!num_stat_lines){
	statdiv._del();
}
tabdiv._x = 0;
if (old_actor&&old_actor.cb) {
	old_actor.cb(screen);
}
//render();
};//»

//This needs to be seriously updated

/*
this.modequit=(rv)=>{//«
	statdiv._del();
	tabdiv._x = 0;
	let actor = editor||pager;
	scroll_num = scrollnum_hold;
	lines = lines_hold;
	line_colors = line_colors_hold;
	y = yhold;
	x = xhold;
	num_stat_lines = 0;
	delete this.is_editing;
	editor=pager=null;
	if (actor&&actor.cb) {
		actor.cb(rv);
	}
	delete this.editor;
//	return arg;
};
//»
*/


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
this.cur_white=()=>{
CURBG = "#ddd";
CURFG = "#000";
}
this.cur_blue=()=>{
CURBG = "#00f";
CURFG = "#fff";
}
this.execute = (s)=>{
	if (cur_shell){
cwarn("Sleeping");
		return false;
	}
	response_end();
	handle_line_str(s);
	handle_enter();
	return true;
};
Object.defineProperty(this,"lines",{
	get:()=>{
		let all;
		if (is_editor) all = actor.lines;
		else {
			all = [];
			for (let ln of lines) all.push(ln.join(""));
		}
		return all;
	}
});
/*«Unused
this.is_busy=()=>{return !!cur_shell;}
»*/

//»

}; 

//»

