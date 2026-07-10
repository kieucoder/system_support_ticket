/* ==============================================================
   FILE: assets/js/register.js
   DESCRIPTION: AJAX form submission & validation for TechSupport registration.
                Validation rules are synchronized with DangKyViewModel.cs.
   ============================================================== */

document.addEventListener('DOMContentLoaded', function () {

    // ========== DOM ELEMENTS ==========
    var form                 = document.getElementById('registerForm');
    var fullnameInput        = document.getElementById('fullname');
    var phoneInput           = document.getElementById('phone');
    var emailInput           = document.getElementById('email');
    var usernameInput        = document.getElementById('username');
    var passwordInput        = document.getElementById('password');
    var confirmPasswordInput = document.getElementById('confirmPassword');
    var agreeTermsCheckbox   = document.getElementById('agreeTerms');
    var submitBtn            = document.getElementById('submitBtn');

    if (!form) return;

    // ========== TOGGLE PASSWORD VISIBILITY ==========
    document.querySelectorAll('.toggle-password').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            var input = document.getElementById(this.getAttribute('data-target'));
            var icon  = this.querySelector('i');
            if (!input) return;
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('bi-eye-slash', 'bi-eye');
            } else {
                input.type = 'password';
                icon.classList.replace('bi-eye', 'bi-eye-slash');
            }
        });
    });

    // ========== VALIDATION HELPERS ==========
    function setError(input, message) {
        if (!input) return;
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        // Tìm span asp-validation-for ngay sau input-group
        var wrap = input.closest('.input-group');
        var span = wrap ? wrap.nextElementSibling : input.nextElementSibling;
        if (span && span.tagName === 'SPAN') {
            span.textContent = message;
            span.style.display = 'block';
        }
    }

    function setValid(input) {
        if (!input) return;
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        var wrap = input.closest('.input-group');
        var span = wrap ? wrap.nextElementSibling : input.nextElementSibling;
        if (span && span.tagName === 'SPAN') {
            span.textContent = '';
        }
    }

    function clearState(input) {
        if (!input) return;
        input.classList.remove('is-invalid', 'is-valid');
    }

    // ========== VALIDATION (đồng bộ DangKyViewModel.cs) ==========

    function validateFullname() {
        var val = fullnameInput.value.trim();
        if (!val) { setError(fullnameInput, 'Họ tên không được để trống.'); return false; }
        if (val.length > 100) { setError(fullnameInput, 'Họ tên không được vượt quá 100 ký tự.'); return false; }
        setValid(fullnameInput);
        return true;
    }

    function validatePhone() {
        var val = phoneInput.value.trim();
        if (!val) { setError(phoneInput, 'Số điện thoại không được để trống.'); return false; }
        if (!/^0\d{9}$/.test(val)) { setError(phoneInput, 'Số điện thoại phải đủ 10 chữ số và bắt đầu bằng 0.'); return false; }
        setValid(phoneInput);
        return true;
    }

    function validateEmail() {
        var val = emailInput ? emailInput.value.trim() : '';
        if (!val) { clearState(emailInput); return true; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { setError(emailInput, 'Địa chỉ Email không hợp lệ.'); return false; }
        setValid(emailInput);
        return true;
    }

    function validateUsername() {
        var val = usernameInput.value.trim();
        if (!val) { setError(usernameInput, 'Tên đăng nhập không được để trống.'); return false; }
        if (val.length < 3 || val.length > 100) { setError(usernameInput, 'Tên đăng nhập phải từ 3 đến 100 ký tự.'); return false; }
        if (!/^[a-zA-Z0-9_]+$/.test(val)) { setError(usernameInput, 'Tên đăng nhập chỉ được chứa chữ cái, chữ số và dấu gạch dưới.'); return false; }
        setValid(usernameInput);
        return true;
    }

    function validatePassword() {
        var val = passwordInput.value;
        if (!val) { setError(passwordInput, 'Mật khẩu không được để trống.'); return false; }
        if (val.length < 6) { setError(passwordInput, 'Mật khẩu phải từ 6 ký tự trở lên.'); return false; }
        setValid(passwordInput);
        if (confirmPasswordInput && confirmPasswordInput.value !== '') validateConfirmPassword();
        return true;
    }

    function validateConfirmPassword() {
        var val = confirmPasswordInput.value;
        if (!val) { setError(confirmPasswordInput, 'Xác nhận mật khẩu không được để trống.'); return false; }
        if (val !== passwordInput.value) { setError(confirmPasswordInput, 'Mật khẩu xác nhận không khớp.'); return false; }
        setValid(confirmPasswordInput);
        return true;
    }

    function validateAgreeTerms() {
        var el = document.getElementById('agreeTermsError');
        if (!agreeTermsCheckbox.checked) {
            if (el) el.style.display = 'block';
            return false;
        }
        if (el) el.style.display = 'none';
        return true;
    }

    // ========== REAL-TIME LISTENERS ==========
    if (fullnameInput)        fullnameInput.addEventListener('blur', validateFullname);
    if (phoneInput)           phoneInput.addEventListener('blur', validatePhone);
    if (emailInput)           emailInput.addEventListener('blur', validateEmail);
    if (usernameInput)        usernameInput.addEventListener('blur', validateUsername);
    if (passwordInput)        passwordInput.addEventListener('input', validatePassword);
    if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', validateConfirmPassword);
    if (agreeTermsCheckbox)   agreeTermsCheckbox.addEventListener('change', validateAgreeTerms);

    // ========== TOAST ==========
    function showToast(message, type) {
        document.querySelectorAll('.ts-toast').forEach(function (t) { t.remove(); });
        var bg = { success: '#198754', danger: '#dc3545', warning: '#d97706' };
        var ic = { success: '✅', danger: '❌', warning: '⚠️' };
        var div = document.createElement('div');
        div.className = 'ts-toast';
        div.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;' +
            'background:' + (bg[type] || bg.warning) + ';color:#fff;' +
            'padding:14px 20px;border-radius:12px;' +
            'box-shadow:0 8px 24px rgba(0,0,0,.18);font-size:.92rem;' +
            'max-width:360px;display:flex;align-items:center;gap:10px;' +
            'animation:slideInRight .3s ease;line-height:1.4;';
        div.innerHTML = (ic[type] || '') + ' ' + message;
        document.body.appendChild(div);
        setTimeout(function () { div && div.remove(); }, 4000);
    }

    // ========== HIGHLIGHT FIELD ERROR FROM SERVER ==========
    function showServerFieldErrors(errors) {
        var map = {
            'HoTen':          fullnameInput,
            'SoDienThoai':    phoneInput,
            'Email':          emailInput,
            'TenDangNhap':    usernameInput,
            'MatKhau':        passwordInput,
            'NhapLaiMatKhau': confirmPasswordInput
        };
        Object.keys(errors).forEach(function (key) {
            var el = map[key];
            if (el && errors[key]) setError(el, errors[key]);
        });
    }

    // ========== LOADING STATE ==========
    function setLoading(loading) {
        var btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
        var spinner = submitBtn ? submitBtn.querySelector('.spinner') : null;
        if (submitBtn) submitBtn.disabled = loading;
        if (btnText) btnText.style.display = loading ? 'none' : 'inline-flex';
        if (spinner) spinner.style.display = loading ? 'inline-flex' : 'none';
    }

    // ========== FORM SUBMIT ==========
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Client-side validate
        var ok = true;
        if (!validateFullname())        ok = false;
        if (!validatePhone())           ok = false;
        if (!validateEmail())           ok = false;
        if (!validateUsername())        ok = false;
        if (!validatePassword())        ok = false;
        if (!validateConfirmPassword()) ok = false;
        if (!validateAgreeTerms())      ok = false;

        if (!ok) {
            showToast('Vui lòng kiểm tra lại thông tin trong form.', 'warning');
            var first = form.querySelector('.is-invalid');
            if (first) first.focus();
            return;
        }

        setLoading(true);

        // Lấy antiforgery token từ hidden input trong form
        var formData = new FormData(form);

        fetch('/Auth/DangKy', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(function (res) {
            // Luôn parse JSON bất kể status code
            return res.json();
        })
        .then(function (data) {
            setLoading(false);
            if (data.success) {
                showToast(data.message || 'Đăng ký tài khoản thành công! Đang chuyển hướng...', 'success');
                setTimeout(function () {
                    window.location.href = '/Auth/DangNhap';
                }, 2000);
            } else {
                if (data.errors) {
                    showServerFieldErrors(data.errors);
                    showToast('Vui lòng kiểm tra lại thông tin đã nhập.', 'danger');
                } else {
                    showToast(data.message || 'Đăng ký thất bại. Vui lòng thử lại.', 'danger');
                }
            }
        })
        .catch(function (err) {
            setLoading(false);
            console.error('[DangKy] fetch error:', err);
            showToast('Có lỗi xảy ra. Vui lòng thử lại sau.', 'danger');
        });
    });

    // ========== CSS Animation ==========
    if (!document.getElementById('ts-anim')) {
        var s = document.createElement('style');
        s.id = 'ts-anim';
        s.textContent = '@keyframes slideInRight{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}';
        document.head.appendChild(s);
    }
});
