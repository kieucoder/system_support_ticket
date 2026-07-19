/* -------------------------------------------------------------
 * FILE: assets/js/staff/dashboard.js
 * AUTHOR: Antigravity
 * DESCRIPTION: Logic for TechSupport Viettel Admin Dashboard (Light/Dark Mode, Charts, CRUD, Profile Uploader)
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', function () {
    // 1. Initialize DB Mockup in localStorage
    initMockDatabase();

    // 2. Setup Layout Controls (Sidebar Toggle, Dark Mode)
    initLayoutControls();

    // 3. Setup Global Search (Topbar search bar)
    initGlobalSearch();

    // 4. Initialize Page Specific Business Logic
    initPageLogic();
});

/* =============================================================
   1. MOCK DATABASE SETUP
   ============================================================= */
function initMockDatabase() {
    // 1.1 Category data
    const storedCats = JSON.parse(localStorage.getItem('viettel_categories') || '[]');
    if (!storedCats.length) {
        const defaultCategories = [
            { id: 'internet', name: 'Internet cáp quang', desc: 'Mất mạng hoàn toàn, mạng chập chờn, tốc độ truy cập chậm, suy hao tín hiệu cáp quang.', status: 'Hoạt động', createdDate: '10/01/2026' },
            { id: 'tv', name: 'Truyền hình số', desc: 'Màn hình không có tín hiệu, lỗi kênh truyền hình, mất tiếng, không tải được ứng dụng TV.', status: 'Hoạt động', createdDate: '15/01/2026' },
            { id: 'camera', name: 'Camera giám sát', desc: 'Camera offline không kết nối, lỗi lưu trữ đám mây Cloud, mất mật khẩu tài khoản xem camera.', status: 'Hoạt động', createdDate: '20/01/2026' },
            { id: 'phone', name: 'Điện thoại cố định', desc: 'Điện thoại bàn không gọi đi được, không nhận được cuộc gọi đến, tín hiệu thoại bị rè.', status: 'Hoạt động', createdDate: '22/01/2026' },
            { id: 'wifi-corporate', name: 'WiFi doanh nghiệp', desc: 'Hệ thống mạng nội bộ LAN không ổn định, thiết bị định tuyến Router/Switch lỗi, không cấp IP.', status: 'Hoạt động', createdDate: '02/02/2026' },
            { id: 'cloud-server', name: 'Dịch vụ Cloud Server', desc: 'Lỗi hệ điều hành máy chủ ảo VPS, không SSH/Remote Desktop được, cấu hình Firewall chặn cổng.', status: 'Hoạt động', createdDate: '08/02/2026' }
        ];
        localStorage.setItem('viettel_categories', JSON.stringify(defaultCategories));
    }

    // 1.2 Services data
    const storedSvcs = JSON.parse(localStorage.getItem('viettel_services') || '[]');
    if (!storedSvcs.length) {
        const defaultServices = [
            { id: 'ftth', name: 'Internet Cáp Quang FTTH', desc: 'Đường truyền cáp quang đối xứng băng thông rộng, tốc độ cao.', status: 'Hoạt động', categoryId: 'internet', createdDate: '10/01/2026' },
            { id: 'combo', name: 'Combo Internet + TV', desc: 'Tích hợp Internet Cáp Quang và Truyền hình số thông minh TV360.', status: 'Hoạt động', categoryId: 'tv', createdDate: '15/01/2026' },
            { id: 'home-camera', name: 'Camera Viettel (Home Camera)', desc: 'Giải pháp giám sát an ninh thông minh tích hợp cloud.', status: 'Hoạt động', categoryId: 'camera', createdDate: '20/01/2026' },
            { id: 'mesh-wifi', name: 'Mesh Wifi', desc: 'Thiết bị mở rộng vùng phủ sóng Wifi 5/6 giúp bao phủ toàn bộ.', status: 'Hoạt động', categoryId: 'wifi-corporate', createdDate: '02/02/2026' },
            { id: 'cloud-vps', name: 'Cloud VPS', desc: 'Máy chủ ảo điện toán đám mây hiệu năng cao.', status: 'Hoạt động', categoryId: 'cloud-server', createdDate: '08/02/2026' },
            { id: 'vcloudcenter', name: 'Tổng đài ảo vCloudCenter', desc: 'Hệ thống tổng đài chăm sóc khách hàng thông minh.', status: 'Hoạt động', categoryId: 'phone', createdDate: '22/01/2026' }
        ];
        localStorage.setItem('viettel_services', JSON.stringify(defaultServices));
    }

    // 1.3 Tickets data
    const storedTickets = JSON.parse(localStorage.getItem('viettel_tickets') || '[]');
    if (!storedTickets.length) {
        const defaultTickets = [
            { id: 1, ticketCode: 'PHT-20260001', title: 'Mất mạng đột ngột sau mưa lớn', categoryId: 'internet', serviceId: 'ftth', requestType: 'Báo Hỏng Thiết Bị', priority: 'Khẩn Cấp', status: 'processing', description: 'Đèn PON nhấp nháy đỏ trên modem, không thể truy cập internet từ sáng nay.', createdDate: '10/05/2026 08:30:00', updatedDate: '11/05/2026 09:15:00', customerName: 'Trần Quốc Bảo', customerPhone: '0986123456', needAppointment: true, appointmentDate: '11/05/2026', appointmentTime: '09:00', appointmentNote: 'Vui lòng đến buổi sáng sau 8h', staffId: 'NV002' },
            { id: 2, ticketCode: 'PHT-20260002', title: 'Lỗi đầu thu TV360 không lên kênh', categoryId: 'tv', serviceId: 'combo', requestType: 'Hỗ Trợ Kỹ Thuật', priority: 'Cao', status: 'waiting', description: 'Đầu thu hiện mã lỗi 102, đã reset nhiều lần không hết.', createdDate: '20/05/2026 14:15:00', updatedDate: '20/05/2026 14:15:00', customerName: 'Nguyễn Thị Hoa', customerPhone: '0975888999', needAppointment: true, appointmentDate: '21/05/2026', appointmentTime: '15:30', appointmentNote: '', staffId: 'NV003' },
            { id: 3, ticketCode: 'PHT-20260003', title: 'Yêu cầu mở rộng thêm 2 node Mesh Wifi', categoryId: 'wifi-corporate', serviceId: 'mesh-wifi', requestType: 'Đăng Ký Mới', priority: 'Trung Bình', status: 'completed', description: 'Văn phòng mở rộng tầng 3 cần lắp thêm node phụ để phủ sóng.', createdDate: '22/05/2026 10:00:00', updatedDate: '23/05/2026 16:30:00', customerName: 'Công ty Cổ phần TechSoft', customerPhone: '02466778899', needAppointment: false, appointmentDate: '', appointmentTime: '', appointmentNote: '', staffId: 'NV001' },
            { id: 4, ticketCode: 'PHT-20260004', title: 'Camera không lưu trữ được Cloud', categoryId: 'camera', serviceId: 'home-camera', requestType: 'Hỗ Trợ Kỹ Thuật', priority: 'Trung Bình', status: 'waiting', description: 'Gói cloud 7 ngày đã kích hoạt nhưng xem lại báo không có dữ liệu.', createdDate: '25/05/2026 11:20:00', updatedDate: '25/05/2026 11:20:00', customerName: 'Phạm Minh Tuấn', customerPhone: '0912345678', needAppointment: false, appointmentDate: '', appointmentTime: '', appointmentNote: '', staffId: '' },
            { id: 5, ticketCode: 'PHT-20260005', title: 'Đăng ký thuê Cloud VPS cấu hình cao', categoryId: 'cloud-server', serviceId: 'cloud-vps', requestType: 'Đăng Ký Mới', priority: 'Thấp', status: 'completed', description: 'Cần thuê VPS 4 vCPU, 8GB RAM, 100GB SSD cài hệ điều hành Ubuntu.', createdDate: '28/05/2026 16:45:00', updatedDate: '29/05/2026 10:00:00', customerName: 'Lê Hoàng Hải', customerPhone: '0963111222', needAppointment: false, appointmentDate: '', appointmentTime: '', appointmentNote: '', staffId: 'NV001' },
            { id: 6, ticketCode: 'PHT-20260006', title: 'Modem Wifi bị cháy cục nguồn do chập điện', categoryId: 'internet', serviceId: 'ftth', requestType: 'Báo Hỏng Thiết Bị', priority: 'Khẩn Cấp', status: 'cancelled', description: 'Ổ cắm điện bị chập làm modem khét lẹt, cần kỹ thuật mang modem mới thay thế.', createdDate: '01/06/2026 07:15:00', updatedDate: '01/06/2026 10:20:00', customerName: 'Vũ Minh Đức', customerPhone: '0988456123', needAppointment: true, appointmentDate: '01/06/2026', appointmentTime: '10:00', appointmentNote: 'Mang theo nguồn thay thế', staffId: 'NV002' },
            { id: 7, ticketCode: 'PHT-20260007', title: 'Tổng đài ảo vCloudCenter không gọi ra được', categoryId: 'phone', serviceId: 'vcloudcenter', requestType: 'Hỗ Trợ Kỹ Thuật', priority: 'Khẩn Cấp', status: 'processing', description: 'Cuộc gọi đi liên tục báo lỗi SIP 503, khách hàng phản ánh không liên lạc được.', createdDate: '05/06/2026 09:30:00', updatedDate: '06/06/2026 08:00:00', customerName: 'Khách sạn Viễn Đông', customerPhone: '02839111222', needAppointment: false, appointmentDate: '', appointmentTime: '', appointmentNote: '', staffId: 'NV003' },
            { id: 8, ticketCode: 'PHT-20260008', title: 'Lỗi phân giải tên miền DNS trên VPS', categoryId: 'cloud-server', serviceId: 'cloud-vps', requestType: 'Hỗ Trợ Kỹ Thuật', priority: 'Cao', status: 'processing', description: 'VPS không thể phân giải được các tên miền ngoài, ping IP hoạt động bình thường.', createdDate: '08/06/2026 15:40:00', updatedDate: '09/06/2026 14:00:00', customerName: 'Nguyễn Văn Đạt', customerPhone: '0979555666', needAppointment: false, appointmentDate: '', appointmentTime: '', appointmentNote: '', staffId: 'NV002' }
        ];
        localStorage.setItem('viettel_tickets', JSON.stringify(defaultTickets));
    }

    // 1.4 Appointments data (linked to tickets with needAppointment = true)
    const storedAppts = JSON.parse(localStorage.getItem('viettel_appointments') || '[]');
    if (!storedAppts.length) {
        const defaultAppointments = [
            { id: 1, ticketCode: 'PHT-20260001', customerName: 'Trần Quốc Bảo', serviceName: 'Internet Cáp Quang FTTH', appointmentDate: '11/05/2026', appointmentTime: '09:00', status: 'approved', createdDate: '10/05/2026', notes: 'Kỹ thuật viên Nguyễn Hữu Nam phụ trách' },
            { id: 2, ticketCode: 'PHT-20260002', customerName: 'Nguyễn Thị Hoa', serviceName: 'Combo Internet + TV', appointmentDate: '21/05/2026', appointmentTime: '15:30', status: 'waiting', createdDate: '20/05/2026', notes: '' },
            { id: 3, ticketCode: 'PHT-20260006', customerName: 'Vũ Minh Đức', serviceName: 'Internet Cáp Quang FTTH', appointmentDate: '01/06/2026', appointmentTime: '10:00', status: 'cancelled', createdDate: '01/06/2026', notes: 'Khách hàng báo tự mua adapter ngoài thay thế dùng được nên hủy lịch hẹn' }
        ];
        localStorage.setItem('viettel_appointments', JSON.stringify(defaultAppointments));
    }

    // 1.5 Admin Profile data
    if (!localStorage.getItem('viettel_profile')) {
        const defaultProfile = {
            name: 'Nguyễn Văn Hùng',
            email: 'hungnv.admin@viettel.com.vn',
            phone: '0981234567',
            role: 'Kỹ thuật viên Trưởng',
            avatar: '../assets/images/avatar-default.png' // fallback avatar
        };
        localStorage.setItem('viettel_profile', JSON.stringify(defaultProfile));
    }

    // Initialize password if not set
    if (!localStorage.getItem('viettel_admin_pwd')) {
        localStorage.setItem('viettel_admin_pwd', 'Viettel@2026');
    }
}

