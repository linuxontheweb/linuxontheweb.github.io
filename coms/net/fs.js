/*CURRENT DB SCHEMA«

Just like with our local file system, we should have a separate blob storage on the backend. 

The outer "namespaces" (like LOTW) are meant to encapsulate the data of the various (siloed) applications 
that the backend might possibly be used for. 

// Generic read/write rules ($ghid is our numerical github id, and is used as the name of an outer object)
// ".read": "auth != null",
// ".write": "auth != null &&  // Yes we are authorized...
//		auth.provider === 'github' && // by github...
//		auth.token.firebase.identities['github.com'][0] === $ghid && // with the correct id...
//		newData.child('sid').val() == root.child('cur_session_id').val() // identified by the current session

MOST RECENT:


{
	"rules": {
		".read": false,
		".write": false,
		"LOTW": {
			"status": {
				".indexOn": ["time"],
				".read": "auth != null",
				"$ghid": {
					".validate": "newData.hasChildren(['time', 'name'])",
					".write": "auth != null && auth.provider === 'github' && auth.token.firebase.identities['github.com'][0] === $ghid",
					"time": {
						".validate": "newData.isNumber()"
					},
					"msg": {
						".validate":"newData.isString() && newData.val().length < 100"
					},
					"name": {
						".validate":"newData.isString() && newData.val().length <= 39"
					},
					"$other": {
						".validate": false
					}
				}
			},
			"$ghid": {
				"session_ids": {
					"$sid": {
						".read": "auth != null && auth.provider === 'github' && auth.token.firebase.identities['github.com'][0] === $ghid",
						".write": "auth != null && auth.provider === 'github' && auth.token.firebase.identities['github.com'][0] === $ghid",
						".validate": "!data.exists() && newData.isBoolean() && newData.val() === true"
					}
				},
				"cur_session_id": {
					".read": "auth != null && auth.provider === 'github' && auth.token.firebase.identities['github.com'][0] === $ghid",
					".write": "auth != null && auth.provider === 'github' && auth.token.firebase.identities['github.com'][0] === $ghid",
					".validate": "newData.isString() && newData.val().length == 4 && ((data.exists() && root.child('LOTW').child($ghid).child('session_ids').child(newData.val()).val() === true) || !data.exists())"
				},
				"next_node_id": {
					".read": "auth != null && auth.provider === 'github' && auth.token.firebase.identities['github.com'][0] === $ghid",
					".write": "auth != null && auth.provider === 'github' && auth.token.firebase.identities['github.com'][0] === $ghid",
					".validate": "newData.hasChildren(['sid', 'nodeid'])",
					"nodeid": {
						".validate": "newData.isNumber() && ((data.exists() && newData.val() === data.val() + 1) || (!data.exists() && newData.val() === 1))"
					},
					"sid": {
						".validate": "newData.isString() && ((data.exists() && newData.val() === root.child('LOTW').child($ghid).child('cur_session_id').val()) || !data.exists())"
					},
					"$other": {
						".validate": false
					}
				},
				"nodes": {
					".indexOn": ["parId", "path"],
					".read": "auth != null",
					"$nodeId": {
						".write": "auth != null && auth.provider === 'github' && auth.token.firebase.identities['github.com'][0] === $ghid",
						".validate": "data.exists() || newData.hasChildren(['parId', 'type', 'path', 'sid'])",
						"parId": {
							".validate": "newData.isNumber()"
						},
						"path": {
							".validate": "newData.isString() && newData.val().length < 100"
						},
						"type": {
							".validate": "!data.exists() && newData.isString() && newData.val().length < 5"
						},
						"blobId": {
							".validate": "!data.exists() && newData.isNumber()"
						},
						"sid": {
							".validate": "newData.isString() && newData.val() === root.child('LOTW').child($ghid).child('cur_session_id').val()" 
						},
						"$other": {
							".validate": false
						}
					}
				},
				"blobs": {
					"$blobId": {
						".read": "auth != null && auth.provider === 'github'",
						".write": "auth != null && auth.provider === 'github' && auth.token.firebase.identities['github.com'][0] === $ghid",
						".validate": "newData.hasChildren(['sid', 'contents'])",
						"meta": {
							".validate": true
						},
						"contents": {
							".validate": "newData.isString() && newData.val().length < 100000"
						},
						"sid": {
							".validate": "newData.isString() && newData.val() === root.child('LOTW').child($ghid).child('cur_session_id').val()" 
						},
						"$other": {
							".validate": false
						}
					}
				},
				"$other": {
					".validate": false
				}
			}
		}
	}
}


Also: Let's await on update.
»*/
/*10/16/25: Put 'status' back into the db.

Now we should integrate everything from 2 days ago with:
	- the github login name fetching/storing (use this in the constructor of NetFsDB)
	- Set the initial status update along with setting everything else (msg: "hi", time: serverTimestamp())
	- Mount the users directory with the same logic as before (query for most recent status updates)

*/
/*10/15/25: How to discover other user's home directories?«

- Reimplement the (~100 char) status thing, like before?
- Maybe a "rank" (or "points") field, so the top N users may be queried.
- Below we have a groups structure that can be used to authorize the writes of, 
  e.g. "administrative" users

"groups": {
	"admin": {
		".read": false,
		".write": "auth != null && auth.provider === 'github' && 
				auth.token.firebase.identities['github.com'][0] === 7414094",
		$ghid: {
			".validate": "newData.isBoolean()"
		}
	}
},
"status": {
	".indexOn": ["time", "rank"],
	"$ghid": {
		".read": "auth != null",
		".validate": "newData.hasChildren(['time', 'name']) || newData.hasChildren(['rank'])",
		"time": {
			".validate": "newData.isNumber()",
			".write": "auth != null && auth.provider === 'github' && auth.token.firebase.identities['github.com'][0] === $ghid",
		},
		"msg": {
			".validate":"newData.isString() && newData.val().length < 100",
			".write": "auth != null && auth.provider === 'github' && auth.token.firebase.identities['github.com'][0] === $ghid",
		},
		"name": {
			".validate":"newData.isString() && newData.val().length <= 39",
			".write": "auth != null && auth.provider === 'github' && auth.token.firebase.identities['github.com'][0] === $ghid",
		},
		"rank": { // Only users in the admin group can write
			".validate": "newData.isNumber()",
			".write": "auth != null && auth.provider === 'github' && 
						root.child('LOTW').child('groups').child('admin')
						.child(auth.token.firebase.identities['github.com'][0]) === true",
		},
		"$other": {
			".validate": false
		}
	}
}

»*/
/*10/14/25: Reducing the complexity of the 3-step process of initializing a remote user directory.«

in the new db schema, I just checked for '!data.exists()' in the appropriate places
so that we can now do a one-step initialization process like:

let session_id = get_session_id();
let next_node_id = 1;
const base_path = `LOTW/${ghid}`;
update(base_path, {
	[`session_ids/${session_id}`]: true,
	cur_session_id: session_id, // Added: !data.exists()
	next_node_id: {
		nodeid: next_node_id, // (!data.exists() && newData.val() === 1)
		sid: session_id // Added: !data.exists()
	}
});

Now let's create 2 commends:
1) chkfbdb
2) mkfbdb

Now we have the 2 main variables (sid and nextNodeId) as the initialization variables 
of a 'NetFsDB' object. So now the idea is to add methods to this object to make
it look like the system 'FsDb' object.



»*/
/*10/13/25: I want a tidy database object (something like 'FsDb' in sys/fs.js):«

After commenting out the entirety of the last version of this file, I decided to
use the onAuthStateChanged callback via the same "global" way as the 
onValue('.info/connected') callback.

I also wanted to get rid of the gui interface aspects of logging in (i.e. buttons with
logos on them). If they want to go that route, the dedicated /login url can be used
for that purpose.

Since we should support MULTIPLE github logins from the same LOTW instance, we
should namespace the session ids (either in localStorage or /var/appdata) via
the (persistent numerical) github user ids.

Now the question is simple: SHOULD AN INSTANCE OF NetFsDB BE TIED TO A SINGLE (NUMERICAL) 
GITHUB ID? Should any NetFsDB instance indeed exist if no remote directory has even
been set up yet?  If there is no session id, does/should this *guarantee* that there 
is no database on the backend? Regardless, we just need to check for:
LOTW/$GHID/next_node_id/nodeid (Number >= 1).

Now when setting it up:
let session_id = get_session_id();
let next_node_id = 1;
const base_path = `LOTW/${ghid}`;

1)
update(base_path, {
	[`session_ids/${session_id}`]: true, //This must always work upon database creation
})

2) The given session_id must be registered in the session_ids table (from step 1).
update(base_path, {
	cur_session_id: session_id
});

3) The sid field must be the same as the db's value of cur_session_id (from step 3).
update(base_path, {
	next_node_id: {
		sid: session_id,
		nodeid: next_node_id
	}
});

4) If step 1 succeeds and step 2 or 3 fails, then we seem to have an inconsistent state,
and we'll need to triage the situation and abort these steps.

5) Otherwise, if all steps have succeeded, save session_id in localStorage, e.g.:
  - localStorage.setValue(`fbase-sess_id-github:${ghid}`, session_id).

»*/

