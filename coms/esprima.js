/*
In order to allow this "import":
const { app } = await import(script_path);
I had to change isFutureReservedWord @SDGSKKF and isKeyword @YYSLSDJ

To allow "await" here, changed @UOWEHDK
for await (const [k, v] of ents){

*/
/*«Notes

This is the "LOTW-ized" version of the esprima project: https://github.com/jquery/esprima
which parsers JS strings into AST's. As of this writing (2024), the project was last updated
3 years ago (August 29, 2021), and supports the syntax of ECMAScript 2019, so newer operators
like "??" (nullish coalescence) and "?." (optional chaining) give errors.

However, I don't really want to use this code base in order to perfectly parse
strings of modern JS. That would mean *adding* to it, therefore making it
bigger and more complex.  I want to use this a) as a learning tool for "real
world" parsing, and b) strip it down to its most basic components, gradually
adding in more advanced features as I go.

Scanning (lexing) means to go character by character through the source code,
and turn sequences of characters of them into tokens. Whitespace might be needed
between tokens to distinguish them (or not): (e.g. only one space is needed in
the code: "let x=1;"). Here are the main types:

1) Comments
2) Strings ("blah", 'blah')
3) Regular Expressions (/a.?/)
4) Words (Identifiers like "foo" and Keywords like "true" or "var")
5) Numbers
6) Punctuators

So the point is to see where we can start trimming out the fat here. Perhaps
we can start with template expressions, which differ from normal strings in
the syntax phase, because:
	somevar`Blah fooey`
...is allowed (it parses as a tagged template expression), while:
	somevar"Blar hooey"
...throws an "Unexpected string" SyntaxError.
»*/
//«Imports

//import { util} from "util";
//import { globals } from "config";
const {globals}=LOTW;

const{strnum, isArr, isJSArr, isStr, isNum, isObj, log, jlog, cwarn, cerr, isEOF}=LOTW.api.util;
const {ShellMod, SHELL_ERROR_CODES, comClasses}=globals;
const{E_SUC, E_ERR} = SHELL_ERROR_CODES;
const{Com}=ShellMod.comClasses;

//»

//Var«

const ArrowParameterPlaceHolder = 'ArrowParameterPlaceHolder';

const BooleanLiteral_Type = 1;
const EOF_Type = 2;
const Identifier_Type = 3;
const Keyword_Type = 4;
const NullLiteral_Type = 5;
const NumericLiteral_Type = 6;
const Punctuator_Type = 7;
const StringLiteral_Type = 8;
const RegularExpression_Type = 9;
const Template_Type = 10;

// See also tools/generate-unicode-regex.js.

// Unicode v8.0.0 NonAsciiIdentifierStart:
const NonAsciiIdentifierStart = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]/;
// Unicode v8.0.0 NonAsciiIdentifierPart:
const NonAsciiIdentifierPart = /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/;

//»
//Util«

const assert = function(condition, message) {//«
// Ensure the condition is true, otherwise throw an error.
// This is only to have a better contract semantic, i.e. another safety net
// to catch a logic error. The condition shall be fulfilled in normal case.
// Do NOT use this to enforce a certain condition on any user input.
	if (!condition) {
		throw new Error('ASSERT: ' + message);
	}
}//»
const hexValue=(ch)=>{return '0123456789abcdef'.indexOf(ch.toLowerCase());}
const octalValue=(ch)=>{return '01234567'.indexOf(ch);}

