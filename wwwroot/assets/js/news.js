/**
 * ==========================================================================
 * NEWS PAGE JAVASCRIPT - TECHSUPPORT VIETTEL TELECOM
 * Pure Vanilla JavaScript implementation for Views/Home/TinTuc.cshtml
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // 1. Scroll Reveal Animation using IntersectionObserver
    initScrollReveal();

    // 2. Category Filter System
    initCategoryFilter();

    // 3. Search Filter System
    initSearchFilter();

    // 4. Newsletter Form Handler
    initNewsletterForm();

    // 5. Button Ripple Effect
    initButtonRipple();

    // 6. Pagination System
    initPagination();
});

/**
 * 1. IntersectionObserver for Fade Up Animation
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
        threshold: 0.12,
        rootMargin: '0px 0px -30px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
}

/**
 * 2. Category Filtering (Pills + Sidebar)
 */
function initCategoryFilter() {
    const catPills = document.querySelectorAll('.news-cat-pill');
    const sidebarCatItems = document.querySelectorAll('.sidebar-cat-item');
    const newsCardCols = document.querySelectorAll('.news-card-col');
    const noResultsBox = document.getElementById('noResultsBox');

    function filterByCategory(category) {
        let visibleCount = 0;

        // Active state update on pills
        catPills.forEach(pill => {
            if (pill.getAttribute('data-category') === category) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });

        // Filter cards
        newsCardCols.forEach(col => {
            const cardCat = col.getAttribute('data-category');
            if (category === 'all' || cardCat === category) {
                col.style.display = 'block';
                visibleCount++;
            } else {
                col.style.display = 'none';
            }
        });

        // Show/hide no results box
        if (noResultsBox) {
            noResultsBox.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    // Event listeners on Category Pills
    catPills.forEach(pill => {
        pill.addEventListener('click', function () {
            const cat = this.getAttribute('data-category');
            filterByCategory(cat);
        });
    });

    // Event listeners on Sidebar Category items
    sidebarCatItems.forEach(item => {
        item.addEventListener('click', function () {
            const cat = this.getAttribute('data-category');
            filterByCategory(cat);

            // Smooth scroll to news grid section
            const gridSection = document.getElementById('newsGridSection');
            if (gridSection) {
                gridSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/**
 * 3. Search Filter System (Realtime Input)
 */
function initSearchFilter() {
    const searchInput = document.getElementById('newsSearchInput');
    const searchBtn = document.getElementById('newsSearchBtn');
    const newsCardCols = document.querySelectorAll('.news-card-col');
    const noResultsBox = document.getElementById('noResultsBox');
    const catPills = document.querySelectorAll('.news-cat-pill');

    function performSearch() {
        if (!searchInput) return;
        const query = searchInput.value.trim().toLowerCase();
        let visibleCount = 0;

        // Reset category pills active state to "All" when searching
        if (query.length > 0) {
            catPills.forEach(pill => pill.classList.remove('active'));
            const allPill = document.querySelector('.news-cat-pill[data-category="all"]');
            if (allPill) allPill.classList.add('active');
        }

        newsCardCols.forEach(col => {
            const title = (col.querySelector('.news-card-title')?.textContent || '').toLowerCase();
            const desc = (col.querySelector('.news-card-desc')?.textContent || '').toLowerCase();
            const cat = (col.querySelector('.news-card-category')?.textContent || '').toLowerCase();

            if (title.includes(query) || desc.includes(query) || cat.includes(query)) {
                col.style.display = 'block';
                visibleCount++;
            } else {
                col.style.display = 'none';
            }
        });

        if (noResultsBox) {
            noResultsBox.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
}

/**
 * 4. Newsletter Subscription Form Handler
 */
function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    const emailInput = document.getElementById('newsletterEmail');

    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = emailInput ? emailInput.value.trim() : '';

        if (!email || !email.includes('@')) {
            alert('Vui lòng nhập địa chỉ email hợp lệ!');
            return;
        }

        alert(`Cảm ơn bạn! Email ${email} đã được đăng ký nhận thông báo tin tức mới nhất từ TechSupport Viettel.`);
        if (emailInput) emailInput.value = '';
    });
}

/**
 * 5. Button Ripple Click Effect
 */
function initButtonRipple() {
    const buttons = document.querySelectorAll('.btn-newsletter, .btn-cta-white, .btn-cta-outline, .news-cat-pill, .news-search-btn');

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

    if (!document.getElementById('news-ripple-style')) {
        const style = document.createElement('style');
        style.id = 'news-ripple-style';
        style.textContent = `
            .ripple-effect {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.4);
                transform: scale(0);
                animation: news-ripple-anim 0.6s linear;
                pointer-events: none;
            }
            @keyframes news-ripple-anim {
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
 * 6. Pagination System Frontend Simulation
 */
function initPagination() {
    const pageLinks = document.querySelectorAll('.page-link-custom');

    pageLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            pageLinks.forEach(p => p.classList.remove('active'));
            this.classList.add('active');

            const gridSection = document.getElementById('newsGridSection');
            if (gridSection) {
                gridSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}
