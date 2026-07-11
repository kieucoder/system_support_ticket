/**
 * sidebar-loader.js — TechSupport Viettel Admin
 * Tái sử dụng chung cho tất cả trang admin trong thư mục /staff/
 *
 * Chức năng:
 *  1. fetch('../components/sidebar-admin.html') → inject vào #sidebarMount
 *  2. Hỗ trợ chạy offline/file:// (không bị CORS Chrome chặn) bằng cách tự động fallback sang string HTML
 *  3. Tự động thêm class "active" vào sidebar-item khớp với tên file hiện tại
 *  4. Gọi window.initAdminSidebar() sau khi inject (nếu tồn tại)
 *
 * Cách dùng: Thêm <script src="../assets/js/staff/sidebar-loader.js"></script>
 *            SAU tất cả script CDN và dashboard.js
 */
(function () {
    'use strict';

    // HTML fallback của sidebar khi chạy trực tiếp file:// mà bị lỗi CORS Chrome
    var SIDEBAR_HTML_FALLBACK = 
        '<aside class="admin-sidebar offcanvas-lg offcanvas-start" tabindex="-1" id="adminSidebar" aria-labelledby="adminSidebarLabel">' +
        '    <!-- Offcanvas Header (Mobile/Tablet only) -->' +
        '    <div class="offcanvas-header d-lg-none border-bottom py-3 px-4" style="background-color: #111827; border-bottom-color: rgba(255,255,255,0.07) !important;">' +
        '        <div class="d-flex align-items-center">' +
        '            <i class="fa-solid fa-headset me-2 fs-4" style="color: #EE0033;"></i>' +
        '            <div>' +
        '                <span class="fw-bold fs-6" style="color: #FFFFFF;" id="adminSidebarLabel">TechSupport</span>' +
        '                <small class="d-block" style="font-size: 0.65rem; font-weight: 500; letter-spacing: 0.5px; color: rgba(255,255,255,0.5);">TechSupport Staff</small>' +
        '            </div>' +
        '        </div>' +
        '        <button type="button" class="btn-close btn-close-white text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>' +
        '    </div>' +
        '    <!-- Sidebar Brand Logo (Desktop only) -->' +
        '    <a href="dashboard.html" class="sidebar-brand d-none d-lg-flex">' +
        '        <i class="fa-solid fa-headset"></i>' +
        '        <span>TechSupport <small style="display:block;font-size:0.65rem;font-weight:400;letter-spacing:1px;color:rgba(255,255,255,0.5);">VIETTEL ADMIN</small></span>' +
        '    </a>' +
        '    <!-- Sidebar Menu -->' +
        '    <nav aria-label="Primary navigation" class="flex-grow-1 overflow-y-auto">' +
        '        <ul class="sidebar-menu">' +
        '            <li class="sidebar-section-label">TỔNG QUAN</li>' +
        '            <li class="sidebar-item" data-page="dashboard.html">' +
        '                <a href="dashboard.html" class="sidebar-link">' +
        '                    <i class="fa-solid fa-gauge-high"></i>' +
        '                    <span>Dashboard</span>' +
        '                </a>' +
        '            </li>' +
        '            <li class="sidebar-section-label">QUẢN LÝ</li>' +
        '            <li class="sidebar-item" data-page="staff-ticket-management.html">' +
        '                <a href="staff-ticket-management.html" class="sidebar-link">' +
        '                    <i class="fa-solid fa-ticket"></i>' +
        '                    <span>Phiếu Hỗ Trợ</span>' +
        '                </a>' +
        '            </li>' +
        '            <li class="sidebar-item" data-page="staff-chat.html">' +
        '                <a href="staff-chat.html" class="sidebar-link">' +
        '                    <i class="fa-solid fa-comments"></i>' +
        '                    <span>Chat Hỗ Trợ</span>' +
        '                </a>' +
        '            </li>' +
        '            <li class="sidebar-item" data-page="admin-appointments.html">' +
        '                <a href="admin-appointments.html" class="sidebar-link">' +
        '                    <i class="fa-solid fa-calendar-days"></i>' +
        '                    <span>Lịch Hẹn Kỹ Thuật</span>' +
        '                </a>' +
        '            </li>' +
        '            <li class="sidebar-item" data-page="admin-categories.html">' +
        '                <a href="admin-categories.html" class="sidebar-link">' +
        '                    <i class="fa-solid fa-layer-group"></i>' +
        '                    <span>Danh Mục Sự Cố</span>' +
        '                </a>' +
        '            </li>' +
        '            <li class="sidebar-item" data-page="admin-services.html">' +
        '                <a href="admin-services.html" class="sidebar-link">' +
        '                    <i class="fa-solid fa-network-wired"></i>' +
        '                    <span>Dịch Vụ Kỹ Thuật</span>' +
        '                </a>' +
        '            </li>' +
        '            <li class="sidebar-item" data-page="admin-customers.html">' +
        '                <a href="admin-customers.html" class="sidebar-link">' +
        '                    <i class="fa-solid fa-users"></i>' +
        '                    <span>Khách Hàng</span>' +
        '                </a>' +
        '            </li>' +
        '            <li class="sidebar-item" data-page="staff.html">' +
        '                <a href="staff.html" class="sidebar-link">' +
        '                    <i class="fa-solid fa-users-gear"></i>' +
        '                    <span>Nhân Viên</span>' +
        '                </a>' +
        '            </li>' +
        '            <li class="sidebar-item" data-page="staff-review-list.html">' +
        '                <a href="staff-review-list.html" class="sidebar-link">' +
        '                    <i class="fa-solid fa-star"></i>' +
        '                    <span>Đánh Giá Khách Hàng</span>' +
        '                </a>' +
        '            </li>' +
        '            <li class="sidebar-section-label">THỐNG KÊ</li>' +
        '            <li class="sidebar-item" data-page="admin-report.html">' +
        '                <a href="admin-report.html" class="sidebar-link">' +
        '                    <i class="fa-solid fa-chart-line"></i>' +
        '                    <span>Báo Cáo &amp; Thống Kê</span>' +
        '                </a>' +
        '            </li>' +
        '            <li class="sidebar-section-label">TÀI KHOẢN</li>' +
        '            <li class="sidebar-item" data-page="admin-profile.html">' +
        '                <a href="admin-profile.html" class="sidebar-link">' +
        '                    <i class="fa-solid fa-circle-user"></i>' +
        '                    <span>Thông Tin Cá Nhân</span>' +
        '                </a>' +
        '            </li>' +
        '        </ul>' +
        '    </nav>' +
        '    <!-- Sidebar Footer Logout -->' +
        '    <div class="sidebar-footer">' +
        '        <a href="../login.html" class="sidebar-link text-danger">' +
        '            <i class="fa-solid fa-right-from-bracket"></i>' +
        '            <span>Đăng Xuất</span>' +
        '        </a>' +
        '    </div>' +
        '</aside>';

    /**
     * Load sidebar-admin.html và inject vào #sidebarMount.
     */
    function loadSidebar() {
        var mount = document.getElementById('sidebarMount');
        if (!mount) return;

        // Nếu chạy trực tiếp từ file:// (CORS sẽ chặn fetch), sử dụng ngay fallback string
        if (window.location.protocol === 'file:') {
            mount.innerHTML = SIDEBAR_HTML_FALLBACK;
            highlightActiveLink();
            setupOffcanvasToggles();
            if (typeof window.initAdminSidebar === 'function') {
                window.initAdminSidebar();
            }
            return;
        }

        // Nếu chạy qua HTTP/HTTPS server, ưu tiên fetch file động
        fetch('../components/sidebar-admin.html')
            .then(function (res) {
                if (!res.ok) throw new Error('Sidebar load failed: ' + res.status);
                return res.text();
            })
            .then(function (html) {
                mount.innerHTML = html;
                highlightActiveLink();
                setupOffcanvasToggles();
                if (typeof window.initAdminSidebar === 'function') {
                    window.initAdminSidebar();
                }
            })
            .catch(function (err) {
                console.warn('[SidebarLoader] Fetch failed, falling back to static string:', err);
                mount.innerHTML = SIDEBAR_HTML_FALLBACK;
                highlightActiveLink();
                setupOffcanvasToggles();
                if (typeof window.initAdminSidebar === 'function') {
                    window.initAdminSidebar();
                }
            });
    }

    /**
     * Tự động cấu hình Offcanvas Hamburger và Page Title cho các viewport
     */
    function setupOffcanvasToggles() {
        var sidebarEl = document.getElementById('adminSidebar');
        if (!sidebarEl) return;

        // Programmatically initialize offcanvas using Bootstrap's API
        var bsOffcanvas = null;
        if (window.bootstrap && window.bootstrap.Offcanvas) {
            bsOffcanvas = new bootstrap.Offcanvas(sidebarEl);
        }

        // 1. Configure the mobile toggle button on all pages
        var toggleMobileBtn = document.getElementById('toggleMobileSidebar');
        if (toggleMobileBtn) {
            // Remove any static BS data attributes to let our JS controller handle it
            toggleMobileBtn.removeAttribute('data-bs-toggle');
            toggleMobileBtn.removeAttribute('data-bs-target');
            
            toggleMobileBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (bsOffcanvas) {
                    bsOffcanvas.show();
                } else {
                    var adminLayout = document.getElementById('adminLayout');
                    if (adminLayout) {
                        adminLayout.classList.add('sidebar-mobile-show');
                    }
                }
            });
        }

        // 2. Wire up dismiss buttons inside offcanvas programmatically
        var dismissButtons = sidebarEl.querySelectorAll('[data-bs-dismiss="offcanvas"]');
        dismissButtons.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                if (bsOffcanvas) {
                    bsOffcanvas.hide();
                } else {
                    var adminLayout = document.getElementById('adminLayout');
                    if (adminLayout) {
                        adminLayout.classList.remove('sidebar-mobile-show');
                    }
                }
            });
        });

        // 3. Make page title visible on mobile (hide only the subtitle description)
        var topbarLeft = document.querySelector('.topbar-left');
        if (topbarLeft) {
            var titleContainer = topbarLeft.querySelector('div.d-none.d-md-block');
            if (titleContainer) {
                titleContainer.classList.remove('d-none', 'd-md-block');
                titleContainer.classList.add('topbar-title-container');
                
                var pElements = titleContainer.querySelectorAll('p');
                if (pElements.length > 1) {
                    pElements[1].classList.add('d-none', 'd-md-block');
                }
            }
        }
    }

    /**
     * Tự động highlight sidebar-item khớp với tên file hiện tại.
     * Dùng thuộc tính data-page="filename.html" trên mỗi <li class="sidebar-item">.
     */
    function highlightActiveLink() {
        var pathParts = window.location.pathname.split('/');
        var currentPage = pathParts[pathParts.length - 1] || 'dashboard.html';
        
        // Hỗ trợ trường hợp chạy qua file:/// đường dẫn Windows có dấu gạch chéo ngược hoặc các ký tự lạ
        if (currentPage.indexOf('?') !== -1) {
            currentPage = currentPage.split('?')[0];
        }
        if (currentPage.indexOf('#') !== -1) {
            currentPage = currentPage.split('#')[0];
        }

        document.querySelectorAll('#sidebarMount .sidebar-item[data-page]').forEach(function (item) {
            var dataPage = item.getAttribute('data-page');
            if (dataPage === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Khởi chạy ngay khi DOM sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSidebar);
    } else {
        loadSidebar();
    }
})();
