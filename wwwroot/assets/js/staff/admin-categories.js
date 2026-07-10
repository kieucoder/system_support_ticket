/**
 * admin-categories.js — TechSupport Viettel Admin Redesign
 * Modern CRUD management for Danh Mục Sự Cố via AJAX/Fetch API
 */
'use strict';

/* ══════════════════════════════════════════
   STATE
   ══════════════════════════════════════════ */
let currentPage = 1;
let viewingCatId = null;

/* ══════════════════════════════════════════
   TABLE & STATISTICS LOADING
   ══════════════════════════════════════════ */
function loadTable(page = null) {
    if (page !== null) {
        currentPage = page;
    }
    
    const keyword = document.getElementById('catSearchInput')?.value || '';
    const status = document.getElementById('catStatusFilter')?.value || '';
    const sort = document.getElementById('catSortFilter')?.value || 'newest';

    const url = `/Staff/DanhSachDanhMuc?keyword=${encodeURIComponent(keyword)}&status=${encodeURIComponent(status)}&sort=${encodeURIComponent(sort)}&page=${currentPage}`;

    const container = document.getElementById('tableCardContainer');
    if (container) {
        container.style.opacity = '0.5';
    }

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Không thể tải dữ liệu bảng.');
            return response.text();
        })
        .then(html => {
            if (container) {
                container.style.opacity = '0';
                container.innerHTML = html;
                // Force reflow
                container.offsetHeight;
                container.style.opacity = '1';
                container.style.transition = 'opacity 0.2s ease-in-out';
            }
        })
        .catch(err => {
            console.error(err);
            showToast('error', 'Có lỗi xảy ra khi tải danh sách danh mục.');
            if (container) {
                container.style.opacity = '1';
            }
        });
}

function loadStats() {
    const totalEl = document.getElementById('statTotal');
    const activeEl = document.getElementById('statActive');
    const inactiveEl = document.getElementById('statInactive');
    const newEl = document.getElementById('statNewThisMonth');

    const oldTotal = parseInt(totalEl?.textContent) || 0;
    const oldActive = parseInt(activeEl?.textContent) || 0;
    const oldInactive = parseInt(inactiveEl?.textContent) || 0;
    const oldNewThisMonth = parseInt(newEl?.textContent) || 0;

    fetch('/Staff/ThongKeDanhMuc')
        .then(response => {
            if (!response.ok) throw new Error('Không thể tải thống kê.');
            return response.text();
        })
        .then(html => {
            const container = document.getElementById('statsContainer');
            if (container) {
                container.innerHTML = html;

                const newTotal = parseInt(document.getElementById('statTotal')?.textContent) || 0;
                const newActive = parseInt(document.getElementById('statActive')?.textContent) || 0;
                const newInactive = parseInt(document.getElementById('statInactive')?.textContent) || 0;
                const newNewThisMonth = parseInt(document.getElementById('statNewThisMonth')?.textContent) || 0;

                runAnimateCounter('statTotal', oldTotal, newTotal);
                runAnimateCounter('statActive', oldActive, newActive);
                runAnimateCounter('statInactive', oldInactive, newInactive);
                runAnimateCounter('statNewThisMonth', oldNewThisMonth, newNewThisMonth);
            }
        })
        .catch(err => {
            console.error(err);
        });
}

function runAnimateCounter(id, start, end) {
    const el = document.getElementById(id);
    if (!el) return;
    if (start === end) {
        el.textContent = end;
        return;
    }
    const duration = 400; // ms
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = progress * (2 - progress); // easeOutQuad
        const current = Math.floor(start + (end - start) * easeProgress);
        el.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = end;
        }
    }
    requestAnimationFrame(update);
}

window.goPage = function (p) {
    loadTable(p);
};

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

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

/* ══════════════════════════════════════════
   ADD MODAL
   ══════════════════════════════════════════ */
window.openAddModal = function () {
    clearFormErrors('addModal');
    const form = document.getElementById('addCatForm');
    if (form) form.reset();
    openModal('addModal');
    setTimeout(() => {
        const nameEl = document.getElementById('addCatName');
        if (nameEl) nameEl.focus();
    }, 300);
};

window.closeAddModal = function () { closeModal('addModal'); };

/* ══════════════════════════════════════════
   EDIT MODAL
   ══════════════════════════════════════════ */
