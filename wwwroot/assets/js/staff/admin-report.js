/**
 * admin-report.js — TechSupport Viettel Admin
 * Reports & Statistics controller using Bootstrap 5 elements
 */
'use strict';

/* ══════════════════════════════════════════
   CONFIG & STORAGE KEYS
   ══════════════════════════════════════════ */
const TICKET_STORAGE_KEY = 'viettel_tickets';
const APPOINTMENT_STORAGE_KEY = 'viettel_appointments';
const REPORT_PAGE_SIZE = 8;

/* ══════════════════════════════════════════
   STATE
   ══════════════════════════════════════════ */
let rawTickets = [];
let filteredTickets = [];
let reportCurrentPage = 1;
let chartInstances = {};
let dailyChartRange = 7; // default to 7 days
let detailModalObj = null;

/* Mock Data arrays */
const STAFF_LIST = ['Nguyễn Văn Hùng', 'Trần Thị Mai', 'Lê Hoàng Nam', 'Phạm Minh Tuấn', 'Hoàng Thu Thảo'];
const CUSTOMER_LIST = ['Phan Văn Khải', 'Trịnh Thị Cúc', 'Vũ Hoàng Giang', 'Đặng Quốc Huy', 'Bùi Minh Trí', 'Ngô Thanh Hải', 'Nguyễn Thị Liên', 'Trần Hữu Thắng', 'Phạm Ngọc Ánh', 'Lê Minh Hằng'];
const PRIORITIES = ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp'];
const STATUSES = ['Chờ tiếp nhận', 'Đang xử lý', 'Đã hoàn thành', 'Đã hủy'];

const SERVICE_MAPPING = {
    'Internet': ['Mất kết nối Internet', 'Internet chậm', 'WiFi yếu', 'Đèn LOS đỏ'],
    'Truyền hình': ['Mất kênh', 'Hình ảnh nhiễu', 'Lỗi đầu thu'],
    'Di động': ['Sim bị khóa', 'Mất sóng di động', 'Lỗi đăng ký gói cước'],
    'Camera': ['Camera mất kết nối', 'Hình ảnh mờ', 'Lỗi thẻ nhớ']
};

/* ══════════════════════════════════════════
   SEED MOCK DATA GENERATOR (STANDARD SCHEMA)
   ══════════════════════════════════════════ */
