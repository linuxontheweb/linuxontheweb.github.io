//Imports«

import { util, api as capi } from "util";
import { globals } from "config";
const{strnum, isarr, isstr, isnum, isobj, log, jlog, cwarn, cerr}=util;
const{NS, TEXT_EDITOR_APP, LINK_APP, FOLDER_APP, FS_TYPE, MOUNT_TYPE, SHM_TYPE, fs,DEF_EDITOR_MOD_NAME, DEF_PAGER_MOD_NAME}=globals;
const fsapi = fs.api;
const widgets = NS.api.widgets;
const {normPath}=capi;
const {pathToNode}=fsapi;

//»

//Var«
//To allow writing of files even if there is an external lock on it, change this to true
const allow_write_locked = false;
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
		let val = await node.text;
//log(val);
		if (!isstr(val)) {
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

const com_less = async (args, o) => {//«
	let {term, opts, stdin}=o; 
//	if (term.ssh_server) return {out: "No 'less' in ssh_server mode!"}
	let err = [];
	const terr=(arg)=>{err.push(arg);};
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
			terr(`${fullpath}: No such file or directory`);
			return {err};
		}
		if (node.appName === FOLDER_APP) {
			terr(`${fullpath}: Is a directory`);
			return {err};
		}
		let val = await node.getValue({text:true});
		arr = val.split("\n");
		name = node.name;
	}
	if (!await capi.loadMod(DEF_PAGER_MOD_NAME)) {
		terr("Could not load the pager module");
		return {err};
	}
	let less = new NS.mods[DEF_PAGER_MOD_NAME](term);
	await less.init(arr, name, {opts});

};//»
const com_vim = async (args, o) => {//«
	const terr=(arg)=>{return {err: arg};}
	let {term, command_str, opts}=o; 
//	if (term.ssh_server) return {out: `No 'vim' in "ssh server" mode!`}

/*«Old
//This is for testing windowed apps.«
//This means that the file you are editing is
//being used by the Meta app, which is only really launched by an app icon that
//has a file arg (which would be the same file that is being edited here) and an
//optional data_file arg for apps that need to call onloadfile.

//»
	let is_meta_app = opts["is-meta-app"];

//This is for testing CLI commands«
which is eval'd by com_meta in the terminal
that has the window id given here.
//»
	let meta_com_win = opts["meta-com-win"];//The numerical window id
	let meta_com_args = opts["meta-com-args"];//Arguments to pass to meta command
	let meta_com_term;//The handle to the eval'ing terminal will go here

//This is a terminal with a vim instance that is in "Waiting..." mode, in order//«
to get its lines run through the external algorithm that will be coded and 
eval'd in this vim instance.
//»
	let sw_lns_win = opts["switch-lns-win"];//Numerical window id of the "Waiting..." vim instance
	let sw_lns_ed;//The handle to the editor (must have a switch_lines method)
	let keylog_file = opts['keylog-file'];
	let num_keylog_steps;

»*/

	let val;
	let node;
	let parnode;
	let fullpath;
	let typ;
	let linkNode;
	let symbols;
//	let meta_com_win = opts["meta-com-win"];//The numerical window id
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
	let text_input_func;
//If a window's app object defines an ontextinput method, vim will call it with its text
	if (opts["text-input-win"]){
		let winid = opts["text-input-win"];
		if (!winid) return {err: "No window id"};
		if (!winid.match(/^[0-9]+$/)) return {err:"Invalid window id"};
		let win = document.getElementById(`win_${winid}`);
		if (!win) return {err: `No toplevel window with id: ${winid}`};
		text_input_func = win._winObj.app.ontextinput;
		if (!(text_input_func instanceof Function)) return {err: `The window's app object does not have an ontextinput method (${winid})`};
	}
	let reload_win;
	if (opts["reload-win"]){
		let winid = opts["reload-win"];
		if (!winid) return {err: "No window id"};
		if (!winid.match(/^[0-9]+$/)) return {err:"Invalid window id"};
		let win = document.getElementById(`win_${winid}`);
		if (!win) return {err: `No toplevel window with id: ${winid}`};
		reload_win = win._winObj;
if (!reload_win._fs_url){
return {err: "That does not look like a local development application!!"}
}
if (reload_win.owned_by) {
cwarn("Here is the owning window");
log(reload_win.owned_by);
	return {err: `The window is already owned! (check console)`}
}
	}
	let path = args.shift();
	if (path) {//«
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
			if (node.write_locked()) return terr(`${path}: Is locked by another application`);
			if (node.appName === FOLDER_APP) return terr(`${fullpath}: Is a directory`);
			val = await node.getValue({text:true});
			if (!isstr(val)){
cwarn("Here are the contents...");
log(val);
				return terr(`${path}: Could not get the contents (see console)`);
			}
		}
	}//»
	if (!val) val = "";
	if (!await capi.loadMod(DEF_EDITOR_MOD_NAME)) return terr("Could not load the editor module");
	let vim = new NS.mods[DEF_EDITOR_MOD_NAME](term);
	if (node) typ = node.type;
	else if (parnode) typ = parnode.type;

