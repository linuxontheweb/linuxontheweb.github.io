/*1/21/25:«

Now I am legitimately back here after 3+ months of turning LOTW into an *actual*
browser-based implementation of GNU/Linux.

What I want is to enable a CLI workflow with 3 distinct parts

1. Mandatory "connect" to IMAP service
2. Optional series of "requests" to the service
3. Mandatory "disconnect" from IMAP service

There might be an interval timeout (e.g. 5-15 secs) here after connecting that 
disconnects and sets the client to null.

We'll want a "busy" flag that is turned on when a connect/disconnect/request 
operation begins, and then turned off when it ends.

All we care about in terms of "sessions" is that the "user" arg on every request
is identical with process.env.EMAIL_USER in here. We are taking care of that in
the main server module (which calls the functions that are exported from here).

»*/

//«Notes
/*10/13/24:ETIMEDOUT«
Error: read ETIMEDOUT
    at TLSWrap.onStreamRead (node:internal/stream_base_commons:218:20) {
  errno: -110,
  code: 'ETIMEDOUT',
  syscall: 'read'
}
/usr/local/home/lotw/node/svcs/imap.js:321
                throw new Error(`Unhandled error: ${err.code}`);
                ^

Error: Unhandled error: ETIMEDOUT
    at process.<anonymous> (/usr/local/home/lotw/node/svcs/imap.js:321:9)
    at process.emit (node:events:520:28)
    at process._fatalException (node:internal/process/execution:191:25)

»*/
/*«Some time in October 2024:

Since we can't really figure out how to limit the fetch to a single body part, we are
just setting the maxLength field on the source object (member of the 2nd arg to the
fetch methods, a FetchQueryObject). Otherwise, we would need to get the bodyParts array
method working. This is currently at 5kb, but should probably go up to ~32 kb. This way,
we are pretty guaranteed not to have to worry about downloading a bunch of attachments
that might be in the full message, maybe resulting in many, many megabytes.

»*/
/*Docs«

//Flags«
RFC 3501                         IMAPv4                       March 2003

2.3.2.  Flags Message Attribute

   A list of zero or more named tokens associated with the message.  A
   flag is set by its addition to this list, and is cleared by its
   removal.  There are two types of flags in IMAP4rev1.  A flag of
   either type can be permanent or session-only.

   A system flag is a flag name that is pre-defined in this
   specification.  All system flags begin with "\".  Certain system
   flags (\Deleted and \Seen) have special semantics described
   elsewhere.  The currently-defined system flags are:

        \Seen
           Message has been read

        \Answered
           Message has been answered

        \Flagged
           Message is "flagged" for urgent/special attention

        \Deleted
           Message is "deleted" for removal by later EXPUNGE

        \Draft
           Message has not completed composition (marked as a draft).

        \Recent
           Message is "recently" arrived in this mailbox.  This session
           is the first session to have been notified about this
           message; if the session is read-write, subsequent sessions
           will not see \Recent set for this message.  This flag can not
           be altered by the client.

           If it is not possible to determine whether or not this
           session is the first session to be notified about a message,
           then that message SHOULD be considered recent.

           If multiple connections have the same mailbox selected
           simultaneously, it is undefined which of these connections
           will see newly-arrived messages with \Recent set and which
           will see it without \Recent set.

   A keyword is defined by the server implementation.  Keywords do not
   begin with "\".  Servers MAY permit the client to define new keywords
   in the mailbox (see the description of the PERMANENTFLAGS response
   code for more information).

   A flag can be permanent or session-only on a per-flag basis.
   Permanent flags are those which the client can add or remove from the
   message flags permanently; that is, concurrent and subsequent
   sessions will see any change in permanent flags.  Changes to session
   flags are valid only in that session.
//»

//Code«

const ImapFlow = require('imapflow');
const client = new ImapFlow({
  host: 'imap.server.com',
  port: 993,
  secure: true,
  auth: {
    user: 'your_email@example.com',
    pass: 'yourpassword'
  }
});
async function fetchEmails() {
  await client.connect();
  const lock = await client.getMailboxLock('INBOX');
  try {
    for await (const message of client.fetch('1:*', {
      envelope: true,
      bodyParts: true,
      bodyStructure: true
    })) {
      const {content} = await client.download(message.uid, ['TEXT']);
      // Process content here
      console.log('Email Content:', content.toString());
    }
  } finally {
    lock.release();
    await client.logout();
  }
}
fetchEmails().catch(console.error);

//»

//Client/Server Session«
C: <open connection>
S:   * OK IMAP4rev1 Service Ready
C:   a001 login mrc secret
S:   a001 OK LOGIN completed
C:   a002 select inbox
S:   * 18 EXISTS
S:   * FLAGS (\Answered \Flagged \Deleted \Seen \Draft)
S:   * 2 RECENT
S:   * OK [UNSEEN 17] Message 17 is the first unseen message
S:   * OK [UIDVALIDITY 3857529045] UIDs valid
S:   a002 OK [READ-WRITE] SELECT completed
C:   a003 fetch 12 full
S:   * 12 FETCH (FLAGS (\Seen) INTERNALDATE "17-Jul-1996 02:44:25 -0700"
      RFC822.SIZE 4286 ENVELOPE ("Wed, 17 Jul 1996 02:23:25 -0700 (PDT)"
      "IMAP4rev1 WG mtg summary and minutes"
      (("Terry Gray" NIL "gray" "cac.washington.edu"))
      (("Terry Gray" NIL "gray" "cac.washington.edu"))
      (("Terry Gray" NIL "gray" "cac.washington.edu"))
      ((NIL NIL "imap" "cac.washington.edu"))
      ((NIL NIL "minutes" "CNRI.Reston.VA.US")
      ("John Klensin" NIL "KLENSIN" "MIT.EDU")) NIL NIL
      "<B27397-0100000@cac.washington.edu>")
      BODY ("TEXT" "PLAIN" ("CHARSET" "US-ASCII") NIL NIL "7BIT" 3028
      92))
S:   a003 OK FETCH completed
C:   a004 fetch 12 body[header]
S:   * 12 FETCH (BODY[HEADER] {342}
S:   Date: Wed, 17 Jul 1996 02:23:25 -0700 (PDT)
S:   From: Terry Gray <gray@cac.washington.edu>
S:   Subject: IMAP4rev1 WG mtg summary and minutes
S:   To: imap@cac.washington.edu
S:   Cc: minutes@CNRI.Reston.VA.US, John Klensin <KLENSIN@MIT.EDU>
S:   Message-Id: <B27397-0100000@cac.washington.edu>
S:   MIME-Version: 1.0
S:   Content-Type: TEXT/PLAIN; CHARSET=US-ASCII
S:
S:   )
S:   a004 OK FETCH completed
C    a005 store 12 +flags \deleted
S:   * 12 FETCH (FLAGS (\Seen \Deleted))
S:   a005 OK +FLAGS completed
C:   a006 logout
S:   * BYE IMAP4rev1 server terminating connection
S:   a006 OK LOGOUT completed
//»

»*/
//»