/* =============================================================
   2. LAYOUT CONTROLS & THEME SWITCH
   ============================================================= */
function initLayoutControls() {
    const adminLayout = document.getElementById('adminLayout');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const toggleMobileSidebarBtn = document.getElementById('toggleMobileSidebar');
    const toggleThemeBtn = document.getElementById('toggleTheme');
    
    // Create overlay element for mobile sidebar
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', function() {
            adminLayout.classList.remove('sidebar-mobile-show');
        });
        adminLayout.appendChild(overlay);
    }

    // 2.1 Toggle Sidebar Collapse (Desktop)
    if (toggleSidebarBtn && adminLayout) {
        toggleSidebarBtn.addEventListener('click', function() {
            adminLayout.classList.toggle('sidebar-collapsed');
            // Store preference in localStorage
            localStorage.setItem('sidebar_collapsed', adminLayout.classList.contains('sidebar-collapsed'));
        });

        // Apply saved collapse preference
        if (localStorage.getItem('sidebar_collapsed') === 'true') {
            adminLayout.classList.add('sidebar-collapsed');
        }
    }

    // 2.2 Toggle Sidebar Slide-in (Mobile/Tablet)
    if (toggleMobileSidebarBtn && adminLayout) {
        toggleMobileSidebarBtn.addEventListener('click', function() {
            adminLayout.classList.add('sidebar-mobile-show');
        });
    }

    // 2.3 Theme Switcher (Dark/Light)
    if (toggleThemeBtn) {
        // Apply saved theme or default to light
        const savedTheme = localStorage.getItem('techsupport_theme') || 'light';
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
        updateThemeIcon(toggleThemeBtn, savedTheme);

        toggleThemeBtn.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('techsupport_theme', newTheme);
            updateThemeIcon(toggleThemeBtn, newTheme);

            // Re-render charts in dashboard if they exist
            if (typeof dashboardCharts !== 'undefined') {
                updateChartThemes(newTheme);
            }
        });
    }

    // 2.4 Profile Info Header Sync
    syncProfileHeader();
}

