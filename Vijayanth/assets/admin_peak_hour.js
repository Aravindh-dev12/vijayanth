(function () {
    if (!/admin\.php$/i.test(window.location.pathname)) return;

    const config = window.SIGNED_PLANT_CONFIG || {};
    const plantEntries = Object.entries(config).filter(([, plant]) => plant && plant.ws_unit_id);
    if (!plantEntries.length) return;

    const state = {};
    plantEntries.forEach(([plantId, plant]) => {
        state[plant.ws_unit_id] = {
            plantId,
            devices: new Set(),
            hoursByDevice: {},
            liveByDevice: {},
            lastPeakKw: 0,
            lastPeakHour: null
        };
    });

    function numberValue(value) {
        if (value && typeof value === 'object') value = value.value ?? value.val ?? value.reading ?? value.data ?? value.result;
        const n = parseFloat(String(value ?? '').replace(/,/g, ''));
        return Number.isFinite(n) ? n : null;
    }

    function powerKw(value) {
        const n = numberValue(value);
        if (n === null) return null;
        return Math.abs(n) > 10000 ? n / 1000 : n;
    }

    function inverterNumber(name) {
        const text = String(name || '');
        const match = text.match(/(?:inverter|inv|solar)\s*[-_#:]?\s*0*(\d+)\b/i);
        return match ? parseInt(match[1], 10) : null;
    }

    function canonicalDevice(name) {
        const n = inverterNumber(name);
        return n ? `INVERTER${n}` : '';
    }

    function extractPower(values) {
        if (!values || typeof values !== 'object') return null;
        const preferred = [
            /^total active power(?:\s*\([^)]*\))?$/i,
            /^active power(?:\s*\([^)]*\))?$/i,
            /^ac active power/i,
            /^ac power/i,
            /^output power/i,
            /^power output/i,
            /^pac$/i,
            /^p ac$/i
        ];
        const rejected = /reactive|apparent|nominal|rated|capacity|maximum|max power|dc power|string|mppt|yield|energy|factor|3[ ._-]*phase/i;
        for (const [key, raw] of Object.entries(values)) {
            if (rejected.test(key)) continue;
            if (!preferred.some(rx => rx.test(key.trim()))) continue;
            const value = powerKw(raw);
            if (value !== null) return value;
        }
        for (const [key, raw] of Object.entries(values)) {
            if (!/power/i.test(key) || rejected.test(key)) continue;
            const value = powerKw(raw);
            if (value !== null) return value;
        }
        return null;
    }

    function hourFromTimestamp(value) {
        const text = String(value || '');
        const direct = text.match(/(?:T|\s|^)(\d{1,2}):\d{2}/);
        if (direct) return Math.max(0, Math.min(23, parseInt(direct[1], 10)));
        const date = new Date(text);
        return Number.isNaN(date.getTime()) ? null : date.getHours();
    }

    function ensurePeakUi(plantId) {
        const card = document.getElementById(`card-${plantId}`);
        if (!card) return null;
        let box = document.getElementById(`peak-${plantId}`);
        if (box) return box;

        const metricsGrid = card.querySelector('.p-4.grid.grid-cols-2');
        if (!metricsGrid) return null;
        metricsGrid.classList.remove('grid-cols-2');
        metricsGrid.classList.add('grid-cols-3');

        box = document.createElement('div');
        box.id = `peak-${plantId}`;
        box.className = 'bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center min-w-0';
        box.innerHTML = `
            <div class="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-wider whitespace-nowrap">
                <i class="fa-solid fa-chart-column text-blue-500 mr-1"></i>Peak Hour
            </div>
            <div class="text-sm font-black text-slate-800 truncate" data-peak-value>-- kW</div>
            <div class="text-[9px] font-semibold text-slate-400 mt-0.5" data-peak-time>Waiting for history</div>`;
        metricsGrid.appendChild(box);
        return box;
    }

    function renderPeak(unitId) {
        const st = state[unitId];
        if (!st) return;
        const totals = new Array(24).fill(0);
        const contributors = new Array(24).fill(0);

        Object.values(st.hoursByDevice).forEach(hours => {
            Object.entries(hours || {}).forEach(([hourText, value]) => {
                const hour = parseInt(hourText, 10);
                if (!Number.isInteger(hour) || hour < 0 || hour > 23) return;
                totals[hour] += Number(value) || 0;
                contributors[hour] += 1;
            });
        });

        Object.entries(st.liveByDevice).forEach(([, sample]) => {
            if (!sample || sample.hour === null || sample.power === null) return;
            if (!st.hoursByDevice[sample.device]?.[sample.hour] && sample.power >= 0) {
                totals[sample.hour] += sample.power;
                contributors[sample.hour] += 1;
            }
        });

        let peakHour = null;
        let peakKw = 0;
        totals.forEach((value, hour) => {
            if (contributors[hour] > 0 && value > peakKw) {
                peakKw = value;
                peakHour = hour;
            }
        });

        st.lastPeakKw = peakKw;
        st.lastPeakHour = peakHour;
        const box = ensurePeakUi(st.plantId);
        if (!box) return;
        const valueEl = box.querySelector('[data-peak-value]');
        const timeEl = box.querySelector('[data-peak-time]');
        if (valueEl) valueEl.textContent = peakHour === null ? '-- kW' : `${peakKw.toFixed(1)} kW`;
        if (timeEl) timeEl.textContent = peakHour === null
            ? 'No inverter history'
            : `${String(peakHour).padStart(2, '0')}:00–${String((peakHour + 1) % 24).padStart(2, '0')}:00 · all inverters`;
    }

    function processDailyResult(message) {
        const st = state[message.unit_id];
        if (!st) return;
        const rawName = message.deviceName || message.device || message.request?.device || '';
        const device = canonicalDevice(rawName);
        if (!device) return;

        const rows = Array.isArray(message.data)
            ? message.data
            : Array.isArray(message.result) ? message.result
            : Array.isArray(message.results) ? message.results : [];
        if (!rows.length) return;

        const hourly = {};
        rows.forEach(row => {
            const values = row?.values || row?.data || {};
            const power = extractPower(values);
            const hour = hourFromTimestamp(row?.time || row?.timestamp || row?.dateTime || row?.datetime || row?.bucket);
            if (power === null || hour === null || power < 0) return;
            // Use the highest observed sample in each hour for this inverter.
            hourly[hour] = Math.max(hourly[hour] || 0, power);
        });
        st.hoursByDevice[device] = hourly;
        renderPeak(message.unit_id);
    }

    function processLive(message) {
        const st = state[message.unit_id];
        if (!st || !message.values) return;
        const device = canonicalDevice(message.device || message.deviceName || message.task || '');
        if (!device) return;
        const power = extractPower(message.values);
        if (power === null || power < 0) return;
        st.liveByDevice[device] = { device, hour: new Date().getHours(), power };
        renderPeak(message.unit_id);
    }

    let socket = null;
    let reconnectTimer = null;
    let refreshTimer = null;

    function requestToday(unitId, deviceName) {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        const d = new Date();
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        socket.send(JSON.stringify({ type: 'get_daily_data', unit_id: unitId, device: deviceName, date }));
    }

    function refreshHistory() {
        Object.entries(state).forEach(([unitId, st]) => {
            st.devices.forEach(deviceName => requestToday(unitId, deviceName));
        });
    }

    function connect() {
        clearTimeout(reconnectTimer);
        clearInterval(refreshTimer);
        socket = new WebSocket('wss://vinobasolar.scadahub.in:5001');
        socket.addEventListener('open', () => {
            plantEntries.forEach(([, plant]) => {
                socket.send(JSON.stringify({ type: 'subscribe', unit_id: plant.ws_unit_id }));
                socket.send(JSON.stringify({ type: 'get_devices', unit_id: plant.ws_unit_id }));
            });
            refreshTimer = setInterval(refreshHistory, 300000);
        });
        socket.addEventListener('message', event => {
            try {
                const message = JSON.parse(event.data);
                if (!state[message.unit_id]) return;
                if (message.type === 'device_list') {
                    const devices = Array.isArray(message.devices) ? message.devices : [];
                    devices.forEach(item => {
                        const name = typeof item === 'string' ? item : (item.name || item.device || item.deviceName || '');
                        if (!canonicalDevice(name)) return;
                        state[message.unit_id].devices.add(name);
                        requestToday(message.unit_id, name);
                    });
                    return;
                }
                if (message.type === 'daily_data_result') processDailyResult(message);
                else processLive(message);
            } catch (error) {
                console.warn('[AdminPeakHour] Unable to parse telemetry', error);
            }
        });
        socket.addEventListener('close', () => {
            clearInterval(refreshTimer);
            reconnectTimer = setTimeout(connect, 4000);
        });
        socket.addEventListener('error', () => socket.close());
    }

    function initUi() {
        plantEntries.forEach(([plantId]) => ensurePeakUi(plantId));
        connect();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUi, { once: true });
    else initUi();
})();
