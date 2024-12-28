/*12/22/24: Just doing a simple desktop icon toggling routine.«

I'm pretty sure that all icons that are being added to the desktop *MUST*
got through placeInIconSlot, so I'm cutting everything off about icon
visibility for newly created desktop icons @LCIUDHJ.

So now each workspace can define what it wants for the background color
and image just by updating the body element for color (solid or gradient)
and updating the desk_imgdiv with the image url.

The body is what has the color and desk_imgdiv has the image.

toggle_icon_display @XKNFIUHJ is my working prototype for doing the kind of
changing of desktop styles when switching to different workspaces that I have
in mind.



Need to finish up tile_windows, and allow for Workspaces to "own" their own
background color and image divs, and decide whether to have the icon_div visible or not.

OKAY: I'm not saying the algorithm @PMNTYJ is perfect, but it seems to work decently
enough, and it is trivial to put the workspace into layout mode (l_CA), such that
the user is given big, fat handles to do fine-grained adjustments to the windows.

You can call tile_windows multiple times, with the fit becoming more "snug" each time
until it finally detects window overlap, and finally refuses to do the tiling algorithm
again.


»*/
/*«Notes*/
/*12/21/24: Now we have Workspace objects that get key events sent to them if there«
is a focused window. Otherwise, the desktop itself gets to decide what to do with
the given key event.

I mainly want to make it trivial to set flags on a given workspace, via the WorkMan
app or the command line, so as to disallow ad-hoc changes to window layout.

In a workspace, we can keep state related to "Workspace global states", such as tiled
windows or having them be "locked down", such that hotkeys and/or clicks don't work. 

What kinds of flags can we have here?

allowClose
allowMove
allowResize//including maximize, fullscreen
allowMinimize
allowNone

How about a "winman" command?

We can set these move/close/resize properties on the individual windows and/or
the workspaces.

Now there are more simplified/ more objective/ more granular methods for allowing/
blocking window management functions, now we are in a better position to enable higher 
order methods like various tiling arrangements.

Now that we are checking the key events for these window management functions, we need
to apply this to the mouse movements as well.

Now we have a new kind of tile_windows @JDURKJS. Here we just have the algorithm
to find us the closest window with a bottom edge that stops our top edge from going
all the way to the top of the browser window.

So now we just have to actually extend the edge as necessary, and then do the same
thing for the remaining edges (bottom, left, right) of all the windows.

We can save on cycles here by "remembering" all of the edges that we've already extended,
if in fact we are going to bring two edges together to meet in the middle, which 
seems the most "just" thing for a tiling algorithm to do.

We can set these as flags on our window object, or a sub-object within it, like:

win.tiledEdges = {left: false, right: false, top: false, bottom: false}.

We can also just check of the given edge to see if it is flush with the browser edge.

»*/
/*12/20/24: Just got rid of the idea that new folder windows are created whenever «
you navigate to another folder using one of the following methods (such that the
new windows perfectly "replace" the old ones by copying the dimensions of the
old ones, making it merely seem like the same window is being used):

1) Pressing the 'b' key: to navigate to the parent folder (if the fullpath of
the current folder isn't '/')
2) Pressing the 'f' key: to navigate to the implicit "next child folder" (this
is only possible when the 'b' key has previously been used)
3) When double-clicking or using the folder's icon Cursor: to navigate to an
explicit "next child folder" (this currently clears away the Folder app's prevPaths array)

That was a really embarrasing aspect of how I used to enable folder navigation.

* * * * * * *

Now, the last thing I can really think about in order to really start using this thing
is better window/application opening and layout management, particularly, I think, via
the tiling paradigm. I want a command to define the tiling of a given workspace, based
on layout modes and percentages of filling the browser window's width/height.

Starting with 2 windows, there are only two modes:

1) 2 rows:
|---------|
|---------|
|_________|

2) 2 columns
_________
|	|	|
|	|	|
|	|	|
---------

Then with 3 windows, we have 6 modes:

1) 3 columns
_____________
|	|	|	|
|	|	|	|
|	|	|	|
-------------

2) 3 rows
|---------|
|---------|
|---------|
|_________|

3) 1 column and 2 rows, such that each row's width is the browser width - the column's width

	a) With the column on the left
	____________
	|	|	   |
	|	|______|
	|	|	   |
	------------

	b) With the column on the right
	_____________
	|	   |	|
	|______|	|
	|	   |	|
	-------------

4) 1 row and 2 column, such that each column's height is the browser height - the row's height

	a) With the row on the bottom
	___________
	|    |    |
	|    |    |
	|---------|
	|_________|


	a) With the row on the top
	|---------|
	|_________|
	|    |    |
	|____|____|

As long as these are defined in terms of percentages, then we can resize all of
the windows whenever the browser's dimension's change, via either 
1) browser window magnification
2) opening/closing the developer console

So this gives us 8 distinct layout formats (2 w/ 2 windows; 6 w/ 3 windows)

We can also give a minimum height/width for certain "minor" windows that we don't want
to shrink any smaller than any absolute value (so that it will take up a larger percentage
than its given percentage indicates). I am mainly thinking here about the new "term.log"
thing that I've created.

I actually *really* want a command that opens windows in a given workspace, and
then tiles them according to a certain layout "prescription".

How about looking for an ~/.init/desk.js during the init phase???

»*/
/*12/19/24: Want the new Ctrl+Alt+[1-9] window manager stuff to bring me over to the«
desktop that its on. Where is raise_bound_win
»*/
/*12/17/24: Window Manager time! Want an app called WorkMan that gives us a graphical«
interface into what I starting working on yesterday with the bindwin command.
Need to give an option to bindwin to allow a string description.

You open it up with Ctrl+Alt+0. Then you just pick the window you want to rearrange
by pressing the associated number key (without modifiers). Then you move it around
with the arrow keys (left/right if the window are arranged horizontally, up/down if
vertically). Toggle between row-wise or column-wise alignment via "/". Escape
"deselects" the currently selected window.
»*/
/*12/16/24: DumHack @FSKEUSHFK to "fit" a little window number indicator into «
the bottom left corner without breaking all of the delicately balanced (vis-a-vis 
css display and positioning) stuff in the footer. We had to give the 'footer_wrap'
a relative positioning, and then create a 'numdiv' with abolute positioning, in
order to keep things simple (i.e. without having to get into a whole bunch of
head-scratching about how to work with the flex-display nature of the 'statdiv'
down on the footer). Putting the number indiscretely here on the bottom left
adds a sort of "balancing," fung-shui quality to the whole thing, especially
when the application shows nothing on the statdiv.

The motivation here is to make it trivial to locate the global handle to
windows, so it can be used by, i.e. the new [1-9]_CA shortcut @XKLEUIM
or by some kind of Window Manager App (WMA) that can be invoked by 0_CA.

Then we can use the CLI or the WMA to bind our windows to these keysyms. I
see the WMA version of this as being a kind of "macro", such that there can
be a two-chord sequence in order to bring up lesser used windows than the
ones in the quick/easy [1-9]_CA slots. The combination might be as simple
as 0_CA + a (pressing Ctrl+Alt+0, letting go, and then pressing "a").

This is my quick/dirty way of greatly increasing the available keystrokes that
exist for the purpose of "random-accessibly" bringing your windows into focus.

Then we can start getting to work on our own internal development of our own
Shell. Eventually, we are going to want to use this stuff in a desktop
initialization script (possibly with our shell implementation or some kind of
*VERY* simple language we can work on, for the purpose of commanding the GUI).

Just created a 'bindwin' command, e.g.:
~$ bindwin <win_id_num> <key_num[1-9]>

»*/
/*11/25/24: @WJKNMTYT: When trying to 'mv' a file like this:«
$ mv blah.txt FOOFOOFOO

... node.appName gets to be the name of the application. So this property needs
to be deleted at the appropriate point in the whole process. So we are NOT
choosing @FUIMNTYU to delete it (but rather in fs.com_mv @TUIMN). We might need
to have a '.isData' property on the nodes (as well as a '.isFile'), in order to
cover ALL of our bases (Now we are adding these in mk_dir_kid). Then we can just check
for .isFile if we want to do stuff like deleting the node.appName.
node.appName is only "dynamically" set in saveFsByPath @DHYUI and mk_dir_kid
@PYTNM.

»*/
/*11/22/24 « Want to update the logic in 'make_app' (@DIOLMTNY) to reflect modern 
standards, namely replacing the callback logic (@BGEIUOP) with Promises. Then, go 
through all of the ways that application windows are opened to use this new logic.

HAVING ALL SORTS OF PROBLEMS RENAMING ICONS TO DIFFERENT APPLICATIONS (PARTICULARLY TO
THE DEFAULT BINVIEW APPLICATION), AND THEN OPENING THEM AFTER RENAMING THEM!!!

@FKIOPIU: figured out how to point to the "real" "imgdiv". The one at
wrapper.childNodes[0] could sometimes be the little thing at the top-left
corner of the text icons. So when we updateDOMElement (via the Terminal's 'mv' command)
from a text icon to a DEF_BIN_APP icon, it still keeps the little thing at the
top-left corner (e.g. "txt" or whatever the text extension is). So we just need
to delete this dumb thing (created @YPOIKLJ) @LCUITYEP in Icon.updateDOMElement!!! Took
away the apparently superfluous logic @GJKLIUYT. This attempt to tag
*everything* with '.iconElem' might be related to the algorithmic "paranoia" of
making sure that the icon cursor can always select the icon in places like
@FBVDGHJ.

NEED TO FILTER ALL OF THIS NAMING/IMAGING/RENAMING/REIMAGING LOGIC THROUGH THE VERY 
SAME METHODS (RATHER THAN DOING THE ONE THING IN THE MAIN BODY OF THE ICON LOGIC
AND THE OTHER IN A RENAME METHOD)!!!! ALSO, IT IS CONFUSING TO HAVE AN ICON.setLabelName
method (which only changes the name in the icon's "namespan") AS WELL AS AN
ICON.updateDOMElement (which internally calls setLabelName and does other stuff besides).

We need a single method that does all of the creation of icon images (including
deleting anything that might already be there as well, and adding whatever "frills"
are necessary like those 'txt' things in the upper left corners...).

»*/
/*»*/
//Imports«

const NS = LOTW;
const {globals} = NS;

//import {FS as fsmod} from "fs";

//«
const{
	isMobile,
	qObj,
		
	FS_PREF,
	FS_TYPE, 
	MOUNT_TYPE,
	SHM_TYPE,

	USERNAME,
	HOME_PATH,
	DESK_PATH,

	FOLDER_APP,
	LINK_APP,
	TEXT_APP,
	TERMINAL_APP,
	IMAGE_APP,
	MEDIA_APP,

	VIEWONLY_APPS,
	TEXT_EXTENSIONS,
	MEDIA_EXTENSIONS,
	IMAGE_EXTENSIONS,
	ALL_EXTENSIONS_RE,
	TEXT_EDITOR_APP,
	DEF_BIN_APP,
	WRITING_APPS,

	BACKGROUND_IMAGE_URL,
	BACKGROUND_GRADIENT,
	BEWARE_RED,
//	DESK_GRADIENT,
	ALWAYS_PREVENT,
	KC
}=globals;

//»

const {
	isStr,
	getStrPer,
	isObj,
	mkdv,
	mksp,
	mkbut,
	make,
	log,
	cwarn,
	cerr,
	center,
	evt2Sym,
	normPath, 
	toStr,
	uniq,
	pathParts,
	dist,
	getNameExt,
	getKeys,
	newPathIsBad,
	extToApp,
	getAppIcon,
//	detectClick,
	fsUrl,
	isFin,
	makeScript
} = NS.api.util;

//»

//Desk«

