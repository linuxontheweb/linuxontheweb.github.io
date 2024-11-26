
//Imports«

//import { util, api as capi } from "util";
//import { globals } from "config";
const util = LOTW.api.util;
const globals = LOTW.globals;
const {
	isArr,
	isStr,
	isEOF,
	log,
	jlog,
	cwarn,
	cerr,
	normPath
} = util;
const {
	fs,
	NS,
	TEXT_EDITOR_APP,
	LINK_APP,
	FOLDER_APP,
	FS_TYPE,
	MOUNT_TYPE,
	SHM_TYPE,
	DEF_EDITOR_MOD_NAME,
	DEF_PAGER_MOD_NAME,
	SHELL_ERROR_CODES,
	comClasses
} = globals;
const fsapi = fs.api;
const widgets = NS.api.widgets;
const {pathToNode}=fsapi;
const{E_SUC, E_ERR} = SHELL_ERROR_CODES;
const {Com, ErrCom, make_error_com} = comClasses;
const{make_icon_if_new}=LOTW.Desk;

//»

//Var«
//To allow writing of files even if there is an external lock on it, change this to true
const allow_write_locked = false;

const shell_commands = globals.shell_commands;
const command_options = globals.shell_command_options;

//»

//Funcs«

const get_file_lines_from_args = async(args, term)=>{//«
	let err = [];
	let out = [];
	const fullterr=(arg)=>{
		err.push(`${fullpath}: ${arg}`);
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
		else if (typ==MOUNT_TYPE||typ==SHM_TYPE){
		}
		else{
cwarn(`Skipping: ${fullpath} (type=${typ})`);
			continue;
		}

		if (node.appName === FOLDER_APP) {
			fullterr(`Is a directory`);
			continue;
		}
//		let val = await node.text;
		let val = await node.getValue({text: true});
		if (!isStr(val)) {
			fullterr("An unexpected value was returned");
			continue;
		}
		let arr = val.split("\n");
		for (let ln of arr) out.push(ln);
	}
	return {err, out};
};//»

//»

//Commands«

/*
const com_ = class extends Com{
async init(){
}
async run(){
}
}
*/