const fromCodePoint = (cp) => {//«
	return (cp < 0x10000) ? String.fromCharCode(cp) :
		String.fromCharCode(0xD800 + ((cp - 0x10000) >> 10)) +
			String.fromCharCode(0xDC00 + ((cp - 0x10000) & 1023));
};//»
const isWhiteSpace = (cp) => {//«
// https://tc39.github.io/ecma262/#sec-white-space
	return (cp === 0x20) || (cp === 0x09) || (cp === 0x0B) || (cp === 0x0C) || (cp === 0xA0) ||
		(cp >= 0x1680 && [0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(cp) >= 0);
};//»
const isLineTerminator = (cp) => {//«
// https://tc39.github.io/ecma262/#sec-line-terminators
	return (cp === 0x0A) || (cp === 0x0D) || (cp === 0x2028) || (cp === 0x2029);
};//»
const isIdentifierStart = (cp) => {//«
// https://tc39.github.io/ecma262/#sec-names-and-keywords
//$ _ A-Z a-z \ [test for non-ascii]
	return (cp === 0x24) || (cp === 0x5F) ||
		(cp >= 0x41 && cp <= 0x5A) ||
		(cp >= 0x61 && cp <= 0x7A) ||
		(cp === 0x5C) ||
		((cp >= 0x80) && NonAsciiIdentifierStart.test(fromCodePoint(cp)));
};//»
const isIdentifierPart = (cp) => {//«
//$ _ A-Z a-z 0-9 \ [test for non-ascii]
	return (cp === 0x24) || (cp === 0x5F) ||
		(cp >= 0x41 && cp <= 0x5A) ||
		(cp >= 0x61 && cp <= 0x7A) ||
		(cp >= 0x30 && cp <= 0x39) ||
		(cp === 0x5C) ||
		((cp >= 0x80) && NonAsciiIdentifierPart.test(fromCodePoint(cp)));
};//»
const isDecimalDigit = (cp) => {//«
// https://tc39.github.io/ecma262/#sec-literals-numeric-literals
	return (cp >= 0x30 && cp <= 0x39); // 0..9
};//»
const isHexDigit = (cp) => {//«
	return (cp >= 0x30 && cp <= 0x39) ||
		(cp >= 0x41 && cp <= 0x46) ||
		(cp >= 0x61 && cp <= 0x66); // a..f
};//»
const isOctalDigit = (cp) => {//«
	return (cp >= 0x30 && cp <= 0x37); // 0..7
};//»

//»

//Messages«

// Error messages should be identical to V8.
const Messages = {
	BadGetterArity: 'Getter must not have any formal parameters',
	BadSetterArity: 'Setter must have exactly one formal parameter',
	BadSetterRestParameter: 'Setter function argument must not be a rest parameter',
	ConstructorIsAsync: 'Class constructor may not be an async method',
	ConstructorSpecialMethod: 'Class constructor may not be an accessor',
	DeclarationMissingInitializer: 'Missing initializer in %0 declaration',
	DefaultRestParameter: 'Unexpected token =',
	DuplicateBinding: 'Duplicate binding %0',
	DuplicateConstructor: 'A class may only have one constructor',
	DuplicateProtoProperty: 'Duplicate __proto__ fields are not allowed in object literals',
	ForInOfLoopInitializer: '%0 loop variable declaration may not have an initializer',
	GeneratorInLegacyContext: 'Generator declarations are not allowed in legacy contexts',
	IllegalBreak: 'Illegal break statement',
	IllegalContinue: 'Illegal continue statement',
	IllegalExportDeclaration: 'Unexpected token',
	IllegalImportDeclaration: 'Unexpected token',
	IllegalLanguageModeDirective: 'Illegal \'use strict\' directive in function with non-simple parameter list',
	IllegalReturn: 'Illegal return statement',
	InvalidEscapedReservedWord: 'Keyword must not contain escaped characters',
	InvalidHexEscapeSequence: 'Invalid hexadecimal escape sequence',
	InvalidLHSInAssignment: 'Invalid left-hand side in assignment',
	InvalidLHSInForIn: 'Invalid left-hand side in for-in',
	InvalidLHSInForLoop: 'Invalid left-hand side in for-loop',
	InvalidModuleSpecifier: 'Unexpected token',
	InvalidRegExp: 'Invalid regular expression',
	LetInLexicalBinding: 'let is disallowed as a lexically bound name',
	MissingFromClause: 'Unexpected token',
	MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
	NewlineAfterThrow: 'Illegal newline after throw',
	NoAsAfterImportNamespace: 'Unexpected token',
	NoCatchOrFinally: 'Missing catch or finally after try',
	ParameterAfterRestParameter: 'Rest parameter must be last formal parameter',
	Redeclaration: '%0 \'%1\' has already been declared',
	StaticPrototype: 'Classes may not have static property named prototype',
	StrictCatchVariable: 'Catch variable may not be eval or arguments in strict mode',
	StrictDelete: 'Delete of an unqualified identifier in strict mode.',
	StrictFunction: 'In strict mode code, functions can only be declared at top level or inside a block',
	StrictFunctionName: 'Function name may not be eval or arguments in strict mode',
	StrictLHSAssignment: 'Assignment to eval or arguments is not allowed in strict mode',
	StrictLHSPostfix: 'Postfix increment/decrement may not have eval or arguments operand in strict mode',
	StrictLHSPrefix: 'Prefix increment/decrement may not have eval or arguments operand in strict mode',
	StrictModeWith: 'Strict mode code may not include a with statement',
	StrictOctalLiteral: 'Octal literals are not allowed in strict mode.',
	StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
	StrictParamName: 'Parameter name eval or arguments is not allowed in strict mode',
	StrictReservedWord: 'Use of future reserved word in strict mode',
	StrictVarName: 'Variable name may not be eval or arguments in strict mode',
	TemplateOctalLiteral: 'Octal literals are not allowed in template strings.',
	UnexpectedEOS: 'Unexpected end of input',
	UnexpectedIdentifier: 'Unexpected identifier',
	UnexpectedNumber: 'Unexpected number',
	UnexpectedReserved: 'Unexpected reserved word',
	UnexpectedString: 'Unexpected string',
	UnexpectedTemplate: 'Unexpected quasi %0',
	UnexpectedToken: 'Unexpected token %0',
	UnexpectedTokenIllegal: 'Unexpected token ILLEGAL',
	UnknownLabel: 'Undefined label \'%0\'',
	UnterminatedRegExp: 'Invalid regular expression: missing /'
};

//»
//TokenName«

const TokenName = {};
TokenName[BooleanLiteral_Type] = 'Boolean';
TokenName[EOF_Type] = '<end>';
TokenName[Identifier_Type] = 'Identifier';
TokenName[Keyword_Type] = 'Keyword';
TokenName[NullLiteral_Type] = 'Null';
TokenName[NumericLiteral_Type] = 'Numeric';
TokenName[Punctuator_Type] = 'Punctuator';
TokenName[StringLiteral_Type] = 'String';
TokenName[RegularExpression_Type] = 'RegularExpression';
TokenName[Template_Type] = 'Template';

//»
//Syntax«
const Syntax = {
	AssignmentExpression: 'AssignmentExpression',
	AssignmentPattern: 'AssignmentPattern',
	ArrayExpression: 'ArrayExpression',
	ArrayPattern: 'ArrayPattern',
	ArrowFunctionExpression: 'ArrowFunctionExpression',
	AwaitExpression: 'AwaitExpression',
	BlockStatement: 'BlockStatement',
	BinaryExpression: 'BinaryExpression',
	BreakStatement: 'BreakStatement',
	CallExpression: 'CallExpression',
	CatchClause: 'CatchClause',
	ClassBody: 'ClassBody',
	ClassDeclaration: 'ClassDeclaration',
	ClassExpression: 'ClassExpression',
	ConditionalExpression: 'ConditionalExpression',
	ContinueStatement: 'ContinueStatement',
	DoWhileStatement: 'DoWhileStatement',
	DebuggerStatement: 'DebuggerStatement',
	EmptyStatement: 'EmptyStatement',
	ExportAllDeclaration: 'ExportAllDeclaration',
	ExportDefaultDeclaration: 'ExportDefaultDeclaration',
	ExportNamedDeclaration: 'ExportNamedDeclaration',
	ExportSpecifier: 'ExportSpecifier',
	ExpressionStatement: 'ExpressionStatement',
	ForStatement: 'ForStatement',
	ForOfStatement: 'ForOfStatement',
	ForInStatement: 'ForInStatement',
	FunctionDeclaration: 'FunctionDeclaration',
	FunctionExpression: 'FunctionExpression',
	Identifier: 'Identifier',
	IfStatement: 'IfStatement',
	ImportDeclaration: 'ImportDeclaration',
	ImportDefaultSpecifier: 'ImportDefaultSpecifier',
	ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
	ImportSpecifier: 'ImportSpecifier',
	Literal: 'Literal',
	LabeledStatement: 'LabeledStatement',
	LogicalExpression: 'LogicalExpression',
	MemberExpression: 'MemberExpression',
	MetaProperty: 'MetaProperty',
	MethodDefinition: 'MethodDefinition',
	NewExpression: 'NewExpression',
	ObjectExpression: 'ObjectExpression',
	ObjectPattern: 'ObjectPattern',
	Program: 'Program',
	Property: 'Property',
	RestElement: 'RestElement',
	ReturnStatement: 'ReturnStatement',
	SequenceExpression: 'SequenceExpression',
	SpreadElement: 'SpreadElement',
	Super: 'Super',
	SwitchCase: 'SwitchCase',
	SwitchStatement: 'SwitchStatement',
	TaggedTemplateExpression: 'TaggedTemplateExpression',
	TemplateElement: 'TemplateElement',
	TemplateLiteral: 'TemplateLiteral',
	ThisExpression: 'ThisExpression',
	ThrowStatement: 'ThrowStatement',
	TryStatement: 'TryStatement',
	UnaryExpression: 'UnaryExpression',
	UpdateExpression: 'UpdateExpression',
	VariableDeclaration: 'VariableDeclaration',
	VariableDeclarator: 'VariableDeclarator',
	WhileStatement: 'WhileStatement',
	WithStatement: 'WithStatement',
	YieldExpression: 'YieldExpression'
};//»
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
//Node«
const Node = {

	ArrayExpression: function(elements) {//«
		this.type = Syntax.ArrayExpression;
		this.elements = elements;
	},//»
	ArrayPattern: function(elements) {//«
		this.type = Syntax.ArrayPattern;
		this.elements = elements;
	},//»
	ArrowFunctionExpression: function(params, body, expression) {//«
		this.type = Syntax.ArrowFunctionExpression;
		this.id = null;
		this.params = params;
		this.body = body;
		this.generator = false;
		this.expression = expression;
		this.async = false;
	},//»
	AssignmentExpression: function(operator, left, right) {//«
		this.type = Syntax.AssignmentExpression;
		this.operator = operator;
		this.left = left;
		this.right = right;
	},//»
	AssignmentPattern: function(left, right) {//«
		this.type = Syntax.AssignmentPattern;
		this.left = left;
		this.right = right;
	},//»
	AsyncArrowFunctionExpression: function(params, body, expression) {//«
		this.type = Syntax.ArrowFunctionExpression;
		this.id = null;
		this.params = params;
		this.body = body;
		this.generator = false;
		this.expression = expression;
		this.async = true;
	},//»
	AsyncFunctionDeclaration: function(id, params, body) {//«
		this.type = Syntax.FunctionDeclaration;
		this.id = id;
		this.params = params;
		this.body = body;
		this.generator = false;
		this.expression = false;
		this.async = true;
	},//»
	AsyncFunctionExpression: function(id, params, body) {//«
		this.type = Syntax.FunctionExpression;
		this.id = id;
		this.params = params;
		this.body = body;
		this.generator = false;
		this.expression = false;
		this.async = true;
	},//»
	AwaitExpression: function(argument) {//«
		this.type = Syntax.AwaitExpression;
		this.argument = argument;
	},//»
	BinaryExpression: function(operator, left, right) {//«
		var logical = (operator === '||' || operator === '&&');
		this.type = logical ? Syntax.LogicalExpression : Syntax.BinaryExpression;
		this.operator = operator;
		this.left = left;
		this.right = right;
	},//»
	BlockStatement: function(body) {//«
		this.type = Syntax.BlockStatement;
		this.body = body;
	},//»
	BreakStatement: function(label) {//«
		this.type = Syntax.BreakStatement;
		this.label = label;
	},//»
	CallExpression: function(callee, args) {//«
		this.type = Syntax.CallExpression;
		this.callee = callee;
		this.arguments = args;
	},//»
	CatchClause: function(param, body) {//«
		this.type = Syntax.CatchClause;
		this.param = param;
		this.body = body;
	},//»
	ClassBody: function(body) {//«
		this.type = Syntax.ClassBody;
		this.body = body;
	},//»
	ClassDeclaration: function(id, superClass, body) {//«
		this.type = Syntax.ClassDeclaration;
		this.id = id;
		this.superClass = superClass;
		this.body = body;
	},//»
	ClassExpression: function(id, superClass, body) {//«
		this.type = Syntax.ClassExpression;
		this.id = id;
		this.superClass = superClass;
		this.body = body;
	},//»
	ComputedMemberExpression: function(object, property) {//«
		this.type = Syntax.MemberExpression;
		this.computed = true;
		this.object = object;
		this.property = property;
	},//»
	ConditionalExpression: function(test, consequent, alternate) {//«
		this.type = Syntax.ConditionalExpression;
		this.test = test;
		this.consequent = consequent;
		this.alternate = alternate;
	},//»
	ContinueStatement: function(label) {//«
		this.type = Syntax.ContinueStatement;
		this.label = label;
	},//»
	DebuggerStatement: function() {//«
		this.type = Syntax.DebuggerStatement;
	},//»
	Directive: function(expression, directive) {//«
		this.type = Syntax.ExpressionStatement;
		this.expression = expression;
		this.directive = directive;
	},//»
	DoWhileStatement: function(body, test) {//«
		this.type = Syntax.DoWhileStatement;
		this.body = body;
		this.test = test;
	},//»
	EmptyStatement: function() {//«
		this.type = Syntax.EmptyStatement;
	},//»
	ExportAllDeclaration: function(source) {//«
		this.type = Syntax.ExportAllDeclaration;
		this.source = source;
	},//»
	ExportDefaultDeclaration: function(declaration) {//«
		this.type = Syntax.ExportDefaultDeclaration;
		this.declaration = declaration;
	},//»
	ExportNamedDeclaration: function(declaration, specifiers, source) {//«
		this.type = Syntax.ExportNamedDeclaration;
		this.declaration = declaration;
		this.specifiers = specifiers;
		this.source = source;
	},//»
	ExportSpecifier: function(local, exported) {//«
		this.type = Syntax.ExportSpecifier;
		this.exported = exported;
		this.local = local;
	},//»
	ExpressionStatement: function(expression) {//«
		this.type = Syntax.ExpressionStatement;
		this.expression = expression;
	},//»
	ForInStatement: function(left, right, body) {//«
		this.type = Syntax.ForInStatement;
		this.left = left;
		this.right = right;
		this.body = body;
		this.each = false;
	},//»
	ForOfStatement: function(left, right, body) {//«
		this.type = Syntax.ForOfStatement;
		this.left = left;
		this.right = right;
		this.body = body;
	},//»
	ForStatement: function(init, test, update, body) {//«
		this.type = Syntax.ForStatement;
		this.init = init;
		this.test = test;
		this.update = update;
		this.body = body;
	},//»
	FunctionDeclaration: function(id, params, body, generator) {//«
		this.type = Syntax.FunctionDeclaration;
		this.id = id;
		this.params = params;
		this.body = body;
		this.generator = generator;
		this.expression = false;
		this.async = false;
	},//»
	FunctionExpression: function(id, params, body, generator) {//«
		this.type = Syntax.FunctionExpression;
		this.id = id;
		this.params = params;
		this.body = body;
		this.generator = generator;
		this.expression = false;
		this.async = false;
	},//»
	Identifier: function(name) {//«
		this.type = Syntax.Identifier;
		this.name = name;
	},//»
	IfStatement: function(test, consequent, alternate) {//«
		this.type = Syntax.IfStatement;
		this.test = test;
		this.consequent = consequent;
		this.alternate = alternate;
	},//»
	ImportDeclaration: function(specifiers, source) {//«
		this.type = Syntax.ImportDeclaration;
		this.specifiers = specifiers;
		this.source = source;
	},//»
	ImportDefaultSpecifier: function(local) {//«
		this.type = Syntax.ImportDefaultSpecifier;
		this.local = local;
	},//»
	ImportNamespaceSpecifier: function(local) {//«
		this.type = Syntax.ImportNamespaceSpecifier;
		this.local = local;
	},//»
	ImportSpecifier: function(local, imported) {//«
		this.type = Syntax.ImportSpecifier;
		this.local = local;
		this.imported = imported;
	},//»
	LabeledStatement: function(label, body) {//«
		this.type = Syntax.LabeledStatement;
		this.label = label;
		this.body = body;
	},//»
	Literal: function(value, raw) {//«
		this.type = Syntax.Literal;
		this.value = value;
		this.raw = raw;
	},//»
	MetaProperty: function(meta, property) {//«
		this.type = Syntax.MetaProperty;
		this.meta = meta;
		this.property = property;
	},//»
	MethodDefinition: function(key, computed, value, kind, isStatic) {//«
		this.type = Syntax.MethodDefinition;
		this.key = key;
		this.computed = computed;
		this.value = value;
		this.kind = kind;
		this.static = isStatic;
	},//»
	Module: function(body) {//«
		this.type = Syntax.Program;
		this.body = body;
		this.sourceType = 'module';
	},//»
	NewExpression: function(callee, args) {//«
		this.type = Syntax.NewExpression;
		this.callee = callee;
		this.arguments = args;
	},//»
	ObjectExpression: function(properties) {//«
		this.type = Syntax.ObjectExpression;
		this.properties = properties;
	},//»
	ObjectPattern: function(properties) {//«
		this.type = Syntax.ObjectPattern;
		this.properties = properties;
	},//»
	Property: function(kind, key, computed, value, method, shorthand) {//«
		this.type = Syntax.Property;
		this.key = key;
		this.computed = computed;
		this.value = value;
		this.kind = kind;
		this.method = method;
		this.shorthand = shorthand;
	},//»
	RegexLiteral: function(value, raw, pattern, flags) {//«
		this.type = Syntax.Literal;
		this.value = value;
		this.raw = raw;
		this.regex = { pattern: pattern, flags: flags };
	},//»
	RestElement: function(argument) {//«
		this.type = Syntax.RestElement;
		this.argument = argument;
	},//»
	ReturnStatement: function(argument) {//«
		this.type = Syntax.ReturnStatement;
		this.argument = argument;
	},//»
	Script: function(body) {//«
		this.type = Syntax.Program;
		this.body = body;
		this.sourceType = 'script';
	},//»
	SequenceExpression: function(expressions) {//«
		this.type = Syntax.SequenceExpression;
		this.expressions = expressions;
	},//»
	SpreadElement: function(argument) {//«
		this.type = Syntax.SpreadElement;
		this.argument = argument;
	},//»
	StaticMemberExpression: function(object, property) {//«
		this.type = Syntax.MemberExpression;
		this.computed = false;
		this.object = object;
		this.property = property;
	},//»
	Super: function() {//«
		this.type = Syntax.Super;
	},//»
	SwitchCase: function(test, consequent) {//«
		this.type = Syntax.SwitchCase;
		this.test = test;
		this.consequent = consequent;
	},//»
	SwitchStatement: function(discriminant, cases) {//«
		this.type = Syntax.SwitchStatement;
		this.discriminant = discriminant;
		this.cases = cases;
	},//»
	TaggedTemplateExpression: function(tag, quasi) {//«
		this.type = Syntax.TaggedTemplateExpression;
		this.tag = tag;
		this.quasi = quasi;
	},//»
	TemplateElement: function(value, tail) {//«
		this.type = Syntax.TemplateElement;
		this.value = value;
		this.tail = tail;
	},//»
	TemplateLiteral: function(quasis, expressions) {//«
		this.type = Syntax.TemplateLiteral;
		this.quasis = quasis;
		this.expressions = expressions;
	},//»
	ThisExpression: function() {//«
		this.type = Syntax.ThisExpression;
	},//»
	ThrowStatement: function(argument) {//«
		this.type = Syntax.ThrowStatement;
		this.argument = argument;
	},//»
	TryStatement: function(block, handler, finalizer) {//«
		this.type = Syntax.TryStatement;
		this.block = block;
		this.handler = handler;
		this.finalizer = finalizer;
	},//»
	UnaryExpression: function(operator, argument) {//«
		this.type = Syntax.UnaryExpression;
		this.operator = operator;
		this.argument = argument;
		this.prefix = true;
	},//»
	UpdateExpression: function(operator, argument, prefix) {//«
		this.type = Syntax.UpdateExpression;
		this.operator = operator;
		this.argument = argument;
		this.prefix = prefix;
	},//»
	VariableDeclaration: function(declarations, kind) {//«
		this.type = Syntax.VariableDeclaration;
		this.declarations = declarations;
		this.kind = kind;
	},//»
	VariableDeclarator: function(id, init) {//«
		this.type = Syntax.VariableDeclarator;
		this.id = id;
		this.init = init;
	},//»
	WhileStatement: function(test, body) {//«
		this.type = Syntax.WhileStatement;
		this.test = test;
		this.body = body;
	},//»
	WithStatement: function(object, body) {//«
		this.type = Syntax.WithStatement;
		this.object = object;
		this.body = body;
	},//»
	YieldExpression: function(argument, delegate) {//«
		this.type = Syntax.YieldExpression;
		this.argument = argument;
		this.delegate = delegate;
	}//»

};//»

//Scanner«

const Scanner = class {

	constructor(code, handler) {//«
		this.source = code;
		this.errorHandler = handler;
		this.trackComment = false;
		this.isModule = false;
		this.length = code.length;
		this.index = 0;
		this.lineNumber = (code.length > 0) ? 1 : 0;
		this.lineStart = 0;
		this.curlyStack = [];
	}//»

//Util«

	throwUnexpectedToken(message) {//«
		if (message === void 0) { message = Messages.UnexpectedTokenIllegal; }
		return this.errorHandler.throwError(this.index, this.lineNumber, this.index - this.lineStart + 1, message);
	};//»
	tolerateUnexpectedToken(message) {//«
		if (message === void 0) { message = Messages.UnexpectedTokenIllegal; }
		this.errorHandler.tolerateError(this.index, this.lineNumber, this.index - this.lineStart + 1, message);
	};//»

	eof() {//«
		return this.index >= this.length;
	};//»
	isFutureReservedWord(id) {//«
	// https://tc39.github.io/ecma262/#sec-future-reserved-words
//SDGSKKF
//Didn't allow "import" here: const { app } = await import(script_path);
//Failed with Error: future reserved word
return false;
/*
		switch (id) {
			case 'enum':
			case 'export':
			case 'import':
			case 'super':
				return true;
			default:
				return false;
		}
*/
	};//»
	isStrictModeReservedWord(id) {//«
		switch (id) {
			case 'implements':
			case 'interface':
			case 'package':
			case 'private':
			case 'protected':
			case 'public':
			case 'static':
			case 'yield':
			case 'let':
				return true;
			default:
				return false;
		}
	};//»
	isRestrictedWord(id) {//«
		return id === 'eval' || id === 'arguments';
	};//»
	isKeyword(id) {//«
	// https://tc39.github.io/ecma262/#sec-keywords
		switch (id.length) {
			case 2:
				return (id === 'if') || (id === 'in') || (id === 'do');
			case 3:
				return (id === 'var') || (id === 'for') || (id === 'new') ||
					(id === 'try') || (id === 'let');
			case 4:
				return (id === 'this') || (id === 'else') || (id === 'case') ||
					(id === 'void') || (id === 'with') || (id === 'enum');
			case 5:
				return (id === 'while') || (id === 'break') || (id === 'catch') ||
					(id === 'throw') || (id === 'const') || (id === 'yield') ||
					(id === 'class') || (id === 'super');
			case 6:
				return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
//YYSLSDJ
//Failed with Error: Unexpected keyword
//					(id === 'switch') || (id === 'export') || (id === 'import');

					(id === 'switch') || (id === 'export');
			case 7:
				return (id === 'default') || (id === 'finally') || (id === 'extends');
			case 8:
				return (id === 'function') || (id === 'continue') || (id === 'debugger');
			case 10:
				return (id === 'instanceof');
			default:
				return false;
		}
	};//»
	codePointAt(i) {//«
		var cp = this.source.charCodeAt(i);
		if (cp >= 0xD800 && cp <= 0xDBFF) {
			var second = this.source.charCodeAt(i + 1);
			if (second >= 0xDC00 && second <= 0xDFFF) {
				var first = cp;
				cp = (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
			}
		}
		return cp;
	};//»

	saveState() {//«
		return {
			index: this.index,
			lineNumber: this.lineNumber,
			lineStart: this.lineStart
		};
	};//»
	restoreState(state) {//«
		this.index = state.index;
		this.lineNumber = state.lineNumber;
		this.lineStart = state.lineStart;
	};//»

//»
//Comment«
	skipSingleLineComment(offset) {//«
	// https://tc39.github.io/ecma262/#sec-comments
		var comments = [];
		var start, loc;
		if (this.trackComment) {
			comments = [];
			start = this.index - offset;
			loc = {
				start: {
					line: this.lineNumber,
					column: this.index - this.lineStart - offset
				},
				end: {}
			};
		}
		while (!this.eof()) {
			var ch = this.source.charCodeAt(this.index);
			++this.index;
			if (isLineTerminator(ch)) {
				if (this.trackComment) {
					loc.end = {
						line: this.lineNumber,
						column: this.index - this.lineStart - 1
					};
					var entry = {
						multiLine: false,
						slice: [start + offset, this.index - 1],
						range: [start, this.index - 1],
						loc: loc
					};
					comments.push(entry);
				}
				if (ch === 13 && this.source.charCodeAt(this.index) === 10) {
					++this.index;
				}
				++this.lineNumber;
				this.lineStart = this.index;
				return comments;
			}
		}
		if (this.trackComment) {
			loc.end = {
				line: this.lineNumber,
				column: this.index - this.lineStart
			};
			var entry = {
				multiLine: false,
				slice: [start + offset, this.index],
				range: [start, this.index],
				loc: loc
			};
			comments.push(entry);
		}
		return comments;
	};//»
	skipMultiLineComment() {//«
		var comments = [];
		var start, loc;
		if (this.trackComment) {
			comments = [];
			start = this.index - 2;
			loc = {
				start: {
					line: this.lineNumber,
					column: this.index - this.lineStart - 2
				},
				end: {}
			};
		}
		while (!this.eof()) {
			var ch = this.source.charCodeAt(this.index);
			if (isLineTerminator(ch)) {
				if (ch === 0x0D && this.source.charCodeAt(this.index + 1) === 0x0A) {
					++this.index;
				}
				++this.lineNumber;
				++this.index;
				this.lineStart = this.index;
			}
			else if (ch === 0x2A) {
				// Block comment ends with '* /'. (remove the space)
				if (this.source.charCodeAt(this.index + 1) === 0x2F) {
					this.index += 2;
					if (this.trackComment) {
						loc.end = {
							line: this.lineNumber,
							column: this.index - this.lineStart
						};
						var entry = {
							multiLine: true,
							slice: [start + 2, this.index - 2],
							range: [start, this.index],
							loc: loc
						};
						comments.push(entry);
					}
					return comments;
				}
				++this.index;
			}
			else {
				++this.index;
			}
		}
		// Ran off the end of the file - the whole thing is a comment
		if (this.trackComment) {
			loc.end = {
				line: this.lineNumber,
				column: this.index - this.lineStart
			};
			var entry = {
				multiLine: true,
				slice: [start + 2, this.index],
				range: [start, this.index],
				loc: loc
			};
			comments.push(entry);
		}
		this.tolerateUnexpectedToken();
		return comments;
	};//»
	scanComments() {//«
		var comments;
		if (this.trackComment) {
			comments = [];
		}
		var start = (this.index === 0);
		while (!this.eof()) {
			var ch = this.source.charCodeAt(this.index);
			if (isWhiteSpace(ch)) {
				++this.index;
			}
			else if (isLineTerminator(ch)) {
				++this.index;
				if (ch === 0x0D && this.source.charCodeAt(this.index) === 0x0A) {
					++this.index;
				}
				++this.lineNumber;
				this.lineStart = this.index;
				start = true;
			}
			else if (ch === 0x2F) {
				ch = this.source.charCodeAt(this.index + 1);
				if (ch === 0x2F) {
					this.index += 2;
					var comment = this.skipSingleLineComment(2);
					if (this.trackComment) {
						comments = comments.concat(comment);
					}
					start = true;
				}
				else if (ch === 0x2A) {
					this.index += 2;
					var comment = this.skipMultiLineComment();
					if (this.trackComment) {
						comments = comments.concat(comment);
					}
				}
				else {
					break;
				}
			}
			else if (start && ch === 0x2D) {
				// U+003E is '>'
				if ((this.source.charCodeAt(this.index + 1) === 0x2D) && (this.source.charCodeAt(this.index + 2) === 0x3E)) {
					// '-->' is a single-line comment
					this.index += 3;
					var comment = this.skipSingleLineComment(3);
					if (this.trackComment) {
						comments = comments.concat(comment);
					}
				}
				else {
					break;
				}
			}
			else if (ch === 0x3C && !this.isModule) {
				if (this.source.slice(this.index + 1, this.index + 4) === '!--') {
					this.index += 4; // `<!--`
					var comment = this.skipSingleLineComment(4);
					if (this.trackComment) {
						comments = comments.concat(comment);
					}
				}
				else {
					break;
				}
			}
			else {
				break;
			}
		}
		return comments;
	};//»
//»
//RegExp«
	testRegExp(pattern, flags) {//«
	// https://tc39.github.io/ecma262/#sec-literals-regular-expression-literals
		// The BMP character to use as a replacement for astral symbols when
		// translating an ES6 "u"-flagged pattern to an ES5-compatible
		// approximation.
		// Note: replacing with '\uFFFF' enables false positives in unlikely
		// scenarios. For example, `[\u{1044f}-\u{10440}]` is an invalid
		// pattern that would not be detected by this substitution.
		var astralSubstitute = '\uFFFF';
		var tmp = pattern;
		var self = this;
		if (flags.indexOf('u') >= 0) {
			tmp = tmp
				.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([a-fA-F0-9]{4})/g, function ($0, $1, $2) {
				var codePoint = parseInt($1 || $2, 16);
				if (codePoint > 0x10FFFF) {
					self.throwUnexpectedToken(Messages.InvalidRegExp);
				}
				if (codePoint <= 0xFFFF) {
					return String.fromCharCode(codePoint);
				}
				return astralSubstitute;
			})
				.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, astralSubstitute);
		}
		// First, detect invalid regular expressions.
		try {
			RegExp(tmp);
		}
		catch (e) {
			this.throwUnexpectedToken(Messages.InvalidRegExp);
		}
		// Return a regular expression object for this pattern-flag pair, or
		// `null` in case the current environment doesn't support the flags it
		// uses.
		try {
			return new RegExp(pattern, flags);
		}
		catch (exception) {

			return null;
		}
	};//»
	scanRegExpBody() {//«
		var ch = this.source[this.index];
		assert(ch === '/', 'Regular expression literal must start with a slash');
		var str = this.source[this.index++];
		var classMarker = false;
		var terminated = false;
		while (!this.eof()) {
			ch = this.source[this.index++];
			str += ch;
			if (ch === '\\') {
				ch = this.source[this.index++];
				// https://tc39.github.io/ecma262/#sec-literals-regular-expression-literals
				if (isLineTerminator(ch.charCodeAt(0))) {
					this.throwUnexpectedToken(Messages.UnterminatedRegExp);
				}
				str += ch;
			}
			else if (isLineTerminator(ch.charCodeAt(0))) {
				this.throwUnexpectedToken(Messages.UnterminatedRegExp);
			}
			else if (classMarker) {
				if (ch === ']') {
					classMarker = false;
				}
			}
			else {
				if (ch === '/') {
					terminated = true;
					break;
				}
				else if (ch === '[') {
					classMarker = true;
				}
			}
		}
		if (!terminated) {
			this.throwUnexpectedToken(Messages.UnterminatedRegExp);
		}
		// Exclude leading and trailing slash.
		return str.substr(1, str.length - 2);
	};//»
	scanRegExpFlags() {//«
		var str = '';
		var flags = '';
		while (!this.eof()) {
			var ch = this.source[this.index];
			if (!isIdentifierPart(ch.charCodeAt(0))) {
				break;
			}
			++this.index;
			if (ch === '\\' && !this.eof()) {
				ch = this.source[this.index];
				if (ch === 'u') {
					++this.index;
					var restore = this.index;
					var char = this.scanHexEscape('u');
					if (char !== null) {
						flags += char;
						for (str += '\\u'; restore < this.index; ++restore) {
							str += this.source[restore];
						}
					}
					else {
						this.index = restore;
						flags += 'u';
						str += '\\u';
					}
					this.tolerateUnexpectedToken();
				}
				else {
					str += '\\';
					this.tolerateUnexpectedToken();
				}
			}
			else {
				flags += ch;
				str += ch;
			}
		}
		return flags;
	};//»
	scanRegExp() {//«
		var start = this.index;
		var pattern = this.scanRegExpBody();
		var flags = this.scanRegExpFlags();
		var value = this.testRegExp(pattern, flags);
		return {
			type: RegularExpression_Type,
			value: '',
			pattern: pattern,
			flags: flags,
			regex: value,
			lineNumber: this.lineNumber,
			lineStart: this.lineStart,
			start: start,
			end: this.index
		};
	};//»
//»
//Punctuator«
	scanPunctuator() {
	// https://tc39.github.io/ecma262/#sec-punctuators
		var start = this.index;
		// Check for most common single-character punctuators.
		var str = this.source[this.index];
		switch (str) {
			case '(':
			case '{':
				if (str === '{') {
					this.curlyStack.push('{');
				}
				++this.index;
				break;
			case '.':
				++this.index;
				if (this.source[this.index] === '.' && this.source[this.index + 1] === '.') {
					// Spread operator: ...
					this.index += 2;
					str = '...';
				}
				break;
			case '}':
				++this.index;
				this.curlyStack.pop();
				break;
			case ')':
			case ';':
			case ',':
			case '[':
			case ']':
			case ':':
			case '?':
			case '~':
				++this.index;
				break;
			default:
				// 4-character punctuator.
				str = this.source.substr(this.index, 4);
				if (str === '>>>=') {
					this.index += 4;
				}
				else {
					// 3-character punctuators.
					str = str.substr(0, 3);
					if (str === '===' || str === '!==' || str === '>>>' ||
						str === '<<=' || str === '>>=' || str === '**=') {
						this.index += 3;
					}
					else {
						// 2-character punctuators.
						str = str.substr(0, 2);
						if (str === '&&' || str === '||' || str === '==' || str === '!=' ||
							str === '+=' || str === '-=' || str === '*=' || str === '/=' ||
							str === '++' || str === '--' || str === '<<' || str === '>>' ||
							str === '&=' || str === '|=' || str === '^=' || str === '%=' ||
							str === '<=' || str === '>=' || str === '=>' || str === '**') {
							this.index += 2;
						}
						else {
							// 1-character punctuators.
							str = this.source[this.index];
							if ('<>=!+-*%&|^/'.indexOf(str) >= 0) {
								++this.index;
							}
						}
					}
				}
		}
		if (this.index === start) {
			this.throwUnexpectedToken();
		}
		return {
			type: Punctuator_Type,
			value: str,
			lineNumber: this.lineNumber,
			lineStart: this.lineStart,
			start: start,
			end: this.index
		};
	};
//»
//Number«
	isImplicitOctalLiteral() {//«
		// Implicit octal, unless there is a non-octal digit.
		// (Annex B.1.1 on Numeric Literals)
		for (var i = this.index + 1; i < this.length; ++i) {
			var ch = this.source[i];
			if (ch === '8' || ch === '9') {
				return false;
			}
			if (!isOctalDigit(ch.charCodeAt(0))) {
				return true;
			}
		}
		return true;
	};//»
	scanHexLiteral(start) {//«
	// https://tc39.github.io/ecma262/#sec-literals-numeric-literals
		var num = '';
		while (!this.eof()) {
			if (!isHexDigit(this.source.charCodeAt(this.index))) {
				break;
			}
			num += this.source[this.index++];
		}
		if (num.length === 0) {
			this.throwUnexpectedToken();
		}
		if (isIdentifierStart(this.source.charCodeAt(this.index))) {
			this.throwUnexpectedToken();
		}
		return {
			type: NumericLiteral_Type,
			value: parseInt('0x' + num, 16),
			lineNumber: this.lineNumber,
			lineStart: this.lineStart,
			start: start,
			end: this.index
		};
	};//»
	scanBinaryLiteral(start) {//«
		var num = '';
		var ch;
		while (!this.eof()) {
			ch = this.source[this.index];
			if (ch !== '0' && ch !== '1') {
				break;
			}
			num += this.source[this.index++];
		}
		if (num.length === 0) {
			// only 0b or 0B
			this.throwUnexpectedToken();
		}
		if (!this.eof()) {
			ch = this.source.charCodeAt(this.index);

			if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
				this.throwUnexpectedToken();
			}
		}
		return {
			type: NumericLiteral_Type,
			value: parseInt(num, 2),
			lineNumber: this.lineNumber,
			lineStart: this.lineStart,
			start: start,
			end: this.index
		};
	};//»
	scanOctalLiteral(prefix, start) {//«
		var num = '';
		var octal = false;
		if (isOctalDigit(prefix.charCodeAt(0))) {
			octal = true;
			num = '0' + this.source[this.index++];
		}
		else {
			++this.index;
		}
		while (!this.eof()) {
			if (!isOctalDigit(this.source.charCodeAt(this.index))) {
				break;
			}
			num += this.source[this.index++];
		}
		if (!octal && num.length === 0) {
			// only 0o or 0O
			this.throwUnexpectedToken();
		}
		if (isIdentifierStart(this.source.charCodeAt(this.index)) || isDecimalDigit(this.source.charCodeAt(this.index))) {
			this.throwUnexpectedToken();
		}
		return {
			type: NumericLiteral_Type,
			value: parseInt(num, 8),
			octal: octal,
			lineNumber: this.lineNumber,
			lineStart: this.lineStart,
			start: start,
			end: this.index
		};
	};//»
	scanNumericLiteral() {//«
		var start = this.index;
		var ch = this.source[start];
		assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'), 'Numeric literal must start with a decimal digit or a decimal point');
		var num = '';
		if (ch !== '.') {
			num = this.source[this.index++];
			ch = this.source[this.index];
			// Hex number starts with '0x'.
			// Octal number starts with '0'.
			// Octal number in ES6 starts with '0o'.
			// Binary number in ES6 starts with '0b'.
			if (num === '0') {
				if (ch === 'x' || ch === 'X') {
					++this.index;
					return this.scanHexLiteral(start);
				}
				if (ch === 'b' || ch === 'B') {
					++this.index;
					return this.scanBinaryLiteral(start);
				}
				if (ch === 'o' || ch === 'O') {
					return this.scanOctalLiteral(ch, start);
				}
				if (ch && isOctalDigit(ch.charCodeAt(0))) {
					if (this.isImplicitOctalLiteral()) {
						return this.scanOctalLiteral(ch, start);
					}
				}
			}
			while (isDecimalDigit(this.source.charCodeAt(this.index))) {
				num += this.source[this.index++];
			}
			ch = this.source[this.index];
		}
		if (ch === '.') {
			num += this.source[this.index++];
			while (isDecimalDigit(this.source.charCodeAt(this.index))) {
				num += this.source[this.index++];
			}
			ch = this.source[this.index];
		}
		if (ch === 'e' || ch === 'E') {
			num += this.source[this.index++];
			ch = this.source[this.index];
			if (ch === '+' || ch === '-') {
				num += this.source[this.index++];
			}
			if (isDecimalDigit(this.source.charCodeAt(this.index))) {
				while (isDecimalDigit(this.source.charCodeAt(this.index))) {
					num += this.source[this.index++];
				}
			}
			else {
				this.throwUnexpectedToken();
			}
		}
		if (isIdentifierStart(this.source.charCodeAt(this.index))) {
			this.throwUnexpectedToken();
		}
		return {
			type: NumericLiteral_Type,
			value: parseFloat(num),
			lineNumber: this.lineNumber,
			lineStart: this.lineStart,
			start: start,
			end: this.index
		};
	};//»
