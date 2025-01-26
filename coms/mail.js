
//«Notes

/*1/20/25: Notes for email REPL @SBSNOWP«

In the REPL, we have handles on the following things:

db: the database for the current email address
db.new: object store of new emails (listing of envelopes retrieved after 'last_uid')
db.saved: object store of saved emails (emails that *were* new, but then the text bodies 
  were retrieved from the IMAP server, and so they got moved to the "saved" object store)

MUD: The "Mail User Directory": /var/appdata/mail/<email_addr>

MUD/last_uid: The largest uid returned from the latest polling for new envelopes (initialized to 0)
	- There should probably be a command that lets a user set/reset this to any arbitrary
	  value.
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

1) $MUD/last_uid: The largest uid (the most recent inbound email) //«
	that has been entered into database: "new:<user_email_addr>".

	Maybe this can be a data node of type = "integer"

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

	Update: Get all envelopes since last_uid, and add to database store: 
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
const E_NEED_NODEJS = "Commands in the 'mail' library require a Node.js installation!";
//Imports«

const {globals}=LOTW;
const {fs: fsapi, util}=LOTW.api;
const {
	DEF_PAGER_MOD_NAME,
	DEF_EDITOR_MOD_NAME,
	MAIL_DB_NAME,
	MAIL_DB_VERNUM,
	ShellMod,
	TERM_STAT_TYPES,
	isNodeJS
} = globals;
const{isStr, isNum, isObj, log, jlog, cwarn, cerr, mkdv, make}=util;
const {Com} = ShellMod.comClasses;
const{STAT_NONE,STAT_OK,STAT_WARN,STAT_ERR} = TERM_STAT_TYPES;

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

const do_imap_op = async(com, op, opts={}) => {//«
//	const{args, opts, term}=com;
	const addr = com.args.shift();
	if (!addr) return com.no(`no 'addr' argument given!`);
	let url = `/_imap?user=${addr}&op=${op}`;
	if (opts.addArgs) url = url + "&" + opts.addArgs;
	let rv = await fetch(url);
	let is_ok = rv.ok;
	let txt = await rv.text();
	if (!is_ok) {
		com.no(txt.split("\n")[0]);
		return false;
	}
	if (opts.retOnly) return txt;
	com.out(txt);
	com.ok();
};//»

//»

const mail_loop = (com, emuser) => {//«
return new Promise(async(Y,N)=>{

const{term}=com;
let imap_logged_in=false;
const help=()=>{//«
	com.inf(`Mail commands: log[i]n log[o]ut [u]pdate [n]ew [s]aved [c]ontacts [d]rafts sen[t] [q]uit [h]elp`, {pretty: true});
};//»
const hang=()=>{return new Promise((Y,N)=>{});}
const do_update=async()=>{//«

	let uid = await emuser.lastUID();
	if (!isNum(uid)){
		com.err("emuser.lastUID() did not return a numerical value (see console)");
		return;
	}

//com.inf(`Using last_uid: ${uid}`);
com.inf(`!!! USING LOCAL FILE: /home/me/ENVSOUT !!!`);

//let envs = await do_imap_op(this, "getenvs", {addArgs: `uid=${uid+1}`, retOnly: true});
//if (envs===false) return;

let envs = await "/home/me/ENVSOUT".toJson();
try{
	let rv = await emuser.saveNew(envs);
	if (isStr(rv)) com.inf(rv);
}
catch(e){
//cerr(e.target.error);
	com.err(`error saving the new envelopes: ${e.target.error} (see console)`);
}

//jlog(arr);
/*«

Now the question is how we handle "login sessions".

1) Upon starting this loop
2) Upon first using an "online" command

let rv = await do_imap_op(this, "getenvs", {addArgs: `since=${unix_ms}`, retOnly: true});

Save these envelopes to user.new, and set last_uid to the 

 {
	"seq": 233,
	"uid": 80348,
	"emailId": "AM0UewsdtemMZ3ENyQJ8uGVPGPs",
	"envelope": {
		"date": "2024-12-29T08:50:32.000Z",
		"subject": "Do not pay your electric bill until you read this.",
		"from":[{"name":"Elon Musk","address":"partners@blezr.wqjsport.com"}],
		"sender":[{"name":"Elon Musk","address":"partners@blezr.wqjsport.com"}],
		"replyTo":[{"name":"","address":"partners@blezr.wqjsport.com"}],
		"to":[{"name":"","address":"dkane75@yahoo.com"}],
		"messageId": "<5lz7yziw7q08vgvapx70wt83h.y1bip31awf.2917983932.qeesdnwi6l.2cwgbqi3@blezr.wqjsport.com>"
	},
	"id": "AM0UewsdtemMZ3ENyQJ8uGVPGPs"
}


»*/

};//»
const do_get = async(url, opts={})=>{//«
	let rv = await fetch(url);
	let is_ok = rv.ok;
	let txt = await rv.text();
	if (!is_ok) {
		com.err(txt.split("\n")[0]);
	}
	else if (opts.isSuc){
		com.suc(txt);
	}
	else return txt;
};//»
const login=(opts)=>{//«
	imap_logged_in=true;
	return do_get(`${base_imap_url}&op=connect`, opts);
};//»
const logout=(opts)=>{//«
	imap_logged_in=false;
	return do_get(`${base_imap_url}&op=logout`, opts);
};//»
const exit=rv=>{//«
	if (imap_logged_in) logout();
	Y(rv);
};//»

