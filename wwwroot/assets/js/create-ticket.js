/* -------------------------------------------------------------
 * FILE: assets/js/create-ticket.js
 * AUTHOR: Antigravity
 * DESCRIPTION: Scripts for Step Wizard Tech Support Ticket Page
 * ------------------------------------------------------------- */

// Global state variables
let currentStep = 1;
let selectedCategory = null;
let selectedService = null;
let selectedFiles = [];
let datePicker = null;
let timePicker = null;

// Mock Categories and Sub-services Data
const categoriesData = {
    "internet": {
        id: "internet",
        name: "Internet Cáp Quang",
        icon: "fa-solid fa-globe",
        desc: "Các sự cố liên quan đến đường truyền Internet cáp quang FTTH Viettel, suy hao tín hiệu, mất kết nối hoặc chập chờn.",
        status: "Hoạt động ổn định",
        services: [
            {
                id: "ftth",
                name: "Internet Cáp Quang FTTH",
                desc: "Đường truyền cáp quang đối xứng băng thông rộng, tốc độ cao từ 100Mbps đến 1Gbps. Cam kết tính ổn định, độ trễ cực thấp, phù hợp cho mọi cá nhân và gia đình học tập, làm việc trực tuyến.",
                status: "Hoạt động ổn định",
                date: "01/01/2026"
            },
            {
                id: "combo",
                name: "Combo Internet + Truyền hình TV360",
                desc: "Dịch vụ tích hợp Internet Cáp Quang tốc độ cao và Truyền hình số thông minh TV360 Viettel với hơn 150 kênh truyền hình đặc sắc trong nước và quốc tế.",
                status: "Hoạt động ổn định",
                date: "15/01/2026"
            },
            {
                id: "leased-line",
                name: "Internet Leased Line (Kênh thuê riêng)",
                desc: "Đường truyền Internet đối xứng chất lượng cao cam kết SLA 99.9% dành riêng cho các doanh nghiệp lớn, tổ chức tài chính.",
                status: "Hoạt động ổn định",
                date: "12/03/2026"
            }
        ]
    },
    "tv": {
        id: "tv",
        name: "Truyền Hình TV360",
        icon: "fa-solid fa-tv",
        desc: "Các vấn đề về dịch vụ Truyền hình số Viettel, ứng dụng TV360 trên Smart TV, Box, lỗi không tải được kênh, mất tiếng, nhoè hình.",
        status: "Hoạt động ổn định",
        services: [
            {
                id: "tv360-app",
                name: "Ứng dụng TV360 trên Smart TV",
                desc: "Ứng dụng truyền hình giải trí đa nền tảng. Hỗ trợ xem trực tuyến phim HD và truyền hình độ nét cao.",
                status: "Hoạt động ổn định",
                date: "01/02/2026"
            },
            {
                id: "tv360-box",
                name: "Đầu thu TV360 Box (Android TV)",
                desc: "Thiết bị giải mã truyền hình số thông minh biến tivi thường thành Smart TV, hỗ trợ tìm kiếm giọng nói tiếng Việt.",
                status: "Hoạt động ổn định",
                date: "10/02/2026"
            }
        ]
    },
    "camera": {
        id: "camera",
        name: "Home Camera Viettel",
        icon: "fa-solid fa-video",
        desc: "Sự cố liên quan đến thiết bị Camera giám sát thông minh Viettel, lưu trữ dữ liệu đám mây Cloud, cảnh báo AI và cấu hình xem qua điện thoại.",
        status: "Hoạt động ổn định",
        services: [
            {
                id: "camera-indoor",
                name: "Home Camera trong nhà xoay 360",
                desc: "Thiết bị camera giám sát trong nhà hỗ trợ xoay 360 độ, đàm thoại 2 chiều, theo dõi chuyển động thông minh.",
                status: "Hoạt động ổn định",
                date: "20/01/2026"
            },
            {
                id: "camera-outdoor",
                name: "Home Camera ngoài trời chống nước",
                desc: "Thiết bị camera chuyên dụng ngoài trời chuẩn kháng nước IP67, hỗ trợ nhìn đêm có màu và cảnh báo đột nhập.",
                status: "Hoạt động ổn định",
                date: "25/01/2026"
            },
            {
                id: "camera-cloud",
                name: "Dịch vụ lưu trữ Cloud Camera",
                desc: "Lưu trữ video giám sát an toàn trên máy chủ đám mây Viettel IDC. Bảo mật tuyệt đối, xem lại lịch sử dễ dàng.",
                status: "Hoạt động ổn định",
                date: "01/03/2026"
            }
        ]
    },
    "wifi": {
        id: "wifi",
        name: "WiFi Mesh & Mạng Nội Bộ",
        icon: "fa-solid fa-network-wired",
        desc: "Mở rộng vùng phủ sóng WiFi thông qua các thiết bị Mesh, cấu hình mạng LAN/WAN nội bộ, Modem, Router phụ cho hộ gia đình và doanh nghiệp.",
        status: "Hoạt động ổn định",
        services: [
            {
                id: "mesh-wifi",
                name: "Thiết bị Home WiFi Mesh",
                desc: "Hệ thống Wifi Mesh mở rộng vùng phủ sóng loại bỏ hoàn toàn góc chết, tự động roaming thông minh.",
                status: "Hoạt động ổn định",
                date: "05/01/2026"
            },
            {
                id: "lan-setup",
                name: "Hệ thống mạng nội bộ LAN/WAN",
                desc: "Cấu hình đi dây mạng, cài đặt bộ chia mạng Switch, cân bằng tải Load Balancer cho hộ kinh doanh và doanh nghiệp.",
                status: "Hoạt động ổn định",
                date: "12/02/2026"
            }
        ]
    },
    "cloud": {
        id: "cloud",
        name: "Cloud Server & Lưu Trữ",
        icon: "fa-solid fa-server",
        desc: "Dịch vụ máy chủ ảo Cloud VPS, Cloud Storage, hạ tầng trung tâm dữ liệu Viettel IDC đạt chuẩn Tier 3 và các dịch vụ Kubernetes.",
        status: "Hoạt động ổn định",
        services: [
            {
                id: "cloud-vps",
                name: "Máy chủ ảo Cloud VPS",
                desc: "Khởi tạo máy chủ ảo hiệu năng cao, ổ cứng SSD chuyên dụng, băng thông trong nước không giới hạn.",
                status: "Hoạt động ổn định",
                date: "01/01/2026"
            },
            {
                id: "cloud-storage",
                name: "Cloud Storage (Lưu trữ khối/đối tượng)",
                desc: "Dịch vụ lưu trữ dữ liệu lớn có tính sẵn sàng cao, tương thích chuẩn S3, tốc độ truy xuất nhanh.",
                status: "Hoạt động ổn định",
                date: "18/02/2026"
            },
            {
                id: "vkubernetes",
                name: "vKubernetes (Container Management)",
                desc: "Quản trị các ứng dụng container tự động hóa trên hạ tầng Kubernetes hiện đại, tối ưu tài nguyên doanh nghiệp.",
                status: "Hoạt động ổn định",
                date: "05/03/2026"
            }
        ]
    },
    "tongdai": {
        id: "tongdai",
        name: "Tổng Đài Ảo vContact",
        icon: "fa-solid fa-headset",
        desc: "Dịch vụ tổng đài thông minh cho doanh nghiệp, đầu số hotline 1800/1900, SIP Trunking kết nối khách hàng.",
        status: "Hoạt động ổn định",
        services: [
            {
                id: "vcontact",
                name: "Tổng đài ảo vContact Viettel",
                desc: "Giải pháp tổng đài CSKH trên nền tảng đám mây, tích hợp CRM, báo cáo thống kê cuộc gọi trực quan.",
                status: "Hoạt động ổn định",
                date: "10/01/2026"
            },
            {
                id: "sip-trunking",
                name: "Đường trung kế SIP Trunking",
                desc: "Kết nối đầu số di động hoặc cố định Viettel với hệ thống tổng đài sẵn có của doanh nghiệp.",
                status: "Hoạt động ổn định",
                date: "22/02/2026"
            }
        ]
    },
    "viettel-ca": {
        id: "viettel-ca",
        name: "Chữ ký số (CA)",
        icon: "fa-solid fa-key",
        desc: "Lỗi USB Token không nhận diện thiết bị, hết hạn chứng thư số Viettel-CA, không ký được tờ khai.",
        status: "Hoạt động ổn định",
        services: [
            {
                id: "usb-token",
                name: "Cấu hình & Nhận diện USB Token",
                desc: "Hỗ trợ cài đặt driver USB Token Viettel-CA, sửa lỗi máy tính không nhận token, xung đột chữ ký số.",
                status: "Hoạt động ổn định",
                date: "01/01/2026"
            },
            {
                id: "certificate-renew",
                name: "Gia hạn chứng thư số Viettel-CA",
                desc: "Hỗ trợ thủ tục gia hạn, cập nhật chứng thư số mới lên hệ thống khai thuế, BHXH, Hải quan.",
                status: "Hoạt động ổn định",
                date: "10/01/2026"
            },
            {
                id: "hsm-service",
                name: "Chữ ký số tập trung HSM",
                desc: "Hỗ trợ tích hợp, cấu hình tài khoản ký số HSM qua mạng tốc độ cao cho doanh nghiệp lớn.",
                status: "Hoạt động ổn định",
                date: "15/02/2026"
            }
        ]
    }
};