//»
//String«
	octalToDecimal(ch) {//«
		// \0 is not octal escape sequence
		var octal = (ch !== '0');
		var code = octalValue(ch);
		if (!this.eof() && isOctalDigit(this.source.charCodeAt(this.index))) {
			octal = true;
			code = code * 8 + octalValue(this.source[this.index++]);
			// 3 digits are only allowed when string starts
			// with 0, 1, 2, 3
			if ('0123'.indexOf(ch) >= 0 && !this.eof() && isOctalDigit(this.source.charCodeAt(this.index))) {
				code = code * 8 + octalValue(this.source[this.index++]);
			}
		}
		return {
			code: code,
			octal: octal
		};
	};//»
	scanHexEscape(prefix) {//«
		var len = (prefix === 'u') ? 4 : 2;
		var code = 0;
		for (var i = 0; i < len; ++i) {
			if (!this.eof() && isHexDigit(this.source.charCodeAt(this.index))) {
				code = code * 16 + hexValue(this.source[this.index++]);
			}
			else {
				return null;
			}
		}
		return String.fromCharCode(code);
	};//»
	scanUnicodeCodePointEscape() {//«
		var ch = this.source[this.index];
		var code = 0;
		// At least, one hex digit is required.
		if (ch === '}') {
			this.throwUnexpectedToken();
		}
		while (!this.eof()) {
			ch = this.source[this.index++];
			if (!isHexDigit(ch.charCodeAt(0))) {
				break;
			}
			code = code * 16 + hexValue(ch);
		}
		if (code > 0x10FFFF || ch !== '}') {
			this.throwUnexpectedToken();
		}
		return fromCodePoint(code);
	};//»
	scanTemplate() {//«
	// https://tc39.github.io/ecma262/#sec-template-literal-lexical-components
		var cooked = '';
		var terminated = false;
		var start = this.index;
		var head = (this.source[start] === '`');
		var tail = false;
		var rawOffset = 2;
		++this.index;
		while (!this.eof()) {
			var ch = this.source[this.index++];
			if (ch === '`') {
				rawOffset = 1;
				tail = true;
				terminated = true;
				break;
			}
			else if (ch === '$') {
				if (this.source[this.index] === '{') {
					this.curlyStack.push('${');
					++this.index;
					terminated = true;
					break;
				}
				cooked += ch;
			}
			else if (ch === '\\') {//«
				ch = this.source[this.index++];
				if (!isLineTerminator(ch.charCodeAt(0))) {
					switch (ch) {
						case 'n':
							cooked += '\n';
							break;
						case 'r':
							cooked += '\r';
							break;
						case 't':
							cooked += '\t';
							break;
						case 'u':
							if (this.source[this.index] === '{') {
								++this.index;
								cooked += this.scanUnicodeCodePointEscape();
							}
							else {
								var restore = this.index;
								var unescaped_2 = this.scanHexEscape(ch);
								if (unescaped_2 !== null) {
									cooked += unescaped_2;
								}
								else {
									this.index = restore;
									cooked += ch;
								}
							}
							break;
						case 'x':
							var unescaped = this.scanHexEscape(ch);
							if (unescaped === null) {
								this.throwUnexpectedToken(Messages.InvalidHexEscapeSequence);
							}
							cooked += unescaped;
							break;
						case 'b':
							cooked += '\b';
							break;
						case 'f':
							cooked += '\f';
							break;
						case 'v':
							cooked += '\v';
							break;
						default:
							if (ch === '0') {
								if (isDecimalDigit(this.source.charCodeAt(this.index))) {
									// Illegal: \01 \02 and so on
									this.throwUnexpectedToken(Messages.TemplateOctalLiteral);
								}
								cooked += '\0';
							}
							else if (isOctalDigit(ch.charCodeAt(0))) {
								// Illegal: \1 \2
								this.throwUnexpectedToken(Messages.TemplateOctalLiteral);
							}
							else {
								cooked += ch;
							}
							break;
					}
				}
				else {
					++this.lineNumber;
					if (ch === '\r' && this.source[this.index] === '\n') {
						++this.index;
					}
					this.lineStart = this.index;
				}
			}//»
			else if (isLineTerminator(ch.charCodeAt(0))) {
				++this.lineNumber;
				if (ch === '\r' && this.source[this.index] === '\n') {
					++this.index;
				}
				this.lineStart = this.index;
				cooked += '\n';
			}
			else {
				cooked += ch;
			}
		}
		if (!terminated) {
			this.throwUnexpectedToken();
		}
		if (!head) {
			this.curlyStack.pop();
		}
		return {
			type: Template_Type,
			value: this.source.slice(start + 1, this.index - rawOffset),
			cooked: cooked,
			head: head,
			tail: tail,
			lineNumber: this.lineNumber,
			lineStart: this.lineStart,
			start: start,
			end: this.index
		};
	};//»
	scanStringLiteral() {//«
	// https://tc39.github.io/ecma262/#sec-literals-string-literals
		var start = this.index;
		var quote = this.source[start];
		assert((quote === "'" || quote === '"'), 'String literal must starts with a quote');
		++this.index;
		var octal = false;
		var str = '';
		while (!this.eof()) {
			var ch = this.source[this.index++];
			if (ch === quote) {
				quote = '';
				break;
			}
			else if (ch === '\\') {//«
				ch = this.source[this.index++];
				if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
					switch (ch) {
						case 'u':
							if (this.source[this.index] === '{') {
								++this.index;
								str += this.scanUnicodeCodePointEscape();
							}
							else {
								var unescaped_1 = this.scanHexEscape(ch);
								if (unescaped_1 === null) {
									this.throwUnexpectedToken();
								}
								str += unescaped_1;
							}
							break;
						case 'x':
							var unescaped = this.scanHexEscape(ch);
							if (unescaped === null) {
								this.throwUnexpectedToken(Messages.InvalidHexEscapeSequence);
							}
							str += unescaped;
							break;
						case 'n':
							str += '\n';
							break;
						case 'r':
							str += '\r';
							break;
						case 't':
							str += '\t';
							break;
						case 'b':
							str += '\b';
							break;
						case 'f':
							str += '\f';
							break;
						case 'v':
							str += '\x0B';
							break;
						case '8':
						case '9':
							str += ch;
							this.tolerateUnexpectedToken();
							break;
						default:
							if (ch && isOctalDigit(ch.charCodeAt(0))) {
								var octToDec = this.octalToDecimal(ch);
								octal = octToDec.octal || octal;
								str += String.fromCharCode(octToDec.code);
							}
							else {
								str += ch;
							}
							break;
					}
				}
				else {
					++this.lineNumber;
					if (ch === '\r' && this.source[this.index] === '\n') {
						++this.index;
					}
					this.lineStart = this.index;
				}
			}//»
			else if (isLineTerminator(ch.charCodeAt(0))) {
				break;
			}
			else {
				str += ch;
			}
		}
		if (quote !== '') {
			this.index = start;
			this.throwUnexpectedToken();
		}
		return {
			type: StringLiteral_Type,
			value: str,
			octal: octal,
			lineNumber: this.lineNumber,
			lineStart: this.lineStart,
			start: start,
			end: this.index
		};
	};//»
//»
//Identifier«
	getComplexIdentifier() {//«
		var cp = this.codePointAt(this.index);
		var id = fromCodePoint(cp);
		this.index += id.length;
		// '\u' (U+005C, U+0075) denotes an escaped character.
		var ch;
		if (cp === 0x5C) {
			if (this.source.charCodeAt(this.index) !== 0x75) {
				this.throwUnexpectedToken();
			}
			++this.index;
			if (this.source[this.index] === '{') {
				++this.index;
				ch = this.scanUnicodeCodePointEscape();
			}
			else {
				ch = this.scanHexEscape('u');
				if (ch === null || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
					this.throwUnexpectedToken();
				}
			}
			id = ch;
		}
		while (!this.eof()) {
			cp = this.codePointAt(this.index);
			if (!isIdentifierPart(cp)) {
				break;
			}
			ch = fromCodePoint(cp);
			id += ch;
			this.index += ch.length;
			// '\u' (U+005C, U+0075) denotes an escaped character.
			if (cp === 0x5C) {
				id = id.substr(0, id.length - 1);
				if (this.source.charCodeAt(this.index) !== 0x75) {
					this.throwUnexpectedToken();
				}
				++this.index;
				if (this.source[this.index] === '{') {
					++this.index;
					ch = this.scanUnicodeCodePointEscape();
				}
				else {
					ch = this.scanHexEscape('u');
					if (ch === null || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
						this.throwUnexpectedToken();
					}
				}
				id += ch;
			}
		}
		return id;
	};//»
	getIdentifier() {//«
		var start = this.index++;
		while (!this.eof()) {
			var ch = this.source.charCodeAt(this.index);
			if (ch === 0x5C) {
				// Blackslash (U+005C) marks Unicode escape sequence.
				this.index = start;
				return this.getComplexIdentifier();
			}
			else if (ch >= 0xD800 && ch < 0xDFFF) {
				// Need to handle surrogate pairs.
				this.index = start;
				return this.getComplexIdentifier();
			}
			if (isIdentifierPart(ch)) {
				++this.index;
			}
			else {
				break;
			}
		}
		return this.source.slice(start, this.index);
	};//»
	scanIdentifier() {//«
	// https://tc39.github.io/ecma262/#sec-names-and-keywords
		var type;
		var start = this.index;
		// Backslash (U+005C) starts an escaped character.
		var id = (this.source.charCodeAt(start) === 0x5C) ? this.getComplexIdentifier() : this.getIdentifier();
		// There is no keyword or literal with only one character.
		// Thus, it must be an identifier.
		if (id.length === 1) {
			type = Identifier_Type;
		}
		else if (this.isKeyword(id)) {
			type = Keyword_Type;
		}
		else if (id === 'null') {
			type = NullLiteral_Type;
		}
		else if (id === 'true' || id === 'false') {
			type = BooleanLiteral_Type;
		}
		else {
			type = Identifier_Type;
		}
		if (type !== Identifier_Type && (start + id.length !== this.index)) {
			var restore = this.index;
			this.index = start;
			this.tolerateUnexpectedToken(Messages.InvalidEscapedReservedWord);
			this.index = restore;
		}
		return {
			type: type,
			value: id,
			lineNumber: this.lineNumber,
			lineStart: this.lineStart,
			start: start,
			end: this.index
		};
	};//»
//»

	lex() {//«
		if (this.eof()) {/*«*/
			return {
				type: EOF_Type,
				value: '',
				lineNumber: this.lineNumber,
				lineStart: this.lineStart,
				start: this.index,
				end: this.index
			};
		}/*»*/
		var cp = this.source.charCodeAt(this.index);
		if (isIdentifierStart(cp)) return this.scanIdentifier();
		if (cp === 0x28 || cp === 0x29 || cp === 0x3B) return this.scanPunctuator();// Very common: ( and ) and ;
		if (cp === 0x27 || cp === 0x22) return this.scanStringLiteral();// String literal starts with single quote (U+0027) or double quote (U+0022).
		if (cp === 0x2E) {//«
			// Dot (.) U+002E can also start a floating-point number, hence the need to check the next character.
			if (isDecimalDigit(this.source.charCodeAt(this.index + 1))) return this.scanNumericLiteral();
			return this.scanPunctuator();
		}//»
		if (isDecimalDigit(cp)) return this.scanNumericLiteral();
		if (cp === 0x60 || (cp === 0x7D && this.curlyStack[this.curlyStack.length - 1] === '${')) {//«
		// Template literals start with ` (U+0060) for template head
		// or } (U+007D) for template middle or template tail.
			return this.scanTemplate();
		}//»
		if (cp >= 0xD800 && cp < 0xDFFF) {//«
		// Possible identifier start in a surrogate pair.
			if (isIdentifierStart(this.codePointAt(this.index))) {
				return this.scanIdentifier();
			}
		}//»
		return this.scanPunctuator();
	};//»

};

