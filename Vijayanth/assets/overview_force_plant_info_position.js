(function () {
    if (!/overview\.php$/i.test(window.location.pathname)) return;

    function setImportant(el, prop, value) {
        if (el) el.style.setProperty(prop, value, 'important');
    }

    function ensureStyle() {
        if (document.getElementById('overviewForcePlantInfoStyle')) return;
        const style = document.createElement('style');
        style.id = 'overviewForcePlantInfoStyle';
        style.textContent = `
            #forcedOverviewInfoRow {
                display: grid !important;
                grid-template-columns: minmax(0, 1fr) 310px !important;
                gap: 18px !important;
                align-items: stretch !important;
                width: 100% !important;
                margin: 0 0 18px 0 !important;
            }
            #forcedOverviewInfoRow .forced-plant-overview-card,
            #forcedOverviewInfoRow .forced-plant-info-card {
                margin: 0 !important;
                height: 168px !important;
                min-height: 168px !important;
                max-height: 168px !important;
                overflow: hidden !important;
                align-self: stretch !important;
            }
            #forcedOverviewInfoRow .forced-plant-overview-card {
                width: 100% !important;
            }
            #forcedOverviewInfoRow .forced-plant-info-card {
                width: 310px !important;
                max-width: 310px !important;
                padding: 0 !important;
                border-radius: 12px !important;
                justify-self: stretch !important;
                background: #fff !important;
            }
            #forcedOverviewInfoRow .forced-plant-info-card h3,
            #forcedOverviewInfoRow .forced-plant-overview-card > .bg-emerald-700,
            #forcedOverviewInfoRow .forced-plant-overview-card > .plant-table-heading {
                margin: 0 !important;
                padding: 7px 14px !important;
                min-height: 36px !important;
                height: 36px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: var(--plant-header-bg) !important;
                border-bottom: 1px solid var(--plant-border) !important;
                border-color: var(--plant-border) !important;
                color: #111827 !important;
                font-size: 15px !important;
                font-weight: 900 !important;
                line-height: 1.1 !important;
                letter-spacing: .01em !important;
                text-align: center !important;
            }
            #forcedOverviewInfoRow .forced-plant-overview-card .overflow-x-auto {
                height: calc(168px - 36px) !important;
                overflow-x: auto !important;
                overflow-y: hidden !important;
                display: flex !important;
                align-items: flex-start !important;
            }
            #forcedOverviewInfoRow .forced-plant-overview-card table {
                height: 96px !important;
            }
            #forcedOverviewInfoRow .forced-plant-overview-card table th,
            #forcedOverviewInfoRow .forced-plant-overview-card table td {
                padding-top: 9px !important;
                padding-bottom: 9px !important;
                line-height: 1.15 !important;
                height: 48px !important;
                font-size: 12px !important;
            }
            #forcedOverviewInfoRow .forced-plant-overview-card table th {
                font-size: 12px !important;
                font-weight: 900 !important;
            }
            #forcedOverviewInfoRow .forced-plant-info-card .space-y-2 {
                display: grid !important;
                grid-template-columns: 1fr !important;
                gap: 0 !important;
                padding: 0 !important;
            }
            #forcedOverviewInfoRow .forced-plant-info-card .flex.justify-between {
                display: grid !important;
                grid-template-columns: 92px minmax(0, 1fr) !important;
                gap: 8px !important;
                align-items: center !important;
                min-height: 26px !important;
                height: 26px !important;
                padding: 4px 14px !important;
                margin: 0 !important;
                border-bottom: 1px solid #eef2f7 !important;
                background: #fff !important;
            }
            #forcedOverviewInfoRow .forced-plant-info-card .flex.justify-between:last-child {
                border-bottom: 0 !important;
            }
            #forcedOverviewInfoRow .forced-plant-info-card .flex.justify-between span:first-child {
                color: #64748b !important;
                font-size: 10px !important;
                font-weight: 700 !important;
                line-height: 1.1 !important;
            }
            #forcedOverviewInfoRow .forced-plant-info-card .flex.justify-between span:last-child {
                text-align: right !important;
                overflow-wrap: anywhere !important;
                color: #111827 !important;
                font-size: 11px !important;
                font-weight: 800 !important;
                line-height: 1.12 !important;
            }
            .forced-overview-inverter-row {
                display: block !important;
                width: 100% !important;
                margin: 0 0 16px 0 !important;
            }
            .forced-overview-inverter-row > .bg-white {
                width: 100% !important;
                max-width: none !important;
            }
            .forced-overview-kpi-row {
                width: 100% !important;
                max-width: none !important;
                display: grid !important;
                grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
                gap: 12px !important;
                align-items: stretch !important;
            }
            .forced-overview-kpi-row > div {
                width: 100% !important;
                min-width: 0 !important;
            }
            @media (max-width: 1100px) {
                #forcedOverviewInfoRow {
                    grid-template-columns: 1fr !important;
                }
                #forcedOverviewInfoRow .forced-plant-overview-card,
                #forcedOverviewInfoRow .forced-plant-info-card {
                    height: auto !important;
                    min-height: 0 !important;
                    max-height: none !important;
                }
                #forcedOverviewInfoRow .forced-plant-info-card {
                    width: 100% !important;
                    max-width: none !important;
                }
                #forcedOverviewInfoRow .forced-plant-overview-card .overflow-x-auto {
                    height: auto !important;
                }
                .forced-overview-kpi-row {
                    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                }
            }
            @media (max-width: 640px) {
                .forced-overview-kpi-row {
                    grid-template-columns: 1fr !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function findPlantInfoCard() {
        const h = Array.from(document.querySelectorAll('h3')).find(el =>
            (el.textContent || '').trim().toLowerCase() === 'plant information'
        );
        return h ? h.closest('.bg-white') : null;
    }

    function findPlantOverviewCard() {
        const marker = document.getElementById('vcb_time') || document.getElementById('vcb_power') || document.getElementById('vcb_total');
        return marker ? marker.closest('.bg-white') : null;
    }

    function findContentWrapper(overviewCard) {
        return overviewCard?.parentElement?.closest('main > div') || document.querySelector('main > div.p-4') || document.querySelector('main > div');
    }

    function fixKpiCards() {
        const today = document.getElementById('today_energy_val');
        const row = today ? today.closest('.grid') : null;
        if (!row) return;
        row.classList.add('forced-overview-kpi-row');
        setImportant(row, 'width', '100%');
        setImportant(row, 'max-width', 'none');
        setImportant(row, 'display', 'grid');
        setImportant(row, 'grid-template-columns', window.innerWidth <= 640 ? '1fr' : (window.innerWidth <= 1100 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))'));
        setImportant(row, 'gap', '12px');
        Array.from(row.children).forEach(card => {
            setImportant(card, 'width', '100%');
            setImportant(card, 'min-width', '0');
        });
    }

    function fixPosition() {
        ensureStyle();
        const overviewCard = findPlantOverviewCard();
        const plantInfoCard = findPlantInfoCard();
        const content = findContentWrapper(overviewCard);
        if (!overviewCard || !plantInfoCard || !content || overviewCard === plantInfoCard) return;

        setImportant(content, 'display', 'flex');
        setImportant(content, 'flex-direction', 'column');
        setImportant(content, 'gap', '0');
        setImportant(content, 'grid-template-columns', 'none');
        setImportant(content, 'align-items', 'stretch');

        let row = document.getElementById('forcedOverviewInfoRow');
        if (!row) {
            row = document.createElement('div');
            row.id = 'forcedOverviewInfoRow';
            content.insertBefore(row, content.firstElementChild || null);
        }

        if (overviewCard.parentElement !== row) row.appendChild(overviewCard);
        if (plantInfoCard.parentElement !== row) row.appendChild(plantInfoCard);

        overviewCard.classList.add('forced-plant-overview-card');
        plantInfoCard.classList.add('forced-plant-info-card');

        setImportant(row, 'display', 'grid');
        setImportant(row, 'grid-template-columns', window.innerWidth <= 1100 ? '1fr' : 'minmax(0, 1fr) 310px');
        setImportant(row, 'gap', '18px');
        setImportant(row, 'align-items', 'stretch');
        setImportant(row, 'width', '100%');
        setImportant(row, 'margin', '0 0 18px 0');

        setImportant(overviewCard, 'grid-column', '1');
        setImportant(overviewCard, 'grid-row', '1');
        setImportant(overviewCard, 'width', '100%');
        setImportant(overviewCard, 'margin', '0');

        setImportant(plantInfoCard, 'grid-column', window.innerWidth <= 1100 ? '1' : '2');
        setImportant(plantInfoCard, 'grid-row', window.innerWidth <= 1100 ? '2' : '1');
        setImportant(plantInfoCard, 'width', window.innerWidth <= 1100 ? '100%' : '310px');
        setImportant(plantInfoCard, 'max-width', window.innerWidth <= 1100 ? 'none' : '310px');
        setImportant(plantInfoCard, 'margin', '0');
        setImportant(plantInfoCard, 'justify-self', 'stretch');

        if (window.innerWidth > 1100) {
            setImportant(overviewCard, 'height', '168px');
            setImportant(overviewCard, 'min-height', '168px');
            setImportant(overviewCard, 'max-height', '168px');
            setImportant(plantInfoCard, 'height', '168px');
            setImportant(plantInfoCard, 'min-height', '168px');
            setImportant(plantInfoCard, 'max-height', '168px');
        } else {
            setImportant(overviewCard, 'height', 'auto');
            setImportant(overviewCard, 'min-height', '0');
            setImportant(overviewCard, 'max-height', 'none');
            setImportant(plantInfoCard, 'height', 'auto');
            setImportant(plantInfoCard, 'min-height', '0');
            setImportant(plantInfoCard, 'max-height', 'none');
        }

        const inverterGrid = document.getElementById('inverterGrid');
        const inverterRow = inverterGrid ? inverterGrid.closest('.grid.grid-cols-12') : null;
        const inverterPanel = inverterGrid ? inverterGrid.closest('.bg-white') : null;
        if (inverterRow) {
            inverterRow.classList.add('forced-overview-inverter-row');
            setImportant(inverterRow, 'display', 'block');
            setImportant(inverterRow, 'width', '100%');
            setImportant(inverterRow, 'margin', '0 0 16px 0');
        }
        if (inverterPanel) {
            inverterPanel.classList.remove('lg:col-span-9');
            inverterPanel.classList.add('col-span-12');
            setImportant(inverterPanel, 'width', '100%');
            setImportant(inverterPanel, 'max-width', 'none');
            setImportant(inverterPanel, 'margin', '0');
        }

        fixKpiCards();
    }

    function start() {
        fixPosition();
        let count = 0;
        const timer = setInterval(() => {
            fixPosition();
            count += 1;
            if (count > 80) clearInterval(timer);
        }, 200);
        window.addEventListener('resize', fixPosition);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
