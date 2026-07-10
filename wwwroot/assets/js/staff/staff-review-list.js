/**
 * staff-review-list.js — TechSupport Viettel Admin
 * Điều khiển danh sách đánh giá khách hàng (tìm kiếm, lọc, phân trang, responsive).
 */

(function() {
    'use strict';

    // DỮ LIỆU GIẢ LẬP LIÊN KẾT TỪ DATABASE (Bảng DanhGia + PhieuHoTro + KhachHang + NhanVien)
    const DATABASE_REVIEWS = [
        {
            idDanhGia: 1,
            maPhieu: "HT001245",
            tieuDePhieu: "Không kết nối được máy in mạng LAN",
            hoTenKhachHang: "Nguyễn Văn A",
            hoTenNhanVien: "Trần Văn B",
            chatLuongDichVu: 5,
            thaiDoNhanVien: 4,
            tocDoXuLy: 5,
            nhanXet: "Nhân viên hỗ trợ nhiệt tình, xử lý nhanh và hướng dẫn chi tiết dễ hiểu.",
            ngayDanhGia: "2026-06-14",
            daPhanHoi: true
        },
        {
            idDanhGia: 2,
            maPhieu: "HT001246",
            tieuDePhieu: "Đường truyền cáp quang chập chờn ban tối",
            hoTenKhachHang: "Lê Hoàng Nam",
            hoTenNhanVien: "Trần Văn B",
            chatLuongDichVu: 4,
            thaiDoNhanVien: 4,
            tocDoXuLy: 4,
            nhanXet: "Khắc phục xong mạng chạy ổn định hơn, tốc độ phản hồi khá nhanh.",
            ngayDanhGia: "2026-06-15",
            daPhanHoi: false
        },
        {
            idDanhGia: 3,
            maPhieu: "HT001247",
            tieuDePhieu: "Lỗi cấu hình Modem Wifi tầng 2 không bắt được sóng",
            hoTenKhachHang: "Phạm Minh Tuấn",
            hoTenNhanVien: "Nguyễn Thị C",
            chatLuongDichVu: 5,
            thaiDoNhanVien: 5,
            tocDoXuLy: 5,
            nhanXet: "Rất hài lòng, kỹ thuật viên rất lễ phép và làm việc cực kỳ chuyên nghiệp.",
            ngayDanhGia: "2026-06-15",
            daPhanHoi: true
        },
        {
            idDanhGia: 4,
            maPhieu: "HT001248",
            tieuDePhieu: "Hỏi đáp hóa đơn điện tử không hiển thị VAT",
            hoTenKhachHang: "Trần Thanh Thảo",
            hoTenNhanVien: "Nguyễn Văn D",
            chatLuongDichVu: 3,
            thaiDoNhanVien: 3,
            tocDoXuLy: 2,
            nhanXet: "Xử lý hơi chậm, tôi phải gọi lên tổng đài 2 lần mới giải quyết xong.",
            ngayDanhGia: "2026-06-10",
            daPhanHoi: false
        },
        {
            idDanhGia: 5,
            maPhieu: "HT001249",
            tieuDePhieu: "Đăng ký thêm thiết bị truyền hình Viettel TV",
            hoTenKhachHang: "Hoàng Văn Khánh",
            hoTenNhanVien: "Nguyễn Thị C",
            chatLuongDichVu: 5,
            thaiDoNhanVien: 5,
            tocDoXuLy: 4,
            nhanXet: "Lắp đặt nhanh gọn, giao diện tivi rất dễ sử dụng.",
            ngayDanhGia: "2026-06-12",
            daPhanHoi: false
        },
        {
            idDanhGia: 6,
            maPhieu: "HT001250",
            tieuDePhieu: "Mất tín hiệu truyền hình cáp cục bộ",
            hoTenKhachHang: "Đỗ Thị Mai",
            hoTenNhanVien: "Trần Văn B",
            chatLuongDichVu: 5,
            thaiDoNhanVien: 4,
            tocDoXuLy: 5,
            nhanXet: "Khắc phục sự cố nhanh, nhân viên trực tối rất nhiệt tình.",
            ngayDanhGia: "2026-06-16",
            daPhanHoi: true
        },
        {
            idDanhGia: 7,
            maPhieu: "HT001251",
            tieuDePhieu: "Cấu hình IP tĩnh cho camera giám sát",
            hoTenKhachHang: "Vũ Minh Anh",
            hoTenNhanVien: "Nguyễn Văn D",
            chatLuongDichVu: 2,
            thaiDoNhanVien: 3,
            tocDoXuLy: 2,
            nhanXet: "Kỹ thuật hẹn giờ nhưng đến muộn, cấu hình mãi mới xong camera.",
            ngayDanhGia: "2026-06-08",
            daPhanHoi: false
        },
        {
            idDanhGia: 8,
            maPhieu: "HT001252",
            tieuDePhieu: "Chậm tải file đi quốc tế cổng GPON",
            hoTenKhachHang: "Bùi Anh Đức",
            hoTenNhanVien: "Trần Văn B",
            chatLuongDichVu: 4,
            thaiDoNhanVien: 5,
            tocDoXuLy: 5,
            nhanXet: "Tốc độ trong nước nhanh, quốc tế cải thiện đôi chút. Kỹ thuật rất tận tâm.",
            ngayDanhGia: "2026-06-17",
            daPhanHoi: true
        },
        {
            idDanhGia: 9,
            maPhieu: "HT001253",
            tieuDePhieu: "Thay đổi thông tin hợp đồng internet cá nhân",
            hoTenKhachHang: "Phan Thanh Sơn",
            hoTenNhanVien: "Nguyễn Văn D",
            chatLuongDichVu: 4,
            thaiDoNhanVien: 3,
            tocDoXuLy: 3,
            nhanXet: "Thủ tục hơi lâu nhưng nhân viên quầy và hỗ trợ qua điện thoại vẫn ôn hòa.",
            ngayDanhGia: "2026-06-11",
            daPhanHoi: false
        },
        {
            idDanhGia: 10,
            maPhieu: "HT001254",
            tieuDePhieu: "Hỗ trợ cài đặt VPN doanh nghiệp",
            hoTenKhachHang: "Công ty Cổ phần TechVina",
            hoTenNhanVien: "Trần Văn B",
            chatLuongDichVu: 5,
            thaiDoNhanVien: 5,
            tocDoXuLy: 5,
            nhanXet: "Hỗ trợ tuyệt vời! Thiết lập VPN định tuyến nhanh và an toàn.",
            ngayDanhGia: "2026-06-16",
            daPhanHoi: true
        },
        {
            idDanhGia: 11,
            maPhieu: "HT001255",
            tieuDePhieu: "Lỗi đứt cáp thuê bao do xe tải quệt qua",
            hoTenKhachHang: "Lý Quốc Khánh",
            hoTenNhanVien: "Nguyễn Thị C",
            chatLuongDichVu: 5,
            thaiDoNhanVien: 4,
            tocDoXuLy: 5,
            nhanXet: "Kéo lại dây mới nhanh chóng, gia cố chắc chắn.",
            ngayDanhGia: "2026-06-17",
            daPhanHoi: false
        },
        {
            idDanhGia: 12,
            maPhieu: "HT001256",
            tieuDePhieu: "Sự cố suy hao tín hiệu suy giảm băng thông",
            hoTenKhachHang: "Đặng Tiến Dũng",
            hoTenNhanVien: "Nguyễn Văn D",
            chatLuongDichVu: 3,
            thaiDoNhanVien: 4,
            tocDoXuLy: 3,
            nhanXet: "Hỗ trợ tạm ổn, chất lượng đường truyền thỉnh thoảng vẫn rớt gói.",
            ngayDanhGia: "2026-06-13",
            daPhanHoi: false
        }
    ];

    // CẤU HÌNH PHÂN TRANG VÀ LỌC DỮ LIỆU
    let filteredReviews = [...DATABASE_REVIEWS];
    let currentPage = 1;
    const pageSize = 5; // Hiển thị 5 dòng mỗi trang để trình diễn phân trang

    document.addEventListener("DOMContentLoaded", function() {
        populateStaffDropdown();
        calculateOverviewStats();
        applyFiltersAndRender();
        initFilterEvents();
    });

    /**
     * Tự động thêm danh sách nhân viên vào ô Dropdown bộ lọc
     */
    function populateStaffDropdown() {
        const staffSelect = document.getElementById("filterStaff");
        if (!staffSelect) return;

        // Trích xuất danh sách nhân viên duy nhất từ database
        const staffNames = [...new Set(DATABASE_REVIEWS.map(item => item.hoTenNhanVien))];
        
        staffNames.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            staffSelect.appendChild(option);
        });
    }

    /**
     * Tính toán số liệu thống kê tổng quan (4 Card đầu trang)
     * Thống kê dựa trên toàn bộ cơ sở dữ liệu ban đầu
     */
    function calculateOverviewStats() {
        const totalCount = DATABASE_REVIEWS.length;
        
        // Điểm TB toàn bộ
        let totalScoreSum = 0;
        let count5Star = 0;
        let countUnhappy = 0; // Điểm TB dưới 3

        DATABASE_REVIEWS.forEach(item => {
            const avg = (item.chatLuongDichVu + item.thaiDoNhanVien + item.tocDoXuLy) / 3;
            totalScoreSum += avg;
            if (avg >= 4.5) {
                count5Star++;
            }
            if (avg < 3.0) {
                countUnhappy++;
            }
        });

        const globalAverage = totalCount > 0 ? (totalScoreSum / totalCount).toFixed(1) : "0.0";

        // Gán lên HTML
        document.getElementById("statTotalReviews").textContent = totalCount;
        document.getElementById("statAverageScore").textContent = `${globalAverage} ★`;
        document.getElementById("stat5StarCount").textContent = count5Star;
        document.getElementById("statUnhappyCount").textContent = countUnhappy;
    }

    /**
     * Lắng nghe sự kiện click Tìm kiếm và Reset
     */
    function initFilterEvents() {
        const btnSearch = document.getElementById("btnFilterSearch");
        const btnReset = document.getElementById("btnFilterReset");

        if (btnSearch) {
            btnSearch.addEventListener("click", function(e) {
                e.preventDefault();
                currentPage = 1; // reset về trang 1 khi lọc mới
                applyFiltersAndRender();
            });
        }

        if (btnReset) {
            btnReset.addEventListener("click", function(e) {
                e.preventDefault();
                document.getElementById("filterTicketCode").value = "";
                document.getElementById("filterCustomerName").value = "";
                document.getElementById("filterStaff").value = "all";
                document.getElementById("filterScore").value = "all";
                document.getElementById("filterFromDate").value = "";
                document.getElementById("filterToDate").value = "";
                
                currentPage = 1;
                filteredReviews = [...DATABASE_REVIEWS];
                renderPage();
            });
        }
    }

    /**
     * Thực hiện bộ lọc dữ liệu và vẽ giao diện
     */
    function applyFiltersAndRender() {
        const ticketCodeQuery = document.getElementById("filterTicketCode").value.trim().toLowerCase();
        const customerQuery = document.getElementById("filterCustomerName").value.trim().toLowerCase();
        const staffQuery = document.getElementById("filterStaff").value;
        const scoreQuery = document.getElementById("filterScore").value;
        const fromDateQuery = document.getElementById("filterFromDate").value;
        const toDateQuery = document.getElementById("filterToDate").value;

        filteredReviews = DATABASE_REVIEWS.filter(item => {
            // 1. Lọc theo mã phiếu
            if (ticketCodeQuery && !item.maPhieu.toLowerCase().includes(ticketCodeQuery)) {
                return false;
            }
            
            // 2. Lọc theo khách hàng
            if (customerQuery && !item.hoTenKhachHang.toLowerCase().includes(customerQuery)) {
                return false;
            }

            // 3. Lọc theo nhân viên
            if (staffQuery !== "all" && item.hoTenNhanVien !== staffQuery) {
                return false;
            }

            // 4. Lọc theo điểm đánh giá trung bình tròn sao
            const avg = (item.chatLuongDichVu + item.thaiDoNhanVien + item.tocDoXuLy) / 3;
            if (scoreQuery !== "all") {
                const targetScore = parseInt(scoreQuery);
                // Lọc theo khoảng sao ví dụ 5 sao <=> avg >= 4.5
                if (targetScore === 5 && avg < 4.5) return false;
                if (targetScore === 4 && (avg < 3.5 || avg >= 4.5)) return false;
                if (targetScore === 3 && (avg < 2.5 || avg >= 3.5)) return false;
                if (targetScore === 2 && (avg < 1.5 || avg >= 2.5)) return false;
                if (targetScore === 1 && avg >= 1.5) return false;
            }

            // 5. Lọc theo ngày đánh giá
            if (fromDateQuery && item.ngayDanhGia < fromDateQuery) {
                return false;
            }
            if (toDateQuery && item.ngayDanhGia > toDateQuery) {
                return false;
            }

            return true;
        });

        renderPage();
    }

    /**
     * Vẽ giao diện dựa vào dữ liệu đã được lọc và phân trang hiện tại
     */
    function renderPage() {
        const totalItems = filteredReviews.length;
        const totalPages = Math.ceil(totalItems / pageSize) || 1;

        // Điều chỉnh trang hiện tại nếu vượt quá giới hạn
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);
        const paginatedItems = filteredReviews.slice(startIndex, endIndex);

        const tableBody = document.getElementById("reviewTableBody");
        const mobileCardsContainer = document.getElementById("mobileCardsList");
        const emptyState = document.getElementById("emptyStatePanel");
        const tableContainer = document.getElementById("desktopTableContainer");
        const pageTextInfo = document.getElementById("paginationTextInfo");

        // Nếu không có kết quả lọc
        if (totalItems === 0) {
            if (tableContainer) tableContainer.style.display = "none";
            if (mobileCardsContainer) mobileCardsContainer.parentElement.style.display = "none";
            if (emptyState) emptyState.style.display = "block";
            if (pageTextInfo) pageTextInfo.textContent = "Hiển thị 0-0 trong 0 đánh giá";
            renderPagination(1);
            return;
        }

        // Hiện bảng / Card view tương ứng
        if (emptyState) emptyState.style.display = "none";
        
        // Cần kiểm tra xem mobile hay desktop đang hoạt động (CSS điều khiển ẩn hiện wrapper, nhưng JS điền cả hai)
        if (tableContainer) {
            tableContainer.style.display = "block";
        }
        if (mobileCardsContainer) {
            mobileCardsContainer.parentElement.style.display = "block";
        }

        // 1. RENDER DESKTOP TABLE
        if (tableBody) {
            tableBody.innerHTML = "";
            paginatedItems.forEach((item, index) => {
                const stt = startIndex + index + 1;
                const avgScore = ((item.chatLuongDichVu + item.thaiDoNhanVien + item.tocDoXuLy) / 3).toFixed(1);
                
                // Badges
                const satBadge = getSatisfactionBadgeHTML(avgScore);
                const replyBadge = item.daPhanHoi 
                    ? `<span class="reply-status-badge replied">Đã phản hồi</span>`
                    : `<span class="reply-status-badge not-replied">Chưa phản hồi</span>`;
                
                const html = `
                    <tr>
                        <td class="fw-bold">${stt}</td>
                        <td class="font-monospace text-primary fw-bold">${item.maPhieu}</td>
                        <td>${item.hoTenKhachHang}</td>
                        <td class="text-danger fw-semibold">${item.hoTenNhanVien}</td>
                        <td><span class="table-star-rating">${renderStars(item.chatLuongDichVu)}</span></td>
                        <td><span class="table-star-rating">${renderStars(item.thaiDoNhanVien)}</span></td>
                        <td><span class="table-star-rating">${renderStars(item.tocDoXuLy)}</span></td>
                        <td><strong class="text-dark">${avgScore}</strong> ${satBadge}</td>
                        <td class="font-monospace">${formatDate(item.ngayDanhGia)}</td>
                        <td>${replyBadge}</td>
                        <td class="text-center">
                            <a href="staff-review-detail.html?id=${item.idDanhGia}" class="btn-detail-eye" title="Xem chi tiết">
                                <i class="fa-solid fa-eye"></i>
                            </a>
                        </td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', html);
            });
        }

        // 2. RENDER MOBILE CARDS LIST
        if (mobileCardsContainer) {
            mobileCardsContainer.innerHTML = "";
            paginatedItems.forEach(item => {
                const avgScore = ((item.chatLuongDichVu + item.thaiDoNhanVien + item.tocDoXuLy) / 3).toFixed(1);
                const satBadge = getSatisfactionBadgeHTML(avgScore);
                
                const html = `
                    <div class="mobile-review-card">
                        <div class="mobile-card-header">
                            <div>
                                <span class="mobile-card-ticket">${item.maPhieu}</span>
                                <h3 class="mobile-card-customer">${item.hoTenKhachHang}</h3>
                            </div>
                            <span class="mobile-card-date">${formatDate(item.ngayDanhGia)}</span>
                        </div>
                        <div class="mobile-card-body-row">
                            <span class="mobile-card-body-label">Nhân viên:</span>
                            <span class="mobile-card-body-val text-danger">${item.hoTenNhanVien}</span>
                        </div>
                        <div class="mobile-card-body-row">
                            <span class="mobile-card-body-label">Chất lượng:</span>
                            <span class="mobile-card-stars">${renderStars(item.chatLuongDichVu)}</span>
                        </div>
                        <div class="mobile-card-body-row">
                            <span class="mobile-card-body-label">Điểm TB:</span>
                            <span class="mobile-card-body-val"><strong>${avgScore}</strong> / 5</span>
                        </div>
                        <div class="mobile-card-footer">
                            ${satBadge}
                            <a href="staff-review-detail.html?id=${item.idDanhGia}" class="mobile-card-action-link">
                                Xem chi tiết <i class="fa-solid fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                `;
                mobileCardsContainer.insertAdjacentHTML('beforeend', html);
            });
        }

        // Cập nhật text hiển thị số dòng
        if (pageTextInfo) {
            pageTextInfo.textContent = `Hiển thị ${startIndex + 1}-${endIndex} trong ${totalItems} đánh giá`;
        }

        // Vẽ cụm phân trang
        renderPagination(totalPages);
    }

    /**
     * Vẽ cụm Pagination phân trang HTML
     */
    function renderPagination(totalPages) {
        const paginationList = document.getElementById("reviewPagination");
        if (!paginationList) return;

        paginationList.innerHTML = "";

        // Nút Trước
        const prevClass = currentPage === 1 ? "disabled" : "";
        paginationList.insertAdjacentHTML('beforeend', `
            <li class="page-item ${prevClass}">
                <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Trước">
                    « Trước
                </a>
            </li>
        `);

        // Các nút số trang
        for (let i = 1; i <= totalPages; i++) {
            const activeClass = i === currentPage ? "active" : "";
            paginationList.insertAdjacentHTML('beforeend', `
                <li class="page-item ${activeClass}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
        }

        // Nút Sau
        const nextClass = currentPage === totalPages ? "disabled" : "";
        paginationList.insertAdjacentHTML('beforeend', `
            <li class="page-item ${nextClass}">
                <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Sau">
                    Sau »
                </a>
            </li>
        `);

        // Gắn sự kiện click cho các nút phân trang
        paginationList.querySelectorAll(".page-link").forEach(link => {
            link.addEventListener("click", function(e) {
                e.preventDefault();
                const page = parseInt(this.getAttribute("data-page"));
                if (page && page !== currentPage && page >= 1 && page <= totalPages) {
                    currentPage = page;
                    renderPage();
                    // Cuộn nhẹ lên trên bảng khi chuyển trang
                    const tableContainer = document.getElementById("desktopTableContainer");
                    if (tableContainer) {
                        tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    }

    /**
     * Trả về HTML Badge trạng thái hài lòng dựa vào điểm số
     */
    function getSatisfactionBadgeHTML(avgScore) {
        const score = parseFloat(avgScore);
        if (score >= 4.5) {
            return `<span class="satisfaction-badge sentiment-positive">Rất hài lòng</span>`;
        } else if (score >= 3.0) {
            return `<span class="satisfaction-badge sentiment-moderate">Hài lòng</span>`;
        } else {
            return `<span class="satisfaction-badge sentiment-negative">Chưa hài lòng</span>`;
        }
    }

    /**
     * Sinh chuỗi ngôi sao HTML tương ứng số điểm
     */
    function renderStars(rating) {
        let starsHTML = "";
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHTML += "★";
            } else {
                starsHTML += "☆";
            }
        }
        return starsHTML;
    }

    /**
     * Định dạng chuỗi ngày YYYY-MM-DD sang DD/MM/YYYY
     */
    function formatDate(dateStr) {
        if (!dateStr) return "—";
        const parts = dateStr.split("-");
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    }

})();
