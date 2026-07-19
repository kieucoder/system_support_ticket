/* --------------------------------------------------------------------------
   FILE: assets/js/ticket-success.js
   DESCRIPTION: Interactive logic for the Ticket Success Portal Page
                ALL DATA is rendered server-side via Razor @Model
                This file ONLY handles UI interactions (copy, accordion, animation)
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ==================== 1. TOAST UTILITY ====================
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

    // ==================== 2. COPY TICKET CODE ====================
    // Reads the ticket code from the DOM (rendered by Razor @Model.MaPhieu)
    const btnCopyCode = document.getElementById('btnCopyCode');
    const copyIcon = document.getElementById('copyIcon');
    const ticketCodeEl = document.getElementById('ticketCodeValue');

    if (btnCopyCode && ticketCodeEl) {
        btnCopyCode.addEventListener('click', async () => {
            const code = ticketCodeEl.textContent.trim();
            try {
                await navigator.clipboard.writeText(code);
                if (copyIcon) {
                    copyIcon.className = 'bi bi-clipboard-check';
                    setTimeout(() => { copyIcon.className = 'bi bi-clipboard'; }, 2000);
                }
                showToast(`Đã sao chép mã phiếu: ${code}`);
            } catch {
                // Fallback for older browsers
                const tempInput = document.createElement('input');
                tempInput.value = code;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                showToast(`Đã sao chép mã phiếu: ${code}`);
            }
        });
    }

    // ==================== 3. FAQ ACCORDION ====================
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(btn => {
        btn.addEventListener('click', () => {
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            const answerId = btn.getAttribute('aria-controls');
            const answerEl = document.getElementById(answerId);

            // Close all others
            faqQuestions.forEach(otherBtn => {
                const otherId = otherBtn.getAttribute('aria-controls');
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

    // ==================== 4. CUSTOMER AVATAR INITIALS ====================
    // Generate initials from the name already rendered in the DOM by Razor
    const avatarEl = document.getElementById('customerAvatarInitials');
    if (avatarEl && avatarEl.dataset.name) {
        const nameParts = avatarEl.dataset.name.trim().split(' ');
        const initials = nameParts.length >= 2
            ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
            : nameParts[0].substring(0, 2).toUpperCase();
        avatarEl.textContent = initials;
    }

    // ==================== 5. SCROLL ANIMATIONS ====================
    // Intersection Observer for animate-fade-up elements
    const animatedEls = document.querySelectorAll('.animate-fade-up');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animatedEls.forEach(el => observer.observe(el));
    }
});
