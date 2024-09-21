/* Getting yt-dlp (recommended over youtube-dl)«

From: https://github.com/yt-dlp/yt-dlp#using-the-release-binary

sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
	-o /usr/local/bin/yt-dlp
~or~
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
	-O /usr/local/bin/yt-dlp

then
sudo chmod a+rx /usr/local/bin/yt-dlp

Updating: 
sudo yt-dlp -U

»*/
/*Notes«

Trick args: "--ffmpeg-location", "/blah/place/weird/hahahaha", 

youtube-dl / yt-dlp tries to find ffmpeg at --ffmpeg-location but when it
cannot find it there, it thinks ffmpeg doesn't exist, and so can't (won't try
to) "correct" the DASH/m4a container. THE REASON FOR THIS IS BECAUSE WE HAVE ALL OF
THE PARTS ALREADY IN THE BROWSER, AND WE MIGHT BE DOING A RESUME OF A BIG, LONG
DOWNLOAD THAT HAS A BUNCH OF TRASH/NULL BYTES IN IT! I DON'T KNOW YET WHAT
FFMEG IS DOING TO THE FILE, AND I DON'T CARE BECAUSE THIS IS ALL ABOUT BROWSERS
AND THE WEB WHICH IS WHAT THE DASH (Dynamic Adaptive Streaming over HTTP)
FORMAT IS ALL ABOUT!


Optimize for speed by saving onto /dev/shm. If there is a long download that is interrupted
and the computer is turned off, this will obviously go away. 

So, if we send a "suspend" command to the server, we should have the option to persist it to
a permanent location somewhere.

But, the blobs can the saved in the client (maybe indexedDb). So the client
knows how much it has, and can just tell the server at what byte to resume
from. All we need to do here is create an empty ".part" file that is filled
with the relevant number of random/null bytes. This assumes that there is no
kind of whole file checksum being done (CORRECT ASSUMPTION AT THE MOMENT).

To create empty files

$ truncate -s <num> filename // reduce size to num bytes. This can also extend the file.
$ fallocate -l <num> filename // extend file to num bytes (no truncation if file is larger)

»*/

const COMMANDS = ["yt-dlp", "youtube-dl"];
//const COMMANDS = ["youtube-dl"];

//Imports«

const http = require('http');
const child_process = require('child_process');
const spawn = child_process.spawn;
const spawnSync = child_process.spawnSync;
const WebSocketServer = require('ws').WebSocketServer;
const fs = require('fs');
const path = require('path');
const os = require('os');

//»
//Var«

const SERVICE_NAME = "ytdl";
const hostname = "localhost";
let portnum = 20003;

let COMMAND;

let use_tmp = os.tmpdir();
//let use_tmp="/dev/shm";
/*Test for /dev/shm???«
try{
	let dev_shm = "/dev/shm";
    fs.statSync(dev_shm);
    use_tmp = dev_shm;
}
catch(e){use_tmp = os.tmpdir()};
»*/

/*Formats//«

https://gist.github.com/AgentOak/34d47c65b1d28829bb17c24c04a0096f

GEPOUBD 



DASH Audio Formats//«
Code	Container	Audio Codec		Audio Bitrate		Channels			Still offered?

139		MP4			AAC (HE v1)		48 Kbps				Stereo (2)			Rarely, YT Music
140		MP4			AAC (LC)		128 Kbps			Stereo (2)			Yes, YT Music
(141)	MP4			AAC (LC)		256 Kbps			Stereo (2)			No, YT Music*

249		WebM		Opus			(VBR) ~50 Kbps		Stereo (2)			Yes
250		WebM		Opus			(VBR) ~70 Kbps		Stereo (2)			Yes
251		WebM		Opus			(VBR) <=160 Kbps	Stereo (2)			Yes

256		MP4			AAC (HE v1)		192 Kbps			Surround (5.1)		Rarely
258		MP4			AAC (LC)		384 Kbps			Surround (5.1)		Rarely
327		MP4			AAC (LC)		256 Kbps			Surround (5.1)		?*
338		WebM		Opus			(VBR) ~480 Kbps (?)	Quadraphonic (4)	?*
//»

DASH Video formats//«
Resolution	AV1 HFR High	AV1 HFR		AV1		VP9.2 HDR HFR	VP9 HFR		VP9		H.264 HFR	H.264
			MP4				MP4			MP4		WebM			WebM		WebM	MP4			MP4
4320p						402/571								272								138
2160p		701				401					337				315			(313)	(305)		(266)
1440p		700				400					336				308			(271)	(304)		(264)
1080p		699				399					335				303			(248)	299			(137)
720p		698				398					334				302			247		298			136
480p		697							397		333							244					135
360p		696							396		332							243					134
240p		695							395		331							242					133
144p		694							394		330							278					160
//»

//»*/
//Different combinations of specifying the preference order of the 6 major audio formats//«

//Order by quality, then container

