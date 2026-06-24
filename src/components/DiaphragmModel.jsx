import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/**
 * DiaphragmModel
 *
 * Renders an interactive Three.js scene showing:
 *  - A wireframe ribcage (barrel shape)
 *  - Semi-transparent lungs that expand/compress
 *  - A diaphragm dome that flattens (inhale) / domes up (exhale)
 *  - A trachea tube
 *  - Airflow particles
 *  - OrbitControls for rotation/zoom/pan
 *
 * Props:
 *  - isPlaying (bool)   — whether the breathing animation is active
 *  - speed    (number)  — breathing rate multiplier (0.3 – 2.0)
 *  - onPhaseChange (fn) — called with { phase: "inhale"|"exhale", progress: 0–1 }
 */
export default function DiaphragmModel({ isPlaying, speed = 1, onPhaseChange }) {
  const containerRef = useRef(null);
  const stateRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    animId: null,
    clock: new THREE.Clock(),
    breathTime: 0,
    disposed: false,
  });

  /* ── Colour palette (matching project design tokens) ─────────────── */
  const COLORS = {
    cream:     0xf5eedc,
    blue:      0x27548a,
    teal:      0x183b4e,
    gold:      0xdda853,
    lungPink:  0xd4837a,
    ribBone:   0xc9b99a,
    tracheaRed:0xb85c5c,
    particle:  0x7ec8e3,
  };

  /* ═══════════════════════════════════════════════════════════════════
     BUILD SCENE
     ═══════════════════════════════════════════════════════════════════ */
  const buildScene = useCallback((container) => {
    const S = stateRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // ── Renderer ──────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Camera ────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 1.2, 6.5);
    camera.lookAt(0, 0.2, 0);

    // ── Lighting ──────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(COLORS.blue, 0.4);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    const bottomFill = new THREE.PointLight(COLORS.gold, 0.3, 10);
    bottomFill.position.set(0, -3, 2);
    scene.add(bottomFill);

    // ── Controls ──────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.minDistance = 3;
    controls.maxDistance = 12;
    controls.target.set(0, 0.2, 0);
    controls.maxPolarAngle = Math.PI * 0.85;

    // ── Main group (everything rotates together) ──────────────────────
    const bodyGroup = new THREE.Group();
    scene.add(bodyGroup);

    /* ── SPINE (orientation reference) ────────────────────────────────── */
    const spineMat = new THREE.MeshStandardMaterial({
      color: COLORS.ribBone,
      roughness: 0.8,
      metalness: 0.1,
      transparent: true,
      opacity: 0.35,
    });
    for (let i = 0; i < 8; i++) {
      const vertebra = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.14, 0.18, 8),
        spineMat
      );
      vertebra.position.set(0, -1.2 + i * 0.42, -1.05);
      bodyGroup.add(vertebra);
    }

    /* ── RIBCAGE (wireframe barrel) ───────────────────────────────────── */
    const ribGroup = new THREE.Group();
    bodyGroup.add(ribGroup);

    const ribMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.ribBone,
      roughness: 0.6,
      metalness: 0.15,
      transparent: true,
      opacity: 0.3,
      wireframe: false,
      side: THREE.DoubleSide,
    });

    // Create individual ribs as torus segments
    const ribCount = 10;
    for (let i = 0; i < ribCount; i++) {
      const t = i / (ribCount - 1);
      const y = -0.8 + t * 2.8; // bottom to top
      // Ribs get smaller at top and bottom — barrel shape
      const ribRadius = 1.15 + 0.35 * Math.sin(t * Math.PI) - t * 0.15;

      const ribGeom = new THREE.TorusGeometry(ribRadius, 0.03, 6, 48, Math.PI * 1.7);
      const rib = new THREE.Mesh(ribGeom, ribMaterial);
      rib.position.set(0, y, 0);
      rib.rotation.x = Math.PI / 2;
      rib.rotation.z = Math.PI * 0.15; // slight tilt
      rib.userData.baseRadius = ribRadius;
      ribGroup.add(rib);
    }
    
    // Rotate the ribGroup so the gap (which is normally between 1.7*PI and 2*PI)
    // is centered perfectly at the front (+Z). The center of the gap is 1.85*PI.
    // We add 0.65*PI to align it with 0.5*PI (which is +Z in the XZ plane).
    ribGroup.rotation.y = Math.PI * 1.5;

    /* ── TRACHEA (windpipe) ──────────────────────────────────────────── */
    const tracheaMat = new THREE.MeshStandardMaterial({
      color: COLORS.tracheaRed,
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 0.45,
    });
    
    // Main tube
    const tracheaGeom = new THREE.CylinderGeometry(0.12, 0.14, 1.8, 12, 1, true);
    const trachea = new THREE.Mesh(tracheaGeom, tracheaMat);
    trachea.position.set(0, 2.3, -0.15);
    bodyGroup.add(trachea);

    // Trachea rings
    const ringMat = new THREE.MeshStandardMaterial({
      color: COLORS.tracheaRed,
      roughness: 0.4,
      metalness: 0.2,
      transparent: true,
      opacity: 0.55,
    });
    for (let i = 0; i < 7; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.14, 0.02, 6, 16),
        ringMat
      );
      ring.position.set(0, 1.5 + i * 0.24, -0.15);
      ring.rotation.x = Math.PI / 2;
      bodyGroup.add(ring);
    }

    // Bronchi (two branches)
    const bronchMat = tracheaMat.clone();
    bronchMat.opacity = 0.35;
    const bronchL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.1, 0.8, 8, 1, true),
      bronchMat
    );
    bronchL.position.set(-0.35, 1.15, -0.1);
    bronchL.rotation.z = -0.5;
    bodyGroup.add(bronchL);

    const bronchR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.1, 0.8, 8, 1, true),
      bronchMat
    );
    bronchR.position.set(0.35, 1.15, -0.1);
    bronchR.rotation.z = 0.5;
    bodyGroup.add(bronchR);

    /* ── LUNGS ────────────────────────────────────────────────────────── */
    const lungMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.lungPink,
      roughness: 0.45,
      metalness: 0.05,
      transparent: true,
      opacity: 0.32,
      transmission: 0.15,
      clearcoat: 0.3,
      side: THREE.DoubleSide,
    });

    // Left lung — slightly smaller, notch for heart
    const leftLungGeom = new THREE.SphereGeometry(0.65, 24, 20);
    // Scale to lung shape
    const leftLung = new THREE.Mesh(leftLungGeom, lungMat);
    leftLung.scale.set(0.7, 1.2, 0.75);
    leftLung.position.set(-0.6, 0.95, 0);
    bodyGroup.add(leftLung);

    // Right lung — slightly larger
    const rightLungGeom = new THREE.SphereGeometry(0.7, 24, 20);
    const rightLung = new THREE.Mesh(rightLungGeom, lungMat.clone());
    rightLung.scale.set(0.75, 1.25, 0.78);
    rightLung.position.set(0.6, 0.95, 0);
    bodyGroup.add(rightLung);

    /* ── DIAPHRAGM (the star of the show) ────────────────────────────── */
    // Anatomically accurate inverted dome:
    // A high-vertex bottom hemisphere that domes upward into the thoracic
    // cavity.  During INHALATION the diaphragm contracts → flattens and
    // descends.  During EXHALATION it relaxes → curves back up.
    const diaSegments = 64;
    const diaRings = 32;
    const diaRadius = 1.3;

    // Build a bottom-hemisphere (phi from π/2 → π) and flip it so the
    // dome points upward like the real diaphragm.
    const diaGeom = new THREE.SphereGeometry(
      diaRadius,
      diaSegments,
      diaRings,
      0,             // phiStart  — full 360° ring
      Math.PI * 2,   // phiLength
      Math.PI * 0.5, // thetaStart — equator
      Math.PI * 0.5  // thetaLength — to south pole
    );

    // Flip the hemisphere so the dome faces upward (into the chest cavity)
    // by negating Y for every vertex, then re-compute normals.
    const diaPositions = diaGeom.attributes.position;
    for (let i = 0; i < diaPositions.count; i++) {
      diaPositions.setY(i, -diaPositions.getY(i));
    }
    diaGeom.computeVertexNormals();

    // Snapshot the "relaxed / fully-domed" rest positions for morphing
    const diaOriginal = new Float32Array(diaPositions.array.length);
    diaOriginal.set(diaPositions.array);

    // Soft organic red-pink material (like real muscle tissue)
    const diaMat = new THREE.MeshStandardMaterial({
      color: 0xc46b6b,       // soft organic red-pink
      roughness: 0.55,
      metalness: 0.05,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });

    // Subtle wireframe overlay to show deformation
    const diaWireMat = new THREE.MeshBasicMaterial({
      color: 0xe8a0a0,       // lighter pink wireframe
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });

    const diaphragm = new THREE.Mesh(diaGeom, diaMat);
    diaphragm.position.set(0, -0.8, 0);
    bodyGroup.add(diaphragm);

    const diaWire = new THREE.Mesh(diaGeom.clone(), diaWireMat);
    diaWire.position.set(0, -0.8, 0);
    bodyGroup.add(diaWire);

    // Tendon-attachment ring at the diaphragm rim
    const edgeRingGeom = new THREE.TorusGeometry(diaRadius * 0.98, 0.03, 8, 64);
    const edgeRingMat = new THREE.MeshStandardMaterial({
      color: 0xd49a9a,
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 0.55,
    });
    const edgeRing = new THREE.Mesh(edgeRingGeom, edgeRingMat);
    edgeRing.rotation.x = Math.PI / 2;
    edgeRing.position.set(0, -0.8, 0);
    bodyGroup.add(edgeRing);

    /* ── AIRFLOW PARTICLES ────────────────────────────────────────────── */
    const particleCount = 120;
    const particlesGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);
    const particleRadii = new Float32Array(particleCount);
    const particleAngles = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.12;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = Math.random() * 3.5 - 0.5;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius - 0.15;
      particleSpeeds[i] = 0.5 + Math.random() * 1.5;
      particleRadii[i] = radius;
      particleAngles[i] = angle;
    }

    particlesGeom.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particlesMat = new THREE.PointsMaterial({
      color: COLORS.particle,
      size: 0.045,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particlesGeom, particlesMat);
    bodyGroup.add(particles);

    /* ── GROUND PLANE (subtle shadow catcher) ─────────────────────────── */
    const groundGeom = new THREE.CircleGeometry(3, 48);
    const groundMat = new THREE.MeshStandardMaterial({
      color: COLORS.teal,
      roughness: 1,
      transparent: true,
      opacity: 0.08,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.8;
    scene.add(ground);

    /* ═══════════════════════════════════════════════════════════════════
       STORE REFS
       ═══════════════════════════════════════════════════════════════════ */
    S.renderer = renderer;
    S.scene = scene;
    S.camera = camera;
    S.controls = controls;
    S.bodyGroup = bodyGroup;
    S.diaphragm = diaphragm;
    S.diaWire = diaWire;
    S.diaGeom = diaGeom;
    S.diaOriginal = diaOriginal;
    S.edgeRing = edgeRing;
    S.leftLung = leftLung;
    S.rightLung = rightLung;
    S.ribGroup = ribGroup;
    S.particles = particles;
    S.particleSpeeds = particleSpeeds;
    S.particleRadii = particleRadii;
    S.particleAngles = particleAngles;
    S.diaMat = diaMat;
    S.diaWireMat = diaWireMat;
  }, []);

  /* ═══════════════════════════════════════════════════════════════════
     ANIMATION LOOP
     ═══════════════════════════════════════════════════════════════════ */
  const animate = useCallback(() => {
    const S = stateRef.current;
    if (S.disposed) return;

    S.animId = requestAnimationFrame(animate);

    // Use elapsed time for smooth sine-wave breathing
    const elapsed = S.clock.getElapsedTime();
    const speedMul = S._speed || 1;

    // Only advance breathTime when playing; otherwise freeze at last value
    if (S._isPlaying) {
      S.breathTime = elapsed * speedMul * 0.8;
    }

    // Sine-wave breathing cycle
    // breathVal: 0 = fully relaxed (dome UP / exhale)
    //            1 = fully contracted (flat / inhale)
    const cycle = S.breathTime % (Math.PI * 2);
    const breathVal = (Math.sin(cycle - Math.PI / 2) + 1) / 2;
    const phase = cycle < Math.PI ? "inhale" : "exhale";

    // Report phase
    if (S._onPhaseChange) {
      S._onPhaseChange({ phase, progress: breathVal });
    }

    /* ── Morph diaphragm vertices ───────────────────────────────────── */
    // The rest-state (diaOriginal) is the fully-domed "relaxed / exhale"
    // shape.  We flatten towards Y = 0 (the equatorial plane) by the
    // breathVal amount, and shift the whole mesh downward.
    const positions = S.diaGeom.attributes.position;
    const orig = S.diaOriginal;
    const flattenAmount = breathVal * 0.7; // 0 = full dome, 0.7 = nearly flat

    for (let i = 0; i < positions.count; i++) {
      const ox = orig[i * 3];
      const oy = orig[i * 3 + 1]; // dome-height axis (positive = up)
      const oz = orig[i * 3 + 2];

      // How far this vertex is from the rim (rim = Y near 0, apex = max Y)
      // Flatten the dome by lerping Y toward 0
      const newY = oy * (1 - flattenAmount);
      positions.setXYZ(i, ox, newY, oz);
    }
    positions.needsUpdate = true;
    S.diaGeom.computeVertexNormals();

    // Sync wireframe overlay
    const wirePositions = S.diaWire.geometry.attributes.position;
    for (let i = 0; i < wirePositions.count; i++) {
      wirePositions.setXYZ(
        i,
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
    }
    wirePositions.needsUpdate = true;

    // Diaphragm rim is anchored at the last rib (Y = -0.8).
    // The visible breathing motion comes from the dome flattening in the loop above,
    // not from the whole mesh translating down.
    const diaBaseY = -0.8;
    const diaYShift = 0;
    S.diaphragm.position.y = diaBaseY - diaYShift;
    S.diaWire.position.y = diaBaseY - diaYShift;
    S.edgeRing.position.y = diaBaseY - diaYShift;

    // Subtle opacity pulse — slightly more visible when contracted
    S.diaMat.opacity = 0.6 + breathVal * 0.15;
    S.diaWireMat.opacity = 0.08 + breathVal * 0.12;

    /* ── Animate lungs ──────────────────────────────────────────────── */
    const lungScale = 1 + breathVal * 0.2;
    S.leftLung.scale.set(0.7 * lungScale, 1.2 * lungScale, 0.75 * lungScale);
    S.rightLung.scale.set(0.75 * lungScale, 1.25 * lungScale, 0.78 * lungScale);
    S.leftLung.position.y = 0.95 + breathVal * 0.12;
    S.rightLung.position.y = 0.95 + breathVal * 0.12;

    /* ── Animate ribcage ────────────────────────────────────────────── */
    const ribExpand = 1 + breathVal * 0.06;
    S.ribGroup.children.forEach((rib) => {
      if (rib.userData.baseRadius) {
        rib.scale.set(ribExpand, ribExpand, 1);
      }
    });

    /* ── Animate airflow particles ──────────────────────────────────── */
    const delta = S.clock.getDelta() || 0.016; // getDelta after getElapsedTime is ~0, use fallback
    const pPositions = S.particles.geometry.attributes.position;
    const direction = phase === "inhale" ? -1 : 1;
    const flowStrength = S._isPlaying ? 1.0 : 0.05;

    for (let i = 0; i < pPositions.count; i++) {
      let y = pPositions.getY(i);
      const spd = S.particleSpeeds[i] * 0.016 * direction * flowStrength * speedMul;
      y += spd;

      if (y < -0.8) {
        y = 3.2;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.12;
        pPositions.setX(i, Math.cos(angle) * r);
        pPositions.setZ(i, Math.sin(angle) * r - 0.15);
      } else if (y > 3.5) {
        y = -0.5;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.12;
        pPositions.setX(i, Math.cos(angle) * r);
        pPositions.setZ(i, Math.sin(angle) * r - 0.15);
      }

      if (y < 1.3 && y > 0.3) {
        const spreadFactor = (1.3 - y) / 1.0;
        const angle = S.particleAngles[i] + S.breathTime * 0.3;
        const spreadRadius = spreadFactor * 0.6;
        pPositions.setX(i, Math.cos(angle) * spreadRadius);
        pPositions.setZ(i, Math.sin(angle) * spreadRadius - 0.1);
      }

      pPositions.setY(i, y);
    }
    pPositions.needsUpdate = true;
    S.particles.material.opacity = 0.3 + breathVal * 0.5;

    /* ── Update controls & render ───────────────────────────────────── */
    S.controls.update();
    S.renderer.render(S.scene, S.camera);
  }, []);

  /* ═══════════════════════════════════════════════════════════════════
     LIFECYCLE
     ═══════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const S = stateRef.current;
    S.disposed = false;

    buildScene(container);
    animate();

    // Resize handler
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
      if (S.renderer) {
        S.renderer.dispose();
        if (S.renderer.domElement && container.contains(S.renderer.domElement)) {
          container.removeChild(S.renderer.domElement);
        }
      }
    };
  }, [buildScene, animate]);

  /* ── Sync props into ref so animation loop can read them ──────────── */
  useEffect(() => {
    stateRef.current._isPlaying = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    stateRef.current._speed = speed;
  }, [speed]);

  useEffect(() => {
    stateRef.current._onPhaseChange = onPhaseChange;
  }, [onPhaseChange]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: 400, touchAction: "none" }}
    />
  );
}
