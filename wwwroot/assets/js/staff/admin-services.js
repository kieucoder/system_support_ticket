/**
 * admin-services.js — TechSupport Viettel Admin
 * Services CRUD, search, filter, and pagination AJAX controller
 */
'use strict';

let currentPage = 1;
let selectedServiceId = null;

// Bootstrap modal instances
let addModal = null;
let editModal = null;
let viewModal = null;
let deleteModal = null;

/* ══════════════════════════════════════════
   INITIALIZATION
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
    initServicesDom();
    setupFilters();
});

function initServicesDom() {
    const addModalEl = document.getElementById('addServiceModal');
    const editModalEl = document.getElementById('editServiceModal');
    const viewModalEl = document.getElementById('viewServiceModal');
    const deleteModalEl = document.getElementById('deleteServiceModal');

    if (addModalEl) addModal = new bootstrap.Modal(addModalEl);
    if (editModalEl) editModal = new bootstrap.Modal(editModalEl);
    if (viewModalEl) viewModal = new bootstrap.Modal(viewModalEl);
    if (deleteModalEl) deleteModal = new bootstrap.Modal(deleteModalEl);

    // Add form validation and submission
    const addForm = document.getElementById('addServiceForm');
    if (addForm) {
        addForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveNewService();
        });
    }

    // Edit form validation and submission
    const editForm = document.getElementById('editServiceForm');
    if (editForm) {
        editForm.addEventListener('submit', function (e) {
            e.preventDefault();
            updateServiceDetails();
        });
    }

    // Animate stats counter initially
    runAnimateCounter();
}

function setupFilters() {
    const searchInp = document.getElementById('searchService');
    const catFilter = document.getElementById('filterCategory');
    const statusFilter = document.getElementById('filterStatus');
    const sortFilter = document.getElementById('filterSort');

    let debounceTimer;
    if (searchInp) {
        searchInp.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentPage = 1;
                applyFilters();
            }, 300);
        });
    }

    if (catFilter) {
        catFilter.addEventListener('change', function () {
            currentPage = 1;
            applyFilters();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', function () {
            currentPage = 1;
            applyFilters();
        });
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', function () {
            currentPage = 1;
            applyFilters();
        });
    }
}

/* ══════════════════════════════════════════
   LOAD DATA VIA FETCH
   ══════════════════════════════════════════ */
window.applyFilters = function () {
    const keyword = document.getElementById('searchService')?.value || '';
    const category = document.getElementById('filterCategory')?.value || '';
    const status = document.getElementById('filterStatus')?.value || '';
    const sort = document.getElementById('filterSort')?.value || 'newest';
    const pageSize = document.getElementById('pageSizeSelect')?.value || 10;

    const tableContainer = document.getElementById('tableCardContainer');
    if (tableContainer) {
        tableContainer.style.opacity = '0.5';
        tableContainer.style.transition = 'opacity 0.2s ease';
    }

    const url = `/Staff/DanhSachDichVu?keyword=${encodeURIComponent(keyword)}&status=${encodeURIComponent(status)}&category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}&page=${currentPage}&pageSize=${pageSize}`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Yêu cầu không thành công');
            return response.text();
        })
        .then(html => {
            if (tableContainer) {
                tableContainer.innerHTML = html;
                tableContainer.style.opacity = '1';
                // Trigger counter refresh
                updateFilteredCount();
            }
        })
        .catch(err => {
            console.error(err);
            showToast('error', 'Đã xảy ra lỗi khi tải danh sách dịch vụ');
            if (tableContainer) tableContainer.style.opacity = '1';
        });
};

function updateFilteredCount() {
    const totalCountText = document.getElementById('servicesCountText');
    const filteredCountText = document.getElementById('filteredCountText');

    const totalRecords = document.getElementById('kpiTotalServices')?.innerText || '0';
    
    // We can extract count from page select text: "bản ghi từ X - Y trong tổng số Z"
    const infoTextSpan = document.querySelector('#pageSizeSelect + span');
    if (infoTextSpan) {
        const text = infoTextSpan.innerText;
        if (totalCountText) totalCountText.innerText = `Đang hiển thị ${text.replace('bản ghi ', '')}`;
        if (filteredCountText) filteredCountText.innerText = `Hiển thị danh sách dịch vụ kỹ thuật dựa trên các điều kiện lọc.`;
    }
}

window.loadStats = function () {
    fetch('/Staff/ThongKeDichVu')
        .then(response => {
            if (!response.ok) throw new Error('Không thể tải thống kê');
            return response.text();
        })
        .then(html => {
            const statsContainer = document.getElementById('statsContainer');
            if (statsContainer) {
                statsContainer.innerHTML = html;
                runAnimateCounter();
            }
        })
        .catch(err => console.error('Lỗi tải thống kê:', err));
};

