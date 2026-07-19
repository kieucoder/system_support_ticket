/* -------------------------------------------------------------
 * FILE: assets/js/create-category.js
 * AUTHOR: Antigravity
 * DESCRIPTION: Scripts for Create Support Ticket Page
 * ------------------------------------------------------------- */

const categoriesServicesData = {
    "internet": [
        { id: "FTTH", name: "Internet Cáp Quang FTTH", desc: "Đường truyền cáp quang đối xứng băng thông rộng, tốc độ cao từ 100Mbps đến 1Gbps. Cam kết tính ổn định, độ trễ cực thấp, phù hợp cho mọi cá nhân và gia đình học tập, làm việc trực tuyến.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-signal text-primary'></i>" },
        { id: "COMBO", name: "Combo Internet + TV", desc: "Dịch vụ tích hợp Internet Cáp Quang tốc độ cao và Truyền hình số thông minh TV360 Viettel với hơn 150 kênh truyền hình đặc sắc trong nước và quốc tế, kho phim HD khổng lồ.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-tv text-danger'></i>" },
        { id: "FTTH_BIZ", name: "Cáp quang Doanh Nghiệp Leased Line", desc: "Đường truyền kênh thuê riêng Internet đối xứng chất lượng cao, cam kết băng thông quốc tế và IP tĩnh riêng biệt phục vụ doanh nghiệp.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-building text-primary'></i>" },
        { id: "INTERNET_5G", name: "Internet Không Dây 5G Siêu Tốc", desc: "Dịch vụ Internet không dây thế hệ mới trên nền tảng mạng di động 5G Viettel siêu tốc độ, độ trễ cực thấp, không cần kéo cáp vật lý thích hợp cho vùng cao hoặc đô thị đông đúc.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-tower-cell text-primary'></i>" },
        { id: "FTTH_VIP", name: "Cáp Quang VIP Doanh Nghiệp Lớn", desc: "Băng thông quốc tế cam kết lên đến 100Mbps, hỗ trợ kỹ thuật riêng 24/7/365, dự phòng đa đường truyền cáp biển đảm bảo liên lạc thông suốt.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-gem text-primary'></i>" }
    ],
    "tv": [
        { id: "TV360_APP", name: "Ứng dụng TV360 trên Smart TV", desc: "Ứng dụng truyền hình giải trí đa nền tảng. Hỗ trợ xem trực tuyến phim HD và truyền hình độ nét cao không cần đầu thu.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-mobile-screen text-danger'></i>" },
        { id: "TV360_BOX", name: "Đầu thu TV360 Box (Android TV)", desc: "Thiết bị giải mã truyền hình số thông minh biến tivi thường thành Smart TV, hỗ trợ tìm kiếm giọng nói tiếng Việt.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-box text-warning'></i>" },
        { id: "TV360_KPLUS", name: "Gói Kênh Thể Thao K+ TV360", desc: "Đăng ký hoặc gia hạn nhóm kênh thể thao K+ trực tiếp Ngoại Hạng Anh độc quyền trên TV360.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-circle-play text-danger'></i>" },
        { id: "TV360_VIP", name: "Gói TV360 VIP Truyền Hình Cao Cấp", desc: "Gói dịch vụ cao cấp nhất của TV360, xem không giới hạn kho phim HBO, phim chiếu rạp và toàn bộ các kênh thể thao đỉnh cao K+.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-star text-danger'></i>" }
    ],
    "camera": [
        { id: "CAMERA_IN", name: "Home Camera Trong Nhà 360", desc: "Giải pháp giám sát an ninh trong nhà xoay 360 độ, tích hợp đàm thoại 2 chiều và công nghệ AI phát hiện chuyển động lạ.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-video text-success'></i>" },
        { id: "CAMERA_OUT", name: "Home Camera Ngoài Trời IP67", desc: "Thiết bị giám sát ngoài trời chống nước chống bụi chuẩn IP67, đàm thoại 2 chiều, ghi hình đêm có màu hồng ngoại.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-shield-halved text-success'></i>" },
        { id: "CAMERA_AI", name: "Camera AI Nhận Diện Thông Minh", desc: "Camera chuyên dụng tích hợp AI phát hiện và phân tích khuôn mặt, đếm người, cảnh báo xâm nhập và gửi thông báo trực tiếp qua ứng dụng.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-eye text-success'></i>" }
    ],
    "wifi": [
        { id: "WIFI_5", name: "Router WiFi 5 Băng Tần Kép", desc: "Bộ định tuyến không dây hỗ trợ 2 băng tần 2.4Ghz và 5Ghz chuẩn AC1200 cho khả năng xuyên tường phát sóng khỏe.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-wifi text-warning'></i>" },
        { id: "WIFI_MESH", name: "Thiết Bị WiFi Mesh (Home WiFi)", desc: "Hệ thống mở rộng vùng phủ sóng Wifi mesh không dây giúp phủ sóng toàn bộ căn hộ, tự động chuyển vùng mượt mà.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-network-wired text-warning'></i>" },
        { id: "WIFI_6_MESH", name: "Router Home Wifi 6 Mesh Cao Cấp", desc: "Thiết bị Wifi thế hệ mới nhất (Wi-Fi 6 AX3000) giảm nhiễu sóng hiệu quả, tăng tốc độ truy cập gấp 4 lần và hỗ trợ hơn 100 thiết bị kết nối cùng lúc.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-circle-nodes text-warning'></i>" }
    ],
    "cloud": [
        { id: "VPS", name: "Cloud VPS Viettel", desc: "Máy chủ ảo điện toán đám mây hiệu năng cao, hạ tầng trung tâm dữ liệu đạt chuẩn quốc tế Tier 3 của Viettel. Bảo mật an toàn, hỗ trợ giám sát 24/7.", status: "Đang bảo trì nâng cấp nhẹ", icon: "<i class='fa-solid fa-server text-info'></i>" },
        { id: "CLOUD_DRIVE", name: "Lưu Trữ Doanh Nghiệp Cloud Drive", desc: "Không gian lưu trữ, chia sẻ và đồng bộ hóa tài liệu doanh nghiệp bảo mật tuyệt đối trên nền tảng Cloud Viettel.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-cloud-arrow-up text-info'></i>" },
        { id: "CLOUD_STORAGE", name: "Cloud Storage Server Sao Lưu Dữ Liệu", desc: "Hệ thống lưu trữ đám mây phân tán dung lượng cực lớn cho sao lưu và khôi phục dữ liệu thảm họa (Disaster Recovery), cam kết SLA 99.99%.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-database text-info'></i>" }
    ],
    "tongdai": [
        { id: "HOTLINE", name: "Tổng đài ảo (vCloudCenter)", desc: "Hệ thống tổng đài chăm sóc khách hàng thông minh dành cho doanh nghiệp. Quản lý cuộc gọi chuyên nghiệp, ghi âm, thống kê và không cần chi phí lắp đặt phần cứng.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-phone text-secondary'></i>" },
        { id: "VCONTACT", name: "Giải Pháp Chăm Sóc Khách Hàng vContact", desc: "Tích hợp tổng đài, CRM quản lý liên hệ khách hàng thông minh tối ưu năng lực tổng đài viên.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-headset text-secondary'></i>" },
        { id: "AI_CALL_CENTER", name: "Tổng đài AI Call Center Thông Minh", desc: "Tích hợp trợ lý ảo AI tự động thực hiện cuộc gọi CSKH, xác nhận đơn hàng và xử lý ngôn ngữ tự nhiên thông minh theo kịch bản tùy biến.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-robot text-secondary'></i>" }
    ],
    "ca": [
        { id: "USB_TOKEN", name: "Cấu hình & Nhận diện USB Token", desc: "Hỗ trợ cài đặt driver USB Token Viettel-CA, sửa lỗi máy tính không nhận token, xung đột chữ ký số.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-key text-dark'></i>" },
        { id: "CA_RENEW", name: "Gia hạn chứng thư số Viettel-CA", desc: "Hỗ trợ thủ tục gia hạn, cập nhật chứng thư số mới lên hệ thống khai thuế, BHXH, Hải quan.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-arrows-rotate text-dark'></i>" },
        { id: "MYSIGN", name: "Chữ Ký Số Di Động MySign", desc: "Dịch vụ ký số từ xa bằng thiết bị di động không cần USB Token hoặc SIM CA, ký kết hợp đồng điện tử tiện lợi.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-signature text-dark'></i>" },
        { id: "VCONTRACT_SIGN", name: "Nền tảng Hợp đồng Điện tử vContract", desc: "Nền tảng hỗ trợ ký kết văn bản, hợp đồng điện tử trực tuyến nhanh chóng, đầy đủ tính pháp lý và bảo mật dữ liệu tuyệt đối.", status: "Hoạt động ổn định", icon: "<i class='fa-solid fa-file-signature text-dark'></i>" }
    ]
};

