/**
 * staff-ticket-management.js — TechSupport Viettel Admin
 * Premium Ticket Management Logic with Sorting, Pagination, Advanced Filters,
 * Timeline, Chart.js Visualizations, and Modal CRUD.
 */
'use strict';

// Storage Keys
const TICKETS_KEY = 'viettel_tickets';
const SERVICES_KEY = 'viettel_services';
const CATEGORIES_KEY = 'viettel_categories';
const CUSTOMERS_KEY = 'viettel_customers';
const HISTORY_KEY = 'viettel_ticket_history';
const APPOINTMENTS_KEY = 'viettel_appointments';

// State Variables
let tickets = [];
let services = [];
let categories = [];
let customers = [];
let historyLogs = [];
let appointments = [];

let filteredTickets = [];
let currentPage = 1;
let pageSize = 10;
let currentSortColumn = 'createdDate';
let currentSortDirection = 'desc'; // 'asc' or 'desc'

// Chart Instances
let statusChart = null;
let monthlyChart = null;
let serviceChart = null;

// Bootstrap Modal Instances
let viewModal = null;
let addModal = null;
let editModal = null;

// Mock Staff List
const staffList = [
    { id: 'NV001', hoTen: 'Nguyễn Văn Hùng', chucVu: 'Kỹ thuật viên Trưởng' },
    { id: 'NV002', hoTen: 'Nguyễn Hữu Nam', chucVu: 'Kỹ thuật viên' },
    { id: 'NV003', hoTen: 'Trần Minh Hoàng', chucVu: 'Kỹ thuật viên' },
    { id: 'NV004', hoTen: 'Phạm Thanh Sơn', chucVu: 'Điều phối viên' }
];

document.addEventListener('DOMContentLoaded', function () {
    // 1. Load data & Seed
    loadDatabase();

    // 2. Initialize Modal instances
    initModals();

    // 3. Populate filters dropdown
    populateFiltersDropdown();

    // 4. Bind event listeners
    bindEvents();

    // 5. Simulate Loading Skeleton
    showLoadingSkeleton(600, () => {
        // Apply initial filters & render
        applyFilters();
        // Initialize Charts
        initCharts();
    });
});

/* =============================================================
   1. DATA LOADING & MOCK SETUP
   ============================================================= */