//»
//Parser«
const Parser = class {

	constructor(code, options={}) {//«
		this.config = {//«
			range: (typeof options.range === 'boolean') && options.range,
			loc: (typeof options.loc === 'boolean') && options.loc,
			source: null,
			tokens: (typeof options.tokens === 'boolean') && options.tokens,
			comment: (typeof options.comment === 'boolean') && options.comment,
			tolerant: (typeof options.tolerant === 'boolean') && options.tolerant
		};//»
		if (this.config.loc && options.source && options.source !== null) {
			this.config.source = String(options.source);
		}
		this.errorHandler = new ErrorHandler();
		this.errorHandler.tolerant = this.config.tolerant;
		this.scanner = new Scanner(code, this.errorHandler);
		this.scanner.trackComment = this.config.comment;
		this.operatorPrecedence = {//«
			')': 0,
			';': 0,
			',': 0,
			'=': 0,
			']': 0,
			'||': 1,
			'&&': 2,
			'|': 3,
			'^': 4,
			'&': 5,
			'==': 6,
			'!=': 6,
			'===': 6,
			'!==': 6,
			'<': 7,
			'>': 7,
			'<=': 7,
			'>=': 7,
			'<<': 8,
			'>>': 8,
			'>>>': 8,
			'+': 9,
			'-': 9,
			'*': 11,
			'/': 11,
			'%': 11
		};//»
		this.lookahead = {//«
			type: EOF_Type,
			value: '',
			lineNumber: this.scanner.lineNumber,
			lineStart: 0,
			start: 0,
			end: 0
		};//»
		this.hasLineTerminator = false;
		this.context = {//«
			isModule: false,
			await: false,
			allowIn: true,
			allowStrictDirective: true,
			allowYield: true,
			firstCoverInitializedNameError: null,
			isAssignmentTarget: false,
			isBindingElement: false,
			inFunctionBody: false,
			inIteration: false,
			inSwitch: false,
			labelSet: {},
			strict: false
		};//»
		this.tokens = [];
		this.startMarker = {//«
			index: 0,
			line: this.scanner.lineNumber,
			column: 0
		};//»
		this.lastMarker = {//«
			index: 0,
			line: this.scanner.lineNumber,
			column: 0
		};//»
		this.nextToken();
		this.lastMarker = {//«
			index: this.scanner.index,
			line: this.scanner.lineNumber,
			column: this.scanner.index - this.scanner.lineStart
		};//»
	}//»

//«Util

	throwError(messageFormat) {//«
		var values = [];
		for (var _i = 1; _i < arguments.length; _i++) {
			values[_i - 1] = arguments[_i];
		}
		var args = Array.prototype.slice.call(arguments, 1);
		var msg = messageFormat.replace(/%(\d)/g, function (whole, idx) {
			assert(idx < args.length, 'Message reference must be in range');
			return args[idx];
		});
		var index = this.lastMarker.index;
		var line = this.lastMarker.line;
		var column = this.lastMarker.column + 1;
		throw this.errorHandler.createError(index, line, column, msg);
	};//»
	tolerateError(messageFormat) {//«
		var values = [];
		for (var _i = 1; _i < arguments.length; _i++) {
			values[_i - 1] = arguments[_i];
		}
		var args = Array.prototype.slice.call(arguments, 1);
		var msg = messageFormat.replace(/%(\d)/g, function (whole, idx) {
			assert(idx < args.length, 'Message reference must be in range');
			return args[idx];
		});
		var index = this.lastMarker.index;
		var line = this.scanner.lineNumber;
		var column = this.lastMarker.column + 1;
		this.errorHandler.tolerateError(index, line, column, msg);
	};//»
	unexpectedTokenError(token, message) {//«
	// Throw an exception because of the token.
		var msg = message || Messages.UnexpectedToken;
		var value;
		if (token) {
			if (!message) {

				msg = (token.type === EOF_Type) ? Messages.UnexpectedEOS :
					(token.type === Identifier_Type) ? Messages.UnexpectedIdentifier :
						(token.type === NumericLiteral_Type) ? Messages.UnexpectedNumber :
							(token.type === StringLiteral_Type) ? Messages.UnexpectedString :
								(token.type === Template_Type) ? Messages.UnexpectedTemplate :
									Messages.UnexpectedToken;
				if (token.type === Keyword_Type) {
					if (this.scanner.isFutureReservedWord(token.value)) {
						msg = Messages.UnexpectedReserved;
					}
					else if (this.context.strict && this.scanner.isStrictModeReservedWord(token.value)) {
						msg = Messages.StrictReservedWord;
					}
				}
			}
			value = token.value;
		}
		else {
			value = 'ILLEGAL';
		}
		msg = msg.replace('%0', value);
		if (token && typeof token.lineNumber === 'number') {
			var index = token.start;
			var line = token.lineNumber;
			var lastMarkerLineStart = this.lastMarker.index - this.lastMarker.column;
			var column = token.start - lastMarkerLineStart + 1;
			return this.errorHandler.createError(index, line, column, msg);
		}
		else {
			var index = this.lastMarker.index;
			var line = this.lastMarker.line;
			var column = this.lastMarker.column + 1;
			return this.errorHandler.createError(index, line, column, msg);
		}
	};//»
	throwUnexpectedToken(token, message) {//«
		throw this.unexpectedTokenError(token, message);
	};//»
	tolerateUnexpectedToken(token, message) {//«
		this.errorHandler.tolerate(this.unexpectedTokenError(token, message));
	};//»

	parseDirective() {//«
	// https://tc39.github.io/ecma262/#sec-directive-prologues-and-the-use-strict-directive
		var token = this.lookahead;
		var node = this.createNode();
		var expr = this.parseExpression();
		var directive = (expr.type === Syntax.Literal) ? this.getTokenRaw(token).slice(1, -1) : null;
		this.consumeSemicolon();
		return this.finalize(node, directive ? new Node.Directive(expr, directive) : new Node.ExpressionStatement(expr));
	};//»
	parseDirectivePrologues() {//«
		var firstRestricted = null;
		var body = [];
		while (true) {
			var token = this.lookahead;
			if (token.type !== StringLiteral_Type) {
				break;
			}
			var statement = this.parseDirective();
			body.push(statement);
			var directive = statement.directive;
			if (typeof directive !== 'string') {
				break;
			}
			if (directive === 'use strict') {
				this.context.strict = true;
				if (firstRestricted) {
					this.tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
				}
				if (!this.context.allowStrictDirective) {
					this.tolerateUnexpectedToken(token, Messages.IllegalLanguageModeDirective);
				}
			}
			else {
				if (!firstRestricted && token.octal) {
					firstRestricted = token;
				}
			}
		}
		return body;
	};//»
	parseEmptyStatement() {//«
	// https://tc39.github.io/ecma262/#sec-empty-statement
		var node = this.createNode();
		this.expect(';');
		return this.finalize(node, new Node.EmptyStatement());
	};//»

	finalize(marker, node) {//«
		if (this.config.range) {
			node.range = [marker.index, this.lastMarker.index];
		}
		if (this.config.loc) {
			node.loc = {
				start: {
					line: marker.line,
					column: marker.column,
				},
				end: {
					line: this.lastMarker.line,
					column: this.lastMarker.column
				}
			};
			if (this.config.source) {
				node.loc.source = this.config.source;
			}
		}
		return node;
	};//»
	createNode() {//«
		return {
			index: this.startMarker.index,
			line: this.startMarker.line,
			column: this.startMarker.column
		};
	};//»
	startNode(token, lastLineStart) {//«
		if (lastLineStart === void 0) { lastLineStart = 0; }
		var column = token.start - token.lineStart;
		var line = token.lineNumber;
		if (column < 0) {
			column += lastLineStart;
			line--;
		}
		return {
			index: token.start,
			line: line,
			column: column
		};
	};//»

	expect(value) {//«
	// Expect the next token to match the specified punctuator.
	// If not, an exception will be thrown.
		var token = this.nextToken();
		if (token.type !== Punctuator_Type || token.value !== value) {
			this.throwUnexpectedToken(token);
		}
	};//»
	expectCommaSeparator() {//«
	// Quietly expect a comma when in tolerant mode, otherwise delegates to expect().
		if (this.config.tolerant) {
			var token = this.lookahead;
			if (token.type === Punctuator_Type && token.value === ',') {
				this.nextToken();
			}
			else if (token.type === Punctuator_Type && token.value === ';') {
				this.nextToken();
				this.tolerateUnexpectedToken(token);
			}
			else {
				this.tolerateUnexpectedToken(token, Messages.UnexpectedToken);
			}
		}
		else {
			this.expect(',');
		}
	};//»
	expectKeyword(keyword) {//«
	// Expect the next token to match the specified keyword.
	// If not, an exception will be thrown.
		var token = this.nextToken();
		if (token.type !== Keyword_Type || token.value !== keyword) {
			this.throwUnexpectedToken(token);
		}
	};//»

	consumeSemicolon() {//«
		if (this.match(';')) {
			this.nextToken();
		}
		else if (!this.hasLineTerminator) {
			if (this.lookahead.type !== EOF_Type && !this.match('}')) {
				this.throwUnexpectedToken(this.lookahead);
			}
			this.lastMarker.index = this.startMarker.index;
			this.lastMarker.line = this.startMarker.line;
			this.lastMarker.column = this.startMarker.column;
		}
	};//»
	collectComments() {//«
		if (!this.config.comment) {
			this.scanner.scanComments();
		}
	};//»
	getTokenRaw(token) {//«
	// From internal representation to an external structure
		return this.scanner.source.slice(token.start, token.end);
	};//»
	convertToken(token) {//«
		var t = {
			type: TokenName[token.type],
			value: this.getTokenRaw(token)
		};
		if (this.config.range) {
			t.range = [token.start, token.end];
		}
		if (this.config.loc) {
			t.loc = {
				start: {
					line: this.startMarker.line,
					column: this.startMarker.column
				},
				end: {
					line: this.scanner.lineNumber,
					column: this.scanner.index - this.scanner.lineStart
				}
			};
		}
		if (token.type === RegularExpression_Type) {
			var pattern = token.pattern;
			var flags = token.flags;
			t.regex = { pattern: pattern, flags: flags };
		}
		return t;
	};//»

	match(value) {//«
	// Return true if the next token matches the specified punctuator.
		return this.lookahead.type === Punctuator_Type && this.lookahead.value === value;
	};//»
	matchKeyword(keyword) {//«
	// Return true if the next token matches the specified keyword
		return this.lookahead.type === Keyword_Type && this.lookahead.value === keyword;
	};//»
	matchContextualKeyword(keyword) {//«
	// Return true if the next token matches the specified contextual keyword
	// (where an identifier is sometimes a keyword depending on the context)
		return this.lookahead.type === Identifier_Type && this.lookahead.value === keyword;
	};//»
	matchAssign() {//«
	// Return true if the next token is an assignment operator
		if (this.lookahead.type !== Punctuator_Type) {
			return false;
		}
		var op = this.lookahead.value;
		return op === '=' ||
			op === '*=' ||
			op === '**=' ||
			op === '/=' ||
			op === '%=' ||
			op === '+=' ||
			op === '-=' ||
			op === '<<=' ||
			op === '>>=' ||
			op === '>>>=' ||
			op === '&=' ||
			op === '^=' ||
			op === '|=';
	};//»
	matchAsyncFunction() {//«
		var match = this.matchContextualKeyword('async');
		if (match) {
			var state = this.scanner.saveState();
			this.scanner.scanComments();
			var next = this.scanner.lex();
			this.scanner.restoreState(state);
			match = (state.lineNumber === next.lineNumber) && (next.type === Keyword_Type) && (next.value === 'function');
		}
		return match;
	};//»

	qualifiedPropertyName(token) {//«
	// https://tc39.github.io/ecma262/#sec-method-definitions
		switch (token.type) {
			case Identifier_Type:
			case StringLiteral_Type:
			case BooleanLiteral_Type:
			case NullLiteral_Type:
			case NumericLiteral_Type:
			case Keyword_Type:
				return true;
			case Punctuator_Type:
				return token.value === '[';
			default:
				break;
		}
		return false;
	};//»
	validateParam(options, param, name) {//«
		var key = '$' + name;
		if (this.context.strict) {
			if (this.scanner.isRestrictedWord(name)) {
				options.stricted = param;
				options.message = Messages.StrictParamName;
			}
			if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
				options.stricted = param;
				options.message = Messages.StrictParamDupe;
			}
		}
		else if (!options.firstRestricted) {
			if (this.scanner.isRestrictedWord(name)) {
				options.firstRestricted = param;
				options.message = Messages.StrictParamName;
			}
			else if (this.scanner.isStrictModeReservedWord(name)) {
				options.firstRestricted = param;
				options.message = Messages.StrictReservedWord;
			}
			else if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
				options.stricted = param;
				options.message = Messages.StrictParamDupe;
			}
		}

		if (typeof Object.defineProperty === 'function') {
			Object.defineProperty(options.paramSet, key, { value: true, enumerable: true, writable: true, configurable: true });
		}
		else {
			options.paramSet[key] = true;
		}
	};//»
	checkPatternParam(options, param) {//«
	// https://tc39.github.io/ecma262/#sec-assignment-operators
		switch (param.type) {
			case Syntax.Identifier:
				this.validateParam(options, param, param.name);
				break;
			case Syntax.RestElement:
				this.checkPatternParam(options, param.argument);
				break;
			case Syntax.AssignmentPattern:
				this.checkPatternParam(options, param.left);
				break;
			case Syntax.ArrayPattern:
				for (var i = 0; i < param.elements.length; i++) {
					if (param.elements[i] !== null) {
						this.checkPatternParam(options, param.elements[i]);
					}
				}
				break;
			case Syntax.ObjectPattern:
				for (var i = 0; i < param.properties.length; i++) {
					this.checkPatternParam(options, param.properties[i].value);
				}
				break;
			default:
				break;
		}
		options.simple = options.simple && (param instanceof Node.Identifier);
	};//»

	binaryPrecedence(token) {//«
	// https://tc39.github.io/ecma262/#sec-exp-operator«
	// https://tc39.github.io/ecma262/#sec-multiplicative-operators
	// https://tc39.github.io/ecma262/#sec-additive-operators
	// https://tc39.github.io/ecma262/#sec-bitwise-shift-operators
	// https://tc39.github.io/ecma262/#sec-relational-operators
	// https://tc39.github.io/ecma262/#sec-equality-operators
	// https://tc39.github.io/ecma262/#sec-binary-bitwise-operators
	// https://tc39.github.io/ecma262/#sec-binary-logical-operators»
		var op = token.value;
		var precedence;
		if (token.type === Punctuator_Type) {
			precedence = this.operatorPrecedence[op] || 0;
		}
		else if (token.type === Keyword_Type) {
			precedence = (op === 'instanceof' || (this.context.allowIn && op === 'in')) ? 7 : 0;
		}
		else {
			precedence = 0;
		}
		return precedence;
	};//»

	isStartOfExpression() {//«
	// https://tc39.github.io/ecma262/#sec-generator-function-definitions
		var start = true;
		var value = this.lookahead.value;
		switch (this.lookahead.type) {
			case Punctuator_Type:
				start = (value === '[') || (value === '(') || (value === '{') ||
					(value === '+') || (value === '-') ||
					(value === '!') || (value === '~') ||
					(value === '++') || (value === '--') ||
					(value === '/') || (value === '/='); // regular expression literal
				break;
			case Keyword_Type:
				start = (value === 'class') || (value === 'delete') ||
					(value === 'function') || (value === 'let') || (value === 'new') ||
					(value === 'super') || (value === 'this') || (value === 'typeof') ||
					(value === 'void') || (value === 'yield');
				break;
			default:
				break;
		}
		return start;
	};//»
	isLexicalDeclaration() {//«
		var state = this.scanner.saveState();
		this.scanner.scanComments();
		var next = this.scanner.lex();
		this.scanner.restoreState(state);
		return (next.type === Identifier_Type) ||
			(next.type === Punctuator_Type && next.value === '[') ||
			(next.type === Punctuator_Type && next.value === '{') ||
			(next.type === Keyword_Type && next.value === 'let') ||
			(next.type === Keyword_Type && next.value === 'yield');
	};//»
	isIdentifierName(token) {//«
		return token.type === Identifier_Type ||
			token.type === Keyword_Type ||
			token.type === BooleanLiteral_Type ||
			token.type === NullLiteral_Type;
	};//»
	isPropertyKey(key, value) {//«
		return (key.type === Syntax.Identifier && key.name === value) ||
			(key.type === Syntax.Literal && key.value === value);
	};//»

	isolateCoverGrammar(parseFunction) {//«

// Cover grammar support.«
//

// When an assignment expression position starts with an left parenthesis, the
// determination of the type of the syntax is to be deferred arbitrarily long
// until the end of the parentheses pair (plus a lookahead) or the first comma.
// This situation also defers the determination of all the expressions nested
// in the pair.

// There are three productions that can be parsed in a parentheses pair that
// needs to be determined after the outermost pair is closed. They are:

//	 1. AssignmentExpression
//	 2. BindingElements
//	 3. AssignmentTargets

// In order to avoid exponential backtracking, we use two flags to denote if
// the production can be binding element or assignment target.

// The three productions have the relationship:
//
//	 BindingElements ⊆ AssignmentTargets ⊆ AssignmentExpression

// with a single exception that CoverInitializedName when used directly in an
// Expression, generates an early error. Therefore, we need the third state,
// firstCoverInitializedNameError, to track the first usage of
// CoverInitializedName and report it when we reached the end of the
// parentheses pair.

// isolateCoverGrammar function runs the given parser function with a new cover
// grammar context, and it does not effect the current flags. This means the
// production the parser parses is only used as an expression. Therefore the
// CoverInitializedName check is conducted.

// inheritCoverGrammar function runs the given parse function with a new cover
// grammar context, and it propagates the flags outside of the parser. This
// means the production the parser parses is used as a part of a potential
// pattern. The CoverInitializedName check is deferred.»

		var previousIsBindingElement = this.context.isBindingElement;
		var previousIsAssignmentTarget = this.context.isAssignmentTarget;
		var previousFirstCoverInitializedNameError = this.context.firstCoverInitializedNameError;
		this.context.isBindingElement = true;
		this.context.isAssignmentTarget = true;
		this.context.firstCoverInitializedNameError = null;
		var result = parseFunction.call(this);
		if (this.context.firstCoverInitializedNameError !== null) {
			this.throwUnexpectedToken(this.context.firstCoverInitializedNameError);
		}
		this.context.isBindingElement = previousIsBindingElement;
		this.context.isAssignmentTarget = previousIsAssignmentTarget;
		this.context.firstCoverInitializedNameError = previousFirstCoverInitializedNameError;
		return result;
	};//»
	inheritCoverGrammar(parseFunction) {//«
		var previousIsBindingElement = this.context.isBindingElement;
		var previousIsAssignmentTarget = this.context.isAssignmentTarget;
		var previousFirstCoverInitializedNameError = this.context.firstCoverInitializedNameError;
		this.context.isBindingElement = true;
		this.context.isAssignmentTarget = true;
		this.context.firstCoverInitializedNameError = null;
		var result = parseFunction.call(this);
		this.context.isBindingElement = this.context.isBindingElement && previousIsBindingElement;
		this.context.isAssignmentTarget = this.context.isAssignmentTarget && previousIsAssignmentTarget;
		this.context.firstCoverInitializedNameError = previousFirstCoverInitializedNameError || this.context.firstCoverInitializedNameError;
		return result;
	};//»

	reinterpretAsCoverFormalsList(expr) {//«
		var params = [expr];
		var options;
		var asyncArrow = false;
		switch (expr.type) {
			case Syntax.Identifier:
				break;
			case ArrowParameterPlaceHolder:
				params = expr.params;
				asyncArrow = expr.async;
				break;
			default:
				return null;
		}
		options = {
			simple: true,
			paramSet: {}
		};
		for (var i = 0; i < params.length; ++i) {
			var param = params[i];
			if (param.type === Syntax.AssignmentPattern) {
				if (param.right.type === Syntax.YieldExpression) {
					if (param.right.argument) {
						this.throwUnexpectedToken(this.lookahead);
					}
					param.right.type = Syntax.Identifier;
					param.right.name = 'yield';
					delete param.right.argument;
					delete param.right.delegate;
				}
			}
			else if (asyncArrow && param.type === Syntax.Identifier && param.name === 'await') {
				this.throwUnexpectedToken(this.lookahead);
			}
			this.checkPatternParam(options, param);
			params[i] = param;
		}
		if (this.context.strict || !this.context.allowYield) {
			for (var i = 0; i < params.length; ++i) {
				var param = params[i];
				if (param.type === Syntax.YieldExpression) {
					this.throwUnexpectedToken(this.lookahead);
				}
			}
		}
		if (options.message === Messages.StrictParamDupe) {
			var token = this.context.strict ? options.stricted : options.firstRestricted;
			this.throwUnexpectedToken(token, options.message);
		}
		return {
			simple: options.simple,
			params: params,
			stricted: options.stricted,
			firstRestricted: options.firstRestricted,
			message: options.message
		};
	};//»
	reinterpretExpressionAsPattern(expr) {//«
	// https://tc39.github.io/ecma262/#sec-grouping-operator
		switch (expr.type) {
			case Syntax.Identifier:
			case Syntax.MemberExpression:
			case Syntax.RestElement:
			case Syntax.AssignmentPattern:
				break;
			case Syntax.SpreadElement:
				expr.type = Syntax.RestElement;
				this.reinterpretExpressionAsPattern(expr.argument);
				break;
			case Syntax.ArrayExpression:
				expr.type = Syntax.ArrayPattern;
				for (var i = 0; i < expr.elements.length; i++) {
					if (expr.elements[i] !== null) {
						this.reinterpretExpressionAsPattern(expr.elements[i]);
					}
				}
				break;
			case Syntax.ObjectExpression:
				expr.type = Syntax.ObjectPattern;
				for (var i = 0; i < expr.properties.length; i++) {
					this.reinterpretExpressionAsPattern(expr.properties[i].value);
				}
				break;
			case Syntax.AssignmentExpression:
				expr.type = Syntax.AssignmentPattern;
				delete expr.operator;
				this.reinterpretExpressionAsPattern(expr.left);
				break;
			default:
				// Allow other node type for tolerant parsing.
				break;
		}
	};//»

	nextRegexToken() {//«
		this.collectComments();
		var token = this.scanner.scanRegExp();
		if (this.config.tokens) {
			// Pop the previous token, '/' or '/='
			// This is added from the lookahead token.
			this.tokens.pop();
			this.tokens.push(this.convertToken(token));
		}
		// Prime the next lookahead.
		this.lookahead = token;
		this.nextToken();
		return token;
	};//»
	nextToken() {//«
		var token = this.lookahead;
		this.lastMarker.index = this.scanner.index;
		this.lastMarker.line = this.scanner.lineNumber;
		this.lastMarker.column = this.scanner.index - this.scanner.lineStart;
		this.collectComments();
		if (this.scanner.index !== this.startMarker.index) {
			this.startMarker.index = this.scanner.index;
			this.startMarker.line = this.scanner.lineNumber;
			this.startMarker.column = this.scanner.index - this.scanner.lineStart;
		}
		var next = this.scanner.lex();
		this.hasLineTerminator = (token.lineNumber !== next.lineNumber);
		if (next && this.context.strict && next.type === Identifier_Type) {
			if (this.scanner.isStrictModeReservedWord(next.value)) {
				next.type = Keyword_Type;
			}
		}
		this.lookahead = next;
		if (this.config.tokens && next.type !== EOF_Type) {
			this.tokens.push(this.convertToken(next));
		}
		return token;
	};//»

//»

//«Try/Throw
	parseThrowStatement() {//«
	// https://tc39.github.io/ecma262/#sec-throw-statement
		var node = this.createNode();
		this.expectKeyword('throw');
		if (this.hasLineTerminator) {
			this.throwError(Messages.NewlineAfterThrow);
		}
		var argument = this.parseExpression();
		this.consumeSemicolon();
		return this.finalize(node, new Node.ThrowStatement(argument));
	};//»
	parseCatchClause() {//«
	// https://tc39.github.io/ecma262/#sec-try-statement
		var node = this.createNode();
		this.expectKeyword('catch');
		this.expect('(');
		if (this.match(')')) {
			this.throwUnexpectedToken(this.lookahead);
		}
		var params = [];
		var param = this.parsePattern(params);
		var paramMap = {};
		for (var i = 0; i < params.length; i++) {
			var key = '$' + params[i].value;
			if (Object.prototype.hasOwnProperty.call(paramMap, key)) {
				this.tolerateError(Messages.DuplicateBinding, params[i].value);
			}
			paramMap[key] = true;
		}
		if (this.context.strict && param.type === Syntax.Identifier) {
			if (this.scanner.isRestrictedWord(param.name)) {
				this.tolerateError(Messages.StrictCatchVariable);
			}
		}
		this.expect(')');
		var body = this.parseBlock();
		return this.finalize(node, new Node.CatchClause(param, body));
	};//»
	parseFinallyClause() {//«
		this.expectKeyword('finally');
		return this.parseBlock();
	};//»
	parseTryStatement() {//«
		var node = this.createNode();
		this.expectKeyword('try');
		var block = this.parseBlock();
		var handler = this.matchKeyword('catch') ? this.parseCatchClause() : null;
		var finalizer = this.matchKeyword('finally') ? this.parseFinallyClause() : null;
		if (!handler && !finalizer) {
			this.throwError(Messages.NoCatchOrFinally);
		}
		return this.finalize(node, new Node.TryStatement(block, handler, finalizer));
	};//»
	parseDebuggerStatement() {//«
	// https://tc39.github.io/ecma262/#sec-debugger-statement
		var node = this.createNode();
		this.expectKeyword('debugger');
		this.consumeSemicolon();
		return this.finalize(node, new Node.DebuggerStatement());
	};//»
