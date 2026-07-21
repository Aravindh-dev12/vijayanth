(function () {
    if (!/overview\.php$/i.test(window.location.pathname)) return;

    const params = new URLSearchParams(window.location.search);
    const plantId = params.get('plant') || sessionStorage.getItem('vs_current_plant') || '';
    if (plantId !== 'vijayanth_cosmic') return;

    const wsUrl = 'wss://vinobasolar.scadahub.in:5001';
    const unitId = 'via-7mw';
    let latestPower = null;
    let latestDaily = null;
    let socket = null;
    let reconnectTimer = null;

    function readNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'object') {
            value = value.value ?? value.val ?? value.reading ?? value.data ?? null;
        }
        const number = parseFloat(String(value).replace(/,/g, ''));
        return Number.isFinite(number) ? number : null;
    }

    function findValue(values, acceptPatterns, rejectPatterns) {
        for (const [key, raw] of Object.entries(values || {})) {
            const normalizedKey = key.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
            if (rejectPatterns.some(pattern => pattern.test(normalizedKey))) continue;
            if (!acceptPatterns.some(pattern => pattern.test(normalizedKey))) continue;
            const value = readNumber(raw);
            if (value !== null) return value;
        }
        return null;
    }

    function isInverterThree(message) {
        const name = String(message.device || message.deviceName || message.task || '');
        const numberMatch = name.match(/(?:inverter|inv|solar)?\s*[-_#:]?\s*0*3\b/i);
        if (numberMatch) return true;
        const plainNumber = name.match(/\b0*3\b/);
        return Boolean(plainNumber && /inv|inverter|solar/i.test(name));
    }

    function extractTelemetry(values) {
        let power = findValue(
            values,
            [
                /^total active power(?:\s*\([^)]*\))?$/,
                /^active power(?:\s*\([^)]*\))?$/,
                /^ac active power/,
                /^ac power/,
                /^output power/,
                /^power output/,
                /^p ac$/,
                /^pac$/,
                /real power/
            ],
            [/reactive/, /apparent/, /nominal/, /rated/, /capacity/, /maximum/, /max power/, /dc power/, /string/, /mppt/, /phase [ryb123]/]
        );

        if (power === null) {
            power = findValue(values, [/power/], [/reactive/, /apparent/, /nominal/, /rated/, /capacity/, /maximum/, /max/, /dc/, /string/, /mppt/, /phase/, /yield/, /energy/, /factor/]);
        }

        const daily = findValue(
            values,
            [/^daily power yields?/, /daily.*yield/, /today.*energy/, /day.*energy/],
            []
        );

        if (power !== null && Math.abs(power) > 10000) power /= 1000;
        return { power, daily };
    }

    function findInverterThreeCard() {
        const grid = document.getElementById('inverterGrid');
        if (!grid) return null;
        return Array.from(grid.children).find(card => {
            const label = card.querySelector('p')?.textContent || '';
            return /^inv\s*0*3$/i.test(label.trim()) || /inverter\s*0*3/i.test(label);
        }) || null;
    }

    function renderLatest() {
        const card = findInverterThreeCard();
        if (!card || latestPower === null) return;

        const paragraphs = card.querySelectorAll('p');
        if (paragraphs[1]) {
            paragraphs[1].innerHTML = `${latestPower.toFixed(1)} <span class="text-[10px] font-bold">kW</span>`;
        }
        if (latestDaily !== null && paragraphs.length) {
            const dailyElement = Array.from(paragraphs).find(element => /kwh/i.test(element.textContent || ''));
            if (dailyElement) dailyElement.textContent = `${latestDaily.toFixed(1)} kWh`;
        }

        const isOn = latestPower > 0.5;
        card.classList.toggle('inv-on', isOn);
        card.classList.toggle('inv-off', !isOn);
    }

    function handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            if (message.unit_id !== unitId) return;

            if (message.type === 'daily_data_result') {
                const deviceName = message.deviceName || message.device || '';
                if (!isInverterThree({ device: deviceName })) return;
                const rows = Array.isArray(message.data) ? message.data.filter(row => row && row.values) : [];
                const latest = rows.length ? rows[rows.length - 1] : null;
                if (!latest) return;
                const telemetry = extractTelemetry(latest.values);
                if (telemetry.power !== null) latestPower = telemetry.power;
                if (telemetry.daily !== null) latestDaily = telemetry.daily;
                renderLatest();
                return;
            }

            if (!message.values || !isInverterThree(message)) return;
            const telemetry = extractTelemetry(message.values);
            if (telemetry.power !== null) latestPower = telemetry.power;
            if (telemetry.daily !== null) latestDaily = telemetry.daily;
            renderLatest();
        } catch (error) {
            console.warn('[Inverter3Fix] Invalid WebSocket packet', error);
        }
    }

    function connect() {
        clearTimeout(reconnectTimer);
        try {
            socket = new WebSocket(wsUrl);
            socket.addEventListener('open', () => {
                socket.send(JSON.stringify({ type: 'subscribe', unit_id: unitId }));
                socket.send(JSON.stringify({ type: 'get_devices', unit_id: unitId }));
            });
            socket.addEventListener('message', handleMessage);
            socket.addEventListener('close', () => {
                reconnectTimer = setTimeout(connect, 3000);
            });
            socket.addEventListener('error', () => socket.close());
        } catch (error) {
            reconnectTimer = setTimeout(connect, 3000);
        }
    }

    const observer = new MutationObserver(renderLatest);
    const startObserver = () => {
        const grid = document.getElementById('inverterGrid');
        if (grid) observer.observe(grid, { childList: true, subtree: true, characterData: true });
        else setTimeout(startObserver, 250);
    };

    startObserver();
    setInterval(renderLatest, 500);
    connect();
})();
