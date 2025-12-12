/*EVERYTHING HERE NEEDS TO BE UPDATED TO THE NEW STYLE LIKE IN COM_WALT (no more term_error)

e.g: 

const com_what = async(args, opts){
    let {inpipe, term} = opts;

	if (fatal) return {err: "Some one-liner"}

	//or if many bad messages:
	let err = [];
	if (this_bad) err.push("This is bad");

	if (that_bad) err.push("That is bad");

	//Sending output
	let out = [];

	for (blah of whatever){
		//do stuff
		out.push(some_output_line);
	}

	return {err, out};
}

*/
//«
//import { util, api as capi } from "util";
//import { globals } from "config";
const util = LOTW.api.util;
const globals = LOTW.globals;
const{isStr, log, jlog, cwarn, cerr}=util;
const{NS, fsMod: fs}=globals;
const fsapi = fs.api;
const {normPath}=util;
const {pathToNode}=fsapi;
const {ShellMod} = globals;
const {Com} = ShellMod.comClasses;
//log(Com);
//const{log, jlog, cwarn, cerr}=util;
//»

//«

const TERM_OK = 0;
const TERM_ERR = 1;

//»

//Util«

const term_error=(term, arg)=>{//«
    if (isStr(arg)) arg = term.fmt2(arg);
    term.response({ERR: arg, NOEND: true});
};//»
const term_out=(term, arg)=>{//«
    if (isStr(arg)) arg = term.fmt(arg);
    term.response({SUCC: arg, NOEND: true});
};//»

const validate_out_path = async(outpath)=>{//«
	if (await pathToNode(outpath)) return `${outpath}: the file exists`;
	let arr = outpath.split("/");
	arr.pop();
	let parpath = arr.join("/");
	let parnode = await pathToNode(parpath);
	if (!parnode) return `${parpath}: The directory doesn't exist`;
//	if (! await fsapi.checkDirPerm(parnode)){
	if (!parnode.okWrite){
		return `${parpath}: permission denied`;
	}
	return true;
};//»
//»
const com_record = class extends Com{//«
//«Priv
#promCb;
#mediaRecorder;
#recordedChunks;
#outPath;
#interval;
//»
cancel(){//«
	if (!this.#mediaRecorder) return;
	clearInterval(this.#interval);
	this.#mediaRecorder.stop();
	setTimeout(async()=>{
		let blob = new Blob(this.#recordedChunks, {
			type: "video/webm"
		});
		let mod = await util.getMod("util.webmparser");
		let bytes = await util.toBytes(blob);
		let rv = await mod.coms.remux(this.term, bytes);
		await fsapi.writeFile(this.#outPath, rv);
//'V_MPEG4/ISO/AVC' == CODECID
//		let rv = mod.coms.parse(term, bytes);
//log(rv);
//		fsapi.writeFile(out_path, blob);
//		util.download(blob, outname);
//		Y();
		this.#promCb();
	},500);
}//»
async doRec() {//«
return new Promise(async(Y,N)=>{
this.#promCb = Y;

//let stream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: true, preferCurrentTab: true, selfBrowserSurface: "include", systemAudio: "include" });
//let stream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: false});
let stream = await navigator.mediaDevices.getDisplayMedia();

let chunks = [];
this.#recordedChunks = chunks;
//let options = { mimeType: "video/webm; codecs=vp9" };
let options = { mimeType: "video/webm; codecs=vp8" };
//mediaRecorder = new MediaRecorder(stream, options);
let mediaRecorder = new MediaRecorder(stream, options);
this.#mediaRecorder = mediaRecorder;
mediaRecorder.ondataavailable =  (e)=>{
	if (e.data.size > 0) {
		chunks.push(e.data);
log("Chunk",chunks.length);
	} 
};
this.#interval=setInterval(()=>{
	mediaRecorder.requestData();
},10000);
mediaRecorder.start();

});

}//»
async run(){//«
	const {args} = this;
	//const terr=(arg)=>{term_error(term, arg);Y();};
	let outname = args.shift();
	if (!outname) return this.no("No outname given");
	let out_path = normPath(outname, this.term.cwd);
log(`OUT: ${out_path}`);
	let okay_rv = await validate_out_path(out_path);
	if (isStr(okay_rv)) return this.no(okay_rv);
	this.#outPath = out_path;
	this.doRec();
// The command only stops with ^C, so there is no need to await and call this.ok()
//	await this.doRec();//
//	this.ok();
}//»
}//»

