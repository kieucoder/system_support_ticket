document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const verifyForm = document.getElementById('otpVerificationForm');
    const resendForm = document.getElementById('resendOtpForm');
    const otpInput = document.getElementById('otpInput');
    const btnConfirmOtp = document.getElementById('btnConfirmOtp');
    const btnResendOtp = document.getElementById('btnResendOtp');
    const otpCountdownText = document.getElementById('otpCountdownText');
    const resendCountdownText = document.getElementById('resendCountdownText');
    const otpExpiryDisplay = document.getElementById('otpExpiryDisplay');
    const expiryInput = document.getElementById('otpExpirySeconds');
    const resendCooldownInput = document.getElementById('otpResendCooldown');

    if (!verifyForm || !resendForm || !btnConfirmOtp || !btnResendOtp) {
        return;
    }

    let expirySeconds = Number(expiryInput?.value || 0);
    let resendCooldownSeconds = Number(resendCooldownInput?.value || 0);
    let timerHandle = null;

    const formatTime = totalSeconds => {
        const safeSeconds = Math.max(0, totalSeconds);
        const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
        const seconds = String(safeSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const showToast = (message, type = 'success') => {
        const existing = document.querySelector('.toast-container');
        if (existing) {
            existing.remove();
        }

        const palette = {
            success: '#198754',
            danger: '#dc3545',
            warning: '#f59e0b'
        };

        const icons = {
            success: '<i class="bi bi-check-circle-fill me-2"></i>',
            danger: '<i class="bi bi-x-circle-fill me-2"></i>',
            warning: '<i class="bi bi-exclamation-triangle-fill me-2"></i>'
        };

        const wrapper = document.createElement('div');
        wrapper.className = 'position-fixed bottom-0 end-0 p-3 toast-container';
        wrapper.style.zIndex = '1080';
        wrapper.innerHTML = `
            <div class="toast show text-white border-0" style="background:${palette[type] || palette.success}; min-width:280px; border-radius:16px; box-shadow:0 16px 32px rgba(15,23,42,.22);">
                <div class="toast-body d-flex align-items-center justify-content-between">
                    <div>${icons[type] || icons.success}${message}</div>
                    <button type="button" class="btn-close btn-close-white ms-3" aria-label="Đóng"></button>
                </div>
            </div>`;

        wrapper.querySelector('.btn-close')?.addEventListener('click', () => wrapper.remove());
        document.body.appendChild(wrapper);
        setTimeout(() => wrapper.remove(), 4000);
    };

    const setButtonLoading = (button, isLoading, loadingText) => {
        const text = button.querySelector('.btn-text');
        const spinner = button.querySelector('.spinner');

        button.disabled = isLoading;
        if (text) {
            text.style.display = isLoading ? 'none' : 'inline-flex';
        } else if (!spinner) {
            button.innerHTML = isLoading ? loadingText : button.dataset.defaultText;
        }

        if (spinner) {
            spinner.style.display = isLoading ? 'inline-flex' : 'none';
        }
    };

    const updateCountdownUi = () => {
        otpCountdownText.textContent = formatTime(expirySeconds);
        otpExpiryDisplay.textContent = formatTime(expirySeconds);
        resendCountdownText.textContent = formatTime(resendCooldownSeconds);

        btnResendOtp.disabled = resendCooldownSeconds > 0;
        if (expirySeconds <= 0) {
            otpCountdownText.textContent = '00:00';
            otpExpiryDisplay.textContent = '00:00';
        }
    };

    const startTimers = () => {
        if (timerHandle) {
            clearInterval(timerHandle);
        }

        updateCountdownUi();
        timerHandle = window.setInterval(() => {
            if (expirySeconds > 0) {
                expirySeconds -= 1;
            }

            if (resendCooldownSeconds > 0) {
                resendCooldownSeconds -= 1;
            }

            updateCountdownUi();
        }, 1000);
    };

    otpInput?.addEventListener('input', () => {
        otpInput.value = otpInput.value.replace(/\D/g, '').slice(0, 6);
    });

    verifyForm.addEventListener('submit', event => {
        const otp = otpInput?.value?.trim() ?? '';
        if (!/^\d{6}$/.test(otp)) {
            event.preventDefault();
            otpInput?.classList.add('is-invalid');
            const span = verifyForm.querySelector('span[data-valmsg-for="Otp"]');
            if (span) {
                span.textContent = 'Vui lòng nhập đúng 6 chữ số OTP.';
            }
            showToast('Vui lòng nhập đúng 6 chữ số OTP.', 'warning');
            return;
        }

        if (expirySeconds <= 0) {
            event.preventDefault();
            showToast('Mã OTP đã hết hạn.', 'danger');
            return;
        }

        otpInput?.classList.remove('is-invalid');
        const span = verifyForm.querySelector('span[data-valmsg-for="Otp"]');
        if (span) {
            span.textContent = '';
        }

        setButtonLoading(btnConfirmOtp, true, 'Đang xác thực...');
    });

    btnResendOtp.dataset.defaultText = btnResendOtp.innerHTML;
    resendForm.addEventListener('submit', async event => {
        event.preventDefault();

        if (resendCooldownSeconds > 0) {
            showToast(`Vui lòng chờ ${resendCooldownSeconds} giây để gửi lại OTP.`, 'warning');
            return;
        }

        btnResendOtp.disabled = true;
        const defaultHtml = btnResendOtp.innerHTML;
        btnResendOtp.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang gửi lại...';

        try {
            const response = await fetch(resendForm.action, {
                method: 'POST',
                body: new FormData(resendForm),
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            if (result.success) {
                expirySeconds = Number(result.expirySeconds || 300);
                resendCooldownSeconds = Number(result.resendCooldownSeconds || 60);
                otpInput.value = '';
                otpInput.focus();
                otpInput.classList.remove('is-invalid');
                const span = verifyForm.querySelector('span[data-valmsg-for="Otp"]');
                if (span) {
                    span.textContent = '';
                }
                startTimers();
                showToast(result.message || 'OTP mới đã được gửi.', 'success');
                return;
            }

            if (result.redirectUrl) {
                window.location.href = result.redirectUrl;
                return;
            }

            resendCooldownSeconds = Number(result.resendCooldownSeconds || 0);
            updateCountdownUi();
            showToast(result.message || 'Không thể gửi lại OTP.', 'danger');
        } catch (error) {
            console.error(error);
            showToast('Lỗi kết nối khi gửi lại OTP.', 'danger');
        } finally {
            btnResendOtp.innerHTML = defaultHtml;
            updateCountdownUi();
        }
    });

    startTimers();
});
