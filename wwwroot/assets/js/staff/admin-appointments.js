(function() {
    'use strict';

    // 1. MOCK DATABASE
    const technicians = [
        { id: 1, name: "Nguyễn Văn A", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" },
        { id: 2, name: "Trần Thị B", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" },
        { id: 3, name: "Lê Văn C", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" }
    ];

    let appointments = [
        {
            id: 1,
            ticketId: "TS-2026-015",
            customer: { name: "Phạm Thị Mai", phone: "0987654321", address: "Số 12, Ngõ 34 Cầu Giấy, Hà Nội" },
            technicianId: 1,
            start: "2026-06-28T08:30:00",
            end: "2026-06-28T10:00:00",
            status: "waiting", // waiting, confirmed, on_the_way, in_progress, completed, cancelled
            note: "Khách hàng yêu cầu đo kiểm lại sóng wifi băng tần 5GHz Home Wifi.",
            createdAt: "2026-06-27T10:00:00"
        },
        {
            id: 2,
            ticketId: "TS-2026-016",
            customer: { name: "Trần Anh Tuấn", phone: "0966554433", address: "Số 45, Ngõ 12 Trần Duy Hưng, Hà Nội" },
            technicianId: 1,
            start: "2026-06-28T10:30:00",
            end: "2026-06-28T12:00:00",
            status: "confirmed",
            note: "Thay dây cáp mạng LAN nối từ modem chính đến đầu thu TV.",
            createdAt: "2026-06-27T11:00:00"
        },
        {
            id: 3,
            ticketId: "TS-2026-017",
            customer: { name: "Lê Minh Triết", phone: "0345678912", address: "Số 78 Đường Láng, Đống Đa, Hà Nội" },
            technicianId: 2,
            start: "2026-06-28T14:00:00",
            end: "2026-06-28T16:00:00",
            status: "on_the_way",
            note: "Xử lý đứt cáp quang thuê bao thuê bao ngoài ngõ.",
            createdAt: "2026-06-28T09:12:00"
        },
        {
            id: 4,
            ticketId: "TS-2026-018",
            customer: { name: "Nguyễn Thu Trang", phone: "0912345678", address: "Tòa nhà Keangnam, Mễ Trì, Nam Từ Liêm, Hà Nội" },
            technicianId: 3,
            start: "2026-06-28T15:30:00",
            end: "2026-06-28T17:00:00",
            status: "in_progress",
            note: "Cấu hình IP tĩnh Leased Line doanh nghiệp.",
            createdAt: "2026-06-28T09:10:00"
        },
        {
            id: 5,
            ticketId: "TS-2026-019",
            customer: { name: "Bùi Quốc Anh", phone: "0988776655", address: "Số 112 Chùa Bộc, Đống Đa, Hà Nội" },
            technicianId: 2,
            start: "2026-06-28T11:00:00",
            end: "2026-06-28T12:30:00",
            status: "completed",
            note: "Đổi cổng OLT quang sang nhánh phụ chống suy hao.",
            createdAt: "2026-06-27T08:00:00"
        },
        // June appointments spread to meet requirements (> 16 total appts)
        { id: 6, ticketId: "TS-2026-020", customer: { name: "Vũ Minh Quân", phone: "0981112223", address: "Số 88 Giải Phóng, Hà Nội" }, technicianId: 1, start: "2026-06-05T09:00:00", end: "2026-06-05T10:30:00", status: "completed", note: "Kiểm tra modem" },
        { id: 7, ticketId: "TS-2026-021", customer: { name: "Phạm Hồng Sơn", phone: "0982223334", address: "Số 12 Kim Mã, Hà Nội" }, technicianId: 2, start: "2026-06-10T14:00:00", end: "2026-06-10T15:30:00", status: "completed", note: "Lắp đặt Home Wifi" },
        { id: 8, ticketId: "TS-2026-022", customer: { name: "Đỗ Thu Hà", phone: "0983334445", address: "Số 456 Hoàng Hoa Thám, Hà Nội" }, technicianId: 3, start: "2026-06-15T10:00:00", end: "2026-06-15T11:30:00", status: "completed", note: "Đóng chuyển gói cước" },
        { id: 9, ticketId: "TS-2026-023", customer: { name: "Nguyễn Văn Đạt", phone: "0984445556", address: "Số 23 Nguyễn Trãi, Thanh Xuân, Hà Nội" }, technicianId: 1, start: "2026-06-20T08:30:00", end: "2026-06-20T10:00:00", status: "completed", note: "Nâng cấp gói băng rộng" },
        { id: 10, ticketId: "TS-2026-024", customer: { name: "Lý Hải Yến", phone: "0985556667", address: "Tổ 4 Phường Định Công, Hoàng Mai, Hà Nội" }, technicianId: 2, start: "2026-06-25T15:00:00", end: "2026-06-25T16:30:00", status: "completed", note: "Xử lý lỗi mạng suy hao" },
        { id: 11, ticketId: "TS-2026-025", customer: { name: "Hoàng Ngọc Lâm", phone: "0986667778", address: "Ngõ 99 Tây Sơn, Đống Đa, Hà Nội" }, technicianId: 3, start: "2026-06-29T09:00:00", end: "2026-06-29T10:30:00", status: "confirmed", note: "Chuyển đường dây quang trong nhà" },
        { id: 12, ticketId: "TS-2026-026", customer: { name: "Đào Văn Thế", phone: "0987778889", address: "Số 32 Đê La Thành, Hà Nội" }, technicianId: 1, start: "2026-06-29T14:00:00", end: "2026-06-29T15:30:00", status: "waiting", note: "Cài đặt modem Wifi phụ" },
        { id: 13, ticketId: "TS-2026-027", customer: { name: "Tô Minh Hương", phone: "0988889990", address: "Tổ 15 Ngọc Thụy, Long Biên, Hà Nội" }, technicianId: 2, start: "2026-06-30T10:30:00", end: "2026-06-30T12:00:00", status: "waiting", note: "Đo lại tín hiệu truyền hình quang" },
        { id: 14, ticketId: "TS-2026-028", customer: { name: "Trịnh Gia Bảo", phone: "0989990001", address: "Số 2 Hoàng Đạo Thúy, Hà Nội" }, technicianId: 3, start: "2026-06-30T15:00:00", end: "2026-06-30T16:30:00", status: "confirmed", note: "Gia cố hộp ODF kỹ thuật" },
        { id: 15, ticketId: "TS-2026-029", customer: { name: "Phùng Tiến Dũng", phone: "0911223344", address: "Phố Huế, Hai Bà Trưng, Hà Nội" }, technicianId: 1, start: "2026-06-12T10:00:00", end: "2026-06-12T11:30:00", status: "cancelled", note: "Khách hủy lịch do đi công tác đột xuất" },
        { id: 16, ticketId: "TS-2026-030", customer: { name: "Ngô Quốc Bảo", phone: "0922334455", address: "Lạc Long Quân, Tây Hồ, Hà Nội" }, technicianId: 2, start: "2026-06-22T14:00:00", end: "2026-06-22T15:30:00", status: "cancelled", note: "KTV bận việc đột xuất không qua được" }
    ];

    // 2. RUNTIME STATE
    let currentCalendarDate = new Date(2026, 5, 28); // Today represents June 28, 2026
    let selectedDateStr = "2026-06-28";
    let activeAppointmentId = 1;
    let currentViewMode = "month"; // day, week, month

    // 3. INITIALIZE
    document.addEventListener("DOMContentLoaded", function() {
        initApp();
    });

    function initApp() {
        populateTechDropdowns();
        renderStats();
        renderCalendar();
        selectDay(selectedDateStr);
        setupFormSubmit();
        setupThemeToggle();
    }

    // Populate Tech Option Lists
    function populateTechDropdowns() {
        const filterTech = document.getElementById("filterTech");
        const newApptTech = document.getElementById("newApptTech");
        const transferTechSelect = document.getElementById("transferTechSelect");

        const techOptions = technicians.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        
        filterTech.innerHTML = `<option value="all">Tất cả Kỹ thuật viên</option>` + techOptions;
        newApptTech.innerHTML = techOptions;
        transferTechSelect.innerHTML = techOptions;
    }

    // Render stats panels in row (Khu A)
    function renderStats() {
        const todayStr = "2026-06-28";
        const todayAppts = appointments.filter(a => a.start.startsWith(todayStr));

        // 1. Total Today
        const totalToday = todayAppts.filter(a => a.status !== 'cancelled').length;
        document.getElementById("kpiTotalToday").innerText = totalToday;

        // 2. Waiting status
        const waiting = todayAppts.filter(a => a.status === 'waiting').length;
        document.getElementById("kpiWaiting").innerText = waiting;

        // 3. Ongoing (on_the_way + in_progress)
        const ongoing = todayAppts.filter(a => a.status === 'on_the_way' || a.status === 'in_progress').length;
        document.getElementById("kpiOngoing").innerText = ongoing;

        // 4. Completed today
        const completed = todayAppts.filter(a => a.status === 'completed').length;
        document.getElementById("kpiCompleted").innerText = completed;

        // Sync counts for unread badge on sidebar menu if loader finished
        updateSidebarBadge();
    }

    // Update today's badge count on sidebar menu item
    function updateSidebarBadge() {
        const todayStr = "2026-06-28";
        const totalToday = appointments.filter(a => a.start.startsWith(todayStr) && a.status !== 'cancelled').length;
        
        // Expose function for loader to access or execute dynamically
        const updateBadge = () => {
            const links = document.querySelectorAll("#sidebarMount .sidebar-item");
            links.forEach(item => {
                const page = item.getAttribute("data-page");
                if (page === "admin-appointments.html") {
                    // Clear existing badges
                    const oldBadge = item.querySelector(".badge");
                    if (oldBadge) oldBadge.remove();

                    if (totalToday > 0) {
                        const badge = document.createElement("span");
                        badge.className = "badge bg-danger ms-auto me-2";
                        badge.style.fontSize = "0.75rem";
                        badge.innerText = totalToday;
                        item.querySelector("a").appendChild(badge);
                    }
                }
            });
        };

        // Trigger or attach to window
        window.initAdminSidebar = updateBadge;
        updateBadge();
    }

    // Draw month calendar cells grid
    function renderCalendar() {
        const container = document.getElementById("calendarGridContainer");
        
        // Clear days first (keep headers)
        const headers = container.querySelectorAll(".calendar-weekday");
        container.innerHTML = "";
        headers.forEach(h => container.appendChild(h));

        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();

        // Get first day of month and total days
        const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday is 0, Monday is 1, etc.
        const totalDays = new Date(year, month + 1, 0).getDate();

        // Shift first day index to fit our grid (Mon=0, Tue=1, ..., Sun=6)
        // JS Sunday is 0, we need it to be 6.
        let startShift = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

        // Render month title label
        const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
        document.getElementById("calendarMonthTitle").innerText = `${monthNames[month]}, ${year}`;

        // Render blank cells
        for (let i = 0; i < startShift; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "calendar-day empty";
            container.appendChild(emptyCell);
        }

        // Render actual day cells
        for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
            const dayCell = document.createElement("div");
            dayCell.className = "calendar-day";
            
            const padMonth = String(month + 1).padStart(2, '0');
            const padDay = String(dayNum).padStart(2, '0');
            const cellDateStr = `${year}-${padMonth}-${padDay}`;

            dayCell.setAttribute("data-date", cellDateStr);

            // Day Number
            const numDiv = document.createElement("div");
            numDiv.className = "day-number";
            numDiv.innerText = dayNum;
            dayCell.appendChild(numDiv);

            // Today highlight
            if (cellDateStr === "2026-06-28") {
                dayCell.classList.add("today");
            }

            // Highlight currently selected day
            if (cellDateStr === selectedDateStr) {
                dayCell.classList.add("selected");
            }

            // Query appointments for this day (with filters applied)
            const dayAppts = getFilteredAppointments().filter(a => a.start.startsWith(cellDateStr));
            
            if (dayAppts.length > 0) {
                const dotsContainer = document.createElement("div");
                dotsContainer.className = "appt-indicators";

                // Display up to 2 appointments, then badge "+X"
                const displayCount = Math.min(dayAppts.length, 2);
                for (let j = 0; j < displayCount; j++) {
                    const appt = dayAppts[j];
                    const apptBar = document.createElement("div");
                    apptBar.className = `appt-bar ${appt.status}`;
                    
                    const cleanTime = appt.start.split('T')[1].substring(0, 5);
                    apptBar.innerText = `${cleanTime} ${appt.customer.name}`;
                    dotsContainer.appendChild(apptBar);
                }

                if (dayAppts.length > 2) {
                    const moreBadge = document.createElement("div");
                    moreBadge.className = "appt-more-badge";
                    moreBadge.innerText = `+${dayAppts.length - 2} cuộc hẹn`;
                    dotsContainer.appendChild(moreBadge);
                }

                dayCell.appendChild(dotsContainer);
            }

            // Day click triggers
            dayCell.addEventListener("click", function() {
                document.querySelectorAll(".calendar-day").forEach(c => c.classList.remove("selected"));
                this.classList.add("selected");
                selectDay(this.getAttribute("data-date"));
            });

            container.appendChild(dayCell);
        }
    }

    // Fetch filtered list
    function getFilteredAppointments() {
        const query = document.getElementById("searchBar").value.trim().toLowerCase();
        const techVal = document.getElementById("filterTech").value;
        const statusVal = document.getElementById("filterStatus").value;

        return appointments.filter(a => {
            // Tech filter
            const matchesTech = techVal === 'all' || String(a.technicianId) === techVal;
            
            // Status filter
            const matchesStatus = statusVal === 'all' || a.status === statusVal;

            // Query search text
            const matchesSearch = !query || 
                                  a.ticketId.toLowerCase().includes(query) || 
                                  a.customer.name.toLowerCase().includes(query) || 
                                  a.customer.phone.includes(query);

            return matchesTech && matchesStatus && matchesSearch;
        });
    }

    // Apply filter changes to grid
    window.applyFilters = function() {
        renderCalendar();
        selectDay(selectedDateStr);
    };

    // Select a day to list appointments in sidebar
    function selectDay(dateStr) {
        selectedDateStr = dateStr;
        
        // Formatted header string
        const dateObj = new Date(dateStr);
        const daysOfWeek = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
        document.getElementById("selectedDateLabel").innerText = `${daysOfWeek[dateObj.getDay()]} - Ngày ${dateStr.split('-').reverse().join('/')}`;

        const listContainer = document.getElementById("sidebarApptList");
        const dayAppts = getFilteredAppointments().filter(a => a.start.startsWith(dateStr));

        // Clear details card
        document.getElementById("sidebarApptDetails").classList.add("d-none");
        document.getElementById("sidebarActionsPanel").classList.add("d-none");

        if (dayAppts.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center text-muted p-4">
                    <i class="bi bi-calendar-x fs-3 d-block mb-1 text-muted"></i>
                    <small>Không có lịch hẹn cho ngày này</small>
                </div>
            `;
            return;
        }

        // Render list
        listContainer.innerHTML = dayAppts.map(appt => {
            const isActive = (appt.id === activeAppointmentId) ? 'active' : '';
            const timeStart = appt.start.split('T')[1].substring(0, 5);
            const timeEnd = appt.end.split('T')[1].substring(0, 5);
            
            let statusColor = 'var(--color-waiting)';
            if (appt.status === 'confirmed') statusColor = 'var(--color-confirmed)';
            else if (appt.status === 'on_the_way') statusColor = 'var(--color-on-way)';
            else if (appt.status === 'in_progress') statusColor = 'var(--color-progress)';
            else if (appt.status === 'completed') statusColor = 'var(--color-completed)';
            else if (appt.status === 'cancelled') statusColor = 'var(--color-cancelled)';

            return `
                <div class="appt-mini-card ${isActive}" data-id="${appt.id}">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="appt-card-time"><i class="bi bi-clock me-1"></i>${timeStart} - ${timeEnd}</span>
                        <span style="width:10px; height:10px; border-radius:50%; background-color:${statusColor};" title="${getStatusName(appt.status)}"></span>
                    </div>
                    <div class="appt-card-title">${appt.customer.name} (${appt.ticketId})</div>
                    <div style="font-size:0.75rem; color:var(--vt-text-muted); text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">
                        <i class="bi bi-geo-alt"></i> ${appt.customer.address}
                    </div>
                </div>
            `;
        }).join('');

        // Click triggers to show detailed information card
        listContainer.querySelectorAll(".appt-mini-card").forEach(card => {
            card.addEventListener("click", function() {
                listContainer.querySelectorAll(".appt-mini-card").forEach(c => c.classList.remove("active"));
                this.classList.add("active");
                const id = parseInt(this.getAttribute("data-id"));
                showAppointmentDetails(id);
            });
        });

        // Auto-select first appointment in list on render
        if (dayAppts.length > 0) {
            const firstApptId = dayAppts[0].id;
            const firstCard = listContainer.querySelector(`.appt-mini-card[data-id="${firstApptId}"]`);
            if (firstCard) firstCard.click();
        }
    }

    // Load full details for selected card in panel
    function showAppointmentDetails(id) {
        activeAppointmentId = id;
        const appt = appointments.find(a => a.id === id);
        if (!appt) return;

        const tech = technicians.find(t => t.id === appt.technicianId);

        // Update text elements
        document.getElementById("detTicketCode").innerText = appt.ticketId;
        document.getElementById("detCustName").innerText = appt.customer.name;
        document.getElementById("detCustPhone").innerText = appt.customer.phone;
        document.getElementById("detCustAddress").innerText = appt.customer.address;
        document.getElementById("detMapLink").href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appt.customer.address)}`;

        // Format times
        const tStart = appt.start.split('T')[1].substring(0, 5);
        const tEnd = appt.end.split('T')[1].substring(0, 5);
        const dateClean = appt.start.split('T')[0].split('-').reverse().join('/');
        document.getElementById("detApptTime").innerText = `${tStart} - ${tEnd} (Ngày ${dateClean})`;

        // Tech details
        document.getElementById("detTechAvatar").src = tech.avatar;
        document.getElementById("detTechName").innerText = tech.name;

        // Status Badge
        const statusBadge = document.getElementById("detStatusBadge");
        statusBadge.className = `status-badge-inline ${appt.status}`;
        statusBadge.innerText = getStatusName(appt.status);

        // Note
        document.getElementById("detApptNote").innerText = appt.note || "Không có ghi chú.";

        // Show Details Container & Actions Panel
        document.getElementById("sidebarApptDetails").classList.remove("d-none");
        
        // Hide actions panel if cancelled or completed (no changes allowed)
        const actionsPanel = document.getElementById("sidebarActionsPanel");
        if (appt.status === 'completed' || appt.status === 'cancelled') {
            actionsPanel.classList.add("d-none");
        } else {
            actionsPanel.classList.remove("d-none");
        }
    }

    // Helper to translate status key to VN text
    function getStatusName(status) {
        switch(status) {
            case 'waiting': return 'Chờ xác nhận';
            case 'confirmed': return 'Đã xác nhận';
            case 'on_the_way': return 'Đang di chuyển';
            case 'in_progress': return 'Đang xử lý';
            case 'completed': return 'Đã hoàn thành';
            case 'cancelled': return 'Đã hủy lịch';
            default: return 'Khác';
        }
    }

    // Month navigation chevrons (Khu C)
    window.navigateMonth = function(direction) {
        // Shift month
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
        renderCalendar();
    };

    // Switch layout views (mock alert)
    window.setViewMode = function(mode) {
        currentViewMode = mode;
        document.querySelectorAll(".btn-group button").forEach(btn => btn.classList.remove("active"));
        
        // Highlight target
        if (mode === 'day') event.target.classList.add("active");
        else if (mode === 'week') event.target.classList.add("active");
        else if (mode === 'month') event.target.classList.add("active");
        
        showToast(`Đã chuyển sang chế độ xem dạng: ${mode === 'day' ? 'Ngày' : (mode === 'week' ? 'Tuần' : 'Tháng')}`, "info");
    };

    // Modify active appointment status (waiting -> confirmed -> on_the_way etc)
    window.changeApptStatus = function(newStatus) {
        const appt = appointments.find(a => a.id === activeAppointmentId);
        if (!appt) return;

        appt.status = newStatus;
        
        showToast(`Cập nhật trạng thái cuộc hẹn: ${getStatusName(newStatus)}`, "success");
        
        // Refresh UI components
        renderStats();
        renderCalendar();
        showAppointmentDetails(activeAppointmentId);
    };

    // Programmatic Modal Trigger setups
    window.triggerEditTimeModal = function() {
        const appt = appointments.find(a => a.id === activeAppointmentId);
        
        document.getElementById("editDate").value = appt.start.split('T')[0];
        document.getElementById("editStartTime").value = appt.start.split('T')[1].substring(0, 5);
        document.getElementById("editEndTime").value = appt.end.split('T')[1].substring(0, 5);

        const modal = new bootstrap.Modal(document.getElementById('editTimeModal'));
        modal.show();
    };

    window.triggerTransferTechModal = function() {
        const appt = appointments.find(a => a.id === activeAppointmentId);
        document.getElementById("transferTechSelect").value = appt.technicianId;

        const modal = new bootstrap.Modal(document.getElementById('transferTechModal'));
        modal.show();
    };

    window.triggerCancelModal = function() {
        document.getElementById("cancelReasonText").value = "";
        const modal = new bootstrap.Modal(document.getElementById('cancelModal'));
        modal.show();
    };

    // Action submit button triggers
    document.getElementById("btnSaveTimeEdit").addEventListener("click", function() {
        const appt = appointments.find(a => a.id === activeAppointmentId);
        const date = document.getElementById("editDate").value;
        const startT = document.getElementById("editStartTime").value;
        const endT = document.getElementById("editEndTime").value;

        if (!date || !startT || !endT) {
            Swal.fire('Lỗi', 'Vui lòng điền đủ mốc thời gian!', 'error');
            return;
        }

        appt.start = `${date}T${startT}:00`;
        appt.end = `${date}T${endT}:00`;

        // Reload UI
        renderCalendar();
        selectDay(selectedDateStr);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById("editTimeModal"));
        modal.hide();
        showToast("Đã cập nhật lại mốc thời gian hẹn!", "success");
    });

    document.getElementById("btnSaveTechTransfer").addEventListener("click", function() {
        const appt = appointments.find(a => a.id === activeAppointmentId);
        const newTechId = parseInt(document.getElementById("transferTechSelect").value);
        const tech = technicians.find(t => t.id === newTechId);

        appt.technicianId = newTechId;

        // Reload
        renderCalendar();
        showAppointmentDetails(activeAppointmentId);

        const modal = bootstrap.Modal.getInstance(document.getElementById("transferTechModal"));
        modal.hide();
        showToast(`Đã bàn giao lịch hẹn sang cho KTV: ${tech.name}`, "success");
    });

    document.getElementById("btnSaveApptCancel").addEventListener("click", function() {
        const appt = appointments.find(a => a.id === activeAppointmentId);
        const reason = document.getElementById("cancelReasonText").value.trim();

        if (!reason) {
            Swal.fire('Lỗi', 'Vui lòng nhập lý do hủy lịch!', 'error');
            return;
        }

        appt.status = 'cancelled';
        appt.note = `[Lý do hủy: ${reason}]. Ghi chú ban đầu: ${appt.note}`;

        // Reload UI
        renderStats();
        renderCalendar();
        showAppointmentDetails(activeAppointmentId);

        const modal = bootstrap.Modal.getInstance(document.getElementById("cancelModal"));
        modal.hide();
        
        Swal.fire({
            title: 'Đã hủy lịch hẹn',
            text: `Lịch hẹn mã phiếu ${appt.ticketId} đã cập nhật sang trạng thái Đã hủy.`,
            icon: 'warning',
            confirmButtonColor: '#EF4444'
        });
    });

    // Handle New Appointment Modal Form Submit (Khu B Button action)
    function setupFormSubmit() {
        const form = document.getElementById("newApptForm");
        form.addEventListener("submit", function(e) {
            e.preventDefault();

            const ticket = document.getElementById("newApptTicket").value.trim().toUpperCase();
            const custName = document.getElementById("newApptCustName").value.trim();
            const phone = document.getElementById("newApptPhone").value.trim();
            const address = document.getElementById("newApptAddress").value.trim();
            const date = document.getElementById("newApptDate").value;
            const startT = document.getElementById("newApptTime").value;
            const techId = parseInt(document.getElementById("newApptTech").value);
            const note = document.getElementById("newApptNote").value.trim();

            // Calculate default end time (+1.5 hours)
            const startHour = parseInt(startT.split(':')[0]);
            const startMin = parseInt(startT.split(':')[1]);
            
            let endHour = startHour + 1;
            let endMin = startMin + 30;
            if (endMin >= 60) {
                endHour += 1;
                endMin -= 60;
            }
            const endT = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

            // Insert to database array
            const newId = appointments.length + 1;
            appointments.push({
                id: newId,
                ticketId: ticket,
                customer: { name: custName, phone: phone, address: address },
                technicianId: techId,
                start: `${date}T${startT}:00`,
                end: `${date}T${endT}:00`,
                status: "waiting",
                note: note,
                createdAt: new Date().toISOString()
            });

            // Clear form
            form.reset();

            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById("newApptModal"));
            modal.hide();

            // Refresh UI
            renderStats();
            renderCalendar();
            selectDay(date);

            Swal.fire({
                title: 'Đã lưu lịch hẹn!',
                text: `Khởi tạo cuộc hẹn mới cho phiếu ${ticket} thành công.`,
                icon: 'success',
                confirmButtonColor: '#0A5C8C'
            });
        });
    }

    // Expose redirection function to Staff Chat
    window.openStaffChatPage = function() {
        window.location.href = "staff-chat.html";
    };

    // Custom Toast popup utility
    function showToast(message, iconType = 'success') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });

        Toast.fire({
            icon: iconType,
            title: message
        });
    }

    // Theme toggle hooks
    function setupThemeToggle() {
        // Theme toggle listener is inherited or defined locally
        const toggleBtn = document.getElementById("toggleTheme");
        if (!toggleBtn) return;

        toggleBtn.addEventListener("click", function() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute("data-bs-theme");
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute("data-bs-theme", newTheme);
        });
    }

})();
