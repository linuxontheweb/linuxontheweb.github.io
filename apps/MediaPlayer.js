
//Imports«

import { util, api as capi } from "util";
import {globals} from "config";

const{isarr, isstr, isnum, isobj, make, log, jlog, cwarn, cerr}=util;
const {NS} = globals;
const {fs} = NS.api;

//»

export const app = function(Win, Desk) {

//Var«

let url;
let use_height_dim = true;
let vid;

//»
//DOM«

let Main = Win.main;

Main._bgcol="#040404";

//»
//Funcs«

const make_video=()=>{//«
vid = make('video');
vid.src = url;
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

