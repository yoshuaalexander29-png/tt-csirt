import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import { installPixieCut } from './pixie-cut.js';

const viewport = document.querySelector('#viewport');
const loadingLabel = document.querySelector('#loading');
const errorLabel = document.querySelector('#error');
const statusEls = {
  hunter: document.querySelector('#hunter-status'),
  oracle: document.querySelector('#oracle-status')
};

const scene = new THREE.Scene();
scene.background = new THREE.Color('#191f2b');
scene.fog = new THREE.Fog('#191f2b', 9, 24);
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(0, 2.6, 8.6);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
viewport.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.05, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 4.2;
controls.maxDistance = 14;
controls.maxPolarAngle = Math.PI * 0.49;

scene.add(new THREE.HemisphereLight(0xc5e1ff, 0x3a2732, 2.1));
const keyLight = new THREE.DirectionalLight(0xffe4bc, 3.1);
keyLight.position.set(-3.5, 7, 4.5); keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024,1024); keyLight.shadow.camera.left=-6; keyLight.shadow.camera.right=6; keyLight.shadow.camera.top=6; keyLight.shadow.camera.bottom=-6;
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x6bd8e0, 2.0); rimLight.position.set(4,4,-3); scene.add(rimLight);
const fillLight = new THREE.PointLight(0xb18cff, 18, 12); fillLight.position.set(0,2.4,3); scene.add(fillLight);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200), new THREE.MeshStandardMaterial({color:0x171d27, roughness:0.88, metalness:0.04}));
floor.rotation.x=-Math.PI/2; floor.position.y=-0.025; floor.receiveShadow=true; scene.add(floor);
const grid = new THREE.GridHelper(30, 60, 0x354253, 0x28313e); grid.position.y=-0.018; grid.material.transparent=true; grid.material.opacity=.36; scene.add(grid);

const characters = {};
const clock = new THREE.Clock();

function modelLoadingManager(slug) {
  const manager = new THREE.LoadingManager();
  const base = `/models/${slug}`;
  // Extract the referenced texture basename from Windows paths stored in the FBX and remap locally.
  manager.setURLModifier((url) => {
    const normalized = String(url).replace(/\\/g, '/').split(/[?#]/)[0];
    const file = normalized.split('/').pop();
    if (!file) return url;
    return `${base}/${encodeURIComponent(file)}`;
  });
  return manager;
}

function normalizeModel(root, targetHeight=2.25) {
  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.y) || size.y < 1e-4) throw new Error('Model bounds could not be measured.');
  root.scale.setScalar(targetHeight / size.y);
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.y -= box.min.y;
  root.position.z -= center.z;
  root.updateMatrixWorld(true);
}

function tuneMaterials(root) {
  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        if (!mat) continue;
        // Don't overwrite the recolored diffuse maps; gently improve response to the scene lights.
        if ('roughness' in mat && (mat.roughness === undefined || mat.roughness > 0.95)) mat.roughness = 0.86;
        if ('metalness' in mat && mat.metalness > 0.7) mat.metalness = 0.35;
        mat.needsUpdate = true;
      }
    }
  });
}

function collectBones(root) {
  const out = new Map();
  root.traverse((obj) => { if (obj.isBone && !out.has(obj.name)) out.set(obj.name, obj); });
  return out;
}

