/**
 * admin-customer.js — TechSupport Viettel Admin
 * Customers CRUD, history lookup, status locking, and pagination controller
 * (Singular filename synced with plural admin-customers.js)
 */
'use strict';

/* ══════════════════════════════════════════
   CONFIG & STORAGE KEYS
   ══════════════════════════════════════════ */
const CUSTOMERS_STORAGE_KEY = 'viettel_customers';
const TICKETS_STORAGE_KEY = 'viettel_tickets';
const APPOINTMENTS_STORAGE_KEY = 'viettel_appointments';

/* ══════════════════════════════════════════
   STATE
   ══════════════════════════════════════════ */
let customersList = [];
let ticketsList = [];
let appointmentsList = [];

let filteredCustomers = [];
let currentPage = 1;
let pageSize = 10; // default entries per page

let selectedCustomerId = null;
let activeHistoryCustomerId = null; // tracking which customer's history is open
let filteredHistoryTickets = []; // current history tickets list being filtered

// Modals
let addCustomerModal = null;
let viewCustomerModal = null;
let ticketHistoryModal = null;
let ticketDetailsModal = null;

/* ══════════════════════════════════════════
   LOAD DATA & SEED FALLBACKS
   ══════════════════════════════════════════ */
function loadCustomersData() {
    const rawCustomers = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    const rawTickets = localStorage.getItem(TICKETS_STORAGE_KEY);
    const rawAppointments = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);

    ticketsList = rawTickets ? JSON.parse(rawTickets) : [];
    appointmentsList = rawAppointments ? JSON.parse(rawAppointments) : [];
    customersList = rawCustomers ? JSON.parse(rawCustomers) : [];

    // Fallbacks if localStorage is empty
    if (!customersList.length) {
        customersList = [
            { id: 'KH001', hoTen: 'Trần Quốc Bảo', soDienThoai: '0986123456', email: 'bao.tq@gmail.com', diaChi: 'Số 1 Giang Văn Minh, Ba Đình, Hà Nội', ngaySinh: '1990-05-12', tenDangNhap: 'baotq', trangThai: 'Hoạt động', ngayTao: '10/01/2026' },
            { id: 'KH002', hoTen: 'Nguyễn Thị Hoa', soDienThoai: '0975888999', email: 'hoa.nt@gmail.com', diaChi: 'Ngõ 106 Hoàng Quốc Việt, Cầu Giấy, Hà Nội', ngaySinh: '1995-08-20', tenDangNhap: 'hoant', trangThai: 'Hoạt động', ngayTao: '15/01/2026' },
            { id: 'KH003', hoTen: 'Phạm Minh Tuấn', soDienThoai: '0912345678', email: 'tuan.pm@gmail.com', diaChi: 'Tòa nhà Viettel, Trần Hưng Đạo, Quận 1, TP. HCM', ngaySinh: '1988-11-03', tenDangNhap: 'tuanpm', trangThai: 'Hoạt động', ngayTao: '20/01/2026' },
            { id: 'KH004', hoTen: 'Lê Hoàng Hải', soDienThoai: '0963111222', email: 'hai.lh@gmail.com', diaChi: '156 Lê Lợi, Hải Châu, Đà Nẵng', ngaySinh: '1992-03-25', tenDangNhap: 'hailh', trangThai: 'Hoạt động', ngayTao: '28/01/2026' },
            { id: 'KH005', hoTen: 'Vũ Minh Đức', soDienThoai: '0988456123', email: 'duc.vm@gmail.com', diaChi: 'Số 5 Chùa Bộc, Đống Đa, Hà Nội', ngaySinh: '1994-07-15', tenDangNhap: 'ducvm', trangThai: 'Đã khóa', ngayTao: '05/02/2026' },
            { id: 'KH006', hoTen: 'Nguyễn Văn Đạt', soDienThoai: '0979555666', email: 'dat.nv@gmail.com', diaChi: '24 Quang Trung, Hà Đông, Hà Nội', ngaySinh: '1991-09-30', tenDangNhap: 'datnv', trangThai: 'Hoạt động', ngayTao: '12/02/2026' },
            { id: 'KH007', hoTen: 'Đỗ Thị Mai', soDienThoai: '0968999888', email: 'mai.dt@gmail.com', diaChi: '88 Nguyễn Trãi, Thanh Xuân, Hà Nội', ngaySinh: '1996-01-18', tenDangNhap: 'maidt', trangThai: 'Hoạt động', ngayTao: '18/02/2026' },
            { id: 'KH008', hoTen: 'Hoàng Anh Tuấn', soDienThoai: '0977222111', email: 'tuan.ha@gmail.com', diaChi: '12 Trần Phú, Ngô Quyền, Hải Phòng', ngaySinh: '1985-04-05', tenDangNhap: 'tuanha', trangThai: 'Hoạt động', ngayTao: '20/02/2026' },
            { id: 'KH009', hoTen: 'Bùi Minh Trí', soDienThoai: '0987555444', email: 'tri.bm@gmail.com', diaChi: '45 Nguyễn Văn Linh, Long Biên, Hà Nội', ngaySinh: '1989-10-12', tenDangNhap: 'tribm', trangThai: 'Đã khóa', ngayTao: '25/02/2026' },
            { id: 'KH010', hoTen: 'Nguyễn Bích Ngọc', soDienThoai: '0915666777', email: 'ngoc.nb@gmail.com', diaChi: 'Tòa nhà Landmark 81, Bình Thạnh, TP. HCM', ngaySinh: '1993-12-08', tenDangNhap: 'ngocnb', trangThai: 'Hoạt động', ngayTao: '28/02/2026' },
            { id: 'KH011', hoTen: 'Trần Văn Cường', soDienThoai: '0981999222', email: 'cuong.tv@gmail.com', diaChi: 'Số 10 Hùng Vương, Ba Đình, Hà Nội', ngaySinh: '1987-02-14', tenDangNhap: 'cuongtv', trangThai: 'Hoạt động', ngayTao: '05/06/2026' },
            { id: 'KH012', hoTen: 'Lê Thị Thủy', soDienThoai: '0973444555', email: 'thuy.lt@gmail.com', diaChi: '15 Trần Phú, Hà Đông, Hà Nội', ngaySinh: '1998-06-02', tenDangNhap: 'thuylt', trangThai: 'Hoạt động', ngayTao: '08/06/2026' }
        ];
        localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customersList));
    }
}

