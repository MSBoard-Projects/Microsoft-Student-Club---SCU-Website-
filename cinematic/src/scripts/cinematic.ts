import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createIcons, ArrowUpRight, ArrowDown, ArrowRight, ArrowUp, Code2, Orbit, Users, Pause, Play } from 'lucide';

export function startCinematic() {
  const canvas = document.querySelector<HTMLCanvasElement>('#cinematic-canvas');
  const status = document.querySelector<HTMLElement>('#cine-status');
  const motionButton = document.querySelector<HTMLButtonElement>('#cine-motion');
  if (!canvas || !status || !motionButton) return;
  const icons = { ArrowUpRight, ArrowDown, ArrowRight, ArrowUp, Code2, Orbit, Users, Pause, Play };
  createIcons({ icons });
  gsap.registerPlugin(ScrollTrigger);

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px)');
  let paused = reducedMotion.matches;
  let disposed = false;
  let contextLost = false;
  let model: THREE.Group | undefined;
  let renderer: THREE.WebGLRenderer;
  let timeline: gsap.core.Timeline | undefined;
  let framePending = false;
  let frameId = 0;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 60);
  const rig = new THREE.Group();
  scene.add(rig);
  const target = new THREE.Vector3();
  const pose = { cameraX: 0, cameraY: 0, cameraZ: 9.7, targetX: 0, targetY: 0, modelX: 1.85, modelY: 0.15, rotationX: 0.22, rotationY: -0.4, rotationZ: -0.12, lightX: 3 };
  const keyLight = new THREE.SpotLight(0xe7ffed, 95, 35, 0.6, 0.7, 1.6);
  keyLight.position.set(3, 5, 6);
  const rimLight = new THREE.SpotLight(0x50e6ff, 110, 30, 0.8, 1, 1.5);
  rimLight.position.set(-5, 2, -2);
  const warmLight = new THREE.PointLight(0xffb866, 22, 18, 2);
  warmLight.position.set(2, -3, 3);
  scene.add(new THREE.AmbientLight(0xd1eeeb, 0.7), keyLight, keyLight.target, rimLight, rimLight.target, warmLight);

  function updateButton() {
    motionButton!.setAttribute('aria-pressed', String(paused));
    const label = paused ? 'Resume scene motion' : 'Pause scene motion';
    motionButton!.setAttribute('aria-label', label);
    motionButton!.title = label;
    motionButton!.innerHTML = `<i data-lucide="${paused ? 'play' : 'pause'}" aria-hidden="true"></i>`;
    createIcons({ icons });
  }

  function fallback(message: string) {
    document.body.classList.add('cine-unavailable');
    status!.textContent = message;
    motionButton!.hidden = true;
  }

  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch {
    fallback('3D unavailable. All content is still available.');
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile.matches ? 1.5 : 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x080b0c, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();

  function render() {
    framePending = false;
    if (disposed || contextLost || document.hidden) return;
    camera.position.set(pose.cameraX, pose.cameraY, pose.cameraZ);
    target.set(pose.targetX, pose.targetY, 0);
    camera.lookAt(target);
    rig.position.set(pose.modelX, pose.modelY, 0);
    rig.rotation.set(pose.rotationX, pose.rotationY, pose.rotationZ);
    keyLight.position.x = pose.lightX;
    keyLight.target.position.copy(rig.position);
    rimLight.target.position.copy(rig.position);
    renderer.render(scene, camera);
  }

  function requestRender() {
    if (framePending || disposed || contextLost || document.hidden) return;
    framePending = true;
    frameId = requestAnimationFrame(render);
  }

  function configureTimeline() {
    timeline?.scrollTrigger?.kill();
    timeline?.kill();
    const compact = mobile.matches;
    Object.assign(pose, { cameraX: 0, cameraY: 0, cameraZ: compact ? 11.7 : 9.7, targetX: 0, targetY: 0, modelX: compact ? 0.25 : 1.85, modelY: compact ? 2.05 : 0.15, rotationX: 0.22, rotationY: -0.4, rotationZ: -0.12, lightX: 3 });
    if (!paused) {
      timeline = gsap.timeline({
        defaults: { ease: 'none', duration: 1 },
        onUpdate: requestRender,
        scrollTrigger: { trigger: '#cinematic-main', start: 'top top', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true },
      });
      timeline.to(pose, { cameraX: 0.7, cameraY: 0.25, cameraZ: compact ? 12 : 8.7, modelX: compact ? 0.8 : 2.3, modelY: compact ? 2.5 : 0.15, rotationX: 0.5, rotationY: 1.25, rotationZ: 0.3, lightX: -3 })
        .to(pose, { cameraX: -0.5, cameraY: -0.15, cameraZ: compact ? 12 : 9.2, modelX: compact ? -0.6 : -2.4, modelY: compact ? 2.5 : 0.4, rotationX: -0.25, rotationY: 3.5, rotationZ: -0.4, lightX: 5 })
        .to(pose, { cameraX: 0, cameraY: 0.2, cameraZ: compact ? 13 : 12.8, modelX: 0, modelY: compact ? 3.1 : 3.2, rotationX: 0.18, rotationY: Math.PI * 2 - 0.3, rotationZ: 0, lightX: 2 });
      timeline.scrollTrigger?.refresh();
    }
    requestRender();
  }

  const progressBar = document.querySelector<HTMLElement>('.cine-progress > span')!;
  const progressLabel = document.querySelector<HTMLElement>('.cine-progress-label')!;
  const chapterLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.cine-chapters a'));
  let activeChapter = -1;
  const progressTrigger = ScrollTrigger.create({
    trigger: '#cinematic-main', start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => {
      progressBar.style.transform = `scaleX(${self.progress})`;
      const chapter = Math.min(3, Math.round(self.progress * 3));
      if (chapter === activeChapter) return;
      activeChapter = chapter;
      chapterLinks.forEach((link, index) => index === chapter ? link.setAttribute('aria-current', 'location') : link.removeAttribute('aria-current'));
      progressLabel.innerHTML = `0${chapter + 1} <span>/</span> 04`;
    },
  });

  function onMotionToggle() {
    paused = !paused;
    updateButton();
    if (paused) {
      timeline?.scrollTrigger?.kill();
      timeline?.kill();
      requestRender();
    } else configureTimeline();
  }
  function onPreferenceChange() {
    paused = reducedMotion.matches;
    updateButton();
    configureTimeline();
  }
  function onResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile.matches ? 1.5 : 1.75));
    renderer.setSize(innerWidth, innerHeight);
    requestRender();
  }
  function onContextLost(event: Event) {
    event.preventDefault();
    contextLost = true;
    status!.textContent = 'Scene paused. Recovering graphics...';
  }
  function onContextRestored() {
    contextLost = false;
    status!.textContent = '';
    requestRender();
  }
  function disposeModel(object: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      geometries.add(child.geometry);
      (Array.isArray(child.material) ? child.material : [child.material]).forEach((material) => materials.add(material));
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
  }
  function cleanup(event: PageTransitionEvent) {
    if (event.persisted) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    timeline?.scrollTrigger?.kill();
    timeline?.kill();
    progressTrigger.kill();
    motionButton!.removeEventListener('click', onMotionToggle);
    removeEventListener('resize', onResize);
    removeEventListener('pagehide', cleanup);
    document.removeEventListener('visibilitychange', requestRender);
    reducedMotion.removeEventListener('change', onPreferenceChange);
    mobile.removeEventListener('change', configureTimeline);
    canvas!.removeEventListener('webglcontextlost', onContextLost);
    canvas!.removeEventListener('webglcontextrestored', onContextRestored);
    if (model) disposeModel(model);
    environment.dispose();
    renderer.dispose();
  }

  motionButton.addEventListener('click', onMotionToggle);
  addEventListener('resize', onResize, { passive: true });
  addEventListener('pagehide', cleanup);
  document.addEventListener('visibilitychange', requestRender);
  reducedMotion.addEventListener('change', onPreferenceChange);
  mobile.addEventListener('change', configureTimeline);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  updateButton();
  configureTimeline();

  new GLTFLoader().load('/cinematic/models/innovation-core.glb', (gltf) => {
    if (disposed) { disposeModel(gltf.scene); return; }
    model = gltf.scene;
    rig.add(model);
    status.textContent = '';
    canvas.dataset.ready = 'true';
    requestRender();
  }, undefined, () => fallback('3D could not load. All content is still available.'));
}