document.addEventListener('DOMContentLoaded', function () {
    // 1. Initialize Ticket Code & Date
    initTicketDetails();

    // 3. Appointment Switches Toggler
    initAppointmentToggler();

    // 4. Priority Radio Select Styles
    initPriorityCards();
    
    // 4.1 Request Type Dropdown arrow animation logic
    initRequestTypeDropdown();

    // 5. Drag & Drop File Upload & Preview Logic
    initFileUpload();

    // 6. Form Validation & SweetAlert2 Submission
    initFormSubmission();
    
    // Initial sync of radios
    syncRadioHighlights();
});

/**
 * Initialize Ticket Code & Dates
 */
function initTicketDetails() {
    // Read sequential counter from localStorage
    let currentCounter = localStorage.getItem('viettel_ticket_counter');
    if (!currentCounter) {
        currentCounter = 20260001;
        localStorage.setItem('viettel_ticket_counter', currentCounter);
    }
    
    // Set ticket code readonly field
    const ticketCodeInput = document.getElementById('ticketCode');
    if (ticketCodeInput) {
        ticketCodeInput.value = 'PHT-' + currentCounter;
    }

    // Set Dates
    const createdDateInput = document.getElementById('createdDate');
    const updatedDateInput = document.getElementById('updatedDate');
    const nowStr = getCurrentDateTimeString();

    if (createdDateInput) createdDateInput.value = nowStr;
    if (updatedDateInput) updatedDateInput.value = nowStr;
}

