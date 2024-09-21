//const HOST="0.0.0.0";
const HOST = "localhost";
const HOST_SVC_ROOT = '/usr/local/home/.lotw_writes';
//const PORT = 4443;
const PORT = 8080;
//const PORT = 8081;
//let secure = false;
//let secure = true;
let secure = false;
let imap;
let smtp;

//Import«

const fs = require('fs');
const WebSocketServer = require('ws').WebSocketServer;
const fsprom = require('node:fs/promises');
const https = require('https');
const http = require('http');

const log=(...args)=>{console.log(...args);};

let ws_server, ws_client;

//»
/*
//SSL«
//openssl req -new -x509 -keyout key.pem -out server.pem -days 365 -nodes
const HTTPS_OPTIONS = { 
	key: fs.readFileSync(`${process.env.HOME}/.ssh/key.pem`), 
	cert: fs.readFileSync(`${process.env.HOME}/.ssh/server.pem`), 
};
//»
*/
const EXT_TO_MIME = {//«
	js: "application/javascript",
	json: "application/javascript",
	html: "text/html",
	css: "text/css",
	txt: "text/plain",
	mp4: "video/mp4",
	webm: "video/webm",
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	ico: "image/vnd",
	gz: "application/gzip",
	wav: "audio/wav"
}//»
const DEF_MIME = "application/octet-stream";

const get_post_data = (req) => {//«
	return new Promise((Y,N)=>{
		let body = [];
		req.on('data', chunk=>{body.push(chunk);});
		req.on('end', () => {
			Y(Buffer.concat(body));
		});
	});
};//»
const ok = (res, mime) => {//«
	if (!mime) mime = text_mime();
	res.writeHead(200, {'Content-Type': mime});
};//»
const no = (res, arg) => {//«
	res.writeHead(404, {'Content-Type': "text/plain"});
	if (arg.match(/error/i)) res.end(`${arg}\n`);
	else if (arg) res.end(`Error: ${arg}\n`);
	else res.end("Error\n");
};//»
const text_mime = ()=>{return EXT_TO_MIME.txt}

const svc_handler = async(which, args, req, res) => {//«

if (which=="host"){
	if (req.method == "GET"){
		if (args.dir){
			res.end(`dir ${args.dir}`);
		}
		else if (args.file){
			res.end(`file ${args.file}`);
		}
		else{
			no(res, "Unknown GET request");
		}
	}
	else if (req.method == "POST"){
		if (!args.file) return no(res, "Filename not given");
		let dat = await get_post_data(req);
try{
	fs.writeFileSync(`${HOST_SVC_ROOT}/${args.file}`, dat);
	res.end(`Saved '${args.file}' to host (${dat.length} bytes)`);
}
catch(e){
	no(res, `Write error: ${e.message}`);
}
	}
}
else if (which=="smtp"){//«
	if (req.method !== "POST") return no(res, "smtp requires a post body");
	if (!smtp) {
		smtp = require('./svcs/smtp.js');
	}
	if (!args.to) return no(res, "smtp requires a 'to' field");
	let dat = await get_post_data(req);
	let obj = {to: args.to, text: dat.toString()};
	if (args.from) obj.from = args.from;
	if (args.subject) obj.subject = args.subject;
	let rv = await smtp.sendMail(obj);
	if (!rv) return no(res, "smtp returned an empty respose");
	if (rv.error) return no(res, rv.error+"");
	if (!rv.id) return no(res, "smtp returned an unknown respose");
	ok(res);
	res.end(`id: ${rv.id}`);
}//»
else if (which=="imap"){//«
	if (!imap) {
		imap = require('./svcs/imap.js');
	}
	let rv;
	rv = await imap.getMail();
	if (!rv) return no(res, "imap returned an empty respose");
	if (rv.error) return no(res, rv.error+"");
	if (!rv.message) return no(res, "imap returned an unknown respose");
log(rv);
	ok(res);
	res.end(JSON.stringify(rv.message));
}//»
else no(res, `Bad service: ${which}`);

};//»

const handler = async(req, res) => {//«

	let _url = decodeURIComponent(req.url);
	let meth = req.method;
	let mime;

	let url_parts = _url.split("?");//«
	let url = url_parts[0];
	let marr;
	let path;
	let args={};
	if (url_parts[1]) {
		let args_arr = url_parts[1].split("&");
		for (let arg of args_arr){
			let ar = arg.split("=");
			args[ar[0]] = ar[1];
		}
	}
	if (marr=url.match(/^\/_(.+)$/)){
		mime = EXT_TO_MIME.txt;
		svc_handler(marr[1], args, req, res);
		return;
	}

	if (url=="/") path = "./index.html";
	else path = `.${url}`;
	let ext = path.split(".").pop();
	if (!ext) mime = DEF_MIME;
	else mime = EXT_TO_MIME[ext.toLowerCase()];
	if (!mime) mime = DEF_MIME;
//»

if (meth === "GET") {

	if (args.start && args.end) {//«
		let si = parseInt(args.start);
		let ei = parseInt(args.end);
		let diff = ei - si + 1;
		if (Number.isFinite(diff) && diff > 0) {
			let buf = new Uint8Array(diff);
			let fd = await fsprom.open(path);
			let rv = await fd.read(buf, {position: si, length: diff});
			fd.close();
			ok(res, mime);
			res.end(rv.buffer);
		}
		else{
			no(res, "Bad range");
		}
	}//»
	else {//«
		let txt;
		try {
			txt = fs.readFileSync(path);
		}catch(e){
			no(res, "Not found");
			return;
		}
		ok(res, mime);
		res.end(txt);
	}//»

}
else{
	no(res, "Unsupported method");
}

};//»
let server;
if (secure) server = https.createServer(HTTPS_OPTIONS, handler).listen(PORT, HOST);
else {
	server = http.createServer(handler).listen(PORT, HOST);
}
const wss = new WebSocketServer({ server });
wss.on('connection',ws=>{

ws.on('message',data=>{//«

	let mess = data.toString();
	if (mess=="Client"){
		if (!ws_server){
			log('Error: client tried to connect with no server');
			ws.close();
			return;
		}
		if (ws_client){
			log('Error: client already connected');
			ws.close();
			return;
		}
		ws_client = ws;
		log('Client connected');
		return;
	}
	if (mess=="Server"){
		if (ws_server){
			log('Error: server already connected');
			ws.close();
			return;
		}
		ws_server = ws;
		log('Server connected');
		return;
	}

	if (!(ws_server && ws_client)){
		log('Error: client AND server and not BOTH connected');
		return;
	}

	if (ws === ws_server) ws_client.send(data);
	else ws_server.send(data);

});//»

ws.on('close', async()=>{//«
	if (ws === ws_client){
		ws_client = undefined;
		log('Client disconnected');
		return;
	}
	if (ws === ws_server){
		if (ws_client) ws_client.close();
		ws_server = undefined;
		log('Server disconnected');
		return;
	}
});//»

});


log(`Listening on ${HOST}:${PORT}`);


