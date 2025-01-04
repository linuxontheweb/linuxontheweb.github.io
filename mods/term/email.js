
/*«

Put a database in here and call db.close inside of quit() @DLKUITPEU
For now, this is just for receiving, so we want these indexes:

Each database is named:

mail-in-<address> ( e.g. mail-in-somebody@somewhere.org)

1) From email
2) Timestamp received

The message objects will be:
{
	from: <string>,//Address from which the message was sent
	time: <number>,//Time message was received (Unix timestamp) 
	id: <string>,//Unique message id
	subject: <string>,
	text: <string>,//Main text body (possibly html if there is no plain-text part)
	attachments:[UInt8Array...],

//	Maybe ?????
//	reply: <string>,//forward pointer to the reply
//	repTo: <string>, // backward pointer to message that was replied to
}

»*/
/*«

1) Create an option for the "email" command that takes an "adduser" argument in order to automatically
write to /var/appdata/mail/users (which is a root operation, but it does not look like there is a root
user anymore, i.e. no "su" command). Then we can make a "deluser" option. These will create (and possibly) 
delete) the inbox and outbox databases. Each user is a line in this file, maybe putting first and last
names in there too. The database should be named "email," and the database tables should be named:
	a) username@whatever.com-in: timestamp, from, subject, body
	b) username@whatever.com-out: timestamp, to, subject, body

2) Fetch messages with imapflow and put them in the inbox.

3) Need a mechanism for defining lists (newest in the inbox can be a default list), in order to have
a view into the inbox database.

4) "Respond" to emails by filling out a new email's "to" and "subject" (with re: added, if needed).

5) Create new emails by way of using macros (or something to automate it) to fill in the "to: field.
These get queued into the outbox database. Then, use either a "stat command" kind of input or vim 
(text editor) to create the subject line, and finally use vim for the message body. This kind of
input must still be tested.

6) Send the queued emails in the outbox upon command, or via some kind of "cron" mechanism.

7) Maintain the inbox and outbox by deleting emails singly or in bulk (e.g. via the from field)

Indexed by: timestamp and from/to
But what about the uid's? Maybe use those as the primary keys.

»*/

//Imports«

//import { util, api as capi } from "util";
//import { globals } from "config";
const util = LOTW.api.util;
const globals = LOTW.globals;

const {fs, APPDATA_PATH} = globals;
const MAILDATA_PATH = `${APPDATA_PATH}/mail`;

const DBVERS_FILE = `${MAILDATA_PATH}/db_vers`;

const USERS_FILE = `${MAILDATA_PATH}/users`;
const CURUSER_FILE = `${MAILDATA_PATH}/curuser`;

const {mkDir, mkFile} = fs.api;

const{isStr, isNum, isObj, log, jlog, cwarn, cerr}=util;

//»

const DBNAME = "mail";

const DB = function(db_vers, table_name){//«

this.version = db_vers;
this.storeName = table_name;

let db;
const TABLE_NAME = table_name;

const init_db=(if_del)=>{//«
	return new Promise((Y,N)=>{
		let req = indexedDB.open(DBNAME, db_vers);
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

			if (if_del){
				e.target.result.deleteObjectStore(TABLE_NAME);
				return;
			}
			let store = e.target.result.createObjectStore(TABLE_NAME, {autoIncrement: true});
			store.createIndex("from", "from", {unique: false});
			store.createIndex("time", "time", {unique: false});

//			store.createIndex("messId", "messId", {unique: true});

		}
	});
};//»
const get_store=if_write=>{//«
	return db.transaction([TABLE_NAME],if_write?"readwrite":"readonly").objectStore(TABLE_NAME);
};//»

const add_message = mess => {//«
	return new Promise((Y,N)=>{
		let req = get_store(true).add(mess);
		req.onerror=(e)=>{
cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(true);
		};
	});
};//»

this.init=async(if_del)=>{//«
	if (db) {
cwarn("WHO CALLED DB.INIT?");
		return;
	}
	if (!await init_db(if_del)) {
throw new Error("init_db() failed!");
	}
	return true;
}//»
this.close=()=>{//«
	if (!db) {
cwarn("CLOSE CALLED WITHOUT INIT?!?!");
		return;
	}
cwarn("Closing the database...");
	db.close();
	db = undefined;
};//»

this.createMessage=async(time, from, sub, text)=>{//«
//The first 4 are required (subject may be [none])

	if (!subject) subject = "[none]";

	let rv = await add_message({time, from, sub, text});
	if (!rv){
cerr("createMessage: failed");
	}

};//»
this.deleteMessage = async(id) => {//«

if (!await del_by_id(id)) return;

return true;

};//»

this.addMessageText=async(id, text)=>{//«

	let mess = await get_by_id(id);
	if (!mess) return cerr(`could not get message ${id}`);
	if (mess.text) return cwarn(`message already has a 'text' field!`);
	mess.text = text;
	if (!await put_by_id(id, mess)) return cerr('put_by_id failed!');
	return true;

};//»

