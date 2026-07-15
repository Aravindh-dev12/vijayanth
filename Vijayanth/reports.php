<?php require 'check_auth.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Reports - Solar Plant</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .report-table { table-layout: fixed; min-width: 1200px; width: 100%; border-collapse: collapse; }
        .table-hscroll { overflow-x: auto; overflow-y: visible; }
        .report-table th, .report-table td { padding: 4px 2px; text-align: center; overflow: hidden; text-overflow: ellipsis; }
        .report-table td { font-size: 11px; color: #334155; border-bottom: 1px solid #f1f5f9; font-variant-numeric: tabular-nums; }
        .report-table th { color: #475569; font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: 0; border-bottom: 2px solid #e2e8f0; line-height: 1.1; }
        .report-table tbody tr { transition: background-color 0.2s ease; background-color: #ffffff; }
        .report-table tbody tr:hover { background-color: #f8fafc !important; }
        .table-hscroll::-webkit-scrollbar { height: 10px; }
        .table-hscroll::-webkit-scrollbar-track { background: #f8fafc; border-radius: 5px; }
        .table-hscroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 5px; }
        .table-hscroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .pdf-mode .table-hscroll { overflow: visible !important; width: 100% !important; max-width: none !important; }
        .pdf-mode .report-table { table-layout: fixed !important; width: 100% !important; }
        .pdf-mode { background: #ffffff !important; padding: 15px !important; }
    </style>
</head>
<body class="h-full bg-slate-50 text-gray-800 font-sans">
    <div class="min-h-screen flex relative">
        <div id="overlay" class="fixed inset-0 bg-slate-900 bg-opacity-40 hidden z-30 md:hidden transition-opacity"></div>
        <div id="sidebar-container"></div>
        <main class="flex-1 flex flex-col w-full md:ml-64 overflow-x-hidden">
        <header class="bg-white border-b border-gray-200 p-4 sm:px-6 flex justify-between items-center shadow-sm sticky top-0 z-20">
            <div class="flex items-center gap-3 sm:gap-4">
                <button id="menuBtn" class="md:hidden text-green-700 text-2xl focus:outline-none">&#9776;</button>
                <div>
                    <h2 class="text-lg sm:text-xl font-bold text-gray-800">System Reports</h2>
                    <p class="text-xs text-gray-500 hidden sm:block">Generate, view, and export plant data</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="exportToPDF()" class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm">
                    <i class="fa-solid fa-file-pdf"></i><span class="hidden sm:inline">Export PDF</span>
                </button>
                <button onclick="downloadJson()" id="dlBtn" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm opacity-50 cursor-not-allowed" disabled>
                    <i class="fa-solid fa-download"></i><span class="hidden sm:inline">JSON</span>
                </button>
            </div>
        </header>

        <div class="p-4 sm:p-6 w-full flex flex-col gap-6 max-w-[1600px] mx-auto">
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                <div class="flex flex-wrap gap-2" id="tab-container">
                    <button class="px-4 py-2 text-sm font-bold rounded-lg bg-green-50 text-green-700 border border-green-200 transition">Inverter Generation</button>
                </div>
                <div class="flex items-center gap-2 w-full lg:w-auto flex-wrap">
                    <select id="plantSelect" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 font-medium cursor-pointer">
                        <option value="vijayanth">Bojaraj Textiles Pvt Ltd</option>
                        <option value="krishna">Krishna Poultry Farm</option>
                    </select>
                    <select id="reportType" onchange="toggleInputs()" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 font-medium cursor-pointer">
                        <option value="daily">Daily</option>
                        <option value="monthly">Monthly</option>
                    </select>
                    <input type="date" id="dateSelect" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 font-medium">
                    <input type="month" id="monthSelect" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 font-medium hidden">
                    <button onclick="generateReportData(); startAutoRefresh();" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition flex items-center gap-2 text-sm">
                        <i class="fa-solid fa-eye"></i> View
                    </button>
                </div>
            </div>

            <div class="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col">
                <div id="printableReport" class="p-5 bg-white w-full">
                    <div class="border-b-2 border-green-600 pb-4 mb-6">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h1 id="reportPlantName" class="text-2xl font-black text-gray-900 tracking-tight">SOLAR ENERGY</h1>
                                <h2 id="reportMainTitle" class="text-lg font-bold text-green-700 mt-1">Inverter Generation Report</h2>
                            </div>
                        </div>
                        <div class="grid grid-cols-3 gap-4 text-sm mt-4 font-medium text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div><span class="text-gray-500 uppercase text-xs font-bold block">Plant Location</span><span id="reportLocation">Tamil Nadu</span></div>
                            <div><span class="text-gray-500 uppercase text-xs font-bold block">Plant Capacity</span><span id="reportCapacity">4.0 MW</span></div>
                            <div><span class="text-gray-500 uppercase text-xs font-bold block" id="reportDateLabel">Report Date</span><span id="displayDate" class="font-bold text-gray-900">--</span><br><span id="liveStatus" class="text-xs font-bold text-emerald-600 mt-0.5 inline-flex items-center gap-1"><span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>Auto-refresh ON</span></div>
                        </div>
                    </div>
                    <div class="table-hscroll w-full">
                        <table class="w-full report-table border-collapse">
                            <thead></thead>
                            <tbody id="reportTableBody">
                                <tr><td colspan="30" class="py-10 text-center text-gray-500"><div class="flex flex-col items-center justify-center"><div class="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>Loading live data...</div></td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-12 pt-8 flex justify-between text-sm font-bold text-gray-800 border-t border-gray-200">
                        <div class="text-center w-40"><div class="border-b border-gray-400 mb-2 h-8"></div>Operator Signature</div>
                        <div class="text-center w-40"><div class="border-b border-gray-400 mb-2 h-8"></div>Site Engineer</div>
                        <div class="text-center w-40"><div class="border-b border-gray-400 mb-2 h-8"></div>Plant Manager</div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    </div>

    <script>
        const currentPlant = '<?php echo addslashes($currentPlant); ?>';
        const plantConfig = <?php echo getPlantPublicConfigJson(); ?>;
        const userRole = '<?php echo addslashes($user['role'] ?? 'user'); ?>';

        const plants = [
            { id: 'vijayanth', name: 'Bojaraj Textiles Pvt Ltd', unit_id: 'via-1mw', capacity: 4.0, location: 'Tamil Nadu' },
            { id: 'krishna', name: 'Krishna Poultry Farm', unit_id: 'via-3mw', capacity: 3.0, location: 'Tamil Nadu' }
        ];

        let currentReportTab = 'inv_vcb';
        let lastReportData = null;
        let refreshInterval = null;
        let ws = null;
        let wsConnected = false;
        let pendingReportRequest = false;
        let wsReportTimeout = null;
        let deviceList = [];
        let expectedDevices = [];
        let dailyDataByDevice = {};
        let receivedDeviceCount = 0;
        
        const dateInput = document.getElementById('dateSelect');
        const monthInput = document.getElementById('monthSelect');
        dateInput.value = new Date().toISOString().split('T')[0];
        monthInput.value = new Date().toISOString().slice(0, 7);

        const plantSelect = document.getElementById('plantSelect');
        
        // Hide plant dropdown for non-admin users
        if (userRole !== 'admin') {
            plantSelect.style.display = 'none';
        }
        
        plantSelect.value = currentPlant;

        // Update plant info on page load
        const currentPlantObj = plants.find(p => p.id === currentPlant);
        if (currentPlantObj) {
            document.getElementById('reportPlantName').textContent = currentPlantObj.name.toUpperCase();
            document.getElementById('reportLocation').textContent = currentPlantObj.location;
            document.getElementById('reportCapacity').textContent = currentPlantObj.capacity + ' MW';
        }

        // When plant changes (admin only), update display
        plantSelect.addEventListener('change', function() {
            const plant = plants.find(p => p.id === this.value);
            if (plant) {
                document.getElementById('reportPlantName').textContent = plant.name.toUpperCase();
                document.getElementById('reportLocation').textContent = plant.location;
                document.getElementById('reportCapacity').textContent = plant.capacity + ' MW';
            }
        });

        function loadSidebar() {
            fetch('sidebar.html', { cache: 'no-store' }).then(r => r.text()).then(html => {
                document.getElementById('sidebar-container').innerHTML = html;
                document.getElementById('sidebar-container').querySelectorAll('script').forEach(s => { const ns = document.createElement('script'); ns.textContent = s.textContent; s.replaceWith(ns); });
                const overlay = document.getElementById('overlay');
                const sidebar = document.getElementById('sidebar');
                document.getElementById('menuBtn')?.addEventListener('click', () => { sidebar?.classList.remove('-translate-x-full'); overlay?.classList.remove('hidden'); });
                document.getElementById('closeSidebarBtn')?.addEventListener('click', () => { sidebar?.classList.add('-translate-x-full'); overlay?.classList.add('hidden'); });
                overlay?.addEventListener('click', () => { sidebar?.classList.add('-translate-x-full'); overlay.classList.add('hidden'); });
            });
        }

        function startAutoRefresh() {
            if (refreshInterval) clearInterval(refreshInterval);
            refreshInterval = setInterval(() => { generateReportData(); }, 30000);
        }

        function stopAutoRefresh() {
            if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null; }
        }

        function updateLiveStatus() {
            const now = new Date();
            const time = now.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
            document.getElementById('liveStatus').innerHTML = '<span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>Updated ' + time;
        }

        function toggleInputs() {
            const type = document.getElementById('reportType').value;
            if (type === 'daily') { dateInput.classList.remove('hidden'); monthInput.classList.add('hidden'); document.getElementById('reportDateLabel').innerText = "Report Date"; }
            else { dateInput.classList.add('hidden'); monthInput.classList.remove('hidden'); document.getElementById('reportDateLabel').innerText = "Report Month"; }
        }

        const wsUrl = "wss://vinobasolar.scadahub.in:5001";
        console.log('[Reports] WebSocket URL configured:', wsUrl);
        
        function connectReportWS() {
            if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                console.log('[Reports] WS already connected or connecting');
                return;
            }
            try {
                console.log('[Reports] Connecting to WebSocket:', wsUrl);
                ws = new WebSocket(wsUrl);
                ws.onopen = () => { 
                    wsConnected = true; 
                    console.log('[Reports] ✓ WS connected successfully to', wsUrl); 
                };
                ws.onmessage = (e) => {
                    try {
                        const d = JSON.parse(e.data);
                        
                        // Log non-data messages for debugging
                        if (d.type !== 'data') {
                            console.log('[Reports] ← WS message:', d.type, 'unit:', d.unit_id);
                        }
                        
                        // Handle daily_data_result and monthly_data_result
                        if (d.type === 'daily_data_result' || d.type === 'monthly_data_result') {
                            console.log('[Reports] ← Received', d.type, 'for device:', d.deviceName || d.device);
                            handleDailyDataResult(d);
                            return;
                        }
                        
                        // Handle device list response
                        if (d.type === 'device_list') {
                            handleDeviceList(d);
                            return;
                        }
                        
                        // Ignore live telemetry "data" messages
                        if (d.type === 'data') {
                            return;
                        }
                        
                    } catch(err) { 
                        console.error('[Reports] WS parse error:', err); 
                        console.error('[Reports] Raw message:', e.data.substring(0, 200));
                    }
                };
                ws.onclose = () => { 
                    wsConnected = false; 
                    console.warn('[Reports] ✗ WS disconnected, reconnecting in 5s...');
                    setTimeout(connectReportWS, 5000); 
                };
                ws.onerror = (err) => { 
                    console.error('[Reports] ✗ WS error:', err); 
                    wsConnected = false; 
                };
            } catch(err) { 
                console.error('[Reports] ✗ WS connect failed:', err); 
            }
        }

        function handleDeviceList(d) {
            console.log('[Reports] ✓ Received device_list:', d);
            deviceList = d.devices || [];
            
            if (!deviceList.length) {
                console.error('[Reports] ✗ No devices in list');
                return;
            }
            
            // Filter only inverter devices
            const inverters = deviceList.filter(dev => {
                const name = (dev.name || dev.deviceName || '').toLowerCase();
                return name.includes('inverter') && !name.includes('vcb');
            });
            
            console.log('[Reports] ✓ Found', inverters.length, 'inverters:', inverters.map(inv => inv.name || inv.deviceName));
            
            if (!pendingReportRequest) {
                console.log('[Reports] Not waiting for report, skipping data request');
                return;
            }
            
            if (!inverters.length) {
                console.error('[Reports] ✗ No inverter devices found');
                const tbody = document.getElementById('reportTableBody');
                tbody.innerHTML = '<tr><td colspan="30" class="py-10 text-center text-red-500">No inverter devices found</td></tr>';
                pendingReportRequest = false;
                return;
            }
            
            // Now request daily data for each inverter
            const type = document.getElementById('reportType').value;
            const selectedDate = type === 'daily' ? dateInput.value : monthInput.value;
            const plantId = plantSelect.value;
            const plant = plants.find(p => p.id === plantId);
            
            expectedDevices = inverters.map(inv => inv.name || inv.deviceName);
            console.log('[Reports] ✓ Requesting daily data for', expectedDevices.length, 'devices on date:', selectedDate);
            
            // Request data for each inverter
            inverters.forEach(inv => {
                const deviceName = inv.name || inv.deviceName;
                const requestMsg = {
                    type: 'get_daily_data',
                    unit_id: plant.unit_id,
                    device: deviceName,
                    date: selectedDate
                };
                ws.send(JSON.stringify(requestMsg));
                console.log('[Reports] → Sent get_daily_data:', deviceName);
            });
            
            console.log('[Reports] ⏳ Waiting for', expectedDevices.length, 'daily_data_result messages...');
        }
        
        function handleDailyDataResult(d) {
            const deviceName = d.deviceName || d.device || 'unknown';
            const data = d.data || [];
            
            // FILTER OUT VCB and non-inverter devices
            if (!/inverter/i.test(deviceName)) {
                console.log('[Reports] ⏭ Skipping non-inverter device:', deviceName);
                return;
            }
            
            if (!pendingReportRequest) {
                console.log('[Reports] Not waiting for report, ignoring daily_data_result');
                return;
            }
            
            console.log('[Reports] ✓ Received daily_data_result for:', deviceName, 'with', data.length, 'data points');
            
            // Store this device's data
            dailyDataByDevice[deviceName] = data;
            receivedDeviceCount++;
            
            console.log('[Reports] Progress:', receivedDeviceCount, '/', expectedDevices.length, 'devices received');
            
            // If expectedDevices is empty (device_list never arrived), use auto-detection
            if (expectedDevices.length === 0) {
                console.log('[Reports] ⚠ No device_list received, using auto-detection mode');
                
                // Wait for more devices with timeout
                if (!window.reportBuildTimeout) {
                    window.reportBuildTimeout = setTimeout(() => {
                        console.log('[Reports] ⏱ Auto-detect timeout, building with', receivedDeviceCount, 'devices');
                        buildReportFromDailyData();
                    }, 8000); // Wait 8 seconds to collect all inverters
                }
                
                // If we have 10+ inverters, build immediately
                if (receivedDeviceCount >= 10) {
                    if (window.reportBuildTimeout) {
                        clearTimeout(window.reportBuildTimeout);
                        window.reportBuildTimeout = null;
                    }
                    console.log('[Reports] ✓ Got 10+ inverters, building report now...');
                    buildReportFromDailyData();
                }
                return;
            }
            
            // If we have all expected devices, build immediately
            if (receivedDeviceCount >= expectedDevices.length) {
                console.log('[Reports] ✓ All devices received, building report now...');
                if (window.reportBuildTimeout) {
                    clearTimeout(window.reportBuildTimeout);
                    window.reportBuildTimeout = null;
                }
                buildReportFromDailyData();
                return;
            }
            
            // Otherwise, wait a bit for more devices (in case some are slow)
            if (!window.reportBuildTimeout) {
                window.reportBuildTimeout = setTimeout(() => {
                    console.log('[Reports] ⏱ Timeout waiting for more devices, building with', receivedDeviceCount, 'devices');
                    buildReportFromDailyData();
                }, 5000); // Wait 5 seconds after first device
            }
        }
        
        function buildReportFromDailyData() {
            console.log('[Reports] Building report from', Object.keys(dailyDataByDevice).length, 'devices');
            
            if (Object.keys(dailyDataByDevice).length === 0) {
                console.error('[Reports] No device data received');
                const tbody = document.getElementById('reportTableBody');
                tbody.innerHTML = '<tr><td colspan="30" class="py-10 text-center text-red-500">No inverter data received</td></tr>';
                pendingReportRequest = false;
                return;
            }
            
            pendingReportRequest = false;
            if (wsReportTimeout) { clearTimeout(wsReportTimeout); wsReportTimeout = null; }
            
            const type = document.getElementById('reportType').value;
            const invNames = Object.keys(dailyDataByDevice).sort();
            
            console.log('[Reports] Inverters found:', invNames);
            
            // Group data by hour (for daily) or by day (for monthly)
            const timeSlots = {};
            
            invNames.forEach((deviceName, idx) => {
                const deviceData = dailyDataByDevice[deviceName];
                
                deviceData.forEach(point => {
                    const timestamp = point.timestamp || point.time || '';
                    let timeLabel;
                    
                    if (type === 'daily') {
                        // Extract hour: "2026-07-15 05:30:00" -> "05:00"
                        const hourNum = parseInt(timestamp.substring(11, 13), 10);
                        
                        // FILTER: Only include working hours 06:00 to 18:00 (like Vinobasolar)
                        if (hourNum < 6 || hourNum > 18) {
                            return; // Skip this data point
                        }
                        
                        timeLabel = String(hourNum).padStart(2, '0') + ':00';
                    } else {
                        // Extract day: "2026-07-15" -> "15-07-2026"
                        const datePart = timestamp.substring(0, 10);
                        const [year, month, day] = datePart.split('-');
                        timeLabel = `${day}-${month}-${year}`;
                    }
                    
                    if (!timeSlots[timeLabel]) {
                        timeSlots[timeLabel] = { time_label: timeLabel };
                        invNames.forEach((_, i) => {
                            timeSlots[timeLabel]['inv' + (i+1) + '_kwh'] = 0;
                            timeSlots[timeLabel]['inv' + (i+1) + '_kw'] = 0;
                            timeSlots[timeLabel]['inv' + (i+1) + '_temp'] = 0;
                        });
                        timeSlots[timeLabel].vcb_kwh = 0;
                        timeSlots[timeLabel].vcb_kw = 0;
                        timeSlots[timeLabel].tx_loss = 0;
                        timeSlots[timeLabel].ot = 0;
                        timeSlots[timeLabel].wt1 = 0;
                        timeSlots[timeLabel].wt2 = 0;
                    }
                    
                    // Extract "Daily power yields" value
                    const dailyGen = point.values?.['Daily power yields'] || 0;
                    const activePower = point.values?.['Total active power'] || 0;
                    const temp = point.values?.['Internal temperature'] || 0;
                    
                    // Store max value for this hour/day (aggregating 5-minute intervals into hourly)
                    timeSlots[timeLabel]['inv' + (idx+1) + '_kwh'] = Math.max(
                        timeSlots[timeLabel]['inv' + (idx+1) + '_kwh'],
                        parseFloat(dailyGen) || 0
                    );
                    timeSlots[timeLabel]['inv' + (idx+1) + '_kw'] = Math.max(
                        timeSlots[timeLabel]['inv' + (idx+1) + '_kw'],
                        parseFloat(activePower) || 0
                    );
                    timeSlots[timeLabel]['inv' + (idx+1) + '_temp'] = Math.max(
                        timeSlots[timeLabel]['inv' + (idx+1) + '_temp'],
                        parseFloat(temp) || 0
                    );
                });
            });
            
            const rows = Object.values(timeSlots).sort((a, b) => a.time_label.localeCompare(b.time_label));
            
            console.log('[Reports] Built', rows.length, 'rows');
            
            if (!rows.length) {
                const tbody = document.getElementById('reportTableBody');
                tbody.innerHTML = '<tr><td colspan="30" class="py-10 text-center text-gray-500">No data found for this period.</td></tr>';
                return;
            }
            
            lastReportData = { type: type, data: rows, meta: { inv_names: invNames } };
            renderReportData(type, rows, invNames);
            
            // Reset for next request
            dailyDataByDevice = {};
            receivedDeviceCount = 0;
        }
        
        function renderTableHeaders(type, invNames) {
            const thead = document.querySelector('.report-table thead');
            const n = invNames.length;
            const timeW = 90;
            const invW  = 110;
            const totW  = 120;
            let totalW = timeW + n * invW + totW;

            let topRow = `<th rowspan="2" style="width:${timeW}px;min-width:${timeW}px;">${type==='daily'?'Time':'Date'}</th>`;
            invNames.forEach(name => {
                topRow += `<th style="width:${invW}px;min-width:${invW}px;" class="bg-blue-50/60">${name}</th>`;
            });
            topRow += `<th style="width:${totW}px;min-width:${totW}px;" class="bg-indigo-50/70">Total Generation</th>`;

            let subRow = '';
            invNames.forEach(() => { subRow += `<th class="bg-blue-50/40">kWh</th>`; });
            subRow += `<th class="bg-indigo-50/50">kWh</th>`;

            thead.innerHTML = `<tr>${topRow}</tr><tr>${subRow}</tr>`;
            document.querySelector('.report-table').style.minWidth = totalW + 'px';
        }

        function renderReportData(type, rows, invNames) {
            const tbody = document.getElementById('reportTableBody');
            if (!rows || !rows.length) {
                tbody.innerHTML = '<tr><td colspan="30" class="py-10 text-center text-gray-500">No data found for this period.</td></tr>';
                return;
            }
            if (!invNames || !invNames.length) {
                invNames = [];
                for (let i = 1; i <= 14; i++) {
                    if (rows.some(r => (r['inv'+i+'_kwh']||0) > 0)) invNames.push('INV-'+i);
                }
                if (!invNames.length) invNames = ['INV-1','INV-2'];
            }
            renderTableHeaders(type, invNames);

            const totInvKwh = new Array(invNames.length).fill(0);
            let totInvTotal = 0;

            let html = '';
            rows.forEach((row, ri) => {
                // Check if this row has any generation data
                let hasGeneration = false;
                let rowInvTotal = 0;
                
                invNames.forEach((_, i) => {
                    const n = i + 1;
                    const kwh = row['inv'+n+'_kwh'] || 0;
                    if (kwh > 0) hasGeneration = true;
                    rowInvTotal += kwh;
                });
                
                // Skip rows with no generation (all zeros)
                if (!hasGeneration && rowInvTotal === 0) {
                    return;
                }
                
                const bgClass = ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/60';
                html += `<tr class="${bgClass} hover:bg-blue-50/30 transition-colors">`;
                html += `<td class="font-semibold text-gray-700 bg-gray-50/80 sticky-col">${row.time_label || '-'}</td>`;

                invNames.forEach((_, i) => {
                    const n = i + 1;
                    const kwh = row['inv'+n+'_kwh'] || 0;
                    totInvKwh[i] += kwh;
                    html += `<td class="text-blue-700 font-medium">${fmt(kwh)}</td>`;
                });

                const invTotal = (row.inv_total_kwh > 0) ? row.inv_total_kwh : rowInvTotal;
                totInvTotal += invTotal;

                html += `<td class="font-bold text-indigo-700">${fmt(invTotal)}</td>`;
                html += '</tr>';
            });

            tbody.innerHTML = html;
            updateLiveStatus();
            document.getElementById('dlBtn').disabled = false;
            document.getElementById('dlBtn').classList.remove('opacity-50','cursor-not-allowed');
        }

        function generateReportData() {
            const type = document.getElementById('reportType').value;
            const selectedDate = type === 'daily' ? dateInput.value : monthInput.value;
            const plantId = plantSelect.value;
            const plant = plants.find(p => p.id === plantId);
            if (!plant) return;

            document.getElementById('reportPlantName').textContent = plant.name.toUpperCase();
            document.getElementById('reportLocation').textContent = plant.location;
            document.getElementById('reportCapacity').textContent = plant.capacity + ' MW';

            const dateObj = new Date(type==='daily'?selectedDate:selectedDate+'-01');
            const options = type==='daily'?{year:'numeric',month:'long',day:'numeric'}:{year:'numeric',month:'long'};
            document.getElementById('displayDate').innerText = dateObj.toLocaleDateString('en-IN', options);
            
            const tbody = document.getElementById('reportTableBody');
            tbody.innerHTML = '<tr><td colspan="30" class="py-12 bg-white"><div class="flex flex-col items-center justify-center"><div class="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div><p class="mt-3 text-sm font-bold text-gray-600">Loading cached report...</p></div></td></tr>';

            // Reports are built from telemetry continuously stored by ws_collector.js.
            // This is one fast request instead of waiting for every device over WS.
            const reportUrl = `api_reports.php?type=${encodeURIComponent(type)}&date=${encodeURIComponent(selectedDate)}&plant=${encodeURIComponent(plantId)}`;
            fetch(reportUrl, { cache: 'no-store' })
                .then(response => {
                    if (!response.ok) throw new Error(`Report HTTP ${response.status}`);
                    return response.json();
                })
                .then(result => {
                    if (!result.success) throw new Error(result.error || 'Report request failed');
                    const rows = result.data || [];
                    const invNames = result.meta?.inv_names || [];
                    lastReportData = { type, data: rows, meta: { inv_names: invNames } };
                    renderReportData(type, rows, invNames);
                    updateLiveStatus();
                })
                .catch(error => {
                    console.error('[Reports] Fast report failed:', error);
                    tbody.innerHTML = `<tr><td colspan="30" class="py-10 text-center"><div class="text-red-500 font-bold">Unable to load report</div><div class="text-gray-400 text-xs mt-2">${error.message}</div></td></tr>`;
                });
            return;

            // Reset data collection
            pendingReportRequest = true;
            dailyDataByDevice = {};
            receivedDeviceCount = 0;
            expectedDevices = [];
            if (window.reportBuildTimeout) {
                clearTimeout(window.reportBuildTimeout);
                window.reportBuildTimeout = null;
            }
            
            connectReportWS();

            function sendDeviceListRequest() {
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    console.warn('[Reports] Cannot send request - WS not open. State:', ws?.readyState);
                    return false;
                }
                
                // Step 1: Subscribe
                const subMsg = { type: 'subscribe', unit_id: plant.unit_id };
                ws.send(JSON.stringify(subMsg));
                console.log('[Reports] ✓ Sent subscribe:', subMsg);
                
                // Step 2: Request device list
                const devicesMsg = { type: 'get_devices', unit_id: plant.unit_id };
                ws.send(JSON.stringify(devicesMsg));
                console.log('[Reports] ✓ Sent get_devices:', devicesMsg);
                
                // Fallback: If device_list doesn't arrive in 3 seconds, request data for common inverter names
                setTimeout(() => {
                    if (expectedDevices.length === 0 && pendingReportRequest) {
                        console.log('[Reports] ⚠ device_list timeout, requesting data for known inverter names...');
                        
                        // Request data for inverter1 through inverter20 (common names)
                        for (let i = 1; i <= 20; i++) {
                            const deviceName = `inverter${i}`;
                            const requestMsg = {
                                type: 'get_daily_data',
                                unit_id: plant.unit_id,
                                device: deviceName,
                                date: selectedDate
                            };
                            ws.send(JSON.stringify(requestMsg));
                        }
                        console.log('[Reports] ✓ Requested data for inverter1-inverter20');
                        console.log('[Reports] ⏳ Collecting responses (will auto-detect which inverters exist)...');
                    }
                }, 3000);
                
                return true;
            }

            if (!sendDeviceListRequest()) {
                setTimeout(() => sendDeviceListRequest(), 2000);
            }
            
            wsReportTimeout = setTimeout(() => {
                if (pendingReportRequest) {
                    console.error('[Reports] ✗ Timeout - no data received in 30s');
                    console.error('[Reports] Received devices:', receivedDeviceCount);
                    console.error('[Reports] Device data:', Object.keys(dailyDataByDevice));
                    pendingReportRequest = false;
                    
                    // If we got some data, show it anyway
                    if (receivedDeviceCount > 0) {
                        console.log('[Reports] Building report with partial data...');
                        buildReportFromDailyData();
                    } else {
                        tbody.innerHTML = '<tr><td colspan="30" class="py-10 text-center"><div class="text-red-500 font-bold mb-1">Connection Timeout</div><div class="text-gray-400 text-xs">No data received from WebSocket</div><div class="text-gray-400 text-xs mt-2">Ensure ws_collector.js is running for ' + plant.unit_id + '</div></td></tr>';
                    }
                }
            }, 30000);
        }

        function fmt(v) { return v !== undefined && v !== null ? Number(v).toFixed(2) : '0.00'; }

        function exportToPDF() {
            const element = document.getElementById('printableReport');
            const table = document.querySelector('.report-table');
            const tableWidth = table.getBoundingClientRect().width || 1200;
            const clone = element.cloneNode(true);
            clone.classList.add('pdf-mode');
            clone.style.position = 'absolute';
            clone.style.left = '0';
            clone.style.top = '0';
            clone.style.zIndex = '-9999';
            clone.style.backgroundColor = '#ffffff';
            clone.style.width = (tableWidth + 40) + 'px';
            clone.style.maxWidth = 'none';
            const cloneContainer = clone.querySelector('.table-hscroll');
            if (cloneContainer) {
                cloneContainer.style.overflow = 'visible';
                cloneContainer.style.width = '100%';
                cloneContainer.style.maxWidth = 'none';
            }
            document.body.appendChild(clone);
            const opt = {
                margin: 10,
                filename: 'solar_report.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, width: tableWidth + 40, windowWidth: tableWidth + 100, scrollX: 0, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };
            html2pdf().set(opt).from(clone).save().then(() => { document.body.removeChild(clone); });
        }

        function downloadJson() {
            if (!lastReportData || !lastReportData.data) return;
            const type = document.getElementById('reportType').value;
            const date = type === 'daily' ? dateInput.value : monthInput.value;
            const plantId = plantSelect.value;
            const plant = plants.find(p => p.id === plantId);
            
            const rows = lastReportData.data;
            let invNames = lastReportData.meta ? lastReportData.meta.inv_names : null;
            if (!invNames || !invNames.length) {
                invNames = [];
                for (let i = 1; i <= 14; i++) {
                    if (rows.some(r => (r['inv'+i+'_kwh']||0) > 0)) invNames.push('INV-'+i);
                }
                if (!invNames.length) invNames = ['INV-1','INV-2'];
            }
            
            const columns = [type === 'daily' ? 'Time' : 'Date'];
            invNames.forEach(name => columns.push(name + ' (kWh)'));
            columns.push('Total Generation (kWh)');
            
            const totInvKwh = {};
            invNames.forEach(name => totInvKwh[name] = 0);
            let totInvTotal = 0;
            
            const exportRows = rows.map(row => {
                const timeLabel = row.time_label || '';
                const inverters = {};
                let rowInvTotal = 0;
                
                invNames.forEach((name, i) => {
                    const n = i + 1;
                    const kwh = parseFloat(row['inv'+n+'_kwh']) || 0;
                    inverters[name] = parseFloat(kwh.toFixed(2));
                    rowInvTotal += kwh;
                    totInvKwh[name] += kwh;
                });
                
                const invTotal = (row.inv_total_kwh > 0) ? row.inv_total_kwh : rowInvTotal;
                totInvTotal += invTotal;
                
                const exportRow = {
                    [type === 'daily' ? 'time' : 'date']: timeLabel,
                    inverters: inverters,
                    total_generation: parseFloat(invTotal.toFixed(2))
                };
                return exportRow;
            });
            
            const exportTotals = {
                inverters: {},
                total_generation: parseFloat(totInvTotal.toFixed(2))
            };
            invNames.forEach(name => {
                exportTotals.inverters[name] = parseFloat(totInvKwh[name].toFixed(2));
            });
            
            const exportData = {
                plant_id: plantId,
                plant_name: plant.name,
                report_type: type,
                date: date,
                columns: columns,
                rows: exportRows,
                totals: exportTotals
            };
            
            const filename = `solar_${plantId}_${date}.json`;
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        }

        loadSidebar();
        connectReportWS();
        setTimeout(() => { generateReportData(); startAutoRefresh(); }, 1000);
        window.addEventListener('beforeunload', () => { stopAutoRefresh(); if (ws) ws.close(); });
    </script>
</body>
</html>
