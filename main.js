// --- Initial Animations ---
if (window.gsap) {
    gsap.from('.hero-main-title', { y: -20, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 1.5 });
    gsap.from('.hero-title', { x: -30, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 1.7 });
    gsap.from('.hero-subtitle', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 1.7 });
    gsap.from('.cta-group', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 1.7 });
}

// --- Video Performance Optimization & Hover Logic ---
const catalogItems = document.querySelectorAll('.catalog-card');
catalogItems.forEach(item => {
    const video = item.querySelector('video');
    if (video) video.pause();
    
    item.addEventListener('mouseenter', () => { if (video) video.play().catch(e => console.log(e)); });
    item.addEventListener('mouseleave', () => { if (video) video.pause(); });
});

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
