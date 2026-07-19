/**
 * chatbox.js - AI Customer Support Chatbox Controller
 * Interacts with ChatController endpoints for Gemini AI responses, guest flow, and file uploads.
 */
document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // Global Widget Namespace
    window.TechSupportChat = {
        openConversation: openConversation,
        backToConversations: backToConversations
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
    const refreshBtn = document.getElementById('chatRefresh');
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
            maximizeBtn.querySelector('i').className = isMax ? 'bi bi-fullscreen-exit' : 'bi bi-arrows-fullscreen';
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            // Add rotation animation
            const icon = refreshBtn.querySelector('i');
            icon.style.transition = 'transform 0.5s ease';
            icon.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                icon.style.transform = 'rotate(0deg)';
            }, 500);

            // Reload current screen content
            if (!screenAiChat.classList.contains('d-none')) {
                loadAiHistory();
            } else if (!screenChatRoom.classList.contains('d-none')) {
                if (currentLienHeId) {
                    openConversation(currentLienHeId);
                }
            } else if (!screenConversations.classList.contains('d-none')) {
                loadConversationsList();
            } else if (!screenTrackTickets.classList.contains('d-none')) {
                loadTicketsList();
            }
        });
    }

    // Suggestion pills click delegation
    document.addEventListener('click', (e) => {
        const pill = e.target.closest('.suggestion-pill');
        if (pill) {
            const text = pill.getAttribute('data-text');
            if (!text) return;
            if (!screenAiChat.classList.contains('d-none')) {
                const aiInputField = document.getElementById('aiInputField');
                const btnAiSend = document.getElementById('btnAiSend');
                if (aiInputField && btnAiSend) {
                    aiInputField.value = text;
                    btnAiSend.click();
                }
            } else if (!screenChatRoom.classList.contains('d-none')) {
                const roomInputField = document.getElementById('roomInputField');
                const btnRoomSend = document.getElementById('btnRoomSend');
                if (roomInputField && btnRoomSend) {
                    roomInputField.value = text;
                    btnRoomSend.click();
                }
            }
        }
    });

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
                <div class="chat-message-row client d-flex justify-content-end mb-2 temporary-client-msg" style="width:100%; display:flex !important; justify-content:flex-end !important;">
                    <div style="width:fit-content !important; max-width:75% !important; align-self:flex-end !important; display:flex !important; flex-direction:column !important; align-items:flex-end !important; margin-left:auto !important;">
                        <div style="background:linear-gradient(135deg,#D71920 0%,#E53935 100%) !important; color:#FFFFFF !important; border-radius:20px 20px 4px 20px !important; padding:10px 16px !important; font-size:0.92rem !important; line-height:1.45 !important; display:inline-block !important; width:fit-content !important; height:auto !important; max-width:100% !important; word-break:break-word !important; white-space:pre-wrap !important; overflow-wrap:anywhere !important; box-shadow:0 4px 14px rgba(215,25,32,0.18) !important; box-sizing:border-box !important;">${escapeHtml(text)}</div>
                        <div style="font-size:11.5px; color:#94A3B8; margin-top:4px; display:flex; align-items:center; gap:4px; align-self:flex-end;">
                            ${timeStr} <span style="color:#8A8A8A; font-size:11px;"><i class="bi bi-clock"></i> Đang gửi...</span>
                        </div>
                    </div>
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

        const trimmedText = typeof text === 'string' ? text.trim() : '';
        if (!trimmedText && !selectedAiFile) return;

        isProcessing = true;
        if (btnAiSend) btnAiSend.disabled = true;

        // ============================================
        // PHASE 0: Render user bubble IMMEDIATELY (<5ms)
        // ============================================
        if (trimmedText) {
            const timeStr = getCurrentTime();
            const userBubble = document.createElement('div');
            userBubble.className = 'optimistic-enter';
            userBubble.innerHTML = `
                <div class="chat-message-row client d-flex justify-content-end mb-2" style="width:100%; display:flex !important; justify-content:flex-end !important;">
                    <div style="width:fit-content !important; max-width:75% !important; align-self:flex-end !important; display:flex !important; flex-direction:column !important; align-items:flex-end !important; margin-left:auto !important;">
                        <div style="background:linear-gradient(135deg,#D71920 0%,#E53935 100%) !important; color:#FFFFFF !important; border-radius:20px 20px 4px 20px !important; padding:10px 16px !important; font-size:0.92rem !important; line-height:1.45 !important; display:inline-block !important; width:fit-content !important; height:auto !important; max-width:100% !important; word-break:break-word !important; white-space:pre-wrap !important; overflow-wrap:anywhere !important; box-shadow:0 4px 14px rgba(215,25,32,0.18) !important; box-sizing:border-box !important;">${escapeHtml(trimmedText)}</div>
                        <div style="font-size:11.5px; color:#94A3B8; margin-top:4px; align-self:flex-end;">${timeStr} <span style="color:#22C55E; font-weight:bold;">✓✓</span></div>
                    </div>
                </div>
            `;
            chatAiMessagesContainer.appendChild(userBubble);
        }

        // ============================================
        // PHASE 0b: Clear input IMMEDIATELY
        // ============================================
        if (aiInputField) {
            aiInputField.value = '';
            aiInputField.style.height = '24px';
            aiInputField.focus();
        }
        if (aiCharCounter) aiCharCounter.textContent = '0/500';

        // ============================================
        // PHASE 0c: Scroll down + Show typing indicator
        // ============================================
        scrollContainerToBottom(chatAiMessagesContainer);

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

        // ============================================
        // Prepare form data
        // ============================================
        const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';

        const capturedFile = selectedAiFile;
        selectedAiFile = null;
        if (aiFileInput) aiFileInput.value = '';
        if (aiFilePreviewBar) aiFilePreviewBar.classList.add('d-none');

        // ============================================
        // PHASE 1: Save user message (fire-and-forget, fast ~100ms)
        // For file uploads, use the old endpoint (single request)
        // ============================================
        if (capturedFile) {
            // File upload: use old single-request flow
            const formData = new FormData();
            formData.append('__RequestVerificationToken', token);
            formData.append('file', capturedFile);

            fetch('/Chat/UploadFileAI', {
                method: 'POST',
                body: formData
            })
            .then(res => {
                if (res.ok) return res.text();
                throw new Error("Lỗi phản hồi từ AI");
            })
            .then(html => {
                hideTypingIndicator();
                chatAiMessagesContainer.innerHTML = html;
                scrollContainerToBottom(chatAiMessagesContainer);
                finishProcessing();

                // If there was also text, send it as a follow-up
                if (trimmedText) {
                    sendAiMessage(trimmedText);
                }
            })
            .catch(err => {
                console.error(err);
                hideTypingIndicator();
                appendErrorBubble();
                finishProcessing();
            });
            return;
        }

        // Text-only message: use two-phase optimistic flow
        const saveFormData = new FormData();
        saveFormData.append('__RequestVerificationToken', token);
        saveFormData.append('messageText', trimmedText);

        // Phase 1: Save (fire-and-forget — we don't need to await this)
        fetch('/Chat/ChatAI_SaveUserMessage', {
            method: 'POST',
            body: saveFormData
        }).catch(err => {
            console.warn('Failed to save user message:', err);
        });

        // ============================================
        // PHASE 2: Get AI response (slow, 3-10s)
        // ============================================
        const aiFormData = new FormData();
        aiFormData.append('__RequestVerificationToken', token);
        aiFormData.append('messageText', trimmedText);

        fetch('/Chat/ChatAI_GetAiResponse', {
            method: 'POST',
            body: aiFormData
        })
        .then(res => {
            if (res.ok) return res.text();
            throw new Error("Lỗi phản hồi từ AI");
        })
        .then(aiBubbleHtml => {
            // Hide typing indicator
            hideTypingIndicator();

            // Append ONLY the new AI bubble (no innerHTML replacement)
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = aiBubbleHtml.trim();

            while (tempContainer.firstChild) {
                const node = tempContainer.firstChild;
                if (node.nodeType === Node.ELEMENT_NODE) {
                    node.classList.add('optimistic-enter');
                }
                chatAiMessagesContainer.appendChild(node);
            }

            scrollContainerToBottom(chatAiMessagesContainer);
            finishProcessing();
        })
        .catch(err => {
            console.error(err);
            hideTypingIndicator();
            appendErrorBubble();
            finishProcessing();
        });
    }

    // ==========================================
    // HELPER: Hide typing indicator
    // ==========================================
    function hideTypingIndicator() {
        if (aiTypingIndicator) {
            aiTypingIndicator.style.display = 'none';
            if (window.aiTypingTimeout) {
                clearTimeout(window.aiTypingTimeout);
                window.aiTypingTimeout = null;
            }
        }
    }

    // ==========================================
    // HELPER: Finish processing state
    // ==========================================
    function finishProcessing() {
        isProcessing = false;
        if (btnAiSend) btnAiSend.disabled = false;
        if (aiInputField) aiInputField.focus();
    }

    // ==========================================
    // HELPER: Append error bubble (not alert)
    // ==========================================
    function appendErrorBubble() {
        const errorBubble = document.createElement('div');
        errorBubble.className = 'optimistic-enter';
        errorBubble.innerHTML = `
            <div class="chat-message-row staff d-flex justify-content-start align-items-end gap-2 mb-2" style="width:100%;">
                <div style="background:#F59E0B; width:34px; height:34px; border-radius:50%; display:grid; place-items:center; font-size:0.78rem; color:#fff; flex-shrink:0;">
                    <i class="bi bi-robot fs-6"></i>
                </div>
                <div style="width:fit-content !important; max-width:75% !important; display:flex !important; flex-direction:column !important; align-items:flex-start !important;">
                    <div style="background-color:#FFF6E8 !important; color:#1E293B !important; border:1px solid #FDE68A !important; border-radius:20px 20px 20px 4px !important; padding:10px 16px !important; font-size:0.92rem !important; line-height:1.45 !important; display:inline-block !important; width:fit-content !important; height:auto !important; max-width:100% !important; word-break:break-word !important; white-space:pre-wrap !important; overflow-wrap:anywhere !important; box-sizing:border-box !important;">
                        <i class="bi bi-exclamation-triangle-fill me-1"></i>
                        Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.
                    </div>
                    <div style="font-size:12px; color:#94A3B8; margin-top:4px;">${getCurrentTime()}</div>
                </div>
            </div>
        `;
        chatAiMessagesContainer.appendChild(errorBubble);
        scrollContainerToBottom(chatAiMessagesContainer);
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
});