//»
//«Template

	parseTemplateHead() {//«
	// https://tc39.github.io/ecma262/#sec-template-literals
		assert(this.lookahead.head, 'Template literal must start with a template head');
		var node = this.createNode();
		var token = this.nextToken();
		var raw = token.value;
		var cooked = token.cooked;
		return this.finalize(node, new Node.TemplateElement({ raw: raw, cooked: cooked }, token.tail));
	};//»
	parseTemplateElement() {//«
		if (this.lookahead.type !== Template_Type) {
			this.throwUnexpectedToken();
		}
		var node = this.createNode();
		var token = this.nextToken();
		var raw = token.value;
		var cooked = token.cooked;
		return this.finalize(node, new Node.TemplateElement({ raw: raw, cooked: cooked }, token.tail));
	};//»
	parseTemplateLiteral() {//«
		var node = this.createNode();
		var expressions = [];
		var quasis = [];
		var quasi = this.parseTemplateHead();
		quasis.push(quasi);
		while (!quasi.tail) {
			expressions.push(this.parseExpression());
			quasi = this.parseTemplateElement();
			quasis.push(quasi);
		}
		return this.finalize(node, new Node.TemplateLiteral(quasis, expressions));
	};//»

//»
//Class«
	parseSuper() {//«
		var node = this.createNode();
		this.expectKeyword('super');
		if (!this.match('[') && !this.match('.')) {
			this.throwUnexpectedToken(this.lookahead);
		}
		return this.finalize(node, new Node.Super());
	};/*»*/
	parseClassDeclaration(identifierIsOptional) {//«
		var node = this.createNode();
		var previousStrict = this.context.strict;
		this.context.strict = true;
		this.expectKeyword('class');
		var id = (identifierIsOptional && (this.lookahead.type !== Identifier_Type)) ? null : this.parseVariableIdentifier();
		var superClass = null;
		if (this.matchKeyword('extends')) {
			this.nextToken();
			superClass = this.isolateCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
		}
		var classBody = this.parseClassBody();
		this.context.strict = previousStrict;
		return this.finalize(node, new Node.ClassDeclaration(id, superClass, classBody));
	};/*»*/
	parseClassElement(hasConstructor) {//«
	// https://tc39.github.io/ecma262/#sec-class-definitions
		var token = this.lookahead;
		var node = this.createNode();
		var kind = '';
		var key = null;
		var value = null;
		var computed = false;
		var method = false;
		var isStatic = false;
		var isAsync = false;
		if (this.match('*')) {
			this.nextToken();
		}
		else {
			computed = this.match('[');
			key = this.parseObjectPropertyKey();
			var id = key;
			if (id.name === 'static' && (this.qualifiedPropertyName(this.lookahead) || this.match('*'))) {
				token = this.lookahead;
				isStatic = true;
				computed = this.match('[');
				if (this.match('*')) {
					this.nextToken();
				}
				else {
					key = this.parseObjectPropertyKey();
				}
			}
			if ((token.type === Identifier_Type) && !this.hasLineTerminator && (token.value === 'async')) {
				var punctuator = this.lookahead.value;
				if (punctuator !== ':' && punctuator !== '(' && punctuator !== '*') {
					isAsync = true;
					token = this.lookahead;
					key = this.parseObjectPropertyKey();
					if (token.type === Identifier_Type && token.value === 'constructor') {
						this.tolerateUnexpectedToken(token, Messages.ConstructorIsAsync);
					}
				}
			}
		}
		var lookaheadPropertyKey = this.qualifiedPropertyName(this.lookahead);
		if (token.type === Identifier_Type) {
			if (token.value === 'get' && lookaheadPropertyKey) {
				kind = 'get';
				computed = this.match('[');
				key = this.parseObjectPropertyKey();
				this.context.allowYield = false;
				value = this.parseGetterMethod();
			}
			else if (token.value === 'set' && lookaheadPropertyKey) {
				kind = 'set';
				computed = this.match('[');
				key = this.parseObjectPropertyKey();
				value = this.parseSetterMethod();
			}
		}
		else if (token.type === Punctuator_Type && token.value === '*' && lookaheadPropertyKey) {
			kind = 'init';
			computed = this.match('[');
			key = this.parseObjectPropertyKey();
			value = this.parseGeneratorMethod();
			method = true;
		}
		if (!kind && key && this.match('(')) {
			kind = 'init';
			value = isAsync ? this.parsePropertyMethodAsyncFunction() : this.parsePropertyMethodFunction();
			method = true;
		}
		if (!kind) {
			this.throwUnexpectedToken(this.lookahead);
		}
		if (kind === 'init') {
			kind = 'method';
		}
		if (!computed) {
			if (isStatic && this.isPropertyKey(key, 'prototype')) {
				this.throwUnexpectedToken(token, Messages.StaticPrototype);
			}
			if (!isStatic && this.isPropertyKey(key, 'constructor')) {
				if (kind !== 'method' || !method || (value && value.generator)) {
					this.throwUnexpectedToken(token, Messages.ConstructorSpecialMethod);
				}
				if (hasConstructor.value) {
					this.throwUnexpectedToken(token, Messages.DuplicateConstructor);
				}
				else {
					hasConstructor.value = true;
				}
				kind = 'constructor';
			}
		}
		return this.finalize(node, new Node.MethodDefinition(key, computed, value, kind, isStatic));
	};/*»*/
	parseClassElementList() {//«
		var body = [];
		var hasConstructor = { value: false };
		this.expect('{');
		while (!this.match('}')) {
			if (this.match(';')) {
				this.nextToken();
			}
			else {
				body.push(this.parseClassElement(hasConstructor));
			}
		}
		this.expect('}');
		return body;
	};/*»*/
	parseClassBody() {//«
		var node = this.createNode();
		var elementList = this.parseClassElementList();
		return this.finalize(node, new Node.ClassBody(elementList));
	};/*»*/
	parseClassExpression() {//«
		var node = this.createNode();
		var previousStrict = this.context.strict;
		this.context.strict = true;
		this.expectKeyword('class');
		var id = (this.lookahead.type === Identifier_Type) ? this.parseVariableIdentifier() : null;
		var superClass = null;
		if (this.matchKeyword('extends')) {
			this.nextToken();
			superClass = this.isolateCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
		}
		var classBody = this.parseClassBody();
		this.context.strict = previousStrict;
		return this.finalize(node, new Node.ClassExpression(id, superClass, classBody));
	};/*»*/
//»
//Import/Export«

	parseExportDeclaration() {//«
		if (this.context.inFunctionBody) {
			this.throwError(Messages.IllegalExportDeclaration);
		}
		var node = this.createNode();
		this.expectKeyword('export');
		var exportDeclaration;
		if (this.matchKeyword('default')) {
			// export default ...
			this.nextToken();
			if (this.matchKeyword('function')) {
				// export default function foo () {}
				// export default function () {}
				var declaration = this.parseFunctionDeclaration(true);
				exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
			}
			else if (this.matchKeyword('class')) {
				// export default class foo {}
				var declaration = this.parseClassDeclaration(true);
				exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
			}
			else if (this.matchContextualKeyword('async')) {
				// export default async function f () {}
				// export default async function () {}
				// export default async x => x
				var declaration = this.matchAsyncFunction() ? this.parseFunctionDeclaration(true) : this.parseAssignmentExpression();
				exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
			}
			else {
				if (this.matchContextualKeyword('from')) {
					this.throwError(Messages.UnexpectedToken, this.lookahead.value);
				}
				// export default {};
				// export default [];
				// export default (1 + 2);
				var declaration = this.match('{') ? this.parseObjectInitializer() :
					this.match('[') ? this.parseArrayInitializer() : this.parseAssignmentExpression();
				this.consumeSemicolon();
				exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
			}
		}
		else if (this.match('*')) {
			// export * from 'foo';
			this.nextToken();
			if (!this.matchContextualKeyword('from')) {
				var message = this.lookahead.value ? Messages.UnexpectedToken : Messages.MissingFromClause;
				this.throwError(message, this.lookahead.value);
			}
			this.nextToken();
			var src = this.parseModuleSpecifier();
			this.consumeSemicolon();
			exportDeclaration = this.finalize(node, new Node.ExportAllDeclaration(src));
		}
		else if (this.lookahead.type === Keyword_Type) {
			// export var f = 1;
			var declaration = void 0;
			switch (this.lookahead.value) {
				case 'let':
				case 'const':
					declaration = this.parseLexicalDeclaration({ inFor: false });
					break;
				case 'var':
				case 'class':
				case 'function':
					declaration = this.parseStatementListItem();
					break;
				default:
					this.throwUnexpectedToken(this.lookahead);
			}
			exportDeclaration = this.finalize(node, new Node.ExportNamedDeclaration(declaration, [], null));
		}
		else if (this.matchAsyncFunction()) {
			var declaration = this.parseFunctionDeclaration();
			exportDeclaration = this.finalize(node, new Node.ExportNamedDeclaration(declaration, [], null));
		}
		else {
			var specifiers = [];
			var source = null;
			var isExportFromIdentifier = false;
			this.expect('{');
			while (!this.match('}')) {
				isExportFromIdentifier = isExportFromIdentifier || this.matchKeyword('default');
				specifiers.push(this.parseExportSpecifier());
				if (!this.match('}')) {
					this.expect(',');
				}
			}
			this.expect('}');
			if (this.matchContextualKeyword('from')) {
				// export {default} from 'foo';
				// export {foo} from 'foo';
				this.nextToken();
				source = this.parseModuleSpecifier();
				this.consumeSemicolon();
			}
			else if (isExportFromIdentifier) {
				// export {default}; // missing fromClause
				var message = this.lookahead.value ? Messages.UnexpectedToken : Messages.MissingFromClause;
				this.throwError(message, this.lookahead.value);
			}
			else {
				// export {foo};
				this.consumeSemicolon();
			}
			exportDeclaration = this.finalize(node, new Node.ExportNamedDeclaration(null, specifiers, source));
		}
		return exportDeclaration;
	};//»
	parseImportDeclaration() {//«
		if (this.context.inFunctionBody) {
			this.throwError(Messages.IllegalImportDeclaration);
		}
		var node = this.createNode();
		this.expectKeyword('import');
		var src;
		var specifiers = [];
		if (this.lookahead.type === StringLiteral_Type) {
			// import 'foo';
			src = this.parseModuleSpecifier();
		}
		else {
			if (this.match('{')) {
				// import {bar}
				specifiers = specifiers.concat(this.parseNamedImports());
			}
			else if (this.match('*')) {
				// import * as foo
				specifiers.push(this.parseImportNamespaceSpecifier());
			}
			else if (this.isIdentifierName(this.lookahead) && !this.matchKeyword('default')) {
				// import foo
				specifiers.push(this.parseImportDefaultSpecifier());
				if (this.match(',')) {
					this.nextToken();
					if (this.match('*')) {
						// import foo, * as foo
						specifiers.push(this.parseImportNamespaceSpecifier());
					}
					else if (this.match('{')) {
						// import foo, {bar}
						specifiers = specifiers.concat(this.parseNamedImports());
					}
					else {
						this.throwUnexpectedToken(this.lookahead);
					}
				}
			}
			else {
				this.throwUnexpectedToken(this.nextToken());
			}
			if (!this.matchContextualKeyword('from')) {
				var message = this.lookahead.value ? Messages.UnexpectedToken : Messages.MissingFromClause;
				this.throwError(message, this.lookahead.value);
			}
			this.nextToken();
			src = this.parseModuleSpecifier();
		}
		this.consumeSemicolon();
		return this.finalize(node, new Node.ImportDeclaration(specifiers, src));
	};//»
	parseModuleSpecifier() {//«
	// https://tc39.github.io/ecma262/#sec-imports
		var node = this.createNode();
		if (this.lookahead.type !== StringLiteral_Type) {
			this.throwError(Messages.InvalidModuleSpecifier);
		}
		var token = this.nextToken();
		var raw = this.getTokenRaw(token);
		return this.finalize(node, new Node.Literal(token.value, raw));
	};//»
	parseImportSpecifier() {//«
	// import {<foo as bar>} ...;
		var node = this.createNode();
		var imported;
		var local;
		if (this.lookahead.type === Identifier_Type) {
			imported = this.parseVariableIdentifier();
			local = imported;
			if (this.matchContextualKeyword('as')) {
				this.nextToken();
				local = this.parseVariableIdentifier();
			}
		}
		else {
			imported = this.parseIdentifierName();
			local = imported;
			if (this.matchContextualKeyword('as')) {
				this.nextToken();
				local = this.parseVariableIdentifier();
			}
			else {
				this.throwUnexpectedToken(this.nextToken());
			}
		}
		return this.finalize(node, new Node.ImportSpecifier(local, imported));
	};//»
	parseNamedImports() {//«
	// {foo, bar as bas}
		this.expect('{');
		var specifiers = [];
		while (!this.match('}')) {
			specifiers.push(this.parseImportSpecifier());
			if (!this.match('}')) {
				this.expect(',');
			}
		}
		this.expect('}');
		return specifiers;
	};//»
	parseImportDefaultSpecifier() {//«
	// import <foo> ...;
		var node = this.createNode();
		var local = this.parseIdentifierName();
		return this.finalize(node, new Node.ImportDefaultSpecifier(local));
	};//»
	parseImportNamespaceSpecifier() {//«
	// import <* as foo> ...;
		var node = this.createNode();
		this.expect('*');
		if (!this.matchContextualKeyword('as')) {
			this.throwError(Messages.NoAsAfterImportNamespace);
		}
		this.nextToken();
		var local = this.parseIdentifierName();
		return this.finalize(node, new Node.ImportNamespaceSpecifier(local));
	};//»
	parseExportSpecifier() {//«
	// https://tc39.github.io/ecma262/#sec-exports
		var node = this.createNode();
		var local = this.parseIdentifierName();
		var exported = local;
		if (this.matchContextualKeyword('as')) {
			this.nextToken();
			exported = this.parseIdentifierName();
		}
		return this.finalize(node, new Node.ExportSpecifier(local, exported));
	};//»

//»
//«Binding/Var

	parsePattern(params, kind) {//«
		var pattern;
		if (this.match('[')) {
			pattern = this.parseArrayPattern(params, kind);
		}
		else if (this.match('{')) {
			pattern = this.parseObjectPattern(params, kind);
		}
		else {
			if (this.matchKeyword('let') && (kind === 'const' || kind === 'let')) {
				this.tolerateUnexpectedToken(this.lookahead, Messages.LetInLexicalBinding);
			}
			params.push(this.lookahead);
			pattern = this.parseVariableIdentifier(kind);
		}
		return pattern;
	};//»
	parsePatternWithDefault(params, kind) {//«
		var startToken = this.lookahead;
		var pattern = this.parsePattern(params, kind);
		if (this.match('=')) {
			this.nextToken();
			var previousAllowYield = this.context.allowYield;
			this.context.allowYield = true;
			var right = this.isolateCoverGrammar(this.parseAssignmentExpression);
			this.context.allowYield = previousAllowYield;
			pattern = this.finalize(this.startNode(startToken), new Node.AssignmentPattern(pattern, right));
		}
		return pattern;
	};//»
	parseRestElement(params) {//«
		var node = this.createNode();
		this.expect('...');
		var arg = this.parsePattern(params);
		if (this.match('=')) {
			this.throwError(Messages.DefaultRestParameter);
		}
		if (!this.match(')')) {
			this.throwError(Messages.ParameterAfterRestParameter);
		}
		return this.finalize(node, new Node.RestElement(arg));
	};//»
	parseIdentifierName() {//«
		var node = this.createNode();
		var token = this.nextToken();
		if (!this.isIdentifierName(token)) {
			this.throwUnexpectedToken(token);
		}
		return this.finalize(node, new Node.Identifier(token.value));
	};//»
	parseVariableIdentifier(kind) {//«
	// https://tc39.github.io/ecma262/#sec-variable-statement
		var node = this.createNode();
		var token = this.nextToken();
		if (token.type === Keyword_Type && token.value === 'yield') {
			if (this.context.strict) {
				this.tolerateUnexpectedToken(token, Messages.StrictReservedWord);
			}
			else if (!this.context.allowYield) {
				this.throwUnexpectedToken(token);
			}
		}
		else if (token.type !== Identifier_Type) {
			if (this.context.strict && token.type === Keyword_Type && this.scanner.isStrictModeReservedWord(token.value)) {
				this.tolerateUnexpectedToken(token, Messages.StrictReservedWord);
			}
			else {
				if (this.context.strict || token.value !== 'let' || kind !== 'var') {
					this.throwUnexpectedToken(token);
				}
			}
		}
		else if ((this.context.isModule || this.context.await) && token.type === Identifier_Type && token.value === 'await') {
			this.tolerateUnexpectedToken(token);
		}
		return this.finalize(node, new Node.Identifier(token.value));
	};//»
	parseVariableDeclaration(options) {//«
		var node = this.createNode();
		var params = [];
		var id = this.parsePattern(params, 'var');
		if (this.context.strict && id.type === Syntax.Identifier) {
			if (this.scanner.isRestrictedWord(id.name)) {
				this.tolerateError(Messages.StrictVarName);
			}
		}
		var init = null;
		if (this.match('=')) {
			this.nextToken();
			init = this.isolateCoverGrammar(this.parseAssignmentExpression);
		}
		else if (id.type !== Syntax.Identifier && !options.inFor) {
			this.expect('=');
		}
		return this.finalize(node, new Node.VariableDeclarator(id, init));
	};//»
	parseVariableDeclarationList(options) {//«
		var opt = { inFor: options.inFor };
		var list = [];
		list.push(this.parseVariableDeclaration(opt));
		while (this.match(',')) {
			this.nextToken();
			list.push(this.parseVariableDeclaration(opt));
		}
		return list;
	};//»
	parseVariableStatement() {//«
		var node = this.createNode();
		this.expectKeyword('var');
		var declarations = this.parseVariableDeclarationList({ inFor: false });
		this.consumeSemicolon();
		return this.finalize(node, new Node.VariableDeclaration(declarations, 'var'));
	};//»
	parseLexicalDeclaration(options) {//«
		var node = this.createNode();
		var kind = this.nextToken().value;
		assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');
		var declarations = this.parseBindingList(kind, options);
		this.consumeSemicolon();
		return this.finalize(node, new Node.VariableDeclaration(declarations, kind));
	};//»
	parseLexicalBinding(kind, options) {//«
	// https://tc39.github.io/ecma262/#sec-let-and-const-declarations
		var node = this.createNode();
		var params = [];
		var id = this.parsePattern(params, kind);
		if (this.context.strict && id.type === Syntax.Identifier) {
			if (this.scanner.isRestrictedWord(id.name)) {
				this.tolerateError(Messages.StrictVarName);
			}
		}
		var init = null;
		if (kind === 'const') {
			if (!this.matchKeyword('in') && !this.matchContextualKeyword('of')) {
				if (this.match('=')) {
					this.nextToken();
					init = this.isolateCoverGrammar(this.parseAssignmentExpression);
				}
				else {
					this.throwError(Messages.DeclarationMissingInitializer, 'const');
				}
			}
		}
		else if ((!options.inFor && id.type !== Syntax.Identifier) || this.match('=')) {
			this.expect('=');
			init = this.isolateCoverGrammar(this.parseAssignmentExpression);
		}
		return this.finalize(node, new Node.VariableDeclarator(id, init));
	};//»
	parseBindingList(kind, options) {//«
		var list = [this.parseLexicalBinding(kind, options)];
		while (this.match(',')) {
			this.nextToken();
			list.push(this.parseLexicalBinding(kind, options));
		}
		return list;
	};//»
	parseBindingRestElement(params, kind) {//«
	// https://tc39.github.io/ecma262/#sec-destructuring-binding-patterns
		var node = this.createNode();
		this.expect('...');
		var arg = this.parsePattern(params, kind);
		return this.finalize(node, new Node.RestElement(arg));
	};//»

