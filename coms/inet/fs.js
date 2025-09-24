/*9/24/25: This library exists as a suite of tools for internet-based filesystems, using
backends like the Firebase Realtime Database. We will need to integrate with the logic
in sys/fs.js in order to allow for getting directory listings.

We might want to get `class FSNode` (from sys/fs.js) and extend it inside here.

But we might want to spend some time looking at the interfaces for FSNode and all
classes that extend it, in order to refactor it in order to simplify the logic in
coms/fs.js (for file moving, copying, etc).

*/

//Imports«

const{globals}=LOTW;
const {USERS_TYPE, fs, fbase}=globals;
const {Com} = globals.ShellMod.comClasses;
const{mkdv, mk, isArr,isStr,isEOF,log,jlog,cwarn,cerr}=LOTW.api.util;
const{root, mount_tree}=fs;
const {popup} = globals.popup;

//»
//Var«
const firebaseConfig = {
	apiKey: "AIzaSyCEEMw3b1_bWj-OxM9oMKlKhkTTWxbIhlI",
	authDomain: "linuxontheweb.firebaseapp.com",
	databaseURL: "https://linuxontheweb.firebaseio.com",
	projectId: "linuxontheweb",
	storageBucket: "linuxontheweb.firebasestorage.app",
	messagingSenderId: "668423415088",
	appId: "1:668423415088:web:979b40c704cab2322ed4f5"
};

const FBASE_APP_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
const FBASE_AUTH_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
const FBASE_DB_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

//LOGIN_BUTTONS_STR«
const GOOGLE_BUT_ID = "googleSignInBtn";
const GITHUB_BUT_ID = "githubSignInBtn";
const LOGIN_BUTTONS_STR = `
<button name="${GOOGLE_BUT_ID}" class="gsi-material-button">
  <div class="gsi-material-button-state"></div>
  <div class="gsi-material-button-content-wrapper">
    <div class="gsi-material-button-icon">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: block;">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
      </svg>
    </div>
    <span class="gsi-material-button-contents">Sign in with Google</span>
    <span style="display: none;">Sign in with Google</span>
  </div>
</button>
<br><br>
<button name="${GITHUB_BUT_ID}" class="gsi-material-button">
  <div class="gsi-material-button-state"></div>
  <div class="gsi-material-button-content-wrapper">
    <div class="gsi-material-button-icon">

<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.08-.731.084-.716.084-.716 1.192.085 1.816 1.29 1.816 1.29 1.063 1.816 2.784 1.29 3.465.987.108-.767.422-1.29.763-1.59-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.462-2.381 1.229-3.221-.124-.3-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.046.138 3.003.404 2.292-1.552 3.3-.931 3.3-.931.653 1.653.242 2.876.118 3.176.768.84 1.228 1.911 1.228 3.221 0 4.611-2.801 5.625-5.476 5.922.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.196-6.086 8.196-11.386 0-6.627-5.373-12-12-12z"/>
</svg>
    </div>
    <span class="gsi-material-button-contents">Sign in with GitHub</span>
    <span style="display: none;">Sign in with GitHub</span>
  </div>
</button>
`;
//»
//GSI_CSS_STR«
const GSI_CSS_STR = `
.gsi-material-button {
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  -webkit-appearance: none;
  background-color: WHITE;
  background-image: none;
  border: 1px solid #747775;
  -webkit-border-radius: 20px;
  border-radius: 20px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #1f1f1f;
  cursor: pointer;
  font-family: 'Roboto', arial, sans-serif;
  font-size: 14px;
  height: 40px;
  letter-spacing: 0.25px;
  outline: none;
  overflow: hidden;
  padding: 0 12px;
  position: relative;
  text-align: center;
  -webkit-transition: background-color .218s, border-color .218s, box-shadow .218s;
  transition: background-color .218s, border-color .218s, box-shadow .218s;
  vertical-align: middle;
  white-space: nowrap;
  width: auto;
  max-width: 400px;
  min-width: min-content;
}

.gsi-material-button .gsi-material-button-icon {
  height: 20px;
  margin-right: 12px;
  min-width: 20px;
  width: 20px;
}

.gsi-material-button .gsi-material-button-content-wrapper {
  -webkit-align-items: center;
  align-items: center;
  display: flex;
  -webkit-flex-direction: row;
  flex-direction: row;
  -webkit-flex-wrap: nowrap;
  flex-wrap: nowrap;
  height: 100%;
  justify-content: space-between;
  position: relative;
  width: 100%;
}

.gsi-material-button .gsi-material-button-contents {
  -webkit-flex-grow: 1;
  flex-grow: 1;
  font-family: 'Roboto', arial, sans-serif;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: top;
}

.gsi-material-button .gsi-material-button-state {
  -webkit-transition: opacity .218s;
  transition: opacity .218s;
  bottom: 0;
  left: 0;
  opacity: 0;
  position: absolute;
  right: 0;
  top: 0;
}

.gsi-material-button:disabled {
  cursor: default;
  background-color: #ffffff61;
  border-color: #1f1f1f1f;
}

.gsi-material-button:disabled .gsi-material-button-contents {
  opacity: 38%;
}

.gsi-material-button:disabled .gsi-material-button-icon {
  opacity: 38%;
}

.gsi-material-button:not(:disabled):active .gsi-material-button-state, 
.gsi-material-button:not(:disabled):focus .gsi-material-button-state {
  background-color: #303030;
  opacity: 12%;
}

.gsi-material-button:not(:disabled):hover {
  -webkit-box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
}

.gsi-material-button:not(:disabled):hover .gsi-material-button-state {
  background-color: #303030;
  opacity: 8%;
}
`;
//»
const GSI_CSS_ID = "gsi_css";
//»
//DOM«
if (!document.getElementById(GSI_CSS_ID)) {
	let sty = mk("style");
	sty.innerHTML = GSI_CSS_STR;
	sty.id = GSI_CSS_ID;
	document.head.appendChild(sty);
}
const button_div = mkdv();
button_div.innerHTML = LOGIN_BUTTONS_STR;

