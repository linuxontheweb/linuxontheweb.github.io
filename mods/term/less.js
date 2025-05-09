//Imports«
const util = LOTW.api.util;
const globals = LOTW.globals;
const{strNum, isArr, isStr, isBool, log, jlog, cwarn, cerr, isEOF}=util;
//»

export const mod = function(termobj) {

//Var«

const {//«
//	wrapLine,
//	onescape,
	topwin,
//	modequit,
//	quit_new_screen,
	h
} = termobj;//»
this.comName = "less";
const less = this;
let appclass="pager";
let hold_screen_state;

let ALLOWED_EXTRA_SPACES = 15;
//let fmt_lines;
//let raw_lines;
let filename;

let lines, line_colors;
let line_select_mode;
let x=0,y=0,scroll_num=0;

let stat_message;
let stat_input_mode;
let stat_com_arr;
let num_stat_lines = 1;

let scroll_pattern_not_found;
let scroll_search_str;
let scroll_search_dir;
let scroll_fname;
let scroll_lines_checked;

//»

//Funcs«

const okint = val=>{//«
    if (typeof val == "number") return true;
    if (typeof val == "string") {
        return (val.match(/^0x[0-9a-fA-F]+$/)||val.match(/^0o[0-7]+$/)||val.match(/^[0-9]+$/));
    }
    return false;
};//»        
const quit=(if_reload)=>{
	termobj.quitNewScreen(hold_screen_state, {reload: if_reload});
//	less.cb&&less.cb();
};
const render = () => {//«
	termobj.refresh();
};//»

const do_scroll_search=(if_start)=>{//«
	var strlen = scroll_search_str.length;
	if (scroll_search_dir==":"){//«
		let num = strNum(scroll_search_str);
		if (!okint(num)) {
			quit();
			return;
		}
		else {
			if (edit_mode && if_edfold){
				if (num==0) num=1;
				let add_lines = 0;
				let good_num;
				let tonum = num-1;
				if (tonum >= real_edit_line(lines.length-1)){
					scroll_num = lines.length-1;
					x=0;
					y=0;
				}
				else {
					y=0;
					for (let i=0; i < lines.length-1; i++){
						let ln1 = real_edit_line(i);
						let fold = fold_lines[ln1];
						if (ln1===tonum){
							scroll_num = ln1 - add_lines;
							y = 0
							x = 0;
							if (fold) foldtoggle();
							break;
						}
						if (fold) {
							let ln2 = real_edit_line(i+1);
							if (tonum > ln1 && tonum < ln2) {
								scroll_num = i;
								y=0;
								foldtoggle();
							}
							else add_lines += fold.length-1;
						}
					}
				}
				render();
			}
			else {
				if (num==0) num=1;
				else if (num >= lines.length) {
					if (!lines[lines.length-1][0]) num = lines.length-1;
					else num = lines.length;
				}
				if (num <= scroll_num){
					scroll_num = num-1;
					y=0;
				}
				else if (num >= scroll_num+termobj.h){
					scroll_num = num-termobj.h+1;
					y = num - scroll_num-1;
				}
				else y=num-1-scroll_num;
			}
			
		}
		if (edit_mode) quit();
		
		else render();
		return;
	}//»

	let arr = [];
	let metas = [".","*","+","?","[","(","{","/","^","$","\\"];
	for (let ch of scroll_search_str.split("")) {
		if (metas.includes(ch)) ch = "\\"+ch;
		arr.push(ch);
	}
	let usestr=arr.join("");

	let re;
	usestr = usestr.replace(/\)/g,"\\)");
	usestr = usestr.replace(/\]/g,"\\]");
	try {
		re = new RegExp(usestr,"g");
	}
	catch(e){
cerr(e);
return;
	}

	function gotmatch(num) {
		if (line_colors[num]) return true;
		let line_str = lines[num].join("");
//		return (new RegExp(scroll_search_str)).test(line_str);
		return (new RegExp(usestr)).test(line_str);
	}

	var i=y+scroll_num;
	let donum = 0;
	let did_get_match = false;
	if (scroll_search_dir=="?") {//«
		if (i>0&&!if_start) i--;

		for (; i >= 0; i--) {
			if (scroll_num==0) break;
			if (!if_start) donum--;
			if (gotmatch(i)) {
				did_get_match = true;
				scroll_num+=donum;
				break;
			}
			if (if_start) donum--;
		}

	}//»
	else {//«
		if (i<lines.length&&!if_start) i++;
		for (; i < lines.length; i++) {
			if (!lines[i]) break;
			if (!if_start) donum++;
			if (gotmatch(i)) {
				did_get_match = true;
				scroll_num+=donum;
				break;
			}
			if (if_start) donum++;
		}
	}//»

	if (!did_get_match) {//«
		if (if_start||scroll_pattern_not_found) {
			stat_message = "Pattern not found";
			scroll_pattern_not_found = true;
		}
		else {
			stat_message = "No more matches";
		}
		render();
		return;
	}//»

	for (let j=0;j<termobj.h;j++) {//«
		let num = i+j;

		if (!lines[num]) break;;

		if (!scroll_lines_checked[num]) {
			let line_str = lines[num].join("");
			let marr = [];
			while ((marr = re.exec(line_str)) !== null) {
				let obj = line_colors[num];
				if (!obj) obj = {};
				obj[marr.index]=[strlen, "black", "#ccc"];
				line_colors[num] = obj;
			}
			scroll_lines_checked[num]=true;
		}
	}//»
	render();
}//»

