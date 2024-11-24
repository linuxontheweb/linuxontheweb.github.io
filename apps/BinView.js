const util = LOTW.api.util;
const globals = LOTW.globals;
//import { util, api as capi } from "util";
//import { globals } from "config";
const{NS}=globals;
const{log,cwarn,cerr, make, mkdv}=util;

const{popin}=globals.api.widgets;

//log(popin);

export const app = function(Win) {

//Var«

const {Main, Desk} = Win;

let MAX_PG_SZ = 25000;
let lines;
let text_lines;
let bin_lines;
let bytes;
let nb, nb_len;
let nb_done;
let nlns;
let text_mode = false;
let y=0, scroll_num=0;
let w,h;
let ch_w;
let nrows,ncols;

let FF = "monospace";
let FW = "500";
let CURBG = "#00f";
let CURFG = "#fff";
let OVERLAYOP = "0.42";
let TCOL = "#e3e3e3";
let is_loading = false;
let stop_loading = false;
let did_stop_loading;
let check_stop_loading_interval;

let killed = false;
let start_byte;
let char_w;

let BASE=10;
let is_going_to = false;
let mouse_mode = false;

//»

//DOM«

let wrapdiv = make('div');
wrapdiv._bgcol="#000";
wrapdiv._pos="absolute";
//wrapdiv._loc(0,0);
//wrapdiv._r = 0;
wrapdiv._tcol = TCOL;
wrapdiv._fw = FW;
wrapdiv._ff = FF;
wrapdiv._fs=21;

wrapdiv.webkitFontSmoothing="antialiased";

wrapdiv.style.whiteSpace = "pre";

Main.appendChild(wrapdiv);
//log(wrapdiv);
let tabdiv = make('div');
//tabdiv._padl="100px";
//tabdiv._w="100%";
tabdiv.style.userSelect = "text"
tabdiv._pos="absolute";
tabdiv.onclick=e=>{
    e.stopPropagation();
    setTimeout(_=>{
        if (window.getSelection().isCollapsed) textarea.focus();
    },10);
}
tabdiv._r=0;
//log(wrapdiv);
tabdiv.style.tabSize = 4;

let numdiv = make('div');
numdiv._pos="absolute";
numdiv._loc(0,0);
numdiv._w=100;
numdiv._h="100%";
numdiv._over="hidden";
//numdiv._bgcol="#002";
wrapdiv.appendChild(numdiv);

wrapdiv.tabdiv = tabdiv;
wrapdiv.appendChild(tabdiv);

let textarea = make('textarea');//«
textarea.id = `textarea_${Win.id}`;
textarea.width = 1;
textarea.height = 1;
textarea.style.opacity = 0;
let areadiv = make('div');
areadiv._pos="absolute";
areadiv._loc(0,0);
areadiv._z=-1;
areadiv.appendChild(textarea);
this.areadiv = areadiv;
this.textarea = textarea; 
Main._tcol="black";
Main._bgcol="black";
Main._fs=19;
Main.appendChild(areadiv);
textarea.focus();
//»

const statbar = Win.statusBar;
statbar._w="100%";
statbar._dis="flex";
statbar.style.justifyContent="space-between";

const messdiv=mkdv();
const loaddiv = mkdv();
const perdiv=mkdv();
perdiv._padr=5;
statbar._add(messdiv, loaddiv, perdiv);

//»

//Funcs«

const stat=(opts={})=>{//«
	messdiv.innerText='Spacebar toggles ascii view. Use the arrow/paging keys to scroll';
	if (is_loading) loaddiv.innerText=`Loading: ${Math.floor(100*(nb_done/nb))}%`;
	else if (opts.go_to) loaddiv.innerHTML=opts.go_to.toString(BASE);
	else loaddiv.innerText="";
	let from = scroll_num * (ch_w);
	let to = (scroll_num + h) * (ch_w);
	if (to > nb) to = nb;
	perdiv.innerText=`${from} - ${to} / ${nb}`;
};//»
const getgrid=()=>{//«
    let tdiv = tabdiv;
    let usech = "X";
    let str = "";
    let iter = 0;
    wrapdiv._over="auto";
    while (true) {
        if (Win.killed) return;
        str+=usech;
        tdiv.innerHTML = str;
        if (tdiv.scrollWidth+100 > wrapdiv._w) {
            tdiv.innerHTML = usech.repeat(str.length-1);
//            wrapdiv._w = tdiv.clientWidth;
            ncols = str.length - 1;
			char_w = Math.floor(ncols/3)
            break;
        }
        iter++;
        if (iter > 10000) {
log(wrapdiv);
            cwarn("INFINITE LOOP ALERT DOING WIDTH: " + tdiv.scrollWidth + " > " + w);
            return
        }
    }
    str = usech;
    iter = 0;
    while (true) {
        tdiv.innerHTML = str;
        if (tdiv.scrollHeight > wrapdiv._h) {
            let newarr = str.split("\n");
            newarr.pop();
            tdiv.innerHTML = newarr.join("\n");
            wrapdiv._h = tdiv.clientHeight;
            nrows = newarr.length;
            break;
        }
        str+="\n"+usech;
        iter++;
        if (iter > 100000) {
log(wrapdiv);
            return cwarn("INFINITE LOOP ALERT DOING HEIGHT: " + tdiv.scrollHeight + " > " + h);
        }
    }
    tdiv.innerHTML="";
    wrapdiv._over="hidden";
}//»
const render=(opts={})=>{//«
	let {fast, go_to}=opts;
	if (text_mode) lines = text_lines;
	else lines = bin_lines;
	if (!lines) return;
	let usescroll = scroll_num;
	let scry = usescroll;
	let slicefrom = scry;
	let sliceto = scry + nrows;
	let uselines=[];
	numdiv.innerHTML="";
	tabdiv.innerHTML="";
	let from = scroll_num * (ch_w);
	let lnno = 0;
	for (let i=slicefrom; i < sliceto; i++) {
		let ln = lines[i];
		if (!ln) uselines.push([""]);
		else {
			let newln = ln.slice(0,w);
			uselines.push(newln);
		}
		let ndv = make('div');
		ndv.innerHTML=(((scroll_num + lnno) * (ch_w)).toString(BASE)).padStart(nb_len, "0");
		numdiv._add(ndv);
		lnno++;
	}
	let outarr = [];
	let len = uselines.length;
	let donum = len;
	let iter=0;
	for (let i = 0; i < donum; i++) {
		let arr = uselines[i];
		let ind;
		let ln = arr.join("");
		if (fast){
			outarr.push(ln);
		}
		else {
			let lnarr = ln.split(" ");
			lnarr.pop();
			let lndv = mkdv();
			for (let n of lnarr){
				let nsp = make("span");
				nsp._which = iter+from;
				if (go_to){
					if (iter+from===go_to){
						nsp._bgcol="#fcc";
						nsp._tcol="#000";
						nsp._fw="bold";
					}
				}
				if (mouse_mode) {
					nsp.onmouseover=()=>{
						loaddiv.innerHTML=nsp._which.toString(BASE);
						nsp._bgcol="#ccc";
						nsp._tcol="#000";
						nsp._fw="bold";
					};
					nsp.onmouseout=()=>{
						loaddiv.innerHTML="";
						nsp._bgcol="";
						nsp._tcol="";
						nsp._fw="";
					};
				}
				nsp.innerHTML = n+"&nbsp;";
				lndv.appendChild(nsp);
				iter++;
			}
			tabdiv.appendChild(lndv);
		}
	}
	if (fast) tabdiv.innerText = outarr.join("\n");
	stat({go_to});
};//»
const make_lines=(which)=>{//«
	if (is_loading) return;
	bin_lines=[];
	text_lines=[];
	let _pgsz = ch_w*h;
	let pgsz = _pgsz;
	while (pgsz < MAX_PG_SZ) pgsz += _pgsz;
	let i=0;
	let finished = false;
	is_loading = true;
	nb_done = i;
	const dopage=()=>{
		if (stop_loading){
			did_stop_loading = true;
			return;
		}
		if (killed) return;
		let to = i+pgsz;
		if (to >= nb) {
			to = nb;
			finished = true;
		}
		stat();
		for (; i < to; i+=ch_w){
			nb_done = i;
			let binln=[];
			let txtln = [];
			for (let j=i; j < i+ch_w; j++){
				if (j >= nb) break;
				let byt = bytes[j];
				let binch = byt.toString(16).lpad(2,"0")
				binln.push(binch[0],binch[1]," ")
				if (byt >= 33 && byt <= 126) txtln.push(String.fromCharCode(byt),"\xa0"," ");
				else txtln.push("\xa0","\xa0"," ");
			}
			text_lines.push(txtln);
			bin_lines.push(binln);
		}
		if (finished) {
			is_loading = false;
			stat();
			if (start_byte){
				scroll_num = Math.floor(start_byte/Math.floor(ncols/3));
				render();	
			}
		}
		else {
			setTimeout(()=>{
				dopage();
			},0);
		}
	}
	dopage();
	render();
};//»

const resize=(if_init)=>{//«
	if (!lines) return;
	start_byte = char_w*scroll_num;
	let char_w_hold = char_w;
	wrapdiv._w=Main.clientWidth;
	wrapdiv._h=Main.clientHeight;
    ncols=nrows=0;
	getgrid();
	if (char_w === char_w_hold) return render();
	if (check_stop_loading_interval) {
		clearInterval(check_stop_loading_interval);
		check_stop_loading_interval = null;
	}
	if (!is_loading) return reinit();
	did_stop_loading = false;
	stop_loading = true;
	check_stop_loading_interval = setInterval(()=>{
		if (did_stop_loading){
			clearInterval(check_stop_loading_interval);
			check_stop_loading_interval = null;
			did_stop_loading = false;
			stop_loading = false;
			reinit();
		}
	}, 0);
};//»
const reinit=()=>{//«
	is_loading = false;
	tabdiv.innerHTML="";
	init();
}//»
const init = () =>{//«
	y=0;
	scroll_num=0;
	wrapdiv._w=Main.clientWidth;
	wrapdiv._h=Main.clientHeight;
    ncols=nrows=0;
    getgrid();
    if (!(ncols&&nrows)) return;
    w = ncols;
    h = nrows;
	ch_w = Math.floor(ncols/3);
	make_lines();
};//»
const goto_num = async()=>{//«
	if (is_going_to) return;
	is_going_to = true;

	let num = await popin(`Goto: 0-${nb-1}`, {enterOK: true});
	is_going_to = false;
	if (!num) return;
	num = parseInt(num);
	if (isNaN(num)) return;
	if (num<0) num=0;
	else if (num > nb-1) num = nb-1;
	scroll_num = Math.floor(num/ch_w);
	render({go_to: num});
}/*»*/

//»

//CBs«

this.onresize=resize;
this.onloadfile=arg=>{//«
	start_byte = 0;
	bytes=arg;
	nb = bytes.length;
	nb_len = (nb.toString(BASE)).length;
	init();
};//»
this.onkill = () => {//«
	killed = true;
	lines = text_lines = bin_lines = null;
	if (check_stop_loading_interval){
		clearInterval(check_stop_loading_interval);
	}
};//»
this.onkeyup=(e,k)=>{
	if (["DOWN_","UP_","PGDOWN_","PGUP_"].includes(k)) render();
};
this.onkeydown=(e,k)=>{//«
	if (k=="DOWN_"){
		if(scroll_num+1+h>lines.length)return;
		scroll_num++;
		render({fast:true});
	}
	else if (k=="UP_"){
		if (scroll_num > 0) {
			scroll_num--;
			render({fast:true});
		}
	}
	else if(k=="PGDOWN_"){
		if(scroll_num+1+h>lines.length)return;
		scroll_num+=h;
		if (scroll_num+h > lines.length) scroll_num = lines.length-h;
		render({fast:true});
	}
	else if(k=="PGUP_"){
		scroll_num -=h;
		if (scroll_num<0)scroll_num=0;
		render({fast:true});
	}
    else if (k=="HOME_"){
        if (scroll_num == 0 ) return;
        scroll_num=0;
        render();
    }
    else if (k=="END_"){
        if (scroll_num == lines.length-h) return;
        scroll_num = lines.length-h;
        render();
    }
	else if (k=="SPACE_"){
		text_mode = !text_mode;
		render();
	}
	else if (k=="/_"){
		goto_num();
	}
	else if (k=="m_"){
		mouse_mode = !mouse_mode;
		render();
		loaddiv.innerHTML=`Mouse mode: ${mouse_mode}`;
	}
	else if (k=="h_"){
		if (BASE==10) BASE=16;
		else BASE=10;
		nb_len = (nb.toString(BASE)).length;
		render();
	}
	else if (k=="LEFT_"){
	}
	else if (k=="RIGHT_"){
	}
};//»

//»

}

