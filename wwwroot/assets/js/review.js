/**
 * FILE: wwwroot/assets/js/review.js
 * DESCRIPTION: Interactive Frontend Logic for Service Quality Rating & Review Page.
 *              Handles 5-star rating hover/click per criterion, live score calculator,
 *              textarea character counter, drag & drop image upload preview,
 *              form reset, button loading simulation, and thank you message display.
 * AUTHOR: Antigravity (Senior Frontend Developer)
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. ELEMENT REFERENCES
    // -------------------------------------------------------------
    const criterionRows = document.querySelectorAll('.rating-criterion-row');
    const reviewComments = document.getElementById('reviewComments');
    const charCount = document.getElementById('charCount');
    const charCountBadge = document.getElementById('charCountBadge');
    
    // Upload Elements
    const uploadDropzone = document.getElementById('uploadDropzone');
    const reviewImageInput = document.getElementById('reviewImageInput');
    const imagePreviewsContainer = document.getElementById('imagePreviewsContainer');

    // Sidebar Summary Elements
    const overallScoreVal = document.getElementById('overallScoreVal');
    const overallStarsDisplay = document.getElementById('overallStarsDisplay');
    const overallLevelBadge = document.getElementById('overallLevelBadge');

    // Action Buttons & Cards
    const btnSubmitReview = document.getElementById('btnSubmitReview');
    const btnResetReview = document.getElementById('btnResetReview');
    const reviewFormCard = document.querySelector('.rev-form-card');
    const thankYouCard = document.getElementById('thankYouCard');

    let uploadedFilesList = [];

    // -------------------------------------------------------------
    // 2. RE-CALCULATE OVERALL SCORE & SIDEBAR PROGRESS BARS
    // -------------------------------------------------------------
    function recalculateOverallScore() {
        let totalScore = 0;
        const scoresMap = {};

        criterionRows.forEach((row) => {
            const criterionName = row.dataset.criterion;
            const starGroup = row.querySelector('.star-rating-group');
            const currentScore = parseInt(starGroup.dataset.score, 10) || 5;
            
            scoresMap[criterionName] = currentScore;
            totalScore += currentScore;
        });

        const count = criterionRows.length || 5;
        // Average score out of 5
        const avgScore = (totalScore / count).toFixed(1);
        
        // Update Score Big Number
        if (overallScoreVal) {
            overallScoreVal.textContent = avgScore;
        }

        // Update Level Badge text and color
        if (overallLevelBadge) {
            if (avgScore >= 4.5) {
                overallLevelBadge.className = 'score-level-badge badge-excellent';
                overallLevelBadge.innerHTML = `<i class="bi bi-emoji-smile-fill me-1"></i> Mức độ: Xuất Sắc`;
            } else if (avgScore >= 3.5) {
                overallLevelBadge.className = 'score-level-badge bg-primary text-white';
                overallLevelBadge.innerHTML = `<i class="bi bi-emoji-laughing-fill me-1"></i> Mức độ: Hài Lòng`;
            } else if (avgScore >= 2.5) {
                overallLevelBadge.className = 'score-level-badge bg-warning text-dark';
                overallLevelBadge.innerHTML = `<i class="bi bi-emoji-neutral-fill me-1"></i> Mức độ: Trung Bình`;
            } else {
                overallLevelBadge.className = 'score-level-badge bg-danger text-white';
                overallLevelBadge.innerHTML = `<i class="bi bi-emoji-frown-fill me-1"></i> Mức độ: Cần Cải Thiện`;
            }
        }

        // Update Progress Bars & Values
        const mapping = {
            quality: { valEl: 'progValQuality', barEl: 'progBarQuality' },
            attitude: { valEl: 'progValAttitude', barEl: 'progBarAttitude' },
            speed: { valEl: 'progValSpeed', barEl: 'progBarSpeed' },
            solving: { valEl: 'progValSolving', barEl: 'progBarSolving' },
            satisfaction: { valEl: 'progValSatisfaction', barEl: 'progBarSatisfaction' }
        };

        Object.keys(mapping).forEach((critKey) => {
            const score = scoresMap[critKey] || 5;
            const target = mapping[critKey];
            const valEl = document.getElementById(target.valEl);
            const barEl = document.getElementById(target.barEl);

            if (valEl) valEl.textContent = score.toFixed(1);
            if (barEl) barEl.style.width = `${(score / 5) * 100}%`;
        });
    }

    // -------------------------------------------------------------
    // 3. STAR RATING HOVER & CLICK HANDLERS PER CRITERION
    // -------------------------------------------------------------
    criterionRows.forEach((row) => {
        const starGroup = row.querySelector('.star-rating-group');
        if (!starGroup) return;
        const stars = row.querySelectorAll('.star-icon');
        const badge = row.querySelector('.score-display-badge');

        stars.forEach((star) => {
            // Hover Event
            star.addEventListener('mouseenter', () => {
                const hoverVal = parseInt(star.dataset.value, 10);
                stars.forEach((s) => {
                    const sVal = parseInt(s.dataset.value, 10);
                    if (sVal <= hoverVal) {
                        s.classList.add('hover');
                    } else {
                        s.classList.remove('hover');
                    }
                });
            });

            // Mouseleave Event
            starGroup.addEventListener('mouseleave', () => {
                stars.forEach((s) => s.classList.remove('hover'));
            });

            // Click Event
            star.addEventListener('click', () => {
                const selectedVal = parseInt(star.dataset.value, 10);
                starGroup.dataset.score = selectedVal;
                if (badge) badge.textContent = `${selectedVal}/5`;

                // Synchronize with hidden input fields for EF Core Model Binding
                const targetInputId = starGroup.dataset.target;
                if (targetInputId) {
                    const inp = document.getElementById(targetInputId);
                    if (inp) inp.value = selectedVal;
                }

                // Update Active Stars Visual
                stars.forEach((s) => {
                    const sVal = parseInt(s.dataset.value, 10);
                    if (sVal <= selectedVal) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });

                // Recalculate Average Score
                recalculateOverallScore();
            });
        });
    });

    // -------------------------------------------------------------
    // 4. CHARACTER COUNTER FOR TEXTAREA (0 / 1000)
    // -------------------------------------------------------------
    if (reviewComments && charCount) {
        reviewComments.addEventListener('input', (e) => {
            const currentLen = e.target.value.length;
            charCount.textContent = currentLen;

            if (charCountBadge) {
                if (currentLen >= 900) {
                    charCountBadge.classList.add('text-danger', 'fw-bold');
                } else {
                    charCountBadge.classList.remove('text-danger', 'fw-bold');
                }
            }
        });
    }

    // -------------------------------------------------------------
    // 5. DRAG & DROP IMAGE UPLOAD PREVIEW GENERATOR
    // -------------------------------------------------------------
    if (uploadDropzone && reviewImageInput) {
        uploadDropzone.addEventListener('click', () => {
            reviewImageInput.click();
        });

        ['dragenter', 'dragover'].forEach((eventName) => {
            uploadDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadDropzone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach((eventName) => {
            uploadDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadDropzone.classList.remove('drag-over');
            });
        });

        uploadDropzone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            handleImageFiles(files);
        });

        reviewImageInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            handleImageFiles(files);
        });
    }

    function handleImageFiles(files) {
        if (!imagePreviewsContainer) return;
        const imageFiles = files.filter((f) => f.type.startsWith('image/'));

        if (uploadedFilesList.length + imageFiles.length > 5) {
            alert('Quý khách chỉ được đính kèm tối đa 5 hình ảnh!');
            return;
        }

        imageFiles.forEach((file) => {
            uploadedFilesList.push(file);
            const reader = new FileReader();

            reader.onload = (e) => {
                const thumbCard = document.createElement('div');
                thumbCard.className = 'preview-thumb-card';
                thumbCard.innerHTML = `
                    <img src="${e.target.result}" alt="Preview image" />
                    <button type="button" class="btn-remove-thumb" title="Xóa ảnh"><i class="bi bi-x"></i></button>
                `;

                thumbCard.querySelector('.btn-remove-thumb').addEventListener('click', (event) => {
                    event.stopPropagation();
                    thumbCard.remove();
                    uploadedFilesList = uploadedFilesList.filter((item) => item !== file);
                });

                imagePreviewsContainer.appendChild(thumbCard);
            };

            reader.readAsDataURL(file);
        });
    }

    // -------------------------------------------------------------
    // 6. FORM RESET BUTTON HANDLER
    // -------------------------------------------------------------
    if (btnResetReview) {
        btnResetReview.addEventListener('click', () => {
            criterionRows.forEach((row) => {
                const starGroup = row.querySelector('.star-rating-group');
                const stars = row.querySelectorAll('.star-icon');
                const badge = row.querySelector('.score-display-badge');

                if (starGroup) starGroup.dataset.score = 5;
                if (badge) badge.textContent = '5/5';
                stars.forEach((s) => s.classList.add('active'));

                const targetInputId = starGroup ? starGroup.dataset.target : null;
                if (targetInputId) {
                    const inp = document.getElementById(targetInputId);
                    if (inp) inp.value = 5;
                }
            });

            if (reviewComments) {
                reviewComments.value = '';
                if (charCount) charCount.textContent = '0';
            }

            if (imagePreviewsContainer) {
                imagePreviewsContainer.innerHTML = '';
                uploadedFilesList = [];
            }

            recalculateOverallScore();
        });
    }

    // -------------------------------------------------------------
    // 7. SUBMIT BUTTON & AJAX SAVE TO SQL SERVER
    // -------------------------------------------------------------
    if (btnSubmitReview) {
        btnSubmitReview.addEventListener('click', async (e) => {
            e.preventDefault();
            const reviewForm = document.getElementById('reviewForm');
            if (!reviewForm) return;

            btnSubmitReview.disabled = true;
            btnSubmitReview.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Đang lưu đánh giá SQL...`;

            try {
                const formData = new FormData(reviewForm);
                const response = await fetch(reviewForm.action || window.location.href, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (data.success) {
                    // Open Viettel Success Rating Modal
                    const modalElem = document.getElementById('ratingSuccessModal');
                    const ratingModalScore = document.getElementById('ratingModalScore');

                    if (ratingModalScore && data.diemTrungBinh) {
                        ratingModalScore.textContent = `${data.diemTrungBinh.toFixed(1)}/5.0`;
                    }

                    if (modalElem && window.bootstrap) {
                        const modal = new bootstrap.Modal(modalElem);
                        modal.show();
                    } else {
                        alert(data.message || 'Đánh giá thành công!');
                        window.location.href = '/Customers/PhieuCuaToi';
                    }
                } else {
                    alert(data.message || 'Đã có lỗi xảy ra khi lưu đánh giá.');
                }
            } catch (err) {
                console.error("Lỗi AJAX lưu đánh giá:", err);
                alert("Lỗi kết nối khi gửi đánh giá. Vui lòng kiểm tra lại.");
            } finally {
                btnSubmitReview.disabled = false;
                btnSubmitReview.innerHTML = `<i class="bi bi-send-fill me-1"></i> Gửi Đánh Giá Dịch Vụ`;
            }
        });
    }

    // Initialize Overall Score
    recalculateOverallScore();
});