window.goPage = function (page) {
    currentPage = page;
    applyFilters();
};

window.changePageSize = function (size) {
    currentPage = 1;
    applyFilters();
};

window.clearFilters = function () {
    const searchInp = document.getElementById('searchService');
    const catFilter = document.getElementById('filterCategory');
    const statusFilter = document.getElementById('filterStatus');
    const sortFilter = document.getElementById('filterSort');

    if (searchInp) searchInp.value = '';
    if (catFilter) catFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (sortFilter) sortFilter.value = 'newest';

    currentPage = 1;
    applyFilters();
};

/* ══════════════════════════════════════════
   MODAL ACTIONS: VIEW DETAILED DATA
   ══════════════════════════════════════════ */
window.viewServiceDetail = function (id) {
    fetch(`/Staff/ChiTietDichVu/${id}`)
        .then(response => {
            if (!response.ok) throw new Error('Không thể lấy chi tiết');
            return response.text();
        })
        .then(html => {
            const modalEl = document.getElementById('viewServiceModal');
            if (modalEl) {
                modalEl.innerHTML = html;
                const bsModal = new bootstrap.Modal(modalEl);
                bsModal.show();
            }
        })
        .catch(err => {
            console.error(err);
            showToast('error', 'Lỗi không thể tải thông tin chi tiết dịch vụ');
        });
};

/* ══════════════════════════════════════════
   MODAL ACTIONS: ADD SERVICE
   ══════════════════════════════════════════ */
window.openAddModal = function () {
    document.getElementById('addServiceForm').reset();
    document.getElementById('addServiceName').classList.remove('is-invalid');
    document.getElementById('addServiceCategory').classList.remove('is-invalid');
    if (addModal) addModal.show();
};

function saveNewService() {
    const form = document.getElementById('addServiceForm');
    const nameInp = document.getElementById('addServiceName');
    const catInp = document.getElementById('addServiceCategory');

    let isValid = true;
    if (!nameInp.value.trim()) {
        nameInp.classList.add('is-invalid');
        isValid = false;
    } else {
        nameInp.classList.remove('is-invalid');
    }

    if (!catInp.value) {
        catInp.classList.add('is-invalid');
        isValid = false;
    } else {
        catInp.classList.remove('is-invalid');
    }

    if (!isValid) {
        showToast('error', 'Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
        return;
    }

    const formData = new FormData(form);

    fetch('/Staff/ThemDichVu', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (addModal) addModal.hide();
                form.reset();
                showToast('success', data.message);
                currentPage = 1;
                applyFilters();
                loadStats();
            } else {
                showToast('error', data.message);
            }
        })
        .catch(err => {
            console.error(err);
            showToast('error', 'Đã xảy ra lỗi trong quá trình lưu thông tin.');
        });
}

/* ══════════════════════════════════════════
   MODAL ACTIONS: EDIT SERVICE
   ══════════════════════════════════════════ */
window.openEditModal = function (id) {
    fetch(`/Staff/SuaDichVu/${id}`)
        .then(response => {
            if (!response.ok) throw new Error('Không tìm thấy dịch vụ');
            return response.json();
        })
        .then(data => {
            document.getElementById('editServiceId').value = data.idDichVu;
            document.getElementById('editServiceName').value = data.tenDichVu;
            document.getElementById('editServiceDesc').value = data.moTa || '';
            document.getElementById('editServiceStatus').value = data.trangThai;

            // Populate and select category
            const selectEl = document.getElementById('editServiceCategory');
            if (selectEl) {
                selectEl.innerHTML = '<option value="">-- Chọn danh mục --</option>';
                activeCategoriesList.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.idDanhMuc;
                    opt.text = c.tenDanhMuc;
                    if (c.idDanhMuc === data.idDanhMuc) {
                        opt.selected = true;
                    }
                    selectEl.appendChild(opt);
                });
            }

            document.getElementById('editServiceName').classList.remove('is-invalid');
            document.getElementById('editServiceCategory').classList.remove('is-invalid');

            if (editModal) editModal.show();
        })
        .catch(err => {
            console.error(err);
            showToast('error', 'Lỗi không thể tải thông tin dịch vụ cần sửa');
        });
};