/**
 * Return formatted current date-time string (DD/MM/YYYY HH:MM:SS)
 */
function getCurrentDateTimeString() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

/**
 * Handle Service Selection Details Display
 */
/**
 * General helper to initialize custom dropdown mechanics
 */
function initCustomDropdown(wrapperId, hiddenSelectId, onSelectCallback) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return null;
    
    const trigger = wrapper.querySelector('.custom-dropdown-trigger');
    const menu = wrapper.querySelector('.custom-dropdown-menu');
    const hiddenSelect = document.getElementById(hiddenSelectId);
    
    if (!trigger || !menu || !hiddenSelect) return null;
    
    const selectedIconSpan = trigger.querySelector('.selected-icon');
    const selectedTextSpan = trigger.querySelector('.selected-text');

    // Toggle dropdown open/close
    trigger.addEventListener('click', function (e) {
        if (wrapper.classList.contains('disabled-wrapper')) return;
        e.stopPropagation();
        
        // Close all other open custom dropdowns first
        document.querySelectorAll('.custom-dropdown-wrapper').forEach(w => {
            if (w !== wrapper) {
                w.classList.remove('open');
                const m = w.querySelector('.custom-dropdown-menu');
                if (m) m.classList.remove('show');
            }
        });

        const isOpen = wrapper.classList.toggle('open');
        menu.classList.toggle('show', isOpen);
    });

    // Handle keyboard accessibility
    trigger.addEventListener('keydown', function (e) {
        if (wrapper.classList.contains('disabled-wrapper')) return;
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            trigger.click();
        } else if (e.key === 'Escape') {
            closeDropdown();
        }
    });

    function closeDropdown() {
        wrapper.classList.remove('open');
        menu.classList.remove('show');
    }

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
        if (!wrapper.contains(e.target)) {
            closeDropdown();
        }
    });

    // Bind option click logic
    function bindOptionEvents() {
        const items = menu.querySelectorAll('.custom-dropdown-item');
        items.forEach(item => {
            // Remove previous event listener (by cloning)
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', function (e) {
                e.stopPropagation();
                const val = this.getAttribute('data-value');
                const icon = this.getAttribute('data-icon') || '';
                const text = this.getAttribute('data-text') || this.querySelector('.item-name')?.textContent || val;
                const desc = this.getAttribute('data-desc') || '';

                // Set hidden select value
                hiddenSelect.value = val;

                // Update trigger UI
                if (selectedIconSpan) selectedIconSpan.innerHTML = icon;
                if (selectedTextSpan) selectedTextSpan.textContent = text;

                // Highlight item
                menu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
                newItem.classList.add('selected');

                wrapper.classList.add('has-value');

                // Close menu
                closeDropdown();

                // Dispatch native change event
                hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));

                // Fire custom callback if supplied
                if (typeof onSelectCallback === 'function') {
                    onSelectCallback(val, text, icon, desc, newItem);
                }
            });
        });
    }

    // Bind initial option events
    bindOptionEvents();

    // Listen to form reset
    const form = hiddenSelect.closest('form');
    if (form) {
        form.addEventListener('reset', function () {
            setTimeout(resetDropdown, 10);
        });
    }

    function resetDropdown() {
        if (selectedIconSpan) selectedIconSpan.innerHTML = '';
        const defaultText = hiddenSelect.options[0]?.text || 'Chọn...';
        if (selectedTextSpan) selectedTextSpan.textContent = defaultText;

        menu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
        wrapper.classList.remove('has-value');
        closeDropdown();
    }

    return {
        close: closeDropdown,
        reset: resetDropdown,
        bindOptions: bindOptionEvents,
        updateTrigger: function(text, icon) {
            if (selectedIconSpan) selectedIconSpan.innerHTML = icon || '';
            if (selectedTextSpan) selectedTextSpan.textContent = text;
        }
    };
}

