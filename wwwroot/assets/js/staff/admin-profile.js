/**
 * admin-profile.js — TechSupport Viettel Admin
 * Page-specific JS cho trang Tài Khoản Nhân Viên
 *
 * Phụ thuộc: dashboard.js (phải load trước)
 *
 * Chức năng:
 *  - Tab switcher (Thông tin / Đổi mật khẩu / Avatar)
 *  - URL hash #changePassword auto-switch tab
 *  - Sync banner từ localStorage profile data
 *  - Toggle hiển thị/ẩn mật khẩu (eye button)
 *  - Password strength checker + visual bar
 */
'use strict';

// ── Tab switcher ─────────────────────────────────────────────────
window.switchProfileTab = function (tabId, btnEl) {
    document.querySelectorAll('.profile-tab-panel').forEach(function (p) {
        p.classList.remove('active');
    });
    document.querySelectorAll('.profile-nav-tab').forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
    });
    document.getElementById(tabId).classList.add('active');
    btnEl.classList.add('active');
    btnEl.setAttribute('aria-selected', 'true');
};

// ── Toggle eye password ──────────────────────────────────────────
window.toggleEye = function (btn, inputId) {
    const input = document.getElementById(inputId);
    const icon  = btn.querySelector('i');
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fa-solid fa-eye';
    }
};

// ── Password strength checker ────────────────────────────────────
window.checkPasswordStrength = function (pwd) {
    const bar  = document.getElementById('pwdStrengthBar');
    const text = document.getElementById('pwdStrengthText');
    if (!bar || !text) return;

    const rules = {
        'rule-length':  pwd.length >= 8,
        'rule-upper':   /[A-Z]/.test(pwd),
        'rule-lower':   /[a-z]/.test(pwd),
        'rule-number':  /[0-9]/.test(pwd),
        'rule-special': /[!@#$%^&*]/.test(pwd)
    };

    // Cập nhật màu từng rule item
    Object.entries(rules).forEach(function ([id, pass]) {
        const el = document.getElementById(id);
        if (el) {
            el.style.color      = pass ? 'var(--color-success)' : 'var(--text-muted)';
            el.style.fontWeight = pass ? '700' : '400';
        }
    });

    const passedCount = Object.values(rules).filter(Boolean).length;
    bar.style.width   = ((passedCount / 5) * 100) + '%';

    if (!pwd) {
        bar.style.width  = '0%';
        text.textContent = '';
        return;
    }

    const levels = [
        { max: 1, color: '#EF4444', label: '🔴 Rất yếu - Hãy tăng cường bảo mật!'  },
        { max: 2, color: '#F59E0B', label: '🟡 Yếu - Chưa đủ an toàn'               },
        { max: 3, color: '#3B82F6', label: '🔵 Trung bình - Cần cải thiện thêm'     },
        { max: 4, color: '#10B981', label: '🟢 Tốt - Mật khẩu khá an toàn'         },
        { max: 5, color: '#059669', label: '✅ Rất mạnh - Mật khẩu xuất sắc!'       }
    ];
    const level = levels.find(function (l) { return passedCount <= l.max; }) || levels[4];
    bar.style.backgroundColor = level.color;
    text.textContent          = level.label;
    text.style.color          = level.color;
};

// ── DOMContentLoaded init ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

    // Auto-switch tab từ URL hash #changePassword
    if (window.location.hash === '#changePassword') {
        const btn = document.getElementById('btn-tab-password');
        if (btn) window.switchProfileTab('tab-password', btn);
    }

    // Sync banner fields từ localStorage
    const profile = JSON.parse(localStorage.getItem('viettel_profile') || '{}');
    const bannerName   = document.getElementById('bannerName');
    const bannerRole   = document.getElementById('bannerRole');
    const bannerEmail  = document.getElementById('bannerEmail');
    const bannerAvatar = document.getElementById('bannerAvatar');

    if (profile.name   && bannerName)   bannerName.textContent   = profile.name;
    if (profile.role   && bannerRole)   bannerRole.textContent   = profile.role;
    if (profile.email  && bannerEmail)  bannerEmail.innerHTML    = `<i class="fa-solid fa-envelope me-1"></i>${profile.email}`;
    if (profile.avatar && bannerAvatar && profile.avatar.startsWith('data:')) {
        bannerAvatar.src = profile.avatar;
    }

});
