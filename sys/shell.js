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
//Imports«

const NS = LOTW;
const {globals, Desk} = LOTW;
const {
    TEXT_EDITOR_APP,
    LINK_APP,
    FOLDER_APP,
    FS_TYPE,
    MOUNT_TYPE,
    SHM_TYPE,
    SHELL_ERROR_CODES,
//  dev_mode,
    EOF,
	fs
} = globals;
const util = LOTW.api.util;
const {
	log,
	jlog,
	cwarn,
	cerr,
	isNum,
	isArr,
	isStr,
	isObj,
	isNode,
	isFile,
	isDir,
	isErr,
	isEOF,
	sleep,
	normPath,
} = util;
const{E_SUC, E_ERR} = SHELL_ERROR_CODES;
const fsapi = globals.api.fs;
const{pathToNode}=fsapi;

//»

//«Shell

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

const expand_comsub=async(tok, shell, term)=>{//«
	const err = term.resperr;
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
				s+='"'+(await ent.expand(shell, term))+'"';
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
				else s+=(await ent.expand(shell, term)).split("\n").join(" ");
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
//cwarn(`COMSUB <${s}>`);
		await shell.execute(s, {subLines: sub_lines, env: tok.env});
		return sub_lines.join("\n");
	}
	catch(e){
cerr(e);
		err(e.message);
		return "";
	}
};//»
const curly_expansion = (tok, from_pos) => {//«

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
const parameter_expansion = (tok, env, script_name="sh", script_args=[]) => {//«
//We will also need env, script_name, and script_args passed in here
/*«

A "parameter" is a NAME or a SYMBOL, as described below.

We are looking for one of:

$LONGESTNAME, $ONEDIGIT, ${NAME}, ${ONEORMOREDIGITS}, $[@*#?-$!0] or ${[@*#?-$!0]}:
@: positional parameters starting from 1, and something about field splitting
*: Same as above, with something else about field splitting
#: Number of positional parameters (minus the 0th)
?: Most recent exit code
-: Current options flag
$: pid of the shell
!: pid of most recent '&' statement
0: name of shell or shell script

All DIGIT's (other than 0) are the current (1-based) positional parameters

These expands in anything other than single quotes

We can also easily support '${#NAME}', since this just gives the length of the
string of the variable, NAME.

I'm not sure how to handle:
$ DQUOTE='"'
$ echo "$DQUOTE"

Maybe escape all quote substitutions (in double quotes or out), and all redir chars?

»*/
/*«

Should we not put everything inside $'...', and then escape ALL
single quotes that are in the replacement value??? Otherwise, there can't be
escaped single quotes inside of pure single quotes: '\'' (doesn't work!)

So, if we do:
PARAM_WITH_SINGLE_QUOTES="...'//..."

echo BLAH${PARAM_WITH_SINGLE_QUOTES}BLAH
=> BLAH$'...\'//...'BLAH

»*/
let word = tok.val;
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

if (ch==="$"){/*«*/

const do_name_sub=(name)=>{//«

let diff = end_i - start_i;
let val = env[name]||"";
word.splice(start_i, end_i-start_i+1, ...val);
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

};/*»*/
const BADSUB=(arg, next)=>{return `bad/unsupported substitution: stopped at '\${${arg}${next?next:"<END>"}'`;}

	let next = word[i+1];
	if (!next) continue;
	let start_i = i;
	let end_i;
	if (next==="{") {/*«*/
		i++;
//If no next one or the next one is a "}", barf INVSUB
//If the next one is a special symbol, there must be a "}" immediately following it
//If the next one is a digit, there must be 0 or more digits (maybe "0") followed by the "}"
//Otherwise, the next one must be a START_NAME_CHARS, followed by 0 or more 
//    ANY_NAME_CHARS, with a terminating "}".
		next = word[i+1];
		if (!next) return "bad substitution: '${<END>'";
		else if (next==="}") return "bad substitution: '${}'";

		if (SPECIAL_SYMBOLS.includes(next)){/*«*/
			let sym = next;
			i++;
			next = word[i+1];
			if (next !== "}") return BADSUB(sym, next);
			end_i = i+1;
			do_sym_sub(sym);
		}/*»*/
		else if (DIGIT_CHARS_1_to_9.includes(next)){/*«*/
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
		}/*»*/
		else if (START_NAME_CHARS.includes(next)){/*«*/

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

		}/*»*/
		else return INVSUB;

	}/*»*/
	else{/*«*/
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
else{/*«*/

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

}/*»*/

	}/*»*/

}/*»*/

}

return tok;
};/*»*/
const quote_removal=(tok)=>{//«
	let s='';
	let qtyp;
	let arr = tok.val;
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
	tok.val = [...s];
//	return s;
};/*»*/
const filepath_expansion=async(tok, cur_dir)=>{//«
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
	let dir = await pathToNode(dir_str);
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
let rv = await do_dirs(dirs, path_arr, true);
if (rv.length) {
let words = [];
let {start, par, env}=tok;
for (let val of rv){
let word = new Word(start, par, env);
word.val=[...val];
words.push(word);
}
//log(words);
return words;
}
return tok;
};/*»*/
const get_stdin_lines = async(in_redir, term, haveSubLines) => {//«
//const get_stdin_lines = async(in_redir, term, heredocScanner, haveSubLines) => {
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
}/*»*/

