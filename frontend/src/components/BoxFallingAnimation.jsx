import React, { useEffect, useRef } from 'react';

export default function BoxFallingAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const THREE = window.THREE;
    if (!THREE) return;

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 280;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 15, 620);

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

    // Texture Generators
    const createFTIDBoxTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 384;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#0b0e14';
      ctx.fillRect(0, 0, 512, 384);

      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, 498, 370);

      ctx.font = '900 76px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#ffffff';
      ctx.fillText('FTID', 180, 192);

      ctx.fillStyle = '#00f2fe';
      ctx.fillText('.SHOP', 345, 192);

      return new THREE.CanvasTexture(canvas);
    };

    const createCourierTexture = (brand, bgColor, textColor, accentColor) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 512, 512);

      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, 220, 512, 72);
      ctx.fillRect(220, 0, 72, 512);

      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 12;
      ctx.strokeRect(8, 8, 496, 496);

      ctx.fillStyle = '#ffffff';
      if (ctx.roundRect) {
        ctx.roundRect(50, 140, 412, 232, 24);
      } else {
        ctx.fillRect(50, 140, 412, 232);
      }
      ctx.fill();

      ctx.font = '900 110px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textColor;
      ctx.fillText(brand, 256, 236);

      if (accentColor) {
        ctx.fillStyle = accentColor;
        ctx.fillRect(80, 310, 352, 20);
      }

      return new THREE.CanvasTexture(canvas);
    };

    // Pre-create Textures
    const ftidTexture = createFTIDBoxTexture();
    const courierTextures = [
      createCourierTexture('UPS', '#c88d46', '#3b1d11', '#d97706'),
      createCourierTexture('FedEx', '#4c1d95', '#ffffff', '#ff6b00'),
      createCourierTexture('USPS', '#1e3a8a', '#ffffff', '#dc2626'),
      createCourierTexture('DHL', '#eab308', '#d97706', '#dc2626'),
      createCourierTexture('SPX', '#ea580c', '#ffffff', '#2563eb')
    ];

    // 1. Center Open Main FTID.SHOP Box (Compact Size: 95x68x95)
    const mainBoxGeo = new THREE.BoxGeometry(95, 68, 95);
    const sideDarkMat = new THREE.MeshBasicMaterial({ color: 0x0b0e14 });
    const ftidMat = new THREE.MeshBasicMaterial({ map: ftidTexture });
    const openTopMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.85 });

    // Order: [ Right (+X), Left (-X), Top (+Y Open Interior Glow), Bottom (-Y), Front (+Z), Back (-Z) ]
    const mainBoxMaterials = [
      ftidMat,     // Right
      ftidMat,     // Left
      openTopMat,  // Top -> Open Glowing Cyan Interior
      sideDarkMat, // Bottom
      ftidMat,     // Front
      ftidMat      // Back
    ];

    const mainBox = new THREE.Mesh(mainBoxGeo, mainBoxMaterials);
    mainBox.position.set(0, -35, 0);
    scene.add(mainBox);

    // Glowing Cyan Edges on Main Box
    const edgeGeo = THREE.EdgesGeometry ? new THREE.EdgesGeometry(mainBoxGeo) : null;
    if (edgeGeo && THREE.LineSegments) {
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x00f2fe, linewidth: 2 });
      const mainBoxEdges = new THREE.LineSegments(edgeGeo, edgeMat);
      mainBox.add(mainBoxEdges);
    }

    // 2. Upward Light Cone Rays
    const coneGeo = THREE.CylinderGeometry ? new THREE.CylinderGeometry(95, 45, 150, 32, 1, true) : null;
    if (coneGeo) {
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0x00f2fe,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide
      });
      const lightCone = new THREE.Mesh(coneGeo, coneMat);
      lightCone.position.set(0, 45, 0);
      scene.add(lightCone);
    }

    // 3. Bottom Platform Ring
    const ringGeo = THREE.RingGeometry ? new THREE.RingGeometry(75, 115, 32) : null;
    if (ringGeo) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f2fe,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
      });
      const portalRing = new THREE.Mesh(ringGeo, ringMat);
      portalRing.rotation.x = Math.PI / 2;
      portalRing.position.set(0, -70, 0);
      scene.add(portalRing);
    }

    // 4. Rising Light Particles
    const particleCount = 40;
    const pGeo = new THREE.Geometry ? new THREE.Geometry() : null;
    const pVels = [];

    if (pGeo) {
      for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 60;
        const y = -35 + Math.random() * 130;
        const z = (Math.random() - 0.5) * 60;
        pGeo.vertices.push(new THREE.Vector3(x, y, z));
        pVels.push({
          vx: (Math.random() - 0.5) * 0.6,
          vy: 1.2 + Math.random() * 1.6,
          vz: (Math.random() - 0.5) * 0.6
        });
      }
      const pMat = THREE.ParticleBasicMaterial ? 
        new THREE.ParticleBasicMaterial({ color: 0x00f2fe, size: 2.8, transparent: true, opacity: 0.85 }) :
        new THREE.PointsMaterial({ color: 0x00f2fe, size: 2.8, transparent: true, opacity: 0.85 });
      
      const particleSys = THREE.ParticleSystem ? 
        new THREE.ParticleSystem(pGeo, pMat) : 
        new THREE.Points(pGeo, pMat);
      scene.add(particleSys);
    }

    // 5. Courier Boxes Spawner (Popping UPWARDS out of the open center box!)
    const floatingBoxes = [];

    const createPoppingBox = () => {
      const size = 20 + Math.random() * 5;
      const boxGeo = new THREE.BoxGeometry(size, size, size);
      const texture = courierTextures[Math.floor(Math.random() * courierTextures.length)];
      
      const boxMat = new THREE.MeshBasicMaterial({ map: texture });
      const box = new THREE.Mesh(boxGeo, boxMat);

      if (edgeGeo && THREE.LineSegments) {
        const bEdgeGeo = new THREE.EdgesGeometry(boxGeo);
        const bEdgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
        box.add(new THREE.LineSegments(bEdgeGeo, bEdgeMat));
      }

      box.position.set(
        (Math.random() - 0.5) * 20,
        -15,
        (Math.random() - 0.5) * 20
      );

      const angle = Math.random() * Math.PI * 2;
      const speedOut = 0.9 + Math.random() * 1.6;

      box.userData = {
        vx: Math.cos(angle) * speedOut,
        vy: 3.2 + Math.random() * 2.0, // Upward pop impulse!
        vz: Math.sin(angle) * speedOut,
        rotX: (Math.random() - 0.5) * 0.08,
        rotY: (Math.random() - 0.5) * 0.08,
        rotZ: (Math.random() - 0.5) * 0.08,
        gravity: 0.10
      };

      scene.add(box);
      floatingBoxes.push(box);
    };

    for (let i = 0; i < 5; i++) {
      createPoppingBox();
    }

    let spawnTimer = 0;
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      mainBox.rotation.y += 0.004;

      spawnTimer++;
      if (spawnTimer % 22 === 0 && floatingBoxes.length < 12) {
        createPoppingBox();
      }

      for (let i = floatingBoxes.length - 1; i >= 0; i--) {
        const box = floatingBoxes[i];

        box.position.x += box.userData.vx;
        box.position.y += box.userData.vy;
        box.position.z += box.userData.vz;

        box.userData.vy -= box.userData.gravity;

        box.rotation.x += box.userData.rotX;
        box.rotation.y += box.userData.rotY;
        box.rotation.z += box.userData.rotZ;

        if (box.position.y < -100) {
          scene.remove(box);
          floatingBoxes.splice(i, 1);
        }
      }

      if (pGeo) {
        for (let i = 0; i < particleCount; i++) {
          pGeo.vertices[i].x += pVels[i].vx;
          pGeo.vertices[i].y += pVels[i].vy;
          pGeo.vertices[i].z += pVels[i].vz;

          if (pGeo.vertices[i].y > 110) {
            pGeo.vertices[i].x = (Math.random() - 0.5) * 30;
            pGeo.vertices[i].y = -30;
            pGeo.vertices[i].z = (Math.random() - 0.5) * 30;
          }
        }
        pGeo.verticesNeedUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 280;
      const h = container.clientHeight || 280;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="box_falling_container" 
      style={{
        width: '100%',
        maxWidth: '280px',
        height: '280px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    />
  );
}