function loadDatabase() {
    tickets = JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]');
    services = JSON.parse(localStorage.getItem(SERVICES_KEY) || '[]');
    categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]');
    customers = JSON.parse(localStorage.getItem(CUSTOMERS_KEY) || '[]');
    historyLogs = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    appointments = JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');

    // Seed default tickets if empty
    if (!tickets.length) {
        tickets = [
            { id: 1, ticketCode: 'PHT-20260001', title: 'Mất mạng đột ngột sau mưa lớn', categoryId: 'internet', serviceId: 'ftth', requestType: 'Báo Hỏng Thiết Bị', priority: 'Khẩn Cấp', status: 'processing', description: 'Đèn PON nhấp nháy đỏ trên modem, không thể truy cập internet từ sáng nay.', createdDate: '10/05/2026 08:30:00', updatedDate: '11/05/2026 09:15:00', customerName: 'Trần Quốc Bảo', customerPhone: '0986123456', needAppointment: true, appointmentDate: '11/05/2026', appointmentTime: '09:00', appointmentNote: 'Vui lòng đến buổi sáng sau 8h', staffId: 'NV002' },
            { id: 2, ticketCode: 'PHT-20260002', title: 'Lỗi đầu thu TV360 không lên kênh', categoryId: 'tv', serviceId: 'combo', requestType: 'Hỗ Trợ Kỹ Thuật', priority: 'Cao', status: 'waiting', description: 'Đầu thu hiện mã lỗi 102, đã reset nhiều lần không hết.', createdDate: '20/05/2026 14:15:00', updatedDate: '20/05/2026 14:15:00', customerName: 'Nguyễn Thị Hoa', customerPhone: '0975888999', needAppointment: true, appointmentDate: '21/05/2026', appointmentTime: '15:30', appointmentNote: '', staffId: 'NV003' },
            { id: 3, ticketCode: 'PHT-20260003', title: 'Yêu cầu mở rộng thêm 2 node Mesh Wifi', categoryId: 'wifi-corporate', serviceId: 'mesh-wifi', requestType: 'Đăng Ký Mới', priority: 'Trung Bình', status: 'completed', description: 'Văn phòng mở rộng tầng 3 cần lắp thêm node phụ để phủ sóng.', createdDate: '22/05/2026 10:00:00', updatedDate: '23/05/2026 16:30:00', customerName: 'Công ty Cổ phần TechSoft', customerPhone: '02466778899', needAppointment: false, appointmentDate: '', appointmentTime: '', appointmentNote: '', staffId: 'NV001' },
            { id: 4, ticketCode: 'PHT-20260004', title: 'Camera không lưu trữ được Cloud', categoryId: 'camera', serviceId: 'home-camera', requestType: 'Hỗ Trợ Kỹ Thuật', priority: 'Trung Bình', status: 'waiting', description: 'Gói cloud 7 ngày đã kích hoạt nhưng xem lại báo không có dữ liệu.', createdDate: '25/05/2026 11:20:00', updatedDate: '25/05/2026 11:20:00', customerName: 'Phạm Minh Tuấn', customerPhone: '0912345678', needAppointment: false, appointmentDate: '', appointmentTime: '', appointmentNote: '', staffId: '' },
            { id: 5, ticketCode: 'PHT-20260005', title: 'Đăng ký thuê Cloud VPS cấu hình cao', categoryId: 'cloud-server', serviceId: 'cloud-vps', requestType: 'Đăng Ký Mới', priority: 'Thấp', status: 'completed', description: 'Cần thuê VPS 4 vCPU, 8GB RAM, 100GB SSD cài hệ điều hành Ubuntu.', createdDate: '28/05/2026 16:45:00', updatedDate: '29/05/2026 10:00:00', customerName: 'Lê Hoàng Hải', customerPhone: '0963111222', needAppointment: false, appointmentDate: '', appointmentTime: '', appointmentNote: '', staffId: 'NV001' },
            { id: 6, ticketCode: 'PHT-20260006', title: 'Modem Wifi bị cháy cục nguồn do chập điện', categoryId: 'internet', serviceId: 'ftth', requestType: 'Báo Hỏng Thiết Bị', priority: 'Khẩn Cấp', status: 'cancelled', description: 'Ổ cắm điện bị chập làm modem khét lẹt, cần kỹ thuật mang modem mới thay thế.', createdDate: '01/06/2026 07:15:00', updatedDate: '01/06/2026 10:20:00', customerName: 'Vũ Minh Đức', customerPhone: '0988456123', needAppointment: true, appointmentDate: '01/06/2026', appointmentTime: '10:00', appointmentNote: 'Mang theo nguồn thay thế', staffId: 'NV002' },
            { id: 7, ticketCode: 'PHT-20260007', title: 'Tổng đài ảo vCloudCenter không gọi ra được', categoryId: 'phone', serviceId: 'vcloudcenter', requestType: 'Hỗ Trợ Kỹ Thuật', priority: 'Khẩn Cấp', status: 'processing', description: 'Cuộc gọi đi liên tục báo lỗi SIP 503, khách hàng phản ánh không liên lạc được.', createdDate: '05/06/2026 09:30:00', updatedDate: '06/06/2026 08:00:00', customerName: 'Khách sạn Viễn Đông', customerPhone: '02839111222', needAppointment: false, appointmentDate: '', appointmentTime: '', appointmentNote: '', staffId: 'NV003' },
            { id: 8, ticketCode: 'PHT-20260008', title: 'Lỗi phân giải tên miền DNS trên VPS', categoryId: 'cloud-server', serviceId: 'cloud-vps', requestType: 'Hỗ Trợ Kỹ Thuật', priority: 'Cao', status: 'feedback', description: 'VPS không thể phân giải được các tên miền ngoài, ping IP hoạt động bình thường.', createdDate: '08/06/2026 15:40:00', updatedDate: '09/06/2026 14:00:00', customerName: 'Nguyễn Văn Đạt', customerPhone: '0979555666', needAppointment: false, appointmentDate: '', appointmentTime: '', appointmentNote: '', staffId: 'NV002' }
        ];
        localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
    }

    // Seed default history logs if empty
    if (!historyLogs.length) {
        historyLogs = [
            { id: 'H-001', ticketCode: 'PHT-20260001', timestamp: '10/05/2026 08:30:00', staffName: 'Hệ thống', oldStatus: '', newStatus: 'waiting', notes: 'Khách hàng Trần Quốc Bảo tạo phiếu hỗ trợ mới qua ứng dụng MyViettel.' },
            { id: 'H-002', ticketCode: 'PHT-20260001', timestamp: '10/05/2026 09:10:00', staffName: 'Phạm Thanh Sơn', oldStatus: 'waiting', newStatus: 'processing', notes: 'Duyệt phiếu và phân công cho Kỹ thuật viên Nguyễn Hữu Nam xử lý trực tiếp.' },
            { id: 'H-003', ticketCode: 'PHT-20260001', timestamp: '11/05/2026 09:15:00', staffName: 'Nguyễn Hữu Nam', oldStatus: 'processing', newStatus: 'processing', notes: 'Đã ghé nhà khách hàng xử lý nối lại đầu bấm cáp quang do gãy gập.' },
            { id: 'H-004', ticketCode: 'PHT-20260002', timestamp: '20/05/2026 14:15:00', staffName: 'Hệ thống', oldStatus: '', newStatus: 'waiting', notes: 'Khách hàng tạo phiếu yêu cầu kỹ thuật cho đầu thu TV360.' },
            { id: 'H-005', ticketCode: 'PHT-20260003', timestamp: '22/05/2026 10:00:00', staffName: 'Hệ thống', oldStatus: '', newStatus: 'waiting', notes: 'Tạo phiếu đăng ký mới dịch vụ Mesh Wifi.' },
            { id: 'H-006', ticketCode: 'PHT-20260003', timestamp: '22/05/2026 10:30:00', staffName: 'Phạm Thanh Sơn', oldStatus: 'waiting', newStatus: 'processing', notes: 'Phân phối phiếu cho kỹ thuật trưởng xử lý cấu hình thiết bị.' },
            { id: 'H-007', ticketCode: 'PHT-20260003', timestamp: '23/05/2026 16:30:00', staffName: 'Nguyễn Văn Hùng', oldStatus: 'processing', newStatus: 'completed', notes: 'Hoàn tất lắp ráp và cấu hình 2 node phụ Mesh Wifi hoạt động ổn định.' }
        ];
        localStorage.setItem(HISTORY_KEY, JSON.stringify(historyLogs));
    }

    // Default categories & services fallback
    if (!services.length) {
        services = [
            { id: 'ftth', name: 'Internet Cáp Quang FTTH' },
            { id: 'combo', name: 'Combo Internet + TV' },
            { id: 'home-camera', name: 'Camera Viettel (Home Camera)' },
            { id: 'mesh-wifi', name: 'Mesh Wifi' },
            { id: 'cloud-vps', name: 'Cloud VPS' },
            { id: 'vcloudcenter', name: 'Tổng đài ảo vCloudCenter' }
        ];
    }
    if (!categories.length) {
        categories = [
            { id: 'internet', name: 'Internet cáp quang' },
            { id: 'tv', name: 'Truyền hình số' },
            { id: 'camera', name: 'Camera giám sát' },
            { id: 'phone', name: 'Điện thoại cố định' },
            { id: 'wifi-corporate', name: 'WiFi doanh nghiệp' },
            { id: 'cloud-server', name: 'Dịch vụ Cloud Server' }
        ];
    }
    if (!customers.length) {
        customers = [
            { hoTen: 'Trần Quốc Bảo', soDienThoai: '0986123456', email: 'bao.tq@gmail.com', diaChi: 'Số 1 Giang Văn Minh, Ba Đình, Hà Nội' },
            { hoTen: 'Nguyễn Thị Hoa', soDienThoai: '0975888999', email: 'hoa.nt@gmail.com', diaChi: 'Ngõ 106 Hoàng Quốc Việt, Cầu Giấy, Hà Nội' },
            { hoTen: 'Phạm Minh Tuấn', soDienThoai: '0912345678', email: 'tuan.pm@gmail.com', diaChi: 'Tòa nhà Viettel, Trần Hưng Đạo, Quận 1, TP. HCM' },
            { hoTen: 'Lê Hoàng Hải', soDienThoai: '0963111222', email: 'hai.lh@gmail.com', diaChi: '156 Lê Lợi, Hải Châu, Đà Nẵng' },
            { hoTen: 'Vũ Minh Đức', soDienThoai: '0988456123', email: 'duc.vm@gmail.com', diaChi: 'Số 5 Chùa Bộc, Đống Đa, Hà Nội' },
            { hoTen: 'Nguyễn Văn Đạt', soDienThoai: '0979555666', email: 'dat.nv@gmail.com', diaChi: '24 Quang Trung, Hà Đông, Hà Nội' },
            { hoTen: 'Khách sạn Viễn Đông', soDienThoai: '02839111222', email: 'contact@viendonghotel.com', diaChi: '275 Phạm Ngũ Lão, Quận 1, TP. HCM' }
        ];
    }
}

function saveDatabase() {
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historyLogs));
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
}

/* =============================================================
   2. INITIALIZATIONS & DOM BINDINGS
   ============================================================= */
function initModals() {
    const viewEl = document.getElementById('viewDetailsModal');
    const addEl = document.getElementById('addTicketModal');
    const editEl = document.getElementById('editTicketModal');

    if (viewEl) viewModal = new bootstrap.Modal(viewEl);
    if (addEl) addModal = new bootstrap.Modal(addEl);
    if (editEl) editModal = new bootstrap.Modal(editEl);
}

