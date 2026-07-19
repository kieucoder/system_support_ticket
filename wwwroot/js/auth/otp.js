/* ==============================================================
   FILE: wwwroot/js/auth/otp.js
   AUTHOR: Senior UI/UX Designer & Frontend Developer
   DESCRIPTION: Advanced 6-digit OTP verification script, timers,
                progress bar, Ajax resend, and premium Toast alerts.
   ============================================================== */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const verifyForm = document.getElementById('otpVerificationForm');
    const resendForm = document.getElementById('resendOtpForm');
    const hiddenOtpInput = document.getElementById('otpInput');
    const btnConfirmOtp = document.getElementById('btnConfirmOtp');
    const btnResendOtp = document.getElementById('btnResendOtp');
    const otpCountdownText = document.getElementById('otpCountdownText');
    const resendCountdownText = document.getElementById('resendCountdownText');
    const otpExpiryDisplay = document.getElementById('otpExpiryDisplay');
    const progressBar = document.getElementById('otpProgressBar');
    
    const expiryInput = document.getElementById('otpExpirySeconds');
    const resendCooldownInput = document.getElementById('otpResendCooldown');

    if (!verifyForm || !resendForm || !btnConfirmOtp || !btnResendOtp) {
        return;
    }

    let initialExpirySeconds = Number(expiryInput?.value || 300);
    let expirySeconds = initialExpirySeconds;
    let resendCooldownSeconds = Number(resendCooldownInput?.value || 60);
    let timerHandle = null;

    // Toast Notifications
    const showToast = (message, type = 'success') => {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast show text-dark border-0 p-3';
        
        let borderLeftColor = '#28A745'; // success
        let iconHtml = '<i class="bi bi-check-circle-fill text-success me-2"></i>';
        if (type === 'danger') {
            borderLeftColor = '#DC3545';
            iconHtml = '<i class="bi bi-x-circle-fill text-danger me-2"></i>';
        } else if (type === 'warning') {
            borderLeftColor = '#FFC107';
            iconHtml = '<i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>';
        }

        toast.style.borderLeft = `5px solid ${borderLeftColor}`;
        toast.style.borderRadius = '16px';
        toast.style.boxShadow = '0 16px 32px rgba(15,23,42,.15)';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.justifyContent = 'space-between';

        toast.innerHTML = `
            <div class="d-flex align-items-center">
                ${iconHtml}
                <span class="fw-semibold small">${message}</span>
            </div>
            <button type="button" class="btn-close btn-close-dark ms-3 small" style="font-size:0.75rem;" aria-label="Đóng"></button>
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

    const formatTime = totalSeconds => {
        const safeSeconds = Math.max(0, totalSeconds);
        const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
        const seconds = String(safeSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const updateCountdownUi = () => {
        const formattedTime = formatTime(expirySeconds);
        otpCountdownText.textContent = formattedTime;
        if (otpExpiryDisplay) {
            otpExpiryDisplay.textContent = formattedTime;
        }

        // Update progress bar
        if (progressBar) {
            const percentage = initialExpirySeconds > 0 ? (expirySeconds / initialExpirySeconds) * 100 : 0;
            progressBar.style.width = `${percentage}%`;

            // Change progress bar color based on remaining time
            if (percentage > 50) {
                progressBar.style.backgroundColor = '#28A745'; // Green
            } else if (percentage > 20) {
                progressBar.style.backgroundColor = '#FFC107'; // Yellow
            } else {
                progressBar.style.backgroundColor = '#DC3545'; // Red
            }
        }

        // Update resend countdown
        if (resendCooldownSeconds > 0) {
            resendCountdownText.textContent = `(${formatTime(resendCooldownSeconds)})`;
            btnResendOtp.disabled = true;
        } else {
            resendCountdownText.textContent = '';
            btnResendOtp.disabled = false;
        }

        // Disable confirm button if expired
        if (expirySeconds <= 0) {
            btnConfirmOtp.disabled = true;
            showToast('Mã OTP của bạn đã hết hạn. Vui lòng bấm gửi lại.', 'danger');
        } else {
            btnConfirmOtp.disabled = false;
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
            
            if (expirySeconds <= 0 && resendCooldownSeconds <= 0) {
                clearInterval(timerHandle);
            }
        }, 1000);
    };

    // OTP 6 Inputs navigation logic
    const otpInputs = document.querySelectorAll('.otp-digit-input');
    
    if (otpInputs.length > 0) {
        // Auto-focus first input
        setTimeout(() => otpInputs[0].focus(), 300);

        otpInputs.forEach((input, index) => {
            // Only allow numbers
            input.addEventListener('input', (e) => {
                const val = e.target.value;
                e.target.value = val.replace(/[^0-9]/g, '');

                if (e.target.value.length > 0) {
                    if (index < otpInputs.length - 1) {
                        otpInputs[index + 1].focus();
                    }
                }
                updateMergedOtpValue();
            });

            // Handle backspace & arrow navigation
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace') {
                    if (e.target.value.length === 0 && index > 0) {
                        otpInputs[index - 1].focus();
                        otpInputs[index - 1].value = '';
                    } else {
                        e.target.value = '';
                    }
                    updateMergedOtpValue();
                    e.preventDefault();
                } else if (e.key === 'ArrowLeft' && index > 0) {
                    otpInputs[index - 1].focus();
                } else if (e.key === 'ArrowRight' && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });

            // Handle Paste
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const clipboardData = e.clipboardData || window.clipboardData;
                const pastedData = clipboardData.getData('Text').trim().replace(/[^0-9]/g, '');

                if (pastedData.length === 6) {
                    otpInputs.forEach((optIn, i) => {
                        optIn.value = pastedData[i];
                    });
                    otpInputs[5].focus();
                    updateMergedOtpValue();
                }
            });
        });
    }

    const updateMergedOtpValue = () => {
        let otpCode = '';
        otpInputs.forEach(input => {
            otpCode += input.value;
        });
        hiddenOtpInput.value = otpCode;
    };

    // Sync input box if otpInput already has content (e.g. model validation round-trip)
    const syncOtpInputsFromHidden = () => {
        const val = hiddenOtpInput.value.trim();
        if (val.length === 6 && otpInputs.length === 6) {
            for (let i = 0; i < 6; i++) {
                otpInputs[i].value = val[i];
            }
        }
    };
    syncOtpInputsFromHidden();

    // Verify form submit handler
    verifyForm.addEventListener('submit', event => {
        const otp = hiddenOtpInput.value.trim();
        if (!/^\d{6}$/.test(otp)) {
            event.preventDefault();
            otpInputs.forEach(input => input.classList.add('is-invalid'));
            showToast('Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số.', 'warning');
            return;
        }

        if (expirySeconds <= 0) {
            event.preventDefault();
            showToast('Mã OTP đã hết hạn. Hãy yêu cầu gửi lại mã mới.', 'danger');
            return;
        }

        otpInputs.forEach(input => input.classList.remove('is-invalid'));
        
        // Show Loading Animation on button
        const btnText = btnConfirmOtp.querySelector('.btn-text');
        const spinner = btnConfirmOtp.querySelector('.spinner');
        if (btnText && spinner) {
            btnText.style.display = 'none';
            spinner.style.display = 'inline-flex';
        }
        btnConfirmOtp.disabled = true;
    });

    // Resend Form AJAX submit handler
    resendForm.addEventListener('submit', async event => {
        event.preventDefault();

        if (resendCooldownSeconds > 0) {
            showToast(`Vui lòng chờ ${resendCooldownSeconds} giây để gửi lại OTP.`, 'warning');
            return;
        }

        btnResendOtp.disabled = true;
        const defaultHtml = btnResendOtp.innerHTML;
        btnResendOtp.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang gửi lại...';

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
                // Read new expiry & cooldown from JSON
                expirySeconds = Number(result.expirySeconds || 300);
                initialExpirySeconds = expirySeconds;
                resendCooldownSeconds = Number(result.resendCooldownSeconds || 60);
                
                // Clear input boxes
                otpInputs.forEach(input => {
                    input.value = '';
                    input.classList.remove('is-invalid');
                });
                hiddenOtpInput.value = '';
                
                // Start over
                startTimers();
                setTimeout(() => otpInputs[0].focus(), 300);
                showToast(result.message || 'Một mã OTP mới đã được gửi tới Email/Số điện thoại thành công.', 'success');
            } else {
                if (result.redirectUrl) {
                    window.location.href = result.redirectUrl;
                    return;
                }
                
                resendCooldownSeconds = Number(result.resendCooldownSeconds || 0);
                updateCountdownUi();
                showToast(result.message || 'Yêu cầu gửi lại OTP không thành công.', 'danger');
            }
        } catch (error) {
            console.error(error);
            showToast('Lỗi kết nối. Không thể gửi lại mã OTP lúc này.', 'danger');
        } finally {
            btnResendOtp.innerHTML = defaultHtml;
            updateCountdownUi();
        }
    });

    // Initial Start
    startTimers();
});