// Flatpickr globals
let datePicker = null;
let startTimePicker = null;
let endTimePicker = null;

/**
 * Handle Appointment Toggle Radio Group Animation and Requirements
 */
function initAppointmentToggler() {
    const needAppointmentRadios = document.querySelectorAll('input[name="CanLichHen"]');
    const appointmentContainer = document.getElementById('appointmentContainer');
    const appointmentDate = document.getElementById('appointmentDate');
    const appointmentStartTime = document.getElementById('appointmentStartTime');
    const appointmentEndTime = document.getElementById('appointmentEndTime');
    const appointmentAddress = document.getElementById('appointmentAddress');
    const appointmentNote = document.getElementById('appointmentNote');

    if (needAppointmentRadios.length > 0 && appointmentContainer) {
        // Initialize Flatpickr for Date
        if (appointmentDate) {
            datePicker = flatpickr(appointmentDate, {
                locale: "vn",
                altInput: true,
                altFormat: "d/m/Y",
                dateFormat: "Y-m-d",
                altInputClass: "form-control form-control-custom border-start-0 ps-0 text-dark pointer",
                minDate: "today",
                disableMobile: true,
                placeholder: "Chọn ngày hẹn"
            });
        }

        // Initialize Flatpickr for Start Time
        if (appointmentStartTime) {
            startTimePicker = flatpickr(appointmentStartTime, {
                enableTime: true,
                noCalendar: true,
                dateFormat: "H:i",
                time_24hr: true,
                disableMobile: true,
                placeholder: "Bắt đầu"
            });
        }

        // Initialize Flatpickr for End Time
        if (appointmentEndTime) {
            endTimePicker = flatpickr(appointmentEndTime, {
                enableTime: true,
                noCalendar: true,
                dateFormat: "H:i",
                time_24hr: true,
                disableMobile: true,
                placeholder: "Kết thúc"
            });
        }

        needAppointmentRadios.forEach(radio => {
            radio.addEventListener('change', function () {
                if (this.value === 'Có') {
                    appointmentContainer.classList.remove('d-none');
                    appointmentContainer.classList.add('animate-slide-down');
                    // Make inputs required when active
                    if (datePicker && datePicker.altInput) {
                        datePicker.altInput.setAttribute('required', 'required');
                    } else if (appointmentDate) {
                        appointmentDate.setAttribute('required', 'required');
                    }
                    if (appointmentStartTime) appointmentStartTime.setAttribute('required', 'required');
                    if (appointmentEndTime) appointmentEndTime.setAttribute('required', 'required');
                    if (appointmentAddress) appointmentAddress.setAttribute('required', 'required');
                } else {
                    appointmentContainer.classList.add('d-none');
                    appointmentContainer.classList.remove('animate-slide-down');
                    // Remove requirements when inactive
                    if (datePicker && datePicker.altInput) {
                        datePicker.altInput.removeAttribute('required');
                    }
                    if (appointmentDate) {
                        appointmentDate.removeAttribute('required');
                    }
                    if (appointmentStartTime) appointmentStartTime.removeAttribute('required');
                    if (appointmentEndTime) appointmentEndTime.removeAttribute('required');
                    if (appointmentAddress) appointmentAddress.removeAttribute('required');
                    // Clear fields
                    if (datePicker) datePicker.clear();
                    if (startTimePicker) startTimePicker.clear();
                    if (endTimePicker) endTimePicker.clear();
                    if (appointmentAddress) appointmentAddress.value = '';
                    if (appointmentNote) appointmentNote.value = '';
                }
            });
        });

        // Initial setup based on checked radio on load (for reloads/validation failures)
        const selectedRadio = Array.from(needAppointmentRadios).find(r => r.checked);
        if (selectedRadio && selectedRadio.value === 'Có') {
            appointmentContainer.classList.remove('d-none');
            if (datePicker && datePicker.altInput) {
                datePicker.altInput.setAttribute('required', 'required');
            } else if (appointmentDate) {
                appointmentDate.setAttribute('required', 'required');
            }
            if (appointmentStartTime) appointmentStartTime.setAttribute('required', 'required');
            if (appointmentEndTime) appointmentEndTime.setAttribute('required', 'required');
            if (appointmentAddress) appointmentAddress.setAttribute('required', 'required');
        }
    }
}

