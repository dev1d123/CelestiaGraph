import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface NodeProps {
  autoRotate?: boolean;
  background?: string;
  showAxes?: boolean;
}

const Node: React.FC<NodeProps> = ({
  autoRotate = true,
  background = "#000000",
  showAxes = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stopRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Init dimensiones ---
    let width = container.clientWidth;
    let height = container.clientHeight;
    if (!width || !height) {
      width = 400;
      height = 400;
    }

    // --- Escena y cámara ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4);
    camera.lookAt(0, 0, 0);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    const canvas = renderer.domElement;
    canvas.style.cssText = `
      display:block;
      width:100%;
      height:100%;
      cursor:grab;
      position:absolute;
      inset:0;
    `;
    container.appendChild(canvas);

    // --- Geometría nodo ---
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff3344,
      emissive: 0x330009,
      emissiveIntensity: 0.75,
      roughness: 0.35,
      metalness: 0.25,
    });
    const node = new THREE.Mesh(geometry, material);
    scene.add(node);
    if (showAxes) scene.add(new THREE.AxesHelper(2));

    // --- Luces ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(2.5, 2, 3);
    scene.add(dir);

    // --- Interacción ---
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const ROT_SPEED = 0.018;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = "grabbing";
      material.emissiveIntensity = 1;
      e.preventDefault();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      node.rotation.y += dx * ROT_SPEED;
      node.rotation.x += dy * ROT_SPEED;
    };
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      canvas.style.cursor = "grab";
      material.emissiveIntensity = 0.75;
    };
    const onDblClick = () => node.rotation.set(0, 0, 0);

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointerleave", endDrag);
    canvas.addEventListener("dblclick", onDblClick);

    // --- Primer frame ---
    renderer.render(scene, camera);

    // --- Loop ---
    let raf: number;
    const animate = () => {
      if (stopRef.current) return;
      raf = requestAnimationFrame(animate);
      if (autoRotate && !dragging) node.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // --- Resize ---
    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // --- Cleanup ---
    return () => {
      stopRef.current = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointerleave", endDrag);
      canvas.removeEventListener("dblclick", onDblClick);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(canvas)) container.removeChild(canvas);
    };
  }, [autoRotate, background, showAxes]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        touchAction: "none",
        userSelect: "none",
      }}
    />
  );
};

export default Node;
