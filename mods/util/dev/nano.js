
//Imports«

import { globals, NS } from "config";
import { util, api as capi } from "util";

const{strnum, isarr, isstr, isnum, isobj, make, log, jlog, cwarn, cerr}=util;

const {widgets} = NS.api;

//»

export const mod = function(Term){//«

//Var«

//let DEF_FORGET_UNDOS_YES = false;
let DEF_FORGET_UNDOS_YES = true;

let node;

const {
	refresh,
	onescape,
	modequit,
} = Term;

let app_cb;
let num_stat_lines = 1;

let x=0;
let y=0;
let scroll_num = 0;

let lines;
let line_colors = [];

let stat_message;
let stat_message_type = 0;

let awaiting = false;

//This removes all consecutive changes that happen at the same time.
//Otherwise, only consective of the same type (ch inserts or enters) that happen at the same time
let ALLOW_BLOCK_CHANGE = true;
//let ALLOW_BLOCK_CHANGE = false;

let actions=[];
let undos=[];

const Action = function(x,y,ch,time,opts={}){//«
	this.x=x;
	this.y=y;
	this.ch=ch;
	this.time = time;
	this.neg = opts.neg;
	this.adv = opts.adv;
};//»

let foldmode = true;
//let foldmode = false;
let open_folds;
let open_fold_nums;
let end_folds;
let end_fold_nums;
let fold_lines={};
let init_error;

const FOLDED_ROW_COLOR = "rgb(95,215,255)";

const REAL_LINES_SZ = 32*1024;
let real_lines;

let convert_markers;

//»

//Funcs«

//Fold«
const toggle_fold_mode = ()=>{
	x=0;y=0;scroll_num=0;

	undos = [];
	actions = [];

	if (!foldmode){
		foldmode = true;
		fold_all();
	}
	else{
		unfold_all();
		foldmode = false;
		real_lines = undefined;
	}
	return render(`foldmode: ${foldmode}`);
};
const unfold_all = () => {//«
	lines = get_edit_lines();
	for (let i=0; i < lines.length; i++) real_lines[i]=i;
	fold_lines={};
	Term.set_lines(lines, line_colors);
	render();
};//»
const fold_all = () => {//«
	let newlines = [];
	for (let ln of lines) newlines.push(ln.join(""));
	real_lines = new Uint32Array(REAL_LINES_SZ);
	init_folds(newlines,null,true);
	if (init_error){
		render(init_error);
		return;
	}
	Term.set_lines(lines, line_colors);
	render();
};//»
const adjust_row_folds=(from, donum)=>{//«
	if (!foldmode) return;
	let new_fold_lines = {};
	open_folds = {};
	end_folds = {};
	open_fold_nums.sort(LO2HI);
	for (let i=0; i < open_fold_nums.length; i++) {
		let n = open_fold_nums[i];
		if (n < from) {
			new_fold_lines[n] = fold_lines[n];
			open_folds[n]=1;
			open_fold_nums[i] = n;
		}
		else {
			new_fold_lines[n+donum] = fold_lines[n];
			open_fold_nums[i] = n+donum;
			open_folds[n+donum]=1;
		}
	}
	fold_lines = new_fold_lines;
	end_fold_nums.sort(LO2HI);
	for (let i=0; i < end_fold_nums.length; i++) {
		let n = end_fold_nums[i];
		if (n >= from){
			end_fold_nums[i] = n+donum;
			end_folds[n+donum]=1
		}
		else {
			end_folds[n]=1
			end_fold_nums[i] = n;
		}
	}

}//»
const get_folded_lines=(linesarg, add_i, is_init)=>{//«
	let depth = 0;
	let start_i;
	let have_open=false;
	let ret = [];
	if (!add_i) add_i=0;
	let num_lines = 0;
	for (let i=0; i < linesarg.length; i++){
		if (open_folds[i+add_i]){
			if (depth==0) {
				start_i = i;
				have_open = true;
			}
			depth++;
		}
		else if (end_folds[i+add_i]){
			if (depth>0) depth--;
		}
		if (have_open&&depth==0){
			let n = i - start_i+1;
			let nstr = n+"";
			nstr = nstr.padStart(3, " ");
			have_open = false;
			let lnstr = linesarg[start_i].replace(/\xab/,"---");
			lnstr = lnstr.replace(/\/\//,"");
			lnstr = lnstr.replace(/\/\*/,"");
			let str = ("\xd7--"+nstr+" lines: "+lnstr.regstr());
			if (str.length < Term.w) str = str.padEnd(Term.w,"-");
			let lnarr = str.split("");
			ret.push(lnarr);
			let arr = [];
			for (let j=0; j < n; j++) arr.push(linesarg[j+start_i].split(""));
			
			fold_lines[start_i+add_i] = arr;
			if (is_init) real_lines[add_i+num_lines++] = start_i+add_i;
		}
		else if (!have_open){
			let ln = linesarg[i];
			ret.push(ln.split(""));
			if (is_init) real_lines[add_i+num_lines++] = i+add_i;
		}
	}
	if (have_open){
		for (let i=start_i; i<linesarg.length; i++) {
			ret.push(linesarg[i].split(""));
			if (is_init) real_lines[add_i+num_lines++] = i+add_i;
		}
	}
	return ret;

}//»
const init_folds = (linesarg, add_i, is_init)=>{//«
	if (!add_i) add_i=0;
	if (is_init) {
		open_fold_nums=[];
		open_folds={};
		end_fold_nums=[];
		end_folds={};
		fold_lines={};
	}
	let len = 0;
	let have_error = false;
	for (let i=0; i < linesarg.length; i++){//«
		let ln = linesarg[i];
		if (is_init && ln.length &&  /^\xd7--/.exec(ln)){
			if (convert_markers) {
				let arr = ln.split("");
				arr[0] = "X";
				ln = arr.join("");
				linesarg[i]=ln;
			}
			else {
				init_error=`Reserved fold marker \\xd7 (\xd7) found at 0,${i}\nUse: --convert-markers to convert to X's`
				break;
			}
		}
		len += ln.length+1;
		let real_i=i+add_i;
		let ret = /\xab|\xbb/.exec(ln);
		if (ret) {
			if (is_init && ln.length > 1 && /\xab|\xbb/.exec(ln.slice(ret.index+1))) {
				open_fold_nums=[];
				open_folds={};
				end_fold_nums=[];
				end_folds={};
				fold_lines={};
				init_error = "Multiple fold meta chars found on line: "+(i+1);
				break;
//				return null;
			}
			if (ret[0]==="\xab") {
				open_folds[real_i]=1;
				open_fold_nums.push(real_i);
			}
			else {
				end_folds[real_i]=1;
				end_fold_nums.push(real_i);
			}
		}
	}//»
	if (is_init) lines = get_folded_lines(linesarg, null, true);
	return len;
}//»
const fold_open=(numarg, lnsarg, yarg)=>{//«
	delete fold_lines[numarg];
	let arr = [];
	let start_ln = real_lines[yarg];
//	zlncols[start_ln]=null;
	let add_num = 0;
	let to_len;
	let marks = null;
	let ret;
	if (lnsarg.length>=4) {
		marks={};
		for (let i=1; i < lnsarg.length-1;i++) {
			let ln = lnsarg[i];
			if (ln.marks){
				let newmarks = [];
				for (let m of ln.marks) {
					let pos = ln.indexOf(m);
					if (pos>=0) {
						m.pos = pos;
						newmarks.push(m);
					}
				}
				if (newmarks.length) marks[start_ln+i]=newmarks;
			}
			arr.push(ln.join(""));
		}
		ret = get_folded_lines(arr, numarg+1);
		to_len = ret.length+2;
		ret.unshift(lnsarg[0]);
		ret.push(lnsarg[lnsarg.length-1]);
		lines.splice(yarg, 1, ...ret);
		real_lines.copyWithin(yarg+to_len-1, yarg);
	}
	else {
		lines.splice(yarg, 1, ...lnsarg);
		to_len = lnsarg.length;
		real_lines.copyWithin(yarg+to_len-1, yarg);
	}
	for (let i=0; i < to_len; i++) {
		let real_num = start_ln+add_num+i;
		real_lines[yarg+i] = real_num;
		let gotfold = fold_lines[real_num];
		if (gotfold) add_num+=gotfold.length-1;
	}
	if (marks && ret){
		for (let k in marks){
			let ln = line_from_real_line(k);
			if (ln){
				ln.marks = marks[k];
				for (let m of marks[k]){
					ln[m.pos]=m;
					m.ln =ln;
				}
			}
		}
	}
//	if (toggle_hold_y!==null) {
//		x = toggle_hold_x;
//		y = toggle_hold_y;
//	}
}//»
const fold_close=(i)=>{//«
	let depth = 1;
	let start_j=i;
	let start_ln = lines[start_j];
	let real_start_ln = real_lines[start_j];
//	zlncols[real_start_ln]=null;
	let fold_len;
	let internal_fold_length = 0;
	for (let j=start_j+1; j < lines.length; j++){//«
		let real_ln = real_lines[j];
		if (fold_lines[real_ln]) continue;
		if (open_folds[real_ln]) depth++;
		else if (end_folds[real_ln]) depth--;
		if (depth==0){
			let n = j - start_j+1;
			let arr = [];
			let add_n = 0;
			for (let k=0; k < n; k++){
				let yarg = k+start_j;
				let real_num = real_lines[yarg];
				let gotlns = fold_lines[real_num];
				if (gotlns) {
					let add_len = gotlns.length-1;
					add_n+=add_len;
					arr.push(...gotlns);
					internal_fold_length+=gotlns.length-1;
					delete fold_lines[real_num];
				}
				else {
					arr.push(lines[k+start_j]);
				}
			}
			let lnstr = start_ln.join("").replace(/\xab/,"---");
			lnstr = lnstr.replace(/\/\//,"");
			lnstr = lnstr.replace(/\/\*/,"");
			let str = ("\xd7--"+(n+add_n+"").padStart(3, " ")+" lines: "+lnstr.regstr());
			if (str.length < Term.w) str = str.padEnd(Term.w,"-");
			let lnarr = str.split("");
			lines.splice(start_j, n, lnarr);
			fold_lines[real_start_ln] = arr;
			fold_len = arr.length-internal_fold_length;
			break;
		}
	}//»
//log(fold_len);
	if (!fold_len) return;
	real_lines.copyWithin(i+1, i+fold_len);
	y=start_j-scroll_num;
	x=0;
	if (y<0) {
		scroll_num+=y;
		y=0;
	}
	render({},33);
}//»
const fold_toggle = () =>{//«
	if (!foldmode) return;
	let num = real_lines[cy()];
	let lns = fold_lines[num];
	if (lns) {
		fold_open(num, lns, cy());
		render();
		return;
	}
	let _cy = cy();

	if (open_fold_nums.includes(real_lines[_cy])) {
		return fold_close(_cy);
	}
	let depth = 1;
	for (let i=_cy-1; i>=0; i--) {
		num = real_lines[i];
		if (fold_lines[num]) continue;
		else if (end_fold_nums.includes(num)) depth++;
		else if (open_fold_nums.includes(num)) depth--;
		if (depth==0){
			fold_close(i);
			break;
		}
	}
}//»

//»
//Undo/Redo«

const check_undos = async()=>{//«
	if (!undos.length) return true;
	awaiting = true;
	if (!await widgets.popyesno("Forget ALL undos?",{reverse: !DEF_FORGET_UNDOS_YES})) {
		awaiting = false;
		return false;
	}
	awaiting = false;
	undos = [];
	return true;
};//»
const undo = (if_recur) => {//«
	if (foldmode){
		return render("no undo/redo in foldmode (yet)");
	}
	let chg = actions.pop();
	scroll_num = 0;
	if (!chg) {
		x=0;
		y=0;
		render({mess:"Initial"})
		return false;
	}
	undos.push(chg);
	let ch = chg.ch;
	let tm = chg.time;
	let neg = chg.neg;
	let act;
	x = chg.x;
	y = chg.y;

	if (ch=="\n"){//«

		if (chg.neg) insnl(true);
		else {
			y++;
			x=0;
			back(true);
		}

		if (!if_recur) {
			while (actions.length && (act = actions[actions.length-1]) && act.time === tm && act.neg === neg && (ALLOW_BLOCK_CHANGE || act.ch === "\n")) {
				undo(true);
			}
		}

	}//»

	else {//«

		if (chg.neg){
			if (chg.adv) x--;
			insch(ch, true);
			if (chg.adv) x++;
		}
		else{
			del(true);
		}

		if (!if_recur) {
			while (actions.length && (act = actions[actions.length-1]) && act.time === tm && act.neg === neg && (ALLOW_BLOCK_CHANGE || act.ch !== "\n")) {
				undo(true);
			}
		}

	}//»

	if (!if_recur) {
		maybe_scroll();
		stat_message = `Undo change from: ${timestr(tm)}`;
		render();
	}
	return true;
};//»
const redo=(if_recur)=>{//«
	if (foldmode){
		return render("no undo/redo in foldmode (yet)");
	}

	let chg = undos.pop();
	if (!chg) {
		render({mess:"Current"})
		return false;
	}
	actions.push(chg);

	let ch = chg.ch;
	let tm = chg.time;
	let neg = chg.neg;

	let und;
	scroll_num = 0;
	x = chg.x;
	y = chg.y;

	if (ch=="\n"){//«
		if (chg.neg){
			y++;
			x=0;
			back(true);
		}
		else {
			insnl(true);
		}
		if (!if_recur) {
			while (undos.length && (und = undos[undos.length-1]) && und.time === tm && und.neg === neg && (ALLOW_BLOCK_CHANGE || und.ch === "\n")) {
				redo(true);
			}
		}
	}//»

	else{//«

		if (chg.neg){
			if (chg.adv) x--;
			del(true);
		}
		else{
			insch(ch, true);
		}
		if (!if_recur) {
			while (undos.length && (und = undos[undos.length-1]) && und.time === tm && und.neg === neg && (ALLOW_BLOCK_CHANGE || und.ch !== "\n")) {
				redo(true);
			}
		}

	}//»

	if (!if_recur) {
		maybe_scroll();
		stat_message = `Redo change from: ${timestr(tm)}`;
		render();
	}
	return true;
};//»
const undo_all=()=>{while (undo(true)){}maybe_scroll();render({mess:"Initial"});};
const redo_all=()=>{while (redo(true)){}maybe_scroll();render({mess:"Current"});};

//»

//Save«

const get_edit_lines=()=>{//«
	let uselines;
	if (foldmode){
		uselines = [];
		for (let i=0; i < lines.length; i++){
			let realln = real_lines[i];
			if (fold_lines[realln]){
				uselines.push(...fold_lines[realln]);
			}
			else uselines.push(lines[i]);
		}
	}   
	else uselines = lines;
    return uselines;

}//»
const get_edit_save_obj = () =>{//«
	let str = "";
	let uselines=get_edit_lines();
	for (let ln of uselines) {
		if (!ln) break;
		str += ln.join("")+"\n";
	}       
	return {val: str.replace(/\n$/,""), len: uselines.length};
};//»  
const save=async()=>{//«
	if (!node) return render({mess:"Not doing 'Save As'"});
	let o = get_edit_save_obj();
//log(`LEN: ${o.len}`);
//log(o.val);
//return;
	let rv = await node.setValue(o.val);
	if (!rv) stat_message="Could not write the file!";
	else stat_message = `Wrote: ${rv.size} bytes`;
	render();
};
//»

//»
//Util«

const render = (arg={}) => {//«
	if (typeof arg === 'string') stat_message = arg;
	this.opts={};
	this.x = x;
	this.y = y;
	this.scroll_num = scroll_num;
	this.stat_message = arg.mess || stat_message;
	this.real_lines = real_lines;
	refresh();
	return true;
};//»

const isfold=()=>{if (!foldmode) return false;return fold_lines[real_lines[cy()]];};
const ry = n => {//«
	if (!n) n = 0;
	if (foldmode) return real_lines[y+scroll_num + n];
	return y+scroll_num + d;
};//»
const quit = (mess) => {//«
	Term.onescape=onescape;
	this.cb=()=>{
		app_cb(mess);
	};
	modequit();
};//»
const reload = ()=>{quit("RELOAD");};

const timestr=(stamp)=>{//«
//	stamp = 1690000000000;
	let msdiff = (new Date).getTime() - stamp;
	let secsago = Math.floor(msdiff/1000);
	if (secsago < 60) return `${secsago} secs ago`;

//	let minsago = Math.floor(msdiff/60000);
//	if (minsago < 60) return `${secsago} secs ago`;

	let daysago = Math.floor(msdiff/86400000);
	let str = ((new Date(stamp))+"").split(" ")[4];
	if (daysago) str = `${str} (${daysago} days ago)`;
	return str;
};//»
const cy = () => {//«
	return y + scroll_num;
};//»
const curln = (add_y) => {//«
	if (!add_y) add_y = 0;
	return lines[y + scroll_num + add_y];
};//»
const curch = (addx) => {//«
    if (!addx) return lines[y+scroll_num][x];
    return lines[y+scroll_num][x+addx];
};//»
const LO2HI = (a, b)=>{if(a>b)return 1;else if (a<b)return -1;return 0;};
const HI2LO = (a, b)=>{if(a>b)return -1;else if (a<b)return 1;return 0;};

//»
//Scroll«

const maybe_scrdown_one = () => {//«
	if (y < Term.h-1) return false;
	scroll_num++;
	y--;
	return true;
};//»
const maybe_scrup_one = () => {//«
	if (!scroll_num || y >= 0) return false;
	scroll_num--;
	y++;
	return true;
};//»
const maybe_scroll = () =>{//«
	if (maybe_scrdown_one()){
		while (maybe_scrdown_one()){}
		return;
	}
	while (maybe_scrup_one()){}
};//»

//»
//Ins«

const tab=(e)=>{//«
	e&&e.preventDefault();
	insch("\t");
	x++;
};//»

const insch = (c, if_no_act, usetime) => {//«

	let tm = usetime || (new Date).getTime();
	let ln = curln();
	if (!if_no_act) actions.push(new Action(x, cy(), c, tm, {adv: true}));
	ln.splice(x, 0, c);

};//»
const insstr=str=>{//«
	let tm = (new Date).getTime();
	let lns = str.split("\n");
	for (let i=0; i < lns.length; i++){
		let s = lns[i];
		for (let c of s){
			insch(c, false, tm);
			x++;
		}
		if (i < lns.length - 1){
			insnl(false, tm);
		}
	}
	maybe_scroll();
	render();
};//»

const insnl = (if_no_act, usetime) => {//«

	let have_fold = isfold();

	let tm = usetime || (new Date).getTime();

	if (!if_no_act) actions.push(new Action(x, cy(), "\n", tm));
	
	let _y = cy();
	let ln = curln();
	let start = ln.slice(0, x);
	let rem = ln.slice(x);
	if (rem.length) ln.splice(x, rem.length);
	lines.splice(_y+1, 0, [...rem]);//enter
	x=0;
	y++;
	if (!usetime) maybe_scrdown_one();
	if (foldmode) {
		real_lines.copyWithin(_y+1, _y);
		for (let i=_y+1; i < lines.length; i++) {
			real_lines[i]+=1;
		}
		let llen = lines.length;
		if (llen > 1 && cy()+1==llen && !real_lines[llen-1]) real_lines[llen-1] = real_lines[llen-2]+1;
		if (start.includes("\xbb")||start.includes("\xab")) {
			adjust_row_folds(ry(0), 1);
		}
		else {
			adjust_row_folds(ry(-1), 1);
		}
	}

};//»
const insnls = (num) => {//«

	let tm = (new Date).getTime();
	for (let i=0; i < num; i++) insnl(false, tm);
	maybe_scroll();

}//»

//»
//Del«

const back = (if_no_act) => {//«

	let have_fold = isfold();

	if (x == 0){
		let _y = cy();
		if (!_y) return;
if (foldmode && (open_fold_nums.includes(ry()-1) || end_fold_nums.includes(ry()-1))){

cwarn("GOT FOLD");
return;
}
		if (have_fold){
			if (curln(-1).length) {
				return;
			}
			lines.splice(_y-1, 1);
			y--;
		}
		else {
			let ln1 = curln();
			lines.splice(_y, 1);//backspace
			y--;
			let ln2 = curln();
			x = ln2.length;
			ln2.push(...ln1);
		}
		maybe_scrup_one();
		if (!if_no_act) actions.push(new Action(x, cy(), "\n", (new Date).getTime(), {neg: true} ));
		if (foldmode) {
        	adjust_row_folds(ry(), -1);
            real_lines.copyWithin(cy(), cy()+1);
            for (let i=cy(); i < lines.length; i++) real_lines[i]-=1;
		}
	}
	else{

if (have_fold){
cerr("WHAT IS THIS, HAVE_FOLD AND X>0?????");
return;
}
		let ln = curln();
		let ch = (ln.splice(x-1, 1))[0];
		if (!if_no_act) actions.push(new Action(x, cy(), ch, (new Date).getTime(), {adv: true, neg: true} ));
		x--;
	}


};//»
const del = (if_no_act, usetime) => {//«
	if (foldmode){
		let num = real_lines[cy()];
		if (fold_lines[num]) {
			return render({mess:"Fold detected"});
		}
	}

	let tm = usetime || (new Date).getTime();
	let ln = curln();
	if (!ln.length) return;
	let ch = ln.splice(x, 1)[0];
	if (!if_no_act) actions.push(new Action(x, cy(), ch, tm, {neg: true} ));

};//»
const dellnstr = (yarg, x1, x2, usetime) => {//«

	y = yarg;
	x = x1;
	let usex2;
	if (x2 === true) usex2 = curln().length;
	else usex2 = x2;
	let diff = usex2 - x1;
	if (diff <= 0) return;
	let tm = usetime || (new Date).getTime();
	for (let i=0; i < diff; i++) del(false, tm);
	render();

};//»
const delblock = (y1, x1, y2, x2) => {//«

	let diff = y2 - y1;
	if (diff <= 0) return;
	let tm = (new Date).getTime();
	let num = 0;
	for (let i=0; i <= diff; i++){
		let usey = i + y1 - num;
		if (i===0) dellnstr(usey, x1, true);
		else if (i < diff) dellnstr(usey, 0, true);
		else dellnstr(usey, 0, x2);
	}
	for (let i=0; i < diff; i++) back();
	render();

};//»

//»
//Motion«

const sklnstart = () => {x = 0;};
const sklnend = () => {x = curln().length;};
const skprevword = () => {//«
	let addi=0;
	for (let i=0;;i--) {
		let ch1 = curch(i-2);
		let ch2 = curch(i-1);
		if (!ch2) break;
		if ((ch1==" "||ch1=="\t")&&(ch2!=" "&&ch2!="\t")) break;
		addi++;
		if (x-addi <= 0) {
			break;
		}
	}
	x-=addi+1;
	if (x<0) x=0;
	return;
};//»
const sknextword = () => {//«
	if (!curch()) return;
	let addi=0;
	for (let i=1;;i++) {
		let ch1 = curch(i-1);
		let ch2 = curch(i);
		if (!ch2) break;
		if ((ch1==" "||ch1=="\t")&&(ch2!=" "&&ch2!="\t")) break;
		addi++;
	}
	x+=addi+1;
	render();
	return;
};//»
const end = () => {//«
	scroll_num = lines.length - Term.h + num_stat_lines;
	if (scroll_num < 0) scroll_num = 0;
	y = lines.length-1-scroll_num;
};//»
const home = () => {//«
	x=0;
	y=0;
	scroll_num = 0;
};//»
const pgdown = () => {//«
	let n = Term.h - num_stat_lines;
	if (scroll_num + n >= lines.length) {
		if (scroll_num + y < lines.length-1) {
			y = lines.length-1-scroll_num;
		}
		return;
	}
	scroll_num += n;
	if (scroll_num + Term.h - num_stat_lines > lines.length) {
		scroll_num = lines.length - Term.h + num_stat_lines;
		if (scroll_num < 0) scroll_num = 0;
	}
};//»
const  pgup = () => {//«
	if (scroll_num == 0) {
		if (y > 0) y = 0; 
	}
	if (scroll_num - Term.h > 0) {
		scroll_num -= Term.h;
	}
	else scroll_num = 0;
};//»
const up = () => {//«
	if (cy()==0) return;
	y--;
	maybe_scrup_one();
	let len = curln().length;
	if (isfold()) x=0;
	else if (x > len) x = len;

};//»
const down = () => {//«

	if (cy() == lines.length-1) return;
	y++;
	maybe_scrdown_one();
	let len = curln().length;

	if (isfold()) x=0;
	else if (x > len) x = len;

};//»
const left = () => {//«
	if (x==0) return;
	x--;
};//»
const right = () => {//«
	if (isfold() || x == curln().length) return;
	x++;
};//»

//»

//»

//Keys«

const EDIT_FUNC_MAP = {//«
	ENTER_A: fold_toggle,
	ENTER_: insnl,
	BACK_: back,
	DEL_: del,
	UP_: up,
	DOWN_: down,
	LEFT_: left,
	RIGHT_: right,
	e_C: sklnend,
	a_C: sklnstart,
	LEFT_C: skprevword,
	RIGHT_C: sknextword,
	PGUP_: pgup,
	PGDOWN_: pgdown,
	HOME_: home,
	END_: end,
	TAB_: tab
};//»
const APP_FUNC_MAP = {//«
	s_C: save,
	x_C: quit,
	p_C: reload,
	o_A: undo,
	o_CAS: undo_all,
	p_A: redo,
	p_CAS: redo_all,
	f_CAS: toggle_fold_mode
};//»

this.key_handler = async(sym, e, ispress, code) => {

if (awaiting) return;

if (ispress) {//«
	if (code >=32 && code <= 126) {
		if (!await check_undos()) return;
		insch(sym);
		x++;
		render();
	}
	return;
}//»

let fn = EDIT_FUNC_MAP[sym];
if (fn){
	if (fn===insnl||fn===back||fn===del){
		if (!await check_undos()) return;
	}
	if (fn()) {}
	else render();
	return;
}

fn = APP_FUNC_MAP[sym];
fn && fn();

}

//»

//Obj/CB«

this.init = (arg, patharg, o)=>{//«

let {opts}=o;

node = o.node;
convert_markers = opts["convert-markers"];
return new Promise((Y,N)=>{
	app_cb = Y;
	let len = arg.length;
	let linesarg = arg.split(/\r?\n/);

	if (foldmode) {
		real_lines = new Uint32Array(REAL_LINES_SZ);
		init_folds(linesarg,null,true);
		if (init_error) {
			return Y(init_error);
		}
	}
	else{
		lines = [];
		for(let ln of linesarg) lines.push(ln.split(""));
	}

	Term.hold_lines();
	Term.set_lines(lines, line_colors);
	Term.init_edit_mode(this, num_stat_lines);
	render();

});

}//»

this.unset_stat_message=()=>{//«
	stat_message=null;
//	stat_message_type=null;
};//»
Term.onescape = () => {render();};

//»

}//»