let goog_but, gh_but;
let buttons = button_div.getElementsByTagName("button");
for (let but of buttons){
	if (but.name == GOOGLE_BUT_ID){
		goog_but = but;
	}
	else if (but.name == GITHUB_BUT_ID){
		gh_but = but;
	}
}
if (!(goog_but && gh_but)){
cerr("WHERE ARE THE BUTTONS (goog_but && gh_but)?");
}
//»
//Funcs«

const init_fbase = async()=>{//«

let initializeApp;
let getAuth,
	onAuthStateChanged,
	signInWithPopup,
	GoogleAuthProvider,
	GithubAuthProvider,
	signOut;
let getDatabase,
	ref,
	set;
try {
	({ initializeApp } = await import(FBASE_APP_URL));
	({
		getAuth,
		onAuthStateChanged,
		signInWithPopup,
		GoogleAuthProvider,
		GithubAuthProvider,
		signOut 
	} =  await import(FBASE_AUTH_URL));
	({ 
		getDatabase,
		ref,
		set 
	} = await import(FBASE_DB_URL));
}
catch(e){
	cerr(e);
	return "Could not import!";
}
//fbase.initializeApp = initializeApp;
fbase.app = initializeApp(firebaseConfig);
fbase.getAuth = getAuth; 
fbase.onAuthStateChanged=onAuthStateChanged; 
fbase.signInWithPopup=signInWithPopup; 
fbase.GoogleAuthProvider=GoogleAuthProvider; 
fbase.GithubAuthProvider=GithubAuthProvider; 
fbase.signOut=signOut;
fbase.getDatabase = getDatabase;
fbase.ref = ref;
fbase.set = set;
fbase.didInit = true;
return true;

}//»

const get_fbase_user = () =>{
if (!fbase.didInit){
throw new Error("NEVER CALLED init_fbase() ?!?!");
}
	return new Promise((Y,N)=>{
		const auth = fbase.getAuth(fbase.app);
		let cb = fbase.onAuthStateChanged(auth, (user) => {
			cb();
			Y(user);
		});
	});
};

//»
//Commands«

