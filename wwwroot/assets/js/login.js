// ============================================
// LOGIN PAGE VALIDATION - TECH SUPPORT SYSTEM
// Tích hợp với hệ thống đăng ký đã có
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const form = document.getElementById('loginForm');
    const identifierInput = document.getElementById('loginIdentifier');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // ========== TOGGLE PASSWORD VISIBILITY ==========
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
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

    // ========== LOAD REMEMBERED CREDENTIALS ==========
    function loadRememberedCredentials() {
        const remembered = localStorage.getItem('techsupport_remembered');
        if (remembered) {
            const credentials = JSON.parse(remembered);
            identifierInput.value = credentials.identifier;
            passwordInput.value = credentials.password;
            rememberMeCheckbox.checked = true;
        }
    }
    loadRememberedCredentials();

    // ========== VALIDATION FUNCTIONS ==========
    
    function validateIdentifier() {
        const value = identifierInput.value.trim();
        if (value === '') {
            setError(identifierInput, 'identifierError', 'Vui lòng nhập email hoặc số điện thoại');
            return false;
        }
        setSuccess(identifierInput, 'identifierError');
        return true;
    }

    function validatePassword() {
        const value = passwordInput.value;
        if (value === '') {
            setError(passwordInput, 'passwordError', 'Vui lòng nhập mật khẩu');
            return false;
        }
        setSuccess(passwordInput, 'passwordError');
        return true;
    }

    // Helper functions
    function setError(input, errorId, message) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    function setSuccess(input, errorId) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    // ========== REAL-TIME VALIDATION ==========
    identifierInput.addEventListener('input', validateIdentifier);
    passwordInput.addEventListener('input', validatePassword);

    // ========== CHECK LOGIN CREDENTIALS ==========
    function checkLogin(identifier, password) {
        // Get users from localStorage (from register page)
        const users = JSON.parse(localStorage.getItem('techsupport_users') || '[]');
        
        // Check if user exists by email or phone
        const user = users.find(u => 
            (u.email === identifier || u.phone === identifier) && u.password === password
        );
        
        return user;
    }

    // ========== FORM SUBMIT ==========
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const isIdentifierValid = validateIdentifier();
        const isPasswordValid = validatePassword();
        
        if (isIdentifierValid && isPasswordValid) {
            const identifier = identifierInput.value.trim();
            const password = passwordInput.value;
            
            // Check credentials
            const user = checkLogin(identifier, password);
            
            if (user) {
                // Save login session
                const sessionData = {
                    isLoggedIn: true,
                    user: {
                        fullname: user.fullname,
                        email: user.email,
                        phone: user.phone,
                        loginTime: new Date().toISOString()
                    }
                };
                sessionStorage.setItem('techsupport_session', JSON.stringify(sessionData));
                
                // Handle "Remember Me"
                if (rememberMeCheckbox.checked) {
                    localStorage.setItem('techsupport_remembered', JSON.stringify({
                        identifier: identifier,
                        password: password
                    }));
                } else {
                    localStorage.removeItem('techsupport_remembered');
                }
                
                console.log('✅ Đăng nhập thành công:', user);
                showToast('🎉 Đăng nhập thành công! Chào mừng ' + user.fullname + ' trở lại!', 'success');
                
                // Redirect to dashboard after 1.5 seconds
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showToast('❌ Email/Số điện thoại hoặc mật khẩu không đúng!', 'danger');
                passwordInput.value = '';
                passwordInput.focus();
            }
        } else {
            showToast('⚠️ Vui lòng nhập đầy đủ thông tin đăng nhập', 'danger');
        }
    });

    // ========== TOAST NOTIFICATION ==========
    function showToast(message, type = 'success') {
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast-container');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create toast element
        const toastContainer = document.createElement('div');
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3 toast-container';
        toastContainer.style.zIndex = '9999';
        
        const bgColor = type === 'success' ? 'bg-success' : (type === 'danger' ? 'bg-danger' : 'bg-warning');
        const icon = type === 'success' ? '✅' : (type === 'danger' ? '❌' : '⚠️');
        
        toastContainer.innerHTML = `
            <div class="toast align-items-center text-white ${bgColor} border-0" role="alert" data-bs-autohide="true" data-bs-delay="3000">
                <div class="d-flex">
                    <div class="toast-body">
                        ${icon} ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        document.body.appendChild(toastContainer);
        
        const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'), {
            autohide: true,
            delay: 3000
        });
        toast.show();
        
        // Remove container after hide
        toastContainer.querySelector('.toast').addEventListener('hidden.bs.toast', () => {
            toastContainer.remove();
        });
    }

    // ========== CHECK IF ALREADY LOGGED IN ==========
    function checkExistingSession() {
        const session = sessionStorage.getItem('techsupport_session');
        if (session) {
            const sessionData = JSON.parse(session);
            if (sessionData.isLoggedIn) {
                showToast('ℹ️ Bạn đã đăng nhập rồi! Chuyển hướng đến dashboard...', 'info');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }
        }
    }
    checkExistingSession();
});

// ========== RESET PASSWORD FUNCTION (GLOBAL) ==========
function sendResetPassword() {
    const email = document.getElementById('resetEmail').value.trim();
    if (!email) {
        showToast('⚠️ Vui lòng nhập email của bạn!', 'danger');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('techsupport_users') || '[]');
    const userExists = users.find(u => u.email === email);
    
    if (userExists) {
        showToast('📧 Hướng dẫn khôi phục mật khẩu đã được gửi đến email của bạn!', 'success');
        document.getElementById('resetEmail').value = '';
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
        modal.hide();
    } else {
        showToast('❌ Email không tồn tại trong hệ thống!', 'danger');
    }
}

function showToast(message, type = 'success') {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed bottom-0 end-0 p-3 toast-container';
    toastContainer.style.zIndex = '9999';
    
    const bgColor = type === 'success' ? 'bg-success' : (type === 'danger' ? 'bg-danger' : 'bg-warning');
    const icon = type === 'success' ? '✅' : (type === 'danger' ? '❌' : '⚠️');
    
    toastContainer.innerHTML = `
        <div class="toast align-items-center text-white ${bgColor} border-0" role="alert" data-bs-autohide="true" data-bs-delay="3000">
            <div class="d-flex">
                <div class="toast-body">
                    ${icon} ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    document.body.appendChild(toastContainer);
    
    const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'), {
        autohide: true,
        delay: 3000
    });
    toast.show();
    
    toastContainer.querySelector('.toast').addEventListener('hidden.bs.toast', () => {
        toastContainer.remove();
    });
}