function updateThemeIcon(btn, theme) {
    const icon = btn.querySelector('i');
    if (!icon) return;
    if (theme === 'dark') {
        icon.className = 'fa-solid fa-sun';
        btn.title = 'Chuyển sang chế độ sáng';
    } else {
        icon.className = 'fa-solid fa-moon';
        btn.title = 'Chuyển sang chế độ tối';
    }
}

function syncProfileHeader() {
    const profile = JSON.parse(localStorage.getItem('viettel_profile'));
    if (!profile) return;
    
    const headerName = document.querySelector('.user-profile-name');
    const headerAvatar = document.querySelector('.user-profile-dropdown img');
    
    if (headerName) headerName.textContent = profile.name;
    if (headerAvatar && profile.avatar) {
        headerAvatar.src = profile.avatar;
    }
}

/* =============================================================
   3. GLOBAL SEARCH FUNCTION
   ============================================================= */
function initGlobalSearch() {
    const searchForm = document.querySelector('.topbar-search-form');
    const searchInput = document.querySelector('.search-bar-input');
    if (!searchForm || !searchInput) return;

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        // Redirect or filter based on query
        Swal.fire({
            title: 'Tìm kiếm hệ thống',
            text: `Bạn đang tìm kiếm từ khóa: "${query}". Hệ thống sẽ hiển thị kết quả lọc tương ứng.`,
            icon: 'info',
            confirmButtonColor: '#EE0033'
        });
    });
}

/* =============================================================
   4. BUSINESS LOGIC ROUTING BY PAGE
   ============================================================= */
function initPageLogic() {
    if (window.isServerDashboard) {
        return; // Bypass mock DB and let server-side scripts render real data
    }
    const path = window.location.pathname;
    const href = window.location.href;
    
    // Detect by URL path OR by presence of page-specific DOM elements
    const isDashboard = path.includes('dashboard.html') 
        || path.endsWith('/staff/') 
        || path.endsWith('/staff/index.html')
        || href.includes('dashboard.html')
        || document.getElementById('ticketTrendChart') !== null;
        
    const isCategories = path.includes('admin-categories.html') || href.includes('admin-categories.html');
    const isAppointments = path.includes('admin-appointments.html') || href.includes('admin-appointments.html');
    const isProfile = path.includes('admin-profile.html') || href.includes('admin-profile.html');

    if (isDashboard) {
        setupDashboardPage();
    } else if (isCategories) {
        setupCategoriesPage();
    } else if (isAppointments) {
        setupAppointmentsPage();
    } else if (isProfile) {
        setupProfilePage();
    }
}


/* =============================================================
   5. DASHBOARD VIEW CONTROLLER
   ============================================================= */
let dashboardCharts = {};

function setupDashboardPage() {
    // 5.1 Load counter widgets with animation
    loadDashboardStats();

    // 5.2 Initialize Charts
    initDashboardCharts();

    // 5.3 Render Recent Tickets Table
    renderRecentTicketsTable();
}

