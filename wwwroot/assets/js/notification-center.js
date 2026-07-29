/**
 * FILE: wwwroot/assets/js/notification-center.js
 * AUTHOR: Antigravity
 * DESCRIPTION: Global Realtime SignalR Notification Center & Toast System.
 *              Handles 🔔 Notification Center dropdown, unread count badge,
 *              dynamic realtime status updates without F5, and Viettel toast alerts.
 */

(function () {
    const STORAGE_KEY = "techsupport_notifications_v1";

    // Initial State
    let notifications = [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) notifications = JSON.parse(stored);
    } catch (e) {
        notifications = [];
    }

    // Default sample data if empty to showcase feature nicely as requested
    if (!notifications || notifications.length === 0) {
        const now = new Date();
        const formatT = (minusMins) => {
            const d = new Date(now.getTime() - minusMins * 60000);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        };

        notifications = [
            {
                id: "notif-3",
                title: "Lịch đổi sang 15:00",
                message: "Kỹ thuật viên đã xin phép cập nhật lại khung giờ hỗ trợ.",
                time: formatT(5),
                isRead: false,
                type: "AppointmentRescheduled",
                icon: "bi-calendar-event-fill text-warning"
            },
            {
                id: "notif-2",
                title: "Kỹ thuật viên đã được phân công",
                message: "KTV Nguyễn Văn A (SĐT: 0901234567) phụ trách hỗ trợ.",
                time: formatT(10),
                isRead: false,
                type: "StaffAssigned",
                icon: "bi-person-check-fill text-primary"
            },
            {
                id: "notif-1",
                title: "Lịch đã xác nhận",
                message: "Yêu cầu lịch hẹn hỗ trợ kỹ thuật của bạn đã được xác nhận thành công.",
                time: formatT(15),
                isRead: true,
                type: "AppointmentConfirmed",
                icon: "bi-check-circle-fill text-success"
            }
        ];
        saveNotifications();
    }

    function saveNotifications() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 30)));
        } catch (e) { }
    }

    function getUnreadCount() {
        return notifications.filter(n => !n.isRead).length;
    }

    // DOM Elements
    document.addEventListener("DOMContentLoaded", () => {
        initUI();
        initSignalR();
    });

    function initUI() {
        renderDropdownList();
        updateBadgeCount();

        // Bind Bell Toggle Dropdown
        const bellTrigger = document.getElementById("notifBellTrigger");
        const dropdownMenu = document.getElementById("notifDropdownMenu");
        const markAllReadBtn = document.getElementById("notifMarkAllRead");

        if (bellTrigger && dropdownMenu) {
            bellTrigger.addEventListener("click", (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle("active");
            });

            document.addEventListener("click", (e) => {
                if (!dropdownMenu.contains(e.target) && !bellTrigger.contains(e.target)) {
                    dropdownMenu.classList.remove("active");
                }
            });
        }

        if (markAllReadBtn) {
            markAllReadBtn.addEventListener("click", () => {
                notifications.forEach(n => n.isRead = true);
                saveNotifications();
                renderDropdownList();
                updateBadgeCount();
            });
        }
    }

    function updateBadgeCount() {
        const badge = document.getElementById("notifBadgeCounter");
        const count = getUnreadCount();
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 9 ? "9+" : count;
                badge.style.display = "flex";
                badge.classList.add("pulse-anim");
            } else {
                badge.style.display = "none";
                badge.classList.remove("pulse-anim");
            }
        }
    }

    function renderDropdownList() {
        const listContainer = document.getElementById("notifListContainer");
        if (!listContainer) return;

        if (!notifications || notifications.length === 0) {
            listContainer.innerHTML = `
                <div class="notif-empty text-center py-4 text-muted">
                    <i class="bi bi-bell-slash fs-2 d-block mb-2 text-secondary opacity-50"></i>
                    <span class="fs-8">Bạn chưa có thông báo mới nào</span>
                </div>
            `;
            return;
        }

        let html = "";
        notifications.forEach((item, index) => {
            const iconClass = item.icon || "bi-info-circle-fill text-primary";
            const unreadDot = item.isRead ? "" : `<span class="notif-unread-dot"></span>`;
            const bgUnread = item.isRead ? "" : "bg-light-soft";

            html += `
                <div class="notif-item ${bgUnread} ${item.isRead ? 'read' : 'unread'}" data-index="${index}" onclick="window.handleNotifClick(${index})">
                    <div class="notif-icon-box">
                        <i class="bi ${iconClass}"></i>
                    </div>
                    <div class="notif-content flex-grow-1">
                        <div class="d-flex align-items-center justify-content-between mb-1">
                            <span class="notif-title fw-bold text-dark fs-8">${item.title}</span>
                            <span class="notif-time text-muted font-mono fs-9">${item.time}</span>
                        </div>
                        <p class="notif-desc text-secondary fs-8 m-0 line-clamp-2">${item.message}</p>
                    </div>
                    ${unreadDot}
                </div>
            `;
        });

        listContainer.innerHTML = html;
    }

    window.handleNotifClick = function (index) {
        if (notifications[index]) {
            notifications[index].isRead = true;
            saveNotifications();
            renderDropdownList();
            updateBadgeCount();
        }
    };

    // Add new notification dynamically
    function addNotification(notifData) {
        const now = new Date();
        const timeStr = notifData.time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        let icon = "bi-bell-fill text-danger";
        if (notifData.status === "DaXacNhan") icon = "bi-check-circle-fill text-success";
        else if (notifData.type === "AppointmentRescheduled") icon = "bi-calendar-event-fill text-warning";
        else if (notifData.status === "DaHuy") icon = "bi-x-circle-fill text-danger";

        const newNotif = {
            id: "notif-" + Date.now(),
            title: notifData.title || notifData.statusText || "Lịch đã được cập nhật",
            message: notifData.message || "Lịch hẹn của bạn vừa có biến động mới.",
            time: timeStr,
            isRead: false,
            type: notifData.type || "General",
            icon: icon,
            ktvName: notifData.ktvName,
            ktvPhone: notifData.ktvPhone
        };

        notifications.unshift(newNotif);
        saveNotifications();
        renderDropdownList();
        updateBadgeCount();

        // Show Toast Notification
        showToastNotification(newNotif);

        // Update Page UI Realtime without F5!
        updatePageUiRealtime(notifData);
    }

    // Modern Viettel Toast Alert Notification
    function showToastNotification(notif) {
        let container = document.getElementById("viettelToastContainer");
        if (!container) {
            container = document.createElement("div");
            container.id = "viettelToastContainer";
            container.className = "viettel-toast-container";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = "viettel-toast-card slide-in-right";
        toast.innerHTML = `
            <div class="toast-card-icon">
                <i class="bi ${notif.icon}"></i>
            </div>
            <div class="toast-card-body">
                <div class="toast-card-header">
                    <strong class="toast-card-title">${notif.title}</strong>
                    <span class="toast-card-time">${notif.time}</span>
                </div>
                <div class="toast-card-text">${notif.message}</div>
                ${notif.ktvName ? `<div class="toast-card-ktv mt-1"><i class="bi bi-person-fill text-danger me-1"></i> KTV: <strong>${notif.ktvName}</strong> ${notif.ktvPhone ? `(SĐT: ${notif.ktvPhone})` : ''}</div>` : ''}
            </div>
            <button type="button" class="toast-card-close" onclick="this.parentElement.remove()"><i class="bi bi-x-lg"></i></button>
        `;

        container.appendChild(toast);

        // Auto remove after 5s
        setTimeout(() => {
            if (toast && toast.parentElement) {
                toast.classList.add("fade-out");
                setTimeout(() => toast.remove(), 400);
            }
        }, 5000);
    }

    // Realtime UI Update without F5!
    function updatePageUiRealtime(data) {
        if (!data) return;

        // 1. Update TaoLichHen.cshtml UI elements
        const displayTrangThaiPhieu = document.getElementById('displayTrangThaiPhieu');
        const displayTenNhanVien = document.getElementById('displayTenNhanVien');
        const displaySoDienThoaiNV = document.getElementById('displaySoDienThoaiNV');

        if (data.status === "DaXacNhan") {
            if (displayTrangThaiPhieu) {
                displayTrangThaiPhieu.className = 'apt-status-badge badge-success bg-success text-white';
                displayTrangThaiPhieu.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Đã xác nhận`;
            }
            if (displayTenNhanVien) {
                displayTenNhanVien.className = 'info-value text-success font-weight-bold d-block';
                displayTenNhanVien.innerHTML = `<i class="bi bi-person-check-fill me-1"></i> ${data.ktvName || 'Kỹ thuật viên Viettel'}`;
            }
            if (displaySoDienThoaiNV) {
                displaySoDienThoaiNV.className = 'small mt-1 text-secondary';
                displaySoDienThoaiNV.innerHTML = `<i class="bi bi-telephone-fill text-danger me-1"></i> SĐT: <a href="tel:${data.ktvPhone || ''}" class="text-danger fw-bold">${data.ktvPhone || '--'}</a>`;
            }
        } else if (data.status === "DaHuy") {
            if (displayTrangThaiPhieu) {
                displayTrangThaiPhieu.className = 'apt-status-badge badge-danger bg-danger text-white';
                displayTrangThaiPhieu.innerHTML = `<i class="bi bi-x-circle-fill me-1"></i> Đã hủy`;
            }
        }

        // 2. Update any status badges across other customer pages (e.g. PhieuCuaToi)
        if (data.maPhieu) {
            const ticketBadges = document.querySelectorAll(`[data-ma-phieu="${data.maPhieu}"] .badge, .ticket-badge-${data.maPhieu}`);
            ticketBadges.forEach(badge => {
                if (data.status === "DaXacNhan") {
                    badge.className = 'badge bg-success px-3 py-2';
                    badge.textContent = 'Đã xác nhận';
                }
            });
        }
    }

    // SignalR Initialization
    function initSignalR() {
        if (typeof signalR === "undefined") return;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl("/liveSupportHub")
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .build();

        connection.on("Notification", (roomOrUserGroup, data) => {
            console.log("Realtime SignalR Notification Received:", roomOrUserGroup, data);
            if (data) {
                addNotification(data);
            }
        });

        connection.start().then(() => {
            console.log("Global Realtime Notification Hub connected.");
        }).catch(err => {
            console.warn("Notification SignalR Hub start warning:", err);
        });
    }
})();