/*Put these commands in their own libraries«

const com_parse = class extends Com{//«
	async run(){
		if (this.pipeFrom) return;
		let f;
		while (f = this.args.shift()){
			let node = await f.toNode(this.env.cwd);
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
//	pipeDone(lines){
//		this.tryParse(lines.join(""));
//		this.ok();
//	}
//	pipeIn(val){//Commented out
//		if (!isEOF(val)) this.tryParse(val);
//		else this.ok();
//	}
}//»
const com_stringify = class extends Com{//«
	init(){
		if (!this.pipeFrom) return this.no("expecting piped input");
	}
	run(){
	}
	tryStringify(val){
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
//	pipeDone(lines){
//		this.tryStringify(lines.join(""));
//		this.numErrors?this.no():this.ok();
//	}
//	pipeIn(val){//Commented out
//		if (!isEOF(val)) this.tryStringify(val);
//		else {
//			this.numErrors?this.no():this.ok();
//			this.ok();
//		}
//	}
}//»

const com_workman = class extends Com{//«
init(){}
run(){//«

const OK_COMS=["close","move","resize","minimize","none"];
const OK_VALS=["1","0","true","false","yes","no","okay","nope"];
const{args, no}=this;
let type = args.shift();
if (!type) return no("Need a 'type' arg!");
if (!(type==="w"||type==="s")){
	return no("The 'type' arg  must be [w]indow or work[s]pace!");
}
let num = args.shift();
let say_num = num;
if (!num){
return no("Need a 'number' arg!");
}
if (!num.match(/^[0-9]+$/)){
	return no(`Invalid number arg`);
}
let com = args.shift();
if (!com) return no("Need a 'com' arg!");
if (!OK_COMS.includes(com)){
	return no(`${com}: invalid 'com' arg`);
}
let val = args.shift();
if (!val) return no("Need a 'val' arg!");
if (!OK_VALS.includes(val)){
	return no(`${val}: invalid 'val' arg`);
}
if (val==="1"||val==="true"||val==="yes"||val==="okay") val = true;
else val = false;
com = "allow"+(com[0].toUpperCase() + com.slice(1));
let say_type;
if (type==="w"){//«

let elem = document.getElementById(`win_${num}`);
if (!elem) return no(`${num}: window not found`);
let win = elem._winObj;
win[com] = val;
say_type="Window";
}//»
else{//«
num = parseInt(num);
let workspaces = Desk.workspaces;
if (num < 1 || num > workspaces.length){
	return no(`Need a workspace number 1->${workspaces.length}`);
}
let workspace = workspaces[num-1];
if (!workspace) return no(`COULD NOT GET WORKSPACES[${num-1}]`);
workspace[com] = val;
say_type="Workspace";
}//»

this.ok(`${say_type}[${say_num}].${com} = ${val}`);

}//»
}//»
const com_bindwin = class extends Com{//«
static getOpts(){
return {s:{d:3},l:{desc: 3}};
}
	run(){
		const{args}=this;
		let numstr = args.shift();
		if (!numstr) return this.no(`expected a window id arg`);
		if (!numstr.match(/[0-9]+/)) return this.no(`${numstr}: invalid numerical argument`);
		let num = parseInt(numstr);
		let elem = document.getElementById(`win_${num}`);
		if (!elem) return this.no(`${numstr}: window not found`);
		let win = elem._winObj;
		if (!win) return this.no(`${numstr}: the window doesn't have an associated object!?!?`);
		if (win.ownedBy) return this.no("Cannot bind 'owned' windows!");
		let use_key = args.shift();
		if (!(use_key && use_key.match(/^[1-9]$/))) return this.no(`expected a 'key' arg (1-9)`);
		let desc = this.opts.desc || this.opts.d || win.appName;
		globals.boundWins[use_key] = {win, desc};
		win.bindNum = use_key;
		this.ok(`Alt+Shift+${use_key} -> win_${numstr}`);
	}
}//»

const com_wat2wasm = class extends Com{//«

async init(){//«
	if (!window.WabtModule) {
		if (!await util.makeScript("/mods/util/libwabt.js")) {
			return this.no("Could not load 'libwabt'");
		}
		if (!window.WabtModule) return this.no("window.WabtModule does not exist!");
	}
	this.wabt = await window.WabtModule();
}//»
compile(text){//«
	//log(typeof text);
	let features = {};
	let outputLog = '';
	let outputBase64 = 'Error occured, base64 output is not available';

	let binaryOutput;
	let binaryBlobUrl, binaryBuffer;
	let module;
	try {
		module = this.wabt.parseWat('test.wast', text, features);
		module.resolveNames();
		module.validate(features);
		let binaryOutput = module.toBinary({log: true, write_debug_names:true});
		outputLog = binaryOutput.log;
		binaryBuffer = binaryOutput.buffer;
// binaryBuffer is a Uint8Array, so we need to convert it to a string to use btoa
// https://stackoverflow.com/questions/12710001/how-to-convert-uint8-array-to-base64-encoded-string

//	outputBase64 = btoa(String.fromCharCode.apply(null, binaryBuffer));

//	let blob = new Blob([binaryBuffer]);
		this.out(binaryBuffer);
//	log(blob);
	//if (binaryBlobUrl) {
	//	URL.revokeObjectURL(binaryBlobUrl);
	//}
	//binaryBlobUrl = URL.createObjectURL(blob);
	//downloadLink.setAttribute('href', binaryBlobUrl);
	//downloadEl.classList.remove('disabled');
	} catch (e) {
		outputLog += e.toString();
		cerr(outputLog);
	//downloadEl.classList.add('disabled');
	} 
	finally {
		if (module) module.destroy();
	//	outputEl.textContent = outputShowBase64 ? outputBase64 : outputLog;
	}
	//log(typeof text);
}//»
async run(){//«
	const{args, term}=this;
	//log();
	//let rv = await term.readLine("? ", {passwordMode: true});
	//let wabt = await WabtModule();

	let fname = args.shift();
	if (!fname) return this.no("No filename!");
	let val = await fname.toText({cwd: term.cwd});
	if (!val) return this.no(`${fname}: nothing returned`);
	this.compile(val);
	this.ok();
}//»

}//»

const com_markdown = class extends Com{//«
	#mod;
	async init(){
		let modret = await util.getMod("util.showdown");
		if (!modret) return this.no("No showdown module");
		this.#mod = modret.getmod();
	}
	async run(){
		const{args, term} = this;
		let converter = new this.#mod.Converter();
		let fname = args.shift();
		if (!fname) return this.no("Need a file name!");
		let str = await fname.toText(term);
		if (!str) return this.no("File not found!");
		let html = converter.makeHtml(str);
		this.out(html);
		this.ok();
	}
}//»
const com_html = class extends Com{//«
init(){
}
async openWin(val){
	let win = await Desk.api.openApp("util.HTML", {appArgs: {text: val}});
	if (!win) return this.no(`util.HTML: app not found`);
}
async run(){
	const {args, opts, stdin} = this;
	if (stdin){
		this.openWin(stdin);
		this.ok();
		return;
	}
	else if (this.args.length){
		this.no("Only supporting stdin methods!");
		return;
	}
	else{
// Do this method (like in com_math) to wait for EOF before opening the window
// this.lines=[];
	}
}
pipeDone(lines){
this.openWin(lines.join("\n"));
//log(lines);
this.ok();
}
//pipeIn(val){//Commented out
//	if (!isEOF(val)) this.openWin(val);
//	else this.ok();
//}

}//»

const com_wget = class extends Com{//«
//How github names their files within repos, and how to fetch them from LOTW«
//
//If this is the github repo:
//https://github.com/mrdoob/three.js/
//
//The 'playground/' subdir of that repo is here:
//https://github.com/mrdoob/three.js/tree/dev/playground
//
//This is the 'playground/index.html' file:
//https://github.com/mrdoob/three.js/blob/dev/playground/index.html
//
//This is that same file in its raw form, but it is an invalid fetch:
//https://github.com/mrdoob/three.js/raw/refs/heads/dev/playground/index.html
//
//And this is the same file that is okay to fetch:
//https://raw.githubusercontent.com/mrdoob/three.js/refs/heads/dev/playground/index.html
//
//This gets the entire directory structure (but the output is sent to the console as Uint8Array, 
//rather than text, since there is no indication in the URL that the returned value is JSON):
//https://api.github.com/repos/mrdoob/three.js/git/trees/refs/heads/dev?recursive=true
//
//»
static getOpts(){
	return {l: {dl: 1, local: 1}, s: {l: 1}};
}
async run(){
	const {args, opts} = this;
	let patharg = args.shift();
	if (!patharg) return this.no("missing URL");
	if (args.length) return this.no("too many arguments");
	let url;
	if (opts.local || opts.l) url = `/_get?path=${encodeURIComponent(patharg)}`;
	else url = patharg;
//	if (!nodejs_mode || opts["local"]) url = patharg
//	else url = `/_get?path=${encodeURIComponent(patharg)}`;
	let rv;
	try{
		rv = await fetch(url)
	}
	catch(e){
cerr(e);
		this.no(`${e.message} (see console)`);
		return;
	}
	if (!rv.ok){
		this.no(`Response code: ${rv.status} (${rv.statusText})`);
log(rv);
		return;
	}
	let buf = await rv.arrayBuffer();
	if (this.opts.dl){
		let fname = (new URL(patharg)).pathname.split("/").pop();
		if (!fname) fname = "WGET-OUT.bin"
		util.download(new Blob([buf]), fname);
	}
	else this.out(new Uint8Array(buf));
	this.ok();
}

}//»
»*/
/*
const com_walt = async (args, opts) => {//«
    let {term}=opts; 
	let walt = (await util.getMod("util.walt")).Walt;
	let out;
	if (!args.length) return {err:"Need a filename"};
	let name = args.shift();
	let node = await pathToNode(normPath(name, term.cur_dir));
	if (!node) return {err:`${name}: not found`};
	try {
		out = walt.compile(await node.text);
	}
	catch(e){
		return {err: e.message.split("\n")};
	}
	if (!out) return {err:"No compiler output!"};
	let buf = out.buffer();
//Need to check for a file output argument...
	fsapi.writeFile(`${term.cur_dir}/walt.wasm`, buf);
};//»
const com_parsewasm = async (term, args) => {//«
	const terr=(arg)=>{term_error(term, arg);return TERM_ERR;};
	const tout=(arg)=>{term_out(term, arg);return TERM_OK;};
	let out;
	if (!args.length) return terr("Need a filename");
	let name = args.shift();
	let node = await pathToNode(normPath(name, term.cur_dir));
	if (!node) return terr(`${name}: not found`);
	let bytes;
	if (name.match(/\.wasm$/)) bytes = await node.bytes;
	else {
		let b = await node.bytes;
		let szsz = parseInt(String.fromCharCode(b[0])+String.fromCharCode(b[1]));
		let szstr='';
		let i;
		for (i=0; i < szsz; i++){
			szstr += String.fromCharCode(b[i+2]);
		}
		let sz = parseInt(szstr);
		bytes = b.slice(i+2, i+2+sz);
	}

//log(bytes);
const OUT = (arg)=>{
//log(arg);
};
let wout = OUT;
let werr = OUT;
let woutarr = (arg)=>{
log(arg.join("\n"));
};
let mod = await util.getMod("wasmparser");
log(mod);
let parser = new mod.parser(bytes, {termobj: term, wout, werr, woutarr});
log(parser);
//parser.dump_globals();
//log("???");
//let rv = parser.dump_elements();
//let rv = parser.dump_toplevel();
let rv;
try{
//rv = parser.dump_code(15);
rv = parser.dump_code(0);
}catch(e){
return terr(e.message);
}
//log(rv);
//log(bytes);
//log(node);
	return TERM_OK;
};//»
const com_wasm = async (term, args) => {//«
	const terr=(arg)=>{term_error(term, arg);return TERM_ERR;};
	const tout=(arg)=>{term_out(term, arg);return TERM_OK;};
	if (!args.length) return terr("Need a filename");
	let name = args.shift();
	let node = await pathToNode(normPath(name, term.cur_dir));
	let funcName = args.shift();
	if (!node) return terr(`${name}: not found`);
	if (!funcName) return terr("Need a function name");
try {
	let mod = await WebAssembly.instantiate(await node.buffer,{Math: Math});
	let exports = mod.instance.exports;
	let mem = exports.mem;
	let func = exports[funcName];
	if (!func) return terr(`${funcName}: not an exported function`);
let buf = new ArrayBuffer();
mem.grow(10);
log(mem);
log(func);
//log(mod);
////let rv = mod.instance.exports.getRem(12345678.0123456789);
//log("OUT",rv);
//log(mod);
}catch(e){
return terr(e.message);
}
//log(mod);
//log(await node.buffer);
return TERM_OK;
};//»
const com_remux = async (term, args) => {//«

return new Promise(async(Y,N)=>{
const terr=(arg)=>{term_error(term, arg);Y();};

term.kill_register(Y);
let mod = await util.getMod("webmparser");
if (!args.length) return terr("Need a filename");
let name = args.shift();
let node = await pathToNode(normPath(name, term.cur_dir));
if (!node) return terr(`${name}: not found`);

let outname = args.shift();
if (!outname) return terr("No outname given");
let outpath = normPath(outname, term.cur_dir);
let okay_path = await validate_out_path(outpath);
if (isStr(okay_path)) return terr(okay_path);

let bytes = await node.bytes;

let rv = await mod.coms.remux(term, bytes);
if (rv instanceof Blob){
if (!await fsapi.writeFile(outpath, rv)){
return terr("There was a problem writing the file");
}
terr("Done!");
}
else{
cwarn("OHNO");
}
//log(rv);
//log("OMMSED",rv);

Y();

});

//log(mod);

};//»
const com_webmcat = async (term, args, redir) => {//«
const tofloat = (arr) => {//«
	if (arr.length <= 4) return (new DataView(arr.buffer)).getFloat32();
	if (arr.length <= 8) return (new DataView(arr.buffer)).getFloat64();
}//»
const toint = (arr, if_cp) => {//«
	if (if_cp) arr = arr.slice().reverse();
	else arr = arr.reverse();
	let n = 0;
	for (let i = 0; i < arr.length; i++) n |= (arr[i] << (i * 8));
	return n;
}//»
	const terr=(arg)=>{term_error(term, arg);return TERM_ERR;};
	const tout=(arg)=>{term_out(term, arg);return TERM_OK;};
	let mod = await util.getMod("webmparser");
	let tags = mod.WebmTags;
	let segtags = tags.kids["18538067"];
	let parse = mod.parse_section_flat;

let addTicks = 0;
let clusters = [];
let tracks;
let cluster_times=[];
let cluster_sizes=[];
let all_clusters_length = 0;
let cur_tracks_checksum;
let ebml;
while (args.length) {
	let path = args.shift();
	let fullpath = normPath(path, term.cur_dir);
	let node = await fsapi.pathToNode(fullpath);
	if (!node) return terr(`${fullpath}: No such file or directory`);
	let bytes = await node.bytes;
	let webm = parse(bytes, tags);
	if (!webm) return terr(`${fullpath}: Invalid webm`);
	if (!ebml) {
		ebml = webm[1]._bytes;
	}
	let seg = parse(webm[3], segtags);
	let info_bytes;
	let clustnum=0;
	for (let i=0; i < seg.length; i+=2){
		let which = seg[i];
		let bytes = seg[i+1];
		if (which.match(/^CLUSTER:/)) {
			if (!bytes[0]===231){
				return terr(`${fullpath}: ClusterTimeCode ID(0xe7) not found at first byte in cluster[${clustnum}]`);
			}
			let rv = mod.ebml_sz(bytes, 1);
			let tmval = addTicks + toint(bytes.slice(rv[1], rv[1]+rv[0]));
			cluster_times.push(tmval);
			let tmvalarr = mod.num_to_arr(tmval);

			let tmvalszarr = mod.num_to_arr(tmvalarr.length, 3);

			let blocks = bytes.slice(rv[0]+rv[1]);
			let newclustdat = new Uint8Array(blocks.length + 5 + tmvalarr.length);
			newclustdat[0] = 0xe7;
			newclustdat[1] = 0x10;
			newclustdat.set(tmvalszarr, 2);
			newclustdat.set(tmvalarr, 5);
			newclustdat.set(blocks, 5 + tmvalarr.length);
			let newclust = mod.make_ebml_elem([0x1f, 0x43, 0xb6, 0x75], newclustdat);
			all_clusters_length += newclust.length;
			cluster_sizes.push(newclust.length);
			clusters.push(newclust);
			clustnum++;
		}
		else if (which.match(/^INFO:/)) info_bytes = bytes;
		else if (which.match(/^TRACKS:/)) {
			let gottracks = bytes._bytes;
			let sum = await util.sha1(gottracks);
			if (!cur_tracks_checksum) {
				cur_tracks_checksum = sum;
				tracks = gottracks;
			}
			else if (sum !== cur_tracks_checksum){
				return terr(`${fullpath}: The tracks section is different from a previous version`);
			}
		}
	}
	let info = mod.parse_section(info_bytes, segtags.kids["1549a966"]);
	for (let i=0; i < info.length; i+=2){
		if (info[i].match(/^DURATION:/)){
			addTicks += Math.round(tofloat(info[i+1]));
		}
	}
}

let last_block = mod.parse_section(clusters[clusters.length-1], segtags).pop().pop();
let last_block_time = toint(last_block.slice(1,3));
let total_ticks = last_block_time + cluster_times[cluster_times.length-1];

let all_clusters = new Uint8Array(all_clusters_length);
let curbyte=0;
for (let clust of clusters){
	all_clusters.set(clust, curbyte);
	curbyte+=clust.length;
}

let f = new mod.WebmFile();
f.duration = total_ticks;
f.timeCodeScale = 1_000_000;
f.muxingApp = "Zgrancheed";
f.writingApp = "Sofflering";
f.tracks = tracks;
f.clusters = all_clusters;
f.clusterSizes = cluster_sizes;
f.clusterTimes = cluster_times;
f.ebml = ebml;
f.makeInfo();
f.makeSeekHead();
f.makeCues();
f.makeSegment();
f.makeFile();

let blob =  new Blob([f.file]);
if (!redir){
return terr(`WebmFile(${blob.size})`);
}
return write_to_redir(term, blob, redir)



};//»
*/
export const coms = {//«
//	webmcat: com_webmcat,
//	remux: com_remux,
	record: com_record,
//	wasm: com_wasm,
//	walt: com_walt,
};//»


