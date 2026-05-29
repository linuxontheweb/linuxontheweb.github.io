(()=>{"use strict";const APPNAME="template.Basic";

//Imports«
import { util, api as capi } from "util";
import {globals} from "config";

const{isarr, isstr, isnum, isobj, make, log, jlog, cwarn, cerr}=util;
const {NS} = globals;
const {fs} = NS.api;

//»

LOTW.apps[APPNAME] = function(Win, Desk) {

//Var«

let Main = Win.main;

//»

//Funcs«


//»

//«
this.onappinit=async()=>{//«

}//»
this.onkill=()=>{//«
};//»
this.onkeydown=(e,k)=>{//«
	if (k=="\x20_"){
	}
};//»
this.onkeyup=(e,k)=>{
	if (k=="\x20_"){
	}
};

//»

}
})();
