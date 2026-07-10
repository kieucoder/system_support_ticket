/* -------------------------------------------------------------
 * FILE: assets/js/header.js
 * AUTHOR: Antigravity
 * DESCRIPTION: Sticky header transitions and navigation handlers
 * ------------------------------------------------------------- */

window.initHeader = () => {
    const navbar = document.querySelector('.custom-header');
    if (!navbar) return;

    const handleHeaderScroll = () => {
        if (window.scrollY > 36) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    };

    handleHeaderScroll();
    window.addEventListener('scroll', handleHeaderScroll);

    // Dynamic anchor prefixing for non-homepage files
    const isHomePage = window.location.pathname.endsWith('index.html') || 
                       window.location.pathname === '/' || 
                       window.location.pathname.endsWith('/') ||
                       (!window.location.pathname.includes('.html'));
                       
    if (!isHomePage) {
        const headerLinks = navbar.querySelectorAll('a[href^="#"]');
        const prefix = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
        headerLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#') && href !== '#') {
                link.setAttribute('href', prefix + href);
            }
        });
    }

    // Dynamic document path resolution for subfolders
    const isSubdir = window.location.pathname.includes('/pages/');
    if (isSubdir) {
        const docLinks = navbar.querySelectorAll('a:not([href^="http"]):not([href^="tel"]):not([href^="mailto"]):not([href^="javascript"])');
        docLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('../')) {
                link.setAttribute('href', '../' + href);
            }
        });
    }

    // Active menu link highlighting
    const currentPath = window.location.pathname;



    const navLinks = navbar.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
            if (href.startsWith('#')) {
                if (isHomePage) {
                    // Highlights active section on home page based on scroll or default
                    // In a simple setup, default Trang chu active works
                }
            } else if (currentPath.includes(href)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        }
    });

    // --- Authentication & User Dropdown Initialization ---
    const authButtons = document.getElementById('authButtons');
    const userDropdownWrapper = document.getElementById('userDropdownWrapper');
    const btnCreateTicket = document.getElementById('btnCreateTicket');
    const userNameEl = document.getElementById('userDisplayName');

    const isProfilePage = window.location.pathname.includes('customer-profile.html');

    const showGlobalToast = (message) => {
        let container = document.getElementById('globalToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'globalToastContainer';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'global-toast';
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                toast.remove();
                if (container.children.length === 0) container.remove();
            });
        }, 3500);
    };

    const updateAuthHeader = (customerName) => {
        if (!userDropdownWrapper || !userNameEl) return;
        
        const buttonsGroup = navbar.querySelector('.header-buttons-group');
        
        // On profile page, we ALWAYS show the logged-in dropdown and hide the create ticket button
        if (isProfilePage || customerName) {
            userNameEl.textContent = customerName || "Nguyễn Văn An";
            if (authButtons) authButtons.classList.add('d-none');
            userDropdownWrapper.classList.remove('d-none');
            if (btnCreateTicket) btnCreateTicket.classList.add('d-none');
            if (buttonsGroup) buttonsGroup.classList.add('d-none');
        } else {
            userDropdownWrapper.classList.add('d-none');
            if (authButtons) authButtons.classList.remove('d-none');
            if (btnCreateTicket) btnCreateTicket.classList.remove('d-none');
            if (buttonsGroup) buttonsGroup.classList.remove('d-none');
        }
    };

    const loadAuthState = () => {
        let name = null;
        const sessionStr = sessionStorage.getItem('techsupport_session');
        if (sessionStr) {
            try {
                const sessionData = JSON.parse(sessionStr);
                if (sessionData && sessionData.isLoggedIn && sessionData.user && sessionData.user.fullname) {
                    name = sessionData.user.fullname;
                }
            } catch (e) {
                console.error('Error parsing session storage:', e);
            }
        }
        if (!name) {
            name = sessionStorage.getItem('ts_customer_name') || localStorage.getItem('ts_customer_name') || null;
        }
        updateAuthHeader(name);
    };

    const checkLogoutToast = () => {
        if (sessionStorage.getItem('logout_success_toast') === 'true') {
            sessionStorage.removeItem('logout_success_toast');
            showGlobalToast('✅ Đăng xuất thành công');
        }
    };

    const bindDropdownEvents = () => {
        if (!userDropdownWrapper) return;
        const trigger = userDropdownWrapper.querySelector('.btn-user-dropdown');
        const menu = userDropdownWrapper.querySelector('.user-profile-dropdown-menu');
        const logoutBtn = userDropdownWrapper.querySelector('#btnLogoutBtn');

        if (trigger && menu) {
            const newTrigger = trigger.cloneNode(true);
            trigger.parentNode.replaceChild(newTrigger, trigger);

            newTrigger.addEventListener('click', function (e) {
                e.stopPropagation();
                const isShown = menu.classList.contains('show');
                if (isShown) {
                    menu.classList.remove('show');
                    newTrigger.classList.remove('active');
                } else {
                    menu.classList.add('show');
                    newTrigger.classList.add('active');
                }
            });

            document.addEventListener('click', function (e) {
                if (!userDropdownWrapper.contains(e.target)) {
                    menu.classList.remove('show');
                    newTrigger.classList.remove('active');
                }
            });
        }

        if (logoutBtn) {
            const newLogout = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogout, logoutBtn);

            newLogout.addEventListener('click', function (e) {
                e.preventDefault();
                window.TechSupportAuth.logout();
            });
        }

        const headerLogoutBtn = userDropdownWrapper.querySelector('#btnHeaderLogout');
        if (headerLogoutBtn) {
            const newHeaderLogout = headerLogoutBtn.cloneNode(true);
            headerLogoutBtn.parentNode.replaceChild(newHeaderLogout, headerLogoutBtn);

            newHeaderLogout.addEventListener('click', function (e) {
                e.preventDefault();
                window.TechSupportAuth.logout();
            });
        }
    };

    // Initialize state
    loadAuthState();
    checkLogoutToast();
    bindDropdownEvents();

    // Export globally
    window.TechSupportAuth = {
        login: function (name, remember) {
            if (remember) {
                localStorage.setItem('ts_customer_name', name);
            } else {
                sessionStorage.setItem('ts_customer_name', name);
            }
            loadAuthState();
            bindDropdownEvents();
        },
        logout: function () {
            sessionStorage.removeItem('ts_customer_name');
            sessionStorage.removeItem('techsupport_session');
            localStorage.removeItem('ts_customer_name');
            
            sessionStorage.setItem('logout_success_toast', 'true');
            
            const redirectPath = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
            window.location.href = redirectPath;
        }
    };
};
