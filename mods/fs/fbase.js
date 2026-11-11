(()=>{"use strict";const MODNAME="fs.fbase";

const PUB_DIR_NAME = "www";
const PUB_DIR_ID = 1;

//Docs/Schema «

/* Firebase Docs «


Sort data

To retrieve sorted data, start by specifying one of the order-by methods to
determine how results are ordered:

Method	Usage
orderByChild()	Order results by the value of a specified child key or nested child path.
orderByKey()	Order results by child keys.
orderByValue()	Order results by child values.



Filtering data

To filter data, you can combine any of the limit or range methods with an
order-by method when constructing a query.

Method	Usage
limitToFirst()	Sets the maximum number of items to return from the beginning of the ordered list of results.
limitToLast()	Sets the maximum number of items to return from the end of the ordered list of results.
startAt()	Return items greater than or equal to the specified key or value, depending on the order-by method chosen.
startAfter()	Return items greater than the specified key or value depending on the order-by method chosen.
endAt()	Return items less than or equal to the specified key or value, depending on the order-by method chosen.
endBefore()	Return items less than the specified key or value depending on the order-by method chosen.
equalTo()	Return items equal to the specified key or value, depending on the order-by method chosen.
Unlike the order-by methods, you can combine multiple limit or range functions. For example, you can combine the startAt() and endAt() methods to limit the results to a specified range of values.

Limit the number of results

You can use the limitToFirst() and limitToLast() methods to set a maximum
number of children to be synced for a given event. For example, if you use
limitToFirst() to set a limit of 100, you initially only receive up to 100
child_added events. If you have fewer than 100 items stored in your Firebase
database, a child_added event fires for each item.

As items change, you receive child_added events for items that enter the query
and child_removed events for items that drop out of it so that the total number
stays at 100.

»*/

/*Schema w/ folds and comments «

Take out commented lines with:
:'<,'>s/\/\/.*$//
Remove newlines with:
:'<,'>s/^\n\+//

{//«
"rules": {
	".read": false,
	".write": false,
	"LOTW": {
		"prof": {// User-to-user discovery via queries «
			".indexOn": ["updated"], // Also: 'votes'
			".read": "auth != null",
			"$uid": {//«
				".write": "auth != null && auth.uid === $uid",
				".validate": "(!data.exists() && //«
					newData.hasChildren(['updated', 'name', 'picture'])) || 
					(data.exists() && (
						newData.hasChildren(['updated', 'name']) || 
						newData.hasChildren(['updated', 'picture']) || 
						newData.hasChildren(['updated', 'status']) || 
						newData.hasChildren(['updated', 'bio'])
					))",//»
				"updated": {//«
					".validate": "newData.isNumber()" // serverTimestamp()
				},//»
				"name": {//«
					".validate": "newData.isString() && 
						newData.val() === auth.token.name"
				},//»
				"picture": {//«
					".validate": "newData.isString() && 
						newData.val() === auth.token.picture"
				},//»
				"status": {//«
					".validate": "newData.isString() && 
						newData.val().length < 250"
				},//»
				"bio": {//«
					".validate": "newData.isString() && 
						newData.val().length < 2500"
				},//»
				"$other": {//«
					".validate": false
				}//»
			}//»
		},//»
		"user": {// User data is public and lives in their 'www/' folder  «
			"$uid": {
				".write": "auth != null && auth.uid === $uid",
				"www": {//«
					"nextNodeId": {//«
						".read": "auth != null && auth.uid === $uid",
						".validate": "newData.isNumber() && //«
						(
						(data.exists() && newData.val() === data.val() + 1) || 
						(!data.exists() && newData.val() === 1)
						)"//»
					},//»
					"nodes": {//«
						".indexOn": ["parId", "path", "blobId"],
						".read": "auth != null",
						"$nodeid": {//«
							".validate": "data.exists() || 
								newData.hasChildren(['parId', 'type', 'path'])",
							"parId": {//«
								".validate": "newData.isNumber()"
							},//»
							"type": {//«
								".validate": "newData.isString() && 
									newData.val().length < 5"
							},//»
							"path": {//«
								".validate": "newData.isString() && 
									newData.val().length < 100"
							},//»
							"blobId": {//«
								".validate": "newData.isNumber()"
							},//»
							"$other": {//«
								".validate": false
							}//»
						}//»
					},//»
					"blobs": {//«
						".read": "auth != null",
						"$blobid": {//«
							".validate": "newData.hasChildren(['contents'])",
							"contents": {//«
								".validate": "newData.isString() && 
									newData.val().length < 100000"
							},//»
							"$other": {//«
								".validate": false
							}//»
						}//»
					},//»
					"$other": {//«
						".validate": false
					}//»
				},//»
				"$other": {//«
					".validate": false
				}//»
			}
		},//»
		"$other": {//«
			".validate": false
		}//»
	},
	"$other": {//«
		".validate": false
	}//»
}
}//»

»*/

//»

/*11/11/26:«

Need to change it back to false permission.


First, we got rid of references to "groups", like `grpid`, etc

BUG (FIXED)

But now, when we try to make files in another person's 'www/' folder,
it looks liks it was made in that folder, but it actually makes it
in ours.

IT'S BECAUSE WE WERE FORMING THE REF PATHS W/ CUR_USER.UID RATHER THAN
THE UID FROM THE NODE, GOTTEN LIKE:
let uid = node.mntPar.getData("fbaseUid")

»*/

//Notes«

/*11/10/26: Concept simplification«

Let's just get rid of the complexity by making all files children of 
world readable 'pub/'.

Just switched the id for 'pub/' to 1, and for 'prv/' to 2.
Need to get rid of the complex '.read' conditions that look like:

".read": "auth != null && (//«
	($grpid === '1' && auth.uid === $uid) || 
	($grpid === '2') || 
	(auth.uid === $uid ||
		root.child('LOTW').child('user').child($uid).
		child('group').child($grpid).child('members').
		child(auth.uid).val() === true)
	)",//»

and change them to simply:

".read": "auth != null" 

Now that this is done, the code should JUST WORK, even if there is still
some complexity (e.g. in the schema rules) related to concepts like group 
members.

»*/
/*BUG: 11/10/26 «

@UOENADNDM

The parnode's of the "root" nodes (e.g. prv/ and pub/) should have id's of (something like),
0 in the children's path.

If we look at the db for OP_FS_TYPE, we see the root nodes have parId 0 and their
fullpaths look like: 0/def. We need to do the same thing for the 

The nextNodeId's should *NOT* be kept inside of the various branches.
They should be global to all of the branches, just like with the
normal filesystem database.

So we need to change the schema and update the logic that uses/increments
the nextNodeId's.


Starting from scratch, if we make a dir in prv, it has itself as a parent

FIXED: 
WHY DO WE HAVE !data.exists HERE?
This seems to cause the update operation @MSNFJRJKDH to fail.

"type": {//«
	".validate": "!data.exists() && 
		newData.isString() && 
		newData.val().length < 5"
},//»


»*/
/*BUG (FIXED): 11/9/26«

We can't do persistent mv's and we are getting an undefined key in blobs.
Maybe we got this when trying to do a mv operation. It looks like 'cp' might be working
but 'mv' is not working right.

Starting from scratch in the 'prv' directory, we do:
  $ touch ONE
...and we see the new blob w/ blobId = 0

Then we do:

$ mv ONE ONE.mv
... and we get an undefined blob while our node still has the same path (1/ONE).


Fixed:
@HDSJNMJK: We need to do:
let uid = par.mntPar.getData('fbaseUid');
AND
let grpid = par.mntPar.getData('fbaseGrpId');

INSTEAD OF par.getData('...');

»*/
/*11/8/26«

Switch back to main google account for firebase.

Put the new database schema in there.

Test out the schemam

»*/

//»

// Imports «
//const {globals} = LOTW;
const { // api.util «
	isArr,
	isNum,
	isStr,
	isEOF,
	isErr,
	toStr,
	log,
	jlog,
	cwarn,
	cerr
} = LOTW.api.util;//»

// globals

const {// fs (FBASE_USER_MAIN_FS_TYPE, NODE_TYPE's) «
FBASE_USER_MAIN_FS_TYPE,
FBASE_USERS_FS_TYPE,
FBASE_USER_GRP_FS_TYPE,

// File system "node" types

FILE_NODE_TYPE,
DIR_NODE_TYPE,
LINK_NODE_TYPE,

//BAD_LINK_NODE_TYPE,
//NULL_BLOB_NODE_TYPE,

NODE_UPDATE_NAME,
NODE_UPDATE_PAR,
NODE_UPDATE_ID,
NODE_UPDATE_BLOB_ID,
NODE_UPDATE_SIZE,

DIR_UPDATE_ADD,
DIR_UPDATE_DEL,

} = LOTW.globals.fs;//»
const { // firebase «
	appUrl, 
	authUrl, 
	dbUrl 
} = LOTW.globals.firebase;//»

//»
// Var «

const NULL_FBASE_RTDB_BLOB = 0;


let cur_user;
let next_grp_id;

let DirNode, FileNode, _node_update, _dir_update;

let fbase_app_mod;
let fbase_auth_mod;
let fbase_db_mod;
let fbase_app;
let fbase_db;
let fbase_auth;

//const FBASE_USERS_CACHE_PATH = "/var/cache/fbase/users";
//let users_cache_node;

let first_auth_change = false;

let is_populating_users = false;

const MAX_FILE_SIZE_MAP = {
"status": 250,
"bio": 2500
};

//»
//Funcs «

const blobTo64 = (blob) => {//«
	return new Promise((Y, N) => {
		let r = new FileReader();
		r.readAsDataURL(blob);
		r.onloadend = () => {Y(r.result.split(',')[1]);};
		r.onerror = (e) => Y();
	});
};//»

const REF = path => { return fbase_db_mod.ref(fbase_db, path); };
const GET = async(arg)=>{//«
try {
	return await fbase_db_mod.get(arg);
}
catch(e){
cerr(e);
//	return e;
}
};//»
const UPDATE = async(ref, obj)=>{//«

try {
	await fbase_db_mod.update(ref, obj);
	return true;
}
catch(e){
	return e;
}

};//»
const VAL = snap => {//«
	if (!snap){
cerr("NO SNAP");
		return;
	}
	if (!snap.exists()){
cerr("!SNAP.EXISTS()");
		return;
	}
	return snap.val();
};//»
const NEXT_NODE_ID = async() => {//«
	if (!cur_user) return;
	// YURJKFHFN
	return GET(REF(`LOTW/user/${cur_user.uid}/${PUB_DIR_NAME}/nextNodeId`));
};//»

// These functions do all of the "basic" operations that are expected of the
// LOTW filesystem
const mk_dir = async (parnode, name, opts)=>{//«
if (!cur_user) return;

let uid = parnode.mntPar.getData('fbaseUid');
cwarn(`GOT UID: ${uid}`);

let snap = await NEXT_NODE_ID();
let rv = VAL(snap);
if (!isNum(rv)) {
	return;
}
//let next_id = rv;
let next_id = rv + 1;

log(`mk_dir: GOT next_id: ${next_id}`);
if (next_id == parnode.id){
// This means an infinite loop
cwarn(`Why does next_id(${next_id}) === parId(${parnode.id})???`);
return;
}


let obj = {};
//obj["nextNodeId"] = next_id + 1;
obj["nextNodeId"] = next_id;
obj[`nodes/${next_id}`] = {
	parId: parnode.id,
	path: `${parnode.id}/${name}`,
	type: DIR_NODE_TYPE, 
};

rv = await UPDATE(REF(`LOTW/user/${uid}/${PUB_DIR_NAME}`), obj);
if (rv !== true){
cerr("COULD NOT CREATE THE NEW DIR");
	return;
}

let node = new DirNode(name, parnode);
_dir_update(DIR_UPDATE_ADD, parnode, node); // Set parnode.#kids[name]
_node_update(NODE_UPDATE_ID, node, next_id);
return node;

}//»
const mk_new_file = async (parnode, name, opts)=>{//«
	if (!cur_user) return;

	let uid = parnode.mntPar.getData('fbaseUid');
cwarn(`GOT UID: ${uid}`);

	let snap = await NEXT_NODE_ID();
	let rv = VAL(snap);
	if (!isNum(rv)) {
		return;
	}
	let next_id = rv+1;
log(`mk_new_file: GOT next_id: ${next_id}`);

	let obj = {};
//	obj["nextNodeId"] = next_id + 1;
	obj["nextNodeId"] = next_id;
	obj[`nodes/${next_id}`] = {
		parId: parnode.id,
		path: `${parnode.id}/${name}`,
		type: FILE_NODE_TYPE, // Just change this to DIR_NODE_TYPE to make a directory
		blobId: NULL_FBASE_RTDB_BLOB
	};
cwarn("MK_NEW_FILE");
//UOENADNDM
if (next_id == parnode.id){
cerr(`Why does next_id(${next_id}) === parId(${parnode.id})???`);
return;
}

	rv = await UPDATE(REF(`LOTW/user/${uid}/${PUB_DIR_NAME}`), obj);
	if (rv !== true){
cerr("COULD NOT CREATE THE NEW FILE");
		return;
	}

	let node = new FileNode(name, parnode);
	_node_update(NODE_UPDATE_ID, node, next_id); // Set node.#id
	_node_update(NODE_UPDATE_BLOB_ID, node, 0); // Set node.#blobId
	_dir_update(DIR_UPDATE_ADD, parnode, node); // Set parnode.#kids[name]
	return node;

}//»
const get_blob = async (node) => {//«
if (!cur_user) return;
if (node.blobId === 0) return new Blob([]);

/* WEHRJSGRHJ

//HOW TO GET THE BLOB???

*/

let uid = node.mntPar.getData('fbaseUid');
cwarn(`GOT UID: ${uid}`);
let path = `LOTW/user/${uid}/${PUB_DIR_NAME}/blobs/${node.blobId}`;
//cwarn(`PATH: <${path}>`);
let snap =  await GET(REF(path));
if (!snap) {
cerr("NOSNAP");
	return new Blob([]);
}
let val = VAL(snap);
if (!(val && val.contents)) {
cerr("NO SNAP VAL.contents");
	return new Blob([]);
}

let binary_str = atob(val.contents);
let len = binary_str.length;
let bytes = new Uint8Array(len);
for (let i = 0; i < len; i++) bytes[i] = binary_str.charCodeAt(i);
//You can't binary_str directly into the Blob constructor
let blob = new Blob([bytes]);
return blob;
}//»
const set_blob = async (node, blob, opts) => {//«
if (!cur_user) return;

let uid = node.mntPar.getData('fbaseUid');
cwarn(`GOT UID: ${uid}`);
let path = `LOTW/user/${uid}/${PUB_DIR_NAME}`;
let bid = node.blobId;
cwarn("gen_set_blob");
log(node);

let obj = {};
let need_update = false;
//if (!bid) {//«
if (bid === 0) {
// Append is ignored in this case
	bid = (new Date()).getTime(); // milliseconds
//cwarn(`New blobId: ${bid}`);

// WWEURKTOX
// undefined ----vvvvvvv !?!?! 
	obj[`nodes/${node.id}/blobId`] = bid;
	need_update = true;
}//»
else if (opts.append){//«
cwarn("APPEND TO OLD BLOB");
	let get_path = `${path}/blobs/${bid}`;
	let get_ref = REF(get_path);
	let rv = await GET(get_ref);
	let orig_val = VAL(rv);
	if (!(orig_val && orig_val.contents)){
cwarn("COULD NOT GET THE ORIGINAL BLOB FOR APPENDING!!!");
		return;
	}
	blob = new Blob([atob(orig_val.contents), blob]);

}//»
else {
cwarn("UPDATE W/NEW VALUE");
log(blob);
}

cwarn(`HAVE BLOB ID: ${bid}`);
obj[`blobs/${bid}/contents`] = await blobTo64(blob);

//log(`SET THIS OBJ TO: PATH = <${path}>`);
//log(obj);

let ref = REF(path);

let rv = await UPDATE(ref, obj);
if (rv !== true){
cwarn("COULD NOT SET THE BLOB VALUE!!!");
return;
}
if (need_update){
_node_update(NODE_UPDATE_BLOB_ID, node, bid);
}

_node_update(NODE_UPDATE_SIZE, node, blob.size);

return blob;

}//»
const del_node = async (node)=>{//«
if (!cur_user) return;

let node_id = node.id;

let uid = node.mntPar.getData('fbaseUid');
cwarn(`GOT UID: ${uid}`);
let path = `LOTW/user/${uid}/${PUB_DIR_NAME}/nodes`;
let ref = REF(path);
let obj = {};
obj[`${node_id}`] = null;

let rv = await UPDATE(ref, obj);

return rv;

};//»
const update_fullpath = async (node, id, fromId, toId, newName)=>{//«


if (!cur_user) return;

if (newName === undefined) newName = node.name;

let uid = node.mntPar.getData('fbaseUid');
cwarn(`GOT UID: ${uid}`);

let node_type;
if (node.isFile) node_type = FILE_NODE_TYPE;
else if (node.isDir) node_type = DIR_NODE_TYPE;
else {
cerr("Unknown type: NOT isFile or isDir");
return;
}
let nodeobj = {//«
	type: node_type,
	parId: toId,
	path: `${toId}/${newName}`,
};//»

if (node.blobId) nodeobj.blobId = node.blobId;

let path = `LOTW/user/${uid}/${PUB_DIR_NAME}/nodes`;
let ref = REF(path);
let obj = {};
obj[`${id}`] = nodeobj;
let rv = await UPDATE(ref, obj);
log("WHAT IS RV?", rv);
return rv;

};//»


const try_get_fbase_user_grp_kid = async (par, name) => {//«

if (!cur_user) return;

// MAKE SURE WE ARE DOING THIS FOR ALL OF THEM!!!
// HDSJNMJK->vvvvvvvvvvvvvvvvvvvvvvvvv
let uid = par.mntPar.getData('fbaseUid');
if (!uid) {
cerr("NO UID FROM par.getData('fbaseUid')!!!");
log(par);
cwarn("HERE IS par.getData");
log(par.getData);
return;
}
let parid = par.id;
let path = `${parid}/${name}`;

let ref_path = `LOTW/user/${uid}/${PUB_DIR_NAME}/nodes`;
let ref = fbase_db_mod.ref(fbase_db, ref_path);
let c1 = fbase_db_mod.orderByChild('path');
let c2 = fbase_db_mod.equalTo(path);
let c3 = fbase_db_mod.limitToFirst(1);
let q = fbase_db_mod.query(ref, c1, c2, c3);
let snap = await GET(q);
let arr = VAL(snap);
if (!arr) {
cerr("DID NOT GET!");
	return;
}
// Make a FileNode or DirNode

// This loop would only be infinite if the array were empty, which it should never be
let node;
for (let i=0; ; i++){ //«
	if (!arr[i]) continue;
	let obj = arr[i];
	let typ = obj.type;
	let parid = obj.parId;
	let name = (obj.path.split("/"))[1];
	if (typ === FILE_NODE_TYPE){
		node = new FileNode(name, par);
		_node_update(NODE_UPDATE_BLOB_ID, node, obj.blobId);
	}
	else if (typ === DIR_NODE_TYPE){
		node = new DirNode(name, par);
	}
	else{
cerr(`WHAT NODE TYPE??? ${typ}`); // Is this a symlink?
		return;
	}
	_node_update(NODE_UPDATE_ID, node, i); // node.#id is the iterator
	break; // We found want we want!
}//»
_dir_update(DIR_UPDATE_ADD, par, node); // Add to par.#kids
return node;

};//»

//YBNMDAOJ
const populate_fbase_user_grp_dir = async (dir) => {//«
//cwarn("POPULATE USER_GRP_DIR");
// e.g. /mnt/users/user123/pub/, and all subdirs thereof
// dir
if (!cur_user) return;

// The FileNode's will implement:
//	- getBlob
//	- setBlob
// The DirNode's will implement: 
// 	- *this* method for popDir
//	- a method for tryLoadKid that looks up particular nodes by the exact key.

// 
let uid = dir.mntPar.getData('fbaseUid');
let parid = dir.id; // HEJRKTKT: UNDEFINED HARHARHAR
if (!parid){
cerr("NO dir.id:", parid);
log(dir);
return;
}

let ref = fbase_db_mod.ref(fbase_db, `LOTW/user/${uid}/${PUB_DIR_NAME}/nodes`);
let c1 = fbase_db_mod.orderByChild('parId');
let c2 = fbase_db_mod.equalTo(parid);
let q = fbase_db_mod.query(ref, c1, c2); // HOPORNKER
let snap = await GET(q);
if (!snap){
cerr("NO SNAP!?!?!");
return;
}

dir.loadKidsDone = true;

if (!snap.exists()) {
//cwarn("DOES THIS ALWAYS JUST MEAN EMPTY DIRECTORY");
	return;
}
let arr = snap.val();
if (!isArr(arr)) {
	let keys = Object.keys(arr);
	let new_arr = [];
	for (let i=0; i < keys.length; i++){
		let key = keys[i];
		new_arr[parseInt(key)] = arr[key];
	}
	arr = new_arr;
}
for (let i=0; i < arr.length; i++){
let obj = arr[i];
if (!obj) continue;
let node;
let name = (obj.path.split("/"))[1];
if (obj.type === FILE_NODE_TYPE){
	node = new FileNode(name, dir);
	_node_update(NODE_UPDATE_BLOB_ID, node, obj.blobId);
}
else if (obj.type === DIR_NODE_TYPE){
	node = new DirNode(name, dir);
}
else {
cwarn(`WHAT TYPE IS THIS OBJ(${obj.type})???`);
log(obj);
return;
}
//cwarn("NEW NODE", node);
_node_update(NODE_UPDATE_ID, node, i); // node.#id is the iterator
_dir_update(DIR_UPDATE_ADD, dir, node);
}


};//»
const populate_fbase_user_dir = async (user_dir) => {//«
// e.g. /mnt/users/user123/
/*«

Should add FileNode's (status, bio, etc) here, so that the 
owners of that profile can update theirs by writing to them.

All DirNode's should be proper *groups*, implementing:
popDir: populate_fbase_user_grp_dir
tryLoadKid(name): 
	await user_dir.loadKids(); // Calls populate_fbase_user_dir (if needed)
	return user_dir.getKid(name)

»*/

	if (!cur_user) return;
	let uid = user_dir.getData("fbaseUid");
	let prof = user_dir.getData("fbaseProf");
	for (let k in prof) {//«
// These are stored as "files" in user_dir
//		let node = new FileNode(k, user_dir, {
		let node = new FileNode(`${k}.txt`, user_dir, {
			perm: true,
			type: FBASE_USER_MAIN_FS_TYPE,
			data: {
				fbaseUid: uid,
			},
			getBlob: async (node)=>{ 
cwarn(`CALL getBlob for ${k}`);
				let ref = fbase_db_mod.ref(fbase_db, `LOTW/prof/${uid}/${k}`);
				let snap = await GET(ref);
				let val = VAL(snap);
				if (isStr(val)) return new Blob([val]);
				return new Blob([""]);
//				return new Blob([prof[k]]); 
			},
			setBlob: async (node, blob, opts)=>{//«
				if (cur_user && cur_user.uid === uid) {
					if (k === "status" || k === "bio" ) {//«

cwarn(`TRY SET ${k}`);
log(node);
						let path = `LOTW/prof/${cur_user.uid}`;
//return "SO YOU WANT TO SAVE THIS????";
if (opts.append){//«
cwarn("APPEND TO OLD BLOB");

	blob = new Blob([prof[k], blob]);

}//»

						let str = await toStr(blob);
						let max = MAX_FILE_SIZE_MAP[k];
						let diff = blob.size - max;
						if (diff > 0) return `cannot save: ${diff} too many characters!`;

						let ref = REF(path);
						let obj = {};
						obj[`${k}`] = str;
						let rv = await UPDATE(ref, obj);
						if (rv !== true){
cerr(`COULD NOT UPDATE PATH: ${path}`);
							return;
						}
						prof[k] = str; // Just cache this for easy retrieval
						_node_update(NODE_UPDATE_SIZE, node, blob.size);
						return blob;
					}//»
					else {//«
cwarn(`NOT SETTING CONSTANT VALUE: ${k}`);
// This gets printed in red by the shell when trying to redirect to one of these
// "constant" files.
return `fbase.js: not setting constant value: '${k}'`;
					}//»
				}
			}//»
		});
		_dir_update(DIR_UPDATE_ADD, user_dir, node);
	}//»
// YGJDPLKIU
	// Mount the world-readable dir ("www")
	let www_dir = new DirNode(PUB_DIR_NAME, user_dir, {//«
		perm: true,// All permissions in this dir are implemented on the server side, where the database lives
		type: FBASE_USER_GRP_FS_TYPE,
		data: {
			fbaseUid: uid,
		},
		loadKids: populate_fbase_user_grp_dir,
		tryLoadKid: try_get_fbase_user_grp_kid,
		getBlob: get_blob,
		setBlob: set_blob,
		mkDir: mk_dir,
		mkNewFile: mk_new_file,
		backendDelNode: del_node,
		backendUpdateFullPath: update_fullpath
	});
	_dir_update(DIR_UPDATE_ADD, user_dir, www_dir);
	_node_update(NODE_UPDATE_ID, www_dir, PUB_DIR_ID); // Id
//»
	
	user_dir.loadKidsDone = true;

};//»
const populate_fbase_users = async (users_dir) => {//«
//Just the list of user names
// e.g. /mnt/fbase/
if(users_dir.loadKidsDone) return;
if (!cur_user) {
cwarn("NOT LOGGED IN.");
	return;
}
if (is_populating_users) return;
is_populating_users = true;

let ref = fbase_db_mod.ref(fbase_db, "LOTW/prof");

// Constraints
let c1 = fbase_db_mod.orderByChild('updated');  // Or: 'votes', etc.
let c2 =fbase_db_mod.limitToLast(25);
let q = fbase_db_mod.query(ref, c1, c2);

let snap;
try {
	snap = await fbase_db_mod.get(q);
}
catch(e){
// FAIL!!!
cerr(e);
	return;
}

if (!snap.exists()) {
// WEJKRLJS
cwarn("GOT !snap.exists()!!!");
return;
}

let old_obj = {};
let new_obj = snap.val();
for (let uid in new_obj) old_obj[uid] = new_obj[uid];

// These are all DirNode's...

for (let uid in old_obj) {
	let prof = old_obj[uid];
// Also: picture, status, bio, updated[, votes]
	if (!prof['status']) prof['status'] = "[status goes here]";
	if (!prof['bio']) prof['bio'] = "[bio goes here]";
	let name = prof.name;
	let use_name = name.replace(/\s+/g, "").toLowerCase();
//cwarn(`${use_name}`);
	// If 'use_name' already exists as a dirname in /mnt/fbase/, then 
	// just add numbers to the end of it.

	if (users_dir.getKid(use_name)) {
		let iter=1;
// CVXOERHJN
		while (users_dir.getKid(`${use_name}${iter}`)) iter++;
		use_name = `${use_name}${iter}`;
	}
// YFKMYOGJT
	let user_dir = new DirNode(use_name, users_dir, {//«
//		perm: true, // UOIONWEJR
		perm: false, // Cannot update status and bio unless this is true
		type: FBASE_USER_MAIN_FS_TYPE,
		loadKids: populate_fbase_user_dir,
		tryLoadKid: async (arg1, arg2)=>{//«
/*
Since the names of the dirs are currently arbitrarily given, then it makes no
sense to have a literal system of looking up users based on predetermined
dirnames.
*/
//cwarn(`TRY LOAD KID:`);
//log(arg2)
			await user_dir.loadKids();
//			return user_dir.getKid(name);
		},//»
		data: {
			fbaseUid: uid,
			fbaseProf: prof
		},
	});//»
	_dir_update(DIR_UPDATE_ADD, users_dir, user_dir);

}

users_dir.loadKidsDone = true;

is_populating_users = false;

};//»

const get_last_updated_or_create_profile = async () => {//«

if (!cur_user){
cerr(`CALLED get_last_updated_or_create_profile W/ NO CUR_USER!?!?!?`);
return;
}

let uid = cur_user.uid;
let uid_path = `LOTW/prof/${uid}`;
let updated_path = `${uid_path}/updated`;
//log(`GET REF: ${uid_path}`);
let updated_ref = fbase_db_mod.ref(fbase_db, updated_path);
//log(ref);
let snap = await GET(updated_ref);
//log(snap);
if (!snap){
cwarn("GET FAILED");
return;
}
if (snap.exists()) {
//log("LAST UPDATED", snap.val());
	return;
}


cwarn(`NEED TO INITIALIZE USER: ${uid} !!!`);

let ref = fbase_db_mod.ref(fbase_db, "LOTW");
let obj = {};
obj[`prof/${uid}`] = {
	updated: fbase_db_mod.serverTimestamp(),
	name: cur_user.displayName, 
	picture: cur_user.photoURL,
};
//obj[`user/${uid}/nextGrpId`] = 3;


// UKHFAJFUE
// Trying these gives permission denied!?!?!

obj[`user/${uid}/${PUB_DIR_NAME}/nextNodeId`] = 1;
obj[`user/${uid}/${PUB_DIR_NAME}/nodes`] = {};
obj[`user/${uid}/${PUB_DIR_NAME}/blobs`] = {};

/*
obj[`user/${uid}/group/2/nextNodeId`] = 1;
obj[`user/${uid}/group/2/nodes`] = {};
obj[`user/${uid}/group/2/blobs`] = {};
*/
log(obj);

let rv = await UPDATE(ref, obj);

if (rv !== true){
cwarn("THERE WAS A PROBLEM INITIALIZING THE USER PROFILE!!!");
}

// UOEOWEKRJ

//log(rv);
}//»

//»

LOTW.mods[MODNAME] = class {//«

constructor(arg){//«
	DirNode = arg.DirNode;
	FileNode = arg.FileNode;
	_node_update = arg.nodeUpdate;
	_dir_update = arg.dirUpdate;
//cwarn(`MAKE <${MODNAME}>`);
}//»

#authChangeCb(val){//«

cur_user = val;
if (cur_user && !first_auth_change){
	first_auth_change = true;
	get_last_updated_or_create_profile();
}

}//»

get curUser(){return cur_user;}

// par_node: the dir node for '/mnt'
async init(par_node) {//«
/*
users_cache_node = await FBASE_USERS_CACHE_PATH.toNode({mkFile: true});

if (!users_cache_node){
cerr(`Could not get.create: ${FBASE_USERS_CACHE_PATH}`);
return;
}
*/
//cwarn("GOT", FBASE_USERS_CACHE_PATH);
//log(users_cache_node);

try{
	fbase_app_mod = await import(appUrl);
	fbase_auth_mod = await import(authUrl);
	fbase_db_mod = await import(dbUrl);
}
catch(e){
cwarn("CAUGHT FBASE IMPORT");
cerr(e);
return false;
}


fbase_app = fbase_app_mod.initializeApp(LOTW.globals.firebase.config);
fbase_db = fbase_db_mod.getDatabase(fbase_app);
fbase_auth = fbase_auth_mod.getAuth(fbase_app);
fbase_auth_mod.onAuthStateChanged(fbase_auth, val=>{this.#authChangeCb(val);});

//WYRHTKGH

let users_dir = new DirNode("fbase", par_node, {
	type: FBASE_USERS_FS_TYPE,
	loadKids: populate_fbase_users,
	tryLoadKid: async (name)=>{
		await users_dir.loadKids(); // The dir.loadKidsDone flag is checked in loadKids()
//		await populate_fbase_users(users_dir);
		return users_dir.getKid(name);
	}
});
_dir_update(DIR_UPDATE_ADD, par_node, users_dir); // Add kid
//log(users_dir);
return true;

}//»

}//»


})();
