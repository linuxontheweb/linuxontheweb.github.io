//import { util, api as capi } from "util";
//import {globals} from "config";

const util = LOTW.api.util;
const globals = LOTW.globals;
const{ log, jlog, cwarn, cerr, isStr, isNum, make, mk, mkdv} = util;

export const mod = function(Core) {

//Imports«

//»

this.WASM=(MODULE, module_name, load_cb, arg)=>{//«

//TS==TABLESIZE, SB==STATICBUMP//«
var app_hash={
	samplerate:{TS:18,SB:1463584},
	opus:{TS:10,SB:33760},
	binjgb:{TS:27,SB:12336},
	nes:{TS:78,SB:197376},
	mfcc:{TS:6,SB:3360}
};
var wasm_table_size;
var static_bump;
if(arg){if(arg.TABLESIZE&&arg.STATICBUMP){wasm_table_size=arg.TABLESIZE;static_bump=arg.STATICBUMP;}else{load_cb(null,"Args not given!");return;}}else{let gothash=app_hash[module_name];if(!gothash)return load_cb(null,"Unknown module");wasm_table_size=gothash.TS;static_bump=gothash.SB;}
//»
MODULE = MODULE || {};//«
var Module=MODULE;var Module;if(!Module)Module=(typeof MODULE !=="undefined" ? MODULE:null)||{};var moduleOverrides={};
for(var key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key];}}
var ENVIRONMENT_IS_WORKER = (typeof importScripts === "function");
Module["read"]=function shell_read(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText;};
if(ENVIRONMENT_IS_WORKER){Module["readBinary"]=function readBinary(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return xhr.response;};}
Module["readAsync"]=function readAsync(url,onload,onerror){var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=function xhr_onload(){if(xhr.status==200 || xhr.status==0 && xhr.response){onload(xhr.response);}else{onerror();}};xhr.onerror=onerror;xhr.send(null);};
if (typeof arguments != "undefined")Module["arguments"] = arguments;
if (typeof console !== "undefined") {
	if (!Module["print"]) {
		Module["print"] = function shell_print(x) {
//			log(x);
		};
	}
	if (!Module["printErr"]) {
		Module["printErr"] = function shell_printErr(x) {
			cwarn(x);
		};
	}
}
else{var TRY_USE_DUMP=false;if(!Module["print"]){Module["print"]=TRY_USE_DUMP && typeof dump !=="undefined" ? function(x){dump(x);}:function(x){};}}
if (ENVIRONMENT_IS_WORKER) Module["load"] = importScripts;
function globalEval(x){eval.call(null,x);}
if(!Module["load"] && Module["read"])Module["load"]=function load(f){globalEval(Module["read"](f));};
if (!Module["print"]) Module["print"] = function() {};
if (!Module["printErr"]) Module["printErr"] = Module["print"];
if (!Module["arguments"]) Module["arguments"] = [];
if (!Module["thisProgram"]) Module["thisProgram"] = "./this.program";
if(!Module["quit"])Module["quit"]=function(status,toThrow){throw toThrow;};
Module.print=Module["print"];Module.printErr=Module["printErr"];Module["preRun"]=[];Module["postRun"]=[];
for(var key in moduleOverrides){if(moduleOverrides.hasOwnProperty(key)){Module[key]=moduleOverrides[key];}}
moduleOverrides = undefined;
//»
var Runtime = {//«
setTempRet0:function(value){tempRet0=value;return value;},
getTempRet0:function(){return tempRet0;},
stackSave:function(){return STACKTOP;},
stackRestore:function(stackTop){STACKTOP=stackTop;},
getNativeTypeSize:function(type){switch(type){case "i1":case "i8":return 1;case "i16":return 2;case "i32":return 4;case "i64":return 8;case "float":return 4;case "double":return 8;default:{if(type[type.length-1]==="*"){return Runtime.QUANTUM_SIZE;}else{if(type[0]==="i"){var bits=parseInt(type.substr(1));assert(bits % 8===0);return bits / 8;}else{return 0;}} } }},
getNativeFieldSize:function(type){return Math.max(Runtime.getNativeTypeSize(type),Runtime.QUANTUM_SIZE);},
STACK_ALIGN:16,
prepVararg:function(ptr,type){if(type==="double" || type==="i64"){if(ptr & 7){assert((ptr & 7)===4);ptr+=4;}}else{assert((ptr & 3)===0);}return ptr;},
getAlignSize:function(type,size,vararg){if(!vararg &&(type=="i64" || type=="double")){return 8;}if(!type){return Math.min(size,8);}return Math.min(size ||(type ? Runtime.getNativeFieldSize(type):0),Runtime.QUANTUM_SIZE);},
dynCall:function(sig,ptr,args){if(args && args.length){return Module["dynCall_"+sig].apply(null,[ptr].concat(args));}else{return Module["dynCall_"+sig].call(null,ptr);}},
functionPointers:[],addFunction:function(func){for(var i=0;i<Runtime.functionPointers.length;i++){if(!Runtime.functionPointers[i]){Runtime.functionPointers[i]=func;return 2 *(1+i);}}throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.";},
removeFunction:function(index){Runtime.functionPointers[(index-2)/ 2]=null;},
warnOnce:function(text){if(!Runtime.warnOnce.shown){Runtime.warnOnce.shown={};}if(!Runtime.warnOnce.shown[text]){Runtime.warnOnce.shown[text]=1;Module.printErr(text);}},
funcWrappers:{},
getFuncWrapper:function(func,sig){assert(sig);if(!Runtime.funcWrappers[sig]){Runtime.funcWrappers[sig]={};}var sigCache=Runtime.funcWrappers[sig];if(!sigCache[func]){if(sig.length===1){sigCache[func]=function dynCall_wrapper(){return Runtime.dynCall(sig,func);};}else{if(sig.length===2){sigCache[func]=function dynCall_wrapper(arg){return Runtime.dynCall(sig,func,[arg]);};}else{sigCache[func]=function dynCall_wrapper(){return Runtime.dynCall(sig,func,Array.prototype.slice.call(arguments));};}} }return sigCache[func];},
getCompilerSetting:function(name){throw "You must build with-s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work";},
stackAlloc:function(size){var ret=STACKTOP;STACKTOP=STACKTOP+size | 0;STACKTOP=STACKTOP+15 &-16;return ret;},
staticAlloc:function(size){var ret=STATICTOP;STATICTOP=STATICTOP+size | 0;STATICTOP=STATICTOP+15 &-16;return ret;},
dynamicAlloc:function(size){var ret=HEAP32[DYNAMICTOP_PTR>>2];var end=(ret+size+15 | 0)&-16;HEAP32[DYNAMICTOP_PTR>>2]=end;if(end>=TOTAL_MEMORY){var success=enlargeMemory();if(!success){HEAP32[DYNAMICTOP_PTR>>2]=ret;return 0;}}return ret;},
alignMemory:function(size,quantum){var ret=size=Math.ceil(size /(quantum ? quantum:16))*(quantum ? quantum:16);return ret;},
makeBigInt:function(low,high,unsigned){var ret=unsigned ?+(low>>>0) + +(high>>>0)* 4294967296:+(low>>>0) + +(high | 0) * 4294967296;return ret;},
GLOBAL_BASE:1024,
QUANTUM_SIZE:4,
__dummy__:0
};
Module["Runtime"] = Runtime;
//»
var ABORT = 0;
var EXITSTATUS = 0;
function assert(condition,text){if(!condition){abort("Assertion failed:"+text);}}
function getCFunc(ident){var func=Module["_"+ident];if(!func){try{func=eval("_"+ident);}catch(e){}}assert(func,"Cannot call unknown function "+ident+"(perhaps LLVM optimizations or closure removed it?)");return func;}
var cwrap, ccall;//«
(function() {
var JSfuncs={"stackSave":function(){Runtime.stackSave();},"stackRestore":function(){Runtime.stackRestore();},"arrayToC":function(arr){var ret=Runtime.stackAlloc(arr.length);writeArrayToMemory(arr,ret);return ret;},"stringToC":function(str){var ret=0;if(str !==null && str !==undefined && str !==0){var len=(str.length<<2)+1;ret=Runtime.stackAlloc(len);stringToUTF8(str,ret,len);}return ret;}};
var toC = {"string":JSfuncs["stringToC"], "array":JSfuncs["arrayToC"]};
ccall=function ccallFunc(ident,returnType,argTypes,args,opts){var func=getCFunc(ident);var cArgs=[];var stack=0;if(args){for(var i=0;i<args.length;i++){var converter=toC[argTypes[i]];if(converter){if(stack===0){stack=Runtime.stackSave();}cArgs[i]=converter(args[i]);}else{cArgs[i]=args[i];}} }var ret=func.apply(null,cArgs);if(returnType==="string"){ret=Pointer_stringify(ret);}if(stack !==0){if(opts && opts.async){EmterpreterAsync.asyncFinalizers.push(function(){Runtime.stackRestore(stack);});return;}Runtime.stackRestore(stack);}return ret;};
var sourceRegex = /^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
function parseJSFunc(jsfunc){var parsed=jsfunc.toString().match(sourceRegex).slice(1);return{arguments:parsed[0],body:parsed[1],returnValue:parsed[2]};}
var JSsource = null;
function ensureJSsource(){if(!JSsource){JSsource={};for(var fun in JSfuncs){if(JSfuncs.hasOwnProperty(fun)){JSsource[fun]=parseJSFunc(JSfuncs[fun]);}} }}
cwrap = function cwrap(ident, returnType, argTypes) {
argTypes = argTypes || [];
var cfunc = getCFunc(ident);
var numericArgs=argTypes.every(function(type){return type==="number";});
var numericRet = returnType !== "string";
if (numericRet && numericArgs)return cfunc;
var argNames=argTypes.map(function(x,i){return "$"+i;});
var funcstr = "(function(" + argNames.join(",") + ") {";
var nargs = argTypes.length;
if(!numericArgs){ensureJSsource();funcstr+="var stack = "+JSsource["stackSave"].body+";";for(var i=0;i<nargs;i++){var arg=argNames[i],type=argTypes[i];if(type==="number")continue;var convertCode=JSsource[type+"ToC"];funcstr+="var "+convertCode.arguments+" = "+arg+";";funcstr+=convertCode.body+";";funcstr+=arg+" =("+convertCode.returnValue+");";}}
var cfuncname=parseJSFunc(function(){return cfunc;}).returnValue;
funcstr += "var ret = " + cfuncname + "(" + argNames.join(",") + ");";
if(!numericRet){var strgfy=parseJSFunc(function(){return Pointer_stringify;}).returnValue;funcstr+="ret = "+strgfy+"(ret);";}
if(!numericArgs){ensureJSsource();funcstr+=JSsource["stackRestore"].body.replace("()","(stack)")+";";}
funcstr += "return ret})";
return eval(funcstr);};})();Module["ccall"] = ccall;Module["cwrap"] = cwrap;
//»
function setValue(ptr,value,type,noSafe){type=type || "i8";if(type.charAt(type.length-1)==="*"){type="i32";}switch(type){case "i1":HEAP8[ptr>>0]=value;break;case "i8":HEAP8[ptr>>0]=value;break;case "i16":HEAP16[ptr>>1]=value;break;case "i32":HEAP32[ptr>>2]=value;break;case "i64":tempI64=[value>>>0,(tempDouble=value,+Math_abs(tempDouble)>=1 ? tempDouble>0 ?(Math_min(+Math_floor(tempDouble / 4294967296),4294967295)| 0)>>>0:~~+Math_ceil((tempDouble - +(~~tempDouble>>>0))/ 4294967296)>>>0:0)],HEAP32[ptr>>2]=tempI64[0],HEAP32[ptr+4>>2]=tempI64[1];break;case "float":HEAPF32[ptr>>2]=value;break;case "double":HEAPF64[ptr>>3]=value;break;default:abort("invalid type for setValue:"+type);}}Module["setValue"]=setValue;
function getValue(ptr,type,noSafe){type=type || "i8";if(type.charAt(type.length-1)==="*"){type="i32";}switch(type){case "i1":return HEAP8[ptr>>0];case "i8":return HEAP8[ptr>>0];case "i16":return HEAP16[ptr>>1];case "i32":return HEAP32[ptr>>2];case "i64":return HEAP32[ptr>>2];case "float":return HEAPF32[ptr>>2];case "double":return HEAPF64[ptr>>3];default:abort("invalid type for setValue:"+type);}return null;}Module["getValue"]=getValue;
var ALLOC_NORMAL=0;var ALLOC_STACK=1;var ALLOC_STATIC=2;var ALLOC_DYNAMIC=3;var ALLOC_NONE=4;Module["ALLOC_NORMAL"]=ALLOC_NORMAL;Module["ALLOC_STACK"]=ALLOC_STACK;Module["ALLOC_STATIC"]=ALLOC_STATIC;Module["ALLOC_DYNAMIC"]=ALLOC_DYNAMIC;Module["ALLOC_NONE"]=ALLOC_NONE;
function allocate(slab,types,allocator,ptr){var zeroinit,size;if(typeof slab==="number"){zeroinit=true;size=slab;}else{zeroinit=false;size=slab.length;}var singleType=typeof types==="string" ? types:null;var ret;if(allocator==ALLOC_NONE){ret=ptr;}else{ret=[typeof _malloc==="function" ? _malloc:Runtime.staticAlloc,Runtime.stackAlloc,Runtime.staticAlloc,Runtime.dynamicAlloc][allocator===undefined ? ALLOC_STATIC:allocator](Math.max(size,singleType ? 1:types.length));}if(zeroinit){var ptr=ret,stop;assert((ret & 3)==0);stop=ret+(size & ~3);for(;ptr<stop;ptr+=4){HEAP32[ptr>>2]=0;}stop=ret+size;while(ptr<stop){HEAP8[ptr++>>0]=0;}return ret;}if(singleType==="i8"){if(slab.subarray || slab.slice){HEAPU8.set(slab,ret);}else{HEAPU8.set(new Uint8Array(slab),ret);}return ret;}var i=0,type,typeSize,previousType;while(i<size){var curr=slab[i];if(typeof curr==="function"){curr=Runtime.getFunctionIndex(curr);}type=singleType || types[i];if(type===0){i++;continue;}if(type=="i64"){type="i32";}setValue(ret+i,curr,type);if(previousType !==type){typeSize=Runtime.getNativeTypeSize(type);previousType=type;}i+=typeSize;}return ret;}Module["allocate"]=allocate;
function getMemory(size){if(!staticSealed){return Runtime.staticAlloc(size);}if(!runtimeInitialized){return Runtime.dynamicAlloc(size);}return _malloc(size);}Module["getMemory"]=getMemory;
function Pointer_stringify(ptr,length){if(length===0 || !ptr){return "";}var hasUtf=0;var t;var i=0;while(1){t=HEAPU8[ptr+i>>0];hasUtf |=t;if(t==0 && !length){break;}i++;if(length && i==length){break;}}if(!length){length=i;}var ret="";if(hasUtf<128){var MAX_CHUNK=1024;var curr;while(length>0){curr=String.fromCharCode.apply(String,HEAPU8.subarray(ptr,ptr+Math.min(length,MAX_CHUNK)));ret=ret ? ret+curr:curr;ptr+=MAX_CHUNK;length-=MAX_CHUNK;}return ret;}return Module["UTF8ToString"](ptr);}Module["Pointer_stringify"]=Pointer_stringify;
function AsciiToString(ptr){var str="";while(1){var ch=HEAP8[ptr++>>0];if(!ch){return str;}str+=String.fromCharCode(ch);}}Module["AsciiToString"]=AsciiToString;
function stringToAscii(str,outPtr){return writeAsciiToMemory(str,outPtr,false);}Module["stringToAscii"]=stringToAscii;
var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
function UTF8ArrayToString(u8Array,idx){var endPtr=idx;while(u8Array[endPtr]){++endPtr;}if(endPtr-idx>16 && u8Array.subarray && UTF8Decoder){return UTF8Decoder.decode(u8Array.subarray(idx,endPtr));}else{var u0,u1,u2,u3,u4,u5;var str="";while(1){u0=u8Array[idx++];if(!u0){return str;}if(!(u0 & 128)){str+=String.fromCharCode(u0);continue;}u1=u8Array[idx++] & 63;if((u0 & 224)==192){str+=String.fromCharCode((u0 & 31)<<6 | u1);continue;}u2=u8Array[idx++] & 63;if((u0 & 240)==224){u0=(u0 & 15)<<12 | u1<<6 | u2;}else{u3=u8Array[idx++] & 63;if((u0 & 248)==240){u0=(u0 & 7)<<18 | u1<<12 | u2<<6 | u3;}else{u4=u8Array[idx++] & 63;if((u0 & 252)==248){u0=(u0 & 3)<<24 | u1<<18 | u2<<12 | u3<<6 | u4;}else{u5=u8Array[idx++] & 63;u0=(u0 & 1)<<30 | u1<<24 | u2<<18 | u3<<12 | u4<<6 | u5;}} }if(u0<65536){str+=String.fromCharCode(u0);}else{var ch=u0-65536;str+=String.fromCharCode(55296 | ch>>10,56320 | ch & 1023);}} }}Module["UTF8ArrayToString"]=UTF8ArrayToString;
function UTF8ToString(ptr){return UTF8ArrayToString(HEAPU8,ptr);}Module["UTF8ToString"]=UTF8ToString;
function stringToUTF8Array(str,outU8Array,outIdx,maxBytesToWrite){if(!(maxBytesToWrite>0)){return 0;}var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296 && u<=57343){u=65536+((u & 1023)<<10)| str.charCodeAt(++i)& 1023;}if(u<=127){if(outIdx>=endIdx){break;}outU8Array[outIdx++]=u;}else{if(u<=2047){if(outIdx+1>=endIdx){break;}outU8Array[outIdx++]=192 | u>>6;outU8Array[outIdx++]=128 | u & 63;}else{if(u<=65535){if(outIdx+2>=endIdx){break;}outU8Array[outIdx++]=224 | u>>12;outU8Array[outIdx++]=128 | u>>6 & 63;outU8Array[outIdx++]=128 | u & 63;}else{if(u<=2097151){if(outIdx+3>=endIdx){break;}outU8Array[outIdx++]=240 | u>>18;outU8Array[outIdx++]=128 | u>>12 & 63;outU8Array[outIdx++]=128 | u>>6 & 63;outU8Array[outIdx++]=128 | u & 63;}else{if(u<=67108863){if(outIdx+4>=endIdx){break;}outU8Array[outIdx++]=248 | u>>24;outU8Array[outIdx++]=128 | u>>18 & 63;outU8Array[outIdx++]=128 | u>>12 & 63;outU8Array[outIdx++]=128 | u>>6 & 63;outU8Array[outIdx++]=128 | u & 63;}else{if(outIdx+5>=endIdx){break;}outU8Array[outIdx++]=252 | u>>30;outU8Array[outIdx++]=128 | u>>24 & 63;outU8Array[outIdx++]=128 | u>>18 & 63;outU8Array[outIdx++]=128 | u>>12 & 63;outU8Array[outIdx++]=128 | u>>6 & 63;outU8Array[outIdx++]=128 | u & 63;}} }} } }outU8Array[outIdx]=0;return outIdx-startIdx;}Module["stringToUTF8Array"]=stringToUTF8Array;
function stringToUTF8(str,outPtr,maxBytesToWrite){return stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite);}Module["stringToUTF8"]=stringToUTF8;
function lengthBytesUTF8(str){var len=0;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296 && u<=57343){u=65536+((u & 1023)<<10)| str.charCodeAt(++i)& 1023;}if(u<=127){++len;}else{if(u<=2047){len+=2;}else{if(u<=65535){len+=3;}else{if(u<=2097151){len+=4;}else{if(u<=67108863){len+=5;}else{len+=6;}} }} } }return len;}Module["lengthBytesUTF8"]=lengthBytesUTF8;
var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;
function demangle(func){var __cxa_demangle_func=Module["___cxa_demangle"] || Module["__cxa_demangle"];if(__cxa_demangle_func){try{var s=func.substr(1);var len=lengthBytesUTF8(s)+1;var buf=_malloc(len);stringToUTF8(s,buf,len);var status=_malloc(4);var ret=__cxa_demangle_func(buf,0,0,status);if(getValue(status,"i32")===0 && ret){return Pointer_stringify(ret);}}catch(e){}finally{if(buf){_free(buf);}if(status){_free(status);}if(ret){_free(ret);}}return func;}Runtime.warnOnce("warning:build with-s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");return func;}
function demangleAll(text){var regex=/__Z[\w\d_]+/g;return text.replace(regex,function(x){var y=demangle(x);return x===y ? x:x+" ["+y+"]";});}
function jsStackTrace(){var err=new Error;if(!err.stack){try{throw new Error(0);}catch(e){err=e;}if(!err.stack){return "(no stack trace available)";}}return err.stack.toString();}
function stackTrace(){var js=jsStackTrace();if(Module["extraStackTrace"]){js+="\n"+Module["extraStackTrace"]();}return demangleAll(js);}Module["stackTrace"]=stackTrace;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;
function alignUp(x,multiple){if(x % multiple>0){x+=multiple-x % multiple;}return x;}
var HEAP, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateGlobalBuffer(buf){Module["buffer"]=buffer=buf;}
function updateGlobalBufferViews(){Module["HEAP8"]=HEAP8=new Int8Array(buffer);Module["HEAP16"]=HEAP16=new Int16Array(buffer);Module["HEAP32"]=HEAP32=new Int32Array(buffer);Module["HEAPU8"]=HEAPU8=new Uint8Array(buffer);Module["HEAPU16"]=HEAPU16=new Uint16Array(buffer);Module["HEAPU32"]=HEAPU32=new Uint32Array(buffer);Module["HEAPF32"]=HEAPF32=new Float32Array(buffer);Module["HEAPF64"]=HEAPF64=new Float64Array(buffer);}
var STATIC_BASE,STATICTOP,staticSealed;var STACK_BASE,STACKTOP,STACK_MAX;var DYNAMIC_BASE,DYNAMICTOP_PTR;STATIC_BASE=STATICTOP=STACK_BASE=STACKTOP=STACK_MAX=DYNAMIC_BASE=DYNAMICTOP_PTR=0;staticSealed=false;
function abortOnCannotGrowMemory(){abort("Cannot enlarge memory arrays. Either(1)compile with-s TOTAL_MEMORY=X  with X higher than the current value "+TOTAL_MEMORY+",(2)compile with-s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime,or(3)if you want malloc to return NULL(0)instead of this abort,compile with-s ABORTING_MALLOC=0 ");}
function enlargeMemory(){abortOnCannotGrowMemory();}
var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;
if(TOTAL_MEMORY<TOTAL_STACK){Module.printErr("TOTAL_MEMORY should be larger than TOTAL_STACK,was "+TOTAL_MEMORY+"!(TOTAL_STACK="+TOTAL_STACK+")");}
if(Module["buffer"]){buffer=Module["buffer"];}else{if(typeof WebAssembly==="object" && typeof WebAssembly.Memory==="function"){Module["wasmMemory"]=new WebAssembly.Memory({"initial":TOTAL_MEMORY / WASM_PAGE_SIZE,"maximum":TOTAL_MEMORY / WASM_PAGE_SIZE});buffer=Module["wasmMemory"].buffer;}else{buffer=new ArrayBuffer(TOTAL_MEMORY);}}
updateGlobalBufferViews();
function getTotalMemory(){return TOTAL_MEMORY;}
HEAP32[0]=1668509029;HEAP16[1]=25459;
if(HEAPU8[2]!==115||HEAPU8[3] !==99){throw "Runtime error:expected the system to be little-endian!";}
Module["HEAP"]=HEAP;Module["buffer"]=buffer;Module["HEAP8"]=HEAP8;Module["HEAP16"]=HEAP16;Module["HEAP32"]=HEAP32;Module["HEAPU8"]=HEAPU8;Module["HEAPU16"]=HEAPU16;Module["HEAPU32"]=HEAPU32;Module["HEAPF32"]=HEAPF32;Module["HEAPF64"]=HEAPF64;
function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback();continue;}var func=callback.func;if(typeof func==="number"){if(callback.arg===undefined){Module["dynCall_v"](func);}else{Module["dynCall_vi"](func,callback.arg);}}else{func(callback.arg===undefined ? null:callback.arg);} }}
var __ATPRERUN__=[];var __ATINIT__=[];var __ATMAIN__=[];var __ATEXIT__=[];var __ATPOSTRUN__=[];var runtimeInitialized=false;var runtimeExited=false;
function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function"){Module["preRun"]=[Module["preRun"]];}while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift());}}callRuntimeCallbacks(__ATPRERUN__);}
function ensureInitRuntime(){if(runtimeInitialized){return;}runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__);}
function preMain(){callRuntimeCallbacks(__ATMAIN__);}
function exitRuntime(){callRuntimeCallbacks(__ATEXIT__);runtimeExited=true;}
function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function"){Module["postRun"]=[Module["postRun"]];}while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift());}}callRuntimeCallbacks(__ATPOSTRUN__);}
function addOnPreRun(cb){__ATPRERUN__.unshift(cb);}Module["addOnPreRun"]=addOnPreRun;
function addOnInit(cb){__ATINIT__.unshift(cb);}Module["addOnInit"]=addOnInit;
function addOnPreMain(cb){__ATMAIN__.unshift(cb);}Module["addOnPreMain"]=addOnPreMain;
function addOnExit(cb){__ATEXIT__.unshift(cb);}Module["addOnExit"]=addOnExit;
function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb);}Module["addOnPostRun"]=addOnPostRun;
function intArrayFromString(stringy, dontAddNull, length) {
var len=length>0 ? length:lengthBytesUTF8(stringy)+1;var u8array=new Array(len);var numBytesWritten=stringToUTF8Array(stringy,u8array,0,u8array.length);if(dontAddNull){u8array.length=numBytesWritten;}return u8array;}Module["intArrayFromString"]=intArrayFromString;
function intArrayToString(array){var ret=[];for(var i=0;i<array.length;i++){var chr=array[i];if(chr>255){chr &=255;}ret.push(String.fromCharCode(chr));}return ret.join("");}Module["intArrayToString"]=intArrayToString;
function writeStringToMemory(string,buffer,dontAddNull){Runtime.warnOnce("writeStringToMemory is deprecated and should not be called! Use stringToUTF8()instead!");var lastChar,end;if(dontAddNull){end=buffer+lengthBytesUTF8(string);lastChar=HEAP8[end];}stringToUTF8(string,buffer,Infinity);if(dontAddNull){HEAP8[end]=lastChar;}}Module["writeStringToMemory"]=writeStringToMemory;
function writeArrayToMemory(array,buffer){HEAP8.set(array,buffer);}Module["writeArrayToMemory"]=writeArrayToMemory;
function writeAsciiToMemory(str,buffer,dontAddNull){for(var i=0;i<str.length;++i){HEAP8[buffer++>>0]=str.charCodeAt(i);}if(!dontAddNull){HEAP8[buffer>>0]=0;}}Module["writeAsciiToMemory"]=writeAsciiToMemory;
if(!Math["imul"] || Math["imul"](4294967295,5)!==-5){Math["imul"]=function imul(a,b){var ah=a>>>16;var al=a & 65535;var bh=b>>>16;var bl=b & 65535;return al * bl+(ah * bl+al * bh<<16)| 0;};}Math.imul=Math["imul"];
if(!Math["fround"]){var froundBuffer=new Float32Array(1);Math["fround"]=function(x){froundBuffer[0]=x;return froundBuffer[0];};}Math.fround=Math["fround"];
if(!Math["clz32"]){Math["clz32"]=function(x){x=x>>>0;for(var i=0;i<32;i++){if(x & 1<<31-i){return i;}}return 32;};}Math.clz32=Math["clz32"];
if(!Math["trunc"]){Math["trunc"]=function(x){return x<0 ? Math.ceil(x):Math.floor(x);};}Math.trunc=Math["trunc"];
var Math_abs=Math.abs;var Math_cos=Math.cos;var Math_sin=Math.sin;var Math_tan=Math.tan;var Math_acos=Math.acos;var Math_asin=Math.asin;var Math_atan=Math.atan;var Math_atan2=Math.atan2;var Math_exp=Math.exp;var Math_log=Math.log;var Math_sqrt=Math.sqrt;var Math_ceil=Math.ceil;var Math_floor=Math.floor;var Math_pow=Math.pow;var Math_imul=Math.imul;var Math_fround=Math.fround;var Math_round=Math.round;var Math_min=Math.min;var Math_clz32=Math.clz32;var Math_trunc=Math.trunc;
var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies);}}Module["addRunDependency"]=addRunDependency;function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies);}if(runDependencies==0){if(runDependencyWatcher !==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null;}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback();}} }Module["removeRunDependency"]=removeRunDependency;
Module["preloadedImages"]={};Module["preloadedAudios"]={};
var memoryInitializer = null;
function integrateWasmJS(Module) {
var method=Module["wasmJSMethod"] || "native-wasm";Module["wasmJSMethod"]=method;
var wasmTextFile=Module["wasmTextFile"] || module_name+".wast";var wasmBinaryFile=Module["wasmBinaryFile"] || module_name+".wasm";var asmjsCodeFile=Module["asmjsCodeFile"] || module_name+".temp.asm.js";
if(typeof Module["locateFile"]==="function"){wasmTextFile=Module["locateFile"](wasmTextFile);wasmBinaryFile=Module["locateFile"](wasmBinaryFile);asmjsCodeFile=Module["locateFile"](asmjsCodeFile);}
var wasmPageSize=64 * 1024;var asm2wasmImports={"f64-rem":function(x,y){return x % y;},"f64-to-int":function(x){return x | 0;},"i32s-div":function(x,y){return(x | 0)/(y | 0)| 0;},"i32u-div":function(x,y){return(x>>>0)/(y>>>0)>>>0;},"i32s-rem":function(x,y){return(x | 0)%(y | 0)| 0;},"i32u-rem":function(x,y){return(x>>>0)%(y>>>0)>>>0;},"debugger":function(){debugger;}};
var info = {"global":null, "env":null, "asm2wasm":asm2wasmImports, "parent":Module};
var exports = null;
function lookupImport(mod,base){var lookup=info;if(mod.indexOf(".")<0){lookup=(lookup ||{})[mod];}else{var parts=mod.split(".");lookup=(lookup ||{})[parts[0]];lookup=(lookup ||{})[parts[1]];}if(base){lookup=(lookup ||{})[base];}if(lookup===undefined){abort("bad lookupImport to("+mod+")."+base);}return lookup;}
function mergeMemory(newBuffer){var oldBuffer=Module["buffer"];if(newBuffer.byteLength<oldBuffer.byteLength){Module["printErr"]("the new buffer in mergeMemory is smaller than the previous one. in native wasm,we should grow memory here");}var oldView=new Int8Array(oldBuffer);var newView=new Int8Array(newBuffer);if(!memoryInitializer){oldView.set(newView.subarray(Module["STATIC_BASE"],Module["STATIC_BASE"]+Module["STATIC_BUMP"]),Module["STATIC_BASE"]);}newView.set(oldView);updateGlobalBuffer(newBuffer);updateGlobalBufferViews();}
var WasmTypes = {none:0, i32:1, i64:2, f32:3, f64:4};
function fixImports(imports){if(!0){return imports;}var ret={};for(var i in imports){var fixed=i;if(fixed[0]=="_"){fixed=fixed.substr(1);}ret[fixed]=imports[i];}return ret;}
function getBinary(){var binary;if(Module["wasmBinary"]){binary=Module["wasmBinary"];binary=new Uint8Array(binary);}else{if(Module["readBinary"]){binary=Module["readBinary"](wasmBinaryFile);}else{throw "on the web,we need the wasm binary to be preloaded and set on Module['wasmBinary']. emcc.py will do that for you when generating HTML(but not JS)";}}return binary;}
function getBinaryPromise(){if(!Module["wasmBinary"] && typeof fetch==="function"){return fetch(wasmBinaryFile).then(function(response){if(!response["ok"]){throw "failed to load wasm binary file at '"+wasmBinaryFile+"'";}return response["arrayBuffer"]();});}return new Promise(function(resolve,reject){resolve(getBinary());});}
function doNativeWasm(global,env,providedBuffer){if(typeof WebAssembly !=="object"){Module["printErr"]("no native wasm support detected");return false;}if(!(Module["wasmMemory"] instanceof WebAssembly.Memory)){Module["printErr"]("no native wasm Memory in use");return false;}env["memory"]=Module["wasmMemory"];info["global"]={"NaN":NaN,"Infinity":Infinity};info["global.Math"]=global.Math;info["env"]=env;function receiveInstance(instance){exports=instance.exports;if(exports.memory){mergeMemory(exports.memory);}Module["asm"]=exports;Module["usingWasm"]=true;removeRunDependency("wasm-instantiate");load_cb(MODULE);}addRunDependency("wasm-instantiate");if(Module["instantiateWasm"]){try{return Module["instantiateWasm"](info,receiveInstance);}catch(e){Module["printErr"]("Module.instantiateWasm callback failed with error:"+e);return false;}}getBinaryPromise().then(function(binary){return WebAssembly.instantiate(binary,info);}).then(function(output){receiveInstance(output["instance"]);})["catch"](function(reason){Module["printErr"]("failed to asynchronously prepare wasm:"+reason);Module["quit"](1,reason);});return{};}
Module["asmPreload"] = Module["asm"];
Module["reallocBuffer"]=function(size){var PAGE_MULTIPLE=Module["usingWasm"] ? WASM_PAGE_SIZE:ASMJS_PAGE_SIZE;size=alignUp(size,PAGE_MULTIPLE);var old=Module["buffer"];var oldSize=old.byteLength;if(Module["usingWasm"]){try{var result=Module["wasmMemory"].grow((size-oldSize)/ wasmPageSize);if(result !==(-1 | 0)){return Module["buffer"]=Module["wasmMemory"].buffer;}else{return null;}}catch(e){return null;}}else{exports["__growWasmMemory"]((size-oldSize)/ wasmPageSize);return Module["buffer"] !==old ? Module["buffer"]:null;}};
Module["asm"]=function(global,env,providedBuffer){global=fixImports(global);env=fixImports(env);if(!env["table"]){var TABLE_SIZE=Module["wasmTableSize"];if(TABLE_SIZE===undefined){TABLE_SIZE=1024;}var MAX_TABLE_SIZE=Module["wasmMaxTableSize"];if(typeof WebAssembly==="object" && typeof WebAssembly.Table==="function"){if(MAX_TABLE_SIZE !==undefined){env["table"]=new WebAssembly.Table({"initial":TABLE_SIZE,"maximum":MAX_TABLE_SIZE,"element":"anyfunc"});}else{env["table"]=new WebAssembly.Table({"initial":TABLE_SIZE,element:"anyfunc"});}}else{env["table"]=new Array(TABLE_SIZE);}Module["wasmTable"]=env["table"];}if(!env["memoryBase"])env["memoryBase"]=Module["STATIC_BASE"];if(!env["tableBase"])env["tableBase"]=0;return doNativeWasm(global,env,providedBuffer);};
var methodHandler = Module["asm"];
}
integrateWasmJS(Module);
var ASM_CONSTS=[];STATIC_BASE=Runtime.GLOBAL_BASE;STATICTOP=STATIC_BASE+static_bump;__ATINIT__.push();
memoryInitializer = Module["wasmJSMethod"].indexOf("asmjs") >= 0 || Module["wasmJSMethod"].indexOf("interpret-asm2wasm") >= 0 ? module_name+".js.mem" : null;
var STATIC_BUMP=static_bump;Module["STATIC_BASE"]=STATIC_BASE;Module["STATIC_BUMP"]=STATIC_BUMP;var tempDoublePtr=STATICTOP;STATICTOP+=16;
Module["wasmTableSize"]=wasm_table_size;Module["wasmMaxTableSize"]=wasm_table_size;Module["_memset"]=_memset;Module["_sbrk"]=_sbrk;Module["_memcpy"]=_memcpy;Module["_memmove"]=_memmove;
function _abort(){Module["abort"]();}function __exit(status){Module["exit"](status)}function _exit(status){__exit(status)}function ___lock(){}function ___unlock(){}
function _usleep(useconds){var msec=useconds/1e3;var start=self["performance"]["now"]();while(self["performance"]["now"]()-start<msec){}return 0}
function ___assert_fail(condition,filename,line,func){ABORT=true;throw"Assertion failed:"+Pointer_stringify(condition)+",at:"+[filename?Pointer_stringify(filename):"unknown filename",line,func?Pointer_stringify(func):"unknown function"]+" at "+stackTrace()}
function ___setErrNo(value){if(Module["___errno_location"]){HEAP32[Module["___errno_location"]()>>2]=value;}return value;}function _emscripten_memcpy_big(dest,src,num){HEAPU8.set(HEAPU8.subarray(src,src+num),dest);return dest;}
var SYSCALLS={varargs:0,get:function(varargs){SYSCALLS.varargs+=4;var ret=HEAP32[SYSCALLS.varargs-4>>2];return ret;},getStr:function(){var ret=Pointer_stringify(SYSCALLS.get());return ret;},get64:function(){var low=SYSCALLS.get(),high=SYSCALLS.get();if(low>=0){assert(high===0);}else{assert(high===-1);}return low;},getZero:function(){assert(SYSCALLS.get()===0);}};
function ___syscall6(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD();FS.close(stream);return 0;}catch(e){if(typeof FS==="undefined" || !(e instanceof FS.ErrnoError)){abort(e);}return-e.errno;}}
function ___syscall140(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.getStreamFromFD(),offset_high=SYSCALLS.get(),offset_low=SYSCALLS.get(),result=SYSCALLS.get(),whence=SYSCALLS.get();var offset=offset_low;FS.llseek(stream,offset,whence);HEAP32[result>>2]=stream.position;if(stream.getdents && offset===0 && whence===0){stream.getdents=null;}return 0;}catch(e){if(typeof FS==="undefined" || !(e instanceof FS.ErrnoError)){abort(e);}return-e.errno;}}
function ___syscall146(which,varargs){SYSCALLS.varargs=varargs;try{var stream=SYSCALLS.get(),iov=SYSCALLS.get(),iovcnt=SYSCALLS.get();var ret=0;if(!___syscall146.buffer){___syscall146.buffers=[null,[],[]];___syscall146.printChar=function(stream,curr){var buffer=___syscall146.buffers[stream];assert(buffer);if(curr===0 || curr===10){(stream===1 ? Module["print"]:Module["printErr"])(UTF8ArrayToString(buffer,0));buffer.length=0;}else{buffer.push(curr);}};}for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov+i * 8>>2];var len=HEAP32[iov+(i * 8+4)>>2];for(var j=0;j<len;j++){___syscall146.printChar(stream,HEAPU8[ptr+j]);}ret+=len;}return ret;}catch(e){if(typeof FS==="undefined" || !(e instanceof FS.ErrnoError)){abort(e);}return-e.errno;}}
function ___syscall54(which,varargs){SYSCALLS.varargs=varargs;try{return 0;}catch(e){if(typeof FS==="undefined" || !(e instanceof FS.ErrnoError)){abort(e);}return-e.errno;}}
__ATEXIT__.push(function(){var fflush=Module["_fflush"];if(fflush){fflush(0);}var printChar=___syscall146.printChar;if(!printChar){return;}var buffers=___syscall146.buffers;if(buffers[1].length){printChar(1,10);}if(buffers[2].length){printChar(2,10);}});
DYNAMICTOP_PTR=allocate(1,"i32",ALLOC_STATIC);STACK_BASE=STACKTOP=Runtime.alignMemory(STATICTOP);STACK_MAX=STACK_BASE+TOTAL_STACK;DYNAMIC_BASE=Runtime.alignMemory(STACK_MAX);HEAP32[DYNAMICTOP_PTR>>2]=DYNAMIC_BASE;staticSealed=true;
var setThrew=Module["setThrew"]=function(){return Module["asm"]["setThrew"].apply(null,arguments);};var _memmove=Module["_memmove"]=function(){return Module["asm"]["_memmove"].apply(null,arguments);};var _malloc=Module["_malloc"]=function(){return Module["asm"]["_malloc"].apply(null,arguments);};var _fflush=Module["_fflush"]=function(){return Module["asm"]["_fflush"].apply(null,arguments);};var _memset=Module["_memset"]=function(){return Module["asm"]["_memset"].apply(null,arguments);};var _sbrk=Module["_sbrk"]=function(){return Module["asm"]["_sbrk"].apply(null,arguments);};var _free=Module["_free"]=function(){return Module["asm"]["_free"].apply(null,arguments);};var _memcpy=Module["_memcpy"]=function(){return Module["asm"]["_memcpy"].apply(null,arguments);};var stackAlloc=Module["stackAlloc"]=function(){return Module["asm"]["stackAlloc"].apply(null,arguments);};var stackSave=Module["stackSave"]=function(){return Module["asm"]["stackSave"].apply(null,arguments);};var stackRestore=Module["stackRestore"]=function(){return Module["asm"]["stackRestore"].apply(null,arguments);};var getTempRet0=Module["getTempRet0"]=function(){return Module["asm"]["getTempRet0"].apply(null,arguments);};var setTempRet0=Module["setTempRet0"]=function(){return Module["asm"]["setTempRet0"].apply(null,arguments);};var ___errno_location=Module["___errno_location"]=function(){return Module["asm"]["___errno_location"].apply(null,arguments);};var runPostSets=Module["runPostSets"]=function(){return Module["asm"]["runPostSets"].apply(null,arguments);};var establishStackSpace=Module["establishStackSpace"]=function(){return Module["asm"]["establishStackSpace"].apply(null,arguments);};var _emscripten_get_global_libc=Module["_emscripten_get_global_libc"]=function(){return Module["asm"]["_emscripten_get_global_libc"].apply(null,arguments);};
//Not in all
var _llvm_bswap_i32=Module["_llvm_bswap_i32"]=function(){return Module["asm"]["_llvm_bswap_i32"].apply(null,arguments);};
//Not in all
function _llvm_stackrestore(p){var self=_llvm_stacksave;var ret=self.LLVM_SAVEDSTACKS[p];self.LLVM_SAVEDSTACKS.splice(p,1);Runtime.stackRestore(ret);}
//Not in all
function _llvm_stacksave(){var self=_llvm_stacksave;if(!self.LLVM_SAVEDSTACKS){self.LLVM_SAVEDSTACKS=[];}self.LLVM_SAVEDSTACKS.push(Runtime.stackSave());return self.LLVM_SAVEDSTACKS.length-1;}
//Not in all
var _llvm_pow_f64 = Math_pow;
//Not in all
Module["_llvm_bswap_i32"] = _llvm_bswap_i32;
//For every i:
function invoke_ii(index, a1){try{return Module["dynCall_ii"](index,a1);}catch(e){if(typeof e !== "number"&&e!=="longjmp"){throw e;}Module["setThrew"](1,0);}}
function invoke_iiii(index,a1,a2,a3){try{return Module["dynCall_iiii"](index,a1,a2,a3);}catch(e){if(typeof e !== "number"&&e!=="longjmp"){throw e;}Module["setThrew"](1,0);}}
function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7){try{return Module["dynCall_viiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);}catch(e){if(typeof e !== "number"&&e!=="longjmp"){throw e;}Module["setThrew"](1,0);}}
Module.asmGlobalArg = {"Math":Math, "Int8Array":Int8Array, "Int16Array":Int16Array, "Int32Array":Int32Array, "Uint8Array":Uint8Array, "Uint16Array":Uint16Array, "Uint32Array":Uint32Array, "Float32Array":Float32Array, "Float64Array":Float64Array, "NaN":NaN, "Infinity":Infinity};
Module.asmLibraryArg={"abort":abort,"assert":assert,"enlargeMemory":enlargeMemory,"getTotalMemory":getTotalMemory,"abortOnCannotGrowMemory":abortOnCannotGrowMemory,"___lock":___lock,"_abort":_abort,"___setErrNo":___setErrNo,"_usleep":_usleep,"___assert_fail":___assert_fail,"___syscall6":___syscall6,"___unlock":___unlock,"_emscripten_memcpy_big":_emscripten_memcpy_big,"___syscall54":___syscall54,"___syscall140":___syscall140,"___syscall146":___syscall146,"DYNAMICTOP_PTR":DYNAMICTOP_PTR,"tempDoublePtr":tempDoublePtr,"ABORT":ABORT,"STACKTOP":STACKTOP,"STACK_MAX":STACK_MAX,"_llvm_stackrestore":_llvm_stackrestore,"_llvm_stacksave":_llvm_stacksave,"_llvm_pow_f64":_llvm_pow_f64,"_exit":_exit,"__exit":__exit};
//For every i:
Module.invoke_ii = invoke_ii; Module.invoke_iiii = invoke_iiii; Module.invoke_viiiiiii = invoke_viiiiiii;
//For every i:
var dynCall_ii=Module["dynCall_ii"]=function(){return Module["asm"]["dynCall_ii"].apply(null,arguments);};var dynCall_iiii=Module["dynCall_iiii"]=function(){return Module["asm"]["dynCall_iiii"].apply(null,arguments);};var dynCall_viiiiiii=Module["dynCall_viiiiiii"]=function(){return Module["asm"]["dynCall_viiiiiii"].apply(null,arguments);};
var asm = Module["asm"](Module.asmGlobalArg, Module.asmLibraryArg, buffer);
Module["asm"] = asm;

//For every exported function FUNCNAME:
//var _FUNCNAME=Module["_FUNCNAME"]=function(){return Module["asm"]["_FUNCNAME"].apply(null, arguments);};

Runtime.stackAlloc=Module["stackAlloc"];Runtime.stackSave=Module["stackSave"];Runtime.stackRestore=Module["stackRestore"];Runtime.establishStackSpace=Module["establishStackSpace"];Runtime.setTempRet0=Module["setTempRet0"];Runtime.getTempRet0=Module["getTempRet0"];
Module["asm"] = asm;
if (memoryInitializer) {
if (typeof Module["locateFile"] === "function") memoryInitializer = Module["locateFile"](memoryInitializer);
else{if(Module["memoryInitializerPrefixURL"])memoryInitializer=Module["memoryInitializerPrefixURL"]+memoryInitializer;}
var doBrowserLoad=function(){Module["readAsync"](memoryInitializer,applyMemoryInitializer,function(){throw "could not load memory initializer "+memoryInitializer;});};
addRunDependency("memory initializer");
var applyMemoryInitializer=function(data){if(data.byteLength)data=new Uint8Array(data);HEAPU8.set(data,Runtime.GLOBAL_BASE);if(Module["memoryInitializerRequest"])delete Module["memoryInitializerRequest"].response;removeRunDependency("memory initializer");};
if(Module["memoryInitializerRequest"]){var useRequest=function(){var request=Module["memoryInitializerRequest"];if(request.status !==200 && request.status !==0){console.warn("a problem seems to have happened with Module.memoryInitializerRequest,status:"+request.status+",retrying "+memoryInitializer);doBrowserLoad();return;}applyMemoryInitializer(request.response);};if(Module["memoryInitializerRequest"].response){setTimeout(useRequest,0);}else{Module["memoryInitializerRequest"].addEventListener("load",useRequest);}}
else doBrowserLoad();
}
Module["then"]=function(func){if(Module["calledRun"])func(Module);else{var old=Module["onRuntimeInitialized"];Module["onRuntimeInitialized"]=function(){if(old)old();func(Module);};}return Module;};
function ExitStatus(status){this.name="ExitStatus";this.message="Program terminated with exit("+status+")";this.status=status;}
ExitStatus.prototype=new Error;ExitStatus.prototype.constructor=ExitStatus;var initialStackTop;var preloadStartTime=null;var calledMain=false;
dependenciesFulfilled=function runCaller(){if(!Module["calledRun"]){run();}if(!Module["calledRun"]){dependenciesFulfilled=runCaller;}};
Module["callMain"]=Module.callMain=function callMain(args){args=args || [];ensureInitRuntime();var argc=args.length+1;function pad(){for(var i=0;i<4-1;i++){argv.push(0);}}var argv=[allocate(intArrayFromString(Module["thisProgram"]),"i8",ALLOC_NORMAL)];pad();for(var i=0;i<argc-1;i=i+1){argv.push(allocate(intArrayFromString(args[i]),"i8",ALLOC_NORMAL));pad();}argv.push(0);argv=allocate(argv,"i32",ALLOC_NORMAL);try{var ret=Module["_main"](argc,argv,0);exit(ret,true);}catch(e){if(e instanceof ExitStatus){return;}else{if(e=="SimulateInfiniteLoop"){Module["noExitRuntime"]=true;return;}else{var toLog=e;if(e && typeof e==="object" && e.stack){toLog=[e,e.stack];}Module.printErr("exception thrown:"+toLog);Module["quit"](1,e);}} }finally{calledMain=true;}};
function run(args){args=args || Module["arguments"];if(preloadStartTime===null){preloadStartTime=Date.now();}if(runDependencies>0){return;}preRun();if(runDependencies>0){return;}if(Module["calledRun"]){return;}function doRun(){if(Module["calledRun"]){return;}Module["calledRun"]=true;if(ABORT){return;}ensureInitRuntime();preMain();if(Module["onRuntimeInitialized"]){Module["onRuntimeInitialized"]();}if(Module["_main"] && shouldRunNow){Module["callMain"](args);}postRun();}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(function(){setTimeout(function(){Module["setStatus"]("");},1);doRun();},1);}else{doRun();}}Module["run"]=Module.run=run;
function exit(status,implicit){if(implicit && Module["noExitRuntime"]){return;}if(Module["noExitRuntime"]){}else{ABORT=true;EXITSTATUS=status;STACKTOP=initialStackTop;exitRuntime();if(Module["onExit"]){Module["onExit"](status);}}Module["quit"](status,new ExitStatus(status));}Module["exit"]=Module.exit=exit;
var abortDecorators=[];function abort(what){if(what !==undefined){Module.print(what);Module.printErr(what);what=JSON.stringify(what);}else{what="";}ABORT=true;EXITSTATUS=1;var extra="\nIf this abort()is unexpected,build with-s ASSERTIONS=1 which can give more information.";var output="abort("+what+")at "+stackTrace()+extra;if(abortDecorators){abortDecorators.forEach(function(decorator){output=decorator(output,what);});}throw output;}Module["abort"]=Module.abort=abort;
if(Module["preInit"]){if(typeof Module["preInit"]=="function"){Module["preInit"]=[Module["preInit"]];}while(Module["preInit"].length>0){Module["preInit"].pop()();}}
var shouldRunNow = true;
if (Module["noInitialRun"]) shouldRunNow = false;
run();


}//»

globals.wasm = this;

}

