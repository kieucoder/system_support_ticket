/**
 * staff-ticket-management.js - Quản lý phiếu hỗ trợ kỹ thuật
 * Dữ liệu lấy từ SQL Server qua ASP.NET Core MVC
 */

'use strict';

// =============================================================
// STATE TOÀN CỤC
// =============================================================
let currentPage = 1;
let pageSize = 10;
let currentSortColumn = 'createdDate';
let currentSortDirection = 'desc';

let statusChart = null;
let monthlyChart = null;
let serviceChart = null;

let viewModal = null;
let addModal = null;
let editModal = null;

// =============================================================
// KHỞI TẠO TRANG
// =============================================================
document.addEventListener('DOMContentLoaded', function () {
    // Khởi tạo các modal
    initModals();

    // Gán sự kiện
    bindEvents();

    // Khởi tạo biểu đồ
    initCharts();
});

// =============================================================
// KHỞI TẠO MODAL
// =============================================================
function initModals() {
    const viewEl = document.getElementById('viewDetailsModal');
    const addEl = document.getElementById('addTicketModal');
    const editEl = document.getElementById('editTicketModal');

    if (viewEl) viewModal = new bootstrap.Modal(viewEl);
    if (addEl) addModal = new bootstrap.Modal(addEl);
    if (editEl) editModal = new bootstrap.Modal(editEl);
}

// =============================================================
// BIND EVENTS
// =============================================================
function bindEvents() {
    // Nút lọc - AJAX call to GetDanhSachPhieu
    document.getElementById('btnApplyFilters')?.addEventListener('click', function () {
        currentPage = 1;
        loadTickets();
        showToast('success', 'Đã cập nhật danh sách phiếu lọc.');
    });

    document.getElementById('btnResetFilters')?.addEventListener('click', function () {
        resetFilters();
        currentPage = 1;
        loadTickets();
        showToast('info', 'Đã đặt lại các bộ lọc.');
    });

    // Tìm kiếm trực tiếp - debounced AJAX
    const searchInput = document.getElementById('searchQuery');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentPage = 1;
            loadTickets();
        }, 300));
    }

    // Chọn số dòng mỗi trang
    document.getElementById('pageSizeSelect')?.addEventListener('change', function () {
        pageSize = parseInt(this.value, 10);
        currentPage = 1;
        loadTickets();
    });

    // Sắp xếp - AJAX call
    document.querySelectorAll('.sortable[data-sort]').forEach(th => {
        th.addEventListener('click', function () {
            const column = this.dataset.sort;
            if (currentSortColumn === column) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = column;
                currentSortDirection = 'asc';
            }
            document.querySelectorAll('.sortable').forEach(el => el.classList.remove('asc', 'desc'));
            this.classList.add(currentSortDirection);
            loadTickets();
        });
    });

    // Theme toggle
    document.getElementById('toggleTheme')?.addEventListener('click', function () {
        setTimeout(() => {
            const theme = document.documentElement.getAttribute('data-bs-theme') || 'light';
            updateChartThemes(theme);
        }, 100);
    });
}

// =============================================================
// AJAX LOAD TICKETS
// =============================================================
function loadTickets() {
    const keyword = document.getElementById('searchQuery')?.value.trim() || '';
    const status = document.getElementById('filterStatus')?.value || 'all';
    const priority = document.getElementById('filterPriority')?.value || 'all';
    const service = document.getElementById('filterService')?.value || 'all';
    const staff = document.getElementById('filterStaff')?.value || 'all';
    const sort = currentSortColumn === 'createdDate' && currentSortDirection === 'desc' ? 'newest' : 
                 currentSortColumn === 'createdDate' && currentSortDirection === 'asc' ? 'oldest' :
                 currentSortColumn === 'title' && currentSortDirection === 'asc' ? 'az' :
                 currentSortColumn === 'title' && currentSortDirection === 'desc' ? 'za' : 'newest';

    const url = `/Staff/GetDanhSachPhieu?keyword=${encodeURIComponent(keyword)}&status=${status}&priority=${priority}&service=${service}&staff=${staff}&sort=${sort}&page=${currentPage}&pageSize=${pageSize}`;

    fetch(url)
        .then(response => response.text())
        .then(html => {
            document.getElementById('ticketTableContainer').innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading tickets:', error);
            showToast('error', 'Không thể tải danh sách phiếu.');
        });
}

