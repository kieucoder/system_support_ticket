/**
 * dashboard.js - Staff Dashboard Core Controller
 * Orchestrates template injections, charts, tables, AI assistant simulation, and chat widget logic.
 */
document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ==========================================================================
    // 1. DYNAMIC COMPONENT LOADING
    // ==========================================================================
    const loadComponent = (selector, url) => {
        return fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load: ${url}`);
                return response.text();
            })
            .then(html => {
                const element = document.querySelector(selector);
                if (element) {
                    element.innerHTML = html;
                }
            })
            .catch(error => {
                console.error(`Component load error:`, error);
            });
    };

    // Load templates in parallel, then initialize controllers
    Promise.all([
        loadComponent('#sidebar-mount', '../../components/sidebar.html'),
        loadComponent('#topbar-mount', '../../components/topbar.html'),
        loadComponent('#footer-mount', '../../components/footer.html')
    ]).then(() => {
        // Initialize theme and sidebar controllers
        if (window.ThemeController) window.ThemeController.init();
        if (window.SidebarController) window.SidebarController.init();
        
        // Setup initial UI states
        initSearchHandlers();
    });

    // ==========================================================================
    // 2. STATISTICS CARDS ANIMATION
    // ==========================================================================
    const statsData = {
        'count-total': 1284,
        'count-processing': 84,
        'count-completed': 1146,
        'count-customers': 924,
        'count-services': 7,
        'count-categories': 12
    };

    const animateCounters = () => {
        Object.keys(statsData).forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            
            const target = statsData[id];
            let start = 0;
            const duration = 1200; // ms
            const stepTime = Math.abs(Math.floor(duration / target));
            
            const timer = setInterval(() => {
                start += Math.ceil(target / 30);
                if (start >= target) {
                    el.textContent = target.toLocaleString('vi-VN');
                    clearInterval(timer);
                } else {
                    el.textContent = start.toLocaleString('vi-VN');
                }
            }, 30);
        });
    };

    // Run counter animation
    animateCounters();

    // ==========================================================================
    // 3. CHART.JS CONFIGURATION
    // ==========================================================================
    let lineChart, doughnutChart;

    const initCharts = () => {
        const lineCtx = document.getElementById('ticketTrendChart');
        const pieCtx = document.getElementById('ticketStatusChart');
        
        if (!lineCtx || !pieCtx) return;

        // Custom theme-aware colors
        const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        const primaryColor = cssVar('--primary') || '#2563EB';
        const successColor = cssVar('--success') || '#10B981';
        const warningColor = cssVar('--warning') || '#F59E0B';
        const dangerColor = cssVar('--danger') || '#EF4444';
        const textColor = cssVar('--text-muted') || '#64748B';
        const borderColor = cssVar('--border-color') || '#E2E8F0';

        // 3a. Line Chart (Ticket Trend by Month)
        const lineGradient = lineCtx.getContext('2d').createLinearGradient(0, 0, 0, 300);
        lineGradient.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
        lineGradient.addColorStop(1, 'rgba(37, 99, 235, 0.00)');

        lineChart = new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
                datasets: [{
                    label: 'Phiếu tiếp nhận',
                    data: [150, 230, 180, 290, 240, 310],
                    borderColor: primaryColor,
                    borderWidth: 3,
                    backgroundColor: lineGradient,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: primaryColor,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        grid: { color: borderColor },
                        ticks: { color: textColor, font: { family: 'Inter' } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { family: 'Inter' } }
                    }
                }
            }
        });

        // 3b. Doughnut Chart (Status Distribution)
        doughnutChart = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Chờ tiếp nhận', 'Đang xử lý', 'Đã hoàn thành'],
                datasets: [{
                    data: [15, 25, 60],
                    backgroundColor: [warningColor, primaryColor, successColor],
                    borderWidth: 2,
                    borderColor: cssVar('--bg-card') || '#FFFFFF',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            font: { family: 'Inter', size: 11 },
                            usePointStyle: true,
                            padding: 15
                        }
                    }
                },
                cutout: '75%'
            }
        });
    };

    // Initialize charts
    initCharts();

    // Redraw charts on theme change
    document.addEventListener('click', function(e) {
        if (e.target.closest('#toggleTheme')) {
            setTimeout(() => {
                if (lineChart) lineChart.destroy();
                if (doughnutChart) doughnutChart.destroy();
                initCharts();
            }, 350); // wait for HTML attribute transition
        }
    });

    // ==========================================================================
    // 4. TICKETS TABLE SEARCH & PAGINATION
    // ==========================================================================
    const allTickets = [
        { id: 'TKT-2026-891', customer: 'Lê Hoài Nam', service: 'FTTH Viettel Giga', priority: 'Cao', status: 'waiting', date: '01/07/2026 15:30' },
        { id: 'TKT-2026-890', customer: 'Nguyễn Bích Phương', service: 'Truyền hình TV360', priority: 'Trung bình', status: 'processing', date: '01/07/2026 14:15' },
        { id: 'TKT-2026-889', customer: 'Phạm Minh Đức', service: 'Di động 4G/5G', priority: 'Thấp', status: 'completed', date: '01/07/2026 10:05' },
        { id: 'TKT-2026-888', customer: 'Trần Thu Hà', service: 'Hóa đơn & Thanh toán', priority: 'Trung bình', status: 'completed', date: '30/06/2026 17:40' },
        { id: 'TKT-2026-887', customer: 'Vũ Quốc Khánh', service: 'Đường truyền doanh nghiệp', priority: 'Khẩn cấp', status: 'processing', date: '30/06/2026 16:00' },
        { id: 'TKT-2026-886', customer: 'Hoàng Thùy Linh', service: 'FTTH Viettel Fast', priority: 'Cao', status: 'waiting', date: '30/06/2026 11:20' },
        { id: 'TKT-2026-885', customer: 'Đỗ Hùng Dũng', service: 'Di động 4G/5G', priority: 'Trung bình', status: 'completed', date: '29/06/2026 09:30' },
        { id: 'TKT-2026-884', customer: 'Nguyễn Văn Quyết', service: 'Truyền hình TV360', priority: 'Cao', status: 'completed', date: '28/06/2026 14:45' }
    ];

    let currentTickets = [...allTickets];
    let currentPage = 1;
    const itemsPerPage = 5;

    const getStatusText = (status) => {
        switch(status) {
            case 'waiting': return '<span class="badge-status waiting"><i class="fa-regular fa-clock"></i> Chờ xử lý</span>';
            case 'processing': return '<span class="badge-status processing"><i class="fa-solid fa-spinner spinner-loading"></i> Đang xử lý</span>';
            case 'completed': return '<span class="badge-status completed"><i class="fa-regular fa-circle-check"></i> Hoàn thành</span>';
            default: return status;
        }
    };

    const getPriorityBadge = (prio) => {
        if (prio === 'Cao' || prio === 'Khẩn cấp') {
            return `<span class="badge bg-danger-subtle text-danger px-2 py-1 rounded" style="font-size: 0.75rem;">${prio}</span>`;
        } else if (prio === 'Trung bình') {
            return `<span class="badge bg-warning-subtle text-warning px-2 py-1 rounded" style="font-size: 0.75rem;">${prio}</span>`;
        } else {
            return `<span class="badge bg-secondary-subtle text-secondary px-2 py-1 rounded" style="font-size: 0.75rem;">${prio}</span>`;
        }
    };

    const renderTable = () => {
        const tbody = document.getElementById('recentTicketsBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = currentTickets.slice(startIndex, endIndex);

        if (paginatedItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Không tìm thấy phiếu nào phù hợp</td></tr>`;
            updatePaginationControls(0);
            return;
        }

        paginatedItems.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold text-primary">${t.id}</td>
                <td>${t.customer}</td>
                <td>
                    <div class="fw-medium">${t.service}</div>
                </td>
                <td>${getPriorityBadge(t.priority)}</td>
                <td>${getStatusText(t.status)}</td>
                <td class="text-muted" style="font-size: 0.8rem;">${t.date}</td>
            `;
            tbody.appendChild(tr);
        });

        updatePaginationControls(currentTickets.length);
    };

    const updatePaginationControls = (totalItems) => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startNum = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
        const endNum = Math.min(currentPage * itemsPerPage, totalItems);

        // Info text
        const info = document.getElementById('paginationInfo');
        if (info) {
            info.textContent = `Hiển thị ${startNum}-${endNum} trên tổng số ${totalItems} phiếu`;
        }

        // Page buttons list
        const pagesList = document.getElementById('paginationPages');
        if (!pagesList) return;

        pagesList.innerHTML = '';

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" data-page="prev"><i class="fa-solid fa-angle-left"></i></a>`;
        pagesList.appendChild(prevLi);

        // Individual page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${currentPage === i ? 'active' : ''}`;
            pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            pagesList.appendChild(pageLi);
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" data-page="next"><i class="fa-solid fa-angle-right"></i></a>`;
        pagesList.appendChild(nextLi);
    };

    // Table Pagination event delegation
    document.addEventListener('click', function(e) {
        const link = e.target.closest('#paginationPages .page-link');
        if (!link) return;
        
        e.preventDefault();
        const action = link.getAttribute('data-page');

        if (action === 'prev') {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        } else if (action === 'next') {
            const totalPages = Math.ceil(currentTickets.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        } else {
            const targetPage = parseInt(action, 10);
            if (targetPage && targetPage !== currentPage) {
                currentPage = targetPage;
                renderTable();
            }
        }
    });

    // Handle Search functionality
    const handleTableSearch = (query) => {
        const lower = query.toLowerCase().trim();
        currentTickets = allTickets.filter(t => 
            t.id.toLowerCase().includes(lower) ||
            t.customer.toLowerCase().includes(lower) ||
            t.service.toLowerCase().includes(lower)
        );
        currentPage = 1;
        renderTable();
    };

    // Hook up local table search & topbar global search
    const initSearchHandlers = () => {
        const tableSearch = document.getElementById('tableSearchInput');
        if (tableSearch) {
            tableSearch.addEventListener('input', (e) => {
                handleTableSearch(e.target.value);
            });
        }

        const topbarSearch = document.getElementById('topbarSearchInput');
        if (topbarSearch) {
            topbarSearch.addEventListener('input', (e) => {
                handleTableSearch(e.target.value);
                // Also update the local search input value to sync
                if (tableSearch) tableSearch.value = e.target.value;
            });
        }
    };

    // Render table on startup
    renderTable();

    // ==========================================================================
    // 5. AI ASSISTANT MODULE
    // ==========================================================================
    const sendBtn = document.getElementById('aiSendBtn');
    const textarea = document.getElementById('aiTextarea');
    const loading = document.getElementById('aiLoading');
    const responseBox = document.getElementById('aiResponseBox');
    
    const responses = {
        "check_ftth": "Hệ thống phát hiện **2 đường truyền FTTH** khu vực Cầu Giấy đang gặp cảnh báo suy hao quang (>28dBm). Đề xuất cử kỹ thuật viên khu vực ứng cứu trước 18:00.",
        "pending_tickets": "Hiện tại bạn có **6 phiếu chờ xử lý**, trong đó có **2 phiếu mức độ khẩn cấp** liên quan đến đứt cáp quang thuê bao doanh nghiệp tại Chi nhánh Nam Từ Liêm.",
        "common_issues": "Dựa trên số liệu tuần qua, lỗi phổ biến nhất là **Lỗi cấu hình Modem AC1000** chiếm 45% tổng số phiếu báo hỏng quang khu vực Hà Nội.",
        "default": "Tôi đã ghi nhận yêu cầu của bạn. Tôi đang phân tích log hệ thống và kiểm tra tài nguyên trạm phát OLT. Quá trình xử lý sẽ mất khoảng vài giây."
    };

    // Question suggestion click handler
    document.querySelectorAll('.ai-suggestion-pill').forEach(pill => {
        pill.addEventListener('click', function() {
            if (textarea) {
                textarea.value = this.textContent.trim();
                textarea.focus();
            }
        });
    });

    const triggerAiAnswer = () => {
        if (!textarea || !textarea.value.trim()) return;

        const val = textarea.value.toLowerCase();
        let answer = responses["default"];

        if (val.includes("suy hao") || val.includes("ftth")) {
            answer = responses["check_ftth"];
        } else if (val.includes("chờ") || val.includes("phiếu")) {
            answer = responses["pending_tickets"];
        } else if (val.includes("phổ biến") || val.includes("nhiều nhất") || val.includes("lỗi")) {
            answer = responses["common_issues"];
        }

        // UI states
        if (loading) loading.style.display = 'flex';
        if (responseBox) responseBox.style.display = 'none';
        if (sendBtn) sendBtn.disabled = true;

        setTimeout(() => {
            if (loading) loading.style.display = 'none';
            if (responseBox) {
                responseBox.style.display = 'block';
                responseBox.innerHTML = `
                    <div class="card card-body border-0 shadow-sm animate-fade-in" style="background-color: var(--primary-subtle); border-left: 4px solid #6366F1 !important; border-radius: var(--radius-sm);">
                        <p class="mb-0 fw-semibold text-primary mb-1"><i class="fa-solid fa-sparkles me-2"></i>AI gợi ý giải pháp:</p>
                        <p class="mb-0" style="color: var(--text-main); line-height: 1.5; font-size: 0.85rem;">${answer}</p>
                    </div>
                `;
            }
            if (sendBtn) sendBtn.disabled = false;
        }, 1500);
    };

    if (sendBtn) {
        sendBtn.addEventListener('click', triggerAiAnswer);
    }
    if (textarea) {
        textarea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                triggerAiAnswer();
            }
        });
    }

    // ==========================================================================
    // 6. CHAT WIDGET MODULE
    // ==========================================================================
    const chatToggle = document.getElementById('chatWidgetToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatCloseBtn');
    const chatBack = document.getElementById('chatBackBtn');
    const messagesView = document.getElementById('chatMessagesView');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSendBtn');
    const messagesScroll = document.getElementById('chatMessagesScroll');
    const notifyBadge = document.querySelector('.badge-chat-notify');

    let currentConversationUser = '';

    // Open/Close toggle
    if (chatToggle) {
        chatToggle.addEventListener('click', () => {
            chatWindow.classList.toggle('open');
            // Reset notifications when widget opens
            if (chatWindow.classList.contains('open') && notifyBadge) {
                notifyBadge.style.display = 'none';
            }
        });
    }

    if (chatClose) {
        chatClose.addEventListener('click', () => {
            chatWindow.classList.remove('open');
        });
    }

    // Return to contact list view
    if (chatBack) {
        chatBack.addEventListener('click', () => {
            messagesView.classList.remove('active');
        });
    }

    // Open chat thread when clicking a contact
    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', function() {
            const name = this.querySelector('.chat-item-name').textContent;
            const avatar = this.querySelector('.chat-item-avatar').src;
            const status = this.querySelector('.chat-item-status').classList.contains('online') ? 'Đang hoạt động' : 'Ngoại tuyến';
            
            currentConversationUser = name;

            // Update thread header info
            document.getElementById('chatThreadName').textContent = name;
            document.getElementById('chatThreadStatus').textContent = status;
            document.getElementById('chatThreadAvatar').src = avatar;

            // Load mock messages
            const scroll = document.getElementById('chatMessagesScroll');
            scroll.innerHTML = `
                <div class="chat-bubble-wrapper received">
                    <div class="chat-bubble">Xin chào, tôi cần hỗ trợ kiểm tra lại tín hiệu modem Wi-Fi nhà tôi chập chờn từ hôm qua.</div>
                    <span class="chat-bubble-time">10:32</span>
                </div>
                <div class="chat-bubble-wrapper sent">
                    <div class="chat-bubble">Chào anh/chị, tôi là Sơn ở bộ phận hỗ trợ kỹ thuật Viettel. Tôi đã nhận được yêu cầu và đang tiến hành đo tín hiệu suy hao trên ODF.</div>
                    <span class="chat-bubble-time">10:35</span>
                </div>
            `;

            // Transition to chat messages view
            messagesView.classList.add('active');
            
            // Scroll to bottom
            setTimeout(() => {
                scroll.scrollTop = scroll.scrollHeight;
            }, 100);
        });
    });

    const sendChatMessage = () => {
        if (!chatInput || !chatInput.value.trim()) return;

        const msgText = chatInput.value.trim();
        chatInput.value = '';

        // Add user bubble
        const bubbleWrap = document.createElement('div');
        bubbleWrap.className = 'chat-bubble-wrapper sent';
        
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        bubbleWrap.innerHTML = `
            <div class="chat-bubble">${msgText}</div>
            <span class="chat-bubble-time">${timeStr}</span>
        `;
        messagesScroll.appendChild(bubbleWrap);
        messagesScroll.scrollTop = messagesScroll.scrollHeight;

        // Simulated reply after 1.5 seconds
        setTimeout(() => {
            const replyWrap = document.createElement('div');
            replyWrap.className = 'chat-bubble-wrapper received';
            
            const replyTime = new Date();
            const replyTimeStr = `${replyTime.getHours().toString().padStart(2, '0')}:${replyTime.getMinutes().toString().padStart(2, '0')}`;
            
            replyWrap.innerHTML = `
                <div class="chat-bubble">Vâng, tôi đã khởi động lại thiết bị rồi nhưng đèn LOS vẫn nhấp nháy đỏ. Anh kiểm tra giúp tôi nhé.</div>
                <span class="chat-bubble-time">${replyTimeStr}</span>
            `;
            messagesScroll.appendChild(replyWrap);
            messagesScroll.scrollTop = messagesScroll.scrollHeight;
        }, 1500);
    };

    if (chatSend) {
        chatSend.addEventListener('click', sendChatMessage);
    }
    if (chatInput) {
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
});
