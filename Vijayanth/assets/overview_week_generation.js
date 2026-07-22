(function () {
    if (!/overview\.php$/i.test(window.location.pathname)) return;

    const DAY_MS = 24 * 60 * 60 * 1000;
    let weeklyPayload = null;
    let lastFetchAt = 0;
    let latestLabels = [];
    let latestValues = [];
    let latestSuggestedMax = 1000;
    let chartUpdatePatched = false;
    let applying = false;
    let weeklyChart = null;

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function localDateKey(date) {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function weekDates(today = new Date()) {
        const start = new Date(today);
        const day = start.getDay();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - day);
        return Array.from({ length: 7 }, (_, index) => {
            const d = new Date(start.getTime() + index * DAY_MS);
            return {
                key: localDateKey(d),
                label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
                short: d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })
            };
        });
    }

    function chartCanvas(chart) {
        return chart?.canvas || chart?.chart?.canvas || chart?.ctx?.canvas || null;
    }

    function findGenerationChart() {
        const canvas = document.getElementById('genChart');
        if (!canvas || typeof Chart === 'undefined') return null;

        if (weeklyChart && chartCanvas(weeklyChart) === canvas) return weeklyChart;

        if (typeof Chart.getChart === 'function') {
            return Chart.getChart(canvas) || Chart.getChart('genChart') || null;
        }

        const instances = Chart.instances || {};
        const charts = Array.isArray(instances) ? instances : Object.values(instances);
        return charts.find(chart => {
            const c = chartCanvas(chart);
            return c === canvas || c?.id === 'genChart';
        }) || null;
    }

    function setTitle(days = weekDates()) {
        const canvas = document.getElementById('genChart');
        const card = canvas?.closest('.bg-white');
        const title = card?.querySelector('h4');
        if (title) title.textContent = `Generation Week (${days[0].short} - ${days[6].short})`;
    }

    function niceMax(value) {
        if (!Number.isFinite(value) || value <= 0) return 1000;
        const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
        const normalized = value / magnitude;
        const rounded = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
        return rounded * magnitude;
    }

    function readNumericText(id) {
        const text = document.getElementById(id)?.textContent || '';
        const n = parseFloat(text.replace(/,/g, '').replace(/[^0-9.\-]/g, ''));
        return Number.isFinite(n) ? n : 0;
    }

    function liveTodayKwh() {
        return Math.max(readNumericText('vcb_today'), readNumericText('today_energy_val'), 0);
    }

    function expectedDailyFromConfig() {
        const plantId = window.SIGNED_PLANT_ID || window.currentPlant || new URLSearchParams(window.location.search).get('plant') || '';
        const cfg = (window.SIGNED_PLANT_CONFIG && window.SIGNED_PLANT_CONFIG[plantId]) || {};
        const cap = parseFloat(cfg.capacity || window.plantCapacity || 0);
        return Number.isFinite(cap) && cap > 0 ? cap * 1000 * 0.8 * 5 : 1000;
    }

    function updateDataAttributes(labels, values) {
        const canvas = document.getElementById('genChart');
        if (!canvas) return;
        canvas.dataset.weekLabels = labels.join(',');
        canvas.dataset.weekValues = values.join(',');
    }

    function forceWeeklyConfig(chart) {
        const canvas = chartCanvas(chart);
        if (!chart || canvas?.id !== 'genChart' || !latestLabels.length) return;

        chart.config.type = 'bar';
        chart.data.labels = latestLabels;
        chart.data.datasets = [{
            label: 'Current week generation (kWh)',
            data: latestValues,
            backgroundColor: '#059669',
            borderRadius: 5,
            barPercentage: 0.56,
            categoryPercentage: 0.72
        }];
        chart.options.plugins = chart.options.plugins || {};
        chart.options.plugins.legend = { display: false };
        chart.options.scales = chart.options.scales || {};
        chart.options.scales.x = chart.options.scales.x || {};
        chart.options.scales.y = chart.options.scales.y || {};
        chart.options.scales.x.grid = { display: false };
        chart.options.scales.x.title = { display: true, text: 'Current week' };
        chart.options.scales.x.ticks = {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            font: { size: 11, weight: '700' }
        };
        chart.options.scales.y.title = { display: true, text: 'Generation (kWh)' };
        chart.options.scales.y.beginAtZero = true;
        chart.options.scales.y.suggestedMax = latestSuggestedMax;
        chart.options.scales.y.grid = { color: '#f1f5f9' };
        chart.options.scales.y.ticks = {
            callback: value => Number(value).toLocaleString('en-IN')
        };
    }

    function ensureOwnedWeeklyCanvas() {
        const canvas = document.getElementById('genChart');
        if (!canvas || typeof Chart === 'undefined') return;
        if (canvas.dataset.weeklyOwned === '1') return;

        const holder = canvas.parentElement;
        if (!holder) return;

        canvas.id = 'genChartHourlyLegacy';
        canvas.style.display = 'none';
        canvas.setAttribute('aria-hidden', 'true');

        const weeklyCanvas = document.createElement('canvas');
        weeklyCanvas.id = 'genChart';
        weeklyCanvas.dataset.weeklyOwned = '1';
        weeklyCanvas.style.width = '100%';
        weeklyCanvas.style.height = '100%';
        holder.appendChild(weeklyCanvas);

        weeklyChart = new Chart(weeklyCanvas, {
            type: 'bar',
            data: { labels: latestLabels.length ? latestLabels : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], datasets: [{ label: 'Current week generation (kWh)', data: latestValues.length ? latestValues : [0,0,0,0,0,0,0], backgroundColor: '#059669', borderRadius: 5 }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, title: { display: true, text: 'Current week' }, ticks: { autoSkip: false, maxRotation: 0, minRotation: 0, font: { size: 11, weight: '700' } } },
                    y: { beginAtZero: true, suggestedMax: latestSuggestedMax, title: { display: true, text: 'Generation (kWh)' }, grid: { color: '#f1f5f9' }, ticks: { callback: value => Number(value).toLocaleString('en-IN') } }
                }
            }
        });
    }

    function patchChartUpdate() {
        if (chartUpdatePatched || typeof Chart === 'undefined' || !Chart.prototype || !Chart.prototype.update) return;
        chartUpdatePatched = true;
        const originalUpdate = Chart.prototype.update;
        Chart.prototype.update = function (...args) {
            if (!applying && chartCanvas(this)?.id === 'genChart') {
                forceWeeklyConfig(this);
            }
            return originalUpdate.apply(this, args);
        };
    }

    function applyWeeklyChart() {
        patchChartUpdate();
        const days = weekDates();
        const todayKey = localDateKey(new Date());
        const rows = (weeklyPayload && Array.isArray(weeklyPayload.data)) ? weeklyPayload.data : [];
        const dataMap = new Map(rows.map(row => [row.date, Number(row.actual || 0)]));
        const liveToday = liveTodayKwh();
        if (liveToday > 0) dataMap.set(todayKey, Math.max(dataMap.get(todayKey) || 0, liveToday));

        const expected = Math.max(...rows.map(row => Number(row.expected || 0)), expectedDailyFromConfig(), 1000);
        latestLabels = days.map(day => day.label);
        latestValues = days.map(day => Number((dataMap.get(day.key) || 0).toFixed(2)));
        const maxValue = Math.max(...latestValues, expected, 0);
        latestSuggestedMax = niceMax(Math.max(maxValue * 1.15, expected));

        setTitle(days);
        updateDataAttributes(latestLabels, latestValues);
        ensureOwnedWeeklyCanvas();

        const chart = findGenerationChart();
        if (!chart) return;

        applying = true;
        forceWeeklyConfig(chart);
        applying = false;
        chart.update('none');
    }

    function loadWeeklyGeneration(force = false) {
        const now = Date.now();
        if (!force && now - lastFetchAt < 60000) return;
        lastFetchAt = now;
        const plantId = window.SIGNED_PLANT_ID || window.currentPlant || new URLSearchParams(window.location.search).get('plant') || '';
        if (!plantId) return;
        fetch(`api_weekly_generation.php?plant_id=${encodeURIComponent(plantId)}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(res => {
                if (!res || res.status !== 'success') return;
                weeklyPayload = res;
                applyWeeklyChart();
            })
            .catch(() => {});
    }

    function start() {
        patchChartUpdate();
        setTitle();
        loadWeeklyGeneration(true);
        applyWeeklyChart();
        setTimeout(applyWeeklyChart, 250);
        setTimeout(applyWeeklyChart, 750);
        setTimeout(applyWeeklyChart, 1500);
        setInterval(() => {
            loadWeeklyGeneration(false);
            applyWeeklyChart();
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();