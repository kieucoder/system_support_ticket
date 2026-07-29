/**
 * ==========================================================================
 * NEWS DETAIL JAVASCRIPT - TECHSUPPORT VIETTEL TELECOM
 * Pure Vanilla JavaScript for Views/Home/TinTuc/ChiTietTin*.cshtml
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // 1. Reading Progress Bar Indicator
    initReadingProgressBar();

    // 2. Scroll Reveal Animations
    initScrollReveal();

    // 3. Back To Top Floating Button
    initBackToTop();

    // 4. Image Lightbox Zoom
    initImageZoom();
});

/**
 * 1. Reading Progress Bar Updates on Scroll
 */
function initReadingProgressBar() {
    let progressBar = document.querySelector('.reading-progress-bar');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'reading-progress-bar';
        document.body.prepend(progressBar);
    }

    window.addEventListener('scroll', function () {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progressPercentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

        progressBar.style.width = `${Math.min(100, Math.max(0, progressPercentage))}%`;
    }, { passive: true });
}

/**
 * 2. IntersectionObserver for Reveal Animations
 */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.news-reveal');
    if (!revealElements.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -20px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
}

/**
 * 3. Floating Back To Top Button
 */
function initBackToTop() {
    let backBtn = document.getElementById('backToTopBtn');
    if (!backBtn) {
        backBtn = document.createElement('button');
        backBtn.id = 'backToTopBtn';
        backBtn.className = 'back-to-top-btn';
        backBtn.setAttribute('title', 'Lên đầu trang');
        backBtn.innerHTML = '<i class="bi bi-arrow-up-short" style="font-size: 1.8rem;"></i>';
        document.body.appendChild(backBtn);
    }

    window.addEventListener('scroll', function () {
        if (window.scrollY > 350) {
            backBtn.classList.add('visible');
        } else {
            backBtn.classList.remove('visible');
        }
    }, { passive: true });

    backBtn.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * 4. Image Lightbox Zoom Modal for Article Images
 */
function initImageZoom() {
    const articleImages = document.querySelectorAll('.article-content img, .detail-cover-container img');

    articleImages.forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function () {
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.inset = '0';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.88)';
            overlay.style.backdropFilter = 'blur(8px)';
            overlay.style.zIndex = '10000';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.padding = '20px';
            overlay.style.cursor = 'zoom-out';

            const zoomedImg = document.createElement('img');
            zoomedImg.src = this.src;
            zoomedImg.alt = this.alt || 'Zoomed Image';
            zoomedImg.style.maxWidth = '92%';
            zoomedImg.style.maxHeight = '92%';
            zoomedImg.style.borderRadius = '12px';
            zoomedImg.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)';
            zoomedImg.style.transition = 'transform 0.3s ease';

            overlay.appendChild(zoomedImg);
            document.body.appendChild(overlay);

            overlay.addEventListener('click', function () {
                overlay.remove();
            });
        });
    });
}
