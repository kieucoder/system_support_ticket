document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const form = document.getElementById('registerForm');
    const btnSendOtp = document.getElementById('btnSendOtp');
    const agreeTerms = document.getElementById('agreeTerms');
    const agreeTermsError = document.getElementById('agreeTermsError');

    if (!form || !btnSendOtp) {
        return;
    }

    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            const targetId = button.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = button.querySelector('i');

            if (!input || !icon) {
                return;
            }

            const showPassword = input.type === 'password';
            input.type = showPassword ? 'text' : 'password';
            icon.classList.toggle('bi-eye', showPassword);
            icon.classList.toggle('bi-eye-slash', !showPassword);
        });
    });

    const showToast = (message, type = 'success') => {
        const existing = document.querySelector('.toast-container');
        if (existing) {
            existing.remove();
        }

        const colors = {
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
            <div class="toast show text-white border-0" style="background:${colors[type] || colors.success}; min-width:280px; border-radius:16px; box-shadow:0 16px 32px rgba(15,23,42,.22);">
                <div class="toast-body d-flex align-items-center justify-content-between">
                    <div>${icons[type] || icons.success}${message}</div>
                    <button type="button" class="btn-close btn-close-white ms-3" aria-label="Đóng"></button>
                </div>
            </div>`;

        wrapper.querySelector('.btn-close')?.addEventListener('click', () => wrapper.remove());
        document.body.appendChild(wrapper);
        setTimeout(() => wrapper.remove(), 4000);
    };

    const clearValidationErrors = () => {
        form.querySelectorAll('.is-invalid').forEach(input => input.classList.remove('is-invalid'));
        form.querySelectorAll('span[data-valmsg-for]').forEach(span => {
            span.textContent = '';
        });
    };

    const applyValidationErrors = errors => {
        Object.entries(errors).forEach(([key, message]) => {
            const input = form.querySelector(`[name="${key}"]`);
            const span = form.querySelector(`span[data-valmsg-for="${key}"]`);

            if (input) {
                input.classList.add('is-invalid');
            }

            if (span && message) {
                span.textContent = message;
            }
        });
    };

    const validateClientSide = () => {
        clearValidationErrors();

        const rules = [
            {
                name: 'HoTen',
                validator: value => value.trim().length > 0,
                message: 'Họ và tên không được để trống.'
            },
            {
                name: 'SoDienThoai',
                validator: value => /^(0[35789])[0-9]{8}$/.test(value.trim()),
                message: 'Số điện thoại phải đúng 10 số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.'
            },
            {
                name: 'Email',
                validator: value => /^[^\s@@]+@[^\s@@]+\.[^\s@@]+$/.test(value.trim()),
                message: 'Email không đúng định dạng.'
            },
            {
                name: 'TenDangNhap',
                validator: value => /^[a-zA-Z0-9._]{4,50}$/.test(value.trim()),
                message: 'Tên đăng nhập phải từ 4 đến 50 ký tự và chỉ gồm chữ, số, dấu chấm, dấu gạch dưới.'
            },
            {
                name: 'MatKhau',
                validator: value => value.length >= 8,
                message: 'Mật khẩu phải có ít nhất 8 ký tự.'
            },
            {
                name: 'XacNhanMatKhau',
                validator: value => value === (form.querySelector('[name="MatKhau"]')?.value ?? ''),
                message: 'Mật khẩu xác nhận không khớp.'
            }
        ];

        let valid = true;
        rules.forEach(rule => {
            const input = form.querySelector(`[name="${rule.name}"]`);
            const span = form.querySelector(`span[data-valmsg-for="${rule.name}"]`);
            const value = input?.value ?? '';

            if (!rule.validator(value)) {
                valid = false;
                input?.classList.add('is-invalid');
                if (span) {
                    span.textContent = rule.message;
                }
            }
        });

        return valid;
    };

    const setLoadingState = isLoading => {
        btnSendOtp.disabled = isLoading;
        const text = btnSendOtp.querySelector('.btn-text');
        const spinner = btnSendOtp.querySelector('.spinner');

        if (text) {
            text.style.display = isLoading ? 'none' : 'inline-flex';
        }

        if (spinner) {
            spinner.style.display = isLoading ? 'inline-flex' : 'none';
        }
    };

    agreeTerms?.addEventListener('change', () => {
        if (agreeTerms.checked) {
            agreeTermsError.style.display = 'none';
        }
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();

        if (!agreeTerms?.checked) {
            agreeTermsError.style.display = 'block';
            showToast('Vui lòng đồng ý với điều khoản sử dụng.', 'warning');
            return;
        }

        agreeTermsError.style.display = 'none';

        if (!validateClientSide()) {
            showToast('Vui lòng kiểm tra lại thông tin đăng ký.', 'warning');
            return;
        }

        setLoadingState(true);

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            if (result.success) {
                showToast(result.message || 'OTP đã được gửi thành công.', 'success');
                setTimeout(() => {
                    window.location.href = result.redirectUrl || '/Auth/NhapOtp';
                }, 500);
                return;
            }

            setLoadingState(false);
            if (result.errors) {
                applyValidationErrors(result.errors);
                showToast('Vui lòng sửa các lỗi trên biểu mẫu.', 'warning');
                return;
            }

            showToast(result.message || 'Không thể gửi OTP.', 'danger');
        } catch (error) {
            console.error(error);
            setLoadingState(false);
            showToast('Lỗi kết nối khi gửi OTP. Vui lòng thử lại.', 'danger');
        }
    });
});