//Notes«

/*10/11/25: The urgency is arising. First, we'll delete everything from the firebase datastore,«
and replace the security rules, whole cloth, with our new ones (the DB SCHEMA). Then we'll put 
this file in another location, and start it over again. We are going to need to clean up the
logic that we've recently added to sys/fs.js. The plan is to do a 1:1 mapping of the 
(indexedDB) database logic used in sys/fs.js.

Way more than that stupid crap (below) about hardware APIs there is a need of a central location for, 
and common interface into all of the various ways of interacting, computationally-speaking, 
with the wider world.

»*/
/*10/9/25: The fundamental idea I am having is to do only what is necessary to support an«
"ecosystem" that is centered around web-client-centric scripting languages.

One of the more telling outcomes will/should be the increasing usage of (web-based) hardware
APIs, as opposed to DOM APIs.
»*/
/*10/7/25: Overall workflow«

1. Load the net.fs library (this module)
2. Get the current user object
  - If not found, the user can only proceed by logging in
3. Once logged in, check that a remote user directory has been set up. 
  - If none exists, the user must create one.
4. Check for the session id ($sid) in local storage.
  - If not found, call create_session_id() until an unused one is found, and set it in local storage.
5. Call set_session_id() with the value of $sid.
6. Perform remote fs operations.
  - If these fail with permission denied (on one's own directory), this most likely means that
     another session has called set_session_id. Report this (likely) error condition, and inform 
     the user that they must manually reset the session id to continue.

»*/
/*10/6/25: Persistent session ids, create_new_file() example«

Let's do persistent 24 bit session ids (4 chars, ~16M  possible). This is instead of
jumping through all the hoops of constantly changing them. Only upon the first
usage of the database in a client instance (local database initialization) do
we need to secure a unique id. We just need to keep a little bit of local
state, such as an object in e.g. APPDATA_PATH/netfs/sid.


const SESS_ID_BYTE_LEN = 3; // 4 ascii chars long
const get_sess_id = () => {
let sess_id = (crypto.getRandomValues(new Uint8Array(SESS_ID_BYTE_LEN))).toBase64()
		.replace(/\+/g, '-')
		.replace(/\x2f/g, '_')
		.replace(/=+$/, '');
	return sess_id;
};


Now we can do these 2 operations in a row, wrapped in a Promise:
1) get_next_id
2) increment_next_id

We know that if another session id is set between these 2 steps, then
increment_next_id won't work, and we won't have any gaps in the ids.

Or increment_next_id rather gets put into an update operation, which creates a new
node:

const create_new_file = async (par_id, name, bytes) => {

	let node_id = await get_next_node_id(); // Use this as the blob_id: they're in different "tables"
	let update_obj = {
		nodes: {
			[node_id]: {
				type: "f",
				parId: par_id,
				blobId: node_id,
				path: `${par_id}/${name}`
			}
		},
		blobs: {
			[node_id]: {
				contents: bytes.toBase64(),
				meta: {
					//...
				}
			}
		},
		next_node_id: increment(1)
	};
	await update("/$ghid", update_obj); // If this fails, no incrementing is done

};


»*/
/*10/5/25: Session ids«
Let's get a crypto-secure 24bit value as Base64 (4 ascii characters), and call set_session
which updates:
"$ghid": {

session_id: {
	'.validate": "newData.isString() && newData.val().length >= 4"
},
old_session_ids: { // Possibly this
	".validate": "!root.child($ghid).child('old_session_ids')[newData.val()]"
},
nodes:{
	"$nodeid": {
		".validate": "newData.child('session_id').val() === root.child($ghid).child('session_id') && <other validation logic here>";
	}
},
blobs:{...}

}


If we are paranoid, we can use old_session_ids, which forces us to
never reuse an old one. So then the update will be like:

let sess_id = get_random_bytes(3).toBase64().replace(/=+^/,"");
update(ghid, {
	session_id: sess_id,
	old_session_ids[sess_id]: true
});
//Now we have an effective "lock"

If sess_id already exists in old_session_ids, then this will fail and we will need to repeat
this process. So we create session ids either upon initialization of our user database, or
upon failure. We can always store the session id, and read it back upon reloading the page.

Using 24 bit session ids (16,777,216 possibilities), the string lengths are always 4.

Going down to 16 bit session ids (65,536 possibilities), the strings lengths are always 3.
So 24 bit seems to be a rather good middle ground between string size and hash space.

»*/
/*10/4/25: New file node creation workflow«

When creating a new file, we will do:

1) push("/blobs/$ghid", {meta, contents}); // Save the file
2) push("/nodes/$ghid", { parId, type, path, blobId: $newRef}) // Create the node with blobId=file's key

The cases where we successfully create the new file but fail to create the node should be rare,
since node creation is such a quick operation, being that nodes are such small objects.

»*/
/*10/3/25: RESOLVED: query()«

If we need to call to get the next key, then we should implement our own keys:

next_key: {
	"$ghid": {
		".write": "auth.ghid = $ghid",
		".read": "auth.ghid = $ghid",
		".validate": "newData.isNumber() && newData.val() > data.val()"
	}
}

There should not be any harm in calling update/increment on the next_key.

Also: there is no reason to do "blobs", if everything is meant to be stored here
in this database as a string (rather than locally as a proper file with read/write 
file stream methods.)

query("/nodes/$ghid", orderByChild('path'),equalTo($pathname),limitToFirst(1))

We might need to put the key field inside the node object, in case the key is not available
to us upon getting it. 

push(parRef, value?): 
Generates a new child location using a unique key and returns its Reference.

If you provide a value to push(), the value is written to the generated
location. If you don't pass a value, nothing is written to the database and the child remains 
empty (but you can use the Reference elsewhere).

»*/
/*10/1/25: To mount /users, we need to have a cache of the last N statuses, and check for the«
cache or get them. This gives us id->username mappings. Then we'll mount them with the
usernames for the key names.

We should put a appData field on FSNode, for use by the individual applications.
»*/
/*9/30/25: Let's use update (instead of runTransaction). We will always check«
is_connected, and use a flag (e.g. "force-offline") to force updates when it is false.
This affects stuff like @NSBDHFUR, where there is (currently) 3 successive calls to
run_transaction.
»*/
/*9/29/25: Just need to work out the details of how files/folders are represented«
on the backend, and how they may be queried. Then we can package these functions
into an api that can be exported to sys/fs.js, so that the NetNode may be finally
in control of how everything flows through the lOTW system.

"$uid":{
	"1234567":{
		type: "d",
		size: 2,
		list: {
			vals: ["dir1", "file1.txt"],
			details: [-1, 100],
		},
		kids: {
			"ZmlsZTEudHh0" : {// key=sanitize("file1.txt")
				type: "f",
				size: 100,
				created:  1234567890.
				modified: 1234901234.
				enc: "utf8",
				value : "This is the thing in the time of the place of file1!?!?!"
			},
			"ZGlyMQ":{// key=sanitize("dir1")
				type: "d",
				size: <list.vals.length>,
				list: {
					vals: [...],
					details: [...]
				},
				kids: {
					//...
				}
			}
		}
	}
}

»*/
/*9/28/25: ONLY DOING GITHUB AUTH«

So a user can write to their directory at: e.g. for me /uids/7414094

To map from username to id:
https://api.github.com/users/linuxontheweb

{
	"login": "linuxontheweb",
	"id": 7414094,
	"url": "https://api.github.com/users/linuxontheweb",
	"html_url": "https://github.com/linuxontheweb",
	"name": "Dennis Kane",
	//...
}

I don't want to even think about who a LOTW user is when it comes to computer development 
questions. The idea of having a github account is the one standard way we have of knowing who a user
is along these lines. The idea of letting google "users" use the site effectively allows anonymous
users, since google (especially now that there is no G+ anymore) has no way to look anybody up.


»*/
/*9/24/25: This library exists as a suite of tools for internet-based filesystems, using«
backends like the Firebase Realtime Database. We will need to integrate with the logic
in sys/fs.js in order to allow for getting directory listings.

We might want to get `class FSNode` (from sys/fs.js) and extend it inside here.

But we might want to spend some time looking at the interfaces for FSNode and all
classes that extend it, in order to refactor it in order to simplify the logic in
coms/fs.js (for file moving, copying, etc).

»*/

//»
//Imports«

const{globals}=LOTW;
const {fsMod: fs, fbase}=globals;
const {USERS_TYPE, APPDATA_PATH} = globals.fs;
const {config: firebaseConfig} = globals.firebase;
const {Com} = globals.ShellMod.comClasses;
const{mkdv, mk, isArr,isStr,isEOF,isErr,log,jlog,cwarn,cerr}=LOTW.api.util;
const{root, mount_tree}=fs;
const {fs: fsapi}=LOTW.api;
//const {popup} = globals.popup;
//Database

import {initializeApp} from "firebase_app";

