
//Imports«

//import { util, api as capi } from "util";
//import { globals } from "config";
const util = LOTW.api.util;
const globals = LOTW.globals;
const {
	isArr,
	isStr,
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
} = globals;
const fsapi = fs.api;
const widgets = NS.api.widgets;
const {pathToNode}=fsapi;
const{E_SUC, E_ERR} = SHELL_ERROR_CODES;
//»

//Var«
//To allow writing of files even if there is an external lock on it, change this to true
const allow_write_locked = false;

const shell_commands = globals.shell_commands;
const command_options = globals.shell_command_options;

//»

//Funcs«

const get_file_lines_from_args=async(args, term)=>{//«
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

const com_less = async (args,opts, _) => {//«
	let {term, stdin, err, inpipe}=_; 
//	if (term.ssh_server) return {out: "No 'less' in ssh_server mode!"}
//	let err = [];
//	const terr=(arg)=>{err.push(arg);};
	let path = args.shift();
	let arr;
	let name;
//	let {stdin} = opts;
	if (!path) {
		if (stdin) {
			arr = stdin;
			name = "*stdin*";
		}
		else{
			arr = term.get_buffer();
			name = "*buffer*";
		}
	}
	else {
		let fullpath = normPath(path, term.cur_dir);
		let node = await fsapi.pathToNode(fullpath);
		if (!node) {
			err(`${fullpath}: No such file or directory`);
			return E_ERR;
		}
		if (node.appName === FOLDER_APP) {
			err(`${fullpath}: Is a directory`);
			return E_ERR;
		}
		let val = await node.getValue({text:true});
		arr = val.split("\n");
		name = node.name;
	}
	if (!await util.loadMod(DEF_PAGER_MOD_NAME)) {
		err("Could not load the pager module");
		return E_ERR;
	}
	let less = new NS.mods[DEF_PAGER_MOD_NAME](term);
	await less.init(arr, name, {opts});
	return E_SUC;
};//»
const com_vim = async (args,opts, _) => {//«
//log(_);
	const terr=(arg)=>{return {err: arg};}
	let {stdin, term, command_str}=_; 
	let val;
	let node;
	let parnode;
	let fullpath;
	let typ;
	let linkNode;
	let symbols;
	if (opts.symbols){//«
		let rv = await opts.symbols.toText(term);
		if (!rv) return terr(`${opts.symbols}: symbol file not found`);
		rv = rv.split("\n");
		symbols=[];
		for (let ln of rv){
			let s = ln.trim();
			if (s.match(/^\w/)) symbols.push(s);
		}
	}//»
	if (stdin) {
		val = stdin.join("\n");
	}
	else if (args.length){//«
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
			if (!parnode) return terr(`${path}: No such directory`);
			if (!await fsapi.checkDirPerm(path)) return terr(`${fullpath}: Permission denied`);
		}
		else {
			if (node.writeLocked()) return terr(`${path}: Is locked by another application`);
			if (node.appName === FOLDER_APP) return terr(`${fullpath}: Is a directory`);
			val = await node.getValue({text:true});
			if (!isStr(val)){
cwarn("Here are the contents...");
log(val);
				return terr(`${path}: Could not get the contents (see console)`);
			}
		}
	}//»
	if (!val) val = "";
	if (!await util.loadMod(DEF_EDITOR_MOD_NAME)) return terr("Could not load the editor module");
	let vim = new NS.mods[DEF_EDITOR_MOD_NAME](term);
	if (node) typ = node.type;
	else if (parnode) typ = parnode.type;
	let mess = await vim.init(val, fullpath, {//«
		node,
		type: typ,
		is_stdin: !!stdin,
		command_str,
		opts,
		symbols,
	});//»
	if (isStr(mess)){
		return terr(mess);
	}
	else if (_.inpipe||_.redir){
		_.out(vim.get_lines({str:true}));
	}
	return E_SUC;

};//»
const com_cat = async (args,opts, _) => {//«
	let fullpath;
	let {term, stdin, err, out}=_;
	if (!args.length) {
		if (!stdin) {
			err("cat: no stdin was received");
			return E_ERR;
		}
		out(stdin);
		return E_SUC;
	}
	let rv = await get_file_lines_from_args(args, term);
	if (rv.err && rv.err.length) err(rv.err);
	if (rv.out && rv.out.length) out(rv.out);
	return E_SUC;
};//»
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
const com_touch = async (args,opts, _) => {//«
let {term}=_; 
let err=[];
const terr=s=>{
err.push(s);
};
	const {make_icon_if_new} = term.Desk;
	if (!args.length) {
		_.err("touch: missing file operand");
		return E_ERR;
	}
	while (args.length) {
		let path = args.shift();
		let fullpath = normPath(path, term.cur_dir);
		let node = await fsapi.pathToNode(fullpath);
		if (node) {
			continue; 
		}
		let arr = fullpath.split("/");
		let fname = arr.pop();
		let parpath = arr.join("/");
		let parnode = await fsapi.pathToNode(parpath);
		if (!(parnode && parnode.appName === FOLDER_APP)) {
			err.push(`${parpath}: Not a directory`);
			continue; 
		}

		let OK_TYPES = [FS_TYPE, SHM_TYPE];
		if (!OK_TYPES.includes(parnode.type)) {
			err.push(`${fullpath}: The parent directory has an unsupported type: '${parnode.type}'`);
			continue; 
		}
		if (!await fsapi.checkDirPerm(parnode)) {
 			err.push(`${path}: Permission denied`);
			continue;
		}
		let newnode = await fsapi.touchFile(parnode, fname);
		if (!newnode) err.push(`${fullpath}: The file could not be created`);
		else make_icon_if_new(newnode);
	}
	if (err.length) _.err(err);
	return E_SUC;
};//»
const com_mkdir = async (args,opts, _) => {//«
	let {term}=_; 
	const {make_icon_if_new} = term.Desk;
	let out = [];
	let err = [];
	const terr=(arg)=>{
		err.push(arg);
	};
	if (!args.length) {
		_.err("mkdir: missing operand");
		return E_ERR;
	}
	while (args.length) {
		let path = args.shift();
		let fullpath = normPath(path, term.cur_dir);
		let node = await fsapi.pathToNode(fullpath);
		if (node) {
			err.push(`${fullpath}: The file or directory exists`);
			continue;
		}
		let arr = fullpath.split("/");
		let fname = arr.pop();
		let parpath = arr.join("/");
		if (!parpath) {
			err.push(`${fullpath}: permission denied`);
			continue;
		}
		let parnode = await fsapi.pathToNode(parpath);
		if (!(parnode && parnode.appName === FOLDER_APP)) {
			err.push(`${parpath}: Not a directory`);
			continue; 
		}
		let OK_TYPES = [FS_TYPE, SHM_TYPE];
		if (!OK_TYPES.includes(parnode.type)) {
			err.push(`${fullpath}: The parent directory has an unsupported type: '${parnode.type}'`);
			continue; 
		}
		if (!await fsapi.checkDirPerm(parnode)) {
			err.push(`${fullpath}: permission denied`);
			continue;
		}
		let newdir = await fsapi.mkDir(parnode, fname);
		if (!newdir) err.push(`${fullpath}: The directory could not be created`);
		else make_icon_if_new(newdir);
	}
	if (err.length) _.err(err);
	return E_SUC;
};//»
const com_rmdir = async (args,opts, _) => {//«

	let {term}=_; 
	let err = [];
	const terr=(arg)=>{
		err.push(arg);
	};
	if (!args.length) {
		_.err("rmdir: missing operand");
		return E_ERR;
	}
	await fsapi.doFsRm(args, terr, {CWD: term.cur_dir, FULLDIRS: false});
	if (err.length) _.err(err);
	return E_SUC;

};//»
const com_rm = async (args,opts, _) => {//«
	let {term, env}=_; 

	let err = [];
	const terr=(arg)=>{
		err.push(arg);
	};
	if (!args.length) {
		_.err("rm: missing operand");
		return E_ERR;
	}
	let is_recur = opts.recursive || opts.R || opts.r;
	if (is_recur) {
		if (!(isStr(env.NUCLEAR_OPTION) && env.NUCLEAR_OPTION.match(/^i am crazy$/i))) {
			_.err("rm: recursive removal not currently enabled");
			return E_ERR;
		}
	}
	let okargs=[];
	let cwd = term.cur_dir
	for (let path of args){
		let fullpath = normPath(path, cwd);
		let node = await fsapi.pathToNode(fullpath, true);
		if (!node) {
			terr(`rm: cannot remove '${path}': No such file or directory`);
			continue;
		}
		if (!is_recur && node.appName===FOLDER_APP){
			terr(`rm: cannot remove '${path}': Is a directory`);
			continue;
		}
		okargs.push(node.fullpath);
	}
	await fsapi.doFsRm(okargs, terr, {CWD: cwd, FULLDIRS: is_recur});
	if (err.length) _.err(err);
	return E_SUC;
};//»
const com_mv = async (args,opts, _) => {//«
	let {term}=_; 
	let err = [];
	const terr=(arg)=>{
		if (!arg) return;
		err.push(arg);
	};
	let com;
	let if_cp = _.if_cp;
	if (if_cp) com="cp";
	else com="mv";
	if (!args.length) {
		_.err(`${com}: missing operand`);
		return E_ERR;
	}
	await fsapi.comMv(args, {if_cp, exports: {cberr: terr, werr: terr, cur_dir: term.cur_dir, termobj: term}});
	if (err.length) _.err(err);
	return E_SUC;
};//»
const com_cp = (args,opts, _) => {//«
	_.if_cp = true;
	return com_mv(args, opts, _);
};//»

