/*1/7/25: 
Now that we are working on the "real" test command (aka the '[' command),
we need a way to tell getOptions @OEORMSRU to *not* check for options.

*/

/*1/6/25: «Getting environments working

@IFKLJFSN is where we are passing an 'env' argument into addToEnv
for the assignments array. We need to create new envs for comsubs!!!
So it looks like we just need to pass in an 'sdup(cur_env)', for whenever we
are going into deeper levels.

Let's just pass the opts that are given as the second arg to
Shell.devexecute (@SLDPEHDBF) into expandSubs. A big point of this is simply
to efficiently pass these values (especially env, scriptName and scriptArgs) 
into ParamSub.expand @KLSDHSKD.

Now its just a matter of getting the fine arts of field-splitting and variable/parameter
environments working nicely:
1) So that commands like:
~$ FOOD=1234 echo blah blah blah
...do not pollute the environment with this value for 'FOOD' (assuming that 'FOOD' was unset
or had another value).

Also:
~$ (FOOD=abcde)
...should not pollute the environment like above, either.

So now we need to create copied environments for the situations above...

Then we need to have a concept of com_env

»*/
/*1/5/25: « NEED TO GET RID OF Word.parameterExpansion (@PMJDHSWL)??
In CaseCom:
  - @AKDMFLS
  - @DJSLPEKS

@AKDKRKSJ, we have a Word.expandSubs that is only passing the shell
and the term args, but Word.expandSubs @XNDKSLDK has this signature:
async expandSubs(shell, term, env, scriptName, scriptArgs)
...TODO NEED TO FIND ALL THE PLACES THAT Word.expandSubs IS CALLED
AND PUT THOSE ARGS IN THERE!!! $)T


AT THE END OF THE DAY: It seems the only "real" issue is that double
quotes no longer seem to keep their significance when I am doing
assignments followed by echos, eg:

~$ HAR=`ls`
~$ echo "$HAR"

WELL THIS PROBLEM IS MUCH MUCH BETTER THAN ALL OF THE OUTPUT SHOWING UP
AS "[Object object]" !!!!!

Apropos the note below (from yesterday), I am going to create Stdin
and Stdin objects immediately after doing the heredoc stuff in the parser...
@YJDHSLFJS.

Now collecting all redirects (tok.isRedir) is much simpler because we just need
the individual tokens themselves.

Just cleaned up parseSimpleCommand @JEEKSMD.

»*/
/*XXX 1/4/25: We are only calling eatRedirects from parseCompoundCommand, and XXX«
it doesn't know how to handle tok.isHeredoc @XPJSKLAJ. So we are just
going to leave that for an exercise for...
»*/
//«Notes
/*1/3/25:«

Now we need to make sure about output redirections vis-a-vis compound commands,
just like we did the "stdin thing." We did an envPipeInCb, so maybe we need an
envRedirLines, for when there is an out_redir in our compound command....


LPIRHSKF is where we check for this.nextCom with our simple command's out response.
We need to to the same thing for compound commands. We need to put the nextCom's
pipeIn callback into the environment of the commands that we are executing, when
it comes to the compound commands, as well as functions and scripts???

SO IT TURNS OUT THAT THE SHELL DOES DO FILEPATH EXPANSIONS ON PARAMETER SUBSTITUTIONS.
IF THERE IS A REGEX COMPILATION ERROR, THEN IT JUST LETS IT PASS THROUGH.

Now we are using the scanner to create ParamSub's from all valid uses of '$', e.g.:

1) $BLAH
2) $1
3) $#
4) ${...}

@MXDHSOERJ I want to look for the sequence:
'$' + any character that can be substituted
For a parameter that is not enclosed in braces:

If the parameter is a name, the expansion shall use the longest valid name (see
XBD 3.216 Name), whether or not the variable denoted by that name exists.

In the shell command language, a word consisting solely of underscores, digits,
and alphabetics from the portable character set. The first character of a name
is not a digit.

Note:
The Portable Character Set is defined in detail in 6.1 Portable Character Set.

Otherwise, the parameter is a single-character symbol, and behavior is
unspecified if that character is neither a digit nor one of the special
parameters (see 2.5.2 Special Parameters).
@ * # ? - $ ! 0

Need to pass the stdin of ScriptCom into its execute function, and 
need to make sure we are doing the same kind of thing for functions and compound 
commands. I think com_read needs to check for an EOF in order to return E_ERR. 
NO: COM_READ JUST NEEDS TO GET THE STDIN ARRAY.
1) ScriptCom @SKDMRJJS
2) FunctionCom

For parsing, need to allow brace group compound lists to end with '}'...


OKAY: In Shell.makeCommand @MFJKTYUS is where we are doing the conversion from
the array of in_redir tokens, e.g. ["<", "SomeFile.txt"] to the actual lines of
standard input.
BUT WE SHOULD ACUTALLY DO IT IN Shell.executePipeline2 @DNGZXER. 

The only difference etween simple_command and compound_command when it comes to
collecting redirs is that they are already together with compound_command's but
they are intermingled with assignments before the simple command names and with
arguments after the simple command names.


When we are doing expansions, for example parameter subs @LSJFANSF: We need a
way to "mask off" these characters from the rest, so there are no further
substitutions attempted on them.  This goes for all the expansions (tilde, command, etc.)...
@XMJFGRTU, we are constructing the RegExp's for pathname expansions.

HOW ABOUT @EORKTIG, we first have a check for if ch.wasExpanded, and do:

patstr += "\"+ch;

@WIUTYSNFI, need a way to escape our filepath expansion chars, defined @EPRORMSIS

»*/
/*1/1/25: Need to find all the places where we have repeating do_group's«
	- ForCom
»*/
/*12/31/24: Parameter Expansions @PMJDHSWL have a weird new ParamSub (@XMKJDHE) object that«
has an empty expand method. It will be easy to get this working in the case that
there is only a number or a plain word in there...

In all of these places where we need to repeatedly re-use certain
compound_list's, we either need to:
-  Have a dup method for the compound_list, in order to duplicate all of the Word objects
-  save the source text that makes up these objects and then send it back through the parser
   in order to get another one.

The ForCom @SLDLTOD is highlighting our inability to figure out how the environments
are used in the Unix shell. When calling shell.execute, @XKLRSMFLE, we create a new
(shallow) copy of the terminal's environment object. I guess we are only supposed to
do that copying when we are doing the subshell. Also, the assignments before an
*actual* command do not go into the terminal's environment. I guess there needs to
be a separate command env object...



NOW JUST ONE MORE KIND OF COMPOUND_COMMAND (CASE_CLAUSE) TO MAKE THIS A PRETTY
MUCH FEATURE COMPLETE MINIMAL LINUX DISTRO??? 


»*/
/*12/30/24: Just had an issue with EOFs inside of scripts @LPIRHSKF. For some reason, it was«
assumed that EOFs should only go to the next commands in your immediate pipeline,
and not to the scriptOut callback...
»*/
//»

//Terminal Imports«
const NS = LOTW;
const util = LOTW.api.util;
const globals = LOTW.globals;
const{Desk}=LOTW;
const {
	strNum,
	isArr,
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
const {
	KC,
	DEF_PAGER_MOD_NAME,
	TEXT_EDITOR_APP,
	LINK_APP,
	FOLDER_APP,
	FS_TYPE,
	MOUNT_TYPE,
	SHM_TYPE,
	fs,
	isMobile,
	dev_mode,
	admin_mode,
	EOF
} = globals;
const fsapi = fs.api;
const widgets = LOTW.api.widgets;
const {poperr} = widgets;

const HISTORY_FOLDER = `${globals.HOME_PATH}/.history`;
const HISTORY_PATH = `${HISTORY_FOLDER}/shell.txt`;
const HISTORY_PATH_SPECIAL = `${HISTORY_FOLDER}/shell_special.txt`;
const LEFT_KEYCODE = KC.LEFT;

const DEL_MODS=[
//	"util.less",
	"term.vim",
	"term.log"
];
const DEL_COMS=[
//	"audio"
//	"yt",
//	"test",
	"fs",
//	"mail"
//	"esprima",
//"shell"
];
const ADD_COMS=[
//"esprima",
"test"
];

if (dev_mode){
//	ADD_COMS.push("shell");
}


//»

//Shell Imports«

//const NS = LOTW;
//const {globals, Desk} = LOTW;
const {
//    TEXT_EDITOR_APP,
//    LINK_APP,
//    FOLDER_APP,
//    FS_TYPE,
//    MOUNT_TYPE,
//    SHM_TYPE,
    SHELL_ERROR_CODES,
//  dev_mode,
//  EOF,
//	fs
} = globals;
/*
const util = LOTW.api.util;
const{log,jlog,cwarn,cerr,isNum,isArr,isStr,isObj,isNode,isFile,isDir,isErr,isEOF,sleep,normPath,}=util;
*/
const{E_SUC, E_ERR} = SHELL_ERROR_CODES;
//const fsapi = globals.api.fs;
//const{pathToNode}=fsapi;

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

globals.ShellMod = new function() {

//Var«
const shellmod = this;
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
const test_coms = [
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
]
//const preload_libs={fs: fs_coms, test: test_coms};
const preload_libs={fs: fs_coms};

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
const UNSUPPORTED_OPERATOR_CHARS=[];
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

const CONTROL_WORDS = ["if", "then", "elif", "else", "fi", "do", "while", "until", "for", "in", "done", "select", "case", "esac"];

const isNLs=val=>{return val instanceof Newlines;};
//»
//«Funcs

//«Expansion 

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
};/*»*/
return _dup(obj);
};
const sdup=(obj)=>{//Shallow copy
	let out={};
	for (let k in obj){
		out[k]=obj[k];
	}
	return out;
};

