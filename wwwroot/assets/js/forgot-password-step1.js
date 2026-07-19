/* ==============================================================
   FILE: wwwroot/assets/js/forgot-password-step1.js
   AUTHOR: Senior UI/UX Designer & Frontend Developer
   DESCRIPTION: Handles static forgot password flow (Step 1).
   ============================================================== */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const step1Form = document.getElementById('step1Form');
    const inputIdentifier = document.getElementById('resetIdentifier');
    const btnSendOtp = document.getElementById('btnSendOtp');
    const identifierError = document.getElementById('identifierError');

    if (!step1Form || !inputIdentifier || !btnSendOtp) {
        return;
    }

    // Toast helper
    const showToast = (message, type = 'success') => {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast-premium show';
        
        let borderLeftColor = '#28a745'; // success
        let iconHtml = '<i class="bi bi-check-circle-fill text-success me-2 fs-5"></i>';
        if (type === 'danger') {
            borderLeftColor = '#dc3545';
            iconHtml = '<i class="bi bi-x-circle-fill text-danger me-2 fs-5"></i>';
        } else if (type === 'warning') {
            borderLeftColor = '#ffc107';
            iconHtml = '<i class="bi bi-exclamation-triangle-fill text-warning me-2 fs-5"></i>';
        }

        toast.style.borderLeft = `5px solid ${borderLeftColor}`;
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.justifyContent = 'space-between';
        toast.style.padding = '16px';
        toast.style.background = 'white';
        toast.style.borderRadius = '16px';
        toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.15)';

        toast.innerHTML = `
            <div class="d-flex align-items-center">
                ${iconHtml}
                <span class="fw-semibold small text-dark">${message}</span>
            </div>
            <button type="button" class="btn-close ms-3 border-0 bg-transparent text-muted small" style="cursor:pointer;" aria-label="Close"><i class="bi bi-x fs-5"></i></button>
        `;

        toast.querySelector('.btn-close').addEventListener('click', () => {
            toast.remove();
        });

        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    };

    step1Form.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = inputIdentifier.value.trim();

        if (!value) {
            inputIdentifier.classList.add('is-invalid');
            if (identifierError) identifierError.style.display = 'block';
            showToast('Vui lòng điền email hoặc số điện thoại.', 'warning');
            return;
        }

        inputIdentifier.classList.remove('is-invalid');
        if (identifierError) identifierError.style.display = 'none';

        // Show spinner loading
        const btnText = btnSendOtp.querySelector('.btn-text');
        const spinner = btnSendOtp.querySelector('.spinner');
        if (btnText && spinner) {
            btnText.style.display = 'none';
            spinner.style.display = 'inline-flex';
        }
        btnSendOtp.disabled = true;

        // Simulate AJAX request to send OTP code
        setTimeout(() => {
            if (btnText && spinner) {
                btnText.style.display = 'inline-flex';
                spinner.style.display = 'none';
            }
            btnSendOtp.disabled = false;

            // Cache identity
            localStorage.setItem('resetIdentifier', value);

            // Redirect
            window.location.href = 'step2-verify-account.html';
        }, 1200);
    });
});
