/**
 * DASHBOARD SPK PEMILIHAN MOBIL - METODE AHP
 * JavaScript Client-Side Controller
 * Menghubungkan Frontend HTML/CSS dengan Flask Backend REST API
 */

// Global Chart Instances Tracker (untuk menghancurkan grafik lama saat reload)
let chartInstances = {};

// ============================================================================
// Utilitas & Format Angka
// ============================================================================

function formatDecimal(val, decimals = 4) {
    if (val === null || val === undefined || isNaN(val)) return "-";
    return Number(val).toLocaleString("id-ID", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatPercent(val, decimals = 2) {
    if (val === null || val === undefined || isNaN(val)) return "-";
    return Number(val).toLocaleString("id-ID", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }) + "%";
}

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    const icon = type === "success" ? "fa-circle-check text-success" : "fa-triangle-exclamation text-danger";
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function destroyChart(chartId) {
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
    }
}

// ============================================================================
// Event Listeners Global (Sidebar, Dropdown, Modal Upload, Reset)
// ============================================================================

document.addEventListener("DOMContentLoaded", function() {
    initSidebar();
    initDropdowns();
    initUploadModal();
    initResetButton();
});

function initSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const toggleBtn = document.getElementById("sidebarToggleBtn");
    const closeBtn = document.getElementById("sidebarCloseBtn");

    if (toggleBtn && sidebar && overlay) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.add("open");
            overlay.classList.add("open");
        });
    }

    if (closeBtn && sidebar && overlay) {
        closeBtn.addEventListener("click", () => {
            sidebar.classList.remove("open");
            overlay.classList.remove("open");
        });
    }

    if (overlay && sidebar) {
        overlay.addEventListener("click", () => {
            sidebar.classList.remove("open");
            overlay.classList.remove("open");
        });
    }
}

function initDropdowns() {
    const dropdownBtn = document.getElementById("exportDropdownBtn");
    const dropdown = dropdownBtn ? dropdownBtn.closest(".dropdown") : null;

    if (dropdownBtn && dropdown) {
        dropdownBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("open");
        });

        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove("open");
            }
        });
    }
}

