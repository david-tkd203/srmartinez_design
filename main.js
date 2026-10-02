import * as THREE from 'three';

// --- Initial Animations ---
if (window.gsap) {
    gsap.from('.hero-main-title', { y: -20, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 1.5 });
    gsap.from('.hero-title', { x: -30, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 1.7 });
    gsap.from('.hero-subtitle', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 1.7 });
    gsap.from('.cta-group', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 1.7 });
}

// --- Video Hover Logic (Ahora es dinÃƒÂ¡mico y se aplica despuÃƒÂ©s del fetch) ---

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

// --- Carga DinÃƒÂ¡mica de CatÃƒÂ¡logo ---
let allDesigns = [];

const renderDesigns = (designsToRender) => {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    designsToRender.forEach(d => {
        const card = document.createElement('div');
        card.className = 'catalog-card';
        card.innerHTML = `
            <div class="video-wrapper">
                <video loop muted playsinline preload="auto" class="showcase-video">
                    <source src="${d.videoUrl}" type="video/mp4">
                </video>
                <img src="${d.logoUrl}" alt="Logo ${d.title}" class="org-logo">
                ${ d.cityLogoUrl ? '<img src="' + d.cityLogoUrl + '" alt="Ciudad" class="city-logo">' : '' }
            </div>
            <div class="card-info">
                <h3>${d.title}</h3>
                <div class="card-tags">
                    <span class="tag-gender">${d.category || 'Prendas Personalizadas'}</span>
                    ${ d.gender ? '<span class="tag-gender">' + d.gender + '</span>' : '' }
                </div>
                <p>${d.description}</p>
                <a href="${d.discordUrl}" target="_blank" class="btn-sm discord-btn">Adquirir Diseño</a>
            </div>
        `;
        grid.appendChild(card);
    });

    const catalogItems = document.querySelectorAll('.catalog-card');
    catalogItems.forEach(item => {
        const video = item.querySelector('video');
        if (video) video.pause();
        item.addEventListener('mouseenter', () => { if (video) video.play().catch(e => console.log(e)); });
        item.addEventListener('mouseleave', () => { if (video) video.pause(); });
    });
};

const renderFilters = () => {
    const filterContainer = document.getElementById('categoryFilters');
    if (!filterContainer) return;
    
    // Obtener categorias unicas
    const categories = ['Todos', ...new Set(allDesigns.map(d => d.category || 'Prendas Personalizadas'))];
    
    filterContainer.innerHTML = '';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = cat === 'Todos' ? 'filter-btn active' : 'filter-btn';
        btn.innerText = cat;
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (cat === 'Todos') {
                renderDesigns(allDesigns);
            } else {
                renderDesigns(allDesigns.filter(d => (d.category || 'Prendas Personalizadas') === cat));
            }
        };
        filterContainer.appendChild(btn);
    });
};

const loadCatalog = async () => {
    try {
        const res = await fetch('/api/designs');
        if (!res.ok) throw new Error('Fallo al obtener diseños');
        allDesigns = await res.json();
        
        renderFilters();
        renderDesigns(allDesigns);
    } catch (e) {
        console.error(e);
        const grid = document.getElementById('catalogGrid');
        if (grid) grid.innerHTML = '<p>Error cargando los diseños. Intente más tarde.</p>';
    }
};document.addEventListener("DOMContentLoaded", () => {
    loadCatalog();
    
    // Upload logic moved to design-upload.html
});




