/**
 * chatbox.js - AI Customer Support Chatbox Controller
 * Interacts with ChatController endpoints for Gemini AI responses, guest flow, and file uploads.
 */
document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    function setAiStatus(status) {
        const dot = document.getElementById('aiStatusDot');
        const text = document.getElementById('aiStatusText');
        const roomBadge = document.getElementById('aiRoomStatusBadge');

        if (status === 'thinking') {
            if (dot) { dot.style.backgroundColor = '#f59e0b'; }
            if (text) { text.textContent = '🟡 Đang xử lý...'; }
            if (roomBadge) { roomBadge.className = 'stream-header-status-badge text-dark text-bg-warning'; roomBadge.textContent = '🟡 Đang xử lý...'; }
        } else if (status === 'fallback') {
            if (dot) { dot.style.backgroundColor = '#ef4444'; }
            if (text) { text.textContent = '🔴 AI tạm thời không khả dụng'; }
            if (roomBadge) { roomBadge.className = 'stream-header-status-badge text-white text-bg-danger'; roomBadge.textContent = '🔴 AI tạm thời không khả dụng'; }
        } else {
            if (dot) { dot.style.backgroundColor = '#22c55e'; }
            if (text) { text.textContent = '🟢 AI sẵn sàng'; }
            if (roomBadge) { roomBadge.className = 'stream-header-status-badge text-white text-bg-success'; roomBadge.textContent = '🟢 AI sẵn sàng'; }
        }
    }

    function transferToStaff() {
        if (!config.isLoggedIn) {
            if (loginModal) loginModal.style.display = 'flex';
            return;
        }
        switchScreen(screenConversations);
        loadConversationsList();
        setTimeout(() => {
            if (btnCreateNewConvo) btnCreateNewConvo.click();
        }, 300);
    }

    // Global Widget Namespace
    window.TechSupportChat = {
        openConversation: openConversation,
        backToConversations: backToConversations,
        transferToStaff: transferToStaff,
        setAiStatus: setAiStatus
    };

    // Configuration flags
    const config = window.TechSupportChatConfig || { isLoggedIn: false, autoOpen: false };
    let currentLienHeId = null;
    let isProcessing = false;
    let selectedRoomFile = null;
    let selectedAiFile = null;

    // ==========================================
    // 1. SELECTORS
    // ==========================================
    const launcher = document.getElementById('chatLauncher');
    const windowEl = document.getElementById('chatWindow');
    const minimizeBtn = document.getElementById('chatMinimize');
    const maximizeBtn = document.getElementById('chatMaximize');
    const homeBtn = document.getElementById('chatHomeBtn');
    const closeBtn = document.getElementById('chatClose');

    // Screens
    const screenHome = document.getElementById('screenHome');
    const screenConversations = document.getElementById('screenConversations');
    const screenChatRoom = document.getElementById('screenChatRoom');
    const screenAiChat = document.getElementById('screenAiChat');
    const screenTrackTickets = document.getElementById('screenTrackTickets');

    // Home buttons
    const btnGoChatAi = document.getElementById('btnGoChatAi');
    const btnGoConversations = document.getElementById('btnGoConversations');
    const btnGoTrackTickets = document.getElementById('btnGoTrackTickets');
    const btnGoCreateTicket = document.getElementById('btnGoCreateTicket');

    // Conversations screen buttons
    const convoListContainer = document.getElementById('convoListContainer');
    const btnCreateNewConvo = document.getElementById('btnCreateNewConvo');

    // Active Chat Room selectors
    const chatRoomHeaderContainer = document.getElementById('chatRoomHeaderContainer');
    const chatMessagesContainer = document.getElementById('chatMessagesContainer');
    const roomFileInput = document.getElementById('roomFileInput');
    const chatFilePreviewBar = document.getElementById('chatFilePreviewBar');
    const chatFilePreviewName = document.getElementById('chatFilePreviewName');
    const btnCancelChatFile = document.getElementById('btnCancelChatFile');
    const roomInputField = document.getElementById('roomInputField');
    const btnRoomSend = document.getElementById('btnRoomSend');
    const roomCharCounter = document.getElementById('roomCharCounter');

    // AI Chat Room selectors
    const chatAiMessagesContainer = document.getElementById('chatAiMessagesContainer');
    const aiFileInput = document.getElementById('aiFileInput');
    const aiFilePreviewBar = document.getElementById('aiFilePreviewBar');
    const aiFilePreviewName = document.getElementById('aiFilePreviewName');
    const btnCancelAiFile = document.getElementById('btnCancelAiFile');
    const aiInputField = document.getElementById('aiInputField');
    const btnAiSend = document.getElementById('btnAiSend');
    const aiCharCounter = document.getElementById('aiCharCounter');
    const aiTypingIndicator = document.getElementById('aiTypingIndicator');

    // Tickets screen selectors
    const trackTicketsContainer = document.getElementById('trackTicketsContainer');

    // Guest prompt modal
    const loginModal = document.getElementById('chatLoginModal');
    const btnContinueGuestChat = document.getElementById('btnContinueGuestChat');

    // ==========================================
    // 2. TOGGLE WIDGET & NAVIGATION
    // ==========================================
    const toggleWidget = () => {
        const isOpen = windowEl.classList.toggle('open');
        launcher.classList.toggle('open');
        
        const badge = document.getElementById('launcherBadge');
        if (isOpen && badge) badge.style.display = 'none';

        if (isOpen) {
            switchScreen(screenHome);
        }
    };

    if (launcher) launcher.addEventListener('click', toggleWidget);

    const closeWidget = () => {
        windowEl.classList.remove('open');
        launcher.classList.remove('open');
    };

    if (minimizeBtn) minimizeBtn.addEventListener('click', closeWidget);
    if (closeBtn) closeBtn.addEventListener('click', closeWidget);

    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
            const isMax = windowEl.classList.toggle('chat-maximized');
            maximizeBtn.querySelector('i').className = isMax ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
        });
    }

    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            switchScreen(screenHome);
        });
    }

    document.querySelectorAll('.btn-back-home').forEach(btn => {
        btn.addEventListener('click', () => {
            switchScreen(screenHome);
        });
    });

    if (btnContinueGuestChat) {
        btnContinueGuestChat.addEventListener('click', () => {
            if (loginModal) loginModal.style.display = 'none';
        });
    }

    if (config.autoOpen) {
        setTimeout(() => {
            if (windowEl && !windowEl.classList.contains('open')) {
                windowEl.classList.add('open');
                if (launcher) launcher.classList.add('open');
                switchScreen(screenHome);
            }
        }, 800);
    }

    function switchScreen(targetScreen) {
        [screenHome, screenConversations, screenChatRoom, screenAiChat, screenTrackTickets].forEach(screen => {
            if (screen) screen.classList.add('d-none');
        });
        if (targetScreen) targetScreen.classList.remove('d-none');
        
        if (homeBtn) {
            if (targetScreen === screenHome) {
                homeBtn.style.display = 'none';
            } else {
                homeBtn.style.display = 'inline-flex';
            }
        }
    }

    // ==========================================
    // 3. HOME DASHBOARD ACTIONS
    // ==========================================
    if (btnGoChatAi) {
        btnGoChatAi.addEventListener('click', () => {
            switchScreen(screenAiChat);
            loadAiHistory();
        });
    }

    if (btnGoConversations) {
        btnGoConversations.addEventListener('click', () => {
            if (!config.isLoggedIn) {
                if (loginModal) loginModal.style.display = 'flex';
                return;
            }
            switchScreen(screenConversations);
            loadConversationsList();
        });
    }

    if (btnGoTrackTickets) {
        btnGoTrackTickets.addEventListener('click', () => {
            if (!config.isLoggedIn) {
                if (loginModal) loginModal.style.display = 'flex';
                return;
            }
            switchScreen(screenTrackTickets);
            loadTicketsList();
        });
    }

    if (btnGoCreateTicket) {
        btnGoCreateTicket.addEventListener('click', () => {
            if (!config.isLoggedIn) {
                if (loginModal) loginModal.style.display = 'flex';
                return;
            }
            switchScreen(screenAiChat);
            loadAiHistory();
            setTimeout(() => {
                sendAiMessage("Tôi muốn tạo một phiếu hỗ trợ kỹ thuật mới.");
            }, 500);
        });
    }

    // ==========================================
    // 4. CONVERSATIONS SCREEN ACTIONS
    // ==========================================
    function loadConversationsList() {
        if (!convoListContainer) return;
        convoListContainer.innerHTML = '<div class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm me-2" role="status"></div> Tải hội thoại...</div>';
        
        fetch('/Chat/DanhSachConversation')
            .then(res => res.text())
            .then(html => {
                convoListContainer.innerHTML = html;
            })
            .catch(err => {
                console.error(err);
                convoListContainer.innerHTML = '<div class="text-center py-5 text-danger"><i class="bi bi-exclamation-triangle"></i> Gặp lỗi khi tải hội thoại.</div>';
            });
    }

    if (btnCreateNewConvo) {
        btnCreateNewConvo.addEventListener('click', () => {
            const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';
            const formData = new FormData();
            formData.append('tieuDe', 'Yêu cầu hỗ trợ kỹ thuật từ khách hàng');
            formData.append('__RequestVerificationToken', token);

            btnCreateNewConvo.disabled = true;
            btnCreateNewConvo.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang tạo...';

            fetch('/Chat/TaoLienHeChatBox', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                btnCreateNewConvo.disabled = false;
                btnCreateNewConvo.innerHTML = '<i class="bi bi-plus-circle me-1"></i> Tạo cuộc trò chuyện mới';
                if (data.success && data.idLienHe) {
                    openConversation(data.idLienHe);
                } else {
                    alert("Không thể khởi tạo cuộc hội thoại mới.");
                }
            })
            .catch(err => {
                btnCreateNewConvo.disabled = false;
                btnCreateNewConvo.innerHTML = '<i class="bi bi-plus-circle me-1"></i> Tạo cuộc trò chuyện mới';
                console.error(err);
                alert("Lỗi kết nối khi khởi tạo hội thoại.");
            });
        });
    }

    // ==========================================
    // 5. ACTIVE CHAT ROOM SCREEN (Khách - Nhân viên)
    // ==========================================
    function openConversation(idLienHe) {
        currentLienHeId = idLienHe;
        switchScreen(screenChatRoom);

        if (chatRoomHeaderContainer) {
            chatRoomHeaderContainer.innerHTML = '<div class="stream-header-bar p-3"><div class="spinner-border spinner-border-sm" role="status"></div></div>';
        }
        if (chatMessagesContainer) {
            chatMessagesContainer.innerHTML = '<div class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm me-2"></div> Đang tải tin nhắn...</div>';
        }

        fetch(`/Chat/ChiTietConversation?idLienHe=${idLienHe}`)
            .then(res => res.text())
            .then(html => {
                chatRoomHeaderContainer.innerHTML = html;
            })
            .catch(err => console.error(err));

        fetch(`/Chat/LayTinNhan?idLienHe=${idLienHe}`)
            .then(res => res.text())
            .then(html => {
                chatMessagesContainer.innerHTML = html;
                scrollContainerToBottom(chatMessagesContainer);
            })
            .catch(err => {
                chatMessagesContainer.innerHTML = '<div class="text-center py-5 text-danger">Không thể tải tin nhắn.</div>';
            });
    }

    function backToConversations() {
        switchScreen(screenConversations);
        loadConversationsList();
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getCurrentTime() {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        return `${hrs}:${mins}`;
    }

    function scrollContainerToBottom(container) {
        if (container) {
            setTimeout(() => {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }, 50);
        }
    }

    if (roomInputField) {
        roomInputField.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendRoomMessage();
            }
        });
        roomInputField.addEventListener('input', function() {
            if (roomCharCounter) roomCharCounter.textContent = `${this.value.length}/500`;
            this.style.height = 'auto';
            this.style.height = `${Math.min(this.scrollHeight, 120)}px`;
        });
    }

    if (btnRoomSend) {
        btnRoomSend.addEventListener('click', sendRoomMessage);
    }

    if (roomFileInput) {
        roomFileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                selectedRoomFile = this.files[0];
                if (chatFilePreviewName) chatFilePreviewName.textContent = selectedRoomFile.name;
                if (chatFilePreviewBar) chatFilePreviewBar.classList.remove('d-none');
                if (roomInputField) roomInputField.focus();
            }
        });
    }

    if (btnCancelChatFile) {
        btnCancelChatFile.addEventListener('click', () => {
            selectedRoomFile = null;
            if (roomFileInput) roomFileInput.value = '';
            if (chatFilePreviewBar) chatFilePreviewBar.classList.add('d-none');
        });
    }

    function sendRoomMessage() {
        if (isProcessing) return;
        const text = roomInputField ? roomInputField.value.trim() : '';
        if (!text && !selectedRoomFile) return;

        isProcessing = true;
        if (btnRoomSend) btnRoomSend.disabled = true;

        // Optimistic UI update
        if (text) {
            const timeStr = getCurrentTime();
            const userMsgHtml = `
                <div class="chat-message-item msg-row outgoing sent temporary-client-msg user-message">
                    <div class="message-content">
                        <div class="viettel-bubble msg-bubble">
                            <div class="message-text">${escapeHtml(text)}</div>
                        </div>
                        <div class="time">
                            ${timeStr} <span style="color: #8A8A8A; font-size: 11px; margin-left: 4px;"><i class="bi bi-clock"></i> Đang gửi...</span>
                        </div>
                    </div>
                    <div class="avatar">👤</div>
                </div>
            `;
            chatMessagesContainer.innerHTML += userMsgHtml;
            scrollContainerToBottom(chatMessagesContainer);
        }

        const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';
        const formData = new FormData();
        formData.append('idLienHe', currentLienHeId);
        formData.append('__RequestVerificationToken', token);

        let url = '/Chat/GuiTinNhanChatBox';
        if (selectedRoomFile) {
            url = '/Chat/UploadFileChatBox';
            formData.append('file', selectedRoomFile);
        } else {
            formData.append('messageText', text);
        }

        if (roomInputField) {
            roomInputField.value = '';
            roomInputField.style.height = '24px';
        }
        if (roomCharCounter) roomCharCounter.textContent = '0/500';
        
        selectedRoomFile = null;
        if (roomFileInput) roomFileInput.value = '';
        if (chatFilePreviewBar) chatFilePreviewBar.classList.add('d-none');

        fetch(url, {
            method: 'POST',
            body: formData
        })
        .then(res => {
            if (res.ok) return res.text();
            throw new Error("Lỗi gửi tin nhắn");
        })
        .then(html => {
            isProcessing = false;
            if (btnRoomSend) btnRoomSend.disabled = false;
            
            // Remove optimistic UI temp bubbles before applying html
            document.querySelectorAll('.temporary-client-msg').forEach(el => el.remove());

            chatMessagesContainer.innerHTML = html;
            scrollContainerToBottom(chatMessagesContainer);

            if (url === '/Chat/UploadFileChatBox' && text) {
                roomInputField.value = text;
                sendRoomMessage();
            }
        })
        .catch(err => {
            isProcessing = false;
            if (btnRoomSend) btnRoomSend.disabled = false;
            document.querySelectorAll('.temporary-client-msg').forEach(el => el.remove());
            console.error(err);
            alert("Lỗi khi gửi tin nhắn hỗ trợ.");
        });
    }

    // ==========================================
    // 6. AI CHAT ROOM SCREEN (Khách - Gemini)
    // ==========================================
    function loadAiHistory() {
        if (!chatAiMessagesContainer) return;
        chatAiMessagesContainer.innerHTML = '<div class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm me-2"></div> Nối máy AI...</div>';

        fetch('/Chat/LayLichSuChatAI')
            .then(res => res.text())
            .then(html => {
                chatAiMessagesContainer.innerHTML = html;
                scrollContainerToBottom(chatAiMessagesContainer);
            })
            .catch(err => console.error(err));
    }

    if (aiInputField) {
        aiInputField.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAiMessage(this.value);
            }
        });
        aiInputField.addEventListener('input', function() {
            if (aiCharCounter) aiCharCounter.textContent = `${this.value.length}/500`;
            this.style.height = 'auto';
            this.style.height = `${Math.min(this.scrollHeight, 120)}px`;
        });
    }

    if (btnAiSend) {
        btnAiSend.addEventListener('click', () => {
            if (aiInputField) sendAiMessage(aiInputField.value);
        });
    }

    if (aiFileInput) {
        aiFileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                selectedAiFile = this.files[0];
                if (aiFilePreviewName) aiFilePreviewName.textContent = selectedAiFile.name;
                if (aiFilePreviewBar) aiFilePreviewBar.classList.remove('d-none');
                if (aiInputField) aiInputField.focus();
            }
        });
    }

    if (btnCancelAiFile) {
        btnCancelAiFile.addEventListener('click', () => {
            selectedAiFile = null;
            if (aiFileInput) aiFileInput.value = '';
            if (aiFilePreviewBar) aiFilePreviewBar.classList.add('d-none');
        });
    }

    function sendAiMessage(text) {
        if (isProcessing) return;
        if (!text && !selectedAiFile) return;

        isProcessing = true;
        setAiStatus('thinking');
        if (btnAiSend) btnAiSend.disabled = true;

        // Optimistic UI update
        if (text) {
            const timeStr = getCurrentTime();
            const userMsgHtml = `
                <div class="chat-message-item msg-row outgoing sent temporary-client-msg user-message">
                    <div class="message-content">
                        <div class="viettel-bubble msg-bubble">
                            <div class="message-text">${escapeHtml(text)}</div>
                        </div>
                        <div class="time">
                            ${timeStr} <span style="color: #8A8A8A; font-size: 11px; margin-left: 4px;"><i class="bi bi-clock"></i> Đang gửi...</span>
                        </div>
                    </div>
                    <div class="avatar">👤</div>
                </div>
            `;
            if (aiTypingIndicator) {
                aiTypingIndicator.insertAdjacentHTML('beforebegin', userMsgHtml);
            } else {
                chatAiMessagesContainer.innerHTML += userMsgHtml;
            }
        }

        if (aiTypingIndicator) {
            aiTypingIndicator.style.display = 'flex';
            const typingTextEl = aiTypingIndicator.querySelector('.ai-typing-text');
            if (typingTextEl) {
                typingTextEl.textContent = "TechSupport AI đang trả lời";
            }
            if (window.aiTypingTimeout) {
                clearTimeout(window.aiTypingTimeout);
            }
            window.aiTypingTimeout = setTimeout(() => {
                if (aiTypingIndicator && aiTypingIndicator.style.display === 'flex') {
                    if (typingTextEl) {
                        typingTextEl.textContent = "TechSupport AI đang phân tích...";
                    }
                }
            }, 3000);
        }
        scrollContainerToBottom(chatAiMessagesContainer);

        const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';
        const formData = new FormData();
        formData.append('__RequestVerificationToken', token);

        let url = '/Chat/ChatAI';
        if (selectedAiFile) {
            url = '/Chat/UploadFileAI';
            formData.append('file', selectedAiFile);
        } else {
            formData.append('messageText', text.trim());
        }

        if (aiInputField) {
            aiInputField.value = '';
            aiInputField.style.height = '24px';
        }
        if (aiCharCounter) aiCharCounter.textContent = '0/500';

        selectedAiFile = null;
        if (aiFileInput) aiFileInput.value = '';
        if (aiFilePreviewBar) aiFilePreviewBar.classList.add('d-none');

        fetch(url, {
            method: 'POST',
            body: formData
        })
        .then(res => {
            if (res.ok) return res.text();
            throw new Error("Lỗi phản hồi từ AI");
        })
        .then(html => {
            isProcessing = false;
            if (btnAiSend) btnAiSend.disabled = false;
            if (aiTypingIndicator) {
                aiTypingIndicator.style.display = 'none';
                if (window.aiTypingTimeout) {
                    clearTimeout(window.aiTypingTimeout);
                }
            }

            // Remove optimistic UI temp bubbles before applying html
            document.querySelectorAll('.temporary-client-msg').forEach(el => el.remove());

            if (html.includes('🔴 AI tạm thời không khả dụng') || html.includes('không khả dụng')) {
                setAiStatus('fallback');
            } else {
                setAiStatus('ready');
            }

            chatAiMessagesContainer.innerHTML = html;
            scrollContainerToBottom(chatAiMessagesContainer);

            if (url === '/Chat/UploadFileAI' && text) {
                sendAiMessage(text);
            }
        })
        .catch(err => {
            isProcessing = false;
            setAiStatus('fallback');
            if (btnAiSend) btnAiSend.disabled = false;
            if (aiTypingIndicator) {
                aiTypingIndicator.style.display = 'none';
                if (window.aiTypingTimeout) {
                    clearTimeout(window.aiTypingTimeout);
                }
            }
            document.querySelectorAll('.temporary-client-msg').forEach(el => el.remove());
            console.error(err);
            chatAiMessagesContainer.innerHTML += `
                <div class="chat-message-item msg-row incoming received ai-message">
                    <div class="message-avatar msg-avatar robot-avatar">
                        <i class="bi bi-robot"></i>
                    </div>
                    <div class="message-content msg-bubble-wrapper">
                        <div class="viettel-bubble msg-bubble border border-danger-subtle bg-white">
                            <div class="message-text">Xin lỗi, AI hiện đang tạm thời không khả dụng.<br/><br/>Yêu cầu của bạn đã được chuyển đến nhân viên hỗ trợ.<br/><br/>Bạn vẫn có thể tiếp tục gửi tin nhắn.</div>
                            <div class='mt-3 d-flex flex-column gap-2 w-100 action-buttons-group'>
                                <a href='/Ticket/TaoPhieu' class='btn btn-danger btn-sm rounded-pill fw-bold text-white py-2 text-center text-decoration-none shadow-sm' style='background-color:#D71920; border-color:#D71920;'>
                                    <i class='bi bi-file-earmark-plus-fill me-1'></i> Tạo Phiếu Hỗ Trợ
                                </a>
                                <button type='button' class='btn btn-outline-danger btn-sm rounded-pill fw-bold py-2 text-center btn-transfer-staff shadow-sm' onclick='if(window.TechSupportChat && window.TechSupportChat.transferToStaff) window.TechSupportChat.transferToStaff();'>
                                    <i class='bi bi-headset me-1'></i> Chat Với Nhân Viên Kỹ Thuật
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            scrollContainerToBottom(chatAiMessagesContainer);
        });
    }

    // ==========================================
    // 7. TRACK TICKETS LIST SCREEN
    // ==========================================
    function loadTicketsList() {
        if (!trackTicketsContainer) return;
        trackTicketsContainer.innerHTML = '<div class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm me-2"></div> Đang tải danh sách phiếu...</div>';

        fetch('/Chat/TraCuuPhieuChatBox')
            .then(res => res.text())
            .then(html => {
                trackTicketsContainer.innerHTML = html;
            })
            .catch(err => {
                console.error(err);
                trackTicketsContainer.innerHTML = '<div class="text-center py-5 text-danger">Không thể tải danh sách phiếu.</div>';
            });
    }

    // FAQ Quick Suggestion Helper
    window.sendFaqQuery = function (text) {
        const input = document.getElementById('aiInputField');
        if (input) {
            input.value = text;
            input.dispatchEvent(new Event('input'));
            const sendBtn = document.getElementById('btnAiSend');
            if (sendBtn) {
                sendBtn.click();
            }
        }
    };

    // ==========================================
    // 8. AI INTENT DETECTION & AUTO UI SELECT
    // ==========================================
    window.addEventListener('ai_intent_detected', function(e) {
        const detail = e.detail;
        if (!detail) return;
        console.log("AI Intent Detected:", detail);

        const categorySelect = document.querySelector('select[name="IdDanhMuc"], select[name="categoryId"], #IdDanhMuc, #categoryId');
        const serviceSelect = document.querySelector('select[name="IdDichVu"], select[name="serviceId"], #IdDichVu, #serviceId');

        if (categorySelect && detail.categoryId) {
            categorySelect.value = detail.categoryId;
            categorySelect.dispatchEvent(new Event('change'));
        }
        if (serviceSelect && detail.serviceId) {
            setTimeout(() => {
                serviceSelect.value = detail.serviceId;
                serviceSelect.dispatchEvent(new Event('change'));
            }, 250);
        }
    });

    // ==========================================
    // 9. DYNAMIC SERVICE CARD LOADER
    // ==========================================
    function loadServiceCards() {
        document.querySelectorAll('.ai-service-card-slot[data-service-id]').forEach(slot => {
            const serviceId = slot.getAttribute('data-service-id');
            if (slot.dataset.loaded === 'true') return;
            slot.dataset.loaded = 'true';

            fetch(`/api/service/card-data/${serviceId}`)
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        slot.innerHTML = `
                            <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white" style="border: 1px solid #fee2e2 !important;">
                                <div class="position-relative">
                                    <img src="${res.hinhAnh}" class="card-img-top" style="height:140px; object-fit:cover; width:100%;" alt="${res.tenDichVu}" onerror="this.src='https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80';" />
                                    <span class="badge bg-danger position-absolute top-0 end-0 m-2 shadow-sm">${res.tenDanhMuc}</span>
                                </div>
                                <div class="card-body p-3">
                                    <h6 class="fw-bold text-dark mb-1" style="font-size:0.95rem;">${res.tenDichVu}</h6>
                                    <p class="small text-muted mb-2" style="font-size:0.78rem; line-height:1.4;">${res.moTa}</p>
                                    <div class="d-flex justify-content-between align-items-center mb-3 text-secondary small" style="font-size:0.75rem;">
                                        <span><i class="bi bi-clock-history me-1 text-danger"></i>Thời gian: <strong>${res.thoiGianXuLy}</strong></span>
                                    </div>
                                    <div class="d-flex gap-2">
                                        <a href="/Ticket/TaoPhieu?serviceId=${res.idDichVu}&categoryId=${res.idDanhMuc}" class="btn btn-danger btn-sm rounded-pill flex-grow-1 fw-bold text-white shadow-sm" style="background-color:#D71920;">
                                            <i class="bi bi-file-earmark-plus-fill me-1"></i>Tạo Phiếu
                                        </a>
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        slot.innerHTML = `<div class="text-danger small p-2"><i class="bi bi-exclamation-circle me-1"></i>Không thể tải thông tin dịch vụ.</div>`;
                    }
                })
                .catch(err => {
                    console.error("Error loading service card:", err);
                });
        });
    }

    const observer = new MutationObserver(() => loadServiceCards());
    if (chatAiMessagesContainer) {
        observer.observe(chatAiMessagesContainer, { childList: true, subtree: true });
    }
    loadServiceCards();

    // ==========================================
    // 10. APPOINTMENT SLOT SELECTION HELPER
    // ==========================================
    window.selectAiAppointmentSlot = function(time, btn) {
        if (!config.isLoggedIn) {
            if (loginModal) loginModal.style.display = 'flex';
            return;
        }

        const cardContainer = btn.closest('.ai-appointment-slots-card');
        if (confirm(`Bạn muốn xác nhận đặt lịch hẹn kỹ thuật vào lúc ${time}?`)) {
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Đang đặt...`;

            fetch('/api/appointment/create-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ngayHen: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                    gioHen: time,
                    ghiChu: 'Khách hàng đặt lịch trực tiếp qua Chatbox AI TechSupport'
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    if (cardContainer) {
                        cardContainer.innerHTML = `
                            <div class="alert alert-success m-0 rounded-4 border-0 shadow-sm p-3 style="border-left: 4px solid #198754 !important;">
                                <h6 class="fw-bold mb-2 text-success" style="font-size:0.9rem;"><i class="bi bi-check-circle-fill me-2"></i>ĐẶT LỊCH HẸN THÀNH CÔNG!</h6>
                                <div class="small text-dark" style="font-size:0.8rem; line-height:1.5;">
                                    <div><strong>Mã lịch hẹn:</strong> LH#${data.idLichHen}</div>
                                    <div><strong>Ngày hẹn:</strong> ${data.ngayHen}</div>
                                    <div><strong>Giờ hẹn:</strong> ${data.gioHen}</div>
                                    <div><strong>Kỹ thuật viên:</strong> ${data.tenKtv} (SĐT: ${data.sdtKtv})</div>
                                    <div><strong>Địa chỉ:</strong> ${data.diaChi}</div>
                                    <div class="mt-2"><span class="badge bg-success-subtle text-success fw-bold px-2 py-1">${data.trangThai}</span></div>
                                </div>
                            </div>
                        `;
                    }
                } else {
                    btn.disabled = false;
                    btn.innerHTML = `${time}`;
                    alert(data.message || 'Lỗi đặt lịch hẹn.');
                }
            })
            .catch(err => {
                btn.disabled = false;
                btn.innerHTML = `${time}`;
                console.error(err);
                alert('Lỗi kết nối khi đặt lịch.');
            });
        }
    };

    // ==========================================
    // 11. CONFIRM TICKET CREATION HELPER
    // ==========================================
    window.confirmCreateTicket = function(btn, title, categoryId, serviceId, address, content) {
        if (!config.isLoggedIn) {
            if (loginModal) loginModal.style.display = 'flex';
            return;
        }

        const cardContainer = btn.closest('.ai-confirm-ticket-card');
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Đang tạo...`;

        fetch('/api/ticket/create-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                categoryId: categoryId,
                serviceId: serviceId,
                address: address,
                content: content
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (cardContainer) {
                    cardContainer.innerHTML = `
                        <div class="alert alert-success m-0 rounded-4 border-0 shadow-sm p-3" style="border-left: 4px solid #198754 !important; background-color: #f0fdf4;">
                            <h6 class="fw-bold mb-2 text-success" style="font-size:0.95rem;">
                                <i class="bi bi-check-circle-fill me-2"></i>PHIẾU HỖ TRỢ CỦA BẠN ĐÃ ĐƯỢC TẠO THÀNH CÔNG!
                            </h6>
                            <div class="small text-dark" style="font-size:0.85rem; line-height:1.6;">
                                <div>• <strong>Mã phiếu:</strong> <span class="badge bg-danger text-white fw-bold px-2 py-1">${data.maPhieu}</span></div>
                                <div>• <strong>Trạng thái:</strong> <span class="badge bg-warning-subtle text-dark fw-bold px-2 py-1">${data.trangThai}</span></div>
                                <div>• <strong>Dịch vụ:</strong> ${data.tenDichVu}</div>
                                <div>• <strong>Kỹ thuật viên:</strong> ${data.tenKtv}</div>
                                <div class="mt-2 text-muted">Hệ thống sẽ tự động phân công kỹ thuật viên phù hợp và thông báo khi có cập nhật.</div>
                            </div>
                        </div>
                    `;
                }
            } else {
                btn.disabled = false;
                btn.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Tạo phiếu hỗ trợ`;
                alert(data.message || "Lỗi khi tạo phiếu hỗ trợ.");
            }
        })
        .catch(err => {
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Tạo phiếu hỗ trợ`;
            console.error(err);
            alert("Lỗi kết nối khi tạo phiếu.");
        });
    };

    window.cancelConfirmTicket = function(btn) {
        const cardContainer = btn.closest('.ai-confirm-ticket-card');
        if (cardContainer) {
            cardContainer.innerHTML = `
                <div class="alert alert-secondary m-0 rounded-4 border-0 p-2 small text-muted">
                    <i class="bi bi-info-circle me-1"></i> Đã hủy yêu cầu tạo phiếu hỗ trợ. Bạn có thể tiếp tục hỏi hoặc chọn dịch vụ khác.
                </div>
            `;
        }
    };
});
