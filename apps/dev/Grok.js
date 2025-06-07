/*Instructions:

I DIDN'T NEED TO TOGGLE "Show inline", SO I WAS ABLE TO GET EVERYTHING IN
THREAD4.html.

(OLD ANNOYANCE: THE ANNOYING THING IS TO FIRST MAKE SURE THAT ALL OF THE
RELEVANT "Show inline" BUTTONS HAVE BEEN EXPANDED IN ORDER TO GET ALL THE
INFORMATION IN THE SINGLE THREAD.  SO WE JUST NEED TO TAKE TO TIME TO SCROLL
ALL THE WAY BACK AND THEN DO A FORWARD SEARCH FOR "Show inline".)

Goto your Grok thread and hit Ctrl+Shift+i to open the console, then click the
Elements button, and look for what (should be) the first <div> (everything in
the content area should be highlighted when you hover the cursor over it). 
You should be able to copy it by right-clicking it and selecting:
Copy -> Copy outerHTML. Save that into a file on your system, then
drag-n-drop it onto the LOTW desktop, and put its full path into the
FNAME variable below.

PREVIEW_SIZE setss how long the maximum preview lines are. We want the preview
lines to be able to fill as much of the width of the window as possible,
without wrapping. Since this is the only DOM that there is while scrolling through
the different questions, it should be pretty fast to navigate them all.

*/
const FNAME = "/home/me/Desktop/THREAD4.html";
const PREVIEW_SIZE = 75;

const{log,cwarn,cerr, make,mkdv,mk,mksp}=LOTW.api.util;