window.openEditModalServer = function (id) {
    clearFormErrors('editModal');
    
    fetch(`/Staff/SuaDanhMuc?id=${id}`)
        .then(response => {
            if (!response.ok) throw new Error('Không thể kết nối đến server.');
            return response.json();
        })
        .then(data => {
            const idEl = document.getElementById('editId');
            const idVal = data.idDanhMuc !== undefined ? data.idDanhMuc : data.IdDanhMuc;
            if (idEl) idEl.value = idVal;
            
            const nameEl = document.getElementById('editCatName');
            if (nameEl) nameEl.value = data.tenDanhMuc !== undefined ? data.tenDanhMuc : data.TenDanhMuc;
            
            const descEl = document.getElementById('editCatDesc');
            if (descEl) descEl.value = data.moTa !== undefined ? data.moTa : data.MoTa;
            
            const statusEl = document.getElementById('editCatStatus');
            if (statusEl) statusEl.value = data.trangThai !== undefined ? data.trangThai : data.TrangThai;
            
            const titleIdEl = document.getElementById('editCatId');
            if (titleIdEl) titleIdEl.textContent = idVal;

            openModal('editModal');
            setTimeout(() => {
                if (nameEl) nameEl.focus();
            }, 300);
        })
        .catch(error => {
            console.error('Error fetching category data:', error);
            showToast('error', 'Không thể tải thông tin danh mục!');
        });
};

window.closeEditModal = function () { closeModal('editModal'); };

/* ══════════════════════════════════════════
   DELETE MODAL
   ══════════════════════════════════════════ */
window.openDeleteModalServer = function (id, name) {
    const nameEl = document.getElementById('deleteCatName');
    if (nameEl) nameEl.textContent = name;
    
    const inputEl = document.getElementById('IdDanhMucXoa');
    if (inputEl) inputEl.value = id;
    
    openModal('deleteModal');
};

window.closeDeleteModal = function () {
    closeModal('deleteModal');
};

/* ══════════════════════════════════════════
   LOCK / UNLOCK TOGGLE
   ══════════════════════════════════════════ */
window.toggleLockServer = function (id) {
    const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value;
    const formData = new FormData();
    formData.append('id', id);
    if (token) {
        formData.append('__RequestVerificationToken', token);
    }

    fetch('/Staff/KhoaDanhMuc', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error('Không thể kết nối đến server.');
        return response.json();
    })
    .then(res => {
        if (res.success) {
            showToast('success', res.message);
            loadTable();
            loadStats();
        } else {
            showToast('error', res.message || 'Không thể cập nhật trạng thái');
        }
    })
    .catch(err => {
        console.error(err);
        showToast('error', 'Có lỗi xảy ra khi cập nhật trạng thái.');
    });
};

/* ══════════════════════════════════════════
   VIEW DETAIL MODAL
   ══════════════════════════════════════════ */
window.openViewModalServer = function (id) {
    fetch(`/Staff/SuaDanhMuc?id=${id}`)
        .then(response => {
            if (!response.ok) throw new Error('Không thể tải thông tin.');
            return response.json();
        })
        .then(data => {
            const idVal = data.idDanhMuc !== undefined ? data.idDanhMuc : data.IdDanhMuc;
            const nameVal = data.tenDanhMuc !== undefined ? data.tenDanhMuc : data.TenDanhMuc;
            const descVal = data.moTa !== undefined ? data.moTa : data.MoTa;
            const statusVal = data.trangThai !== undefined ? data.trangThai : data.TrangThai;
            const dateVal = data.ngayTao !== undefined ? data.ngayTao : data.NgayTao;

            viewingCatId = idVal;

            setText('viewCatName',  nameVal);
            setText('viewCatIdTag', 'DM' + String(idVal).padStart(3, '0'));

            setText('viewCatId',   idVal);
            setText('viewCatDate', dateVal || 'Chưa rõ');
            setText('viewCatDesc', descVal || '—');

            const isActive = statusVal === 'Hoạt động' || statusVal === 'Hoạt Động';
            const statusEl = document.getElementById('viewCatStatus');
            if (statusEl) {
                statusEl.innerHTML = `
                    <span class="vt-badge ${isActive ? 'active' : 'locked'}">
                        <i class="fa-solid ${isActive ? 'fa-circle-check' : 'fa-circle-pause'}"></i>
                        ${escHtml(statusVal)}
                    </span>`;
            }

            openModal('viewModal');
        })
        .catch(error => {
            console.error('Error fetching category data:', error);
            showToast('error', 'Không thể tải thông tin chi tiết danh mục!');
        });
};

