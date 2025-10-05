import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface RingsGraphProps {
  centerLabel: string;
  depth: number;
  mode: 'reference' | 'similar';
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
  radius?: number; // nuevo
}

interface RefEdge {
  line: THREE.Line;
  node: RingNode;
}

const ROT_SPEED_REFERENCE = 0.001; // reducido
const ROT_SPEED_SIMILAR = 0.001;   // reducido
const ringCounts = [6, 12, 18, 24];
const CENTER_Y_OFFSET = 80; // nuevo offset vertical del planeta central

const RingsGraph: React.FC<RingsGraphProps> = ({ centerLabel, depth, mode, onNodeHover }) => {
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

  const makeLabelSprite = (lines: string[]) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const padding = 8;
    ctx.font = '500 20px system-ui, sans-serif';
    const width = Math.max(...lines.map(l => ctx.measureText(l).width)) + padding * 2;
    const lineHeight = 22;
    const height = lineHeight * lines.length + padding * 2;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = 'rgba(20,40,60,0.85)';
    ctx.strokeStyle = 'rgba(90,160,220,0.5)';
    ctx.lineWidth = 2;
    ctx.roundRect(1, 1, width - 2, height - 2, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d6f0ff';
    ctx.font = '500 20px system-ui, sans-serif';
    lines.forEach((l, i) => {
      ctx.fillText(l, padding, padding + (i + 0.8) * lineHeight);
    });
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    const mat = new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true });
    const sprite = new THREE.Sprite(mat);
    const scale = 0.8;
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
    ensureGroup();
    clearLabel();
    const sprite = makeLabelSprite([
      node.title,
      `E:${node.energy}  S:${node.score}`
    ]);
    sprite.position.copy(node.mesh.position.clone().add(new THREE.Vector3(0, 38, 0)));
    labelSpriteRef.current = sprite;
    groupRef.current!.add(sprite);
  };

  const buildGraph = () => {
    ensureGroup();
    if (groupRef.current) {
      while (groupRef.current.children.length) groupRef.current.remove(groupRef.current.children[0]);
    }
    nodesRef.current = [];
    clearLabel();
    refEdges.current = [];
    if (!sceneRef.current) return;

    linesGroupRef.current = new THREE.Group();
    groupRef.current!.add(linesGroupRef.current);

    const cGeo = new THREE.SphereGeometry(24, 64, 64);
    const cMat = new THREE.MeshStandardMaterial({
      color: 0x65c7ff,
      emissive: 0x1d4e6a,
      metalness: 0.5,
      roughness: 0.25
    });
    centerRef.current = new THREE.Mesh(cGeo, cMat);
    centerRef.current.position.set(0, CENTER_Y_OFFSET, 0); // aplicado offset
    groupRef.current!.add(centerRef.current);

    const glowTex = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIUlEQVQoU2NkYGD4z0AEMDEwMDCqYMQEo2E0DBgGEwXRAAAJzwYqVUIOmgAAAABJRU5ErkJggg==');
    const glowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0x43e9ff, transparent: true, opacity: 0.4, depthWrite: false });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(280, 280, 1);
    centerRef.current.add(glow);

    const rings = Math.min(Math.max(depth, 2), 4);
    const w = (containerRef.current?.clientWidth || window.innerWidth);
    const h = (containerRef.current?.clientHeight || window.innerHeight);
    const baseRadius = Math.min(w, h) * 0.35;
    const ringStep = baseRadius / (rings + 0.6);
    const ringZGap = 85;

    if (mode === 'similar') {
      const ringLayer = new THREE.Group();
      ringLayer.position.y = CENTER_Y_OFFSET; // alinear capa de anillos con el centro elevado
      groupRef.current!.add(ringLayer);
      for (let r = 0; r < rings; r++) {
        const ringRadius = (r + 1) * ringStep * 0.62 + 55; // reducido
        const torusGeo = new THREE.TorusGeometry(ringRadius, 0.65 + r * 0.10, 16, 96);
        const torusMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(0.78 - r * 0.07, 0.55, 0.55),
          transparent: true,
          opacity: 0.16 + r * 0.035,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const torus = new THREE.Mesh(torusGeo, torusMat);
        torus.rotation.set(0, 0, 0);
        ringLayer.add(torus);
      }
    }

    for (let r = 0; r < rings; r++) {
      const count = ringCounts[r];
      const ringGroup = new THREE.Group();
      ringGroup.userData.ringIndex = r;
      // NUEVO: el grupo se traslada al offset central para que la rotación mantenga los nodos en el anillo
      ringGroup.position.y = CENTER_Y_OFFSET;
      groupRef.current!.add(ringGroup);

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const ringRadius = (r + 1) * ringStep * 0.62 + 55;
        const x = Math.cos(angle) * ringRadius;
        const yLocal = Math.sin(angle) * ringRadius; // y relativo dentro del grupo (sin sumar OFFSET)
        const z = mode === 'reference'
          ? (r - (rings - 1) / 2) * ringZGap
          : 0;

        const geo = new THREE.SphereGeometry(10, 40, 40);
        const hue = mode === 'reference' ? 0.56 - r * 0.035 : 0.82 - r * 0.07;
        const color = new THREE.Color().setHSL(hue, 0.65, 0.5);
        const emiss = new THREE.Color().setHSL(hue, 0.65, mode === 'reference' ? 0.22 + r * 0.02 : 0.14 + r * 0.03);
        const mat = new THREE.MeshStandardMaterial({
          color,
          emissive: emiss,
          metalness: 0.45,
          roughness: 0.38
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, yLocal, z); // ACTUALIZADO (antes y absoluto)
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

        const haloSprite = new THREE.Sprite(glowMat.clone());
        haloSprite.material = (haloSprite.material as THREE.SpriteMaterial).clone();
        (haloSprite.material as THREE.SpriteMaterial).color = color.clone();
        (haloSprite.material as THREE.SpriteMaterial).opacity = 0.25;
        haloSprite.scale.set(70, 70, 1);
        mesh.add(haloSprite);

        ringGroup.add(mesh);

        nodesRef.current.push({
          id: `R${r}-N${i}`,
          ring: r,
          angle,
          mesh,
          energy: Math.round(40 + Math.random() * 460),
          score: parseFloat((Math.random() * 100).toFixed(1)),
          title: (mode === 'reference' ? 'Ref-' : 'Sim-') + `${r + 1}.${i + 1}`,
          radius: ringRadius // guardar radio para modo similar
        });
      }
    }

    if (mode === 'reference') {
      nodesRef.current.forEach(n => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(6);
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.LineBasicMaterial({
          color: 0x43e9ff,
          transparent: true,
          opacity: 0.35
        });
        const line = new THREE.Line(geo, mat);
        linesGroupRef.current!.add(line);
        refEdges.current.push({ line, node: n });
      });
    }
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
      const t = performance.now() * 0.001;
      const paused = !!hoveredRef.current;

      // ROTACIÓN RÍGIDA DEL ANILLO (ambos modos) SIN DESPLAZAR NODOS
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

      // SPIN LOCAL DE CADA PLANETA (no altera su posición orbital)
      nodesRef.current.forEach(n => {
        if (!paused) {
          n.mesh.rotation.y += 0.02; // giro propio
        }
      });

      // PULSO / FLICKER (sin mover posiciones)
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

      // ARISTAS DINÁMICAS EN MODO REFERENCE (siguen unidas al planeta)
      if (mode === 'reference') {
        refEdges.current.forEach(e => {
          if (!groupRef.current || !centerRef.current) return;
          const attr = e.line.geometry.getAttribute('position') as THREE.BufferAttribute;

          // POSICIONES EN ESPACIO LOCAL DEL groupRef (no mundo) PARA EVITAR DOBLE ROTACIÓN
          const centerWorld = centerRef.current.getWorldPosition(new THREE.Vector3());
          const centerLocal = groupRef.current.worldToLocal(centerWorld.clone());
          const nodeWorld = e.node.mesh.getWorldPosition(new THREE.Vector3());
          const nodeLocal = groupRef.current.worldToLocal(nodeWorld.clone());

          const dir = nodeLocal.clone().sub(centerLocal);
          const len = dir.length();
          if (len === 0) return;
          dir.normalize();

          // Radios (precalculados o computar si falta)
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

          // Puntos sobre la superficie de cada planeta
          const start = centerLocal.clone().add(dir.clone().multiplyScalar(centerRadius));
          const end = nodeLocal.clone().sub(dir.clone().multiplyScalar(nodeRadius));

          attr.setXYZ(0, start.x, start.y, start.z);
          attr.setXYZ(1, end.x, end.y, end.z);
          attr.needsUpdate = true;
        });
      }

      // HOVER / LABEL (sin cambios)
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
            hoveredRef.current.mesh.scale.multiplyScalar(1 / 1.18);
          }
          hoveredRef.current = newHover;
          if (newHover) {
            const m = newHover.mesh.material as THREE.MeshStandardMaterial;
            m.emissive = m.emissive.clone().addScalar(0.55);
            newHover.mesh.scale.multiplyScalar(1.18);
            showLabelFor(newHover);
            onNodeHover?.({
              id: newHover.id,
              title: newHover.title,
              ring: newHover.ring + 1,
              energy: newHover.energy,
              score: newHover.score
            });
          } else {
            clearLabel();
            onNodeHover?.(null);
          }
        }
      }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearLabel();
    buildGraph();
    onNodeHover?.(null);
  }, [depth, mode, centerLabel]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1
      }}
    >
    </div>
  );
};

export default RingsGraph;
