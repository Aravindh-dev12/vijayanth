(function () {
    if (!/overview\.php$/i.test(window.location.pathname)) return;

    const DAY_MS = 24 * 60 * 60 * 1000;
    let weeklyPayload = null;
    let applyCount = 0;

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function localDateKey(date) {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function weekDates(today = new Date()) {
        const start = new Date(today);
        const day = start.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() + diffToMonday);
        return Array.from({ length: 7 }, (_, index) => {
            const d = new Date(start.getTime() + index * DAY_MS);
            return {
                key: localDateKey(d),
                label: d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })
            };
        });
    }

    function findGenerationChart() {
        const canvas = document.getElementById('genChart');
        if (!canvas || typeof Chart === 'undefined') return null;
        if (typeof Chart.getChart === 'function') return Chart.getChart(canvas) || null;
        const instances = Chart.instances || {};
        return Object.values(instances).find(chart => chart && chart.canvas === canvas) || null;
    }

    function setTitle() {
        const canvas = document.getElementById('genChart');
        const card = canvas?.closest('.bg-white');
        const title = card?.querySelector('h4');
        if (title) title.textContent = 'Generation Week (kWh)';
    }

    function applyWeeklyChart() {
        if (!weeklyPayload) return;
        const chart = findGenerationChart();
        if (!chart) return;

        const days = weekDates();
        const dataMap = new Map((weeklyPayload.data || []).map(row => [row.date, Number(row.actual || 0)]));
        const labels = days.map(day => day.label);
        const values = days.map(day => Number((dataMap.get(day.key) || 0).toFixed(2)));

        setTitle();
        chart.config.type = 'bar';
        chart.data.labels = labels;
        chart.data.datasets = [{
            label: 'Weekly generation (kWh)',
            data: values,
            backgroundColor: '#059669',
            borderRadius: 5,
            barPercentage: 0.58,
            categoryPercentage: 0.72
        }];
        chart.options.plugins = chart.options.plugins || {};
        chart.options.plugins.legend = { display: false };
        chart.options.scales = chart.options.scales || {};
        chart.options.scales.x = chart.options.scales.x || {};
        chart.options.scales.y = chart.options.scales.y || {};
        chart.options.scales.x.grid = { display: false };
        chart.options.scales.x.ticks = { autoSkip: false, maxRotation: 0, minRotation: 0 };
        chart.options.scales.y.title = { display: true, text: 'kWh' };
        chart.options.scales.y.beginAtZero = true;
        chart.options.scales.y.grid = { color: '#f1f5f9' };
        chart.update('none');
    }

    function loadWeeklyGeneration() {
        const plantId = window.SIGNED_PLANT_ID || window.currentPlant || new URLSearchParams(window.location.search).get('plant') || '';
        if (!plantId) return;
        fetch(`api.php?action=get_weekly_energy&plant_id=${encodeURIComponent(plantId)}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(res => {
                if (!res || res.status !== 'success') return;
                weeklyPayload = res;
                applyWeeklyChart();
            })
            .catch(() => {});
    }

    function start() {
        setTitle();
        loadWeeklyGeneration();
        const applyTimer = setInterval(() => {
            applyCount += 1;
            applyWeeklyChart();
            if (applyCount > 40) clearInterval(applyTimer);
        }, 1500);
        setInterval(loadWeeklyGeneration, 5 * 60 * 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
