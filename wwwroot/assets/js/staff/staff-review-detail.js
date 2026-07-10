/**
 * staff-review-detail.js — TechSupport Viettel Admin
 * Xử lý logic nghiệp vụ và tương tác giao diện trang chi tiết đánh giá khách hàng.
 */

(function() {
    'use strict';

    // Dữ liệu mẫu giả lập trước khi kết nối API Backend
    const REVIEW_DATA = {
        ticket: {
            code: "HT000123",
            title: "Không kết nối được máy in mạng LAN văn phòng",
            customerName: "Nguyễn Văn A",
            serviceName: "Hỗ trợ phần cứng",
            assigneeName: "Trần Văn B",
            createdDate: "12/06/2026 08:30",
            completedDate: "13/06/2026 14:00",
            status: "Đã hoàn thành"
        },
        ratings: {
            serviceQuality: 5,
            staffAttitude: 4,
            processingSpeed: 5,
            average: 4.67
        },
        comment: "Nhân viên hỗ trợ rất nhiệt tình. Xử lý nhanh và hướng dẫn dễ hiểu.",
        attachments: [
            { src: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=800&auto=format&fit=crop&q=60", caption: "Ảnh chụp màn hình lỗi kết nối máy in 1" },
            { src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60", caption: "Ảnh máy in báo lỗi ngoại tuyến 2" },
            { src: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60", caption: "Cài đặt Driver máy in thành công 3" },
            { src: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=60", caption: "Tài liệu hướng dẫn sử dụng nhanh 4" }
        ],
        timeline: [
            {
                time: "14/06/2026 09:30",
                author: "Trần Văn B",
                role: "staff",
                roleText: "Kỹ thuật viên",
                message: "Cảm ơn anh/chị đã dành thời gian đánh giá dịch vụ. Chúng tôi luôn mong muốn đem lại trải nghiệm tốt nhất cho quý khách."
            },
            {
                time: "15/06/2026 14:00",
                author: "Nguyễn Văn A",
                role: "customer",
                roleText: "Khách hàng",
                message: "Cảm ơn đội ngũ hỗ trợ. Driver máy in chạy rất mượt và không bị lỗi ngắt kết nối giữa chừng nữa."
            }
        ]
    };

    let ratingChart = null;

    // Chạy khi trang sẵn sàng
    document.addEventListener("DOMContentLoaded", function() {
        initPageData();
        initRadarChart();
        initLightbox();
        initReplyForm();
        syncChartTheme();
    });

    /**
     * Điền thông tin dữ liệu mẫu vào trang
     */
    function initPageData() {
        // Thông tin phiếu
        document.getElementById("ticketCode").textContent = REVIEW_DATA.ticket.code;
        document.getElementById("ticketTitle").textContent = REVIEW_DATA.ticket.title;
        document.getElementById("customerName").textContent = REVIEW_DATA.ticket.customerName;
        document.getElementById("serviceName").textContent = REVIEW_DATA.ticket.serviceName;
        document.getElementById("assigneeName").textContent = REVIEW_DATA.ticket.assigneeName;
        document.getElementById("createdDate").textContent = REVIEW_DATA.ticket.createdDate;
        document.getElementById("completedDate").textContent = REVIEW_DATA.ticket.completedDate;
        
        // Trạng thái phiếu
        const statusBadge = document.getElementById("ticketStatusBadge");
        statusBadge.textContent = REVIEW_DATA.ticket.status;
        statusBadge.className = "badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1.5 fw-bold";

        // Thống kê điểm
        document.getElementById("valServiceQuality").textContent = `${REVIEW_DATA.ratings.serviceQuality}/5`;
        document.getElementById("valStaffAttitude").textContent = `${REVIEW_DATA.ratings.staffAttitude}/5`;
        document.getElementById("valProcessingSpeed").textContent = `${REVIEW_DATA.ratings.processingSpeed}/5`;
        document.getElementById("valAverageScore").textContent = REVIEW_DATA.ratings.average.toFixed(2);

        // Sinh số sao hiển thị
        renderMiniStars("starsServiceQuality", REVIEW_DATA.ratings.serviceQuality);
        renderMiniStars("starsStaffAttitude", REVIEW_DATA.ratings.staffAttitude);
        renderMiniStars("starsProcessingSpeed", REVIEW_DATA.ratings.processingSpeed);

        // Nhận xét khách hàng
        document.getElementById("customerCommentText").textContent = `"${REVIEW_DATA.comment}"`;

        // File đính kèm Gallery
        const galleryContainer = document.getElementById("reviewGallery");
        galleryContainer.innerHTML = "";
        REVIEW_DATA.attachments.forEach((file, index) => {
            const html = `
                <div class="gallery-image-wrapper" data-src="${file.src}" data-caption="${file.caption}">
                    <img src="${file.src}" alt="${file.caption}" loading="lazy">
                    <div class="gallery-image-overlay">
                        <i class="fa-solid fa-magnifying-glass-plus"></i>
                    </div>
                </div>
            `;
            galleryContainer.insertAdjacentHTML('beforeend', html);
        });

        // AI Insight
        updateAIInsight(REVIEW_DATA.ratings.average);

        // Vẽ Lịch sử timeline
        renderTimeline();
    }

    /**
     * Render sao nhỏ
     */
    function renderMiniStars(elementId, score) {
        const container = document.getElementById(elementId);
        if (!container) return;
        container.innerHTML = "";
        for (let i = 1; i <= 5; i++) {
            if (i <= score) {
                container.insertAdjacentHTML('beforeend', '<i class="fa-solid fa-star"></i>');
            } else {
                container.insertAdjacentHTML('beforeend', '<i class="fa-regular fa-star text-muted"></i>');
            }
        }
    }

    /**
     * Cập nhật AI Insight dựa theo điểm trung bình
     */
    function updateAIInsight(averageScore) {
        const box = document.getElementById("aiInsightBox");
        const icon = document.getElementById("aiInsightIcon");
        const title = document.getElementById("aiInsightTitle");
        const message = document.getElementById("aiInsightMessage");

        if (averageScore >= 4.5) {
            box.className = "ai-insight-box sentiment-positive";
            icon.className = "ai-insight-icon fa-solid fa-face-laugh-beam";
            title.textContent = "AI Insight - Rất hài lòng";
            message.textContent = "Khách hàng rất hài lòng với chất lượng hỗ trợ.";
        } else if (averageScore >= 3.0) {
            box.className = "ai-insight-box sentiment-moderate";
            icon.className = "ai-insight-icon fa-solid fa-face-meh";
            title.textContent = "AI Insight - Hài lòng trung bình";
            message.textContent = "Khách hàng hài lòng nhưng vẫn còn cơ hội cải thiện.";
        } else {
            box.className = "ai-insight-box sentiment-negative";
            icon.className = "ai-insight-icon fa-solid fa-face-frown-open";
            title.textContent = "AI Insight - Chưa hài lòng";
            message.textContent = "Khách hàng chưa hài lòng với dịch vụ hỗ trợ.";
        }
    }

    /**
     * Vẽ biểu đồ Radar bằng Chart.js
     */
    function initRadarChart() {
        const ctx = document.getElementById("ratingRadarChart").getContext("2d");
        const isDarkMode = document.documentElement.getAttribute("data-bs-theme") === "dark";

        const labelColor = isDarkMode ? "#94A3B8" : "#475569";
        const gridColor = isDarkMode ? "#334155" : "#E2E8F0";
        const angleLineColor = isDarkMode ? "#334155" : "#E2E8F0";

        ratingChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Chất lượng dịch vụ', 'Thái độ nhân viên', 'Tốc độ xử lý'],
                datasets: [{
                    label: 'Điểm đánh giá',
                    data: [
                        REVIEW_DATA.ratings.serviceQuality,
                        REVIEW_DATA.ratings.staffAttitude,
                        REVIEW_DATA.ratings.processingSpeed
                    ],
                    backgroundColor: 'rgba(13, 110, 253, 0.2)',
                    borderColor: '#0d6efd',
                    borderWidth: 2,
                    pointBackgroundColor: '#0d6efd',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#0d6efd',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}/5`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        min: 0,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            showLabelBackdrop: false,
                            color: labelColor
                        },
                        grid: {
                            color: gridColor
                        },
                        angleLines: {
                            color: angleLineColor
                        },
                        pointLabels: {
                            color: labelColor,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12,
                                weight: '600'
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Đồng bộ màu biểu đồ khi đổi theme tối/sáng
     */
    function syncChartTheme() {
        const toggleBtn = document.getElementById("toggleTheme");
        if (!toggleBtn) return;

        toggleBtn.addEventListener("click", function() {
            setTimeout(function() {
                const isDarkMode = document.documentElement.getAttribute("data-bs-theme") === "dark";
                const labelColor = isDarkMode ? "#94A3B8" : "#475569";
                const gridColor = isDarkMode ? "#334155" : "#E2E8F0";
                const angleLineColor = isDarkMode ? "#334155" : "#E2E8F0";

                if (ratingChart) {
                    ratingChart.options.scales.r.ticks.color = labelColor;
                    ratingChart.options.scales.r.grid.color = gridColor;
                    ratingChart.options.scales.r.angleLines.color = angleLineColor;
                    ratingChart.options.scales.r.pointLabels.color = labelColor;
                    ratingChart.update();
                }
            }, 100); // Trì hoãn 100ms chờ class html cập nhật
        });
    }

    /**
     * Lightbox Popup phóng to hình ảnh
     */
    function initLightbox() {
        const lightbox = document.getElementById("lightboxModal");
        const lightboxImg = document.getElementById("lightboxImage");
        const lightboxCaption = document.getElementById("lightboxCaption");
        const closeBtn = document.getElementById("lightboxClose");

        if (!lightbox) return;

        // Bấm vào ảnh mở Lightbox
        document.getElementById("reviewGallery").addEventListener("click", function(e) {
            const wrapper = e.target.closest(".gallery-image-wrapper");
            if (!wrapper) return;

            const src = wrapper.getAttribute("data-src");
            const caption = wrapper.getAttribute("data-caption");

            lightboxImg.src = src;
            lightboxCaption.textContent = caption;
            lightbox.classList.add("show");
        });

        // Bấm đóng
        closeBtn.addEventListener("click", closeLightbox);
        
        // Bấm nền đóng
        lightbox.addEventListener("click", function(e) {
            if (e.target === lightbox || e.target.closest(".lightbox-content-box") === null && e.target !== lightboxImg) {
                closeLightbox();
            }
        });

        // Bấm Esc đóng
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape" && lightbox.classList.contains("show")) {
                closeLightbox();
            }
        });

        function closeLightbox() {
            lightbox.classList.remove("show");
            setTimeout(() => {
                lightboxImg.src = "";
                lightboxCaption.textContent = "";
            }, 300);
        }
    }

    /**
     * Logic ô phản hồi và xử lý submit gửi phản hồi / lưu nháp
     */
    function initReplyForm() {
        const textarea = document.getElementById("replyTextarea");
        const counter = document.getElementById("replyCharCounter");
        const btnSubmit = document.getElementById("btnSubmitReply");
        const btnSaveDraft = document.getElementById("btnSaveDraft");
        const btnGoBack = document.getElementById("btnGoBack");

        if (!textarea) return;

        // Xử lý đếm ký tự
        textarea.addEventListener("input", function() {
            const length = textarea.value.length;
            counter.textContent = `${length} / 1000`;
            if (length > 1000) {
                counter.classList.add("text-danger");
            } else {
                counter.classList.remove("text-danger");
            }
        });

        // Xử lý bấm quay lại
        if (btnGoBack) {
            btnGoBack.addEventListener("click", function() {
                window.location.href = "staff-ticket-management.html";
            });
        }

        // Xử lý lưu nháp
        if (btnSaveDraft) {
            btnSaveDraft.addEventListener("click", function() {
                Swal.fire({
                    title: 'Đã lưu nháp!',
                    text: 'Nội dung phản hồi đánh giá đã được lưu vào bản nháp.',
                    icon: 'success',
                    confirmButtonText: 'Đồng ý',
                    customClass: {
                        confirmButton: 'btn btn-success px-4'
                    },
                    buttonsStyling: false
                });
            });
        }

        // Xử lý gửi phản hồi
        if (btnSubmit) {
            btnSubmit.addEventListener("click", function() {
                const messageText = textarea.value.trim();
                
                if (!messageText) {
                    Swal.fire({
                        title: 'Thiếu thông tin!',
                        text: 'Vui lòng nhập nội dung phản hồi trước khi gửi.',
                        icon: 'warning',
                        confirmButtonText: 'Nhập lại',
                        customClass: {
                            confirmButton: 'btn btn-primary px-4'
                        },
                        buttonsStyling: false
                    });
                    return;
                }

                if (messageText.length > 1000) {
                    Swal.fire({
                        title: 'Vượt quá giới hạn!',
                        text: 'Nội dung phản hồi không được dài quá 1000 ký tự.',
                        icon: 'error',
                        confirmButtonText: 'Chỉnh sửa',
                        customClass: {
                            confirmButton: 'btn btn-danger px-4'
                        },
                        buttonsStyling: false
                    });
                    return;
                }

                // Trạng thái Loading Spinner
                const originalText = btnSubmit.innerHTML;
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang gửi...`;

                // Giả lập gọi API Backend (1.5 giây)
                setTimeout(function() {
                    // Thêm phản hồi vào lịch sử
                    const now = new Date();
                    const timeString = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
                    
                    REVIEW_DATA.timeline.push({
                        time: timeString,
                        author: "Trần Văn B",
                        role: "staff",
                        roleText: "Kỹ thuật viên",
                        message: messageText
                    });

                    // Vẽ lại timeline
                    renderTimeline();

                    // Reset textarea
                    textarea.value = "";
                    counter.textContent = "0 / 1000";

                    // Tắt loading
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = originalText;

                    // Thông báo thành công
                    Swal.fire({
                        title: 'Gửi phản hồi thành công!',
                        text: 'Phản hồi của bạn đã được gửi tới khách hàng.',
                        icon: 'success',
                        confirmButtonText: 'Tuyệt vời',
                        customClass: {
                            confirmButton: 'btn btn-success px-4'
                        },
                        buttonsStyling: false
                    });

                }, 1500);
            });
        }
    }

    /**
     * Vẽ Timeline lịch sử phản hồi
     */
    function renderTimeline() {
        const container = document.getElementById("timelineLog");
        if (!container) return;

        container.innerHTML = "";
        
        // Vẽ ngược lại hoặc xuôi? Theo thứ tự thời gian tăng dần từ trên xuống
        REVIEW_DATA.timeline.forEach(item => {
            const nodeClass = item.role === 'customer' ? 'customer-node' : 'staff-node';
            const roleBadgeClass = item.role === 'customer' ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-success-subtle text-success border border-success-subtle';
            
            const html = `
                <div class="crm-timeline-item">
                    <div class="crm-timeline-dot ${nodeClass}"></div>
                    <div class="crm-timeline-header">
                        <div>
                            <span class="crm-timeline-author">${item.author}</span>
                            <span class="crm-timeline-role-badge ${roleBadgeClass}">${item.roleText}</span>
                        </div>
                        <span class="crm-timeline-time">${item.time}</span>
                    </div>
                    <div class="crm-timeline-bubble">
                        ${item.message.replace(/\n/g, '<br>')}
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        });
    }

    // Tiện ích đệm số 0
    function pad(num) {
        return num < 10 ? '0' + num : num;
    }

})();
