/**
 * chat.js - Main Client-Side Controller for Floating AI Chatbox & Support Widget
 * Handles screen switching, conversations list, chat room, AI chat, file uploads, and login prompts.
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
            // Default: show home screen
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

    // Switch between screens cleanly
    function switchScreen(targetScreen) {
        [screenHome, screenConversations, screenChatRoom, screenAiChat, screenTrackTickets].forEach(screen => {
            if (screen) screen.classList.add('d-none');
        });
        if (targetScreen) targetScreen.classList.remove('d-none');
        
        // Header home button visibility
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
            // Logged in: open AI Chat and send ticket prompt to begin slot-filling
            switchScreen(screenAiChat);
            loadAiHistory();
            setTimeout(() => {
                sendAiMessage("Tôi muốn tạo một phiếu hỗ trợ kỹ thuật mới.");
            }, 500);
        });
    }

    // Handle Auto-Open query trigger
    if (config.autoOpen) {
        setTimeout(() => {
            if (windowEl && !windowEl.classList.contains('open')) {
                windowEl.classList.add('open');
                if (launcher) launcher.classList.add('open');
                switchScreen(screenHome);
            }
        }, 800);
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
                console.error("Error loading conversations list: ", err);
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

        // Load Header Info
        fetch(`/Chat/ChiTietConversation?idLienHe=${idLienHe}`)
            .then(res => res.text())
            .then(html => {
                chatRoomHeaderContainer.innerHTML = html;
            })
            .catch(err => console.error(err));

        // Load Messages
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

    function scrollContainerToBottom(container) {
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 50);
        }
    }

    // Room Text Input listeners
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

    // Room File Selection
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

        // Reset Inputs
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
            
            chatMessagesContainer.innerHTML = html;
            scrollContainerToBottom(chatMessagesContainer);

            // If we uploaded a file AND also had a text prompt, send the text afterward
            if (url === '/Chat/UploadFileChatBox' && text) {
                roomInputField.value = text;
                sendRoomMessage();
            }
        })
        .catch(err => {
            isProcessing = false;
            if (btnRoomSend) btnRoomSend.disabled = false;
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
        if (btnAiSend) btnAiSend.disabled = true;

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

        // Reset Inputs
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

            chatAiMessagesContainer.innerHTML = html;
            scrollContainerToBottom(chatAiMessagesContainer);

            // Send text separately if they uploaded a file and typed message
            if (url === '/Chat/UploadFileAI' && text) {
                sendAiMessage(text);
            }
        })
        .catch(err => {
            isProcessing = false;
            if (btnAiSend) btnAiSend.disabled = false;
            if (aiTypingIndicator) {
                aiTypingIndicator.style.display = 'none';
                if (window.aiTypingTimeout) {
                    clearTimeout(window.aiTypingTimeout);
                }
            }
            console.error(err);
            alert("Lỗi khi kết nối với AI.");
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
});