//Old«
/*Keylog«
	let keylog_keys;
	if (keylog_file){
		let obj = await keylog_file.toJSON(term);
log(obj);
		if (!obj) return terr("Invalid or missing keylog file");
		keylog_keys = obj.keys;
		if (!isarr(keylog_keys)) return terr("The keylog is missing or not an array");
		let w = obj.w;
		let h = obj.h
		if (!(Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0)) return terr("The width and height values of the keylog_file are bad");
		if (!(term.w === obj.w && term.h === obj.h)){
			return terr(`The terminal dimensions must be: ${w}x${h}`);
		}
		let num_keylog_steps_str = opts['num-keylog-steps'];
		if (num_keylog_steps_str){
			num_keylog_steps = num_keylog_steps_str.ppi();
			if (isNaN(num_keylog_steps)) return terr(`Invalid argument for 'num-keylog-steps' (want a positive integer)`);
		}
//		if (!(keylog_keys && isarr(keylog_keys))) return terr("Invalid or missing keylog file");
	}
»*/
/*Meta«
	let meta_app;
	if (is_meta_app){//«
		let paths = globals.meta_paths;
		if (!(fullpath && paths && (meta_app = paths[fullpath]))){
			return terr("The meta app was not found");
		}
	}//»
	else if (meta_com_win||sw_lns_win){//«
		if (meta_com_win && !fullpath){
			return terr("A file must be given");
		}
		let winid = meta_com_win||sw_lns_win;
		if (!winid) return {err: "No window id"};
		if (!winid.match(/^[0-9]+$/)) return {err:"Invalid window id"};
		let win = document.getElementById(`win_${winid}`);
		if (!win) return {err: `No toplevel window with id: ${winid}`};
		let obj = win._winObj;
		if (obj.appName !== "Terminal") return {err:"The window is not a terminal"};
		if (obj.id === term.winid) return {err:"The window is the same"};
		if (meta_com_win) meta_com_term = obj.app;
		else if (sw_lns_win) {
			if (!(obj.app.editor&&obj.app.editor.switch_lines)) return {err: "The terminal is not an editor with switch_lines"}
			sw_lns_ed = obj.app.editor;
		}
		else{
cerr("HOWDIDUGETHERE!?!?");
		}
	}//»
»*/
//»

	let mess = await vim.init(val, fullpath, {//«
		FOBJ: node,
		TYPE: typ,
		linkNode,
		command_str,
		opts,
		symbols,
		text_input_func,
		reload_win
//«
//		meta_app,
//		meta_com_term,
//		meta_com_args,
//		switch_lines_editor: sw_lns_ed,
//		keylog_keys,
//		keylog_file,
//		num_keylog_steps
//»
	});//»
	if (isstr(mess)){
		return terr(mess);
	}
};//»

