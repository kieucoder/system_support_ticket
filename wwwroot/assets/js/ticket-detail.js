/* --------------------------------------------------------------------------
   FILE: assets/js/ticket-detail.js
   AUTHOR: Antigravity
   DESCRIPTION: Interactive frontend logic for TechSupport Ticket Detail page
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ==================== 1. TOAST NOTIFICATION UTILITY ====================
    const showToast = (message, type = 'success') => {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        
        let iconClass = 'bi-check-circle-fill';
        if (type === 'warning') iconClass = 'bi-exclamation-triangle-fill';
        if (type === 'danger') iconClass = 'bi-x-circle-fill';

        toast.innerHTML = `
            <i class="custom-toast-icon bi ${iconClass}"></i>
            <span class="custom-toast-text">${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Trigger reflow to enable CSS transition
        toast.offsetHeight;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, 3000);
    };

    // ==================== 2. DATA LAYER & SCHEMA INITIALIZATION ====================
    
    // Detailed Mock Datasets for Ticket PT000123 and general tickets
    const DEFAULT_DETAIL_TICKET = {
        code: "PT000123",
        title: "Internet cáp quang mất kết nối hoàn toàn",
        category: "Viễn thông",
        service: "Internet Cáp Quang",
        createdDate: "10/06/2026 08:30",
        updatedDate: "11/06/2026 09:45",
        status: "processing", // pending, processing, completed, cancelled
        statusText: "Đang xử lý",
        priority: "Cao",
        customerName: "Nguyễn Văn An",
        customerPhone: "0909 123 456",
        customerEmail: "nguyenvanan@gmail.com",
        customerAddress: "123 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh",
        description: "Khách hàng phản ánh modem báo đèn LOS đỏ nhấp nháy liên tục, không truy cập được mạng internet từ 8h sáng ngày 10/06. Đã thử ngắt nguồn khởi động lại thiết bị modem và gắm lại cáp nhưng tín hiệu quang vẫn không hồi phục.",
        agent: {
            name: "Nguyễn Văn B",
            initials: "NVB",
            phone: "0909 888 777",
            email: "support@techsupport.vn"
        },
        timeline: [
            {
                date: "10/06/2026 08:30",
                title: "Tạo phiếu hỗ trợ thành công",
                desc: "Hệ thống ghi nhận yêu cầu báo hỏng từ tài khoản Khách hàng Nguyễn Văn An.",
                type: "info"
            },
            {
                date: "10/06/2026 09:00",
                title: "Đã phân công nhân viên xử lý",
                desc: "Phiếu đã được chỉ định cho kỹ thuật viên khu vực Nguyễn Văn B phụ trách ứng cứu sự cố.",
                type: "success"
            },
            {
                date: "10/06/2026 10:15",
                title: "Kỹ thuật viên liên hệ khách hàng",
                desc: "Kỹ thuật viên liên hệ chẩn đoán từ xa qua điện thoại. Xác định lỗi suy hao cổng quang (LOS đỏ). Đặt lịch kiểm tra cáp vật lý.",
                type: "warning"
            },
            {
                date: "10/06/2026 14:00",
                title: "Đặt lịch hẹn tại nhà thành công",
                desc: "Lịch hẹn xử lý tại địa chỉ khách hàng được lên lịch vào ngày 12/06/2026 lúc 14:00.",
                type: "info"
            },
            {
                date: "11/06/2026 09:45",
                title: "Chuẩn bị vật tư thiết bị",
                desc: "Kỹ thuật viên chuẩn bị cáp thuê bao dự phòng và thiết bị đầu cuối ONT để thay thế.",
                type: "processing"
            }
        ],
        chatMessages: [
            {
                sender: "agent",
                time: "10/06/2026 09:05",
                text: "Xin chào anh An, em là B bên hỗ trợ kỹ thuật Viettel. Em đã nhận được yêu cầu xử lý sự cố mạng của anh và đang tiến hành đo kiểm đường truyền từ xa."
            },
            {
                sender: "user",
                time: "10/06/2026 09:12",
                text: "Chào bạn, mạng nhà mình bị mất từ sáng. Đèn LOS trên modem nháy đỏ liên tục, mình đã tắt nguồn bật lại nhưng vẫn không được. Mình cần mạng gấp để làm việc, mong các bạn hỗ trợ khắc phục nhanh giúp."
            },
            {
                sender: "agent",
                time: "10/06/2026 10:20",
                text: "Dạ anh, đèn LOS nháy đỏ báo hiệu suy hao tín hiệu quang lớn hoặc đứt cáp thuê bao từ tủ phân phối vào nhà mình. Em vừa kiểm tra trên hệ thống quản lý cổng quang thì thấy cổng mạng của nhà mình bị mất tín hiệu vật lý hoàn toàn. Em sẽ qua tận nơi đo thông quang và hàn nối lại cáp quang thuê bao ngoài trời cho mình nhé."
            },
            {
                sender: "user",
                time: "10/06/2026 10:25",
                text: "Ok em, khi nào qua nhà thì gọi trước cho anh nhé. Có lịch cụ thể chưa em?"
            },
            {
                sender: "agent",
                time: "10/06/2026 14:00",
                text: "Dạ em đã tạo lịch hẹn qua nhà xử lý cho anh vào chiều ngày mai (12/06) từ 14h00 đến 16h00 anh nhé. Trước khi xuất phát em sẽ gọi báo trước anh 15 phút ạ."
            }
        ],
        appointments: [
            {
                id: "LH-000921",
                title: "Kiểm tra vật lý đường cáp và hàn nối quang",
                desc: "Kỹ thuật viên qua trực tiếp địa chỉ khách hàng hàn lại cáp suy hao ngoài cột điện, thay thế modem quang nếu thiết bị lỗi.",
                date: "12/06/2026",
                time: "14:00 - 16:00",
                status: "confirmed",
                statusText: "Đã xác nhận",
                staffName: "Nguyễn Văn B",
                staffCode: "NV-1234",
                staffPhone: "0909 888 777"
            }
        ],
        attachments: [
            {
                name: "modem.jpg",
                size: "1.2 MB",
                date: "10/06/2026 08:32",
                type: "image",
                url: "../assets/images/modem-error.jpg"
            },
            {
                name: "loi-mang.png",
                size: "850 KB",
                date: "10/06/2026 08:32",
                type: "image",
                url: "../assets/images/loi-mang.png"
            },
            {
                name: "bienban.pdf",
                size: "2.4 MB",
                date: "10/06/2026 14:05",
                type: "pdf",
                url: "../assets/docs/bienban.pdf"
            }
        ],
        review: null
    };

    // Initialize databases in localStorage
    const getTicketsFromDatabase = () => {
        let list = JSON.parse(localStorage.getItem('techsupport_tickets') || '[]');
        
        // Find if PT000123 exists
        let details = JSON.parse(localStorage.getItem('techsupport_tickets_details') || '{}');
        
        if (!details["PT000123"]) {
            details["PT000123"] = DEFAULT_DETAIL_TICKET;
            localStorage.setItem('techsupport_tickets_details', JSON.stringify(details));
        }
        
        // Also ensure PT000123 is in the main list of tickets for listing view
        const existsInMainList = list.some(t => t.code === "PT000123");
        if (!existsInMainList) {
            list.push({
                code: "PT000123",
                category: "Mất kết nối",
                service: "Internet Cáp Quang",
                date: "10/06/2026",
                status: "processing",
                statusText: "Đang xử lý",
                priority: "Cao"
            });
            localStorage.setItem('techsupport_tickets', JSON.stringify(list));
        }

        return { list, details };
    };

    // Load active ticket based on query parameters or fallback
    const loadActiveTicket = () => {
        const { list, details } = getTicketsFromDatabase();
        
        // Parse URL query parameter ?code=PTXXX
        const urlParams = new URLSearchParams(window.location.search);
        let code = urlParams.get('code') || "PT000123";
        
        // Clean ticket code (force upper case, etc.)
        code = code.trim().toUpperCase();

        // If details doesn't exist for a ticket in the main list (e.g. PT001 to PT012 clicked from customer-profile)
        // dynamically generate details on the fly to support consistent rich rendering
        if (!details[code]) {
            const mainTicketObj = list.find(t => t.code === code);
            if (mainTicketObj) {
                // Generate a matching detail object dynamically based on status/priority/category
                const statusMap = {
                    'pending': { text: 'Chờ tiếp nhận', color: 'danger' },
                    'processing': { text: 'Đang xử lý', color: 'warning' },
                    'completed': { text: 'Đã hoàn thành', color: 'success' },
                    'cancelled': { text: 'Đã hủy', color: 'muted' }
                };

                const mappedStatus = statusMap[mainTicketObj.status] || { text: mainTicketObj.statusText, color: 'warning' };

                details[code] = {
                    code: mainTicketObj.code,
                    title: mainTicketObj.category || "Yêu cầu kỹ thuật cần hỗ trợ",
                    category: "Hỗ trợ viễn thông",
                    service: mainTicketObj.service || "Dịch vụ mạng Viettel",
                    createdDate: mainTicketObj.date + " 08:00",
                    updatedDate: mainTicketObj.date + " 10:30",
                    status: mainTicketObj.status,
                    statusText: mappedStatus.text,
                    priority: mainTicketObj.priority || "Trung bình",
                    customerName: "Nguyễn Văn An",
                    customerPhone: "0909 123 456",
                    customerEmail: "nguyenvanan@gmail.com",
                    customerAddress: "123 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh",
                    description: `Khách hàng yêu cầu hỗ trợ về dịch vụ: ${mainTicketObj.service}. Tình trạng lỗi: ${mainTicketObj.category}. Mong kỹ thuật hỗ trợ khắc phục nhanh chóng.`,
                    agent: mainTicketObj.status !== 'pending' ? {
                        name: "Nguyễn Văn B",
                        initials: "NVB",
                        phone: "0909 888 777",
                        email: "support@techsupport.vn"
                    } : null,
                    timeline: [
                        {
                            date: mainTicketObj.date + " 08:00",
                            title: "Tạo phiếu hỗ trợ thành công",
                            desc: "Hệ thống tiếp nhận yêu cầu hỗ trợ tự động.",
                            type: "info"
                        }
                    ],
                    chatMessages: [],
                    appointments: [],
                    attachments: [],
                    review: null
                };

                // Add timeline steps based on status
                if (mainTicketObj.status !== 'pending') {
                    details[code].timeline.push({
                        date: mainTicketObj.date + " 09:00",
                        title: "Đã phân công nhân viên",
                        desc: "Kỹ thuật viên Nguyễn Văn B tiếp nhận phiếu.",
                        type: "success"
                    });
                    
                    details[code].chatMessages.push({
                        sender: "agent",
                        time: mainTicketObj.date + " 09:05",
                        text: `Kỹ thuật viên Viettel xin chào anh An. Em đang chuẩn bị thiết bị để kiểm tra xử lý dịch vụ ${mainTicketObj.service} cho anh.`
                    });
                }

                if (mainTicketObj.status === 'completed') {
                    details[code].timeline.push({
                        date: mainTicketObj.date + " 10:30",
                        title: "Đã khắc phục sự cố hoàn tất",
                        desc: "Kỹ thuật viên đo kiểm thông số cáp đạt chuẩn, bàn giao biên bản dịch vụ.",
                        type: "success"
                    });
                    details[code].chatMessages.push({
                        sender: "agent",
                        time: mainTicketObj.date + " 10:25",
                        text: "Sự cố đã được khắc phục xong rồi ạ. Anh An kiểm tra lại kết nối xem ổn định chưa nhé."
                    });
                    details[code].chatMessages.push({
                        sender: "user",
                        time: mainTicketObj.date + " 10:28",
                        text: "Mạng ổn định rồi bạn nhé. Cảm ơn bạn rất nhiều!"
                    });
                    
                    details[code].appointments.push({
                        id: "LH-000412",
                        title: `Khắc phục lỗi ${mainTicketObj.category}`,
                        desc: `Kỹ thuật viên qua đo đạc và bàn giao dịch vụ hoạt động bình thường.`,
                        date: mainTicketObj.date,
                        time: "09:00 - 11:30",
                        status: "completed",
                        statusText: "Đã hoàn thành",
                        staffName: "Nguyễn Văn B",
                        staffCode: "NV-1234",
                        staffPhone: "0909 888 777"
                    });
                }

                localStorage.setItem('techsupport_tickets_details', JSON.stringify(details));
            } else {
                // If the code is not found anywhere, default to PT000123
                code = "PT000123";
            }
        }

        return details[code];
    };

    // Retrieve active ticket object
    let ticket = loadActiveTicket();

    // ==================== 3. DYNAMIC RENDERING LAYER ====================
    
    const renderTicketDetails = () => {
        if (!ticket) return;

        // Set Breadcrumb code
        const breadcrumbTicketCode = document.getElementById('breadcrumbTicketCode');
        if (breadcrumbTicketCode) breadcrumbTicketCode.textContent = ticket.code;

        // Set Hero Details
        const heroTicketCode = document.getElementById('heroTicketCode');
        const heroTicketStatus = document.getElementById('heroTicketStatus');
        const heroTicketPriority = document.getElementById('heroTicketPriority');
        const heroTicketTitle = document.getElementById('heroTicketTitle');
        const heroCreatedDate = document.getElementById('heroCreatedDate');
        const heroUpdatedDate = document.getElementById('heroUpdatedDate');

        if (heroTicketCode) heroTicketCode.textContent = ticket.code;
        if (heroTicketTitle) heroTicketTitle.textContent = ticket.title;
        if (heroCreatedDate) heroCreatedDate.textContent = ticket.createdDate;
        if (heroUpdatedDate) heroUpdatedDate.textContent = ticket.updatedDate;

        // Status Badge formatting
        if (heroTicketStatus) {
            let dotColor = 'warning';
            let bgClass = '';
            if (ticket.status === 'completed') {
                dotColor = 'success';
                bgClass = 'bg-success-subtle text-success border-success-subtle';
            } else if (ticket.status === 'cancelled') {
                dotColor = 'danger';
                bgClass = 'bg-danger-subtle text-danger border-danger-subtle';
            } else if (ticket.status === 'pending') {
                dotColor = 'danger';
                bgClass = 'bg-danger-subtle text-danger border-danger-subtle';
            }
            
            heroTicketStatus.className = `badge-status-pill ${bgClass}`;
            heroTicketStatus.innerHTML = `<span class="status-dot ${dotColor}"></span> ${ticket.statusText}`;
        }

        // Priority Badge formatting
        if (heroTicketPriority) {
            let priorityClass = 'text-danger border-danger bg-danger-subtle';
            if (ticket.priority === 'Trung bình') priorityClass = 'text-warning border-warning bg-warning-subtle';
            if (ticket.priority === 'Thấp') priorityClass = 'text-success border-success bg-success-subtle';
            
            heroTicketPriority.className = `badge-priority-pill ${priorityClass}`;
            heroTicketPriority.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-1"></i> Ưu tiên: ${ticket.priority}`;
        }

        // Stats summary counts
        const statsStatusText = document.getElementById('statsStatusText');
        const statsPriorityText = document.getElementById('statsPriorityText');
        const statsAppointmentsCount = document.getElementById('statsAppointmentsCount');
        const statsMessagesCount = document.getElementById('statsMessagesCount');

        if (statsStatusText) statsStatusText.textContent = ticket.statusText;
        if (statsPriorityText) {
            statsPriorityText.textContent = ticket.priority;
            statsPriorityText.className = `summary-value ${ticket.priority === 'Cao' ? 'text-danger' : (ticket.priority === 'Trung bình' ? 'text-warning' : 'text-success')}`;
        }
        if (statsAppointmentsCount) {
            statsAppointmentsCount.setAttribute('data-target', ticket.appointments ? ticket.appointments.length : 0);
        }
        if (statsMessagesCount) {
            statsMessagesCount.setAttribute('data-target', ticket.chatMessages ? ticket.chatMessages.length : 0);
        }

        // Sidebar card 1: Ticket Info
        const sideTicketCode = document.getElementById('sideTicketCode');
        const sideTicketService = document.getElementById('sideTicketService');
        const sideTicketCategory = document.getElementById('sideTicketCategory');
        const sideTicketPriority = document.getElementById('sideTicketPriority');
        const sideTicketStatus = document.getElementById('sideTicketStatus');

        if (sideTicketCode) sideTicketCode.textContent = ticket.code;
        if (sideTicketService) sideTicketService.textContent = ticket.service;
        if (sideTicketCategory) sideTicketCategory.textContent = ticket.category;
        if (sideTicketPriority) {
            sideTicketPriority.textContent = ticket.priority;
            sideTicketPriority.className = `meta-value ${ticket.priority === 'Cao' ? 'text-danger' : (ticket.priority === 'Trung bình' ? 'text-warning' : 'text-success')} fw-bold`;
        }
        if (sideTicketStatus) {
            sideTicketStatus.textContent = ticket.statusText;
            let badgeClass = 'badge-processing';
            if (ticket.status === 'completed') badgeClass = 'bg-success text-white border-0';
            if (ticket.status === 'pending') badgeClass = 'bg-danger text-white border-0';
            if (ticket.status === 'cancelled') badgeClass = 'bg-secondary text-white border-0';
            sideTicketStatus.className = `badge ${badgeClass} py-1 px-3`;
        }

        // Sidebar card 2: Agent profile
        const agentName = document.getElementById('agentName');
        const agentInitials = document.getElementById('agentInitials');
        const agentPhone = document.getElementById('agentPhone');
        const agentEmail = document.getElementById('agentEmail');
        const btnCallAgent = document.getElementById('btnCallAgent');

        if (ticket.agent) {
            if (agentName) agentName.textContent = ticket.agent.name;
            if (agentInitials) agentInitials.textContent = ticket.agent.initials || "KTV";
            if (agentPhone) {
                agentPhone.textContent = ticket.agent.phone;
                agentPhone.href = `tel:${ticket.agent.phone.replace(/\s+/g, '')}`;
            }
            if (btnCallAgent) {
                btnCallAgent.href = `tel:${ticket.agent.phone.replace(/\s+/g, '')}`;
            }
            if (agentEmail) {
                agentEmail.textContent = ticket.agent.email;
                agentEmail.href = `mailto:${ticket.agent.email}`;
            }
        } else {
            // No agent assigned yet (e.g. pending status)
            if (agentName) agentName.textContent = "Chờ phân công";
            if (agentInitials) agentInitials.textContent = "--";
            if (agentPhone) {
                agentPhone.textContent = "Chưa có";
                agentPhone.removeAttribute('href');
            }
            if (btnCallAgent) {
                btnCallAgent.classList.add('disabled');
            }
            if (agentEmail) {
                agentEmail.textContent = "Chưa có";
                agentEmail.removeAttribute('href');
            }
        }

        // Overview Panel: Customer values
        const viewCustomerName = document.getElementById('viewCustomerName');
        const viewCustomerPhone = document.getElementById('viewCustomerPhone');
        const viewCustomerEmail = document.getElementById('viewCustomerEmail');
        const viewCustomerService = document.getElementById('viewCustomerService');
        const viewCustomerAddress = document.getElementById('viewCustomerAddress');
        const viewTicketTitle = document.getElementById('viewTicketTitle');
        const viewTicketDesc = document.getElementById('viewTicketDesc');

        if (viewCustomerName) viewCustomerName.textContent = ticket.customerName || "Nguyễn Văn An";
        if (viewCustomerPhone) viewCustomerPhone.textContent = ticket.customerPhone || "0909123456";
        if (viewCustomerEmail) viewCustomerEmail.textContent = ticket.customerEmail || "nguyenvanan@gmail.com";
        if (viewCustomerService) viewCustomerService.textContent = ticket.service;
        if (viewCustomerAddress) viewCustomerAddress.textContent = ticket.customerAddress || "Địa chỉ lắp đặt";
        if (viewTicketTitle) viewTicketTitle.textContent = ticket.title;
        if (viewTicketDesc) viewTicketDesc.textContent = ticket.description;

        // Render attachments gallery in Overview
        renderAttachmentsGallery();

        // Render timeline
        renderTimelineFlow();

        // Render chat log
        renderChatMessages();

        // Render appointments
        renderAppointmentsGrid();

        // Render attachments list table
        renderAttachmentsTable();

        // Render service review panel
        renderReviewPanel();
    };

    // RENDER: Attachments Gallery (Overview tab)
    const renderAttachmentsGallery = () => {
        const gallery = document.getElementById('overviewAttachmentsGallery');
        if (!gallery) return;

        if (!ticket.attachments || ticket.attachments.length === 0) {
            gallery.innerHTML = `
                <div class="col-12 text-center text-muted py-3">
                    <i class="bi bi-folder-x display-6 d-block mb-2 text-secondary"></i>
                    <span>Chưa đính kèm tài liệu nào</span>
                </div>
            `;
            return;
        }

        gallery.innerHTML = ticket.attachments.map(file => {
            const isImage = file.type === 'image';
            if (isImage) {
                return `
                    <div class="gallery-card image-card" data-file-url="${file.url}" data-file-name="${file.name}">
                        <div class="thumbnail-wrapper">
                            <i class="bi bi-file-earmark-image image-icon-placeholder"></i>
                            <div class="thumbnail-overlay">
                                <i class="bi bi-zoom-in"></i>
                            </div>
                        </div>
                        <span class="gallery-file-name" title="${file.name}">📷 ${file.name}</span>
                    </div>
                `;
            } else {
                return `
                    <div class="gallery-card pdf-card" data-file-url="${file.url}" data-file-name="${file.name}">
                        <div class="thumbnail-wrapper pdf-bg">
                            <i class="bi bi-file-earmark-pdf-fill pdf-icon"></i>
                        </div>
                        <span class="gallery-file-name" title="${file.name}">📄 ${file.name}</span>
                        <button class="btn btn-sm btn-outline-danger btn-gallery-download" data-file-name="${file.name}">
                            Tải xuống <i class="bi bi-download"></i>
                        </button>
                    </div>
                `;
            }
        }).join('');
    };

    // RENDER: Vertical Timeline List
    const renderTimelineFlow = () => {
        const flow = document.getElementById('verticalTimelineFlow');
        if (!flow) return;

        if (!ticket.timeline || ticket.timeline.length === 0) {
            flow.innerHTML = `
                <div class="text-center text-muted py-4">
                    <span>Không có tiến trình nào được ghi lại</span>
                </div>
            `;
            return;
        }

        flow.innerHTML = ticket.timeline.map(step => {
            return `
                <div class="timeline-step-item">
                    <div class="timeline-dot ${step.type}">
                        <i class="bi ${step.type === 'success' ? 'bi-check-lg' : (step.type === 'warning' ? 'bi-exclamation-triangle' : (step.type === 'danger' ? 'bi-x-lg' : 'bi-info-lg'))}"></i>
                    </div>
                    <div class="timeline-step-content">
                        <div class="timeline-header-flex">
                            <h4 class="timeline-action-title">${step.title}</h4>
                            <span class="timeline-time-badge"><i class="bi bi-clock me-1"></i>${step.date}</span>
                        </div>
                        <p class="timeline-detail-desc">${step.desc}</p>
                        <span class="timeline-operator-tag"><i class="bi bi-person-badge-fill me-1"></i>Hệ thống/Kỹ thuật viên</span>
                    </div>
                </div>
            `;
        }).join('');
    };

    // RENDER: Chat Messages Log
    const renderChatMessages = () => {
        const chatContainer = document.getElementById('chatMessagesContainer');
        if (!chatContainer) return;

        const chatAgentAvatar = document.getElementById('chatAgentAvatar');
        const chatAgentName = document.getElementById('chatAgentName');

        if (ticket.agent) {
            if (chatAgentAvatar) chatAgentAvatar.textContent = ticket.agent.initials;
            if (chatAgentName) chatAgentName.textContent = ticket.agent.name;
        } else {
            if (chatAgentAvatar) chatAgentAvatar.textContent = "TS";
            if (chatAgentName) chatAgentName.textContent = "TechSupport";
        }

        if (!ticket.chatMessages || ticket.chatMessages.length === 0) {
            chatContainer.innerHTML = `
                <div class="text-center text-muted my-auto py-5">
                    <i class="bi bi-chat-quote display-5 text-secondary d-block mb-3"></i>
                    <p class="mb-1 fw-bold">Chưa có tin nhắn nào</p>
                    <p class="small text-secondary m-0">Hãy bắt đầu trao đổi với kỹ thuật viên bằng cách nhập tin nhắn dưới đây.</p>
                </div>
            `;
            return;
        }

        chatContainer.innerHTML = ticket.chatMessages.map(msg => {
            const isUser = msg.sender === 'user';
            const initial = isUser ? "KH" : (ticket.agent ? ticket.agent.initials : "TS");
            const sideClass = isUser ? "user-side" : "agent-side";

            // If message is a file attachment inside the chat log
            if (msg.file) {
                const isImg = msg.file.type === 'image';
                return `
                    <div class="message-bubble-row ${sideClass}">
                        <div class="msg-avatar">${initial}</div>
                        <div class="msg-bubble-content">
                            <div class="msg-text-box">
                                <div>${msg.text || ''}</div>
                                <div class="chat-bubble-file" data-file-url="${msg.file.url || ''}" data-file-name="${msg.file.name}">
                                    <i class="bi ${isImg ? 'bi-file-earmark-image text-primary' : 'bi-file-earmark-pdf text-danger'}"></i>
                                    <div class="chat-file-info">
                                        <span class="chat-file-name" title="${msg.file.name}">${msg.file.name}</span>
                                        <span class="chat-file-size">${msg.file.size}</span>
                                    </div>
                                </div>
                            </div>
                            <span class="msg-time">${msg.time}</span>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="message-bubble-row ${sideClass}">
                    <div class="msg-avatar">${initial}</div>
                    <div class="msg-bubble-content">
                        <div class="msg-text-box">
                            <span>${msg.text}</span>
                        </div>
                        <span class="msg-time">${msg.time}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Sync scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    // RENDER: Appointments List
    const renderAppointmentsGrid = () => {
        const grid = document.getElementById('appointmentsGridList');
        if (!grid) return;

        if (!ticket.appointments || ticket.appointments.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center text-muted py-5">
                    <i class="bi bi-calendar2-x display-5 text-secondary d-block mb-3"></i>
                    <p class="fw-bold m-0">Không có lịch hẹn hỗ trợ tại nhà</p>
                    <p class="small text-secondary">Khi kỹ thuật cần qua nhà khảo sát vật lý, lịch hẹn sẽ xuất hiện tại đây.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = ticket.appointments.map(app => {
            const isCompleted = app.status === 'completed';
            const badgeClass = isCompleted ? 'success' : 'warning';
            const staffInitials = app.staffName.split(' ').map(n => n[0]).join('');

            return `
                <div class="appointment-card">
                    <div class="appointment-card-header">
                        <span class="appointment-code">${app.id}</span>
                        <span class="appointment-badge ${badgeClass}">${app.statusText}</span>
                    </div>
                    <div class="appointment-card-body">
                        <h4 class="appointment-title">${app.title}</h4>
                        <p class="appointment-desc">${app.desc}</p>
                    </div>
                    
                    <div class="appointment-time-info">
                        <div class="time-row">
                            <i class="bi bi-calendar-check-fill"></i>
                            <span>Ngày hẹn: <strong>${app.date}</strong></span>
                        </div>
                        <div class="time-row">
                            <i class="bi bi-clock-fill"></i>
                            <span>Thời gian: <strong>${app.time}</strong></span>
                        </div>
                    </div>

                    <div class="appointment-staff-box border-top pt-3 mt-1">
                        <div class="staff-avatar">${staffInitials}</div>
                        <div class="staff-info">
                            <span class="staff-name">${app.staffName}</span>
                            <span class="staff-role">Mã số: ${app.staffCode} | ĐT: <a href="tel:${app.staffPhone.replace(/\s+/g, '')}">${app.staffPhone}</a></span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    // RENDER: Extended Attachments Table
    const renderAttachmentsTable = () => {
        const tbody = document.getElementById('attachmentsTableBody');
        if (!tbody) return;

        if (!ticket.attachments || ticket.attachments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-5">
                        <i class="bi bi-cloud-slash display-6 d-block mb-2 text-secondary"></i>
                        <span>Chưa có tệp tin đính kèm nào được tải lên.</span>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = ticket.attachments.map(file => {
            const isImg = file.type === 'image';
            const iconClass = isImg ? 'bi-file-earmark-image text-primary' : 'bi-file-earmark-pdf text-danger';

            return `
                <tr class="attachment-row" data-file-url="${file.url}" data-file-name="${file.name}" data-file-type="${file.type}">
                    <td>
                        <i class="file-type-icon bi ${iconClass}"></i>
                    </td>
                    <td>
                        <span class="table-file-name cursor-pointer">${file.name}</span>
                    </td>
                    <td>${file.size}</td>
                    <td>${file.date}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary btn-table-action btn-view-file">
                            <i class="bi bi-eye"></i> Xem
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-table-action btn-download-file">
                            <i class="bi bi-download"></i> Tải về
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    };

    // RENDER: Service Review Form or Completed Panel
    const renderReviewPanel = () => {
        const reviewContainer = document.getElementById('tabPanelReview');
        if (!reviewContainer) return;

        // Check if ticket is completed
        if (ticket.status !== 'completed') {
            // Render notice that ticket must be resolved first
            reviewContainer.innerHTML = `
                <div class="review-details-card">
                    <div class="review-success-state-box text-center py-5">
                        <i class="bi bi-patch-exclamation-fill text-warning display-4 mb-3 d-block"></i>
                        <h4 class="fw-bold text-dark">Phiếu chưa hoàn thành</h4>
                        <p class="text-muted max-width-500 mx-auto">Chức năng đánh giá dịch vụ chỉ khả dụng sau khi sự cố kỹ thuật của bạn đã được nhân viên khắc phục thành công và xác nhận hoàn tất.</p>
                        <span class="badge badge-processing py-2 px-4 mt-2">Trạng thái hiện tại: ${ticket.statusText}</span>
                    </div>
                </div>
            `;
            return;
        }

        // Check if already reviewed
        if (ticket.review) {
            const totalStarsAverage = ((ticket.review.quality + ticket.review.attitude + ticket.review.speed) / 3).toFixed(1);
            reviewContainer.innerHTML = `
                <div class="review-details-card">
                    <div class="review-success-state-box text-center py-5">
                        <i class="bi bi-check-circle-fill review-success-icon"></i>
                        <h3 class="fw-bold text-dark mb-2">Cảm ơn bạn đã gửi đánh giá!</h3>
                        <p class="text-muted max-width-500 mx-auto mb-4">Chúng tôi đã tiếp nhận ý kiến phản hồi đóng góp của bạn để cải tiến chất lượng kỹ thuật và dịch vụ phục vụ.</p>
                        
                        <div class="rating-summary-results-box d-inline-flex flex-column gap-3 bg-light p-4 rounded-4 border text-start">
                            <div class="d-flex align-items-center justify-content-between gap-5 border-bottom pb-2">
                                <span class="fw-bold text-dark">Đánh giá chung:</span>
                                <span class="badge bg-warning text-dark fw-bold px-3 py-2"><i class="bi bi-star-fill me-1"></i> ${totalStarsAverage} / 5.0</span>
                            </div>
                            <div class="small d-flex flex-column gap-2 text-secondary">
                                <div>• Chất lượng khắc phục: <strong>${ticket.review.quality} sao</strong></div>
                                <div>• Thái độ phục vụ: <strong>${ticket.review.attitude} sao</strong></div>
                                <div>• Tốc độ tiếp nhận: <strong>${ticket.review.speed} sao</strong></div>
                            </div>
                            <div class="mt-2 border-top pt-3 small text-dark italic">
                                <span class="fw-bold">Nội dung đóng góp: </span>
                                <span>"${ticket.review.comments || 'Không có bình luận đóng góp.'}"</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
    };

    // ==================== 4. COUNTER VALUE ANIMATION SYSTEM ====================
    // Statistical loading counter increment animation loops
    const runCounters = () => {
        const statsAppointmentsCount = document.getElementById('statsAppointmentsCount');
        const statsMessagesCount = document.getElementById('statsMessagesCount');

        const animateCounter = (el) => {
            const targetValue = parseInt(el.getAttribute('data-target') || '0', 10);
            if (targetValue === 0) {
                el.innerText = '0';
                return;
            }

            const duration = 1500;
            const start = 0;
            const startTime = performance.now();

            const updateCount = (timestamp) => {
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOutQuad = progress * (2 - progress);
                
                const current = Math.floor(easeOutQuad * targetValue);
                el.innerText = current.toLocaleString('vi-VN');

                if (progress < 1) {
                    requestAnimationFrame(updateCount);
                } else {
                    el.innerText = targetValue.toLocaleString('vi-VN');
                }
            };
            requestAnimationFrame(updateCount);
        };

        if (statsAppointmentsCount) animateCounter(statsAppointmentsCount);
        if (statsMessagesCount) animateCounter(statsMessagesCount);
    };

    // Delay runCounters slightly to execute after elements are parsed
    setTimeout(runCounters, 200);

    // ==================== 5. TAB SWAPPING REGISTRY ====================
    const tabLinks = document.querySelectorAll('.tab-nav-link');
    const tabPanels = document.querySelectorAll('.tab-content-panel');

    tabLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetPanelId = this.getAttribute('data-tab-target');

            // ===== REVIEW TAB GUARD =====
            // If user clicks the Review tab, check ticket completion status first
            if (targetPanelId === 'tabPanelReview') {
                if (ticket.status !== 'completed') {
                    // Ticket not completed — show warning toast and block navigation
                    showToast(
                        `⚠️ Phiếu chưa hoàn thành! Chức năng đánh giá chỉ khả dụng sau khi phiếu được xử lý xong. Trạng thái hiện tại: <strong>${ticket.statusText}</strong>`,
                        'warning'
                    );
                    return; // Block tab switch
                } else {
                    // Ticket completed — redirect to review page
                    window.location.href = `ticket-review.html?code=${encodeURIComponent(ticket.code)}`;
                    return;
                }
            }
            // ============================

            // Set buttons active state
            tabLinks.forEach(l => {
                l.classList.remove('active');
                l.setAttribute('aria-selected', 'false');
            });
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');

            // Swap panels display
            tabPanels.forEach(panel => {
                panel.classList.remove('active');
            });
            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }

            // Custom handler: Scroll chat to bottom when chat tab is active
            if (targetPanelId === 'tabPanelChat') {
                const chatMessagesContainer = document.getElementById('chatMessagesContainer');
                if (chatMessagesContainer) {
                    setTimeout(() => {
                        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                    }, 50);
                }
            }
        });
    });

    // Event delegation shortcuts to switch tabs (like Nhắn tin agent button shortcut)
    document.addEventListener('click', (e) => {
        if (e.target.closest('#btnChatAgentShortcut')) {
            e.preventDefault();
            const chatTabLink = document.getElementById('tabBtnChat');
            if (chatTabLink) chatTabLink.click();
        }
    });

    // ==================== 6. CHAT CONTROLLER INTERACTION ====================
    const chatForm = document.getElementById('chatForm');
    const chatMessageTextarea = document.getElementById('chatMessageTextarea');
    const chatMessagesContainer = document.getElementById('chatMessagesContainer');
    const btnAttachChatFile = document.getElementById('btnAttachChatFile');
    const chatFileInput = document.getElementById('chatFileInput');
    const btnEmojiSelector = document.getElementById('btnEmojiSelector');
    const emojiDrawerPopover = document.getElementById('emojiDrawerPopover');

    // Auto-resizing messenger textarea input field
    if (chatMessageTextarea) {
        chatMessageTextarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            // Constraint maximum height to 120px to avoid text overlay
            if (parseInt(this.style.height, 10) > 120) {
                this.style.height = '120px';
                this.style.overflowY = 'auto';
            } else {
                this.style.overflowY = 'hidden';
            }
        });
    }

    // Toggle Emoji Popover
    if (btnEmojiSelector && emojiDrawerPopover) {
        btnEmojiSelector.addEventListener('click', (e) => {
            e.stopPropagation();
            emojiDrawerPopover.classList.toggle('d-none');
        });

        // Insert Emoji at cursor position
        emojiDrawerPopover.addEventListener('click', (e) => {
            if (e.target.tagName === 'SPAN') {
                const emoji = e.target.textContent;
                const startPos = chatMessageTextarea.selectionStart;
                const endPos = chatMessageTextarea.selectionEnd;
                const text = chatMessageTextarea.value;
                
                chatMessageTextarea.value = text.substring(0, startPos) + emoji + text.substring(endPos);
                chatMessageTextarea.focus();
                
                // Set cursor position after inserted emoji
                chatMessageTextarea.selectionStart = chatMessageTextarea.selectionEnd = startPos + emoji.length;
                emojiDrawerPopover.classList.add('d-none');
            }
        });

        document.addEventListener('click', (e) => {
            if (!emojiDrawerPopover.contains(e.target) && e.target !== btnEmojiSelector) {
                emojiDrawerPopover.classList.add('d-none');
            }
        });
    }

    // Append mock chat system logic & local storage sync
    const saveNewChatMessage = (msgObj) => {
        ticket.chatMessages.push(msgObj);
        
        // Write to details database
        const details = JSON.parse(localStorage.getItem('techsupport_tickets_details') || '{}');
        details[ticket.code] = ticket;
        localStorage.setItem('techsupport_tickets_details', JSON.stringify(details));

        // Sync messages count badge statistics
        const statsMessagesCount = document.getElementById('statsMessagesCount');
        if (statsMessagesCount) {
            statsMessagesCount.setAttribute('data-target', ticket.chatMessages.length);
            statsMessagesCount.innerText = ticket.chatMessages.length;
        }

        renderChatMessages();
    };

    // Chat Submission Form Submit
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const rawText = chatMessageTextarea.value.trim();
            if (!rawText) return;

            const now = new Date();
            const dateStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            const newMsg = {
                sender: "user",
                time: dateStr,
                text: rawText
            };

            saveNewChatMessage(newMsg);
            chatMessageTextarea.value = '';
            chatMessageTextarea.style.height = 'auto'; // Reset height

            // Trigger mock helper chatbot / agent typing answer
            triggerAgentMockReply();
        });

        // Enter key submits message (unless Shift+Enter is pressed)
        chatMessageTextarea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                chatForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    // Chat Attachment trigger
    if (btnAttachChatFile && chatFileInput) {
        btnAttachChatFile.addEventListener('click', () => {
            chatFileInput.click();
        });

        chatFileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const sizeKB = (file.size / 1024).toFixed(0);
                const sizeStr = sizeKB > 1000 ? (sizeKB / 1024).toFixed(1) + ' MB' : sizeKB + ' KB';

                const now = new Date();
                const dateStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                const newMsg = {
                    sender: "user",
                    time: dateStr,
                    text: `Đã đính kèm tệp tin: ${file.name}`,
                    file: {
                        name: file.name,
                        size: sizeStr,
                        type: file.type.startsWith('image/') ? 'image' : 'pdf',
                        url: '#'
                    }
                };

                // Add to chat messages
                saveNewChatMessage(newMsg);
                showToast(`✅ Đã đính kèm tệp ${file.name} vào đoạn chat`);
                
                // Clear input value
                this.value = '';

                // Trigger agent reply
                triggerAgentMockReply();
            }
        });
    }

    // Mock Technician Auto reply simulator
    const triggerAgentMockReply = () => {
        if (!ticket.agent) return; // No agent assigned, don't reply

        setTimeout(() => {
            const chatMessagesContainer = document.getElementById('chatMessagesContainer');
            if (!chatMessagesContainer) return;

            // Typing indicator simulation
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'message-bubble-row agent-side typing-bubble';
            typingIndicator.innerHTML = `
                <div class="msg-avatar">${ticket.agent.initials}</div>
                <div class="msg-bubble-content">
                    <div class="msg-text-box bg-white text-muted py-2 px-3">
                        <span class="spinner-grow spinner-grow-sm text-secondary me-1"></span> Kỹ thuật viên đang trả lời...
                    </div>
                </div>
            `;
            chatMessagesContainer.appendChild(typingIndicator);
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

            // Clear typing indicator and append actual message after 1.5s
            setTimeout(() => {
                typingIndicator.remove();

                const now = new Date();
                const dateStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                const agentReplies = [
                    "Dạ em đã nhận được thông tin phản hồi của anh An ạ. Em đang kiểm tra các thông số đường truyền.",
                    "Dạ anh An yên tâm nhé, em đã chuẩn bị đầy đủ thiết bị quang để hàn nối. Theo lịch chiều mai em sẽ qua xử lý dứt điểm cho nhà mình ạ.",
                    "Vâng anh, trước khi qua 15 phút em sẽ liên hệ trước để chắc chắn có người ở nhà mở cửa giúp em.",
                    "Dạ cảm ơn anh đã phản hồi thông tin chi tiết. Em đã ghi nhận vào hồ sơ khắc phục sự cố này.",
                    "Anh An ơi, nếu có thêm thay đổi gì về khung giờ hẹn, anh nhắn lại em chuẩn bị sắp xếp nhé."
                ];

                // Select a random reply
                const randomText = agentReplies[Math.floor(Math.random() * agentReplies.length)];

                const agentMsg = {
                    sender: "agent",
                    time: dateStr,
                    text: randomText
                };

                saveNewChatMessage(agentMsg);
            }, 1200);

        }, 1000);
    };

    // ==================== 7. STAR RATINGS & SERVICE REVIEW FORM ====================
    const bindRatingMetric = (metricId, hiddenInputId) => {
        const wrapper = document.getElementById(metricId);
        const input = document.getElementById(hiddenInputId);
        if (!wrapper || !input) return;

        const stars = wrapper.querySelectorAll('.star-item');

        const highlightStars = (rating) => {
            stars.forEach(star => {
                const rVal = parseInt(star.getAttribute('data-rating'), 10);
                if (rVal <= rating) {
                    star.classList.add('hovered');
                } else {
                    star.classList.remove('hovered');
                }
            });
        };

        const resetStars = () => {
            stars.forEach(star => {
                star.classList.remove('hovered');
            });
        };

        const setStarsSelected = (rating) => {
            stars.forEach(star => {
                const rVal = parseInt(star.getAttribute('data-rating'), 10);
                const icon = star.querySelector('i');
                if (rVal <= rating) {
                    star.classList.add('selected');
                    if (icon) {
                        icon.className = 'bi bi-star-fill';
                    }
                } else {
                    star.classList.remove('selected');
                    if (icon) {
                        icon.className = 'bi bi-star';
                    }
                }
            });
        };

        stars.forEach(star => {
            // Hover effect
            star.addEventListener('mouseover', function() {
                const rating = parseInt(this.getAttribute('data-rating'), 10);
                highlightStars(rating);
            });

            star.addEventListener('mouseout', resetStars);

            // Click select effect
            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'), 10);
                input.value = rating;
                setStarsSelected(rating);
            });
        });
    };

    // Bind all 3 evaluation metrics
    bindRatingMetric('reviewRatingQuality', 'ratingValueQuality');
    bindRatingMetric('reviewRatingAttitude', 'ratingValueAttitude');
    bindRatingMetric('reviewRatingSpeed', 'ratingValueSpeed');

    // Review Form Submission
    const reviewForm = document.getElementById('ticketReviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const quality = parseInt(document.getElementById('ratingValueQuality').value, 10);
            const attitude = parseInt(document.getElementById('ratingValueAttitude').value, 10);
            const speed = parseInt(document.getElementById('ratingValueSpeed').value, 10);
            const comments = document.getElementById('reviewComments').value.trim();

            if (quality === 0 || attitude === 0 || speed === 0) {
                showToast('⚠️ Vui lòng hoàn thành đánh giá sao cho cả 3 tiêu chí nhé!', 'warning');
                return;
            }

            // Save review details into ticket object
            ticket.review = {
                quality,
                attitude,
                speed,
                comments,
                submittedAt: new Date().toLocaleDateString('vi-VN')
            };

            // Write back to database details
            const details = JSON.parse(localStorage.getItem('techsupport_tickets_details') || '{}');
            details[ticket.code] = ticket;
            localStorage.setItem('techsupport_tickets_details', JSON.stringify(details));

            // Show Toast Success
            showToast('✅ Đã gửi đánh giá dịch vụ chăm sóc thành công. Cảm ơn phản hồi của bạn!');
            
            // Re-render Review panel layout immediately
            renderReviewPanel();
        });
    }

    // ==================== 8. IMAGE LIGHTBOX MODAL ====================
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImagePreview = document.getElementById('lightboxImagePreview');
    const lightboxPdfPreview = document.getElementById('lightboxPdfPreview');
    const lightboxModalTitle = document.getElementById('lightboxModalTitle');
    const pdfFileName = document.getElementById('pdfFileName');
    const modalBackdropOverlay = document.getElementById('modalBackdropOverlay');
    const btnDownloadPdfModal = document.getElementById('btnDownloadPdfModal');

    const openLightbox = (fileUrl, fileName, fileType) => {
        if (!lightboxModal || !modalBackdropOverlay) return;

        if (lightboxModalTitle) lightboxModalTitle.innerHTML = `<i class="bi ${fileType === 'image' ? 'bi-file-earmark-image' : 'bi-file-earmark-pdf'} text-danger me-2"></i> Xem: ${fileName}`;

        if (fileType === 'image') {
            if (lightboxImagePreview) {
                lightboxImagePreview.src = fileUrl;
                lightboxImagePreview.classList.remove('d-none');
            }
            if (lightboxPdfPreview) {
                lightboxPdfPreview.classList.add('d-none');
            }
        } else {
            if (lightboxImagePreview) {
                lightboxImagePreview.classList.add('d-none');
                lightboxImagePreview.src = '';
            }
            if (lightboxPdfPreview) {
                lightboxPdfPreview.classList.remove('d-none');
                if (pdfFileName) pdfFileName.textContent = fileName;
                if (btnDownloadPdfModal) {
                    btnDownloadPdfModal.setAttribute('data-file-name', fileName);
                }
            }
        }

        // Show modal and backdrop
        modalBackdropOverlay.classList.add('show');
        lightboxModal.classList.add('show');
    };

    const closeLightbox = () => {
        if (!lightboxModal || !modalBackdropOverlay) return;
        lightboxModal.classList.remove('show');
        modalBackdropOverlay.classList.remove('show');
        if (lightboxImagePreview) lightboxImagePreview.src = '';
    };

    // Bind open events to attachments gallery and files table
    document.addEventListener('click', (e) => {
        // Gallery thumbnail card click
        const galleryCard = e.target.closest('.gallery-card');
        if (galleryCard) {
            // Check if user clicked the download button on a PDF card, avoid triggering lightbox
            if (e.target.closest('.btn-gallery-download')) return;

            const url = galleryCard.getAttribute('data-file-url');
            const name = galleryCard.getAttribute('data-file-name');
            const type = galleryCard.classList.contains('pdf-card') ? 'pdf' : 'image';
            
            if (url && name) {
                openLightbox(url, name, type);
            }
            return;
        }

        // Table row view click or name click
        const rowViewBtn = e.target.closest('.btn-view-file');
        const rowFileName = e.target.closest('.table-file-name');
        if (rowViewBtn || rowFileName) {
            const row = e.target.closest('tr');
            if (row) {
                const url = row.getAttribute('data-file-url');
                const name = row.getAttribute('data-file-name');
                const type = row.getAttribute('data-file-type');
                openLightbox(url, name, type);
            }
            return;
        }

        // Modal triggers binding close
        if (e.target.closest('[data-close-modal]') || e.target === modalBackdropOverlay) {
            closeLightbox();
        }
    });

    // Handle Escape key to close modal
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('show')) {
            closeLightbox();
        }
    });

    // Mock downloads triggering toast
    document.addEventListener('click', (e) => {
        const btnDownload = e.target.closest('.btn-gallery-download, .btn-download-file, #btnDownloadPdfModal');
        if (btnDownload) {
            e.preventDefault();
            const fileName = btnDownload.getAttribute('data-file-name') || "bienban.pdf";
            showToast(`📥 Đã tải xuống tệp tin ${fileName} về thư mục Downloads`);
        }
    });

    // ==================== 9. EXTENDED ATTACHMENTS FILE UPLOAD ====================
    const btnUploadAttachmentTrigger = document.getElementById('btnUploadAttachmentTrigger');
    const modalUploadFileInput = document.getElementById('modalUploadFileInput');

    if (btnUploadAttachmentTrigger && modalUploadFileInput) {
        btnUploadAttachmentTrigger.addEventListener('click', () => {
            modalUploadFileInput.click();
        });

        modalUploadFileInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const sizeKB = (file.size / 1024).toFixed(0);
                const sizeStr = sizeKB > 1000 ? (sizeKB / 1024).toFixed(1) + ' MB' : sizeKB + ' KB';
                
                const now = new Date();
                const dateStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                const newAttachment = {
                    name: file.name,
                    size: sizeStr,
                    date: dateStr,
                    type: file.type.startsWith('image/') ? 'image' : 'pdf',
                    url: '#'
                };

                // Add to ticket attachments array
                ticket.attachments.push(newAttachment);

                // Write to database
                const details = JSON.parse(localStorage.getItem('techsupport_tickets_details') || '{}');
                details[ticket.code] = ticket;
                localStorage.setItem('techsupport_tickets_details', JSON.stringify(details));

                // Re-render arrays
                renderAttachmentsGallery();
                renderAttachmentsTable();

                showToast(`✅ Đã tải lên tài liệu ${file.name} thành công!`);
                this.value = ''; // Reset input
            }
        });
    }

    // ==================== 10. MOBILE SIDEBAR DRAWER CLONER & TOGGLE ====================
    const btnToggleMobileSidebar = document.getElementById('btnToggleMobileSidebar');
    const mobileSidebarDrawer = document.getElementById('mobileSidebarDrawer');
    const mobileSidebarClose = document.getElementById('mobileSidebarClose');
    const mobileSidebarBody = document.getElementById('mobileSidebarBody');

    if (btnToggleMobileSidebar && mobileSidebarDrawer && mobileSidebarBody && modalBackdropOverlay) {
        
        // Open drawer
        btnToggleMobileSidebar.addEventListener('click', () => {
            // Clone the layout inside sidebar wrapper dynamically to avoid code repetition
            const sidebarContent = document.querySelector('.sidebar-cards-wrapper');
            if (sidebarContent) {
                mobileSidebarBody.innerHTML = sidebarContent.innerHTML;
            }

            modalBackdropOverlay.classList.add('show');
            mobileSidebarDrawer.classList.add('show');
        });

        // Close drawer
        const closeMobileDrawer = () => {
            mobileSidebarDrawer.classList.remove('show');
            modalBackdropOverlay.classList.remove('show');
        };

        if (mobileSidebarClose) {
            mobileSidebarClose.addEventListener('click', closeMobileDrawer);
        }

        // Close by clicking backdrop
        modalBackdropOverlay.addEventListener('click', () => {
            if (mobileSidebarDrawer.classList.contains('show')) {
                closeMobileDrawer();
            }
        });
    }

    // Delegated shortcut handlers inside mobile cloned drawer content
    document.addEventListener('click', (e) => {
        // Handle shortcuts (Nhắn tin, Gọi hỗ trợ) clicked inside the cloned mobile drawer
        if (e.target.closest('#mobileSidebarBody #btnChatAgentShortcut')) {
            e.preventDefault();
            // Close mobile drawer
            if (mobileSidebarDrawer) mobileSidebarDrawer.classList.remove('show');
            if (modalBackdropOverlay) modalBackdropOverlay.classList.remove('show');
            
            // Switch tab to chat
            const chatTabLink = document.getElementById('tabBtnChat');
            if (chatTabLink) chatTabLink.click();
        }
    });

    // ==================== 11. BOOTSTRAP INITIALIZATION CONTROLLER ====================
    // Initialize standard page details rendering
    renderTicketDetails();

    // ==================== 12. STATUS CHANGE CARD CONTROLLER ====================
    const STATUS_CONFIG = {
        pending: {
            text: 'Chờ tiếp nhận',
            dotClass: 'dot-pending',
            textClass: 'text-pending',
            bgClass: 'bg-pending',
            dotColor: 'danger',
            badgePillClass: 'status-pending',
            badgeSideClass: 'badge-pending',
            iconBoxClass: 'status-pending',
            iconClass: 'bi-hourglass-split',
            summaryTextClass: 'text-danger',
        },
        processing: {
            text: 'Đang xử lý',
            dotClass: 'dot-processing',
            textClass: 'text-processing',
            bgClass: 'bg-processing',
            dotColor: 'warning',
            badgePillClass: 'status-processing',
            badgeSideClass: 'badge-processing',
            iconBoxClass: 'status-processing',
            iconClass: 'bi-clock-history',
            summaryTextClass: '',
        },
        completed: {
            text: 'Đã hoàn thành',
            dotClass: 'dot-completed',
            textClass: 'text-completed',
            bgClass: 'bg-completed',
            dotColor: 'success',
            badgePillClass: 'status-completed',
            badgeSideClass: 'badge-completed',
            iconBoxClass: 'status-completed',
            iconClass: 'bi-check-circle-fill',
            summaryTextClass: 'text-success',
        },
        cancelled: {
            text: 'Đã hủy',
            dotClass: 'dot-cancelled',
            textClass: 'text-cancelled',
            bgClass: 'bg-cancelled',
            dotColor: 'danger',
            badgePillClass: 'status-cancelled',
            badgeSideClass: 'badge-cancelled',
            iconBoxClass: 'status-cancelled',
            iconClass: 'bi-x-circle-fill',
            summaryTextClass: 'text-muted',
        }
    };

    const ALL_DOT_CLASSES    = ['dot-pending','dot-processing','dot-completed','dot-cancelled'];
    const ALL_TEXT_CLASSES   = ['text-pending','text-processing','text-completed','text-cancelled'];
    const ALL_BG_CLASSES     = ['bg-pending','bg-processing','bg-completed','bg-cancelled'];
    const ALL_PILL_CLASSES   = ['status-pending','status-processing','status-completed','status-cancelled'];
    const ALL_SIDE_BADGE     = ['badge-pending','badge-processing','badge-completed','badge-cancelled','bg-success','bg-danger','bg-secondary','text-white','border-0'];
    const ALL_ICON_BOX       = ['status-pending','status-processing','status-completed','status-cancelled','status-orange'];

    /** Initialize status change card UI to match current ticket status */
    const initStatusChangeCard = () => {
        const cfg = STATUS_CONFIG[ticket.status];
        if (!cfg) return;

        const statusDropdown       = document.getElementById('statusDropdownSelect');
        const statusPulseDot       = document.getElementById('statusPulseDot');
        const statusIndicatorText  = document.getElementById('statusIndicatorText');
        const currentStatusDisplay = document.getElementById('currentStatusDisplay');

        // Set dropdown to current status
        if (statusDropdown) statusDropdown.value = ticket.status;

        // Apply dot class
        if (statusPulseDot) {
            statusPulseDot.classList.remove(...ALL_DOT_CLASSES);
            statusPulseDot.classList.add(cfg.dotClass);
        }

        // Apply text class and value
        if (statusIndicatorText) {
            statusIndicatorText.classList.remove(...ALL_TEXT_CLASSES);
            statusIndicatorText.classList.add(cfg.textClass);
            statusIndicatorText.textContent = cfg.text;
        }

        // Apply background on display box
        if (currentStatusDisplay) {
            currentStatusDisplay.classList.remove(...ALL_BG_CLASSES);
            currentStatusDisplay.classList.add(cfg.bgClass);
        }
    };

    /** Trigger flash animation on a DOM element */
    const flashElement = (el) => {
        if (!el) return;
        el.classList.remove('status-changed-flash');
        void el.offsetWidth; // reflow to restart animation
        el.classList.add('status-changed-flash');
        el.addEventListener('animationend', () => {
            el.classList.remove('status-changed-flash');
        }, { once: true });
    };

    /** Update all status-coloured elements across the page */
    const applyStatusColors = (newStatus) => {
        const cfg = STATUS_CONFIG[newStatus];
        if (!cfg) return;

        /* --- 1. Hero status badge pill --- */
        const heroTicketStatus = document.getElementById('heroTicketStatus');
        if (heroTicketStatus) {
            heroTicketStatus.className = `badge-status-pill ${cfg.badgePillClass}`;
            heroTicketStatus.innerHTML = `<span class="status-dot ${cfg.dotColor}"></span> ${cfg.text}`;
            flashElement(heroTicketStatus);
        }

        /* --- 2. Sidebar badge (meta-item) --- */
        const sideTicketStatus = document.getElementById('sideTicketStatus');
        if (sideTicketStatus) {
            sideTicketStatus.className = `badge ${cfg.badgeSideClass} py-1 px-3`;
            sideTicketStatus.textContent = cfg.text;
            flashElement(sideTicketStatus);
        }

        /* --- 3. Summary stats card status text & icon --- */
        const statsStatusText = document.getElementById('statsStatusText');
        if (statsStatusText) {
            statsStatusText.textContent = cfg.text;
            flashElement(statsStatusText);
        }

        const statusSummaryCard = document.querySelector('.summary-card:first-child');
        if (statusSummaryCard) {
            const iconBox = statusSummaryCard.querySelector('.summary-icon-box');
            if (iconBox) {
                iconBox.classList.remove(...ALL_ICON_BOX);
                iconBox.classList.add(cfg.iconBoxClass);
                const icon = iconBox.querySelector('i');
                if (icon) {
                    icon.className = `bi ${cfg.iconClass}`;
                }
                flashElement(iconBox);
            }
        }

        /* --- 4. Status change card indicator --- */
        const statusPulseDot       = document.getElementById('statusPulseDot');
        const statusIndicatorText  = document.getElementById('statusIndicatorText');
        const currentStatusDisplay = document.getElementById('currentStatusDisplay');

        if (statusPulseDot) {
            statusPulseDot.classList.remove(...ALL_DOT_CLASSES);
            statusPulseDot.classList.add(cfg.dotClass);
        }

        if (statusIndicatorText) {
            statusIndicatorText.classList.remove(...ALL_TEXT_CLASSES);
            statusIndicatorText.classList.add(cfg.textClass);
            statusIndicatorText.textContent = cfg.text;
        }

        if (currentStatusDisplay) {
            currentStatusDisplay.classList.remove(...ALL_BG_CLASSES);
            currentStatusDisplay.classList.add(cfg.bgClass);
            flashElement(currentStatusDisplay);
        }
    };

    /** Handle status update button click */
    const btnUpdateStatus = document.getElementById('btnUpdateStatus');
    const statusDropdownSelect = document.getElementById('statusDropdownSelect');

    if (btnUpdateStatus && statusDropdownSelect) {
        btnUpdateStatus.addEventListener('click', () => {
            const newStatus = statusDropdownSelect.value;

            if (newStatus === ticket.status) {
                showToast('ℹ️ Trạng thái không thay đổi', 'warning');
                return;
            }

            const cfg = STATUS_CONFIG[newStatus];
            if (!cfg) return;

            // Disable button briefly during processing
            btnUpdateStatus.disabled = true;
            btnUpdateStatus.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang cập nhật...';

            setTimeout(() => {
                // Update ticket data
                ticket.status     = newStatus;
                ticket.statusText = cfg.text;

                // Add timeline entry for the status change
                const now = new Date();
                const dateStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                ticket.timeline.push({
                    date: dateStr,
                    title: `Trạng thái cập nhật: ${cfg.text}`,
                    desc: `Trạng thái phiếu đã được chuyển sang "${cfg.text}".`,
                    type: newStatus === 'completed' ? 'success' : (newStatus === 'cancelled' ? 'danger' : (newStatus === 'processing' ? 'warning' : 'info'))
                });

                // Persist to localStorage
                const details = JSON.parse(localStorage.getItem('techsupport_tickets_details') || '{}');
                details[ticket.code] = ticket;
                localStorage.setItem('techsupport_tickets_details', JSON.stringify(details));

                // Apply color changes with animation
                applyStatusColors(newStatus);

                // Re-render review panel (locks/unlocks based on status)
                renderReviewPanel();

                // Re-render timeline
                renderTimelineFlow();

                // Re-enable button
                btnUpdateStatus.disabled = false;
                btnUpdateStatus.innerHTML = '<i class="bi bi-check2-circle me-2"></i>Xác nhận cập nhật';

                showToast(`✅ Trạng thái đã cập nhật: ${cfg.text}`);
            }, 600);
        });
    }

    // Initialize the status change card with current status on page load
    initStatusChangeCard();
});
