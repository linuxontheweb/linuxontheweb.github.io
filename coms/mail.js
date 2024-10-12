/*

10/11/24 Creating indices/indexes @TROIPMJHG:

The Unix timestamp in seconds doesn't make any sense as an index!  Maybe we
should index the "daystamp" instead (timestamp/86400)

What about a "group" index, so that individual email addresses can be classified?

What about setting the partnames (FetchQueryObject.source.bodyParts) as BODY[TEXT]
or TEXT??? Or: BODY[1.1] (instead of BODY[1])? Then we do:
FetchQueryObject = {source:{bodyParts:["BODY[TEXT]"]}} !?!?

*/
/*Google allows app passwords also (like Yahoo):«
https://stackoverflow.com/questions/72480275/is-there-a-work-around-google-disabling-less-secure-apps?rq=1

1. set 2-Step Verification ON https://i.sstatic.net/TtJ4m.png

2. create 16-character "App password"( How to create app password) -> result
should be similar to: 16-character "App password"
https://support.google.com/mail/answer/185833?hl=en
https://i.sstatic.net/as6O9.png

3. Instead of Google account password use 16-character password

https://myaccount.google.com/u/0/apppasswords
https://myaccount.google.com/apppasswords

»*/
/*«

First, I don't want to do any user-level stuff right here. The "to" user of all the
emails in the INBOX are simply implied. Let's just create a db called mail, with
an objectStore called inbox (or something).

I connected at 11:12 am, and polled using imapstat every 5 minutes at 11:18, 11:23,
11:28, 11:33, 11:38, then at the 29 minute mark at 11:42. It worked every time. Then
at 11:47, I got the client.on('close', ()=>{...}) event without getting a chance
to do another poll. That was a 35 minute long connection!

How to fetch messages? 
How to fetch part of read only message in imap?

https://stackoverflow.com/questions/70962906/how-to-fetch-part-of-read-only-message-in-imap

What is the exact FETCH command that is used to read only the text body of message 1?

I tried this below and variations of it but it says BAD Error in IMAP and Unknown command.

**FETCH 1:1 (BODY[HEADER.FIELDS (TEXT)]**

Im executing this in Ubuntu on a terminal for my upcoming exam.

Comment:

That retrieves a header field called "text". Try it with "subject" instead of
"text", you'll see what it does. Fetching body[1] retrieves the first bodypart,
which may or may not be a text part. – 

arnt


Answer:

Try _ FETCH 1 (BODY[TEXT]). Why do you have asterisks around your command? You
find the possible arguments to the FETCH command in RFC 3501. You can also play
around with the interactive tool that I wrote.

Kaspar Etter

»*/
//Imports«

const NS = LOTW;

import { util, api as capi } from "util";
const {linesToParas}=capi;
import { globals } from "config";
const{strnum, isarr, isstr, isnum, isobj, log, jlog, cwarn, cerr}=util;
const{fs, APPDATA_PATH}=globals;
const {mkDir, mkFile} = fs.api;
//»

//Var«

const shell_commands = globals.shell_commands;
const command_options = globals.shell_command_options;

const DBNAME = "mail";

const MAILDATA_PATH = `${APPDATA_PATH}/mail`;

const DBVERS_FILE = `${MAILDATA_PATH}/db_vers`;
const CURUSER_FILE = `${MAILDATA_PATH}/cur_user`;

//»

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
log(e.message);
			Y();
		};
		req.onsuccess=e=>{
			db = e.target.result;
			Y(true);
		};
		req.onblocked=e=>{
cerr("Blocked!",e);
			Y();
		};
		req.onupgradeneeded=(e)=>{
cwarn("onupgradeneeded...");
			if (if_del){
				e.target.result.deleteObjectStore(TABLE_NAME);
				return;
			}
//TROIPMJHG
			let store = e.target.result.createObjectStore(TABLE_NAME, {autoIncrement: true});
			store.createIndex("from", "from", {unique: false});
			store.createIndex("time", "time", {unique: false});
//The value of the Message-ID header
			store.createIndex("messId", "messId", {unique: true});

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
this.getStore=()=>{
	return get_store();
};
}//»

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
		txt = linesToParas(txt.split("\n")).join("\n");
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

