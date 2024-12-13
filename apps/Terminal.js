//Older terminal development notes and (maybe newer) code are stored in doc/dev/TERMINAL
//«Shell Options
//let USE_ONDEVRELOAD = true;
//let DEBUG = false;
//let DEBUG = true;
let USE_ONDEVRELOAD = false;

//»

//Imports«

//import { util, api as capi } from "util";
//import { globals } from "config";
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
//	shell_libs,
	SHELL_ERROR_CODES,
	dev_mode,
	admin_mode,
	EOF
} = globals;
const fsapi = fs.api;
const widgets = NS.api.widgets;
const {poperr} = widgets;
const {pathToNode}=fsapi;

const HISTORY_FOLDER = `${globals.HOME_PATH}/.history`;
const HISTORY_PATH = `${HISTORY_FOLDER}/shell.txt`;
const HISTORY_PATH_SPECIAL = `${HISTORY_FOLDER}/shell_special.txt`;
const LEFT_KEYCODE = KC.LEFT;

const{E_SUC, E_ERR} = SHELL_ERROR_CODES;

const DEL_MODS=[
//	"util.less",
	"term.vim",
	"term.menu"
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

//«Shell

/*«ShellNS: This function/"namespace" is our way to start bundling *everything* 
that is relevant to the thing called the "shell" (as opposed to the thing called 
the "terminal") into a singular thing. We want to do this in a totally 
methodical/non-destrutive kind of way, so we can be very assured of the fact that 
everything always works as ever.»*/

const ShellNS = function(){}

//Var«

let last_exit_code = 0;

const EOF_Type = 1;
const OPERATOR_CHARS=[//«
"|",
"&",
";",
"<",
">",
"(",
")",
];//»
//const UNSUPPORTED_OPERATOR_CHARS=["(",")"];
const UNSUPPORTED_OPERATOR_CHARS=[];
const UNSUPPORTED_DEV_OPERATOR_TOKS = [];
const UNSUPPORTED_OPERATOR_TOKS=[//«
	'&',
//	'<',
	';;',
	';&',
	'>&',
	'>|',
	'<&',
//	'<<',
	'<>',
	'<<-',
//	'<<<'
];//»
const OCTAL_CHARS=[ "0","1","2","3","4","5","6","7" ];

const INVSUB="invalid/unsupported substitution";
const START_NAME_CHARS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "_"];
//const START_NAME_CHARS = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","_"];
const DIGIT_CHARS_1_to_9=["1","2","3","4","5","6","7","8","9"];
const DECIMAL_CHARS_1_to_9=["1","2","3","4","5","6","7","8","9"];
const DECIMAL_CHARS_0_to_9=["0", "1","2","3","4","5","6","7","8","9"];
const ANY_DIGIT_CHARS=["0", "1","2","3","4","5","6","7","8","9"];
const ANY_NAME_CHARS = [...START_NAME_CHARS, ...ANY_DIGIT_CHARS];
//const ANY_NAME_CHARS = [...START_NAME_CHARS, ...DECIMAL_CHARS_0_to_9];
const SPECIAL_SYMBOLS=[ "@","*","#","?","-","$","!","0" ];

const OPERATOR_TOKS=[//«
'&&',
'||',
';;',
';&',
'>&',
'>>',
'>|',
'<&',
'<<',
'<>',
'<<-',
'<<<',
];//»
const OK_OUT_REDIR_TOKS=[">",">>"];
const OK_IN_REDIR_TOKS=["<","<<","<<<","<<-"];
const OK_REDIR_TOKS=[...OK_OUT_REDIR_TOKS, ...OK_IN_REDIR_TOKS];

const CONTROL_WORDS = ["if", "then", "elif", "else", "fi", "do", "while", "until", "for", "in", "done", "select", "case", "esac"];

const NO_SET_ENV_VARS = ["USER"];

const ALIASES={
	c: "clear",
	la: "ls -a",
//	com2 : "frugg --gamnich 1 2 3"
//	ai: "appicon"
};

const ALLOW_REDIRECT_CLOBBER = false;
//const ALLOW_REDIRECT_CLOBBER = true;

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
	"brep",
//	"mount",
//	"unmount",
];//»

/*«
const TEST_COMS=[
	"test"
];
const YT_COMS=[
	"ytsrch",
	"ytthing",
	"ytvid",
	"ytdl"
];
»*/
const PRELOAD_LIBS = {fs: FS_COMS};
//const ALL_LIBS = {
//	audio:["midiup"],
//	fs: FS_COMS,
//	test: TEST_COMS,
//	yt: YT_COMS
//};
const ALL_LIBS = NS.libs;
for (let k in PRELOAD_LIBS){
	ALL_LIBS[k] = PRELOAD_LIBS[k];
}
//log(ALL_LIBS);
const ASSIGN_RE = /^([_a-zA-Z][_a-zA-Z0-9]*(\[[_a-zA-Z0-9]+\])?)=(.*)/;

//To allow writing of files even if there is an external lock on it, change this to true
//const allow_write_locked = false;

const DIRECTORY_TYPE = "d";
const LINK_TYPE = "l";
const BAD_LINK_TYPE = "b";
const IDB_DATA_TYPE = "i";//Data structures that are stored directly in the indexedDB Nodes table

//»

