/*Notes: Shell Command Language AST Debugger/Stepper«

Brand new app to "clear out the cobwebs" when it comes to the possibilities of
interfacing (debugging, etc.) with non-interactive shell scripting.

Now we don't need to worry about "namespace collisions" with all of the keysyms
that the terminal uses to do its CLI stuff...

»*/
/*«Imports*/
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
const NS = LOTW;
const {
	KC,
	DEF_PAGER_MOD_NAME,
//	NS,
	TEXT_EDITOR_APP,
	LINK_APP,
	FOLDER_APP,
	FS_TYPE,
	MOUNT_TYPE,
	SHM_TYPE,
	fs,
	isMobile,
//	shell_libs,
	SHELL_ERROR_CODES,
	dev_mode,
	admin_mode,
	EOF
} = globals;
const fsapi = fs.api;
const widgets = NS.api.widgets;
const {poperr} = widgets;
const {pathToNode}=fsapi;
const{E_SUC, E_ERR} = SHELL_ERROR_CODES;
/*»*/

export const app = function(Win) {

//«DOM
const{Main}=Win;
Main.innerHTML="<center><h1>NewShell</h1></center>";
//»

//Var«

let last_exit_code = 0;

const EOF_Type = 1;
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
///*
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
//*/
const OCTAL_CHARS=[ "0","1","2","3","4","5","6","7" ];
//const OCTAL_CHARS=[ "0","1","2","3","4","5","6","7" ];

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

const HEX_CHARS=[ "a","A","b","B","c","C","d","D","e","E","f","F",...DECIMAL_CHARS_0_to_9 ];

const CONTROL_WORDS = ["if", "then", "elif", "else", "fi", "do", "while", "until", "for", "in", "done", "select", "case", "esac"];
const shell_metas = [" ", "\t", "|", "&", ";", "(", ")", "<", ">"];
const shell_c_op = [";;&", "||", "&&", ";;", ";&", "|&", "((", "&", ";", "|", "(", ")"];
const shell_r_op = ["<<<", "&>>", "<>", ">>", "<<", "<&", "&>", ">&", ">", "<"];

const NO_SET_ENV_VARS = ["USER"];

const ALIASES={
	c: "clear",
	la: "ls -a",
//	com2 : "frugg --gamnich 1 2 3"
//	ai: "appicon"
};

const ALLOW_REDIRECT_CLOBBER = false;
//const ALLOW_REDIRECT_CLOBBER = true;

const FS_COMS=[//«
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

/*«
const TEST_COMS=[
	"test"
];
const YT_COMS=[
	"ytsrch",
	"ytthing",
	"ytvid",
	"ytdl"
];
»*/
const PRELOAD_LIBS = {fs: FS_COMS};
//const ALL_LIBS = {
//	audio:["midiup"],
//	fs: FS_COMS,
//	test: TEST_COMS,
//	yt: YT_COMS
//};
const ALL_LIBS = NS.libs;
for (let k in PRELOAD_LIBS){
	ALL_LIBS[k] = PRELOAD_LIBS[k];
}
//log(ALL_LIBS);
const ASSIGN_RE = /^([_a-zA-Z][_a-zA-Z0-9]*(\[[_a-zA-Z0-9]+\])?)=(.*)/;

//Maximum length of a line entered into the terminal (including lines in scripts)
const MAX_LINE_LEN = 256;

//To allow writing of files even if there is an external lock on it, change this to true
//const allow_write_locked = false;

const NOOP=()=>{};
//const TERM_ERR = 1;

const DIRECTORY_TYPE = "d";
const LINK_TYPE = "l";
const BAD_LINK_TYPE = "b";
const IDB_DATA_TYPE = "i";//Data structures that are stored directly in the indexedDB Nodes table

//»
//class ShellProgram«
class ShellProgram{

constructor(shell, terminal, ast){//«
this.shell = shell;
this.terminal = terminal;
this.ast = ast;
}//»

async execute(){//«
//KDRTIOP
cwarn("EXECUTE SHELL PROGRAM");
//log(this.shell);
//log(this.terminal);
log(this.ast);

return E_SUC;
}//»

}//»
//«Shell

const Shell = (()=>{

//Scanner/Parser«

const Parser=(()=>{

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
	let check_unsupported_toks = dev_mode ? UNSUPPORTED_DEV_OPERATOR_TOKS : UNSUPPORTED_OPERATOR_TOKS;
	if (check_unsupported_toks.includes(str)) this.throwUnexpectedToken(`unsupported operator '${str}'`);
//	if (UNSUPPORTED_OPERATOR_TOKS.includes(str)) this.throwUnexpectedToken(`unsupported token '${str}'`);

//	let obj = {val: str, isOp: true};
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
			obj.isSeqSep = true;
			obj.isSemi = true;
		}
		else if (str==="&") {
			obj.isSeqSep = true;
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
//Parser«

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
	let andor = await this.parseAndOr(undefined, 2);
	seq.push(andor);
	let next = this.curTok();
	let next1 = this.curTok(1);
//	if (!(next && next.isSeqSep && this.isCommandStart(this.curTok(1)))) return {list: seq};
	if (!(next && next.isSeqSep && next1 && next1.isCommandStart)) return {list: seq};
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

	let andor = await this.parseAndOr(undefined, 3);
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
	if (next.isSeqSep) {
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
	if (!next) return {compound_list: term}
	if (next.isSeqSep){
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
	return {bang , pipeline};
}//»
async parseAndOr(seq_arg, which){//«
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
	return await this.parseAndOr(seq, 1);
}//»
async parseCompleteCommand(){//«
	let toks = this.tokens;
	let list = await this.parseList();
	let next = this.curTok();
	if (next && next.isOp && (next.val===";"||next.val==="&")){
//log(list);
		list.list.push(next.val);
		this.tokNum++;
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
		if (heredocs && isNLs(next)){//«
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
			}//»
		}//»
		else if (next.type==="r_op" && (next.r_op==="<<" || next.r_op==="<<-")){//«
			toks.push(next);
			cur_heredoc_tok = next;
//			cur_heredoc_tok.isHeredoc = true;
		}//»
		else {//«
				toks.push(next);
		}//»
		await this.scanNextTok(!!heredocs);
		next = this.lookahead;
	}
	if (heredocs){//«
		if (!interactive) return {err: "warning: here-document at line ? delimited by end-of-file"}
		for (let i=0; i < heredocs.length; i++){
			let heredoc = heredocs[i];
			let rv = await this.heredocScanner(heredoc.delim);
			heredoc.tok.value = rv.join("\n");
		}
		heredocs = null;
	}//»
	if (cur_heredoc_tok){//«
		return {err: "syntax error near unexpected token 'newline'"};
	}//»

	this.tokens = toks;
	this.numToks = toks.length;
	return await this.compile();

};//»

};
//»

return {

parse:async(command_str, opts={})=>{//«

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

}//»

}

})();//»

/*Sequence Classes (Words, Quotes, Subs)«*/

const Sequence = class {/*«*/
	constructor(start, par, env){
		this.par = par;
		this.env = env;
		this.val = [];
		this.start = start;
	}
}/*»*/
const Newlines = class extends Sequence{//«
	get isNLs(){ return true; }
	toString(){ return "newline"; }
}//»
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

/*»*/

const isNLs=val=>{return val instanceof Newlines;};

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
	case "?": val = last_exit_code+""; break;
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
		//			return INVSUB;
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
	return val.split("\n");
}
return stdin;
}//»

return function(term){

//Var«
const shell = this;

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

//»
const FATAL = mess => {term.topwin._fatal(new Error(mess));};
this.cancelled = false;

this.execute=async(command_str, opts={})=>{//«

//Init/Var
//WIMNNUYDKL

let started_time = (new Date).getTime();

//let {scriptOut, scriptArgs, scriptName, subLines, script_args, script_name, env}=opts;
let {scriptOut, scriptArgs, scriptName, subLines, heredocScanner, env, isInteractive}=opts;
//let {scriptOut, subLines, env}=opts;
let rv;
let is_top_level = !(scriptOut||subLines);
let heredocs;
let no_end = !is_top_level;
const terr=(arg, code)=>{//«
	term.response(arg, {isErr: true});
//	if (!scriptOut) term.response_end();
	if (!no_end) term.response_end();
	last_exit_code = code||E_ERR;
	return last_exit_code;
};//»
const can=()=>{//«
//Cancel test function
	return started_time < this.cancelled_time;
};//»
command_str = command_str.replace(/^ +/,"");

let statements;
try{
	statements = await Parser.parse(command_str, {env, terminal: term, isInteractive, heredocScanner});
}
catch(e){
	return terr("sh: "+e.message);
}
if (isStr(statements)) return terr("sh: "+statements);
log(statements);
if (statements.complete_commands){//New way«
let program = new ShellProgram(shell, term, statements);
let rv = await program.execute();
term.response_end();
return rv;
//cwarn("HI COMPLETE_COMMANDS");
//log(statements);
//return E_SUC;

}//»



}//»

this.cancel=()=>{//«
	this.cancelled = true;
	let pipe = this.pipeline;
	if (!pipe) return;
	for (let com of pipe) com.cancel();
};//»

};//

})();
/*»*/

//«Obj/CB
this.onappinit=()=>{//«

let cur_shell = new Shell({response:log, response_end:NOOP});

cur_shell.execute("<><><><><>", {isInteractive: false});
//log(cur_shell);

}//»
this.onkeydown=(e,k)=>{//«
//cwarn(k);
//log(e);
}//»
//»

}