function initUploadModal() {
    const modal = document.getElementById("uploadModal");
    const openBtns = [document.getElementById("openUploadModalBtn"), document.getElementById("headerUploadBtn")];
    const closeBtn = document.getElementById("closeUploadModalBtn");
    const cancelBtn = document.getElementById("cancelUploadBtn");
    const fileInput = document.getElementById("excelFileInput");
    const dropZone = document.getElementById("dropZone");
    const filePreview = document.getElementById("fileInfoPreview");
    const fileNameSpan = document.getElementById("selectedFileName");
    const removeFileBtn = document.getElementById("btnRemoveFile");
    const uploadForm = document.getElementById("uploadExcelForm");
    const uploadAlert = document.getElementById("uploadAlert");

    if (!modal) return;

    openBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener("click", () => {
                modal.classList.add("open");
                resetUploadForm();
            });
        }
    });

    [closeBtn, cancelBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener("click", () => {
                modal.classList.remove("open");
            });
        }
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("open");
    });

    function resetUploadForm() {
        if (uploadForm) uploadForm.reset();
        if (filePreview) filePreview.style.display = "none";
        if (uploadAlert) uploadAlert.style.display = "none";
    }

    if (fileInput) {
        fileInput.addEventListener("change", function() {
            if (this.files && this.files[0]) {
                fileNameSpan.textContent = this.files[0].name;
                filePreview.style.display = "inline-flex";
            }
        });
    }

    if (removeFileBtn) {
        removeFileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            fileInput.value = "";
            filePreview.style.display = "none";
        });
    }

    if (dropZone) {
        ["dragenter", "dragover"].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.add("dragover");
            });
        });

        ["dragleave", "drop"].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.remove("dragover");
            });
        });

        dropZone.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                fileInput.files = files;
                fileNameSpan.textContent = files[0].name;
                filePreview.style.display = "inline-flex";
            }
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener("submit", function(e) {
            e.preventDefault();
            if (!fileInput.files || fileInput.files.length === 0) {
                showAlert("Silakan pilih file Excel (.xlsx / .xls) terlebih dahulu", "danger");
                return;
            }

            const formData = new FormData();
            formData.append("file", fileInput.files[0]);

            const submitBtn = document.getElementById("submitUploadBtn");
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menghitung AHP...`;

            fetch("/api/upload", {
                method: "POST",
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;

                if (data.status === "success") {
                    modal.classList.remove("open");
                    showToast(data.message, "success");
                    // Refresh data halaman aktif
                    setTimeout(() => window.location.reload(), 800);
                } else {
                    showAlert(data.message || "Gagal mengunggah file", "danger");
                }
            })
            .catch(err => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                showAlert("Terjadi kesalahan saat mengunggah: " + err.message, "danger");
            });
        });
    }

    function showAlert(msg, type) {
        if (!uploadAlert) return;
        uploadAlert.className = `alert-box alert-${type}`;
        uploadAlert.textContent = msg;
        uploadAlert.style.display = "block";
    }
}

function initResetButton() {
    const resetBtn = document.getElementById("resetDataBtn");
    if (!resetBtn) return;

    resetBtn.addEventListener("click", () => {
        if (confirm("Apakah Anda yakin ingin mereset data perhitungan ke file Excel bawaan asli (AHP_Studi_Kasus_Mobil.xlsx)?")) {
            fetch("/api/reset", { method: "POST" })
                .then(res => res.json())
                .then(data => {
                    showToast(data.message, "success");
                    setTimeout(() => window.location.reload(), 600);
                })
                .catch(err => {
                    showToast("Gagal mereset data: " + err.message, "error");
                });
        }
    });
}

// ============================================================================
// 1. DASHBOARD UTAMA (index.html)
// ============================================================================

// Helper universal untuk fetch data (Otomatis bekerja pada server Flask maupun GitHub Pages statis)
let staticDataCache = null;

async function fetchAHP(endpoint) {
    // 1. Coba request ke backend Flask jika sedang berjalan
    try {
        const response = await fetch(endpoint);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        // Fallback untuk GitHub Pages statis
    }

    // 2. Mode GitHub Pages / Statis: ambil dari cache data_cache.json
    const key = endpoint.replace(/^\/?api\//, '').split('?')[0];
    if (!staticDataCache) {
        try {
            const cacheRes = await fetch("js/data_cache.json");
            if (cacheRes.ok) {
                staticDataCache = await cacheRes.json();
            }
        } catch (err) {
            console.warn("Gagal memuat cache statis:", err);
        }
    }

    if (staticDataCache && staticDataCache[key]) {
        return staticDataCache[key];
    }

    throw new Error(`Data tidak ditemukan untuk endpoint ${endpoint}`);
}

async function loadDashboardPage() {
    try {
        const [dashRes, altRes] = await Promise.all([
            fetchAHP("/api/dashboard"),
            fetchAHP("/api/alternatif")
        ]);

        if (dashRes.status !== "success") throw new Error("Gagal mengambil data dashboard");

        // 1. Update Header & Badges
        const headerSource = document.getElementById("headerSourceText");
        if (headerSource) headerSource.textContent = dashRes.data_source;

        // 2. Update 4 Key Stat Cards
        document.getElementById("statTotalAlts").textContent = dashRes.total_alternatives;
        document.getElementById("statTotalCrits").textContent = dashRes.total_criteria;
        document.getElementById("statTopCar").textContent = dashRes.best_car.name;

        // Spotlight
        document.getElementById("spotlightCarName").textContent = dashRes.best_car.name;
        document.getElementById("spotlightScoreVal").textContent = formatDecimal(dashRes.best_car.score, 4) + ` (${dashRes.best_car.score_percent}%)`;
        document.getElementById("recHeadline").textContent = `Mobil Rekomendasi Terpilih: ${dashRes.best_car.name}`;

        // 3. Render Chart 1: Ranking Bar Chart
        renderRankingBarChart("chartRanking", dashRes.chart_ranking);

        // 4. Render Chart 2: Criteria Doughnut Chart
        renderCriteriaDoughnutChart("chartCriteria", dashRes.chart_criteria);

        // 5. Render Chart 3: Multi-Criteria Radar Chart
        renderMultiCriteriaRadarChart("chartRadar", altRes.alternatives, dashRes.chart_criteria.labels);

        // 6. Render Mini Consistency Tags
        renderMiniConsistencyTags(dashRes.consistency_summary);

    } catch (err) {
        console.error("Dashboard error:", err);
        showToast("Gagal memuat ringkasan dashboard: " + err.message, "error");
    }
}

function renderRankingBarChart(canvasId, chartData) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const colors = [
        "rgba(37, 99, 235, 0.85)",   // Primary 1 (Ertiga)
        "rgba(16, 185, 129, 0.85)",  // 2 (Livina)
        "rgba(245, 158, 11, 0.85)",  // 3 (Avanza)
        "rgba(148, 163, 184, 0.85)"  // 4 (Xenia)
    ];

    const borderColors = [
        "#1d4ed8",
        "#059669",
        "#d97706",
        "#64748b"
    ];

    chartInstances[canvasId] = new Chart(ctx, {
        type: "bar",
        data: {
            labels: chartData.labels,
            datasets: [{
                label: "Skor Preferensi AHP",
                data: chartData.scores,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 1.5,
                borderRadius: 8,
                barThickness: 38
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#0f172a",
                    titleFont: { size: 13, weight: "bold" },
                    bodyFont: { size: 12 },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            const pct = (val * 100).toFixed(2);
                            return ` Skor AHP: ${val.toFixed(4)} (${pct}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 0.6,
                    ticks: {
                        callback: val => (val * 100) + "%"
                    },
                    grid: {
                        color: "#f1f5f9"
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { weight: "600" }
                    }
                }
            }
        }
    });
}

