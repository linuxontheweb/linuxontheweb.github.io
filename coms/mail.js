
//«Notes

/*1/20/25: Notes for email REPL @SBSNOWP«

In the REPL, we have handles on the following things:

db: the database for the current email address
db.new: object store of new emails (listing of envelopes retrieved since 'last_poll_time')
db.saved: object store of saved emails (emails that *were* new, but then the text bodies 
  were retrieved from the IMAP server, and so they got moved to the "saved" object store)

MUD: The "Mail User Directory": /var/appdata/mail/<email_addr>

MUD/last_poll_time: The timestamp of the last polling for new envelopes (initialized to 0)
	- There should probably be a command that lets a user set/reset this to any arbitrary
	  numerical value (perhaps checking that it isn't greater than the current time).
MUD/Drafts/: The directory that holds all email drafts (original emails to a "contact" 
	and responses to emails in db.saved)
MUD/Sent/: The directory that holds all emails that *were* drafts, but that got 
	successfully sent via SMTP.

We will probably also want:

MUD/Contacts/: Directory that holds data nodes of type == "Person" (which should at least 
include an 'email_addr' field).

I think we will want a concept of "transform algorithms" that takes the raw underlying
text of an email draft and converts it into the "final" text, e.g. for replacing
environment variables with their values, or performing other shell-like expansions.
These algorithms should be named, and the names should go onto the email objects.



Let's get rid of the "curUser" concept and just always *require* an address
as the first argument to the 'mail' command. We will assume the user wants to "hardcode"
an 'EMAIL_USER' variable in their terminal environment, e.g. via the '~/.env' file.

So the commands will look like:
  $ mail $EMAIL_USER [cmd [cmd_args...]]

»*/
/*1/18/25: The 'mail' app is just a bunch of juggling back and forth between«  
the mini-REPL, the multiline-selection/multikey-quit modes of less, and the saveFunc mode of
vim.

The "inward" flow is "Poll for New"->New->Saved.
The "outward" flow is (Contacts->compose or Saved->respond) -> Drafts -> Sent

Let's keep everything in /var/appdata/mail, so there is no question as to whether a
command line user can mess with the application logic. Here there will be:
1) db_vers
2) cur_user

Upon the creation of "USER(<email_addr>)", we need at least:
1) data store: "new:<email_addr>"
2) data store: "saved:<email_addr>"
3) FS directory: "/var/appdata/mail/<email_addr>"

For every addition (or deletion) of a user, we will need to increment db_vers, since
each of these operations changes the object store configuration of the "mail"
database.
»*/
/*1/16/25: The LOTW e-mail "application"«

A basic "lesson" here is that applications should *generally* make use of data nodes,
if for no other reason than that there is no real non-system-level (via backend JS) way of
creating/modifying them. The only issue is whether a user has *already* created certain
of the following files as "regular" (FS_TYPE) files. 

All of our (non-databased) data goes in the (user-facing) LOTW folder:
	MAIL_USER_DIR ($MUD): /var/appdata/mail/<user_email_addr> 

This directory, along with the database stores "new:<user_email_addr>" and 
"saved:<user_email_addr>" will be created upon using the command: 
	$ mail --init=<user_email_addr>

Then we can make the file:
	/var/appdata/mail/cur_user (which points to the "active" $MUD)

Also:
	$ mail --use=<user_email_addr> can set the $MUD to another existing one.

There should also be a command dedicated to getting the value of EMAIL_USER
that exists on the server, so we can do something like:
	MY_EMAIL_ADDRESS=`curaddr`
	$ mail --init=$MY_EMAIL_ADDRESS
... or even just
	$ mail --init=`curaddr`

Let's get this via an '/_env' request, so this will be something like:
	await fetch('/_env?val=EMAIL_USER')

Then for every backend service request, we will send <user_email_addr> along, and reject 
the request if the server is not using the same one (hardcoded into the server's 
memory via the environment variables, EMAIL_USER and EMAIL_PASSWORD).

1) $MUD/last_poll_time: The largest timestamp (the most recent inbound email) //«
	that has been entered into database: "new:<user_email_addr>".

	Maybe this can be a data node of type = "timestamp"

//»
2) $MUD/contacts: A JSON data file, to be used as the "contacts" in the Contacts //«
	screen, with each "record" something like:
		{
			address: <email_address>,
			real_name: full name,
			aliases: [list of aliases],
			tags: [list of tags (business, personal, hobby...)],
			dob: date of birth,	
			uri: website or canonical namespace
		}

	- The Contacts aliases should go somewhere on 'globals', for example:
		globals.emailAliases[<user_email_addr>] = {
			nick_a1: <email_address_a>,
			nick_a2: <email_address_a>,
			...
			nick_a<n>: <email_address_a>,//Contact 'a' has <n> nicknames

			nick_b1: <email_address_b>,
			nick_b2: <email_address_b>,//Contact 'b' has 2 nicknames

			nick_c1: <email_address_c>,//Contact 'c' has 1 nickname
			...
		}

		There should usually be 0-1 nicknames per unique email contact.

While it is *possible* to make this an "actual" database, the very concept of a
"contact" is that these are the people you are personally familiar with, and
the list should therefore *not* be very big (e.g. the size of some big company's
list of clients or customers), and so pulling the whole thing into memory should
be a fairly reasonable way to go.

//»

On the server

3) apps/Terminal.js: Terminal app (new div to render "toggled on" lines)//«
  - Create a 'bdiv' in makeDOMElem, that goes right under 'tabdiv'
  - Upon grid init/resizing, create Term.nrows number of divs (via string -> innerHTML).
  - Upon rendering, iterate through the less.multilineSelection array and set/unset the
		backgroundColor values on the relevant row divs
/»
4) apps/Terminal.js: com_mail://«
  - Do a mini-REPL that "listens" for the major commands:
	[q]uit
	[u]pdate
	[n]ew
	[s]aved
	[c]ontacts
	[d]rafts
	[o]utbox
	s[e]nt

	Quit: Gracefully exit the mail REPL

	Update: Get all envelopes since last_poll_time, and add to database store: 
		"new:<user_email_addr>"

	New: lists the envelopes in "new:<user_email_addr>", and allows for fetching the email
		text bodies, which moves the db entries into "saved:<user_email_addr>"

	Saved: lists the emails in "saved:<user_email_addr>", and allows for deleting emails
		(locally or remotely) as well as as responding to emails. There should be an
		easy way to view the email (as HTML) in an app window.

	Contacts: lists the "to" addresses in $MUD/contacts
		- We can add to and delete from the contacts list as well compose a new draft
		to a given contact.

	Drafts: lists the emails in $MUD/Drafts.
		- A "draft" may be created either through Saved->respond or Contacts->compose


	Outbox: lists the emails in $MUD/Outbox, which are finished drafts, and have all
		"final" auto-formatting done to them. A "true rendering" of the email can be 
		seen from here. The 'send' command will iterate through each of these, sending
		them via the SMTP service, and them moving them into $MUD/Sent

		!!! NO: This is redundant because the same algorithm would be used to "preview" 
		drafts, as would be used to "transform" drafts into saved emails. !!!


	sEnt: Lists all emails in $MUD/Sent


	- When using the 'less' module, add a 'multilineSelection' array and an 'exitChars' array
	onto the less object.

	- When using the 'vim' module, add a 'saveFunc' for when the editor's text is to be put 
	somewhere onto a (possibly arbitrarily complex) data node (or directly into a database). 
	This function should return an object like:
		{message: <...>, type: <suc|err|wrn>}

	- For all "create email" commands (respond or compose new), we create a data file
	in $MUD/Drafts, and the put the saveFunc on vim, and then init vim:
		* Blank for "compose new"
		* With the top (subject) line filled in for "respond".

//»
5) mods/term/less.js: Pager mod//«
	In onkeydown-><SPACE>, check for the multilineSelection array member, and toggle the
		appropriate value (scroll_num + y).
	In onkeypress, check for the character's existence in exitChars, and in that case,
		do 'less.exitChar = <char>', before quitting the module.
//»
6) mods/term/vim.js: Editor mod//«
	In the innermost part of vim's internal save function, check for vim.saveFunc, and
		await on that, and put the return value's message onto the status bar.
//»
7) node/svcs/imap.js: Backend IMAP service//«
	Allow for the following IMAP operations:
		- Connect: return a unique/"random" connection session ID to be used in all subsequent operations
			* We should probably only allow a single connection session at a time in the first version
			* A session should "timeout" after TIMEOUT_SECS (proably 10->60 seconds) since the
				last request was issued
		- Fetch all envelopes since <timestamp>
		- Fetch a single text body
		- Disconnect
//»
7) node/svcs/smtp.js: Backend SMTP service//«
	- Probably something needs to be change here...???
//»

»*/
//»

