import * as THREE from 'three';

// --- Initial Animations ---
if (window.gsap) {
    gsap.from('.hero-main-title', { y: -20, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 1.5 });
    gsap.from('.hero-title', { x: -30, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 1.7 });
    gsap.from('.hero-subtitle', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 1.7 });
    gsap.from('.cta-group', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 1.7 });
}

// --- Video Hover Logic (Ahora es dinámico y se aplica después del fetch) ---

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

// --- Carga Dinámica de Catálogo ---
const loadCatalog = async () => {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;

    try {
        const res = await fetch('/api/designs');
        if (!res.ok) throw new Error('Fallo al obtener diseños');
        const designs = await res.json();
        
        grid.innerHTML = '';
        designs.forEach(d => {
            const card = document.createElement('div');
            card.className = 'catalog-card';
            card.innerHTML = `
                <div class="video-wrapper">
                    <video loop muted playsinline preload="auto" class="showcase-video">
                        <source src="${d.videoUrl}" type="video/mp4">
                    </video>
                    <img src="${d.logoUrl}" alt="Logo ${d.title}" class="org-logo">
                </div>
                <div class="card-info">
                    <h3>${d.title}</h3>
                    <div class="card-tags">
                        <span class="tag-gender">${d.gender}</span>
                    </div>
                    <p>${d.description}</p>
                    <a href="${d.discordUrl}" target="_blank" class="btn-sm discord-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.05.05 0 0 0-.018-.011 8.8 8.8 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.05.05 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007c.08.066.164.132.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.059c.24.466.515.91.818 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019zM5.866 9.641c-.708 0-1.289-.645-1.289-1.44s.568-1.44 1.289-1.44c.72 0 1.29.645 1.289 1.44 0 .795-.569 1.44-1.289 1.44zm4.269 0c-.708 0-1.289-.645-1.289-1.44s.568-1.44 1.289-1.44c.72 0 1.29.645 1.289 1.44 0 .795-.569 1.44-1.289 1.44z"/></svg>
                        Adquirir Diseño
                    </a>
                </div>
            `;
            grid.appendChild(card);
        });

        // Re-aplicar hover logic
        const catalogItems = document.querySelectorAll('.catalog-card');
        catalogItems.forEach(item => {
            const video = item.querySelector('video');
            if (video) video.pause();
            
            item.addEventListener('mouseenter', () => { 
                if (video) video.play().catch(e => console.log("Autoplay bloquedo: ", e)); 
            });
            item.addEventListener('mouseleave', () => { 
                if (video) video.pause(); 
            });
        });

    } catch (e) {
        console.error(e);
        grid.innerHTML = '<p>Error cargando los diseños. Intente más tarde.</p>';
    }
};

document.addEventListener("DOMContentLoaded", () => {
    loadCatalog();
    
    // --- Lógica del formulario de subida ---
    const form = document.getElementById('uploadForm');
    if (form) {
        document.getElementById('generateBtn').addEventListener('click', async () => {
            const btn = document.getElementById('generateBtn');
            btn.innerText = 'Subiendo...';
            btn.disabled = true;

            const formData = new FormData();
            formData.append('title', document.getElementById('designTitle').value);
            formData.append('description', document.getElementById('designDesc').value);
            formData.append('gender', document.getElementById('designGender').value);
            formData.append('videoFile', document.getElementById('videoFile').files[0]);
            formData.append('logoFile', document.getElementById('logoFile').files[0]);

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (res.ok) {
                    alert('¡Diseño subido con éxito!');
                    form.reset();
                } else {
                    alert('Error en la subida.');
                }
            } catch (err) {
                alert('Fallo de red.');
            } finally {
                btn.innerText = 'Procesar Diseño';
                btn.disabled = false;
            }
        });
    }
});
