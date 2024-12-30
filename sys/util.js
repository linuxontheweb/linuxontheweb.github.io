
import { globals } from "config";

const {//«
	ALL_EXTENSIONS,
	EXT_TO_APP_MAP,
	APPICONS,
//	DEF_APP,
	NS,
	KC,
	EOF
}=globals;
//»

//Logging«
const trace = (args,num) => {//«
	let stack = (new Error()).stack;
	let s = stack.split("\n")[3];
	let arr = s.split(":");
	arr.pop();
	let str="";
	try{
		let line = arr.pop();
		let fname = arr.pop().split("/").pop().split("?")[0];
		str = `${fname}:${line}`;
	}catch(e){}
	if (num===0) console.log(...args,str);
	else if (num===1) console.warn(...args,str);
	else console.error(...args,str);
};//»
const log=(...args)=>{trace(args,0);}
const wrn = (...args) => {trace(args, 1);}
const cwarn = wrn;
const err=(...args)=>{trace(args,2);}
const cerr = err;
//»
const make=(which)=>{return document.createElement(which);}
const mk=make;
//Load/Script«

const normPath = (path, cwd)=>{//«
	if (!(path.match(/^\x2f/) || (cwd && cwd.match(/^\x2f/)))) {
cerr("normPath():INCORRECT ARGS:", path, cwd);
		return null;
	}
	if (!path.match(/^\x2f/) && cwd) path = cwd + "/" + path;
	let str = path.regpath();
	while (str.match(/\/\.\x2f/)) str = str.replace(/\/\.\x2f/, "/");
	str = str.replace(/\/\.$/, "");
	str = str.regpath();
	let arr = str.split("/");
	for (let i = 0; i < arr.length; i++) {
		if (arr[i] == "..") {
			arr.splice(i - 1, 2);
			i -= 2;
		}
	}
	let newpath = arr.join("/").regpath();
	if (!newpath) newpath = "/";
	return newpath;
}//»

const getNameExt = (fullname, if_fullpath, if_in_parts) => {//«
	let fullpath;
	if (fullname.match(/\x2f/)) {
		let arr = fullname.split("/");
		if (!arr[arr.length - 1]) arr.pop();
		fullname = arr.pop();
		fullpath = arr.join("/");
	}
	let marr;
	let ext = "";
	let name;
	if ((marr = fullname.match(/\.([_a-zA-Z][_a-zA-Z0-9]*)$/))) {
		let tryext = marr[1];
		if (ALL_EXTENSIONS.includes(tryext.toLowerCase())) {
			ext = tryext;
			name = fullname.replace(/\.([_a-zA-Z][_a-zA-Z0-9]*)$/, "");
		} else name = fullname;
	} else name = fullname;
	if (if_in_parts) return [fullpath, name, ext];
	if (if_fullpath) return [`${fullpath}/${name}`, ext];
	return [name, ext]
};//»
const getAppIcon=(arg,opts={})=>{//«
	let arr = arg.split(".");
	let app = arr.pop();
	if (app=="js" && arr.length) {
		app = arr.pop();
		if (app.match(/\x2f/)) app = app.split("/").pop();
	}
	let ch = APPICONS[app];
	if (!ch) return app[0];
	if (opts.html) return `&#x${ch};`;
	return eval(`"\\u{${ch}}"`);
};//»

const getMod = async(which, opts = {}) => {//«
	let if_static = opts.STATIC;
	let if_global = opts.global;
	let mods = NS.mods;
	let mod;
	if (mods[which]) {
		if (if_static || if_global) return (mods[which]);
		else return new mods[which]();
	} 
	let ret = await load_mod(which, opts);
	if (!ret) return;
	if (if_global) {
		mods[which] = which;
		NS.mods[which]();
		return mods[which];
	}
	if (if_static) {
		mods[which] = new NS.mods[which]();
		return mods[which];
	} 
	mods[which] = NS.mods[which];
	return new mods[which]();

};//»
const loadMod = (name, opts) => {return load_mod(name, opts);};