let highest_to_lowest_MP4_first="141/251/140/250/139/249";
let highest_to_lowest_WebM_first="251/141/250/140/249/139";
let lowest_to_highest_MP4_first="139/249/140/250/141/251";
let lowest_to_highest_WebM_first="249/139/250/140/251/141";

//Order by container, then quality

let MP4_then_WebM_highest_to_lowest="141/140/139/251/250/249";
let MP4_then_WebM_lowest_to_highest="139/140/141/249/250/251";
let WebM_then_MP4_lowest_to_highest="249/250/251/139/140/141";
let WebM_then_MP4_highest_to_lowest="251/250/249/141/140/139";
let WebM_highest_to_lowest="251/250/249";
let WebM_lowest_to_highest="249/250/251";

let MP4_640x360 = "18";
//18  mp4   640x360 

//»

//let FORMAT_LIST = highest_to_lowest_MP4_first;
//let FORMAT_LIST = WebM_lowest_to_highest;
let FORMAT_LIST = MP4_640x360;

//»
//Args«

try{
	let arg2 = process.argv[2];
	if (arg2){
		portnum = parseInt(arg2);
		if (isNaN(portnum)||portnum>65535) throw "Invalid port argument: " + arg2;
		else if (portnum < 1025) throw "Unsafe port argument: " + arg2;
	}
	if (process.argv[3]) throw "Too many arguments";
}
catch(e){
	console.log(e);
	return;
}

//»
//Funcs«

const log = (...args)=>{console.log(...args);}

const header=(res, code, mimearg)=>{//«
    let usemime = "text/plain";
    if (mimearg) usemime = mimearg;
    if (code == 200) {
        res.writeHead(200, {'Content-Type': usemime, 'Access-Control-Allow-Origin': "*"});
    }
    else res.writeHead(code, {'Content-Type': usemime, 'Access-Control-Allow-Origin': "*"});
}//»
const nogo=(res, mess)=>{//«
	header(res, 404);
	if (!mess) mess = "NO";
	res.end(mess+"\n");
}//»
const okay=(res, usemime)=>{//«
    header(res, 200, usemime);
}//»
const exitHandler=(opts, exitCode)=>{//«
//log("GOTEXIT");	
//    if (exitCode || exitCode === 0) console.log(exitCode);
//    if (options.exit) process.exit();
	if (opts.cleanup) {
//log("Running 'rm -rf /tmp/ytdl-*'");
//		child_process.execSync("rm -rf /tmp/ytdl-*");
	}
	process.exit();
}//»

process.on('exit', exitHandler.bind(null,{cleanup:true}));
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//»
const handle_request=(req,res)=>{//«

let meth = req.method;
let body, path, enc, pos;
let marr;
let url_arr = req.url.split("?");
let len = url_arr.length;
//if (len==0||len>2) return nogo(res);
let url = url_arr[0];
let args = url_arr[1];
let arg_hash={};
if (args) {//«
	let args_arr = args.split("&");
	for (let i=0; i < args_arr.length; i++) {
		let argi = args_arr[i].split("=");
		let key = argi[0];
		let val = argi[1];
		if (!val) val = false;
		arg_hash[key] = val;
	}
}//»
if (meth=="GET"){
	if (url=="/") {//«
		okay(res);
		res.end(SERVICE_NAME);
	}//»
	else nogo(res);
}
else if (meth=="POST") nogo(res);
else nogo(res);

}//»