//»
//Helpers (this.util)«
{

const make_sh_error_com = (name, mess, com_env)=>{//«

//	let com = new ErrCom(name, null,null,com_env);
	let com = new this.comClasses.ErrCom(name, null,null,com_env);
//SPOIRUTM
	com.errorMessage = `sh: ${name}: ${mess}`;
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
			err.push(`${com}: invalid option: '${opt}'`);
			return null;
		} else if (numhits == 1) return okkey;
		else {
			err.push(`${com}: option: '${opt}' has multiple hits`);
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
					else err.push(`${com}: option: '${ch}' requires args`);
				}
				else if (getall || sopts[ch] === 1) obj[ch] = true;
				else if (!sopts[ch]) err.push(`${com}: invalid option: '${ch}'`);
				else err.push(`${com}: option: '${ch}' has an invalid option definition: ${sopts[ch]}`);
			}
			args.splice(i, 1);
		}
		else if (marr = args[i].match(/^-([a-zA-Z0-9])$/)) {
			ch = marr[1];
			if (getall){
				if (!args[i + 1]) err.push(`${com}: option: '${ch}' requires an arg`);
				obj[ch] = args[i + 1];
				args.splice(i, 2);
			}
			else if (!sopts[ch]) {
				err.push(`${com}: invalid option: '${ch}'`);
				args.splice(i, 1);
			} else if (sopts[ch] === 1) {
				obj[ch] = true;
				args.splice(i, 1);
			} else if (sopts[ch] === 2) {
				err.push(`${com}: option: '${ch}' is an optional arg`);
				args.splice(i, 1);
			} else if (sopts[ch] === 3) {
				if (!args[i + 1]) err.push(`${com}: option: '${ch}' requires an arg`);
				obj[ch] = args[i + 1];
				args.splice(i, 2);
			} else {
				err.push(`${com}: option: '${ch}' has an invalid option definition: ${sopts[ch]}`);
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
				else if (lopts[marr[1]] === 3) err.push(`${com}: long option: '${marr[1]}' requires an arg"`);
				else if (lopts[marr[1]]) err.push(`${com}: long option: '${marr[1]}' has an invalid option definition: ${lopts[marr[1]]}`);
				else if (!lopts[marr[1]]) err.push(`${com}: invalid long option: '${marr[1]}`);
				args.splice(i, 1);
			} else args.splice(i, 1);
		} 
		else if (marr = args[i].match(/^(---+[a-zA-Z0-9][-a-zA-Z0-9]+)$/)) {
			err.push(`${com}: invalid option: '${marr[1]}'`);
			args.splice(i, 1);
		}
		else i++;
	}
	return [obj, err];
}//»
const add_to_env = (arr, env, opts)=>{//«
	let {term, if_export} = opts;
	let marr;
	let use;
	let err = [];
	use = arr[0];
	let assigns = {};
	while (use) {
		let which;
		const next=()=>{
			arr.shift();
			if (arr[0]===" ") arr.shift();
			use = arr[0];
		};
		marr = this.var.assignRE.exec(use);
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
	if (!arr.length && !if_export){
		env = term.ENV;
	}
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
cwarn(`Added: ${ok_coms.length} commands from '${libname}'`);
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

//	NS.libs[libname] = {coms, opts};

}//»
const do_imports = async(arr, err_cb) => {//«
	if (!err_cb) err_cb = ()=>{};
	for (let arg of arr){
		if (this.var.allLibs[arg]) {
			err_cb(`${arg}: already loaded`);
			continue;
		}   
		try{
			await this.util.importComs(arg);
		}catch(e){
			err_cb(`${arg}: error importing the module`);
cerr(e);
		}
	}
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
			delete sh_coms[com];
			num_deleted++;
		}
cwarn(`Deleted: ${num_deleted} commands from '${libname}'`);
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
cwarn(`Deleted module: ${m}`);
	}
}//»

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

this.util={/*«*/
	makeShErrCom: make_sh_error_com,
	getOptions:get_options,
	addToEnv:add_to_env,
	importComs:import_coms,
	doImports:do_imports,
	deleteComs:delete_coms,
	deleteMods:delete_mods,
	writeToRedir:write_to_redir
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
assignRE: /^([_a-zA-Z][_a-zA-Z0-9]*(\[[_a-zA-Z0-9]+\])?)=(.*)/,

}//»

//»
//Command Classes: this.comClasses (Com, ErrCom, ScriptCom)«