document.addEventListener('DOMContentLoaded', function () {
    // 1. Render categories on step 1
    renderCategoriesGrid();

    // 2. Initialise Ticket Code & Date time
    initTicketDetails();

    // 3. Initialise Switch Box Toggler (Appointment)
    initAppointmentToggler();

    // 4. Initialise Priority Radio Custom Selection Card highlight
    initPriorityCards();

    // 5. Initialise Drag and Drop File Upload
    initFileUpload();

    // 6. Initialise Wizard navigation steps buttons
    initWizardFlow();

    // 7. Initialise Service Selector detail preview change listener
    initServiceSelector();

    // 8. Check URL parameters for auto redirection
    checkUrlParameters();

    // 9. Initialise Final Submit Logic
    initFormSubmission();
});

/**
 * Render Categories dynamic grid in Step 1
 */
function renderCategoriesGrid() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;

    categoriesGrid.innerHTML = '';
    Object.keys(categoriesData).forEach(key => {
        const cat = categoriesData[key];
        const col = document.createElement('div');
        col.className = 'col-6 col-md-4';
        col.innerHTML = `
            <div class="category-select-card h-100" data-category-id="${cat.id}">
                <div class="select-checkmark-tick"><i class="fa-solid fa-check"></i></div>
                <div class="category-card-icon">
                    <i class="${cat.icon}"></i>
                </div>
                <h4 class="category-card-title">${cat.name}</h4>
            </div>
        `;
        categoriesGrid.appendChild(col);
    });

    // Attach click events on category selection cards
    const cards = categoriesGrid.querySelectorAll('.category-select-card');
    cards.forEach(card => {
        card.addEventListener('click', function () {
            // Remove selected class from all other cards
            cards.forEach(c => c.classList.remove('selected'));
            // Add selected class to this card
            this.classList.add('selected');

            // Set global active category details
            const catId = this.getAttribute('data-category-id');
            const cat = categoriesData[catId];
            selectedCategory = cat;

            // Render details in preview box
            const previewCategoryName = document.getElementById('previewCategoryName');
            const previewCategoryDesc = document.getElementById('previewCategoryDesc');
            const previewCategoryStatus = document.getElementById('previewCategoryStatus');
            const categoryPreviewWrapper = document.getElementById('categoryPreviewWrapper');

            if (previewCategoryName) previewCategoryName.textContent = cat.name;
            if (previewCategoryDesc) previewCategoryDesc.textContent = cat.desc;
            if (previewCategoryStatus) {
                previewCategoryStatus.textContent = cat.status;
                if (cat.status.toLowerCase().includes('bảo trì') || cat.status.toLowerCase().includes('nâng cấp')) {
                    previewCategoryStatus.className = "badge ms-auto bg-warning-subtle text-warning border border-warning-subtle px-3 py-1 rounded-pill";
                } else {
                    previewCategoryStatus.className = "badge ms-auto bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill";
                }
            }

            // Show preview box with fade-in
            if (categoryPreviewWrapper) {
                categoryPreviewWrapper.classList.remove('d-none');
                categoryPreviewWrapper.classList.add('animate-fade-in');
            }

            // Enable next button for step 1
            const btnNextStep1 = document.getElementById('btnNextStep1');
            if (btnNextStep1) {
                btnNextStep1.removeAttribute('disabled');
            }

            // Reset step 2 select options
            resetServiceSelection();
            populateServices(cat);
        });
    });
}

