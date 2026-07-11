/**
 * admin-categories.js — TechSupport Viettel Admin Redesign
 * Modern CRUD management for Danh Mục Sự Cố
 */
'use strict';

/* ══════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════ */
const CAT_STORAGE_KEY  = 'viettel_categories';
const CAT_PAGE_SIZE    = 10;

/* ══════════════════════════════════════════
   STATE
   ══════════════════════════════════════════ */
let catList       = [];      // full dataset
let catFiltered   = [];      // after search/filter/sort
let catCurrentPage = 1;
let editingCatId  = null;    // null = add mode
let deletingCatId = null;

/* ══════════════════════════════════════════
   SEED DATA (shown when storage is empty)
   ══════════════════════════════════════════ */
const CAT_SEED = [
    { id: 'DM001', name: 'Internet Cáp Quang', desc: 'Hỗ trợ sự cố mạng Internet cáp quang FTTH tại nhà và văn phòng.', status: 'Hoạt động', createdAt: '2026-01-10' },
    { id: 'DM002', name: 'Camera Giám Sát',    desc: 'Hỗ trợ lắp đặt, sửa chữa camera IP và camera analog.', status: 'Hoạt động', createdAt: '2026-01-12' },
    { id: 'DM003', name: 'Truyền Hình MyTV',   desc: 'Hỗ trợ dịch vụ truyền hình số mặt đất và internet.', status: 'Tạm khóa', createdAt: '2026-01-15' },
    { id: 'DM004', name: 'Wi-Fi & Router',      desc: 'Cấu hình, khắc phục sự cố thiết bị router và Access Point.', status: 'Hoạt động', createdAt: '2026-01-20' },
    { id: 'DM005', name: 'Điện Thoại Cố Định', desc: 'Hỗ trợ lắp đặt và sửa chữa đường dây điện thoại cố định.', status: 'Hoạt động', createdAt: '2026-02-01' },
    { id: 'DM006', name: 'An Ninh Mạng',       desc: 'Tư vấn và hỗ trợ bảo mật hệ thống mạng doanh nghiệp.', status: 'Hoạt động', createdAt: '2026-02-05' },
    { id: 'DM007', name: 'Cloud & Server',      desc: 'Hỗ trợ triển khai, vận hành dịch vụ máy chủ và điện toán đám mây.', status: 'Hoạt động', createdAt: '2026-02-08' },
    { id: 'DM008', name: 'Di Động / SIM',       desc: 'Hỗ trợ sự cố thuê bao di động, SIM và chuyển đổi gói cước.', status: 'Tạm khóa', createdAt: '2026-02-10' },
];

/* ══════════════════════════════════════════
   STORAGE
   ══════════════════════════════════════════ */
function loadCategories() {
    try {
        const raw = localStorage.getItem(CAT_STORAGE_KEY);
        catList = raw ? JSON.parse(raw) : [...CAT_SEED];
        // Also seed if stored array is empty
        if (!catList.length) {
            catList = [...CAT_SEED];
            saveCategories();
        } else if (!raw) {
            saveCategories();
        }
    } catch {
        catList = [...CAT_SEED];
    }
}


function saveCategories() {
    localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(catList));
}

/* ── Generate next ID ── */
function nextCatId() {
    if (!catList.length) return 'DM001';
    const nums = catList
        .map(c => parseInt(c.id.replace(/\D/g, ''), 10))
        .filter(n => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return 'DM' + String(max + 1).padStart(3, '0');
}

/* ══════════════════════════════════════════
   FILTER + SEARCH + SORT
   ══════════════════════════════════════════ */
function applyFilter() {
    const q      = (document.getElementById('catSearchInput')?.value || '').trim().toLowerCase();
    const status = document.getElementById('catStatusFilter')?.value || '';
    const sortVal = document.getElementById('catSortFilter')?.value || 'newest';

    catFiltered = catList.filter(c => {
        const matchQ = !q ||
            c.name.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q) ||
            (c.desc || '').toLowerCase().includes(q);
        const matchS = !status || c.status === status;
        return matchQ && matchS;
    });

    // Sorting
    if (sortVal === 'newest') {
        catFiltered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortVal === 'oldest') {
        catFiltered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortVal === 'az') {
        catFiltered.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } else if (sortVal === 'za') {
        catFiltered.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
    }

    catCurrentPage = 1;
    renderTable();
    renderPagination();
    updateStats();
}

/* ══════════════════════════════════════════
   STATS
   ══════════════════════════════════════════ */
