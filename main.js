import * as THREE from 'three';

// --- Initial Animations ---
if (window.gsap) {
    gsap.from('.hero-main-title', { y: -20, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 1.5 });
    gsap.from('.hero-title', { x: -30, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 1.7 });
    gsap.from('.hero-subtitle', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 1.7 });
    gsap.from('.cta-group', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 1.7 });
}

// --- Stats Counter Animation ---
const statsSection = document.querySelector('.stats-section');
if (statsSection && window.IntersectionObserver) {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            document.querySelectorAll('.stat-number').forEach(stat => {
                const target = parseInt(stat.getAttribute('data-target'));
                const isPercentage = stat.innerText.includes('%');
                const isPlus = stat.innerText.includes('+');
                
                const counter = { val: 0 };
                if (window.gsap) {
                    gsap.to(counter, {
                        val: target,
                        duration: 2.5,
                        ease: "power2.out",
                        onUpdate: function() {
                            let displayVal = Math.ceil(this.targets()[0].val);
                            if (isPlus) stat.innerText = "+" + displayVal;
                            else if (isPercentage) stat.innerText = displayVal + "%";
                            else stat.innerText = displayVal;
                        }
                    });
                } else {
                    stat.innerText = isPlus ? "+" + target : (isPercentage ? target + "%" : target);
                }
            });
            observer.disconnect();
        }
    }, { threshold: 0.5 });
    observer.observe(statsSection);
}

// --- THREE.JS ADVANCED 3D BACKGROUND ---
const initThreeJS = () => {
    const container = document.getElementById('webgl-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const particlesCount = 800;
    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 30;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 208, 47, 1)');
    gradient.addColorStop(1, 'rgba(255, 208, 47, 0)');
    context.fillStyle = gradient;
    context.fillRect(0,0,32,32);
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
        size: 0.15,
        map: texture,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);

    camera.position.z = 5;

    let mouseX = 0;
    let mouseY = 0;
    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth) - 0.5;
        mouseY = (event.clientY / window.innerHeight) - 0.5;
    });

    const clock = new THREE.Clock();

    const animate = () => {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        particlesMesh.rotation.y = elapsedTime * 0.05;
        particlesMesh.rotation.x = elapsedTime * 0.02;

        camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 2 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    };

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};
initThreeJS();
