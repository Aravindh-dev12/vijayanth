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

    const themeMap = {
        vijayanth: { key: 'violet', main: '#7c3aed', dark: '#6d28d9', soft: '#ede9fe', border: '#c4b5fd' },
        bojaraj: { key: 'violet', main: '#7c3aed', dark: '#6d28d9', soft: '#ede9fe', border: '#c4b5fd' },
        krishna: { key: 'emerald', main: '#059669', dark: '#047857', soft: '#d1fae5', border: '#6ee7b7' },
        vijayanth_cosmic: { key: 'blue', main: '#2563eb', dark: '#1d4ed8', soft: '#dbeafe', border: '#93c5fd' }
    };
    const theme = themeMap[plantId] || themeMap.vijayanth_cosmic;

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

    function installThemeStyles() {
        if (document.getElementById('plant-ui-theme-style')) return;
        const style = document.createElement('style');
        style.id = 'plant-ui-theme-style';
        style.textContent = `
            :root {
                --plant-main: ${theme.main};
                --plant-dark: ${theme.dark};
                --plant-soft: ${theme.soft};
                --plant-border: ${theme.border};
            }
            #sidebar {
                background: #fff !important;
                border-right-color: #e2e8f0 !important;
            }
            #sidebar #sidebarHeader,
            #sidebar #sidebarNav,
            #sidebar > div:last-child {
                background: transparent !important;
            }
            #sidebar #logoWrapper {
                background: #f1f5f9 !important;
                color: var(--plant-main) !important;
                box-shadow: none !important;
                border: 1px solid #e2e8f0;
            }
            #sidebar #sidebarPlantName { color: var(--plant-dark) !important; }
            #sidebar #sidebarNav .nav-item {
                position: relative;
                background: transparent !important;
                color: #64748b !important;
                border-left-color: transparent !important;
            }
            #sidebar #sidebarNav .nav-item > i {
                width: 28px !important;
                height: 28px !important;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: var(--plant-main) !important;
                background: transparent !important;
                border-radius: 8px;
            }
            #sidebar #sidebarNav .nav-item:hover {
                background: #f8fafc !important;
                color: var(--plant-dark) !important;
            }
            #sidebar #sidebarNav .plant-active-nav {
                background: #f1f5f9 !important;
                color: var(--plant-dark) !important;
                border-left: 4px solid var(--plant-main) !important;
                font-weight: 700 !important;
            }
            #sidebar #sidebarNav .plant-active-nav > i {
                color: var(--plant-main) !important;
                background: transparent !important;
                box-shadow: none !important;
            }
            #sidebar #adminBackDashboard {
                background: transparent !important;
                color: var(--plant-dark) !important;
            }
            #sidebar #adminBackDashboard:hover { background: #f1f5f9 !important; }
            #sidebar #collapseSidebarBtn {
                color: var(--plant-main) !important;
                border-color: var(--plant-border) !important;
                background: #fff !important;
            }
            body[data-plant-theme] main header h1,
            body[data-plant-theme] main header h2,
            body[data-plant-theme] .plant-themed-text {
                color: var(--plant-dark) !important;
            }
            body[data-plant-theme] table thead,
            body[data-plant-theme] .plant-table-heading {
                background: var(--plant-main) !important;
                color: #fff !important;
            }
            body[data-plant-theme] table thead th { color: #fff !important; }
            body[data-plant-theme] .bg-emerald-700 {
                background: var(--plant-main) !important;
            }
        `;
        document.head.appendChild(style);
    }

    function applyTheme() {
        installThemeStyles();
        document.body?.setAttribute('data-plant-theme', theme.key);
        document.documentElement.style.setProperty('--plant-main', theme.main);
        document.documentElement.style.setProperty('--plant-dark', theme.dark);
        document.documentElement.style.setProperty('--plant-soft', theme.soft);
        document.documentElement.style.setProperty('--plant-border', theme.border);

        const footerBrand = document.querySelector('#sidebar .text-emerald-700');
        if (footerBrand) {
            footerBrand.classList.remove('text-emerald-700');
            footerBrand.style.color = theme.dark;
        }

        const currentPage = (window.location.pathname.split('/').pop() || 'overview.php').toLowerCase();
        document.querySelectorAll('#sidebarNav a').forEach(link => {
            link.classList.remove('bg-emerald-100', 'text-emerald-700', 'border-emerald-600', 'plant-active-nav');
            let linkPage = '';
            try { linkPage = new URL(link.getAttribute('href') || '', window.location.href).pathname.split('/').pop().toLowerCase(); } catch (e) {}
            if (linkPage === currentPage) link.classList.add('plant-active-nav');
        });
    }

    function fixSidebarAndLinks() {
        const sidebarName = document.getElementById('sidebarPlantName');
        if (sidebarName && sidebarName.textContent !== plantName) sidebarName.textContent = plantName;
        document.querySelectorAll('#sidebarNav a').forEach(link => {
            const raw = link.getAttribute('href') || '';
            if (!raw || raw.includes('logout.php')) return;
            try {
                const url = new URL(raw, window.location.href);
                if (url.searchParams.get('plant') !== plantId) {
                    url.searchParams.set('plant', plantId);
                    link.setAttribute('href', url.pathname.split('/').pop() + url.search);
                }
            } catch (e) {}
        });
        applyTheme();
    }

    function ensureReportsPlant() {
        if (!/reports\.php$/i.test(window.location.pathname)) return;
        try {
            if (typeof plants !== 'undefined' && Array.isArray(plants)) {
                const existing = plants.find(item => item.id === plantId);
                const entry = { id: plantId, name: plantName, unit_id: unitId, capacity, location };
                if (existing) Object.assign(existing, entry); else plants.push(entry);
            }
        } catch (e) {}
        const select = document.getElementById('plantSelect');
        if (select) {
            let option = Array.from(select.options).find(item => item.value === plantId);
            if (!option) { option = document.createElement('option'); option.value = plantId; select.appendChild(option); }
            option.textContent = plantName;
            select.value = plantId;
            if (role !== 'admin') { select.style.display = 'none'; select.disabled = true; }
        }
        const nameEl = document.getElementById('reportPlantName');
        const locationEl = document.getElementById('reportLocation');
        const capacityEl = document.getElementById('reportCapacity');
        if (nameEl) nameEl.textContent = plantName.toUpperCase();
        if (locationEl) locationEl.textContent = location || '--';
        if (capacityEl) capacityEl.textContent = `${capacity.toFixed(1)} MW`;
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

    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        const observer = new MutationObserver(() => {
            fixSidebarAndLinks();
            if (document.getElementById('sidebarNav')) observer.disconnect();
        });
        observer.observe(sidebarContainer, { childList: true, subtree: true });
    }

    setTimeout(apply, 250);
    setTimeout(apply, 1000);
})();