const makeScript=(path, opts)=>{return new Promise((Y,N)=>{make_script(path,Y,N,opts);});};
const fsUrl = (path) => {//«
	if (path) path = path.replace(/^\/+/, "");
	else path = "";
	return `filesystem:${window.location.origin}/temporary/${path}`;
}
//»
const locUrl = (port, path) => {//«
	let url = null;
	let base = `${window.location.protocol}//${window.location.hostname}:${port}`;
	if (!path) return base;
	return base + "/?path=/" + encodeURIComponent(path);
};
//»
const load_mod = async(modname, opts = {})=>{//«
return new Promise((cb,N)=>{
	let force = opts.FORCE;
	let call = opts.CALL;
	let trypath;

	let marr;

	if (!force && NS.mods[modname]) return cb(true);
	let path = modname.replace(/\./g, "/");
	let modpath = `/mods/${path}.js`;
	if (globals.dev_mode){
		let v = (Math.random()+"").slice(2,9);
		modpath+=`?v=${v}`;
	}
	let scr = document.createElement('script');
	scr.type = "module";
	scr.id=`script_mods.${modname}`;
	scr.onload = async() => {
		const { mod } = await import(modpath);
		NS.mods[modname] = mod;
		if (opts.noWrap) return cb(true);
		NS.mods[modname]._script = scr;
		if (call) NS.mods[modname]();
		cb(true);
	};
	scr.onerror = e => {
		cerr(e);
		cb();
	};
	scr.src = modpath;
	document.head.appendChild(scr);
});
};
//»
const make_script = (path, load, err, opts={}) => {//«
	let scr = make('script');
	if (opts.id) scr.id = opts.id;
	if (opts.random){
		if (path.match(/\?/)) path+="&";
		else path+="?";
		path += `v=${(Math.random()+"").slice(2,9)}`;
	}
	if (opts.module) {
		scr.type="module";
	}
	document.head.appendChild(scr);
	if (load) {
		scr.onload = () => {
			load(scr);
		};
	}
	if (err) {
		scr.onerror = e => {
			err(e, scr);
		};
		scr._onerror = e => {
			err(e, scr);
		};
	}
	scr.src = path;
	return scr;
};
//»
//»

const kc=(num,str)=>{if(num==KC[str])return true;return false;};

const dist=(x1,y1,x2,y2)=>{return(Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2)))};
const decompress = (blob, opts = {}) => {//«
return new Promise(async (y, n) => {
if (!(blob instanceof Blob)) return n("decompress expected Blob");
let which;
if (opts.deflate) which = "deflate";
else which = "gzip";
//		let blob = new Blob([arg]);
let ds = new DecompressionStream(which);
let stream = blob.stream().pipeThrough(ds);
let prom;
if (opts.toObj) prom = new Response(stream).json();
else if (opts.toBuf) prom = new Response(stream).arrayBuffer();
else if (opts.toBlob) prom = new Response(stream).blob();
else prom = new Response(stream).text();
y(await prom);
});
};//»
const compress = (arg, opts = {}) => {//«
return new Promise(async (y, n) => {
let input = await api.toBuf(arg);
let which;
if (opts.deflate) which = "deflate";
else which = "gzip";
let cs = new CompressionStream(which);
let writer = cs.writable.getWriter();
writer.write(input);
writer.close();
let arr = [];
let reader = cs.readable.getReader();
let sz = 0;
while (true) {
const {
value,
done
} = await reader.read();
if (done) break;
arr.push(value);
sz += value.byteLength;
}
let out = new Uint8Array(sz);
let off = 0;
for (let ar of arr) {
out.set(ar, off);
off += ar.byteLength;
}
if (opts.toBytes) return y(out);
if (opts.toBuf) return y(out.buffer);
y(new Blob([out]));
});
};//»

const copyarea=mk('textarea');

const gbid=id=>{return document.getElementById(id);};