function populateFiltersDropdown() {
    // Service options
    const filterService = document.getElementById('filterService');
    const addService = document.getElementById('addService');
    const editService = document.getElementById('editService');

    let serviceHtml = '<option value="all">Tất cả dịch vụ</option>';
    let serviceModalHtml = '';
    services.forEach(s => {
        serviceHtml += `<option value="${s.id}">${s.name}</option>`;
        serviceModalHtml += `<option value="${s.id}">${s.name}</option>`;
    });

    if (filterService) filterService.innerHTML = serviceHtml;
    if (addService) addService.innerHTML = '<option value="" disabled selected>-- Chọn dịch vụ --</option>' + serviceModalHtml;
    if (editService) editService.innerHTML = serviceModalHtml;

    // Staff options
    const filterStaff = document.getElementById('filterStaff');
    const addStaff = document.getElementById('addStaff');
    const editStaff = document.getElementById('editStaff');

    let staffHtml = '<option value="all">Tất cả nhân viên</option>';
    let staffModalHtml = '<option value="">Chưa phân công</option>';
    staffList.forEach(st => {
        staffHtml += `<option value="${st.id}">${st.hoTen} (${st.chucVu})</option>`;
        staffModalHtml += `<option value="${st.id}">${st.hoTen} (${st.chucVu})</option>`;
    });

    if (filterStaff) filterStaff.innerHTML = staffHtml;
    if (addStaff) addStaff.innerHTML = staffModalHtml;
    if (editStaff) editStaff.innerHTML = staffModalHtml;

    // Customers options (for Add modal autocomplete or select)
    const addCustomerSelect = document.getElementById('addCustomer');
    if (addCustomerSelect) {
        let custHtml = '<option value="" disabled selected>-- Chọn khách hàng --</option>';
        customers.forEach(c => {
            custHtml += `<option value="${c.hoTen}">${c.hoTen} - ${c.soDienThoai}</option>`;
        });
        addCustomerSelect.innerHTML = custHtml;
    }
}

function showLoadingSkeleton(duration = 600, callback) {
    const tableBody = document.getElementById('ticketsTableBody');
    if (tableBody) {
        let skeletonRows = '';
        for (let i = 0; i < 5; i++) {
            skeletonRows += `
                <tr>
                    <td colspan="13" class="py-3">
                        <div class="d-flex align-items-center gap-2">
                            <div class="skeleton-loading" style="height: 15px; width: 4%;"></div>
                            <div class="skeleton-loading" style="height: 15px; width: 10%;"></div>
                            <div class="skeleton-loading" style="height: 15px; width: 20%;"></div>
                            <div class="skeleton-loading" style="height: 15px; width: 12%;"></div>
                            <div class="skeleton-loading" style="height: 15px; width: 10%;"></div>
                            <div class="skeleton-loading" style="height: 15px; width: 10%;"></div>
                            <div class="skeleton-loading" style="height: 15px; width: 10%;"></div>
                            <div class="skeleton-loading" style="height: 15px; width: 10%;"></div>
                            <div class="skeleton-loading" style="height: 15px; width: 8%;"></div>
                        </div>
                    </td>
                </tr>
            `;
        }
        tableBody.innerHTML = skeletonRows;
    }

    setTimeout(() => {
        if (callback) callback();
    }, duration);
}

function bindEvents() {
    // Filters action buttons
    const btnFilter = document.getElementById('btnApplyFilters');
    const btnReset = document.getElementById('btnResetFilters');
    const btnExport = document.getElementById('btnExportExcel');

    if (btnFilter) btnFilter.addEventListener('click', () => {
        currentPage = 1;
        applyFilters();
        showToast('success', 'Đã cập nhật danh sách phiếu lọc.');
    });

    if (btnReset) btnReset.addEventListener('click', () => {
        resetFilters();
        applyFilters();
        showToast('info', 'Đã đặt lại các bộ lọc.');
    });

    if (btnExport) btnExport.addEventListener('click', exportToExcel);

    // Live search input handler
    const txtSearch = document.getElementById('searchQuery');
    if (txtSearch) {
        txtSearch.addEventListener('input', debounce(() => {
            currentPage = 1;
            applyFilters();
        }, 300));
    }

    // Page size selection
    const selectPageSize = document.getElementById('pageSizeSelect');
    if (selectPageSize) {
        selectPageSize.addEventListener('change', function () {
            pageSize = parseInt(this.value, 10);
            currentPage = 1;
            renderTable();
        });
    }

    // Sort column table triggers
    document.querySelectorAll('.sortable[data-sort]').forEach(th => {
        th.addEventListener('click', function () {
            const column = this.getAttribute('data-sort');
            if (currentSortColumn === column) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = column;
                currentSortDirection = 'asc';
            }
            
            // Toggle sorting classes
            document.querySelectorAll('.sortable').forEach(el => {
                el.classList.remove('asc', 'desc');
            });
            this.classList.add(currentSortDirection);

            // Sort & Render
            sortTicketsList();
            renderTable();
        });
    });

    // Theme toggle sync
    const toggleThemeBtn = document.getElementById('toggleTheme');
    if (toggleThemeBtn) {
        toggleThemeBtn.addEventListener('click', function () {
            setTimeout(() => {
                const newTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
                updateChartThemes(newTheme);
            }, 100);
        });
    }

    // Form Add Ticket Submit
    const addForm = document.getElementById('addTicketForm');
    if (addForm) {
        addForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleCreateTicket();
        });
    }

    // Form Edit Ticket Submit
    const editForm = document.getElementById('editTicketForm');
    if (editForm) {
        editForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleUpdateTicket();
        });
    }

    // Auto load customer info in Add modal
    const addCustomerSelect = document.getElementById('addCustomer');
    if (addCustomerSelect) {
        addCustomerSelect.addEventListener('change', function () {
            const customerName = this.value;
            const cust = customers.find(c => c.hoTen === customerName);
            if (cust) {
                const addPhoneInput = document.getElementById('addCustomerPhone');
                if (addPhoneInput) addPhoneInput.value = cust.soDienThoai;
            }
        });
    }
}

/* =============================================================
   3. FILTERING & SORTING LOGIC
   ============================================================= */