//»
//«Function/Method

	parseGeneratorMethod() {//«
		var node = this.createNode();
		var isGenerator = true;
		var previousAllowYield = this.context.allowYield;
		this.context.allowYield = true;
		var params = this.parseFormalParameters();
		this.context.allowYield = false;
		var method = this.parsePropertyMethod(params);
		this.context.allowYield = previousAllowYield;
		return this.finalize(node, new Node.FunctionExpression(null, params.params, method, isGenerator));
	};//»
	parseGetterMethod() {//«
		var node = this.createNode();
		var isGenerator = false;
		var previousAllowYield = this.context.allowYield;
		this.context.allowYield = !isGenerator;
		var formalParameters = this.parseFormalParameters();
		if (formalParameters.params.length > 0) {
			this.tolerateError(Messages.BadGetterArity);
		}
		var method = this.parsePropertyMethod(formalParameters);
		this.context.allowYield = previousAllowYield;
		return this.finalize(node, new Node.FunctionExpression(null, formalParameters.params, method, isGenerator));
	};//»
	parseSetterMethod() {//«
		var node = this.createNode();
		var isGenerator = false;
		var previousAllowYield = this.context.allowYield;
		this.context.allowYield = !isGenerator;
		var formalParameters = this.parseFormalParameters();
		if (formalParameters.params.length !== 1) {
			this.tolerateError(Messages.BadSetterArity);
		}
		else if (formalParameters.params[0] instanceof Node.RestElement) {
			this.tolerateError(Messages.BadSetterRestParameter);
		}
		var method = this.parsePropertyMethod(formalParameters);
		this.context.allowYield = previousAllowYield;
		return this.finalize(node, new Node.FunctionExpression(null, formalParameters.params, method, isGenerator));
	};//»
	parseFunctionDeclaration(identifierIsOptional) {//«
		var node = this.createNode();
		var isAsync = this.matchContextualKeyword('async');
		if (isAsync) {
			this.nextToken();
		}
		this.expectKeyword('function');
		var isGenerator = isAsync ? false : this.match('*');
		if (isGenerator) {
			this.nextToken();
		}
		var message;
		var id = null;
		var firstRestricted = null;
		if (!identifierIsOptional || !this.match('(')) {
			var token = this.lookahead;
			id = this.parseVariableIdentifier();
			if (this.context.strict) {
				if (this.scanner.isRestrictedWord(token.value)) {
					this.tolerateUnexpectedToken(token, Messages.StrictFunctionName);
				}
			}
			else {
				if (this.scanner.isRestrictedWord(token.value)) {
					firstRestricted = token;
					message = Messages.StrictFunctionName;
				}
				else if (this.scanner.isStrictModeReservedWord(token.value)) {
					firstRestricted = token;
					message = Messages.StrictReservedWord;
				}
			}
		}
		var previousAllowAwait = this.context.await;
		var previousAllowYield = this.context.allowYield;
		this.context.await = isAsync;
		this.context.allowYield = !isGenerator;
		var formalParameters = this.parseFormalParameters(firstRestricted);
		var params = formalParameters.params;
		var stricted = formalParameters.stricted;
		firstRestricted = formalParameters.firstRestricted;
		if (formalParameters.message) {
			message = formalParameters.message;
		}
		var previousStrict = this.context.strict;
		var previousAllowStrictDirective = this.context.allowStrictDirective;
		this.context.allowStrictDirective = formalParameters.simple;
		var body = this.parseFunctionSourceElements();
		if (this.context.strict && firstRestricted) {
			this.throwUnexpectedToken(firstRestricted, message);
		}
		if (this.context.strict && stricted) {
			this.tolerateUnexpectedToken(stricted, message);
		}
		this.context.strict = previousStrict;
		this.context.allowStrictDirective = previousAllowStrictDirective;
		this.context.await = previousAllowAwait;
		this.context.allowYield = previousAllowYield;
		return isAsync ? this.finalize(node, new Node.AsyncFunctionDeclaration(id, params, body)) :
			this.finalize(node, new Node.FunctionDeclaration(id, params, body, isGenerator));
	};//»
	parseFunctionExpression() {//«
		var node = this.createNode();
		var isAsync = this.matchContextualKeyword('async');
		if (isAsync) {
			this.nextToken();
		}
		this.expectKeyword('function');
		var isGenerator = isAsync ? false : this.match('*');
		if (isGenerator) {
			this.nextToken();
		}
		var message;
		var id = null;
		var firstRestricted;/*«*/
		var previousAllowAwait = this.context.await;
		var previousAllowYield = this.context.allowYield;
		this.context.await = isAsync;
		this.context.allowYield = !isGenerator;/*»*/
		if (!this.match('(')) {//«
			var token = this.lookahead;
			id = (!this.context.strict && !isGenerator && this.matchKeyword('yield')) ? this.parseIdentifierName() : this.parseVariableIdentifier();
			if (this.context.strict) {
				if (this.scanner.isRestrictedWord(token.value)) {
					this.tolerateUnexpectedToken(token, Messages.StrictFunctionName);
				}
			}
			else {
				if (this.scanner.isRestrictedWord(token.value)) {
					firstRestricted = token;
					message = Messages.StrictFunctionName;
				}
				else if (this.scanner.isStrictModeReservedWord(token.value)) {
					firstRestricted = token;
					message = Messages.StrictReservedWord;
				}
			}
		}//»
		var formalParameters = this.parseFormalParameters(firstRestricted);
		var params = formalParameters.params;
		var stricted = formalParameters.stricted;/*«*/
		firstRestricted = formalParameters.firstRestricted;
		if (formalParameters.message) {
			message = formalParameters.message;
		}
		var previousStrict = this.context.strict;
		var previousAllowStrictDirective = this.context.allowStrictDirective;
		this.context.allowStrictDirective = formalParameters.simple;/*»*/
		var body = this.parseFunctionSourceElements();
		if (this.context.strict && firstRestricted) {/*«*/
			this.throwUnexpectedToken(firstRestricted, message);
		}
		if (this.context.strict && stricted) {
			this.tolerateUnexpectedToken(stricted, message);
		}/*»*/
		this.context.strict = previousStrict;/*«*/
		this.context.allowStrictDirective = previousAllowStrictDirective;
		this.context.await = previousAllowAwait;
		this.context.allowYield = previousAllowYield;/*»*/
		return isAsync ? this.finalize(node, new Node.AsyncFunctionExpression(id, params, body)) :
			this.finalize(node, new Node.FunctionExpression(id, params, body, isGenerator));
	};//»
	parseFormalParameter(options) {//«
		var params = [];
		var param = this.match('...') ? this.parseRestElement(params) : this.parsePatternWithDefault(params);
		for (var i = 0; i < params.length; i++) {
			this.validateParam(options, params[i], params[i].value);
		}
		options.simple = options.simple && (param instanceof Node.Identifier);
		options.params.push(param);
	};//»
	parseFormalParameters(firstRestricted) {//«
		var options;
		options = {
			simple: true,
			params: [],
			firstRestricted: firstRestricted
		};
		this.expect('(');
		if (!this.match(')')) {
			options.paramSet = {};
			while (this.lookahead.type !== EOF_Type) {
				this.parseFormalParameter(options);
				if (this.match(')')) {
					break;
				}
				this.expect(',');
				if (this.match(')')) {
					break;
				}
			}
		}
		this.expect(')');
		return {
			simple: options.simple,
			params: options.params,
			stricted: options.stricted,
			firstRestricted: options.firstRestricted,
			message: options.message
		};
	};//»
	parseFunctionSourceElements() {//«
	// https://tc39.github.io/ecma262/#sec-function-definitions
		var node = this.createNode();
		this.expect('{');
		var body = this.parseDirectivePrologues();
		var previousLabelSet = this.context.labelSet;
		var previousInIteration = this.context.inIteration;
		var previousInSwitch = this.context.inSwitch;
		var previousInFunctionBody = this.context.inFunctionBody;
		this.context.labelSet = {};
		this.context.inIteration = false;
		this.context.inSwitch = false;
		this.context.inFunctionBody = true;
		while (this.lookahead.type !== EOF_Type) {
			if (this.match('}')) {
				break;
			}
			body.push(this.parseStatementListItem());
		}
		this.expect('}');
		this.context.labelSet = previousLabelSet;
		this.context.inIteration = previousInIteration;
		this.context.inSwitch = previousInSwitch;
		this.context.inFunctionBody = previousInFunctionBody;
		return this.finalize(node, new Node.BlockStatement(body));
	};//»

//»
//«Control Flow
	parseForStatement() {//«
	// https://tc39.github.io/ecma262/#sec-for-statement
	// https://tc39.github.io/ecma262/#sec-for-in-and-for-of-statements
		var init = null;
		var test = null;
		var update = null;
		var forIn = true;
		var left, right;
		var node = this.createNode();
		this.expectKeyword('for');
//UOWEHDK
if (this.matchContextualKeyword("await")){
this.nextToken();
}
		this.expect('(');
		if (this.match(';')) {/*«*/
			this.nextToken();
		}/*»*/
		else {/*«*/
			if (this.matchKeyword('var')) {/*«*/
				init = this.createNode();
				this.nextToken();
				var previousAllowIn = this.context.allowIn;
				this.context.allowIn = false;
				var declarations = this.parseVariableDeclarationList({ inFor: true });
				this.context.allowIn = previousAllowIn;
				if (declarations.length === 1 && this.matchKeyword('in')) {/*«*/
					var decl = declarations[0];
					if (decl.init && (decl.id.type === Syntax.ArrayPattern || decl.id.type === Syntax.ObjectPattern || this.context.strict)) {
						this.tolerateError(Messages.ForInOfLoopInitializer, 'for-in');
					}
					init = this.finalize(init, new Node.VariableDeclaration(declarations, 'var'));
					this.nextToken();
					left = init;
					right = this.parseExpression();
					init = null;
				}/*»*/
				else if (declarations.length === 1 && declarations[0].init === null && this.matchContextualKeyword('of')) {/*«*/
					init = this.finalize(init, new Node.VariableDeclaration(declarations, 'var'));
					this.nextToken();
					left = init;
					right = this.parseAssignmentExpression();
					init = null;
					forIn = false;
				}/*»*/
				else {/*«*/
					init = this.finalize(init, new Node.VariableDeclaration(declarations, 'var'));
					this.expect(';');
				}/*»*/
			}/*»*/
			else if (this.matchKeyword('const') || this.matchKeyword('let')) {/*«*/
				init = this.createNode();
				var kind = this.nextToken().value;
				if (!this.context.strict && this.lookahead.value === 'in') {/*«*/
					init = this.finalize(init, new Node.Identifier(kind));
					this.nextToken();
					left = init;
					right = this.parseExpression();
					init = null;
				}/*»*/
				else {/*«*/
					var previousAllowIn = this.context.allowIn;
					this.context.allowIn = false;
					var declarations = this.parseBindingList(kind, { inFor: true });
					this.context.allowIn = previousAllowIn;
					if (declarations.length === 1 && declarations[0].init === null && this.matchKeyword('in')) {/*«*/
						init = this.finalize(init, new Node.VariableDeclaration(declarations, kind));
						this.nextToken();
						left = init;
						right = this.parseExpression();
						init = null;
					}/*»*/
					else if (declarations.length === 1 && declarations[0].init === null && this.matchContextualKeyword('of')) {/*«*/
						init = this.finalize(init, new Node.VariableDeclaration(declarations, kind));
						this.nextToken();
						left = init;
						right = this.parseAssignmentExpression();
						init = null;
						forIn = false;
					}/*»*/
					else {/*«*/
						this.consumeSemicolon();
						init = this.finalize(init, new Node.VariableDeclaration(declarations, kind));
					}/*»*/
				}/*»*/
			}/*»*/
			else {/*«*/
				var initStartToken = this.lookahead;
				var previousAllowIn = this.context.allowIn;
				this.context.allowIn = false;
				init = this.inheritCoverGrammar(this.parseAssignmentExpression);
				this.context.allowIn = previousAllowIn;
				if (this.matchKeyword('in')) {/*«*/
					if (!this.context.isAssignmentTarget || init.type === Syntax.AssignmentExpression) {
						this.tolerateError(Messages.InvalidLHSInForIn);
					}
					this.nextToken();
					this.reinterpretExpressionAsPattern(init);
					left = init;
					right = this.parseExpression();
					init = null;
				}/*»*/
				else if (this.matchContextualKeyword('of')) {/*«*/
					if (!this.context.isAssignmentTarget || init.type === Syntax.AssignmentExpression) {
						this.tolerateError(Messages.InvalidLHSInForLoop);
					}
					this.nextToken();
					this.reinterpretExpressionAsPattern(init);
					left = init;
					right = this.parseAssignmentExpression();
					init = null;
					forIn = false;
				}/*»*/
				else {/*«*/
					if (this.match(',')) {
						var initSeq = [init];
						while (this.match(',')) {
							this.nextToken();
							initSeq.push(this.isolateCoverGrammar(this.parseAssignmentExpression));
						}
						init = this.finalize(this.startNode(initStartToken), new Node.SequenceExpression(initSeq));
					}
					this.expect(';');
				}/*»*/
			}/*»*/
		}//»
		if (typeof left === 'undefined') {/*«*/
			if (!this.match(';')) {
				test = this.parseExpression();
			}
			this.expect(';');
			if (!this.match(')')) {
				update = this.parseExpression();
			}
		}/*»*/
		var body;
		if (!this.match(')') && this.config.tolerant) {/*«*/
			this.tolerateUnexpectedToken(this.nextToken());
			body = this.finalize(this.createNode(), new Node.EmptyStatement());
		}/*»*/
		else {/*«*/
			this.expect(')');
			var previousInIteration = this.context.inIteration;
			this.context.inIteration = true;
			body = this.isolateCoverGrammar(this.parseStatement);
			this.context.inIteration = previousInIteration;
		}/*»*/
		return (typeof left === 'undefined') ?
			this.finalize(node, new Node.ForStatement(init, test, update, body)) :
			forIn ? this.finalize(node, new Node.ForInStatement(left, right, body)) :
				this.finalize(node, new Node.ForOfStatement(left, right, body));
	};//»
	parseIfClause() {//«
	// https://tc39.github.io/ecma262/#sec-if-statement
		if (this.context.strict && this.matchKeyword('function')) {
			this.tolerateError(Messages.StrictFunction);
		}
		return this.parseStatement();
	};//»
	parseIfStatement() {//«
		var node = this.createNode();
		var consequent;
		var alternate = null;
		this.expectKeyword('if');
		this.expect('(');
		var test = this.parseExpression();
		if (!this.match(')') && this.config.tolerant) {
			this.tolerateUnexpectedToken(this.nextToken());
			consequent = this.finalize(this.createNode(), new Node.EmptyStatement());
		}
		else {
			this.expect(')');
			consequent = this.parseIfClause();
			if (this.matchKeyword('else')) {
				this.nextToken();
				alternate = this.parseIfClause();
			}
		}
		return this.finalize(node, new Node.IfStatement(test, consequent, alternate));
	};//»
	parseDoWhileStatement() {//«
	// https://tc39.github.io/ecma262/#sec-do-while-statement
		var node = this.createNode();
		this.expectKeyword('do');
		var previousInIteration = this.context.inIteration;
		this.context.inIteration = true;
		var body = this.parseStatement();
		this.context.inIteration = previousInIteration;
		this.expectKeyword('while');
		this.expect('(');
		var test = this.parseExpression();
		if (!this.match(')') && this.config.tolerant) {
			this.tolerateUnexpectedToken(this.nextToken());
		}
		else {
			this.expect(')');
			if (this.match(';')) {
				this.nextToken();
			}
		}
		return this.finalize(node, new Node.DoWhileStatement(body, test));
	};//»
	parseWhileStatement() {//«
	// https://tc39.github.io/ecma262/#sec-while-statement
		var node = this.createNode();
		var body;
		this.expectKeyword('while');
		this.expect('(');
		var test = this.parseExpression();
		if (!this.match(')') && this.config.tolerant) {
			this.tolerateUnexpectedToken(this.nextToken());
			body = this.finalize(this.createNode(), new Node.EmptyStatement());
		}
		else {
			this.expect(')');
			var previousInIteration = this.context.inIteration;
			this.context.inIteration = true;
			body = this.parseStatement();
			this.context.inIteration = previousInIteration;
		}
		return this.finalize(node, new Node.WhileStatement(test, body));
	};//»
	parseContinueStatement() {//«
	// https://tc39.github.io/ecma262/#sec-continue-statement
		var node = this.createNode();
		this.expectKeyword('continue');
		var label = null;
		if (this.lookahead.type === Identifier_Type && !this.hasLineTerminator) {
			var id = this.parseVariableIdentifier();
			label = id;
			var key = '$' + id.name;
			if (!Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
				this.throwError(Messages.UnknownLabel, id.name);
			}
		}
		this.consumeSemicolon();
		if (label === null && !this.context.inIteration) {
			this.throwError(Messages.IllegalContinue);
		}
		return this.finalize(node, new Node.ContinueStatement(label));
	};//»
	parseBreakStatement() {//«
	// https://tc39.github.io/ecma262/#sec-break-statement
		var node = this.createNode();
		this.expectKeyword('break');
		var label = null;
		if (this.lookahead.type === Identifier_Type && !this.hasLineTerminator) {
			var id = this.parseVariableIdentifier();
			var key = '$' + id.name;
			if (!Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
				this.throwError(Messages.UnknownLabel, id.name);
			}
			label = id;
		}
		this.consumeSemicolon();
		if (label === null && !this.context.inIteration && !this.context.inSwitch) {
			this.throwError(Messages.IllegalBreak);
		}
		return this.finalize(node, new Node.BreakStatement(label));
	};//»
	parseReturnStatement() {//«
	// https://tc39.github.io/ecma262/#sec-return-statement
		if (!this.context.inFunctionBody) {
			this.tolerateError(Messages.IllegalReturn);
		}
		var node = this.createNode();
		this.expectKeyword('return');
		var hasArgument = (!this.match(';') && !this.match('}') &&
			!this.hasLineTerminator && this.lookahead.type !== EOF_Type) ||
			this.lookahead.type === StringLiteral_Type ||
			this.lookahead.type === Template_Type;
		var argument = hasArgument ? this.parseExpression() : null;
		this.consumeSemicolon();
		return this.finalize(node, new Node.ReturnStatement(argument));
	};//»
	parseWithStatement() {//«
	// https://tc39.github.io/ecma262/#sec-with-statement
		if (this.context.strict) {
			this.tolerateError(Messages.StrictModeWith);
		}
		var node = this.createNode();
		var body;
		this.expectKeyword('with');
		this.expect('(');
		var object = this.parseExpression();
		if (!this.match(')') && this.config.tolerant) {
			this.tolerateUnexpectedToken(this.nextToken());
			body = this.finalize(this.createNode(), new Node.EmptyStatement());
		}
		else {
			this.expect(')');
			body = this.parseStatement();
		}
		return this.finalize(node, new Node.WithStatement(object, body));
	};//»
	parseSwitchCase() {//«
	// https://tc39.github.io/ecma262/#sec-switch-statement
		var node = this.createNode();
		var test;
		if (this.matchKeyword('default')) {
			this.nextToken();
			test = null;
		}
		else {
			this.expectKeyword('case');
			test = this.parseExpression();
		}
		this.expect(':');
		var consequent = [];
		while (true) {
			if (this.match('}') || this.matchKeyword('default') || this.matchKeyword('case')) {
				break;
			}
			consequent.push(this.parseStatementListItem());
		}
		return this.finalize(node, new Node.SwitchCase(test, consequent));
	};//»
	parseSwitchStatement() {//«
		var node = this.createNode();
		this.expectKeyword('switch');
		this.expect('(');
		var discriminant = this.parseExpression();
		this.expect(')');
		var previousInSwitch = this.context.inSwitch;
		this.context.inSwitch = true;
		var cases = [];
		var defaultFound = false;
		this.expect('{');
		while (true) {
			if (this.match('}')) {
				break;
			}
			var clause = this.parseSwitchCase();
			if (clause.test === null) {
				if (defaultFound) {
					this.throwError(Messages.MultipleDefaultsInSwitch);
				}
				defaultFound = true;
			}
			cases.push(clause);
		}
		this.expect('}');
		this.context.inSwitch = previousInSwitch;
		return this.finalize(node, new Node.SwitchStatement(discriminant, cases));
	};//»
	parseLabelledStatement() {//«
	// https://tc39.github.io/ecma262/#sec-labelled-statements
		var node = this.createNode();
		var expr = this.parseExpression();
		var statement;
		if ((expr.type === Syntax.Identifier) && this.match(':')) {
			this.nextToken();
			var id = expr;
			var key = '$' + id.name;
			if (Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
				this.throwError(Messages.Redeclaration, 'Label', id.name);
			}
			this.context.labelSet[key] = true;
			var body = void 0;
			if (this.matchKeyword('class')) {
				this.tolerateUnexpectedToken(this.lookahead);
				body = this.parseClassDeclaration();
			}
			else if (this.matchKeyword('function')) {
				var token = this.lookahead;
				var declaration = this.parseFunctionDeclaration();
				if (this.context.strict) {
					this.tolerateUnexpectedToken(token, Messages.StrictFunction);
				}
				else if (declaration.generator) {
					this.tolerateUnexpectedToken(token, Messages.GeneratorInLegacyContext);
				}
				body = declaration;
			}
			else {
				body = this.parseStatement();
			}
			delete this.context.labelSet[key];
			statement = new Node.LabeledStatement(id, body);
		}
		else {
			this.consumeSemicolon();
			statement = new Node.ExpressionStatement(expr);
		}
		return this.finalize(node, statement);
	};//»