function resetFilters() {
    document.getElementById('searchQuery').value = '';
    document.getElementById('filterStatus').value = 'all';
    document.getElementById('filterPriority').value = 'all';
    document.getElementById('filterService').value = 'all';
    document.getElementById('filterStaff').value = 'all';
    document.getElementById('filterFromDate').value = '';
    document.getElementById('filterToDate').value = '';
    currentPage = 1;
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =============================================================
// CHART.JS
// =============================================================
function initCharts() {
    const theme = document.documentElement.getAttribute('data-bs-theme') || 'light';
    const isDark = theme === 'dark';
    const labelColor = isDark ? '#94A3B8' : '#6B7280';
    const gridColor = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(229,231,235,0.6)';

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
                    x: { grid: { display: false }, ticks: { color: labelColor, font: { size: 10 } } },
                    y: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 } }, beginAtZero: true }
                }
            }
        });
    }

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
                    x: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 } }, beginAtZero: true },
                    y: { grid: { display: false }, ticks: { color: labelColor, font: { size: 10 } } }
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
    const gridColor = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(229,231,235,0.6)';

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
    // Get chart data from ViewBag (rendered as window object in Razor)
    const statusChartData = window.statusChartData || { waiting: 0, processing: 0, completed: 0, cancelled: 0 };

    return {
        labels: ['Chờ tiếp nhận', 'Đang xử lý', 'Hoàn thành', 'Đã hủy'],
        datasets: [{
            data: [statusChartData.waiting, statusChartData.processing, statusChartData.completed, statusChartData.cancelled],
            backgroundColor: ['#6B7280', '#2563EB', '#059669', '#DC2626'],
            borderWidth: 1
        }]
    };
}

function getMonthlyChartData() {
    // TODO: Implement with ViewBag data from Controller
    return {
        labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
        datasets: [{
            label: 'Số phiếu',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(238, 0, 51, 0.85)',
            hoverBackgroundColor: '#EE0033',
            borderRadius: 6
        }]
    };
}

function getServiceChartData() {
    // TODO: Implement with ViewBag data from Controller
    return {
        labels: ['Dịch vụ 1', 'Dịch vụ 2', 'Dịch vụ 3'],
        datasets: [{
            label: 'Yêu cầu',
            data: [0, 0, 0],
            backgroundColor: 'rgba(59, 130, 246, 0.85)',
            hoverBackgroundColor: '#2563EB',
            borderRadius: 4
        }]
    };
}

// =============================================================
// VIEW TICKET DETAIL
// =============================================================
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
    setText('detPriority', getPriorityBadge(ticket.priority), true);
    setText('detStatus', getStatusBadge(ticket.status), true);
    setText('detCreatedDate', ticket.createdDate || '—');
    setText('detUpdatedDate', ticket.updatedDate || '—');
    setText('detStaff', staffName);
    setText('detDesc', ticket.description || 'Không có mô tả chi tiết.');

    renderTicketTimeline(ticketCode);
    viewModal.show();
};

function renderTicketTimeline(ticketCode) {
    const container = document.getElementById('timelineContainer');
    if (!container) return;

    const logs = historyLogs.filter(log => log.ticketCode === ticketCode)
        .sort((a, b) => parseDateTimeString(b.timestamp) - parseDateTimeString(a.timestamp));

    if (!logs.length) {
        container.innerHTML = `<p class="text-center text-muted fs-8 py-3">Không có lịch sử cập nhật.</p>`;
        return;
    }

    container.innerHTML = logs.map(l => {
        return `
            <div class="timeline-item">
                <div class="timeline-marker ${l.newStatus || 'waiting'}"></div>
                <div class="timeline-content">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="timeline-user"><i class="fa-solid fa-user-circle me-1"></i>${esc(l.staffName)}</span>
                        <span class="timeline-time"><i class="fa-solid fa-clock me-1"></i>${esc(l.timestamp)}</span>
                    </div>
                    <div class="small">
                        Trạng thái: ${l.oldStatus ? getStatusBadge(l.oldStatus) : 'Mới tạo'} 
                        <i class="fa-solid fa-arrow-right mx-1 text-muted"></i> 
                        ${getStatusBadge(l.newStatus)}
                    </div>
                    <p class="timeline-note mb-0">${esc(l.notes)}</p>
                </div>
            </div>
        `;
    }).join('');
}

