/**
 * admin-customers.js — TechSupport Viettel Admin
 * Hỗ trợ giao diện, Client-side validation, hiển thị Modal và gọi AJAX lấy chi tiết từ Backend
 */
'use strict';

/* ══════════════════════════════════════════
   STATE & MODALS
   ══════════════════════════════════════════ */
let addCustomerModal = null;
let viewCustomerModal = null;
let ticketHistoryModal = null;
let ticketDetailsModal = null;

// Lưu trữ ID khách hàng đang mở lịch sử phiếu
window.activeHistoryCustomerId = null;

/* ══════════════════════════════════════════
   INITIALIZATION
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
    // Khởi tạo các Bootstrap Modals
    const addCustomerEl = document.getElementById('addCustomerModal');
    const viewCustomerEl = document.getElementById('viewCustomerModal');
    const ticketHistoryEl = document.getElementById('ticketHistoryModal');
    const ticketDetailsEl = document.getElementById('ticketDetailsModal');

    if (addCustomerEl) addCustomerModal = new bootstrap.Modal(addCustomerEl);
    if (viewCustomerEl) viewCustomerModal = new bootstrap.Modal(viewCustomerEl);
    if (ticketHistoryEl) ticketHistoryModal = new bootstrap.Modal(ticketHistoryEl);
    if (ticketDetailsEl) ticketDetailsModal = new bootstrap.Modal(ticketDetailsEl);

    // Kích hoạt Tooltips
    initializeTooltips();

    // Đăng ký sự kiện click cho các nút có class .btn-toggle-status
    document.addEventListener('click', function (e) {
        const toggleBtn = e.target.closest('.btn-toggle-status');
        if (toggleBtn) {
            e.preventDefault();
            const id = toggleBtn.getAttribute('data-id');
            if (id) {
                window.toggleLockStatus(id);
            }
        }
    });

    // Đăng ký sự kiện kiểm duyệt form Thêm khách hàng và gửi qua AJAX
    const addForm = document.getElementById('addCustomerForm');
    if (addForm) {
        addForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Chặn hành vi submit truyền thống của trình duyệt

            // Kiểm tra tính hợp lệ ở phía client trước
            if (!validateCustomerForm()) {
                return;
            }

            const formData = new FormData(addForm);

            fetch(addForm.action || '/Staff/ThemKhachHang', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(async response => {
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        // Thêm khách hàng thành công -> Chuyển hướng để tải lại trang chính
                        window.location.href = '/Staff/QuanLyKH';
                    } else if (data.error === "EmailDuplicate") {
                        // Email đã tồn tại -> Hiển thị SweetAlert2 dạng lỗi
                        Swal.fire({
                            icon: 'error',
                            title: 'Email đã tồn tại',
                            text: 'Email này đã được đăng ký trong hệ thống.\nVui lòng sử dụng Email khác.',
                            confirmButtonText: 'Đóng',
                            confirmButtonColor: '#EE0033'
                        });

                        // Đánh dấu đỏ cho input Email
                        const emailInp = document.getElementById('addCustomerEmail');
                        if (emailInp) {
                            emailInp.classList.add('is-invalid');
                        }
                    } else {
                        // Lỗi ModelState hoặc DB khác
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi',
                            text: data.message || 'Đã xảy ra lỗi khi thêm khách hàng.',
                            confirmButtonText: 'Đóng',
                            confirmButtonColor: '#EE0033'
                        });
                    }
                } else {
                    showToast('error', 'Yêu cầu không hợp lệ hoặc lỗi máy chủ.');
                }
            })
            .catch(error => {
                console.error("Lỗi AJAX: ", error);
                showToast('error', 'Không thể kết nối đến máy chủ.');
            });
        });
    }

    // Đăng ký sự kiện tìm kiếm thời gian thực (real-time search)
    const searchCustomerInp = document.getElementById('searchCustomer');
    if (searchCustomerInp) {
        let debounceTimer = null;
        searchCustomerInp.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                window.applyFiltersKH();
            }, 300);
        });
    }
});




/* ══════════════════════════════════════════
   SEARCH & FILTERS AJAX (REAL-TIME UPDATES)
   ══════════════════════════════════════════ */
