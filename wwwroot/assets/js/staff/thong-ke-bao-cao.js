/**
 * thong-ke-bao-cao.js
 * Chart.js + Counter Animation + Export Excel/PDF/Print
 * Viettel TechSupport — Báo cáo & Thống kê
 */

'use strict';

// ================================================================
// HELPERS
// ================================================================
const VTColors = {
    red:    '#D71920',
    redL:   'rgba(215,25,32,0.15)',
    blue:   '#3b82f6',
    blueL:  'rgba(59,130,246,0.15)',
    green:  '#22c55e',
    greenL: 'rgba(34,197,94,0.15)',
    orange: '#f97316',
    orangeL:'rgba(249,115,22,0.15)',
    gray:   '#94a3b8',
    grayL:  'rgba(148,163,184,0.15)',
    purple: '#a855f7',
    purpleL:'rgba(168,85,247,0.15)',
    teal:   '#14b8a6',
    tealL:  'rgba(20,184,166,0.15)',
    amber:  '#f59e0b',
    amberL: 'rgba(245,158,11,0.15)',
    pink:   '#ec4899',
};

const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                font: { family: 'Inter', size: 12, weight: '500' },
                padding: 16,
                usePointStyle: true,
                pointStyleWidth: 8,
            }
        },
        tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { family: 'Inter', weight: '700', size: 12 },
            bodyFont:  { family: 'Inter', size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {},
        }
    },
    animation: { duration: 900, easing: 'easeOutQuart' }
};

function isDarkMode() {
    return document.documentElement.getAttribute('data-bs-theme') === 'dark';
}

function gridColor() {
    return isDarkMode() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
}

function tickColor() {
    return isDarkMode() ? '#9fa8da' : '#94a3b8';
}

// ================================================================
// COUNTER ANIMATION
// ================================================================
function animateCounter(el, target, duration = 1200) {
    if (!el) return;
    const isFloat = target % 1 !== 0;
    const start = performance.now();
    const from = 0;

    function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = from + (target - from) * ease;
        el.textContent = isFloat ? current.toFixed(1) : Math.round(current).toLocaleString('vi-VN');
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function initCounters() {
    document.querySelectorAll('[data-counter]').forEach(el => {
        const val = parseFloat(el.getAttribute('data-counter')) || 0;
        animateCounter(el, val);
    });
}

// ================================================================
// CHART 1: Phiếu theo Tháng (Bar)
// ================================================================
function initChartThang(labels, data) {
    const ctx = document.getElementById('chartThang');
    if (!ctx) return null;

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Số phiếu',
                data,
                backgroundColor: labels.map((_, i) =>
                    i === labels.length - 1 ? VTColors.red : VTColors.redL),
                borderColor: labels.map((_, i) =>
                    i === labels.length - 1 ? VTColors.red : 'rgba(215,25,32,0.4)'),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            ...chartDefaults,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', size: 11 }, color: tickColor() }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor() },
                    ticks: {
                        font: { family: 'Inter', size: 11 },
                        color: tickColor(),
                        stepSize: 1,
                        precision: 0
                    }
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                legend: { display: false },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        label: ctx => ` ${ctx.parsed.y} phiếu`
                    }
                }
            }
        }
    });
}

// ================================================================
// CHART 2: Trạng thái (Doughnut)
// ================================================================
function initChartTrangThai(choXuLy, dangXuLy, hoanThanh, daHuy) {
    const ctx = document.getElementById('chartTrangThai');
    if (!ctx) return null;

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Chờ xử lý', 'Đang xử lý', 'Hoàn thành', 'Đã hủy'],
            datasets: [{
                data: [choXuLy, dangXuLy, hoanThanh, daHuy],
                backgroundColor: [VTColors.orange, VTColors.blue, VTColors.green, VTColors.gray],
                borderColor: '#fff',
                borderWidth: 3,
                hoverOffset: 8,
            }]
        },
        options: {
            ...chartDefaults,
            cutout: '70%',
            plugins: {
                ...chartDefaults.plugins,
                legend: {
                    position: 'bottom',
                    labels: { ...chartDefaults.plugins.legend.labels }
                },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        label: ctx => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ================================================================
// CHART 3: Top Dịch vụ (Horizontal Bar)
// ================================================================
function initChartDichVu(labels, data) {
    const ctx = document.getElementById('chartDichVu');
    if (!ctx) return null;

    const colors = [
        VTColors.red, VTColors.blue, VTColors.green, VTColors.orange, VTColors.purple,
        VTColors.teal, VTColors.amber, VTColors.pink, VTColors.gray, VTColors.redL
    ];

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Số phiếu',
                data,
                backgroundColor: colors.slice(0, data.length),
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            ...chartDefaults,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: gridColor() },
                    ticks: { font: { family: 'Inter', size: 11 }, color: tickColor(), precision: 0 }
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', size: 11 }, color: tickColor() }
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                legend: { display: false },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: { label: ctx => ` ${ctx.parsed.x} phiếu` }
                }
            }
        }
    });
}

