/* Smash Party — CANDY LAND as a whole world (Z6). Owner: zone-candy agent (see agents/zone.md).
   The hand-made land map for Adventure (L33 builds a land from its `plan`; Arcade rolls a random map from `zones`).
   Loaded after candy.js and its sub-zones (candy_forest / candy_river / candy_peaks), so their letters are known.
   Until L33 adds registerWorld this file does nothing. Quest spots (questAt) come after the Q3a outline. */
const CANDY_LAND_KEY={C:'candy',G:'candy_forest',R:'candy_river',I:'candy_peaks'};
const CANDY_LAND_PLAN=[ // one symbol per 80×80 chunk, north (−Z) on top; ci −5…5 left to right, the river runs down ci 0
  'IIIIIRIIIII', // cj −5   Ice-Cream Mountains across the north; the Chocolate Falls at the river's head
  'IIIIIRIIIII', // cj −4   the Soft-Serve Volcano stands in the middle of the mountains
  'GGIIIRIIIIG', // cj −3
  'GGGGCRCIIGG', // cj −2   Gumdrop Forest west and east; the birthday cake in the first meadow chunk
  'GGGGCRCCCGG', // cj −1
  'GGGCCRCCCCG', // cj  0   the chocolate fountain on the west bank
  'GGGCCRCCCCG', // cj  1
  'GGGCCRCCCGG', // cj  2
  'GGCCCRCCGGG', // cj  3
  'GGCCCRCCGGG', // cj  4   the start: Candy Meadow, west of the river (ci −2)
  'GGCCCRCCCGG', // cj  5
];
// the plan in the letters the zones really got (a letter that was taken gets swapped at registerZone)
function candyLandPlan(){return CANDY_LAND_PLAN.map(r=>r.replace(/[CGRI]/g,c=>(ZONES[CANDY_LAND_KEY[c]]||ZONES.candy).letter));}
if(typeof registerWorld==='function')registerWorld({
  id:'candy',name:'Candy Land',emoji:'🍭',
  zones:Object.values(CANDY_LAND_KEY),
  plan:candyLandPlan(),
  start:[[-157.4,350],[-156.2,350.6]],       // right lane of the north-south road at x=−160, facing −Z (like SPAWN_DEFAULT)
  portal:{color:'#ff8fab',sfx:'portal_giggle'},
  music:{drive:'candy_drive',boss:'candy_boss'},
  questAt:{}                                 // TODO(zone-candy): giver / stage / point lists per quest once Q3a lands
});