function seedMockData() {
    const list = [];
    const now = new Date();
    const totalTickets = 75;
    
    const catList = ['internet', 'tv', 'camera', 'phone', 'wifi-corporate', 'cloud-server'];
    const serviceMap = {
        'internet': 'ftth',
        'tv': 'combo',
        'camera': 'home-camera',
        'phone': 'vcloudcenter',
        'wifi-corporate': 'mesh-wifi',
        'cloud-server': 'cloud-vps'
    };
    const requestTypes = ['Báo Hỏng Thiết Bị', 'Hỗ Trợ Kỹ Thuật', 'Đăng Ký Mới', 'Ý Kiến Phản Ánh'];
    const priorities = ['Khẩn Cấp', 'Cao', 'Trung Bình', 'Thấp'];
    
    for (let i = 1; i <= totalTickets; i++) {
        let d = null;
        if (i <= 45) {
            const dayOffset = i % 30;
            d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);
        } else {
            const monthOffset = (i % 11) + 1;
            d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 15);
        }
        
        const pad = (n) => String(n).padStart(2, '0');
        const createdDate = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} 08:30:00`;
        
        const categoryId = catList[i % catList.length];
        const serviceId = serviceMap[categoryId];
        const priority = priorities[(i * 3) % priorities.length];
        
        // Status weights
        let status = 'completed';
        if (i % 9 === 0) status = 'cancelled';
        else if (i % 8 === 0) status = 'waiting';
        else if (i % 6 === 0) status = 'processing';
        else if (i % 11 === 0) status = 'feedback';
        
        const staffId = status === 'waiting' ? '' : `NV00${(i % 3) + 1}`;
        const customerName = CUSTOMER_LIST[(i * 2) % CUSTOMER_LIST.length];
        
        let rating = 0;
        if (status === 'completed') {
            rating = (i % 3) + 3; // 3, 4, 5 stars
            if (i % 13 === 0) rating = 2;
            if (i % 23 === 0) rating = 1;
        }
        
        list.push({
            id: i,
            ticketCode: `PHT-2026${String(i).padStart(4, '0')}`,
            title: `Lỗi kết nối dịch vụ ${serviceId} số ${i}`,
            categoryId: categoryId,
            serviceId: serviceId,
            requestType: requestTypes[i % requestTypes.length],
            priority: priority,
            status: status,
            description: `Khách hàng phản ánh dịch vụ gặp sự cố, cần kiểm tra đường truyền thiết bị ${serviceId} của Viettel.`,
            createdDate: createdDate,
            updatedDate: createdDate,
            customerName: customerName,
            customerPhone: `098${String(1000000 + i).slice(1)}`,
            needAppointment: status === 'waiting' || status === 'processing',
            appointmentDate: '',
            appointmentTime: '',
            appointmentNote: '',
            staffId: staffId,
            rating: rating
        });
    }
    
    localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(list));
    return list;
}

// Seed appointments if not exist
function seedAppointmentsIfEmpty() {
    if (!localStorage.getItem(APPOINTMENT_STORAGE_KEY)) {
        const mockApps = [
            { id: 'LH001', status: 'completed' },
            { id: 'LH002', status: 'approved' },
            { id: 'LH003', status: 'waiting' },
            { id: 'LH004', status: 'completed' },
            { id: 'LH005', status: 'cancelled' },
            { id: 'LH006', status: 'approved' },
            { id: 'LH007', status: 'completed' },
            { id: 'LH008', status: 'waiting' },
            { id: 'LH009', status: 'completed' },
            { id: 'LH010', status: 'completed' }
        ];
        localStorage.setItem(APPOINTMENT_STORAGE_KEY, JSON.stringify(mockApps));
    }
}

/* ══════════════════════════════════════════
   LOAD DATA & SCHEMA NORMALIZATION
   ══════════════════════════════════════════ */
function loadData() {
    const raw = localStorage.getItem(TICKET_STORAGE_KEY);
    let loadedTickets = raw ? JSON.parse(raw) : [];
    
    if (!loadedTickets.length) {
        loadedTickets = seedMockData();
    }
    
    // Normalize tickets to report schema
    rawTickets = loadedTickets.map(t => {
        // If already in report schema, return
        if (t.createdAt && t.category && t.service && isNaN(t.id)) {
            return t;
        }
        
        // Map ID/Code
        const id = t.ticketCode || `PHT-2026${String(t.id).padStart(4, '0')}`;
        
        // Parse date "10/05/2026 08:30:00" -> "2026-05-10"
        let createdAt = '';
        if (t.createdDate) {
            const datePart = t.createdDate.split(' ')[0];
            if (datePart) {
                const dateParts = datePart.split('/');
                if (dateParts.length === 3) {
                    createdAt = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                }
            }
        }
        if (!createdAt) {
            createdAt = new Date().toISOString().split('T')[0];
        }
        
        // Map Category
        let category = 'Internet';
        if (t.categoryId) {
            const catLower = t.categoryId.toLowerCase();
            if (catLower.includes('internet') || catLower.includes('wifi') || catLower.includes('cloud')) {
                category = 'Internet';
            } else if (catLower.includes('tv') || catLower.includes('truyền hình')) {
                category = 'Truyền hình';
            } else if (catLower.includes('camera')) {
                category = 'Camera';
            } else if (catLower.includes('phone') || catLower.includes('di động') || catLower.includes('cố định')) {
                category = 'Di động';
            }
        }
        
        // Map Service
        let service = 'Mất kết nối Internet';
        if (t.serviceId) {
            const servLower = t.serviceId.toLowerCase();
            if (servLower.includes('ftth')) {
                service = 'Mất kết nối Internet';
            } else if (servLower.includes('combo')) {
                service = 'Lỗi đầu thu';
            } else if (servLower.includes('home-camera')) {
                service = 'Camera mất kết nối';
            } else if (servLower.includes('mesh-wifi')) {
                service = 'WiFi yếu';
            } else if (servLower.includes('cloud-vps')) {
                service = 'Internet chậm';
            } else if (servLower.includes('vcloudcenter')) {
                service = 'Sim bị khóa';
            } else {
                service = t.serviceId;
            }
        } else if (t.service) {
            service = t.service;
        }
        
        // Map Status
        let status = 'Đã hoàn thành';
        if (t.status === 'waiting') status = 'Chờ tiếp nhận';
        else if (t.status === 'processing') status = 'Đang xử lý';
        else if (t.status === 'completed') status = 'Đã hoàn thành';
        else if (t.status === 'cancelled') status = 'Đã hủy';
        else if (t.status === 'feedback') status = 'Đang xử lý';
        else if (t.status) status = t.status;
        
        // Map Staff Name
        let staffName = '';
        if (t.staffId) {
            const staffList = [
                { id: 'NV001', hoTen: 'Nguyễn Văn Hùng' },
                { id: 'NV002', hoTen: 'Trần Thị Mai' },
                { id: 'NV003', hoTen: 'Lê Hoàng Nam' },
                { id: 'NV004', hoTen: 'Phạm Minh Tuấn' },
                { id: 'NV005', hoTen: 'Hoàng Thu Thảo' }
            ];
            const staffObj = staffList.find(s => s.id === t.staffId);
            staffName = staffObj ? staffObj.hoTen : t.staffId;
        } else if (t.staffName) {
            staffName = t.staffName;
        }
        
        // Map Rating
        let rating = t.rating || 0;
        if (status === 'Đã hoàn thành' && !rating) {
            const codeNum = parseInt(id.replace(/\D/g, ''), 10) || 0;
            rating = (codeNum % 3) + 3; // 3, 4, 5
        }
        
        return {
            id: id,
            customerName: t.customerName || 'Khách hàng',
            category: category,
            service: service,
            staffName: staffName,
            createdAt: createdAt,
            priority: t.priority || 'Trung bình',
            status: status,
            rating: rating
        };
    });
    
    seedAppointmentsIfEmpty();
}

/* ══════════════════════════════════════════
   INITIALIZE DOM ELEMENTS & CASCADE FILTERS
   ══════════════════════════════════════════ */
function initDom() {
    // Populate Staff select dropdown
    const staffSelect = document.getElementById('reportStaff');
    if (staffSelect) {
        staffSelect.innerHTML = '<option value="">Tất cả nhân viên</option>' +
            STAFF_LIST.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    // Bind Cascade change on Category select
    const catSelect = document.getElementById('reportCategory');
    const servSelect = document.getElementById('reportService');
    
    if (catSelect && servSelect) {
        catSelect.addEventListener('change', function () {
            const selectedCat = catSelect.value;
            if (!selectedCat) {
                // If reset category, clear service dropdown options
                servSelect.innerHTML = '<option value="">Tất cả dịch vụ</option>';
            } else {
                const subServices = SERVICE_MAPPING[selectedCat] || [];
                servSelect.innerHTML = '<option value="">Tất cả dịch vụ</option>' +
                    subServices.map(s => `<option value="${s}">${s}</option>`).join('');
            }
            applyFilters();
        });
    }

    // Initialize Bootstrap Modal
    const modalEl = document.getElementById('ticketDetailModal');
    if (modalEl) {
        detailModalObj = new bootstrap.Modal(modalEl);
    }
}

/* ══════════════════════════════════════════
   LOADING OVERLAY & TOAST NOTIFICATION
   ══════════════════════════════════════════ */
function showOverlay() {
    const el = document.getElementById('loadingOverlay');
    if (el) el.style.display = 'flex';
}

function hideOverlay() {
    const el = document.getElementById('loadingOverlay');
    if (el) el.style.display = 'none';
}

/* ══════════════════════════════════════════
   STATISTICS & FILTER LOGIC
   ══════════════════════════════════════════ */
window.runStatistics = function () {
    showOverlay();
    setTimeout(() => {
        applyFilters();
        hideOverlay();
        showToast('success', 'Đã cập nhật bảng và 8 biểu đồ thống kê!');
    }, 600);
};

window.clearFilters = function () {
    showOverlay();
    setTimeout(() => {
        const fromDate = document.getElementById('reportFromDate');
        const toDate = document.getElementById('reportToDate');
        const category = document.getElementById('reportCategory');
        const service = document.getElementById('reportService');
        const staff = document.getElementById('reportStaff');
        const status = document.getElementById('reportStatus');
        
        if (fromDate) fromDate.value = '';
        if (toDate) toDate.value = '';
        if (category) category.value = '';
        if (service) service.innerHTML = '<option value="">Tất cả dịch vụ</option>';
        if (staff) staff.value = '';
        if (status) status.value = '';
        
        applyFilters();
        hideOverlay();
        showToast('info', 'Đã khôi phục bộ lọc mặc định.');
    }, 500);
};

function applyFilters() {
    const fromDate = document.getElementById('reportFromDate')?.value || '';
    const toDate   = document.getElementById('reportToDate')?.value || '';
    const category = document.getElementById('reportCategory')?.value || '';
    const service  = document.getElementById('reportService')?.value || '';
    const staff    = document.getElementById('reportStaff')?.value || '';
    const status   = document.getElementById('reportStatus')?.value || '';

    filteredTickets = rawTickets.filter(t => {
        const matchFrom = !fromDate || t.createdAt >= fromDate;
        const matchTo   = !toDate || t.createdAt <= toDate;
        const matchCat  = !category || t.category === category;
        const matchServ = !service || t.service === service;
        const matchStaf = !staff || t.staffName === staff;
        const matchStat = !status || t.status === status;
        
        return matchFrom && matchTo && matchCat && matchServ && matchStaf && matchStat;
    });

    reportCurrentPage = 1;
    updateKpis();
    renderCharts();
    renderReportsTable();
}

/* ══════════════════════════════════════════
   UPDATE KPI CARDS
   ══════════════════════════════════════════ */
function updateKpis() {
    const total = filteredTickets.length;
    const pending = filteredTickets.filter(t => t.status === 'Chờ tiếp nhận').length;
    const processing = filteredTickets.filter(t => t.status === 'Đang xử lý').length;
    const completed = filteredTickets.filter(t => t.status === 'Đã hoàn thành').length;

    // Unique customers count
    const uniqueCust = new Set(filteredTickets.map(t => t.customerName)).size;
    
    // Unique staff count
    const uniqueStaff = new Set(filteredTickets.map(t => t.staffName).filter(Boolean)).size;

    // Proportional appointments count
    const rawApps = JSON.parse(localStorage.getItem(APPOINTMENT_STORAGE_KEY) || '[]');
    const appsCount = Math.round(rawApps.length * (total / (rawTickets.length || 1)));

    // Rating Average
    const rated = filteredTickets.filter(t => t.rating > 0);
    const sum = rated.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = rated.length ? (sum / rated.length) : 0.0;

    setText('kpiTotalTickets', total);
    setText('kpiPendingTickets', pending);
    setText('kpiProcessingTickets', processing);
    setText('kpiCompletedTickets', completed);
    setText('kpiTotalCustomers', uniqueCust);
    setText('kpiTotalStaff', uniqueStaff || STAFF_LIST.length);
    setText('kpiTotalAppointments', appsCount || rawApps.length);
    setText('kpiAvgRating', avg ? avg.toFixed(1) : '0.0');

    // Stars rating UI
    const kpiStars = document.getElementById('kpiStars');
    if (kpiStars) {
        kpiStars.innerHTML = buildStarsHtml(avg);
    }
}

function buildStarsHtml(score) {
    if (score <= 0) return '<i class="fa-regular fa-star"></i>'.repeat(5);
    let html = '';
    const full = Math.floor(score);
    const half = score % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    
    html += '<i class="fa-solid fa-star"></i>'.repeat(full);
    if (half) html += '<i class="fa-solid fa-star-half-stroke"></i>';
    html += '<i class="fa-regular fa-star"></i>'.repeat(empty);
    return html;
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

/* ══════════════════════════════════════════
   CHART DEFINITIONS (CHART.JS)
   ══════════════════════════════════════════ */
function destroyChart(name) {
    if (chartInstances[name]) {
        chartInstances[name].destroy();
    }
}

// 7-day vs 30-day toggle logic for Chart 1
window.setDailyChartRange = function (days) {
    dailyChartRange = days;
    
    // Toggle active classes on buttons
    const btn7 = document.getElementById('btnDays7');
    const btn30 = document.getElementById('btnDays30');
    if (days === 7) {
        btn7?.classList.add('active');
        btn30?.classList.remove('active');
    } else {
        btn30?.classList.add('active');
        btn7?.classList.remove('active');
    }
    
    // Re-render Daily Line Chart
    renderDailyChart();
};

function renderDailyChart() {
    destroyChart('daily');
    
    const now = new Date();
    const labels = [];
    const dateKeys = [];
    
    // Generate dates based on dailyChartRange (7 or 30 days back)
    for (let i = dailyChartRange - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dateKeys.push(key);
        labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
    }
    
    // Sum counts for dates
    const counts = dateKeys.map(key => {
        return filteredTickets.filter(t => t.createdAt === key).length;
    });

    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const gridColor = isDark ? '#334155' : '#E5E7EB';
    const textColor = isDark ? '#94A3B8' : '#6B7280';
    
    const dailyCtx = document.getElementById('chartDaily')?.getContext('2d');
    if (dailyCtx) {
        chartInstances['daily'] = new Chart(dailyCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Phiếu sự cố',
                    data: counts,
                    borderColor: '#EE0033',
                    backgroundColor: 'rgba(238, 0, 51, 0.1)',
                    fill: true,
                    tension: 0.25,
                    borderWidth: 3,
                    pointBackgroundColor: '#EE0033',
                    pointBorderColor: '#ffffff',
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: gridColor }, ticks: { color: textColor } },
                    y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 }, beginAtZero: true }
                }
            }
        });
    }
}

function renderCharts() {
    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const gridColor = isDark ? '#334155' : '#E5E7EB';
    const textColor = isDark ? '#94A3B8' : '#6B7280';

    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;

    // ─────────────────────────────────────────
    // CHART 1: Daily Tickets (Line Chart)
    // ─────────────────────────────────────────
    renderDailyChart();

    // ─────────────────────────────────────────
    // CHART 2: Monthly Tickets (Line Chart)
    // ─────────────────────────────────────────
    destroyChart('monthly');
    const monthlyCounts = Array(12).fill(0);
    
    filteredTickets.forEach(t => {
        if (t.createdAt) {
            const m = parseInt(t.createdAt.split('-')[1], 10);
            if (m >= 1 && m <= 12) {
                monthlyCounts[m - 1]++;
            }
        }
    });

    const monthlyLabels = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    const monthlyCtx = document.getElementById('chartMonthly')?.getContext('2d');
    if (monthlyCtx) {
        chartInstances['monthly'] = new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: monthlyLabels,
                datasets: [{
                    label: 'Phiếu sự cố theo tháng',
                    data: monthlyCounts,
                    borderColor: '#2C3E50',
                    backgroundColor: 'rgba(44, 62, 80, 0.08)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2.5,
                    pointBackgroundColor: '#2C3E50',
                    pointBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: textColor } },
                    y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor } }
                }
            }
        });
    }

    // ─────────────────────────────────────────
    // CHART 3: Ticket Status (Doughnut Chart)
    // ─────────────────────────────────────────
    destroyChart('status');
    const statusCounts = STATUSES.map(s => filteredTickets.filter(t => t.status === s).length);

    const statusCtx = document.getElementById('chartStatus')?.getContext('2d');
    if (statusCtx) {
        chartInstances['status'] = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: STATUSES,
                datasets: [{
                    data: statusCounts,
                    backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#EF4444'],
                    borderWidth: isDark ? 2 : 1,
                    borderColor: isDark ? '#1E293B' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } },
                cutout: '65%'
            }
        });
    }

    // ─────────────────────────────────────────
    // CHART 4: Category distribution (Bar Chart)
    // ─────────────────────────────────────────
    destroyChart('category');
    const categories = Object.keys(SERVICE_MAPPING);
    const categoryCounts = categories.map(c => filteredTickets.filter(t => t.category === c).length);

    const catCtx = document.getElementById('chartCategory')?.getContext('2d');
    if (catCtx) {
        chartInstances['category'] = new Chart(catCtx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    data: categoryCounts,
                    backgroundColor: 'rgba(238, 0, 51, 0.85)',
                    hoverBackgroundColor: '#EE0033',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }

    // ─────────────────────────────────────────
    // CHART 5: Services (Horizontal Bar Chart)
    // ─────────────────────────────────────────
    destroyChart('service');
    const serviceCountsMap = {};
    
    // Initialize mapping
    Object.values(SERVICE_MAPPING).flat().forEach(s => {
        serviceCountsMap[s] = 0;
    });

    filteredTickets.forEach(t => {
        if (t.service && serviceCountsMap[t.service] !== undefined) {
            serviceCountsMap[t.service]++;
        }
    });

    // Sort to retrieve top 6 failures
    const sortedServices = Object.keys(serviceCountsMap)
        .map(name => ({ name, count: serviceCountsMap[name] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

    const serviceCtx = document.getElementById('chartService')?.getContext('2d');
    if (serviceCtx) {
        chartInstances['service'] = new Chart(serviceCtx, {
            type: 'bar',
            data: {
                labels: sortedServices.map(s => s.name),
                datasets: [{
                    data: sortedServices.map(s => s.count),
                    backgroundColor: 'rgba(44, 62, 80, 0.8)',
                    hoverBackgroundColor: 'var(--vt-dark-blue)',
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }

    // ─────────────────────────────────────────
    // CHART 6: Quality Dimensions (Radar Chart)
    // ─────────────────────────────────────────
    destroyChart('rating');
    const rated = filteredTickets.filter(t => t.rating > 0);
    const avgScore = rated.length ? (rated.reduce((sum, t) => sum + t.rating, 0) / rated.length) : 4.4;

    const ratingCtx = document.getElementById('chartRatingDimensions')?.getContext('2d');
    if (ratingCtx) {
        chartInstances['rating'] = new Chart(ratingCtx, {
            type: 'radar',
            data: {
                labels: ['Chất lượng dịch vụ', 'Thái độ nhân viên', 'Tốc độ xử lý'],
                datasets: [{
                    label: 'Điểm đánh giá (1-5)',
                    data: [
                        parseFloat(Math.min(5, avgScore * 1.02).toFixed(1)),
                        parseFloat(Math.min(5, avgScore * 1.04).toFixed(1)),
                        parseFloat(Math.min(5, avgScore * 0.97).toFixed(1))
                    ],
                    backgroundColor: 'rgba(238, 0, 51, 0.15)',
                    borderColor: '#EE0033',
                    pointBackgroundColor: '#EE0033',
                    pointBorderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        min: 0,
                        max: 5,
                        ticks: { display: false, stepSize: 1 },
                        grid: { color: gridColor },
                        angleLines: { color: gridColor }
                    }
                }
            }
        });
    }

    // ─────────────────────────────────────────
    // CHART 7: Stars Breakdown (Pie Chart)
    // ─────────────────────────────────────────
    destroyChart('stars');
    const starCounts = [5, 4, 3, 2, 1].map(star => {
        return filteredTickets.filter(t => t.rating === star).length;
    });

    const starsCtx = document.getElementById('chartStarDistribution')?.getContext('2d');
    if (starsCtx) {
        chartInstances['stars'] = new Chart(starsCtx, {
            type: 'pie',
            data: {
                labels: ['5 sao', '4 sao', '3 sao', '2 sao', '1 sao'],
                datasets: [{
                    data: starCounts,
                    backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#EF4444'],
                    borderColor: isDark ? '#1E293B' : '#ffffff',
                    borderWidth: isDark ? 2 : 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }
            }
        });
    }

    // ─────────────────────────────────────────
    // CHART 8: Appointments Monthly (Bar Chart)
    // ─────────────────────────────────────────
    destroyChart('appointments');
    
    // Seed appointments distribution
    const appCounts = Array(12).fill(0);
    // Scale dynamically based on ticket distribution with slightly different seed
    filteredTickets.forEach((t, i) => {
        if (t.createdAt && i % 2 === 0) {
            const m = parseInt(t.createdAt.split('-')[1], 10);
            if (m >= 1 && m <= 12) {
                appCounts[m - 1] += (i % 2) + 1;
            }
        }
    });

    const appointmentsCtx = document.getElementById('chartAppointmentsMonthly')?.getContext('2d');
    if (appointmentsCtx) {
        chartInstances['appointments'] = new Chart(appointmentsCtx, {
            type: 'bar',
            data: {
                labels: monthlyLabels,
                datasets: [{
                    data: appCounts,
                    backgroundColor: '#14B8A6',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: textColor } },
                    y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor } }
                }
            }
        });
    }
}

/* ══════════════════════════════════════════
   RENDER DATA REPORTS TABLE
   ══════════════════════════════════════════ */
function renderReportsTable() {
    const tbody = document.getElementById('reportsTableBody');
    const mContainer = document.getElementById('reportsMobileContainer');
    if (!tbody || !mContainer) return;

    // Total badge display count
    setText('filteredCountBadge', filteredTickets.length);
    const startIdx = filteredTickets.length ? (reportCurrentPage - 1) * REPORT_PAGE_SIZE + 1 : 0;
    const endIdx   = Math.min(reportCurrentPage * REPORT_PAGE_SIZE, filteredTickets.length);
    setText('tableMetaCount', `Đang hiển thị ${startIdx}–${endIdx} trên ${filteredTickets.length} phiếu hỗ trợ`);

    const start = (reportCurrentPage - 1) * REPORT_PAGE_SIZE;
    const page  = filteredTickets.slice(start, start + REPORT_PAGE_SIZE);

    if (!page.length) {
        const emptyHtml = `
            <div class="text-center py-5">
                <div class="bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center mb-3" style="width: 56px; height: 56px; border-radius: 50%; font-size: 1.5rem;">
                    <i class="fa-solid fa-folder-open"></i>
                </div>
                <h6 class="fw-bold text-dark">Không tìm thấy phiếu hỗ trợ nào</h6>
                <p class="text-muted small mb-0">Thay đổi cấu hình bộ lọc để xem các kết quả khác.</p>
            </div>`;
        tbody.innerHTML = `<tr><td colspan="10">${emptyHtml}</td></tr>`;
        mContainer.innerHTML = emptyHtml;
        return;
    }

    // Render Table Rows (Desktop)
    const rowsHtml = page.map((t, idx) => {
        const rowNo = start + idx + 1;
        const priorityClass = getPriorityClass(t.priority);
        const statusClass   = getStatusClass(t.status);
        const starsHtml     = t.rating ? '<i class="fa-solid fa-star text-warning"></i>'.repeat(t.rating) : '<span class="text-muted">—</span>';
        
        return `
        <tr>
            <td style="padding-left: 24px; color: var(--text-muted); font-weight: 600; font-size: 0.8rem;">${rowNo}</td>
            <td><span class="rep-ticket-code">${escHtml(t.id)}</span></td>
            <td class="fw-bold">${escHtml(t.customerName)}</td>
            <td>
                <span class="badge bg-light text-dark border px-2 py-1" style="font-size:0.78rem;">
                    <i class="fa-solid fa-layer-group me-1 text-danger"></i>${escHtml(t.service)}
                </span>
            </td>
            <td class="fw-semibold">${escHtml(t.staffName || 'Chưa phân công')}</td>
            <td><span class="text-muted" style="font-size: 0.82rem;"><i class="fa-regular fa-calendar me-1"></i>${escHtml(t.createdAt)}</span></td>
            <td><span class="badge-priority ${priorityClass}">${escHtml(t.priority)}</span></td>
            <td><span class="badge-status ${statusClass}">${escHtml(t.status)}</span></td>
            <td style="text-align: center;">${starsHtml}</td>
            <td style="padding-right: 24px; text-align: center;">
                <button class="btn-action-view" onclick="openDetailModal('${escHtml(t.id)}')" title="Xem chi tiết">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        </tr>`;
    }).join('');

    tbody.innerHTML = rowsHtml;

    // Render Cards (Mobile)
    const cardsHtml = page.map((t) => {
        const priorityClass = getPriorityClass(t.priority);
        const statusClass   = getStatusClass(t.status);
        const starsHtml     = t.rating ? '<i class="fa-solid fa-star text-warning"></i>'.repeat(t.rating) : '—';
        
        return `
        <div class="rep-mobile-card">
            <div class="rep-mobile-card-header">
                <span class="rep-ticket-code">${escHtml(t.id)}</span>
                <span class="badge-status ${statusClass}">${escHtml(t.status)}</span>
            </div>
            <div class="rep-mobile-card-title">${escHtml(t.customerName)}</div>
            <div class="rep-mobile-card-body">
                <div class="rep-mobile-card-row">
                    <span>Dịch vụ:</span>
                    <strong>${escHtml(t.service)}</strong>
                </div>
                <div class="rep-mobile-card-row">
                    <span>Kỹ thuật viên:</span>
                    <strong>${escHtml(t.staffName || 'Chưa phân công')}</strong>
                </div>
                <div class="rep-mobile-card-row">
                    <span>Mức độ ưu tiên:</span>
                    <span class="badge-priority ${priorityClass}">${escHtml(t.priority)}</span>
                </div>
                <div class="rep-mobile-card-row">
                    <span>Đánh giá:</span>
                    <span>${starsHtml}</span>
                </div>
            </div>
            <div class="rep-mobile-card-meta">
                <span><i class="fa-regular fa-calendar-days me-1"></i> ${escHtml(t.createdAt)}</span>
                <button class="btn btn-sm btn-outline-primary" onclick="openDetailModal('${escHtml(t.id)}')" style="border-radius:6px;font-size:0.75rem;">
                    <i class="fa-solid fa-eye me-1"></i>Chi tiết
                </button>
            </div>
        </div>`;
    }).join('');

    mContainer.innerHTML = cardsHtml;

    // Render Pagination Control
    renderPagination();
}

function getPriorityClass(p) {
    if (p === 'Thấp') return 'low';
    if (p === 'Trung bình') return 'medium';
    if (p === 'Cao') return 'high';
    return 'emergency';
}

function getStatusClass(s) {
    if (s === 'Chờ tiếp nhận') return 'waiting';
    if (s === 'Đang xử lý') return 'processing';
    if (s === 'Đã hoàn thành') return 'completed';
    return 'cancelled';
}

/* ══════════════════════════════════════════
   PAGINATION CONTROL
   ══════════════════════════════════════════ */
function renderPagination() {
    const totalPages = Math.max(1, Math.ceil(filteredTickets.length / REPORT_PAGE_SIZE));
    const wrap = document.getElementById('reportsPagination');
    if (!wrap) return;

    let html = `
        <li class="page-item ${reportCurrentPage <= 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="goReportPage(${reportCurrentPage - 1})" aria-label="Trước">
                <i class="fa-solid fa-chevron-left" style="font-size:0.7rem;"></i>
            </button>
        </li>`;

    const range = pageRange(reportCurrentPage, totalPages, 5);
    range.forEach(p => {
        if (p === '…') {
            html += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
        } else {
            html += `
                <li class="page-item ${p === reportCurrentPage ? 'active' : ''}">
                    <button class="page-link" onclick="goReportPage(${p})">${p}</button>
                </li>`;
        }
    });

    html += `
        <li class="page-item ${reportCurrentPage >= totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="goReportPage(${reportCurrentPage + 1})" aria-label="Sau">
                <i class="fa-solid fa-chevron-right" style="font-size:0.7rem;"></i>
            </button>
        </li>`;

    wrap.innerHTML = html;
    
    // Pagination description info
    const infoText = document.getElementById('paginationInfoText');
    if (infoText) {
        infoText.textContent = `Trang ${reportCurrentPage} / ${totalPages}`;
    }
}

function pageRange(current, total, maxVisible) {
    if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, current - half);
    let end   = Math.min(total, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    const pages = [];
    if (start > 1) { pages.push(1); if (start > 2) pages.push('…'); }
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < total) { if (end < total - 1) pages.push('…'); pages.push(total); }
    return pages;
}

window.goReportPage = function (p) {
    const totalPages = Math.ceil(filteredTickets.length / REPORT_PAGE_SIZE);
    if (p < 1 || p > totalPages) return;
    reportCurrentPage = p;
    renderReportsTable();
};

/* ══════════════════════════════════════════
   DETAIL PREVIEW MODAL ACTIONS
   ══════════════════════════════════════════ */
window.openDetailModal = function (ticketId) {
    const ticket = rawTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    setText('modalCustomerName', ticket.customerName);
    setText('modalTicketCode', ticket.id);
    setText('modalService', `${ticket.category} — ${ticket.service}`);
    setText('modalStaff', ticket.staffName || 'Chưa phân công');
    setText('modalCreatedAt', ticket.createdAt);
    
    const priorityEl = document.getElementById('modalPriority');
    if (priorityEl) {
        priorityEl.innerHTML = `<span class="badge-priority ${getPriorityClass(ticket.priority)}">${ticket.priority}</span>`;
    }

    const statusEl = document.getElementById('modalStatus');
    if (statusEl) {
        statusEl.innerHTML = `<span class="badge-status ${getStatusClass(ticket.status)}">${ticket.status}</span>`;
    }

    const ratingEl = document.getElementById('modalRating');
    if (ratingEl) {
        ratingEl.innerHTML = ticket.rating ? '<i class="fa-solid fa-star text-warning me-1"></i>'.repeat(ticket.rating) : '<span class="text-muted">Chưa đánh giá</span>';
    }

    if (detailModalObj) {
        detailModalObj.show();
    }
};

/* ══════════════════════════════════════════
   EXPORT TO EXCEL (SHEETJS)
   ══════════════════════════════════════════ */
window.exportExcel = function () {
    if (!filteredTickets.length) {
        showToast('error', 'Không có dữ liệu báo cáo nào để xuất file!');
        return;
    }

    // Format data rows
    const dataToExport = filteredTickets.map((t, idx) => ({
        "STT": idx + 1,
        "Mã Phiếu": t.id,
        "Khách Hàng": t.customerName,
        "Danh Mục": t.category,
        "Dịch Vụ Sự Cố": t.service,
        "Nhân Viên Hỗ Trợ": t.staffName || 'Chưa phân công',
        "Ngày Tạo": t.createdAt,
        "Mức Độ Ưu Tiên": t.priority,
        "Trạng Thái Phiếu": t.status,
        "Đánh Giá (Sao)": t.rating ? `${t.rating} Sao` : 'Chưa đánh giá'
    }));

    // Generate Excel spreadsheet
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Báo Cáo Phiếu Hỗ Trợ");

    // Add layout sizing parameter
    ws['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 22 }, { wch: 15 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    XLSX.writeFile(wb, `BaoCao_TechSupport_${dateStr}.xlsx`);
    showToast('success', 'Xuất báo cáo Excel thành công!');
};

/* ══════════════════════════════════════════
   EXPORT TO PDF (HTML2CANVAS + JSPDF)
   ══════════════════════════════════════════ */
window.exportPDF = function () {
    const element = document.getElementById('reportPageContent');
    if (!element) return;
    
    showOverlay();
    
    // Hide UI controls to print cleanly
    const filterCard = document.querySelector('.rep-filter-card');
    const exportBtns = document.querySelector('.rep-export-actions');
    const pagination = document.querySelector('.pagination');
    
    if (filterCard) filterCard.style.display = 'none';
    if (exportBtns) exportBtns.style.visibility = 'hidden';
    if (pagination) pagination.style.visibility = 'hidden';

    // Delay to allow CSS style adjustments
    setTimeout(() => {
        const { jsPDF } = window.jspdf;
        
        html2canvas(element, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#F5F7FA'
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            // Format A3 PDF report size
            const pdf = new jsPDF('p', 'mm', 'a3');
            const imgWidth = 297; // A3 width: 297mm (A3 is 297x420)
            const pageHeight = 420;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Generate multi-page if contents overflow
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            pdf.save(`BaoCao_TechSupport_${dateStr}.pdf`);
            
            // Restore controls layout
            if (filterCard) filterCard.style.display = 'block';
            if (exportBtns) exportBtns.style.visibility = 'visible';
            if (pagination) pagination.style.visibility = 'visible';
            hideOverlay();
            showToast('success', 'Báo cáo PDF đã được xuất thành công!');
        }).catch(err => {
            console.error(err);
            if (filterCard) filterCard.style.display = 'block';
            if (exportBtns) exportBtns.style.visibility = 'visible';
            if (pagination) pagination.style.visibility = 'visible';
            hideOverlay();
            showToast('error', 'Có lỗi xảy ra khi tạo báo cáo PDF.');
        });
    }, 400);
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
        error:   '<i class="fa-solid fa-circle-xmark"></i>',
        info:    '<i class="fa-solid fa-circle-info"></i>'
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
   INIT
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
    loadData();
    initDom();
    applyFilters();
    
    // Live filter updates
    const filterFrom = document.getElementById('reportFromDate');
    const filterTo = document.getElementById('reportToDate');
    const filterStaf = document.getElementById('reportStaff');
    const filterStat = document.getElementById('reportStatus');
    const filterServ = document.getElementById('reportService');
    
    if (filterFrom) filterFrom.addEventListener('change', applyFilters);
    if (filterTo) filterTo.addEventListener('change', applyFilters);
    if (filterStaf) filterStaf.addEventListener('change', applyFilters);
    if (filterStat) filterStat.addEventListener('change', applyFilters);
    if (filterServ) filterServ.addEventListener('change', applyFilters);
});