const wrap_lines=arr=>{
	for (let ln of arr){
		let wraparr = termobj.wrapLine(ln).split("\n");
		let len = wraparr.length;
		let lenmin1 = len-1;
		for (let i = 0; i < len; i++) {
			let l = wraparr[i];
			let a = l.split("");
			if (i < lenmin1) a._continue = true;
			lines.push(a);
		}
	}
};
//»
//Obj/CB«

const onescape=()=>{//«
	let got=false;
	if (line_colors.length){
		got=true;
		line_colors.splice(0,line_colors.length)
	}
	if (stat_message){
		got=true;
		stat_message="";
	}
	if(got) render();
	return got;
};//»
this.onkeydown=(e, sym, code)=>{//«

	if (this.stat_input_type) {//«
		if (sym=="ENTER_") {//«
			scroll_search_dir = this.stat_input_type;
			this.stat_input_type = false;
			if (stat_com_arr.length) {
				scroll_lines_checked = [];
				line_colors.splice(0,line_colors.length)
				scroll_search_str = stat_com_arr.join("");
				scroll_pattern_not_found = false;
				do_scroll_search(true);
			}
			return;
		}//»
		else if (sym=="LEFT_") {//«
			if (x > 0) x--;
		}//»
		else if (sym=="RIGHT_") {//«
			if (x < stat_com_arr.length) x++;
		}//»
		else if (sym=="BACK_") {//«
			if (x>0) {
				x--;
				stat_com_arr.splice(x, 1);
			}
			else {
				this.stat_input_type = false;
			}
		}//»
		else if (sym=="DEL_") {//«
			if (stat_com_arr.length) {
				stat_com_arr.splice(x, 1);
			}
		}//»
		else if (sym=="a_C") {//«
			if (x==0) return;
			x=0;
		}//»
		else if (sym=="e_C") {//«
			if (x==stat_com_arr.length) return;
			x=stat_com_arr.length;
		}//»
		render();
		return;
	}//»

	if (sym=="UP_") {//«
		if (line_select_mode && y > 0){
			y--;
		}
		else if (scroll_num - 1 >= 0) {
			scroll_num--;
		}
		else return;
		render();
	}//»
	else if (sym=="SPACE_"){
		const{multilineSels: sels} = this;
		let n = y+scroll_num;
		if (sels && isBool(sels[n])){
			sels[n]=!sels[n];
			render();
		}
	}
	else if (sym=="DOWN_") {//«
//log(y+scroll_num);
		if (line_select_mode && y+num_stat_lines < termobj.h-1){
			if (y+scroll_num === lines.length-1) return;
			y++;
		}
		else if (scroll_num+termobj.h-num_stat_lines < lines.length) {
			scroll_num++;
//			y++;
		}
		render();
	}//»
	else if (sym=="PGUP_") {//«
		e.preventDefault();
		if (scroll_num == 0) {
			y=0;
			render();
			return;
		}
		let donum;
		if (scroll_num - termobj.h > 0) {
			donum = termobj.h;
			scroll_num -= termobj.h-1;
		}
		else scroll_num = 0;
//		y=0;
		render();
	}//»
	else if (sym=="PGDOWN_") {//«
		e.preventDefault();
		let donum = termobj.h-1;
//		if (scroll_num + donum-num_stat_lines >= lines.length) {
		if (scroll_num + donum >= lines.length) {
//log("!!!");
			y = lines.length-1-scroll_num;
			render();
			return;
		}
		scroll_num += donum;
		if (scroll_num + termobj.h-num_stat_lines > lines.length) {
			scroll_num = lines.length - termobj.h + num_stat_lines;
			if (scroll_num < 0) scroll_num = 0;
		}
		else{
		}
		y=0;
		render();
	}//»
	else if (sym=="HOME_") {//«
		if (scroll_num == 0) return;
		scroll_num = 0;
		y=0;
		render();
	}//»
	else if (sym=="END_") {//«
		if (scroll_num + termobj.h - num_stat_lines >= lines.length) {
			return;
		}
		scroll_num = lines.length - termobj.h + num_stat_lines;
		y = lines.length-1-scroll_num;
		if (scroll_num < 0) scroll_num = 0;
//		y=0;
		render();
	}//»
else if (sym=="ENTER_"){//«
	const{multilineEnterFuncs: funcs} = this;
	let n = y+scroll_num;
	if (funcs && funcs[n] instanceof Function){
		funcs[n]();
		return;
	}
//	if (line_select_mode) quit(true);
	if (line_select_mode) quit();
}//»
	else if (sym=="n_") {//«
		if (scroll_search_str) do_scroll_search();
	}//»
	else if (sym=="/_") {//«
		this.stat_input_type = "/";
		stat_com_arr = true;
		x=0;
		render();
	}//»
	else if (sym=="/_S") {//«
		this.stat_input_type = "?";
		stat_com_arr = true;
		x=0;
		render();
	}//»

}//»
this.onkeypress=(e, sym, code)=>{//«

	if (!this.stat_input_type) {
		if (this.exitChars){
			if (this.exitChars.includes(sym)){
				this.exitChar = sym;
				quit();
			}
		}
		else if (sym==="q") quit();
		return;
	}
	if (!(code >= 32 && code <= 126)) return;
	if (stat_com_arr===true) {
		stat_com_arr = [];
		return;
	}
	stat_com_arr.splice(x, 0, String.fromCharCode(code));
	x++;
	render();

}//»