window.applyFiltersKH = function () {
    const keyword = document.getElementById('searchCustomer')?.value.trim() || '';
    const status = document.getElementById('filterStatus')?.value || 'all';
    const sort = document.getElementById('filterSort')?.value || 'newest';

    const cardContainer = document.getElementById('customersCardContainer');
    if (cardContainer) {
        cardContainer.style.opacity = '0.5';
        cardContainer.style.transition = 'opacity 0.2s ease';
    }

    const url = `/Staff/DanhSachKhachHang?keyword=${encodeURIComponent(keyword)}&status=${encodeURIComponent(status)}&sort=${encodeURIComponent(sort)}`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Không thể tải danh sách khách hàng');
            return response.text();
        })
        .then(html => {
            if (cardContainer) {
                cardContainer.innerHTML = html;
                cardContainer.style.opacity = '1';
            }
        })
        .catch(err => {
            console.error(err);
            showToast('error', 'Đã xảy ra lỗi khi tải danh sách khách hàng');
            if (cardContainer) cardContainer.style.opacity = '1';
        });
};

window.clearFiltersKH = function () {
    const searchInp = document.getElementById('searchCustomer');
    const statusInp = document.getElementById('filterStatus');
    const sortInp = document.getElementById('filterSort');

    if (searchInp) searchInp.value = '';
    if (statusInp) statusInp.value = 'all';
    if (sortInp) sortInp.value = 'newest';

    window.applyFiltersKH();
};

/* ══════════════════════════════════════════
   CLIENT-SIDE FORM VALIDATION
   ══════════════════════════════════════════ */
function validateCustomerForm() {
    const nameInp = document.getElementById('addCustomerName');
    const phoneInp = document.getElementById('addCustomerPhone');
    const emailInp = document.getElementById('addCustomerEmail');
    const userInp = document.getElementById('addCustomerUsername');
    const passInp = document.getElementById('addCustomerPassword');

    if (!nameInp || !phoneInp || !userInp || !passInp) return false;

    let isValid = true;

    // Họ tên
    if (!nameInp.value.trim()) {
        nameInp.classList.add('is-invalid');
        isValid = false;
    } else {
        nameInp.classList.remove('is-invalid');
    }

    // Số điện thoại
    const phoneVal = phoneInp.value.trim();
    if (!phoneVal || !/^[0-9]{10,11}$/.test(phoneVal)) {
        phoneInp.classList.add('is-invalid');
        isValid = false;
    } else {
        phoneInp.classList.remove('is-invalid');
    }

    // Tên đăng nhập
    const userVal = userInp.value.trim();
    if (!userVal || userVal.length < 3) {
        userInp.classList.add('is-invalid');
        isValid = false;
    } else {
        userInp.classList.remove('is-invalid');
    }

    // Mật khẩu
    const passVal = passInp.value.trim();
    if (!passVal || passVal.length < 6) {
        passInp.classList.add('is-invalid');
        isValid = false;
    } else {
        passInp.classList.remove('is-invalid');
    }

    // Email (nếu nhập thì phải đúng định dạng)
    const emailVal = emailInp.value.trim();
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        emailInp.classList.add('is-invalid');
        isValid = false;
    } else {
        emailInp.classList.remove('is-invalid');
    }

    if (!isValid) {
        showToast('error', 'Vui lòng kiểm tra lại các thông tin bắt buộc (*)');
        return false;
    }

    return true;
}

/* ══════════════════════════════════════════
   AJAX CALLS: VIEW DETAILS FROM BACKEND
   ══════════════════════════════════════════ */