/* ══════════════════════════════════════════
   DOM POPULATION & INITIALIZATION
   ══════════════════════════════════════════ */
function initCustomersDom() {
    // 1. Instantiating Bootstrap Modals
    const addCustomerEl = document.getElementById('addCustomerModal');
    const viewCustomerEl = document.getElementById('viewCustomerModal');
    const ticketHistoryEl = document.getElementById('ticketHistoryModal');
    const ticketDetailsEl = document.getElementById('ticketDetailsModal');

    if (addCustomerEl) addCustomerModal = new bootstrap.Modal(addCustomerEl);
    if (viewCustomerEl) viewCustomerModal = new bootstrap.Modal(viewCustomerEl);
    if (ticketHistoryEl) ticketHistoryModal = new bootstrap.Modal(ticketHistoryEl);
    if (ticketDetailsEl) ticketDetailsModal = new bootstrap.Modal(ticketDetailsEl);

    // 2. Page size dropdown listener
    const pageSizeSel = document.getElementById('pageSizeSelect');
    if (pageSizeSel) {
        pageSizeSel.addEventListener('change', function () {
            pageSize = parseInt(this.value, 10);
            currentPage = 1;
            applyFilters();
        });
    }

    // 3. Live filters setup
    const searchInp = document.getElementById('searchCustomer');
    const statFil = document.getElementById('filterStatus');
    const sortFil = document.getElementById('filterSort');

    if (searchInp) searchInp.addEventListener('input', () => { currentPage = 1; applyFilters(); });
    if (statFil) statFil.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    if (sortFil) sortFil.addEventListener('change', () => { currentPage = 1; applyFilters(); });

    // 4. Submit Form Listeners
    const addForm = document.getElementById('addCustomerForm');
    if (addForm) {
        addForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveNewCustomer();
        });
    }
}

