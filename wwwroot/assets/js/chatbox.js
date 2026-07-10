/**
 * chatbox.js - AI Customer Support Chatbox Controller
 * Powers the launcher, screen transitions, dialogue trees, past histories, and typing animations.
 */
document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ==========================================================================
    // 1. SELECTORS & STATE
    // ==========================================================================
    const launcher = document.getElementById('chatLauncher');
    const windowEl = document.getElementById('chatWindow');
    const minimizeBtn = document.getElementById('chatMinimize');
    const maximizeBtn = document.getElementById('chatMaximize');
    const closeBtn = document.getElementById('chatClose');
    
    const screenWelcome = document.getElementById('screenWelcome');
    const screenStream = document.getElementById('screenStream');
    const backBtn = document.getElementById('btnBackToWelcome');
    
    const convoContainer = document.getElementById('convoListContainer');
    const convoSearch = document.getElementById('convoSearchInput');
    const convoFilter = document.getElementById('convoFilterSelect');
    
    const messagesContainer = document.getElementById('chatMessagesContainer');
    const typingIndicator = document.getElementById('aiTypingIndicator');
    const chatInput = document.getElementById('chatInputField');
    const sendBtn = document.getElementById('btnSendChat');
    const charCounter = document.getElementById('chatCharCounter');

    let currentAction = '';
    let currentTicketId = '';

    const mockConversations = [
        { id: 'PS00125', title: 'Mất kết nối Internet', lastMsg: 'Đã hoàn thành đo suy hao cáp quang thuê bao', time: '14:30', status: 'processing', statusText: 'Đang xử lý' },
        { id: 'PS00126', title: 'Camera không hoạt động', lastMsg: 'Đèn hồng ngoại tắt hoàn toàn, đã reset modem', time: 'Hôm qua', status: 'completed', statusText: 'Hoàn thành' }
    ];

    let conversations = [...mockConversations];

    // ==========================================================================
    // 2. TOGGLE CONTROLS (OPEN / CLOSE / MAXIMIZE)
    // ==========================================================================
    const toggleChat = () => {
        const isOpen = windowEl.classList.toggle('open');
        launcher.classList.toggle('open');
        
        // Hide badge when opened
        const badge = document.getElementById('launcherBadge');
        if (isOpen && badge) {
            badge.style.display = 'none';
        }
    };

    if (launcher) launcher.addEventListener('click', toggleChat);
    if (minimizeBtn) minimizeBtn.addEventListener('click', () => { windowEl.classList.remove('open'); launcher.classList.remove('open'); });
    if (closeBtn) closeBtn.addEventListener('click', () => { windowEl.classList.remove('open'); launcher.classList.remove('open'); });

    // Maximize split-view toggle
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
            const isMaximized = windowEl.classList.toggle('chat-maximized');
            const icon = maximizeBtn.querySelector('i');
            
            if (isMaximized) {
                icon.className = 'bi bi-fullscreen-exit';
                maximizeBtn.setAttribute('title', 'Thu nhỏ cửa sổ');
                
                // In maximized mode, ensure screenStream is visible on large screens
                if (window.innerWidth >= 992) {
                    if (!currentAction && !currentTicketId) {
                        // Pre-load default chat if none is open
                        loadQuickActionChat('agent');
                    }
                }
            } else {
                icon.className = 'bi bi-arrows-fullscreen';
                maximizeBtn.setAttribute('title', 'Phóng to cửa sổ');
            }
        });
    }

    // Screen navigation: back button
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            windowEl.classList.remove('chat-active-stream');
            currentAction = '';
            currentTicketId = '';
            
            // Remove active highlighting from convo cards
            document.querySelectorAll('.convo-row').forEach(row => row.classList.remove('active'));
        });
    }

    // ==========================================================================
    // 3. CONVERSATION HISTORY (RENDER & FILTER)
    // ==========================================================================
    const renderConversations = () => {
        if (!convoContainer) return;
        convoContainer.innerHTML = '';

        if (conversations.length === 0) {
            convoContainer.innerHTML = `<div class="text-center py-3 text-muted" style="font-size: 0.8rem;">Không tìm thấy lịch sử nào.</div>`;
            return;
        }

        conversations.forEach(c => {
            const row = document.createElement('div');
            row.className = `convo-row ${currentTicketId === c.id ? 'active' : ''}`;
            row.setAttribute('data-id', c.id);
            row.innerHTML = `
                <div class="convo-row-header">
                    <span class="convo-code">${c.id}</span>
                    <span class="convo-time">${c.time}</span>
                </div>
                <div class="convo-title">${c.title}</div>
                <div class="convo-last-msg">${c.lastMsg}</div>
                <div class="convo-row-footer">
                    <span class="convo-status ${c.status}">
                        <i class="bi bi-circle-fill" style="font-size: 0.4rem;"></i> ${c.statusText}
                    </span>
                    <span class="small text-muted" style="font-size: 0.7rem;">Nhấp để xem</span>
                </div>
            `;
            
            row.addEventListener('click', function() {
                loadTicketChat(c.id);
                
                // Highlight row in split pane
                document.querySelectorAll('.convo-row').forEach(r => r.classList.remove('active'));
                row.classList.add('active');
            });

            convoContainer.appendChild(row);
        });
    };

    // Filter and search convo list
    const filterConvos = () => {
        const query = convoSearch ? convoSearch.value.toLowerCase().trim() : '';
        const filterVal = convoFilter ? convoFilter.value : 'all';

        conversations = mockConversations.filter(c => {
            const matchesQuery = c.id.toLowerCase().includes(query) || c.title.toLowerCase().includes(query);
            const matchesFilter = filterVal === 'all' || c.status === filterVal;
            return matchesQuery && matchesFilter;
        });

        renderConversations();
    };

    if (convoSearch) convoSearch.addEventListener('input', filterConvos);
    if (convoFilter) convoFilter.addEventListener('change', filterConvos);

    // Initial render
    renderConversations();

    // ==========================================================================
    // 4. DIALOGUE SYSTEM & CHAT MESSAGES
    // ==========================================================================
    const appendMessage = (sender, text, isAi = false) => {
        const row = document.createElement('div');
        row.className = `msg-row ${isAi ? 'received' : 'sent'}`;

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        let avatarHtml = '';
        if (isAi) {
            avatarHtml = `<div class="msg-avatar"><i class="bi bi-robot"></i></div>`;
        }

        const readIcon = !isAi ? `<i class="bi bi-check-all msg-status-icon read ms-1"></i>` : '';

        row.innerHTML = `
            ${avatarHtml}
            <div class="msg-bubble-wrapper">
                <div class="msg-bubble">${text}</div>
                <span class="msg-metadata">
                    <span>${timeStr}</span>
                    ${readIcon}
                </span>
            </div>
        `;

        messagesContainer.appendChild(row);
        scrollChatToBottom();
    };

    const scrollChatToBottom = () => {
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 50);
    };

    const showTypingIndicator = (show = true) => {
        if (typingIndicator) {
            typingIndicator.style.display = show ? 'flex' : 'none';
        }
        scrollChatToBottom();
    };

    const simulateAiResponse = (promptText, responseText, delay = 1000) => {
        showTypingIndicator(true);
        setTimeout(() => {
            showTypingIndicator(false);
            appendMessage('AI', responseText, true);
        }, delay);
    };

    // ==========================================================================
    // 5. QUICK ACTIONS CHAT FLOWS
    // ==========================================================================
    const loadQuickActionChat = (action) => {
        currentAction = action;
        currentTicketId = '';
        windowEl.classList.add('chat-active-stream');

        // Reset scroll position and clear old logs
        messagesContainer.innerHTML = '';

        const titleEl = document.getElementById('streamTicketTitle');
        const statusEl = document.getElementById('streamTicketStatus');
        const descEl = document.getElementById('streamTicketDesc');

        statusEl.className = 'stream-header-status-badge processing';
        statusEl.textContent = 'Hỗ trợ AI';

        switch(action) {
            case 'create-ticket':
                titleEl.textContent = 'Tạo phiếu hỗ trợ';
                descEl.textContent = 'Trợ lý ảo hướng dẫn tạo phiếu sự cố';
                appendMessage('AI', 'Chào anh/chị, tôi sẽ hỗ trợ tạo phiếu báo hỏng kỹ thuật. Anh/chị vui lòng nhập **Số điện thoại** đăng ký đường truyền hoặc **Mã hợp đồng** (ví dụ: T012_FTTH_...) để tiếp tục.', true);
                break;
            case 'lookup-ticket':
                titleEl.textContent = 'Tra cứu trạng thái';
                descEl.textContent = 'Tra cứu tự động dữ liệu sự cố';
                appendMessage('AI', 'Anh/chị vui lòng nhập **Mã phiếu hỗ trợ** cần tra cứu (ví dụ: PS00125) hoặc số điện thoại liên kết.', true);
                break;
            case 'troubleshoot':
                titleEl.textContent = 'Khắc phục sự cố';
                descEl.textContent = 'Tự hướng dẫn xử lý lỗi tại chỗ';
                appendMessage('AI', 'Chào bạn! Để giúp khắc phục nhanh lỗi mạng Wi-Fi/Truyền hình, bạn vui lòng chọn lỗi đang gặp:\n\n1️⃣ Đèn modem nhấp nháy đỏ (LOS)\n2️⃣ Mạng Wi-Fi kết nối được nhưng không truy cập được web\n3️⃣ Đầu thu truyền hình không lên tín hiệu\n\nBạn hãy gõ số tương ứng để xem quy trình hướng dẫn xử lý.', true);
                break;
            case 'scheduler':
                titleEl.textContent = 'Đặt lịch kỹ thuật';
                descEl.textContent = 'Đặt lịch hẹn kiểm tra tại nhà';
                appendMessage('AI', 'Để đặt lịch hẹn kỹ thuật viên trạm đến nhà kiểm tra thiết bị, bạn hãy cung cấp thông tin **Thời gian rảnh mong muốn** và **Số điện thoại liên lạc**.', true);
                break;
            case 'agent':
                titleEl.textContent = 'Nhân viên hỗ trợ';
                descEl.textContent = 'Kết nối trực tiếp tổng đài viên';
                appendMessage('AI', 'Tôi đang kết nối bạn với nhân viên kỹ thuật trực tuyến khu vực. Vui lòng chờ trong giây lát (khoảng 30 giây).', true);
                showTypingIndicator(true);
                setTimeout(() => {
                    showTypingIndicator(false);
                    statusEl.className = 'stream-header-status-badge completed';
                    statusEl.textContent = 'Kỹ thuật viên';
                    descEl.textContent = 'Trực tuyến với Trần Thanh Sơn';
                    appendMessage('Trần Thanh Sơn', 'Chào anh/chị, tôi là Sơn - Kỹ thuật viên trực ban. Tôi có thể hỗ trợ gì cho anh/chị hôm nay?', true);
                }, 2000);
                break;
            case 'rate':
                titleEl.textContent = 'Đánh giá dịch vụ';
                descEl.textContent = 'Gửi ý kiến phản hồi chất lượng';
                appendMessage('AI', 'Đánh giá của bạn rất quan trọng để chúng tôi nâng cao chất lượng phục vụ. Hãy chọn mức độ hài lòng:\n\n⭐⭐⭐⭐⭐ Rất tốt\n⭐⭐⭐⭐ Tốt\n⭐⭐⭐ Bình thường\n⭐⭐ Tệ\n⭐ Rất tệ\n\nVui lòng gõ số sao bạn muốn đánh giá.', true);
                break;
        }
    };

    // Attach listeners on Quick Actions cards
    document.querySelectorAll('.quick-action-card').forEach(card => {
        card.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            loadQuickActionChat(action);
        });
    });

    // ==========================================================================
    // 6. PAST CONVERSATION CHAT LOAD
    // ==========================================================================
    const loadTicketChat = (ticketId) => {
        currentTicketId = ticketId;
        currentAction = '';
        windowEl.classList.add('chat-active-stream');
        
        messagesContainer.innerHTML = '';

        const titleEl = document.getElementById('streamTicketTitle');
        const statusEl = document.getElementById('streamTicketStatus');
        const descEl = document.getElementById('streamTicketDesc');

        const convo = mockConversations.find(c => c.id === ticketId);
        if (!convo) return;

        titleEl.textContent = convo.id;
        descEl.textContent = convo.title;
        
        // Status class mapping
        statusEl.className = `stream-header-status-badge ${convo.status}`;
        statusEl.textContent = convo.statusText;

        // Load historical dialog
        if (convo.id === 'PS00125') {
            appendMessage('AI', 'Chào anh/chị, phiếu sự cố **PS00125 (Mất kết nối Internet)** của anh/chị đã được ghi nhận vào hệ thống vào lúc 10:15.', true);
            appendMessage('Khách hàng', 'Kiểm tra giúp mạng nhà tôi bị mất từ sáng.', false);
            appendMessage('Kỹ thuật viên', 'Chào anh, tôi đã đo suy hao cổng cáp quang trạm OLT phát hiện đứt cáp nhánh. Nhân viên kỹ thuật khu vực Cầu Giấy đã được cử đi hàn nối cáp và sẽ hoàn tất trước 16:30.', true);
        } else {
            appendMessage('AI', 'Chào anh/chị, phiếu sự cố **PS00126 (Camera không hoạt động)** đã hoàn thành xử lý lúc 09:00 hôm qua.', true);
            appendMessage('Khách hàng', 'Cảm ơn, kỹ thuật viên đã qua hỗ trợ reset modem và cấu hình lại đầu ghi.', false);
        }
        
        scrollChatToBottom();
    };

    // ==========================================================================
    // 7. INPUT / CHAT TRIGGER HANDLERS
    // ==========================================================================
    const handleUserSendMessage = () => {
        if (!chatInput || !chatInput.value.trim()) return;

        const text = chatInput.value.trim();
        chatInput.value = '';
        if (charCounter) charCounter.textContent = '0/500';
        chatInput.style.height = '38px'; // Reset height

        // Append user bubble
        appendMessage('Khách hàng', text, false);

        // Generate response based on current context
        let reply = 'Cảm ơn bạn đã phản hồi. Trợ lý AI đang chuyển thông tin cho điều phối viên để giải quyết sớm nhất.';

        if (currentAction === 'create-ticket') {
            if (/^\d+$/.test(text)) {
                reply = 'Căn cứ vào Số điện thoại bạn nhập, hệ thống phát hiện Hợp đồng: **FTTH-VIETTEL-9921**. Tôi đã tạo phiếu **PS00127** yêu cầu kiểm tra suy hao quang. Nhân viên kỹ thuật sẽ liên hệ hỗ trợ bạn.';
                currentAction = ''; // clear action context
            } else {
                reply = 'Tôi nhận được thông tin. Hệ thống đang xác thực Mã hợp đồng này. Vui lòng giữ kết nối trực tuyến.';
            }
        } else if (currentAction === 'lookup-ticket') {
            if (text.toUpperCase().includes('PS00125')) {
                reply = 'Phiếu **PS00125** đang ở trạng thái **Đang xử lý**. Nhân viên kỹ thuật đang đo kiểm đầu trạm. Ước tính hoàn thành khắc phục lỗi lúc 16:30.';
            } else if (text.toUpperCase().includes('PS00126')) {
                reply = 'Phiếu **PS00126** đã ở trạng thái **Hoàn thành** vào hôm qua.';
            } else {
                reply = 'Hệ thống không tìm thấy phiếu nào tương ứng với thông tin bạn cung cấp. Vui lòng kiểm tra lại mã phiếu (ví dụ: PS00125).';
            }
        } else if (currentAction === 'troubleshoot') {
            if (text === '1') {
                reply = '🔴 **Lỗi đèn modem LOS nhấp nháy đỏ:**\n\nĐây là lỗi đứt cáp quang hoặc mất tín hiệu quang từ trạm OLT. Bạn vui lòng:\n1. Kiểm tra đầu cắm cáp quang màu xanh lá cắm vào modem xem có bị lỏng không.\n2. Rút nguồn điện modem, chờ 1 phút rồi cắm lại.\n\nNếu vẫn báo đỏ, bạn hãy chọn nút **Tạo phiếu hỗ trợ** để cử nhân viên kỹ thuật qua hàn cáp đứt.';
            } else if (text === '2') {
                reply = '🟡 **Lỗi kết nối Wi-Fi nhưng không truy cập được mạng:**\n\nBạn vui lòng:\n1. Tắt kết nối Wi-Fi trên máy điện thoại và bật lại.\n2. Kiểm tra đèn internet trên modem có sáng xanh không. Nếu nháy đỏ hoặc tắt, vui lòng reset cấu hình modem.';
            } else {
                reply = 'Yêu cầu chưa khớp. Bạn vui lòng gõ phím **1**, **2** hoặc **3** tương ứng với các sự cố gợi ý phía trên.';
            }
        } else if (currentAction === 'rate') {
            if (text.includes('5') || text.includes('4')) {
                reply = 'Cảm ơn phản hồi tích cực của bạn! Chúng tôi sẽ tiếp tục cải thiện hệ thống để phục vụ tốt hơn.';
                currentAction = '';
            } else if (parseInt(text, 10) <= 3) {
                reply = 'Chúng tôi rất tiếc vì trải nghiệm không tốt của bạn. Ý kiến đóng góp của bạn đã được chuyển đến bộ phận Giám sát dịch vụ.';
                currentAction = '';
            }
        } else if (currentTicketId === 'PS00125') {
            reply = 'Nhân viên kỹ thuật Trần Thanh Sơn đã nhận được tin nhắn của bạn và sẽ trả lời bạn sớm nhất.';
        }

        // Trigger simulated response
        simulateAiResponse(text, reply, 1200);
    };

    if (sendBtn) {
        sendBtn.addEventListener('click', handleUserSendMessage);
    }

    if (chatInput) {
        // Track character limits
        chatInput.addEventListener('input', function() {
            const len = this.value.length;
            if (charCounter) charCounter.textContent = `${len}/500`;
            
            // Auto grow input height to maximum 120px
            this.style.height = 'auto';
            const scHeight = Math.min(this.scrollHeight, 120);
            this.style.height = `${scHeight}px`;
        });

        // Key bindings
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleUserSendMessage();
            }
        });
    }

    // ==========================================================================
    // 8. FILE UPLOAD & TOOLBAR ACTIONS
    // ==========================================================================
    const mockToolbarAction = (btnId, successMsg) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                alert(successMsg);
            });
        }
    };

    mockToolbarAction('chatEmojiBtn', 'Tính năng chọn Emoji đang được kích hoạt.');
    mockToolbarAction('chatUploadFileBtn', 'Đang kết nối cổng tải lên tài liệu đính kèm...');
    mockToolbarAction('chatUploadImageBtn', 'Đang mở thư viện ảnh hoặc Camera...');

});