function viewCustomerDetails(id) {
    const customerDetailContainer = document.getElementById("customerDetailContainer");
    if (customerDetailContainer) {
        customerDetailContainer.innerHTML = 'Loading...';
    }

    fetch(`/Staff/ChiTietKH?id=${id}`)
        .then(response => {
            if (!response.ok) throw new Error("Không thể tải thông tin khách hàng");
            return response.text();
        })
        .then(html => {
            if (customerDetailContainer) {
                customerDetailContainer.innerHTML = html;
            }
            const modal = new bootstrap.Modal(document.getElementById("viewCustomerModal"));
            modal.show();
        })
        .catch(err => {
            console.error(err);
            showToast('error', 'Lỗi khi tải thông tin chi tiết khách hàng.');
        });
}

window.viewCustomerDetails = viewCustomerDetails;

/* ══════════════════════════════════════════
   AJAX CALLS: TICKET HISTORY LOGS (PARTIAL HTML)
   ══════════════════════════════════════════ */
window.viewTicketHistory = function (customerId) {
    window.activeHistoryCustomerId = customerId;
    fetchHistoryTickets(customerId);
};

function fetchHistoryTickets(customerId, keyword = '', status = 'all') {
    const url = `/Staff/LichSuPhieuHoTro?customerId=${customerId}&keyword=${encodeURIComponent(keyword)}&status=${encodeURIComponent(status)}`;
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error("Không thể tải lịch sử phiếu");
            return response.text(); // Nhận về chuỗi HTML được render từ PartialView
        })
        .then(html => {
            const tbody = document.getElementById('historyTicketsBody');
            if (tbody) tbody.innerHTML = html;
            if (ticketHistoryModal) ticketHistoryModal.show();
        })
        .catch(err => {
            console.error(err);
            showToast('error', 'Lỗi khi tải lịch sử phiếu hỗ trợ.');
        });
}

window.applyHistoryFilters = function () {
    const keyword = document.getElementById('historySearchCode')?.value || '';
    const status = document.getElementById('historySearchStatus')?.value || 'all';
    if (window.activeHistoryCustomerId) {
        fetchHistoryTickets(window.activeHistoryCustomerId, keyword, status);
    }
};

window.resetHistoryFilters = function () {
    const codeInp = document.getElementById('historySearchCode');
    const statSel = document.getElementById('historySearchStatus');
    if (codeInp) codeInp.value = '';
    if (statSel) statSel.value = 'all';
    if (window.activeHistoryCustomerId) {
        fetchHistoryTickets(window.activeHistoryCustomerId);
    }
};

/* ══════════════════════════════════════════
   AJAX CALLS: VIEW SPECIFIC TICKET DETAIL
   ══════════════════════════════════════════ */
window.viewTicketDetails = function (ticketCode) {
    fetch(`/Staff/ChiTietPhieu?ticketCode=${encodeURIComponent(ticketCode)}`)
        .then(response => {
            if (!response.ok) throw new Error("Không thể tải chi tiết phiếu");
            return response.json();
        })
        .then(ticket => {
            if (!ticket) return;
            setText('ticketDetTitle', ticket.title || '—');
            setText('ticketDetCode', ticket.ticketCode || '—');
            setText('ticketDetCustomer', ticket.customerName || '—');
            setText('ticketDetReqType', ticket.requestType || '—');
            setText('ticketDetDesc', ticket.description || 'Không có mô tả.');
            setText('ticketDetCreatedDate', ticket.createdDate || '—');
            setText('ticketDetUpdatedDate', ticket.updatedDate || '—');
            setText('ticketDetStaff', ticket.staffName || '—');

            const appDiv = document.getElementById('ticketDetAppointment');
            if (appDiv) {
                if (ticket.needAppointment && ticket.appointmentDate) {
                    appDiv.innerHTML = `<span class="text-success fw-bold"><i class="fa-solid fa-calendar-check me-1"></i> Có lịch hẹn (${ticket.appointmentDate} lúc ${ticket.appointmentTime || ''})</span>`;
                } else {
                    appDiv.innerHTML = '<span class="text-muted">Không đặt lịch hẹn ghé nhà</span>';
                }
            }

            const priorityDiv = document.getElementById('ticketDetPriority');
            if (priorityDiv) {
                priorityDiv.innerHTML = getPriorityBadgeHtml(ticket.priority);
            }

            const statusDiv = document.getElementById('ticketDetStatus');
            if (statusDiv) {
                statusDiv.innerHTML = getStatusBadgeHtml(ticket.status);
            }

            if (ticketDetailsModal) ticketDetailsModal.show();
        })
        .catch(err => {
            console.error(err);
            showToast('error', 'Lỗi khi tải chi tiết phiếu hỗ trợ.');
        });
};

