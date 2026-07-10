/* -------------------------------------------------------------
 * FILE: assets/js/ticket-chat.js
 * AUTHOR: Antigravity
 * DESCRIPTION: Interactive simulation client for ticket-chat.html
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ==================== 1. STATE & UTILITIES ====================
    let ticket = null;
    let pendingFiles = [];

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const getFileIcon = (name) => {
        const ext = name.split('.').pop().toLowerCase();
        const icons = {
            pdf: 'fa-file-pdf text-danger',
            doc: 'fa-file-word text-primary', docx: 'fa-file-word text-primary',
            xls: 'fa-file-excel text-success', xlsx: 'fa-file-excel text-success',
            png: 'fa-file-image text-warning', jpg: 'fa-file-image text-warning', jpeg: 'fa-file-image text-warning'
        };
        return icons[ext] || 'fa-file text-secondary';
    };

    // ==================== 2. DATABASE RESOLUTION ====================
    const getActiveTicket = () => {
        const urlParams = new URLSearchParams(window.location.search);
        let code = urlParams.get('code') || '';
        code = code.trim().toUpperCase();

        const list = JSON.parse(localStorage.getItem('techsupport_tickets') || '[]');
        const details = JSON.parse(localStorage.getItem('techsupport_tickets_details') || '{}');

        // Fallback to first ticket in system if no code parameter
        if (!code && list.length > 0) {
            code = list[0].code;
        }

        // Complete fallback code if still empty
        if (!code) {
            code = "HT100204";
        }

        // If details exist, load it
        if (details[code]) {
            return details[code];
        }

        // Try to load basic info from main tickets list and construct detail
        const basicTicket = list.find(t => t.code === code);
        if (basicTicket) {
            const customerObj = basicTicket.customer || {
                name: localStorage.getItem('ts_customer_name') || "Nguyễn Văn An",
                phone: localStorage.getItem('ts_customer_phone') || "0909 123 456",
                email: localStorage.getItem('ts_customer_email') || "nguyenvanan@gmail.com",
                address: localStorage.getItem('ts_customer_address') || "123 Nguyễn Văn Linh, Q.7, TP. HCM"
            };

            const createdTime = basicTicket.date.includes(' ') ? basicTicket.date : basicTicket.date + " 08:30";

            details[code] = {
                code: basicTicket.code,
                title: basicTicket.title || "Yêu cầu kỹ thuật cần hỗ trợ",
                category: basicTicket.category || "Mạng Internet",
                service: basicTicket.service || "Khắc phục mất kết nối mạng",
                createdDate: createdTime,
                updatedDate: createdTime,
                status: basicTicket.status || 'pending',
                statusText: basicTicket.statusText || 'Chờ tiếp nhận',
                priority: basicTicket.priority || "Trung bình",
                customerName: customerObj.name,
                customerPhone: customerObj.phone,
                customerEmail: customerObj.email,
                customerAddress: customerObj.address,
                description: basicTicket.desc || `Khách hàng báo hỏng dịch vụ: ${basicTicket.service}. Vui lòng liên hệ hỗ trợ.`,
                agent: basicTicket.status !== 'pending' ? {
                    name: "Trần Văn B",
                    initials: "TVB",
                    phone: "0987 654 321",
                    email: "tranvanb@viettel.com.vn"
                } : null,
                timeline: [
                    {
                        date: createdTime,
                        title: "Tạo phiếu hỗ trợ thành công",
                        desc: "Hệ thống ghi nhận yêu cầu báo hỏng dịch vụ.",
                        type: "info"
                    }
                ],
                chatMessages: [],
                appointments: [],
                attachments: [],
                review: null
            };

            // If it is already marked processing/completed in list, sync timeline and chat logs
            if (basicTicket.status !== 'pending') {
                details[code].timeline.push({
                    date: createdTime,
                    title: "Đã phân công nhân viên xử lý",
                    desc: "Kỹ thuật viên Trần Văn B đã tiếp nhận phiếu hỗ trợ.",
                    type: "success"
                });

                details[code].chatMessages.push({
                    sender: "bot",
                    time: createdTime.split(' ').pop(),
                    text: `Phiếu hỗ trợ của bạn đã được ghi nhận thành công trên hệ thống.<br>Mã phiếu: <strong>${code}</strong>.<br>Nhân viên hỗ trợ sẽ tiếp nhận và phản hồi trong thời gian sớm nhất.`
                });

                details[code].chatMessages.push({
                    sender: "system",
                    text: `Kỹ thuật viên Trần Văn B đã tiếp nhận phiếu hỗ trợ ${code}.`
                });

                details[code].chatMessages.push({
                    sender: "agent",
                    time: createdTime.split(' ').pop(),
                    text: `Chào anh/chị, em là Trần Văn B bên hỗ trợ kỹ thuật Viettel. Em đã tiếp nhận phiếu hỗ trợ mã <strong>${code}</strong> của mình và đang tiến hành kiểm tra thông số đường truyền từ xa.<br>Anh/chị vui lòng miêu tả chi tiết hơn tình trạng lỗi thiết bị đang gặp phải hoặc đính kèm ảnh chụp modem/đèn tín hiệu để em kiểm tra chính xác nhé.`
                });
            }

            localStorage.setItem('techsupport_tickets_details', JSON.stringify(details));
            return details[code];
        }

        // Mock absolute fallback ticket
        const mockTime = "15/06/2026 20:00";
        const fallbackTicket = {
            code: code,
            title: "Tín hiệu mạng Internet chập chờn thường xuyên bị rớt kết nối",
            category: "Mạng Internet",
            service: "Khắc phục mạng chậm chập chờn",
            createdDate: mockTime,
            updatedDate: mockTime,
            status: "pending",
            statusText: "Chờ tiếp nhận",
            priority: "Trung bình",
            customerName: "Nguyễn Văn An",
            customerPhone: "0909 123 456",
            customerEmail: "nguyenvanan@gmail.com",
            customerAddress: "123 Nguyễn Văn Linh, Q.7, TP. HCM",
            description: "Mạng nhà tôi kết nối chập chờn từ chiều hôm qua, cứ truy cập khoảng 10-15 phút là bị ngắt kết nối khoảng 2-3 phút rồi tự động kết nối lại. Vui lòng cho nhân viên qua sửa gấp.",
            agent: null,
            timeline: [
                {
                    date: mockTime,
                    title: "Tạo phiếu hỗ trợ thành công",
                    desc: "Hệ thống ghi nhận yêu cầu hỗ trợ sự cố.",
                    type: "info"
                }
            ],
            chatMessages: [],
            appointments: [],
            attachments: [],
            review: null
        };
        details[code] = fallbackTicket;
        localStorage.setItem('techsupport_tickets_details', JSON.stringify(details));
        return fallbackTicket;
    };

    const saveTicketToDatabase = () => {
        if (!ticket) return;
        const details = JSON.parse(localStorage.getItem('techsupport_tickets_details') || '{}');
        details[ticket.code] = ticket;
        localStorage.setItem('techsupport_tickets_details', JSON.stringify(details));

        // Sync back to main list
        const list = JSON.parse(localStorage.getItem('techsupport_tickets') || '[]');
        const idx = list.findIndex(t => t.code === ticket.code);
        if (idx !== -1) {
            list[idx].status = ticket.status;
            list[idx].statusText = ticket.statusText;
            list[idx].category = ticket.category;
            list[idx].service = ticket.service;
            list[idx].priority = ticket.priority;
            localStorage.setItem('techsupport_tickets', JSON.stringify(list));
        } else {
            list.unshift({
                code: ticket.code,
                category: ticket.category,
                service: ticket.service,
                date: ticket.createdDate.split(' ')[0],
                status: ticket.status,
                statusText: ticket.statusText,
                priority: ticket.priority,
                customer: {
                    name: ticket.customerName,
                    phone: ticket.customerPhone,
                    email: ticket.customerEmail,
                    address: ticket.customerAddress
                }
            });
            localStorage.setItem('techsupport_tickets', JSON.stringify(list));
        }
    };

    // ==================== 3. DOM BINDINGS & RENDERING ====================
    const updateUI = () => {
        if (!ticket) return;

        // Breadcrumbs & Title
        const bCode = document.getElementById('breadcrumbTicketCode');
        const hCode = document.getElementById('headerTicketCode');
        const hStatus = document.getElementById('headerTicketStatus');
        
        if (bCode) bCode.textContent = ticket.code;
        if (hCode) hCode.textContent = ticket.code;
        
        if (hStatus) {
            hStatus.textContent = ticket.statusText;
            hStatus.className = 'badge px-3 py-1 rounded-pill';
            if (ticket.status === 'completed') {
                hStatus.classList.add('bg-success-subtle', 'text-success', 'border', 'border-success-subtle');
            } else if (ticket.status === 'processing') {
                hStatus.classList.add('bg-warning-subtle', 'text-warning', 'border', 'border-warning-subtle');
            } else if (ticket.status === 'cancelled') {
                hStatus.classList.add('bg-secondary-subtle', 'text-secondary', 'border', 'border-secondary-subtle');
            } else {
                hStatus.classList.add('bg-danger-subtle', 'text-danger', 'border', 'border-danger-subtle');
            }
        }

        // Chat Header Agent Section
        const agentAvatar = document.getElementById('chatAgentAvatar');
        const agentName = document.getElementById('chatAgentName');
        const agentDot = document.getElementById('chatAgentStatusDot');
        const agentStatusText = document.getElementById('chatAgentStatusText');

        if (ticket.agent) {
            if (agentAvatar) {
                agentAvatar.textContent = ticket.agent.initials;
                agentAvatar.style.background = 'var(--viettel-gradient)';
            }
            if (agentName) agentName.textContent = ticket.agent.name;
            if (agentDot) agentDot.style.backgroundColor = '#10b981'; // green
            if (agentStatusText) agentStatusText.textContent = 'Đang trực tuyến';
        } else {
            if (agentAvatar) {
                agentAvatar.textContent = '?';
                agentAvatar.style.background = '#9ca3af';
            }
            if (agentName) agentName.textContent = 'Chưa phân công';
            if (agentDot) agentDot.style.backgroundColor = '#9ca3af'; // gray
            if (agentStatusText) agentStatusText.textContent = 'Chờ tiếp nhận yêu cầu';
        }

        // Side detail metadata
        const sTitle = document.getElementById('sideTicketTitle');
        const sCategory = document.getElementById('sideTicketCategory');
        const sService = document.getElementById('sideTicketService');
        const sPriority = document.getElementById('sideTicketPriority');
        const sDate = document.getElementById('sideTicketDate');
        const sDesc = document.getElementById('sideTicketDesc');

        if (sTitle) sTitle.textContent = ticket.title;
        if (sCategory) sCategory.textContent = ticket.category;
        if (sService) sService.textContent = ticket.service;
        
        if (sPriority) {
            sPriority.textContent = ticket.priority;
            sPriority.className = 'fw-bold';
            if (ticket.priority === 'Khẩn cấp' || ticket.priority === 'Cao') {
                sPriority.classList.add('text-danger');
            } else if (ticket.priority === 'Trung bình') {
                sPriority.classList.add('text-warning');
            } else {
                sPriority.classList.add('text-success');
            }
        }
        if (sDate) sDate.textContent = ticket.createdDate;
        if (sDesc) sDesc.textContent = ticket.description;

        // Sidebar Navigation links
        const btnBack = document.getElementById('btnBackToTickets');
        const btnDetail = document.getElementById('btnViewFullDetail');

        if (btnBack) {
            btnBack.href = 'customer-profile.html#my-tickets';
        }
        if (btnDetail) {
            btnDetail.href = `ticket-detail.html?code=${ticket.code}`;
        }
    };

    const renderMessages = () => {
        const chatContainer = document.getElementById('chatConversationMessages');
        if (!chatContainer) return;

        chatContainer.innerHTML = '';
        
        if (ticket.chatMessages.length === 0) {
            chatContainer.innerHTML = `
                <div class="text-center text-muted my-auto py-5 w-100">
                    <i class="fa-solid fa-comments display-5 text-secondary d-block mb-3"></i>
                    <p class="mb-1 fw-bold">Chưa có nội dung trao đổi</p>
                    <p class="small text-secondary m-0">Tin nhắn tự động của hệ thống sẽ xuất hiện tại đây.</p>
                </div>
            `;
            return;
        }

        ticket.chatMessages.forEach(msg => {
            if (msg.sender === 'system') {
                const log = document.createElement('div');
                log.className = 'chat-system-log';
                log.innerHTML = `
                    <div class="chat-system-log-body">
                        <i class="fa-solid fa-circle-info"></i>
                        <span>${msg.text}</span>
                    </div>
                `;
                chatContainer.appendChild(log);
                return;
            }

            const isUser = msg.sender === 'user';
            const isBot = msg.sender === 'bot';
            
            let initial = 'KH';
            if (isBot) initial = 'CS';
            else if (!isUser) initial = ticket.agent ? ticket.agent.initials : 'KTV';

            const sideClass = isUser ? 'user-side' : 'agent-side';
            const row = document.createElement('div');
            row.className = `message-bubble-row ${sideClass}`;

            const avatar = document.createElement('div');
            avatar.className = 'msg-avatar';
            avatar.textContent = initial;
            row.appendChild(avatar);

            const content = document.createElement('div');
            content.className = 'msg-bubble-content';

            const textBox = document.createElement('div');
            textBox.className = 'msg-text-box';
            
            // Text
            const txt = document.createElement('div');
            txt.innerHTML = msg.text;
            textBox.appendChild(txt);

            // File attachment inside bubble if any
            if (msg.file) {
                const isImg = msg.file.type === 'image';
                const fileLink = document.createElement('div');
                
                if (isImg) {
                    fileLink.className = 'chat-bubble-image-wrap';
                    fileLink.innerHTML = `<img src="${msg.file.url}" alt="${msg.file.name}">`;
                    fileLink.addEventListener('click', () => {
                        // Triggers lightbox standard flow or preview
                        Swal.fire({
                            imageUrl: msg.file.url,
                            imageAlt: msg.file.name,
                            title: msg.file.name,
                            confirmButtonText: 'Đóng',
                            confirmButtonColor: '#ee0033'
                        });
                    });
                } else {
                    fileLink.className = 'chat-bubble-file';
                    const icon = getFileIcon(msg.file.name);
                    fileLink.innerHTML = `
                        <i class="fa-solid ${icon}"></i>
                        <div class="chat-file-info">
                            <span class="chat-file-name" title="${msg.file.name}">${msg.file.name}</span>
                            <span class="chat-file-size">${msg.file.size}</span>
                        </div>
                    `;
                    fileLink.addEventListener('click', () => {
                        Swal.fire({
                            icon: 'info',
                            title: 'Tải xuống tài liệu',
                            text: `Bạn muốn tải tệp tin ${msg.file.name} (${msg.file.size})?`,
                            showCancelButton: true,
                            confirmButtonText: 'Tải về',
                            cancelButtonText: 'Hủy',
                            confirmButtonColor: '#ee0033'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                showToast(`Đang tải xuống tệp ${msg.file.name}...`);
                            }
                        });
                    });
                }
                textBox.appendChild(fileLink);
            }

            content.appendChild(textBox);

            const time = document.createElement('span');
            time.className = 'msg-time';
            time.textContent = msg.time;
            content.appendChild(time);

            row.appendChild(content);
            chatContainer.appendChild(row);
        });

        // Scroll to end of list
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    // Helper toast
    const showToast = (msg) => {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: msg,
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true
        });
    };

    // ==================== 4. SIMULATION ORCHESTRATION ====================
    const startSimulation = () => {
        if (!ticket) return;

        // If ticket already has chat history, do not restart simulation
        if (ticket.chatMessages.length > 0) {
            renderMessages();
            return;
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        // Step A: Bot greeting
        ticket.chatMessages.push({
            sender: 'bot',
            time: timeStr,
            text: `Hệ thống tiếp nhận báo hỏng TechSupport đã ghi nhận yêu cầu hỗ trợ thành công.<br>Mã phiếu: <strong>${ticket.code}</strong>.<br>Nhân viên điều phối sẽ chỉ định nhân viên xử lý sớm nhất trong vòng 5 phút.`
        });
        
        saveTicketToDatabase();
        updateUI();
        renderMessages();

        // Step B: Staff assignment simulation after 5 seconds
        setTimeout(() => {
            const assignTime = new Date();
            const assignTimeStr = assignTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const assignDateStr = assignTime.toLocaleDateString('vi-VN') + ' ' + assignTimeStr;

            // Add system log bubble
            ticket.chatMessages.push({
                sender: 'system',
                text: `Kỹ thuật viên Trần Văn B đã tiếp nhận phiếu hỗ trợ ${ticket.code}.`
            });

            // Set agent details
            ticket.agent = {
                name: "Trần Văn B",
                initials: "TVB",
                phone: "0987 654 321",
                email: "tranvanb@viettel.com.vn"
            };
            ticket.status = "processing";
            ticket.statusText = "Đang xử lý";

            // Add initial agent message
            const agentGreeting = `Chào anh/chị, em là Trần Văn B bên tổ hỗ trợ kỹ thuật Viettel. Em đã tiếp nhận phiếu hỗ trợ sự cố <strong>${ticket.category}</strong> (${ticket.service}) của anh/chị.<br>Em đang tiến hành kiểm tra thông số đo kiểm cổng tín hiệu từ xa. Anh/chị vui lòng cho em hỏi hiện tại đèn tín hiệu trên modem mạng nhà mình đang báo đèn xanh hay nháy đỏ vậy ạ?`;
            
            ticket.chatMessages.push({
                sender: 'agent',
                time: assignTimeStr,
                text: agentGreeting
            });

            // Add timeline details
            ticket.timeline.push({
                date: assignDateStr,
                title: "Đã phân công nhân viên xử lý",
                desc: "Phiếu đã được chỉ định cho kỹ thuật viên khu vực Trần Văn B phụ trách ứng cứu sự cố.",
                type: "success"
            });

            saveTicketToDatabase();
            updateUI();
            renderMessages();
            showToast("Kỹ thuật viên đã tiếp nhận phiếu hỗ trợ của bạn!");
        }, 5000);
    };

    // ==================== 5. CHAT INTERACTIONS ====================
    const chatInput = document.getElementById('chatConversationTextarea');
    const chatForm = document.getElementById('chatConversationForm');
    const chatSendBtn = document.getElementById('btnChatSend');
    const chatAttachBtn = document.getElementById('btnChatAttach');
    const chatFileInput = document.getElementById('chatAttachInput');
    const chatPreviewWrap = document.getElementById('chatAttachPreviewContainer');
    const typingIndicator = document.getElementById('chatConversationTyping');

    const updateSubmitButtonState = () => {
        if (!chatSendBtn) return;
        const textHasVal = chatInput && chatInput.value.trim().length > 0;
        const filesHasVal = pendingFiles.length > 0;
        
        if (textHasVal || filesHasVal) {
            chatSendBtn.removeAttribute('disabled');
        } else {
            chatSendBtn.setAttribute('disabled', 'disabled');
        }
    };

    if (chatInput) {
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
            updateSubmitButtonState();
        });
        
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (chatSendBtn && !chatSendBtn.disabled) {
                    chatForm.requestSubmit();
                }
            }
        });
    }

    // Attach File Click Trigger
    if (chatAttachBtn && chatFileInput) {
        chatAttachBtn.addEventListener('click', () => {
            chatFileInput.click();
        });

        chatFileInput.addEventListener('change', () => {
            const files = chatFileInput.files;
            if (files.length === 0) return;

            const file = files[0];
            const ext = file.name.split('.').pop().toLowerCase();
            const allowed = ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'xlsx'];
            
            if (!allowed.includes(ext)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi định dạng tệp',
                    text: 'Hệ thống chỉ hỗ trợ đính kèm ảnh (JPG, PNG) hoặc tài liệu (PDF, DOCX, XLSX).',
                    confirmButtonColor: '#ee0033'
                });
                chatFileInput.value = '';
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                Swal.fire({
                    icon: 'error',
                    title: 'Kích thước tệp quá lớn',
                    text: 'Dung lượng tệp tin đính kèm không vượt quá 5MB.',
                    confirmButtonColor: '#ee0033'
                });
                chatFileInput.value = '';
                return;
            }

            pendingFiles.push(file);
            renderAttachmentPreview();
            updateSubmitButtonState();
            chatFileInput.value = ''; // Reset input to allow re-selection
        });
    }

    const renderAttachmentPreview = () => {
        if (!chatPreviewWrap) return;
        chatPreviewWrap.innerHTML = '';

        if (pendingFiles.length === 0) {
            chatPreviewWrap.style.display = 'none';
            return;
        }

        chatPreviewWrap.style.display = 'flex';
        pendingFiles.forEach((file, index) => {
            const previewCard = document.createElement('div');
            previewCard.className = 'chat-attach-preview-item';

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
                previewCard.appendChild(img);
            } else {
                const icon = document.createElement('i');
                const ext = file.name.split('.').pop().toLowerCase();
                let iconClass = 'fa-solid ';
                if (ext === 'pdf') iconClass += 'fa-file-pdf text-danger';
                else if (ext === 'docx' || ext === 'doc') iconClass += 'fa-file-word text-primary';
                else if (ext === 'xlsx' || ext === 'xls') iconClass += 'fa-file-excel text-success';
                else iconClass += 'fa-file text-muted';
                
                icon.className = iconClass;
                previewCard.appendChild(icon);
            }

            // Remove Button
            const rmBtn = document.createElement('button');
            rmBtn.type = 'button';
            rmBtn.className = 'file-remove-btn';
            rmBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            rmBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                pendingFiles.splice(index, 1);
                renderAttachmentPreview();
                updateSubmitButtonState();
            });

            previewCard.appendChild(rmBtn);
            chatPreviewWrap.appendChild(previewCard);
        });
    };

    // Chat Message Submission Handling
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const messageText = chatInput.value.trim();
            if (!messageText && pendingFiles.length === 0) return;

            const now = new Date();
            const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            const userMsg = {
                sender: 'user',
                time: timeStr,
                text: messageText || 'Đã gửi một tệp đính kèm.'
            };

            // If there's a file, read it (if image) and append to message
            if (pendingFiles.length > 0) {
                const file = pendingFiles[0];
                const fileType = file.type.startsWith('image/') ? 'image' : 'file';

                if (fileType === 'image') {
                    // Create base64 or objectUrl preview
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        userMsg.file = {
                            name: file.name,
                            size: formatFileSize(file.size),
                            type: 'image',
                            url: event.target.result
                        };
                        
                        // Push user message and trigger response in sequence
                        ticket.chatMessages.push(userMsg);
                        saveTicketToDatabase();
                        renderMessages();
                        triggerAgentReply(messageText, true);
                    };
                    reader.readAsDataURL(file);
                } else {
                    userMsg.file = {
                        name: file.name,
                        size: formatFileSize(file.size),
                        type: 'file',
                        url: '#'
                    };
                    
                    ticket.chatMessages.push(userMsg);
                    saveTicketToDatabase();
                    renderMessages();
                    triggerAgentReply(messageText, false);
                }
            } else {
                ticket.chatMessages.push(userMsg);
                saveTicketToDatabase();
                renderMessages();
                triggerAgentReply(messageText, false);
            }

            // Clear input & previews
            chatInput.value = '';
            chatInput.style.height = 'auto';
            pendingFiles = [];
            renderAttachmentPreview();
            updateSubmitButtonState();
        });
    }

    // Contextual Canned Replies simulation
    const triggerAgentReply = (userText, hasFile) => {
        if (!ticket.agent) return; // Cannot reply if agent not assigned

        const query = userText.toLowerCase().trim();
        let agentText = '';

        if (hasFile) {
            agentText = "Dạ, em đã nhận được hình ảnh/tài liệu của anh/chị gửi qua rồi ạ. Em đang đối chiếu thông số tín hiệu của modem trên hệ thống. Anh/chị đợi em khoảng 1 phút em đo kiểm cổng suy hao nhé.";
        } else if (query.includes('chậm') || query.includes('lag') || query.includes('yếu') || query.includes('chập chờn')) {
            agentText = "Dạ anh/chị, em kiểm tra thấy băng thông cổng mạng nhà mình đang có lượng suy hao quang ở mức hơi cao (-26.5 dBm), điều này gây ra hiện tượng rớt mạng chập chờn khi truy cập dung lượng lớn. Em đang gửi lệnh tối ưu lại cấu hình cổng mạng quang của thiết bị từ xa. Anh/chị theo dõi modem xem có khởi động lại không nhé.";
        } else if (query.includes('đỏ') || query.includes('mất mạng') || query.includes('los') || query.includes('không vào được')) {
            agentText = "Dạ, nếu modem báo đỏ đèn LOS có nghĩa là đường cáp quang nối từ tủ chia tín hiệu ngoài cột điện vào modem nhà mình bị mất tín hiệu vật lý hoàn toàn (có thể do đứt hoặc gãy gập dây quang). Em sẽ lập phiếu kỹ thuật hiện trường và điều phối nhân viên kỹ thuật qua trực tiếp nhà kiểm tra, hàn nối lại dây cho mình ngay trong buổi hôm nay nhé ạ.";
        } else if (query.includes('cảm ơn') || query.includes('ok') || query.includes('thanks') || query.includes('cám ơn')) {
            agentText = "Dạ vâng ạ, hỗ trợ khách hàng là niềm vui của tụi em. Nếu anh/chị cần hỗ trợ thêm thông tin gì khác cứ nhắn trực tiếp tại đây nha. Chúc anh/chị một ngày vui vẻ ạ!";
        } else {
            agentText = "Dạ em đã ghi nhận phản hồi này của anh/chị. Em đang liên hệ phòng vận hành kỹ thuật khu vực để phối hợp xử lý dứt điểm sự cố này cho mình. Em sẽ liên hệ cập nhật tình hình xử lý cho mình sau ít phút nữa ạ.";
        }

        // Delay typing indicator showing
        setTimeout(() => {
            if (typingIndicator) typingIndicator.classList.remove('d-none');
            const chatContainer = document.getElementById('chatConversationMessages');
            if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;

            // Delay actual message sending
            setTimeout(() => {
                if (typingIndicator) typingIndicator.classList.add('d-none');
                
                const now = new Date();
                const replyTimeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                ticket.chatMessages.push({
                    sender: 'agent',
                    time: replyTimeStr,
                    text: agentText
                });

                saveTicketToDatabase();
                renderMessages();
            }, 2500);

        }, 1200);
    };

    // ==================== 6. INITIALIZATION ====================
    ticket = getActiveTicket();
    updateUI();
    startSimulation();
});
