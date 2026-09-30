import { mkdir, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};

const core = new THREE.Group();
core.name = 'MSC-Innovation-Core';
const colors = [0xf35325, 0x81bc06, 0x05a6f0, 0xffba08];
const tileGeometry = new RoundedBoxGeometry(1.12, 1.12, 0.72, 4, 0.09);
const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xbac9c6, metalness: 0.92, roughness: 0.24 });
const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x172827, metalness: 0.85, roughness: 0.28 });

colors.forEach((color, index) => {
  const material = new THREE.MeshStandardMaterial({ color, metalness: 0.52, roughness: 0.25, emissive: color, emissiveIntensity: 0.12 });
  const tile = new THREE.Mesh(tileGeometry, material);
  tile.position.set(index % 2 === 0 ? -0.63 : 0.63, index < 2 ? 0.63 : -0.63, 0.12);
  tile.name = `Color-module-${index + 1}`;
  core.add(tile);
  const base = new THREE.Mesh(new RoundedBoxGeometry(1.19, 1.19, 0.14, 3, 0.06), trimMaterial);
  base.position.copy(tile.position).add(new THREE.Vector3(0, 0, -0.42));
  core.add(base);
  for (let rib = 0; rib < 7; rib += 1) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.035, 0.22), baseMaterial);
    fin.position.copy(tile.position).add(new THREE.Vector3(0, -0.4 + rib * 0.13, -0.62));
    core.add(fin);
  }
});

for (let ring = 0; ring < 3; ring += 1) {
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.02 + ring * 0.17, ring === 0 ? 0.033 : 0.014, 8, 144), trimMaterial);
  orbit.rotation.set(0.35 + ring * 0.65, ring * 0.38, ring * 0.25);
  core.add(orbit);
}
const satelliteGeometry = new THREE.OctahedronGeometry(0.12, 0);
for (let index = 0; index < 12; index += 1) {
  const angle = index / 12 * Math.PI * 2;
  const satellite = new THREE.Mesh(satelliteGeometry, trimMaterial);
  satellite.position.set(Math.cos(angle) * 2.45, Math.sin(angle) * 2.45, Math.sin(angle * 2) * 0.3);
  core.add(satellite);
}

const binary = await new GLTFExporter().parseAsync(core, { binary: true });
await mkdir(new URL('../public/cinematic/models/', import.meta.url), { recursive: true });
await writeFile(new URL('../public/cinematic/models/innovation-core.glb', import.meta.url), Buffer.from(binary));
console.log(`Generated original innovation-core.glb (${binary.byteLength} bytes).`);