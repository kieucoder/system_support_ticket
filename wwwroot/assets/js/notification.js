/* ==========================================================================
   FILE: wwwroot/assets/js/notification.js
   DESCRIPTION: Realtime SignalR Customer Notification Center Client Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const notifBellTrigger = document.getElementById('notifBellTrigger');
    const notifBadgeCounter = document.getElementById('notifBadgeCounter');
    const notifDropdownMenu = document.getElementById('notifDropdownMenu');
    const notifListContainer = document.getElementById('notifListContainer');

    // 1. Toggle Header Dropdown Menu
    if (notifBellTrigger && notifDropdownMenu) {
        notifBellTrigger.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = notifDropdownMenu.classList.contains('show');

            if (!isOpen) {
                notifDropdownMenu.classList.add('show');
                loadHeaderNotifications();
            } else {
                notifDropdownMenu.classList.remove('show');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (notifDropdownMenu && !notifDropdownMenu.contains(e.target) && !notifBellTrigger.contains(e.target)) {
                notifDropdownMenu.classList.remove('show');
            }
        });
    }

    // 2. Fetch Top Header Notifications
    function loadHeaderNotifications() {
        if (!notifListContainer) return;

        notifListContainer.innerHTML = `
            <div class="text-center py-4 text-secondary small">
                <div class="spinner-border spinner-border-sm text-danger me-2" role="status"></div>
                Đang tải thông báo...
            </div>
        `;

        fetch('/Notification/GetHeaderNotifications')
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    updateBadgeCounter(data.count);
                    renderHeaderDropdownItems(data.items);
                } else {
                    renderHeaderEmptyState();
                }
            })
            .catch(err => {
                console.warn('Failed to load header notifications:', err);
                renderHeaderEmptyState();
            });
    }

    // 3. Render Dropdown Items
    function renderHeaderDropdownItems(items) {
        if (!notifListContainer) return;

        if (!items || items.length === 0) {
            renderHeaderEmptyState();
            return;
        }

        let html = '';
        items.forEach(item => {
            const iconBg = getIconBgClass(item.type);
            const clickAttr = item.url === '#openChat' ? 'onclick="triggerChatWidgetOpen(); return false;"' : '';
            const href = item.url || '#';

            html += `
                <a href="${href}" ${clickAttr} class="notif-dropdown-item">
                    <div class="notif-dd-icon ${iconBg}">
                        <i class="bi ${item.icon || 'bi-bell-fill'}"></i>
                    </div>
                    <div class="flex-grow-1 min-w-0">
                        <div class="notif-dd-title text-truncate">${escapeHtml(item.title)}</div>
                        <div class="notif-dd-text text-truncate">${escapeHtml(item.content)}</div>
                        <div class="notif-dd-time"><i class="bi bi-clock me-1"></i>${item.timeAgo || ''}</div>
                    </div>
                </a>
            `;
        });

        notifListContainer.innerHTML = html;
    }

    function renderHeaderEmptyState() {
        if (!notifListContainer) return;
        notifListContainer.innerHTML = `
            <div class="text-center py-4 text-muted small px-3">
                <i class="bi bi-bell-slash text-secondary fs-4 d-block mb-1"></i>
                Chưa có thông báo mới nào.
            </div>
        `;
    }

    function updateBadgeCounter(count) {
        if (!notifBadgeCounter) return;
        if (count > 0) {
            notifBadgeCounter.innerText = count > 99 ? '99+' : count;
            notifBadgeCounter.style.display = 'inline-flex';
        } else {
            notifBadgeCounter.style.display = 'none';
        }
    }

    function getIconBgClass(type) {
        switch (type) {
            case 'TicketCreated': return 'bg-danger-subtle text-danger';
            case 'TicketAssigned': return 'bg-primary-subtle text-primary';
            case 'TicketStatusChanged': return 'bg-success-subtle text-success';
            case 'AppointmentCreated':
            case 'AppointmentUpdated': return 'bg-info-subtle text-info';
            case 'AppointmentCancelled': return 'bg-secondary-subtle text-secondary';
            case 'ChatMessage': return 'bg-danger-subtle text-danger';
            case 'RatingRequest': return 'bg-warning-subtle text-warning';
            default: return 'bg-danger-subtle text-danger';
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, "&amp;")
                   .replace(/</g, "&lt;")
                   .replace(/>/g, "&gt;")
                   .replace(/"/g, "&quot;")
                   .replace(/'/g, "&#039;");
    }

    // Initial check badge count on page load
    fetch('/Notification/GetHeaderNotifications')
        .then(res => res.json())
        .then(data => {
            if (data && data.success) {
                updateBadgeCounter(data.count);
            }
        })
        .catch(() => {});

    // 4. SignalR Realtime Client Connection
    if (typeof signalR !== 'undefined') {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl('/notificationHub')
            .withAutomaticReconnect()
            .build();

        connection.on('ReceiveNotification', function (notif) {
            console.log('Realtime notification received:', notif);

            // Play subtle sound if available or increment counter
            let currentCount = parseInt(notifBadgeCounter?.innerText || '0') || 0;
            updateBadgeCounter(currentCount + 1);

            // Toast notification popup
            if (window.Toastify || typeof showToast === 'function') {
                showToast(notif.title, 'info');
            }

            // Reload dropdown if open
            if (notifDropdownMenu && notifDropdownMenu.classList.contains('show')) {
                loadHeaderNotifications();
            }
        });

        connection.start()
            .then(() => console.log('Connected to NotificationHub SignalR'))
            .catch(err => console.warn('SignalR NotificationHub error:', err));
    }
});

// Helper: Open Chat Widget from Notification click
function triggerChatWidgetOpen() {
    const launcher = document.getElementById('chatLauncher');
    const chatWindow = document.getElementById('chatWindow');
    if (launcher && chatWindow) {
        chatWindow.classList.add('active');
    }
}