import {
getAuth,
onAuthStateChanged,
signInWithPopup,
GithubAuthProvider,
signOut 
} from "firebase_auth";

import { 
getDatabase,
ref,
set,
get,
//update as _update,
update,
query,
runTransaction,
serverTimestamp,
orderByChild,
limitToFirst,
limitToLast,
startAt,
equalTo,
onValue,
increment,
enableLogging
} from "firebase_database";

//»

//Var«


const SESS_ID_BYTE_LEN = 3; // 4 ascii chars long

const fbase_app = initializeApp(firebaseConfig);
const fbase_auth = getAuth(fbase_app);
const fbase_db = getDatabase(fbase_app);

const gh_provider = new GithubAuthProvider();
gh_provider.setCustomParameters({
	prompt: 'select_account'
});

let is_connected = false;
let cur_user;
let db;

const DEF_STATS_MINS_AGO = 1000;
const DEF_STATS_NUM_RECENT = 20;
//let next_node_id;
//let cur_sid;

// Attach a listener to detect changes in the connection state
//When we do tons of dev reloading, this never gets unregistered, and we end up getting tons
//of warnings, upon reconnecting after disconnecting (e.g. due to closing the laptop cover).
//Perhaps we can export an onkill method.

const DISCON_CB = onValue(ref(fbase_db, ".info/connected"), (snap) => {
	is_connected = snap.val();
cwarn(`Connected: ${is_connected}`);
});
const AUTH_CB = onAuthStateChanged(fbase_auth, user => {
	cur_user = user;
	if (!cur_user){
//		next_node_id = undefined;
//		cur_sid = undefined;
		db = undefined;
	}
cwarn("User", cur_user);
});

const ONKILL = ()=>{
cwarn("KILL");
	AUTH_CB();
	DISCON_CB();
if (db){
globals["var"]["netfs.login"] = db.login;
globals["var"]["netfs.nextNodeId"] = db.nextNodeId;
globals["var"]["netfs.sid"] = db.sid;
}
};
//»

class NetFsDB {//«

constructor(sid_arg, login_arg, next_node_id_arg){//«
	this.sid = sid_arg;
	this.login = login_arg;
	this.nextNodeId = next_node_id_arg;
}//»

async createDirNode(parId, name){//«

if (!(Number.isFinite(parId) && isStr(name))){
	throw new Error(`Invalid args to createDirNode`);
}

let path = `${parId}/${name}`;
let node = {parId, path, type: "d"};
await UPDATE(UBASE(),{
	next_node_id: {
		nodeid: this.nextNodeId+1,
		sid: this.sid
	},
	[`nodes/${this.nextNodeId}`]: {
		parId,
		path,
		sid: this.sid,
		type: "d"
	}
});
let id = this.nextNodeId;
this.nextNodeId++;
return id;
}//»
async createFileNode(parId, name, val){//«

if (!(Number.isFinite(parId) && isStr(name))){
	throw new Error(`Invalid args to createFileNode`);
}

let path = `${parId}/${name}`;
let use_blob_id;
if (!val) use_blob_id = 0;
else use_blob_id = this.nextNodeId;

let obj = {
	next_node_id: {
		nodeid: this.nextNodeId+1,
		sid: this.sid
	},
	[`nodes/${this.nextNodeId}`]: {
		parId,
		path,
		blobId: use_blob_id,
		sid: this.sid,
		type: "f"
	}
};
let sz;
if (val){
	let bytes;
	if (isStr(val)){
		bytes = (new TextEncoder()).encode(val);
	}
	else if (val instanceof Uint8Array){
		bytes = val;
	}
	else{
cwarn("WHAT THE HELL TYPE IS THIS???");
log(val);
		throw new Error("UNKNOWN FILE VALUE TYPE IN createFileNode!!! (see value above)");
	}
	obj[`blobs/${this.nextNodeId}`] = {
		sid: this.sid,
		contents: B64(bytes)
	}
	sz = bytes.byteLength;
}
else sz = 0;

this.nextNodeId++;
await UPDATE(UBASE(), obj);
return sz;

}//»
async getDirList(ghid, parId){
let ref = REF(`LOTW/${ghid}/nodes`);
let c1 = orderByChild('parId');
let c2 = equalTo(parId);
let q = query(ref, c1, c2);
let snap = await GET(q);
if (isErr(snap)){
cerr(snap);
return;
//	return snap;
}
if (!snap.exists()){
return [];
}
return snap.val();

}
}//»

//Funcs«

const UID = () =>{if (cur_user && cur_user.providerData) return cur_user.providerData[0].uid;};
const UBASE = ()=> {//«
	let id = UID();
	if (!id) return;
	return `LOTW/${id}`;
};//»
const SID = (val) => {//«
	let id = UID();
	if (!id) return;
	let key = `fbase-sid-gh-${id}`;
	if (!val) return localStorage.getItem(key);
	localStorage.setItem(key, val);
};//»
const GH_UNAME = (val) => {//«
	let id = UID();
	if (!id) return;
	let key = `uname-gh-${id}`;
	if (!val) return localStorage.getItem(key);
	localStorage.setItem(key, val);
};//»
const REF = (path)=> {//«
	return ref(fbase_db, path);
//	if (path) return ref(fbase_db, path);
//	return ref(db);
};//»
const GET = async(ref_or_path)=>{//«

if (isStr(ref_or_path)) ref_or_path = ref(fbase_db, ref_or_path);
try {
	return await get(ref_or_path);
}
catch(e){
	return e;
}

};//»
const UPDATE = async(ref_or_path, vals)=>{//«

if (isStr(ref_or_path)) ref_or_path = ref(fbase_db, ref_or_path);
try {
	await update(ref_or_path, vals);
	return true;
}
catch(e){
	return e;
}

};//»
const B64 = bytes =>{//«
	if (bytes.toBase64) return bytes.toBase64();
	return btoa(String.fromCharCode(...bytes));
};//»
const FROMB64 = str => {//«
if (!Uint8Array.fromBase64){
	try{
		return Uint8Array.fromBase64(str);
	}
	catch(e){
cerr(s);
		return null;
	}
}
str = atob(str);
let arr = new Uint8Array(str.length);
let len = arr.length;
for (let i = 0; i < len; i++) {
	arr[i] = str.charCodeAt(i);
}
return arr;

};//»
const DIE = mess => {throw new Error(mess);};

const get_session_id = () => {//«
	let sess_id = (crypto.getRandomValues(new Uint8Array(SESS_ID_BYTE_LEN))).toBase64()
		.replace(/\+/g, '-')
		.replace(/\x2f/g, '_')
		.replace(/=+$/, '');
	return sess_id;
};//»
const get_gh_login = async()=>{//«
	let gotname = GH_UNAME();
	if (gotname) return gotname;
	let ghid = UID();
	if (!ghid) return DIE(`Called get_gh_login when not signed in!?!?`);
	let rv;
	try{
		rv  = await fetch(`https://api.github.com/user/${ghid}`)
	}
	catch(e){
cerr(e)
//		return e.message;
		return e;
	}
	if (!rv.ok){
		return new Error("Could not fetch");
	}
	let obj = await rv.json();
	if (!(obj&&obj.login)){
cwarn("There is no login on the object below!?!?!?");
log(obj);
		return new Error("NO OBJ && OBJ.LOGIN FOUND?!?!? (see console)");
	}
	GH_UNAME(obj.login);
	return obj.login;
};//»
const get_statuses=async(opts={minsAgo: DEF_STATS_MINS_AGO, numRecent: DEF_STATS_NUM_RECENT})=>{//«
	let mins_ago = opts.minsAgo;
	let num_recent_stats = opts.numRecent;

	let start_time = new Date().getTime() - (mins_ago * 60000);
	let c1 = orderByChild('time');
	let c2 = startAt(start_time);
	let c3 = limitToLast(num_recent_stats);
	let ref = REF("LOTW/status");
	let q = query(ref, c1, c2, c3);
	let snap = await GET(q);
	if (isErr(snap)){
		return snap;
	}
	if (!snap.exists()){
		return new Error(`no statuses were found`);		
	}
	return snap.val();
};//»
const set_user_dirs = async () => {//«
cwarn("GET STATUSES...");
	let stats = await get_statuses();
	if (isErr(stats)) return stats;
	let keys = Object.keys(stats);
	let arr = [];
	for (let key of keys) arr.push(stats[key].name, key);
	await fsapi.popDir(root.kids.users, {vals: arr});
	return true;
};//»