// ================================================================
// CHART 4: Danh mục (Pie)
// ================================================================
function initChartDanhMuc(labels, data) {
    const ctx = document.getElementById('chartDanhMuc');
    if (!ctx) return null;

    const palette = [
        VTColors.red, VTColors.blue, VTColors.green, VTColors.orange,
        VTColors.purple, VTColors.teal, VTColors.amber, VTColors.pink
    ];

    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: palette.slice(0, data.length),
                borderColor: '#fff',
                borderWidth: 3,
                hoverOffset: 6,
            }]
        },
        options: {
            ...chartDefaults,
            plugins: {
                ...chartDefaults.plugins,
                legend: {
                    position: 'bottom',
                    labels: { ...chartDefaults.plugins.legend.labels }
                },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: {
                        label: ctx => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ================================================================
// CHART 5: Phiếu theo Ngày (Line)
// ================================================================
function initChartNgay(labels, data) {
    const ctx = document.getElementById('chartNgay');
    if (!ctx) return null;

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Số phiếu',
                data,
                borderColor: VTColors.red,
                backgroundColor: 'rgba(215,25,32,0.08)',
                borderWidth: 2.5,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: VTColors.red,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                fill: true,
                tension: 0.35,
            }]
        },
        options: {
            ...chartDefaults,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', size: 10 }, color: tickColor(), maxTicksLimit: 10 }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor() },
                    ticks: { font: { family: 'Inter', size: 11 }, color: tickColor(), precision: 0 }
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                legend: { display: false },
                tooltip: {
                    ...chartDefaults.plugins.tooltip,
                    callbacks: { label: ctx => ` ${ctx.parsed.y} phiếu` }
                }
            }
        }
    });
}

// ================================================================
// CHART 6: Radar — Hiệu suất Nhân viên
// ================================================================
function initChartRadar(nhanVienLabels, tongPhieu, hoanThanh, dangXuLy) {
    const ctx = document.getElementById('chartRadar');
    if (!ctx) return null;

    return new Chart(ctx, {
        type: 'radar',
        data: {
            labels: nhanVienLabels,
            datasets: [
                {
                    label: 'Tổng phiếu',
                    data: tongPhieu,
                    borderColor: VTColors.red,
                    backgroundColor: 'rgba(215,25,32,0.12)',
                    pointBackgroundColor: VTColors.red,
                    borderWidth: 2,
                },
                {
                    label: 'Hoàn thành',
                    data: hoanThanh,
                    borderColor: VTColors.green,
                    backgroundColor: 'rgba(34,197,94,0.1)',
                    pointBackgroundColor: VTColors.green,
                    borderWidth: 2,
                },
                {
                    label: 'Đang xử lý',
                    data: dangXuLy,
                    borderColor: VTColors.blue,
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    pointBackgroundColor: VTColors.blue,
                    borderWidth: 2,
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: { font: { family: 'Inter', size: 10 }, precision: 0, color: tickColor() },
                    grid: { color: gridColor() },
                    pointLabels: { font: { family: 'Inter', size: 11, weight: '600' }, color: tickColor() }
                }
            },
            plugins: {
                ...chartDefaults.plugins,
                legend: {
                    position: 'bottom',
                    labels: { ...chartDefaults.plugins.legend.labels }
                }
            }
        }
    });
}

// ================================================================
// INIT PROGRESS BARS (animate on load)
// ================================================================
function initProgressBars() {
    document.querySelectorAll('[data-progress]').forEach(el => {
        const pct = parseFloat(el.getAttribute('data-progress')) || 0;
        setTimeout(() => { el.style.width = Math.min(pct, 100) + '%'; }, 200);
    });
}