function loadDashboardStats() {
    // Ensure mock DB is always seeded (handles fresh HTTP sessions where localStorage is empty)
    let tickets = JSON.parse(localStorage.getItem('viettel_tickets') || '[]');
    let categories = JSON.parse(localStorage.getItem('viettel_categories') || '[]');
    let services = JSON.parse(localStorage.getItem('viettel_services') || '[]');
    let appointments = JSON.parse(localStorage.getItem('viettel_appointments') || '[]');
    
    // If data is empty (e.g., first-time HTTP session), re-seed and re-read
    if (tickets.length === 0) {
        // Force reset to trigger re-seeding
        localStorage.removeItem('viettel_tickets');
        localStorage.removeItem('viettel_categories');
        localStorage.removeItem('viettel_services');
        localStorage.removeItem('viettel_appointments');
        initMockDatabase();
        tickets = JSON.parse(localStorage.getItem('viettel_tickets') || '[]');
        categories = JSON.parse(localStorage.getItem('viettel_categories') || '[]');
        services = JSON.parse(localStorage.getItem('viettel_services') || '[]');
        appointments = JSON.parse(localStorage.getItem('viettel_appointments') || '[]');
    }
    
    const countTotal = tickets.length;
    const countWaiting = tickets.filter(t => t.status === 'waiting').length;
    const countProcessing = tickets.filter(t => t.status === 'processing').length;
    const countCompleted = tickets.filter(t => t.status === 'completed').length;
    
    const appointmentsApproved = appointments.filter(a => a.status === 'approved').length;
    const countServices = services.length;
    const countCategories = categories.length;
    
    // Unique customers based on phone number
    const uniqueCustomers = new Set(tickets.map(t => t.customerPhone)).size;

    // Set numbers in UI
    animateCounter('count-total', countTotal);
    animateCounter('count-waiting', countWaiting);
    animateCounter('count-processing', countProcessing);
    animateCounter('count-completed', countCompleted);
    animateCounter('count-customers', uniqueCustomers);
    animateCounter('count-appointments', appointmentsApproved);
    animateCounter('count-services', countServices);
    animateCounter('count-categories', countCategories);
    animateCounter('count-chats', 0);
}

function animateCounter(id, targetVal) {
    const element = document.getElementById(id);
    if (!element) return;

    let start = 0;
    const duration = 800; // ms
    const increment = targetVal / (duration / 16); // 60 FPS approx.

    element.classList.add('animate-counter');

    function updateCounter() {
        start += increment;
        if (start >= targetVal) {
            element.textContent = Math.round(targetVal);
        } else {
            element.textContent = Math.round(start);
            requestAnimationFrame(updateCounter);
        }
    }
    updateCounter();
}