const init=()=>{//«

const server = http.createServer(handle_request).listen(portnum, hostname);

const wss = new WebSocketServer({ server });

wss.on('connection', ws=>{
const cleanup=()=>{//«
	if (part_path) try{fs.unlinkSync(part_path)}catch(e){}
	if (file_path) try{fs.unlinkSync(file_path)}catch(e){}
	if (tmpdir) try{fs.rmdirSync(tmpdir)}catch(e){}
};//»
let tmpdir;
let ac;
let file_path;
let part_path;
let vidid;
let did_abort;
let resume_byte;
let resume_fname;
ws.on('message', data=>{//«

let mess = data.toString();
let marr;
let if_name_only = false;
if (marr=mess.match(/^FILEPATH:(.+)\n?$/)){
	file_path = marr[1];
	part_path = `${file_path}.part`;
log("Got path",file_path);
	return;
}
if (marr = mess.match(/^VID(_NAME)?:([-_a-zA-Z0-9]{11}) ?(.+)?$/)){

did_abort = false;
if_name_only = marr[1];
vidid = marr[2];
if (marr[3]) {
	let arr = marr[3].split(" ");
	resume_fname = arr[0];
	resume_byte = parseInt(arr[1]);
	if (!Number.isFinite(resume_byte)){
		throw new Error("Bad resume_byte string: "+arr[1]);
	}
//	cur_off = resume_byte;
}
log(`Get vid: '${marr[2]}'`);


fs.mkdtemp(path.join(use_tmp, 'ytdl-'), (err, directory) => {

if (err) {
	log("Could not create temporary directory... aborting!");
	process.exit();
	return;
}
tmpdir = directory;
let fulltmppath;
if (resume_fname){//«
	let fulltmppath = `${tmpdir}/${resume_fname}.part`;
log(`Resuming to ${fulltmppath} @ ${resume_byte}`);
	fs.writeFileSync(fulltmppath, `RESUME AT: ${resume_byte}`)
	spawnSync("truncate", ["-s", ""+resume_byte, fulltmppath]);	
}//»

{//«

//let template = `${tmpdir}/%(title)s_%(format_id)s.%(ext)s`;
let template = `${tmpdir}/%(title)s-%(format_id)s.%(ext)s`;
ac = new AbortController();
let { signal } = ac;

let cur_off = 0;
if (resume_byte) cur_off = resume_byte;
//XXXXXXXXXXXXXXXXXXXXX
let com = spawn(COMMAND, 
[
//	"--get-duration",
//	"--get-thumbnail",
//	"--get-title",
//	"--get-description",

//	"-j",
//	"--no-simulate",

	"-f", FORMAT_LIST, 
	"--ffmpeg-location", "/blah/place/weird/hahahaha",
	"--restrict-filenames",
	"--newline",
	"-o", template,
	"--",
	vidid
], {
	signal
});
//let com = spawn(COMMAND, ["-f", FORMAT_LIST, "--restrict-filenames" , "--newline", "-o", template ,vidid], {signal});
//let com = spawn(COMMAND, ["-f", "141/251/140/250/139/249", "--restrict-filenames" , "--newline", "-o", template ,vidid], {signal});
//let path;
let fd;
const read=path=>{//«
	if (!path) return;
	let stats = fs.statSync(path);
	if (!fd) fd = fs.openSync(path);
	let sz = stats.size - cur_off;
	if (sz < 1) return;
	let buf = Buffer.alloc(sz);
	fs.readSync(fd, buf, 0, sz, cur_off)
	cur_off = stats.size;
	ws.send(buf);
};//»
com.stdout.on('data',dat=>{//«

let str = dat.toString();
let marr;
if (str.match(/^\[download\]/)) {
log(str.replace("\n",""));
if (marr = str.match(/(Destination: (\/tmp\/.+))\n?$/)) {//«
	file_path = marr[2];
//	file_path = path;
	part_path = `${file_path}.part`;
	let fname = file_path.split("/").pop().replace("\n","");
	if (resume_fname && fname !== resume_fname){
		ws.send(JSON.stringify({err: `Received filename (${fname}) !== resumename (${resume_fname})`}));
		ac.abort();
		did_abort = true;
		return;
	}
	ws.send(JSON.stringify({name: fname, resume: !!resume_fname}));
	if (if_name_only) {
		ac.abort();
		did_abort = true;
		return;
	}
}//»
else{
	if (did_abort) return;
	ws.send(JSON.stringify({out: str}));
	try {
		read(part_path);
		return;
	}
	catch(e){
//		log("Caught", e);
	}
	try{
		read(file_path);
		return;
	}
	catch(e){
//		log("Caught", e);
	}
}


}
ws.send(JSON.stringify({out: str}));
});//»
com.stderr.on('data', (dat) => {//«
	ws.send(JSON.stringify({err: dat.toString()}));
});//»
com.on('error',(e)=>{//«

ws.send(JSON.stringify({err: e.message}));
if (e.constructor.name !== "AbortError"){
log("SPAWN ERROR!?!?!");
log(e);
}

});//»
com.on('close',(code)=>{//«
	if (did_abort) return;
//log(`Closed with code: ${code}`);
	try{
		read(file_path);
	}
	catch(e){
//		log("Caught", e);
	}
});//»
com.on('exit',(code)=>{//«
	if (did_abort) return;
//log(`Exited`);
	ws.send(JSON.stringify({done: true}));
});//»

}//»

});
}
else if (mess==="Abort"){
	if (ac) {
		ac.abort();
		did_abort = true;
	}
	cleanup();
}
else if (mess==="Cleanup"){
log("Received 'Cleanup' message");
	cleanup();
}
else{
	log("???",mess);
}
});//»
});
log(`${SERVICE_NAME} service listening at ws://${hostname}:${portnum}`);
log(`Requesting formats: ${FORMAT_LIST}`);

}//»

//Startup«

//child_process.execSync("rm -rf /tmp/ytdl-*");

if (process.env.LOTW_TEST) {
	COMMAND = COMMANDS[0];
	init();
}
else {
const start = async()=>{
	const trycom = ()=>{
		return new Promise((Y,N)=>{
			let com = spawn(COMMAND, ["--version"]);
			log(`Checking for '${COMMAND} --version'...`);
			com.stdout.on('data',dat=>{
log("OK: "+dat.toString().replace(/\n$/,""));
				Y(true);
			});
			com.stdout.on('error',e=>{
				log("Error",e);
			});
			com.on('error',(e)=>{
				Y();
			});
		});
	};
	for (let i=0; i < COMMANDS.length; i++){
		COMMAND = COMMANDS[i];
		if (await trycom()) return init();
	}
	log("Not found... aborting!");
	process.exit();
};
start();
}
//»

