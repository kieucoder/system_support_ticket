/* ==========================================================================
   FILE: wwwroot/assets/js/header.js
   DESCRIPTION: Pure Vanilla JavaScript logic for Header Component.
                Handles Sticky Navigation, Frontend Search Popup, User Account Dropdown,
                Mobile Slide-in Drawer, Active Menu detection, and Ripple Effects.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // -------------------------------------------------------------
    // 1. STICKY HEADER ON SCROLL
    // -------------------------------------------------------------
    const mainHeader = document.getElementById('mainHeader');
    if (mainHeader) {
        const handleScroll = () => {
            if (window.scrollY > 30) {
                mainHeader.classList.add('scrolled');
            } else {
                mainHeader.classList.remove('scrolled');
            }
        };

        handleScroll(); // Initial check
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // -------------------------------------------------------------
    // 2. FRONTEND SEARCH POPUP OVERLAY
    // -------------------------------------------------------------
    const searchTriggerBtn = document.getElementById('searchTriggerBtn');
    const searchModalOverlay = document.getElementById('searchModalOverlay');
    const searchModalCloseBtn = document.getElementById('searchModalCloseBtn');
    const searchInputField = document.getElementById('searchInputField');
    const searchClearBtn = document.getElementById('searchClearBtn');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const searchTagChips = document.querySelectorAll('.search-tag-chip');

    // Searchable items for frontend filtering
    const searchDatabase = [
        { title: 'Tạo phiếu báo hỏng kỹ thuật mới', category: 'Phiếu hỗ trợ', icon: 'bi-file-earmark-plus', url: '/Ticket/TaoPhieu' },
        { title: 'Chọn danh mục dịch vụ Internet, TV, Camera', category: 'Dịch vụ', icon: 'bi-grid-fill', url: '/Ticket/ChonDMDichVu' },
        { title: 'Tra cứu trạng thái phiếu sự cố realtime', category: 'Tra cứu', icon: 'bi-search', url: '/Ticket/TraCuuPhieu' },
        { title: 'Đặt lịch hẹn kỹ thuật viên tận nhà', category: 'Lịch hẹn', icon: 'bi-calendar-check', url: '/Home/HuongDan#guide-appointment' },
        { title: 'Chat trực tiếp với kỹ thuật viên phụ trách', category: 'Live Chat', icon: 'bi-chat-dots-fill', url: '/Customers/ChatTrucTuyen' },
        { title: 'Hướng dẫn quy trình gửi ticket hỗ trợ', category: 'Hướng dẫn', icon: 'bi-book-half', url: '/Home/HuongDan' },
        { title: 'Câu hỏi thường gặp về Wifi & Modem Viettel', category: 'FAQ', icon: 'bi-patch-question-fill', url: '/Home/FAQ' },
        { title: 'Liên hệ hotline tổng đài kỹ thuật Viettel Cần Thơ', category: 'Liên hệ', icon: 'bi-telephone-fill', url: '/Home/LienHe' },
        { title: 'Quản lý phiếu hỗ trợ kỹ thuật của tôi', category: 'Tài khoản', icon: 'bi-ticket-perforated', url: '/Customers/PhieuCuaToi' },
        { title: 'Giới thiệu về hệ thống TechSupport Viettel', category: 'Thông tin', icon: 'bi-building', url: '/Home/GioiThieu' },
        { title: 'Tin tức công nghệ & thông báo bảo trì', category: 'Tin tức', icon: 'bi-newspaper', url: '/Home/TinTuc' }
    ];

    const openSearchModal = () => {
        if (!searchModalOverlay) return;
        searchModalOverlay.classList.add('active');
        searchModalOverlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            if (searchInputField) searchInputField.focus();
        }, 150);
    };

    const closeSearchModal = () => {
        if (!searchModalOverlay) return;
        searchModalOverlay.classList.remove('active');
        searchModalOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (searchInputField) searchInputField.value = '';
        if (searchClearBtn) searchClearBtn.style.display = 'none';
        if (searchResultsContainer) searchResultsContainer.innerHTML = '';
    };

    const renderSearchResults = (query) => {
        if (!searchResultsContainer) return;
        const cleanQuery = query.trim().toLowerCase();
        
        if (!cleanQuery) {
            searchResultsContainer.innerHTML = '';
            return;
        }

        const filtered = searchDatabase.filter(item => 
            item.title.toLowerCase().includes(cleanQuery) || 
            item.category.toLowerCase().includes(cleanQuery)
        );

        if (filtered.length === 0) {
            searchResultsContainer.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-emoji-frown fs-3 d-block mb-2 text-danger"></i>
                    <span>Không tìm thấy kết quả phù hợp với "${query}"</span>
                </div>
            `;
            return;
        }

        searchResultsContainer.innerHTML = filtered.map(item => `
            <a href="${item.url}" class="search-result-item">
                <div class="search-result-icon">
                    <i class="bi ${item.icon}"></i>
                </div>
                <div class="search-result-info">
                    <span class="search-result-title">${item.title}</span>
                    <span class="search-result-category">${item.category}</span>
                </div>
            </a>
        `).join('');
    };

    if (searchTriggerBtn) {
        searchTriggerBtn.addEventListener('click', openSearchModal);
    }

    if (searchModalCloseBtn) {
        searchModalCloseBtn.addEventListener('click', closeSearchModal);
    }

    if (searchModalOverlay) {
        searchModalOverlay.addEventListener('click', (e) => {
            if (e.target === searchModalOverlay) closeSearchModal();
        });
    }

    if (searchInputField) {
        searchInputField.addEventListener('input', (e) => {
            const val = e.target.value;
            if (searchClearBtn) {
                searchClearBtn.style.display = val.length > 0 ? 'block' : 'none';
            }
            renderSearchResults(val);
        });
    }

    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            if (searchInputField) {
                searchInputField.value = '';
                searchInputField.focus();
            }
            searchClearBtn.style.display = 'none';
            renderSearchResults('');
        });
    }

    searchTagChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            const tagQuery = chip.getAttribute('data-query') || chip.textContent.trim();
            if (searchInputField) {
                searchInputField.value = tagQuery;
                if (searchClearBtn) searchClearBtn.style.display = 'block';
                renderSearchResults(tagQuery);
            }
        });
    });

    // Close search modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchModalOverlay && searchModalOverlay.classList.contains('active')) {
            closeSearchModal();
        }
    });

    // -------------------------------------------------------------
    // 3. USER ACCOUNT DROPDOWN
    // -------------------------------------------------------------
    const userDropdownTrigger = document.getElementById('userDropdownTrigger');
    const userDropdownMenu = document.getElementById('userDropdownMenu');

    if (userDropdownTrigger && userDropdownMenu) {
        userDropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = userDropdownMenu.classList.contains('show');
            if (isOpen) {
                userDropdownMenu.classList.remove('show');
                userDropdownTrigger.classList.remove('active');
                userDropdownTrigger.setAttribute('aria-expanded', 'false');
            } else {
                userDropdownMenu.classList.add('show');
                userDropdownTrigger.classList.add('active');
                userDropdownTrigger.setAttribute('aria-expanded', 'true');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userDropdownTrigger.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.classList.remove('show');
                userDropdownTrigger.classList.remove('active');
                userDropdownTrigger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // -------------------------------------------------------------
    // 4. MOBILE SLIDE-IN DRAWER
    // -------------------------------------------------------------
    const mobileDrawerTrigger = document.getElementById('mobileDrawerTrigger');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const drawerBackdrop = document.getElementById('drawerBackdrop');
    const drawerCloseBtn = document.getElementById('drawerCloseBtn');
    const drawerInfoToggle = document.getElementById('drawerInfoToggle');
    const drawerInfoSubmenu = document.getElementById('drawerInfoSubmenu');

    const openMobileDrawer = () => {
        if (mobileDrawer) mobileDrawer.classList.add('active');
        if (drawerBackdrop) drawerBackdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeMobileDrawer = () => {
        if (mobileDrawer) mobileDrawer.classList.remove('active');
        if (drawerBackdrop) drawerBackdrop.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (mobileDrawerTrigger) mobileDrawerTrigger.addEventListener('click', openMobileDrawer);
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeMobileDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeMobileDrawer);

    const drawerSupportToggle = document.getElementById('drawerSupportToggle');
    const drawerSupportSubmenu = document.getElementById('drawerSupportSubmenu');

    if (drawerSupportToggle && drawerSupportSubmenu) {
        drawerSupportToggle.addEventListener('click', () => {
            const isOpen = drawerSupportSubmenu.classList.contains('show');
            if (isOpen) {
                drawerSupportSubmenu.classList.remove('show');
                drawerSupportToggle.classList.remove('open');
            } else {
                drawerSupportSubmenu.classList.add('show');
                drawerSupportToggle.classList.add('open');
            }
        });
    }

    if (drawerInfoToggle && drawerInfoSubmenu) {
        drawerInfoToggle.addEventListener('click', () => {
            const isOpen = drawerInfoSubmenu.classList.contains('show');
            if (isOpen) {
                drawerInfoSubmenu.classList.remove('show');
                drawerInfoToggle.classList.remove('open');
            } else {
                drawerInfoSubmenu.classList.add('show');
                drawerInfoToggle.classList.add('open');
            }
        });
    }

    // -------------------------------------------------------------
    // 5. ACTIVE MENU LINK HIGHLIGHTING
    // -------------------------------------------------------------
    const currentPath = window.location.pathname.toLowerCase();
    const navLinks = document.querySelectorAll('.nav-link, .drawer-menu-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '#' && href !== 'javascript:void(0)') {
            const cleanHref = href.toLowerCase();
            if (currentPath === cleanHref || (cleanHref !== '/' && currentPath.includes(cleanHref))) {
                link.classList.add('active');
            }
        }
    });

    console.log('Header component scripts loaded successfully.');
});