function applyFilters() {
    const query = document.getElementById('searchQuery')?.value.trim().toLowerCase() || '';
    const status = document.getElementById('filterStatus')?.value || 'all';
    const priority = document.getElementById('filterPriority')?.value || 'all';
    const service = document.getElementById('filterService')?.value || 'all';
    const staff = document.getElementById('filterStaff')?.value || 'all';
    const fromDateStr = document.getElementById('filterFromDate')?.value || '';
    const toDateStr = document.getElementById('filterToDate')?.value || '';

    filteredTickets = tickets.filter(t => {
        // Text Query
        const matchesQuery = !query || 
                             t.ticketCode.toLowerCase().includes(query) || 
                             t.title.toLowerCase().includes(query) || 
                             t.customerName.toLowerCase().includes(query) || 
                             (t.description && t.description.toLowerCase().includes(query));

        // Dropdowns
        const matchesStatus = status === 'all' || t.status === status;
        const matchesPriority = priority === 'all' || t.priority === priority;
        const matchesService = service === 'all' || t.serviceId === service;
        const matchesStaff = staff === 'all' || t.staffId === staff;

        // Date Range
        let matchesDates = true;
        if (fromDateStr || toDateStr) {
            const ticketDate = parseDateTimeString(t.createdDate);
            if (fromDateStr) {
                const fromDate = new Date(fromDateStr);
                fromDate.setHours(0, 0, 0, 0);
                if (ticketDate < fromDate) matchesDates = false;
            }
            if (toDateStr) {
                const toDate = new Date(toDateStr);
                toDate.setHours(23, 59, 59, 999);
                if (ticketDate > toDate) matchesDates = false;
            }
        }

        return matchesQuery && matchesStatus && matchesPriority && matchesService && matchesStaff && matchesDates;
    });

    sortTicketsList();
    updateKpi();
    renderTable();
    updateChartsData();
}

function resetFilters() {
    const query = document.getElementById('searchQuery');
    const status = document.getElementById('filterStatus');
    const priority = document.getElementById('filterPriority');
    const service = document.getElementById('filterService');
    const staff = document.getElementById('filterStaff');
    const fromDate = document.getElementById('filterFromDate');
    const toDate = document.getElementById('filterToDate');

    if (query) query.value = '';
    if (status) status.value = 'all';
    if (priority) priority.value = 'all';
    if (service) service.value = 'all';
    if (staff) staff.value = 'all';
    if (fromDate) fromDate.value = '';
    if (toDate) toDate.value = '';

    currentPage = 1;
}

