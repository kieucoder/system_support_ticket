/**
 * =============================================================
 * FILE: assets/js/staff/manager-calendar.js
 * AUTHOR: Antigravity
 * DESCRIPTION: Frontend logic for TechSupport staff Manager Calendar.
 *              Includes: Dynamic Clock, Tabs Switcher, Filter Engine,
 *              Calendar Grid block positioning, and Modal actions.
 * =============================================================
 */

(function () {
    'use strict';

    // 1. MOCK DATABASE (Initial state of Appointments)
    let appointments = [
        {
            id: 1,
            code: "LH-000001",
            ticketId: "PHT000001",
            title: "Mất kết nối và chập chờn Internet cáp quang",
            customerName: "Trần Vũ Diễm My",
            customerPhone: "0866832142",
            customerEmail: "diemmy@gmail.com",
            serviceCategory: "Internet Cáp Quang",
            serviceDetail: "Lắp đặt Internet",
            assignedStaff: "Hồ Nhựt Trường",
            address: "210 Đường Trần Phú, Cái Khế, Ninh Kiều, Cần Thơ",
            date: "2026-07-16",
            startTime: "08:30",
            endTime: "10:30",
            status: "pending", // pending, confirmed, ongoing, completed, cancelled
            note: "Khách hàng báo mạng liên tục gián đoạn, cần đo suy hao OLT và thay đầu nối quang.",
            files: [
                { name: "lap_internet.png", url: "#" }
            ]
        },
        {
            id: 2,
            code: "LH-000002",
            ticketId: "PHT000002",
            title: "Lỗi camera giám sát không lưu trữ lịch sử",
            customerName: "Nguyễn Văn Hùng",
            customerPhone: "0912345678",
            customerEmail: "hungnv@gmail.com",
            serviceCategory: "Camera Giám Sát",
            serviceDetail: "Bảo hành Camera",
            assignedStaff: "Lê Minh Triết",
            address: "Tòa nhà Viettel Cần Thơ, Hưng Lợi, Ninh Kiều",
            date: "2026-07-16",
            startTime: "10:00",
            endTime: "11:30",
            status: "confirmed",
            note: "Camera báo lỗi ổ cứng thẻ nhớ, KTV đem theo ổ cứng 64GB dự phòng.",
            files: []
        },
        {
            id: 3,
            code: "LH-000003",
            ticketId: "PHT000003",
            title: "Cấu hình WiFi phụ cho văn phòng tầng 2",
            customerName: "Công ty TNHH Minh Nhật",
            customerPhone: "02923888999",
            customerEmail: "contact@minhnhat.vn",
            serviceCategory: "WiFi Doanh Nghiệp",
            serviceDetail: "Lắp đặt WiFi phụ",
            assignedStaff: "Phạm Hồng Sơn",
            address: "88 Lý Tự Trọng, An Cư, Ninh Kiều, Cần Thơ",
            date: "2026-07-16",
            startTime: "13:30",
            endTime: "15:00",
            status: "ongoing",
            note: "Lắp đặt thêm 1 Router phụ Aruba Access Point do Viettel cung cấp.",
            files: [
                { name: "yeucau_vanphong.pdf", url: "#" }
            ]
        },
        {
            id: 4,
            code: "LH-000004",
            ticketId: "PHT000004",
            title: "Hỗ trợ cài đặt truyền hình số Viettel TV",
            customerName: "Lê Thu Hà",
            customerPhone: "0983334445",
            customerEmail: "halethu@gmail.com",
            serviceCategory: "Truyền Hình Số",
            serviceDetail: "Cài đặt ứng dụng TV",
            assignedStaff: "Hồ Nhựt Trường",
            address: "Phường Định Công, Quận Hoàng Mai, Hà Nội",
            date: "2026-07-16",
            startTime: "15:30",
            endTime: "17:00",
            status: "completed",
            note: "Đã cài đặt app Viettel TV trên SmartTV Sony và bàn giao tài khoản vip.",
            files: []
        },
        {
            id: 5,
            code: "LH-000005",
            ticketId: "PHT000005",
            title: "Mạng LAN nội bộ chập chờn không nhận IP",
            customerName: "Bùi Quốc Anh",
            customerPhone: "0988776655",
            customerEmail: "quocanh@gmail.com",
            serviceCategory: "Internet Cáp Quang",
            serviceDetail: "Sửa cáp LAN",
            assignedStaff: "Nguyễn Văn Đạt",
            address: "Số 112 Chùa Bộc, Đống Đa, Hà Nội",
            date: "2026-07-16",
            startTime: "14:00",
            endTime: "16:00",
            status: "cancelled",
            note: "Khách hàng báo hủy lịch do tự xử lý cắm lại đầu switch.",
            files: []
        },
        {
            id: 6,
            code: "LH-000006",
            ticketId: "PHT000006",
            title: "Bảo trì định kỳ WiFi Mesh căn hộ",
            customerName: "Vũ Minh Quân",
            customerPhone: "0981112223",
            customerEmail: "quanvm@gmail.com",
            serviceCategory: "Internet Cáp Quang",
            serviceDetail: "Bảo trì Wifi Mesh",
            assignedStaff: "Lê Minh Triết",
            assignedStaff: "Lê Minh Triết",
            address: "Chung cư Xuân Khánh, Cần Thơ",
            date: "2026-07-17",
            startTime: "09:00",
            endTime: "10:30",
            status: "confirmed",
            note: "Đo sóng WiFi từng phòng và tối ưu kênh phát tránh nhiễu.",
            files: []
        }
    ];

    // Global variables for active page state
    let activeTab = "list"; // list, calendar
    let activeAppointmentId = null;
    let calendarDate = new Date(); // default to today
    let bootstrapTooltips = [];

    // 2. DOM CONTENT LOADED INITIALIZATION
    document.addEventListener("DOMContentLoaded", function () {
        initClock();
        initTooltips();
        renderKPIs();
        renderTableList();
        renderCalendarGrid();
        bindEvents();
    });

    // Clock display (Header)
    function initClock() {
        const clockEl = document.getElementById("currentTimeClock");
        if (!clockEl) return;

        function updateTime() {
            const now = new Date();
            const dateStr = now.toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });
            const timeStr = now.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
            clockEl.innerHTML = `<i class="bi bi-clock-fill text-primary me-2"></i><strong>${timeStr}</strong> &nbsp;|&nbsp; ${dateStr}`;
        }
        updateTime();
        setInterval(updateTime, 1000);
    }

    // Initialize Bootstrap tooltips
    function initTooltips() {
        // Destroy existing tooltips first
        bootstrapTooltips.forEach(t => t.dispose());
        bootstrapTooltips = [];

        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        bootstrapTooltips = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    // Calculate and render KPI Cards
    function renderKPIs() {
        const total = appointments.length;
        const today = appointments.filter(a => a.date === "2026-07-16").length;
        const pending = appointments.filter(a => a.status === "pending").length;
        const confirmed = appointments.filter(a => a.status === "confirmed").length;
        const ongoing = appointments.filter(a => a.status === "ongoing").length;
        const completed = appointments.filter(a => a.status === "completed").length;

        const kpis = {
            "kpiTotal": total,
            "kpiToday": today,
            "kpiPending": pending,
            "kpiConfirmed": confirmed,
            "kpiOngoing": ongoing,
            "kpiCompleted": completed
        };

        for (const [id, val] of Object.entries(kpis)) {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = val;
            }
        }
    }

    // Bind event handlers
    function bindEvents() {
        // 1. Tab switches
        const tabListBtn = document.getElementById("tabListBtn");
        const tabCalBtn = document.getElementById("tabCalBtn");

        if (tabListBtn && tabCalBtn) {
            tabListBtn.addEventListener("click", function () {
                activeTab = "list";
                tabListBtn.classList.add("active");
                tabCalBtn.classList.remove("active");
                document.getElementById("listViewWrapper").style.display = "block";
                document.getElementById("calendarViewWrapper").style.display = "none";
                renderTableList();
            });

            tabCalBtn.addEventListener("click", function () {
                activeTab = "calendar";
                tabCalBtn.classList.add("active");
                tabListBtn.classList.remove("active");
                document.getElementById("listViewWrapper").style.display = "none";
                document.getElementById("calendarViewWrapper").style.display = "block";
                renderCalendarGrid();
            });
        }

        // 2. Search & Filter submit
        const searchForm = document.getElementById("mcFilterForm");
        if (searchForm) {
            searchForm.addEventListener("submit", function (e) {
                e.preventDefault();
                if (activeTab === "list") {
                    renderTableList();
                } else {
                    renderCalendarGrid();
                }
            });

            const resetBtn = searchForm.querySelector(".btn-search-reset");
            if (resetBtn) {
                resetBtn.addEventListener("click", function () {
                    searchForm.reset();
                    if (activeTab === "list") {
                        renderTableList();
                    } else {
                        renderCalendarGrid();
                    }
                });
            }
        }

        // 3. Calendar Day/Week/Month selector mock triggers
        document.querySelectorAll(".cal-view-selector").forEach(item => {
            item.addEventListener("click", function (e) {
                e.preventDefault();
                document.getElementById("calViewModeDropdown").textContent = this.textContent;
                Swal.fire({
                    title: "Chế độ xem",
                    text: `Đã đổi sang chế độ xem: ${this.textContent} (Giao diện mẫu)`,
                    icon: "info",
                    confirmButtonColor: "#D71920",
                    timer: 2000
                });
            });
        });

        // 4. Calendar Navigation buttons
        const prevBtn = document.getElementById("calPrevBtn");
        const nextBtn = document.getElementById("calNextBtn");
        const todayBtn = document.getElementById("calTodayBtn");

        if (prevBtn && nextBtn && todayBtn) {
            prevBtn.addEventListener("click", function () {
                calendarDate.setMonth(calendarDate.getMonth() - 1);
                updateCalendarHeader();
                renderCalendarGrid();
            });

            nextBtn.addEventListener("click", function () {
                calendarDate.setMonth(calendarDate.getMonth() + 1);
                updateCalendarHeader();
                renderCalendarGrid();
            });

            todayBtn.addEventListener("click", function () {
                calendarDate = new Date();
                updateCalendarHeader();
                renderCalendarGrid();
            });
        }

        // 5. Postpone Modal Save
        const savePostponeBtn = document.getElementById("btnSavePostpone");
        if (savePostponeBtn) {
            savePostponeBtn.addEventListener("click", function () {
                const date = document.getElementById("postponeDate").value;
                const start = document.getElementById("postponeStart").value;
                const end = document.getElementById("postponeEnd").value;
                const reason = document.getElementById("postponeReason").value;

                if (!date || !start || !end || !reason) {
                    Swal.fire("Lỗi", "Vui lòng nhập đầy đủ thông tin hoãn lịch hẹn!", "error");
                    return;
                }

                const appt = appointments.find(a => a.id === activeAppointmentId);
                if (appt) {
                    appt.date = date;
                    appt.startTime = start;
                    appt.endTime = end;
                    appt.note += `\n[Lịch sử: Hoãn hẹn ngày ${date} từ ${start} đến ${end}. Lý do: ${reason}]`;
                    
                    // Close Modal
                    bootstrap.Modal.getInstance(document.getElementById("postponeModal")).hide();
                    
                    Swal.fire({
                        title: "Thành công!",
                        text: `Lịch hẹn ${appt.code} đã được hoãn sang ngày ${date} (${start} - ${end}).`,
                        icon: "success",
                        confirmButtonColor: "#D71920"
                    });
                    
                    renderKPIs();
                    if (activeTab === "list") renderTableList();
                    else renderCalendarGrid();
                }
            });
        }

        // 6. Cancel Modal Save
        const saveCancelBtn = document.getElementById("btnSaveCancel");
        if (saveCancelBtn) {
            saveCancelBtn.addEventListener("click", function () {
                const reason = document.getElementById("cancelReason").value;
                if (!reason) {
                    Swal.fire("Lỗi", "Vui lòng nhập lý do hủy lịch hẹn!", "error");
                    return;
                }

                const appt = appointments.find(a => a.id === activeAppointmentId);
                if (appt) {
                    appt.status = "cancelled";
                    appt.note += `\n[HỦY HẸN. Lý do: ${reason}]`;

                    // Close Modal
                    bootstrap.Modal.getInstance(document.getElementById("cancelModal")).hide();

                    Swal.fire({
                        title: "Đã hủy lịch hẹn!",
                        text: `Lịch hẹn ${appt.code} đã được chuyển sang trạng thái HỦY.`,
                        icon: "warning",
                        confirmButtonColor: "#D71920"
                    });

                    renderKPIs();
                    if (activeTab === "list") renderTableList();
                    else renderCalendarGrid();
                }
            });
        }
    }

    function updateCalendarHeader() {
        const label = document.getElementById("calDateTitle");
        if (label) {
            const options = { month: "long", year: "numeric" };
            label.textContent = calendarDate.toLocaleDateString("vi-VN", options).toUpperCase();
        }
    }

    // 3. FILTER LOGIC
    function getFilteredAppointments() {
        const searchInput = document.getElementById("searchKeyword").value.toLowerCase().trim();
        const filterPeriod = document.getElementById("filterPeriod").value;
        const filterStatus = document.getElementById("filterStatus").value;
        const filterService = document.getElementById("filterService").value;

        return appointments.filter(appt => {
            // Text keyword match (Code, customer, phone)
            const matchKeyword = !searchInput || 
                appt.ticketId.toLowerCase().includes(searchInput) ||
                appt.code.toLowerCase().includes(searchInput) ||
                appt.customerName.toLowerCase().includes(searchInput) ||
                appt.customerPhone.toLowerCase().includes(searchInput);

            // Status match
            const matchStatus = !filterStatus || appt.status === filterStatus;

            // Service match
            const matchService = !filterService || appt.serviceCategory === filterService;

            // Date Period match (Today = 2026-07-16, Week/Month simulated)
            let matchPeriod = true;
            if (filterPeriod === "today") {
                matchPeriod = appt.date === "2026-07-16";
            } else if (filterPeriod === "week") {
                // mock matching everything between 13th-20th of July
                const dateNum = parseInt(appt.date.split("-")[2], 10);
                matchPeriod = dateNum >= 13 && dateNum <= 20;
            } else if (filterPeriod === "month") {
                matchPeriod = appt.date.startsWith("2026-07");
            }

            return matchKeyword && matchStatus && matchService && matchPeriod;
        });
    }

    // 4. RENDER LIST MODE (TABLE)
    function renderTableList() {
        const tableBody = document.getElementById("mcTableBody");
        if (!tableBody) return;

        const filtered = getFilteredAppointments();
        tableBody.innerHTML = "";

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center py-5 text-muted">
                        <i class="bi bi-calendar-x fs-1 d-block mb-3 opacity-50"></i>
                        Không tìm thấy lịch hẹn nào phù hợp với bộ lọc.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach((appt, idx) => {
            const tr = document.createElement("tr");
            tr.className = "reveal";
            
            // Status badge mappings
            let badgeClass = "badge-mc status-pending";
            let badgeText = "Chờ xác nhận";
            let statusIcon = "bi-hourglass-split";

            if (appt.status === "confirmed") {
                badgeClass = "badge-mc status-confirmed";
                badgeText = "Đã xác nhận";
                statusIcon = "bi-check-circle";
            } else if (appt.status === "ongoing") {
                badgeClass = "badge-mc status-ongoing";
                badgeText = "Đang thực hiện";
                statusIcon = "bi-arrow-repeat";
            } else if (appt.status === "completed") {
                badgeClass = "badge-mc status-completed";
                badgeText = "Hoàn thành";
                statusIcon = "bi-check-all";
            } else if (appt.status === "cancelled") {
                badgeClass = "badge-mc status-cancelled";
                badgeText = "Đã hủy";
                statusIcon = "bi-x-circle";
            }

            // Action buttons configuration based on state
            let actionBtns = `
                <button class="action-btn-circle btn-view" onclick="window.mcActions.viewDetails(${appt.id})" data-bs-toggle="tooltip" title="Xem chi tiết">
                    <i class="bi bi-eye"></i>
                </button>
            `;

            if (appt.status === "pending") {
                actionBtns += `
                    <button class="action-btn-circle btn-confirm" onclick="window.mcActions.changeStatus(${appt.id}, 'confirmed')" data-bs-toggle="tooltip" title="Xác nhận lịch hẹn">
                        <i class="bi bi-calendar2-check"></i>
                    </button>
                `;
            }

            if (appt.status === "confirmed") {
                actionBtns += `
                    <button class="action-btn-circle btn-start" onclick="window.mcActions.changeStatus(${appt.id}, 'ongoing')" data-bs-toggle="tooltip" title="Bắt đầu hỗ trợ">
                        <i class="bi bi-play-fill"></i>
                    </button>
                `;
            }

            if (appt.status === "ongoing") {
                actionBtns += `
                    <button class="action-btn-circle btn-complete" onclick="window.mcActions.changeStatus(${appt.id}, 'completed')" data-bs-toggle="tooltip" title="Hoàn thành lịch hẹn">
                        <i class="bi bi-check-circle-fill"></i>
                    </button>
                `;
            }

            if (appt.status !== "completed" && appt.status !== "cancelled") {
                actionBtns += `
                    <button class="action-btn-circle btn-postpone" onclick="window.mcActions.openPostponeModal(${appt.id})" data-bs-toggle="tooltip" title="Hoãn lịch">
                        <i class="bi bi-clock"></i>
                    </button>
                    <button class="action-btn-circle btn-cancel" onclick="window.mcActions.openCancelModal(${appt.id})" data-bs-toggle="tooltip" title="Hủy lịch">
                        <i class="bi bi-x-circle"></i>
                    </button>
                `;
            }

            // Beautiful dates mapping
            const formattedDate = new Date(appt.date).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });

            tr.innerHTML = `
                <td class="text-center font-bold text-muted">${idx + 1}</td>
                <td><strong class="text-dark">${appt.code}</strong></td>
                <td><span class="text-danger fw-bold">${appt.ticketId}</span></td>
                <td><strong>${appt.customerName}</strong></td>
                <td>${appt.customerPhone}</td>
                <td><span class="badge bg-light text-dark border">${appt.serviceCategory}</span></td>
                <td><strong>${formattedDate}</strong></td>
                <td><span class="text-primary fw-semibold"><i class="bi bi-clock me-1"></i>${appt.startTime} - ${appt.endTime}</span></td>
                <td><span class="d-inline-block text-truncate" style="max-width: 150px;" title="${appt.address}">${appt.address}</span></td>
                <td>
                    <span class="${badgeClass}">
                        <i class="bi ${statusIcon}"></i> ${badgeText}
                    </span>
                </td>
                <td class="text-center">${actionBtns}</td>
            `;

            tableBody.appendChild(tr);
        });

        initTooltips();
    }

    // 5. RENDER CALENDAR GRID
    function renderCalendarGrid() {
        const gridCells = document.getElementById("calendarGridCells");
        if (!gridCells) return;

        // Clear existing events inside calendar container
        const events = gridCells.querySelectorAll(".calendar-event-block");
        events.forEach(e => e.remove());

        // Get appointments matching filters and current viewed day
        const filtered = getFilteredAppointments();
        
        // Render current calendar events
        filtered.forEach(appt => {
            // Format start and end hours to compute offsets
            const startParts = appt.startTime.split(":");
            const endParts = appt.endTime.split(":");
            
            const startH = parseFloat(startParts[0]) + parseFloat(startParts[1]) / 60;
            const endH = parseFloat(endParts[0]) + parseFloat(endParts[1]) / 60;
            
            // Limit bounds to scheduler axis (07:00 to 18:00)
            if (startH < 7 || startH > 18) return;

            const relativeStart = startH - 7; // relative index from 7 AM
            const duration = endH - startH;

            // Height and Top values (70px per hour cell)
            const topOffset = relativeStart * 70;
            const blockHeight = duration * 70;

            const eventBlock = document.createElement("div");
            
            let statusClass = "event-pending";
            if (appt.status === "confirmed") statusClass = "event-confirmed";
            else if (appt.status === "ongoing") statusClass = "event-ongoing";
            else if (appt.status === "completed") statusClass = "event-completed";
            else if (appt.status === "cancelled") statusClass = "event-cancelled";

            eventBlock.className = `calendar-event-block ${statusClass} mc-fade-in`;
            eventBlock.style.top = `${topOffset + 4}px`; // slightly padded
            eventBlock.style.height = `${blockHeight - 8}px`; // slightly padded
            
            eventBlock.innerHTML = `
                <div class="evt-block-title">${appt.code} - ${appt.customerName}</div>
                <div class="evt-block-time">
                    <i class="bi bi-clock me-1"></i>${appt.startTime} - ${appt.endTime} | <span class="fw-bold">${appt.serviceDetail}</span>
                </div>
            `;

            eventBlock.addEventListener("click", function () {
                window.mcActions.viewDetails(appt.id);
            });

            gridCells.appendChild(eventBlock);
        });
    }

    // 6. EXPOSE GLOBAL ACTIONS
    window.mcActions = {
        // View Details Modal
        viewDetails: function (id) {
            const appt = appointments.find(a => a.id === id);
            if (!appt) return;

            activeAppointmentId = id;

            // Set content details inside HTML Modal
            document.getElementById("mdlTicketCode").textContent = appt.ticketId;
            document.getElementById("mdlApptCode").textContent = appt.code;
            document.getElementById("mdlTitle").textContent = appt.title;
            document.getElementById("mdlCustomer").textContent = appt.customerName;
            document.getElementById("mdlPhone").textContent = appt.customerPhone;
            document.getElementById("mdlEmail").textContent = appt.customerEmail;
            document.getElementById("mdlCategory").textContent = appt.serviceCategory;
            document.getElementById("mdlService").textContent = appt.serviceDetail;
            document.getElementById("mdlStaff").textContent = appt.assignedStaff;
            document.getElementById("mdlAddress").textContent = appt.address;
            
            const formattedDate = new Date(appt.date).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });
            document.getElementById("mdlDate").textContent = formattedDate;
            document.getElementById("mdlStart").textContent = appt.startTime;
            document.getElementById("mdlEnd").textContent = appt.endTime;
            document.getElementById("mdlNote").textContent = appt.note || "Không có ghi chú";

            // Status styling
            const statusBadge = document.getElementById("mdlStatusBadge");
            let badgeClass = "badge-mc status-pending";
            let badgeText = "Chờ xác nhận";
            if (appt.status === "confirmed") { badgeClass = "badge-mc status-confirmed"; badgeText = "Đã xác nhận"; }
            else if (appt.status === "ongoing") { badgeClass = "badge-mc status-ongoing"; badgeText = "Đang thực hiện"; }
            else if (appt.status === "completed") { badgeClass = "badge-mc status-completed"; badgeText = "Hoàn thành"; }
            else if (appt.status === "cancelled") { badgeClass = "badge-mc status-cancelled"; badgeText = "Đã hủy"; }
            statusBadge.className = badgeClass;
            statusBadge.innerHTML = `<i class="bi bi-info-circle me-1"></i>${badgeText}`;

            // Render files list
            const filesWrapper = document.getElementById("mdlFilesWrapper");
            filesWrapper.innerHTML = "";
            if (appt.files && appt.files.length > 0) {
                appt.files.forEach(file => {
                    filesWrapper.innerHTML += `
                        <div class="col-md-6 col-12">
                            <div class="mc-file-item">
                                <div class="d-flex align-items-center gap-2">
                                    <i class="bi bi-file-earmark-image text-danger fs-5"></i>
                                    <div>
                                        <span class="d-block text-truncate fw-semibold text-dark" style="max-width: 150px;">${file.name}</span>
                                        <small class="text-muted" style="font-size: 0.72rem;">File đính kèm</small>
                                    </div>
                                </div>
                                <a href="${file.url}" class="mc-file-dl-link" title="Tải xuống"><i class="bi bi-download"></i></a>
                            </div>
                        </div>
                    `;
                });
            } else {
                filesWrapper.innerHTML = `<div class="col-12 text-muted" style="font-size:0.85rem;"><i class="bi bi-folder-symlink me-1"></i>Không có tài liệu đính kèm.</div>`;
            }

            // Open Detail Modal
            const myModal = new bootstrap.Modal(document.getElementById("apptDetailModal"));
            myModal.show();
        },

        // Status update actions
        changeStatus: function (id, status) {
            const appt = appointments.find(a => a.id === id);
            if (!appt) return;

            let actionText = "xác nhận lịch hẹn";
            let alertMsg = "Lịch hẹn đã được xác nhận thành công.";
            if (status === "ongoing") { actionText = "bắt đầu thực hiện hỗ trợ"; alertMsg = "Lịch hẹn đã bắt đầu thực hiện."; }
            else if (status === "completed") { actionText = "hoàn thành lịch hẹn kỹ thuật"; alertMsg = "Lịch hẹn đã được hoàn thành."; }

            Swal.fire({
                title: "Bạn có chắc chắn?",
                text: `Bạn muốn chuyển trạng thái lịch hẹn này sang '${status}'?`,
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#D71920",
                cancelButtonColor: "#6B7280",
                confirmButtonText: "Đồng ý",
                cancelButtonText: "Hủy"
            }).then((result) => {
                if (result.isConfirmed) {
                    appt.status = status;
                    renderKPIs();
                    if (activeTab === "list") renderTableList();
                    else renderCalendarGrid();

                    Swal.fire({
                        title: "Thành công!",
                        text: alertMsg,
                        icon: "success",
                        confirmButtonColor: "#D71920"
                    });
                }
            });
        },

        // Reschedule/Postpone Modal
        openPostponeModal: function (id) {
            const appt = appointments.find(a => a.id === id);
            if (!appt) return;

            activeAppointmentId = id;

            // Load existing schedule into forms
            document.getElementById("postponeDate").value = appt.date;
            document.getElementById("postponeStart").value = appt.startTime;
            document.getElementById("postponeEnd").value = appt.endTime;
            document.getElementById("postponeReason").value = "";

            const postponeModal = new bootstrap.Modal(document.getElementById("postponeModal"));
            postponeModal.show();
        },

        // Cancel Appointment Modal
        openCancelModal: function (id) {
            const appt = appointments.find(a => a.id === id);
            if (!appt) return;

            activeAppointmentId = id;
            document.getElementById("cancelReason").value = "";

            const cancelModal = new bootstrap.Modal(document.getElementById("cancelModal"));
            cancelModal.show();
        },

        // View ticket full detail mock navigation alert
        goToTicketDetail: function () {
            const appt = appointments.find(a => a.id === activeAppointmentId);
            if (appt) {
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById("apptDetailModal")).hide();
                
                Swal.fire({
                    title: "Chuyển trang",
                    text: `Mở xem chi tiết phiếu hỗ trợ ${appt.ticketId} (Giao diện mockup)`,
                    icon: "info",
                    confirmButtonColor: "#D71920"
                });
            }
        }
    };

})();
