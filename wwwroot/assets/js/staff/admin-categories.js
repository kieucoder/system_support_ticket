/**
 * admin-categories.js — TechSupport Admin
 * Server-side MVC AJAX architecture (EF Core + SQL Server)
 * ─────────────────────────────────────────────────────────
 * ALL data comes from the server via Razor / AJAX.
 * No localStorage, no seed data, no in-memory catList.
 */
'use strict';

/* ══════════════════════════════════════════
   ANTIFORGERY TOKEN HELPER
   ══════════════════════════════════════════ */
function getAntiForgeryToken() {
    const el = document.querySelector('input[name="__RequestVerificationToken"]');
    return el ? el.value : '';
}

/* ══════════════════════════════════════════
   MODAL HELPERS
   ══════════════════════════════════════════ */
function openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove('show');
    document.body.style.overflow = '';
}

// Close on backdrop click
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('vt-modal-overlay')) {
        e.target.classList.remove('show');
        document.body.style.overflow = '';
    }
});

// Close on Escape
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.vt-modal-overlay.show').forEach(m => {
            m.classList.remove('show');
        });
        document.body.style.overflow = '';
    }
});

/* ══════════════════════════════════════════
   TOAST NOTIFICATION
   ══════════════════════════════════════════ */
let toastTimer = null;

