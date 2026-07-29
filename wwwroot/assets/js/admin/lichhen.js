/**
 * Viettel TechSupport - Admin LichHen Management JavaScript Module
 * Handles UI interactions, tooltips, zero-reload AJAX form submissions, and dynamic table updates
 */

document.addEventListener('DOMContentLoaded', function () {
    // 1. Initialize Bootstrap Tooltips
    initTooltips();

    // 2. Filter Form Reset Button Handler
    const resetFilterBtn = document.getElementById('btnResetFilter');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const filterForm = document.getElementById('adminLichHenFilterForm');
            if (filterForm) {
                const inputs = filterForm.querySelectorAll('input[type="text"], input[type="date"], select');
                inputs.forEach(input => {
                    if (input.tagName.toLowerCase() === 'select') {
                        input.selectedIndex = 0;
                    } else {
                        input.value = '';
                    }
                });
                filterForm.submit();
            } else {
                window.location.href = '/Admin/LichHen';
            }
        });
    }

    // 3. Export Excel Handler
    const exportExcelBtn = document.getElementById('btnExportExcel');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const filterForm = document.getElementById('adminLichHenFilterForm');
            let queryParams = '';
            if (filterForm && typeof $ !== 'undefined') {
                queryParams = '?' + $(filterForm).serialize();
            } else if (filterForm) {
                const formData = new FormData(filterForm);
                queryParams = '?' + new URLSearchParams(formData).toString();
            }
            showToast('info', 'Đang tạo và tải file báo cáo Excel...');
            window.location.href = '/Admin/LichHen/XuatBaoCao' + queryParams;
        });
    }

    // 4. Intercept Modal Forms for ZERO-RELOAD AJAX Submission
    const modalForms = document.querySelectorAll('#confirmModal form, #rejectModal form, #cancelModal form, #completeModal form');
    modalForms.forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const currentForm = this;
            const modalEl = currentForm.closest('.modal');
            const submitBtn = currentForm.querySelector('button[type="submit"]');
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Đang xử lý...';
            }

            const formData = new FormData(currentForm);

            fetch(currentForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Hide Modal
                    if (modalEl && bootstrap && bootstrap.Modal) {
                        const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                        modalInstance.hide();
                    }

                    showToast('success', data.message || 'Cập nhật lịch hẹn thành công!');
                    
                    // Dynamically update UI without reload
                    if (data.idLichHen) {
                        updateTableRowUI(data.idLichHen, data);
                    }
                } else {
                    showToast('danger', data.message || 'Có lỗi xảy ra trong quá trình xử lý!');
                }
            })
            .catch(err => {
                console.error('AJAX Error:', err);
                showToast('danger', 'Lỗi kết nối máy chủ! Vui lòng thử lại.');
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = submitBtn.getAttribute('data-original-text') || submitBtn.innerHTML.replace(/<span.*span>/, '');
                }
            });
        });
    });
});

function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"], [title]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        if (bootstrap && bootstrap.Tooltip) {
            return new bootstrap.Tooltip(tooltipTriggerEl, { container: 'body' });
        }
    });
}

/**
 * Dynamic Toast Alert Notification without Page Reload
 */
function showToast(type, message) {
    let alertContainer = document.getElementById('vtAlertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'vtAlertContainer';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '20px';
        alertContainer.style.right = '20px';
        alertContainer.style.zIndex = '9999';
        alertContainer.style.minWidth = '320px';
        document.body.appendChild(alertContainer);
    }

    const alertEl = document.createElement('div');
    const isSuccess = type === 'success';
    const bgClass = isSuccess ? 'bg-success text-white' : (type === 'info' ? 'bg-info text-white' : 'bg-danger text-white');
    const iconClass = isSuccess ? 'fa-circle-check' : (type === 'info' ? 'fa-info-circle' : 'fa-triangle-exclamation');

    alertEl.className = `alert ${bgClass} alert-dismissible fade show shadow-lg border-0 rounded-3 mb-2 p-3`;
    alertEl.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fa-solid ${iconClass} fs-5 me-2"></i>
            <div class="fw-semibold">${message}</div>
            <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    alertContainer.appendChild(alertEl);

    setTimeout(() => {
        if (alertEl && alertEl.parentNode) {
            alertEl.classList.remove('show');
            setTimeout(() => alertEl.remove(), 300);
        }
    }, 4000);
}

/**
 * Dynamically updates table row status, KTV info, and action buttons without reloading page
 */