const com_user = class extends Com{//«
/*
This will be the interface into one's own user account
*/
async run(){

const{args}=this;
let com = args.shift();
if (!com) com = "stat";

const coms = ["signin", "in", "i", "signout", "out", "o", "stat"];
if (!coms.includes(com)){
	this.no(`invalid command: ${com}`);
	return;
}

let is_signin = com === "signin" || com === "in" || com === "i";
let is_signout = com === "signout" || com === "out" || com === "o";
let is_stat = com === "stat";

if (!fbase.didInit) return this.no("Did not initialize firebase");

const auth = fbase.getAuth(fbase.app);

let cb = fbase.onAuthStateChanged(auth, async (user) => {//«
cb();//Just doing this once, so the returned value is supposed to unregister the callback.
if (user){
	if (is_signout){
		try{
			await fbase.signOut(auth);
			this.ok('Signed out');
		}
		catch(e){
			cerr(e);
			this.no(e.message);
		}
		return;
	}
	let already = "";
	if (is_signin) already = " already";
	let prov_id="";
	if (user.providerData && user.providerData[0].providerId){
		prov_id = ` (w/${user.providerData[0].providerId})`;
	}
	this.ok(`You are${already} signed in${prov_id}`);
	return;
}
if (is_stat){
	this.ok("You are signed out");
	return;
}
if (!is_signin){
	this.ok("You are already signed out");
	return;
}
let is_active = false;
/*
Either the user clicks a sign-in button, and pop_div.cancel() will be called, or
they will click the popup's lone button (here arbitrarily labelled "CANCEL"), and 
the command will immediately return. 

If they try clicking the popup's button after clicking one of the sign-in
buttons, the popup's callback will return because the is_active flag is set.
*/
let pop_div = popup(button_div, {//«
	cb: ()=>{
		if (is_active) return;
//If we get down here, neither of the sign-in buttons will have been clicked
		this.wrn("Cancelled!");
		this.ok();
	}, 
	oktxt: "CANCEL"
});//»
goog_but.onclick=async()=>{//«
	is_active = true;
	goog_but.onclick = null;
	gh_but.onclick = null;
	try {
		await fbase.signInWithPopup(auth, new fbase.GoogleAuthProvider());
		this.ok("Signed in with Google!");
	}
	catch(e){
		cerr(e);
		this.no(e.message);
	}
	pop_div.cancel();
};//»
gh_but.onclick=async()=>{//«
	is_active = true;
	gh_but.onclick = null;
	goog_but.onclick = null;
	try {
		await fbase.signInWithPopup(auth, new fbase.GithubAuthProvider());
		this.ok("Signed in with GitHub!");
	}
	catch(e){
		cerr(e);
		this.no(e.message);
	}
	pop_div.cancel();
};//»

});//»

}
}//»
const com_users = class extends Com{//«
/*

mount: mount a filesystem under "/users" of type: USERS_TYPE.

list; give fine-grained control over what user directories to list inside of /users.

*/
	async run(){
		const{args}=this;
		let com = args.shift();
		if (!com){
			this.no(`missing command`);
			return;
		}
		let did_mount = !!root.kids.users;
		if (com=="mount") {//«
			if (did_mount){
				this.wrn("already mounted");
			}
			else{
				mount_tree("users", USERS_TYPE);
/*
Maybe we should export a basic function to fs.populate_dirobj for use with the basic
shell/terminal functions like ls and doing tab complete.
*/
				this.suc("/users: successfully mounted");
			}
			this.ok();
		}//»
		else if (com=="list") {//«
			if (!did_mount) return this.no("Did not mount!");
			if (!fbase.didInit) return this.no("Did not initialize firebase");
let user = await get_fbase_user();
if (!user) return this.no("Not signed in!");
log(user);
this.wrn("GET THE LIST...");
this.ok();
		}//»
		else{
			this.no(`unknown command: ${com}`);
		}
	}
}//»

const com_fbase = class extends Com{//«
	async run(){
		const{args}=this;
		let com = args.shift();
		if (!com) com = "init";
		if (com == "init") {
			if (fbase.didInit){
				this.wrn("did already init");
				this.ok();
				return;
			}
			let rv = await init_fbase();
			if (rv === true){
				this.ok("init: ok");
				return;
			}
			if (isStr(rv)) return this.no(rv);
			log(rv);
			this.no("Unknown value returned from init_fbase() (see console)");
			return;
		}
		if (!fbase.didInit){
			this.no("did not init firebase");
			return;
		}
		let db = fbase.getDatabase(fbase.app);
		if (com == "db") {
log(db);
this.ok();
		}
		else if (com == "ref") {
let path = args.shift();
let ref;
if (path) ref = fbase.ref(db, path);
else ref = fbase.ref(db);
log(ref);
this.ok();
		}
		else if (com == "set") {
let val = args.shift();
if (!val) val = true;
let path = args.shift();
let ref;
if (path) ref = fbase.ref(db, path);
else ref = fbase.ref(db);
try {
let rv = await fbase.set(ref, val);
this.ok();
}
catch(e){
this.no(e.message);
cerr(e);
}
		}
		else{
			this.no(`'${com}': unknown command`);
		}
	}
}//»
//»

const coms = {//«
	users: com_users,
	user: com_user,
	fbase: com_fbase
}//»

export {coms};