//Imports«

const { ImapFlow } = require('imapflow');
const simpleParser = require('mailparser').simpleParser;
const log=(...args)=>{console.log(...args)};

//»

//Var«

const MAX_KILOBYTES = 5;
const MAX_SIZE = MAX_KILOBYTES*1024;
const TEXT_MIME = "text/plain";

const USER = process.env.EMAIL_USER;

//let lock;
let is_busy = false;

let is_connected = false;
let cur_mailbox;

let client;
const client_opts = {//«
	host: 'imap.mail.yahoo.com',
	port: 993,
	secure: true,
	logger: false,
	auth: {
        user: USER,
        pass: process.env.EMAIL_PASSWORD
	}
};//»

//»
//«Funcs
const OK=rv=>{//«
	if (!rv) rv = true;
	is_busy = false;
	return {success: rv};
};//»
const ERR=mess=>{//«

	if (!mess) mess = "Unknown error";
	else if (mess.message){
log(mess);
		mess = mess.message;
	}
	is_busy = false;
	return {error: mess};

};//»

const close_cb = () => {//«
log("connection closed");
	unset_vars();
};//»
const do_openbox = async(which)=>{//«
	try{
		cur_mailbox = await client.mailboxOpen(which);
log(`${cur_mailbox.path} opened`);
		return OK(`${cur_mailbox.path} opened`);
	}
	catch(e){
		return ERR(e);
	}
};//»
const unset_vars = () => {//«
	client = null;
	cur_mailbox = null;
	is_connected = false;
	is_busy = false;
};//»
//»