//Helper funcs«

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
		if (isObj(args[i])) {
			i++;
			continue;
		}
		if (args[i].toString() == "--") {
			args.splice(i, 1);
			return [obj, err];
		}
		else if (marr = args[i].match(/^-([a-zA-Z0-9][a-zA-Z0-9]+)$/)) {
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
		else if (marr = args[i].match(/^-([a-zA-Z0-9])$/)) {
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
		} else if (marr = args[i].match(/^--([a-zA-Z0-9][-a-zA-Z0-9]+)=(.+)$/)) {
			if (getall || (ret = getlong(marr[1]))) {
				if (getall) ret = marr[1];
				obj[ret] = marr[2];
			}
			args.splice(i, 1);
		} else if (marr = args[i].match(/^--([a-zA-Z0-9][-a-zA-Z0-9]+)=$/)) {
			if (getall || (ret = getlong(marr[1]))) {
				if (getall) ret = marr[1];
				obj[ret] = args[i + 1];
				if (args[i + 1]) args.splice(i + 1, 2);
				else args.splice(i, 1);
			} else args.splice(i, 1);
		} else if (marr = args[i].match(/^--([a-zA-Z0-9][-a-zA-Z0-9]+)$/)) {
			if (getall || (ret = getlong(marr[1]))) {
				if (getall) ret = marr[1];
				if (getall || (lopts[marr[1]] === 1 || lopts[marr[1]] === 2)) obj[ret] = true;
				else if (lopts[marr[1]] === 3) err.push(`${com}: long option: '${marr[1]}' requires an arg"`);
				else if (lopts[marr[1]]) err.push(`${com}: long option: '${marr[1]}' has an invalid option definition: ${lopts[marr[1]]}`);
				else if (!lopts[marr[1]]) err.push(`${com}: invalid long option: '${marr[1]}`);
				args.splice(i, 1);
			} else args.splice(i, 1);
		} 
		else if (marr = args[i].match(/^(---+[a-zA-Z0-9][-a-zA-Z0-9]+)$/)) {
			err.push(`${com}: invalid option: '${marr[1]}'`);
			args.splice(i, 1);
		}
		else i++;
	}
	return [obj, err];
}//»
const add_to_env = (arr, env, opts)=>{//«
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
			err.push(`sh: ${which}: cannot set the constant environment variable`);
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
const import_coms = async libname => {//«

	let modpath = libname.replace(/\./g,"/");
	let v = (Math.random()+"").slice(2,9);
	let imp = await import(`/coms/${modpath}.js?v=${v}`);

	let coms = imp.coms;
	let sh_coms = globals.shell_commands;
	let all = Object.keys(coms);
	let ok_coms = [];
	for (let com of all){
		if (typeof sh_coms[com] === "function") {
cwarn(`The command ${com} already exists!`);
			continue;
		}
		sh_coms[com] = coms[com];
		ok_coms.push(com);
	}
	ALL_LIBS[libname] = ok_coms;
cwarn(`Added: ${ok_coms.length} commands from '${libname}'`);
	let opts = imp.opts||{};
	let sh_opts = globals.shell_command_options;
	all = Object.keys(opts);
	for (let opt of all){
		if (sh_opts[opt]){
cwarn(`The option ${opt} already exists!`);
			continue;
		}
		sh_opts[opt] = opts[opt];
	}
	NS.coms[libname] = {coms, opts};

//	NS.libs[libname] = {coms, opts};

}//»
const do_imports = async(arr, err_cb) => {//«
	if (!err_cb) err_cb = ()=>{};
	for (let arg of arr){
		if (ALL_LIBS[arg]) {
			err_cb(`${arg}: already loaded`);
			continue;
		}   
		try{
			await import_coms(arg);
		}catch(e){
			err_cb(`${arg}: error importing the module`);
cerr(e);
		}
	}
};//»

const delete_coms = arr => {//«
	let sh_coms = globals.shell_commands;
	let sh_opts = globals.shell_command_options;
	for (let libname of arr){

if (!ALL_LIBS[libname]){
cwarn(`The command library: ${libname} is not loaded`);
continue;
}

		let lib = NS.coms[libname];
		if (!lib){
//cwarn(`The command library: ${libname} was in ALL_LIBS, but not in NS.coms!?!?!`);
			continue;
		}
		let coms = lib.coms;
		let all = Object.keys(coms);
		let num_deleted = 0;
		for (let com of all){
//CJIUKLEH
			if (sh_coms[com] !== coms[com]){
//cwarn(`The command ${com} is not owned by lib: ${libname}!!`);
				continue;
			}
			delete sh_coms[com];
			num_deleted++;
		}
cwarn(`Deleted: ${num_deleted} commands from '${libname}'`);
		let opts = lib.opts;
		all = Object.keys(opts);
		for (let opt of all){
			if (sh_opts[opt] !== opts[opt]){
//cwarn(`The option ${opt} is not owned by lib: ${libname}!!`);
				continue;
			}
			delete sh_opts[opt];
		}
		delete ALL_LIBS[libname];
		delete NS.coms[libname];
	}
};//»
const delete_mods=(arr)=>{//«
	for (let m of arr){
		let scr = document.getElementById(`script_mods.${m}`);
		if (scr) {
			scr._del();
		}
else{
//cwarn(`The module ${m} was not loaded!`);
continue;
}
		delete NS.mods[m];
cwarn(`Deleted module: ${m}`);
	}
}//»

const write_to_redir = async(term, out, redir, env)=>{//«
//let {err} = await write_to_redir(term, (out instanceof Uint8Array) ? out:out.join("\n"), redir, env);
	if (!isArr(out)) return {err: "the redirection output is not a Uint8Array or JS array!"}
	if (!(out instanceof Uint8Array)) {
		 if (!isStr(out[0])) return {err: "the redirection output does not seem to be an array of Strings!"};
		out = out.join("\n");
	}
	let op = redir.shift();
	let fname = redir.shift();
	if (!fname) return {err:`missing operand to the redirection operator`};
	let fullpath = normPath(fname, term.cur_dir);
	let node = await fsapi.pathToNode(fullpath);
	if (node) {
		if (node.type == FS_TYPE && op===">" && !ALLOW_REDIRECT_CLOBBER) {
			if (env.CLOBBER_OK==="true"){}
			else return {err: `not clobbering '${fname}' (ALLOW_REDIRECT_CLOBBER==${ALLOW_REDIRECT_CLOBBER})`};
		}
		if (node.writeLocked()){
			return {err:`${fname}: the file is "write locked" (${node.writeLocked()})`};
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
	if (!(parnode&&parnode.appName===FOLDER_APP&&(typ===FS_TYPE||typ===SHM_TYPE||typ=="dev"))) return {err:`${fname}: invalid or unsupported path`};
	if (typ===FS_TYPE && !await fsapi.checkDirPerm(parnode)) {
		return {err:`${fname}: Permission denied`};
	}
	if (!await fsapi.writeFile(fullpath, out, {append: op===">>"})) return {err:`${fname}: Could not write to the file`};
	return {};
};//»

//»

//Command Classes«

const Com = class {//«
	constructor(name, args, opts, env={}){//«
		this.name =name;
		this.args=args;
		this.opts=opts;
		this.numErrors = 0;
		this.noPipe = false;
		for (let k in env) {
			this[k]=env[k];
		}
		if (this.out_redir&&this.out_redir.length){
			this.redirLines = [];
		}
		this.awaitEnd = new Promise((Y,N)=>{
			this.end = (rv)=>{
				Y(rv);
				this.killed = true;
			};
			this.ok=(mess)=>{
				if (mess) this.suc(mess);
				if (this.pipeTo) this.out(EOF);
				Y(E_SUC);
				this.killed = true;
			};
			this.no=(mess)=>{
				if (mess) this.err(mess);
				if (this.inpipe) this.out(EOF);
				Y(E_ERR);
				this.killed = true;
			};
			this.nok=(mess)=>{
				this.numErrors?this.no(mess):this.ok(mess);
			};
		});
	}//»
	static grabsScreen = false;
	async nextArgAsNode(opts={}){//«
		let {noErr, noneIsErr} = opts;
		let e, f, node;
		f = this.args.shift();
		if (!f) {
			if (noneIsErr) e = `there are no args left`;
			else return null;
		}
		else{
			node = await f.toNode(this.term);
			if (node) return node;
			e = `${f}: not found`;
		}
		if (!noErr) {
			this.err(e);
			this.numErrors++;
		}
		return new Error(e);
	}//»
	async nextArgAsFile(opts={}){//«
		let file = await this.nextArgAsNode(opts);
		if (!isNode(file) || file.isFile) return file;
		let e = `${file.name}: not a regular file`;
		if (!opts.noErr) {
			this.err(e);
			this.numErrors++;
		}
		return new Error(e);
	}//»
	async nextArgAsDir(opts={}){//«
		let dir = await this.nextArgAsNode(opts);
		if (!isNode(dir) || dir.isDir) return dir;
		let e = `${dir.name}: not a directory`;
		if (!opts.noErr) {
			this.err(e);
			this.numErrors++;
		}
		return new Error(e);
	}//»
	async nextArgAsText(opts={}){//«
		let {noErr, noneIsErr, asStr} = opts;
		let f = await this.nextArgAsFile(opts);
		if (!isFile(f)) return f;
		let str = await f.text;
		if (!isStr(str)) {
			let e = `${f.name}: unknown value returned from 'node.text'`;
			if (!noErr) {
				this.err(e);
				this.numErrors++;
			}
			return e;
		}
		if (asStr) return str;
		return str.split("\n");;
	}//»
	get noStdin(){return(!(this.pipeFrom || this.stdin));}
	get noArgs(){return(this.args.length===0);}
	expectArgs(num){//«
		if (!isNum(num)) {
			this.err(`invalid argument given to expectArgs (see console)`);
			this.numErrors++;
cwarn("Here is the non-numerical value below");
log(num);
			return;
		}
		let nargs = this.args.length;
		if (nargs != num){
			this.err(`expected ${num} arguments (got ${nargs})`);
			this.numErrors++;
			return;
		}
		return true;
	}//»
	maybeSetNoPipe(){if(this.args.length || this.stdin)this.noPipe=true;}
	noInputOrArgs(opts={}){//«
		let have_none = !(this.args.length || this.pipeFrom || this.stdin);
		if (have_none && !opts.noErr){
			this.err("no args or input received");
			this.numErrors++;
		}
		return have_none;
	}//»
	eof(){this.out(EOF);}
	init(){}
	run(){
		this.wrn(`sh: ${this.name}: the 'run' method has not been overriden!`);
	}
	cancel(){
		this.killed = true;
cwarn(`${this.name}: cancelled`);
	}

}//»
const ScriptCom = class extends Com{//«
	constructor(shell, name, text, args, env){
		super(name, args, {}, env);
		this.text = text;
		this.shell = shell;
	}
	async run(){
		let scriptOut = this.out;
		let scriptArgs = this.args;
		let scriptName = this.name;
		let code = await this.shell.execute(this.text, {scriptOut, scriptName, scriptArgs});
		this.end(code);
	}
}//»
const NoCom=class{//«
	init(){
		this.awaitEnd=new Promise((Y,N)=>{
			this.ok=()=>{
				if (this.pipeTo) this.out(EOF);
				Y(E_SUC);
			}
		});
	}
	run(){
		this.ok();
	}
	cancel(){}
}//»
const ErrCom = class extends Com{//«
	run(){
		this.no(this.errorMessage);
	}
}//»
const make_sh_error_com = (name, mess, com_env)=>{//«

	let com = new ErrCom(name, null,null,com_env);
//SPOIRUTM
	com.errorMessage = `sh: ${name}: ${mess}`;
	return com;
};//»
globals.comClasses={Com, ErrCom};

//»

//Shell Builtins«

//Command functions«

/*
const com_ = class extends Com{
init(){
}
run(){
}
}
*/
const com_echo = class extends Com{//«
	run(){
		this.out(this.args.join(" "));
		this.ok();
	}
}//»
const com_echodelay = class extends Com{//«
	async run(){
		let delay;
		if (this.opts.d) {
			delay = parseInt(this.opts.d);
			if (isNaN(delay)) {
				delay = 0;
				this.wrn(`invalid delay value (using 0 ms)`);
			}
		}
		else delay = 0;

		for (let arg of this.args){
			this.out(arg);
			await sleep(delay);
		}
		this.ok();
	}
}//»
const com_ls = class extends Com{//«

init(){
	let {opts, args}=this;
	if (!args.length) args.push("./");
	this.optAll = opts.all||opts.a;
	this.optRecur = opts.recursive || opts.R;
}
async run(){//«
	let colors = [];
	let {pipeTo, isSub, term, out, err, args} = this;
	let no_fmt = pipeTo|| isSub;
	let nargs = args.length;
	let dir_was_last = false;
	let all = this.optAll;
	let recur = this.optRecur;
	const do_path = async(node_or_path)=>{
		let node;
		let wants_dir;
		let path;
		let regpath;
		if (isStr(node_or_path)){
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
			err(`${regpath}: no such file or directory`);
			return;
		}
		if (node.appName !== FOLDER_APP) {
			if (wants_dir) {
				err(`${regpath}: not a directory`);
				return;
			}
			if (dir_was_last) out.push("");
			dir_was_last = false;
			if (node.appName==LINK_APP){
				out(`${node.name} -> ${node.symLink}`);
				return;
			}
			let sz = "?";
			if (node.type === FS_TYPE) {
				let file = await node._file;
				if (file) sz = file.size;
			}
			else if (Number.isFinite(node.size)) sz = node.size;
			out(`${node.name} ${sz}`);
			return;
		}
		if (!node.done) await fsapi.popDir(node);
		dir_was_last = true;
		let kids = node.kids;
		let arr = kids._keys;
		let names=[];
		let lens = [];
		let types = [];
		if (out.length && nargs > 1 || recur) out("");
		if (nargs > 1 || recur) out(`${path}:`);
		let s = "";
		let dir_arr = [];
		for (let nm of arr){
			if (!all) {
				if (nm=="."||nm=="..") continue;
				if (nm.match(/^\./)) continue;
			}
//			if (pipeTo) {
			if (no_fmt) {
				out(nm);
			}
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
//		if (pipeTo||isSub) {
		if (no_fmt) {
			out(...dir_arr);
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
			term.fmt_ls(dir_arr, name_lens, ret, types, colors);
//log(ret);
			out(ret.join("\n"), {colors, didFmt: true});
		}//»
		if (recur) {
			for (let dir of recur_dirs) await do_path(dir);
		}
	};
	while (args.length) {
		await do_path(args.shift());
	}
	this.ok();
}//»

}//»
const com_env = class extends Com{/*«*/
run(){
	let {term, args}=this; 
	if (args.length) {
		return this.no("arguments are not supported");
	}
	let env = term.ENV;
	let keys = env._keys;
	let out = [];
	for (let key of keys){
		let val = env[key];
		out.push(`${key}=${val}`);
	}
	this.out(out.join("\n"));
	this.ok();
}
}/*»*/
const com_parse = class extends Com{/*«*/
	async run(){
		if (this.pipeFrom) return;
		let f;
		while (f = this.args.shift()){
			let node = await f.toNode(this.term);
			if (!node) {
				this.err(`not found: ${f}`);
				this.numErrors++;
				continue;
			}
			this.tryParse(await node.text);
		}
		this.numErrors?this.no():this.ok();
	}
	tryParse(val){
		try{
			this.out(JSON.parse(val));
			return true;
		}
		catch(e){
			this.err(e.message);
			this.numErrors++;
			return false;
		}
	}
	pipeIn(val){
		if (!isEOF(val)) this.tryParse(val);
		else this.ok();
	}
}/*»*/
const com_stringify = class extends Com{/*«*/
	init(){
		if (!this.pipeFrom) return this.no("expecting piped input");
	}
	run(){
	}
	#tryStringify(val){
		try{
			this.out(JSON.stringify(val));
			return true;
		}
		catch(e){
			this.err(e.message);
			this.numErrors++;
			return false;
		}
	}
	pipeIn(val){
		if (!isEOF(val)) this.#tryStringify(val);
		else {
			this.numErrors?this.no():this.ok();
			this.ok();
		}
	}
}/*»*/
const com_clear = class extends Com{/*«*/
	run(){
		this.term.clear();
		this.ok();
	}
}/*»*/
const com_true = class extends Com{/*«*/
	run(){
		let mess;
		if (this.args.length) mess = this.args.join(" ");
		else mess = "I'm true";
		this.ok(mess);
	}
}/*»*/
const com_false = class extends Com{/*«*/
	run(){
		let mess;
		if (this.args.length) mess = this.args.join(" ");
		else mess = "I'm false";
		this.no(mess);
	}
}/*»*/
const com_cd = class extends Com{/*«*/
init(){
	if (!this.args.length) {
		this.args.push(this.term.get_homedir());
	}
}
async run(){
	let {args, term} = this;
	if (args.length > 1) return this.no("too many arguments");
	let res;
	let got_dir;
	let saypath = args[0];
	let regpath = normPath(saypath, term.cur_dir);
	let ret = await fsapi.pathToNode(regpath);
	if (!ret) return this.no(`${saypath}: no such file or directory`);
	if (ret.appName != FOLDER_APP) return this.no(`${saypath}: not a directory`);
	got_dir = regpath;
	if (!got_dir.match(/^\x2f/)) got_dir = `/${got_dir}`;
	term.cur_dir = got_dir;
	term.cwd = got_dir;
	this.ok();
}
}
/*»*/
const com_app = class extends Com{//«

async run(){
	const{args, out, err: _err, term}=this;
	let list = await util.getList("/site/apps/");
	if (!args.length) {
		if (!list){
			return this.no("could not get the app list");
		}
		out(list.join("\n"));
		return this.ok();
	}
	let have_error=false;
	for (let appname of args){
		if (list && !list.includes(appname)) {
			_err(`${appname}: not found`);
			continue;
		}
		let win = await Desk.api.openApp(appname);
		if (!win) _err(`${appname}: not found`);
	}
	have_error?this.no():this.ok();
}

}//»

const com_msleep = class extends Com{/*«*/
	async run(){
		let ms = parseInt(this.args.shift());
		if (!Number.isFinite(ms)) ms = 0;
		await sleep(ms);
		this.ok();
	}
}/*»*/
const com_hist = class extends Com{/*«*/
	run(){
		this.out(this.term.get_history().join("\n"));
		this.ok();
	}
}/*»*/
const com_pwd = class extends Com{/*«*/
	run(){
		this.out(this.term.cur_dir);
		this.ok();
	}
}/*»*/
const com_libs = class extends Com{/*«*/
	async run(){
		this.out((await util.getList("/site/coms/")).join("\n"));
		this.ok();
	}
}/*»*/
const com_lib = class extends Com{//«
init(){
	if (!this.args.length) return this.no("no lib given");
	if (this.args.length > 1) return this.no("too many arguments");
}
async run(){
	if (this.killed) return;
	let lib = this.args.shift();
	let hold = lib;
	let got = ALL_LIBS[lib] || NS.coms[lib];
	if (got){
		if (!isArr(got)) got = Object.keys(got);
		this.out(got.join("\n"));
		return this.ok();
	}
	let orig = lib;
	lib = lib.replace(/\./g,"/");
	let path = `/coms/${lib}.js`;
	try{
		const coms = (await import(path)).coms;
		NS.coms[orig] = coms;
		this.out((Object.keys(coms)).join("\n"));
		this.ok();
	}catch(e){
cerr(e);
		this.no(`the library: '${hold}' could not be loaded!`);
	}

}
}//»
const com_open = class extends Com{//«
init(){
	if (!this.args.length) {
		this.no(`missing operand`);
	}
}
async run(){
	const{term, err:_err}=this;
	let have_error = false;
	const err=mess=>{
		have_error = true;
		_err(mess);
	};
	for (let path of this.args) {
		let fullpath = normPath(path, term.cur_dir);
		let node = await fsapi.pathToNode(fullpath);
		if (!node) {
			err(`${path}: no such file or directory`);
			continue;
		}
		let win = await Desk.open_file_by_path(node.fullpath);
		if (!win) err(`${path}: could not be opened`);
	}
	have_error?this.no():this.ok();
}
}//»
const com_epoch = class extends Com{/*«*/
	run(){
		this.out(Math.round((new Date).getTime()/ 1000)+"");
		this.ok();
	}
}/*»*/
const com_getch = class extends Com{//«

async run(){
	if (this.args.length) return this.no("not expecting arguments");
	let ch = await this.term.getch("");
	if (!ch) return this.no("no character returned");
	this.suc(`Got: ${ch} (code: ${ch.charCodeAt()})`);
	this.out(ch);
	this.ok();
}

}//»
const com_export = class extends Com{/*«*/
	run(){
		let rv = add_to_env(this.args, this.term.ENV, {if_export: true});
		if (rv.length){
			this.err(rv);
			this.no();
		}
		else this.ok();
	}
}/*»*/
const com_curcol = class extends Com{/*«*/
	run(){
		let which = this.args.shift();
		if (which=="white"){
			this.term.cur_white();
			this.ok();
		}
		else if (which=="blue"){
			this.term.cur_blue();
			this.ok();
		}
		else{
			this.no(`missing or invalid arg`);
		}
	}
}/*»*/
const com_read = class extends Com{//«

async run(){
	const {args, opts, term, err: _err} = this;
	const{ENV}=term;
	let have_error = false;
	const err=mess=>{
		have_error = true;
		_err(mess);
	};
	let use_prompt = opts.prompt;
	if (use_prompt && use_prompt.length > term.w - 3){
		this.no(`the prompt is too wide (have ${use_prompt.length}, max = ${term.w - 4})`);
		return;
	}
	let ln = await term.read_line(use_prompt);
	let vals = ln.trim().split(/ +/);
	while (args.length){
		let arg = args.shift();
		if (NO_SET_ENV_VARS.includes(arg)) {
			err(`refusing to modify read-only variable: ${arg}`);
			vals.shift();
			continue;
		}
		let useval;
		if (!args.length) {
			if (vals.length) useval = vals.join(" ");
		}
		else useval = vals.shift();
		if (!useval) useval = "";
		ENV[arg] = useval;
	}
	have_error?this.no():this.ok();
}

}//»
const com_math = class extends Com{//«
#lines;
#math;
async init(){
	if (!this.args.length && !this.pipeFrom) {
		return this.no("nothing to do");
	}
	if (!this.args.length){
		this.#lines=[];
	}
/*math-expression-evaluator npm package/ github repo«

From: https://github.com/bugwheels94/math-expression-evaluator
Minimized code: https://github.com/bugwheels94/math-expression-evaluator/blob/master/dist/browser/math-expression-evaluator.min.js
1) At top of the file, put: 
	const exports={};
2) Then unfold first curly to make:
	!function(e,t){"object"==typeof exports...
...become:
	!function(e,t){
		exports.Mexp = t;
		"object"==typeof exports...
3) At bottom of the file, put:
	export const mod = new exports.Mexp();

»*/
	if (!await util.loadMod("util.math")) {
		return no("could not load the math module");
	}
    this.#math = new NS.mods["util.math"]();
}
#doMath(str){

	try{
		this.inf(`evaluating: '${str}'`);
		this.out(this.#math.eval(str)+"");
		this.ok();
	}catch(e){
//cerr(e);
		this.no(e.message);
	}
}
run(){
	if (this.killed || !this.args.length) return;
	this.#doMath(this.args.join(" "));
}
pipeIn(val){
    if (!this.#lines) return;
    if (isEOF(val)){
        this.out(val);
        this.#doMath(this.#lines.join(" "));
        return;
    }
    if (isStr(val)) this.#lines.push(val);
    else if (isArr(val)) this.#lines.push(...val);
    else{
cwarn("WUTISTHIS", val);
    }
}
}//»
const com_appicon = class extends Com{//«

async run(){
	if (this.args.length){
		this.out(JSON.stringify({app: this.args.shift()}));
	}
	else {
		this.out(await util.getList("/site/apps/"));
	}
	this.ok();
}

}//»
const com_import = class extends Com{/*«*/
async run(){
	let {term, err: _err, opts, args}=this;
	let have_error = false;
	const err=(arg)=>{
		_err(arg);
		have_error = true;
	};
	if (opts.delete || opts.d){
		delete_coms(args);
		this.ok();
		return;
	}
	await do_imports(args, err);
	have_error?this.no():this.ok();
}
}/*»*/

const com_inspect = class extends Com{/*«*/

#menu;
#thing;
#addThing;
#promise;
async init(){
	if (!this.pipeFrom) return this.no("expecting piped input");
	if (!await util.loadMod("term.menu")) {
		this.no("could not load the editor module");
		return;
	}
	let menu = new NS.mods["term.menu"](this.term);
	this.#thing = [];
	this.#promise = menu.init(this.#thing,{opts: this.opts, command_str: this.command_str});
	this.#addThing = menu.addThing;
	this.#menu = menu;
}
async run(){
	await this.#promise;
	if (this.pipeTo) this.out(this.#thing,join("\n"));
	this.ok();
}
pipeIn(val){
	if (this.#menu.killed) return;
	if (isEOF(val)){
		return;
	}
	let add = this.#addThing;
	if (isArr(val)) {
		for (let v of val) add(v);
	}
	else add(val);
}

static grabsScreen = true;
//static get grabsScreen(){return true;}
}/*»*/

const com_test = class extends Com{//«
	init(){
	}
	pipeIn(val){
	}
	async run() {//«
this.ok("NOT MUCH HERE!!!");
	}//»
};//»

//»

const command_options = {//«

/*«
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

»*/
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
	read:{l:{prompt:3}},
	import:{s:{d:1},l:{delete: 1}},
	echodelay:{s:{d: 3}}

/*«
//	ssh:{//«
//		s:{c:1, s:1, x:1, i: 1},
//		l:{client: 1, server: 1}
//	},//»
	email:{
		s:{a:1,d:1},
		l:{add:1,del:1},
	},
	smtp:{
		s:{p:1},
		l:{"to-paras":1}
	}
»*/

};//»

//FWPORUITJ
const shell_commands={//«
math: com_math,
inspect: com_inspect,
curcol: com_curcol, 
parse: com_parse,
stringify: com_stringify,
getch: com_getch,
read: com_read,
true: com_true,
false: com_false,
epoch: com_epoch,
hist: com_hist,
import: com_import,
libs: com_libs,
lib: com_lib,
export: com_export,
pwd: com_pwd,
clear: com_clear,
cd: com_cd,
ls: com_ls,
echo: com_echo,
echodelay: com_echodelay,
env: com_env,
app: com_app,
appicon: com_appicon,
open: com_open,
msleep: com_msleep,
};

//»


//»

//Shell Init«

//MYKLJDHFK
for (let k in PRELOAD_LIBS){

	let arr = PRELOAD_LIBS[k];
	for (let com of arr) {
if (shell_commands[com]){
cwarn(`The shell command: ${com} already exists (also defined in PRELOAD_LIBS: ${k})`);
continue;
}
		shell_commands[com]=k;
	}

}
const active_commands = globals.shell_commands || shell_commands;
if (!globals.shell_commands) {
	globals.shell_commands = shell_commands;
}
if (dev_mode){

active_commands.test = com_test;

}

const active_options = globals.shell_command_options || command_options;
if (!globals.shell_command_options) globals.shell_command_options = command_options;


//»

//«Shell

//const Shell = (()=>{

ShellNS.Shell = (()=>{

//Scanner/Parser«

const Parser=(()=>{

//ErrorHandler«

const ErrorHandler = class {

	constructor() {//«
		this.errors = [];
		this.tolerant = false;
	}//»
	recordError(error) {//«
		this.errors.push(error);
	};//»
	tolerate(error) {//«
		if (this.tolerant) {
			this.recordError(error);
		}
		else {
			throw error;
		}
	};//»
	constructError(msg, column) {//«
		var error = new Error(msg);
		try {
			throw error;
		}
		catch (base) {

			if (Object.create && Object.defineProperty) {
				error = Object.create(base);
				Object.defineProperty(error, 'column', { value: column });
			}
		}
		return error;
	};//»
	createError(index, line, col, description) {//«
		var msg = description + ` (line ${line})`;
		var error = this.constructError(msg, col);
		error.index = index;
		error.lineNumber = line;
		error.description = description;
		return error;
	};//»
	throwError(index, line, col, description) {//«
		throw this.createError(index, line, col, description);
	};//»
	tolerateError(index, line, col, description) {//«
		var error = this.createError(index, line, col, description);
		if (this.tolerant) {
			this.recordError(error);
		}
		else {
			throw error;
		}
	};//»

};//»
//Scanner«

//These 2 functions are "holdover" logic from esprima, which seems too "loose" for 
//typical shell scripting purposes
const isWhiteSpace = (cp) => {//«
	return (cp === 0x20) || (cp === 0x09) || (cp === 0x0B) || (cp === 0x0C) || (cp === 0xA0) ||
		(cp >= 0x1680 && [0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(cp) >= 0);
};//»
const isLineTerminator = (cp) => {//«
	return (cp === 0x0A) || (cp === 0x0D) || (cp === 0x2028) || (cp === 0x2029);
};//»

//const COMPOUND_START_WORDS = [
const COMPOUND_NON_START_WORDS = [/*«*/
	'then',
	'else',
	'elif',
	'fi',
	'do',
	'done',
	'esac',
	'}',
	'in'
];/*»*/
const RESERVERD_WORDS = [/*«*/
	'if',
	'then',
	'else',
	'elif',
	'fi',
	'do',
	'done',
	'case',
	'esac',
	'while',
	'until',
	'for',
	'{',
	'}',
	'in'
];/*»*/
const RESERVED_START_WORDS = [/*«*/
	"{",
	"for",
	"if",
	"while",
	"until",
	"case"
];/*»*/

const Scanner = class {

constructor(code, opts={}, handler) {//«
	this.isInteractive = opts.isInteractive||false;
	this.env = opts.env;
	this.terminal = opts.terminal;
	this.source = code;
	this.errorHandler = handler;
	this.length = code.length;
	this.index = 0;
	this.lineNumber = (code.length > 0) ? 1 : 0;
	this.lineStart = 0;
}//»

eof() {//«
	return this.index >= this.length;
};//»
eol(){//«
	return this.isInteractive && (this.index >= this.length);
}//»
async more(no_nl){/*«*/
	if (!this.eol()){
		throw new Error("more() was call, but NOT at eol()");
	}
	let nl;
	if (no_nl) nl="";
	else nl="\n";
	let rv = nl+(await this.terminal.read_line("> "));
//log(RV, `${rv}`);
	this.source = this.source.concat(...rv);
	this.length = this.source.length;
}/*»*/
throwUnexpectedToken(message) {//«
	if (message === void 0) { message = Messages.UnexpectedTokenIllegal; }
	return this.errorHandler.throwError(this.index, this.lineNumber, this.index - this.lineStart + 1, message);
};//»

skipSingleLineComment() {//«
	while (!this.eof()) {
//		let ch = this.source.charCodeAt(this.index);
		let code = this.source[this.index].charCodeAt();
		if (isLineTerminator(code)) {
			return;
		}
		this.index++;
	}
};//»
scanComments() {//«
	while (!this.eof()) {
		let code = this.source[this.index].charCodeAt();
		if (isWhiteSpace(code)) {
			++this.index;
		}
		else if (isLineTerminator(code)) {
			break;
		}
		else if (code===0x23){//'#' in 0th line position or preceeded by a space or tab«
			if (this.index - this.lineStart === 0 || this.source[this.index-1] === " " || this.source[this.index-1] === "\t"){
				this.index++;
				this.skipSingleLineComment();
			}
			else {
				break;
			}
		}//»
		else {
			break;
		}
	}
};//»

async scanQuote(par, which, in_backquote, cont_quote){//«
//log("scanQuote", which, this.index);
// If we are in double-quotes or back-quotes, we need to check for:
// 2) '$(': scanComSub
	let check_subs = which==='"'||which==="`";

//If we are in double quotes, need to check for backquotes
	let check_bq = which==='"';
//let check_subs
//	let out=[];

	let start;
	if (!cont_quote){
	 	start = this.index;
	}
	let src = this.source;
	let len = src.length;
	let is_ds_single = which === "$";
	let is_single;
	if (is_ds_single) {
		if (!cont_quote) this.index++;
		is_single = true;
	}
	else if (which==="'"){
		is_single = true;
	}
	let is_hard_single = is_single && !is_ds_single;
	let is_dq = which === '"';
	let is_bq = which === '`';
	let err;
	const quote = cont_quote || (is_dq ? new DQuote(start, par) : 
		(is_hard_single ? new SQuote(start, par) : 
			(is_ds_single ? new DSQuote(start, par) :
				(is_bq ? new BQuote(start, par) :
					(err = new Error("WWTTFFFFFF ^&*^&(#&$*($#@"))
				)
			)
		));
	if (err) throw err;
	const out = quote.val;

	let end_quote;
	if (which==="$") end_quote="'";
	else end_quote = which;

	if (!cont_quote) this.index++;
	let cur = this.index;
	let ch = src[cur];
	let rv;
	let next;
	while(ch && ch !== end_quote){
		if (ch==="`" && in_backquote){
			return `unexpected EOF while looking for matching '${which}'`;
		}
		if (check_subs&&ch==="$"&&(src[cur+1]==="("||src[cur+1]==="{")) {//«
			this.index=cur;
			if (src[cur+2]==="("){
//				rv = await this.scanComSub(quote, true, is_bq||in_backquote);
				rv = await this.scanSub(quote, {isMath: true, inBack: is_bq||in_backquote});
				if (rv===null) this.throwUnexpectedToken(`unterminated math expression`);
			}
			else if (src[cur+1]==="{"){
//				rv = await this.scanComSub(quote, true, is_bq||in_backquote);
				rv = await this.scanSub(quote, {isParam: true, inBack: is_bq||in_backquote});
				if (rv===null) this.throwUnexpectedToken(`unterminated parameter substitution`);
			}
			else{
//				rv = await this.scanComSub(quote, null, is_bq||in_backquote);
				rv = await this.scanSub(quote, {isComSub: true, inBack: is_bq||in_backquote});
				if (rv===null) this.throwUnexpectedToken(`unterminated command substitution`);
			}
			if (isStr(rv)) this.throwUnexpectedToken(rv);
			out.push(rv);
			cur=this.index;
		}//»
		else if (check_bq&&ch==="`"){//«
			this.index = cur;
			rv = await this.scanQuote(quote, "`");
			if (rv===null)  this.throwUnexpectedToken(`unterminated quote: "${ch}"`);
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			out.push(rv);
			cur=this.index;
		}//»
		else if (!is_hard_single && ch==="\\"){//«
			cur++;
			ch = src[cur];
//log("HICH", ch);
/*
if (this.isInteractive){
log("GET MOAR...");
}
else{
cwarn("SKIP OIMPET");
}
*/
			if (!ch) this.throwUnexpectedToken("unsupported line continuation (2)");
			let c = ch;
			ch = new String(c);
			ch.escaped = true;
			if (is_ds_single||is_dq)ch.toString=()=>{
//log("TOSTRING!!!");
				return "\\"+c;
			};
//log(ch);
			//else is_bq: the character is in "free space" (no backslashes show up)
			out.push(ch);
		}//»
		else if (is_bq && (ch==='"'||ch==="'")){//«
			this.index=cur;
			rv = await this.scanQuote(quote, ch, true);
			if (rv===null)  this.throwUnexpectedToken(`unterminated quote: "${ch}"`);
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			out.push(rv);
			cur = this.index;
		}//»
		else if (is_bq && ch==="$" && src[cur+1]==="'"){//«
			this.index=cur;//DPORUTIH  ARGHHHHHHH!?!?!?!?!?
			rv = await this.scanQuote(quote, "$", true);
			if (rv===null)  this.throwUnexpectedToken(`unterminated quote: "${ch}"`);
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			out.push(rv);
			cur = this.index;
		}//»
		else {
			out.push(ch);
		}
		cur++;
		ch = src[cur];
	}
	this.index = cur;
	if (ch !== end_quote) {
		if (this.eol()){
			quote.val = out;
			await this.more();
			return await this.scanQuote(par, which, in_backquote, quote);
		}
		return null;
	}
	return quote;
}//»
async scanSub(par, opts={}){//«

let is_math = opts.isMath;
let is_param = opts.isParam;
let is_comsub = opts.isComSub;
if (!(is_math||is_param||is_comsub)){
throw new Error("NOT is_comsub || is_math || is_param ?!?!? HJKHFDK^&*^$*&#");
}
let in_backquote = opts.inBack;
let cont_sub = opts.contSub;

////async scanComSub(par, is_math, in_backquote, cont_sub){
/*
We need to collect words rather than chars if:
If par is a top-level word, then 
or:
If we are not embedded in any kind of quote
*/
//log("scanComSub", this.index);

let start = this.index;
//const sub = cont_sub || (is_math ? new MathSub(start, par) : new ComSub(start, par));
const sub = cont_sub || (is_math ? new MathSub(start, par) : 
	(is_param ? new ParamSub(start, par) : new ComSub(start, par))
	);
const out = sub.val;
if (!cont_sub) {
	this.index+=2;
	if (is_math){
		this.index++;
	}
}
let cur = this.index;
//let src = this.source;
let ch = this.source[cur];
//if (!ch) return null;
let have_space = false;
while(ch){

if (ch==="\\"&& !this.source[cur+1]) return "the command substitution must be on a single line";

if (ch==="\\"){//«
	cur++;
	out.push("\\", this.source[cur]);
	have_space = false;
}//»
else if (ch==="$"&&this.source[cur+1]==="'"){//«
	this.index=cur;
	let rv = await this.scanQuote(par, "$", in_backquote);
	if (rv===null) return `unterminated quote: $'`;
	if (isStr(rv)) return rv;
	out.push(rv);
	cur=this.index;
	have_space = false;
}//»
else if (ch==="'"||ch==='"'||ch==='`'){//«
	if (ch==="`"&& in_backquote){
		let say_ch;
		if (is_comsub) say_ch=")";
		else if (is_math) say_ch="))";
		else if (is_param) say_ch = "}";
//		return `unexpected EOF while looking for matching '${is_math?"))":")"}'`;
		return `unexpected EOF while looking for matching '${say_ch}'`;
	}
	this.index=cur;
	let rv = await this.scanQuote(sub, ch, in_backquote);
	if (rv===null) return `unterminated quote: ${ch}`;
	if (isStr(rv)) return rv;
	out.push(rv);
	cur=this.index;
	have_space = false;
}//»
else if (ch==="$"&&(this.source[cur+1]==="("||this.source[cur+1]==="{")){//«
	if (this.source[cur+2]==="("){
		this.index=cur;
//		let rv = await this.scanComSub(sub, true, in_backquote);
		let rv = await this.scanSub(sub, {isMath: true, inBack: in_backquote});
		if (rv===null) return `unterminated math expansion`;
		if (isStr(rv)) return rv;
		out.push(rv);
		cur=this.index;
	}
	else if (this.source[cur+1]==="{"){
		this.index=cur;
		let rv = await this.scanSub(sub, {isParam: true, inBack: in_backquote});
		if (rv===null) return `unterminated parameter expansion`;
		if (isStr(rv)) return rv;
		out.push(rv);
		cur=this.index;
	}
	else{
		this.index=cur;
////async scanComSub(par, is_math, in_backquote, cont_sub){
//		let rv = await this.scanComSub(sub, false, in_backquote);
		let rv = await this.scanSub(sub, {isComSub: true, inBack: true});
		if (rv===null) return `unterminated command substitution`;
		if (isStr(rv)) return rv;
		out.push(rv);
		cur=this.index;
	}
	have_space = false;
}//»
else if (((is_math || is_comsub) && ch===")") || (is_param && ch === "}")){//«
	if (is_math){
		if (this.source[cur+1] !== ")") return "expected a final '))'";
		cur++;
	}
	this.index = cur;
//	log(`scanSub DONE: ${start} -> ${cur}, <${out.join("")}>`);
	return sub;
}//»
else if (ch===" " || ch==="\t"){//«
	out.push(ch);
	have_space = true;
}//»
else{
if (ch==="#"&&have_space){
return 'the substitution was terminated by "#"';
}
	out.push(ch);
	have_space = false;
}

cur++;
ch = this.source[cur];

}
this.index = cur;

if (this.eol()){
	sub.val = out;
	await this.more();
//	return await this.scanComSub(par, is_math, in_backquote, sub);
	return await this.scanSub(par, {isMath: is_math, isComSub: is_comsub, isParam: is_param, inBack: in_backquote, contSub: sub});
}


//If we get here, we are "unterminated"
return null;

}//»
scanOperator(){/*«*/

	let src = this.source;
	let start = this.index;
	let str = src[start];
	let obj={};
	switch(str){
	case '(':/*«*/
		obj.isSubStart = true;
		obj.isCommandStart = true;
		++this.index;
		break;
	case ')':
		obj.isSubEnd = true;
		obj.isPatListEnd = true;
		++this.index;
		break;/*»*/
	case '&':/*«*/
		++this.index;
		if (src[this.index]==="&"){
			this.index++;
			str="&&";
			obj.isAndIf = true;
		}
		break;/*»*/
	case '|':/*«*/
		++this.index;
		if (src[this.index]==="|"){
			this.index++;
			str="||";
			obj.isOrIf = true;
		}
		else{
			obj.isPipe = true;
			obj.isPatListSep = true;
		}
		break;/*»*/
	case '>'://«
		++this.index;
		if ([">","&","|"].includes(src[this.index])){
			str+=src[this.index];
			++this.index;
		}
		break;/*»*/
	case '<':/*«*/
		++this.index;
	//'<<',
	//'<>',
	//'<<-',
	//'<<<',
		if (src[this.index]===">"){
			str = "<>";
			++this.index;
		}
		else if (src[this.index]==="<"){
			++this.index;
			if (src[this.index]==="<"){
				++this.index;
				str = "<<<";
			}
			else if (src[this.index]==="-"){
				++this.index;
				str = "<<-";
				obj.isHeredoc = true;
			}
			else{
				str="<<";
				obj.isHeredoc = true;
			}
		}
		break;/*»*/
	case ';':
		++this.index;
		if (src[this.index]===";"){
			this.index++;
			str=";;";
			obj.isDSemi = true;
			obj.isCaseItemEnd = true;
		}
		else if (src[this.index]==="&"){
			this.index++;
			str=";&";
			obj.isSemiAnd = true;
			obj.isCaseItemEnd = true;
		}
		break;
	}
	if (this.index === start) {
		this.throwUnexpectedToken(`Unexpected token ${str}`);
	}
	let check_unsupported_toks = dev_mode ? UNSUPPORTED_DEV_OPERATOR_TOKS : UNSUPPORTED_OPERATOR_TOKS;
	if (check_unsupported_toks.includes(str)) this.throwUnexpectedToken(`unsupported operator '${str}'`);
//	if (UNSUPPORTED_OPERATOR_TOKS.includes(str)) this.throwUnexpectedToken(`unsupported token '${str}'`);

//	let obj = {val: str, isOp: true};
	obj.val=str;
	obj.isOp = true;
	obj.toString=()=>{
		return str;
	};

	if (str.match(/[<>]/)) {
		obj.type="r_op";
		obj.r_op = str;
		obj.isRedir = true;
		obj.isCommandStart = true;
	}
	else{
		obj.type="c_op";
		obj.c_op = str;
		obj.isControl = true;
		if (str===";"){
			obj.isSeqSep = true;
			obj.isSemi = true;
		}
		else if (str==="&") {
			obj.isSeqSep = true;
			obj.isAmper = true;
		}
	}
	return obj;
//	if (str.match(/[<>]/)) return {type:"r_op", r_op:str, val: str, isOp: true};
//	return {type:"c_op", c_op:str, start, val: str, isOp: true};

}/*»*/
async scanWord(par, env){/*«*/
/*

Now we need to be "backslash aware". scanWord always begins in a "top-level" scope, which
can either be in free space or just after "`", "$(" or "$((" that are in free space,
or in double quotes or in themselves ("`" must be escaped to be "inside of" itself).

*/
	let start = this.index;
//	let src = this.source;
//	let str='';
	let src;
	let rv;
	let start_line_number = this.lineNumber;
	let start_line_start = this.lineStart;
	let _word = new Word(start, par, env);
	let word = _word.val;
	let is_plain_chars = true;
// Simple means there are only plain chars, escapes, '...', $'...' and 
// "..." with no embedded substitutions
	let is_simple = true;
	while (!this.eof()) {
		let ch = this.source[this.index];
		let next1 = this.source[this.index+1];
		let next2 = this.source[this.index+2];
		if (ch==="\\"){//«
			if (!next1) {//«
				if (this.isInteractive){
//We treat the escape character as if it doesn't exist, and everything continues on the same line
//with the ps1 prompt
					this.index++;
					await this.more(true);
					continue;
				}
				else{
//In a script and it ends like:
//echo hi\
					break;
				}
			}//»
			else if (next1 === "\n") {//«
				if (this.isInteractive){
//Newlines *are* added in interactive mode when calling 'await this.more()' while
//scanning a string that was not terminated.
					throw new Error("HOW IS THERE AN ACTUAL NEWLINE CHARACTER WHILE WE ARE INTERACTIVE?!?!");
				}
//In a script, just treat the 2 character sequence <escape> <newline> as if they don't exist
				this.index+=2;
				continue;
			}//»
			is_plain_chars = false;
			ch = new String(next1);
			ch.escaped = true;
			this.index++;
			word.push(ch);
		}//»
		else if (ch==="$" && next1 === "(" && next2==="("){//«
			is_plain_chars = false;
//			rv = await this.scanComSub(_word, true);
			rv = await this.scanSub(_word, {isMath: true});
			if (rv===null) this.throwUnexpectedToken(`unterminated math expression`);
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			word.push(rv);
		}//»
		else if (ch==="$" && next1 === "("){//«
			is_plain_chars = false;
//			rv = await this.scanComSub(_word);
			rv = await this.scanSub(_word, {isComSub: true});
			if (rv===null) this.throwUnexpectedToken(`unterminated command substitution`);
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			word.push(rv);
		}//»
		else if (ch==="$" && next1 === "{"){//«
			is_plain_chars = false;
			rv = await this.scanSub(_word, {isParam: true});
			if (rv===null) this.throwUnexpectedToken(`unterminated parameter substitution`);
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			word.push(rv);
		}//»
		else if ((ch==="$"&&next1==="'")||ch==="'"||ch==='"'||ch==='`'){//«
			is_plain_chars = false;
			rv = await this.scanQuote(_word, ch);
			if (rv===null) {
				if (ch=="'"){
					this.throwUnexpectedToken(`unterminated quote: "${ch}"`);
				}
				else{
					this.throwUnexpectedToken(`unterminated quote: '${ch}'`);
				}
			}
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			word.push(rv);
		}//»
		else if (ch==="\n"||ch===" "||ch==="\t") break;
		else if (OPERATOR_CHARS.includes(ch)) {//«
			break;
		}//»
		else {
			word.push(ch);
		}
		this.index++;
	}
	if (is_plain_chars){//«
		let wrd = word.join("");
		if (RESERVERD_WORDS.includes(wrd)) {
			_word.isRes = true;
			if (RESERVED_START_WORDS.includes(wrd)) {
				_word.isCommandStart = true;
				_word.isResStart = true;
			}
			else{
				_word.isCommandStart = false;
			}
//	if then else elif fi do done case esac while until for { } in
			switch(wrd){

			case "if": _word.isIf=true;break;
			case "then": _word.isThen=true;break;
			case "else": _word.isElse=true;break;
			case "elif": _word.isElif=true;break;
			case "fi": _word.isFi=true;break;
			case "do": _word.isDo=true;break;
			case "done": _word.isDone=true;break;
			case "case": _word.isCase=true;break;
			case "esac": _word.isEsac=true;break;
			case "while": _word.isWhile=true;break;
			case "until": _word.isUntil=true;break;
			case "for": _word.isFor=true;break;
			case "{": _word.isLBrace=true;break;
			case "}": _word.isRBrace=true;break;
			case "in": _word.isIn=true;break;
			default: 
cwarn("What is the word below, not RESERVED_WORDS!!!");
log(wrd);
				this.fatal(`WUTTHEHELLISTHISWORD --->${wrd} <---- ^&*^$#&^&*$ (see console)`);

			}
		}
		else{//Not reserverd word (is_plain_chars == true)
			_word.isCommandStart = true;
		}
	}//»
	else{
//is_plain_chars == false
		_word.isCommandStart = true;
	}
	return _word;
}/*»*/
scanNewlines(par, env, heredoc_flag){/*«*/

	let start = this.index;
	let src = this.source;
//	let str="";
	let val = [];
	let iter=0;
	let start_line_number = this.lineNumber;
	let start_line_start = this.index;
	while (src[start+iter]==="\n"){
		iter++;
		if (heredoc_flag) break;
	}
	this.index+=iter;
	this.lineStart = start_line_start+iter;
	this.lineNumber+=iter;

	let newlines = new Newlines(start, par, env);
//	newlines.isNLs = true;
	newlines.newlines = iter;
	return newlines;

}/*»*/
scanNextLineNot(delim){/*«*/
	let cur = this.index;
	let src = this.source;
	let ln='';
	let ch = src[cur];
	while(ch!=="\n"){
		if (!ch) break;
		ln+=ch;
		cur++;
		ch = src[cur];
	}
	this.index = cur+1;
	if (ln===delim) {
		return true;
	}
	if (this.eof()) return false;
	return ln;
}/*»*/
async lex(heredoc_flag){/*«*/

if (this.eof()) {//«
	return {
		type: EOF_Type,
		value: '',
		lineNumber: this.lineNumber,
		lineStart: this.lineStart,
		start: this.index,
		end: this.index
	};
}//»

let ch = this.source[this.index];

//We never do this because we are always entering single lines from the interactive terminal
//or sending them through one-by-one via ScriptCom.
if (ch==="\n") return this.scanNewlines(null, this.env, heredoc_flag);

//if (ch==="\n") this.scanNewlines();

/*
if (ch==="\\"){
	let next = this.source[this.index+1];
	if (!next || next === "\n") this.throwUnexpectedToken("unsupported line continuation");
	return this.scanWord();
}
*/
if (OPERATOR_CHARS.includes(ch)) {
	if (UNSUPPORTED_OPERATOR_CHARS.includes(ch)) this.throwUnexpectedToken(`unsupported token: '${ch}'`);
	return this.scanOperator();
}
return await this.scanWord(null, this.env);

}/*»*/

};

//»
//Parser«

const _Parser = class {

constructor(code, opts={}) {//«
	this.env = opts.env;
	this.terminal = opts.terminal;
	this.isInteractive = opts.isInteractive;
	this.isContinue = opts.isContinue;
	this.heredocScanner = opts.heredocScanner;
	this.errorHandler = new ErrorHandler();
	this.scanner = new Scanner(code, opts, this.errorHandler);
//	this.isInteractive = opts.isInteractive;
	this.lookahead = {//«
		type: EOF_Type,
		value: '',
		lineNumber: this.scanner.lineNumber,
		lineStart: 0,
		start: 0,
		end: 0
	};//»
	this.hasLineTerminator = false;
	this.tokNum = 0;
	this.numToks = 0;
	this.tokens = [];
/*
Since this is async (because we might need to get more lines from 'await terminal.read_line()'),
then we need to do 'await this.scanNextTok()' **outside** of the constructor, since there is
NO async/await in constructors.
*/
//	this.scanNextTok();
}//»

fatal(mess){//«
throw new Error(mess);
}//»
eol(){//«
	return (
		(this.isInteractive && this.tokNum === this.numToks) || 
		(!this.isInteractive && isNLs(this.tokens[this.tokNum]))
	)
}//»
end(){//«
//SLKIURUJ
	return(this.tokNum===this.numToks);
}//»
async scanNextTok(heredoc_flag) {//«
	let token = this.lookahead;
	this.scanner.scanComments();
	let next = await this.scanner.lex(heredoc_flag);
	this.hasLineTerminator = (token.lineNumber !== next.lineNumber);
	this.lookahead = next;
	return token;
};//»

nextLinesUntilDelim(delim){//«
	let out='';
	let rv = this.scanner.scanNextLineNot(delim);
	while (isStr(rv)){
		out+=rv+"\n";
		rv = this.scanner.scanNextLineNot(delim);
	}
	if (rv===true) return out;
	return false;
}//»


async parse() {//«
	let toks = [];
	let next = this.lookahead;
	let cur_iohere_tok;
	let heredocs;
	let heredoc_num;
	let cur_heredoc_tok;
	let cur_heredoc;
	let interactive = this.isInteractive;
	while (next.type !== EOF_Type) {
//If !heredocs && next is "<<" or "<<-", we need to:
		if (heredocs && isNLs(next)){/*«*/
if (interactive){
throw new Error("AMIWRONG OR UCAN'T HAVENEWLINESININTERACTIVEMODE");
}
			for (let i=0; i < heredocs.length; i++){
				let heredoc = heredocs[i];
				let rv = this.nextLinesUntilDelim(heredoc.delim);
				if (!isStr(rv)){
					return {err: "warning: here-document at line ? delimited by end-of-file"}
				}
				heredoc.tok.value = rv;
			}
			this.scanner.index--;
			heredocs = null;
		}/*»*/
		else if (cur_heredoc_tok){/*«*/
			if (next.isWord){/*«*/
				if (!heredocs) {
					heredocs = [];
					heredoc_num = 0;
				}
				cur_heredoc_tok.delim = next.toString();
				heredocs.push({tok: cur_heredoc_tok, delim: next.toString()});	
				cur_heredoc_tok = null;
			}/*»*/
			else{/*«*/
				if (isNLs(next)){
					return "syntax error near unexpected token 'newline'";
				}
				else if (next.r_op || next.c_op){
					return `syntax error near unexpected token '${next.r_op||next.c_op}'`;
				}
				else{
cwarn("Whis this non-NLs or r_op or c_op????");
					log(next);
					throw new Error("WUUTTTTTTTTT IZZZZZZZZZ THISSSSSSSSS JKFD^&*$% (see console)");
				}
			}/*»*/
		}/*»*/
		else if (next.type==="r_op" && (next.r_op==="<<" || next.r_op==="<<-")){/*«*/
			toks.push(next);
			cur_heredoc_tok = next;
//			cur_heredoc_tok.isHeredoc = true;
		}/*»*/
		else {/*«*/
				toks.push(next);
		}/*»*/
		await this.scanNextTok(!!heredocs);
		next = this.lookahead;
	}
	if (heredocs){/*«*/
		if (!interactive) return {err: "warning: here-document at line ? delimited by end-of-file"}
		for (let i=0; i < heredocs.length; i++){
			let heredoc = heredocs[i];
			let rv = await this.heredocScanner(heredoc.delim);
			heredoc.tok.value = rv.join("\n");
		}
		heredocs = null;
	}/*»*/
	if (cur_heredoc_tok){/*«*/
		return {err: "syntax error near unexpected token 'newline'"};
	}/*»*/
	return {tokens: toks, source: this.scanner.source.join("")};

};//»

};
//»

return {

parse:async(command_str, opts={})=>{//«

let parser = new _Parser(command_str.split(""), opts);
let toks, comstr_out;
let program;
try {
	let errmess;
	await parser.scanNextTok();
	({program, err: errmess, tokens: toks, source: comstr_out} = await parser.parse());
	if (errmess) return errmess;
	command_str = comstr_out;
}
catch(e){
	cerr(e);
	return e.message;
}
if (program) {
//cwarn("YARM");
//log(program);
//toks = [];
return program;
}
//Collect commands with their arguments«
let com = [];
let coms = [];
let have_neg = false;
for (let tok of toks){
	if (tok.c_op){
		if (!com.length) return `unexpected empty command (found: '${tok.c_op}')`;
		coms.push({com});
		com = [];
		coms.push(tok);
	}
	else if (isNLs(tok)){
		if (com.length){
			coms.push({com});
			com = [];
		}
	}
	else{
		let old_have_neg  = have_neg;
		if (!com.length){
			if (tok.isWord && tok.val.length===1 && tok.val[0]==="!"){
				have_neg = true;
				continue;
			}
			else have_neg = false;
		}
		else have_neg = false;
		if (old_have_neg){
			tok.hasBang = true;
		}
		com.push(tok);
	}
}
if (com.length) coms.push({com});
//»
//Collect pipelines with their subsequent logic operators (if any)«
let pipes = [];
let pipe = [];
for (let i=0; i < coms.length; i++){
	let tok = coms[i];
//log(tok);
	if (tok.c_op && tok.c_op != "|"){//Anything "higher order" than '|' ('&&', ';', etc) goes here«
		if (tok.c_op==="&&"||tok.c_op==="||") {/*«*/
			if (!coms[i+1]) {
				if (opts.isInteractive){
					let rv;
					while ((rv = await opts.terminal.read_line("> ")).match(/^ *$/)) {
						command_str+="\n";
					}
					return Parser.parse(command_str+"\n"+rv, opts);
				}
				return "malformed logic list";
			}
			pipes.push({pipe, type: tok.c_op});
		}/*»*/
		else {
			pipes.push({pipe}, tok);
		}
		pipe = [];
	}/*»*/
	else if (!tok.c_op){//Commands and redirects
//log("WUT1", tok);
		pipe.push(tok);
	}
	else if (pipe.length && coms[i+1]){//noop: This token "must" be a '|'
//log("WUT2", coms[i+1]);
	}
	else {
		if (opts.isInteractive && !coms[i+1]){
			let rv;
			while ((rv = await opts.terminal.read_line("> ")).match(/^ *$/)) {
				command_str+="\n";
			}
			return Parser.parse(command_str+"\n"+rv, opts);
		}
		return "malformed pipeline";
	}

}
if (pipe.length) pipes.push({pipe});
//»
//Collect ';' separated lists of pipelines+logic operators (if any)«
let statements=[];
let statement=[];
for (let tok of pipes){
	let cop = tok.c_op;
	if (cop) {
		if (cop==="&"||cop===";"){
			statements.push({statement, type: cop});
			statement = [];
		}
		else{
			return `unknown control operator: ${cop}`;
		}
	}
	else{
		statement.push(tok);
	}
}
if (statement.length) statements.push({statement});

//»
return statements;

}//»

}

})();//»
/*Sequence Classes (Words, Quotes, Subs)«*/

const Sequence = class {/*«*/
	constructor(start, par, env){
		this.par = par;
		this.env = env;
		this.val = [];
		this.start = start;
	}
}/*»*/
const Newlines = class extends Sequence{/*«*/
	get isNLs(){ return true; }
	toString(){ return "newline"; }
}/*»*/
const Word = class extends Sequence{//«
async expandSubs(shell, term){//«

/*«
Here we need a concept of "fields".

- Everything is a ComSub or BQuote will get expanded into as many fields as
  the lines that it returns.

- Everything else gets treated as a string that either starts the first
  field or gets concatenated onto the current field.

- DQuote is a special string that must resolve internal expansions.

»*/

const fields = [];
let curfield="";
//let didone = false;
for (let ent of this.val){

	if (ent instanceof BQuote || ent instanceof ComSub){//«
//The first result appends to curfield, the rest do: fields.push(curfield) and set: curfield=""
		let rv = await ent.expand(shell, term);
		let arr = rv.split("\n");
		if (arr.length) {
			curfield+=arr.shift();
			fields.push(curfield);
			let last = arr.pop();
			if (arr.length) fields.push(...arr);
			if (last) curfield = last;
			else curfield = "";
		}
//log(fields);
	}//»
	else if (ent instanceof MathSub){//«
//resolve and start or append to curfield, since this can only return 1 (possibly empty) value
		curfield += await ent.expand(shell, term);
	}//»
	else if (ent instanceof DQuote){//«
//resolve and start or append to curfield
//resolve by looping through everything and calling expand
//		curfield += await ent.expand(shell, term);
		curfield += '"'+await ent.expand(shell, term)+'"';
	}//»
	else if (ent instanceof SQuote || ent instanceof DSQuote){
		curfield += "'"+ent.toString()+"'";
	}
	else{//Must be isStr or DSQuote or SQuote«
		curfield += ent.toString();
	}//»

}
fields.push(curfield);
this.fields = fields;
//log(this.fields);

}//»

tildeExpansion(){//«
	const {val} = this;
	let parts = this.assignmentParts;
	let home_path = globals.HOME_PATH;
	let home_path_len = home_path.length;
	if (!parts){
		if (val[0]!=="~") return;
		if (val.length===1 || val[1]==="/"){
			val.splice(0, 1, ...home_path);
		}
		return;
	}
	let pos = parts[1];
	for (let i=pos; i < val.length; i++){
		if (i===pos&&val[pos]==="~"&&val[pos+1]=="/"){
			val.splice(pos, 1, ...home_path);
			i+=home_path_len;
		}
		else if (val[i]===":" && val[i+1]==="~"){
			if (!val[i+2]){
				val.splice(i+1, 1, ...home_path);
				return;
			}
			else if (val[i+2]=="/"){
				val.splice(i+1, 1, ...home_path);
				i+=home_path_len+2;
			}
		}
	}
}//»
dsSQuoteExpansion(){//«
	for (let ent of this.val){
		if (ent instanceof DSQuote) ent.expand();
	}
}//»
get isAssignment(){
	let eq_pos = this.val.indexOf("=");
	if (eq_pos <= 0) return false;//-1 means no '=' and 0 means it is at the start
	let pre_eq_arr = this.val.slice(0, eq_pos);
	let first = pre_eq_arr.shift();
	return (typeof first === "string" && first.match(/^[_a-zA-Z]$/));
}
get assignmentParts(){//«
//const ASSIGN_RE = /^([_a-zA-Z][_a-zA-Z0-9]*(\[[_a-zA-Z0-9]+\])?)=(.*)/;
	let eq_pos = this.val.indexOf("=");
	if (eq_pos <= 0) return false;//-1 means no '=' and 0 means it is at the start
	let pre_eq_arr = this.val.slice(0, eq_pos);
	let first = pre_eq_arr.shift();
	if (!(typeof first === "string" && first.match(/^[_a-zA-Z]$/))) return null;
	let assign_word = first;

	for (let ch of pre_eq_arr){
		if (!(typeof ch === "string" && ch.match(/^[_a-zA-Z0-9]$/))) return null;
		assign_word+=ch;
	}
	return [assign_word, eq_pos+1];
}//»
get isWord(){return true;}
dup(){//«
	let word = new Word(this.start, this.par, this.env);
	let arr = word.val;
	for (let ent of this.val){
		if (isStr(ent)) arr.push(ent);
		else arr.push(ent.dup());
	}
	return word;
}//»
toString(){/*«*/
//We actually need to do field splitting instead of doing this...
//log("TOSTRING!!!", this.val.join(""));
//log(this.fields);
//If only 0 or 1 fields, there will be no newlines
//if (this.fields)
//return this.fields.join("\n");
return this.val.join("");
}/*»*/
get isChars(){/*«*/
	let chars = this.val;
	for (let ch of chars) {
		if (!isStr(ch)) return false;
	}
	return true;
}/*»*/
}//»
const SQuote = class extends Sequence{/*«*/
	expand(){
		return this.toString();
	}
	dup(){
		return this;
	}
	toString(){
		return this.val.join("");
	}
}/*»*/
const DSQuote = class extends Sequence{/*«*/
expand(){
//cwarn("EXPAND DSQUOTE!");
let wrd = this.val;
if (!wrd){
cwarn("WHAT THE HELL IS HERE????");
log(tok);
return tok;
}
let arr = wrd;
let out = [];
for (let i=0; i < arr.length; i++){/*«*/
	let ch = arr[i];
	let next = arr[i+1];
	if (ch.escaped){
	let c;
//switch(ch){/*«*/
//\" yields a <quotation-mark> (double-quote) character, but note that
//<quotation-mark> can be included unescaped.
if  (ch=='"') {c='"';}
//\' yields an <apostrophe> (single-quote) character.
//else if (ch=="'") { c="'";}

//\\ yields a <backslash> character.
else if (ch=='\\') { c='\\';}

//\a yields an <alert> character.
else if (ch=='a') { c='\x07';}

//\b yields a <backspace> character.
else if (ch=='b') { c='\x08';}

//\e yields an <ESC> character.
else if (ch=='e') { c='\x1b';}

//\f yields a <form-feed> character.
else if (ch=='f') { c='\x0c';}

//\n yields a <newline> character.
else if (ch=='n') { c='\n';}

//\r yields a <carriage-return> character.
else if (ch=='r') { c='\x0d';}

//\t yields a <tab> character.
else if (ch=='t') { c='\t';}

//\v yields a <vertical-tab> character.
else if (ch=='v') { c='\x0b';}

else if (ch=='x'){/*«*/
//\xXX yields the byte whose value is the hexadecimal value XX (one or more hexadecimal digits). If more than two hexadecimal digits follow \x, the results are unspecified.
	if (next&&next.match(/[0-9a-fA-F]/)){
	let next2 = arr[i+2];
		if (next2 &&next2.match(/[0-9a-fA-F]/)){
			c = eval( '"\\x' + next + next2 + '"' );
			i+=2;
		}
		else{
			c = eval( '"\\x0' + next + '"' );
			i++;
		}
	}
}/*»*/

//\ddd yields the byte whose value is the octal value ddd (one to three octal digits).
else if(ch=="0"|| ch=="1"|| ch=="2"|| ch=="3"|| ch=="4"|| ch=="5"|| ch=="6"|| ch=="7"){/*«*/
	let s = ch;
//Array.includes tests for strict equality, so escaped chars will not match...
	if (next&&OCTAL_CHARS.includes(next)){
		s+=next;
		let next2 = arr[i+2];
		if (next2&&OCTAL_CHARS.includes(next2)){
			s+=next2;
			i+=2;
		}
		else i++;
		c = eval( '"\\x' + (parseInt(s, 8).toString(16).padStart(2, "0")) + '"' );
	}
}/*»*/

//The behavior of an unescaped <backslash> immediately followed by any other
//character, including <newline>, is unspecified.

//\cX yields the control character listed in the Value column of Values for
//cpio c_mode Field in the OPERANDS section of the stty utility when X is one
//of the characters listed in the ^c column of the same table, except that \c\\
//yields the <FS> control character since the <backslash> character has to be
//escaped.

//}/*»*/
	if (c) out.push(c);
	else out.push(ch);
	}
	else{
		out.push(ch);
	}
}/*»*/
this.val = out;
//log("OUT",out.join(""));
return out.join("");
}

dup(){
	return this;
}
toString(){
return this.val.join("");
}
}/*»*/

const DQuote = class extends Sequence{//«

dup(){//«
	let dq = new DQuote(this.start, this.par, this.env);
	let arr = dq.val;
	for (let ent of this.val){
		if (isStr(ent)) arr.push(ent);
		else arr.push(ent.dup());
	}
	return dq;
}//»
async expand(shell, term){//This returns a string (with possible embedded newlines)«

let out = [];
let curword="";
let vals = this.val;
for (let ent of vals){
	if (ent.expand){//This cannot be another DQuote
		if (curword){
			out.push(curword);
			curword="";
		}
		out.push(await ent.expand(shell, term));
	}
	else if (!isStr(ent)){
cwarn("HERE IS ENT!!!!");
log(ent);
throw new Error("WWWWWTFFFFF IS ENT!?!?!");
	}
	else{
		curword+=ent.toString();
	}
}
if (curword) out.push(curword);

return out.join("\n");

}//»

}//»

const BQuote = class extends Sequence{//«
//Collect everything in a string...
expand(shell, term){
	return expand_comsub(this, shell, term);
}
dup(){//«
	let bq = new BQuote(this.start, this.par, this.env);
	let arr = bq.val;
	for (let ent of this.val){
		if (isStr(ent)) arr.push(ent);
		else arr.push(ent.dup());
	}
	return bq;
}//»

}//»
const ParamSub = class extends Sequence{//«
expand(shell, term){
cwarn("EXPAND PARAMSUB!!!");
}
dup(){//«
	let param = new ParamSub(this.start, this.par, this.env);
	let arr = param.val;
	for (let ent of this.val){
		if (isStr(ent)) arr.push(ent);
		else arr.push(ent.dup());
	}
	return param;
}//»
}//»
const ComSub = class extends Sequence{//«
expand(shell, term){
	return expand_comsub(this, shell, term);
}
dup(){//«
	let com = new ComSub(this.start, this.par, this.env);
	let arr = com.val;
	for (let ent of this.val){
		if (isStr(ent)) arr.push(ent);
		else arr.push(ent.dup());
	}
	return com;
}//»
}//»
const MathSub = class extends Sequence{//«

async expand(shell, term){//«
//Need to turn everything into a string that gets sent through math.eval()
	const err = term.resperr;
	if (!await util.loadMod("util.math")) {
		err("could not load the math module");
		return "";
	}
	let s='';
	let vals = this.val;
	for (let ent of vals){
		if (ent.expand) s+=await ent.expand(shell, term);
		else s+=ent.toString();
	}

	let math = new NS.mods["util.math"]();
	try{
		return math.eval(s)+"";
	}
	catch(e){
		err(e.message);
		return "";
	}
}//»
dup(){//«
	let math = new MathSub(this.start, this.par, this.env);
	let arr = math.val;
	for (let ent of this.val){
		if (isStr(ent)) arr.push(ent);
		else arr.push(ent.dup());
	}
	return math;
}//»

}//»

/*»*/
/*«Expansions*/

const isNLs=val=>{return val instanceof Newlines;};

const expand_comsub=async(tok, shell, term)=>{//«
	const err = term.resperr;
	let s='';
	let vals = tok.val;
	for (let ent of vals){
		if (ent.expand) {
			if (ent instanceof DQuote){
/*Amazingly, having internal newline characters works here because they
are treated like any other character inside of scanQuote()
@DJJUTILJJ is where all the "others" characters (including newlines, "\n") are 
pushed into the quote's characters.
*/
				s+='"'+(await ent.expand(shell, term))+'"';
			}
			else if (ent instanceof DSQuote){
//Don't need to wrap it in $'...' again if we are actuall expanding it
//				s+="'"+(await ent.expand(shell, term))+"'";

//Otherwise, wrap it up like we found it...
				s+="$'"+(ent.toString())+"'";
			}
			else {
				if (ent instanceof SQuote) {
					s+="'"+ent.toString()+"'";
				}
				else s+=(await ent.expand(shell, term)).split("\n").join(" ");
			}
		}
		else {
			if (ent instanceof SQuote){
				s+="'"+ent.toString()+"'";
			}
			else {
				 s+=ent.toString();
			}
		}
	}
	let sub_lines = [];
	try{
//cwarn(`COMSUB <${s}>`);
		await shell.execute(s, {subLines: sub_lines, env: tok.env});
		return sub_lines.join("\n");
	}
	catch(e){
cerr(e);
		err(e.message);
		return "";
	}
};//»

const curly_expansion = (tok, from_pos) => {//«

const arr = tok.val;
let ind1 = arr.indexOf("{", from_pos);
let ind2 = arr.lastIndexOf("}");

if (ind1 >= 0 && ind2 > ind1) {//«
//We know these aren't escaped, but they *might* be inside of quotes
let qtyp=null;
let curly_arr;
let start_i;
let final_i;
let have_comma = false;
let have_dot = false;
let have_quote = false;
let have_escape = false;
let comma_arr;
let num_open_curlies = 0;
for (let i=from_pos; i < arr.length; i++){//«

let ch = arr[i];
if (!qtyp){//«
	if (["'",'"','`'].includes(ch)) {
		qtyp = ch;
		have_quote = true;
	}
	else if (ch==="{" && (i===0 || arr[i-1] !== "$")){
		num_open_curlies++;
		if (num_open_curlies === 1 && !curly_arr) {
			start_i = i;
			curly_arr = [];
			continue;
		}
	}
	else if (ch==="}"){
		num_open_curlies--;
		if (num_open_curlies === 0 && curly_arr){
			final_i =  i;
			break;
		}
	}
}//»
else if (qtyp===ch) qtyp=null;

if (curly_arr) {//«
	if (!qtyp){
		if (ch===",") {
			have_comma = true;
			if (num_open_curlies===1){
				if (!comma_arr) comma_arr = [];
				comma_arr.push([...curly_arr]);
				curly_arr = [];
				continue;
			}
		}
		else {
			if (!have_dot) have_dot = ch === ".";
			if (!have_escape) have_escape = ch.escaped;
		}
	}
	curly_arr.push(ch);
}//»

}//»

if (comma_arr){
	comma_arr.push([...curly_arr]);
}

if (!final_i){//«
	if (Number.isFinite(start_i)){
		if (start_i+2 < arr.length){
			return curly_expansion(tok, start_i+1);
		}
		else{
//cwarn("GIVING UP!");
		}
	}
	else{
//log("NOT OPENED");
	}
	return tok;
}//»
else{//«

let pre = arr.slice(0, start_i);
let post = arr.slice(final_i+1);
if (comma_arr){//«
	let words=[];
	for (let comarr of comma_arr){
		let _word = new Word(tok.start, tok.par, tok.env);
		let word = _word.val;
		for (let ent of pre){
			if (isStr(ent)) word.push(ent);
			else word.push(ent.dup());
		}
		for (let ent of comarr){
			if (isStr(ent)) word.push(ent);
			else word.push(ent.dup());
		}
		for (let ent of post){
			if (isStr(ent)) word.push(ent);
			else word.push(ent.dup());
		}
		words.push(_word);
	}

	return words;
}//»
else if (have_dot&&!have_quote&&!have_escape){//«
//The dot pattern is a very strict, very literal pattern
let cstr = curly_arr.join("");
let marr;
let from, to, inc, is_alpha;

let min_wid=0;
if (marr = cstr.match(/^([-+]?\d+)\.\.([-+]?\d+)(\.\.([-+]?\d+))?$/)){//«
//cwarn("NUMS",marr[1], marr[2], marr[4]);

//We're supposed to look for '0' padding on the from/to
	let min_from_wid=0;
	let from_str = marr[1].replace(/^[-+]?/,"");
	if (from_str.match(/^(0+)/)) min_from_wid = from_str.length;

	let min_to_wid=0;
	let to_str = marr[2].replace(/^[-+]?/,"");
	if (to_str.match(/^(0+)/)) min_to_wid = to_str.length;

	if (min_from_wid > min_to_wid) min_wid = min_from_wid;
	else min_wid = min_to_wid;

	from = parseInt(marr[1]);
	to = parseInt(marr[2]);
	inc = marr[4]?parseInt(marr[4]):1;
}
else if (marr = cstr.match(/^([a-z])\.\.([a-z])(\.\.([-+]?\d+))?$/i)){
//cwarn("ALPHA",marr[1], marr[2], marr[4]);
	is_alpha = true;
	from = marr[1].charCodeAt();
	to = marr[2].charCodeAt();
	inc = marr[4]?parseInt(marr[4]):1;
}
else{
	return tok;
}//»

inc = Math.abs(inc);

let vals=[];
let iter=0;
//log(from, to);
if (from > to){
	for (let i=from; i >= to; i-=inc){
	iter++;
	if (iter > 10000) throw new Error("INFINITE LOOP AFTER 10000 iters????");
		if (is_alpha) vals.push(String.fromCharCode(i));
		else vals.push(((i+"").padStart(min_wid, "0")));
	}
}
else {
	for (let i=from; i <= to; i+=inc){
	iter++;
	if (iter > 10000) throw new Error("INFINITE LOOP AFTER 10000 iters????");
		if (is_alpha) vals.push(String.fromCharCode(i));
		else vals.push(((i+"").padStart(min_wid, "0")));
	}
}


let words=[];
for (let val of vals){
	let _word = new Word(tok.start, tok.par, tok.env);
	let word = _word.val;
	for (let ent of pre){
		if (isStr(ent)) word.push(ent);
		else word.push(ent.dup());
	}
	word.push(val);
	for (let ent of post){
		if (isStr(ent)) word.push(ent);
		else word.push(ent.dup());
	}
	words.push(_word);
}

	return words;


}//»
else{
//log("NOTHING");
return tok;
}
}//»

}//»
else{//«
	if (ind1<0 && ind2 < 0) {
//log("NO CURLIES");
	}
	else if (ind1 >= 0 && ind2 >= 0){
//log("BOTH CURLIES DETECTED IN WRONG POSITOIN");
	}
	else if (ind1 >= 0) {
//log("OPEN CURLY ONLY");
	}
	else if (ind2 >= 0){
//log("CLOSE CURLY ONLY");
	}
	return tok;
}//»

}//»
const parameter_expansion = (tok, env, script_name="sh", script_args=[]) => {//«
//We will also need env, script_name, and script_args passed in here
/*«

A "parameter" is a NAME or a SYMBOL, as described below.

We are looking for one of:

$LONGESTNAME, $ONEDIGIT, ${NAME}, ${ONEORMOREDIGITS}, $[@*#?-$!0] or ${[@*#?-$!0]}:
@: positional parameters starting from 1, and something about field splitting
*: Same as above, with something else about field splitting
#: Number of positional parameters (minus the 0th)
?: Most recent exit code
-: Current options flag
$: pid of the shell
!: pid of most recent '&' statement
0: name of shell or shell script

All DIGIT's (other than 0) are the current (1-based) positional parameters

These expands in anything other than single quotes

We can also easily support '${#NAME}', since this just gives the length of the
string of the variable, NAME.

I'm not sure how to handle:
$ DQUOTE='"'
$ echo "$DQUOTE"

Maybe escape all quote substitutions (in double quotes or out), and all redir chars?

»*/
/*«

Should we not put everything inside $'...', and then escape ALL
single quotes that are in the replacement value??? Otherwise, there can't be
escaped single quotes inside of pure single quotes: '\'' (doesn't work!)

So, if we do:
PARAM_WITH_SINGLE_QUOTES="...'//..."

echo BLAH${PARAM_WITH_SINGLE_QUOTES}BLAH
=> BLAH$'...\'//...'BLAH

»*/
let word = tok.val;
let qtyp;
OUTER_LOOP: for (let i=0; i < word.length; i++){

let ch = word[i];
if (!qtyp){
	if (["'",'"','`'].includes(ch)) {
		qtyp = ch;
		continue;
	}
	else{
//Unquoted stuff
	}
}
else if (qtyp===ch) {
	qtyp=null;
	continue;
}
else if (qtyp!=='"') continue;

//We are unquoted or in double quotes

if (ch==="$"){/*«*/

const do_name_sub=(name)=>{//«

let diff = end_i - start_i;
let val = env[name]||"";
word.splice(start_i, end_i-start_i+1, ...val);
i = end_i - diff;

};//»
const do_arg_sub=(num)=>{//«
let diff = end_i - start_i;
let val = script_args[num]||"";
word.splice(start_i, end_i-start_i+1, ...val);
i = end_i - diff;
};//»
const do_sym_sub=(sym)=>{//«
let diff = end_i - start_i;
let val;
//const SPECIAL_SYMBOLS=[ "@","*","#","?","-","$","!","0" ];
switch(sym){
	case "0": val = script_name; break;
	case "#": val = script_args.length+""; break;
	case "*":
	case "@":
		val = script_args.join(" ");
		break;
	case "?": val = last_exit_code+""; break;
	default: val = "$"+sym;
}
word.splice(start_i, end_i-start_i+1, ...val);
i = end_i - diff;

};/*»*/
const BADSUB=(arg, next)=>{return `bad/unsupported substitution: stopped at '\${${arg}${next?next:"<END>"}'`;}

	let next = word[i+1];
	if (!next) continue;
	let start_i = i;
	let end_i;
	if (next==="{") {/*«*/
		i++;
//If no next one or the next one is a "}", barf INVSUB
//If the next one is a special symbol, there must be a "}" immediately following it
//If the next one is a digit, there must be 0 or more digits (maybe "0") followed by the "}"
//Otherwise, the next one must be a START_NAME_CHARS, followed by 0 or more 
//    ANY_NAME_CHARS, with a terminating "}".
		next = word[i+1];
		if (!next) return "bad substitution: '${<END>'";
		else if (next==="}") return "bad substitution: '${}'";

		if (SPECIAL_SYMBOLS.includes(next)){/*«*/
			let sym = next;
			i++;
			next = word[i+1];
			if (next !== "}") return BADSUB(sym, next);
			end_i = i+1;
			do_sym_sub(sym);
		}/*»*/
		else if (DIGIT_CHARS_1_to_9.includes(next)){/*«*/
			let numstr=next;
			i++;
			next = word[i+1];
			while(true){
				if (next==="}"){
				//Do a parseInt on numstr, and if in a script, replace with: script_arg[num-1]
		//cwarn("Substitute script_arg #", argnum);
		//			end_i = i;
					end_i = i+1;
					do_arg_sub(parseInt(numstr)-1);
					break;
				}
				if (!ANY_DIGIT_CHARS.includes(next)){
		//			return `bad substitution: have '\${${numstr}${next?next:"<END>"}'`;
					return BADSUB(numstr, next);
				}
				numstr+=next;
				i++;
				next = word[i+1];
			}
		}/*»*/
		else if (START_NAME_CHARS.includes(next)){/*«*/

		let namestr=next;
		i++;
		next = word[i+1];
		while(true){
			if (next==="}"){
				end_i = i+1;
				do_name_sub(namestr);
				continue OUTER_LOOP;
			}
			if (!ANY_NAME_CHARS.includes(next)){
				return BADSUB(namestr, next);
			}
			namestr+=next;
			i++;
			next = word[i+1];
		}

		}/*»*/
		else return INVSUB;

	}/*»*/
	else{/*«*/
//If the next one is a special symbol (including "0"), we can do the substitution now«
//Else if the next is one of DIGIT_CHARS "1"->"9", we can do the substitution noe
//Else if the next isn't a START_NAME_CHARS, we continue and keep this a 
//  literal '$'
//Else we look at every succeeding char, and do the sub on the first non-ANY_NAME_CHARS.

//		i++;
//		next = word[i+1];»

if (SPECIAL_SYMBOLS.includes(next)){
	end_i = i+1;
	do_sym_sub(next);
}
else if (DIGIT_CHARS_1_to_9.includes(next)){
	end_i = i+1;
	do_arg_sub(parseInt(next)-1);
}
else if (!START_NAME_CHARS.includes(next)){
	continue;
}
else{/*«*/

let namestr=next;
i++;
next = word[i+1];
while(true){
	if (!ANY_NAME_CHARS.includes(next)){
		end_i=i;
		do_name_sub(namestr);
		continue OUTER_LOOP;
	}
	namestr+=next;
	i++;
	next = word[i+1];
}

}/*»*/

	}/*»*/

}/*»*/

}

return tok;
};/*»*/
const quote_removal=(tok)=>{//«
	let s='';
	let qtyp;
	let arr = tok.val;
	for (let l=0; l < arr.length; l++){
		let c = arr[l];
		if (c==='"'||c==="'") {
			if (c===qtyp){
				qtyp=null;
				continue;
			}
			else if (!qtyp){
				qtyp = c;
				continue;
			}
		}
		s+=c.toString();
	}
	tok.val = [...s];
//	return s;
};/*»*/
const filepath_expansion=async(tok, cur_dir)=>{//«
/*«
First we need to separate everything by "/" (escapes or quotes don't matter)


Create a pattern string by removing quotes. 

- For every non-escaped ".", "*", "?", "[" or "]" in quotes, put an escape before it. 

- For every non-escaped '.', put an escape before it.
- For every non-escaped '*', put a '.' before it.
- For every non-escaped '?', replace it with a "."

//											  v----REMOVE THIS SPACE!!!!
let fpat = nm.replace(/\./g,"\\.").replace(/\* /g, ".*").replace(/\?/g, ".");

»*/
let arr = tok.val;
if (!(arr.includes("*")||arr.includes("?")||arr.includes("["))) return tok;
//log(tok);
//log(arr);
let patstr='';
let parr;
let qtyp;
let path_arr=[];

for (let ch of arr){//«
//log(ch);
if (ch=="/"){
	path_arr.push(patstr);
	patstr='';
	continue;
}
if (ch==="'"||ch==='"'){
	if (!qtyp) qtyp = ch;
	else if (qtyp===ch) qtyp=null;
	else patstr+=ch;
	continue;
}
else if (qtyp){
	if ([".", "*","?","[","]"].includes(ch)) patstr+="\\";
	patstr+=ch;
}
else if (ch==="."){
	patstr+='\\.';
}
else if (ch==="*"){
	patstr+='.*';
}
else if (ch==="?"){
	patstr+='.';
}
else {
	if (ch instanceof String){
		patstr+=ch.toString();
	}
	else patstr+=ch;
}

}//»

if (patstr){
	path_arr.push(patstr);
}
let start_dir;
let parr0 = path_arr[0];
let path_len = path_arr.length;
if (!parr0) start_dir = "/";
else start_dir = cur_dir;
let dirs=[""];
const do_dirs=async(dirs, parr, is_init)=>{//«

let nm = parr.shift();
let parr_len = parr.length;
if (!nm) {
	for (let i=0; i < dirs.length; i++){
		dirs[i]=dirs[i]+"/";
	}
	if (!parr_len) return dirs;
	return await do_dirs(dirs, parr);
}
let is_dot = (nm[0]==="\\"&&nm[1]===".");
let files_ok = !parr.length;
let new_paths=[];
for (let i=0; i < dirs.length; i++){
	let dirname = dirs[i];
//log("DIRNAME", dirname);
	let dir_str = start_dir+"/"+dirname;
	let dir = await pathToNode(dir_str);
	let kids = dir.kids;
	if (!kids) continue;
	let keys = Object.keys(kids);
	if (nm.match(/[*?]/)||nm.match(/\[[-0-9a-z]+\]/i)) {
//													  v----REMOVE THIS SPACE
//		let fpat = nm.replace(/\./g,"\\.").replace(/\* /g, ".*").replace(/\?/g, ".");
		try{ 
			let re = new RegExp("^" + nm + "$");
			for (let key of keys){
				if (!is_dot && key[0]===".") continue;
				if (re.test(key)){
					let node = kids[key];
					if (!node) continue;
					if (!files_ok && node.appName!==FOLDER_APP) continue;
//					if (key==="."||key==="..") continue;
					if (dirname) new_paths.push(`${dirname}/${key}`);
					else new_paths.push(key);
				}
			}
		}
		catch(e){
cerr(e);
			continue;
		}
	}
	else{
		let node = kids[nm];
		if (!node) continue;
		if (!files_ok && node.appName!==FOLDER_APP) continue;
		if (nm==="."||nm==="..") continue;
		if (dirname) new_paths.push(`${dirname}/${nm}`);
		else new_paths.push(nm);
//		new_paths.push(`${dirname}/${nm}`);
	}
}
if (!parr_len) return new_paths;
return await do_dirs(new_paths, parr);

};//»
let rv = await do_dirs(dirs, path_arr, true);
if (rv.length) {
let words = [];
let {start, par, env}=tok;
for (let val of rv){
let word = new Word(start, par, env);
word.val=[...val];
words.push(word);
}
//log(words);
return words;
}
return tok;
};/*»*/
const get_stdin_lines = async(in_redir, term, haveSubLines) => {//«
//const get_stdin_lines = async(in_redir, term, heredocScanner, haveSubLines) => {
let stdin;
let red = in_redir[0];
let val = in_redir[1];
if (red==="<"){
	let node = await val.toNode(term);
	if (!node) {
		return `${val}: no such file or directory`;
	}
	if (!node.isFile){
		return `${val}: not a regular file`;
	}
	let rv = await node.text;
	if (!isStr(rv)){
		return `${val}: an invalid value was returned`;
	}
	stdin = rv.split("\n");
}
else if (red==="<<<"){
	stdin = [val];
}
else if (red==="<<"){
/*
	if (!heredocScanner){
		if (haveSubLines){
			return "heredocs are not implemented within command substititions";
		}
		else{
			return "no 'heredocScanner' was found! (this error should not exist djkljk*&*[}#$JKF)";
		}
	}
*/
	return val.split("\n");
}
return stdin;
}/*»*/
/*»*/

return function(term){//«

//Var«
const shell = this;

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
this.cancelled = false;

//»

this.execute=async(command_str, opts={})=>{//«

//Init/Var
const terr=(arg, code)=>{//«
	term.response(arg, {isErr: true});
//	if (!scriptOut) term.response_end();
	if (!no_end) term.response_end();
	last_exit_code = code||E_ERR;
	return last_exit_code;
};//»
const can=()=>{//«
//Cancel test function
	return started_time < this.cancelled_time;
};//»
//WIMNNUYDKL
//«
let started_time = (new Date).getTime();

//let {scriptOut, scriptArgs, scriptName, subLines, script_args, script_name, env}=opts;
let {scriptOut, scriptArgs, scriptName, subLines, heredocScanner, env, isInteractive}=opts;
//let {scriptOut, subLines, env}=opts;
let rv;
let is_top_level = !(scriptOut||subLines);
let heredocs;
let no_end = !is_top_level;

command_str = command_str.replace(/^ +/,"");

let statements;
try{
	statements = await Parser.parse(command_str, {env, terminal: term, isInteractive, heredocScanner});
}
catch(e){
	return terr("sh: "+e.message);
}
if (isStr(statements)) return terr("sh: "+statements);

let lastcomcode;
//»

//A 'statement' is a list of boolean-separated pipelines.
STATEMENT_LOOP: for (let state of statements){//«

let loglist = state.statement;
if (!loglist){
	return terr(`sh: logic list not found!`);
}

LOGLIST_LOOP: for (let i=0; i < loglist.length; i++){//«
	let pipe = loglist[i];
	let pipelist = pipe.pipe;
	if (!pipelist){
		return terr(`pipeline list not found!`);
	}

	let pipetype = pipe.type;
	let pipeline = [];
	let screen_grab_com;

	for (let j=0; j < pipelist.length; j++) {//«
		let arr = pipelist[j].com;
{
	let arr0=arr[0];
	if (arr0 && arr0.hasBang){
		pipeline._hasBang = true;
	}
}
		let pipeFrom = j > 0;
		let pipeTo = j < pipelist.length-1;
		let args=[];
		let comobj, usecomword;
//		let redir;
		let in_redir, out_redir;

/*Expansions*/
//For each word within a command, the shell processes <backslash>-escape
//sequences inside dollar-single-quotes (See 2.2.4 Dollar-Single-Quotes)
for (let k=0; k < arr.length; k++){
	let tok = arr[k];
	if (tok instanceof Word){
		tok.dsSQuoteExpansion();
	}
}
//Expansions (Doc)«

//and then performs various word expansions (see 2.6 Word Expansions ). 
/*2.6 Word Expansions

This section describes the various expansions that are performed on words. Not
all expansions are performed on every word, as explained in the following
sections and elsewhere in this chapter. The expansions that are performed for a
given word shall be performed in the following order:

1) Tilde expansion (see 2.6.1 Tilde Expansion ), parameter expansion (see 2.6.2
Parameter Expansion ), command substitution (see 2.6.3 Command Substitution ),
and arithmetic expansion (see 2.6.4 Arithmetic Expansion ) shall be performed,
beginning to end. See item 5 in 2.3 Token Recognition .

2) Field splitting (see 2.6.5 Field Splitting ) shall be performed on the portions
of the fields generated by step 1.

3) Pathname expansion (see 2.6.6 Pathname Expansion ) shall be performed, unless
set -f is in effect.

4) Quote removal (see 2.6.7 Quote Removal ), if performed, shall always be
performed last.

Tilde expansions, parameter expansions, command substitutions, arithmetic
expansions, and quote removals that occur within a single word shall expand to
a single field, except as described below. The shell shall create multiple
fields or no fields from a single word only as a result of field splitting,
pathname expansion, or the following cases:

1) Parameter expansion of the special parameters '@' and '*', as described in
2.5.2 Special Parameters , can create multiple fields or no fields from a
single word.

2) When the expansion occurs in a context where field splitting will be performed,
a word that contains all of the following somewhere within it, before any
expansions are applied, in the order specified:

	a) an unquoted <left-curly-bracket> ('{') that is not immediately preceded by an
	unquoted <dollar-sign> ('$')

	b) one or more unquoted <comma> (',') characters or a sequence that consists of
	two adjacent <period> ('.') characters surrounded by other characters (which
	can also be <period> characters)

	c) an unquoted <right-curly-bracket> ('}')

may be subject to an additional implementation-defined form of expansion that
can create multiple fields from a single word. This expansion, if supported,
shall be applied before all the other word expansions are applied. The other
expansions shall then be applied to each field that results from this
expansion.

When the expansions in this section are performed other than in the context of
preparing a command for execution, they shall be carried out in the current
shell execution environment.

When expanding words for a command about to be executed, and the word will be
the command name or an argument to the command, the expansions shall be carried
out in the current shell execution environment. (The environment for the
command to be executed is unknown until the command word is known.)

When expanding the words in a command about to be executed that are used with
variable assignments or redirections, it is unspecified whether the expansions
are carried out in the current execution environment or in the environment of
the command about to be executed.

The '$' character is used to introduce parameter expansion, command
substitution, or arithmetic evaluation. If a '$' that is neither within
single-quotes nor escaped by a <backslash> is immediately followed by a
character that is not a <space>, not a <tab>, not a <newline>, and is not one
of the following:

- A numeric character
- The name of one of the special parameters (see 2.5.2 Special Parameters )
- A valid first character of a variable name
- A <left-curly-bracket> ('{')
- A <left-parenthesis>
- A single-quote

the result is unspecified. If a '$' that is neither within single-quotes nor
escaped by a <backslash> is immediately followed by a <space>, <tab>, or a
<newline>, or is not followed by any character, the '$' shall be treated as a
literal character.

*/
/*When we find a: 
1) '{' ? "," ? '}' (ignore embedded curlies or give a syntax error)
2) '{' \d .. \d '}'
3) '{' \[a-z] .. \[a-z] '}'
3) '{' \[A-Z] .. \[A-Z] '}'

Skip over quotes to look for unescaped '{' followed by the closest unescaped '}'
Collect everything inside.
If there is a strict '..' pattern, use it
Else if there is an internal unquoted (unescaped) comma, use it
Else, let it pass through

*/
//»

for (let k=0; k < arr.length; k++){//curlies«
let tok = arr[k];
if (tok.isWord) {
	let rv = curly_expansion(tok, 0);
	if (rv !== tok){
		arr.splice(k, 1, ...rv);
		k--;//Need to revisit the original position, in case there are more expansions there
	}
}
}//»
for (let k=0; k < arr.length; k++){//tilde«
	let tok = arr[k];
	if (tok instanceof Word) tok.tildeExpansion();
}//»
for (let k=0; k < arr.length; k++){//redirs«
	let tok = arr[k];
	let typ = tok.type;
	let val = tok[typ];
	if (typ==="r_op"){
		let rop = tok.r_op;
		if (!OK_REDIR_TOKS.includes(rop)) {
			return terr(`sh: unsupported operator: '${tok.r_op}'`);
		}
		if (rop==="<<"||rop=="<<-"){
			arr.splice(k, 1);
			k--;
			val=null;
			in_redir = [rop, tok.value];
			continue;
		}
		let tok2 = arr[k+1];
		if (!tok2) return terr("sh: syntax error near unexpected token `newline'");
		if (!(tok2 instanceof Word)) return terr(`sh: invalid or missing redirection operand`);
		arr.splice(k, 2);
		k-=2;
		val = null;
		if (OK_OUT_REDIR_TOKS.includes(rop)) out_redir = [tok.r_op, tok2.toString()];
		else if (OK_IN_REDIR_TOKS.includes(rop)) in_redir = [tok.r_op, tok2.toString()];
		else return terr(`sh: unsupported operator: '${rop}'`);
	}
}//»
for (let k=0; k < arr.length; k++){//parameters«

let tok = arr[k];
if (tok.isWord) {
	let rv = parameter_expansion(tok, env, scriptName, scriptArgs);
	if (isStr(rv)) return terr(`sh: ${rv}`);
}

}//»
for (let k=0; k < arr.length; k++){//command sub«
	let tok = arr[k];
	if (tok.isWord) {
		await tok.expandSubs(this, term);
	}
}//»
for (let k=0; k < arr.length; k++){//field splitting«
	let tok = arr[k];
	if (tok.isWord) {
		let{start, par, env} = tok;
		let words = [];
		for (let field of tok.fields){
			let word = new Word(start, par, env);
			word.val = [...field];
			words.push(word);
		}
		arr.splice(k, 1, ...words);
		k+=words.length-1;
	}
}//»
for (let k=0; k < arr.length; k++){//filepath expansion/glob patterns«

let tok = arr[k];
if (tok.isWord) {
	let rv = await filepath_expansion(tok, term.cur_dir);
	if (isStr(rv)){
		term.response(rv, {isErr: true});
		continue;
	}
	if (rv !== tok){
		arr.splice(k, 1, ...rv);
//		k--;//Need to revisit the original position, in case there are more expansions there
	}
}

}//»
for (let k=0; k < arr.length; k++){//quote removal«
	let tok = arr[k];
	if (tok.isWord) {
		quote_removal(tok);
	}
}//»


//Set environment variables (exports to terminal's environment if there is nothing left)
		let rv = add_to_env(arr, env, {term});
		if (rv.length) term.response(rv, {isErr: true});

//Command response callbacks

//Everything that gets sent to redirects, pipes, and script output must be collected
//By default, only the 'out' stream will be collected.

const out_cb = (val, opts={})=>{//«

if (this.cancelled) return;

let redir_lns = comobj.redirLines;
//EOF is not meaningful at the end of a pipeline
//log(val);
if (isEOF(val) || (!redir_lns && pipeTo)){
    let next_com = pipeline[j+1];
    if (next_com && next_com.pipeIn && !next_com.noPipe) {
		next_com.pipeIn(val);
	}
    return;
}
//WLKUIYDP
if (redir_lns) {
//KIUREUN
	if (val instanceof Uint8Array){
		if (!redir_lns.length) {
			redir_lns = val;
		}
		else {
			let hold = redir_lns;
			redir_lns = new Uint8Array(hold.length + val.length);
			redir_lns.set(hold, 0);
			redir_lns.set(val, hold.length);
		}
		comobj.redirLines = redir_lns;
		return;
	}
	redir_lns.push(val);
	return;
}
if (scriptOut) return scriptOut(val);

//Save to subLines and call scriptOut
if (subLines){
	if (val instanceof Uint8Array) val = `Uint8Array(${val.length})`;
//	subLines.push(...val);
	subLines.push(val);
	return;
}

//MDKLIOUTYH
term.response(val, opts);
term.scroll_into_view();
term.refresh();

};//»
const err_cb=(str)=>{//«
if (this.cancelled) return;
term.response(str, {isErr: true});
term.scroll_into_view();
term.refresh();

};//»
const suc_cb=(str)=>{//«
if (this.cancelled) return;
term.response(str, {isSuc: true});
term.scroll_into_view();
term.refresh();
};//»
const wrn_cb=(str)=>{//«
if (this.cancelled) return;
term.response(str, {isWrn: true});
term.scroll_into_view();
term.refresh();
};//»
const inf_cb=(str)=>{//«
if (this.cancelled) return;
term.response(str, {isInf: true});
term.scroll_into_view();
term.refresh();
};//»


const com_env = {/*«*/
//	redir,
	in_redir,
	out_redir,
	isSub: !!subLines,
	scriptOut,
//	stdin,
	pipeTo,
	pipeFrom,
	term,
	env,
//	opts,
	command_str,
	out: out_cb,
	err: err_cb,
	suc: suc_cb,
	wrn: wrn_cb,
	inf: inf_cb,
}/*»*/
//XXXXXXXXXXXX
		let comword = arr.shift();
		if (!comword) {
			pipeline.push(new NoCom());
			continue;
		}
		{
			let hold = arr;
			arr = [];
			for (let arg of hold) arr.push(arg.toString());
		}
//Replace with an alias if we can«
		let alias = ALIASES[comword];
		if (alias){
//This should allow aliases that expand with options...
			let ar = alias.split(/\x20+/);
			alias = ar.shift();
			if (ar.length){
				arr.unshift(...ar);
			}
		}//»

		usecomword = alias||comword;
		if (usecomword=="exit"){//«
//			if (!scriptOut){
			if (is_top_level){
				term.response("sh: not exiting the toplevel shell", {isWrn: true});
				break STATEMENT_LOOP;
			}
			let numstr = arr.shift();
			let code;
			if (numstr){
				if (!numstr.match(/^-?[0-9]+$/)) term.response("sh: exit: numeric argument required", {isErr: true});
				else code = parseInt(numstr);
			}
			else if (arr.length) {
				term.response("sh: exit: too many arguments", {isErr: true});
			}
			if (!Number.isFinite(code)) code = E_ERR;
			code = new Number(code);
			code.isExit = true;
			return code;
		}//»
		let com = Shell.activeCommands[usecomword];
		if (isStr(com)){//QKIUTOPLK«
//If we have a string rather than a function, do the command library importing routine.
//The string is always the name of the library (rather than the command)
//This happens when: 
//1) libraries are defined in PRELOAD_LIBS, and 
//2) this is the first invocation of a command from one of those libraries.
			try{
				await import_coms(com);//com is the library name
				if (this.cancelled) return;
			}catch(e){
				if (this.cancelled) return;
cerr(e);
				terr(`sh: command library: '${com}' could not be loaded`);
				return;
			}
			let gotcom = Shell.activeCommands[usecomword];
			if (!(gotcom instanceof Function)){
				terr(`sh: '${usecomword}' is invalid or missing in command library: '${com}'`);
				return;
			}
			com = gotcom;
		}//»
		if (!com) {//Command not found!«
//If the user attempts to use, e.g. 'if', let them know that this isn't that kind of shell

//Need to do this for matching stuff
			comword = comword.toString();
			if (CONTROL_WORDS.includes(comword)){
				terr(`sh: ${comword}: control structures are not implemented`);
				return;
			}

//It doesn't look like a file.
//EOPIUYTLM
			if (!comword.match(/\x2f/)) {
//WPRLKUT
				pipeline.push(make_sh_error_com(comword, `command not found`, com_env));
				last_exit_code = E_ERR;
				continue;
			}

			let node = await fsapi.pathToNode(normPath(comword, term.cur_dir));
			if (!node) {
				pipeline.push(make_sh_error_com(comword, `file not found`, com_env));
				last_exit_code = E_ERR;
				continue;
			}
			let app = node.appName;
			if (app===FOLDER_APP) {
				pipeline.push(make_sh_error_com(comword, `is a directory`, com_env));
				last_exit_code = E_ERR;
				continue;
			}
			if (app!==TEXT_EDITOR_APP) {
				pipeline.push(make_sh_error_com(comword, `not a text file`, com_env));
				last_exit_code = E_ERR;
				continue;
			}
			if (!comword.match(/\.sh$/i)){
				pipeline.push(make_sh_error_com(comword, `only executing files with '.sh' extension`, com_env));
				last_exit_code = E_ERR;
				continue;
			}
			let text = await node.text;
			if (!text) {
				pipeline.push(make_sh_error_com(comword, `no text returned`, com_env));
				last_exit_code = E_ERR;
				continue;
			}
			comobj = new ScriptCom(this, comword, text, arr, com_env);
			pipeline.push(comobj);
			continue;
		}//»
		if (screen_grab_com && com.grabsScreen){/*«*/
			pipeline.push(make_sh_error_com(comword, `the screen has already been grabbed by: ${screen_grab_com}`, com_env));
			last_exit_code = E_ERR;
			continue;
		}/*»*/
		screen_grab_com = com.grabsScreen?comword: false;
		let opts;
		let gotopts = Shell.activeOptions[usecomword];
//Parse the options and fail if there is an error message
		rv = get_options(arr, usecomword, gotopts);
		if (rv[1]&&rv[1][0]) {
			term.response(rv[1][0], {isErr: true});
			last_exit_code = E_ERR;
			continue;
		}
		opts = rv[0];

		let stdin;
		if (in_redir) {/*«*/
//The only point for a heredocScanner is during tokenization while in interactive mode
//So there is NO POINT for it here!!!
//			stdin = await get_stdin_lines(in_redir, term, heredocScanner, !!subLines);
			stdin = await get_stdin_lines(in_redir, term, !!subLines);
			if (isStr(stdin)){
				pipeline.push(make_sh_error_com(comword, stdin, com_env));
				last_exit_code = E_ERR;
				continue;
			}
			else if (!isArr(stdin)){
				pipeline.push(make_sh_error_com(comword, "an invalid value was returned from get_stdin_lines (see console)", com_env));
cwarn("Here is the non-array value");
log(stdin);
				last_exit_code = E_ERR;
				continue;
			}
			com_env.stdin = stdin;
		}/*»*/

		try{//«new Com
			comobj = new com(usecomword, arr, opts, com_env);
			pipeline.push(comobj);
		}
		catch(e){
cerr(e);
//VKJEOKJ
//As of 11/26/24 This should be a 'com is not a constructor' error for commands
//that have not migrated to the new 'class extends Com{...}' format
			pipeline.push(make_sh_error_com(usecomword, e.message, com_env));
		}//»
//SKIOPRHJT
	}//»

this.pipeline = pipeline;

for (let com of pipeline){
	await com.init();
	if (this.cancelled) return;
}
for (let com of pipeline){
	if (!com.killed) com.run();
	else{
log(`Not running (was killed): ${com.name}`);	
	}
}
for (let com of pipeline){/*«*/
	lastcomcode = await com.awaitEnd;

	if (this.cancelled) return;
//	if (!(Number.isFinite(lastcomcode))) {

	if (!(isNum(lastcomcode))) {
//cwarn(`The value returned from '${com.name}' is below`);
//log(lastcomcode);
//		if (!lastcomcode) term.response(`sh: a null, undefined, or empty value was returned from '${com.name}' (see console)`, {isErr: true});
//		else term.response(`sh: an invalid value was returned from '${com.name}' (see console)`, {isErr: true});
		lastcomcode = E_ERR;
	}

	if (com.redirLines) {
		let {err} = await write_to_redir(term, com.redirLines, com.out_redir, com.env);
		if (this.cancelled) return;
		if (err) {
			term.response(`sh: ${err}`, {isErr: true});
		}
	}
}/*»*/
if (pipeline._hasBang){
	if (lastcomcode === E_SUC) lastcomcode = E_ERR;
	else lastcomcode = E_SUC;
}
last_exit_code = lastcomcode;

//LEUIKJHX
	if (lastcomcode==E_SUC){//SUCCESS«
		if (pipetype=="||"){
			for (let j=i+1; j < loglist.length; j++){
				if (loglist[j].type=="&&"){
					i=j;
					continue LOGLIST_LOOP;
				}
			}
			break LOGLIST_LOOP;
		}
//		else:
//			1 pipetype=="&&" and we automatically go to the next one or:
//			2 there is no pipetype because we are the last pipeline of this loglist, and the logic of the thing doesn't matter
	}
	else{//FAILURE
		if (pipetype=="&&"){
			for (let j=i+1; j < loglist.length; j++){
				if (loglist[j].type=="||"){
					i=j;
					continue LOGLIST_LOOP;
				}
			}
			break LOGLIST_LOOP;
		}
//		else:
//			1 pipetype=="||" and we automatically go to the next one or:
//			2 there is no pipetype because we are the last pipeline of this loglist, and the logic of the thing doesn't matter
	}//»

}//»

}//»

//In a script, refresh rather than returning to the prompt
if (no_end) {
	term.refresh();
	return lastcomcode;
}

//Command line input returns to prompt
term.response_end();
return lastcomcode;

}//»

this.cancel=()=>{//«
	this.cancelled = true;
	let pipe = this.pipeline;
	if (!pipe) return;
	for (let com of pipe) com.cancel();
};//»

};//»

})();
//»

//Shell«

const Shell = ShellNS.Shell;
Shell.activeCommands = active_commands;
Shell.activeOptions = active_options;

//»

//»

//Terminal«

export const app = function(Win) {

//Var«

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
//		sleeping = false;
		let didone = false;
		let prmpt="> ";
		let rv;
		while (true){
//log("SCAN", eof_tok);
			let rv = await this.read_line(prmpt);
			if (rv===eof_tok) break;
			doc.push(rv);
			didone = true;
		}
//		sleeping = true;
		return doc;
	};
	await cur_shell.execute(str,{env, heredocScanner, isInteractive: true});

//log("RV", rv);

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
const response_end = () => {//«
	if (!did_init) return;

//Why does this line exist???
//	if (pager) return;
	if (is_pager) return;

	do_continue = false;
	set_prompt();
	scroll_into_view();
	sleeping = null;
	bufpos = 0;
	setTimeout(()=>{cur_shell = null;},10);
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
	let {didFmt, colors, pretty, isErr, isSuc, isWrn, isInf} = opts;
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
const handle_enter = async(if_paste)=>{//«
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
//	if (buffer_scroll_num!==null){
//		buffer_scroll_num = null;
//		x = hold_x;
//		y = hold_y;
//		render();
//	}
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
//DEBUG = !DEBUG;
//do_overlay(`Debug: ${DEBUG}`);

}
else if (sym=="s_CA"){
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
	}
	if (admin_mode){
		init_prompt+=`\nAdmin mode: true`;
	}
	if (addMessage) init_prompt = `${addMessage}\n${init_prompt}`;
	let env_file_path = `${this.cur_dir}/.env`; 
	let env_lines = await env_file_path.toLines();
	if (env_lines) {
		let rv = add_to_env(env_lines, ENV, {if_export: true});
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
	await do_imports(ADD_COMS, cwarn);
	if (commandStr) {
		for (let c of commandStr) handle_letter_press(c); 
		handle_enter();
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
//cwarn("Deleting coms...", DEL_COMS);
//log(DEL_COMS);
//stat("");
	do_overlay("ondevreload: start");
	delete_coms(DEL_COMS);
	await do_imports(ADD_COMS, cerr);
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

	delete_mods(DEL_MODS);
	delete_coms(DEL_COMS);

	delete globals.shell_commands;
	delete globals.shell_command_options;

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
this.init_new_screen = (actor_arg, classarg, new_lines, new_colors, n_stat_lines, escape_fn) => {//«

	let screen = {actor, appclass, lines, line_colors, x, y, scroll_num, num_stat_lines, onescape: termobj.onescape};
	if (!actor) hold_terminal_screen = screen;
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
if (screen === hold_terminal_screen) hold_terminal_screen = null;
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
Object.defineProperty(this,"actor",{
	get:()=>actor
});
/*«Unused
this.is_busy=()=>{return !!cur_shell;}
»*/

//»

}; 

//»

