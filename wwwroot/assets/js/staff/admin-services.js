/**
 * admin-services.js — TechSupport Viettel Admin
 * Services CRUD, search, filter, and pagination controller
 */
'use strict';

/* ══════════════════════════════════════════
   CONFIG & STORAGE KEYS
   ══════════════════════════════════════════ */
const SERVICES_STORAGE_KEY = 'viettel_services';
const CATEGORIES_STORAGE_KEY = 'viettel_categories';

/* ══════════════════════════════════════════
   STATE
   ══════════════════════════════════════════ */
let servicesList = [];
let categoriesList = [];
let filteredServices = [];

let currentPage = 1;
let pageSize = 10; // default to 10 entries per page

let selectedServiceId = null; // Used for view, edit, delete actions

// Bootstrap modal instances
let addModal = null;
let editModal = null;
let viewModal = null;
let deleteModal = null;

/* ══════════════════════════════════════════
   LOAD DATA & SEED FALLBACKS
   ══════════════════════════════════════════ */
function loadServicesData() {
    const rawServices = localStorage.getItem(SERVICES_STORAGE_KEY);
    const rawCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);

    categoriesList = rawCategories ? JSON.parse(rawCategories) : [];
    servicesList = rawServices ? JSON.parse(rawServices) : [];

    // Fallbacks if localStorage is empty
    if (!categoriesList.length) {
        categoriesList = [
            { id: 'internet', name: 'Internet cáp quang', desc: 'Mất mạng hoàn toàn, mạng chập chờn, tốc độ truy cập chậm, suy hao tín hiệu cáp quang.', status: 'Hoạt động', createdDate: '10/01/2026' },
            { id: 'tv', name: 'Truyền hình số', desc: 'Màn hình không có tín hiệu, lỗi kênh truyền hình, mất tiếng, không tải được ứng dụng TV.', status: 'Hoạt động', createdDate: '15/01/2026' },
            { id: 'camera', name: 'Camera giám sát', desc: 'Camera offline không kết nối, lỗi lưu trữ đám mây Cloud, mất mật khẩu tài khoản xem camera.', status: 'Hoạt động', createdDate: '20/01/2026' },
            { id: 'phone', name: 'Điện thoại cố định', desc: 'Điện thoại bàn không gọi đi được, không nhận được cuộc gọi đến, tín hiệu thoại bị rè.', status: 'Hoạt động', createdDate: '22/01/2026' },
            { id: 'wifi-corporate', name: 'WiFi doanh nghiệp', desc: 'Hệ thống mạng nội bộ LAN không ổn định, thiết bị định tuyến Router/Switch lỗi, không cấp IP.', status: 'Hoạt động', createdDate: '02/02/2026' },
            { id: 'cloud-server', name: 'Dịch vụ Cloud Server', desc: 'Lỗi hệ điều hành máy chủ ảo VPS, không SSH/Remote Desktop được, cấu hình Firewall chặn cổng.', status: 'Hoạt động', createdDate: '08/02/2026' }
        ];
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categoriesList));
    }

    if (!servicesList.length) {
        servicesList = [
            { id: 'DV101', name: 'Internet Cáp Quang FTTH', desc: 'Đường truyền cáp quang đối xứng băng thông rộng, tốc độ cao.', status: 'Hoạt động', categoryId: 'internet', createdDate: '10/01/2026' },
            { id: 'DV102', name: 'Combo Internet + TV', desc: 'Tích hợp Internet Cáp Quang và Truyền hình số thông minh TV360.', status: 'Hoạt động', categoryId: 'tv', createdDate: '15/01/2026' },
            { id: 'DV103', name: 'Camera Viettel (Home Camera)', desc: 'Giải pháp giám sát an ninh thông minh tích hợp cloud.', status: 'Hoạt động', categoryId: 'camera', createdDate: '20/01/2026' },
            { id: 'DV104', name: 'Mesh Wifi', desc: 'Thiết bị mở rộng vùng phủ sóng Wifi 5/6 giúp bao phủ toàn bộ.', status: 'Hoạt động', categoryId: 'wifi-corporate', createdDate: '02/02/2026' },
            { id: 'DV105', name: 'Cloud VPS', desc: 'Máy chủ ảo điện toán đám mây hiệu năng cao.', status: 'Hoạt động', categoryId: 'cloud-server', createdDate: '08/02/2026' },
            { id: 'DV106', name: 'Tổng đài ảo vCloudCenter', desc: 'Hệ thống tổng đài chăm sóc khách hàng thông minh.', status: 'Hoạt động', categoryId: 'phone', createdDate: '22/01/2026' },
            // Additional seed data to make pagination meaningful
            { id: 'DV107', name: 'Cáp quang doanh nghiệp Leased Line', desc: 'Kênh truyền cáp quang tốc độ cao đối xứng cam kết băng thông quốc tế.', status: 'Hoạt động', categoryId: 'internet', createdDate: '25/01/2026' },
            { id: 'DV108', name: 'Home Camera Ngoài trời', desc: 'Camera chống nước IP67 tích hợp AI nhận diện chuyển động và báo động.', status: 'Hoạt động', categoryId: 'camera', createdDate: '28/01/2026' },
            { id: 'DV109', name: 'Wifi Hotspot công cộng', desc: 'Giải pháp mạng wifi công cộng quản lý quảng cáo trang chào.', status: 'Tạm khóa', categoryId: 'wifi-corporate', createdDate: '05/02/2026' },
            { id: 'DV110', name: 'SIP Trunking thoại', desc: 'Đường trung kế thoại SIP chất lượng cao dành cho tổng đài IP doanh nghiệp.', status: 'Hoạt động', categoryId: 'phone', createdDate: '12/02/2026' },
            { id: 'DV111', name: 'Cloud VPS SSD Giá rẻ', desc: 'Máy chủ ảo lưu trữ SSD tốc độ cao chi phí tối ưu.', status: 'Hoạt động', categoryId: 'cloud-server', createdDate: '18/02/2026' },
            { id: 'DV112', name: 'Điện thoại Analog truyền thống', desc: 'Dịch vụ điện thoại bàn có dây sử dụng cáp đồng truyền thống.', status: 'Tạm khóa', categoryId: 'phone', createdDate: '20/02/2026' }
        ];
        localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(servicesList));
    }
}

