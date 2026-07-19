/* ======================================================================
   PHIEU CUA TOI - CUSTOM JAVASCRIPT
   Interactive UI Logic for Viettel Telecom Enterprise Dashboard
   ====================================================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Initialize functions
    initCounterAnimation();
    initSearchDebounce();
    initFilterChips();
    initCollapsibleGroups();
    initRippleEffect();
    initTooltips();
    bindPaginationLinks();
    initAjaxFormInterceptors();
});

/**
 * AJAX-based Real-time Searching and Filtering Engine
 */
function triggerAjaxFilter(pageUrl = null) {
    const ticketsSection = document.querySelector('.tickets-section');
    if (!ticketsSection) return;

    // Add visual loading state with overlay
    ticketsSection.classList.add('loading-ajax');
    let overlay = ticketsSection.querySelector('.loading-overlay-ajax');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay-ajax animate-fade-in';
        overlay.innerHTML = '<div class="loading-spinner-ajax"></div>';
        ticketsSection.appendChild(overlay);
    }

    let url;
    if (pageUrl) {
        url = pageUrl;
    } else {
        const searchVal = document.getElementById('searchInput')?.value || '';
        const statusVal = document.getElementById('statusFilterField')?.value || '';
        const serviceVal = document.getElementById('serviceFilter')?.value || '';
        const priorityVal = document.getElementById('priorityFilter')?.value || '';
        const sortByVal = document.getElementById('sortByFilter')?.value || '';
        const dateFromVal = document.getElementById('dateFrom')?.value || '';
        const dateToVal = document.getElementById('dateTo')?.value || '';

        const params = new URLSearchParams();
        if (searchVal.trim()) params.set('search', searchVal.trim());
        if (statusVal) params.set('status', statusVal);
        if (serviceVal) params.set('service', serviceVal);
        if (priorityVal) params.set('priority', priorityVal);
        if (sortByVal) params.set('sortBy', sortByVal);
        if (dateFromVal) params.set('dateFrom', dateFromVal);
        if (dateToVal) params.set('dateTo', dateToVal);
        params.set('page', '1'); // reset to page 1 on new filter

        url = window.location.pathname + '?' + params.toString();
    }

    // Asynchronously fetch filtered results
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Yêu cầu tải dữ liệu thất bại.');
            return response.text();
        })
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // 1. Replace tickets container content
            const newTicketsSection = doc.querySelector('.tickets-section');
            if (newTicketsSection) {
                ticketsSection.innerHTML = newTicketsSection.innerHTML;
            }

            // 2. Replace pagination nav
            const paginationNav = document.querySelector('.custom-pagination-nav');
            const newPaginationNav = doc.querySelector('.custom-pagination-nav');
            if (paginationNav && newPaginationNav) {
                paginationNav.outerHTML = newPaginationNav.outerHTML;
            } else if (paginationNav && !newPaginationNav) {
                paginationNav.remove();
            } else if (!paginationNav && newPaginationNav) {
                const listSection = document.querySelector('.tickets-section');
                if (listSection) listSection.after(newPaginationNav);
            }

            // 3. Update count details badge (Đã tìm thấy X yêu cầu)
            const countLabel = document.querySelector('.btn-control-apply')?.closest('.d-flex')?.querySelector('.small.text-muted');
            const newCountLabel = doc.querySelector('.btn-control-apply')?.closest('.d-flex')?.querySelector('.small.text-muted');
            if (countLabel && newCountLabel) {
                countLabel.innerHTML = newCountLabel.innerHTML;
            }

            // 4. Update KPI targets & hero stats
            const heroStats = document.querySelectorAll('.lk-hero-stats [data-target]');
            const newHeroStats = doc.querySelectorAll('.lk-hero-stats [data-target]');
            if (heroStats.length && newHeroStats.length) {
                heroStats.forEach((el, idx) => {
                    if (newHeroStats[idx]) {
                        el.setAttribute('data-target', newHeroStats[idx].getAttribute('data-target'));
                    }
                });
            }

            const kpiSelectors = [
                '.stat-theme-total .stat-card-custom__value',
                '.stat-theme-processing .stat-card-custom__value',
                '.stat-theme-pending .stat-card-custom__value',
                '.stat-theme-completed .stat-card-custom__value',
                '.stat-theme-cancelled .stat-card-custom__value',
                '.stat-theme-overdue .stat-card-custom__value'
            ];
            kpiSelectors.forEach(sel => {
                const el = document.querySelector(sel);
                const newEl = doc.querySelector(sel);
                if (el && newEl) {
                    el.setAttribute('data-target', newEl.getAttribute('data-target'));
                }
            });

            // 5. Re-run interactive bindings
            initCounterAnimation();
            initCollapsibleGroups();
            initRippleEffect();
            initTooltips();
            bindPaginationLinks();

            // 6. Push url change to history
            history.pushState(null, '', url);
        })
        .catch(err => {
            console.error('Lỗi khi tải bộ lọc AJAX:', err);
        })
        .finally(() => {
            ticketsSection.classList.remove('loading-ajax');
            const newOverlay = ticketsSection.querySelector('.loading-overlay-ajax');
            if (newOverlay) newOverlay.remove();
        });
}