/**
 * Reset step 2 service dropdown selection and preview card
 */
function resetServiceSelection() {
    selectedService = null;
    const relatedServiceSelect = document.getElementById('relatedServiceSelect');
    if (relatedServiceSelect) {
        relatedServiceSelect.value = '';
    }
    const servicePreviewWrapper = document.getElementById('servicePreviewWrapper');
    if (servicePreviewWrapper) {
        servicePreviewWrapper.classList.add('d-none');
    }
    const btnNextStep2 = document.getElementById('btnNextStep2');
    if (btnNextStep2) {
        btnNextStep2.setAttribute('disabled', 'disabled');
    }
}

/**
 * Populate dynamic services drop list options inside Step 2
 */
function populateServices(category) {
    const relatedServiceSelect = document.getElementById('relatedServiceSelect');
    if (!relatedServiceSelect) return;

    relatedServiceSelect.innerHTML = '<option value="" selected disabled>-- Chọn dịch vụ hỗ trợ --</option>';
    category.services.forEach(svc => {
        const opt = document.createElement('option');
        opt.value = svc.id;
        opt.textContent = svc.name;
        relatedServiceSelect.appendChild(opt);
    });
}

/**
 * Handle Service select dropdown change preview details
 */
function initServiceSelector() {
    const relatedServiceSelect = document.getElementById('relatedServiceSelect');
    if (!relatedServiceSelect) return;

    relatedServiceSelect.addEventListener('change', function () {
        const svcId = this.value;
        if (!selectedCategory) return;

        const svc = selectedCategory.services.find(s => s.id === svcId);
        if (svc) {
            selectedService = svc;

            // Populate preview fields
            const previewServiceName = document.getElementById('previewServiceName');
            const previewServiceDesc = document.getElementById('previewServiceDesc');
            const previewServiceStatus = document.getElementById('previewServiceStatus');
            const previewServiceDate = document.getElementById('previewServiceDate');
            const servicePreviewWrapper = document.getElementById('servicePreviewWrapper');

            if (previewServiceName) previewServiceName.textContent = svc.name;
            if (previewServiceDesc) previewServiceDesc.textContent = svc.desc;
            if (previewServiceStatus) {
                previewServiceStatus.textContent = svc.status;
                if (svc.status.toLowerCase().includes('bảo trì') || svc.status.toLowerCase().includes('nâng cấp')) {
                    previewServiceStatus.className = "badge ms-auto bg-warning-subtle text-warning border border-warning-subtle px-3 py-1 rounded-pill";
                } else {
                    previewServiceStatus.className = "badge ms-auto bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill";
                }
            }
            if (previewServiceDate) previewServiceDate.textContent = svc.date;

            // Show preview details
            if (servicePreviewWrapper) {
                servicePreviewWrapper.classList.remove('d-none');
                servicePreviewWrapper.classList.add('animate-fade-in');
            }

            // Enable next button for step 2
            const btnNextStep2 = document.getElementById('btnNextStep2');
            if (btnNextStep2) {
                btnNextStep2.removeAttribute('disabled');
            }
        } else {
            resetServiceSelection();
        }
    });
}

