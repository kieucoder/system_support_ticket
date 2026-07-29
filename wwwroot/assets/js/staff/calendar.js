/* ==========================================================================
   VIETTEL TECHSUPPORT - STAFF CALENDAR MANAGEMENT (JAVASCRIPT)
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

    // --- 2. CALENDAR VIEW MODE CONTROLLER (Month / Week / Day) ---
    const viewModeButtons = document.querySelectorAll(".btn-view-mode");
    const viewIndicator = document.getElementById("viewIndicator");

    viewModeButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            viewModeButtons.forEach(b => b.classList.remove("active"));
            this.classList.add("active");

            const mode = this.getAttribute("data-mode");
            setViewMode(mode);
        });
    });

    function setViewMode(mode) {
        if (!viewIndicator) return;
        if (mode === "month") {
            viewIndicator.innerText = "Chế độ xem: Tháng";
            showMonthView();
        } else if (mode === "week") {
            viewIndicator.innerText = "Chế độ xem: Tuần";
            showWeekView();
        } else if (mode === "day") {
            viewIndicator.innerText = "Chế độ xem: Ngày";
            showDayView();
        }
    }

    function showMonthView() {
        document.querySelectorAll(".calendar-day-cell, .calendar-cell-day").forEach(cell => {
            cell.style.display = "";
            cell.style.width = "";
        });
        const header = document.querySelector(".calendar-header-grid, .calendar-header-weekdays");
        if (header) header.style.display = "";
    }

    function showWeekView() {
        showMonthView(); // Default grid preview
    }

    function showDayView() {
        showMonthView();
    }

    // --- 3. TIMELINE & HOURS CLICK INTEGRATION ---
    document.querySelectorAll(".hour-event-tag[data-id], .timeline-hour-node[data-hour]").forEach(el => {
        el.addEventListener("click", function (e) {
            e.stopPropagation();
            let apptId = this.getAttribute("data-id");
            if (!apptId) return;

            let card = document.querySelector(`.appt-event-chip[data-id="${apptId}"], .calendar-event-card[data-id="${apptId}"]`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.classList.add("flash-highlight");
                setTimeout(() => card.classList.remove("flash-highlight"), 2000);

                setTimeout(() => {
                    if (card.getAttribute("href")) {
                        window.location.href = card.getAttribute("href");
                    }
                }, 400);
            }
        });
    });

    // --- 4. RESPONSIVE SIDEBAR DRAWER SYSTEM ---
    const sidebarContainer = document.getElementById("sidebarContainer");
    const drawerBackdrop = document.getElementById("drawerBackdrop");
    const closeDrawerBtn = document.getElementById("closeSidebarDrawer");

    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener("click", closeDrawer);
    }
    if (drawerBackdrop) {
        drawerBackdrop.addEventListener("click", closeDrawer);
    }

    function closeDrawer() {
        if (sidebarContainer) sidebarContainer.classList.remove("show-drawer");
        if (drawerBackdrop) drawerBackdrop.classList.remove("show-drawer");
    }

    // --- 5. RIPPLE CLICK ANIMATION EFFECT ---
    document.querySelectorAll(".btn-ripple").forEach(btn => {
        btn.addEventListener("click", function (e) {
            let x = e.clientX - e.target.getBoundingClientRect().left;
            let y = e.clientY - e.target.getBoundingClientRect().top;

            let ripple = document.createElement("span");
            ripple.style.left = x + "px";
            ripple.style.top = y + "px";
            ripple.className = "ripple-span";

            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 1000);
        });
    });

    // Scroll active elements into view on startup
    const activeCard = document.querySelector(".appt-event-chip.active, .calendar-event-card.active");
    if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});
