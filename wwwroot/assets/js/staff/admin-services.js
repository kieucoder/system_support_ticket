/**
 * admin-services.js — TechSupport Viettel Admin
 * Services CRUD, search, filter, and pagination controller via AJAX
 * Built to Bootstrap 5 + ASP.NET Core MVC standards
 */
'use strict';

let currentPage = 1;
let pageSize = 5;
let selectedServiceId = null;

// Bootstrap modal instances
let addModal = null;
let editModal = null;
let viewModal = null;
let deleteModal = null;

// Initialize on Document Ready
$(document).ready(function () {
    initServicesModals();
    populateEditCategoryDropdown();
    setupEventHandlers();
    setupDelegatedEvents();
});

// Backdrop click & Escape listener for custom overlays
document.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('vt-modal-overlay')) {
        e.target.classList.remove('show');
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.vt-modal-overlay.show, .vt-modal-overlay.active').forEach(m => {
            m.classList.remove('show');
            m.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});

// 1. Initialize Bootstrap Modals safely using Bootstrap 5 API
function initServicesModals() {
    const addModalEl = document.getElementById('addServiceModal');
    const editModalEl = document.getElementById('editServiceModal');
    const deleteModalEl = document.getElementById('deleteServiceModal');

    if (addModalEl && typeof bootstrap !== 'undefined') {
        addModal = bootstrap.Modal.getOrCreateInstance(addModalEl);
    }
    if (editModalEl && typeof bootstrap !== 'undefined') {
        editModal = bootstrap.Modal.getOrCreateInstance(editModalEl);
    }
    if (deleteModalEl && typeof bootstrap !== 'undefined') {
        deleteModal = bootstrap.Modal.getOrCreateInstance(deleteModalEl);
    }
}

// Helper to open a modal safely with Bootstrap 5 or overlay
function openModalById(modalId) {
    const modalEl = document.getElementById(modalId);
    if (!modalEl) return null;

    if (modalEl.classList.contains('vt-modal-overlay')) {
        modalEl.classList.add('active');
        return modalEl;
    }

    if (typeof bootstrap !== 'undefined') {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (!modalInstance) {
            modalInstance = new bootstrap.Modal(modalEl);
        }
        modalInstance.show();
        return modalInstance;
    }
    return null;
}

// 2. Populate Category dropdown inside Edit Modal
function populateEditCategoryDropdown() {
    const editCat = document.getElementById('editServiceCategory');
    if (editCat && typeof activeCategoriesList !== 'undefined' && Array.isArray(activeCategoriesList)) {
        let optionsHtml = '<option value="" disabled>-- Chọn danh mục --</option>';
        activeCategoriesList.forEach(c => {
            optionsHtml += `<option value="${c.idDanhMuc}">${c.tenDanhMuc}</option>`;
        });
        editCat.innerHTML = optionsHtml;
    }
}

// 3. Set up form submit and filter handlers
function setupEventHandlers() {
    // Form filter submission
    $('#filterForm').off('submit').on('submit', function (e) {
        e.preventDefault();
        currentPage = 1;
        applyFilters();
    });

    // Handle submit for adding service
    $('#addServiceForm').off('submit').on('submit', function (e) {
        e.preventDefault();
        saveNewService();
    });

    // Handle submit for editing service
    $('#editServiceForm').off('submit').on('submit', function (e) {
        e.preventDefault();
        updateServiceDetails();
    });

    // Handle submit for deleting service (_XoaDichVu form)
    $('#deleteServiceForm').off('submit').on('submit', function (e) {
        e.preventDefault();
        const id = $('#IdDichVuXoa').val();
        if (!id) return;

        const token = $('input[name="__RequestVerificationToken"]').val();
        const errAlert = $('#deleteServiceErrorAlert');
        const errMsg = $('#deleteServiceErrorMessage');

        if (errAlert.length) errAlert.addClass('d-none');

        $.ajax({
            url: '/Staff/XoaDichVu',
            type: 'POST',
            data: {
                id: id,
                __RequestVerificationToken: token
            },
            success: function (response) {
                if (response.success) {
                    closeDeleteServiceModal();
                    showToast('success', response.message || 'Xóa dịch vụ thành công.');
                    applyFilters();
                } else {
                    const msg = response.message || 'Không thể xóa dịch vụ vì dịch vụ đã có phiếu hỗ trợ liên kết hoặc đang trong trạng thái bị khóa.';
                    if (errAlert.length && errMsg.length) {
                        errMsg.text(msg);
                        errAlert.removeClass('d-none');
                    }
                    showToast('error', msg);
                }
            },
            error: function () {
                const msg = 'Đã xảy ra lỗi trong quá trình xóa dịch vụ.';
                if (errAlert.length && errMsg.length) {
                    errMsg.text(msg);
                    errAlert.removeClass('d-none');
                }
                showToast('error', msg);
            }
        });
    });
}

