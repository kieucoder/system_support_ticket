/**
 * ==========================================================================
 * ABOUT US PAGE JAVASCRIPT - TECHSUPPORT VIETTEL TELECOM
 * Pure Vanilla JavaScript implementation for Views/Home/GioiThieu.cshtml
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // 1. Scroll Reveal Animation using IntersectionObserver
    initScrollReveal();

    // 2. Counter Up Animation for Achievements
    initCounterAnimation();

    // 3. Timeline Progress Line Animation
    initTimelineAnimation();

    // 4. Hero Light Parallax & Mouse Move Effect
    initHeroParallax();

    // 5. Button Ripple Click Effect
    initButtonRipple();

    // 6. Smooth Scroll for Anchor Links
    initSmoothScroll();
});

/**
 * 1. IntersectionObserver for Fade In & Slide Up Scroll Reveal
 */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.about-reveal');
    if (!revealElements.length) return;

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optionally unobserve after animating once
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });
}

/**
 * 2. Counter Up Animation for Statistics (Section 6)
 */
function initCounterAnimation() {
    const counterElements = document.querySelectorAll('.counter-value[data-target]');
    if (!counterElements.length) return;

    let hasAnimated = false;

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimated) {
                hasAnimated = true;
                counterElements.forEach(counter => {
                    animateSingleCounter(counter);
                });
            }
        });
    }, { threshold: 0.3 });

    const counterBanner = document.querySelector('.achievements-banner');
    if (counterBanner) {
        counterObserver.observe(counterBanner);
    }

    function animateSingleCounter(element) {
        const target = parseInt(element.getAttribute('data-target'), 10);
        const suffix = element.getAttribute('data-suffix') || '';
        const duration = 2000; // Total animation time in ms
        const frameRate = 1000 / 60; // 60 FPS
        const totalFrames = Math.round(duration / frameRate);
        let currentFrame = 0;

        const timer = setInterval(() => {
            currentFrame++;
            const progress = currentFrame / totalFrames;
            // Ease-out expo function for smooth slowing down at the end
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(easeProgress * target);

            element.textContent = currentValue.toLocaleString('vi-VN') + suffix;

            if (currentFrame >= totalFrames) {
                clearInterval(timer);
                element.textContent = target.toLocaleString('vi-VN') + suffix;
            }
        }, frameRate);
    }
}

/**
 * 3. Timeline Line Connector Animation
 */
function initTimelineAnimation() {
    const timelineProgress = document.querySelector('.timeline-line-progress');
    const timelineSection = document.querySelector('.timeline-grid');
    if (!timelineProgress || !timelineSection) return;

    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                timelineProgress.style.width = '100%';
            }
        });
    }, { threshold: 0.2 });

    timelineObserver.observe(timelineSection);
}

/**
 * 4. Light Parallax Effect for Hero Banner
 */
function initHeroParallax() {
    const hero = document.querySelector('.about-hero');
    const heroContent = document.querySelector('.about-hero-content');
    if (!hero || !heroContent) return;

    window.addEventListener('scroll', function () {
        const scrolled = window.pageYOffset;
        if (scrolled < 600) {
            heroContent.style.transform = `translateY(${scrolled * 0.25}px)`;
            heroContent.style.opacity = 1 - (scrolled / 550);
        }
    }, { passive: true });

    hero.addEventListener('mousemove', function (e) {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        const moveX = (clientX - innerWidth / 2) * 0.015;
        const moveY = (clientY - innerHeight / 2) * 0.015;

        heroContent.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    });

    hero.addEventListener('mouseleave', function () {
        heroContent.style.transform = 'translate3d(0, 0, 0)';
    });
}

/**
 * 5. Button Ripple Effect
 */
function initButtonRipple() {
    const buttons = document.querySelectorAll('.btn-viettel-primary, .btn-cta-white, .btn-viettel-outline');

    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            const rect = button.getBoundingClientRect();
            const ripple = document.createElement('span');

            const diameter = Math.max(rect.width, rect.height);
            const radius = diameter / 2;

            ripple.style.width = ripple.style.height = `${diameter}px`;
            ripple.style.left = `${e.clientX - rect.left - radius}px`;
            ripple.style.top = `${e.clientY - rect.top - radius}px`;

            ripple.classList.add('ripple-effect');

            const existingRipple = button.querySelector('.ripple-effect');
            if (existingRipple) {
                existingRipple.remove();
            }

            button.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Add inline style rule dynamically for ripple if not present
    if (!document.getElementById('ripple-style-rule')) {
        const style = document.createElement('style');
        style.id = 'ripple-style-rule';
        style.textContent = `
            .ripple-effect {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.4);
                transform: scale(0);
                animation: ripple-animation 0.6s linear;
                pointer-events: none;
            }
            @keyframes ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * 6. Smooth Scroll for Anchor Links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId.length <= 1) return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const headerOffset = 90;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}