function updateStats() {
    const total    = catList.length;
    const active   = catList.filter(c => c.status === 'Hoạt động').length;
    const inactive = catList.filter(c => c.status === 'Tạm khóa').length;
    
    // Count categories created in the current month (June 2026)
    const currentYM = new Date().toISOString().slice(0, 7); // "2026-06"
    const newThisMonth = catList.filter(c => c.createdAt && c.createdAt.startsWith(currentYM)).length;

    setText('statTotal',    total);
    setText('statActive',   active);
    setText('statInactive', inactive);
    setText('statNewThisMonth', newThisMonth);
    setText('catCount',     total);

    // Table meta info
    const start = catFiltered.length ? (catCurrentPage - 1) * CAT_PAGE_SIZE + 1 : 0;
    const end   = Math.min(catCurrentPage * CAT_PAGE_SIZE, catFiltered.length);
    setText('catTableMeta', `Đang hiển thị ${start}–${end} trên ${catFiltered.length} danh mục`);
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

/* ══════════════════════════════════════════
   RENDER TABLE (Desktop & Mobile)
   ══════════════════════════════════════════ */
function renderTable() {
    const tbody = document.getElementById('categoriesBody');
    const mContainer = document.getElementById('categoriesMobileContainer');
    if (!tbody || !mContainer) return;

    const start = (catCurrentPage - 1) * CAT_PAGE_SIZE;
    const page  = catFiltered.slice(start, start + CAT_PAGE_SIZE);

    if (!page.length) {
        const emptyHtml = `
            <div style="text-align: center; padding: 48px 20px;">
                <div style="width: 64px; height: 64px; border-radius: 50%; background-color: var(--vt-red-glow); color: var(--vt-red); display: inline-flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 12px;">
                    <i class="fa-solid fa-folder-open"></i>
                </div>
                <h6 style="font-weight: 700; margin-bottom: 4px; color: var(--text-main);">Không tìm thấy danh mục</h6>
                <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
            </div>`;
        tbody.innerHTML = `<tr><td colspan="7">${emptyHtml}</td></tr>`;
        mContainer.innerHTML = emptyHtml;
        return;
    }

    // Render Desktop Rows
    const rows = page.map((c, i) => {
        const rowNum = start + i + 1;
        const isActive = c.status === 'Hoạt động';
        return `
        <tr>
            <td style="color: var(--text-muted); font-weight: 600; font-size: 0.8rem;">${rowNum}</td>
            <td><span class="vt-id-tag">${escHtml(c.id)}</span></td>
            <td>
                <div class="vt-cat-name-group">
                    <div class="vt-cat-avatar"><i class="fa-solid fa-layer-group"></i></div>
                    <span class="vt-cat-name">${escHtml(c.name)}</span>
                </div>
            </td>
            <td>
                <div class="vt-cat-desc" title="${escHtml(c.desc || '')}">${escHtml(c.desc || '—')}</div>
            </td>
            <td>
                <span class="vt-badge ${isActive ? 'active' : 'locked'}">
                    <i class="fa-solid ${isActive ? 'fa-circle-check' : 'fa-circle-pause'}"></i>
                    ${escHtml(c.status)}
                </span>
            </td>
            <td>
                <span style="font-size: 0.82rem; color: var(--text-muted);"><i class="fa-regular fa-calendar me-1"></i>${escHtml(c.createdAt || '—')}</span>
            </td>
            <td>
                <div class="vt-action-wrap" style="justify-content: center;">
                    <button class="vt-btn-action view" data-tooltip="Chi tiết" onclick="openViewModal('${escHtml(c.id)}')">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="vt-btn-action edit" data-tooltip="Chỉnh sửa" onclick="openEditModal('${escHtml(c.id)}')">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="vt-btn-action delete" data-tooltip="Xóa" onclick="openDeleteModal('${escHtml(c.id)}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');

    tbody.innerHTML = rows;

    // Render Mobile Cards List
    const mobileCardsHtml = page.map(c => {
        const isActive = c.status === 'Hoạt động';
        return `
        <div class="vt-mobile-card">
            <div class="vt-mobile-card-header">
                <span class="vt-id-tag">${escHtml(c.id)}</span>
                <span class="vt-badge ${isActive ? 'active' : 'locked'}">
                    <i class="fa-solid ${isActive ? 'fa-circle-check' : 'fa-circle-pause'}"></i>
                    ${escHtml(c.status)}
                </span>
            </div>
            <div class="vt-mobile-card-title">${escHtml(c.name)}</div>
            <div class="vt-mobile-card-body">${escHtml(c.desc || '—')}</div>
            <div class="vt-mobile-card-meta">
                <span><i class="fa-regular fa-calendar-days me-1"></i> ${escHtml(c.createdAt || '—')}</span>
                <div class="vt-action-wrap">
                    <button class="vt-btn-action view" data-tooltip="Chi tiết" onclick="openViewModal('${escHtml(c.id)}')">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="vt-btn-action edit" data-tooltip="Sửa" onclick="openEditModal('${escHtml(c.id)}')">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="vt-btn-action delete" data-tooltip="Xóa" onclick="openDeleteModal('${escHtml(c.id)}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');

    mContainer.innerHTML = mobileCardsHtml;
}

/* ══════════════════════════════════════════
   RENDER PAGINATION
   ══════════════════════════════════════════ */
function renderPagination() {
    const totalPages = Math.max(1, Math.ceil(catFiltered.length / CAT_PAGE_SIZE));
    const wrap = document.getElementById('catPagination');
    if (!wrap) return;

    let html = `
        <button class="vt-page-btn" onclick="goPage(${catCurrentPage - 1})"
            ${catCurrentPage <= 1 ? 'disabled' : ''} title="Trang trước">
            <i class="fa-solid fa-chevron-left" style="font-size:0.7rem;"></i>
        </button>`;

    // Show at most 5 page numbers
    const range = pageRange(catCurrentPage, totalPages, 5);
    range.forEach(p => {
        if (p === '…') {
            html += `<button class="vt-page-btn" disabled>…</button>`;
        } else {
            html += `<button class="vt-page-btn ${p === catCurrentPage ? 'active' : ''}"
                onclick="goPage(${p})">${p}</button>`;
        }
    });

    html += `
        <button class="vt-page-btn" onclick="goPage(${catCurrentPage + 1})"
            ${catCurrentPage >= totalPages ? 'disabled' : ''} title="Trang sau">
            <i class="fa-solid fa-chevron-right" style="font-size:0.7rem;"></i>
        </button>`;

    wrap.innerHTML = html;
    updateStats();
}

function pageRange(current, total, maxVisible) {
    if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, current - half);
    let end   = Math.min(total, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    const pages = [];
    if (start > 1)   { pages.push(1); if (start > 2) pages.push('…'); }
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < total) { if (end < total - 1) pages.push('…'); pages.push(total); }
    return pages;
}

window.goPage = function (p) {
    const totalPages = Math.ceil(catFiltered.length / CAT_PAGE_SIZE);
    if (p < 1 || p > totalPages) return;
    catCurrentPage = p;
    renderTable();
    renderPagination();
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

/* ══════════════════════════════════════════
   ADD MODAL
   ══════════════════════════════════════════ */
window.openAddModal = function () {
    editingCatId = null;
    clearFormErrors('addModal');
    document.getElementById('addCatId').value   = nextCatId();
    document.getElementById('addCatName').value  = '';
    document.getElementById('addCatDesc').value  = '';
    document.getElementById('addCatStatus').value = 'Hoạt động';
    openModal('addModal');
    setTimeout(() => document.getElementById('addCatName').focus(), 300);
};

window.closeAddModal = function () { closeModal('addModal'); };

document.addEventListener('DOMContentLoaded', function () {
    const addForm = document.getElementById('addCatForm');
    if (addForm) {
        addForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateForm('addModal', ['addCatName', 'addCatDesc'])) return;

            const newCat = {
                id:        document.getElementById('addCatId').value.trim(),
                name:      document.getElementById('addCatName').value.trim(),
                desc:      document.getElementById('addCatDesc').value.trim(),
                status:    document.getElementById('addCatStatus').value,
                createdAt: new Date().toISOString().split('T')[0]
            };

            catList.unshift(newCat);
            saveCategories();
            applyFilter();
            closeModal('addModal');
            showToast('success', `Đã thêm danh mục <strong>${newCat.name}</strong> thành công!`);
        });
    }
});