function updateTableRowUI(idLichHen, data) {
    const tableRows = document.querySelectorAll('.vt-datatable tbody tr');
    let targetRow = null;

    tableRows.forEach(row => {
        const viewBtn = row.querySelector(`a[href*="Details/${idLichHen}"]`);
        if (viewBtn) {
            targetRow = row;
        }
    });

    if (!targetRow) return;

    // 1. Update Status Badge
    const statusCell = targetRow.cells[5];
    if (statusCell && data.trangThaiCode && data.trangThaiTitle) {
        statusCell.innerHTML = `
            <span class="vt-status-pill ${data.trangThaiCode}">
                ${data.trangThaiTitle}
            </span>
        `;
    }

    // 2. Update KTV Info if provided
    const ktvCell = targetRow.cells[2];
    if (ktvCell && data.tenNhanVien) {
        ktvCell.innerHTML = `
            <div class="vt-user-cell">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(data.tenNhanVien)}&background=D71920&color=fff&bold=true&size=36" class="vt-avatar" alt="KTV Avatar" />
                <div>
                    <div class="vt-user-name">${data.tenNhanVien}</div>
                    <span class="badge bg-light text-success border font-weight-normal font-size-xs" style="font-size: 0.72rem;"><i class="fa-solid fa-check me-1"></i>Đã phân công</span>
                </div>
            </div>
        `;
    }

    // 3. Update Action Buttons dynamically according to new status
    const actionCell = targetRow.cells[6];
    if (actionCell && data.trangThaiCode) {
        let actionsHtml = `
            <div class="d-flex align-items-center justify-content-center gap-1">
                <a href="/Admin/LichHen/Details/${idLichHen}" class="btn-action-custom view" title="Xem chi tiết" data-bs-toggle="tooltip">
                    <i class="fa-solid fa-eye"></i>
                </a>
        `;

        if (data.trangThaiCode === 'ChoXacNhan') {
            actionsHtml += `
                <button type="button" class="btn-action-custom confirm" onclick="openConfirmModal(${idLichHen}, '#${idLichHen}', 0)" title="Xác nhận & Phân công" data-bs-toggle="tooltip">
                    <i class="fa-solid fa-user-check"></i>
                </button>
                <button type="button" class="btn-action-custom reject" onclick="openRejectModal(${idLichHen}, '#${idLichHen}')" title="Từ chối lịch hẹn" data-bs-toggle="tooltip">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
        } else if (data.trangThaiCode === 'DaXacNhan' || data.trangThaiCode === 'DangThucHien') {
            actionsHtml += `
                <button type="button" class="btn-action-custom complete" onclick="openCompleteModal(${idLichHen}, '#${idLichHen}')" title="Hoàn thành lịch hẹn" data-bs-toggle="tooltip">
                    <i class="fa-solid fa-check-double"></i>
                </button>
                <button type="button" class="btn-action-custom cancel" onclick="openCancelModal(${idLichHen}, '#${idLichHen}')" title="Hủy lịch hẹn" data-bs-toggle="tooltip">
                    <i class="fa-solid fa-ban"></i>
                </button>
            `;
        }

        actionsHtml += `
                <a href="/Admin/LichHen/Edit/${idLichHen}" class="btn-action-custom edit" title="Chỉnh sửa lịch hẹn" data-bs-toggle="tooltip">
                    <i class="fa-solid fa-pen-to-square"></i>
                </a>
            </div>
        `;

        actionCell.innerHTML = actionsHtml;
        initTooltips();
    }
}

/**
 * Modal helper functions called from inline onclick events
 */
function openConfirmModal(idLichHen, maPhieu, currentStaffId) {
    const inputId = document.getElementById('confirmIdLichHen');
    const inputMa = document.getElementById('confirmMaPhieu');
    const selectElem = document.getElementById('confirmIdNhanVien');

    if (inputId) inputId.value = idLichHen;
    if (inputMa) inputMa.innerText = maPhieu;
    if (selectElem && currentStaffId > 0) {
        selectElem.value = currentStaffId;
    }
    
    const modalEl = document.getElementById('confirmModal');
    if (modalEl && bootstrap && bootstrap.Modal) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modalInstance.show();
    }
}

function openRejectModal(idLichHen, maPhieu) {
    const inputId = document.getElementById('rejectIdLichHen');
    const inputMa = document.getElementById('rejectMaPhieu');

    if (inputId) inputId.value = idLichHen;
    if (inputMa) inputMa.innerText = maPhieu;

    const modalEl = document.getElementById('rejectModal');
    if (modalEl && bootstrap && bootstrap.Modal) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modalInstance.show();
    }
}

function openCancelModal(idLichHen, maPhieu) {
    const inputId = document.getElementById('cancelIdLichHen');
    const inputMa = document.getElementById('cancelMaPhieu');

    if (inputId) inputId.value = idLichHen;
    if (inputMa) inputMa.innerText = maPhieu;

    const modalEl = document.getElementById('cancelModal');
    if (modalEl && bootstrap && bootstrap.Modal) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modalInstance.show();
    }
}

function openCompleteModal(idLichHen, maPhieu) {
    const inputId = document.getElementById('completeIdLichHen');
    const inputMa = document.getElementById('completeMaPhieu');

    if (inputId) inputId.value = idLichHen;
    if (inputMa) inputMa.innerText = maPhieu;

    const modalEl = document.getElementById('completeModal');
    if (modalEl && bootstrap && bootstrap.Modal) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modalInstance.show();
    }
}
