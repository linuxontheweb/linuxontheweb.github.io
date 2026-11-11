(()=>{"use strict";const LIBNAME="dev.webm";
/*11/11/26: Just starting out.

How do I read a slice of a file?

*/
//Imports«

//const{globals, Desk}=LOTW;
const {Com} = LOTW.globals.ShellMod.comClasses;
//const util = LOTW.api.util;
const{
	getMod,
	isArr,
	isStr,
	isEOF,
	log,
	jlog,
	cwarn,
	cerr
}=LOTW.api.util;
//»

//Commands«
const com_webmdev = class extends Com{
async run(){//«
/*11/11/26:
Just seeing how to get a slice from a file. Just created a new String.prototype called:
toByteSlice.
*/
	const {args} = this;

	let file_arg = args.shift();
	if (!file_arg){
		this.no("Need a file arg");
		return;
	}

	let start_arg = args.shift();
	if (!(start_arg)){
		this.no("Need a start arg");
		return;
	}
	let start = start_arg.pnni();
	if (isNaN(start)){
		this.no("Invalid start arg");
		return;
	}

	let end_arg = args.shift();
	if (!(end_arg)){
		this.no("Need an end arg");
		return;
	}
	let end = end_arg.ppi();
	if (isNaN(end)){
		this.no("Invalid end arg");
		return;
	}
	//log(start, end);
	let slice = await file_arg.toByteSlice(start, end, this.env.cwd);
log(slice);
	this.ok("I'm a WEBM command!");

}//»
}
//»

const coms = {//«
	webmdev: com_webmdev,
}//»

//export {coms};
LOTW.coms[LIBNAME] = {coms};

})();

