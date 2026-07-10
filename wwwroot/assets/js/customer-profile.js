/* --------------------------------------------------------------------------
   FILE: assets/js/customer-profile.js
   AUTHOR: Antigravity
   DESCRIPTION: Frontend logic for Customer Profile page (TechSupport Viettel)
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ==================== 1. DATA SCHEMA & FALLBACK SYSTEM ====================
    
    // Default Mock User
    const DEFAULT_MOCK_USER = {
        fullname: "Nguyễn Văn An",
        phone: "0987654321",
        email: "nguyenvanan@gmail.com",
        identity: "012345678912",
        address: "210 Đường Trần Phú, Phường Cái Khế, Quận Ninh Kiều, Cần Thơ",
        customerCode: "VT-889922",
        password: "password123",
        joinDate: "01/01/2026",
        status: "active"
    };

    // Default Mock Tickets (exactly 12 tickets matching stats targets)
    const DEFAULT_MOCK_TICKETS = [
        {
            code: "PT001",
            category: "Mất kết nối",
            service: "Internet Cáp Quang",
            date: "01/06/2026",
            status: "processing", // pending, processing, completed, cancelled
            statusText: "Đang xử lý",
            priority: "Cao"
        },
        {
            code: "PT002",
            category: "Camera không ghi hình",
            service: "Home Camera Viettel",
            date: "02/06/2026",
            status: "pending",
            statusText: "Chờ tiếp nhận",
            priority: "Trung bình"
        },
        {
            code: "PT003",
            category: "Hết tài nguyên Cloud VPS",
            service: "Server & Cloud VPS",
            date: "03/06/2026",
            status: "processing",
            statusText: "Đang xử lý",
            priority: "Cao"
        },
        {
            code: "PT004",
            category: "Đổi mật khẩu Wifi",
            service: "Internet Cáp Quang",
            date: "04/06/2026",
            status: "completed",
            statusText: "Đã hoàn thành",
            priority: "Thấp"
        },
        {
            code: "PT005",
            category: "Lỗi phần mềm hóa đơn",
            service: "Phần mềm & Mạng nội bộ",
            date: "05/06/2026",
            status: "completed",
            statusText: "Đã hoàn thành",
            priority: "Trung bình"
        },
        {
            code: "PT006",
            category: "Tín hiệu chập chờn",
            service: "Internet Cáp Quang",
            date: "06/06/2026",
            status: "processing",
            statusText: "Đang xử lý",
            priority: "Cao"
        },
        {
            code: "PT007",
            category: "Camera không kết nối Wifi",
            service: "Home Camera Viettel",
            date: "07/06/2026",
            status: "pending",
            statusText: "Chờ tiếp nhận",
            priority: "Trung bình"
        },
        {
            code: "PT008",
            category: "Lỗi kết nối CSDL MySQL",
            service: "Server & Cloud VPS",
            date: "08/06/2026",
            status: "processing",
            statusText: "Đang xử lý",
            priority: "Cao"
        },
        {
            code: "PT009",
            category: "Đứt cáp quang thuê bao",
            service: "Internet Cáp Quang",
            date: "09/06/2026",
            status: "processing",
            statusText: "Đang xử lý",
            priority: "Cao"
        },
        {
            code: "PT010",
            category: "Cấu hình mạng LAN văn phòng",
            service: "Phần mềm & Mạng nội bộ",
            date: "10/06/2026",
            status: "completed",
            statusText: "Đã hoàn thành",
            priority: "Trung bình"
        },
        {
            code: "PT011",
            category: "Thay đổi vị trí lắp đặt",
            service: "Home Camera Viettel",
            date: "11/06/2026",
            status: "completed",
            statusText: "Đã hoàn thành",
            priority: "Thấp"
        },
        {
            code: "PT012",
            category: "Khởi động lại Server vật lý",
            service: "Server & Cloud VPS",
            date: "12/06/2026",
            status: "completed",
            statusText: "Đã hoàn thành",
            priority: "Thấp"
        }
    ];

    // Default Mock Appointments
    const DEFAULT_MOCK_APPOINTMENTS = [
        {
            id: "AP-552",
            date: "12/06/2026",
            time: "14:00 - 16:00",
            title: "Cấu hình thiết bị Home Wifi phụ",
            desc: "Kỹ thuật viên qua nhà di dời cục Wifi phụ tầng 2 và cấu hình lại Mesh.",
            staffName: "Trần Minh Quân",
            staffCode: "NV-4889",
            staffPhone: "0912345678",
            active: true
        },
        {
            id: "AP-489",
            date: "15/06/2026",
            time: "09:00 - 11:30",
            title: "Bảo trì định kỳ hệ thống Camera",
            desc: "Vệ sinh mắt đọc Camera, cập nhật firmware và kiểm tra dung lượng ổ cứng đầu ghi.",
            staffName: "Phạm Thanh Sơn",
            staffCode: "NV-1205",
            staffPhone: "0988776655",
            active: false
        }
    ];

    // Initialize mock database in localStorage if empty
    const initLocalStorageDatabases = () => {
        // Users database
        let users = JSON.parse(localStorage.getItem('techsupport_users') || '[]');
        const userExists = users.some(u => u.email === DEFAULT_MOCK_USER.email || u.phone === DEFAULT_MOCK_USER.phone);
        if (!userExists) {
            users.push(DEFAULT_MOCK_USER);
            localStorage.setItem('techsupport_users', JSON.stringify(users));
        }

        // Force overwrite tickets list if length is not 12 to ensure mock values are correct
        const existingTickets = JSON.parse(localStorage.getItem('techsupport_tickets') || '[]');
        if (existingTickets.length !== 12 || !existingTickets.some(t => t.code === 'PT001')) {
            localStorage.setItem('techsupport_tickets', JSON.stringify(DEFAULT_MOCK_TICKETS));
        }

        // Appointments database
        if (!localStorage.getItem('techsupport_appointments')) {
            localStorage.setItem('techsupport_appointments', JSON.stringify(DEFAULT_MOCK_APPOINTMENTS));
        }
    };

    // Initialize session if not logged in
    const initSessionState = () => {
        const sessionStr = sessionStorage.getItem('techsupport_session');
        const legacyName = sessionStorage.getItem('ts_customer_name') || localStorage.getItem('ts_customer_name');
        
        let loggedInUser = null;

        if (sessionStr) {
            try {
                const sessionData = JSON.parse(sessionStr);
                if (sessionData && sessionData.isLoggedIn && sessionData.user) {
                    loggedInUser = sessionData.user;
                }
            } catch (e) {
                console.error("Error parsing session storage:", e);
            }
        }

        // Handle fallback login for testing
        if (!loggedInUser) {
            let users = JSON.parse(localStorage.getItem('techsupport_users') || '[]');
            
            // Try to find by legacy name or just fallback to default mock user
            let userObj = null;
            if (legacyName) {
                userObj = users.find(u => u.fullname === legacyName);
            }
            if (!userObj) {
                userObj = users.find(u => u.email === DEFAULT_MOCK_USER.email);
            }
            if (!userObj) {
                userObj = DEFAULT_MOCK_USER;
            }

            // Write session
            const newSession = {
                isLoggedIn: true,
                user: {
                    fullname: userObj.fullname,
                    email: userObj.email,
                    phone: userObj.phone,
                    loginTime: new Date().toISOString()
                }
            };
            sessionStorage.setItem('techsupport_session', JSON.stringify(newSession));
            sessionStorage.setItem('ts_customer_name', userObj.fullname);
            loggedInUser = newSession.user;
        }

        return loggedInUser;
    };

    // Core setup
    initLocalStorageDatabases();
    const activeSessionUser = initSessionState();

    // ==================== 2. APPLICATION STATE & DATABASES ====================
    let usersDb = JSON.parse(localStorage.getItem('techsupport_users') || '[]');
    let currentUser = usersDb.find(u => u.email === activeSessionUser.email || u.phone === activeSessionUser.phone) || DEFAULT_MOCK_USER;
    
    let ticketsList = JSON.parse(localStorage.getItem('techsupport_tickets') || '[]');
    let appointmentsList = JSON.parse(localStorage.getItem('techsupport_appointments') || '[]');

    // Active Ticket Filters
    let currentFilter = 'all';
    let currentPage = 1;
    const itemsPerPage = 5;

    // DOM References
    // DOM References
    const statTotalTickets = document.getElementById('statTotalTickets');
    const statPendingTickets = document.getElementById('statPendingTickets');
    const statCompletedTickets = document.getElementById('statCompletedTickets');

    const profileInitials = document.getElementById('profileInitials');
    const sidebarUserFullname = document.getElementById('sidebarUserFullname');
    const sidebarUserJoinDate = document.getElementById('sidebarUserJoinDate');

    const ticketsTableBody = document.getElementById('ticketsTableBody');
    const ticketsPagination = document.getElementById('ticketsPagination');
    const appointmentsTimeline = document.getElementById('appointmentsTimeline');

    // ==================== 3. RENDER FUNCTIONS ====================
    
    // Get Initials from Full Name
    const getInitials = (name) => {
        if (!name) return "VT";
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            const first = parts[parts.length - 2].charAt(0).toUpperCase();
            const second = parts[parts.length - 1].charAt(0).toUpperCase();
            return first + second;
        }
        return name.charAt(0).toUpperCase();
    };

    // Set Statistic Targets
    const updateStatsTargets = () => {
        const total = ticketsList.length;
        const pending = ticketsList.filter(t => t.status === 'pending').length;
        const processing = ticketsList.filter(t => t.status === 'processing').length;
        const completed = ticketsList.filter(t => t.status === 'completed').length;

        if (statTotalTickets) statTotalTickets.setAttribute('data-target', total.toString());
        if (statPendingTickets) statPendingTickets.setAttribute('data-target', pending.toString());
        
        const statProcessingTickets = document.getElementById('statProcessingTickets');
        if (statProcessingTickets) statProcessingTickets.setAttribute('data-target', processing.toString());
        
        if (statCompletedTickets) statCompletedTickets.setAttribute('data-target', completed.toString());

        // Animate counter values
        const counters = document.querySelectorAll('.counter-value');
        const duration = 1200; // 1.2s animation duration

        counters.forEach(counter => {
            counter.classList.add('animated'); // Prevent main.js from double-animating
            const target = parseInt(counter.getAttribute('data-target'), 10) || 0;
            let startTime = null;

            const step = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                const easeValue = progress * (2 - progress); // Ease out quad
                counter.textContent = Math.floor(easeValue * target);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    counter.textContent = target;
                }
            };

            window.requestAnimationFrame(step);
        });
    };

    // Populate profile inputs helper
    const resetInlineFormValues = () => {
        const fullnameEl = document.getElementById('profileFullname');
        const phoneEl = document.getElementById('profilePhone');
        const emailEl = document.getElementById('profileEmail');
        const identityEl = document.getElementById('profileIdentity');
        const addressEl = document.getElementById('profileAddress');
        const joinDateEl = document.getElementById('profileJoinDate');
        const codeEl = document.getElementById('profileUserCode');

        if (fullnameEl) fullnameEl.value = currentUser.fullname;
        if (phoneEl) phoneEl.value = currentUser.phone;
        if (emailEl) emailEl.value = currentUser.email || '';
        if (identityEl) identityEl.value = currentUser.identity;
        if (addressEl) addressEl.value = currentUser.address;
        if (joinDateEl) joinDateEl.value = currentUser.joinDate;
        if (codeEl) codeEl.value = currentUser.customerCode;
    };

    // Render User Details
    const renderUserProfile = () => {
        if (sidebarUserFullname) sidebarUserFullname.textContent = currentUser.fullname;
        if (profileInitials) {
            profileInitials.textContent = getInitials(currentUser.fullname);
        }
        if (sidebarUserJoinDate) sidebarUserJoinDate.textContent = currentUser.joinDate;
        resetInlineFormValues();
    };

    // Render Tickets Table with Filter & Pagination
    const ticketSearchInput = document.getElementById('ticketSearchInput');
    const ticketStatusFilter = document.getElementById('ticketStatusFilter');
    const btnSearchTickets = document.getElementById('btnSearchTickets');

    const renderTicketsTable = () => {
        if (!ticketsTableBody) return;

        let filteredTickets = ticketsList;

        // Apply Status Filter
        const statusVal = ticketStatusFilter ? ticketStatusFilter.value : 'all';
        if (statusVal !== 'all') {
            filteredTickets = filteredTickets.filter(t => t.status === statusVal);
        }

        // Apply Search Query Filter
        const query = ticketSearchInput ? ticketSearchInput.value.trim().toLowerCase() : '';
        if (query) {
            filteredTickets = filteredTickets.filter(t => 
                t.code.toLowerCase().includes(query) ||
                t.service.toLowerCase().includes(query) ||
                t.category.toLowerCase().includes(query)
            );
        }

        // Calculate pages
        const totalItems = filteredTickets.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
        
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

        ticketsTableBody.innerHTML = '';

        if (paginatedTickets.length === 0) {
            ticketsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="table-empty-state">
                        <i class="bi bi-ticket-perforated"></i>
                        <p>Không tìm thấy phiếu hỗ trợ nào phù hợp.</p>
                    </td>
                </tr>
            `;
            if (ticketsPagination) ticketsPagination.style.display = 'none';
            return;
        }

        // Populate rows
        paginatedTickets.forEach((ticket, idx) => {
            const tr = document.createElement('tr');
            
            let badgeClass = 'badge-pending';
            if (ticket.status === 'processing') badgeClass = 'badge-processing';
            if (ticket.status === 'completed') badgeClass = 'badge-completed';
            if (ticket.status === 'cancelled') badgeClass = 'badge-cancelled';

            let prioClass = 'text-warning';
            let prioText = ticket.priority || 'Trung bình';
            if (prioText === 'Cao') prioClass = 'text-danger fw-bold';
            if (prioText === 'Thấp') prioClass = 'text-muted';

            tr.innerHTML = `
                <td data-label="STT">${startIndex + idx + 1}</td>
                <td data-label="Mã phiếu" class="ticket-code">${ticket.code}</td>
                <td data-label="Dịch vụ">${ticket.service}</td>
                <td data-label="Loại sự cố">${ticket.category}</td>
                <td data-label="Ngày tạo">${ticket.date}</td>
                <td data-label="Trạng thái">
                    <span class="badge ${badgeClass}">${ticket.statusText}</span>
                </td>
                <td data-label="Mức ưu tiên" class="${prioClass}">${prioText}</td>
                <td data-label="Thao tác">
                    <button class="btn-table-action btn-view-ticket" data-code="${ticket.code}">
                        Xem <i class="bi bi-eye ms-1"></i>
                    </button>
                </td>
            `;
            ticketsTableBody.appendChild(tr);
        });

        // Add event listeners to "Xem" buttons
        const viewButtons = ticketsTableBody.querySelectorAll('.btn-view-ticket');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const code = this.getAttribute('data-code');
                openTicketDetailModal(code);
            });
        });

        // Render Pagination Info and Controls
        if (ticketsPagination) {
            ticketsPagination.style.display = 'flex';
            
            const infoEl = ticketsPagination.querySelector('.pagination-info');
            if (infoEl) {
                infoEl.textContent = `Hiển thị ${startIndex + 1}-${endIndex} trong số ${totalItems} phiếu`;
            }

            const buttonsWrapper = ticketsPagination.querySelector('.pagination-buttons');
            if (buttonsWrapper) {
                buttonsWrapper.innerHTML = '';

                // Prev button
                const prevBtn = document.createElement('button');
                prevBtn.className = 'btn-page-arrow';
                prevBtn.innerHTML = '<i class="bi bi-chevron-left"></i>';
                prevBtn.disabled = currentPage === 1;
                prevBtn.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        renderTicketsTable();
                    }
                });
                buttonsWrapper.appendChild(prevBtn);

                // Page numbers
                for (let i = 1; i <= totalPages; i++) {
                    const pageBtn = document.createElement('button');
                    pageBtn.className = `btn-page-number ${currentPage === i ? 'active' : ''}`;
                    pageBtn.textContent = i;
                    pageBtn.addEventListener('click', () => {
                        currentPage = i;
                        renderTicketsTable();
                    });
                    buttonsWrapper.appendChild(pageBtn);
                }

                // Next button
                const nextBtn = document.createElement('button');
                nextBtn.className = 'btn-page-arrow';
                nextBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
                nextBtn.disabled = currentPage === totalPages;
                nextBtn.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        renderTicketsTable();
                    }
                });
                buttonsWrapper.appendChild(nextBtn);
            }
        }
    };

    if (btnSearchTickets) {
        btnSearchTickets.addEventListener('click', () => {
            currentPage = 1;
            renderTicketsTable();
        });
    }

    if (ticketStatusFilter) {
        ticketStatusFilter.addEventListener('change', () => {
            currentPage = 1;
            renderTicketsTable();
        });
    }

    if (ticketSearchInput) {
        ticketSearchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                currentPage = 1;
                renderTicketsTable();
            }
        });
    }

    // Render Appointments Timeline
    const renderAppointmentsTimeline = () => {
        if (!appointmentsTimeline) return;

        appointmentsTimeline.innerHTML = '';

        if (appointmentsList.length === 0) {
            appointmentsTimeline.innerHTML = `
                <div class="timeline-empty-state">
                    <i class="bi bi-calendar-check"></i>
                    <p>Hiện tại bạn không có lịch hẹn hỗ trợ nào sắp diễn ra.</p>
                </div>
            `;
            return;
        }

        appointmentsList.forEach(appointment => {
            const item = document.createElement('div');
            item.className = `timeline-item ${appointment.active ? 'active' : ''}`;
            
            item.innerHTML = `
                <div class="timeline-bullet"></div>
                <div class="timeline-card">
                    <div class="timeline-date-time">
                        <span><i class="bi bi-calendar3"></i> ${appointment.date}</span>
                        <span><i class="bi bi-clock"></i> ${appointment.time}</span>
                    </div>
                    <h4 class="timeline-title">${appointment.title}</h4>
                    <p class="timeline-desc">${appointment.desc}</p>
                    <div class="timeline-staff">
                        <div class="staff-info-item">
                            <i class="bi bi-person-badge text-danger"></i>
                            <span>Kỹ thuật viên: <strong>${appointment.staffName}</strong> (${appointment.staffCode})</span>
                        </div>
                        <div class="staff-info-item">
                            <i class="bi bi-telephone text-success"></i>
                            <span>Hotline: <a href="tel:${appointment.staffPhone}" class="text-decoration-none text-muted"><strong>${appointment.staffPhone}</strong></a></span>
                        </div>
                    </div>
                    <div class="appointment-card-actions mt-3 d-flex gap-2 justify-content-end">
                        <button type="button" class="btn btn-sm btn-outline-danger btn-view-appointment-detail" data-id="${appointment.id}">
                            <i class="bi bi-info-circle"></i> Xem chi tiết
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary btn-reschedule-appointment" data-id="${appointment.id}">
                            <i class="bi bi-calendar-event"></i> Đổi lịch
                        </button>
                    </div>
                </div>
            `;
            appointmentsTimeline.appendChild(item);
        });

        // Add event listeners
        const viewDetailBtns = appointmentsTimeline.querySelectorAll('.btn-view-appointment-detail');
        viewDetailBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const app = appointmentsList.find(a => a.id === id);
                if (app) {
                    showProfileToast(`📅 Chi tiết lịch hẹn: ${app.title} vào ${app.time} ngày ${app.date}. Kỹ thuật viên phụ trách: ${app.staffName}.`, 'info');
                }
            });
        });

        const rescheduleBtns = appointmentsTimeline.querySelectorAll('.btn-reschedule-appointment');
        rescheduleBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const app = appointmentsList.find(a => a.id === id);
                if (app) {
                    openRescheduleModal(app);
                }
            });
        });
    };

    const openRescheduleModal = (app) => {
        document.getElementById('rescheduleAppointmentId').value = app.id;
        document.getElementById('rescheduleCurrentDetails').value = `${app.date} | ${app.time} - ${app.title}`;
        document.getElementById('rescheduleNewDate').value = '';
        document.getElementById('rescheduleReason').value = '';
        
        openProfileModal('rescheduleModal');
    };

    const rescheduleForm = document.getElementById('rescheduleForm');
    if (rescheduleForm) {
        rescheduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const id = document.getElementById('rescheduleAppointmentId').value;
            const newDateVal = document.getElementById('rescheduleNewDate').value;
            const newTimeVal = document.getElementById('rescheduleNewTime').value;
            
            if (!newDateVal) {
                showProfileToast("Vui lòng chọn ngày mới hợp lệ!", "danger");
                return;
            }

            const dateParts = newDateVal.split('-');
            const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

            const appIdx = appointmentsList.findIndex(a => a.id === id);
            if (appIdx > -1) {
                appointmentsList[appIdx].date = formattedDate;
                appointmentsList[appIdx].time = newTimeVal;
                localStorage.setItem('techsupport_appointments', JSON.stringify(appointmentsList));
            }

            closeProfileModal(document.getElementById('rescheduleModal'));
            renderAppointmentsTimeline();
            showProfileToast("Yêu cầu thay đổi lịch hẹn đã được gửi thành công!", "success");
        });
    }

    // Modal details and timeline render helper
    const openTicketDetailModal = (code) => {
        const ticket = ticketsList.find(t => t.code === code);
        if (!ticket) return;

        document.getElementById('modalTicketCode').textContent = ticket.code;
        document.getElementById('modalTicketService').textContent = ticket.service;
        document.getElementById('modalTicketCategory').textContent = ticket.category;
        document.getElementById('modalTicketPriority').textContent = ticket.priority || 'Trung bình';
        document.getElementById('modalTicketDate').textContent = ticket.date;
        document.getElementById('modalTicketStatus').textContent = ticket.statusText;
        
        const staffNames = {
            'PT001': 'Nguyễn Hoàng Nam (Mã NV: NV-2291)',
            'PT002': 'Lê Văn Khải (Mã NV: NV-3184)',
            'PT003': 'Đỗ Thị Minh (Mã NV: NV-1092)',
            'PT004': 'Phan Văn Phú (Mã NV: NV-5819)',
            'PT005': 'Trần Thanh Hằng (Mã NV: NV-4792)',
            'PT006': 'Nguyễn Hoàng Nam (Mã NV: NV-2291)',
            'PT007': 'Lê Văn Khải (Mã NV: NV-3184)',
            'PT008': 'Đỗ Thị Minh (Mã NV: NV-1092)',
            'PT009': 'Phan Văn Phú (Mã NV: NV-5819)',
            'PT010': 'Trần Thanh Hằng (Mã NV: NV-4792)',
            'PT011': 'Vũ Đức Thịnh (Mã NV: NV-8831)',
            'PT012': 'Nguyễn Hoàng Nam (Mã NV: NV-2291)'
        };
        const staffVal = staffNames[ticket.code] || 'Đang phân công';
        document.getElementById('modalTicketStaff').textContent = staffVal;

        const ticketDescs = {
            'PT001': 'Modem mạng Cáp quang gia đình nháy đỏ đèn LOS từ sáng sớm, đã thử khởi động lại thiết bị nhiều lần nhưng vẫn không truy cập được Internet.',
            'PT002': 'Camera giám sát hành lang chung cư không xem được lịch sử ghi hình trên app Home Camera, báo lỗi thẻ nhớ ngắt kết nối.',
            'PT003': 'Server VPS Linux chạy website bán hàng bị chậm, CPU thường xuyên quá tải 100%. Cần tư vấn mở rộng dung lượng ổ cứng SSD thêm 50GB.',
            'PT004': 'Yêu cầu đổi mật khẩu bộ phát Wifi và cấu hình ẩn tên mạng Wifi phụ tại nhà để tăng tính bảo mật.',
            'PT005': 'Phần mềm xuất hóa đơn điện tử V-Invoice không đồng bộ được dữ liệu thuế khi xuất hóa đơn bán hàng trực tiếp.',
            'PT006': 'Mạng wifi chính thỉnh thoảng mất kết nối đột ngột khoảng 5 phút rồi tự động có lại, lặp đi lặp lại nhiều lần trong ngày.',
            'PT007': 'Thiết bị Home Camera ngoài cổng báo ngoại tuyến trên điện thoại, mặc dù đèn nguồn tín hiệu trên camera vẫn sáng xanh.',
            'PT008': 'CSDL MySQL trên cloud server báo lỗi kết nối quá tải "Too many connections" vào các khung giờ cao điểm.',
            'PT009': 'Nhánh cáp quang đi vào hiên nhà bị nhánh cây đổ đè trúng gây đứt sợi cáp, cần kỹ thuật kéo lại dây cáp quang mới.',
            'PT010': 'Cần hỗ trợ kéo thêm 3 đầu dây mạng LAN và bấm hạt mạng mới cho phòng họp công ty mới sửa chữa.',
            'PT011': 'Yêu cầu di dời vị trí lắp đặt camera từ phòng khách sang sân thượng phía sau nhà để tối ưu hóa góc quan sát.',
            'PT012': 'Hỗ trợ khởi động lại và kiểm tra logs hệ thống Server vật lý lưu trữ dữ liệu ERP nội bộ.'
        };
        const descVal = ticketDescs[ticket.code] || 'Khách hàng yêu cầu hỗ trợ xử lý kỹ thuật đối với dịch vụ đang đăng ký sử dụng.';
        document.getElementById('modalTicketDesc').textContent = descVal;

        const ticketNotes = {
            'PT001': 'Đang điều động kỹ thuật viên khu vực kiểm tra hộp cáp quang thuê bao ODF ngoài đầu ngõ. Dự kiến khắc phục xong trước 17:00 ngày hôm nay.',
            'PT002': 'Đã tiếp nhận yêu cầu. Kỹ thuật viên sẽ liên hệ và mang theo thẻ nhớ MicroSD mới để thay thế dự phòng nếu cần thiết.',
            'PT003': 'Nhân viên Cloud đã liên hệ hướng dẫn khách hàng tạo snapshot và nâng cấp cấu hình trực tuyến trên trang quản trị.',
            'PT004': 'Kỹ thuật viên đã hỗ trợ điều khiển từ xa cấu hình thành công. Đã bàn giao tài khoản quản trị modem mới cho khách hàng.',
            'PT005': 'Đã cập nhật phiên bản vá lỗi V-Invoice mới nhất cho khách hàng, hệ thống đã chạy ổn định và đồng bộ hóa đơn bình thường.',
            'PT006': 'Kỹ thuật đang theo dõi suy hao tín hiệu trên đường dây cáp quang tại trạm phát GPON. Sẽ liên hệ hẹn lịch qua nhà đo kiểm trực tiếp.',
            'PT007': 'CSKH đã tiếp nhận. Hẹn kỹ thuật viên khảo sát vị trí lắp đặt và dây nối tín hiệu camera vào sáng mai.',
            'PT008': 'Đã hướng dẫn quản trị viên điều chỉnh cấu hình max_connections và tối ưu hóa câu lệnh query để tránh nghẽn luồng.',
            'PT009': 'Đang sắp xếp cuộn cáp quang dự phòng và kỹ thuật viên đến hiện trường hàn nối cáp quang trực tiếp tại nhà khách hàng.',
            'PT010': 'Đã hoàn thành thi công lắp đặt dây LAN âm tường thẩm mỹ, kiểm tra thông mạng 1Gbps ổn định.',
            'PT011': 'Đã thực hiện di chuyển camera và dây cáp nối, cấu hình lại mạng không dây kết nối camera ổn định trên điện thoại.',
            'PT012': 'Đã thực hiện reboot cứng tại trung tâm dữ liệu, hệ thống ERP hoạt động bình thường, ghi nhận hoạt động ổn định.'
        };
        const notesVal = ticketNotes[ticket.code] || 'Yêu cầu đang được phòng kỹ thuật kiểm tra và xử lý theo đúng quy trình xử lý ticket hỗ trợ.';
        document.getElementById('modalTicketNotes').textContent = notesVal;

        const timelineWrapper = document.getElementById('modalTicketTimeline');
        if (timelineWrapper) {
            timelineWrapper.innerHTML = '';
            
            let timelineSteps = [];
            if (ticket.status === 'completed') {
                timelineSteps = [
                    { time: '08:00', title: 'Phiếu được tạo', active: true },
                    { time: '08:15', title: 'Tiếp nhận yêu cầu', active: true },
                    { time: '09:00', title: 'Phân công kỹ thuật viên', active: true },
                    { time: '14:00', title: 'Đang tiến hành xử lý', active: true },
                    { time: '16:00', title: 'Hoàn thành khắc phục', active: true }
                ];
            } else if (ticket.status === 'processing') {
                timelineSteps = [
                    { time: '08:00', title: 'Phiếu được tạo', active: true },
                    { time: '08:15', title: 'Tiếp nhận yêu cầu', active: true },
                    { time: '09:00', title: 'Phân công kỹ thuật viên', active: true },
                    { time: '14:00', title: 'Đang tiến hành xử lý', active: true },
                    { time: '--:--', title: 'Hoàn thành khắc phục', active: false }
                ];
            } else if (ticket.status === 'pending') {
                timelineSteps = [
                    { time: '08:00', title: 'Phiếu được tạo', active: true },
                    { time: '08:15', title: 'Tiếp nhận yêu cầu', active: true },
                    { time: '--:--', title: 'Phân công kỹ thuật viên', active: false },
                    { time: '--:--', title: 'Đang tiến hành xử lý', active: false },
                    { time: '--:--', title: 'Hoàn thành khắc phục', active: false }
                ];
            } else if (ticket.status === 'cancelled') {
                timelineSteps = [
                    { time: '08:00', title: 'Phiếu được tạo', active: true },
                    { time: '08:15', title: 'Tiếp nhận yêu cầu', active: true },
                    { time: '10:00', title: 'Yêu cầu bị hủy bỏ', active: true, cancelled: true }
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

    // Modal Edit Profile and Form Handlers
    const editProfileForm = document.getElementById('editProfileForm');
    const btnEditInline = document.getElementById('btnEditProfileInline');
    
    const editFullname = document.getElementById('editFullname');
    const editPhone = document.getElementById('editPhone');
    const editEmail = document.getElementById('editEmail');
    const editIdentity = document.getElementById('editIdentity');
    const editAddress = document.getElementById('editAddress');

    const modalInputs = [editFullname, editPhone, editEmail, editIdentity, editAddress];

    if (btnEditInline) {
        btnEditInline.addEventListener('click', (e) => {
            e.preventDefault();
            // Populate modal inputs with current user data
            if (editFullname) editFullname.value = currentUser.fullname;
            if (editPhone) editPhone.value = currentUser.phone;
            if (editEmail) editEmail.value = currentUser.email || '';
            if (editIdentity) editIdentity.value = currentUser.identity;
            if (editAddress) editAddress.value = currentUser.address;

            // Reset validation errors
            modalInputs.forEach(input => {
                if (input) {
                    input.classList.remove('is-invalid');
                    const errEl = document.getElementById(`${input.id}Error`);
                    if (errEl) errEl.style.display = 'none';
                }
            });

            // Open the edit profile modal
            openProfileModal('editProfileModal');
        });
    }

    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();

            let isValid = true;
            modalInputs.forEach(input => {
                if (input) {
                    const val = input.value.trim();
                    const errEl = document.getElementById(`${input.id}Error`);
                    
                    if (input.required && !val) {
                        input.classList.add('is-invalid');
                        if (errEl) errEl.style.display = 'block';
                        isValid = false;
                    } else if (input.id === 'editPhone') {
                        const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
                        if (!phoneRegex.test(val)) {
                            input.classList.add('is-invalid');
                            if (errEl) errEl.style.display = 'block';
                            isValid = false;
                        } else {
                            input.classList.remove('is-invalid');
                            if (errEl) errEl.style.display = 'none';
                        }
                    } else if (input.id === 'editEmail') {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (val && !emailRegex.test(val)) {
                            input.classList.add('is-invalid');
                            if (errEl) errEl.style.display = 'block';
                            isValid = false;
                        } else {
                            input.classList.remove('is-invalid');
                            if (errEl) errEl.style.display = 'none';
                        }
                    } else if (input.id === 'editIdentity') {
                        const cccdRegex = /^[0-9]{9}$|^[0-9]{12}$/;
                        if (!cccdRegex.test(val)) {
                            input.classList.add('is-invalid');
                            if (errEl) errEl.style.display = 'block';
                            isValid = false;
                        } else {
                            input.classList.remove('is-invalid');
                            if (errEl) errEl.style.display = 'none';
                        }
                    } else {
                        input.classList.remove('is-invalid');
                        if (errEl) errEl.style.display = 'none';
                    }
                }
            });

            if (isValid) {
                const origEmail = currentUser.email;
                const origPhone = currentUser.phone;

                currentUser.fullname = editFullname.value.trim();
                currentUser.phone = editPhone.value.trim();
                currentUser.email = editEmail.value.trim();
                currentUser.identity = editIdentity.value.trim();
                currentUser.address = editAddress.value.trim();

                usersDb = JSON.parse(localStorage.getItem('techsupport_users') || '[]');
                const idx = usersDb.findIndex(u => u.email === origEmail || u.phone === origPhone);
                if (idx > -1) {
                    usersDb[idx] = currentUser;
                } else {
                    usersDb.push(currentUser);
                }
                localStorage.setItem('techsupport_users', JSON.stringify(usersDb));

                const sessionStr = sessionStorage.getItem('techsupport_session');
                if (sessionStr) {
                    try {
                        const sessionData = JSON.parse(sessionStr);
                        if (sessionData && sessionData.user) {
                            sessionData.user.fullname = currentUser.fullname;
                            sessionData.user.email = currentUser.email;
                            sessionData.user.phone = currentUser.phone;
                            sessionStorage.setItem('techsupport_session', JSON.stringify(sessionData));
                        }
                    } catch (err) {
                        console.error("Error updates session storage:", err);
                    }
                }
                sessionStorage.setItem('ts_customer_name', currentUser.fullname);

                if (window.TechSupportAuth && typeof window.TechSupportAuth.login === 'function') {
                    window.TechSupportAuth.login(currentUser.fullname, false);
                } else {
                    const navDisplayName = document.getElementById('userDisplayName');
                    if (navDisplayName) navDisplayName.textContent = currentUser.fullname;
                }

                // Close the modal
                closeProfileModal(document.getElementById('editProfileModal'));

                // Rerender page UI elements
                renderUserProfile();
                showProfileToast("Cập nhật thông tin cá nhân thành công!", "success");
            } else {
                showProfileToast("Vui lòng kiểm tra lại thông tin biểu mẫu nhập!", "danger");
            }
        });
    }

    // Initial renders
    updateStatsTargets();
    renderUserProfile();
    renderTicketsTable();
    renderAppointmentsTimeline();

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
    const changePasswordForm = document.getElementById('changePasswordForm');
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

        // 1. Current password verification
        const currentVal = currentPassword.value;
        if (!currentVal || currentVal !== currentUser.password) {
            setInputError(currentPassword, true);
            const errEl = document.getElementById('currentPasswordError');
            if (errEl) {
                errEl.textContent = currentVal ? "Mật khẩu hiện tại không chính xác!" : "Vui lòng nhập mật khẩu hiện tại";
            }
            isValid = false;
        } else {
            setInputError(currentPassword, false);
        }

        // 2. New password validations (min 6 characters)
        const newVal = newPassword.value;
        if (!newVal || newVal.length < 6) {
            setInputError(newPassword, true);
            isValid = false;
        } else {
            setInputError(newPassword, false);
        }

        // 3. Confirm password checks matches
        const confirmVal = confirmPassword.value;
        if (!confirmVal || confirmVal !== newVal) {
            setInputError(confirmPassword, true);
            isValid = false;
        } else {
            setInputError(confirmPassword, false);
        }

        return isValid;
    };

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (validateChangePasswordForm()) {
                const newPass = newPassword.value;
                
                // Update properties
                currentUser.password = newPass;

                // Sync users database list
                usersDb = JSON.parse(localStorage.getItem('techsupport_users') || '[]');
                const idx = usersDb.findIndex(u => u.email === currentUser.email || u.phone === currentUser.phone);
                if (idx > -1) {
                    usersDb[idx].password = newPass;
                    localStorage.setItem('techsupport_users', JSON.stringify(usersDb));
                }

                // Alert success
                showProfileToast("Thay đổi mật khẩu thành công!", "success");

                // Close and clear modal
                closeProfileModal(document.getElementById('changePasswordModal'));
                resetPasswordForm();
            } else {
                showProfileToast("Đổi mật khẩu thất bại. Vui lòng kiểm tra lại biểu mẫu!", "danger");
            }
        });
    }

    // Real-time validations
    if (currentPassword) {
        currentPassword.addEventListener('input', () => {
            const err = !currentPassword.value || currentPassword.value !== currentUser.password;
            setInputError(currentPassword, err);
            if (err) {
                const errEl = document.getElementById('currentPasswordError');
                if (errEl) errEl.textContent = currentPassword.value ? "Mật khẩu hiện tại không chính xác!" : "Vui lòng nhập mật khẩu hiện tại";
            }
        });
    }
    if (newPassword) {
        newPassword.addEventListener('input', () => {
            setInputError(newPassword, !newPassword.value || newPassword.value.length < 6);
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