// ================================================================
// RATING BARS ANIMATION
// ================================================================
function initRatingBars() {
    document.querySelectorAll('[data-rating-pct]').forEach(el => {
        const pct = parseFloat(el.getAttribute('data-rating-pct')) || 0;
        setTimeout(() => { el.style.width = Math.min(pct, 100) + '%'; }, 300);
    });
}

// ================================================================
// EXPORT EXCEL (SheetJS)
// ================================================================
function exportExcel() {
    if (typeof XLSX === 'undefined') {
        alert('Thư viện XLSX chưa được tải. Vui lòng thử lại.');
        return;
    }
    const wb = XLSX.utils.book_new();

    // Sheet 1: Top Nhân viên
    const nvTable = document.getElementById('tableTopNhanVien');
    if (nvTable) {
        const ws1 = XLSX.utils.table_to_sheet(nvTable);
        XLSX.utils.book_append_sheet(wb, ws1, 'Top Nhân Viên');
    }

    // Sheet 2: Top Dịch vụ
    const dvTable = document.getElementById('tableTopDichVu');
    if (dvTable) {
        const ws2 = XLSX.utils.table_to_sheet(dvTable);
        XLSX.utils.book_append_sheet(wb, ws2, 'Top Dịch Vụ');
    }

    // Sheet 3: Top Khách hàng
    const khTable = document.getElementById('tableTopKhachHang');
    if (khTable) {
        const ws3 = XLSX.utils.table_to_sheet(khTable);
        XLSX.utils.book_append_sheet(wb, ws3, 'Top Khách Hàng');
    }

    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2,'0')}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getFullYear()}`;
    XLSX.writeFile(wb, `BaoCaoThongKe_${dateStr}.xlsx`);
}

// ================================================================
// EXPORT PDF (html2canvas + jsPDF)
// ================================================================
async function exportPDF() {
    if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
        alert('Thư viện PDF chưa được tải. Vui lòng thử lại.');
        return;
    }
    showLoading(true);
    try {
        const { jsPDF } = jspdf;
        const element = document.getElementById('tkMainContent');
        const canvas = await html2canvas(element, { scale: 1.5, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = (canvas.height * pdfW) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
        const now = new Date();
        const dateStr = `${now.getDate().toString().padStart(2,'0')}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getFullYear()}`;
        pdf.save(`BaoCaoThongKe_${dateStr}.pdf`);
    } catch (e) {
        console.error('Export PDF error:', e);
        alert('Có lỗi khi xuất PDF.');
    } finally {
        showLoading(false);
    }
}

// ================================================================
// PRINT
// ================================================================
function printReport() {
    window.print();
}

// ================================================================
// LOADING
// ================================================================
function showLoading(show) {
    const el = document.getElementById('tkLoading');
    if (el) el.classList.toggle('show', show);
}

// ================================================================
// FILTER RESET
// ================================================================
function resetFilter() {
    document.getElementById('filterForm')?.reset();
    window.location.href = window.location.pathname;
}

// ================================================================
// THEME TOGGLE SUPPORT (re-render charts on theme change)
// ================================================================
let chartInstances = [];

function rerenderCharts() {
    chartInstances.forEach(c => { if (c) c.update(); });
}

const themeObserver = new MutationObserver(() => {
    rerenderCharts();
});

// ================================================================
// INIT
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Counter
    initCounters();

    // Progress bars
    initProgressBars();

    // Rating bars
    initRatingBars();

    // Charts — data is embedded as JSON in the page via data- attributes
    const chartDataEl = document.getElementById('chartData');
    if (!chartDataEl) return;

    let d;
    try {
        d = JSON.parse(chartDataEl.textContent);
    } catch (e) {
        console.error('chartData parse error:', e);
        return;
    }

    chartInstances = [
        initChartThang(d.thangLabels, d.thangData),
        initChartTrangThai(d.choXuLy, d.dangXuLy, d.hoanThanh, d.daHuy),
        initChartDichVu(d.dvLabels, d.dvData),
        initChartDanhMuc(d.dmLabels, d.dmData),
        initChartNgay(d.ngayLabels, d.ngayData),
        initChartRadar(d.radarLabels, d.radarTong, d.radarHoan, d.radarDang),
    ];

    // Observe theme changes
    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-bs-theme']
    });
});