/**
 * Initialise step validation & steps navigation buttons
 */
function initWizardFlow() {
    // Step transitions
    const btnNextStep1 = document.getElementById('btnNextStep1');
    const btnBackStep2 = document.getElementById('btnBackStep2');
    const btnNextStep2 = document.getElementById('btnNextStep2');
    const btnBackStep3 = document.getElementById('btnBackStep3');
    const btnNextStep3 = document.getElementById('btnNextStep3');
    const btnBackStep4 = document.getElementById('btnBackStep4');

    if (btnNextStep1) {
        btnNextStep1.addEventListener('click', () => showStep(2));
    }
    if (btnBackStep2) {
        btnBackStep2.addEventListener('click', () => showStep(1));
    }
    if (btnNextStep2) {
        btnNextStep2.addEventListener('click', () => showStep(3));
    }
    if (btnBackStep3) {
        btnBackStep3.addEventListener('click', () => showStep(2));
    }
    if (btnNextStep3) {
        btnNextStep3.addEventListener('click', function () {
            // Form validations for step 3 inputs
            const form = document.getElementById('wizardTicketForm');
            const ticketTitle = document.getElementById('ticketTitle');
            const requestType = document.getElementById('requestType');
            const ticketContent = document.getElementById('ticketContent');
            const needAppointment = document.getElementById('needAppointment');
            const appointmentDate = document.getElementById('appointmentDate');
            const appointmentTime = document.getElementById('appointmentTime');

            let isValid = true;

            if (!ticketTitle.checkValidity() || !requestType.checkValidity() || !ticketContent.checkValidity()) {
                isValid = false;
            }

            if (needAppointment && needAppointment.checked) {
                if (!appointmentDate.checkValidity() || !appointmentTime.checkValidity()) {
                    isValid = false;
                }
            }

            if (!isValid) {
                if (form) form.classList.add('was-validated');

                // Find the first invalid element to focus & scroll to
                const invalidElement = [ticketTitle, requestType, ticketContent, appointmentDate, appointmentTime].find(el => el && el.hasAttribute('required') && !el.checkValidity());
                if (invalidElement) {
                    invalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    invalidElement.focus();
                }

                // Show visual alert toast
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'warning',
                    title: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc!',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                return;
            }

            // Remove was-validated so step 4 review visual stays clean
            if (form) form.classList.remove('was-validated');

            // Build Summary review data
            compileStep4Summary();

            // Proceed
            showStep(4);
        });
    }
    if (btnBackStep4) {
        btnBackStep4.addEventListener('click', () => showStep(3));
    }
}

/**
 * Handle wizard navigation switching state updates
 */
