/* ==========================================================================
   VIETTEL TECHSUPPORT - TICKET SCHEDULING DASHBOARD (LIST VIEW JAVASCRIPT)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
    // --- 1. THEME MANAGEMENT (DARK MODE) ---
    const htmlElement = document.documentElement;
    const themeToggleBtn = document.getElementById("darkThemeToggle");

    if (themeToggleBtn) {
        const toggleIcon = themeToggleBtn.querySelector("i");
        const savedTheme = localStorage.getItem("staff-theme") || "light";
        htmlElement.setAttribute("data-bs-theme", savedTheme);
        updateThemeIcon(savedTheme);

        themeToggleBtn.addEventListener("click", function () {
            const currentTheme = htmlElement.getAttribute("data-bs-theme");
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            htmlElement.setAttribute("data-bs-theme", newTheme);
            localStorage.setItem("staff-theme", newTheme);
            updateThemeIcon(newTheme);
        });

        function updateThemeIcon(theme) {
            if (!toggleIcon) return;
            if (theme === "dark") {
                toggleIcon.className = "bi bi-sun-fill text-warning";
            } else {
                toggleIcon.className = "bi bi-moon-stars-fill text-secondary";
            }
        }
    }

    // --- 2. DRAWER SLIDE-OVER MANAGEMENT (420px PANEL) ---
    const drawerPanel = document.getElementById("slideOverDrawer");
    const drawerOverlay = document.getElementById("drawerOverlay");
    const closeDrawerBtn = document.getElementById("closeDrawerBtn");

    const tableRows = document.querySelectorAll(".table-custom-management tbody tr[data-id], .table-list-jira tbody tr[data-id]");

    tableRows.forEach(row => {
        row.addEventListener("click", function (e) {
            // If click was inside action menu dropdown, skip opening drawer
            if (e.target.closest(".dropdown") || e.target.closest("button")) {
                return;
            }

            tableRows.forEach(r => r.classList.remove("is-selected-row"));
            this.classList.add("is-selected-row");

            populateDrawerFromRow(this);
            openDrawer();
        });
    });

    // Also handle click on timeline hour points
    document.querySelectorAll(".timeline-hour-step[data-id]").forEach(node => {
        node.addEventListener("click", function () {
            const apptId = this.getAttribute("data-id");
            const targetRow = document.querySelector(`tbody tr[data-id="${apptId}"]`);
            if (targetRow) {
                targetRow.click();
                targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });

    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener("click", closeDrawer);
    }
    if (drawerOverlay) {
        drawerOverlay.addEventListener("click", closeDrawer);
    }

    function openDrawer() {
        if (drawerPanel) drawerPanel.classList.add("show");
        if (drawerOverlay) drawerOverlay.classList.add("show");
    }

    function closeDrawer() {
        if (drawerPanel) drawerPanel.classList.remove("show");
        if (drawerOverlay) drawerOverlay.classList.remove("show");
    }

    function populateDrawerFromRow(row) {
        const id = row.getAttribute("data-id");
        const code = row.getAttribute("data-code") || "–";
        const client = row.getAttribute("data-client") || "–";
        const phone = row.getAttribute("data-phone") || "–";
        const email = row.getAttribute("data-email") || "–";
        const address = row.getAttribute("data-address") || "–";
        const service = row.getAttribute("data-service") || "–";
        const cat = row.getAttribute("data-cat") || "–";
        const priority = row.getAttribute("data-priority") || "Bình thường";
        const tech = row.getAttribute("data-tech") || "Chưa phân công";
        const techPhone = row.getAttribute("data-techphone") || "–";
        const date = row.getAttribute("data-date") || "–";
        const time = row.getAttribute("data-time") || "–";
        const status = row.getAttribute("data-status") || "Chờ xác nhận";
        const notes = row.getAttribute("data-notes") || "Không có ghi chú.";
        const maps = row.getAttribute("data-maps") || "#";

        // Populate Ticket Info
        setText("dw-code", code);
        setText("dw-cat", cat);
        setText("dw-service", service);
        setText("dw-priority", priority);

        // Populate Customer Info
        setText("dw-client", client);
        setText("dw-phone", phone);
        if (document.getElementById("dw-phone-link")) {
            document.getElementById("dw-phone-link").href = "tel:" + phone;
        }
        setText("dw-email", email);
        setText("dw-address", address);

        // Populate Appointment Info
        setText("dw-date", date);
        setText("dw-time", time);
        setText("dw-tech", tech);
        setText("dw-techphone", techPhone);
        setText("dw-status", status);
        setText("dw-notes", notes);
        if (document.getElementById("dw-maps-btn")) {
            document.getElementById("dw-maps-btn").href = maps;
        }

        // Set hidden IDs in modal forms if chiTiet exists
        document.querySelectorAll("input[name='id']").forEach(input => {
            input.value = id;
        });
    }

    function setText(elemId, value) {
        const el = document.getElementById(elemId);
        if (el) el.innerText = value;
    }

    // --- 3. SEARCH & TABLE LIVE FILTERING ---
    const tableSearchInput = document.getElementById("tableSearchInput");
    if (tableSearchInput) {
        tableSearchInput.addEventListener("input", function () {
            const query = this.value.toLowerCase().trim();

            tableRows.forEach(row => {
                const textContent = row.innerText.toLowerCase();
                if (textContent.includes(query)) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            });
        });
    }

    // Check if initial selected row exists
    const initialSelectedRow = document.querySelector("tbody tr.is-selected-row");
    if (initialSelectedRow) {
        populateDrawerFromRow(initialSelectedRow);
        openDrawer();
    }
});
