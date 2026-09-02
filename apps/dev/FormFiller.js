(()=>{"use strict";const APPNAME="dev.FormFiller";
/*9/2/26: What is the "real" focused app? FormFilled 

*/
/*9/1/26«

Need to look into the "child win" concept in the desktop. I want the form
to be a child window, but I want this *child* window to not accept handler
keys. We need to put a flag on all windows that aren't meant to accept
key input.


*//*»*/


const {
log,
cwarn,
cerr,
} = LOTW.api.util;

LOTW.apps[APPNAME] = class {
	constructor(Win){
Win.title = APPNAME;
		Win.eatsAllKeys = true;
		this.Win = Win;
	}
	onblur(){
	//Handle window blur event
	}
	onfocus(){
	//Handle window focus event
	}
	onkill(){
	//Handle window "kill" event
		this.childWin.doClose();
	}
	onkeydown(e, sym){
	//Handle key down
//console.log(`Got: ${e.key}`);
log(sym);
if (sym === "\x20_"){

//log(!!this.childWin.app.togglePaused);

this.childWin.app.togglePaused();

}

	}

async onappinit(){

this.Win.Main.innerHTML=`
<center>
<h1>Form filler App</h1>
<h3>Spacebar toggles pause!</h3>
(Note: treat this window as a background window)
</center>
`;

let chwin = await LOTW.Desk.open_app_window("dev.FormFilled", {
    winArgs: { 
		WID: 300,
		HGT: 250,
		childWinArg: { 
			win: this.Win,
			noKill: true 
		} 
	}
});
//log(chwin);
this.childWin = chwin;
//log(this.childApp);


}

}

})();