function showStep(stepIndex) {
    currentStep = stepIndex;

    // Toggle steps section visibility with animation
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active', 'animate-fade-in');
    });

    const activeContainer = document.getElementById(`step${stepIndex}Container`);
    if (activeContainer) {
        activeContainer.classList.add('active', 'animate-fade-in');
    }

    // Toggle wizard progress nodes states
    const stepsItems = document.querySelectorAll('#stepWizard .step-wizard-item');
    stepsItems.forEach(item => {
        const itemStepVal = parseInt(item.getAttribute('data-step'));
        if (itemStepVal < stepIndex) {
            item.classList.remove('active');
            item.classList.add('completed');
        } else if (itemStepVal === stepIndex) {
            item.classList.add('active');
            item.classList.remove('completed');
        } else {
            item.classList.remove('active', 'completed');
        }
    });

    // Animate step progress bar width
    const stepProgress = document.getElementById('stepProgress');
    if (stepProgress) {
        stepProgress.style.width = ((stepIndex - 1) / 3) * 100 + '%';
    }

    // Sync active step inside sidebar timeline
    const timelineItems = document.querySelectorAll('#sidebarTimeline .step-timeline-item');
    timelineItems.forEach(item => {
        const sidebarStepVal = parseInt(item.getAttribute('data-sidebar-step'));
        if (sidebarStepVal === stepIndex) {
            item.classList.add('active-step');
        } else {
            item.classList.remove('active-step');
        }
    });

    // Auto scroll view to the form container top wrapper
    const ticketFormSection = document.getElementById('ticketFormSection');
    if (ticketFormSection) {
        ticketFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Initialize sequential Ticket Counter & readonly Date time labels
 */
function initTicketDetails() {
    let currentCounter = localStorage.getItem('viettel_ticket_counter');
    if (!currentCounter) {
        currentCounter = 20260001;
        localStorage.setItem('viettel_ticket_counter', currentCounter);
    }

    const ticketCodeInput = document.getElementById('ticketCode');
    if (ticketCodeInput) {
        ticketCodeInput.value = 'PHT-' + currentCounter;
    }

    // Timestamp settings
    const createdDate = document.getElementById('createdDate');
    const updatedDate = document.getElementById('updatedDate');
    const nowStr = formatDateTime(new Date());

    if (createdDate) createdDate.value = nowStr;
    if (updatedDate) updatedDate.value = nowStr;
}

/**
 * Return date time formatted as: DD/MM/YYYY HH:MM:SS
 */
function formatDateTime(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

/**
 * Handle Appointment Collapsible Toggler logic & constraints
 */
function initAppointmentToggler() {
    const needAppointment = document.getElementById('needAppointment');
    const appointmentContainer = document.getElementById('appointmentContainer');
    const appointmentDate = document.getElementById('appointmentDate');
    const appointmentTime = document.getElementById('appointmentTime');
    const appointmentNote = document.getElementById('appointmentNote');

    if (needAppointment && appointmentContainer) {
        // Initialize Flatpickr for Date
        if (appointmentDate) {
            datePicker = flatpickr(appointmentDate, {
                locale: "vn",
                dateFormat: "d/m/Y",
                minDate: "today",
                disableMobile: true,
                placeholder: "Chọn ngày hẹn"
            });
        }

        // Initialize Flatpickr for Time
        if (appointmentTime) {
            timePicker = flatpickr(appointmentTime, {
                enableTime: true,
                noCalendar: true,
                dateFormat: "H:i",
                time_24hr: true,
                disableMobile: true,
                placeholder: "Chọn giờ hẹn"
            });
        }

        needAppointment.addEventListener('change', function () {
            if (this.checked) {
                appointmentContainer.classList.remove('d-none');
                appointmentContainer.classList.add('animate-slide-down');

                // Inputs become required
                if (appointmentDate) appointmentDate.setAttribute('required', 'required');
                if (appointmentTime) appointmentTime.setAttribute('required', 'required');
            } else {
                appointmentContainer.classList.add('d-none');
                appointmentContainer.classList.remove('animate-slide-down');

                // Remove fields requirements
                if (appointmentDate) appointmentDate.removeAttribute('required');
                if (appointmentTime) appointmentTime.removeAttribute('required');

                // Clear values
                if (datePicker) datePicker.clear();
                if (timePicker) timePicker.clear();
                if (appointmentNote) appointmentNote.value = '';
            }
        });
    }
}

/**
 * Highlight custom active Priority selection radio labels
 */
function initPriorityCards() {
    const priorityRadios = document.querySelectorAll('input[name="priority"]');
    priorityRadios.forEach(radio => {
        // Initial highlight check on page load
        if (radio.checked) {
            const initialLabel = document.querySelector(`label[for="${radio.id}"]`);
            if (initialLabel) initialLabel.classList.add('active');
        }

        radio.addEventListener('change', function () {
            document.querySelectorAll('.priority-card-label').forEach(label => {
                label.classList.remove('active');
            });
            if (this.checked) {
                const label = document.querySelector(`label[for="${this.id}"]`);
                if (label) {
                    label.classList.add('active');
                }
            }
        });
    });
}

/**
 * Initialise Drag and Drop File selector & attachments previews
 */
function initFileUpload() {
    const dragDropArea = document.getElementById('dragDropArea');
    const ticketFileInput = document.getElementById('ticketFileInput');
    const filePreviewGrid = document.getElementById('filePreviewGrid');

    if (!dragDropArea || !ticketFileInput || !filePreviewGrid) return;

    // Trigger file dialog
    dragDropArea.addEventListener('click', () => ticketFileInput.click());

    // Prevent default behaviors for drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    // Drag-over highlights
    ['dragenter', 'dragover'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, () => {
            dragDropArea.classList.add('dragover');
        }, false);
    });

    // Drag-leave & drop resets
    ['dragleave', 'drop'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, () => {
            dragDropArea.classList.remove('dragover');
        }, false);
    });

    // Handle dropped files
    dragDropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleUploadedFiles(files);
    });

    // Handle selected files
    ticketFileInput.addEventListener('change', function () {
        handleUploadedFiles(this.files);
    });

    function handleUploadedFiles(files) {
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'docx'];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const ext = file.name.split('.').pop().toLowerCase();
            const sizeInMB = file.size / (1024 * 1024);

            // Extensions validation
            if (!allowedExtensions.includes(ext)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Định dạng không hỗ trợ',
                    text: `Tệp tin "${file.name}" không hợp lệ. Hệ thống chỉ nhận tệp JPG, PNG, PDF, DOCX.`,
                    confirmButtonColor: '#EE0033'
                });
                continue;
            }

            // Size validation (Max 5MB)
            if (sizeInMB > 5) {
                Swal.fire({
                    icon: 'error',
                    title: 'Dung lượng tệp quá lớn',
                    text: `Tệp tin "${file.name}" vượt quá kích thước giới hạn tối đa 5MB.`,
                    confirmButtonColor: '#EE0033'
                });
                continue;
            }

            selectedFiles.push(file);
        }

        renderAttachmentPreviews();
    }

    function renderAttachmentPreviews() {
        filePreviewGrid.innerHTML = '';

        if (selectedFiles.length === 0) {
            filePreviewGrid.classList.add('d-none');
            return;
        }

        filePreviewGrid.classList.remove('d-none');

        selectedFiles.forEach((file, idx) => {
            const previewCard = document.createElement('div');
            previewCard.className = 'preview-item';

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.onload = () => URL.revokeObjectURL(img.src);
                previewCard.appendChild(img);
            } else {
                const icon = document.createElement('i');
                if (file.name.endsWith('.pdf')) {
                    icon.className = 'fa-solid fa-file-pdf preview-file-icon';
                } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
                    icon.className = 'fa-solid fa-file-word preview-file-icon';
                } else {
                    icon.className = 'fa-solid fa-file-lines preview-file-icon';
                }
                previewCard.appendChild(icon);
            }

            // File Name Label
            const label = document.createElement('div');
            label.className = 'preview-file-details';
            label.textContent = file.name;
            previewCard.appendChild(label);

            // Remove Button
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'preview-item-remove';
            deleteBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedFiles.splice(idx, 1);
                renderAttachmentPreviews();
            });

            previewCard.appendChild(deleteBtn);
            filePreviewGrid.appendChild(previewCard);
        });
    }
}