function showToast(type, msg) {
    let toast = document.getElementById('vtToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'vtToast';
        toast.className = 'vt-toast';
        document.body.appendChild(toast);
    }

    const icons = {
        success: '<i class="fa-solid fa-circle-check"></i>',
        error:   '<i class="fa-solid fa-circle-xmark"></i>',
        info:    '<i class="fa-solid fa-circle-info"></i>'
    };

    toast.className = `vt-toast ${type}`;
    toast.innerHTML = `
        <div class="vt-toast-icon">${icons[type] || icons.info}</div>
        <div class="vt-toast-message">${msg}</div>`;

    toast.offsetHeight; // force reflow
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ══════════════════════════════════════════
   FORM VALIDATION
   ══════════════════════════════════════════ */
function validateForm(fieldIds) {
    let valid = true;
    fieldIds.forEach(id => {
        const el  = document.getElementById(id);
        const err = document.getElementById(id + 'Error');
        if (!el) return;
        if (!el.value.trim()) {
            el.classList.add('is-invalid');
            if (err) err.style.display = 'flex';
            valid = false;
        } else {
            el.classList.remove('is-invalid');
            if (err) err.style.display = 'none';
        }
    });
    return valid;
}

function clearFormErrors(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.querySelectorAll('.vt-form-input, .vt-form-textarea').forEach(el => {
        el.classList.remove('is-invalid');
    });
    modal.querySelectorAll('.vt-error-msg').forEach(el => {
        el.style.display = 'none';
    });
}

// Clear error on input
document.addEventListener('input', function (e) {
    if (e.target.classList.contains('vt-form-input') || e.target.classList.contains('vt-form-textarea')) {
        e.target.classList.remove('is-invalid');
        const errEl = document.getElementById(e.target.id + 'Error');
        if (errEl) errEl.style.display = 'none';
    }
});

/* ══════════════════════════════════════════
   RELOAD TABLE PARTIAL (server-side)
   ══════════════════════════════════════════ */
function reloadTable() {
    const form   = document.getElementById('filterForm');
    const params = form ? new URLSearchParams(new FormData(form)).toString() : '';
    const url    = '/Staff/DanhSachDanhMuc?' + params + '&page=' + currentPage + '&pageSize=10';

    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(r => r.text())
        .then(html => {
            const container = document.getElementById('tableCardContainer');
            if (container) container.innerHTML = html;
        })
        .catch(() => showToast('error', 'Không thể tải danh sách.'));
}

/* ══════════════════════════════════════════
   PAGINATION (server navigate)
   ══════════════════════════════════════════ */
// Initialize from Razor-injected value so page reload keeps correct page
let currentPage = (typeof window.__catCurrentPage === 'number') ? window.__catCurrentPage : 1;

window.goPage = function (p) {
    if (p < 1) return;
    currentPage = p;
    reloadTable();
};

/* ══════════════════════════════════════════
   ADD MODAL
   ══════════════════════════════════════════ */
window.openAddModal = function () {
    clearFormErrors('addModal');
    const nameEl   = document.getElementById('addCatName');
    const descEl   = document.getElementById('addCatDesc');
    const statusEl = document.getElementById('addCatStatus');
    if (nameEl)   nameEl.value  = '';
    if (descEl)   descEl.value  = '';
    if (statusEl) statusEl.value = 'Hoạt động';
    openModal('addModal');
    setTimeout(() => { if (nameEl) nameEl.focus(); }, 300);
};

window.closeAddModal = function () { closeModal('addModal'); };

/* ══════════════════════════════════════════
   EDIT MODAL (server fetch data by ID)
   ══════════════════════════════════════════ */
window.openEditModalServer = function (id) {
    fetch('/Staff/SuaDanhMuc?id=' + id)
        .then(r => r.json())
        .then(data => {
            clearFormErrors('editModal');
            const idEl     = document.getElementById('editId');
            const idTagEl  = document.getElementById('editCatId');
            const nameEl   = document.getElementById('editCatName');
            const descEl   = document.getElementById('editCatDesc');
            const statusEl = document.getElementById('editCatStatus');

            if (idEl)     idEl.value        = data.idDanhMuc;
            if (idTagEl)  idTagEl.textContent = 'DM' + String(data.idDanhMuc).padStart(3, '0');
            if (nameEl)   nameEl.value      = data.tenDanhMuc || '';
            if (descEl)   descEl.value      = data.moTa || '';
            if (statusEl) statusEl.value    = data.trangThai || 'Hoạt động';

            openModal('editModal');
            setTimeout(() => { if (nameEl) nameEl.focus(); }, 300);
        })
        .catch(() => showToast('error', 'Không thể tải thông tin danh mục.'));
};

window.closeEditModal = function () { closeModal('editModal'); };

// Alias for backward compat
window.openEditModal = window.openEditModalServer;

/* ══════════════════════════════════════════
   VIEW MODAL (read from Razor data attrs)
   ══════════════════════════════════════════ */
window.openViewModalServer = function (id) {
    fetch('/Staff/SuaDanhMuc?id=' + id)
        .then(r => r.json())
        .then(data => {
            const isActive = data.trangThai === 'Hoạt động' || data.trangThai === 'Hoạt Động';
            const idTag    = 'DM' + String(data.idDanhMuc).padStart(3, '0');
            const dateStr  = data.ngayTao ? data.ngayTao.split('T')[0] : '—';

            setText('viewCatName',  data.tenDanhMuc || '—');
            setText('viewCatIdTag', idTag);
            setText('viewCatId',    idTag);
            setText('viewCatDate',  dateStr);
            setText('viewCatDesc',  data.moTa || '—');

            const statusEl = document.getElementById('viewCatStatus');
            if (statusEl) {
                statusEl.innerHTML = `
                    <span class="vt-badge ${isActive ? 'active' : 'locked'}">
                        <i class="fa-solid ${isActive ? 'fa-circle-check' : 'fa-circle-pause'}"></i>
                        ${escHtml(data.trangThai || '—')}
                    </span>`;
            }

            // Store current view ID for openEditFromView
            window.__viewingCatServerId = data.idDanhMuc;
            openModal('viewModal');
        })
        .catch(() => showToast('error', 'Không thể tải thông tin danh mục.'));
};

window.closeViewModal = function () {
    closeModal('viewModal');
    window.__viewingCatServerId = null;
};

window.openViewModal = window.openViewModalServer;

/** Open edit modal from within view modal */
window.openEditFromView = function () {
    const id = window.__viewingCatServerId;
    closeModal('viewModal');
    if (id) {
        setTimeout(() => window.openEditModalServer(id), 300);
    }
};

/* ══════════════════════════════════════════
   DELETE MODAL
   ══════════════════════════════════════════ */
window.openDeleteModalServer = function (id, name) {
    const nameEl  = document.getElementById('deleteCatName');
    const idField = document.getElementById('IdDanhMucXoa');
    if (nameEl)  nameEl.textContent = name || '';
    if (idField) idField.value      = id;
    openModal('deleteModal');
};

window.closeDeleteModal = function () { closeModal('deleteModal'); };
window.openDeleteModal  = window.openDeleteModalServer;

/* ══════════════════════════════════════════
   TOGGLE LOCK (AJAX)
   ══════════════════════════════════════════ */
window.toggleLockServer = function (id) {
    fetch('/Staff/KhoaDanhMuc', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'RequestVerificationToken': getAntiForgeryToken()
        },
        body: 'id=' + encodeURIComponent(id)
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            showToast('success', data.message);
            reloadTable();
        } else {
            showToast('error', data.message || 'Thao tác thất bại.');
        }
    })
    .catch(() => showToast('error', 'Không thể kết nối đến máy chủ.'));
};