/*»*/
//»
//Helpers (this.util)«
{

const eval_shell_expr = async (args, cwd) => {//«
//cwarn("CWD",cwd);
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

We just need a little tokenizer parser here:

control ops: ( )

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
const UNARY_OPS=[/*«*/
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
];/*»*/
const BINARY_OPS=[/*«*/
	"=",//String equal
	"!=",//String equal
	"-eq",//String/integer equal
	"-ne",//String/integer not equal
	"-ge",//Int >=
	"-gt",//Int >
	"-le",//Int <=
	"-lt",//Int <

	"-ef",//equal files (same inode)
	"-nt",//newer than
	"-ot",//older than
];/*»*/
if (!args.length) return E_ERR;
const BAD_ARGS=["(",")","-a","-o"];
for (let arg of args){
	if (BAD_ARGS.includes(arg)) return `'${arg}': unsupported operator`;
}
let is_neg;
if (args[0]==="!"){
	is_neg = true;
	args.shift();
}
else{
	is_neg = false;
}
if (args.length == 1) return maybe_neg(true);

if (args.length > 3) return "too many arguments";
if (args.length==2){/*«*/
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
if (op==="-w"){/*«*/
	let usenode;
	if (node.isDir) usenode = node;
	else usenode = node.par;
	return maybe_neg(await fsapi.checkDirPerm(usenode));
}/*»*/
if (op==="-s"){/*«*/
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
}/*»*/

cerr(`UNUSED OPERATOR (${op}), RETURNING ERROR`);

	return E_ERR;
}/*»*/

let arg1 = args[0];
let op = args[1];
let arg2 = args[2];
if (!BINARY_OPS.includes(op)) return `'${op}': binary operator expected`

if (arg1.match(/^\d+$/)&&!arg2.match(/^\d+$/)) return `'${arg2}': integer expression expected`;
if (arg2.match(/^\d+$/)&&!arg1.match(/^\d+$/)) return `'${arg1}': integer expression expected`;
if (arg1.match(/^\d+$/)){/*«*/
let n1 = parseInt(arg1);
let n2 = parseInt(arg2);
switch(op){
	case "-eq": return maybe_neg(n1 === n1);
	case "-ne": return maybe_neg(n1 !== n2);
	case "-ge": return maybe_neg(n1 >= n2);
	case "-gt": return maybe_neg(n1 > n2);
	case "-le": return maybe_neg(n1 <= n2);
	case "-lt": return maybe_neg(n1 < n2);
}
}/*»*/
else if (op==="-eq"||op==="=") return maybe_neg(arg1 === arg2);
else if (op==="-ne"||op==="!=") return maybe_neg(arg1 !== arg2);

//cwarn("EVAL", arg1, op, arg2);
let node1 = await arg1.toNode({cwd});
let node2 = await arg2.toNode({cwd});
if (!(node1&&node2)) return maybe_neg(false);
if (!(node1.isFile&&node2.isFile)) return maybe_neg(node1===node2);

//	"-ef",//equal files (same inode)
//	"-nt",//newer than
//	"-ot",//older than
if (op==="-ef"){/*«*/
	if (Number.isFinite(node1.blobId) &&  Number.isFinite(node2.blobId)){
		return maybe_neg(node1.blobId===node2.blobId);
	}
	return maybe_neg(node1===node2);
}/*»*/
if (node1.type===FS_TYPE&&node2.type===FS_TYPE){/*«*/

let f1 = await node1._file;
let f2 = await node2._file;
if (!(f1&&f2)){/*«*/
cwarn("No files on the node[s]");
log(node1, node2);
	return E_ERR;
}/*»*/
let m1 = f1.lastModified;
let m2 = f2.lastModified;
if (!(m1&&m2)){/*«*/
cwarn("No lastModified times on the node.file[s]");
log(f1, f2);
return E_ERR;
}/*»*/
if (op==="-ot") return maybe_neg(m1 > m2);
if (op==="-nt") return maybe_neg(m1 < m2);

}/*»*/
else{/*«*/
cwarn("Not comparing modification times of nodes that are non-fs files");
log(node1, node2);
return E_ERR;
}/*»*/
cerr(`UNUSED OPERATOR (${op}), RETURNING ERROR`);
//if (op)

return E_ERR;

};//»

const make_sh_error_com = (name, mess, com_env)=>{//«
	let com = new this.comClasses.ErrCom(name, null,null, com_env);
//SPOIRUTM
	if (name) com.errorMessage = `sh: ${name}: ${mess}`;
	else com.errorMessage = `sh: ${mess}`;
	com.doNotAddCom = true;
	return com;
};//»

const get_options = (args, com, opts={}) => {//«
	const getlong = opt => {
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
		} else if (numhits == 1) return okkey;
		else {
			err.push(`option: '${opt}' has multiple hits`);
			return null;
		}
	};
	let err = [];
	let sopts = opts.SHORT || opts.s;
	let lopts = opts.LONG || opts.l;
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
		else if (marr = args[i].match(/^-([a-zA-Z0-9][a-zA-Z0-9]+)$/)) {
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
		}
		else if (marr = args[i].match(/^-([a-zA-Z0-9])$/)) {
			ch = marr[1];
			if (getall){
				if (!args[i + 1]) err.push(`option: '${ch}' requires an arg`);
				obj[ch] = args[i + 1];
				args.splice(i, 2);
			}
			else if (!sopts[ch]) {
				err.push(`invalid option: '${ch}'`);
				args.splice(i, 1);
			} else if (sopts[ch] === 1) {
				obj[ch] = true;
				args.splice(i, 1);
			} else if (sopts[ch] === 2) {
				err.push(`option: '${ch}' is an optional arg`);
				args.splice(i, 1);
			} else if (sopts[ch] === 3) {
				if (!args[i + 1]) err.push(`option: '${ch}' requires an arg`);
				obj[ch] = args[i + 1];
				args.splice(i, 2);
			} else {
				err.push(`option: '${ch}' has an invalid option definition: ${sopts[ch]}`);
				args.splice(i, 1);
			}
		} else if (marr = args[i].match(/^--([a-zA-Z0-9][-a-zA-Z0-9]+)=(.+)$/)) {
			if (getall || (ret = getlong(marr[1]))) {
				if (getall) ret = marr[1];
				obj[ret] = marr[2];
			}
			args.splice(i, 1);
		} else if (marr = args[i].match(/^--([a-zA-Z0-9][-a-zA-Z0-9]+)=$/)) {
			if (getall || (ret = getlong(marr[1]))) {
				if (getall) ret = marr[1];
				obj[ret] = args[i + 1];
				if (args[i + 1]) args.splice(i + 1, 2);
				else args.splice(i, 1);
			} else args.splice(i, 1);
		} else if (marr = args[i].match(/^--([a-zA-Z0-9][-a-zA-Z0-9]+)$/)) {
			if (getall || (ret = getlong(marr[1]))) {
				if (getall) ret = marr[1];
				if (getall || (lopts[marr[1]] === 1 || lopts[marr[1]] === 2)) obj[ret] = true;
				else if (lopts[marr[1]] === 3) err.push(`long option: '${marr[1]}' requires an arg"`);
				else if (lopts[marr[1]]) err.push(`long option: '${marr[1]}' has an invalid option definition: ${lopts[marr[1]]}`);
				else if (!lopts[marr[1]]) err.push(`invalid long option: '${marr[1]}`);
				args.splice(i, 1);
			} else args.splice(i, 1);
		} 
		else if (marr = args[i].match(/^(---+[a-zA-Z0-9][-a-zA-Z0-9]+)$/)) {
			err.push(`invalid option: '${marr[1]}'`);
			args.splice(i, 1);
		}
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
	let assigns = {};
	while (use) {
		let which;
		const next=()=>{
			arr.shift();
			if (arr[0]===" ") arr.shift();
			use = arr[0];
		};
//log(use.toString());
		marr = this.var.assignRE.exec(use.toString());
		if (!marr){
			if (!if_export) break;
			else{
				err.push(`sh: '${use}': not a valid identifier`);
				next();
				continue;
			}
		}
		which = marr[1];
		if (this.var.noSetEnvVars.includes(which)){
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
	this.var.allLibs[libname] = ok_coms;
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
	NS.coms[libname] = {coms, opts};

	return ok_coms.length;
//	NS.libs[libname] = {coms, opts};

}//»
const do_imports = async(arr, err_cb) => {//«
	if (!err_cb) err_cb = ()=>{};
//	let did_num=[];
//	let s='';
	let out=[];
	for (let name of arr){
		if (this.var.allLibs[name]) {
//			err_cb(`${name}: already loaded`);
			continue;
		}   
		try{
			let num = await this.util.importComs(name);
			out.push(`${name}(${num})`);
//			did_num.push({name, num});
		}catch(e){
			err_cb(`${name}: error importing the module`);
cerr(e);
		}
	}
	return out.join(", ");
//	do_overlay(s);
//	return did_num;
};//»

const delete_coms = arr => {//«
	let sh_coms = globals.shell_commands;
	let sh_opts = globals.shell_command_options;
	for (let libname of arr){
if (!this.var.allLibs[libname]){
cwarn(`The command library: ${libname} is not loaded`);
continue;
}
		let lib = NS.coms[libname];
		if (!lib){
//cwarn(`The command library: ${libname} was in this.var.allLibs, but not in NS.coms!?!?!`);
			continue;
		}
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
		delete this.var.allLibs[libname];
		delete NS.coms[libname];
	}
};//»
const delete_mods=(arr)=>{//«
	for (let m of arr){
		let scr = document.getElementById(`script_mods.${m}`);
		if (scr) {
			scr._del();
		}
else{
//cwarn(`The module ${m} was not loaded!`);
continue;
}
		delete NS.mods[m];
//log(`Deleted module: ${m}`);
	}
}//»
/*
const write_to_redir = async(term, out, redir, env)=>{//«
//let {err} = await write_to_redir(term, (out instanceof Uint8Array) ? out:out.join("\n"), redir, env);
	if (!isArr(out)) return {err: "the redirection output is not a Uint8Array or JS array!"}
	if (!(out instanceof Uint8Array)) {
		 if (!isStr(out[0])) return {err: "the redirection output does not seem to be an array of Strings!"};
		out = out.join("\n");
	}
	let op = redir.shift();
	let fname = redir.shift();
	if (!fname) return {err:`missing operand to the redirection operator`};
	let fullpath = normPath(fname, term.cur_dir);
	let node = await fsapi.pathToNode(fullpath);
	if (node) {
		if (node.type == FS_TYPE && op===">" && !this.var.allowRedirClobber) {
			if (env.CLOBBER_OK==="true"){}
			else return {err: `not clobbering '${fname}' (this.var.allowRedirClobber==${this.var.allowRedirClobber})`};
		}
		if (node.writeLocked()){
			return {err:`${fname}: the file is "write locked" (${node.writeLocked()})`};
		}
		if (node.data){
			return {err:`${fname}: cannot write to the data file`};
		}
	}
	let patharr = fullpath.split("/");
	patharr.pop();
	let parpath = patharr.join("/");
	if (!parpath) return {err:`${fname}: Permission denied`};
	let parnode = await fsapi.pathToNode(parpath);
	let typ = parnode.type;
	if (!(parnode&&parnode.appName===FOLDER_APP&&(typ===FS_TYPE||typ===SHM_TYPE||typ=="dev"))) return {err:`${fname}: invalid or unsupported path`};
	if (typ===FS_TYPE && !await fsapi.checkDirPerm(parnode)) {
		return {err:`${fname}: Permission denied`};
	}
	if (!await fsapi.writeFile(fullpath, out, {append: op===">>"})) return {err:`${fname}: Could not write to the file`};
	return {};
};//»
*/
this.util={/*«*/
	evalShellExpr: eval_shell_expr,
	makeShErrCom: make_sh_error_com,
	getOptions:get_options,
	addToEnv:add_to_env,
	importComs:import_coms,
	doImports:do_imports,
	deleteComs:delete_coms,
	deleteMods:delete_mods,
//	writeToRedir:write_to_redir
}/*»*/

}
//»

//»
//«Exported variables: this.var

this.var={//«

dirType:"d",
linkType:"l",
badLinkType:"b",
idbDataType:"i",
allowRedirClobber: false,
lastExitCode: 0,
aliases: {
	c: "clear",
	la: "ls -a",
},
noSetEnvVars: ["USER"],
preloadLibs: preload_libs,
allLibs: LOTW.libs,
assignRE: /^([_a-zA-Z][_a-zA-Z0-9]*(\[[_a-zA-Z0-9]+\])?)=(.*)/s

}//»

//»

//Classes     (Com, ErrCom, Stdin/Stdout, ScriptCom...)«

class Stdin{/*«*/

constructor(tok, arg){
	this.tok=tok;
	this.arg=arg;
	this.isStdin = true;
	this.isRedir = true;
}

async setValue(shell, term, opts={}){/*«*/
//async setValue(shell, term, env, scriptName, scriptArgs){
const{env, scriptName, scriptArgs} = opts;

if (this.tok.isHeredoc) {
	this.value = this.tok.value
	return true;
}
const{tok, arg}=this;
const {r_op}=tok;
if (r_op==="<"){/*«*/
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
}/*»*/
if (r_op==="<<<"){/*«*/
//	await this.arg.expandSubs(shell, term, env, scriptName, scriptArgs);
	await this.arg.expandSubs(shell, term, opts);
//	this.arg.quoteRemoval();
//log(this.arg.val);
	this.value = this.arg.fields.join("\n");
	return true;
}/*»*/
return `Unknown stdin redirection: ${rop}`;

}/*»*/

dup(){
	return new Stdin(this.tok, this.arg&&this.arg.dup());
}

}/*»*/
class Stdout{/*«*/

constructor(tok, file){
	this.tok=tok;
	this.file=file;
	this.isStdout = true;
	this.isRedir = true;
}

async write(term, val, env, ok_clobber){/*«*/

if (!(isStr(val)||(val instanceof Uint8Array))){
return "Invalid value to write to stdout (want string or Uint8Array)";
}

const{tok, file: fname}=this;
const {op}=tok;
let fullpath = normPath(fname, term.cur_dir);
let node = await fsapi.pathToNode(fullpath);
if (node) {/*«*/
	if (node.type == FS_TYPE && op===">" && !ok_clobber) {
		if (env.CLOBBER_OK==="true"){}
		else return `not clobbering '${fname}' (shell.var.allowRedirClobber==${ok_clobber})`;
	}
	if (node.writeLocked()){
		return `${fname}: the file is "write locked" (${node.writeLocked()})`;
	}
	if (node.data){
		return `${fname}: cannot write to the data file`;
	}
}/*»*/
let patharr = fullpath.split("/");
patharr.pop();
let parpath = patharr.join("/");
if (!parpath) return `${fname}: Permission denied`;
let parnode = await fsapi.pathToNode(parpath);
let typ = parnode.type;
if (!(parnode&&parnode.appName===FOLDER_APP&&(typ===FS_TYPE||typ===SHM_TYPE||typ=="dev"))) {
	return `${fname}: invalid or unsupported path`;
}
if (typ===FS_TYPE && !await fsapi.checkDirPerm(parnode)) {
	return `${fname}: Permission denied`;
}
if (!await fsapi.writeFile(fullpath, val, {append: op===">>"})) return `${fname}: Could not write to the file`;
return true;

/*
const write_to_redir = async(term, out, redir, env)=>{//«
//let {err} = await write_to_redir(term, (out instanceof Uint8Array) ? out:out.join("\n"), redir, env);
	if (!isArr(out)) return {err: "the redirection output is not a Uint8Array or JS array!"}
	if (!(out instanceof Uint8Array)) {
		 if (!isStr(out[0])) return {err: "the redirection output does not seem to be an array of Strings!"};
		out = out.join("\n");
	}
	let op = redir.shift();
	let fname = redir.shift();
	if (!fname) return {err:`missing operand to the redirection operator`};
	let fullpath = normPath(fname, term.cur_dir);
	let node = await fsapi.pathToNode(fullpath);
	if (node) {
		if (node.type == FS_TYPE && op===">" && !this.var.allowRedirClobber) {
			if (env.CLOBBER_OK==="true"){}
			else return {err: `not clobbering '${fname}' (this.var.allowRedirClobber==${this.var.allowRedirClobber})`};
		}
		if (node.writeLocked()){
			return {err:`${fname}: the file is "write locked" (${node.writeLocked()})`};
		}
		if (node.data){
			return {err:`${fname}: cannot write to the data file`};
		}
	}
	let patharr = fullpath.split("/");
	patharr.pop();
	let parpath = patharr.join("/");
	if (!parpath) return {err:`${fname}: Permission denied`};
	let parnode = await fsapi.pathToNode(parpath);
	let typ = parnode.type;
	if (!(parnode&&parnode.appName===FOLDER_APP&&(typ===FS_TYPE||typ===SHM_TYPE||typ=="dev"))) return {err:`${fname}: invalid or unsupported path`};
	if (typ===FS_TYPE && !await fsapi.checkDirPerm(parnode)) {
		return {err:`${fname}: Permission denied`};
	}
	if (!await fsapi.writeFile(fullpath, out, {append: op===">>"})) return {err:`${fname}: Could not write to the file`};
	return {};
};//»
*/
	}/*»*/

dup(){
	return new Stdin(this.tok, this.arg.dup());
}

}/*»*/

const Com = class {//«
	constructor(name, args, opts, env={}){//«
		this.name =name;
		this.args=args;
		this.opts=opts;
		this.numErrors = 0;
		this.noPipe = false;
//		this.inBack = in_background;
		for (let k in env) {
			this[k]=env[k];
		}
		if (this.outRedir&&this.outRedir.length){
			this.redirLines = [];
		}
		this.awaitEnd = new Promise((Y,N)=>{//«
			this.end = (rv)=>{
				Y(rv);
				this.killed = true;
			};
			this.ok=(mess)=>{
				if (mess) this.suc(mess);
//log(this.name.toString(), this.pipeTo);
//				if (this.pipeTo) {
				this.out(EOF);
//				}
				Y(E_SUC);
				this.killed = true;
			};
			this.no=(mess)=>{
				if (mess) {
					if (!this.doNotAddCom) mess = `${this.name}: ${mess}`;
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
//	static grabsScreen = false;
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
		let have_none = !(this.args.length || this.pipeFrom || this.stdin);
		if (have_none && !opts.noErr){
			this.err("no args or input received");
			this.numErrors++;
		}
		return have_none;
	}//»
	eof(){this.out(EOF);}
	init(){}
	run(){this.wrn(`sh:\x20${this.name}:\x20the 'run' method has not been overriden!`);}
	resp(str, opts){//«
		if (this.shell.cancelled) return;
		const{term}=this;
		term.response(str, opts);
		term.scrollIntoView();
		term.refresh();
	}//»
	out(val, opts={}){//«
		if (this.shell.cancelled) return;
		const{term}=this;
		let redir_lns = this.redirLines || this.envRedirLines;
//LPIRHSKF
		if (!redir_lns && this.nextCom){
			let next_com = this.nextCom;
			if (next_com && next_com.pipeIn && !next_com.noPipe) {
				next_com.pipeIn(val);
			}
			return;
		}
		else if(!redir_lns && this.envPipeInCb){
			this.envPipeInCb(val);
			return;
		}
		//WLKUIYDP
		if (redir_lns) {/*«*/
		//KIUREUN
			if (isEOF(val)) return;
			if (val instanceof Uint8Array){
				if (!redir_lns.length) {
					redir_lns = val;
				}
				else {
					let hold = redir_lns;
					redir_lns = new Uint8Array(hold.length + val.length);
					redir_lns.set(hold, 0);
					redir_lns.set(val, hold.length);
				}
				this.redirLines = redir_lns;
				return;
			}
			redir_lns.push(val);
			return;
		}/*»*/
		if (this.scriptOut) {
			return this.scriptOut(val);
		}
		if (isEOF(val)) return;
		//Save to subLines and call scriptOut
		if (this.subLines){
			if (val instanceof Uint8Array) val = `Uint8Array(${val.length})`;
			this.subLines.push(val);
			return;
		}
		this.resp(val, opts);
	}//»
	err(str){this.resp(str,{isErr:true});}
	suc(str){this.resp(str,{isSuc:true});}
	wrn(str){this.resp(str,{isWrn:true});}
	inf(str){this.resp(str,{isInf:true});}
	cancel(){
		this.killed = true;
cwarn(`${this.name}: cancelled`);
	}
}//»
const ScriptCom = class extends Com{//«
	constructor(shell, name, text, args, env){
		super(name, args, {}, env);
		this.text = text;
		this.shell = shell;
	}
	async run(){
		const scriptOut=(val)=>{
			this.out(val);
		};
		let code = await this.shell.devexecute(this.text, {
			shell: this.shell,
			scriptOut,
			scriptName: this.name,
			scriptArgs: this.args,
			env: sdup(this.env)
		});
		this.end(code);
	}
}//»
const NoCom=class{//«
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
const ErrCom = class extends Com{//«
	run(){
		this.no(this.errorMessage);
	}
}//»
//«Compounds

class CompoundCom{//«
constructor(shell, opts){//«
	this.shell = shell;
	this.opts=opts;
	this.outRedir = opts.outRedir;
	this.awaitEnd = new Promise((Y,N)=>{
		this.end = (rv)=>{
			Y(rv);
			this.killed = true;
		};
	});
}//»
init(){//«
	let opts={};
	for (let k in this.opts){
		opts[k]=this.opts[k];
	}
	if (this.nextCom){
		if (this.nextCom.pipeIn){
			opts.envPipeInCb=(...args)=>{
				this.nextCom.pipeIn(...args);
			}
		}
		else opts.envPipeInCb = ()=>{};
	}
	if (this.outRedir){
		this.redirLines = [];
		opts.envRedirLines = this.redirLines;
	}
	this.opts = opts;
}//»
cancel(){this.killed=true;}
}//»

class BraceGroupCom extends CompoundCom{//«
constructor(shell, opts, list){
	super(shell, opts);
	this.list = list;
}
async run(){//«
	let rv = await this.shell.executeStatements2(this.list, this.opts)
	if (this.shell.cancelled) return;
	this.end(rv);
}//»
}//»
class SubshellCom extends CompoundCom{//«
constructor(shell, opts, list){
	super(shell, opts);
	this.list = list;
}
async run(){
//log(this.opts.env);
	let opts = sdup(this.opts);
	opts.env = sdup(this.opts.env);
	let rv = await this.shell.executeStatements2(this.list, opts)
	if (this.shell.cancelled) return;
	this.end(rv);
}
}//»

class IfCom extends CompoundCom{//«
constructor(shell, opts, conds, conseqs, fallback){//«
	super(shell, opts);
	this.conds = conds;
	this.conseqs = conseqs
	this.fallback = fallback;
}//»
init(){}
async run(){//«
	const{conds, conseqs, opts}=this;
	for (let i=0; i < conds.length; i++){
		let rv = await this.shell.executeStatements2(conds[i], opts);
		if (this.shell.cancelled) return;
if (!Number.isFinite(rv)){
cwarn("HERE IT IS");
log(rv);
this.shell.fatal("Non-numerical return value");
}
		if (!rv){
			rv = await this.shell.executeStatements2(conseqs[i], opts)
			if (this.shell.cancelled) return;
			this.end(rv);
			return;
		}
	}
	if (this.fallback){
		rv = await this.shell.executeStatements2(this.fallback, opts)
		if (this.shell.cancelled) return;
		return this.end(rv);
	}
	this.end(E_ERR);
}//»
}//»
class ForCom extends CompoundCom{//«

constructor(shell, opts, name, in_list, do_group){//«
	super(shell, opts);
	this.name=name;
	this.in_list=in_list;
	this.do_group=do_group;
}//»
async init(){//«
//	this.in_list = await this.shell.allExpansions(this.in_list, this.opts.env, this.opts.scriptName, this.opts.scriptArgs);
	this.in_list = await this.shell.allExpansions(this.in_list, this.opts);
	if (this.shell.cancelled) return;
}//»
async run(){//«
	const{shell}=this;
	let env = this.opts.env;
	let nm = this.name+"";
	for (let val of this.in_list){
		env[nm] = val+"";
		await shell.executeStatements2(dup(this.do_group), this.opts)
		if (shell.cancelled) return;
		await sleep(0);
	}
	this.end(E_SUC);
}//»

}//»
class WhileCom extends CompoundCom{//«

constructor(shell, opts, cond, do_group){//«
	super(shell, opts);
	this.cond = cond;
	this.do_group = do_group;
}//»
async run(){//«
	let rv = await this.shell.executeStatements2(dup(this.cond), this.opts);
	if (this.shell.cancelled) return;
	while (!rv){
		await this.shell.executeStatements2(dup(this.do_group), this.opts);
		if (this.shell.cancelled) return;
		rv = await this.shell.executeStatements2(dup(this.cond), this.opts);
		if (this.shell.cancelled) return;
		await sleep(0);
	}
	this.end(rv);
}//»

}//»
class UntilCom extends CompoundCom{//«
constructor(shell, opts, cond, do_group){//«
	super(shell, opts);
	this.cond = cond;
	this.do_group = do_group;
}//»
init(){}

async run(){//«
	let rv = await this.shell.executeStatements2(dup(this.cond), this.opts)
	if (this.shell.cancelled) return;
	while (rv){
		await this.shell.executeStatements2(dup(this.do_group), this.opts)
		if (this.shell.cancelled) return;
		rv = await this.shell.executeStatements2(dup(this.cond), this.opts)
		if (this.shell.cancelled) return;
		await sleep(0);
	}
	this.end(rv);
}//»

}//»
class FunctionCom extends CompoundCom{//«

constructor(shell, opts, name, com){//«
	super(shell, opts);
	this.name=name;
	this.com = com.compound_command.compound_list.term;
	this.type = com.type;
	this.redirs = com.redirs;
}//»
async init(){//«
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
run(){
//As commands themselves, function definitions don't do much of anything, e.g.:
//echo blah blah blah | 
	this.end(E_SUC);
}
}//»
class CaseCom extends CompoundCom{//«
constructor(shell, opts, word, list){//«
super(shell, opts);
this.word=word;
this.list=list;
}//»
async init(){//«
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
		rv = await shell.executeStatements2(item.compound_list, this.opts)
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
			rv = await this.shell.executeStatements2(item.compound_list, this.opts)
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

this.comClasses={Com,ScriptCom,NoCom,ErrCom};

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

const com_brackettest = class extends Com{//«
init(){
	if (!this.args.length || this.args.pop() !=="]") return this.no("missing ']'");
}
async run(){
	let rv = await ShellMod.util.evalShellExpr(this.args, this.term.cwd);
	if (isStr(rv)) return this.no(rv);
	this.end(rv);
}
}//»
const com_test = class extends Com{//«
init(){}
async run(){
	let rv = await ShellMod.util.evalShellExpr(this.args, this.term.cwd);
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

#promise;
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
	this.#promise = log.init({opts: this.opts, command_str: this.command_str});
}//»
async run(){//«
	await this.#promise;
	this.ok();
}//»
cancel(){
this.log.quit();
this.ok();
}
}//»
const com_bindwin = class extends Com{//«
	init(){
	}
	run(){
		const{args, no}=this;
		let numstr = args.shift();
		if (!numstr) return no(`expected a window id arg`);
		if (!numstr.match(/[0-9]+/)) return no(`${numstr}: invalid numerical argument`);
		let num = parseInt(numstr);
		let elem = document.getElementById(`win_${num}`);
		if (!elem) return no(`${numstr}: window not found`);
		let win = elem._winObj;
		if (!win) return no(`${numstr}: the window doesn't have an associated object!?!?`);
		let use_key = args.shift();
		if (!(use_key && use_key.match(/^[1-9]$/))) return no(`expected a 'key' arg (1-9)`);
		let desc = this.opts.desc || this.opts.d || win.appName;
		globals.boundWins[use_key] = {win, desc};
		win.bindNum = use_key;
		this.ok(`Ctrl+Alt+${use_key} -> win_${numstr}`);
	}
}//»
const com_echo = class extends Com{//«
	run(){
		this.out(this.args.join(" "));
		this.ok();
	}
}//»
const com_echodelay = class extends Com{//«
	async run(){
		let delay;
		if (this.opts.d) {
			delay = parseInt(this.opts.d);
			if (isNaN(delay)) {
				delay = 0;
				this.wrn(`invalid delay value (using 0 ms)`);
			}
		}
		else delay = 0;

		for (let arg of this.args){
			this.out(arg);
			await sleep(delay);
		}
		this.ok();
	}
}//»
const com_ls = class extends Com{//«

init(){
	let {opts, args}=this;
	if (!args.length) args.push("./");
	this.optAll = opts.all||opts.a;
	this.optRecur = opts.recursive || opts.R;
}
async run(){//«
	const{badLinkType, linkType, idbDataType, dirType}=ShellMod.var;
	const{pipeTo, isSub, term, args} = this;
	const out=(...args)=>{
		this.out(...args);
	};
	const err=(...args)=>{
		this.err(...args);
	};
	let no_fmt = pipeTo|| isSub;
	let nargs = args.length;
	let dir_was_last = false;
	let all = this.optAll;
	let recur = this.optRecur;
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
		if (!node.done) await fsapi.popDir(node);
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
		if (no_fmt) {
			out(dir_arr.join("\n"));
		}
		else {//«
			for (let nm of dir_arr){
				let n = kids[nm];
				if (nm.match(/\x20/)){
					nm=`'${nm}'`;
				}
				if (n.appName===FOLDER_APP) {
					types.push(dirType);
				}
				else if (n.appName==="Link") {
					if (!await n.ref) types.push(badLinkType);
					else types.push(linkType);
				}
				else if (n.blobId === idbDataType) types.push(idbDataType);
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
const com_env = class extends Com{/*«*/
run(){
	let {term, args}=this; 
	if (args.length) {
		return this.no("arguments are not supported");
	}
	let env = term.ENV;
	let keys = Object.keys(env);//let keys = env._keys;
	let out = [];
	for (let key of keys){
		let val = env[key];
		out.push(`${key}=${val}`);
	}
	this.out(out.join("\n"));
	this.ok();
}
}/*»*/
const com_parse = class extends Com{/*«*/
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
	pipeIn(val){
		if (!isEOF(val)) this.tryParse(val);
		else this.ok();
	}
}/*»*/
const com_stringify = class extends Com{/*«*/
	init(){
		if (!this.pipeFrom) return this.no("expecting piped input");
	}
	run(){
	}
	#tryStringify(val){
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
	pipeIn(val){
		if (!isEOF(val)) this.#tryStringify(val);
		else {
			this.numErrors?this.no():this.ok();
			this.ok();
		}
	}
}/*»*/
const com_clear = class extends Com{/*«*/
	run(){
		this.term.clear();
		this.ok();
	}
}/*»*/
const com_true = class extends Com{/*«*/
	run(){
		let mess;
		if (this.args.length) mess = this.args.join(" ");
		else mess = "I'm true";
		this.ok(mess);
	}
}/*»*/
const com_false = class extends Com{/*«*/
	run(){
		let mess;
		if (this.args.length) mess = this.args.join(" ");
		else mess = "I'm false";
		this.no(mess);
	}
}/*»*/
const com_cd = class extends Com{/*«*/
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
/*»*/
const com_app = class extends Com{//«

async run(){
	const{args, out, err: _err, term}=this;
	let list = await util.getList("/site/apps/");
	if (!args.length) {
		if (!list){
			return this.no("could not get the app list");
		}
		out(list.join("\n"));
		return this.ok();
	}
	let have_error=false;
	for (let appname of args){
		if (list && !list.includes(appname)) {
			_err(`${appname}: not found`);
			continue;
		}
		let win = await Desk.api.openApp(appname);
		if (!win) _err(`${appname}: not found`);
	}
	have_error?this.no():this.ok();
}

}//»

const com_msleep = class extends Com{/*«*/
	async run(){
		let ms = parseInt(this.args.shift());
		if (!Number.isFinite(ms)) ms = 0;
		await sleep(ms);
		this.ok();
	}
}/*»*/
const com_hist = class extends Com{/*«*/
	run(){
		this.out(this.term.get_history().join("\n"));
		this.ok();
	}
}/*»*/
const com_pwd = class extends Com{/*«*/
	run(){
		this.out(this.term.cur_dir);
		this.ok();
	}
}/*»*/
const com_libs = class extends Com{/*«*/
	async run(){
		this.out((await util.getList("/site/coms/")).join("\n"));
		this.ok();
	}
}/*»*/
const com_lib = class extends Com{//«
init(){
	if (!this.args.length) return this.no("no lib given");
	if (this.args.length > 1) return this.no("too many arguments");
}
async run(){
	if (this.killed) return;
	let lib = this.args.shift();
	let hold = lib;
	let got = ShellMod.var.allLibs[lib] || NS.coms[lib];
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
const com_epoch = class extends Com{/*«*/
	run(){
		this.out(Math.round((new Date).getTime()/ 1000)+"");
		this.ok();
	}
}/*»*/
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
const com_export = class extends Com{/*«*/
	run(){
		let rv = ShellMod.util.addToEnv(this.args, this.term.ENV, {if_export: true});
		if (rv.length){
			this.err(rv.join("\n"));
			this.no();
		}
		else this.ok();
	}
}/*»*/
const com_curcol = class extends Com{/*«*/
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
}/*»*/
const com_read = class extends Com{//«

async run(){
	const {args, opts, term, stdin} = this;
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
//cwarn("READ!!!");
//log(stdin);
	let ln;
	if (stdin) {
		if (!stdin.length) return this.no();
		ln = stdin.shift();
	}
	else ln = await term.readLine(use_prompt);
	let vals = ln.trim().split(/ +/);
	while (args.length){
		let arg = args.shift();
		if (ShellMod.var.noSetEnvVars.includes(arg)) {
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
}

}//»
const com_math = class extends Com{//«
#lines;
#math;
async init(){
	if (!this.args.length && !this.pipeFrom) {
		return this.no("nothing to do");
	}
	if (!this.args.length){
		this.#lines=[];
	}
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
    this.#math = new NS.mods["util.math"]();
}
#doMath(str){

	try{
		this.inf(`evaluating: '${str}'`);
		this.out(this.#math.eval(str)+"");
		this.ok();
	}catch(e){
//cerr(e);
		this.no(e.message);
	}
}
run(){
	if (this.killed || !this.args.length) return;
	this.#doMath(this.args.join(" "));
}
pipeIn(val){
    if (!this.#lines) return;
    if (isEOF(val)){
        this.out(val);
        this.#doMath(this.#lines.join(" "));
        return;
    }
    if (isStr(val)) this.#lines.push(val);
    else if (isArr(val)) this.#lines.push(...val);
    else{
cwarn("WUTISTHIS", val);
    }
}
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
const com_import = class extends Com{/*«*/
async run(){
	let {term, err: _err, opts, args}=this;
	let have_error = false;
	const err=(arg)=>{
		_err(arg);
		have_error = true;
	};
	if (opts.delete || opts.d){
		ShellMod.util.deleteComs(args);
		this.ok();
		return;
	}
	await ShellMod.util.doImports(args, err);
	have_error?this.no():this.ok();
}
}/*»*/


this.defCommands={//«
//const shell_commands={
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
	ls: {//«
		s: {
			a: 1,
//			l: 1,
//			r: 1,
			R: 1
		},
		l: {
//			long: 1,
			all: 1,
			recursive: 1
		}
	},//»
	read:{l:{prompt:3}},
	import:{s:{d:1},l:{delete: 1}},
	echodelay:{s:{d: 3}},
	bindwin:{s:{d:3},l:{desc: 3}},
	test: true,
	"[": true
};//»

}//»Builtin commands

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
/*Token Classes (Words, Quotes, Subs)«*/

const Sequence = class {//«
	constructor(start, env){
//		this.par = par;
		this.env = env;
		this.val = [];
		this.start = start;
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
			let arr = rv.split("\n");
			if (arr.length) {
				curfield+=arr.shift();
				fields.push(curfield);
				let last = arr.pop();
				if (arr.length) fields.push(...arr);
				if (last) curfield = last;
				else curfield = "";
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
		curfield += "'"+ent.toString()+"'";
	}
//	else if (ent instanceof ParamSub){
//		let rv = await ent.expand(shell, term, env, scriptName, scriptArgs);
//		curfield+=rv;
//	}
	else{//Must be isStr«
		curfield += ent.toString();
	}//»
}
fields.push(curfield);
this.fields = fields;
}//»

quoteRemoval(){//«
	let s='';
	let qtyp;
	let arr = this.val;
	for (let l=0; l < arr.length; l++){
		let c = arr[l];
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
	this.val = [...s];
}//»
tildeExpansion(){//«
	const {val} = this;
	let parts = this.assignmentParts;
	let home_path = globals.HOME_PATH;
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
//const ASSIGN_RE = /^([_a-zA-Z][_a-zA-Z0-9]*(\[[_a-zA-Z0-9]+\])?)=(.*)/;
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
toString(){/*«*/
//We actually need to do field splitting instead of doing this...
//log("TOSTRING!!!", this.val.join(""));
//log(this.fields);
//If only 0 or 1 fields, there will be no newlines
//if (this.fields) return this.fields.join("\n");
return this.val.join("");
}/*»*/
get isChars(){/*«*/
	let chars = this.val;
	for (let ch of chars) {
		if (!isStr(ch)) return false;
	}
	return true;
}/*»*/
get isSimple(){/*«*/
	for (let ent of this.val){
		if (ent instanceof DQuote){
			for (let ent2 of ent.val){
				if (!isStr(ent2)) return false;
			}
		}
		else if (!(isStr(ent)||(ent instanceof SQuote)||(ent instanceof DSQuote))) return false;
	}
	return true;
}/*»*/

}//»
const SQuote = class extends Sequence{/*«*/
	expand(){
		return this.toString();
	}
	dup(){
		return this;
	}
	toString(){
		return this.val.join("");
	}
}/*»*/
const DSQuote = class extends Sequence{/*«*/
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
for (let i=0; i < arr.length; i++){/*«*/
	let ch = arr[i];
	let next = arr[i+1];
	if (ch.escaped){
	let c;
//switch(ch){/*«*/
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

else if (ch=='x'){/*«*/
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
}/*»*/

//\ddd yields the byte whose value is the octal value ddd (one to three octal digits).
else if(ch=="0"|| ch=="1"|| ch=="2"|| ch=="3"|| ch=="4"|| ch=="5"|| ch=="6"|| ch=="7"){/*«*/
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
}/*»*/

//The behavior of an unescaped <backslash> immediately followed by any other
//character, including <newline>, is unspecified.

//\cX yields the control character listed in the Value column of Values for
//cpio c_mode Field in the OPERANDS section of the stty utility when X is one
//of the characters listed in the ^c column of the same table, except that \c\\
//yields the <FS> control character since the <backslash> character has to be
//escaped.

//}/*»*/
	if (c) out.push(c);
	else out.push(ch);
	}
	else{
		out.push(ch);
	}
}/*»*/
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
}/*»*/

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

return out.join("\n");

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

}//»
//XMKJDHE
const ParamSub = class extends Sequence{//«

//KLSDHSKD
expand(shell, term, opts){/*«*/
const{env,scriptName, scriptArgs}=opts;
//expand(shell, term, env, scriptName, scriptArgs){
for (let ch of this.val){
if (!isStr(ch)){
//log(this.val.toString());
throw new Error("sh: bad substitution");
}
}
	let s = this.val.join("");
	let marr;
	if (s.match(/^[_a-zA-Z]/)){
		return env[s]||"";
	}
	if (marr = s.match(/^([1-9])$/)){/*«*/
		if (!scriptName) return "";
		let n = parseInt(marr[1])-1;
		return scriptArgs[n]||"";
	}/*»*/
	if (SPECIAL_SYMBOLS.includes(s)){/*«*/
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
	}/*»*/
cwarn("HERE IS THE WEIRD PARAM SUB...");
log(s);
throw new Error("WHAT KIND OF PARAM SUB IS THIS???");
}/*»*/
dup(){//«
	let param = new ParamSub(this.start, this.par, this.env);
	let arr = param.val;
	for (let ent of this.val){
		if (isStr(ent)) arr.push(ent);
		else arr.push(ent.dup());
	}
	return param;
}//»

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
}//»
const MathSub = class extends Sequence{//«

async expand(shell, term){//«
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
		if (ent.expand) s+=await ent.expand(shell, term);
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

}//»
this.seqClasses={
	Sequence, Newlines, Word, SQuote, DSQuote, DQuote, BQuote, ParamSub, ComSub, MathSub
}

/*»*/
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
const COMPOUND_NON_START_WORDS = [/*«*/
	'then',
	'else',
	'elif',
	'fi',
	'do',
	'done',
	'esac',
	'}',
	'in'
];/*»*/
const RESERVERD_WORDS = [/*«*/
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
];/*»*/
const RESERVED_START_WORDS = [/*«*/
	"{",
	"for",
	"if",
	"while",
	"until",
	"case"
];/*»*/

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
};//»
eol(){//«
	return this.isInteractive && (this.index >= this.length);
}//»
async more(no_nl){/*«*/
	if (!this.eol()){
		throw new Error("more() was call, but NOT at eol()");
	}
	let nl;
	if (no_nl) nl="";
	else nl="\n";
	let rv = nl+(await this.term.readLine("> "));
//log(RV, `${rv}`);
	this.source = this.source.concat(...rv);
	this.length = this.source.length;
}/*»*/
throwUnexpectedToken(message) {//«
	if (message === void 0) { message = Messages.UnexpectedTokenIllegal; }
	return this.errorHandler.throwError(this.index, this.lineNumber, this.index - this.lineStart + 1, message);
};//»

skipSingleLineComment() {//«
	while (!this.eof()) {
//		let ch = this.source.charCodeAt(this.index);
		let code = this.source[this.index].charCodeAt();
		if (isLineTerminator(code)) {
			return;
		}
		this.index++;
	}
};//»
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

async scanQuote(par, which, in_backquote, cont_quote){//«
//log("scanQuote", which, this.index);
// If we are in double-quotes or back-quotes, we need to check for:
// 2) '$(': scanComSub
	let check_subs = which==='"'||which==="`";

//If we are in double quotes, need to check for backquotes
	let check_bq = which==='"';
//let check_subs
//	let out=[];

	let start;
	if (!cont_quote){
	 	start = this.index;
	}
	let src = this.source;
	let len = src.length;
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
	let ch = src[cur];
	let rv;
	let next;
	while(ch && ch !== end_quote){
		if (ch==="`" && in_backquote){
			return `unexpected EOF while looking for matching '${which}'`;
		}
		if (check_subs&&ch==="$"&&(src[cur+1]==="("||src[cur+1]==="{")) {//«
			this.index=cur;
			if (src[cur+2]==="("){
//				rv = await this.scanComSub(quote, true, is_bq||in_backquote);
				rv = await this.scanSub(quote, {isMath: true, inBack: is_bq||in_backquote});
				if (rv===null) this.throwUnexpectedToken(`unterminated math expression`);
			}
			else if (src[cur+1]==="{"){
//				rv = await this.scanComSub(quote, true, is_bq||in_backquote);
				rv = await this.scanSub(quote, {isParam: true, inBack: is_bq||in_backquote});
				if (rv===null) this.throwUnexpectedToken(`unterminated parameter substitution`);
			}
			else{
//				rv = await this.scanComSub(quote, null, is_bq||in_backquote);
				rv = await this.scanSub(quote, {isComSub: true, inBack: is_bq||in_backquote});
				if (rv===null) this.throwUnexpectedToken(`unterminated command substitution`);
			}
			if (isStr(rv)) this.throwUnexpectedToken(rv);
			out.push(rv);
			cur=this.index;
		}//»
		else if (check_subs && ch==="$" && src[cur+1] && src[cur+1].match(/[_a-zA-Z]/)){
			this.index=cur;
			rv = await this.scanParam();
			out.push(rv);
			cur=this.index;
		}
		else if (check_subs && ch==="$" && src[cur+1] && (src[cur+1].match(/[1-9]/)||SPECIAL_SYMBOLS.includes(src[cur+1]))){
			let sub = new ParamSub(cur);
			sub.val=[src[cur+1]];
			out.push(sub);
			this.index++;
		}
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
			ch = src[cur];
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
		else if (is_bq && ch==="$" && src[cur+1]==="'"){//«
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
		ch = src[cur];
	}
	this.index = cur;
	if (ch !== end_quote) {
		if (this.eol()){
			quote.val = out;
			await this.more();
			return await this.scanQuote(par, which, in_backquote, quote);
		}
		return null;
	}
	return quote;
}//»
scanParam(){//«

	let start = this.index;
	const sub = new ParamSub(start);
	this.index++;
	let cur = this.index;
	let out=[this.source[cur]];
	cur++;
	let ch = this.source[cur];
	while(ch && ch.match(/[_0-9a-zA-Z]/)){
		out.push(ch);
		cur++;
		ch = this.source[cur];
	}
	this.index = cur-1;
	sub.val = out;
	return sub;

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
let in_backquote = opts.inBack;
let cont_sub = opts.contSub;

////async scanComSub(par, is_math, in_backquote, cont_sub){
/*
We need to collect words rather than chars if:
If par is a top-level word, then 
or:
If we are not embedded in any kind of quote
*/
//log("scanComSub", this.index);

let start = this.index;
//const sub = cont_sub || (is_math ? new MathSub(start, par) : new ComSub(start, par));
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
else if (ch==="("){
	paren_depth++;
}
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
		return `unexpected EOF while looking for matching '${say_ch}'`;
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
		let rv = await this.scanSub(sub, {isMath: true, inBack: in_backquote});
		if (rv===null) return `unterminated math expansion`;
		if (isStr(rv)) return rv;
		out.push(rv);
		cur=this.index;
	}
	else if (this.source[cur+1]==="{"){
		this.index=cur;
		let rv = await this.scanSub(sub, {isParam: true, inBack: in_backquote});
		if (rv===null) return `unterminated parameter expansion`;
		if (isStr(rv)) return rv;
		out.push(rv);
		cur=this.index;
	}
	else{
		this.index=cur;
////async scanComSub(par, is_math, in_backquote, cont_sub){
//		let rv = await this.scanComSub(sub, false, in_backquote);
		let rv = await this.scanSub(sub, {isComSub: true, inBack: true});
		if (rv===null) return `unterminated command substitution`;
		if (isStr(rv)) return rv;
		out.push(rv);
		cur=this.index;
	}
	have_space = false;
}//»
		else if (ch==="$" && this.source[cur+1] && this.source[cur+1].match(/[_a-zA-Z]/)){//«
			this.index=cur;
			let sub = await this.scanParam();
			out.push(sub);
			cur = this.index;
		}//»
		else if (ch==="$" && this.source[cur+1] && (this.source[cur+1].match(/[1-9]/)||SPECIAL_SYMBOLS.includes(this.source[cur+1]))){//«
			let sub = new ParamSub(cur);
			sub.val=[this.source[cur+1]];
			out.push(sub);
			this.index++;
		}//»
else if (is_param && ch==="}"){
	this.index = cur;
	return sub;
}
else if (paren_depth === 0 && is_comsub && ch===")"){//«
	this.index = cur;
	return sub;
}//»
else if (paren_depth === 0 && is_math && ch===")"){//«
	if (this.source[cur+1] !== ")") {
		return "expected a final '))'";
	}
	this.index = cur+1;
	return sub;
}//»
else if (ch===")"){
	if (paren_depth) {
		paren_depth--;
	}
	else return "unexpected token: ')'";
}
else if (ch===" " || ch==="\t"){//«
	out.push(ch);
	have_space = true;
}//»
else{
if (ch==="#"&&have_space){
return 'the substitution was terminated by "#"';
}
	out.push(ch);
	have_space = false;
}

cur++;
ch = this.source[cur];

}
this.index = cur;

if (this.eol()){
	sub.val = out;
	await this.more();
//	return await this.scanComSub(par, is_math, in_backquote, sub);
	return await this.scanSub(par, {isMath: is_math, isComSub: is_comsub, isParam: is_param, inBack: in_backquote, contSub: sub, parenDepth: paren_depth});
}


//If we get here, we are "unterminated"
return null;

}//»
scanOperator(){/*«*/

	let src = this.source;
	let start = this.index;
	let str = src[start];
	let obj={};
	switch(str){
	case '(':/*«*/
		obj.isSubStart = true;
		obj.isCommandStart = true;
		++this.index;
		break;
	case ')':
		obj.isSubEnd = true;
		obj.isPatListEnd = true;
		++this.index;
		break;/*»*/
	case '&':/*«*/
		++this.index;
		if (src[this.index]==="&"){
			this.index++;
			str="&&";
			obj.isAndIf = true;
		}
		break;/*»*/
	case '|':/*«*/
		++this.index;
		if (src[this.index]==="|"){
			this.index++;
			str="||";
			obj.isOrIf = true;
		}
		else{
			obj.isPipe = true;
			obj.isPatListSep = true;
		}
		break;/*»*/
	case '>'://«
		++this.index;
		if ([">","&","|"].includes(src[this.index])){
			str+=src[this.index];
			++this.index;
		}
		break;/*»*/
	case '<':/*«*/
		++this.index;
	//'<<',
	//'<>',
	//'<<-',
	//'<<<',
		if (src[this.index]===">"){
			str = "<>";
			++this.index;
		}
		else if (src[this.index]==="<"){
			++this.index;
			if (src[this.index]==="<"){
				++this.index;
				str = "<<<";
			}
			else if (src[this.index]==="-"){
				++this.index;
				str = "<<-";
				obj.isHeredoc = true;
			}
			else{
				str="<<";
				obj.isHeredoc = true;
			}
		}
		break;/*»*/
	case ';':
		++this.index;
		if (src[this.index]===";"){
			this.index++;
			str=";;";
			obj.isDSemi = true;
			obj.isCaseItemEnd = true;
		}
		else if (src[this.index]==="&"){
			this.index++;
			str=";&";
			obj.isSemiAnd = true;
			obj.isCaseItemEnd = true;
		}
		break;
	}
	if (this.index === start) {
		this.throwUnexpectedToken(`Unexpected token ${str}`);
	}
	let check_unsupported_toks = globals.dev_mode ? UNSUPPORTED_DEV_OPERATOR_TOKS : UNSUPPORTED_OPERATOR_TOKS;
	if (check_unsupported_toks.includes(str)) this.throwUnexpectedToken(`unsupported operator '${str}'`);

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

}/*»*/
async scanWord(par, env){/*«*/
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
	let _word = new Word(start);
	let word = _word.val;
	let is_plain_chars = true;
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
					this.index++;
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
			ch = new String(next1);
			ch.escaped = true;
			this.index++;
			word.push(ch);
		}//»
		else if (ch==="$" && next1 === "(" && next2==="("){//«
			is_plain_chars = false;
//			rv = await this.scanComSub(_word, true);
			rv = await this.scanSub(_word, {isMath: true});
			if (rv===null) this.throwUnexpectedToken(`unterminated math expression`);
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			word.push(rv);
		}//»
		else if (ch==="$" && next1 === "("){//«
			is_plain_chars = false;
//			rv = await this.scanComSub(_word);
			rv = await this.scanSub(_word, {isComSub: true});
			if (rv===null) this.throwUnexpectedToken(`unterminated command substitution`);
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			word.push(rv);
		}//»
		else if (ch==="$" && next1 === "{"){//«
			is_plain_chars = false;
			rv = await this.scanSub(_word, {isParam: true});
			if (rv===null) this.throwUnexpectedToken(`unterminated parameter substitution`);
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			word.push(rv);
		}//»
		else if ((ch==="$"&&next1==="'")||ch==="'"||ch==='"'||ch==='`'){//«
			is_plain_chars = false;
			rv = await this.scanQuote(_word, ch);
			if (rv===null) {
				if (ch=="'"){
					this.throwUnexpectedToken(`unterminated quote: "${ch}"`);
				}
				else{
					this.throwUnexpectedToken(`unterminated quote: '${ch}'`);
				}
			}
			else if (isStr(rv)) this.throwUnexpectedToken(rv);
			word.push(rv);
		}//»
		else if (ch==="$" && next1 && next1.match(/[_a-zA-Z]/)){
			is_plain_chars = false;
			rv = await this.scanParam();
			word.push(rv);
		}
		else if (ch==="$" && next1 && (next1.match(/[1-9]/)||SPECIAL_SYMBOLS.includes(next1))){
			let sub = new ParamSub(this.index);
			sub.val=[next1];
			word.push(sub);
			this.index++;
		}
		else if (ch==="\n"||ch===" "||ch==="\t") break;
		else if (OPERATOR_CHARS.includes(ch)) {//«
			break;
		}//»
		else {
			word.push(ch);
		}
		this.index++;
	}
	if (is_plain_chars){//«
		let wrd = word.join("");
		if (RESERVERD_WORDS.includes(wrd)) {
			_word.isRes = true;
			if (RESERVED_START_WORDS.includes(wrd)) {
				_word.isCommandStart = true;
				_word.isResStart = true;
			}
			else{
				_word.isCommandStart = false;
			}
//	if then else elif fi do done case esac while until for { } in
			switch(wrd){

			case "if": _word.isIf=true;break;
			case "then": _word.isThen=true;break;
			case "else": _word.isElse=true;break;
			case "elif": _word.isElif=true;break;
			case "fi": _word.isFi=true;break;
			case "do": _word.isDo=true;break;
			case "done": _word.isDone=true;break;
			case "case": _word.isCase=true;break;
			case "esac": _word.isEsac=true;break;
			case "while": _word.isWhile=true;break;
			case "until": _word.isUntil=true;break;
			case "for": _word.isFor=true;break;
			case "{": _word.isLBrace=true;break;
			case "}": _word.isRBrace=true;break;
			case "in": _word.isIn=true;break;
			default: 
cwarn("What is the word below, not RESERVED_WORDS!!!");
log(wrd);
				this.fatal(`WUTTHEHELLISTHISWORD --->${wrd} <---- ^&*^$#&^&*$ (see console)`);

			}
		}
		else{//Not reserverd word (is_plain_chars == true)
			_word.isCommandStart = true;
		}
	}//»
	else{
//is_plain_chars == false
		_word.isCommandStart = true;
	}
	_word.raw = this.source.slice(start, this.index).join("");
//log(raw);
	return _word;
}/*»*/
scanNewlines(par, env, heredoc_flag){/*«*/

	let start = this.index;
	let src = this.source;
//	let str="";
	let val = [];
	let iter=0;
	let start_line_number = this.lineNumber;
	let start_line_start = this.index;
	while (src[start+iter]==="\n"){
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

}/*»*/
scanNextLineNot(delim){/*«*/
	let cur = this.index;
	let src = this.source;
	let ln='';
	let ch = src[cur];
	while(ch!=="\n"){
		if (!ch) break;
		ln+=ch;
		cur++;
		ch = src[cur];
	}
	this.index = cur+1;
	if (ln===delim) {
		return true;
	}
	if (this.eof()) return false;
	return ln;
}/*»*/
async lex(heredoc_flag){/*«*/

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

//if (ch==="\n") this.scanNewlines();

/*
if (ch==="\\"){
	let next = this.source[this.index+1];
	if (!next || next === "\n") this.throwUnexpectedToken("unsupported line continuation");
	return this.scanWord();
}
*/
if (OPERATOR_CHARS.includes(ch)) {
	if (UNSUPPORTED_OPERATOR_CHARS.includes(ch)) this.throwUnexpectedToken(`unsupported token: '${ch}'`);
	return this.scanOperator();
}
return await this.scanWord(null, this.env);

}/*»*/

};

//»

//Parser«

const Parser = class {

constructor(code, opts={}) {//«
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
pushNewline(){/*«*/
	let nl = new Newlines();
	nl.inserted = true;
	this.tokens.push(nl);
//LCMJHFUEM
	this.numToks++;
}/*»*/
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
	return false;
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
	while ((rv = await this.term.readLine("> ")).match(/^[\x20\t]*(#.+)?$/)){}
	return rv;
}//»
async getMoreTokensFromTerminal(){//«
	let rv = await this.getNonEmptyLineFromTerminal();
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
/*
eatRedirects(){//«
//	const{toks}=this;
//	const toks = this.tokens;
	let err = this.fatal;
	let tok = this.curTok();
	let list=[];
	while(tok && tok.isRedir){
		let rop = tok;
if (rop.isHeredoc){
//XPJSKLAJ
cwarn("SKIPPING THIS HEREDOC...");
log(rop.value);
}
else {
		this.tokNum++;
		let fname = this.tokens[this.tokNum];
		if (!fname) err("syntax error near unexpected token 'newline'");
		if (!fname.isWord) err(`syntax error near unexpected token '${fname.toString()}'`);
		if (!fname.isChars) err(`wanted characters only in the filename`);
		list.push({redir: [rop, fname], isRedir: true, dup:()=>{
			return {redir: [rop, fname.dup()], isRedir: true};
		}});
}
		this.tokNum++;
		tok = this.curTok();
	}
	return list;
}//»
*/
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

async parseCasePatternList(seq_arg){/*«*/

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

}/*»*/
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
async parseCaseList(seq_arg){/*«*/
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

}/*»*/
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

if (tok.isOp){/*«*/
	if (!tok.isSubStart) this.unexp(tok);;
	com = await this.parseSubshell();
}/*»*/
else if (tok.isResStart){/*«*/
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
}/*»*/
else{/*«*/
	this.unexp(tok);
}/*»*/

let redirs = this.eatRedirects();
com.redirs = redirs;
return com;

}//»
async parseCommand(force_compound){//«
let toks = this.tokens;
let err = this.fatal;
let tok = this.curTok();
//log("PARSECOM", force_compound, tok.toString());
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
		return this.parseFuncDef();// blah(  or foo  (
	}
	if (force_compound) return false;
	return this.parseSimpleCommand();
}//»
else if(tok.isOp){//«
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
	return e.message;
}

}//»
async tokenize(){/*«*/
	let toks = [];
	let next = this.lookahead;
	let cur_iohere_tok;
	let heredocs;
	let heredoc_num;
	let cur_heredoc_tok;
	let cur_heredoc;
	let interactive = this.isInteractive;
	while (next.type !== EOF_Type) {

//If !heredocs && next is "<<" or "<<-", we need to:
		if (heredocs && isNLs(next)){//«
if (interactive){
throw new Error("AMIWRONG OR UCAN'T HAVENEWLINESININTERACTIVEMODE");
}
			for (let i=0; i < heredocs.length; i++){
				let heredoc = heredocs[i];
				let rv = this.nextLinesUntilDelim(heredoc.delim);
				if (!isStr(rv)){
					this.fatal("warning: here-document at line ? delimited by end-of-file");
				}
				heredoc.tok.value = rv;
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
	if (heredocs){//«
		if (!interactive) this.fatal("warning: here-document at line ? delimited by end-of-file");
		for (let i=0; i < heredocs.length; i++){
			let heredoc = heredocs[i];
			let rv = await this.heredocScanner(heredoc.delim);
			heredoc.tok.value = rv.join("\n");
		}
		heredocs = null;
	}//»
	if (cur_heredoc_tok){//«
		this.fatal("syntax error near unexpected token 'newline'");
	}//»

//YJDHSLFJS

for (let i=0; i < toks.length; i++){
let tok = toks[i];
if (!tok.isRedir) {
//log("TOK",tok);
	continue;
}
let next = toks[i+1];
let rop = tok.r_op;
if (tok.isHeredoc){/*«*/
	toks[i] = new Stdin(tok);
	toks[i].isHeredoc = true;
}/*»*/
else if (OK_OUT_REDIR_TOKS.includes(rop)){/*«*/
	if (!next) this.unexp("newline");
	if (!next.isWord) this.unexp(next);
	toks[i] = new Stdout(tok, next);
	toks.splice(i+1, 1);
} /*»*/
else if (OK_IN_REDIR_TOKS.includes(rop)) {/*«*/
	if (!next) this.unexp("newline");
	if (!next.isWord) this.unexp(next);
	toks[i] = new Stdin(tok, next);
	toks.splice(i+1, 1);
}/*»*/
else this.fatal(`unsupported operator: '${rop}'`);
}

	this.tokens = toks;
	this.numToks = toks.length;
	return true;
}/*»*/
//async parse() {//«
//	return await this.compile();
//
//};//»

};

//»

class Shell {//«

constructor(term){//«
	this.term = term;
	this.env = term.env;
	this.cancelled = false;
}//»

fatal(mess){throw new Error(mess);}
async expandComsub(tok, opts){//«
//const expand_comsub=async(tok, shell, term)=>
	const{term}=this;
//	const err = term.resperr;
const err=(mess)=>{
term.response(mess, {isErr: true});
};
	let s='';
	let vals = tok.val;
	for (let ent of vals){
		if (ent.expand) {
			if (ent instanceof DQuote){
/*Amazingly, having internal newline characters works here because they
are treated like any other character inside of scanQuote()
@DJJUTILJJ is where all the "others" characters (including newlines, "\n") are 
pushed into the quote's characters.
*/
				s+='"'+(await ent.expand(this, term, opts))+'"';
			}
			else if (ent instanceof DSQuote){
//Don't need to wrap it in $'...' again if we are actuall expanding it
//				s+="'"+(await ent.expand(shell, term))+"'";

//Otherwise, wrap it up like we found it...
				s+="$'"+(ent.toString())+"'";
			}
			else {
				if (ent instanceof SQuote) {
					s+="'"+ent.toString()+"'";
				}
				else s+=(await ent.expand(this, term, opts)).split("\n").join(" ");
			}
		}
		else {
			if (ent instanceof SQuote){
				s+="'"+ent.toString()+"'";
			}
			else {
				 s+=ent.toString();
			}
		}
	}
	let sub_lines = [];
	try{
		await this.devexecute(s, {subLines: sub_lines, env: sdup(this.env), shell: this});
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
//const filepath_expansion=async(tok, cur_dir)=>{
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
//log(ch);
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
//		if (ch.wasExpanded) patstr+="\\"+ch;
//		else patstr+=ch.toString();
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
			let re = new RegExp("^" + nm + "$");
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
//cerr(e);
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
};/*»*/
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
/*
stripRedirs(com){//«
	let redirs = [];
	if (!com.prefix) com.prefix=[];
	if (!com.suffix) com.suffix=[];
	let pref = com.prefix;
	for (let i=0; i < pref.length; i++){
		if (pref[0].isHeredoc) {
			redirs.push(pref[0]);
			pref.splice(i, 1);
			i--;
		}
		else if (pref[0].isRedir) {
			redirs.push(pref[0].redir);
			pref.splice(i, 1);
			i--;
		}
	}
	let suf = com.suffix;
	for (let i=0; i < suf.length; i++){
		if (suf[0].isHeredoc) {
			redirs.push(suf[0]);
			suf.splice(i, 1);
			i--;
		}
		else if (suf[0].isRedir) {
			redirs.push(suf[0].redir);
			suf.splice(i, 1);
			i--;
		}

	}
	return redirs;
}//»
*/
async allExpansions(arr, shopts={}, opts={}){//«
//async allExpansions(arr, env, scriptName, scriptArgs, opts={}){
const{env,scriptName,scriptArgs} = shopts;
const{term}=this;
const{isAssign}=opts;
//let in_redir, out_redir;
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
/*
for (let k=0; k < arr.length; k++){//parameters«
	let tok = arr[k];
	if (tok.isWord) {
		let rv = tok.parameterExpansion(env, scriptName, scriptArgs);
		if (isStr(rv)) return rv;
//jlog(tok.val);
	}
}//»
*/
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
//			let out=[];
//			let out="";
//			for (let field of tok.fields) out.push(...field.split("\n"));
//			for (let field of tok.fields) out+=field+"\n";
//			tok.val=out.join(" ");
//tok.val=out;
tok.val=tok.fields.join("\n");
//log(tok.val);
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
//return {arr, inRedir: in_redir, outRedir: out_redir};
//return {arr, inRedir: in_redir, outRedir: out_redir};
return arr;
}//»
async tryImport(com, comword){//«
//If we have a string rather than a function, do the command library importing routine.
//The string is always the name of the library (rather than the command)
//This happens when: 
//1) libraries are defined in ShellMod.var.preloadLibs, and 
//2) this is the first invocation of a command from one of those libraries.
	try{
		await ShellMod.util.importComs(com);//com is the library name
		if (this.cancelled) return;
	}catch(e){
		if (this.cancelled) return;
cerr(e);
		return `sh: command library: '${com}' could not be loaded`;
	}
	let gotcom = Shell.activeCommands[comword];
	if (!(gotcom instanceof Function)){
		return `sh: '${comword}' is invalid or missing in command library: '${com}'`;
	}
	return gotcom;
}//»

makeCompoundCommand(com, opts){//«
	let typ = com.type;
	let comp = com.compound_command;
	if (typ === "if_clause") {/*«*/
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
		return new IfCom(this, opts, conditions, consequences, fallback);
	}/*»*/
	if (typ === "brace_group") return new BraceGroupCom(this, opts, comp.compound_list.term);
	if (typ === "subshell") return new SubshellCom(this, opts, comp.compound_list.term);
	if (typ === "for_clause") return new ForCom(this, opts, comp.name, comp.in_list, comp.do_group.compound_list.term);
	if (typ === "case_clause") return new CaseCom(this, opts, comp.word, comp.list);
	if (typ === "while_clause") return new WhileCom(this, opts, comp.condition.compound_list.term, comp.do_group.compound_list.term);
	if (typ === "until_clause") return new UntilCom(this, opts, comp.condition.compound_list.term, comp.do_group.compound_list.term);
	if (typ === "function_def") return new FunctionCom(this, opts, comp.name, comp.body.function_body.command);
	this.fatal(`What Compound Command type: ${type}`);
}//»

//async makeCommand(arr, opts){
async makeCommand({assigns=[], name, args=[]}, opts){//«
	const{term}=this;
	const makeShErrCom = ShellMod.util.makeShErrCom;
	const {envRedirLines, envPipeInCb, scriptOut, stdin, outRedir, scriptArgs, scriptName, subLines, heredocScanner, env, isInteractive}=opts;
	let comobj, usecomword;
//log(assigns);

	let rv
	if (assigns.length) {
//		rv = await this.allExpansions(assigns, env, scriptName, scriptArgs, {isAssign: true});
		rv = await this.allExpansions(assigns, opts, {isAssign: true});
		if (isStr(rv)) return `sh: ${rv}`;
//IFKLJFSN
		rv = ShellMod.util.addToEnv(assigns, name?sdup(env):env, {term});
		if (rv.length) term.response(rv.join("\n"), {isErr: true});
	}

	const com_env = {//«
		stdin,
		outRedir,
		isSub: !!subLines,
		scriptOut,
		term,
		env,
		command_str: this.commandStr,
		shell: this,
		envPipeInCb,
		envRedirLines
	}//»
//XXXXXXXXXXXX
	if (!name) {
		return new NoCom();
	}
	let arr = [name, ...args];
//	rv = await this.allExpansions(arr, env, scriptName, scriptArgs);
	rv = await this.allExpansions(arr, opts);
	if (isStr(rv)) return `sh: ${rv}`;
	{
		let hold = arr;
		arr = [];
		for (let arg of hold) {
			arr.push(arg.toString());
		}
	}
	let comword = arr.shift();
	if (ShellMod.var.aliases[comword]){//«
//Replace with an alias if we can
//This should allow aliases that expand with options...
		let alias = ShellMod.var.aliases[comword];
		let ar = alias.split(/\x20+/);
		alias = ar.shift();
		if (ar.length){
			arr.unshift(...ar);
		}
		usecomword = alias;
	}//»
	else usecomword = comword;
	if (usecomword=="exit"){//«
		if (opts.isTopLevel){
			term.response("sh: not exiting the toplevel shell", {isWrn: true});
			return {code: lastcomcode, breakStatementLoop: true};
		}
		let numstr = arr.shift();
		let code;
		if (numstr){
			if (!numstr.match(/^-?[0-9]+$/)) term.response("sh: exit: numeric argument required", {isErr: true});
			else code = parseInt(numstr);
		}
		else if (arr.length) {
			term.response("sh: exit: too many arguments", {isErr: true});
		}
		if (!Number.isFinite(code)) code = E_ERR;
		code = new Number(code);
		code.isExit = true;
		return code;
	}//»
	let com = Shell.activeCommands[usecomword];
	if (isStr(com)){//QKIUTOPLK«
		com = await this.tryImport(com, usecomword);
		if (this.cancelled) return;
		if (isStr(com)) return com;
	}//»
	if (term.funcs[usecomword]){
let func = term.funcs[usecomword](this, arr, opts, com_env);
func.isFunc = true;
return func;

	}
	if (!com) {//Command not found!«
//If the user attempts to use, e.g. 'if', let them know that this isn't that kind of shell
//Need to do this for matching stuff
		comword = comword.toString();
		if (CONTROL_WORDS.includes(comword)){
			return `sh: ${comword}: control structures are not implemented`;
		}

		if (!comword.match(/\x2f/)) {
//It doesn't look like a file.
			ShellMod.var.lastExitCode = E_ERR;
			return makeShErrCom(comword, `command not found`, com_env);
		}

		let node = await fsapi.pathToNode(normPath(comword, term.cur_dir));
		if (!node) {
			ShellMod.var.lastExitCode = E_ERR;
			return makeShErrCom(comword, `file not found`, com_env);
		}
		let app = node.appName;
		if (app===FOLDER_APP) {
			ShellMod.var.lastExitCode = E_ERR;
			return makeShErrCom(comword, `is a directory`, com_env);
		}
		if (app!==TEXT_EDITOR_APP) {
			ShellMod.var.lastExitCode = E_ERR;
			return makeShErrCom(comword, `not a text file`, com_env);
		}
		if (!comword.match(/\.sh$/i)){
			ShellMod.var.lastExitCode = E_ERR;
			return makeShErrCom(comword, `only executing files with '.sh' extension`, com_env);
		}
		let text = await node.text;
		if (!text) {
			ShellMod.var.lastExitCode = E_ERR;
			return makeShErrCom(comword, `no text returned`, com_env);
		}
		comobj = new ScriptCom(this, comword, text, arr, com_env);
		comobj.scriptOut = scriptOut;
		comobj.subLines = subLines;
		return comobj;
	}//»

	let com_opts;
	let gotopts = Shell.activeOptions[usecomword];
//Parse the options and fail if there is an error message
//OEORMSRU
	if (gotopts === true) com_opts = {};
	else {
		rv = ShellMod.util.getOptions(arr, usecomword, gotopts);
		if (rv[1]&&rv[1][0]) {
			ShellMod.var.lastExitCode = E_ERR;
			return makeShErrCom(comword, rv[1][0], com_env);
		}
		com_opts = rv[0];
	}
	try{//«new Com
		comobj = new com(usecomword, arr, com_opts, com_env);
		comobj.scriptOut = scriptOut;
		comobj.subLines = subLines;
		return comobj;
	}
	catch(e){
cerr(e);
//VKJEOKJ
//As of 11/26/24 This should be a 'com is not a constructor' error for commands
//that have not migrated to the new 'class extends Com{...}' format
		return makeShErrCom(usecomword, e.message, com_env);
	}//»
//SKIOPRHJT
}//»

async executePipeline2(pipe, loglist, loglist_iter, opts){//«
	const{term}=this;
	const makeShErrCom = ShellMod.util.makeShErrCom;
	let lastcomcode;
//	let {stdin: optStdin, scriptOut, scriptArgs, scriptName, subLines, heredocScanner, env, isInteractive}=opts;
	let {stdin: optStdin, scriptArgs, scriptName, subLines, heredocScanner, env, isInteractive}=opts;
	let in_background = false;
	let pipelist = pipe.pipe;
	if (!pipelist){
		return `sh: pipeline list not found!`;
	}
	let pipetype = pipe.type;
	let pipeline = [];
	let hasBang = pipe.hasBang;
	let screenGrab = {grabber: ""};
	let last_com;
	for (let j=0; j < pipelist.length; j++) {//«
		let com = pipelist[j];
		let rv;

//DNGZXER
		let in_redir, out_redir;
		let redirs = com.redirs;
//log(com);
		for (let red of redirs){
			if (red.isStdin) in_redir = red;
			else if (red.isStdout) out_redir = red;
			else{
cwarn("Here is the non stdin/stdout redir");
log(red);
				this.fatal("Unknown token in com.redirs!?!?! (see console)");
			}
		}
		let stdin;
		let errmess;
		if (in_redir){
//			let rv2 = await in_redir.setValue(this, term, env, scriptName, scriptArgs);
			let rv2 = await in_redir.setValue(this, term, opts);
			if (isStr(rv2)){
				errmess = rv2;
			}
			else{
				stdin = in_redir.value;
			}
		}

		let comopts=sdup(opts);
/*
		for (let k in opts){
			comopts[k] = opts[k];
		}
*/
		comopts.stdin = stdin || optStdin;
		comopts.outRedir = out_redir;
		if (errmess){
			rv = makeShErrCom(null, errmess, {term, shell: this});
		}
		else if (com.compound_command){
			rv = await this.makeCompoundCommand(com, comopts, errmess)
		}
		else if (com.simple_command){
			rv = await this.makeCommand(com.simple_command, comopts, errmess)
		}
		else{//«
cwarn("Here is the command");
log(com);
			this.fatal("What type of command is this (not 'simple' or 'compound'!!! (see console))");
		}//»
		if (this.cancelled) return;
		if (isStr(rv)) return rv;
		if (last_com){
			last_com.nextCom = rv;
			last_com.pipeTo = true;
		}
		if (j > 0) rv.pipeFrom = true;
		pipeline.push(rv);
		last_com = rv;
	}//»
	this.pipeline = pipeline;

for (let com of pipeline){//«
	await com.init();
	if (this.cancelled) return;
}//»
for (let com of pipeline){//«
	if (!com.killed) com.run();
	else{
log(`Not running (was killed): ${com.name}`);	
	}
}//»
for (let com of pipeline){//«

	lastcomcode = await com.awaitEnd;

	if (this.cancelled) return;

	if (!(isNum(lastcomcode))) {
		lastcomcode = E_ERR;
	}
	if (!com.redirLines) continue;
//	let {err} = await ShellMod.util.writeToRedir(term, com.redirLines, com.outRedir, env);
	let val;
	if (com.redirLines instanceof Uint8Array) val = com.redirLines;
	else val = com.redirLines.join("\n");
	let rv = await com.outRedir.write(term, val, env, this.var.allowRedirClobber)
	if (this.cancelled) return;
	if (rv===true) continue;
	if (isStr(rv)) term.response(`sh: ${rv}`, {isErr: true});
	else {
cwarn("Here is the value below");
log(rv);
	return `unknown value returned from redir.write!!! (see console)`
}

}//»

if (hasBang){//«
	if (lastcomcode === E_SUC) lastcomcode = E_ERR;
	else lastcomcode = E_SUC;
}//»
ShellMod.var.lastExitCode = lastcomcode;

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

async executeAndOr2(andor_list, andor_sep, opts){//«

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

	let rv = await this.executePipeline2(loglist[i], loglist, i, opts);
//continue;
	if (this.cancelled) return;
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

async executeStatements2(statements, opts){//«
	const{term}=this;
	let lastcomcode;
	for (let i=0; i < statements.length-1; i+=2){
		lastcomcode = await this.executeAndOr2(statements[i].andor, statements[i+1], opts);
		if (isObj(lastcomcode) && lastcomcode.breakStatementLoop) break;
	}
	return lastcomcode;
}//»

//SLDPEHDBF
async devexecute(command_str, opts){//«
	const{term}=this;
	let parser = new Parser(command_str.split(""), opts);
	try{

		let errmess;
//Must use await because it could possibly need more lines from the terminal, so we can't do
//this in the constructor (like esprima does)
		await parser.scanNextTok();
		await parser.tokenize();
		let ast = await parser.compile();
		if (!ast) return;
		let statements=[];
		for (let compcoms of ast.program.complete_commands){
			let list = compcoms.complete_command.list;
			statements.push(...list);
		}
		return await this.executeStatements2(statements, opts);
//log(statements);
	}
	catch(e){
//cerr(e);
term.response(e.message,{isErr: true});
	}
//	term.response_end();

}/*»*/

cancel(){//«
	this.cancelled = true;
	let pipe = this.pipeline;
	if (!pipe) return;
	for (let com of pipe) com.cancel && com.cancel();
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

let preloads = this.var.preloadLibs;

for (let k in preloads){
	this.var.allLibs[k] = preloads[k];
}

for (let k in preloads){
	let arr = preloads[k];
	for (let com of arr) {
		if (this.defCommands[com]){
cwarn(`The shell command: ${com} already exists (also defined in this.var.preloadLibs: ${k})`);
			continue;
		}
		this.defCommands[com]=k;
	}
}

Shell.activeCommands = globals.shell_commands || this.defCommands;
if (!globals.shell_commands) {
	globals.shell_commands = this.defCommands;
}

Shell.activeOptions = globals.shell_command_options || this.defCommandOpts;
if (!globals.shell_command_options) {
	globals.shell_command_options = this.defCommandOpts;
}

}//»

}

const ShellMod = globals.ShellMod;
const Shell = ShellMod.Shell;
ShellMod.init();

//»

//Terminal«

let USE_ONDEVRELOAD = false;

export const app = class {

//Private Vars«
#readLineCb;
#readLinePromptLen;
#getChCb;
#getChDefCh;
#doContinue;
//»
constructor(Win){//«

this.Win=Win;

this.ShellMod = globals.ShellMod;
this.Shell = globals.ShellMod.Shell;
this.main = Win.main;
this.mainWin = Win.main;
this.Desk = Win.Desk;
this.statusBar = Win.statusBar;
this.appClass="cli";
this.isEditor = false;
this.isPager = false;
this.env={};
this.env['USER'] = globals.CURRENT_USER;
//this.env = globals.TERM_ENV;
this.ENV = this.env;
//this.funcs = globals.TERM_FUNCS;
this.funcs={};
//Editor mode constants for the renderer (copy/pasted from vim.js)«
this.modes= {
	command:1,
	insert:2,
	replace:3,
	visLine:4,
	visMark:5,
	visBlock:6,
	cutBuffer:7,
	lineWrap:8,
	symbol: 9,
	file: 10,
	complete: 11,
	ref: 12
};
//»

//let this.paragraphSelectMode = true; //Toggle with Ctrl+Alt+p«
/*
When using the text editor, we have to manually insert line breaks inside of paragraphs
at the end of every line:

-------------------------------------
These are a bunch of words that I'm   
writing, so I can seem very
literate, and this is a crazily-
hyphenated-word!

Here comes another paragraph...
-------------------------------------

With this.paragraphSelectMode turned on, the system clipboard will contain the following
text upon executing the this.doCopyBuffer command with Cltr+Alt+a (a_CA).

-------------------------------------
These are a bunch of words that I'm writing, so I can seem very literate, and this is a crazily-hyphenated-word!

Here comes another paragraph...
-------------------------------------

The actual line buffer in the editor is left unchanged. This is just a convenience function
to allow for seamless copying between the editor and web-like applications that handle their 
own formatting of paragraphs.

Toggling of this.paragraphSelectMode is now done with Ctrl+Alt+p (p_CA).

»*/
this.paragraphSelectMode = true;


this.isScrolling = false;
this.didInit = false;
this.winid = this.Win.id;
this.cursorId = `cursor_${this.winid}`;
this.numId = this.winid.split("_")[1];

this.tabSize=4;
this.minTermWid = 15;
this.maxTabSize = 256;
this.comCompleters = ["help", "app", "appicon", "lib", "import"];
this.okReadlineSyms = ["DEL_","BACK_","LEFT_", "RIGHT_"];
this.stat={
	ok: 1,
	warning: 2,
	error: 3
};

this.x=0;
this.y=0;
this.numCtrlD = 0;
this.cleanCopiedStringMode=false;
this.doExtractPrompt = true;
this.maxOverlayLength=42;
this.terminalIsLocked=false;

//vim row folds
this.rowFoldColor = "rgb(160,160,255)";
this.bgCol="#080808";
this.ff = "monospace";
this.fw="500";
this.curBG="#00f";
this.curFG="#fff";
this.curBGBlurred = "#444";
this.overlayOp="0.66";
this.tCol = "#e3e3e3";
this.highlightActorBg = false;
this.actorHighlightColor="#101010";

this.noPromptMode=false;
this.comScrollMode=false;

this.bufPos=0;
this.curPromptLine=0;
this.numStatLines=0;
this.scrollNum=0;
this.minFs=8;
this.defFs=24;
this.maxFmtLen=4997;
this.rootState = false;
this.lsPadding = 2;
this.lines=[];
this.lineColors=[];
this.currentCutStr="";
this.history=[];

this.env['USER'] = globals.CURRENT_USER;
this.cur_dir = this.getHomedir();
this.cwd = this.cur_dir;

this.makeDOMElem();

this.setFontSize();
this.resize();

}//»

makeDOMElem(){//«

const{main}=this;
main._tcol="black";
main._bgcol=this.bgCol;

let overdiv = make('div');//«
overdiv._pos="absolute";
overdiv._loc(0,0);
overdiv._w="100%";
overdiv._h="100%";
this.Win.overdiv=overdiv;
//»
let wrapdiv = make('div');//«
wrapdiv.id="termwrapdiv_"+this.winid;
wrapdiv._bgcol=this.bgCol;
wrapdiv._pos="absolute";
wrapdiv._loc(0,0);

wrapdiv._tcol = this.tCol;
wrapdiv._fw = this.fw;
wrapdiv._ff = this.ff;
wrapdiv.style.whiteSpace = "pre";
//»
let tabdiv = make('div');//«
tabdiv.id="termtabdiv_"+this.winid;
tabdiv.style.userSelect = "text"
tabdiv._w="100%";
tabdiv._pos="absolute";
tabdiv.onmousedown=(e)=>{this.downEvt=e;};
tabdiv.onmouseup=e=>{//«
	if (!this.downEvt) return;
	let d = util.dist(e.clientX,e.clientY,this.downEvt.clientX, this.downEvt.clientY);
	if (d < 10) return;
//	focus_or_copy();
	this.focusOrCopy();
};//»
tabdiv.onclick=e=>{//«
	e.stopPropagation();
	if (this.dblClickTimeout){
		clearTimeout(this.dblClickTimeout);
//		dbldblclick_timeoutick_timeout
		this.dblClickTimeout=null;
		setTimeout(()=>{
			this.focusOrCopy();
		},333);
		return;
	}
	setTimeout(()=>{
		this.focusOrCopy();
	},500);
};//»
tabdiv.ondblclick = e => {//«
	e.stopPropagation();
	this.dblClickTimeout = setTimeout(()=>{
		this.focusOrCopy();
	}, 500);
};//»
tabdiv._loc(0,0);
tabdiv.style.tabSize = this.tabSize;
wrapdiv.tabdiv = tabdiv;
//»
let statdiv = make('div');//«
statdiv._w="100%";
statdiv._h="100%";
statdiv._pos="absolute";
statdiv._loc(0,0);
//»
let textarea = make('textarea');//«
textarea.id = `textarea_${this.Win.id}`;
textarea._noinput = true;
textarea.width = 1;
textarea.height = 1;
textarea.style.opacity = 0;
textarea.focus();
//»
let areadiv = make('div');//«
areadiv._pos="absolute";
areadiv._loc(0,0);
areadiv._z=-1;
areadiv.appendChild(textarea);
//»

//let overlay;«

let fakediv = make('div');
fakediv.innerHTML = `<div style="opacity: ${this.overlayOp};border-radius: 15px; font-size: xx-large; padding: 0.2em 0.5em; position: absolute; -webkit-user-select: none; transition: opacity 180ms ease-in; color: rgb(16, 16, 16); background-color: rgb(240, 240, 240); font-family: monospace;"></div>`;
let overlay = fakediv.childNodes[0];
overlay.id = "overlay_"+this.winid;

//»

//Listeners«
const onpaste = e =>{//«
//	if (pager) return;
	textarea.value="";
	setTimeout(()=>{
		let val = textarea.value;
		if (!(val&&val.length)) return;
		if (this.isEditor) this.actor.check_paste(val);
		else this.doPaste();
	}
	,25);
}//»
textarea.onpaste = onpaste;
main.onwheel=e=>{//«
	if (!this.sleeping){
		let dy = e.deltaY;
		if (!this.isScrolling){
			if (!this.scrollNum) return;
			if (dy > 0) return;
			this.scrollNumHold = this.scrollNum;
			this.isScrolling = true;
//			wheel_iter = 0;
			this.wheelIter=0;
		}
		let skip_factor = 10;
/*
		if (this.env.SCROLL_SKIP_FACTOR){
			let got = this.env.SCROLL_SKIP_FACTOR.ppi();
			if (!Number.isFinite(got)) cwarn(`Invalid SCROLL_SKIP_FACTOR: ${this.env.SCROLL_SKIP_FACTOR}`);
			else skip_factor = got;
		}
*/
		this.wheelIter++;
//		wheel_iter++;
		if (this.wheelIter%skip_factor) return;
		if (dy < 0) dy = Math.ceil(4*dy);
		else dy = Math.floor(4*dy);
		if (!dy) return;
		this.scrollNum += dy;
		if (this.scrollNum < 0) this.scrollNum = 0;
		else if (this.scrollNum >= this.scrollNumHold) {
			this.scrollNum = this.scrollNumHold;
			this.isScrolling = false;
		}
		this.render();
	}
};//»
main.onscroll=e=>{e.preventDefault();this.scrollMiddle();};
main.onclick=()=>{
	textarea&&textarea.focus();
}
overdiv.onmousemove = e=>{//«
	e.stopPropagation();
	if (Desk) Desk.mousemove(e);
};//»
//»
wrapdiv.appendChild(tabdiv);
main.appendChild(wrapdiv);
main.appendChild(areadiv);

this.tabSize = parseInt(tabdiv.style.tabSize);
this.textarea = textarea; 
this.areadiv = areadiv;
this.tabdiv = tabdiv;
this.wrapdiv = wrapdiv;
this.overlay = overlay;
this.statdiv = statdiv;
}//»

//Execute«

async execute(str, opts={}){//«

	const shell = new this.Shell(this);

	this.curShell = shell;
	let gotstr = str.trim();

	str = str.replace(/\x7f/g, "");

//XKLRSMFLE
	const heredocScanner=async(eof_tok)=>{//«
		let doc = [];
		let didone = false;
		let prmpt="> ";
		let rv;
		while (true){
			let rv = await this.readLine(prmpt);
			if (rv===eof_tok) break;
			doc.push(rv);
			didone = true;
		}
		return doc;
	}//»

//PLDYHJKU
	await this.curShell.devexecute(str, {
		env: this.env,
		heredocScanner,
		isInteractive: true,
		term: this,
		shell: this.curShell
	});
//log(this.curShell);
	if (this.curShell === shell && !shell.cancelled) this.responseEnd();

	if (opts.noSave) return;

	let ind = this.history.indexOf(gotstr);
	if (ind >= 0) {
		this.history.splice(ind, 1);
	}
	else{
		await this.appendToHistory(gotstr);
	}
	this.history.push(gotstr);
}
//»
executeBackgroundCommand(s){//«

	let shell = new this.Shell(this, true);
	let env = {};
	for (let k in this.env){
		env[k]=this.env[k];
	}
	shell.execute(s,{env});

}//»

//»

//Util«

setFontSize(){//«
	let gotfs = localStorage.Terminal_fs;
	if (gotfs) {
		let val = strNum(gotfs);
		if (isNum(val,true)) this.grFs = val;
		else {
			this.grFs = this.defFs;
			delete localStorage.Terminal_fs;
		}
	}
	else this.grFs = this.defFs;
	this.wrapdiv._fs = this.grFs;
}//»

tryKill(){//«
	if (this.isEditor) {
		this.actor.stat_message="Really close the window? [Y/n]";
		this.render();
		this.actor.set_ask_close_cb();
	}
	else{
cwarn("TRY_KILL CALLED BUT this.isEditor == false!");
	}
}
//»

async getch(promptarg, def_ch){//«
	if (promptarg){
		for (let ch of promptarg) this.handleLetterPress(ch);
	}
	this.sleeping = false;
	return new Promise((Y,N)=>{
		this.#getChDefCh = def_ch;
		this.#getChCb = Y;
	});
}
//»
async readLine(promptarg){//«
	const{lines}=this;
	if (lines[lines.length-1]&&lines[lines.length-1].length){
		this.lineBreak();
		this.curPromptLine = this.y+this.scrollNum-1;
	}
	this.x=0;
	this.sleeping = false;
	if (promptarg){
		this.#readLinePromptLen = promptarg.length;
		for (let ch of promptarg) this.handleLetterPress(ch);
	}
	else this.#readLinePromptLen = 0;
	this.x = this.#readLinePromptLen;
	return new Promise((Y,N)=>{
		this.#readLineCb = Y;
	});
}
//»
setTabSize(s){//«
	if (!s.match(/[0-9]+/)) return;
	let n = parseInt(s);
	if (n==0||n>this.maxTabSize) return;
	this.tabdiv.style.tabSize = n;
	this.tabSize = tabdiv.style.tabSize;
	return true;
}
//»
curWhite(){this.curBG="#ddd";this.curFG="#000";}
curBlue(){this.curBG="#00f";this.curFG="#fff";}
stat(mess){this.statusBar.innerText=mess;};
async getLineFromPager(arr, name){//«
	if (!await util.loadMod(DEF_PAGER_MOD_NAME)) {
		return poperr("Could not load the pager module");
	}
	let less = new LOTW.mods[DEF_PAGER_MOD_NAME](this);
	if (await less.init(arr, name, {lineSelect: true, opts: {}})) return arr[less.y+less.this.scrollNum];

}//»
async selectFromHistory(path){//«
	let arr = await path.toLines();
	if (!isArr(arr) && arr.length) {
cwarn("No history lines from", path);
		return;
	}
	this.curScrollCommand = await this.getLineFromPager(arr, path.split("/").pop());
	if (this.curScrollCommand) this.insertCurScroll();
	this.render();
}
//»

togglePaste(){//«
	const{textarea}=this;
	if (textarea){
		textarea._del();
		this.textarea = null;	
		this.doOverlay("Pasting is off");
		return;
	}
	textarea = make('textarea');
	textarea._noinput = true;
	textarea.width = 1;
	textarea.height = 1;
	textarea.style.opacity = 0;
	textarea.onpaste = onpaste;
	areadiv.appendChild(textarea);
	textarea.focus();
	this.textarea = textarea;
	this.doOverlay("Pasting is on");
}
//»

doPaste(){//«
	let val = this.textarea.value;
	if (val && val.length) this.handleInsert(val);
	this.textarea.value="";
};
//»
checkScrolling(){//«
	if (this.isScrolling){
		this.scrollNum = this.scrollNumHold;
		this.isScrolling = false;
		this.render();
		return true;
	}
	return false;
}
//»

wrapLine(str){//«
	str = str.replace(/\t/g,"\x20".rep(this.tabSize));
	let out = '';
	let w = this.w;
	while (str.length > w){
		if (!out) out = str.slice(0,w);
		else out = out+"\n"+str.slice(0,w);
		str = str.slice(w);
	}
	if (str.length>0){
		if (!out) out = str;
		else out = out+"\n"+str;
	}
	return out;
}
//»

objToString(obj ){//«
	if (obj.id) return `[object ${obj.constructor.name}(${obj.id})]`;
	return `[object ${obj.constructor.name}]`;
}
//»
async getHistory(val){//«
	let fnode = await fsapi.pathToNode(HISTORY_FOLDER);
	if (!fnode){
		if (!await fsapi.mkDir(globals.HOME_PATH, ".history")){
cerr("Could not make the .history folder!");
			return;
		}
	}
	else if (fnode.appName !== FOLDER_APP){
		cwarn("History directory path is NOT a directory!!!");
		return;
	}
	let node = await fsapi.pathToNode(HISTORY_PATH);
	if (!node) return;
	let text = await node.text;
	if (!text) return;
	return text.split("\n");
}
//»
scrollMiddle(){//«
	const{main}=this;
	let y1 = main.scrollTop;
	main.scrollTop=(main.scrollHeight-main.clientHeight)/2;
	let y2 = main.scrollTop;
}
//»
focusOrCopy(){//«
	let sel = window.getSelection();
	if (sel.isCollapsed)this.textarea&&this.textarea.focus();
	else this.doClipboardCopy();
}
//»

getHomedir(){//«
	if (this.rootState) return "/";
	return globals.HOME_PATH;
}
//»
getBuffer(if_str){//«
	let ret=[];
	if (if_str) ret = "";
	let ln;
	let uselines;
	if (this.actor && this.actor.get_lines) uselines = this.actor.get_lines();//in foldmode, vim's lines contain fold markers
	else uselines = this.lines;
	for (let i=0; i < uselines.length; i++) {
		ln = uselines[i].join("").replace(/\u00a0/g, " ");
		if (if_str) ret +=  ln + "\n"
		else ret.push(ln);
	}

	if (this.actor && (this.paragraphSelectMode || this.actor.parSel)){//Paragraph select mode
		if (if_str) ret = ret.split("\n");
		ret = linesToParas(ret);
		if (if_str) ret = paras.join("\n");
		else ret = paras;
	}

	return ret;
}
//»
curDateStr(){//«
	let d = new Date();
	return (d.getMonth()+1) + "/" + d.getDate() + "/" + d.getFullYear().toString().substr(2);
}
//»
extractPromptFromStr(str){//«
	if (!this.doExtractPrompt) return str;
	let prstr = this.getPromptStr();
	let re = new RegExp("^"+prstr.replace("$","\\$"));
	if (re.test(str)) str = str.substr(prstr.length);
	return str;
}
//»
copyText(str, mess){//«
	const{textarea}=this;
	const SCISSORS_ICON = "\u2702";
	if (!textarea) return;
	if (!mess) mess = SCISSORS_ICON;
	textarea.focus();
	textarea.value = str;
	textarea.select();
	document.execCommand("copy")
	this.doOverlay(mess);
}
//»
doCopyBuffer()  {//«
	this.copyText(this.getBuffer(true), "Copied: entire buffer");
}//»

doClipboardCopy(if_buffer, strarg){//«
	const{textarea}=this;
const do_copy=str=>{//«
    if (!str) return;
    str = str.replace(/^[\/a-zA-Z]*[$#] /,"");
    let copySource = make("pre");
    copySource.textContent = str;
    copySource.style.cssText = "-webkit-user-select: text;position: absolute;top: -99px";
    document.body.appendChild(copySource);
    let selection = document.getSelection();
    let anchorNode = selection.anchorNode;
    let anchorOffset = selection.anchorOffset;
    let focusNode = selection.focusNode;
    let focusOffset = selection.focusOffset;
    selection.selectAllChildren(copySource);

    document.execCommand("copy")
    if (selection.extend) {
        selection.collapse(anchorNode, anchorOffset);
        selection.extend(focusNode, focusOffset)
    }
    copySource._del();
}//»
	let str;
	if (strarg) str = strarg;
	else if (if_buffer) str = this.getBuffer(true);
	else str = getSelection().toString()
	if (this.cleanCopiedStringMode) {
		str = str.replace(/\n/g,"");
//		str = extract_prompt_from_str(str);
		str = this.extractPromptFromStr(str);
	}
	else {
//cwarn("Do you really ever want this string to be stripped of newlines and the prompt? this.cleanCopiedStringMode==false !!!");
	}

	do_copy(str);
	this.textarea.focus();
	this.doOverlay(`Copied: ${str.slice(0,9)}...`);
}
//»
doClipboardPaste(){//«
//	if (!textarea) return;
	this.textarea.value = "";
	document.execCommand("paste")
}
//»
doOverlay(strarg){//«
	let str;
	if (strarg) {
		str = strarg;
		if (str.length > this.maxOverlayLength) str = str.slice(0,this.maxOverlayLength)+"...";
	}
	else str = this.w+"x"+this.h;
	this.overlay.innerText = str;
	if (this.overlayTimer) clearTimeout(this.overlayTimer);
	else this.main.appendChild(this.overlay);
	util.center(this.overlay, this.main);
	this.overlayTimer = setTimeout(()=>{
		this.overlayTimer = null;
		this.overlay._del();
	}, 1500);
}
//»
setNewFs(val){//«
	this.grFs = val;
	localStorage.Terminal_fs = this.grFs;
	wrapdiv._fs = this.grFs;
	this.resize();
}
//»
getMaxLen(){//«
	let max_len = this.maxFmtLen;
	let maxlenarg = this.env['MAX_FMT_LEN'];
	if (maxlenarg && maxlenarg.match(/^[0-9]+$/)) max_len = parseInt(maxlenarg);
	return max_len;
}
//»
checkLineLen(dy){//«
	const{lines, w}=this;
//	const{cy}=this.cy();
	if (!dy) dy = 0;
	const new_y = this.cy()+dy;
	if (lines[new_y].length > w) {
		let diff = lines[new_y].length-w;
		for (let i=0; i < diff; i++) lines[new_y].pop();
	}
//	if (lines[this.cy()+dy].length > this.w) {
//		let diff = lines[this.cy()+dy].length-this.w;
//		for (let i=0; i < diff; i++) lines[this.cy()+dy].pop();
//	}
}
//»
cy(){//«
	return this.y + this.scrollNum;
}//»


//»
//Render«

render(opts={}){//«

	const{tabdiv, actor}=this;
//Var«

//	let actor = editor||pager;
//	const{actor}=this;
	let stat_x;
	if (actor) {
		stat_x = actor.stat_x;
		this.x=actor.x;
		this.y=actor.y;
		this.scrollNum = actor.scroll_num;
		if (!stat_x) stat_x = this.x;
	}
	let seltop;
	let selbot;
	let selleft;
	let selright;
	let selmark;
	let stat_input_type;
	let stat_com_arr;
	let stat_message, stat_message_type;
	let num_lines;
	let ry;
	let mode;
	let symbol;
	let line_select_mode;

//WKKYTUHJ
	if (actor) ({stat_input_type,stat_com_arr,stat_message,stat_message_type, line_select_mode}=actor);
	if (!stat_input_type) stat_input_type="";

	if (this.isEditor) ({mode,symbol,seltop,selbot,selleft,selright,selmark,opts,num_lines,ry}=actor);
	if (!(this.nCols&&this.nRows)) return;
	let visual_line_mode = (mode===this.modes.visLine) || line_select_mode;
	if (line_select_mode) seltop = selbot = this.scrollNum+this.y;
	
	if (mode===this.modes.ref||mode===this.modes.symbol||mode===this.modes.complete){
		visual_line_mode = true;
		seltop = selbot = this.y+this.scrollNum;
	}
	let visual_block_mode = mode===this.modes.visBlock;
	let visual_mark_mode = mode===this.modes.visMark;
	let visual_mode = visual_line_mode || visual_mark_mode || visual_block_mode;
	let docursor = false;
	if (opts.noCursor){}
	else if (!(this.terminalIsLocked||this.isPager||stat_input_type||this.isScrolling)) docursor = true;
	let usescroll = this.scrollNum;
	let scry=usescroll;
	let slicefrom = scry;
	let sliceto = scry + this.nRows;
	let uselines=[];
	let is_str = false;
//	let x_scroll = 0;
//	let usex = this.x-x_scroll;
	let usex = this.x;
	let outarr = [];
	let donum;
//»
	for (let i=slicefrom; i < sliceto; i++) {//«
		let ln = this.lines[i];
		if (ln){
			uselines.push(ln.slice());
			continue;
		}
		if (!this.isEditor){
			uselines.push([""]);
			continue;
		}
		let noline = ['<span style="color: #6c97c4;">~</span>'];
		noline._noline = true;
		uselines.push(noline);
	}//»
	let len = uselines.length;//«
	if (len + this.numStatLines != this.h) donum = this.h - this.numStatLines;
	else donum = len;//»
	for (let i = 0; i < donum; i++) {//«

		let arr = uselines[i];
//DOCURSOR
		if (docursor&&i==this.y&&this.isEditor) {
			this.setXScroll(arr.slice(0, usex).join(""), usex);
		}
		let ind;
		while((ind=arr.indexOf("&"))>-1) arr[ind] = "&amp;";
		while((ind=arr.indexOf("<"))>-1) arr[ind] = "&lt;";
		while((ind=arr.indexOf(">"))>-1) arr[ind] = "&gt;";

		if (!arr||(arr.length==1&&arr[0]=="")) arr = [" "];
		let gotit = arr.indexOf(null);
		if (gotit > -1) arr[gotit] = " ";
		let curnum = i+usescroll;
		let colobj = this.lineColors[curnum];

		if (visual_mode&&seltop<=curnum&&selbot>=curnum){//«

			if (visual_line_mode) {//«
				let ln_min1 = arr.length-1;
				if (ln_min1 == -1) ln_min1=0;
				arr[0] = '<span style="background-color:#aaa;color:#000;">'+(arr[0]||" ");
				arr[ln_min1] = (arr[ln_min1]||" ")+'</span>';
			}//»
			else if (visual_mark_mode){//«
				let useleft, useright;
				if (seltop==curnum && selbot==curnum){
					useleft = selleft;
					useright = selright;
				}
				else if (curnum > seltop && curnum < selbot){
					useleft = 0;
					useright = arr.length-1;
				}
				else if (seltop===curnum){
					useright = arr.length-1;
					useleft = (curnum==this.cy())?this.x:selmark;
				}
				else if (selbot===curnum){
					useleft = 0;
					useright = (curnum==this.cy())?this.x:selmark;
				}
				else{
throw new Error("WUTUTUTU");
				}
//				useleft -= x_scroll;
//				useright -= x_scroll;
				if (useleft < 0) useleft = 0;
				if (useright < 0) useright = 0;
				let str = '<span style="color:#000;background-color:#aaa;">'+(arr[useleft]||" ");
				arr[useleft]=str;
				if (useright == -1) useright = 0;
				if (arr[useright]) arr[useright] = arr[useright]+"</span>";
				else arr[useright] = "</span>";
			}//»
			else {//visual_block_mode«
				let str;
				if (arr[selleft]) str = '<span style="color:#000;background-color:#aaa;">'+(arr[selleft]||"");
				else str = " ";
				arr[selleft]=str;
				if (arr[selright]) arr[selright] = arr[selright]+"</span>";
				else arr[selright] = "</span>";
			}//»

		}//»
		else if (arr[0]=="\xd7"){//Folded row«
//This marker is reserved as the first character for folded rows
			if (tabdiv._x) arr=[];
			else {
				arr[0]=`<span style="color:${this.rowFoldColor};">${arr[0]}`
				arr[arr.length-1]=`${arr[arr.length-1]}</span>`;
			}
		}//»
		else if (colobj){//«
//		else if (colobj){
			let nums = Object.keys(colobj);
			for (let numstr of nums) {
				if (numstr.match(/^_/)) continue;
//				let num1 = parseInt(numstr)-x_scroll;
				let num1 = parseInt(numstr);
				let obj = colobj[numstr];
				let num2 = num1 + obj[0]-1;
				let col = obj[1];
				let bgcol = obj[2];
				let str = '<span style="color:'+col+";";
				if (bgcol) str += "background-color:"+bgcol+";"
				if (!arr[num1]) str += '"> ';
				else str += '">'+arr[num1];
				arr[num1] = str;
				if (arr[num2]) arr[num2] = arr[num2]+"</span>";
				else arr[num2] = "</span>";
//log(2, arr);
if (num2 > this.w) {
//console.log("LONGLINE");
	break;
}
			}
		}//»

		if (docursor&&i==this.y) {//«
//		if (!(this.isPager||stat_input_type||this.isScrolling)) {
			let usebg;
			if (!this.isFocused) usebg = this.curBGBlurred;
			else usebg = this.curBG;
			if (!arr[usex]||arr[usex]=="\x00") arr[usex]=" ";
			else if (arr[usex]=="\n") arr[usex] = " <br>";
			let ch = arr[usex]||" ";
			let pre="";
			let usech;
			if (ch.match(/^</)&&!ch.match(/>$/)){
				let arr = ch.split(">");
				usech = arr.pop();
				pre = arr[0]+">";
			}
			else usech = ch;
			if (!usech.length) usech = " ";
			let sty = `background-color:${usebg};color:${this.curFG}`;
			arr[usex] = pre+`<span id="${this.cursorId}" style="${sty}">${usech}</span>`;
		}//»

		let s = arr.join("");
		if (actor && !arr._noline && this.highlightActorBg) outarr.push(`<span style="background-color:${this.actorHighlightColor};">${s}</span>`);
		else outarr.push(s);

	}//»
	if (actor) {//«
		let usestr;
		if (stat_input_type) {//«
			let arr,ind;
			if (!stat_com_arr.slice) arr = [];
			else arr = stat_com_arr.slice();
			while((ind=arr.indexOf("&"))>-1) arr[ind] = "&amp;";
			while((ind=arr.indexOf("<"))>-1) arr[ind] = "&lt;";
			while((ind=arr.indexOf(">"))>-1) arr[ind] = "&gt;";
			if (stat_input_type=="s/") arr.push("/");
			if (!arr[stat_x]) arr[stat_x] = " ";
			let arrstr=arr.join("");
			arr[stat_x] = `<span style="background-color:${this.curBG};color:${this.curFG}">${arr[stat_x]}</span>`;
			if (visual_mode&&stat_input_type===":") {
//			if (visual_line_mode&&stat_input_type===":") {
//				usestr = `${stat_input_type}'&lt;,'&gt;${arr.join("")}`;
				usestr = `:'&lt;,'&gt;${arr.join("")}`;
			}
			else {
				usestr = stat_input_type + arr.join("");
			}
		}//»
		else if (this.isEditor) {//«
			let mess="", messtype, messln=0;
			if (stat_message) {//«
				mess = stat_message;
				messln = mess.length;
				mess = mess.replace(/&/g,"&amp;");
				mess = mess.replace(/</g,"&lt;");

				let typ = stat_message_type;
				let bgcol=null;
				let tcol="#000";
				if (typ==this.stat.ok) bgcol="#090";
				else if (typ==this.stat.warning) bgcol="#dd6";
				else if (typ==this.stat.error) {
					bgcol="#c44";
					tcol="#fff";
				}
				if (bgcol) mess = `<span style="color:${tcol};background-color:${bgcol}">${mess}</span>`;

//				editor.stat_message=null;
				actor.stat_message=null;
				actor.stat_message_type=null;
			}//»
			else {//«
				if (mode === this.modes.insert) mess = "-- INSERT --";
				else if (mode === this.modes.replace) mess = "-- REPLACE --";
				else if (mode == this.modes.symbol) {
					if (symbol) mess = `-- SYMBOL: ${symbol} --`;
					else mess = "-- SYMBOL --";
				}
				else if (mode == this.modes.ref) {
					if (symbol) mess = `-- REF: ${symbol} --`;
					else mess = "-- REF --";
				}
				else if (mode === this.modes.complete) {
					mess = `-- COMPLETE: ${symbol} --`;
				}
				else if (visual_line_mode) mess = "-- VISUAL LINE --";
				else if (visual_mark_mode) mess = "-- VISUAL --";
				else if (visual_block_mode) mess = "-- VISUAL BLOCK --";
				else if (mode === this.modes.file) mess = "-- FILE --";
				else if (mode === this.modes.cutBuffer) mess = `-- CUT BUFFER: ${actor.cur_cut_buffer+1}/${actor.num_cut_buffers} --`;
				else if (mode === this.modes.lineWrap) mess = "-- LINE WRAP --";
				messln = mess.length;
			}//»
			let per;
			let t,b;
			if (this.scrollNum==0) t = true;
			if (!this.lines[sliceto-1]) b=true;
			if (t&&b) per = "All";
			else if (t) per="Top";
			else if (b) per = "Bot";
			else {
				if (Number.isFinite(ry)) {
					per = Math.floor(100*ry/num_lines)+"%";
				}
				else {
					let val = Math.floor(100*(this.scrollNum/(num_lines-1)));
					per = (val)+"%";
				}
			}
			let perln = per.length;
			let perx = this.w-5;
			if (perln > 4) per = "?%";
			per = "\x20".repeat(4-perln)+per;
			let lncol;
			if (mode===this.modes.lineWrap){
				lncol = (actor.line_wrap_y+1)+","+(actor.line_wrap_x+1);
			}
			else{
				lncol = (ry+1)+","+(this.x+1);
			}
			let lncolln = lncol.length;
			let lncolx = this.w - 18;
			let diff = lncolx - messln;
			if (diff <= 0) diff = 1;
			let diff2 = (perx - lncolx - lncolln);
			if (diff2 <= 0) diff2 = 1;
			let spaces = "\x20".repeat(diff) + lncol + "\x20".repeat(diff2)+per;
			let str = mess + spaces;
			usestr = `<span>${str}</span>`;

		}//»
		else if (stat_message){//«
			usestr = stat_message;
			usestr = usestr.replace(/&/g,"&amp;");
			usestr = usestr.replace(/</g,"&lt;");
			stat_message = null;
		}//»
		else if(this.isPager){//«
			let per = Math.floor(100*(usescroll+donum)/this.lines.length);
			if (per > 100) per = 100;
			let usename = (actor.fname+" ")||"";
			usestr = `${usename}${per}% of ${this.lines.length} lines (press q to quit)`;
			if (!stat_input_type) usestr = '<span style=background-color:#aaa;color:#000>'+usestr+'</span>'
		}//»
		this.updateStatLines([usestr]);
	}//»
	if (this.minHeight && this.h < this.minHeight){
		tabdiv.innerHTML=`<center><span style="background-color:#f00;color:#fff;">Min height: ${this.minHeight}</span></center>`;
	}
	else {
		tabdiv.innerHTML = outarr.join("\n");
	}
}//»
setXScroll(ln, usex){//«
	const{tabdiv}=this;
	tabdiv._x=0;
	if (!ln.length) return;
	let x_wid;
	if (ln.match(/[^\t]\t/)){//«
/*
There are embedded tabs here, so we have to do this the hard way
*/
		let cells=0;
		let chars=0;
		let tbsz = this.tabSize;
		for (let i=0; i < usex; i++){
			if (ln[i]=="\t"){
				cells++;
				if (chars===tbsz) cells++;
				chars=0;
			}
			else{
				if (chars===tbsz){
					cells++;
					chars=1;
				}
				else chars++;
			}
		}
		if (chars===tbsz) {
			cells++;
			chars=0;
		}
		x_wid = cells*this.tabWid + chars*this.cellWid;
	}//»
	else if(ln[0]==="\t") {//«
//A leading tab with no embedded tabs... a simple calculation
		let marr = ln.match(/^(\t+)/);
		if (marr){
			let n_tabs = marr[1].length;
			let rem_chars = usex - n_tabs;
			x_wid = n_tabs*this.tabWid + rem_chars*this.cellWid;
		}
	}//»
	else if (!ln.match(/\t/)){//«
//No tabs, just single width characters.
		x_wid = usex * this.cellWid;
	}//»
	if (!x_wid) return;
	let scrw = this.screenWid;
	let cellw = this.cellWid;
	let dx = scrw/2;
	let diff = scrw - x_wid;
	while(diff < cellw){
		tabdiv._x-=dx;
		diff += dx;
	}
}//»

refresh(opts){this.render(opts);}
generateStatHtml(){//«
	const{statdiv}=this;
	this.statSpans = [];
	statdiv.innerHTML="";
	let n_cont_lines = this.nRows - this.numStatLines;
	let s='';
	for (let i=0; i < n_cont_lines; i++) {
		let sp = make('div');
		sp.innerHTML=" ";
		statdiv.appendChild(sp);
	}
	for (let i=0; i < this.numStatLines; i++) {
		let sp = make('div');
		sp.innerHTML=" ";
		this.statSpans.push(sp);
		statdiv.appendChild(sp);
	}
}
//»
updateStatLines(arr){//«

	if (!this.numStatLines) return;
	let arrlen = arr.length;
	if (arrlen!=this.numStatLines){
cerr("What is the array size different from the numStatLines????");
		return;
	}
	if (arrlen==1) {
		this.statSpans[0].innerHTML=arr[0];
		return;
	}
	for (let i=0; i < this.numStatLines; i++) this.statSpans[i].innerHTML = arr[i];
}
//»

//»
//Curses«

getGrid(){//«

	const{tabdiv, wrapdiv}=this;
	if (!(wrapdiv._w&&wrapdiv._h)) {
		if (this.Win.killed) return;
cerr("DIMS NOT SET");
		return;
	}
	let usech = "X";

	let str = "";
	let iter = 0;
	wrapdiv._over="auto";
	while (true) {
		if (this.Win.killed) return;
		str+=usech;
		tabdiv.innerHTML = str;
		if (tabdiv.scrollWidth > wrapdiv._w) {
			tabdiv.innerHTML = usech.repeat(str.length-1);
			wrapdiv._w = tabdiv.clientWidth;
			this.nCols = str.length - 1;
			break;
		}
		iter++;
		if (iter > 1000) {
log(wrapdiv);
			cwarn("INFINITE LOOP ALERT DOING WIDTH: " + tabdiv.scrollWidth + " > " + this.w);
			return 
		}
	}
//SDOIP
	this.cellWid = wrapdiv._w/this.nCols;
	this.tabWid = this.tabSize * this.cellWid;
	this.screenWid = wrapdiv._w;
//log(this.tabWid);
//log(this.cellWid);
	str = usech;
	iter = 0;
	while (true) {
		tabdiv.innerHTML = str;
		if (tabdiv.scrollHeight > wrapdiv._h) {
			let newarr = str.split("\n");
			newarr.pop();
			tabdiv.innerHTML = newarr.join("\n");
			wrapdiv._h = tabdiv.clientHeight;
			this.nRows = newarr.length;
			break;
		}
		str+="\n"+usech;
		iter++;
		if (iter > 1000) {
log(wrapdiv);
			return cwarn("INFINITE LOOP ALERT DOING HEIGHT: " + tabdiv.scrollHeight + " > " + this.h);
		}
	}
	tabdiv.innerHTML="";
	wrapdiv._over="hidden";
}
//»
clear(){//«
	this.lines = [];
	this.lineColors = [];
	this.y=0;
	this.scrollNum = 0;
	this.render();
}//»
shiftLine(x1, y1, x2, y2){//«
	const{lines, scrollNum}=this;
	let str_arr = [];
	let start_len = 0;
	if (lines[scrollNum + y1]) {
		str_arr = lines[scrollNum + y1].slice(x1);
		start_len = lines[scrollNum + y1].length;
	}
	if (y1 == (y2 + 1)) {
		if (lines[scrollNum + y2]) lines[scrollNum + y2] = lines[scrollNum + y2].concat(str_arr);
		lines.splice(y1 + scrollNum, 1);
	}
	return str_arr;
}
//»
lineBreak(){//«
	const{lines}=this;
	if (lines[lines.length-1] && !lines[lines.length-1].length) return;
	lines.push([]);
	this.y++;
	this.scrollIntoView();
	this.render();
}
//»
scrollIntoView(which){//«
	if (!this.h) return;
	const{lines}=this;
	const doscroll=()=>{//«
		if (lines.length-this.scrollNum+this.numStatLines <= this.h) return false;
		else {
			if (this.y>=this.h) {
				this.scrollNum=lines.length-this.h+this.numStatLines;
				this.y=this.h-1;
			}
			else {
				this.scrollNum++;
				this.y--;
			}
			return true;
		}
	};//»
	let did_scroll = false;
	while (doscroll()) did_scroll = true;
	this.y=lines.length - 1 - this.scrollNum;
	return did_scroll;
}//»
resize()  {//«
	const{actor, tabdiv, wrapdiv, main}=this;
	if (this.Win.killed) return;
	wrapdiv._w = main._w;
	wrapdiv._h = main._h;
	let oldw = this.w;
	let oldh = this.h;
	this.nCols=this.nRows=0;
	tabdiv._dis="";
	wrapdiv._bgcol=this.bgCol;
	main._bgcol=this.bgCol;
	this.getGrid();
	if (this.nCols < this.minTermWid){
		tabdiv._dis="none";
		wrapdiv._bgcol="#400";
		main._bgcol="#400";
		this.locked = true;
		this.doOverlay(`Min\xa0width:\xa0${this.minTermWid}`);
		return;
	}
	if (!(this.nCols&&this.nRows)) {
		this.locked = true;
		return;
	}
	this.locked = false;
	this.w = this.nCols;
	this.h = this.nRows;
	if (!(oldw==this.w&&oldh==this.h)) this.doOverlay();
	this.lineHeight = wrapdiv.clientHeight/this.h;
	this.scrollIntoView();
	this.scrollMiddle();
	if (this.numStatLines) this.generateStatHtml();
	if (actor && actor.resize){
		actor.resize(this.w,this.h);
		return;
	}
	this.render();
}
//»

charLeft(){//«
	if (this.curScrollCommand) {
		this.insertCurScroll();
	}
	if (this.x == 0) {
		if (this.cy() == 0) return;
		if (this.cy() > this.curPromptLine) {
			if (this.y==0) {
				this.scrollNum--;
			}
			else this.y--;
			this.x = this.lines[this.cy()].length;
			if (this.x==this.w) this.x--;
			if (this.x<0) this.x = 0;
			this.render();
			return;
		}
		else return;
	}
	if (this.cy()==this.curPromptLine && this.x==this.promptLen) return;
	this.x--;
	this.render();
}//»
charRight(){//«

	if (this.curScrollCommand) this.insertCurScroll();
	//Or if this is less than w-2 with a newline for a CONT like current CLI environment.
	let nextline = this.lines[this.cy()+1];
	let thisline = this.lines[this.cy()];
	let thisch = thisline[this.x];
	let thislinelen = thisline.length;
	if (this.x == this.w-1 || ((this.x < this.w-1) && nextline && ((this.x==0&&!thislinelen) || (this.x==this.lines[this.cy()].length)))) {//«
		if (this.x<this.w-1){
			if (!thisch) {
				if (!nextline) return;
			}
		}
		else if (!thisch) return;
		if (this.lines[this.cy() + 1]) {
			this.x=0;
			if (this.y+1==this.h) this.scrollNum++;
			else this.y++;
			this.render();
		}
		else { 
			this.lines.push([]);
			this.x=0;
			this.y++;
			if (!this.scrollIntoView(9)) this.render();
			return;
		}
	}//»
	else {
		if (this.x==thislinelen||!thisch) return;
		this.x++;
		this.render();
	}

}//»
wordLeft(){//«
	if (this.curScrollCommand) this.insertCurScroll();
	let arr = this.getComArr();
	let pos;
	let start_x;
	let char_pos = null;
	let use_pos = null;
	let add_x = this.getComPos();
	if (add_x==0) return;
	start_x = add_x;
	if (arr[add_x] && arr[add_x] != " " && arr[add_x-1] == " ") add_x--;
	if (!arr[add_x] || arr[add_x] == " ") {
		add_x--;
		while(add_x > 0 && (!arr[add_x] || arr[add_x] == " ")) add_x--;
		char_pos = add_x;
	}
	else char_pos = add_x;
	if (char_pos > 0 && arr[char_pos-1] == " ") use_pos = char_pos;
	while(char_pos > 0 && arr[char_pos] != " ") char_pos--;
	if (char_pos == 0) use_pos = 0;
	else use_pos = char_pos+1;
	for (let i=0; i < start_x - use_pos; i++) this.handleArrow(LEFT_KEYCODE, "");
}//»
wordRight(){//«

	if (this.curScrollCommand) this.insertCurScroll();
	let arr;
	arr = this.getComArr();
	let pos;
	let start_x;
	let char_pos = null;
	let use_pos = null;
	let add_x = this.getComPos();
	if (add_x == arr.length) return;
	else if (!arr[add_x]) return;
	start_x = add_x;
	if (arr[add_x] != " ") {
		add_x++;
		while(add_x != arr.length && arr[add_x] != " ") add_x++;
		char_pos = add_x;
		if (char_pos == arr.length) use_pos = char_pos;
		else {
			char_pos++;
			while(char_pos != arr.length && arr[char_pos] == " ") char_pos++;
			use_pos = char_pos;
		}
	}
	else {
		add_x++;
		while(add_x != arr.length && arr[add_x] == " ") add_x++;
		use_pos = add_x;
	}
	for (let i=0; i < use_pos - start_x; i++) this.handleArrow(KC["RIGHT"], "");
}//»
seekLineStart(){//«
	if (this.curScrollCommand) this.insertCurScroll();
	this.x=this.promptLen;
	this.y=this.curPromptLine - this.scrollNum;
	if (this.y<0) {
		this.scrollNum+=this.y;
		this.y=0;
	}
	this.render();
}//»
seekLineEnd(){//«
	if (this.curScrollCommand) this.insertCurScroll();
	this.y=this.lines.length-this.scrollNum-1;
	if (this.y>=this.h){
		this.scrollNum+=this.y-this.h+1
		this.y=this.h-1;
	}
	if (this.lines[this.cy()].length == 1 && !this.lines[this.cy()][0]) this.x = 0;
	else this.x=this.lines[this.cy()].length;
	this.render();
}//»

//»
//History/Saving«

historyUp(){//«
	if (!(this.bufPos < this.history.length)) return;
	if (this.commandHold == null && this.bufPos == 0) {
		this.commandHold = this.getComArr().join("");
		this.commandPosHold = this.getComPos() + this.promptLen;
	}
	this.bufPos++;
	let str = this.history[this.history.length - this.bufPos];
	if (!str) return;
	let diffy = this.scrollNum - this.curPromptLine;
	while (this.curPromptLine+1 != this.lines.length) { 
		if (!this.lines.length){
			cerr("COULDA BEEN INFINITE LOOP: "+(this.curPromptLine+1) +" != "+this.lines.length);
			break;
		}
		this.lines.pop();
	}
	this.handleLineStr(str.trim(), true);
	this.comScrollMode = true;
}//»
historyDown(){//«

	if (!(this.bufPos > 0)) return;

	this.bufPos--;
	if (this.commandHold==null) return;
	let pos = this.history.length - this.bufPos;
	if (this.bufPos == 0) {
		this.trimLines();
		this.handleLineStr(this.commandHold.replace(/\n$/,""),null,null,true);
		this.x = this.commandPosHold;
		this.commandHold = null;
		this.render();
	}
	else {
		let str = this.history[this.history.length - this.bufPos];
		if (str) {
			this.trimLines();
			this.handleLineStr(str.trim(), true);
			this.comScrollMode = true;
		}
	}
}//»
historyUpMatching(){//«
	if (!(this.bufPos < this.history.length)) return;
	if (this.commandHold == null && this.bufPos == 0) {
		this.commandHold = this.getComArr().join("");
		this.commandPosHold = this.getComPos() + this.promptLen;
	}
	this.bufPos++;
	let re = new RegExp("^" + this.commandHold);
	for (let i = this.history.length - this.bufPos; this.bufPos <= this.history.length; this.bufPos++) {
		let str = this.history[this.history.length - this.bufPos];
		if (re.test(str)) {
			this.trimLines();
			this.handleLineStr(str.trim(), true);
			this.comScrollMode = true;
			break;
		}
	}
}//»
historyDownMatching(){//«
	if (!(this.bufPos > 0 && this.commandHold)) return;
	this.bufPos--;
	let re = new RegExp("^" + this.commandHold);
	for (let i = this.history.length - this.bufPos; this.bufPos > 0; this.bufPos--) {
		let str = this.history[this.history.length - this.bufPos];
		if (re.test(str)) {
			this.trimLines();
			this.handleLineStr(str.trim(), true);
			this.comScrollMode = true;
			return;
		}
	}
	if (this.commandHold) {
		this.trimLines();
		this.handleLineStr(this.commandHold.trim(), true);
		this.comScrollMode = true;
		this.commandHold = null;
	}
}//»
async saveSpecialCommand(){//«
	let s = this.getComArr().join("");
	if (!s.match(/[a-z]/i)) {
log("Not saving", s);
		return;
	}
	if (await fsapi.writeFile(HISTORY_PATH_SPECIAL, `${s}\n`, {append: true})) return this.doOverlay(`Saved special: ${s}`);
	poperr(`Could not write to: ${HISTORY_PATH_SPECIAL}!`);
};
//»
async appendToHistory(str){//«
	if (!await fsapi.writeFile(HISTORY_PATH, `${str}\n`, {append: true})) {
cwarn(`Could not write to history: ${HISTORY_PATH}`);
	}
};
//»
/*
async saveHistory(){//«
	if (!await fsapi.writeFile(HISTORY_PATH, this.history.join("\n")+"\n")){
		poperr(`Problem writing command history to: ${HISTORY_PATH}`);
	}
};

//»
*/
async initHistory(termBuffer){//«
	if (termBuffer) {
		this.history = termBuffer;
		return;
	}
	let arr = await this.getHistory();
	if (!arr) this.history = [];
	else {
		arr.pop();
		arr = arr.reverse();
		arr = util.uniq(arr);
		this.history = arr.reverse();
	}
}//»
//»
//Prompt/Command line«

getComPos(){//«
	let add_x=0;
	if (this.cy() > this.curPromptLine) {
		add_x = this.w - this.promptLen + this.x;
		for (let i=this.curPromptLine+1; i < this.cy(); i++) add_x+=this.w;
	}
	else add_x = this.x - this.promptLen;
	return add_x;
}
//»
getComArr(from_x){//«
	const{lines}=this;
	let com_arr = [];
	let j, line;
	for (let i = this.curPromptLine; i < lines.length; i++) {
		line = lines[i];
		if (i==this.curPromptLine) j=this.promptLen;
		else j=0;
		let len = line.length;
		for (; j < len; j++) com_arr.push(line[j]);
		if (len < this.w && i < lines.length-1) com_arr.push("\n");
	}
	return com_arr;
}
//»
async getCommandArr (dir, arr, pattern){//«
	let match_arr = [];
	let re = new RegExp("^" + pattern);
	for (let i=0; i < arr.length; i++) {
		let com = arr[i];
		if (pattern == "") {
			if (com.match(/^_/)) continue
			match_arr.push([com, "Command"]);
		}
		else if (re.test(com)) match_arr.push([arr[i], "Command"]);
	}
	return match_arr;
}
//»
getPromptStr(){//«
	let str;
	let user = this.env.USER;
	str = this.cur_dir.replace(/^\/+/, "/");
	str = str+"$";
	if ((new RegExp("^/home/"+user+"\\$$")).test(str)) str = "~$";
	else if ((new RegExp("^/home/"+user+"/")).test(str)) str = str.replace(/^\/home\/[^\/]+\x2f/,"~/");
	return str + " ";
}
//»
setPrompt(opts={})  {//«
	let use_str = opts.prompt || this.getPromptStr();
	this.Win.title=use_str.replace(/..$/,"");
	let plines;
	if (use_str==="") plines = [[""]];
	else{
		if (use_str.length+1 >= this.w) use_str = "..."+use_str.substr(-(this.w-5));
		plines = [use_str.split("")];
	}
	let line;
	let len_min1;
	if (!this.lines.length) {
		this.lines = plines;
		len_min1 = this.lines.length-1;
		this.curPromptLine = 0;
	}
	else {
		len_min1 = this.lines.length-1;
		line = plines.shift();
		if (!this.lines[len_min1][0]) this.lines[len_min1] = line;
		else {
			this.lines.push(line);
			len_min1++;
		}
		while(plines.length) {
			line = plines.shift();
			this.lines.push(line);
			len_min1++;
		}
		this.curPromptLine = len_min1;
		this.scrollIntoView();
	}
	this.promptLen = this.lines[len_min1].length;
	if (this.promptLen==1 && this.lines[len_min1][0]==="") this.promptLen=0;
	this.x=this.promptLen;
	this.y=this.lines.length - 1 - this.scrollNum;
}
//»

trimLines(){while (this.curPromptLine+1 != this.lines.length) this.lines.pop();}
insertCurScroll()  {//«
	this.comScrollMode = false;
	if (this.linesHold2) this.lines = this.linesHold2.slice(0, this.lines.length);
	let str = this.curScrollCommand;
	let arr = this.fmtLinesSync(str.split("\n"), this.promptLen);
	let curarr = this.getPromptStr().split("");
	for (let i=0; i < arr.length; i++) {
		let charr = arr[i].split("");
		for (let j=0; j < charr.length; j++) curarr.push(charr[j]);
		this.lines[this.curPromptLine + i] = curarr;
		this.y = this.curPromptLine + i - this.scrollNum;
		this.x = curarr.length;
		curarr = [];
	}
	if (this.x == this.w-1) {
		this.x=0;
		this.y++;
	}
	this.curScrollCommand = null;
	return str;
}
//»
insertCutStr(){//«
	for (let i=0; i < this.currentCutStr.length; i++) this.handleLetterPress(this.currentCutStr[i]);
}//»
doClearLine(){//«

	const{lines}=this;
	if (this.curShell) return;
	let str="";
	for (let i = lines.length; i > this.y+this.scrollNum+1; i--) str = lines.pop().join("") + str;
	let ln = lines[this.y+this.scrollNum];
	str = ln.slice(this.x).join("") + str;
	this.lines[this.y+this.scrollNum] = ln.slice(0, this.x);	
	if (this.curPromptLine < this.scrollNum) {
		this.scrollNum -= (this.scrollNum - this.curPromptLine);
		this.y=0;
	}
	this.currentCutStr = str;
	this.render();
}
//»


//»
//Tab completion«

async quoteCompletion(use_dir, tok0, arr, arr_pos){//«
//At the end of a string with exactly one non-backtick quote character...
//Just a quick and dirty way to do tab completion with quotes

	let contents;
	let have_quote;
	let s="";
	for (let i=arr_pos-1; i >=0; i--){
		let ch = arr[i];
		if (ch.match(/[\x22\x27]/)){
			have_quote = ch;
			break;
		}
		s=`${ch}${s}`;
	}
	if (s.match(/\x2f/)){
		if (s.match(/^\x2f/)) use_dir="";
		let ar = s.split("/");
		s = ar.pop();
		use_dir=`${use_dir}/${ar.join("/")}`;
	}
	let use_str= s.replace(/([\[(+*?])/g,"\\$1");
	let ret = await this.getDirContents(use_dir, use_str,{if_cd: tok0==="cd", if_keep_ast: true});
	if (!ret.length) return;
	if(ret.length===1){
		let rem = ret[0][0].slice(s.length);
		for (let ch of rem) this.handleLetterPress(ch);
		if (ret[0][1]===FOLDER_APP){
			this.handleLetterPress("/");
			this.awaitNextTab = true;
		}
		else if (ret[0][1]==="Link"){
			let obj = await fsapi.pathToNode(`${use_dir}/${use_str}${rem}`);
			if (obj && obj.appName===FOLDER_APP){
				this.handleLetterPress("/");
				this.awaitNextTab = true;
			}
			else this.handleLetterPress(have_quote);
		}
		else this.handleLetterPress(have_quote);
		return;
	}
	if (this.awaitNextTab){
		contents = ret;
		this.doContents(contents, use_dir, "", arr_pos);
		return;
	}
	let all=[];
	for (let ar of ret) all.push(ar[0]);
	let rem = util.sharedStart(all).slice(s.length);
	for (let ch of rem) this.handleLetterPress(ch);
	this.awaitNextTab = true;

}//»
async getDirContents(dir, pattern, opts={}){//«
	let {if_cd, if_keep_ast} = opts;
	const domatch=async()=>{//«
		kids = ret.kids;
		keys = Object.keys(kids);
		let match_arr = [];
		if (!if_keep_ast) pattern = pattern.replace(/\*/g, "[a-zA-Z_]*");
		pattern = pattern.replace(/\xa0/g, " ");
		let re = new RegExp("^" + pattern.replace(/\./g,"\\."));
		for (let i=0; i < keys.length; i++) {
			let key = keys[i];
			if (key=="."||key=="..") continue;
			let kid = kids[key];
			if (!this.rootState){
				let cur = kid;
				while (cur.treeroot !== true) {
					if (cur.rootonly === true) {
						kid = null;
						break;
					}
					cur = cur.par;
				}
				if (!kid) continue;
			}
			let useapp = kid.appName;
			let ret = [keys[i], useapp];
			if (useapp == "Link") ret.push(kid.link);
			if (pattern == "" || re.test(keys[i])) match_arr.push(ret);
		}
		return match_arr;
	};//»
	if (dir===null) throw new Error("this.getDirContents() no dir!");
	let ret = await fsapi.pathToNode(dir);
	if (!(ret&&ret.appName==FOLDER_APP)) return [];
	let type = ret.type;
	let kids=ret.kids;
	let keys=Object.keys(kids);
	if (type==FS_TYPE&&!ret.done) {
		let ret2 = await fsapi.popDir(ret,{});
		if (!ret2) return [];
		ret.done = true;
		ret.kids = ret2;
	}
	return domatch();
}
//»
async doGetDirContents(use_dir, tok, tok0, arr_pos)  {//«
	let ret = await this.getDirContents(use_dir, tok, {if_cd: tok0==="cd"});
	if (!ret.length) return;
	this.doContents(ret, use_dir, tok, arr_pos);
}//»
async doContents(contents, use_dir, tok, arr_pos){//«
	if (contents.length == 1) {//«

//METACHAR_ESCAPE

//\x22 -> "
//\x27 -> '
//\x60 -> `
//\x5b -> [
		let chars = contents[0][0].replace(/[ \x22\x27\x5b\x60#~{<>$|&!;()]/g, "\\$&").split("");
		let type = contents[0][1];
		tok = tok.replace(/\*$/,"");
		let str = tok;
		let handle_chars = '';
		for (let i=tok.length; i < chars.length; i++) {
			let gotch = chars[i];
			str+=gotch;
//			this.handleLetterPress(gotch);
			handle_chars+=gotch;
		}
		if (type==FOLDER_APP) {
//			this.handleLetterPress("/");//"/"
			handle_chars+="/";
			let rv = await fsapi.popDirByPath(use_dir+"/"+str,{root:this.rootState});
			if (!rv) return cerr("hdk76FH3");
		}
		else if (type=="appDir"||type=="libDir"){
//			this.handleLetterPress(".");//"/"
			handle_chars+=".";
		}
		else if (type=="Link") {
			let link = contents[0][2];
			if (!link){
cwarn("WHAT DOES THIS MEAN: contents[0][2]?!?!?!?");
			}
			else if (!link.match(/^\x2f/)) {
//cwarn("this.handleTab():  GOWDA link YO NOT FULLPATH LALA");
			}
			else {
				let obj = await fsapi.pathToNode(link);
				if (obj&&obj.appName==FOLDER_APP) {
					if (this.awaitNextTab) {
//						this.handleLetterPress("/");
						handle_chars+="/";
					}
					this.awaitNextTab = true;
				}
				else {
					if (!this.lines[this.cy()][this.x]) {
//						this.handleLetterPress(" ");
						handle_chars+=" ";
					}
				}
			}
		}
		else {
			if (!this.lines[this.cy()][this.x]) {
//				this.handleLetterPress(" ");
				handle_chars+=" ";
			}
		}
//		if (this.ssh_server) return this.ssh_server.send(JSON.stringify({chars: handle_chars}));
		for (let c of handle_chars) this.handleLetterPress(c);
	}//»
	else if (contents.length > 1) {//«
		if (this.awaitNextTab) {//«
			let diff = this.cy() - this.curPromptLine;
//			let repeat_arr = this.getComArr();
			let ret_arr = [];
			for (let i=0; i < contents.length; i++) {
				let arr = contents[i];
				let nm = arr[0];
				if (arr[1]===FOLDER_APP) nm+="/";
				ret_arr.push(nm);
			}
			let names_sorted = ret_arr.sort();
//			if (this.ssh_server) {
//				return this.ssh_server.send(JSON.stringify({names: names_sorted}));
//			}
			this.responseComNames(names_sorted);
		}//»
		else {//«
			if (!tok.length) {this.awaitNextTab = true;return;}
			let max_len = tok.length;
			let got_substr = "";
			let curstr = tok;
			let curpos = tok.length;
			TABLOOP: while(true) {
				let curch = null;
				for (let arr of contents) {
					let word = arr[0];
					if (curpos == word.length) break TABLOOP;
					if (!curch) curch = word[curpos];
					else if (curch!==word[curpos]) break TABLOOP;
				}
				curstr += curch;
				curpos++;
			}
			got_substr = curstr;

			let got_rest = got_substr.substr(tok.length);
			if (got_rest.length > 0) {
				if (contents.length > 1)this.awaitNextTab = true;
				else this.awaitNextTab = null;
				
				let chars = got_rest.split("");
				for (let i=0; i < chars.length; i++) {
					let gotch = chars[i];
					if (gotch == " ") gotch = "\xa0";
					this.handleLetterPress(gotch);
				}
			}
			else this.awaitNextTab = true;
		}//»
	}//»
}
//»
async doCompletion(){//«

	let contents;
	let use_dir = this.cur_dir;
	let arr_pos = this.getComPos();
	let arr = this.getComArr();

	let new_arr = arr.slice(0, arr_pos);
	let com_str = new_arr.join("");
	new_arr = com_str.split(/ +/);
	if (!new_arr[0] && new_arr[1]) new_arr.shift();
	let tokpos = new_arr.length;
	if (tokpos > 1) {
		if (new_arr[new_arr.length-2].match(/[\x60\(&|;] *$/)) tokpos = 1;
	}
	let tok0 = new_arr[0];
	if ((com_str.match(/[\x22\x27]/g)||[]).length===1){
		this.quoteCompletion(use_dir, tok0, arr, arr_pos);
		return;
	}
	let tok = new_arr.pop();
	tok = tok.replace(/^[^<>=]*[<>=]+/,"")
	if (tok.match(/^[^\x60;|&(]*[\x60;|&(][\/.a-zA-Z_]/)) {
		tok = tok.replace(/^[^\x60;|&(]*[\x60;|&(]/,"");
		tokpos = 1;
	}
	let got_path = null;
	if (tok.match(/\x2f/)) {//«
		tok = tok.replace(/^~\x2f/, "/home/"+this.env.USER+"/");
		got_path = true;
		let dir_arr = tok.split("/");
		tok = dir_arr.pop();
		let dir_str;
		let new_dir_str;
		if (dir_arr.length == 1 && dir_arr[0] == "") new_dir_str = "/";
		else {
			dir_str = dir_arr.join("/");
			let use_cur = this.cur_dir;
			if (dir_str.match(/^\x2f/)) use_cur = null;
			new_dir_str = util.getFullPath(dir_str, this.cur_dir);
		}
		use_dir = new_dir_str;
	}//»
	if (!(!got_path && (tokpos==1||(tokpos>1 && this.comCompleters.includes(tok0))))) {
		return this.doGetDirContents(use_dir, tok, tok0, arr_pos);
	}
	if (tokpos==1) {
		contents = await this.getCommandArr(use_dir, Object.keys(Shell.activeCommands), tok)
	}
	else {
		if (tok0 == "help"){
			contents = await this.getCommandArr(use_dir, Object.keys(Shell.activeCommands), tok)
		}
		else if (tok0 == "lib" || tok0 == "import"){
			contents = await this.getCommandArr(use_dir, await util.getList("/site/coms/"), tok)
		}
		else if (tok0 == "app" || tok0 == "appicon"){
			contents = await this.getCommandArr(use_dir, await util.getList("/site/apps/"), tok)
		}

	}
	if (contents && contents.length) this.doContents(contents, use_dir, tok, arr_pos);
	else this.doGetDirContents(use_dir, tok, tok0, arr_pos);
}//»

//»
//Response/Format«

fmtLs(arr, lens, ret, types, color_ret, col_arg){//«

/*_TODO_: In Linux, the ls command lists out (alphabetically sorted) by columns, but 
here we are doing a row-wise listing! Doing this in a column-wise fashion (cleanly and 
efficiently) is an outstanding issue...*/
	const{w}=this;
	const{dirType, linkType, badLinkType, idbDataType}=ShellMod.var;
	let pad = this.lsPadding;
//	if (!start_from) start_from=0;
	if (col_arg == 1) {//«
		for (let i=0; i < arr.length; i++) {
			if (w >= arr[i].length) ret.push(arr[i]);
			else {
				let iter = 0;
				while (true) {
					let str = arr[i].substr(iter, iter+w);
					if (!str) break;
					ret.push(str);
					iter += w;
				}
			}
		}
		return;
	}//»
	const min_col_wid=(col_num, use_cols)=>{//«
		let max_len = 0;
		let got_len;
		let use_pad = pad;
		for (let i=col_num; i < num ; i+=use_cols) {
			if (i+1 == use_cols) use_pad = 0;
			got_len = lens[i]+use_pad;
			if (got_len > max_len) max_len = got_len;
		}
		return max_len;
	};//»
	let num = arr.length;
	let col_wids = [];
	let col_pos = [0];
	let max_cols = col_arg;
	if (!max_cols) {

//SURMPLRK
//Just need to find the number of entries that would fit on the first row.
//The next rows (if there are any) cannot possibly raise the max_cols value.
//If it changes, the next rows can only make max_cols go down.
//It is absolutely insane to assume to that each file name is 1 character long!!! (This makes max_cols ridiculously big, e.g. 80/3 => 26.666666)
//                    v---------------------------------------^^^^^^^^^^^^^^^^
//		let min_wid = 1 + pad;
//		max_cols = Math.floor(w/min_wid);
//		if (arr.length < max_cols) max_cols = arr.length;

//Updated to this:
		let tot_len = 0;
		for (let i=0; i < arr.length; i++){
			tot_len += arr[i].length;
			if (tot_len > w) {
				max_cols = i;
				if (!max_cols) {
//This means that the first name is too big, and so we will only have a 1 column listing
					max_cols = 1;
				}
				break;
			}
			tot_len+=this.lsPadding;
		}
		if (!max_cols) {
//We never broke out of the loop, so we can put the entire listing on one line,
//meaning that there are as many columns as there are directory entries.
			max_cols = arr.length;
		}
//End update

	}

	let num_rows = Math.floor(num/max_cols);
	let num_cols = max_cols;
	let rem = num%num_cols;
	let tot_wid = 0;
	let min_wid;
	for (let i=0; i < max_cols; i++) {
		min_wid = min_col_wid(i, num_cols);
		tot_wid += min_wid;
		if (tot_wid > w) {
			this.fmtLs(arr, lens, ret, types, color_ret, (num_cols - 1));
			return;
		}
		col_wids.push(min_wid);
		col_pos.push(tot_wid);
	}
	col_pos.pop();
	let matrix = [];
	let row_num;
	let col_num;
	let cur_row = -1;
	let xpos;
	for (let i=0; i < num; i++) {
		let typ;
		if (types) typ = types[i];
		let color;
		if (typ==dirType) color="#909fff";
		else if (typ==linkType) color="#0cc";
		else if (typ==badLinkType) color="#f00";
		else if (typ==idbDataType) color="#cc0";
		col_num = Math.floor(i%num_cols);
		row_num = Math.floor(i/num_cols);
		if (row_num != cur_row) {
			matrix.push([]);
			xpos=0;
		}
		let nm = arr[i];
		let str = nm + " ".rep(col_wids[col_num] - nm.length);
		matrix[row_num][col_num] = str;
		if (color_ret) {
			let use_row_num = row_num;
			if (!color_ret[use_row_num]) color_ret[use_row_num] = {};
			let uselen = nm.length;
			if (arr[i].match(/\/$/)) uselen--;
			if (color) color_ret[use_row_num][xpos] = [uselen, color];
		}
		xpos += str.length;
		cur_row = row_num;
	}
	for (let i=0; i < matrix.length; i++) ret.push(matrix[i].join(""));
	return;
}
//»
fmt2(str, type, maxlen){//«
    if (type) str = type + ": " + str;
    let ret = [];
    let w = this.w;
    let dopad = 0;
    if (maxlen&&maxlen < w) {
        dopad = Math.floor((w - maxlen)/2);
        this.w = maxlen;
    }

    let wordarr = str.split(/\x20+/);
    let curln = "";
    for (let i=0; i < wordarr.length; i++){
        let w1 = wordarr[i];
        if (((curln + " " + w1).length) >= w){
            if (dopad) ret.push((" ".repeat(dopad))+curln);
            else ret.push(curln);
            curln = w1;
        }
        else {
            if (!curln) curln = w1;
            else curln += " " + w1;
        }
        if (i+1==wordarr.length) {
            if (dopad) ret.push((" ".repeat(dopad))+curln);
            else ret.push(curln);
        }
    }
    return ret;
}
//»
fmt(str, startx){//«
	const{w}=this;
	if (str === this.EOF) return [];
	let use_max_len = this.getMaxLen();
	if (str instanceof Blob) str = "[Blob " + str.type + " ("+str.size+")]"
	else if (str.length > use_max_len) str = str.slice(0, use_max_len)+"...";
	let ret = [];
	let iter =  0;
	let do_wide = null;
	let marr;
	if (str.match && str.match(/[\x80-\xFE]/)) {
		do_wide = true;
		let arr = str.split("");
		for (let i=0; i < arr.length; i++) {
			if (arr[i].match(/[\x80-\xFE]/)) {
				arr.splice(i+1, 0, "\x03");
				i++;
			}
		}
		str = arr.join("");
	}
	let doadd = 0;
	if (startx) doadd = startx;
	if (!str.split) str = str+"";
	let arr = str.split("\n");
	let ln;
	for (ln of arr) {
		while((ln.length+doadd) >= w) {
			iter++;
			let val = ln.slice(0,w-doadd);
			if (do_wide) val = val.replace(/\x03/g, "");
			ret.push(val);
			ln = ln.slice(w-doadd);
			str = ln;
			doadd = 0;
		}
	}
	if (do_wide) ret.push(ln.replace(/\x03/g, ""));
	else ret.push(ln);
	return ret;
}
//»
fmtLinesSync(arr, startx){//«
    let all = [];
	let usestart = startx;
    for (let i=0; i < arr.length; i++) {
		all = all.concat(this.fmt(arr[i],usestart));
		usestart = 0;
	}
    return all;
}
//»

responseComNames(arr) {//«
	let arr_pos = this.getComPos();
	let repeat_arr = this.getComArr();
	let name_lens = [];
	for (let nm of arr) name_lens.push(nm.length);
	let command_return = [];
	this.fmtLs(arr, name_lens, command_return);
	this.response(command_return.join("\n"), {didFmt: true});
	this.responseEnd();
	for (let i=0; i < repeat_arr.length; i++) this.handleLetterPress(repeat_arr[i]);
	let xoff = repeat_arr.length - arr_pos;
	for (let i=0; i < xoff; i++) this.handleArrow(LEFT_KEYCODE,"");
	this.render();
}
//»
responseEnd(opts={})  {//«
	if (!this.didInit) return;

//Why does (did) this line exist???
//	if (this.isPager) return;

	this.#doContinue = false;
	this.setPrompt();
	this.scrollIntoView();
	this.sleeping = null;
	this.bufPos = 0;
	this.curShell = null;
	this.render();

}
//»
response(out, opts={}){//«
	const{actor}=this;
	if (isEOF(out)) return;
	if (!isStr(out)) this.Win._fatal(new Error("Non-string given to term.response"));

	let {didFmt, colors, pretty, isErr, isSuc, isWrn, isInf, inBack} = opts;
if (inBack){
if (isErr){
cerr(out);
}
else if (isWrn){
cwarn(out);
}
else{
log(out);
}
return;
}
	if (out == "" && out.isNL){
		out=" \n ";
	}
	out = out.split("\n");
/*
	else if (!out) return;
	else if (!isArr(out)){
log("STDOUT");
log(out);
return;
	}
	else if (out instanceof Uint8Array) out = [`Uint8Array(${out.length})`];
*/
//WOPIUTHSDKL
	let use_color;
	if (isErr) use_color = "#f99";
	else if (isSuc) use_color = "#7f7";
	else if (isWrn) use_color = "#ff7";
	else if (isInf) use_color = "#aaf";

/*'actor' means there is a non-terminal screen.
This can happen, e.g. with errors with screen-based commands inside of pipelines,
since all "message" kinds of output *ALWAYS* go to the terminal (rather than 
propagating through the pipeline).
*/
/*
	if (actor){
		let s = out.join("\n");
		if (use_color) console.log("%c"+s, `color: ${use_color}`);
		else console.log(s);
		return;
	}
*/
	if (colors) {
		if (!didFmt){
			let e = new Error(`A colors array was provided, but the output lines have not been formatted!`);
			Win._fatal(e);
			throw e;
		}
		if (colors.length !== out.length){
log("response lines",out);
log("response colors",colors);
			let e = new Error(`The output array and colors array are not equal length!`);
			Win._fatal(e);
			throw e;
		}

	}
	else colors = [];

/*The response mechanism is *ONLY* meant for the terminal's REPL mode. If there is
an 'actor' in a pipeline, and a previous command in the pipeline has some non-output-stream
message, then it always gets sent here, so we need to make sure we are putting the message
into the appropriate lines (otherwise, the message gets primted onto the actor's screen.
*/
	let use_lines, use_line_colors;
	if (this.holdTerminalScreen){
		use_line_colors = this.holdTerminalScreen.lineColors;
		use_lines = this.holdTerminalScreen.lines;
	}
	else {
		use_lines = this.lines;
		use_line_colors = this.lineColors;
	}

	if (use_lines.length && !use_lines[use_lines.length-1].length) use_lines.pop();

	let len = out.length;
	for (let i=0, curnum = use_lines.length; i < len; i++){
		let ln = out[i];
		let col = colors[i];
		if (didFmt){
			use_lines[curnum] = ln.split("");
			use_line_colors[curnum] = col;
			curnum++;
			continue;
		}
		let arr;
		if (pretty) arr = fmt2(ln);
		else arr = this.fmt(ln);
//cwarn("ARR");
//log(arr);
		for (let l of arr){
			use_lines[curnum] = l.split("");
			if (use_color) use_line_colors[curnum] = {0: [l.length, use_color]};
			else use_line_colors[curnum] = col;
			curnum++;
		}
	}
}
//»
async respInit(addMessage){//«

	let init_prompt = `LOTW shell\x20(${this.winid.replace("_","#")})`
	if(dev_mode){
		init_prompt+=`\nReload terminal: ${!USE_ONDEVRELOAD}`;
	}
	if (admin_mode){
		init_prompt+=`\nAdmin mode: true`;
	}
	if (addMessage) init_prompt = `${addMessage}\n${init_prompt}`;
	let env_file_path = `${this.cur_dir}/.env`; 
	let env_lines = await env_file_path.toLines();
	if (env_lines) {
		let rv = ShellMod.util.addToEnv(env_lines, this.env, {if_export: true});
		if (rv.length){
			init_prompt+=`\n${env_file_path}:\n`+rv.join("\n");
		}
	}

{
	let rv = await ShellMod.util.doImports(ADD_COMS, cwarn);
if (rv) init_prompt += "\nImported libs: "+rv;
}
	this.response(init_prompt);

}//»
respHints(){//«
	if (!dev_mode) {
		this.response(`Hint: The LOTW shell is currently for non-algorithmic "one-liners" like:`, {isWrn: true});
		this.response(`  $ cat some files here || echo "That didn't quite work!"`, {isWrn: true});
	}
}//»

//»

//Keys/Handlers«

doCtrlD(){//«
this.numCtrlD++;
this.doOverlay(`Ctrl+d: ${this.numCtrlD}`);
//cwarn("Calling do_ctrl_D!!! (nothing doing)");
};//»
doCtrlC(){//«
	if (this.curShell) {
		this.env['?'] = 0;
		if (this.curShell.stdin) {
			this.curShell.stdin(null, true);
			delete this.curShell.stdin;
		}
	}
	else {
		this.handlePriv(null,"^".charCodeAt(), null, true);
		this.handlePriv(null,"C".charCodeAt(), null, true);
		this.rootState = null;
		this.bufPos = 0;
		this.commandHold = null;
		this.env['?'] = 0;
		this.responseEnd();
	}
}
//»

handleInsert(val){//«
	let arr = val.split("");
	let gotspace = false;
	for (let ch of arr) {
		let code = ch.charCodeAt();
		if (!(code >= 32 && code <= 126)) {
			if (code==10) continue;
			code = 32;
		}
		if (code==32) {
			if (gotspace) continue;
			gotspace = true;
		}
		else gotspace = false;
		this.handlePriv(null,code, null, true);
	}
}
//»
handleLineStr(str, from_scroll, uselen, if_no_render){//«
	let did_fail = false;
	const copy_lines=(arr, howmany)=>{//«
		let newarr = [];
		for (let i=0; i <= howmany; i++) {
			let ln = arr[i];
			if (!ln) {
				did_fail = true;
				ln = [" "];
			}
			newarr.push(ln);
		}
		return newarr;
	}//»
	if (str=="") {}
	else if (!str) return;
	let curnum = this.curPromptLine;
	let curx;
	if (typeof uselen=="number") curx=uselen;
	else curx = this.promptLen;
	this.linesHold2 = this.lines;
	if (!this.comScrollMode) {
		this.lines = copy_lines(this.lines, this.curPromptLine)
		if (did_fail) {
			this.clear();
			return 
		}
	}
	this.lines[this.lines.length-1] = this.lines[this.lines.length-1].slice(0, this.promptLen);
	let curpos = this.promptLen;
	this.curScrollCommand = str;
	let arr = str.split("\n");
	let addlines = 0;
	for (let lnstr of arr) {
		let i;
		if (!lnstr) lnstr = "";
		for (i=curnum;lnstr.length>0;i++) {
			let curln = this.lines[i];
			if (!curln) curln = [];
			let strbeg = lnstr.slice(0,this.w-curpos);
			curx = curpos + strbeg.length;
			curln.push(...strbeg);
			this.lines[i] = curln;
			lnstr = lnstr.slice(this.w-curpos);
			if (lnstr.length > 0) {
				curnum++;
				curx = 0;
			}
			curpos = 0;
			addlines++;
		}
		curnum++;
	}
	this.scrollIntoView();
	this.y = this.lines.length-1-this.scrollNum;
	this.x = curx;
	if (this.x==this.w) {
		this.y++;
		if (!this.lines[this.y+this.scrollNum]) {
			this.lines.push([]);
		}
		this.x=0;
		this.scrollIntoView();
	}
	if (!if_no_render) this.render();
}
//»
handleTab(){//«
	if (this.curScrollCommand) this.insertCurScroll();
	if (this.curShell) return;
	this.doCompletion();
}
//»
handleArrow(code, mod, sym){//«
	if (this.curShell) return;
	if (mod == "") {//«
		if (code == KC['UP']) this.historyUp();
		else if (code == KC['DOWN']) this.historyDown();
		else if (code == LEFT_KEYCODE) this.charLeft();
		else if (code == KC["RIGHT"]) this.charRight();
	}//»
	else if (mod=="C") {//«
		if (kc(code,"UP")) this.historyUpMatching();
		else if (kc(code,"DOWN")) this.historyDownMatching();
		else if (kc(code,"LEFT")) this.wordLeft();
		else if (kc(code,"RIGHT")) this.wordRight();
	}//»
}
//»
handlePage(sym){//«
	if (sym=="HOME_") {//«
		if (this.curShell) return;
		if (this.bufPos < this.history.length) {
			if (this.commandHold == null && this.bufPos == 0) {
				this.commandHold = this.getComArr().join("");
				this.commandPosHold = this.getComPos() + this.promptLen;
			}
			this.bufPos = this.history.length;
			let str = this.history[0];
			if (str) {
				this.trimLines();
				this.handleLineStr(str.trim(), true);
			}
		}
	}//»
	else if (sym=="END_") {//«
		if (this.curShell) return;
		if (this.bufPos > 0) {
			this.bufPos = 0;
			if (this.commandHold!=null) {
				this.trimLines();
				this.handleLineStr(this.commandHold.trim(), true);
				this.commandHold = null;
			}
		}
	}//»
}
//»
handleBackspace(){//«
	let prevch = this.lines[this.cy()][this.x-1];
	if (((this.y+this.scrollNum) ==  this.curPromptLine) && (this.x == this.promptLen)) return;
	else {
		let do_check = true;
		let is_zero = null;
		if (this.x==0 && this.y==0) return;
		if (this.x==0 && (this.cy()-1) < this.curPromptLine) return;
		if (this.curScrollCommand) this.insertCurScroll();
		if (this.x==0 && this.cy() > 0) {//«
//JEPOIKLMJYH
			if (this.lines[this.cy()].length < this.w) {//«
				let char_arg = this.lines[this.cy()][0];
				if (char_arg) {
					check_line_len(-1);
					is_zero = true;
					this.lines[this.cy()].splice(this.x, 1);
					this.lines[this.cy()-1].pop();
					this.lines[this.cy()-1].push(char_arg);
					this.y--;
					this.x = this.lines[this.cy()].length - 1;
					this.render();
				}
				else {
					this.lines[this.cy()-1].pop();
					this.lines.splice(this.cy(), 1);
					this.y--;
					this.x=this.lines[this.cy()].length;
					check_line_len();
					this.render();
					return;
				}
			}//»
			else {//«
				this.y--;
				do_check = true;
				this.lines[this.cy()].pop();
				this.x = this.lines[this.cy()].length;
				this.render();
			}//»
		}//»
		else {//«
			this.x--;
			this.lines[this.cy()].splice(this.x, 1);
		}//»
		let usey=2;
		if (!is_zero) {
			usey = 1;
			do_check = true;
		}
		if (do_check && this.lines[this.cy()+usey] && this.lines[this.cy()].length == this.w-1) {//«
			let char_arg = this.lines[this.cy()+usey][0];
			if (char_arg) this.lines[this.cy()].push(char_arg);
			else this.lines.splice(this.cy()+usey, 1);
			if(this.lines[this.cy()+usey]) {//«
				this.lines[this.cy()+usey].splice(0, 1);
				let line;
				for (let i=usey+1; line = this.lines[this.cy()+i]; i++) {
					let char_arg = line[0];
					if (char_arg) {
						line.splice(0,1);
						this.lines[this.cy()+i-1].push(char_arg);
						if (!line.length) this.lines.splice(i+1, 1);
					}
				}
			}//»
		}//»
	}
	this.render();
}
//»
handleDelete(mod){//«
	if (mod == "") {
		if (this.lines[this.cy()+1]) {
			this.handleArrow(KC.RIGHT, "");
			this.handleBackspace();
		}
		else {
			this.lines[this.cy()].splice(this.x, 1);
			this.render();
		}
	}
}
//»
async handleEnter(opts={}){//«
	if (!this.sleeping){
		this.bufPos = 0;
		this.commandHold = null;
		let str;
		if (this.curShell) return;
		else {//«
			if (this.curScrollCommand) str = this.insertCurScroll();
			else str = this.getComArr().join("");
			if (!this.#doContinue && !str) {
				this.env['?']="0";
				this.responseEnd();
				return;
			}
		}//»
		this.x=0;
		this.y++;
		this.lines.push([]);
		if (!this.#doContinue && (!str || str.match(/^ +$/))) {
			return this.responseEnd();
		}
		if (str) {
			this.lastComStr = str;
		}
		this.scrollIntoView();
		this.render();
		await this.execute(str, opts);
		this.sleeping = null;
	}
}
//»
handleLetterPress(char_arg, if_no_render){//«
	const dounshift=(uselines)=>{//«
		if ((uselines[this.cy()].length) > this.w) {
			let use_char = uselines[this.cy()].pop()
			if (!uselines[this.cy()+1]) uselines[this.cy()+1] = [use_char];
			else uselines[this.cy()+1].unshift(use_char);
			if (this.x==this.w) {
				this.x=0;
				this.y++;
			}
			for (let i=1; line = uselines[this.cy()+i]; i++) {
				if (line.length > this.w) {
					if (uselines[this.cy()+i+1]) uselines[this.cy()+i+1].unshift(line.pop());
					else uselines[this.cy()+i+1] = [line.pop()];
				}
				else {
					if (uselines[this.cy()+i-1].length > this.w) {
						line.unshift(uselines[this.cy()+i-1].pop());
					}
				}
			}
		}
	};//»
	const{lines}=this;
	let cy;
	let line;
	if (lines && lines[this.scrollNum + this.y]) {
		if ((this.x) < lines[this.scrollNum + this.y].length && lines[this.scrollNum + this.y][0]) {
			lines[this.scrollNum + this.y].splice(this.x, 0, char_arg);
			this.shiftLine(this.x-1, this.y, this.x, this.y);
		}
	}

	let usex = this.x+1;
	let usey = this.y;
	this.y = usey;

	let endch = null;
	let didinc = false;
	cy = this.y+this.scrollNum;
	if (usex == this.w) {
		if (lines[cy][this.x+1]) endch = lines[cy].pop();
		didinc = true;
		usey++;
		usex=0;
	}
	if (!lines[cy]) {//«
		lines[cy] = [];
		lines[cy][0] = char_arg;
	}//»
	else if (lines[cy] && char_arg) {//«
		let do_line = null;
		if (lines[cy][this.x]) do_line = true;
		lines[cy][this.x] = char_arg;
	}//»
	let ln = lines[this.scrollNum+usey];
	if (ln && ln[usex]) {//«
		if (this.x+1==this.w) {
			if (!didinc) {
				usey++;
				usex=0;
			}
			if (endch) {
				if (!ln||!ln.length||ln[0]===null) lines[this.scrollNum+usey] = [endch];
				else ln.unshift(endch);	
			}
		}
		else usex = this.x+1;
	}//»
	else {//«
		if (!ln||!ln.length||ln[0]===null) {
			lines[this.scrollNum+usey] = [endch];
		}
	}//»
	this.x = usex;
	this.y = usey;
	dounshift(lines);
	if (!if_no_render) this.render();
	this.textarea.value = "";
}
//»
handlePriv(sym, code, mod, ispress, e){//«
	const{lines}=this;
	if (this.sleeping) {
		if (ispress || sym=="BACK_") return;
	}
	if (this.curShell){//«
		if (sym==="c_C") {
//			this.curShell.cancelled_time = (new Date).getTime();
			this.curShell.cancel();
			this.curShell = null;
			this.sleeping = false;
			this.response("^C");
			this.responseEnd();
			return;
		}
		else if (this.#getChCb){
			if (ispress) {
				this.sleeping = true;
				this.#getChCb(e.key);
				this.#getChCb = null;
			}
			else {
				if (sym=="ENTER_"){
					this.sleeping = true;
					this.#getChCb(this.#getChDefCh);
					this.#getChDefCh = undefined;
				}
				return;
			}
		}
		else if (this.#readLineCb){
			if (ispress || this.okReadlineSyms.includes(sym)){
				if ((sym==="LEFT_" || sym=="BACK_") && this.x==this.#readLinePromptLen && this.y+this.scrollNum == this.curPromptLine+1) return;
			}
			else if (sym==="ENTER_"){
				let s='';
				let from = this.curPromptLine+1;
				for (let i=from; i < lines.length; i++) {
					if (i==from) {
						s+=lines[i].slice(this.#readLinePromptLen).join("");
					}
					else {
						s+=lines[i].join("");
					}
				}
if (!s){
s = new String("");
s.isNL = true;
}
				this.#readLineCb(s);
				this.#readLineCb = null;
				this.sleeping = true;
				return;
			}
			else{
				return;
			}
		}
		else return;
	}//»
	if (!this.lines[this.cy()]) {//«
		if (code == 75 && alt) return;
		else {
			if (this.cy() > 1 && !this.lines[this.cy()-1]) this.setPrompt();
			else {
				this.lines[this.cy()] = [null];
			}
		}
	}//»
	let ret = null;
	if (ispress) {//«
		this.numCtrlD = 0;
		if (this.curScrollCommand) this.insertCurScroll();
		if (code == 0) return;
		else if (code == 1 || code == 2) code = 32;
		else if (code == 8226 || code == 9633) code = "+".charCodeAt();
		else if (code == 8211) code = "-".charCodeAt();
		else if (code == 3) {}
		else if (code < 32) code = 127;
		this.handleLetterPress(String.fromCharCode(code)); 
		return;
	}//»
	if (sym == "d_C") return this.doCtrlD();
	this.numCtrlD = 0;
	if (code >= 37 && code <= 40) this.handleArrow(code, mod, sym);
	else if (sym == "HOME_"|| sym == "END_") this.handlePage(sym);
	else if (code == KC['DEL']) this.handleDelete(mod);
	else if (sym == "p_CAS") this.togglePaste();
	else if (sym == "TAB_") this.handleTab();
	else if (sym == "BACK_")  this.handleBackspace();
	else if (sym == "ENTER_") this.handleEnter();
	else if (sym == "c_C") this.doCtrlC();
	else if (sym == "k_C") this.doClearLine();
	else if (sym == "y_C") this.insertCutStr();
	
	else if (sym == "c_CAS") {
		this.clear();
		this.responseEnd();
	}
	else if (sym=="a_C") {//«
		e.preventDefault();
		this.seekLineStart();
	}//»
	else if (sym=="e_C") this.seekLineEnd();
	else if (sym == "g_CAS") this.saveSpecialCommand();
	else if (sym=="h_CAS") this.selectFromHistory(HISTORY_PATH);
	
	else if (sym=="s_CAS"){
		this.selectFromHistory(HISTORY_PATH_SPECIAL);
	}
	else if (sym=="r_CAS"){//«
if (!dev_mode){
cwarn("Not dev_mode");
return;
}
//VMUIRPOIUYT
if (this.ondevreload) delete this.ondevreload;
else this.ondevreload = ondevreload;
this.doOverlay(`Reload terminal: ${!this.ondevreload}`);
	}//»
else if (sym=="d_CAS"){
}
}
//»
handle(sym, e, ispress, code, mod){//«
	const{actor}=this;
	let marr;
	if (this.locked) {
		return;
	}
	if (this.isScrolling){//«
		if (!ispress) {
			if (sym.match(/^[A-Z]+_$/)){
				if (sym==="SPACE_") return;
			}
			else return;
		}
		this.scrollNum = this.scrollNumHold;
		this.isScrolling = false;
		this.render();
		return;
	}//»
	if (e && sym=="d_C") e.preventDefault();
	if (!ispress) {//«
		if (sym == "=_C") {
			e.preventDefault();
			set_new_fs(this.grFs+1);
			return;
		}
		else if (sym == "-_C") {
			e.preventDefault();
			if (this.grFs-1 <= min_fs) return;
			set_new_fs(this.grFs-1);
			return;
		}
		else if (sym=="0_C") {
			this.grFs = this.defFs;
			set_new_fs(this.grFs);
			return;
		}
		else if (sym=="c_CS") return this.doClipboardCopy();
		else if (sym=="v_CS") return this.doClipboardPaste();
		else if (sym=="a_CA") return this.doCopyBuffer();
		else if (sym=="p_CA"){
			this.paragraphSelectMode = !this.paragraphSelectMode;
			this.doOverlay(`Paragraph select: ${this.paragraphSelectMode}`);
			return;
		}
	}//»
	if (code == KC['TAB'] && e) e.preventDefault();
	else this.awaitNextTab = null;
	if (e&&sym=="o_C") e.preventDefault();

	if (actor){
		if (ispress){
			if (actor.onkeypress) actor.onkeypress(e, sym, code);
		}
		else{
			if (actor.onkeydown) actor.onkeydown(e ,sym, code);
		}
		return;
	}

	if (ispress){}
	else if (!sym) return;

	this.handlePriv(sym, code, mod, ispress, e);
}
//»

//»

//Alt screen apps (vim, less, etc.)«

resetXScroll(){tabdiv._x=0;}
xScrollTerminal(opts={}){//«

	let {amt, toRightEdge, toLeftEdge} = opts;
	let _x = tabdiv._x;
	let cw = tabdiv.clientWidth;
	let sw = tabdiv.scrollWidth;
	let xdiff;
	let usex = null;
	if (amt) xdiff = amt;
	else {
		if (toRightEdge){
			usex = cw - sw;
		}
		else if (toLeftEdge){
			usex = 0;
		}
		else {
			xdiff = cw/2;
			if (opts.right){
				xdiff = -xdiff;
			}
			else if (opts.left){
			}
		}
	}
	if (xdiff){
		_x+=xdiff;
		if (_x > 0) _x = 0;
		tabdiv._x = _x;
	}
	else if (usex !== null) tabdiv._x = usex;
	else {
	return cwarn("x_scroll_terminal: nothing to do!!!");
	}
this.render();
}
//»
clipboardCopy(s){this.doClipboardCopy(null,s);}
setLines(linesarg, colorsarg){//«
	this.lines = linesarg;
	this.lineColors = colorsarg;
}//»
initNewScreen(actor_arg, classarg, new_lines, new_colors, n_stat_lines, funcs={}){//«
	const{actor}=this;
	let escape_fn = funcs.onescape;
	let dev_reload_fn = funcs.ondevreload;
//	let screen = {actor, appclass, this.lines, this.lineColors, x, y, this.scrollNum, this.numStatLines, onescape: termobj.onescape};
	let screen = {
		actor: this.actor,
		appcClass: this.appClass,
		lines: this.lines,
		lineColors: this.lineColors,
		x: this.x,
		y: this.y,
		scrollNum: this.scrollNum,
		numStatLines: this.numStatLines,
		funcs: {
			onescape: this.onescape,
			ondevreload: this.ondevreload
		}
	};
	if (!this.actor) this.holdTerminalScreen = screen;
	this.onescape = escape_fn;
	this.ondevreload = dev_reload_fn;
	this.actor = actor_arg;

	this.appClass = classarg;
	this.isEditor = classarg == "editor";
	this.isPager = classarg == "pager";

	this.lines = new_lines;
	this.lineColors = new_colors;
	this.scrollNum=this.x=this.y=0;
	this.numStatLines=n_stat_lines;
	if (this.numStatLines) {
		this.wrapdiv.appendChild(this.statdiv);
		this.generateStatHtml();
	}
	return screen;
}//»
quitNewScreen(screen){//«
//	const{actor}=this;
	let actor;
	if (screen === this.holdTerminalScreen) this.holdTerminalScreen = null;
	let old_actor = this.actor;
/*«
	({
		actor,
		appclass: this.appClass,
		lines: this.lines,
		line_colors: this.lineColors,
		x: this.x,
		y: this.y,
		scroll_num: this.scrollNum,
		num_stat_lines: this.numStatLines
	} = screen);
»*/
	this.actor = screen.actor;
	this.appClass = screen.appClass;
	this.lines=screen.lines;
	this.lineColors = screen.lineColors;
	this.x=screen.x;
	this.y=screen.y;
	this.scrollNum = screen.scrollNum;
	this.numStatLines = screen.numStatLines;

	this.isEditor = this.appClass == "editor";
	this.isPager = this.appClass == "pager";
	if (!screen.funcs) screen.funcs = {};
	this.onescape = screen.funcs.onescape;
	this.ondevreload = screen.funcs.ondevreload;
	
	if (!this.numStatLines){
		this.statdiv._del();
	}
	this.tabdiv._x = 0;
	if (old_actor&&old_actor.cb) {
		old_actor.cb(screen);
	}
}//»

//»

//System callbacks«

async _ondevreload(){//«

	this.doOverlay("ondevreload: start");

//EIOFJKL
	let use_str;
	if (this.curShell){
		use_str = this.curShell.commandStr;
		this.curShell.cancel();
		this.responseEnd();
	}
//	await load_new_shell();
	ShellMod.util.deleteMods(DEL_MODS);
	if (use_str){
		this.handleLineStr(use_str);
		this.handleEnter();
	}
//	ShellMod.util.deleteComs(DEL_COMS);
//	await ShellMod.util.doImports(ADD_COMS, cerr);
	this.doOverlay("ondevreload: done");

}
//»
onkill(if_dev_reload){//«
	if (this.curEditNode) this.curEditNode.unlockFile();
	if (!if_dev_reload) {
		return;
	}

	this.reInit={
		termBuffer: this.history,
		useOnDevReload: !!this.ondevreload
	};

	if (this.actor) {
		this.reInit.commandStr = this.actor.command_str;
	}

	ShellMod.util.deleteMods(DEL_MODS);
	ShellMod.util.deleteComs(DEL_COMS);

	delete globals.shell_commands;
	delete globals.shell_command_options;
}
//»

async onappinit(appargs={}){//«
	let {reInit} = appargs;
	if (!reInit) reInit = {};
	let {termBuffer, addMessage, commandStr, histories, useOnDevReload} = reInit;
	if (isBool(useOnDevReload)) USE_ONDEVRELOAD = useOnDevReload;
	await this.initHistory(termBuffer);
	await this.respInit(addMessage);
	this.respHints();
	this.didInit = true;
	this.sleeping = false;
	this.isFocused = true;
	this.setPrompt();
	this.render();
	if (commandStr) {
		for (let c of commandStr) this.handleLetterPress(c); 
		this.handleEnter({noSave: true});
	};
	if (USE_ONDEVRELOAD) this.ondevreload = this._ondevreload;
}//»

onescape(){//«
	this.textarea.focus();
	if (this.checkScrolling()) return true;
	if (this.statusBar.innerText){
		this.statusBar.innerText = "";
		return true;
	}
	return false;
}//»
onsave(){//«
	const{actor}=this;
//	if (editor) editor.save();
	if (actor && actor.save) actor.save();
}
//»

onfocus(){//«
	this.isFocused=true;
	if (this.curScrollCommand) this.insertCurScroll();
	this.textarea.focus();
	this.render();
}
//»
onblur(){//«
	this.isFocused=false;
	if (this.curScrollCommand) this.insertCurScroll();
	this.textarea.blur();
	this.render();
}
//»

onresize(){this.resize();}
onkeydown(e, sym, mod) {
	this.handle(sym, e, false, e.keyCode, mod);
}
onkeypress(e) {
	this.handle(e.key, e, true, e.charCode, "");
}
onkeyup(e,sym){//«
	if (this.actor&&this.actor.onkeyup) this.actor.onkeyup(e, sym);
}//»

//»

}; 

//»

/*
parameterExpansion(env, script_name="sh", script_args=[]){//«
//PMJDHSWL
//const parameter_expansion = (tok, env, script_name="sh", script_args=[]) => {
//We will also need env, script_name, and script_args passed in here
//«

//A "parameter" is a NAME or a SYMBOL, as described below.
//
//We are looking for one of:
//
//$LONGESTNAME, $ONEDIGIT, ${NAME}, ${ONEORMOREDIGITS}, $[@*#?-$!0] or ${[@*#?-$!0]}:
//@: positional parameters starting from 1, and something about field splitting
//*: Same as above, with something else about field splitting
//#: Number of positional parameters (minus the 0th)
//?: Most recent exit code
//-: Current options flag
//$: pid of the shell
//!: pid of most recent '&' statement
//0: name of shell or shell script
//
//All DIGIT's (other than 0) are the current (1-based) positional parameters
//
//These expands in anything other than single quotes
//
//We can also easily support '${#NAME}', since this just gives the length of the
//string of the variable, NAME.
//
//I'm not sure how to handle:
//$ DQUOTE='"'
//$ echo "$DQUOTE"
//
//Maybe escape all quote substitutions (in double quotes or out), and all redir chars?

//»
//«

//Should we not put everything inside $'...', and then escape ALL
//single quotes that are in the replacement value??? Otherwise, there can't be
//escaped single quotes inside of pure single quotes: '\'' (doesn't work!)
//
//So, if we do:
//PARAM_WITH_SINGLE_QUOTES="...'//..."
//
//echo BLAH${PARAM_WITH_SINGLE_QUOTES}BLAH
//=> BLAH$'...\'//...'BLAH

//»
const tok = this;
const word = tok.val;
//cwarn("HI", this);
let qtyp;
OUTER_LOOP: for (let i=0; i < word.length; i++){

let ch = word[i];
if (!qtyp){
	if (["'",'"','`'].includes(ch)) {
		qtyp = ch;
		continue;
	}
	else{
//Unquoted stuff
	}
}
else if (qtyp===ch) {
	qtyp=null;
	continue;
}
else if (qtyp!=='"') continue;

//We are unquoted or in double quotes

if (ch==="$"){//«

//LSJFANSF
const do_name_sub=(name)=>{//«
let diff = end_i - start_i;
let val = env[name]||"";
cwarn(name);
log(val);
let arr=[];
for (let ch of val){
	let s = new String(ch);
	s.wasExpanded = true;
	arr.push(s);
}
word.splice(start_i, end_i-start_i+1, ...arr);
//log(word);
i = end_i - diff;

};//»
const do_arg_sub=(num)=>{//«
let diff = end_i - start_i;
let val = script_args[num]||"";
word.splice(start_i, end_i-start_i+1, ...val);
i = end_i - diff;
};//»
const do_sym_sub=(sym)=>{//«
let diff = end_i - start_i;
let val;
//const SPECIAL_SYMBOLS=[ "@","*","#","?","-","$","!","0" ];
switch(sym){
	case "0": val = script_name; break;
	case "#": val = script_args.length+""; break;
	case "*":
	case "@":
		val = script_args.join(" ");
		break;
	case "?": val = ShellMod.var.lastExitCode+""; break;
	default: val = "$"+sym;
}
word.splice(start_i, end_i-start_i+1, ...val);
i = end_i - diff;

};//»
const BADSUB=(arg, next)=>{return `bad/unsupported substitution: stopped at '\${${arg}${next?next:"<END>"}'`;}

	let next = word[i+1];
	if (!next) continue;
	let start_i = i;
	let end_i;
	if (next==="{") {//«
		i++;
//If no next one or the next one is a "}", barf INVSUB
//If the next one is a special symbol, there must be a "}" immediately following it
//If the next one is a digit, there must be 0 or more digits (maybe "0") followed by the "}"
//Otherwise, the next one must be a START_NAME_CHARS, followed by 0 or more 
//    ANY_NAME_CHARS, with a terminating "}".
		next = word[i+1];
		if (!next) return "bad substitution: '${<END>'";
		else if (next==="}") return "bad substitution: '${}'";

		if (SPECIAL_SYMBOLS.includes(next)){//«
			let sym = next;
			i++;
			next = word[i+1];
			if (next !== "}") return BADSUB(sym, next);
			end_i = i+1;
			do_sym_sub(sym);
		}//»
		else if (DIGIT_CHARS_1_to_9.includes(next)){//«
			let numstr=next;
			i++;
			next = word[i+1];
			while(true){
				if (next==="}"){
				//Do a parseInt on numstr, and if in a script, replace with: script_arg[num-1]
		//cwarn("Substitute script_arg #", argnum);
		//			end_i = i;
					end_i = i+1;
					do_arg_sub(parseInt(numstr)-1);
					break;
				}
				if (!ANY_DIGIT_CHARS.includes(next)){
		//			return `bad substitution: have '\${${numstr}${next?next:"<END>"}'`;
					return BADSUB(numstr, next);
				}
				numstr+=next;
				i++;
				next = word[i+1];
			}
		}//»
		else if (START_NAME_CHARS.includes(next)){//«

		let namestr=next;
		i++;
		next = word[i+1];
		while(true){
			if (next==="}"){
				end_i = i+1;
				do_name_sub(namestr);
				continue OUTER_LOOP;
			}
			if (!ANY_NAME_CHARS.includes(next)){
				return BADSUB(namestr, next);
			}
			namestr+=next;
			i++;
			next = word[i+1];
		}

		}//»
		else return INVSUB;

	}//»
	else{//«
//If the next one is a special symbol (including "0"), we can do the substitution now«
//Else if the next is one of DIGIT_CHARS "1"->"9", we can do the substitution noe
//Else if the next isn't a START_NAME_CHARS, we continue and keep this a 
//  literal '$'
//Else we look at every succeeding char, and do the sub on the first non-ANY_NAME_CHARS.

//		i++;
//		next = word[i+1];»

if (SPECIAL_SYMBOLS.includes(next)){
	end_i = i+1;
	do_sym_sub(next);
}
else if (DIGIT_CHARS_1_to_9.includes(next)){
	end_i = i+1;
	do_arg_sub(parseInt(next)-1);
}
else if (!START_NAME_CHARS.includes(next)){
	continue;
}
else{//«

let namestr=next;
i++;
next = word[i+1];
while(true){
	if (!ANY_NAME_CHARS.includes(next)){
		end_i=i;
		do_name_sub(namestr);
		continue OUTER_LOOP;
	}
	namestr+=next;
	i++;
	next = word[i+1];
}

}//»

	}//»

}//»

}

return tok;
}//»
*/