/* ══════════════════════════════════════════
   DOM POPULATION & INITIALIZATION
   ══════════════════════════════════════════ */
function initServicesDom() {
    // 1. Instantiating Bootstrap Modals
    const addModalEl = document.getElementById('addServiceModal');
    const editModalEl = document.getElementById('editServiceModal');
    const viewModalEl = document.getElementById('viewServiceModal');
    const deleteModalEl = document.getElementById('deleteServiceModal');

    if (addModalEl) addModal = new bootstrap.Modal(addModalEl);
    if (editModalEl) editModal = new bootstrap.Modal(editModalEl);
    if (viewModalEl) viewModal = new bootstrap.Modal(viewModalEl);
    if (deleteModalEl) deleteModal = new bootstrap.Modal(deleteModalEl);

    // 2. Populating category dropdown options
    populateCategoryDropdowns();

    // 3. Page size drop-down listener
    const pageSizeSel = document.getElementById('pageSizeSelect');
    if (pageSizeSel) {
        pageSizeSel.addEventListener('change', function () {
            pageSize = parseInt(this.value, 10);
            currentPage = 1;
            applyFilters();
        });
    }

    // 4. Live filters setup
    const searchInp = document.getElementById('searchService');
    const catFil = document.getElementById('filterCategory');
    const statFil = document.getElementById('filterStatus');
    const sortFil = document.getElementById('filterSort');

    if (searchInp) searchInp.addEventListener('input', () => { currentPage = 1; applyFilters(); });
    if (catFil) catFil.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    if (statFil) statFil.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    if (sortFil) sortFil.addEventListener('change', () => { currentPage = 1; applyFilters(); });

    // 5. Submit Form Listeners
    const addForm = document.getElementById('addServiceForm');
    if (addForm) {
        addForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveNewService();
        });
    }

    const editForm = document.getElementById('editServiceForm');
    if (editForm) {
        editForm.addEventListener('submit', function (e) {
            e.preventDefault();
            updateServiceDetails();
        });
    }
}

