/* ==========================================================================
   FILE: assets/js/lookup-ticket.js
   AUTHOR: Antigravity
   DESCRIPTION: Search & Lookup client-side logic for TechSupport Portal
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ==================== 1. DEMO DATABASE ====================
    const TICKETS_DATABASE = [
        {
            code: "PT2026000123",
            title: "Internet cáp quang mất kết nối",
            service: "Sửa lỗi mất mạng",
            type: "Sự cố kỹ thuật",
            createdAt: "11/06/2026",
            status: "processing", // pending | processing | completed | cancelled
            statusText: "Đang xử lý",
            priority: "high", // high | medium | low
            priorityText: "Cao",
            customer: {
                name: "Nguyễn Văn An",
                phone: "0909123456",
                email: "nguyenvanan@gmail.com"
            }
        },
        {
            code: "PT2026000124",
            title: "Lỗi tín hiệu truyền hình cáp toàn khu vực",
            service: "Sửa lỗi TV",
            type: "Yêu cầu dịch vụ",
            createdAt: "10/06/2026",
            status: "pending",
            statusText: "Chờ tiếp nhận",
            priority: "medium",
            priorityText: "Trung bình",
            customer: {
                name: "Nguyễn Văn An",
                phone: "0909123456",
                email: "nguyenvanan@gmail.com"
            }
        },
        {
            code: "PT2026000125",
            title: "Camera bị mất hồng ngoại ban đêm",
            service: "Sửa lỗi Camera",
            type: "Sự cố kỹ thuật",
            createdAt: "09/06/2026",
            status: "completed",
            statusText: "Đã hoàn thành",
            priority: "low",
            priorityText: "Thấp",
            customer: {
                name: "Nguyễn Văn An",
                phone: "0909123456",
                email: "nguyenvanan@gmail.com"
            }
        },
        {
            code: "PT2026000126",
            title: "Wi-Fi chập chờn khi kết nối nhiều thiết bị",
            service: "Cấu hình Router",
            type: "Hỗ trợ kỹ thuật",
            createdAt: "08/06/2026",
            status: "completed",
            statusText: "Đã hoàn thành",
            priority: "high",
            priorityText: "Cao",
            customer: {
                name: "Nguyễn Văn An",
                phone: "0909123456",
                email: "nguyenvanan@gmail.com"
            }
        },
        {
            code: "PT2026000127",
            title: "Yêu cầu đổi mật khẩu Wi-Fi modem Gpon",
            service: "Hỗ trợ kỹ thuật",
            type: "Yêu cầu dịch vụ",
            createdAt: "07/06/2026",
            status: "cancelled",
            statusText: "Đã hủy",
            priority: "low",
            priorityText: "Thấp",
            customer: {
                name: "Nguyễn Văn An",
                phone: "0909123456",
                email: "nguyenvanan@gmail.com"
            }
        }
    ];

    // ==================== 2. UI ELEMENTS ====================
    // Blocks
    const guestSearchBlock = document.getElementById('guestSearchBlock');
    const memberSearchBlock = document.getElementById('memberSearchBlock');

    // Guest Forms & Inputs
    const guestSearchForm = document.getElementById('guestSearchForm');
    const ticketCodeInput = document.getElementById('ticketCodeInput');
    const contactInput = document.getElementById('contactInput');
    const advancedGuestForm = document.getElementById('advancedGuestForm');
    const advGuestCode = document.getElementById('advGuestCode');
    const advGuestPhone = document.getElementById('advGuestPhone');
    const advGuestEmail = document.getElementById('advGuestEmail');
    const advGuestStart = document.getElementById('advGuestStart');
    const advGuestEnd = document.getElementById('advGuestEnd');
    const advGuestStatus = document.getElementById('advGuestStatus');

    // Member Forms & Inputs
    const memberFilterForm = document.getElementById('memberFilterForm');
    const memberCodeFilter = document.getElementById('memberCodeFilter');
    const memberStatusFilter = document.getElementById('memberStatusFilter');
    const memberServiceFilter = document.getElementById('memberServiceFilter');
    const memberStartFilter = document.getElementById('memberStartFilter');
    const memberEndFilter = document.getElementById('memberEndFilter');
    const lblWelcomeUser = document.getElementById('lblWelcomeUser');

    // Results Container
    const lookupResultContainer = document.getElementById('lookupResultContainer');
    const singleResultSummaryCard = document.getElementById('singleResultSummaryCard');
    const ticketTableBody = document.getElementById('ticketTableBody');
    const mobileCardsContainer = document.getElementById('mobileCardsContainer');
    const paginationUl = document.getElementById('paginationUl');
    const lblResultCount = document.getElementById('lblResultCount');
    const lookupNotFoundContainer = document.getElementById('lookupNotFoundContainer');
    const btnRetrySearch = document.getElementById('btnRetrySearch');

    // ==================== 3. INTERNAL STATE ====================
    let currentResults = [];
    let currentPage = 1;
    const itemsPerPage = 3;
    let isLoggedIn = false;
    let loggedInUser = null;

    // ==================== 4. AUTH STATE CHECK ====================
    const checkAuthState = () => {
        // Look for existing session to match header.js behaviour
        let name = null;
        const sessionStr = sessionStorage.getItem('techsupport_session');
        if (sessionStr) {
            try {
                const sessionData = JSON.parse(sessionStr);
                if (sessionData && sessionData.isLoggedIn && sessionData.user && sessionData.user.fullname) {
                    name = sessionData.user.fullname;
                }
            } catch (e) {}
        }
        if (!name) {
            name = sessionStorage.getItem('ts_customer_name') || localStorage.getItem('ts_customer_name') || null;
        }

        if (name) {
            isLoggedIn = true;
            loggedInUser = name;
            if (lblWelcomeUser) lblWelcomeUser.textContent = `Xin chào, ${name}`;
            
            // Adjust layouts
            if (guestSearchBlock) guestSearchBlock.classList.add('d-none');
            if (memberSearchBlock) memberSearchBlock.classList.remove('d-none');
            
            // Member starts with all their tickets displayed
            currentResults = [...TICKETS_DATABASE];
            renderResults();
        } else {
            isLoggedIn = false;
            loggedInUser = null;
            
            // Adjust layouts
            if (guestSearchBlock) guestSearchBlock.classList.remove('d-none');
            if (memberSearchBlock) memberSearchBlock.classList.add('d-none');
            
            // Hide result panels initially for guests
            if (lookupResultContainer) lookupResultContainer.classList.add('d-none');
        }
    };

    // ==================== 5. TOAST UTILITY ====================
    const showToast = (message, type = 'success') => {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return null;

        const toast = document.createElement('div');
        toast.className = `custom-toast show ${type}`;
        
        let iconHtml = '';
        if (type === 'success') {
            iconHtml = '<i class="bi bi-check-circle-fill text-success fs-5"></i>';
        } else if (type === 'danger') {
            iconHtml = '<i class="bi bi-x-circle-fill text-danger fs-5"></i>';
        } else if (type === 'warning') {
            iconHtml = '<i class="bi bi-exclamation-triangle-fill text-warning fs-5"></i>';
        } else if (type === 'loading') {
            iconHtml = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div>';
        } else if (type === 'info') {
            iconHtml = '<i class="bi bi-info-circle-fill text-info fs-5"></i>';
        }

        toast.innerHTML = `
            ${iconHtml}
            <span class="custom-toast-text ms-2">${message}</span>
        `;

        toastContainer.appendChild(toast);

        if (type === 'loading') {
            return toast;
        }

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, 3000);

        return toast;
    };

    // ==================== 6. DATE FORMAT HELPERS ====================
    const parseDateString = (str) => {
        const [day, month, year] = str.split('/').map(Number);
        return new Date(year, month - 1, day);
    };

    // ==================== 7. RENDER ENGINE ====================
    const getStatusBadgeHtml = (status) => {
        const s = status.toLowerCase();
        if (s === 'pending') {
            return `<span class="badge-status pending"><i class="bi bi-clock"></i> Chờ tiếp nhận</span>`;
        } else if (s === 'processing') {
            return `<span class="badge-status processing"><i class="bi bi-arrow-repeat"></i> Đang xử lý</span>`;
        } else if (s === 'completed') {
            return `<span class="badge-status completed"><i class="bi bi-check-circle"></i> Đã hoàn thành</span>`;
        }
        return `<span class="badge-status cancelled"><i class="bi bi-x-circle"></i> Đã hủy</span>`;
    };

    const getPriorityBadgeHtml = (priority) => {
        const p = priority.toLowerCase();
        if (p === 'high') {
            return `<span class="badge-priority high"><i class="bi bi-lightning-charge-fill"></i> Cao</span>`;
        } else if (p === 'medium') {
            return `<span class="badge-priority medium"><i class="bi bi-dash-circle-fill"></i> Trung bình</span>`;
        }
        return `<span class="badge-priority low"><i class="bi bi-arrow-down-circle-fill"></i> Thấp</span>`;
    };

    // Build the progress timeline HTML based on ticket status
    const getTimelineHtml = (status) => {
        const s = status.toLowerCase();
        const steps = [
            { key: 'created',    label: 'Đã tạo phiếu',   icon: 'bi-plus-circle-fill' },
            { key: 'received',   label: 'Đã tiếp nhận',   icon: 'bi-inbox-fill' },
            { key: 'processing', label: 'Đang xử lý',     icon: 'bi-gear-fill' },
            { key: 'completed',  label: 'Hoàn thành',     icon: 'bi-check-circle-fill' },
        ];
        const stateMap = {
            pending:    1, // created only
            processing: 3, // created + received + processing
            completed:  4, // all
            cancelled:  2, // created + received then cancelled
        };
        const doneUpTo = stateMap[s] || 1;
        return steps.map((step, idx) => {
            const stepNum = idx + 1;
            let cls = 'inactive';
            if (stepNum < doneUpTo) cls = 'done';
            else if (stepNum === doneUpTo) cls = (s === 'cancelled' && stepNum === 2) ? 'done' : (stepNum === doneUpTo ? (s === 'completed' ? 'done' : (stepNum < doneUpTo ? 'done' : 'active')) : 'inactive');
            if (s === 'completed') cls = 'done';
            else if (stepNum < doneUpTo) cls = 'done';
            else if (stepNum === doneUpTo) cls = 'active';
            return `<div class="lk-timeline-item ${cls}">
                <div class="lk-tl-dot"><i class="bi ${step.icon}"></i></div>
                <div class="lk-tl-content">
                    <p class="lk-tl-content-title">${step.label}</p>
                </div>
            </div>`;
        }).join('');
    };

    const renderResults = () => {
        const count = currentResults.length;
        if (lblResultCount) lblResultCount.textContent = `Tìm thấy ${count} kết quả phù hợp`;

        if (count === 0) {
            lookupResultContainer.classList.add('d-none');
            lookupNotFoundContainer.classList.remove('d-none');
            return;
        }

        lookupNotFoundContainer.classList.add('d-none');
        lookupResultContainer.classList.remove('d-none');

        // A. SINGLE RESULT CARD SUMMARY (Conditional)
        if (count === 1) {
            singleResultSummaryCard.classList.remove('d-none');
            const single = currentResults[0];
            document.getElementById('sumTicketCode').textContent = single.code;
            document.getElementById('sumTicketTitle').textContent = single.title;
            document.getElementById('sumTicketDate').textContent = single.createdAt;
            document.getElementById('sumTicketStatus').innerHTML = getStatusBadgeHtml(single.status);
            document.getElementById('sumTicketPriority').innerHTML = getPriorityBadgeHtml(single.priority);
        } else {
            singleResultSummaryCard.classList.add('d-none');
        }

        // B. PAGINATION PAGED SLICING
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pagedTickets = currentResults.slice(startIndex, endIndex);

        // 1. RENDER CARD GRID (Desktop >=768px) — Modern card layout instead of table
        ticketTableBody.innerHTML = '';
        pagedTickets.forEach(ticket => {
            const cardHtml = `
                <div class="col-lg-6 col-md-6 col-12">
                    <div class="lk-ticket-card">
                        <div class="lk-ticket-card-top">
                            <div>
                                <span class="lk-ticket-code"><i class="bi bi-hash"></i>${ticket.code}</span>
                                <p class="lk-ticket-title mt-1">${ticket.title}</p>
                            </div>
                            ${getStatusBadgeHtml(ticket.status)}
                        </div>
                        <div class="lk-ticket-meta-grid">
                            <div class="lk-ticket-meta-item">
                                <span class="lk-ticket-meta-label">Danh mục</span>
                                <span class="lk-ticket-meta-value"><i class="bi bi-folder"></i> ${ticket.type || '—'}</span>
                            </div>
                            <div class="lk-ticket-meta-item">
                                <span class="lk-ticket-meta-label">Dịch vụ</span>
                                <span class="lk-ticket-meta-value"><i class="bi bi-headset"></i> ${ticket.service}</span>
                            </div>
                            <div class="lk-ticket-meta-item">
                                <span class="lk-ticket-meta-label">Ngày tạo</span>
                                <span class="lk-ticket-meta-value"><i class="bi bi-calendar-event"></i> ${ticket.createdAt}</span>
                            </div>
                            <div class="lk-ticket-meta-item">
                                <span class="lk-ticket-meta-label">Ưu tiên</span>
                                <span class="lk-ticket-meta-value">${getPriorityBadgeHtml(ticket.priority)}</span>
                            </div>
                        </div>
                        <div class="lk-ticket-timeline">
                            <div class="lk-timeline">
                                ${getTimelineHtml(ticket.status)}
                            </div>
                        </div>
                        <div class="lk-ticket-card-footer">
                            <div class="lk-ticket-actions">
                                <a href="ticket-detail.html?code=${ticket.code}" class="lk-btn-action primary">
                                    <i class="bi bi-file-text"></i> Xem chi tiết
                                </a>
                                <a href="ticket-chat.html?code=${ticket.code}" class="lk-btn-action">
                                    <i class="bi bi-chat-dots"></i> Trò chuyện
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            ticketTableBody.insertAdjacentHTML('beforeend', cardHtml);
        });

        // 2. RENDER CARDS (Mobile <768px)
        mobileCardsContainer.innerHTML = '';
        pagedTickets.forEach(ticket => {
            const cardHtml = `
                <div class="mobile-ticket-card">
                    <div class="mobile-ticket-header">
                        <span class="mobile-ticket-code">#${ticket.code}</span>
                        ${getStatusBadgeHtml(ticket.status)}
                    </div>
                    <h4 class="mobile-ticket-title">${ticket.title}</h4>
                    <div class="mobile-ticket-meta">
                        <div class="mobile-ticket-meta-item">
                            <span class="mobile-ticket-meta-label">Dịch vụ:</span>
                            <span class="mobile-ticket-meta-value">${ticket.service}</span>
                        </div>
                        <div class="mobile-ticket-meta-item">
                            <span class="mobile-ticket-meta-label">Ngày tạo:</span>
                            <span class="mobile-ticket-meta-value">${ticket.createdAt}</span>
                        </div>
                        <div class="mobile-ticket-meta-item">
                            <span class="mobile-ticket-meta-label">Ưu tiên:</span>
                            <span class="mobile-ticket-meta-value">${getPriorityBadgeHtml(ticket.priority)}</span>
                        </div>
                    </div>
                    <div class="mobile-ticket-action">
                        <a href="ticket-detail.html?code=${ticket.code}" class="btn-link-detail">Xem chi tiết <i class="bi bi-arrow-right"></i></a>
                    </div>
                </div>
            `;
            mobileCardsContainer.insertAdjacentHTML('beforeend', cardHtml);
        });

        // 3. RENDER PAGINATION CONTROLS
        renderPagination();
    };

    const renderPagination = () => {
        paginationUl.innerHTML = '';
        const totalPages = Math.ceil(currentResults.length / itemsPerPage);
        if (totalPages <= 1) {
            document.getElementById('paginationContainer').classList.add('d-none');
            return;
        }

        document.getElementById('paginationContainer').classList.remove('d-none');

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous">&laquo;</a>`;
        prevLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                renderResults();
            }
        });
        paginationUl.appendChild(prevLi);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${currentPage === i ? 'active' : ''}`;
            pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            pageLi.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i;
                renderResults();
            });
            paginationUl.appendChild(pageLi);
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next">&raquo;</a>`;
        nextLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < totalPages) {
                currentPage++;
                renderResults();
            }
        });
        paginationUl.appendChild(nextLi);
    };

    // ==================== 8. CORE SEARCH MATCH LOGIC ====================
    const executeSearch = (params) => {
        // Show loading toast
        const loader = showToast("Đang tìm kiếm...", "loading");

        // Hide result boxes initially
        lookupResultContainer.classList.add('d-none');
        lookupNotFoundContainer.classList.add('d-none');

        setTimeout(() => {
            // Remove spinner toast
            if (loader) {
                loader.classList.remove('show');
                loader.remove();
            }

            let matches = [];

            if (params.type === 'guest-quick') {
                const code = params.code.trim().toUpperCase();
                const contact = params.contact.trim().toLowerCase();

                matches = TICKETS_DATABASE.filter(ticket => {
                    const codeMatch = ticket.code === code;
                    const contactMatch = ticket.customer.phone === contact || ticket.customer.email.toLowerCase() === contact;
                    return codeMatch && contactMatch;
                });
            } 
            else if (params.type === 'guest-advanced') {
                const code = params.code.trim().toUpperCase();
                const phone = params.phone.trim();
                const email = params.email.trim().toLowerCase();
                const start = params.start;
                const end = params.end;
                const status = params.status;

                matches = TICKETS_DATABASE.filter(ticket => {
                    // Check conditions
                    if (code && ticket.code !== code) return false;
                    if (phone && ticket.customer.phone !== phone) return false;
                    if (email && ticket.customer.email.toLowerCase() !== email) return false;
                    if (status && status !== 'all' && ticket.status !== status) return false;
                    
                    // Date range
                    const ticketDate = parseDateString(ticket.createdAt);
                    if (start) {
                        const s = new Date(start);
                        s.setHours(0,0,0,0);
                        if (ticketDate < s) return false;
                    }
                    if (end) {
                        const e = new Date(end);
                        e.setHours(23,59,59,999);
                        if (ticketDate > e) return false;
                    }
                    return true;
                });
            } 
            else if (params.type === 'member-filter') {
                const code = params.code.trim().toUpperCase();
                const status = params.status;
                const service = params.service;
                const start = params.start;
                const end = params.end;

                matches = TICKETS_DATABASE.filter(ticket => {
                    if (code && !ticket.code.includes(code)) return false;
                    if (status && status !== 'all' && ticket.status !== status) return false;
                    if (service && service !== 'all' && ticket.service !== service) return false;
                    
                    const ticketDate = parseDateString(ticket.createdAt);
                    if (start) {
                        const s = new Date(start);
                        s.setHours(0,0,0,0);
                        if (ticketDate < s) return false;
                    }
                    if (end) {
                        const e = new Date(end);
                        e.setHours(23,59,59,999);
                        if (ticketDate > e) return false;
                    }
                    return true;
                });
            }

            // Update state and render
            currentResults = matches;
            currentPage = 1;
            
            if (matches.length > 0) {
                renderResults();
                showToast("Tìm thấy dữ liệu", "success");
                
                // Scroll page smoothly down to results container
                lookupResultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                lookupResultContainer.classList.add('d-none');
                lookupNotFoundContainer.classList.remove('d-none');
                showToast("Không tìm thấy dữ liệu", "danger");
                
                // Scroll down to empty error container
                lookupNotFoundContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

        }, 800);
    };

    // ==================== 9. FORM BINDINGS ====================

    // Guest Quick search submit
    if (guestSearchForm) {
        guestSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = ticketCodeInput.value;
            const contact = contactInput.value;

            if (!code || !contact || code.trim() === '' || contact.trim() === '') {
                guestSearchForm.classList.add('was-validated');
                return;
            }
            guestSearchForm.classList.remove('was-validated');
            executeSearch({
                type: 'guest-quick',
                code: code,
                contact: contact
            });
        });
    }

    // Guest Advanced search submit
    if (advancedGuestForm) {
        advancedGuestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = advGuestCode.value;
            const phone = advGuestPhone.value;
            const email = advGuestEmail.value;
            const start = advGuestStart.value;
            const end = advGuestEnd.value;
            const status = advGuestStatus.value;

            if (!code && !phone && !email && !start && !end && status === 'all') {
                showToast("Vui lòng nhập ít nhất một tiêu chí tìm kiếm.", "warning");
                return;
            }

            executeSearch({
                type: 'guest-advanced',
                code: code,
                phone: phone,
                email: email,
                start: start,
                end: end,
                status: status
            });
        });
    }

    // Member Filters submit
    if (memberFilterForm) {
        memberFilterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            executeSearch({
                type: 'member-filter',
                code: memberCodeFilter.value,
                status: memberStatusFilter.value,
                service: memberServiceFilter.value,
                start: memberStartFilter.value,
                end: memberEndFilter.value
            });
        });
    }

    // Retry / Clear Search parameters
    if (btnRetrySearch) {
        btnRetrySearch.addEventListener('click', () => {
            // Reset guest form inputs
            if (ticketCodeInput) ticketCodeInput.value = '';
            if (contactInput) contactInput.value = '';
            if (advGuestCode) advGuestCode.value = '';
            if (advGuestPhone) advGuestPhone.value = '';
            if (advGuestEmail) advGuestEmail.value = '';
            if (advGuestStart) advGuestStart.value = '';
            if (advGuestEnd) advGuestEnd.value = '';
            if (advGuestStatus) advGuestStatus.value = 'all';

            // Reset member form inputs
            if (memberCodeFilter) memberCodeFilter.value = '';
            if (memberStatusFilter) memberStatusFilter.value = 'all';
            if (memberServiceFilter) memberServiceFilter.value = 'all';
            if (memberStartFilter) memberStartFilter.value = '';
            if (memberEndFilter) memberEndFilter.value = '';

            // Hide displays
            lookupResultContainer.classList.add('d-none');
            lookupNotFoundContainer.classList.add('d-none');

            // Remove form validation styling
            if (guestSearchForm) guestSearchForm.classList.remove('was-validated');
            if (advancedGuestForm) advancedGuestForm.classList.remove('was-validated');
            
            // Re-focus first input if guest
            if (!isLoggedIn && ticketCodeInput) {
                ticketCodeInput.focus();
            } else if (isLoggedIn) {
                // If member, reload default list
                currentResults = [...TICKETS_DATABASE];
                renderResults();
            }
        });
    }

    // ==================== 10. DELEGATE AUTH EVENT & PRE-LOOKUPS ====================
    
    // Check auth on load
    checkAuthState();

    // Check if there is an auth changes listener or run a poller to sync auth
    // (since main.js asynchronously loads header.js, check session storage)
    setTimeout(() => {
        checkAuthState();
    }, 500);

    // Also support parsing a code direct parameter (e.g. ?code=PT2026000123)
    const handleUrlParams = () => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code') || params.get('id');
        if (code) {
            const cleanCode = code.trim().toUpperCase();
            if (isLoggedIn) {
                if (memberCodeFilter) memberCodeFilter.value = cleanCode;
                executeSearch({
                    type: 'member-filter',
                    code: cleanCode,
                    status: 'all',
                    service: 'all',
                    start: '',
                    end: ''
                });
            } else {
                if (ticketCodeInput) ticketCodeInput.value = cleanCode;
                // Since guest requires phone/email, pre-fill phone to allow quick search
                if (contactInput) contactInput.value = '0909123456';
                executeSearch({
                    type: 'guest-quick',
                    code: cleanCode,
                    contact: '0909123456'
                });
            }
        }
    };
    
    handleUrlParams();
});
