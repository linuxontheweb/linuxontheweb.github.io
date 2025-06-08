/*6/8/25: Let's (maybe) separate the response section into the same sections, but
let's definitely put all code sections into their own expandable divs.

If the curKid is toggled and the _activeTab is *not* the first, then let's
make escape make it the first, so that enter will toggle *that* (rather than
any <code>s).

*/
/*Instructions:«

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

»*/
const FNAME = "/home/me/Desktop/THREAD4.html";
const PREVIEW_SIZE = 75;
const LOG_MESS_NUM = null;
//const LOG_MESS_NUM = 82;

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
	makeSection(num_str, quest, resp){//«
/*
When a section is toggled (open), let's use the tab key do cycle between:
1) The whole section
2) The question div
3) The various sections of the answer div

For child of rdv, let's loop through and check for class "response-content-markdown"
and "py-1", and make each of these tabbable.

*/
		let quest_start = quest.slice(0, this.prevSize);

		let dv = mkdv();
		dv._tabNum = 0;
		dv._kid = dv;
		dv._padl = 10;
		dv._padr = 5;
		let pdv = mkdv();
		pdv._kid = dv;
//		pdv._pad = 3;
		let qdv = mkdv();
		qdv.style.whiteSpace = "pre-wrap";
		qdv.on=()=>{
			qdv._bgcol="#101017";
			qdv.scrollIntoView();
		};
		qdv.off=()=>{
			qdv._bgcol="";
		};
		let rdv = mkdv();
		dv.off = () => {//«
			if (dv.dataset['state'] == "on") dv.toggle();
			dv._bor="2px solid #333";
		};//»
		dv.on = () => {//«
			dv._bor="2px solid #ff7";
		};//»
		dv.isToggled = ()=>{//«
			return dv.dataset['state'] == "on";
		}//»
		dv.dataset['state'] = "off";
		let tab_order=[qdv];
		dv._activeTab = 0;
//		tab_order.push[qdv];
		qdv._tabNum = 0;
		dv.toggle=()=>{//«
			if (dv.dataset['state'] == "off"){
				dv.dataset['state'] = "on";
				pdv._dis="none";
				dv._add(qdv);
				dv._add(rdv);
				tab_order[dv._activeTab]._bgcol="#101017";
				tab_order[dv._activeTab].scrollIntoView();
				this.removeButtons(rdv);
			}
			else{
				dv.dataset['state'] = "off";
				pdv._dis="";
				qdv._del();
				rdv._del();
				dv.scrollIntoViewIfNeeded();
			}
		};//»
		pdv.innerHTML = `${num_str})&nbsp;&nbsp;${quest_start}`;

		qdv.innerHTML = `${num_str})&nbsp;&nbsp;${quest}`;
		rdv.innerHTML = `<br><hr>${resp}`;

		let kids = Array.from(rdv.children);
		let tab_iter = 1;
		for (let k of kids){
			//For child of rdv, let's loop through and check for class "response-content-markdown"
			//and "py-1", and make each of these tabbable.
//			if (k.classList.contains("response-content-markdown") || k.classList.contains("py-1" )){
			if (k.classList.contains("response-content-markdown")){
				k._tabNum = tab_iter;
//k._pad=3;
				k.on=()=>{k._bgcol="#101017";k.scrollIntoView();};
				k.off=()=>{k._bgcol="";};
				tab_order.push(k);
				tab_iter++;
			}
			else if (k.classList.contains("py-1" )){
				let codes = Array.from(k.getElementsByTagName("code"));
				for (let code of codes){//«
					let par = code.parentNode;
					code._del();
					let cd = mkdv();//code div
					cd._isCode = true;
					cd._tabNum = tab_iter;
					tab_order.push(cd);
					tab_iter++;
					cd._pos = "relative";
					cd._bor = "1px dotted #777";
cd.on=()=>{
	cd._bor = "1px solid #fff";
	cd.scrollIntoView();
	cd._isOn = true;
	cdo._tcol="#fff";
};
cd.off=()=>{
	if (cdo._dis === "none") cd.toggle(true);
	cd._bor = "1px dotted #777";
	cd._isOn = false;
	cdo._tcol="#bbb";
};
cd.isToggled=()=>{
	return cdo._dis === "none";
};
cd.toggle=(no_scroll)=>{
if (cdo._dis==="") {
	cdo._dis="none";
	cd.style.height = "100%";
	cd._over="";
}
else {
	cdo._dis = "";
	cd._h = 75;
	cd._over="hidden";
}
if (!no_scroll) cd.scrollIntoView();
};
					cd._h = 75;
					cd._over = "hidden";
					cd.innerHTML = code.outerHTML;
					let cdo = mkdv();//cd overlay
					cdo._pos = "absolute";
					cdo._x=0;
					cdo._y=0;
					cdo._w="100%";
					cdo._h="100%";
					cdo._bgcol="rgba(0,0,0,0.75)";
					cdo._tcol="#bbb";
					cdo.innerHTML="<center><h2>Code</h2></center>";
					cd._add(cdo);
					par.appendChild(cd);
				}//»
			}
		}
		qdv.ondblclick=()=>{//«
			this.copyText(qdv.innerText);
			this.deselect();
		};//»
		rdv.ondblclick=(e)=>{//«
			if (e.ctrlKey) this.copyText(rdv.innerHTML);
			else this.copyText(rdv.innerText);
			this.deselect();
		};//»

//		qdv._pad = 3;
//		rdv._mar = 3;

		dv._bor="2px solid #333";
		dv._mart="2px";
		dv._marb="2px";
		dv._add(pdv);
		dv._tabOrder = tab_order;
		return dv;
	}//»
	makeDOM(){//«
		const{main, quests, resps}=this;
		if (!quests.length) return;
		this.setScrolling();
		main.style.userSelect="text";
		main._fs=22;
//		main._pad=10;
		main._tcol="#ddd";
		let tot_str_len = (quests.length + 1 + "").length;
		if (Number.isFinite(LOG_MESS_NUM)){
			let dv = this.makeSection((LOG_MESS_NUM+1+"").padStart(tot_str_len, "\xa0"), quests[LOG_MESS_NUM], resps[LOG_MESS_NUM]);
			main._add(dv);
log(dv);
		}
		else {
			for (let i=0; i < quests.length; i++) {
				let dv = this.makeSection((i+1+"").padStart(tot_str_len, "\xa0"), quests[i], resps[i]);
				main._add(dv);
			}
		}
		this.curKid = main.children[0];
		this.curKid.on();
//log(main);
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
	quesIsActive(){
		return this.curKid.isToggled() && this.curKid._activeTab === 0;
	}
	onescape(){//«
		if (this.deselect()) return true;
		if (this.statBar.innerHTML){
			this.statBar.innerHTML="";
			return true;
		}
		if (this.curKid.isToggled()){
			if (!this.quesIsActive()) {
				this.curKid._tabOrder[this.curKid._activeTab].off();
				this.curKid._activeTab=0;
				this.curKid._tabOrder[0].on();
			}
			else this.curKid.toggle();
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
			if (this.curKid.isToggled() && this.getActiveTab()._isCode){
				this.getActiveTab().toggle();
			}
			else if (!this.curKid.isToggled() || this.quesIsActive()){
				this.curKid.toggle();
			}
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
		else if (k==="TAB_"){
			this.doTab(e);
		}
		else if (k==="TAB_S"){
			this.doTab(e, true);
		}
	}//»
	getActiveTab(){
		return this.curKid._tabOrder[this.curKid._activeTab];
	}
	doTab(e, if_rev){//«
		const{curKid:kid}=this;
		if (!kid.isToggled()) return;
		e.preventDefault();
		const{_tabOrder: tabs} = kid;
		let num = kid._activeTab;
//		tabs[num]._bgcol="";
		tabs[num].off();
		if (if_rev){
			num--;
			if (num===-1) num = tabs.length-1;
		}
		else{
			num++;
			if (num===tabs.length) num = 0;
		}
//		tabs[num]._bgcol="#101017";
		tabs[num].on();
//		tabs[num].scrollIntoView();
		kid._activeTab = num;
	}//»

}