/**
 * Handle URL Search category parameters for auto selecting categories
 */
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (!categoryParam) return;

    let mappedId = null;
    const norm = categoryParam.toLowerCase().trim();

    if (norm === 'internet') mappedId = 'internet';
    else if (norm === 'tv') mappedId = 'tv';
    else if (norm === 'camera') mappedId = 'camera';
    else if (norm === 'wifi' || norm === 'wifi-corporate') mappedId = 'wifi';
    else if (norm === 'cloud' || norm === 'cloud-server' || norm === 'cloud-storage' || norm === 'vkubernetes') mappedId = 'cloud';
    else if (norm === 'tongdai' || norm === 'phone' || norm === 'vcontact') mappedId = 'tongdai';
    else if (norm === 'viettel-ca') mappedId = 'viettel-ca';

    if (mappedId && categoriesData[mappedId]) {
        setTimeout(() => {
            const card = document.querySelector(`.category-select-card[data-category-id="${mappedId}"]`);
            if (card) {
                card.click();
                // Advance Step immediately
                showStep(2);
            }
        }, 150);
    }
}

/**
 * Compile summaries for Step 4 Confirmation Card
 */
function compileStep4Summary() {
    const ticketCodeVal = document.getElementById('ticketCode').value;
    const titleVal = document.getElementById('ticketTitle').value;
    const requestTypeVal = document.getElementById('requestType').value;
    const ticketContentVal = document.getElementById('ticketContent').value;
    const needAppointment = document.getElementById('needAppointment');
    const appointmentDateVal = document.getElementById('appointmentDate').value;
    const appointmentTimeVal = document.getElementById('appointmentTime').value;
    const appointmentNoteVal = document.getElementById('appointmentNote').value;
    const createdDateVal = document.getElementById('createdDate').value;

    // Set Text Contents
    document.getElementById('confirmTicketCode').textContent = ticketCodeVal;
    document.getElementById('confirmTicketTitle').textContent = titleVal;
    document.getElementById('confirmCategoryName').textContent = selectedCategory ? selectedCategory.name : '-';
    document.getElementById('confirmServiceName').textContent = selectedService ? selectedService.name : '-';
    document.getElementById('confirmRequestType').textContent = requestTypeVal;
    document.getElementById('confirmTicketContent').textContent = ticketContentVal;
    document.getElementById('confirmCreatedDate').textContent = createdDateVal;

    // Priority configuration
    const priorityVal = document.querySelector('input[name="priority"]:checked').value;
    const confirmPriority = document.getElementById('confirmPriority');
    if (confirmPriority) {
        confirmPriority.className = 'confirm-value priority-tag';
        if (priorityVal === 'Thấp') {
            confirmPriority.classList.add('low');
            confirmPriority.innerHTML = '<i class="fa-solid fa-arrow-down-long"></i> Thấp';
        } else if (priorityVal === 'Trung Bình') {
            confirmPriority.classList.add('medium');
            confirmPriority.innerHTML = '<i class="fa-solid fa-arrow-right-long"></i> Trung Bình';
        } else if (priorityVal === 'Cao') {
            confirmPriority.classList.add('high');
            confirmPriority.innerHTML = '<i class="fa-solid fa-arrow-up-long"></i> Cao';
        } else if (priorityVal === 'Khẩn Cấp') {
            confirmPriority.classList.add('critical');
            confirmPriority.innerHTML = '<i class="fa-solid fa-triangle-exclamation pulse-danger"></i> Khẩn Cấp';
        }
    }

    // Appointment settings
    const confirmAppointmentRow = document.getElementById('confirmAppointmentRow');
    if (needAppointment && needAppointment.checked) {
        if (confirmAppointmentRow) {
            confirmAppointmentRow.classList.remove('d-none');
            
            // Format Appointment Date: YYYY-MM-DD to DD/MM/YYYY
            let displayDate = appointmentDateVal;
            if (appointmentDateVal.includes('-')) {
                const parts = appointmentDateVal.split('-');
                displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }

            document.getElementById('confirmAppointmentTime').textContent = `Ngày ${displayDate} vào lúc ${appointmentTimeVal}`;
            document.getElementById('confirmAppointmentNote').textContent = appointmentNoteVal ? appointmentNoteVal : 'Không có ghi chú thêm';
        }
    } else {
        if (confirmAppointmentRow) {
            confirmAppointmentRow.classList.add('d-none');
        }
    }

    // Files preview row settings
    const confirmFilesRow = document.getElementById('confirmFilesRow');
    const confirmFilesPreviewContainer = document.getElementById('confirmFilesPreviewContainer');

    if (selectedFiles.length > 0) {
        if (confirmFilesRow && confirmFilesPreviewContainer) {
            confirmFilesRow.classList.remove('d-none');
            confirmFilesPreviewContainer.innerHTML = '';

            selectedFiles.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(file);
                    img.className = 'confirm-preview-img';
                    img.alt = file.name;
                    confirmFilesPreviewContainer.appendChild(img);
                } else {
                    const fileDiv = document.createElement('div');
                    fileDiv.className = 'confirm-preview-file';
                    let iconClass = 'fa-solid fa-file-lines';
                    if (file.name.endsWith('.pdf')) iconClass = 'fa-solid fa-file-pdf';
                    else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) iconClass = 'fa-solid fa-file-word';
                    fileDiv.innerHTML = `<i class="${iconClass}"></i>`;
                    confirmFilesPreviewContainer.appendChild(fileDiv);
                }
            });
        }
    } else {
        if (confirmFilesRow) {
            confirmFilesRow.classList.add('d-none');
        }
    }
}