const download_and_move_to_saved = async arr => {//«
cwarn("Download, put into emuser.saved and delete from emuser.new");
//log(arr);
for (let obj of arr) {
	let uid = obj.uid;
	com.inf(`Getting uid: ${uid}...`);
	term.render({noCursor: true});
	let rv = await do_get(`${base_imap_url}&op=getuid&uid=${uid}`);
	if (!rv) continue;
	com.inf(`Got ${uid} OK!`, {noBr: true});
	term.render({noCursor: true});
	obj.bodyText= rv;
	if (!await emuser.addItem("saved", obj)){
		com.err(`Add item (uid=${uid}) to emuser.saved: FAILED!`);
		continue;
	}
	if (!await emuser.delItemByKey("new", uid)){
		com.err(`Delete item (uid=${uid}) from emuser.new: FAILED!`);
	}
}
};//»
const show_new_list = async()=>{//«
//cwarn(com.term.w);
//const{term}=com;
let wid = term.w;
if (!await util.loadMod(DEF_PAGER_MOD_NAME)) {
	com.err("could not load the pager module");
	return;
}
let new_arr = await emuser.getAll("new");
if (!new_arr.length){
	com.wrn("No new emails!");
	return;
}
let arr = [];
let curtime = Date.now();
let sels = [];
for (let obj of new_arr){
	let tm = obj.timestamp*1000;
	let diff_days = Math.floor((curtime - tm)/86400000);//86400000 ms/day
	let str = `${diff_days}) ${obj.fromName}: ${obj.subject}`;
	arr.push(str.slice(0, wid));
	sels.push(false);
}
let pager = new LOTW.mods[DEF_PAGER_MOD_NAME](term);
pager.stat_message = `*new*  [q]uit [d]el [s]ave`;
pager.multilineSels = sels;
pager.exitChars=["q", "d", "s"];

await pager.init(arr, "*new emails*", {opts:{}, lineSelect: true});
term.setBgRows();
term.render();
let ch = pager.exitChar;
if (ch==="q") return;
//if (ch==="s"){
let out_arr = [];
for (let i=0; i < sels.length; i++){
if (sels[i]) out_arr.push(new_arr[i]);
}
if (!out_arr.length) return;
//cwarn(`GOTCOM: ${ch}`);
if (ch==="s"){
/*
Let's do this sequentially, showing the progress of each on the terminal
*/
await download_and_move_to_saved(out_arr);
}
else if (ch==="d"){
log("Delete from server then from emuser.new");
}
term.render();
//cwarn("GOT UIDS");
//log(out_arr);
//log(sels);
};//»
const show_saved_list = async()=>{//«
//cwarn(com.term.w);
//const{term}=com;
let wid = term.w;
if (!await util.loadMod(DEF_PAGER_MOD_NAME)) {
	com.err("could not load the pager module");
	return;
}
let saved_arr = await emuser.getAll("saved");
if (!saved_arr.length){
	com.wrn("No saved emails!");
	return;
}
let arr = [];
let curtime = Date.now();
let sels = [];
let enters=[];
for (let obj of saved_arr){
	let tm = obj.timestamp*1000;
	let diff_days = Math.floor((curtime - tm)/86400000);//86400000 ms/day
	let str = `${diff_days}) ${obj.fromName}: ${obj.subject}`;
	arr.push(str.slice(0, wid));
	sels.push(false);
/*
We might want a pager.multilineEnterFuncs in order to, e.g. bring up HTML
windows to show the email messages.
*/
	enters.push(()=>{
		LOTW.Desk.api.openApp("dev.HTML", {force: true, appArgs: {text: obj.bodyText}});
	});
}
let pager = new LOTW.mods[DEF_PAGER_MOD_NAME](term);
pager.stat_message = `*saved* [r]eply [d]el [a]dd_contact [q]uit`;
pager.multilineSels = sels;
pager.multilineEnterFuncs = enters;
pager.exitChars=["q", "d", "r", "a"];

await pager.init(arr, "*saved emails*", {opts:{}, lineSelect: true});

term.setBgRows();
term.render();
let ch = pager.exitChar;
if (ch==="q") return;
if (ch==="r"||ch==="a"){
let which = saved_arr[pager.y+pager.scroll_num];
/*Create an email in Drafts...
*/
log(which);
if (ch==="a"){
cwarn("ADD CONTACT");
return;
}
cwarn("REPLY");
return;
}
let out_arr = [];
for (let i=0; i < sels.length; i++){
	if (sels[i]) out_arr.push(new_arr[i]);
}
if (!out_arr.length) return;
if (ch==="d"){
log("Delete from server then from emuser.saved");
}
term.render();
//cwarn("GOT UIDS");
//log(out_arr);
//log(sels);
};//»
const send_email=async(draft)=>{//«

let url = `${base_smtp_url}&to=${encodeURIComponent(draft.toContact.address)}&subject=${encodeURIComponent(draft.subject)}`;
let rv = await fetch(url, {
    method:"POST",
	body: draft.bodyText
});
if (rv.ok) return true;
let txt = await rv.text();
if (!txt) txt = "there was an unspecified SMTP error";
return txt;

};//»
const edit_draft = async(draft_node, opts={})=>{//«

if (!await util.loadMod(DEF_EDITOR_MOD_NAME)) {
	com.err("could not load the editor module");
	return;
}

let draft_val = draft_node.data.value;
let use_text = draft_val.subject + "\n\n" + draft_val.bodyText;

let editor = new LOTW.mods[DEF_EDITOR_MOD_NAME](term);
const validate_draft = val => {//«
	draft_val.subject="";
	draft_val.bodyText="";
	let arr = val.split("\n");
	let sub = arr.shift();
	if (!(sub && sub.match(/\w+/))) return {mess: "Subject not found!", type: STAT_WARN};
	draft_val.subject = sub;
	if (arr.length){
		let blank = arr.shift();
		if (!blank.match(/^\s*$/)){
			return {mess: "Non-blank line found under the subject", type: STAT_ERR};
		}
		if (arr.length) {
			let body = arr.join("\n");
			draft_val.bodyText = body;
		}
	}
	return true;
};//»
if (!opts.noSend) {
editor.sendFunc = async(val) => {//«

let rv = validate_draft(val);
if (rv !== true) return rv;
if (!(draft_val.subject.match(/\w/)&&draft_val.bodyText.match(/\w/))){
//	return {mess: "Invalid email", type: STAT_ERR}
	return com.err("Invalid email");
}
let sent_dir = await emuser.getSentDir();
if (isStr(sent_dir)) {
	return com.err(sent_dir);
}
//return {mess: sent_dir, type: STAT_ERR};

/*«

Pop up a window with...
To: Name <address>
Subject: <subject here...>

Replace all 
"<" with "&lt;"
">" with "&gt;"
"&" with "&amp;"

[Then wrap all of the bodyText lines in <p>'s, and put them here.]

We can do some kind of an "EmailConf" application that renders all of this,
and has "Send" and "Cancel" buttons. So we will need to await either one
of the buttons here...

»*/

let body_arr = util.linesToParas(draft_val.bodyText.split("\n"));
let div = mkdv();
let todiv = mkdv();
todiv.innerText = `To: ${draft_val.toContact.name} <${draft_val.toContact.address}>`
let subdiv = mkdv();
subdiv.innerText = `Sub: ${draft_val.subject}`;
let bodylabdiv = mkdv();
bodylabdiv.innerHTML="<hr>Body:<br>";
let bodydiv = mkdv();
for (let para of body_arr){
	if (!para) para = "\xa0";
	let p = make('p');
	p.innerText = para;
	bodydiv.appendChild(p);
}
div.appendChild(todiv);
div.appendChild(subdiv);
div.appendChild(bodylabdiv);
div.appendChild(bodydiv);

if (!await LOTW.api.widgets.popyesno(div,{title: "Send this email?", veryBig: true})){
//	return {mess: "Cancelled", type: STAT_WARN};
return com.wrn("Cancelled");
}
//editor.stat_message = "Trying to send...";
//editor.stat_message_type = STAT_WARN;
com.wrn("Trying to send...");
//term.render();
//Here we are mimicking the 'send' function
rv = await send_email(draft_val);
if (rv === true){}
else if (isStr(rv)) return com.err(rv);
else{
cwarn("Here is the non-true/non-string value");
log(rv);
return com.err("What value returned from send_email (not true or Error string)? (see console)");
}

//Upon successful completion, we need to remove draft_node from MUD/Drafts and
//put it into MUD/Sent...

let sent_kids = sent_dir.kids;
let sent_num = 1;
while (sent_kids[`${sent_num}`]) {
	sent_num++;
}
if (!await fsapi.comMv([draft_node.fullpath, `${sent_dir.fullpath}/${sent_num}`])){
com.err("Sent OK. Failed moving email from 'Drafts' to 'Sent'");
return;
}
com.suc("Sent OK");

};//»
}
editor.saveFunc = async (val) => {//«
	let rv = validate_draft(val);
	if (rv !== true) return rv;
	if (!await draft_node.setDataValue(draft_val)){
		return {mess:"Could not save the draft", type: STAT_ERR};
	}
	return {mess: "Saved Okay", type: STAT_OK};
};//»
await editor.init(use_text, draft_node.fullpath, {
	opts:{},
	node: draft_node,
});

};//»
const show_contacts_list = async()=>{//«

let contacts_dir = await emuser.getContactsDir();
if (isStr(contacts_dir)) return com.err(contacts_dir);
let contacts_kids = contacts_dir.kids;
let arr=[];
let objs=[];
//Testing lots of made up name/email pairs 
//for (let i=0; i < 500; i++){
//arr.push(`${i} ${i}) ${i}@${i}.${i}`);
//objs.push(`${i}@${i}.${i}`);
//}
for (let key in contacts_kids){
	if (!key.match(/^\d+$/)) continue;

	let node = contacts_kids[key];
	if (node.isData!==true){
		com.wrn(`Skipping non-data node: '${key}'`);
		continue;
	}
	let data = node.data;
	if (data.type!=="contact"){
		com.wrn(`Skipping data node type != "contact": '${key}'`);
		continue;
	}
	if (!isObj(data.value) && isStr(data.value.address) && isStr(data.value.name)){
		com.wrn(`Skipping invalid contact node: '${key}'`);
		continue;
	}
	let{name, address} = data.value;
	let str = `${name}) ${address}`;
	arr.push(str.slice(0, term.w));
	objs.push(data.value);
}
if (!arr.length){
com.wrn("No contacts to show!");
return;
}
if (!await util.loadMod(DEF_PAGER_MOD_NAME)) {
	com.err("could not load the pager module");
	return;
}

let pager = new LOTW.mods[DEF_PAGER_MOD_NAME](term);
pager.stat_message = `*Contacts menu*  [q]uit or [Enter] to select`;
pager.exitChars=["q"];

let rv = await pager.init(arr, "*contacts*", {opts:{}, lineSelect: true});
if (pager.exitChar) return;


let use_contact = objs[pager.y + pager.scroll_num];

let drafts_dir = await emuser.getDraftsDir();
if (isStr(drafts_dir)) return com.err(drafts_dir);
let drafts_kids = drafts_dir.kids;

let draft_num = 1;
while(drafts_kids[`${draft_num}`]){
	draft_num++;
}

let draft_path = `${drafts_dir.fullpath}/${draft_num}`
let draft_val = {
	subject:"",
	toContact: use_contact,
	bodyText:""
};
let draft_obj = {type: "email", value: draft_val};
let draft_node = await fsapi.writeDataFile(draft_path, draft_obj, {newOnly: true});
if (!draft_node){
	com.err(`Could not create the new draft (${draft_path})`);
	return;
}
await edit_draft(draft_node);


};//»
const show_drafts_list = async()=>{//«

let drafts_dir = await emuser.getDraftsDir();
if (isStr(drafts_dir)) return com.err(drafts_dir);
let drafts_kids = drafts_dir.kids;
let arr=[];
let objs=[];
for (let key in drafts_kids){
	if (!key.match(/^\d+$/)) continue;

	let node = drafts_kids[key];
	if (node.isData!==true){
		com.wrn(`Skipping non-data node: '${key}'`);
		continue;
	}
	let data = node.data;
	if (data.type!=="email"){
		com.wrn(`Skipping data node type != "email": '${key}'`);
		continue;
	}
	let val = data.value;
	if (!isObj(data.value) && isStr(val.subject) && isStr(val.bodyText) && isObj(val.toContact)){
		com.wrn(`Skipping invalid email node: '${key}'`);
		continue;
	}
	let ln1 = val.bodyText.split("\n")[0];
	let str = `${val.toContact.name}) ${val.subject}: ${ln1}`;
	arr.push(str.slice(0, term.w));
	objs.push(node);
}

if (!arr.length){
	com.wrn("No drafts to show!");
	return;
}
if (!await util.loadMod(DEF_PAGER_MOD_NAME)) {
	com.err("could not load the pager module");
	return;
}

let pager = new LOTW.mods[DEF_PAGER_MOD_NAME](term);
pager.stat_message = `*Drafts menu*  [q]uit [d]el or [Enter] to edit`;
pager.exitChars=["q", "d"];

await pager.init(arr, "*drafts*", {opts:{}, lineSelect: true});
if (pager.exitChar){/*«*/
	if (pager.exitChar==="q") return;
	let draft_node = objs[pager.y + pager.scroll_num];
	let draft = draft_node.data.value;

	let rv = await term.getch(`Really delete: ${draft.toContact.name}: ${draft.subject} (y/N)? `);
	if (!(rv==="y"||rv==="Y")){
		com.wrn("Not deleting!");
		return;
	}
	rv = await fsapi.doFsRm([draft_node.fullpath], mess=>{
cerr(mess);
	}, {root: true});
	if (!rv) com.err("there was an error deleting the draft (see console)");
	return;
}/*»*/
await edit_draft(objs[pager.y + pager.scroll_num]);

};//»
const show_sent_list = async()=>{//«

let sent_dir = await emuser.getSentDir();
if (isStr(sent_dir)) return com.err(sent_dir);
let sent_kids = sent_dir.kids;
let arr=[];
let objs=[];
for (let key in sent_kids){
	if (!key.match(/^\d+$/)) continue;

	let node = sent_kids[key];
	if (node.isData!==true){
		com.wrn(`Skipping non-data node: '${key}'`);
		continue;
	}
	let data = node.data;
	if (data.type!=="email"){
		com.wrn(`Skipping data node type != "email": '${key}'`);
		continue;
	}
	let val = data.value;
	if (!isObj(data.value) && isStr(val.subject) && isStr(val.bodyText) && isObj(val.toContact)){
		com.wrn(`Skipping invalid email node: '${key}'`);
		continue;
	}
	let ln1 = val.bodyText.split("\n")[0];
	let str = `${val.toContact.name}) ${val.subject}: ${ln1}`;
	arr.push(str.slice(0, term.w));
	objs.push(node);
}

if (!arr.length){
	com.wrn("No sent emails to show!");
	return;
}
if (!await util.loadMod(DEF_PAGER_MOD_NAME)) {
	com.err("could not load the pager module");
	return;
}

let pager = new LOTW.mods[DEF_PAGER_MOD_NAME](term);
pager.stat_message = `*Sent menu*  [q]uit or [Enter] to select`;
pager.exitChars=["q"];

let rv = await pager.init(arr, "*sent*", {opts:{}, lineSelect: true});
if (pager.exitChar) return;
await edit_draft(objs[pager.y + pager.scroll_num], {noSend: true});


};//»

