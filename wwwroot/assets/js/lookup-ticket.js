/* ==========================================================================
   FILE: assets/js/lookup-ticket.js
   AUTHOR: Antigravity
   DESCRIPTION: Search & Lookup client-side logic for TechSupport Portal
   NOTE: Data is now fetched from server via POST action, no mock data
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ==================== 1. UI ELEMENTS ====================
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
    const lookupNotFoundContainer = document.getElementById('lookupNotFoundContainer');
    const btnRetrySearch = document.getElementById('btnRetrySearch');

    // ==================== 2. INTERNAL STATE ====================
    let isLoggedIn = false;
    let loggedInUser = null;

    // ==================== 3. AUTH STATE CHECK ====================
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
        } else {
            isLoggedIn = false;
            loggedInUser = null;
            
            // Adjust layouts
            if (guestSearchBlock) guestSearchBlock.classList.remove('d-none');
            if (memberSearchBlock) memberSearchBlock.classList.add('d-none');
        }
    };

    // ==================== 4. TOAST UTILITY ====================
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
        } else if (type === 'info') {
            iconHtml = '<i class="bi bi-info-circle-fill text-info fs-5"></i>';
        }

        toast.innerHTML = `
            ${iconHtml}
            <span class="custom-toast-text ms-2">${message}</span>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, 3000);

        return toast;
    };

    // ==================== 5. FORM BINDINGS ====================
    // Guest Quick search submit - form submits to server via POST
    // No client-side interception needed, server handles search

    // Guest Advanced search submit - form submits to server via POST
    // No client-side interception needed, server handles search

    // Member Filters submit - form submits to server via POST
    // No client-side interception needed, server handles search

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

            // Remove form validation styling
            if (guestSearchForm) guestSearchForm.classList.remove('was-validated');
            if (advancedGuestForm) advancedGuestForm.classList.remove('was-validated');
            
            // Reload page to clear results
            window.location.reload();
        });
    }

    // ==================== 6. AUTH STATE CHECK ====================
    // Check auth on load
    checkAuthState();

    // Check if there is an auth changes listener or run a poller to sync auth
    // (since main.js asynchronously loads header.js, check session storage)
    setTimeout(() => {
        checkAuthState();
    }, 500);
});
