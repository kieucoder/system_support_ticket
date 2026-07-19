/* -------------------------------------------------------------
 * FILE: assets/js/online-support.js
 * AUTHOR: Senior UI/UX Designer & Frontend Developer
 * DESCRIPTION: Handles layout toggling, dark mode states,
 *              attachment previews, auto scrolling, and ripples.
 * ------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    // Initialize all chat modules
    initDarkMode();
    initSidebarDrawer();
    initInfoPanelToggle();
    initChatScroll();
    initEmojiPicker();
    initFileUploadPreview();
    bindButtonRipples();
    initChatInputActions();
});

/* =============================================================
   1. DARK MODE MANAGER (UI-only Persistence)
   ============================================================= */
function initDarkMode() {
    const themeBtn = document.getElementById("toggleThemeBtn");
    if (!themeBtn) return;

    const icon = themeBtn.querySelector("i");
    
    // Check local storage for saved theme preference
    const savedTheme = localStorage.getItem("techsupport-chat-theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-theme");
        if (icon) {
            icon.className = "bi bi-sun-fill";
            themeBtn.title = "Chuyển sang Giao diện sáng";
        }
    }

    themeBtn.addEventListener("click", function () {
        document.body.classList.toggle("dark-theme");
        const isDark = document.body.classList.contains("dark-theme");
        
        localStorage.setItem("techsupport-chat-theme", isDark ? "dark" : "light");
        
        if (icon) {
            icon.className = isDark ? "bi bi-sun-fill" : "bi bi-moon-fill";
            themeBtn.title = isDark ? "Chuyển sang Giao diện sáng" : "Chuyển sang Giao diện tối";
        }
    });
}

/* =============================================================
   2. MOBILE DRAWER SIDEBAR TOGGLE
   ============================================================= */
function initSidebarDrawer() {
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const sidebar = document.getElementById("chatSidebar");
    const backBtn = document.getElementById("mobileBackBtn");
    
    if (!sidebar) return;

    // Create dynamic backdrop overlay if it doesn't exist
    let backdrop = document.querySelector(".drawer-overlay-backdrop");
    if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.className = "drawer-overlay-backdrop";
        document.querySelector(".chat-console-wrapper").appendChild(backdrop);
    }

    // Toggle drawer open
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener("click", function () {
            sidebar.classList.add("show");
            backdrop.classList.add("show");
        });
    }

    // Close drawer
    function closeDrawer() {
        sidebar.classList.remove("show");
        backdrop.classList.remove("show");
    }

    if (backBtn) {
        backBtn.addEventListener("click", closeDrawer);
    }

    backdrop.addEventListener("click", closeDrawer);

    // Close on conversation item selection on mobile
    const convoCards = sidebar.querySelectorAll(".convo-item-card");
    convoCards.forEach(card => {
        card.addEventListener("click", function () {
            if (window.innerWidth < 768) {
                closeDrawer();
            }
            
            // Mark active convo
            convoCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            
            // Simulating switching chat active user in header (static elements)
            const staffName = card.querySelector(".convo-name").textContent;
            const staffRole = card.querySelector(".convo-role-meta").textContent;
            const staffAvatarSrc = card.querySelector(".convo-avatar").src;
            
            document.getElementById("chatActiveName").textContent = staffName;
            document.getElementById("chatActiveRole").textContent = staffRole;
            document.getElementById("chatActiveAvatar").src = staffAvatarSrc;
            
            // Also update right profile details
            document.getElementById("infoStaffName").textContent = staffName;
            document.getElementById("infoStaffAvatar").src = staffAvatarSrc;
        });
    });
}

/* =============================================================
   3. PROFILE INFORMATION PANEL TOGGLE
   ============================================================= */
function initInfoPanelToggle() {
    const toggleBtn = document.getElementById("toggleInfoBtn");
    const infoPanel = document.getElementById("chatInfoPanel");
    const closeBtn = document.getElementById("closeInfoBtn");

    if (!infoPanel) return;

    if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
            infoPanel.classList.toggle("show");
            toggleBtn.classList.toggle("active");
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", function () {
            infoPanel.classList.remove("show");
            if (toggleBtn) toggleBtn.classList.remove("active");
        });
    }
}

/* =============================================================
   4. CHAT BODY AUTO SCROLL
   ============================================================= */
function initChatScroll() {
    const chatBody = document.getElementById("chatStreamBody");
    if (!chatBody) return;

    // Scroll directly to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
}

function smoothScrollToBottom() {
    const chatBody = document.getElementById("chatStreamBody");
    if (!chatBody) return;

    chatBody.classList.add("smooth-scroll-active");
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // Disable smooth scroll after completion to prevent mouse drag scroll issues
    setTimeout(() => {
        chatBody.classList.remove("smooth-scroll-active");
    }, 500);
}