/**
 * Handle Wizard Final Form submission
 */
function initFormSubmission() {
    const form = document.getElementById('wizardTicketForm');
    if (!form) return;

    // Priority SweetAlert Badge helper
    function getPriorityAlertBadge(priority) {
        switch (priority) {
            case 'Khẩn Cấp': return 'bg-danger';
            case 'Cao': return 'bg-warning text-dark';
            case 'Trung Bình': return 'bg-info text-dark';
            default: return 'bg-success';
        }
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const ticketCodeVal = document.getElementById('ticketCode').value;
        const titleVal = document.getElementById('ticketTitle').value;
        const categoryName = selectedCategory ? selectedCategory.name : '-';
        const serviceName = selectedService ? selectedService.name : '-';
        const requestTypeVal = document.getElementById('requestType').value;
        const priorityVal = document.querySelector('input[name="priority"]:checked').value;

        // Trigger SweetAlert2 dialog check sequence
        Swal.fire({
            title: 'Xác Nhận Gửi Phiếu?',
            html: `
                <div class="text-start fs-7 border rounded p-3 bg-light">
                    <p class="mb-2"><strong>Mã phiếu:</strong> ${ticketCodeVal}</p>
                    <p class="mb-2"><strong>Tiêu đề:</strong> ${titleVal}</p>
                    <p class="mb-2"><strong>Danh mục:</strong> ${categoryName}</p>
                    <p class="mb-2"><strong>Dịch vụ:</strong> ${serviceName}</p>
                    <p class="mb-2"><strong>Loại yêu cầu:</strong> ${requestTypeVal}</p>
                    <p class="mb-0"><strong>Mức độ ưu tiên:</strong> <span class="badge ${getPriorityAlertBadge(priorityVal)}">${priorityVal}</span></p>
                </div>
                <p class="mt-3 mb-0 text-muted fs-7 text-center">Đội ngũ kỹ thuật Viettel sẽ phản hồi phiếu hỗ trợ trong vòng 15-30 phút.</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#EE0033',
            cancelButtonColor: '#6b7280',
            confirmButtonText: '<i class="fa-solid fa-paper-plane me-1"></i>Xác nhận gửi',
            cancelButtonText: 'Hủy bỏ',
            focusConfirm: false
        }).then((result) => {
            if (result.isConfirmed) {
                // Show loading block panel
                Swal.fire({
                    title: 'Đang xử lý yêu cầu...',
                    html: 'Vui lòng chờ giây lát trong khi phiếu được khởi tạo trên hệ thống.',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Simulate network latency (1.5 seconds)
                setTimeout(() => {
                    Swal.close();

                    // Increment sequence counter in localStorage
                    let currentCounter = parseInt(localStorage.getItem('viettel_ticket_counter'));
                    localStorage.setItem('viettel_ticket_counter', currentCounter + 1);

                    // Show success status
                    Swal.fire({
                        icon: 'success',
                        title: 'Tạo Phiếu Thành Công!',
                        html: `Phiếu hỗ trợ <strong>${ticketCodeVal}</strong> đã được gửi thành công.<br>Hệ thống kỹ thuật viên đã tiếp nhận yêu cầu.`,
                        confirmButtonColor: '#EE0033',
                        confirmButtonText: 'Đồng ý'
                    }).then(() => {
                        // Reset forms & status
                        form.reset();
                        form.classList.remove('was-validated');
                        if (datePicker) datePicker.clear();
                        if (timePicker) timePicker.clear();

                        // Clear files local array
                        selectedFiles = [];
                        const filePreviewGrid = document.getElementById('filePreviewGrid');
                        if (filePreviewGrid) {
                            filePreviewGrid.innerHTML = '';
                            filePreviewGrid.classList.add('d-none');
                        }

                        // Reset selection wrappers
                        const categoryPreviewWrapper = document.getElementById('categoryPreviewWrapper');
                        if (categoryPreviewWrapper) categoryPreviewWrapper.classList.add('d-none');

                        const servicePreviewWrapper = document.getElementById('servicePreviewWrapper');
                        if (servicePreviewWrapper) servicePreviewWrapper.classList.add('d-none');

                        // Reset appointment collapsible container
                        const appointmentContainer = document.getElementById('appointmentContainer');
                        if (appointmentContainer) appointmentContainer.classList.add('d-none');

                        // Reset category selected grids classes
                        document.querySelectorAll('.category-select-card').forEach(c => c.classList.remove('selected'));

                        // Re-initialize details for new sequential ticket
                        initTicketDetails();

                        // Reset active step back to Step 1
                        showStep(1);

                        // Reset buttons and dropdown attributes
                        const btnNextStep1 = document.getElementById('btnNextStep1');
                        if (btnNextStep1) btnNextStep1.setAttribute('disabled', 'disabled');

                        const btnNextStep2 = document.getElementById('btnNextStep2');
                        if (btnNextStep2) btnNextStep2.setAttribute('disabled', 'disabled');

                        const relatedServiceSelect = document.getElementById('relatedServiceSelect');
                        if (relatedServiceSelect) {
                            relatedServiceSelect.innerHTML = '<option value="" selected disabled>Đang đợi chọn danh mục ở Bước 1...</option>';
                        }
                    });
                }, 1500);
            }
        });
    });
}
