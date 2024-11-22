/*Just using this as a looper, e.g. to take a nice White/Brown noise media file and
reset the currentTime to zero when the ontimeupdate event shows it to be within 
'end_secs_before_loop' seconds of the end. Otherwise, merely setting the loop 
property to 'true' seems to cause a very annoying skip. IT IS DOING AN ANNOYING SKIP
AFTER 20 or 30 LOOPS!!!

Just fiddled with the dev.audio.Noise app to make it a fairly decent WebAudio
(createBufferSource) brown noise with seemingly no skipping issues.

*/
//Imports«

//import { util, api as capi } from "util";
//import {globals} from "config";
const util = LOTW.api.util;
const globals = LOTW.globals;
const{isarr, isstr, isnum, isobj, make, log, jlog, cwarn, cerr}=util;

//»

export const app = function(Win, Desk) {

//Var«

let url;
let use_height_dim = true;
let vid;
let duration;
let end_secs_before_loop = 1;
let loop_after_secs;

//»
//DOM«

let Main = Win.main;

Main._bgcol="#040404";

//»
//Funcs«

const make_video=()=>{//«
vid = make('video');
vid.src = url;
vid.onloadedmetadata=e=>{
duration = vid.duration;
loop_after_secs = duration - end_secs_before_loop;
vid.play();
};
vid.ontimeupdate=e=>{
//log(e);
if (vid.currentTime > loop_after_secs) {
//cwarn("LOOP!");
vid.currentTime = 0;
}
};
//vid.loop = true;
set_vid_dim();
vid.style.cssText=`
position: relative;
left: 50%;
transform: translateX(-50%);
`;
Main._add(vid);
}//»
const set_vid_dim=()=>{//«
	if (use_height_dim){
		vid.height = Main._h;
	}
	else{
		vid.width = Main._w;
	}
};//»

//»

//Obj/CB«

this.onappinit=async(arg)=>{//«
	if (arg.reInit) arg = arg.reInit;
	url = arg.url;
	make_video();
	set_vid_dim();
}//»
this.onkill=()=>{//«
	this.reInit = {url};
};//»
this.onkeydown=(e,k)=>{//«
	if (k=="SPACE_"){//«
		if (vid.paused) vid.play();
		else vid.pause();
	}//»
	else if (k=="ENTER_"){//«
		use_height_dim = !use_height_dim;
		let tm = vid.currentTime;
		let psd = vid.paused;
		vid._del();
		make_video();
		vid.currentTime = tm;
		if (!psd) vid.play();
	}//»
};//»
this.onresize=()=>{set_vid_dim();};

//»

}

