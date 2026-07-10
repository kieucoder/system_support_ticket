/**
 * sidebar.js - Sidebar Interactions Controller
 * Handles toggling, collapsing, responsive drawers, and active page highlighting.
 */
(function() {
    'use strict';

    // Helper to select elements
    const getSidebar = () => document.getElementById('adminSidebar');
    const getWrapper = () => document.querySelector('.main-wrapper');

    // Create and manage mobile overlay backdrop
    const getOrCreateOverlay = () => {
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
            
            // Close sidebar when clicking on overlay
            overlay.addEventListener('click', closeMobileSidebar);
        }
        return overlay;
    };

    // Close sidebar on mobile
    const closeMobileSidebar = () => {
        const sidebar = getSidebar();
        if (sidebar) {
            sidebar.classList.remove('sidebar-open');
        }
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    };

    // Open sidebar on mobile
    const openMobileSidebar = () => {
        const sidebar = getSidebar();
        if (sidebar) {
            sidebar.classList.add('sidebar-open');
        }
        const overlay = getOrCreateOverlay();
        overlay.classList.add('active');
    };

    // Toggle sidebar collapse on desktop
    const toggleDesktopSidebar = () => {
        document.body.classList.toggle('sidebar-collapsed');
        
        // Save desktop state preference
        const isCollapsed = document.body.classList.contains('sidebar-collapsed');
        localStorage.setItem('sidebar-collapsed', isCollapsed ? 'true' : 'false');
    };

    // Highlight the active page link
    const highlightActiveLink = () => {
        const sidebar = getSidebar();
        if (!sidebar) return;

        const path = window.location.pathname;
        const pageName = path.split('/').pop() || 'dashboard.html';

        const links = sidebar.querySelectorAll('.sidebar-item');
        links.forEach(item => {
            const dataPage = item.getAttribute('data-page');
            
            // Map data-page to file names
            let isActive = false;
            if (dataPage === 'dashboard' && pageName.includes('dashboard')) {
                isActive = true;
            } else if (dataPage === 'tickets' && pageName.includes('ticket')) {
                isActive = true;
            } else if (dataPage === 'chat' && pageName.includes('chat')) {
                isActive = true;
            } else if (dataPage === 'customers' && pageName.includes('customer')) {
                isActive = true;
            } else if (dataPage === 'categories' && pageName.includes('categories')) {
                isActive = true;
            } else if (dataPage === 'services' && pageName.includes('services')) {
                isActive = true;
            } else if (dataPage === 'reports' && pageName.includes('report')) {
                isActive = true;
            } else if (dataPage === 'staff' && pageName.includes('staff') && !pageName.includes('chat') && !pageName.includes('ticket')) {
                isActive = true;
            }
            
            if (isActive) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    };

    // Restore sidebar state on load
    const restoreSidebarState = () => {
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        if (isCollapsed && window.innerWidth >= 992) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
    };

    // Initialize all sidebar event bindings
    const initSidebar = () => {
        restoreSidebarState();
        highlightActiveLink();

        // Use event delegation for dynamically loaded toggle buttons
        document.addEventListener('click', function(e) {
            // Desktop toggle click
            if (e.target.closest('#toggleSidebarDesktop')) {
                e.preventDefault();
                toggleDesktopSidebar();
            }
            
            // Mobile toggle click
            if (e.target.closest('#toggleSidebarMobile')) {
                e.preventDefault();
                openMobileSidebar();
            }
        });

        // Close mobile drawer when window resizes to desktop width
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 992) {
                closeMobileSidebar();
            }
        });
    };

    // Expose controller APIs
    window.SidebarController = {
        init: initSidebar,
        openMobile: openMobileSidebar,
        closeMobile: closeMobileSidebar,
        toggleDesktop: toggleDesktopSidebar,
        highlightLinks: highlightActiveLink
    };
})();
