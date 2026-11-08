/* Smash Party — boot. Owner: Claude Code (logic).
   three.js ships only as ES modules now, so this module imports it (plus the addons we use), exposes the global
   THREE the plain game scripts expect, then loads them in order: core → cars → objects → world/animals → world/bosses → world/zones/* → game. */
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
window.THREE=Object.assign({},T,{GLTFLoader,RoomEnvironment,mergeGeometries});
const v=window.GAME_VERSION||'dev';
// themed zones (L15): src/world/zones/index.json lists the zone files to load, e.g. ["candy","dino"]
let zones=[];try{zones=await (await fetch(`src/world/zones/index.json?v=${v}`)).json();}catch(e){}
for(const f of ['core','cars','objects','world/animals','world/bosses',...zones.map(z=>'world/zones/'+z),'game'])
  await new Promise((ok,no)=>{const s=document.createElement('script');s.src=`src/${f}.js?v=${v}`;s.onload=ok;s.onerror=no;document.body.appendChild(s);});