function populateCategoryDropdowns() {
    const filterCat = document.getElementById('filterCategory');
    const addCat = document.getElementById('addServiceCategory');
    const editCat = document.getElementById('editServiceCategory');

    const optionsHtml = categoriesList.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    if (filterCat) {
        filterCat.innerHTML = '<option value="all">📂 Tất cả danh mục</option>' + optionsHtml;
    }
    if (addCat) {
        addCat.innerHTML = '<option value="" disabled selected>-- Chọn danh mục liên kết --</option>' + optionsHtml;
    }
    if (editCat) {
        editCat.innerHTML = '<option value="" disabled selected>-- Chọn danh mục liên kết --</option>' + optionsHtml;
    }
}

/* ══════════════════════════════════════════
   FILTERS & SEARCH ACTIONS
   ══════════════════════════════════════════ */
window.searchServices = function () {
    currentPage = 1;
    applyFilters();
    showToast('success', 'Đã cập nhật bộ lọc tìm kiếm dịch vụ!');
};

window.clearFilters = function () {
    const searchInp = document.getElementById('searchService');
    const catFil = document.getElementById('filterCategory');
    const statFil = document.getElementById('filterStatus');
    const sortFil = document.getElementById('filterSort');

    if (searchInp) searchInp.value = '';
    if (catFil) catFil.value = 'all';
    if (statFil) statFil.value = 'all';
    if (sortFil) sortFil.value = 'newest';

    currentPage = 1;
    applyFilters();
    showToast('info', 'Đã đặt lại bộ lọc về mặc định.');
};

function applyFilters() {
    const searchVal = document.getElementById('searchService')?.value.toLowerCase().trim() || '';
    const catVal = document.getElementById('filterCategory')?.value || 'all';
    const statVal = document.getElementById('filterStatus')?.value || 'all';
    const sortVal = document.getElementById('filterSort')?.value || 'newest';

    // 1. Search + Category + Status matching
    filteredServices = servicesList.filter(s => {
        const matchesQuery = !searchVal || s.name.toLowerCase().includes(searchVal) || s.desc.toLowerCase().includes(searchVal);
        const matchesCategory = catVal === 'all' || s.categoryId === catVal;
        const matchesStatus = statVal === 'all' || s.status === statVal;
        return matchesQuery && matchesCategory && matchesStatus;
    });

    // 2. Sort rules
    filteredServices.sort((a, b) => {
        if (sortVal === 'az') return a.name.localeCompare(b.name, 'vi');
        if (sortVal === 'za') return b.name.localeCompare(a.name, 'vi');

        // Parse dates in dd/mm/yyyy format
        const parseD = (str) => {
            if (!str) return new Date(0);
            const [d, m, y] = str.split('/');
            return new Date(y, m - 1, d);
        };

        const dateA = parseD(a.createdDate);
        const dateB = parseD(b.createdDate);

        if (sortVal === 'oldest') return dateA - dateB;
        return dateB - dateA; // default to 'newest'
    });

    updateKpiCards();
    renderServicesList();
}

/* ══════════════════════════════════════════
   KPI DASHBOARD UPDATES
   ══════════════════════════════════════════ */