const com_ln = async (args,opts, _) => {//«
	let {term, err}=_; 
	let {cur_dir,} = term;
	const {make_icon_if_new} = term.Desk;
	if (!args.length) {
		err("ln: missing file operand");
		return E_ERR;
	}
	let target = args.shift();
	if (!args.length) {
		err("ln: missing link name");
		return E_ERR;
	}
	let target_node = await fsapi.pathToNode(normPath(target, cur_dir));
	if (!target_node) {
		err("The target does not exist");
		return E_ERR;
	}
	if (target_node.type != FS_TYPE || target_node.appName === FOLDER_APP){
		err("The link cannot be created");
		return E_ERR;
	}
	let blobid = target_node.blobId;
	if (!Number.isFinite(blobid)) {
		if (target_node.data) {
			err("The target node is a data node");
			return E_ERR;
		}
		err("The target node does not have an associated blob in the blob store");
		return E_ERR;
	}

	if (!await fsapi.checkDirPerm(target_node.par)) {
		err(`${target_node.par.fullpath}: Permission denied`);
		return E_ERR;
	}

	let path = args.shift();
	if (args.length) {
		err("ln: too many arguments");
		return E_ERR;
	}
	let fullpath = normPath(path, cur_dir);
	let node = await fsapi.pathToNode(fullpath, true);
	if (node) {
		err(`${path}: Already exists`);
		return E_ERR;
	}
	let arr = fullpath.split("/");
	let fname = arr.pop();
	let parpath = arr.join("/");
	let parnode = await fsapi.pathToNode(parpath);

	if (!(parnode && parnode.appName === FOLDER_APP)) {
		err(`${parpath}: Not a directory`);
		return E_ERR;
	}
	if (parnode.type !== FS_TYPE) {
		err(`${fullpath}: The parent directory is not of type '${FS_TYPE}'`);
		return E_ERR;
	}
	if (!await fsapi.checkDirPerm(parnode)) {
		err(`${path}: Permission denied`);
		return E_ERR;
	}
	let newnode = await fsapi.makeHardLink(parnode, fname, blobid);
	if (!newnode) {
		err(`${path}: The link could not be created`);
		return E_ERR;
	}
	_.suc(`${fname} -> blobId(${blobid})`);
	return E_SUC;
};//»
const com_symln = async (args,opts, _) => {//«
	let {term, err}=_; 
	const {make_icon_if_new} = term.Desk;
	if (!args.length) {
		err("symln: missing file operand");
		return E_ERR;
	}
	let target = args.shift();
	if (!args.length) {
		err("symln: missing link name");
		return E_ERR;
	}
	let path = args.shift();
	if (args.length) {
		err("symln: too many arguments");
		return E_ERR;
	}
	let fullpath = normPath(path, term.cur_dir);
	let node = await fsapi.pathToNode(fullpath, true);
	if (node) {
		err(`${path}: Already exists`);
		return E_ERR;
	}
	let arr = fullpath.split("/");
	let fname = arr.pop();
	let parpath = arr.join("/");
	let parnode = await fsapi.pathToNode(parpath);
	if (!(parnode && parnode.appName === FOLDER_APP)) {
		err(`${parpath}: Not a directory`);
		return E_ERR;
	}
	if (parnode.type !== FS_TYPE) {
		err(`${fullpath}: The parent directory is not of type '${FS_TYPE}'`);
		return E_ERR;
	}
	if (!await fsapi.checkDirPerm(parnode)) {
		err(`${path}: Permission denied`);
		return E_ERR;
	}
	let newnode = await fsapi.makeLink(parnode, fname, target, normPath(target, term.cur_dir));
	if (!newnode) {
		err(`${path}: The link could not be created`);
		return E_ERR;
	}
	_.suc(`${fname} -> ${target}`);
	return E_SUC;
};//»
const com_grep = async(args,opts, _)=>{//«

	let inarr;
//	let err;
	let re;
	let out = [];
	let {term, stdin, err}=_; 
	let patstr = args.shift();
	if (!patstr) {
		err("a pattern is required");
		return E_ERR;
	}

	try {
		re = new RegExp(patstr);
	}
	catch(e) {
		err("Invalid pattern: " + patstr);
		return E_ERR;
	}

	if (!args.length) {
		if (!stdin) {
			err("grep: no stdin was received");
			return E_ERR;
		}
		inarr = stdin;
	}
	else {
		let rv = await get_file_lines_from_args(args, term);
		inarr = rv.out;
		if (rv.err && rv.err.length) _.err(rv.err);
	}
	for (let ln of inarr){
		if (re.test(ln)) out.push(ln);
	}
	if (out.length) _.out(out);
	return E_SUC;

};//»
const com_wc = async(args,opts, _)=>{//«

	let {term, stdin}=_; 
	let inarr;
	if (!args.length) {
		if (!stdin) {
			_.err("wc: no stdin was received");
			return E_ERR;
		}
		inarr = stdin;
	}
	else {
		let rv = await get_file_lines_from_args(args, term);
		inarr = rv.out;
		if (rv.err && rv.err.length) _.err(rv.err);
	}
	let lines = inarr.length;
	let words = 0;
	let chars = 0;
	for (let ln of inarr){
		chars+=ln.length;
		let word_arr = ln.split(/\x20+/);
		if (word_arr.length===1 && word_arr[0]==="") continue;
		words+=word_arr.length;
	}
	_.out(`${lines} ${words} ${chars+lines}`);
	return E_SUC;
};//»
const com_dl=async(args,opts, _)=>{//«
	let {term, stdin, env}=_; 
	if (!args.length && !stdin) {
		_.err("dl: missing file operand");
		return E_ERR;
	}
	let val;
	let name;
	if (stdin){
		val = stdin.join("\n");
		name = opts.name || opts.n || env["DL_NAME"] || "DL-OUT.txt";
	}
	else {
		let path = args.shift();
		let fullpath = normPath(path, term.cur_dir);
		let node = await fsapi.pathToNode(fullpath);
		if (!node) {
			_.err(`${fullpath}: the file could not be found`);
			return E_ERR;
		}
		val = await node.buffer;
		name = node.name;
	}
	util.download(new Blob([val]), name);
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