this.dropDatabase = () => {//«
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

export const mod = function(termobj) {
this.comName="email";
//Var«
const {//«
	refresh,
	topwin,
	quit_new_screen,
	h
} = termobj;//»

const email = this;

let db;

let appclass="alt";
let hold_screen_state;
let stat_message, stat_message_type;
let lines=[], line_colors=[];
let x=0,y=0,scroll_num=0;

let num_stat_lines = 1;

let active_menu;

let users_node;
let users;

const STAT_NONE = 0;
const STAT_OK=1;
const STAT_WARNING=2;
const STAT_ERROR=3;

const EMAIL_RE = /^.+@.+\.[a-z]+$/i;

const MAIN_MENU=[
"Main Menu",
"0-Quit",
"1-Compose",
"2-Send",
"3-Receive",
"4-Browse",
"5-Maintain",
"6-Administer",
];
const COMPOSE_MENU=[
"Compose Menu",
"0-Back",
"1-New",
"2-Edit",
];
const ADMINISTER_MENU=[
"Administration Menu",
"0-Back",
"1-Add new user",
"2-Set current user",
"3-Remove user"
];
//»

//Funcs«

const onescape=()=>{//«
	if (stat_message_type === STAT_ERROR){
		stat_info();
		render();
		return true;
	}
	return false;
};//»
const quit=(rv)=>{
//DLKUITPEU
	db.close();
	quit_new_screen(hold_screen_state);
};
const render = () => {
	refresh();
};
const set_screen = menu => {
	lines.splice(0, lines.length);
	for (let ln of menu){
		lines.push(ln.split(""));
	}
	active_menu = menu;
	stat_info();
	render();
};
const stat = mess => {
	stat_message = mess;
	stat_message_type = STAT_NONE;
};
const stat_info=()=>{
	stat("*USER NOT SET*");
};
const unknown = (which) => {
	stat_message = "Unknown command";
	if (which) stat_message+=`: '${which}'`;
	stat_message_type = STAT_ERROR;
	render();
};
//»
//Obj/CB«

this.onkeypress=(e, sym, code)=>{//«

/*In here we can put in stuff to invoke vim or less submodes (seeing if we can hack them
both to serve our needs).
*/

	let am = active_menu;

	if (am===MAIN_MENU){
		if (sym==="1") set_screen(COMPOSE_MENU);
		else if (sym==="6") set_screen(ADMINISTER_MENU);
		else if (sym==="0") quit();
		else unknown(sym);
	}
	else if (am===COMPOSE_MENU){
		if (sym==="0") set_screen(MAIN_MENU);
		else unknown(sym);
	}
	else if (am===ADMINISTER_MENU){
		if (sym==="0") set_screen(MAIN_MENU);
		else unknown(sym);
	}

	if (!(code >= 32 && code <= 126)) return;

}//»

//»
//Props«
Object.defineProperty(this,"scroll_num",{get:()=>0});
Object.defineProperty(this, "stat_message", {
	get: () => stat_message,
	set: (s) => stat_message = s
});
Object.defineProperty(this,"stat_message_type",{get:()=>stat_message_type});
//»

this.init = (address, o={})=>{//«

let {op, opts}=o;
this.command_str = o.command_str;

return new Promise(async(Y,N)=>{

	if (!(address&&isStr(address))){
		Y("init() called without a valid address!");
		return;
	}
	address = address.toLowerCase();
	let in_table_name = `in:${address}`;

	if (!await mkDir(APPDATA_PATH,"mail")){
		Y(`Could not create the mail data directory: ${MAILDATA_PATH}`);
		return;
	}

	let dbvers_node = await DBVERS_FILE.toNode();
	if (!dbvers_node){
log("Making DBVERS_FILE...");
		dbvers_node = await mkFile(DBVERS_FILE,{data: {type: "number", value: 0}});
		if (!dbvers_node) return Y(`Could not get DBVERS_FILE (${DBVERS_FILE})`);
	}
	let db_vers_data = await dbvers_node.getValue();
	if (!db_vers_data) return Y(`Could not get the data from DBVERS_FILE (${DBVERS_FILE})`);
	if (!(isObj(db_vers_data) && db_vers_data.type == "number" && Number.isFinite(db_vers_data.value))){
		return Y(`Invalid data returned from DBVERS_FILE (${DBVERS_FILE})`);
	}
	let db_vers = db_vers_data.value;

	users_node = await mkFile(USERS_FILE);
	if (!users_node) return Y(`Could not get the users file: ${USERS_FILE}`);
	users = (await users_node.text).split("\n");
	if (!users[0]) users.shift();

log("USERS", users);
//Users file format:
//address1 [whitespace separated list of aliases...]
//...

//For adduser/deluser/etc, do all that stuff here and then return before init_new_screen.
if (op){//«
	if (op=="add"){
		db_vers++;
		if (users.includes(address)){
	cerr(`add: users[] already has: ${address}`);
			return Y();
		}
		users.push(address);
		db = new DB(db_vers, in_table_name);

		if (!await db.init()){
cerr("Could not initialize the db for adding");
			return Y();
		}
log(db);

	}
	else if (op=="del"){

		let ind = users.indexOf(address);
		if (ind == -1){
	cerr(`del: users[] does not have: ${address}`);
			return Y();
		}

		db_vers++;
		users.splice(ind, 1);
		db = new DB(db_vers, in_table_name);

		if (!await db.init(true)){
cerr("Could not initialize the db for deleting");
			return Y();
		}
log(db);

	}
	else{
cerr(`Unknown operation in init: ${op}`);
		return Y();
	}

	if (!await dbvers_node.setValue({type:"number", value: db_vers})){
cerr("Could not set the new db version");
		return Y();
	}

	if (!await users_node.setValue(users.join("\n"))){
cerr("Could not setValue for users_node!?!?");
log(users_node);
		return Y();
	}

	db.close();
	Y(true);
	return;

}//»

if (!users.includes(address)) {
	return Y(`The address (${address}) has not been added!`);
}

db = new DB(db_vers, in_table_name);


if (!await db.init()){
cerr("Could not initialize the db");
return Y();
}

log(db);

	email.cb = Y;
	hold_screen_state = termobj.init_new_screen(email, appclass, lines, line_colors, num_stat_lines, onescape);
	set_screen(MAIN_MENU);

});

}//»

}