function makeClip(root, name, duration, poseFunctions, options={}) {
  const bones = collectBones(root);
  const times = [];
  const samples = Math.max(24, Math.ceil(duration * 30));
  for (let i=0; i<=samples; i++) times.push(duration * i / samples);
  const tracks = [];
  for (const [boneName, poseFn] of Object.entries(poseFunctions)) {
    const bone = bones.get(boneName);
    if (!bone) continue;
    const baseQ = bone.quaternion.clone();
    const values = [];
    for (let i=0; i<times.length; i++) {
      const t = times[i] / duration;
      const e = poseFn(t, times[i]);
      const offset = new THREE.Quaternion().setFromEuler(new THREE.Euler(e[0],e[1],e[2],'XYZ'));
      const q = baseQ.clone().multiply(offset).normalize();
      values.push(q.x,q.y,q.z,q.w);
    }
    tracks.push(new THREE.QuaternionKeyframeTrack(`${boneName}.quaternion`, times, values));
  }
  // Small root/belly bob adds life even on rigs with only a few useful bones.
  const torso = bones.get('n_hara');
  if (torso && options.bob) {
    const baseY = torso.position.y;
    const vals=[];
    for (const t of times) vals.push(torso.position.x, baseY + options.bob*Math.sin(t*2*Math.PI), torso.position.z);
    tracks.push(new THREE.VectorKeyframeTrack('n_hara.position',times,vals));
  }
  return new THREE.AnimationClip(name, duration, tracks);
}

const sin=(t, cycles=1)=>Math.sin(t*Math.PI*2*cycles);
function buildClips(root, kind) {
  const clips={};
  clips.idle=makeClip(root,'idle',3.2,{
    spine_a:(t)=>[0,0,0.025*sin(t)],
    spine_b:(t)=>[0.018*sin(t+0.12),0.025*sin(t),0],
    head:(t)=>[0,0.018*sin(t+0.1),0.014*sin(t+0.2)],
    arm_L_a:(t)=>[0,0,0.025*sin(t+0.25)], arm_R_a:(t)=>[0,0,-0.025*sin(t+0.25)],
    hair_a:(t)=>[0.022*sin(t),0.025*sin(t),0], hair_b:(t)=>[0.035*sin(t+0.12),0,0]
  },{bob:0.012});
  clips.walk=makeClip(root,'walk',1.0,{
    leg_L_a:(t)=>[0.42*sin(t),0,0], leg_R_a:(t)=>[-0.42*sin(t),0,0],
    leg_L_b:(t)=>[Math.max(0,-sin(t))*0.42,0,0], leg_R_b:(t)=>[Math.max(0,sin(t))*0.42,0,0],
    arm_L_a:(t)=>[-0.32*sin(t),0,0.03], arm_R_a:(t)=>[0.32*sin(t),0,-0.03],
    spine_a:(t)=>[0,0,0.035*sin(t)], spine_b:(t)=>[0.025*sin(t),0,0],
    head:(t)=>[0,0.015*sin(t),0], hair_a:(t)=>[0.06*sin(t),0,0], hair_b:(t)=>[0.08*sin(t+0.1),0,0]
  },{bob:0.035});
  if(kind==='hunter') {
    clips.special=makeClip(root,'scan-relic',1.7,{
      spine_a:(t)=>[0.06*Math.sin(t*Math.PI),0,0.06*Math.sin(t*Math.PI)],
      spine_b:(t)=>[0.14*Math.sin(t*Math.PI),0.04*Math.sin(t*Math.PI),0.05*Math.sin(t*Math.PI)],
      head:(t)=>[0.08*Math.sin(t*Math.PI),0.1*Math.sin(t*Math.PI),-0.06*Math.sin(t*Math.PI)],
      arm_R_a:(t)=>[0.12+0.62*Math.sin(Math.PI*t),0.05*Math.sin(Math.PI*t),-0.18-0.24*Math.sin(Math.PI*t)],
      arm_R_b:(t)=>[-0.15-0.55*Math.sin(Math.PI*t),0,0.08],
      arm_L_a:(t)=>[0.05+0.28*Math.sin(Math.PI*t),0,-0.10],
      arm_L_b:(t)=>[-0.25*Math.sin(Math.PI*t),0,0]
    });
  } else {
    clips.special=makeClip(root,'cast-spell',1.9,{
      spine_a:(t)=>[0.08*Math.sin(Math.PI*t),0,0.04*Math.sin(Math.PI*t)],
      spine_b:(t)=>[-0.10*Math.sin(Math.PI*t),0,0.04*Math.sin(Math.PI*t)],
      head:(t)=>[0.05*Math.sin(Math.PI*t),0.08*Math.sin(Math.PI*t),0],
      arm_L_a:(t)=>[-0.30-0.75*Math.sin(Math.PI*t),0,0.30+0.15*Math.sin(Math.PI*t)],
      arm_L_b:(t)=>[-0.20-0.5*Math.sin(Math.PI*t),0,0],
      arm_R_a:(t)=>[-0.25-0.65*Math.sin(Math.PI*t),0,-0.30-0.15*Math.sin(Math.PI*t)],
      arm_R_b:(t)=>[-0.18-0.35*Math.sin(Math.PI*t),0,0],
      wing_L_a:(t)=>[0.25*Math.sin(Math.PI*t),0,0.35*Math.sin(Math.PI*t)],
      wing_R_a:(t)=>[-0.25*Math.sin(Math.PI*t),0,-0.35*Math.sin(Math.PI*t)],
      wingupper_L_a:(t)=>[0.3*Math.sin(Math.PI*t),0,0.2*Math.sin(Math.PI*t)],
      wingupper_R_a:(t)=>[-0.3*Math.sin(Math.PI*t),0,-0.2*Math.sin(Math.PI*t)]
    });
    clips.wing=makeClip(root,'wing-flutter',0.7,{
      wing_L_a:(t)=>[0.18*sin(t),0,0.55*sin(t)], wing_L_b:(t)=>[0.14*sin(t+0.12),0,0.35*sin(t+0.12)],
      wing_R_a:(t)=>[-0.18*sin(t),0,-0.55*sin(t)], wing_R_b:(t)=>[-0.14*sin(t+0.12),0,-0.35*sin(t+0.12)],
      winglower_L_a:(t)=>[0.25*sin(t+0.18),0,0.25*sin(t+0.18)], winglower_R_a:(t)=>[-0.25*sin(t+0.18),0,-0.25*sin(t+0.18)],
      wingupper_L_a:(t)=>[0.3*sin(t),0,0.25*sin(t)], wingupper_R_a:(t)=>[-0.3*sin(t),0,-0.25*sin(t)]
    });
  }
  return clips;
}