/* ══════════════════════════════════════════
   CONFIRMATIONS: LOCK & DELETE ACTIONS
   ══════════════════════════════════════════ */
window.toggleLockStatus = function (customerId) {
    // Tìm phần tử button và dòng tr tương ứng trong DOM
    const btn = document.querySelector(`.btn-toggle-status[data-id="${customerId}"]`)
                || document.querySelector(`button[onclick*="toggleLockStatus('${customerId}')"]`)
                || document.querySelector(`button[onclick*="toggleLockStatus(&#x27;${customerId}&#x27;)"]`);
    if (!btn) {
        console.error("Không tìm thấy nút khóa/mở khóa cho khách hàng ID: ", customerId);
        return;
    }

    const row = btn.closest('tr');
    if (!row) return;

    const badge = row.querySelector('.status-badge');

    const currentStatus = badge ? badge.textContent.trim() : '';

    let swalConfig = {};
    if (currentStatus === 'Hoạt động') {
        swalConfig = {
            title: 'Khóa tài khoản khách hàng',
            html: 'Bạn có chắc chắn muốn khóa tài khoản khách hàng này?<br/><br/><small class="text-muted">Sau khi khóa:<br/>• Khách hàng sẽ không thể đăng nhập<br/>• Trạng thái chuyển thành "Đã khóa"</small>',
            icon: 'warning',
            iconHtml: '<i class="fa-solid fa-lock text-warning" style="font-size: 2.5rem; display: block; margin: auto;"></i>',
            showCancelButton: true,
            confirmButtonColor: '#EE0033',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Khóa tài khoản',
            cancelButtonText: 'Hủy'
        };
    } else {
        swalConfig = {
            title: 'Mở khóa tài khoản',
            html: 'Bạn có chắc muốn mở khóa tài khoản này?<br/><br/><small class="text-muted">Sau khi mở khóa:<br/>• Khách hàng có thể đăng nhập lại<br/>• Trạng thái chuyển thành "Hoạt động"</small>',
            icon: 'success',
            iconHtml: '<i class="fa-solid fa-lock-open text-success" style="font-size: 2.5rem; display: block; margin: auto;"></i>',
            showCancelButton: true,
            confirmButtonColor: '#EE0033',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Mở khóa',
            cancelButtonText: 'Hủy'
        };
    }

    Swal.fire(swalConfig).then((result) => {
        if (result.isConfirmed) {
            // Lấy token anti-forgery từ giao diện
            const tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
            const token = tokenInput ? tokenInput.value : '';

            // Gửi yêu cầu AJAX POST về backend
            const formData = new FormData();
            formData.append('idKhachHang', customerId);
            formData.append('id', customerId);
            if (token) {
                formData.append('__RequestVerificationToken', token);
            }

            fetch('/Staff/KhoaKhachHang', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(async response => {
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        const newStatus = data.newStatus;
                        
                        // Cập nhật giao diện (không cần F5)
                        if (newStatus === 'Đã khóa') {
                            // Cập nhật Badge
                            if (badge) {
                                badge.textContent = 'Đã khóa';
                                badge.className = 'badge bg-danger status-badge';
                            }
                            // Cập nhật Button & Icon & Tooltip
                            btn.className = 'btn-action-custom unlock btn-toggle-status';
                            btn.title = 'Mở khóa tài khoản';
                            btn.setAttribute('data-bs-original-title', 'Mở khóa tài khoản');
                            const icon = btn.querySelector('i');
                            if (icon) {
                                icon.className = 'fa-solid fa-lock-open';
                            }
                        } else {
                            // Cập nhật Badge
                            if (badge) {
                                badge.textContent = 'Hoạt động';
                                badge.className = 'badge bg-success status-badge';
                            }
                            // Cập nhật Button & Icon & Tooltip
                            btn.className = 'btn-action-custom lock btn-toggle-status';
                            btn.title = 'Khóa tài khoản';
                            btn.setAttribute('data-bs-original-title', 'Khóa tài khoản');
                            const icon = btn.querySelector('i');
                            if (icon) {
                                icon.className = 'fa-solid fa-lock';
                            }
                        }

                        // Hiển thị SweetAlert2 thành công
                        Swal.fire({
                            icon: 'success',
                            title: 'Cập nhật trạng thái thành công',
                            text: data.message || 'Trạng thái tài khoản khách hàng đã được cập nhật.',
                            confirmButtonColor: '#EE0033',
                            confirmButtonText: 'Đóng'
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Thất bại',
                            text: data.message || 'Không thể cập nhật trạng thái.',
                            confirmButtonColor: '#EE0033',
                            confirmButtonText: 'Đóng'
                        });
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi',
                        text: 'Lỗi kết nối tới máy chủ. Vui lòng thử lại.',
                        confirmButtonColor: '#EE0033',
                        confirmButtonText: 'Đóng'
                    });
                }
            })
            .catch(error => {
                console.error("AJAX Error: ", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi kết nối',
                    text: 'Lỗi kết nối tới máy chủ. Vui lòng thử lại.',
                    confirmButtonColor: '#EE0033',
                    confirmButtonText: 'Đóng'
                });
            });
        }
    });
};