function sortTicketsList() {
    filteredTickets.sort((a, b) => {
        let valA, valB;

        if (currentSortColumn === 'createdDate' || currentSortColumn === 'updatedDate') {
            valA = parseDateTimeString(a[currentSortColumn]);
            valB = parseDateTimeString(b[currentSortColumn]);
        } else if (currentSortColumn === 'priority') {
            const pLevel = { 'Thấp': 1, 'Trung Bình': 2, 'Cao': 3, 'Khẩn Cấp': 4 };
            valA = pLevel[a.priority] || 0;
            valB = pLevel[b.priority] || 0;
        } else {
            valA = String(a[currentSortColumn] || '').toLowerCase();
            valB = String(b[currentSortColumn] || '').toLowerCase();
        }

        if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
}

/* =============================================================
   4. KPI & TABLES RENDERING
   ============================================================= */
function updateKpi() {
    const total = tickets.length;
    const waiting = tickets.filter(t => t.status === 'waiting').length;
    const processing = tickets.filter(t => t.status === 'processing' || t.status === 'feedback').length; // including feedback
    const completed = tickets.filter(t => t.status === 'completed').length;
    const cancelled = tickets.filter(t => t.status === 'cancelled').length;
    const urgent = tickets.filter(t => t.priority === 'Khẩn Cấp').length;
    const needApp = tickets.filter(t => t.needAppointment).length;

    // Animate stats values
    animateNum('kpi-total', total);
    animateNum('kpi-waiting', waiting);
    animateNum('kpi-processing', processing);
    animateNum('kpi-completed', completed);
    animateNum('kpi-cancelled', cancelled);
    animateNum('kpi-urgent', urgent);
    animateNum('kpi-appointment', needApp);
}

function animateNum(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = val;
}

function renderTable() {
    const tbody = document.getElementById('ticketsTableBody');
    const mobileContainer = document.getElementById('mobileTicketsContainer');
    if (!tbody || !mobileContainer) return;

    const totalCount = filteredTickets.length;
    const startIdx = totalCount ? (currentPage - 1) * pageSize + 1 : 0;
    const endIdx = Math.min(currentPage * pageSize, totalCount);

    // Update entries details footer
    const footerCount = document.getElementById('tableCountDetails');
    if (footerCount) {
        footerCount.textContent = `Đang hiển thị ${startIdx}-${endIdx} / ${totalCount} phiếu hỗ trợ`;
    }

    const start = (currentPage - 1) * pageSize;
    const pageTickets = filteredTickets.slice(start, start + pageSize);

    // Render Empty State
    if (!pageTickets.length) {
        const emptyHtml = `
            <div class="empty-state-container my-3">
                <div class="empty-state-icon"><i class="fa-solid fa-ticket"></i></div>
                <h5 class="fw-bold text-dark">Không tìm thấy phiếu hỗ trợ phù hợp</h5>
                <p class="text-muted small">Vui lòng điều chỉnh lại bộ lọc tìm kiếm nâng cao hoặc tạo phiếu mới.</p>
                <button class="btn btn-viettel btn-sm mt-2" data-bs-toggle="modal" data-bs-target="#addTicketModal">
                    <i class="fa-solid fa-plus-circle me-1"></i> Tạo phiếu mới
                </button>
            </div>
        `;
        tbody.innerHTML = `<tr><td colspan="13" class="border-0">${emptyHtml}</td></tr>`;
        mobileContainer.innerHTML = emptyHtml;
        renderPagination(0);
        return;
    }

    // Render Desktop rows
    tbody.innerHTML = pageTickets.map((t, idx) => {
        const rowNo = start + idx + 1;
        const service = services.find(s => s.id === t.serviceId);
        const serviceName = service ? service.name : 'Dịch vụ khác';

        const staff = staffList.find(st => st.id === t.staffId);
        const staffName = staff ? staff.hoTen : '<span class="text-muted italic">Chưa phân công</span>';

        return `
            <tr>
                <td class="fw-bold">${rowNo}</td>
                <td><span class="ticket-code-badge">${esc(t.ticketCode)}</span></td>
                <td>
                    <div class="fw-semibold text-dark-emphasis text-truncate" style="max-width:180px;" title="${esc(t.title)}">${esc(t.title)}</div>
                </td>
                <td>
                    <div class="fw-bold text-dark-emphasis">${esc(t.customerName)}</div>
                </td>
                <td><span class="fw-medium text-dark">${esc(t.customerPhone)}</span></td>
                <td><span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle fs-9">${esc(serviceName)}</span></td>
                <td><span class="text-dark">${staffName}</span></td>
                <td><span class="text-muted fs-8">${esc(t.requestType)}</span></td>
                <td>${getPriorityBadge(t.priority)}</td>
                <td>${getStatusBadge(t.status)}</td>
                <td><span class="font-monospace text-muted fs-8">${esc(t.createdDate ? t.createdDate.split(' ')[0] : '—')}</span></td>
                <td><span class="font-monospace text-muted fs-8">${esc(t.updatedDate ? t.updatedDate.split(' ')[0] : '—')}</span></td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-action-view dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0 dropdown-menu-action">
                            <li>
                                <a class="dropdown-item dropdown-item-action" href="javascript:void(0)" onclick="viewTicket('${esc(t.ticketCode)}')">
                                    <i class="fa-solid fa-eye text-primary"></i> Xem chi tiết
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item dropdown-item-action" href="javascript:void(0)" onclick="openEditModal('${esc(t.ticketCode)}')">
                                    <i class="fa-solid fa-pen text-warning"></i> Chỉnh sửa
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item dropdown-item-action" href="javascript:void(0)" onclick="quickUpdateStatus('${esc(t.ticketCode)}')">
                                    <i class="fa-solid fa-arrows-spin text-info"></i> Cập nhật trạng thái
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item dropdown-item-action" href="javascript:void(0)" onclick="viewTicketHistoryLogs('${esc(t.ticketCode)}')">
                                    <i class="fa-solid fa-clock-rotate-left text-purple" style="color:var(--color-blue)"></i> Xem lịch sử
                                </a>
                            </li>
                            <li>
                                <hr class="dropdown-divider">
                            </li>
                            <li>
                                <a class="dropdown-item dropdown-item-action text-danger" href="javascript:void(0)" onclick="deleteTicket('${esc(t.ticketCode)}')">
                                    <i class="fa-solid fa-trash"></i> Xóa phiếu
                                </a>
                            </li>
                        </ul>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Render Mobile cards
    mobileContainer.innerHTML = pageTickets.map(t => {
        const service = services.find(s => s.id === t.serviceId);
        const serviceName = service ? service.name : 'Dịch vụ khác';

        const staff = staffList.find(st => st.id === t.staffId);
        const staffName = staff ? staff.hoTen : 'Chưa phân công';

        return `
            <div class="mobile-ticket-card">
                <div class="mobile-card-row">
                    <span class="ticket-code-badge">${esc(t.ticketCode)}</span>
                    <div>${getStatusBadge(t.status)}</div>
                </div>
                <div class="mobile-card-title my-2">${esc(t.title)}</div>
                <div class="mobile-card-row">
                    <span class="text-muted small">Khách hàng:</span>
                    <strong class="text-dark-emphasis">${esc(t.customerName)} (${esc(t.customerPhone)})</strong>
                </div>
                <div class="mobile-card-row">
                    <span class="text-muted small">Dịch vụ:</span>
                    <span class="badge bg-secondary-subtle text-secondary">${esc(serviceName)}</span>
                </div>
                <div class="mobile-card-row">
                    <span class="text-muted small">Nhân viên:</span>
                    <span class="text-dark">${esc(staffName)}</span>
                </div>
                <div class="mobile-card-row">
                    <span class="text-muted small">Ưu tiên:</span>
                    <div>${getPriorityBadge(t.priority)}</div>
                </div>
                <div class="d-flex gap-2 justify-content-end border-top pt-2 mt-2">
                    <button class="btn btn-outline-secondary btn-sm" onclick="viewTicket('${esc(t.ticketCode)}')"><i class="fa-solid fa-eye"></i> Chi tiết</button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="openEditModal('${esc(t.ticketCode)}')"><i class="fa-solid fa-pen"></i> Sửa</button>
                    <button class="btn btn-danger btn-sm text-white" onclick="deleteTicket('${esc(t.ticketCode)}')"><i class="fa-solid fa-trash"></i> Xóa</button>
                </div>
            </div>
        `;
    }).join('');

    const totalPages = Math.ceil(totalCount / pageSize);
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const wrapper = document.getElementById('tablePagination');
    if (!wrapper) return;

    if (totalPages <= 1) {
        wrapper.innerHTML = '';
        return;
    }

    let html = `
        <li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="goToPage(1)" title="Trang đầu"><i class="fa-solid fa-angles-left"></i></button>
        </li>
        <li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="goToPage(${currentPage - 1})" title="Trang trước"><i class="fa-solid fa-chevron-left"></i></button>
        </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <button class="page-link" onclick="goToPage(${i})">${i}</button>
            </li>
        `;
    }

    html += `
        <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="goToPage(${currentPage + 1})" title="Trang sau"><i class="fa-solid fa-chevron-right"></i></button>
        </li>
        <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="goToPage(${totalPages})" title="Trang cuối"><i class="fa-solid fa-angles-right"></i></button>
        </li>
    `;

    wrapper.innerHTML = html;
}

window.goToPage = function (p) {
    const totalPages = Math.ceil(filteredTickets.length / pageSize);
    if (p < 1 || p > totalPages) return;
    currentPage = p;
    renderTable();
};

/* =============================================================
   5. CHART.JS VISUALIZATIONS
   ============================================================= */
function initCharts() {
    const theme = document.documentElement.getAttribute('data-bs-theme') || 'light';
    const isDark = theme === 'dark';
    const labelColor = isDark ? '#94A3B8' : '#6B7280';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(229, 231, 235, 0.6)';

    // Donut Status Ratio
    const donutCtx = document.getElementById('statusDonutChart');
    if (donutCtx) {
        statusChart = new Chart(donutCtx, {
            type: 'doughnut',
            data: getStatusChartData(),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: labelColor, font: { family: 'Inter', size: 11 } }
                    }
                },
                cutout: '60%'
            }
        });
    }

    // Monthly Line Chart
    const monthlyCtx = document.getElementById('monthlyBarChart');
    if (monthlyCtx) {
        monthlyChart = new Chart(monthlyCtx, {
            type: 'bar',
            data: getMonthlyChartData(),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
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

    // Horizontal Service Bar Chart
    const serviceCtx = document.getElementById('serviceHorizontalChart');
    if (serviceCtx) {
        serviceChart = new Chart(serviceCtx, {
            type: 'bar',
            data: getServiceChartData(),
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: labelColor, font: { family: 'Inter', size: 11 } },
                        beginAtZero: true
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: labelColor, font: { family: 'Inter', size: 10 } }
                    }
                }
            }
        });
    }
}

function updateChartsData() {
    if (statusChart) {
        statusChart.data = getStatusChartData();
        statusChart.update();
    }
    if (monthlyChart) {
        monthlyChart.data = getMonthlyChartData();
        monthlyChart.update();
    }
    if (serviceChart) {
        serviceChart.data = getServiceChartData();
        serviceChart.update();
    }
}

function updateChartThemes(theme) {
    const isDark = theme === 'dark';
    const labelColor = isDark ? '#94A3B8' : '#6B7280';
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(229, 231, 235, 0.6)';

    if (statusChart) {
        statusChart.options.plugins.legend.labels.color = labelColor;
        statusChart.update();
    }
    if (monthlyChart) {
        monthlyChart.options.scales.x.ticks.color = labelColor;
        monthlyChart.options.scales.y.grid.color = gridColor;
        monthlyChart.options.scales.y.ticks.color = labelColor;
        monthlyChart.update();
    }
    if (serviceChart) {
        serviceChart.options.scales.x.grid.color = gridColor;
        serviceChart.options.scales.x.ticks.color = labelColor;
        serviceChart.options.scales.y.ticks.color = labelColor;
        serviceChart.update();
    }
}

function getStatusChartData() {
    const counts = { waiting: 0, processing: 0, feedback: 0, completed: 0, cancelled: 0 };
    filteredTickets.forEach(t => {
        if (counts[t.status] !== undefined) counts[t.status]++;
    });

    return {
        labels: ['Chờ xử lý', 'Đang xử lý', 'Chờ khách phản hồi', 'Hoàn thành', 'Đã hủy'],
        datasets: [{
            data: [counts.waiting, counts.processing, counts.feedback, counts.completed, counts.cancelled],
            backgroundColor: ['#6B7280', '#2563EB', '#D97706', '#059669', '#DC2626'],
            borderWidth: 1
        }]
    };
}

function getMonthlyChartData() {
    const monthsData = Array(12).fill(0);

    filteredTickets.forEach(t => {
        const date = parseDateTimeString(t.createdDate);
        if (date) {
            const m = date.getMonth(); // 0-11
            if (m >= 0 && m < 12) monthsData[m]++;
        }
    });

    // Seed mock data for earlier months if empty to look pretty
    if (filteredTickets.length === tickets.length) {
        monthsData[0] = 18;
        monthsData[1] = 22;
        monthsData[2] = 15;
        monthsData[3] = 30;
    }

    return {
        labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
        datasets: [{
            label: 'Số phiếu',
            data: monthsData,
            backgroundColor: 'rgba(238, 0, 51, 0.85)',
            hoverBackgroundColor: '#EE0033',
            borderRadius: 6
        }]
    };
}

function getServiceChartData() {
    const serviceCounts = {};
    services.forEach(s => {
        serviceCounts[s.id] = { name: s.name, count: 0 };
    });

    filteredTickets.forEach(t => {
        if (serviceCounts[t.serviceId]) {
            serviceCounts[t.serviceId].count++;
        }
    });

    const labels = Object.values(serviceCounts).map(s => s.name);
    const counts = Object.values(serviceCounts).map(s => s.count);

    return {
        labels: labels,
        datasets: [{
            label: 'Yêu cầu',
            data: counts,
            backgroundColor: 'rgba(59, 130, 246, 0.85)',
            hoverBackgroundColor: '#2563EB',
            borderRadius: 4
        }]
    };
}

/* =============================================================
   6. ACTIONS: DETAIL, TIMELINE LOGS
   ============================================================= */
window.viewTicket = function (ticketCode) {
    const ticket = tickets.find(t => t.ticketCode === ticketCode);
    if (!ticket) return;

    const service = services.find(s => s.id === ticket.serviceId);
    const serviceName = service ? service.name : 'Dịch vụ khác';

    const category = categories.find(c => c.id === ticket.categoryId);
    const categoryName = category ? category.name : 'Danh mục khác';

    const staff = staffList.find(st => st.id === ticket.staffId);
    const staffName = staff ? `${staff.hoTen} (${staff.chucVu})` : 'Chưa phân công';

    const cust = customers.find(c => c.hoTen === ticket.customerName);
    const email = cust ? cust.email : 'Chưa cung cấp';
    const address = cust ? cust.diaChi : 'Chưa cung cấp';

    setText('detCode', ticket.ticketCode);
    setText('detTitle', ticket.title);
    setText('detCustomer', ticket.customerName);
    setText('detPhone', ticket.customerPhone);
    setText('detEmail', email);
    setText('detAddress', address);
    setText('detService', serviceName);
    setText('detCategory', categoryName);
    setText('detReqType', ticket.requestType);
    setText('detPriority', '', true);
    document.getElementById('detPriority').innerHTML = getPriorityBadge(ticket.priority);
    setText('detStatus', '', true);
    document.getElementById('detStatus').innerHTML = getStatusBadge(ticket.status);
    setText('detCreatedDate', ticket.createdDate || '—');
    setText('detUpdatedDate', ticket.updatedDate || '—');
    setText('detStaff', staffName);
    setText('detDesc', ticket.description || 'Không có mô tả chi tiết.');

    // Load timeline logs
    renderTicketTimeline(ticketCode);

    if (viewModal) viewModal.show();
};

function renderTicketTimeline(ticketCode) {
    const container = document.getElementById('timelineContainer');
    if (!container) return;

    const logs = historyLogs.filter(log => log.ticketCode === ticketCode)
                           .sort((a, b) => parseDateTimeString(b.timestamp) - parseDateTimeString(a.timestamp)); // recent first

    if (!logs.length) {
        container.innerHTML = `<p class="text-center text-muted fs-8 py-3">Không có lịch sử cập nhật nào được ghi nhận.</p>`;
        return;
    }

    container.innerHTML = logs.map(l => {
        let markerClass = l.newStatus || 'waiting';

        return `
            <div class="timeline-item">
                <div class="timeline-marker ${markerClass}"></div>
                <div class="timeline-content">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="timeline-user"><i class="fa-solid fa-user-circle me-1 text-secondary"></i>${esc(l.staffName)}</span>
                        <span class="timeline-time"><i class="fa-solid fa-clock me-1 text-muted"></i>${esc(l.timestamp)}</span>
                    </div>
                    <div class="small">
                        Trạng thái: ${l.oldStatus ? getStatusBadge(l.oldStatus) : 'Mới tạo'} 
                        <i class="fa-solid fa-arrow-right mx-1 text-muted"></i> 
                        ${getStatusBadge(l.newStatus)}
                    </div>
                    <p class="timeline-note mb-0 text-dark-emphasis">${esc(l.notes)}</p>
                </div>
            </div>
        `;
    }).join('');
}

window.viewTicketHistoryLogs = function (ticketCode) {
    // Open detail modal and show historical timeline specifically
    viewTicket(ticketCode);
    setTimeout(() => {
        const timelineCard = document.getElementById('timelineContainerCard');
        const modalBody = document.querySelector('#viewDetailsModal .modal-body');
        if (timelineCard && modalBody) {
            modalBody.scrollTo({
                top: timelineCard.offsetTop,
                behavior: 'smooth'
            });
        }
    }, 250);
};

/* =============================================================
   7. CRUD OPERATIONS
   ============================================================= */
function handleCreateTicket() {
    const customerName = document.getElementById('addCustomer')?.value || '';
    const serviceId = document.getElementById('addService')?.value || '';
    const title = document.getElementById('addTitle')?.value.trim() || '';
    const requestType = document.getElementById('addRequestType')?.value || '';
    const priority = document.getElementById('addPriority')?.value || '';
    const needAppointment = document.getElementById('addNeedAppointment')?.value === 'true';
    const content = document.getElementById('addContent')?.value.trim() || '';
    const staffId = document.getElementById('addStaff')?.value || '';

    if (!customerName || !serviceId || !title || !requestType || !priority) {
        showToast('error', 'Vui lòng điền đầy đủ thông tin bắt buộc (*)');
        return;
    }

    const cust = customers.find(c => c.hoTen === customerName);
    const customerPhone = cust ? cust.soDienThoai : '';

    const nextId = tickets.length ? Math.max(...tickets.map(t => t.id)) + 1 : 1;
    const ticketCode = `PHT-2026${String(nextId).padStart(4, '0')}`;
    const timestampStr = getCurrentDateTimeString();

    const newTicket = {
        id: nextId,
        ticketCode: ticketCode,
        title: title,
        categoryId: 'internet', // default linked category
        serviceId: serviceId,
        requestType: requestType,
        priority: priority,
        status: 'waiting',
        description: content,
        createdDate: timestampStr,
        updatedDate: timestampStr,
        customerName: customerName,
        customerPhone: customerPhone,
        needAppointment: needAppointment,
        appointmentDate: needAppointment ? '17/06/2026' : '', // mock appointment date
        appointmentTime: needAppointment ? '09:00' : '',
        appointmentNote: '',
        staffId: staffId
    };

    // Save ticket
    tickets.push(newTicket);

    // Save History Log
    const profile = JSON.parse(localStorage.getItem('viettel_profile')) || { name: 'Admin Viettel' };
    const log = {
        id: `H-${String(historyLogs.length + 1).padStart(3, '0')}`,
        ticketCode: ticketCode,
        timestamp: timestampStr,
        staffName: profile.name,
        oldStatus: '',
        newStatus: 'waiting',
        notes: `Tạo mới phiếu hỗ trợ: "${title}". Phân công cho: ${staffId ? staffList.find(s => s.id === staffId).hoTen : 'Chưa phân công'}`
    };
    historyLogs.push(log);

    // Sync appointments if needed
    if (needAppointment) {
        const serviceObj = services.find(s => s.id === serviceId);
        const appObj = {
            id: appointments.length ? Math.max(...appointments.map(a => a.id)) + 1 : 1,
            ticketCode: ticketCode,
            customerName: customerName,
            serviceName: serviceObj ? serviceObj.name : 'Dịch vụ kỹ thuật',
            appointmentDate: '17/06/2026',
            appointmentTime: '09:00',
            status: 'waiting',
            createdDate: '16/06/2026',
            notes: 'Đặt lịch khi tạo phiếu hỗ trợ'
        };
        appointments.push(appObj);
    }

    saveDatabase();
    applyFilters();

    if (addModal) addModal.hide();
    document.getElementById('addTicketForm').reset();

    Swal.fire({
        title: 'Tạo phiếu thành công!',
        text: `Đã khởi tạo phiếu hỗ trợ kỹ thuật ${ticketCode} trên hệ thống.`,
        icon: 'success',
        confirmButtonColor: '#EE0033'
    });
}

let editingTicketCode = '';
window.openEditModal = function (ticketCode) {
    const ticket = tickets.find(t => t.ticketCode === ticketCode);
    if (!ticket) return;

    editingTicketCode = ticketCode;

    document.getElementById('editTitle').value = ticket.title;
    document.getElementById('editService').value = ticket.serviceId;
    document.getElementById('editContent').value = ticket.description;
    document.getElementById('editPriority').value = ticket.priority;
    document.getElementById('editStaff').value = ticket.staffId;
    document.getElementById('editStatus').value = ticket.status;
    document.getElementById('editNeedAppointment').value = ticket.needAppointment ? 'true' : 'false';

    if (editModal) editModal.show();
};

function handleUpdateTicket() {
    const ticket = tickets.find(t => t.ticketCode === editingTicketCode);
    if (!ticket) return;

    const title = document.getElementById('editTitle').value.trim();
    const serviceId = document.getElementById('editService').value;
    const content = document.getElementById('editContent').value.trim();
    const priority = document.getElementById('editPriority').value;
    const staffId = document.getElementById('editStaff').value;
    const status = document.getElementById('editStatus').value;
    const needAppointment = document.getElementById('editNeedAppointment').value === 'true';

    if (!title) {
        showToast('error', 'Tiêu đề không được bỏ trống!');
        return;
    }

    const timestampStr = getCurrentDateTimeString();
    const profile = JSON.parse(localStorage.getItem('viettel_profile')) || { name: 'Admin Viettel' };
    const oldStatus = ticket.status;

    // Check if status changed to log it
    if (oldStatus !== status || ticket.staffId !== staffId) {
        const log = {
            id: `H-${String(historyLogs.length + 1).padStart(3, '0')}`,
            ticketCode: editingTicketCode,
            timestamp: timestampStr,
            staffName: profile.name,
            oldStatus: oldStatus,
            newStatus: status,
            notes: `Cập nhật thông tin phiếu. Trạng thái: ${oldStatus} -> ${status}. Phụ trách: ${staffId ? staffList.find(s => s.id === staffId).hoTen : 'Chưa phân công'}.`
        };
        historyLogs.push(log);
    }

    // Update ticket data
    ticket.title = title;
    ticket.serviceId = serviceId;
    ticket.description = content;
    ticket.priority = priority;
    ticket.staffId = staffId;
    ticket.status = status;
    ticket.needAppointment = needAppointment;
    ticket.updatedDate = timestampStr;

    saveDatabase();
    applyFilters();

    if (editModal) editModal.hide();

    Swal.fire({
        title: 'Cập nhật thành công!',
        text: `Phiếu hỗ trợ ${editingTicketCode} đã được điều chỉnh thành công.`,
        icon: 'success',
        confirmButtonColor: '#EE0033'
    });
}

let _statusUpdateTicketCode = '';
let _statusUpdateModal = null;

window.quickUpdateStatus = function (ticketCode) {
    const ticket = tickets.find(t => t.ticketCode === ticketCode);
    if (!ticket) return;

    _statusUpdateTicketCode = ticketCode;

    // Populate header
    const codeEl = document.getElementById('statusUpdateTicketCode');
    const titleEl = document.getElementById('statusUpdateTicketTitle');
    if (codeEl) codeEl.textContent = `Mã phiếu: ${ticketCode}`;
    if (titleEl) titleEl.textContent = ticket.title || '—';

    // Reset all cards, then select the current status
    document.querySelectorAll('#statusCardGrid .su-status-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.status === ticket.status) {
            card.classList.add('selected');
        }
    });

    // Clear note
    const noteEl = document.getElementById('statusUpdateNote');
    if (noteEl) noteEl.value = '';

    // Open modal
    if (!_statusUpdateModal) {
        const el = document.getElementById('statusUpdateModal');
        if (el) _statusUpdateModal = new bootstrap.Modal(el);
    }
    if (_statusUpdateModal) _statusUpdateModal.show();
};

window.selectStatusCard = function (el) {
    document.querySelectorAll('#statusCardGrid .su-status-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
};

window.confirmStatusUpdate = function () {
    const ticket = tickets.find(t => t.ticketCode === _statusUpdateTicketCode);
    if (!ticket) return;

    const selectedCard = document.querySelector('#statusCardGrid .su-status-card.selected');
    if (!selectedCard) {
        showToast('error', 'Vui lòng chọn một trạng thái!');
        return;
    }

    const newStatus = selectedCard.dataset.status;
    const oldStatus = ticket.status;
    const note = (document.getElementById('statusUpdateNote')?.value || '').trim();

    if (oldStatus !== newStatus) {
        const timestampStr = getCurrentDateTimeString();
        const profile = JSON.parse(localStorage.getItem('viettel_profile')) || { name: 'Admin Viettel' };

        ticket.status = newStatus;
        ticket.updatedDate = timestampStr;

        const log = {
            id: `H-${String(historyLogs.length + 1).padStart(3, '0')}`,
            ticketCode: _statusUpdateTicketCode,
            timestamp: timestampStr,
            staffName: profile.name,
            oldStatus: oldStatus,
            newStatus: newStatus,
            notes: note || `Kỹ thuật viên cập nhật nhanh trạng thái phiếu hỗ trợ.`
        };
        historyLogs.push(log);

        saveDatabase();
        applyFilters();
        showToast('success', `Đã cập nhật trạng thái sang: ${getStatusText(newStatus)}`);
    } else {
        showToast('info', 'Trạng thái không thay đổi.');
    }

    if (_statusUpdateModal) _statusUpdateModal.hide();
};

window.deleteTicket = function (ticketCode) {
    const index = tickets.findIndex(t => t.ticketCode === ticketCode);
    if (index === -1) return;

    Swal.fire({
        title: 'Bạn có chắc chắn muốn xóa?',
        text: `Phiếu hỗ trợ kỹ thuật ${ticketCode} sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EE0033',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Xác nhận xóa',
        cancelButtonText: 'Hủy bỏ'
    }).then((result) => {
        if (result.isConfirmed) {
            tickets.splice(index, 1);
            // Delete matching timeline history
            historyLogs = historyLogs.filter(log => log.ticketCode !== ticketCode);
            // Delete matching appointments
            appointments = appointments.filter(app => app.ticketCode !== ticketCode);

            saveDatabase();
            applyFilters();

            Swal.fire(
                'Đã xóa!',
                'Phiếu hỗ trợ đã được gỡ bỏ khỏi hệ thống.',
                'success'
            );
        }
    });
};

function exportToExcel() {
    if (!filteredTickets.length) {
        showToast('error', 'Không có dữ liệu phiếu hỗ trợ để xuất Excel!');
        return;
    }

    // Mock CSV/Excel Export representation
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'STT,Ma phieu,Tieu de,Khach hang,So dien thoai,Dich vu,Nhan vien,Uu tien,Trang thai,Ngay tao,Ngay cap nhat\n';

    filteredTickets.forEach((t, idx) => {
        const serviceObj = services.find(s => s.id === t.serviceId);
        const sName = serviceObj ? serviceObj.name : '';
        const staffObj = staffList.find(st => st.id === t.staffId);
        const stName = staffObj ? staffObj.hoTen : '';
        
        const row = [
            idx + 1,
            t.ticketCode,
            `"${t.title.replace(/"/g, '""')}"`,
            `"${t.customerName}"`,
            t.customerPhone,
            `"${sName}"`,
            `"${stName}"`,
            t.priority,
            getStatusText(t.status),
            t.createdDate,
            t.updatedDate
        ].join(',');
        csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DS_Phieu_Ho_Tro_Kinh_Thuat_${getCurrentDateStr()}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Đã xuất Excel danh sách phiếu thành công!');
}

/* =============================================================
   8. UTILITIES & FORMATTERS
   ============================================================= */
function getPriorityBadge(priority) {
    switch (priority) {
        case 'Khẩn Cấp': return `<span class="badge-priority emergency"><i class="fa-solid fa-triangle-exclamation me-1"></i>Khẩn cấp</span>`;
        case 'Cao': return `<span class="badge-priority high"><i class="fa-solid fa-circle-exclamation me-1"></i>Cao</span>`;
        case 'Trung Bình': return `<span class="badge-priority medium"><i class="fa-solid fa-circle-info me-1"></i>Trung bình</span>`;
        default: return `<span class="badge-priority low"><i class="fa-solid fa-circle-check me-1"></i>Thấp</span>`;
    }
}

function getStatusBadge(status) {
    switch (status) {
        case 'processing': return `<span class="badge-status processing"><i class="fa-solid fa-spinner fa-spin-pulse me-1"></i>Đang xử lý</span>`;
        case 'feedback': return `<span class="badge-status feedback"><i class="fa-solid fa-comment-dots me-1"></i>Chờ khách phản hồi</span>`;
        case 'completed': return `<span class="badge-status completed"><i class="fa-solid fa-circle-check me-1"></i>Hoàn thành</span>`;
        case 'cancelled': return `<span class="badge-status cancelled"><i class="fa-solid fa-circle-xmark me-1"></i>Đã hủy</span>`;
        default: return `<span class="badge-status waiting"><i class="fa-solid fa-clock me-1"></i>Chờ xử lý</span>`;
    }
}

function getStatusText(status) {
    switch (status) {
        case 'processing': return 'Đang xử lý';
        case 'feedback': return 'Chờ khách phản hồi';
        case 'completed': return 'Hoàn thành';
        case 'cancelled': return 'Đã hủy';
        default: return 'Chờ xử lý';
    }
}

function parseDateTimeString(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split(' ');
    const dateParts = parts[0].split('/');
    if (parts.length > 1) {
        const timeParts = parts[1].split(':');
        return new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1], timeParts[2] || 0);
    }
    return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
}

function getCurrentDateTimeString() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${sec}`;
}

function getCurrentDateStr() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}_${mm}_${yyyy}`;
}

function setText(id, value, isHtml = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (isHtml) el.innerHTML = value;
    else el.textContent = value;
}

function esc(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Toast notification helper
function showToast(type, msg) {
    const icon = type === 'success' ? 'fa-circle-check text-success' : type === 'error' ? 'fa-triangle-exclamation text-danger' : 'fa-circle-info text-info';
    
    // Create toast container if not exists
    let container = document.getElementById('vtToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'vtToastContainer';
        container.style.position = 'fixed';
        container.style.bottom = '24px';
        container.style.right = '24px';
        container.style.zIndex = '1090';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'glass-panel p-3 d-flex align-items-center gap-3 animate__animated animate__fadeInUp';
    toast.style.borderRadius = '12px';
    toast.style.minWidth = '280px';
    toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.08)';
    toast.style.borderLeft = `4px solid ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'}`;
    toast.style.transition = 'all 0.4s ease';

    toast.innerHTML = `
        <i class="fa-solid ${icon} fs-5"></i>
        <div class="small fw-semibold text-dark-emphasis">${msg}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