const get_user_dir_list = async (ghid, parId, path)=>{//«
/*«
let path_enc = "";
if (path){
	let arr = path.split("/");
	for (let name of arr){
		path_enc+=`/kids/${encode_key(name)}`;
	}
}
let fullpath = `/user/${ghid}${path_enc}/list`;
let ref = get_ref(fullpath); 

let snap = await get_value(ref);
if (isErr(snap)){
	return snap;
}
if (!snap.exists()){
	return new Error(`path not found`);
}
return snap.val();
»*/
cwarn(`GET(${ghid}): <${path}>`);
if (!parId) parId = 0;
let rv = await db.getDirList(ghid, parseInt(parId));
let keys = Object.keys(rv);
let names = [];
let vals = [];

for (let k of keys){
	let obj = rv[k];
	let name = obj.path.split("/")[1];
	let val;
	if (obj.type==="d") val = -1;
	else val = 0;
	names.push(name);
	vals.push(val);
}
return {
	names: names,
	vals: vals,
	ids: keys
}; 

};//»
globals.funcs["netfs.getUserDirList"] = get_user_dir_list;
const fb_write = async(path, val, opts={})=> {//«
//This must be a fullpath
cwarn(`WRITE(${path})`);
/*«
if (!is_connected && !opts.offline){
	return new Error("not connected (use --offline to force)");
}

let saypath = path;
if (!path.match(/^\x2fusers\x2f/)){
return new Error(`${path}: invalid path`);
}
let gh = globals.auth.github;
if (!(gh.uid && gh.login)){
return new Error(`Not logged in`);
}
let arr = path.split("/");
arr.shift();
arr.shift();
let username = arr.shift();
if (username !== gh.login){
return new Error(`Permission denied`);
}
path = arr.join("/");
if (!arr.length) {
	return new Error(`'${saypath}': invalid path`);
}
let rel_path_enc = "";
let name;
if (path.match(/\x2f/)) {
if (path === "/"){
return new Error("'/': invalid path");
}
	let arr = path.split("/");
	name = arr.pop();
	for (let name of arr){
		rel_path_enc+=`/kids/${encode_key(name)}`;
	}
}
else{
	name = path;
}
let base_path = `/user/${gh.uid}${rel_path_enc}`;
let list_ref = get_ref(`${base_path}/list`);
let snap = await get_value(list_ref);
if (isErr(snap)){
	return snap;
}
if (!snap.exists()){
	if (!rel_path_enc) return new Error("you must create your user directory with fbmkhomedir!");
	else{
		return new Error(`the parent directory was not found`);
	}
}


let list = snap.val();
let ind = list.names.indexOf(name);
if (ind >= 0){
	if (list.vals[ind] === FBASE_DIRECTORY_VAL){
		return new Error(`'${name}': cannot write to the directory`);
	}
	else{
//We have a value and a file (update it)
		list.names.splice(ind, 1);
		list.vals.splice(ind, 1);
	}
}


let bytes;
if (isStr(val)) {
	bytes = (new TextEncoder()).encode(val);
}
else if (val instanceof Uint8Array){
	bytes = val;
}
else{
log(val);
return new Error("Unknown value given to fb_write (see console)");
}
let sz = bytes.byteLength;
let str = B64(bytes);

let use_len;
if (!list.names[0]){
	list.names = [name];
	list.vals = [sz];
	use_len = 1;
}
else{
	list.names.push(name);
	list.vals.push(sz);
	let rv = parallel_sort(list.names, list.vals);
	list.names = rv[0];
	list.vals = rv[1];
	use_len = list.names.length;
}

let enc_path = encode_key(name);

let use_obj = {type: "f", size: sz, contents: str};

let update_obj = {
	list,
	size: use_len,
	[`kids/${enc_path}`]: use_obj
};
if (!await update(base_path, update_obj)) return;
return sz;
»*/

let saypath = path;
if (!path.match(/^\x2fusers\x2f/)){
	return new Error(`${path}: invalid path`);
}
if (!db){
cerr("Not logged in");
	return new Error(`Not logged in`);
}
let arr = path.split("/");
arr.shift();
arr.shift();
let username = arr.shift();
if (username !== db.login){
cerr("Permission denied");
	return new Error(`Permission denied`);
}
let name = arr.pop();
if (!name){
cerr("WUTNOFILENAME");
return;
}
let parpath = arr.join("/");

let parId;
if (!parpath) parId = 0;
else {
cerr("HAVEPARPATH!!!");
return;
}
log(`<${parpath}> <${name}>`);
return await db.createFileNode(parId, name, val);

//log(db);
//cwarn(`OK: ${username} === ${db.login}`);

/*
let update_obj = {
	nodes: {
		[node_id]: {
			type: "f",
			parId: par_id,
			blobId: node_id,
			path: `${par_id}/${name}`
		}
	},
	blobs: {
		[node_id]: {
			contents: bytes.toBase64(),
			meta: {
				//...
			}
		}
	},
	next_node_id: increment(1)
};
await update("/$ghid", update_obj); // If this fails, no incrementing is done
*/



};
//»
globals.funcs["netfs.fbWrite"] = fb_write;

const fb_mkdir = async(parpath, parId, name) =>{//«


if (!parpath.match(/^\x2fusers\x2f/)){
cerr(`${path}: invalid path`);
	return
}
if (!name){
cerr(`NO NAME GIVEN`);
	return
}

let arr = parpath.split("/");
arr.shift();
arr.shift();
let username = arr.shift();
if (!db){
cerr("NOTLOGGEDON");
return;
}
if (username !== db.login){
cerr("Permission denied");
return;
}
parpath = arr.join("/");

if (!parId) parId = 0;

cwarn(`MKDIR: <${parpath}> <${name}>`);
return await db.createDirNode(parseInt(parId), name);


};/*»*/
globals.funcs["netfs.fbMkdir"] = fb_mkdir;

//»

//Commands«

/*«
class  extends Com{
async run(){
const{args}=this;

}
}
»*/

class com_ghlogin extends Com {//«

async run(){

const{args}=this;
if (cur_user){
	this.wrn("Already logged in!");
	this.ok();
	return;
}

try {
	await signInWithPopup(fbase_auth, gh_provider);
//	await signInWithPopup(fbase_auth, new GithubAuthProvider());
	this.ok();
}
catch(e){
cerr(e);
	this.no(e.message);
	return;
}

}

}
//»
class com_ghlogout extends Com {//«

async run(){
const{args}=this;
if (!cur_user){
this.wrn("Already logged out!");
this.ok();
return;
}
//this.ok("DOLOGOUT");
	try{
		await signOut(fbase_auth);
//		delete_auth();
		this.ok('Signed out');
	}
	catch(e){
cerr(e);
		this.no(e.message);
	}
}

}//»
class com_chkfbdb extends Com {//«
	async run() {
		const{args}=this;
		let base = UBASE();
		if (!base) return this.no("not signed in!");
		if (!is_connected) return this.no("not connected!");
		if (db) return this.ok("already checked");
		let snap = await GET(`${base}/next_node_id/nodeid`);
		if (isErr(snap)) return this.no(snap.message);
		let next_node_id = snap.val();
		if (next_node_id) {
//log(`NNI: ${next_node_id}`);
			let cur_sid = SID();
			if (!cur_sid){
				return this.no(`cur_sid: not found in local storage, but next_node_id exists`);
			}
			let login = await get_gh_login();
			if (isErr(login)) return this.no(login.message);
			db = new NetFsDB(cur_sid, login, next_node_id);
log(db);
			return this.ok("OK");
		}
//		if (cur_sid) return this.no(`cur_sid: was found in local storage, but next_node_id doesn't exist`);
		this.no("NO");
	}
}//»
class com_mkfbdb extends Com {//«

	async run() {
		const{args}=this;
		let id = UID();
		if (!id) return this.no("not signed in!");
		let snap = await GET(`LOTW/status/${id}/name`);
		if (isErr(snap)) return this.no(snap.message);
		if (snap.val()) {
			return this.no("database exists!");
		}
		let sid = get_session_id();
		let login = await get_gh_login();
		if (isErr(login)) return this.no(e.message);
		if (!is_connected) return this.no("not connected!");
		await UPDATE("LOTW", {
			[`status/${id}`]: {
				time: serverTimestamp(),
				msg: "HELO",
				name: login
			},
			[`${id}/session_ids/${sid}`]: true,
			[`${id}/cur_session_id`]: sid, // Added: !data.exists()
			[`${id}/next_node_id`]: {
				nodeid: 1, // (!data.exists() && newData.val() === 1)
				sid: sid // Added: !data.exists()
			}
		});
		SID(sid);
		db = new NetFsDB(sid, login, 1);
log(db);
		this.ok();
	}

}//»
class com_touchfbfile extends Com {//«
async run(){
const{args}=this;
if (!db) return this.no("No db");
log(db);
this.ok();
}
}//»
class com_mountusers extends Com{//«

	async run(){
		const{args}=this;
		if (!!root.kids.users){
			this.wrn("already mounted");
			return;
		}
		mount_tree("users", USERS_TYPE);
//		this.suc("/users: successfully mounted");
		this.inf("Searching for users...");
		let rv = await set_user_dirs();
		if (isErr(rv)){
			this.wrn(`${rv.message}`);
		}
		else if (rv === true){
			this.suc("OK!");
		}
		else{
			this.wrn("Unknown value returned from set_user_dirs! (see console)");
			log(rv);
		}
//Maybe we should export a basic function to fs.populate_dirobj for use with the basic
//shell/terminal functions like ls and doing tab complete.
		this.ok();
	}
}//»

