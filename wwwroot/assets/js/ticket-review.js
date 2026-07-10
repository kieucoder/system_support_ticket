/* -------------------------------------------------------------
 * FILE: assets/js/ticket-review.js
 * AUTHOR: Antigravity
 * DESCRIPTION: Client-side interactive script for ticket-review page.
 *              Manages star ratings, realtime score calculations, upload tables,
 *              validation, toast messages, lightbox zoom, and demo scenarios.
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {

    // ==================== DOM ELEMENTS SELECTORS ====================
    // Cards & Panels
    const cardForm = document.getElementById('review-form-card');
    const cardSuccess = document.getElementById('success-view-card');
    const cardEvaluated = document.getElementById('evaluated-view-card');
    const cardAdminResponse = document.getElementById('admin-response-card');

    // Form Interactions
    const formReview = document.getElementById('customer-review-form');
    const textComments = document.getElementById('reviewComments');
    const elCharCount = document.getElementById('char-count');
    const elDragDropArea = document.getElementById('drag-drop-area');
    const fileInputField = document.getElementById('file-input-field');
    
    // File upload elements
    const elPreviewsWrapper = document.getElementById('file-previews-wrapper');
    const elPreviewsContainer = document.getElementById('previews-container');
    const elSelectedFilesTableWrapper = document.getElementById('selected-files-table-wrapper');
    const elSelectedFilesTableBody = document.getElementById('selected-files-table-body');

    // Realtime score element
    const elFormRealtimeStars = document.getElementById('form-realtime-stars');
    const elFormRealtimeScoreText = document.getElementById('form-realtime-score-text');

    // Success view elements
    const elAvgScoreDisplay = document.getElementById('avg-score-display');
    const elAvgStarsContainer = document.getElementById('avg-stars-container');

    // Evaluated display elements
    const elEvalGalleryItems = document.querySelectorAll('.eval-gallery-item');

    // Admin Reply views
    const elAdminReplyContentBox = document.getElementById('admin-reply-content-box');
    const elAdminReplyEmptyBox = document.getElementById('admin-reply-empty-box');

    // Lightbox modal elements
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImgElement = document.getElementById('lightbox-img-element');
    const lightboxCaptionText = document.getElementById('lightbox-caption-text');
    const lightboxCloseTrigger = document.getElementById('lightbox-close-trigger');

    // Toast alert elements
    const toastAlert = document.getElementById('toast-alert');
    const toastMessageText = document.getElementById('toast-message-text');
    const toastIcon = document.getElementById('toast-icon');

    // Demo control panels
    const demoController = document.getElementById('demo-controller');
    const demoToggleTrigger = document.getElementById('demo-toggle-trigger');
    const demoButtons = document.querySelectorAll('.demo-scenario-btn');

    // Selected Files Array
    let selectedUploadedFiles = [];
    const MAX_IMAGES_COUNT = 10;
    const MAX_IMAGE_SIZE_MB = 5;
    const MAX_VIDEOS_COUNT = 2;
    const MAX_VIDEO_SIZE_MB = 50;

    const RATING_TEXTS = {
        1: "Rất Không Hài Lòng",
        2: "Không Hài Lòng",
        3: "Bình Thường",
        4: "Hài Lòng",
        5: "Rất Hài Lòng"
    };

    // ==================== INITIALIZATION ====================
    function init() {
        setupStarRatingInteractions();
        setupCharacterCounter();
        setupDragAndDrop();
        setupLightboxModal();
        setupDemoConsole();
        setupFormSubmit();
        setupStaticGalleryViewer();

        // ===== LINK BACK TO TICKET (Bind ?code= param from URL) =====
        // Read the ticket code from URL query parameter (e.g. ?code=PT000123)
        const urlParams = new URLSearchParams(window.location.search);
        const ticketCode = urlParams.get('code');

        if (ticketCode) {
            const backUrl = `ticket-detail.html?code=${encodeURIComponent(ticketCode)}`;

            // Update all "Quay Lại Chi Tiết Phiếu" buttons
            const btnBackToTicket = document.getElementById('btn-back-to-ticket');
            const btnSuccessBack = document.getElementById('btn-success-back');
            const breadcrumbTicketLink = document.getElementById('breadcrumbTicketLink');

            if (btnBackToTicket) btnBackToTicket.href = backUrl;
            if (btnSuccessBack) btnSuccessBack.href = backUrl;
            if (breadcrumbTicketLink) breadcrumbTicketLink.href = backUrl;
        }
        // =============================================================

        // Initial route: load New Ticket scenario by default
        loadScenario('new-ticket');
        
        bindRippleEffects();
    }

    // ==================== RATING INTERACTION HANDLER ====================
    function setupStarRatingInteractions() {
        const ratingGroups = document.querySelectorAll('.star-group');

        ratingGroups.forEach(group => {
            const criterion = group.getAttribute('data-criterion');
            const stars = group.querySelectorAll('.star-btn');
            const inputField = document.getElementById(`input-${criterion.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1)}`);
            const descLabel = document.getElementById(`${criterion.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1)}-desc`);
            const errorField = document.getElementById(`error-${criterion.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1)}`);

            let clickedRating = 0;

            stars.forEach((star, index) => {
                // Hover effect: enter
                star.addEventListener('mouseover', () => {
                    highlightStars(stars, index + 1, 'hovered');
                    if (descLabel) {
                        descLabel.innerText = RATING_TEXTS[index + 1];
                        descLabel.classList.add('active');
                    }
                });

                // Hover effect: leave
                star.addEventListener('mouseleave', () => {
                    removeHighlight(stars, 'hovered');
                    if (clickedRating > 0) {
                        highlightStars(stars, clickedRating, 'selected');
                        if (descLabel) {
                            descLabel.innerText = RATING_TEXTS[clickedRating];
                            descLabel.classList.add('active');
                        }
                    } else {
                        if (descLabel) {
                            descLabel.innerText = "Đang chờ chọn...";
                            descLabel.classList.remove('active');
                        }
                    }
                });

                // Click handler: select rating
                star.addEventListener('click', (e) => {
                    e.preventDefault();
                    clickedRating = index + 1;
                    inputField.value = clickedRating;
                    highlightStars(stars, clickedRating, 'selected');
                    
                    // Clear error validation border if present
                    const ratingGroupContainer = group.closest('.rating-group');
                    if (ratingGroupContainer) {
                        ratingGroupContainer.classList.remove('is-invalid');
                    }
                    if (errorField) {
                        errorField.innerText = "";
                        errorField.style.display = "none";
                    }

                    if (descLabel) {
                        descLabel.innerText = RATING_TEXTS[clickedRating];
                        descLabel.classList.add('active');
                    }

                    // Calculate average score realtime
                    updateRealtimeScore();

                    showToast("success", `Đã chọn ${clickedRating} sao cho ${criterion === 'ChatLuongDichVu' ? 'Chất lượng dịch vụ' : criterion === 'ThaiDoNhanVien' ? 'Thái độ nhân viên' : 'Tốc độ xử lý'}.`);
                });
            });
        });
    }

    function highlightStars(starsArray, count, className) {
        starsArray.forEach((star, index) => {
            const starIcon = star.querySelector('i');
            if (index < count) {
                star.classList.add(className);
                starIcon.className = "bi bi-star-fill";
            } else {
                if (className === 'selected') {
                    star.classList.remove(className);
                    starIcon.className = "bi bi-star";
                }
            }
        });
    }

    function removeHighlight(starsArray, className) {
        starsArray.forEach((star) => {
            star.classList.remove(className);
            // Revert back to selected stars state icons
            const isSelected = star.classList.contains('selected');
            const starIcon = star.querySelector('i');
            if (!isSelected) {
                starIcon.className = "bi bi-star";
            } else {
                starIcon.className = "bi bi-star-fill";
            }
        });
    }

    // ==================== REALTIME AVERAGE SCORE CALCULATOR ====================
    function updateRealtimeScore() {
        const service = parseInt(document.getElementById('input-service-quality').value) || 0;
        const staff = parseInt(document.getElementById('input-staff-attitude').value) || 0;
        const speed = parseInt(document.getElementById('input-processing-speed').value) || 0;
        
        let validScores = [];
        if (service > 0) validScores.push(service);
        if (staff > 0) validScores.push(staff);
        if (speed > 0) validScores.push(speed);
        
        let average = 0;
        if (validScores.length > 0) {
            const sum = validScores.reduce((a, b) => a + b, 0);
            average = (sum / 3).toFixed(1); // Calculate based on 3 database criteria
        }
        
        // Update text display
        elFormRealtimeScoreText.innerText = `${average} / 5`;
        
        // Render stars in realtime output
        elFormRealtimeStars.innerHTML = '';
        const score = parseFloat(average);
        const fullStars = Math.floor(score);
        const hasHalfStar = (score - fullStars) >= 0.3;
        
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('i');
            if (i <= fullStars) {
                star.className = "bi bi-star-fill mx-1";
            } else if (i === fullStars + 1 && hasHalfStar) {
                star.className = "bi bi-star-half mx-1";
            } else {
                star.className = "bi bi-star mx-1";
            }
            elFormRealtimeStars.appendChild(star);
        }
    }

    // ==================== CHARACTER COUNTER ====================
    function setupCharacterCounter() {
        textComments.addEventListener('input', () => {
            const currentLength = textComments.value.length;
            elCharCount.innerText = currentLength;
            
            if (currentLength >= 900) {
                elCharCount.className = "char-counter text-danger font-semibold";
            } else if (currentLength >= 700) {
                elCharCount.className = "char-counter text-warning font-semibold";
            } else {
                elCharCount.className = "char-counter text-muted";
            }
        });
    }

    // ==================== DRAG & DROP FILE UPLOAD ====================
    function setupDragAndDrop() {
        // Trigger file input dialog click
        elDragDropArea.addEventListener('click', () => {
            fileInputField.click();
        });

        fileInputField.addEventListener('change', (e) => {
            handleSelectedFiles(e.target.files);
            fileInputField.value = ''; // Reset input selection
        });

        // Dragover/leave visual animations
        ['dragenter', 'dragover'].forEach(eventName => {
            elDragDropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                elDragDropArea.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            elDragDropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                elDragDropArea.classList.remove('dragover');
            }, false);
        });

        elDragDropArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleSelectedFiles(files);
        }, false);
    }

    function handleSelectedFiles(files) {
        const fileList = Array.from(files);
        
        let errors = [];
        let addedImages = 0;
        let addedVideos = 0;

        // Count current file types
        const currentImages = selectedUploadedFiles.filter(f => f.file.type.startsWith('image/')).length;
        const currentVideos = selectedUploadedFiles.filter(f => f.file.type.startsWith('video/')).length;

        fileList.forEach(file => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            if (!isImage && !isVideo) {
                errors.push(`Tệp "${file.name}" không hợp lệ. Chỉ hỗ trợ hình ảnh và video.`);
                return;
            }

            if (isImage) {
                // Check format
                const allowedImageExts = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowedImageExts.includes(file.type)) {
                    errors.push(`Ảnh "${file.name}" sai định dạng (chỉ nhận JPG, JPEG, PNG, WEBP).`);
                    return;
                }

                // Check size (5MB)
                const fileSizeMB = file.size / (1024 * 1024);
                if (fileSizeMB > MAX_IMAGE_SIZE_MB) {
                    errors.push(`Ảnh "${file.name}" vượt dung lượng tối đa (${MAX_IMAGE_SIZE_MB}MB).`);
                    return;
                }

                // Check count limit
                if (currentImages + addedImages >= MAX_IMAGES_COUNT) {
                    errors.push(`Không thể đính kèm quá ${MAX_IMAGES_COUNT} ảnh.`);
                    return;
                }

                addedImages++;
                // Save file with metadata date
                selectedUploadedFiles.push({
                    file: file,
                    dateAdded: getCurrentDateTimeString(),
                    status: "Sẵn sàng"
                });
            }

            if (isVideo) {
                // Check format
                const allowedVideoExts = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
                const extension = file.name.split('.').pop().toLowerCase();
                const isMov = extension === 'mov' || file.type === 'video/quicktime';
                if (!allowedVideoExts.includes(file.type) && !isMov) {
                    errors.push(`Video "${file.name}" sai định dạng (chỉ nhận MP4, WEBM, MOV).`);
                    return;
                }

                // Check size (50MB)
                const fileSizeMB = file.size / (1024 * 1024);
                if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
                    errors.push(`Video "${file.name}" vượt dung lượng tối đa (${MAX_VIDEO_SIZE_MB}MB).`);
                    return;
                }

                // Check count limit
                if (currentVideos + addedVideos >= MAX_VIDEOS_COUNT) {
                    errors.push(`Không thể đính kèm quá ${MAX_VIDEOS_COUNT} video.`);
                    return;
                }

                addedVideos++;
                selectedUploadedFiles.push({
                    file: file,
                    dateAdded: getCurrentDateTimeString(),
                    status: "Sẵn sàng"
                });
            }
        });

        // Trigger errors
        if (errors.length > 0) {
            errors.forEach(err => showToast("danger", err));
        }

        if (addedImages > 0 || addedVideos > 0) {
            showToast("success", `Đã thêm ${addedImages} ảnh và ${addedVideos} video.`);
            renderFileDisplayContainers();
        }
    }

    function renderFileDisplayContainers() {
        if (selectedUploadedFiles.length === 0) {
            elPreviewsWrapper.classList.add('d-none');
            elSelectedFilesTableWrapper.classList.add('d-none');
            return;
        }

        // Show wrappers
        elPreviewsWrapper.classList.remove('d-none');
        elSelectedFilesTableWrapper.classList.remove('d-none');

        // Reset outputs
        elPreviewsContainer.innerHTML = '';
        elSelectedFilesTableBody.innerHTML = '';

        selectedUploadedFiles.forEach((item, index) => {
            const file = item.file;
            const fileSizeFormatted = formatBytes(file.size);

            // 1. Render Gallery Previews
            const previewCard = document.createElement('div');
            previewCard.className = "preview-item fade-in-animation";

            const deletePreviewBtn = document.createElement('button');
            deletePreviewBtn.type = "button";
            deletePreviewBtn.className = "delete-preview-btn";
            deletePreviewBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
            deletePreviewBtn.setAttribute('title', "Xóa tệp");
            deletePreviewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeUploadedFile(index);
            });

            previewCard.appendChild(deletePreviewBtn);

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.className = "preview-thumbnail";
                img.src = URL.createObjectURL(file);
                img.alt = file.name;
                previewCard.appendChild(img);
                
                previewCard.addEventListener('click', () => {
                    openLightbox(img.src, file.name);
                });
            } else if (file.type.startsWith('video/')) {
                const videoPlaceholder = document.createElement('div');
                videoPlaceholder.className = "preview-video-placeholder";
                videoPlaceholder.innerHTML = `
                    <i class="bi bi-play-btn-fill text-danger"></i>
                    <span>${file.name}</span>
                `;
                previewCard.appendChild(videoPlaceholder);

                const videoURL = URL.createObjectURL(file);
                previewCard.addEventListener('click', () => {
                    openLightboxVideo(videoURL, file.name);
                });
            }
            elPreviewsContainer.appendChild(previewCard);

            // 2. Render Table Rows for Selected Files List
            const row = document.createElement('tr');
            row.className = "fade-in-animation";
            row.innerHTML = `
                <td>
                    <span class="d-block text-dark font-medium text-truncate" style="max-width: 250px;" title="${file.name}">
                        <i class="bi ${file.type.startsWith('image/') ? 'bi-image text-primary' : 'bi-film text-danger'} me-2"></i>${file.name}
                    </span>
                </td>
                <td>${fileSizeFormatted}</td>
                <td>${item.dateAdded}</td>
                <td>
                    <span class="badge-upload-status badge-status-ready">
                        <i class="bi bi-check-circle-fill me-1"></i>${item.status}
                    </span>
                </td>
                <td class="text-center">
                    <button type="button" class="delete-file-row-btn" title="Xóa tệp">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </td>
            `;

            row.querySelector('.delete-file-row-btn').addEventListener('click', () => {
                removeUploadedFile(index);
            });

            elSelectedFilesTableBody.appendChild(row);
        });
    }

    function removeUploadedFile(index) {
        selectedUploadedFiles.splice(index, 1);
        showToast("info", "Đã gỡ bỏ tệp đính kèm.");
        renderFileDisplayContainers();
    }

    // ==================== LIGHTBOX MODAL FOR ZOOM PREVIEW ====================
    function setupLightboxModal() {
        lightboxCloseTrigger.addEventListener('click', closeLightbox);
        
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal || e.target.classList.contains('lightbox-dialog')) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightboxModal.classList.contains('show')) {
                closeLightbox();
            }
        });
    }

    function setupStaticGalleryViewer() {
        // Handle clicks on evaluated gallery images from the static database mock
        elEvalGalleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const src = item.getAttribute('data-src') || item.querySelector('img').src;
                const alt = item.querySelector('img').getAttribute('alt') || "Hình ảnh đính kèm";
                openLightbox(src, alt);
            });
        });
    }

    function openLightbox(imageSrc, caption) {
        const oldVideo = lightboxModal.querySelector('.lightbox-body video');
        if (oldVideo) oldVideo.remove();
        lightboxImgElement.classList.remove('d-none');

        lightboxImgElement.src = imageSrc;
        lightboxCaptionText.innerText = caption || "Xem hình ảnh";
        
        lightboxModal.style.display = "flex";
        setTimeout(() => {
            lightboxModal.classList.add('show');
        }, 10);
    }

    function openLightboxVideo(videoURL, caption) {
        lightboxImgElement.classList.add('d-none');
        
        const oldVideo = lightboxModal.querySelector('.lightbox-body video');
        if (oldVideo) oldVideo.remove();

        const videoPlayer = document.createElement('video');
        videoPlayer.className = "img-fluid rounded";
        videoPlayer.setAttribute('controls', 'true');
        videoPlayer.setAttribute('autoplay', 'true');
        videoPlayer.style.maxHeight = "80vh";
        
        const source = document.createElement('source');
        source.src = videoURL;
        source.type = "video/mp4";
        
        videoPlayer.appendChild(source);
        
        const captionNode = lightboxModal.querySelector('#lightbox-caption-text');
        lightboxModal.querySelector('.lightbox-body').insertBefore(videoPlayer, captionNode);
        
        lightboxCaptionText.innerText = caption || "Xem video";
        
        lightboxModal.style.display = "flex";
        setTimeout(() => {
            lightboxModal.classList.add('show');
        }, 10);
    }

    function closeLightbox() {
        lightboxModal.classList.remove('show');
        
        const videoPlayer = lightboxModal.querySelector('.lightbox-body video');
        if (videoPlayer) {
            videoPlayer.pause();
            setTimeout(() => videoPlayer.remove(), 300);
        }

        setTimeout(() => {
            lightboxModal.style.display = "none";
        }, 300);
    }

    // ==================== FORM VALIDATION & SUBMIT ====================
    function setupFormSubmit() {
        formReview.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const serviceQuality = parseInt(document.getElementById('input-service-quality').value);
            const staffAttitude = parseInt(document.getElementById('input-staff-attitude').value);
            const processingSpeed = parseInt(document.getElementById('input-processing-speed').value);
            
            let isValid = true;

            // 1. Service validation
            const errService = document.getElementById('error-service-quality');
            const grpService = document.getElementById('service-quality-rating').closest('.rating-group');
            if (!serviceQuality || serviceQuality === 0) {
                grpService.classList.add('is-invalid');
                errService.innerText = "Vui lòng đánh giá Chất Lượng Dịch Vụ.";
                errService.style.display = "block";
                isValid = false;
            } else {
                grpService.classList.remove('is-invalid');
                errService.innerText = "";
                errService.style.display = "none";
            }

            // 2. Staff validation
            const errStaff = document.getElementById('error-staff-attitude');
            const grpStaff = document.getElementById('staff-attitude-rating').closest('.rating-group');
            if (!staffAttitude || staffAttitude === 0) {
                grpStaff.classList.add('is-invalid');
                errStaff.innerText = "Vui lòng đánh giá Thái Độ Nhân Viên.";
                errStaff.style.display = "block";
                isValid = false;
            } else {
                grpStaff.classList.remove('is-invalid');
                errStaff.innerText = "";
                errStaff.style.display = "none";
            }

            // 3. Speed validation
            const errSpeed = document.getElementById('error-processing-speed');
            const grpSpeed = document.getElementById('processing-speed-rating').closest('.rating-group');
            if (!processingSpeed || processingSpeed === 0) {
                grpSpeed.classList.add('is-invalid');
                errSpeed.innerText = "Vui lòng đánh giá Tốc Độ Giải Quyết Sự Cố.";
                errSpeed.style.display = "block";
                isValid = false;
            } else {
                grpSpeed.classList.remove('is-invalid');
                errSpeed.innerText = "";
                errSpeed.style.display = "none";
            }

            if (!isValid) {
                showToast("danger", "Vui lòng hoàn thành đầy đủ các tiêu chí đánh giá bắt buộc.");
                cardForm.scrollIntoView({ behavior: 'smooth' });
                return;
            }

            submitReview(serviceQuality, staffAttitude, processingSpeed);
        });
    }

    function submitReview(service, staff, speed) {
        const btnSubmit = document.getElementById('btn-submit-review');
        const spinner = btnSubmit.querySelector('.btn-spinner');
        const icon = btnSubmit.querySelector('.btn-icon');

        btnSubmit.disabled = true;
        spinner.classList.remove('d-none');
        icon.classList.add('d-none');

        setTimeout(() => {
            btnSubmit.disabled = false;
            spinner.classList.add('d-none');
            icon.classList.remove('d-none');

            showToast("success", "Gửi đánh giá thành công!");

            // Calculate average score
            const averageScore = ((service + staff + speed) / 3).toFixed(1);
            elAvgScoreDisplay.innerText = averageScore;

            // Generate average stars output inside success card
            elAvgStarsContainer.innerHTML = '';
            const fullStarsCount = Math.floor(averageScore);
            const hasHalfStar = (averageScore - fullStarsCount) >= 0.3;

            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('i');
                if (i <= fullStarsCount) {
                    star.className = "bi bi-star-fill mx-1";
                } else if (i === fullStarsCount + 1 && hasHalfStar) {
                    star.className = "bi bi-star-half mx-1";
                } else {
                    star.className = "bi bi-star mx-1";
                }
                elAvgStarsContainer.appendChild(star);
            }

            // Transition cards display
            cardForm.classList.add('d-none');
            cardSuccess.classList.remove('d-none');
            cardAdminResponse.classList.add('d-none'); // Hide admin response inside successful submission screen

            cardSuccess.scrollIntoView({ behavior: 'smooth' });

        }, 1200);
    }

    // ==================== SCENARIO DRAWER SWITCHER ====================
    function setupDemoConsole() {
        demoToggleTrigger.addEventListener('click', () => {
            demoController.classList.toggle('closed');
        });

        demoButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                demoButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const scenarioName = btn.getAttribute('data-scenario');
                loadScenario(scenarioName);

                setTimeout(() => {
                    demoController.classList.add('closed');
                }, 300);
            });
        });
    }

    function loadScenario(scenario) {
        // Toggle view containers
        cardForm.classList.add('d-none');
        cardSuccess.classList.add('d-none');
        cardEvaluated.classList.add('d-none');
        cardAdminResponse.classList.add('d-none');

        resetReviewForm();

        if (scenario === 'new-ticket') {
            // Scenario A: Form is unreviewed, ready to review
            cardForm.classList.remove('d-none');
            showToast("info", "Trạng thái: Phiếu Chưa Đánh Giá (Kịch Bản A).");
        } 
        else if (scenario === 'reviewed-no-reply') {
            // Scenario B: Evaluated but no admin response yet
            cardEvaluated.classList.remove('d-none');
            cardAdminResponse.classList.remove('d-none');

            // Hide content container, show empty state notice
            elAdminReplyContentBox.classList.add('d-none');
            elAdminReplyEmptyBox.classList.remove('d-none');

            showToast("info", "Trạng thái: Phiếu Đã Đánh Giá & Chưa Phản Hồi (Kịch Bản B).");
        } 
        else if (scenario === 'reviewed-with-reply') {
            // Scenario C: Evaluated and admin has replied
            cardEvaluated.classList.remove('d-none');
            cardAdminResponse.classList.remove('d-none');

            // Show content container, hide empty state notice
            elAdminReplyContentBox.classList.remove('d-none');
            elAdminReplyEmptyBox.classList.add('d-none');

            showToast("info", "Trạng thái: Phiếu Đã Đánh Giá & Đã Phản Hồi (Kịch Bản C).");
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetReviewForm() {
        formReview.reset();
        selectedUploadedFiles = [];
        elPreviewsWrapper.classList.add('d-none');
        elPreviewsContainer.innerHTML = '';
        elSelectedFilesTableWrapper.classList.add('d-none');
        elSelectedFilesTableBody.innerHTML = '';
        elCharCount.innerText = '0';

        // Clear realtime average display
        updateRealtimeScore();

        // Clear stars highlights
        const starGroups = document.querySelectorAll('.star-group');
        starGroups.forEach(group => {
            const criterion = group.getAttribute('data-criterion');
            const stars = group.querySelectorAll('.star-btn');
            const descLabel = document.getElementById(`${criterion.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1)}-desc`);
            const errorField = document.getElementById(`error-${criterion.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1)}`);
            const inputField = document.getElementById(`input-${criterion.replace(/([A-Z])/g, '-$1').toLowerCase().substring(1)}`);

            removeHighlight(stars, 'selected');
            removeHighlight(stars, 'hovered');
            if (descLabel) {
                descLabel.innerText = "Đang chờ chọn...";
                descLabel.classList.remove('active');
            }
            if (errorField) {
                errorField.innerText = "";
                errorField.style.display = "none";
            }
            if (inputField) {
                inputField.value = "0";
            }
            group.closest('.rating-group').classList.remove('is-invalid');
        });
    }

    // ==================== HELPER UTILITIES ====================
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function getCurrentDateTimeString() {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    }

    function showToast(type, message) {
        toastMessageText.innerText = message;
        
        toastAlert.className = "toast align-items-center text-white border-0 shadow-lg";
        
        if (type === "success") {
            toastAlert.classList.add("bg-success");
            toastIcon.className = "bi bi-check-circle-fill me-2";
        } else if (type === "danger") {
            toastAlert.classList.add("bg-danger");
            toastIcon.className = "bi bi-exclamation-triangle-fill me-2";
        } else if (type === "info") {
            toastAlert.classList.add("bg-info");
            toastIcon.className = "bi bi-info-circle-fill me-2";
        } else {
            toastAlert.classList.add("bg-dark");
            toastIcon.className = "bi bi-info-circle-fill me-2";
        }

        const toast = new bootstrap.Toast(toastAlert, { delay: 4000 });
        toast.show();
    }

    function bindRippleEffects() {
        const rippleButtons = document.querySelectorAll('.btn-ripple');
        rippleButtons.forEach(button => {
            if (button.classList.contains('ripple-bound-review')) return;
            button.classList.add('ripple-bound-review');
            
            button.addEventListener('click', function(e) {
                if (this.disabled || this.classList.contains('disabled')) return;
                
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const ripple = document.createElement('span');
                ripple.className = 'ripple-wave';
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;

                this.appendChild(ripple);
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    // Run Initialization
    init();
});
