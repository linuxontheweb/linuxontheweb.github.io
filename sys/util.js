
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
const mkdv=s=>{
	let d=document.createElement('div');
	if(s)d.innerHTML=s;
	return d;
};
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
const isArr=arg=>{return (arg && typeof arg === "object" && typeof arg.length !== "undefined");};
const isObj=arg=>{return (arg && typeof arg === "object"&& typeof arg.length === "undefined");};
const isBool=arg=>{return typeof arg === "boolean";};
const isDef=arg=>{
	let typ = typeof arg;
	return (
		typ === "boolean" ||
		typ === "number" ||
		typ === "string" || 
		arg instanceof Boolean ||
		arg instanceof Number ||
		arg instanceof String ||
		(arg && typ === "object")
	);
}
const hashsum=(which,arg)=>{return new Promise(async(Y,N)=>{let doit=buf=>{crypto.subtle.digest(which,buf).then(ret=>{let arr=new Uint8Array(ret);let str='';for(let ch of arr)str+=ch.toString(16).lpad(2,"0");Y(str);}).catch(e=>{N(e);})};if(!crypto.subtle)return Y("FAKE-HASH-SUM-NO-CRYPTO.SUBTLE");if(isStr(arg))doit(await strToBuf(arg));else if(arg instanceof Blob)doit(await blobToBuf(arg));else if(arg instanceof ArrayBuffer)doit(arg);else if(arg && arg.buffer instanceof ArrayBuffer)doit(arg.buffer);else N("Core.api.hashsum called without a valid type\x20(String,\xa0Blob,\xa0,TypedArray,\xa0or ArrayBuffer!)");});};
const strNum=(str,min,max,if_exclude_min)=>{let num=null;if(isNum(str))return str;if(!isStr(str))return;if(str.match(/^-?[0-9]+$/))num=parseInt(str);else if(str.match(/^-?([0-9]+)?\.[0-9]+$/))num=parseFloat(str);if(isNum(min)){if(if_exclude_min && num<=min)return null;else if(num<min)return null;}if(isNum(max)&& num>max)return null;return num;};
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
const linesToParas = (lns, opts={}) => {//«
	if (isStr(lns)) lns = lns.split("\n");
	let paras = [];
	let curln = "";
	for (let ln of lns){
		if (ln.match(/^\s*$/)){
			if (curln) {
				paras.push(curln);
				curln = "";
			}
			if (!opts.skipNLs) paras.push("");
			continue;
		}
		if (ln.match(/^\s+\w+/)){
			if (curln) {
				paras.push(curln);
//				curln = "";
				curln = "";
			}
//			paras.push(ln);
//			curln = ln;
//			continue;
		}
		if (ln.match(/-\s*$/)) ln = ln.replace(/-\s+$/,"-");
		else ln = ln.replace(/\s*$/," ");
		curln = curln + ln;
	}
	if (curln) paras.push(curln);
	if (opts.toStr) return paras.join("\n");
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
const isFin = Number.isFinite;
const mkOverlay=(opts={})=>{//«
	let op = opts.op || 0.66;
	let fakediv = make('div');
	fakediv.innerHTML = `<div style="opacity: ${op};border-radius: 15px; font-size: xx-large; padding: 0.2em 0.5em; position: absolute; -webkit-user-select: none; transition: opacity 180ms ease-in; color: rgb(16, 16, 16); background-color: rgb(240, 240, 240); font-family: monospace;"></div>`;
	let overlay = fakediv.childNodes[0];
	if (opts.id) overlay.id = "overlay_"+opts.id;
	return overlay;
};//»

export const util = (()=>{//«

return {

GetPoint: class {//«

constructor(baseDiv) {//«
	this.baseDiv = baseDiv;
	this.activeSector = baseDiv;
	this.crosshair = null;
	this.crosshairX = 0;
	this.crosshairY = 0;
	this.sectors = new Map();
	this.overlays = new Map();
	this.quadrantKeys = { s: 'M', w: 'N', e: 'NE', d: 'E', c: 'SE', x: 'S', z: 'SW', a: 'W', q: 'NW' };
	this.quadrantLines = null;
	this.initCrosshair();
	this.initQuadrantLines();
}//»
initCrosshair() {//«
	if (this.crosshair) this.crosshair.remove();
	this.crosshair = mkdv();
	this.crosshair.style.position = 'absolute';
	this.crosshair.style.width = '100%';
	this.crosshair.style.height = '100%';
	this.crosshair.style.pointerEvents = 'none';

	const vAxis = mkdv();
	vAxis.style.position = 'absolute';
	vAxis.style.width = '1px';
	vAxis.style.height = '100%';
//	vAxis.style.backgroundColor = 'red';
	vAxis.style.backgroundColor = 'rgba(255,0,0,0.5)';
	vAxis.style.left = '50%';

	const hAxis = mkdv();
	hAxis.style.position = 'absolute';
	hAxis.style.width = '100%';
	hAxis.style.height = '1px';
//	hAxis.style.backgroundColor = 'red';
	hAxis.style.backgroundColor = 'rgba(255,0,0,0.5)';
	hAxis.style.top = '50%';

	this.crosshair.appendChild(vAxis);
	this.crosshair.appendChild(hAxis);
	this.activeSector.appendChild(this.crosshair);
	this.crosshairX = this.activeSector.offsetWidth / 2;
	this.crosshairY = this.activeSector.offsetHeight / 2;
	this.updateCrosshair();
}//»
initQuadrantLines() {//«
	if (this.quadrantLines) this.quadrantLines.remove();
	this.quadrantLines = mkdv();
	this.quadrantLines.style.position = 'absolute';
	this.quadrantLines.style.width = '100%';
	this.quadrantLines.style.height = '100%';
	this.quadrantLines.style.pointerEvents = 'none';

	const width = this.activeSector.offsetWidth / 3;
	const height = this.activeSector.offsetHeight / 3;

	const vLine1 = mkdv();
	vLine1.style.position = 'absolute';
	vLine1.style.width = '1px';
	vLine1.style.height = '100%';
	vLine1.style.backgroundColor = 'rgba(128,128,128,0.3)';
	vLine1.style.left = `${width}px`;

	const vLine2 = mkdv();
	vLine2.style.position = 'absolute';
	vLine2.style.width = '1px';
	vLine2.style.height = '100%';
	vLine2.style.backgroundColor = 'rgba(128,128,128,0.3)';
	vLine2.style.left = `${2 * width}px`;

	const hLine1 = mkdv();
	hLine1.style.position = 'absolute';
	hLine1.style.width = '100%';
	hLine1.style.height = '1px';
	hLine1.style.backgroundColor = 'rgba(128,128,128,0.3)';
	hLine1.style.top = `${height}px`;

	const hLine2 = mkdv();
	hLine2.style.position = 'absolute';
	hLine2.style.width = '100%';
	hLine2.style.height = '1px';
	hLine2.style.backgroundColor = 'rgba(128,128,128,0.3)';
	hLine2.style.top = `${2 * height}px`;

	this.quadrantLines.appendChild(vLine1);
	this.quadrantLines.appendChild(vLine2);
	this.quadrantLines.appendChild(hLine1);
	this.quadrantLines.appendChild(hLine2);
	this.activeSector.appendChild(this.quadrantLines);
}//»
updateCrosshair() {//«
	const vAxis = this.crosshair.children[0];
	const hAxis = this.crosshair.children[1];
	vAxis.style.left = `${this.crosshairX}px`;
	hAxis.style.top = `${this.crosshairY}px`;
}//»
onKey(key) {//«
	if (!(key in this.quadrantKeys)) return;
	const quadrant = this.quadrantKeys[key];
	const sectorRect = this.activeSector.getBoundingClientRect();
	const width = sectorRect.width / 3;
	const height = sectorRect.height / 3;
	const offsets = {
		N: { x: width, y: 0 },
		NE: { x: 2 * width, y: 0 },
		E: { x: 2 * width, y: height },
		SE: { x: 2 * width, y: 2 * height },
		S: { x: width, y: 2 * height },
		SW: { x: 0, y: 2 * height },
		W: { x: 0, y: height },
		NW: { x: 0, y: 0 },
		M: { x: width, y: height }
	};

	const newSector = mkdv();
	newSector.style.position = 'absolute';
	newSector.style.width = `${width}px`;
	newSector.style.height = `${height}px`;
	newSector.style.left = `${offsets[quadrant].x}px`;
	newSector.style.top = `${offsets[quadrant].y}px`;
	this.activeSector.appendChild(newSector);
	this.sectors.set(newSector, this.activeSector);

	for (const q in offsets) {
		if (q !== quadrant) {
			const overlay = mkdv();
			overlay.style.position = 'absolute';
			overlay.style.width = `${width}px`;
			overlay.style.height = `${height}px`;
			overlay.style.left = `${offsets[q].x}px`;
			overlay.style.top = `${offsets[q].y}px`;
			overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
			this.activeSector.appendChild(overlay);
			this.overlays.set(newSector, (this.overlays.get(newSector) || []).concat(overlay));
		}
	}

	this.activeSector = newSector;
	this.initCrosshair();
	this.initQuadrantLines();
}//»
onUp() {//«
	const step = this.activeSector.offsetHeight * 0.05;
	this.crosshairY = Math.max(0, this.crosshairY - step);
	this.updateCrosshair();
}//»
onDown() {//«
	const step = this.activeSector.offsetHeight * 0.05;
	this.crosshairY = Math.min(this.activeSector.offsetHeight, this.crosshairY + step);
	this.updateCrosshair();
}//»
onLeft() {//«
	const step = this.activeSector.offsetWidth * 0.05;
	this.crosshairX = Math.max(0, this.crosshairX - step);
	this.updateCrosshair();
}//»
onRight() {//«
	const step = this.activeSector.offsetWidth * 0.05;
	this.crosshairX = Math.min(this.activeSector.offsetWidth, this.crosshairX + step);
	this.updateCrosshair();
}//»
onEscape() {//«
	if (this.activeSector === this.baseDiv) return false;
	const parentSector = this.sectors.get(this.activeSector);
	(this.overlays.get(this.activeSector) || []).forEach(overlay => overlay.remove());
	this.overlays.delete(this.activeSector);
	this.activeSector.remove();
	this.sectors.delete(this.activeSector);
	this.activeSector = parentSector;
	this.initCrosshair();
	this.initQuadrantLines();
	return true;
}//»
onSelect(isAbsolute) {//«
	const rect = this.crosshair.getBoundingClientRect();
	const point = {
		x: rect.left + this.crosshairX,
		y: rect.top + this.crosshairY
	};
	if (!isAbsolute) {
		const baseRect = this.baseDiv.getBoundingClientRect();
		point.x -= baseRect.left;
		point.y -= baseRect.top;
	}
	return point;
}//»

},//»
mkOverlay,
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
isDef,//is a defined value (string, boolean, number, object)
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
clipCopy:s=>{
	navigator.clipboard.writeText(s)
//	copyarea.value=s;
//	copyarea.select();
//	document.execCommand("copy");
},
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
//isFin: Number.isFinite,
isFin,
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
mkdv,
mkbut:s=>{let d=document.createElement('button');if(s)d.innerHTML=s;return d;},
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

//System-wide prototypes«

Array.prototype.uniqSort=function(opts={}){//«
    if (opts.hiToLow){
        return [...new Set(this)].sort((a,b)=>{if (a<b)return 1; if (a>b) return -1;})
    }   
    else {
        return [...new Set(this)].sort((a,b)=>{if (a<b)return -1; if (a>b) return 1;})
    }   
}//»
Array.prototype.uniq=function(opts={}){return [...new Set(this)];}

const doParseNumber = (thisarg, opts, if_float) => {//«
	if (thisarg.match(/^0+$/)) thisarg="0";
	const dec = /^([-+])?[0-9]+(e[-+]?([0-9]+))?$/i,
		dec_dot = /^([-+])?([0-9]+)?\.[0-9]*(e[-+]?([0-9]+))?$/i,
		hex = /^([-+])?0x[0-9a-f]+$/i,
		oct = /^([-+])?0o[0-7]+$/,
		bin = /^([-+])?0b[01]+$/;
	let MIN = -Infinity;
	let MAX = Infinity;
	let KEYS = ["POS", "NEG", "NOTNEG", "NOTPOS", "NOTZERO", "MIN", "MAX", "DOTOK"];
	let val;
	let str;
	if (!opts) opts = {};
	for (let k of Object.keys(opts)) {
		if (!KEYS.includes(k)) throw new Error("Invalid option:" + k);
	}
	if (Number.isInteger(opts.MIN)) MIN = opts.MIN;
	else if (opts.MIN) throw new Error("Invalid value to MIN:" + opts.MIN);
	if (Number.isInteger(opts.MAX)) MAX = opts.MAX;
	else if (opts.MAX) throw new Error("Invalid value to MAX:" + opts.MAX);

	if (thisarg.match(dec) || thisarg.match(dec_dot)) {
		if (thisarg == "0") str = thisarg;
		else str = thisarg.replace(/^0+/, "");
	} else str = thisarg;
	if (str.match(dec) || str.match(hex) || str.match(oct) || str.match(bin)) val = eval(str);
	else {
		if ((if_float || opts.DOTOK) && (str.match(dec_dot))) {
			if (if_float) val = eval(str);
			else val = Math.floor(eval(str));
		} else return NaN;
	}
	if (opts.POS && val <= 0) return NaN;
	if (opts.NEG && val >= 0) return NaN;
	if (opts.NOTNEG && val < 0) return NaN;
	if (opts.NOTPOS && val > 0) return NaN;
	if (opts.NOTZERO && val == 0) return NaN;
	if (val < MIN) return NaN;
	if (val > MAX) return NaN;
	return val;
};//»

const set_style_props_1 = (which, arr) => {//«
	for (var i = 0; i < arr.length; i += 2) {
		(function(k, v) {
			Object.defineProperty(which.prototype, k, {
				get: function() {
					return this.style[v];
				},
				set: function(arg) {
					this.style[v] = arg;
				}
			});
		})(arr[i], arr[i + 1]);
	}
}//»
const set_style_props_2 = (which, arr) => {//«
	for (var i = 0; i < arr.length; i += 2) {
		(function(k, v) {
			Object.defineProperty(which.prototype, k, {
				get: function() {
					return parseInt(this.style[v]);
				},
				set: function(arg) {
					if (isFin(arg)) this.style[v]=`${arg}px`;
					else this.style[v]= arg;
				}
			});
		})(arr[i], arr[i + 1]);
	}
}//»

set_style_props_1(HTMLElement,//«
[

// !! If anything is ever inserted up to the _END_, the CSS_PX_NUMBER_START_POS **MUST** be updated !!

"_fw","fontWeight",
"_tcol","color",
"_bgcol","backgroundColor",
"_bor", "border",
"_pos","position",
"_dis","display",
"_op", "opacity",
"_ta", "textAlign",
"_ff", "fontFamily",
"_over", "overflow",
"_overx", "overflowX",
"_overy", "overflowY",
"_z", "zIndex"

]);
//»
set_style_props_2(HTMLElement,//«
[
"_fs","fontSize",
"_pad", "padding",
"_padt", "paddingTop",
"_padb", "paddingBottom",
"_padl", "paddingLeft",
"_padr", "paddingRight",
"_mar", "margin",
"_mart", "marginTop",
"_marb", "marginBottom",
"_marl", "marginLeft",
"_marr", "marginRight",
"_x","left", 
"_y","top",
"_r","right",
"_b","bottom",
"_w","width",
"_h", "height"
]);//»
set_style_props_1(SVGElement,//«
[
"_op","opacity",
"_dis","display"
]);//»

Blob.prototype.toString = function() {return '[Blob ('+this.size+', "'+this.type+'")]';}

let _;
_ = HTMLElement.prototype;
_._loc=function(x,y){
	if (isFin(x)) x = `${x}px`;
	if (isFin(y)) y = `${y}px`;
	this.style.left=x;
	this.style.top=y;
}
_._del = function(){if (this.parentNode) {this.parentNode.removeChild(this);}}
_._add=function(...args){for(let kid of args)this.appendChild(kid);}
_._gbcr=function(){return this.getBoundingClientRect()}

_.ael = function(which, fun){this.addEventListener(which, fun, false);}
_.html = function(str) {this.innerHTML = str;}
_.vcenter=function(amount){if(!amount)amount="50%";this._pos="relative";this._y=amount;this.style.transform="translateY(-"+amount+")";}
_.flexcol=function(if_off){if(if_off){this.style.display="";this.style.alignItems="";this.style.justifyContent="";this.style.flexDirection="";}else{this.style.display="flex";this.style.alignItems="center";this.style.justifyContent="center";this.style.flexDirection="column";}}
_.scrollIntoViewIfNeeded || (_.scrollIntoViewIfNeeded = _.scrollIntoView);

_ = String.prototype;
_.toCamel = function(){return this.split("_").reduce((acc,cur)=>{return acc+cur[0].toUpperCase()+cur.slice(1);})}
_.regstr = function(useend){var endsp="";if(useend)endsp=" ";return this.replace(/^[\x20\t]+/g,"").replace(/[\x20\t]+$/g,endsp).replace(/[\x20\t]+/g," ");}
_.rep = function (num) {var ret = "";for (var i=0; i < num; i++) {ret = ret + this;}return ret;}
_.lc = function (){return this.toLowerCase();}
_.uc = function (){return this.toUpperCase();}
_.tonbsp = function(){return this.split(/\x20/).join("&nbsp;")}
_.chomp = function () {return this.replace(/\x20+$/g, "");}
_.lpad=function(num,fill){var tmp;if(this.length<num)return fill.repeat(num-this.length)+this;return this;}
_.pi = function(opts) {return doParseNumber(this, opts);}//ParseInt
_.pir=function(lo,hi){if(!(isFin(lo)&&isFin(hi)&&hi>lo))throw new Error("Invalid arguments to String.pir");return doParseNumber(this,{MIN:lo,MAX:hi});}//ParseIntRange "15".pir(10,20) => 15 , "15".pir(0,10) => NaN
_.ppi=function(opts){if(!opts)opts={};opts.POS=true;return doParseNumber(this,opts);}//ParsePositiveInt
_.pnni=function(opts){if(!opts)opts={};opts.NOTNEG=true;return doParseNumber(this,opts);}//ParseNonNegativeInt
_.pf=function(opts){return doParseNumber(this,opts,true);}//ParseFloat

_=SVGElement.prototype;
_.ael = function(which, fun){this.addEventListener(which, fun, false);}
_.add=function(...args){for(let kid of args)this.appendChild(kid);}
_.del = function() {if (this.parentNode) this.parentNode.removeChild(this);}

//»

