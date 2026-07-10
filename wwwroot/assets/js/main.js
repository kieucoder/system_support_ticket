/* -------------------------------------------------------------
 * FILE: assets/js/main.js
 * AUTHOR: Antigravity
 * DESCRIPTION: Asynchronous component loader, page interactions, 
 *              parallax effects, timeline fills, and mobile drawers.
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. ASYNC COMPONENT LOADER WITH LOCAL FILE FALLBACK
    const loadComponent = (containerId, filePath, callback) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Adjust path if page is inside pages/ subdirectory
        let resolvedPath = filePath;
        if (window.location.pathname.includes('/pages/')) {
            resolvedPath = '../' + filePath;
        }

        fetch(`${resolvedPath}?t=${new Date().getTime()}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(html => {
                container.innerHTML = html;
                if (callback) callback();
            })
            .catch(error => {
                console.error('Error loading component:', error);
                // Fallback: if container already has inlined content, run callback
                if (container.children.length > 0 && callback) {
                    console.log(`[Fallback] Initializing inlined content for #${containerId}`);
                    callback();
                }
            });
    };

    // Load header and initialize header logic
    loadComponent('header-container', 'components/header.html', () => {
        if (typeof window.initHeader === 'function') {
            window.initHeader();
        }
        // Bind drawer and navbar triggers
        bindMobileDrawerEvents();
        bindScrollNavbar();
        // Rebind ripple effects for dynamic buttons inside the header
        bindRippleEffects();
    });

    // Note: sidebar-container on customer-facing pages holds the mobile drawer, 
    // which is statically inlined in each HTML page. We do not load components/sidebar.html 
    // (which is the staff admin sidebar) here to prevent breaking client mobile navigation.

    // Load footer dynamic or run callback if already inlined
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        loadComponent('footer-container', 'components/footer.html', () => {
            if (typeof window.initFooter === 'function') {
                window.initFooter();
            }
        });
    } else if (document.querySelector('.scroll-top-btn')) {
        if (typeof window.initFooter === 'function') {
            window.initFooter();
        }
    }

    // 4. CHATBOX WIDGET
    if (document.getElementById('chatLauncher')) {
        if (typeof window.initChatbox === 'function') {
            window.initChatbox();
        }
    } else {
        const chatboxContainer = document.getElementById('chatbox-container');
        if (chatboxContainer) {
            loadComponent('chatbox-container', 'components/chatbox.html', () => {
                if (typeof window.initChatbox === 'function') {
                    window.initChatbox();
                }
            });
        }
    }

    // 2. RIPPLE BUTTON CLICK EFFECT
    function bindRippleEffects() {
        const rippleButtons = document.querySelectorAll('.btn-ripple');
        rippleButtons.forEach(button => {
            if (button.classList.contains('ripple-bound')) return;
            button.classList.add('ripple-bound');
            
            button.addEventListener('click', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const ripple = document.createElement('span');
                ripple.classList.add('ripple-wave');
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;

                this.appendChild(ripple);
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    // Run initial ripple bindings for static page content
    bindRippleEffects();

    // 3. STATISTICAL NUMBER COUNTER AND SCROLL REVEAL OBSERVERS
    const counterElements = document.querySelectorAll('.counter-value');
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

    const startCounter = (el) => {
        const targetValue = parseInt(el.getAttribute('data-target'), 10);
        if (isNaN(targetValue)) return;

        const duration = 2000; // Animation duration in ms
        const frameRate = 1000 / 60; // 60 FPS
        const totalFrames = Math.round(duration / frameRate);
        let frame = 0;

        const animate = () => {
            frame++;
            const progress = frame / totalFrames;
            const easeProgress = progress * (2 - progress); // Ease out quad
            const currentValue = Math.floor(easeProgress * targetValue);

            el.innerText = currentValue.toLocaleString('vi-VN');

            if (frame < totalFrames) {
                requestAnimationFrame(animate);
            } else {
                el.innerText = targetValue.toLocaleString('vi-VN');
            }
        };

        animate();
    };

    if ('IntersectionObserver' in window) {
        // Observe scroll reveals
        const observerOptions = {
            root: null,
            threshold: 0.15,
            rootMargin: '0px'
        };

        const elementObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    
                    // If element has counters inside, trigger them
                    const counters = entry.target.querySelectorAll('.counter-value');
                    counters.forEach(counter => {
                        if (!counter.classList.contains('animated')) {
                            counter.classList.add('animated');
                            startCounter(counter);
                        }
                    });

                    // Trigger timeline fill width loading animation
                    const timelineFill = entry.target.querySelector('.process-line-fill');
                    if (timelineFill) {
                        timelineFill.style.width = '100%';
                    }

                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        revealElements.forEach(el => {
            elementObserver.observe(el);
        });

        // Observe isolated counter blocks
        counterElements.forEach(counter => {
            const counterParent = counter.closest('div');
            if (counterParent) {
                const counterObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            if (!counter.classList.contains('animated')) {
                                counter.classList.add('animated');
                                startCounter(counter);
                            }
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.5 });
                counterObserver.observe(counterParent);
            }
        });
    } else {
        // Fallback for browsers that do not support IntersectionObserver
        revealElements.forEach(el => el.classList.add('active'));
        counterElements.forEach(counter => startCounter(counter));
        const timelineFills = document.querySelectorAll('.process-line-fill');
        timelineFills.forEach(fill => fill.style.width = '100%');
    }

    // 5. CLIENT SIDE SCROLL-BASED NAVBAR COLOR CHANGING
    function bindScrollNavbar() {
        const navbar = document.querySelector('.custom-header');
        if (!navbar) return;

        const handleNavbarScroll = () => {
            if (window.scrollY > 30) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        };

        window.addEventListener('scroll', handleNavbarScroll);
        handleNavbarScroll(); // Initial check
    }
    bindScrollNavbar();

    // 6. CLIENT MOBILE DRAWER EVENTS BINDING
    function bindMobileDrawerEvents() {
        // Guard: prevent double-binding when called multiple times (e.g. from loadComponent callback)
        if (window._drawerEventsBound) return;
        window._drawerEventsBound = true;

        // Elements are bound via event delegation to support dynamic header loading
        document.addEventListener('click', (e) => {
            const menuToggle = e.target.closest('#menuToggle');
            const drawerClose = e.target.closest('#drawerClose');
            const drawerOverlay = e.target.closest('#drawerOverlay');

            const drawer = document.getElementById('mobileDrawer');
            const overlay = document.getElementById('drawerOverlay');

            if (menuToggle && drawer) {
                e.preventDefault();
                drawer.classList.add('open');
                if (overlay) overlay.classList.add('open');
                document.body.classList.add('drawer-open');
            }

            if ((drawerClose || drawerOverlay) && drawer) {
                e.preventDefault();
                drawer.classList.remove('open');
                if (overlay) overlay.classList.remove('open');
                document.body.classList.remove('drawer-open');
                // Reset all open dropdowns when drawer closes
                document.querySelectorAll('.drawer-dropdown-menu-custom.show').forEach(menu => {
                    menu.classList.remove('show');
                });
                document.querySelectorAll('.drawer-nav-item.drawer-dropdown-open').forEach(item => {
                    item.classList.remove('drawer-dropdown-open');
                    const chevron = item.querySelector('.drawer-nav-link i');
                    if (chevron) chevron.style.transform = 'rotate(0deg)';
                });
            }
        });

        // Mobile drawer accordion dropdown toggle — supports ALL items with drawer-dropdown-custom class
        document.addEventListener('click', (e) => {
            const toggleLink = e.target.closest('.drawer-dropdown-custom .drawer-nav-link');
            if (!toggleLink) return;

            e.preventDefault();
            const parentItem = toggleLink.closest('.drawer-dropdown-custom');
            const dropdownMenu = parentItem ? parentItem.querySelector('.drawer-dropdown-menu-custom') : null;
            const chevron = toggleLink.querySelector('i');

            if (dropdownMenu) {
                const isOpen = dropdownMenu.classList.contains('show');

                // Close all other open dropdowns first (accordion behavior)
                document.querySelectorAll('.drawer-dropdown-menu-custom.show').forEach(menu => {
                    if (menu !== dropdownMenu) {
                        menu.classList.remove('show');
                        const otherItem = menu.closest('.drawer-dropdown-custom');
                        if (otherItem) {
                            otherItem.classList.remove('drawer-dropdown-open');
                            const otherChevron = otherItem.querySelector('.drawer-nav-link i');
                            if (otherChevron) otherChevron.style.transform = 'rotate(0deg)';
                        }
                    }
                });

                if (isOpen) {
                    dropdownMenu.classList.remove('show');
                    if (parentItem) parentItem.classList.remove('drawer-dropdown-open');
                    if (chevron) chevron.style.transform = 'rotate(0deg)';
                } else {
                    dropdownMenu.classList.add('show');
                    if (parentItem) parentItem.classList.add('drawer-dropdown-open');
                    if (chevron) chevron.style.transform = 'rotate(180deg)';
                }
            }
        });
    }
    bindMobileDrawerEvents();

    // 7. HERO SECTION INTERACTIVE MOUSE PARALLAX EFFECT
    const heroSection = document.getElementById('heroSection');
    const parallaxContainer = document.querySelector('.hero-mockup-container');
    
    if (heroSection && parallaxContainer) {
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            const x = e.clientX - rect.left - (rect.width / 2);
            const y = e.clientY - rect.top - (rect.height / 2);
            
            // Limit tilting effect angles (scale max tilt to ~8deg)
            const rotateX = -(y / rect.height) * 15;
            const rotateY = (x / rect.width) * 15;
            
            parallaxContainer.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        heroSection.addEventListener('mouseleave', () => {
            // Restore original straight rotation smoothly
            parallaxContainer.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
            parallaxContainer.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        });
        
        heroSection.addEventListener('mouseenter', () => {
            parallaxContainer.style.transition = 'none'; // Disable transition for instant feedback
        });
    }

    // 8. SCROLL TO TOP SCROLL VISIBILITY
    const scrollTopBtn = document.querySelector('.scroll-top-btn');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
