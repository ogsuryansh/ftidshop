import React, { useEffect, useRef } from 'react';

export default function Hero3DScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const THREE = window.THREE;
    if (!THREE) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.z = 380;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      if (THREE.CanvasRenderer) {
        renderer = new THREE.CanvasRenderer({ alpha: true });
      } else {
        return;
      }
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // Outer 3D Icosahedron
    const outerGeo = new THREE.IcosahedronGeometry(110, 1);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    scene.add(outerMesh);

    // Inner 3D Octahedron
    const innerGeo = new THREE.OctahedronGeometry(55, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x7f00ff,
      wireframe: true,
      transparent: true,
      opacity: 0.95
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // Orbiting Particles
    const particlesGeo = new THREE.Geometry();
    for (let i = 0; i < 180; i++) {
      const particle = new THREE.Vector3(
        (Math.random() - 0.5) * 340,
        (Math.random() - 0.5) * 340,
        (Math.random() - 0.5) * 340
      );
      particlesGeo.vertices.push(particle);
    }

    const particlesMat = THREE.ParticleBasicMaterial ? 
      new THREE.ParticleBasicMaterial({ color: 0x00f2fe, size: 2.5 }) :
      new THREE.PointsMaterial({ color: 0x00f2fe, size: 2.5 });

    const particles = THREE.ParticleSystem ? 
      new THREE.ParticleSystem(particlesGeo, particlesMat) : 
      new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // Animation & Mouse Interaction
    let animationFrameId;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / height - 0.5) * 2;
    };

    container.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      outerMesh.rotation.x += 0.006 + mouseY * 0.02;
      outerMesh.rotation.y += 0.009 + mouseX * 0.02;

      innerMesh.rotation.x -= 0.01;
      innerMesh.rotation.y -= 0.014;

      particles.rotation.y += 0.003;
      particles.rotation.x += 0.001;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="hero_3d_container" 
      style={{
        width: '100%',
        height: '360px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    />
  );
}
