/*

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

*/

//Imports«

import { util, api as capi } from "util";
import { globals } from "config";

const {fs, APPDATA_PATH} = globals;
const MAILDATA_PATH = `${APPDATA_PATH}/mail`;
const USERS_FILE = `${MAILDATA_PATH}/users`;
const CURUSER_FILE = `${MAILDATA_PATH}/curuser`;
const {mkDir, mkFile} = fs.api;

const{strnum, isarr, isstr, isnum, isobj, log, jlog, cwarn, cerr}=util;

//»

export const mod = function(termobj) {

//Var«
const {//«
	refresh,
	topwin,
	quit_new_screen,
	h
} = termobj;//»

const email = this;

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

this.key_handler=(sym, e, ispress, code)=>{//«

/*In here we can put in stuff to invoke vim or less submodes (seeing if we can hack them
both to serve our needs).
*/

	let am = active_menu;
	if (ispress) {//«

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
		return;
	}//»

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

this.init = (o={})=>{//«

let {opts}=o;
this.command_str = o.command;

return new Promise(async(Y,N)=>{

	if (!await mkDir(APPDATA_PATH,"mail")){
		Y(`Could not create the data directory: ${MAILDATA_PATH}`);
		return;
	}
	users_node = await mkFile(USERS_FILE);
	if (!users_node) return Y(`Could not get the users file: ${USERS_FILE}`);
	users = (await users_node.text).split("\n");

//For adduser/deluser/etc, do all that stuff here and then return before init_new_screen.

	email.cb = Y;
	hold_screen_state = termobj.init_new_screen(email, appclass, lines, line_colors, num_stat_lines, onescape);
	set_screen(MAIN_MENU);

});

}//»

}



