/**
 * ==========================================================================
 * TERMS OF SERVICE - VIETTEL MODERN INTERACTIVE FEATURES
 * Pure Vanilla JavaScript - No dependencies required
 * ==========================================================================
 */

(function () {
    'use strict';

    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        initScrollReveal();
        initStickyNavScrollSpy();
        initAccordion();
        initBackToTop();
        initReadingProgress();
        initSmoothScroll();
        initRippleEffect();
    }

    /**
     * 1. SCROLL REVEAL ANIMATION
     * Uses IntersectionObserver for performance
     */
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.terms-reveal');
        if (!revealElements.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Stagger animation for visual appeal
                    setTimeout(() => {
                        entry.target.classList.add('active');
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    }

    /**
     * 2. STICKY NAV SCROLL SPY
     * Highlights active section in navigation
     */
    function initStickyNavScrollSpy() {
        const tocLinks = document.querySelectorAll('.terms-toc-link');
        const sections = document.querySelectorAll('.terms-card-section');

        if (!tocLinks.length || !sections.length) return;

        // Throttle scroll event for performance
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateActiveLink();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        function updateActiveLink() {
            let currentSectionId = '';
            const scrollPosition = window.pageYOffset + 150;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    currentSectionId = '#' + section.getAttribute('id');
                }
            });

            tocLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === currentSectionId);
            });
        }
    }


    /**
     * 3. ACCORDION FUNCTIONALITY
     * Smooth expand/collapse for privacy policy sections
     */
    function initAccordion() {
        const accordionHeaders = document.querySelectorAll('.privacy-accordion-header');

        accordionHeaders.forEach(header => {
            header.addEventListener('click', function () {
                const item = this.parentElement;
                const isOpen = item.classList.contains('active');

                // Close all other accordion items
                document.querySelectorAll('.privacy-accordion-item').forEach(i => {
                    if (i !== item) {
                        i.classList.remove('active');
                    }
                });

                // Toggle clicked item
                item.classList.toggle('active', !isOpen);

                // Smooth scroll to item if opening (for mobile)
                if (!isOpen && window.innerWidth < 768) {
                    setTimeout(() => {
                        const headerOffset = 100;
                        const elementPosition = item.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }, 350);
                }
            });
        });
    }

    /**
     * 4. BACK TO TOP BUTTON
     * Floating button with smooth scroll
     */
    function initBackToTop() {
        let backBtn = document.getElementById('termsBackToTopBtn');

        // Create button if doesn't exist
        if (!backBtn) {
            backBtn = document.createElement('button');
            backBtn.id = 'termsBackToTopBtn';
            backBtn.className = 'terms-back-to-top';
            backBtn.setAttribute('aria-label', 'Lên đầu trang');
            backBtn.innerHTML = '<i class="bi bi-arrow-up-short" style="font-size: 1.8rem;"></i>';
            document.body.appendChild(backBtn);
        }

        // Show/hide on scroll
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    backBtn.classList.toggle('visible', window.scrollY > 400);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // Smooth scroll to top
        backBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    /**
     * 5. READING PROGRESS BAR
     * Shows scroll progress at top of page
     */
    function initReadingProgress() {
        const progressBar = document.getElementById('readingProgress');
        if (!progressBar) return;

        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        function updateProgress() {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const trackLength = documentHeight - windowHeight;
            const percentage = Math.floor((scrollTop / trackLength) * 100);

            progressBar.style.width = Math.min(percentage, 100) + '%';
        }
    }


    /**
     * 6. SMOOTH SCROLL FOR NAV LINKS
     * Smooth scrolling when clicking TOC links
     */
    function initSmoothScroll() {
        const tocLinks = document.querySelectorAll('.terms-toc-link');

        tocLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();

                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    const headerOffset = 90;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Update URL without jumping
                    history.pushState(null, null, targetId);
                }
            });
        });

        // Handle deep links on page load
        if (window.location.hash) {
            setTimeout(() => {
                const targetElement = document.querySelector(window.location.hash);
                if (targetElement) {
                    const headerOffset = 90;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    }

    /**
     * 7. RIPPLE EFFECT ON BUTTONS
     * Material design ripple effect
     */
    function initRippleEffect() {
        const rippleButtons = document.querySelectorAll('.btn-cta-white, .btn-cta-outline, .terms-toc-link');

        rippleButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                const rect = this.getBoundingClientRect();
                const ripple = document.createElement('span');
                const diameter = Math.max(rect.width, rect.height);
                const radius = diameter / 2;

                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(227, 6, 19, 0.3);
                    width: ${diameter}px;
                    height: ${diameter}px;
                    left: ${e.clientX - rect.left - radius}px;
                    top: ${e.clientY - rect.top - radius}px;
                    transform: scale(0);
                    animation: ripple-animation 0.6s ease-out;
                    pointer-events: none;
                `;

                // Remove old ripples
                const existingRipple = this.querySelector('.ripple-effect');
                if (existingRipple) {
                    existingRipple.remove();
                }

                ripple.className = 'ripple-effect';
                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);

                // Clean up
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });

        // Add animation keyframes if not exists
        if (!document.getElementById('ripple-keyframes')) {
            const style = document.createElement('style');
            style.id = 'ripple-keyframes';
            style.textContent = `
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

})();