//new Desk(){«
  new  (function(){

	const Desk = this;
	NS.Desk = this;
	Object.freeze(NS);
	this.globals = globals;

//»

//Var«

//FS«
//const fs = new fsmod();
//globals.fs = fs;
const fs = globals.fs;
const fsapi = fs.api;
const{pathToNode}=fsapi;
//»
//Flags/Modes«
let dev_mode;
let admin_mode;
let debug_localstorage=false;
let show_desktop_during_win_cycle = true;
let win_cycle_wins_hidden = false;
//let folders_open_in_same_window = false;
let folders_open_in_same_window = true;
//let tiling_mode = false;
//let layout_mode = false;
//let DEF_NO_DELETE_ICONS = true;
let DEF_NO_DELETE_ICONS = false;
let PREV_DEF_ALL_KEYS = false;
let CYCLE_MIN_WINS = true;
let cur_showing = false;
let taskbar_hidden;
let taskbar_expert_mode;

let have_window_cycle = false;
let debug_keydown = false;
let noevents = false;
let cmenu_active = true;
let	windows_showing = true;
let window_chrome_mode = true;
let alt_is_up=false;

//»
//Timers/Counters/Numbers/Amounts«

let MAX_ICON_NAME_LEN = 48;

let last_win_cycle = 0;
let switcher_off_timeout;

let current_workspace_num = 0;
let num_workspaces = 9;

let overlay_timer;
let num_minimized_wins=0;
let nowindow_pos;
let num_tiled_wins;
let MAX_TILED_WINS_FOR_RESIZING=4;
let win_num = 0;
let icon_num = 0;
let VERNUM=1;
let OVERLAY_MS = 1500;
let SWITCHER_OFF_DELAY_MS = OVERLAY_MS;
let WIN_TRANS_SECS="0.25s";
let TASKBAR_TRANS_SECS = 0.125;

let MS_BETWEEN_BIG_FOLDER_BATCHES = 0;
let BIG_FOLDER_BATCH_SIZE = 1000;
let MAX_FILE_SIZE = 1024*1024;
let SHOW_TASKBAR_DELAY_MS = 400;
let num_win_cycles = 0;
const RS_TIMEOUT = 300;
let rs_timer = null;
let taskbar_timer;
let alt_tab_presses = 1;

//»
//DOM Elements/Objects/Arrays«
let CPR;
let CWIN;
let taskbar;
const body = document.body;
const desk = mkdv();

const desk_imgdiv=mkdv();
const start_button=mkdv();
const workspace_num_div=mkdv();
const workspace_switcher_div=mkdv();
//const tiling_underlay = mkdv();

//A "fake" window object that gets put into the window stack during
//keyboard window cycling when show_desktop_during_win_cycle=true.
const NOWINDOW={elem:{}, winElem:{}};

let overlay;

let CWIN_HOLD;
let CWCW;
let ICONS=[];
let CDL;
let CDICN, CDW, CRW, CEDICN;
CDW = CDICN = CRW = CEDICN = null;
let DDD;
let CG;
//let windows = [];

//»
//String/Regex constants/vars«

const READ_ONLY_TEXT = "\xa1\xa0Read\xa0Only\xa0!";
const ADMIN_MODE_TEXT = "\xa1\xa0Admin\xa0Mode\xa0!";
const RE_SP_PL = / +/,
	RE_SP_G = / /g;
//»
//JS Objects«
let desk_menu;
const api={};
Desk.api=api;
//let win_overflow={t:0,b:1,l:1,r:1};
//let win_overflow={top:0,bottom:0,left:0,right:0};
let win_overflow={top:0,bottom:0,left:0,right:0};

//»
//Style/CSS Values«

let DEF_NEW_WIN_X = 15;
let DEF_NEW_WIN_Y = 15;
let DEF_NEW_WIN_W_PER = 0.95;
let DEF_NEW_WIN_H_PER = 0.72;

let WORKSPACE_SWITCHER_BOX_SZ=35;

let ALERT_YELLOW = "#FFBF00";

let MIN_WIN_OP=1;

//Making this negative is a trivial way to "deactivate" the desktop because
//the mouse event handlers can't the called. For some reason, the icon 
//cursor doesn't even work in this case!
let DESK_Z = 0;

//The "Click Guard" is a child of the desktop, and is turned on whenever
//there is a context menu or an icon's label is being edited.
//Windows "should never" be able to reach this level!
let CG_Z = 9999999;

let ICON_Z = 1;

//Certain desktop elements might want to position themselves against the
//lowest window in the stacking order
let MIN_WIN_Z = 10;

//The active window will have this zIndex. This keeps getting raised when
//a window is clicked on or is brought to the top via window_cycle()
//(It might be good to somehow "restack" the windows).
let	HI_WIN_Z = MIN_WIN_Z;

const SAVEAS_BOTTOM_HGT = 30;

let APP_BG_COL = "#231010";
let APP_TEXT_COL = "#ccc";

const TASKBAR_HGT = 26;
const TASK_BAR_COL_RGB="8,8,8";
//const  DEF_DESK_GRADIENT = "linear-gradient(135deg,#000 0%,#003 50%,#006 75%,#000077 87%,#33c 100%)";
//let DEF_DESK_GRADIENT = DESK_GRADIENT;
const TASKBAR_BG_COL=`rgb(${TASK_BAR_COL_RGB})`;
//const TASKBAR_BOR=`1px solid rgba(0,0,0,0.75)`;

const TASKBAR_BOR_COL="#555";
const TASKBAR_BOR_WID="1px";
const TASKBAR_BOR_STY='solid';
const TASKBAR_BOR=`1px solid #555`;
const MIN_WIN_LIN_GRAD  =`linear-gradient(90deg, rgba(${TASK_BAR_COL_RGB},0) 90%, rgba(${TASK_BAR_COL_RGB},1) 97%)`;
let OVERLAYOP = "0.5";
let TASKBAR_OP=1;

//In Folder.js, Main._pad= 5. We need this value here so the icon selection cursor will line up right.
let CUR_FOLDER_XOFF = 5;
let CUR_FOLDER_YOFF = 5;
globals.CUR_FOLDER_XOFF=CUR_FOLDER_XOFF;
globals.CUR_FOLDER_YOFF=CUR_FOLDER_YOFF;

let DEF_BG_IMG_OP = 0.3;
let DESK_ICON_BOR = "2px solid rgba(255,255,64,0.66)";
let DESK_ICON_BG = "rgba(255,255,200,0)";
let FOLDER_ICON_BOR = DESK_ICON_BOR;
let FOLDER_ICON_BG = DESK_ICON_BG;
let FOLDER_ICON_CUR_BOR = "2px solid #000";

let CURBORWID=1;
let CURBORSTY="solid";//dotted dashed solid double groove ridge inset outset none hidden 
let CURBORCOL="#fff";
let CURBGCOL="rgba(0,0,0,1)";

let WIN_CYCLE_CG_OP = 0;
let WINBUT_OFF_COL = "#778";
let WINBUT_ON_COL = "#bba";
let WIN_COL_ON="#2a2a3a";
let WIN_COL_OFF="#232333";
let WINNAME_COL_ON=WINBUT_ON_COL;
let WINNAME_COL_OFF=WINBUT_OFF_COL;

let hidden_taskbar_thresh;
const STEP_MODE_DESK_OP=0.5;

//When dragging icons around, a large enough value here insures that the 
//"n items->" label keeps showing.  If you are moving the mouse very fast, the
//pointer can go over the label and trigger an event to make it disappear and
//think that you've "dropped" your payload.
let CDL_OFFSET=10;

let ICON_OP_MS=250;

let MIN_WIN_ON_COL="#ddd";
let MIN_WIN_OFF_COL="gray";

const DRAG_IMG_OP = 0.66;

//Used in the math to determined how fast 
//icons move to the new locations.
//Larger numbers make the icons faster.
let ICON_MOVE_FACTOR = 1200;
//let ICON_MOVE_FACTOR = 200;

//This unused variable has sentimental value.
const MAC_ICON_PURPLE="#8c4eb8";

const DEF_CG_OP = 0;

let ICON_DIM = 44,
	TITLE_DIM = 16,
	FOLDER_GRID_W = 5,
	win_move_inc = 50,
	win_move_inc_small = 5,
	win_resize_inc = 50,
	win_resize_inc_small = 5,
	min_win_width = 140,
	min_win_hgt = 50

let	window_boxshadow = "3px 3px 20px rgba(255,255,255,0.10)",
	prompt_boxshadow = "3px 3px 20px rgba(255,255,255,0.375)",
//	window_boxshadow = "",
	window_boxshadow_hold;

let folder_grid_start_x = 20,
	folder_grid_start_y = 5,
	desk_grid_start_x = 25,
	desk_grid_start_y = 40

let	IGSX = 100, IGSY = 100;

let DESK_GRID_W;
let DESK_GRID_H;

let MAX_OVERLAY_LENGTH = 42;

//»
//Init Events«

let	ev = null;

let DDIE, WDIE, DDX, DDY;
let drag_timeout;
DDIE=WDIE=DDX=DDY=null;

//»
//Protos/Props«

//Object.defineProperty(Object.prototype,'_keys',{get:function(){return Object.keys(this);},set:function(){}});
//Object.defineProperty(Object.prototype,'_vals',{get:function(){let arr=[];let keys=Object.keys(this);for(let k of keys){arr.push(this[k]);}return arr;},set:function(){}});
Object.defineProperty(this,"CWIN",{get:()=>CWIN});
Object.defineProperty(this,"WINS",{get:()=>windows});

{

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

}

//»

//»

//Context Menu«
const open_home_folder=()=>{open_file_by_path(globals.home_path);};
const open_terminal = () => {
	open_app(TERMINAL_APP, {force: true});
};
const open_help=()=>{open_app("Help");}

const DESK_CONTEXT_MENU=[
	"New",[
		"Folder::Ctrl+Alt+d",
		()=>{
			if (!SHOW_ICONS) return show_overlay(`SHOW_ICONS == ${SHOW_ICONS}`);
			make_new_icon(desk, FOLDER_APP)
		},
		"Text File::Ctrl+Alt+f",
		()=>{
			if (!SHOW_ICONS) return show_overlay(`SHOW_ICONS == ${SHOW_ICONS}`);
			make_new_icon(desk, "Text")
		}
	],
	"Explorer::Alt+e",open_home_folder,
	"Terminal::Alt+t", open_terminal,
	"Help::Alt+h", open_help,
	"Github\xa0Link", ()=>{
		popok('<a href="https://github.com/linuxontheweb/linuxontheweb.github.io">Direct link</a> (opens in new window)',{title:"LOTW Github repo"});
	}
//"XMark\xa0Test __XMARK__",()=>{log(12345)},
//"Check\xa0Test __CHECK__",()=>{log(12345)}

];

//»
//Desktop«

const fit_desktop = ()=>{//«
	let _h = winh(true)+1;
	let _w = winw()+1;
	let str = `${_w} ${_h}`;
	desk._w= _w;
	desk._h = _h;
	desk.style.backgroundSize = str;
	desk_imgdiv._w= _w;
	desk_imgdiv._h = _h;
	desk_imgdiv.style.backgroundSize = str;
	CG._w= _w;
	CG._h = _h;
	get_desk_grid();
};//»
const set_desk_bgcol=()=>{//«
	let bgcol = qObj.bgcol;//Solid background color or gradient with backgroundImage«
	if (admin_mode) bgcol=BEWARE_RED;
	if (bgcol) {
		if (bgcol.match(/^[a-f0-9]+$/i) && (bgcol.length==3 || bgcol.length==6)){
			body._bgcol= `#${bgcol}`;
		}
		else {
			body._bgcol= `${bgcol}`;
		}
	}
	else {
		body.style.backgroundImage=BACKGROUND_GRADIENT;
	}//»
};//»
const set_desk_styles = () => {//«
	desk._tcol= "#000";//Main desktop layer«
	desk._pos= "relative";
	desk._over= "auto";
	desk._w = winw()+1;
	desk._h = winh()+1;
	desk._z= DESK_Z;
	desk.style.backgroundSize = winw() + " " + winh();
//»

set_desk_bgcol();

//Need a separate image layer for fine-grained opacity
	desk_imgdiv._pos= "absolute";//Image layer«
	desk_imgdiv._loc(0, 0);
	desk_imgdiv._w= winw();
	desk_imgdiv._h = winh();
	desk_imgdiv._z= DESK_Z - 2;
	desk_imgdiv.style.backgroundSize = winw() + " " + winh();
	desk_imgdiv.style.backgroundRepeat="no-repeat";
	desk_imgdiv.style.backgroundPosition="center";
	desk_imgdiv._op = DEF_BG_IMG_OP;
	desk_imgdiv.id="bg_image_div";

	if (!qObj.nobgimg) desk_imgdiv.style.backgroundImage=`url("${BACKGROUND_IMAGE_URL}")`;
//	if (!dev_mode&&!qObj.bgcol) body.style.backgroundImage = DEF_DESK_GRADIENT;
//	if (!qObj.bgcol) body.style.backgroundImage = DEF_DESK_GRADIENT;

//»


	DDD = make('div');//Desk Drag Div = The icon "lasso"«
	DDD._z = CG_Z - 1;
	DDD._pos= 'fixed';
	DDD._bor= '1px solid white';
	DDD._bgcol= 'gray';
	DDD._op= 0.5;
	DDD.id="icon_lasso";
	DDD._loc(-1, -1);
	DDD._w= 0;
	DDD._h = 0;
	desk._add(DDD);
//»
	CG = make('div');//Click Guard«
	CG.id = 'click_guard';
	CG._dis= 'none';
	CG._pos= "fixed";
	CG._loc(0, 0);
	CG._z= CG_Z;
	CG._bgcol= "#000";
	CG._w= "100%";
	CG._h = "100%";
	CG._op= DEF_CG_OP;
	CG.on = useop => {
		if (isFin(useop)) CG._op= useop;
		else CG._op= DEF_CG_OP;
		CG._dis= "block";
	};
	CG.off = () => {
		CG._dis= "none";
	};
	CG.onclick = focus_editing;
	CG.ondblclick = focus_editing;
	CG.onmousedown = e => {
		if (desk_menu) {
			e.stopPropagation();
			return desk_menu.kill();
		}
		focus_editing(e);
	};
	CG.onmouseup = focus_editing;
	CG.oncontextmenu = focus_editing;
	CG.onmousemove = nopropdef;
//»
	overlay=(()=>{//«
		let fakediv = make('div');
		fakediv.innerHTML = '<div style="opacity: '+OVERLAYOP+';border-radius: 15px; font-size: xx-large; padding: 0.2em 0.5em; position: fixed; -webkit-user-select: none; transition: opacity 180ms ease-in; color: rgb(16, 16, 16); background-color: rgb(240, 240, 240); font-family: monospace;"></div>';
		return fakediv.childNodes[0];
	})();
	overlay._z=CG_Z+1;
//»
	desk._add(CG);
	body._add(desk);
	if (!admin_mode) body._add(desk_imgdiv);

}
//»
const set_desk_events = () => {//«

//didleave/on/off«
	let didleave = false;
	const on = () => {
		if (!CDL) return;
		CDL.into(desk.name);
	};
	const off = () => {
		if (!CDL) return;
		CDL.reset();
	};
//»
	desk.onmousemove = e => {//«

		ev = e;
		if (CDL) {//«
//log(CDL);
if (!ICONS[0]){
CDICN = null;
cldragimg();
return;
}
			if (e.clientX+CDL.clientWidth+CDL_OFFSET-winx() > winw()){
				CDL._x="";
				CDL._r= winw()-e.clientX+winx();
			}
			else{
				CDL._r="";
				CDL._x=e.clientX+CDL_OFFSET-winx();
			}

			if (e.clientY+CDL.clientHeight+CDL_OFFSET-winy() > winh()){
				CDL._y="";
				CDL._b= winh()-e.clientY+winy();
			}
			else {
				CDL._b="";
				CDL._y=e.clientY+CDL_OFFSET-winy();
			}
		}//»
		else if (CRW) handle_resize_event(e);
		else if (CDW) {//«
			let x = e.clientX-DDX;
			let y = e.clientY-DDY;
			let elm = CDW.winElem;
			if (x<0) {
				if (!win_overflow.left) {
					DDX+=x;
					x = 0;
				}
			} 
			else {
				let dx = x + elm.offsetWidth - winw();
				if (dx > 0 && !win_overflow.right) {
					x -= dx;
					DDX+=dx;
				}
			}
			if (y<0) {
				if (!win_overflow.top) y = 0;
			} 
			else {
				let dy = y + elm.offsetHeight - winh();
				if (dy > 0 && !win_overflow.bottom) y -= dy;
			}
			elm._loc(x, y);
			if (CDW.moveDiv) CDW.moveDiv.update();
		}//»
		else if (DDIE) {//«
			clearTimeout(drag_timeout);
			if (DDIE.clientX < e.clientX) {
				DDD.style.right = "";
				DDD._x= DDIE.clientX-winx();
				DDD._w= e.clientX - DDIE.clientX;
			} else {
				DDD.style.left = "";
				DDD.style.right = (winw() - DDIE.clientX+winx())+"px";
				DDD._w= DDIE.clientX - e.clientX;
			}
			if (DDIE.clientY < e.clientY) {
				DDD.style.bottom = "";
				DDD._y= DDIE.clientY-winy();
				DDD._h = e.clientY - DDIE.clientY;
			} else {
				DDD.style.top = "";
				DDD.style.bottom = (winh(true) - DDIE.clientY+winy())+"px";
				DDD._h = DDIE.clientY - e.clientY;
			}
drag_timeout = setTimeout(()=>{
	select_icons_in_drag_box_desk(e);
},0);
		}//»
		else if (WDIE) {//«
			clearTimeout(drag_timeout);
			let w = CWIN;
			if (!w){
				WDIE = null;
				return;
			}
			let m = w.Main;
			let scrtopdiff = m.scrollTop - WDIE.scrtop;
			let scrleftdiff = m.scrollLeft - WDIE.scrleft;
			let d = w.dragDiv;
			if (!d){
				WDIE = null;
				return;
			}
			let x_scroll_diff = m.offsetWidth - m.clientWidth;
			let y_scroll_diff = m.offsetHeight - m.clientHeight;
			let gotw;
			let goth;
			if (WDIE.clientX < e.clientX) {
				d.style.right = "";
				d._x= WDIE.clientX - w.winElem.offsetLeft + m.scrollLeft - scrleftdiff - winx();
				gotw = e.clientX - WDIE.clientX + scrleftdiff;
				if (gotw > WDIE._maxWidth) gotw = WDIE._maxWidth;
				d._w= gotw;
			} else {
				d.style.left = "";
				d.style.right = (w.main._w - (WDIE.clientX - w.winElem.offsetLeft + m.scrollLeft) - x_scroll_diff + scrleftdiff + winx())+"px";
				d._w= WDIE.clientX - e.clientX - scrleftdiff;
			}
			if (WDIE.clientY < e.clientY) {
				d.style.bottom = "";
				d._y= WDIE.clientY - w.winElem.offsetTop - w.titleBar._h + m.scrollTop - scrtopdiff-winy();
				d._h = e.clientY - WDIE.clientY + scrtopdiff;
			} else {
				d._y= e.clientY - m.getBoundingClientRect().top + m.scrollTop;
				d._h = WDIE.clientY - e.clientY - scrtopdiff;
			}
			drag_timeout = setTimeout(()=>{w.selectIcons();},0);
		}//»
		else if (!taskbar_expert_mode){//«
			if (CWIN&&CWIN.isFullscreen) return;
			if (e.clientY+hidden_taskbar_thresh >=window.innerHeight){
				if (taskbar_hidden){
					if (taskbar_timer) return;
					taskbar_timer = setTimeout(()=>{
						taskbar.taskbarElem._b=0;
					}, SHOW_TASKBAR_DELAY_MS);
				}
				else {
					if (taskbar_timer) return;
					taskbar_timer = setTimeout(()=>{
						taskbar.taskbarElem._z=CG_Z-1;
					}, SHOW_TASKBAR_DELAY_MS);
				}
			}
			else {
				if (taskbar_hidden){
					if (taskbar_timer){
						clearTimeout(taskbar_timer);
						taskbar_timer=null;
						return;
					}
					taskbar.taskbarElem._b=-taskbar.taskbarElem._gbcr().height;
				}
				else {
					if (taskbar_timer){
						clearTimeout(taskbar_timer);
						taskbar_timer=null;
						return;
					}
					taskbar.taskbarElem._z = MIN_WIN_Z - 1;
				}
			}
		}//»

	};//»
	desk.onmouseup = async e => {//«
		e.preventDefault();
		e.stopPropagation();
		body.style.cursor = "default";
		desk.style.cursor = "default";
		DDIE = null;
		DDD._loc(-1, -1);
		DDD._w= 0;
		DDD._h = 0;
		ev = e;
		if (CDICN) {
			cldragimg();
			desk.style.cursor = "";
			if (document.elementFromPoint(e.clientX,e.clientY)!==desk){
				CDICN = null;
				return;
			}
			if (SHOW_ICONS) {
			if (CDICN.parWin == desk) { /*Back where we started:just move icon*/
				let proms = [];
				for(let i=0;i<ICONS.length;i++) ICONS[i].off();
				CG.on();
				let pos={X:e.clientX+desk.scrollLeft,Y:e.clientY+desk.scrollTop};
				proms.push(placeInIconSlot(CDICN, {pos:pos, noClear: true}));
				CDICN.moved = true;
				for (let i = 0; i < ICONS.length; i++) {
					let icn = ICONS[i];
					if (ICONS[i] != CDICN) {
						proms.push(placeInIconSlot(icn, {pos:pos, noClear: true}));
					}
				}
				await Promise.all(proms);
				ICONS = [];
				CG.off();
			}
			else if (CDICN.parWin.fullpath != desk.fullpath) {
				await move_icons(DESK_PATH, {e});
				CDICN = null;
				return;
			}
			}
			CDICN = null;
		}
		else clear_drag_resize_win();
/*«
		else if (CDW) {
			CDW.winElem.style.boxShadow = window_boxshadow;
			CDW.sbcr();
			CDW = null;
		} 
		else if (CRW) {
			CRW.sbcr();
			delete CRW.rsDir;
			delete CRW.startx;
			delete CRW.starty;
		}
»*/
	};//»
	desk.onmousedown = e => {//«
		e.preventDefault();
		if (CWIN) {
			CWIN.off();
			CWIN = null;
			CUR.todesk();
		}
		icon_array_off(2);
		if (e.button===0) DDIE = e;
//		desk.area.focus();
		CDICN = null;
	};//»
	desk.onclick = e => {//«
		taskbar.switcherOff();
		if (!windows_showing) toggle_show_windows();
		if (desk.dblclick) delete desk.dblclick;
	};//»
	desk.ondblclick = e => {//«
//log(`${e.timeStamp} DBL`);
	};//»
	desk.onmouseleave = e => {//«
		if (document.elementsFromPoint(e.clientX,e.clientY).includes(desk)) return;
		body.style.cursor = "default";
		desk.style.cursor = "default";
		if (DDIE) desk_drag_off();
		cldragimg();
		CDICN = null;
		clear_drag_resize_win();
		if (taskbar_hidden) taskbar.taskbarElem._b=-taskbar.taskbarElem._gbcr().height;
		else taskbar.taskbarElem._z=MIN_WIN_Z-1;
		if (taskbar_timer){
			clearTimeout(taskbar_timer);
			taskbar_timer=null;
		}
	};//»
	desk.onmouseout = e => {//«
		if (CDICN) {
			didleave = true;
			off();
			return;
		}
		if (CDL && CDL.clearFromStorage) CDL.clearFromStorage();
	};//»
	desk.onmouseover = e => {//«
		if (!SHOW_ICONS) return;
		if (CDL && CDL.copyto) CDL.copyto("Desktop");
		if (!CDICN) {
			return;
		}
		if (CDICN.parWin === desk) return;
		if (CDICN.path === DESK_PATH) return;
		if (CDICN.noMove) return;
		if (newPathIsBad(CDICN.fullpath, DESK_PATH + "/" + CDICN.name)) return;
		didleave = false;
		if (!CDICN) return;
		if (!didleave) on();
	};//»
	desk.oncontextmenu = e => {//«
		if (isMobile || e.altKey || !cmenu_active) return;
		e.preventDefault();
		e.stopPropagation();
		CWIN&&CWIN.off();
		let usex=e.clientX, usey=e.clientY;
		set_context_menu({
			X: usex,
			Y: usey
		});
	};//»
	desk.ondrop = async e => {//«
		e.preventDefault();
		if (!SHOW_ICONS) return;
		save_dropped_files(e, desk);
	};//»
	desk.ondragover = async e => {//«
//log("desk over");
	};//»

};
//»
const make_desktop = () => {//«
	taskbar = new Taskbar();
	taskbar.renderSwitcher();
	desk.fullpath = DESK_PATH;
	desk.name = DESK_PATH.split("/").pop();
	desk.id = "desktop";
	Desk.desk = desk;
	globals.desk_elem = desk;
	get_desk_grid();
	set_desk_styles();
	set_desk_events();

}//»
const desk_drag_off=()=>{DDIE=null;DDD._loc(-1,-1);DDD._w=0;DDD._h=0;}
const make_cur_drag_img = () => {//«
	let d = mkdv();
	d.className = "dragimg";
	let s = mksp();
	d._pos= "fixed";
	d._z= CG_Z - 1;
	ICONS = uniq(ICONS);
	let numarg = ICONS.length || 1;
	let base_str = '<b>' + numarg + '</b>\xa0items\xa0\u2ba9\xa0';
	d.into = name => {
		s.innerHTML = base_str + '"<b><i>' + name + '</i></b>"';
		d._op= 1;
		d._bor= "2px ridge #0f0";
	};
	d.reset = () => {
		s.innerHTML = base_str + "...";
		d._op= DRAG_IMG_OP;
		d._bor= "2px ridge #999";
	};
	d.nogo = elm => {
//		elm.style.cursor = "not-allowed";
		d._op= 1;
		d._bor= "2px ridge #f00";
	};
	d._padl= 10;
	d._padt= d._padb= d._padr= 5;
	d._bgcol= "#fff";
	d._tcol= "#000";
	d._fs= "16px";
	d.reset();
	d._add(s);
	return d;
};//»
const cldragimg = if_hard => {//«
	if (if_hard) {
		let arr = desk.getElementsByClassName("dragimg");
		for (let d of arr) d._del();
	} else CDL && CDL._del();
	CDL = null;
	desk.style.cursor = "";
};//»

//»
//«Workspaces

//JDURKJS

class Workspace{//«

constructor(num){//«
	this.num=num;
	this.windows=[];
	this.tilingMode = false;
	this.layoutMode = false;
	this.allowClose = true;
	this.allowMove = true;
	this.allowResize = true;
	this.allowMinimize = true;
	this.allowNone = false;

}//»
keyDown(e,kstr,mod_str){//«
	if (!CWIN) return;
	let is_full=CWIN.isFullscreen;
	let is_max=CWIN.isMaxed;
	let cobj = CWIN.app;
	if (!cobj) return;
	if (!(cobj.overrides && cobj.overrides[kstr])){//«
//Unless your app explicitly overrides them, the system intercepts the <arrow>_S
//and <arrow>_CS hotkeys for basic window moving and resizing (of non
//maxed/fullscreened wins).
		if (kstr==="f_A"){//«
			e.preventDefault();
			if (!CWIN.checkProp("Resize")) return;
			CWIN.fullscreen();
			return;
		}//»
		if (kstr==="m_A"){//«
			e.preventDefault();
			if (!CWIN.checkProp("Resize")) return;
			CWIN.maximize();
			return;
		}//»
		if (kstr==="n_A"){//«
			e.preventDefault();
			if (!CWIN.checkProp("Minimize")) return;
			CWIN.minimize();
			return;
		}//»
		if (kstr==="x_A"){//«
			e.preventDefault();
			if (!CWIN.checkProp("Close")) return;
			if (check_cwin_owned()) return;
			CWIN.close();
//				CWIN.minimize();
			return;
		}//»
		if (kstr==="r_A") {//«
			if (!globals.dev_mode) {
cwarn(`win_reload: "dev mode" is not enabled!`);
				return;
			}
			if (!CWIN) return;
			if (check_cwin_owned()) return;
//				CWIN.reload();
			win_reload();
			return;
		}//»
		if (kstr=="c_A"&&CWIN.appName!==FOLDER_APP) return CWIN.contextMenuOn();
		if (!(is_full||is_max)) {//«
			if (kstr.match(/^(RIGHT|LEFT|UP|DOWN)_S$/)) {
				if (is_max) return;
				if (!CWIN.checkProp("Move")) return;
				return move_window(kstr[0]);
			}
			const OK_RESIZE_KEYS=[ "RIGHT_CS","LEFT_CS","DOWN_CS","UP_CS" ];
			if (OK_RESIZE_KEYS.includes(kstr)) {
				if (!CWIN.checkProp("Resize")) return;
				if (kstr=="RIGHT_CS") resize_window("R");
				else if (kstr=="LEFT_CS") resize_window("R", true);
				else if (kstr=="DOWN_CS") resize_window("D");
				else if (kstr=="UP_CS") resize_window("D", true);
				return;
			}
		}//»
	}//»
	if (CWIN.isLayout || CWIN.isMinimized || CWIN.killed) return;
	if (cobj.onkeydown) cobj.onkeydown(e, kstr, mod_str);
}//»
keyUp(e){//«
	if (!CWIN) return;
	if (CWIN.app.onkeyup) CWIN.app.onkeyup(e, evt2Sym(e));
}//»
keyPress(e){//«
	if (!CWIN) return;
	let code = e.charCode;
	if (code >= 32 && code <= 126 && CWIN.app.onkeypress) CWIN.app.onkeypress(e);
}//»
on(){//«
//	if (this.tilingMode) tiling_underlay.on();
	windows = this.windows;
	for (let w of windows){
		if (!w.isMinimized) w.winElem._dis="block";
		else w.taskbarButton._dis="flex";
	}
	top_win_on();
}//»
off(){//«
	for (let w of windows){
		if (!w.isMinimized) w.winElem._dis="none";//was block
		else {
			w.taskbarButton._dis="none";//was flex
		}
	}
//	if (workspace.tilingMode) tiling_underlay.off();
	if (CWIN) CWIN.off();
	if (ICONS.length && ICONS[0].parWin !==desk){
		icon_array_off();
	}
}//»

}//»
/*«Init*/
let workspaces = [];
for (let i = current_workspace_num; i < num_workspaces; i++ ){
	workspaces.push(new Workspace(i));
}
this.workspaces = workspaces;
let workspace = workspaces[current_workspace_num];
let windows = workspace.windows;
/*»*/
const switch_to_workspace = (num, if_force) => {//«

if (!if_force && num == current_workspace_num){
	cwarn("ALREADY ON IT");
	return;
}

workspace.off();
current_workspace_num = num;

workspace = workspaces[current_workspace_num];
workspace.on();

show_overlay(`Current workspace: ${current_workspace_num+1}`);
set_workspace_num(current_workspace_num);
taskbar.renderSwitcher();

/*«
for (let w of windows){
	if (!w.isMinimized) w.winElem._dis="none";//was block
	else {
		w.taskbarButton._dis="none";//was flex
	}
}
if (workspace.tilingMode) tiling_underlay.off();
if (CWIN) CWIN.off();
if (ICONS.length && ICONS[0].parWin !==desk){
	icon_array_off();
}
current_workspace_num = num;
workspace = workspaces[current_workspace_num];
if (workspace.tilingMode) tiling_underlay.on();
windows = workspace.windows;
//windows = workspaces[current_workspace_num].windows;

for (let w of windows){
	if (!w.isMinimized) w.winElem._dis="block";
	else w.taskbarButton._dis="flex";
}
show_overlay(`Current workspace: ${current_workspace_num+1}`);
set_workspace_num(current_workspace_num);
taskbar.renderSwitcher();
top_win_on();
*»*/
};
api.switchToWorkspace = switch_to_workspace;
//»

//»
//Windows«

class Window {//«

#rect;
constructor(arg){//«

	this.allowClose = true;
	this.allowMove = true;
	this.allowResize = true;
	this.allowMinimize = true;
	this.allowNone = false;

	let winargs = arg.WINARGS||{};
	this.winArgs = winargs;
	let app = arg.appName;
	this.appName = arg.appName;
	let is_folder = app === FOLDER_APP;
	this.isFolder = is_folder;
	this.winNum = ++win_num;

	this.winId = winargs.ID || "win_"+this.winNum;
	this.id=this.winId;

	this.Desk = Desk;
	this.workspaceNum = current_workspace_num;

	this.app = {onresize:NOOP};
	this.appName = app;
	this.type = "window";
	if (arg.APPARGS) this.noSave = true;
	else this.noSave = null;
	this.ownedBy = undefined;


	this.makeDOMElem(arg);
	this.addDOMListeners();

	arg.topWin = this;
	if (arg.SAVER) {
//		this.bottomPad = botpad;
		this.bottomPad = winargs.BOTTOMPAD;
		this.saver = arg.SAVER;
		arg.SAVER.folderCb(this);
	}
	windows.push(this);
	this.arg = arg;

	if (winargs.isMaxed){
//		max.innerText="\u{1f5d7}";
		this.maxButton.innerText="\u{1f5d7}";
		this.isMaxed = true;
		let dims = winargs.holdDims;
		this.maxHoldX=dims.X;
		this.maxHoldY=dims.Y;
		this.maxHoldW=dims.W;
		this.maxHoldH=dims.H;
	}
	if (winargs.isFullscreen){
		this.isFullscreen = true;
		let dims = winargs.holdDims;
		this.fsHoldX=dims.X;
		this.fsHoldY=dims.Y;
		this.fsHoldW=dims.W;
		this.fsHoldH=dims.H;
	}
}//»

//Methods«
resize(){//«
	this.sbcr();
	this.statusBar.resize();
	this.app.onresize();
	if (this.moveDiv) this.moveDiv.update();
}//»
sbcr(){this.#rect=this.winElem.getBoundingClientRect();}
gbcr(){return this.#rect;}
checkProp(which){//«
	let workspace = workspaces[this.workspaceNum];
	if (workspace.allowNone){
		show_overlay(`Workspace[${this.workspaceNum+1}].allowNone == true`);
		return false;
	}
	if (this.allowNone){
		show_overlay(`Window[${this.winNum}].allowNone == true`);
		return;
	}
	let prop = "allow"+which;
	if (!workspace[prop]){
		show_overlay(`Workspace[${this.workspaceNum+1}].${prop} == false`);
		return false;
	}
	if (this[prop]) return true;
	show_overlay(`Window[${this.winNum}].${prop} == false`);
	return false;
}//»
makeDOMElem(arg){//«

	let marr;
	let {winId: winid, winArgs: winargs, appName: app} = this;
	let wintitle;
//	let winargs = this.winArgs;

	if (arg.name) wintitle = arg.name;
	else if (winargs.TITLE) wintitle = winargs.TITLE;
	else wintitle = "Untitled";

	let usex, usey, usew, useh;
	let defwinargs = get_newwin_obj();
	if (isFin(winargs.X)) usex = winargs.X;
	else usex = defwinargs.X;

	if (isFin(winargs.Y)) usey = winargs.Y;
	else usey = defwinargs.Y;

	if (isFin(winargs.WID)) usew = winargs.WID;
	else if (winargs.WID === "100%") usew = winw();
	else usew = defwinargs.WID;

	let botpad = winargs.BOTTOMPAD;
	if (isFin(winargs.HGT)) useh = winargs.HGT;
	else if (winargs.HGT === "100%") useh = winh();
	else {
		useh = defwinargs.HGT;
		if (botpad) useh -= botpad;
	}
	let win = make("div");//The top level window«
	win.id = winid;
	no_select(win);

//I guess this is here so the app name shows up in the Elements view of devtools
	win.dataset.app = app;
	win._pos= "fixed";
//	win._bor= "1px solid #333";
	win._x=usex;
	win._y=usey;
	win._z=HI_WIN_Z+1;
	win.className="topwin";
	win.style.boxShadow = window_boxshadow;
	win._winObj = this;

//»
	let main = make("div");//The application area«
	no_select(main);
	main.top = this;
	main.id = "main_"+winid;
	main._w=usew;
	main._h=useh;
	main._bgcol= APP_BG_COL;
	main._tcol= APP_TEXT_COL;
	main._bor= "0px solid transparent";
	main._pos= "relative";
	main.className="mainwin";
	main.type = "window";
//»
	let titlebar = make('div');//«
	titlebar.id="titlebar_"+winid;
	titlebar._h = 18;
	no_select(titlebar);
	titlebar.className = "titlebar";
	titlebar.win = win;
	main.titleBar = titlebar;
	main.appName = app;
	let title = make("div");
	title.id="title_"+winid;
	title._padt=1.25;
	title._ta= "center";
	title._pos= "relative";
	title._tcol= "black";
	title._ff= "sans-serif";
	titlebar._add(title);

	let namespan = make('span');
	namespan._dis="block";
	namespan.id="namespan_"+winid;
	namespan._fs= 12;
	namespan.title = winid;
	titlebar.label = namespan;
	title._add(namespan);
	main._over="hidden";

	let img_div = make('div');
	img_div._pos= "absolute";
	img_div._bor= "0px solid transparent";
	img_div._x= 0;
	img_div._y= 0;
	img_div._padb= 3;
	img_div.style.cursor = "default";

	img_div.draggable=true;
	img_div.ondragstart=nopropdef;

	img_div.onclick = ()=>{this.contextMenuOn()};
	title._add(img_div);
	img_div.innerText = getAppIcon(app?app.split(".").pop():DEF_BIN_APP);
	img_div.id="titleimgdiv_"+winid;
	img_div._fs=12;
	img_div._tcol="#a7a7a7";
	img_div.title = app.split(".").pop();
//»
//«Min/Max/Close buttons

	const mkbut = (sz) => {//«
//	const mkbut = (col, sz) => {
		let b = make('div');
		b._over= "hidden";
		b._padl=b._padr=2;
		b._ta= "center";
		b._fs= sz;
		b._w= 16;
		b._h = 16;
		b._bor="1px solid #000";
		b._bgcol= WINBUT_OFF_COL;
		b.onmousedown=e=>{e.stopPropagation();};
		b.hover = () => {
			b._bgcol=WINBUT_ON_COL;
		};
		b.unhover = () => {
			b._bgcol=WINBUT_OFF_COL;
		};
		b.top = win;
		butdiv._add(b);
		return b;
	};//»
	const doclose = (force, if_dev_reload)=>{//«
//	const doclose = function(evt, thisarg, force, if_dev_reload) {
		if (!this.checkProp("Close")) return;
		if (this.isMinimized) return;
		if (!force && (this != CWIN)) return;
		if (this.no_events) return;
		if (this.nobuttons && !force) return;
		if (this.app.onkill) this.app.onkill(if_dev_reload, force);
		OUTERLOOP2: for (let wspace of workspaces) {
			let wins = wspace.windows;
			for (let i = 0; i < wins.length; i++) {
				if (wins[i] == this) {
					wins.splice(i, 1);
					break OUTERLOOP2;
				}
			}
		}
		if (this.isFolder) icon_array_off(3);
		this.killed = true;
		this.app.killed = true;
		win._del();
		let icn = this.icon;
		let node = this.node;
		if (icn) {
			if (!node) node = icn.node;
			icn.win = null;
		}
		if (node && node.unlockFile) node.unlockFile();
		if (this.bindNum){
			delete globals.boundWins[this.bindNum];
			show_overlay(`${this.bindNum}: the key has been unbound`);
		}
		top_win_on();
	};//»
	const onhover=function(){//«
		if (CDL) return;
		butdiv._op= 1;
		this.hover();
	};//»
	const onunhover=function(){//«
		if (CDL) return;
		if (this !== CWIN) butdiv._op=0.5;
		else butdiv._op= 0.75;
		this.unhover();
	};//»

	let butdiv = make('div');//«
	butdiv.style.cursor = "default";
	butdiv.off = () => {
		butdiv._op= 0.5;
	};
	butdiv.on = () => {
		butdiv._op= 0.75;
	};
	butdiv._pos= "absolute";
	butdiv._r= 3;
	butdiv._y= 0;
	butdiv._dis= "flex";
	butdiv.style.flexDirection = "row-reverse";
	butdiv._h = 16;
	butdiv._z=1000000;
	butdiv._tcol= "#000";
	butdiv.win = this;
//»
	let close = mkbut("15px");//«
	close.id="closebut_"+winid;
	close.innerHTML="<b>X</b>";
	close.title="Close";
	close.style.lineHeight = "110%";
	butdiv.close = close;
	titlebar.close = close;
	this.easyKill=()=>{
//		doclose(null, close);
		doclose();
	}
	this.forceKill = if_dev_reload => {
		if (this.isMinimized) this.unminimize(true);
//		doclose(null, close, true, if_dev_reload);
		doclose(true, if_dev_reload);
	};
	close.onclick=()=>{
		if (check_cwin_owned()) return;
//		if (this._savecb) this._savecb();
		this.forceKill();
	}
	this.keyKill = () => {
		if (this.app && this.app.is_editing) {
			if (this.app.try_kill) this.app.try_kill();
			else cwarn("Dropping close signal");
		} 
		else {
//			doclose(null, close, true);
			doclose(true);
		}
	};
//»
	let max = mkbut("14px");//«
	max.id="maxbut_"+winid;
	max.style.lineHeight = "16px";
	max.reset=()=>{
		max.innerText="\u{1f5d6}";
		max.title="Maximize";
		win.style.boxShadow = window_boxshadow;
	};
	max.onclick = () => {
		if (!this.checkProp("Resize")) return;
		close.unhover();
		max.unhover();
		min.unhover();
		this.maximize();
	};
	max.reset();
//»
	let min = mkbut("14px");//«
	min.id="minbut_"+winid;
	min.innerText="\u{2b07}"; //Solid down arrow
	min.style.lineHeight="135%";
	min.title="Minimize";
	min.onclick=()=>{
		if (!this.checkProp("Minimize")) return;
		if (this.isFullscreen) {
			if (this!==CWIN) {
cwarn("this!==CWIN ????");
				return;
			}
			this.fullscreen(true);
		}
		if (this.isMinimized) return;
		if (ICONS.length && ICONS[0].parWin==this) icon_array_off();
		taskbar.addwin(this);
	};
//»
//Button event listeners«
	close.draggable=max.draggable=min.draggable=true;
	close.ondragstart=max.ondragstart=min.ondragstart=(e)=>nopropdef;
	close.onmousedown=max.onmousedown=min.onmousedown=(e)=>{
		icon_array_off();
	}
	close.onmouseenter=onhover;
	close.onmouseleave=onunhover;
	max.onmouseenter=onhover;
	max.onmouseleave=onunhover;
	min.onmouseenter=onhover;
	min.onmouseleave=onunhover;
//»
	title._add(butdiv);
//»
	let footer = make('div');//«
	let footer_wrap=make('div');
	footer_wrap._pos="relative";
//«
//The BOTTOMPAD property is ultimately given to us via a WINARG argument, so
//that, for example, from Desk.api.saveAs (@DWEUNFKL), a folder window can be
//opened up that has a Main window with a smaller height than normal (shrunken by
//the amount of SAVEAS_BOTTOM_HGT), so that buttons (like Save and Cancel) can be
//put on the bottom. The point is that this bottom area is considered to be part
//of the system's "window chrome" (like the titlebar), and the application
//doesn't have to worry about changing anything about the logic of it's own
//layout.
//»
	let bottom_div = make('div');
	if (botpad){
		bottom_div._bgcol="#373747";
		bottom_div._tcol="#ddd";
		bottom_div.style.borderTop="1px solid #556";
		bottom_div.style.borderBottom="1px solid #556";
		bottom_div._h=botpad-2;
		footer_wrap._add(bottom_div);
	}
	footer._dis="flex";
	footer.style.justifyContent="space-between";
	footer._h=18;
	let statdiv=make('div');
	statdiv.id="stat_"+winid;
	statdiv.onmousedown=e=>{
		e.stopPropagation();
		icon_array_off();
	};
	statdiv.onclick=noprop;
	statdiv.oncontextmenu=noprop;
	statdiv._tcol="#ddd";
	statdiv._fs=14;
	statdiv._padl=15;
	statdiv._padt=1;
	statdiv._over="hidden";
	let rsdiv = make('div');
	rsdiv.id="rsdiv_"+winid;
	rsdiv.win = this;
	rsdiv.style.flex="0 0 15px";
	rsdiv._bgcol="#778";
	rsdiv._bor="2px inset #99a";
	rsdiv.onmouseover=e=>{
		if (CDL) rsdiv.style.cursor = "";
		else rsdiv.style.cursor = "nwse-resize";
	};
	rsdiv.draggable=true;
	rsdiv.ondragstart=e=>{
		e.preventDefault();
		if (!this.checkProp("Resize")) return;
		if (this.isMaxed) {
			max.reset();
			this.isMaxed = false;
		}
		CRW = this;
		if (CRW != CWIN) CRW.on();
		desk.style.cursor = "nwse-resize";
	};
	rsdiv.onmouseup=(e)=>{
		clear_drag_resize_win();
	};
	statdiv.resize=()=>{statdiv.style.maxWidth = main._w - 20;};

	footer._add(statdiv);
	footer._add(rsdiv);
	footer_wrap._add(footer);
//FSKEUSHFK
	let numdiv = mkdv();
	numdiv.style.cssText=`
position: absolute;
color: #aaa;
font-size: 12.5px;
left: 1.5px;
top: 2.75px;
	`;
	numdiv.innerHTML=`${this.winNum}`;
	footer_wrap._add(numdiv);
//»

	win._add(titlebar);
	win._add(main);
	win._add(footer_wrap);
	desk._add(win);
	this.Main = main;
	this.main = main;

	this.imgDiv = img_div;
	this.nameSpan = namespan;
	this.bottomDiv = bottom_div;
//log(this.bottomDiv);
	this.statusBar = statdiv;
	this.rsDiv = rsdiv;
	this.footer=footer_wrap;
	this.butDiv = butdiv;
	this.closeButton = close;
	this.maxButton = max;
	this.minButton = min;
	this.titleBar = titlebar;
	this.titleDiv = title;
	this.title = wintitle;
	this.winElem = win;

	this.sbcr();

}//»
addDOMListeners(){//«
	let {winElem: win, main, titleDiv: title, titleBar: titlebar}=this;

	if (this.isFolder) {//«
		let didleave;
		const clear_drag = () => {//«
			WDIE = null;
			let dd = this.dragDiv;
			dd._loc(-1, -1);
			dd._w = 0;
			dd._h = 0;
		};//»
		const nogo=()=>{//«
			if (!CDL) return;
			CDL.nogo();
			main.style.cursor = "not-allowed";
		};//»
		const on = () => {//«
			if (!CDL) return;
			main.style.cursor = "copy";
			CDL.into(this.name);
		};//»
		const off = () => {//«
			main.style.cursor = "";
			if (CDL) CDL.reset();
		};//»
		main.onmousedown=e=>{//«
			e.stopPropagation();
			icon_array_off(20);
			if (e.clientX < win.offsetLeft + main.clientWidth + winx() && e.clientY < win.offsetTop + main.clientHeight + this.titleBar._h + winy()) {
				this.on();
				WDIE = e;
				WDIE.scrtop = main.scrollTop;
				WDIE.scrleft = main.scrollLeft;
				let gotw = main.scrollWidth - (e.clientX - win.offsetLeft + main.scrollLeft);
				WDIE._maxWidth = gotw - 1 + winw();
			}
			if (CWIN == this) return;
			CWIN&&CWIN.off();
			this.on();
		};//»
		main.onmouseover=async e=>{//«
			e.stopPropagation();
			if (CDICN){
				let thispath = this.fullpath;
				if (CDICN.path === thispath) return nogo();
				if (!await fsapi.checkDirPerm(thispath)||(newPathIsBad(CDICN.fullpath, `${thispath}/${CDICN.node.name}`))) return nogo();
				didleave = false;
				if (!CDICN) return;
				if (!didleave) on();
			}
		};//»
		main.onmouseout=e=>{//«
			e.stopPropagation();
			off();
			if (CDICN) {
				didleave = true;
			}
		};//»
		main.onmouseup=async e=>{//«
			e.stopPropagation();
			if (CDICN){
				desk.style.cursor = "";
				await move_icons(this.fullpath, {e, win: this});
				off();
				CWIN&&CWIN.off();
				CDICN = null;
				cldragimg();
			}
			else {
				clear_drag_resize_win();
				clear_drag();
			}
		};//»
		main.ondrop=e=>{//«
			e.stopPropagation();
			e.preventDefault();
			save_dropped_files(e, this);
		};//»
		main.onmouseleave=e=>{clear_drag();};
		main.ondragover=e=>{};
		this.clearDrag = clear_drag;
		win.onmouseover=noprop;
		win.onmouseout=noprop;
	}//»
	else{//«
		main.onmouseup=e=>{
			clear_drag_resize_win();
		};
		main.ondrop=e=>{
cwarn("No drop on main window");
		};
		win.onmouseover=()=>{
			if (!CDL) return;
			CDL.nogo();
			win.style.cursor = "not-allowed";
			main.style.cursor = "not-allowed";
		};
		win.onmouseout=()=>{
			if (!CDL) return;
			CDL.reset();
			win.style.cursor = "";
			main.style.cursor = "";
		};
	}//»
	title.ael('mouseover',()=>{body.style.cursor="default";});
	titlebar.onmouseover=e=>{//«
		if (CDL) titlebar.style.cursor = "";
		else titlebar.style.cursor = "move";
	};//»
	titlebar.oncontextmenu = nopropdef;
	titlebar.draggable=true;
	titlebar.ondragstart=e=>{//«
		e.preventDefault();
//		if (this.isMaxed) this.max_button.reset();
		if (!this.checkProp("Move")) return;
		if (this.isMaxed) return;
		win.style.boxShadow = "";
		CDW = this;
		DDX = e.clientX - pi(win.offsetLeft);
		DDY = e.clientY - pi(win.offsetTop);
	};//»
	main.oncontextmenu = e => {//«
		e.preventDefault();
		e.stopPropagation();
	};//»
	win.ondrop = e => {//«
		e.stopPropagation();
		e.preventDefault();
	};//»
	win.onclick=noprop;
	win.ondblclick=noprop;
	win.onmousedown=e=>{//«
		e.stopPropagation();
		icon_array_off(21);
		this.on();
	};//»
	win.ondrop = nopropdef;
	win.ondragover = nopropdef;

}//»
contextMenuOn(e){//«
	let {imgDiv: img_div, winElem: win, winId: winid} = this;

	if (!this.app.get_context) return;
	let items = this.app.get_context();
	if (!items) items = [];
	items.push("Switch\xa0to\xa0workspace");
	let choices = [];
	for (let i=0; i < num_workspaces; i++){
		if (i!=current_workspace_num){
			choices.push(`${i+1}`);
			choices.push(()=>{
				if (windows.layout_mode) toggle_layout_mode();
				switch_win_to_workspace(this, i);
				this.off();
				win._dis="none";
				top_win_on();
			});
		}
	}
	items.push(choices);
	items.push(`Window ${winid.replace(/^win_/,"")} properties...`, ()=>{
		let rect = win._gbcr();
		let str = Math.round(rect.width) + "x" + Math.round(rect.height) + "+" + Math.round(rect.left) + "+" + Math.round(rect.top);
		popup(str);
	});
//		items.push(`Window id: ${winid.replace(/^win_/,"")}`, null);
	CG.on();
	let op_hold = img_div._op;
	let usex,usey;
	if (e) {
		usex = e.clientX;
		usey = e.clientY;
	}
	else{
		img_div._bgcol= "#fff";
		img_div._tcol= "#000";
		img_div._op=1;
		let rect = win._gbcr();
		usex = rect.left;
		usey = rect.top+this.titleBar._h;
	}
	set_context_menu({X:usex,Y:usey},{items: items});
	desk_menu.kill_cb = () => {
		img_div._op=op_hold;
		img_div._bgcol= "";
		img_div._tcol="#a7a7a7";
	};
};//»
setWinArgs(args){//«
//	let args={BOTTOMPAD: w.bottompad, X: w.winElem._x, Y:w.winElem._y, WID: w.main._w, HGT: w.main._h};
	let {main, winElem: win} = this;
	args.BOTTOMPAD = this.bottompad;
	args.X = win._x;
	args.Y = win._y;
	args.WID = main._w;
	args.HGT = main._h;
	if (this.isMaxed){
		args.isMaxed = true;
		args.holdDims={W: this.maxHoldW, H: this.maxHoldH, X: this.maxHoldY, Y: this.maxHoldY};
	}
	if (this.isFullscreen){
		args.isFullscreen = true;
		args.holdDims={W: this.fsHoldW, H: this.fsHoldH, X: this.fsHoldX, Y: this.fsHoldY, BOR: this.bor_hold};
	}
};//»
	makeScrollable(){//«
		let{main} = this;
		main._overy="auto";
		main.tabIndex="-1";
		this.isScrollable = true;
	};//»
	up(){//«
		if (this.isMinimized) this.unminimize(true);
		this.winElem.style.zIndex = ++HI_WIN_Z;
		if (this.overdiv) this.overdiv.style.zIndex = ++HI_WIN_Z;
	};//»
	on(opts={}){//«
		if (!windows_showing) toggle_show_windows();
		if (CPR) return;
		if (CWIN) {
			if (this === CWIN) return;
			CWIN&&CWIN.off();
		}
		if (this.workspaceNum !== current_workspace_num) {
			if (opts.switchToWorkspace){
				switch_to_workspace(this.workspaceNum);
				if (CWIN) CWIN.off();
			}
			else {
				switch_win_to_workspace(this, current_workspace_num);
				if (this.childWin){
					switch_win_to_workspace(this.childWin, current_workspace_num);
				}
			}
		}
		if (this.isFolder && !this.isMinimized) {
//VKUIOKL
			if (CUR.curElem.parentNode === desk) {
				let icn = CUR.geticon();
				if (icn) icn.hideLabelName();
				desk.lastcurpos = CUR.getpos();
			}
			this.main.focus();
			CUR.iconDiv = this.main.iconDiv;
			CUR.main = this.main;
			this.main._add(CUR.curElem);
			this.cursor = CUR;
//			CUR.set(2);

			CUR.vizCheck();
			CUR.on();
		}
		this.winElem._dis= "block";
		if (this.winElem._z && this.winElem._z < 10000000) this.up();
		
		if (!this.noShadow) this.winElem.style.boxShadow = window_boxshadow;
		document.activeElement.blur();
		this.imgDiv._op= 0.75;
		this.nameSpan._fw = "bold";
		this.nameSpan._tcol= WINNAME_COL_ON;
		this.winElem._bgcol= WIN_COL_ON;
		if (this.butDiv) this.butDiv.on();
		if (this.moveDiv) this.moveDiv.on();
		let winobj = this.app;
		if (winobj) {
			if (winobj.onfocus&&!this.popup) {
				winobj.onfocus();
			}
		}
		else{
cwarn(`window_on(): NO WINOBJ for this`, this);
		}
		if (this.isScrollable) this.main.focus();
		if (this.isMinimized) this.taskbarButton.onmousedown();
		if (this.childWin) this.childWin.on();
		CWIN = this;
	};
	//»
	off(){//«
		if (this.isFolder) {
			delete this.cursor;
			this.cursor = null;
		}
		this.imgDiv._op= 0.5;
		this.nameSpan._fw = "";
		this.nameSpan._tcol= WINNAME_COL_OFF;
		this.winElem._bgcol = WIN_COL_OFF;
		if (this.butDiv) this.butDiv.off();
		if (this.moveDiv) this.moveDiv.off();
		if (this.area) {
			this.area.selectionEnd = this.area.selectionStart;
			this.area.blur();
		}
		this.winElem.style.boxShadow = "";
		if (this.app && this.app.onblur) this.app.onblur();
		if (this.isScrollable) this.main.blur();
		if (this === CWIN) CWIN = null;
		if (this.isMinimized) {
			this.taskbarButton.onmouseup();
			this.winElem._dis="none";
		}
	};
	//»
	setDefs(){//«
		if (isMobile) this.fullscreen(true);
		let a = this.app;
		a.winid = this.id;
		a.topwin = this;
		if (!a.onresize) a.onresize = NOOP;
		if (!a.onappinit) a.onappinit = NOOP;
		if (!a.onkill) a.onkill = NOOP;
		if (!a.onsave) a.onsave = NOOP;
		if (!a.onloadfile) a.onloadfile = NOOP;
		if (!a.onfocus) a.onfocus = NOOP;
		if (!a.onblur) a.onblur = NOOP;
		if (!a.onkeydown) a.onkeydown = NOOP;
		if (!a.onkeyup) a.onkeyup = NOOP;
		if (!a.onkeypress) a.onkeypress = NOOP;
		if (!a.get_context) a.get_context = ()=>{return [];}
	//	check_win_visible(this);

	};//»
	checkVisible(){//«
		let{winElem: win}=this;
//		let rect = win.getBoundingClientRect();
		let rect = this.gbcr();
		if (!rect) return;
		if ((rect.left > winw()) || (rect.right < 0) || (rect.top > winh()) || rect.bottom < 0) {
cwarn("WINDOW IS OFFSCREEN... moving it to 0,0!");
			win._loc(0, 0);
		}
	};
	//»
	checkLoc(){//«
		let {winElem: win} = this;
		let rect = win._gbcr();
		let w = rect.width,
			h = rect.height;
		let miny = 0;
		if (win._x < 0) {
			if (!win_overflow.left) win._x= 0;
			else if (win._x + w < 0) win._x += 2 * win_move_inc;
		} else if (win._x + w > winw()) {
			if (!win_overflow.right) win._x= winw() - w;
			else if (win._x > winw()) win._x -= 2 * win_move_inc;
		}
		if (win._y < miny) {
			if (!win_overflow.top) win._y= miny;
			else if (win._y + h < 0) win._y += 2 * win_move_inc;
		} else if (win._y > miny && win._y + h > winh()) {
			if (!win_overflow.bottom) {
				let usey = winh() - h;
				if (usey < miny) usey = miny;
				win._y= usey;
			} else if (win._y > winh()) win._y -= 2 * win_move_inc;
		}
	}//»
	checkSize(){//«
		let {winElem: win, main} = this;

		let wid = main._w;
		if (wid < win.clientWidth){
			main._w = win.clientWidth;
		}
		else if (wid < min_win_width) {
			main._w = min_win_width;
		}
//		if (main._w < min_win_width) main._w= min_win_width;
		else if (win._x + win.clientWidth > winw()) {
			if (!win_overflow.right) main._w= winw() - win._x;
		}
		if (win._h < 1) win._h = 1;
		else if (win._y + win.clientHeight > winh()) {
			if (!win_overflow.bottom) {
				let menu_hgt = 0;
				let winfrills = this.titleBar._h + 15;
				let calc_hgt = winh() - win._y - winfrills - 3;
				if (calc_hgt < 1) calc_hgt = 1;
				main._h = calc_hgt;
			}
		}
	}//»
	setFullscreenDims(){//«
		let {winElem: win, main} = this;
		let usepl = 0;
		let usepr = 0;
		let pl = main._padl;
		let pr = main._padr;
		if (pl) usepl = pi(pl);
		if (pr) usepr = pi(pr);
		win._bor="";
		win._x= 0;
		if (this.noChromeMode) win._y=0;
		else win._y= "-" + (this.titleBar._h) + "px";
		main._w= winw() - usepl - usepr;
		main._h = winh(true);
	};//»
	fullscreen(if_instant){//«
		let {winElem: win, main} = this;
		if (this.isTransitioning) return;
		const transend = e => {
			win.style.transition = "";
			main.style.transition = "";
			this.resize();
			win.removeEventListener('transitionend', transend);
			delete this.isTransitioning;
		};
		if (this.isMinimized) return;
		win.style.transition = `left ${WIN_TRANS_SECS},top ${WIN_TRANS_SECS}`;
		main.style.transition = `width ${WIN_TRANS_SECS},height ${WIN_TRANS_SECS}`;

		if (this.isFullscreen) {
			win._bor= this.borHold;
			delete this.borHold;
			win._x= this.fsHoldX;
			win._y= this.fsHoldY;
			main._w= this.fsHoldW;
			main._h = this.fsHoldH;
			this.isFullscreen = false;
		} else {
			this.fsHoldW = main._w;
			this.fsHoldH = main._h;
			this.fsHoldX = win._x;
			this.fsHoldY = win._y;
			this.borHold = win._bor;
			this.setFullscreenDims();
			this.isFullscreen = true;
		}

		if (if_instant) transend();
		else {
			this.isTransitioning = true;
			win.addEventListener('transitionend', transend);
		}

	}//»
	setMaxDims(){//«
		let{main, winElem: win, maxButton: max}=this;
		let usepl = 0;
		let usepr = 0;
		let pl = main._padl;
		let pr = main._padr;
		if (pl) usepl = pi(pl);
		if (pr) usepr = pi(pr);
		win._loc(1,0);
		main.style.width = winw() - usepl - usepr - 2 + "px";
		main.style.height = winh() - this.titleBar._gbcr().height - this.footer._gbcr().height + "px";
		win.style.boxShadow = "";
		max.innerText="\u{1f5d7}";
		max.title="Unmaximize";
	};//»
	maximize(if_instant){//«
		let{winElem: win, main, maxButton: max}=this;
		if (this.isTransitioning||this.isMinimized||this.isFullscreen) return;
		let transend = e =>{
			win.style.transition = "";
			main.style.transition = "";
//			this.sbcr();
//			this.statusBar.resize();
//			this.app.onresize();
			this.resize();
			win.removeEventListener('transitionend', transend);
			this.isTransitioning = null;
			delete this.isTransitioning;
		};
		win.style.transition = `left ${WIN_TRANS_SECS}, top ${WIN_TRANS_SECS}`;
		main.style.transition = `width ${WIN_TRANS_SECS}, height ${WIN_TRANS_SECS}`;
//		let max = this.max_button;
		if (!this.isMaxed) {
			this.maxHoldW = main._w;
			this.maxHoldH = main._h;
			this.maxHoldX = win._x;
			this.maxHoldY = win._y;
			this.isMaxed = true;
			this.setMaxDims();
		} else {
			this.isMaxed = false;
			main._w = this.maxHoldW;
			main._h = this.maxHoldH;
			win._x= this.maxHoldX;
			win._y= this.maxHoldY;
			win.style.boxShadow = window_boxshadow;
			max.innerText="\u{1f5d6}";
			max.title="Maximize";
		}
		if (if_instant) transend();
		else {
			this.isTransitioning = true;
			win.addEventListener('transitionend', transend);
//			this.isTransitioning = true;
//			win.addEventListener('transitionend', transend);
		}
	};//»
	minimize(){this.minButton.click();};
	close(){this.keyKill();}
	setLayout(if_set){//«
		const get_cursor = (e, rect) => {//«
			let lr_pad = rect.width * 0.25;
			let tb_pad = rect.height * 0.25;
			let lhit = false;
			let rhit = false;
			let thit = false;
			let bhit = false;
			let ret;
			if (e.clientX < rect.left + lr_pad) lhit = true;
			else if (e.clientX > rect.right - lr_pad) rhit = true;
			if (e.clientY < rect.top + tb_pad) thit = true;
			else if (e.clientY > rect.bottom - tb_pad) bhit = true;;
			if (rhit && bhit) ret = ["nwse-resize", "se"];
			else if (lhit && thit) ret = ["nwse-resize", "nw"];
			else if (rhit && thit) ret = ["nesw-resize", "ne"];
			else if (lhit && bhit) ret = ["nesw-resize", "sw"];
			else if (rhit) ret = ["ew-resize", "e"];
			else if (lhit) ret = ["ew-resize", "w"];
			else if (thit) ret = ["ns-resize", "n"];
			else if (bhit) ret = ["ns-resize", "s"];
			else ret = ["move"];
			return ret;
		};//»
		const mkhandle = (wid, hgt, x, y) => {//«
			let div = make('div');
			div._bor= "1px solid black";
			div._pos= "absolute";
			div._w= wid;
			div._h = hgt;
			if (x) div._x= 0;
			else div._r= 0;
			if (y) div._y= 0;
			else div._b= 0;
			odiv._add(div);
		};//»
		let {winElem: win}=this;
		if (if_set && this.isLayout) return;
		if (!if_set && !this.isLayout) return;
		if (this.isLayout) {
			desk.style.cursor = "default";
			this.moveDiv._del();
			delete this.moveDiv;
			delete this.rsDir;
			this.isLayout = false;
			return;
		}
		let odiv;
		let dsty = document.body.style;
//		let rect = win.getBoundingClientRect();
		let rect = this.gbcr();
		odiv = make('div');
		let osty = odiv.style;
		odiv._pos= "absolute";
		odiv._w= rect.width;
		odiv._h = rect.height; 
		odiv._x= 0;
		odiv._y= 0;
		odiv._z= 10000000;
		odiv.class = "titlebar";
		odiv.win = this;
		odiv.onmousemove = (e) => {
			if (CDICN || CRW) return;
	//		if (this.isLayout) return;
			osty.cursor = get_cursor(e, odiv.getBoundingClientRect())[0];
		};

		odiv.oncontextmenu = nopropdef;

		odiv.onmousedown = (e) => {//«
			e.stopPropagation();
			if (this != CWIN) this.on();
			let arr = get_cursor(e, odiv.getBoundingClientRect());
			let sty = arr[0];
			osty.cursor = sty;
			if (sty == "move") {
				if (!this.checkProp("Move")) return;
				CDW = this;
				DDX = e.clientX - pi(win.offsetLeft);
				DDY = e.clientY - pi(win.offsetTop);
				return;
			}
			if (!this.checkProp("Resize")) return;
			CRW = this;
			CRW.startx = e.clientX;
			CRW.starty = e.clientY;
			CRW.startw = this.main._w;
			CRW.starth = this.main._h;
			CRW.rsDir = arr[1];
			CRW.startl = win._x;
			CRW.startt = win._y;
		};//»
		odiv.onmouseup = e => {//«
			clear_drag_resize_win();
		};//»
		odiv.update = () => {//«
			let rect = win._gbcr();
			odiv._w= rect.width;
			odiv._h = rect.height;
			statdiv.innerHTML = Math.round(rect.width) + "x" + Math.round(rect.height) + "+" + Math.round(rect.left) + "+" + Math.round(rect.top);
		};//»
		odiv.on=()=>{
			statdiv._tcol= "#ccc";
			odiv._bgcol= "rgba(224,224,224,0.4)";
		};
		odiv.off=()=>{
			statdiv._tcol= "#999";
			odiv._bgcol= "rgba(176,176,176,0.4)";
		};
		win._add(odiv);
		this.moveDiv = odiv;
		let statdiv = make('div');
		statdiv._bgcol= "#000";
		statdiv._fs= 21;
		statdiv.vcenter();
		statdiv._ta= "center";
		statdiv._over="hidden";
		odiv._add(statdiv);
		odiv.update();
		mkhandle("100%", "25%", 1, 1);
		mkhandle("100%", "25%", 1, 0);
		mkhandle("25%", "100%", 1, 1);
		mkhandle("25%", "100%", 0, 1);
		this.isLayout = true;
		if (CWIN == this) odiv.on();
		else odiv.off();
	};//»
	toggleChrome(){//«
//let {winElem: win}
		if (this.isFullscreen || this.isMaxed || this.isMinimized) return;
		this.noChromeMode = !this.noChromeMode;
		let bar = this.titleBar;
		let foot = this.footer;
		let m = this.Main;
		if (this.noChromeMode) {
			let h = bar._gbcr().height + foot._gbcr().height;
			this.borHold = this._bor;
			this.winElem._bor= "";
			m.diffH = h;
			bar._dis= "none";
			foot._dis= "none";
			m._h += h;

		} else {
			bar._dis= "block";
			foot._dis= "";
			this.winElem._bor= this.borHold;
			delete this.borHold;
			m._h -= m.diffH;
		}
//		this.sbcr();
//		this.statusBar.resize();
//		this.app.onresize();
		this.resize();
		return true;
	}//»
selectIcons(){//«
let drect = this.dragDiv.getBoundingClientRect();
let dr = drect.right;
let dl = drect.left;
let dt = drect.top;
let db = drect.bottom;
let OK=[];

let icons = this.getIcons();

for (let icn of icons) {
	let wrap = icn.wrapper;
	if (!wrap) continue;
	let rect = wrap.getBoundingClientRect();
	if (rect.left > dr || rect.right < dl || rect.top > db || rect.bottom < dt) {
		icn.off();
	}
	else {
		OK.push(icn);
//		icon_on(icn);
		icn.on();
	}
	
}
ICONS = OK;
};//»
	getIcons(){//«
		let _icons = this.main.getElementsByClassName("icon");
		let ret = [];
		for (let icn of _icons) ret.push(icn.icon);
		return ret;
	};//»
async reload(opts={}){//«
	let {app, appName, main} = this;
	if (this.killed){
		poperr("This window has been killed");
		return;
	}
//	if (app.actor && app.actor.ondevreload) return app.actor.ondevreload();
	if (app.ondevreload) return await app.ondevreload();
	if (appName.match(/^local\./)&&!opts.dataUrl){
		return popup("'local' (development) applications cannot be independently reloaded!");
	}
	main.innerHTML=`<center><h2 style="background-color: #000; color: #aaa;">Reloading...</h2></center>`;
	this.statusBar.innerHTML="";
	let scr = gbid(`script_${appName}`);
	if (scr) {
		scr._del();
	}
	else{
cwarn(`No script found for app: ${appName}`);
	}
	delete LOTW.apps[appName];
	if (app.onkill) await app.onkill(true);
//	app.onkill&&app.onkill(true);
	let arg = this.arg;
	arg.APPARGS = {reInit: app.reInit};
	arg.noShow = opts.noShow;
	arg.dataUrl = opts.dataUrl;
	main.innerHTML="";
	return this.loadApp();
};//»

loadApp(){//Old make_app«
//DIOLMTNY

return new Promise((Y,N)=>{

//Var«
	let cb = Y;
	let win = this;
	let {arg, main: mainwin, appName: winapp} = this;
	let {noShow: no_show, dataUrl: data_url}=arg;
	this.viewOnly = arg.viewOnly;
	if (data_url) {
		this._data_url = data_url
	}
//BGEIUOP
	let scrpath;
	let str, marr;
	let script_path;
//»
	const barferror = e => {//«
//		this.killed = true;
		mainwin._pad= 10;
		mainwin._bgcol= "#000";
		mainwin._tcol= "#aaa";
		mainwin._fs= "18px";
		mainwin.style.userSelect="text";
		mainwin._over="auto";
		let mess = e.stack||`The script could not be loaded<br>(Url: ${script_path})`;
		mainwin.innerHTML = `<br><div style='text-align:center;color:#f55;font-size:34;font-weight:bold;'>Error</div><br><pre style="font-size:18;"><b>${mess}</b></pre>`;
		if (!no_show) this.on();
		cb(this);
	};//»
	this._fatal = barferror;
	const loadit = async() => {//«
		this.setDefs();
		if (!no_show) {
			this.checkVisible();
			this.statusBar.resize();
			this.on();
		}
		if (winapp===FOLDER_APP) {
			this.app.onappinit(arg.FULLPATH, arg.PREVPATHS);
		}
		else if (arg.APPARGS) this.app.onappinit(arg.APPARGS);
		cb(this);
	};//»
	const load_cb = async() => {//«
		try {
			if (data_url){
				this.app = new NS.apps[winapp](this, Desk);
			}
			else {
				const { app } = await import(script_path);
				NS.apps[winapp] = app;
				this.app = new app(this, Desk);
			}
			this.app.arg = arg;
			loadit();
		} catch (e) {
			barferror(e);
		}
	};//»
	const make_it = async () => {//«
		let scr = make('script');
		scr.onload = load_cb;
		scr.onerror = e => {
			barferror(e);
		};
		if (data_url) script_path = data_url;
		else {
			scr.type = "module";
			script_path = `/apps/${winapp.replace(/\./g, "/")}.js`;
			if (globals.dev_mode) {
				let v = (Math.random()+"").slice(2,9);
				script_path += `?v=${v}`;
			}
		}
		scr.src = script_path;
		scr.id = `script_${winapp}`;
		document.head._add(scr);
	};//»
	if (winapp=="None"){//«
		this.setDefs();
		this.checkVisible();
		this.statusBar.resize();
		this.on();
		cb(this);
		return;
	}//»
	if (!NS.apps[winapp]) return make_it();
	this.app = new NS.apps[winapp](this, Desk);
	this.app.arg = arg;
	loadit();

});



}//»

//»

//«Properties
set bort(val){this.winElem.style.borderTop = val;}
set borb(val){this.winElem.style.borderBottom = val;}
set borl(val){this.winElem.style.borderLeft = val;}
set borr(val){this.winElem.style.borderRight = val;}
set bor(val){this.winElem.style.border = val;}
get rect(){return this.#rect;}
get x(){return parseInt(this.winElem.style.left);}
get y(){return parseInt(this.winElem.style.top);}

set x(val){
	if(Number.isFinite)val=`${val}px`;
	this.winElem.style.left=val;
	this.#rect=this.winElem.getBoundingClientRect();
}
set y(val){
	if(Number.isFinite)val=`${val}px`;
	this.winElem.style.top=val;
	this.#rect=this.winElem.getBoundingClientRect();
}

set l(val){
	let diff = this.#rect.left - parseInt(val);
	this.Main._w += diff;
	this.winElem._x = val;
	this.#rect=this.winElem.getBoundingClientRect();
}

get w(){return this.#rect.width;}
get h(){return this.#rect.height;}
set w(val){
	let per;
	if (per = getStrPer(val)){
		this.Main._w = winw() * per;
	}
	else this.Main._w += parseInt(val) - this.#rect.width;
	this.#rect=this.winElem.getBoundingClientRect();
}
set h(val){
//Chrome size
	let per;
	if (per = getStrPer(val)){
		let diff = this.#rect.height - this.Main._h;
		this.Main._h = (winh() * per) - diff;
	}
	else this.Main._h += parseInt(val) - this.#rect.height;
	this.#rect=this.winElem.getBoundingClientRect();
}

get r(){return this.#rect.right;}
set r(val){
	this.Main._w += parseInt(val) - this.#rect.right;
	this.#rect=this.winElem.getBoundingClientRect();
}
get b(){return this.#rect.bottom;}
set b(val){
	this.Main._h += parseInt(val) - this.gbcr().bottom;
	this.#rect=this.winElem.getBoundingClientRect();
}

get fullpath(){//«
	if (!this.name) {
//cwarn("This window has no name!!!");
		return null;
	}
	let path = (this.path ? this.path : "/") + "/" + this.name;
	if (this.ext) path = path + "." + this.ext;
	return path.regpath();
}//»
get title(){return this.nameSpan.innerText.trim();}
set title(arg){//«
	this.nameSpan.innerText = arg;
	if (this.isMinimized) this.minTitle.innerText = arg
}//»
//»

}//»

const win_reload = async () => {//«
	if (!CWIN) return;
	if (!await CWIN.reload()) return;
	let bytes = CWIN._bytes;
	if (bytes) CWIN.app.onloadfile(bytes);
}//»
const get_newwin_obj = (app) => {//«
	let X = DEF_NEW_WIN_X;
	let Y = DEF_NEW_WIN_Y;
	let WID = DEF_NEW_WIN_W_PER * winw();
	if (WID < 0) WID = winw();
	let HGT = DEF_NEW_WIN_H_PER * winh();
	if (HGT < 0) HGT = winh();
	return {WID, HGT, X, Y};
}//»
const get_wins_by_path = (path,opts={}) => {//«

	let {getDesk, extArg}=opts;
	let ret = [];
	path = path.regpath();
	for (let wspace of workspaces) {
		let wins = wspace.windows;
		for (let w of wins) {
			let ext = w.ext;
			let winpath = (w.path + "/" + w.name).regpath();
			if (winpath !== path) continue;
			if (extArg) {
				if (ext === extArg) ret.push(w);
			} else if (!ext) ret.push(w);
		}
	}
	if (path === DESK_PATH && getDesk) ret.push(desk);
	return ret;
};
api.getWinsByPath = get_wins_by_path;
//»
const get_active_windows = () => {//«
	let wins = [];
	for (let i = 0; i < windows.length; i++) {
		let w = windows[i];
//		if (w.killed) {
//			windows.splice(i, 1);
//			i--;
//		} else if (!w.isMinimized) wins.push(w);
		if (!w.isMinimized) wins.push(w);
	}
	return wins;
}//»
const clear_drag_resize_win=()=>{//«
	if (CRW){
		delete CRW.rsDir;
		delete CRW.startx;
		delete CRW.starty;
		CRW.resize();
		CRW = null;
	}
	if (CDW){
		CDW.winElem.style.boxShadow = window_boxshadow;
		CDW.sbcr();
		CDW = null;
	}
};//»
const do_tile_windows = () => {//«
/*«



Tiling algorithm?

First we check that there are no overlapping windows.
Then we visit every side of every window and try to extend them to the window boundary
or the first window, whichever comes first. If there is a window first, we should extend
both of the sides till they meet in the middle.

If we are extending a window's TOP, then we need to find all window (X) bottoms, vis-a-viv
our current_win (CW), such that:

!(X.left > CW.right) && !(X.right < CW.left)		(1)

For all of these windows, we need to find whichever has the largest bottom value that is
less than our top value (with the smallest positive delta, CW.top - X.bottom).

For extending its BOTTOM, we use formula (1), but then:

For all of these windows, we need to find whichever has the least top value that is
greater than our bottom value (with the smallest positive delta, X.top - CW.bottom).

Say we are extending a window's LEFT. Then we need to find all window rights (X), vis-a-viv
our current_win (CW).

!(X.bottom < CW.top) && !(X.top > CW.bottom)		(2)

For all of these windows, we need to find whichever has the largest right value that is
less than our left value (with the smallest positive delta, CW.left - X.right).

For extending its RIGHT, we use formula (2), but then:

For all of these windows, we need to find whichever has the least left value that is
greater than our right value (with the smallest positive delta, X.left - CW.right).

For each of these cases, if there are no windows that satisfy formula (1) or (2) as
the case may be, we extend the given side all the way to the browser's edge.

»*/
const overlay_mess=(mess)=>{show_overlay(mess);}
const OFFSCREEN_MESS = "Offscreen window detected";
const INTERSECTING_MESS = "Intersecting windows detected";
const NOT_ENOUGH_WINDOWS_MESS = "Tiling requires at least 2 windows";
let wid = winw();
let hgt = winh();
const intersects = (w1, w2) => {//«
	let rect1 = w1.gbcr();
	let rect2 = w2.gbcr();
	if (!(rect1.left > rect2.right || rect1.right < rect2.left || rect1.top > rect2.bottom || rect1.bottom < rect2.top)) {
		return true;
	}
	return false;
};//»

const get_nearest_bottom = win =>{//«

let r1 = win.gbcr();
let cr = r1.right;
let cl = r1.left;
let ct = r1.top;
let cb = r1.bottom;
let all=[];
for (let w of arr){//«
	if (win===w) continue;
	let r2 = w.gbcr();
//!(X.left > CW.right) && !(X.right < CW.left)		(1)
	if (!(r2.left > cr) && !(r2.right < cl)) {
//For all of these windows, we need to find whichever has the largest bottom value that is
//less than our top value (with the smallest positive delta, CW.top - X.bottom).
		let diff = ct - r2.bottom;
		if (diff > 0) all.push({win: w, diff});
	}
}//»
if (!all.length) return;
if (all.length===1) return all[0].win;
all.sort((a, b)=>{
	if (a.diff < b.diff) return -1;
	else if (a.diff > b.diff) return 1;
	else return 0;
});
return all[0].win;

}//»
const get_nearest_top = win =>{//«

let r1 = win.gbcr();
let cr = r1.right;
let cl = r1.left;
let ct = r1.top;
let cb = r1.bottom;
let all=[];
for (let w of arr){//«
	if (win===w) continue;
	let r2 = w.gbcr();
//!(X.left > CW.right) && !(X.right < CW.left)		(1)
	if (!(r2.left > cr) && !(r2.right < cl)) {
//For all of these windows, we need to find whichever has the least top value that is
//greater than our bottom value (with the smallest positive delta, X.top - CW.bottom).
		let diff = r2.top - cb;
		if (diff > 0) all.push({win: w, diff});
	}
}//»
if (!all.length) return;
if (all.length===1) return all[0].win;
all.sort((a, b)=>{
	if (a.diff < b.diff) return -1;
	else if (a.diff > b.diff) return 1;
	else return 0;
});
return all[0].win;

}//»
const get_nearest_right = win =>{//«

let r1 = win.gbcr();
let cr = r1.right;
let cl = r1.left;
let ct = r1.top;
let cb = r1.bottom;
let all=[];
for (let w of arr){//«
	if (win===w) continue;
	let r2 = w.gbcr();
//!(X.bottom < CW.top) && !(X.top > CW.bottom)		(2)
	if (!(r2.bottom < ct) && !(r2.top > cb)) {
//For all of these windows, we need to find whichever has the largest right value that is
//less than our left value (with the smallest positive delta, CW.left - X.right).
		let diff = cl - r2.right;
		if (diff > 0) all.push({win: w, diff});

	}
}//»
if (!all.length) return;
if (all.length===1) return all[0].win;
all.sort((a, b)=>{
	if (a.diff < b.diff) return -1;
	else if (a.diff > b.diff) return 1;
	else return 0;
});
return all[0].win;

}//»
const get_nearest_left = win =>{//«

let r1 = win.gbcr();
let cr = r1.right;
let cl = r1.left;
let ct = r1.top;
let cb = r1.bottom;
let all=[];
for (let w of arr){//«
	if (win===w) continue;
	let r2 = w.gbcr();
//!(X.bottom < CW.top) && !(X.top > CW.bottom)		(2)
	if (!(r2.bottom < ct) && !(r2.top > cb)) {
//For all of these windows, we need to find whichever has the least left value that is
//greater than our right value (with the smallest positive delta, X.left - CW.right).
		let diff = r2.left - cr;
		if (diff > 0) all.push({win: w, diff});
	}
}//»
if (!all.length) return;
if (all.length===1) return all[0].win;
all.sort((a, b)=>{
	if (a.diff < b.diff) return -1;
	else if (a.diff > b.diff) return 1;
	else return 0;
});
return all[0].win;

}//»

let wins = workspace.windows;
let got=[];
for (let w of wins){
	if (w.isMinimized) continue;
	if (!w.checkProp("Resize")) return;
	w.tiledEdges = {};
	got.push(w);
}
if (got.length<2){
	return overlay_mess(NOT_ENOUGH_WINDOWS_MESS);
}

let arr = got;
//Detect offscreen windows
for (let win of arr){
	let rect = win.gbcr();
	if(rect.top<0 || rect.bottom>hgt || rect.left<0 || rect.right>wid) {
		return overlay_mess(OFFSCREEN_MESS);
	}
}
//Detect intersecting windows
for (let j = 0; j < arr.length; j++) {//«
	let w1 = arr[j];
	for (let i = j + 1; i < arr.length; i++) {
		let w2 = arr[i];
		if (intersects(w1, w2)) {
//			show_overlay();
			overlay_mess(INTERSECTING_MESS);
			return;
		}
	}
}//»

//Set all windows to noChromeMode«
for (let win of arr){
	if (!win.noChromeMode) win.toggleChrome();
}
//»
//PMNTYJ
//Tile window top edges//«
for (let j = 0; j < arr.length; j++) {
	let w1 = arr[j];
	if (w1.y === 0 || w1.tiledEdges.top) {
		continue;
	}
	let w2 = get_nearest_bottom(w1);
	if (!w2){
		w1.y = 0;
	}
	else if (w2.tiledEdges.bottom){
		w1.y = w2.b;
	}
	else{
		let mid = (w1.y+w2.b)/2;
		w1.y = mid;
		w2.b = mid;
		w2.tiledEdges.bottom = true;
	}
	w1.tiledEdges.top = true;
}//»
//Tile window bottom edges//«
for (let j = 0; j < arr.length; j++) {
	let w1 = arr[j];
	if ((Math.abs(w1.b-hgt) < 1)  || w1.tiledEdges.bottom) {
		continue;
	}
	let w2 = get_nearest_top(w1);
	if (!w2){
		w1.b = hgt;
	}
	else if (w2.tiledEdges.top){
		w1.b = w2.y;
	}
	else{
		let mid = (w1.b+w2.t)/2;
		w1.b = mid;
		w2.y = mid;
		w2.tiledEdges.top= true;
	}
	w1.tiledEdges.bottom= true;
}//»
//Tile window left edges//«
for (let j = 0; j < arr.length; j++) {
	let w1 = arr[j];
	if (w1.x === 0 || w1.tiledEdges.left) {
		continue;
	}
	let w2 = get_nearest_right(w1);
	if (!w2){
		w1.l = 0;
	}
	else if (w2.tiledEdges.right){
		w1.l = w2.r;
	}
	else{
		let mid = (w1.x+w2.r)/2;
		w1.l = mid;
		w2.r = mid;
		w2.tiledEdges.right = true;
	}
	w1.tiledEdges.left = true;
}//»
//Tile window right edges//«
for (let j = 0; j < arr.length; j++) {
	let w1 = arr[j];
	if ((Math.abs(w1.r-wid) < 1)  || w1.tiledEdges.right) continue;

	let w2 = get_nearest_left(w1);
	if (!w2){
		w1.r = wid;
	}
	else if (w2.tiledEdges.left){
		w1.r = w2.x;
	}
	else{
		let mid = (w1.r+w2.x)/2;
		w1.r = mid;
		w2.x = mid;
		w2.tiledEdges.left = true;
	}
	w1.tiledEdges.right = true;
}//»
/*
//Call each app's onresize handler«
for (let win of arr) win.app.onresize();
//»
*/
return arr;
};//»
const tile_windows = do_tile_windows;
/*
const tile_windows=()=>{//«
	let arr;
	let iter=0;
	while (arr = do_tile_windows()){
if (iter > 5){
cerr("WTHELLLLL????????");
break;
}
		iter++;
	}
	if (arr) {
		for (let win of arr) {
			win.resize();
		}
	}
};//»
*/
const toggle_show_windows = (if_no_current) => {//«
	let wins = get_active_windows();
	if (windows_showing) {
		windows_showing = false;
		for (let i = 0; i < wins.length; i++) {
			let w = wins[i];
			if (w == CWIN) w.is_current = true;
			w.winElem._dis= "none";
			if (w.overdiv) w.overdiv._dis= "none";
		}
		CWIN && CWIN.off();
		CWIN = null;
		CUR.todesk();
//if (workspace.tilingMode)tiling_underlay.off();

	} else {
		windows_showing = true;
		CWIN && CWIN.off();
		for (let i = 0; i < wins.length; i++) {
			let w = wins[i];
			w.winElem._dis= "";
			if (w.overdiv) w.overdiv._dis= "";
			if (w.is_current) {
				if (!if_no_current) {
					if (w.isMinimized) w.overdiv.on();
					else w.on();
				}
				w.is_current = null;
			}
		}
		if (!CWIN && !if_no_current) top_win_on();
//if (workspace.tilingMode) tiling_underlay.on();

	}
//	Desk.update_windows_showing();
	return true;
}//»
const toggle_layout_mode = () => {//«
	let gotwins=[];
	for (let w of windows){
		if (!w.isMinimized) gotwins.push(w);
	}
	workspace.layoutMode = !workspace.layoutMode;
	for (let w of gotwins){
		w.setLayout(workspace.layoutMode);
	}
	show_overlay(`Layout mode: ${workspace.layoutMode}`);
	return true;
};//»
const window_cycle = () => {//«

	if (window.performance.now() - last_win_cycle < 150) {
//Throttle the speed of window cycling when the hotkey is held down
		return;
	}
	last_win_cycle = window.performance.now();
	let wins = windows;
	let len = wins.length;
	if (!len) return;

	if (!num_win_cycles){
//		if (taskbar_hidden&&num_minimized_wins) taskbar.show(true);

		CWIN_HOLD = CWIN;
		wins.sort((a,b)=>{
			if (pi(a.winElem.style.zIndex) < pi(b.winElem.style.zIndex)) return 1;
			else if (pi(a.winElem.style.zIndex) > pi(b.winElem.style.zIndex)) return -1;
			return 0;
		});
		let samelen = num_minimized_wins === wins.length;
		let first;
		if (!(!CWIN_HOLD && !samelen)) first = wins.shift();
		if (show_desktop_during_win_cycle) {
			wins.push(NOWINDOW);
			len++;
		}
		if (first) wins.push(first);
		if (samelen && wins.includes(NOWINDOW)){
			windows.splice(windows.indexOf(NOWINDOW),1)
			wins.push(NOWINDOW);
		}
		nowindow_pos = wins.indexOf(NOWINDOW);
		CG.on(WIN_CYCLE_CG_OP);
	}

	if (CWCW){//Current Win Cycle Win
		CWCW.winElem._z= CWCW.z_hold;
		delete CWCW.z_hold;
		CWCW.off();
		if (CWCW.isMinimized && taskbar_hidden) taskbar.hide(true);
		CWCW = null;
	}
	let w = wins[num_win_cycles%len];
	if (w===NOWINDOW){
		have_window_cycle = true;
		win_cycle_wins_hidden = true;
		toggle_show_windows();
		num_win_cycles=nowindow_pos+1;
		CG.off();
		return;
	}

	if (win_cycle_wins_hidden){
		win_cycle_wins_hidden = false;
		toggle_show_windows();
		CG.on(WIN_CYCLE_CG_OP);
	}

/*«
	if (show_desktop_during_win_cycle) {
		if (!win_cycle_wins_hidden){ 
			if ((w===CWIN_HOLD) || (num_win_cycles && (!(num_win_cycles%len)))){
				if (w===CWIN_HOLD) num_win_cycles++;
				CWIN_HOLD=null;
				have_window_cycle = true;
				win_cycle_wins_hidden = true;
				toggle_show_windows();
				CG.off();
				return;
			}
		}
		if (win_cycle_wins_hidden){
			win_cycle_wins_hidden = false;
			toggle_show_windows();
			CG.on(WIN_CYCLE_CG_OP);
		}
	}
»*/
	CWCW = w;
	CWCW.z_hold = CWCW.winElem._z;
	CWCW.winElem._z= CG_Z+1;
	CWCW.on(true);
	if (CWCW.isMinimized && taskbar_hidden) taskbar.show(true);
	num_win_cycles++;

}//»
const top_win_on = () => {//«
	let gothi = -1;
	let gotwin = null;
	let wins = get_active_windows();
	for (let w of wins){
		if (w.winElem._z > gothi) {
			gothi = w.winElem._z;
			gotwin = w;
		}
	}
	if (gotwin) gotwin.on();
	else {
		CWIN = null;
		CUR.todesk();
	}
}//»
const move_window = (which, if_small) => {//«
	let w = CWIN;
	if (!w) return;
	if (w.isMinimized) {} else if (w.isMaxed) w.max_button.reset();
	let elem = w.winElem;
	let useinc;
	if (if_small) useinc = win_move_inc_small;
	else useinc = win_move_inc;
	if (which == "R") elem._x= elem._x + useinc;
	else if (which == "L") elem._x= elem._x - useinc;
	else if (which == "D") elem._y= elem._y + useinc;
	else if (which == "U") elem._y= elem._y - useinc;
	w.checkLoc();
	if (w.overdiv) w.overdiv._loc(elem._x, elem._y);
	if (w.moveDiv) w.moveDiv.update();
	if (w.isMinimized) {
		w.last_min_x = elem._x;
		w.last_min_y = elem._y;
	}
	w.sbcr();
}//»
const resize_window = (which, if_reverse, if_small) => {//«
	const w2r = () => {
		w.main._w= w.main._w - useinc;
		w.winElem._x += useinc;
	};
	const w2l = () => {
		let dx = w.winElem._x - useinc;
		if (dx < 0) useinc += dx;
		w.main._w= w.main._w + useinc;
		w.winElem._x -= useinc;
	};
	const n2d = () => {
		w.main._h = w.main._h - useinc;
		w.winElem._y += useinc;
	};
	const n2u = () => {
		let dy = w.winElem._y - useinc;
		if (dy < 0) useinc += dy;
		w.main._h = w.main._h + useinc;
		w.winElem._y -= useinc;
	};
	const e2r = () => {
		let dx = w.winElem._x + w.winElem._gbcr().width + useinc - winw();
		if (dx > 0) useinc -= dx;
		w.main._w= w.main._w + useinc;
	};
	const e2l = () => {
		w.main._w= w.main._w - useinc;
	};
	const s2d = () => {
		let dy = w.winElem._y + w.winElem._gbcr().height + useinc - winh();
		if (dy > 0) useinc -= dy;
		w.main._h = w.main._h + useinc;
	};
	const s2u = () => {
		w.main._h = w.main._h - useinc;
	};
	let w = CWIN;
	if (w.dialog) return;
	if (w.isMinimized) return;
	if (w.isMaxed) w.max_button.reset();
	let useinc;
	if (if_small) useinc = win_resize_inc_small;
	else useinc = win_resize_inc;
	if (if_reverse) {
		if (which == "R") e2l();
		else if (which == "L") w2r();
		else if (which == "D") s2u();
		else if (which == "U") n2d();
	} else {
		if (which == "R") e2r();
		else if (which == "L") w2l();
		else if (which == "D") s2d();
		else if (which == "U") n2u();
	}
	w.checkLoc();
	w.checkSize();
	w.sbcr();
	check_rs_timer();
//	w.resize();
	if (w.moveDiv) w.moveDiv.update();
}//»
const handle_resize_event = e => {//«

/*The rs_dir property is set in "window layout mode", which puts a div over«
window that gives highly accessible "handles" for each of the directions
(n,s,e,w,ne,nw,se,sw) and a central handle for moving (not handled here).
»*/
let dir = CRW.rsDir;
//The user is dragging the tiny handle at the bottom right of every window
if (!dir){//«
	let elem = CRW.winElem;
	CRW.main._w = CRW.main._w + (e.clientX - (pi(CRW.main.offsetWidth) + elem._x)) - winx();
	CRW.main._h = CRW.main._h + (e.clientY - (pi(CRW.main.offsetHeight) + elem._y + CRW.titleBar._h + CRW.footer.getBoundingClientRect().height)) - winy();
	CRW.checkSize();
	CRW.statusBar.resize();
	return;
}//»
//The user is dragging one of the 8 "window layout" handles described above
//Var«
let w = CRW;
let rect = w.gbcr();
let odiv = w.moveDiv;
let m = w.main;
let ex = e.clientX;
let ey = e.clientY;
let sx = w.startx;
let sy = w.starty;
let sw = w.startw;
let sh = w.starth;
let sl = w.startl;
let st = w.startt;
//»
if (dir.match(/s/)) {//«
	let goth = sh + ey - sy;
	if (goth > min_win_hgt) {
		m._h = goth;
		let dy = w.winElem._gbcr().bottom - winh();
		if (dy > 0 && !win_overflow.bottom) m._h -= dy;
	}
} //»
else if (dir.match(/n/)) {//«
	let dy = e.clientY - sy;
	let goth = sh - dy;
	if (goth > min_win_hgt) {
		let goty = st + dy;
		if (goty >= 0 || win_overflow.top) {
			m._h = goth;
			w.winElem._y= goty;
		}
	}
}//»
if (dir.match(/e/)) {//«
	let gotw = sw + ex - sx;
	if (gotw > min_win_width) m._w= gotw;
	let dx = w.winElem._gbcr().right - winw();
	if (dx > 0 && !win_overflow.right) m._w -= dx;
}//»
else if (dir.match(/w/)) {//«
	let dx = e.clientX - sx;
	let gotw = sw - dx;
	if (gotw > min_win_width) {
		let gotx = sl + dx;
		if (gotx >= 0 || win_overflow.left) {
			m._w= gotw;
			w.winElem._x= gotx;
		}
	}
}//» 
//XXX TODO odiv can be undefined here (can it though?) TODO XXX//«
if (!odiv) {
	cerr("Hi,no odiv with CRW in Gen_mousemove");
} else {
	odiv._w= w.winElem.offsetWidth;
	odiv._h = w.winElem.offsetHeight;
	odiv.update();
}
//»
CRW.statusBar.resize();

};//»

this.cleanup_deleted_wins_and_icons = path => {//«
    let namearr = getNameExt(path, null, true);
    let usepath = `${namearr[0]}/${namearr[1]}`;
    let useext = namearr[2];
    let wins = get_wins_by_path(usepath, {extArg: useext});
	for (let win of wins){
	    if (win && win.forceKill) win.forceKill();
	}
    let icons = get_icons_by_path(usepath, useext);
    for (let icn of icons) {
		if (icn.cancel_func) icn.cancel_func();
		icn.del();
    }  
}//»

const switch_win_to_workspace = (w, num) => {//«
	let oldwins = workspaces[w.workspaceNum].windows;
//log(12345);
	let which = oldwins.indexOf(w);
	if (which < 0){
		poperr("Could not find the window in the windows array!");
		return;
	}
	oldwins.splice(which, 1);
	let newwins = workspaces[num].windows;
	newwins.push(w);
	w.workspaceNum = num;
	return true;
};//»
const check_cwin_owned=()=>{//«
	if (CWIN && CWIN.ownedBy){
cwarn("Here is the owning window");
log(CWIN.ownedBy);
		popup("The window is owned! (check console)");
		return true;
	}
	return false;
};//»
const raise_bound_win=(num)=>{//«
	let obj = globals.boundWins[num];
	if (!obj) return show_overlay(`key '${num}': not bound to a window`);
	obj.win.on({switchToWorkspace: true});
};//»
const get_all_windows=()=>{//«
	let wins=[];
	for (let wspace of workspaces){
		wins.push(...wspace.windows);
	}
	return wins;
};//»

//»
//Folders«

const make_folder = () => {//«

	if (!CWIN || CWIN.appName != FOLDER_APP){
		make_new_icon(desk, FOLDER_APP);
	}
	else {
		make_new_icon(CWIN, FOLDER_APP);
	}
};//»

const reload_desk_icons_cb = async () => {//«
	CG.on();
	Desk.clear_desk_icons();
	await reloadIcons();
	CG.off();
};
this.clear_desk_icons = ()=>{
	let nodes = Array.from(desk.childNodes);
	let arr = nodes.filter(n => n.className === "icon");
	while (arr.length) arr.pop()._del();
};
//»
const reload_desk_icons = async(arr) => {//«
	if (desk.icons) {
		for (let icn of desk.icons) {
			if (icn) icn.del();
		}
		desk.icons = [];
	}
	arr = arr.sort((a, b)=>{
		if (a.name > b.name) return 1;
		else if (a.name < b.name) return -1;
		return 0;
	});
	for(let node of arr){
		let ref;
		if (node.link) ref = await node.ref;
		let icn = new Icon(node, {ref});
		icn.parWin = desk;
		placeInIconSlot(icn, {create: true, load: true});
	}
	desk.loaded = true;
}//»
const reload_icons = async(is_refresh) => {//«
	let fullpath = DESK_PATH;
	let usemain = desk;
	let ret = await pathToNode(fullpath);
	if (!ret) {
cerr("Nothing returned from pathToNode:\x20"+fullpath);
		return;
	}
	if (!ret.done) await fsapi.popDir(ret);
	let kids = ret.kids;
	let keys = getKeys(kids);
	let kid;
	let arr = [];
	for (let i = 0; i < keys.length; i++) {
		let name = keys[i];
		if (name == "." || name == "..") continue;
		kid = kids[name];
		if (kid.perm===false) continue;
		arr.push(kid);
	}
	reload_desk_icons(arr);
};//»
const open_folder_win = (name, path, iconarg, winargs, saverarg, prevpaths) => {//«

	let icn = iconarg ||{appName: FOLDER_APP,name: name,path: path,fullpath:()=>{(path + "/" + name).regpath()}};
	icn.winArgs = winargs;
	return open_new_window(icn, {SAVER: saverarg, PREVPATHS: prevpaths});
}//»
const check_name_exists = async(str, which, usepath) => {//«
	let path;
	if (which) path = which.fullpath;
	else path = usepath;
	let fullpath = `${path}/${str}`.regpath();
	return pathToNode(fullpath);
}//»
const get_icon_array = (arg, if_compact) => {//«
	if (arg!==desk) {
		let out = [];
		let arr = Array.from(arg.winElem.getElementsByClassName("icon"));
		for (let icn of arr) out.push(icn.icon);
		return out;
	}
	let icons;
	if (desk.icons) {
		icons = desk.icons;
	}
	else {
		icons = set_icon_array_of_desk();
	}
	if (!if_compact) return icons;
	let arr = [];
	for (let i = 0; i < icons.length; i++) {
		let icn = icons[i];
		if (icn&&icn.parentNode) arr.push(icn);
	}
	return arr;
}//»
const set_icon_array_of_desk = () => {//«
	let numx = DESK_GRID_W;
	desk.cols = numx;
	let arr = [];
	let kids = desk.childNodes;
	for (let i = 0; i < kids.length; i++) {
		let kid = kids[i];
		if (kid.className != "icon" || kid.path != DESK_PATH) continue;
		let num = kid.col + (kid.row * numx);
		arr[num] = kid;
	}
	desk.icons = arr;
	return arr;
}//»
const vacate_icon_slot = (icn, if_no_clear) => {//«
	if (icn.parWin!==desk) return;
	if (!(icn.name && icn.parWin)) {
cerr("No icn.name && icn.parWin", icn);
		return;
	}
	let oldarr = icn.parWin.icons;
	let ind = oldarr.indexOf(icn);
	if (ind > -1) {
		if (icn.parWin===desk){
//			if (!globals.read_only) delete localStorage[FS_PREF+":"+icn.Fullpath()];
			if (!(globals.read_only || if_no_clear)) icn.clearFromStorage(null,3);
		}
		oldarr[ind] = undefined;
	} else cerr("The icon was not in the icons array!", icn);
}//»
const placeInIconSlot = (icn, opts={}) => {//«
//const place_in_icon_slot = (icn, pos, if_create, if_load, if_no_vacate, if_no_clear)
	const do_add=()=>{//«
		icn.parWin = desk;
		desk._add(iconelm);
		icn.saveToStorage();
	};//»
	let{
		pos, create, load, noVacate, noClear, doMove
	}= opts;
	let startx = desk_grid_start_x;
	let starty = desk_grid_start_y;
//	let elem = desk;
	if (icn.name && !create && !noVacate) vacate_icon_slot(icn, noClear);
	let arr = get_icon_array(desk);
	let iconelm = icn.iconElem;
//LCIUDHJ
	if (!SHOW_ICONS){
		iconelm.style.visibility="hidden";
	}
	if (create){//«
		iconelm._pos="absolute";
		icn.parWin = desk;
		desk._add(iconelm);

/*In desk.css,«
.iconl {
    max-height:17px;
    text-align: center;
    overflow-wrap:break-word;
    width:90px;
    font-size:16px;
    background-color:#000;
    padding:1.5px;
}
»*/

//If you want the overflowing icon names to be left justified rather than centered, uncomment below.
//if (icn.label.clientHeight > 20) icn.label._ta = "left";

		if (!pos) {
//			let s = localStorage[FS_PREF+":"+icn.fullpath()];
			let s = localStorage[FS_PREF+":"+icn.fullpath];
			if (s){
				let parr = s.split(" ");
				let col = parseInt(parr[0]);
				let row = parseInt(parr[1]);
				let i = col + (row * DESK_GRID_W);
				let dosave = false;
				if (isNaN(i)||arr[i]){
					i=0;
					dosave=true;
					for (let j = i+1; ;j++){
						if (!arr[j]){
							i=j;
							row = Math.floor(i/DESK_GRID_W);
							col = i % DESK_GRID_W;
							break;
						}
					}
				}
				arr[i] = icn;
				icn.col=col;
				icn.row=row;
				iconelm._z= ICON_Z;
				iconelm._x=desk_grid_start_x + (col * IGSX);
				iconelm._y=desk_grid_start_y + (row * IGSY);
				if (dosave) icn.saveToStorage();
				return;
			}
			else if(load){
cwarn(`The icon (${icn.name}) was not found in localStorage!`);
log(icn);
			}
		}
	}//»
	if (!pos) {//«
		let i = 0;
		let x, y;
		let doit = () => {
			let xnum = i % desk.cols;
			let ynum = Math.floor(i / desk.cols);
			x = startx + (xnum * IGSX);
			y = starty + (ynum * IGSY);
			icn.col = xnum;
			icn.row = ynum;
			iconelm._x= x;
			iconelm._y= y;
			arr[i] = icn;
			iconelm._z= ICON_Z;
			do_add();
		};
		for (; i < arr.length; i++) {
			if (!(arr[i] && arr[i].iconElem.parentNode)) break;
		}
		doit();
		return;
	}//»
	let low_dist = Infinity;
	let low_x = null;
	let low_y = null;
	let good_it = null;
	let i = 0;
//EIUKLMY
	let posX = Math.round(pos.X);
	let posY = Math.round(pos.Y);
	let grid_x = Math.floor((posX - startx) / IGSX);
	if (grid_x < 0) grid_x = 0;
	let grid_y = Math.floor((posY - starty) / IGSY);
	if (grid_y < 0) grid_y = 0;
	let grid_pos = (grid_y * desk.cols) + grid_x;
	if (!arr[grid_pos] && (grid_x < desk.cols)) {//«
		good_it = grid_pos;
		low_x = startx + (grid_x * IGSX);
		low_y = starty + (grid_y * IGSY);
	}//»
	else {//«
		let check_low = () => {
			let ynum = Math.floor(i / desk.cols);
			let xnum = i % desk.cols;
			let x = startx + (xnum * IGSX);
			let y = starty + (ynum * IGSY);
			let got_dist = dist(x + 40, y + 40, posX, posY);
			if (got_dist < low_dist) {
				low_dist = got_dist;
				low_x = x;
				low_y = y;
				good_it = i;
			}
		};
		for (i = 0; i < arr.length; i++) {
			let icn = arr[i];
			if (!icn) check_low();
		}
		if (!(low_x && low_y)) check_low();
	}//»
	if (low_x && low_y) {
		icn.col = good_it % desk.cols;
		icn.row = Math.floor(good_it / desk.cols);
		iconelm._z= ICON_Z;
		arr[good_it] = icn;
		do_add();
		if (doMove || !create) {
			return move_icon(icn, low_x, low_y);
		}
		iconelm._x= low_x;
		iconelm._y= low_y;
		return;
	}
	throw new Error("failure");
}//»
const reloadIcons = win => {return reload_icons();}
const update_folder_statuses = usepath => {//«
	for (let w of get_all_windows()) {
		if (w.appName !== FOLDER_APP) continue;
		if (usepath) {
			if (w.fullpath === usepath) w.app.update();
		} else w.app.update();
	}
};
this.update_folder_statuses=update_folder_statuses;
//»

//»
//Icons«

let SHOW_ICONS = true;

class Icon {//«

constructor(node, opts={}){//«

	let {elem, observer, ref}=opts;

	this.elem = elem;
	this.node = node;
	this.ref = ref;

	this.makeDOMElem();
	this.setApp();
	this.setImg();
	this.setLabelName();
	this.addDOMListeners();

	if (!node.fake) node.icons.push(this);

	if (observer) {//«
		this.moveCb=()=>{
			observer.unobserve(this.iconElem);
			delete this.moveCb;
		};
	}//»

}//»

setLabelName(){//«
	let s = this.node.baseName;
	this.nameSpan._dis="";
	this.nameSpan.innerHTML="";
	if (s.length > MAX_ICON_NAME_LEN) s = s.slice(0, MAX_ICON_NAME_LEN)+"...";
	this.nameSpan.innerText = s.replace(/-/g, "\u{2011}");
};//»
showLabelName(){this.label._over="";}
hideLabelName(){this.label._over="hidden";}
addDOMListeners(){//«

let {wrapper, iconElem: iconelm, ref, node} = this;

if (this.isFolder) {//«

let didleave;
let isopen = false;
let in_transit = false;
let not_allowed = false;
const on = () => {//«
	isopen = true;
	wrapper.style.cursor = "copy";
	if (!CDL) return;
	CDL.into(this.name); 
	this.imgDiv.innerHTML = '\u{2009}\u{1f4c2}';
};//»
const off = () => {//«
	if (in_transit) return;
	not_allowed=false;
	isopen = false;
	iconelm.style.cursor = "";
	wrapper.style.cursor="";
	if (!CDL) return;
	CDL.reset();
	this.imgDiv.innerHTML = '\u{1f4c1}';
};//»

wrapper.onmouseover = async e => {//«
	e.stopPropagation();
	if (!CDICN) return;
	if (CDICN === this) return;
	let node = this.node;
	let typ = node.type;
	if (ref) {
		ref.type;
		node = ref;
	}
	if (CDICN.noMove || typ!==FS_TYPE || !fs.check_fs_dir_perm(node) || (CDICN.path === this.linkfullpath) || (newPathIsBad(CDICN.fullpath, this.linkfullpath + "/" + CDICN.name))) {
		not_allowed = true;
	}
	didleave = false;
	if (!CDICN) return;
	if (not_allowed) {
		CDL.nogo();
		wrapper.style.cursor = "not-allowed";
	}
	else if (!didleave) on();
};//»
wrapper.onmouseout = e => {//«
	off();
	if (CDICN === this) return;
	e.stopPropagation();
	if (!CDICN) return;
	didleave = true;
};//»
wrapper.onmouseup = async e => {//«
	e.stopPropagation();
	if (CDICN) {
		this.off(true);
		if (!ICONS.length) return;
		desk.style.cursor = "";
		if (not_allowed) {
			CDICN.shake();
		}
		if (!isopen) {
			CDICN = null;
			off();
			cldragimg();
			return;
		}
		let rect = iconelm._gbcr();
		in_transit = true;
		await move_icons(this.fullpath, {loc:{X: rect.left, Y: rect.top}});
		in_transit = false;
		off();
		CWIN&&CWIN.off();
		if (this.parWin !== desk) this.parWin.on();
		CDICN = null;
		cldragimg();
		for (let icn of ICONS) icn.off();
		ICONS=[];
		if (this.win) this.win.app.reload();
		return;
	}
	if (DDIE) {
		DDIE = null;
		DDD._loc(-1, -1);
		DDD._w= 0;
		DDD._h = 0;
	}
	if (this.parWin === desk) return;
	this.parWin.clearDrag();
};//»
wrapper.ondragover=e=>{//«
	e.stopPropagation();
	e.preventDefault();
};//»
wrapper.ondrop=async e=>{//«
	e.stopPropagation();
	e.preventDefault();
	let win = await this.openWin();
	await save_dropped_files(e, win);
};//»

}//»
else {//«

wrapper.ondragover=nopropdef;
wrapper.ondrop=e=>{
	e.stopPropagation();
	e.preventDefault();
	popup("Cannot drop files onto non-folders!");
};

}//»

wrapper.ondragstart = e => {//«
	e.preventDefault();
	e.stopPropagation();
	if (globals.read_only) return;
	let par = iconelm.parentNode;
	CDICN = this;
	CDL = make_cur_drag_img();
	if (par !== desk) par = par.parentNode; //Sad but true(for now):origins are always the mainwin,NOT topwin OR icon_div
	desk.style.cursor = "grabbing";
	CDL._loc(e.clientX + CDL_OFFSET - winw(), e.clientY + CDL_OFFSET - winy());
	desk._add(CDL);
};//»
wrapper.onmousedown = e => {//«
	e.stopPropagation();
	if (e.button != 0) return;
	let par = this.parWin;
	if (par === desk) {
		CWIN&&CWIN.off();
	}
	else par.on();
//	if (e.ctrlKey&&ICONS.includes(this)) icon_off(this,true);
	if (e.ctrlKey&&ICONS.includes(this)) this.off(true);
	else if (!ICONS.includes(this)) {
		if (!e.ctrlKey) icon_array_off(18);
//		icon_on(this,true);
		this.on(true);
	}
};//»
wrapper.onclick = e => {//«
	e.stopPropagation();
};//»
wrapper.oncontextmenu = e => {//«
if (isMobile) return;
if (!e.isFake) nopropdef(e);
if (have_window_cycle) return;
let menu = [//«
"Properties",()=>{show_node_props(node);},
"Rename", () => {
	setTimeout(() => {
		this.nodelete = true;
		init_icon_editing(this);
	}, 25);
}, 
"Delete", () => {delete_selected_files(this);}
];//»
let open_opts=["Binary\xa0Viewer", ()=>{open_icon(this,{useApp: DEF_BIN_APP});}];
if (this.appName !== FOLDER_APP){
	if (TEXT_EXTENSIONS.includes(this.ext)){
		open_opts.unshift(()=>{open_icon(this,{useApp:TEXT_EDITOR_APP});});
		open_opts.unshift("Text\xa0Editor");
	}
	menu.unshift(open_opts);
	menu.unshift("Open\xa0with...");
}
set_context_menu({X:e.clientX,Y:e.clientY},{items:menu});

};//»
wrapper.ondblclick = e => {//«
	e.stopPropagation();
	this.dblclick = true;
	open_icon(this, {e: e});
};//»

{
	let typ;
	if (ref) typ = ref.type;
	else typ = node.type;
	this.type = typ;
	if (typ!==FS_TYPE && this.isFolder){
		this.noMove = true;
	}
	else {
		this.noMove = false;
	}
}

}//»
makeDOMElem(){//«
	let d;
	if (this.elem) d = this.elem;
	else {
		d = make("div");
		d.className="icon";
	}
	d._z=ICON_Z;
	this.iconElem = d;
	d.iconElem = d;
	d.icon = this;
	d.innerHTML=`<span class="iconw"></span><div class="iconl"><div class="iconn"></div></div>`;

	let wrapper = d.childNodes[0];
	this.wrapper = wrapper;
	wrapper.draggable=true;
	wrapper.iconElem=d;

	let label = d.childNodes[1];
	label._over="hidden";
	label.iconElem = d;
	label.title = name;
	this.label = label;
	this.nameSpan = label.childNodes[0];

}//»
setApp(){//«

	let {node, ref} = this;

	let usenode = node;
	let ext;
	let ext_text;

	let app;
	let islink=false;

	if (node.link){
		islink = true;
		this.link = node.link;
		usenode = ref;
	}

	if (usenode && usenode.ext) {
		ext = usenode.ext.toLowerCase();
		if (TEXT_EXTENSIONS.includes(ext)) {
			ext_text = ext;
		}
	}
	if (node.kids) app=FOLDER_APP;
	else if (node.appicon){
		try{
			app=JSON.parse(node.appicon).app;
			ext_text = "\u{2699}";
		}
		catch(e){cerr(e);};
	}
	else if (islink){
		app = ref.appName;
	}
	else if (node.appName) {
//WJKNMTYT
//cwarn("THIS IS STICKY???", node.appName);
		app = node.appName;
	}
	else if (ext) {
		app = extToApp(ext);
	}


	if (!app) app = DEF_BIN_APP;

	if (app=="Application"&&ref&&ref.appicon){
		try{
			this.linkApp=JSON.parse(node.ref.appicon).app;
		}
		catch(e){cerr(e);};
	}

	this.isFolder = (app === FOLDER_APP) || (ref && ref.appName === FOLDER_APP);
	this.app = app;
	this.appName = app;
	this.ext = ext;
	this.extText = ext_text;
	this.isLink = islink;

	if (islink) {
		if (ref) {//«
			let arr = getNameExt(ref.name);
			this.linkName = arr[0];
			this.linkExt = arr[1];
			this.linkPath = ref.par.fullpath;
			this.ref = ref;
		}//»
		this.addLink(!ref);
	}
	this.useNode = usenode;
}//»
setImg(){//«
	let{wrapper, useNode: usenode}=this;
	let ext_div="";
	let ext, ext_text;
	if (usenode && usenode.ext) {
		ext = usenode.ext.toLowerCase();
		if (TEXT_EXTENSIONS.includes(ext)) {
			ext_text = ext;
		}
	}
	this.ext = ext;
	if (ext_text){
		ext_div = `<div class="iconext">${ext_text}</div>`;
	}
	this.extText = ext_text;
	let ch = getAppIcon(this.linkApp||this.appName,{html:true});
	wrapper.innerHTML=`${ext_div}<span class="iconi">${ch}</span>`;
	this.imgDiv = wrapper.childNodes[wrapper.children.length-1];
	this.imgDiv.iconElem = this.iconElem;
};//»
updateDOMElement(){//«

	this.clearFromStorage();
	this.setApp();
	this.setImg();
	this.setLabelName();
	this.iconElem.dataset.name = this.fullname;
	this.off();
	this.saveToStorage();

};//»
setWindowName(){//«
	let win = this.win;
	if (!win) return;
	win.title = this.name;
	win.name = this.name;
}//»
addOverlay(){//«
	let oncontext = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (overdiv.context_menu) return;
		let canfunc = this.cancel_func;
		set_context_menu({
			X: e.clientX,
			Y: e.clientY
		}, {
			items: ["Stop File Transfer", canfunc]
		});
	};
	let overdiv = make('div');
	let rect = icn.iconElem.getBoundingClientRect();
	overdiv._w= rect.width;
	overdiv._h = rect.height;

	let od = overdiv;
	icn.overdiv = od;
	od._dis= "flex";
	od.style.alignItems = "center";
	od.style.justifyContent = "center";
	od.style.flexDirection = "column";
	od._bgcol= "#000";
	od._op= 0.66;
	od._tcol= "#fff";
	od._ta= "center";
	od._fs= 21;
	od._pos= "absolute";
	od._w="100%";
	od._h="100%";
	od._loc(0, 0);
	icn.iconElem._add(overdiv);
	icn.activate = () => {
		this.cancel_func = null;
		overdiv._del();
		delete icn.disabled;
	};
	overdiv.oncontextmenu = oncontext;
	return overdiv;
};
//»
openWin(){//«
	return new Promise((Y,N)=>{
		if (this.win) return Y(this.win);
		open_icon(icn, {winCb: Y});
	});
};//»
addLink(if_broken){//«
	if (this.link_div) this.link_div._del();
	let l = make('div');
	this.link_div = l;
	this.wrapper._add(l);
	l._fs=14;
	l.innerHTML="\u{27a5}";
	l._padl=3;
	l._padr=3;
	l._bgcol="#000";
	if (if_broken) l._tcol="#f77";
	else l._tcol="#fff";
	l._pos= "absolute";
	l._r="0px";
	l._b="-5px";
};//»
shake(){//«
	let {iconElem} = this;
	iconElem.style.animation = "shake 0.5s cubic-bezier(.36,.07,.19,.97)\x20both";
	iconElem.addEventListener("animationend", () => {
		iconElem.style.animation = "";
	});
};//»
off(do_vacate){//«
//	if (!(icn && icn.imgdiv)) return;
	if (do_vacate && ICONS.includes(this)) ICONS.splice(ICONS.indexOf(this), 1);
//	icn.iconElem._bor= "2px solid transparent";
	this.wrapper._bor="";
	this.iconElem._bgcol="";
	this.label._bgcol="";
	this.label._tcol="";
	this.nameSpan._bgcol="";
	this.isOn=false;
	if (this.parWin!==desk) {
		if (ICONS.length===1) this.parWin.app.stat(ICONS[0].fullname);
		else this.parWin.app.stat(`${ICONS.length} selected`);
	}
}//»
on(do_add){//«
	if (isMobile) return;
	let iconelm = this.iconElem;
	if (do_add && !ICONS.includes(this)) {
		if (ICONS.length && (this.parWin !== ICONS[0].parWin)) icon_array_off(9);
		ICONS.push(this);
	}
	this.wrapper._bor = "1px solid #ff0";
	this.label._bgcol="#bb0";
	this.label._tcol="#000";
	this.nameSpan._bgcol="#bb0";

	if (iconelm.parentNode === desk) {
		iconelm._bgcol= DESK_ICON_BG;
	}
	else {
		iconelm._bgcol= FOLDER_ICON_BG;
		if (ICONS.length===1) this.parWin.app.stat(this.fullname);
		else this.parWin.app.stat(`${ICONS.length} selected`);
	}
	this.isOn = true;
}//»
del(){//«
	if (!this.iconElem.parentNode) return;
	this.clearFromStorage(null,1);
	this.iconElem._del();
};//»
clearFromStorage(patharg){//«
	if (this.parWin !== desk) return;
	let path;
	if (patharg) path = patharg;
	else path = this.fullpath;
	let k =`${FS_PREF}:${path}`;
	if (!localStorage[k]) {
if (debug_localstorage) {
log(`Nothing found in localStorage[${k}]`);
}
return 
}
if (debug_localstorage) {
log(`Deleting: localStorage["${k}"]`);
}
	delete localStorage[`${k}`];
}
clear(patharg){clearFromStorage(patharg);}
//»
saveToStorage(){//«
	if (globals.read_only) return;
	if (this.parWin!==desk) return;
	let k =`${FS_PREF}:${this.fullpath}`;
	let verb;
	if (localStorage[k]) verb="Updating";	
	else verb="Setting";
	
if (debug_localstorage) {
log(`${verb}: localStorage["${k}"]`);
}
	localStorage[k]=`${this.col} ${this.row}`;
}
save(){saveToStorage();}
//»
get linkfullpath(){if (this.ref) return this.ref.fullpath;return this.node.fullpath;}
get fullpath(){return this.node.fullpath;}
get path(){return this.node.path;}
get fullname(){return this.node.name;}
get name(){return this.node.baseName;}

}
api.Icon = Icon;
//»

//XKNFIUHJ
const toggle_icon_display = () => {//«
	if (!dev_mode) return;
	SHOW_ICONS = !SHOW_ICONS;
	for (let icn of desk.icons){
		if (!icn) continue;
		if (SHOW_ICONS){
			icn.iconElem.style.visibility="";
			desk_imgdiv.style.backgroundImage=`url("${BACKGROUND_IMAGE_URL}")`;
			set_desk_bgcol();
		}
		else{
			icn.iconElem.style.visibility="hidden";
			desk_imgdiv.style.backgroundImage="";
			body._bgcol= "#000";
			body.style.backgroundImage="";
		}
	}
	CUR.vizCheck();
};//»
api.toggleDeskIcons = toggle_icon_display;
api.hideDeskIcons=()=>{if(SHOW_ICONS)toggle_icon_display();};
api.showDeskIcons=()=>{if(!SHOW_ICONS)toggle_icon_display();};

const show_node_props=async(node)=>{//«

	const pop=()=>{popup(s+"</div>",{title: "File node properties", wide: true});};
	let s = `<div style="user-select: text;">Name: ${node.name}<br><br>Path: ${node.path}<br><br>`;
	let app = node.appName;
	if (app == FOLDER_APP) {
		s+=`App: ${FOLDER_APP}`;
		return pop();
	}
	if (!app) app="<i>None</i>";
	s+=`App: ${app}<br><br>`;
	if (node.type!==FS_TYPE) {
		if (isFin(node.size)) s+=`Size: ${node.size} bytes`;
		return pop();
	}
	if (app===LINK_APP){
		let broken="";
		if (!await node.ref) broken = "(broken)";
		s+=`Link text: ${node.symLink}<br>${broken}`
	}
	let file = await node._file;
	if (!file) {
		return pop();
	}
	s+=`Size: ${file.size} bytes`;
	if (!file.lastModified) return pop();

	let a = (file.lastModifiedDate+"").split(" ");
	s+=`<br><br>Last Modified:<br>${a[0]} ${a[1]} ${a[2]} ${a[3]} ${a[4]}<br>`;
	let mod = file.lastModified;
	let diff = ((new Date()).getTime() - file.lastModified)/1000;
	if (diff > 86400) s+=`${Math.floor(diff/86400)} days ago`;
	else if (diff > 3600) s+=`${Math.floor(diff/3600)} hrs ago`;
	else if (diff > 60) s+=`${Math.floor(diff/60)} mins ago`;
	else s+=`${Math.floor(diff)} secs ago`;
	s+=`<br><br>Blob id: ${node.blobId}`;
	pop();
};//»
const move_icons = async (destpath,  opts={}) => {//«
return new Promise(async(cb,N)=>{
let {e, win:usewin, loc}=opts;

const do_end=async()=>{//«
	if (usewin) {
		if (usewin === desk) {
			for (let icn of ICONS) {
				icn.parWin = desk;
				icn.iconElem._pos="absolute";
				if(!icn.iconElem.parentNode) {
//					if (!SHOW_ICONS) icn.iconElem.style.visibility="hidden";
					desk._add(icn.iconElem);
				}
			}
		}
		else {
			for (let icn of ICONS) {
				icn.parWin = usewin;
			}
			let wins = get_wins_by_path(usewin.fullpath);
			for (let w of wins) {
				w.app.update(didnum);
			}
		}
	}
	else {
		let wins = get_wins_by_path(destpath);
		for (let w of wins) w.app.update();
	}

	if (origwin && origwin.appName == FOLDER_APP) {
		let wins = get_wins_by_path(origwin.fullpath);
		for (let w of wins) {
			if (do_copy) w.app.reload();
			else w.app.update(-didnum);
		}
	}
	for (let icn of ICONS){
		icn.iconElem._op=1;
		delete icn.disabled;
		icn.saveToStorage();
		if (icn.link) {
			icn.addLink(!(await icn.node.ref));
		}
	}
	icon_array_off(5);
	if (cb) cb(true);
	shell_moving_done = true;
	check_no_move_icons();
};//»
const reset_display=()=>{//«
	if (did_reset) return;
	did_reset = true;
	if (origwin){
		if (ERROR_MSGS.length) poperr(ERROR_MSGS.join("<br>"),{WIDE: true});
		let no_move_icon_wins = [];
		if (origwin !== desk) {
			for (let icn of NO_MOVE_ICONS) {
//REOPIKLU
				icn.del();
			}
			return;
		}
		for (let icn of NO_MOVE_ICONS){
//EMKIOFDPM
			if (icn.win) {
				icn.win.icon = icn;
			}
			delete icn.disabled;
			icn.iconElem.style.transform = "";
			icn.iconElem.style.transition = "";
			icn.iconElem._op=1;
			icn.iconElem._pos="absolute";
			placeInIconSlot(icn, {create: true});
		}
	}
}//»
const check_no_move_icons = ()=>{//«
	if (visual_moving_done && shell_moving_done) return reset_display();
	check_interval = setInterval(()=>{
		if (!(visual_moving_done && shell_moving_done)) return;
		clearInterval(check_interval);
		reset_display();
	},50);

};//»

if (!ICONS[0]){//«
cwarn("THis is a rare event!");
	cldragimg(true);
	return;
}//»
if (globals.read_only){//«
	for (let icn of ICONS) {
		icn.shake();
		icn.off();
	}
	cb();
	return;
};//»
//Var«
if (e && destpath === DESK_PATH) usewin = desk;
let origwin;
let visual_moving_done = false;
let shell_moving_done = false;
let check_interval;
let didnum=0;
let did_reset = false;
let do_copy = false;
//log

let fromnode = await pathToNode(ICONS[0].fullpath, true);
let paths = [];
let good = [];
let empties = [];
let proms = [];
let NO_MOVE_ICONS = [];
let ERROR_MSGS=[];
let icon_obj = {};
let real_locs = [];
let destnode = await pathToNode(destpath);
let desttype = destnode.type;
let fromtype = fromnode.type;
let scrl = desk.scrollLeft;
let scrt = desk.scrollTop;

//Fake parser.shell_exports object for fs.com_mv:cbok werr wclerr path2obj cwd is_root 
let shell_exports = {//«
	cbok: do_end,
	no_move_cb:(icn)=>{
		if (!icn) return;
		NO_MOVE_ICONS.push(icn);
	},
	werr: s => {
		if (!s) return;
		s = s.trim();
		if (!s.length) return;
		ERROR_MSGS.push(s);
	},
	cberr: (mess) =>{
		let err = "There was a problem moving the icon(s)";
		if (mess) err += `: ${mess}`;
		ERROR_MSGS.push(err);
		do_end();
	},
	cwd: "/",
	is_root: false,
};//»

//»

if (fromtype !== FS_TYPE){//«

do_copy = true;
let CP_ICONS = [];
for (let icn of ICONS) {
	if (icn.appName===FOLDER_APP) {
		icn.shake();
		icn.off(true);
		continue;
	}
	icn.off();
	let r = icn.iconElem.getBoundingClientRect();
	let ref;
	if (icn.link) ref = await icn.ref;
	let newicn = new Icon(icn.node,{ref});
	newicn.is_copy = true;
	let elm = newicn.iconElem;
	elm._pos="fixed";
	elm._x=r.left;
	elm._y=r.top;
	desk._add(elm);
	newicn.parWin = icn.parWin;
	CP_ICONS.push(newicn);
}

if (!CP_ICONS.length){
	cb();
	return;
}
ICONS = CP_ICONS;
}//»
if (desttype !== FS_TYPE){//«
for (let icn of ICONS) {
	icn.shake();
//	icon_off(icn);
//	icn.off();
}
icon_array_off();
cb();
return;
}//»

for (let icn of ICONS) {//Sanity check«
//	icon_off(icn);
	icn.off();
	let usename = icn.name;
	if (icn.ext) usename += "." + icn.ext;
	if (await pathToNode(destpath + "/" + usename)) {
		icn.shake();
		continue;
	}
	if (icn.path === destpath) {
		if (icn.parWin === desk && usewin == desk) {} else icn.shake();
		continue;
	}
	let fullpath = icn.fullpath;
	if (newPathIsBad(fullpath, destpath + "/" + usename)) {
		icn.shake();
		continue;
	}
	paths.push(fullpath);
	good.push(icn);
}//»

if (!paths.length) {//«
	let icons = ICONS.slice();
	ICONS=[];
//	for (let icn of icons) icon_on(icn, true);
	for (let icn of icons) icn.on(true);
	if (cb) cb(false);
	return;
} //»

ICONS=good;
origwin = ICONS[0].parWin;
didnum = ICONS.length;
paths.push(destpath);
for (let icn of ICONS) icon_obj[icn.fullpath] = icn;

if (do_copy){//«
	let NEWICNS=[];
	let newpaths = [];
	for (let icn of ICONS){
		if (icn.appName!=FOLDER_APP) {
			NEWICNS.push(icn);
			newpaths.push(icn.fullpath);
		}
		else{
cwarn(`Skipping icn.appName!='${FOLDER_APP}'`, icn.fullpath);
		}
	}
	paths = newpaths;
	if (!paths.length){
		if (cb) cb();
		return;
	}
	paths.push(destpath);
	ICONS = NEWICNS;
	icon_obj = {};
	for (let icn of ICONS) icon_obj[icn.fullpath] = icn;
}//»

for (let icn of ICONS) {//«
	if (icn.moveCb) icn.moveCb();
	icn.iconElem._op=0.5;
	icn.disabled = true;
	let rect = icn.iconElem._gbcr();
	icn.iconElem._pos="fixed";
	let scrdiff=0;
	let nextsib;

	if (icn.parWin!==desk) {
		if (icn.show && !icn.showing) icn.show();
		nextsib = icn.iconElem.nextSibling;
	}

//Onto a folder icon's dropzone
	if (loc) {//«
		vacate_icon_slot(icn);
		icn.iconElem._loc(rect.left+desk.scrollLeft, rect.top+scrdiff+desk.scrollTop);
		desk._add(icn.iconElem);
		proms.push(move_icon(icn, loc.X+desk.scrollLeft, loc.Y+desk.scrollTop, {scale:0.25, fade:true, 
			cb:()=>{
//				icn.iconElem._del();
				icn.del();
//TEIOPLKJHY
				if (icn.win && icn.win.icon){
					icn.win.icon = undefined;
					delete icn.win.icon;
				}
			}
		}));
	}//»
//Onto the desktop:get location from 'e',passed into the desktop's ondrop event handler
	else if (usewin == desk) {//«
		icn.iconElem._loc(rect.left+scrl, rect.top+scrdiff+scrt);
		desk._add(icn.iconElem);
		proms.push(placeInIconSlot(icn,{doMove: true, create: do_copy, pos:{X:e.clientX+scrl,Y:e.clientY+scrt}}));
	}//»
//Onto a folder main window,from the desktop or another folder. The folder automatically places it
	else {//«
		const movecb=()=>{//«
			let name = icn.name;
			let ext = icn.ext;
			if (ext) name += `.${ext}`;
			let icns = Array.from(usewin.iconDiv.children);
			for (let ic of icns){
				let ext = ic.ext;
				let nm = ic.name;
				if (ext) nm += `.${ext}`;
				if (nm==name){
//					icn.iconElem._del();
					icn.del();
					return;
				}
			}
			icn.iconElem.style.transform = "";
			icn.iconElem.style.transition = "";
			icn.iconElem._pos="";
			usewin.iconDiv._add(icn.iconElem);
		};//»
		vacate_icon_slot(icn);
		if (icn.parWin !== desk) {
			icn.iconElem._loc(rect.left+scrl, rect.top+scrdiff+scrt);
			desk._add(icn.iconElem);
		} 
		let icons = usewin.getIcons();
		usewin.main.scrollTop = usewin.main.scrollHeight;
		let last = icons.pop();
		let wr;

		if (last) {
			wr = last.iconElem._gbcr();
			let d = mkdv();
			d._op=0;
			d._w=100;
			d._h=100;
			usewin.iconDiv._add(d);
			let r2 = d._gbcr();
			d._del();
			proms.push(move_icon(icn, r2.left+scrl, r2.top+scrt, {cb:movecb}));
		}
		else {
			wr = usewin.winElem._gbcr();
			proms.push(move_icon(icn, wr.left+scrl, wr.top+usewin.titleBar.clientHeight+scrt, {cb:movecb}));
		}
	}//»

	if (nextsib){
		let empty = mkdv();
		empty = mkdv();
		empty.className = "emptyicon";
		let obj = {
			iconElem: empty,
			empty: true,
			parWin: origwin, 
			fullname:" "
		};
		empty.icon = obj;
		empty.iconElem = empty;
		empty._w= 104;
		empty._h = 104;
		nextsib.parentNode.insertBefore(empty, nextsib);
		empties.push(empty);
	}
}//»

//Start the graphical moving first. Sometimes there are issues involved when,
//for example, the user does not have permission to move to the destination location.
Promise.all(proms).then(()=>{//«
	visual_moving_done = true;
	check_no_move_icons();
});//»
//Do the "real" system moving

fs.com_mv(paths, {
	shell_exports,
	if_cp: do_copy,
	dom_objects: {
		win: usewin,
		icons: icon_obj
	}
});



});
};//»
const move_icon = (icn, want_x, want_y, opts={}) => {//«

if (globals.read_only){
	icn.shake();
	return;
}
let scale_fac = opts.scale;
let if_fade_out = opts.fade;
let cb = opts.cb;
let iconelm = icn.iconElem;
if (!cb) cb=()=>{};

return new Promise((res, rej) => {

	const transend = e => {//«
		iconelm.style.transition = "";
		iconelm.style.transform = "";
		iconelm._loc(want_x, want_y);
		iconelm._z= ICON_Z;
//		if (if_fade_out) {
//			setTimeout(() => {
//				iconelm._op= 1;
//			}, 100);
//		}
		res();
		delete iconelm.ontransitionend;
		cb();
	};//»

	let fromx = pi(iconelm.style.left);
	let fromy = pi(iconelm.style.top);
	let diffx = want_x - fromx;
	let diffy = want_y - fromy;
	let d = Math.sqrt(Math.pow(diffx, 2) + Math.pow(diffy, 2));
	let factor = ICON_MOVE_FACTOR;
	let time = d * 1 / factor;
	if (time > 0.5) time = 0.5;
	else if (time < 0.15) time = 0.15;
	iconelm.style.transform = "";
	let str = `transform ${time}s ease 0s`;
//	if (if_fade_out) str += `,opacity ${time}s ease 0s`;
	iconelm.style.transition = str;
	iconelm.ontransitionend=transend;
	setTimeout(() => {
		let str = `translate(${diffx}px,${diffy}px)`;
		if (isFin(scale_fac)) str += ` scale(${scale_fac})`;
		iconelm._z= CG_Z - 1;
		iconelm.style.transform = str;
	}, 25);
});


};
//»
const move_icon_by_path = (frompath, topath, app, opts = {}) => {//«
return new Promise(async(Y,N)=>{
	const doend=()=>{//«
		if (frompath && topath) update_all_paths(frompath, topath);
		Y(ret);
	};//»
	let {node} = opts;
	let ret = [];
	let use_link;
	let is_folder = (app == FOLDER_APP);
	let no_del_icon = opts.icon;
	if (no_del_icon){
		delete no_del_icon.disabled;
		no_del_icon.iconElem._op=1;
	}
	let no_add_win = opts.win;
	let is_regular_file = false;
	if (!(is_folder || opts.link)) is_regular_file = true;
	let fromparts, frombase;
//	let icons = [];
	let icons = node.icons;

//This means we are actually "moving" (rather than merely renaming)
	if (frompath) {
//WMKFTYIOP1 <---- WRONG
//		if (frompath !== topath){
//			while (node.icons.length) node.icons.pop().del();
//		}
		let pathname, ext;
		if (is_regular_file){
			let arr = getNameExt(frompath, true);
			pathname = arr[0];
			ext = arr[1];
		}
		else pathname = frompath;
//		icons = get_icons_by_path(pathname, ext);
		fromparts = fs.path_to_par_and_name(frompath);
		frombase = fromparts[0];
	}

	let toparts = fs.path_to_par_and_name(topath);
	let tobase = toparts[0].replace(/\/$/, "");
	let toname = toparts[1];
	let ext;
	if (is_regular_file) {
		let marr = ALL_EXTENSIONS_RE.exec(toname);
		if (marr && marr[1] && marr[2]) {
			toname = marr[1];
			ext = marr[2];
		}
//FUIMNTYU
//cwarn("DELETE NODE.APPNAME");
//delete node.appName;
	}
	if (frombase) {
		if (frombase === tobase) {
			for (let icn of icons) {
//				let usename = toname;
//				if (ext) usename += `.${ext}`;
				icn.updateDOMElement();
			}
			doend();
			return 
		}
//WMKFTYIOP <---- RIGHT!?!?!?
//		let icns = node.icons;
//		while (icns.length) {
		while (icons.length) {
			let icn = icons.pop();
			if (icn === no_del_icon) continue;
			icn.del();
		}
		if (no_del_icon) icons.push(no_del_icon);
	} 

	for (let icn of icons) {
		if (icn === no_del_icon) {
			delete icn.disabled;
			icn.iconElem._op=1;
			continue;
		}
		icn.del();
	}
	let wins = get_wins_by_path(tobase, {getDesk: true});
	opts.ext = ext;
	for (let w of wins) {
		if (w === no_add_win) {
			if (no_del_icon) ret.push(no_del_icon);
			continue;
		}
		let newicon = await make_icon(toname, w, opts);
		if (newicon) ret.push(newicon);
	}
	doend();

});
}
this.move_icon_by_path = move_icon_by_path;
//»
const move_icon_array=(opts={})=>{//«

if (!ICONS.length) return;
let{toOrigin, toClosest}=opts;
let rect;
let cur_is_on = CUR.ison();
let goticn;
let towin = CWIN;
let rect_elem;
if (!cur_is_on) rect_elem = ICONS[0].iconElem;
else{
	rect_elem = CUR.curElem;
	goticn = CUR.geticon();
}

rect = rect_elem._gbcr();

if (toOrigin) goticn = null;

const move_to_win_or_desk=()=>{//«
	if (towin){
		move_icons(towin.fullpath,{win: towin});
		return;
	}
	let par = ICONS[0].parWin;
	let	x=((rect.left+rect.right)/2);
	let	y=((rect.top+rect.bottom)/2);
	if (par!==desk){
		if(toOrigin||!cur_is_on){
			x=0;
			y=0;
		}
		move_icons(DESK_PATH, {e:{clientX:x,clientY:y}});
		return;
	}
	if (par===desk && !toOrigin && !cur_is_on) return;
	for (let icn of ICONS) vacate_icon_slot(icn, true);
	if (toOrigin){
		x=0;
		y=0;
	}
	for (let icn of ICONS) placeInIconSlot(icn, {noVacate: true, pos:{X:x+desk.scrollLeft,Y:y+desk.scrollTop}});
	icon_array_off(15);
};//»
const moveit = async()=>{//«
	if (toClosest || !goticn) return move_to_win_or_desk();
	goticn.off(true);
	if (!ICONS.length) return;
	if (goticn.appName !== FOLDER_APP){
		poperr("Cannot move to a non-folder! (use shift key to move to closest location)");
		return;
	}
	let rect2 = goticn.iconElem._gbcr();
	if (!await move_icons(goticn.fullpath,{loc:{X: rect2.left, Y: rect2.top-15}})) return;
	if (CWIN) CWIN.off();
	if (goticn.parWin&&goticn.parWin !== desk) goticn.parWin.on();
	icon_array_off(16);
	if (goticn.win) goticn.win.app.reload();
};//»

if (windows_showing) return moveit();
toggle_show_windows();
setTimeout(moveit, 10);

}//»
const switch_icons = () => {//«
//Switch the locations of 2 icons on the desktop
	if (!(!CWIN && CUR.ison() && ICONS.length===1)) return;
	let icn1 = CUR.geticon();
	let icn2 = ICONS[0];
	if (!(icn1 && icn2)) return;
	if (icn1 === icn2) return;
	let r1 = icn1.iconElem._gbcr();
	let r2 = icn2.iconElem._gbcr();
	let scrl = desk.scrollLeft;
	let scrt = desk.scrollTop;
	vacate_icon_slot(icn1);
	vacate_icon_slot(icn2);
	placeInIconSlot(icn1, {noVacate: true, pos: {X:r2.left+scrl, Y:r2.top+scrt}});
	placeInIconSlot(icn2, {noVacate: true, pos: {X:r1.left+scrl, Y:r1.top+scrt}});
	icon_array_off();
}//»

const check_special_ext = node =>{//«
	if (node.type !== FS_TYPE) return false;
	let ext = node.ext;
	if (!ext) return false;
//log(node);
	if (MEDIA_EXTENSIONS.includes(ext.toLowerCase())) {
		let url = fsUrl(`/blobs/${node.blobId}`);
		open_app(MEDIA_APP, {appArgs:{url, node}});
		return true;
	}
	if (IMAGE_EXTENSIONS.includes(ext.toLowerCase())) {
		let url = fsUrl(`/blobs/${node.blobId}`);
		open_app(IMAGE_APP, {appArgs:{url, node}});
		return true;
	}   
	return false; 
};//»   

//The main activation function (double-clicking)
const open_icon = async(icn, opts={}) => {//«
//	const{e, winCb, force, useApp}=opts;
	const{e, force, useApp}=opts;
	const noopen = (mess) => {
		let str = "The file could not be opened:&nbsp;" + fullpath;
		if (mess) str += `<br>(${mess})`;
		poperr(str);
	};
	if (icn.disabled) return;
	if (!windows_showing) toggle_show_windows();
	icon_array_off(23);
	let win;
	let app=icn.appName;

	let fullpath = icn.fullpath;
	if (!icn.win){
		OUTERLOOP: for (let wspace of workspaces) {
			let wins = wspace.windows;
			for (let w of wins){
				if (!w.icon && w.fullpath===fullpath){
					icn.win = w;
					w.icon = icn;
					break OUTERLOOP;
				}
			}
		}
	}
	if (!(!icn.win || force || (e && e.ctrlKey))) {//«
		let w = icn.win;
		if (w.workspaceNum !== current_workspace_num){
			switch_to_workspace(w.workspaceNum);
			w.on();
			if (w.taskbarButton) w.taskbarButton._dis="flex";
			else w.winElem._dis="block";
		}
		if (w.isMinimized) {
			if (w.winElem.parentNode !== desk) {
cerr("Where is the minimized window?");
				return;
			}
			w.unminimize();
		}
		else{
			w.on();
		}
		return;
	}//»
	if (app==FOLDER_APP) {//«
		let w = icn.parWin;
		if (w && (w.saver || (w!==desk && !force && folders_open_in_same_window))){
			if (w.app.prevPaths){
/*If the icon we are clicking is in the "next up" position in the folder's prevPaths, then
the prevPaths array still holds good.*/
				if (w.app.prevPaths[0]===icn.fullpath){
					w.app.prevPaths.shift();
					if (!w.app.prevPaths.length) delete w.app.prevPaths;
				}
//Otherwise, get rid of it.
				else delete w.app.prevPaths;
			}
			await w.app.reload(icn.fullpath);
			win = w;
		}
		else win = await open_new_window(icn);
		return win;
	}//»
	let link = icn.link;
	let node = await pathToNode(fullpath);
	if (!node) {
		let badlink = await pathToNode(fullpath, true);
		if (badlink && badlink.link) return noopen(`Bad link: '${badlink.symLink}'`);
		return noopen("file not found");
	}
	let typ = node.type;

	const OK_TYPES=[FS_TYPE,MOUNT_TYPE,SHM_TYPE];
	if (!OK_TYPES.includes(typ)) return poperr(`Cannot open type: ${typ}`);

	if (check_special_ext(node)) return;
	
	if (typ==FS_TYPE&&!fs.check_fs_dir_perm(node)) return noopen("permission denied");
	let ret = await node.bytes;
	if (!ret) return noopen();
	icn.node = node;
	return open_icon_app(icn, ret, node.ext, useApp, force);

}//»

const icon_array_off = (which) => {//«
	let icn = ICONS[0];
	for (let i = 0; i < ICONS.length; i++) ICONS[i].off();
	ICONS = [];
	if (icn && icn.parWin!==desk) {
		icn.parWin.app.update();
		icn.parWin.app.stat(`0 selected`);
	}
}//»
const select_icons_in_drag_box_desk = (e) => {//«
	if (!DDIE) return;
	let icons = get_icon_array(desk);
	let hix = null,
		lox;
	let hiy = null,
		loy;
	if (DDIE.clientX < e.clientX) {
		hix = e.clientX;
		lox = DDIE.clientX;
	} else {
		hix = DDIE.clientX;
		lox = e.clientX;
	}
	if (DDIE.clientY < e.clientY) {
		hiy = e.clientY;
		loy = DDIE.clientY;
	} else {
		hiy = DDIE.clientY;
		loy = e.clientY;
	}
	if (hix == null || hiy == null) return;

	hix-=winx();
	hiy-=winy();
	lox-=winx();
	loy-=winy();

	let OK=[];

	for (let icn of icons) {
		if (!(icn&&icn.wrapper)) continue;
		let rect = icn.wrapper.getBoundingClientRect();
		let left = rect.left;
		let right = rect.right;
		let top = rect.top;
		let bot = rect.bottom;
		if (!(left > hix || right < lox || top > hiy || bot < loy)) {
			OK.push(icn);
			icn.on();
		}
		else icn.off();
	}
	ICONS = OK;
}//»
const select_all_icons=()=>{//«
	let cwin = CWIN;
	icon_array_off(14);
	let icons;
	if (!cwin) icons = Array.from(desk.children).filter(el=>el.className==="icon");
	else icons = Array.from(cwin.iconDiv.childNodes);
	if (cwin){
		for (let icn of icons) {
			if (!icn.showing) icn.show();
		}
	}
	for (let icn of icons) {
		icn.icon.on(true);
	}
};//»
const select_first_visible_folder_icon=(win)=>{//«
	if (!(win.main)) return;
	let rect = win.Main.getBoundingClientRect();
	let x = rect.left+folder_grid_start_x+IGSX/2;
	let y = rect.top+folder_grid_start_y;
	let el = document.elementsFromPoint(x,y+0.75*IGSY)[0];
	if(!(el && el.iconElem)) el = document.elementsFromPoint(x,y+0.5*IGSY)[0];
	if(!(el && el.iconElem)) el = document.elementsFromPoint(x,y+0.25*IGSY)[0];
	if(!(el && el.iconElem)) return;
	let icn;
	if (el.className=="icon") icn = el;
	else if (el.iconElem) icn = el.iconElem;
	if (isFin(icn.col)&&isFin(icn.row)) CUR.setpos(icn.col, icn.row, icn);
	else CUR.setpos(0,0,icn);
};//»

const get_desk_icons=()=>{//«
	let _arr = desk.getElementsByClassName("icon");
	let arr=[];
	for (let icn of _arr){
		arr.push(icn.icon);
	}
	return arr;
};//»
const get_icons_by_path = (patharg, extarg) => {//«
	let arr = get_desk_icons();
	let ret = [];
	patharg = patharg.regpath();
	for (let icn of arr) {
		if (!icn) {
			continue;
		}
		let ext = icn.ext;
		let namepath = (icn.path + "/" + icn.name).regpath();
		if (namepath == patharg) {
			if (extarg) {
				if (ext === extarg) ret.push(icn);
			} else if (!ext) ret.push(icn);
		}
	}
	return ret;
};
this.get_icons_by_path = get_icons_by_path;
//»

const save_icon_editing = async() => {//«

	const abort=async mess=>{//«
		if (!mess) mess="There was an error";
		CEDICN.del();
		if (CEDICN._editcb) {
			await WDGAPI.poperr(mess);
			CEDICN._editcb();
			CEDICN._editcb = null;;
		}
		else poperr(mess);
		CEDICN = null;
		CG.off();
	};//»
	const doend=async newname => {//«
		let oldpath = `${parpath}/${holdname}`;
		let oldname;
		let oldext;
		let newnameext;
		let newpath;
		if (CEDICN._namearea) CEDICN._namearea._del();
		if (CEDICN.appName !== FOLDER_APP) {
			let nameext = getNameExt(holdname);
 			oldname = nameext[0];
			oldext = nameext[1];
		}
		else{
			oldname = holdname;
		}
		if (newname){
			newnameext = newname;
			if (oldext) newnameext=`${newname}.${oldext}`;
			newpath = `${parpath}/${newnameext}`;
			update_all_paths(oldpath, newpath);
			CEDICN.setWindowName();
			CEDICN.updateDOMElement();
		}
//		else {
//		}
		CEDICN.setLabelName();
		CEDICN.dblclick = null;
		if (CEDICN._savetext||CEDICN._savetext==="") {
			let rv = await fsapi.writeFile(newpath, CEDICN._savetext, {noMakeIcon: true });
			if (!rv) return abort("The file could not be created");
			CEDICN.node = rv;
			delete CEDICN._savetext;
		}

		if (CEDICN._editcb) {
			CEDICN._editcb(CEDICN);
			CEDICN._editcb = null;
		}
		if (CEDICN.iconElem.parentNode===desk && !windows_showing) toggle_show_windows();
		CEDICN.saveToStorage();
		CEDICN = null;
		CG.off();
	};//»

	let ifnew;
	if (!CEDICN) return;
	let parpath = CEDICN.parWin.fullpath;
	if (CEDICN.isnew) {
		ifnew = true;
		delete CEDICN.isnew;
		CEDICN.isnew = undefined;
	}
	let val = CEDICN.name;
	let holdname = val;
	let checkit = CEDICN._namearea.value.trim().replace(RE_SP_PL, " ").replace(RE_SP_G, "\u00A0");
	if (!checkit){
		if (ifnew) return abort("Not creating the icon");
		return doend();
	}
	let checkithold = checkit;
	let ext = CEDICN.ext;
	if (ext) {
		checkit += `.${ext}`;
		holdname += `.${ext}`;
	}
	if (!(ifnew || (checkit != CEDICN.fullname))) {
		return doend();
	}
	
	let srcpath = `${parpath}/${holdname}`;
	let destpath = `${parpath}/${checkit}`;
//cwarn(`${srcpath} -> ${destpath}`);
	if (!(!await check_name_exists(checkit, CEDICN.parWin) || (ifnew && (srcpath == destpath)))) {
		popup(`The name "${checkit}" is already taken... reverting to "${holdname}"`);
		CEDICN._namearea.value = val;
		if (ifnew) CEDICN.isnew = true;
		save_icon_editing();
		return;
	}
	if (ifnew){//«
		let parobj = await pathToNode(parpath);
		if (!parobj) {
			doend();
cerr("pathToNode(): parpath not found:" + parpath);
			return;
		}
		let rtype = parobj.type;
		if (!(rtype==FS_TYPE||rtype==SHM_TYPE)){
			doend();
cerr("Unsupported type:" + rtype);
			return;
		}
		if (CEDICN._savetext||CEDICN._savetext==="") {
			return doend(checkithold);
		}
		let mkret = await fsapi.mkDir(parobj, checkit, {noMakeIcon: true});
		if (mkret) {
			CEDICN.node = mkret;
			doend(checkit);
		}
		else abort("Could not create the new directory");
		return;
	}//»
	let srcnode = await pathToNode(srcpath);
	let srctype = srcnode.type;
	if (srctype!==FS_TYPE) return doend();
	if (await fsapi.comMv([srcpath, destpath])) {
		return doend(checkithold);
	}
	poperr("There was an error with renaming the icon. Please check the console.");
	doend();
}//»
const init_icon_editing = icn => {//«

	CEDICN = icn;
	if (icn.parentNode===desk && windows_showing) toggle_show_windows();
	CG.on();
	let label = icn.label;
	let area = make('input');
	area.type="text";
	area.value = icn.name;
	CEDICN._namearea = area;
	let usediv = label;
//	usediv.html("");
	icn.nameSpan._dis="none";
	area.style.resize = "none";
	area._w="100%";
	area._marl= "auto";
	area._marr= "auto";
	area._over= "hidden";
	usediv._add(area);
	usediv.area = area;
	area.ael('mousedown', e => {
		e.stopPropagation();
		area.focus();
	});
	area.ael('mouseup', e => {
		e.stopPropagation();
	});
	area.ael('dblclick', e => {
		e.stopPropagation();
		area.select();
	});
	setTimeout(()=>{
		area.select();
		focus_editing();
	},50);
};//»
const update_all_paths = (oldpath, newpath) => {//«
	const replacepath=(w, oldpath, newpath)=>{
//		let patharr=w._path.split("/");
		let patharr=w.path.split("/");
		let oldarr=oldpath.split("/");
		for(let i=0;i<oldarr.length;i++) patharr.shift();
//		w._path=(newpath+"/"+patharr.join("/")).regpath();
		w.path=(newpath+"/"+patharr.join("/")).regpath();
	};
	let app_has_ext = (app) => {
		if (app === FOLDER_APP || app === "Link") return false;
		return true;
	};
	oldpath = oldpath.regpath();
	newpath = newpath.regpath();
	let re = new RegExp("^" + oldpath + "/");
	for (let wspace of workspaces) {
		let wins = wspace.windows;
		for (let w of wins) {
			if (w.fullpath === oldpath) {
				let newarr = newpath.split("/");
				let fname = newarr.pop();
				let ext = "";
				if (app_has_ext(w.appName)) {
					let marr = getNameExt(fname);
					fname = marr[0];
					ext = marr[1];
				}
				w.name = fname;
				w.ext = ext;
				w.title = fname;
				w.path = newarr.join("/");
				if (w.appName===FOLDER_APP) w.app.reload(`${w.path}/${fname}`);
			} 
			else {
				let gotpath = w.path;
				if (gotpath == oldpath || re.exec(gotpath)) {
					replacepath(w, oldpath, newpath);
				}
			}
		}
	}
};
this.update_all_paths = update_all_paths;
//»

const make_new_text_file = (winarg, val, ext, opts={})=>{//«
	return new Promise(async(Y,N)=>{
		let path = winarg.fullpath;
		let usepos = null;
		let num = 0;
		let basename = opts.name||"New_File";
		let name = basename;
		let iter = 0;
		while (await check_name_exists(`${name}.${ext}`, null, path)) {
			name = basename + (++num);
			iter++;
			if (iter > 50) {
				cerr("infinite loop detected");
				return Y();
			}
		}
		let parobj = await pathToNode(path);
		if (!parobj) return;
		let rtype = parobj.type;
		if (!(rtype==FS_TYPE||rtype==SHM_TYPE)){
			await popwait(`Cannot create a file of type: '${rtype}'`, "error");
			Y();
			return;
		}
		let icn = new Icon({name: `${name}.${ext}`, baseName: name, ext: ext, fake: true});
		icn._savetext = val;
		icn._editcb = Y;
		if (winarg===desk) placeInIconSlot(icn, {create: true});
		else add_icon_to_folder_win(icn, winarg);
		setTimeout(() => {
			init_icon_editing(icn);
		}, 0);
		icn.isnew = true;
		return true;
	});
};
//»
const make_folder_icon = async(winarg) => {//«
	if (CG._dis != "none") return;
	CG.on();
	let usewin, usepath;
	if (winarg===desk){
		usewin = desk;
		usepath = DESK_PATH;
		if (windows_showing) toggle_show_windows();
	}
	else{
		usewin = winarg.main;
		usepath = winarg.path + "/" + winarg.name;
	}
	let name = "New_Folder";
	let num = 0;
	let iter = 0;
	while (await check_name_exists(name, null, usepath)) {
		name = "New_Folder_" + (++num);
		iter++;
		if (iter >= 50) return poperr("Infinite loop detected in make_folder_icon");
	}
	let parobj = await pathToNode(usepath);
	if (!parobj) return;
	let rtype = parobj.type;
	if (!(rtype==FS_TYPE||rtype==SHM_TYPE)) {
		return poperr(`Not making a directory of type: '${rtype}'`);
	}
	let obj;
	let icn = new Icon({name: name, baseName: name, kids:true, fake: true});
	icn.isnew = true;
	if (usewin===desk) placeInIconSlot(icn, {create: true});
	else add_icon_to_folder_win(icn, usewin.top);
	setTimeout(() => {
		init_icon_editing(icn);
	}, 0);
}
//»
const make_text_icon=async winarg=>{//«
	let val = await WDGAPI.popinarea("Input text");
if (val===false){//Pressed cancel button
return;
}
	if (!val) {
val = "";
cwarn("Creating empty file");
	}

	if (CG._dis != "none") return;
	CG.on();
	if (winarg===desk&&windows_showing){
		toggle_show_windows();
	}
	make_new_text_file(winarg, val, "txt");
};//»
const make_new_icon = async(winarg, type) => {//«
	if (globals.read_only) return;
	if (type == FOLDER_APP) make_folder_icon(winarg);
	else if (type == "Text") make_text_icon(winarg);
};
this.make_new_icon = make_new_icon;
//»
const make_icon_if_new = async node => {//«
//log("make_icon_if_new", node);
	if (isStr(node)) {
		let path = node;
		node = await pathToNode(path);
		if (!node){
cwarn(`No node returned in make_icon_if_new, (path=${path})`);
			return;
		}
	}
	let ref;
	if (node.link) ref = await node.ref;
	let fullpath = node.fullpath;
	let icons = get_desk_icons();
	for (let icn of icons) {
		if (icn.fullpath == fullpath) return;
	}
	let parts = pathParts(fullpath);
	let dirpath = parts[0];
	let fname = parts[1];
	let ext = parts[2];
	if (node.type==FS_TYPE && ext==="app"){
		node.appicon = await node.text;
	}
	if (dirpath === DESK_PATH) {
		placeInIconSlot(new Icon(node, {ref}), {create: true});
	}
	let wins = get_wins_by_path(dirpath);
	for (let w of wins) add_icon_to_folder_win(new Icon(node, {ref}), w);

};
this.make_icon_if_new = make_icon_if_new;
//»
const make_icon = async(name, where, opts={}) => {//«

/*«

Only called in the desktop via save_dropped_files, with opts.pos

Otherwise, it is on called at the end of:
		
	const move_icon_by_path = (frompath, topath, app, opts = {}) => 

Those who call this with opts are:
fs.com_mv, with opts={node, icon, win}
save_from_local with opts={icon, win}

»*/

	let {ext, node, icon: oldicon} = opts;

	let fullname;
	if (ext) fullname = `${name}.${ext}`;
	else fullname = name;

	let path;
	if (where == desk) path = DESK_PATH;
	else path = `${where.path}/${where.name}`;

	let fullpath = `${path}/${fullname}`;

	let icons = get_icon_array(where, true);
	for (let icn of icons){
		if (icn && icn.fullname === fullname) {
cwarn(`make_icon: Already have an icon named: ${fullname}`);
log(where);
			return;
		}
	}

	if (!node) {
cerr("make_icon: !!!!! No node given!!!!!");
cwarn("THIS IS A BAD ERROR, BUT SEE IF THE FAKE NODE WORKS ANYWAYS...");
		node = {name:fullname, baseName: name, ext, fullpath};
log(node);
		node.kids = (oldicon && oldicon.appName === FOLDER_APP);
	}
	if (ext==="app") node.appicon = await node.text;
	let ref;
	if (node.link) ref = await node.ref;
	let icn = new Icon(node, {ref});
	if (where===desk) placeInIconSlot(icn, {pos: opts.pos, create: true});
	else add_icon_to_folder_win(icn, where);
	return icn;
}
//»

const delete_selected_files = async which => {//«
	let arr = [];
	let usewin = desk;
	if (CWIN && CWIN.appName == FOLDER_APP) usewin = CWIN;
	if (which) arr = [which.fullpath];
	else if (ICONS) {
		for (let icn of ICONS) arr.push(icn.fullpath);
		icon_array_off(6);
	}
	arr = uniq(arr);

	if (arr.length) {
		let ret = await popyesno(`Delete ${arr.length} files?`,{reverse: DEF_NO_DELETE_ICONS});
		if (!ret) return;
		let errprompt;
		let errors = [];
		await fsapi.doFsRm(arr, mess=>{errors.push(mess);});
		icon_array_off(8);
		if (usewin!==desk){
			usewin.app.reload();
			if (CUR.main) delete CUR.main.lasticon;
			CUR.set(1);
		}
		if (errors.length) poperr(errors.join("<br>"), {wide: true});
	}
	return !!(arr.length);
}//»

const add_icon_to_folder_win = (icn, win) => {//«
	let main = win.main;
	icn.iconElem._pos= "relative";
	main.scrollTop = 0;
	let idiv = main.iconDiv;

//QHBTUDJYTA
if (!idiv){//«
log(`The window is below. It should only be a Folder.`)
log(win);
log(`Testing for win.appName === ${FOLDER_APP}:  ${win.appName === FOLDER_APP}`);
log("The main div is below.");
log(main);
log(`There doesn't seem to be a .iconDiv property on it.`); 
log(`There *should* be an element with id=="icondiv_win_#" inside of it.`);
log(`Testing !!main.iconDiv: ${!!main.iconDiv}`);
poperr("Please see the console to debug this very strange situation...");
throw new Error("WHAT THE IN THE EVERLIVING CRAP IS THIS?????");
}//»

	let kids = idiv.childNodes;
	if (!kids.length) idiv._add(icn.iconElem);
	else idiv.insertBefore(icn.iconElem, kids[0]);
	icn.parWin = win;
};//»

//»
//Taskbar«

const Taskbar = function(){

//DOM«

let bar = mkdv();//«
this.taskbarElem=bar;
bar.style.justifyContent="space-between";
bar.style.userSelect="none";
bar.onmousedown=noprop;
bar._padt=3;
bar._padb=1;
bar._h=TASKBAR_HGT;
if (qObj.nobar) bar._dis="none";
else bar._dis="flex";
bar._pos="fixed";
bar._b=0;
bar._x="-0.5px";
bar._w="100%";
bar._op=0;
bar._z=MIN_WIN_Z-1;
bar._bgcol=TASKBAR_BG_COL;
bar._bor=TASKBAR_BOR;
bar.id="taskbar";
bar._tcol="#999";
//»
let mwb = mkdv();//«
mwb._marr=mwb._marl=3;
mwb._dis="flex";
//»
let st = start_button;//«
//st._padt=st._padb=3;
st._padr=st._padl=5;
//st._bgcol="#222";

st._ff="arial";
st._dis="flex";
st.style.alignItems="center";
st.style.justifyContent="center";
st._fs=16;
st.innerText="Begin";
st._bor = TASKBAR_BOR;

//»

let wn = workspace_num_div;//«
let ws = workspace_switcher_div;
wn.style.cursor="pointer";
wn._marr = wn._marl = 3;
wn._dis="flex";
wn.style.justifyContent="center";
wn.style.alignItems = "center";
wn._fs = 18;
wn._bor=TASKBAR_BOR;
wn.style.cssFloat="right";
wn._ta="center";
wn._w=TASKBAR_HGT;
wn.onclick=(e)=>{
	e.stopPropagation();
	this.toggleSwitcher();
};
set_workspace_num(current_workspace_num);
//»

let wsbs = WORKSPACE_SWITCHER_BOX_SZ;//«
ws._bgcol="#fff";
ws._pos="absolute";
ws._dis="none";
ws.style.gridTemplateRows=`${wsbs}px ${wsbs}px ${wsbs}px`;
ws.style.gridTemplateColumns=`${wsbs}px ${wsbs}px ${wsbs}px`;
ws._r=0;
ws._b=TASKBAR_HGT+7;
ws._z=CG_Z-1;
//»


//»

//Methods«

this.hide=(if_temp)=>{//«
	bar._z = CG_Z-1;
	bar._b = -bar._gbcr().height;
	if (if_temp) return;
	taskbar_hidden=true;
	if (!globals.read_only) localStorage[lst_hidden]="true";
};//»
this.show=(if_temp)=>{//«
	bar._b=0;
	if (if_temp) {
		bar._z=CG_Z+2;
		return;
	}
	bar._z=MIN_WIN_Z-1;
	taskbar_hidden=false;
	if (!globals.read_only){
		delete localStorage[lst_hidden];
	}
};//»
this.toggle_expert_mode = ()=>{//«
	if (!globals.dev_mode) return;
	if (taskbar_expert_mode){
		taskbar_expert_mode = false;
		delete localStorage[lst_expert];
		st._dis="flex";
		wn._dis="flex";
	}
	else{
		taskbar_expert_mode = true;
		localStorage[lst_expert]="true";
		st._dis="none";
		wn._dis="none";
	}
	show_overlay(`Expert mode is ${taskbar_expert_mode?"on":"off"}`);
}//»
this.addwin=(w)=>{//«
	const dounmin=(if_instant)=>{//«
		w.winElem._dis="";
		let rect = d._gbcr();
		d._del();
		const done=()=>{//«
			delete w.isMinimized;
			delete w.taskbarButton;
			w.winElem._op=1;
			num_minimized_wins--;
			delete w.unminimize;
			if (w===CWIN) CWIN=null;
			w.checkLoc();
			w.checkSize();
			w.on();
		}//»
		if (if_instant) return done();
		w.winElem._op=0;
		let t = mkdv();
		t._pos="fixed";
		t._w=rect.width;
		t._h=rect.height;
		t._loc(rect.left,rect.top);
		t._bor="1px solid #ccc";
		t._z=CG_Z-1;
		desk._add(t);
		rect = w.winElem._gbcr();
		t.style.transition = `transform ${WIN_TRANS_SECS} ease 0s, left ${WIN_TRANS_SECS} ease 0s, top ${WIN_TRANS_SECS} ease 0s, width ${WIN_TRANS_SECS} ease 0s`;
		requestAnimationFrame(()=>{
			t.ontransitionend=()=>{
				w.winElem._op=1;
				t._del();
				done();
			};
			t._loc(rect.left, rect.top);
			t._w=rect.width;
			t._h=rect.height;
		});
	};//»
	let max_wid = "300px";

	let rect = w.winElem._gbcr();
	let t = mkdv();
	t._pos="fixed";
	t._w=rect.width;
	t._h=rect.height;
	t._loc(rect.left,rect.top);
	t._bor="1px solid #ccc";
	t._z=CG_Z-1;
	t.style.transition = `transform ${WIN_TRANS_SECS} ease 0s, left ${WIN_TRANS_SECS} ease 0s, top ${WIN_TRANS_SECS} ease 0s, width ${WIN_TRANS_SECS} ease 0s`;
	requestAnimationFrame(()=>{
		let c = mwb.lastChild;
		let x = c._gbcr().left;
		let wid = c._gbcr().width;
		t.ontransitionend=()=>{
			d._op=1;
			t._del();
		};
		t._loc(x, winh());
		t._w=wid;
	});

	desk._add(t);

	w.winElem._dis="none";
	w.isMinimized=true;
	w.winElem._op = MIN_WIN_OP;
	num_minimized_wins++;
	w.winElem._z= MIN_WIN_Z;
	let d = mkdv();
	d.style.flexShrink=1;
	d._op=0;
	d.style.flexBasis=max_wid;
	d._padt=d._padb=1;
	d._padl=d._padr=5;
	d._marr=d._marl=1.5
	d.style.maxWidth=max_wid;
	d._fs=15;
	d._dis="flex";
	d.style.alignItems="center";
	d._pos="relative";
	d._tcol="#999";
	d._bor=`${TASKBAR_BOR_WID} ${TASKBAR_BOR_STY} ${TASKBAR_BOR_COL}`;
	d._over="hidden";
	let imdiv = w.imgDiv.cloneNode(true);
	imdiv._marr=5;
	imdiv._pos="";
	imdiv._padb="";
	imdiv._padt=1.5;
	d._add(imdiv);
	let titstr = w.title;
	let tit = mkdv();
	tit._w="100%";
	tit.innerText=titstr;
	w.mintitle = tit;
	d._add(tit);
	let fdv = mkdv();
	fdv._pos="absolute";
	fdv._loc(0,0);
	fdv._w="100%";
	fdv._h="100%";
	fdv.style.backgroundImage=MIN_WIN_LIN_GRAD;
	d._add(fdv);
	d.onmousedown=(e)=>{
		if (e&&e.button!==0) return;
		d.is_active = true;
		d._bor=`${TASKBAR_BOR_WID} dotted ${TASKBAR_BOR_COL}`;
	};
	d.onmouseup=()=>{
		d.is_active = false;
		d._bor=`${TASKBAR_BOR_WID} ${TASKBAR_BOR_STY} ${TASKBAR_BOR_COL}`;
	};
	d.onmouseout=()=>{
		d.is_active = false;
		d._bor=`${TASKBAR_BOR_WID} ${TASKBAR_BOR_STY} ${TASKBAR_BOR_COL}`;
	};

	d.oncontextmenu=nopropdef;
	d.onclick=()=>{dounmin()};
	w.unminimize=(if_instant)=>{
		if (if_instant) return dounmin(true);
		d._bor=`${TASKBAR_BOR_WID} dotted ${TASKBAR_BOR_COL}`;
		setTimeout(() => {
			dounmin();
			d._bor = `${TASKBAR_BOR_WID} ${TASKBAR_BOR_STY} ${TASKBAR_BOR_COL}`;
		}, 200);
	};
	w.taskbarButton=d;
	mwb._add(d);
	if (w===CWIN) {
		CWIN=null;
		top_win_on();
	}
};//»
this.resize=()=>{mwb._w=winw()};
this.renderSwitcher=()=>{//«
	ws.innerHTML="";
	for (let i=0; i < num_workspaces; i++){
		let d = mkdv();
		if (i===current_workspace_num){
			d._fw="bold";
			d.title=`Active workspace: ${i+1}`;
			d._bgcol="#fff";
			d._bor="1px solid #aaa";
		}
		else{
			d._bor="1px dotted #aaa";
			d._tcol="#333";
			d._bgcol="#eee";
			d.title=`Switch to workspace: ${i+1}`;
			d.onclick=(e)=>{
				e.stopPropagation();
				if (switcher_off_timeout) clearTimeout(switcher_off_timeout);
				switch_to_workspace(i);
				switcher_off_timeout = setTimeout(()=>{
					this.switcherOff();
					switcher_off_timeout = null;
				}, SWITCHER_OFF_DELAY_MS);
			};
		}
		d._dis="flex";
		d.style.alignItems="center";
		d.style.justifyContent="center";
		d.innerHTML=`${i+1}`;
		d.style.cursor="pointer";
		ws._add(d);
	}
};//»
this.switcherOn=()=>{
	ws._dis="grid";
};
this.switcherOff=()=>{
	ws._dis="none";
};
this.switcherIsOn=()=>{
	return ws._dis==="grid";
};
this.toggleSwitcher=()=>{
	if (this.switcherIsOn()) this.switcherOff();
	else this.switcherOn();
};
//»

//Listeners«
bar.onmousedown=e=>{
	if (CWIN) {
		CWIN.off();
		CWIN = null;
		CUR.todesk();
	}
//log(e);
};
bar.oncontextmenu=e=>{//«
	e.preventDefault();
	e.stopPropagation();

	CWIN&&CWIN.off();

	let items_arr=[];
	if (taskbar_hidden){
		items_arr.push("Show\x20Taskbar");
		items_arr.push(()=>{
			this.show();
		});
	}
	else{
		items_arr.push("Hide\x20Taskbar");
		items_arr.push(()=>{
			this.hide();
		});
	}
	if (taskbar_expert_mode){
		items_arr.push("Expert\x20Mode __CHECK__");
		items_arr.push(taskbar.toggle_expert_mode);
	}
	else{
		items_arr.push("Expert\x20Mode __XMARK__");
		items_arr.push(taskbar.toggle_expert_mode);
	}

	set_context_menu({
		X: e.clientX,
		Y: e.clientY
	}, {items: items_arr});

}//»
bar.onmouseleave=()=>{//«
	if (taskbar_hidden){
		this.hide();
	}
}//»
bar.onmousemove=noprop;
st.onmousedown = (e) => {
	if (e.button !== 0) return;
	st._bor = `${TASKBAR_BOR_WID} dotted ${TASKBAR_BOR_COL}`;
};
st.onmouseup=()=>{st._bor=`${TASKBAR_BOR_WID} ${TASKBAR_BOR_STY} ${TASKBAR_BOR_COL}`;};
st.onmouseout=()=>{st._bor=`${TASKBAR_BOR_WID} ${TASKBAR_BOR_STY} ${TASKBAR_BOR_COL}`;};
st.oncontextmenu=nopropdef;
st.onclick=(e)=>{//«
	const doit=()=>{set_context_menu({X:0,Y:bar.clientHeight+3},{BREL:true});}
	if (e.isTrusted) return doit();
	st._bor=`${TASKBAR_BOR_WID} dotted ${TASKBAR_BOR_COL}`;
	setTimeout(()=>{st._bor=`${TASKBAR_BOR_WID} ${TASKBAR_BOR_STY} ${TASKBAR_BOR_COL}`;doit();},200);
};//»

//»

//Init«

let curuser = globals.current_user;
let lst_hidden = `taskbar_hidden:${curuser}`;
let lst_expert = `taskbar_expert:${curuser}`;

taskbar_hidden = localStorage[lst_hidden];
taskbar_expert_mode = localStorage[lst_expert];

if (taskbar_hidden) this.hide();
if (taskbar_expert_mode) {
	st._dis="none";
	wn._dis="none";
}

bar._add(st);
bar._add(mwb);
if (!qObj["no-switcher"]) {
	bar._add(wn);
	desk._add(ws);
}
if (!isMobile) desk._add(bar);

setTimeout(()=>{
	bar.style.transition = `bottom ${TASKBAR_TRANS_SECS}s ease 0s`;
},500);
//»

};

const toggle_taskbar=()=>{if(taskbar_hidden)taskbar.show();else taskbar.hide();};

//»
//File/App«


const open_text_editor = () => {//«
	return open_app(TEXT_EDITOR_APP, {force: true});
};//»
const make_file = () => {//«
	if (!CWIN || CWIN.appName != FOLDER_APP){
		make_new_icon(desk, "Text");
	}
	else {
		make_new_icon(CWIN, "Text");
	}
};//»

const raise_app_if_open=(appname)=>{//«
	for (let w of get_all_windows()){
		if (w.appName==appname){
			if (w.isMinimized) w.unminimize();
			else w.on();
			if (w.workspaceNum !== current_workspace_num) switch_win_to_workspace(w, current_workspace_num);
			return w;
		}
	}
	return false;
};//»

const open_app = async(appname, opts={}) => {//«
/*
We only need fullpath in case of a "dev reloaded" window that has a path but is not associated with an icon.
This happens when reloading a folder window.
*/
	let {force, winArgs, appArgs={}, icon, fullpath, dataUrl} = opts;
	let usename, usepath, useext;
	if (fullpath){
		let arr = getNameExt(fullpath, false, true);
		usepath = arr[0];
		usename = arr[1];
		useext = arr[2];
	}
	let gotwin;
	if (!force && (gotwin = raise_app_if_open(appname))) {
		if (!windows_showing) toggle_show_windows();
		return gotwin;
	}
	let win = new Window({
		FULLPATH: fullpath,
//		CB: winCb,
		WINARGS: winArgs,
		name: usename || appname.split(".").pop(),
		appName: appname,
		dataUrl,
		APPARGS: appArgs
	});
	if (icon) {
		icon.win = win;
		win.icon = icon;
	}
	if (fullpath) {
		win.name = usename;
		win.path = usepath;
		win.ext = useext;
	}
	return await win.loadApp();
};
api.openApp=open_app;
/*«
api.openApp = (appname, opts={}) => {
//this.open_app = (appname, force_open, winargs, appargs) => {
	return new Promise((Y, N) => {
		opts.winCb=Y;
//		open_app(appname, {cb: Y, force: force_open, winArgs: winargs, appArgs: appargs});
		open_app(appname, opts);
	});
};
»*/
//api.openApp=this.open_app;

//»
const open_new_window = async (icn, opts={}) => {//«
//const open_new_window = async (icn, cb, opts={}) => {

//Verify that this is a correct determination
	let app = icn.appName;
	if (opts.altApp) app = opts.altApp;
	else if (icn.linkapp) app = icn.linkapp;
	let viewOnly;
	if (icn.node && WRITING_APPS.includes(app)){
		if (icn.node.writeLocked()){
			viewOnly = true;
		}
		else if (icn.node.lockFile) icn.node.lockFile();
	}
	let usename = icn.linkName||icn.name;
	let usepath = icn.linkPath||(icn.node&&icn.path)||icn.path||"";
	let useext = icn.linkExt||icn.ext;
	let ref = await icn.ref;
	if (ref){
		let arr = getNameExt(ref.name);
		usename = arr[0];
		useext = arr[1];
		usepath = ref.par.fullpath;
	}

	let fullpath = `${usepath}/${usename}`;
	if (useext) fullpath+=`.${useext}`;

	let win = new Window({
//		CB: cb,
		WINARGS: icn.winArgs,
		appName: app,
		viewOnly,
		name: usename,
		FULLPATH: fullpath,
		PREVPATHS: opts.PREVPATHS,
		SAVER: opts.SAVER
	});
//	if (!win) return;

	win.name = usename;
	win.path = usepath;
	win.ext = useext;
	icn.win = win;
	win.icon = icn;

	return await win.loadApp();

}//»
const open_icon_app = async(icn, bytes, ext, useapp, force_open) => {//«
//WKIUTHJU
//const open_icon_app = async(icn, bytes, ext, useapp, force_open, win_cb) => {
	if (bytes instanceof ArrayBuffer) bytes = new Uint8Array(bytes);
	if (icn.appName=="Application") ext = "app";
	if (!(!useapp && ext == "app")) return open_file(bytes, icn, useapp);
	let obj;
	try {
		obj = JSON.parse(await toStr(bytes));
		icn.appobj = obj;
	} catch (e) {
		poperr(`The application JSON could not be parsed (${e.message})`);
cerr(e.message);
		return;
	}
	if (!obj) return poperr("Open error #1");
	let which = obj[ext];
	if (!which) {
		return poperr(`No ${ext} field in the JSON object!`);
	}
	return open_app(which, {winArgs: icn.winArgs, appArgs: obj.args, icon: icn});
}//»
const open_file_by_path = async(patharg, opt={}) => {//«
//const open_file_by_path = async(patharg, cb, opt={}) => {
	const err = (str) => {
		poperr(str);
	};
	let node = await pathToNode(patharg);
	if (!node) {
		let marr;
		return err("Cannot open:" + patharg);
	}
	if (node.appName == FOLDER_APP) {
		let path;
		if (!node.par) path="/";
		else path = node.par.fullpath;
		if (CUR.curElem.parentNode === desk) {
			let icn = CUR.geticon();
			if (icn) icn.hideLabelName();
		}
		return open_folder_win(node.name, path, null, opt.WINARGS, opt.SAVER, opt.PREVPATHS);
	}
	if (check_special_ext(node)) return;
	let fullpath = node.fullpath;
	let patharr = fullpath.split("/");
	if (!patharr[patharr.length - 1]) patharr.pop();
	let fname = patharr.pop();
//SJNMYEJK
	let fake = {
		winargs: opt.WINARGS,
		name: fname,
		path: (patharr.join("/")).regpath(true),
		fullpath: () => {
			return fullpath;
		}
	};
	let arr = getNameExt(fullpath);
	let ext = arr[1];
	if (ext) {
		fake.name = arr[0];
		fake.ext = ext;
		fake.appName = extToApp(ext);
	} 
	else fake.appName = DEF_BIN_APP;
	let rtype = node.type;
	if (rtype!==FS_TYPE) return err(`Not (yet) handling type(${rtype})!`);
	let bytes = await node.bytes;
	if (!bytes) {
cwarn("got nothing:" + fullpath);
		return;
	}
	if (ext && ext == "app") return open_icon_app(fake, bytes, ext, null, opt.FORCE);
	return open_file(bytes, fake);
}
this.open_file_by_path=open_file_by_path;
//»
const open_file = async (bytes, icn, useapp) => {//«
//const open_file = async (bytes, icn, useapp, cb) => {
	if (!bytes) bytes = new Uint8Array();
	let viewOnly = false;
	if (VIEWONLY_APPS.includes(icn.appName)) viewOnly = true;
	let name, ext;
	if (icn.link) {
		name = icn.linkName;
		ext = icn.linkExt;
	}
	else{
		name = icn.name;
		ext = icn.ext;
	}
	let win = await open_new_window(icn, {altApp: useapp});
	if (!win) return;
	win._bytes = bytes;
	win.ext = icn.ext;
	win.app.onloadfile(bytes, {name, ext, viewOnly});
	return win;
}//»

//»
//Cursor«

const Cursor = function(){

let curElem = make('div');//«
this.curElem = curElem;
curElem.id="icon_cursor";
curElem._pos="absolute";
curElem._bor=`${CURBORWID}px ${CURBORSTY} ${CURBORCOL}`;
curElem._bgcol=CURBGCOL;
curElem._w=IGSX;
curElem._h=IGSY;
curElem._dis="none";
curElem._op=1;
curElem._mart=-1.5;
//»
this.ison=()=>{return (curElem._op==1);};
this.isdesk=()=>{return (curElem.parentNode===desk);};
this.xoff=()=>{return (curElem.parentNode===desk)?desk_grid_start_x:folder_grid_start_x;};
this.yoff=()=>{return (curElem.parentNode===desk)?desk_grid_start_y:folder_grid_start_y;};
this.getpos=()=>{return {X:(curElem._x-CUR.xoff())/IGSX, Y:(curElem._y-CUR.yoff())/IGSY};};
this.on=(is_tog)=>{//«
	if (is_tog) cur_showing = true;
	else if (!cur_showing) return;
	curElem._op=1;
	curElem._dis="";
	if (this.isdesk()){
		let pos = desk.lastcurpos;
		if (pos) return this.setpos(pos.X, pos.Y, null, is_tog);
	}
	this.set(4);
	curElem.scrollIntoViewIfNeeded();
};//»
this.off=(is_tog)=>{//«

	if (is_tog) cur_showing = false;
	else if (cur_showing) return;
	if (this.isdesk()){
		let icn = this.geticon(desk);
		if (icn) icn.hideLabelName();
	}
	curElem._op=0;
	curElem._dis="none";

};//»
this.setpos=(X,Y,icn, is_tog)=>{//«
	if (this.isdesk()) {
		let icn1 = this.geticon(desk);
		curElem._x= this.xoff()+IGSX*X;
		curElem._y= this.yoff()+IGSY*Y;
		let icn2 = this.geticon(desk);
		if (icn1) icn1.hideLabelName();
		if (icn2 && (is_tog || icn2 !== icn1)) {
			icn2.showLabelName();
		}
		curElem.scrollIntoViewIfNeeded();
		desk.lastcurpos={X,Y};
		return;
	}
	if (!icn) return;
	curElem._loc(icn.offsetLeft,icn.offsetTop);
	let d = this.main.scrollTop - curElem.offsetTop;
	if (d > 0) this.main.scrollTop-=d;
};//»
this.set = (which)=>{//«
	if (this.isdesk()){
		curElem._x=desk_grid_start_x;
		curElem._y=desk_grid_start_y;
		curElem.scrollIntoViewIfNeeded();
	}
	else{
		let got = this.main.lasticon;
		if (got && got.parWin == this.main.top) {
			curElem._loc(got.iconElem.offsetLeft+CUR_FOLDER_XOFF,got.iconElem.offsetTop+CUR_FOLDER_YOFF);
			if (CWIN) CWIN.app.stat(got.fullname);
		}
		else {
			this.main.scrollTop=0;
			curElem._x=CUR_FOLDER_XOFF;
			curElem._y=CUR_FOLDER_YOFF;
			setTimeout(()=>{
				let got = this.geticon();
				if (got&&CWIN) CWIN.app.stat(got.fullname);
			},50);
		}
	}
};//»
this.zero=()=>{//«
	if (this.isdesk()){
		curElem._x=desk_grid_start_x;
		curElem._y=desk_grid_start_y;
		curElem.scrollIntoViewIfNeeded();
	}
	else{
		this.main.scrollTop=0;
		curElem._x=CUR_FOLDER_XOFF;
		curElem._y=CUR_FOLDER_YOFF;
	}
};//»
this.todesk=()=>{//«
	if (curElem.parentNode===desk){
		this.vizCheck();
		return this.on();
	}
	desk._add(curElem);
	let pos = desk.lastcurpos;
	if (pos) this.setpos(pos.X, pos.Y);
	else this.set(5);
	this.vizCheck();
};//»
this.right=(if_ctrl)=>{//«
	let {X:_x,Y:_y}=this.getpos();
	if (if_ctrl) this.select(true);
	if (this.isdesk()){
		if (!SHOW_ICONS) return;
		if (desk_grid_start_x+(IGSX*(_x+2)) < winw()) _x++;
		else {
			if (this.yoff()+(IGSY*(_y+2)) < winh()) {
				_x=0;
			}
			else {
				_x=0;
			}
		}
		this.setpos(_x,_y);
		return;
	}
	let icn = this.geticon();
	let next;
	if (!icn) {
		let num = this.iconDiv.childNodes.length;
		if (!num) return;
		next = this.iconDiv.childNodes[0];
	}
	else next = icn.iconElem.nextSibling;
	if (!next) {
		delete this.main.lasticon;
		this.set();
		return;
	}
	let xpos = next.offsetLeft;
	let ypos = next.offsetTop;
	this.main.lasticon = next.icon;
	curElem._loc(xpos+CUR_FOLDER_XOFF,ypos+CUR_FOLDER_YOFF);
	if (CWIN) {
		if (!(next.icon&&next.icon.fullname)){
			setTimeout(()=>{
				if (next.icon) CWIN.app.stat(next.icon.fullname);
			},10);
		}
		else if (next.icon) CWIN.app.stat(next.icon.fullname);
	}
};//»
this.left=(if_ctrl)=>{//«
	let {X:_x,Y:_y}=this.getpos();
	if (if_ctrl) this.select(true);
	if (this.isdesk()){
		if (!SHOW_ICONS) return;
		if (_x > 0) _x--;
		else if (_y > 0){
			_x = DESK_GRID_W-1;
//			_y--;
		}
		else {
			_x = DESK_GRID_W-1;
//			_y = DESK_GRID_H-1;
		}
		this.setpos(_x,_y);
		return;
	}
	let icn = this.geticon();
	let prev;
	let num;
	if (!icn) {
		num = this.iconDiv.childNodes.length;
		if (!num) return;
		prev = this.iconDiv.childNodes[num-1];
	}
	else prev = icn.iconElem.previousSibling;
	if (!prev) {
		num = this.iconDiv.childNodes.length;
		if (num){
			prev = this.iconDiv.childNodes[num-1];
			if (!prev) return;
			this.main.lasticon = prev.icon;
			this.set();
		}
		return;
	}
	let xpos = prev.offsetLeft;
	let ypos = prev.offsetTop;
	this.main.lasticon = prev.icon;
	curElem._loc(xpos+CUR_FOLDER_XOFF,ypos+CUR_FOLDER_YOFF);
	if (CWIN&&prev.icon) CWIN.app.stat(prev.icon.fullname);
};//»
this.up=if_ctrl=>{//«
	if (if_ctrl) this.select(true);
	let {X:_x,Y:_y}=this.getpos();
	if (this.isdesk()){
		if (!SHOW_ICONS) return;
		_y--;
		if (_y<0) {
			_y = Math.floor((winh()-this.yoff())/IGSY)-1;
			if (_x<0) _x = DESK_GRID_W-1;
		}
		this.setpos(_x,_y);
		return;
	}
	let icn = this.geticon();

	if (!icn) {
		this.left();
		return;
	}
	const doit=()=>{
		let rect = icn.iconElem._gbcr();
		let elem = document.elementFromPoint(5+rect.left, rect.top-10);
		if (!elem) return;
		if (elem.parentNode.className==="icon") elem = elem.parentNode;
		if ((elem.className==="icon" || elem.className=="emptyicon") && elem.parentNode===icn.iconElem.parentNode){
			curElem._loc(elem.offsetLeft+CUR_FOLDER_XOFF, elem.offsetTop+CUR_FOLDER_YOFF);
			curElem.scrollIntoViewIfNeeded();
			this.main.lasticon = elem.icon;
			if (CWIN&&elem.icon) CWIN.app.stat(elem.icon.fullname);
			return true;
		}
	}
	if (!doit()) {
		this.main.scrollTop-=IGSY;
		doit();
	}
};//»
this.down=if_ctrl=>{//«
	let {X:_x,Y:_y}=this.getpos();
	if (if_ctrl) this.select(true);
	if (this.isdesk()) {
		if (!SHOW_ICONS) return;
		if (desk_grid_start_y+(IGSY*(_y+1.5)) < winh()) {
			_y++;
		}
		else{
			_y=0;
//			_x++;
			if (_x==DESK_GRID_W) _x=0;
		}
		this.setpos(_x,_y);
		return;
	}
	let icn = this.geticon();
	if (!icn) {
		this.right();
		return;
	}
	const doit=()=>{
		let rect = icn.iconElem._gbcr();
		let elem = document.elementFromPoint(5+rect.left, 5+IGSY+rect.top);
		if (!elem) return;
		if ((elem.className==="icon"||elem.className=="emptyicon") && elem.parentNode===icn.iconElem.parentNode){
			curElem._loc(elem.offsetLeft+CUR_FOLDER_XOFF, elem.offsetTop+CUR_FOLDER_YOFF);
			curElem.scrollIntoViewIfNeeded();
			this.main.lasticon = elem.icon;
			if (CWIN) {
				if (!(elem.icon&&elem.icon.fullname)){
					setTimeout(()=>{
						if (elem.icon) CWIN.app.stat(elem.icon.fullname);
					},10);
				}
				else if (elem.icon) CWIN.app.stat(elem.icon.fullname);
			}
			return true;
		}
	};
	if (!doit()) {
		this.main.scrollTop+=IGSY;
		doit();
	}
};//»
this.move=(which, if_ctrl)=>{//«
	if (!this.ison()) return CUR.on();
	if (which==="R") this.right(if_ctrl);
	else if (which==="L") this.left(if_ctrl);
	else if (which==="U") this.up(if_ctrl);
	else if (which==="D") this.down(if_ctrl);
	if (!this.isdesk()) curElem.scrollIntoViewIfNeeded();
};//»
this.geticon = (fromwhere) => {//«
	let icn;
	if (!this.ison()) return null;
	let rect = curElem.getBoundingClientRect();
	let elems = document.elementsFromPoint((rect.left+rect.right)/2,(rect.top+rect.bottom)/2);
	let e0=elems[0];
	if (e0===CUR||e0===CG) e0=elems[1];
	if(!e0) return null;
//FBVDGHJ
	if (e0.iconElem) icn = e0.iconElem.icon;
	else if (e0.className=="icon") icn = e0.icon;
	else if(e0.parentNode&&e0.parentNode.className=="icon") icn = e0.parentNode.icon;
	if (icn){
		if (fromwhere && icn.iconElem.parentNode !== fromwhere) return;
		return icn;
	}
	let e1=elems[1];
	if(!e1) return null;
	if (e1.className=="icon") icn = e1.icon;
	else if(e1.parentNode&&e1.parentNode.className=="icon") icn = e1.parentNode.icon;
	if (icn){
		if (fromwhere && icn.iconElem.parentNode !== fromwhere) return;
		return icn;
	}
	return null;
};//»
this.select=(if_toggle,if_open,if_force_new_win)=>{//«
	if (this.isdesk() && !SHOW_ICONS) return;
	let openit=()=>{
		if (!if_toggle&&ICONS.length==1) {
			open_icon(ICONS[0]);
			return true;
		}
		return false;
	};
	if (!this.ison()) {
		if(openit()) return;
		return this.on();
	}
	let icn = this.geticon();
	if (!icn || icn.fake) return openit();
	let haveit = ICONS.includes(icn);
	if (if_toggle&&haveit){
		icn.off(true);
	}
	else if (if_open){
		if (haveit) icn.off(true);
		open_icon(icn, {force: if_force_new_win});
	}
	else if (!haveit){
		if (ICONS.length&&(icn.parWin!==ICONS[0].parWin)) icon_array_off(1);
		icn.on(true);
	}
	else open_icon(icn, {force: if_force_new_win});
};//»
this.vizCheck=()=>{//«
	if (this.isdesk()){
		if (!SHOW_ICONS) curElem.style.visibility = "hidden";
		else curElem.style.visibility = "";
	}
	else curElem.style.visibility = "";
};//»

};

const CUR = new Cursor();

//»
//Widgets«

const Widgets = function() {//«

//Var«
const api={};

const MENU_BGCOL="#c0c0c0";
const ACTIVE_MENU_BG = "#006";
const ACTIVE_MENU_FG = "#fff";

const make=x=>{return document.createElement(x);};
const isarr=arg=>{return (arg && typeof arg === "object" && typeof arg.length !== "undefined");}
const now=if_secs=>{var ms=new Date().getTime();if(if_secs)return Math.floor(ms/1000);return ms;}
const center = (elem, usewin) => {
	let usew = winw();
	let useh = winh();
	if (usewin) {
		if (usewin.main) {
			usew = usewin.main._w;
			useh = usewin.main._h;
		} else {
			usew = usewin.offsetWidth;
			useh = usewin.offsetHeight;
		}
	}
	let elemw = elem.offsetWidth;
	let elemh = elem.offsetHeight;
	let usex = (usew / 2) - (elemw / 2);
	let usey = (useh / 2) - (elemh / 2);
	if (usex < 0) usex = 0;
	if (usey < 0) usey = 0;
	elem._x = usex;
	elem._y = usey;
}
//»

//Context Menu«

const noop=()=>{};
//const{winw,winh}=Core;
const noprop=(e)=>{e.stopPropagation();}

const menu_loc_from = (menuobj, item) => {//«
	let type = menuobj.type;
	let parelem = menuobj.parelem;
	let menuelem = menuobj.menuElem;
	let l, t, r, b;
	let w, h;
	let arr;
	if (type == "desk") {
		r = winw();
		l = menuelem.offsetLeft;
	} else {
		let menurect = menuelem.getBoundingClientRect();
		let parrect = parelem.getBoundingClientRect();
		l = menurect.left;
		r = parrect.right;
	}
	let newx, newy;
	if (item) {
		let r = item._gbcr();
		newy = r.top - 5;
	}
	if (l + 375 < r) newx = menuelem._x + menuelem.offsetWidth;
	else {
		newx = menuelem._x;
		let curelem = menuelem;
		while (curelem) {
			curelem._x -= curelem.offsetWidth;
			curelem = curelem.prevelem;
		}
	}
	return {
		X: newx,
		Y: newy
	};
}//»
const ContextMenu = function(loc, prevelem) {//«
	let elem = desk;

	let killed = false;//«
	let self = this;
	let curitem = null;
	let kids = [];
//»
	let menu = make('div');//«
	menu.style.userSelect="none";
	menu.className="context_menu";
	menu._bor="1px solid #aaa";
    menu.style.borderRadius="2px";
    menu._bgcol=MENU_BGCOL;
    menu._padt=5;
    menu._padb=2;
    menu._fs=16;
	menu._pos="absolute";
	menu.style.minWidth = 180;
	let usex=loc.X-winx(), usey=loc.Y-winy();
	if (prevelem) {
		usex-=8;
		usey-=2;
	}
	if (loc.BREL===true){
		menu._y="";
		menu._b = usey;
	}
	else {
		menu._b="";
		menu._y = usey;
	}
	if (loc.RREL===true) {
		menu._x = "";
		menu._r=usex;
	}
	else{
		menu._r="";
		menu._x = usex;
	}
//»
	const check_menu_width = sp => {//«
		let diff = menu.offsetWidth - sp.offsetWidth;
		let mindiff = 77;
		let diffoff = mindiff - diff;
		if (diffoff > 0) sp._marr = diffoff;
	};//»
	const next_item = () => {//«
		let kid;
		if (!curitem) kid = kids[0];
		else {
			let pos = kids.indexOf(curitem);
			if (pos < kids.length - 1) kid = kids[pos + 1];
			else kid = kids[0];
		}
		if (kid) kid.on();
	};//»
	const prev_item = () => {//«
		let kid;
		if (!curitem) kid = kids[kids.length - 1];
		else {
			let pos = kids.indexOf(curitem);
			if (pos > 0) kid = kids[pos - 1];
			else kid = kids[kids.length - 1];
		}
		if (kid) kid.on();
	};//»

	this.adjust_y = function() {//«
		let y = 0;
		let winh=window.innerHeight;
		let r = menu.getBoundingClientRect();
		let _h = r.height;
		let _y = menu._y;
		if (isFin(_y)) {
			if (_y + _h > winh) {
				menu._y = winh - _h;
			}
			if (menu._y < 0) menu._y = 0;
			r = menu.getBoundingClientRect();
			if (r.bottom>winh){
				menu._h = winh;
				menu._overy="scroll";
			}
		}
		else if (r.top < 0){
			menu._b = "";
			menu._y=0;
			this.adjust_y();
		}
	};//»
	this.kill = function() {//«
		if (killed) return;
		delete elem.context_menu;
		menu._del();
		if (self == desk_menu) {
			if (desk_menu.kill_cb) desk_menu.kill_cb();
			desk_menu = null;
			CG.off()
		} 
		killed = true;
		if (self.par) self.par.kill();
		if (self.kid) self.kid.kill();
	};//»
	this.key_handler = function(e, sym) {//«
		e.preventDefault();
		if (sym == "UP_") prev_item();
		else if (sym == "DOWN_") next_item();
		else if (sym == "RIGHT_") {
			if (curitem && curitem._is_array) curitem.select();
		} else if (sym == "LEFT_") {
			if (curitem && curitem.menu.par) {
				curitem.menu.par.curitem.on();
				delete curitem.menu.par.kid;
				curitem.menu.menuElem._del();
			}
		}
	};//»
	this.select = function() {//«
		if (!curitem) return cerr("No curitem!!!");
		curitem.select();
	};//»

	this.add_item = function(namearg, val) {//«
		const select = () => {//«
			if (val instanceof Function) {
				self.kill();
				val();
			} else if (isarr(val)) {
				self.curitem = curitem;
				let olditem = curitem;
				if (curitem) curitem.off();
				let newmenu = new ContextMenu(menu_loc_from(self, olditem), menu);
				newmenu.kill_cb = desk_menu.kill_cb;
				desk_menu = newmenu;
				for (let i = 0; i < val.length; i += 2) {
					let item = newmenu.add_item(val[i], val[i + 1]);
					if (i == 0) item.on();
				}
				newmenu.par = self;
				self.kid = newmenu;
				newmenu.adjust_y();
			}
		};//»
		const delete_menus = () => {//«
			let gotmenu = desk_menu || elem.context_menu;
			if (!gotmenu) {
cerr("No gotmenu???");
				return;
			}
			let gotcur = gotmenu.curitem;
			if (!gotcur) return;
			
			let gotmatch = false;
			let arr = [];
			while (true) {
				try {
					arr.push(gotcur.menu.menuElem);
					gotcur = gotcur.menu.par.curitem;
				} catch (e) {
					break;
				}
				if (!gotcur) {
cerr("!!!! Could not find the previous item! !!!!");
					break;
				}
				if (gotcur.menu === div.menu) {
					gotmatch = true;
					break;
				}
			}
			if (!gotmatch) {
				return;
			}
			for (let elm of arr) {
				if (elem.context_menu.par) delete elem.context_menu.par.kid;
				elm._del();
			}
		};//»

		let div = make('div');//«
		let namearr = namearg.split("::");
		let name = namearr[0];
		let shortcut;
		div.menu = self;
		div._marb = 5;
		div._padl = 18;
		div._padr = 15;
		div._padt = 5;
		div._padb = 5;
		div._h = "20px";
		div._ff = "sans-serif";
		div._dis = "flex";
		div.style.justifyContent = "space-between";
		let namesp = make('span');
		div._add(namesp);
		div.className= "context_menu_item";
		namesp.className ="context_menu_label";
		menu._add(div);
//»
		if (isarr(val)) {//«
			div._tcol="#000";
			namesp.innerHTML = name;
			let sp = make('span');
			sp._fs = 12;
			sp.html('&#9654;');
			div._add(sp);
			div._is_array = true;
			check_menu_width(namesp);
		} else {
			if (val) div._tcol="#000";
			else {
				div._tcol="#333";
				div.style.fontStyle="italic";
			}
			let mark = null;
			if (name.match(/\x20*__XMARK__\x20*$/)) {
				name = name.replace(/\x20*__XMARK__\x20*$/, "");
				mark = '&#10007;'
			} else if (name.match(/\x20*__CHECK__\x20*$/)) {
				name = name.replace(/\x20*__CHECK__\x20*$/, "");
				mark = '&#10003;'
			}
			namesp.innerHTML = name;
			check_menu_width(namesp);
			let gotsp;
			if (mark) {
				let sp = make('span');
				gotsp = sp;
				sp.innerHTML = mark;
				sp._fw="bold";
			}
			else if (namearr[1]){
				let sp = make('span');
				gotsp = sp;
				sp._tcol="#444";
				sp.style.fontStyle = "italic";
				sp.innerHTML = namearr[1];
				shortcut = sp;
			}
			if (gotsp){
				div._add(gotsp);
				check_menu_width(namesp);
			}
		}//»
		div.on = function(if_mouse) {//«
			if (curitem) curitem.off();
			div._bgcol = ACTIVE_MENU_BG;
			div._hold_tcol = div._tcol;
			div._tcol = ACTIVE_MENU_FG;
			if (shortcut) shortcut._tcol = ACTIVE_MENU_FG;
			curitem = div;
			curitem.scrollIntoViewIfNeeded();
			desk_menu = curitem.menu;
			curitem.menu.curitem = curitem;
		};//»
		div.off = function() {//«
			curitem = null;
			div._tcol = div._hold_tcol;
			div._bgcol="";
			if (shortcut) shortcut._tcol = "#444";
		};//»
		div.select = select;
		div.onclick = () => {//«
			if(self.kid) {
				delete_menus();
				div.on(true);
				return;
			}
			delete_menus();
			select();
		};//»
		div.onmouseenter = e => {//«
			if((desk_menu || elem.context_menu)!==self) return;
			if (curitem) {
				div.on(true);
				return;
			}
			delete_menus();
			div.on(true);
		};//»
		div.onmouseover=()=>{div.style.cursor="default";};
		kids.push(div);
		return div;
	}//»

	elem.context_menu = this;//«
//	this.type=type;
	this.menuElem = menu;
	this.parelem = elem;
	menu.onclick = noprop;
	menu.onmousedown = noprop;
	menu.ondblclick = noprop;
	menu.oncontextmenu = noprop;
	menu._z = CG_Z+1;
	menu.prevelem = prevelem;
//»
	document.body._add(menu);
}
this.ContextMenu = ContextMenu;
//»

//»

//Popup/Prompt«

//IGen«

const IGen=function() {

let fs;
let svg_open = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" ';

const make_popup_str = (which) => {//«
	let str = svg_open + ' width="64px" height="64px">';
	if (which == "alert") {
		str += '<path d="M 32.129316,4.1098389 A 1.9399015,1.9399015 0 0 0 30.558815,5.2119455 L 6.6155497,55.137373 a 1.9399015,1.9399015 0 0 0 1.7358178,2.782819 l 49.0437415,0 A 1.9399015,1.9399015 0 0 0 59.130927,55.10982 L 34.03045,5.1843928 a 1.9399015,1.9399015 0 0 0-1.708265,-1.0745539 1.9399015,1.9399015 0 0 0-0.192869,0 z" style="font-size:medium;font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;text-indent:0;text-align:start;text-decoration:none;line-height:normal;letter-spacing:normal;word-spacing:normal;text-transform:none;direction:ltr;block-progression:tb;writing-mode:lr-tb;text-anchor:start;baseline-shift:baseline;color:#000000;fill:' + ALERT_YELLOW + ';fill-opacity:1;stroke:' + ALERT_YELLOW + ';stroke-width:3.87899995;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none;marker:none;visibility:visible;display:inline;overflow:visible;enable-background:accumulate;font-family:Sans;-inkscape-font-specification:Sans"/>';
		str += '<g style="font-size:56px;font-style:normal;font-variant:normal;font-weight:bold;font-stretch:normal;text-align:start;line-height:125%;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:start;fill:#000;fill-opacity:1;stroke:none;font-family:Times New Roman">';
		str += '<path d="m 32.621634,45.333283 c-2.575997,0-4.704,2.184002-4.704,4.704 0,2.687997 2.016003,4.76 4.648,4.76 2.687997,0 4.816,-2.072003 4.816,-4.648 0,-2.631998-2.128003,-4.816-4.76,-4.816 m 0.784,-4.368 c 0.727999,-6.887994 1.232002,-9.632006 2.912,-15.008 0.783999,-2.463998 1.008,-3.584002 1.008,-4.872 0,-3.639997-1.736003,-5.712-4.704,-5.712-3.023997,0-4.76,2.072003-4.76,5.6 0,1.399998 0.224001,2.464002 1.008,4.984 1.623998,5.319994 2.184001,8.120006 2.912,15.008 l 1.624,0"/></g>';
	} else if (which == "error") {
		str += '<path d="M 12.826086,22.695652 0.62845029,34.752046-16.521739,34.652173-28.578133,22.454537-28.47826,5.304348-16.280624,-6.7520463 0.86956503,-6.6521733 12.925959,5.5454627 z" transform="matrix(1.349617,0,0,1.349617,42.340122,13.11007)" style="color:#000000;fill:#d42121;fill-opacity:1;fill-rule:nonzero;stroke:#c6c6c6;stroke-width:1.3996563;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none;stroke-dashoffset:0;marker:none;visibility:visible;display:inline;overflow:visible;enable-background:accumulate" />';
		str += '<text x="8.4782629" y="36.608696" xml:space="preserve" style="font-size:13px;font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;text-align:start;line-height:125%;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:start;fill:#ffffff;fill-opacity:1;stroke:none;font-family:Sans;-inkscape-font-specification:Sans">';
		str += '<tspan x="8.4782629" y="36.608696">ERROR</tspan></text>';
	} else if (which == "ok") {
		str += '<defs><filter color-interpolation-filters="sRGB" id="pu_FILTER"><feGaussianBlur stdDeviation="0.77384537" /></filter></defs>';
		str += '<rect width="58.038403" height="58.038403" rx="8.0885181" ry="8.1922169" x="3.4741683" y="3.2831869" style="color:#000000;fill:#42c129;fill-opacity:1;fill-rule:nonzero;stroke:#000000;stroke-width:1.45200002;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none;stroke-dashoffset:0;marker:none;visibility:visible;display:inline;overflow:visible;filter:url(#pu_FILTER);enable-background:accumulate" />';
		str += '<text x="16.18037" y="47.81963" xml:space="preserve" style="font-size:48px;font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;text-align:start;line-height:125%;letter-spacing:0px;word-spacing:0px;writing-mode:lr-tb;text-anchor:start;fill:#ffffff;fill-opacity:1;stroke:none;font-family:Times New Roman;-inkscape-font-specification:\"Times New Roman\"">';
		str += '<tspan x="15.18037" y="47.81963">&#x2713;</tspan></text>';
	}
	str += '</svg>';
	return [str];
};//»
const attach = (obj) => {
	let parelm = obj['PAR'];
	let type = obj['TYPE'];
	let idarg = obj['ID'];
	let subtype = obj['SUBTYPE'];
	let svgstr, svgelm;
	let retarr;
	retarr = make_popup_str(subtype);
	parelm.innerHTML = retarr.shift();
	return parelm;
};
this.attach = attach;

}

const igen = new IGen();

//»
let popup_link_col = "#009"
let popup_queue = [];
const make_func_span=(str,cb)=>{let sp=make('sp');if(str=="__BR__")str="<hr style='margin:0px;height:6px;visibility:hidden;'>";sp.html(str);if(cb){sp.ael('click',cb);sp._tcol=popup_link_col;sp.style.textDecoration="underline";sp.style.cursor="pointer";}return sp;}
const make_func_div=(all)=>{let div=make('div');for(let i=0;i<all.length;i++){let arr=all[i];if(typeof arr=="string")div._add(make_func_span(arr));else div._add(make_func_span(arr[0],arr[1]));}return div;}
this.pophuge=(str,opts={})=>{return make_popup({STR:str,VERYBIG:true,WIN:opts.win,TIT:opts.title,SEL:opts.SEL});}

const popinfo=(str,type)=>{return make_popup({'STR':str,'TYP':type,'INF':true});};this.popinfo = popinfo;
const popok = (str, opts={}) => {//«
//const popok = (str, timearg) => {
	make_popup({
		STR: str,
		TYP: "ok",
		TIME: opts.time,
		WIN: opts.win,
		TIT: opts.title,
		CB:opts.cb
	});
}
this.popok = popok;
api.popok=(str, opts={})=>{
	return new Promise((Y,N)=>{
		if (!opts.cb) opts.cb = Y
		popok(str, opts);
	});
};
//»
const poperr = (str, opts = {}) => {//«
	return make_popup({
		STR: str,
		TYP: "error",
		TIME: opts.time,
		WIN: opts.win,
		CB: opts.cb,
		TIT: opts.title,
		WIDE: opts.wide
	});
}
this.poperr = poperr;
api.poperr = (str, opts={})=>{
	return new Promise((Y, N) => {
		if (!opts.cb) opts.cb = Y;
		poperr(str, opts);
	});
}//»
const popup = (str, opts={}) => {//«
	return make_popup({
		TIT: opts.title,
		STR: str,
		SEL: opts.sel,
		WIN: opts.win,
		CB: opts.cb,
		WIDE: opts.wide
	});
}
this.popup=popup;
api.popup=(str, opts={})=>{
	return new Promise((Y,N)=>{
		if (!opts.cb) opts.cb = Y
		popup(str, opts);
	});
};
//»
this.popwide=(str,opts={})=>{opts.STR=str;opts.WIDE=true;return make_popup(opts);};
const popkey = (arr, cb, opts={}) => {//«
	let str="";
	let chars={};
	let ch;
	if (opts.alpha){
		str = arr;
		for (let i=65; i <= 90; i++){
			ch = String.fromCharCode(i);
			chars[ch] = i;
		}
		for (let i=97; i <= 122; i++){
			ch = String.fromCharCode(i);
			chars[ch] = i;
		}
	}
	else{
		for (let i = 0; i < arr.length; i++) {
			if (i<10) ch = String.fromCharCode(i + 48);
			else if (i<36) ch = String.fromCharCode(i-10 + 97);
			else if (i < 62) ch = String.fromCharCode(i-36 + 65);
			else break;
			str += ch + ")\xa0" + arr[i] + "<br>";
			chars[ch]=arr[i];
		}
	}
	return make_popup({
		'TIT': opts.title||"Choose one",
		'STR': str,
		'KEYS': chars,
		'CB': cb,
		WIN:opts.win		
	});
}
this.popkey=popkey;
api.popkey = (arr, opts = {}) => {
	return new Promise((Y, N) => {
		popkey(arr,Y,opts);
	});
}
//»
const popin = (str, cb, opts) => {//«
//const popin = (str, cb, deftxt, title) => {
	if (!str) str = " ";
	return make_popup({
		CANCEL:true,
		ONCANCEL:"",
		STR: str,
		INPUT: true,
		CB: cb,
		TXT: opts.deftxt,
		TIT: opts.title
	});
}
this.popin = popin;
api.popin = (str, opts = {}) => {
	return new Promise((Y, N) => {
		make_popup({
			STR: str,
			CANCEL:true,
			INPUT: true,
			CB: Y,
			TXT: opts.defTxt,
			TIT: opts.title,
			WIN: opts.win,
			PASSWORD: opts.password,
			enterOK: opts.enterOK
		});
	});
}
//»
const popwait = (str, cb, type) => {//«
	return make_popup({
		STR: str,
		TYP: type,
		CB: cb
	});
}
this.popwait=popwait;
api.popwait = (str, type)=>{
	return new Promise((y,n)=>{
		popwait(str,y,type);
	});
};
//»
//Keep this in since it might be useful later, but comment out to decrease the system parse/load time for now
//const popform=(arr,cb,title)=>{let table=make('table');let focuselm=null;for(let i=0;i<arr.length;i++){let tr=make('tr');let lab_td=make('td');lab_td.style.verticalAlign="top";let elm_td=make('td');let type=arr[i][0];let label=arr[i][1];let def=arr[i][2];let optarg=arr[i][3];let elm;if(type=="select"){if(!def)def=0;else def=parseInt(def);elm=make('select');elm.style.width="85";let list=optarg;for(let j=0;j<list.length;j++){let opt=make('option');opt.setAttribute('value',list[j]);if(j==def)opt.setAttribute("selected","true");opt.html(list[j]);elm._add(opt);}}else if(type=="field"){elm=make('span');elm.innerHTML=def;}else if(type=="check"){elm=make('input');elm.type="checkbox";if(def)elm.checked=true;elm.ael('click',e=>{setTimeout(()=>{elm.checked=!elm.checked;},1);});}else if(type=="text"){elm=make('input');elm.type="text";if(def)elm.setAttribute("placeholder",def);if(!focuselm)focuselm=elm;}else if(type=="textarea"){elm=make('textarea');elm.rows=6;elm.style.width=235;if(optarg)elm.setAttribute("maxlength",optarg);if(def)elm.setAttribute("placeholder",def);if(!focuselm)focuselm=elm;}elm.ael('mousedown',function(e){e.stopPropagation();});elm.setAttribute("name",label);lab_td.html(label+":");lab_td._tcol="#000";elm_td._add(elm);tr._add(lab_td);tr._add(elm_td);tr.elm=elm;table._add(tr);}return make_popup({'STR':table,'TYP':"form",'CB':cb,'TIT':title,'FOCUS':focuselm});};this.popform=popform;api.popform=(arr,title)=>{return new Promise((y,n)=>{popform(arr,y,title);});};

this.popcancel=(str,cb)=>{return make_popup({STR:str,CANCEL:true,CB:cb});}
const popyesno = (str, cb, if_rev) => {//«
	return make_popup({
		STR: str,
		TYP: "yesno",
		CB: cb,
		REV: if_rev
	});
}
this.popyesno = popyesno;
api.popyesno = (str, opts = {}) => {
	return new Promise((Y, N) => {
		make_popup({
			STR: str,
			TYP: "yesno",
			CB: Y,
			REV: opts.reverse,
			TIT: opts.title,
			WIN:opts.win,
			DEFNO: opts.defNo
		});
	});
}
//»
const poparea = (str_or_arr, title, if_rev_arr, cb, read_only, if_cancel, win) => {//«
	let arr;
	if (typeof str_or_arr == "string") arr = str_or_arr.split("\n");
	else arr = str_or_arr;
	if (if_rev_arr) arr = arr.reverse();
	let div = make('div');
//	div._h="100%";
	let area = make('textarea');
	area.value = arr.join("\n");
	area._bgcol="#211";
	area._tcol="#EEEEEE";
	area.style.outline = "none";
	area.id="prompt_textarea";
	if (read_only) {
		area.setAttribute("readonly", "1");
	}
	area._w="100%";
	area._h="95%";
//log(area);

	area._fs = 20;
	return make_popup({
		USEINPUT:area,
		'SEL': true,
		STR: area,
		'VERYBIG': true,
		'CB': cb,
		'TIT': title,
		CANCEL:if_cancel,
		WIN:win
	});
}
this.poparea=poparea;
this.popinarea=(tit, cb)=>{
	poparea("",tit,null,cb,false,true);
};
api.popinarea=(tit, opts={})=>{
	let if_can = true;
	if (opts.noCancel) if_can = false;
//	let read_only = fa;
//if (opts.readOnly) read
	return new Promise((y,n)=>{
//		poparea(str,tit,null,y,true,true, opts.win);
		poparea("",tit,null,y,opts.readOnly,if_can, opts.win);
	})
}
//»
const make_prompt = (str, def_text, cb, if_long) => {//«
	let isshort = true;
	if (if_long) isshort = null;
	make_popup({
		'STR': str,
		'ICO': true,
		'TXT': def_text,
		'CB': cb,
		'SHT': isshort
	});
}
this.make_prompt=make_prompt;
//»
const mkpopup_imgdiv = (type, use_img, if_big_img) => {//«
	let imgdiv = make('div');
	imgdiv._pos='absolute';
	let usedim = 64;
	if (if_big_img) usedim = 128;
	imgdiv._w = usedim;
	imgdiv._h = usedim;
	let usetype = type;
	if (!type || type == "form") usetype = "alert";
	else if (type == "yesno") usetype = "alert";
	if (use_img) {
		let img;
		if (use_img instanceof HTMLImageElement) img = use_img;
		if (img && img instanceof HTMLImageElement) {
			imgdiv.style.backgroundImage = "url(" + img.src + ")";
			imgdiv.style.backgroundPosition = "center center";
			imgdiv.style.backgroundRepeat = "no-repeat";
			imgdiv.style.backgroundSize = "contain";
		}
	} else {
		igen.attach({
			'PAR': imgdiv,
			'TYPE': "popup",
			"SUBTYPE": usetype
		});
	}
	return imgdiv
}//»
const do_links = elm=>{//«
	let lns = Array.from(elm.getElementsByTagName("a"));
	for (let ln of lns){
		let win;
		ln.onclick=e=>{
			e.preventDefault();
			e.stopPropagation();
			if (win&&!win.closed){
				win.focus();
				return;
			}
			win = window.open(ln.href, ln.href,`width=${window.outerWidth-100},height=${window.outerHeight-100}`)
		};      
		ln.onmousedown=(e)=>{
			e.preventDefault();
			e.stopPropagation();
		}       
		ln.oncontextmenu=e=>{
			e.stopPropagation();
		};
	}
};//»
const mkpopup_tdiv = (str, opts={}) => {//«
	let w = opts.WIN;
	let text_fs = opts.FS;
	let if_big_img = opts.BIGIMG;
	let selectable = opts.SELECTABLE;
	let if_verybig = opts.VERYBIG;
	let if_systerm = opts.SYSTERM;
	let tdiv = make('div');
	if (selectable) {
		tdiv.style.userSelect = "text";
		tdiv.ael('mousedown', function(e) {
			e.stopPropagation()
		});
	}
	else no_select(tdiv);
	if (text_fs) tdiv._fs = text_fs;
	else tdiv._fs = 18;
//	if (!(opts.NOBOLD||if_systerm)) tdiv._fw="bold";
	
	tdiv._tcol="#eee";
	tdiv._pos='absolute';
    tdiv._bor= "0px solid transparent";
	let usex = 109;
	if (if_big_img) usex += 64;
	tdiv._loc(usex, 37);
	if (if_verybig) {
		tdiv._bor="1px dotted #333";
		tdiv.classList.add("scroller");
		tdiv._overy="auto";
		if (w){
			tdiv._w = w._gbcr().width - (20 + 134);
			tdiv._h = w._gbcr().height - (35 + 79);
		}
		else{
			tdiv._w = winw() - (20 + 134);
			tdiv._h = winh() - (35 + 79);
		}
	} else {
		tdiv._overy="auto";
		tdiv._w = opts.WIDTH - 134;
		tdiv._h = 75;
	}
	tdiv._overx="hidden";
	if (str) {
		if (typeof str == "string") {
			tdiv.style.overflowWrap = "break-word";
			tdiv.innerHTML=str;
		} 
		else if (str instanceof HTMLElement) tdiv._add(str);
		do_links(tdiv);
	}
//log(tdiv);
	tdiv.tabIndex="-1";
//setTimeout(()=>{
//	tdiv.focus();
//},100);
	return tdiv;
}//»
const make_popup = (arg) => {//«
	const popup_dequeue = () => {//«
		make_popup(_popup_queue.shift());
	}//»
	const mkbut=(txt, if_active)=>{//«
		let d = mkdv();
//		d.tabIndex=""+(cur_tab_index++);
		d.onfocus=()=>{
			d._fw="bold";
			d._bgcol="#ccf";
		}
		d.onblur=()=>{
			d._fw="";
			d._bgcol="#aaa";
		}
		d.style.textAlign="center";
		d._fs=14;
		d._tcol="#000";
		d.innerText=txt;
		d._bor="1px solid #ccc";
		d._bgcol="#aaa";
		d.onmousedown=()=>{d._bor="1px dotted #ccc";};
		d.onmouseup=()=>{d._bor="1px solid #ccc";};
		d.onmouseout=()=>{d._bor="1px solid #ccc";};
		d._w=68.46;
		d.type = "popup_button";
		if (if_active) active_button = d;
		return d;
	}//»
	const do_cancel = ()=>{//«
		div._del();
		if (win) delete win.popup;
		else{
			CG.off();
			CPR = null;
		}
		if (cb) {
			if ('ONCANCEL' in arg) cb(arg.ONCANCEL);
			else cb(false);
		}
		if (!win){
			if (_popup_queue.length) popup_dequeue();
			else if (holdwin) holdwin.on();
		}
	};//»
	const nopropdef=(e)=>{//«
		e.stopPropagation();
		e.preventDefault();
	};//»
	const noprop=(e)=>{
		e.stopPropagation();
	};
	let cur_tab_index = 1;
	let active_button;
	let win = arg.WIN;
	let _popup_queue = popup_queue;
	if (!win) {
		if (CPR && CPR !== true) {
			_popup_queue.push(arg);
			return;
		}
	}
	let choices;
	let no_buttons;
	let if_cancel, if_input, if_password;
	let if_systerm;
	let expires;
	let if_rev, title, str, type;
	let res_text, cb, if_short, if_info;
	let text_fs;
	let verybig;
	let big_img, use_img, caption, selectable;
	let keys, timer;
	let oktxt, cantxt;
	let comp_keydown;
	let div = make('div');
	div.id="system_prompt";
	let butdiv = make('div');
	let cancel_button_div;
	let okbutdiv;
	butdiv._pos="absolute";
	butdiv._b=0;
	butdiv._r=0;
	butdiv._mar=5;
	div._add(butdiv);
	div._fs=18;
	div.style.userSelect = "none";
	div.style.boxShadow = prompt_boxshadow;
	if (document.activeElement) document.activeElement.blur();
	if (typeof arg == "string") {
		str = arg;
		type = typearg;
	} else if (typeof arg == "object") {
		str = arg.STR || arg.DIV;
		if_cancel = arg.CANCEL;
		verybig = arg.VERYBIG;
		oktxt = arg.OKTXT;
		cantxt = arg.CANTXT;
		caption = arg.CAP;
		text_fs = arg.FS;
		use_img = arg.IMG;
		big_img = arg.BIGIMG;
		if_input = arg.INPUT;
		if_password = arg.PASSWORD;
		res_text = arg.TXT;
		cb = arg.CB;
		if_short = arg.SHT;
		if_info = arg.INF;
		title = arg.TITLE || arg.TIT;
		timer = arg.TIME;
		expires = arg.EXP;
		keys = arg.KEYS;
		if_rev = arg.REV;
		selectable = arg.SEL;
		type = arg.TYPE || arg.TYP;
		no_buttons = arg.NOBUTTONS;
	} else if (arg) str = arg;
	if (!str) str = "";
	if (typeof str == "object" && typeof str.length == "number") str = make_func_div(str);
	else if (typeof str == "string") str = str.replace(/__BR__/g, "<hr style='margin:0px;height:6px;visibility:hidden;'>");
//	if (str instanceof HTMLElement) div.htelem = str;
	let usewid = 420;
	if (big_img||arg.WIDE) usewid += 64;
	let def_text_h = 75;
	let def_h = arg.HEIGHT||154;
	if (big_img) def_h += 32;
	if (arg.WIDTH) usewid = arg.WIDTH;
	else if (if_short) usewid = 275;
	else if (verybig) {
		if (win){
			usewid = win._gbcr().width-20;
			def_h = win._gbcr().height-35;
		}
		else{
			usewid = winw() - 20;
			def_h = winh() - 35;
		}
		def_text_h = def_h - 79;
	}
	let holdwin;
	if (!win) {
		holdwin = CWIN;
		if (holdwin) holdwin.off();
	}
	if (keys) {
		if (keys == "__ANY__") div.keys = true;
		else div.__keys = keys;
	}
	if (win) {
		win.popup=div;
		div._z=10000000;
		win._add(div);
	}
	else document.body._add(div);
	
	div.ael('dblclick', e => {
		e.stopPropagation()
	});
	if (cb) div.cb = cb;
	div.nosave = true;
	div._w = usewid;
	div._h = def_h;
//	div._bgcol="#fff";
	div._bgcol=WIN_COL_OFF;
//	div._tcol="#ccc";
	div._pos='absolute';
	if (!win) {
		div._z = 10000000;
		if (CG) CG.on();
		CPR = div;
	}
	let bar = make("div");
	bar.type = "prompt";
	bar.style.borderBottom = "1px solid #515151";
	bar._pos="absolute";
	bar._h = 21;
	bar._w = usewid;
	if (title) {
		bar.style.textAlign = "center";
		bar._fw="bold";
		bar._fs="16px";
		bar._padt = 4;
		bar._tcol="#bbb";
		bar.innerHTML = title;
	}
	bar._bgcol="#171717";
	div._add(bar);
	let imgdiv = mkpopup_imgdiv(type, use_img, big_img);
	imgdiv._x = 25;
	div._add(imgdiv);
	imgdiv._y = div.offsetHeight / 2 - imgdiv.offsetHeight / 2;
	if (caption) {
		let capdiv = make('div');
		capdiv._tcol="#000";
		capdiv._pos='absolute';
		capdiv._loc(25, 100);
		capdiv.innerHTML = caption;
		capdiv.style.textAlign = "center";
		div._add(capdiv);
		let wid = capdiv.offsetWidth;
		if (wid > 64) {
			let diffx = (wid - 64) / 2;
			if (diffx < 25) capdiv._x = 25 - diffx;
			else capdiv._x = 0;
		}
	}
	let tdiv = mkpopup_tdiv(str, {
		NOBOLD: arg.NOBOLD,
		WIDTH: usewid,
		WIDE: arg.WIDE,
		FS: text_fs,
		BIGIMG: big_img,
		SELECTABLE: selectable,
		VERYBIG: verybig,
		SYSTERM: if_systerm,
		WIN:win
	});
	if (str instanceof HTMLElement) div.htelm = str;
	div.messdiv = tdiv;
	div._add(tdiv);

	okbutdiv = make('div');
	okbutdiv._dis="inline-block";
	let input;
	if (if_input||arg.USEINPUT) {
		if (arg.USEINPUT) {
			input = arg.USEINPUT;
//			butdiv._add(okbutdiv);
		}
		else {
			input = make('input');
			if (res_text) input.value = res_text;
			if (if_password) input.type="password";
			else input.type = "text";
			if (if_short) input._w = 140;
			else input._w = 250;
			input._h = 20;
			tdiv._add(make('br'));
			tdiv._add(input);
		}
		input.tabIndex = ""+(cur_tab_index++);
		input.ael('mousedown', e => {
			e.stopPropagation();
		});
		setTimeout(() => {
			input.focus();
			input.select();
		}, 1);
		div.res_input = input;
	}
	else if (if_cancel) okbutdiv = null;
	let useok = "OK";
	if (oktxt) useok = oktxt;
	else if (type == "yesno") {
		useok = "YES";
	}
	if (okbutdiv) okbutdiv._add(mkbut(useok, true));
	div.ok_button = okbutdiv;
	if (keys||no_buttons) {
		okbutdiv._op = 0;
		div.inactive = true;
	}
	const ok_cb = () => {//«
		div._del();
		delete div.active;
		if (input && input.matchdiv) input.matchdiv._del();
		if (!win&&CG) CG.off();
		if (comp_keydown) document.removeEventListener('keydown', comp_keydown);
		if (type == "form") {
			let rows = div.htelm.childNodes;
			let retobj = {};
			for (let i = 0; i < rows.length; i++) {
				let elm = rows[i].elm;
				if (elm.type == "checkbox") retobj[elm.name] = elm.checked;
				else retobj[elm.name] = elm.value;
			}
			if (cb) cb(retobj);

			if (win) {
				delete win.popup;
				if (win===CWIN&&win.app&&win.app.onfocus) {
					win.app.onfocus();
					if (win.isScrollable) {
cwarn("win.isScrollable test passed: WOPMKLYTG");
						win.main.focus();
					}
				}
			}
			else CPR = null;
			return;
		}
		if (div.timer) clearTimeout(div.timer);
		if (div.cb) {
			if (div.res_input) div.cb(div.res_input.value);
			else {
				if (div.__keys) {
					if (div.choices) div.cb(div.choices[div.keyok]);
					else div.cb(div.keyok);
				}
				else {
					div.cb(true);
				}
			}
		}
		if (win) {
			delete win.popup;
			if (win===CWIN&&win.app&&win.app.onfocus) {
				win.app.onfocus();
				if (win.isScrollable) {
cwarn("win.isScrollable test passed: WPMKIYTGH");
					win.main.focus();
				}
			}
		}
		else {
			CPR = null;
			if (_popup_queue.length) {
				CPR = true;
				popup_dequeue();
			} else if (holdwin) holdwin.on();
		}
	};//»
	div.ok = ok_cb;
	div.enterOK = arg.enterOK;
	if (!no_buttons) okbutdiv.ael('click', ok_cb);
	if (expires || timer) {
		if (expires) {
			timer = expires - now();
			if (timer < 0) timer = 0;
		}
		let timerdiv = make('div');
		timerdiv._pos='absolute';
		timerdiv._loc(1, 1);
		timerdiv._w = 1;
		timerdiv._h = 1;
		timerdiv._op = 0;
		div._add(timerdiv);
		div.timeoutdiv = timerdiv;
		timerdiv.ael('click', e => {
			e.stopPropagation();
			div._del();
			delete div.active;
			if (!win) CG.off();
			if (comp_keydown) document.removeEventListener('keydown', comp_keydown);
			if (div.cb) div.cb();

			if (win) delete win.popup;
			else{
				CPR = null;
				if (_popup_queue.length) {
					CPR = true;
					popup_dequeue();
				} else if (holdwin) holdwin.on();
			}
		});
		div.timer = setTimeout(_ => {
			if (!win) div.timeoutdiv.click();
			else if (CWIN && CWIN.popup === div) CWIN.popup.timeoutdiv.click();
		}, parseInt(timer));
	}
	if (if_cancel || type == "form" || type == "yesno" || cantxt) {
		cancel_button_div = make('div');
		cancel_button_div._dis="inline-block";
		cancel_button_div._marl=10;
		let usecan = "CANCEL";
		if (cantxt) usecan = cantxt;
		else if (type == "yesno") {
//			if (if_rev) usecan = "YES";
//			else usecan = "NO";
			usecan = "NO";
		}
		cancel_button_div.ael('click', () => {
			do_cancel();
		});
//		butdiv._add(cancel_button_div);
		if (!if_input && !arg.USEINPUT && if_cancel) {
			cancel_button_div._add(mkbut(usecan, true));
			div.cancel_only = true;
		} else {
			cancel_button_div._add(mkbut(usecan, false));
		}
		div.cancel_button = cancel_button_div;
	}
	div.cancel = do_cancel;

	if (verybig){}
	else if (tdiv.scrollHeight > def_text_h) {
		let hdiff = tdiv.scrollHeight - def_text_h;
		let tot_h = window.innerHeight;
		let hi_h = def_h + hdiff + 20;
		if (hi_h <= tot_h) {
			div._h = def_h + hdiff + 5;
			tdiv._h = def_text_h + hdiff+5;
			center(div);
		} else {
			div._h = tot_h - 20;
			tdiv._h = (tot_h - 20) - (def_h - def_text_h);
			center(div);
		}
		div._y = div._y - 17;
	}

let butdiv1, butdiv2;
if (okbutdiv && cancel_button_div){
	if (if_rev) {
		butdiv1 = cancel_button_div;
		butdiv2 = okbutdiv;
	}
	else{
		butdiv1 = okbutdiv;
		butdiv2 = cancel_button_div;
	}
}
else if (okbutdiv) butdiv1 = okbutdiv;
else if (cancel_button_div) butdiv1 = cancel_button_div;
if (butdiv1) {
	butdiv._add(butdiv1);
	butdiv1.childNodes[0].tabIndex=""+(cur_tab_index++);
}
if (butdiv2) {
	butdiv._add(butdiv2);
	butdiv2.childNodes[0].tabIndex=""+(cur_tab_index++);
}
	if (input){}
	else if (arg.FOCUS) arg.FOCUS.focus();
	else if (butdiv1) setTimeout(()=>{butdiv1.childNodes[0].focus();},10);

	if (!win) center(div);
	else center(div, win);
	div.active = true;
	return div;

}//»

this.make_popup = make_popup;
NS.api.wdg=api;
NS.api.widgets=api;
globals.api.wdg = api;
//»

}//»

const WDG = new Widgets();//«
globals.widgets = WDG;
const{popup:_popup,poperr:_poperr,popok:_popok,make_popup:_make_popup}=WDG;
const WDGAPI = NS.api.widgets
const{popwait, popyesno} = WDGAPI;
const popup=(s,opts)=>{_popup(s,opts);};
const poperr=(s,opts)=>{_poperr(s,opts);};
const popok=(s,opts)=>{_popok(s,opts);};
const make_popup = arg=>{return _make_popup(arg);};
//»

//»
//Saving«

//Called via "real/outer" OS file drop event(ChromeOS,Windows,etc)
const save_dropped_files = (e, where) => {//«
/*Reading folders doesn't work!«
function traverseFileTree(item, path) {
  path = path || "";
  if (item.isFile) {
    // Get file
    item.file(function(file) {
      console.log("File:", path + file.name);
    });
  } else if (item.isDirectory) {
    // Get folder contents
    var dirReader = item.createReader();
    dirReader.readEntries(function(entries) {
      for (var i=0; i<entries.length; i++) {
        traverseFileTree(entries[i], path + item.name + "/");
      }
    });
  }
}


  var items = e.dataTransfer.items;
  for (var i=0; i<items.length; i++) {
    // webkitGetAsEntry is where the magic happens
    var item = items[i].webkitGetAsEntry();
log(item);
    if (item) {
      traverseFileTree(item);
    }

  }
return;
»*/
return new Promise(async(y,n)=>{
	let usepath = where.fullpath;
	let usepos={X:e.clientX+desk.scrollLeft,Y:e.clientY+desk.scrollTop,};
/*«
	if (!where) {
		usepath = DESK_PATH;
	}
	else usepath = where.fullpath;
»*/
	let files = fs.event_to_files(e);
	let iter = -1;
	let dofile = async() => {
		iter++;
		if (iter >= files.length) return y();
		let f = files[iter];
		if (!(f && f.name)) return dofile();
		let filesaver = new fs.FileSaver();
		filesaver.set_cb("error", mess => {
cerr(mess);
			dofile();
		});
		let parobj = await filesaver.set_cwd(usepath);
		if (!parobj) return dofile();
		let nameret = await filesaver.set_filename(f.name);
		if (!nameret) return dofile();
		const writer_func = async(r3, errmess) => {//«
			if (!r3) {
				if (errmess) {
					cwarn(errmess);
				}
				return dofile();
			}
			let fObj = r3;
			let parts = getNameExt(nameret);
			let ext = parts.pop();
			let fname = parts.pop();
			let curicon = await make_icon(fname, where, {pos: usepos, ext: ext, node: fObj});
			curicon.disabled=true;
			curicon.addOverlay();
			let odiv = curicon.overdiv;
			odiv.innerHTML = "0%";
			curicon.cancel_func = () => {
				fObj.unlockFile();
			};
			filesaver.set_cb("update", per => {
				odiv.innerHTML = per + "%";
			});
			filesaver.set_cb("done", () => {
				if (odiv.context_menu) odiv.context_menu.kill();
				curicon.activate();
				fObj.unlockFile();
				dofile();
			});
			filesaver.save_from_file(f);
		};//»
		filesaver.set_fent(writer_func);
	};
	dofile();
});


}
//»

//Opens a folder in "Save As..." mode
api.saveAs=(win, ext)=>{//«
//api.saveAs=(win, val, ext)=>{
return new Promise(async(Y,N)=>{
open_file_by_path(globals.home_path, {
//DWEUNFKL
	WINARGS: {BOTTOMPAD: SAVEAS_BOTTOM_HGT},
	SAVER:{
		ext, 
		folderCb: fwin=>{
			win.cur_save_folder = fwin;
		},
		cb:async (fwin, savename)=>{//«
			if (!fwin){
				win.cur_save_folder = null;
				Y({});
				return;
			}
			Y({path: fwin.fullpath, name: savename});
			fwin.forceKill();
		}//»
	}

});

});

};//»

//»
//«Context Menu
const set_context_menu = (loc, opts={}) => {//«
	CG.on();
	let dx = 0;
	let usex = loc.X - winx();
	let usey = loc.Y - winy();
	if (usex + 200 > winw()) dx = usex + 200 - winw();
	desk_menu = new WDG.ContextMenu({
		X: usex-dx,
		Y: usey,
		BREL:opts.BREL,
		RREL:opts.RREL
	});
	let items = opts.items || get_desk_context();
	for (let i = 0; i < items.length; i += 2) {
		desk_menu.add_item(items[i], items[i + 1]);
	}
	desk_menu.adjust_y();
	return desk_menu;
};
this.set_context_menu=set_context_menu;
//»
const get_desk_context=()=>{//«
	let menu = DESK_CONTEXT_MENU.slice();
	if (globals.read_only) {
		menu.shift();
		menu.shift();
	}
	let apps_arr = globals.APPLICATIONS_MENU;
	let apps_menu = [];
	menu.unshift('Applications', apps_menu);
	for (let i=0; i < apps_arr.length; i+=2){
		apps_menu.push(apps_arr[i]);
		let app = apps_arr[i+1];
		if (isStr(app)) apps_menu.push(()=>{open_app(app)});
		else apps_menu.push(app);
	}
	return menu;
};//»
//»
//Util«

const NOOP=()=>{}
window.onblur=(e)=>{//«
	for (let w of get_all_windows()){
		if (w.app && w.app.onwinblur) w.app.onwinblur();
	}
};//»
window.onfocus=(e)=>{//«
	for (let w of get_all_windows()){
		if (w.app && w.app.onwinfocus) w.app.onwinfocus();
	}
};//»

const set_workspace_num = which => {//«
	workspace_num_div.innerHTML=`${which+1}`;
	workspace_num_div.title = `Current workspace: ${which+1}\nCtrl+Alt+Shift+[1-${num_workspaces}]\nto switch workspaces`;
};//»
const check_for_desktops_in_other_tabs=()=>{//«
	if ('BroadcastChannel' in window) {
		let syschan;
		syschan = new BroadcastChannel("system");
		syschan.postMessage("init:"+FS_PREF);
		syschan.onmessage = e=>{
			let mess = e.data;
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
	}
	else{
cwarn("No BroadcastChannel! Cannot ensure system integrity!!!");
	}
};//»
const focus_editing=e=>{//«
	if(e)nopropdef(e);
	if(CEDICN){
		CEDICN._namearea.focus();
	}
}//»
const make_mode_dom = str => {//«
	let d = mkdv();
	d._z=-1;
	d._ta="center";
	d.style.userSelect="none";
	d._bgcol=BEWARE_RED;
	d._tcol="#eee";
	d.innerText=str;
	d._fs=32;
	d._fw=900;
	d._padb=10;
	desk._add(d);
}//»
const check_rs_timer = () => {//«
	if (rs_timer) clearTimeout(rs_timer);
	rs_timer = setTimeout(() => {
		rs_timer = null;
		if (!CWIN) return;
		CWIN.resize();
	}, RS_TIMEOUT);
}//»
const show_overlay=(str)=>{//«
	if (str.length > MAX_OVERLAY_LENGTH) str = str.slice(0,MAX_OVERLAY_LENGTH)+"...";
	overlay.innerText = str;
	if (overlay_timer) clearTimeout(overlay_timer);
	else desk.appendChild(overlay);
	center(overlay, desk);
	overlay_timer = setTimeout(()=>{
		overlay_timer = null;
		overlay._del();
	}, OVERLAY_MS);
};
api.showOverlay = show_overlay;
//»
const winx=()=>{return 0;};
this.winx=winx;
const winy=()=>{return 0;};
this.winy=winy;
const winw=()=>{return window.innerWidth;}
this.winw = winw;
const winarea = ()=>{return window.innerWidth * window.innerHeight;};
const winh = (if_no_taskbar) => {//«
	if (taskbar_hidden||if_no_taskbar) return window.innerHeight;
	return window.innerHeight - taskbar.taskbarElem.getBoundingClientRect().height;
}
this.winh = winh;//»
const get_desk_grid=()=>{DESK_GRID_W=Math.floor((winw()-desk_grid_start_x)/IGSX);DESK_GRID_H=Math.floor((winh()-desk_grid_start_y)/IGSY);};
const toggle_cursor = () => {//«
	if (cur_showing) CUR.off(true);
	else CUR.on(true);
};//»
const FATAL=s=>{throw new Error(s)};
const z_compare=(a,b)=>{if(pi(a.style.zIndex)<pi(b.style.zIndex))return 1;else if(pi(a.style.zIndex)>pi(b.style.zIndex))return-1;return 0;};
const gbid=(id)=>{return document.getElementById(id)}
const pi=x=>{return parseInt(x, 10)}
const noprop=e=>{e.stopPropagation()}
const nopropdef=e=>{e.preventDefault();e.stopPropagation()}
const no_select=(elm)=>{elm.style.userSelect="none"}


//»
//Keyboard«

const handle_ESC = (if_alt) => {//«
	window.getSelection().removeAllRanges();
	body.style.cursor = "default";
	desk.style.cursor = "default";
	DDIE = null;
	DDD._loc(-1, -1);
	DDD._w= 0;
	DDD._h = 0;
	WDIE = null;
	CDICN = null;
	clear_drag_resize_win();
	cldragimg(true);
	CG.off();
	if (taskbar.switcherIsOn()) return taskbar.switcherOff();
	if (ICONS.length) return icon_array_off(17);
	if (windows.layout_mode) return toggle_layout_mode();
	if (windows_showing) toggle_show_windows();
};//»

/*
//This is all an abstraction
const KEYSYM_MAP={//«
	f_A:{"n":"fullscreen_window"},
	d_CA:{"n":"make_folder"},
	f_CA:{"n":"make_file"},
	"`_A":{"n":"window_cycle"},
	x_A:{"n":"close_window"},
	m_A:{"n":"maximize_window"},
	d_A:{"n":"toggle_desktop"},
	l_CA:{"n":"toggle_layout_mode"},
	w_CA:{"n":"toggle_win_chrome"},
	n_A:{"n":"minimize_window"},
	"b_A":{"n":"toggle_taskbar"},
	t_A:{n:"open_terminal"},
	e_A:{n:"open_explorer"},
	h_A:{n:"open_help"},
};//»
const KEYSYM_FUNCS = {//«
focus_desktop:()=>{let w=CWIN;if(w&&(w.isFullscreen||w.isMaxed))return;CWIN&&CWIN.off();CUR.todesk();},
make_folder,
make_file,
toggle_taskbar,
open_terminal,
open_help,
toggle_win_chrome:()=>{CWIN&&CWIN.toggleChrome()},
toggle_layout_mode:toggle_layout_mode,
save_window:()=>{let w=CWIN;if(!w||w.isMinimized)return true;w.app.onsave();return true;},
delete_selected_files: ()=>{return delete_selected_files();},
window_cycle: ()=>{return window_cycle();},
reset: ()=>{return handle_ESC();},
toggle_desktop: ()=>{return toggle_show_windows();},
close_window: ()=>{
	if (!CWIN) return;
	if (check_cwin_owned()) return;
	CWIN.close();
},
fullscreen_window: ()=>{CWIN&&CWIN.fullscreen()},
minimize_window: ()=>{CWIN&&CWIN.minimize()},
maximize_window: ()=>{CWIN&&CWIN.maximize();},
popmacro:()=>{WDG.popmacro();return true;},
//reload_app_window:()=>{return win_reload(CWIN)},
reload_desk_icons:reload_desk_icons_cb,
open_explorer: open_home_folder,
open_root_folder:()=>{
open_file_by_path("/")
},
open_app:(name,if_force)=>{open_app(name||"None",{force: if_force});},
}//»
*/

//«Detect if all keys are up
const KEYS_PRESSED={};
//This fails if window focus changes between keydown and keyup events
let last_keyup = Date.now();;
//If there is a key down, return 0
//Otherwise, return the ms since the last keyup event
const all_keys_up=()=>{
if (Object.keys(KEYS_PRESSED).length===0) return Date.now() - last_keyup;
return 0;
};
api.allKeysUp=all_keys_up;
//»
const dokeydown = function(e) {//«
	KEYS_PRESSED[e.key] = true;
	const p = ()=>{e.preventDefault();};
const check_input = ()=>{//«
	if (cwin && !text_inactive) return true;
	return false;
};//»
	const check_prompt=cpr=>{//«
		if (cpr.key_handler) {
			if (kstr == "ENTER_A") kstr = "ENTER_";
			else return cpr.key_handler(kstr, e, false, code, mod_str);
		}
		let okbut;
		let canbut = cpr.cancel_button;
		if (cpr.cancel_only) okbut = canbut;
		else okbut = cpr.ok_button;

		const clickok = () => {//«
			okbut.click();
		};//»
		if (okbut) {//«
			let keys = cpr.__keys;
			if (keys) {//«
				if (kstr != "ESC_" && (keys === true)) cpr.keyok = true;
				if (kstr != "ESC_") {
					if (keys === true) cpr.keyok = true;
					else {
						if (kstr.match(/_S$/)) {
							if (kstr==="_S") return;
							let ch = String.fromCharCode(kstr[0].charCodeAt()-32);
							cpr.keyok = keys[ch];
						}
						else cpr.keyok = keys[kstr[0]];
					}
				}
				if (cpr.keyok) clickok();
//				return clickok();
			}//»
			else if ((kstr == 'ENTER_') || (kstr == "ESC_" && cpr.inactive)) {
				if (kstr=="ENTER_"){
					if (!text_inactive && (act instanceof HTMLTextAreaElement) && !act._noinput) return;
					e.preventDefault();
					if (cpr.enterOK) return clickok();
					if (act.type=="popup_button") return act.click();
				}
			}
		}//»
		if (canbut&&kstr=="ESC_") return canbut.click();
		if (kstr=="a_C"){//«
			if (cpr.messdiv.style.userSelect=="text") document.getSelection().selectAllChildren(cpr.messdiv);
		}//»
		else if (kstr=="c_C"){//«
			if (cpr.messdiv.style.userSelect=="text") {
				document.execCommand("copy")
				window.getSelection().removeAllRanges();
			}
		}//»
		else if (kstr==="ESC_"){//«
			if (cpr.cancel) cpr.cancel();
		}//»

	};//»
	const wasd={//«
		w:'U',
		a:'L',
		s:'D',
		d:'R'
	};//»
	const CUR_KSYMS=["LEFT_","RIGHT_","UP_","DOWN_","LEFT_C","RIGHT_C","UP_C","DOWN_C","ENTER_","ENTER_A","ENTER_CA","ENTER_C","SPACE_"];
//Var«
	let marr;
	let cwin = CWIN;
	let is_full;
	let is_max;
	let cobj;
	let overrides;
	if (cwin) {
		cobj = cwin.app;
	}

	let cpr = CPR;
	let code = e.keyCode;
	let mod_str = "";
	let chr, kstr;
	let act = document.activeElement;
	let act_type = null;
	if (act) act_type = act.type;
	let usecwin;
	let text_inactive = true;
	if (e.ctrlKey) mod_str = "C";
	if (e.altKey) mod_str += "A";
	if (e.shiftKey) mod_str += "S";
	chr = KC[code];
	kstr = chr + "_" + mod_str;
	e._sym = kstr;
//»
	if (PREV_DEF_ALL_KEYS) {//«
		if (e.altKey||e.ctrlKey) e.preventDefault();
	}//»
	if (debug_keydown) {//«
		log(kstr, e.keyCode, e.code, e);
	}//»

//Prevent the default behaviour of these shortcuts//«
	const notext_prevdef={
		BACK_: 1,
		a_C:1
	};
	if (ALWAYS_PREVENT.includes(kstr)) e.preventDefault();
	if (act && act_type && act_type.match(/^(text|password|number)/)) text_inactive = false; 
//An active textarea is not considered as "text"
	if (text_inactive && notext_prevdef[kstr]) {
		e.preventDefault();
	}

//»

//If there is a system prompt, it takes precedence over everything below.
	if (cpr) return check_prompt(cpr);
/*What is the "click guard", and how does it relate to the following conditions???//«
I'm pretty sure it is only activated when there is an icon's name being edited,
or when there is an active context menu.
//»*/
//We have an icon with a <textarea> whose name is being created or updated
	if (CEDICN) {//«
		if (act !== CEDICN._namearea) CEDICN._namearea.focus();

		if (kstr == "ESC_"){
			if (CEDICN.nodelete) {
				CEDICN.nodelete = undefined;
				CEDICN._namearea.value = CEDICN.name;
				save_icon_editing();
			}
			else {
				if (CEDICN.parWin._save_escape_cb) CEDICN.parWin._save_escape_cb();
				CEDICN.del();
				CEDICN = null;
			}
			CG.off();
		}
		else if (kstr == 'ENTER_') {
			save_icon_editing();
		}
		else if (kstr=="TAB_")e.preventDefault();
		return;
	}//»
//Enter key selects a menu option or unminimizes a window
	else if (kstr == "ENTER_") {//«
		if (desk_menu) return desk_menu.select();
		else if (cwin && cwin.context_menu) return cwin.context_menu.select();
		else if (cwin && cwin.isMinimized) {
			return cwin.unminimize();
		}
	}//»
//Direction keys to navigate the current context menu
	else if (kstr == "LEFT_" || kstr == "RIGHT_" || kstr == "UP_" || kstr == "DOWN_") {//«
		if (desk_menu) return desk_menu.key_handler(e, kstr);
		else if (cwin && cwin.context_menu) return cwin.context_menu.key_handler(e, kstr);
	} //»
//We have a context menu on the desktop. Kill it with Escapes, or bail out.
	else if (desk_menu) {//«
		if (kstr == "ESC_") desk_menu.kill();
		return;
	}//» 
//If there's a click guard, don't window escape things below.
	else if (CG.style.display == "block") {//«
//This branch is reached during window cycling "`_A"
//The click guard is also activated when moving icons and reloading icons.
//I don't know if this is necessary, though, if we just deactivate the icons
//that we want to be inactive (by adding a .disabled property).
	}//»
//Escape and a focused window
	else if (kstr == "ESC_" && cwin) {//«
		if (taskbar.switcherIsOn()) return taskbar.switcherOff();
		if (windows.layout_mode) return toggle_layout_mode();
		if (cwin.context_menu) {
			cwin.context_menu.kill();
			return 
		}
		if (!cwin.isMinimized && cobj && cobj.onescape && cobj.onescape()) return;
		if (cwin.appName==FOLDER_APP && ICONS.length){
			icon_array_off(12);
			return;
		}
		cwin.off();
		return;
	}//»
//A "soft escape", use on a window means its escape handler is not called
	else if (kstr==="ESC_A"&&cwin){//«
//This is really just useful for folders that need to keep their
//active icon arrays still active so that icons can be moved to the
//desktop via the keyboard.
		cwin.off();
		CUR.todesk();
		return;
	}//»

//Issues with arrow keys (like moving the text carat and highlighting the text)
//«
	if (cwin) {
		if (!text_inactive) {
			if (code >= 37 && code <= 40 && (mod_str == "S" || mod_str == "CS")) e.preventDefault();
		}
	} else {
		if (code >= 33 && code <= 40 && text_inactive) e.preventDefault();
	} 
//»

//Open context menu of selected icon, desktop or current window

//Desktop and folder specific functions dealing with icons or the icon cursor:
	if (!cwin || cwin.appName==FOLDER_APP){//«
		if (kstr == "c_A") {//«
			let curicon;
			if (CUR.ison()) curicon = CUR.geticon();
			if (curicon || ICONS.length===1){
				let useicon;
				if (curicon) useicon = curicon;
				else {
					let icn = ICONS[0];
					if (!desk.contains(icn.iconElem)){
cwarn("There was an unattached icon in ICONS!");
						icon_array_off(13);
						return;
					}
					useicon = icn;
				}
				let rect = useicon.iconElem._gbcr();
				useicon.wrapper.oncontextmenu({clientX: rect.left, clientY: rect.top, isFake: true});
			}
			
			else if (!cwin) {
				set_context_menu({X:0,Y:(taskbar_hidden?0:taskbar.taskbarElem.clientHeight+3)},{BREL:true});
				return;
			}
			else if (cobj && cobj.get_context) {
				if (!(cobj.overrides && cobj.overrides["c_A"])) {
					cwin.contextMenuOn();
					return;
				}
			}
		}//»
		if (cwin && cwin.saver && kstr.match(/^TAB_S?$/)){
			e.preventDefault();
			cobj.onkeydown(e, kstr, mod_str);
			return;
		}
		if (kstr=="c_"||kstr=="/_") {
			if (check_input()) return;
			return toggle_cursor();
		}
		if (cwin&&(kstr==="PGDOWN_"||kstr==="PGUP_"||kstr==="HOME_"||kstr==="END_")){//«
			let mn = cwin.main;
			if (kstr==="PGDOWN_") mn.scrollTop+=mn.clientHeight;
			else if (kstr==="PGUP_") mn.scrollTop-=mn.clientHeight;
			else if (kstr==="HOME_") mn.scrollTop=0;
			else mn.scrollTop=mn.scrollHeight;
			mn.onscroll=e=>{
				if (CUR.ison()) {
					select_first_visible_folder_icon(cwin);
				}
			};
			return;
		}//»
		else if (CUR.ison()&&CUR_KSYMS.includes(kstr)) {//«
			if (kstr == "LEFT_" || kstr == "RIGHT_" || kstr == "UP_" || kstr == "DOWN_") {
				e.preventDefault();
				CUR.move(kstr[0]);
				return 
			}
			else if (kstr == "LEFT_C" || kstr == "RIGHT_C" || kstr == "UP_C" || kstr == "DOWN_C") return CUR.move(kstr[0],true);
			else if (kstr=="ENTER_") {
				if (act.tagName=="BUTTON") return;
				CUR.select();
				return;
			}
			else if (kstr=="ENTER_C") return CUR.select(null,null,{ctrlKey:true});
			else if (kstr=="ENTER_A") return CUR.select(null,true);
			else if (kstr=="ENTER_CA") return CUR.select(null,true, {ctrlKey:true});
			else if (kstr=="SPACE_") {
				if (check_input()) return;
				e.preventDefault();
				CUR.select(true);
				return 
			}
		}//»
		else if (kstr=="BACK_C"&&ICONS.length)return delete_selected_files();
		else if (kstr=="a_C") return select_all_icons();
		else if (kstr=="s_" && !cwin) return switch_icons();
		else if (kstr=="p_"&&CUR.ison()) {
			if (cwin&&!text_inactive) return;
			let icn = CUR.geticon();
			if (icn) return show_node_props(icn.node);
		}
		else if (kstr=="m_S") return move_icon_array({toClosest: true});
		else if (kstr.match(/_$/)){
			if (check_input()) return;
			if (kstr=="m_") return move_icon_array();
			else if (kstr=="0_"&&!cwin) {
				return move_icon_array({toOrigin: true});
			}
		}
	}//»

//«Various harcoded keysyms that *just* intercept the current window

	if (!qObj["no-switcher"]) {//«
		if (kstr.match(/^[1-9]_CAS$/)){
			switch_to_workspace(parseInt(kstr.split("_")[0])-1);
			return;
		}
		if (kstr=="LEFT_CAS"){
			current_workspace_num--;
			if (current_workspace_num<0) current_workspace_num = num_workspaces-1;
			switch_to_workspace(current_workspace_num, true);
			return;
		}
		if (kstr=="RIGHT_CAS"){
			current_workspace_num++;
			if (current_workspace_num>=num_workspaces) current_workspace_num = 0;
			switch_to_workspace(current_workspace_num, true);
			return;
		}
	}//»

//XKLEUIM
	if (marr = kstr.match(/^([1-9])_AS$/)){
		return raise_bound_win(marr[1]);
	}
	switch(kstr){
		case "`_A": return window_cycle();
		case "d_A": return (e.preventDefault(), toggle_show_windows());
		case "t_A": return open_terminal();
		case "e_A": return (e.preventDefault(), open_home_folder());
		case "0_AS": return open_app("WorkMan");
		case "l_CAS": return console.clear();
		case "b_A": return toggle_taskbar();
		case "e_CAS": return taskbar.toggle_expert_mode();
		case "i_CAS": return toggle_icon_display();
		case "t_CAS": return tile_windows();
		case "l_CA": return toggle_layout_mode();
	}
//»

//Send to the current window
//Change this to send to current workspace
	if (cwin) {//«
		if (cwin.popup) return check_prompt(cwin.popup);
		workspace.keyDown(e, kstr, mod_str);
		return;
	}//»

//These keys are "free" for the desktop to do what it wants
//«
	if (kstr == "ESC_") return handle_ESC();
//	else if (kstr=="1_CA") return open_text_editor();
	else if (kstr=="w_CAS"){
		for (let w of windows){
			log(w.fullpath);
		}
	}
	else if (kstr=="0_"){
		if (CUR.ison()) CUR.zero();
	}
	else if (kstr=="m_CAS"){//«

	}//»
	else if (kstr=="r_") return reload_desk_icons_cb();
//»

};
//»
const dokeypress = function(e) {//«
	if (PREV_DEF_ALL_KEYS) e.preventDefault();
	if (CEDICN) return;
	let code = e.charCode;
	if (CPR) {
		if (CPR.key_handler && code >= 32 && code <= 126) CPR.key_handler(null, e, true, code, "");
		return;
	}
	let w = CWIN;
	if (!w || w.moveDiv || w.isMinimized || w.popup || w.killed) return;
//	if (code >= 32 && code <= 126 && w.app.onkeypress) w.app.onkeypress(e.key, e, code, "");
//if (w.killed){
//return;
//}
	workspace.keyPress(e);
};
//»
const dokeyup = function(e) {//«
	delete KEYS_PRESSED[e.key];
	last_keyup = Date.now();
	if (CEDICN) return;
	let w = CWIN;
	let cpr = CPR;
	let getcpr = () => {
		return CPR;
	};
	let code = e.keyCode; 

	if (code == 18) {/*«*/
		alt_tab_presses = 1;
		alt_is_up = true;
		if (num_win_cycles){
			CG.off();
			if (windows.includes(NOWINDOW)) windows.splice(windows.indexOf(NOWINDOW),1);

			for (let w of windows){
				if (w.z_hold) w._z= w.z_hold;
				delete w.z_hold;
			}
			if (CWCW) {
				CWCW.on(true);
				CWCW.up();
				if (CWCW.isMinimized) CWCW.unminimize(true);
			}
		}
		if (num_win_cycles && taskbar_hidden) taskbar.hide(true);
		num_win_cycles = 0;
		have_window_cycle = false;
		CWCW=null;
	}/*»*/
	if (!w) return;
	if (w.isMinimized||w.popup) return;
	workspace.keyUp(e);
};
//»

//»

//Init«
(async () => {
	let winorig = window.location.origin;
	if (winorig.match(/localhost/)||winorig.match(/127\.0\.0\.1/)||winorig.match(/192\.168\./)) globals.is_local = true;
	dev_mode = globals.dev_mode = globals.is_local||qObj.expert||false;
	admin_mode = globals.admin_mode = !!(qObj.admin && qObj.admin.match(/^i_am_crazy$/i));
	if (!await fs.api.init()) return;
	if (!await fs.mk_user_dirs()) return;
	check_for_desktops_in_other_tabs();
	document.onkeyup = null;
	make_desktop();
	hidden_taskbar_thresh = taskbar.taskbarElem._gbcr().height;
	taskbar.resize();
	desk._add(CUR.curElem);
	CUR.set(0);
	if (!isMobile && !qObj.nocursor && globals.is_local) CUR.on(true);
	await reloadIcons();
	if (localStorage[`taskbar_hidden:${globals.current_user}`]) taskbar.hide();
	taskbar.taskbarElem._op=TASKBAR_OP;

	if (dev_mode && !(qObj["no-desk-init"])) {
		await makeScript("/init/my_setup.js", {module: true});
	}

	document.onkeypress = dokeypress;
	document.onkeydown = dokeydown;
	document.onkeyup = dokeyup;
	window.onresize = (e)=>{//«
		fit_desktop();
	};//»
	window.onbeforeunload = () => {//«
		for (let w of get_all_windows()) {
			if (w.app) {
				if (w.app.is_dirty) return true;
				if (w.app.onkill) w.app.onkill();
			}
		}
	};//»
	window.addEventListener("dragover",function(e){e =e||event;e.preventDefault();},false);
	window.addEventListener("drop",function(e){e =e||event;e.preventDefault();},false);
	setTimeout(()=>{
		if (globals.read_only) {
			popup("The system is in read-only mode! (Is it open in another tab?)");
			make_mode_dom(READ_ONLY_TEXT);
		}
		else if (admin_mode){
			make_mode_dom(ADMIN_MODE_TEXT);
		}
	},250);
	body.removeChild(gbid("error_message"));
})();

//»

//};//end Desk«
  })();
//»

//»

