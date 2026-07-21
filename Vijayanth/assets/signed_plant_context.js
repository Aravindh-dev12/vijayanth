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
        vijayanth: {
            key: 'violet', main: '#7c3aed', dark: '#6d28d9', soft: '#ede9fe', pale: '#f5f3ff', border: '#c4b5fd'
        },
        bojaraj: {
            key: 'violet', main: '#7c3aed', dark: '#6d28d9', soft: '#ede9fe', pale: '#f5f3ff', border: '#c4b5fd'
        },
        krishna: {
            key: 'emerald', main: '#059669', dark: '#047857', soft: '#d1fae5', pale: '#ecfdf5', border: '#6ee7b7'
        },
        vijayanth_cosmic: {
            key: 'blue', main: '#2563eb', dark: '#1d4ed8', soft: '#dbeafe', pale: '#eff6ff', border: '#93c5fd'
        }
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
        if (document.getElementById('plant-sidebar-theme-style')) return;
        const style = document.createElement('style');
        style.id = 'plant-sidebar-theme-style';
        style.textContent = `
            #sidebar[data-plant-theme] #sidebarNav .nav-item { position: relative; }
            #sidebar[data-plant-theme] #sidebarNav .nav-item:hover {
                background: var(--plant-pale) !important;
                color: var(--plant-dark) !important;
            }
            #sidebar[data-plant-theme] #sidebarNav .nav-item:hover > i {
                color: var(--plant-main) !important;
                background: var(--plant-soft) !important;
            }
            #sidebar[data-plant-theme] #sidebarNav .nav-item > i {
                width: 30px !important;
                height: 30px !important;
                border-radius: 9px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: var(--plant-main);
                background: var(--plant-pale);
                transition: all .2s ease;
            }
            #sidebar[data-plant-theme] #sidebarNav .plant-active-nav {
                background: var(--plant-soft) !important;
                color: var(--plant-dark) !important;
                border-left: 4px solid var(--plant-main) !important;
                font-weight: 700 !important;
            }
            #sidebar[data-plant-theme] #sidebarNav .plant-active-nav > i {
                color: #fff !important;
                background: var(--plant-main) !important;
                box-shadow: 0 5px 12px color-mix(in srgb, var(--plant-main) 28%, transparent);
            }
            #sidebar[data-plant-theme] #adminBackDashboard {
                color: var(--plant-dark) !important;
                background: var(--plant-pale) !important;
            }
            #sidebar[data-plant-theme] #adminBackDashboard:hover {
                background: var(--plant-soft) !important;
            }
            #sidebar[data-plant-theme] #collapseSidebarBtn:hover {
                color: var(--plant-main) !important;
                border-color: var(--plant-border) !important;
            }
        `;
        document.head.appendChild(style);
    }

    function applySidebarTheme() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return false;
        installThemeStyles();

        sidebar.dataset.plantTheme = theme.key;
        sidebar.style.setProperty('--plant-main', theme.main);
        sidebar.style.setProperty('--plant-dark', theme.dark);
        sidebar.style.setProperty('--plant-soft', theme.soft);
        sidebar.style.setProperty('--plant-pale', theme.pale);
        sidebar.style.setProperty('--plant-border', theme.border);

        const logo = document.getElementById('logoWrapper');
        if (logo) {
            logo.style.background = `linear-gradient(135deg, ${theme.main}, ${theme.dark})`;
            logo.style.boxShadow = `0 10px 24px ${theme.main}40`;
        }

        const collapse = document.getElementById('collapseSidebarBtn');
        if (collapse) {
            collapse.style.color = theme.main;
            collapse.style.borderColor = theme.border;
        }

        const footerBrand = sidebar.querySelector('.text-emerald-700');
        if (footerBrand) {
            footerBrand.classList.remove('text-emerald-700');
            footerBrand.style.color = theme.dark;
        }

        const currentPage = (window.location.pathname.split('/').pop() || 'overview.php').toLowerCase();
        document.querySelectorAll('#sidebarNav a').forEach(link => {
            link.classList.remove('bg-emerald-100', 'text-emerald-700', 'border-emerald-600', 'plant-active-nav');
            const raw = link.getAttribute('href') || '';
            let linkPage = '';
            try { linkPage = new URL(raw, window.location.href).pathname.split('/').pop().toLowerCase(); } catch (e) {}
            if (linkPage === currentPage) link.classList.add('plant-active-nav');
        });
        return true;
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
        applySidebarTheme();
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
            if (option.textContent !== plantName) option.textContent = plantName;
            if (select.value !== plantId) select.value = plantId;
            if (role !== 'admin') {
                select.style.display = 'none';
                select.disabled = true;
            }
        }

        const nameEl = document.getElementById('reportPlantName');
        const locationEl = document.getElementById('reportLocation');
        const capacityEl = document.getElementById('reportCapacity');
        if (nameEl && nameEl.textContent !== plantName.toUpperCase()) nameEl.textContent = plantName.toUpperCase();
        if (locationEl && locationEl.textContent !== (location || '--')) locationEl.textContent = location || '--';
        const capacityText = `${capacity.toFixed(1)} MW`;
        if (capacityEl && capacityEl.textContent !== capacityText) capacityEl.textContent = capacityText;
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