//»
//«Array/Object
	parseArrayPattern(params, kind) {//«
		var node = this.createNode();
		this.expect('[');
		var elements = [];
		while (!this.match(']')) {//«
			if (this.match(',')) {
				this.nextToken();
				elements.push(null);
			}
			else {
				if (this.match('...')) {
					elements.push(this.parseBindingRestElement(params, kind));
					break;
				}
				else {
					elements.push(this.parsePatternWithDefault(params, kind));
				}
				if (!this.match(']')) {
					this.expect(',');
				}
			}
		}//»
		this.expect(']');
		return this.finalize(node, new Node.ArrayPattern(elements));
	};//»
	parsePropertyPattern(params, kind) {//«
		var node = this.createNode();
		var computed = false;
		var shorthand = false;
		var method = false;
		var key;
		var value;
		if (this.lookahead.type === Identifier_Type) {
			var keyToken = this.lookahead;
			key = this.parseVariableIdentifier();
			var init = this.finalize(node, new Node.Identifier(keyToken.value));
			if (this.match('=')) {
				params.push(keyToken);
				shorthand = true;
				this.nextToken();
				var expr = this.parseAssignmentExpression();
				value = this.finalize(this.startNode(keyToken), new Node.AssignmentPattern(init, expr));
			}
			else if (!this.match(':')) {
				params.push(keyToken);
				shorthand = true;
				value = init;
			}
			else {
				this.expect(':');
				value = this.parsePatternWithDefault(params, kind);
			}
		}
		else {
			computed = this.match('[');
			key = this.parseObjectPropertyKey();
			this.expect(':');
			value = this.parsePatternWithDefault(params, kind);
		}
		return this.finalize(node, new Node.Property('init', key, computed, value, method, shorthand));
	};//»
	parseObjectPattern(params, kind) {//«
		var node = this.createNode();
		var properties = [];
		this.expect('{');
		while (!this.match('}')) {
			properties.push(this.parsePropertyPattern(params, kind));
			if (!this.match('}')) {
				this.expect(',');
			}
		}
		this.expect('}');
		return this.finalize(node, new Node.ObjectPattern(properties));
	};//»
	parseSpreadElement() {//«
	// https://tc39.github.io/ecma262/#sec-array-initializer
		var node = this.createNode();
		this.expect('...');
		var arg = this.inheritCoverGrammar(this.parseAssignmentExpression);
		return this.finalize(node, new Node.SpreadElement(arg));
	};//»
	parseArrayInitializer() {//«
		var node = this.createNode();
		var elements = [];
		this.expect('[');
		while (!this.match(']')) {
			if (this.match(',')) {
				this.nextToken();
				elements.push(null);
			}
			else if (this.match('...')) {
				var element = this.parseSpreadElement();
				if (!this.match(']')) {
					this.context.isAssignmentTarget = false;
					this.context.isBindingElement = false;
					this.expect(',');
				}
				elements.push(element);
			}
			else {
				elements.push(this.inheritCoverGrammar(this.parseAssignmentExpression));
				if (!this.match(']')) {
					this.expect(',');
				}
			}
		}
		this.expect(']');
		return this.finalize(node, new Node.ArrayExpression(elements));
	};//»
	parsePropertyMethod(params) {//«
	// https://tc39.github.io/ecma262/#sec-object-initializer
		this.context.isAssignmentTarget = false;
		this.context.isBindingElement = false;
		var previousStrict = this.context.strict;
		var previousAllowStrictDirective = this.context.allowStrictDirective;
		this.context.allowStrictDirective = params.simple;
		var body = this.isolateCoverGrammar(this.parseFunctionSourceElements);
		if (this.context.strict && params.firstRestricted) {
			this.tolerateUnexpectedToken(params.firstRestricted, params.message);
		}
		if (this.context.strict && params.stricted) {
			this.tolerateUnexpectedToken(params.stricted, params.message);
		}
		this.context.strict = previousStrict;
		this.context.allowStrictDirective = previousAllowStrictDirective;
		return body;
	};//»
	parsePropertyMethodFunction() {//«
		var isGenerator = false;
		var node = this.createNode();
		var previousAllowYield = this.context.allowYield;
		this.context.allowYield = true;
		var params = this.parseFormalParameters();
		var method = this.parsePropertyMethod(params);
		this.context.allowYield = previousAllowYield;
		return this.finalize(node, new Node.FunctionExpression(null, params.params, method, isGenerator));
	};//»
	parsePropertyMethodAsyncFunction() {//«
		var node = this.createNode();
		var previousAllowYield = this.context.allowYield;
		var previousAwait = this.context.await;
		this.context.allowYield = false;
		this.context.await = true;
		var params = this.parseFormalParameters();
		var method = this.parsePropertyMethod(params);
		this.context.allowYield = previousAllowYield;
		this.context.await = previousAwait;
		return this.finalize(node, new Node.AsyncFunctionExpression(null, params.params, method));
	};//»
	parseObjectPropertyKey() {//«
		var node = this.createNode();
		var token = this.nextToken();
		var key;
		switch (token.type) {
			case StringLiteral_Type:
			case NumericLiteral_Type:
				if (this.context.strict && token.octal) {
					this.tolerateUnexpectedToken(token, Messages.StrictOctalLiteral);
				}
				var raw = this.getTokenRaw(token);
				key = this.finalize(node, new Node.Literal(token.value, raw));
				break;
			case Identifier_Type:
			case BooleanLiteral_Type:
			case NullLiteral_Type:
			case Keyword_Type:
				key = this.finalize(node, new Node.Identifier(token.value));
				break;
			case Punctuator_Type:
				if (token.value === '[') {
					key = this.isolateCoverGrammar(this.parseAssignmentExpression);
					this.expect(']');
				}
				else {
					key = this.throwUnexpectedToken(token);
				}
				break;
			default:
				key = this.throwUnexpectedToken(token);
		}
		return key;
	};//»
	parseObjectProperty(hasProto) {//«
		var node = this.createNode();
		var token = this.lookahead;
		var kind;
		var key = null;
		var value = null;
		var computed = false;
		var method = false;
		var shorthand = false;
		var isAsync = false;
		if (token.type === Identifier_Type) {
			var id = token.value;
			this.nextToken();
			computed = this.match('[');
			isAsync = !this.hasLineTerminator && (id === 'async') &&
				!this.match(':') && !this.match('(') && !this.match('*') && !this.match(',');
			key = isAsync ? this.parseObjectPropertyKey() : this.finalize(node, new Node.Identifier(id));
		}
		else if (this.match('*')) {
			this.nextToken();
		}
		else {
			computed = this.match('[');
			key = this.parseObjectPropertyKey();
		}
		var lookaheadPropertyKey = this.qualifiedPropertyName(this.lookahead);
		if (token.type === Identifier_Type && !isAsync && token.value === 'get' && lookaheadPropertyKey) {
			kind = 'get';
			computed = this.match('[');
			key = this.parseObjectPropertyKey();
			this.context.allowYield = false;
			value = this.parseGetterMethod();
		}
		else if (token.type === Identifier_Type && !isAsync && token.value === 'set' && lookaheadPropertyKey) {
			kind = 'set';
			computed = this.match('[');
			key = this.parseObjectPropertyKey();
			value = this.parseSetterMethod();
		}
		else if (token.type === Punctuator_Type && token.value === '*' && lookaheadPropertyKey) {
			kind = 'init';
			computed = this.match('[');
			key = this.parseObjectPropertyKey();
			value = this.parseGeneratorMethod();
			method = true;
		}
		else {
			if (!key) {
				this.throwUnexpectedToken(this.lookahead);
			}
			kind = 'init';
			if (this.match(':') && !isAsync) {
				if (!computed && this.isPropertyKey(key, '__proto__')) {
					if (hasProto.value) {
						this.tolerateError(Messages.DuplicateProtoProperty);
					}
					hasProto.value = true;
				}
				this.nextToken();
				value = this.inheritCoverGrammar(this.parseAssignmentExpression);
			}
			else if (this.match('(')) {
				value = isAsync ? this.parsePropertyMethodAsyncFunction() : this.parsePropertyMethodFunction();
				method = true;
			}
			else if (token.type === Identifier_Type) {
				var id = this.finalize(node, new Node.Identifier(token.value));
				if (this.match('=')) {
					this.context.firstCoverInitializedNameError = this.lookahead;
					this.nextToken();
					shorthand = true;
					var init = this.isolateCoverGrammar(this.parseAssignmentExpression);
					value = this.finalize(node, new Node.AssignmentPattern(id, init));
				}
				else {
					shorthand = true;
					value = id;
				}
			}
			else {
				this.throwUnexpectedToken(this.nextToken());
			}
		}
		return this.finalize(node, new Node.Property(kind, key, computed, value, method, shorthand));
	};//»
	parseObjectInitializer() {//«
		var node = this.createNode();
		this.expect('{');
		var properties = [];
		var hasProto = { value: false };
		while (!this.match('}')) {
			properties.push(this.parseObjectProperty(hasProto));
			if (!this.match('}')) {
				this.expectCommaSeparator();
			}
		}
		this.expect('}');
		return this.finalize(node, new Node.ObjectExpression(properties));
	};//»
//»
//«Argument
	parseAsyncArgument() {//«
		var arg = this.parseAssignmentExpression();
		this.context.firstCoverInitializedNameError = null;
		return arg;
	};//»
	parseAsyncArguments() {//«
		this.expect('(');
		var args = [];
		if (!this.match(')')) {
			while (true) {
				var expr = this.match('...') ? this.parseSpreadElement() :
					this.isolateCoverGrammar(this.parseAsyncArgument);
				args.push(expr);
				if (this.match(')')) {
					break;
				}
				this.expectCommaSeparator();
				if (this.match(')')) {
					break;
				}
			}
		}
		this.expect(')');
		return args;
	};//»
	parseArguments() {//«
	// https://tc39.github.io/ecma262/#sec-left-hand-side-expressions
		this.expect('(');
		var args = [];
		if (!this.match(')')) {
			while (true) {
				var expr = this.match('...') ? this.parseSpreadElement() :
					this.isolateCoverGrammar(this.parseAssignmentExpression);
				args.push(expr);
				if (this.match(')')) {
					break;
				}
				this.expectCommaSeparator();
				if (this.match(')')) {
					break;
				}
			}
		}
		this.expect(')');
		return args;
	};//»
