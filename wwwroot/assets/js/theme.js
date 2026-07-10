/**
 * theme.js - Theme (Light/Dark mode) Controller
 * Handles toggling and persisting light/dark modes using Bootstrap 5.3
 */
(function() {
    'use strict';

    // Get theme from localStorage or fallback to default 'light'
    const getSavedTheme = () => localStorage.getItem('theme') || 'light';
    const saveTheme = (theme) => localStorage.setItem('theme', theme);

    // Apply theme to document element
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-bs-theme', theme);
        updateThemeIcon(theme);
    };

    // Update toggle button icon based on active theme
    const updateThemeIcon = (theme) => {
        const toggleBtn = document.getElementById('toggleTheme');
        if (!toggleBtn) return;
        
        const icon = toggleBtn.querySelector('i');
        if (!icon) return;

        if (theme === 'dark') {
            icon.className = 'fa-regular fa-sun';
            toggleBtn.setAttribute('title', 'Chuyển sang Giao diện Sáng');
        } else {
            icon.className = 'fa-regular fa-moon';
            toggleBtn.setAttribute('title', 'Chuyển sang Giao diện Tối');
        }
    };

    // Toggle theme action
    const toggleTheme = () => {
        const currentTheme = getSavedTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        saveTheme(newTheme);
        applyTheme(newTheme);
    };

    // Initialize theme configuration
    const initTheme = () => {
        const savedTheme = getSavedTheme();
        applyTheme(savedTheme);

        // Attach click handler to theme button (using event delegation to support dynamically loaded topbar)
        document.addEventListener('click', function(e) {
            const toggleBtn = e.target.closest('#toggleTheme');
            if (toggleBtn) {
                e.preventDefault();
                toggleTheme();
            }
        });
    };

    // Expose theme APIs
    window.ThemeController = {
        init: initTheme,
        getCurrent: getSavedTheme,
        toggle: toggleTheme
    };

    // Run setup
    initTheme();
})();