/* ══════════════════════════════════════════
   FILTERS & SEARCH ACTIONS
   ══════════════════════════════════════════ */
window.searchCustomers = function () {
    currentPage = 1;
    applyFilters();
    showToast('success', 'Đã cập nhật kết quả tìm kiếm khách hàng!');
};

window.clearFilters = function () {
    const searchInp = document.getElementById('searchCustomer');
    const statFil = document.getElementById('filterStatus');
    const sortFil = document.getElementById('filterSort');

    if (searchInp) searchInp.value = '';
    if (statFil) statFil.value = 'all';
    if (sortFil) sortFil.value = 'newest';

    currentPage = 1;
    applyFilters();
    showToast('info', 'Đã đặt lại bộ lọc về mặc định.');
};


function applyFilters() {
    const searchVal = document.getElementById('searchCustomer')?.value.toLowerCase().trim() || '';
    const statVal = document.getElementById('filterStatus')?.value || 'all';
    const sortVal = document.getElementById('filterSort')?.value || 'newest';

    // 1. Search keyword + status checks
    filteredCustomers = customersList.filter(c => {
        const matchesQuery = !searchVal || 
                             c.hoTen.toLowerCase().includes(searchVal) || 
                             c.soDienThoai.includes(searchVal) || 
                             (c.email && c.email.toLowerCase().includes(searchVal));
        const matchesStatus = statVal === 'all' || c.trangThai === statVal;
        return matchesQuery && matchesStatus;
    });

    // 2. Sort rules
    filteredCustomers.sort((a, b) => {
        if (sortVal === 'az') return a.hoTen.localeCompare(b.hoTen, 'vi');
        if (sortVal === 'za') return b.hoTen.localeCompare(a.hoTen, 'vi');

        // Parse date format dd/mm/yyyy
        const parseD = (str) => {
            if (!str) return new Date(0);
            const [d, m, y] = str.split('/');
            return new Date(y, m - 1, d);
        };

        const dateA = parseD(a.ngayTao);
        const dateB = parseD(b.ngayTao);

        if (sortVal === 'oldest') return dateA - dateB;
        return dateB - dateA; // default to 'newest'
    });

    updateKpiCards();
    renderCustomersList();
}

/* ══════════════════════════════════════════
   KPI DASHBOARD UPDATES
   ══════════════════════════════════════════ */