/* ══════════════════════════════════════════
   EDIT MODAL
   ══════════════════════════════════════════ */
window.openEditModal = function (catId) {
    const cat = catList.find(c => c.id === catId);
    if (!cat) return;
    editingCatId = catId;

    clearFormErrors('editModal');
    document.getElementById('editCatId').textContent = cat.id;
    document.getElementById('editCatIdField').value = cat.id;
    document.getElementById('editCatName').value     = cat.name;
    document.getElementById('editCatDesc').value     = cat.desc || '';
    document.getElementById('editCatStatus').value   = cat.status;
    openModal('editModal');
    setTimeout(() => document.getElementById('editCatName').focus(), 300);
};

window.closeEditModal = function () { closeModal('editModal'); };

document.addEventListener('DOMContentLoaded', function () {
    const editForm = document.getElementById('editCatForm');
    if (editForm) {
        editForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateForm('editModal', ['editCatName', 'editCatDesc'])) return;
            if (!editingCatId) return;

            const idx = catList.findIndex(c => c.id === editingCatId);
            if (idx === -1) return;

            catList[idx] = {
                ...catList[idx],
                name:   document.getElementById('editCatName').value.trim(),
                desc:   document.getElementById('editCatDesc').value.trim(),
                status: document.getElementById('editCatStatus').value,
            };

            saveCategories();
            applyFilter();
            closeModal('editModal');
            showToast('success', `Đã cập nhật danh mục <strong>${catList[idx].name}</strong>!`);
            editingCatId = null;
        });
    }
});