export const app = class {

	constructor(Win){//«
		this.Win = Win;
		this.main = this.Win.Main;
		this.prevSize = PREVIEW_SIZE;
		this.statBar = this.Win.statusBar;
//log(this.Win);
	}//»
	deselect(){//«
		const selection = document.getSelection();
		if (selection.isCollapsed) return false;
		selection.removeAllRanges();
		return true;
	}//»
	stat(s){//«
		this.statBar.innerHTML=s;
	}//»
removeButtons(elem){//«
	let buts = Array.from(elem.getElementsByTagName("button"));
	for (let but of buts) {
		but._del();
	}
}//»
	makeDOM(){//«
		const{main, quests, resps}=this;
		if (!quests.length) return;
		this.setScrolling();
		main.style.userSelect="text";
		main._fs=22;
		main._tcol="#ddd";
		let tot_str_len = (quests.length + 1 + "").length;
		for (let i=0; i < quests.length; i++) {
			let num_str = (i+1+"").padStart(tot_str_len, "\xa0");
			let quest = quests[i];
			let resp = resps[i];
			let dv = mkdv();
			dv._kid = dv;
			let pdv = mkdv();
			pdv._kid = dv;
			let qdv = mkdv();
			qdv.style.whiteSpace = "pre-wrap";
			let rdv = mkdv();
			let quest_start = quest.slice(0, this.prevSize);
			dv.off = () => {
				if (dv.dataset['state'] == "on") dv.toggle();
				dv._bor="2px solid #333";
			};
			dv.on = () => {
				dv._bor="2px solid yellow";
			};
			dv.isToggled = ()=>{
				return dv.dataset['state'] == "on";
			}
			dv.dataset['state'] = "off";
			dv.toggle=()=>{
				if (dv.dataset['state'] == "off"){
					dv.dataset['state'] = "on";
					pdv._dis="none";
					dv._add(qdv);
					dv._add(rdv);
//log(rdv.innerHTML.match(/\binline\b/));
					dv.scrollIntoView();
					this.removeButtons(rdv);
				}
				else{
					dv.dataset['state'] = "off";
					pdv._dis="";
					qdv._del();
					rdv._del();
//					dv._overy="";
				}
			};
/*
			dv.onclick=(e)=>{
				this.curKid.off();
				this.curKid = dv;
				this.curKid.on();
			};
*/
			pdv.innerHTML = `${num_str})&nbsp;&nbsp;${quest_start}`;
			qdv.innerHTML = `${num_str})&nbsp;&nbsp;${quest}`;
			rdv.innerHTML = `<br><hr>${resp}`;
//if (i===85) log(rdv);
			qdv.ondblclick=()=>{
				this.copyText(qdv.innerText);
				this.deselect();
			};
			rdv.ondblclick=(e)=>{
				if (e.ctrlKey) this.copyText(rdv.innerHTML);
				else this.copyText(rdv.innerText);
				this.deselect();
			};

			dv._bor="2px solid #333";
			dv._mart="2px";
			dv._marb="2px";
			dv._add(pdv);
			main._add(dv);
		}
		this.curKid = main.children[0];
		this.curKid.on();
	}//»
	setCurKid(kid){//«
		this.curKid.off();
		kid.on();
		this.curKid = kid;
	}//»
	setCurKidFromPoint(x,y){//«
		let got = document.elementFromPoint(x, y);
		if (got && got._kid) this.setCurKid(got._kid);
	}//»
	setScrolling(){//«
		this.Win.makeScrollable();
		this.main.onscroll=(e)=>{
			let mr = this.main.getBoundingClientRect();
			let kr = this.curKid.getBoundingClientRect();
			if (kr.bottom < mr.top) {
				if (this.curKid.isToggled()) {
					this.main.scrollTop -= mr.top - kr.bottom + 100;
				}
				else{
					this.setCurKidFromPoint(mr.left+5,mr.top+25);
				}
			}
			else if(kr.top > mr.bottom){
				if (this.curKid.isToggled()) {
					this.main.scrollTop += kr.top - mr.bottom + 100;
				}
				else{
					this.setCurKidFromPoint(mr.left+5,mr.bottom-25);
				}
			}
		};
	}//»
	async copyText(str){//«
		await navigator.clipboard.writeText(str);
		this.stat(`Copied: ${str.length}`);
	}//»
	async doParse(fname){//«

		let txt = await fname.toText();
		if (!txt) {
			cerr("No file text!");
			return;
		}
		let parser = new DOMParser();
		let doc = parser.parseFromString(txt, "text/html");

		//Easy way to pick out all the "conversation content" divs: class="message-bubble"
		let mess_arr = Array.from(doc.getElementsByClassName("message-bubble"));
		let quests=[];
		let resps=[];
		for (let i=0; i < mess_arr.length; i+=2){
			quests.push(mess_arr[i].innerText);
			resps.push(mess_arr[i+1].innerHTML);
		}
		this.quests = quests;
		this.resps = resps;
	}//»
	async onappinit(){//«
		await this.doParse(FNAME);
		this.makeDOM();
		this.main.focus();
	}//»
atBottom(){//«
	const{main}=this;
	return Math.abs(main.scrollHeight - main.clientHeight - main.scrollTop) <= 1;
}//»
	onescape(){//«
		if (this.deselect()) return true;
		if (this.statBar.innerHTML){
			this.statBar.innerHTML="";
			return true;
		}
		return false;
	}//»
	onkeydown(e, k){//«
		if (k==="UP_"){
			if (this.curKid.isToggled()) return;
			e.preventDefault();
			let prev = this.curKid.previousSibling;
			if (!prev) return;
			this.curKid.off();
			prev.on();
			prev.scrollIntoViewIfNeeded();
			this.curKid = prev;
		}
		else if (k==="DOWN_"){
			if (this.curKid.isToggled()) return;
			e.preventDefault();
			let next = this.curKid.nextSibling;
			if (!next) return;
			this.curKid.off();
			next.on();
			next.scrollIntoViewIfNeeded();
			this.curKid = next;
		}
		else if (k==="ENTER_"){
			this.curKid.toggle();
			this.curKid.scrollIntoViewIfNeeded();
		}
		else if (k==="PGUP_"){
			if (this.curKid.isToggled()) return;
			e.preventDefault();
			if (this.main.scrollTop==0){
				this.setCurKid(this.main.firstChild);
			}
			else this.main.scrollTop -= this.main.clientHeight;
		}
		else if (k==="PGDOWN_"){
			if (this.curKid.isToggled()) return;
			e.preventDefault();
			if (this.atBottom()) this.setCurKid(this.main.lastChild);
			else this.main.scrollTop += this.main.clientHeight;
		}
		else if (k==="HOME_"){
			e.preventDefault();
			if (this.curKid.isToggled()) return;
			this.main.scrollTop = 0;
			this.setCurKid(this.main.firstChild);
		}
		else if (k==="END_"){
			e.preventDefault();
			if (this.curKid.isToggled()) return;
			this.main.scrollTop = this.main.scrollHeight;
			this.setCurKid(this.main.lastChild);
		}
	}//»

}

