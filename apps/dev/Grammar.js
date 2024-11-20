
//import { util, api as capi } from "util";
//import { globals } from "config";
const util = LOTW.api.util;
const globals = LOTW.globals;
const{make, log, jlog, cwarn, cerr}=util;

const ALLOW_NEWLINES_IN_QUOTES = false;
//const ALLOW_NEWLINES_IN_QUOTES = true;

export const app=function(Win){

const {Main} = Win;

/*«Grammar 1

//   The grammar symbols

%token  WORD
%token  ASSIGNMENT_WORD
%token  NAME
%token  NEWLINE
%token  IO_NUMBER
%token  IO_LOCATION


// The following are the operators (see XBD 3.243 Operator ) containing more
// than one character.

%token  AND_IF    OR_IF    DSEMI    SEMI_AND
//      '&&'      '||'     ';;'     ';&' 

%token  DLESS  DGREAT  LESSAND  GREATAND  LESSGREAT  DLESSDASH
//      '<<'   '>>'    '<&'     '>&'      '<>'       '<<-'   

%token  CLOBBER
//      '>|'   

// The following are the reserved words. 

%token  If    Then    Else    Elif    Fi    Do    Done
//      'if'  'then'  'else'  'elif'  'fi'  'do'  'done'   

%token  Case    Esac    While    Until    For
//      'case'  'esac'  'while'  'until'  'for'   

// These are reserved words, not operator tokens, and are
//   recognized when reserved words are recognized. 

%token  Lbrace    Rbrace    Bang
//      '{'       '}'       '!'   

%token  In
//      'in'   

//   The Grammar

%start program
%%
program          : linebreak complete_commands linebreak
                 | linebreak
                 ;
complete_commands: complete_commands newline_list complete_command
                 |                                complete_command
                 ;
complete_command : list separator_op
                 | list
                 ;
list             : list separator_op and_or
                 |                   and_or
                 ;
and_or           :                         pipeline
                 | and_or AND_IF linebreak pipeline
                 | and_or OR_IF  linebreak pipeline
                 ;
pipeline         :      pipe_sequence
                 | Bang pipe_sequence
                 ;
pipe_sequence    :                             command
                 | pipe_sequence '|' linebreak command
                 ;
command          : simple_command
                 | compound_command
                 | compound_command redirect_list
                 | function_definition
                 ;
compound_command : brace_group
                 | subshell
                 | for_clause
                 | case_clause
                 | if_clause
                 | while_clause
                 | until_clause
                 ;
subshell         : '(' compound_list ')'
                 ;
compound_list    : linebreak term
                 | linebreak term separator
                 ;
term             : term separator and_or
                 |                and_or
                 ;
for_clause       : For name                                      do_group
                 | For name                       sequential_sep do_group
                 | For name linebreak in          sequential_sep do_group
                 | For name linebreak in wordlist sequential_sep do_group
                 ;
name             : NAME                     // Apply rule 5
                 ;
in               : In                       // Apply rule 6
                 ;
wordlist         : wordlist WORD
                 |          WORD
                 ;
case_clause      : Case WORD linebreak in linebreak case_list    Esac
                 | Case WORD linebreak in linebreak case_list_ns Esac
                 | Case WORD linebreak in linebreak              Esac
                 ;
case_list_ns     : case_list case_item_ns
                 |           case_item_ns
                 ;
case_list        : case_list case_item
                 |           case_item
                 ;
case_item_ns     : pattern_list ')' linebreak
                 | pattern_list ')' compound_list
                 ;
case_item        : pattern_list ')' linebreak     DSEMI linebreak
                 | pattern_list ')' compound_list DSEMI linebreak
                 | pattern_list ')' linebreak     SEMI_AND linebreak
                 | pattern_list ')' compound_list SEMI_AND linebreak
                 ;
pattern_list     :                  WORD    // Apply rule 4
                 |              '(' WORD    // Do not apply rule 4
                 | pattern_list '|' WORD    // Do not apply rule 4
                 ;
if_clause        : If compound_list Then compound_list else_part Fi
                 | If compound_list Then compound_list           Fi
                 ;
else_part        : Elif compound_list Then compound_list
                 | Elif compound_list Then compound_list else_part
                 | Else compound_list
                 ;
while_clause     : While compound_list do_group
                 ;
until_clause     : Until compound_list do_group
                 ;
function_definition : fname '(' ')' linebreak function_body
                 ;
function_body    : compound_command                // Apply rule 9
                 | compound_command redirect_list  // Apply rule 9
                 ;
fname            : NAME                            // Apply rule 8
                 ;
brace_group      : Lbrace compound_list Rbrace
                 ;
do_group         : Do compound_list Done           // Apply rule 6
                 ;
simple_command   : cmd_prefix cmd_word cmd_suffix
                 | cmd_prefix cmd_word
                 | cmd_prefix
                 | cmd_name cmd_suffix
                 | cmd_name
                 ;
cmd_name         : WORD                   // Apply rule 7a
                 ;
cmd_word         : WORD                   // Apply rule 7b
                 ;
cmd_prefix       :            io_redirect
                 | cmd_prefix io_redirect
                 |            ASSIGNMENT_WORD
                 | cmd_prefix ASSIGNMENT_WORD
                 ;
cmd_suffix       :            io_redirect
                 | cmd_suffix io_redirect
                 |            WORD
                 | cmd_suffix WORD
                 ;
redirect_list    :               io_redirect
                 | redirect_list io_redirect
                 ;
io_redirect      :             io_file
                 | IO_NUMBER   io_file
                 | IO_LOCATION io_file // Optionally supported
                 |             io_here
                 | IO_NUMBER   io_here
                 | IO_LOCATION io_here // Optionally supported
                 ;
io_file          : '<'       filename
                 | LESSAND   filename
                 | '>'       filename
                 | GREATAND  filename
                 | DGREAT    filename
                 | LESSGREAT filename
                 | CLOBBER   filename
                 ;
filename         : WORD                      // Apply rule 2
                 ;
io_here          : DLESS     here_end
                 | DLESSDASH here_end
                 ;
here_end         : WORD                      // Apply rule 3
                 ;
newline_list     :              NEWLINE
                 | newline_list NEWLINE
                 ;
linebreak        : newline_list
                 | // empty
                 ;
separator_op     : '&'
                 | ';'
                 ;
separator        : separator_op linebreak
                 | newline_list
                 ;
sequential_sep   : ';' linebreak
                 | newline_list
                 ;
»*/

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
const UNSUPPORTED_OPERATOR_CHARS=["(",")"];
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
const UNSUPPORTED_OPERATOR_TOKS=[/*«*/
	'&',
	'<',
	';;',
	';&',
	'>&',
	'>|',
	'<&',
	'<<',
	'<>',
	'<<-',
	'<<<'
];/*»*/
//Util«

const fromCodePoint = (cp) => {//«
	return (cp < 0x10000) ? String.fromCharCode(cp) :
		String.fromCharCode(0xD800 + ((cp - 0x10000) >> 10)) +
			String.fromCharCode(0xDC00 + ((cp - 0x10000) & 1023));
};//»
const isWhiteSpace = (cp) => {//«
	return (cp === 0x20) || (cp === 0x09) || (cp === 0x0B) || (cp === 0x0C) || (cp === 0xA0) ||
		(cp >= 0x1680 && [0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(cp) >= 0);
};//»
const isLineTerminator = (cp) => {//«
	return (cp === 0x0A) || (cp === 0x0D) || (cp === 0x2028) || (cp === 0x2029);
};//»

//»
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
		var msg = 'Line ' + line + ': ' + description;
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

const Scanner = class {

constructor(code, handler) {//«
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

throwUnexpectedToken(message) {//«
	if (message === void 0) { message = Messages.UnexpectedTokenIllegal; }
	return this.errorHandler.throwError(this.index, this.lineNumber, this.index - this.lineStart + 1, message);
};//»

skipSingleLineComment() {//«
	while (!this.eof()) {
		let ch = this.source.charCodeAt(this.index);
		if (isLineTerminator(ch)) {
			return;
		}
		this.index++;
	}
};//»
scanComments() {//«
	let comments;
	let start = (this.index === 0);
	while (!this.eof()) {
		let ch = this.source.charCodeAt(this.index);
		if (isWhiteSpace(ch)) {
			++this.index;
		}
		else if (isLineTerminator(ch)) {
			break;
		}
		else if (ch===0x23){//«
			let diff = this.index - this.lineStart;
			if (diff === 0 || this.source.charCodeAt(this.index - 1) === 0x20 ){
				this.index++;
				this.skipSingleLineComment();
				start = true;
			}
			else {
				break;
			}
		}//»
		else {
			break;
		}
	}
	return comments;
};//»

scanOperator(){/*«*/

	let src = this.source;
	let start = this.index;
	let str = src[start];
	switch(str){
	case '(':/*«*/
	case ')':
		++this.index;
		break;/*»*/
	case '&':/*«*/
		++this.index;
		if (src[this.index]==="&"){
			this.index++;
			str="&&";
		}
		break;/*»*/
	case '|':/*«*/
		++this.index;
		if (src[this.index]==="|"){
			this.index++;
			str="||";
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
			}
			else{
				str="<<";
			}
		}
		break;/*»*/
	case ';':
		++this.index;
		break;
	}
	if (this.index === start) {
		this.throwUnexpectedToken(`Unexpected token ${str}`);
	}
	if (UNSUPPORTED_OPERATOR_TOKS.includes(str)) this.throwUnexpectedToken(`Unsupported token ${str}`);

	if (str.match(/[<>]/)) return {t:"r_op", r_op:str};
	return {t:"c_op", c_op:str};

}/*»*/
scanQuote(which){/*«*/
	this.index++;
	let start = this.index;
	let src = this.source;
	let iter=0;
	let ch;
	let str=which;
	let len = this.length;
	let cur = start;
	while((ch = src[cur]) !== which){
		if (ch=="\n") {
			if (ALLOW_NEWLINES_IN_QUOTES) this.lineNumber++;
			else return null;
		}
		cur++;
		if (cur>=len) return null;
		str+=ch;
	}
	if (cur>=len) return null;
	this.index+=str.length-1;
	return str;
}/*»*/
scanWord(){/*«*/
	let start = this.index;
	let src = this.source;
	let str='';
	let rv;
	let start_line_number = this.lineNumber;
	let start_line_start = this.lineStart;
	while (!this.eof()) {
		let ch = src[this.index];
		if (["'",'"','`'].includes(ch)){
			rv = this.scanQuote(ch);
			if (rv===null) this.throwUnexpectedToken(`Unterminated quote ${ch}`);
			str+=rv;
		}
		else if (ch==="\\"){
			let next = src[this.index+1];
			if (!next || next === "\n") this.throwUnexpectedToken("Unsupported line continuation");
			if (next===" "||next==="\t"){
				str+="\\"+next;
				this.index+=2;
				continue;
			}
		}
//		if (["\n","\r"," ","\t"].includes(ch)) break;
		if (["\n"," ","\t"].includes(ch)) break;
		if (OPERATOR_CHARS.includes(ch)) {
			if (UNSUPPORTED_OPERATOR_CHARS.includes(ch)) this.throwUnexpectedToken(`Unsupported token: ${ch}`);
			break;
		}
		this.index++;
		str+=ch;
	}
	return {t:"word", word:str};
}/*»*/
scanNewlines(){/*«*/

	let start = this.index;
	let src = this.source;
	let str="";
	let iter=0;
	let start_line_number = this.lineNumber;
	let start_line_start = this.index;;
	while (src[start+iter]==="\n"){
		str+="\n";
		iter++;
	}
	this.index+=iter;
	this.lineStart = start_line_start+iter;
	this.lineNumber+=iter;
	return {t:"nl", nl:str};

}/*»*/

lex(){/*«*/

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
if (ch==="\n") return this.scanNewlines();
if (OPERATOR_CHARS.includes(ch)) {
	if (UNSUPPORTED_OPERATOR_CHARS.includes(ch)) this.throwUnexpectedToken(`Unsupported token: ${ch}`);
	return this.scanOperator();
}
return this.scanWord();

}/*»*/

};

//»
//Parser«

const Parser = class {

constructor(code, options={}) {//«
	this.errorHandler = new ErrorHandler();
	this.scanner = new Scanner(code, this.errorHandler);
	this.lookahead = {//«
		type: EOF_Type,
		value: '',
		lineNumber: this.scanner.lineNumber,
		lineStart: 0,
		start: 0,
		end: 0
	};//»
	this.hasLineTerminator = false;
	this.tokens = [];
	this.nextToken();
}//»

nextToken() {//«
	let token = this.lookahead;
	this.scanner.scanComments();
	let next = this.scanner.lex();
	this.hasLineTerminator = (token.lineNumber !== next.lineNumber);
	this.lookahead = next;
	return token;
};//»

parse() {//«
	let chars = [];
	while (this.lookahead.type !== EOF_Type) {
		chars.push(this.lookahead);
		this.nextToken();
	}
	return chars;
};//»

};
//»

let __com_str___ = ` 
\`"foo  $(fluxx)"\` "cha"$rnt'eck' 2> \\ FOOD\\ abc
\\n


HI #fahrtteengggg
hoom   heem;`;

Win.makeScrollable();
Main._ff="monospace";
Main._fs=21;
this.onappinit=(args)=>{
//log("HIARGS", args);
let use_str = __com_str___.replace(/</g,"&lt;").replace(/>/,"&gt;");
Main.innerHTML=`<pre>${use_str}</pre>`;
let parser = new Parser(__com_str___);
try {
let ast = parser.parse();
jlog(ast);
log(ast);
}
catch(e){
Win._fatal(e);
}

};

}

