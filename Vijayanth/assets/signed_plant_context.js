(function () {
    const plantId = String(window.SIGNED_PLANT_ID || '').trim();
    const config = window.SIGNED_PLANT_CONFIG || {};
    const role = String(window.SIGNED_USER_ROLE || 'user').toLowerCase();
    if (!plantId || !config[plantId]) return;

    const plant = config[plantId];
    const plantName = plant.name || plantId.replace(/[-_]/g, ' ');
    const capacity = Number(plant.capacity || 0);
    const location = plant.location || '';
    const unitId = plant.ws_unit_id || '';

    function syncBrowserPlant() {
        let storedUser = {};
        try { storedUser = JSON.parse(sessionStorage.getItem('vs_user') || '{}'); } catch (e) {}
        if (role !== 'admin') {
            storedUser.plant_id = plantId;
            storedUser.role = storedUser.role || role;
            sessionStorage.setItem('vs_user', JSON.stringify(storedUser));
            sessionStorage.setItem('vs_current_plant', plantId);
        }
    }

    function fixSidebarAndLinks() {
        const sidebarName = document.getElementById('sidebarPlantName');
        if (sidebarName) sidebarName.textContent = plantName;

        document.querySelectorAll('#sidebarNav a').forEach(link => {
            const raw = link.getAttribute('href') || '';
            if (!raw || raw.includes('logout.php')) return;
            try {
                const url = new URL(raw, window.location.href);
                url.searchParams.set('plant', plantId);
                link.setAttribute('href', url.pathname.split('/').pop() + url.search);
            } catch (e) {}
        });
    }

    function ensureReportsPlant() {
        if (!/reports\.php$/i.test(window.location.pathname)) return;

        try {
            if (typeof plants !== 'undefined' && Array.isArray(plants)) {
                const existing = plants.find(item => item.id === plantId);
                const entry = { id: plantId, name: plantName, unit_id: unitId, capacity, location };
                if (existing) Object.assign(existing, entry);
                else plants.push(entry);
            }
        } catch (e) {}

        const select = document.getElementById('plantSelect');
        if (select) {
            let option = Array.from(select.options).find(item => item.value === plantId);
            if (!option) {
                option = document.createElement('option');
                option.value = plantId;
                select.appendChild(option);
            }
            option.textContent = plantName;
            select.value = plantId;
            if (role !== 'admin') {
                select.style.display = 'none';
                select.disabled = true;
            }
        }

        const nameEl = document.getElementById('reportPlantName');
        const locationEl = document.getElementById('reportLocation');
        const capacityEl = document.getElementById('reportCapacity');
        if (nameEl) nameEl.textContent = plantName.toUpperCase();
        if (locationEl) locationEl.textContent = location || '--';
        if (capacityEl) capacityEl.textContent = `${capacity.toFixed(1)} MW`;

        if (role !== 'admin') {
            try {
                Object.defineProperty(window, 'selectedReportPlant', {
                    configurable: true,
                    get: () => plantId,
                    set: () => plantId
                });
            } catch (e) {}
        }
    }

    function correctUrlForPlantUser() {
        if (role === 'admin') return;
        const url = new URL(window.location.href);
        if (url.searchParams.get('plant') !== plantId) {
            url.searchParams.set('plant', plantId);
            history.replaceState(null, '', url.pathname + url.search + url.hash);
        }
    }

    function apply() {
        syncBrowserPlant();
        correctUrlForPlantUser();
        fixSidebarAndLinks();
        ensureReportsPlant();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
    else apply();

    const observer = new MutationObserver(() => {
        fixSidebarAndLinks();
        ensureReportsPlant();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(apply, 250);
    setTimeout(apply, 1000);
})();
