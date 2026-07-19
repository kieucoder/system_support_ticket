/* ==============================================================
   FILE: wwwroot/js/auth/register.js
   AUTHOR: Senior UI/UX Designer & Frontend Developer
   DESCRIPTION: Handles multi-step registration UI, Ajax validation,
                advanced 6-digit OTP input interactions, timers, and animations.
   ============================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const registerForm = document.getElementById('registerForm');
    const btnSendOtp = document.getElementById('btnSendOtp');
    const otpSection = document.getElementById('otpSection');
    const regFieldsContainer = document.getElementById('registrationFields');
    const otpValueInput = document.getElementById('otpValue');
    const displayEmailText = document.getElementById('displayEmailText');
    const btnRegister = document.getElementById('btnRegister');
    const btnResendOtp = document.getElementById('btnResendOtp');
    const resendCountdownText = document.getElementById('resendCountdownText');
    const otpCountdownText = document.getElementById('otpCountdownText');

    // State variables
    let otpSent = false;
    let resendInterval = null;
    let expiryInterval = null;
    const resendCooldownDuration = 60; // seconds
    const otpExpiryDuration = 300; // 5 minutes

    // --- 1. Ripple Effect on Buttons ---
    const addRippleEffect = (e) => {
        const button = e.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
        circle.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
        circle.classList.add('ripple');

        const ripple = button.getElementsByClassName('ripple')[0];
        if (ripple) {
            ripple.remove();
        }

        button.appendChild(circle);
    };

    const buttons = document.querySelectorAll('.btn-primary-custom, .btn-otp-resend');
    buttons.forEach(button => {
        button.addEventListener('click', addRippleEffect);
    });

    // --- 2. Toggle Password Visibility ---
    const togglePasswordButtons = document.querySelectorAll('.btn-toggle-password');
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

    // --- 3. Toast Notifications ---
    const showToast = (message, type = 'success') => {
        let container = document.querySelector('.toast-premium-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-premium-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast-premium ${type}`;
        
        let iconClass = 'bi-check-circle-fill';
        if (type === 'error') iconClass = 'bi-exclamation-triangle-fill';
        if (type === 'warning') iconClass = 'bi-exclamation-circle-fill';

        toast.innerHTML = `
            <i class="toast-icon bi ${iconClass}"></i>
            <div class="toast-content">${message}</div>
            <button class="toast-close" aria-label="Close"><i class="bi bi-x"></i></button>
        `;

        container.appendChild(toast);

        // Bind close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        });

        // Auto remove
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.transform = 'translateX(120%)';
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    };

    // --- 4. Alert in Form ---
    const showFormAlert = (message, type = 'error') => {
        let alertBox = document.getElementById('formAlertBox');
        if (!alertBox) {
            alertBox = document.createElement('div');
            alertBox.id = 'formAlertBox';
            alertBox.style.cssText = 'margin-bottom:12px;padding:10px 14px;border-radius:8px;font-size:0.875rem;display:flex;align-items:flex-start;gap:8px;';

            // Chèn vào đầu form — an toàn hơn vì không phụ thuộc vào .form-header
            const form = document.getElementById('registerForm');
            if (form) {
                form.insertBefore(alertBox, form.firstChild);
            } else {
                document.body.appendChild(alertBox);
            }
        }

        let iconClass = 'bi-check-circle-fill';
        let bgColor   = '#d1fae5'; // green
        let textColor = '#065f46';
        if (type === 'error') {
            iconClass = 'bi-exclamation-triangle-fill';
            bgColor   = '#fee2e2';
            textColor = '#991b1b';
        } else if (type === 'warning') {
            iconClass = 'bi-exclamation-circle-fill';
            bgColor   = '#fef9c3';
            textColor = '#713f12';
        }

        alertBox.style.background = bgColor;
        alertBox.style.color      = textColor;
        alertBox.innerHTML = `<i class="bi ${iconClass}" style="margin-top:2px;flex-shrink:0"></i><div>${message}</div>`;
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    const clearFormAlert = () => {
        const alertBox = document.getElementById('formAlertBox');
        if (alertBox) {
            alertBox.remove();
        }
    };

    // --- 5. Custom Client Validation ---
    const showInputError = (inputElement, errorMessage) => {
        if (!inputElement) return;
        inputElement.classList.add('input-validation-error');
        
        let parentGroup = inputElement.closest('.form-group');
        if (parentGroup) {
            let errorSpan = parentGroup.querySelector('.field-validation-error');
            if (!errorSpan) {
                errorSpan = document.createElement('span');
                errorSpan.className = 'field-validation-error text-danger small';
                parentGroup.appendChild(errorSpan);
            }
            errorSpan.textContent = errorMessage;
            errorSpan.style.display = 'inline-block';
        }
    };

    const clearInputError = (inputElement) => {
        if (!inputElement) return;
        inputElement.classList.remove('input-validation-error');
        let parentGroup = inputElement.closest('.form-group');
        if (parentGroup) {
            const errorSpan = parentGroup.querySelector('.field-validation-error');
            if (errorSpan) {
                errorSpan.textContent = '';
                errorSpan.style.display = 'none';
            }
        }
    };

    // --- 6. OTP Digit Box Handling ---
    const otpInputs = document.querySelectorAll('.otp-digit-input');
    
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

        // Keydown handlers for backspace and navigation
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

        // Paste action
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

    const updateMergedOtpValue = () => {
        let otpCode = '';
        otpInputs.forEach(input => {
            otpCode += input.value;
        });
        otpValueInput.value = otpCode;
    };

    // --- 7. Timers (Countdown and Resend Cooldown) ---
    const startCooldownTimer = () => {
        let timeLeft = resendCooldownDuration;
        btnResendOtp.disabled = true;
        resendCountdownText.textContent = `(${timeLeft}s)`;

        if (resendInterval) clearInterval(resendInterval);
        resendInterval = setInterval(() => {
            timeLeft--;
            resendCountdownText.textContent = `(${timeLeft}s)`;
            if (timeLeft <= 0) {
                clearInterval(resendInterval);
                btnResendOtp.disabled = false;
                resendCountdownText.textContent = '';
            }
        }, 1000);
    };

    const startExpiryTimer = () => {
        let timeLeft = otpExpiryDuration;
        updateTimerDisplay(timeLeft);

        if (expiryInterval) clearInterval(expiryInterval);
        expiryInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay(timeLeft);
            if (timeLeft <= 0) {
                clearInterval(expiryInterval);
                showFormAlert('Mã OTP của bạn đã hết hạn. Vui lòng bấm "Gửi lại OTP".', 'error');
                btnRegister.disabled = true;
            }
        }, 1000);
    };

    const updateTimerDisplay = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        const formatted = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        otpCountdownText.textContent = formatted;
    };

    // --- 8. OTP Activation Flow (Success transition) ---
    const activateOtpScreen = (emailAddress) => {
        otpSent = true;
        clearFormAlert();
        displayEmailText.textContent = emailAddress;
        
        // Hide registration fields and show OTP screen
        regFieldsContainer.classList.add('d-none');
        btnSendOtp.classList.add('d-none');
        
        otpSection.classList.remove('d-none');
        btnRegister.classList.remove('d-none');
        
        // Focus first OTP box
        setTimeout(() => otpInputs[0].focus(), 300);
        
        // Initialize Timers
        startCooldownTimer();
        startExpiryTimer();
        btnRegister.disabled = false;
    };

    // --- 9. Registration form submission (Step 1: Get OTP) ---
    registerForm.addEventListener('submit', (e) => {
        if (!otpSent) {
            e.preventDefault();
            clearFormAlert();
            
            // Client validation for checkbox terms
            const agreeCheckbox = document.getElementById('agreeTerms');
            if (agreeCheckbox && !agreeCheckbox.checked) {
                showFormAlert('Vui lòng đồng ý với điều khoản sử dụng để tiếp tục.', 'error');
                return;
            }

            // Show loading
            const btnText = btnSendOtp.querySelector('.btn-text');
            const spinner = btnSendOtp.querySelector('.spinner');
            if (btnText && spinner) {
                btnText.style.display = 'none';
                spinner.style.display = 'inline-flex';
            }
            btnSendOtp.disabled = true;

            const formData = new FormData(registerForm);

            // Fetch request to GuiOTP
            fetch(registerForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(async response => {
                // Đọc body dưới dạng text trước để tránh parse lỗi
                const rawText = await response.text();

                // Khôi phục nút ngay khi nhận được phản hồi
                if (btnText && spinner) {
                    btnText.style.display = 'inline-flex';
                    spinner.style.display = 'none';
                }
                btnSendOtp.disabled = false;

                // Kiểm tra HTTP status
                if (!response.ok) {
                    // Nếu server trả HTML lỗi 500/404, lấy title hoặc toàn bộ text
                    let serverMsg = `Lỗi máy chủ (HTTP ${response.status})`;
                    try {
                        const errJson = JSON.parse(rawText);
                        if (errJson.message) serverMsg = errJson.message;
                    } catch (_) {
                        // Lấy nội dung text ngắn gọn từ HTML lỗi
                        const match = rawText.match(/<title>(.*?)<\/title>/i);
                        if (match) serverMsg += `: ${match[1]}`;
                    }
                    showToast('❌ ' + serverMsg, 'error');
                    showFormAlert('❌ ' + serverMsg, 'error');
                    return;
                }

                // Parse JSON
                let data;
                try {
                    data = JSON.parse(rawText);
                } catch (_) {
                    showToast('❌ Phản hồi từ máy chủ không hợp lệ.', 'error');
                    showFormAlert('❌ Phản hồi từ máy chủ không hợp lệ.', 'error');
                    return;
                }

                if (data.success) {
                    const emailInput = document.getElementById('email');
                    showToast('✅ Gửi mã OTP thành công! Vui lòng kiểm tra hộp thư.', 'success');
                    activateOtpScreen(emailInput ? emailInput.value : '');
                } else {
                    // Lỗi validation field
                    if (data.errors) {
                        document.querySelectorAll('.field-validation-error').forEach(span => {
                            span.textContent = '';
                            span.style.display = 'none';
                        });
                        document.querySelectorAll('.form-input').forEach(input => input.classList.remove('input-validation-error'));

                        const errorMessages = [];
                        Object.keys(data.errors).forEach(key => {
                            const errorMsg = data.errors[key];
                            errorMessages.push(errorMsg);
                            const inputElem = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
                            if (inputElem) showInputError(inputElem, errorMsg);
                        });

                        const detailMsg = errorMessages.length > 0
                            ? 'Vui lòng kiểm tra lại thông tin nhập liệu:<br>• ' + errorMessages.join('<br>• ')
                            : 'Vui lòng kiểm tra lại thông tin nhập liệu.';
                        showFormAlert(detailMsg, 'error');
                    } else if (data.message) {
                        // Hiển thị lỗi SMTP thực tế (bao gồm thông điệp từ Gmail)
                        showToast('❌ ' + data.message, 'error');
                        showFormAlert('❌ ' + data.message, 'error');
                    } else {
                        showToast('❌ Có lỗi xảy ra. Vui lòng thử lại.', 'error');
                        showFormAlert('❌ Có lỗi xảy ra trong quá trình gửi OTP. Vui lòng kiểm tra lại.', 'error');
                    }
                }
            })
            .catch(err => {
                if (btnText && spinner) {
                    btnText.style.display = 'inline-flex';
                    spinner.style.display = 'none';
                }
                btnSendOtp.disabled = false;
                const msg = err.message || 'Hệ thống bận. Vui lòng thử lại sau ít phút.';
                showToast('❌ ' + msg, 'error');
                showFormAlert('❌ ' + msg, 'error');
            });
        } else {
            // STEP 2: Validate OTP and Register account
            e.preventDefault();
            clearFormAlert();

            if (otpValueInput.value.length < 6) {
                showFormAlert('Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số.', 'error');
                return;
            }

            // Show loading
            const btnText = btnRegister.querySelector('.btn-text');
            const spinner = btnRegister.querySelector('.spinner');
            if (btnText && spinner) {
                btnText.style.display = 'none';
                spinner.style.display = 'inline-flex';
            }
            btnRegister.disabled = true;

            const formData = new FormData(registerForm);
            
            // Post to XacNhanOtp endpoint
            fetch('/Auth/XacNhanOtp', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(async response => {
                // If it is redirected, redirect the browser to the new page
                if (response.redirected) {
                    window.location.href = response.url;
                    return;
                }
                
                const responseText = await response.text();
                
                // If the response is not JSON, it is the HTML page of NhapOtp view containing validation errors
                const parser = new DOMParser();
                const doc = parser.parseFromString(responseText, 'text/html');
                
                // Find potential error alerts
                const errorAlert = doc.querySelector('.alert-danger');
                const validationError = doc.querySelector('[asp-validation-for="Otp"]');
                const modelStateError = doc.querySelector('.validation-summary-errors');
                
                let errorMsg = 'Mã OTP không hợp lệ hoặc đã hết hạn.';
                if (errorAlert) {
                    errorMsg = errorAlert.textContent.trim();
                } else if (validationError) {
                    errorMsg = validationError.textContent.trim();
                } else if (modelStateError) {
                    errorMsg = modelStateError.textContent.trim();
                }
                
                throw new Error(errorMsg);
            })
            .catch(err => {
                // Restore button
                if (btnText && spinner) {
                    btnText.style.display = 'inline-flex';
                    spinner.style.display = 'none';
                }
                btnRegister.disabled = false;
                showFormAlert(err.message || 'Mã OTP xác thực không đúng. Vui lòng kiểm tra lại.', 'error');
            });
        }
    });

    // --- 10. Resend OTP Handling ---
    if (btnResendOtp) {
        btnResendOtp.addEventListener('click', (e) => {
            e.preventDefault();
            clearFormAlert();

            const btnText = btnResendOtp.querySelector('.btn-text');
            const spinner = btnResendOtp.querySelector('.spinner');
            if (btnText && spinner) {
                btnText.style.display = 'none';
                spinner.style.display = 'inline-flex';
            }
            btnResendOtp.disabled = true;

            const token = document.querySelector('input[name="__RequestVerificationToken"]').value;
            const formData = new FormData();
            formData.append('__RequestVerificationToken', token);

            fetch('/Auth/GuiLaiOtp', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Không thể kết nối đến máy chủ.');
                }
                return response.json();
            })
            .then(data => {
                if (btnText && spinner) {
                    btnText.style.display = 'inline-flex';
                    spinner.style.display = 'none';
                }

                if (data.success) {
                    showToast('Đã gửi lại mã OTP mới qua email thành công!', 'success');
                    
                    // Clear OTP fields
                    otpInputs.forEach(input => input.value = '');
                    otpValueInput.value = '';
                    
                    // Restart timers
                    startCooldownTimer();
                    startExpiryTimer();
                    btnRegister.disabled = false;
                } else {
                    btnResendOtp.disabled = false;
                    showFormAlert(data.message || 'Gửi lại OTP thất bại.', 'error');
                }
            })
            .catch(err => {
                if (btnText && spinner) {
                    btnText.style.display = 'inline-flex';
                    spinner.style.display = 'none';
                }
                btnResendOtp.disabled = false;
                showFormAlert(err.message || 'Không thể gửi lại mã OTP lúc này.', 'error');
            });
        });
    }
});
