/* -------------------------------------------------------------
 * FILE: assets/js/staff/staff.js
 * DESCRIPTION: Staff Management Dashboard (Modals, AJAX CRUD, Filters)
 * ------------------------------------------------------------- */

'use strict';

// 1. Toast Helper
if (typeof window.showToast !== 'function') {
    window.showToast = function (type, message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: type === 'success' ? 'success' : (type === 'warning' ? 'warning' : 'error'),
                title: message,
                showConfirmButton: false,
                timer: 3500,
                timerProgressBar: true
            });
        } else {
            alert(message);
        }
    };
}

// 2. Global Modal Overlay Control
window.openModalOverlay = function (modalId) {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
        modalEl.classList.add('show');
        modalEl.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

window.closeModalOverlay = function (modalId) {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
        modalEl.classList.remove('show');
        modalEl.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// 3. Modal 1: Add Staff Modal
window.openAddStaffModal = function () {
    const form = document.getElementById('addStaffForm');
    if (form) {
        form.reset();
        form.classList.remove('was-validated');
        $('.vt-error-msg', form).hide();
    }
    const preview = document.getElementById('staffAvatarPreview');
    if (preview) {
        preview.src = 'https://ui-avatars.com/api/?name=New+Staff&background=EE0033&color=fff&size=100';
    }
    window.openModalOverlay('addStaffModal');
};

window.closeAddStaffModal = function () {
    window.closeModalOverlay('addStaffModal');
};

// 4. Modal 2: Edit Staff Modal
window.openEditStaffModal = function (id) {
    if (!id) return;
    $.ajax({
        url: '/Staff/LayThongTinNhanVien',
        type: 'GET',
        data: { id: id },
        success: function (res) {
            if (res.success && res.data) {
                const d = res.data;
                $('#editStaffId').val(d.idNhanVien || d.IdNhanVien);
                $('#editStaffName').val(d.hoTen || d.HoTen || '');
                $('#editStaffEmail').val(d.email || d.Email || '');
                $('#editStaffPhone').val(d.soDienThoai || d.SoDienThoai || '');
                $('#editStaffAddress').val(d.diaChi || d.DiaChi || '');
                $('#editStaffUsername').val(d.tenDangNhap || d.TenDangNhap || '');
                $('#editStaffRole').val(d.vaiTro || d.VaiTro || 'Nhân viên');
                $('#editStaffStatus').val(d.trangThai || d.TrangThai || 'Hoạt động');

                $('.vt-error-msg', '#editStaffForm').hide();
                window.openModalOverlay('editStaffModal');
            } else {
                window.showToast('error', res.message || 'Không thể lấy thông tin nhân viên.');
            }
        },
        error: function () {
            window.showToast('error', 'Lỗi kết nối khi lấy thông tin nhân viên.');
        }
    });
};

window.closeEditStaffModal = function () {
    window.closeModalOverlay('editStaffModal');
};

// 5. Modal 3: Detail Staff Modal
window.openDetailStaffModal = function (id) {
    if (!id) return;
    $.ajax({
        url: '/Staff/LayChiTietNhanVien',
        type: 'GET',
        data: { id: id },
        success: function (res) {
            if (res.success && res.data) {
                const d = res.data;
                const idNum = d.idNhanVien || d.IdNhanVien;
                const idStr = 'STAFF' + String(idNum).padStart(3, '0');

                $('#detStaffCode').val(idStr);
                $('#detStaffName').val(d.hoTen || d.HoTen || '—');
                $('#detStaffEmail').val(d.email || d.Email || '—');
                $('#detStaffPhone').val(d.soDienThoai || d.SoDienThoai || '—');
                $('#detStaffAddress').val(d.diaChi || d.DiaChi || '—');
                $('#detStaffUsername').val(d.tenDangNhap || d.TenDangNhap || '—');
                $('#detStaffCreatedDate').val(d.ngayTao ? String(d.ngayTao) : '—');

                const role = d.vaiTro || d.VaiTro || 'Nhân viên';
                const status = d.trangThai || d.TrangThai || 'Hoạt động';

                const roleBadge = $('#detStaffRoleBadge');
                roleBadge.text(role);
                if (role === 'Admin') {
                    roleBadge.attr('class', 'badge bg-danger text-white');
                } else {
                    roleBadge.attr('class', 'badge bg-primary text-white');
                }

                const statusBadge = $('#detStaffStatusBadge');
                statusBadge.text(status);
                if (status === 'Hoạt động') {
                    statusBadge.attr('class', 'badge bg-success text-white');
                } else {
                    statusBadge.attr('class', 'badge bg-warning text-dark');
                }

                const avatarImg = $('#detStaffAvatar');
                if (avatarImg.length) {
                    avatarImg.attr('src', `https://ui-avatars.com/api/?name=${encodeURIComponent(d.hoTen || 'Staff')}&background=10B981&color=fff&size=100`);
                }

                window.openModalOverlay('detailStaffModal');
            } else {
                window.showToast('error', res.message || 'Không tìm thấy chi tiết nhân viên.');
            }
        },
        error: function () {
            window.showToast('error', 'Lỗi khi tải chi tiết nhân viên.');
        }
    });
};

window.closeDetailStaffModal = function () {
    window.closeModalOverlay('detailStaffModal');
};

// 6. Modal 4: Reset Password Modal
window.openResetPasswordModal = function (id) {
    if (!id) return;
    $.ajax({
        url: '/Staff/LayThongTinResetMatKhau',
        type: 'GET',
        data: { id: id },
        success: function (res) {
            if (res.success && res.data) {
                const d = res.data;
                $('#resetStaffId').val(d.idNhanVien || d.IdNhanVien);
                $('#resetStaffName').val(d.hoTen || d.HoTen || '');
                $('#resetUsername').val(d.tenDangNhap || d.TenDangNhap || '');
                $('#resetPasswordNew').val('');
                $('#resetPasswordConfirm').val('');
                $('.vt-error-msg', '#resetPasswordForm').hide();

                window.openModalOverlay('resetPasswordModal');
            } else {
                window.showToast('error', res.message || 'Không tìm thấy nhân viên.');
            }
        },
        error: function () {
            window.showToast('error', 'Lỗi kết nối khi lấy thông tin nhân viên.');
        }
    });
};

window.closeResetPasswordModal = function () {
    window.closeModalOverlay('resetPasswordModal');
};

// 7. Modal 5: Lock / Unlock Staff Modal
window.openLockStaffModal = function (id) {
    if (!id) return;
    $.ajax({
        url: '/Staff/LayThongTinKhoaNhanVien',
        type: 'GET',
        data: { id: id },
        success: function (res) {
            if (res.success && res.data) {
                const d = res.data;
                const idNum = d.idNhanVien || d.IdNhanVien;
                const idStr = 'STAFF' + String(idNum).padStart(3, '0');
                const status = d.trangThai || d.TrangThai || 'Hoạt động';

                $('#lockStaffId').val(idNum);
                $('#lockStaffName').text(d.hoTen || d.HoTen || '—');
                $('#lockStaffCode').text(idStr);
                $('#lockStaffRole').text(d.vaiTro || d.VaiTro || '—');
                $('#lockStaffEmail').text(d.email || d.Email || '—');
                $('#lockStaffPhone').text(d.soDienThoai || d.SoDienThoai || '—');

                const curBadge = $('#lockStaffCurrentStatusBadge');
                curBadge.text(status);
                if (status === 'Hoạt động') {
                    curBadge.attr('class', 'badge bg-success text-white');
                    $('#lockStaffStatus').val('Tạm khóa');
                    $('#lockStaffWarning').show();
                } else {
                    curBadge.attr('class', 'badge bg-warning text-dark');
                    $('#lockStaffStatus').val('Hoạt động');
                    $('#lockStaffWarning').hide();
                }

                $('#lockStaffAvatar').attr('src', `https://ui-avatars.com/api/?name=${encodeURIComponent(d.hoTen || 'Staff')}&background=EF4444&color=fff&size=80`);

                window.openModalOverlay('lockStaffModal');
            } else {
                window.showToast('error', res.message || 'Không tìm thấy nhân viên.');
            }
        },
        error: function () {
            window.showToast('error', 'Lỗi khi tải thông tin nhân viên.');
        }
    });
};

window.closeLockStaffModal = function () {
    window.closeModalOverlay('lockStaffModal');
};

window.closeStaffDetailsModal = function () {
    window.closeModalOverlay('staffDetailsModal');
};

// 8. Action: Confirm Delete Staff
window.confirmDeleteStaff = function (id, name) {
    if (!id) return;
    const token = $('input[name="__RequestVerificationToken"]').first().val();

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Xác Nhận Xóa Nhân Viên',
            text: `Bạn có chắc chắn muốn xóa nhân viên '${name}' không? Hành động này không thể hoàn tác!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EE0033',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Xác nhận xóa',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/Staff/XoaNhanVien',
                    type: 'POST',
                    data: {
                        id: id,
                        __RequestVerificationToken: token
                    },
                    success: function (res) {
                        if (res.success) {
                            window.showToast('success', res.message || 'Xóa nhân viên thành công!');
                            setTimeout(() => location.reload(), 1000);
                        } else {
                            window.showToast('error', res.message || 'Không thể xóa nhân viên.');
                        }
                    },
                    error: function () {
                        window.showToast('error', 'Lỗi kết nối khi xóa nhân viên.');
                    }
                });
            }
        });
    }
};

// 9. Document Ready & Form Listeners
$(document).ready(function () {
    // Backdrop & ESC key overlay controls
    $(document).on('click', function (e) {
        if ($(e.target).hasClass('vt-modal-overlay')) {
            window.closeModalOverlay(e.target.id);
        }
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            $('.vt-modal-overlay.show, .vt-modal-overlay.active').each(function () {
                window.closeModalOverlay(this.id);
            });
        }
    });

    // Reset filter button
    $('#btnResetFilter').on('click', function () {
        $('#searchStaff').val('');
        $('#filterStatus').val('all');
        $('#sortSelect').val('newest');
        $('#filterForm').submit();
    });

    // Toggle password helper function
    window.togglePasswordVisibility = function (inputId, btn) {
        const input = document.getElementById(inputId);
        if (input) {
            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }
    };

    // Form 1: Add Staff Submit Handler
    $('#addStaffForm').off('submit').on('submit', function (e) {
        e.preventDefault();
        const formData = $(this).serialize();
        $.ajax({
            url: '/Staff/ThemNhanVien',
            type: 'POST',
            data: formData,
            success: function (res) {
                if (res.success) {
                    window.closeAddStaffModal();
                    window.showToast('success', res.message || 'Thêm nhân viên thành công!');
                    setTimeout(() => location.reload(), 1000);
                } else {
                    window.showToast('error', res.message || 'Có lỗi xảy ra khi thêm nhân viên.');
                }
            },
            error: function () {
                window.showToast('error', 'Lỗi máy chủ khi thêm mới nhân viên.');
            }
        });
    });

    // Form 2: Edit Staff Submit Handler
    $('#editStaffForm').off('submit').on('submit', function (e) {
        e.preventDefault();
        const formData = $(this).serialize();
        $.ajax({
            url: '/Staff/CapNhatNhanVien',
            type: 'POST',
            data: formData,
            success: function (res) {
                if (res.success) {
                    window.closeEditStaffModal();
                    window.showToast('success', res.message || 'Cập nhật nhân viên thành công!');
                    setTimeout(() => location.reload(), 1000);
                } else {
                    window.showToast('error', res.message || 'Có lỗi xảy ra khi cập nhật.');
                }
            },
            error: function () {
                window.showToast('error', 'Lỗi máy chủ khi cập nhật nhân viên.');
            }
        });
    });

    // Form 3: Reset Password Submit Handler
    $('#resetPasswordForm').off('submit').on('submit', function (e) {
        e.preventDefault();
        const pass = $('#resetPasswordNew').val();
        const confirm = $('#resetPasswordConfirm').val();

        if (!pass || pass.length < 6) {
            $('#resetPasswordNewError').show();
            return;
        } else {
            $('#resetPasswordNewError').hide();
        }

        if (pass !== confirm) {
            $('#resetPasswordConfirmError').show();
            return;
        } else {
            $('#resetPasswordConfirmError').hide();
        }

        const formData = $(this).serialize();
        $.ajax({
            url: '/Staff/ResetMatKhauNhanVien',
            type: 'POST',
            data: formData,
            success: function (res) {
                if (res.success) {
                    window.closeResetPasswordModal();
                    window.showToast('success', res.message || 'Reset mật khẩu thành công!');
                } else {
                    window.showToast('error', res.message || 'Có lỗi xảy ra khi reset mật khẩu.');
                }
            },
            error: function () {
                window.showToast('error', 'Lỗi máy chủ khi reset mật khẩu.');
            }
        });
    });

    // Form 4: Lock / Unlock Staff Submit Handler
    $('#lockStaffForm').off('submit').on('submit', function (e) {
        e.preventDefault();
        const formData = $(this).serialize();
        $.ajax({
            url: '/Staff/KhoaNhanVien',
            type: 'POST',
            data: formData,
            success: function (res) {
                if (res.success) {
                    window.closeLockStaffModal();
                    window.showToast('success', res.message || 'Cập nhật trạng thái tài khoản thành công!');
                    setTimeout(() => location.reload(), 1000);
                } else {
                    window.showToast('error', res.message || 'Có lỗi xảy ra.');
                }
            },
            error: function () {
                window.showToast('error', 'Lỗi máy chủ khi cập nhật trạng thái nhân viên.');
            }
        });
    });
});