function makeDiscBadge(color) {
  const group=new THREE.Group();
  const gold=new THREE.MeshStandardMaterial({color,metalness:.78,roughness:.24,emissive:color,emissiveIntensity:.14});
  const dark=new THREE.MeshStandardMaterial({color:0x16202b,metalness:.45,roughness:.3});
  const coin=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.035,32),gold);
  coin.rotation.x=Math.PI/2; coin.castShadow=true; group.add(coin);
  const core=new THREE.Mesh(new THREE.OctahedronGeometry(.055,0),dark); core.position.z=.025; group.add(core);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.16,.009,8,40),gold); group.add(ring);
  return group;
}
function makeArcaneCrystal(color) {
  const group=new THREE.Group();
  const mat=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:2.1,metalness:.25,roughness:.22});
  const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.14,0),mat); crystal.castShadow=true; group.add(crystal);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.24,.008,8,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.7})); ring.rotation.x=.8; group.add(ring);
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(.31,.004,6,48),new THREE.MeshBasicMaterial({color:0xffe9b0,transparent:true,opacity:.48})); ring2.rotation.y=1; group.add(ring2);
  return group;
}



function setStatus(id, text){statusEls[id].textContent=text;}
function bindControls(id, character){
  const wrapper=document.querySelector(`[data-character="${id}"]`);
  wrapper.querySelectorAll('button').forEach((button)=>{
    button.addEventListener('click',()=>{
      wrapper.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===button));
      character.play(button.dataset.anim);
    });
  });
}

