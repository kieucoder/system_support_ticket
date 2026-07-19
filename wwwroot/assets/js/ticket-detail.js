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

    // ==================== 2. STATE INTERFACE ====================
    // Extract current state directly from server-rendered DOM elements
    const getTicketState = () => {
        const statusElement = document.getElementById('statsStatusText');
        const codeElement = document.getElementById('sideTicketCode');
        return {
            status: statusElement ? statusElement.textContent.trim() : "processing",
            code: codeElement ? codeElement.textContent.trim() : "PT000123"
        };
    };

    const ticket = getTicketState();

    // ==================== 3. SCROLL SYNCHRONIZATION ====================
    const syncChatScroll = () => {
        const chatContainer = document.getElementById('chatMessagesContainer');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    };
    
    // Initial scroll sync on load
    syncChatScroll();

    // ==================== 4. TAB SWAPPING REGISTRY ====================
    const tabLinks = document.querySelectorAll('.tab-nav-link');
    const tabPanels = document.querySelectorAll('.tab-content-panel');

    tabLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetPanelId = this.getAttribute('data-tab-target');

            // ===== REVIEW TAB GUARD =====
            // If user clicks the Review tab, check ticket completion status first
            if (targetPanelId === 'tabPanelReview') {
                if (ticket.status !== 'completed' && ticket.status !== 'Hoàn thành' && ticket.status !== 'DaHoanThanh') {
                    showToast(
                        `⚠️ Phiếu chưa hoàn thành! Chức năng đánh giá chỉ khả dụng sau khi phiếu được xử lý xong. Trạng thái hiện tại: <strong>${ticket.status}</strong>`,
                        'warning'
                    );
                    return; // Block tab switch
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
                setTimeout(syncChatScroll, 50);
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

    // ==================== 5. CHAT CONTROLLER INTERACTION ====================
    const chatMessageTextarea = document.getElementById('chatMessageTextarea');
    const chatForm = document.getElementById('chatForm');

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

        // Enter key submits message (unless Shift+Enter is pressed)
        chatMessageTextarea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (chatForm) {
                    chatForm.dispatchEvent(new Event('submit'));
                }
            }
        });
    }

    // ==================== 6. STAR RATINGS & SERVICE REVIEW FORM ====================
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
                        icon.className = 'fa-solid fa-star';
                    }
                } else {
                    star.classList.remove('selected');
                    if (icon) {
                        icon.className = 'fa-regular fa-star';
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

    // Review Form Validation before submit
    const reviewForm = document.getElementById('ticketReviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            const quality = parseInt(document.getElementById('ratingValueQuality').value, 10);
            const attitude = parseInt(document.getElementById('ratingValueAttitude').value, 10);
            const speed = parseInt(document.getElementById('ratingValueSpeed').value, 10);

            if (quality === 0 || attitude === 0 || speed === 0) {
                e.preventDefault();
                showToast('⚠️ Vui lòng hoàn thành đánh giá sao cho cả 3 tiêu chí nhé!', 'warning');
            }
        });
    }

    // ==================== 7. IMAGE LIGHTBOX MODAL ====================
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImagePreview = document.getElementById('lightboxImagePreview');
    const lightboxPdfPreview = document.getElementById('lightboxPdfPreview');
    const lightboxModalTitle = document.getElementById('lightboxModalTitle');
    const pdfFileName = document.getElementById('pdfFileName');
    const modalBackdropOverlay = document.getElementById('modalBackdropOverlay');
    const btnDownloadPdfModal = document.getElementById('btnDownloadPdfModal');

    const openLightbox = (fileUrl, fileName, fileType) => {
        if (!lightboxModal || !modalBackdropOverlay) return;

        if (lightboxModalTitle) {
            lightboxModalTitle.innerHTML = `<i class="bi ${fileType === 'image' ? 'bi-file-earmark-image' : 'bi-file-earmark-pdf'} text-danger me-2"></i> Xem: ${fileName}`;
        }

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
                    btnDownloadPdfModal.setAttribute('onclick', `window.open('${fileUrl}', '_blank')`);
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

    // ==================== 8. MOBILE SIDEBAR DRAWER CLONER & TOGGLE ====================
    const btnToggleMobileSidebar = document.getElementById('btnToggleMobileSidebar');
    const mobileSidebarDrawer = document.getElementById('mobileSidebarDrawer');
    const mobileSidebarClose = document.getElementById('mobileSidebarClose');
    const mobileSidebarBody = document.getElementById('mobileSidebarBody');

    if (btnToggleMobileSidebar && mobileSidebarDrawer && mobileSidebarBody && modalBackdropOverlay) {
        
        // Open drawer
        btnToggleMobileSidebar.addEventListener('click', () => {
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
        if (e.target.closest('#mobileSidebarBody #btnChatAgentShortcut')) {
            e.preventDefault();
            if (mobileSidebarDrawer) mobileSidebarDrawer.classList.remove('show');
            if (modalBackdropOverlay) modalBackdropOverlay.classList.remove('show');
            
            const chatTabLink = document.getElementById('tabBtnChat');
            if (chatTabLink) chatTabLink.click();
        }
    });

    // ==================== 9. ACTIVE TAB QUERY PRESERVATION ====================
    const preserveTabState = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const activeTab = urlParams.get('tab');
        if (activeTab) {
            const tabBtn = document.getElementById(`tabBtn${activeTab}`);
            if (tabBtn) {
                tabBtn.click();
            }
        }
    };

    preserveTabState();
});