/**
 * Custom click animations and styling updates for Priority Select cards
 */
function initPriorityCards() {
    const priorityRadios = document.querySelectorAll('input[name="MucDoUuTien"]');
    priorityRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Priority selection highlights
            document.querySelectorAll('.priority-card-label').forEach(label => {
                label.classList.remove('active');
            });
            if (this.checked) {
                const associatedLabel = document.querySelector(`label[for="${this.id}"]`);
                if (associatedLabel) {
                    associatedLabel.classList.add('active');
                }
            }
        });
    });
}

/**
 * Handle custom select dropdown visual active arrow rotation and option selections
 */
let categoryDropdownObj = null;
let serviceDropdownObj = null;
let requestTypeDropdownObj = null;

function initRequestTypeDropdown() {
    // 1. Initialize Request Type Dropdown
    const selectedDesc = document.getElementById('loaiYeuCauSelectedDesc');
    const descText = selectedDesc ? selectedDesc.querySelector('.desc-text') : null;
    
    requestTypeDropdownObj = initCustomDropdown('customDropdownWrapper', 'loaiYeuCau', function(val, text, icon, desc) {
        if (selectedDesc && descText) {
            descText.textContent = desc;
            selectedDesc.classList.remove('d-none');
        }
    });

    // 2. Initialize Service Category Dropdown
    const serviceSelect = document.getElementById('relatedService');
    const serviceDetailsWrapper = document.getElementById('serviceDetailsWrapper');
    const serviceNameDisplay = document.getElementById('serviceNameDisplay');
    const serviceDescDisplay = document.getElementById('serviceDescDisplay');
    const serviceStatusDisplay = document.getElementById('serviceStatusDisplay');

    categoryDropdownObj = initCustomDropdown('categoryDropdownWrapper', 'serviceCategory', function(val, text, icon, desc) {
        // Reset related select and custom options
        if (serviceSelect) {
            serviceSelect.value = "";
        }
        
        const serviceMenu = document.getElementById('serviceDropdownMenu');
        const serviceWrapper = document.getElementById('serviceDropdownWrapper');
        
        if (serviceDetailsWrapper) {
            serviceDetailsWrapper.classList.add('d-none');
        }
        
        if (serviceDropdownObj) {
            serviceDropdownObj.updateTrigger('Chọn dịch vụ...', '');
            const serviceWrapperEl = document.getElementById('serviceDropdownWrapper');
            if (serviceWrapperEl) {
                serviceWrapperEl.classList.remove('has-value');
            }
        }

        if (val) {
            if (serviceSelect) serviceSelect.disabled = false;
            if (serviceWrapper) {
                serviceWrapper.classList.remove('disabled-wrapper');
            }
            
            // Filter native select options
            if (serviceSelect) {
                const options = serviceSelect.querySelectorAll('option');
                options.forEach(opt => {
                    if (opt.value === "") return;
                    if (opt.getAttribute('data-category') === val) {
                        opt.disabled = false;
                        opt.style.display = "block";
                    } else {
                        opt.disabled = true;
                        opt.style.display = "none";
                    }
                });
            }

            // Filter custom dropdown menu items
            if (serviceMenu) {
                const items = serviceMenu.querySelectorAll('.custom-dropdown-item');
                items.forEach(item => {
                    if (item.getAttribute('data-category') === val) {
                        item.style.display = "flex";
                    } else {
                        item.style.display = "none";
                    }
                });
            }
        } else {
            if (serviceSelect) serviceSelect.disabled = true;
            if (serviceWrapper) {
                serviceWrapper.classList.add('disabled-wrapper');
            }
            if (serviceMenu) {
                serviceMenu.querySelectorAll('.custom-dropdown-item').forEach(item => {
                    item.style.display = "none";
                });
            }
        }
    });

    // 3. Initialize Service Dropdown
    serviceDropdownObj = initCustomDropdown('serviceDropdownWrapper', 'relatedService', function(val, text, icon, desc) {
        const catVal = document.getElementById('serviceCategory').value;
        const services = categoriesServicesData[catVal];
        const details = services ? services.find(s => s.id === val) : null;

        if (details && serviceDetailsWrapper) {
            if (serviceNameDisplay) serviceNameDisplay.textContent = details.name;
            if (serviceDescDisplay) serviceDescDisplay.textContent = details.desc;
            if (serviceStatusDisplay) serviceStatusDisplay.textContent = details.status;

            if (serviceStatusDisplay) {
                if (details.status.includes("bảo trì") || details.status.includes("nâng cấp")) {
                    serviceStatusDisplay.className = "badge ms-auto bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 rounded";
                } else {
                    serviceStatusDisplay.className = "badge ms-auto bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded";
                }
            }

            serviceDetailsWrapper.classList.remove('d-none');
        } else {
            if (serviceDetailsWrapper) serviceDetailsWrapper.classList.add('d-none');
        }
    });

    // Setup form reset listener to clean up details
    const form = document.getElementById('supportTicketForm');
    if (form) {
        form.addEventListener('reset', function () {
            setTimeout(() => {
                if (serviceDetailsWrapper) serviceDetailsWrapper.classList.add('d-none');
                if (selectedDesc) selectedDesc.classList.add('d-none');
                if (serviceSelect) serviceSelect.disabled = true;
                const serviceWrapper = document.getElementById('serviceDropdownWrapper');
                if (serviceWrapper) serviceWrapper.classList.add('disabled-wrapper');
                const serviceMenu = document.getElementById('serviceDropdownMenu');
                if (serviceMenu) {
                    serviceMenu.querySelectorAll('.custom-dropdown-item').forEach(item => {
                        item.style.display = 'none';
                    });
                }
            }, 15);
        });
    }
}