function updateKpiCards() {
    const total = customersList.length;
    const active = customersList.filter(c => c.trangThai === 'Hoạt động').length;
    const locked = customersList.filter(c => c.trangThai === 'Đã khóa').length;

    // Count customer accounts created in June 2026
    const newThisMonth = customersList.filter(c => {
        if (!c.ngayTao) return false;
        const parts = c.ngayTao.split('/');
        return parts[1] === '06' && parts[2] === '2026';
    }).length;

    setText('kpiTotalCustomers', total);
    setText('kpiActiveAccounts', active);
    setText('kpiLockedAccounts', locked);
    setText('kpiNewCustomers', newThisMonth);
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

/* ══════════════════════════════════════════
   RENDER DATA SYSTEM (TABLE + CARDS + PAGING)
   ══════════════════════════════════════════ */
function renderCustomersList() {
    const tbody = document.getElementById('customersBody');
    const mContainer = document.getElementById('customersMobileContainer');
    if (!tbody || !mContainer) return;

    const totalCount = filteredCustomers.length;
    const startIdx = totalCount ? (currentPage - 1) * pageSize + 1 : 0;
    const endIdx = Math.min(currentPage * pageSize, totalCount);

    const metaCountText = document.getElementById('filteredCountText');
    if (metaCountText) {
        metaCountText.textContent = `Đang hiển thị ${startIdx}-${endIdx} trong tổng số ${totalCount} khách hàng.`;
    }

    const headerCountText = document.getElementById('customersCountText');
    if (headerCountText) {
        headerCountText.textContent = `Đang hiển thị ${totalCount} khách hàng`;
    }

    const start = (currentPage - 1) * pageSize;
    const pageCustomers = filteredCustomers.slice(start, start + pageSize);

    // Empty state
    if (!pageCustomers.length) {
        const emptyHtml = `
            <div class="text-center py-5">
                <div class="bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center mb-3" style="width: 56px; height: 56px; border-radius: 50%; font-size: 1.5rem;">
                    <i class="fa-solid fa-users"></i>
                </div>
                <h6 class="fw-bold text-dark">Không tìm thấy khách hàng nào</h6>
                <p class="text-muted small mb-0">Thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem kết quả khác.</p>
            </div>`;
        tbody.innerHTML = `<tr><td colspan="9">${emptyHtml}</td></tr>`;
        mContainer.innerHTML = emptyHtml;
        renderPaginationControls(0);
        return;
    }

    // Render Table Rows (Desktop)
    tbody.innerHTML = pageCustomers.map((c, idx) => {
        const rowNo = start + idx + 1;
        const statClass = c.trangThai === 'Hoạt động' ? 'active' : 'locked';
        const lockIcon = c.trangThai === 'Hoạt động' ? 'fa-lock' : 'fa-lock-open';
        const lockAction = c.trangThai === 'Hoạt động' ? 'Khóa tài khoản' : 'Mở khóa tài khoản';
        const lockBtnClass = c.trangThai === 'Hoạt động' ? 'lock' : 'unlock';

        return `
        <tr>
            <td class="fw-bold" style="padding-left: 20px;">${rowNo}</td>
            <td><span class="rep-customer-code">${escHtml(c.id)}</span></td>
            <td class="fw-bold text-dark-emphasis">${escHtml(c.hoTen)}</td>
            <td><span class="text-dark fw-medium">${escHtml(c.soDienThoai)}</span></td>
            <td><span class="text-muted">${escHtml(c.email || '—')}</span></td>
            <td><span class="font-monospace text-secondary" style="font-size:0.85rem;">${escHtml(c.tenDangNhap)}</span></td>
            <td><span class="badge-status ${statClass}">${escHtml(c.trangThai)}</span></td>
            <td><span class="text-muted font-monospace" style="font-size: 0.8rem;">${escHtml(c.ngayTao)}</span></td>
            <td style="padding-right: 20px;">
                <div class="d-flex gap-2 justify-content-center">
                    <button class="btn-action-custom view" onclick="viewCustomerDetails('${escHtml(c.id)}')" data-bs-toggle="tooltip" data-bs-placement="top" title="Xem chi tiết">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="btn-action-custom history" onclick="viewTicketHistory('${escHtml(c.id)}')" data-bs-toggle="tooltip" data-bs-placement="top" title="Lịch sử hỗ trợ">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                    </button>
                    <button class="btn-action-custom ${lockBtnClass}" onclick="toggleLockStatus('${escHtml(c.id)}')" data-bs-toggle="tooltip" data-bs-placement="top" title="${lockAction}">
                        <i class="fa-solid ${lockIcon}"></i>
                    </button>
                    <button class="btn-action-custom delete" onclick="deleteCustomer('${escHtml(c.id)}')" data-bs-toggle="tooltip" data-bs-placement="top" title="Xóa tài khoản">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');

    // Render Cards List (Mobile)
    mContainer.innerHTML = pageCustomers.map((c) => {
        const statClass = c.trangThai === 'Hoạt động' ? 'active' : 'locked';
        const lockIcon = c.trangThai === 'Hoạt động' ? 'fa-lock' : 'fa-lock-open';
        const lockAction = c.trangThai === 'Hoạt động' ? 'Khóa' : 'Mở khóa';
        const lockBtnClass = c.trangThai === 'Hoạt động' ? 'lock' : 'unlock';

        return `
        <div class="rep-mobile-card">
            <div class="rep-mobile-card-header">
                <span class="rep-customer-code">${escHtml(c.id)}</span>
                <span class="badge-status ${statClass}">${escHtml(c.trangThai)}</span>
            </div>
            <div class="rep-mobile-card-title">${escHtml(c.hoTen)}</div>
            <div class="rep-mobile-card-body">
                <div class="rep-mobile-card-row">
                    <span>Số điện thoại:</span>
                    <strong>${escHtml(c.soDienThoai)}</strong>
                </div>
                <div class="rep-mobile-card-row">
                    <span>Email:</span>
                    <span class="text-muted">${escHtml(c.email || '—')}</span>
                </div>
                <div class="rep-mobile-card-row">
                    <span>Username:</span>
                    <span class="font-monospace text-secondary">${escHtml(c.tenDangNhap)}</span>
                </div>
            </div>
            <div class="rep-mobile-card-meta">
                <span><i class="fa-regular fa-calendar-days me-1"></i> ${escHtml(c.ngayTao)}</span>
                <div class="d-flex gap-2">
                    <button class="btn-action-custom view" onclick="viewCustomerDetails('${escHtml(c.id)}')" title="Chi tiết">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="btn-action-custom history" onclick="viewTicketHistory('${escHtml(c.id)}')" title="Lịch sử">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                    </button>
                    <button class="btn-action-custom ${lockBtnClass}" onclick="toggleLockStatus('${escHtml(c.id)}')" title="${lockAction}">
                        <i class="fa-solid ${lockIcon}"></i>
                    </button>
                    <button class="btn-action-custom delete" onclick="deleteCustomer('${escHtml(c.id)}')" title="Xóa">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');

    initializeTooltips();

    const totalPages = Math.ceil(totalCount / pageSize);
    renderPaginationControls(totalPages);
}

function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function renderPaginationControls(totalPages) {
    const wrapper = document.getElementById('customersPagination');
    if (!wrapper) return;

    if (totalPages <= 1) {
        wrapper.innerHTML = '';
        return;
    }

    let html = `
        <li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="goPage(${currentPage - 1})" aria-label="Trước">
                <i class="fa-solid fa-chevron-left" style="font-size:0.7rem;"></i>
            </button>
        </li>`;

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <button class="page-link" onclick="goPage(${i})">${i}</button>
            </li>`;
    }

    html += `
        <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="goPage(${currentPage + 1})" aria-label="Sau">
                <i class="fa-solid fa-chevron-right" style="font-size:0.7rem;"></i>
            </button>
        </li>`;

    wrapper.innerHTML = html;
}

window.goPage = function (p) {
    const totalPages = Math.ceil(filteredCustomers.length / pageSize);
    if (p < 1 || p > totalPages) return;
    currentPage = p;
    renderCustomersList();
};

/* ══════════════════════════════════════════
   MODAL ACTIONS: VIEW CUSTOMER DETAILED DATA
   ══════════════════════════════════════════ */
window.viewCustomerDetails = function (customerId) {
    const customer = customersList.find(c => c.id === customerId);
    if (!customer) return;

    // Retrieve stats
    const totalTickets = ticketsList.filter(t => t.customerName === customer.hoTen || t.customerPhone === customer.soDienThoai).length;
    const totalAppointments = appointmentsList.filter(a => a.customerName === customer.hoTen).length;

    // Mock Rating
    let ratingVal = 4.8;
    if (customerId === 'KH005') ratingVal = 3.5;
    if (customerId === 'KH009') ratingVal = 4.0;

    const statusHtml = customer.trangThai === 'Hoạt động'
        ? '<span class="badge-status active">Hoạt động</span>'
        : '<span class="badge-status locked">Đã khóa</span>';

    setText('viewCustomerId', customer.id);
    setText('viewCustomerName', customer.hoTen);
    setText('viewCustomerPhone', customer.soDienThoai);
    setText('viewCustomerEmail', customer.email || '—');
    setText('viewCustomerUsername', customer.tenDangNhap);
    setText('viewCustomerDOB', customer.ngaySinh ? formatDateString(customer.ngaySinh) : '—');
    setText('viewCustomerCreatedDate', customer.ngayTao);
    setText('viewCustomerAddress', customer.diaChi || '—');

    setText('viewCustomerTotalTickets', totalTickets);
    setText('viewCustomerTotalAppointments', totalAppointments);
    
    const ratingSpan = document.getElementById('viewCustomerRating');
    if (ratingSpan) {
        ratingSpan.innerHTML = `${ratingVal.toFixed(1)} <i class="fa-solid fa-star small text-warning"></i>`;
    }

    const statusDiv = document.getElementById('viewCustomerStatus');
    if (statusDiv) statusDiv.innerHTML = statusHtml;

    if (viewCustomerModal) {
        viewCustomerModal.show();
    }
};

/* ══════════════════════════════════════════
   LOCK / UNLOCK ACCOUNT STATE FLOW
   ══════════════════════════════════════════ */
window.toggleLockStatus = function (customerId) {
    const customer = customersList.find(c => c.id === customerId);
    if (!customer) return;

    const actionText = customer.trangThai === 'Hoạt động' ? 'khóa' : 'mở khóa';
    const newStatus = customer.trangThai === 'Hoạt động' ? 'Đã khóa' : 'Hoạt động';

    Swal.fire({
        title: `Xác nhận ${actionText}?`,
        text: `Bạn có chắc chắn muốn thay đổi trạng thái tài khoản của khách hàng "${customer.hoTen}" không?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EE0033',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            customer.trangThai = newStatus;
            localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customersList));
            
            applyFilters();

            Swal.fire(
                'Thành công!',
                `Đã ${actionText} tài khoản khách hàng thành công.`,
                'success'
            );
        }
    });
};