function renderCriteriaDoughnutChart(canvasId, criteriaData) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    chartInstances[canvasId] = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Style (32.02%)", "Keandalan (55.71%)", "Konsumsi BBM (12.26%)"],
            datasets: [{
                data: criteriaData.percentages,
                backgroundColor: [
                    "#3b82f6", // Style
                    "#10b981", // Keandalan
                    "#f59e0b"  // BBM
                ],
                borderWidth: 3,
                borderColor: "#ffffff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        padding: 18,
                        usePointStyle: true,
                        font: { weight: "600", size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: "#0f172a",
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return ` Bobot: ${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            }
        }
    });
}

function renderMultiCriteriaRadarChart(canvasId, alternatives, criteriaLabels) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const cleanCriteria = ["Style", "Keandalan", "Konsumsi BBM"];
    const datasets = [];

    const radarColors = [
        { border: "#2563eb", bg: "rgba(37, 99, 235, 0.15)" },  // Ertiga
        { border: "#10b981", bg: "rgba(16, 185, 129, 0.15)" }, // Livina
        { border: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" }, // Avanza
        { border: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" }  // Xenia
    ];

    alternatives.forEach((alt, idx) => {
        const c = radarColors[idx % radarColors.length];
        const scores = [
            alt.breakdown["Style (Gaya/Tampilan)"]?.local_weight || 0,
            alt.breakdown["Keandalan (Reliability/Durabilitas)"]?.local_weight || 0,
            alt.breakdown["Konsumsi Bahan Bakar (Efisiensi BBM)"]?.local_weight || 0
        ];

        datasets.push({
            label: alt.name,
            data: scores,
            borderColor: c.border,
            backgroundColor: c.bg,
            borderWidth: 2,
            pointBackgroundColor: c.border,
            pointRadius: 4
        });
    });

    chartInstances[canvasId] = new Chart(ctx, {
        type: "radar",
        data: {
            labels: cleanCriteria,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 0.6,
                    ticks: {
                        stepSize: 0.15,
                        callback: val => (val * 100).toFixed(0) + "%"
                    },
                    grid: { color: "#e2e8f0" },
                    pointLabels: {
                        font: { weight: "700", size: 12 },
                        color: "#0f172a"
                    }
                }
            },
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { usePointStyle: true, padding: 14 }
                }
            }
        }
    });
}

function renderMiniConsistencyTags(summaryList) {
    const container = document.getElementById("consistencyTagsContainer");
    if (!container) return;

    container.innerHTML = "";
    summaryList.forEach(item => {
        const tag = document.createElement("div");
        tag.className = "consistency-tag-item";
        tag.innerHTML = `
            <i class="fa-solid fa-check"></i>
            <span>${item.matrix_name}: <strong>CR = ${(item.cr * 100).toFixed(2)}%</strong> (Konsisten)</span>
        `;
        container.appendChild(tag);
    });
}

// ============================================================================
// 2. DATA ALTERNATIF (alternatif.html)
// ============================================================================

let originalAlternatives = [];

async function loadAlternatifPage() {
    try {
        const res = await fetchAHP("/api/alternatif");
        if (res.status !== "success") throw new Error("Gagal mengambil data alternatif");

        originalAlternatives = res.alternatives;
        applyAlternativeFilters();

        // Bind filter event listeners
        document.getElementById("altSearchInput")?.addEventListener("input", applyAlternativeFilters);
        document.getElementById("rankFilterSelect")?.addEventListener("change", applyAlternativeFilters);
        document.getElementById("sortBySelect")?.addEventListener("change", applyAlternativeFilters);
        document.getElementById("btnResetFilter")?.addEventListener("click", () => {
            const search = document.getElementById("altSearchInput");
            const rankSel = document.getElementById("rankFilterSelect");
            const sortSel = document.getElementById("sortBySelect");
            if (search) search.value = "";
            if (rankSel) rankSel.value = "all";
            if (sortSel) sortSel.value = "rank-asc";
            applyAlternativeFilters();
        });

        // Table header sort
        document.querySelectorAll("#alternativesTable th.sortable").forEach(th => {
            th.addEventListener("click", () => {
                const sortKey = th.getAttribute("data-sort");
                const sortSel = document.getElementById("sortBySelect");
                if (sortKey === "rank") sortSel.value = sortSel.value === "rank-asc" ? "rank-desc" : "rank-asc";
                if (sortKey === "name") sortSel.value = "name-asc";
                if (sortKey === "final") sortSel.value = "score-desc";
                applyAlternativeFilters();
            });
        });

    } catch (err) {
        console.error("Alternatif error:", err);
        showToast("Gagal memuat data alternatif: " + err.message, "error");
    }
}

function applyAlternativeFilters() {
    const searchQuery = document.getElementById("altSearchInput")?.value.toLowerCase().trim() || "";
    const rankFilter = document.getElementById("rankFilterSelect")?.value || "all";
    const sortBy = document.getElementById("sortBySelect")?.value || "rank-asc";

    let filtered = [...originalAlternatives];

    // Filter by Search Query
    if (searchQuery) {
        filtered = filtered.filter(a => a.name.toLowerCase().includes(searchQuery));
    }

    // Filter by Rank
    if (rankFilter === "1") {
        filtered = filtered.filter(a => a.rank === 1);
    } else if (rankFilter === "top2") {
        filtered = filtered.filter(a => a.rank <= 2);
    } else if (rankFilter === "other") {
        filtered = filtered.filter(a => a.rank > 2);
    }

    // Sorting
    filtered.sort((a, b) => {
        if (sortBy === "rank-asc") return a.rank - b.rank;
        if (sortBy === "rank-desc") return b.rank - a.rank;
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        if (sortBy === "score-desc") return b.final_score - a.final_score;
        return 0;
    });

    renderAlternativesTable(filtered);
    renderAlternativeProfileCards(filtered);
}

function renderAlternativesTable(items) {
    const tbody = document.getElementById("alternativesTableBody");
    const countBadge = document.getElementById("altCountBadge");
    if (!tbody) return;

    if (countBadge) countBadge.textContent = `Menampilkan: ${items.length} Mobil`;

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Tidak ada alternatif yang sesuai filter pencarian.</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const rankClass = item.rank === 1 ? "badge-rank-1" :
                         item.rank === 2 ? "badge-rank-2" :
                         item.rank === 3 ? "badge-rank-3" : "badge-rank-other";

        const styleBreak = item.breakdown["Style (Gaya/Tampilan)"] || {};
        const keandalanBreak = item.breakdown["Keandalan (Reliability/Durabilitas)"] || {};
        const bbmBreak = item.breakdown["Konsumsi Bahan Bakar (Efisiensi BBM)"] || {};

        return `
            <tr>
                <td>
                    <span class="badge-rank ${rankClass}">${item.rank}</span>
                </td>
                <td>
                    <strong style="font-size: 0.95rem; color: #0f172a;">${item.name}</strong>
                    ${item.rank === 1 ? '<span class="badge badge-primary ms-2" style="font-size: 0.7rem;"><i class="fa-solid fa-crown text-warning"></i> Rekomendasi Utama</span>' : ''}
                </td>
                <td class="text-center font-mono">
                    ${formatDecimal(styleBreak.local_weight, 4)} 
                    <small class="text-muted">(${formatDecimal(styleBreak.weighted_score, 4)})</small>
                </td>
                <td class="text-center font-mono">
                    ${formatDecimal(keandalanBreak.local_weight, 4)} 
                    <small class="text-muted">(${formatDecimal(keandalanBreak.weighted_score, 4)})</small>
                </td>
                <td class="text-center font-mono">
                    ${formatDecimal(bbmBreak.local_weight, 4)} 
                    <small class="text-muted">(${formatDecimal(bbmBreak.weighted_score, 4)})</small>
                </td>
                <td class="text-right font-mono" style="font-size: 1rem; color: #2563eb; font-weight: 800;">
                    ${formatDecimal(item.final_score, 6)}
                </td>
                <td class="text-center">
                    <span class="badge ${item.rank === 1 ? 'badge-primary' : 'badge-neutral'}">
                        ${formatPercent(item.final_score_percent, 2)}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}

function renderAlternativeProfileCards(items) {
    const grid = document.getElementById("altCardsGrid");
    if (!grid) return;

    grid.innerHTML = items.map(item => {
        const isTop = item.rank === 1;
        const stylePct = (item.breakdown["Style (Gaya/Tampilan)"]?.local_weight * 100) || 0;
        const keanPct = (item.breakdown["Keandalan (Reliability/Durabilitas)"]?.local_weight * 100) || 0;
        const bbmPct = (item.breakdown["Konsumsi Bahan Bakar (Efisiensi BBM)"]?.local_weight * 100) || 0;

        return `
            <div class="alt-profile-card ${isTop ? 'top-rank' : ''}">
                <div class="alt-badge-corner">
                    <span class="badge ${isTop ? 'badge-primary' : 'badge-neutral'}">Rank #${item.rank}</span>
                </div>
                <div class="alt-card-header">
                    <h4 class="alt-car-title">${item.name}</h4>
                    <span class="alt-car-rank">${isTop ? 'Juara 1 Rekomendasi AHP' : 'Alternatif Evaluasi'}</span>
                </div>
                <div class="alt-score-badge">
                    <span class="alt-score-title">Skor Akhir Global</span>
                    <div class="alt-score-number">${formatDecimal(item.final_score, 4)}</div>
                    <small class="text-muted">Preferensi: ${formatPercent(item.final_score_percent, 2)}</small>
                </div>
                <div class="criteria-bars-list">
                    <div class="crit-bar-item">
                        <div class="crit-bar-meta">
                            <span>Style</span>
                            <span class="font-mono">${stylePct.toFixed(1)}%</span>
                        </div>
                        <div class="crit-bar-track">
                            <div class="crit-bar-fill fill-style" style="width: ${stylePct}%"></div>
                        </div>
                    </div>
                    <div class="crit-bar-item">
                        <div class="crit-bar-meta">
                            <span>Keandalan</span>
                            <span class="font-mono">${keanPct.toFixed(1)}%</span>
                        </div>
                        <div class="crit-bar-track">
                            <div class="crit-bar-fill fill-keandalan" style="width: ${keanPct}%"></div>
                        </div>
                    </div>
                    <div class="crit-bar-item">
                        <div class="crit-bar-meta">
                            <span>Konsumsi BBM</span>
                            <span class="font-mono">${bbmPct.toFixed(1)}%</span>
                        </div>
                        <div class="crit-bar-track">
                            <div class="crit-bar-fill fill-bbm" style="width: ${bbmPct}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// ============================================================================
// 3. DATA KRITERIA (kriteria.html)
// ============================================================================

async function loadKriteriaPage() {
    try {
        const res = await fetchAHP("/api/kriteria");
        if (res.status !== "success") throw new Error("Gagal mengambil data kriteria");

        const calc = res.calculation;

        // 1. Render Top Summary Cards
        renderCriteriaSummaryCards(res.criteria_labels, calc.weights, calc.weights_percent);

        // 2. Render Raw Comparison Matrix
        renderRawCriteriaTable(calc.labels, calc.raw_matrix, calc.col_sums);

        // 3. Render Normalized Matrix & Weights Table
        renderNormalizedCriteriaTable(calc);

        // 4. Update Consistency Metrics
        document.getElementById("critLambdaMax").textContent = formatDecimal(calc.lambda_max, 6);
        document.getElementById("critCI").textContent = formatDecimal(calc.ci, 6);
        document.getElementById("critRI").textContent = formatDecimal(calc.ri, 2);
        document.getElementById("critCR").textContent = formatDecimal(calc.cr, 6);

        // 5. Render Horizontal Bar Chart for Weights
        renderCriteriaHorizontalBarChart("chartCriteriaWeights", res.criteria_labels, calc.weights_percent);

    } catch (err) {
        console.error("Kriteria error:", err);
        showToast("Gagal memuat data kriteria: " + err.message, "error");
    }
}

function renderCriteriaSummaryCards(labels, weights, percents) {
    const container = document.getElementById("criteriaSummaryCards");
    if (!container) return;

    const icons = ["fa-wand-magic-sparkles text-primary", "fa-shield-halved text-success", "fa-gas-pump text-warning"];
    const shortNames = ["Style (S)", "Keandalan (K)", "Konsumsi BBM (B)"];

    container.innerHTML = `
        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); width: 100%;">
            ${labels.map((lbl, idx) => `
                <div class="stat-card">
                    <div class="stat-icon-wrapper bg-blue-subtle">
                        <i class="fa-solid ${icons[idx]}"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">${shortNames[idx]}</span>
                        <h3 class="stat-value font-mono">${percents[idx].toFixed(2)}%</h3>
                        <span class="stat-subtext">Bobot: ${formatDecimal(weights[idx], 6)}</span>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function renderRawCriteriaTable(labels, rawMatrix, colSums) {
    const tbody = document.getElementById("rawCriteriaTableBody");
    const tfoot = document.getElementById("rawCriteriaTableFoot");
    if (!tbody) return;

    const shortLabels = ["Style (S)", "Keandalan (K)", "Konsumsi BBM (B)"];

    tbody.innerHTML = rawMatrix.map((row, i) => `
        <tr>
            <td><strong>${shortLabels[i]}</strong></td>
            ${row.map((val, j) => {
                let cellClass = "";
                if (i === j) cellClass = "cell-diagonal";
                else if (val > 1) cellClass = "cell-input";
                else cellClass = "cell-reciprocal";
                return `<td class="${cellClass} font-mono">${formatDecimal(val, 4)}</td>`;
            }).join("")}
        </tr>
    `).join("");

    if (tfoot) {
        tfoot.innerHTML = `
            <tr>
                <td><strong>TOTAL KOLOM</strong></td>
                ${colSums.map(sum => `<td class="font-mono text-center" style="font-weight: 800; color: #1e40af;">${formatDecimal(sum, 4)}</td>`).join("")}
            </tr>
        `;
    }
}

function renderNormalizedCriteriaTable(calc) {
    const tbody = document.getElementById("normalizedCriteriaTableBody");
    const tfoot = document.getElementById("normalizedCriteriaTableFoot");
    if (!tbody) return;

    const shortLabels = ["Style (S)", "Keandalan (K)", "Konsumsi BBM (B)"];

    tbody.innerHTML = calc.normalized_matrix.map((row, i) => `
        <tr>
            <td><strong>${shortLabels[i]}</strong></td>
            ${row.map(val => `<td class="font-mono text-center">${formatDecimal(val, 4)}</td>`).join("")}
            <td class="font-mono text-center highlight-col">${formatDecimal(calc.row_sums[i], 4)}</td>
            <td class="font-mono text-center highlight-priority">${formatDecimal(calc.weights[i], 6)}</td>
            <td class="font-mono text-center" style="font-weight: 700;">${calc.weights_percent[i].toFixed(2)}%</td>
            <td class="font-mono text-center highlight-eigen">${formatDecimal(calc.eigen_contributions[i], 6)}</td>
        </tr>
    `).join("");

    if (tfoot) {
        tfoot.innerHTML = `
            <tr>
                <td><strong>TOTAL</strong></td>
                <td class="text-center font-mono">1.0000</td>
                <td class="text-center font-mono">1.0000</td>
                <td class="text-center font-mono">1.0000</td>
                <td class="text-center font-mono highlight-col">3.0000</td>
                <td class="text-center font-mono highlight-priority">1.0000</td>
                <td class="text-center font-mono">100.00%</td>
                <td class="text-center font-mono highlight-eigen" style="font-weight: 800; color: #5b21b6;">&lambda; max = ${formatDecimal(calc.lambda_max, 6)}</td>
            </tr>
        `;
    }
}

function renderCriteriaHorizontalBarChart(canvasId, labels, percents) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    chartInstances[canvasId] = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Style (Tampilan)", "Keandalan (Reliability)", "Konsumsi BBM (Efisiensi)"],
            datasets: [{
                label: "Bobot Prioritas (%)",
                data: percents,
                backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
                borderRadius: 6,
                barThickness: 24
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` Bobot: ${ctx.raw.toFixed(2)}%`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 70,
                    ticks: { callback: v => v + "%" },
                    grid: { color: "#f1f5f9" }
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { weight: "600" } }
                }
            }
        }
    });
}

// ============================================================================
// 4. PROSES PERHITUNGAN AHP (perhitungan.html)
// ============================================================================

async function loadPerhitunganPage() {
    try {
        const res = await fetchAHP("/api/perhitungan");
        if (res.status !== "success") throw new Error("Gagal mengambil data tahapan perhitungan");

        // 1. Bind Step Nav Tabs
        document.querySelectorAll(".step-nav-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".step-nav-btn").forEach(b => b.classList.remove("active"));
                document.querySelectorAll(".step-content-pane").forEach(p => p.classList.remove("active"));

                btn.classList.add("active");
                const stepKey = btn.getAttribute("data-step");
                const targetPane = document.getElementById(`pane-${stepKey}`);
                if (targetPane) targetPane.classList.add("active");
            });
        });

        // 2. Render Pane 1: Kriteria
        renderStepMatrixBox("stepCriteriaContent", res.step1_criteria, "Kriteria");

        // 3. Render Pane 2: Alternatif - Style
        renderStepMatrixBox("stepStyleContent", res.step2_alternatives["S"], "Style");

        // 4. Render Pane 3: Alternatif - Keandalan
        renderStepMatrixBox("stepKeandalanContent", res.step2_alternatives["K"], "Keandalan");

        // 5. Render Pane 4: Alternatif - BBM
        renderStepMatrixBox("stepBbmContent", res.step2_alternatives["B"], "Konsumsi BBM");

        // 6. Render Pane 5: Sintesis Akhir
        renderStepSintesisBox("stepSintesisContent", res);

    } catch (err) {
        console.error("Perhitungan error:", err);
        showToast("Gagal memuat tahapan perhitungan: " + err.message, "error");
    }
}

function renderStepMatrixBox(containerId, calc, title) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <!-- Bagian A: Matriks Perbandingan Awal -->
        <h4 style="font-weight: 700; color: #1e293b; margin-bottom: 12px;">
            A. Matriks Perbandingan Berpasangan & Jumlah Kolom
        </h4>
        <div class="table-responsive mb-4">
            <table class="data-table matrix-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        ${calc.labels.map(l => `<th>${l}</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
                    ${calc.raw_matrix.map((row, i) => `
                        <tr>
                            <td><strong>${calc.labels[i]}</strong></td>
                            ${row.map((val, j) => `<td class="font-mono ${i===j ? 'cell-diagonal' : ''}">${formatDecimal(val, 4)}</td>`).join("")}
                        </tr>
                    `).join("")}
                </tbody>
                <tfoot>
                    <tr>
                        <td><strong>TOTAL KOLOM</strong></td>
                        ${calc.col_sums.map(sum => `<td class="font-mono text-center" style="color: #2563eb;">${formatDecimal(sum, 4)}</td>`).join("")}
                    </tr>
                </tfoot>
            </table>
        </div>

        <!-- Bagian B: Matriks Normalisasi & Bobot -->
        <h4 style="font-weight: 700; color: #1e293b; margin-bottom: 12px; margin-top: 24px;">
            B. Normalisasi Matriks & Bobot Prioritas (Priority Vector)
        </h4>
        <div class="table-responsive mb-4">
            <table class="data-table matrix-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        ${calc.labels.map(l => `<th>${l}</th>`).join("")}
                        <th class="highlight-col">Vektor Jumlah</th>
                        <th class="highlight-priority">Bobot (w)</th>
                        <th>Persentase</th>
                        <th class="highlight-eigen">TotalKolom &times; w</th>
                    </tr>
                </thead>
                <tbody>
                    ${calc.normalized_matrix.map((row, i) => `
                        <tr>
                            <td><strong>${calc.labels[i]}</strong></td>
                            ${row.map(val => `<td class="font-mono">${formatDecimal(val, 4)}</td>`).join("")}
                            <td class="font-mono highlight-col">${formatDecimal(calc.row_sums[i], 4)}</td>
                            <td class="font-mono highlight-priority">${formatDecimal(calc.weights[i], 6)}</td>
                            <td class="font-mono">${calc.weights_percent[i].toFixed(2)}%</td>
                            <td class="font-mono highlight-eigen">${formatDecimal(calc.eigen_contributions[i], 6)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>

        <!-- Bagian C: Parameter Uji Konsistensi -->
        <h4 style="font-weight: 700; color: #1e293b; margin-bottom: 12px; margin-top: 24px;">
            C. Uji Konsistensi Logis Matriks (${title})
        </h4>
        <div class="consistency-metrics-grid">
            <div class="metric-item">
                <span class="metric-label">Ukuran (n)</span>
                <h4 class="metric-val">${calc.size}</h4>
            </div>
            <div class="metric-item">
                <span class="metric-label">&lambda; Maksimum</span>
                <h4 class="metric-val">${formatDecimal(calc.lambda_max, 6)}</h4>
            </div>
            <div class="metric-item">
                <span class="metric-label">CI</span>
                <h4 class="metric-val">${formatDecimal(calc.ci, 6)}</h4>
            </div>
            <div class="metric-item">
                <span class="metric-label">RI (Saaty)</span>
                <h4 class="metric-val">${formatDecimal(calc.ri, 2)}</h4>
            </div>
            <div class="metric-item highlight-border">
                <span class="metric-label">CR (CI/RI)</span>
                <h4 class="metric-val text-success">${formatDecimal(calc.cr, 6)}</h4>
                <span class="badge ${calc.is_consistent ? 'badge-primary' : 'badge-danger'}" style="margin-top: 4px;">
                    ${calc.status} (CR &le; 0.10)
                </span>
            </div>
        </div>
    `;
}

function renderStepSintesisBox(containerId, res) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const synth = res.step3_synthesis;
    const critKeys = ["S", "K", "B"];
    const critLabels = ["Style (32.02%)", "Keandalan (55.71%)", "Konsumsi BBM (12.26%)"];

    container.innerHTML = `
        <h4 style="font-weight: 700; color: #1e293b; margin-bottom: 8px;">
            1. Matriks Skor Alternatif terhadap Kriteria
        </h4>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">
            Menggabungkan bobot prioritas dari masing-masing matriks kriteria untuk setiap mobil:
        </p>
        
        <div class="table-responsive mb-4">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Alternatif Mobil</th>
                        <th>Bobot Style (S)</th>
                        <th>Bobot Keandalan (K)</th>
                        <th>Bobot Konsumsi BBM (B)</th>
                    </tr>
                </thead>
                <tbody>
                    ${res.alternatives.map((altName, i) => `
                        <tr>
                            <td><strong>${altName}</strong></td>
                            <td class="font-mono text-center">${formatDecimal(synth.alt_weight_matrix[i][0], 6)}</td>
                            <td class="font-mono text-center">${formatDecimal(synth.alt_weight_matrix[i][1], 6)}</td>
                            <td class="font-mono text-center">${formatDecimal(synth.alt_weight_matrix[i][2], 6)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>

        <h4 style="font-weight: 700; color: #1e293b; margin-bottom: 8px; margin-top: 24px;">
            2. Matriks Terbobot (Bobot Alternatif &times; Bobot Kriteria) & Skor Akhir
        </h4>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">
            Sesuai rumus Baris 90-93 Excel: Skor_ij = AltWeight_ij &times; CritWeight_j:
        </p>

        <div class="table-responsive mb-4">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Peringkat</th>
                        <th>Mobil</th>
                        <th>S &times; 0.3202</th>
                        <th>K &times; 0.5571</th>
                        <th>B &times; 0.1226</th>
                        <th class="text-right highlight-priority">Total Skor Akhir</th>
                        <th class="text-center">Persentase</th>
                    </tr>
                </thead>
                <tbody>
                    ${synth.ranked_alternatives.map(item => `
                        <tr>
                            <td>
                                <span class="badge-rank ${item.rank === 1 ? 'badge-rank-1' : 'badge-rank-other'}">${item.rank}</span>
                            </td>
                            <td><strong>${item.name}</strong></td>
                            <td class="font-mono text-center">${formatDecimal(item.breakdown["Style (Gaya/Tampilan)"]?.weighted_score, 6)}</td>
                            <td class="font-mono text-center">${formatDecimal(item.breakdown["Keandalan (Reliability/Durabilitas)"]?.weighted_score, 6)}</td>
                            <td class="font-mono text-center">${formatDecimal(item.breakdown["Konsumsi Bahan Bakar (Efisiensi BBM)"]?.weighted_score, 6)}</td>
                            <td class="font-mono text-right highlight-priority" style="font-size: 1.05rem;">
                                ${formatDecimal(item.final_score, 6)}
                            </td>
                            <td class="font-mono text-center">${item.final_score_percent.toFixed(2)}%</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>

        <div class="explanation-box" style="margin-top: 20px;">
            <div class="exp-icon"><i class="fa-solid fa-trophy text-warning"></i></div>
            <div class="exp-content">
                <h5 class="exp-title">Kesimpulan Keputusan Akhir:</h5>
                <p class="exp-text">
                    Berdasarkan perhitungan sintesis AHP di atas, <strong>${synth.ranked_alternatives[0].name}</strong> menempati peringkat tertinggi dengan skor total <strong>${formatDecimal(synth.ranked_alternatives[0].final_score, 6)} (${synth.ranked_alternatives[0].final_score_percent.toFixed(2)}%)</strong>, sehingga direkomendasikan sebagai mobil pilihan terbaik.
                </p>
            </div>
        </div>
    `;
}

// ============================================================================
// 5. HASIL & REKOMENDASI (hasil.html)
// ============================================================================

async function loadHasilPage() {
    try {
        const res = await fetchAHP("/api/hasil");
        if (res.status !== "success") throw new Error("Gagal mengambil data hasil & rekomendasi");

        const best = res.best_alternative;

        // 1. Update Winner Hero Card
        if (best) {
            document.getElementById("winnerCarTitle").textContent = best.name;
            document.getElementById("winnerScorePill").textContent = `${formatDecimal(best.final_score, 6)} (${best.final_score_percent.toFixed(2)}%)`;
        }

        // 2. Render Final Score Bar Chart
        renderFinalScoreBarChart("chartFinalScores", res.ranked_alternatives);

        // 3. Render Stacked Bar Chart for Criteria Contributions
        renderStackedBarChart("chartStackedScores", res.ranked_alternatives);

        // 4. Render Complete Ranking Table
        renderFullRankingTable(res.ranked_alternatives);

        // 5. Render Consistency Summary Table
        renderConsistencySummaryTable(res.consistency_summary);

    } catch (err) {
        console.error("Hasil error:", err);
        showToast("Gagal memuat hasil rekomendasi: " + err.message, "error");
    }
}

function renderFinalScoreBarChart(canvasId, rankedItems) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    chartInstances[canvasId] = new Chart(ctx, {
        type: "bar",
        data: {
            labels: rankedItems.map(a => a.name),
            datasets: [{
                label: "Skor Akhir AHP",
                data: rankedItems.map(a => a.final_score),
                backgroundColor: [
                    "#10b981", // Rank 1 (Ertiga)
                    "#3b82f6", // Rank 2 (Livina)
                    "#f59e0b", // Rank 3 (Avanza)
                    "#94a3b8"  // Rank 4 (Xenia)
                ],
                borderRadius: 8,
                barThickness: 36
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` Skor Preferensi: ${ctx.raw.toFixed(6)} (${(ctx.raw * 100).toFixed(2)}%)`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 0.55,
                    ticks: { callback: v => (v * 100).toFixed(0) + "%" },
                    grid: { color: "#f1f5f9" }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { weight: "700" } }
                }
            }
        }
    });
}

function renderStackedBarChart(canvasId, rankedItems) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const labels = rankedItems.map(a => a.name);
    const styleData = rankedItems.map(a => a.breakdown["Style (Gaya/Tampilan)"]?.weighted_score || 0);
    const keanData = rankedItems.map(a => a.breakdown["Keandalan (Reliability/Durabilitas)"]?.weighted_score || 0);
    const bbmData = rankedItems.map(a => a.breakdown["Konsumsi Bahan Bakar (Efisiensi BBM)"]?.weighted_score || 0);

    chartInstances[canvasId] = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Kontribusi Style (32.02%)",
                    data: styleData,
                    backgroundColor: "#3b82f6"
                },
                {
                    label: "Kontribusi Keandalan (55.71%)",
                    data: keanData,
                    backgroundColor: "#10b981"
                },
                {
                    label: "Kontribusi BBM (12.26%)",
                    data: bbmData,
                    backgroundColor: "#f59e0b"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 0.55,
                    ticks: { callback: v => (v * 100).toFixed(0) + "%" },
                    grid: { color: "#f1f5f9" }
                }
            },
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { usePointStyle: true, padding: 12 }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(4)}`
                    }
                }
            }
        }
    });
}

function renderFullRankingTable(items) {
    const tbody = document.getElementById("rankingTableBody");
    if (!tbody) return;

    tbody.innerHTML = items.map(item => {
        const isWinner = item.rank === 1;
        const rankClass = isWinner ? "badge-rank-1" :
                         item.rank === 2 ? "badge-rank-2" :
                         item.rank === 3 ? "badge-rank-3" : "badge-rank-other";

        const styleW = item.breakdown["Style (Gaya/Tampilan)"]?.weighted_score || 0;
        const keanW = item.breakdown["Keandalan (Reliability/Durabilitas)"]?.weighted_score || 0;
        const bbmW = item.breakdown["Konsumsi Bahan Bakar (Efisiensi BBM)"]?.weighted_score || 0;

        return `
            <tr style="${isWinner ? 'background-color: #ecfdf5;' : ''}">
                <td>
                    <span class="badge-rank ${rankClass}">${item.rank}</span>
                </td>
                <td>
                    <strong style="font-size: 0.95rem; color: #0f172a;">${item.name}</strong>
                    ${isWinner ? '<span class="badge badge-primary ms-2" style="font-size: 0.72rem;"><i class="fa-solid fa-crown text-warning"></i> Pilihan Utama</span>' : ''}
                </td>
                <td class="text-center font-mono">${formatDecimal(styleW, 6)}</td>
                <td class="text-center font-mono">${formatDecimal(keanW, 6)}</td>
                <td class="text-center font-mono">${formatDecimal(bbmW, 6)}</td>
                <td class="text-right font-mono" style="font-size: 1.05rem; font-weight: 800; color: ${isWinner ? '#059669' : '#2563eb'};">
                    ${formatDecimal(item.final_score, 6)}
                </td>
                <td class="text-center font-mono">
                    <strong>${item.final_score_percent.toFixed(2)}%</strong>
                </td>
                <td class="text-center">
                    <span class="badge-status ${isWinner ? 'badge-success' : 'badge-neutral'}">
                        ${isWinner ? '<i class="fa-solid fa-check"></i> Direkomendasikan' : 'Alternatif Lain'}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}

function renderConsistencySummaryTable(summaryList) {
    const tbody = document.getElementById("consistencyTableBody");
    if (!tbody) return;

    tbody.innerHTML = summaryList.map((item, idx) => {
        const n = idx === 0 ? 3 : 4;
        return `
            <tr>
                <td><strong>${item.matrix_name}</strong></td>
                <td class="text-center font-mono">${n}</td>
                <td class="text-center font-mono">${formatDecimal(item.lambda_max, 6)}</td>
                <td class="text-center font-mono">${formatDecimal(item.ci, 6)}</td>
                <td class="text-center font-mono">${formatDecimal(item.ri, 2)}</td>
                <td class="text-center font-mono" style="font-weight: 700; color: ${item.is_consistent ? '#059669' : '#dc2626'};">
                    ${formatDecimal(item.cr, 6)} (${(item.cr * 100).toFixed(2)}%)
                </td>
                <td class="text-center font-mono text-muted">&le; 0.10 (10%)</td>
                <td class="text-center">
                    <span class="badge-status ${item.is_consistent ? 'badge-success' : 'badge-danger'}">
                        <i class="fa-solid ${item.is_consistent ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
                        ${item.status}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}
