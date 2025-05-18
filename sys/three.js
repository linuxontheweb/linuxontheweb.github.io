
//Imports«
const NS = LOTW;
const {globals} = NS;
const{FS_PREF,fs,KC,ALWAYS_PREVENT}=globals;
const {log, cwarn, cerr, gbid, make, mkdv, evt2Sym} = LOTW.api.util;
//»

//Var«

const APP_PATH = "/apps/dev/Three.js";

let APP;
let WIN;

let RESIZE_TIMER;
let RESIZE_TIMEOUT_MS = 100;
let MIN_RESIZE_DELAY = 500;
let LAST_RESIZE_TIME;
//»

//Funcs«
const NOOP=()=>{};
//Shims for the desktop«
NS.api.widgets={
	poperr:mess=>{
cerr(mess);
	}
};
NS.Desk={
	isFake: true,
	make_icon_if_new: NOOP
};
//»
const add_listeners=()=>{//«

document.onkeypress = e => {//«

let code = e.charCode;
if (code >= 32 && code <= 126) APP.onkeypress(e);

};//»
document.onkeydown = e => {//«

let mod_str = "";
if (e.ctrlKey) mod_str = "C";
if (e.altKey) mod_str += "A";
if (e.shiftKey) mod_str += "S";
let kstr = KC[e.keyCode] + "_" + mod_str;
if (ALWAYS_PREVENT.includes(kstr)) e.preventDefault();
if (kstr == "ESC_") return APP.onescape();
APP.onkeydown(e, kstr, mod_str);

};//»
document.onkeyup = e => {APP.onkeyup(e, evt2Sym(e));};
window.onresize = (e)=>{//«
/*
Want to set an interval to wait for a ~500 ms delay between the last window resize event
and telling the app window to resize itself. This is because mouse click/move events fire
this, and we don't want to constantly resize the terminal because that can be pretty
expensive.
*/

LAST_RESIZE_TIME = window.performance.now();
if (RESIZE_TIMER) return;
RESIZE_TIMER = setInterval(()=>{
	if ((window.performance.now() - LAST_RESIZE_TIME) <  MIN_RESIZE_DELAY) return;
	clearInterval(RESIZE_TIMER);
	RESIZE_TIMER = null;
	WIN.resize();
}, RESIZE_TIMEOUT_MS);

};//»

}//»
const check_for_other_systems=()=>{//«
	if (! ('BroadcastChannel' in window)) return;
	let syschan = new BroadcastChannel("system");
	syschan.postMessage("init:"+FS_PREF);
	syschan.onmessage = e => {
		let mess = e.data;
log(mess);
		if (mess=="init:"+FS_PREF) {
			if (globals.read_only) return;
			syschan.postMessage("ack:"+FS_PREF);
		}
		else if (mess=="ack:"+FS_PREF) globals.read_only = true;
		else if (mess.match && mess.match(/^(init|ack):/)){
cwarn("Dropping: " + mess);
		}
		else {
cwarn("Message received on the broadcast channel...");
log(mess);
		}
	}
};//»
const nosel=(elm)=>{elm.style.userSelect="none"}
//»

const ThreeWindow = class{//«

constructor(){//«
	this.makeDOM();
	this.id="win_1";
}//»
makeDOM(){//«
	let win = make('div');
	win._pos = "fixed";
	win._x=0;
	win._y=0;
	nosel(win);

	let main = make('div');
	main._pos="relative";
	main._w=window.innerWidth;
	main._h=window.innerHeight;
	nosel(main);
	main._bgcol="#000";
	win._add(main);
	this.main=main;

	document.body._add(win);
}//»
loadApp(){//«

return new Promise((Y,N)=>{//«
let scr = make('script');
scr.type="module";
scr.onload = async() => {//«
	const { app } = await import(APP_PATH);
	APP = new app(this);
//	NS.Terminal = APP;
	APP.onappinit();
	Y(true);
};//»
scr.onerror=(e)=>{//«
cerr(e);
Y();
};//»
scr.src= APP_PATH;
document.head._add(scr);
});//»

}//»
resize(){//«
	this.main._w=window.innerWidth;
	this.main._h=window.innerHeight;
	APP.onresize();
}//»

};//»

//Init«

(async()=>{
	if (!await fs.api.init()) return;
	if (!await fs.mk_user_dirs()) return;
	WIN = new ThreeWindow();
	if (!await WIN.loadApp()) return;
	Object.freeze(NS);
	add_listeners();
	document.body.removeChild(gbid("error_message"));
//	globals.nodejs_mode = (await fetch('/_env?key=MAYBENODEJS')).ok;
})();

//»