/* ══════════════════════════════════════════
   DELETE CUSTOMER STATE FLOW (CONSTRAINED)
   ══════════════════════════════════════════ */
window.deleteCustomer = function (customerId) {
    const customer = customersList.find(c => c.id === customerId);
    if (!customer) return;

    // Check constraint: Has tickets?
    const hasTickets = ticketsList.some(t => t.customerName === customer.hoTen || t.customerPhone === customer.soDienThoai);

    if (hasTickets) {
        Swal.fire({
            title: 'Không thể xóa!',
            text: 'Không thể xóa khách hàng đã phát sinh phiếu hỗ trợ kỹ thuật trên hệ thống.',
            icon: 'error',
            confirmButtonColor: '#2C3E50',
            confirmButtonText: 'Đóng'
        });
        return;
    }

    // Confirm Delete
    Swal.fire({
        title: 'Xác nhận xóa?',
        text: `Bạn có chắc chắn muốn xóa khách hàng "${customer.hoTen}" vĩnh viễn không? Hành động này không thể phục hồi.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EE0033',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Xóa vĩnh viễn',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            customersList = customersList.filter(c => c.id !== customerId);
            localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customersList));

            applyFilters();

            Swal.fire(
                'Đã xóa!',
                'Khách hàng đã được loại bỏ khỏi hệ thống.',
                'success'
            );
        }
    });
};

/* ══════════════════════════════════════════
   CREATE NEW CUSTOMER (ADD FORM VALIDATION)
   ══════════════════════════════════════════ */
function saveNewCustomer() {
    const nameInp = document.getElementById('addCustomerName');
    const phoneInp = document.getElementById('addCustomerPhone');
    const emailInp = document.getElementById('addCustomerEmail');
    const dobInp = document.getElementById('addCustomerDOB');
    const statusInp = document.getElementById('addCustomerStatus');
    const addrInp = document.getElementById('addCustomerAddress');
    const userInp = document.getElementById('addCustomerUsername');
    const passInp = document.getElementById('addCustomerPassword');

    if (!nameInp || !phoneInp || !userInp || !passInp) return;

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

    // Email check (optional but formats properly)
    const emailVal = emailInp.value.trim();
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        emailInp.classList.add('is-invalid');
        isValid = false;
    } else {
        emailInp.classList.remove('is-invalid');
    }

    if (!isValid) {
        showToast('error', 'Vui lòng kiểm tra lại các thông tin bắt buộc (*)');
        return;
    }

    // Duplication username check
    if (customersList.some(c => c.tenDangNhap.toLowerCase() === userVal.toLowerCase())) {
        userInp.classList.add('is-invalid');
        showToast('error', 'Tên đăng nhập đã tồn tại trong hệ thống!');
        return;
    }

    // Generate ID
    const nextId = generateNextCustomerId();

    // Date
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const createdDate = `${dd}/${mm}/${yyyy}`;

    const newCustomer = {
        id: nextId,
        hoTen: nameInp.value.trim(),
        soDienThoai: phoneVal,
        email: emailVal || '',
        diaChi: addrInp.value.trim() || '',
        ngaySinh: dobInp.value || '',
        tenDangNhap: userVal,
        trangThai: statusInp.value,
        ngayTao: createdDate
    };

    customersList.push(newCustomer);
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customersList));

    if (addCustomerModal) addCustomerModal.hide();
    document.getElementById('addCustomerForm').reset();

    applyFilters();
    Swal.fire({
        title: 'Tạo thành công!',
        text: `Đã khởi tạo khách hàng "${newCustomer.hoTen}" với mã ${newCustomer.id}`,
        icon: 'success',
        confirmButtonColor: '#EE0033'
    });
}

function generateNextCustomerId() {
    if (!customersList.length) return 'KH001';
    const nums = customersList.map(c => parseInt(c.id.replace('KH', ''), 10)).filter(n => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return 'KH' + String(max + 1).padStart(3, '0');
}

/* ══════════════════════════════════════════
   CUSTOMER SUPPORT TICKETS HISTORY LOGS
   ══════════════════════════════════════════ */
window.viewTicketHistory = function (customerId) {
    const customer = customersList.find(c => c.id === customerId);
    if (!customer) return;

    activeHistoryCustomerId = customerId;

    // Set headers
    setText('historyCustomerName', customer.hoTen);
    setText('historyCustomerPhone', customer.soDienThoai);
    setText('historyCustomerEmail', customer.email || 'Chưa cung cấp');

    // Reset filters
    const searchCode = document.getElementById('historySearchCode');
    const searchStat = document.getElementById('historySearchStatus');
    if (searchCode) searchCode.value = '';
    if (searchStat) searchStat.value = 'all';

    // Apply & render list
    applyHistoryFilters();

    if (ticketHistoryModal) {
        ticketHistoryModal.show();
    }
};

window.applyHistoryFilters = function () {
    const customer = customersList.find(c => c.id === activeHistoryCustomerId);
    if (!customer) return;

    const keyword = document.getElementById('historySearchCode')?.value.toLowerCase().trim() || '';
    const status = document.getElementById('historySearchStatus')?.value || 'all';

    // Find linked tickets matching name or phone
    const baseTickets = ticketsList.filter(t => t.customerName === customer.hoTen || t.customerPhone === customer.soDienThoai);

    filteredHistoryTickets = baseTickets.filter(t => {
        const matchesKeyword = !keyword || 
                               t.ticketCode.toLowerCase().includes(keyword) || 
                               t.title.toLowerCase().includes(keyword);
        const matchesStatus = status === 'all' || t.status === status;
        return matchesKeyword && matchesStatus;
    });

    renderHistoryTicketsList();
};

window.resetHistoryFilters = function () {
    const searchCode = document.getElementById('historySearchCode');
    const searchStat = document.getElementById('historySearchStatus');
    if (searchCode) searchCode.value = '';
    if (searchStat) searchStat.value = 'all';

    applyHistoryFilters();
};

function renderHistoryTicketsList() {
    const tbody = document.getElementById('historyTicketsBody');
    if (!tbody) return;

    if (!filteredHistoryTickets.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted small">
                    <i class="fa-solid fa-ticket mb-1 d-block" style="font-size:1.5rem;"></i>
                    Không có phiếu hỗ trợ nào tương ứng bộ lọc.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = filteredHistoryTickets.map(t => {
        const priorityBadge = getPriorityBadgeHtml(t.priority);
        const statusBadge = getStatusBadgeHtml(t.status);

        return `
        <tr>
            <td style="padding-left:16px;"><span class="rep-ticket-code">${escHtml(t.ticketCode)}</span></td>
            <td class="fw-semibold text-dark-emphasis">${escHtml(t.title)}</td>
            <td><span class="text-muted" style="font-size:0.85rem;">${escHtml(t.requestType)}</span></td>
            <td>${priorityBadge}</td>
            <td>${statusBadge}</td>
            <td><span class="text-muted font-monospace" style="font-size:0.8rem;">${t.createdDate ? t.createdDate.split(' ')[0] : '—'}</span></td>
            <td style="text-align: center; padding-right:16px;">
                <button class="btn-action-custom view" onclick="viewTicketDetails('${escHtml(t.ticketCode)}')" title="Xem chi tiết phiếu">
                    <i class="fa-solid fa-circle-info"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
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

/* ══════════════════════════════════════════
   VIEW SPECIFIC TICKET DETAIL
   ══════════════════════════════════════════ */
window.viewTicketDetails = function (ticketCode) {
    const ticket = ticketsList.find(t => t.ticketCode === ticketCode);
    if (!ticket) return;

    // Fill elements
    setText('ticketDetTitle', ticket.title);
    setText('ticketDetCode', ticket.ticketCode);
    setText('ticketDetCustomer', ticket.customerName);
    setText('ticketDetReqType', ticket.requestType);
    setText('ticketDetDesc', ticket.description || 'Không có nội dung mô tả lỗi.');
    setText('ticketDetCreatedDate', ticket.createdDate || '—');
    setText('ticketDetUpdatedDate', ticket.createdDate || '—'); // mock matches created date

    const priorityDiv = document.getElementById('ticketDetPriority');
    if (priorityDiv) {
        priorityDiv.innerHTML = getPriorityBadgeHtml(ticket.priority);
    }

    const statusDiv = document.getElementById('ticketDetStatus');
    if (statusDiv) {
        statusDiv.innerHTML = getStatusBadgeHtml(ticket.status);
    }

    const appDiv = document.getElementById('ticketDetAppointment');
    if (appDiv) {
        if (ticket.needAppointment) {
            appDiv.innerHTML = `<span class="text-success fw-bold"><i class="fa-solid fa-calendar-check me-1"></i> Có lịch hẹn (${ticket.appointmentDate} lúc ${ticket.appointmentTime})</span>`;
        } else {
            appDiv.innerHTML = '<span class="text-muted">Không đặt lịch hẹn ghé nhà</span>';
        }
    }

    if (ticketDetailsModal) {
        ticketDetailsModal.show();
    }
};

/* ══════════════════════════════════════════
   HELPER UTILITIES
   ══════════════════════════════════════════ */
function formatDateString(dateStr) {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    }
    return dateStr;
}

function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

/* ══════════════════════════════════════════
   INITIALIZATION
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
    loadCustomersData();
    initCustomersDom();
    applyFilters();
});
