//New Issues«
/*9/8/2024: Made /dev/shm to allow for arbitrary in-memory files and folders. Files under here
will use a new SHM_TYPE, which tells the system not to mess with databasing (which
means that the entire directory is "forgotten" after each page reload). This makes
it more temporary than /tmp. The file/folder creation and removal operations seem to be working,
but there is no ability to mv or cp.
*/
/*9/7/2024: Just created a "data" fs type, which expects an object minimally like this:

{type: "whatever"}

There SHOULD be a "data" (or "value") field as well, though this is not
currently checked. This uses the IDB_DATA_TYPE in the Node database's
type field. It works via writeDataFile in the fs api (here). Upon Node
creation, the data field is created with the given object. 

In saveFsByPath, there are 2 possibilities:
1) Upon creation, we pass the data into touchFile (via the 'opts' object)
2) If updating, we call db.setNodeData (which hasn't been tested yet)

The reason for this is to reduce the overhead when dealing with arbitrary data
that is meant to be created/accessed only via internal programmatic methods.

To create:
fsapi.writeDataFile(fullpath, {value: 1, type: "number"})

To update:
node.setValue({type: "whatever", something: "new"});

We are giving a console warning if the type fields do not match upon updating.

*/
//»

//Imports«

//import { util } from "./util.js";
//import { globals } from "./config.js";
const util = LOTW.api.util;
const globals = LOTW.globals;

const {
	log,
	cwarn,
	cerr,
	strNum,
	isArr,
	isObj,
	isNum,
	isInt,
	isStr,
	isEOF,
//	isArr,
	getNameExt,
	getFullPath,
	normPath,
	toBlob
} = util;

const sleep=()=>{return new Promise((Y,N)=>{});}


const {
	NS,
//	PROJECT_ROOT_MOUNT_NAME,
	FS_PREF,
	FS_TYPE,
	MOUNT_TYPE,
	SHM_TYPE,
	USERNAME,
	HOME_PATH,
	DESK_PATH,
	LINK_APP,
	FOLDER_APP,
	TEXT_EXTENSIONS,
	ALL_EXTENSIONS_RE
} = globals;

const ispos = arg=>{return isNum(arg,true);}

//»

//Var«

const DBNAME = "Filesystem";
const NODES_TABLE_NAME = "Nodes";
//const DEF_BRANCH_NAME = "def";
//const DEF_BRANCH_PATH = `0/${DEF_BRANCH_NAME}`;
//const FS_BRANCH = FS_PREF;
const FS_BRANCH_PATH = `0/${FS_PREF}`;
const DEF_NODE_ID = 1;
const DBSIZE = 10*1024*1024;
const FIRST_BLOB_ID = 100;
const NULL_BLOB_FS_TYPE="n";
const IDB_DATA_TYPE="i";
const DIRECTORY_FS_TYPE="d";
const LINK_FS_TYPE="l";
const FILE_FS_TYPE="f";

//»

const DB = function(){//«

let db;

const init_db=()=>{//«
	return new Promise((Y,N)=>{
		let req = indexedDB.open(DBNAME, 1);
		req.onerror=e=>{
cerr(e);
			Y();
		};
		req.onsuccess=e=>{
			db = e.target.result;
			Y(true);
		};
		req.onblocked=e=>{
cerr(e);
			Y();
		};
		req.onupgradeneeded=(e)=>{
			let store = e.target.result.createObjectStore(NODES_TABLE_NAME, {autoIncrement: true});
			store.createIndex("parId", "parId", {unique: false});
			store.createIndex("value", "value", {unique: false});
			store.createIndex("path", "path", {unique: true});
		}
	});
};//»
const get_store=if_write=>{//«
	return db.transaction([NODES_TABLE_NAME],if_write?"readwrite":"readonly").objectStore(NODES_TABLE_NAME);
};//»
const get_by_path=(path, if_key_only)=>{//«
	return new Promise((Y,N)=>{
		let ind = get_store().index("path");
		let req;
		if (if_key_only) req = ind.getKey(path);
		else req = ind.get(path);
		req.onerror=(e)=>{
			cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(e.target.result);
		};
	});
};//»
const get_by_id=(id)=>{//«
	return new Promise((Y,N)=>{
		let req = get_store().get(id);
		req.onerror=(e)=>{
			cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(e.target.result);
		};
	});
};//»
const put_by_id=(id, node)=>{//«
	return new Promise((Y,N)=>{
		let req = get_store(true).put(node, id);
		req.onerror=(e)=>{
cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(true);
		};
	});
};//»
const del_by_id=(id)=>{//«
	return new Promise((Y,N)=>{
		let req = get_store(true).delete(id);
		req.onerror=(e)=>{
cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(true);
		};
	});
};//»
const get_dir_kids=(which, dirid)=>{//«
return new Promise((Y,N)=>{

	const doit=()=>{//«
		if (nodes==false||ids==false) return Y();
		if (nodes.length !== ids.length){
cerr(`nodes.length(${nodes.length}) !== ids.length(${ids.length})`);
log("NODES",nodes);
log("IDS",ids);
			return Y();
		}
		let out = [];
		for (let i=0; i < ids.length; i++){
			let n = nodes[i];
			let arr = n.path.split("/");
			out.push({id: ids[i], name: arr[1], parId: n.parId, type: n.type, value: n.value || n.type});
		}
		Y(out);
	};//»

//	let ind = db.transaction([NODES_TABLE_NAME],"readonly").objectStore(NODES_TABLE_NAME).index(which);
	let ind = get_store().index(which);
	let nodes, ids;
	let req1 = ind.getAll(dirid);
	req1.onerror=e=>{
cerr(e);
		nodes = false;
		if (ids || ids===false) doit();
	};
	req1.onsuccess=e=>{
		nodes = e.target.result;
		if (ids || ids===false) doit();
	};

	let req2 = ind.getAllKeys(dirid);
	req2.onerror=e=>{
cerr(e);
		ids = false;
		if (nodes || nodes===false) doit();
	};
	req2.onsuccess=e=>{
		ids = e.target.result;
		if (nodes || nodes===false) doit();
	};

});
};//»
const add_node=node=>{//«
	return new Promise((Y,N)=>{
		let store= db.transaction([NODES_TABLE_NAME],"readwrite").objectStore(NODES_TABLE_NAME);
		let req=store.add(node);
		req.onerror=(e)=>{
cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(true);
		};
	});
};//»

this.init=async(root, branch_name)=>{//«
	if (db) {
cwarn("WHO CALLED DB.INIT?");
		return;
	}
	if (!await init_db()) {
throw new Error("init_db() failed!");
	}
	let path = `0/${branch_name}`;
	let rootid = await get_by_path(path, true);
	if (!rootid) {
		if (!await add_node({parId: 0, path, type: DIRECTORY_FS_TYPE})){
throw new Error("Could not add the root node!");
			return;
		}
		rootid = await get_by_path(path, true);
		if (!rootid){
throw new Error(`WUT NO ROOTID RETURNED AFTER ADDING ROOT NODE (${path}) ?!?!?`);
		}
	}
	root.id = rootid;
	return true;
}//»

this.createNode=async(name, type, parId, value)=>{//«

if (type===DIRECTORY_FS_TYPE||type===NULL_BLOB_FS_TYPE||type==LINK_FS_TYPE||(type===FILE_FS_TYPE && Number.isFinite(value))||type==IDB_DATA_TYPE) {
	let path = `${parId}/${name}`;
	let node = {parId, path, type: type};
	if (value) node.value = value;
	let rv = await add_node(node);
	if (!rv){
	}
	else{
		rv = await get_by_path(path, true);
		if (rv) return rv;
	}
cerr("TEOINMTV");
}

else{
cwarn("createNode: ADD TYPE", type);
}

};//»
this.getAll=async dirid=>{//«
	let rv = await get_dir_kids("parId", dirid);
	return {rows: rv||[]};
};//»
this.getNodesByBlobId=async blobid=>{//«
	let rv = await get_dir_kids("value", blobid);
	return {rows: rv||[]};
};//»
this.getNodeByNameAndParId=async (name, parid)=>{//«
	let path = `${parid}/${name}`;
	let node = await get_by_path(path);
	if (!node) return {rows:[]};
	let id = await get_by_path(path, true);
	if (!id){
cerr(`Could not get_by_path(${path},true)`);
	}
	else return {rows:[{id, value: node.type, data: node.value}]}
}//»

this.setNodeBlobID=async(nodeid, blobid)=>{//«
	let node = await get_by_id(nodeid);
	if (!node) return;
	node.type=FILE_FS_TYPE;
	node.value=blobid;
	if (!await put_by_id(nodeid, node)) return;
	return true;
};//»
this.setNodeData=async(nodeid, data)=>{//«
	let node = await get_by_id(nodeid);
	if (!node) return;
	node.value=data;
	if (!await put_by_id(nodeid, node)) return;
	return true;
};//»

this.moveNode=async(id, fromId, toId, newName)=>{//«
	let node = await get_by_id(id);
	let parr = node.path.split("/");
	if (fromId !== toId) {
		node.parId = toId;
	}
	let usename = newName || parr[1];
	node.path=`${toId}/${usename}`;
	if (!await put_by_id(id, node)) return;
	return true;
};//»
this.getById=(id)=>{return get_by_id(id);};

this.removeNode=async(id, parId)=>{//«

if (!await del_by_id(id)) return;

return true;

};//»

this.dropDatabase = () => {//«
throw new Error("Comment me out to use dropDatabase()!");
	return new Promise((Y,N)=>{
		db.close();
		const req = window.indexedDB.deleteDatabase(DBNAME);
		req.onerror = (event) => {
cerr("Error deleting database.");
			Y();
		};
		req.onblocked = (e)=>{
cwarn("BLOCKED");
			Y();
		};
		req.onsuccess = (event) => {
			Y(true);
		};
	});
};//»

}//»

//FS«

