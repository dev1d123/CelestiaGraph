// src/App.tsx
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
  showAxes = false
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stopRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(2.5, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.background = "#020509"; // ayuda visual
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    if (showAxes) scene.add(new THREE.AxesHelper(2));

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(1, 1, 2);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    // ----- NUEVA ROTACIÓN INTERACTIVA (trackball básico) -----
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const rotationSpeed = 0.015;
    const tmpQuat = new THREE.Quaternion();
    const axis = new THREE.Vector3();
    const eye = new THREE.Vector3();

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      container.style.cursor = "grabbing";
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      if (dx === 0 && dy === 0) return;

      eye.copy(camera.position).sub(cube.position).normalize();
      axis.set(dy, dx, 0).normalize().applyAxisAngle(eye, 0);
      const angle = Math.sqrt(dx * dx + dy * dy) * rotationSpeed;
      tmpQuat.setFromAxisAngle(axis, angle);
      cube.quaternion.premultiply(tmpQuat);
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      container.style.cursor = "grab";
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointerleave", endDrag);

    // Doble click resetea
    const onDblClick = () => cube.rotation.set(0, 0, 0);
    container.addEventListener("dblclick", onDblClick);

    let animationId: number;
    const animate = () => {
      if (stopRef.current) return;
      animationId = requestAnimationFrame(animate);
      if (autoRotate && !dragging) {
        cube.rotation.y += 0.01;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleVisibility = () => {
      stopRef.current = document.hidden;
      if (!stopRef.current) animate();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      camera.aspect = clientWidth / clientHeight || 1;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      stopRef.current = true;
      cancelAnimationFrame(animationId);
      document.removeEventListener("visibilitychange", handleVisibility);
      resizeObserver.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointerleave", endDrag);
      container.removeEventListener("dblclick", onDblClick);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [autoRotate, background, showAxes]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        userSelect: "none",
        cursor: "grab",
        zIndex: 50, // asegurar prioridad de interacción
        touchAction: "none" // evitar scroll en mobile al rotar
      }}
    />
  );
};

export default Node;