const coms = {

ghlogin: com_ghlogin,
ghlogout: com_ghlogout,
chkfbdb: com_chkfbdb,
mkfbdb: com_mkfbdb,
touchfbfile: com_touchfbfile,
mountusers: com_mountusers,

}

//»

export {coms, ONKILL as onkill};


if (globals["var"]["netfs.sid"]) {
	db = new NetFsDB(globals["var"]["netfs.sid"], globals["var"]["netfs.login"], globals["var"]["netfs.nextNodeId"]);
log(db);
}
//globals["var"]["netfs.nextNodeId"] = db.nextNodeId;
//globals["var"]["netfs.sid"] = db.sid;

//Old«

/*
//Var«

const FBASE_DIRECTORY_VAL = -1;

const AWAIT_UPDATE_MS = 5000;
let update_num = 1;

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
// Attach a listener to detect changes in the connection state
let is_connected = false;
//When we do tons of dev reloading, this never gets unregistered, and we end up getting tons
//of warnings, upon reconnecting after disconnecting (e.g. due to closing the laptop cover).
//Perhaps we can export an onkill method.
const DISCON_CB = onValue(ref(db, ".info/connected"), (snap) => {
	is_connected = snap.val();
cwarn(`Connected: ${is_connected}`);
});
const onkill = ()=>{
	DISCON_CB();
};


//LOGIN_BUTTONS_STR«
//const GOOGLE_BUT_ID = "googleSignInBtn";
const GITHUB_BUT_ID = "githubSignInBtn";
const LOGIN_BUTTONS_STR = `
<button name="${GITHUB_BUT_ID}" class="gsi-material-button">
  <div class="gsi-material-button-state"></div>
  <div class="gsi-material-button-content-wrapper">
    <div class="gsi-material-button-icon">

<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.08-.731.084-.716.084-.716 1.192.085 1.816 1.29 1.816 1.29 1.063 1.816 2.784 1.29 3.465.987.108-.767.422-1.29.763-1.59-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.462-2.381 1.229-3.221-.124-.3-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.046.138 3.003.404 2.292-1.552 3.3-.931 3.3-.931.653 1.653.242 2.876.118 3.176.768.84 1.228 1.911 1.228 3.221 0 4.611-2.801 5.625-5.476 5.922.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.196-6.086 8.196-11.386 0-6.627-5.373-12-12-12z"/>
</svg>
    </div>
    <span class="gsi-material-button-contents">Sign in with GitHub</span>
    <span style="display: none;">Sign in with GitHub</span>
  </div>
</button>
`;
//»
//GSI_CSS_STR«
const GSI_CSS_STR = `
.gsi-material-button {
-moz-user-select: none;
-webkit-user-select: none;
-ms-user-select: none;
-webkit-appearance: none;
background-color: WHITE;
background-image: none;
border: 1px solid #747775;
-webkit-border-radius: 20px;
border-radius: 20px;
-webkit-box-sizing: border-box;
box-sizing: border-box;
color: #1f1f1f;
cursor: pointer;
font-family: 'Roboto', arial, sans-serif;
font-size: 14px;
height: 40px;
letter-spacing: 0.25px;
outline: none;
overflow: hidden;
padding: 0 12px;
position: relative;
text-align: center;
-webkit-transition: background-color .218s, border-color .218s, box-shadow .218s;
transition: background-color .218s, border-color .218s, box-shadow .218s;
vertical-align: middle;
white-space: nowrap;
width: auto;
max-width: 400px;
min-width: min-content;
}

.gsi-material-button .gsi-material-button-icon {
height: 20px;
margin-right: 12px;
min-width: 20px;
width: 20px;
}

.gsi-material-button .gsi-material-button-content-wrapper {
-webkit-align-items: center;
align-items: center;
display: flex;
-webkit-flex-direction: row;
flex-direction: row;
-webkit-flex-wrap: nowrap;
flex-wrap: nowrap;
height: 100%;
justify-content: space-between;
position: relative;
width: 100%;
}

.gsi-material-button .gsi-material-button-contents {
-webkit-flex-grow: 1;
flex-grow: 1;
font-family: 'Roboto', arial, sans-serif;
font-weight: 500;
overflow: hidden;
text-overflow: ellipsis;
vertical-align: top;
}

.gsi-material-button .gsi-material-button-state {
-webkit-transition: opacity .218s;
transition: opacity .218s;
bottom: 0;
left: 0;
opacity: 0;
position: absolute;
right: 0;
top: 0;
}

.gsi-material-button:disabled {
cursor: default;
background-color: #ffffff61;
border-color: #1f1f1f1f;
}

.gsi-material-button:disabled .gsi-material-button-contents {
opacity: 38%;
}

.gsi-material-button:disabled .gsi-material-button-icon {
opacity: 38%;
}

.gsi-material-button:not(:disabled):active .gsi-material-button-state, 
.gsi-material-button:not(:disabled):focus .gsi-material-button-state {
background-color: #303030;
opacity: 12%;
}

.gsi-material-button:not(:disabled):hover {
-webkit-box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
}

.gsi-material-button:not(:disabled):hover .gsi-material-button-state {
background-color: #303030;
opacity: 8%;
}
`;
//»
const GSI_CSS_ID = "gsi_css";

const NEW_DIR = {
	type: "d",
	size: 0,
	list: {
		names: [false],
		vals: [false]
	},
	kids:{
		"%init": true
	}
};
Object.freeze(NEW_DIR);
Object.freeze(NEW_DIR.list);
Object.freeze(NEW_DIR.kids);

const NEW_FILE = {type: "f", size: 0};
Object.freeze(NEW_FILE);

const DEF_TRANS_DELAY = 5000;

//»

//DOM«

////let goog_but, gh_but;
//let gh_but;
//let buttons = button_div.getElementsByTagName("button");
//for (let but of buttons){
//	if (but.name == GITHUB_BUT_ID){
//		gh_but = but;
//	}
//}
//if (!gh_but){
//cerr("WHERE IS THE BUTTON (gh_but)?");
//}
//»
//Funcs«

//function incrementCounter(path, amount) {
//  const counterRef = ref(db, path);
//  set(counterRef, increment(amount));
//}
//incrementCounter('posts/postId123/likes', 1);
//incrementCounter('pages/pageId456/views', -1);


const encode_key=(key) => {//«
	const encoder = new TextEncoder();
	const data = encoder.encode(key);
	return B64(data).replace(/\+/g, '-')
		.replace(/\x2f/g, '_')
		.replace(/=+$/, '');
}//»
//const decode_key=(safeKey)=>{//«
//	const padded = safeKey.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - safeKey.length % 4) % 4);
//	const decoded = atob(padded);
//	const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
//	return new TextDecoder().decode(bytes);
//};//»
const USERS_CACHE_PATH = `${APPDATA_PATH}/netfs/cache`;

const set_user_dirs = async () => {//«
	if (!await fsapi.mkDir(APPDATA_PATH, "netfs")){
		return new Error(`could not create the 'netfs' data directory`);
	}
	let rv = await USERS_CACHE_PATH.toNode();
let obj;
if (rv){
cwarn("HAVE CACHE...");
	obj = await USERS_CACHE_PATH.toJson();
	if (!obj) return new Error(`could not get the user statuses data`);
}
else {
cwarn("GET STATUSES...");
let stats = await get_statuses();
if (isErr(stats)) return stats;
obj = stats.val();
if (!await fsapi.writeFile(USERS_CACHE_PATH, JSON.stringify(obj))){
	return new Error(`could not cache the user statuses`);
}
}
let keys = Object.keys(obj);
let arr = [];
for (let key of keys){
arr.push(obj[key].name, key);
//arr.push();
}
await fsapi.popDir(root.kids.users, {vals: arr});
	return true;
};//»
const update = async (refarg, obj) => {//«
	if (isStr(refarg)) refarg = get_ref(refarg);
	try{
		await _update(refarg, obj);
		return true;
	}
	catch(e){
cwarn("The update failed!");
cerr(e);
		return false;
	}
};//»
//const update = async (refarg, obj) => {//«
////This "safe" update sets a timeout for a "reasonable" period, and warns if the server has
////not completed within the specified interval. If after returning, we have previously warned,
////then we let the user know that the update has finished. In case everything works fine,
////nothing is reported.
//	if (isStr(refarg)) refarg = get_ref(refarg);
//
//	let have_num = update_num;
//	update_num++;
//	let did_warn = false;
//	let timeout = setTimeout(()=>{
//cwarn(`update#${have_num} has not returned after: ${AWAIT_UPDATE_MS}ms!`);
//		did_warn = true;
//	}, AWAIT_UPDATE_MS);
//	try {
//		await _update(refarg, obj);
//		clearTimeout(timeout);
//		if (did_warn){
//log(`update#${have_num} has finally returned!`);
//		}
//	}
//	catch(e){
//cwarn(`An error has occurred for update#${have_num}`);
//cerr(e);
//	}
//};//»
const parallel_sort = (primary, secondary, if_rev) => {//«
//«
//Say you are given 2 JS arrays of equal length. One of them must be sorted
//according to the results of a call to sort, and the other one should likewise
//be sorted such that all of its elements should have their positions swapped in
//the same manner as the first.
//
//Grok: doesn't work!
//function sortWithPartner(arr1, arr2) {
//	const indices = arr1.map((_, i) => i);
//	indices.sort((a, b) => arr1[a] - arr1[b]);
//	return [
//		indices.map(i => arr1[i]),
//		indices.map(i => arr2[i])
//	];
//}
//»
// 1. Combine into an array of objects
const combined = primary.map((value, index) => {
	return {
		first: value,
		second: secondary[index]
	};
});

// 2. Sort the array of objects based on the first  value
if (if_rev){
	combined.sort((a, b) => {
		if (a.first > b.first) {
			return -1;
		}
		if (a.first < b.first) {
			return 1;
		}
		return 0;
	});
}
else {
	combined.sort((a, b) => {
		if (a.first < b.first) {
			return -1;
		}
		if (a.first > b.first) {
			return 1;
		}
		return 0;
	});
}

//// 3. Separate the sorted values back into new arrays
//const sortedPrimary = combined.map(item => item.first);
//const sortedSecondary = combined.map(item => item.second);
//
//return [sortedPrimary, sortedSecondary];

return [
	combined.map(item => item.first),
	combined.map(item => item.second)
];

}//»
const get_fbase_user = () =>{//«
	return new Promise((Y,N)=>{
		const auth = getAuth(app);
		let cb = onAuthStateChanged(auth, (user) => {
			cb();
			Y(user);
		});
	});
};//»
const get_ref = (path) => {//«
	if (path) return ref(db, path);
	return  ref(db);
};//»
const get_value = async(ref)=>{//«

let rv;
try{
	rv = await get(ref);
	return rv;
}
catch(e){
	return e;
}

};//»
const delete_auth = () => {//«
	if (globals.auth.github.uid) {
		localStorage.removeItem(`github-${globals.auth.github.uid}`);
		delete globals.auth.github.uid;
		delete globals.auth.github.login;
	}
};//»
const set_auth = (uid, login) => {//«
	globals.auth.github.uid = uid;
	globals.auth.github.login = login;
};//»

const run_transaction = (ref, value, delay=DEF_TRANS_DELAY) => {//«
// * Executes a Firebase transaction with a timeout, ensuring a pending write is
// * aborted if it hasn't completed within the delay.
// *
// * @param {firebase.database.Reference} ref The database reference.
// * @param {*} value The value to set.
// * @param {number} delay The timeout duration in milliseconds.
// * @returns {Promise<void>} A promise that resolves when the transaction
// *   completes or rejects if it fails or times out.

return new Promise(async(resolve, reject) => {
	// Flag to track if the timeout has already occurred
	let timedOut = false;
	let timer;
	// Reject the promise and abort the transaction on timeout
	const onTimeout = () => {
		timedOut = true;
//		ref.transaction(() => undefined); // Send an abort command to the queue
		runTransaction(ref, ()=>{return undefined;});
		resolve(new Error('Firebase write operation timed out.'));
	};

	// Start the timeout timer
	timer = setTimeout(onTimeout, delay);
	let result;
	try {
		result = await runTransaction(ref, curVal=>{
			// If the timer has already fired, abort the transaction
			if (timedOut) {
				return undefined; // Returning undefined aborts the transaction
			}
			return value;
		});
		clearTimeout(timer);
		if (result.committed) {
//log('Transaction successfully committed.');
			resolve(true);
		} 
		else {
			// If the transaction aborted for a reason other than our timeout
//log('Transaction aborted by another process.');
			resolve(new Error('Transaction aborted by another client.'));
		}
	}
	catch(error){
		clearTimeout(timer);
cerr(error);
		resolve(error);
	}
//«
//	ref.transaction((currentValue) => {
//	}).then((result) => {
//		// Clear the timer if the transaction completes for any reason
//	}).catch((error) => {
//		// Clear the timer if the transaction fails
//		clearTimeout(timer);
//		reject(error);
//	});
//»
});
}//»
const get_id = ()=> {//«
	let gh_id = globals.auth.github.uid;
	if (!gh_id){
		return "please call 'user' first!";
	}
	return parseInt(gh_id);
};//»

const set_name = async(use_name)=>{//«

if (!use_name) {
	use_name = await get_name();
	if (isErr(use_name)) return use_name;
//	if (isStr(use_name)) return use_name;
}
//log(`SETTING: ${ghid}: ${use_name}`);
return await update(`/names`, {[ghid]: use_name});

};//»




const fb_read = async(ghid, path, opts = {})=>{//«

let rel_path_enc = "";
if (path.match(/\x2f/)) {
if (path === "/"){
return new Error("'/': invalid path");
}
	let arr = path.split("/");
	for (let name of arr){
		rel_path_enc+=`/kids/${encode_key(name)}`;
	}
}
else{
	rel_path_enc=`/kids/${encode_key(path)}`;
}

let base_path = `/user/${ghid}${rel_path_enc}/contents`;

let snap = await get_value(get_ref(base_path));
if (isErr(snap)){
//	return this.no(snap.message);
	return snap;
}
if (!snap.exists()){
	return new Error(`${path}: not found`);
}

if (opts.forceText || opts.text){
	return (atob(snap.val()));
}
else {
	return FROMB64(snap.val());
}

};//»
globals.funcs["netfs.fbRead"] = fb_read;

const do_fbase_fs_op = async(_this, optsArg={}) => {//«

let ghid = get_id();
if (isStr(ghid)){
	_this.no(ghid);
	return;
}
//This currently only works in the base user dir

const{args, opts}=_this;
if (!is_connected && !opts.offline){
	_this.no("not connected (use --offline to force)");
	return;
}

//let ghid = globals.auth.github.uid;
let path = args.shift();

if (!path) return _this.no("no path given");

let use_obj;
let use_val;
let say_type;
if (optsArg.mkDir){//«
	use_obj = NEW_DIR;
	use_val = FBASE_DIRECTORY_VAL;
	say_type = "folder";
}
else if (optsArg.bytes){
	let bytes = optsArg.bytes;
	use_val = bytes.byteLength;
	say_type = "file";
	use_obj = {type: "f", size: bytes.byteLength, contents: B64(bytes)};
}
else if (optsArg.rmDir) {
	say_type = "folder";
	use_obj = {};//This effectively deletes the object from the database
}
else if (optsArg.rmFile){
	say_type = "file";
	use_obj = {};//Same as above
}
else {
	use_obj = NEW_FILE
	use_val = 0;
	say_type = "file";
}//»

let rel_path_enc = "";
let name;
if (path.match(/\x2f/)) {
if (path === "/"){
return _this.no("'/': invalid path");
}
	let arr = path.split("/");
	name = arr.pop();
	for (let name of arr){
		rel_path_enc+=`/kids/${encode_key(name)}`;
	}
}
else{
	name = path;
}
let base_path = `/user/${ghid}${rel_path_enc}`;
let list_ref = get_ref(`${base_path}/list`);
let snap = await get_value(list_ref);
if (isErr(snap)){
	return _this.no(snap.message);
}
if (!snap.exists()){
	if (!rel_path_enc) _this.no("you must create your user directory with fbmkhomedir!");
	else{
		_this.no(`the parent directory was not found`);
	}
	return 
}

let list = snap.val();
let ind = list.names.indexOf(name);
if (ind >= 0){
	if (optsArg.mkDir) {
		_this.no(`exists: ${name}`);
		return;
	}
	else if (optsArg.rmDir){
		if (list.vals[ind] !== FBASE_DIRECTORY_VAL){
			_this.no(`'${name}': not a directory`);
			return;
		}
		let rv = await get_value(get_ref(`${base_path}/kids/${encode_key(name)}/size`));
		if (isErr(rv)){
			return _this.no(rv.message);
		}
		if (rv.val() > 0){
			return _this.no(`'${name}': the directory is not empty`);
		}
	}
	else if (optsArg.rmFile){
		if (list.vals[ind] === FBASE_DIRECTORY_VAL){
			_this.no(`'${name}': is a directory`);
			return;
		}
	}
	else if (!use_val){
		_this.ok(`exists: ${name}`);
		return;
	}
	else if (list.vals[ind] === FBASE_DIRECTORY_VAL){
		_this.no(`'${name}': cannot write to the directory`);
		return;
	}
	else{
//We have a value and a file (update it)
		list.names.splice(ind, 1);
		list.vals.splice(ind, 1);
	}
}
else if (optsArg.rmDir || optsArg.rmFile){

_this.no(`'${name}': not found`);
return;
}

let use_len;
if (optsArg.rmDir || optsArg.rmFile){
	list.names.splice(ind, 1);
	list.vals.splice(ind, 1);
	use_len = list.names.length;
	if (!use_len){
		list.names=[false];
		list.vals=[false];
	}
}
else if (!list.names[0]){
	list.names = [name];
	list.vals = [use_val];
	use_len = 1;
}
else{
	list.names.push(name);
	list.vals.push(use_val);
	let rv = parallel_sort(list.names, list.vals);
	list.names = rv[0];
	list.vals = rv[1];
	use_len = list.names.length;
}

let enc_path = encode_key(name);

let update_obj = {
	list,
	size: use_len,
	[`kids/${enc_path}`]: use_obj
};
if (await update(base_path, update_obj)) _this.ok();
else _this.no("Update failed! (see console for error)");

};//»


//»

//Commands«


const com_ghname2id = class extends Com{//«

async run(){
const{args}=this;
let name = args.shift();
if (!name) return this.no("Need a github username!");
let rv;
try{
rv  = await fetch(`https://api.github.com/users/${name}`)
}
catch(e){
this.no(e.message);
cerr(e)
return;
}
if (!rv.ok){
this.no("Could not fetch");
return;
}
let obj = await rv.json();
if (!(obj&&obj.id)){
	this.no("NO OBJ && OBJ.ID FOUND?!?!? (see console)");
	cwarn("There is no id on the object below!?!?!?");
	log(obj);
	return;
}
this.out(obj.id+"");
this.ok();
}

}//»
const com_ghid2name = class extends Com{//«

async run(){
const{args}=this;
let id = args.shift();
if (!id) return this.no("Need a github id!");
let rv;
try{
rv  = await fetch(`https://api.github.com/user/${id}`)
}
catch(e){
this.no(e.message);
cerr(e)
return;
}
if (!rv.ok){
this.no("Could not fetch");
return;
}
let obj = await rv.json();
if (!(obj&&obj.login)){
	this.no("NO OBJ && OBJ.LOGIN FOUND?!?!? (see console)");
	cwarn("There is no login on the object below!?!?!?");
	log(obj);
	return;
}
this.out(obj.login+"");
this.ok();
}

}//»
const com_fbsetname = class extends Com{//«
async run(){
const{args}=this;
if (await set_name()) this.ok();
else this.no("Update failed! (see console for error)");
}
}//»
const com_user = class extends Com{//«
//This will be the interface into one's own user account
static getOpts(){
	return{
		s:{
			f: 1,
			c: 1
		},
		l:{
			force: 1,
			click: 1
		}
	};
}
async run(){

const{args, opts, env}=this;
let com = args.shift();
if (!com) com = "stat";
//log(env);
const coms = ["signin", "in", "i", "signout", "out", "o", "stat"];
if (!coms.includes(com)){
	this.no(`invalid command: ${com}`);
	return;
}

let is_signin = com === "signin" || com === "in" || com === "i";
let is_signout = com === "signout" || com === "out" || com === "o";
let is_stat = com === "stat";

if ((is_stat || is_signin) && globals.auth.github.login && !(opts.force || opts.f)){
	let already = "";
//	if (is_signin) already = " already";
	this.ok(`you are${already} signed in as: ${globals.auth.github.login}`);
	return;
}

const auth = getAuth(app);

const handle_user = async user => {//«
	if (is_signout){
		try{
			await signOut(auth);
			delete_auth();
			this.ok('Signed out');
		}
		catch(e){
			cerr(e);
			this.no(e.message);
		}
		return;
	}
	if (!(user.uid && user.providerData && user.providerData[0].uid)){
		this.no("'uid' NOT FOUND in user OR user.providerData[0]! (see console)");
cwarn("Here is the offending user object without user.id OR user.providerData[0].uid");
log(user);
		return;
	}
	let uid = user.providerData[0].uid;
	env["GITHUB_ID"] = uid;
//	let uid = user.uid;
	let login = localStorage.getItem(`github-${uid}`);
	if (login){
		env["GITHUB_NAME"] = login;
log("Got github login", login);
		set_auth(uid, login);
		this.ok(`you are signed in as: ${login}`);
		return;
	}
	login = await get_name(uid);
	if (isErr(login)){
		this.no(login.message);
		return;
	}
	env["GITHUB_NAME"] = login;
//«
//	let rv;
//	try{
//		rv = await fetch(`https://api.github.com/user/${uid}`);
//	}
//	catch(e){
//		this.no(`fetch error: ${e.message}`);
//cerr(e);
//		return;
//	}
//	if (!rv.ok){
//		this.no(`could not fetch the user object for github uid(${uid}) from api.github.com!`);
//		return;
//	}
//	let obj = await rv.json();
////SUKFMGH
//	login = obj.login;
//	if (!login){
//		this.no(`no login name for github uid(${uid}) on the user object received from api.github.com!`);
//		return;
//	}
//log("Setting", `github-${uid}`, login);
//»
	localStorage.setItem(`github-${uid}`, login);
	set_auth(uid, login);
	this.ok(`you are signed in as: ${login}`);
};//»

let cb = onAuthStateChanged(auth, async user => {//«
cb();//Just doing this once, so the returned value is supposed to unregister the callback.

if (user) return handle_user(user);

delete_auth();

if (!is_signin) {
	this.ok("You are signed out");
	return;
}

//«
//Either the user clicks a sign-in button, and pop_div.cancel() will be called, or
//they will click the popup's lone button (here arbitrarily labelled "CANCEL"), and 
//the command will immediately return. 
//
//If they try clicking the popup's button after clicking one of the sign-in
//buttons, the popup's callback will return because the is_active flag is set.
//»

let pop_div;
let is_active = false;
const do_signin = async()=> {//«
	try {
		await signInWithPopup(auth, new GithubAuthProvider());
		pop_div && pop_div.cancel();
	}
	catch(e){
		cerr(e);
		this.no(e.message);
		pop_div && pop_div.cancel();
		return;
	}
	user = await get_fbase_user();
	if (user){
		handle_user(user);
	}
	else{
		this.no(`Failed to get user object after after signing in`);
	}
};//»
if ((opts.click || opts.c) && globals.popup) {//«

if (!document.getElementById(GSI_CSS_ID)) {
	let sty = mk("style");
	sty.innerHTML = GSI_CSS_STR;
	sty.id = GSI_CSS_ID;
	document.head.appendChild(sty);
}

const button_div = mkdv();
button_div.innerHTML = LOGIN_BUTTONS_STR;
let gh_but;
let buttons = button_div.getElementsByTagName("button");
for (let but of buttons){
	if (but.name == GITHUB_BUT_ID){
		gh_but = but;
	}
}
pop_div = globals.popup.popup(button_div, {//«
	cb: ()=>{
		if (is_active) return;
//If we get down here, neither of the sign-in buttons will have been clicked
		this.wrn("Cancelled!");
		this.ok();
	}, 
	oktxt: "CANCEL"
});//»
gh_but.onclick=async()=>{//«
	is_active = true;
	gh_but.onclick = null;
//	goog_but.onclick = null;
	do_signin();
};//»

}//»
else{
	do_signin();
}

});//»

}
}//»
const com_users = class extends Com{//«

//mount: mount a filesystem under "/users" of type: USERS_TYPE.

//list; give fine-grained control over what user directories to list inside of /users.

	async run(){
		const{args}=this;
		let com = args.shift();

if (!globals.auth.github.uid){
	return this.no("please call 'user' first!");
}

		if (!com){
			this.no(`missing command`);
			return;
		}
		let did_mount = !!root.kids.users;
		if (com=="mount") {//«
			if (did_mount){
				this.wrn("already mounted");
			}
			else{
				mount_tree("users", USERS_TYPE);
				this.suc("/users: successfully mounted");
let rv = await set_user_dirs();
this.inf("Mounting the users...");
if (isErr(rv)){
this.wrn(`${rv.message}`);
}
else if (rv === true){
this.suc("OK!");
}
else{
this.wrn("Unknown value returned from set_user_dirs! (see console)");
log(rv);
}
//Maybe we should export a basic function to fs.populate_dirobj for use with the basic
//shell/terminal functions like ls and doing tab complete.
			}
			this.ok();
		}//»
		else if (com == "umount"){
			if (did_mount) delete root.kids.users;
			else this.wrn("/users: not mounted");
			this.ok();
		}
		else if (com=="list") {//«
			if (!did_mount) return this.no("Did not mount!");
let user = await get_fbase_user();
if (!user) return this.no("Not signed in!");
log(user);
this.wrn("GET THE LIST...");
this.ok();
		}//»
		else{
			this.no(`unknown command: ${com}`);
		}
	}
}//»
const com_fbase = class extends Com{//«
	async run(){
		const{args}=this;
		let com = args.shift();
		if (com == "ref") {
let path = args.shift();
let ref;
if (path) ref = ref(db, path);
else ref = ref(db);
log(ref);
this.ok();
		}
		else if (com == "set") {
//".write": "newData.child('timestamp').val() > now - 60000"
////".write": "newData.child('timestamp').val() > now - 60000 || !data.exists()"//???
let path = args.shift();
let val = args.shift();
if (!val) val = true;
let ref;
if (path) ref = ref(db, path);
else ref = ref(db);
try {
let rv = await set(ref, val);
this.ok();
}
catch(e){
this.no(e.message);
cerr(e);
}
		}
		else{
			this.no(`'${com}': unknown command`);
		}
	}
}//»
const com_fbtouch = class extends Com{//«
static getOpts(){
	return {
		l: {offline: 1}
	}
}
run(){
	do_fbase_fs_op(this);
}
}//»
const com_fbwrite = class extends Com{//«
static getOpts(){
	return {
		l: {offline: 1}
	}
}
async run(){
//Should we just do a base64 of the bytes?
const{args, term}=this;
let path = args.shift();
if (!path) return this.no("File arg needed");
let bytes = await path.toBytes(term);
if (!bytes) return this.no(`${path}: invalid path`);
if (!bytes.length) return do_fbase_fs_op(this);
do_fbase_fs_op(this, {bytes});
}
}//»
const com_fbmkdir = class extends Com{//«
static getOpts(){
	return {
		l: {offline: 1}
	}
}
run(){
	do_fbase_fs_op(this, {mkDir: true});
}
}//»
const com_fbmkhomedir = class extends Com{//«
async run(){
const{args}=this;

const gh = globals.auth.github;
if (!gh.uid){
	return this.no("please call 'user' first!");
}
let type_ref = get_ref(`/user/${gh.uid}/type`);
let snap = await get_value(type_ref);
if (isErr(snap)){
	return this.no(snap.message);
}
if (snap.exists()){
	this.wrn("the home directory exists");
	this.ok();
	return;
}

let username = await get_name();
if (isErr(username)){
cerr(username);
this.no(username.message);
return;
}

if (await update("/user", {[gh.uid]: NEW_DIR})) this.ok();
else this.no("Update failed! (see console for error)");

//update("/", {
//	[`names/${gh.uid}`]: username, 
//	[`user/${gh.uid}`]: NEW_DIR
//});

}
}//»
const com_fbls = class extends Com{//«
async run(){
const{args}=this;

let ghid = get_id();
if (isStr(ghid)) return this.no(ghid);
let path = args.shift();
let list = await get_user_dir_list(ghid, path);
if (isErr(list)) return this.no(list.message);
let names = list.names;
if (names[0]===false){
	this.wrn(`the directory is empty`);
	this.ok();
	return;
}
let vals = list.vals;
let out = "";
for (let i=0; i < names.length; i++){
	let nm = names[i];
	if (vals[i]===-1){
		nm = `${nm}/`;
	}
	out += `${nm} `;
}
this.out(out);
this.ok();
}
}//»
const com_fbstat = class extends Com {//«
	async run(){
		const{args}=this;

//		let ghid = get_id();
//		if (isStr(ghid)) return this.no(ghid);
		let id = globals.auth.github.uid;
		let login = globals.auth.github.login;
		if (!(id && login)) return this.no("please call 'user' first");
		if (!args.length){
			return this.no("Nothing given!");
		}
		let obj = {
			time: serverTimestamp(),
			msg: args.join(" "),
			name: login
		};
		if (await update("/status", {[id]: obj})) this.ok();
		else this.no("Update failed! (see console for error)");
	}
}//»
const com_fbstats = class extends Com{//«
static getOpts(){
return {
s:{
y: 1,
s: 1
}
}
}
//This allows for the ability to run a query on the numerical ids, and get back whatever relevant
//information they might want to provide.

async run(){
const{args, opts}=this;

let snap = await get_statuses();
if (isErr(snap)) return this.no(snap.message);
let use_year = opts.y;
let use_secs = opts.s;
snap.forEach(kid=>{
	let val = kid.val();
	let arr = (new Date(val.time)+"").split(" ");
	let time = use_secs ? arr[4] : arr[4].replace(/:..$/, "");
	let str = use_year ? `${arr[1]} ${arr[2]} ${arr[3]} ${time}` : `${arr[1]} ${arr[2]} ${time}`;
	this.out(`${val.name} (${str}): ${val.msg}`);
});
this.ok();
}
}//»
const com_fbrm = class extends Com{//«
async run(){
const{args}=this;
//This is just like write, but we pass null to existing file ref
do_fbase_fs_op(this, {rmFile: true});
}
}//»
const com_fbrmdir = class extends Com{//«
async run(){
const{args}=this;
//This is just like write, but we pass null to an existing directory ref
do_fbase_fs_op(this, {rmDir: true});
}
}//»

const com_fbread = class extends Com{//«

async run(){

const{args}=this;
let ghid = get_id();
if (isStr(ghid)){
	this.no(ghid);
	return;
}
let path = args.shift();
if (!path){
	return this.no("path not given");
}
let is_text = path.hasTextExt();
let val = await fb_read(ghid, path, {forceText: is_text});
//«
//let rel_path_enc = "";
//if (path.match(/\x2f/)) {
//if (path === "/"){
//return this.no("'/': invalid path");
//}
//	let arr = path.split("/");
//	for (let name of arr){
//		rel_path_enc+=`/kids/${encode_key(name)}`;
//	}
//}
//else{
//	rel_path_enc=`/kids/${encode_key(path)}`;
//}
//
//let base_path = `/user/${ghid}${rel_path_enc}/contents`;
//
//let snap = await get_value(get_ref(base_path));
//if (isErr(snap)){
//	return this.no(snap.message);
//}
//if (!snap.exists()){
//	this.no(`${path}: not found`);
//	return;
//}
//»
if (isErr(val)){
this.no(val.message);
return;
}
this.out(val);

this.ok();

}
}//»

//»

//Export«
const coms = {
	users: com_users,
	user: com_user,
	ghname2id: com_ghname2id,
	ghid2name: com_ghid2name,
	fbase: com_fbase,
	fbtouch: com_fbtouch,
	fbmkdir: com_fbmkdir,
	fbmkhomedir: com_fbmkhomedir,
	fbls: com_fbls,
	fbstat: com_fbstat,
	fbstats: com_fbstats,
	fbwrite: com_fbwrite,
	fbrm: com_fbrm,
	fbrmdir: com_fbrmdir,
	fbread: com_fbread,
	fbsetname: com_fbsetname,
}

export {coms, onkill};

//»
*/