//»
//defineProperty«
Object.defineProperty(this,"x",{get:()=>x});
Object.defineProperty(this,"y",{get:()=>y});
Object.defineProperty(this,"scroll_num",{get:()=>scroll_num});
Object.defineProperty(this,"line_select_mode",{get:()=>line_select_mode});
Object.defineProperty(this,"stat_com_arr",{get:()=>stat_com_arr});
Object.defineProperty(this, "stat_message", {
	get: () => stat_message,
	set: (s) => stat_message = s
});
//»
this.resize=()=>{//«
/*
If we have no continues and no lines are greater than w, then we don't need to actually
do anything;
*/
	line_colors.splice(0,line_colors.length)
	const{w,h}=termobj;
	let arr=[];
	let curln = null;
	let have_continue;
	let have_long;
	for (let ln of lines){
		if (ln._continue){
			have_continue = true;
			if (curln===null) curln = ln.join("");
			else curln += ln.join("");
		}
		else{
			if (curln!==null) {
				curln += ln.join("");
				arr.push(curln);
				curln = null;
			}
			else {
				let str = ln.join("");
				if (!have_continue && !have_long && str.length > w) have_long = true;
				arr.push(str);
			}
		}
	}
	if (!have_continue && !have_long){
		render();
		return;
	}
	lines.splice(0,lines.length)
	wrap_lines(arr);
	y=0;
	scroll_num = 0;
	render();
}//»
this.init = (linesarg, fname, o={})=>{//«
let {opts}=o;
this.command_str = o.command_str;
this.parSel = opts.parsel;
line_select_mode = o.lineSelect;
return new Promise((Y,N)=>{

	filename=fname;
	let if_dump = o.DUMP;
	let func;
	lines=[];
	line_colors = [];
	if (!if_dump) {
		this.stat_input_type = false;
		scroll_search_str = null;
		scroll_search_dir = null;
		scroll_num = 0;
		y=0;
		scroll_fname = fname;
		less.cb = Y;
		less.fname = fname;
		num_stat_lines = 1;
	}
/*«
	if (type=="man") {
		fmt_man_roff(linesarg, ret=>{
			if (if_dump){
				cb(ret);
			}
			else {
//				termobj.hold_lines();
				set_lines(true);
			    termobj.init_pager_mode(less, num_stat_lines);
				render();
			}
		}, o);
	}
	if (type=="termdump"){
		let arr = linesarg.split("\n");
		raw_lines=[];
		for (let i = 0; i < arr.length; i++) raw_lines[i] = arr[i].split("");
		arr = fmt_man_termdump(linesarg.split("\n"));
		fmt_lines=[];
		for (let i = 0; i < arr.length; i++) fmt_lines[i] = arr[i].split("");
		lines = raw_lines;
		less.fname = `${filename} -raw-`;
		set_lines(true);
		termobj.init_pager_mode(less, num_stat_lines);
		render();
	}
»*/
	less.fname = filename;
	lines=[];
	wrap_lines(linesarg);
	hold_screen_state = termobj.initNewScreen(less, appclass, lines, line_colors, num_stat_lines, {onescape, onreload:()=>{quit(true);}});
	render();
});

}//»
this.addLines=(linesarg)=>{//«
	if (isStr(linesarg)) linesarg = linesarg.split("\n");
	if (isArr(linesarg)) {
		wrap_lines(linesarg);
	}
	else if (isEOF(linesarg)) {
		return;
	}
	else {
cwarn("WHAT KINDA LINESARGGGGG????");
log(linesarg);
return;
	}
	render();
};//»

}