// 4. Delegated Click Events for Dynamic Rows (DataTables / AJAX fallback)
function setupDelegatedEvents() {
    $(document).on('click', '.vt-btn-action.view, [data-action="view"]', function (e) {
        const btn = $(this).closest('[data-id]');
        const id = btn.data('id') || $(this).data('id');
        if (id && !this.hasAttribute('onclick')) {
            e.preventDefault();
            viewServiceDetail(id);
        }
    });

    $(document).on('click', '.vt-btn-action.edit, [data-action="edit"]', function (e) {
        const btn = $(this).closest('[data-id]');
        const id = btn.data('id') || $(this).data('id');
        if (id && !this.hasAttribute('onclick')) {
            e.preventDefault();
            openEditModal(id);
        }
    });

    $(document).on('click', '.vt-btn-action.lock, .vt-btn-action.unlock, [data-action="toggle-status"]', function (e) {
        const btn = $(this).closest('[data-id]');
        const id = btn.data('id') || $(this).data('id');
        const status = btn.data('status') || $(this).data('status');
        const catStatus = btn.data('cat-status') || $(this).data('cat-status');
        if (id && !this.hasAttribute('onclick')) {
            e.preventDefault();
            toggleServiceStatus(id, status, catStatus);
        }
    });

    $(document).on('click', '.vt-btn-action.delete, [data-action="delete"]', function (e) {
        const btn = $(this).closest('[data-id]');
        const id = btn.data('id') || $(this).data('id');
        const name = btn.data('name') || $(this).data('name');
        if (id && !this.hasAttribute('onclick')) {
            e.preventDefault();
            openDeleteModal(id, name);
        }
    });
}

// 5. AJAX Load lists and stats
window.applyFilters = function () {
    const keyword = $('#searchService').val() || '';
    const category = $('#filterCategory').val() || '';
    const status = $('#filterStatus').val() || '';
    const sort = $('#filterSort').val() || 'newest';

    // Load table data
    $.ajax({
        url: '/Staff/DanhSachDichVu',
        type: 'GET',
        data: {
            keyword: keyword,
            category: category,
            status: status,
            sort: sort,
            page: currentPage,
            pageSize: pageSize
        },
        success: function (html) {
            $('#tableCardContainer').html(html);
        },
        error: function () {
            showToast('error', 'Không thể tải danh sách dịch vụ.');
        }
    });

    // Load statistics dashboard
    $.ajax({
        url: '/Staff/ThongKeDichVu',
        type: 'GET',
        success: function (html) {
            $('#statsContainer').html(html);
        },
        error: function () {
            console.error('Không thể cập nhật thống kê dịch vụ.');
        }
    });
};

// Reset all filters
window.clearFilters = function () {
    $('#searchService').val('');
    $('#filterCategory').val('');
    $('#filterStatus').val('');
    $('#filterSort').val('newest');

    currentPage = 1;
    applyFilters();
    showToast('info', 'Đã đặt lại bộ lọc về mặc định.');
};

// Pagination controls
window.goPage = function (p) {
    if (!p || p < 1) return;
    currentPage = p;
    applyFilters();
};

window.changePageSize = function (size) {
    pageSize = parseInt(size, 10) || 5;
    currentPage = 1;
    applyFilters();
};

// 6. Add Service Action
window.openAddModal = function () {
    const form = document.getElementById('addServiceForm');
    if (form) {
        form.reset();
        $(form).find('.is-invalid').removeClass('is-invalid');
        $(form).find('.text-danger.field-validation-error').text('');
    }
    openModalById('addServiceModal');
};

function saveNewService() {
    const nameInp = $('#addServiceName');
    const catInp = $('#addServiceCategory');

    let isValid = true;

    if (!nameInp.val() || !nameInp.val().trim()) {
        nameInp.addClass('is-invalid');
        isValid = false;
    } else {
        nameInp.removeClass('is-invalid');
    }

    if (!catInp.val()) {
        catInp.addClass('is-invalid');
        isValid = false;
    } else {
        catInp.removeClass('is-invalid');
    }

    if (!isValid) {
        showToast('error', 'Vui lòng nhập đầy đủ các thông tin bắt buộc (*)');
        return;
    }

    $.ajax({
        url: '/Staff/ThemDichVu',
        type: 'POST',
        data: $('#addServiceForm').serialize(),
        success: function (response) {
            if (response.success) {
                const modalEl = document.getElementById('addServiceModal');
                if (modalEl && typeof bootstrap !== 'undefined') {
                    const inst = bootstrap.Modal.getInstance(modalEl);
                    if (inst) inst.hide();
                }
                showToast('success', response.message || 'Đã thêm dịch vụ mới thành công!');
                applyFilters();
            } else {
                showToast('error', response.message || 'Không thể thêm dịch vụ.');
            }
        },
        error: function () {
            showToast('error', 'Lỗi kết nối máy chủ. Không thể thêm dịch vụ.');
        }
    });
}

