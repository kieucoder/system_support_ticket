/* --------------------------------------------------------------------------
   FILE: assets/js/ticket-success.js
   AUTHOR: Antigravity
   DESCRIPTION: Interactive logic for the Ticket Success Portal Page
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ==================== 1. DATA LAYER ====================
    const TICKET_DATA = {
        code:          'PT2026000123',
        title:         'Internet cáp quang mất kết nối',
        service:       'Internet Cáp Quang',
        requestType:   'Sự cố kỹ thuật',
        createdDate:   null,
        status:        'pending',
        statusText:    'Chờ tiếp nhận',
        priority:      'high',
        priorityText:  'Cao',
        customer: {
            name:    'Nguyễn Văn An',
            phone:   '0909123456',
            email:   'nguyenvanan@gmail.com',
            address: '123 Nguyễn Văn Linh, Cần Thơ'
        }
    };

    // If there's URL params ?code= use them; else use demo data
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if (codeParam) TICKET_DATA.code = codeParam.trim().toUpperCase();

    // Check if there's a freshly created ticket in localStorage to display
    const tryLoadFromStorage = () => {
        const lastTicket = JSON.parse(localStorage.getItem('techsupport_last_created_ticket') || 'null');
        if (lastTicket) {
            if (lastTicket.code)         TICKET_DATA.code         = lastTicket.code;
            if (lastTicket.title)        TICKET_DATA.title        = lastTicket.title;
            if (lastTicket.service)      TICKET_DATA.service      = lastTicket.service;
            if (lastTicket.priority)     TICKET_DATA.priorityText = lastTicket.priority;
            if (lastTicket.customer)     Object.assign(TICKET_DATA.customer, lastTicket.customer);
        }
    };
    tryLoadFromStorage();

    // ==================== 2. TOAST UTILITY ====================
    const showToast = (message) => {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'custom-toast';
        toast.innerHTML = `
            <i class="bi bi-check-circle-fill text-success"></i>
            <span class="custom-toast-text">${message}</span>
        `;

        toastContainer.appendChild(toast);
        toast.offsetHeight; // trigger reflow
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, 3000);
    };

    // ==================== 3. RENDER PAGE DATA ====================
    const getNowDateStr = () => {
        const now = new Date();
        return now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const setTextById = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    const renderTicketInfo = () => {
        // Success Card Badge Code
        setTextById('ticketCodeValue', TICKET_DATA.code);

        // Table details
        setTextById('infoTicketCode',    TICKET_DATA.code);
        setTextById('infoCreatedDate',   getNowDateStr());
        setTextById('infoTicketTitle',   TICKET_DATA.title);
        setTextById('infoTicketService', TICKET_DATA.service);
        setTextById('infoTicketType',    TICKET_DATA.requestType);
        
        // Customer Info
        setTextById('infoCustomerName',    TICKET_DATA.customer.name);
        setTextById('infoCustomerAddress', TICKET_DATA.customer.address);

        // Phone links
        const customerPhone = document.getElementById('infoCustomerPhone');
        if (customerPhone) {
            customerPhone.textContent = TICKET_DATA.customer.phone;
            customerPhone.href = `tel:${TICKET_DATA.customer.phone.replace(/\s+/g, '')}`;
        }
        const confirmPhone = document.getElementById('confirmPhone');
        if (confirmPhone) {
            confirmPhone.textContent = TICKET_DATA.customer.phone;
            confirmPhone.href = `tel:${TICKET_DATA.customer.phone.replace(/\s+/g, '')}`;
        }

        // Email links
        const customerEmail = document.getElementById('infoCustomerEmail');
        if (customerEmail) {
            customerEmail.textContent = TICKET_DATA.customer.email;
            customerEmail.href = `mailto:${TICKET_DATA.customer.email}`;
        }
        const confirmEmail = document.getElementById('confirmEmail');
        if (confirmEmail) {
            confirmEmail.textContent = TICKET_DATA.customer.email;
            confirmEmail.href = `mailto:${TICKET_DATA.customer.email}`;
        }

        // Customer avatar initials
        const avatarEl = document.getElementById('customerAvatarInitials');
        if (avatarEl) {
            const nameParts = TICKET_DATA.customer.name.trim().split(' ');
            const initials = nameParts.length >= 2
                ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                : nameParts[0].substring(0, 2).toUpperCase();
            avatarEl.textContent = initials;
        }

        // Priority pill
        const priorityPill = document.getElementById('infoTicketPriority');
        if (priorityPill) {
            priorityPill.textContent = TICKET_DATA.priorityText || 'Cao';
        }

        // View ticket button href
        const btnViewTicket = document.getElementById('btnViewTicket');
        if (btnViewTicket) btnViewTicket.href = `ticket-detail.html?code=${TICKET_DATA.code}`;

        // Step 1 time
        const step1TimeEl = document.querySelector('#step1 .step-h-time');
        if (step1TimeEl) {
            step1TimeEl.innerHTML = `<i class="bi bi-clock-fill"></i> ${getNowDateStr()}`;
        }
    };

    // ==================== 4. COPY TICKET CODE ====================
    const btnCopyCode = document.getElementById('btnCopyCode');
    const copyIcon    = document.getElementById('copyIcon');

    if (btnCopyCode) {
        btnCopyCode.addEventListener('click', async () => {
            const code = TICKET_DATA.code;
            try {
                await navigator.clipboard.writeText(code);
                if (copyIcon) {
                    copyIcon.className = 'bi bi-clipboard-check';
                    setTimeout(() => { copyIcon.className = 'bi bi-clipboard'; }, 2000);
                }
                showToast(`Đã sao chép mã phiếu.`);
            } catch {
                // Fallback for older browsers
                const tempInput = document.createElement('input');
                tempInput.value = code;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                showToast(`Đã sao chép mã phiếu.`);
            }
        });
    }

    // ==================== 5. FAQ ACCORDION ====================
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(btn => {
        btn.addEventListener('click', () => {
            const expanded  = btn.getAttribute('aria-expanded') === 'true';
            const answerId  = btn.getAttribute('aria-controls');
            const answerEl  = document.getElementById(answerId);

            // Close all others
            faqQuestions.forEach(otherBtn => {
                const otherId    = otherBtn.getAttribute('aria-controls');
                const otherAnswer = document.getElementById(otherId);
                otherBtn.setAttribute('aria-expanded', 'false');
                if (otherAnswer) otherAnswer.hidden = true;
            });

            // Toggle current
            if (!expanded && answerEl) {
                btn.setAttribute('aria-expanded', 'true');
                answerEl.hidden = false;
            }
        });
    });

    // ==================== 6. PAGE TITLE AUTO-UPDATE ====================
    document.title = `${TICKET_DATA.code} - Tạo Phiếu Thành Công | TechSupport Viettel`;

    // ==================== 7. INITIALIZE RENDER ====================
    renderTicketInfo();
});
