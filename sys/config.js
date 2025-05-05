//FJIUOPL: This was needed to get Ctrl+Alt+Shift+u to show up with a keysym of "u_CAS"
//(otherwise, the keysym was "undefined_CAS"!?!?!?)

//System Configuration«

//Window Namespace«

//window.__OS_NS__="_OS_";
const api={};

/*
libs holds the "newable" command library functions (with addComs and delComs members)
coms holds the literal objects that map command names to their functions
*/

const NS = {apps:{}, mods:{}, api, libs:{}, coms: {}};
window.LOTW = NS;
//window[__OS_NS__]= NS;

//»

//Query string«
const qObj=(()=>{
const obj={};
let srch = window.location.search;
if (srch) {
	let rep_qarr = [];
	let nogo = ["set_branch"];
//	let nogo = ["set_branch", "delete_fs"];
	let didrep = false;
	let qarr = srch.slice(1).split("&");
	for (let i=0; i < qarr.length; i++) {
		let qelm = qarr[i].split("=");
		let key = qelm.shift();
//		key = key.replace(/-/g,"_")
		let val = qelm.join("=");
		obj[key] = val;
		if (nogo.indexOf(key) > -1) {didrep = true}
		else rep_qarr.push(qarr[i]);
	}
	if (didrep) {//«
		let userep = "";
		let q = "?"; 
		if (rep_qarr.length) userep = rep_qarr.join("&");
		if (!userep) q = ""; 
		window.history.pushState({newstate: 1}, "System", window.location.origin + window.location.pathname + q + userep);
	}//»
}
return obj;
})();
//»
//FS«

//const PROJECT_ROOT_MOUNT_NAME = "this";

const DEF_BRANCH_NAME="def";
if (qObj.branch && !(/^[a-zA-Z]\w*$/.test(qObj.branch))){
	throw new Error(`${qObj.branch}: invalid branch name`);
}
const FS_PREF = qObj.branch || DEF_BRANCH_NAME;
//const FS_PREF=DEF_BRANCH_NAME;
const FS_TYPE= "fs";
const MOUNT_TYPE= "mnt";
const SHM_TYPE= "shm";

//»

//User«

const USERNAME = "me";
const CURRENT_USER = USERNAME;
const HOME_PATH = `/home/${USERNAME}`;
const DESK_PATH = `${HOME_PATH}/Desktop`;

//»

//Values/Strings«
const FS_DB_NAME = "Filesystem";
const MAIL_DB_NAME = "Mail";
const MAIL_DB_VERNUM = 1;

const MAX_TEXTAREA_BYTES = 10000;

const DEF_EDITOR_MOD_NAME = "term.vim";
const DEF_PAGER_MOD_NAME = "term.less";

const APPDATA_PATH="/var/appdata";

const BACKGROUND_IMAGE_URL = "/www/lotw256.png";
const BACKGROUND_GRADIENT = "linear-gradient(135deg,#000 0%,#003 50%,#006 75%,#000077 87%, #993 100%)";
const BEWARE_RED="#800";

const SHELL_ERROR_CODES={
	E_SUC: 0,
	E_ERR: 1
};

//»

//Apps/Extensions«

const APPLICATIONS_MENU = [//«
	"Text\xa0Editor","TextEdit",
	"Unicode\xa0Symbols", "util.Unicoder",
	"Your\xa0App\xa0Here", "YourApp",
	"Any\xa0Other", 0,
	"Apps\xa0Can", 0,
	"Go\xa0Here", 0,
];//»

const ALL_EXTENSIONS=[];
const TEXT_EXTENSIONS=[ "txt","js","json","css","sh","app"];
const MEDIA_EXTENSIONS=["webm","mp4","m4a","ogg","mp3"];
const IMAGE_EXTENSIONS=["jpg","gif","png","webp"];

const TERMINAL_APP = "Terminal";
const IMAGE_APP = "util.ImageView";
const MEDIA_APP = "MediaPlayer";
//const MEDIA_APP = "media.VideoCutter";
//const MEDIA_APP = "media.MediaPlayer";
const DEF_BIN_APP = "BinView";
const HTML_APP = "util.HTML";
const TEXT_EDITOR_APP = "TextEdit";

const FOLDER_APP = "Folder";
const LINK_APP = "Link";
const TEXT_APP = "util.TextView";
const WRITING_APPS = [
	TEXT_EDITOR_APP
];
const VIEWONLY_APPS=[];