/* ══════════════════════════════════════════
   DELETE MODAL
   ══════════════════════════════════════════ */
window.openDeleteModal = function (catId) {
    const cat = catList.find(c => c.id === catId);
    if (!cat) return;
    deletingCatId = catId;

    const nameEl = document.getElementById('deleteCatName');
    if (nameEl) nameEl.textContent = cat.name;
    openModal('deleteModal');
};

window.closeDeleteModal = function () {
    closeModal('deleteModal');
    deletingCatId = null;
};

window.confirmDelete = function () {
    if (!deletingCatId) return;
    const cat = catList.find(c => c.id === deletingCatId);
    const name = cat ? cat.name : '';
    catList = catList.filter(c => c.id !== deletingCatId);
    saveCategories();
    applyFilter();
    closeModal('deleteModal');
    showToast('error', `Đã xóa danh mục <strong>${name}</strong>.`);
    deletingCatId = null;
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

/* ── Clear error on input ── */
document.addEventListener('input', function (e) {
    if (e.target.classList.contains('vt-form-input') || e.target.classList.contains('vt-form-textarea')) {
        e.target.classList.remove('is-invalid');
        const errEl = document.getElementById(e.target.id + 'Error');
        if (errEl) errEl.style.display = 'none';
    }
});

/* ══════════════════════════════════════════
   FILTER CONTROLS
   ══════════════════════════════════════════ */
window.resetFilter = function () {
    const searchEl = document.getElementById('catSearchInput');
    const statusEl = document.getElementById('catStatusFilter');
    const sortEl   = document.getElementById('catSortFilter');
    if (searchEl) searchEl.value = '';
    if (statusEl) statusEl.value = '';
    if (sortEl)   sortEl.value = 'newest';
    applyFilter();
};

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

    // force reflow
    toast.offsetHeight;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ══════════════════════════════════════════
   VIEW DETAIL MODAL
   ══════════════════════════════════════════ */
let viewingCatId = null;

window.openViewModal = function (catId) {
    const cat = catList.find(c => c.id === catId);
    if (!cat) return;
    viewingCatId = catId;

    // Banner
    setText('viewCatName',  cat.name);
    setText('viewCatIdTag', cat.id);

    // Detail rows
    setText('viewCatId',   cat.id);
    setText('viewCatDate', cat.createdAt || 'Chưa rõ');
    setText('viewCatDesc', cat.desc || '—');

    // Status badge
    const isActive = cat.status === 'Hoạt động';
    const statusEl = document.getElementById('viewCatStatus');
    if (statusEl) {
        statusEl.innerHTML = `
            <span class="vt-badge ${isActive ? 'active' : 'locked'}">
                <i class="fa-solid ${isActive ? 'fa-circle-check' : 'fa-circle-pause'}"></i>
                ${escHtml(cat.status)}
            </span>`;
    }

    openModal('viewModal');
};

window.closeViewModal = function () {
    closeModal('viewModal');
    viewingCatId = null;
};

/** Close view modal then open edit modal directly */
window.openEditFromView = function () {
    const id = viewingCatId;
    closeModal('viewModal');
    if (id) {
        setTimeout(() => openEditModal(id), 300);
    }
};

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
   INIT
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
    loadCategories();
    applyFilter();

    // Live search
    const searchInput = document.getElementById('catSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilter);
    }

    // Status filter
    const statusFilter = document.getElementById('catStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilter);
    }

    // Sort filter
    const sortFilter = document.getElementById('catSortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', applyFilter);
    }
});