// 7. Edit Service Action
window.openEditModal = function (id) {
    if (!id) return;
    selectedServiceId = id;

    $.ajax({
        url: '/Staff/SuaDichVu',
        type: 'GET',
        data: { id: id },
        success: function (service) {
            if (service) {
                populateEditCategoryDropdown();

                $('#editServiceId').val(service.idDichVu);
                $('#editServiceName').val(service.tenDichVu);
                $('#editServiceCategory').val(service.idDanhMuc);
                $('#editServiceDesc').val(service.moTa || '');
                $('#editServiceStatus').val(service.trangThai);

                const form = document.getElementById('editServiceForm');
                if (form) {
                    $(form).find('.is-invalid').removeClass('is-invalid');
                }

                openModalById('editServiceModal');
            } else {
                showToast('error', 'Không tìm thấy thông tin dịch vụ này.');
            }
        },
        error: function () {
            showToast('error', 'Lỗi kết nối khi lấy chi tiết dịch vụ.');
        }
    });
};

function updateServiceDetails() {
    const nameInp = $('#editServiceName');
    const catInp = $('#editServiceCategory');

    let isValid = true;

    if (!nameInp.val() || !nameInp.val().trim()) {
        nameInp.addClass('is-invalid');
        isValid = false;
    } else {
        nameInp.removeClass('is-invalid');
    }

    if (!catInp.val()) {
        catInp.addClass('is-invalid');
        isValid = false;
    } else {
        catInp.removeClass('is-invalid');
    }

    if (!isValid) {
        showToast('error', 'Vui lòng nhập đầy đủ các thông tin bắt buộc (*)');
        return;
    }

    $.ajax({
        url: '/Staff/SuaDichVu',
        type: 'POST',
        data: $('#editServiceForm').serialize(),
        success: function (response) {
            if (response.success) {
                const modalEl = document.getElementById('editServiceModal');
                if (modalEl && typeof bootstrap !== 'undefined') {
                    const inst = bootstrap.Modal.getInstance(modalEl);
                    if (inst) inst.hide();
                }
                showToast('success', response.message || 'Đã cập nhật dịch vụ thành công!');
                applyFilters();
            } else {
                showToast('error', response.message || 'Không thể cập nhật dịch vụ.');
            }
        },
        error: function () {
            showToast('error', 'Lỗi kết nối máy chủ. Không thể chỉnh sửa dịch vụ.');
        }
    });
}

// 8. Toggle Lock/Unlock Service
window.toggleServiceStatus = function (id, currentStatus, categoryStatus) {
    if (!id) return;
    const token = $('input[name="__RequestVerificationToken"]').val();

    $.ajax({
        url: '/Staff/KhoaDichVu',
        type: 'POST',
        data: {
            id: id,
            __RequestVerificationToken: token
        },
        success: function (response) {
            if (response.success) {
                showToast('success', response.message || 'Đã cập nhật trạng thái dịch vụ!');
                applyFilters();
            } else {
                showToast('error', response.message || 'Không thể cập nhật trạng thái.');
            }
        },
        error: function () {
            showToast('error', 'Lỗi kết nối khi cập nhật trạng thái.');
        }
    });
};

// 9. Delete Service Action (Synchronized with Category Delete Modal)
window.openDeleteModalServer = function (id, name) {
    const nameEl = document.getElementById('deleteServiceName');
    const idField = document.getElementById('IdDichVuXoa');
    const errAlert = document.getElementById('deleteServiceErrorAlert');
    if (nameEl) nameEl.textContent = name || '';
    if (idField) idField.value = id;
    if (errAlert) errAlert.classList.add('d-none');

    const modalEl = document.getElementById('deleteServiceModal');
    if (modalEl) {
        modalEl.classList.add('show');
        modalEl.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (modalEl.classList.contains('modal') && typeof bootstrap !== 'undefined') {
            const inst = bootstrap.Modal.getOrCreateInstance(modalEl);
            inst.show();
        }
    }
};

window.closeDeleteServiceModal = function () {
    const modalEl = document.getElementById('deleteServiceModal');
    if (modalEl) {
        modalEl.classList.remove('show');
        modalEl.classList.remove('active');
        document.body.style.overflow = '';
        if (modalEl.classList.contains('modal') && typeof bootstrap !== 'undefined') {
            const inst = bootstrap.Modal.getInstance(modalEl);
            if (inst) inst.hide();
        }
    }
};

window.openDeleteModal = window.openDeleteModalServer;
window.closeDeleteModal = window.closeDeleteServiceModal;

// 10. View Details Action (Dynamic Modal Load)
window.viewServiceDetail = function (id) {
    if (!id) return;

    $.ajax({
        url: '/Staff/ChiTietDichVu',
        type: 'GET',
        data: { id: id },
        success: function (html) {
            let container = document.getElementById('viewModalContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'viewModalContainer';
                document.body.appendChild(container);
            }
            container.innerHTML = html;

            const modalEl = document.getElementById('viewServiceModal');
            if (modalEl) {
                const existingModal = bootstrap.Modal.getInstance(modalEl);
                if (existingModal) existingModal.dispose();

                viewModal = new bootstrap.Modal(modalEl);
                viewModal.show();
            } else {
                showToast('error', 'Không tìm thấy khung hiển thị chi tiết dịch vụ.');
            }
        },
        error: function () {
            showToast('error', 'Lỗi kết nối. Không thể xem chi tiết dịch vụ.');
        }
    });
};

// Toast message utility
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