//File extensions/Unicode icons«
//Extension points to the array position above
let TE = TEXT_EDITOR_APP;
let IA = IMAGE_APP;
let MA = MEDIA_APP;
let AA = "games.Arcade";
const EXT_TO_APP_MAP = {//«
	app:"Application",
	txt:TE,
	js:TE,
	json:TE,
	css:TE,
	sh:TE,
	jpg:IA,
	png:IA,
	gif:IA,
	webp:IA,
	webm:MA,
	mp4:MA,
	m4a:MA,
	ogg:MA,
	mp3:MA,
	html:HTML_APP,
	nes: AA,
	gb: AA
};
//»
for (let k in EXT_TO_APP_MAP) ALL_EXTENSIONS.push(k);
const ALL_EXTENSIONS_RE= new RegExp("^(.+)\\.(" + ALL_EXTENSIONS.join("|") + ")$");

/* Interesting Icons
Large kitchen knife 1f52a
*/
const APPICONS = {//«
	Launcher:"1f680",
	HTML:"1f310",
	Folder:"1f4c1",
	TextEdit:"1f4dd",
	BinView:"1f51f",
	Terminal:"1f5b3",
	Arcade:"1f579",
	Unzip:"1f5dc",
	MediaPlayer:"1f3a6",
	ImageView:"1f304",
	Launcher:"1f680",
	Noisecraft:"1f3b9",
	VideoCutter: "1f4fd",//Film Projector
	Loader:"1f303",//
	Meta:"1f528",//Hammer
	YourApp: "2615"
}//»
//»

//»

const isMobile = (()=>{//«
	const toMatch = [
		/Android/i,
		/webOS/i,
		/iPhone/i,
		/iPad/i,
		/iPod/i,
		/BlackBerry/i,
		/Windows Phone/i
	];
	return toMatch.some((toMatchItem) => {
		return navigator.userAgent.match(toMatchItem);
	});
})();//»

//Prevent default«

/*«
LEFT_A Navigate back
RIGHT_A Navigate forward
f_C Find text
s_C Save page
c_CS Focus developer console
k_C Search google in omnibar
p_C Popup print dialog
j_C Open downloads
e_A Open chrome menu (3 dots)
"/_" Firefox search page for text
»*/

const ALWAYS_PREVENT = [
	"LEFT_A",
	"e_C",
	"s_C",
	"f_C",
	"p_C",
	"u_C",
	"k_C"
];

//»
//Prototypes«

Array.prototype.uniqSort=function(opts={}){//«
	if (opts.hiToLow){
		return [...new Set(this)].sort((a,b)=>{if (a<b)return 1; if (a>b) return -1;})
	}
	else {
		return [...new Set(this)].sort((a,b)=>{if (a<b)return -1; if (a>b) return 1;})
	}
}//»
Array.prototype.uniq=function(opts={}){return [...new Set(this)];}

//»

//Keycode map«

const KC = {
	'BACK': 8,
	8: 'BACK',
	'TAB': 9,
	9: 'TAB',
	'ENTER': 13,
	13: 'ENTER',
	'SHIFT': 16,
//	16: 'SHIFT',
	16: '',
	'CTRL': 17,
//	17: 'CTRL',
	17: '',
	'ALT': 18,
//	18: 'ALT',
	18: '',
	'ESC': 27,
	27: 'ESC',
	'SPACE': 32,
	32: 'SPACE',
	'PGUP': 33,
	33: 'PGUP',
	'PGDOWN': 34,
	34: 'PGDOWN',
	'END': 35,
	35: 'END',
	'HOME': 36,
	36: 'HOME',
	'LEFT': 37,
	37: 'LEFT',
	'UP': 38,
	38: 'UP',
	'RIGHT': 39,
	39: 'RIGHT',
	'DOWN': 40,
	40: 'DOWN',
	'INS': 45,
	45: 'INS',
	'DEL': 46,
	46: 'DEL',
	48:'0',
	49:'1',
	50:'2',
	51:'3',
	52:'4',
	53:'5',
	54:'6',
	55:'7',
	56:'8',
	57:'9',
/*
	101:'5',
	102:'6',
	104:'8',
	105:'9',
*/
	'a': 65,
	65: 'a',
	'b': 66,
	66: 'b',
	'c': 67,
	67: 'c',
	'd': 68,
	68: 'd',
	'e': 69,
	69: 'e',
	'f': 70,
	70: 'f',
	'g': 71,
	71: 'g',
	'h': 72,
	72: 'h',
	'i': 73,
	73: 'i',
	'j': 74,
	74: 'j',
	'k': 75,
	75: 'k',
	'l': 76,
	76: 'l',
	'm': 77,
	77: 'm',
	'n': 78,
	78: 'n',
	'o': 79,
	79: 'o',
	'p': 80,
	80: 'p',
	'q': 81,
	81: 'q',
	'r': 82,
	82: 'r',
	's': 83,
	83: 's',
	't': 84,
	84: 't',
	'u': 85,
	85: 'u',
	'v': 86,
	86: 'v',
	'w': 87,
	87: 'w',
	'x': 88,
	88: 'x',
	'y': 89,
	89: 'y',
	'z': 90,
	90: 'z',
	'OSKEY': 91,
	91: 'OSKEY',
	96: '#0',
	97: '#1',
	98: '#2',
	99: '#3',
	100: '#4',
	101: '#5',
	102: '#6',
	103: '#7',
	104: '#8',
	105: '#9',
	106:'#*',
	107:'#+',
	109:'#-',
	110:'#.',
	111:'#/',
	144: 'NUMLOCK',
	'NUMLOCK': 144,
	';': 186,
	186: ';',
	'=': 187,
	187: '=',
	',': 188,
	188: ',',
	'-': 189,
	189: '-',
	'.': 190,
	190: '.',
	'/': 191,
	191: '/',
	'\x60': 192,
	192: '\x60',
	'[': 219,
	219: '[',
	'\\': 220,
	220: '\\',
	']': 221,
	221: ']',
	"'": 222,
	222: "'",
	229: "u",//FJIUOPL: WHY IS THIS NECESSARY TO MAKE u_CAS WORK ON CHROMEBOOK?
	"LAST_KC": 223
}