const com_purge = async(args, opts)=>{//«
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
	return {err};
};//»
const com_blobs = async(args, opts)=>{//«
	let out = [];
	let nargs = args.length;
	let cur_dir = opts.term.cur_dir;
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
	return {out};
};//»
const com_cat = async (args, opts) => {//«
	let fullpath;
	let out=[];
	let err=[];
	let {term, stdin}=opts;
	if (!args.length) {
		if (!stdin) return {err: "cat: no stdin was received"};
		return {out: stdin};
	}
	return await get_file_lines_from_args(args, term);
};//»
const com_touch = async (args, opts) => {//«
let {term}=opts; 
let err=[];
const terr=s=>{
err.push(s);
};
	const {make_icon_if_new} = term.Desk;
	if (!args.length) {
		terr("touch: missing file operand");
		return {err};
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
			terr(`${parpath}: Not a directory`);
			continue; 
		}

		let OK_TYPES = [FS_TYPE, SHM_TYPE];
		if (!OK_TYPES.includes(parnode.type)) {
			terr(`${fullpath}: The parent directory has an unsupported type: '${parnode.type}'`);
			continue; 
		}
		if (!await fsapi.checkDirPerm(parnode)) {
 			terr(`${path}: Permission denied`);
			continue;
		}
		let newnode = await fsapi.touchFile(parnode, fname);
		if (!newnode) terr(`${fullpath}: The file could not be created`);
		else make_icon_if_new(newnode);
	}
	return {err};
};//»
const com_mkdir = async (args, opts) => {//«
	let {term}=opts; 
	const {make_icon_if_new} = term.Desk;
	let out = [];
	let err = [];
	const terr=(arg)=>{
		err.push(arg);
	};
	if (!args.length) {
		terr("mkdir: missing operand");
		return {err};
	}
	while (args.length) {
		let path = args.shift();
		let fullpath = normPath(path, term.cur_dir);
		let node = await fsapi.pathToNode(fullpath);
		if (node) {
			terr(`${fullpath}: The file or directory exists`);
			continue;
		}
		let arr = fullpath.split("/");
		let fname = arr.pop();
		let parpath = arr.join("/");
		if (!parpath) {
			terr(`${fullpath}: permission denied`);
			continue;
		}
		let parnode = await fsapi.pathToNode(parpath);
		if (!(parnode && parnode.appName === FOLDER_APP)) {
			terr(`${parpath}: Not a directory`);
			continue; 
		}
		let OK_TYPES = [FS_TYPE, SHM_TYPE];
		if (!OK_TYPES.includes(parnode.type)) {
			terr(`${fullpath}: The parent directory has an unsupported type: '${parnode.type}'`);
			continue; 
		}
		if (!await fsapi.checkDirPerm(parnode)) {
			terr(`${fullpath}: permission denied`);
			continue;
		}
		let newdir = await fsapi.mkDir(parnode, fname);
		if (!newdir) terr(`${fullpath}: The directory could not be created`);
		else make_icon_if_new(newdir);
	}
	return {err};
};//»
const com_rmdir = async (args, opts) => {//«
let {term}=opts; 
	let err = [];
	const terr=(arg)=>{
		err.push(arg);
	};
	if (!args.length) {
		terr("rmdir: missing operand");
		return {err};
	}
	await fsapi.doFsRm(args, terr, {CWD: term.cur_dir, FULLDIRS: false});
	return {err};
};//»
const com_rm = async (args, o) => {//«
	let {term, opts, env}=o; 

//log(env);
//return;
	let err = [];
	const terr=(arg)=>{
		err.push(arg);
	};
	if (!args.length) {
		terr("rm: missing operand");
		return {err};
	}
	let is_recur = opts.recursive || opts.R || opts.r;
	if (is_recur) {
		if (!(isstr(env.NUCLEAR_OPTION) && env.NUCLEAR_OPTION.match(/^i am crazy$/i))) {
			return {err: "rm: recursive removal not currently enabled"}
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
	return {err};
};//»
const com_mv = async (args, opts) => {//«
let {term}=opts; 
	let err = [];
	const terr=(arg)=>{
		if (!arg) return;
		err.push(arg);
	};
	let com;
	let if_cp = opts.if_cp;
	if (if_cp) com="cp";
	else com="mv";
	if (!args.length) {
		terr(`${com}: missing operand`);
		return {err};
	}
	await fsapi.comMv(args, {if_cp, exports: {cberr: terr, werr: terr, cur_dir: term.cur_dir, termobj: term}});
	return {err};
};//»
const com_cp = (args, opts) => {//«
	return com_mv(args, {if_cp: true, term: opts.term});
};//»

const com_ln = async (args, opts) => {//«
	let {term}=opts; 
	let {cur_dir} = term;
	const {make_icon_if_new} = term.Desk;
	if (!args.length) {
		return {err: "ln: missing file operand"};
	}
	let target = args.shift();
	if (!args.length) return {err: "ln: missing link name"};
	let target_node = await fsapi.pathToNode(normPath(target, cur_dir));
	if (!target_node) {
		return {err: "The target does not exist"};
	}
	if (target_node.type != FS_TYPE || target_node.appName === FOLDER_APP){
		return {err: "The link cannot be created"};
	}
	let blobid = target_node.blobId;
	if (!Number.isFinite(blobid)) {
		if (target_node.data) return {err: "The target node is a data node"};
		return {err: "The target node does not have an associated blob in the blob store"};
	}

	if (!await fsapi.checkDirPerm(target_node.par)) {
		return {err: `${target_node.par.fullpath}: Permission denied`};
	}

	let path = args.shift();
	if (args.length) return {err: "ln: too many arguments"};
	let fullpath = normPath(path, cur_dir);
	let node = await fsapi.pathToNode(fullpath, true);
	if (node) return {err: `${path}: Already exists`};

	let arr = fullpath.split("/");
	let fname = arr.pop();
	let parpath = arr.join("/");
	let parnode = await fsapi.pathToNode(parpath);

	if (!(parnode && parnode.appName === FOLDER_APP)) {
		return {err: `${parpath}: Not a directory`};
	}
	if (parnode.type !== FS_TYPE) {
		return {err: `${fullpath}: The parent directory is not of type '${FS_TYPE}'`};
	}
	if (!await fsapi.checkDirPerm(parnode)) {
		return {err: `${path}: Permission denied`};
	}
	let newnode = await fsapi.makeHardLink(parnode, fname, blobid);
	if (!newnode) {
		return {err: `${path}: The link could not be created`};
	}

};//»
const com_symln = async (args, opts) => {//«
let {term}=opts; 
let err = [];
const terr=(arg)=>{
	err.push(arg);
};
	const {make_icon_if_new} = term.Desk;
	if (!args.length) {
		return {err: "symln: missing file operand"};
	}
	let target = args.shift();
	if (!args.length) return {err: "symln: missing link name"};

	let path = args.shift();
	if (args.length) return {err: "symln: too many arguments"};
	let fullpath = normPath(path, term.cur_dir);
	let node = await fsapi.pathToNode(fullpath, true);
	if (node) return {err: `${path}: Already exists`};
	
	let arr = fullpath.split("/");
	let fname = arr.pop();
	let parpath = arr.join("/");
	let parnode = await fsapi.pathToNode(parpath);
	if (!(parnode && parnode.appName === FOLDER_APP)) {
		return {err: `${parpath}: Not a directory`};
	}
	if (parnode.type !== FS_TYPE) {
		return {err: `${fullpath}: The parent directory is not of type '${FS_TYPE}'`};
	}
	if (!await fsapi.checkDirPerm(parnode)) {
		return {err: `${path}: Permission denied`};
	}
	let newnode = await fsapi.makeLink(parnode, fname, target, normPath(target, term.cur_dir));
	if (!newnode) {
		return {err: `${path}: The link could not be created`};
	}
	return {err: `${fname} -> ${target}`}
};//»
const com_grep = async(args, opts)=>{//«

	let inarr;
	let err;
	let re;
	let out = [];
	let {term, stdin}=opts; 
	let patstr = args.shift();
	if (!patstr) {
		return {err:"a pattern is required"};
		return;
	}

	try {
		re = new RegExp(patstr);
	}
	catch(e) {
		return {err:"Invalid pattern: " + patstr};
	}

	if (!args.length) {
		if (!stdin) return {err: "grep: no stdin was received"};
		inarr = stdin;
	}
	else {
		let rv = await get_file_lines_from_args(args, term);
		inarr = rv.out;
		err = rv.err;
	}

/*«
for (let ln of ret) {
	if (marr=re.exec(ln)) {
		if (nonmatching) continue;
		gotret = true;
		if (is_matching) outarr.push(marr[0]);
		else outarr.push(ln);
	}
	else if (nonmatching) outarr.push(ln);
}
»*/
	for (let ln of inarr){
		if (re.test(ln)) out.push(ln);
	}
	return {out, err};

};//»
const com_wc = async(args, opts)=>{//«

	let {term, stdin}=opts; 
	let inarr;
	let err;
	if (!args.length) {
		if (!stdin) return {err: "wc: no stdin was received"};
		inarr = stdin;
	}
	else {
		let rv = await get_file_lines_from_args(args, term);
		inarr = rv.out;
		err = rv.err;
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
	return {out: `${lines} ${words} ${chars+lines}`, err};
};//»
const com_dl=async(args, o)=>{//«
	let {term, stdin, env, opts}=o; 
	if (!args.length && !stdin) {
		return {err: "dl: missing file operand"};
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
		if (!node) return {err:`${fullpath}: the file could not be found`};
		val = await node.buffer;
		name = node.name;
	}
	capi.download(new Blob([val]), name);
};//»
const com_clearstorage = async(args, opts)=>{//«

	let {term}=opts; 
	if (globals.read_only) return {err:"Read only"};
    let ret = await widgets.popyesno(`Clear EVERYTHING in storage?`,{reverse: true});
	if (!ret) return {err:"Not clearing"};
    await fsapi.clearStorage();
	term.Desk.clear_desk_icons();
	return {err:"Please resfresh the page"};

};//»

/*
const com_unmount = async (args, opts) => {//«
	let {term}=opts; 
	const terr=(arg)=>{return {err: arg};};
    let mntdir = fs.root.kids.mnt;
    let mntkids = mntdir.kids
    let name = args.shift();
    if (!name) return terr("Mount name not given!");
	if (!mntkids[name]) return terr(`${name}: Not mounted`);
	delete mntkids[name];
};//»
const com_mount = async (args, opts) => {//«
	let {term}=opts; 
	const terr=(arg)=>{return {err: arg};};
	let rv = await fsapi.mountDir(args.shift());//In a multiline comment!!!
	if (isstr(rv)) return terr(rv);
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


