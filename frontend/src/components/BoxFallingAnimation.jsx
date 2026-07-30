import React, { useEffect, useRef } from 'react';

export default function BoxFallingAnimation() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const THREE = window.THREE;
    if (!THREE) return;

    const width = container.clientWidth || 420;
    const height = container.clientHeight || 440;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 20, 480);

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

      // Cardboard box background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 512, 512);

      // Packing tape horizontal & vertical straps
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, 220, 512, 72);
      ctx.fillRect(220, 0, 72, 512);

      // Outer seam border
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 12;
      ctx.strokeRect(8, 8, 496, 496);

      // Large White Brand Badge Box in center
      ctx.fillStyle = '#ffffff';
      if (ctx.roundRect) {
        ctx.roundRect(50, 140, 412, 232, 24);
      } else {
        ctx.fillRect(50, 140, 412, 232);
      }
      ctx.fill();

      // Brand Name in big bold font
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
      createCourierTexture('FedEx', '#d49a55', '#4c1d95', '#ff6b00'),
      createCourierTexture('DHL', '#eab308', '#d97706', '#dc2626'),
      createCourierTexture('USPS', '#b87e3b', '#1e3a8a', '#dc2626'),
      createCourierTexture('SPX', '#d49a55', '#ea580c', '#2563eb')
    ];

    // 1. Top Main FTID.SHOP Box with FTID.SHOP texture on ALL 6 FACES
    const mainBoxGeo = new THREE.BoxGeometry(125, 85, 125);
    const mainBoxMat = new THREE.MeshBasicMaterial({ map: ftidTexture });

    const mainBox = new THREE.Mesh(mainBoxGeo, mainBoxMat);
    mainBox.position.set(0, 140, 0);
    scene.add(mainBox);

    // Glowing Cyan Edges on Main Box
    const edgeGeo = THREE.EdgesGeometry ? new THREE.EdgesGeometry(mainBoxGeo) : null;
    if (edgeGeo && THREE.LineSegments) {
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x00f2fe, linewidth: 2 });
      const mainBoxEdges = new THREE.LineSegments(edgeGeo, edgeMat);
      mainBox.add(mainBoxEdges);
    }

    // 2. Light Beam Column connecting Top & Bottom
    const beamGeo = THREE.CylinderGeometry ? new THREE.CylinderGeometry(55, 95, 270, 32, 1, true) : null;
    if (beamGeo) {
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x00f2fe,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, -5, 0);
      scene.add(beam);
    }

    // 3. Bottom Glowing Portal Platform Ring
    const ringGeo = THREE.RingGeometry ? new THREE.RingGeometry(85, 135, 32) : null;
    let portalRing;
    if (ringGeo) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f2fe,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      portalRing = new THREE.Mesh(ringGeo, ringMat);
      portalRing.rotation.x = Math.PI / 2;
      portalRing.position.set(0, -145, 0);
      scene.add(portalRing);
    }

    // Outer Purple Ring
    const outerRingGeo = THREE.RingGeometry ? new THREE.RingGeometry(138, 148, 32) : null;
    if (outerRingGeo) {
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: 0x7f00ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
      outerRing.rotation.x = Math.PI / 2;
      outerRing.position.set(0, -145, 0);
      scene.add(outerRing);
    }

    // 4. Rising Light Particles
    const particleCount = 40;
    const pGeo = new THREE.Geometry ? new THREE.Geometry() : null;
    const pSpeeds = [];

    if (pGeo) {
      for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 160;
        const y = -140 + Math.random() * 270;
        const z = (Math.random() - 0.5) * 160;
        pGeo.vertices.push(new THREE.Vector3(x, y, z));
        pSpeeds.push(1 + Math.random() * 1.5);
      }
      const pMat = THREE.ParticleBasicMaterial ? 
        new THREE.ParticleBasicMaterial({ color: 0x00f2fe, size: 3.5, transparent: true, opacity: 0.8 }) :
        new THREE.PointsMaterial({ color: 0x00f2fe, size: 3.5, transparent: true, opacity: 0.8 });
      
      const particleSys = THREE.ParticleSystem ? 
        new THREE.ParticleSystem(pGeo, pMat) : 
        new THREE.Points(pGeo, pMat);
      scene.add(particleSys);
    }

    // 5. Falling Courier Boxes Spawner
    const fallingBoxes = [];

    const createFallingBox = () => {
      const size = 30 + Math.random() * 6;
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
        (Math.random() - 0.5) * 65,
        95,
        (Math.random() - 0.5) * 65
      );

      box.userData = {
        speedY: 2.2 + Math.random() * 2.0,
        rotX: (Math.random() - 0.5) * 0.08,
        rotY: (Math.random() - 0.5) * 0.08,
        rotZ: (Math.random() - 0.5) * 0.08
      };

      scene.add(box);
      fallingBoxes.push(box);
    };

    // Initial batch
    for (let i = 0; i < 7; i++) {
      createFallingBox();
      fallingBoxes[i].position.y = 95 - i * 32;
    }

    let spawnTimer = 0;
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      mainBox.rotation.y += 0.005;

      if (portalRing) {
        portalRing.rotation.z += 0.012;
      }

      spawnTimer++;
      if (spawnTimer % 22 === 0 && fallingBoxes.length < 20) {
        createFallingBox();
      }

      for (let i = fallingBoxes.length - 1; i >= 0; i--) {
        const box = fallingBoxes[i];
        box.position.y -= box.userData.speedY;
        box.rotation.x += box.userData.rotX;
        box.rotation.y += box.userData.rotY;
        box.rotation.z += box.userData.rotZ;

        if (box.position.y < -145) {
          scene.remove(box);
          fallingBoxes.splice(i, 1);
        }
      }

      if (pGeo) {
        for (let i = 0; i < particleCount; i++) {
          pGeo.vertices[i].y += pSpeeds[i];
          if (pGeo.vertices[i].y > 130) {
            pGeo.vertices[i].y = -140;
          }
        }
        pGeo.verticesNeedUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 420;
      const h = container.clientHeight || 440;
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
        maxWidth: '420px',
        height: '420px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    />
  );
}
