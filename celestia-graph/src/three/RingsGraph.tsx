import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

// NUEVO: tipo referencia (puede compartirlo vía .d.ts si prefieres)
export type ReferenceNode = {
  id: string;
  nombre: string;
  autores: string[];
  fecha: string | null;
};

interface RingsGraphProps {
  centerLabel: string;
  depth: number;
  mode?: 'reference' | 'similar';
  references?: ReferenceNode[]; // NUEVO
  onNodeHover?: (info: { id: string; title: string; ring: number; energy: number; score: number } | null) => void;
}

interface RingNode {
  id: string;
  ring: number;
  angle: number;
  mesh: THREE.Mesh;
  energy: number;
  score: number;
  title: string;
  radius?: number;
  meta?: ReferenceNode; // NUEVO (solo en modo reference)
}

interface RefEdge {
  line: THREE.Line;
  node: RingNode;
}

const ROT_SPEED_REFERENCE = 0.001;
const ROT_SPEED_SIMILAR = 0.001;
const ringCounts = [6, 12, 18, 24];
const CENTER_Y_OFFSET = 80;

const RingsGraph: React.FC<RingsGraphProps> = ({
  centerLabel,
  depth,
  mode = 'reference',
  references = [], // NUEVO
  onNodeHover
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const nodesRef = useRef<RingNode[]>([]);
  const centerRef = useRef<THREE.Mesh | null>(null);
  const linesGroupRef = useRef<THREE.Group | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  const hoveredRef = useRef<RingNode | null>(null);
  const animReq = useRef(0);
  const groupRef = useRef<THREE.Group | null>(null);
  const labelSpriteRef = useRef<THREE.Sprite | null>(null);
  const isDraggingRef = useRef(false);
  const lastDragRef = useRef({ x: 0, y: 0 });
  const refEdges = useRef<RefEdge[]>([]);

  const [hoverRef, setHoverRef] = useState<ReferenceNode | null>(null); // NUEVO
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // NUEVO
  const [simHoverTitle, setSimHoverTitle] = useState<string | null>(null); // NEW similar hover title

  const onMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const makeLabelSprite = (title: string) => {
    // Transparent canvas (no square / box)
    const wrapWords = (text: string, max = 42) => {
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let cur = '';
      for (const w of words) {
        if ((cur + ' ' + w).trim().length > max) {
          if (cur) lines.push(cur);
          cur = w;
        } else {
          cur = (cur ? cur + ' ' : '') + w;
        }
      }
      if (cur) lines.push(cur);
      return lines.slice(0, 4);
    };
    const lines = wrapWords(title);
    const paddingX = 4;
    const paddingY = 2;
    const lineHeight = 18;
    const font = '600 16px system-ui, sans-serif';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = font;
    const width = Math.max(...lines.map(l => ctx.measureText(l).width)) + paddingX * 2;
    const height = lineHeight * lines.length + paddingY * 2;
    canvas.width = width;
    canvas.height = height;
    // No background / border -> only text
    ctx.font = font;
    ctx.fillStyle = '#e9f4ff';
    lines.forEach((l, i) => {
      ctx.fillText(l, paddingX, paddingY + (i + 0.8) * lineHeight);
    });
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    const mat = new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true });
    const sprite = new THREE.Sprite(mat);
    const scale = 0.65;
    sprite.scale.set(width * scale, height * scale, 1);
    return sprite;
  };

  const ensureGroup = () => {
    if (!sceneRef.current) return;
    if (!groupRef.current) {
      groupRef.current = new THREE.Group();
      sceneRef.current.add(groupRef.current);
    }
  };

  const clearLabel = () => {
    if (labelSpriteRef.current && groupRef.current) {
      groupRef.current.remove(labelSpriteRef.current);
      (labelSpriteRef.current.material as THREE.SpriteMaterial).map?.dispose();
      labelSpriteRef.current.material.dispose();
      labelSpriteRef.current = null;
    }
  };

  const showLabelFor = (node: RingNode) => {
    // keep ONLY for reference mode (sprite removed for similar mode)
    if (mode === 'similar') return;
    ensureGroup();
    clearLabel();
    const sprite = makeLabelSprite(node.title);
    if (centerRef.current) {
      const fromCenter = node.mesh.position.clone().sub(centerRef.current.position);
      if (fromCenter.lengthSq() > 0.0001) fromCenter.normalize().multiplyScalar(34); // increased offset
      sprite.position.copy(
        node.mesh.position.clone()
          .add(fromCenter)
          .add(new THREE.Vector3(0, 8, 0))
      );
    } else {
      sprite.position.copy(node.mesh.position.clone().add(new THREE.Vector3(0, 32, 0)));
    }
    labelSpriteRef.current = sprite;
    groupRef.current!.add(sprite);
  };

  // Factor de escala para hover (nodo + halo similar)
  const HOVER_NODE_SCALE = 1.18;
  const HOVER_HALO_SCALE = 1.35;

  const buildGraph = () => {
    ensureGroup();
    if (groupRef.current) {
      while (groupRef.current.children.length) groupRef.current.remove(groupRef.current.children[0]);
    }
    nodesRef.current = [];
    clearLabel();
    refEdges.current = [];
    setHoverRef(null);
    if (!sceneRef.current) return;

    linesGroupRef.current = new THREE.Group();
    groupRef.current!.add(linesGroupRef.current);

    // Centro
    const cGeo = new THREE.SphereGeometry(24, 64, 64);
    const cMat = new THREE.MeshStandardMaterial({
      color: 0x65c7ff,
      emissive: 0x1d4e6a,
      metalness: 0.5,
      roughness: 0.25
    });
    centerRef.current = new THREE.Mesh(cGeo, cMat);
    centerRef.current.position.set(0, CENTER_Y_OFFSET);
    groupRef.current!.add(centerRef.current);

    const glowTex = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIUlEQVQoU2NkYGD4z0AEMDEwMDCqYMQEo2E0DBgGEwXRAAAJzwYqVUIOmgAAAABJRU5ErkJggg==');
    const glowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0x43e9ff, transparent: true, opacity: 0.4, depthWrite: false });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(280, 280, 1);
    centerRef.current.add(glow);

    if (mode === 'similar') {
      ensureGroup();
      // Nuevo: usar referencias reales si vienen (GraphSunPage las pasa con titles)
      const refs = references || [];
      const totalRefs = refs.length;
      if (totalRefs === 0) {
        // fallback al comportamiento previo (placeholders)
        // ...existing original similar branch code (sin cambios)...
        const rings = Math.min(Math.max(depth, 2), 4);
        const w = (containerRef.current?.clientWidth || window.innerWidth);
        const h = (containerRef.current?.clientHeight || window.innerHeight);
        const baseRadius = Math.min(w, h) * 0.35;
        const ringStep = baseRadius / (rings + 0.6);
        const ringLayer = new THREE.Group();
        ringLayer.position.y = CENTER_Y_OFFSET;
        groupRef.current!.add(ringLayer);
        for (let r = 0; r < rings; r++) {
          const ringRadius = (r + 1) * ringStep * 0.62 + 55;
          const torusGeo = new THREE.TorusGeometry(ringRadius, 0.65 + r * 0.10, 16, 96);
          const torusMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.78 - r * 0.07, 0.55, 0.55),
            transparent: true,
            opacity: 0.16 + r * 0.035,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          });
          ringLayer.add(new THREE.Mesh(torusGeo, torusMat));
        }
        for (let r = 0; r < rings; r++) {
          const count = ringCounts[r];
          const ringGroup = new THREE.Group();
          ringGroup.userData.ringIndex = r;
          ringGroup.position.y = CENTER_Y_OFFSET;
          groupRef.current!.add(ringGroup);
          for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const ringRadius = (r + 1) * ringStep * 0.62 + 55;
            const x = Math.cos(angle) * ringRadius;
            const yLocal = Math.sin(angle) * ringRadius;
            const geo = new THREE.SphereGeometry(10, 40, 40);
            const hue = 0.82 - r * 0.07;
            const color = new THREE.Color().setHSL(hue, 0.65, 0.5);
            const emiss = new THREE.Color().setHSL(hue, 0.65, 0.14 + r * 0.03);
            const mat = new THREE.MeshStandardMaterial({ color, emissive: emiss, metalness: 0.45, roughness: 0.38 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, yLocal, 0);
            mesh.userData.baseEmissive = emiss.clone();
            mesh.userData.ring = r;
            const tGeo = new THREE.TorusGeometry(13, 1.2, 12, 48);
            const tMat = new THREE.MeshBasicMaterial({
              color: color.clone().offsetHSL(0, 0, 0.15),
              transparent: true,
              opacity: 0.4,
              blending: THREE.AdditiveBlending
            });
            const torus = new THREE.Mesh(tGeo, tMat);
              torus.rotation.x = Math.PI / 2.2;
            mesh.add(torus);
            const haloTex = createHaloTexture(color);
            const haloMat = new THREE.SpriteMaterial({
              map: haloTex,
              transparent: true,
              depthWrite: false,
              depthTest: false,
              blending: THREE.AdditiveBlending,
              opacity: 0.85
            });
            const haloSprite = new THREE.Sprite(haloMat);
            haloSprite.scale.set(60, 60, 1);
            mesh.add(haloSprite);
            mesh.userData.halo = haloSprite; // guardar ref para hover
            ringGroup.add(mesh);
            nodesRef.current.push({
              id: `R${r}-N${i}`,
              ring: r,
              angle,
              mesh,
              energy: Math.round(40 + Math.random() * 460),
              score: parseFloat((Math.random() * 100).toFixed(1)),
              title: `Sim-${r + 1}.${i + 1}`,
              radius: ringRadius
            });
          }
        }
        return;
      }

      // NUEVO: distribución real basada en titles (hasta capacidad total 60)
      const capped = refs.slice(0, ringCounts.reduce((a,b)=>a+b,0)); // max 60
      // decidir número de anillos mínimo que cubra total
      let ringsNeeded = 1;
      let acc = ringCounts[0];
      while (acc < capped.length && ringsNeeded < 4) {
        ringsNeeded++;
        acc += ringCounts[ringsNeeded - 1];
      }
      const rings = ringsNeeded;

      const w = (containerRef.current?.clientWidth || window.innerWidth);
      const h = (containerRef.current?.clientHeight || window.innerHeight);
      const baseRadius = Math.min(w, h) * 0.35;
      const ringStep = baseRadius / (rings + 0.6);

      // Dibujar toros
      const ringLayer = new THREE.Group();
      ringLayer.position.y = CENTER_Y_OFFSET;
      groupRef.current!.add(ringLayer);
      for (let r = 0; r < rings; r++) {
        const ringRadius = (r + 1) * ringStep * 0.62 + 55;
        const torusGeo = new THREE.TorusGeometry(ringRadius, 0.65 + r * 0.10, 16, 96);
        const torusMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(0.78 - r * 0.07, 0.55, 0.55),
          transparent: true,
          opacity: 0.16 + r * 0.035,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        ringLayer.add(new THREE.Mesh(torusGeo, torusMat));
      }

      // Distribución secuencial
      let cursor = 0;
      for (let r = 0; r < rings; r++) {
        const capacity = ringCounts[r];
        const remaining = capped.length - cursor;
        const count = Math.min(capacity, remaining);
        const ringGroup = new THREE.Group();
        ringGroup.userData.ringIndex = r;
        ringGroup.position.y = CENTER_Y_OFFSET;
        groupRef.current!.add(ringGroup);

        for (let i = 0; i < count; i++) {
          const ref = capped[cursor + i];
          const angle = (i / count) * Math.PI * 2;
          const ringRadius = (r + 1) * ringStep * 0.62 + 55;
          const x = Math.cos(angle) * ringRadius;
          const yLocal = Math.sin(angle) * ringRadius;

          const geo = new THREE.SphereGeometry(10, 40, 40);
          const hue = 0.1 + 0.55 * (cursor + i) / Math.max(capped.length - 1, 1);
          const color = new THREE.Color().setHSL(hue, 0.65, 0.5);
          const emiss = new THREE.Color().setHSL(hue, 0.65, 0.18);
          const mat = new THREE.MeshStandardMaterial({
            color,
            emissive: emiss,
            metalness: 0.42,
            roughness: 0.38
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(x, yLocal, 0);
          mesh.userData.baseEmissive = emiss.clone();
          mesh.userData.ring = r;

          const ringDecorGeo = new THREE.TorusGeometry(13, 1.2, 12, 48);
          const ringDecorMat = new THREE.MeshBasicMaterial({
            color: color.clone().offsetHSL(0, 0, 0.15),
            transparent: true,
            opacity: 0.42,
            blending: THREE.AdditiveBlending
          });
          const torus = new THREE.Mesh(ringDecorGeo, ringDecorMat);
          torus.rotation.x = Math.PI / 2.2;
          mesh.add(torus);

          const haloTex = createHaloTexture(color);
          const haloMat = new THREE.SpriteMaterial({
            map: haloTex,
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            opacity: 0.9
          });
          const halo = new THREE.Sprite(haloMat);
          halo.scale.set(56, 56, 1);
          mesh.add(halo);
          mesh.userData.halo = halo;

          ringGroup.add(mesh);

          const titleRaw = (ref.nombre || ref.title || ref.label || ref.name || '').trim() || `Article ${cursor + i + 1}`;
          nodesRef.current.push({
            id: `SIM-${cursor + i}`,
              ring: r,
            angle,
            mesh,
            energy: 0,
            score: 0,
            title: titleRaw.slice(0, 80), // truncado ligero
            radius: ringRadius,
            meta: ref // guardamos por consistencia (aunque similar)
          });
        }
        cursor += count;
        if (cursor >= capped.length) break;
      }
      return;
    }

    // -------- NUEVO: modo 'reference' ESFÉRICO --------
    const totalRefs = references.length;
    if (!totalRefs) return;

    const w = (containerRef.current?.clientWidth || window.innerWidth);
    const h = (containerRef.current?.clientHeight || window.innerHeight);
    const minSide = Math.min(w, h);

    // Radio de la esfera (dejar espacio al centro y cámara)
    const sphereRadius = minSide * 0.33 + 95;

    // Golden angle para distribución homogénea
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    // Grupo que rotará (para aprovechar lógica de animación existente)
    const sphereGroup = new THREE.Group();
    sphereGroup.userData.ringIndex = 0; // reutiliza animación
    sphereGroup.position.y = CENTER_Y_OFFSET;
    groupRef.current!.add(sphereGroup);

    references.forEach((ref, i) => {
      // Fibonacci sphere
      const y = 1 - (2 * (i + 0.5)) / totalRefs; // [-1,1]
      const r = Math.sqrt(1 - y * y);
      const theta = i * goldenAngle;

      // Coordenadas normales (x,z) en plano horizontal
      let x = Math.cos(theta) * r;
      let z = Math.sin(theta) * r;

      // Escalar al radio de la esfera
      x *= sphereRadius;
      z *= sphereRadius;
      const yPos = y * (sphereRadius * 0.78); // comprimir un poco en Y para mejor lectura

      // Pequeña variación aleatoria sutil
      const jitter = 6;
      x += (Math.random() - 0.5) * jitter;
      z += (Math.random() - 0.5) * jitter;

      const size = 7 + Math.min(7, Math.log2(1 + ref.autores.length) * 2.2);
      const geo = new THREE.SphereGeometry(size, 40, 40);
      const hue = 0.05 + 0.45 * (i / totalRefs); // degradado
      const color = new THREE.Color().setHSL(hue, 0.63, 0.55);
      const emiss = new THREE.Color().setHSL(hue, 0.63, 0.22);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: emiss,
        metalness: 0.42,
        roughness: 0.4
      });
      const mesh = new THREE.Mesh(geo, mat);
      // Posición relativa al centro (sphereGroup ya está a CENTER_Y_OFFSET)
      mesh.position.set(x, yPos - CENTER_Y_OFFSET, z);
      mesh.userData.baseEmissive = emiss.clone();
      mesh.userData.ring = 0;
      sphereGroup.add(mesh);

      // Halo radial SIN borde cuadrado (reemplaza bloque anterior de halo)
      const haloTex = createHaloTexture(color);
      const haloMat = new THREE.SpriteMaterial({
        map: haloTex,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending
      });
      const halo = new THREE.Sprite(haloMat);
      halo.scale.set(size * 3, size * 3, 1); // un poco mayor que antes para suavizar
      mesh.add(halo);

      nodesRef.current.push({
        id: `REF-${i}`,
        ring: 0,
        angle: theta,
        mesh,
        energy: 0,
        score: 0,
        title: ref.nombre.slice(0, 70),
        radius: sphereRadius,
        meta: ref
      });

      // Línea dinámica (se actualiza cada frame para tocar tangencialmente ambas esferas)
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: color.clone().offsetHSL(0, 0, -0.15),
        transparent: true,
        opacity: 0.42
      });
      const line = new THREE.Line(lineGeo, lineMat);
      linesGroupRef.current!.add(line);
      refEdges.current.push({ line, node: nodesRef.current[nodesRef.current.length - 1] });
    });
    // -------- FIN NUEVO modo reference --------
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(48, containerRef.current.clientWidth / containerRef.current.clientHeight, 1, 5000);
    camera.position.set(0, 0, 820);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x557799, 1.1));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(600, 800, 900);
    scene.add(dir);

    buildGraph();
    ensureGroup();

    const onResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      buildGraph();
    };
    window.addEventListener('resize', onResize);

    const onPointerDown = (ev: PointerEvent) => {
      isDraggingRef.current = true;
      lastDragRef.current.x = ev.clientX;
      lastDragRef.current.y = ev.clientY;
    };
    const onPointerUp = () => {
      isDraggingRef.current = false;
    };
    const onPointerLeave = () => { isDraggingRef.current = false; };

    const onPointerMove = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.current.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      if (isDraggingRef.current && groupRef.current) {
        const dx = ev.clientX - lastDragRef.current.x;
        const dy = ev.clientY - lastDragRef.current.y;
        lastDragRef.current.x = ev.clientX;
        lastDragRef.current.y = ev.clientY;
        groupRef.current.rotation.y += dx * 0.005;
        groupRef.current.rotation.x = THREE.MathUtils.clamp(groupRef.current.rotation.x + dy * 0.005, -Math.PI / 3, Math.PI / 3);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    const animate = () => {
      animReq.current = requestAnimationFrame(animate);
      const t = performance.now() * 0.001; // FIX: removed stray '1'
      const paused = !!hoveredRef.current;

      if (!paused) {
        groupRef.current?.children.forEach(child => {
          if ((child as any).userData?.ringIndex !== undefined) {
            const idx = (child as any).userData.ringIndex;
            const speed = (mode === 'reference'
              ? ROT_SPEED_REFERENCE
              : ROT_SPEED_SIMILAR * 0.75) * (idx % 2 === 0 ? 1 : -1);
            child.rotation.z += speed;
          }
        });
      }

      nodesRef.current.forEach(n => {
        if (!paused) {
          n.mesh.rotation.y += 0.02;
        }
      });

      nodesRef.current.forEach(n => {
        const mat = n.mesh.material as THREE.MeshStandardMaterial;
        if (!paused) {
          if (mode === 'similar') {
            const flick = 0.01 * Math.sin(t * 5 + n.ring);
            mat.emissive.copy(n.mesh.userData.baseEmissive).addScalar(flick);
          } else {
            mat.emissive.copy(n.mesh.userData.baseEmissive);
          }
        }
      });

      if (mode === 'reference') {
        refEdges.current.forEach(e => {
          if (!groupRef.current || !centerRef.current) return;
          const attr = e.line.geometry.getAttribute('position') as THREE.BufferAttribute;

          const centerWorld = centerRef.current.getWorldPosition(new THREE.Vector3());
          const centerLocal = groupRef.current.worldToLocal(centerWorld.clone());
          const nodeWorld = e.node.mesh.getWorldPosition(new THREE.Vector3());
          const nodeLocal = groupRef.current.worldToLocal(nodeWorld.clone());

          const dir = nodeLocal.clone().sub(centerLocal);
          const len = dir.length();
          if (len === 0) return;
          dir.normalize();

          if (!centerRef.current.geometry.boundingSphere) {
            centerRef.current.geometry.computeBoundingSphere();
          }
          if (!e.node.mesh.geometry.boundingSphere) {
            e.node.mesh.geometry.computeBoundingSphere();
          }
          const centerRadius =
            centerRef.current.geometry.boundingSphere?.radius ??
            (centerRef.current.geometry as any)?.parameters?.radius ??
            24;
          const nodeRadius =
            e.node.mesh.geometry.boundingSphere?.radius ??
            (e.node.mesh.geometry as any)?.parameters?.radius ??
            10;

          const start = centerLocal.clone().add(dir.clone().multiplyScalar(centerRadius));
          const end = nodeLocal.clone().sub(dir.clone().multiplyScalar(nodeRadius));

          attr.setXYZ(0, start.x, start.y, start.z);
          attr.setXYZ(1, end.x, end.y, end.z);
          attr.needsUpdate = true;
        });
      }

// ...existing code...
      if (cameraRef.current) {
        raycaster.current.setFromCamera(pointer.current, cameraRef.current);
        const intersects = raycaster.current.intersectObjects(nodesRef.current.map(n => n.mesh));
        const first = intersects[0]?.object;
        let newHover: RingNode | null = null;
        if (first) newHover = nodesRef.current.find(n => n.mesh === first) || null;
        if (newHover !== hoveredRef.current) {
          if (hoveredRef.current) {
            const pm = hoveredRef.current.mesh.material as THREE.MeshStandardMaterial;
            pm.emissive.copy(hoveredRef.current.mesh.userData.baseEmissive);
            hoveredRef.current.mesh.scale.setScalar(
              hoveredRef.current.mesh.scale.x / HOVER_NODE_SCALE
            );
            const prevHalo: THREE.Sprite | undefined = hoveredRef.current.mesh.userData.halo;
            if (prevHalo) {
              prevHalo.scale.set(
                prevHalo.scale.x / HOVER_HALO_SCALE,
                prevHalo.scale.y / HOVER_HALO_SCALE,
                1
              );
              (prevHalo.material as THREE.SpriteMaterial).opacity = 0.9;
            }
          }
          hoveredRef.current = newHover;
          if (newHover) {
            if (containerRef.current) containerRef.current.style.cursor = 'pointer';
            const m = newHover.mesh.material as THREE.MeshStandardMaterial;
            m.emissive = m.emissive.clone().addScalar(0.45);
            newHover.mesh.scale.multiplyScalar(HOVER_NODE_SCALE);

            if (mode === 'similar') {
              const halo: THREE.Sprite | undefined = newHover.mesh.userData.halo;
              if (halo) {
                halo.scale.multiplyScalar(HOVER_HALO_SCALE);
                (halo.material as THREE.SpriteMaterial).opacity = 1.0;
              }
            }
            // UNIFICADO: siempre usar el mismo tooltip solo con título
            clearLabel();                  // no usamos sprite en ningún modo
            setSimHoverTitle(newHover.title);
            setHoverRef(null);             // ya no se usa tooltip de referencia
            if (mode === 'similar') {
              onNodeHover?.({
                id: newHover.id,
                title: newHover.title,
                ring: newHover.ring + 1,
                energy: newHover.energy,
                score: newHover.score
              });
            } else {
              onNodeHover?.(null);
            }
          } else {
            if (containerRef.current) containerRef.current.style.cursor = 'grab';
            clearLabel();
            setHoverRef(null);
            setSimHoverTitle(null);
            onNodeHover?.(null);
          }
        }
      }
// ...existing code...

      if (centerRef.current) centerRef.current.rotation.y += paused ? 0.0015 : 0.0035;

      renderer.render(scene, cameraRef.current!);
    };
    animate();

    return () => {
      cancelAnimationFrame(animReq.current);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.dispose();
      scene.clear();
      nodesRef.current = [];
      clearLabel();
    };
  }, []);

  useEffect(() => {
    clearLabel();
    setSimHoverTitle(null); // reset tooltip when dependencies change
    buildGraph();
    if (mode === 'similar') onNodeHover?.(null);
  }, [depth, mode, centerLabel, references]); // NUEVO: references

  // default cursor on mount
  useEffect(() => {
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0 }} onMouseMove={onMove}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
      {/* Tooltip unificado: solo título, ambos modos */}
      {simHoverTitle && (
        <div
          style={{
            position: 'fixed',
            left: mousePos.x + 14,
            top: mousePos.y + 14,
            zIndex: 300,
            padding: '.42rem .6rem .48rem',
            fontSize: '.6rem',
            letterSpacing: '.5px',
            fontWeight: 600,
            color: '#e9f4ff',
            background: 'linear-gradient(135deg, rgba(18,34,54,.9), rgba(10,20,32,.88))',
            border: '1px solid rgba(160,200,255,0.22)',
            borderRadius: '.6rem',
            boxShadow: '0 6px 18px -8px #000',
            maxWidth: '340px',
            pointerEvents: 'none',
            lineHeight: 1.25,
            whiteSpace: 'normal'
          }}
        >
          {simHoverTitle}
        </div>
      )}
    </div>
  );
}; // FIX: added missing closing brace for component

// RE-ADDED: halo texture generator (was removed, buildGraph calls it)
const createHaloTexture = (color: THREE.Color, resolution = 256) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    resolution / 2,
    resolution / 2,
    0,
    resolution / 2,
    resolution / 2,
    resolution / 2
  );
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.85)`);
  grad.addColorStop(0.35, `rgba(${r},${g},${b},0.45)`);
  grad.addColorStop(0.65, `rgba(${r},${g},${b},0.15)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, resolution, resolution);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
};

export default RingsGraph;