const com_less = class extends Com{/*«*/
async init(){
	if (!await util.loadMod(DEF_PAGER_MOD_NAME)) {
		this.no("could not load the pager module");
		return;
	}
	this.pager = new NS.mods[DEF_PAGER_MOD_NAME](this.term);
	let path = this.args.shift();
	let arr;
	let name;
	if (!path) {
		if (this.pipeFrom) {
			arr=[];
			name = "*stdin*";
		}
		else{
			arr = this.term.get_buffer();
			name = "*buffer*";
		}
	}
	else {
		let fullpath = normPath(path, this.term.cur_dir);
		let node = await fsapi.pathToNode(fullpath);
		if (!node) {
			return this.no(`${fullpath}: no such file or directory`);
		}
		if (node.appName === FOLDER_APP) {
			return this.no(`${fullpath}: is a directory`);
		}
		let val = await node.getValue({text:true});
		arr = val.split("\n");
		name = node.name;
	}
	this.awaitCb = this.pager.init(arr, name, {opts});
}
async run(){
	await this.awaitCb;
	this.ok();
}
pipeIn(val){
	this.pager.addLines(val);
}

}/*»*/
const com_vim = class extends Com{/*«*/

async init(){
	let {args, opts, command_str}=this;
	if (!await util.loadMod(DEF_EDITOR_MOD_NAME)) {
		this.no("could not load the pager module");
		return;
	}
	this.editor = new NS.mods[DEF_EDITOR_MOD_NAME](this.term);
	let path = args.shift();

	let val;
	let node;
	let parnode;
	let fullpath;
	let typ;
	let linkNode;
	let symbols;

	if (opts.symbols){//«
		let rv = await opts.symbols.toText(term);
		if (!rv) return this.no(`${opts.symbols}: symbol file not found`);
		rv = rv.split("\n");
		symbols=[];
		for (let ln of rv){
			let s = ln.trim();
			if (s.match(/^\w/)) symbols.push(s);
		}
	}//»
	if (!path) {
		val="";
	}
	else {
		let path = args.shift();
		fullpath = normPath(path, term.cur_dir);
		node = await fsapi.pathToNode(fullpath);
		if (!node){
			let badlink = await fsapi.pathToNode(fullpath, true);
			if (badlink){
				linkNode = badlink;
				fullpath = badlink.link;
			}
			let arr = fullpath.split("/");
			let nm = arr.pop();
			let path = arr.join("/");
			parnode = await fsapi.pathToNode(path);
			if (!parnode) return this.no(`${path}: no such directory`);
			if (!await fsapi.checkDirPerm(path)) return this.no(`${fullpath}: permission denied`);
		}
		else {
			if (node.writeLocked()) return this.no(`${path}: is locked by another application`);
			if (node.appName === FOLDER_APP) return this.no(`${fullpath}: is a directory`);
			val = await node.getValue({text:true});
			if (!isStr(val)){
cwarn("Here are the contents...");
log(val);
				return this.no(`${path}: could not get the contents (see console)`);
			}
		}
	}
	this.awaitCb = this.editor.init(val, fullpath, {
		node,
		type: typ,
		command_str,
		opts,
		symbols,
	});
}
async run(){
	await this.awaitCb;
	this.ok();
}
pipeIn(val){
	this.editor.addLines(val);
}

}/*»*/
const com_cat = class extends Com{//«
	init(){
		if (!this.args.length && !this.pipeFrom) this.no("no args and not in pipe");
	}
	async run(){
		let{args}=this;
		if (!args.length) return;
		let rv = await get_file_lines_from_args(args, this.term);
		if (rv.err && rv.err.length) this.err(rv.err);
		if (rv.out && rv.out.length) this.out(rv.out);
		this.ok();
	}
	pipeIn(val){
		this.out(val);
		if (isEOF(val)) this.ok();
	}
}//»
const com_touch = class extends Com{//«

init(){
	if (!this.args.length) {
		this.no("missing file operand");
	}	
}
async run(){
	let{args, err: _err, term}=this;
	let have_error=false;
	const err=mess=>{
		_err(mess);
		have_error = true;
	};
	while (args.length) {
		let path = args.shift();
		let fullpath = normPath(path, term.cur_dir);
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

		let OK_TYPES = [FS_TYPE, SHM_TYPE];
		if (!OK_TYPES.includes(parnode.type)) {
			err(`${fullpath}: The parent directory has an unsupported type: '${parnode.type}'`);
			continue; 
		}
		if (!await fsapi.checkDirPerm(parnode)) {
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
		let{term, err: _err, args}=this;
		if (!args.length) return;
		let have_error = false;
		const err=mess=>{if(!mess)return;have_error=true;_err(mess);};
		await fsapi.comMv(args, {if_cp: false, exports: {cberr: err, werr: err, cur_dir: term.cur_dir, termobj: term}});
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
		let{term, err: _err, args}=this;
		if (!args.length) return;
		let have_error = false;
		const err=mess=>{if(!mess)return;have_error=true;_err(mess);};
		await fsapi.comMv(args, {if_cp: true, exports: {cberr: err, werr: err, cur_dir: term.cur_dir, termobj: term}});
		have_error?this.no():this.ok();	
	}
}//»
const com_mkdir = class extends Com{//«

async run(){
	let{args,term,err: _err}=this;
	let have_error=false;
	const err=(mess)=>{if(!mess)return;have_error=true;_err(mess);};
	if (!args.length) {
		err("missing operand");
	}
	while (args.length) {
		let path = args.shift();
		let fullpath = normPath(path, term.cur_dir);
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
		let OK_TYPES = [FS_TYPE, SHM_TYPE];
		if (!OK_TYPES.includes(parnode.type)) {
			err(`${fullpath}: the parent directory has an unsupported type: '${parnode.type}'`);
			continue; 
		}
		if (!await fsapi.checkDirPerm(parnode)) {
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
const com_rmdir = class extends Com{/*«*/

async run(){
	let{args,term,err: _err}=this;
	let have_error=false;
	const err=(mess)=>{if(!mess)return;have_error=true;_err(mess);};
	if (!args.length) {
		err("missing operand");
	}
	else {
		await fsapi.doFsRm(args, err, {CWD: term.cur_dir, FULLDIRS: false, dirsOnly: true});
	}

	have_error?this.no():this.ok();	
}

}/*»*/
const com_rm = class extends Com{//«

async run(){
	let{args,term,err: _err, env, opts}=this;
	let have_error=false;
	let is_recur = (opts.recursive || opts.R || opts.r);
	const err=(mess)=>{if(!mess)return;have_error=true;_err(mess);};
	if (!args.length) {
		err("missing operand");
	}
	else if(is_recur && 
		!(isStr(env.NUCLEAR_OPTION)&&env.NUCLEAR_OPTION.match(/^i am crazy$/i))){
		err("recursive removal not enabled");
	}
	else{
		let okargs=[];
		let cwd = term.cur_dir
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
	let{args,term,err: _err}=this;
	const err=(mess)=>{
		_err(mess);
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

	let target_node = await fsapi.pathToNode(normPath(target, term.cur_dir));
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

	if (!await fsapi.checkDirPerm(target_node.par)) {
		return err(`${target_node.par.fullpath}: permission denied`);
	}

	let fullpath = normPath(path, term.cur_dir);
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
	if (!await fsapi.checkDirPerm(parnode)) {
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
	let{args,term,err: _err}=this;
	const err=(mess)=>{
		_err(mess);
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

	let fullpath = normPath(path, this.term.cur_dir);
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
	if (!await fsapi.checkDirPerm(parnode)) {
		return err(`${path}: permission denied`);
	}
	let newnode = await fsapi.makeLink(parnode, fname, target, normPath(target, this.term.cur_dir));
	if (!newnode) {
		return err(`${path}: the link could not be created`);
	}
	this.suc(`${fname} -> ${target}`);
	this.ok();
}

}//»
const com_grep = class extends Com{//«

async init(){

	let patstr = this.args.shift();
	if (!patstr) {
		this.no("no pattern given");
		return;
	}

	try {
		this.var.re = new RegExp(patstr);
	}
	catch(e) {
		this.no("invalid pattern: " + patstr);
		return;
	}
	if (!this.args.length && !this.pipeFrom) this.no("no file args and not in a pipeline!");
}
#doGrep(val){
	const re = this.var.re;
	if (!re) return;
	const {out}=this;
	let arr;
	if (isStr(val)) arr=[val];
	else if (!isArr(val)){
		cwarn("Dropping", val);
		return;
	}
	else arr = val;	
	for (let ln of arr){
		if (re.test(ln)) out(ln);
	}
}
async run(){
	if (this.killed) return;
	const re = this.var.re;
	let{args, err: _err, out}=this;
	let have_error = false;
	const err=mess=>{
		if (!mess) return;
		have_error=true;
		_err(mess);
	};
	let rv = await get_file_lines_from_args(args, this.term);
	if (rv.err && rv.err.length) err(rv.err);
	if (rv.out&&rv.out.length) this.#doGrep(rv.out);
	have_error?this.no():this.ok();	
}
pipeIn(val){
	if (isEOF(val)){
		this.out(val);
		this.ok();
		return;
	}
	this.#doGrep(val);
}

}//»
const com_wc = class extends Com{//«

async init(){
	if (!this.args.length && !this.pipeFrom) return this.no("no file args and not in a pipeline!");
	if (this.args.length){
		this.var.noPipe = true;
	}
	this.var.lines=0;
	this.var.words=0;
	this.var.chars=0;
}
#doWC(val){
	const {out}=this;
	let{lines,words,chars}=this.var;
	let arr;
	if (isStr(val)) arr=[val];
	else if (!isArr(val)){
		cwarn("Dropping", val);
		return;
	}
	else arr = val;	
	lines+=arr.length
	for (let ln of arr){
		chars+=ln.length;
		let word_arr = ln.split(/\x20+/);
		if (word_arr.length===1 && word_arr[0]==="") continue;
		words+=word_arr.length;
	}
	this.var.lines=lines;
	this.var.words=words;
	this.var.chars=chars;
}
#sendCount(){
	this.out(`${this.var.lines} ${this.var.words} ${this.var.chars+this.var.lines}`);
}
async run(){
	if (this.killed) return;
	let{args, err: _err, out}=this;
	if (!args.length) return;
	let have_error = false;
	const err=mess=>{
		if (!mess) return;
		have_error=true;
		_err(mess);
	};
	let rv = await get_file_lines_from_args(args, this.term);
	if (rv.err && rv.err.length) err(rv.err);
	if (rv.out&&rv.out.length) this.#doWC(rv.out);
	this.#sendCount();
	have_error?this.no():this.ok();	
}
pipeIn(val){
	if (this.var.noPipe) return;
	if (isEOF(val)){
		this.out(val);
		this.#sendCount();
		this.ok();
		return;
	}
	this.#doWC(val);
}

}//»
const com_dl = class extends Com{//«

async init(){
	const{opts, env, args}=this;
	let nargs = args.length;
	if (!nargs && !this.pipeFrom) return this.no("no file args and not in a pipeline!");
	if (!nargs){
		this.var.name = opts.name || opts.n || env["DL_NAME"] || "DL-OUT.txt";
		this.var.lines=[];
	}
	else if(nargs > 1){
		this.no("too many arguments");
	}
	else{
		this.var.noPipe=true;
	}
}
#doDL(){
	let val;
	if (this.var.lines) val = this.var.lines.join("\n");
	else if (this.var.buffer) val = this.var.buffer;
	else{
		this.no("NO LINES OR BUFFER?!?!?!");
return;
	}
	util.download(new Blob([val]), this.var.name);
	this.ok();
}
async run(){
	const{args}=this;
	if (this.killed || !args.length) return;
	let path = args.shift();
	let fullpath = normPath(path, this.term.cur_dir);
	let node = await fsapi.pathToNode(fullpath);
	if (!node) {
		this.no(`${fullpath}: the file could not be found`);
		return;
	}
	if (!node.isFile){
		this.no(`${fullpath}: not a regular file`);
		return;
	}
	this.var.buffer = await node.buffer;
	this.var.name = node.name;
	this.#doDL();
}
pipeIn(val){
	if (this.var.noPipe) return;
	if (isEOF(val)){
		this.out(val);
		this.#doDL();
		return;
	}
	if (isStr(val)) this.var.lines.push(val);
	else if (isArr(val)) this.var.lines.push(...val);
	else{
cwarn("WUTISTHIS", val);
	}
}

}//»


//Left to convert
const com_purge = async(args,opts, _)=>{//«
	let err=[];
	let dir = await fsapi.getBlobDir();
	for (let arg of args){
		if (!arg.match(/^[0-9]+$/)) {
			err.push(`Skipping invalid blob id: '${arg}'`);
			continue;
		}
		let rows = await fsapi.getNodesByBlobId(parseInt(arg));
		if (rows.length){
			err.push(`${arg}: not purging (${rows.length} entries)`);
			continue;
		}
		try{
			await dir.removeEntry(arg);
		}
		catch(e){
			err.push(`${arg}: ${e.message}`);
		}
	}
	if (err.length) _.err(err);
	return E_SUC;
};//»
const com_blobs = async(args,opts, _)=>{//«
	let out = [];
	let nargs = args.length;
	let cur_dir = _.term.cur_dir;
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
	if (out.length)  _.out(out);
	return E_SUC;
};//»

const com_clearstorage = async(args,opts, _)=>{//«

	let {term}=_; 
	if (globals.read_only) {
		_.err("Read only");
		return E_ERR;
	}
    let ret = await widgets.popyesno(`Clear EVERYTHING in storage?`,{reverse: true});
	if (!ret) {
		_.err("Not clearing");
		return E_ERR;
	}
    await fsapi.clearStorage();
	term.Desk.clear_desk_icons();
	_.suc("Please resfresh the page");
	return E_SUC;

};//»

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

export const coms = {//«
//_clearstorage: com_clearstorage,
_purge: com_purge,
_blobs: com_blobs,
_clearstorage: com_clearstorage,
wc: com_wc,
grep: com_grep,
dl: com_dl,
less:com_less,
cat:com_cat,
mkdir: com_mkdir,
rmdir: com_rmdir,
mv:com_mv,
cp:com_cp,
rm:com_rm,
symln:com_symln,
ln:com_ln,
vim:com_vim,
touch:com_touch,
//mount: com_mount,
//unmount: com_unmount,
}//»

export const opts = {//«

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
			"reload-win": 3,
			symbols: 3,
			'keylog-file': 3,
			'num-keylog-steps':3,
		}
	},//»
	less:{l:{parsel:1}},
	dl:{s:{n:3,},l:{name:2}}

}//»