/*«
	log[i]n
	log[o]ut
	[u]pdate
	[n]ew
	[s]aved
	[c]ontacts
	[d]rafts
	sen[t]
	[q]uit
	[h]elp
»*/

//const{term}=com;
const addr = emuser.emailAddr;

const base_imap_url = `/_imap?user=${addr}`;
const base_smtp_url = `/_smtp?user=${addr}`;

const OK_CHARS=["i","o","q","u","n","s","c","d","t","h"];

let num_invalid = 0;
help();
while(true){
//log("UM HELLO MAIL...");
	let rv = await term.getch("mail> ");
	term.lineBreak();
	if (!OK_CHARS.includes(rv)){
		num_invalid++;
		com.wrn(`invalid command (got '${rv?rv:""}')`);
		if (num_invalid===3) {
			com.err("Aborting the loop (too many invalid commands)");
			return exit();
		}
		continue;
	}
	if (rv==="q") return exit(true);
	if (rv==="h") help();
	else if (rv==="u"){
		await do_update();
	}
	else if (rv==="i"){
		await login({isSuc: true});
	}
	else if (rv==="o"){
		await logout({isSuc: true});
	}
	else if (rv==="n"){
		await show_new_list();
	}
	else if (rv==="s"){
		await show_saved_list();
	}
	else if (rv==="c"){
		await show_contacts_list();
	}
	else if (rv==="d"){
		await show_drafts_list();
	}
	else if (rv==="t"){
		await show_sent_list();
	}
	else {
		com.wrn(`Got command: ${rv}`);
	}
	num_invalid = 0;

}

});
};//»

