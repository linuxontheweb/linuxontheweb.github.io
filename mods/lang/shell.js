/*README«

This file implements the Shell Command Language: tokenizer, parser (ast builder), and execution
engine.

@COMCLASS: The class that all commands must override is kept here.
@BUILTINS: Shell builtins are kept here.

Non-builtin commands are defined inside of the coms/ hierarchy. The simplest file
that defines a command should look something like:

//BEGIN
const {Com} = LOTW.globals.ShellMod.comClasses;
    
const com_hello = class extends Com{
	run(){
		this.out("Hello!");
		this.ok();
	}
}

const coms = {
	hello: com_hello
}

export {coms};
//END

If this is kept in coms/mycoms.js, then the exported command(s) (e.g. "hello") can be loaded into
the shell via:

$ import mycoms

If it is kept in coms/path/to/mycoms.js, the command(s) can be loaded by:

$ import path.to.mycoms

»*/

/*«
»*/

/*12/3/25: MAJOR OVERHAUL TIME!«

We are going to rename, refactor, and simplify everything as much as possible.
Let's start by using only echo, pipe, true, false, and compound compositions thereof, then
add in other commands as we go along (read, cat, grep, wc, etc).

We are going to start with only 2 I/O methods:
1) stdin: read from terminal
2) stdout: write to terminal

»*/
/*12/2/25«

Ways of receiving standard input for all simple commands, in order of precedence

1) Redirected input
2) Piped input

Otherwise for simple commands defined inside of a compound command:
3) Redirected input from the nearest enclosing compound command
4) Piped input from the nearest enclosing compound command

Otherwise (for non-enclosed simple commands or no redirected or piped input in any enclosing compound command):
5) Read from the terminal's readline method

For the sake of simplicity, let's start by exposing standard input only in an element-wise fashion
(e.g. line-by-line). So each command can have (something like) a readStdinChunk method (@MDJYEKL), 
which will continue to spit out EOF objects when all of the input has been exhausted.

Can we cancel out scriptOut? This seems to be an old thing that is no longer defined anywhere.

»*/
/*12/1/25«

What commands use the default pipeIn pathway, without defining their own pipeIn?
What *is* the default pathway, anyhow?

Normally, if you just want to wait for all of the input at once (instead of streaming), you
define pipeDone, which is called with all of the buffered input.

»*/

/*11/30/25: Let's get rid of _pipeIn, and just have a single pipeIn method (that shouldn't be overridden)«

for simple AND compound commands. Then we should allow the command authors to dictate these things:
1) What types of data they are expecting to flow in (text, Uint8Array's, or instances of class WidgetXYZ)
	- So Com.pipeIn can check flags set from within the command author's extended class, and either
	  silently discard, issue warnings, or whatever else in case the wrong data type flows through.
2) How the data should flow in
	- Buffer everything until the EOF is reached
	- Define a certain "atom" of data (e.g. a line of text), allowing the data to be consumed one 
	  "atomic unit" at a time

There are no commands in here (sys/shell.js) that define pipeIn, but in coms/fs.js, there are:
- less and vim call addLines on their respective screen-based modules
- cat calls this.out(val)
- grep calls this.doGrep(val.split("\n")) 
- wc calls this.doWC(val.split("\n")) 

Otherwise, the only thing that is done is to check flags, for example:
	if (this.killed || this.noPipe) return;

For compound commands, the piped input should by default be added to a buffer, the contents
of which any simple command internal to the compound command can access. Some commands 
(like grep) are "greedy" and want every bit of input until the EOF is reached, and some 
(like read) just want the input that was added first. Just verified that the contents
of a compound command's buffer ARE kept for internal compound commands, e.g.:

~$ doemb(){ read LINE; echo "INPUT: $LINE"; }
~$ echo $'This is the\ntime in the place\n\nin the thing that is in the there of the thing' | doemb 
INPUT: This is the
~$ doodemb(){ doemb; }
~$ echo $'This is the\ntime in the place\n\nin the thing that is in the there of the thing' | doodemb 
INPUT: This is the
~$ doodemb(){ doemb; doemb; }
~$ echo $'This is the\ntime in the place\n\nin the thing that is in the there of the thing' | doodemb 
INPUT: This is the
INPUT: time in the place


I'm not sure if com_read @OEHRHFJR should be calling this.readLine method directly like this.
The only other "major" command that seems to call this.readLine is com_cat, when: this.useTerm == true.

»*/
/*9/3/25: Let's clean up the logic of piping, so that derived instances DO NOT need to«
defined a pipeIn method. Let's put a "private" _pipeIn method on class Com.

I don't have a good intuition for EXACTLY what envPipeOutLns and envPipeInCb are TRULY all about.
I know I understood the mechanics of them when I was working out the logic, but that memory
has faded into relative obscurity.

I'm also a little sketchy about how to handle Uint8Array's inside of pipelines. In here,
the only command that seems to use them is com_wget (when sending output). In coms/fs.js,
com_brep only wants Uint8Array's in its piped input. But since
I just radically changed piping logic (so that commands don't really need to implement anything),
I commented out com_brep's prior pipeIn method (and replaced it with a pipeDone stub).

LET'S ALLOW FOR A this.binPipe flag that can be set in init, and that signals the pipeline
to automatically translate all incoming data into binary data (e.g. Uint8Array).
class Com's _pipeIn method will do the translation, and call the command's pipeIn method,
and push it into a JS array. Upon getting the EOF, we can concatenate all of them into
a single Uint8Array, using the method @VEJZPMWU, and then call the command's pipeDone method
with the final Uint8Array. This method should be used by com_brep.

The problem for translating strings to Uint8Array's is that we need to do: 

let reader = new FileReader();
reader.onloadend = () => {
//ArrayBuffer in: reader.result;
let bytes = new Uint8Array(reader.result);
}
reader.readAsArrayBuffer("My string here har har ha ha hoo hoo");

So in other words, we need to do some kind of awaiting before sending it off to a command
that has set 'this.binPipe = true'. We need to check for the this.binPipe flag @ZELMGSO,
and then do a call to toBytes. The only real question is that whatever is coming into
the pipe is a consistent type: strings or Uint8Arrays (or Blobs, etc).
»*/
//Notes«
//Old notes in the linuxontheweb/doc repo, in dev/TERMINAL and dev/SHELL
/*CRITICAL BUG:«
THIS RETURNS THE TEXT IN THE FORM OF A LINES ARRAY BECAUSE OF THIS IN  fs.js: 
let val = await fname.toText(term);
_.toText = async function(opts = {}) {
	let node = await this.toNode(opts);
	if (!node) return;
	if (!node.isFile) return;
	let txt = await node.text;

//	if (opts.lines) return txt.split("\n");//<-- When term is used as the "opts", there is a lines member in it!

	if (opts.lines === true) return txt.split("\n");

	return txt;
};


»*/
/*5/20/25: The trivial idea I have is to support a mode of input (for secret passwords, etc)«
that either echoes stars or echoes the letter which gets turned into a star upon the next 
render. Let's do a command.

Before I do anything though I need to figure out how to get back the old behavior of
refreshing the shell and the terminal at the same time...

»*/

//»

//Imports«

const NS = LOTW;
const {globals, Desk} = LOTW;
const {

	dev_mode,
//	nodejs_mode,
	fsMod
} = globals;
const{
	TEXT_EDITOR_APP,
	LINK_APP,
	FOLDER_APP,
}=globals.app;
const{
	EOF,
	SHELL_ERROR_CODES,
}=globals.term;
const{
	FS_TYPE,
	USERS_TYPE,
	MOUNT_TYPE,
	SHM_TYPE,

	DIR_TYPE,
	LINK_TYPE,
	BAD_LINK_TYPE,
	IDB_DATA_TYPE,
}=globals.fs;
const util = LOTW.api.util;
const {
	strNum,
	isArr,
	isJSArr,
	isStr,
	isNum,
	isObj,
	isNode,
	isDir,
	isFile,
	isFunc,
	isErr,
	make,
	kc,
	log,
	jlog,
	cwarn,
	cerr,
	normPath,
	linesToParas,
	isBool,
	isEOF,
	sleep
} = util;

const fsapi = fsMod.api;

//let ALLOW_REDIR_CLOBBER = false;
let ALLOW_REDIR_CLOBBER = true;

const{E_SUC, E_ERR} = SHELL_ERROR_CODES;
const ASSIGN_RE = /^([_a-zA-Z][_a-zA-Z0-9]*(\[[_a-zA-Z0-9]+\])?)=(.*)/s;
const NO_SET_ENV_VARS = ["USER"];
const ALIASES = {
    c: "clear",
    la: "ls -a",
};
const BADSUB = "bad substitution";

const isLoopCont = val => {
	return (isObj(val) && isNum(val.continue) && val.continue > 0);
};
const doLoopCont = (val, com) => {
//Perform the continue operation in the current loop
	if (val.continue === 1 || com.loopNum === 1) return true;
//Decrement the continue value by 1 and return the object
	return false;
};
const isLoopBreak = val => {
	return (isObj(val) && isNum(val.break) && val.break > 0);
};
const doLoopBreak = (val, com) => {
//Perform the continue operation in the current loop
	if (val.break === 1 || com.loopNum === 1) return true;
	return false;
};
const DIE = mess => { throw new Error(mess); };
//»

//«Shell
//Shell Notes«
/*12/24/24:«

I've started trying to "fix" the old shell execution algorithm instead of
working on the completely new Runtime. I started trying to figure out how
to get backgrounding working, but only got pulled into a frenetic attempt
to get the old crufty stuff to "just work".

The problem is that I have loops-insideof-loops-insideof-loops.

I've decided to just dump backgrounded output onto the JS console.

»*/
/*12/23/24: Now editing this is like editing /sys/fs.js, and will require a system«
reboot. That's okay because we want to export certain members of ShellMod
such as Runtime, so that it can be locally developed. This plus the fact that we
can start implementing arbitrary non-trivial desktop layout initialization scripts
makes it "no sweat" to require "hard reboots" to our system for changes to the
shell. (There's always also the "dev_reload" concept...)

We don't want the filesystem to be used to storing entire classes/functions, but
rather the textual read/write interfaces into their object instances.

Perhaps we should create id numbers for apps (different from the win.winNum's that
are merely used to locate their associated windows in the DOM) and for coms,
which represents the concept of a "process id" (pid).

So, every Com has a pid and a ScriptCom can have many child pid's (but only ever one
"currently active" pid if the andor's are only synchronous).

WHAT TO DO ABOUT THE OUTPUT OF ASYNC COMMANDS, e.g.:

~$ ./some_long_and_verbose_script.sh &

I THINK IT IS A BUG RATHER THAN A FEATURE TO DO THIS AS IS CURRENTLY DOME IN LINUX,
I.E. JUST BARFING THE OUTPUT INTO THE WORKING TERMINAL SCREEN.

How about a background output console?

»*/
//»

/*ShellMod: This function/"namespace" is our way to bundle *everything* «
that is relevant to the thing called the "shell" (as opposed to the thing called 
the "terminal") into a singular thing. We want to do this in a totally 
methodical/non-destrutive kind of way, so we can be very assured of the fact that 
everything always works as ever.»*/
//let parserId = 1;
export const mod = function() {

//Var«

const shellmod = this;
this.allLibs = LOTW.libs;

const mail_coms=[//«
	"mkcontact",
	"mail",
	"curaddr",
	"dblist",
	"dbdrop",
	"imapcon",
	"imapdis",
	"imapgetenvs"
];//»
const fs_coms=[//«
	"_purge",
	"_clearstorage",
	"_blobs",
	"wc",
	"grep",
	"dl",
	"less",
	"cat",
	"mkdir",
	"rmdir",
	"mv",
	"cp",
	"rm",
	"symln",
	"ln",
	"vim",
	"touch",
	"brep",
//	"mount",
//	"unmount",
];//»
const test_coms = [//«
"pipe",
"deadpipe",
"badret",
"noret",
"nullret",
"badobj",
"badarrobj",
"oktypedarr",
"badtypedarr",
"weirdarr",
"hang",
"norun"
]//»
//const preload_libs={fs: fs_coms, test: test_coms};
const preload_libs={fs: fs_coms, esprima: ["esparse"]};
//if (nodejs_mode) preload_libs.mail = mail_coms;
if (dev_mode) preload_libs.mail = mail_coms;
this.preloadLibs = preload_libs;

//Parsing«

const OPERATOR_CHARS=[//«
"|",
"&",
";",
"<",
">",
"(",
")",
];//»
//const UNSUPPORTED_OPERATOR_CHARS=["(",")"];
//const UNSUPPORTED_OPERATOR_CHARS=[];
/*
const UNSUPPORTED_DEV_OPERATOR_TOKS = [];
const UNSUPPORTED_OPERATOR_TOKS=[//«
	'&',
//	'<',
	';;',
	';&',
	'>&',
	'>|',
	'<&',
//	'<<',
	'<>',
	'<<-',
//	'<<<'
];//»
*/

const OCTAL_CHARS=[ "0","1","2","3","4","5","6","7" ];
const INVSUB="invalid/unsupported substitution";
const START_NAME_CHARS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "_"];
//const START_NAME_CHARS = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","_"];
const DIGIT_CHARS_1_to_9=["1","2","3","4","5","6","7","8","9"];
const DECIMAL_CHARS_1_to_9=["1","2","3","4","5","6","7","8","9"];
const DECIMAL_CHARS_0_to_9=["0", "1","2","3","4","5","6","7","8","9"];
const ANY_DIGIT_CHARS=["0", "1","2","3","4","5","6","7","8","9"];
const ANY_NAME_CHARS = [...START_NAME_CHARS, ...ANY_DIGIT_CHARS];
//const ANY_NAME_CHARS = [...START_NAME_CHARS, ...DECIMAL_CHARS_0_to_9];
const SPECIAL_SYMBOLS=[ "@","*","#","?","-","$","!","0" ];

const OPERATOR_TOKS=[//«
'&&',
'||',
';;',
';&',
'>&',
'>>',
'>|',
'<&',
'<<',
'<>',
'<<-',
'<<<',
];//»
const OK_OUT_REDIR_TOKS=[">",">>"];
const OK_IN_REDIR_TOKS=["<","<<","<<<","<<-"];
const OK_REDIR_TOKS=[...OK_OUT_REDIR_TOKS, ...OK_IN_REDIR_TOKS];

const isNLs=val=>{return val instanceof Newlines;};
//»

//»
//«Funcs

const dup=(obj)=>{//Deep copy«
	const _dup=(o)=>{//«
		let rv;
		if (isStr(o)) return o;
		if (o.dup) return o.dup();
		if (isObj(o)){
			rv = {};
			for (let k in o){
				if (o[k]) rv[k] = _dup(o[k]);
				else rv[k] = o[k];
			}
		}
		else if (isArr(o)){
			rv = [];
			for (let i=0; i < o.length; i++){
				rv.push(_dup(o[i]));
			}
		}
		return rv;
	};//»
	return _dup(obj);
};
const sdup=(obj)=>{//Shallow copy
	let out={};
	for (let k in obj){
		out[k]=obj[k];
	}
	return out;
};

//»

//Helpers (this.util)«

const eval_shell_expr = async (args, cwd) => {//«
/*«From https://www.man7.org/linux/man-pages/man1/test.1.html
test - check file types and compare values
       test EXPRESSION
       test
       [ EXPRESSION ]
       [ ]
       [ OPTION

Exit with the status determined by EXPRESSION.

An omitted EXPRESSION defaults to false.  Otherwise, EXPRESSION
is true or false and sets exit status.  It is one of:

( EXPRESSION )
  EXPRESSION is true

! EXPRESSION
  EXPRESSION is false

EXPRESSION1 -a EXPRESSION2
  both EXPRESSION1 and EXPRESSION2 are true

EXPRESSION1 -o EXPRESSION2
  either EXPRESSION1 or EXPRESSION2 is true

-n STRING
  the length of STRING is nonzero

STRING equivalent to -n STRING

-z STRING
  the length of STRING is zero

STRING1 = STRING2
  the strings are equal

STRING1 != STRING2
  the strings are not equal

INTEGER1 -eq INTEGER2
  INTEGER1 is equal to INTEGER2

INTEGER1 -ge INTEGER2
  INTEGER1 is greater than or equal to INTEGER2

INTEGER1 -gt INTEGER2
  INTEGER1 is greater than INTEGER2

INTEGER1 -le INTEGER2
  INTEGER1 is less than or equal to INTEGER2

INTEGER1 -lt INTEGER2
  INTEGER1 is less than INTEGER2

INTEGER1 -ne INTEGER2
  INTEGER1 is not equal to INTEGER2

FILE1 -ef FILE2
  FILE1 and FILE2 have the same device and inode numbers

FILE1 -nt FILE2
  FILE1 is newer (modification date) than FILE2
FILE1 -ot FILE2
  FILE1 is older than FILE2

-d FILE
  FILE exists and is a directory

-e FILE
  FILE exists

-f FILE
  FILE exists and is a regular file

-h FILE
  FILE exists and is a symbolic link (same as -L)

-L FILE
  FILE exists and is a symbolic link (same as -h)

-N FILE
  FILE exists and has been modified since it was last read

-r FILE
  FILE exists and the user has read access

-s FILE
  FILE exists and has a size greater than zero

-w FILE
  FILE exists and the user has write access




-G FILE
  FILE exists and is owned by the effective group ID

-b FILE
  FILE exists and is block special

-c FILE
  FILE exists and is character special

-g FILE
  FILE exists and is set-group-ID

-k FILE
  FILE exists and has its sticky bit set

-x FILE
  FILE exists and the user has execute (or search) access

-p FILE
  FILE exists and is a named pipe

-O FILE
  FILE exists and is owned by the effective user ID

-S FILE
  FILE exists and is a socket

-t FD  file descriptor FD is opened on a terminal

-u FILE
  FILE exists and its set-user-ID bit is set


Except for -h and -L, all FILE-related tests dereference symbolic
links.  Beware that parentheses need to be escaped (e.g., by
backslashes) for shells.  INTEGER may also be -l STRING, which
evaluates to the length of STRING.

Binary -a and -o are ambiguous.  Use 'test EXPR1 && test EXPR2'
or 'test EXPR1 || test EXPR2' instead.

'[' honors --help and --version, but 'test' treats them as
STRINGs.

»*/
/*«Cheat sheet


So we have a series of expressions separated by -a (and) and -o (or).


*** Binary ops ***
String and Integer:
  -eq, -ne

Integer-only:
  -ge, -gt, -le, -lt

File only:
  -ef, -nt, -ot

*** Unary ops ***

n: non-zero-length string
z: zero-length string

For the rest, the strings are treated as files
h: is symlnk
L: is symlink

ef: same file
nt: newer than
ot: older than

d: is directory
e: exists
f: is regular
r: user can read
s: size is greater than 0
w: user can write

p: is named pipe
N: modified since last read

If, as advised in the documentation, we don't support the logical connectives
('-a' and '-o'), then there seems to be no point in supporting the grouping/control 
operators: '(' and ')'. Then, all we need to support are singular binary or unary operators:

[!] [Expression]

Where expression is one of:
1) unary word
2) word binary word

All we need to do is strip any '!' and then see how many tokens there are.

If 0: this is always (!) false
If 1: this is always (!) true
If 2: 
  - the first must be a valid unary operator.
  - otherwise complain: "<first_arg>: unary operator expexted"
If 3:
  - the second must be a valid binary operator.
  - otherwise complain: "<second_arg>: binary operator expected"

If more than 3:
  - complain: "too many arguments"
»*/

const maybe_neg=(which)=>{//«
	if (!is_neg){
		if (which) return E_SUC;
		return E_ERR;
	}
	if (which) return E_ERR;
	return E_SUC;
};//»
const UNARY_OPS=[//«
	"-n",//non-zerp
	"-z",//zero

	"-h",//symlink
	"-L",//symlink
	"-d",
	"-e",
	"-f",
	"-r",
	"-s",
	"-w",
];//»
const BINARY_OPS=[//«
	"=",//String equal
	"!=",//String equal
	"=~",//String match
	"!~",//String match

	"-eq",//String/integer equal
	"-ne",//String/integer not equal
	"-ge",//Int >=
	"-gt",//Int >
	"-le",//Int <=
	"-lt",//Int <

	"-ef",//equal files (same inode)
	"-nt",//newer than
	"-ot",//older than
];//»
const BAD_ARGS=["(",")","-a","-o"];

for (let arg of args){
	if (BAD_ARGS.includes(arg)) return `'${arg}': unsupported test operator`;
}
let is_neg = false;
while (args[0]==="!"){
	is_neg = !is_neg;
	args.shift();
}
/*«
if (args[0]==="!"){
	is_neg = true;
	args.shift();
}
else{
	is_neg = false;
}
»*/
//if (args.length == 1) return maybe_neg(true);
//if (!args.length) return maybe_neg(false);
if (args.length < 2) return maybe_neg(args.length);
if (args.length > 3) return "too many arguments";
if (args.length==2){//«
	let op = args.shift();
	if (!UNARY_OPS.includes(op)) return `'${op}': unary operator expected`
	let arg = args.shift();
	if (op==="n") return maybe_neg(arg.length);
	if (op==="z") return maybe_neg(!arg.length);

//	"-h",//symlink
//	"-L",//symlink
//	"-d",
//	"-e",
//	"-f",
//	"-r",
//	"-s",
//	"-w",

//d: is directory
//e: exists
//f: is regular

//r: user can read
//s: size is greater than 0
//w: user can write

let node = await arg.toNode({cwd, getLink: op==="-h"||op==="-L"});
if (!node) return maybe_neg(false);
if (op==="-e"||op==="-r") return maybe_neg(true);
if (op==="-f") return maybe_neg(node.isFile);
if (op==="-h"||op==="-L") return maybe_neg(node.isLink);
if (op==="-w"){//«
	let usenode;
	if (node.isDir) usenode = node;
	else usenode = node.par;
//	return maybe_neg(await fsapi.checkDirPerm(usenode));
	return maybe_neg(usenode.okWrite);
}//»
if (op==="-s"){//«
	if (!node.isFile) return maybe_neg(true);
	if (node.type!==FS_TYPE) {
cwarn("Not checking the size of non-local-fs files");
		return maybe_neg(true);
	}
	let f = await node._file;
	if (!f){
cwarn("No file returned from node._file!!!", node);
		return maybe_neg(false);
	}
	return maybe_neg(!!f.size);
}//»

cerr(`UNUSED OPERATOR (${op}), RETURNING ERROR`);

	return E_ERR;
}//»

let arg1 = args[0];
let op = args[1];
let arg2 = args[2];
if (!BINARY_OPS.includes(op)) return `'${op}': binary operator expected`

if (op==="=~"||op=="!~"){
//log(op, arg1, arg2);
try{
let re = new RegExp(arg2);
let res = !!re.test(arg1);
if (op==="!~") return maybe_neg(!res);
return maybe_neg(res);
}
catch(e){
return E_ERR;
}
return E_SUC;
}

if (arg1.match(/^\d+$/)&&!arg2.match(/^\d+$/)) return `'${arg2}': integer expression expected`;
if (arg2.match(/^\d+$/)&&!arg1.match(/^\d+$/)) return `'${arg1}': integer expression expected`;
if (arg1.match(/^\d+$/)){//«
let n1 = parseInt(arg1);
let n2 = parseInt(arg2);
switch(op){
	case "-eq": {
		return maybe_neg(n1 === n2);
	}
	case "-ne": return maybe_neg(n1 !== n2);
	case "-ge": return maybe_neg(n1 >= n2);
	case "-gt": return maybe_neg(n1 > n2);
	case "-le": return maybe_neg(n1 <= n2);
	case "-lt": return maybe_neg(n1 < n2);
}
}//»
if (op==="=") {
	return maybe_neg(arg1 === arg2);
}
if (op==="!=") return maybe_neg(arg1 !== arg2);
//cwarn("EVAL", arg1, op, arg2);
let node1 = await arg1.toNode({cwd});
let node2 = await arg2.toNode({cwd});
if (!(node1&&node2)) return maybe_neg(false);
if (!(node1.isFile&&node2.isFile)) return maybe_neg(node1===node2);

//	"-ef",//equal files (same inode)
//	"-nt",//newer than
//	"-ot",//older than
if (op==="-ef"){//«
	if (Number.isFinite(node1.blobId) &&  Number.isFinite(node2.blobId)){
		return maybe_neg(node1.blobId===node2.blobId);
	}
	return maybe_neg(node1===node2);
}//»
if (node1.type===FS_TYPE&&node2.type===FS_TYPE){//«

let f1 = await node1._file;
let f2 = await node2._file;
if (!(f1&&f2)){//«
cwarn("No files on the node[s]");
log(node1, node2);
	return E_ERR;
}//»
let m1 = f1.lastModified;
let m2 = f2.lastModified;
if (!(m1&&m2)){//«
cwarn("No lastModified times on the node.file[s]");
log(f1, f2);
return E_ERR;
}//»
if (op==="-ot") return maybe_neg(m1 > m2);
if (op==="-nt") return maybe_neg(m1 < m2);

}//»
else{//«
cwarn("Not comparing modification times of nodes that are non-fs files");
log(node1, node2);
return E_ERR;
}//»
cerr(`UNUSED OPERATOR (${op}), RETURNING ERROR`);
//if (op)

return E_ERR;

};//»

const make_sh_err_com = (name, mess, com_env)=>{//«
	let com = new this.comClasses.ErrCom(name, null,null, com_env);
//SPOIRUTM
	if (name) com.errorMessage = `sh: ${name}: ${mess}`;
	else com.errorMessage = `sh: ${mess}`;
	com.doNotAddCom = true;
	return com;
};//»

