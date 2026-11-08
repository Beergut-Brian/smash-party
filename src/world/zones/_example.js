/* Smash Party — EXAMPLE themed zone (template, not loaded). Owner: a zone-<name> agent (see agents/zone.md).
   Copy to src/world/zones/<name>.js, rename everything `example`, then add "<name>" to src/world/zones/index.json.
   Prefix every top-level name with the zone (exampleBlock, EXAMPLE_COLORS…): all scripts share one global scope. */
const EXAMPLE_COLORS=['#ff8fab','#ffd166','#8ecae6'];
registerZone({
  id:'example',            // zone name used everywhere (chunks, ZONE_PROPS-style lists, __sp.zone('example'))
  letter:'X',              // one letter for the zone map; taken letters (H T F P …) get swapped for a free one
  ground:'#f7c8e0',        // chunk ground color
  sky:{top:'#ff9ecf',horizon:'#ffe3f1'}, // optional: the sky fades to this while the camera is in the zone
  weight:1,                // how likely NEW WORLD is to mix this zone in (1 = normal, 0.5 = rarer)
  // props: new OBJ entries, named <zone>_<thing>. Build them like objects.js does (sized(x,z,r,h,points,size,build,extra)).
  props:{
    example_block:(x,z)=>sized(x,z,0.6,1.2,2,'small',P=>{P(mk('box',1.2,1.2,1.2,pick(EXAMPLE_COLORS),0,0.6,0),4);}),
  },
  // sizes: which props scatter around the cars at each size (micro … mega); any size left out falls back to the defaults
  sizes:{small:['example_block'],medium:['example_block']},
  // herds: optional [kind, count] pairs for chunks with no herd placed by the layout (kinds from ANIMAL)
  herds:[['bunny',4]],
  // layout(ctx): fill one 80×80 chunk. ctx: x0,z0,x1,z1,cx,cz, place(type,x,z,arg,r), ramp(x,z,th), herd(kind,x,z,n), free(x,z,r)
  layout(ctx){for(let i=0;i<20;i++)ctx.place('example_block',rand(ctx.x0+4,ctx.x1-4),rand(ctx.z0+4,ctx.z1-4));}
});
