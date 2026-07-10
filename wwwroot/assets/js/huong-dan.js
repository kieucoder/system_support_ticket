/**
 * huong-dan.js — TechSupport Viettel
 * Logic for customer guide page: search FAQ, mock uploader, video modal player,
 * tags linking, smooth scrolls, and AOS initializations.
 */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // 1. INITIALIZE AOS ANIMATION
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100
        });
    }

    // 2. LIVE FAQ SEARCHING
    initFaqSearch();

    // 3. TAG SEARCH GOTO
    initTagLinks();

    // 4. MOCK FILE UPLOADER PROGRESS BAR
    initMockUploader();

    // 5. VIDEO PLAY MODAL HANDLER
    initVideoModal();
});

/* =============================================================
   2. FAQ ACCORDION SEARCH LOGIC
   ============================================================= */
function initFaqSearch() {
    const faqInput = document.getElementById('faqSearchInput');
    const heroInput = document.getElementById('heroSearchInput');
    const faqItems = document.querySelectorAll('.faq-accordion .accordion-item');
    const emptyState = document.getElementById('faqEmptyState');

    const filterFaqs = (query) => {
        const cleanedQuery = query.toLowerCase().trim();
        let matches = 0;

        faqItems.forEach(item => {
            const btnText = item.querySelector('.accordion-button').textContent.toLowerCase();
            const bodyText = item.querySelector('.accordion-body').textContent.toLowerCase();

            if (btnText.includes(cleanedQuery) || bodyText.includes(cleanedQuery)) {
                item.style.display = 'block';
                matches++;
            } else {
                item.style.display = 'none';
            }
        });

        if (emptyState) {
            if (matches === 0 && cleanedQuery !== '') {
                emptyState.style.display = 'block';
            } else {
                emptyState.style.display = 'none';
            }
        }
    };

    // FAQ specific input search
    if (faqInput) {
        faqInput.addEventListener('input', (e) => {
            filterFaqs(e.target.value);
        });
    }

    // Hero main input search
    if (heroInput) {
        const searchForm = heroInput.closest('form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = heroInput.value;
                
                // Populate FAQ input
                if (faqInput) faqInput.value = query;
                
                // Filter
                filterFaqs(query);

                // Scroll to FAQ section
                const faqSection = document.getElementById('section-faq');
                if (faqSection) {
                    faqSection.scrollIntoView({ behavior: 'smooth' });
                }

                showGuideToast(`🔍 Đang tìm kiếm câu hỏi cho từ khóa: "${query}"`);
            });
        }
    }
}

/* =============================================================
   3. QUICK SEARCH TAG LINK ACTIONS
   ============================================================= */
function initTagLinks() {
    const tags = document.querySelectorAll('.search-tag-link');
    const heroInput = document.getElementById('heroSearchInput');
    const faqInput = document.getElementById('faqSearchInput');

    // Mappings for scroll destinations
    const sectionMap = {
        'Cách tạo phiếu hỗ trợ': 'guide-create',
        'Cách tra cứu phiếu': 'guide-lookup',
        'Cách trao đổi với nhân viên': 'guide-chat',
        'Cách đặt lịch hỗ trợ': 'guide-appointment',
        'Cách đánh giá dịch vụ': 'guide-rating',
        'Cách gửi file đính kèm': 'guide-attachment'
    };

    tags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();
            const text = tag.getAttribute('data-search') || tag.textContent.trim();
            
            // Fill inputs
            if (heroInput) heroInput.value = text;
            if (faqInput) faqInput.value = text;

            // Trigger FAQ filtering
            const faqItems = document.querySelectorAll('.faq-accordion .accordion-item');
            const emptyState = document.getElementById('faqEmptyState');
            let matches = 0;
            faqItems.forEach(item => {
                const btnText = item.querySelector('.accordion-button').textContent.toLowerCase();
                const bodyText = item.querySelector('.accordion-body').textContent.toLowerCase();
                if (btnText.includes(text.toLowerCase()) || bodyText.includes(text.toLowerCase())) {
                    item.style.display = 'block';
                    matches++;
                } else {
                    item.style.display = 'none';
                }
            });
            if (emptyState) emptyState.style.display = matches === 0 ? 'block' : 'none';

            // Scroll to detail block if mapped
            const targetId = sectionMap[text];
            if (targetId) {
                const element = document.getElementById(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }

            showGuideToast(`💡 Đã tự động lọc: "${text}"`);
        });
    });

    // Smooth scroll for category cards
    document.querySelectorAll('.category-card-link').forEach(cardLink => {
        cardLink.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').replace('#', '');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });
}

/* =============================================================
   4. MOCK FILE UPLOADER PROGRESS BAR
   ============================================================= */
function initMockUploader() {
    const uploadArea = document.getElementById('guideUploadArea');
    const progressBar = document.getElementById('guideProgressBar');
    const progressBarFill = document.getElementById('guideProgressBarFill');
    const statusText = document.getElementById('guideUploadStatus');

    if (!uploadArea) return;

    uploadArea.addEventListener('click', () => {
        // Reset state
        if (progressBar) progressBar.style.display = 'block';
        if (progressBarFill) progressBarFill.style.width = '0%';
        if (statusText) statusText.innerHTML = '<span class="text-muted"><i class="fa-solid fa-spinner fa-spin me-2"></i>Đang chuẩn bị tải lên tệp tin mẫu...</span>';

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 15) + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                if (progressBarFill) progressBarFill.style.width = '100%';
                if (statusText) statusText.innerHTML = '<span class="text-success fw-bold"><i class="fa-solid fa-circle-check me-2"></i>Tải lên thành công! File: TechSupport_Viettel_Screenshot.PNG (2.4 MB)</span>';
                
                showGuideToast('✅ Tải tệp tin đính kèm mẫu lên thành công!');
                
                // Hide progress bar slowly
                setTimeout(() => {
                    if (progressBar) progressBar.style.display = 'none';
                }, 1500);
            } else {
                if (progressBarFill) progressBarFill.style.width = `${progress}%`;
                if (statusText) statusText.innerHTML = `<span class="text-primary"><i class="fa-solid fa-cloud-arrow-up me-2 fa-bounce"></i>Đang tải lên: TechSupport_Viettel_Screenshot.PNG (${progress}%)</span>`;
            }
        }, 120);
    });

    // Drag over styling
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        uploadArea.click(); // Trigger click animation
    });
}