const imap_fetch=async arg=>{//«
	let url = `/_imap?op=${arg}`;
	let rv = await fetch(url);
	let out = await rv.text();
	if (!rv.ok) {
		let val = out.split("\n")[0];
		return {err: val};
	}
	return {out: out.split("\n")};
};//»

const com_imapcon=async(args, o)=>{//«
	return imap_fetch(`connect`);
};//»
const com_imapdis=async(args, o)=>{//«
	return imap_fetch(`logout`);
};//»
const com_imapbox=async(args, o)=>{//«
	let which = args.shift();
	let url;
	if (!which) url = "whichbox";
	else url = `openbox&box=${which}`;
	return imap_fetch(url);
};//»
const com_imapiscon=async(args, o)=>{//«
	return imap_fetch(`connected`);
};//»
const com_imapstat=async(args, o)=>{//«
	return imap_fetch(`status`);
};//»
const com_imapsetuser=async(args,o)=>{//«

let rv = await imap_fetch(`verify`);
if (rv.err) return rv;

let addr = rv.out.toLowerCase();
log("Have address", addr);
let in_table_name = `in:${addr}`;
let gotstore;
let db;

if (!await mkDir(APPDATA_PATH,"mail")){
	return {err:`Could not create the mail data directory: ${MAILDATA_PATH}`};
}

//Checking/Making CURUSER_FILE. Return if it is the same as the verified user«

let curuser_node = await CURUSER_FILE.toNode();
if (!curuser_node){
log("Making CURUSER_FILE", CURUSER_FILE);
	curuser_node = await mkFile(CURUSER_FILE,{data: {type: "string", value: ""}});
	if (!curuser_node) return {err:`Could not create the CURUSER_FILE (${CURUSER_FILE})`};
}
let curuser_data = await curuser_node.getValue();
if (!(curuser_data && isobj(curuser_data) && curuser_data.type == "string")){
	return {err:`Invalid or missing data returned from CURUSER_FILE (${CURUSER_FILE})`};
}

if (addr == curuser_data.value) return {err: `${addr}: already the current user`};

//return {err: "SHOULD NOT GET HERE!?!?!?!?"}
log("Setting curuser to", addr);

//»
//Get the current database version...«
let dbvers_node = await DBVERS_FILE.toNode();
if (!dbvers_node){
log("Making DBVERS_FILE...");
	dbvers_node = await mkFile(DBVERS_FILE,{data: {type: "number", value: 0}});
	if (!dbvers_node) return {err:`Could not get DBVERS_FILE (${DBVERS_FILE})`};
}
let db_vers_data = await dbvers_node.getValue();
if (!(db_vers_data && isobj(db_vers_data) && db_vers_data.type == "number" && Number.isFinite(db_vers_data.value))){
	return {err:`Invalid or missing data returned from DBVERS_FILE (${DBVERS_FILE})`};
}
let db_vers = db_vers_data.value;
log("db_vers", db_vers);
//»

//Let's see if there is already an objectStore named in_table_name, under a non-zero version//«
if (db_vers > 0){
//Since we have not incremented anything, onupgradeneeded SHOULD NOT be called
	db = new DB(db_vers+"", in_table_name);
	if (!await db.init()){
		return {err:"Could not initialize the db for verifying if the object store already exists"};
	}
	gotstore = db.getStore();
	if (gotstore){
cwarn(`The store for address ${addr} already exists`);
	}

}//»
//Make the object store for this address//«
if (!gotstore) {
	if (db) db.close();
	db_vers++;
	db = new DB(db_vers+"", in_table_name);
//onupgradeneeded SHOULD be called here
	if (!await db.init()){
		return {err:"Could not initialize the db for adding"};
	}
}
//»
//Cleanup (update all values stored under MAILDATA_PATH)«
db.close();

if (!await dbvers_node.setValue({type:"number", value: db_vers})){
	return {err:"Could not set the new db version's value"}
}

if (!await curuser_node.setValue({type:"string", value: addr})){
	return {err:"Could not set the current user's value"}
}
//»

return {out: `Set current imap user to: ${addr}`};

};//»
const com_imapdropdb=async()=>{//«
	const do_drop=()=>{//«
		return new Promise((Y,N)=>{
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
	if (!await do_drop()) return {err: `Dropping database (${DBNAME}) failed!`}
	return {out: "Drop OK"}
};//»
const com_imapgetseq=async(args, o)=>{//«
	let seq = args.shift();
	if (!(seq && (seq.match(/^\d+$/) || seq === "*"))) return {err: "Invalid or no 'seq' arg!"}
	return imap_fetch(`getseq&seq=${seq}`);
};//»

export const coms = {//«

smtp: com_smtp,

imapsetuser: com_imapsetuser,
imapcon: com_imapcon,
imapdis : com_imapdis,
imapbox: com_imapbox,
imapiscon: com_imapiscon,
imapstat: com_imapstat,
imapdropdb: com_imapdropdb,
imapgetseq: com_imapgetseq
//email: com_email

};//»
export const opts = {//«
//	email:{
//		s:{a:1,d:1},
//		l:{add:1,del:1},
//	},
	smtp:{
		s:{p:1},
		l:{"to-paras":1}
	}
};//»

/*

this.init = (address, o={})=>{//«

let {op, opts}=o;
this.command_str = o.command_str;

return new Promise(async(Y,N)=>{

	if (!(address&&isstr(address))){
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
	if (!(isobj(db_vers_data) && db_vers_data.type == "number" && Number.isFinite(db_vers_data.value))){
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


const com_email = async(args, o)=>{//«


//l:{adduser:3,deluser:3,setuser:3}
//
//For adduser, deluser, and curuser options (and other administration tasks), we can send
//this information into init, which can take care of the users/curuser file (and the
//table adding/deleting if needed), and then return before invoking init_new_screen/set_screen.
//
//adduser: add to the users file and make the tables
//deluser: rm from the users file and delete the tables (after a prompt screen)
//setuser: write the given user email to the curuser file, and use this user for the next session. 
//This must be checked against available users who were added with adduser.

	let address = args.shift();//«
	let err;
	if (!address) err="No address given";
	else{
		address = address.toLowerCase();
		let arr = address.split("@");
		if (!(arr.length==2 && arr[0] && arr[1])) err="Invalid address code #1";
		else{
			let user = arr[0];
			if (!user.match(/^[a-z]([-_a-z0-9]*[a-z0-9])?$/)) err = "Invalid address code #2";
			if (user.match(/[-_][-_]/)) err = "Invalid address code #6";

			let domain = arr[1];
			let domain_arr = domain.split(".");
			if (domain_arr.length < 2) err = "Invalid address code #3";
			else{
				let tld = domain_arr.pop();
				if (!tld.match(/^[a-z]{2,}$/)) err = "Invalid address code #4";
				else{
					for (let dom of domain_arr){
						if (!dom.match(/^[a-z]([-_a-z0-9]*[a-z0-9])?$/)){
							err = "Invalid address code #5";
						}
						if (dom.match(/[-_][-_]/)) err = "Invalid address code #7";
						if (err) break;
					}
				}
			}
		}
	}//»
	if (err) return {err};

	const {term, opts, stdin, command_str} = o;

	let add = opts.add || opts.a;
	let del = opts.del || opts.d;

	if (add && del) return {err: "The 'add' and 'del' options were both specified!"}

	let op;
	if (add) op="add";
	else if (del) op="del";

    if (!await capi.loadMod("util.email")) {
        return {err: "Could not load the email module"};
    }
    let email = new NS.mods["util.email"](term);
    let rv = await email.init(address,{command_str, op});
    if (isstr(rv)){
        return {err: rv};
    }

};//»

*/

