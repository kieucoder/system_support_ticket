/**
 * admin-services.js — TechSupport Viettel Admin
 * Services CRUD, search, filter, and pagination controller via AJAX
 */
'use strict';

let currentPage = 1;
let pageSize = 10;
let selectedServiceId = null;

// Bootstrap modal instances
let addModal = null;
let editModal = null;
let viewModal = null;
let deleteModal = null;

$(document).ready(function () {
    initServicesModals();
    populateEditCategoryDropdown();
    setupEventHandlers();
});

// 1. Initialize Bootstrap Modals
function initServicesModals() {
    const addModalEl = document.getElementById('addServiceModal');
    const editModalEl = document.getElementById('editServiceModal');
    const viewModalEl = document.getElementById('viewServiceModal');
    const deleteModalEl = document.getElementById('deleteServiceModal');

    if (addModalEl) addModal = new bootstrap.Modal(addModalEl);
    if (editModalEl) editModal = new bootstrap.Modal(editModalEl);
    if (viewModalEl) viewModal = new bootstrap.Modal(viewModalEl);
    if (deleteModalEl) deleteModal = new bootstrap.Modal(deleteModalEl);
}

// 2. Populate Category dropdown inside Edit Modal
function populateEditCategoryDropdown() {
    const editCat = document.getElementById('editServiceCategory');
    if (editCat && typeof activeCategoriesList !== 'undefined') {
        let optionsHtml = '<option value="" disabled selected>-- Chọn danh mục --</option>';
        activeCategoriesList.forEach(c => {
            optionsHtml += `<option value="${c.idDanhMuc}">${c.tenDanhMuc}</option>`;
        });
        editCat.innerHTML = optionsHtml;
    }
}

// 3. Set up event handlers for forms and filters
function setupEventHandlers() {
    // Form filter submission
    $('#filterForm').on('submit', function (e) {
        e.preventDefault();
        currentPage = 1;
        applyFilters();
    });

    // Handle submit for adding service
    $('#addServiceForm').on('submit', function (e) {
        e.preventDefault();
        saveNewService();
    });

    // Handle submit for editing service
    $('#editServiceForm').on('submit', function (e) {
        e.preventDefault();
        updateServiceDetails();
    });
}

// 4. AJAX Load lists and stats
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
    currentPage = p;
    applyFilters();
};

window.changePageSize = function (size) {
    pageSize = parseInt(size, 10) || 10;
    currentPage = 1;
    applyFilters();
};

// 5. Add Service Action
window.openAddModal = function () {
    const form = document.getElementById('addServiceForm');
    if (form) {
        form.reset();
        $(form).find('.is-invalid').removeClass('is-invalid');
        $(form).find('.text-danger.field-validation-error').text('');
    }
    if (addModal) {
        addModal.show();
    }
};

function saveNewService() {
    const nameInp = $('#addServiceName');
    const catInp = $('#addServiceCategory');

    let isValid = true;

    if (!nameInp.val().trim()) {
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
                if (addModal) addModal.hide();
                showToast('success', response.message);
                applyFilters();
            } else {
                showToast('error', response.message);
            }
        },
        error: function () {
            showToast('error', 'Lỗi kết nối máy chủ. Không thể thêm dịch vụ.');
        }
    });
}

// 6. Edit Service Action
window.openEditModal = function (id) {
    selectedServiceId = id;

    $.ajax({
        url: '/Staff/SuaDichVu',
        type: 'GET',
        data: { id: id },
        success: function (service) {
            if (service) {
                $('#editServiceId').val(service.idDichVu);
                $('#editServiceName').val(service.tenDichVu);
                $('#editServiceCategory').val(service.idDanhMuc);
                $('#editServiceDesc').val(service.moTa || '');
                $('#editServiceStatus').val(service.trangThai);

                const form = document.getElementById('editServiceForm');
                if (form) {
                    $(form).find('.is-invalid').removeClass('is-invalid');
                }

                if (editModal) editModal.show();
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

    if (!nameInp.val().trim()) {
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
                if (editModal) editModal.hide();
                showToast('success', response.message);
                applyFilters();
            } else {
                showToast('error', response.message);
            }
        },
        error: function () {
            showToast('error', 'Lỗi kết nối máy chủ. Không thể chỉnh sửa dịch vụ.');
        }
    });
}

// 7. Toggle Lock/Unlock Service
window.toggleServiceStatus = function (id, currentStatus, categoryStatus) {
    $.ajax({
        url: '/Staff/KhoaDichVu',
        type: 'POST',
        data: {
            id: id,
            __RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
        },
        success: function (response) {
            if (response.success) {
                showToast('success', response.message);
                applyFilters();
            } else {
                showToast('error', response.message);
            }
        },
        error: function () {
            showToast('error', 'Lỗi kết nối khi cập nhật trạng thái.');
        }
    });
};

// 8. Delete Service Action
window.openDeleteModal = function (id) {
    selectedServiceId = id;
    if (deleteModal) {
        deleteModal.show();
    }
};

window.confirmDeleteService = function () {
    if (!selectedServiceId) return;

    $.ajax({
        url: '/Staff/XoaDichVu',
        type: 'POST',
        data: {
            id: selectedServiceId,
            __RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
        },
        success: function (response) {
            if (deleteModal) deleteModal.hide();
            if (response.success) {
                showToast('success', response.message);
            } else {
                showToast('error', response.message);
            }
            applyFilters();
        },
        error: function () {
            if (deleteModal) deleteModal.hide();
            showToast('error', 'Lỗi kết nối máy chủ. Không thể xóa dịch vụ.');
        }
    });
};

// 9. View Details Action
window.viewServiceDetail = function (id) {
    $.ajax({
        url: '/Staff/ChiTietDichVu',
        type: 'GET',
        data: { id: id },
        success: function (html) {
            const container = document.getElementById('viewServiceModal');
            if (container) {
                container.innerHTML = html;
                if (!viewModal) {
                    viewModal = new bootstrap.Modal(container);
                }
                viewModal.show();
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
