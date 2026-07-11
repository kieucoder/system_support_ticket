/* ==============================================================
   FILE: assets/js/register.js
   AUTHOR: Antigravity (Senior Frontend Developer)
   DESCRIPTION: Javascript form verification for TechSupport registration.
                Synchronized validation states (is-invalid, is-valid)
                with login.js to support seamless visual consistency.
   ============================================================== */

document.addEventListener('DOMContentLoaded', function() {
    // ========== DOM ELEMENTS ==========
    const form = document.getElementById('registerForm');
    const fullnameInput = document.getElementById('fullname');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const addressInput = document.getElementById('address');
    const birthdateInput = document.getElementById('birthdate');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const agreeTermsCheckbox = document.getElementById('agreeTerms');
    const submitBtn = document.getElementById('submitBtn');

    // ========== TOGGLE PASSWORD VISIBILITY (Same as login.js) ==========
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
            } else {
                input.type = 'password';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            }
        });
    });

    // ========== VALIDATION HELPERS (Sync with login.js) ==========
    function setError(input, errorId, message) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        
        // Also highlight parent groups
        const group = input.closest('.input-group');
        if (group) {
            group.classList.add('is-invalid');
            group.classList.remove('is-valid');
        }
        
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    function setSuccess(input, errorId) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        
        const group = input.closest('.input-group');
        if (group) {
            group.classList.remove('is-invalid');
            group.classList.add('is-valid');
        }
        
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    // ========== SPECIFIC VALIDATION FUNCTIONS ==========

    // 1. Full name validation: min 5 chars, no numbers
    function validateFullname() {
        const val = fullnameInput.value.trim();
        if (val === '') {
            setError(fullnameInput, 'fullnameError', 'Vui lòng nhập họ và tên');
            return false;
        }
        if (val.length < 5) {
            setError(fullnameInput, 'fullnameError', 'Họ tên phải có ít nhất 5 ký tự');
            return false;
        }
        if (/\d/.test(val)) {
            setError(fullnameInput, 'fullnameError', 'Họ tên không được phép chứa chữ số');
            return false;
        }
        setSuccess(fullnameInput, 'fullnameError');
        return true;
    }

    // 2. Phone number validation: exactly 10 digits starting with 0
    function validatePhone() {
        const val = phoneInput.value.trim();
        if (val === '') {
            setError(phoneInput, 'phoneError', 'Vui lòng nhập số điện thoại');
            return false;
        }
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(val)) {
            setError(phoneInput, 'phoneError', 'Số điện thoại phải gồm 10 số bắt đầu bằng số 0');
            return false;
        }
        setSuccess(phoneInput, 'phoneError');
        return true;
    }

    // 3. Email validation: valid structure if entered
    function validateEmail() {
        const val = emailInput.value.trim();
        if (val === '') {
            emailInput.classList.remove('is-invalid', 'is-valid');
            const group = emailInput.closest('.input-group');
            if (group) group.classList.remove('is-invalid', 'is-valid');
            const errorElement = document.getElementById('emailError');
            if (errorElement) errorElement.style.display = 'none';
            return true;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
            setError(emailInput, 'emailError', 'Địa chỉ email không đúng định dạng');
            return false;
        }
        setSuccess(emailInput, 'emailError');
        return true;
    }

    // 4. Address validation (optional, visual status updates only)
    function validateAddress() {
        const val = addressInput.value.trim();
        if (val !== '') {
            setSuccess(addressInput, 'addressError');
        } else {
            addressInput.classList.remove('is-invalid', 'is-valid');
            const group = addressInput.closest('.input-group');
            if (group) group.classList.remove('is-invalid', 'is-valid');
        }
        return true;
    }

    // 5. Birthdate validation: check if in past if selected
    function validateBirthdate() {
        const val = birthdateInput.value;
        if (val) {
            const birthDate = new Date(val);
            const today = new Date();
            if (birthDate >= today) {
                setError(birthdateInput, 'birthdateError', 'Ngày sinh phải ở quá khứ');
                return false;
            }
            setSuccess(birthdateInput, 'birthdateError');
        } else {
            birthdateInput.classList.remove('is-invalid', 'is-valid');
            const group = birthdateInput.closest('.input-group');
            if (group) group.classList.remove('is-invalid', 'is-valid');
            const errorElement = document.getElementById('birthdateError');
            if (errorElement) errorElement.style.display = 'none';
        }
        return true;
    }

    // 6. Username validation: 5-30 chars, no accents, no whitespace
    function validateUsername() {
        const val = usernameInput.value.trim();
        if (val === '') {
            setError(usernameInput, 'usernameError', 'Vui lòng nhập tên đăng nhập');
            return false;
        }
        const usernameRegex = /^[a-zA-Z0-9_]{5,30}$/;
        if (!usernameRegex.test(val)) {
            setError(usernameInput, 'usernameError', 'Tên đăng nhập 5-30 ký tự, không dấu, không khoảng trắng (chỉ dùng chữ, số, _)');
            return false;
        }
        setSuccess(usernameInput, 'usernameError');
        return true;
    }

    // 7. Password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
    function validatePassword() {
        const val = passwordInput.value;
        if (val === '') {
            setError(passwordInput, 'passwordError', 'Vui lòng nhập mật khẩu');
            return false;
        }
        if (val.length < 8) {
            setError(passwordInput, 'passwordError', 'Mật khẩu phải có tối thiểu 8 ký tự');
            return false;
        }
        
        const hasUppercase = /[A-Z]/.test(val);
        const hasLowercase = /[a-z]/.test(val);
        const hasDigit = /\d/.test(val);
        const hasSpecialChar = /[@$!%*?&._\-#^+=()[\]{}|\\\/~`'":;]/.test(val);

        if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecialChar) {
            setError(passwordInput, 'passwordError', 'Cần ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt');
            return false;
        }
        
        setSuccess(passwordInput, 'passwordError');
        if (confirmPasswordInput.value !== '') {
            validateConfirmPassword();
        }
        return true;
    }

    // 8. Confirm password validation: identical check
    function validateConfirmPassword() {
        const passVal = passwordInput.value;
        const confirmVal = confirmPasswordInput.value;
        if (confirmVal === '') {
            setError(confirmPasswordInput, 'confirmPasswordError', 'Vui lòng nhập lại mật khẩu');
            return false;
        }
        if (passVal !== confirmVal) {
            setError(confirmPasswordInput, 'confirmPasswordError', 'Mật khẩu nhập lại không khớp');
            return false;
        }
        setSuccess(confirmPasswordInput, 'confirmPasswordError');
        return true;
    }

    // 9. Checkbox validation
    function validateAgreeTerms() {
        const checked = agreeTermsCheckbox.checked;
        const errorElement = document.getElementById('agreeTermsError');
        if (!checked) {
            agreeTermsCheckbox.classList.add('is-invalid');
            if (errorElement) errorElement.style.display = 'block';
            return false;
        }
        agreeTermsCheckbox.classList.remove('is-invalid');
        if (errorElement) errorElement.style.display = 'none';
        return true;
    }

    // ========== ATTACH REAL-TIME EVENT LISTENERS ==========
    fullnameInput.addEventListener('input', validateFullname);
    phoneInput.addEventListener('input', validatePhone);
    emailInput.addEventListener('input', validateEmail);
    addressInput.addEventListener('input', validateAddress);
    birthdateInput.addEventListener('change', validateBirthdate);
    usernameInput.addEventListener('input', validateUsername);
    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validateConfirmPassword);
    agreeTermsCheckbox.addEventListener('change', validateAgreeTerms);

    // ========== TOAST NOTIFICATIONS (Sync with login.js) ==========
    function showToast(message, type = 'success') {
        const existingToast = document.querySelector('.toast-container');
        if (existingToast) {
            existingToast.remove();
        }

        const toastContainer = document.createElement('div');
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3 toast-container';
        toastContainer.style.zIndex = '9999';

        // Apply inline styles for matching look
        const bgColor = type === 'success' ? 'bg-success' : (type === 'danger' ? 'bg-danger' : 'bg-warning');
        const icon = type === 'success' ? '✅' : (type === 'danger' ? '❌' : '⚠️');

        toastContainer.innerHTML = `
            <div class="toast align-items-center text-white ${bgColor} border-0 show" role="alert" style="display: block;">
                <div class="d-flex">
                    <div class="toast-body" style="padding: 0.75rem 1rem;">
                        ${icon} ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem;" onclick="this.closest('.toast-container').remove()">&times;</button>
                </div>
            </div>
        `;

        // Style the custom toast wrapper
        Object.assign(toastContainer.querySelector('.toast').style, {
            backgroundColor: type === 'success' ? '#198754' : (type === 'danger' ? '#dc3545' : '#ffc107'),
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            minWidth: '280px'
        });

        document.body.appendChild(toastContainer);

        // Auto destroy toast after 3 seconds
        setTimeout(() => {
            if (toastContainer) {
                toastContainer.remove();
            }
        }, 3000);
    }

    // ========== SUBMIT HANDLER ==========
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Run validation across all fields
        const isFullnameValid = validateFullname();
        const isPhoneValid = validatePhone();
        const isEmailValid = validateEmail();
        const isAddressValid = validateAddress();
        const isBirthdateValid = validateBirthdate();
        const isUsernameValid = validateUsername();
        const isPasswordValid = validatePassword();
        const isConfirmPasswordValid = validateConfirmPassword();
        const isAgreeTermsValid = validateAgreeTerms();

        const formIsValid = isFullnameValid &&
                            isPhoneValid &&
                            isEmailValid &&
                            isAddressValid &&
                            isBirthdateValid &&
                            isUsernameValid &&
                            isPasswordValid &&
                            isConfirmPasswordValid &&
                            isAgreeTermsValid;

        if (!formIsValid) {
            showToast('⚠️ Vui lòng điền đầy đủ và sửa các lỗi trong form', 'warning');
            
            // Focus first invalid element
            const firstInvalid = form.querySelector('.is-invalid');
            if (firstInvalid) {
                firstInvalid.focus();
            }
            return;
        }

        // Gather registration values
        const fullnameVal = fullnameInput.value.trim();
        const phoneVal = phoneInput.value.trim();
        const emailVal = emailInput.value.trim();
        const addressVal = addressInput.value.trim();
        const birthdateVal = birthdateInput.value;
        const usernameVal = usernameInput.value.trim();
        const passwordVal = passwordInput.value;

        // Query mock database from local storage
        const users = JSON.parse(localStorage.getItem('techsupport_users') || '[]');

        // Check duplicates
        const usernameExists = users.some(u => u.username === usernameVal);
        if (usernameExists) {
            setError(usernameInput, 'usernameError', 'Tên đăng nhập này đã được sử dụng');
            usernameInput.focus();
            showToast('❌ Tên đăng nhập đã tồn tại trong hệ thống', 'danger');
            return;
        }

        const phoneExists = users.some(u => u.phone === phoneVal);
        if (phoneExists) {
            setError(phoneInput, 'phoneError', 'Số điện thoại này đã được đăng ký sử dụng');
            phoneInput.focus();
            showToast('❌ Số điện thoại đã được đăng ký', 'danger');
            return;
        }

        if (emailVal !== '') {
            const emailExists = users.some(u => u.email === emailVal);
            if (emailExists) {
                setError(emailInput, 'emailError', 'Địa chỉ email này đã được sử dụng');
                emailInput.focus();
                showToast('❌ Email đã được đăng ký', 'danger');
                return;
            }
        }

        // Disable input elements to simulate API pending State
        const formElements = form.querySelectorAll('input, button');
        formElements.forEach(el => el.disabled = true);

        // Show spinner loader state on register button
        const btnText = submitBtn.querySelector('.btn-text');
        const spinner = submitBtn.querySelector('.spinner');
        if (btnText) btnText.style.display = 'none';
        if (spinner) spinner.style.display = 'inline-flex';

        // Prepare new user record
        const newUser = {
            fullname: fullnameVal,
            phone: phoneVal,
            email: emailVal !== '' ? emailVal : null,
            address: addressVal !== '' ? addressVal : null,
            birthdate: birthdateVal !== '' ? birthdateVal : null,
            username: usernameVal,
            password: passwordVal,
            status: 1, // Active
            createdDate: new Date().toISOString()
        };

        // Save registered user object
        users.push(newUser);
        localStorage.setItem('techsupport_users', JSON.stringify(users));

        console.log('✅ Registered successfully:', newUser);
        showToast('🎉 Đăng ký tài khoản thành công! Đang chuyển hướng...', 'success');

        // Redirect to login screen after 1.5 seconds delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    });
});