const Com = class {//«
	constructor(name, args, opts, env={}){//«
		this.name =name;
		this.args=args;
		this.opts=opts;
		this.numErrors = 0;
		this.noPipe = false;
		for (let k in env) {
			this[k]=env[k];
		}
		if (this.out_redir&&this.out_redir.length){
			this.redirLines = [];
		}
		this.awaitEnd = new Promise((Y,N)=>{
			this.end = (rv)=>{
				Y(rv);
				this.killed = true;
			};
			this.ok=(mess)=>{
				if (mess) this.suc(mess);
				if (this.pipeTo) this.out(EOF);
				Y(E_SUC);
				this.killed = true;
			};
			this.no=(mess)=>{
				if (mess) this.err(mess);
				if (this.inpipe) this.out(EOF);
				Y(E_ERR);
				this.killed = true;
			};
			this.nok=(mess)=>{
				this.numErrors?this.no(mess):this.ok(mess);
			};
		});
	}//»
	static grabsScreen = false;
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
	run(){
		this.wrn(`sh: ${this.name}: the 'run' method has not been overriden!`);
	}
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
		let scriptOut = this.out;
		let scriptArgs = this.args;
		let scriptName = this.name;
		let code;
//WLKGDMNH
		if (globals.dev_mode && this.term.useDevParser) code = await this.shell.devexecute(this.text, {scriptOut, scriptName, scriptArgs});
		else code = await this.shell.execute(this.text, {scriptOut, scriptName, scriptArgs});
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

this.comClasses={
	Com, ScriptCom, NoCom, ErrCom,
}

//globals.comClasses={Com, ErrCom};

//»
//Builtin commands/options: this.defCommand(Opt)s (ls, cd, echo, etc...)«
{
/*«
const com_ = class extends Com{
init(){
}
run(){
}
}
»*/

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
static grabsScreen = true;
async init(){//«
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
const com_devparse = class extends Com{//«
init(){//«
	if (!this.args.length) this.no("need a file arg");
}//»
async run(){//«
	let fname = this.args.shift();
	let text = await fname.toText(this.term);
	if (!text) return this.no(`${fname}: NOTEXT`);
	let str = text.join("\n");
	let shell = new ShellMod.Shell(this.term);
	let rv = await shell.devexecute(str);
	if (isStr(rv)){
		return this.no(rv);
	}
log(rv);
	//log(shell);
	this.ok();
}//»
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
	let colors = [];
	let {pipeTo, isSub, term, out, err, args} = this;
	let no_fmt = pipeTo|| isSub;
	let nargs = args.length;
	let dir_was_last = false;
	let all = this.optAll;
	let recur = this.optRecur;
	const do_path = async(node_or_path)=>{
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
			if (dir_was_last) out.push("");
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
//			if (pipeTo) {
			if (no_fmt) {
				out(nm);
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
//		if (pipeTo||isSub) {
		if (no_fmt) {
			out(...dir_arr);
		}
		else {//«
			for (let nm of dir_arr){
				let n = kids[nm];
				if (nm.match(/\x20/)){
					nm=`'${nm}'`;
				}
				if (n.appName===FOLDER_APP) {
					types.push(ShellMod.var.dirType);
				}
				else if (n.appName==="Link") {
					if (!await n.ref) types.push(ShellMod.var.badLinkType);
					else types.push(ShellMod.var.linkType);
				}
				else if (n.blobId === ShellMod.var.idbDataType) types.push(ShellMod.var.idbDataType);
				else types.push(null);
			}
			let name_lens = [];
			for (let nm of dir_arr) name_lens.push(nm.length);
			let ret = [];
			term.fmt_ls(dir_arr, name_lens, ret, types, colors);
			if (!ret.length) out("");
			else out(ret.join("\n"), {colors, didFmt: true});
		}//»
		if (recur) {
			for (let dir of recur_dirs) await do_path(dir);
		}
	};
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
		this.args.push(this.term.get_homedir());
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
	const {args, opts, term, err: _err} = this;
	const{ENV}=term;
	let have_error = false;
	const err=mess=>{
		have_error = true;
		_err(mess);
	};
	let use_prompt = opts.prompt;
	if (use_prompt && use_prompt.length > term.w - 3){
		this.no(`the prompt is too wide (have ${use_prompt.length}, max = ${term.w - 4})`);
		return;
	}
	let ln = await term.read_line(use_prompt);
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

const com_test = class extends Com{//«
	init(){
	}
	pipeIn(val){
	}
	async run() {//«
this.ok("NOT MUCH HERE!!!");
	}//»
};//»

this.defCommands={//«
//const shell_commands={
workman: com_workman,
devparse: com_devparse,
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
	bindwin:{s:{d:3},l:{desc: 3}}
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

const Sequence = class {/*«*/
	constructor(start, par, env){
		this.par = par;
		this.env = env;
		this.val = [];
		this.start = start;
	}
}/*»*/
const Newlines = class extends Sequence{/*«*/
	get isNLs(){ return true; }
	toString(){ return "newline"; }
}/*»*/
const Word = class extends Sequence{//«
async expandSubs(shell, term){//«

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
//let didone = false;
for (let ent of this.val){

	if (ent instanceof BQuote || ent instanceof ComSub){//«
//The first result appends to curfield, the rest do: fields.push(curfield) and set: curfield=""
		let rv = await ent.expand(shell, term);
		let arr = rv.split("\n");
		if (arr.length) {
			curfield+=arr.shift();
			fields.push(curfield);
			let last = arr.pop();
			if (arr.length) fields.push(...arr);
			if (last) curfield = last;
			else curfield = "";
		}
//log(fields);
	}//»
	else if (ent instanceof MathSub){//«
//resolve and start or append to curfield, since this can only return 1 (possibly empty) value
		curfield += await ent.expand(shell, term);
	}//»
	else if (ent instanceof DQuote){//«
//resolve and start or append to curfield
//resolve by looping through everything and calling expand
//		curfield += await ent.expand(shell, term);
		curfield += '"'+await ent.expand(shell, term)+'"';
	}//»
	else if (ent instanceof SQuote || ent instanceof DSQuote){
		curfield += "'"+ent.toString()+"'";
	}
	else{//Must be isStr or DSQuote or SQuote«
		curfield += ent.toString();
	}//»

}
fields.push(curfield);
this.fields = fields;
//log(this.fields);

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
get isAssignment(){
	let eq_pos = this.val.indexOf("=");
	if (eq_pos <= 0) return false;//-1 means no '=' and 0 means it is at the start
	let pre_eq_arr = this.val.slice(0, eq_pos);
	let first = pre_eq_arr.shift();
	return (typeof first === "string" && first.match(/^[_a-zA-Z]$/));
}
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
	let word = new Word(this.start, this.par, this.env);
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
//if (this.fields)
//return this.fields.join("\n");
return this.val.join("");
}/*»*/
get isChars(){/*«*/
	let chars = this.val;
	for (let ch of chars) {
		if (!isStr(ch)) return false;
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
async expand(shell, term){//This returns a string (with possible embedded newlines)«

let out = [];
let curword="";
let vals = this.val;
for (let ent of vals){
	if (ent.expand){//This cannot be another DQuote
		if (curword){
			out.push(curword);
			curword="";
		}
		out.push(await ent.expand(shell, term));
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

}//»

const BQuote = class extends Sequence{//«
//Collect everything in a string...
expand(shell, term){
	return expand_comsub(this, shell, term);
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
const ParamSub = class extends Sequence{//«
expand(shell, term){
cwarn("EXPAND PARAMSUB!!!");
}
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
expand(shell, term){
	return expand_comsub(this, shell, term);
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
	const err = term.resperr;
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
		err(e.message);
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
	this.terminal = opts.terminal;
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
	let rv = nl+(await this.terminal.read_line("> "));
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
async scanSub(par, opts={}){//«

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
const sub = cont_sub || (is_math ? new MathSub(start, par) : 
	(is_param ? new ParamSub(start, par) : new ComSub(start, par))
	);
const out = sub.val;
if (!cont_sub) {
	this.index+=2;
	if (is_math){
		this.index++;
	}
}
let cur = this.index;
//let src = this.source;
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
else if (((is_math || is_comsub) && ch===")") || (is_param && ch === "}")){//«
	if (is_math){
		if (this.source[cur+1] !== ")") return "expected a final '))'";
		cur++;
	}
	this.index = cur;
//	log(`scanSub DONE: ${start} -> ${cur}, <${out.join("")}>`);
	return sub;
}//»
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
	return await this.scanSub(par, {isMath: is_math, isComSub: is_comsub, isParam: is_param, inBack: in_backquote, contSub: sub});
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
	let src;
	let rv;
	let start_line_number = this.lineNumber;
	let start_line_start = this.lineStart;
	let _word = new Word(start, par, env);
	let word = _word.val;
	let is_plain_chars = true;
// Simple means there are only plain chars, escapes, '...', $'...' and 
// "..." with no embedded substitutions
	let is_simple = true;
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
//Runtime«
this.Runtime = class{

constructor(ast, term, opts={}){
	this.ast = ast;
	this.term = term;
/*
Here we can set policies about, for example whether we allow '&'-ended statements.
*/
	this.opts = opts;
}

async execute(){
/*

Array brackets means it is a list of the next type
program->complete_commands[]->complete_command->list[]->andor[]->pipeline->pipe_sequence[]->command

Every list should have an even number of elements:
andor_1, sep_1 [ ,andor_2, sep_2 [, andor_3, sep_3 [,... [ ,andor_n, sep_n ] ] ] ]

The same is true for terms (which are the lists of andors of compound commands).

*/
//log("WHAT ME EXECUTE", this.ast, this.term, this.opts);
cwarn("GIVE ME ANOTHER RUNTIME");
log(this.ast);

}

}

//»
//Dev Parser«

const _DevParser = class {

constructor(code, opts={}) {//«
	this.env = opts.env;
	this.terminal = opts.terminal;
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
Since this is async (because we might need to get more lines from 'await terminal.read_line()'),
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
	while ((rv = await this.terminal.read_line("> ")).match(/^[\x20\t]*(#.+)?$/)){}
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
		let rop = tok;
		this.tokNum++;
		let fname = toks[this.tokNum];
		if (!fname) err("syntax error near unexpected token 'newline'");
		if (!fname.isWord) err(`syntax error near unexpected token '${fname.toString()}'`);
		if (!fname.isChars) err(`wanted characters only in the filename`);
		list.push({redir: [rop, fname]});
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
	else if (opts.isCase && next.isCaseItemEnd){
		term.term.push(";");
	}
	else{
//		err(`could not find ";", "&" or <newlines> to complete the compound list!`);
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
	return {function_def: {name: fname, body}};

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
	return {do_group: list};

}//»

async parseBraceGroup(){//«
	let err = this.fatal;
	let tok = this.curTok();
	if (!(tok && tok.isLBrace)) err(`'{' token not found!`);
	this.tokNum++;
	let list = await this.parseCompoundList();
	tok = this.curTok();
	if (!tok) this.unexpeof();
	if (!tok.isRBrace){
		this.unexp(tok);
	}
	this.tokNum++;
	return {brace_group: list};
}//»
async parseSubshell(){//«
	let err = this.fatal;
	let tok = this.curTok();
	if (!(tok && tok.isSubStart)) err(`'(' token not found!`);
	this.tokNum++;
	let list = await this.parseCompoundList();
	tok = this.curTok();
	if (!tok) this.unexpeof();
	if (!tok.isSubEnd){
		this.unexp(tok);
	}
	this.tokNum++;
	return {subshell: list};
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
	if (tok.isPatListEnd) return {pattern_list: seq}// ')'
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

let pat_list = await this.parseCasePatternList();
if (pat_list===true) return true;

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

let comp_list;
if (tok.isCommandStart){
//This one can end with a ";;" or ";&"
	comp_list = await this.parseCompoundList({isCase: true});
}
tok = this.curTok();
if (!tok){
	this.unexpeof();
}
if (tok.isCaseItemEnd){
	this.tokNum++;
	this.skipNewlines();
	return {case_item: {pattern_list: pat_list, compound_list: comp_list, end: tok}};
}
return {case_item: {pattern_list: pat_list, compound_list: comp_list}};

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
	return {case_list: seq};
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
	return {case_clause: {word, list}};
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
	return {until_clause: {condition: list, do_group}};
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
	return {while_clause: {condition: list, do_group}};
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

return {for_clause: {name, in_list, do_group}};

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
log(else_part);
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
return {if_clause: {if_list, then_list, else_part}};

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
let pref;
let word;
let name;
let suf;
let have_comword;
let tok = toks[this.tokNum];
while(tok){
	if (tok.isHeredoc){//«
		if (!have_comword){
			if (!pref) pref = [];
			pref.push({heredoc: tok});
		}
		else{
			if (!suf) suf = [];
			suf.push({heredoc: tok});
		}
	}//»
	else if (tok.r_op){//«
		let rop = tok;
//		toks.shift();
		this.tokNum++;
		let fname = toks[this.tokNum];
		if (!fname) err("syntax error near unexpected token 'newline'");
		if (!fname.isWord) err(`syntax error near unexpected token '${fname.toString()}'`);
		if (!fname.isChars) err(`wanted characters only in the filename`);
log("REDIRECT TO", fname);
		if (!have_comword){
			if (!pref) pref = [];
			pref.push({redir: [rop, fname]});
		}
		else{
			if (!suf) suf = [];
			suf.push({redir: [rop, fname]});
		}
	}//»
	else if (tok.isWord){//«
		if (!have_comword) {
			if (tok.isAssignment){
				if (!pref) pref = [];
				pref.push(tok);
			}
			else{
				have_comword = tok;
			}
		}
		else{
			if (!suf) suf = [];
			suf.push({word: tok});
		}
	}//»
	else{
		break;
	}
//	toks.shift();
	this.tokNum++;
	tok = toks[this.tokNum];
}
if (!have_comword){
	if (!pref) err("NO COMWORD && NO PREFIX!?!?");
	return {simple_command: {prefix: pref}};
}
else if (pref){
	return {simple_command: {prefix: pref, word: have_comword, suffix: suf}};
}
else return {simple_command: {name: have_comword, suffix: suf}};

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

let parser = new _Parser(str.split(""), {
	terminal: this.terminal,
	heredocScanner: this.heredocScanner,
	env: this.env,
	isInteractive: true,
	isContinue: true,
});
let newtoks, comstr_out;
try {
	let errmess;
	await parser.scanNextTok();
	({err: errmess, tokens: newtoks, source: comstr_out} = await parser.parse());
	if (errmess) return errmess;
	return newtoks;
//	this.tokens = this.tokens.concat(newtoks);
//	toks = this.tokens;
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
//Old Parser«

const parse=async(command_str, opts={})=>{//«

let parser = new _Parser(command_str.split(""), opts);
let toks, comstr_out;
let program;
try {
	let errmess;
	await parser.scanNextTok();
	({program, err: errmess, tokens: toks, source: comstr_out} = await parser.parse());
	if (errmess) return errmess;
	command_str = comstr_out;
}
catch(e){
	cerr(e);
	return e.message;
}
if (program) {
//cwarn("YARM");
//log(program);
//toks = [];
return program;
}

//Collect commands with their arguments«
let com = [];
let coms = [];
let have_neg = false;
for (let tok of toks){
	if (tok.c_op){
		if (!com.length) return `unexpected empty command (found: '${tok.c_op}')`;
		coms.push({com});
		com = [];
		coms.push(tok);
	}
	else if (isNLs(tok)){
		if (com.length){
			coms.push({com});
			com = [];
		}
	}
	else{
		let old_have_neg  = have_neg;
		if (!com.length){
			if (tok.isWord && tok.val.length===1 && tok.val[0]==="!"){
				have_neg = true;
				continue;
			}
			else have_neg = false;
		}
		else have_neg = false;
		if (old_have_neg){
			tok.hasBang = true;
		}
		com.push(tok);
	}
}
if (com.length) coms.push({com});
//»
//Collect pipelines with their subsequent logic operators (if any)«
let pipes = [];
let pipe = [];
for (let i=0; i < coms.length; i++){
	let tok = coms[i];
//log(tok);
	if (tok.c_op && tok.c_op != "|"){//Anything "higher order" than '|' ('&&', ';', etc) goes here«
		if (tok.c_op==="&&"||tok.c_op==="||") {/*«*/
			if (!coms[i+1]) {
				if (opts.isInteractive){
					let rv;
					while ((rv = await opts.terminal.read_line("> ")).match(/^ *$/)) {
						command_str+="\n";
					}
					return Parser.parse(command_str+"\n"+rv, opts);
				}
				return "malformed logic list";
			}
			pipes.push({pipe, type: tok.c_op});
		}/*»*/
		else {
			pipes.push({pipe}, tok);
		}
		pipe = [];
	}/*»*/
	else if (!tok.c_op){//Commands and redirects
//log("WUT1", tok);
		pipe.push(tok);
	}
	else if (pipe.length && coms[i+1]){//noop: This token "must" be a '|'
//log("WUT2", coms[i+1]);
	}
	else {
		if (opts.isInteractive && !coms[i+1]){
			let rv;
			while ((rv = await opts.terminal.read_line("> ")).match(/^ *$/)) {
				command_str+="\n";
			}
			return Parser.parse(command_str+"\n"+rv, opts);
		}
		return "malformed pipeline";
	}

}
if (pipe.length) pipes.push({pipe});
//»
//Collect ';' separated lists of pipelines+logic operators (if any)«
let statements=[];
let statement=[];
for (let tok of pipes){
	let cop = tok.c_op;
	if (cop) {
		if (cop==="&"||cop===";"){
			statements.push({statement, type: cop});
			statement = [];
		}
		else{
			return `unknown control operator: ${cop}`;
		}
	}
	else{
		statement.push(tok);
	}
}
if (statement.length) statements.push({statement});

//»
return statements;

};//»

const _Parser = class {

constructor(code, opts={}) {//«
	this.env = opts.env;
	this.terminal = opts.terminal;
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
Since this is async (because we might need to get more lines from 'await terminal.read_line()'),
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
end(){//«
//SLKIURUJ
	return(this.tokNum===this.numToks);
}//»
async scanNextTok(heredoc_flag) {//«
	let token = this.lookahead;
	this.scanner.scanComments();
	let next = await this.scanner.lex(heredoc_flag);
	this.hasLineTerminator = (token.lineNumber !== next.lineNumber);
	this.lookahead = next;
	return token;
};//»

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

async parse() {//«
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
		if (heredocs && isNLs(next)){/*«*/
if (interactive){
throw new Error("AMIWRONG OR UCAN'T HAVENEWLINESININTERACTIVEMODE");
}
			for (let i=0; i < heredocs.length; i++){
				let heredoc = heredocs[i];
				let rv = this.nextLinesUntilDelim(heredoc.delim);
				if (!isStr(rv)){
					return {err: "warning: here-document at line ? delimited by end-of-file"}
				}
				heredoc.tok.value = rv;
			}
			this.scanner.index--;
			heredocs = null;
		}/*»*/
		else if (cur_heredoc_tok){/*«*/
			if (next.isWord){/*«*/
				if (!heredocs) {
					heredocs = [];
					heredoc_num = 0;
				}
				cur_heredoc_tok.delim = next.toString();
				heredocs.push({tok: cur_heredoc_tok, delim: next.toString()});	
				cur_heredoc_tok = null;
			}/*»*/
			else{/*«*/
				if (isNLs(next)){
					return "syntax error near unexpected token 'newline'";
				}
				else if (next.r_op || next.c_op){
					return `syntax error near unexpected token '${next.r_op||next.c_op}'`;
				}
				else{
cwarn("Whis this non-NLs or r_op or c_op????");
					log(next);
					throw new Error("WUUTTTTTTTTT IZZZZZZZZZ THISSSSSSSSS JKFD^&*$% (see console)");
				}
			}/*»*/
		}/*»*/
		else if (next.type==="r_op" && (next.r_op==="<<" || next.r_op==="<<-")){/*«*/
			toks.push(next);
			cur_heredoc_tok = next;
//			cur_heredoc_tok.isHeredoc = true;
		}/*»*/
		else {/*«*/
				toks.push(next);
		}/*»*/
		await this.scanNextTok(!!heredocs);
		next = this.lookahead;
	}
	if (heredocs){/*«*/
		if (!interactive) return {err: "warning: here-document at line ? delimited by end-of-file"}
		for (let i=0; i < heredocs.length; i++){
			let heredoc = heredocs[i];
			let rv = await this.heredocScanner(heredoc.delim);
			heredoc.tok.value = rv.join("\n");
		}
		heredocs = null;
	}/*»*/
	if (cur_heredoc_tok){/*«*/
		return {err: "syntax error near unexpected token 'newline'"};
	}/*»*/
	return {tokens: toks, source: this.scanner.source.join("")};

};//»

};

//»
class Shell {//«

constructor(term){//«

this.term = term;
/*Very dumbhack to implement cancellations of hanging commands, e.g. that might do fetching,«
so that no output from a cancelled command is sent to the terminal, although
whatever the command might be doing to keep it busy is still happening, so it
is up to the shell user to be aware of what is going on behind the scenes:

In shell.execute("command --line -is here"), the first local variable that is
set is started_time (@WIMNNUYDKL).

There is a global cancelled_time that is set when we do a Ctrl+c when the shell is busy.

Immediately after every 'await' in shell.execute(), we do the following check:

if (started_time < cancelled_time) return;

»*/
this.cancelled_time = 0;
this.cancelled = false;

}//»

async devexecute(command_str){//«
	const{term}=this;
	let parser = new _DevParser(command_str.split(""), {terminal: term, isInteractive: false});
	try{

		let errmess;
//Must use await because it could possibly need more lines from the terminal, so we can't do
//this in the constructor (like esprima does)
		await parser.scanNextTok();
		await parser.tokenize();
		let program = await parser.compile();
		if (!program) return;
//So, we can put this Runtime property onto the ShellMod object anywhere we want (like vim).
		let runtime = new shellmod.Runtime(program, term, {});
		await runtime.execute();
	}
	catch(e){
cerr(e);
term.resperr(e.message);
	}
//	term.response_end();

}/*»*/
async execute(command_str, opts={}){//«

this.commandStr = command_str;
//Init/Var
const terr=(arg, code)=>{//«
	term.response(arg, {isErr: true});
//	if (!scriptOut) term.response_end();
	if (!no_end) term.response_end();
	ShellMod.var.lastExitCode = code||E_ERR;
	return ShellMod.var.lastExitCode;
};//»
const can=()=>{//«
//Cancel test function
	return started_time < this.cancelled_time;
};//»
//WIMNNUYDKL
//«
const{term}=this;
let started_time = (new Date).getTime();

//let {scriptOut, scriptArgs, scriptName, subLines, script_args, script_name, env}=opts;
let {scriptOut, scriptArgs, scriptName, subLines, heredocScanner, env, isInteractive}=opts;
//let {scriptOut, subLines, env}=opts;
let rv;
let is_top_level = !(scriptOut||subLines);
let heredocs;
let no_end = !is_top_level;

command_str = command_str.replace(/^ +/,"");

let statements;

try{
	statements = await parse(command_str, {env, terminal: term, isInteractive, heredocScanner});
}
catch(e){
	return terr("sh: "+e.message);
}
if (isStr(statements)) return terr("sh: "+statements);

let lastcomcode;
//»

//A 'statement' is a list of boolean-separated pipelines.
STATEMENT_LOOP: for (let state of statements){//«

let loglist = state.statement;
if (!loglist){
	return terr(`sh: logic list not found!`);
}

LOGLIST_LOOP: for (let i=0; i < loglist.length; i++){//«
	let pipe = loglist[i];
	let pipelist = pipe.pipe;
	if (!pipelist){
		return terr(`pipeline list not found!`);
	}

	let pipetype = pipe.type;
	let pipeline = [];
	let screen_grab_com;

	for (let j=0; j < pipelist.length; j++) {//«
		let arr = pipelist[j].com;
{
	let arr0=arr[0];
	if (arr0 && arr0.hasBang){
		pipeline._hasBang = true;
	}
}
		let pipeFrom = j > 0;
		let pipeTo = j < pipelist.length-1;
		let args=[];
		let comobj, usecomword;
//		let redir;
		let in_redir, out_redir;

/*Expansions*/
//For each word within a command, the shell processes <backslash>-escape
//sequences inside dollar-single-quotes (See 2.2.4 Dollar-Single-Quotes)
for (let k=0; k < arr.length; k++){
	let tok = arr[k];
	if (tok instanceof Word){
		tok.dsSQuoteExpansion();
	}
}
//Expansions (Doc)«

//and then performs various word expansions (see 2.6 Word Expansions ). 
/*2.6 Word Expansions

This section describes the various expansions that are performed on words. Not
all expansions are performed on every word, as explained in the following
sections and elsewhere in this chapter. The expansions that are performed for a
given word shall be performed in the following order:

1) Tilde expansion (see 2.6.1 Tilde Expansion ), parameter expansion (see 2.6.2
Parameter Expansion ), command substitution (see 2.6.3 Command Substitution ),
and arithmetic expansion (see 2.6.4 Arithmetic Expansion ) shall be performed,
beginning to end. See item 5 in 2.3 Token Recognition .

2) Field splitting (see 2.6.5 Field Splitting ) shall be performed on the portions
of the fields generated by step 1.

3) Pathname expansion (see 2.6.6 Pathname Expansion ) shall be performed, unless
set -f is in effect.

4) Quote removal (see 2.6.7 Quote Removal ), if performed, shall always be
performed last.

Tilde expansions, parameter expansions, command substitutions, arithmetic
expansions, and quote removals that occur within a single word shall expand to
a single field, except as described below. The shell shall create multiple
fields or no fields from a single word only as a result of field splitting,
pathname expansion, or the following cases:

1) Parameter expansion of the special parameters '@' and '*', as described in
2.5.2 Special Parameters , can create multiple fields or no fields from a
single word.

2) When the expansion occurs in a context where field splitting will be performed,
a word that contains all of the following somewhere within it, before any
expansions are applied, in the order specified:

	a) an unquoted <left-curly-bracket> ('{') that is not immediately preceded by an
	unquoted <dollar-sign> ('$')

	b) one or more unquoted <comma> (',') characters or a sequence that consists of
	two adjacent <period> ('.') characters surrounded by other characters (which
	can also be <period> characters)

	c) an unquoted <right-curly-bracket> ('}')

may be subject to an additional implementation-defined form of expansion that
can create multiple fields from a single word. This expansion, if supported,
shall be applied before all the other word expansions are applied. The other
expansions shall then be applied to each field that results from this
expansion.

When the expansions in this section are performed other than in the context of
preparing a command for execution, they shall be carried out in the current
shell execution environment.

When expanding words for a command about to be executed, and the word will be
the command name or an argument to the command, the expansions shall be carried
out in the current shell execution environment. (The environment for the
command to be executed is unknown until the command word is known.)

When expanding the words in a command about to be executed that are used with
variable assignments or redirections, it is unspecified whether the expansions
are carried out in the current execution environment or in the environment of
the command about to be executed.

The '$' character is used to introduce parameter expansion, command
substitution, or arithmetic evaluation. If a '$' that is neither within
single-quotes nor escaped by a <backslash> is immediately followed by a
character that is not a <space>, not a <tab>, not a <newline>, and is not one
of the following:

- A numeric character
- The name of one of the special parameters (see 2.5.2 Special Parameters )
- A valid first character of a variable name
- A <left-curly-bracket> ('{')
- A <left-parenthesis>
- A single-quote

the result is unspecified. If a '$' that is neither within single-quotes nor
escaped by a <backslash> is immediately followed by a <space>, <tab>, or a
<newline>, or is not followed by any character, the '$' shall be treated as a
literal character.

*/
/*When we find a: 
1) '{' ? "," ? '}' (ignore embedded curlies or give a syntax error)
2) '{' \d .. \d '}'
3) '{' \[a-z] .. \[a-z] '}'
3) '{' \[A-Z] .. \[A-Z] '}'

Skip over quotes to look for unescaped '{' followed by the closest unescaped '}'
Collect everything inside.
If there is a strict '..' pattern, use it
Else if there is an internal unquoted (unescaped) comma, use it
Else, let it pass through

*/
//»

for (let k=0; k < arr.length; k++){//curlies«
let tok = arr[k];
if (tok.isWord) {
	let rv = curly_expansion(tok, 0);
	if (rv !== tok){
		arr.splice(k, 1, ...rv);
		k--;//Need to revisit the original position, in case there are more expansions there
	}
}
}//»
for (let k=0; k < arr.length; k++){//tilde«
	let tok = arr[k];
	if (tok instanceof Word) tok.tildeExpansion();
}//»
for (let k=0; k < arr.length; k++){//redirs«
	let tok = arr[k];
	let typ = tok.type;
	let val = tok[typ];
	if (typ==="r_op"){
		let rop = tok.r_op;
		if (!OK_REDIR_TOKS.includes(rop)) {
			return terr(`sh: unsupported operator: '${tok.r_op}'`);
		}
		if (rop==="<<"||rop=="<<-"){
			arr.splice(k, 1);
			k--;
			val=null;
			in_redir = [rop, tok.value];
			continue;
		}
		let tok2 = arr[k+1];
		if (!tok2) return terr("sh: syntax error near unexpected token `newline'");
		if (!(tok2 instanceof Word)) return terr(`sh: invalid or missing redirection operand`);
		arr.splice(k, 2);
		k-=2;
		val = null;
		if (OK_OUT_REDIR_TOKS.includes(rop)) out_redir = [tok.r_op, tok2.toString()];
		else if (OK_IN_REDIR_TOKS.includes(rop)) in_redir = [tok.r_op, tok2.toString()];
		else return terr(`sh: unsupported operator: '${rop}'`);
	}
}//»
for (let k=0; k < arr.length; k++){//parameters«

let tok = arr[k];
if (tok.isWord) {
	let rv = parameter_expansion(tok, env, scriptName, scriptArgs);
	if (isStr(rv)) return terr(`sh: ${rv}`);
}

}//»
for (let k=0; k < arr.length; k++){//command sub«
	let tok = arr[k];
	if (tok.isWord) {
		await tok.expandSubs(this, term);
	}
}//»
for (let k=0; k < arr.length; k++){//field splitting«
	let tok = arr[k];
	if (tok.isWord) {
		let{start, par, env} = tok;
		let words = [];
		for (let field of tok.fields){
			let word = new Word(start, par, env);
			word.val = [...field];
			words.push(word);
		}
		arr.splice(k, 1, ...words);
		k+=words.length-1;
	}
}//»
for (let k=0; k < arr.length; k++){//filepath expansion/glob patterns«

let tok = arr[k];
if (tok.isWord) {
	let rv = await filepath_expansion(tok, term.cur_dir);
	if (isStr(rv)){
		term.response(rv, {isErr: true});
		continue;
	}
	if (rv !== tok){
		arr.splice(k, 1, ...rv);
//		k--;//Need to revisit the original position, in case there are more expansions there
	}
}

}//»
for (let k=0; k < arr.length; k++){//quote removal«
	let tok = arr[k];
	if (tok.isWord) {
		quote_removal(tok);
	}
}//»


//Set environment variables (exports to terminal's environment if there is nothing left)
		let rv = ShellMod.util.addToEnv(arr, env, {term});
//This is an "error" array
		if (rv.length) term.response(rv.join("\n"), {isErr: true});

//Command response callbacks

//Everything that gets sent to redirects, pipes, and script output must be collected
//By default, only the 'out' stream will be collected.

const out_cb = (val, opts={})=>{//«

if (this.cancelled) return;

let redir_lns = comobj.redirLines;
//EOF is not meaningful at the end of a pipeline
//log(val);
if (isEOF(val) || (!redir_lns && pipeTo)){
    let next_com = pipeline[j+1];
    if (next_com && next_com.pipeIn && !next_com.noPipe) {
		next_com.pipeIn(val);
	}
    return;
}
//WLKUIYDP
if (redir_lns) {
//KIUREUN
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
		comobj.redirLines = redir_lns;
		return;
	}
	redir_lns.push(val);
	return;
}
if (scriptOut) return scriptOut(val);

//Save to subLines and call scriptOut
if (subLines){
	if (val instanceof Uint8Array) val = `Uint8Array(${val.length})`;
//	subLines.push(...val);
	subLines.push(val);
	return;
}

//MDKLIOUTYH
term.response(val, opts);
term.scroll_into_view();
term.refresh();

};//»
const err_cb=(str)=>{//«
if (this.cancelled) return;
term.response(str, {isErr: true});
term.scroll_into_view();
term.refresh();

};//»
const suc_cb=(str)=>{//«
if (this.cancelled) return;
term.response(str, {isSuc: true});
term.scroll_into_view();
term.refresh();
};//»
const wrn_cb=(str)=>{//«
if (this.cancelled) return;
term.response(str, {isWrn: true});
term.scroll_into_view();
term.refresh();
};//»
const inf_cb=(str)=>{//«
if (this.cancelled) return;
term.response(str, {isInf: true});
term.scroll_into_view();
term.refresh();
};//»


const com_env = {/*«*/
//	redir,
	in_redir,
	out_redir,
	isSub: !!subLines,
	scriptOut,
//	stdin,
	pipeTo,
	pipeFrom,
	term,
	env,
//	opts,
	command_str,
	out: out_cb,
	err: err_cb,
	suc: suc_cb,
	wrn: wrn_cb,
	inf: inf_cb,
}/*»*/
//XXXXXXXXXXXX
		let comword = arr.shift();
		if (!comword) {
			pipeline.push(new NoCom());
			continue;
		}
		{
			let hold = arr;
			arr = [];
			for (let arg of hold) arr.push(arg.toString());
		}
//Replace with an alias if we can«
		let alias = ShellMod.var.aliases[comword];
		if (alias){
//This should allow aliases that expand with options...
			let ar = alias.split(/\x20+/);
			alias = ar.shift();
			if (ar.length){
				arr.unshift(...ar);
			}
		}//»

		usecomword = alias||comword;
		if (usecomword=="exit"){//«
//			if (!scriptOut){
			if (is_top_level){
				term.response("sh: not exiting the toplevel shell", {isWrn: true});
				break STATEMENT_LOOP;
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
				terr(`sh: command library: '${com}' could not be loaded`);
				return;
			}
			let gotcom = Shell.activeCommands[usecomword];
			if (!(gotcom instanceof Function)){
				terr(`sh: '${usecomword}' is invalid or missing in command library: '${com}'`);
				return;
			}
			com = gotcom;
		}//»
		if (!com) {//Command not found!«
//If the user attempts to use, e.g. 'if', let them know that this isn't that kind of shell

//Need to do this for matching stuff
			comword = comword.toString();
			if (CONTROL_WORDS.includes(comword)){
				terr(`sh: ${comword}: control structures are not implemented`);
				return;
			}

//It doesn't look like a file.
//EOPIUYTLM
			if (!comword.match(/\x2f/)) {
//WPRLKUT
				pipeline.push(ShellMod.util.makeShErrCom(comword, `command not found`, com_env));
				ShellMod.var.lastExitCode = E_ERR;
				continue;
			}

			let node = await fsapi.pathToNode(normPath(comword, term.cur_dir));
			if (!node) {
				pipeline.push(ShellMod.util.makeShErrCom(comword, `file not found`, com_env));
				ShellMod.var.lastExitCode = E_ERR;
				continue;
			}
			let app = node.appName;
			if (app===FOLDER_APP) {
				pipeline.push(ShellMod.util.makeShErrCom(comword, `is a directory`, com_env));
				ShellMod.var.lastExitCode = E_ERR;
				continue;
			}
			if (app!==TEXT_EDITOR_APP) {
				pipeline.push(ShellMod.util.makeShErrCom(comword, `not a text file`, com_env));
				ShellMod.var.lastExitCode = E_ERR;
				continue;
			}
			if (!comword.match(/\.sh$/i)){
				pipeline.push(ShellMod.util.makeShErrCom(comword, `only executing files with '.sh' extension`, com_env));
				ShellMod.var.lastExitCode = E_ERR;
				continue;
			}
			let text = await node.text;
			if (!text) {
				pipeline.push(ShellMod.util.makeShErrCom(comword, `no text returned`, com_env));
				ShellMod.var.lastExitCode = E_ERR;
				continue;
			}
			comobj = new ScriptCom(this, comword, text, arr, com_env);
			pipeline.push(comobj);
			continue;
		}//»
		if (screen_grab_com && com.grabsScreen){/*«*/
			pipeline.push(ShellMod.util.makeShErrCom(comword, `the screen has already been grabbed by: ${screen_grab_com}`, com_env));
			ShellMod.var.lastExitCode = E_ERR;
			continue;
		}/*»*/
		screen_grab_com = com.grabsScreen?comword: false;
		let opts;
		let gotopts = Shell.activeOptions[usecomword];
//Parse the options and fail if there is an error message
		rv = ShellMod.util.getOptions(arr, usecomword, gotopts);
		if (rv[1]&&rv[1][0]) {
			term.response(rv[1][0], {isErr: true});
			ShellMod.var.lastExitCode = E_ERR;
			continue;
		}
		opts = rv[0];

		let stdin;
		if (in_redir) {/*«*/
//The only point for a heredocScanner is during tokenization while in interactive mode
//So there is NO POINT for it here!!!
//			stdin = await get_stdin_lines(in_redir, term, heredocScanner, !!subLines);
			stdin = await get_stdin_lines(in_redir, term, !!subLines);
			if (isStr(stdin)){
				pipeline.push(ShellMod.util.makeShErrCom(comword, stdin, com_env));
				ShellMod.var.lastExitCode = E_ERR;
				continue;
			}
			else if (!isArr(stdin)){
				pipeline.push(ShellMod.util.makeShErrCom(comword, "an invalid value was returned from get_stdin_lines (see console)", com_env));
cwarn("Here is the non-array value");
log(stdin);
				ShellMod.var.lastExitCode = E_ERR;
				continue;
			}
			com_env.stdin = stdin;
		}/*»*/

		try{//«new Com
			comobj = new com(usecomword, arr, opts, com_env);
			pipeline.push(comobj);
		}
		catch(e){
cerr(e);
//VKJEOKJ
//As of 11/26/24 This should be a 'com is not a constructor' error for commands
//that have not migrated to the new 'class extends Com{...}' format
			pipeline.push(ShellMod.util.makeShErrCom(usecomword, e.message, com_env));
		}//»
//SKIOPRHJT
	}//»

this.pipeline = pipeline;

for (let com of pipeline){
	await com.init();
	if (this.cancelled) return;
}
for (let com of pipeline){
	if (!com.killed) com.run();
	else{
log(`Not running (was killed): ${com.name}`);	
	}
}
for (let com of pipeline){/*«*/
	lastcomcode = await com.awaitEnd;

	if (this.cancelled) return;
//	if (!(Number.isFinite(lastcomcode))) {

	if (!(isNum(lastcomcode))) {
//cwarn(`The value returned from '${com.name}' is below`);
//log(lastcomcode);
//		if (!lastcomcode) term.response(`sh: a null, undefined, or empty value was returned from '${com.name}' (see console)`, {isErr: true});
//		else term.response(`sh: an invalid value was returned from '${com.name}' (see console)`, {isErr: true});
		lastcomcode = E_ERR;
	}

	if (com.redirLines) {
		let {err} = await ShellMod.util.writeToRedir(term, com.redirLines, com.out_redir, com.env);
		if (this.cancelled) return;
		if (err) {
			term.response(`sh: ${err}`, {isErr: true});
		}
	}
}/*»*/
if (pipeline._hasBang){
	if (lastcomcode === E_SUC) lastcomcode = E_ERR;
	else lastcomcode = E_SUC;
}
ShellMod.var.lastExitCode = lastcomcode;

//LEUIKJHX
	if (lastcomcode==E_SUC){//SUCCESS«
		if (pipetype=="||"){
			for (let j=i+1; j < loglist.length; j++){
				if (loglist[j].type=="&&"){
					i=j;
					continue LOGLIST_LOOP;
				}
			}
			break LOGLIST_LOOP;
		}
//		else:
//			1 pipetype=="&&" and we automatically go to the next one or:
//			2 there is no pipetype because we are the last pipeline of this loglist, and the logic of the thing doesn't matter
	}
	else{//FAILURE
		if (pipetype=="&&"){
			for (let j=i+1; j < loglist.length; j++){
				if (loglist[j].type=="||"){
					i=j;
					continue LOGLIST_LOOP;
				}
			}
			break LOGLIST_LOOP;
		}
//		else:
//			1 pipetype=="||" and we automatically go to the next one or:
//			2 there is no pipetype because we are the last pipeline of this loglist, and the logic of the thing doesn't matter
	}//»

}//»

}//»

//In a script, refresh rather than returning to the prompt
if (no_end) {
	term.refresh();
	return lastcomcode;
}

//Command line input returns to prompt
term.response_end();
return lastcomcode;

}//»

cancel(){//«
	this.cancelled = true;
	let pipe = this.pipeline;
	if (!pipe) return;
	for (let com of pipe) com.cancel();
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

for (let k in preload_libs){
	this.var.allLibs[k] = preload_libs[k];
}

for (let k in this.var.preloadLibs){
	let arr = this.var.preloadLibs[k];
	for (let com of arr) {
//if (shell_commands[com]){
if (this.defCommands[com]){
cwarn(`The shell command: ${com} already exists (also defined in this.var.preloadLibs: ${k})`);
continue;
}
		this.defCommands[com]=k;
	}
}
const active_commands = globals.shell_commands || this.defCommands;
if (!globals.shell_commands) {
	globals.shell_commands = this.defCommands;
}

const active_options = globals.shell_command_options || this.defCommandOpts;
if (!globals.shell_command_options) globals.shell_command_options = this.defCommandOpts;

Shell.activeCommands = active_commands;
Shell.activeOptions = active_options;

}//»
}
const ShellMod = globals.ShellMod;
ShellMod.init();

//»