const rand = (min,max)=>(Math.floor(Math.random()*(max-min+1))+min);
const strToBuf=s=>{return blobToBuf(new Blob([s],{type:"text/plain"}));};
const isStr=arg=>{return typeof arg==="string" || arg instanceof String;};
const isErr=arg=>{return arg instanceof Error;};
const isNum=arg=>{return((typeof arg==="number")||(arg instanceof Number));};
const isZero=arg=>{return arg===0;};
const isInt=arg=>{if(!isNum(arg))return false;return !((arg+"").match(/\./));};
const hashsum=(which,arg)=>{return new Promise(async(Y,N)=>{let doit=buf=>{crypto.subtle.digest(which,buf).then(ret=>{let arr=new Uint8Array(ret);let str='';for(let ch of arr)str+=ch.toString(16).lpad(2,"0");Y(str);}).catch(e=>{N(e);})};if(!crypto.subtle)return Y("FAKE-HASH-SUM-NO-CRYPTO.SUBTLE");if(isStr(arg))doit(await strToBuf(arg));else if(arg instanceof Blob)doit(await blobToBuf(arg));else if(arg instanceof ArrayBuffer)doit(arg);else if(arg && arg.buffer instanceof ArrayBuffer)doit(arg.buffer);else N("Core.api.hashsum called without a valid type\x20(String,\xa0Blob,\xa0,TypedArray,\xa0or ArrayBuffer!)");});};
const isObj=arg=>{return (arg && typeof arg === "object"&& typeof arg.length === "undefined");};
const strNum=(str,min,max,if_exclude_min)=>{let num=null;if(isNum(str))return str;if(!isStr(str))return;if(str.match(/^-?[0-9]+$/))num=parseInt(str);else if(str.match(/^-?([0-9]+)?\.[0-9]+$/))num=parseFloat(str);if(isNum(min)){if(if_exclude_min && num<=min)return null;else if(num<min)return null;}if(isNum(max)&& num>max)return null;return num;};
const isArr=arg=>{return (arg && typeof arg === "object" && typeof arg.length !== "undefined");};
const isBool=arg=>{return typeof arg === "boolean";};
const bufToStr=arg=>{return (new TextDecoder('utf-8').decode(new DataView(arg)));};
const blobToBuf=b=>{return new Promise((Y,N)=>{let rdr=new FileReader();rdr.onloadend=()=>{Y(rdr.result);};rdr.onerror=N;rdr.readAsArrayBuffer(b);});};
const toBlob=val=>{let blob;if(isStr(val))blob=new Blob([val]);else if(val instanceof Uint8Array)blob=new Blob([val.buffer]);else if(val instanceof ArrayBuffer)blob=new Blob([val]);else if(val instanceof Blob)blob=val;return blob;};
const toBuf=dat=>{if(!dat)return null;if(dat instanceof ArrayBuffer)return dat;if(dat.buffer instanceof ArrayBuffer)return dat.buffer;if(isStr(dat))return strToBuf(dat);if(isArr(dat)&& isStr(dat[0]))return strToBuf(dat.join("\n"));if(dat instanceof Blob)return blobToBuf(dat);if(typeof dat==="object"){try{return strToBuf(JSON.stringify(dat));}catch(e){};}return null;};
const blobToStr=b=>{return new Promise(async(Y,N)=>{Y(bufToStr(await blobToBuf(b)));});};
const bytesToStr=bytearg=>{let bytes2str=(bytes)=>{let arr=[];for(let i=0;i<bytes.length;i++)arr[i]=String.fromCharCode(bytes[i]);return arr.join("");};if(bytearg instanceof ArrayBuffer){let tmp=new Uint8Array(bytearg);bytearg=tmp;}if(bytearg.buffer){try{var decoder=new TextDecoder('utf-8');var view=new DataView(bytearg.buffer);return decoder.decode(view);}catch(e){return bytes2str(bytearg);}}else if(typeof bytearg==="string")return bytearg;};
const toStr=dat=>{if(typeof dat==="string" || dat instanceof String)return dat;if(dat instanceof ArrayBuffer || dat.buffer instanceof ArrayBuffer)return bytesToStr(dat);if(dat instanceof Blob)return blobToStr(dat);try{return dat.toString();}catch(e){}console.error("Unknown object in to capi.toStr");};
const sharedStart=(array)=>{//«
	let A= array.concat().sort(), 
	a1= A[0], a2= A[A.length-1], L= a1.length, i= 0;
	while(i<L && a1.charAt(i)=== a2.charAt(i)) i++;
	return a1.substring(0, i);
};//»
const linesToParas = lns => {//«
	let paras = [];
	let curln = "";
	for (let ln of lns){
		if (ln.match(/^\s*$/)){
			if (curln) {
				paras.push(curln);
				curln = "";
			}
			paras.push("");
			continue;
		}
		if (ln.match(/-\s*$/)) ln = ln.replace(/-\s+$/,"-");
		else ln = ln.replace(/\s*$/," ");
		curln = curln + ln;
	}
	if (curln) paras.push(curln);
	return paras;
}//»
const consoleLog = new class{//«

#data;
#cbs;
constructor(){//«
	this.#data=[];
/*
	this.#data=[
{n: "Glark Is Good!!! (wuz 'ROOM ROOM ROOM')", i: 0, v:true},
{n: "Glark Is Good!!! (wuz 'ROOM ROOM ROOM')", i: 1, v:"Funkemp Oimpt"},
{n: "Glark Is Good!!! (wuz 'ROOM ROOM ROOM')", i: 2, v:{a: 1, b: "fruit", c: false, d: [1,2,3], slorch: 12345, grampannyyy: "ZZVLUG"}},
{n: "#4", v:[1,2,3,{hwanj: "Fladdd or naddd"}]},
{n: "#5", i: 0, v:false},
{n: "#5", i: 1, v:"Cherngeee hernjjjj"},
{n: "#5", i: 2, v:{slumpch: -12345}},
{n: "#8", v:[1,2,3,4,5]},
{n: "#9", v:"GWUBBBBBB!!!!!!! GWUBBBBBBBB!!!!!!!!!!!!"},
{n: "#10", v:[true, false, "har", "ho"]},
{n: "#11", v:12345.678}
	];
*/
	this.#cbs=[];
}//»
nlog(name, ...args){//«
	if (!(isStr(name) && name.length && name.match(/[a-z]+/i))){
		cwarn("String name not given or invalid");
		return;
	}
	let len = args.length;
	if (len===1){
//		this.#data.push({n: name, v: args[0]});
		this.#data.unshift({n: name, v: args[0]});
	}
	else{
		for (let i=0; i < args.length; i++){
//			this.#data.push({n: name, i, v: args[i]});
			this.#data.unshift({n: name, i, v: args[i]});
		}
	}
	this.refresh();
}//»
log(...args){//«
	let len_str = `#${this.#data.length+1}`;
	if (args.length===1){
//		this.#data.push({n: len_str, v: args[0]});
		this.#data.unshift({n: len_str, v: args[0]});
	}
	else {
		for (let i=0; i < args.length; i++){
//			this.#data.push({n: len_str , i, v: args[i]});
			this.#data.unshift({n: len_str , i, v: args[i]});
		}
	}
	this.refresh();
}//»
rmCb(cb){//«
if (!(cb instanceof Function)){
cerr("The provided argument is not a Function");
return;
}
	let ind = this.#cbs.indexOf(cb);
	if (ind < 0){
cerr("The callback is not registered");
log(cb);
		return;
	}
	this.#cbs.splice(cb, 1);
}//»
addCb(cb){//«
if (!(cb instanceof Function)){
cerr("The provided argument is not a Function");
return;
}
	this.#cbs.push(cb);
}//»
clear(){//«
this.#data.splice(0, this.#data.length);
this.refresh(true);
}//»
refresh(if_clear){//«
for (let cb of this.#cbs) cb(if_clear);
}//»
getLog(){return this.#data;}

};//»

export const util = (()=>{//«

return {
consoleLog,
getStrPer:val=>{
	let marr;
	if (isStr(val) && (marr = val.match(/^([0-9]+(\.[0-9]+)?)%$/))){
		return parseFloat(marr[1])/100;
	}
},
isEOF:arg=>arg===EOF,
getList: async(path)=>{//«
	if (globals.lists[path]) {
		return globals.lists[path];
	}
	let pathlen = path.length;
	let out=[];
	const getlist = (dir)=>{
		let kids = dir.kids;
		let keys = Object.keys(dir.kids);
		for (let k of keys){
			if (k.match(/^\./)) continue;
			let kid = kids[k];
			if (kid.kids) getlist(kid);
			else {
				out.push(kid.fullpath.substr(pathlen).replace(/\.js$/,"").replace(/\x2f/g, "."));
			}
		}
	};
	let dir = await path.toNode();
	getlist(dir);
	globals.lists[path] = out;
	return out;
},//»
lowToHigh:(a,b)=>{if (a<b) return -1; else if (a>b) return 1; return 0;},
highToLow:(a,b)=>{if (a<b) return 1; else if (a>b) return -1; return 0;},
dist,
linesToParas,
//detectClick,
//detectSwipe,
sharedStart,
getMod,
loadMod,
makeScript,
fsUrl,
locUrl,
normPath,
getAppIcon,
compress,
decompress,
blobToStr,
bytesToStr,
toStr,
getNameExt,
toBuf,
toBlob,
isNum,
isBool,
isInt,
isArr,
isZero,
isErr,
isStr,
isObj,
strToBuf,
bufToStr,

getFullPath: (path, cur_dir) => {//«
if (!path) return;
if (path.match(/^\x2f/)) return path;
if (!cur_dir) {
cwarn(`getFullPath:\x20No cur_dir given with relative path: ${path}`);
return;
}
let usedir;
if (cur_dir == "/") usedir = "/";
else usedir = cur_dir + "/";
return normPath(usedir + path);
},
//»
newPathIsBad: (oldpath, newpath) => {//«
if (newpath.length > oldpath.length && newpath.slice(0, oldpath.length) === oldpath && newpath[oldpath.length] === "/") return true;
return false;
},//»
spliceIn:(basearr, newarr,pos,lenarg)=>{//«
let uselen=newarr.length;
if(lenarg || lenarg==0)uselen=lenarg;
let args=[pos,uselen].concat(newarr);
Array.prototype.splice.apply(basearr, args);
return basearr;
},//»
uniq:arr=>{return arr.filter((value,index,array)=>{return array.indexOf(value)===index;});},
extToApp: (arg) => {
	let ext = arg.split(".").pop();
	if (!ext) return;
	return EXT_TO_APP_MAP[ext.toLowerCase()];
},
clipCopy:s=>{copyarea.value=s;copyarea.select();document.execCommand("copy");},
setEnv:(k,v)=>{ENV[k]=v;},
getEnv:k=>{return ENV[k];},
delEnv:k=>{return ENV[k];},
toBytes:dat=>{return new Promise(async(Y,N)=>{let buf=await toBuf(dat);if(!buf)return Y(null);Y(new Uint8Array(buf));});},
jlog:obj=>{log(JSON.stringify(obj,null,"  "));},
center: (elem, usewin, dims) => {
	let usew = window.innerWidth;
	let useh = window.innerHeight;
	let r;
	if (usewin) {
		if (usewin.main) r = usewin.main.getBoundingClientRect();
		else r = usewin.getBoundingClientRect();
		usew = r.width;
		useh = r.height;
	}
	r = elem.getBoundingClientRect();
	let elemw = r.width;
	let elemh = r.height;
	if (dims) {
		elemw = dims.X;
		elemh = dims.Y;
	}
	let usex = (usew / 2) - (elemw / 2);
	let usey = (useh / 2) - (elemh / 2);
	if (usex < 0) usex = 0;
	if (usey < 0) usey = 0;
	elem._x = usex;
	elem._y = usey;
},
pathParts:arg=>{return getNameExt(arg, true, true);},
getKeys:obj=>{if(!obj)obj={};let arr=Object.keys(obj);let ret=[];for(let k of arr)if(obj.hasOwnProperty(k))ret.push(k);return ret;},
textToBytes:async s=>{return new Uint8Array(await strToBuf(s));},
//isEOF:arg=>{if(isObj(arg)){if(arg.EOF ||(arg.lines&&arg.lines.EOF))return true;}return false;},
blobAsBytes:blob=>{return new Promise((Y,N)=>{let reader=new FileReader();reader.onloadend=()=>{Y(new Uint8Array(reader.result));};reader.onerror=N;reader.readAsArrayBuffer(blob);});},
download:(blob,name)=>{if(!name)name="LOTW_DL";if(typeof blob=="string")blob=new Blob([blob],{type:"text/plain"});let url=URL.createObjectURL(blob);let a=make('a');a.href=url;a.download=name;a._dis="none";document.body.appendChild(a);a.click();a._del();},
evt2Sym:e=>{let mod_str="";if(e.ctrlKey)mod_str="C";if(e.altKey)mod_str+="A";if(e.shiftKey)mod_str+="S";return(KC[e.keyCode]+"_"+mod_str);},gbid:gbid,
isPosInt:arg=>{return isInt(arg)&&arg>0;},
isNegInt:arg=>{return isInt(arg)&&arg<0;},
isPos:arg=>{return isNum(arg)&& arg>0;},
isNeg:arg=>{return isNum(arg)&& arg<0;},
isNotNeg:arg=>{return isNum(arg)&& arg>=0;},
is0:isZero,
isNull:arg=>{return (arg===null||arg===undefined);},
isArr:arg=>{return (arg && typeof arg === "object" && typeof arg.length !== "undefined");},
isJSArr:arg=>{return (arg && typeof arg === "object" && arg.constructor.name==="Array");},
isId:str=>{return !!(str && str.match && str.match(/^[_a-zA-Z][_a-zA-Z0-9]*$/));},
isFunc:arg=>{return (arg instanceof Function);},
isBlob:arg=>{return (arg instanceof Blob);},
isFin: Number.isFinite,
strNum:strNum,
strNumMinEx:(str,num)=>{return strNum(str,num,null,true);},

typeOf:arg=>{if(isStr(arg))return "string";if(isArr(arg))return "array";if(isObj(arg))return "object";if(isNum(arg))return "number";if(isBool(arg))return "boolean";if(arg===null)return "null";if(arg===undefined)return "undefined";if(isNaN(arg))return "NaN";return "???";},

tmStamp:()=>{return Math.floor(Date.now()/1000);},

sha1:arg=>{return hashsum("SHA-1",arg);},
sha256:arg=>{return hashsum("SHA-256",arg);},
sha384:arg=>{return hashsum("SHA-384",arg);},
sha512:arg=>{return hashsum("SHA-512",arg);},
make,
mk:make,
mkbut:s=>{let d=document.createElement('button');if(s)d.innerHTML=s;return d;},
mkdv:s=>{let d=document.createElement('div');if(s)d.innerHTML=s;return d;},
mksp:s=>{let d=document.createElement('span');if(s)d.innerHTML=s;return d;},
mktxt:str=>{if(!str)str="";return document.createTextNode(str);},
text:str=>{return document.createTextNode(str);},
bodyact:()=>{if(document.body==document.activeElement)return true;return false;},
clear:()=>{window.getSelection().removeAllRanges();},
noprop:e=>{e.stopPropagation();},
rand:rand,
randCol: (op) =>{//«
if (Number.isFinite(op)) return (`rgba(${rand(0,255)},${rand(0,255)},${rand(0,255)},${op})`)
return (`rgb(${rand(0,255)},${rand(0,255)},${rand(0,255)})`)
},//»
randStr:(numarg, ifdash)=>{//«
let got = 0;
let retstr = "";
let gotit = null;
let do_batch=()=>{
let arr = new Uint16Array(2);
window.crypto.getRandomValues(arr);
let iter=0;
while (iter < 2) {
let n = parseInt(arr[iter], 16);
if (n >= 48 && n <= 57 || n >= 65 && n <= 90 || n >= 97 && n <= 122 || n == 95 || (ifdash && n == 45)){
if (got == numarg) return true;
got++;
retstr += String.fromCharCode(n);
}
iter++;
}
return null;
};
if (typeof(numarg) == "number" && numarg > 0 && numarg <= 250) {
while (!do_batch()){}
return retstr;
}
else throw new Error("Invalid arg to randstr");
},//»
numberLines:arr=>{if(!arr)arr=[];let tmp=[];let num=0;let numwid=(arr.length+"").length;for(let ln of arr){let numstr=(++num)+"";tmp.push(("0".repeat(numwid-numstr.length)+numstr)+ "\x20"+ln);}return tmp;},
sleep: (ms)=>{//«
    if (!Number.isFinite(ms)) ms = 0;
    return new Promise((Y,N)=>{
        setTimeout(Y, ms);
    });
},//»
//sleep: (ms)=>{return new Promise((Y,N)=>{setTimeout(Y, ms);});},
log,
wrn,
err,
cwarn,
cerr,
kc,
gbid:gbid,
detectClick:()=>{
cwarn("NO detectClick");
},
detectSwipe:()=>{
cwarn("NO detectSwipe");
},
}

})();
NS.api.util = util;
//»
NS.api.util = util;