/* =============================================================
   5. VIDEO PLAY MODAL ACTION
   ============================================================= */
function initVideoModal() {
    const playButtons = document.querySelectorAll('.video-play-btn');
    
    // Create dynamically the modal DOM if not exists to stay clean
    let videoModalEl = document.getElementById('guideVideoModal');
    if (!videoModalEl) {
        videoModalEl = document.createElement('div');
        videoModalEl.id = 'guideVideoModal';
        videoModalEl.className = 'modal fade';
        videoModalEl.tabIndex = -1;
        videoModalEl.setAttribute('aria-hidden', 'true');
        videoModalEl.innerHTML = `
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content bg-dark border-0 overflow-hidden" style="border-radius: 16px;">
                    <div class="modal-header border-0 text-white p-3 d-flex justify-content-between align-items-center">
                        <h6 class="modal-title fw-bold m-0" id="videoModalTitle">Video Hướng Dẫn Kỹ Thuật</h6>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-0">
                        <div class="ratio ratio-16x9">
                            <iframe id="guideVideoIframe" src="" title="Video Player" allowfullscreen></iframe>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(videoModalEl);
    }

    const modalInstance = new bootstrap.Modal(videoModalEl);
    const iframe = document.getElementById('guideVideoIframe');
    const modalTitle = document.getElementById('videoModalTitle');

    // Video Youtube IDs matching mock sections
    const videoUrls = {
        'create': 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1', // Placeholder Rick Roll or any demo video
        'lookup': 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
        'chat': 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
        'rating': 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1'
    };

    playButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-video-type') || 'create';
            const title = btn.closest('.video-guide-card').querySelector('.video-card-title').textContent;

            if (iframe) {
                iframe.src = videoUrls[type] || videoUrls['create'];
            }
            if (modalTitle) {
                modalTitle.textContent = title;
            }

            modalInstance.show();
        });
    });

    // Clear iframe src when modal is closed to stop playing video sound
    videoModalEl.addEventListener('hidden.bs.modal', () => {
        if (iframe) iframe.src = '';
    });
}

/* =============================================================
   6. CUSTOM TOAST NOTIFICATIONS HELPER
   ============================================================= */
function showGuideToast(message) {
    let container = document.getElementById('guideToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'guideToastContainer';
        container.style.position = 'fixed';
        container.style.bottom = '24px';
        container.style.right = '24px';
        container.style.zIndex = '1090';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'glass-panel p-3 d-flex align-items-center gap-3 animate__animated animate__fadeInUp';
    toast.style.borderRadius = '12px';
    toast.style.minWidth = '280px';
    toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.08)';
    toast.style.borderLeft = '4px solid #ee0033';
    toast.style.backgroundColor = '#ffffff';
    toast.style.transition = 'all 0.4s ease';

    toast.innerHTML = `
        <i class="fa-solid fa-circle-info text-danger fs-5"></i>
        <div class="small fw-semibold text-dark-emphasis">${message}</div>
    `;

    container.appendChild(toast);

    // Entrance and removal
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 400);
    }, 3200);
}
