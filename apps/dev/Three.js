
//Imports«
//import { util, api as capi } from "util";
//import {globals} from "config";
const{globals}=LOTW;
const util = LOTW.api.util;
const{make, log, jlog, cwarn, cerr}=util;
//const {NS} = globals;
//const {fs} = NS.api;

//Taken from animate
//	scene.children.forEach(child => child.rotation.y += 0.01);

//»

export const app = function(Win) {

//Var«

let scene, camera, renderer, wireframeMaterial;
let killed = false;

//»
//DOM«

let Main = Win.main;
Main._bgcol="#fff";
let can = make('canvas');
can._pos="absolute";
can._x=0;
can._y=0;

let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");;
svg.setAttribute("width", "100%");
svg.setAttribute("height", "100%");
svg.style.position="absolute";
svg.style.left=0;
svg.style.top=0;
//svg.width="100%";
//svg.height="100%";
Main._add(can);
Main._add(svg);

let wid = Main._w;
let hgt = Main._h;
//log(svg);
//log(can);
//log(Main);

//»
/*«
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3D Vector Art Canvas</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  <style>
    body { margin: 0; overflow: hidden; }
    #canvas3d { position: absolute; top: 0; left: 0; }
    #svgCanvas { position: absolute; top: 0; left: 0; pointer-events: none; }
    #controls { position: absolute; top: 10px; left: 10px; background: rgba(255, 255, 255, 0.8); padding: 10px; }
    #drawTools { position: absolute; top: 60px; left: 10px; background: rgba(255, 255, 255, 0.8); padding: 10px; }
  </style>
</head>
<body>
  <div id="controls">
    <button onclick="addCube()">Add Cube</button>
    <button onclick="renderSVG()">Render SVG</button>
  </div>
  <div id="drawTools">
    <button onclick="startDrawing('line')">Draw Line</button>
    <button onclick="startDrawing('circle')">Draw Circle</button>
    <input type="color" id="strokeColor" value="#000000">
  </div>
  <canvas id="canvas3d"></canvas>
  <svg id="svgCanvas" width="100%" height="100%"></svg>
»*/

//Funcs«

const addCube=()=>{/*«*/
	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const cube = new THREE.Mesh(geometry, wireframeMaterial);
	cube.position.set(Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2);
	scene.add(cube);
	renderer.render(scene, camera);
}/*»*/

// Render loop

const renderSVG=()=>{//«
	svg.innerHTML = ''; // Clear previous SVG
	scene.children.forEach(obj => {
		if (obj.isMesh) {
			const vector = new THREE.Vector3();
			obj.getWorldPosition(vector);
			vector.project(camera);
			const x = (vector.x * 0.5 + 0.5) * wid;
			const y = (-vector.y * 0.5 + 0.5) * hgt;
			const size = 50 / (vector.z + 5); // Simple depth scaling
			svg.innerHTML += `<rect x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" stroke="white" fill="none"/>`;
		}
	});
//log(svg);
}//»

//»

const init=()=>{//«
//log(Main._w);
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(75, wid / hgt, 0.1, 1000);
camera.position.z = 5;
renderer = new THREE.WebGLRenderer({ canvas: can });
renderer.setSize(wid, hgt);

// Wireframe material
wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });

}//»

//«
// Add cube to scene

// SVG rendering

/*
// Drawing tools
let drawingMode = null;
let startPoint = null;
//const svg = document.getElementById('svgCanvas');

function startDrawing(mode) {
  drawingMode = mode;
  svg.style.pointerEvents = 'auto';
}

svg.addEventListener('mousedown', (e) => {
  if (!drawingMode) return;
  startPoint = { x: e.clientX, y: e.clientY };
});

svg.addEventListener('mouseup', (e) => {
  if (!drawingMode || !startPoint) return;
  const color = document.getElementById('strokeColor').value;
  const endPoint = { x: e.clientX, y: e.clientY };
  if (drawingMode === 'line') {
	svg.innerHTML += `<line x1="${startPoint.x}" y1="${startPoint.y}" x2="${endPoint.x}" y2="${endPoint.y}" stroke="${color}" stroke-width="2"/>`;
  } else if (drawingMode === 'circle') {
	const radius = Math.sqrt((endPoint.x - startPoint.x) ** 2 + (endPoint.y - startPoint.y) ** 2);
	svg.innerHTML += `<circle cx="${startPoint.x}" cy="${startPoint.y}" r="${radius}" stroke="${color}" fill="none" stroke-width="2"/>`;
  }
  startPoint = null;
});
*/
    // Handle window resize
/*
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
*/
//»

//«
this.onresize=()=>{
};
this.onkill=()=>{
killed=true;
};
this.onresize=()=>{
cwarn("RESIZE");
};
this.onappinit=async()=>{//«
if (!window.THREE) await util.makeScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js");
init();
log(THREE);
//log("INIT");
//log(THREE);

}//»
this.onkill=()=>{//«
};//»
this.onkeypress=()=>{
};
this.onkeydown=(e,k)=>{//«
	if (k=="r_"){
log("RENDER");
		renderSVG();
	}
	else if (k=="c_"){
addCube();
	}
};//»
this.onkeyup=(e,k)=>{
	if (k=="SPACE_"){
	}
};

//»

}