window.viewTicketHistoryLogs = function (ticketCode) {
    viewTicket(ticketCode);
    setTimeout(() => {
        const timelineCard = document.getElementById('timelineContainerCard');
        const modalBody = document.querySelector('#viewDetailsModal .modal-body');
        if (timelineCard && modalBody) {
            modalBody.scrollTo({ top: timelineCard.offsetTop, behavior: 'smooth' });
        }
    }, 250);
};

// =============================================================
// CRUD OPERATIONS
// =============================================================
async function handleCreateTicket() {
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

    const ticketData = {
        title,
        categoryId: 'internet', // Có thể lấy từ form nếu có
        serviceId,
        requestType,
        priority,
        status: 'waiting',
        description: content,
        customerName,
        customerPhone,
        needAppointment,
        staffId,
    };

    try {
        const newTicket = await ApiService.createTicket(ticketData);

        // Nếu cần lịch hẹn, tạo appointment
        if (needAppointment) {
            const serviceObj = services.find(s => s.id === serviceId);
            await ApiService.createAppointment({
                ticketCode: newTicket.ticketCode,
                customerName,
                serviceName: serviceObj ? serviceObj.name : 'Dịch vụ kỹ thuật',
                appointmentDate: '17/06/2026', // Lấy từ form nếu có
                appointmentTime: '09:00',
                status: 'waiting',
                notes: 'Đặt lịch khi tạo phiếu hỗ trợ'
            });
        }

        // Ghi lịch sử
        const profile = JSON.parse(localStorage.getItem('viettel_profile')) || { name: 'Admin Viettel' };
        await ApiService.addHistory({
            ticketCode: newTicket.ticketCode,
            staffName: profile.name,
            oldStatus: '',
            newStatus: 'waiting',
            notes: `Tạo mới phiếu hỗ trợ: "${title}". Phân công cho: ${staffId ? staffList.find(s => s.id === staffId).hoTen : 'Chưa phân công'}`
        });

        // Tải lại dữ liệu và cập nhật UI
        await loadDatabase();
        applyFilters();
        addModal.hide();
        document.getElementById('addTicketForm').reset();

        Swal.fire({
            title: 'Tạo phiếu thành công!',
            text: `Đã khởi tạo phiếu ${newTicket.ticketCode}.`,
            icon: 'success',
            confirmButtonColor: '#EE0033'
        });
    } catch (error) {
        console.error(error);
        showToast('error', 'Tạo phiếu thất bại: ' + error.message);
    }
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
    editModal.show();
};

async function handleUpdateTicket() {
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

    const oldStatus = ticket.status;
    const profile = JSON.parse(localStorage.getItem('viettel_profile')) || { name: 'Admin Viettel' };

    try {
        await ApiService.updateTicket(ticket.id, {
            title,
            serviceId,
            description: content,
            priority,
            staffId,
            status,
            needAppointment,
        });

        // Ghi lịch sử nếu có thay đổi trạng thái hoặc nhân viên
        if (oldStatus !== status || ticket.staffId !== staffId) {
            await ApiService.addHistory({
                ticketCode: editingTicketCode,
                staffName: profile.name,
                oldStatus: oldStatus,
                newStatus: status,
                notes: `Cập nhật phiếu. Trạng thái: ${oldStatus} -> ${status}. Phụ trách: ${staffId ? staffList.find(s => s.id === staffId).hoTen : 'Chưa phân công'}.`
            });
        }

        await loadDatabase();
        applyFilters();
        editModal.hide();

        Swal.fire({
            title: 'Cập nhật thành công!',
            text: `Phiếu ${editingTicketCode} đã được điều chỉnh.`,
            icon: 'success',
            confirmButtonColor: '#EE0033'
        });
    } catch (error) {
        console.error(error);
        showToast('error', 'Cập nhật thất bại: ' + error.message);
    }
}

// =============================================================
// QUICK UPDATE STATUS
// =============================================================
let _statusUpdateTicketCode = '';
let _statusUpdateModal = null;

window.quickUpdateStatus = function (ticketCode) {
    const ticket = tickets.find(t => t.ticketCode === ticketCode);
    if (!ticket) return;
    _statusUpdateTicketCode = ticketCode;

    document.getElementById('statusUpdateTicketCode').textContent = `Mã phiếu: ${ticketCode}`;
    document.getElementById('statusUpdateTicketTitle').textContent = ticket.title || '—';

    document.querySelectorAll('#statusCardGrid .su-status-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.status === ticket.status);
    });
    document.getElementById('statusUpdateNote').value = '';

    if (!_statusUpdateModal) {
        const el = document.getElementById('statusUpdateModal');
        if (el) _statusUpdateModal = new bootstrap.Modal(el);
    }
    _statusUpdateModal.show();
};

