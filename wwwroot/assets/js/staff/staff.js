/* -------------------------------------------------------------
 * FILE: assets/js/staff/staff.js
 * AUTHOR: Antigravity
 * DESCRIPTION: Client-side logic for staff management dashboard (CRUD, Chart.js, Modals)
 * ------------------------------------------------------------- */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // 1. DATA INITIALIZATION FROM SERVER-SIDE GLOBAL
    let staffs = window.INITIAL_STAFF || [];

    // STATE CONTROL
    let selectedStaffId = null;
    let performanceChart = null;

    // DOM ELEMENTS (Add modal)
    const inputAvatar = document.getElementById('staffAvatarInput');
    const imgPreview = document.getElementById('staffAvatarPreview');
    const addStaffForm = document.getElementById('addStaffForm');

    // DOM ELEMENTS (Edit modal)
    const editAvatarInput = document.getElementById('editStaffAvatarInput');
    const editAvatarPreview = document.getElementById('editStaffAvatarPreview');
    const editStaffForm = document.getElementById('editStaffForm');

    // 2. TOAST NOTIFICATIONS
    const showToast = (message, type = 'success') => {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'global-toast-container';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast-item ${type}`;
        
        let iconHtml = '<i class="fa-solid fa-circle-check toast-item-icon"></i>';
        if (type === 'error') {
            iconHtml = '<i class="fa-solid fa-circle-xmark toast-item-icon"></i>';
        } else if (type === 'warning') {
            iconHtml = '<i class="fa-solid fa-circle-exclamation toast-item-icon"></i>';
        }
        
        toast.innerHTML = `
            ${iconHtml}
            <span class="toast-item-msg">${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 50);
        
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 4000);
    };

    // Export showToast to window
    window.showToast = showToast;

    // 3. MODAL HELPERS
    const openModal = (id) => {
        const overlay = document.getElementById(id);
        if (!overlay) return;
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = (id) => {
        const overlay = document.getElementById(id);
        if (!overlay) return;
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    };

    window.openAddStaffModal = () => {
        resetAddForm();
        openModal('addStaffModal');
        setTimeout(() => {
            const nameEl = document.getElementById('staffName');
            if (nameEl) nameEl.focus();
        }, 300);
    };

    window.closeAddStaffModal = () => {
        closeModal('addStaffModal');
    };

    window.closeEditStaffModal = () => {
        closeModal('editStaffModal');
    };

    window.closeStaffDetailsModal = () => {
        closeModal('staffDetailsModal');
    };

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

    // Avatar preview upload handler for Add
    if (inputAvatar && imgPreview) {
        inputAvatar.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    imgPreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
        
        imgPreview.addEventListener('click', () => inputAvatar.click());
    }

    // Avatar preview upload handler for Edit
    if (editAvatarInput && editAvatarPreview) {
        editAvatarInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    editAvatarPreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
        
        editAvatarPreview.addEventListener('click', () => editAvatarInput.click());
    }

    // 4. EDIT & DETAIL MODALS
    const openEditModal = (id) => {
        selectedStaffId = id;
        const s = staffs.find(staff => staff.id === id);
        if (s) {
            // Populate form
            document.getElementById('editStaffId').value = parseInt(id.replace("STAFF", ""));
            document.getElementById('editStaffName').value = s.fullname;
            document.getElementById('editStaffEmail').value = s.email;
            document.getElementById('editStaffPhone').value = s.phone;
            document.getElementById('editStaffAddress').value = s.address || '';
            document.getElementById('editStaffUsername').value = s.username;
            document.getElementById('editStaffRole').value = s.role;
            document.getElementById('editStaffStatus').value = s.status;
            
            if (editAvatarPreview) {
                editAvatarPreview.src = s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.fullname)}&background=F59E0B&color=fff&size=100`;
            }

            // Hide validation error messages
            document.getElementById('editStaffNameError').style.display = 'none';
            document.getElementById('editStaffEmailError').style.display = 'none';
            document.getElementById('editStaffPhoneError').style.display = 'none';

            if (editStaffForm) editStaffForm.classList.remove('was-validated');

            openModal('editStaffModal');
        }
    };

    const resetAddForm = () => {
        if (addStaffForm) addStaffForm.reset();
        
        // Hide validation errors
        document.getElementById('staffNameError').style.display = 'none';
        document.getElementById('staffEmailError').style.display = 'none';
        document.getElementById('staffPhoneError').style.display = 'none';
        document.getElementById('staffUsernameError').style.display = 'none';
        document.getElementById('staffPasswordError').style.display = 'none';

        if (imgPreview) imgPreview.src = 'https://ui-avatars.com/api/?name=New+Staff&background=EE0033&color=fff&size=100';
        if (addStaffForm) addStaffForm.classList.remove('was-validated');
    };

    // FORM SUBMISSION (ADD)
    if (addStaffForm) {
        addStaffForm.addEventListener('submit', function (e) {
            e.preventDefault();
            
            // Hide all errors first
            document.getElementById('staffNameError').style.display = 'none';
            document.getElementById('staffEmailError').style.display = 'none';
            document.getElementById('staffPhoneError').style.display = 'none';
            document.getElementById('staffUsernameError').style.display = 'none';
            document.getElementById('staffPasswordError').style.display = 'none';

            let isValid = true;

            const name = document.getElementById('staffName').value.trim();
            if (!name) {
                document.getElementById('staffNameError').style.display = 'block';
                isValid = false;
            }

            const email = document.getElementById('staffEmail').value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                document.getElementById('staffEmailError').style.display = 'block';
                isValid = false;
            }

            const phone = document.getElementById('staffPhone').value.trim();
            const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
            if (!phone || !phoneRegex.test(phone)) {
                document.getElementById('staffPhoneError').style.display = 'block';
                isValid = false;
            }

            const username = document.getElementById('staffUsername').value.trim();
            const usernameRegex = /^[a-zA-Z0-9._]{4,20}$/;
            if (!username || !usernameRegex.test(username)) {
                document.getElementById('staffUsernameError').style.display = 'block';
                isValid = false;
            }

            const password = document.getElementById('staffPassword').value;
            if (!password || password.length < 6) {
                document.getElementById('staffPasswordError').style.display = 'block';
                isValid = false;
            }

            if (!isValid) {
                this.classList.add('was-validated');
                return;
            }

            const address = document.getElementById('staffAddress').value.trim();
            const role = document.getElementById('staffRole').value;
            const status = document.getElementById('staffStatus').value;

            const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value;
            const formData = new FormData();
            formData.append('HoTen', name);
            formData.append('Email', email);
            formData.append('SoDienThoai', phone);
            formData.append('DiaChi', address);
            formData.append('TenDangNhap', username);
            formData.append('MatKhau', password);
            formData.append('VaiTro', role);
            formData.append('TrangThai', status);
            if (token) formData.append('__RequestVerificationToken', token);

            fetch('/Staff/ThemNhanVien', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');
                    closeModal('addStaffModal');
                    resetAddForm();
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    showToast(data.message || 'Lỗi khi thêm nhân viên', 'error');
                }
            })
            .catch(err => showToast('Lỗi kết nối máy chủ', 'error'));
        });
    }

    // FORM SUBMISSION (EDIT)
    if (editStaffForm) {
        editStaffForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Hide errors
            document.getElementById('editStaffNameError').style.display = 'none';
            document.getElementById('editStaffEmailError').style.display = 'none';
            document.getElementById('editStaffPhoneError').style.display = 'none';

            let isValid = true;

            const name = document.getElementById('editStaffName').value.trim();
            if (!name) {
                document.getElementById('editStaffNameError').style.display = 'block';
                isValid = false;
            }

            const email = document.getElementById('editStaffEmail').value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                document.getElementById('editStaffEmailError').style.display = 'block';
                isValid = false;
            }

            const phone = document.getElementById('editStaffPhone').value.trim();
            const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
            if (!phone || !phoneRegex.test(phone)) {
                document.getElementById('editStaffPhoneError').style.display = 'block';
                isValid = false;
            }

            if (!isValid) {
                this.classList.add('was-validated');
                return;
            }

            const id = document.getElementById('editStaffId').value;
            const address = document.getElementById('editStaffAddress').value.trim();
            const role = document.getElementById('editStaffRole').value;
            const status = document.getElementById('editStaffStatus').value;

            const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value;
            const formData = new FormData();
            formData.append('IdNhanVien', id);
            formData.append('HoTen', name);
            formData.append('Email', email);
            formData.append('SoDienThoai', phone);
            formData.append('DiaChi', address);
            formData.append('VaiTro', role);
            formData.append('TrangThai', status);
            if (token) formData.append('__RequestVerificationToken', token);

            fetch('/Staff/LuuNhanVien', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');
                    closeModal('editStaffModal');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    showToast(data.message || 'Lỗi khi cập nhật thông tin', 'error');
                }
            })
            .catch(err => showToast('Lỗi kết nối máy chủ', 'error'));
        });
    }

    const openDetailModal = (id) => {
        const s = staffs.find(staff => staff.id === id);
        if (s) {
            // Tab 1: Personal Info
            document.getElementById('detAvatar').src = s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.fullname)}&background=EE0033&color=fff&size=100`;
            document.getElementById('detName').textContent = s.fullname;
            document.getElementById('detIdBadge').textContent = s.id;
            
            const isRoleAdmin = s.role === 'Admin';
            const roleEl = document.getElementById('detRoleBadge');
            roleEl.className = `badge-custom ${isRoleAdmin ? 'badge-role-admin' : 'badge-role-staff'}`;
            roleEl.textContent = s.role;

            const isActive = s.status === 'Hoạt động';
            const statusEl = document.getElementById('detStatusBadge');
            statusEl.className = `badge-custom ${isActive ? 'badge-status-active' : 'badge-status-locked'}`;
            statusEl.textContent = s.status;

            document.getElementById('detPhone').textContent = s.phone;
            document.getElementById('detEmail').textContent = s.email;
            document.getElementById('detUsername').textContent = s.username;
            document.getElementById('detAddress').textContent = s.address || 'Chưa cập nhật';
            document.getElementById('detCreatedDate').textContent = s.createdDate;

            // Tab 2: Performance statistics
            document.getElementById('detPerfTotal').textContent = s.perfStats.total;
            document.getElementById('detPerfCompleted').textContent = s.perfStats.completed;
            document.getElementById('detPerfProcessing').textContent = s.perfStats.processing;
            document.getElementById('detPerfWaiting').textContent = s.perfStats.waiting;

            // Rating detailed progress bars
            const svcBar = document.getElementById('detPerfSvcBar');
            const attBar = document.getElementById('detPerfAttBar');
            const spdBar = document.getElementById('detPerfSpdBar');
            
            document.getElementById('detPerfSvcVal').textContent = s.ratingsDetail.service + '%';
            document.getElementById('detPerfAttVal').textContent = s.ratingsDetail.attitude + '%';
            document.getElementById('detPerfSpdVal').textContent = s.ratingsDetail.speed + '%';

            // Star Rating UI on Detailed Card
            const starContainer = document.getElementById('detStarsContainer');
            starContainer.innerHTML = '';
            const starsFull = Math.floor(s.rating);
            const starsHalf = s.rating % 1 >= 0.5 ? 1 : 0;
            const starsEmpty = 5 - starsFull - starsHalf;

            for (let i = 0; i < starsFull; i++) starContainer.innerHTML += '<i class="fa-solid fa-star"></i>';
            if (starsHalf) starContainer.innerHTML += '<i class="fa-solid fa-star-half-stroke"></i>';
            for (let i = 0; i < starsEmpty; i++) starContainer.innerHTML += '<i class="fa-regular fa-star"></i>';
            
            document.getElementById('detRatingText').textContent = `${s.rating} / 5.0`;

            // Tab 3: Customer Feedbacks List
            const feedbackContainer = document.getElementById('detCommentsContainer');
            feedbackContainer.innerHTML = '';
            if (s.comments.length === 0) {
                feedbackContainer.innerHTML = '<p class="text-muted small text-center py-3">Chưa có nhận xét nào từ khách hàng</p>';
            } else {
                s.comments.forEach(c => {
                    let cStars = '';
                    for (let i = 0; i < 5; i++) {
                        if (i < Math.floor(c.rating)) {
                            cStars += '<i class="fa-solid fa-star text-warning small"></i>';
                        } else {
                            cStars += '<i class="fa-regular fa-star text-warning small"></i>';
                        }
                    }

                    const card = document.createElement('div');
                    card.className = 'comment-card';
                    card.innerHTML = `
                        <div class="d-flex justify-content-between mb-2">
                            <span class="fw-bold text-dark small">${c.user}</span>
                            <div>${cStars}</div>
                        </div>
                        <p class="mb-0 text-muted small" style="line-height:1.4;">"${c.text}"</p>
                    `;
                    feedbackContainer.appendChild(card);
                });
            }

            // Show modal and draw Chart.js graph
            openModal('staffDetailsModal');

            // Set progress bars dynamically with a small delay for animation
            setTimeout(() => {
                svcBar.style.width = s.ratingsDetail.service + '%';
                attBar.style.width = s.ratingsDetail.attitude + '%';
                spdBar.style.width = s.ratingsDetail.speed + '%';
            }, 200);

            // Render tickets chart
            renderChart(s.monthlyPerformance);
        }
    };

    // 5. CHART.JS INTEGRATION
    const renderChart = (monthlyPerformance) => {
        const ctx = document.getElementById('performanceChartCanvas');
        if (!ctx) return;

        // Destroy previous chart if it exists
        if (performanceChart) {
            performanceChart.destroy();
        }

        const labels = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'];
        const data = monthlyPerformance || [0, 0, 0, 0, 0, 0];

        performanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số phiếu hỗ trợ xử lý',
                    data: data,
                    backgroundColor: 'rgba(238, 0, 51, 0.85)',
                    hoverBackgroundColor: 'rgba(44, 62, 80, 1)',
                    borderColor: '#EE0033',
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        padding: 10,
                        backgroundColor: '#1E293B',
                        titleColor: '#F8FAFC',
                        bodyColor: '#F8FAFC',
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawTicks: false
                        },
                        ticks: {
                            color: '#9CA3AF',
                            font: { family: 'Inter', size: 10 }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#9CA3AF',
                            font: { family: 'Inter', size: 10 }
                        }
                    }
                }
            }
        });
    };

    // 6. CUSTOM ACTIONS (RESET PASSWORD, LOCK, DELETE)
    const triggerResetPassword = (id) => {
        const staff = staffs.find(s => s.id === id);
        if (staff) {
            Swal.fire({
                title: 'Xác nhận reset mật khẩu?',
                text: `Hệ thống sẽ tạo mật khẩu mặc định cho nhân viên ${staff.fullname}`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Xác nhận',
                cancelButtonText: 'Hủy',
                confirmButtonColor: '#EE0033'
            }).then((result) => {
                if (result.isConfirmed) {
                    const numericId = parseInt(id.replace("STAFF", ""));
                    const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value;
                    const formData = new FormData();
                    formData.append('id', numericId);
                    if (token) formData.append('__RequestVerificationToken', token);

                    fetch('/Staff/ResetMatKhau', {
                        method: 'POST',
                        body: formData
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            showToast(data.message, 'success');
                        } else {
                            showToast(data.message || 'Lỗi khi reset mật khẩu', 'error');
                        }
                    })
                    .catch(err => showToast('Lỗi kết nối máy chủ', 'error'));
                }
            });
        }
    };

    const triggerLockUnlock = (id) => {
        const staff = staffs.find(s => s.id === id);
        if (staff) {
            const isLocking = staff.status === 'Hoạt động';
            
            Swal.fire({
                title: isLocking ? 'Xác nhận tạm khóa tài khoản?' : 'Xác nhận mở khóa tài khoản?',
                text: isLocking ? `Nhân viên ${staff.fullname} sẽ không thể đăng nhập hệ thống.` : `Nhân viên ${staff.fullname} có thể đăng nhập bình thường.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: isLocking ? 'Khóa tài khoản' : 'Mở khóa',
                cancelButtonText: 'Hủy',
                confirmButtonColor: isLocking ? '#EE0033' : '#10B981'
            }).then((result) => {
                if (result.isConfirmed) {
                    const numericId = parseInt(id.replace("STAFF", ""));
                    const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value;
                    const formData = new FormData();
                    formData.append('id', numericId);
                    if (token) formData.append('__RequestVerificationToken', token);

                    fetch('/Staff/KhoaNhanVien', {
                        method: 'POST',
                        body: formData
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            showToast(data.message, 'success');
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        } else {
                            showToast(data.message || 'Lỗi khi cập nhật trạng thái', 'error');
                        }
                    })
                    .catch(err => showToast('Lỗi kết nối máy chủ', 'error'));
                }
            });
        }
    };

    const triggerDelete = (id, name) => {
        Swal.fire({
            title: 'Không thể xóa nhân viên',
            text: `Nhân viên ${name} đã có lịch sử phiếu hỗ trợ liên kết. Vui lòng chuyển trạng thái tài khoản sang 'Tạm khóa' thay vì xóa trực tiếp để đảm bảo toàn vẹn dữ liệu lịch sử hệ thống.`,
            icon: 'warning',
            confirmButtonText: 'Tôi đã hiểu',
            confirmButtonColor: '#EE0033'
        });
    };

    // 7. EVENT DELEGATION FOR ACTIONS
    document.addEventListener('click', function (e) {
        // Action Buttons Handling
        const btnDetail = e.target.closest('.btn-detail');
        if (btnDetail) {
            e.preventDefault();
            const id = btnDetail.getAttribute('data-id');
            openDetailModal(id);
            return;
        }

        const btnEdit = e.target.closest('.btn-edit');
        if (btnEdit) {
            e.preventDefault();
            const id = btnEdit.getAttribute('data-id');
            openEditModal(id);
            return;
        }

        const btnResetPw = e.target.closest('.btn-reset-pw');
        if (btnResetPw) {
            e.preventDefault();
            const id = btnResetPw.getAttribute('data-id');
            triggerResetPassword(id);
            return;
        }

        const btnLock = e.target.closest('.btn-lock');
        if (btnLock) {
            e.preventDefault();
            const id = btnLock.getAttribute('data-id');
            triggerLockUnlock(id);
            return;
        }

        const btnDelete = e.target.closest('.btn-delete');
        if (btnDelete) {
            e.preventDefault();
            const id = btnDelete.getAttribute('data-id');
            const name = btnDelete.getAttribute('data-name');
            triggerDelete(id, name);
            return;
        }
    });

    // 8. FILTER RESET
    const btnResetFilter = document.getElementById('btnResetFilter');
    if (btnResetFilter) {
        btnResetFilter.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/Staff/QuanLyNhanVien';
        });
    }
});