/**
 * Bind pagination links for AJAX routing
 */
function bindPaginationLinks() {
    const pageLinks = document.querySelectorAll('.custom-pagination-nav .page-link');
    pageLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                triggerAjaxFilter(href);
            }
        });
    });
}

/**
 * Intercept standard form actions and setup AJAX handlers
 */
function initAjaxFormInterceptors() {
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function (e) {
            e.preventDefault();
            triggerAjaxFilter();
        });
    }

    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            triggerAjaxFilter();
        });
    }

    // Override inline onchanges and bind to AJAX filter
    const serviceFilter = document.getElementById('serviceFilter');
    if (serviceFilter) {
        serviceFilter.removeAttribute('onchange');
        serviceFilter.addEventListener('change', triggerAjaxFilter);
    }

    const priorityFilter = document.getElementById('priorityFilter');
    if (priorityFilter) {
        priorityFilter.removeAttribute('onchange');
        priorityFilter.addEventListener('change', triggerAjaxFilter);
    }

    const sortByFilter = document.getElementById('sortByFilter');
    if (sortByFilter) {
        sortByFilter.removeAttribute('onchange');
        sortByFilter.addEventListener('change', triggerAjaxFilter);
    }

    const dateFrom = document.getElementById('dateFrom');
    if (dateFrom) {
        dateFrom.addEventListener('change', triggerAjaxFilter);
    }

    const dateTo = document.getElementById('dateTo');
    if (dateTo) {
        dateTo.addEventListener('change', triggerAjaxFilter);
    }
}

/**
 * 1. Counter Animation for Statistics Cards
 */
function initCounterAnimation() {
    const valueElements = document.querySelectorAll('.stat-card-custom__value');
    const duration = 1200; // Total duration in ms

    // Read total value for progress calculation
    let totalTickets = 0;
    const totalCard = document.querySelector('.stat-theme-total .stat-card-custom__value');
    if (totalCard) {
        totalTickets = parseInt(totalCard.getAttribute('data-target') || 0, 10);
    }

    valueElements.forEach(el => {
        const target = parseInt(el.getAttribute('data-target') || 0, 10);
        const start = 0;
        const startTime = performance.now();

        // Counter logic
        function updateCounter(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // Ease out quad formula
            const easeProgress = progress * (2 - progress);
            const currentValue = Math.floor(start + easeProgress * (target - start));
            
            el.textContent = currentValue.toLocaleString('vi-VN');

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                el.textContent = target.toLocaleString('vi-VN');
            }
        }
        
        requestAnimationFrame(updateCounter);

        // Micro progress bar animation
        const card = el.closest('.stat-card-custom');
        if (card) {
            const progressBar = card.querySelector('.stat-card-custom__progress-bar');
            if (progressBar) {
                let percentage = 0;
                if (card.classList.contains('stat-theme-total')) {
                    percentage = 100;
                } else if (totalTickets > 0) {
                    percentage = Math.round((target / totalTickets) * 100);
                } else {
                    percentage = target > 0 ? 100 : 0;
                }
                
                // Trigger reflow & animate width
                setTimeout(() => {
                    progressBar.style.width = `${percentage}%`;
                }, 100);
            }
        }
    });
}

/**
 * 2. Search Debounce to improve UX and avoid spam requests
 */
function initSearchDebounce() {
    const searchInput = document.getElementById('searchInput');
    let debounceTimer;

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                triggerAjaxFilter();
            }, 400); // 400ms debounce delay
        });
        
        // Focus handler
        searchInput.addEventListener('focus', function() {
            const searchBox = this.closest('.search-box-custom');
            if (searchBox) searchBox.classList.add('focused');
        });
        
        searchInput.addEventListener('blur', function() {
            const searchBox = this.closest('.search-box-custom');
            if (searchBox) searchBox.classList.remove('focused');
        });
    }
}

/**
 * 3. Filter Chips binding to form inputs
 */
function initFilterChips() {
    const chips = document.querySelectorAll('.filter-chip');
    const statusField = document.getElementById('statusFilterField');

    if (chips && statusField) {
        chips.forEach(chip => {
            chip.addEventListener('click', function () {
                // Remove active class from all chips
                chips.forEach(c => c.classList.remove('active'));
                
                // Add active to current chip
                this.classList.add('active');
                
                // Set hidden input value
                const statusValue = this.getAttribute('data-status');
                statusField.value = statusValue;
                
                // Trigger AJAX
                triggerAjaxFilter();
            });
        });
    }
}