//»
//«Terminal
const TERM_ENV = {};
const TERM_FUNCS = {};
const TERM_STAT_TYPES={
	STAT_NONE:0,
	STAT_OK:1,
	STAT_WARN:2,
	STAT_ERR:3
};
const VIM_MODES={
	COMMAND_MODE: 1,
	INSERT_MODE: 2,
	REPLACE_MODE: 3,
	VIS_LINE_MODE: 4,
	VIS_MARK_MODE: 5,
	VIS_BLOCK_MODE: 6,
	CUT_BUFFER_MODE: 7,
	LINE_WRAP_MODE: 8,
	SYMBOL_MODE: 9,
	FILE_MODE: 10,
	COMPLETE_MODE: 11,
	REF_MODE: 12,
};
//»
export const globals = {//«
	workers:{
//		faust: new Worker("/wasm/faust.js"),
	},
	qObj,
	KC,
	NS,
	isMobile,
	isFox: navigator.userAgent.match(/Firefox/),
	FS_PREF,
	FS_TYPE,
	MOUNT_TYPE,
	SHM_TYPE,
	BACKGROUND_IMAGE_URL,
	BACKGROUND_GRADIENT,
	BEWARE_RED,
	USERNAME,
	CURRENT_USER,
	EOF: {EOF: true},
	TERM_ENV,
	TERM_FUNCS,
	TERM_STAT_TYPES,
	VIM_MODES,
	SHELL_ERROR_CODES,

	HOME_PATH,
	DESK_PATH,
	APPDATA_PATH,
//	PROJECT_ROOT_MOUNT_NAME,
	APPLICATIONS_MENU,

	LINK_APP,
	FOLDER_APP,
	TEXT_APP,
	TERMINAL_APP,
	MEDIA_APP,
	IMAGE_APP,
	APPICONS,
	TEXT_EDITOR_APP,
	DEF_BIN_APP,
	WRITING_APPS,
	VIEWONLY_APPS,

	FS_DB_NAME,
	MAIL_DB_NAME,
	MAIL_DB_VERNUM,

	DEF_EDITOR_MOD_NAME,
	DEF_PAGER_MOD_NAME,

	TEXT_EXTENSIONS,
	MEDIA_EXTENSIONS,
	IMAGE_EXTENSIONS,
	ALL_EXTENSIONS,
	ALL_EXTENSIONS_RE,
	EXT_TO_APP_MAP,

	MAX_TEXTAREA_BYTES,

	ALWAYS_PREVENT,
	dbs:{},//database handles
	mods: {},
	apps: {},
	audio:{},
	lists:{},
	vim:{},
	boundWins:{},

/*Legacy code can put things here so vim can have a mode to import them as strings:«

In Terminal.js: 
globals.refs.Terminal={}
const some_old_func = async(arg1, arg2)=>{...}
this.some_old_func = some_old_func;
globals.refs.Terminal.some_old_func = some_old_func

Then invoke vim like:
~$ vim NewFile.js --refs=Terminal:term,Cool,Whatever:what
Such that "term" and "what" are the optional namespaces for their references, so that we have

term.some_old_func
//...rest of "term" namespace
a_function_from_cool
//...rest of things in non-namespaced "Cool" references
what.another_old_func
//...rest of "what" namespace

»*/

	refs:{},
	api,

}
;//»
NS.globals = globals;

//»