/* ══════════════════════════════════════════
   ADD FORM SUBMIT (AJAX)
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
    const addForm = document.getElementById('addCatForm');
    if (addForm) {
        addForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateForm(['addCatName', 'addCatDesc'])) return;

            const formData = new FormData(addForm);
            fetch('/Staff/ThemDanhMuc', {
                method: 'POST',
                headers: { 'RequestVerificationToken': getAntiForgeryToken() },
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    closeModal('addModal');
                    showToast('success', data.message);
                    currentPage = 1;
                    reloadTable();
                    reloadStats();
                } else {
                    showToast('error', data.message || 'Thêm danh mục thất bại.');
                }
            })
            .catch(() => showToast('error', 'Không thể kết nối đến máy chủ.'));
        });
    }
});

/* ══════════════════════════════════════════
   EDIT FORM SUBMIT (AJAX)
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
    const editForm = document.getElementById('editCatForm');
    if (editForm) {
        editForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateForm(['editCatName', 'editCatDesc'])) return;

            const formData = new FormData(editForm);
            fetch('/Staff/SuaDanhMuc', {
                method: 'POST',
                headers: { 'RequestVerificationToken': getAntiForgeryToken() },
                body: formData
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    closeModal('editModal');
                    showToast('success', data.message);
                    reloadTable();
                } else {
                    showToast('error', data.message || 'Cập nhật thất bại.');
                }
            })
            .catch(() => showToast('error', 'Không thể kết nối đến máy chủ.'));
        });
    }
});

/* ══════════════════════════════════════════
   DELETE FORM SUBMIT (AJAX)
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
    const deleteForm = document.getElementById('deleteCatForm');
    if (deleteForm) {
        deleteForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const id = document.getElementById('IdDanhMucXoa')?.value;
            if (!id) return;

            fetch('/Staff/XoaDanhMuc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'RequestVerificationToken': getAntiForgeryToken()
                },
                body: 'id=' + encodeURIComponent(id)
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    closeModal('deleteModal');
                    showToast('success', data.message);
                    reloadTable();
                    reloadStats();
                } else {
                    showToast('error', data.message || 'Xóa danh mục thất bại.');
                }
            })
            .catch(() => showToast('error', 'Không thể kết nối đến máy chủ.'));
        });
    }
});

/* ══════════════════════════════════════════
   RELOAD STATS PARTIAL
   ══════════════════════════════════════════ */
function reloadStats() {
    fetch('/Staff/ThongKeDanhMuc', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(r => r.text())
        .then(html => {
            const el = document.getElementById('statsContainer');
            if (el) el.innerHTML = html;
        })
        .catch(() => {});
}

/* ══════════════════════════════════════════
   FILTER / SEARCH / RESET
   ══════════════════════════════════════════ */
window.resetFilter = function () {
    const form     = document.getElementById('filterForm');
    const searchEl = document.getElementById('catSearchInput');
    const statusEl = document.getElementById('catStatusFilter');
    const sortEl   = document.getElementById('catSortFilter');
    if (searchEl) searchEl.value = '';
    if (statusEl) statusEl.value = '';
    if (sortEl)   sortEl.value   = 'newest';
    currentPage = 1;
    // Navigate to clean URL
    window.location.href = '/Staff/QuanLyDanhMuc';
};

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
    // Wire up Reset button
    const resetBtn = document.getElementById('btnResetFilter');
    if (resetBtn) {
        resetBtn.addEventListener('click', window.resetFilter);
    }

    // TempData toast (from server-side redirect)
    if (window.__catSuccess) {
        showToast('success', window.__catSuccess);
    }
    if (window.__catError) {
        showToast('error', window.__catError);
    }
});
