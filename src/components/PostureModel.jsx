import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/**
 * PostureModel
 *
 * Renders an interactive Three.js scene showing four human figures:
 *  - Forward Head (cervical displacement)
 *  - Lordosis (swayback / exaggerated lumbar curve)
 *  - Slouch (thoracic kyphosis)
 *  - Correct ("tall spine" alignment)
 *
 * Props:
 *  - activePosture (string|null) — key of the posture to highlight, or null for all
 */
export default function PostureModel({ activePosture }) {
  const containerRef = useRef(null);
  const stateRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    animId: null,
    clock: new THREE.Clock(),
    disposed: false,
    figures: {},
    figureMaterials: {},
    figureXPositions: {},
    labelSprites: {},
    problemGlows: [],
    isInteracting: false,
  });

  /* ── Colour palette (matching project design tokens) ─────────────── */
  const COLORS = {
    cream:      0xf5eedc,
    blue:       0x27548a,
    teal:       0x183b4e,
    gold:       0xdda853,
    bone:       0xc9b9a0,
    bodyLight:  0xd4cbb8,
    problemRed: 0xd45c5c,
    correctGold:0xdda853,
    alignGrey:  0x888888,
    groundTeal: 0x183b4e,
  };

  const FLOOR_Y = -1.35;
  const LEG_HEIGHT = 0.85;
  const FIGURE_SPACING = 2.6;

  /* ── Posture configuration data ──────────────────────────────────── */
  // Each spine is an array of [zOffset, relativeY] pairs from pelvis to head-base.
  // Z positive = forward, Z negative = backward.
  const POSTURE_DATA = {
    "forward-head": {
      label: "Forward Head",
      desc: "Cervical Displacement",
      spine: [
        [0, 0], [0.03, 0.16], [0.05, 0.32], [0.04, 0.48],
        [0.01, 0.64], [-0.02, 0.80], [-0.03, 0.96],
        [0.08, 1.10], [0.20, 1.24], [0.32, 1.36],
      ],
      headZExtra: 0.08,
      problemRange: [7, 9],
      shoulderZ: 0,
      labelColor: "#b83a3a",
    },
    lordosis: {
      label: "Lordosis",
      desc: "Swayback",
      spine: [
        [0.08, 0], [0.14, 0.16], [0.18, 0.32], [0.15, 0.48],
        [0.08, 0.64], [0.00, 0.80], [-0.08, 0.96],
        [-0.14, 1.10], [-0.12, 1.24], [-0.08, 1.36],
      ],
      headZExtra: -0.06,
      problemRange: [0, 3],
      shoulderZ: -0.10,
      labelColor: "#b83a3a",
    },
    slouch: {
      label: "Slouch",
      desc: "Thoracic Kyphosis",
      spine: [
        [0, 0], [0.02, 0.16], [0.01, 0.32], [-0.04, 0.48],
        [-0.12, 0.64], [-0.20, 0.80], [-0.25, 0.96],
        [-0.20, 1.10], [-0.05, 1.24], [0.10, 1.36],
      ],
      headZExtra: -0.04,
      problemRange: [4, 8],
      shoulderZ: 0.18,
      labelColor: "#b83a3a",
    },
    correct: {
      label: "Correct",
      desc: "Tall Spine",
      spine: [
        [0, 0], [0.03, 0.16], [0.05, 0.32], [0.04, 0.48],
        [0.01, 0.64], [-0.02, 0.80], [-0.03, 0.96],
        [-0.01, 1.10], [0, 1.24], [0, 1.36],
      ],
      headZExtra: 0,
      problemRange: null,
      shoulderZ: 0,
      labelColor: "#b58024",
    },
  };

  const POSTURE_KEYS = ["forward-head", "lordosis", "slouch", "correct"];
  const FIGURE_X = {};
  POSTURE_KEYS.forEach((key, i) => {
    FIGURE_X[key] = (i - 1.5) * FIGURE_SPACING;
  });

  /* ── Helper: create a cylinder "bone" between two 3D points ──────── */
  function createBone(p1, p2, radius, material) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    if (len < 0.001) return null;

    const geom = new THREE.CylinderGeometry(radius, radius, len, 8);
    const mesh = new THREE.Mesh(geom, material);
    mesh.position.copy(p1).add(p2).multiplyScalar(0.5);

    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
    mesh.quaternion.copy(quat);

    return mesh;
  }

  /* ── Helper: create a canvas-text sprite label ───────────────────── */
  function createTextSprite(text, subText, color) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, 512, 160);

    // Main label
    ctx.font = "bold 42px 'Inter', 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(text, 256, 55);

    // Sub label
    ctx.font = "28px 'Inter', 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "rgba(24, 59, 78, 0.75)";
    ctx.fillText(subText, 256, 110);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      sizeAttenuation: true,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.2, 0.7, 1);
    return sprite;
  }

  /* ── Build a single posture figure ───────────────────────────────── */
  function buildFigure(key, data, xPos) {
    const group = new THREE.Group();
    group.position.x = xPos;

    const pelvisY = FLOOR_Y + LEG_HEIGHT;
    const isCorrect = key === "correct";
    const materials = []; // track for opacity transitions

    // ── Materials ─────────────────────────────────────────────────────
    const bodyColor = isCorrect ? COLORS.correctGold : COLORS.bodyLight;
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: bodyColor,
      roughness: 0.5,
      metalness: isCorrect ? 0.25 : 0.1,
      clearcoat: isCorrect ? 0.4 : 0.15,
      clearcoatRoughness: 0.4,
      transparent: true,
      opacity: 0.85,
    });
    if (isCorrect) {
      bodyMat.emissive = new THREE.Color(COLORS.correctGold);
      bodyMat.emissiveIntensity = 0.1;
    }
    materials.push({ material: bodyMat, baseOpacity: 0.85 });

    const spineMat = new THREE.MeshStandardMaterial({
      color: isCorrect ? 0xc9a84c : 0x9a8a70,
      roughness: 0.45,
      metalness: 0.15,
      transparent: true,
      opacity: 0.95,
    });
    materials.push({ material: spineMat, baseOpacity: 0.95 });

    const problemMat = new THREE.MeshStandardMaterial({
      color: COLORS.problemRed,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 0.95,
      emissive: new THREE.Color(COLORS.problemRed),
      emissiveIntensity: 0.35,
    });
    if (!isCorrect) {
      materials.push({ material: problemMat, baseOpacity: 0.95 });
    }

    const shellMat = new THREE.MeshPhysicalMaterial({
      color: bodyColor,
      roughness: 0.7,
      metalness: 0.02,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    materials.push({ material: shellMat, baseOpacity: 0.12 });

    // ── Spine construction ────────────────────────────────────────────
    const spinePoints = data.spine.map(([z, y]) =>
      new THREE.Vector3(0, pelvisY + y, z)
    );

    for (let i = 0; i < spinePoints.length; i++) {
      const isProblematic =
        data.problemRange &&
        i >= data.problemRange[0] &&
        i <= data.problemRange[1];
      const mat = isProblematic ? problemMat : spineMat;

      // Vertebra sphere
      const vert = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 10, 10),
        mat
      );
      vert.position.copy(spinePoints[i]);
      group.add(vert);

      // Connector to next vertebra
      if (i < spinePoints.length - 1) {
        const nextIsProblematic =
          data.problemRange &&
          (i + 1) >= data.problemRange[0] &&
          (i + 1) <= data.problemRange[1];
        const connMat = isProblematic || nextIsProblematic ? problemMat : spineMat;
        const bone = createBone(spinePoints[i], spinePoints[i + 1], 0.028, connMat);
        if (bone) group.add(bone);
      }
    }

    // ── Head ──────────────────────────────────────────────────────────
    const topSpine = spinePoints[spinePoints.length - 1];
    const headPos = new THREE.Vector3(
      0,
      topSpine.y + 0.18,
      topSpine.z + data.headZExtra
    );

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 20, 20),
      bodyMat
    );
    head.position.copy(headPos);
    group.add(head);

    // Neck connector
    const neckBone = createBone(topSpine, headPos, 0.045, bodyMat);
    if (neckBone) group.add(neckBone);

    // Face direction indicator (nose bump)
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.03, 0.06, 8),
      bodyMat
    );
    nose.position.set(0, headPos.y - 0.02, headPos.z + 0.16);
    nose.rotation.x = Math.PI / 2;
    group.add(nose);

    // ── Shoulders & Arms ──────────────────────────────────────────────
    const shoulderSpineIdx = 7; // upper thoracic
    const shoulderBaseY = spinePoints[shoulderSpineIdx].y;
    const shoulderBaseZ = spinePoints[shoulderSpineIdx].z + data.shoulderZ;
    const shoulderWidth = 0.32;

    [-1, 1].forEach((side) => {
      const shoulderPos = new THREE.Vector3(
        side * shoulderWidth,
        shoulderBaseY,
        shoulderBaseZ
      );

      // Shoulder joint
      const shoulderJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 10, 10),
        bodyMat
      );
      shoulderJoint.position.copy(shoulderPos);
      group.add(shoulderJoint);

      // Shoulder connector to spine
      const shoulderBone = createBone(
        spinePoints[shoulderSpineIdx],
        shoulderPos,
        0.03,
        bodyMat
      );
      if (shoulderBone) group.add(shoulderBone);

      // Upper arm
      const elbowPos = new THREE.Vector3(
        side * (shoulderWidth + 0.02),
        shoulderBaseY - 0.38,
        shoulderBaseZ + 0.03
      );
      const upperArm = createBone(shoulderPos, elbowPos, 0.03, bodyMat);
      if (upperArm) group.add(upperArm);

      // Elbow
      const elbow = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 8),
        bodyMat
      );
      elbow.position.copy(elbowPos);
      group.add(elbow);

      // Forearm
      const handPos = new THREE.Vector3(
        side * (shoulderWidth + 0.01),
        shoulderBaseY - 0.72,
        shoulderBaseZ + 0.01
      );
      const forearm = createBone(elbowPos, handPos, 0.025, bodyMat);
      if (forearm) group.add(forearm);

      // Hand
      const hand = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 8, 8),
        bodyMat
      );
      hand.position.copy(handPos);
      group.add(hand);
    });

    // ── Torso shell (translucent body mass) ───────────────────────────
    const torsoSegments = [
      { relY: 0.25, scaleX: 0.52, scaleY: 0.45, scaleZ: 0.38 },
      { relY: 0.55, scaleX: 0.48, scaleY: 0.45, scaleZ: 0.36 },
      { relY: 0.85, scaleX: 0.54, scaleY: 0.40, scaleZ: 0.40 },
      { relY: 1.05, scaleX: 0.50, scaleY: 0.35, scaleZ: 0.42 },
    ];

    torsoSegments.forEach(({ relY, scaleX, scaleY, scaleZ }) => {
      // Interpolate Z from spine data
      const spineLen = data.spine.length;
      const t = relY / data.spine[spineLen - 1][1];
      const idx = Math.min(Math.floor(t * (spineLen - 1)), spineLen - 2);
      const frac = t * (spineLen - 1) - idx;
      const z = data.spine[idx][0] * (1 - frac) + data.spine[idx + 1][0] * frac;

      const seg = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 12),
        shellMat
      );
      seg.scale.set(scaleX, scaleY, scaleZ);
      seg.position.set(0, pelvisY + relY, z);
      group.add(seg);
    });

    // ── Pelvis ────────────────────────────────────────────────────────
    const pelvis = new THREE.Mesh(
      new THREE.SphereGeometry(1, 14, 10),
      shellMat
    );
    pelvis.scale.set(0.30, 0.14, 0.22);
    pelvis.position.set(0, pelvisY + 0.02, data.spine[0][0]);
    group.add(pelvis);

    // ── Legs ──────────────────────────────────────────────────────────
    const hipWidth = 0.14;
    const kneeY = FLOOR_Y + LEG_HEIGHT * 0.5;

    [-1, 1].forEach((side) => {
      const hipPos = new THREE.Vector3(
        side * hipWidth,
        pelvisY - 0.02,
        data.spine[0][0]
      );
      const kneePos = new THREE.Vector3(side * hipWidth, kneeY, 0);
      const anklePos = new THREE.Vector3(side * hipWidth, FLOOR_Y + 0.06, 0);

      // Hip joint
      const hip = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        bodyMat
      );
      hip.position.copy(hipPos);
      group.add(hip);

      // Upper leg
      const upperLeg = createBone(hipPos, kneePos, 0.04, bodyMat);
      if (upperLeg) group.add(upperLeg);

      // Knee
      const knee = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 8, 8),
        bodyMat
      );
      knee.position.copy(kneePos);
      group.add(knee);

      // Lower leg
      const lowerLeg = createBone(kneePos, anklePos, 0.035, bodyMat);
      if (lowerLeg) group.add(lowerLeg);

      // Foot
      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.04, 0.14),
        bodyMat
      );
      foot.position.set(side * hipWidth, FLOOR_Y + 0.02, 0.04);
      group.add(foot);
    });

    // ── Vertical alignment reference line ─────────────────────────────
    const lineColor = isCorrect ? COLORS.correctGold : COLORS.alignGrey;
    const linePoints = [];
    const dashCount = 40;
    for (let i = 0; i < dashCount; i++) {
      const t = i / dashCount;
      const y1 = FLOOR_Y + t * (headPos.y + 0.3 - FLOOR_Y);
      const y2 = FLOOR_Y + (i + 0.5) / dashCount * (headPos.y + 0.3 - FLOOR_Y);
      linePoints.push(
        new THREE.Vector3(0, y1, -0.45),
        new THREE.Vector3(0, y2, -0.45)
      );
    }
    const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: isCorrect ? 0.5 : 0.25,
    });
    const alignLine = new THREE.LineSegments(lineGeom, lineMat);
    materials.push({ material: lineMat, baseOpacity: isCorrect ? 0.5 : 0.25 });
    group.add(alignLine);

    // ── Ground ring for correct posture ───────────────────────────────
    if (isCorrect) {
      const glowRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.015, 8, 48),
        new THREE.MeshBasicMaterial({
          color: COLORS.correctGold,
          transparent: true,
          opacity: 0.35,
        })
      );
      glowRing.rotation.x = Math.PI / 2;
      glowRing.position.set(0, FLOOR_Y + 0.01, 0);
      group.add(glowRing);
    }

    return { group, materials };
  }

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
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Camera ────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 0.3, 8.5);
    camera.lookAt(0, 0, 0);

    // ── Lighting ──────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.3);
    dirLight.position.set(4, 6, 5);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(COLORS.blue, 0.35);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    const bottomFill = new THREE.PointLight(COLORS.gold, 0.25, 12);
    bottomFill.position.set(0, -3, 3);
    scene.add(bottomFill);

    // Spotlight for correct posture
    const correctX = FIGURE_X["correct"];
    const spotLight = new THREE.SpotLight(COLORS.gold, 0.6, 8, Math.PI / 8, 0.5);
    spotLight.position.set(correctX, 4, 3);
    spotLight.target.position.set(correctX, 0, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);

    // ── Controls ──────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = false;
    controls.minDistance = 4;
    controls.maxDistance = 16;
    controls.target.set(0, 0, 0);
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.minPolarAngle = Math.PI * 0.15;

    controls.addEventListener("start", () => {
      S.isInteracting = true;
    });
    controls.addEventListener("end", () => {
      S.isInteracting = false;
    });

    // ── Ground plane ──────────────────────────────────────────────────
    const groundGeom = new THREE.PlaneGeometry(16, 6);
    const groundMat = new THREE.MeshStandardMaterial({
      color: COLORS.groundTeal,
      roughness: 1,
      transparent: true,
      opacity: 0.06,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = FLOOR_Y - 0.01;
    scene.add(ground);

    // Subtle grid lines on ground
    const gridHelper = new THREE.GridHelper(14, 28, 0x27548a, 0x27548a);
    gridHelper.position.y = FLOOR_Y;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.04;
    scene.add(gridHelper);

    // ── Build all four figures ─────────────────────────────────────────
    const figures = {};
    const figureMaterials = {};
    const labelSprites = {};

    POSTURE_KEYS.forEach((key) => {
      const data = POSTURE_DATA[key];
      const xPos = FIGURE_X[key];
      const { group, materials: mats } = buildFigure(key, data, xPos);
      scene.add(group);
      figures[key] = group;
      figureMaterials[key] = mats;

      // Label sprite above figure
      const label = createTextSprite(data.label, data.desc, data.labelColor);
      const topSpine = data.spine[data.spine.length - 1];
      label.position.set(
        xPos,
        FLOOR_Y + LEG_HEIGHT + topSpine[1] + 0.72,
        topSpine[0] + (data.headZExtra || 0)
      );
      scene.add(label);
      labelSprites[key] = label;
    });

    // ── Store refs ────────────────────────────────────────────────────
    S.renderer = renderer;
    S.scene = scene;
    S.camera = camera;
    S.controls = controls;
    S.figures = figures;
    S.figureMaterials = figureMaterials;
    S.labelSprites = labelSprites;
    S.figureXPositions = { ...FIGURE_X };
    S.spotLight = spotLight;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ═══════════════════════════════════════════════════════════════════
     ANIMATION LOOP
     ═══════════════════════════════════════════════════════════════════ */
  const animate = useCallback(() => {
    const S = stateRef.current;
    if (S.disposed) return;
    S.animId = requestAnimationFrame(animate);

    const elapsed = S.clock.getElapsedTime();
    const active = S._activePosture;

    // ── Smoothly pan camera toward active figure or center ─────────
    if (!S.isInteracting) {
      const targetX = (active && S.figureXPositions[active] !== undefined)
        ? S.figureXPositions[active]
        : 0;
      S.controls.target.x += (targetX - S.controls.target.x) * 0.04;
      S.controls.target.y += (0 - S.controls.target.y) * 0.04;
      S.controls.target.z += (0 - S.controls.target.z) * 0.04;

      const targetDist = active ? 5.5 : 8.5;
      const dir = S.camera.position.clone().sub(S.controls.target);
      const dist = dir.length();
      if (dist > 0.001) {
        const newDist = dist + (targetDist - dist) * 0.04;
        dir.setLength(newDist);
        S.camera.position.copy(S.controls.target).add(dir);
      }
    }

    // ── Figure opacity transitions ────────────────────────────────
    Object.entries(S.figureMaterials).forEach(([key, matEntries]) => {
      const isActive = !active || key === active;
      const targetMul = isActive ? 1.0 : 0.18;

      matEntries.forEach(({ material, baseOpacity }) => {
        const target = baseOpacity * targetMul;
        material.opacity += (target - material.opacity) * 0.06;
      });
    });

    // ── Label opacity transitions ─────────────────────────────────
    Object.entries(S.labelSprites).forEach(([key, sprite]) => {
      const isActive = !active || key === active;
      const target = isActive ? 1.0 : 0.45;
      sprite.material.opacity += (target - sprite.material.opacity) * 0.06;
    });

    // ── Spotlight follows active (or defaults to correct) ─────────
    if (S.spotLight) {
      const spotTargetX = active
        ? S.figureXPositions[active] || S.figureXPositions["correct"]
        : S.figureXPositions["correct"];
      S.spotLight.position.x += (spotTargetX - S.spotLight.position.x) * 0.05;
      S.spotLight.target.position.x +=
        (spotTargetX - S.spotLight.target.position.x) * 0.05;
    }

    // ── Subtle idle animation — gentle sway on problem zones ──────
    const pulse = Math.sin(elapsed * 3) * 0.5 + 0.5;
    Object.entries(S.figureMaterials).forEach(([key, matEntries]) => {
      if (key === "correct") return;
      const data = POSTURE_DATA[key];
      if (!data || !data.problemRange) return;

      matEntries.forEach(({ material }) => {
        if (
          material.emissive &&
          material.color &&
          material.color.getHex() === COLORS.problemRed
        ) {
          material.emissiveIntensity = 0.2 + pulse * 0.25;
        }
      });
    });

    // ── Update controls & render ──────────────────────────────────
    S.controls.update();
    S.renderer.render(S.scene, S.camera);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (
          S.renderer.domElement &&
          container.contains(S.renderer.domElement)
        ) {
          container.removeChild(S.renderer.domElement);
        }
      }
    };
  }, [buildScene, animate]);

  /* ── Sync props into ref so animation loop can read them ──────────── */
  useEffect(() => {
    stateRef.current._activePosture = activePosture;
  }, [activePosture]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: 400, touchAction: "none" }}
    />
  );
}
