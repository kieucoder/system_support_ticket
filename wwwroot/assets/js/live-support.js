/* -------------------------------------------------------------
 * FILE: wwwroot/assets/js/live-support.js
 * AUTHOR: Antigravity
 * DESCRIPTION: Premium interactive frontend scripts for Live Support Chat (Giai đoạn 2)
 *              Handles simulations, skeletons, mobile toggles, and search connect.
 * ------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const chatMessagesPane = document.getElementById("chatMessagesPane");
    const staffSidebar = document.getElementById("staffSidebar");
    const chatInputField = document.getElementById("chatInputField");
    const chatSendBtn = document.getElementById("chatSendBtn");
    const emojiPickerBtn = document.getElementById("emojiPickerBtn");
    const emojiPickerPopup = document.getElementById("emojiPickerPopup");
    const toggleStatusBtn = document.getElementById("toggleStatusBtn");
    const offlineWarningBanner = document.getElementById("offlineWarningBanner");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const btnMobileSidebarToggle = document.getElementById("btnMobileSidebarToggle");
    
    // Lightbox modal elements
    const lightboxModal = document.getElementById("chatLightboxModal");
    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxClose = document.getElementById("lightboxClose");

    // File/Image upload actions
    const fileUploadBtn = document.getElementById("fileUploadBtn");
    const imageUploadBtn = document.getElementById("imageUploadBtn");
    const hiddenFileUpload = document.getElementById("hiddenFileUpload");
    const hiddenImageUpload = document.getElementById("hiddenImageUpload");
    const filePreviewBar = document.getElementById("filePreviewBar");

    // Hero search elements
    const heroSearchInput = document.getElementById("heroSearchInput");
    const btnSearchConnect = document.getElementById("btnSearchConnect");

    let isStaffOnline = true;

    // Helper: Scroll to bottom
    function scrollToBottom() {
        if (chatMessagesPane) {
            chatMessagesPane.scrollTop = chatMessagesPane.scrollHeight;
        }
    }

    // Helper: Focus input
    function focusInput() {
        if (chatInputField) {
            chatInputField.focus();
        }
    }

    // ==========================================
    // 1. SKELETON LOADER SIMULATION
    // ==========================================
    function simulateLoading() {
        if (chatMessagesPane) {
            chatMessagesPane.innerHTML = `
                <div class="chat-empty-state">
                    <div class="spinner-border text-danger mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="text-muted">Đang thiết lập kết nối bảo mật SLA Viettel...</p>
                </div>
            `;
        }

        if (staffSidebar) {
            staffSidebar.innerHTML = `
                <div class="sidebar-header">
                    <h2>Nhân viên phụ trách</h2>
                </div>
                <div class="sidebar-content">
                    <div class="d-flex flex-column align-items-center py-4">
                        <div class="skeleton-avatar mb-3"></div>
                        <div class="skeleton-line mb-2" style="width: 140px;"></div>
                        <div class="skeleton-line mb-2" style="width: 100px;"></div>
                        <div class="skeleton-line" style="width: 80px;"></div>
                    </div>
                </div>
            `;
        }

        setTimeout(() => {
            renderChatHistory();
            renderSidebarInfo();
            scrollToBottom();
        }, 1200);
    }

    // Render mockup chat history
    function renderChatHistory() {
        if (!chatMessagesPane) return;
        
        chatMessagesPane.innerHTML = `
            <div class="chat-date-separator">
                <span class="chat-date-text">Hôm nay, 17/07/2026</span>
            </div>

            <!-- Staff Message -->
            <div class="chat-message-row staff">
                <div class="chat-message-item">
                    Xin chào anh/chị! Tôi là <strong>Nguyễn Văn Hùng</strong>, kỹ sư hỗ trợ kỹ thuật của Viettel. Tôi đã nhận được yêu cầu xử lý phiếu sự cố mã số <strong>PHT001</strong> về tình trạng suy hao đường truyền Internet của anh chị.
                </div>
                <div class="chat-message-meta">09:15 • Nhân viên</div>
            </div>

            <!-- Client Message -->
            <div class="chat-message-row client">
                <div class="chat-message-item">
                    Chào Hùng, mạng nhà mình từ sáng đến giờ rất chậm, ping cao và không load nổi video YouTube. Bạn kiểm tra giúp mình với.
                </div>
                <div class="chat-message-meta">09:16 • Bạn <span class="text-success ms-1">✓ Đã xem</span></div>
            </div>

            <!-- Staff Message with Attachment -->
            <div class="chat-message-row staff">
                <div class="chat-message-item">
                    Dạ vâng, tôi vừa thực hiện đo kiểm từ xa qua hệ thống hạ tầng và thấy cổng quang nhà mình đang báo tín hiệu suy hao ở mức <strong>-27dBm</strong> (mức tiêu chuẩn kỹ thuật quy định là dưới -25dBm). 
                    Tôi gửi kèm báo cáo kết quả đo kiểm hạ tầng dưới đây. Anh chị xem qua nhé.
                </div>
                <div class="chat-message-meta">09:18 • Nhân viên</div>
            </div>

            <!-- PDF File attachment bubble -->
            <div class="chat-message-row staff">
                <div class="chat-message-item chat-message-file-card">
                    <div class="file-card-icon">
                        <i class="bi bi-file-earmark-pdf-fill"></i>
                    </div>
                    <div class="file-card-details">
                        <span class="file-card-name">KetQuaDoKiem_PHT001.pdf</span>
                        <span class="file-card-size">1.8 MB</span>
                    </div>
                    <button class="file-card-download-btn" title="Tải xuống" type="button">
                        <i class="bi bi-download"></i>
                    </button>
                </div>
                <div class="chat-message-meta">09:18 • Nhân viên</div>
            </div>

            <!-- Client Message with Image -->
            <div class="chat-message-row client">
                <div class="chat-message-item">
                    Mình gửi bạn ảnh chụp các đèn tín hiệu trên modem wifi nhà mình nhé, đèn PON hiện màu xanh lá nhưng nhấp nháy liên tục, đèn LOS thì không sáng.
                </div>
                <div class="chat-message-meta">09:19 • Bạn <span class="text-success ms-1">✓ Đã xem</span></div>
            </div>

            <!-- Image bubble -->
            <div class="chat-message-row client">
                <div class="chat-message-item chat-message-image">
                    <img src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400" alt="Modem Wifi" class="clickable-chat-image" />
                </div>
                <div class="chat-message-meta">09:20 • Bạn <span class="text-success ms-1">✓ Đã xem</span></div>
            </div>

            <!-- Staff Message -->
            <div class="chat-message-row staff">
                <div class="chat-message-item">
                    Cảm ơn anh chị đã cung cấp hình ảnh. Đèn PON nhấp nháy báo hiệu thiết bị đang cố gắng kết nối nhưng không đồng bộ được luồng dữ liệu do suy hao quang.
                    Tôi đang thực hiện cấu hình khởi động lại cổng quang trên trạm để xem có cải thiện được không. Anh chị vui lòng đợi 1-2 phút nhé.
                </div>
                <div class="chat-message-meta">09:21 • Nhân viên</div>
            </div>

            <!-- Typing indicator slot -->
            <div class="typing-indicator-row" id="typingIndicator" style="display: none;">
                <div class="typing-dot-container">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
                <span class="typing-text">Hùng đang nhập...</span>
            </div>
        `;

        // Register lightbox zoom click handlers
        const images = chatMessagesPane.querySelectorAll(".clickable-chat-image");
        images.forEach(img => {
            img.addEventListener("click", () => {
                if (lightboxModal && lightboxImg) {
                    lightboxImg.src = img.src;
                    lightboxModal.classList.add("active");
                }
            });
        });
    }

    // Render detailed staff sidebar info card
    function renderSidebarInfo() {
        if (!staffSidebar) return;
        
        staffSidebar.innerHTML = `
            <div class="sidebar-header">
                <h2>Nhân viên phụ trách</h2>
                <button class="btn-close d-lg-none" id="sidebarCloseBtn" type="button" aria-label="Đóng" style="margin-left:auto;"></button>
            </div>
            <div class="sidebar-content">
                <!-- Profile Card -->
                <div class="staff-profile-card">
                    <div class="staff-avatar-container">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120" alt="Nguyễn Văn Hùng" class="staff-avatar" id="sidebarStaffAvatar" />
                        <span class="staff-avatar-status ${isStaffOnline ? '' : 'offline'}" id="sidebarStaffDot"></span>
                    </div>
                    <div class="staff-name">Nguyễn Văn Hùng</div>
                    <div class="staff-title">Kỹ sư Băng rộng & Cố định</div>
                    <div class="staff-rating"><i class="bi bi-star-fill"></i> 4.9/5 (120 đánh giá)</div>
                    <div class="staff-dept">Trung tâm Kỹ thuật Viettel TP.HCM</div>
                </div>

                <!-- Technical KPI metrics -->
                <div class="sidebar-info-group">
                    <h3>Chỉ số hiệu năng</h3>
                    <div class="info-item">
                        <i class="bi bi-patch-check-fill text-success"></i>
                        <div>
                            <div class="info-label">KPI xử lý</div>
                            <div class="info-value">98.5% Đúng hẹn SLA</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-award-fill text-danger"></i>
                        <div>
                            <div class="info-label">Kinh nghiệm</div>
                            <div class="info-value">5 năm kinh nghiệm</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-check2-all text-primary"></i>
                        <div>
                            <div class="info-label">Phiếu đã xử lý</div>
                            <div class="info-value">250+ Phiếu hỗ trợ</div>
                        </div>
                    </div>
                </div>

                <!-- Contact details -->
                <div class="sidebar-info-group">
                    <h3>Thông tin liên lạc</h3>
                    <div class="info-item">
                        <i class="bi bi-telephone-fill text-danger"></i>
                        <div>
                            <div class="info-label">Số điện thoại</div>
                            <div class="info-value">0981.234.567</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-envelope-fill"></i>
                        <div>
                            <div class="info-label">Email</div>
                            <div class="info-value">hungnv99@viettel.com.vn</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-clock-history"></i>
                        <div>
                            <div class="info-label">Giờ làm việc</div>
                            <div class="info-value">08:00 - 17:30 (Thứ 2 - Thứ 7)</div>
                        </div>
                    </div>
                </div>

                <!-- Regional zone -->
                <div class="sidebar-info-group">
                    <h3>Phạm vi hỗ trợ</h3>
                    <div class="info-item">
                        <i class="bi bi-geo-alt-fill text-danger"></i>
                        <div>
                            <div class="info-label">Khu vực quản lý</div>
                            <div class="info-value">Quận Bình Thạnh, TP.HCM</div>
                        </div>
                    </div>
                </div>

                <!-- Action buttons -->
                <div class="sidebar-actions-btn-group pt-2">
                    <button type="button" class="btn-sidebar-action btn-primary-action" onclick="handleQuickAction('view_profile')">Xem hồ sơ</button>
                    <button type="button" class="btn-sidebar-action" onclick="handleQuickAction('change_staff')">Đổi nhân viên</button>
                </div>
            </div>
        `;

        // Register mobile sidebar close action
        const mobileClose = staffSidebar.querySelector("#sidebarCloseBtn");
        if (mobileClose) {
            mobileClose.addEventListener("click", () => {
                staffSidebar.classList.remove("active");
                if (sidebarOverlay) sidebarOverlay.classList.remove("active");
            });
        }
    }

    // ==========================================
    // 2. TOGGLE STAFF ONLINE / OFFLINE
    // ==========================================
    if (toggleStatusBtn) {
        toggleStatusBtn.addEventListener("click", () => {
            isStaffOnline = !isStaffOnline;
            
            const sidebarStaffDot = document.getElementById("sidebarStaffDot");
            const headerStaffDot = document.getElementById("headerStaffDot");
            
            if (isStaffOnline) {
                toggleStatusBtn.classList.remove("offline");
                toggleStatusBtn.innerText = "🟢 Nhân viên đang online";
                
                if (sidebarStaffDot) sidebarStaffDot.classList.remove("offline");
                if (headerStaffDot) {
                    headerStaffDot.classList.remove("offline");
                    headerStaffDot.classList.add("online");
                }
                if (offlineWarningBanner) offlineWarningBanner.style.display = "none";
            } else {
                toggleStatusBtn.classList.add("offline");
                toggleStatusBtn.innerText = "🔴 Nhân viên đang offline";
                
                if (sidebarStaffDot) sidebarStaffDot.classList.add("offline");
                if (headerStaffDot) {
                    headerStaffDot.classList.remove("online");
                    headerStaffDot.classList.add("offline");
                }
                if (offlineWarningBanner) offlineWarningBanner.style.display = "flex";
            }
        });
    }

    // ==========================================
    // 3. EMOJI PICKER POP-UP
    // ==========================================
    if (emojiPickerBtn && emojiPickerPopup) {
        emojiPickerBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            emojiPickerPopup.classList.toggle("d-none");
        });

        document.addEventListener("click", () => {
            emojiPickerPopup.classList.add("d-none");
        });

        emojiPickerPopup.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        const emojis = emojiPickerPopup.querySelectorAll(".emoji-picker-item");
        emojis.forEach(emoji => {
            emoji.addEventListener("click", () => {
                if (chatInputField) {
                    const startPos = chatInputField.selectionStart;
                    const endPos = chatInputField.selectionEnd;
                    const text = chatInputField.value;
                    
                    chatInputField.value = text.substring(0, startPos) + emoji.innerText + text.substring(endPos);
                    chatInputField.focus();
                    chatInputField.selectionStart = startPos + emoji.innerText.length;
                    chatInputField.selectionEnd = startPos + emoji.innerText.length;
                }
            });
        });
    }

    // ==========================================
    // 4. SEND CLIENT MESSAGE SIMULATION
    // ==========================================
    function sendClientMessage() {
        if (!chatInputField) return;
        const messageText = chatInputField.value.trim();
        
        if (!messageText && filePreviewBar.children.length === 0) return;

        // Render file previews if any exist
        let filePreviewHtml = "";
        const previews = Array.from(filePreviewBar.children);
        previews.forEach(preview => {
            const fileName = preview.getAttribute("data-name");
            const fileSize = preview.getAttribute("data-size");
            const fileType = preview.getAttribute("data-type");

            if (fileType && fileType.startsWith("image/")) {
                filePreviewHtml += `
                    <div class="chat-message-row client">
                        <div class="chat-message-wrapper">
                            <div class="chat-message-item chat-message-image">
                                <img src="${preview.getAttribute("data-src")}" alt="Uploaded image" class="clickable-chat-image" />
                            </div>
                            <div class="chat-message-meta">${getCurrentTime()} • Bạn <span class="text-success ms-1">✓ Đã gửi</span></div>
                        </div>
                    </div>
                `;
            } else {
                filePreviewHtml += `
                    <div class="chat-message-row client">
                        <div class="chat-message-wrapper">
                            <div class="chat-message-item chat-message-file-card">
                                <div class="file-card-icon">
                                    <i class="bi bi-file-earmark-fill"></i>
                                </div>
                                <div class="file-card-details">
                                    <span class="file-card-name">${fileName}</span>
                                    <span class="file-card-size">${fileSize}</span>
                                </div>
                                <button class="file-card-download-btn" title="Tải xuống" type="button">
                                    <i class="bi bi-download"></i>
                                </button>
                            </div>
                            <div class="chat-message-meta">${getCurrentTime()} • Bạn <span class="text-success ms-1">✓ Đã gửi</span></div>
                        </div>
                    </div>
                `;
            }
        });

        // Render text message bubble
        let textMsgHtml = "";
        if (messageText) {
            textMsgHtml = `
                <div class="chat-message-row client">
                    <div class="chat-message-wrapper">
                        <div class="chat-message-item">
                            ${escapeHtml(messageText)}
                        </div>
                        <div class="chat-message-meta">${getCurrentTime()} • Bạn <span class="text-success ms-1">✓ Đã gửi</span></div>
                    </div>
                </div>
            `;
        }

        // Insert client messages
        const typingIndicator = document.getElementById("typingIndicator");
        if (typingIndicator) {
            if (filePreviewHtml) typingIndicator.insertAdjacentHTML("beforebegin", filePreviewHtml);
            if (textMsgHtml) typingIndicator.insertAdjacentHTML("beforebegin", textMsgHtml);
        } else {
            if (filePreviewHtml) chatMessagesPane.innerHTML += filePreviewHtml;
            if (textMsgHtml) chatMessagesPane.innerHTML += textMsgHtml;
        }

        // Reset elements
        filePreviewBar.innerHTML = "";
        chatInputField.value = "";
        chatInputField.style.height = "auto";
        scrollToBottom();
        focusInput();

        // Register zoom actions
        if (chatMessagesPane) {
            const images = chatMessagesPane.querySelectorAll(".clickable-chat-image");
            images.forEach(img => {
                img.addEventListener("click", () => {
                    if (lightboxModal && lightboxImg) {
                        lightboxImg.src = img.src;
                        lightboxModal.classList.add("active");
                    }
                });
            });
        }

        // Simulate staff response
        simulateStaffResponse();
    }

    // Helper: Time
    function getCurrentTime() {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }

    // Helper: Escape
    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Event listeners for sending message
    if (chatSendBtn) {
        chatSendBtn.addEventListener("click", sendClientMessage);
    }

    if (chatInputField) {
        chatInputField.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendClientMessage();
            }
        });

        chatInputField.addEventListener("input", function() {
            this.style.height = "auto";
            this.style.height = `${Math.min(this.scrollHeight, 100)}px`;
        });
    }

    // ==========================================
    // 5. SIMULATED STAFF RESPONSE
    // ==========================================
    function simulateStaffResponse() {
        const typingIndicator = document.getElementById("typingIndicator");
        if (typingIndicator) {
            setTimeout(() => {
                typingIndicator.style.display = "flex";
                scrollToBottom();
            }, 1200);

            setTimeout(() => {
                typingIndicator.style.display = "none";

                let staffReplyHtml = "";
                if (isStaffOnline) {
                    staffReplyHtml = `
                        <div class="chat-message-row staff">
                            <div class="chat-message-item">
                                Tôi đã nhận được thông tin phản hồi từ anh/chị. Tôi vừa thực hiện tinh chỉnh cổng quang trạm trên hệ thống điều phối, anh chị kiểm tra lại tín hiệu mạng xem đã ổn định hơn chưa nhé.
                            </div>
                            <div class="chat-message-meta">${getCurrentTime()} • Nhân viên</div>
                        </div>
                    `;
                } else {
                    staffReplyHtml = `
                        <div class="chat-message-row staff">
                            <div class="chat-message-item" style="border-left: 3px solid var(--vt-primary);">
                                <strong>[Hộp thư tự động]</strong> Hiện kỹ thuật viên Nguyễn Văn Hùng đang đi hiện trường hỗ trợ lắp đặt. Tin nhắn của bạn đã được lưu lại, anh Hùng sẽ liên hệ lại ngay khi online.
                            </div>
                            <div class="chat-message-meta">${getCurrentTime()} • Hệ thống</div>
                        </div>
                    `;
                }

                typingIndicator.insertAdjacentHTML("beforebegin", staffReplyHtml);
                scrollToBottom();
            }, 3500);
        }
    }

    // ==========================================
    // 6. QUICK ACTION HANDLERS
    // ==========================================
    window.handleQuickAction = function(actionType) {
        let actionMessage = "";
        let feedbackMessage = "";

        switch (actionType) {
            case "view_ticket":
                actionMessage = "Yêu cầu: [Xem chi tiết phiếu hỗ trợ PHT001]";
                feedbackMessage = "Hệ thống đang hiển thị thông tin Phiếu PHT001 của bạn. Trạng thái: Đang được kỹ thuật viên xử lý cổng cáp quang.";
                break;
            case "view_schedule":
                actionMessage = "Yêu cầu: [Xem lịch hẹn hỗ trợ tại nhà]";
                feedbackMessage = "Thông tin lịch hẹn: Ngày 18/07/2026 trong khung giờ 09:00 - 11:00. Kỹ sư Nguyễn Văn Hùng sẽ có mặt tại nhà hỗ trợ.";
                break;
            case "review":
                actionMessage = "Yêu cầu: [Đánh giá dịch vụ kỹ thuật]";
                feedbackMessage = "Đã gửi biểu mẫu đánh giá dịch vụ. Quý khách vui lòng để lại ý kiến đóng góp sau khi sự cố được giải quyết hoàn toàn.";
                break;
            case "ask_ai":
                actionMessage = "Yêu cầu: [Hỏi Trợ lý ảo AI]";
                feedbackMessage = "TechSupport AI kính chào quý khách. Tôi có thể giúp gì thêm cho bạn trong thời gian kỹ thuật viên đang xử lý?";
                break;
            case "video_call":
                actionMessage = "Yêu cầu: [Bắt đầu Video Call kỹ thuật]";
                feedbackMessage = "Đang kết nối cuộc gọi video hướng dẫn kỹ thuật... Vui lòng kiểm tra quyền truy cập camera của trình duyệt.";
                break;
            case "call_staff":
                actionMessage = "Yêu cầu: [Gọi thoại trực tuyến]";
                feedbackMessage = "Đang kết nối cuộc gọi thoại trực tiếp tới máy lẻ kỹ sư Hùng (0981.234.567)...";
                break;
            case "view_profile":
                actionMessage = "Yêu cầu: [Xem hồ sơ năng lực nhân viên]";
                feedbackMessage = "Hồ sơ: Kỹ sư Nguyễn Văn Hùng. Chuyên môn: Thiết bị đầu cuối và suy hao quang. Tỉ lệ xử lý đúng hẹn đạt 98.5%.";
                break;
            case "change_staff":
                actionMessage = "Yêu cầu: [Yêu cầu đổi nhân viên hỗ trợ]";
                feedbackMessage = "Hệ thống ghi nhận yêu cầu. Yêu cầu sẽ được bộ phận điều phối xem xét và phản hồi qua SMS trong vòng 15 phút.";
                break;
        }

        if (actionMessage) {
            const typingIndicator = document.getElementById("typingIndicator");
            const newClientMsg = `
                <div class="chat-message-row client">
                    <div class="chat-message-item" style="font-weight: 600; font-style: italic; background: rgba(230, 0, 18, 0.05); color: var(--vt-primary);">
                        ${actionMessage}
                    </div>
                    <div class="chat-message-meta">${getCurrentTime()} • Bạn <span class="text-success ms-1">✓ Đã gửi</span></div>
                </div>
            `;

            if (typingIndicator) {
                typingIndicator.insertAdjacentHTML("beforebegin", newClientMsg);
            } else {
                chatMessagesPane.innerHTML += newClientMsg;
            }
            scrollToBottom();

            // Simulate typing
            setTimeout(() => {
                if (typingIndicator) typingIndicator.style.display = "flex";
                scrollToBottom();
            }, 800);

            setTimeout(() => {
                if (typingIndicator) typingIndicator.style.display = "none";
                const staffReply = `
                    <div class="chat-message-row staff">
                        <div class="chat-message-item">
                            ${feedbackMessage}
                        </div>
                        <div class="chat-message-meta">${getCurrentTime()} • Nhân viên</div>
                    </div>
                `;
                if (typingIndicator) {
                    typingIndicator.insertAdjacentHTML("beforebegin", staffReply);
                } else {
                    chatMessagesPane.innerHTML += staffReply;
                }
                scrollToBottom();
            }, 2200);
        }
    };

    // ==========================================
    // 7. LIGHTBOX CONTROLLER
    // ==========================================
    if (lightboxClose && lightboxModal) {
        lightboxClose.addEventListener("click", () => {
            lightboxModal.classList.remove("active");
        });

        lightboxModal.addEventListener("click", (e) => {
            if (e.target === lightboxModal) {
                lightboxModal.classList.remove("active");
            }
        });
    }

    // ==========================================
    // 8. RESPONSIVE SIDEBAR TOGGLE
    // ==========================================
    if (btnMobileSidebarToggle && staffSidebar && sidebarOverlay) {
        btnMobileSidebarToggle.addEventListener("click", () => {
            staffSidebar.classList.add("active");
            sidebarOverlay.classList.add("active");
        });
    }

    if (sidebarOverlay && staffSidebar) {
        sidebarOverlay.addEventListener("click", () => {
            staffSidebar.classList.remove("active");
            sidebarOverlay.classList.remove("active");
        });
    }

    // ==========================================
    // 9. FILE & IMAGE UPLOADS
    // ==========================================
    if (fileUploadBtn && hiddenFileUpload) {
        fileUploadBtn.addEventListener("click", () => hiddenFileUpload.click());
    }

    if (imageUploadBtn && hiddenImageUpload) {
        imageUploadBtn.addEventListener("click", () => hiddenImageUpload.click());
    }

    if (hiddenFileUpload) {
        hiddenFileUpload.addEventListener("change", function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                addFilePreview(file.name, (file.size / 1024).toFixed(0) + " KB", file.type);
            }
        });
    }

    if (hiddenImageUpload) {
        hiddenImageUpload.addEventListener("change", function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const reader = new FileReader();
                reader.onload = function(e) {
                    addFilePreview(file.name, (file.size / 1024).toFixed(0) + " KB", file.type, e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function addFilePreview(name, size, type, src = "") {
        if (!filePreviewBar) return;
        const previewId = "prev_" + Date.now();
        const previewContainer = document.createElement("div");
        previewContainer.className = "file-preview-thumbnail";
        previewContainer.id = previewId;
        previewContainer.setAttribute("data-name", name);
        previewContainer.setAttribute("data-size", size);
        previewContainer.setAttribute("data-type", type);
        previewContainer.setAttribute("data-src", src);

        previewContainer.innerHTML = `
            <i class="bi ${type.startsWith("image/") ? "bi-image-fill" : "bi-file-earmark-fill"} text-danger"></i>
            <span>${name} (${size})</span>
            <i class="bi bi-x-circle-fill file-preview-remove ms-2" onclick="document.getElementById('${previewId}').remove()"></i>
        `;
        filePreviewBar.appendChild(previewContainer);
        focusInput();
    }

    // ==========================================
    // 10. HERO SEARCH / CONNECT ACTION
    // ==========================================
    if (btnSearchConnect && heroSearchInput) {
        btnSearchConnect.addEventListener("click", () => {
            const query = heroSearchInput.value.trim();
            if (query) {
                // Focus and fill search query in chat box instantly as user request
                if (chatInputField) {
                    chatInputField.value = `Kết nối yêu cầu: ${query}`;
                    chatInputField.dispatchEvent(new Event("input"));
                }
                // Scroll down to the chat workspace smoothly
                const chatSection = document.querySelector(".live-chat-workspace");
                if (chatSection) {
                    chatSection.scrollIntoView({ behavior: "smooth" });
                }
                // Clear input
                heroSearchInput.value = "";
                // Connect message automatically
                setTimeout(() => {
                    sendClientMessage();
                }, 800);
            }
        });

        heroSearchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                btnSearchConnect.click();
            }
        });
    }

    // Start simulation loader only if no real backend chatConfig exists
    if (!window.chatConfig || !window.chatConfig.maPhieu) {
        simulateLoading();
    }
});
