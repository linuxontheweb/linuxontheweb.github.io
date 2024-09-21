
/*This will always be invoked by opening an appicon, which must look like:«

{
app: "Meta",
	args:{
		file: "/path/to/some/javascript/file.js"
	}
}

Will open up the app in app mode (calling onappinit)

If it looks like:

app: "Meta",
	args:{
		file: "/path/to/some/script.js",
		data_file: "/path/to/some/blob.dat"
	}
}

Then this will open up in the normal way of double-clicking
an icon with a known extension.

»*/

//Imports«

import { util, api as capi } from "util";
import { globals } from "config";

const{NS, FS_TYPE, FOLDER_APP}=globals;
const{popup, poperr} = globals.widgets;
const{make,mkdv,mk,mksp,log,cwarn,cerr, isstr}=util;

//»

export const app = function(Win) {

//Var«
const {Main} = Win;
let obj;
let initarg;
let node;
let file, data_file;
//»

const init = async()=>{//«
let bytes;
let s = await node.text;
try{
	obj = eval(`new function(){${s}}`);
}
catch(e){

cerr(e);
Win._fatal(e);
	return;
}
if (data_file){
	if (!(obj.onloadfile instanceof Function)){
cerr("No onloadfile with data_file!");
		return;
	}
	let datnode = await data_file.toNode();
	if (!datnode){
cerr(`Data file not found: ${data_file}`);
		return;
	}
	bytes = await datnode.bytes;
}
else if (!(obj.onappinit instanceof Function)){
cerr("No onappinit");
	return;
}
if (!isstr(obj.appName)){
cerr("No appName");
	return;
}
if (obj.appIcon){
	Win.img_div.innerHTML=obj.appIcon;
}
Win.title = obj.appName;

let keys = Object.keys(obj);
//let NOGO = ["onappinit", "onkill", "onloadfile"];
for (let k of keys){
	if (k==="onkill") continue;
	this[k] = obj[k];
}
if (bytes){
	obj.onloadfile(bytes);
}
else{
	obj.onappinit();
}

if (!globals.meta_paths) globals.meta_paths = {};
globals.meta_paths[file] = this;

};//»

this.reload = ()=>{
	Main.innerHTML = "";
	init();
};

this.onappinit = async(arg)=>{//«

if (arg.reInit) arg = arg.reInit;
initarg = arg;
file = arg.file;
if (!file){
cwarn("No file in Meta");
	return;
}

node = await file.toNode();
if (!node){
cwarn(`File not found: ${file}`);
	return;
}
data_file = arg.data_file;
init(node);

};//»

this.killed = false;

this.onkill = ()=>{//«
	if (obj && obj.onkill) obj.onkill();

	this.killed = true;
	this.reInit = initarg;
	globals.meta_paths[file] = undefined;
	delete globals.meta_paths[file];

};//»

}








