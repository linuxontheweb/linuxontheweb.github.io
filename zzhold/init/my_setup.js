/*

Switch to the various workspaces, open windows on them, and set their
dimensions accordingly.
winArgs: {X:0, Y:0, WID:1136, HGT:301},
winArgs: {X:0, Y:302, WID:1136, HGT: 129}, 

Just want a way to temporarily get rid of each window's boxshadow
*/
const{log, cwarn}=LOTW.api.util;
const dapi = LOTW.Desk.api;
const{openApp,switchToWorkspace: s2w}=dapi;
dapi.hideDeskIcons();
let win1 = await openApp("Terminal",{force: true,  appArgs: {reInit: {commandStr: "vim RUNTIME.js"}}});
win1.noShadow = true;
win1.toggleChrome();
//win1.winElem._loc(0,0);
win1.x=0;
win1.y=0;
win1.w="100%";
win1.h="75%";
//win1.Main._w=1136;
//win1.Main._h=301;
win1.app.onresize();
let win2 = await openApp("Terminal",{force: true, appArgs: {reInit: {commandStr: "log"}}});
win2.noShadow = true;
win2.toggleChrome();
win2.x=0;
win2.y=win1.b;
win2.w="100%";
win2.h="25%";
win2.app.onresize();
s2w(1);
let win3 = await openApp("Terminal",{force: true});
win3.fullscreen(true);
s2w(0);
//let win4 = 
let win4 = await openApp("Terminal",{force: true, appArgs: {reInit: {
commandStr: `bindwin ${win1.winNum} 1 --desc="Shell Dev"; bindwin ${win2.winNum} 2 --desc="Console"; bindwin ${win3.winNum} 3;`
}}});
win4.close();
win1.borb="0.5px solid #171717";
win2.bort="0.5px solid #171717";


