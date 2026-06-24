import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/**
 * PostureModel
 *
 * Renders an interactive Three.js scene showing a simplified spine/skeleton
 * and a plumb line to visualize different types of posture.
 *
 * Props:
 *  - postureType (string): 'good' | 'swayback' | 'lumbar' | 'kyphosis' | 'forwardhead'
 */
export default function PostureModel({ postureType }) {
  const containerRef = useRef(null);
  const stateRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    spineLine: null,
    head: null,
    pelvis: null,
    targetPoints: [],
    currentPoints: [],
    animId: null,
    disposed: false,
  });

  const COLORS = {
    bone: 0xc9b99a,
    plumbLine: 0xdda853,
    bg: 0x27548a, // Not used as background, just for reference
  };

  // Define spine curves for different postures (from pelvis to head)
  // X: forward/back, Y: up/down, Z: left/right (we stick to X-Y plane)
  const POSTURES = {
    good: [
      new THREE.Vector3(0, -2, 0), // Pelvis
      new THREE.Vector3(0.2, -1, 0), // Lumbar (slight curve forward)
      new THREE.Vector3(-0.2, 0, 0), // Thoracic (slight curve back)
      new THREE.Vector3(0, 1, 0),    // Cervical
      new THREE.Vector3(0, 1.5, 0),  // Head center
    ],
    swayback: [
      new THREE.Vector3(0.5, -2, 0), // Pelvis shifted forward
      new THREE.Vector3(0.2, -1, 0),
      new THREE.Vector3(-0.5, 0, 0), // Thoracic heavily rounded back
      new THREE.Vector3(-0.2, 1, 0),
      new THREE.Vector3(0.3, 1.5, 0),  // Head poking forward
    ],
    lumbar: [
      new THREE.Vector3(-0.5, -2, 0), // Pelvis tilted back/up
      new THREE.Vector3(0.8, -1, 0), // Exaggerated lumbar lordosis
      new THREE.Vector3(-0.2, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 1.5, 0),
    ],
    kyphosis: [
      new THREE.Vector3(0, -2, 0),
      new THREE.Vector3(0.1, -1, 0),
      new THREE.Vector3(-0.8, 0, 0), // Exaggerated thoracic curve
      new THREE.Vector3(-0.3, 1, 0),
      new THREE.Vector3(0.5, 1.5, 0),
    ],
    forwardhead: [
      new THREE.Vector3(0, -2, 0),
      new THREE.Vector3(0.2, -1, 0),
      new THREE.Vector3(-0.2, 0, 0),
      new THREE.Vector3(0.5, 1, 0),   // Neck jets forward
      new THREE.Vector3(0.8, 1.5, 0), // Head forward
    ],
  };

  const buildScene = useCallback((container) => {
    const S = stateRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(5, 0, 5);
    camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(2, 5, 5);
    scene.add(dirLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    // Lock rotation somewhat to keep profile view
    controls.minAzimuthAngle = Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI * 3/4;

    // Plumb Line (Ideal alignment reference)
    const plumbMat = new THREE.LineBasicMaterial({ color: COLORS.plumbLine, transparent: true, opacity: 0.5 });
    const plumbGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -2.5, 0),
      new THREE.Vector3(0, 2.5, 0)
    ]);
    const plumbLine = new THREE.Line(plumbGeom, plumbMat);
    scene.add(plumbLine);

    // Initial Spine Setup
    S.currentPoints = POSTURES['good'].map(p => p.clone());
    S.targetPoints = POSTURES['good'].map(p => p.clone());

    const curve = new THREE.CatmullRomCurve3(S.currentPoints);
    const tubeGeom = new THREE.TubeGeometry(curve, 64, 0.1, 8, false);
    const spineMat = new THREE.MeshStandardMaterial({ color: COLORS.bone, roughness: 0.7 });
    const spineMesh = new THREE.Mesh(tubeGeom, spineMat);
    scene.add(spineMesh);
    S.spineMesh = spineMesh;

    // Head
    const headGeom = new THREE.SphereGeometry(0.3, 16, 16);
    const head = new THREE.Mesh(headGeom, spineMat);
    head.position.copy(S.currentPoints[4]);
    scene.add(head);
    S.head = head;

    // Pelvis indicator
    const pelvisGeom = new THREE.BoxGeometry(0.4, 0.3, 0.4);
    const pelvis = new THREE.Mesh(pelvisGeom, spineMat);
    pelvis.position.copy(S.currentPoints[0]);
    scene.add(pelvis);
    S.pelvis = pelvis;

    S.renderer = renderer;
    S.scene = scene;
    S.camera = camera;
    S.controls = controls;
  }, []);

  const animate = useCallback(() => {
    const S = stateRef.current;
    if (S.disposed) return;
    S.animId = requestAnimationFrame(animate);

    // Interpolate points
    let needsUpdate = false;
    for (let i = 0; i < S.currentPoints.length; i++) {
      S.currentPoints[i].lerp(S.targetPoints[i], 0.05);
      if (S.currentPoints[i].distanceTo(S.targetPoints[i]) > 0.01) {
        needsUpdate = true;
      }
    }

    if (needsUpdate && S.spineMesh) {
      const curve = new THREE.CatmullRomCurve3(S.currentPoints);
      S.spineMesh.geometry.dispose();
      S.spineMesh.geometry = new THREE.TubeGeometry(curve, 64, 0.1, 8, false);

      // Update head position
      S.head.position.copy(S.currentPoints[4]);
      // Update pelvis position
      S.pelvis.position.copy(S.currentPoints[0]);
    }

    S.controls.update();
    S.renderer.render(S.scene, S.camera);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const S = stateRef.current;
    S.disposed = false;

    buildScene(container);
    animate();

    const onResize = () => {
      if (S.disposed) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      S.camera.aspect = w / h;
      S.camera.updateProjectionMatrix();
      S.renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      S.disposed = true;
      window.removeEventListener("resize", onResize);
      if (S.animId) cancelAnimationFrame(S.animId);
      if (S.controls) S.controls.dispose();

      if (S.spineMesh) {
          S.spineMesh.geometry.dispose();
          S.spineMesh.material.dispose();
      }
      if (S.head) {
          S.head.geometry.dispose();
          S.head.material.dispose();
      }
      if (S.pelvis) {
          S.pelvis.geometry.dispose();
          S.pelvis.material.dispose();
      }

      if (S.renderer) {
        S.renderer.dispose();
        if (S.renderer.domElement && container.contains(S.renderer.domElement)) {
          container.removeChild(S.renderer.domElement);
        }
      }
    };
  }, [buildScene, animate]);

  useEffect(() => {
    const S = stateRef.current;
    if (POSTURES[postureType]) {
      S.targetPoints = POSTURES[postureType].map(p => p.clone());
    }
  }, [postureType]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: 400, touchAction: "none" }}
    />
  );
}
