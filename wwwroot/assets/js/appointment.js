/**
 * FILE: wwwroot/assets/js/appointment.js
 * DESCRIPTION: Frontend Interactions for Technical Support Appointment Booking.
 *              Handles 2-column ticket selection via AJAX, time slot chips,
 *              live synchronization with Sticky Summary Sidebar, date formatting,
 *              and form submission.
 */

// Global function to handle Ticket selection via AJAX
async function selectTicketCard(idPhieu, btnElem) {
    if (!idPhieu) return;

    try {
        // Highlight loading on card
        const cardElem = btnElem ? btnElem.closest('.ticket-select-card') : document.querySelector(`.ticket-select-card[data-id="${idPhieu}"]`);
        
        // Remove active from all cards
        document.querySelectorAll('.ticket-select-card').forEach(c => c.classList.remove('selected-active'));
        if (cardElem) cardElem.classList.add('selected-active');

        // Fetch ticket summary via AJAX
        const response = await fetch(`/LichHen/GetTicketSummary/${idPhieu}`);
        if (!response.ok) {
            console.error("Lỗi khi tải thông tin phiếu hỗ trợ");
            return;
        }

        const data = await response.json();
        if (data.success) {
            // Update hidden input IdPhieu
            const hiddenIdPhieuInput = document.getElementById('hiddenIdPhieuInput');
            if (hiddenIdPhieuInput) hiddenIdPhieuInput.value = data.idPhieu;

            // Update Card 1 Display Values
            const displayMaPhieu = document.getElementById('displayMaPhieu');
            const displayTenDichVu = document.getElementById('displayTenDichVu');
            const displayTenKhachHang = document.getElementById('displayTenKhachHang');
            const displayTenNhanVien = document.getElementById('displayTenNhanVien');
            const displaySoDienThoaiNV = document.getElementById('displaySoDienThoaiNV');
            const displayTrangThaiPhieu = document.getElementById('displayTrangThaiPhieu');

            if (displayMaPhieu) displayMaPhieu.textContent = data.maPhieu;
            if (displayTenDichVu) displayTenDichVu.textContent = data.tenDichVu;
            if (displayTenKhachHang) displayTenKhachHang.textContent = data.tenKhachHang;
            
            if (data.isConfirmed) {
                if (displayTenNhanVien) {
                    displayTenNhanVien.className = 'info-value text-success font-weight-bold d-block';
                    displayTenNhanVien.innerHTML = `<i class="bi bi-person-check-fill me-1"></i> ${data.tenNhanVien}`;
                }
                if (displaySoDienThoaiNV) {
                    displaySoDienThoaiNV.className = 'small mt-1 text-secondary';
                    displaySoDienThoaiNV.innerHTML = `<i class="bi bi-telephone-fill text-danger me-1"></i> SĐT: <a href="tel:${data.soDienThoaiNV || ''}" class="text-danger fw-bold">${data.soDienThoaiNV || '--'}</a>`;
                }
            } else {
                if (displayTenNhanVien) {
                    displayTenNhanVien.className = 'info-value text-muted d-block';
                    displayTenNhanVien.innerHTML = `<i class="bi bi-info-circle me-1"></i> Chưa phân công (Chờ Admin xác nhận)`;
                }
                if (displaySoDienThoaiNV) {
                    displaySoDienThoaiNV.className = 'small mt-1 text-secondary d-none';
                    displaySoDienThoaiNV.innerHTML = '';
                }
            }

            // Đồng bộ trạng thái phiếu hỗ trợ giữa Cột Trái & Cột Phải
            if (displayTrangThaiPhieu) {
                const badgeClass = data.trangThaiBadgeClass || 'bg-primary text-white';
                const iconClass = data.trangThaiIcon || 'bi-gear-fill';
                const statusText = data.trangThaiPhieu || 'Đang xử lý';
                displayTrangThaiPhieu.className = `apt-status-badge badge ${badgeClass} px-3 py-2 fs-8`;
                displayTrangThaiPhieu.innerHTML = `<i class="bi ${iconClass} me-1"></i> ${statusText}`;
            }

            // Update Address input
            const aptAddressInput = document.getElementById('aptAddressInput');
            if (aptAddressInput) {
                aptAddressInput.value = data.diaChiHoTro || '';
            }

            // Update Sidebar Summary Values
            const summaryMaPhieuVal = document.getElementById('summaryMaPhieuVal');
            const summaryAddressVal = document.getElementById('summaryAddressVal');
            const summaryKhachHangVal = document.getElementById('summaryKhachHangVal');
            const summaryNhanVienVal = document.getElementById('summaryNhanVienVal');

            if (summaryMaPhieuVal) summaryMaPhieuVal.textContent = data.maPhieu;
            if (summaryAddressVal) summaryAddressVal.textContent = data.diaChiHoTro || 'Chưa nhập địa chỉ';
            if (summaryKhachHangVal) summaryKhachHangVal.textContent = data.tenKhachHang;
            if (summaryNhanVienVal) summaryNhanVienVal.textContent = data.tenNhanVien;

            // Smooth scroll to form if mobile
            if (window.innerWidth < 992) {
                const appointmentFormCard = document.getElementById('appointmentFormCard');
                if (appointmentFormCard) {
                    appointmentFormCard.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    } catch (err) {
        console.error("AJAX Error selection ticket:", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. ELEMENT REFERENCES
    // -------------------------------------------------------------
    const aptDateInput = document.getElementById('aptDateInput');
    const timeSlotChips = document.querySelectorAll('.time-slot-chip');
    const aptAddressInput = document.getElementById('aptAddressInput');
    const summaryDateVal = document.getElementById('summaryDateVal');
    const summaryTimeVal = document.getElementById('summaryTimeVal');
    const summaryAddressVal = document.getElementById('summaryAddressVal');

    // Helper: Date Formatter (YYYY-MM-DD -> DD/MM/YYYY)
    function formatDateVietnamese(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    }

    // Set Min Date to Today & sync initial date
    if (aptDateInput) {
        const today = new Date().toISOString().split('T')[0];
        aptDateInput.setAttribute('min', today);

        if (summaryDateVal && aptDateInput.value) {
            summaryDateVal.textContent = formatDateVietnamese(aptDateInput.value);
        }

        aptDateInput.addEventListener('change', (e) => {
            const formatted = formatDateVietnamese(e.target.value);
            if (summaryDateVal) {
                summaryDateVal.textContent = formatted || 'Chưa chọn';
                summaryDateVal.classList.add('text-danger');
                setTimeout(() => summaryDateVal.classList.remove('text-danger'), 600);
            }
        });
    }

    // Live Sync Address Input to Summary Card
    if (aptAddressInput) {
        if (summaryAddressVal && aptAddressInput.value) {
            summaryAddressVal.textContent = aptAddressInput.value.trim() || 'Chưa nhập địa chỉ';
        }
        aptAddressInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (summaryAddressVal) {
                summaryAddressVal.textContent = val || 'Chưa nhập địa chỉ';
            }
        });
    }

    // -------------------------------------------------------------
    // 2. TIME SLOT SELECTION HANDLER
    // -------------------------------------------------------------
    timeSlotChips.forEach((chip) => {
        chip.addEventListener('click', () => {
            if (chip.classList.contains('disabled') || chip.dataset.status === 'full') {
                return;
            }

            timeSlotChips.forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');

            const slotVal = chip.dataset.slot;
            const parts = slotVal.split('-').map(s => s.trim());
            const gioBatDauInput = document.getElementById('gioBatDauInput');
            const gioKetThucInput = document.getElementById('gioKetThucInput');

            if (parts.length === 2) {
                if (gioBatDauInput) gioBatDauInput.value = parts[0];
                if (gioKetThucInput) gioKetThucInput.value = parts[1];
            }

            if (summaryTimeVal) {
                summaryTimeVal.textContent = slotVal;
            }
        });
    });

    // -------------------------------------------------------------
    // 3. SPA AJAX FORM SUBMISSION HANDLER (NO F5, NO REDIRECT)
    // -------------------------------------------------------------
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = appointmentForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Đang gửi yêu cầu...';
            }

            try {
                const formData = new FormData(appointmentForm);
                const actionUrl = appointmentForm.getAttribute('action') || '/LichHen/TaoYeuCau';

                const response = await fetch(actionUrl, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success && data.data) {
                    if (data.data.idPhieu) {
                        window.createdTicketId = data.data.idPhieu;
                    }

                    // Populate Viettel Success Modal with SQL-backed Data
                    const popupMaLichHen = document.getElementById('popupMaLichHen');
                    const popupMaPhieu = document.getElementById('popupMaPhieu');
                    const popupNgayHen = document.getElementById('popupNgayHen');
                    const popupKhungGio = document.getElementById('popupKhungGio');
                    const popupTrangThai = document.getElementById('popupTrangThai');
                    const popupDiaChi = document.getElementById('popupDiaChi');

                    if (popupMaLichHen) popupMaLichHen.textContent = data.data.maLichHen || `--`;
                    if (popupMaPhieu) popupMaPhieu.textContent = data.data.maPhieu || `--`;
                    if (popupNgayHen) popupNgayHen.textContent = data.data.ngayHen || `--`;
                    if (popupKhungGio) popupKhungGio.textContent = data.data.khungGio || `--`;
                    if (popupDiaChi) popupDiaChi.textContent = data.data.diaChi || `--`;

                    if (popupTrangThai) {
                        const badgeClass = data.data.trangThaiBadgeClass || 'bg-warning text-dark';
                        const iconClass = data.data.trangThaiIcon || 'bi-hourglass-split';
                        const statusText = data.data.trangThaiText || 'Chờ xác nhận';
                        popupTrangThai.className = `badge ${badgeClass} px-3 py-1`;
                        popupTrangThai.innerHTML = `<i class="bi ${iconClass} me-1"></i> ${statusText}`;
                    }

                    // Show Modal
                    const modalElem = document.getElementById('successAppointmentModal');
                    if (modalElem && window.bootstrap) {
                        const modal = new bootstrap.Modal(modalElem);
                        modal.show();
                    }

                    // Refresh Left Column Tickets from SQL Server (Ticket booked is removed from eligible list)
                    await refreshEligibleTicketsList();
                } else {
                    alert(data.message || (data.errors ? data.errors.join('\n') : 'Gửi yêu cầu lịch hẹn thất bại. Vui lòng thử lại.'));
                }
            } catch (err) {
                console.error("Lỗi gửi yêu cầu lịch hẹn AJAX:", err);
                alert("Đã xảy ra lỗi khi gửi yêu cầu lịch hẹn. Vui lòng kiểm tra lại kết nối.");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="bi bi-calendar-check-fill me-2"></i> Gửi Yêu Cầu Lịch Hẹn';
                }
            }
        });
    }

    // -------------------------------------------------------------
    // 4. AUTOMATIC POLLING FALLBACK (Every 8 seconds)
    // -------------------------------------------------------------
    setInterval(() => {
        const hiddenIdPhieuInput = document.getElementById('hiddenIdPhieuInput');
        if (hiddenIdPhieuInput && hiddenIdPhieuInput.value) {
            const currentIdPhieu = parseInt(hiddenIdPhieuInput.value);
            if (currentIdPhieu > 0) {
                fetch(`/LichHen/GetTicketSummary/${currentIdPhieu}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            const displayTrangThaiPhieu = document.getElementById('displayTrangThaiPhieu');
                            if (displayTrangThaiPhieu) {
                                const badgeClass = data.trangThaiBadgeClass || 'bg-primary text-white';
                                const iconClass = data.trangThaiIcon || 'bi-gear-fill';
                                const statusText = data.trangThaiPhieu || 'Đang xử lý';
                                displayTrangThaiPhieu.className = `apt-status-badge badge ${badgeClass} px-3 py-2 fs-8`;
                                displayTrangThaiPhieu.innerHTML = `<i class="bi ${iconClass} me-1"></i> ${statusText}`;
                            }

                            const displayTenNhanVien = document.getElementById('displayTenNhanVien');
                            const displaySoDienThoaiNV = document.getElementById('displaySoDienThoaiNV');
                            if (data.isConfirmed) {
                                if (displayTenNhanVien) {
                                    displayTenNhanVien.className = 'info-value text-success font-weight-bold d-block';
                                    displayTenNhanVien.innerHTML = `<i class="bi bi-person-check-fill me-1"></i> ${data.tenNhanVien}`;
                                }
                                if (displaySoDienThoaiNV) {
                                    displaySoDienThoaiNV.className = 'small mt-1 text-secondary';
                                    displaySoDienThoaiNV.innerHTML = `<i class="bi bi-telephone-fill text-danger me-1"></i> SĐT: <a href="tel:${data.soDienThoaiNV || ''}" class="text-danger fw-bold">${data.soDienThoaiNV || '--'}</a>`;
                                }
                            }
                        }
                    })
                    .catch(err => console.debug("Polling status update:", err));
            }
        }
    }, 8000);
});

// -------------------------------------------------------------
// GLOBAL MODAL ACTION FUNCTIONS (NO RELOAD)
// -------------------------------------------------------------
function closeSuccessModal() {
    const modalElem = document.getElementById('successAppointmentModal');
    if (modalElem && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalElem);
        if (modal) modal.hide();
    }
}

function viewAppointmentSummary() {
    closeSuccessModal();
    const hiddenIdPhieuInput = document.getElementById('hiddenIdPhieuInput');
    const targetIdPhieu = window.createdTicketId || (hiddenIdPhieuInput ? hiddenIdPhieuInput.value : null);
    if (targetIdPhieu && parseInt(targetIdPhieu) > 0) {
        window.location.href = `/Ticket/ChiTietPhieu/${targetIdPhieu}`;
    } else {
        const summaryCard = document.getElementById('appointmentFormCard') || document.getElementById('displayKtvContainer');
        if (summaryCard) {
            summaryCard.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Global helper to refresh eligible tickets list from SQL Server
async function refreshEligibleTicketsList() {
    try {
        const res = await fetch('/LichHen/GetEligibleTicketsList');
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !data.items) return;

        const container = document.querySelector('.ticket-cards-scroll-wrapper');
        if (!container) return;

        if (data.items.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-inbox text-muted display-4 d-block mb-3"></i>
                    <h5 class="fw-bold text-secondary">Không có phiếu nào cần đặt lịch</h5>
                    <p class="text-muted fs-8 max-w-300 mx-auto">
                        Tất cả phiếu hỗ trợ của bạn đã được sắp xếp lịch hẹn hoặc đã xử lý hoàn tất.
                    </p>
                    <a href="/Ticket/TaoPhieu" class="btn btn-sm btn-outline-danger mt-2">
                        <i class="bi bi-plus-lg me-1"></i> Tạo phiếu mới
                    </a>
                </div>
            `;
        } else {
            let html = '<div class="d-flex flex-column gap-3">';
            data.items.forEach(item => {
                html += `
                    <div class="ticket-select-card" data-id="${item.idPhieu}" onclick="selectTicketCard(${item.idPhieu}, this)">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="ticket-select-badge">${item.maPhieu}</span>
                            <span class="badge ${item.trangThaiBadgeClass} fs-9 px-2 py-1" id="ticket-badge-${item.idPhieu}">
                                <i class="bi ${item.trangThaiIcon} me-1"></i> ${item.trangThaiPhieu}
                            </span>
                        </div>
                        <h6 class="fw-bold text-dark mb-1 text-truncate" title="${item.tieuDe}">${item.tieuDe}</h6>
                        <div class="d-flex align-items-center gap-2 text-muted fs-8 mb-2">
                            <i class="bi bi-tools text-danger"></i>
                            <span>Dịch vụ: <strong>${item.tenDichVu}</strong></span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                            <span class="text-muted fs-9">
                                <i class="bi bi-calendar3 me-1"></i> Tạo: ${item.ngayTao}
                            </span>
                            <button type="button" class="btn btn-sm btn-outline-danger px-3 py-1 font-weight-bold">
                                <i class="bi bi-check2-circle me-1"></i> Chọn phiếu
                            </button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;

            // Automatically select first ticket in updated list
            selectTicketCard(data.items[0].idPhieu);
        }
    } catch (err) {
        console.error("Lỗi cập nhật danh sách phiếu từ CSDL:", err);
    }
}
