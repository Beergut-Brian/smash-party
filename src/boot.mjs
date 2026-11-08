/* Smash Party — boot. Owner: Claude Code (logic).
   three.js ships only as ES modules now, so this module imports it (plus the addons we use), exposes the global
   THREE the plain game scripts expect, then loads them in order: core → cars → objects → game. */
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
window.THREE=Object.assign({},T,{GLTFLoader,RoomEnvironment});
const v=window.GAME_VERSION||'dev';
for(const f of ['core','cars','objects','game'])
  await new Promise((ok,no)=>{const s=document.createElement('script');s.src=`src/${f}.js?v=${v}`;s.onload=ok;s.onerror=no;document.body.appendChild(s);});
