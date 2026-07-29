/* --------------------------------------------------------------------------
   FILE: assets/js/customer-profile.js
   AUTHOR: Antigravity
   DESCRIPTION: Frontend logic for Customer Profile page (TechSupport Viettel)
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ==================== 1. UI INTERACTION ONLY - DATA FROM RAZOR @Model ====================

    // đổi mật khẩu - Chỉ quản lý hiệu ứng UI (loading, disable button)
    const changePasswordForm = document.getElementById("changePasswordForm");

    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const currentPasswordInput = document.getElementById("currentPassword");
            const newPasswordInput = document.getElementById("newPassword");
            const confirmPasswordInput = document.getElementById("confirmPassword");
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

            // Client-side quick check
            let hasError = false;

            if (currentPasswordInput) {
                const currVal = currentPasswordInput.value;
                const errEl = document.getElementById("currentPasswordError");
                if (!currVal.trim()) {
                    setInputError(currentPasswordInput, true);
                    if (errEl) {
                        errEl.textContent = "Vui lòng nhập mật khẩu hiện tại.";
                        errEl.style.display = 'block';
                    }
                    hasError = true;
                } else {
                    setInputError(currentPasswordInput, false);
                    if (errEl) errEl.style.display = 'none';
                }
            }

            if (newPasswordInput) {
                const newVal = newPasswordInput.value;
                const errEl = document.getElementById("newPasswordError");
                if (!newVal.trim()) {
                    setInputError(newPasswordInput, true);
                    if (errEl) {
                        errEl.textContent = "Vui lòng nhập mật khẩu mới.";
                        errEl.style.display = 'block';
                    }
                    hasError = true;
                } else if (newVal.length < 8 || !passwordRegex.test(newVal)) {
                    setInputError(newPasswordInput, true);
                    if (errEl) {
                        errEl.textContent = "Mật khẩu mới phải từ 8 ký tự trở lên và chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.";
                        errEl.style.display = 'block';
                    }
                    hasError = true;
                } else {
                    setInputError(newPasswordInput, false);
                    if (errEl) errEl.style.display = 'none';
                }
            }

            if (confirmPasswordInput) {
                const confirmVal = confirmPasswordInput.value;
                const errEl = document.getElementById("confirmPasswordError");
                if (!confirmVal.trim()) {
                    setInputError(confirmPasswordInput, true);
                    if (errEl) {
                        errEl.textContent = "Vui lòng xác nhận mật khẩu mới.";
                        errEl.style.display = 'block';
                    }
                    hasError = true;
                } else if (confirmVal !== newPasswordInput.value) {
                    setInputError(confirmPasswordInput, true);
                    if (errEl) {
                        errEl.textContent = "Mật khẩu xác nhận không khớp.";
                        errEl.style.display = 'block';
                    }
                    hasError = true;
                } else {
                    setInputError(confirmPasswordInput, false);
                    if (errEl) errEl.style.display = 'none';
                }
            }

            if (hasError) {
                return;
            }

            const submitBtn = changePasswordForm.querySelector('button[type="submit"]');
            const originalIconClass = submitBtn?.querySelector('i')?.className || '';

            if (submitBtn) {
                submitBtn.disabled = true;
                const icon = submitBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fa-solid fa-spinner fa-spin me-2';
                }
            }

            try {
                const formData = new FormData(changePasswordForm);
                const response = await fetch(changePasswordForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                const result = await response.json();

                // Remove existing alerts inside the form
                const existingAlerts = changePasswordForm.querySelectorAll('.alert');
                existingAlerts.forEach(el => el.remove());

                if (result.success) {
                    const alertHtml = `
                        <div class="alert alert-success alert-dismissible fade show mb-3" role="alert">
                            <i class="bi bi-check-circle-fill me-2"></i> ${result.message}
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `;
                    changePasswordForm.insertAdjacentHTML('afterbegin', alertHtml);

                    // Clear inputs
                    if (currentPasswordInput) currentPasswordInput.value = '';
                    if (newPasswordInput) newPasswordInput.value = '';
                    if (confirmPasswordInput) confirmPasswordInput.value = '';
                } else {
                    const alertHtml = `
                        <div class="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i> ${result.message}
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `;
                    changePasswordForm.insertAdjacentHTML('afterbegin', alertHtml);
                }
            } catch (error) {
                console.error('Lỗi khi đổi mật khẩu:', error);
                const alertHtml = `
                    <div class="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i> Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                `;
                changePasswordForm.insertAdjacentHTML('afterbegin', alertHtml);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    const icon = submitBtn.querySelector('i');
                    if (icon) {
                        icon.className = originalIconClass || 'bi bi-key';
                    }
                }
            }
        });
    }
    //

    // DOM References for UI interactions only
    const ticketsTableBody = document.getElementById('ticketsTableBody');
    const appointmentsTimeline = document.getElementById('appointmentsTimeline');

    // ==================== 2. TICKET DETAIL MODAL ====================
    // Open ticket detail modal with data from Razor-rendered table
    const openTicketDetailModal = (ticketId) => {
        // Find the ticket row in the Razor-rendered table
        const ticketRow = document.querySelector(`button[data-ticket-id="${ticketId}"]`)?.closest('tr');
        if (!ticketRow) return;

        // Extract data from the table row
        const cells = ticketRow.querySelectorAll('td');
        const ticketCode = cells[1]?.textContent?.trim() || '-';
        const service = cells[2]?.textContent?.trim() || '-';
        const category = cells[3]?.textContent?.trim() || '-';
        const date = cells[4]?.textContent?.trim() || '-';
        const statusBadge = cells[5]?.querySelector('.status-badge')?.textContent?.trim() || '-';
        const priority = cells[6]?.querySelector('.priority-badge')?.textContent?.trim() || '-';

        document.getElementById('modalTicketCode').textContent = ticketCode;
        document.getElementById('modalTicketService').textContent = service;
        document.getElementById('modalTicketCategory').textContent = category;
        document.getElementById('modalTicketPriority').textContent = priority;
        document.getElementById('modalTicketDate').textContent = date;
        document.getElementById('modalTicketStatus').textContent = statusBadge;
        document.getElementById('modalTicketStaff').textContent = 'Đang phân công';
        document.getElementById('modalTicketDesc').textContent = 'Chi tiết phiếu hỗ trợ từ hệ thống.';
        document.getElementById('modalTicketNotes').textContent = 'Ghi chú xử lý từ kỹ thuật viên.';

        // Render timeline based on status
        const timelineWrapper = document.getElementById('modalTicketTimeline');
        if (timelineWrapper) {
            timelineWrapper.innerHTML = '';
            
            const statusLower = statusBadge.toLowerCase();
            let timelineSteps = [];
            
            if (statusLower.includes('hoàn thành')) {
                timelineSteps = [
                    { time: '08:00', title: 'Phiếu được tạo', active: true },
                    { time: '08:15', title: 'Tiếp nhận yêu cầu', active: true },
                    { time: '09:00', title: 'Phân công kỹ thuật viên', active: true },
                    { time: '14:00', title: 'Đang tiến hành xử lý', active: true },
                    { time: '16:00', title: 'Hoàn thành khắc phục', active: true }
                ];
            } else if (statusLower.includes('đang xử lý') || statusLower.includes('xử lý')) {
                timelineSteps = [
                    { time: '08:00', title: 'Phiếu được tạo', active: true },
                    { time: '08:15', title: 'Tiếp nhận yêu cầu', active: true },
                    { time: '09:00', title: 'Phân công kỹ thuật viên', active: true },
                    { time: '14:00', title: 'Đang tiến hành xử lý', active: true },
                    { time: '--:--', title: 'Hoàn thành khắc phục', active: false }
                ];
            } else if (statusLower.includes('chờ')) {
                timelineSteps = [
                    { time: '08:00', title: 'Phiếu được tạo', active: true },
                    { time: '08:15', title: 'Tiếp nhận yêu cầu', active: true },
                    { time: '--:--', title: 'Phân công kỹ thuật viên', active: false },
                    { time: '--:--', title: 'Đang tiến hành xử lý', active: false },
                    { time: '--:--', title: 'Hoàn thành khắc phục', active: false }
                ];
            } else if (statusLower.includes('hủy')) {
                timelineSteps = [
                    { time: '08:00', title: 'Phiếu được tạo', active: true },
                    { time: '08:15', title: 'Tiếp nhận yêu cầu', active: true },
                    { time: '10:00', title: 'Yêu cầu bị hủy bỏ', active: true, cancelled: true }
                ];
            } else {
                timelineSteps = [
                    { time: '08:00', title: 'Phiếu được tạo', active: true },
                    { time: '08:15', title: 'Tiếp nhận yêu cầu', active: true },
                    { time: '--:--', title: 'Phân công kỹ thuật viên', active: false },
                    { time: '--:--', title: 'Đang tiến hành xử lý', active: false },
                    { time: '--:--', title: 'Hoàn thành khắc phục', active: false }
                ];
            }

            timelineSteps.forEach(step => {
                const stepEl = document.createElement('div');
                stepEl.className = `modal-timeline-item ${step.active ? 'active' : ''} ${step.cancelled ? 'cancelled' : ''}`;
                
                stepEl.innerHTML = `
                    <div class="modal-timeline-bullet"></div>
                    <div class="modal-timeline-content">
                        <span class="modal-timeline-time">${step.time}</span>
                        <span class="modal-timeline-title">${step.title}</span>
                    </div>
                `;
                timelineWrapper.appendChild(stepEl);
            });
        }

        openProfileModal('ticketDetailModal');
    };

    // Attach event listeners to view buttons in Razor-rendered table
    if (ticketsTableBody) {
        const viewButtons = ticketsTableBody.querySelectorAll('.btn-view-ticket');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const ticketId = this.getAttribute('data-ticket-id');
                openTicketDetailModal(ticketId);
            });
        });
    }

    // Star Rating Interactivity
    const starRating = document.getElementById('starRating');
    const ratingValue = document.getElementById('ratingValue');
    const serviceReviewForm = document.getElementById('serviceReviewForm');
    const reviewFeedback = document.getElementById('reviewFeedback');

    if (starRating && ratingValue) {
        const stars = starRating.querySelectorAll('.star-item');
        
        stars.forEach(star => {
            star.addEventListener('mouseenter', function() {
                const hoverRating = parseInt(this.getAttribute('data-rating'), 10);
                stars.forEach(s => {
                    const currentRating = parseInt(s.getAttribute('data-rating'), 10);
                    if (currentRating <= hoverRating) {
                        s.classList.add('active-hover');
                        s.querySelector('i').className = 'bi bi-star-fill';
                    } else {
                        s.classList.remove('active-hover');
                        s.querySelector('i').className = 'bi bi-star';
                    }
                });
            });

            starRating.addEventListener('mouseleave', function() {
                const currentVal = parseInt(ratingValue.value, 10);
                stars.forEach(s => {
                    s.classList.remove('active-hover');
                    const currentRating = parseInt(s.getAttribute('data-rating'), 10);
                    if (currentRating <= currentVal) {
                        s.classList.add('selected');
                        s.querySelector('i').className = 'bi bi-star-fill';
                    } else {
                        s.classList.remove('selected');
                        s.querySelector('i').className = 'bi bi-star';
                    }
                });
            });

            star.addEventListener('click', function() {
                const clickRating = parseInt(this.getAttribute('data-rating'), 10);
                ratingValue.value = clickRating;
                stars.forEach(s => {
                    const currentRating = parseInt(s.getAttribute('data-rating'), 10);
                    if (currentRating <= clickRating) {
                        s.classList.add('selected');
                        s.querySelector('i').className = 'bi bi-star-fill';
                    } else {
                        s.classList.remove('selected');
                        s.querySelector('i').className = 'bi bi-star';
                    }
                });
            });
        });
    }

    if (serviceReviewForm) {
        serviceReviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const ratingVal = parseInt(ratingValue.value, 10);
            if (ratingVal === 0) {
                showProfileToast("Vui lòng đánh giá chất lượng bằng cách chọn số sao!", "warning");
                return;
            }

            showProfileToast("Đánh giá dịch vụ thành công! Cảm ơn ý kiến của bạn.", "success");
            
            ratingValue.value = 0;
            if (starRating) {
                const stars = starRating.querySelectorAll('.star-item');
                stars.forEach(s => {
                    s.classList.remove('selected', 'active-hover');
                    s.querySelector('i').className = 'bi bi-star';
                });
            }
            if (reviewFeedback) reviewFeedback.value = '';
        });
    }

    // Sidebar navigation smooth scroll and highlight
    const sections = [
        { id: 'personalInfoSection', linkId: 'menuLinkProfile' },
        { id: 'my-tickets', linkId: 'menuLinkTickets' },
        { id: 'my-appointments', linkId: 'menuLinkAppointments' },
        { id: 'service-review-section', linkId: 'menuLinkReview' }
    ];

    const handleScrollHighlight = () => {
        const scrollPosition = window.scrollY + 200;

        sections.forEach(sec => {
            const el = document.getElementById(sec.id);
            const link = document.getElementById(sec.linkId);
            if (!el || !link) return;

            const top = el.offsetTop;
            const height = el.offsetHeight;

            if (scrollPosition >= top && scrollPosition < top + height) {
                document.querySelectorAll('.sidebar-nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', handleScrollHighlight);

    sections.forEach(sec => {
        const link = document.getElementById(sec.linkId);
        if (link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const el = document.getElementById(sec.id);
                if (el) {
                    window.scrollTo({
                        top: el.offsetTop - 120,
                        behavior: 'smooth'
                    });
                }
            });
        }
    });

    const menuLinkLogout = document.getElementById('menuLinkLogout');
    if (menuLinkLogout) {
        menuLinkLogout.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }

    // ==================== 3. EDIT PROFILE POPUP MODAL LOGIC ====================
    const btnEditInline = document.getElementById('btnEditProfileInline');
    const btnOpenEditModal = document.getElementById('btnOpenEditProfileModal');
    const editProfileForm = document.getElementById('editProfileForm');

    const getEditProfileModalInstance = () => {
        const modalEl = document.getElementById('editProfileModal');
        if (!modalEl) return null;
        if (window.bootstrap && bootstrap.Modal) {
            return bootstrap.Modal.getOrCreateInstance(modalEl);
        }
        return null;
    };

    const populateEditModal = () => {
        const editFullname = document.getElementById('editFullname');
        const editPhone = document.getElementById('editPhone');
        const editEmail = document.getElementById('editEmail');
        const editAddress = document.getElementById('editAddress');
        const editNgaySinh = document.getElementById('editNgaySinh');

        const profileFullname = document.getElementById('profileFullname');
        const profilePhone = document.getElementById('profilePhone');
        const profileEmail = document.getElementById('profileEmail');
        const profileAddress = document.getElementById('profileAddress');
        const profileBirthdate = document.getElementById('profileBirthdate');

        if (editFullname && profileFullname) editFullname.value = profileFullname.value;
        if (editPhone && profilePhone) editPhone.value = profilePhone.value;
        if (editEmail && profileEmail) editEmail.value = profileEmail.value;
        if (editAddress && profileAddress) editAddress.value = (profileAddress.value !== 'Chưa cập nhật') ? profileAddress.value : '';

        if (editNgaySinh && profileBirthdate) {
            const rawVal = profileBirthdate.value;
            if (rawVal && rawVal.includes('-')) {
                editNgaySinh.value = rawVal;
            } else if (profileBirthdate.getAttribute('data-display-value')) {
                const parts = profileBirthdate.getAttribute('data-display-value').split('/');
                if (parts.length === 3) {
                    editNgaySinh.value = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
        }

        // Clear previous alert errors in modal
        const alertContainer = document.getElementById('modalAlertContainer');
        if (alertContainer) alertContainer.innerHTML = '';
    };

    const handleOpenEditProfileModal = (e) => {
        if (e) e.preventDefault();
        populateEditModal();
        openProfileModal('editProfileModal');
    };

    if (btnEditInline) {
        btnEditInline.addEventListener('click', handleOpenEditProfileModal);
    }

    if (btnOpenEditModal) {
        btnOpenEditModal.addEventListener('click', handleOpenEditProfileModal);
    }

    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const fullnameInput = document.getElementById('editFullname');
            const phoneInput    = document.getElementById('editPhone');
            const emailInput    = document.getElementById('editEmail');
            const alertContainer = document.getElementById('modalAlertContainer');
            if (alertContainer) alertContainer.innerHTML = '';

            let hasError = false;

            if (fullnameInput && !fullnameInput.value.trim()) {
                setInputError(fullnameInput, true);
                const errEl = document.getElementById('editFullnameError');
                if (errEl) { errEl.textContent = 'Vui lòng nhập họ và tên.'; errEl.style.display = 'block'; }
                hasError = true;
            } else if (fullnameInput) {
                setInputError(fullnameInput, false);
            }

            const phoneRegex = /^(0[35789])[0-9]{8}$/;
            if (phoneInput && (!phoneInput.value.trim() || !phoneRegex.test(phoneInput.value.trim()))) {
                setInputError(phoneInput, true);
                const errEl = document.getElementById('editPhoneError');
                if (errEl) { errEl.textContent = 'Số điện thoại phải gồm 10 chữ số hợp lệ (VD: 0981234567).'; errEl.style.display = 'block'; }
                hasError = true;
            } else if (phoneInput) {
                setInputError(phoneInput, false);
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailInput && (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim()))) {
                setInputError(emailInput, true);
                const errEl = document.getElementById('editEmailError');
                if (errEl) { errEl.textContent = 'Địa chỉ Email không hợp lệ.'; errEl.style.display = 'block'; }
                hasError = true;
            } else if (emailInput) {
                setInputError(emailInput, false);
            }

            if (hasError) return;

            const saveBtn = document.getElementById('btnSaveProfile');
            const saveIcon = document.getElementById('btnSaveProfileIcon');
            const originalBtnText = saveBtn ? saveBtn.innerHTML : '';

            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Đang lưu...';
            }

            try {
                const formData = new FormData(editProfileForm);
                const response = await fetch(editProfileForm.action || '/Customers/CapNhatThongTinCaNhan', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                const result = await response.json();

                if (result.success) {
                    closeProfileModal(document.getElementById('editProfileModal'));
                    showProfileToast(result.message || '✓ Cập nhật thông tin thành công.', 'success');

                    // Realtime DOM updates on current page without reload
                    const profileFullname = document.getElementById('profileFullname');
                    const profilePhone = document.getElementById('profilePhone');
                    const profileEmail = document.getElementById('profileEmail');
                    const profileAddress = document.getElementById('profileAddress');
                    const profileBirthdate = document.getElementById('profileBirthdate');
                    const sidebarUserFullname = document.getElementById('sidebarUserFullname');
                    const profileInitials = document.getElementById('profileInitials');
                    const headerUserName = document.querySelector('.user-name-display');
                    const heroUserName = document.getElementById('heroUserName');

                    if (result.data) {
                        if (result.data.hoTen) {
                            if (profileFullname) profileFullname.value = result.data.hoTen;
                            if (sidebarUserFullname) sidebarUserFullname.textContent = result.data.hoTen;
                            if (headerUserName) headerUserName.textContent = result.data.hoTen;
                            if (heroUserName) heroUserName.textContent = result.data.hoTen;

                            // Update Avatar Initials
                            if (profileInitials) {
                                const nameParts = result.data.hoTen.trim().split(' ');
                                const initials = nameParts.length > 1 
                                    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() 
                                    : nameParts[0].substring(0, 2).toUpperCase();
                                profileInitials.textContent = result.data.initials || initials;
                            }
                        }
                        if (result.data.soDienThoai && profilePhone) {
                            profilePhone.value = result.data.soDienThoai;
                        }
                        if (result.data.email !== undefined && profileEmail) {
                            profileEmail.value = result.data.email || '';
                        }
                        if (result.data.diaChi !== undefined && profileAddress) {
                            profileAddress.value = result.data.diaChi || 'Chưa cập nhật';
                        }
                        if (result.data.ngaySinh !== undefined && profileBirthdate) {
                            profileBirthdate.value = result.data.ngaySinh || 'Chưa cập nhật';
                        }
                    }
                } else {
                    // Show error inside Modal alert AND trigger danger toast. Modal stays OPEN!
                    if (alertContainer) {
                        alertContainer.innerHTML = `
                            <div class="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                                <i class="bi bi-exclamation-triangle-fill me-2"></i> ${result.message || 'Không thể cập nhật thông tin.'}
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>
                        `;
                    }
                    showProfileToast(result.message || '✗ Không thể cập nhật thông tin.', 'danger');
                }
            } catch (err) {
                console.error('Lỗi cập nhật thông tin:', err);
                if (alertContainer) {
                    alertContainer.innerHTML = `
                        <div class="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i> Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `;
                }
                showProfileToast('✗ Không thể cập nhật thông tin.', 'danger');
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalBtnText || '<i class="bi bi-save me-1"></i> Lưu thay đổi';
                }
            }
        });
    }



    // ==================== 5. TOAST NOTIFICATION SYSTEM ====================
    const showProfileToast = (message, type = 'success') => {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        
        let iconMarkup = '<i class="bi bi-check-circle-fill"></i>';
        let titleText = 'Thành công';
        if (type === 'danger') {
            iconMarkup = '<i class="bi bi-exclamation-triangle-fill"></i>';
            titleText = 'Lỗi hệ thống';
        } else if (type === 'warning') {
            iconMarkup = '<i class="bi bi-exclamation-circle-fill"></i>';
            titleText = 'Cảnh báo';
        } else if (type === 'info') {
            iconMarkup = '<i class="bi bi-info-circle-fill"></i>';
            titleText = 'Thông tin';
        }

        toast.innerHTML = `
            <div class="toast-icon-box">${iconMarkup}</div>
            <div class="toast-content-wrapper">
                <h4 class="toast-title">${titleText}</h4>
                <p class="toast-message">${message}</p>
            </div>
            <button type="button" class="btn-toast-close" aria-label="Đóng"><i class="bi bi-x-lg"></i></button>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        const dismissTimeout = setTimeout(() => {
            closeToast(toast);
        }, 4000);

        const closeBtn = toast.querySelector('.btn-toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                clearTimeout(dismissTimeout);
                closeToast(toast);
            });
        }
    };

    const closeToast = (toast) => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    };

    // ==================== 6. MODALS CONTROL ENGINE ====================
    const modalBackdropOverlay = document.getElementById('modalBackdropOverlay');
    const activeModals = [];

    const openProfileModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        closeAllModals(false);

        if (modalBackdropOverlay) {
            modalBackdropOverlay.style.display = 'block';
            setTimeout(() => {
                modalBackdropOverlay.classList.add('show');
            }, 10);
        }

        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        document.body.style.overflow = 'hidden';
        activeModals.push(modal);
    };

    const closeProfileModal = (modal) => {
        if (!modal) return;

        modal.classList.remove('show');
        const idx = activeModals.indexOf(modal);
        if (idx > -1) {
            activeModals.splice(idx, 1);
        }

        setTimeout(() => {
            modal.style.display = 'none';
            if (activeModals.length === 0) {
                if (modalBackdropOverlay) {
                    modalBackdropOverlay.classList.remove('show');
                    setTimeout(() => {
                        modalBackdropOverlay.style.display = 'none';
                    }, 300);
                }
                document.body.style.overflow = '';
            }
        }, 300);
    };

    const closeAllModals = (hideOverlay = true) => {
        const opened = [...activeModals];
        opened.forEach(m => closeProfileModal(m));
        if (hideOverlay && modalBackdropOverlay) {
            modalBackdropOverlay.classList.remove('show');
            setTimeout(() => {
                modalBackdropOverlay.style.display = 'none';
            }, 300);
            document.body.style.overflow = '';
        }
    };

    const btnChangePasswordInline = document.getElementById('btnChangePasswordInline');
    if (btnChangePasswordInline) {
        btnChangePasswordInline.addEventListener('click', () => {
            resetPasswordForm();
            openProfileModal('changePasswordModal');
        });
    }

    const menuLinkChangePassword = document.getElementById('menuLinkChangePassword');
    if (menuLinkChangePassword) {
        menuLinkChangePassword.addEventListener('click', (e) => {
            e.preventDefault();
            resetPasswordForm();
            openProfileModal('changePasswordModal');
        });
    }

    const closeButtons = document.querySelectorAll('[data-close-modal]');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.profile-custom-modal');
            closeProfileModal(modal);
        });
    });

    if (modalBackdropOverlay) {
        modalBackdropOverlay.addEventListener('click', () => closeAllModals(true));
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeModals.length > 0) {
            closeAllModals(true);
        }
    });

    const pwToggles = document.querySelectorAll('.btn-password-visibility-toggle');
    pwToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const targetId = this.getAttribute('data-toggle-password');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (input && icon) {
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('bi-eye-slash');
                    icon.classList.add('bi-eye');
                    this.setAttribute('aria-label', 'Ẩn mật khẩu');
                } else {
                    input.type = 'password';
                    icon.classList.remove('bi-eye');
                    icon.classList.add('bi-eye-slash');
                    this.setAttribute('aria-label', 'Hiện mật khẩu');
                }
            }
        });
    });

    // ==================== 7. PROFILE FORM EDIT LOGIC ====================
    // Form fields validation helper is retained below for other elements if needed
    const setInputError = (inputEl, isError) => {
        if (!inputEl) return;
        if (isError) {
            inputEl.classList.add('is-invalid');
            const errEl = document.getElementById(`${inputEl.id}Error`);
            if (errEl) errEl.style.display = 'block';
        } else {
            inputEl.classList.remove('is-invalid');
            const errEl = document.getElementById(`${inputEl.id}Error`);
            if (errEl) errEl.style.display = 'none';
        }
    };


    // ==================== 8. PASSWORD UPDATE LOGIC ====================
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    const resetPasswordForm = () => {
        if (currentPassword) currentPassword.value = '';
        if (newPassword) newPassword.value = '';
        if (confirmPassword) confirmPassword.value = '';

        // Reset visibility toggles to password state
        const inputs = [currentPassword, newPassword, confirmPassword];
        inputs.forEach(input => {
            if (input) {
                input.type = 'password';
                input.classList.remove('is-invalid');
                const errEl = document.getElementById(`${input.id}Error`);
                if (errEl) errEl.style.display = 'none';
            }
        });

        const toggles = document.querySelectorAll('.btn-password-visibility-toggle');
        toggles.forEach(toggle => {
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.className = 'bi bi-eye-slash';
            }
            toggle.setAttribute('aria-label', 'Hiện mật khẩu');
        });
    };

    const validateChangePasswordForm = () => {
        let isValid = true;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        // 1. Current password required
        const currentVal = currentPassword.value;
        if (!currentVal) {
            setInputError(currentPassword, true);
            const errEl = document.getElementById('currentPasswordError');
            if (errEl) {
                errEl.textContent = "Vui lòng nhập mật khẩu hiện tại";
            }
            isValid = false;
        } else {
            setInputError(currentPassword, false);
        }

        // 2. New password validations
        const newVal = newPassword.value;
        if (!newVal || newVal.length < 8 || !passwordRegex.test(newVal)) {
            setInputError(newPassword, true);
            const errEl = document.getElementById('newPasswordError');
            if (errEl) {
                errEl.textContent = "Mật khẩu mới phải từ 8 ký tự trở lên và chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.";
            }
            isValid = false;
        } else {
            setInputError(newPassword, false);
        }

        // 3. Confirm password checks matches
        const confirmVal = confirmPassword.value;
        if (!confirmVal || confirmVal !== newVal) {
            setInputError(confirmPassword, true);
            const errEl = document.getElementById('confirmPasswordError');
            if (errEl) {
                errEl.textContent = "Mật khẩu xác nhận không khớp.";
            }
            isValid = false;
        } else {
            setInputError(confirmPassword, false);
        }

        return isValid;
    };

    // Password form is handled by the existing submit handler at the top of the file

    // Real-time validations
    if (currentPassword) {
        currentPassword.addEventListener('input', () => {
            setInputError(currentPassword, !currentPassword.value);
        });
    }
    if (newPassword) {
        newPassword.addEventListener('input', () => {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            const isError = !newPassword.value || newPassword.value.length < 8 || !passwordRegex.test(newPassword.value);
            setInputError(newPassword, isError);
            if (isError) {
                const errEl = document.getElementById('newPasswordError');
                if (errEl) {
                    errEl.textContent = "Mật khẩu mới phải từ 8 ký tự trở lên và chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.";
                }
            }
            if (confirmPassword.value) {
                setInputError(confirmPassword, confirmPassword.value !== newPassword.value);
            }
        });
    }
    if (confirmPassword) {
        confirmPassword.addEventListener('input', () => {
            setInputError(confirmPassword, !confirmPassword.value || confirmPassword.value !== newPassword.value);
        });
    }


    // ==================== 9. LOGOUT ACTION ====================
    const handleLogout = () => {
        if (window.TechSupportAuth && typeof window.TechSupportAuth.logout === 'function') {
            window.TechSupportAuth.logout();
        } else {
            sessionStorage.removeItem('techsupport_session');
            sessionStorage.removeItem('ts_customer_name');
            localStorage.removeItem('ts_customer_name');
            sessionStorage.setItem('logout_success_toast', 'true');
        }
        window.location.href = '../index.html';
    };

    const btnTriggerSidebarLogout = document.getElementById('btnTriggerSidebarLogout');
    if (btnTriggerSidebarLogout) {
        btnTriggerSidebarLogout.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
});