//Imports«

const {globals}=LOTW;
const {fs: fsapi, util}=LOTW.api;
const {MAIL_DB_NAME, MAIL_DB_VERNUM, ShellMod} = globals;
const{isStr, log, jlog, cwarn, cerr}=util;
const {Com} = ShellMod.comClasses;

//»

//Funcs«

const drop_database=(db_name)=>{//«
	return new Promise((Y,N)=>{
		const req = window.indexedDB.deleteDatabase(db_name);
		req.onerror = (event) => {
cerr("Error deleting database.");
			Y();
		};
		req.onblocked = (e)=>{
cwarn("BLOCKED");
			Y();
		};
		req.onsuccess = (e) => {
			Y(true);
		};
	});
}//»

const do_imap_op = async(com, op, add_args) => {//«
//	const{args, opts, term}=com;
	const addr = com.args.shift();
	if (!addr) return com.no(`no 'addr' argument given!`);
	let url = `/_imap?user=${addr}&op=${op}`;
	if (add_args) url = url + "&" + add_args;;
	let rv = await fetch(url);
	let is_ok = rv.ok;
	let txt = await rv.text();
	if (!is_ok) return com.no(txt.split("\n")[0]);
	com.out(txt);
	com.ok();
};//»

//»

class DB {//«

#db;
#mailDataPath;

constructor(addr){//«

	this.#mailDataPath = `${globals.APPDATA_PATH}/mail`;
	this.emailAddr = addr;
	this.dbName = `${MAIL_DB_NAME}:${MAIL_DB_VERNUM}/${addr}`;

}//»
fatal(mess){//«
	throw new Error(mess);
}//»
close(){//«
	if (!this.#db) {
cwarn("CLOSE CALLED WITHOUT INIT?!?!");
		return;
	}
cwarn("Closing the database...");
	this.#db.close();
	this.#db = undefined;
	return true;
}//»
getById(id){//«
	return new Promise((Y,N)=>{
		let req = this.getStore().get(id);
		req.onerror=(e)=>{
			cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(e.target.result);
		};
	});
}//»
putById(id, node){//«
	return new Promise((Y,N)=>{
		let req = this.getStore(true).put(node, id);
		req.onerror=(e)=>{
cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(true);
		};
	});
}//»
delById(id){//«
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
}//»

getStore(if_write){//«
	return this.#db.transaction([this.table_name],if_write?"readwrite":"readonly").objectStore(this.table_name);
}//»
addMessage(mess){//«
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
}//»
async createMessage(time, from, sub, text){//«
//The first 4 are required (subject may be [none])

	if (!subject) subject = "[none]";

	let rv = await add_message({time, from, sub, text});
	if (!rv){
cerr("createMessage: failed");
	}

}//»
async deleteMessage (id){//«

if (!await del_by_id(id)) return;

return true;

}//»
async addMessageText(id, text){//«

	let mess = await get_by_id(id);
	if (!mess) return cerr(`could not get message ${id}`);
	if (mess.text) return cwarn(`message already has a 'text' field!`);
	mess.text = text;
	if (!await put_by_id(id, mess)) return cerr('put_by_id failed!');
	return true;

}//»

async mkUserDir(){//«

/*«Notes

In this new userDir, we want:
1) last_poll_time ("numerical" data node)

These directories are filled with "email" data nodes (possibly with timestamps, too):
	{
		to: <addr>, 
		subject: String, 
		body: String
	}

2) Drafts/
3) Sent/


»*/

	let addr = this.emailAddr;
	let rv = await (`${this.#mailDataPath}/${addr}`).toNode();
	if (rv) {
		return `${addr}: already exists`;
	}
	rv = await fsapi.mkDir(this.#mailDataPath, addr);
	let path = `${this.#mailDataPath}/${addr}`;
	if (!rv) return `could not create the user directory: ${path}`;
	if (!await fsapi.writeDataFile(`${path}/last_poll_time`,{type: "timestamp", val: 0})){
		return `could not create 'last_poll_time' in '${path}'`;
	}
	if (!await fsapi.mkDir(path, "Drafts")){
		return `could not create 'Drafts/' in '${path}'`;
	}
	if (!await fsapi.mkDir(path, "Sent")){
		return `could not create 'Sent/' in '${path}'`;
	}
	return true;
}//»
async rmUserDir(){//«
	let addr = this.emailAddr;
	let dirpath = `${this.#mailDataPath}/${addr}`;
	let rv = await dirpath.toNode();
	if (!rv) {
cwarn(`rmUserDir: ${addr}: does not exist!`);
		return true;
	}
/*
I guess the following call should
1) pass the "root" flag and "fullDirs" flag to 'check_ok_rm'
2) handle recursive removal in 'delete_fobj'.

Since we are dealing with data nodes, deleting the nodes in the "Filesystem" database
will purge all trace of them (as opposed to deleting regular files which do *NOT*
remove the associated blobs from, e.g.: filesystem:http://localhost:8080/temporary/blobs/
*/
	return await fsapi.doFsRm([dirpath], mess=>{
cerr(mess);
	}, {root: true, fullDirs: true});
}//»
async getUserDir(){//«
/*
	if (!addr){
		this.fatal("'addr' argument required!");
		return;
	}
*/
	return await (`${this.#mailDataPath}/${this.emailAddr}`).toNode();
}//»

async dropDatabase(){//«
	return new Promise((Y,N)=>{
		if (this.#db) this.#db.close();
		const req = window.indexedDB.deleteDatabase(this.dbName);
		req.onerror = (event) => {
cerr("Error deleting database.");
			Y();
		};
		req.onblocked = (e)=>{
cwarn("BLOCKED");
			Y();
		};
		req.onsuccess = (e) => {
			Y(true);
		};
	});
}//»

async initDB(opts={}){//«
//async initDB(username, opts={}){
//async initDB(username, if_del){
/*
let ver_num = await this.getDBVers();//«
if (isStr(ver_num)) return ver_num;
if (!Number.isFinite(ver_num)) {
cwarn("Here is the non-numerical value");
log(ver_num);
	return "invalid value returned from getDBVers (expected a number, see console)";
}//»
*/
let new_table_name="new";
let saved_table_name="saved";

/*«
if (opts.drop){
}
else if (!username) return `no username given!`
else{
	if (opts.add||opts.del) this.version++;
}
»*/

return new Promise((Y,N)=>{//«

//The "version number" here is a hardcoded as '1' because this is not where we are
//doing our "actual" versioning. We are "actually" doing it externally via the names
//of the databases, rather that as a rather obscure internal variable (as the indexedDB 
//api would have us do it).

cwarn(`OPENING: '${this.dbName}'`);

	let req = indexedDB.open(this.dbName, 1);
	req.onerror=e=>{
cerr(e);
		Y();
	};
	req.onsuccess=async e=>{
cwarn("SUCCESS!!!");
		this.#db = e.target.result;
		Y(true);
	};
	req.onblocked=e=>{
cerr(e);
		Y();
	};

//This is only ever called upon database creation, because we have no concept of database "versions" (as the indexedDB api understands them).
	req.onupgradeneeded=(e)=>{
/*«
		if (opts.del){
cwarn("DELETING", new_table_name, saved_table_name);
			e.target.result.deleteObjectStore(new_table_name);
			e.target.result.deleteObjectStore(saved_table_name);
			return;
		}
»*/
log("Upgrading...");
		let newstore = e.target.result.createObjectStore(new_table_name, {autoIncrement: true});
		newstore.createIndex("from", "from", {unique: false});
//		newstore.createIndex("time", "time", {unique: false});

		let savedstore = e.target.result.createObjectStore(saved_table_name, {autoIncrement: true});
		savedstore.createIndex("from", "from", {unique: false});
//		savedstore.createIndex("time", "time", {unique: false});
//		store.createIndex("messId", "messId", {unique: true});
	}
});//»

}//»
async initAppDir(){//«
	let node = await this.#mailDataPath.toNode();
	if (!node){
		if (!await fsapi.mkDir(globals.APPDATA_PATH, "mail")){
			return `fatal: could not create the mail data directory: ${this.#mailDataPath}`;
		}
		return true;
	}
	else if (!node.isDir){
		return "fatal: the mailDataPath node exists, but is not a directory!"
	}
	return true;
}//»

/*«
async getCurUser(){//«
	let node = await this.#curUserFile.toNode();
	if (!node) return;
	return node.data.value;
}//»
async setCurUser(addr){//«
	let node = await this.#curUserFile.toNode();
	if (!node) return;
cwarn("Set curuser to", addr);
log(node);
//	return node.data.value;
}//»
async getDBVers(){//«
	let fname = this.#dbVersFile;
	let node = await fname.toNode();
	if (!node){
log("Making DBVERS_FILE...");
		node = await fsapi.mkFile(fname,{data: {type: "number", value: 0}});
		if (!node) return `Could not get DBVERS_FILE (${fname})`;
	}
	this.#dbVersNode = node;

	let data = await node.getValue();
	if (!data) return `Could not get the data from DBVERS_FILE (${fname})`;
	if (!(isObj(data) && data.type == "number" && Number.isFinite(data.value))){
		return `Invalid data returned from DBVERS_FILE (${fname})`;
	}
	this.version = data.value;
	return this.version;
}//»
async saveDBVers(){//«
	if (!this.#dbVersNode) return `No 'database version node'!`;
	return await this.#dbVersNode.setDataValue(this.version);
}//»
async resetDBVers(){//«
	if (!this.#dbVersNode) return `No 'database version node'!`;
	return await this.#dbVersNode.setDataValue(1);
}//»
»*/

}//»

const com_imapcon = class extends Com{//«
	async run(){
		do_imap_op(this, "connect");
	}
};//»
const com_imapdis = class extends Com{//«
	async run(){
		do_imap_op(this, "logout");
	}
};//»
const com_imapgetenvs = class extends Com{//«
	async run(){
		let days_ago = this.args.shift();
		if (!days_ago) return this.no("need a 'days_ago' argument");
		if (!days_ago.match(/^\d+$/)) return this.no("invalid 'days_ago' argument");
		let ms_ago = (days_ago * 24 * 3600 * 1000);
		let unix_ms = Date.now() - ms_ago;
		if (unix_ms < 0) {
			this.wrn(`got a negative 'unix time' (${days_ago} days ago), setting to 0`);
			unix_ms = 0;
		}
		do_imap_op(this, "getenvs", `since=${unix_ms}`);
	}
};//»

const com_mail = class extends Com{//«

//static opts={l:{init: 3, del: 3, use: 3, drop: 1}};
static opts={s:{r: 1}};

init(){}

async run(){//«

const{args, opts, term}=this;
let rv;
if (opts.r){//«
	let path = `${globals.APPDATA_PATH}/mail`;
	rv = await term.getch(`Recursively remove the *entire* mail directory: '${path}'? [y/n]`);
	if (!rv) return this.no("not deleting");
cwarn("DO DELETE");
	rv = await fsapi.doFsRm([path], mess=>{
cerr(mess);
	}, {root: true, fullDirs: true});
	if (!rv) return this.no();
	this.ok();
	return;
}//»

const addr = args.shift();
if (!addr) return this.no(`no 'addr' argument given!`);

const db = new DB(addr);

rv = await db.initAppDir();
if (!this.checkStrOrTrue(rv, "db.initAppDir")) return;

const cmd = args.shift();

if (!cmd){//«
	if (!await db.getUserDir()) return this.no(`the user: '${addr}' has not been initialized`);
	rv = await db.initDB();
	if (!rv) return this.no(`could not initialize the database for: ${addr}`);

//SBSNOWP
cwarn("Mail REPL here...");
	db.close();
	this.ok();
	return;
}//»

if (cmd === "init"){//«

	if (await db.getUserDir()) return this.no(`the user: '${addr}' has already been initialized`);
	rv = await term.getch(`Create user: '${addr}'? [y/N]`);
	if (!(rv==="y"||rv==="Y")) return this.no("not creating");
	rv = await db.mkUserDir();
	if (!this.checkStrOrTrue(rv, "mkUserDir")) return;
	rv = await db.initDB();
	if (!rv) return this.no(`could not initialize the object stores for: ${addr}`);
	this.ok();
	return;
}//»

//The remaining commands assume that 'addr' has already been initialized
if (!await db.getUserDir(addr)) return this.no(`the user directory for '${addr}' does not exist!`);

if (cmd === "del"){//«

	rv = await term.getch(`Delete user: '${addr}'? [y/N]`);
	if (!(rv==="y"||rv==="Y")) return this.no("not deleting");

	if (!await db.rmUserDir()) return this.no(`error removing user directory: '${addr}'`);
	if (!await db.dropDatabase()) return this.no(`error dropping the database`);
	this.ok();

}//»
else if (cmd){
	this.no(`unknown mail command: '${cmd}'`);
}


}//»

}//»

const com_curaddr = class extends Com{//«
	async run(){
		let rv = await fetch('/_env?key=EMAIL_USER');
		if (!rv.ok) return this.no("EMAIL_USER: not found");
		this.out(await rv.text());
		this.ok();
	}
}//»
const com_dblist = class extends Com{//«
	async run(){
		for (let db of (await indexedDB.databases())){
			this.out(`${db.name} ${db.version}`);
		}
		this.ok();
	}
}//»
const com_dbdrop = class extends Com{//«
	async run(){
		const{term}=this;
		let dbs=[];
		for (let db of  await indexedDB.databases()) dbs.push(db.name);
		for (let arg of this.args){//«
			if (!dbs.includes(arg)) {
				this.err(`${arg}: not an installed database`);
				continue;
			}
			if (arg === globals.FS_DB_NAME){
				this.err(`${arg}: not deleting the entire filesystem!`);
				continue;
			}
			let rv = await term.getch(`Drop database: '${arg}'? [y/N]`);
			if (!(rv==="y"||rv==="Y")) {
				this.wrn(`not dropping: '${arg}'`);
				continue;
			}
			if (!await drop_database(arg)){
				this.err(`error dropping: '${arg}'`);
				continue;
			}
			this.suc(`dropped: '${arg}'`);
		}//»
		this.ok();
	}
}//»

export const coms = {//«

	mail: com_mail,
	curaddr: com_curaddr,
	dblist: com_dblist,
	dbdrop: com_dbdrop,
	imapcon: com_imapcon,
	imapdis: com_imapdis,
	imapgetenvs: com_imapgetenvs

};//»