/*Unused: man pages formatting«

const justify = (arg,len,start)=>{//«
	let out;
	if (arg.split) {
		let MIN_LN_WID=len-ALLOWED_EXTRA_SPACES;
		if (MIN_LN_WID <= 0) MIN_LN_WID = ALLOWED_EXTRA_SPACES;
		let words = arg.split(/ +/);
		out = [];
		let ln="";
		for (let i=0; i < words.length; i++){
			let w = words[i];
			let s = `${ln} ${w}`;
			if (s.length > len){
				out.push(ln);
				ln=w;
			}
			else if (ln) ln = s;
			else ln = w;
		}
		out.push(ln);
	}
	else {
		out = arg;
	}

	let finalResult=[];
	for (var i = 0; i < out.length - 1; i++){    
		if(out[i].indexOf(' ') != -1){  
			while(out[i].length < len){      
				for(var j=0; j < out[i].length-1; j++){
					if(out[i][j] == ' '){
						out[i] = out[i].substring(0, j) + " " + out[i].substring(j);
						if(out[i].length == len) break;
						while(out[i][j] == ' ') j++;
					}
				}
			}      
		}    
		finalResult.push(out[i]);    
	}
	finalResult.push(out.pop());
	if (start){
		let all=[];
		for (let ln of finalResult) all.push(`${start}${ln}`);
		return all;
	}
	return finalResult;

};//»
const fmt_man_termdump=(lns)=>{//«

//let lns = str.split("\n");
let cur_indent;
let in_body=false;
let in_synopsis=false;
let par;
let cur_sp_len;
let all = [];
for (let ln of lns){
	let splen = ln.match(/^(\x20*)/)[1].length;
	if (!in_body) {
		if (ln=="NAME"){
			all.push(ln);
		}
		else if (ln=="SYNOPSIS"){
			all.push(ln);
			in_synopsis=true;
		}
		else if (ln.match(/^[A-Z]+( [A-Z]+)*$/)) {
			all.push(ln);
			in_body=true;
		}
		else if (ln){
			if (splen===8&in_synopsis){
				cur_sp_len = splen;
				if (!par) par=[];
				ln = ln.replace(/^\x20{8}/,"");
				ln = ln.replace(/([,;]) +/g,"$1");
				let arr = ln.split(" ");
				par = par.concat(arr);

			}
			else all.push(ln);
		}
		else {
			if (par){
				let arr = [];
				for (let ln of par) arr.push("\xa0".rep(cur_sp_len)+(ln.replace(/([,;])/g,"$1 ")));
				arr.push(" ");
				all.push(...arr);
				par=null;
			}
			else all.push(" ");
		}
	}
	else {
		if (splen===8||splen==4||splen==2){
			cur_sp_len = splen;
			if (!par) par=[];
			let newln = ln.replace(/^\x20+/,"");
			par.push(newln);
		}
		else if (!splen){
			if (par){
				let usew = termobj.w-cur_sp_len-10;
				if (usew > 80) usew = 80;
				let rv = justify(par.join(" "), usew, "\xa0".rep(cur_sp_len));
				all = all.concat(rv);
				all.push(" ");
			}
			else all.push(ln);
			par=null;
		}
		else {
			all.push(ln);
		}	
	}
}
return all;

};//»
function fmt_man_roff(linesarg,cb, opts) {//«
	let if_get_lines = opts.DUMP;
	let usew = opts.USEW;
	if (!usew) usew = w;
	let line=[];
	let chnum = 0;
	let linenum = 0;
	let name = globals.name.NAME;
	let short_name = globals.name.ACRONYM;
	let version = globals.name.VERSION;
	let HEADER_STR = name+" User Manual ";
	let SYS_NAME_STR= short_name + " " + version;
	let HEADER_LEN = HEADER_STR.length;
	let HEADER_LEN_HALF = Math.floor(HEADER_LEN/2);
	let DATE_STR="MM/DD/YYYY";
	let marr;
	let arr;
	let TITLE;//Dt
	let cur_indent;
	let iter = 0;
	let did_cb = false;
	let _lines;
	let is_err = false;
	if (if_get_lines) _lines = [];
	else _lines = lines;

	function err(str) {//«
		let mess = "fmt_man: " + str + " (line "+(iter+1)+")";
		if (if_get_lines) line.push(...mess);
		else stat_message = "fmt_man: " + str + " (line "+(iter+1)+")";
		br();
		iter = linesarg.length;
		is_err = true;
	}//»
	function br() {//«
		if (!line.length) {
			_lines.push([" "]);
			linenum++;
		}
		else {
			_lines.push(line);
			linenum++;
		}
		line = [];
		chnum=0;
	}//»
	function footer(){//«
		if (is_err) return;
		let str1 = SYS_NAME_STR;
		let str2 = TITLE;
		br();br();
		let num = Math.floor(usew/2)-(str1.length)-Math.floor(DATE_STR.length/2)-2;
		line.push(...str1);
		line.push(...(" ".rep(num)));
		line.push(...DATE_STR);
		if (line.length + num + str2.length >= usew) num--;
		else if (line.length + num + str2.length < usew-1) num++;
		line.push(...(" ".rep(num)));
		let diff = usew - (line.length + str2.length);
		if (diff > 0) line.push(" ".rep(diff));
		else if (diff < 0) for (let i=0; i > diff; i--) line.pop();
		line.push(...str2);
		br();
	}//»
	function header(str) {//«
		let num = Math.floor(usew/2)-(str.length)-HEADER_LEN_HALF-2;
		line.push(...str);
		line.push(...(" ".rep(num)));
		line.push(...HEADER_STR);
		if (line.length + num + str.length >= usew) num--;
		else if (line.length + num + str.length < usew-1) num++;
		line.push(...(" ".rep(num)));
		let diff = usew - (line.length + str.length);
		if (diff > 0) line.push(" ".rep(diff));
		else if (diff < 0) for (let i=0; i > diff; i--) line.pop();
		line.push(...str);
	}//»
	function doindent() {//«
		while(chnum < cur_indent && chnum < usew) {
			line.push(" ");
			chnum++;
		}
		if (chnum >= usew) {
			err("doindent(): FELL OFF THE END" + cur_indent);
		}
	}//»
	function putword(val) {//«
		val = val.replace(/\\-/g, "-");
		if (chnum + val.length+1 >= usew) br();
        val = val + " ";
		doindent();
		let iter = 0;

		while(chnum < usew) {
			let ch = val[iter];
			if (!ch) break;
			line.push(val[iter]);
			chnum++;
			iter++;
		}
		if (chnum >= usew) {
			err("putword(): FELL OFF THE END: " + val);
		}
	}//»
	function putch(ch, if_abut) {//«
		if (chnum + 1 >= usew) br();
		doindent();
		if (if_abut && line[line.length-1]==" ") line[line.length-1] = ch;
		else {
			line.push(ch);
			chnum++;
		}
	}//»
	function putwords(str) {//«
		let words = str.split(/ +/);
		for (let word of words) putword(word);
	}//»

	function doline(){//«
		let ln = linesarg[iter];
		ln = ln.replace(/\s+$/,"");
		if (cur_indent==0) cur_indent = 6;
		if (!ln){}
		else if (marr = ln.match(/^.Dd (.+)$/)) DATE_STR = marr[1];
		else if (marr=ln.match(/^.Dt ([-a-zA-Z_]+) (\d+)$/)) {
			TITLE = marr[1]+"("+marr[2]+")";
			scroll_fname = "Manual page " + TITLE.toLowerCase();
			header(TITLE);
		}
		else if (marr = ln.match(/^.Dt (.+)$/)) {
			arr = marr[1].split(" ");
			let number = arr.pop();
			if (!number.match(/^\d+$/)) err(".Dt: No number!?!?!");
			if (!arr.length) err("No name?!?!?");
			TITLE = arr.join(" ");
			scroll_fname = "Manual page " + TITLE.toLowerCase();
			header(TITLE);
		}
		else if (marr = ln.match(/^.Nm (.+)$/)) {
			name = marr[1];
			putword(name);
		}
		else if (ln==".Nm") {
			if (!name) err(".Nm No name");
			putword(name);
		}
		else if (marr=ln.match(/^.Ar (.+)$/)) {
			putword(marr[1]);
		}
		else if (marr=ln.match(/^.Op (Ar)? (.+)$/)) {
			putch("[");
			putword(marr[2]);
			putch("]", true);
		}
		else if (ln == ".Pp") {
			br();
			br();
			cur_indent = 6;
		}
		else if (marr=ln.match(/^.Dl (.+)$/)) {
			cur_indent = 12;
			putwords(marr[1]);
		}
		else if (marr=ln.match(/^.Ev (.+)$/)) {
			putwords(marr[1]);
		}
		else if (marr=ln.match(/^.Nd (.+)$/)) {
			putwords(" -- " + marr[1]);
		}
		else if (marr=ln.match(/^.Ql ([^,]+)( ,)?$/)) {
			let words = "'"+marr[1]+"'";
			if (marr[2]) words = words+",";
			putwords(words);
		}
		else if (marr=ln.match(/^.Xr ([-a-zA-Z_]+) (\d+)( .)?$/)) {
			let name = marr[1];
			let num = marr[2];
			let word = name+"("+num+")";
			if (marr[3]) word += marr[3].trim();
			putword(word);
		}
		else if (marr = ln.match(/^.Sh (.+)$/)) {
			br();
			br();
			cur_indent = 0;
			putword(marr[1]);
			br();
		}
		else if (marr = ln.match(/^.At (v\d+)( [,.])?$/)) {
			let str = "VERSION ? AT&T UNIX";
			if (marr[2]) str += marr[2]
			putwords(str);
		}
		else if (ln.match(/^[a-zA-Z]/)) {
			putwords(ln);
		}
		else if (ln==".Os") {
		}
		else if (ln.match(/^[ \t]+$/)) log("Spaces...");
		else err("What kind of line: '" + ln + "'");
		iter++;
		if (iter>=linesarg.length){
			footer();
			if (if_get_lines) cb(_lines);
			else cb();
			return;
		}

		if (iter < termobj.h || if_get_lines) doline();
		else if (iter%termobj.h) doline();
		else setTimeout(doline,0);

	}//»
	doline();
}//»

»*/


