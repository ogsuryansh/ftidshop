var container, camera, scene, renderer;
var particleSystem, gridHelper;
var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

window.initWave = function() {
    initCyberBg();
};

if (document.getElementById('wave')) {
    window.initWave();
}

function initCyberBg() {
    var waveEl = document.getElementById('wave');
    if (!waveEl) return;
    waveEl.innerHTML = '';

    container = document.createElement('div');
    container.className = "wave-position";
    waveEl.appendChild(container);

    var heroContainer = document.getElementById('background_main') || waveEl;
    var canvasWidth = heroContainer.clientWidth || window.innerWidth;
    var canvasHeight = heroContainer.clientHeight || 600;

    camera = new THREE.PerspectiveCamera(60, canvasWidth / canvasHeight, 1, 3000);
    camera.position.z = 700;
    camera.position.y = 100;

    scene = new THREE.Scene();

    // 1. Cyber Perspective Horizon Grid Floor
    if (THREE.GridHelper) {
        gridHelper = new THREE.GridHelper(2400, 36, 0x00f2fe, 0x7f00ff);
        gridHelper.position.y = -220;
        scene.add(gridHelper);
    }

    // 2. Floating Cyber Constellation Nodes
    var particleCount = 100;
    var geometry = new THREE.Geometry ? new THREE.Geometry() : null;

    if (geometry) {
        for (var i = 0; i < particleCount; i++) {
            var x = (Math.random() - 0.5) * 1600;
            var y = (Math.random() - 0.5) * 600;
            var z = (Math.random() - 0.5) * 1200;
            geometry.vertices.push(new THREE.Vector3(x, y, z));
        }

        var pMaterial = THREE.ParticleBasicMaterial ? 
            new THREE.ParticleBasicMaterial({ color: 0x00f2fe, size: 3.5, transparent: true, opacity: 0.7 }) :
            new THREE.PointsMaterial({ color: 0x00f2fe, size: 3.5, transparent: true, opacity: 0.7 });

        particleSystem = THREE.ParticleSystem ? 
            new THREE.ParticleSystem(geometry, pMaterial) : 
            new THREE.Points(geometry, pMaterial);
        scene.add(particleSystem);
    }

    // 3. Renderer Setup
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch(e) {
        if (THREE.CanvasRenderer) {
            renderer = new THREE.CanvasRenderer({ alpha: true });
        } else {
            return;
        }
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(canvasWidth, canvasHeight);
    container.appendChild(renderer.domElement);

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.15;
    mouseY = (event.clientY - windowHalfY) * 0.15;
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    var heroContainer = document.getElementById('background_main');
    if (heroContainer && renderer && camera) {
        var canvasWidth = heroContainer.clientWidth;
        var canvasHeight = heroContainer.clientHeight;
        camera.aspect = canvasWidth / canvasHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvasWidth, canvasHeight);
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    if (camera && scene && renderer) {
        camera.position.x += (mouseX - camera.position.x) * 0.02;
        camera.position.y += (-mouseY + 100 - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        if (particleSystem) {
            particleSystem.rotation.y += 0.001;
        }
        if (gridHelper) {
            gridHelper.rotation.y += 0.0005;
        }

        renderer.render(scene, camera);
    }
}