window.deleteCustomer = function (customerId) {
    Swal.fire({
        title: 'Xác nhận xóa?',
        text: 'Bạn có chắc chắn muốn xóa khách hàng vĩnh viễn không? Hành động này không thể phục hồi.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EE0033',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Xóa vĩnh viễn',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            // Tạo form POST động và gửi yêu cầu xóa về server
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `/Staff/XoaKhachHang/${customerId}`;

            const tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
            if (tokenInput) {
                const clone = tokenInput.cloneNode(true);
                form.appendChild(clone);
            }

            document.body.appendChild(form);
            form.submit();
        }
    });
};

/* ══════════════════════════════════════════
   HELPER UTILITIES
   ══════════════════════════════════════════ */
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function getPriorityBadgeHtml(priority) {
    if (priority === 'Khẩn Cấp' || priority === '4' || priority === 4) {
        return '<span class="badge-priority emergency">Khẩn cấp</span>';
    }
    if (priority === 'Cao' || priority === '3' || priority === 3) {
        return '<span class="badge-priority high">Cao</span>';
    }
    if (priority === 'Trung Bình' || priority === '2' || priority === 2) {
        return '<span class="badge-priority medium">Trung bình</span>';
    }
    return '<span class="badge-priority low">Thấp</span>';
}

function getStatusBadgeHtml(status) {
    if (status === 'processing') return '<span class="badge-status processing">Đang xử lý</span>';
    if (status === 'completed') return '<span class="badge-status completed">Đã hoàn thành</span>';
    if (status === 'cancelled') return '<span class="badge-status cancelled">Đã hủy</span>';
    return '<span class="badge-status waiting">Chờ tiếp nhận</span>';
}

function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
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