/**
 * Sync active classes of custom labels on form load/reset
 */
function syncRadioHighlights() {
    document.querySelectorAll('input[name="MucDoUuTien"]').forEach(radio => {
        const label = document.querySelector(`label[for="${radio.id}"]`);
        if (label) {
            if (radio.checked) label.classList.add('active');
            else label.classList.remove('active');
        }
    });
}

/**
 * Drag & Drop File Upload Area with preview & delete handlers
 */
function initFileUpload() {
    const dragDropArea = document.getElementById('dragDropArea');
    const fileInput = document.getElementById('ticketFileInput');
    const previewGrid = document.getElementById('filePreviewGrid');
    
    let uploadedFiles = []; // Local file store

    if (!dragDropArea || !fileInput || !previewGrid) return;

    // Trigger file chooser
    dragDropArea.addEventListener('click', () => fileInput.click());

    // Highlight area when dragging files over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            dragDropArea.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            dragDropArea.classList.remove('dragover');
        }, false);
    });

    // Handle dropped files
    dragDropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    // Handle selected files
    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });

    function syncFileInput() {
        const dataTransfer = new DataTransfer();
        uploadedFiles.forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
    }

    function handleFiles(files) {
        const validExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'docx'];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const extension = file.name.split('.').pop().toLowerCase();
            const sizeMB = file.size / (1024 * 1024);

            if (!validExtensions.includes(extension)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Định dạng không hỗ trợ',
                    text: `Tệp ${file.name} không hợp lệ. Chỉ chấp nhận các định dạng JPG, PNG, PDF, DOCX.`,
                    confirmButtonColor: '#EE0033'
                });
                continue;
            }

            if (sizeMB > 5) {
                Swal.fire({
                    icon: 'error',
                    title: 'Dung lượng tệp quá lớn',
                    text: `Tệp ${file.name} vượt quá dung lượng tối đa 5MB.`,
                    confirmButtonColor: '#EE0033'
                });
                continue;
            }

            uploadedFiles.push(file);
        }

        syncFileInput();
        renderPreviews();
    }

    function renderPreviews() {
        previewGrid.innerHTML = '';

        if (uploadedFiles.length === 0) {
            previewGrid.classList.add('d-none');
            return;
        }

        previewGrid.classList.remove('d-none');

        uploadedFiles.forEach((file, index) => {
            const col = document.createElement('div');
            col.className = 'preview-item';

            // Check if file is image to render thumbnail
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.onload = () => URL.revokeObjectURL(img.src);
                col.appendChild(img);
            } else {
                // Render PDF or Word document icon
                const icon = document.createElement('i');
                if (file.name.endsWith('.pdf')) {
                    icon.className = 'fa-solid fa-file-pdf preview-file-icon';
                } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
                    icon.className = 'fa-solid fa-file-word preview-file-icon';
                } else {
                    icon.className = 'fa-solid fa-file-lines preview-file-icon';
                }
                col.appendChild(icon);
            }

            // File Details Label
            const details = document.createElement('div');
            details.className = 'preview-file-details';
            details.textContent = file.name;
            col.appendChild(details);

            // Close / Delete Button
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'preview-item-remove';
            removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                uploadedFiles.splice(index, 1);
                syncFileInput();
                renderPreviews();
            });
            col.appendChild(removeBtn);

            previewGrid.appendChild(col);
        });
    }
}