window.selectStatusCard = function (el) {
    document.querySelectorAll('#statusCardGrid .su-status-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
};

window.confirmStatusUpdate = async function () {
    const ticket = tickets.find(t => t.ticketCode === _statusUpdateTicketCode);
    if (!ticket) return;

    const selectedCard = document.querySelector('#statusCardGrid .su-status-card.selected');
    if (!selectedCard) {
        showToast('error', 'Vui lòng chọn một trạng thái!');
        return;
    }

    const newStatus = selectedCard.dataset.status;
    const oldStatus = ticket.status;
    const note = document.getElementById('statusUpdateNote')?.value.trim() || '';

    if (oldStatus === newStatus) {
        showToast('info', 'Trạng thái không thay đổi.');
        _statusUpdateModal.hide();
        return;
    }

    try {
        await ApiService.updateTicket(ticket.id, { status: newStatus });

        const profile = JSON.parse(localStorage.getItem('viettel_profile')) || { name: 'Admin Viettel' };
        await ApiService.addHistory({
            ticketCode: _statusUpdateTicketCode,
            staffName: profile.name,
            oldStatus,
            newStatus,
            notes: note || `Kỹ thuật viên cập nhật nhanh trạng thái.`
        });

        await loadDatabase();
        applyFilters();
        showToast('success', `Đã cập nhật trạng thái sang: ${getStatusText(newStatus)}`);
        _statusUpdateModal.hide();
    } catch (error) {
        console.error(error);
        showToast('error', 'Cập nhật trạng thái thất bại: ' + error.message);
    }
};

// =============================================================
// DELETE TICKET
// =============================================================
window.deleteTicket = function (ticketCode) {
    const ticket = tickets.find(t => t.ticketCode === ticketCode);
    if (!ticket) return;

    Swal.fire({
        title: 'Bạn có chắc chắn muốn xóa?',
        text: `Phiếu ${ticketCode} sẽ bị xóa vĩnh viễn!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EE0033',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Xác nhận xóa',
        cancelButtonText: 'Hủy'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await ApiService.deleteTicket(ticket.id);
                await loadDatabase();
                applyFilters();
                Swal.fire('Đã xóa!', 'Phiếu hỗ trợ đã được gỡ bỏ.', 'success');
            } catch (error) {
                console.error(error);
                showToast('error', 'Xóa phiếu thất bại: ' + error.message);
            }
        }
    });
};

// =============================================================
// EXPORT EXCEL
// =============================================================
function exportToExcel() {
    if (!filteredTickets.length) {
        showToast('error', 'Không có dữ liệu để xuất!');
        return;
    }

    let csv = 'STT,Ma phieu,Tieu de,Khach hang,So dien thoai,Dich vu,Nhan vien,Uu tien,Trang thai,Ngay tao,Ngay cap nhat\n';
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
        csv += row + '\n';
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DS_Phieu_Ho_Tro_${getCurrentDateStr()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('success', 'Đã xuất Excel thành công!');
}

// =============================================================
// UTILITY FUNCTIONS
// =============================================================
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
    const map = { processing: 'Đang xử lý', feedback: 'Chờ khách phản hồi', completed: 'Hoàn thành', cancelled: 'Đã hủy' };
    return map[status] || 'Chờ xử lý';
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

function getCurrentDateStr() {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}_${String(now.getMonth() + 1).padStart(2, '0')}_${now.getFullYear()}`;
}

function setText(id, value, isHtml = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (isHtml) el.innerHTML = value;
    else el.textContent = value;
}

function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function showToast(type, msg) {
    const icon = type === 'success' ? 'fa-circle-check text-success' :
        type === 'error' ? 'fa-triangle-exclamation text-danger' :
            'fa-circle-info text-info';

    let container = document.getElementById('vtToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'vtToastContainer';
        container.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:1090; display:flex; flex-direction:column; gap:10px;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'glass-panel p-3 d-flex align-items-center gap-3 animate__animated animate__fadeInUp';
    toast.style.cssText = `border-radius:12px; min-width:280px; box-shadow:0 10px 30px rgba(0,0,0,0.08); border-left:4px solid ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'}; transition:all 0.4s ease;`;
    toast.innerHTML = `<i class="fa-solid ${icon} fs-5"></i><div class="small fw-semibold">${msg}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}