class EmailUser {//«

#db;
#mailDataPath;
#userDirPath;
#lastUIDPath;

constructor(addr){//«

	this.#mailDataPath = `${globals.APPDATA_PATH}/mail`;
	this.#userDirPath = `${this.#mailDataPath}/${addr}`;
	this.#lastUIDPath = `${this.#userDirPath}/last_uid`;
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

getById(store_name, id){//«
	return new Promise((Y,N)=>{
		let req = this.getStore(store_name).get(id);
		req.onerror=(e)=>{
			cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(e.target.result);
		};
	});
}//»
putItem(store_name, item){//«
	return new Promise((Y,N)=>{
		let req = this.getStore(store_name, true).put(item);
		req.onerror=(e)=>{
cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(true);
		};
	});
}//»
addItem(store_name, item){//«
	return new Promise((Y,N)=>{
		let req = this.getStore(store_name, true).add(item);
		req.onerror=(e)=>{
cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(true);
		};
	});
}//»
delItemByKey(store_name, key){//«
	return new Promise((Y,N)=>{
		let req = this.getStore(store_name, true).delete(key);
		req.onerror=(e)=>{
cerr(e);
			Y();
		};
		req.onsuccess = e => {
			Y(true);
		};
	});
}//»
getAll(store_name){//«
	return new Promise((Y,N)=>{
		let store = this.getStore(store_name);
		let req = store.getAll();
		req.onerror=e=>{
			N(e);
		};
		req.onsuccess=e=>{
			Y(e.target.result);
		};
	});
}//»

getStore(store_name, if_write){//«
	return this.#db.transaction([store_name],if_write?"readwrite":"readonly").objectStore(store_name);
}//»

async mkUserDir(){//«

/*«Notes

In this new userDir, we want:
1) last_uid ("numerical" data node)

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
//The imap server module automatically adds '1' to this value, which makes it
//a valid uid number ('0' would be invalid as a uid).
	if (!await fsapi.writeDataFile(`${path}/last_uid`,{type: "integer", value: 0})){
		return `could not create 'last_uid' in '${path}'`;
	}
	if (!await fsapi.mkDir(path, "Drafts")){
		return `could not create 'Drafts/' in '${path}'`;
	}
	if (!await fsapi.mkDir(path, "Sent")){
		return `could not create 'Sent/' in '${path}'`;
	}
	if (!await fsapi.mkDir(path, "Contacts")){
		return `could not create 'Contacts/' in '${path}'`;
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
	return await (`${this.#mailDataPath}/${this.emailAddr}`).toNode();
}//»
async getSomeDir(which){//«
	let path = `${this.#mailDataPath}/${this.emailAddr}/${which}`;
	let dir = await path.toNode({doPopDir: true});
	if (!dir){
		return `no ${which} directory found!`;
	}
	if (dir.isDir!==true) {
		return `'${which}' is not a directory!`;
	}
	return dir;
}//»
getContactsDir(){return this.getSomeDir("Contacts");}
getDraftsDir(){return this.getSomeDir("Drafts");}
getSentDir(){return this.getSomeDir("Sent");}

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
	req.onupgradeneeded=(e)=>{//«
/*«
		if (opts.del){
cwarn("DELETING", new_table_name, saved_table_name);
			e.target.result.deleteObjectStore(new_table_name);
			e.target.result.deleteObjectStore(saved_table_name);
			return;
		}
»*/
log("Upgrading...");
//We can use {keyPath: "uid"} (rather than autoIncrement) in order to key by the email uids.

		let newstore = e.target.result.createObjectStore(new_table_name, {keyPath: "uid"});
//		let newstore = e.target.result.createObjectStore(new_table_name, {autoIncrement: true});
		newstore.createIndex("fromAddr", "fromAddr", {unique: false});

		let savedstore = e.target.result.createObjectStore(saved_table_name, {keyPath: "uid"});
//		let savedstore = e.target.result.createObjectStore(saved_table_name, {autoIncrement: true});
		savedstore.createIndex("fromAddr", "fromAddr", {unique: false});

	}//»

});//»

}//»
async initMailDir(){//«
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

async lastUID(save_uid){//«
	let node = await this.#lastUIDPath.toNode();
	if (!node){
cerr(`FATAL: lastUIDPath ${this.#lastUIDPath} node not found!`);
		return;
	}
	if (node.isData!==true){
log(node);
cerr("FATAL: the lastUID node is NOT a data node!!!");
		return;
	}
	let data = node.data;
	if (data.type!=="integer"){
cerr("FATAL: the lastUID data node is NOT of type = 'integer'");
		return;
	}
	let val = data.value;
	if (!isNum(val)){
cerr("FATAL: the lastUID data node value is NOT a number!");
		return;
	}
	if (!save_uid) return val;
	if (!await node.setDataValue(save_uid)) return;
	return true;
}//»
async saveNew(emails){//«
//Let's do a Promise.all() with database add's (will reject of there are already records with the same uid's)

const add_prom=(store, item)=>{//«
	return new Promise((Y,N)=>{
		let req = store.add(item);
		req.onerror=(e)=>{
//cerr(e);
cerr("Here is the invalid item");
log(item);
			N(e);
		};
		req.onsuccess = e => {
			Y(true);
		};
	});
};//»
let store = this.getStore("new", true);

let proms = [];
let highest_uid = 0;
for (let email of emails){//«
	let {uid, envelope} = email;
	let {date, subject, from, sender} = envelope;
	let timestamp = Math.floor((new Date(date)).getTime()/1000);
	let from1 = from[0];
	let from1nm = from1.name;
	let from1addr = from1.address;
	let sender1 = sender[0];
	let sender1nm = sender1.name;
	let sender1addr = sender1.address;
	uid = parseInt(uid);
	if (uid > highest_uid) highest_uid = uid;
	proms.push(add_prom(store, {uid, fromAddr: from1addr, fromName: from1nm, timestamp, subject}));
}//»

await Promise.all(proms);
if (!await this.lastUID(highest_uid)) this.fatal(`save operation failed: this.lastUID(${highest_uid})`);
return `saved: ${emails.length} new emails`;

}//»

/*«

//We aren't doing these things in the database, but as data files in MUD/Drafts and MUD/Sent
addMessage(store_name, mess){//«
	return new Promise((Y,N)=>{
		let req = this.getStore(store_name, true).add(mess);
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

const com_mail = class extends Com{//«

//static opts={l:{init: 3, del: 3, use: 3, drop: 1}};
static opts={s:{r: 1, u: 3}, l: {user: 3}};
init(){if (!isNodeJS) this.no(E_NEED_NODEJS);}
async run(){//«

const{args, opts, term, env}=this;
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

const addr = opts.user || opts.u || env.EMAIL_USER;
if (!addr) return this.no(`no --user, -u option or 'EMAIL_USER' in the environment!`);

const emuser = new EmailUser(addr);

rv = await emuser.initMailDir();
if (!this.checkStrOrTrue(rv, "emuser.initMailDir")) return;

const cmd = args.shift();

if (!cmd){//«
	if (!await emuser.getUserDir()) return this.no(`the user: '${addr}' has not been initialized`);
	rv = await emuser.initDB();
	if (!rv) return this.no(`could not initialize the database for: ${addr}`);

//SBSNOWP
//cwarn("Mail REPL here...");
	this.inf(`Starting mail REPL for: '${addr}'`);
	rv = await mail_loop(this, emuser);
log("MAIL LOOP RET", rv);
	emuser.close();
	this.ok();
	return;
}//»

if (cmd === "init"){//«

	if (await emuser.getUserDir()) return this.no(`the user: '${addr}' has already been initialized`);
	rv = await term.getch(`Create user: '${addr}'? [y/N]`);
	if (!(rv==="y"||rv==="Y")) return this.no("not creating");
	rv = await emuser.mkUserDir();
	if (!this.checkStrOrTrue(rv, "mkUserDir")) return;
	rv = await emuser.initDB();
	if (!rv) return this.no(`could not initialize the object stores for: ${addr}`);
	this.ok();
	return;

}//»
//The remaining commands assume that 'addr' has already been initialized
if (!await emuser.getUserDir(addr)) return this.no(`the user directory for '${addr}' does not exist!`);
if (cmd === "del"){//«

	rv = await term.getch(`Delete user: '${addr}'? [y/N]`);
	if (!(rv==="y"||rv==="Y")) return this.no("not deleting");

	if (!await emuser.rmUserDir()) return this.no(`error removing user directory: '${addr}'`);
	if (!await emuser.dropDatabase()) return this.no(`error dropping the database`);
	this.ok();

}//»
else if (cmd==="check") this.ok(`OK: ${addr}`);
else if (cmd){
	this.no(`unknown mail command: '${cmd}'`);
}


}//»
cancel(){
cwarn("HI CANCEL");
}
}//»

const com_imapcon = class extends Com{//«
	init(){if (!isNodeJS) this.no(E_NEED_NODEJS);}
	async run(){
		do_imap_op(this, "connect");
	}
};//»
const com_imapdis = class extends Com{//«
	init(){if (!isNodeJS) this.no(E_NEED_NODEJS);}
	async run(){
		do_imap_op(this, "logout");
	}
};//»
const com_imapgetenvs = class extends Com{//«
	init(){if (!isNodeJS) this.no(E_NEED_NODEJS);}
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
		let rv = await do_imap_op(this, "getenvs", {addArgs: `since=${unix_ms}`, retOnly: true});
		if (rv === false) return;
if (!isStr(rv)){
cwarn("Here is the non-string value");
log(rv);
this.no("unknown value returned from imap.getenvs (see console)");
return;
}
//cwarn("GOT JSON ENVS");
//log(rv);
this.out(rv);
this.ok();

	}
};//»

const com_curaddr = class extends Com{//«
	init(){if (!isNodeJS) this.no(E_NEED_NODEJS);}
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

const com_mkcontact = class extends Com{//«

static opts = {l: {name: 3, addr: 3, user: 3}, s:{u: 3}};

init(){if (!isNodeJS) this.no(E_NEED_NODEJS);}
async run(){//«

	const{opts,env}=this;
	const addr = opts.user || opts.u || env.EMAIL_USER;
	if (!addr) return this.no(`no --user, -u option or 'EMAIL_USER' in the environment!`);
	const emuser = new EmailUser(addr);
	if (!await emuser.getUserDir()) return this.no(`the user: '${addr}' has not been initialized`);

	const{name, addr: to_addr} = opts;
	if (!(name&&to_addr)) return this.no("Need 'name' and 'addr' options!");

	let dir = await emuser.getContactsDir();
	if (isStr(dir)) return this.no(dir);
	let num = 1;
	let kids = dir.kids;
	while(kids[`${num}`]){
		num++;
	}

	let save_path = `${dir.fullpath}/${num}`;
//	cwarn("SAVE AS", save_path);
	const obj = {type: "contact", value: {name, address: to_addr}};
	if (!await fsapi.writeDataFile(save_path, obj)){
		this.no(`Could not save to '${save_path}'`);
		return;
	}
	this.ok();
}//»

};//»

export const coms = {//«

	mkcontact: com_mkcontact,
	mail: com_mail,
	curaddr: com_curaddr,
	dblist: com_dblist,
	dbdrop: com_dbdrop,
	imapcon: com_imapcon,
	imapdis: com_imapdis,
	imapgetenvs: com_imapgetenvs

};//»

