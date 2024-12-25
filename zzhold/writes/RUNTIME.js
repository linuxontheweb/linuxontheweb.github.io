/*«Notes

We are doing a URL.createObjectURL script inside of vim with "s_CAS".
We can refresh the multi-line highlights with "q_C".

If we quickly need the "real" console while it is detached, we can
do this with "d_CS".

To find the matching braces (for parens, curlies and square brackets),
we can just use "'".

Just getting used to the "[1-9]_CA" hotkey in order to go to the given
windows that were bound via 'bindwin'.

I only "sort of" have to force myself to use all of this as an actual system. 

»*/

//Imports«
const {globals} = LOTW;
const{ShellMod}=globals;
const{Shell}=ShellMod;
const{Word}=ShellMod.seqClasses;
const isWord=val=>{return val instanceof Word;};
const{consoleLog, isStr, isFunc, log, cwarn, cerr}=LOTW.api.util;
//const log=(...args)=>{consoleLog.log(...args);} 
//const nlog=(name, ...args)=>{consoleLog.nlog(name, ...args);} 
//»

class Command{//«

	constructor(pref, name, suffix, cwd){//«
		this.prefix=pref;
		if (name) this.name=name.toString();
		this.suffix=suffix;
		this.assigns=[];
		this.redirs=[];
		this.cwd=cwd;
	}//»

extractAssignments(){//«
	if (!this.prefix) return;
	for (let what of this.prefix){
		if (isWord(what)){
			this.assigns.push(what);
		}
	}
}//»
extractRedirects(){//«
	if (this.prefix){
		for (let what of this.prefix){
			if (what.redir){
				this.redirs.push(what);
			}
		}
	}
	if (this.suffix){
		for (let what of this.suffix){
			if (what.redir){
				this.redirs.push(what);
			}
		}
	}
}//»
get isPath(){return this.name.match(/\x2f/);}

async setScript(){//«
	let node = await this.name.toNode({cwd: this.cwd});
	if (!node){
		this.error = `file not found`;
	}
	else{
		let text = await node.text;
		if (!isStr(text)){
			this.error = `no text was returned`;
		}
		else{
			this.scriptText = text;
		}
	}
}//»
async setFunction(){//«

let com = Shell.activeCommands[this.name];
if (isStr(com)){//«
//log(`Load lib: ${com} for command: ${this.name}`);
	try{
	    await ShellMod.util.importComs(com);
	}catch(e){
log("ERROR1");
cerr(e);
	    this.error = `command library: '${com}' could not be loaded`;
	    return;
	}
	let gotcom = Shell.activeCommands[this.name];
	if (!(gotcom instanceof Function)){
log("ERROR2");
cerr("GOTCOM", gotcom);
		this.error = `'${this.name}' is invalid or missing in command library: '${com}'`;
	    return;
	}
//log("LOAD OK!");
	this.func = gotcom;
}//»
else if (isFunc(com)){//«
	this.func = com;
}//»
else if (com){//«
cerr(com);
	this.error = `${this.name}: unknown entity returned (see console)`
}//»
else{//«
	this.error = `${this.name}: command not found`;
}//»

}//»

}//»
class Pipeline{//«

	constructor(ast, bang, type){//«
		this.ast=ast;
		this.hasBang=bang;
		if (type) this.type=type;
	}//»
	get isOr(){return this.type==="||";}
	get isAnd(){return this.type==="&&";}
	get isFirst(){return !this.type;}
	async extractCommands(cwd){//«
		const{ast}=this;
		let coms=[];
		for (let obj of this.ast){
			let o = obj.simple_command;
			let com = new Command(o.prefix, o.word||o.name, o.suffix, cwd);
			com.extractAssignments(); 
			com.extractRedirects(); 
			if (!com.name){

			}
			else if (com.isPath){
				await com.setScript();
			}
			else{
				await com.setFunction();
			}
			coms.push(com);
		}
	}//»

}//»
class AndOr{//«

	constructor(ast, sep){//«
		this.ast = ast;
		this.sep = sep;
	}//»
	get isAsync(){return this.sep==="&";}
	async extractPipelines(cwd){//«
		const{ast}=this;
		let pipes=[];
		let first = ast.shift();
		pipes.push(new Pipeline(first.pipeline.pipe_sequence, first.bang));
		for (let i=0; i < ast.length; i+=2){
			pipes.push(new Pipeline(ast[i+1].pipeline.pipe_sequence, ast[i+1].bang, ast[i]));
		}
		for (let pipe of pipes){
			await pipe.extractCommands(cwd);
		}
	}//»

}//»

LOTW.globals.ShellMod.Runtime = class{
constructor(ast, term, opts={}){//«
	this.ast=ast;
	this.term=term;
	this.opts=opts;
}//»
err(mess){throw new Error(mess);}
async extractAndors(cwd){//«
	let compcoms = this.ast.program.complete_commands;
	let andors=[];
	for (let compcom of compcoms){
		let list = compcom.complete_command.list;
		for (let i=0; i < list.length-1; i+=2){
			let andor = new AndOr(list[i].andor, list[i+1])
			await andor.extractPipelines(cwd);
			andors.push(andor);
		}
	}
	return andors;
}//»
async execute(){//«

let andors = await this.extractAndors(this.term.cur_dir);
log(andors);
//nlog("AndOrs",andors)
//nlog("COMS",Shell.activeCommands);

}//»
}

LOTW.apps["local.RUNTIME"]=function(Win){



}
