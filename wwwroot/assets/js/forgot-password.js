/* ==============================================================
   FILE: wwwroot/assets/js/forgot-password.js
   AUTHOR: Senior UI/UX Designer & Frontend Developer
   DESCRIPTION: JS file handling multi-step forgot password flow,
                6-digit OTP input boxes, timers, validation, and Toast alerts.
   ============================================================== */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // DOM Elements
    const step1Form = document.getElementById('step1Form');
    const step2Form = document.getElementById('step2Form');
    
    const step1Section = document.getElementById('step1Section');
    const step2Section = document.getElementById('step2Section');
    const step3Section = document.getElementById('step3Section');
    
    const inputIdentifier = document.getElementById('resetIdentifier');
    const displayTargetText = document.getElementById('displayTargetText');
    
    const newPasswordField = document.getElementById('newPassword');
    const confirmPasswordField = document.getElementById('confirmPassword');
    
    const btnSendOtp = document.getElementById('btnSendOtp');
    const btnResetPassword = document.getElementById('btnResetPassword');
    const btnResendOtp = document.getElementById('btnResendOtp');
    
    const otpCountdownText = document.getElementById('otpCountdownText');
    const resendCountdownText = document.getElementById('resendCountdownText');
    const progressBar = document.getElementById('otpProgressBar');

    // Timer States
    let initialExpirySeconds = 300; // 5 minutes
    let expirySeconds = initialExpirySeconds;
    let resendCooldownSeconds = 60; // 60 seconds
    let timerHandle = null;
    let userIdentifierValue = '';

    // --- 1. Toast Notifications ---
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

    // --- 2. Toggle Passwords ---
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            const icon = btn.querySelector('i');

            if (targetInput && icon) {
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    icon.classList.remove('bi-eye-slash');
                    icon.classList.add('bi-eye');
                } else {
                    targetInput.type = 'password';
                    icon.classList.remove('bi-eye');
                    icon.classList.add('bi-eye-slash');
                }
            }
        });
    });

    // --- 3. 6 Digit OTP Box navigation ---
    const otpInputs = document.querySelectorAll('.otp-digit-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            e.target.value = val.replace(/[^0-9]/g, '');

            if (e.target.value.length > 0) {
                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                if (e.target.value.length === 0 && index > 0) {
                    otpInputs[index - 1].focus();
                    otpInputs[index - 1].value = '';
                } else {
                    e.target.value = '';
                }
                e.preventDefault();
            } else if (e.key === 'ArrowLeft' && index > 0) {
                otpInputs[index - 1].focus();
            } else if (e.key === 'ArrowRight' && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const clipboardData = e.clipboardData || window.clipboardData;
            const pastedData = clipboardData.getData('Text').trim().replace(/[^0-9]/g, '');

            if (pastedData.length === 6) {
                otpInputs.forEach((optIn, i) => {
                    optIn.value = pastedData[i];
                });
                otpInputs[5].focus();
            }
        });
    });

    const getOtpValue = () => {
        let code = '';
        otpInputs.forEach(input => {
            code += input.value.trim();
        });
        return code;
    };

    // --- 4. Timers and Progress Bar ---
    const formatTime = (totalSeconds) => {
        const safeSeconds = Math.max(0, totalSeconds);
        const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
        const seconds = String(safeSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const updateTimerUi = () => {
        const formatted = formatTime(expirySeconds);
        otpCountdownText.textContent = formatted;

        // Progress Bar
        if (progressBar) {
            const percentage = initialExpirySeconds > 0 ? (expirySeconds / initialExpirySeconds) * 100 : 0;
            progressBar.style.width = `${percentage}%`;

            if (percentage > 50) {
                progressBar.style.backgroundColor = '#28a745';
            } else if (percentage > 20) {
                progressBar.style.backgroundColor = '#ffc107';
            } else {
                progressBar.style.backgroundColor = '#dc3545';
            }
        }

        // Resend Cooldown
        if (resendCooldownSeconds > 0) {
            resendCountdownText.textContent = `(${resendCooldownSeconds}s)`;
            btnResendOtp.disabled = true;
        } else {
            resendCountdownText.textContent = '';
            btnResendOtp.disabled = false;
        }

        // Disable submit button if expired
        if (expirySeconds <= 0) {
            btnResetPassword.disabled = true;
        } else {
            btnResetPassword.disabled = false;
        }
    };

    const startTimer = () => {
        if (timerHandle) clearInterval(timerHandle);
        updateTimerUi();
        timerHandle = setInterval(() => {
            if (expirySeconds > 0) expirySeconds--;
            if (resendCooldownSeconds > 0) resendCooldownSeconds--;

            updateTimerUi();

            if (expirySeconds <= 0 && resendCooldownSeconds <= 0) {
                clearInterval(timerHandle);
            }
        }, 1000);
    };

    // Mask Identifier (email or phone)
    const maskIdentifier = (str) => {
        if (!str) return '***';
        if (str.includes('@')) {
            const parts = str.split('@');
            const local = parts[0];
            const domain = parts[1];
            if (local.length <= 2) return local[0] + '***@' + domain;
            return local[0] + '***' + local[local.length - 1] + '@' + domain;
        } else {
            // Assume phone number
            if (str.length <= 4) return '***' + str;
            return str.slice(0, 3) + '*****' + str.slice(str.length - 2);
        }
    };

    // --- 5. Step 1: Submit Identifier to Send OTP ---
    step1Form.addEventListener('submit', (e) => {
        e.preventDefault();
        userIdentifierValue = inputIdentifier.value.trim();

        if (!userIdentifierValue) {
            inputIdentifier.classList.add('is-invalid');
            return;
        }
        inputIdentifier.classList.remove('is-invalid');

        // Show spinner loading
        const btnText = btnSendOtp.querySelector('.btn-text');
        const spinner = btnSendOtp.querySelector('.spinner');
        if (btnText && spinner) {
            btnText.style.display = 'none';
            spinner.style.display = 'inline-flex';
        }
        btnSendOtp.disabled = true;

        // Simulate AJAX request
        setTimeout(() => {
            // Reset state
            if (btnText && spinner) {
                btnText.style.display = 'inline-flex';
                spinner.style.display = 'none';
            }
            btnSendOtp.disabled = false;

            // Transition step
            step1Section.classList.remove('active');
            step2Section.classList.add('active');

            // Mask identifier and show
            displayTargetText.textContent = maskIdentifier(userIdentifierValue);
            
            showToast('Mã OTP khôi phục mật khẩu đã được gửi!', 'success');

            // Initialize and start timer
            expirySeconds = 300;
            resendCooldownSeconds = 60;
            startTimer();

            // Focus first OTP field
            setTimeout(() => otpInputs[0].focus(), 300);

        }, 1500);
    });

    // --- 6. Step 2: Submit OTP & Reset Password ---
    step2Form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const otpValue = getOtpValue();
        const newPassword = newPasswordField.value;
        const confirmPassword = confirmPasswordField.value;

        // Reset errors
        otpInputs.forEach(input => input.classList.remove('is-invalid'));
        newPasswordField.classList.remove('is-invalid');
        confirmPasswordField.classList.remove('is-invalid');

        // Validation
        if (otpValue.length < 6) {
            otpInputs.forEach(input => input.classList.add('is-invalid'));
            showToast('Vui lòng nhập đủ 6 chữ số OTP.', 'warning');
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            newPasswordField.classList.add('is-invalid');
            showToast('Mật khẩu mới phải tối thiểu từ 6 ký tự.', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            confirmPasswordField.classList.add('is-invalid');
            showToast('Mật khẩu xác nhận không khớp.', 'danger');
            return;
        }

        // Show spinner loading
        const btnText = btnResetPassword.querySelector('.btn-text');
        const spinner = btnResetPassword.querySelector('.spinner');
        if (btnText && spinner) {
            btnText.style.display = 'none';
            spinner.style.display = 'inline-flex';
        }
        btnResetPassword.disabled = true;

        // Simulate AJAX request to update password
        setTimeout(() => {
            if (btnText && spinner) {
                btnText.style.display = 'inline-flex';
                spinner.style.display = 'none';
            }
            btnResetPassword.disabled = false;

            // Transition to Success Step
            step2Section.classList.remove('active');
            step3Section.classList.add('active');

            if (timerHandle) clearInterval(timerHandle);

            showToast('Mật khẩu của bạn đã được thay đổi thành công!', 'success');
        }, 1800);
    });

    // --- 7. Resend OTP Trigger ---
    btnResendOtp.addEventListener('click', (e) => {
        e.preventDefault();

        if (resendCooldownSeconds > 0) return;

        btnResendOtp.disabled = true;
        const defaultHtml = btnResendOtp.innerHTML;
        btnResendOtp.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Đang gửi...';

        setTimeout(() => {
            btnResendOtp.innerHTML = defaultHtml;
            
            // Reset inputs
            otpInputs.forEach(input => {
                input.value = '';
                input.classList.remove('is-invalid');
            });

            // Reset Timer
            expirySeconds = 300;
            resendCooldownSeconds = 60;
            startTimer();

            showToast('Mã OTP khôi phục mới đã được gửi thành công!', 'success');
            otpInputs[0].focus();
        }, 1200);
    });
});
