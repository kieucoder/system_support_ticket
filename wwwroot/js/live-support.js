/* -------------------------------------------------------------
 * FILE: wwwroot/js/live-support.js
 * AUTHOR: Antigravity
 * DESCRIPTION: Premium interactive frontend scripts for Live Support Chat (Giai đoạn 2)
 *              Handles SignalR connection, file uploads, Emoji, AI, Rating, and Appointments.
 * ------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Config & State
    const config = window.chatConfig || {};
    const maPhieu = config.maPhieu;
    const currentUserRole = config.role; // "Customer" or "Staff"
    let canChat = config.canChat;

    const chatMessagesPane = document.getElementById("chatMessagesPane");
    const chatInputField = document.getElementById("chatInputField");
    const chatSendBtn = document.getElementById("chatSendBtn");
    const emojiPickerBtn = document.getElementById("emojiPickerBtn");
    const emojiPickerPopup = document.getElementById("emojiPickerPopup");
    const fileUploadBtn = document.getElementById("fileUploadBtn");
    const imageUploadBtn = document.getElementById("imageUploadBtn");
    const hiddenFileUpload = document.getElementById("hiddenFileUpload");
    const hiddenImageUpload = document.getElementById("hiddenImageUpload");
    const filePreviewBar = document.getElementById("filePreviewBar");
    const toggleStatusBtn = document.getElementById("toggleStatusBtn");
    
    // Modals
    const btnSubmitAppointment = document.getElementById("btnSubmitAppointment");
    const btnCloseChat = document.getElementById("btnCloseChat");
    const btnSubmitRating = document.getElementById("btnSubmitRating");
    const btnAskAi = document.getElementById("btnAskAi");

    // Lightbox Zoom Image Modal
    const lightboxModal = document.getElementById("chatLightboxModal");
    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxClose = document.getElementById("lightboxClose");

    let typingTimeout;
    let isTyping = false;

    // Auto scroll & image lightbox initializations
    scrollToBottom();
    bindImageLightbox();

    // Helper: Scroll to bottom
    function scrollToBottom() {
        if (chatMessagesPane) {
            chatMessagesPane.scrollTop = chatMessagesPane.scrollHeight;
        }
    }

    // Helper: Get Anti-Forgery Token
    function getVerificationToken() {
        const tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
        return tokenInput ? tokenInput.value : '';
    }

    // Helper: Format Time
    function formatTime(dateStr) {
        const date = new Date(dateStr);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // Helper: Bind click on images to open lightbox
    function bindImageLightbox() {
        if (!chatMessagesPane) return;
        const images = chatMessagesPane.querySelectorAll(".clickable-chat-image");
        images.forEach(img => {
            img.onclick = () => {
                if (lightboxModal && lightboxImg) {
                    lightboxImg.src = img.src;
                    lightboxModal.classList.add("active");
                }
            };
        });
    }

    if (lightboxClose) {
        lightboxClose.onclick = () => {
            if (lightboxModal) lightboxModal.classList.remove("active");
        };
    }

    // ==========================================================================
    // 2. SIGNALR REALTIME CONNECTION Setup
    // ==========================================================================
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/liveSupportHub")
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .build();

    async function startConnection() {
        try {
            await connection.start();
            console.log("SignalR connected successfully.");
            if (toggleStatusBtn) {
                toggleStatusBtn.innerHTML = "🟢 Trực tuyến";
                toggleStatusBtn.className = "staff-status-indicator online";
            }
            
            // Join chat room for this ticket
            await connection.invoke("JoinRoom", maPhieu);
            
            // Notify other users we read the conversation
            await connection.invoke("ReadMessage", maPhieu, currentUserRole);
        } catch (err) {
            console.error("SignalR connection error: ", err);
            if (toggleStatusBtn) {
                toggleStatusBtn.innerHTML = "🔴 Mất kết nối";
                toggleStatusBtn.className = "staff-status-indicator offline";
            }
            setTimeout(startConnection, 5000);
        }
    }

    startConnection();

    // Reconnection events
    connection.onreconnecting((error) => {
        console.warn(`Connection lost due to error "${error}". Reconnecting...`);
        if (toggleStatusBtn) {
            toggleStatusBtn.innerHTML = "🟡 Đang kết nối lại...";
            toggleStatusBtn.className = "staff-status-indicator reconnecting";
        }
    });

    connection.onreconnected((connectionId) => {
        console.log(`Connection reestablished. Connected with connectionId: "${connectionId}".`);
        if (toggleStatusBtn) {
            toggleStatusBtn.innerHTML = "🟢 Trực tuyến";
            toggleStatusBtn.className = "staff-status-indicator online";
        }
        connection.invoke("JoinRoom", maPhieu);
    });

    // ==========================================================================
    // 3. SIGNALR EVENT LISTENERS
    // ==========================================================================
    
    // Helper: Render single message dynamically with Zalo Desktop styling
    function renderMessage(msg) {
        if (!msg) return;
        const msgId = msg.idTinNhan || msg.IdTinNhan;
        if (!msgId) return;

        // Check if message is already rendered (avoid duplicates)
        if (document.querySelector(`[data-id="${msgId}"]`)) return;

        const loaiNguoiGui = msg.loaiNguoiGui || msg.LoaiNguoiGui || "";
        const noiDung = msg.noiDung || msg.NoiDung || "";
        const thoiGian = msg.thoiGian || msg.ThoiGian;
        const trangThai = msg.trangThai || msg.TrangThai || "";
        const files = msg.files || msg.Files || [];

        const isOutgoing = (currentUserRole === "Customer" && loaiNguoiGui === "KhachHang") ||
                           (currentUserRole === "Staff" && loaiNguoiGui === "NhanVien");

        let filesHtml = "";
        if (files && files.length > 0) {
            files.forEach(file => {
                const tenFile = file.tenFile || file.TenFile || "";
                const duongDan = file.duongDan || file.DuongDan || "";
                const loaiFile = file.loaiFile || file.LoaiFile || "";
                
                const isImg = loaiFile.startsWith("image/") || 
                              tenFile.endsWith(".jpg") || 
                              tenFile.endsWith(".png") || 
                              tenFile.endsWith(".jpeg");
                if (isImg) {
                    filesHtml += `
                        <div class="chat-message-image mb-2">
                            <img src="${duongDan}" alt="${tenFile}" class="clickable-chat-image rounded-3 border" style="max-width:260px;" />
                        </div>
                    `;
                } else {
                    filesHtml += `
                        <div class="chat-message-file-card border-0 rounded-3 p-2.5 bg-white bg-opacity-25 text-white mb-2 d-flex align-items-center gap-2" style="min-width:200px;">
                            <div class="file-card-icon fs-3">
                                <i class="bi bi-file-earmark-arrow-down-fill"></i>
                            </div>
                            <div class="file-card-details text-truncate flex-grow-1">
                                <span class="file-card-name fw-semibold small d-block text-truncate">${tenFile}</span>
                                <span class="file-card-size text-white-50" style="font-size:0.7rem;">Tệp đính kèm</span>
                            </div>
                            <a href="${duongDan}" class="file-card-download-btn text-white text-decoration-underline ms-2" title="Tải xuống" download="${tenFile}" style="font-size:0.75rem;">
                                Tải về <i class="bi bi-download ms-1"></i>
                            </a>
                        </div>
                    `;
                }
            });
        }

        let contentHtml = "";
        if (noiDung && !noiDung.startsWith("[Đính kèm tệp:")) {
            const safeContent = noiDung
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;")
                .replace(/\n/g, "<br/>");
            contentHtml = safeContent;
        }

        const dateStr = formatTime(thoiGian);
        let bubbleHtml = "";

        if (isOutgoing) {
            const seenText = trangThai === "Đã xem" ? "✓✓ Đã xem" : "✓✓ Đã nhận";
            bubbleHtml = `
                <div class="chat-message-row client d-flex justify-content-end mb-2.5" data-id="${msgId}" style="width:100%; display:flex !important; justify-content:flex-end !important;">
                    <div class="chat-message-wrapper" style="width: fit-content !important; max-width: 55% !important; align-self: flex-end !important; display: flex !important; flex-direction: column !important; align-items: flex-end !important; margin-left: auto !important;">
                        <div class="chat-message-item text-white shadow-sm" 
                             style="background: linear-gradient(135deg, #D71920 0%, #E53935 100%) !important; color: #FFFFFF !important; border-radius: 20px 20px 4px 20px !important; padding: 10px 16px !important; font-size: 0.92rem !important; line-height: 1.45 !important; display: inline-block !important; width: fit-content !important; height: auto !important; max-width: 100% !important; align-self: flex-end !important; word-break: break-word !important; white-space: pre-wrap !important; overflow-wrap: anywhere !important; box-shadow: 0 4px 14px rgba(215, 25, 32, 0.18) !important; margin: 0 !important; box-sizing: border-box !important;">
                            ${filesHtml}
                            ${contentHtml}
                        </div>
                        <div class="chat-message-meta text-end mt-1 d-flex align-items-center justify-content-end gap-1.5" style="font-size: 11.5px; color: #94A3B8; align-self: flex-end !important;">
                            <span>${dateStr}</span>
                            <span class="seen-indicator fw-bold" style="color:#22C55E;">${seenText}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            const isAi = loaiNguoiGui === "AI";
            const senderLabel = isAi ? "Trợ lý Kỹ Thuật AI" : (loaiNguoiGui === "NhanVien" ? "Kỹ thuật viên Viettel" : "Khách hàng");
            
            bubbleHtml = `
                <div class="chat-message-row staff d-flex justify-content-start align-items-end gap-2 mb-2.5" data-id="${msgId}" style="width:100%;">
                    <div class="chat-avatar flex-shrink-0 text-white fw-bold shadow-xs mb-4" 
                         style="background: ${isAi ? '#F59E0B' : 'linear-gradient(135deg, #D71920 0%, #C8102E 100%)'}; width:34px; height:34px; border-radius:50%; display:grid; place-items:center; font-size:0.78rem; border:1px solid #FFFFFF;">
                        <i class="bi ${isAi ? 'bi-robot' : 'bi-person-fill'} fs-6"></i>
                    </div>
                    <div class="chat-message-wrapper" style="width: fit-content !important; max-width: 55% !important; align-self: flex-start !important; display: flex !important; flex-direction: column !important; align-items: flex-start !important;">
                        <div class="chat-message-sender-name fw-bold mb-1 text-secondary" style="font-size:0.75rem;">${senderLabel}</div>
                        <div class="chat-message-item shadow-sm" 
                             style="background-color: ${isAi ? '#FFF6E8' : '#FFFFFF'} !important; color: #1E293B !important; border: 1px solid ${isAi ? '#FDE68A' : '#E2E8F0'} !important; border-radius: 22px 22px 22px 4px !important; padding: 10px 16px !important; font-size: 0.92rem !important; line-height: 1.45 !important; display: inline-block !important; width: fit-content !important; max-width: 100% !important; align-self: flex-start !important; word-break: break-word !important; white-space: pre-wrap !important; overflow-wrap: anywhere !important; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03) !important;">
                            ${filesHtml}
                            ${contentHtml}
                        </div>
                        <div class="chat-message-meta text-start mt-1" style="font-size: 11.5px; color: #94A3B8;">
                            <span>${dateStr}</span>
                        </div>
                    </div>
                </div>
            `;
            
            if (connection && connection.state === "Connected") {
                connection.invoke("ReadMessage", maPhieu, currentUserRole).catch(() => {});
            }
        }

        const typingIndicator = document.getElementById("typingIndicator");
        if (typingIndicator) {
            typingIndicator.insertAdjacentHTML("beforebegin", bubbleHtml);
        } else if (chatMessagesPane) {
            chatMessagesPane.insertAdjacentHTML("beforeend", bubbleHtml);
        }

        if (currentUserRole === "Customer" && loaiNguoiGui === "NhanVien") {
            const btnAi = document.getElementById("btnAskAi");
            if (btnAi) btnAi.style.display = "none";
        }

        bindImageLightbox();
        scrollToBottom();
    }

    // Receive message realtime via SignalR
    connection.on("ReceiveMessage", (room, msg) => {
        if (room !== maPhieu) return;
        renderMessage(msg);
    });

    // Auto-polling fallback every 2.5s so user NEVER has to press F5
    async function autoFetchMessages() {
        if (!maPhieu) return;
        try {
            const response = await fetch(`/LiveSupport/LoadConversation?maPhieu=${encodeURIComponent(maPhieu)}`);
            if (response.ok) {
                const res = await response.json();
                const msgs = res.data || res;
                if (Array.isArray(msgs)) {
                    msgs.forEach(msg => renderMessage(msg));
                }
            }
        } catch (e) {
            // silent catch
        }
    }

    // Start auto polling interval
    setInterval(autoFetchMessages, 2500);

    // Receive typing indicator
    connection.on("Typing", (room, senderRole, typing) => {
        if (room !== maPhieu) return;
        
        // Only show indicator for the other party
        const otherRole = currentUserRole === "Customer" ? "Staff" : "Customer";
        const senderMappedRole = senderRole === "Staff" ? "Staff" : "Customer";

        if (senderMappedRole === otherRole) {
            const typingIndicator = document.getElementById("typingIndicator");
            const typingText = document.getElementById("typingIndicatorText");
            if (typingIndicator) {
                if (typing) {
                    if (typingText) {
                        typingText.innerText = senderRole === "Staff" ? "Kỹ thuật viên đang nhập..." : "Khách hàng đang nhập...";
                    }
                    typingIndicator.style.display = "flex";
                    scrollToBottom();
                } else {
                    typingIndicator.style.display = "none";
                }
            }
        }
    });

    // Seen indicators update
    connection.on("UpdateSeen", (room, role) => {
        if (room !== maPhieu) return;
        
        // If the other party read our messages, update seen indicator
        const otherRole = currentUserRole === "Customer" ? "Staff" : "Customer";
        const readerMappedRole = role === "Staff" ? "Staff" : "Customer";

        if (readerMappedRole === otherRole) {
            const seenIndicators = document.querySelectorAll(".client .seen-indicator");
            seenIndicators.forEach(ind => {
                ind.innerText = "✓ Đã xem";
            });
        }
    });

    // Chat room closed / Ticket completed
    connection.on("ChatClosed", (room) => {
        // Refresh page to lock down input area and render rating options
        window.location.reload();
    });

    // User online indicators
    connection.on("UserOnline", (room, role) => {
        if (room !== maPhieu && role === "Staff") {
            const headerAvatarDot = document.getElementById("headerStaffDot");
            if (headerAvatarDot) {
                headerAvatarDot.className = "status-dot online";
            }
        }
    });

    connection.on("UserOffline", (room, role) => {
        if (room !== maPhieu && role === "Staff") {
            const headerAvatarDot = document.getElementById("headerStaffDot");
            if (headerAvatarDot) {
                headerAvatarDot.className = "status-dot offline";
            }
        }
    });

    // ==========================================================================
    // 4. CHAT ACTIONS (Send message, upload file, etc)
    // ==========================================================================
    
    // Trigger typing event when typing
    if (chatInputField) {
        chatInputField.oninput = () => {
            if (!isTyping) {
                isTyping = true;
                connection.invoke("Typing", maPhieu, currentUserRole, true);
            }
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                isTyping = false;
                connection.invoke("Typing", maPhieu, currentUserRole, false);
            }, 2000);
        };
    }

    // Send Message AJAX Action
    async function performSendMessage(content) {
        if (!content || content.trim() === "") return;

        const token = getVerificationToken();
        const data = new URLSearchParams();
        data.append("maPhieu", maPhieu);
        data.append("content", content);

        try {
            const response = await fetch("/LiveSupport/SendMessage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "RequestVerificationToken": token
                },
                body: data.toString()
            });

            if (response.ok) {
                const res = await response.json();
                if (res.success) {
                    if (chatInputField) chatInputField.value = "";
                    scrollToBottom();
                }
            } else {
                alert("Gửi tin nhắn thất bại. Vui lòng thử lại.");
            }
        } catch (e) {
            console.error(e);
        }
    }

    if (chatSendBtn) {
        chatSendBtn.onclick = () => {
            performSendMessage(chatInputField.value);
        };
    }

    if (chatInputField) {
        chatInputField.onkeydown = (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                performSendMessage(chatInputField.value);
            }
        };
    }

    // File Upload AJAX action
    async function uploadSelectedFile(inputElement) {
        const file = inputElement.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("maPhieu", maPhieu);
        formData.append("file", file);

        const token = getVerificationToken();

        try {
            if (filePreviewBar) {
                filePreviewBar.innerHTML = `<div class="p-2 text-secondary"><span class="spinner-border spinner-border-sm text-danger me-2"></span> Đang tải lên: ${file.name}...</div>`;
                filePreviewBar.style.display = "block";
            }

            const response = await fetch("/LiveSupport/UploadFile", {
                method: "POST",
                headers: {
                    "RequestVerificationToken": token
                },
                body: formData
            });

            if (response.ok) {
                const res = await response.json();
                if (res.success) {
                    if (filePreviewBar) {
                        filePreviewBar.style.display = "none";
                        filePreviewBar.innerHTML = "";
                    }
                }
            } else {
                const errMsg = await response.text();
                alert(errMsg || "Đính kèm tệp thất bại.");
                if (filePreviewBar) {
                    filePreviewBar.style.display = "none";
                }
            }
        } catch (e) {
            console.error(e);
            alert("Lỗi tải tệp lên.");
            if (filePreviewBar) {
                filePreviewBar.style.display = "none";
            }
        }
    }

    if (fileUploadBtn) {
        fileUploadBtn.onclick = () => hiddenFileUpload.click();
    }
    if (imageUploadBtn) {
        imageUploadBtn.onclick = () => hiddenImageUpload.click();
    }

    if (hiddenFileUpload) {
        hiddenFileUpload.onchange = () => uploadSelectedFile(hiddenFileUpload);
    }
    if (hiddenImageUpload) {
        hiddenImageUpload.onchange = () => uploadSelectedFile(hiddenImageUpload);
    }

    // Emoji Picker actions
    if (emojiPickerBtn && emojiPickerPopup) {
        emojiPickerBtn.onclick = (e) => {
            e.stopPropagation();
            emojiPickerPopup.classList.toggle("d-none");
        };

        document.onclick = () => {
            emojiPickerPopup.classList.add("d-none");
        };

        const emojis = emojiPickerPopup.querySelectorAll(".emoji-picker-item");
        emojis.forEach(emoji => {
            emoji.onclick = (e) => {
                e.stopPropagation();
                if (chatInputField) {
                    chatInputField.value += emoji.innerText;
                    emojiPickerPopup.classList.add("d-none");
                    focusInput();
                }
            };
        });
    }

    function focusInput() {
        if (chatInputField) chatInputField.focus();
    }

    // ==========================================================================
    // 5. APPOINTMENT FORM SUBMISSION
    // ==========================================================================
    if (btnSubmitAppointment) {
        btnSubmitAppointment.onclick = async () => {
            const form = document.getElementById("appointmentForm");
            const date = document.getElementById("aptDate").value;
            const timeStart = document.getElementById("aptTimeStart").value;
            const timeEnd = document.getElementById("aptTimeEnd").value;
            const address = document.getElementById("aptAddress").value;
            const note = document.getElementById("aptNote").value;
            const errAlert = document.getElementById("appointmentError");

            if (!date || !timeStart || !timeEnd || !address) {
                errAlert.innerText = "Vui lòng nhập đầy đủ thông tin bắt buộc.";
                errAlert.classList.remove("d-none");
                return;
            }

            errAlert.classList.add("d-none");

            const token = getVerificationToken();
            const data = new URLSearchParams();
            data.append("maPhieu", maPhieu);
            data.append("date", date);
            data.append("timeStart", timeStart);
            data.append("timeEnd", timeEnd);
            data.append("address", address);
            data.append("note", note);

            try {
                btnSubmitAppointment.disabled = true;
                btnSubmitAppointment.innerText = "Đang xử lý...";

                const response = await fetch("/LiveSupport/CreateAppointment", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "RequestVerificationToken": token
                    },
                    body: data.toString()
                });

                if (response.ok) {
                    const res = await response.json();
                    if (res.success) {
                        // Dismiss Modal
                        const modalEl = document.getElementById("appointmentModal");
                        const modal = bootstrap.Modal.getInstance(modalEl);
                        if (modal) modal.hide();
                        
                        form.reset();
                    }
                } else {
                    const txt = await response.text();
                    errAlert.innerText = txt || "Tạo lịch hẹn thất bại.";
                    errAlert.classList.remove("d-none");
                }
            } catch (e) {
                console.error(e);
            } finally {
                btnSubmitAppointment.disabled = false;
                btnSubmitAppointment.innerText = "Tạo lịch hẹn";
            }
        };
    }

    // ==========================================================================
    // 6. CLOSE CHAT ACTION
    // ==========================================================================
    if (btnCloseChat) {
        btnCloseChat.onclick = async () => {
            if (!confirm("Bạn có chắc chắn muốn hoàn thành phiếu hỗ trợ và đóng cuộc trò chuyện này?")) return;

            const token = getVerificationToken();
            const data = new URLSearchParams();
            data.append("maPhieu", maPhieu);

            try {
                btnCloseChat.disabled = true;
                const response = await fetch("/LiveSupport/CloseChat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "RequestVerificationToken": token
                    },
                    body: data.toString()
                });

                if (response.ok) {
                    window.location.reload();
                } else {
                    alert("Không thể đóng cuộc trò chuyện.");
                    btnCloseChat.disabled = false;
                }
            } catch (e) {
                console.error(e);
                btnCloseChat.disabled = false;
            }
        };
    }

    // ==========================================================================
    // 7. RATING SUBMISSION
    // ==========================================================================
    const starItems = document.querySelectorAll(".star-rating-item");
    starItems.forEach(item => {
        item.onclick = () => {
            const val = parseInt(item.getAttribute("data-value"));
            document.getElementById("ratingStarValue").value = val;

            // Highlight stars
            starItems.forEach(s => {
                const sVal = parseInt(s.getAttribute("data-value"));
                const icon = s.querySelector("i");
                if (sVal <= val) {
                    icon.className = "bi bi-star-fill text-warning";
                } else {
                    icon.className = "bi bi-star";
                }
            });
        };
    });

    if (btnSubmitRating) {
        btnSubmitRating.onclick = async () => {
            const rating = parseInt(document.getElementById("ratingStarValue").value);
            const comment = document.getElementById("ratingComment").value;
            const token = getVerificationToken();

            const data = new URLSearchParams();
            data.append("maPhieu", maPhieu);
            data.append("rating", rating);
            data.append("comment", comment);

            try {
                btnSubmitRating.disabled = true;
                btnSubmitRating.innerText = "Đang gửi...";

                const response = await fetch("/LiveSupport/RateTicket", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "RequestVerificationToken": token
                    },
                    body: data.toString()
                });

                if (response.ok) {
                    alert("Cảm ơn bạn đã gửi đánh giá chất lượng dịch vụ!");
                    window.location.reload();
                } else {
                    alert("Gửi đánh giá thất bại.");
                    btnSubmitRating.disabled = false;
                    btnSubmitRating.innerText = "Gửi đánh giá";
                }
            } catch (e) {
                console.error(e);
                btnSubmitRating.disabled = false;
                btnSubmitRating.innerText = "Gửi đánh giá";
            }
        };
    }

    // ==========================================================================
    // 8. ASK AI SUPPORT ACTION
    // ==========================================================================
    if (btnAskAi) {
        btnAskAi.onclick = async () => {
            const content = chatInputField.value;
            if (!content || content.trim() === "") {
                alert("Vui lòng nhập câu hỏi cần AI hỗ trợ trước khi nhấn Hỏi AI.");
                focusInput();
                return;
            }

            const token = getVerificationToken();
            const data = new URLSearchParams();
            data.append("maPhieu", maPhieu);
            data.append("content", content);

            try {
                btnAskAi.disabled = true;
                btnAskAi.innerText = "🤖 AI đang trả lời...";
                if (chatInputField) chatInputField.value = "";

                // Show typing indicator for AI
                const typingIndicator = document.getElementById("typingIndicator");
                const typingText = document.getElementById("typingIndicatorText");
                if (typingIndicator) {
                    if (typingText) typingText.innerText = "Trợ lý AI đang soạn câu trả lời...";
                    typingIndicator.style.display = "flex";
                    scrollToBottom();
                }

                const response = await fetch("/LiveSupport/AskAi", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "RequestVerificationToken": token
                    },
                    body: data.toString()
                });

                if (!response.ok) {
                    alert("AI đang gặp trục trặc kỹ thuật. Vui lòng hỏi lại sau.");
                }
            } catch (e) {
                console.error(e);
            } finally {
                btnAskAi.disabled = false;
                btnAskAi.innerText = "🤖 Hỏi AI Trợ Giúp";
                
                const typingIndicator = document.getElementById("typingIndicator");
                if (typingIndicator) {
                    typingIndicator.style.display = "none";
                }
            }
        };
    }
});