const connect = async() => {//«
//	if (is_connected) return ERR("already connected");
	is_busy = true;
	if (is_connected) return OK("Already connected");
	try{
log("connecting...");
		client = new ImapFlow(client_opts);
		await client.connect();
		is_connected = true;
		client.on('close', close_cb);
//		return OK();
		return do_openbox("INBOX");
	}
	catch(e){
log(e);
		return ERR(e);
	}
};//»
const connected = () => {//«
	is_busy = true;
	return OK(is_connected + "");
};//»
const logout = async() => {//«
	is_busy = true;
	if (!is_connected) return ERR("not connected");
	try{
		await client.logout();
		unset_vars();
		return OK();
	}catch(e){
		return ERR(e);
	}
};//»
const openbox = async (args) => {//«
	is_busy = true;

	if (!is_connected) return ERR("not connected");
	let {box} = args;
	if (!box) return ERR("Mailbox not given");
	if (cur_mailbox && cur_mailbox.path == box) return OK()
	return do_openbox(box);

};//»
const whichbox = () => {//«
	is_busy = true;
	if (!is_connected) return ERR("not connected");
	if (!cur_mailbox) return ERR("no mailbox");
	return OK(cur_mailbox.path);
};//»
const boxstatus = async() => {//«
	is_busy = true;
	if (!is_connected) return ERR("not connected");
	if (!cur_mailbox) return ERR("no mailbox");
try{
	let stat = await client["status"](cur_mailbox.path, {messages: true, unseen: true});
	return OK(stat);
}
catch(e){
	return ERR(e);
}
};//»
const get_uid = async (args) => {//«
is_busy = true;

if (!is_connected) return ERR("not connected");
if (!cur_mailbox) return ERR("no current mailbox");
let {uid} = args;
if (!(uid && (uid.match(/^\d+$/) || uid === "*"))) return ERR("Invalid uid/sequence arg");

try {

let mess = await client.fetchOne(uid, {bodyParts: ["1"]}, {uid: true});
if (!mess.bodyParts){
log(mess);
	return ERR("No bodyParts returned!");
}
//log(mess.bodyParts);
let text = mess.bodyParts.get('1');
if (!text){
log(mess.bodyParts);
	return ERR("No bodyParts.1!");
}
	return OK(text.toString());
}
catch(e){
	return ERR(e);
}

};//»
const get_envelopes_since = async (args) => {//«
//const get_envelopes_since = async (timestamp) => {
is_busy = true;
let {uid} = args;
if (!uid) uid = "1";
if (uid==="0" || !uid.match(/^\d+$/)) return err(`invalid 'uid' argument: have '${uid}'`);

/*«

Returns: Array of FetchMessageObject's:
{
	uid: Number,
	envelope: MessageEnvelopeObject
}

MessageEnvelopeObject:
{
	from: [MessageAddressObject]
	to: [MessageAddressObject]
	replyTo: [MessageAddressObject]
	inReplyTo: String (Message ID from In-Reply-To header)
	date: Date,
	subject: String,
}


//(async) fetch(range, query, optionsopt)

range   SequenceString |    Range or search parameters of messages to fetch
        Array.<Number> |
        SearchObject

SearchObject{
	since:       Date | string   Matches messages received after date
}


query   FetchQueryObject    Fetch query (what parts/fields to include in the message response)

FetchQueryObject{
	envelope:    Boolean     if true then include parsed ENVELOPE object in the response
}


optionsopt{
	uid:	Boolean		if true then uses UID number instead of sequence number for seq
}

»*/

if (!is_connected) return ERR("not connected");
if (!cur_mailbox) return ERR("no current mailbox");

//let since_date = new Date(parseInt(since));
//log("since_date", since_date);
try {
/*«
	let rv = await client.fetch(
		{since: since_date},
		{envelope: true},
		{uid: true}
	);
»*/
//	let num = 0;
	let arr = [];
/*
This makes infinitely more sense as a sequence string of uid's:
<last_uid+1:*>
*/
//	for await (let msg of client.fetch({since: since_date}, {envelope: true}, {uid: true})){
	for await (let msg of client.fetch(`${uid}:*`, {envelope: true}, {uid: true})){
//		num++;
		arr.push(msg);
//log(msg);
	}
	return OK(JSON.stringify(arr));
}
catch(e){
log("ERR");
log(e);
	return ERR(e);
}

};//»

