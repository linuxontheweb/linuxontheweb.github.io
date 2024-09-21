/*

woym
zurm

zevvy mehlevvy, a k a wuther bloother blether blawther. zavuloog
punktooroonishly moyched. Then gwellish smow hooled a tranderharbordish bardibo
swunt. So ezmooch puntabooled the woymabloym of zurmiblurmiblurmblurm towards
the warbifellation of gummifarberish smurfs. But mehbulith sevened up

Zervlug woyped it. He woyped it all around the chownd. With the yoim up
against the schtellerberb, there was nowhere to chunt his remaining hoinch

vamuary was the blestmunthuvall.
lawsdihdall
evven even awven orvenmeglorven
deedle deidle meedle meidle
hee lawsdihdall, me zawsdidall
zwoomuch
evveloo yuttishee kwandehar blef
vallextirpretippitishorfed

whahrar yoynt gooing. Yoynt awnetter doonitair. Yoynt awnetter doonit
inordaintively ramboollikair

vlacketter froymellumply choomed the restuvvit
canto mezerible yazzernoick
wunge he toodinzackally droiked aw lawng edahlihnawl
mevelendoyp he wuhst grust. He wuhsterlumpped inimjust verblust
meh volowblomo of yandersquanky dormetawsh squashegawsh
behhmoaree levelledemup. thenney gawddem all uppenuppenuppenup
chan dishort, ezzblennortmeggort
zehh wunckitty unkitty ooh
floovee oohnderstandiblated endee mestipulated
grarkee mestermark
moinkiddee ezblehnoodge
sampletoint jasturdind
eevenmost moixture
plerk izzerppa yerk
ehstee vahrmerer
eevlax westermarted in the bestuary mundge
sporps wurmorps. wurmohrporrorperorpidorp.
ezzvlinay, uhh wuppiduhsh ooh whewpidoosh
moontee glabbidish moister yoonteezish
he plemmished en plommished
pronner wayzlee wuzzuhh master mayzlee. heeplemmishedenplommished enheevengremmishlee grommished
kurguv wellurb
wartle yollianderippitish zorwo orwoahllian
vloom evelumoom wustairmochair verblair
guyoowhonew, hoonewit tooyoo enyoo enyoo enyoo enyoo enyoo
Zay, zayo ooz laymay, wumperdarmipidish
roon. roonmeckloon. roonmeckloon lawzdeespoon buddeegawderfork
tanglowmlex itahrishtann
zar yorpish eeblenlow. heflowago malohzergrow
yooss yewzidded iddall
yooss yewzurated id dup
enmammyenpappyenallblerpeep slappy

*/
//Imports«

const {globals, api} = LOTW;
const {audio} = globals;
const{isArr, isStr, isNum, isObj, make, log, jlog, cwarn, cerr}=api.util;
//const {fs} = api;

//»

export const app = function(Win, Desk) {

//Var«

let Main = Win.main;
let ctx;
let rafId;
let last_time;
let but_states = [];
let axis_states = [];
let gp;

let DB_KEY = false;
let utters=[];
let phrases=[
	"Eggshell binocular fish",
	"Pseudo random noise distributor",
	"Telepathic motorcycle renegade squadron",
	"Salamander moon cheese spaghetti",
	"Exotic mortuary motivator",
	"Fantastic phaser chaser eraser",
];
let voice = speechSynthesis.getVoices()[45];
for (let p of phrases){
	let ut = new SpeechSynthesisUtterance(p);
	ut.voice = voice;
	ut.rate = 1;
	ut.pitch = 1;
	utters.push(ut);
}

//»

//Funcs«

const dbkey=(...args)=>{//«
if (!DB_KEY) return;
log(...args);
};//»
const poll_gp = () => {//«


gp  = navigator.getGamepads()[0];
if (!gp) return;

let buts = gp.buttons;
for (let i=0; i <= 16; i++){
	let b = buts[i];
	if (b.pressed){
		if (!but_states[i]){
dbkey(`Fire`, i);
		}
		but_states[i]=true;
	}
	else if (but_states[i]){
dbkey(`Release`, i);
		but_states[i]=false;
	}
}

let axes = gp.axes;
let ax0 = axes[0];
if (ax0 !== axis_states[0]){
dbkey("0", ax0);
}
let ax1 = axes[1];
if (ax1 !== axis_states[1]){
dbkey("1", ax1);
}
let ax2 = axes[2];
if (ax2 !== axis_states[2]){
dbkey("2", ax2);
}
let ax3 = axes[3];
if (ax3 !== axis_states[3]){
dbkey("3", ax3);
}
axis_states = [ax0, ax1, ax2, ax3];
rafId = requestAnimationFrame(poll_gp);


}//»

//»

//«

this.onappinit=async()=>{//«

ctx = audio.ctx || new AudioContext;
audio.ctx = ctx;
rafId = requestAnimationFrame(poll_gp);


}//»
this.onkill=()=>{//«
	cancelAnimationFrame(rafId);
};//»
this.onkeydown=(e,k)=>{//«
	if (last_time) {
		if (k=="#0_" && e.timeStamp - last_time < 50) return;
	}
	last_time = e.timeStamp;
let marr;
if (marr = k.match(/([0-9])/)) {
let n = parseInt(marr[1]);
let ut = utters[n];
log(n, ut);
if (!ut) return;
speechSynthesis.speak(ut);
}
};//»
this.onkeyup=(e,k)=>{//«

};//»

//»

}