function initDashboardCharts() {
    const theme = document.documentElement.getAttribute('data-bs-theme') || 'light';
    const isDark = theme === 'dark';
    
    const labelColor = isDark ? '#94A3B8' : '#6B7280';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(229, 231, 235, 0.6)';

    // Retrieve stats dynamically for charts
    const tickets = JSON.parse(localStorage.getItem('viettel_tickets') || '[]');
    const services = JSON.parse(localStorage.getItem('viettel_services') || '[]');
    const categories = JSON.parse(localStorage.getItem('viettel_categories') || '[]');

    // 1. Line Chart: Ticket Count by month in 2026 (Mocked trend based on real count)
    const lineCtx = document.getElementById('ticketTrendChart');
    if (lineCtx) {
        dashboardCharts.trend = new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
                datasets: [{
                    label: 'Phiếu hỗ trợ tiếp nhận',
                    data: [15, 23, 18, 32, tickets.length, tickets.length + 5], // dynamic dynamic elements
                    borderColor: '#EE0033',
                    backgroundColor: 'rgba(238, 0, 51, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#EE0033',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: labelColor, font: { family: 'Inter', size: 11 } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: labelColor, font: { family: 'Inter', size: 11 } },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // 2. Doughnut Chart: Tickets by Status
    const statusCounts = { waiting: 0, processing: 0, completed: 0, cancelled: 0 };
    tickets.forEach(t => {
        if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
    });

    const statusCtx = document.getElementById('ticketStatusChart');
    if (statusCtx) {
        dashboardCharts.status = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Đang chờ', 'Đang xử lý', 'Đã hoàn thành', 'Đã hủy'],
                datasets: [{
                    data: [statusCounts.waiting, statusCounts.processing, statusCounts.completed, statusCounts.cancelled],
                    backgroundColor: [
                        '#F59E0B', // Warning
                        '#EE0033', // Primary
                        '#10B981', // Success
                        '#EF4444'  // Danger
                    ],
                    borderWidth: isDark ? 2 : 1,
                    borderColor: isDark ? '#1E293B' : '#FFFFFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: labelColor,
                            font: { family: 'Inter', size: 12 },
                            padding: 15
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }

    // 3. Bar Chart: Tickets by Service
    // Compute service frequencies
    const serviceMap = {};
    services.forEach(s => {
        serviceMap[s.id] = { name: s.name, count: 0 };
    });
    tickets.forEach(t => {
        if (serviceMap[t.serviceId]) serviceMap[t.serviceId].count++;
    });

    const serviceLabels = Object.values(serviceMap).map(s => s.name);
    const serviceCounts = Object.values(serviceMap).map(s => s.count);

    const serviceCtx = document.getElementById('ticketServiceChart');
    if (serviceCtx) {
        dashboardCharts.service = new Chart(serviceCtx, {
            type: 'bar',
            data: {
                labels: serviceLabels,
                datasets: [{
                    label: 'Số phiếu',
                    data: serviceCounts,
                    backgroundColor: 'rgba(238, 0, 51, 0.85)',
                    hoverBackgroundColor: '#EE0033',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: labelColor, font: { family: 'Inter', size: 10 } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: labelColor, font: { family: 'Inter', size: 11 } },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // 4. Radar Chart: Customer Satisfaction Stars (1 to 5 Stars)
    const radarCtx = document.getElementById('ticketRatingChart');
    if (radarCtx) {
        dashboardCharts.rating = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['1 Sao (Tệ)', '2 Sao (Kém)', '3 Sao (Bình thường)', '4 Sao (Tốt)', '5 Sao (Rất Tốt)'],
                datasets: [{
                    label: 'Đánh giá tỉ lệ (%)',
                    data: [2, 5, 12, 35, 46], // sample metrics
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: '#10B981',
                    pointBackgroundColor: '#10B981',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    r: {
                        angleLines: { color: gridColor },
                        grid: { color: gridColor },
                        pointLabels: {
                            color: labelColor,
                            font: { family: 'Inter', size: 10 }
                        },
                        ticks: {
                            display: false,
                            backdropColor: 'transparent'
                        }
                    }
                }
            }
        });
    }
}

function updateChartThemes(theme) {
    const isDark = theme === 'dark';
    const labelColor = isDark ? '#94A3B8' : '#6B7280';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(229, 231, 235, 0.6)';

    // Update Line Chart
    if (dashboardCharts.trend) {
        dashboardCharts.trend.options.scales.x.grid.color = gridColor;
        dashboardCharts.trend.options.scales.x.ticks.color = labelColor;
        dashboardCharts.trend.options.scales.y.grid.color = gridColor;
        dashboardCharts.trend.options.scales.y.ticks.color = labelColor;
        dashboardCharts.trend.update();
    }

    // Update Doughnut Chart
    if (dashboardCharts.status) {
        dashboardCharts.status.options.plugins.legend.labels.color = labelColor;
        dashboardCharts.status.data.datasets[0].borderColor = isDark ? '#1E293B' : '#FFFFFF';
        dashboardCharts.status.update();
    }

    // Update Bar Chart
    if (dashboardCharts.service) {
        dashboardCharts.service.options.scales.y.grid.color = gridColor;
        dashboardCharts.service.options.scales.y.ticks.color = labelColor;
        dashboardCharts.service.options.scales.x.ticks.color = labelColor;
        dashboardCharts.service.update();
    }

    // Update Radar Chart
    if (dashboardCharts.rating) {
        dashboardCharts.rating.options.scales.r.angleLines.color = gridColor;
        dashboardCharts.rating.options.scales.r.grid.color = gridColor;
        dashboardCharts.rating.options.scales.r.pointLabels.color = labelColor;
        dashboardCharts.rating.update();
    }
}

function renderRecentTicketsTable() {
    const tableBody = document.getElementById('recentTicketsBody');
    if (!tableBody) return;

    const tickets = JSON.parse(localStorage.getItem('viettel_tickets') || '[]');
    const services = JSON.parse(localStorage.getItem('viettel_services') || '[]');

    // Sort by ID desc (recent first) and take top 5
    const recentTickets = [...tickets].sort((a, b) => b.id - a.id).slice(0, 5);

    if (recentTickets.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Chưa có phiếu hỗ trợ nào được khởi tạo.</td></tr>`;
        return;
    }

    tableBody.innerHTML = recentTickets.map(ticket => {
        const service = services.find(s => s.id === ticket.serviceId);
        const serviceName = service ? service.name : 'Dịch vụ khác';
        
        let statusBadge = '';
        let statusText = '';
        switch (ticket.status) {
            case 'waiting':
                statusBadge = 'waiting';
                statusText = 'Chờ xử lý';
                break;
            case 'processing':
                statusBadge = 'processing';
                statusText = 'Đang xử lý';
                break;
            case 'completed':
                statusBadge = 'completed';
                statusText = 'Hoàn thành';
                break;
            case 'cancelled':
                statusBadge = 'cancelled';
                statusText = 'Đã hủy';
                break;
        }

        let priorityBadge = '';
        switch (ticket.priority) {
            case 'Khẩn Cấp': priorityBadge = 'bg-danger text-white'; break;
            case 'Cao': priorityBadge = 'bg-warning text-dark'; break;
            case 'Trung Bình': priorityBadge = 'bg-info text-white'; break;
            default: priorityBadge = 'bg-success text-white';
        }

        return `
            <tr>
                <td class="fw-bold text-dark-emphasis">${ticket.ticketCode}</td>
                <td>
                    <div class="fw-semibold">${ticket.customerName}</div>
                    <div class="text-muted fs-8">${ticket.customerPhone}</div>
                </td>
                <td>
                    <div class="text-truncate" style="max-width: 180px;" title="${ticket.title}">${ticket.title}</div>
                    <span class="badge bg-secondary-subtle text-secondary fs-9 mt-1">${serviceName}</span>
                </td>
                <td>
                    <span class="badge ${priorityBadge} px-2 py-1 fs-9">${ticket.priority}</span>
                </td>
                <td>
                    <span class="badge-status ${statusBadge}">${statusText}</span>
                </td>
                <td>
                    <div class="text-muted fs-8">${ticket.createdDate.split(' ')[0]}</div>
                </td>
            </tr>
        `;
    }).join('');
}


/* =============================================================
   6. CATEGORIES CRUD VIEW CONTROLLER
   ============================================================= */
let editingCategoryId = null;

function setupCategoriesPage() {
    renderCategoriesTable();

    const form = document.getElementById('categoryForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const nameInput = document.getElementById('catName');
            const descInput = document.getElementById('catDesc');
            const statusSelect = document.getElementById('catStatus');

            if (!nameInput.value.trim() || !descInput.value.trim()) {
                Swal.fire('Lỗi', 'Vui lòng điền đầy đủ Tên và Mô tả!', 'error');
                return;
            }

            const categories = JSON.parse(localStorage.getItem('viettel_categories') || '[]');
            
            if (editingCategoryId !== null) {
                // Update mode
                const index = categories.findIndex(c => c.id === editingCategoryId);
                if (index !== -1) {
                    categories[index].name = nameInput.value.trim();
                    categories[index].desc = descInput.value.trim();
                    categories[index].status = statusSelect.value;
                    localStorage.setItem('viettel_categories', JSON.stringify(categories));
                    Swal.fire('Thành công', 'Đã cập nhật danh mục sự cố!', 'success');
                }
                editingCategoryId = null;
                document.getElementById('formTitle').textContent = 'Thêm Danh Mục Mới';
                document.getElementById('btnSubmitCat').textContent = 'Lưu Danh Mục';
                document.getElementById('btnCancelEdit').classList.add('d-none');
            } else {
                // Insert mode
                // Generate a custom ID slug from name
                const idSlug = nameInput.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                // Check duplication
                if (categories.some(c => c.id === idSlug)) {
                    Swal.fire('Lỗi', 'Danh mục này đã tồn tại hoặc trùng mã tự động!', 'error');
                    return;
                }

                const newCat = {
                    id: idSlug,
                    name: nameInput.value.trim(),
                    desc: descInput.value.trim(),
                    status: statusSelect.value,
                    createdDate: getCurrentDateString()
                };

                categories.push(newCat);
                localStorage.setItem('viettel_categories', JSON.stringify(categories));
                Swal.fire('Thành công', 'Đã thêm danh mục sự cố thành công!', 'success');
            }

            form.reset();
            renderCategoriesTable();
        });

        // Cancel Edit handler
        const cancelBtn = document.getElementById('btnCancelEdit');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                editingCategoryId = null;
                form.reset();
                document.getElementById('formTitle').textContent = 'Thêm Danh Mục Mới';
                document.getElementById('btnSubmitCat').textContent = 'Lưu Danh Mục';
                cancelBtn.classList.add('d-none');
            });
        }
    }
}

function renderCategoriesTable() {
    const tableBody = document.getElementById('categoriesBody');
    if (!tableBody) return;

    const categories = JSON.parse(localStorage.getItem('viettel_categories') || '[]');

    if (categories.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Chưa có danh mục nào. Hãy tạo danh mục đầu tiên!</td></tr>`;
        return;
    }

    tableBody.innerHTML = categories.map((cat, idx) => {
        const isAct = cat.status === 'Hoạt động';
        const badgeClass = isAct ? 'approved' : 'cancelled';
        const badgeText = isAct ? 'Đang hoạt động' : 'Tạm khóa';

        return `
            <tr>
                <td class="fw-bold">${idx + 1}</td>
                <td>
                    <div class="fw-semibold text-dark-emphasis">${cat.name}</div>
                    <div class="text-muted fs-9">Mã: ${cat.id}</div>
                </td>
                <td>
                    <div class="text-wrap" style="max-width: 320px; font-size: 0.85rem;">${cat.desc}</div>
                </td>
                <td>
                    <span class="badge-status ${badgeClass}">${badgeText}</span>
                </td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="btn-action-edit" onclick="editCategory('${cat.id}')" title="Chỉnh sửa">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-action-delete" onclick="deleteCategory('${cat.id}')" title="Xóa">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Global functions for inline actions in Table rows
window.editCategory = function(id) {
    const categories = JSON.parse(localStorage.getItem('viettel_categories') || '[]');
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    editingCategoryId = id;
    document.getElementById('catName').value = cat.name;
    document.getElementById('catDesc').value = cat.desc;
    document.getElementById('catStatus').value = cat.status;

    document.getElementById('formTitle').textContent = 'Hiệu Chỉnh Danh Mục';
    document.getElementById('btnSubmitCat').textContent = 'Cập Nhật';
    document.getElementById('btnCancelEdit').classList.remove('d-none');
    
    // Smooth scroll to form on mobile
    document.getElementById('categoryFormCard').scrollIntoView({ behavior: 'smooth' });
};

window.deleteCategory = function(id) {
    // Check if services depend on this category
    const services = JSON.parse(localStorage.getItem('viettel_services') || '[]');
    const hasDependencies = services.some(s => s.categoryId === id);

    if (hasDependencies) {
        Swal.fire('Cảnh báo', 'Không thể xóa danh mục này vì đang có dịch vụ chi tiết liên kết bên trong! Vui lòng xóa dịch vụ đó trước.', 'warning');
        return;
    }

    Swal.fire({
        title: 'Xác nhận xóa?',
        text: "Hành động này không thể hoàn tác sau khi đã xóa danh mục!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EE0033',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Đồng ý xóa',
        cancelButtonText: 'Hủy bỏ'
    }).then((result) => {
        if (result.isConfirmed) {
            let categories = JSON.parse(localStorage.getItem('viettel_categories') || '[]');
            categories = categories.filter(c => c.id !== id);
            localStorage.setItem('viettel_categories', JSON.stringify(categories));
            
            Swal.fire('Đã xóa', 'Danh mục đã được xóa bỏ thành công.', 'success');
            renderCategoriesTable();
        }
    });
};


/* =============================================================
   8. APPOINTMENTS SCHEDULER VIEW CONTROLLER
   ============================================================= */
let editingAppointmentId = null;

function setupAppointmentsPage() {
    renderAppointmentsTable();

    // Initialize Flatpickr calendars in modal for rescheduling
    const reschedDate = document.getElementById('reschedDate');
    const reschedTime = document.getElementById('reschedTime');
    
    if (reschedDate) {
        flatpickr(reschedDate, {
            locale: "vn",
            dateFormat: "d/m/Y",
            minDate: "today",
            placeholder: "Chọn ngày hẹn mới"
        });
    }

    if (reschedTime) {
        flatpickr(reschedTime, {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            placeholder: "Chọn giờ hẹn mới"
        });
    }

    // Reschedule form submission
    const form = document.getElementById('rescheduleForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (editingAppointmentId === null) return;

            const newDate = document.getElementById('reschedDate').value;
            const newTime = document.getElementById('reschedTime').value;

            if (!newDate || !newTime) {
                Swal.fire('Lỗi', 'Vui lòng chọn ngày và giờ mới!', 'error');
                return;
            }

            const appointments = JSON.parse(localStorage.getItem('viettel_appointments') || '[]');
            const index = appointments.findIndex(a => a.id === editingAppointmentId);
            if (index !== -1) {
                appointments[index].appointmentDate = newDate;
                appointments[index].appointmentTime = newTime;
                // automatically approve rescheduled appointment
                appointments[index].status = 'approved';
                localStorage.setItem('viettel_appointments', JSON.stringify(appointments));

                // Sync with tickets
                const tickets = JSON.parse(localStorage.getItem('viettel_tickets') || '[]');
                const ticketIndex = tickets.findIndex(t => t.ticketCode === appointments[index].ticketCode);
                if (ticketIndex !== -1) {
                    tickets[ticketIndex].appointmentDate = newDate;
                    tickets[ticketIndex].appointmentTime = newTime;
                    localStorage.setItem('viettel_tickets', JSON.stringify(tickets));
                }

                Swal.fire('Thành công', 'Lịch hẹn hỗ trợ đã được đổi thời gian!', 'success');
                
                // Hide modal using bootstrap API
                const modalEl = document.getElementById('rescheduleModal');
                const modalInst = bootstrap.Modal.getInstance(modalEl);
                if (modalInst) modalInst.hide();
                
                renderAppointmentsTable();
            }
        });
    }
}

function renderAppointmentsTable() {
    const tableBody = document.getElementById('appointmentsBody');
    if (!tableBody) return;

    const appointments = JSON.parse(localStorage.getItem('viettel_appointments') || '[]');

    if (appointments.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Chưa có lịch hẹn sửa chữa nào được đăng ký.</td></tr>`;
        return;
    }

    tableBody.innerHTML = appointments.map((app) => {
        let badgeClass = '';
        let badgeText = '';
        let showActionButtons = '';

        switch (app.status) {
            case 'waiting':
                badgeClass = 'waiting';
                badgeText = 'Chờ duyệt';
                showActionButtons = `
                    <button class="btn-action-approve" onclick="approveAppointment(${app.id})" title="Duyệt lịch">
                        <i class="fa-solid fa-check"></i>
                    </button>
                `;
                break;
            case 'approved':
                badgeClass = 'approved';
                badgeText = 'Đã duyệt';
                showActionButtons = `
                    <button class="btn-action-approve bg-success-subtle text-success" onclick="completeAppointment(${app.id})" title="Hoàn thành lịch">
                        <i class="fa-solid fa-clipboard-check"></i>
                    </button>
                `;
                break;
            case 'completed':
                badgeClass = 'completed';
                badgeText = 'Hoàn thành';
                break;
            case 'cancelled':
                badgeClass = 'cancelled';
                badgeText = 'Đã hủy';
                break;
        }

        // Always show reschedule and delete/cancel buttons unless completed/cancelled
        const enableEdit = app.status === 'waiting' || app.status === 'approved';
        const editButton = enableEdit ? `
            <button class="btn-action-edit" data-bs-toggle="modal" data-bs-target="#rescheduleModal" onclick="prepareReschedule(${app.id})" title="Đổi thời gian">
                <i class="fa-solid fa-clock"></i>
            </button>
            <button class="btn-action-delete" onclick="cancelAppointment(${app.id})" title="Hủy lịch">
                <i class="fa-solid fa-xmark"></i>
            </button>
        ` : '';

        return `
            <tr>
                <td class="fw-bold text-danger">${app.ticketCode}</td>
                <td>
                    <div class="fw-semibold text-dark-emphasis">${app.customerName}</div>
                </td>
                <td>
                    <div class="fs-9 text-muted">${app.serviceName}</div>
                </td>
                <td class="fw-semibold text-dark-emphasis">${app.appointmentDate}</td>
                <td class="fw-bold">${app.appointmentTime}</td>
                <td>
                    <span class="badge-status ${badgeClass}">${badgeText}</span>
                    ${app.notes ? `<div class="fs-10 text-muted mt-1 italic">${app.notes}</div>` : ''}
                </td>
                <td>
                    <div class="d-flex gap-2">
                        ${showActionButtons}
                        ${editButton}
                        <button class="btn-action-view text-info" onclick="notifyCustomer('${app.ticketCode}', '${app.customerName}')" title="Gửi SMS/Email thông báo">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.approveAppointment = function(id) {
    const appointments = JSON.parse(localStorage.getItem('viettel_appointments') || '[]');
    const idx = appointments.findIndex(a => a.id === id);
    if (idx !== -1) {
        appointments[idx].status = 'approved';
        appointments[idx].notes = 'Đã bàn giao kỹ thuật viên khu vực.';
        localStorage.setItem('viettel_appointments', JSON.stringify(appointments));
        Swal.fire('Thành công', 'Lịch hẹn hỗ trợ đã được duyệt thành công!', 'success');
        renderAppointmentsTable();
    }
};

window.completeAppointment = function(id) {
    const appointments = JSON.parse(localStorage.getItem('viettel_appointments') || '[]');
    const idx = appointments.findIndex(a => a.id === id);
    if (idx !== -1) {
        appointments[idx].status = 'completed';
        appointments[idx].notes = 'Kỹ thuật viên đã xử lý xong tại nhà khách hàng.';
        localStorage.setItem('viettel_appointments', JSON.stringify(appointments));

        // Mark corresponding ticket as completed as well
        const tickets = JSON.parse(localStorage.getItem('viettel_tickets') || '[]');
        const ticketIdx = tickets.findIndex(t => t.ticketCode === appointments[idx].ticketCode);
        if (ticketIdx !== -1) {
            tickets[ticketIdx].status = 'completed';
            localStorage.setItem('viettel_tickets', JSON.stringify(tickets));
        }

        Swal.fire('Hoàn thành', 'Lịch hẹn và Phiếu hỗ trợ liên kết đã được cập nhật trạng thái Hoàn thành!', 'success');
        renderAppointmentsTable();
    }
};

window.cancelAppointment = function(id) {
    Swal.fire({
        title: 'Hủy lịch hẹn?',
        text: 'Lịch hẹn hỗ trợ tại nhà sẽ bị hủy bỏ và chuyển sang trạng thái Đã hủy.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EE0033',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Đồng ý hủy',
        cancelButtonText: 'Không'
    }).then((result) => {
        if (result.isConfirmed) {
            const appointments = JSON.parse(localStorage.getItem('viettel_appointments') || '[]');
            const idx = appointments.findIndex(a => a.id === id);
            if (idx !== -1) {
                appointments[idx].status = 'cancelled';
                appointments[idx].notes = 'Đã hủy theo yêu cầu của phòng kỹ thuật.';
                localStorage.setItem('viettel_appointments', JSON.stringify(appointments));
                Swal.fire('Đã hủy', 'Lịch hẹn hỗ trợ đã được chuyển thành Đã hủy.', 'success');
                renderAppointmentsTable();
            }
        }
    });
};

window.prepareReschedule = function(id) {
    editingAppointmentId = id;
    const appointments = JSON.parse(localStorage.getItem('viettel_appointments') || '[]');
    const app = appointments.find(a => a.id === id);
    if (app) {
        document.getElementById('reschedTicketCode').value = app.ticketCode;
        document.getElementById('reschedDate').value = app.appointmentDate;
        document.getElementById('reschedTime').value = app.appointmentTime;
    }
};

window.notifyCustomer = function(ticketCode, customerName) {
    Swal.fire({
        title: 'Gửi thông báo?',
        text: `Mô phỏng gửi thông báo tự động (SMS & Email) về trạng thái lịch hẹn đến khách hàng ${customerName}.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#EE0033',
        confirmButtonText: 'Gửi ngay',
        cancelButtonText: 'Đóng'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Đang gửi thông báo...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            setTimeout(() => {
                Swal.close();
                Swal.fire({
                    icon: 'success',
                    title: 'Đã gửi thành công!',
                    html: `Tin nhắn SMS và Email thông báo về mã phiếu <strong>${ticketCode}</strong> đã được gửi tới khách hàng.`,
                    confirmButtonColor: '#EE0033'
                });
            }, 1000);
        }
    });
};


/* =============================================================
   9. PROFILE VIEW CONTROLLER
   ============================================================= */
function setupProfilePage() {
    // Load existing profile values into form inputs
    const profile = JSON.parse(localStorage.getItem('viettel_profile'));
    if (profile) {
        document.getElementById('profName').value = profile.name;
        document.getElementById('profEmail').value = profile.email;
        document.getElementById('profPhone').value = profile.phone;
        document.getElementById('profRole').value = profile.role;
        if (profile.avatar) {
            const previewBox = document.getElementById('avatarPreview');
            const previewImg = document.getElementById('avatarPreviewImg');
            if (previewBox && previewImg) {
                previewImg.src = profile.avatar;
                previewBox.style.display = 'block';
            }
        }
    }

    // Personal info form submit
    const infoForm = document.getElementById('profileInfoForm');
    if (infoForm) {
        infoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const updatedProfile = {
                name: document.getElementById('profName').value.trim(),
                email: document.getElementById('profEmail').value.trim(),
                phone: document.getElementById('profPhone').value.trim(),
                role: document.getElementById('profRole').value.trim(),
                avatar: document.getElementById('avatarPreviewImg')?.src || profile.avatar
            };

            localStorage.setItem('viettel_profile', JSON.stringify(updatedProfile));
            syncProfileHeader();
            Swal.fire('Thành công', 'Thông tin cá nhân đã được lưu thành công!', 'success');
        });
    }

    // Change password form submit
    const pwdForm = document.getElementById('profilePasswordForm');
    if (pwdForm) {
        pwdForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const currentPwd = document.getElementById('currPassword').value;
            const newPwd = document.getElementById('newPassword').value;
            const confirmPwd = document.getElementById('confirmPassword').value;

            // Validate current password
            const savedPwd = localStorage.getItem('viettel_admin_pwd');
            if (currentPwd !== savedPwd) {
                Swal.fire('Lỗi bảo mật', 'Mật khẩu hiện tại không chính xác!', 'error');
                return;
            }

            // Strong password checks
            if (newPwd.length < 8) {
                Swal.fire('Lỗi bảo mật', 'Mật khẩu mới phải có ít nhất 8 ký tự!', 'warning');
                return;
            }

            const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])");
            if (!strongRegex.test(newPwd)) {
                Swal.fire('Lỗi bảo mật', 'Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (!@#$%).', 'warning');
                return;
            }

            // Match confirmation
            if (newPwd !== confirmPwd) {
                Swal.fire('Lỗi', 'Xác nhận mật khẩu mới không khớp!', 'error');
                return;
            }

            // Save new password
            localStorage.setItem('viettel_admin_pwd', newPwd);
            pwdForm.reset();
            Swal.fire('Thành công', 'Mật khẩu quản trị đã được thay đổi thành công!', 'success');
        });
    }

    // Drag and Drop uploader setup
    initDragDropUploader();
}

function initDragDropUploader() {
    const uploadArea = document.getElementById('avatarUploadArea');
    const fileInput = document.getElementById('avatarFile');
    const previewBox = document.getElementById('avatarPreview');
    const previewImg = document.getElementById('avatarPreviewImg');

    if (!uploadArea || !fileInput || !previewBox || !previewImg) return;

    // Click area triggers file input click
    uploadArea.addEventListener('click', () => fileInput.click());

    // Highlight area when dragging file over
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        }, false);
    });

    // Handle dropped file
    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleAvatarFiles(files);
    });

    // Handle selected file via dialog
    fileInput.addEventListener('change', function() {
        handleAvatarFiles(this.files);
    });

    function handleAvatarFiles(files) {
        if (files.length === 0) return;
        const file = files[0];
        
        // Validation check for formats
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            Swal.fire('Lỗi định dạng', 'Chỉ chấp nhận các định dạng file ảnh: JPG, PNG, WEBP!', 'error');
            return;
        }

        // Validate size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            Swal.fire('Lỗi kích thước', 'Dung lượng file ảnh đại diện không vượt quá 2MB!', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            // Display preview immediately
            previewImg.src = dataUrl;
            previewBox.style.display = 'block';
            
            // Auto update image string in uploader to save to profile
            Swal.fire('Đã sẵn sàng', 'Hình ảnh đã được tải lên thành công. Nhấp Lưu thông tin để cập nhật!', 'info');
        };
        reader.readAsDataURL(file);
    }
}


/* =============================================================
   10. COMMON UTILS
   ============================================================= */
function getCurrentDateString() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}