//»
//«Expression

	parseAwaitExpression() {//«
	// https://tc39.github.io/ecma262/#sec-unary-operators
		var node = this.createNode();
		this.nextToken();
		var argument = this.parseUnaryExpression();
		return this.finalize(node, new Node.AwaitExpression(argument));
	};//»
	parseYieldExpression() {//«
		var node = this.createNode();
		this.expectKeyword('yield');
		var argument = null;
		var delegate = false;
		if (!this.hasLineTerminator) {
			var previousAllowYield = this.context.allowYield;
			this.context.allowYield = false;
			delegate = this.match('*');
			if (delegate) {
				this.nextToken();
				argument = this.parseAssignmentExpression();
			}
			else if (this.isStartOfExpression()) {
				argument = this.parseAssignmentExpression();
			}
			this.context.allowYield = previousAllowYield;
		}
		return this.finalize(node, new Node.YieldExpression(argument, delegate));
	};//»
	parseLeftHandSideExpression() {//«
		assert(this.context.allowIn, 'callee of new expression always allow in keyword.');
		var node = this.startNode(this.lookahead);
		var expr = (this.matchKeyword('super') && this.context.inFunctionBody) ? this.parseSuper() :
			this.inheritCoverGrammar(this.matchKeyword('new') ? this.parseNewExpression : this.parsePrimaryExpression);
		while (true) {
			if (this.match('[')) {
				this.context.isBindingElement = false;
				this.context.isAssignmentTarget = true;
				this.expect('[');
				var property = this.isolateCoverGrammar(this.parseExpression);
				this.expect(']');
				expr = this.finalize(node, new Node.ComputedMemberExpression(expr, property));
			}
			else if (this.match('.')) {
				this.context.isBindingElement = false;
				this.context.isAssignmentTarget = true;
				this.expect('.');
				var property = this.parseIdentifierName();
				expr = this.finalize(node, new Node.StaticMemberExpression(expr, property));
			}
			else if (this.lookahead.type === Template_Type && this.lookahead.head) {
				var quasi = this.parseTemplateLiteral();
				expr = this.finalize(node, new Node.TaggedTemplateExpression(expr, quasi));
			}
			else {
				break;
			}
		}
		return expr;
	};//»
	parseNewExpression() {//«
		var node = this.createNode();
		var id = this.parseIdentifierName();
		assert(id.name === 'new', 'New expression must start with `new`');
		var expr;
		if (this.match('.')) {
			this.nextToken();
			if (this.lookahead.type === Identifier_Type && this.context.inFunctionBody && this.lookahead.value === 'target') {
				var property = this.parseIdentifierName();
				expr = new Node.MetaProperty(id, property);
			}
			else {
				this.throwUnexpectedToken(this.lookahead);
			}
		}
		else {
			var callee = this.isolateCoverGrammar(this.parseLeftHandSideExpression);
			var args = this.match('(') ? this.parseArguments() : [];
			expr = new Node.NewExpression(callee, args);
			this.context.isAssignmentTarget = false;
			this.context.isBindingElement = false;
		}
		return this.finalize(node, expr);
	};//»
	parseGroupExpression() {//«
		var expr;
		this.expect('(');
		if (this.match(')')) {
			this.nextToken();
			if (!this.match('=>')) {
				this.expect('=>');
			}
			expr = {
				type: ArrowParameterPlaceHolder,
				params: [],
				async: false
			};
		}
		else {
			var startToken = this.lookahead;
			var params = [];
			if (this.match('...')) {
				expr = this.parseRestElement(params);
				this.expect(')');
				if (!this.match('=>')) {
					this.expect('=>');
				}
				expr = {
					type: ArrowParameterPlaceHolder,
					params: [expr],
					async: false
				};
			}
			else {
				var arrow = false;
				this.context.isBindingElement = true;
				expr = this.inheritCoverGrammar(this.parseAssignmentExpression);
				if (this.match(',')) {
					var expressions = [];
					this.context.isAssignmentTarget = false;
					expressions.push(expr);
					while (this.lookahead.type !== EOF_Type) {
						if (!this.match(',')) {
							break;
						}
						this.nextToken();
						if (this.match(')')) {
							this.nextToken();
							for (var i = 0; i < expressions.length; i++) {
								this.reinterpretExpressionAsPattern(expressions[i]);
							}
							arrow = true;
							expr = {
								type: ArrowParameterPlaceHolder,
								params: expressions,
								async: false
							};
						}
						else if (this.match('...')) {
							if (!this.context.isBindingElement) {
								this.throwUnexpectedToken(this.lookahead);
							}
							expressions.push(this.parseRestElement(params));
							this.expect(')');
							if (!this.match('=>')) {
								this.expect('=>');
							}
							this.context.isBindingElement = false;
							for (var i = 0; i < expressions.length; i++) {
								this.reinterpretExpressionAsPattern(expressions[i]);
							}
							arrow = true;
							expr = {
								type: ArrowParameterPlaceHolder,
								params: expressions,
								async: false
							};
						}
						else {
							expressions.push(this.inheritCoverGrammar(this.parseAssignmentExpression));
						}
						if (arrow) {
							break;
						}
					}
					if (!arrow) {
						expr = this.finalize(this.startNode(startToken), new Node.SequenceExpression(expressions));
					}
				}
				if (!arrow) {
					this.expect(')');
					if (this.match('=>')) {
						if (expr.type === Syntax.Identifier && expr.name === 'yield') {
							arrow = true;
							expr = {
								type: ArrowParameterPlaceHolder,
								params: [expr],
								async: false
							};
						}
						if (!arrow) {
							if (!this.context.isBindingElement) {
								this.throwUnexpectedToken(this.lookahead);
							}
							if (expr.type === Syntax.SequenceExpression) {
								for (var i = 0; i < expr.expressions.length; i++) {
									this.reinterpretExpressionAsPattern(expr.expressions[i]);
								}
							}
							else {
								this.reinterpretExpressionAsPattern(expr);
							}
							var parameters = (expr.type === Syntax.SequenceExpression ? expr.expressions : [expr]);
							expr = {
								type: ArrowParameterPlaceHolder,
								params: parameters,
								async: false
							};
						}
					}
					this.context.isBindingElement = false;
				}
			}
		}
		return expr;
	};//»
	parsePrimaryExpression() {//«
	// https://tc39.github.io/ecma262/#sec-primary-expression
		var node = this.createNode();
		var expr;
		var token, raw;
		switch (this.lookahead.type) {
			case Identifier_Type:
				if ((this.context.isModule || this.context.await) && this.lookahead.value === 'await') {
					this.tolerateUnexpectedToken(this.lookahead);
				}
				expr = this.matchAsyncFunction() ? this.parseFunctionExpression() : this.finalize(node, new Node.Identifier(this.nextToken().value));
				break;
			case NumericLiteral_Type:
			case StringLiteral_Type:
				if (this.context.strict && this.lookahead.octal) {
					this.tolerateUnexpectedToken(this.lookahead, Messages.StrictOctalLiteral);
				}
				this.context.isAssignmentTarget = false;
				this.context.isBindingElement = false;
				token = this.nextToken();
				raw = this.getTokenRaw(token);
				expr = this.finalize(node, new Node.Literal(token.value, raw));
				break;
			case BooleanLiteral_Type:
				this.context.isAssignmentTarget = false;
				this.context.isBindingElement = false;
				token = this.nextToken();
				raw = this.getTokenRaw(token);
				expr = this.finalize(node, new Node.Literal(token.value === 'true', raw));
				break;
			case NullLiteral_Type:
				this.context.isAssignmentTarget = false;
				this.context.isBindingElement = false;
				token = this.nextToken();
				raw = this.getTokenRaw(token);
				expr = this.finalize(node, new Node.Literal(null, raw));
				break;
			case Template_Type:
				expr = this.parseTemplateLiteral();
				break;
			case Punctuator_Type:
				switch (this.lookahead.value) {
					case '(':
						this.context.isBindingElement = false;
						expr = this.inheritCoverGrammar(this.parseGroupExpression);
						break;
					case '[':
						expr = this.inheritCoverGrammar(this.parseArrayInitializer);
						break;
					case '{':
						expr = this.inheritCoverGrammar(this.parseObjectInitializer);
						break;
					case '/':
					case '/=':
						this.context.isAssignmentTarget = false;
						this.context.isBindingElement = false;
						this.scanner.index = this.startMarker.index;
						token = this.nextRegexToken();
						raw = this.getTokenRaw(token);
						expr = this.finalize(node, new Node.RegexLiteral(token.regex, raw, token.pattern, token.flags));
						break;
					default:
						expr = this.throwUnexpectedToken(this.nextToken());
				}
				break;
			case Keyword_Type:
				if (!this.context.strict && this.context.allowYield && this.matchKeyword('yield')) {
					expr = this.parseIdentifierName();
				}
				else if (!this.context.strict && this.matchKeyword('let')) {
					expr = this.finalize(node, new Node.Identifier(this.nextToken().value));
				}
				else {
					this.context.isAssignmentTarget = false;
					this.context.isBindingElement = false;
					if (this.matchKeyword('function')) {
						expr = this.parseFunctionExpression();
					}
					else if (this.matchKeyword('this')) {
						this.nextToken();
						expr = this.finalize(node, new Node.ThisExpression());
					}
					else if (this.matchKeyword('class')) {
						expr = this.parseClassExpression();
					}
					else {
						expr = this.throwUnexpectedToken(this.nextToken());
					}
				}
				break;
			default:
				expr = this.throwUnexpectedToken(this.nextToken());
		}
		return expr;
	};//»
	parseLeftHandSideExpressionAllowCall() {//«
		var startToken = this.lookahead;
		var maybeAsync = this.matchContextualKeyword('async');
		var previousAllowIn = this.context.allowIn;
		this.context.allowIn = true;
		var expr;
		if (this.matchKeyword('super') && this.context.inFunctionBody) {
			expr = this.createNode();
			this.nextToken();
			expr = this.finalize(expr, new Node.Super());
			if (!this.match('(') && !this.match('.') && !this.match('[')) {
				this.throwUnexpectedToken(this.lookahead);
			}
		}
		else {
			expr = this.inheritCoverGrammar(this.matchKeyword('new') ? this.parseNewExpression : this.parsePrimaryExpression);
		}
		while (true) {
			if (this.match('.')) {
				this.context.isBindingElement = false;
				this.context.isAssignmentTarget = true;
				this.expect('.');
				var property = this.parseIdentifierName();
				expr = this.finalize(this.startNode(startToken), new Node.StaticMemberExpression(expr, property));
			}
			else if (this.match('(')) {
				var asyncArrow = maybeAsync && (startToken.lineNumber === this.lookahead.lineNumber);
				this.context.isBindingElement = false;
				this.context.isAssignmentTarget = false;
				var args = asyncArrow ? this.parseAsyncArguments() : this.parseArguments();
				expr = this.finalize(this.startNode(startToken), new Node.CallExpression(expr, args));
				if (asyncArrow && this.match('=>')) {
					for (var i = 0; i < args.length; ++i) {
						this.reinterpretExpressionAsPattern(args[i]);
					}
					expr = {
						type: ArrowParameterPlaceHolder,
						params: args,
						async: true
					};
				}
			}
			else if (this.match('[')) {
				this.context.isBindingElement = false;
				this.context.isAssignmentTarget = true;
				this.expect('[');
				var property = this.isolateCoverGrammar(this.parseExpression);
				this.expect(']');
				expr = this.finalize(this.startNode(startToken), new Node.ComputedMemberExpression(expr, property));
			}
			else if (this.lookahead.type === Template_Type && this.lookahead.head) {
				var quasi = this.parseTemplateLiteral();
				expr = this.finalize(this.startNode(startToken), new Node.TaggedTemplateExpression(expr, quasi));
			}
			else {
				break;
			}
		}
		this.context.allowIn = previousAllowIn;
		return expr;
	};//»
	parseUpdateExpression() {//«
	// https://tc39.github.io/ecma262/#sec-update-expressions
		var expr;
		var startToken = this.lookahead;
		if (this.match('++') || this.match('--')) {
			var node = this.startNode(startToken);
			var token = this.nextToken();
			expr = this.inheritCoverGrammar(this.parseUnaryExpression);
			if (this.context.strict && expr.type === Syntax.Identifier && this.scanner.isRestrictedWord(expr.name)) {
				this.tolerateError(Messages.StrictLHSPrefix);
			}
			if (!this.context.isAssignmentTarget) {
				this.tolerateError(Messages.InvalidLHSInAssignment);
			}
			var prefix = true;
			expr = this.finalize(node, new Node.UpdateExpression(token.value, expr, prefix));
			this.context.isAssignmentTarget = false;
			this.context.isBindingElement = false;
		}
		else {
			expr = this.inheritCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
			if (!this.hasLineTerminator && this.lookahead.type === Punctuator_Type) {
				if (this.match('++') || this.match('--')) {
					if (this.context.strict && expr.type === Syntax.Identifier && this.scanner.isRestrictedWord(expr.name)) {
						this.tolerateError(Messages.StrictLHSPostfix);
					}
					if (!this.context.isAssignmentTarget) {
						this.tolerateError(Messages.InvalidLHSInAssignment);
					}
					this.context.isAssignmentTarget = false;
					this.context.isBindingElement = false;
					var operator = this.nextToken().value;
					var prefix = false;
					expr = this.finalize(this.startNode(startToken), new Node.UpdateExpression(operator, expr, prefix));
				}
			}
		}
		return expr;
	};//»
	parseUnaryExpression() {//«
		var expr;
		if (this.match('+') || this.match('-') || this.match('~') || this.match('!') ||
			this.matchKeyword('delete') || this.matchKeyword('void') || this.matchKeyword('typeof')) {
			var node = this.startNode(this.lookahead);
			var token = this.nextToken();
			expr = this.inheritCoverGrammar(this.parseUnaryExpression);
			expr = this.finalize(node, new Node.UnaryExpression(token.value, expr));
			if (this.context.strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
				this.tolerateError(Messages.StrictDelete);
			}
			this.context.isAssignmentTarget = false;
			this.context.isBindingElement = false;
		}
		else if (this.context.await && this.matchContextualKeyword('await')) {
			expr = this.parseAwaitExpression();
		}
		else {
			expr = this.parseUpdateExpression();
		}
		return expr;
	};//»
	parseExponentiationExpression() {//«
		var startToken = this.lookahead;
		var expr = this.inheritCoverGrammar(this.parseUnaryExpression);
		if (expr.type !== Syntax.UnaryExpression && this.match('**')) {
			this.nextToken();
			this.context.isAssignmentTarget = false;
			this.context.isBindingElement = false;
			var left = expr;
			var right = this.isolateCoverGrammar(this.parseExponentiationExpression);
			expr = this.finalize(this.startNode(startToken), new Node.BinaryExpression('**', left, right));
		}
		return expr;
	};//»
	parseBinaryExpression() {//«
		var startToken = this.lookahead;
		var expr = this.inheritCoverGrammar(this.parseExponentiationExpression);
		var token = this.lookahead;
		var prec = this.binaryPrecedence(token);
		if (prec > 0) {
			this.nextToken();
			this.context.isAssignmentTarget = false;
			this.context.isBindingElement = false;
			var markers = [startToken, this.lookahead];
			var left = expr;
			var right = this.isolateCoverGrammar(this.parseExponentiationExpression);
			var stack = [left, token.value, right];
			var precedences = [prec];
			while (true) {
				prec = this.binaryPrecedence(this.lookahead);
				if (prec <= 0) {
					break;
				}
				// Reduce: make a binary expression from the three topmost entries.
				while ((stack.length > 2) && (prec <= precedences[precedences.length - 1])) {
					right = stack.pop();
					var operator = stack.pop();
					precedences.pop();
					left = stack.pop();
					markers.pop();
					var node = this.startNode(markers[markers.length - 1]);
					stack.push(this.finalize(node, new Node.BinaryExpression(operator, left, right)));
				}
				// Shift.
				stack.push(this.nextToken().value);
				precedences.push(prec);
				markers.push(this.lookahead);
				stack.push(this.isolateCoverGrammar(this.parseExponentiationExpression));
			}
			// Final reduce to clean-up the stack.
			var i = stack.length - 1;
			expr = stack[i];
			var lastMarker = markers.pop();
			while (i > 1) {
				var marker = markers.pop();
				var lastLineStart = lastMarker && lastMarker.lineStart;
				var node = this.startNode(marker, lastLineStart);
				var operator = stack[i - 1];
				expr = this.finalize(node, new Node.BinaryExpression(operator, stack[i - 2], expr));
				i -= 2;
				lastMarker = marker;
			}
		}
		return expr;
	};//»
	parseConditionalExpression() {//«
	// https://tc39.github.io/ecma262/#sec-conditional-operator
		var startToken = this.lookahead;
		var expr = this.inheritCoverGrammar(this.parseBinaryExpression);
		if (this.match('?')) {
			this.nextToken();
			var previousAllowIn = this.context.allowIn;
			this.context.allowIn = true;
			var consequent = this.isolateCoverGrammar(this.parseAssignmentExpression);
			this.context.allowIn = previousAllowIn;
			this.expect(':');
			var alternate = this.isolateCoverGrammar(this.parseAssignmentExpression);
			expr = this.finalize(this.startNode(startToken), new Node.ConditionalExpression(expr, consequent, alternate));
			this.context.isAssignmentTarget = false;
			this.context.isBindingElement = false;
		}
		return expr;
	};//»
	parseAssignmentExpression() {//«
		var expr;
		if (!this.context.allowYield && this.matchKeyword('yield')) {/*«*/
			expr = this.parseYieldExpression();
		}/*»*/
		else {/*«*/
			var startToken = this.lookahead;
			var token = startToken;
			expr = this.parseConditionalExpression();
			if (token.type === Identifier_Type && (token.lineNumber === this.lookahead.lineNumber) && token.value === 'async') {/*«*/
				if (this.lookahead.type === Identifier_Type || this.matchKeyword('yield')) {
					var arg = this.parsePrimaryExpression();
					this.reinterpretExpressionAsPattern(arg);
					expr = {
						type: ArrowParameterPlaceHolder,
						params: [arg],
						async: true
					};
				}
			}/*»*/
			if (expr.type === ArrowParameterPlaceHolder || this.match('=>')) {//«
				// https://tc39.github.io/ecma262/#sec-arrow-function-definitions
				this.context.isAssignmentTarget = false;
				this.context.isBindingElement = false;
				var isAsync = expr.async;
				var list = this.reinterpretAsCoverFormalsList(expr);
				if (list) {/*«*/
					if (this.hasLineTerminator) {
						this.tolerateUnexpectedToken(this.lookahead);
					}
					this.context.firstCoverInitializedNameError = null;
					var previousStrict = this.context.strict;
					var previousAllowStrictDirective = this.context.allowStrictDirective;
					this.context.allowStrictDirective = list.simple;
					var previousAllowYield = this.context.allowYield;
					var previousAwait = this.context.await;
					this.context.allowYield = true;
					this.context.await = isAsync;
					var node = this.startNode(startToken);
					this.expect('=>');
					var body = void 0;
					if (this.match('{')) {/*«*/
						var previousAllowIn = this.context.allowIn;
						this.context.allowIn = true;
						body = this.parseFunctionSourceElements();
						this.context.allowIn = previousAllowIn;
					}/*»*/
					else {
						body = this.isolateCoverGrammar(this.parseAssignmentExpression);
					}
					var expression = body.type !== Syntax.BlockStatement;
					if (this.context.strict && list.firstRestricted) {
						this.throwUnexpectedToken(list.firstRestricted, list.message);
					}
					if (this.context.strict && list.stricted) {
						this.tolerateUnexpectedToken(list.stricted, list.message);
					}
					expr = isAsync ? this.finalize(node, new Node.AsyncArrowFunctionExpression(list.params, body, expression)) :
						this.finalize(node, new Node.ArrowFunctionExpression(list.params, body, expression));
					this.context.strict = previousStrict;
					this.context.allowStrictDirective = previousAllowStrictDirective;
					this.context.allowYield = previousAllowYield;
					this.context.await = previousAwait;
				}/*»*/
			}/*»*/
			else {/*«*/
				if (this.matchAssign()) {
					if (!this.context.isAssignmentTarget) {
						this.tolerateError(Messages.InvalidLHSInAssignment);
					}
					if (this.context.strict && expr.type === Syntax.Identifier) {
						var id = expr;
						if (this.scanner.isRestrictedWord(id.name)) {
							this.tolerateUnexpectedToken(token, Messages.StrictLHSAssignment);
						}
						if (this.scanner.isStrictModeReservedWord(id.name)) {
							this.tolerateUnexpectedToken(token, Messages.StrictReservedWord);
						}
					}
					if (!this.match('=')) {
						this.context.isAssignmentTarget = false;
						this.context.isBindingElement = false;
					}
					else {
						this.reinterpretExpressionAsPattern(expr);
					}
					token = this.nextToken();
					var operator = token.value;
					var right = this.isolateCoverGrammar(this.parseAssignmentExpression);
					expr = this.finalize(this.startNode(startToken), new Node.AssignmentExpression(operator, expr, right));
					this.context.firstCoverInitializedNameError = null;
				}
			}/*»*/
		}/*»*/
		return expr;
	};//»
	parseExpression() {//«
	// https://tc39.github.io/ecma262/#sec-comma-operator
		var startToken = this.lookahead;
		var expr = this.isolateCoverGrammar(this.parseAssignmentExpression);
		if (this.match(',')) {
			var expressions = [];
			expressions.push(expr);
			while (this.lookahead.type !== EOF_Type) {
				if (!this.match(',')) {
					break;
				}
				this.nextToken();
				expressions.push(this.isolateCoverGrammar(this.parseAssignmentExpression));
			}
			expr = this.finalize(this.startNode(startToken), new Node.SequenceExpression(expressions));
		}
		return expr;
	};//»
	parseExpressionStatement() {//«
	// https://tc39.github.io/ecma262/#sec-expression-statement
		var node = this.createNode();
		var expr = this.parseExpression();
		this.consumeSemicolon();
		return this.finalize(node, new Node.ExpressionStatement(expr));
	};//»

//»
//«Statement

	parseBlock() {//«
		var node = this.createNode();
		this.expect('{');
		var block = [];
		while (true) {
			if (this.match('}')) {
				break;
			}
			block.push(this.parseStatementListItem());
		}
		this.expect('}');
		return this.finalize(node, new Node.BlockStatement(block));
	};//»
	parseStatement() {//«
	// https://tc39.github.io/ecma262/#sec-ecmascript-language-statements-and-declarations
		var statement;
		switch (this.lookahead.type) {
			case BooleanLiteral_Type://«
			case NullLiteral_Type:
			case NumericLiteral_Type:
			case StringLiteral_Type:
			case Template_Type:
			case RegularExpression_Type:
				statement = this.parseExpressionStatement();
				break;//»
			case Punctuator_Type://«
				var value = this.lookahead.value;
				if (value === '{') {
					statement = this.parseBlock();
				}
				else if (value === '(') {
					statement = this.parseExpressionStatement();
				}
				else if (value === ';') {
					statement = this.parseEmptyStatement();
				}
				else {
					statement = this.parseExpressionStatement();
				}
				break;//»
			case Identifier_Type://«
				statement = this.matchAsyncFunction() ? this.parseFunctionDeclaration() : this.parseLabelledStatement();
				break;//»
			case Keyword_Type://«
				switch (this.lookahead.value) {
					case 'break':
						statement = this.parseBreakStatement();
						break;
					case 'continue':
						statement = this.parseContinueStatement();
						break;
					case 'debugger':
						statement = this.parseDebuggerStatement();
						break;
					case 'do':
						statement = this.parseDoWhileStatement();
						break;
					case 'for':
						statement = this.parseForStatement();
						break;
					case 'function':
						statement = this.parseFunctionDeclaration();
						break;
					case 'if':
						statement = this.parseIfStatement();
						break;
					case 'return':
						statement = this.parseReturnStatement();
						break;
					case 'switch':
						statement = this.parseSwitchStatement();
						break;
					case 'throw':
						statement = this.parseThrowStatement();
						break;
					case 'try':
						statement = this.parseTryStatement();
						break;
					case 'var':
						statement = this.parseVariableStatement();
						break;
					case 'while':
						statement = this.parseWhileStatement();
						break;
					case 'with':
						statement = this.parseWithStatement();
						break;
					default:
						statement = this.parseExpressionStatement();
						break;
				}
				break;//»
			default:
				statement = this.throwUnexpectedToken(this.lookahead);
		}
		return statement;
	};//»
	parseStatementListItem() {//«
	// https://tc39.github.io/ecma262/#sec-block
		var statement;
		this.context.isAssignmentTarget = true;
		this.context.isBindingElement = true;
		if (this.lookahead.type === Keyword_Type) {//«
			switch (this.lookahead.value) {
				case 'export'://«
					if (!this.context.isModule) {
						this.tolerateUnexpectedToken(this.lookahead, Messages.IllegalExportDeclaration);
					}
					statement = this.parseExportDeclaration();
					break;//»
				case 'import'://«
					if (!this.context.isModule) {
						this.tolerateUnexpectedToken(this.lookahead, Messages.IllegalImportDeclaration);
					}
					statement = this.parseImportDeclaration();
					break;//»
				case 'const'://«
					statement = this.parseLexicalDeclaration({ inFor: false });
					break;//»
				case 'let'://«
					statement = this.isLexicalDeclaration() ? this.parseLexicalDeclaration({ inFor: false }) : this.parseStatement();
					break;//»
				case 'function'://«
					statement = this.parseFunctionDeclaration();
					break;//»
				case 'class'://«
					statement = this.parseClassDeclaration();
					break;//»
				default://«
					statement = this.parseStatement();
					break;//»
			}
		}//»
		else {//«
			statement = this.parseStatement();
		}//»
		return statement;
	};//»

//»

	parseModule() {//«
	// https://tc39.github.io/ecma262/#sec-modules
		this.context.strict = true;
		this.context.isModule = true;
		this.scanner.isModule = true;
		var node = this.createNode();
		var body = this.parseDirectivePrologues();
		while (this.lookahead.type !== EOF_Type) {
			body.push(this.parseStatementListItem());
		}
		return this.finalize(node, new Node.Module(body));
	};//»
	parseScript() {//«
	// https://tc39.github.io/ecma262/#sec-scripts
		var node = this.createNode();
		var body = this.parseDirectivePrologues();
		while (this.lookahead.type !== EOF_Type) {
			body.push(this.parseStatementListItem());
		}
		return this.finalize(node, new Node.Script(body));
	};//»

};
//»

const parse = function(code, options) {//«
	let isModule = false;
	if (options && typeof options.sourceType === 'string') {
		isModule = (options.sourceType === 'module');
	}
	let parser = new Parser(code, options);
	let ast = isModule ? parser.parseModule() : parser.parseScript();
	if (parser.config.tokens) {
		ast.tokens = parser.tokens;
	}
	if (parser.config.tolerant) {
		ast.errors = parser.errorHandler.errors;
	}
	return ast;
}//»

const com_esparse=class extends Com{//«
#lines=[];
#didWarn = false;
init(){
	if (this.noInputOrArgs() || (this.noStdin && !this.expectArgs(1))) this.no();
}
#doEsparse(str){/*«*/
//log(str);
	try{
		let ast = parse(str, {sourceType: "module"});
log(ast);
		this.out(JSON.stringify(ast));
		this.ok();
	}
	catch(e){
//log(e);
cerr(e.stack);
		this.err(`${e.message} (${e.lineNumber}:${e.column})`);
		this.no();
	}
}/*»*/
async run() {/*«*/
	let {out, err, stdin, term, args, no} = this;
	let str;
	if (!args.length){
		if (stdin){
			this.#doEsparse(stdin.join("\n"));
		}
		return;
	}
	let fname = args.shift();
	let node = await fname.toNode(term);
	if (!node){
		err(`${fname}: does not exist`);
		this.no();
		return;
	}
	if (!node.isFile){
		err(`${fname}: is not a regular file`);
		this.no();
		return;
	}
	this.#doEsparse(await node.text);
}/*»*/
pipeIn(val){/*«*/
	if (isEOF(val)){
		this.#doEsparse(this.#lines.join("\n"));
		return;
	}
	if (isStr(val)) this.#lines.push(val);
	else if (isJSArr(val)) this.#lines.push(...val);
	else{
if (this.#didWarn) return;
this.#didWarn = true;
this.wrn("Dropping unknown pipeline input (see console)");
cwarn("Here is the unknown value below");
log(val);
	}
}/*»*/

};//»

export const coms={esparse: com_esparse};
export const opts={};