function updateServiceDetails() {
    const form = document.getElementById('editServiceForm');
    const nameInp = document.getElementById('editServiceName');
    const catInp = document.getElementById('editServiceCategory');

    let isValid = true;
    if (!nameInp.value.trim()) {
        nameInp.classList.add('is-invalid');
        isValid = false;
    } else {
        nameInp.classList.remove('is-invalid');
    }

    if (!catInp.value) {
        catInp.classList.add('is-invalid');
        isValid = false;
    } else {
        catInp.classList.remove('is-invalid');
    }

    if (!isValid) {
        showToast('error', 'Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
        return;
    }

    const formData = new FormData(form);

    fetch('/Staff/SuaDichVu', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (editModal) editModal.hide();
                showToast('success', data.message);
                applyFilters();
                loadStats();
            } else {
                showToast('error', data.message);
            }
        })
        .catch(err => {
            console.error(err);
            showToast('error', 'Đã xảy ra lỗi trong quá trình cập nhật thông tin.');
        });
}

/* ══════════════════════════════════════════
   MODAL ACTIONS: DELETE SERVICE
   ══════════════════════════════════════════ */
window.openDeleteModal = function (id) {
    selectedServiceId = id;
    const confirmSpan = document.getElementById('deleteConfirmText');
    if (confirmSpan) {
        confirmSpan.innerHTML = `Bạn có chắc chắn muốn xóa dịch vụ hỗ trợ kỹ thuật mang số hiệu <strong>DV${String(id).padStart(3, '0')}</strong> không? Điều này sẽ ảnh hưởng tới dữ liệu thống kê liên quan.`;
    }
    if (deleteModal) deleteModal.show();
};

window.confirmDeleteService = function () {
    if (!selectedServiceId) return;

    // Get anti-forgery token from form
    const tokenInput = document.querySelector('#addServiceForm input[name="__RequestVerificationToken"]');
    const token = tokenInput ? tokenInput.value : '';

    const formData = new FormData();
    formData.append('id', selectedServiceId);
    formData.append('__RequestVerificationToken', token);

    fetch('/Staff/XoaDichVu', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (deleteModal) deleteModal.hide();
                showToast('success', data.message);
                currentPage = 1;
                applyFilters();
                loadStats();
            } else {
                showToast('error', data.message);
            }
        })
        .catch(err => {
            console.error(err);
            showToast('error', 'Lỗi xảy ra khi gửi yêu cầu xóa.');
        });
};

window.toggleServiceStatus = function (id, currentStatus, categoryStatus) {
    if (currentStatus !== 'Hoạt động' && (categoryStatus === 'Tạm khóa' || categoryStatus === 'Khóa')) {
        Swal.fire({
            title: 'Không thể kích hoạt',
            text: 'Không thể kích hoạt dịch vụ này vì danh mục thuộc dịch vụ đang bị khóa.',
            icon: 'warning',
            confirmButtonText: 'Đóng',
            confirmButtonColor: '#dc3545'
        });
        return;
    }
    const tokenInput = document.querySelector('#addServiceForm input[name="__RequestVerificationToken"]');
    const token = tokenInput ? tokenInput.value : '';

    const formData = new FormData();
    formData.append('id', id);
    formData.append('__RequestVerificationToken', token);

    fetch('/Staff/KhoaDichVu', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('success', data.message);
                applyFilters();
                loadStats();
            } else {
                if (data.isCategoryLocked) {
                    Swal.fire({
                        title: 'Không thể kích hoạt',
                        text: data.message,
                        icon: 'warning',
                        confirmButtonText: 'Đóng',
                        confirmButtonColor: '#dc3545'
                    });
                } else {
                    showToast('error', data.message);
                }
            }
        })
        .catch(err => {
            console.error(err);
            showToast('error', 'Lỗi xảy ra khi thay đổi trạng thái.');
        });
};

/* ══════════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════════ */
function formatShortDate(dateStr) {
    if (!dateStr) return '—';
    // If format is yyyy-mm-dd
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

function runAnimateCounter() {
    const counters = [
        document.getElementById('kpiTotalServices'),
        document.getElementById('kpiActiveServices'),
        document.getElementById('kpiInactiveServices'),
        document.getElementById('kpiUsedCategories')
    ];

    counters.forEach(counter => {
        if (!counter) return;
        const target = parseInt(counter.getAttribute('data-value') || '0', 10);
        let current = 0;
        const duration = 800; // ms
        const stepTime = Math.max(Math.floor(duration / (target || 1)), 15);

        const timer = setInterval(() => {
            current += Math.ceil(target / (duration / stepTime));
            if (current >= target) {
                counter.innerText = target;
                clearInterval(timer);
            } else {
                counter.innerText = current;
            }
        }, stepTime);
    });
}

/* ── Toast system ── */
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
        error: '<i class="fa-solid fa-circle-xmark"></i>',
        info: '<i class="fa-solid fa-circle-info"></i>'
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