window.closeViewModal = function () {
    closeModal('viewModal');
    viewingCatId = null;
};

window.openEditFromView = function () {
    const id = viewingCatId;
    closeModal('viewModal');
    if (id) {
        setTimeout(() => openEditModalServer(id), 300);
    }
};

/* ══════════════════════════════════════════
   FORM VALIDATION
   ══════════════════════════════════════════ */
function validateForm(modalId, fieldIds) {
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

document.addEventListener('input', function (e) {
    if (e.target.classList.contains('vt-form-input') || e.target.classList.contains('vt-form-textarea')) {
        e.target.classList.remove('is-invalid');
        const errEl = document.getElementById(e.target.id + 'Error');
        if (errEl) errEl.style.display = 'none';
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
   ESCAPE HTML
   ══════════════════════════════════════════ */
function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* ══════════════════════════════════════════
   INIT & EVENT LISTENERS
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
    // 1. Intercept search/filter elements
    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            currentPage = 1;
            loadTable();
        });
    }

    let searchTimeout = null;
    const searchInput = document.getElementById('catSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentPage = 1;
                loadTable();
            }, 300);
        });
    }

    const statusFilter = document.getElementById('catStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function () {
            currentPage = 1;
            loadTable();
        });
    }

    const sortFilter = document.getElementById('catSortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', function () {
            currentPage = 1;
            loadTable();
        });
    }

    const btnResetFilter = document.getElementById('btnResetFilter');
    if (btnResetFilter) {
        btnResetFilter.addEventListener('click', function () {
            if (searchInput) searchInput.value = '';
            if (statusFilter) statusFilter.value = '';
            if (sortFilter) sortFilter.value = 'newest';
            currentPage = 1;
            loadTable();
        });
    }

    // 2. Intercept Form Submissions (Add, Edit, Delete)
    const addForm = document.getElementById('addCatForm');
    if (addForm) {
        addForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateForm('addModal', ['addCatName', 'addCatDesc'])) {
                return;
            }

            const formData = new FormData(addForm);
            fetch('/Staff/ThemDanhMuc', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) throw new Error('Không thể kết nối đến server.');
                return response.json();
            })
            .then(res => {
                if (res.success) {
                    closeAddModal();
                    showToast('success', res.message);
                    loadTable();
                    loadStats();
                } else {
                    showToast('error', res.message || 'Không thể thêm danh mục');
                }
            })
            .catch(err => {
                console.error(err);
                showToast('error', 'Có lỗi xảy ra trong quá trình lưu danh mục.');
            });
        });
    }

    const editForm = document.getElementById('editCatForm');
    if (editForm) {
        editForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateForm('editModal', ['editCatName', 'editCatDesc'])) {
                return;
            }

            const formData = new FormData(editForm);
            fetch('/Staff/SuaDanhMuc', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) throw new Error('Không thể kết nối đến server.');
                return response.json();
            })
            .then(res => {
                if (res.success) {
                    closeEditModal();
                    showToast('success', res.message);
                    loadTable();
                    loadStats();
                } else {
                    showToast('error', res.message || 'Không thể cập nhật danh mục');
                }
            })
            .catch(err => {
                console.error(err);
                showToast('error', 'Có lỗi xảy ra khi lưu thay đổi.');
            });
        });
    }

    const deleteForm = document.getElementById('deleteCatForm');
    if (deleteForm) {
        deleteForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(deleteForm);
            fetch('/Staff/XoaDanhMuc', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) throw new Error('Không thể kết nối đến server.');
                return response.json();
            })
            .then(res => {
                closeDeleteModal();
                if (res.success) {
                    showToast('success', res.message);
                    loadTable();
                    loadStats();
                } else {
                    showToast('error', res.message || 'Không thể xóa danh mục');
                }
            })
            .catch(err => {
                console.error(err);
                showToast('error', 'Có lỗi xảy ra khi thực hiện xóa.');
            });
        });
    }
});