/**
 * 4. Toggle Date Range Panel (collapsible date pickers)
 */
window.toggleDateRange = function() {
    const dateRow = document.getElementById('dateRangeRow');
    const btnToggle = document.getElementById('btnDateToggle');
    if (dateRow) {
        if (dateRow.classList.contains('d-none')) {
            dateRow.classList.remove('d-none');
            btnToggle.classList.add('active');
            const icon = btnToggle.querySelector('.bi-chevron-down');
            if (icon) {
                icon.className = 'bi bi-chevron-up ms-1';
            }
        } else {
            dateRow.classList.add('d-none');
            btnToggle.classList.remove('active');
            const icon = btnToggle.querySelector('.bi-chevron-up');
            if (icon) {
                icon.className = 'bi bi-chevron-down ms-1';
            }
        }
    }
};

/**
 * 5. Reset Filters
 */
window.resetFilters = function() {
    // Clear search query inputs
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    const hiddenSearch = document.querySelector('input[name="search"]');
    if (hiddenSearch) hiddenSearch.value = '';

    // Reset status chip field
    const statusField = document.getElementById('statusFilterField');
    if (statusField) statusField.value = '';

    // Reset chips class
    const chips = document.querySelectorAll('.filter-chip');
    if (chips) {
        chips.forEach(c => c.classList.remove('active'));
        const allChip = document.querySelector('.filter-chip[data-status=""]');
        if (allChip) allChip.classList.add('active');
    }

    // Reset select inputs
    const serviceFilter = document.getElementById('serviceFilter');
    if (serviceFilter) serviceFilter.selectedIndex = 0;

    const priorityFilter = document.getElementById('priorityFilter');
    if (priorityFilter) priorityFilter.selectedIndex = 0;

    const sortByFilter = document.getElementById('sortByFilter');
    if (sortByFilter) sortByFilter.selectedIndex = 0;

    // Reset date fields
    const dateFrom = document.getElementById('dateFrom');
    if (dateFrom) dateFrom.value = '';
    
    const dateTo = document.getElementById('dateTo');
    if (dateTo) dateTo.value = '';

    // Trigger the update
    triggerAjaxFilter();
};

/**
 * 6. Collapsible Ticket Groups (Zendesk style group accordion)
 */
function initCollapsibleGroups() {
    const groupHeaders = document.querySelectorAll('.ticket-group-header');

    groupHeaders.forEach(header => {
        header.addEventListener('click', function () {
            const group = this.closest('.ticket-group');
            if (group) {
                group.classList.toggle('collapsed');
            }
        });
    });
}

/**
 * 7. Ripple Waves for Premium Buttons
 */
function initRippleEffect() {
    const rippleButtons = document.querySelectorAll('.btn-hero-primary, .btn-hero-secondary, .btn-control-apply, .btn-control-reset, .btn-item-action, .btn-cta-primary, .btn-cta-secondary');

    rippleButtons.forEach(btn => {
        if (btn.classList.contains('disabled')) return;
        
        btn.addEventListener('click', function (e) {
            // Only apply custom ripple if not already handled
            let ripple = this.querySelector('.ripple-effect');
            if (ripple) {
                ripple.remove();
            }
            
            ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');
            
            // Positioning the ripple circle
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            // Ripple styling logic
            ripple.style.position = 'absolute';
            ripple.style.background = 'rgba(255, 255, 255, 0.4)';
            ripple.style.width = '100px';
            ripple.style.height = '100px';
            ripple.style.borderRadius = '50%';
            ripple.style.transform = 'translate(-50%, -50%) scale(0)';
            ripple.style.animation = 'ripple-anim 0.6s ease-out';
            ripple.style.pointerEvents = 'none';
            
            this.appendChild(ripple);
            
            // Clean up
            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });
        });
    });
}

// Add CSS keyframe programmatically for ripple animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes ripple-anim {
    to {
        transform: translate(-50%, -50%) scale(3);
        opacity: 0;
    }
}
`;
document.head.appendChild(styleSheet);

/**
 * 8. Initialize Bootstrap tooltips or custom fallback tooltips
 */
function initTooltips() {
    // If Bootstrap tooltip constructor exists, use it
    if (window.bootstrap && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-tooltip]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            // Map our data-tooltip to bootstrap title
            const title = tooltipTriggerEl.getAttribute('data-tooltip');
            tooltipTriggerEl.setAttribute('title', title);
            tooltipTriggerEl.removeAttribute('data-tooltip'); // Remove attribute to prevent CSS tooltip matching
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

/**
 * Chat Redirection utility
 */
window.goToChat = function(ticketId) {
    if (typeof chatbox !== 'undefined' && chatbox.openTicketChat) {
        chatbox.openTicketChat(ticketId);
    } else {
        // Redirection as fallback
        window.location.href = `/Ticket/ChiTietPhieu/${ticketId}?openChat=true`;
    }
};
