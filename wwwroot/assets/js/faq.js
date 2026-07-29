/**
 * ==========================================================================
 * FAQ PAGE - VIETTEL TECHSUPPORT
 * Features: Accordion, Search, Category Filter, Progress Bar,
 *           Back To Top, Scroll Reveal, Keyboard Navigation
 * Pure Vanilla JS — zero dependencies
 * ==========================================================================
 */

(function () {
    'use strict';

    // -----------------------------------------------------------------------
    // STATE
    // -----------------------------------------------------------------------
    const state = {
        activeCategory: 'all',
        searchQuery: '',
    };

    // -----------------------------------------------------------------------
    // DOM CACHE — collected once after DOMContentLoaded
    // -----------------------------------------------------------------------
    let dom = {};

    function cacheDOM() {
        dom = {
            searchInput:    document.getElementById('faqSearchInput'),
            searchBtn:      document.getElementById('faqSearchBtn'),
            searchClear:    document.getElementById('faqSearchClear'),
            searchStats:    document.getElementById('faqSearchStats'),
            categoryBar:    document.getElementById('faqCategoryBar'),
            catBtns:        document.querySelectorAll('.faq-cat-btn'),
            groups:         document.querySelectorAll('.faq-group'),
            items:          document.querySelectorAll('.faq-item'),
            noResults:      document.getElementById('faqNoResults'),
            progressBar:    document.getElementById('faqReadingProgress'),
            revealEls:      document.querySelectorAll('.faq-reveal'),
        };
    }

    // -----------------------------------------------------------------------
    // ENTRY POINT
    // -----------------------------------------------------------------------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        cacheDOM();
        initScrollReveal();
        initAccordion();
        initSearch();
        initCategoryFilter();
        initReadingProgress();
        initBackToTop();
        initKeyboardNav();
    }

    // -----------------------------------------------------------------------
    // 1. SCROLL REVEAL
    // -----------------------------------------------------------------------
    function initScrollReveal() {
        if (!dom.revealEls.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    setTimeout(() => entry.target.classList.add('active'), i * 80);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        dom.revealEls.forEach(el => observer.observe(el));
    }

    // -----------------------------------------------------------------------
    // 2. ACCORDION
    // -----------------------------------------------------------------------
    function initAccordion() {
        dom.items.forEach(item => {
            const question = item.querySelector('.faq-question');
            if (!question) return;

            question.addEventListener('click', () => toggleItem(item));

            // Accessibility: Enter / Space on focused question
            question.setAttribute('tabindex', '0');
            question.setAttribute('role', 'button');
            question.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleItem(item);
                }
            });
        });
    }

    function toggleItem(item) {
        const isOpen = item.classList.contains('active');

        // Close all open items
        dom.items.forEach(i => {
            if (i !== item && i.classList.contains('active')) {
                closeItem(i);
            }
        });

        isOpen ? closeItem(item) : openItem(item);
    }

    function openItem(item) {
        item.classList.add('active');
        const question = item.querySelector('.faq-question');
        if (question) {
            question.setAttribute('aria-expanded', 'true');
        }

        // Smooth scroll into view on mobile
        if (window.innerWidth < 768) {
            setTimeout(() => {
                const offset = 100;
                const top = item.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }, 350);
        }
    }

    function closeItem(item) {
        item.classList.remove('active');
        const question = item.querySelector('.faq-question');
        if (question) {
            question.setAttribute('aria-expanded', 'false');
        }
    }

    // -----------------------------------------------------------------------
    // 3. SEARCH
    // -----------------------------------------------------------------------
    function initSearch() {
        if (!dom.searchInput) return;

        // Debounced live search as user types
        let debounceTimer;
        dom.searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                state.searchQuery = dom.searchInput.value.trim();
                toggleClearBtn();
                applyFilters();
            }, 220);
        });

        // Button click
        if (dom.searchBtn) {
            dom.searchBtn.addEventListener('click', () => {
                state.searchQuery = dom.searchInput.value.trim();
                applyFilters();
            });
        }

        // Enter key in input
        dom.searchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                state.searchQuery = dom.searchInput.value.trim();
                applyFilters();
            }
        });

        // Clear button
        if (dom.searchClear) {
            dom.searchClear.addEventListener('click', () => {
                dom.searchInput.value = '';
                state.searchQuery = '';
                toggleClearBtn();
                applyFilters();
                dom.searchInput.focus();
            });
        }
    }

    function toggleClearBtn() {
        if (!dom.searchClear) return;
        dom.searchClear.classList.toggle('visible', state.searchQuery.length > 0);
    }

    // -----------------------------------------------------------------------
    // 4. CATEGORY FILTER
    // -----------------------------------------------------------------------
    function initCategoryFilter() {
        dom.catBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                state.activeCategory = btn.dataset.cat || 'all';

                // Update active style
                dom.catBtns.forEach(b => {
                    b.classList.toggle('active', b === btn);
                    b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
                });

                // Reset search when switching category
                if (dom.searchInput) {
                    dom.searchInput.value = '';
                    state.searchQuery = '';
                    toggleClearBtn();
                }

                applyFilters();

                // Scroll to content on mobile
                if (window.innerWidth < 768) {
                    const contentEl = document.querySelector('.faq-content-wrapper');
                    if (contentEl) {
                        const top = contentEl.getBoundingClientRect().top + window.pageYOffset - 80;
                        window.scrollTo({ top, behavior: 'smooth' });
                    }
                }
            });
        });
    }

    // -----------------------------------------------------------------------
    // 5. CORE FILTER + HIGHLIGHT ENGINE
    // -----------------------------------------------------------------------
    function applyFilters() {
        const query  = state.searchQuery.toLowerCase();
        const cat    = state.activeCategory;
        let totalVisible = 0;

        // Close all open items before filtering
        dom.items.forEach(i => closeItem(i));

        dom.groups.forEach(group => {
            const groupCat    = group.dataset.category;
            const catMatch    = cat === 'all' || groupCat === cat;
            let groupVisible  = 0;

            const itemsInGroup = group.querySelectorAll('.faq-item');

            itemsInGroup.forEach(item => {
                const itemCat     = item.dataset.category || '';
                const keywords    = (item.dataset.keywords || '').toLowerCase();
                const qTextEl     = item.querySelector('.faq-q-text');
                const answerEl    = item.querySelector('.faq-answer-inner p');

                const qText       = qTextEl   ? qTextEl.textContent.toLowerCase()   : '';
                const answerText  = answerEl  ? answerEl.textContent.toLowerCase()  : '';

                const itemCatMatch  = cat === 'all' || itemCat === cat;
                const textMatch     = !query ||
                    qText.includes(query) ||
                    answerText.includes(query) ||
                    keywords.includes(query);

                const shouldShow = catMatch && itemCatMatch && textMatch;

                item.dataset.hidden = shouldShow ? 'false' : 'true';
                item.style.display  = shouldShow ? '' : 'none';

                if (shouldShow) {
                    groupVisible++;
                    totalVisible++;

                    // Highlight matching text in question
                    if (query && qTextEl) {
                        qTextEl.innerHTML = highlight(escapeHtml(qTextEl.textContent), query);
                    } else if (qTextEl) {
                        qTextEl.textContent = qTextEl.textContent; // reset
                    }

                    // Auto-open item if it uniquely matches a search
                    if (query && textMatch) {
                        openItem(item);
                    }
                } else {
                    // Reset highlight
                    if (qTextEl && query) {
                        qTextEl.textContent = qTextEl.textContent;
                    }
                }
            });

            // Show/hide the entire group section
            group.style.display  = (catMatch && groupVisible > 0) ? '' : 'none';
            group.dataset.hidden = (catMatch && groupVisible > 0) ? 'false' : 'true';
        });

        updateStats(totalVisible, query, cat);
        toggleNoResults(totalVisible === 0);
    }

    // Simple HTML escape to prevent XSS when building innerHTML
    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Wrap matched text in a highlight span
    function highlight(html, query) {
        if (!query) return html;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex   = new RegExp(`(${escaped})`, 'gi');
        return html.replace(regex, '<mark class="faq-q-highlight">$1</mark>');
    }

    // -----------------------------------------------------------------------
    // 6. UI FEEDBACK — Stats & No-Results
    // -----------------------------------------------------------------------
    function updateStats(count, query, cat) {
        if (!dom.searchStats) return;

        if (!query && cat === 'all') {
            dom.searchStats.innerHTML = '';
            return;
        }

        if (query) {
            dom.searchStats.innerHTML = count > 0
                ? `Tìm thấy <strong>${count}</strong> câu hỏi cho "<strong>${escapeHtml(query)}</strong>"`
                : `Không tìm thấy kết quả nào cho "<strong>${escapeHtml(query)}</strong>"`;
        } else {
            const label = dom.categoryBar
                ? (dom.categoryBar.querySelector(`.faq-cat-btn[data-cat="${cat}"]`)?.textContent?.trim() ?? cat)
                : cat;
            dom.searchStats.innerHTML = `Hiển thị <strong>${count}</strong> câu hỏi trong danh mục <strong>${escapeHtml(label)}</strong>`;
        }
    }

    function toggleNoResults(show) {
        if (!dom.noResults) return;
        dom.noResults.classList.toggle('visible', show);
    }

    // -----------------------------------------------------------------------
    // 7. READING PROGRESS BAR
    // -----------------------------------------------------------------------
    function initReadingProgress() {
        if (!dom.progressBar) return;

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
                    const scrolled   = docHeight > 0 ? (window.pageYOffset / docHeight) * 100 : 0;
                    dom.progressBar.style.width = Math.min(scrolled, 100) + '%';
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // -----------------------------------------------------------------------
    // 8. BACK TO TOP
    // -----------------------------------------------------------------------
    function initBackToTop() {
        let btn = document.querySelector('.faq-back-top');

        if (!btn) {
            btn = document.createElement('button');
            btn.className = 'faq-back-top';
            btn.setAttribute('aria-label', 'Lên đầu trang');
            btn.innerHTML = '<i class="bi bi-arrow-up-short" style="font-size:1.8rem"></i>';
            document.body.appendChild(btn);
        }

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    btn.classList.toggle('visible', window.scrollY > 400);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // -----------------------------------------------------------------------
    // 9. KEYBOARD NAVIGATION (arrow keys to move between questions)
    // -----------------------------------------------------------------------
    function initKeyboardNav() {
        document.addEventListener('keydown', e => {
            // Only act when focus is on a faq-question
            const focused = document.activeElement;
            if (!focused || !focused.closest('.faq-question')) return;

            const allVisible = Array.from(
                document.querySelectorAll('.faq-item:not([style*="display: none"]) .faq-question')
            );

            const idx = allVisible.indexOf(focused);
            if (idx === -1) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = allVisible[idx + 1];
                if (next) next.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = allVisible[idx - 1];
                if (prev) prev.focus();
            }
        });
    }

})();
