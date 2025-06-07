const{log,cwarn,cerr, make,mkdv,mk,mksp}=LOTW.api.util;
const PREVIEW_SIZE = 90;

export const app = class {

	constructor(Win){//«
		this.Win = Win;
		this.main = this.Win.Main;
		this.prevSize = PREVIEW_SIZE;
	}//»
	setNewCurKid(x,y){//«
		let got = document.elementFromPoint(x, y);
		if (got && got._kid){
			this.curKid.off();
			got._kid.on();
			this.curKid = got._kid;
		}
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
					this.setNewCurKid(mr.left+5,mr.top+25);
				}
			}
			else if(kr.top > mr.bottom){
				if (this.curKid.isToggled()) {
					this.main.scrollTop += kr.top - mr.bottom + 100;
				}
				else{
					this.setNewCurKid(mr.left+5,mr.bottom-25);
				}
			}
		};
	}//»
	makeDOM(){//«
		const{main, quests, resps}=this;
		if (!quests.length) return;
		this.setScrolling();
		main._fs=22;
		main._tcol="#ddd";
//		for (let quest of quests) {
		for (let i=0; i < quests.length; i++) {
			let quest = quests[i];
			let resp = resps[i];
			let dv = mkdv();
			dv._kid = dv;
			let pdv = mkdv();
			pdv._kid = dv;
			let qdv = mkdv();
//			let qdv = make("pre");
			qdv.style.whiteSpace = "pre-wrap";
			let rdv = mkdv();
//rdv._pad
			let quest_start = quest.slice(0, this.prevSize);
//			let quest_end = quest.slice(this.prevSize);
			dv.off = () => {
				if (dv.dataset['state'] == "on") dv.toggle();
				dv._bor="1px solid grey";
			};
			dv.on = () => {
				dv._bor="1px solid yellow";
			};
			dv.isToggled = ()=>{
				return dv.dataset['state'] == "on";
			}
			dv.dataset['state'] = "off";
			dv.toggle=()=>{
				if (dv.dataset['state'] == "off"){
//					qdv.innerHTML = quest;
					dv.dataset['state'] = "on";
					pdv._dis="none";
					dv._add(qdv);
					dv._add(rdv);
					dv._overy="scroll";
				}
				else{
//					qdv.innerHTML = quest_start;
					dv.dataset['state'] = "off";
					pdv._dis="";
					qdv._del();
					rdv._del();
					dv._overy="";
				}
			};
/*
			dv.onclick=(e)=>{
				this.curKid.off();
				this.curKid = dv;
				this.curKid.on();
			};
*/
			pdv.innerHTML = quest_start;
//			qdv._dis="none";
			qdv.innerHTML = quest;
//			rdv._bor="1px dotted white";
			rdv.innerHTML = `<br><hr>${resp}`;

			dv._bor="1px solid grey";
			dv._mart="2px";
			dv._marb="2px";
			dv._add(pdv);
			main._add(dv);
		}
		this.curKid = main.children[0];
		this.curKid.on();
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
//if (i==0)
//log(mess_arr[i]);
			quests.push(mess_arr[i].children[1].innerHTML);
			resps.push(mess_arr[i+1].children[1].innerHTML);
		}
		this.quests = quests;
		this.resps = resps;
	}//»
	async onappinit(){//«
		await this.doParse("/home/me/Desktop/THREAD.html");
		this.makeDOM();
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
	}//»

}