//new FS(){«
export const FS = function() {
//»

//Var«

let rootId;

const root={name:"/",appName:FOLDER_APP,kids:{},treeroot:true,type:"root",sys:true,path:"/",fullpath:"/",done:true};
root.kids['..'] = root;
root.kids['.'] = root;
root.root = root;
//root.par = root;
this.root = root;
globals.root = root;
const db = new DB();


let VERNUM=1;

let BLOB_DIR;
const MB = 1024*1024;
const MAX_LOCAL_FILE_SIZE = MB;

let FILE_SAVER_SLICE_SZ = 1 * MB;
let MAX_REMOTE_SIZE = 1 * MB;
let MAX_FILE_SIZE = 256*MB;

let Desk;
const OK_WRITE_TYPES=[FS_TYPE];
//const root_dirs = ["tmp", "usr", "home", "etc", "var"];
const root_dirs = ["tmp", "home", "var"];

const MAX_DAYS = 90;//Used to determine how to format the date string for file listings
const MAX_LINK_ITERS = 8;

const sleep = ()=>{return new Promise((Y,N)=>{});};
const NOOP=()=>{};
const FATAL=s=>{throw new Error(s);};

let move_icon_by_path = NOOP;

String.prototype.regpath = function(if_full) {//«
    let str = this;
    if (if_full) str = "/" + str;
    str = str.replace(/\/+/g, "/");
    if (str == "/") return "/";
    return str.replace(/\/$/, "");
}//»

const bad_link_cbs = {};

//»

//Node

const LOCKED_BLOBS = {};
class Node {//«

constructor(arg){//«
	this.isDir = arg.isDir;
	this.isLink = arg.isLink;
	this.isData = arg.isData;
	this.isFile = arg.isFile;
	for (let k of Object.keys(arg)){//«
		this[k] = arg[k];
		if (k=="name") this.setName(arg[k]);
		if (k=="kids"){
			this.kids["."]=this; 
			this.kids[".."]=this.par;
		}
	}//»
	this.writeLocked=()=>{
		return LOCKED_BLOBS[this.blobId];
	};
	this.icons = [];
}//»

	okGet(){//«
		if (this.type==MOUNT_TYPE||this.type==SHM_TYPE) return true;
		let bid = this.blobId;
		if (!bid || bid < FIRST_BLOB_ID) {
			return;
		}
		return true;
	};//»
	okSet(){//«
		if (this.type!==FS_TYPE) {
			if (this.type==SHM_TYPE) return true;
			return false;
		}
		let bid = this.blobId;
		if (!bid || bid < FIRST_BLOB_ID) return false;
//		if (this.data) return false;
		return true;
	};//»
	setName(val){//«
		this._name = val;
		if (this.isDir||this.isLink){
			this.baseName = val;
			return;
		}
		let arr = getNameExt(val);
		if (arr[1]) {
			this.ext = arr[1];
			this.baseName = arr[0];
		}
		else {
			this.ext="";
			this.baseName = val;
		}
	};//»
	async getRealBlobId(){//«
		let bid = get_blob_id();
		this.blobId = bid;
		if (!await db.setNodeBlobID(this.id, bid)) {
cerr(`(id=${this.id}): Could not set the new node value (blobId=${bid})`);
			return;
		}
		return true;
	};//»
	async getValue(opts={}){//«
		if (!this.okGet()) return;
		if (this.blobId == IDB_DATA_TYPE) {
			if (opts && opts.text) {
cwarn("This is a data node, but opts.text was specified in getValue!");
				try{
					return JSON.stringify(this.data);
				}catch(e){
cerr(e);
				}
				return this.data.toString();
			}
			let dat = this.data;
			return dat;
		}
		return getBlob(this, opts);
	};//»
	getDataType(){//«
		if (this.blobId !== IDB_DATA_TYPE) return;
		return this.data.type;
	};//»
	getDataValue(){//«
		if (this.blobId !== IDB_DATA_TYPE) return;
		return this.data.value;
	};//»
	async setDataValue(val){//«
		if (this.blobId != IDB_DATA_TYPE){
cerr("Cannot set data value on non-data node");
			return;
		}
		let dat = this.data;
		if (!dat){
cerr("Data not found");
log(this);
			return;
		}
		dat.value = val;
		if (!await db.setNodeData(this.id, this.data)) {
cerr("Could not set node data");
			return;
		}
		return true;
	};//»
	async setValue(val, opts={}){//«
		if (this.blobId == IDB_DATA_TYPE){
			if (!(isObj(val) && isStr(val.type))){
cerr(`Expected an object with a 'type' field! (for inline data storage)`);
				return;
			}
			if (this.data.type !== val.type){
cwarn(`The data types have changed: '${this.data.type}' => '${val.type}'`);
			}
			if (!await db.setNodeData(this.id, val)) {
cerr("Could not set node data", this);
				return;
			}
			this.data = val;
			return true;
		}
		if (!this.okSet()) return;
		let blob = toBlob(val);
		if (!blob){
cerr("Unknown value", val);
			return;
		}
		opts.node = this;
		if (this.blobId===NULL_BLOB_FS_TYPE){//«
			if (!await this.getRealBlobId()){
cerr("Could not getRealBlobId()!?!?!?");
				return;
			}
		}//»
		opts.node = this;
		let rv = await write_blob(await this.entry, blob, opts);
		rv.node = this;
		return rv;
	};//»

get entry(){//«
	return new Promise(async(Y,N)=>{
		if (this._entry) return Y(this._entry);
		if (!this.okGet()) return Y();
		let id = this.blobId;
		if (id === NULL_BLOB_FS_TYPE){
			id = get_blob_id();
			this.blobId = id;
		}
		else if (this.type==SHM_TYPE) return Y();
		else if (!Number.isFinite(id)) {
cerr(`The node does not have a valid blobId: ${id}`);
log(this);
			return Y();
		}
		let ent = await get_blob_entry(id);
		this._entry = ent;
		Y(ent);
	});
}//»
set entry(ent){//«
cwarn("WHO SET ENTRY?", this, ent);
	this._entry = ent;
}//»
get buffer(){//«
//	Object.defineProperty(this,"buffer",{get:()=>{if(!okget())return;return getBlob(this,{buffer:true});}});
	if (!this.okGet()) return;
	return getBlob(this, {
		buffer: true
	});
}//»
get bytes(){//«
//	Object.defineProperty(this,"bytes",{get:()=>{if(!okget())return;return getBlob(this,{bytes:true});}});
	if (!this.okGet()) return;
	return getBlob(this, {
		bytes: true
	});
}//»
get text(){//«
//	Object.defineProperty(this,"text",{get:()=>{if(!okget())return;return getBlob(this,{text:true});}});
	if (!this.okGet()) return;
	return getBlob(this, {
		text: true
	});
}//»
get link(){//«
//	if(isLink){Object.defineProperty(this,"link",{get:()=>{let symlink=this.symLink;if(symlink.match(/^\x2f/))return symlink;return `${this.path}/${symlink}`;}});Object.defineProperty(this,"ref",{get:()=>{return pathToNode(this.link);}});}
	if (!this.isLink) return;
	let symlink = this.symLink;
	if (symlink.match(/^\x2f/)) return symlink;
	return `${this.path}/${symlink}`;
}//»
get ref(){//«
	if (!this.isLink) return;
	return pathToNode(this.link);
}//»
get _file(){//«
//	Object.defineProperty(this,"_file",{get:()=>{if(!okget())return;return getBlob(this,{getFileOnly:true});}});
	if (!this.okGet()) return;
	return getBlob(this, {
		getFileOnly: true
	});
}//»
get fullpath(){//«
//	Object.defineProperty(this,"fullpath",{get:()=>{let str=this.name;if(!str)return null;let curobj=this;let i=0;while(true){if(curobj && curobj.par)str=`${curobj.par.name}/${str}`;else break;curobj=curobj.par;i++;}let arr=str.split("/");while(!arr[0] && arr.length){arr.shift();i++;}str=arr.join("/");return("/"+str).regpath();}});
	let str = this.name;
	if (!str) return null;
	let curobj = this;
	let i = 0;
	while (true) {
		if (curobj && curobj.par) str = `${curobj.par.name}/${str}`;
		else break;
		curobj = curobj.par;
		i++;
	}
	let arr = str.split("/");
	while (!arr[0] && arr.length) {
		arr.shift();
		i++;
	}
	str = arr.join("/");
	return ("/" + str).regpath();
}//»
//Object.defineProperty(this, "type", {get:()=>this.root._type});
get type(){return this.root._type;}
get name(){return this._name;}
set name(name){//«
//	Object.defineProperty(this,"name",{set:setname,get:()=>this._name});
	return this.setName(name);
}//»
get path(){//«
//	Object.defineProperty(this,"path",{get:()=>{if(this._path)return this._path;return this.par.fullpath;}});
	if (this._path) return this._path;
	return this.par.fullpath;
}//»

}//»

//Filesystem ops«

const getNodesByBlobId = async (blobId) =>{//«
//	db.init();
	let rv = await db.getNodesByBlobId(blobId);
	return rv.rows;
//	log(rv);
};//»

const pathToNode = async(path, if_link, if_retall) => {//«
	let [ret,lastdir,usepath] = await path_to_node(path, if_link, 0);
	if (ret) {
		if (if_retall) return [ret,lastdir,usepath];
		return ret;
	}
	if (if_retall) return [false,lastdir,usepath];
	return false;
};//»
const try_get_kid=async(nm, curpar)=>{//«
	let rv = await db.getNodeByNameAndParId(nm, curpar.id);
	if (!check_db_rv(rv)) return;
	let gotrow = rv.rows[0];
	if (!gotrow) return;
	let isLink = gotrow.value === LINK_FS_TYPE;
	let kid = mk_dir_kid(curpar, nm,{
		isDir: gotrow.value==DIRECTORY_FS_TYPE,
		path: curpar.fullpath,
		isLink
	});
	if (isLink) {
		kid.symLink = gotrow.data;
	}
	else if (gotrow.value == IDB_DATA_TYPE){
		kid.blobId = IDB_DATA_TYPE;
		kid.data = gotrow.data;
	}
	else {
		kid.blobId = gotrow.data;
	}
	kid.id = gotrow.id;
	if (!kid.root) kid.root = curpar.root;
	return kid;
};//»
const path_to_node = async(patharg, if_get_link, iter) =>{//«
	if (!iter) iter=0;
	const done=async()=>{//«
/*Return here if://«
1) There is not a node (this operation failed)
2) The node is NOT a link
3) We have a link, and want the link node iteself
»*/
		if (!node||node.appName!==LINK_APP||if_get_link) return [node, curpar, path];
		if (iter > MAX_LINK_ITERS) return [null, curpar, path];
		if (node.type==FS_TYPE){
			if (!node.link){
cerr(`NO node.link WITH node.appName==LINK_APP!?!?, (VERIFY IT HERE: ${node.appName})`);
				return;
			}
			return path_to_node(node.link, if_get_link, ++iter);
		}
//I don't understand what this is about
//How can it be a link, but not be type==FS_TYPE?
cerr("HOW IS THIS POSSIBLE??? PLEBYTLNM");
		let rv = await get_data_from_fs_file(node.file,"text");
		return path_to_node(rv, if_get_link, ++iter);
	};//»
	let node;
	let path = normPath(patharg);
	if (path==="/") return [root,null,path];
	let parts = path.split("/");
	parts.shift();
	let topname = parts.shift();
	let curpar = root.kids[topname];
	if (!curpar) return [null, root, path];
	if (!parts.length) return [curpar, root, path];

	let curkids = curpar.kids;
	let curpath = curpar.fullpath;
	let fname = parts.pop();
	while(parts.length){//«
		let nm = parts.shift();
		let gotkid = curkids[nm];
		if (gotkid) curpar = gotkid;
		else {//«
			if (!curpar.done) {
				let rtype = curpar.type;
				if (rtype==FS_TYPE){
					let kid = await try_get_kid(nm, curpar);
					if (!kid) return done();
					curkids[nm] = kid;
				}
				else await popDir(curpar);
				gotkid = curkids[nm];
				if (!gotkid) return [null, curpar, path];
				curpar = gotkid;
			}
			let newpar = curkids[nm];
			if (!(newpar&&newpar.appName===FOLDER_APP)) return [null, curpar, path];
			curpar = newpar;
		}//»
		if (curpar.appName===LINK_APP){//«
			if (iter > MAX_LINK_ITERS) return [null, curpar, path];
			if (curpar.type==FS_TYPE){
				let gotdir = await curpar.ref;
				if (!(gotdir&&gotdir.appName===FOLDER_APP)) return [null, curpar, curpath];
				curpar = gotdir;
			}
			else {
//I don't understand what this is about
//How can it be a link, but not be type==FS_TYPE?
cerr("HOW IS THIS POSSIBLE??? HFBEHDKL");
				let rv = await get_data_from_fs_file(curpar.file,"text");
				let [gotdir, lastdir, gotpath] = await path_to_node(rv, if_get_link, ++iter);
				if (!(gotdir&&gotdir.appName===FOLDER_APP)) return [null, curpar, gotpath];
				curpar = gotdir;
			}
		}//»
		curpath = curpar.fullpath;
		curkids = curpar.kids;
	}//»
	let parref;
	if (!curkids&&!if_get_link&&(parref=await curpar.ref)&&parref.kids){
		curpar = parref;
		curpath = curpar.fullpath;
		curkids = curpar.kids;
	}
	if (!curkids) return done();
	node = curkids[`${fname}`];
	if (node||curpar.done) {
		if (node && !node.root) node.root = curpar.root;
		return done();
	}
	if (curpar.type!==FS_TYPE){//«
		await popDir(curpar);
		let gotnode = curkids[fname];
		if (!gotnode) return [null, curpar, path];
		node = gotnode;
		if (!node.root) node.root = curpar.root;
		return done();
	}//»
	let kid = await try_get_kid(fname, curpar);
	if (!kid) return done();
	node = kid;
	curkids[fname] = kid;
	return done();

};//»
//String.prototype.to(Node|Text|Lines|Bytes|Buffer|Blob)«
{
const toNode = function(opts={}) {//«
	let s = this+"";
	if (s.match(/^\x2f/)){}
	else if (opts.cwd && opts.cwd.match(/^\x2f/)) s = `${opts.cwd}/${s}`
	else {
cerr("Cannot construct a full path!");
		return false;
	}
	return pathToNode(normPath(s), opts.getLink);
};//»
let _ = String.prototype;
_.toNode=toNode;
_.toParNodeAndName=async function(opts={}){//«
	let s = this+"";
	if (s.match(/^\x2f/)){}
	else if (opts.cwd && opts.cwd.match(/^\x2f/)) s = `${opts.cwd}/${s}`
	s = normPath(s);
	let arr = s.split("/");
	let fname = arr.pop();
	let parpath = arr.join("/");
	let parnode = await pathToNode(parpath);
	if (!(parnode && parnode.appName === FOLDER_APP)) {
cerr(`${parpath}: Not a directory!`);
		return;
	}
	return [parnode, fname, s];
}//»
_.toText = async function(opts = {}) {
	let node = await this.toNode(opts);
	if (!node) return;
	let txt = await node.text;
	if (opts.lines) return txt.split("\n");
	return txt;
};
_.toLines=function(opts={}){
	opts.lines = true;
	return this.toText(opts);
}
_.toBytes=async function(opts={}){let node=await this.toNode(opts);if(node)return node.bytes;};
_.toBuffer=async function(opts={}){let node=await this.toNode(opts);if(node)return node.buffer;};
_.toBlob=async function(opts={}){//«
	let node = await this.toNode(opts);
	if (!node) return;
	let buf = await node.buffer;
	if (!buf) return;
	if (opts.type) return new Blob([buf], {type: opts.type});
	return new Blob([buf]);
};//»
_.toJson=async function(opts={}){//«
	let node = await this.toNode(opts);
	if (!node) return;
	let text = await node.text;
	if (!text) return;
	try{
		return JSON.parse(text);
	}
	catch(e){
cerr(e);
	}
};//»
}

//»

const getPathByDirId=async(idarg)=>{//«
	let id = idarg;
	let path = [];
	while (id) {
		let par = await db.getById(id);
		if (!par) return;
		path.unshift(par.path.split("/")[1]);
		id = par.parId;
	}
	path.shift();
	return "/"+path.join("/");
};//»

const doFsRm=async(args, errcb, opts={})=>{//«
	let cwd = opts.CWD;
	let is_root = opts.ROOT;
	let do_full_dirs = opts.FULLDIRS;
	let arr = [];
	let no_error = true;
	for (let path of args){
		let rv = await check_ok_rm(
			normPath(path, cwd), 
			errcb, 
			is_root, 
			do_full_dirs
		);
		if (!rv) {
			no_error = false;
			continue;
		}
		arr.push(rv);
	}
	for (let obj of arr) {
		if (!await delete_fobj(obj, opts)) no_error = false;
	}
	return no_error;
};//»
const rmFile=async(fobj, opts)=>{//«
	if (fobj.sys) return [null, "Not removing toplevel"];
	const bad=(mess)=>{
		cerr(mess);
		return [];
	};
	if (fobj.appName===FOLDER_APP){
		let kids = fobj.kids;
		for (let k in kids){
			if (k=="."||k=="..") continue;
			await delete_fobj(kids[k], opts);
		}
	}
	let id = fobj.id;
	let parid = fobj.par.id;
if (!(id&&parid)) {
if (fobj.type==SHM_TYPE) return [true];
bad(`NO ID && PARID???`);
log(fobj);
log(fobj.par);
return [];
}
//	db.init();
	if (!await db.removeNode(id, parid)) return bad("FRYNBSJ");
//WMNJUGFNH
/*«
	let blobId = fobj.blobId;
	if (blobId && Number.isFinite(blobId)) {
		if (!BLOB_DIR) BLOB_DIR = await get_blob_dir();
		if (!BLOB_DIR) return Y();
		await BLOB_DIR.removeEntry(blobId);
	}
»*/
	return [true];
};//»
const clearStorage = async ()=>{//«
	let opfs = await navigator.storage.getDirectory();
	await opfs.removeEntry("blobs", { recursive: true });
	let rv = await db.dropDatabase();
	localStorage.clear();
	return true;
};//»
const check_ok_rm = async(path, errcb, is_root, do_full_dirs)=>{//«
	let obj = await pathToNode(path, true);
	if (!obj){
		errcb(`could not stat: ${path}`);
		return;
	}
	let rtype = null;
	rtype = obj.type;
	if (obj.treeroot === true) {
		errcb("ignoring the request to remove root");
		return;
	}
	if (obj.appName !== FOLDER_APP) {//«
		if (!(rtype==FS_TYPE||rtype==SHM_TYPE)){
			errcb(`${path}: not (currently) handling fs type: '${rtype}'`);
			return;
		}

		if (!check_fs_dir_perm(obj.par, is_root)) errcb(`${path}: permission denied`);
		else if (obj.writeLocked()) errcb(`${path} is "write locked"`);
		else return obj;
		return;
	}//»
	if (!(rtype==FS_TYPE||rtype==SHM_TYPE)) {
		errcb(`not removing directory type: '${rtype}': ${path}`);
		return;
	}
	if (Desk && (path == globals.desk_path)) {
		errcb(`not removing the working desktop path: ${path}`);
		return;
	} 
	if (obj.par.treeroot) {
		errcb(`not removing toplevel directory: ${path}`);
		return;
	} 
	if (obj.moveLocks.length){
		errcb(`${path}: is "move locked"`);
		return;
	}
	if (!obj.done) obj.kids = await popDirByPath(obj.fullpath);
	let numkids = get_keys(obj.kids).length;
	if (!do_full_dirs && numkids > 2) {
		errcb(`${path}: not an empty folder`);
		return;
	}
	if (!check_fs_dir_perm(obj, is_root)) {
		errcb(`${path}: permission denied`);
		return;
	}
	return obj;
};//»
const delete_fobj = async(node, opts={})=>{//«
	const OK_TYPES=[FS_TYPE,SHM_TYPE];
	if (!OK_TYPES.includes(node.type)) {
cerr("delete_fobjs:DELETE type:" + node.type + "!?!?!?!?!?");
		return;
	}
	let path = node.fullpath;
	let [delret, errmess] = await rmFile(node, opts);
	if (!delret){
cerr(`Could not remove: ${node.fullpath} (${errmess})`);
		return;
	}
	delete node.par.kids[node.name];
	if (Desk) Desk.cleanup_deleted_wins_and_icons(path);
	return true;
};//»

const comMv=async (paths, opts={})=>{//«
	return com_mv(paths,{if_cp: opts.if_cp, shell_exports: opts.exports} );
};//»
const com_mv = async(args, opts={}) => {//«
//const com_mv = async(shell_exports, args, if_cp, dom_objects, recur_opts) => {

let{
	shell_exports, if_cp, dom_objects, recur_opts
}=opts;

const no_move_all=()=>{//«
	if (no_move_cb){
		for (let arg of args){
			let path = getFullPath(arg, cur_dir);
			no_move_cb(icon_obj[path]);
		}
	}
}//»

//Init«

let errarr = [];
let mvarr = [];
let verb = "move";
let com = "mv";
if (if_cp) {
	verb = "copy";
	com = "cp";
}

//Imports from the calling environment (either the shell or desktop)«
if (!shell_exports) shell_exports = {};
let {
	wclerr,
	werr,
	wout,
	cbok,
	cberr,
	cur_dir,
	failopts,
	is_root,
	get_var_str,
	termobj,
	kill_register,
	pathToNode,
	no_move_cb
} = shell_exports;

if (!wclerr) wclerr=NOOP;
if (!werr) werr=s=>{
log("ERR",s);
};
if (!wout) wout=s=>{
log("OUT",s);
};

if (!pathToNode) pathToNode = this.api.pathToNode;

if (recur_opts){
	cbok = recur_opts.cbok;
	cberr = recur_opts.cberr;
}

let icon_obj = {};
let towin = null;

if (dom_objects) {
	icon_obj = dom_objects.icons;
	towin = dom_objects.win;
}

//»

let killed = false;//«
if (kill_register){
	kill_register(cb=>{
		killed = true;
		cb&&cb();
	});
}
//»

let sws;
if(failopts) sws=failopts(args,{SHORT:{f:1}});
else sws = {};
if (!sws) return;
let gotfail = false;
let force = sws.f;
if (!args.length) return cberr("missing file operand");
else if (args.length == 1) return cberr(`missing destination file operand after '${args[0]}'`);
if (args.length < 2) {
	cberr("Too few args given");
	return;
}
let topatharg = getFullPath(args.pop(), cur_dir);
//»
let destret = await pathToNode(topatharg);

//Failure conditions...«

if (globals.read_only) return cberr("Read only");

if ((args.length > 1) && (!destret || (destret.appName != FOLDER_APP))) {
	cberr(`invalid destination path: ${topatharg}`);
	return;
}
else if (args.length===1){
//This allows a destination to be clobbered if the name is in the folder.
//Only if the file is explicitly named, does this error happen.
	if (!force && destret && destret.appName != FOLDER_APP) {
//log(cberr);
		cberr(`${com}: ${topatharg}: not clobbering the destination`);
		return;
	}
}
if (destret && destret.type == FS_TYPE) {
	if (!check_fs_dir_perm(destret, is_root)) {
		no_move_all();
		return cberr(`${topatharg}: permission denied`);
	}
}
//»
for (let arg of args){//«

	let path = getFullPath(arg, cur_dir);
	if (!path) {
		mvarr.push({ERR: `getFullPath: returned null for: ${arg}!!!`});
		continue;
	}

	let srcret = await pathToNode(path, true);

	if (!srcret) {
		if (no_move_cb) no_move_cb(icon_obj[path]);
		mvarr.push({ERR: `${com}: no such entry: ${path}`});
		continue;
	}
	let srctype = srcret.type;
	let isfolder = srcret.appName === FOLDER_APP;
	if (srcret.treeroot || (srcret.root == srcret && srcret.type!==MOUNT_TYPE)) {
		if (no_move_cb) no_move_cb(icon_obj[path]);
		mvarr.push({ERR: `${com}: skipping top level directory: ${path}`});
	}
	else if (srctype == MOUNT_TYPE && !if_cp) {
		if (no_move_cb) no_move_cb(icon_obj[path]);
		mvarr.push({ERR: `${com}: ${path}: cannot move from the mounted directory`});
	}
	else if (!(srctype == FS_TYPE || srctype == MOUNT_TYPE)) {
		if (no_move_cb) no_move_cb(icon_obj[path]);
		mvarr.push({ERR: `${com}: ${path}: cannot ${verb} from directory type: ${srctype}`});
	}
//No moving of files that are actively being edited
	else if (com==="mv"&&srcret.writeLocked()) {
		if (no_move_cb) no_move_cb(icon_obj[path]);
		mvarr.push({ERR: `${com}: ${path} is "write locked"`});
	}
//No moving of folders that contain files that are actively being edited
	else if (com==="mv"&&isfolder&&srcret.moveLocks.length){
		if (no_move_cb) no_move_cb(icon_obj[path]);
		mvarr.push({ERR: `${com}: ${path} is "move locked"`});
	}
	else if (com==="cp"&&isfolder){
		if (no_move_cb) no_move_cb(icon_obj[path]);
		mvarr.push({ERR: `cp: ${path}: not (currently) copying directories`});
	}
	else if (isfolder && path == globals.desk_path){
		mvarr.push({ERR:`${com}: not modifying the working desktop path: ${path}`});
	}
	else mvarr.push([path, srcret]);

}//»

if (destret && destret.appName == FOLDER_APP && destret.type === FS_TYPE){//«
//if (destret && destret.appName == FOLDER_APP && destret.type === "fs"){
	if (!destret.done) await popDir(destret);
	let kids = destret.kids;
	let okarr=[];
	for (let elm of mvarr){
		if (elm.ERR) {
			okarr.push(elm);
			continue;
		}
		let name = elm[1].name;
		let gotkid = kids[name];
		if (gotkid&&gotkid.appName==FOLDER_APP){
			okarr.push({ERR: `${destret.fullpath}: There is already a folder named '${name}'`});
		}
		else okarr.push(elm);
	}
	mvarr = okarr;
}//»
for (let arr of mvarr) {//«
	if (arr.ERR) {
		gotfail = true;
		werr(arr.ERR);
		continue;
	}
	let frompath = arr[0];
	let fromicon = icon_obj[frompath];
	let topath;
	let todir;
	let node = arr[1];
	let type = node.type;
	let app = node.appName;
	let gotfrom, gotto;
	let savedirpath;
	let savename;
	if (killed) {
		werr("Killed!");
		break;
	}

	if (destret) {//«
		if (destret.appName == FOLDER_APP) {
			topath = topatharg.replace(/\/+$/, "") + "/" + node.name;
			savedirpath = destret.fullpath;
			gotto = `${savedirpath}/${node.name}`;
			savename = node.name;
		} else {
			gotto = topath = topatharg;
			savedirpath = destret.par.fullpath;
			savename = destret.name;
		}
	}
	else {
		topath = topatharg;
		gotto = getFullPath(topath, cur_dir);
		let arr = gotto.split("/");
		savename = arr.pop();
		savedirpath = arr.join("/")
	}//»

	gotfrom = getFullPath(frompath, cur_dir);

	if (!(gotfrom && gotto)) {
		if (!gotfrom) {
			gotfail=true;
			werr(`could not resolve: ${frompath}`);
		}
		if (!gotto) {
			gotfail=true;
			werr(`could not resolve: ${topath}`);
		}
		continue;
	}
	let savedir = await pathToNode(savedirpath);
	if (!savedir) {
		werr(`${savedirpath}: no such directory`);
		continue;
	}
	let savetype = savedir.type;

	if (savetype !== FS_TYPE) {
		werr(`Not (yet) supporting ${verb} to type='${savetype}'`);
		continue;
	}

//"Manual recursion" needed for non HTML5FileSystem folders...

	if (!(type == FS_TYPE) && app === FOLDER_APP){//«
		let nm = savename;
		if (savedir.kids[nm]){
			gotfail=true;
			werr(`refusing to clobber: ${nm}`);
			continue;
		}
		if (dom_objects){
			gotfail=true;
			werr(`${nm}: please copy from the terminal`);
			continue;
		}
		let newpath = `${savedir.fullpath}/${nm}`;
//		if (savetype==FS_TYPE){
//			werr(`Implement recursively copy remote folder '${nm}' to (${FS_TYPE}) '${savedir.fullpath}/'`);
//			continue;
//		}
//		if (!await touchDirProm(newpath)){
		if (!await mkDir(newpath, null, {root: is_root})){
			gotfail=true;
			werr(`${newpath}: there was a problem creating the folder`);
			continue;
		}
		if (Desk) Desk.make_icon_if_new(await pathToNode(newpath));
		werr(`Created: ${newpath}`);
		if (!node.done) await popDir(node);
		let arr = [];	
		let kids=node.kids;
		for (let k in kids){
			if (k=="."||k=="..") continue;
			arr.push(kids[k].fullpath);
		}
		arr.push(newpath);
		let obj = {
			cbok: () => {
			},
			cberr: () => {
				gotfail = true;
			}
		};
//		await this.com_mv(shell_exports, arr, true, null, obj);
		await this.com_mv(arr, {shell_exports, if_cp: true, recur_opts: obj});
		continue;
	}//»
	if (type==MOUNT_TYPE){//«
		let tofullpath = `${savedir.fullpath}/${savename}`;
		let gotbuf = await node.buffer;
		let newnode = await saveFsByPath(tofullpath, gotbuf);
		if (!newnode) {
			werr(`${tofullpath}: There was a problem saving to the file`);
		}
		else{
			if (dom_objects){
				let icons = dom_objects.icons;
				if (icons){
					let fromicon = icons[frompath];
					if (fromicon) {
//JEPOLMNYTH
						fromicon.node = newnode;
					}
				}
			}
		}
		gotfrom = null;
		await move_icon_by_path(gotfrom, gotto, app, {
			node: newnode,
			icon: fromicon,
			win: towin
		});

	}//»
	else if (type==FS_TYPE){//«
		if (savetype !== FS_TYPE) {
			werr(`not (yet) ${com}'ing from type="${FS_TYPE}"`);
			continue;
		}
		if (verb=="move"){
			if (!await move_node(node, savename, savedir)){
				werr(`Could not move from ${frompath} to ${topath}`);
				continue;
			}
		}
		else{
			if (!(node = await copy_node(node, savename, savedir))){
				werr(`Could not copy from ${frompath} to ${topath}`);
				continue;
			}
		}
		if (if_cp) {
			gotfrom = null;
		}
//TUIMN
		if (node.isFile) {
cwarn("DELETE node.appName", node.appName);
			delete node.appName;
		}
		await move_icon_by_path(gotfrom, gotto, app, {
			node,
			icon: fromicon,
			win: towin
		});
	}//»
else{//«
	gotfail=true;
	werr(`Unknown type: ${type}`);
	continue;
}//»

}//»

if (Desk && !dom_objects) Desk.update_folder_statuses();
if (gotfail) {
	cberr && cberr();
	return false;
}
cbok&&cbok();
return true;

}
this.com_mv = com_mv;
//»
const copy_node=async(node, newName, toNode)=>{//«
	let newpath = `${toNode.fullpath}/${newName}`;
	if (util.newPathIsBad(node.fullpath, newpath)) return;
	return saveFsByPath(newpath, await getBlob(node, {binary: true}));
};//»
const move_node = async(node, newName, toNode)=>{//«
	if (util.newPathIsBad(node.fullpath, `${toNode.fullpath}/${newName}`)) return;
	let id = node.id;
	let par = node.par;
	let parid = par.id;
	let saveid = toNode.id;
//	db.init();
	let savename;
	if (newName && (newName !== node.name)){
		savename = newName;
	}
	if (!await db.moveNode(id, parid, saveid, savename)) return cerr("WHYFBSJ");
	delete par.kids[node.name];
	node.name = newName;
	toNode.kids[newName] = node;
	node.par = toNode;
	return true;
};//»

const getBlob = async(node, opts={})=>{//«
	let istext = opts.text;
	let id = node.id;
	let file;
//This is guaranteed to be something in /site/
	if (node.type===MOUNT_TYPE){
		let arr = node.fullpath.split("/");
		arr.shift();
		arr.shift();
//		if (arr[0]===PROJECT_ROOT_MOUNT_NAME) arr.shift();
		let url = `/${arr.join("/")}`;
//Not doing dynamic backend stuff
//		if (Number.isFinite(opts.from) && Number.isFinite(opts.to)){
//			url+=`?start=${opts.from}&end=${opts.to}`;
//		}
		let rv = await fetch(url);
		if (!rv.ok){
			return;
		}
		file = await rv.blob();
	}
	else if (node.type==SHM_TYPE){
		file = node._blob;
		if (!file) {
			file = new Blob([]);
			node._blob = file;
		}
	}
	else {
		let bid = node.blobId;
		if (!bid||(bid===NULL_BLOB_FS_TYPE && !opts.getFileOnly)) {
if (!bid){
cerr("No node.blobId!?!?!?", node);
}
			if (!istext) return new Uint8Array();
			return "";
		}
		if (bid===NULL_BLOB_FS_TYPE) {
			return {size: 0};
		}
		if (bid===IDB_DATA_TYPE){
cwarn("The data should already be on the node! (node.data)");
			return this.data;
		}
		let ent = await get_blob_entry(`${bid}`);
		if (!ent) return;
		file = await ent.getFile();
		if (opts.getFileOnly) return file;
	}
	if (!file) return;
	let fmt;
	if (opts.buffer) fmt="arraybuffer";
	else if (istext) fmt = "text";
	else if (opts.blob) fmt="blob";
	else fmt = "bytes";
	let start=0;
	if (opts.start) start = parseInt(opts.start);
	let end;
	if (opts.end) end = parseInt(opts.end);
	return await get_data_from_fs_file(file, fmt, start, end);

};//»
const get_data_from_fs_file=(file,format,start,end)=>{//«
	return new Promise(async(Y,N)=>{
		const OK_FORMATS=["blob","bytes","text","binarystring","dataurl","arraybuffer"];
		const def_format="arraybuffer";
		if (!format) {
cwarn("Format not given, defaulting to 'arraybuffer'");
			format=def_format;
		}
		if (!OK_FORMATS.includes(format)) return N(`Unrecognized format: ${format}`);
		let reader = new FileReader();
		reader.onloadend = function(e) {
			let val = this.result;
			if (format==="blob") return Y(new Blob([val],{type: "blob"}));
			if (format==="bytes") return Y(new Uint8Array(val));
			return Y(val);
		};
		if (Number.isFinite(start)) {
			if (file.slice) {
				if (Number.isFinite(end)) file = file.slice(start, end);
				else file = file.slice(start);
			}
		}
		if (format==="text") reader.readAsText(file);
		else if (format=="binarystring") reader.readAsBinaryString(file);
		else if (format=="dataurl") reader.readAsDataURL(file);
		else reader.readAsArrayBuffer(file);
	});
};//»

const get_blob_dir=async ()=>{//«
let opfs = await navigator.storage.getDirectory();
let blobDir = await opfs.getDirectoryHandle('blobs', {create: true});
return blobDir;
};//»
const get_blob_entry = async(name)=>{//«
	if (!BLOB_DIR) BLOB_DIR = await get_blob_dir();
	return await BLOB_DIR.getFileHandle(name, {create: true});
};//»
const writeFile = async(path, val, opts = {}) => {//«
	let invalid = () => {
		cerr(`Invalid path: ${path}`);
	};
	if (!(path && path.match(/^\x2f/))) return invalid();
	let arr = path.split("/");
	arr.shift();
	let rootdir = arr.shift();
	if (!rootdir) return invalid();
	let exists = await pathToNode(path);
	if (exists && opts.newOnly){
		if (opts.reject) throw new Error(`The file exists (have 'newOnly')`);
		else return false;
	};
	if (root_dirs.includes(rootdir)||path.match(/\/dev\/shm/)){
		let node = await saveFsByPath(path, val, opts);
		if (!(exists || opts.noMakeIcon)) {
			move_icon_by_path(null, path, node.appName, {node});
		}
		return node;
	}
	if (rootdir === "dev"){
		let name = arr.shift();
		if (name==="null"){}
		else if (name==="log") console.log(val);
		return true;
	}
cerr("Invalid or unsupported root dir:\x20" + rootdir);
}//»
const writeNewFile=(path, val, opts = {})=>{//«
	opts.newOnly = true;
	return writeFile(path, val, opts)
};//»
const writeDataFile=(path, val, opts = {})=>{//«
	if (!(isObj(val) && isStr(val.type))){
cerr(`${path}: Expected an object with a 'type' field! (for inline data storage)`);
		return;
	}
	opts.data = val;
	return writeFile(path, val, opts)
};//»
const saveFsByPath=async(path, val, opts={})=>{//«

if (globals.read_only) return;

let blob;
let node = await pathToNode(path);
if (!node) {
	let patharr = path.split("/");
	let fname = patharr.pop();
	let parpath = patharr.join("/");
	let parobj = await pathToNode(parpath);
	if (!parobj) return [null, `${parpath}: Bad parent path`];
	node = await touchFile(parobj, fname, opts);
	let ext = util.getNameExt(fname)[1];
	node.ext = ext;
//DHYUI
	node.appName = util.extToApp(ext);
}
else if (opts.data){
return [null, "Use node.setValue instead of saveFsByPath!"]
//	if (!await db.setNodeData(node.id, opts.data)) {
//cerr("Could not set node data", node);
//		return;
//	}
}

if (node.blobId===NULL_BLOB_FS_TYPE){//«
	if (!await node.getRealBlobId()){
cerr(`saveFsByPath(${path}): could not get a real blob id!?!?!`);
return;
	}
}//»

if (opts.getEntry||opts.data) {
	return node;
}

blob = toBlob(val);
if (!blob){
cerr(`${path}: Unknown type in saveFsByPath`);
log(val);
	return;
}
opts.node = node;
let rv = await write_blob(await node.entry, blob, opts);

node.size = rv.size;
if (opts.retObj) {
	rv.node = node;
	return rv;
}
return node;

}//»
const makeHardLink = async(parobj, name, blobid) =>{//«
	if (!parobj.done) await popDir(parobj);
	let kids = parobj.kids;
	if (kids[name]) {
cwarn("GOTERMPT");
		return kids[name];
	}
	let parid = parobj.id;
	let rv;
//	db.init();
	let id = await db.createNode(name, FILE_FS_TYPE, parid, blobid);
	if (!id) return cerr("JEMEMEMEIOU");

	let kid = mk_dir_kid(parobj, name);

	kid.blobId = blobid;
	kid.id = id;
	kids[name] = kid;
	return kid;
};//»
const touchFile = async(parobj, name, opts={})=>{//«

	if (globals.read_only)return;

	if (!parobj.done) await popDir(parobj);
	let kids = parobj.kids;
	if (kids[name]) {
		return kids[name];
	}
	let parid = parobj.id;
	let rv;
	let id;
	let is_shm;
	if (is_shm = parobj.type==SHM_TYPE){
	}
	else {
		if (opts.data) {
			let val = opts.data;
			if (!(isObj(val) && isStr(val.type))){
cerr(`${name}: Expected an object with a 'type' field! (for inline data storage)`);
				return;
			}
			id = await db.createNode(name, IDB_DATA_TYPE, parid, val);
		}
		else id = await db.createNode(name, NULL_BLOB_FS_TYPE, parid);
		if (!id) return cerr("ADBNYURL");
	}
	let kid = mk_dir_kid(parobj, name);

	if (is_shm){
	}
	else if (opts.data) {
		kid.blobId = IDB_DATA_TYPE;
		kid.data = opts.data;
	}
	else kid.blobId = NULL_BLOB_FS_TYPE;
	kid.id = id;
	kids[name] = kid;
	return kid;

};//»
const mkFile = async (path, opts) => {//«
	if (!(path && path.match(/^\x2f/))){
cerr("Need a full path");
		return;
	}
	let arr = await path.toParNodeAndName(path);
	if (!arr) return;
	return touchFile(arr[0], arr[1], opts);
};//»

const write_blob = async(fent, blob, opts={}) => {//«
	if (globals.read_only) return;
	let{
		append,
		node
	} = opts;
	let f;
	if (node){
		if (node.type==SHM_TYPE){
			if (append&&node._blob) blob = new Blob([node._blob, blob]);
			node._blob = blob;
			return {size: blob.size};
		}
		f = await opts.node._file;
	}
	let writer = await fent.createWritable({keepExistingData: append});
	if (append) writer.seek(f.size);
	await writer.write(blob);
	await writer.close();
	return {size: blob.size};
}
//»

const mkDir=async(parpatharg, name, opts={})=>{//«
	if (globals.read_only)return;
	let if_no_make_icon = opts.noMakeIcon; 
	let parpath;
	if (isObj(parpatharg)) parpath = parpatharg.fullpath;
	else parpath = parpatharg;
	if (name===null||name===undefined){
		let arr = parpath.split("/");
		name = arr.pop();
		parpath = arr.join("/");
	}
	let fullpath = `${parpath}/${name}`.regpath();
	let parobj = await pathToNode(parpath);
	if (!parobj) return;
	let no_db = false;
	if (parobj.type!==FS_TYPE) {
		if (parobj.type==SHM_TYPE) no_db = true;
		else return;
	}
	if (await pathToNode(fullpath)){//«
		let kid = parobj.kids[name];
		if (kid) return kid;
cwarn(`WHY IS THERE NO PAROBJ.KIDS in mkDir AFTER SUCCESSFULLY GETTING PATHTONODE("${fullpath}") ???`);
		kid = await try_get_kid(name, parobj);
		if (kid){
			parobj.kids[name] = kid;
			return kid;
		}
cerr(`Got NO KID after try_get_kid in mkDir("${parpatharg}","${name}"), WITH ARGS BELOW`);
log("NAME", name);
log("PAROBJ",parobj);
		return;
	}//»
	let id;
	if (!no_db) {
		let parid = parobj.id;
		if (!parid) return cerr("GEJ76GF");
		id = await db.createNode(name, DIRECTORY_FS_TYPE, parid);
		if (!id) return cerr("DEYBGJTU");
	}
	let kid = mk_dir_kid(parobj, name, {isDir: true});
	kid.id = id;
	parobj.kids[name] = kid;

	if (Desk&&!if_no_make_icon) Desk.make_icon_if_new(kid);
	return kid;

};//»
const makeLink=async(parobj, name, target, fullpath)=>{//«
	if (globals.read_only)return;
	let parid = parobj.id;
	let rv;
//	db.init();
	let id = await db.createNode(name, LINK_FS_TYPE, parid, target);
	if (!id) return cerr("ENHYTDJ");
	let kid = mk_dir_kid(parobj, name, {
		isLink: true,
		size: target.length,
	});
	kid.symLink = target;
	kid.id = id;
	parobj.kids[name]=kid;
	if (Desk) Desk.make_icon_if_new(kid);
	return kid;
};//»

const checkDirPerm=async(path_or_obj,opts={})=>{//«
	let obj;
	if (isStr(path_or_obj)){
		obj = await pathToNode(path_or_obj);
		if (!obj) return Y(false);
	}
	else obj = path_or_obj;
	return check_fs_dir_perm(obj, opts.root, opts.sys, opts.user);
};//»

//»
//Init/Populate/Mount Dirs«

const mount_dir=(list, par)=>{//«
	let kids = par.kids;
	for (let i=0; i < list.length; i++){
		let arr = list[i].split("/");
		let nm = arr[0];
		let sz = arr[1];
		if (sz){
			let node = mk_dir_kid(par, nm, {size: parseInt(sz)});
			kids[nm] = node;
		}
		else {
			let dir = mk_dir_kid(par, nm, {isDir: true});
			mount_dir(list[i+1], dir);
			kids[nm] = dir;
			i++;
		}
	}
};//»
const try_make_site_dir=async()=>{//«
	mount_tree("site", MOUNT_TYPE);
	let rv = await fetch(`/list.json`);
	if (!rv.ok){
		cwarn("Could not get list.json for /site");
		return;
	}
	let list = await rv.json();
	mount_dir(list, root.kids.site);
};//»

/*
const mountDir = async (name) => {//«
    let mntdir = root.kids.mnt;
    let mntkids = mntdir.kids
    if (!name) return "Mount name not given!";
    if (!name.match(/^[a-z][a-z0-9]*$/i)) return "Invalid mount name!";
	if (mntkids[name]) return `${name}: Already mounted`;
	let path = `/${name}`;
	let rv = await fetch(`${path}/list.json`);
	if (!rv.ok){
		return `Could not get the listing for '${name}'`;
	}
	let list = await rv.json();
	let mntroot = mk_dir_kid(mntdir, name, {isDir: true});
	mntroot.root = mntroot;
	mntroot._type = MOUNT_TYPE;
	mntkids[name]=mntroot;
	mount_dir(list, mntroot);
	return true;
}//»
*/

const init = async()=>{//«
	if (!await db.init(root, FS_PREF)) {
		throw new Error("Could not initialize the filesystem database");
	}
	rootId = root.id;
//	mount_tree("mnt", "mnt");
	await make_dev_tree();
	for (let name of root_dirs){
		let ret = await make_fs_tree(name);
		if (!ret) return;
		if (name == "tmp") ret.perm = true;
		else ret.perm = false;
		ret.kids['..'] = root;
		root.kids[name] = ret;
	}
	await mkDir("/var","appdata");
	try_make_site_dir();
	return true;
};//»
this.mk_user_dirs=async()=>{//«
	let home_path = `/home/${globals.CURRENT_USER}`;
	globals.home_path = home_path;
	globals.desk_path = `${home_path}/Desktop`.regpath();
	try{
		await mkDir(home_path, null, {root: true, noMakeIcon: true});
		await mkDir(globals.desk_path, null, {root: true, noMakeIcon: true});
		await popDirByPath('/home');
		await popDirByPath(home_path);
	} catch (e) {
cerr(e);
		return;
	}       
	return true;
}           
//»

const mk_dir_kid = (par, name, opts={}) => {//«
	let is_dir = opts.isDir;
	let is_link = opts.isLink;
	let is_data = opts.isData;
	let mod_time = opts.modTime;
	let path = opts.path;
	let fullpath = `${path}/${name}`;
	let file = opts.file;
	let ent = opts.entry;

	let kid;
	if (opts.useKid) kid = opts.useKid;
	else {
		kid = new Node({
			name: name,
			par: par,
			root: par.root,
			isData: is_data,
			isDir: is_dir,
			isLink: is_link,
			isFile: !(is_data||is_dir||is_link)
//			path: path
		});
	}
//log(kid);
	if (is_dir) {
		kid.appName = FOLDER_APP;
		if (par.par.treeroot == true) {
			if (par.name == "home") kid.perm = name;
			else if (par.name == "var" && name == "cache") kid.readonly = true;
		}
		let kidsobj = kid.kids || {'..': par};
		kidsobj['.'] = kid;
		kid.kids = kidsobj;
		kid.moveLocks=[];
		set_rm_move_lock(kid);
	}
	else if (is_link) {
		kid.appName=LINK_APP;
	}
	else if (is_data){
//		kid.isData = true;
	}
	else {
//		kid.isFile = true;
		kid.ext = util.getNameExt(name)[1];
		let app = util.extToApp(name);
		kid.appName = app;
		add_lock_funcs(kid);
		kid.size = opts.size;
	}	
	
	kid.file = file;
	return kid;
}
this.mk_dir_kid = mk_dir_kid;
//»

const popDir = (dirobj, opts = {}) => {return populate_dirobj(dirobj, opts);};
const popDirByPath=(patharg, opts={})=>{return populate_dirobj_by_path(patharg, opts);};
const mount_tree=(name, type, pararg)=>{//«
	let dir = new Node({
		name: name,
		_type: type,
		kids: {},
		appName: FOLDER_APP,
		isDir: true,
		sys: true,
//		fullpath: `/${name}`,
		par: pararg||root
	});
	if (!pararg) dir._path = "/";
	else dir._path = dir.par.fullpath;
if (pararg) pararg.kids[name]=dir;
else root.kids[name]=dir;
	dir.root=dir;
//	dir.kids['.']=dir;
	return dir;
}//»
const make_fs_tree = async name => {//«
	const new_root_tree = (name, type) => {//«
		return new Node({
			appName: FOLDER_APP,
			isDir: true,
			name: name,
			kids: {},
			_type: FS_TYPE,
			par: root
		});
	};//»
	let dirstr = null;
	let tree = new_root_tree(name);
	let kids = tree.kids;
	tree.root = tree;
	kids['..'] = root;
	root.kids[name] = tree;
	let rv = await db.getNodeByNameAndParId(name, rootId);
	if (!check_db_rv(rv)) return;
	let rows = rv.rows;
	if (rows.length){
		tree.id = rows[0].id;
		return tree;
	}
	rv = await db.createNode(name, DIRECTORY_FS_TYPE, rootId);
	if (!rv) return;
	tree.id = rv;
	return tree;
};//»
const make_dev_tree = ()=>{//«
	let par = mount_tree("dev", "dev");
	let kids = par.kids;
	let arr = ["null", "log"];
	for (let name of arr){
		let kid = new Node({
			name: name,
			appName: "Device",
			par,
			root: par
		});
		kid.root = par;
		kids[name]=kid;
	}   
	let shm = mk_dir_kid(par, "shm", {isDir: true});
	shm.root = shm;
	shm._type = "shm";
	shm.perm = true;
	shm.done = true;
	kids["shm"] = shm;

	par.done=true;
	par.longdone=true;
};//»

const populate_dirobj_by_path = async(patharg, opts={}) => {//«
	let obj = await pathToNode(patharg);
	if (!obj) return cerr(`${patharg}: not found`);
	if (obj.appName !== FOLDER_APP) return cerr(`${patharg}: not a directory`);
	if (obj.done){
		if (opts.long && obj.longdone) return obj.kids;
		else return obj.kids;
	}
	return populate_dirobj(obj, opts);
};
//»
const populate_dirobj = async(dirobj, opts = {}) => {//«
	if (dirobj.type == FS_TYPE) return populate_fs_dirobj(dirobj, opts);
	return dirobj.kids;
}//»
const populate_fs_dirobj = async(parobj, opts={}) => {//«

let path = parobj.fullpath;
let kids = parobj.kids;
let rv;
//db.init();
let dirid = parobj.id;
rv = await db.getAll(dirid);
if (!check_db_rv(rv)) {
cerr(`getAll failure for id: ${dirid}`);
	return 
}
let rows = rv.rows;
for (let obj of rows){
	let {id, name, type, value} = obj;
	let isLink = type == LINK_FS_TYPE;
	let isData = type == IDB_DATA_TYPE;
	let kid = mk_dir_kid(parobj, name, {
		isDir: (type == DIRECTORY_FS_TYPE),
		isLink,
		isData
	});
	kid.id = id;
	if (isLink){
		kid.symLink = value;
	}
	else if (isData){
		kid.blobId = IDB_DATA_TYPE;
		kid.data = value;
	}
	else{
		kid.blobId = value;
	}
	kids[name] = kid;
	if (kid.appName==="Application") kid.appicon = await kid.text;
}

parobj.done=true;
return kids;

}//»

/*«This is old stuff (mounting backend folders onto /mnt) that was replaced by a
//single /site dir which uses a backend generated "list.json" file, that is
//created each time that the local repo is synced to github. This old method
//requires a dynamic backed (Node.js).

const populate_rem_dirobj = async(patharg, cb, dirobj, opts = {}) => {//«
	let holdpath = patharg;
	let parts = patharg.split("/");
	parts.shift();
	parts.shift();
	let baseurl;
	if (patharg.match(/^\/www\/?/)){
		baseurl = "";
	}
	else if (patharg.match(/^\/mnt\/?/)) {
		parts.shift();
		baseurl = dirobj.root.origin;
	}
	else return cerr(`patharg must begin with '/mnt' or '/www' (got '${patharg}')`);

	let path = parts.join("/");
	if (!path) path="/";
	let rv;
	let url = `${baseurl}/_getdir?path=${path}`;
	try {
		rv = await fetch(url);
	}
	catch(e){
		cb(null, `could not fetch: ${url}`);
		return;
	}
	if (!rv.ok) return cb(null, `response not "ok": ${url}`);
	
	let ret;
	let text = await rv.text();
	try{
		ret = JSON.parse(text);
	}
	catch(e){
		cb(null, `JSON parse error in response from: ${url} (see console)`);
log(text);
		return;
	}
	let kids = dirobj.kids;
	let par = dirobj;
	dirobj.checked = true;
	dirobj.done = true;
	for (let k of ret) {
		if (k.match(/^total\x20+\d+/)) continue;
		let arr = k.split(" ");
		arr.shift(); //permissions like drwxrwxrwx or-rw-rw-r--
		if (!arr[0]) arr.shift();
		arr.shift(); //Some random number
		while (arr.length && !arr[0]) arr.shift();

		let sz_str = arr.shift();
		let sz = strNum(sz_str);
		let ctime;
		let mtime = arr.shift();
		let tm;
		if (mtime=="None"&&ctime) {
			mtime = ctime;
			tm = parseInt(mtime);
		}
		else tm  = parseInt(mtime);
		if (isNaN(tm)) {
cwarn(`populate_rem_dirobj(): skipping entry: ${k} (bad "mtime"=${mtime})`);
			continue;
		}
		let use_year_before_time = Date.now() / 1000 - (86400 * MAX_DAYS);
		let timearr = (new Date(tm * 1000) + "").split(" ");
		timearr.shift();
		timearr.pop();
		timearr.pop();
		let tmstr = timearr[0] + " " + timearr[1].replace(/^0/, " ") + " ";
		if (tm < use_year_before_time) tmstr += " " + timearr[2];
		else {
			let arr = timearr[3].split(":");
			arr.pop();
			tmstr += arr.join(":");
		}
		let fname = arr.join(" ");
		let isdir = false;
		if (fname.match(/\/$/)) {
			isdir = true;
			fname = fname.replace(/\/$/, "");
		}
		let kidobj = mk_dir_kid(dirobj, fname,{
			isDir: isdir,
			size: sz,
			modTime: tmstr,
//			path: holdpath
		});
		kidobj.modified = tm;
		kidobj.created = ctime;
		kids[fname] = kidobj;
	}
	cb(kids);
}
//»

»*/

//»
//External Blobs/Files«

const FileSaver=function(){//«

let cwd;
let fname;
let basename;
let fullpath;
let ext;
let file;
let fSize;
let fEnt; /*This is always what is being written to,and depends on the FileSystem API*/ 
let fObj;

let bytesWritten = 0;
let curpos = 0;
let update_cb, done_cb, error_cb;
let stream_started = false, stream_ended = false;
let saving_from_file = false;
let cancelled = false;
const cerr=str=>{if(error_cb)error_cb(str);else cerr(str);};
const get_new_fname = (cb, if_force) => {//«
	const check_fs_by_path = async(fullpath, cb) => {
		if (!fullpath.match(/^\x2f/)) {
cerr("NEED FULLPATH IN CHECK_FS_BY_PATH");
			cb();
			return;
		}
		if (await pathToNode(fullpath)) return cb(true);
		cb(false);
	}
	if (!basename) return cerr("basename is not set!");
	let iter = 0;
	const check_and_save = (namearg) => {
		if (iter > 10) return cerr("FileSaver:\x20Giving up after:\x20" + iter + " attempts");
		let patharg = (cwd + "/" + namearg).regpath();
		check_fs_by_path(patharg, name_is_taken => {
			if (name_is_taken && !if_force) return check_and_save((++iter) + "~" + basename);
			cb(namearg);
		});
	};
	check_and_save(basename);
};//»
const append_slice=async(slice)=>{//«
	let writer = await fEnt.createWritable();
	await writer.seek(curpos);
	await writer.write(slice);
	await writer.close();
	return curpos+slice.size;
}//»
const save_file_chunk = async(blobarg, cbarg) => {//«

	if (cancelled) return cwarn("Cancelled!");
	let slice;
	if (blobarg) slice = blobarg;
	else if (file) slice = file.slice(curpos, curpos + FILE_SAVER_SLICE_SZ);
	else {
cerr("save_file_chunk():No blobarg or file!");
		return;
	}
//	let lenret = await append(fEnt, slice);
	let lenret = await append_slice(slice);
	if (blobarg) {
		bytesWritten += blobarg.size;
		if (update_cb) {
			if (fSize) update_cb(Math.floor(100 * bytesWritten / fSize));
			else update_cb(bytesWritten);
		}
		if (cbarg) cbarg();
		return;
	} 
	curpos += FILE_SAVER_SLICE_SZ;
//	if (thisobj.position < fSize) {
	if (lenret < fSize) {
//		if (update_cb) update_cb(Math.floor(100 * thisobj.position / fSize));
		if (update_cb) update_cb(Math.floor(100 * lenret / fSize));
		save_file_chunk();
	} 
	else {
		if (done_cb) done_cb();
	}
};//»

this.set_cb=(which,cb)=>{if(which=="update")update_cb=cb;else if(which=="done")done_cb=cb;else if(which=="error")error_cb=cb;else cerr("Unknown cb type in set_cb:"+which);};
this.set_cwd = async(arg) => {//«
	if (!(arg && arg.match(/^\x2f/))) {
cerr(`Invalid cwd: ${arg} (must be a fullpath)"`);
		return;
	}
	let [ret] = await path_to_node(arg);
	if (!(ret && ret.appName == FOLDER_APP)) {
cerr(`Invalid directory path: ${arg}`);
		return;
	}
	cwd = arg;
	return ret;
};//»
this.set_fsize=(arg)=>{if(!(isInt(arg)&& ispos(arg)))return cerr("Need positive integer for fSize");fSize=arg;};
this.set_ext=(arg)=>{if(!(arg&&arg.match(/^[a-z0-9]+$/)))return cerr("Invalid extension given:need /^[a-z0-9]+$/");ext=arg;};
this.set_filename = (arg, if_force) => {//«
return new Promise((Y,N)=>{
	if (!cwd) {
		Y();
cerr("Missing cwd");
		return
	}
	if (!arg) arg = "New_File";
	arg = arg.replace(/[^-._~%+:a-zA-Z0-9 ]/g, "");
	arg = arg.replace(/\x20+/g, "_");
	if (!arg) arg = "New_File";
	basename = arg;
	get_new_fname(ret => {
		if (!ret) return Y();
		fname = ret;
		fullpath = (cwd + "/" + fname).regpath();
		Y(fname);
	}, if_force)
});
};//»

this.set_fent = async(cb) => {//«

let arr = fullpath.split("/");
let fname = arr.pop();
let parpath = arr.join("/");
let parobj = await pathToNode(parpath);
if (!parobj) return cb(null, "No parent object!");
if (parobj.kids[fname]) return cb(null,`${fname}: the name is already taken`);

let node = await saveFsByPath(fullpath, null, {getEntry: true});
if (!(node&&node.entry)) return cb(null, `${fullpath}, Could not get the file entry`);

fObj = node;
fEnt = await node.entry;
fObj.lockFile();
cb(fObj);

};//»
this.save_from_file = (arg) => {//«
	if (saving_from_file) return cerr("Already saving from a File object");
	if (stream_started) return cerr("Already saving from a stream");
//	if (!writer) return cerr("No writer is set!");
	saving_from_file = true;
	fSize = arg.size;
	file = arg;
	if (!update_cb) cwarn("update_cb is NOT set!");
	if (!done_cb) cwarn("done_cb is NOT set!");
//	save_file_chunk();
	setTimeout(()=>{
		save_file_chunk();
	},0);
};//»
this.start_blob_stream=()=>{//«
	if(stream_started)return cerr("blob stream is already started!");
	if(saving_from_file)return cerr("Already saving from a File object");
//	if(!writer)return cerr("No writer is set!");
	if(!fEnt)return cerr("No file entry is set!");
//	if(!fSize)cwarn("fSize not set,so can't call update_cb with percent update,but with bytes written");
//	if(!update_cb)cwarn("update_cb is NOT set!");
//	if(!done_cb)cwarn("done_cb is NOT set!");
	stream_started=true;
};//»
this.append_blob = (arg, cb) => {//«
	/* If no fSize is set,we can call update_cb with the number of bytes written */
	if (stream_ended) return cerr("The stream is ended!");
	if (!stream_started) return cerr("Must call start_blob_stream first!");
	if (!(arg instanceof Blob)) return cerr("The first arg MUST be a Blob!");
	setTimeout(()=>{
		save_file_chunk(arg, cb);
	},0);
};//»
this.end_blob_stream = () => {//«
	stream_ended = true;
	if (fObj) fObj.unlockFile();
	if (done_cb) done_cb();
};//»
this.cancel = (cb) => {//«
//	cwarn("Cancelling... cleaning up!");
	cancelled = true;
	fEnt.remove(() => {
//		cwarn("fEnt.remove OK");
		cb();
	}, () => {
		cerr("fEnt.remove ERR");
		cb();
	});
};//»

}
this.FileSaver=FileSaver;
//»

const event_to_files = (e) => {//«
	var dt = e.dataTransfer;
	var files = [];
	if (dt.items) {
		for (var i = 0; i < dt.items.length; i++) {
			if (dt.items[i].kind == "file") files.push(dt.items[i].getAsFile());
		}
	} else files = dt.files;
	return files;
}
this.event_to_files = event_to_files;
//»
this.drop_event_to_bytes = (e, cb) => {//«
	let file = event_to_files(e)[0];
	if (!file) return cb();
	let reader = new FileReader();
	reader.onerror = e => {
		cerr("There was a read error");
		log(e);
	};
	reader.onloadend = function(ret) {
		let buf = this.result;
		if (!(buf && buf.byteLength)) return cb();
		cb(new Uint8Array(buf), file.name);
	};
	reader.readAsArrayBuffer(file);
}//»

const read_file_stream = (fullpath, cb) => {//«
	get_local_file(fullpath, ret=>{
		if (ret) cb(ret);
		cb(true);
	}, {}, cb);
}//»
const get_local_file = async (patharg, cb, opts={}, stream_cb) => {//«

let done=false;
const getchunk=async()=>{
	if (done) return;
	let endbyte;
	if (!stream_cb) endbyte="end";
	else {
		endbyte = gotbytes + chunk_sz;
		if (endbyte >= sz) endbyte = sz;
	}
	rv = await fetch(`${url}&range=${gotbytes}-${endbyte}`);
	if (!rv.ok) return cb();
	let blob;
	if (opts.text) blob = await rv.text();
	else blob = await rv.blob();
	if (stream_cb) stream_cb(blob);
	else{
		cb(blob);
		return;
	}
	gotbytes+=blob.size;
	if (gotbytes>=sz) {
		done=true;
		cb();
	}
}
if (stream_cb) stream_cb(null, getchunk);

let fobj = await pathToNode(patharg);
let parts = fobj.fullpath.split("/");
parts.shift();
parts.shift();
parts.shift();

let url = util.locUrl(fobj.root.port, parts.join("/"));
let rv = await fetch(`${url}&getsize=1`);
if (!rv.ok) return cb();
let sz = parseInt(await rv.text());
if (stream_cb) stream_cb(null,null, sz);
else if (sz > MAX_LOCAL_FILE_SIZE) return cb();
let chunk_sz = MB;
let gotbytes = 0;
getchunk();

}//»

//»
//Util«

const get_blob_id = () => {//«
	let gotid = localStorage['nextBlobId'];
	if (gotid) gotid = parseInt(gotid);
	else gotid = FIRST_BLOB_ID;
	gotid++;
	localStorage['nextBlobId'] = gotid;
	return gotid;
};//»
const get_keys = obj => {//«
	var arr = Object.keys(obj);
	var ret = [];
	for (var i = 0; i < arr.length; i++) {
		if (obj.hasOwnProperty(arr[i])) ret.push(arr[i]);
	}
	return ret;
}//»
const check_db_rv = (rv, if_log)=>{//«
    if (!(rv.rows||rv.message)) {
cwarn(rv);
//        cberr("Unknown return value");
        return false;
    }   
    if (!rv.message) {
//log(rv);
let rows = rv.rows;
//log(rv); 
if (if_log) {
for (let row of rows){
log(row);
}
}
        return true;
    }   
cerr(rv.message)
//    cberr("FAIL");
    return false;
}//»

const check_fs_dir_perm = (obj, is_root, is_sys, userarg) => {//«
	if (is_sys) return true;
	let iter = 0;
	while (obj.treeroot !== true) {
		iter++;
		if (iter >= 10000) throw new Error("UMWUT");
		if (obj.readonly){
			if (is_sys) return true;
			return false;
		}
		if ("perm" in obj) {
			let perm = obj.perm;
			if (perm === true) {
				return true;
			}
			else if (perm === false) {
				if (is_root) return true;
				return false;
			}
			else if (isStr(perm)) {
				if (is_root) return true;
//				let checkname = userarg || Core.get_username();
				let checkname = userarg || globals.CURRENT_USER;
				return (checkname === perm);
//				return (Core.get_username() === perm);
			}
			else {
cerr("Unknown obj.perm field:", obj);
			}
		}
		obj = obj.par;
	}

	if (is_root) return true;
	return false;
};
this.check_fs_dir_perm=check_fs_dir_perm;
//»

const add_lock_funcs=kid=>{//«
	let lock = {};
	kid.unlockFile =()=>{
		delete LOCKED_BLOBS[kid.blobId];
		let par = kid.par;
		while (par){
			if (par.type) break;
			par.rmMoveLock(lock);
			par = par.par;
		}
	};
	kid.lockFile = async () =>{
		if (kid.blobId === NULL_BLOB_FS_TYPE){
			await kid.getRealBlobId();
		}
		LOCKED_BLOBS[kid.blobId] = kid.blobId;
		let par = kid.par;
		while (par){
			if (par.type) break;
			par.moveLocks.push(lock);
			par = par.par;
		}
	};
};//»
const set_rm_move_lock =obj=>{//«
	let locks = obj.moveLocks;
	obj.rmMoveLock=lockarg=>{
		for (let i=0; i < locks.length; i++){
			if (locks[i]===lockarg){
				locks.splice(i, 1);
				break;
			}
		}
	}
};//»

const get_time_str_from_file = file =>{//«
	let now = Date.now();
	let use_year_before_time = now - (1000 * 86400 * MAX_DAYS);
	let tm = file.lastModified;
	let timearr = file.lastModifiedDate.toString().split(" ");
	timearr.shift();
	timearr.pop();
	timearr.pop();
	let timestr = timearr[0] + " " + timearr[1].replace(/^0/, " ") + " ";
	if (file.lastModified < use_year_before_time) timestr += " " + timearr[2];
	else {
		let arr = timearr[3].split(":");
		arr.pop();
		timestr += arr.join(":");
	}
	return timestr;
};//»

const path_to_par_and_name=(path)=>{//«
	let fullpath = getFullPath(path);
	let arr = fullpath.split("/");
	if (!arr[arr.length-1]) arr.pop();
	let name = arr.pop();
	if (arr.length==1 && arr[0]=="") return ["/", name];
	return [arr.join("/"), name];
}
this.path_to_par_and_name=path_to_par_and_name;
/*
const path_to_par_and_name = (path) => {
	let fullpath = getFullPath(path);
	let arr = fullpath.split("/");
	if (!arr[arr.length - 1]) arr.pop();
	let name = arr.pop();
	return [arr.join("/"), name];
}
*/
//»

this.set_desk = function(arg) {//«
	Desk = arg;
	move_icon_by_path = Desk.move_icon_by_path;
}//»

//»

this.api = {//«

	init,

	clearStorage,
	makeLink,
	makeHardLink,
	touchFile,
	mkFile,
	saveFsByPath,
	doFsRm,
	mkDir,

	writeFile,
	writeNewFile,
	writeDataFile,

	getBlob,
	getDataFromFsFile: get_data_from_fs_file,

	getBlobDir: get_blob_dir,
	getNodesByBlobId,
	getPathByDirId, 

	comMv,

	popDir,
	popDirByPath,
//	mountDir,

	pathToNode,

	checkDirPerm,

}
NS.api.fs=this.api;
globals.api.fs=this.api;
//»

//}; end FS«
  }
//»

//»


