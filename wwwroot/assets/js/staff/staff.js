/* -------------------------------------------------------------
 * FILE: assets/js/staff/staff.js
 * AUTHOR: Antigravity
 * DESCRIPTION: Client-side logic for staff management dashboard (CRUD, Search, Chart.js, Modals)
 * ------------------------------------------------------------- */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // 1. MOCK DATA INITIALIZATION
    const INITIAL_STAFF = [
        {
            id: 'STAFF001',
            fullname: 'Nguyễn Hữu Nam',
            email: 'nam.nh@techsupport.viettel.vn',
            phone: '0981234567',
            address: 'Tòa nhà điều hành Viettel, Cần Thơ',
            username: 'nam.nh',
            role: 'Nhân viên',
            status: 'Hoạt động',
            ticketsHandled: 342,
            rating: 4.9,
            createdDate: '12/01/2026',
            avatar: 'https://ui-avatars.com/api/?name=Nguyen+Huu+Nam&background=4F46E5&color=fff&size=100',
            perfStats: { total: 350, completed: 342, processing: 5, waiting: 3 },
            monthlyPerformance: [42, 58, 65, 78, 99, 100],
            ratingsDetail: { service: 98, attitude: 100, speed: 96 },
            comments: [
                { user: 'Lê Văn Tám', rating: 5, text: 'Hỗ trợ cực kỳ nhiệt tình, sửa chữa lỗi kết nối wifi rất nhanh.' },
                { user: 'Trần Thị Chín', rating: 4.8, text: 'Tác phong chuyên nghiệp, hướng dẫn cẩn thận cách reset modem.' }
            ]
        },
        {
            id: 'STAFF002',
            fullname: 'Trần Thị Bình',
            email: 'binh.tt@techsupport.viettel.vn',
            phone: '0979876543',
            address: '1 Giang Văn Minh, Kim Mã, Hà Nội',
            username: 'binh.tt',
            role: 'Nhân viên',
            status: 'Hoạt động',
            ticketsHandled: 289,
            rating: 4.8,
            createdDate: '15/02/2026',
            avatar: 'https://ui-avatars.com/api/?name=Tran+Thi+Binh&background=10B981&color=fff&size=100',
            perfStats: { total: 300, completed: 289, processing: 8, waiting: 3 },
            monthlyPerformance: [30, 45, 52, 60, 72, 80],
            ratingsDetail: { service: 96, attitude: 98, speed: 95 },
            comments: [
                { user: 'Nguyễn Văn Đô', rating: 4.5, text: 'Nói chuyện nhỏ nhẹ lịch sự, khắc phục sự cố camera đám mây hoàn tất.' },
                { user: 'Phạm Minh Hải', rating: 5, text: 'Rất đúng giờ hẹn xử lý cáp quang!' }
            ]
        },
        {
            id: 'STAFF003',
            fullname: 'Nguyễn Văn Hùng',
            email: 'hung.nv@techsupport.viettel.vn',
            phone: '0966555444',
            address: 'Tòa nhà điều hành Viettel, Cần Thơ',
            username: 'hung.nv',
            role: 'Admin',
            status: 'Hoạt động',
            ticketsHandled: 512,
            rating: 4.9,
            createdDate: '01/01/2026',
            avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+Hung&background=7C3AED&color=fff&size=100',
            perfStats: { total: 520, completed: 512, processing: 4, waiting: 4 },
            monthlyPerformance: [80, 85, 90, 88, 92, 97],
            ratingsDetail: { service: 99, attitude: 99, speed: 99 },
            comments: [
                { user: 'Đỗ Hoàng Việt', rating: 5, text: 'Admin hỗ trợ phân bổ kỹ thuật viên trực tiếp cực kỳ nhanh chóng.' }
            ]
        },
        {
            id: 'STAFF004',
            fullname: 'Phạm Hồng Phúc',
            email: 'phuc.ph@techsupport.viettel.vn',
            phone: '0912112233',
            address: '210 Trần Phú, Ninh Kiều, Cần Thơ',
            username: 'phuc.ph',
            role: 'Nhân viên',
            status: 'Tạm khóa',
            ticketsHandled: 120,
            rating: 3.5,
            createdDate: '20/03/2026',
            avatar: 'https://ui-avatars.com/api/?name=Pham+Hong+Phuc&background=EF4444&color=fff&size=100',
            perfStats: { total: 150, completed: 120, processing: 10, waiting: 20 },
            monthlyPerformance: [25, 30, 35, 30, 0, 0],
            ratingsDetail: { service: 70, attitude: 68, speed: 72 },
            comments: [
                { user: 'Bùi Thị Hà', rating: 3, text: 'Đến muộn so với lịch hẹn hơn 1 tiếng và không phản hồi sớm.' }
            ]
        },
        {
            id: 'STAFF005',
            fullname: 'Lê Hoàng Long',
            email: 'long.lh@techsupport.viettel.vn',
            phone: '0989988776',
            address: '210 Trần Phú, Ninh Kiều, Cần Thơ',
            username: 'long.lh',
            role: 'Nhân viên',
            status: 'Hoạt động',
            ticketsHandled: 205,
            rating: 4.7,
            createdDate: '10/03/2026',
            avatar: 'https://ui-avatars.com/api/?name=Le+Hoang+Long&background=F59E0B&color=fff&size=100',
            perfStats: { total: 215, completed: 205, processing: 6, waiting: 4 },
            monthlyPerformance: [20, 35, 45, 50, 55, 65],
            ratingsDetail: { service: 94, attitude: 94, speed: 92 },
            comments: [
                { user: 'Vũ Quốc Anh', rating: 4.7, text: 'Thao tác cấu hình tường lửa server cực kỳ chuyên nghiệp.' }
            ]
        }
    ];

    let staffs = JSON.parse(localStorage.getItem('ts_staffs'));
    if (!staffs || staffs.length === 0) {
        staffs = INITIAL_STAFF;
        localStorage.setItem('ts_staffs', JSON.stringify(staffs));
    }

    // STATE CONTROL
    let selectedStaffId = null;
    let performanceChart = null;
    let currentPage = 1;
    let itemsPerPage = 5;

    // DOM ELEMENTS
    const tableBody = document.getElementById('staffTableBody');
    const mobileContainer = document.getElementById('staffMobileContainer');
    const paginationEl = document.getElementById('staffPagination');
    const searchInput = document.getElementById('searchStaff');
    const filterRole = document.getElementById('filterRole');
    const filterStatus = document.getElementById('filterStatus');
    const sortSelect = document.getElementById('sortSelect');
    
    // KPI elements
    const kpiTotal = document.getElementById('kpiTotalStaff');
    const kpiActive = document.getElementById('kpiActiveStaff');
    const kpiTickets = document.getElementById('kpiTicketsHandled');
    const kpiRating = document.getElementById('kpiAverageRating');
    
    // (Hero stats mapped directly to KPI grid cards)

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

    // 3. STATISTICAL SUMMARIES & KPI RENDERING
    const renderKPIs = () => {
        const total = staffs.length;
        const active = staffs.filter(s => s.status === 'Hoạt động').length;
        const blocked = staffs.filter(s => s.status === 'Tạm khóa').length;
        const admins = staffs.filter(s => s.role === 'Admin').length;
        const supports = staffs.filter(s => s.role === 'Nhân viên').length;
        
        const totalTickets = staffs.reduce((sum, s) => sum + s.ticketsHandled, 0);
        const avgRating = (staffs.reduce((sum, s) => sum + s.rating, 0) / total).toFixed(1);

        // Update top-level dashboard numbers
        if (kpiTotal) kpiTotal.textContent = total;
        if (kpiActive) kpiActive.textContent = active;
        if (kpiTickets) kpiTickets.textContent = totalTickets.toLocaleString('vi-VN');
        if (kpiRating) kpiRating.textContent = avgRating;

        // Update breakdowns dynamically
        const breakdownStaff = document.getElementById('kpiStaffBreakdown');
        if (breakdownStaff) breakdownStaff.textContent = `Admin: ${admins} | Kỹ thuật: ${supports}`;
        
        const breakdownBlocked = document.getElementById('kpiBlockedBreakdown');
        if (breakdownBlocked) breakdownBlocked.textContent = `Tạm khóa: ${blocked}`;
    };

    // 4. DATA RENDERING & SEARCH/FILTER ENGINE
    const getFilteredStaffs = () => {
        const q = searchInput.value.trim().toLowerCase();
        const role = filterRole.value;
        const status = filterStatus.value;
        const sort = sortSelect.value;

        let result = staffs.filter(s => {
            const matchQuery = s.fullname.toLowerCase().includes(q) || 
                               s.email.toLowerCase().includes(q) || 
                               s.phone.includes(q);
            const matchRole = role === 'all' || s.role === role;
            const matchStatus = status === 'all' || s.status === status;

            return matchQuery && matchRole && matchStatus;
        });

        // Sắp xếp
        if (sort === 'name-asc') {
            result.sort((a, b) => a.fullname.localeCompare(b.fullname, 'vi'));
        } else if (sort === 'name-desc') {
            result.sort((a, b) => b.fullname.localeCompare(a.fullname, 'vi'));
        } else if (sort === 'tickets-desc') {
            result.sort((a, b) => b.ticketsHandled - a.ticketsHandled);
        } else if (sort === 'rating-desc') {
            result.sort((a, b) => b.rating - a.rating);
        } else if (sort === 'newest') {
            // parse DD/MM/YYYY
            const parseDate = (dStr) => {
                const parts = dStr.split('/');
                return new Date(parts[2], parts[1] - 1, parts[0]);
            };
            result.sort((a, b) => parseDate(b.createdDate) - parseDate(a.createdDate));
        }

        return result;
    };

    const renderStaffs = () => {
        const filtered = getFilteredStaffs();
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Adjust currentPage if it overflows
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

        // Clear contents
        tableBody.innerHTML = '';
        mobileContainer.innerHTML = '';

        if (paginatedData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-muted">Không tìm thấy nhân viên phù hợp</td></tr>`;
            mobileContainer.innerHTML = `<div class="text-center py-4 text-muted">Không tìm thấy nhân viên phù hợp</div>`;
            renderPagination(0);
            return;
        }

        // Render Desktop & Mobile Views
        paginatedData.forEach((s, idx) => {
            const globalIndex = startIndex + idx + 1;
            
            // Build Desktop Row
            const tr = document.createElement('tr');
            tr.className = 'staff-row';
            tr.innerHTML = `
                <td>${globalIndex}</td>
                <td>
                    <div class="staff-avatar-wrap">
                        <img src="${s.avatar}" alt="Avatar" class="staff-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(s.fullname)}&background=4F46E5&color=fff'">
                        <div>
                            <div class="fw-bold text-dark">${s.fullname}</div>
                            <small class="text-muted font-monospace">${s.id}</small>
                        </div>
                    </div>
                </td>
                <td>${s.email}</td>
                <td>${s.phone}</td>
                <td><span class="badge-role ${s.role === 'Admin' ? 'admin' : 'staff'}">${s.role}</span></td>
                <td><span class="badge-status-staff ${s.status === 'Hoạt động' ? 'active' : 'blocked'}">${s.status}</span></td>
                <td class="text-center fw-bold">${s.ticketsHandled}</td>
                <td>
                    <div class="rating-stars">
                        <i class="fa-solid fa-star"></i>
                        <span class="fw-bold text-dark ms-1">${s.rating}</span>
                    </div>
                </td>
                <td class="font-monospace">${s.createdDate}</td>
                <td>
                    <div class="dropdown text-center">
                        <button class="action-btn-circle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0" style="border-radius: 12px; font-size:0.85rem;">
                            <li><a class="dropdown-item py-2 btn-detail" href="#" data-id="${s.id}"><i class="fa-solid fa-id-card me-2 text-primary"></i> Chi tiết</a></li>
                            <li><a class="dropdown-item py-2 btn-edit" href="#" data-id="${s.id}"><i class="fa-solid fa-user-pen me-2 text-warning"></i> Chỉnh sửa</a></li>
                            <li><a class="dropdown-item py-2 btn-reset-pw" href="#" data-id="${s.id}"><i class="fa-solid fa-key me-2 text-info"></i> Reset mật khẩu</a></li>
                            <li><a class="dropdown-item py-2 text-danger btn-lock" href="#" data-id="${s.id}">
                                <i class="fa-solid ${s.status === 'Hoạt động' ? 'fa-user-lock' : 'fa-user-check'} me-2"></i> 
                                ${s.status === 'Hoạt động' ? 'Khóa tài khoản' : 'Mở khóa'}
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item py-2 btn-view-appointments" href="#" data-id="${s.id}"><i class="fa-solid fa-calendar-days me-2 text-success"></i> Xem lịch hẹn</a></li>
                            <li><a class="dropdown-item py-2 btn-view-tickets" href="#" data-id="${s.id}"><i class="fa-solid fa-ticket-simple me-2 text-secondary"></i> Xem phiếu hỗ trợ</a></li>
                        </ul>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);

            // Build Mobile Card
            const mobileCard = document.createElement('div');
            mobileCard.className = 'mobile-staff-card';
            mobileCard.innerHTML = `
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <div class="d-flex align-items-center gap-2">
                        <img src="${s.avatar}" alt="Avatar" class="staff-avatar" style="width: 36px; height: 36px;">
                        <div>
                            <div class="fw-bold text-dark text-truncate" style="max-width: 140px;">${s.fullname}</div>
                            <span class="badge-role ${s.role === 'Admin' ? 'admin' : 'staff'}" style="font-size:0.6rem; padding: 2px 6px;">${s.role}</span>
                        </div>
                    </div>
                    <span class="badge-status-staff ${s.status === 'Hoạt động' ? 'active' : 'blocked'}" style="font-size:0.6rem; padding: 2px 6px;">${s.status}</span>
                </div>
                <div class="row g-2 mb-3" style="font-size: 0.8rem; color: var(--text-muted);">
                    <div class="col-6"><i class="fa-solid fa-phone me-1"></i> ${s.phone}</div>
                    <div class="col-6 text-end"><i class="fa-solid fa-ticket me-1"></i> ${s.ticketsHandled} Phiếu</div>
                    <div class="col-12 text-truncate"><i class="fa-solid fa-envelope me-1"></i> ${s.email}</div>
                    <div class="col-6"><i class="fa-solid fa-star text-warning me-1"></i> ${s.rating} Điểm</div>
                    <div class="col-6 text-end font-monospace">${s.createdDate}</div>
                </div>
                <div class="d-flex justify-content-end gap-1">
                    <button class="btn btn-sm btn-outline-primary py-1 px-2.5 btn-detail" data-id="${s.id}"><i class="fa-solid fa-id-card"></i></button>
                    <button class="btn btn-sm btn-outline-warning py-1 px-2.5 btn-edit" data-id="${s.id}"><i class="fa-solid fa-user-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger py-1 px-2.5 btn-lock" data-id="${s.id}">
                        <i class="fa-solid ${s.status === 'Hoạt động' ? 'fa-user-lock' : 'fa-user-check'}"></i>
                    </button>
                </div>
            `;
            mobileContainer.appendChild(mobileCard);
        });

        renderPagination(totalPages);
        bindActionButtons();
    };

    const renderPagination = (totalPages) => {
        paginationEl.innerHTML = '';
        if (totalPages <= 1) return;

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><i class="fa-solid fa-chevron-left"></i></a>`;
        if (currentPage > 1) {
            prevLi.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage--;
                renderStaffs();
            });
        }
        paginationEl.appendChild(prevLi);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${currentPage === i ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i;
                renderStaffs();
            });
            paginationEl.appendChild(li);
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><i class="fa-solid fa-chevron-right"></i></a>`;
        if (currentPage < totalPages) {
            nextLi.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage++;
                renderStaffs();
            });
        }
        paginationEl.appendChild(nextLi);
    };

    // 5. EVENT HANDLERS & BINDINGS FOR ACTION BUTTONS
    const bindActionButtons = () => {
        // Details buttons
        document.querySelectorAll('.btn-detail').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                openDetailModal(id);
            });
        });

        // Edit buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                openEditModal(id);
            });
        });

        // Reset password
        document.querySelectorAll('.btn-reset-pw').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                const staff = staffs.find(s => s.id === id);
                if (staff) {
                    Swal.fire({
                        title: 'Xác nhận reset mật khẩu?',
                        text: `Hệ thống sẽ tạo mật khẩu ngẫu nhiên cho nhân viên ${staff.fullname}`,
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Xác nhận',
                        cancelButtonText: 'Hủy',
                        confirmButtonColor: '#4F46E5'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            showToast(`✅ Đã reset mật khẩu của ${staff.fullname} thành: 'Viettel@1234'`, 'success');
                        }
                    });
                }
            });
        });

        // Lock / Unlock
        document.querySelectorAll('.btn-lock').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                const staffIdx = staffs.findIndex(s => s.id === id);
                if (staffIdx !== -1) {
                    const staff = staffs[staffIdx];
                    const isLocking = staff.status === 'Hoạt động';
                    
                    Swal.fire({
                        title: isLocking ? 'Xác nhận tạm khóa tài khoản?' : 'Xác nhận mở khóa tài khoản?',
                        text: isLocking ? `Nhân viên ${staff.fullname} sẽ không thể đăng nhập hệ thống.` : `Nhân viên ${staff.fullname} có thể đăng nhập bình thường.`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: isLocking ? 'Khóa tài khoản' : 'Mở khóa',
                        cancelButtonText: 'Hủy',
                        confirmButtonColor: isLocking ? '#EF4444' : '#10B981'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            staff.status = isLocking ? 'Tạm khóa' : 'Hoạt động';
                            localStorage.setItem('ts_staffs', JSON.stringify(staffs));
                            renderStaffs();
                            renderKPIs();
                            renderTopPerformers();
                            showToast(`✅ Đã ${isLocking ? 'tạm khóa' : 'mở khóa'} tài khoản của ${staff.fullname}`, 'success');
                        }
                    });
                }
            });
        });

        // View appointments
        document.querySelectorAll('.btn-view-appointments').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                const staff = staffs.find(s => s.id === id);
                if (staff) {
                    Swal.fire({
                        title: `Lịch hẹn kỹ thuật của ${staff.fullname}`,
                        html: `<div class="text-start p-2" style="font-size:0.9rem;">
                                    <p class="mb-2"><strong>🗓️ Hôm nay (17/06/2026):</strong></p>
                                    <ul>
                                        <li>09:30 - Xử lý mạng LAN (Khách hàng: Trần Văn An)</li>
                                        <li>14:00 - Sửa lỗi camera (Khách hàng: Lê Hữu Dũng)</li>
                                    </ul>
                                    <p class="mt-3 mb-2"><strong>🗓️ Ngày mai (18/06/2026):</strong></p>
                                    <ul>
                                        <li>10:00 - Lắp ráp PC Mesh (Khách hàng: Nguyễn Thị Thu)</li>
                                    </ul>
                               </div>`,
                        icon: 'info',
                        confirmButtonText: 'Đóng',
                        confirmButtonColor: '#4F46E5'
                    });
                }
            });
        });

        // View tickets
        document.querySelectorAll('.btn-view-tickets').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                const staff = staffs.find(s => s.id === id);
                if (staff) {
                    Swal.fire({
                        title: `Phiếu hỗ trợ của ${staff.fullname}`,
                        html: `<div class="text-start p-2" style="font-size:0.9rem;">
                                    <div class="d-flex justify-content-between border-bottom py-1.5">
                                        <span><strong>#HT00109</strong> (Cài đặt wifi Mesh)</span>
                                        <span class="badge bg-success-subtle text-success">Đã đóng</span>
                                    </div>
                                    <div class="d-flex justify-content-between border-bottom py-1.5">
                                        <span><strong>#HT00122</strong> (Rớt mạng cáp quang)</span>
                                        <span class="badge bg-warning-subtle text-warning">Đang xử lý</span>
                                    </div>
                                    <div class="d-flex justify-content-between py-1.5">
                                        <span><strong>#HT00130</strong> (Khôi phục Cloud Camera)</span>
                                        <span class="badge bg-warning-subtle text-warning">Đang xử lý</span>
                                    </div>
                               </div>`,
                        icon: 'info',
                        confirmButtonText: 'Đóng',
                        confirmButtonColor: '#4F46E5'
                    });
                }
            });
        });
    };

    // 6. TOP PERFORMERS AREA
    const renderTopPerformers = () => {
        const topContainer = document.getElementById('topPerformersList');
        if (!topContainer) return;

        // Filter active staff and sort by completed tickets
        const activeStaffs = staffs.filter(s => s.status === 'Hoạt động' && s.role !== 'Admin');
        activeStaffs.sort((a, b) => b.ticketsHandled - a.ticketsHandled);
        
        // Take top 5
        const top5 = activeStaffs.slice(0, 5);

        topContainer.innerHTML = '';
        if (top5.length === 0) {
            topContainer.innerHTML = '<div class="text-center py-3 text-muted">Chưa có dữ liệu</div>';
            return;
        }

        top5.forEach((s, index) => {
            let medal = '';
            if (index === 0) medal = '<span class="medal-badge">🥇</span>';
            else if (index === 1) medal = '<span class="medal-badge">🥈</span>';
            else if (index === 2) medal = '<span class="medal-badge">🥉</span>';
            else medal = `<span class="fw-bold text-muted ms-2" style="font-size:1.1rem; width:24px; display:inline-block;">${index + 1}</span>`;

            const item = document.createElement('div');
            item.className = 'top-performer-item';
            item.innerHTML = `
                <div class="d-flex align-items-center gap-3">
                    ${medal}
                    <img src="${s.avatar}" alt="Avatar" class="staff-avatar" style="width: 38px; height: 38px;">
                    <div>
                        <div class="fw-bold text-dark" style="font-size:0.9rem;">${s.fullname}</div>
                        <small class="text-muted"><i class="fa-solid fa-star text-warning" style="font-size:0.75rem;"></i> ${s.rating} | ${s.ticketsHandled} Phiếu</small>
                    </div>
                </div>
                <div>
                    <span class="badge bg-primary-subtle text-primary rounded-pill px-2.5 py-1" style="font-size:0.75rem; font-weight:700;">Top Perf</span>
                </div>
            `;
            topContainer.appendChild(item);
        });
    };

    // 7. CHART.JS INTEGRATION
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
                    backgroundColor: 'rgba(79, 70, 229, 0.85)',
                    hoverBackgroundColor: 'rgba(124, 58, 237, 1)',
                    borderColor: '#4F46E5',
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

    // 8. ADD/EDIT STAFF MODAL MANAGEMENT
    const staffForm = document.getElementById('staffForm');
    const modalTitle = document.getElementById('addStaffModalLabel');
    const inputAvatar = document.getElementById('staffAvatarInput');
    const imgPreview = document.getElementById('staffAvatarPreview');

    // Modal open/close helpers
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
        resetForm();
        openModal('addStaffModal');
        setTimeout(() => document.getElementById('staffName').focus(), 300);
    };

    window.closeAddStaffModal = () => {
        closeModal('addStaffModal');
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

    // Avatar preview upload handler
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

    const openEditModal = (id) => {
        selectedStaffId = id;
        const s = staffs.find(staff => staff.id === id);
        if (s) {
            modalTitle.innerHTML = `<i class="fa-solid fa-user-gear me-2"></i>Chỉnh Sửa Thông Tin Nhân Viên`;
            
            // Populate form
            document.getElementById('staffName').value = s.fullname;
            document.getElementById('staffEmail').value = s.email;
            document.getElementById('staffPhone').value = s.phone;
            document.getElementById('staffAddress').value = s.address;
            document.getElementById('staffUsername').value = s.username;
            document.getElementById('staffUsername').disabled = true; // Disable editing username
            document.getElementById('staffPasswordGroup').classList.add('d-none'); // Hide password input
            document.getElementById('staffPassword').required = false;
            document.getElementById('staffRole').value = s.role;
            document.getElementById('staffStatus').value = s.status;
            imgPreview.src = s.avatar;

            openModal('addStaffModal');
        }
    };

    const resetForm = () => {
        selectedStaffId = null;
        modalTitle.innerHTML = `<i class="fa-solid fa-user-plus me-2"></i>Thêm Thành Viên Mới`;
        staffForm.reset();
        document.getElementById('staffUsername').disabled = false;
        document.getElementById('staffPasswordGroup').classList.remove('d-none');
        document.getElementById('staffPassword').required = true;
        imgPreview.src = 'https://ui-avatars.com/api/?name=New+Staff&background=4F46E5&color=fff&size=100';
        staffForm.classList.remove('was-validated');
    };

    // Export resetting function to trigger on button click
    window.resetStaffForm = resetForm;

    staffForm.addEventListener('submit', function (e) {
        e.preventDefault();
        
        if (!this.checkValidity()) {
            e.stopPropagation();
            this.classList.add('was-validated');
            return;
        }

        const name = document.getElementById('staffName').value.trim();
        const email = document.getElementById('staffEmail').value.trim();
        const phone = document.getElementById('staffPhone').value.trim();
        const address = document.getElementById('staffAddress').value.trim();
        const username = document.getElementById('staffUsername').value.trim();
        const role = document.getElementById('staffRole').value;
        const status = document.getElementById('staffStatus').value;
        const avatarSrc = imgPreview.src;

        if (selectedStaffId) {
            // Edit flow
            const sIdx = staffs.findIndex(s => s.id === selectedStaffId);
            if (sIdx !== -1) {
                staffs[sIdx].fullname = name;
                staffs[sIdx].email = email;
                staffs[sIdx].phone = phone;
                staffs[sIdx].address = address;
                staffs[sIdx].role = role;
                staffs[sIdx].status = status;
                staffs[sIdx].avatar = avatarSrc;

                localStorage.setItem('ts_staffs', JSON.stringify(staffs));
                showToast(`✅ Đã cập nhật thành công nhân viên ${name}`);
            }
        } else {
            // Create flow
            // Check duplicate username
            if (staffs.some(s => s.username === username)) {
                showToast(`❌ Tên đăng nhập '${username}' đã tồn tại!`, 'error');
                return;
            }

            const newId = 'STAFF' + String(staffs.length + 1).padStart(3, '0');
            const formattedDate = new Date().toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            const newStaff = {
                id: newId,
                fullname: name,
                email: email,
                phone: phone,
                address: address,
                username: username,
                role: role,
                status: status,
                ticketsHandled: 0,
                rating: 5.0,
                createdDate: formattedDate,
                avatar: avatarSrc.includes('ui-avatars.com') ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff&size=100` : avatarSrc,
                perfStats: { total: 0, completed: 0, processing: 0, waiting: 0 },
                monthlyPerformance: [0, 0, 0, 0, 0, 0],
                ratingsDetail: { service: 100, attitude: 100, speed: 100 },
                comments: []
            };

            staffs.push(newStaff);
            localStorage.setItem('ts_staffs', JSON.stringify(staffs));
            showToast(`✅ Đã thêm mới thành công nhân viên ${name}`);
        }

        closeModal('addStaffModal');
        renderStaffs();
        renderKPIs();
        renderTopPerformers();
        resetForm();
    });

    // 9. DETAILS MODAL & CHART RENDERING HANDLER
    const detailEl = document.getElementById('staffDetailsModal');

    const openDetailModal = (id) => {
        const s = staffs.find(staff => staff.id === id);
        if (s) {
            // Tab 1: Personal Info
            document.getElementById('detAvatar').src = s.avatar;
            document.getElementById('detName').textContent = s.fullname;
            document.getElementById('detIdBadge').textContent = s.id;
            
            const roleEl = document.getElementById('detRoleBadge');
            roleEl.className = `badge-role ${s.role === 'Admin' ? 'admin' : 'staff'}`;
            roleEl.textContent = s.role;

            const statusEl = document.getElementById('detStatusBadge');
            statusEl.className = `badge-status-staff ${s.status === 'Hoạt động' ? 'active' : 'blocked'}`;
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

    // 10. DYNAMIC FILTERS & LIVE EVENTS
    searchInput.addEventListener('input', () => {
        currentPage = 1;
        renderStaffs();
    });

    filterRole.addEventListener('change', () => {
        currentPage = 1;
        renderStaffs();
    });

    filterStatus.addEventListener('change', () => {
        currentPage = 1;
        renderStaffs();
    });

    sortSelect.addEventListener('change', () => {
        currentPage = 1;
        renderStaffs();
    });

    // Excel Export Simulation
    const btnExcel = document.getElementById('btnExportExcel');
    if (btnExcel) {
        btnExcel.addEventListener('click', (e) => {
            e.preventDefault();
            Swal.fire({
                title: 'Xuất dữ liệu Excel?',
                text: 'Hệ thống sẽ tải xuống bảng dữ liệu của toàn bộ nhân viên.',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Tải xuống',
                cancelButtonText: 'Hủy',
                confirmButtonColor: '#4F46E5'
            }).then((result) => {
                if (result.isConfirmed) {
                    showToast('✅ Đã xuất báo cáo nhân viên ra file Excel thành công!', 'success');
                }
            });
        });
    }

    // Refresh simulation
    const btnRefresh = document.getElementById('btnRefresh');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', (e) => {
            e.preventDefault();
            searchInput.value = '';
            filterRole.value = 'all';
            filterStatus.value = 'all';
            sortSelect.value = 'newest';
            currentPage = 1;
            
            showToast('🔄 Đã làm mới dữ liệu hệ thống!', 'success');
            renderStaffs();
            renderKPIs();
            renderTopPerformers();
        });
    }

    // Initialize display on startup
    renderStaffs();
    renderKPIs();
    renderTopPerformers();
});