/**
 * Bootstrap 5 form validation and SweetAlert2 confirmation sequence
 */
function initFormSubmission() {
    const form = document.getElementById('supportTicketForm');
    
    if (!form) return;

    // Toast Alert setup
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();

        // Perform standard validity check
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            // Scroll to the first invalid field
            const firstInvalid = form.querySelector('.form-control:invalid, .form-select:invalid, .form-check-input:invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalid.focus();
            }
            
            Toast.fire({
                icon: 'warning',
                title: 'Vui lòng điền đầy đủ và xác nhận thông tin!'
            });
            return;
        }

        form.classList.add('was-validated');

        // Extract values for validation preview confirmation
        const ticketCodeVal = document.getElementById('ticketCode')?.value || '';
        const titleVal = document.getElementById('ticketTitle')?.value || '';
        
        const categorySelect = document.getElementById('IdDanhMuc');
        const categoryName = categorySelect ? categorySelect.options[categorySelect.selectedIndex]?.text : '';
        
        const serviceSelect = document.getElementById('IdDichVu');
        const serviceName = serviceSelect ? serviceSelect.options[serviceSelect.selectedIndex]?.text : '';
        
        const priorityEl = document.querySelector('input[name="MucDoUuTien"]:checked');
        let priorityVal = 'Trung Bình';
        if (priorityEl) {
            const val = priorityEl.value;
            if (val === '1') priorityVal = 'Thấp';
            else if (val === '2') priorityVal = 'Trung Bình';
            else if (val === '3') priorityVal = 'Cao';
            else if (val === '4') priorityVal = 'Khẩn Cấp';
        }
        
        const loaiYeuCauSelect = document.getElementById('LoaiYeuCau');
        const requestTypeVal = loaiYeuCauSelect ? loaiYeuCauSelect.value : '';

        // Trigger SweetAlert2 Dialog
        Swal.fire({
            title: 'Xác Nhận Gửi Phiếu Hỗ Trợ?',
            html: `
                <div class="swal-confirm-details mb-3">
                    <div class="swal-detail-row">
                        <span class="swal-detail-label"><i class="bi bi-hashtag me-1 text-danger"></i> Mã phiếu</span>
                        <span class="swal-detail-value text-danger font-monospace">${ticketCodeVal}</span>
                    </div>
                    <div class="swal-detail-row">
                        <span class="swal-detail-label"><i class="bi bi-card-heading me-1 text-secondary"></i> Tiêu đề sự cố</span>
                        <span class="swal-detail-value">${titleVal}</span>
                    </div>
                    <div class="swal-detail-row">
                        <span class="swal-detail-label"><i class="bi bi-grid me-1 text-secondary"></i> Danh mục</span>
                        <span class="swal-detail-value">${categoryName}</span>
                    </div>
                    <div class="swal-detail-row">
                        <span class="swal-detail-label"><i class="bi bi-gear me-1 text-secondary"></i> Dịch vụ</span>
                        <span class="swal-detail-value">${serviceName}</span>
                    </div>
                    <div class="swal-detail-row">
                        <span class="swal-detail-label"><i class="bi bi-tag me-1 text-secondary"></i> Loại yêu cầu</span>
                        <span class="swal-detail-value">${requestTypeVal}</span>
                    </div>
                    <div class="swal-detail-row">
                        <span class="swal-detail-label"><i class="bi bi-shield-exclamation me-1 text-secondary"></i> Mức độ ưu tiên</span>
                        <span class="swal-detail-value">${getPriorityBadgeHtml(priorityVal)}</span>
                    </div>
                </div>
                <div class="swal-notice-box">
                    <i class="bi bi-clock-history me-2 text-danger fs-6"></i>
                    <span>Đội ngũ kỹ thuật Viettel sẽ phản hồi phiếu hỗ trợ trong vòng 15 - 30 phút.</span>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-send-fill me-1"></i> Xác nhận gửi',
            cancelButtonText: 'Hủy bỏ',
            focusConfirm: false
        }).then((result) => {
            if (result.isConfirmed) {
                // Show loading panel
                Swal.fire({
                    title: 'Đang xử lý yêu cầu...',
                    html: 'Vui lòng chờ giây lát trong khi phiếu được khởi tạo trên hệ thống.',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Submit form natively
                form.submit();
            }
        });
    });
}

/**
 * Return Bootstrap badge HTML matching priorities
 */
function getPriorityBadgeHtml(priority) {
    switch(priority) {
        case 'Khẩn Cấp': return '<span class="badge bg-danger text-white px-2.5 py-1 rounded-pill fw-bold"><i class="bi bi-exclamation-triangle-fill me-1"></i>Khẩn Cấp</span>';
        case 'Cao': return '<span class="badge bg-danger text-white px-2.5 py-1 rounded-pill fw-bold" style="background-color: #f97316 !important;"><i class="bi bi-lightning-charge-fill me-1"></i>Cao</span>';
        case 'Trung Bình': return '<span class="badge bg-warning text-dark px-2.5 py-1 rounded-pill fw-bold"><i class="bi bi-dash-circle-fill me-1"></i>Trung Bình</span>';
        default: return '<span class="badge bg-success text-white px-2.5 py-1 rounded-pill fw-bold"><i class="bi bi-arrow-down-circle-fill me-1"></i>Thấp</span>';
    }
}