/*«

PAST:

root: {

".read": false,
".write": false,

LOTW: {

	"$ghid": {
		session_ids: { // Register a unique session id here upon local initialization, stored locally
			".validate": "!root.child($ghid).child('session_ids')[newData.val()]"
		},
		cur_session_id: {
			'.validate": "newData.isString() && newData.val().length == 4"
		},
		next_node_id: {
		},
		nodes: {
			".indexOn" = ["parId", "path"],
			"$nodeId": {
				".read": "auth != null",
				".write": "auth.ghid = $ghid",
				".validate": "data.exists() || newData.hasChildren(['parId', 'type', 'path'])",
				"parId": { // Mutable
					".validate": "newData.isNumber()"
				},
				"path": { // Mutable: parId/name
					".validate": "newData.isString() && newData.val().length < $PATH_MAX"
				},
				"type": {
					".validate": "!data.exists() && newData.isString() && newData.val().length < $TYPE_MAX"
				},
				"blobId": {
					".validate": "!data.exists() && newData.isString() && newData.val().length < $ID_MAX"
				}
				"$other": {
					".validate": false
				}
			}
		},
		blobs: {
			"$blobId": {
				"meta": { // Example
					"field1": {
						".validate": "newData.isString() && newData.val().length < $FIELD1_MAX"
					},
					"field2": {
						".validate": "newData.isNumber()" 
					},
					"field3": {
						".validate": "newData.isBoolean()"
					},
					".other": {
						".validate": false
					}
				},
				"contents": {
					".validate": "newData.isString() && newData.val().length < $CONTENTS_MAX"
				},
				"$other": {
					".validate": false
				}
			}
		}
	}
},

OTHER_NS: {

}

}

»*/
/*«
goog_but.onclick=async()=>{//«
	is_active = true;
	goog_but.onclick = null;
	gh_but.onclick = null;
	try {
		await fbase.signInWithPopup(auth, new fbase.GoogleAuthProvider());
		this.ok("Signed in with Google!");
	}
	catch(e){
		cerr(e);
		this.no(e.message);
	}
	pop_div.cancel();
};//»
<button name="${GOOGLE_BUT_ID}" class="gsi-material-button">
  <div class="gsi-material-button-state"></div>
  <div class="gsi-material-button-content-wrapper">
    <div class="gsi-material-button-icon">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: block;">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
      </svg>
    </div>
    <span class="gsi-material-button-contents">Sign in with Google</span>
    <span style="display: none;">Sign in with Google</span>
  </div>
</button>
<br><br>
»*/
/*«
const firebaseConfig = {
	apiKey: "AIzaSyCEEMw3b1_bWj-OxM9oMKlKhkTTWxbIhlI",
	authDomain: "linuxontheweb.firebaseapp.com",
	databaseURL: "https://linuxontheweb.firebaseio.com",
	projectId: "linuxontheweb",
	storageBucket: "linuxontheweb.firebasestorage.app",
	messagingSenderId: "668423415088",
	appId: "1:668423415088:web:979b40c704cab2322ed4f5"
};
»*/

//»