function makeCharacter(id, slug, fbxName, kind, xPosition) {
  const loader=new FBXLoader(modelLoadingManager(slug));
  return loader.loadAsync(`/models/${slug}/${fbxName}`).then((root)=>{
    normalizeModel(root,2.28);
    tuneMaterials(root);
    const holder=new THREE.Group(); holder.position.x=xPosition; scene.add(holder); holder.add(root);
    const pixieCutInstalled = kind === 'oracle' ? installPixieCut(root, holder) : false;
    const footDisk=new THREE.Mesh(new THREE.CylinderGeometry(.62,.72,.045,48),new THREE.MeshStandardMaterial({color:0x252e3c,metalness:.5,roughness:.42}));
    footDisk.position.y=.015; footDisk.receiveShadow=true; holder.add(footDisk);
    const accent=kind==='hunter'?makeDiscBadge(0xe6a04e):makeArcaneCrystal(0xf5b84f);
    accent.position.set(kind==='hunter'?-.58:.67,kind==='hunter'?1.47:1.78,0.18);
    holder.add(accent);
    const clips=buildClips(root,kind);
    const mixer=new THREE.AnimationMixer(root);
    const actions={};
    for(const [key,clip] of Object.entries(clips)) actions[key]=mixer.clipAction(clip);
    let activeName='idle';
    function play(name){
      const next=actions[name] || actions.idle;
      if(activeName===name && next.isRunning()) return;
      const prev=actions[activeName];
      if(prev && prev!==next) prev.fadeOut(.18);
      activeName=name;
      next.reset(); next.enabled=true; next.setEffectiveWeight(1); next.setEffectiveTimeScale(1);
      if(name==='special') { next.setLoop(THREE.LoopOnce,1); next.clampWhenFinished=true; }
      else next.setLoop(THREE.LoopRepeat,Infinity);
      next.fadeIn(.18).play();
    }
    mixer.addEventListener('finished',(e)=>{ if(e.action===actions.special && activeName==='special') { e.action.fadeOut(.16); activeName=''; play('idle'); const buttons=document.querySelectorAll(`[data-character="${id}"] button`); buttons.forEach(b=>b.classList.toggle('active',b.dataset.anim==='idle')); }});
    const boneNames=[...collectBones(root).keys()];
    characters[id]={id,kind,root,holder,mixer,clips,actions,play,accent,boneNames,activeName:()=>activeName};
    play('idle');
    setStatus(id,`${boneNames.length} rig bones found · clips: ${Object.keys(clips).join(', ')}${pixieCutInstalled ? ' · pixie-cut geometry' : ''}`);
    bindControls(id,characters[id]);
    return characters[id];
  });
}

async function init(){
  try {
    await Promise.all([
      makeCharacter('hunter','relic-hunter','Impa.fbx','hunter',-1.35),
      makeCharacter('oracle','grove-oracle','GreatFairy.fbx','oracle',1.35)
    ]);
    loadingLabel.remove();
  } catch(err) {
    console.error(err);
    loadingLabel.hidden=true; errorLabel.hidden=false;
    errorLabel.textContent=`Could not load one of the FBX models. ${err?.message || err}\n\nCheck the DevTools console and confirm the app was started with npm run dev (not opened with file://).`;
  }
}

function resize(){
  const w=viewport.clientWidth,h=viewport.clientHeight;
  camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h,false);
}
window.addEventListener('resize',resize); resize();
function animate(){
  requestAnimationFrame(animate);
  const delta=Math.min(clock.getDelta(),.05); const t=clock.elapsedTime;
  for(const c of Object.values(characters)){
    c.mixer.update(delta);
    c.accent.rotation.y += delta*(c.kind==='hunter'?.7:1.1);
    c.accent.position.y += 0; // position baseline is set above; bob added below without accumulating drift.
    if(c.kind==='oracle') c.accent.position.y=1.78+Math.sin(t*2.4)*.055;
    else c.accent.rotation.z=Math.sin(t*1.4)*.12;
  }
  controls.update(); renderer.render(scene,camera);
}
init(); animate();