/* =============================================================
   5. MOCK EMOJI PICKER POPUP
   ============================================================= */
function initEmojiPicker() {
    const emojiBtn = document.getElementById("chatEmojiBtn");
    const picker = document.getElementById("emojiPickerPopover");
    const textarea = document.getElementById("chatInputField");

    if (!emojiBtn || !picker || !textarea) return;

    emojiBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        picker.classList.toggle("show");
    });

    document.addEventListener("click", function (e) {
        if (!picker.contains(e.target) && e.target !== emojiBtn) {
            picker.classList.remove("show");
        }
    });

    // Handle emoji click
    const emojis = picker.querySelectorAll(".emoji-item");
    emojis.forEach(emoji => {
        emoji.addEventListener("click", function () {
            textarea.value += emoji.textContent;
            picker.classList.remove("show");
            textarea.focus();
        });
    });
}

/* =============================================================
   6. FILE UPLOAD PREVIEW UI MOCKUP
   ============================================================= */
function initFileUploadPreview() {
    const uploadBtn = document.getElementById("chatUploadBtn");
    const fileInput = document.getElementById("hiddenFileInput");
    const previewBox = document.getElementById("uploadPreviewBox");
    const previewName = document.getElementById("uploadPreviewName");
    const previewCancel = document.getElementById("uploadPreviewCancel");

    if (!uploadBtn || !fileInput || !previewBox) return;

    uploadBtn.addEventListener("click", function () {
        fileInput.click();
    });

    fileInput.addEventListener("change", function () {
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            previewName.textContent = fileName;
            previewBox.style.display = "flex";
        }
    });

    if (previewCancel) {
        previewCancel.addEventListener("click", function () {
            fileInput.value = "";
            previewBox.style.display = "none";
        });
    }
}

/* =============================================================
   7. DYNAMIC BUTTON CLICK RIPPLE EFFECT
   ============================================================= */
function bindButtonRipples() {
    const rippleButtons = document.querySelectorAll(".btn-ripple");
    
    rippleButtons.forEach(button => {
        button.addEventListener("click", function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement("span");
            ripple.className = "ripple-span";
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            this.appendChild(ripple);

            ripple.addEventListener("animationend", function () {
                ripple.remove();
            });
        });
    });
}

/* =============================================================
   8. INPUT & TEXTAREA AUTO-RESIZE AND MOCK SEND ACTION
   ============================================================= */
function initChatInputActions() {
    const textarea = document.getElementById("chatInputField");
    const sendBtn = document.getElementById("sendChatBtn");
    const chatBody = document.getElementById("chatStreamBody");
    const fileInput = document.getElementById("hiddenFileInput");
    const previewBox = document.getElementById("uploadPreviewBox");

    if (!textarea || !sendBtn || !chatBody) return;

    // Auto resize textarea
    textarea.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = `${Math.min(this.scrollHeight, 120)}px`;
    });

    // Mock send message (purely appends the typed text client-side to see UX transitions)
    function handleSendMessage() {
        const text = textarea.value.trim();
        const fileAttached = fileInput && fileInput.files.length > 0;
        
        if (text === "" && !fileAttached) return;

        // Create bubble row element
        const msgRow = document.createElement("div");
        msgRow.className = "chat-msg-row customer-row";

        // Bubble content wrapper
        const wrapper = document.createElement("div");
        wrapper.className = "chat-msg-content-wrapper";

        const bubble = document.createElement("div");
        bubble.className = "chat-msg-bubble";

        // Handle text message
        if (text !== "") {
            bubble.textContent = text;
        }

        // Handle attachment preview display inside message stream
        if (fileAttached) {
            const fileName = fileInput.files[0].name;
            const attachContainer = document.createElement("div");
            attachContainer.className = "mt-2 pt-2 border-top small d-flex align-items-center gap-2";
            attachContainer.innerHTML = `<i class="fa-solid fa-file-pdf text-danger"></i> <strong>${fileName}</strong>`;
            bubble.appendChild(attachContainer);
        }

        wrapper.appendChild(bubble);

        // Append timestamp and read ticks
        const metaRow = document.createElement("div");
        metaRow.className = "d-flex gap-2 align-items-center mt-1";
        
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        metaRow.innerHTML = `
            <span class="chat-msg-time" style="margin:0">${timeStr}</span>
            <span class="chat-msg-status"><i class="bi bi-check-all"></i> Đã gửi</span>
        `;
        wrapper.appendChild(metaRow);
        msgRow.appendChild(wrapper);
        
        // Append row to stream body
        chatBody.appendChild(msgRow);

        // Reset input fields
        textarea.value = "";
        textarea.style.height = "40px";
        
        if (fileInput) fileInput.value = "";
        if (previewBox) previewBox.style.display = "none";

        smoothScrollToBottom();
    }

    sendBtn.addEventListener("click", handleSendMessage);

    textarea.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
}