const get_options = (args, com, opts={}) => {//«
	const getlong = opt => {//«
		let re = new RegExp("^" + opt);
		let numhits = 0;
		let okkey;
		for (let k of lkeys) {
			if (re.exec(k)) {
				numhits++;
				okkey = k;
			}
		}
		if (!numhits) {
			err.push(`invalid option: '${opt}'`);
			return null;
		} 
		else if (numhits == 1) return okkey;
		else {
			err.push(`option '${opt}' has multiple hits`);
			return null;
		}
	};//»
	let err = [];
	let sopts = opts.short || opts.SHORT || opts.s;
	let lopts = opts.long || opts.LONG || opts.l;
	let getall = opts.ALL;
//	let getall = true;
	let obj = {};
	let arg_start = null;
	let arg_end = null;
	let arg1, arg2;
	let marr;
	let ch;
	let ret;
	if (!sopts) sopts = {};
	if (!lopts) lopts = {};
	let lkeys = Object.keys(lopts);
	for (let i = 0; i < args.length;) {
		if (isObj(args[i])) {
			i++;
			continue;
		}
		if (args[i].toString() == "--") {
			args.splice(i, 1);
			return [obj, err];
		}
//Short opts
		else if (marr = args[i].match(/^-([a-zA-Z0-9][a-zA-Z0-9]+)$/)) {//«
			let arr = marr[1].split("");
			for (let j = 0; j < arr.length; j++) {
				ch = arr[j];
//				if (sopts[ch] === 2 || sopts[ch] === 3) {
				if (!getall && (sopts[ch] === 2 || sopts[ch] === 3)) {
					if (i === 0) obj[ch] = arr.slice(1).join("");
					else err.push(`option: '${ch}' requires args`);
				}
				else if (getall || sopts[ch] === 1) obj[ch] = true;
				else if (!sopts[ch]) err.push(`invalid option: '${ch}'`);
				else err.push(`option: '${ch}' has an invalid option definition: ${sopts[ch]}`);
			}
			args.splice(i, 1);
		}//»
		else if (marr = args[i].match(/^-([a-zA-Z0-9])$/)) {//«
			ch = marr[1];
			if (getall){
				if (!args[i + 1]) err.push(`option: '${ch}' requires an arg`);
				obj[ch] = args[i + 1];
				args.splice(i, 2);
			}
			else if (!sopts[ch]) {
				err.push(`invalid option: '${ch}'`);
				args.splice(i, 1);
			} 
			else if (sopts[ch] === 1) {
				obj[ch] = true;
				args.splice(i, 1);
			} 
			else if (sopts[ch] === 2) {
//				err.push(`option: '${ch}' is an optional arg`);
				args.splice(i, 1);
				if (args[i]&&!args[i].match(/^-/)){
					obj[ch] = args[i];
				}
				else obj[ch] = true;
			} 
			else if (sopts[ch] === 3) {
				if (!args[i + 1]) err.push(`option: '${ch}' requires an arg`);
				obj[ch] = args[i + 1];
				args.splice(i, 2);
			} 
			else {
				err.push(`option: '${ch}' has an invalid option definition: ${sopts[ch]}`);
				args.splice(i, 1);
			}
		}//»

//Long opts
		else if (marr = args[i].match(/^--([a-zA-Z0-9][-a-zA-Z0-9]+)=(.+)$/)) {//«
let lopt = marr[1];
if (lopts[lopt] === 1){
err.push(`option '${lopt}' requires no arg`);
}
//			if (getall || (ret = getlong(marr[1]))) {
else {
			if (getall || (ret = getlong(lopt))) {
				if (getall) ret = lopt;
				obj[ret] = marr[2];
			}
}
args.splice(i, 1);
		}//»
		else if (marr = args[i].match(/^--([a-zA-Z0-9][-a-zA-Z0-9]+)=$/)) {//«
			if (getall || (ret = getlong(marr[1]))) {
				if (getall) ret = marr[1];
				obj[ret] = args[i + 1];
				if (args[i + 1]) args.splice(i + 1, 2);
				else args.splice(i, 1);
			} 
			else args.splice(i, 1);
		}//»
		else if (marr = args[i].match(/^--([a-zA-Z0-9][-a-zA-Z0-9]+)$/)) {//«
			if (getall || (ret = getlong(marr[1]))) {
				if (getall) ret = marr[1];
				if (getall || (lopts[marr[1]] === 1 || lopts[marr[1]] === 2)) obj[ret] = true;
				else if (lopts[marr[1]] === 3) err.push(`long option: '${marr[1]}' requires an arg`);
				else if (lopts[marr[1]]) err.push(`long option: '${marr[1]}' has an invalid option definition: ${lopts[marr[1]]}`);
				else if (!lopts[marr[1]]) err.push(`invalid long option: '${marr[1]}`);
				args.splice(i, 1);
			} 
			else args.splice(i, 1);
		}//»
		else if (marr = args[i].match(/^(---+[a-zA-Z0-9][-a-zA-Z0-9]+)$/)) {//«
			err.push(`invalid option: '${marr[1]}'`);
			args.splice(i, 1);
		}//»
		else i++;
	}
	return [obj, err];
}//»
const add_to_env = (arr, env, opts)=>{//«
	let {term, if_export} = opts;
	let marr;
//	let use;
	let err = [];
	let use = arr[0];
//log(arr);
	let assigns = {};
	while (use) {
		let which;
		const next=()=>{
			arr.shift();
			if (arr[0]===" ") arr.shift();
			use = arr[0];
		};
		if (use.toString().match(/^\s*#/)){
cwarn(`add_to_env: SKIPPING COMMENT: ${use}`);
next();
continue;
		}
//log(use.toString());
//		marr = this.var.assignRE.exec(use.toString());
		marr = ASSIGN_RE.exec(use.toString());
		if (!marr){
			if (!if_export) break;
			else{
				err.push(`sh: '${use}': not a valid identifier`);
				next();
				continue;
			}
		}
		which = marr[1];
//		if (this.var.noSetEnvVars.includes(which)){
		if (NO_SET_ENV_VARS.includes(which)){
			err.push(`sh: ${which}: cannot set the constant environment variable`);
			next();
			continue;
		}
		assigns[which]=marr[3];
//		env[which]=marr[3];
		next();
	}
//	if (!arr.length && !if_export){
//		env = term.ENV;
//	}
	for (let k in assigns){
		env[k]=assigns[k];
	}
	return err;
};//»
const import_coms = async libname => {//«

	let modpath = libname.replace(/\./g,"/");
	let v = (Math.random()+"").slice(2,9);
	let imp = await import(`/coms/${modpath}.js?v=${v}`);

	let coms = imp.coms;
	let sh_coms = globals.shell_commands;
	let all = Object.keys(coms);
	let ok_coms = [];
	for (let com of all){
		if (typeof sh_coms[com] === "function") {
cwarn(`The command ${com} already exists!`);
			continue;
		}
		sh_coms[com] = coms[com];
		ok_coms.push(com);
	}
	this.allLibs[libname] = ok_coms;
//do_overlay(`Added ${ok_coms.length} commands from '${libname}'`);
	let opts = imp.opts||{};
	let sh_opts = globals.shell_command_options;
	all = Object.keys(opts);
	for (let opt of all){
		if (sh_opts[opt]){
cwarn(`The option ${opt} already exists!`);
			continue;
		}
		sh_opts[opt] = opts[opt];
	}
	NS.coms[libname] = {coms, opts, onkill: imp.onkill};
	return ok_coms.length;
}//»
const do_imports = async(arr, err_cb) => {//«
	if (!err_cb) err_cb = ()=>{};
//	let did_num=[];
//	let s='';
	let out=[];
	for (let name of arr){
		if (this.allLibs[name]) {
			continue;
		}   
		try{
			let num = await import_coms(name);
			out.push(`${name}(${num})`);
log(`Imported ${num} from ${name}`);
		}catch(e){
			err_cb(`${name}: error importing the module`);
cerr(e);
		}
	}

	return out.join(", ");
};//»

const delete_coms = arr => {//«
	let sh_coms = globals.shell_commands;
	let sh_opts = globals.shell_command_options;
	for (let libname of arr){
if (!this.allLibs[libname]){
//cwarn(`The command library: ${libname} is not loaded`);
continue;
}
		let lib = NS.coms[libname];
		if (!lib){
//cwarn(`The command library: ${libname} was in this.allLibs, but not in NS.coms!?!?!`);
			continue;
		}
//log("KILL", lib.onkill);
		lib.onkill && lib.onkill();
		let coms = lib.coms;
		let all = Object.keys(coms);
		let num_deleted = 0;
		for (let com of all){
//CJIUKLEH
			if (sh_coms[com] !== coms[com]){
//cwarn(`The command ${com} is not owned by lib: ${libname}!!`);
				continue;
			}
//			delete sh_coms[com];
			sh_coms[com] = libname;
			num_deleted++;
		}
log(`Deleted: ${num_deleted} commands from '${libname}'`);
		let opts = lib.opts;
		all = Object.keys(opts);
		for (let opt of all){
			if (sh_opts[opt] !== opts[opt]){
//cwarn(`The option ${opt} is not owned by lib: ${libname}!!`);
				continue;
			}
			delete sh_opts[opt];
		}
		delete this.allLibs[libname];
		delete NS.coms[libname];
	}
};//»
const delete_mods=(arr)=>{//«
	for (let m of arr){
		let scr = document.getElementById(`script_mods.${m}`);
		if (scr) {
			scr._del();
		}
		delete NS.mods[m];
let coms = this.allLibs[m];
for (let com of coms){
delete globals.shell_commands[com];
}
delete this.allLibs[m];

	}
}//»
this.util={
	deleteComs:delete_coms,
	deleteMods:delete_mods,
	addToEnv:add_to_env,
	doImports:do_imports,
};
/*
this.util={//«
	evalShellExpr: eval_shell_expr,
	make_sh_err_com: make_sh_error_com,
	addToEnv:add_to_env,
	importComs:import_coms,
	doImports:do_imports,
	deleteComs:delete_coms,
	deleteMods:delete_mods,
}//»
*/
//}
//»

//»
//«Exported variables: this.var
/*
this.var={//«

allLibs: LOTW.libs,

}//»
*/
//this.preloadLibs = preload_libs;
//this.allLibs = LOTW.libs;
//»

//Classes     (BaseCommand, SimpleCommand, CompoundCom, ErrCom, Stdin/Stdout, ScriptCom...)«
//ZJDEXWL
const EnvReadLine = class{//«

//#lines;
//#cb;

constructor(term){
	this.lines = [];
	this.term = term;
}
end(){this.killed=true;}
addLn(ln){//«
	if (this.cb) {
		this.cb(ln);
		this.cb = undefined;
		return;
	}
	this.lines.push(ln);
}//»
addLns(lns){//«
	if (isEOF(lns)) return this.addLn(lns);
if (!isStr(lns)){
cwarn("Skipping non-string/non-EOF", lns);
return;
}
	let arr = lns.split("\n");
	for (let ln of arr){
		this.addLn(ln);
	}
}//»
async readLine(){//«
//SZKLIEPO
//	this.term.forceNewline();
	if (this.lines.length){
		return this.lines.shift();
	}
	return new Promise((Y,N)=>{
		this.cb = Y;
	});
}//»

};//»

class Stdin{//«

constructor(tok, arg){
	this.tok=tok;
	this.arg=arg;
	this.isStdin = true;
	this.isRedir = true;
}

async setValue(shell, term, opts={}){//«
//async setValue(shell, term, env, scriptName, scriptArgs){
const{env, scriptName, scriptArgs} = opts;

if (this.tok.isHeredoc) {
	this.value = this.tok.value
	return true;
}
const{tok, arg}=this;
const {r_op}=tok;
if (r_op==="<"){//«
	let arg = this.arg;
	let raw = arg.raw;
	if (!arg.isSimple){
		return `expected a 'simple' file redirection (have '${raw}')`;
	}
	arg.tildeExpansion();
	arg.dsSQuoteExpansion();
	let fname = arg.toString();
	let node = await fname.toNode(term);
	if (!node) {
		return `${raw}: no such file or directory`;
	}
	if (!node.isFile){
		return `${raw}: not a regular file`;
	}
	let rv = await node.text;
	if (!isStr(rv)){
		return `${raw}: an invalid value was returned`;
	}
	this.value = rv;
	return true;
}//»
if (r_op==="<<<"){//«
//	await this.arg.expandSubs(shell, term, env, scriptName, scriptArgs);
//SYEORLDJ
	let arr = [this.arg];
	await shell.allExpansions(arr);
//MSYEOKFK
	let out=[];
	for (let wrd of arr) {
		out.push(wrd.val.join(""));
	}
	this.value = out.join(" ")
	return true;
}//»
return `Unknown stdin redirection: ${rop}`;

}//»

dup(){
	return new Stdin(this.tok, this.arg&&this.arg.dup());
}

}//»
class Stdout{//«

constructor(tok, file){
	this.tok=tok;
	this.file=file;
	this.isStdout = true;
	this.isRedir = true;
}

async write(term, arrarg, env){//«
//async write(term, arrarg, env, ok_clobber){

let val;
if (arrarg instanceof Uint8Array) val = arrarg;
else if (arrarg._isWeird) {
	val = arrarg;
	delete val._isWeird;
}
else {
	val = arrarg.join("\n");
}


const{tok, file: fname}=this;
//const {op}=tok;//WRONG!!!
//-----vvv
const {val: op}=tok;

//This is instance of Word vvvvv
// let fullpath = normPath(fname, term.cur_dir);//WRONG!!!
//ZOPIRUTKS------------------vvvvvvvvvvv
let fullpath = normPath(fname.toString(), term.cur_dir);
let node = await fsapi.pathToNode(fullpath);
if (node) {//«
	if (node.isDevice){
		if (fullpath == "/dev/null") return true;
		if (fullpath == "/dev/log"){
//			console.log(val);
if (isJSArr(val)) {
for (let v of val) console.log(v);
}
else {
console.log(val);
}
			return true;
		}
		else{
cwarn("WHAT KIND OF DEVICE???", fullpath);
		}
		return;
	}
	if (!node.isFile){
		return `${fname}: not a regular file`;
	}
//	if (node.type == FS_TYPE && op===">" && !ok_clobber) {
	if (node.type == FS_TYPE && op===">" && !ALLOW_REDIR_CLOBBER) {
		if (env.CLOBBER_OK==="true"){}
		else return `not clobbering '${fname}' (ALLOW_REDIR_CLOBBER==${ALLOW_REDIR_CLOBBER})`;
	}
	if (node.writeLocked()){
		return `${fname}: the file is "write locked" (${node.writeLocked()})`;
	}
}//»
//YAFHKANT
if (!(isStr(val)||(val instanceof Uint8Array))){
	return "Invalid value sent to Stdout.write (want String or Uint8Array)";
}
let patharr = fullpath.split("/");
patharr.pop();
let parpath = patharr.join("/");
if (!parpath) return `${fname}: Permission denied`;
let parnode = await fsapi.pathToNode(parpath);
if (!parnode){
	return `${fname}: invalid or unsupported path`;
}
let typ = parnode.type;
if (!(parnode.appName===FOLDER_APP&&(typ===FS_TYPE||USERS_TYPE||typ===SHM_TYPE||typ=="dev"))) {
	return `${fname}: invalid or unsupported path`;
}
//if (typ===FS_TYPE && !await fsapi.checkDirPerm(parnode)) {
if (!parnode.okWrite) {
	return `${fname}: Permission denied`;
}
if (node){
	if (!await node.setValue(val, {append: op === ">>"})) return `${fname}: Could not write to the file`;
}
else{
	if (!await fsapi.writeFile(fullpath, val)) return `${fname}: Could not write to the file`;
}
return true;
/*
if (!node || op===">>"){
	if (!await fsapi.writeFile(fullpath, val, {append: true})) return `${fname}: Could not write to the file`;
}
else if (op === ">"){
cwarn("CLOBBER: call setValue on node");
//log(node);
let rv = await node.setValue(val);
log("RETURNED", rv);
return true;
}
else{
cwarn(`UNKNOWN REDIRECT OPERATOR: '${op}'`);
return `Unknown redirect operator: '${op}'`;
}
return true;
*/
}//»

dup(){
	return new Stdin(this.tok, this.arg.dup());
}

}//»
//COMCLASS
class BaseCommand {//«
	#pipeInBuffer;
	#redirInBuffer;
	#redirOut;
	#redirOutBuffer;
	#subOutBuffer;
	#haveEOF;
	#awaitPipeInCb;
	constructor(){
	}
	initPipeInBuffer(){
		this.#haveEOF = false;
		this.#pipeInBuffer = [];
	}
	initRedirInBuffer(buf){
if (!isArr(buf)){
log(buf);
DIE(`Unknown value as arg to initRedirInBuffer (see above)`);
}
		this.#redirInBuffer = buf;
	}
	initRedirOutBuffer(arg){
		this.#redirOut = arg;
		this.#redirOutBuffer = [];
		this.haveRedirOut = true;
	}
	initSubOutBuffer(arg){
		this.#subOutBuffer = [];
		this.haveSubOut = true;
	}
	writeOutRedir(){return this.#redirOut.write(this.term, this.#redirOutBuffer, this.env);}
	out(val, opts={}){//«
		if (this.shell.cancelled) return;
		if (this.haveRedirOut){
			if (isStr(val)) {
				this.#redirOutBuffer.push(...val.split("\n"));
			}
			else if (isEOF(val)){
				if (this.nextCom){
					this.nextCom.pipeIn(val);
				}
			}
			else{
log(val);
DIE(`Unknown value in the redirect output stream (above)`);
			}
		}
		else if (this.nextCom){
			this.nextCom.pipeIn(val);
		}
		else if(this.parentCom){
//We are in a compound command's (i.e. our parent's) scope, at the end of a pipeline with no output redirects
			this.parentCom.out(val);
		}
else if (this.subLines){
//else if (this.haveSubOut){
//log("SUBLINES", this.#subOutBuffer);
//log("SUBLINES", this.subLines);
	if (isStr(val)) {
		this.subLines.push(...val.split("\n"));
	}
	else if (isEOF(val)){}
	else{
log(val);
DIE(`Unknown value in the com sub output stream (above)`);
	}
}
		else {
			this.resp(val, opts);
		}
	}//»
async readStdinChunk(){//«

if (this.#redirInBuffer){
	if (!this.#redirInBuffer.length) return EOF;
	return this.#redirInBuffer.shift();
}
else if (this.#pipeInBuffer){
	if (this.#pipeInBuffer.length){
		return this.#pipeInBuffer.shift();
	}
	else if (this.#haveEOF){
		return EOF;
	}
	else{
		return new Promise((Y,N)=>{
			this.#awaitPipeInCb = Y;
		});
	}
}
else if(this.parentCom){
// We are in a compound command's (i.e. our parent's) scope, at the start of a pipeline with no input redirects
	return this.parentCom.readStdinChunk();
}
else {

	return await this.readLine();

}

}//»
pipeIn(val){//«

	let useval = null;
	let have_cb = this.#awaitPipeInCb;
	if (isEOF(val)) {
		this.#haveEOF = true;
		if (!have_cb) return;
		useval = val;
	}
	else if (isStr(val)){
		this.#pipeInBuffer.push(...val.split("\n"));
		if (!have_cb) return;
		useval = this.#pipeInBuffer.shift();
	}
	else{
	cerr(`Unknown value in pipeIn (want String or EOF!)`);
	log(val);
	return;
	}

	if (have_cb){
		this.#awaitPipeInCb = undefined;
		have_cb(useval);
	}

}//»
	async readLine(use_prompt){//«
//XCJEKRNK
		let ln = await this.term.readLine(use_prompt);
		return ln;
	}//»
	resp(str, opts={}){//«
		if (this.shell.cancelled) return;
		const{term}=this;
		if (this.inBackground){
			if (opts.isErr){
				console.error(str);
			}
			else{
				console.log(str);
			}
			return;
		}
		opts.name = this.name;
		term.response(str, opts);
		term.scrollIntoView();
		term.refresh();
	}//»
/*
async #pipeBytesDone(){//«
	let blob = new Blob(this.#pipeInBuffer);
	let bytes = await util.toBytes(blob);
	this.pipeDone(bytes);
}//»
*/
}//»
class SimpleCommand extends BaseCommand{//«
//	#lines;
	constructor(name, args, opts, env, parentCom){//«
		super();
		if (!env) env = {};
//		this.#lines = [];
//		this.#haveEOF = false;
		this.isSimple = true;
		this.name =name;
		this.args=args;
		this.opts=opts;
		this.numErrors = 0;
		this.noPipe = false;
		this.parentCom = parentCom;
//log(this.name, this.parentCommand);
		for (let k in env) {
			this[k]=env[k];
		}
//log(this.outRedir);
//		if (this.outRedir&&this.outRedir.length){
//		if (this.outRedir){
//			this.redirLines = [];
//		}
		this.awaitEnd = new Promise((Y,N)=>{//«
			this.end = (rv)=>{
				Y(rv);
				this.killed = true;
			};
			this.ok=(mess)=>{
				if (mess) this.suc(mess);
				this.out(EOF);
				Y(E_SUC);
				this.killed = true;
			};
			this.no=(mess)=>{
				if (mess) {
//					if (!this.doNotAddCom) mess = `${this.name}: ${mess}`;
					this.err(mess);
				}
				if (this.inpipe) this.out(EOF);
				Y(E_ERR);
				this.killed = true;
			};
			this.nok=(mess)=>{
				this.numErrors?this.no(mess):this.ok(mess);
			};
		});//»
	}//»
	async nextArgAsNode(opts={}){//«
		let {noErr, noneIsErr} = opts;
		let e, f, node;
		f = this.args.shift();
		if (!f) {
			if (noneIsErr) e = `there are no args left`;
			else return null;
		}
		else{
			node = await f.toNode(this.term);
			if (node) return node;
			e = `${f}: not found`;
		}
		if (!noErr) {
			this.err(e);
			this.numErrors++;
		}
		return new Error(e);
	}//»
	async nextArgAsFile(opts={}){//«
		let file = await this.nextArgAsNode(opts);
		if (!isNode(file) || file.isFile) return file;
		let e = `${file.name}: not a regular file`;
		if (!opts.noErr) {
			this.err(e);
			this.numErrors++;
		}
		return new Error(e);
	}//»
	async nextArgAsDir(opts={}){//«
		let dir = await this.nextArgAsNode(opts);
		if (!isNode(dir) || dir.isDir) return dir;
		let e = `${dir.name}: not a directory`;
		if (!opts.noErr) {
			this.err(e);
			this.numErrors++;
		}
		return new Error(e);
	}//»
	async nextArgAsText(opts={}){//«
		let {noErr, noneIsErr, asStr} = opts;
		let f = await this.nextArgAsFile(opts);
		if (!isFile(f)) return f;
		let str = await f.text;
		if (!isStr(str)) {
			let e = `${f.name}: unknown value returned from 'node.text'`;
			if (!noErr) {
				this.err(e);
				this.numErrors++;
			}
			return e;
		}
		if (asStr) return str;
		return str.split("\n");;
	}//»
	get noStdin(){return(!(this.pipeFrom || this.stdin));}
	get noArgs(){return(this.args.length===0);}
	isTermOut(){return !(this.nextCom || this.scriptOut || this.subLines);}
	expectArgs(num){//«
		if (!isNum(num)) {
			this.err(`invalid argument given to expectArgs (see console)`);
			this.numErrors++;
cwarn("Here is the non-numerical value below");
log(num);
			return;
		}
		let nargs = this.args.length;
		if (nargs != num){
			this.err(`expected ${num} arguments (got ${nargs})`);
			this.numErrors++;
			return;
		}
		return true;
	}//»
	maybeSetNoPipe(){if(this.args.length || this.stdin)this.noPipe=true;}
	noInputOrArgs(opts={}){//«
//		let have_none = !(this.args.length || this.pipeFrom || this.stdin);
		let have_none = !(this.args.length || this.pipeFrom || this.stdinLns);
		if (have_none && !opts.noErr){
			this.err("no args or input received");
			this.numErrors++;
		}
		return have_none;
	}//»
	eof(){this.out(EOF);}
	init(){}
	run(){this.wrn(`sh:\x20${this.name}:\x20the 'run' method has not been overriden!`);}
	err(str, opts={}){//«
		opts.isErr=true;
		if (str.match(/^sh: /)) this.resp(str, opts);
		else this.resp(`${this.name}: ${str}`, opts);
	}//»
	suc(str, opts={}){//«
		opts.isSuc=true;
		this.resp(`${this.name}: ${str}`, opts);
	}//»
	wrn(str, opts={}){//«
		opts.isWrn=true;
		this.resp(`${this.name}: ${str}`, opts);
	}//»
	inf(str, opts={}){//«
		opts.isInf=true;
		this.resp(`${this.name}: ${str}`, opts);
	}//»
	cancel(){//«
		this.killed = true;
cwarn(`${this.name}: cancelled`);
	}//»
	checkStrOrTrue(val, fname, opts={}){//«
/*This is for function calls that return either:
1) true upon success
2) a string error message upon failure
*/
		if (val===true) return true;
		if (isStr(val)) {
			if (opts.noExit) this.err(val);
			else this.no(val);
			return false;
		}
cwarn("Here is the non-true value");
log(val);
		if (!fname) fname="?";
		let mess = `non-true value returned from '${fname}' (see console)`;
		if (opts.noExit) this.err(mess);
		else this.no(mess);
		return false;
	}//»
//XVEOIP
	fmtColLn(ln, ind, len, col){//«
/*This takes as arguments:
1) An unformatted line, which may take up many lines upon being output to the terminal
2) An index into the line where the color value begins
3) The length (number of chars) that the color spans
4) The color to use

This is used by grep to indicate the matched substring of a line that might possibly
be wrapped when output onto the terminal
*/
		let to_ind = ind+len;
		let lnarr = this.term.fmt(ln);
		let cols=[];
		let did_chars = 0;
		let got_start;
		let got_end;
//		let use_col = "#f99";
		for (let i=0; i < lnarr.length; i++){
			let ln = lnarr[i];
			let lnlen = ln.length;
			if (!got_start) {
				if (ind >= did_chars && ind < did_chars+lnlen){
					got_start = true;
					let from = ind-did_chars;
					if (to_ind < did_chars+lnlen){
						got_end = true;
						cols.push({[from]: [len, col]});
					}
					else{
						cols.push({[from]: [to_ind-from, col]});
					}
				}
			}
			else if (!got_end){
				if (to_ind < did_chars+lnlen){
					got_end = true;
					cols.push({0: [to_ind-did_chars, col]});
				}
				else{
					cols.push({0: [lnlen, col]});
				}
			}
			else{
				cols.push({});
			}
			did_chars += ln.length;
		}
		return {lines: lnarr, colors: cols};
	}//»
}
//»
const NoCom=class{//«
	constructor(env){
		for (let k in env) {
			this[k]=env[k];
		}
//		if (this.outRedir){
//			this.redirLines = [];
//		}
	}
	init(){
		this.awaitEnd=new Promise((Y,N)=>{
			this.ok=()=>{
				if (this.pipeTo) this.out(EOF);
				Y(E_SUC);
			}
		});
	}
	run(){
		this.ok();
	}
	cancel(){}
}//»
class ErrCom extends SimpleCommand{//«
	run(){
		this.no(this.errorMessage);
	}
}//»

//«Compounds

class CompoundCom extends BaseCommand{//«

constructor(shell, opts){//«
	super();
	this.isCompound = true;
	this.shell = shell;
	this.term = shell.term;
	this.opts=opts;
	this.outRedir = opts.outRedir;
	this.awaitEnd = new Promise((Y,N)=>{
		this.end = (rv)=>{
			if (this.nextCom) {
				this.nextCom.pipeIn(EOF);
			}
			Y(rv);
			this.killed = true;
		};
	});
}//»
//EJKFKJ
_init(){//«
	let opts={};
	for (let k in this.opts){
		opts[k]=this.opts[k];
	}
	this.opts = opts;
}//»
init(){this._init();}
cancel(){this.killed=true;}
/*
pipeIn(val){
cwarn(`COMPOUND COM DROPPING PIPED INPUT`);
log(val);
}
*/
}//»

class BraceGroupCom extends CompoundCom{//«

constructor(shell, opts, list, parentCommand){//«
	super(shell, opts);
	this.list = list;
	this.name="brace_group";
this.parentCommand = parentCommand;
}//»
async run(){//«
	if (this.isFunc){
		this.opts.scriptArgs = this.args.slice();
		this.opts.scriptName = "sh";
	}
	let rv = await this.shell.executeStatements(this.list, this.opts, this);
	if (this.shell.cancelled) return;
	this.end(rv);
}//»

}//»
class SubshellCom extends CompoundCom{//«
constructor(shell, opts, list, parentCommand){
	super(shell, opts);
	this.list = list;
	this.name="subshell";
this.parentCommand = parentCommand;
}
async run(){
	if (this.isFunc){
		this.opts.scriptArgs = this.args.slice();
		this.opts.scriptName = "sh";
	}
	let opts = sdup(this.opts);
	opts.env = sdup(this.opts.env);
	let rv = await this.shell.executeStatements(this.list, opts, this);
	if (this.isScript && isObj(rv) && rv.abortScript === true){
		rv = E_ERR;
	}
	if (this.shell.cancelled) return;
	this.end(rv);
}
}//»

class WhileCom extends CompoundCom{//«

constructor(shell, opts, cond, do_group, parentCommand){//«
	super(shell, opts);
	if (this.opts.loopNum) this.opts.loopNum++;
	else this.opts.loopNum = 1;
	this.cond = cond;
	this.do_group = do_group;
	this.name = "while";
this.parentCommand = parentCommand;
}//»
async run(){//«
	let rv;
	while (true){
		await sleep(0);
		rv = await this.shell.executeStatements(dup(this.cond), this.opts, this);
		if (this.shell.cancelled) return;
		if (rv === E_SUC){
//log("Keep going");
		}
		else if (Number.isFinite(rv)){
//log("DONE", rv);
			break;
		}
		else{
cerr("WHAT IS THIS RV");
log(rv);
		}
		rv = await this.shell.executeStatements(dup(this.do_group), this.opts, this);
		if (this.shell.cancelled) return;
		if (isLoopCont(rv)){
			if (doLoopCont(rv, this)){
				continue;
			}
			else{
				rv = {continue: rv.continue - 1};
				break;
			}
		}
		if (isLoopBreak(rv)){
			if (doLoopBreak(rv, this)){
				rv = E_SUC;
				break;
			}
			else{
				rv = {break: rv.break - 1, abortScript: rv.abortScript};
			break;
			}
		}
//		await sleep(0);
	}
//	if (this.nextCom && this.nextCom.pipeIn) this.nextCom.pipeIn(EOF);
	if (this.nextCom) this.nextCom._pipeIn(EOF);
	this.end(rv);
}//»

}//»
class UntilCom extends CompoundCom{//«

constructor(shell, opts, cond, do_group, parentCommand){//«
	super(shell, opts);
	if (this.opts.loopNum) this.opts.loopNum++;
	else this.opts.loopNum = 1;
	this.cond = cond;
	this.do_group = do_group;
	this.name="until";
this.parentCommand = parentCommand;
}//»
async run(){//«
	let rv;
	while (true){
		rv = await this.shell.executeStatements(dup(this.cond), this.opts, this);
		if (this.shell.cancelled) return;
		await sleep(0);
		if (Number.isFinite(rv)){
			if (rv === E_SUC){
				break;
			}
		}
		else{
cerr("WHAT IS THIS RV");
log(rv);
		}
		rv = await this.shell.executeStatements(dup(this.do_group), this.opts, this);
		if (this.shell.cancelled) return;
		if (isLoopCont(rv)){
			if (doLoopCont(rv, this)){
				continue;
			}
			else{
				rv = {continue: rv.continue - 1};
				break;
			}
		}
		if (isLoopBreak(rv)){
			if (doLoopBreak(rv, this)){
				rv = E_SUC;
				break;
			}
			else{
//				rv = {break: rv.break - 1};
				rv = {break: rv.break - 1, abortScript: rv.abortScript};
				break;
			}
		}
		await sleep(0);
	}
//	if (this.nextCom && this.nextCom.pipeIn) this.nextCom.pipeIn(EOF);
	if (this.nextCom) this.nextCom._pipeIn(EOF);
	this.end(rv);
}//»


async run(){//«
	let rv = await this.shell.executeStatements(dup(this.cond), this.opts, this);
	if (this.shell.cancelled) return;
	while (rv){
		await this.shell.executeStatements(dup(this.do_group), this.opts, this);
		if (this.shell.cancelled) return;
		await sleep(0);
		rv = await this.shell.executeStatements(dup(this.cond), this.opts, this);
		if (this.shell.cancelled) return;
		await sleep(0);
	}
//	if (this.nextCom && this.nextCom.pipeIn) this.nextCom.pipeIn(EOF);
	if (this.nextCom) this.nextCom._pipeIn(EOF);
	this.end(rv);
}//»

}//»

class IfCom extends CompoundCom{//«
constructor(shell, opts, conds, conseqs, fallback, parentCommand){//«
	super(shell, opts);
	this.conds = conds;
	this.conseqs = conseqs
	this.fallback = fallback;
	this.name = "if";
this.parentCommand = parentCommand;
}//»
async run(){//«
	const{conds, conseqs, opts}=this;
	for (let i=0; i < conds.length; i++){
		let rv = await this.shell.executeStatements(conds[i], opts, this);
		if (this.shell.cancelled) return;
if (!Number.isFinite(rv)){
cwarn("HERE IT IS");
log(rv);
this.shell.fatal("Non-numerical return value");
}
		if (!rv){
			rv = await this.shell.executeStatements(conseqs[i], opts, this);
			if (this.shell.cancelled) return;
			this.end(rv);
			return;
		}
	}
	if (this.fallback){
		let rv = await this.shell.executeStatements(this.fallback, opts, this);
		if (this.shell.cancelled) return;
		return this.end(rv);
	}
	this.end(E_ERR);
}//»
}//»
class ForCom extends CompoundCom{//«

constructor(shell, opts, name, in_list, do_group, parentCommand){//«
	super(shell, opts);
	if (this.opts.loopNum) this.opts.loopNum++;
	else this.opts.loopNum = 1;
	this.var_name=name;
	this.in_list=in_list;
	this.do_group=do_group;
	this.name="for";
this.parentCommand = parentCommand;
}//»
async init(){//«
	this._init();
	this.in_list = await this.shell.allExpansions(this.in_list, this.opts);
	if (this.shell.cancelled) return;
}//»
async run(){//«
	const{shell}=this;
	let env = this.opts.env;
	let nm = this.var_name+"";
	let rv;
	for (let val of this.in_list){
		await sleep(0);
		env[nm] = val+"";
		rv = await shell.executeStatements(dup(this.do_group), this.opts, this);
		if (shell.cancelled) return;
		if (isLoopCont(rv)){
			if (doLoopCont(rv, this)){
				continue;
			}
			else{
				this.end({continue: rv.continue-1});
				return;
			}
		}
		if (isLoopBreak(rv)){
			if (doLoopBreak(rv, this)){
//				rv = E_SUC;
				break;
			}
			else{
//				rv = {break: rv.break - 1, abortScript: rv.abortScript};
				this.end({break: rv.break - 1, abortScript: rv.abortScript});
				return;
//				break;
			}
		}

	}
//	this.out(EOF);
	this.end(E_SUC);
}//»

}//»
class FunctionCom extends CompoundCom{//«

constructor(shell, opts, name, com, parentCommand){//«
	super(shell, opts);
	this.name=name;
	this.com = com.compound_command.compound_list.term;
	this.type = com.type;
	this.redirs = com.redirs;
this.parentCommand = parentCommand;
}//»
async init(){//«
	this._init();
	let typ = this.type;
	let name = this.name
	const funcs = this.shell.term.funcs;
	let func;
	if (typ==="brace_group"){
		func = (shell, args, opts, com_env) => { 
			let com = new BraceGroupCom(shell, opts, dup(this.com));
			com.args = args;
			return com;
		}
	}
	else if (typ==="subshell"){
		func = (shell, args, opts, com_env) => { 
			let com = new SubshellCom(shell, opts, dup(this.com));
			com.args = args;
			return com;
		}
	}
	else{
		throw new Error(`MAKE WHAT TYPE OF FUNCTION (NOT BRACE OR SUBSHELL: <${typ}>)`);
	}
	funcs[name] = func;
}//»
run(){//«
//As commands themselves, function definitions don't do much of anything, e.g.:
//echo blah blah blah | 
	this.end(E_SUC);
}//»

}//»
class CaseCom extends CompoundCom{//«
constructor(shell, opts, word, list, parentCommand){//«
super(shell, opts);
this.word=word;
this.list=list;
this.name="case";
this.parentCommand = parentCommand;
}//»
async init(){//«
	this._init();
	this.word.tildeExpansion();
//AKDMFLS
//	this.word.parameterExpansion(this.opts.env, this.opts.scriptName, this.opts.scriptArgs);
//AKDKRKSJ
	await this.word.expandSubs(this.shell, this.shell.term);
	if(this.shell.cancelled) return;
	this.word.quoteRemoval();
	this.word = this.word.fields.join("")
}//»
async run(){//«
/*«
For everything, do:

expansions to do:
1) Tilde
	tok.tildeExpansion();
2) Param
	let rv = tok.parameterExpansion(env, scriptName, scriptArgs);
3) Com Sub/Math
	await tok.expandSubs(this, term);
4) Quote Removal
	tok.quoteRemoval();

For every word in every


Pattern matching: 
?: any char
*: multiple chars
[...]: list of chars


re.test(word);

»*/
const{word, shell}=this;
let rv;
let did_match=false;
LOOP: for (let obj of this.list){
	let item = obj.case_item;
	let end = item.end;
	if (did_match){
		rv = await shell.executeStatements(item.compound_list, this.opts, this);
		if(shell.cancelled) return;
		if (end.isSemiAnd) continue LOOP;
		break LOOP;
	}
	let pat_list = item.pattern_list;
	for (let wrd of pat_list){
		wrd.tildeExpansion();
//DJSLPEKS
//		wrd.parameterExpansion(this.opts.env, this.opts.scriptName, this.opts.scriptArgs);
		await wrd.expandSubs(shell, shell.term, this.opts);
		if(shell.cancelled) return;
		wrd.quoteRemoval();
		let arr = wrd.fields.join("").split("");
		let patstr='';
		for (let ch of arr){//«
			if (ch==="."){
				patstr+='\\.';
			}
			else if (ch==="*"){
				patstr+='.*';
			}
			else if (ch==="?"){
				patstr+='.';
			}
			else {
				patstr+=ch.toString();
			}
		}//»
		const re = new RegExp("^" + patstr + "$");
		if (re.test(word)){
			did_match = true;
			rv = await this.shell.executeStatements(item.compound_list, this.opts, this);
			if(shell.cancelled) return;
			if (end.isSemiAnd) continue LOOP;
			break LOOP;
		}
	}
}
if (!did_match) this.end(E_ERR);
else {
	this.end(rv);
}

}//»
}//»

//»

//this.comClasses={Com,ScriptCom,NoCom,ErrCom};
this.comClasses={SimpleCommand,NoCom,ErrCom};

//»

//Builtins    (ls, cd, echo, etc...)«
{
/*«
const com_ = class extends Com{
init(){
}
run(){
}
}
»*/

//BUILTINS
/*
continue's and break's *ALWAYS* break the "circuitry" of the logic lists.
*/
/*
const com_devtest = class extends Com{//«

static getOpts(){
//Option values
//1: no arguments
//2: optional arguments
//3: required argument
	return {
		"long": {"longa": 1, "longb": 2, "longc": 3},
		"short": {"a": 1, "b": 2, "c": 3}
	}
}
async init(){
//Initialiation: option validation or resource loading may go here
}
async run(){
	const{args, opts, term} = this;

// args: e.g. [ "arg1", "arg2", ... , "argn" ]
// opts: e.g. {a: true, longb: "hello world", c: 42}
// term: a handle to the terminal object with many members

this.wrn("Warnings are printed to the terminal in yellow");
this.inf("Info messages are printed in blue");
this.err("Errors are printed in red");
this.suc("This is printed in green"); 

this.out("This gets sent to pipes, command substitutions or stdout");

//	The following methods end the command by internally resolving a promise
//	this.end(123);//Allows for arbitrary error codes to be returned

//	The following are convenience functions which can be called with an optional string to be printed to the terminal
	this.ok();//This returns a success code and any string arg printed to the terminal in green
//	this.no();//This returns the standard error code (1) and any string is printed in red
//	this.nok();//This calls this.ok() or this.no() depending on whether this.numErrors > 0

}
}//»
const com_devtest = class extends Com{//«
init(){
}
run(){

//Object.getOwnPropertyNames(LOTW.apps["dev.Poker"].prototype)
//getters:
//
//curPlayer
//curType
//curPlayerNum
//
//keep:
//
//resetBetStates
//startGame
//playerAction
//nextPlayer
//nextPhase
//automatedAction
//newHand
//endHand
//initPlayers
//initGameState
//resetGameState
//onappinit
//onkeydown

let getters=[
"curPlayer",
"curType",
"curPlayerNum",
];
let keep = [
"nextPlayer",
"nextPhase",
"newHand",
"endHand",
"initGameState",
"initPlayers",
"startGame",
"onkill",
"onappinit",
"onkeydown",
];
let proto = LOTW.apps["dev.Poker"].prototype;
let names = Object.getOwnPropertyNames(proto);
let s = "class PokerApp {\n";
for (let nm of names){
	if (keep.includes(nm)){
		s += (proto[nm]).toString().replace(/\/\/[\xab\xbb]/g, "")+"\n";
	}
	else{
		if (getters.includes(nm)){
			s += `get ${nm}(){}\n`;
		}
		else {
			s += `${nm}(){}\n`;
		}
	}
}
s+="}";

this.out(s);
//log(s);
this.ok();
}
}
//»
*/

const Com = SimpleCommand;

const com_devtest = class extends Com{
init(){
}
async run(){
this.ok("DEVTEST");
}
}

const com_pipe = class extends Com{//«
	async run() {//«
		let prepend = this.args.length ? this.args.join(" ") : "";
		let rv;
		while (true){
			rv = await this.readStdinChunk();
			if (isEOF(rv)){
				return this.ok();
			}
			this.out(`${prepend}${rv}`);
		}
	}//»
};//»
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
/*
pipeIn(val){//Commented out
	if (!isEOF(val)) this.openWin(val);
	else this.ok();
}
*/

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
const com_wget = class extends Com{//«
/*How github names their files within repos, and how to fetch them from LOTW«

If this is the github repo:
https://github.com/mrdoob/three.js/

The 'playground/' subdir of that repo is here:
https://github.com/mrdoob/three.js/tree/dev/playground

This is the 'playground/index.html' file:
https://github.com/mrdoob/three.js/blob/dev/playground/index.html

This is that same file in its raw form, but it is an invalid fetch:
https://github.com/mrdoob/three.js/raw/refs/heads/dev/playground/index.html

And this is the same file that is okay to fetch:
https://raw.githubusercontent.com/mrdoob/three.js/refs/heads/dev/playground/index.html

This gets the entire directory structure (but the output is sent to the console as Uint8Array, 
rather than text, since there is no indication in the URL that the returned value is JSON):
https://api.github.com/repos/mrdoob/three.js/git/trees/refs/heads/dev?recursive=true

»*/
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
const com_loopctrl = class extends Com{//«
//	static opts = true;
	static getOpts(){
		return true;
	}
//	#loopCnt;
//	#doBreakInf;
	constructor(...args){
		super(...args);
		this.isLoopCtrl = true;
	}
	init(){//«
		if (!this.loopNum){
			this.no(`only meaningful in a 'for', 'while', or 'until' loop`);
			return;
		}
//		if (this.args.length > 1){
//			this.no("too many arguments");
//			return;
//		}
		let num = this.args[0];
		if (num){
			if (!num.match(/^-?[0-9]+$/)){
/*
Abort the command line, command sub or script that we are in.
*/
//				this.err(`${this.name}: ${num}: numeric argument required`);
				this.err(`${num}: numeric argument required`);
//				this.end({abortScript: true});
				this.end({break: Infinity, abortScript: true});
				return;
			}
			if (parseInt(num) < 1) {
//This breaks of all loops, so we do this.end({break: Infinity});
//				this.err(`${this.name}: ${num}: loop count out of range`);
				this.err(`${num}: loop count out of range`);
				this.doBreakInf = true;
				return;
			}
			this.loopCnt = parseInt(num);
		}
		else this.loopCnt = 1;
		if (this.args[1]){
//			this.err(`${this.name}: too many arguments`);
			this.err(`too many arguments`);
			this.doBreakInf = true;
		}
	}//»
	run(){
		if (this.doBreakInf) {
			this.end({break: Infinity});
		}
		else if (this.name==="continue") this.end({continue: this.loopCnt});
		else this.end({break: this.loopCnt});
	}
}//»
const com_continue = class extends Com{//«
//	#loopCnt;
	constructor(...args){
		super(...args);
		this.isLoopCtrl = true;
	}
	init(){//«
		if (!this.loopNum){
			this.no(`only meaningful in a 'for', 'while', or 'until' loop`);
			return;
		}
		if (this.args.length > 1){
			this.no("too many arguments");
			return;
		}
		let num = this.args[0];
		if (num){
			if (!num.match(/^-?[0-9]+$/)){
				this.no(`${num}: numeric argument required`);
				return;
			}
			if (parseInt(num) < 1) {
				this.no(`${num}: loop count out of range`);
				return;
			}
			this.loopCnt = parseInt(num);
		}
		else this.loopCnt = 1;
	}//»
	run(){
		this.end({continue: this.loopCnt});
	}
}//»
const com_break = class extends Com{//«
//	#loopCnt;
	constructor(...args){
		super(...args);
		this.isLoopCtrl = true;
	}
	init(){//«
		if (!this.loopNum){
			this.no(`only meaningful in a 'for', 'while', or 'until' loop`);
			return;
		}
		if (this.args.length > 1){
			this.no("too many arguments");
			return;
		}
		let num = this.args[0];
		if (num){
			if (!num.match(/^-?[0-9]+$/)){
				this.no(`${num}: numeric argument required`);
				return;
			}
			if (parseInt(num) < 1) {
				this.no(`${num}: loop count out of range`);
				return;
			}
			this.loopCnt = parseInt(num);
		}
		else this.loopCnt = 1;
	}//»
	run(){
		this.end({break: this.loopCnt});
	}
}//»

const com_shift = class extends Com{//«
	run(){
		if (!this.scriptArgs) {
			return this.no("no scriptArgs!");
		}
		this.scriptArgs.shift();
		this.ok();
	}
}//»
const com_brackettest = class extends Com{//«
init(){
	if (!this.args.length || this.args.pop() !=="]") return this.no("missing ']'");
}
async run(){
//	let rv = await ShellMod.util.evalShellExpr(this.args, this.term.cwd);
//cwarn(this.args);
	let rv = await eval_shell_expr(this.args, this.term.cwd);
	if (isStr(rv)) return this.no(rv);
//log(rv);
	this.end(rv);
}
}//»
const com_test = class extends Com{//«
init(){}
async run(){
//	let rv = await ShellMod.util.evalShellExpr(this.args, this.term.cwd);
	let rv = await eval_shell_expr(this.args, this.term.cwd);
	if (isStr(rv)) return this.no(rv);
	this.end(rv);
}
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
const com_log = class extends Com{//«

//#promise;
//static grabsScreen = true;
async init(){//«
	if (this.term.actor) {
		return this.no(`the screen is already grabbed by: '${this.term.actor.comName}'`);
	}
	if (!await util.loadMod("term.log")) {
		this.no("could not load the 'log' module");
		return;
	}
	let log = new NS.mods["term.log"](this.term);
	this.log = log;
	this.promise = log.init({opts: this.opts, command_str: this.command_str});
}//»
async run(){//«
	await this.promise;
	this.ok();
}//»
cancel(){
this.log.quit();
this.ok();
}
}//»
const com_bindwin = class extends Com{//«
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
const com_echo = class extends Com{//«
	static getOpts(){
		return {s: {n: 1}};
	}
	async run(){
		let nl = this.opts.n ? "":"\n";
		let str = new String(this.args.join(" ")+nl);
		str.noChomp = true;
		this.out(str);
		this.ok();
	}
}//»
const com_echodelay = class extends Com{//«
//	echodelay:{s:{d: 3}},
	static getOpts(){
//		return true;
		return {s: {d: 3}};
	}
//	static opts = {s: {d: 3}};
	async run(){
		let delay;
		if (this.opts.d) {
			delay = parseInt(this.opts.d);
			if (isNaN(delay)) {
				delay = 1;
				this.wrn(`invalid delay value (using 1 ms)`);
			}
//			else if (!delay) delay = 1;
		}
		else delay = 1;
		for (let arg of this.args){
			this.out(arg);
			await sleep(delay);
		}
		this.ok();
	}

}//»
const com_ls = class extends Com{//«
static getOpts(){
	return {//«
		s: {
			a: 1,
//			l: 1,
//			r: 1,
			R: 1,
			f: 1
		},
		l: {
//			long: 1,
			all: 1,
			force: 1,
			recursive: 1
		}
	}//»
}
init(){//«
	let {opts, args}=this;
	if (!args.length) args.push("./");
	this.optAll = opts.all||opts.a;
	this.optRecur = opts.recursive || opts.R;
}//»
async run(){//«
//	const{badLinkType, linkType, idbDataType, dirType}=ShellMod.var;
	const{pipeTo, isSub, term, args, opts} = this;
	const out=(...args)=>{
		this.out(...args);
	};
	const err=(...args)=>{
		this.err(...args);
	};
	let is_term = this.isTermOut();
	let nargs = args.length;
	let dir_was_last = false;
	let all = this.optAll;
	let recur = this.optRecur;
	let force = opts.force || opts.f;
	const do_path = async(node_or_path)=>{//«
		let node;
		let wants_dir;
		let path;
		let regpath;
		if (isStr(node_or_path)){
			path = node_or_path;
			wants_dir = node_or_path.match(/\x2f$/);
			regpath = normPath(node_or_path, term.cur_dir);
			node = await fsapi.pathToNode(regpath, !wants_dir);
		}
		else {
			node = node_or_path;
			regpath = path = node.fullpath;
		}
		let recur_dirs;
		if (recur) recur_dirs = [];
		if (!node) {
			dir_was_last = false;
			err(`${regpath}: no such file or directory`);
			return;
		}
		if (node.appName !== FOLDER_APP) {
			if (wants_dir) {
				err(`${regpath}: not a directory`);
				return;
			}
			if (dir_was_last) out("");
			dir_was_last = false;
			if (node.appName==LINK_APP){
				out(`${node.name} -> ${node.symLink}`);
				return;
			}
			let sz = "?";
			if (node.type === FS_TYPE) {
				let file = await node._file;
				if (file) sz = file.size;
			}
			else if (Number.isFinite(node.size)) sz = node.size;
			out(`${node.name} ${sz}`);
			return;
		}
		if (force || !node.done) await fsapi.popDir(node);
		dir_was_last = true;
		let kids = node.kids;
		let arr = Object.keys(kids);//let arr = kids._keys;
		let names=[];
		let lens = [];
		let types = [];
		if (out.length && nargs > 1 || recur) out("");
		if (nargs > 1 || recur) out(`${path}:`);
		let s = "";
		let dir_arr = [];
		for (let nm of arr){
			if (!all) {
				if (nm=="."||nm=="..") continue;
				if (nm.match(/^\./)) continue;
			}
			dir_arr.push(nm);
		}
		if (recur){
			for (let nm of dir_arr){
				let n = kids[nm];
				if (nm=="."||nm=="..") continue;
				if (n.appName === FOLDER_APP) recur_dirs.push(n);
			}
		}
		dir_arr = dir_arr.sort();
		if (is_term) {//«
			for (let nm of dir_arr){
				let n = kids[nm];
				if (nm.match(/\x20/)){
					nm=`'${nm}'`;
				}
				if (n.appName===FOLDER_APP) {
//					types.push(dirType);
					types.push(DIR_TYPE);
				}
				else if (n.appName==="Link") {
//					if (!await n.ref) types.push(badLinkType);
					if (!await n.ref) types.push(BAD_LINK_TYPE);
//					else types.push(linkType);
					else types.push(LINK_TYPE);
				}
//				else if (n.blobId === idbDataType) types.push(idbDataType);
				else if (n.blobId === IDB_DATA_TYPE) types.push(IDB_DATA_TYPE);
				else types.push(null);
			}
			let name_lens = [];
			let colors = [];
			for (let nm of dir_arr) name_lens.push(nm.length);
			let ret = [];
			term.fmtLs(dir_arr, name_lens, ret, types, colors);
			if (!ret.length) out("");
			else {
				if (colors.length) out(ret.join("\n"), {colors, didFmt: true});
				else out(ret.join("\n"), {didFmt: true});
			}
		}//»
		else {
			out(dir_arr.join("\n"));
		}
		if (recur) {
			for (let dir of recur_dirs) await do_path(dir);
		}
	};//»
	while (args.length) {
		await do_path(args.shift());
	}
	this.ok();
}//»

}//»
const com_env = class extends Com{//«
run(){
	let {term, args}=this; 
	if (args.length) {
		return this.no("arguments are not supported");
	}
	let env = this.env;
	let keys = Object.keys(env);//let keys = env._keys;
	let out = [];
	for (let key of keys){
		let val = env[key];
		out.push(`${key}=${val}`);
	}
	this.out(out.join("\n"));
	this.ok();
}
}//»
const com_parse = class extends Com{//«
	async run(){
		if (this.pipeFrom) return;
		let f;
		while (f = this.args.shift()){
			let node = await f.toNode(this.term);
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
	pipeDone(lines){
		this.tryParse(lines.join(""));
		this.ok();
	}
/*
	pipeIn(val){//Commented out
		if (!isEOF(val)) this.tryParse(val);
		else this.ok();
	}
*/
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
	pipeDone(lines){
		this.tryStringify(lines.join(""));
		this.numErrors?this.no():this.ok();
	}
/*
	pipeIn(val){//Commented out
		if (!isEOF(val)) this.tryStringify(val);
		else {
			this.numErrors?this.no():this.ok();
			this.ok();
		}
	}
*/
}//»
const com_clear = class extends Com{//«
	run(){
		this.term.clear();
		this.ok();
	}
}//»
const com_colon = class extends Com{//«
	run(){
		this.ok();
	}
}//»
const com_true = class extends Com{//«
	run(){
		let mess;
		if (this.args.length) mess = this.args.join(" ");
		else mess = "I'm true";
		this.ok(mess);
	}
}//»
const com_false = class extends Com{//«
	run(){
		let mess;
		if (this.args.length) mess = this.args.join(" ");
		else mess = "I'm false";
		this.no(mess);
	}
}//»
const com_cd = class extends Com{//«
init(){
	if (!this.args.length) {
		this.args.push(this.term.getHomedir());
	}
}
async run(){
	let {args, term} = this;
	if (args.length > 1) return this.no("too many arguments");
	let res;
	let got_dir;
	let saypath = args[0];
	let regpath = normPath(saypath, term.cur_dir);
	let ret = await fsapi.pathToNode(regpath);
	if (!ret) return this.no(`${saypath}: no such file or directory`);
	if (ret.appName != FOLDER_APP) return this.no(`${saypath}: not a directory`);
	got_dir = regpath;
	if (!got_dir.match(/^\x2f/)) got_dir = `/${got_dir}`;
	term.cur_dir = got_dir;
	term.cwd = got_dir;
	this.ok();
}
}
//»
const com_app = class extends Com{//«

async run(){
	const{args, out, term}=this;
//	let list = await util.getList("/site/apps/");
/*
	if (!args.length) {
		if (!list){
			return this.no("could not get the app list");
		}
		out(list.join("\n"));
		return this.ok();
	}
*/
	let have_error=false;
	for (let appname of args){
//		if (list && !list.includes(appname)) {
//			this.err(`${appname}: not found`);
//			continue;
//		}
		let win = await Desk.api.openApp(appname);
		if (!win) this.err(`${appname}: not found`);
	}
	have_error?this.no():this.ok();
}

}//»

const com_msleep = class extends Com{//«
	async run(){
		let ms = parseInt(this.args.shift());
		if (!Number.isFinite(ms)) ms = 0;
		await sleep(ms);
		this.ok();
	}
}//»
const com_hist = class extends Com{//«
	async run(){
		this.out((await this.term.getHistory()).join("\n"));
		this.ok();
	}
}//»
const com_pwd = class extends Com{//«
	run(){
		this.out(this.term.cur_dir);
		this.ok();
	}
}//»
const com_libs = class extends Com{//«
	async run(){
		this.out((await util.getList("/site/coms/")).join("\n"));
		this.ok();
	}
}//»
const com_lib = class extends Com{//«
init(){
	if (!this.args.length) return this.no("no lib given");
	if (this.args.length > 1) return this.no("too many arguments");
}
async run(){
	if (this.killed) return;
	let lib = this.args.shift();
	let hold = lib;
	let got = globals.ShellMod.allLibs[lib] || NS.coms[lib];
	if (got){
		if (!isArr(got)) got = Object.keys(got);
		this.out(got.join("\n"));
		return this.ok();
	}
	let orig = lib;
	lib = lib.replace(/\./g,"/");
	let path = `/coms/${lib}.js`;
	try{
		const coms = (await import(path)).coms;
		NS.coms[orig] = coms;
		this.out((Object.keys(coms)).join("\n"));
		this.ok();
	}catch(e){
cerr(e);
		this.no(`the library: '${hold}' could not be loaded!`);
	}

}
}//»
const com_open = class extends Com{//«
init(){
	if (!this.args.length) {
		this.no(`missing operand`);
	}
}
async run(){
	const{term, err:_err}=this;
	let have_error = false;
	const err=mess=>{
		have_error = true;
		_err(mess);
	};
	for (let path of this.args) {
		let fullpath = normPath(path, term.cur_dir);
		let node = await fsapi.pathToNode(fullpath);
		if (!node) {
			err(`${path}: no such file or directory`);
			continue;
		}
		let win = await Desk.open_file_by_path(node.fullpath);
		if (!win) err(`${path}: could not be opened`);
	}
	have_error?this.no():this.ok();
}
}//»
const com_epoch = class extends Com{//«
	run(){
		this.out(Math.round((new Date).getTime()/ 1000)+"");
		this.ok();
	}
}//»
const com_getch = class extends Com{//«

async run(){
	if (this.args.length) return this.no("not expecting arguments");
	let ch = await this.term.getch("");
	if (!ch) return this.no("no character returned");
	this.suc(`Got: ${ch} (code: ${ch.charCodeAt()})`);
	this.out(ch);
	this.ok();
}

}//»
const com_export = class extends Com{//«
	run(){
//		let rv = ShellMod.util.addToEnv(this.args, this.term.ENV, {if_export: true});
		let rv = add_to_env(this.args, this.term.ENV, {if_export: true});
		if (rv.length){
			this.err(rv.join("\n"));
			this.no();
		}
		else this.ok();
	}
}//»
const com_curcol = class extends Com{//«
	run(){
		let which = this.args.shift();
		if (which=="white"){
			this.term.cur_white();
			this.ok();
		}
		else if (which=="blue"){
			this.term.cur_blue();
			this.ok();
		}
		else{
			this.no(`missing or invalid arg`);
		}
	}
}//»
const com_read = class extends Com{//«
init(){
//log("HI READ", this);
}
async run(){//«
//XDUITOYL
	const {args, opts, term, stdin, stdinLns: stdin_lines} = this;
//cwarn("STDIN_LINES");
//log(stdin_lines);
	const ENV=this.env;
	let have_error = false;
	const err=mess=>{
		have_error = true;
		this.err(mess);
	};
	let use_prompt = opts.prompt;
	if (use_prompt && use_prompt.length > term.w - 3){
		this.no(`the prompt is too wide (have ${use_prompt.length}, max = ${term.w - 4})`);
		return;
	}
	let ln;
	if (stdin_lines){
		if (!stdin_lines.length) return this.no();
		ln = stdin_lines.shift();
	}
	else{
		ln = await this.readLine(use_prompt); // OEHRHFJR
	}
	if (isEOF(ln)){
		this.no();
		return;
	}
	let vals = ln.trim().split(/ +/);
	while (args.length){
		let arg = args.shift();
//		if (ShellMod.var.noSetEnvVars.includes(arg)) {
		if (NO_SET_ENV_VARS.includes(arg)) {
			err(`refusing to modify read-only variable: ${arg}`);
			vals.shift();
			continue;
		}
		let useval;
		if (!args.length) {
			if (vals.length) useval = vals.join(" ");
		}
		else useval = vals.shift();
		if (!useval) useval = "";
		ENV[arg] = useval;
	}
	have_error?this.no():this.ok();
}//»

}//»
const com_math = class extends Com{//«
//#lines;
//#math;
#usePipe;
async init(){
	if (!this.args.length && !this.pipeFrom) {
		return this.no("nothing to do");
	}
	this.#usePipe = !this.args.length;
	if (this.args.length)
//	if (!this.args.length){
//		this.lines=[];
//	}
/*math-expression-evaluator npm package/ github repo«

From: https://github.com/bugwheels94/math-expression-evaluator
Minimized code: https://github.com/bugwheels94/math-expression-evaluator/blob/master/dist/browser/math-expression-evaluator.min.js
1) At top of the file, put: 
	const exports={};
2) Then unfold first curly to make:
	!function(e,t){"object"==typeof exports...
...become:
	!function(e,t){
		exports.Mexp = t;
		"object"==typeof exports...
3) At bottom of the file, put:
	export const mod = new exports.Mexp();

»*/
	if (!await util.loadMod("util.math")) {
		return no("could not load the math module");
	}
    this.math = new NS.mods["util.math"]();
}
doMath(str){
	try{
		this.inf(`evaluating: '${str}'`);
		this.out(this.math.eval(str)+"");
		this.ok();
	}catch(e){
//cerr(e);
		this.no(e.message);
	}
}
run(){
//	if (this.killed || !this.args.length) return;
	if (this.killed || this.#usePipe) return;
	this.doMath(this.args.join(" "));
}
pipeDone(lines){
	if (!this.#usePipe) return;
	this.doMath(lines.join(" "));
}
/*
pipeIn(val){//Commented out
    if (!this.lines) return;
    if (isEOF(val)){
        this.out(val);
        this.doMath(this.lines.join(" "));
        return;
    }
    if (isStr(val)) this.lines.push(val);
    else if (isArr(val)) this.lines.push(...val);
    else{
cwarn("WUTISTHIS", val);
    }
}
*/
}//»
const com_appicon = class extends Com{//«

async run(){
	if (this.args.length){
		this.out(JSON.stringify({app: this.args.shift()}));
	}
	else {
		this.out((await util.getList("/site/apps/")).join("\n"));
	}
	this.ok();
}

}//»
const com_import = class extends Com{//«
async run(){
	let {term, opts, args}=this;
	let have_error = false;
	const err=(arg)=>{
		this.err(arg);
		have_error = true;
	};
	if (opts.delete || opts.d){
		delete_coms(args);
		this.ok();
		return;
	}
	let rv = await do_imports(args, err);
	if (rv) this.inf(`imported: ${rv}`);
	have_error?this.no():this.ok();
}
}//»

this.defCommands={//«

//continue: com_continue,
//break: com_break,
//poker: com_poker,
pipe: com_pipe,
html: com_html,
markdown: com_markdown,
wat2wasm: com_wat2wasm,
wget: com_wget,
continue: com_loopctrl,
break: com_loopctrl,
shift: com_shift,
":": com_colon,
"[": com_brackettest,
workman: com_workman,
bindwin: com_bindwin,
math: com_math,
log: com_log,
curcol: com_curcol, 
parse: com_parse,
stringify: com_stringify,
getch: com_getch,
read: com_read,
true: com_true,
false: com_false,
epoch: com_epoch,
hist: com_hist,
import: com_import,
libs: com_libs,
lib: com_lib,
export: com_export,
pwd: com_pwd,
clear: com_clear,
cd: com_cd,
ls: com_ls,
echo: com_echo,
echodelay: com_echodelay,
env: com_env,
app: com_app,
appicon: com_appicon,
open: com_open,
msleep: com_msleep,
test: com_test,
};
if (dev_mode) this.defCommands.devtest = com_devtest;
//»
this.defCommandOpts = {//«
//const command_options = {

/*«
l: long options
s: short options

1 means that the option does not have an argument
2 means that the option *may* have an argument
3 means that the option requires an argument

Any argument for a short option requires a mediating space. Below, the '4' is the
argument for the 'x' option.

~$ mycommand -x 4 filename.js

Long options may be given an argument like this:

~$ dosomething --like-this="Right here" to_some.json

»*/
	read:{l:{prompt:3}},
	import:{s:{d:1},l:{delete: 1}},
	bindwin:{s:{d:3},l:{desc: 3}},
	test: true,
	"[": true
};//»

}//»End: Builtin commands

//ErrorHandler«

const ErrorHandler = class {

	constructor() {//«
		this.errors = [];
		this.tolerant = false;
	}//»
	recordError(error) {//«
		this.errors.push(error);
	};//»
	tolerate(error) {//«
		if (this.tolerant) {
			this.recordError(error);
		}
		else {
			throw error;
		}
	};//»
	constructError(msg, column) {//«
		var error = new Error(msg);
		try {
			throw error;
		}
		catch (base) {

			if (Object.create && Object.defineProperty) {
				error = Object.create(base);
				Object.defineProperty(error, 'column', { value: column });
			}
		}
		return error;
	};//»
	createError(index, line, col, description) {//«
		var msg = description + ` (line ${line})`;
		var error = this.constructError(msg, col);
		error.index = index;
		error.lineNumber = line;
		error.description = description;
		return error;
	};//»
	throwError(index, line, col, description) {//«
		throw this.createError(index, line, col, description);
	};//»
	tolerateError(index, line, col, description) {//«
		var error = this.createError(index, line, col, description);
		if (this.tolerant) {
			this.recordError(error);
		}
		else {
			throw error;
		}
	};//»

};//»
//Token Classes (Words, Quotes, Subs)«

const Sequence = class {//«
	constructor(start){
//		this.par = par;
//		this.env = env;
		this.val = [];
		this.start = start;
//How about a start line?
	}
}//»
const Newlines = class extends Sequence{//«
	get isNLs(){ return true; }
	toString(){ return "newline"; }
}//»
const Word = class extends Sequence{//«
//XNDKSLDK

async expandSubs(shell, term, opts={}){//«
//async expandSubs(shell, term, env, scriptName, scriptArgs){
//const{env, scriptName, scriptArgs} = opts;
/*«
Here we need a concept of "fields".

- Everything is a ComSub or BQuote will get expanded into as many fields as
  the lines that it returns.

- Everything else gets treated as a string that either starts the first
  field or gets concatenated onto the current field.

- DQuote is a special string that must resolve internal expansions.

»*/
const fields = [];
let curfield="";
for (let ent of this.val){

	if (ent instanceof BQuote || ent instanceof ComSub|| ent instanceof ParamSub){//«
//The first result appends to curfield, the rest do: fields.push(curfield) and set: curfield=""
//		let rv = await ent.expand(shell, term, env, scriptName, scriptArgs);
		let rv = await ent.expand(shell, term, opts);
		if (rv) {
//			let arr = rv.split("\n");
			let arr;
//YRTHSJLS
/*
			if (rv.noSplitNLs){
				arr = rv.split(/[\x20\t]+/);
			}
			else{
				arr = rv.split(/[\x20\n\t]+/);
			}
*/
			arr = rv.split(/[\x20\n\t]+/);
			if (arr.length) {
				curfield+=arr.shift();
				if (arr.length) {
					fields.push(curfield);
					let last = arr.pop();
					fields.push(...arr);
					curfield = last || "";
				}
			}
		}
	}//»
	else if (ent instanceof MathSub){//«
//resolve and start or append to curfield, since this can only return 1 (possibly empty) value
//		curfield += await ent.expand(shell, term, env, scriptName, scriptArgs);
		curfield += await ent.expand(shell, term, opts);
	}//»
	else if (ent instanceof DQuote){//«
//		curfield += '"'+await ent.expand(shell, term, env, scriptName, scriptArgs)+'"';
		curfield += '"'+await ent.expand(shell, term, opts)+'"';
	}//»
	else if (ent instanceof SQuote || ent instanceof DSQuote){
//		curfield += "'"+ent.toString()+"'";
		curfield += `'${ent.toString()}'`;
	}
	else{
//JDHFKGK
//This might me a '\"' that gets turned into '"', which gets removed by quote removal
if (ent instanceof String && ent.escaped && (ent=="'"||ent=='"')){
curfield += `\\${ent}`;
}
else curfield += ent.toString();
	}

}

if (curfield) fields.push(curfield);
//if (!fields.length) fields.push("");
//log(fields);
this.fields = fields;
}//»

quoteRemoval(){//«

	let s='';
	let qtyp;
	let arr = this.val;
//log(arr);
	for (let l=0; l < arr.length; l++){
		let c = arr[l];
///*
		if (qtyp !== "'" && c==="\\" && (arr[l+1]==="'"||arr[l+1]==='"')){
s+=arr[l+1];
l++;
continue;
		}
//*/
		if (c==='"'||c==="'") {
			if (c===qtyp){
				qtyp=null;
				continue;
			}
			else if (!qtyp){
				qtyp = c;
				continue;
			}
		}
		s+=c.toString();
	}
//WUSLRJT
	this.val = [...s];

}//»
tildeExpansion(){//«
	const {val} = this;
	let parts = this.assignmentParts;
	let home_path = globals.user.HOME_PATH;
	let home_path_len = home_path.length;
	if (!parts){
		if (val[0]!=="~") return;
		if (val.length===1 || val[1]==="/"){
			val.splice(0, 1, ...home_path);
		}
		return;
	}
	let pos = parts[1];
	for (let i=pos; i < val.length; i++){
		if (i===pos&&val[pos]==="~"&&val[pos+1]=="/"){
			val.splice(pos, 1, ...home_path);
			i+=home_path_len;
		}
		else if (val[i]===":" && val[i+1]==="~"){
			if (!val[i+2]){
				val.splice(i+1, 1, ...home_path);
				return;
			}
			else if (val[i+2]=="/"){
				val.splice(i+1, 1, ...home_path);
				i+=home_path_len+2;
			}
		}
	}
}//»
dsSQuoteExpansion(){//«
	for (let ent of this.val){
		if (ent instanceof DSQuote) ent.expand();
	}
}//»
get isAssignment(){//«
	let eq_pos = this.val.indexOf("=");
	if (eq_pos <= 0) return false;//-1 means no '=' and 0 means it is at the start
	let pre_eq_arr = this.val.slice(0, eq_pos);
	let first = pre_eq_arr.shift();
	return (typeof first === "string" && first.match(/^[_a-zA-Z]$/));
}//»
get assignmentParts(){//«
	let eq_pos = this.val.indexOf("=");
	if (eq_pos <= 0) return false;//-1 means no '=' and 0 means it is at the start
	let pre_eq_arr = this.val.slice(0, eq_pos);
	let first = pre_eq_arr.shift();
	if (!(typeof first === "string" && first.match(/^[_a-zA-Z]$/))) return null;
	let assign_word = first;

	for (let ch of pre_eq_arr){
		if (!(typeof ch === "string" && ch.match(/^[_a-zA-Z0-9]$/))) return null;
		assign_word+=ch;
	}
	return [assign_word, eq_pos+1];
}//»
get isWord(){return true;}
dup(){//«
	let word = new Word(this.start);
	let arr = word.val;
	for (let ent of this.val){
		if (isStr(ent)) arr.push(ent);
		else arr.push(ent.dup());
	}
	return word;
}//»
toString(){//«
//We actually need to do field splitting instead of doing this...
//log("TOSTRING!!!", this.val.join(""));
//log(this.fields);
//If only 0 or 1 fields, there will be no newlines
//if (this.fields) return this.fields.join("\n");
return this.val.join("");
}//»
get isChars(){//«
	let chars = this.val;
	for (let ch of chars) {
		if (!isStr(ch)) return false;
	}
	return true;
}//»
get isSimple(){//«
	for (let ent of this.val){
		if (ent instanceof DQuote){
			for (let ent2 of ent.val){
				if (!isStr(ent2)) return false;
			}
		}
		else if (!(isStr(ent)||(ent instanceof SQuote)||(ent instanceof DSQuote))) return false;
	}
	return true;
}//»

}//»
const SQuote = class extends Sequence{//«
	expand(){
		return this.toString();
	}
	dup(){
		return this;
	}
	toString(){
		return this.val.join("");
	}
}//»
const DSQuote = class extends Sequence{//«
expand(){
//cwarn("EXPAND DSQUOTE!");
let wrd = this.val;
if (!wrd){
cwarn("WHAT THE HELL IS HERE????");
log(tok);
return tok;
}
let arr = wrd;
let out = [];
for (let i=0; i < arr.length; i++){//«
	let ch = arr[i];
	let next = arr[i+1];
	if (ch.escaped){
	let c;
//switch(ch){//«
//\" yields a <quotation-mark> (double-quote) character, but note that
//<quotation-mark> can be included unescaped.
if  (ch=='"') {c='"';}
//\' yields an <apostrophe> (single-quote) character.
//else if (ch=="'") { c="'";}

//\\ yields a <backslash> character.
else if (ch=='\\') { c='\\';}

//\a yields an <alert> character.
else if (ch=='a') { c='\x07';}

//\b yields a <backspace> character.
else if (ch=='b') { c='\x08';}

//\e yields an <ESC> character.
else if (ch=='e') { c='\x1b';}

//\f yields a <form-feed> character.
else if (ch=='f') { c='\x0c';}

//\n yields a <newline> character.
else if (ch=='n') { c='\n';}

//\r yields a <carriage-return> character.
else if (ch=='r') { c='\x0d';}

//\t yields a <tab> character.
else if (ch=='t') { c='\t';}

//\v yields a <vertical-tab> character.
else if (ch=='v') { c='\x0b';}

else if (ch=='x'){//«
//\xXX yields the byte whose value is the hexadecimal value XX (one or more hexadecimal digits). If more than two hexadecimal digits follow \x, the results are unspecified.
	if (next&&next.match(/[0-9a-fA-F]/)){
	let next2 = arr[i+2];
		if (next2 &&next2.match(/[0-9a-fA-F]/)){
			c = eval( '"\\x' + next + next2 + '"' );
			i+=2;
		}
		else{
			c = eval( '"\\x0' + next + '"' );
			i++;
		}
	}
}//»

//\ddd yields the byte whose value is the octal value ddd (one to three octal digits).
else if(ch=="0"|| ch=="1"|| ch=="2"|| ch=="3"|| ch=="4"|| ch=="5"|| ch=="6"|| ch=="7"){//«
	let s = ch;
//Array.includes tests for strict equality, so escaped chars will not match...
	if (next&&OCTAL_CHARS.includes(next)){
		s+=next;
		let next2 = arr[i+2];
		if (next2&&OCTAL_CHARS.includes(next2)){
			s+=next2;
			i+=2;
		}
		else i++;
		c = eval( '"\\x' + (parseInt(s, 8).toString(16).padStart(2, "0")) + '"' );
	}
}//»

//The behavior of an unescaped <backslash> immediately followed by any other
//character, including <newline>, is unspecified.

//\cX yields the control character listed in the Value column of Values for
//cpio c_mode Field in the OPERANDS section of the stty utility when X is one
//of the characters listed in the ^c column of the same table, except that \c\\
//yields the <FS> control character since the <backslash> character has to be
//escaped.

//}//»
	if (c) out.push(c);
	else out.push(ch);
	}
	else{
		out.push(ch);
	}
}//»
this.val = out;
//log("OUT",out.join(""));
return out.join("");
}

dup(){
	return this;
}
toString(){
return this.val.join("");
}
}//»

const DQuote = class extends Sequence{//«

dup(){//«
	let dq = new DQuote(this.start, this.par, this.env);
	let arr = dq.val;
	for (let ent of this.val){
		if (isStr(ent)) arr.push(ent);
		else arr.push(ent.dup());
	}
	return dq;
}//»
async expand(shell, term, opts={}){//This returns a string (with possible embedded newlines)«
let out = [];
let curword="";
let vals = this.val;
for (let ent of vals){

//log("ENT",ent);
	if (ent.expand){//This cannot be another DQuote
		if (curword){
			out.push(curword);
			curword="";
		}
//		out.push(await ent.expand(shell, term, env, scriptName, scriptArgs));
		out.push(await ent.expand(shell, term, opts));
	}
	else if (!isStr(ent)){
cwarn("HERE IS ENT!!!!");
log(ent);
throw new Error("WWWWWTFFFFF IS ENT!?!?!");
	}
	else{
		curword+=ent.toString();
	}
}
if (curword) out.push(curword);
//log(out);
//return out.join("\n");
return out.join("");

}//»
toString(){
	return this.val.join("");
}
}//»

const BQuote = class extends Sequence{//«
//Collect everything in a string...
expand(shell, term, opts){
	return shell.expandComsub(this, opts);
}
dup(){//«
	let bq = new BQuote(this.start, this.par, this.env);
	let arr = bq.val;
	for (let ent of this.val){
		if (isStr(ent)) arr.push(ent);
		else arr.push(ent.dup());
	}
	return bq;
}//»
toString(){
	return `\`${this.val.join("")}\``;
}
}//»
//XMKJDHE
const ShellName = class extends Sequence{//«
	toString(){
		return this.val.join("");
	}
	dup(){
		let nm = new ShellName(this.start);
		nm.val = this.val;
		return nm;
	}	
}//»
const ShellNum = class extends Sequence{//«
	toString(){
		return this.val.join("");
	}
	dup(){
		let num = new ShellNum(this.start);
		num.val = this.val;
		return num;
	}	
}//»
const ParamSub = class extends Sequence{//«

//KLSDHSKD

async expand(shell, term, com_opts, opts={}){//«

//if opts.isMath, then we can substitute "0" for non-existent things
	const{env,scriptName, scriptArgs}=com_opts;
//cwarn("PARAM", scriptName, scriptArgs);
//expand(shell, term, env, scriptName, scriptArgs){
//log(this.val);

//return "[SUBHERE]";
//log(this.val);
/*We can have:
1) isSym: Single char (SPECIAL_SYMBOLS)
2) isNum: ShellNum
3) ShellName
  - Plain (isPlain)
  - isSubstitute (subName, haveColon, subWord, subType)
  - isStrRep (subName, repWord, repType)
*/
	let s;
//if (this.isPlain||this.isSubstitute||this.isStrRep) s = this.toString();
if (this.isSym){//«
	s = this.val[0];
	if (s==="0"){
		return scriptName||"sh";
	}
	if (s==="@"||s==="*") {
		if (!scriptName) return "";
		return scriptArgs.join(" ");
	}
	if (s==="#") {
		if (!scriptName) return 0;
		return scriptArgs.length+"";
	}
	return s;

}//»
if (this.isNum){//«
	let num = parseInt(this.val.join(""));
	if (num===0){
		return scriptName||"sh";
	}
	if (!scriptName) return "";
	return scriptArgs[parseInt(num)-1]||"";
}//»
	if (this.subName) s = this.subName.toString();
	else {
log(this);
		throw new Error(`UNKNOWN SUBSTITUTION TYPE!!!`);
	}
	let marr;
	if (s.match(/^[_a-zA-Z]/)){
		if (opts.isMath) return env[s]||"0";
if (this.isSubstitute){//«
//log(this.subType, !!this.haveColon);

let have_colon = !!this.haveColon;
let subType = this.subType;
let is_set = Object.keys(env).includes(s);
let is_null;

let wrd = this.subWord;
await wrd.expandSubs(shell, term, com_opts);
let newval =  new String(wrd.fields.join(" "));
//EANFJLPM
//newval.noSplitNLs=true;
//log(newval);
let subval;
if (is_set){
	subval = env[s];
	is_null = !subval;
}
if (is_set && !is_null){
	if (subType==="+") return newval;
	return subval;
}

if (subType==="?"){//«
	if (!is_set || (is_null&&have_colon)){
		throw new Error(`sh: ${s}: ${newval}`);
	}
	return "";
}//»
else if (subType==="="){//«
	if (!is_set || (is_null&&have_colon)) {
		env[s]=newval;
		return newval;
	}
	return "";
}//»
else if (subType==="-"){//«
	if (!is_set || (is_null&&have_colon)) {
		return newval;
	}	
	return "";
}//»
else if (subType==="+"){//«
	if (!is_set || (is_null&&have_colon)) return "";
	return newval;
}//»
else{//«
	throw new Error(`!!! SHOULD NOT GET HERE SJDBFBS !!!`);
}//»
//term.response(`sh: not doing the parameter substitution (${s})`, {isWrn: true});

}//»
else if (this.isStrRep){//«
let val = env[s];
if (!val) return "";

let typ = this.repType;
let wrd = this.repWord;
if (!wrd) return val;
//TZKOPKHD
await wrd.expandSubs(shell, term, com_opts);
let str = wrd.fields.join(" ");
str = str.replace(/[\x22\x27]/g,"");
let patarr = str.split("");
let is_non_greedy = typ.length==1;
let a = [];
let is_rev = typ.match(/%/);

for (let ch of patarr){
	if (ch==="."){
		a.push('\\.');
	}
	else if (ch==="*"){
		if (is_non_greedy) a.push('.*?');
		else a.push('.*');

	}
	else if (ch==="?"){
		a.push('.');
	}
	else {
//		if (ch==="[" && is_rev) a.push("]");//«
//		else if (ch==="]" && is_rev) a.push("[");
//		else a.push(ch);//»
		a.push(ch);
	}
}
let useval = val;
let usepat = a.join("");
/*«
if (is_rev){
	useval = val.split("").reverse().join("");
	usepat = a.reverse().join("");
}
else{
	useval = val;
	usepat = a.join("");
}
»*/
let re;
let patstr;
if (is_rev) patstr = `${usepat}$`;
else patstr = `^${usepat}`;

try{
//log(`^${usepat}`);
//	re = new RegExp(`^${usepat}`);
	re = new RegExp(patstr);
log(re);
}
catch(e){
term.response(`sh: invalid regex detected`, {isWrn: true});
return val;
}
let marr = re.exec(useval);
if (marr && marr[0].length){
if (is_rev){
	useval = useval.slice(0, useval.length - marr[0].length);
}
else{
	useval = useval.slice(marr[0].length);
}
//	useval = useval.slice(marr[0].length);
return useval;
//	if (is_rev) return useval.split("").reverse().join("");
//	else return useval;
}
else return val;

}//»
		return env[s]||"";
	}
cwarn("HERE IS THE WEIRD PARAM SUB...");
log(s);
throw new Error(`sh: bad substitution: $\{${s}\}`);
//throw new Error("WHAT KIND OF PARAM SUB IS THIS???");
}//»
dup(){//«
	let param = new ParamSub(this.start);

	if (this.isSym) param.isSym=true;
	else if (this.isNum) param.isNum=true;
	else if (this.isSubstitute){
		param.isSubstitute = true;
		param.haveColon = this.haveColon;
		param.subType = this.subType;
//SBRILSMF
		param.subWord = this.subWord;//Need to duplicate with this.subWord.dup()???
	}
	else if (this.isStrRep){
		param.isStrRep = true;
		param.repType = this.repType;
		param.repWord = this.repWord;//Need to duplicate with this.repWord.dup()???
	}

	param.subName = this.subName;
	let arr = param.val;
	for (let ent of this.val){
		if (isStr(ent)) arr.push(ent);
		else arr.push(ent.dup());
	}
	return param;
}//»
toString(){
	return `\${${this.val.join("")}}`;
}

}//»
const ComSub = class extends Sequence{//«
expand(shell, term, opts){
	return shell.expandComsub(this, opts);
}
dup(){//«
	let com = new ComSub(this.start, this.par, this.env);
	let arr = com.val;
	for (let ent of this.val){
		if (isStr(ent)) arr.push(ent);
		else arr.push(ent.dup());
	}
	return com;
}//»
toString(){
	return `$(${this.val.join("")})`;
}
}//»
const MathSub = class extends Sequence{//«

async expand(shell, term, opts={}){//«
//Need to turn everything into a string that gets sent through math.eval()
//	const err = term.resperr;
const err=mess=>{
term.response(mess, {isErr: true});
};
	if (!await util.loadMod("util.math")) {
		err("could not load the math module");
		return "";
	}
	let s='';
	let vals = this.val;
	for (let ent of vals){
		if (ent.expand) s+=await ent.expand(shell, term, opts, {isMath: true});
		else s+=ent.toString();
	}

	let math = new NS.mods["util.math"]();
	try{
		return math.eval(s)+"";
	}
	catch(e){
		err(`math expansion: ${e.message}`);
		return "";
	}
}//»
dup(){//«
	let math = new MathSub(this.start, this.par, this.env);
	let arr = math.val;
	for (let ent of this.val){
		if (isStr(ent)) arr.push(ent);
		else arr.push(ent.dup());
	}
	return math;
}//»
toString(){
	return `$((${this.val.join("")}))`;
}

}//»
this.seqClasses={
	Sequence, Newlines, Word, SQuote, DSQuote, DQuote, BQuote, ParamSub, ComSub, MathSub
}

//»
//Scanner«

//These 2 functions are "holdover" logic from esprima, which seems too "loose" for 
//typical shell scripting purposes
const isWhiteSpace = (cp) => {//«
	return (cp === 0x20) || (cp === 0x09) || (cp === 0x0B) || (cp === 0x0C) || (cp === 0xA0) ||
		(cp >= 0x1680 && [0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(cp) >= 0);
};//»
const isLineTerminator = (cp) => {//«
	return (cp === 0x0A) || (cp === 0x0D) || (cp === 0x2028) || (cp === 0x2029);
};//»

//const COMPOUND_START_WORDS = [
const COMPOUND_NON_START_WORDS = [//«
	'then',
	'else',
	'elif',
	'fi',
	'do',
	'done',
	'esac',
	'}',
	'in'
];//»
const RESERVERD_WORDS = [//«
	'if',
	'then',
	'else',
	'elif',
	'fi',
	'do',
	'done',
	'case',
	'esac',
	'while',
	'until',
	'for',
	'{',
	'}',
	'in'
];//»
const RESERVED_START_WORDS = [//«
	"{",
	"for",
	"if",
	"while",
	"until",
	"case"
];//»

const EOF_Type = 1;

const Scanner = class {

constructor(code, opts={}, handler) {//«
	this.isInteractive = opts.isInteractive||false;
	this.env = opts.env;
	this.term = opts.term;
	this.source = code;
	this.errorHandler = handler;
	this.length = code.length;
	this.index = 0;
	this.lineNumber = (code.length > 0) ? 1 : 0;
	this.lineStart = 0;
}//»

eof() {//«
	return this.index >= this.length;
}//»
eol(){//«
	return this.isInteractive && (this.index >= this.length);
}//»
async more(no_nl){//«
	if (!this.eol()){
		throw new Error("more() was call, but NOT at eol()");
	}
	let nl;
	if (no_nl) nl="";
	else nl="\n";
//	let rv = nl+(await this.term.readLine("> "));
	let rv = await this.term.readLine("> ");
	if (isEOF(rv)){
		return false;
	}
	this.source = this.source.concat(...(nl+rv));
	this.length = this.source.length;
	return true;
}//»
throwUnexpectedToken(message) {//«
	if (message === void 0) { message = Messages.UnexpectedTokenIllegal; }
	return this.errorHandler.throwError(this.index, this.lineNumber, this.index - this.lineStart + 1, message);
}//»
unexp(which, pref){//«
	if (pref) this.throwUnexpectedToken(`${pref}: unexpected '${which}'`);
	else this.throwUnexpectedToken(`unexpected '${which}'`);
}//»
check(ch){//«
	if(this.eof()) return false; 
	let gotch = this.source[this.index];
	if (gotch === ch){
		this.index++;
		return true;
	}
	return false;
}//»
checkRE(re){//«
	if(this.eof()) return false; 
	let gotch = this.source[this.index];
	if (re.test(gotch)){
		this.index++;
		return gotch;
	}
	return false;
}//»
expect(ch, pref){//«
	if(this.eof()) return this.unexp("end-of-file", pref); 
	let gotch = this.source[this.index];
	if (gotch===ch){
		this.index++;
		return true;
	}
	if (gotch==="\n"){
		return this.unexp("newline", pref);
	}
	this.unexp(gotch, pref);
}//»

skipSingleLineComment() {//«
	while (!this.eof()) {
//		let ch = this.source.charCodeAt(this.index);
		let code = this.source[this.index].charCodeAt();
		if (isLineTerminator(code)) {
			return;
		}
		this.index++;
	}
}//»
scanComments() {//«
	while (!this.eof()) {
		let code = this.source[this.index].charCodeAt();
		if (isWhiteSpace(code)) {
			++this.index;
		}
		else if (isLineTerminator(code)) {
			break;
		}
		else if (code===0x23){//'#' in 0th line position or preceeded by a space or tab«
			if (this.index - this.lineStart === 0 || this.source[this.index-1] === " " || this.source[this.index-1] === "\t"){
				this.index++;
				this.skipSingleLineComment();
			}
			else {
				break;
			}
		}//»
		else {
			break;
		}
	}
};//»

async scanQuote(par, which, in_backquote, cont_quote, use_start){//«
//log("scanQuote", which, this.index);
// If we are in double-quotes or back-quotes, we need to check for:
// 2) '$(': scanComSub
	let check_subs = which==='"'||which==="`";

//If we are in double quotes, need to check for backquotes
	let check_bq = which==='"';
//let check_subs
//	let out=[];

	let start;
	if (cont_quote) start = use_start;
	else start = this.index;

//	let src = this.source;
	let len = this.source.length;
	let is_ds_single = which === "$";
	let is_single;
	if (is_ds_single) {
		if (!cont_quote) this.index++;
		is_single = true;
	}
	else if (which==="'"){
		is_single = true;
	}
	let is_hard_single = is_single && !is_ds_single;
	let is_dq = which === '"';
	let is_bq = which === '`';
	let err;
	const quote = cont_quote || (is_dq ? new DQuote(start, par) : 
		(is_hard_single ? new SQuote(start, par) : 
			(is_ds_single ? new DSQuote(start, par) :
				(is_bq ? new BQuote(start, par) :
					(err = new Error("WWTTFFFFFF ^&*^&(#&$*($#@"))
				)
			)
		));
	if (err) throw err;
	const out = quote.val;

	let end_quote;
	if (which==="$") end_quote="'";
	else end_quote = which;

	if (!cont_quote) this.index++;
	let cur = this.index;
	let ch = this.source[cur];
	let rv;
	let next;
	while(ch && ch !== end_quote){
		if (ch==="`" && in_backquote){//«
			return `command substitution: unexpected EOF while looking for matching '${which}'`;
		}//»
		if (check_subs&&ch==="$"&&(this.source[cur+1]==="("||this.source[cur+1]==="{")) {//«
			this.index=cur;
			if (this.source[cur+2]==="("){
				rv = await this.scanSub(quote, {isMath: true, inBQ: is_bq||in_backquote});
				if (rv===null) this.throwUnexpectedToken(`unterminated math expression`);
			}
			else if (this.source[cur+1]==="{"){
//				rv = await this.scanSub(quote, {isParam: true, inBQ: is_bq||in_backquote});
				rv = await this.scanParamSub({inBQ: is_bq||in_backquote});
				if (rv===null) this.throwUnexpectedToken(`unterminated parameter substitution`);
				this.index--;
			}
			else{
//				rv = await this.scanComSub(quote, null, is_bq||in_backquote);
				rv = await this.scanSub(quote, {isComSub: true, inBQ: is_bq||in_backquote});
				if (rv===null) this.throwUnexpectedToken(`unterminated command substitution`);
			}
			if (isStr(rv)) this.throwUnexpectedToken(rv);
			out.push(rv);
			cur=this.index;
		}//»
		else if (check_subs && ch==="$" && this.source[cur+1] && this.source[cur+1].match(/[_a-zA-Z]/)){//«
			this.index=cur;
			let sub = new ParamSub(cur);
			sub.val[0] = await this.scanName();
			sub.subName = sub.val[0];
			out.push(sub);
			cur=this.index;
		}//»
		else if (check_subs && ch==="$" && this.source[cur+1] && (this.source[cur+1].match(/[1-9]/)||SPECIAL_SYMBOLS.includes(this.source[cur+1]))){//«
			let sub = new ParamSub(cur);
			sub.val=[this.source[cur+1]];
			out.push(sub);
			this.index++;
		}//»
		else if (check_bq&&ch==="`"){//«
			this.index = cur;
			rv = await this.scanQuote(quote, "`");
			if (rv===null)  this.throwUnexpectedToken(`unterminated quote: "${ch}"`);
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			out.push(rv);
			cur=this.index;
		}//»
		else if (!is_hard_single && ch==="\\"){//«
			cur++;
			ch = this.source[cur];
//log("HICH", ch);
/*
if (this.isInteractive){
log("GET MOAR...");
}
else{
cwarn("SKIP OIMPET");
}
*/
			if (!ch) this.throwUnexpectedToken("unsupported line continuation (2)");
			let c = ch;
			ch = new String(c);
			ch.escaped = true;
			if (is_ds_single||is_dq)ch.toString=()=>{
//log("TOSTRING!!!");
				return "\\"+c;
			};
//log(ch);
			//else is_bq: the character is in "free space" (no backslashes show up)
			out.push(ch);
		}//»
		else if (is_bq && (ch==='"'||ch==="'")){//«
			this.index=cur;
			rv = await this.scanQuote(quote, ch, true);
			if (rv===null)  this.throwUnexpectedToken(`unterminated quote: "${ch}"`);
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			out.push(rv);
			cur = this.index;
		}//»
		else if (is_bq && ch==="$" && this.source[cur+1]==="'"){//«
			this.index=cur;//DPORUTIH  ARGHHHHHHH!?!?!?!?!?
			rv = await this.scanQuote(quote, "$", true);
			if (rv===null)  this.throwUnexpectedToken(`unterminated quote: "${ch}"`);
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			out.push(rv);
			cur = this.index;
		}//»
		else {
			out.push(ch);
		}
		cur++;
		ch = this.source[cur];
	}
	this.index = cur;
	if (ch !== end_quote) {
		if (this.eol()){
			quote.val = out;
			if (!await this.more()){
				throw new Error("EOF");
			}
			return await this.scanQuote(par, which, in_backquote, quote, start);
		}
		return null;
	}
//ZOHJKL
//	quote.raw = this.source.slice(start+1, this.index);
	quote.raw = this.source.slice(start+1, this.index).join("");
//	word.raw = this.source.slice(start, this.index).join("");
if (!out.length) out.push("");
//log(out);
//log(out);
	return quote;
}//»
scanName(no_adv){//«
	if (!no_adv) this.index++;
	let cur = this.index;
	let sub = new ShellName(cur);
	let out = sub.val;
	out.push(this.source[cur]);
	cur++;
	let ch = this.source[cur];
	while(ch && ch.match(/[_0-9a-zA-Z]/)){
		out.push(ch);
		cur++;
		ch = this.source[cur];
	}
	this.index = cur-1;
	return sub;
}//»
scanRE(re){//«
	let cur = this.index;
	let ch = this.source[cur];
	let out = [];
	while(ch && re.test(ch)){
		out.push(ch);
		cur++;
		ch = this.source[cur];
	}
	this.index = cur;
	return out;

}//»
async scanSub(par, opts={}){//«
/*
We need to balance all internal "(" and ")"
*/
let paren_depth;
if (Number.isFinite(opts.parenDepth)) paren_depth = opts.parenDepth;
else paren_depth = 0;
let is_math = opts.isMath;
let is_param = opts.isParam;
let is_comsub = opts.isComSub;
if (!(is_math||is_param||is_comsub)){
throw new Error("NOT is_comsub || is_math || is_param ?!?!? HJKHFDK^&*^$*&#");
}
let in_backquote = opts.inBQ;
let cont_sub = opts.contSub;

let start = this.index;
let sub = cont_sub || (is_math ? new MathSub(start, par) : 
	(is_param ? new ParamSub(start, par) : new ComSub(start, par))
	);
let out = sub.val;
if (!cont_sub) {
	this.index+=2;
	if (is_math){
		this.index++;
	}
}
let cur = this.index;
let ch = this.source[cur];
//if (!ch) return null;
let have_space = false;
while(ch){

if (ch==="\\"&& !this.source[cur+1]) return "the command substitution must be on a single line";

if (ch==="\\"){//«
	cur++;
	out.push("\\", this.source[cur]);
	have_space = false;
}//»
else if (ch==="(") paren_depth++;
else if (ch==="$"&&this.source[cur+1]==="'"){//«
	this.index=cur;
	let rv = await this.scanQuote(par, "$", in_backquote);
	if (rv===null) return `unterminated quote: $'`;
	if (isStr(rv)) return rv;
	out.push(rv);
	cur=this.index;
	have_space = false;
}//»
else if (ch==="'"||ch==='"'||ch==='`'){//«
	if (ch==="`"&& in_backquote){
		let say_ch;
		if (is_comsub) say_ch=")";
		else if (is_math) say_ch="))";
		else if (is_param) say_ch = "}";
//		return `unexpected EOF while looking for matching '${is_math?"))":")"}'`;
		return `command substitution: unexpected EOF while looking for matching '${say_ch}'`;
	}
	this.index=cur;
	let rv = await this.scanQuote(sub, ch, in_backquote);
	if (rv===null) return `unterminated quote: ${ch}`;
	if (isStr(rv)) return rv;
	out.push(rv);
	cur=this.index;
	have_space = false;
}//»
else if (ch==="$"&&(this.source[cur+1]==="("||this.source[cur+1]==="{")){//«
	if (this.source[cur+2]==="("){
		this.index=cur;
//		let rv = await this.scanComSub(sub, true, in_backquote);
		let rv = await this.scanSub(sub, {isMath: true, inBQ: in_backquote});
		if (rv===null) return `unterminated math expansion`;
		if (isStr(rv)) return rv;
		out.push(rv);
		cur=this.index;
	}
	else if (this.source[cur+1]==="{"){
		this.index=cur;
		let rv = await this.scanSub(sub, {isParam: true, inBQ: in_backquote});
		if (rv===null) return `unterminated parameter expansion`;
		if (isStr(rv)) return rv;
		out.push(rv);
		cur=this.index;
	}
	else{
		this.index=cur;
////async scanComSub(par, is_math, in_backquote, cont_sub){
//		let rv = await this.scanComSub(sub, false, in_backquote);
//		let rv = await this.scanSub(sub, {isComSub: true, inBQ: true});
		let rv = await this.scanSub(sub, {isComSub: true, inBQ: in_backquote});
		if (rv===null) return `unterminated command substitution`;
		if (isStr(rv)) return rv;
		out.push(rv);
		cur=this.index;
	}
	have_space = false;
}//»
else if (ch==="$" && this.source[cur+1] && this.source[cur+1].match(/[_a-zA-Z]/)){//«
	this.index=cur;
	let sub = new ParamSub(cur);
	sub.subName = await this.scanName();
	sub.val[0] = sub.subName;
//	sub.subName = sub.val[0];
//	sub.val[0]
	out.push(sub);
	cur = this.index;
}//»
else if (ch==="$" && this.source[cur+1] && (this.source[cur+1].match(/[1-9]/)||SPECIAL_SYMBOLS.includes(this.source[cur+1]))){//«
	let sub = new ParamSub(cur);
	sub.val=[this.source[cur+1]];
	out.push(sub);
	this.index++;
}//»
else if (is_math && ch.match(/[_a-zA-Z]/)){//«
/*
For math subs, we automatically create a param out of anything that looks like a name
*/
	this.index=cur;
	let sub = new ParamSub(cur);
	sub.subName = await this.scanName(true);
	sub.val[0] = sub.subName;
	out.push(sub);
	cur = this.index;

}//»
else if (is_param && ch==="}"){//«
//if ()
//log(start, cur);
//WYFOSKFL
	this.index = cur;
	return sub;
}//»
else if (paren_depth === 0 && is_comsub && ch===")"){//«
	this.index = cur;
//XMDJKT
//	sub.raw = this.source.slice(start+2, this.index);
	sub.raw = this.source.slice(start+2, this.index).join("");
	return sub;
}//»
else if (paren_depth === 0 && is_math && ch===")"){//«
	if (this.source[cur+1] !== ")") {
		return "expected a final '))'";
	}
	this.index = cur+1;
	return sub;
}//»
else if (ch===")"){//«
	if (paren_depth) {
		paren_depth--;
	}
	else return "unexpected token: ')'";
}//»
else if (ch===" " || ch==="\t"){//«
	out.push(ch);
	have_space = true;
}//»
else{//«
	if (ch==="#"&&have_space){
		return 'the substitution was terminated by "#"';
	}
	out.push(ch);
	have_space = false;
}//»

cur++;
ch = this.source[cur];

}
this.index = cur;

if (this.eol()){
	sub.val = out;
	await this.more();
//	return await this.scanComSub(par, is_math, in_backquote, sub);
	return await this.scanSub(par, {isMath: is_math, isComSub: is_comsub, isParam: is_param, inBQ: in_backquote, contSub: sub, parenDepth: paren_depth});
}


//If we get here, we are "unterminated"
return null;

}//»
scanOperator(){//«

//	let this.source = this.source;
	let start = this.index;
	let str = this.source[start];
	let obj={};
	switch(str){
	case '('://«
		obj.isSubStart = true;
		obj.isCommandStart = true;
		++this.index;
		break;
	case ')':
		obj.isSubEnd = true;
		obj.isPatListEnd = true;
		++this.index;
		break;//»
	case '&'://«
		++this.index;
		if (this.source[this.index]==="&"){
			this.index++;
			str="&&";
			obj.isAndIf = true;
		}
		break;//»
	case '|'://«
		++this.index;
		if (this.source[this.index]==="|"){
			this.index++;
			str="||";
			obj.isOrIf = true;
		}
		else{
			obj.isPipe = true;
			obj.isPatListSep = true;
		}
		break;//»
	case '>'://«
		++this.index;
		if ([">","&","|"].includes(this.source[this.index])){
			str+=this.source[this.index];
			++this.index;
		}
		break;//»
	case '<'://«
		++this.index;
	//'<<',
	//'<>',
	//'<<-',
	//'<<<',
		if (this.source[this.index]===">"){
			str = "<>";
			++this.index;
		}
		else if (this.source[this.index]==="<"){
			++this.index;
			if (this.source[this.index]==="<"){
				++this.index;
				str = "<<<";
			}
			else if (this.source[this.index]==="-"){
				++this.index;
				str = "<<-";
				obj.isHeredoc = true;
			}
			else{
				str="<<";
				obj.isHeredoc = true;
			}
		}
		break;//»
	case ';'://«
		++this.index;
		if (this.source[this.index]===";"){
			this.index++;
			str=";;";
			obj.isDSemi = true;
			obj.isCaseItemEnd = true;
		}
		else if (this.source[this.index]==="&"){
			this.index++;
			str=";&";
			obj.isSemiAnd = true;
			obj.isCaseItemEnd = true;
		}
		break;//»
	}
	if (this.index === start) {
		this.throwUnexpectedToken(`Unexpected token ${str}`);
	}
//	let check_unsupported_toks = globals.dev_mode ? UNSUPPORTED_DEV_OPERATOR_TOKS : UNSUPPORTED_OPERATOR_TOKS;
//	if (check_unsupported_toks.includes(str)) this.throwUnexpectedToken(`unsupported operator '${str}'`);

	obj.val=str;
	obj.isOp = true;
	obj.toString=()=>{
		return str;
	};

	if (str.match(/[<>]/)) {
		obj.type="r_op";
		obj.r_op = str;
		obj.isRedir = true;
		obj.isCommandStart = true;
	}
	else{
		obj.type="c_op";
		obj.c_op = str;
		obj.isControl = true;
		if (str===";"){
			obj.isSepOp = true;
			obj.isSemi = true;
		}
		else if (str==="&") {
			obj.isSepOp = true;
			obj.isAmper = true;
		}
	}
	return obj;
//	if (str.match(/[<>]/)) return {type:"r_op", r_op:str, val: str, isOp: true};
//	return {type:"c_op", c_op:str, start, val: str, isOp: true};

}//»
async scanParamSub(opts={}){//«
const bad=(which)=>{
	this.unexp(which, BADSUB);
};

let in_backquote = opts.inBQ;
let sub = new ParamSub(this.index);
//let val = [];
this.index+=2;
let next = this.source[this.index];
//UDHLPFMSK
if (!next) bad("EOF");
if (next==="\n") bad("newline");
if (next==="}") bad("}");
if (next.match(/[0-9]/)){//Sequence of numbers ${6} or ${647} or even ${0045}«
	let num = new ShellNum(this.index);
	num.val = this.scanRE(/[0-9]/);
	sub.val.push(num);
	sub.isNum = true;
	this.expect("}", BADSUB);
//this.index--;
	return sub;
}//»
else if (SPECIAL_SYMBOLS.includes(next)){//Can only be this symbol«
	sub.val=[next];
	sub.isSym = true;
	this.index++;
	this.expect("}", BADSUB);
	return sub;
}//»
else if (!next.match(/[_a-zA-Z]/)) {
//log(next, in_backquote);
if (next==="`" && in_backquote){
this.throwUnexpectedToken("command substitution: unexpected EOF while looking for matching '}'");
return;
}
	bad(next);
}
//«
//Scan forward until the end of the param name, and look for closing "}" or:
//1) /:?[-=+?]/
//2) /%%?/
//3) /##?/
//Then scan for a word that is delimited by "}" (fail on any other delimiter)
//»
//sub.val = this.scanRE(/[_0-9a-zA-Z]/);
//log("WUT");
let name = this.scanName(true);
sub.subName = name;
sub.val.push(name);
this.index++;
//log(sub.val);

if (this.check("}")) {
//log(sub.val);
	sub.isPlain = true;
	return sub;//"Normal" sub like: ${FOOD_HERE_HAR}
}
//Some kind of alternative param sub scheme: ${FOOD:-`ls`}

let have_colon = this.check(":");
if (have_colon) sub.val.push(":");
let gotop;
if (gotop = this.checkRE(/[-=+?]/)) {//Substitution«
//log("HI");
	sub.haveColon = have_colon;
	sub.isSubstitute = true;
	sub.subType = gotop;
	sub.val.push(gotop);
	if (this.check("}")){}//This CAN be a null string
	else{//Need to get a Word that is terminated by only: "}"
//log("SCAN A WORD!!!");
		let word = await this.scanWord({isParam: true, inBQ: in_backquote});
		sub.subWord = word;
		sub.val.push(word);
		this.index++;
	}
	return sub;
}//»

//Must be substring replacement pattern, like ${FROOMT%%zzlermm*}«
if (have_colon) bad(":");
let typ;
if (this.check("%")){
	if (this.check("%")) typ = "%%";
	else typ="%";
	sub.val.push(typ);
}
else if (this.check("#")){
	if (this.check("#")) typ = "##";
	else typ="#";
	sub.val.push(typ);
}
else{
	if (this.eof()) bad("EOF");
	if (this.check("\n")) bad("newline");
if (this.source[this.index]==="`" && in_backquote){
this.throwUnexpectedToken("command substitution: unexpected EOF while looking for matching '}'");
return;
}
	bad(this.source[this.index]);
	return;
}
sub.isStrRep = true;
sub.repType = typ;
if (this.check("}")){}//This CAN be a null string
else{//Need to get a Word that is terminated by only: "}"
	let word = await this.scanWord({isParam: true});
	sub.repWord = word;
	sub.val.push(word);
	this.index++;
}
return sub;
//»

}//»
async scanWord(opts={}){//«
/*

Now we need to be "backslash aware". scanWord always begins in a "top-level" scope, which
can either be in free space or just after "`", "$(" or "$((" that are in free space,
or in double quotes or in themselves ("`" must be escaped to be "inside of" itself).

*/

	let start = this.index;
//	let src = this.source;
//	let str='';
//	let src;
	let rv;
	let start_line_number = this.lineNumber;
	let start_line_start = this.lineStart;
	let word = new Word(start);
	let wordarr = word.val;
	let is_plain_chars = true;
	let is_param = opts.isParam;
	let in_backquote = opts.inBQ;
// Simple means there are only plain chars, escapes, '...', $'...' and 
// "..." with no embedded substitutions
//	let is_simple = true;
	while (!this.eof()) {
		let ch = this.source[this.index];
		let next1 = this.source[this.index+1];
		let next2 = this.source[this.index+2];
		if (ch==="\\"){//«
			if (!next1) {//«
				if (this.isInteractive){
//We treat the escape character as if it doesn't exist, and everything continues on the same line
//with the ps1 prompt
					this.source.pop();
					this.length--;
					await this.more(true);
					continue;
				}
				else{
//In a script and it ends like:
//echo hi\
					break;
				}
			}//»
			else if (next1 === "\n") {//«
				if (this.isInteractive){
//Newlines *are* added in interactive mode when calling 'await this.more()' while
//scanning a string that was not terminated.
					throw new Error("HOW IS THERE AN ACTUAL NEWLINE CHARACTER WHILE WE ARE INTERACTIVE?!?!");
				}
//In a script, just treat the 2 character sequence <escape> <newline> as if they don't exist
				this.index+=2;
				continue;
			}//»
			is_plain_chars = false;
//WJKMDNFK
			ch = new String(next1);
//if (ch==="'"||ch==='"') ch.toString=function(){
//return `\\${ch}`;
//};
//log(ch);
			ch.escaped = true;
			this.index++;
			wordarr.push(ch);
		}//»
		else if (ch==="$" && next1 === "(" && next2==="("){//«
			is_plain_chars = false;
//			rv = await this.scanComSub(word, true);
			rv = await this.scanSub(word, {isMath: true, inBQ: in_backquote});
			if (rv===null) this.throwUnexpectedToken(`unterminated math expression`);
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			wordarr.push(rv);
		}//»
		else if (ch==="$" && next1 === "("){//«
			is_plain_chars = false;
//			rv = await this.scanComSub(word);
			rv = await this.scanSub(word, {isComSub: true, inBQ: in_backquote});
			if (rv===null) this.throwUnexpectedToken(`unterminated command substitution`);
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			wordarr.push(rv);
		}//»
		else if (ch==="$" && next1 === "{"){//«
			is_plain_chars = false;
			rv = await this.scanParamSub({inBQ: in_backquote});
			wordarr.push(rv);
			continue;
		}//»
		else if ((ch==="$"&&next1==="'")||ch==="'"||ch==='"'||ch==='`'){//«
			is_plain_chars = false;
if (ch==="`" && in_backquote){
this.throwUnexpectedToken("unexpected EOF reached");
}
			rv = await this.scanQuote(word, ch, in_backquote);
			if (rv===null) {
				if (ch=="'"){
					this.throwUnexpectedToken(`unterminated quote: "${ch}"`);
				}
				else{
					this.throwUnexpectedToken(`unterminated quote: '${ch}'`);
				}
			}
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			wordarr.push(rv);
		}//»
		else if (ch==="$" && next1 && next1.match(/[_a-zA-Z]/)){//«
			is_plain_chars = false;
			let sub = new ParamSub(this.index);
			sub.val[0] = await this.scanName();
			sub.subName = sub.val[0];
			wordarr.push(sub);
		}//»
		else if (ch==="$" && next1 && (next1.match(/[1-9]/)||SPECIAL_SYMBOLS.includes(next1))){//«
			let sub = new ParamSub(this.index);
			sub.val=[next1];
			wordarr.push(sub);
			this.index++;
		}//»
		else if (is_param && ch==="}") break;//WUEHSKR
		else if (ch==="\n"||ch===" "||ch==="\t") {//«
			if (is_param){
				return this.unexp("whitespace token", BADSUB);
			}
			break;
		}//»
		else if (OPERATOR_CHARS.includes(ch)) {//«
			if (is_param){
				return this.unexp(ch, BADSUB);
			}
			break;
		}//»
		else wordarr.push(ch);
		this.index++;
	}

	if (!is_param) {
		if (is_plain_chars){//«
			let wrd = wordarr.join("");
			if (RESERVERD_WORDS.includes(wrd)) {
				word.isRes = true;
				if (RESERVED_START_WORDS.includes(wrd)) {
					word.isCommandStart = true;
					word.isResStart = true;
				}
				else{
					word.isCommandStart = false;
				}
//	if then else elif fi do done case esac while until for { } in
				switch(wrd){

				case "if": word.isIf=true;break;
				case "then": word.isThen=true;break;
				case "else": word.isElse=true;break;
				case "elif": word.isElif=true;break;
				case "fi": word.isFi=true;break;
				case "do": word.isDo=true;break;
				case "done": word.isDone=true;break;
				case "case": word.isCase=true;break;
				case "esac": word.isEsac=true;break;
				case "while": word.isWhile=true;break;
				case "until": word.isUntil=true;break;
				case "for": word.isFor=true;break;
				case "{": word.isLBrace=true;break;
				case "}": word.isRBrace=true;break;
				case "in": word.isIn=true;break;
				default: 
	cwarn("What is the word below, not RESERVED_WORDS!!!");
	log(wrd);
					this.fatal(`WUTTHEHELLISTHISWORD --->${wrd} <---- ^&*^$#&^&*$ (see console)`);

				}
			}
			else{//Not reserverd word (is_plain_chars == true)
				word.isCommandStart = true;
			}
		}//»
		else{
	//is_plain_chars == false
			word.isCommandStart = true;
		}
	}
	word.raw = this.source.slice(start, this.index).join("");
//log(raw);
	return word;
}//»
scanNewlines(par, env, heredoc_flag){//«

	let start = this.index;
//	let this.source = this.source;
//	let str="";
	let val = [];
	let iter=0;
	let start_line_number = this.lineNumber;
	let start_line_start = this.index;
	while (this.source[start+iter]==="\n"){
		iter++;
		if (heredoc_flag) break;
	}
	this.index+=iter;
	this.lineStart = start_line_start+iter;
	this.lineNumber+=iter;

	let newlines = new Newlines(start, par, env);
//	newlines.isNLs = true;
	newlines.newlines = iter;
	return newlines;

}//»
spliceSource(len){//«
	this.source.splice(this.index-len, len);
	this.index-=len;
	this.length-=len;
}//»
scanNextLineNot(delim){//«
	if (this.eof()) {
//cwarn("GOTEOF", this.isInteractive);
		return false;
	}
	let cur = this.index;
//	let this.source = this.source;
	let ln='';
	let ch = this.source[cur];
	while(ch!=="\n"){
		if (!ch) break;
		ln+=ch;
		cur++;
		ch = this.source[cur];
	}
	this.index = cur+1;
	if (ln===delim) {
		return true;
	}
//log(this.isInteractive);
//	if (this.eof()) return false;
	if (!this.isInteractive && this.eof()) return false;
//log("HI", this.eof(), ln);
	return ln;
}//»
async lex(heredoc_flag){//«

if (this.eof()) {//«
	return {
		type: EOF_Type,
		value: '',
		lineNumber: this.lineNumber,
		lineStart: this.lineStart,
		start: this.index,
		end: this.index
	};
}//»

let ch = this.source[this.index];

//We never do this because we are always entering single lines from the interactive terminal
//or sending them through one-by-one via ScriptCom.
if (ch==="\n") return this.scanNewlines(null, this.env, heredoc_flag);

if (OPERATOR_CHARS.includes(ch)) {
//	if (UNSUPPORTED_OPERATOR_CHARS.includes(ch)) this.throwUnexpectedToken(`unsupported token: '${ch}'`);
	return this.scanOperator();
}
//return await this.scanWord(null, this.env);
return await this.scanWord();

}//»

};//»
//Parser«

const Parser = class {

constructor(code, opts={}) {//«
//WHKSFLGG
	this.mainParser = opts.mainParser || this;
//	this.id = parserId++;
	this.env = opts.env;
	this.term = opts.term;
	this.isInteractive = opts.isInteractive;
	this.isContinue = opts.isContinue;
	this.heredocScanner = opts.heredocScanner;
	this.errorHandler = new ErrorHandler();
	this.scanner = new Scanner(code, opts, this.errorHandler);
//	this.isInteractive = opts.isInteractive;
	this.lookahead = {//«
		type: EOF_Type,
		value: '',
		lineNumber: this.scanner.lineNumber,
		lineStart: 0,
		start: 0,
		end: 0
	};//»
	this.hasLineTerminator = false;
	this.tokNum = 0;
	this.numToks = 0;
	this.tokens = [];
/*
Since this is async (because we might need to get more lines from 'await term.readLine()'),
then we need to do 'await this.scanNextTok()' **outside** of the constructor, since there is
NO async/await in constructors.
*/
//	this.scanNextTok();
}//»

fatal(mess){//«
throw new Error(mess);
}//»
eol(){//«
	return (
		(this.isInteractive && this.tokNum === this.numToks) || 
		(!this.isInteractive && isNLs(this.tokens[this.tokNum]))
	)
}//»
eos(){//end-of-script«
	return (!this.isInteractive && this.tokNum === this.numToks);
}//»
unexp(tok){this.fatal(`syntax error near unexpected token '${tok.toString()}'`);}
unexpeof(){this.fatal(`syntax error: unexpected end of file`);}
end(){//«
//SLKIURUJ
	return(this.tokNum===this.numToks);
}//»
dumpTokens(){//«

let toks = this.tokens;
let tok = toks[this.tokNum];

while(tok){
	if (isNLs(tok)){
cwarn("NL");
	//	tok = toks.shift();
		this.tokNum++;
		while (isNLs(toks[this.tokNum])) {
			this.tokNum++;
		}
	}
	else {
		if (tok.isWord){
			log(tok.toString());
		}
		else{
			if (tok.isHeredoc){
				cwarn(`HEREDOC (${tok.delim}): ${(tok.value.slice(0,10)+"..."+tok.value.slice(tok.value.length-10, tok.value.length)).split("\n").join("\\n")}`);
			}
			else {
				cwarn(tok[tok.type]);
			}
		}
		this.tokNum++;
	}
	tok=toks[this.tokNum];
}

}//»
skipNewlines(){//«
	let toks = this.tokens;
	if (!isNLs(toks[this.tokNum])) return false;
	while (isNLs(toks[this.tokNum])){
		this.tokNum++;
	}
	return true;
}//»
eatSeqSep(){//«
	this.eatSemicolon();
	this.skipNewlines();
}//»
eatSemicolon(){//«
	let tok = this.tokens[this.tokNum];
	if (tok && tok.isSemi){
		this.tokNum++;
		return true;
	}
	return false;
}//»
pushNewline(){//«
	let nl = new Newlines();
	nl.inserted = true;
	this.tokens.push(nl);
//LCMJHFUEM
	this.numToks++;
}//»
getWordSeq(){//«
	let list=[];
	let toks = this.tokens;
	let curnum = this.tokNum;
	let iter = 0;
	let tok;
	while((tok = toks[curnum+iter]) && tok.isWord){
		list.push(tok);
		iter++;
	}
	this.tokNum+=iter;
	return list;
}//»
curTok(add_num=0){return this.tokens[this.tokNum+add_num];}
nextTok(){//«
	this.tokNum++;
	return this.tokens[this.tokNum];
}//»
async scanNextTok(heredoc_flag) {//«
	let token = this.lookahead;
	this.scanner.scanComments();
	let next = await this.scanner.lex(heredoc_flag);
	this.hasLineTerminator = (token.lineNumber !== next.lineNumber);
	this.lookahead = next;
	return token;
};//»

eatBang(){//«
//log(this.tokens);
	let tok = this.tokens[this.tokNum];
	if (tok.isWord && tok.val.length===1 && tok.val[0]==="!"){
		this.tokNum++;
		return true;
	}
	return false;
}//»
nextLinesUntilDelim(delim){//«
	let out='';
	let rv = this.scanner.scanNextLineNot(delim);
	while (isStr(rv)){
		out+=rv+"\n";
		rv = this.scanner.scanNextLineNot(delim);
	}
	if (rv===true) return out;

/*SAYEJSLSJ
This hack of splicing the scanner's source text is needed in order to ensure that 
the saved string (finalComStr) does *not* include a repetition of the partial part.
This issue only ever happens when we editing a previously good heredoc delimeter token,
after scrolling back in the command history, so we end up doing one part "auto
heredoc parsing" (in this pathway), followed by another part of standard interactive
parsing.
*/
	this.scanner.spliceSource(out.length+1);//Is this 1 always needed to account for the newline

	return {partial: out};
//	return false;
}//»
getNextNonNewlinesTok(){//«
	let iter=0;
	let curnum = this.tokNum;
	let tok = toks[curnum];
	while (isNLs(tok)){
		iter++;
		tok = toks[curnum+iter];
	}
	return tok;
}//»
async getNonEmptyLineFromTerminal(){//«
	let rv;
//	while ((rv = await this.term.readLine("> ")).match(/^[\x20\t]*(#.+)?$/)){}
	while (rv = await this.term.readLine("> ")){
		if (isEOF(rv)) return rv;
		if (rv.match(/^[\x20\t]*(#.+)?$/)) continue
		return rv;
	}
}//»
async getMoreTokensFromTerminal(){//«
	let rv = await this.getNonEmptyLineFromTerminal();
	if (isEOF(rv)){
		return this.fatal("continue operation aborted");
	}
	let newtoks = await this.parseContinueStr(rv);
	if (isStr(newtoks)) this.fatal(newtoks);
	this.tokens = this.tokens.concat(newtoks);
	this.pushNewline();
	this.numToks = this.tokens.length;
}//»
eatRedirects(){//«
	let err = this.fatal;
	let tok = this.curTok();
	let list=[];
	while(tok && tok.isRedir){
		list.push(tok);
		this.tokNum++;
		tok = this.curTok();
	}
	return list;
}//»
async parseList(seq_arg){//«
	let seq = seq_arg || [];
	let andor = await this.parseAndOr();
	seq.push(andor);
	let next = this.curTok();
	let next1 = this.curTok(1);
//	if (!(next && next.isSepOp && this.isCommandStart(this.curTok(1)))) return {list: seq};
	if (!(next && next.isSepOp && next1 && next1.isCommandStart)) return {list: seq};
	seq.push(next.val);
	this.tokNum++;
	return this.parseList(seq);
}//»
async parseTerm(seq_arg){//«
	let seq = seq_arg || [];

/*
If we are interactive here, and we are at the end of the line with tokens,
shouldn't we insert a NEWLINE at the end???
*/

	let andor = await this.parseAndOr();
	seq.push(andor);
	let tok_num_hold = this.tokNum;
	let next = this.curTok();
	let use_sep;

	if (!next){
		if (this.eos()) this.unexpeof();
		else {
log(this.tokens);
			this.fatal("NO NEXT TOK AND NOT EOS!?!?!");
		}
	}
	if (next.isSepOp) {
		use_sep = next.val;
		this.tokNum++;
	}
	else if (next.isNLs) {
		use_sep = ";";
	}
	else {
		return {term: seq};
	}
	this.skipNewlines();
	next = this.curTok();
	if (!next){
		if (this.eos()) this.unexpeof();
		else if (!this.isInteractive) this.fatal("!NEXT && !isInteractive!?!?!?");
		await this.getMoreTokensFromTerminal();
		next = this.curTok();
	}
	if (!next.isCommandStart){
//	if (!this.isCommandStart(next)){
		this.tokNum = tok_num_hold;
		return {term: seq};
	}
	seq.push(use_sep);
	return this.parseTerm(seq);
}//»
async parseCompoundList(opts={}){//«
	let err = this.fatal;
	this.skipNewlines();
	if (this.isInteractive){
		if (this.eol()){
//Get more token...
			await this.getMoreTokensFromTerminal();
		}
	}
	else if (this.eos()){
		err(`syntax error: unexpected end of file`);
	}

	let term = await this.parseTerm();
	let next = this.curTok();
	if (!next) {
		term.term.push(";");
		return {compound_list: term}
	}
	if (next.isSepOp){
		term.term.push(next.val);
		this.tokNum++;
	}
	else if (isNLs(next)){
		term.term.push(";");
	}
	else if (opts.isSubshell && next.isSubEnd){
		term.term.push(";");
	}
	else if (opts.isBraceGroup && next.isRBrace){
		term.term.push(";");
	}
	else if (opts.isCase && next.isCaseItemEnd){
		term.term.push(";");
	}
	else{
		this.unexp(next);
	}
	this.skipNewlines();
	return {compound_list: term};
}//»

async parseFuncBody(){//«
//let comp_com = await this.parseCommand(true);
let comp_com = await this.parseCompoundCommand();
//if (comp_com===false){
//	let tok = this.curTok();
//	this.unexp(tok);
//}
/*Even though the spec says that a function_body is a compound_command [redirect_list],
we are already doing eatRedirects inside of parseCompoundCommand since all compound
commands take redirect lists.
*/
//let redirs = this.eatRedirects();
//Then get the bunch of redirections after it
return {function_body: {command: comp_com}};
}//»
async parseFuncDef(){//«
//log("PARSEFUNCDEF!?!?!?");
	let err=this.fatal;
	let fname = this.curTok();
	if (!(fname && fname.isWord)) err("function name token not found");
	this.tokNum++;
	let lparen = this.curTok();
//log("LPAREN", lparen);
	if (!(lparen && lparen.isSubStart)) err("'(' token not found");
	this.tokNum++;
	let rparen = this.curTok();
	if (!rparen){
		this.unexp("newline");
	}
	if (!rparen.isSubEnd) this.unexp(rparen);
//log("RPAREN", lparen);
	this.tokNum++;
	this.skipNewlines();
	let tok = this.curTok();
	if (!tok){
		if (this.eos()) this.unexpeof();
		if (!this.isInteractive) err("WTFFFFFF NOTTTTT INNNNTERRACTIVEEEEEEE &*(&*(");
		await this.getMoreTokensFromTerminal();
		tok = this.curTok();
	}
	let body = await this.parseFuncBody();
	return {type: "function_def", compound_command: {name: fname, body}};

}//»

async parseDoGroup(){//«

	let err = this.fatal;
	let tok = this.curTok();
	if (!(tok&&tok.isDo)){
		err(`'do' token not found!`);
	}
	this.tokNum++;
	let list = await this.parseCompoundList();
	tok = this.curTok();
	if (!(tok && tok.isDone)){
		err(`'done' token not found!`);
	}
	this.tokNum++;
//	return {do_group: list};
	return list;
}//»

async parseBraceGroup(){//«
	let err = this.fatal;
	let tok = this.curTok();
	if (!(tok && tok.isLBrace)) err(`'{' token not found!`);
	this.tokNum++;
	let list = await this.parseCompoundList({isBraceGroup: true});
	tok = this.curTok();
	if (!tok) this.unexpeof();
	if (!tok.isRBrace){
		this.unexp(tok);
	}
	this.tokNum++;
	return {type: "brace_group", compound_command: list};
}//»
async parseSubshell(){//«
	let err = this.fatal;
	let tok = this.curTok();
	if (!(tok && tok.isSubStart)) err(`'(' token not found!`);
	this.tokNum++;
	let list = await this.parseCompoundList({isSubshell: true});
	tok = this.curTok();
	if (!tok) this.unexpeof();
	if (!tok.isSubEnd){
		this.unexp(tok);
	}
	this.tokNum++;
	return {type: "subshell", compound_command: list};
}//»

async parseCasePatternList(seq_arg){//«

/*«
4. [Case statement termination]
When the TOKEN is exactly the reserved word esac, the token identifier for esac
shall result. Otherwise, the token WORD shall be returned.

pattern_list     :                  WORD    // Apply rule 4
                 |              '(' WORD    // Do not apply rule 4
                 | pattern_list '|' WORD    // Do not apply rule 4
                 ;

If you are just beginning a pattern list without a "(", then "esac" necessarily ends
the entire case_clause;

»*/
	let seq = seq_arg || [];
	let tok = this.curTok();
	if (!tok) this.unexpeof();
	if (!seq.length && tok.isEsac) return true;

	if (tok.isSubStart){
		if (seq.length){
			this.unexp(tok);
		}
		seq.push(tok);
		this.tokNum++;
	}
	tok = this.curTok();
	if (!tok){
		this.unexpeof();
	}
	if (!tok.isWord){
		this.unexp(tok);
	}
	seq.push(tok);
	tok = this.nextTok();
	if (!tok) this.unexp("newline");
	if (tok.isPatListEnd) return seq;// ')'
	if (!tok.isPatListSep) this.unexp(tok);
	this.tokNum++;
	return this.parseCasePatternList(seq);

}//»
async parseCaseItem(){//«

//isDSemi
//DSEMI ";;"

//isSemiAnd
//SEMI_AND ";&"

//case_item        : pattern_list ')' linebreak     DSEMI linebreak//«
//                 | pattern_list ')' compound_list DSEMI linebreak
//                 | pattern_list ')' linebreak     SEMI_AND linebreak
//                 | pattern_list ')' compound_list SEMI_AND linebreak
//                 ;//»

//case_item_ns     : pattern_list ')' linebreak//«
//                 | pattern_list ')' compound_list
//                 ;//»

let pattern_list = await this.parseCasePatternList();
if (pattern_list===true) return true;

let tok = this.curTok();
if (!tok){
	this.unexpeof();
}
if (!tok.isSubEnd){
	this.unexp(tok);
}
this.tokNum++;
this.skipNewlines();
tok = this.curTok();
if (!tok){
	if (this.eos()) this.unexpeof();
	else if (!this.isInteractive) this.fatal("WUT NOT EOS AND NOT INTERACTIVE JFD&*^#(");
	await this.getMoreTokensFromTerminal();
	tok = this.curTok();
}

let compound_list;
if (tok.isCommandStart){
//This one can end with a ";;" or ";&"
	compound_list = (await this.parseCompoundList({isCase: true})).compound_list.term;
//log(compound_list.compound_list);
}
tok = this.curTok();
if (!tok){
	this.unexpeof();
}
if (tok.isCaseItemEnd){
	this.tokNum++;
	this.skipNewlines();
	return {case_item: {pattern_list, compound_list, end: tok}};
}
return {case_item: {pattern_list, compound_list}};

}//»
async parseCaseList(seq_arg){//«
//case_list        : case_list case_item//«
//                 |           case_item
//                 ;//»
//case_list_ns     : case_list case_item_ns//«
//                 |           case_item_ns
//                 ;//»
let seq = seq_arg || [];
let item = await this.parseCaseItem();
if (item===true){//This *must* be a lone "esac"
	return seq;
}
else if (!item){
//This *probably* should already be an error in parseCaseItem
	this.fatal("WUT NO ITEM GOTTEN FROM PARSECASEITEM?!?!");
}
seq.push(item);
return this.parseCaseList(seq);

}//»
async parseCaseClause(){//«

//case_clause      : Case WORD linebreak in linebreak case_list    Esac//«
//                 | Case WORD linebreak in linebreak case_list_ns Esac
//                 | Case WORD linebreak in linebreak              Esac
//                 ;//»

/*«

The conditional construct case shall execute the compound-list corresponding to
the first pattern (see 2.14 Pattern Matching Notation ), if any are present,
that is matched by the string resulting from the tilde expansion, parameter
expansion, command substitution, arithmetic expansion, and quote removal of the
given word. The reserved word "in" shall denote the beginning of the patterns to
be matched. Multiple patterns with the same compound-list shall be delimited by
the '|' symbol. The control operator ')' terminates a list of patterns
corresponding to a given action. The terminated pattern list and the following
compound-list is called a case statement clause. Each case statement clause,
with the possible exception of the last, shall be terminated with either ";;"
or ";&". The case construct terminates with the reserved word esac (case
reversed).

The format for the case construct is as follows:

case word in
    [[(] pattern[ | pattern] ... ) compound-list terminator] ...
    [[(] pattern[ | pattern] ... ) compound-list]
esac

Where terminator is either ";;" or ";&" and is optional for the last compound-list.

In order from the beginning to the end of the case statement, each pattern that
labels a compound-list shall be subjected to tilde expansion, parameter
expansion, command substitution, and arithmetic expansion, and the result of
these expansions shall be compared against the expansion of word, according to
the rules described in 2.14 Pattern Matching Notation (which also describes the
effect of quoting parts of the pattern). After the first match, no more
patterns in the case statement shall be expanded, and the compound-list of the
matching clause shall be executed. If the case statement clause is terminated
by ";;", no further clauses shall be examined. If the case statement clause is
terminated by ";&", then the compound-list (if any) of each subsequent clause
shall be executed, in order, until either a clause terminated by ";;" is
reached and its compound-list (if any) executed or there are no further clauses
in the case statement. The order of expansion and comparison of multiple
patterns that label a compound-list statement is unspecified.

Exit Status

The exit status of case shall be zero if no patterns are matched. Otherwise, the exit status shall be the exit status of the compound-list of the last clause to be executed.

»*/


	let err = this.fatal;
	let tok = this.curTok();
	if (!(tok&&tok.isCase)){
		err(`'case' token not found!`);
	}
	this.tokNum++;
	tok = this.curTok();
	if (!tok || tok.isNLs){
		this.unexp("newline");
	}
	if (!tok.isWord) {
		this.unexp(tok);
	}
	let word = tok;
	this.tokNum++;
	this.skipNewlines();
	tok = this.curTok();
	if (!tok){
		if (this.eos()) this.unexpeof();
		if (!this.isInteractive) err("WHAT NOT EOS AND NOT INTERACTIVE WUT");
		await this.getMoreTokensFromTerminal();
		tok = this.curTok();
	}
	if (!tok.isIn) this.unexp(tok);
	this.tokNum++;
	this.skipNewlines();
	if (this.end()){
		if (this.eos()){
			this.unexpeof();
		}
		else if (!this.isInteractive) this.fatal("WUT NOT THIS EOS AND NOT THIS INTERACTIVE WUT UMMM");
		await this.getMoreTokensFromTerminal();
	}
	let list = await this.parseCaseList();
	tok = await this.curTok();
	if (!tok){
		this.unexpeof();
	}
	if (!tok.isEsac) this.unexp(tok);
	this.tokNum++;
	return {type: "case_clause", compound_command: {word, list}};
}//»

async parseUntilClause(){//«
	let err = this.fatal;
	let tok = this.curTok();
	if (!(tok&&tok.isUntil)){
		err(`'until' token not found!`);
	}
	this.tokNum++;
	let list = await this.parseCompoundList();
	tok = this.curTok();
	if (!tok) this.unexpeof();
/*«
	if (!tok){
		if (!this.isInteractive) this.unexpeof();
		await this.getMoreTokensFromTerminal();
		tok = this.curTok();
	}
*»*/
	if (!tok.isDo){
		this.unexp(tok);
	}
	let do_group = await this.parseDoGroup();
	return {type: "until_clause", compound_command: {condition: list, do_group}};
//*/
}//»
async parseWhileClause(){//«
	let err = this.fatal;
	let tok = this.curTok();
	if (!(tok&&tok.isWhile)){
		err(`'while' token not found!`);
	}
	this.tokNum++;
	let list = await this.parseCompoundList();
	tok = this.curTok();
	if (!tok) this.unexpeof();
/*«
	if (!tok){
		if (!this.isInteractive) this.unexpeof();
		await this.getMoreTokensFromTerminal();
		tok = this.curTok();
	}
»*/
	if (!tok.isDo){
		this.unexp(tok);
	}
	let do_group = await this.parseDoGroup();
//type: "", 
	return {type: "while_clause", compound_command: {condition: list, do_group}};
//*/
}//»
async parseForClause(){//«

let err = this.fatal;
let tok = this.curTok();

if (!(tok&&tok.isFor)){
	err(`'for' token not found!`);
}
this.tokNum++;

tok = this.curTok();
if (!tok || tok.isNLs){
this.unexp("newline");
}
if (!tok.isWord){
	this.unexp(tok);
}
let name = tok;
this.tokNum++;
tok = this.curTok();
if (!tok) {//«
	if (this.eos()){
		this.unexpeof();
	}
	else if (!this.isInteractive){
		err("NO CURTOK && NOT EOS && NOT INTERACTIVE?!?!?!?!? #(&**()");
	}
	else await this.getMoreTokensFromTerminal();
	tok = this.curTok();
}//»
let do_group;
let in_list;
if (tok.isDo){//«
	//for name do_group
	do_group = await this.parseDoGroup();
}//»
else if (tok.isSemi){//«
	//for name sequential_sep(";") do_group
	this.tokNum++;
	this.skipNewlines();
	if (this.isInteractive && this.eol()) await this.getMoreTokensFromTerminal();
	tok = this.curTok();
	if (!tok.isDo){
		this.unexp(tok);
	}
	do_group = await this.parseDoGroup();
}//»
else if (tok.isIn){//«
//for name linebreak(0 newlines) "in" [wordlist] sequential_sep do_group
	this.tokNum++;
	in_list = this.getWordSeq();
	this.eatSeqSep();
	do_group = await this.parseDoGroup();
}//»
else if (!tok.isNLs){//«
	this.unexp(tok);
}//»
else{//«
	this.skipNewlines();
	if (this.isInteractive && this.eol()) await this.getMoreTokensFromTerminal();
	else if (this.eos()) this.unexpeof();
	tok = this.curTok();
	if (tok.isDo){//«
		do_group = await this.parseDoGroup();
	}//»
	else if (tok.isIn){//«
		this.tokNum++;
		in_list = this.getWordSeq();
		this.eatSeqSep();
		do_group = await this.parseDoGroup();
	}//»
	else{//«
		this.unexp(tok);
	}//»
}//»

return {type: "for_clause", compound_command: {name, in_list, do_group}};

}//»
async parseElsePart(seq_arg){//«

let seq = seq_arg || [];
let err = this.fatal;
let tok = this.curTok();
if (!(tok && (tok.isElse||tok.isElif))){
	err(`could not find "elif" or "else"`);
}
this.tokNum++;
if (tok.isElse){
	let else_list = await this.parseCompoundList();
	return {elif_seq: seq, else_list};
}
let elif_list = await this.parseCompoundList();
tok = this.curTok();
if (!(tok && tok.isThen)){
	err(`'then' token not found!`);
}
this.tokNum++;
let then_list = await this.parseCompoundList();
seq.push({elif: elif_list, then: then_list});
tok = this.curTok();

if (tok&&(tok.isElif || tok.isElse || tok.isFi)){}
else{
	err(`could not find "elif", "else" or "fi"`);
}

if (tok.isFi){
	return {elif_seq: seq, then_list};
}

return this.parseElsePart(seq);

}//»
async parseIfClause(){//«

let err = this.fatal;
let tok = this.curTok();

if (!(tok&&tok.isIf)){
	err(`'if' token not found!`);
}
this.tokNum++;

//Is there a this.getMoreTokensFromTerminal in here???
let if_list = await this.parseCompoundList();
tok = this.curTok();
if (!(tok && tok.isThen)){
	err(`'then' token not found!`);
}
this.tokNum++;
let then_list = await this.parseCompoundList();
tok = this.curTok();
if (!(tok && (tok.isFi || tok.isElse || tok.isElif))){
	if (!tok) err(`unexpected EOF while looking for "fi", "elif" or "else"`);
	this.unexp(tok);
}
let else_part;
if (!tok.isFi){
	else_part = await this.parseElsePart();
//log(else_part);
	tok = this.curTok();
	if (!tok){
		err(`unexpected EOF while looking for "fi"`);
	}
	else if (!tok.isFi){
		this.unexp(tok);
	}
}
//curTok *MUST* be "fi"!?!?
this.tokNum++;
//return {if_clause: {if_list, then_list, else_part}};
return {type: "if_clause", compound_command: {if_list, then_list, else_part}};

}//»

async parseSimpleCommand(){//«

/*Get all 
- assignment words, plus 
- isHeredoc toks
- All other io_file: 
  one of: "<" "<&" ">" ">&" ">>" "<>" ">|"
  plus: word

*/

let err = this.fatal;
let toks = this.tokens;
//let have_comword;
let name;
let tok = toks[this.tokNum];
let assigns = [];
let redirs = [];
let args = [];
//JEEKSMD
while(tok){
	if (tok.isRedir) redirs.push(tok);
	else if (tok.isWord){//«
		if (!name) {
			if (tok.isAssignment){
				assigns.push(tok);
			}
			else{
				name = tok;
			}
		}
		else{
			args.push(tok);
		}
	}//»
	else{
//TEMNGSFDK
		if (tok.isSubStart) this.unexp(tok);
		break;
	}
	this.tokNum++;
	tok = toks[this.tokNum];
}
if (!name) return {redirs, simple_command: {assigns}};
return {redirs, simple_command: {assigns, name, args}};
//if (!name) return {simple_command: {assigns, redirs}};
//return {simple_command: {assigns, redirs, name, args}};

}//»
async parseCompoundCommand(){//«

let tok = this.curTok();
let com;

if (tok.isOp){//«
	if (!tok.isSubStart) this.unexp(tok);;
	com = await this.parseSubshell();
}//»
else if (tok.isResStart){//«
	let wrd = tok.toString();
	switch (wrd){
		case "if":
			com = await this.parseIfClause();
			break;
		case "{":
			com = await this.parseBraceGroup();
			break;
		case "for":
			com = await this.parseForClause();
			break;
		case "while":
			com = await this.parseWhileClause();
			break;
		case "until":
			com = await this.parseUntilClause();
			break;
		case "case":
			com = await this.parseCaseClause();
			break;
		default:
			this.fatal(`unknown reserved 'start' word: ${wrd} &^*^$#*& HKHJKH`);
//			this.unexp(tok);
	}
}//»
else{//«
	this.unexp(tok);
}//»

let redirs = this.eatRedirects();
com.redirs = redirs;
return com;

}//»
async parseCommand(force_compound){//«

let toks = this.tokens;
let err = this.fatal;
let tok = this.curTok();
//log("PARSECOM", force_compound, tok.toString());
//log("parseCommand");
//log(tok);
if (tok.isWord) {//«
	let wrd;
	if (tok.isRes) {
		if (tok.isResStart) return this.parseCompoundCommand();
		this.unexp(tok);
	}
	if (tok.isAssignment) {
		if (force_compound) return false;
		return this.parseSimpleCommand();
	}
	let tok1 = this.curTok(1);
	if (tok1 && tok1.isSubStart) {
//Want to ensure a certain level of "simplicity" to function names, i.e. they have
//no substitutions or newlines (maybe disallow $'...')
		if (force_compound) return false;
//log("FUNCDEF");
		return this.parseFuncDef();// blah(  or foo  (
	}
	if (force_compound) return false;
	return this.parseSimpleCommand();
}//»
else if(tok.isOp||tok.isRedir){//«
//	if (tok.isSubStart) return this.parseSubshell();
	if (tok.isSubStart) return this.parseCompoundCommand();
	if (tok.isRedir){
		if (force_compound) return false;
		return this.parseSimpleCommand();
	}
	this.unexp(tok.c_op);
}//»
else{//«
cwarn("WUD IS THIS BELOW!?!?!?!");
log(tok);
err("WHAT IS THIS NOT NEWLINE OR WORD OR OPERATOR?????????");
}//»

}//»

async parsePipeSequence(seq_arg){//«
	let err = this.fatal;
	let toks = this.tokens;
	let seq = seq_arg || [];
	let com = await this.parseCommand();
	seq.push(com);
	let next = this.curTok();
	if (!next||!next.isOp||next.val!=="|") return {pipe_sequence: seq};
	this.tokNum++;
	if (this.eol()){
		if (this.isInteractive){//refill our tank with new tokens
			await this.getMoreTokensFromTerminal();
		}
		else{//There are newlines in some kind of prewritten thing
			this.skipNewlines();
		}
	}
	else if (this.eos()){
		err(`syntax error: unexpected end of file`);
	}
//	else if (!this.isInteractive){//Bad: script or command substitution has ended...
//		err(`syntax error: unexpected end of file`);
//	}
//	else: We are interactive and have more tokens on this line
	return await this.parsePipeSequence(seq);
}//»
async parsePipeline(){//«
	let bang = this.eatBang();
	let pipeline = await this.parsePipeSequence();
	return {pipeline, bang};
}//»
async parseAndOr(seq_arg){//«
	let err = this.fatal;
	let seq = seq_arg || [];
	let pipe = await this.parsePipeline();
	seq.push(pipe);
	let next = this.curTok();
	if (next && next.isOp && (next.val==="&&"||next.val==="||")){}
	else {
		if (!next && this.isInteractive) {
			this.pushNewline();
		}
		return {andor: seq};
	}
	seq.push(next.val);
	this.tokNum++;
	if (this.eol()){
		if (this.isInteractive){//refill our tank with new tokens
			await this.getMoreTokensFromTerminal();
		}
		else{//There are newlines in some kind of prewritten thing
			this.skipNewlines();
		}
	}
//	else if (!this.isInteractive){//Bad: script or command substitution has ended...
	else if (this.eos()){//Bad: script or command substitution has ended...
		err(`syntax error: unexpected end of file`);
	}
//	else: We are interactive and have more tokens on this line
	return await this.parseAndOr(seq);
}//»
async parseCompleteCommand(){//«
	let toks = this.tokens;
	let list = await this.parseList();
	let listarr = list.list;
	let next = this.curTok();
	if (next && next.isSepOp){
		listarr.push(next.val);
		this.tokNum++;
	}
	else if (listarr.length){
//Semi-colon insertion
		let val = listarr[list.length-1];
		if (!(val===";"||val==="&")) listarr.push(";");
	}
	return {complete_command: list};
}//»
async parseCompleteCommands(){//«
	let toks = this.tokens;
	let comp_com = await this.parseCompleteCommand();
	let comp_coms = [comp_com];
	this.skipNewlines();
	while (!this.end()){
		comp_com = await this.parseCompleteCommand();
		comp_coms.push(comp_com);
		this.skipNewlines();
	}
	return {complete_commands: comp_coms};
}//»

async compile(){//«
let toks = this.tokens;

this.skipNewlines();
let complete_coms = await this.parseCompleteCommands();
this.skipNewlines();
if (!this.end()){
	this.fatal("compilation failed");
}
return {program: complete_coms};

}//»
async parseContinueStr(str){//«

let parser = new Parser(str.split(""), {
	mainParser: this,
	term: this.term,
	heredocScanner: this.heredocScanner,
	env: this.env,
	isInteractive: true,
	isContinue: true,
});
let newtoks, comstr_out;
try {
	let errmess;
	await parser.scanNextTok();
	await parser.tokenize();
	let newtoks = parser.tokens;
	return newtoks;
}
catch(e){
cerr(e);
	return e.message;
}

}//»
async tokenize(){//«
	let toks = [];
	let next = this.lookahead;
	let heredocs;
	let heredoc_num;
	let cur_heredoc_tok;
	let cur_heredoc;
	let interactive = this.isInteractive;
	TOKENIZE_LOOP: while (next.type !== EOF_Type) {

//If !heredocs && next is "<<" or "<<-", we need to:
		if (heredocs && isNLs(next)){//«
			while (heredocs.length){
				let heredoc = heredocs.shift();
				let rv = this.nextLinesUntilDelim(heredoc.delim);
				if (isStr(rv)){
					heredoc.tok.value = rv;
					continue;
				}
				if (!interactive) return this.fatal("warning: here-document at line ? delimited by end-of-file");
				if (isObj(rv) && isStr(rv.partial)){
					heredoc.tok.partial = rv.partial;
					heredocs.unshift(heredoc);
					break TOKENIZE_LOOP;
				}
				return this.fatal(`error parsing the interactive heredoc (looking for "${heredoc.delim}")`);
			}
			this.scanner.index--;
			heredocs = null;
		}//»
		else if (cur_heredoc_tok){//«
			if (next.isWord){//«
				if (!heredocs) {
					heredocs = [];
					heredoc_num = 0;
				}
				cur_heredoc_tok.delim = next.toString();
				heredocs.push({tok: cur_heredoc_tok, delim: next.toString()});	
				cur_heredoc_tok = null;
			}//»
			else{//«
				if (isNLs(next)){
					this.unexp("newline");
				}
				else if (next.r_op || next.c_op){
					this.unexp(next);
				}
				else{
cwarn("Whis this non-NLs or r_op or c_op????");
					log(next);
					throw new Error("WUUTTTTTTTTT IZZZZZZZZZ THISSSSSSSSS JKFD^&*$% (see console)");
				}
			}//»
		}//»
		else if (next.type==="r_op" && (next.r_op==="<<" || next.r_op==="<<-")){//«
			toks.push(next);
			cur_heredoc_tok = next;
		}//»
		else {//«
				toks.push(next);
		}//»
		await this.scanNextTok(!!heredocs);
		next = this.lookahead;

	}

	let heredocs_str = null;

	if (heredocs){//«
		if (!interactive) this.fatal("warning: here-document at line ? delimited by end-of-file");
		for (let i=0; i < heredocs.length; i++){
			let heredoc = heredocs[i];
			let rv = await this.heredocScanner(heredoc.delim);
if (rv===EOF){
this.fatal("aborted");
}
			if (heredoc.tok.partial) {
				heredoc.tok.value = heredoc.tok.partial + rv.join("\n");
			}
			else {
				heredoc.tok.value = rv.join("\n");
			}

			if (heredocs_str === null) heredocs_str = "\n"+heredoc.tok.value;
			else heredocs_str += "\n"+heredoc.tok.value;
			heredocs_str += `\n${heredoc.delim}`;
		}
		heredocs = null;
	}//»
	if (cur_heredoc_tok){//«
		this.fatal("syntax error near unexpected token 'newline'");
	}//»
//YJDHSLFJS

	for (let i=0; i < toks.length; i++){//«
		let tok = toks[i];
		if (!tok.isRedir) {
			continue;
		}
		let next = toks[i+1];
		let rop = tok.r_op;
		if (tok.isHeredoc){//«
			toks[i] = new Stdin(tok);
			toks[i].isHeredoc = true;
		}//»
		else if (OK_OUT_REDIR_TOKS.includes(rop)){//«
			if (!next) this.unexp("newline");
			if (!next.isWord) this.unexp(next);
			toks[i] = new Stdout(tok, next);
			toks.splice(i+1, 1);
		} //»
		else if (OK_IN_REDIR_TOKS.includes(rop)) {//«
			if (!next) this.unexp("newline");
			if (!next.isWord) this.unexp(next);
			toks[i] = new Stdin(tok, next);
			toks.splice(i+1, 1);
		}//»
		else this.fatal(`unsupported operator: '${rop}'`);
	}//»
	if (this.isInteractive) {
//The partial part can be in both the scanner source *AND* the heredocs_str.
		if (!this.mainParser.finalComStr) {
//AGRHSORJF
			this.mainParser.finalComStr = this.scanner.source.join("");
		}
		else this.mainParser.finalComStr += "\n"+this.scanner.source.join("");
		if (heredocs_str !== null){
			this.mainParser.finalComStr += heredocs_str;
		}
	}
	this.tokens = toks;
	this.numToks = toks.length;
	return true;

}//»

};

//»
//Shell«
class Shell {

constructor(term){//«
	this.term = term;
	this.env = term.env;
	this.cancelled = false;
}//»

fatal(mess){throw new Error(mess);}
async expandComsub(tok, opts){//«
	const{term}=this;
	const err=(mess)=>{
		term.response(mess, {isErr: true});
	};
	let arr = tok.raw.split("");   //Should use the raw here!!!
//	let arr = tok.val;
	let s = '';
	let len = arr.length;
	for (let i=0; i < len; i++){
		let ch = arr[i];
		if (ch==="\\" && arr[i+1]==="\\"){
			s+="\\";
			i++;
		}
		else if (ch==="\\" && arr[i+1]==="`"){
			s+="`";
			i++;
		}
		else{
//PZUELFJ
//log(ch);
			s+=ch;
		}
	}
	if (s.match(/^\W*$/)) {
		return "";
	}
	let sub_lines = [];
	try{
//log(this.parser);
		let rv = await this.execute(s, {
//XMSKSLEO
			mainParser: this.parser.mainParser,
			subLines: sub_lines,
			env: sdup(this.env),
			shell: this,
			term: this.term
		});
		return sub_lines.join("\n");
	}
	catch(e){
cerr(e);
		err(e.message);
		return "";
	}
}//»

curlyExpansion(tok, from_pos){//«
//const curly_expansion = (tok, from_pos) => {

const arr = tok.val;
let ind1 = arr.indexOf("{", from_pos);
let ind2 = arr.lastIndexOf("}");

if (ind1 >= 0 && ind2 > ind1) {//«
//We know these aren't escaped, but they *might* be inside of quotes
let qtyp=null;
let curly_arr;
let start_i;
let final_i;
let have_comma = false;
let have_dot = false;
let have_quote = false;
let have_escape = false;
let comma_arr;
let num_open_curlies = 0;
for (let i=from_pos; i < arr.length; i++){//«

let ch = arr[i];
if (!qtyp){//«
	if (["'",'"','`'].includes(ch)) {
		qtyp = ch;
		have_quote = true;
	}
	else if (ch==="{" && (i===0 || arr[i-1] !== "$")){
		num_open_curlies++;
		if (num_open_curlies === 1 && !curly_arr) {
			start_i = i;
			curly_arr = [];
			continue;
		}
	}
	else if (ch==="}"){
		num_open_curlies--;
		if (num_open_curlies === 0 && curly_arr){
			final_i =  i;
			break;
		}
	}
}//»
else if (qtyp===ch) qtyp=null;

if (curly_arr) {//«
	if (!qtyp){
		if (ch===",") {
			have_comma = true;
			if (num_open_curlies===1){
				if (!comma_arr) comma_arr = [];
				comma_arr.push([...curly_arr]);
				curly_arr = [];
				continue;
			}
		}
		else {
			if (!have_dot) have_dot = ch === ".";
			if (!have_escape) have_escape = ch.escaped;
		}
	}
	curly_arr.push(ch);
}//»

}//»

if (comma_arr){
	comma_arr.push([...curly_arr]);
}

if (!final_i){//«
	if (Number.isFinite(start_i)){
		if (start_i+2 < arr.length){
			return curly_expansion(tok, start_i+1);
		}
		else{
//cwarn("GIVING UP!");
		}
	}
	else{
//log("NOT OPENED");
	}
	return tok;
}//»
else{//«

let pre = arr.slice(0, start_i);
let post = arr.slice(final_i+1);
if (comma_arr){//«
	let words=[];
	for (let comarr of comma_arr){
		let _word = new Word(tok.start, tok.par, tok.env);
		let word = _word.val;
		for (let ent of pre){
			if (isStr(ent)) word.push(ent);
			else word.push(ent.dup());
		}
		for (let ent of comarr){
			if (isStr(ent)) word.push(ent);
			else word.push(ent.dup());
		}
		for (let ent of post){
			if (isStr(ent)) word.push(ent);
			else word.push(ent.dup());
		}
		words.push(_word);
	}

	return words;
}//»
else if (have_dot&&!have_quote&&!have_escape){//«
//The dot pattern is a very strict, very literal pattern
let cstr = curly_arr.join("");
let marr;
let from, to, inc, is_alpha;

let min_wid=0;
if (marr = cstr.match(/^([-+]?\d+)\.\.([-+]?\d+)(\.\.([-+]?\d+))?$/)){//«
//cwarn("NUMS",marr[1], marr[2], marr[4]);

//We're supposed to look for '0' padding on the from/to
	let min_from_wid=0;
	let from_str = marr[1].replace(/^[-+]?/,"");
	if (from_str.match(/^(0+)/)) min_from_wid = from_str.length;

	let min_to_wid=0;
	let to_str = marr[2].replace(/^[-+]?/,"");
	if (to_str.match(/^(0+)/)) min_to_wid = to_str.length;

	if (min_from_wid > min_to_wid) min_wid = min_from_wid;
	else min_wid = min_to_wid;

	from = parseInt(marr[1]);
	to = parseInt(marr[2]);
	inc = marr[4]?parseInt(marr[4]):1;
}
else if (marr = cstr.match(/^([a-z])\.\.([a-z])(\.\.([-+]?\d+))?$/i)){
//cwarn("ALPHA",marr[1], marr[2], marr[4]);
	is_alpha = true;
	from = marr[1].charCodeAt();
	to = marr[2].charCodeAt();
	inc = marr[4]?parseInt(marr[4]):1;
}
else{
	return tok;
}//»

inc = Math.abs(inc);

let vals=[];
let iter=0;
//log(from, to);
if (from > to){
	for (let i=from; i >= to; i-=inc){
	iter++;
	if (iter > 10000) throw new Error("INFINITE LOOP AFTER 10000 iters????");
		if (is_alpha) vals.push(String.fromCharCode(i));
		else vals.push(((i+"").padStart(min_wid, "0")));
	}
}
else {
	for (let i=from; i <= to; i+=inc){
	iter++;
	if (iter > 10000) throw new Error("INFINITE LOOP AFTER 10000 iters????");
		if (is_alpha) vals.push(String.fromCharCode(i));
		else vals.push(((i+"").padStart(min_wid, "0")));
	}
}


let words=[];
for (let val of vals){
	let _word = new Word(tok.start, tok.par, tok.env);
	let word = _word.val;
	for (let ent of pre){
		if (isStr(ent)) word.push(ent);
		else word.push(ent.dup());
	}
	word.push(val);
	for (let ent of post){
		if (isStr(ent)) word.push(ent);
		else word.push(ent.dup());
	}
	words.push(_word);
}

	return words;


}//»
else{
//log("NOTHING");
return tok;
}
}//»

}//»
else{//«
	if (ind1<0 && ind2 < 0) {
//log("NO CURLIES");
	}
	else if (ind1 >= 0 && ind2 >= 0){
//log("BOTH CURLIES DETECTED IN WRONG POSITOIN");
	}
	else if (ind1 >= 0) {
//log("OPEN CURLY ONLY");
	}
	else if (ind2 >= 0){
//log("CLOSE CURLY ONLY");
	}
	return tok;
}//»

}//»

async filepathExpansion(tok, cur_dir){//«
/*«
First we need to separate everything by "/" (escapes or quotes don't matter)


Create a pattern string by removing quotes. 

- For every non-escaped ".", "*", "?", "[" or "]" in quotes, put an escape before it. 

- For every non-escaped '.', put an escape before it.
- For every non-escaped '*', put a '.' before it.
- For every non-escaped '?', replace it with a "."

//											  v----REMOVE THIS SPACE!!!!
let fpat = nm.replace(/\./g,"\\.").replace(/\* /g, ".*").replace(/\?/g, ".");

»*/
//WOSLMVHFK
const do_dirs=async(dirs, parr, is_init)=>{//«

let nm = parr.shift();
let parr_len = parr.length;
if (!nm) {
	for (let i=0; i < dirs.length; i++){
		dirs[i]=dirs[i]+"/";
	}
	if (!parr_len) return dirs;
	return await do_dirs(dirs, parr);
}
let is_dot = (nm[0]==="\\"&&nm[1]===".");
let files_ok = !parr.length;
let new_paths=[];
for (let i=0; i < dirs.length; i++){
	let dirname = dirs[i];
//log("DIRNAME", dirname);
	let dir_str = start_dir+"/"+dirname;
	let dir = await fsapi.pathToNode(dir_str);
	let kids = dir.kids;
	if (!kids) continue;
	let keys = Object.keys(kids);
	if (nm.match(/[*?]/)||nm.match(/\[[-0-9a-z]+\]/i)) {
//													  v----REMOVE THIS SPACE
//		let fpat = nm.replace(/\./g,"\\.").replace(/\* /g, ".*").replace(/\?/g, ".");
		try{ 
log(`^${nm}$`);

			let re = new RegExp(`^${nm}$`);
			for (let key of keys){
				if (!is_dot && key[0]===".") continue;
				if (re.test(key)){
					let node = kids[key];
					if (!node) continue;
					if (!files_ok && node.appName!==FOLDER_APP) continue;
//					if (key==="."||key==="..") continue;
					if (dirname) new_paths.push(`${dirname}/${key}`);
					else new_paths.push(key);
				}
			}
		}
		catch(e){
cerr(e);
			continue;
		}
	}
	else{
		let node = kids[nm];
		if (!node) continue;
		if (!files_ok && node.appName!==FOLDER_APP) continue;
		if (nm==="."||nm==="..") continue;
		if (dirname) new_paths.push(`${dirname}/${nm}`);
		else new_paths.push(nm);
//		new_paths.push(`${dirname}/${nm}`);
	}
}
if (!parr_len) return new_paths;
return await do_dirs(new_paths, parr);

};//»
//const filepath_expansion=async(tok, cur_dir)=>{
let arr = tok.val;
//EPRORMSIS
if (!(arr.includes("*")||arr.includes("?")||arr.includes("["))) return tok;
//log(tok);
//log(arr);
let patstr='';
let parr;
let qtyp;
let path_arr=[];

for (let ch of arr){//«
if (ch=="/"){
	path_arr.push(patstr);
	patstr='';
	continue;
}
if (ch==="'"||ch==='"'){
	if (!qtyp) qtyp = ch;
	else if (qtyp===ch) qtyp=null;
	else patstr+=ch;
	continue;
}
else if (qtyp){
//XMJFGRTU
	if ([".", "*","?","[","]"].includes(ch)) patstr+="\\";
	patstr+=ch;
}
else if (ch==="."){
	patstr+='\\.';
}
else if (ch==="*"){
	patstr+='.*';
}
else if (ch==="?"){
	patstr+='.';
}
else {
	if (ch instanceof String){
//EORKTIG
		patstr+=ch.toString();
	}
	else patstr+=ch;
}

}//»

if (patstr){
	path_arr.push(patstr);
}
let start_dir;
let parr0 = path_arr[0];
let path_len = path_arr.length;
if (!parr0) start_dir = "/";
else start_dir = cur_dir;
let dirs=[""];
let rv = await do_dirs(dirs, path_arr, true);
if (rv.length) {
let words = [];
let {start}=tok;
for (let val of rv){
let word = new Word(start);
word.val=[...val];
words.push(word);
}
//log(words);
return words;
}
return tok;
};//»

async getStdinLines(in_redir, haveSubLines){//«
//const get_stdin_lines = async(in_redir, term, haveSubLines) => 
//const get_stdin_lines = async(in_redir, term, heredocScanner, haveSubLines) => {
const{term}=this;
let stdin;
let red = in_redir[0];
let val = in_redir[1];
if (red==="<"){
	let node = await val.toNode(term);
	if (!node) {
		return `${val}: no such file or directory`;
	}
	if (!node.isFile){
		return `${val}: not a regular file`;
	}
	let rv = await node.text;
	if (!isStr(rv)){
		return `${val}: an invalid value was returned`;
	}
	stdin = rv.split("\n");
}
else if (red==="<<<"){
	stdin = [val];
}
else if (red==="<<"){
/*
	if (!heredocScanner){
		if (haveSubLines){
			return "heredocs are not implemented within command substititions";
		}
		else{
			return "no 'heredocScanner' was found! (this error should not exist djkljk*&*[}#$JKF)";
		}
	}
*/
	return val.split("\n");
}
return stdin;
}//»
async allExpansions(arr, shopts={}, opts={}){//«
//log(arr[1].val[0]);
const{env,scriptName,scriptArgs} = shopts;
const{term}=this;
const{isAssign}=opts;
for (let k=0; k < arr.length; k++){//«
	let tok = arr[k];
	if (tok instanceof Word){
		tok.dsSQuoteExpansion();
	}
}//»
if (!isAssign) {
for (let k=0; k < arr.length; k++){//curlies«
let tok = arr[k];
if (tok.isWord) {
//	let rv = curly_expansion(tok, 0);
	let rv = this.curlyExpansion(tok, 0);
	if (rv !== tok){
		arr.splice(k, 1, ...rv);
		k--;//Need to revisit the original position, in case there are more expansions there
	}
}
}//»
}
for (let k=0; k < arr.length; k++){//tilde«
	let tok = arr[k];
	if (tok instanceof Word) tok.tildeExpansion();
}//»
for (let k=0; k < arr.length; k++){//command sub«
	let tok = arr[k];
	if (tok.isWord) {
//		await tok.expandSubs(this, term, env, scriptName, scriptArgs);
		await tok.expandSubs(this, term, shopts);
	}
}//»
for (let k=0; k < arr.length; k++){//field splitting«
	let tok = arr[k];
	if (tok.isWord) {
		if (isAssign){
			tok.val=tok.fields.join("\n");
		}
		else {
			let{start} = tok;
			let words = [];
			for (let field of tok.fields){
				let word = new Word(start);
				word.val = [...field];
				words.push(word);
			}
			arr.splice(k, 1, ...words);
			k+=words.length-1;
		}
	}
}//»
for (let k=0; k < arr.length; k++){//filepath expansion/glob patterns«

let tok = arr[k];
if (tok.isWord) {
	let rv = await this.filepathExpansion(tok, term.cur_dir);
	if (isStr(rv)){
		term.response(rv, {isErr: true});
		continue;
	}
	if (rv !== tok){
		arr.splice(k, 1, ...rv);
	}
}

}//»
for (let k=0; k < arr.length; k++){//quote removal«
	let tok = arr[k];
	if (tok.isWord) {
		tok.quoteRemoval();
	}
}//»
return arr;
}//»
async tryImport(com, comword){//«
//If we have a string rather than a function, do the command library importing routine.
//The string is always the name of the library (rather than the command)
//This happens when: 
//1) libraries are defined in ShellMod.preloadLibs, and 
//2) this is the first invocation of a command from one of those libraries.
	try{
//		await ShellMod.util.importComs(com);//com is the library name
		await import_coms(com);//com is the library name
		if (this.cancelled) return;
	}catch(e){
		if (this.cancelled) return;
cerr(e);
		return `sh: command library: '${com}' could not be loaded`;
	}
	let gotcom = shellmod.activeCommands[comword];
	if (!(gotcom instanceof Function)){
		return `sh: '${comword}' is invalid or missing in command library: '${com}'`;
	}
	return gotcom;
}//»

makeCompoundCommand(com, opts, parentCommand){//«
	let typ = com.type;
	let comp = com.compound_command;
	if (typ === "if_clause") {//«
		let if_list = comp.if_list;
		let then_list = comp.then_list;
		let conditions = [if_list.compound_list.term];
		let consequences = [then_list.compound_list.term];
		let fallback;
		let else_part = comp.else_part;
		if (else_part){
			let elif_seq = else_part.elif_seq;
			if (elif_seq){
				while (elif_seq.length){
					let elif = elif_seq.shift();
					conditions.push(elif.elif.compound_list.term);
					consequences.push(elif.then.compound_list.term);
				}
			}
			fallback = else_part.else_list.compound_list.term;
		}
		return new IfCom(this, opts, conditions, consequences, fallback, parentCommand);
	}//»
	if (typ === "brace_group") return new BraceGroupCom(this, opts, comp.compound_list.term, parentCommand);
	if (typ === "subshell") return new SubshellCom(this, opts, comp.compound_list.term, parentCommand);
	if (typ === "for_clause") return new ForCom(this, opts, comp.name, comp.in_list, comp.do_group.compound_list.term, parentCommand);
	if (typ === "case_clause") return new CaseCom(this, opts, comp.word, comp.list, parentCommand);
	if (typ === "while_clause") return new WhileCom(this, opts, comp.condition.compound_list.term, comp.do_group.compound_list.term, parentCommand);
	if (typ === "until_clause") return new UntilCom(this, opts, comp.condition.compound_list.term, comp.do_group.compound_list.term, parentCommand);
	if (typ === "function_def") return new FunctionCom(this, opts, comp.name, comp.body.function_body.command, parentCommand);
	this.fatal(`What Compound Command type: ${type}`);
}//»

async makeCommand({assigns=[], name, args=[]}, opts, parentCommand){//«
	const{term}=this;
	const {loopNum, scriptOut, stdin, stdinLns, outRedir, scriptArgs, scriptName, subLines, heredocScanner, env, isInteractive}=opts;
	let comobj, usecomword;
	let rv
	let use_env;
	if (assigns.length) {
		rv = await this.allExpansions(assigns, opts, {isAssign: true});
		if (isStr(rv)) return `sh: ${rv}`;
		use_env = name?sdup(env):env;
		rv = add_to_env(assigns, use_env, {term});
		if (rv.length) term.response(rv.join("\n"), {isErr: true});
	}
	else use_env = env;
	const com_env = {//«
		loopNum,
		stdin,
		stdinLns,
		outRedir,
		isSub: !!subLines,
		scriptOut,
		term,
		env: use_env,
		command_str: this.commandStr,
		shell: this,
		scriptArgs,
		scriptName,
	}//»
	if (!name) {
		return new NoCom(com_env);
	}
	let arr = [name, ...args];
	rv = await this.allExpansions(arr, opts);
	if (isStr(rv)) return `sh: ${rv}`;
	{
		let hold = arr;
		arr = [];
		for (let arg of hold) {
			arr.push(arg.toString());
		}
	}
	let comword;
	while (arr.length){
		comword = arr.shift();
		if (comword === undefined) continue;
		break;
	}
	if (comword === undefined){
		return new NoCom(com_env);
	}
	if (ALIASES[comword]){//«
//	if (ShellMod.var.aliases[comword]){
//Replace with an alias if we can
//This should allow aliases that expand with options...
//		let alias = ShellMod.var.aliases[comword];
		let alias = ALIASES[comword];
		let ar = alias.split(/\x20+/);
		alias = ar.shift();
		if (ar.length){
			arr.unshift(...ar);
		}
		usecomword = alias;
	}//»
	else usecomword = comword;
	if (usecomword=="exit"||usecomword=="return"){//«
		let code;
		if (usecomword=="return" && !opts.isFunc){
			return make_sh_err_com(comword, "can only `return' from a function", com_env);
		}
		if (usecomword=="exit" && opts.isInteractive){
			term.response("sh: not exiting the toplevel shell", {isWrn: true});
			code = E_ERR;
		}
		else {		
			let numstr = arr.shift();
			if (numstr && !arr.length){
				if (!numstr.match(/^-?[0-9]+$/)) term.response(`sh: ${usecomword}: numeric argument required`, {isErr: true});
				else code = parseInt(numstr);
			}
			else if (arr.length) {
				term.response(`sh: ${usecomword}: too many arguments`, {isErr: true});
			}
			if (!Number.isFinite(code)) code = E_ERR;
		}
		code = new Number(code);
		code.breakStatementLoop = true;
		return code;
	}//»
//	let com = Shell.activeCommands[usecomword];
	let com = shellmod.activeCommands[usecomword];
//log(`COM: <${com}>`);
	if (com && isStr(com)){//QKIUTOPLK«
		com = await this.tryImport(com, usecomword);
		if (this.cancelled) return;
		if (isStr(com)) return com;
	}//»
	if (term.funcs[usecomword]){//«
		com_env.isFunc = true;
		let newopts = sdup(opts);
		delete newopts.isInteractive;
		newopts.isFunc = true;
		let func = term.funcs[usecomword](this, arr, newopts, com_env);
		func.isFunc = true;
		return func;
	}//»
	if (!com) {//Command not found!«
//Need to do this for matching stuff
		if (comword) comword = comword.toString();
		else comword = new String("");
		return make_sh_err_com(comword, `command not found`, com_env);
	}//»
	let com_opts;
//	let gotopts = com.opts || Shell.activeOptions[usecomword];
//	let gotopts = (com.getOpts && com.getOpts()) || Shell.activeOptions[usecomword];
	let gotopts = (com.getOpts && com.getOpts()) || shellmod.activeOptions[usecomword];
//log(gotopts);
//Parse the options and fail if there is an error message
//OEORMSRU
	if (gotopts === true) com_opts = {};
	else {
		rv = get_options(arr, usecomword, gotopts);
		if (rv[1]&&rv[1][0]) {
			return make_sh_err_com(comword, rv[1][0], com_env);
		}
		com_opts = rv[0];
	}
	try{//«new Com
		comobj = new com(usecomword, arr, com_opts, com_env, parentCommand);
		comobj.scriptOut = scriptOut;
		comobj.subLines = subLines;
		return comobj;
	}
	catch(e){
cerr(e);
//VKJEOKJ
//As of 11/26/24 This should be a 'com is not a constructor' error for commands
//that have not migrated to the new 'class extends Com{...}' format
		return make_sh_err_com(usecomword, e.message, com_env);
	}//»
//SKIOPRHJT
}//»

async makeScriptCom(com_ast, comopts, parentCommand){//«
	const{term}=this;
	const mkerr=(mess)=>{
		return make_sh_err_com(comword, mess, com_env);
	};
	let com;
	let simp_com = com_ast.simple_command;
	let comword = simp_com.name.toString();
	let com_env = {term, shell: this};
	let node = await fsapi.pathToNode(normPath(comword, term.cur_dir));

	if (!node) return mkerr(`file not found`);

	let app = node.appName;
	let err;
	if (app===FOLDER_APP) err = `is a directory`;
	else if (app!==TEXT_EDITOR_APP) err = `not a text file`;
	else if (!comword.match(/\.sh$/i)) err = `only executing files with '.sh' extension`;

	if (err) return mkerr(err);

	let text = await node.text;
	if (!text) return mkerr(`no text returned`);
	
	let rv = await this.compile(text, {
		retErrStr: true,
//SEYIAW
		mainParser: comopts.shell.parser.mainParser,
	});
	if (isStr(rv)) return mkerr(rv);
	if (!isArr(rv) && rv[0].andor){
		return mkerr(`Unknown value return from shell.compile`);
	}
	comopts.scriptName = comword;
	comopts.scriptArgs = simp_com.args;
//SAKROAP
	delete comopts.isInteractive;
	com = await this.makeCompoundCommand({type: 'subshell', redirs:[], compound_command: {compound_list: {term: rv}}}, comopts)
	com.isScript = true;
	return com;
}//»

async executePipeline(pipe, loglist, loglist_iter, opts, parentCommand, in_background){//«
	const{term}=this;
	let lastcomcode;
	let {stdin: optStdin, env}=opts;
//	let in_background = false;
	let pipelist = pipe.pipe;
	if (!pipelist){
		return `sh: pipeline list not found!`;
	}
	let pipetype = pipe.type;
	let pipeline = [];
	let hasBang = pipe.hasBang;
	let prev_com; // Renamed last_com -> prev_com?
	for (let j=0; j < pipelist.length; j++) {//«
		let com_ast = pipelist[j];
		let com;

//DNGZXER
		let in_redir, out_redir;
		let redirs = com_ast.redirs||[];
		for (let red of redirs){
			if (red.isStdin) in_redir = red;
			else if (red.isStdout) out_redir = red;
			else{
cwarn("Here is the non stdin/stdout redir");
log(red);
				this.fatal("Unknown token in com_ast.redirs!?!?! (see console)");
			}
		}
//		let stdin;
		let errmess;
		let redir_in_arr;
		if (in_redir){
			let rv2 = await in_redir.setValue(this, term, opts);
			if (isStr(rv2)){
				errmess = rv2;
			}
			else{
//				stdin = in_redir.value;
				redir_in_arr = in_redir.value.split("\n");
//log(redir_in_arr);
//log(stdin);
			}
		}
//VOPDUKKD
//		let have_lines = opts.stdinLns;
		let comopts = sdup(opts);
/*
		if (isStr(stdin)) comopts.stdin = stdin;
		else comopts.stdin = optStdin;
		if (isStr(comopts.stdin)){
			if (have_lines) comopts.stdinLns = have_lines;
			else comopts.stdinLns = comopts.stdin.split("\n");
		}
		comopts.outRedir = out_redir;
*/
//log(out_redir);
		comopts.inBackground = in_background;

		if (com_ast.simple_command && com_ast.simple_command.name && com_ast.simple_command.name.toString().match(/\x2f/)){
			com = await this.makeScriptCom(com_ast, comopts, parentCommand);
		}
		else if (errmess){
			com = make_sh_err_com(null, errmess, {term, shell: this});
		}
		else if (com_ast.compound_command){
			com = await this.makeCompoundCommand(com_ast, comopts, parentCommand)
		}
		else if (com_ast.simple_command){
			com = await this.makeCommand(com_ast.simple_command, comopts, parentCommand);
			if (com.breakStatementLoop === true) return com;
		}
		else{//«
cwarn("Here is the command");
log(com_ast);
			this.fatal("What type of command is this (not 'simple' or 'compound'!!! (see console))");
		}//»

		if (this.cancelled) return;
		if (isStr(com)) return com;
//FSHSKEOK
		if (redir_in_arr){
			com.initRedirInBuffer(redir_in_arr);
		}
		if (out_redir){
			com.initRedirOutBuffer(out_redir);
		}
		if (prev_com){
			com.initPipeInBuffer();
			prev_com.nextCom = com;
			prev_com.pipeTo = true;
		}
		if (j > 0) {
			com.pipeFrom = true;
			com.prevCom = prev_com;
		}
		com.inBackground = in_background;
		pipeline.push(com);
		prev_com = com;
	}//»
	this.pipeline = pipeline;

for (let com of pipeline){//«
	await com.init();
	if (this.cancelled) return;
}//»
for (let com of pipeline){//«
	if (!com.killed) com.run();//CWJKOI
	else{
log(`Not running (was killed): ${com.name}`);	
	}
}//»
for (let com of pipeline){//«
	lastcomcode = await com.awaitEnd;
//XJPMNYSHK
	if (this.cancelled) {
//		return;
		continue;
	}
//log(lastcomcode);
	if (!(isNum(lastcomcode))) {
		if (isLoopCont(lastcomcode)){
			return {code: lastcomcode, breakLoop: true};
		}
		if (isLoopBreak(lastcomcode)){
			if (lastcomcode.abortScript) return {code: lastcomcode, breakStatementLoop: true};
			return {code: lastcomcode, breakLoop: true};
		}
		lastcomcode = E_ERR;
	}
//	if (!com.redirLines) continue;
	if (!com.haveRedirOut) continue;


//	let rv = await com.outRedir.write(term, com.redirLines, env, ShellMod.var.allowRedirClobber)
//	let rv = await com.outRedir.write(term, com.redirLines, env)
	let rv = await com.writeOutRedir(term, env)
//	if (this.cancelled) return;
	if (this.cancelled) continue;
	if (rv===true) continue;
	if (isStr(rv)) term.response(`sh: ${rv}`, {isErr: true});
	else {
cwarn("Unknown value returned from redir.write:");
log(rv);

//		return `unknown value returned from redir.write!!! (see console)`
	}

}//»

if (hasBang){//«
	if (lastcomcode === E_SUC) lastcomcode = E_ERR;
	else lastcomcode = E_SUC;
}//»

/*
If this is a loop operation (from continue or break), then
we *ALWAYS* break from the logic list, so we return
{code: lastcomcode, breakLoop: true}
*/
//LEUIKJHX
	if (lastcomcode==E_SUC){//SUCCESS«
		if (pipetype=="||"){
			for (let j=loglist_iter+1; j < loglist.length; j++){
				if (loglist[j].type=="&&"){
					return {code: lastcomcode, nextIter: j, continueLoop: true};
				}
			}
			return {code: lastcomcode, breakLoop: true};
		}
//		else:
//			1 pipetype=="&&" and we automatically go to the next one or:
//			2 there is no pipetype because we are the last pipeline of this loglist, and the logic of the thing doesn't matter
	}
	else{//FAILURE
		if (pipetype=="&&"){
			for (let j=loglist_iter+1; j < loglist.length; j++){
				if (loglist[j].type=="||"){
//					i=j;
//					continue LOGLIST_LOOP;
					return {code: lastcomcode, nextIter: j, continueLoop: true};
				}
			}
//			break LOGLIST_LOOP;
			return {code: lastcomcode, breakLoop: true};
		}
//		else:
//			1 pipetype=="||" and we automatically go to the next one or:
//			2 there is no pipetype because we are the last pipeline of this loglist, and the logic of the thing doesn't matter
	}//»
	return lastcomcode;
}
//»

async executeAndOr(andor_list, andor_sep, opts, parentCommand, in_background){//«
//let in_background = opts.inBackground || andor_sep === "&";
let loglist=[];
let last = andor_list.pop();
for (let i=0; i < andor_list.length-1; i+=2){
	let andor = andor_list[i];
	let type = andor_list[i+1];
	let pipe = andor.pipeline.pipe_sequence;
	loglist.push({pipe, type, hasBang: andor.bang});

}
loglist.push({pipe: last.pipeline.pipe_sequence, hasBang: last.bang});
andor_list.push(last);

let lastcomcode;
for (let i=0; i < loglist.length; i++){//«

	let rv = await this.executePipeline(loglist[i], loglist, i, opts, parentCommand, in_background);
//continue;
	if (this.cancelled) return;
//	if (this.cancelled) continue;
	if (isStr(rv)) return rv;
	if (Number.isFinite(rv)){
		lastcomcode = rv;
		continue;
	}
	if (!isObj(rv)){
cwarn("Here is the value");
log(rv);
this.fatal("Unknown value returned from executePipeline!");
	}
	if (rv.breakStatementLoop){
//Must return the whole object
		return rv;
	}
	if (rv.breakLoop){
		return rv.code;
	}
	if (rv.continueLoop){
		lastcomcode = rv.code;
cwarn("CONTINUE", i, rv.nextIter);
		i = rv.nextIter;
	}
	
}//»

return lastcomcode;

}//»
async executeStatements(statements, opts, parentCommand){//«
	const{term}=this;
	let lastcomcode;
	for (let i=0; i < statements.length-1; i+=2){
		let in_background = opts.inBackground || statements[i+1] === "&";
		if (statements[i+1] === "&"){
/*
In bash, when the '&' is used immediately, like:
  $ if sleep 1 && false & then echo hi; else echo ho; fi
this evaluates to true, and hi is output
*/
			this.executeAndOr(statements[i].andor, statements[i+1], opts, parentCommand, true);
			lastcomcode = E_SUC;
		}
		else{
			lastcomcode = await this.executeAndOr(statements[i].andor, statements[i+1], opts, parentCommand, in_background);
		}
		if (isObj(lastcomcode) && lastcomcode.breakStatementLoop) {
			return lastcomcode.code;
		}
		if (isLoopCont(lastcomcode)||isLoopBreak(lastcomcode)) return lastcomcode;
	}
	return lastcomcode;
}//»

/*Old/Safe version
async executeStatements(statements, opts){//«
	const{term}=this;
	let lastcomcode;
	for (let i=0; i < statements.length-1; i+=2){
		lastcomcode = await this.executeAndOr(statements[i].andor, statements[i+1], opts, opts.inBackground || statements[i+1] === "&");
		if (isObj(lastcomcode) && lastcomcode.breakStatementLoop) {
			return lastcomcode.code;
		}
		if (isLoopCont(lastcomcode)||isLoopBreak(lastcomcode)) return lastcomcode;
	}
	return lastcomcode;
}//»
*/

//SLDPEHDBF
async compile(command_str, opts={}){//«
	const{term}=this;
	let parser = new Parser(command_str.split(""), opts);
	this.parser = parser;
	try{

		let errmess;
//Must use await because it could possibly need more lines from the terminal, so we can't do
//this in the constructor (like esprima does)
		await parser.scanNextTok();
		await parser.tokenize();
if (!parser.tokens.length){
//This could just a comment:
// $ #blah blah blah
return;
}
		let ast = await parser.compile();
		if (!ast) return;
		let statements=[];
		for (let compcoms of ast.program.complete_commands){
			let list = compcoms.complete_command.list;
			statements.push(...list);
		}
		return statements;
	}
	catch(e){
//LSPOEIRK

this.term.addToHistoryBuffer(this.parser.scanner.source.join(""));
let mess = e.message;
if (mess === "EOF") return;
cerr(e);
if (opts.retErrStr) return mess;
if (!mess.match(/^sh:/)) mess = `sh: ${mess}`;
term.response(mess,{isErr: true});
	}
//	term.response_end();

}//»
async execute(command_str, opts){//«
//	const{term}=this;
	let statements = await this.compile(command_str, opts);
	if (!statements) return;
try{
	let rv = await this.executeStatements(statements, opts);
	return rv;
}
catch(e){
cerr(e);
let mess = e.message;
if (!mess.match(/^sh:/)) mess = `sh: ${mess}`;
this.term.response(mess,{isErr: true});
}
//	return 
}//»
cancel(){//«
	this.cancelled = true;
	let pipe = this.pipeline;
	if (!pipe) return;
	for (let com of pipe) {
		com.cancel && com.cancel();
	}
}//»

};
this.Shell = Shell;

//»

//«init: preload libraries
this.init=()=>{
/*«"Preload Libs" are libraries of commands whose values for their key names 
(on the shell_commands object) are strings (representing the command library
that they "live" in) rather than functions. So, the value for the key, "vim"
will be "fs", which points to the coms/fs.js file.  Upon finding this string
@QKIUTOPLK, the import_coms function is used in order to replace the library
name strings with the proper command functions.
»*/

let preloads = this.preloadLibs;

for (let k in preloads){
	this.allLibs[k] = preloads[k];
}

for (let k in preloads){
	let arr = preloads[k];
	for (let com of arr) {
		if (this.defCommands[com]){
cwarn(`The shell command: ${com} already exists (also defined in this.preloadLibs: ${k})`);
			continue;
		}
		this.defCommands[com]=k;
	}
}

//Shell.activeCommands = globals.shell_commands || this.defCommands;
this.activeCommands = globals.shell_commands || this.defCommands;
if (!globals.shell_commands) {
	globals.shell_commands = this.defCommands;
}

//Shell.activeOptions = globals.shell_command_options || this.defCommandOpts;
this.activeOptions = globals.shell_command_options || this.defCommandOpts;
if (!globals.shell_command_options) {
	globals.shell_command_options = this.defCommandOpts;
}

}//»

}
//»