function updateKpiCards() {
    const total = servicesList.length;
    const active = servicesList.filter(s => s.status === 'Hoạt động').length;
    const inactive = servicesList.filter(s => s.status === 'Tạm khóa').length;

    // Categories in use: unique category IDs that have at least one service
    const usedCategories = new Set(servicesList.map(s => s.categoryId).filter(Boolean)).size;

    setText('kpiTotalServices', total);
    setText('kpiActiveServices', active);
    setText('kpiInactiveServices', inactive);
    setText('kpiUsedCategories', usedCategories);
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

/* ══════════════════════════════════════════
   RENDER DATA SYSTEM (TABLE + CARDS + PAGING)
   ══════════════════════════════════════════ */
function renderServicesList() {
    const tbody = document.getElementById('servicesBody');
    const mContainer = document.getElementById('servicesMobileContainer');
    if (!tbody || !mContainer) return;

    // Update entries text
    const totalCount = filteredServices.length;
    const startIdx = totalCount ? (currentPage - 1) * pageSize + 1 : 0;
    const endIdx = Math.min(currentPage * pageSize, totalCount);

    const metaCountText = document.getElementById('filteredCountText');
    if (metaCountText) {
        metaCountText.textContent = `Đang hiển thị ${startIdx}-${endIdx} trong tổng số ${totalCount} dịch vụ.`;
    }

    const headerCountText = document.getElementById('servicesCountText');
    if (headerCountText) {
        headerCountText.textContent = `Đang hiển thị ${totalCount} dịch vụ`;
    }

    const start = (currentPage - 1) * pageSize;
    const pageServices = filteredServices.slice(start, start + pageSize);

    // Empty template helper
    if (!pageServices.length) {
        const emptyHtml = `
            <div class="text-center py-5">
                <div class="bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center mb-3" style="width: 56px; height: 56px; border-radius: 50%; font-size: 1.5rem;">
                    <i class="fa-solid fa-network-wired"></i>
                </div>
                <h6 class="fw-bold text-dark">Không tìm thấy dịch vụ hỗ trợ nào</h6>
                <p class="text-muted small mb-0">Thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem kết quả khác.</p>
            </div>`;
        tbody.innerHTML = `<tr><td colspan="8">${emptyHtml}</td></tr>`;
        mContainer.innerHTML = emptyHtml;
        renderPaginationControls(0);
        return;
    }

    // Render Table Rows (Desktop)
    tbody.innerHTML = pageServices.map((s, idx) => {
        const rowNo = start + idx + 1;
        const category = categoriesList.find(c => c.id === s.categoryId);
        const catName = category ? category.name : 'Chưa phân loại';
        const catClass = getCategoryBadgeClass(s.categoryId);
        const statClass = s.status === 'Hoạt động' ? 'active' : 'inactive';

        return `
        <tr>
            <td class="fw-bold" style="padding-left: 20px;">${rowNo}</td>
            <td><span class="rep-service-code">${escHtml(s.id)}</span></td>
            <td class="fw-bold text-dark-emphasis">${escHtml(s.name)}</td>
            <td><span class="badge-category ${catClass}">${escHtml(catName)}</span></td>
            <td><div class="text-wrap" style="max-width: 300px; font-size: 0.82rem; color: var(--text-muted);">${escHtml(s.desc)}</div></td>
            <td><span class="badge-status ${statClass}">${escHtml(s.status)}</span></td>
            <td><span class="text-muted font-monospace" style="font-size: 0.8rem;">${escHtml(s.createdDate)}</span></td>
            <td style="padding-right: 20px;">
                <div class="d-flex gap-2">
                    <button class="btn-action-custom view" onclick="viewServiceDetails('${escHtml(s.id)}')" data-bs-toggle="tooltip" data-bs-placement="top" title="Xem chi tiết">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="btn-action-custom edit" onclick="openEditServiceModal('${escHtml(s.id)}')" data-bs-toggle="tooltip" data-bs-placement="top" title="Chỉnh sửa">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-action-custom delete" onclick="openDeleteServiceModal('${escHtml(s.id)}')" data-bs-toggle="tooltip" data-bs-placement="top" title="Xóa dịch vụ">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');

    // Render Cards List (Mobile)
    mContainer.innerHTML = pageServices.map((s) => {
        const category = categoriesList.find(c => c.id === s.categoryId);
        const catName = category ? category.name : 'Chưa phân loại';
        const catClass = getCategoryBadgeClass(s.categoryId);
        const statClass = s.status === 'Hoạt động' ? 'active' : 'inactive';

        return `
        <div class="rep-mobile-card">
            <div class="rep-mobile-card-header">
                <span class="rep-service-code">${escHtml(s.id)}</span>
                <span class="badge-status ${statClass}">${escHtml(s.status)}</span>
            </div>
            <div class="rep-mobile-card-title">${escHtml(s.name)}</div>
            <div class="rep-mobile-card-body">
                <div class="rep-mobile-card-row">
                    <span>Danh mục:</span>
                    <span class="badge-category ${catClass}">${escHtml(catName)}</span>
                </div>
                <div class="mt-1">
                    <p class="text-muted mb-0" style="font-size:0.82rem; line-height: 1.4;">${escHtml(s.desc)}</p>
                </div>
            </div>
            <div class="rep-mobile-card-meta">
                <span><i class="fa-regular fa-calendar-days me-1"></i> ${escHtml(s.createdDate)}</span>
                <div class="d-flex gap-2">
                    <button class="btn-action-custom view" onclick="viewServiceDetails('${escHtml(s.id)}')" title="Xem chi tiết">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="btn-action-custom edit" onclick="openEditServiceModal('${escHtml(s.id)}')" title="Chỉnh sửa">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-action-custom delete" onclick="openDeleteServiceModal('${escHtml(s.id)}')" title="Xóa">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');

    // Initialize Bootstrap tooltips
    initializeTooltips();

    const totalPages = Math.ceil(totalCount / pageSize);
    renderPaginationControls(totalPages);
}

function getCategoryBadgeClass(catId) {
    if (catId === 'internet') return 'internet';
    if (catId === 'tv') return 'tv';
    if (catId === 'camera') return 'camera';
    if (catId === 'phone') return 'mobile';
    return 'default';
}

function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function renderPaginationControls(totalPages) {
    const wrapper = document.getElementById('servicesPagination');
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
    const totalPages = Math.ceil(filteredServices.length / pageSize);
    if (p < 1 || p > totalPages) return;
    currentPage = p;
    renderServicesList();
};

/* ══════════════════════════════════════════
   MODAL ACTIONS: VIEW DETAILED DATA
   ══════════════════════════════════════════ */
window.viewServiceDetails = function (serviceId) {
    const service = servicesList.find(s => s.id === serviceId);
    if (!service) return;

    const category = categoriesList.find(c => c.id === service.categoryId);
    const catName = category ? category.name : 'Chưa phân loại';
    const statHtml = service.status === 'Hoạt động'
        ? '<span class="badge-status active">Hoạt động</span>'
        : '<span class="badge-status inactive">Tạm khóa</span>';

    setText('viewServiceId', service.id);
    setText('viewServiceName', service.name);
    setText('viewServiceCategory', catName);
    setText('viewServiceDesc', service.desc || 'Không có mô tả chi tiết.');

    const statusDiv = document.getElementById('viewServiceStatus');
    if (statusDiv) statusDiv.innerHTML = statHtml;

    setText('viewServiceCreatedDate', service.createdDate);

    if (viewModal) {
        viewModal.show();
    }
};

/* ══════════════════════════════════════════
   MODAL ACTIONS: ADD SERVICE
   ══════════════════════════════════════════ */
function saveNewService() {
    const nameInp = document.getElementById('addServiceName');
    const catInp = document.getElementById('addServiceCategory');
    const descInp = document.getElementById('addServiceDesc');
    const statInp = document.getElementById('addServiceStatus');

    if (!nameInp || !catInp || !descInp || !statInp) return;

    // Simple Form Validation
    let isValid = true;
    if (!nameInp.value.trim()) {
        nameInp.classList.add('is-invalid');
        isValid = false;
    } else {
        nameInp.classList.remove('is-invalid');
    }

    if (!catInp.value) {
        catInp.classList.add('is-invalid');
        isValid = false;
    } else {
        catInp.classList.remove('is-invalid');
    }

    if (!isValid) {
        showToast('error', 'Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
        return;
    }

    const name = nameInp.value.trim();
    const idSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Duplicate key validation
    if (servicesList.some(s => s.id === idSlug)) {
        showToast('error', 'Tên dịch vụ bị trùng lặp mã sự cố tự động!');
        nameInp.classList.add('is-invalid');
        return;
    }

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const createdDate = `${dd}/${mm}/${yyyy}`;

    const newService = {
        id: idSlug,
        name: name,
        categoryId: catInp.value,
        desc: descInp.value.trim(),
        status: statInp.value,
        createdDate: createdDate
    };

    servicesList.push(newService);
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(servicesList));

    if (addModal) addModal.hide();
    document.getElementById('addServiceForm').reset();

    applyFilters();
    showToast('success', 'Đã khởi tạo dịch vụ hỗ trợ mới thành công!');
}

/* ══════════════════════════════════════════
   MODAL ACTIONS: EDIT SERVICE
   ══════════════════════════════════════════ */
window.openEditServiceModal = function (serviceId) {
    const service = servicesList.find(s => s.id === serviceId);
    if (!service) return;

    selectedServiceId = serviceId;

    const nameInp = document.getElementById('editServiceName');
    const catInp = document.getElementById('editServiceCategory');
    const descInp = document.getElementById('editServiceDesc');
    const statInp = document.getElementById('editServiceStatus');

    if (nameInp) nameInp.value = service.name;
    if (catInp) catInp.value = service.categoryId;
    if (descInp) descInp.value = service.desc;
    if (statInp) statInp.value = service.status;

    // Reset validations
    nameInp.classList.remove('is-invalid');
    catInp.classList.remove('is-invalid');

    if (editModal) {
        editModal.show();
    }
};

function updateServiceDetails() {
    const nameInp = document.getElementById('editServiceName');
    const catInp = document.getElementById('editServiceCategory');
    const descInp = document.getElementById('editServiceDesc');
    const statInp = document.getElementById('editServiceStatus');

    if (!nameInp || !catInp || !descInp || !statInp || !selectedServiceId) return;

    // Simple Form Validation
    let isValid = true;
    if (!nameInp.value.trim()) {
        nameInp.classList.add('is-invalid');
        isValid = false;
    } else {
        nameInp.classList.remove('is-invalid');
    }

    if (!catInp.value) {
        catInp.classList.add('is-invalid');
        isValid = false;
    } else {
        catInp.classList.remove('is-invalid');
    }

    if (!isValid) {
        showToast('error', 'Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
        return;
    }

    const index = servicesList.findIndex(s => s.id === selectedServiceId);
    if (index !== -1) {
        servicesList[index].name = nameInp.value.trim();
        servicesList[index].categoryId = catInp.value;
        servicesList[index].desc = descInp.value.trim();
        servicesList[index].status = statInp.value;

        localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(servicesList));

        if (editModal) editModal.hide();
        applyFilters();
        showToast('success', 'Đã cập nhật thông tin dịch vụ thành công!');
    }
}

/* ══════════════════════════════════════════
   MODAL ACTIONS: DELETE SERVICE
   ══════════════════════════════════════════ */
window.openDeleteServiceModal = function (serviceId) {
    const service = servicesList.find(s => s.id === serviceId);
    if (!service) return;

    selectedServiceId = serviceId;
    const confirmSpan = document.getElementById('deleteConfirmText');
    if (confirmSpan) {
        confirmSpan.innerHTML = `Bạn có chắc chắn muốn xóa dịch vụ kỹ thuật <strong>"${escHtml(service.name)}"</strong> không? Điều này sẽ ảnh hưởng tới dữ liệu thống kê sự cố liên quan.`;
    }

    if (deleteModal) {
        deleteModal.show();
    }
};

window.confirmDeleteService = function () {
    if (!selectedServiceId) return;

    servicesList = servicesList.filter(s => s.id !== selectedServiceId);
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(servicesList));

    if (deleteModal) deleteModal.hide();
    selectedServiceId = null;

    applyFilters();
    showToast('success', 'Đã xóa bỏ dịch vụ hỗ trợ kỹ thuật thành công!');
};

/* ══════════════════════════════════════════
   ESCAPE HTML UTILITY
   ══════════════════════════════════════════ */
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
    loadServicesData();
    initServicesDom();
    applyFilters();
});