process.on('uncaughtException', (err) => {//«
	if (err.code === "NoConnection" && err.command === 'IDLE'){
		unset_vars();
log("caught NoConnection error (from IDLE)");
	}
	else{
log(err);
		throw new Error(`Unhandled error: ${err.code}`);
	}

});//»

module.exports = {//«
//	getMail
//	fetchOne

isBusy:()=>{return is_busy},
connect,
connected,
logout,
openbox,
whichbox,
"status": boxstatus,
getuid: get_uid,
getenvs: get_envelopes_since
//verify,

};//»

//«Old
/*
const verify = async () => {//«
	if (is_connected) return USER;
	try{
log("verifying...");
		client = new ImapFlow(client_opts);
		await client.connect();
		is_connected = true;
		await client.logout();
		client = null;
		is_connected = false;
log(`OK: ${USER}`);
		return OK(USER);
	}
	catch(e){
log(e);
		return ERR(e);
	}
};//»
*/
/*
const fetchOne = (seqNum) => {//«

return new Promise(async(Y,N)=>{

//if (!seqNum) seqNum = "*";
if (!seqNum) {
Y({error: "need a seqNum argument!"});
return;
}

let lock;
const end=async()=>{//«
log("Lock");
log(lock);
	if (lock && lock.release) lock.release();
	try{
		await client.logout();
	}catch(e){
log("Caught client.logout() error!");
log(e);
	}
};//»
try {

// Wait until client connects and authorizes
await client.connect();
// Select and lock a mailbox. Throws if mailbox does not exist
lock = await client.getMailboxLock('INBOX');

//let mess = await client.fetchOne(client.mailbox.exists, { 
log(`fetchOne: ${seqNum}`);
let mess = await client.fetchOne(seqNum, { 
	uid: true,
//	bodyStructure: true,
	size: true,
	envelope: true,
//	flags: true,
//	internalDate: true,
//	source: true 
});

let uid = mess.uid+"";
let env = mess.envelope;
let date = env.date+"";
let sub = env.subject;
let from = env.from[0];

let messId = env.messageId;
//This is the 'Message-ID' header that can be used in the fetch SearchObject:
//{header: messId}. Even though there shouldn't be too many problems reusing the
//uid between sessions, that doesn't necessarily uniquely identify messages between
//sessions....

log(mess);

//	«
//	if (!(mess && mess.bodyStructure)){
//		Y({error: `Could not fetch seqNum(${seqNum})`});
//		end();
//		return;
//	}
//
//	let struct = mess.bodyStructure;
//	let text_part;
//	let text_part_num;
//	let source;
//
//	if (struct.type == TEXT_MIME) {
//	log("no multipart: top-level is text");
//		text_part = struct;
//		source = true;
//	}
//	else if (struct.childNodes){
//	log("Find childNodes...");
//		for (let child of struct.childNodes){
//	//log(child);
//			if (child.type == TEXT_MIME){
//				text_part = child;
//				text_part_num = child.part+"";
//	//log(`part ${child.part} is text (${child.size} chars)`);
//				source = {bodyParts: [`BODY[${child.part}]`]};
//	//			source = {bodyParts: [`BODY.${child.part}`]};
//	//			source = {bodyParts: [child.part+""]};
//				break;
//			}
//		}
//	}
//	log(text_part);
//	if (!text_part){
//	//Error: no text/plain found at the top level or first children
//		Y({error: "no text/plain found at the top level or first children"});
//		end();
//		return;
//	}
//
//	let size = text_part.size;
//	if (!Number.isFinite(size)){
//		Y({error: `text size not given`});
//		end();
//		return;
//	}
//	if (size > MAX_TEXT_SIZE){
//		Y({error: `text size(${size}) > MAX_TEXT_SIZE(${MAX_TEXT_SIZE})`});
//		end();
//		return;
//	}
//	»

log(`fetchOne: uid(${uid})`);
//log(source);

mess = await client.fetchOne(uid, {source: {maxLength: MAX_SIZE}}, {uid: true});

simpleParser(mess.source, {}, (error, parsed) => {
	if (error) return Y({error:err});
	else Y({message: parsed});
});

//let dl = await client.download(uid, text_part_num, {uid: true});
//log(dl);
//Y({message: "Got download..."});
//if (!(mess && mess.source)){
//Y({error: `Could not fetch seqNum(${seqNum}) uid(${uid})`});
//end();
//return;
//}
//log(mess);
//Y({message: {
//		text: mess.source.toString(),
//		from,
//		date,
//		sub
//	}
//});

«
//{
//  seq: 2,
//  flags: Set(1) { '$NotJunk' },
//  uid: 40078,
//  internalDate: 2023-01-31T17:34:43.000Z,
//  size: 19203,
//  emailId: 'AAMrPuhVAg2fY9lRMwAyyFYS9P4',
//  envelope: {
//    date: 2023-01-31T17:34:20.000Z,
//    subject: 'Re: Requesting consulting for a long-time personal project',
//    from: [ [Object] ],
//    sender: [ [Object] ],
//    replyTo: [ [Object] ],
//    to: [ [Object] ],
//    inReplyTo: '<1468647980.1162807.1675185790888@mail.yahoo.com>',
//    messageId: '<ff7a664c-b05a-44b5-8abb-37f2f07e705c@app.fastmail.com>'
//  },
//  bodyStructure: {
//    childNodes: [ [Object], [Object] ],
//    type: 'multipart/alternative',
//    parameters: { boundary: '7fedb0f2b29c4890966362dfe634c3af' }
//  },  id: 'AAMrPuhVAg2fY9lRMwAyyFYS9P4'
//}
//---------CHILDREN---------
//[
//  {
//    part: '1',
//    type: 'text/plain',
//    encoding: '7bit',
//    size: 4721,
//    lineCount: 47
//  },
//  {
//    part: '2',
//    type: 'text/html',
//    encoding: 'quoted-printable',
//    size: 6965,
//    lineCount: 92
//  }
//]
//
//
//»
//
////let mess = await client.fetchOne(client.mailbox.exists, { envelope: true });
//
////log(mess);
////log("---------CHILDREN---------");
//log(mess.bodyStructure.childNodes);
//Y({message: "Do you see this thing there???"});

//simpleParser(mess.source, {}, (error, parsed) => {
//	if (err) return Y({error:err});
//	else Y({message: parsed});
//});

// list subjects for all messages
// uid value is always included in FETCH response, envelope strings are in unicode.
// for await (let message of client.fetch('1:*', { envelope: true })) {
//    console.log(`${message.uid}: ${message.envelope.subject}`);
// }

//log(`${mess.uid}: ${mess.envelope.subject}`);

} 
catch(error){
log(error);
log(error.response);
log(error.response.attributes);
	Y({error});
} 
finally {
// Make sure lock is released, otherwise next `getMailboxLock()` never returns
	end();
}
// log out and close connection

});
};//»
*/
//»

