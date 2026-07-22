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
                margin: 0 0 22px 0 !important;
            }
            #forcedOverviewInfoRow .forced-plant-overview-card,
            #forcedOverviewInfoRow .forced-plant-info-card {
                margin: 0 !important;
                height: 100% !important;
            }
            #forcedOverviewInfoRow .forced-plant-info-card {
                width: 310px !important;
                max-width: 310px !important;
                min-height: 0 !important;
                padding: 0 !important;
                border-radius: 12px !important;
                justify-self: stretch !important;
                align-self: stretch !important;
                overflow: hidden !important;
            }
            #forcedOverviewInfoRow .forced-plant-info-card h3 {
                margin: 0 !important;
                padding: 12px 14px !important;
                border-bottom: 1px solid #e5e7eb !important;
            }
            #forcedOverviewInfoRow .forced-plant-info-card .space-y-2 {
                display: grid !important;
                gap: 0 !important;
                padding: 0 !important;
            }
            #forcedOverviewInfoRow .forced-plant-info-card .flex.justify-between {
                display: grid !important;
                grid-template-columns: 92px minmax(0, 1fr) !important;
                gap: 8px !important;
                align-items: center !important;
                min-height: 39px !important;
                padding: 8px 14px !important;
                margin: 0 !important;
                border-bottom: 1px solid #eef2f7 !important;
            }
            #forcedOverviewInfoRow .forced-plant-info-card .flex.justify-between:last-child {
                border-bottom: 0 !important;
            }
            #forcedOverviewInfoRow .forced-plant-info-card .flex.justify-between span:last-child {
                text-align: right !important;
                overflow-wrap: anywhere !important;
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
            @media (max-width: 1100px) {
                #forcedOverviewInfoRow {
                    grid-template-columns: 1fr !important;
                }
                #forcedOverviewInfoRow .forced-plant-info-card {
                    width: 100% !important;
                    max-width: none !important;
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

    function fixPosition() {
        ensureStyle();
        const overviewCard = findPlantOverviewCard();
        const plantInfoCard = findPlantInfoCard();
        const content = findContentWrapper(overviewCard);
        if (!overviewCard || !plantInfoCard || !content || overviewCard === plantInfoCard) return;

        // Disable older overview CSS grid rules on the content wrapper so the new top row controls placement.
        setImportant(content, 'display', 'flex');
        setImportant(content, 'flex-direction', 'column');
        setImportant(content, 'gap', '0');
        setImportant(content, 'grid-template-columns', 'none');

        let row = document.getElementById('forcedOverviewInfoRow');
        if (!row) {
            row = document.createElement('div');
            row.id = 'forcedOverviewInfoRow';
            content.insertBefore(row, content.firstElementChild || null);
        }

        // Move both cards into the same row, in this exact order.
        if (overviewCard.parentElement !== row) row.appendChild(overviewCard);
        if (plantInfoCard.parentElement !== row) row.appendChild(plantInfoCard);

        overviewCard.classList.add('forced-plant-overview-card');
        plantInfoCard.classList.add('forced-plant-info-card');

        setImportant(row, 'display', 'grid');
        setImportant(row, 'grid-template-columns', 'minmax(0, 1fr) 310px');
        setImportant(row, 'gap', '18px');
        setImportant(row, 'align-items', 'stretch');
        setImportant(row, 'width', '100%');
        setImportant(row, 'margin', '0 0 22px 0');

        setImportant(overviewCard, 'grid-column', '1');
        setImportant(overviewCard, 'grid-row', '1');
        setImportant(overviewCard, 'width', '100%');
        setImportant(overviewCard, 'margin', '0');
        setImportant(overviewCard, 'height', '100%');

        setImportant(plantInfoCard, 'grid-column', '2');
        setImportant(plantInfoCard, 'grid-row', '1');
        setImportant(plantInfoCard, 'width', '310px');
        setImportant(plantInfoCard, 'max-width', '310px');
        setImportant(plantInfoCard, 'margin', '0');
        setImportant(plantInfoCard, 'align-self', 'stretch');
        setImportant(plantInfoCard, 'justify-self', 'stretch');

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

        if (window.innerWidth <= 1100) {
            setImportant(row, 'grid-template-columns', '1fr');
            setImportant(plantInfoCard, 'grid-column', '1');
            setImportant(plantInfoCard, 'grid-row', '2');
            setImportant(plantInfoCard, 'width', '100%');
            setImportant(plantInfoCard, 'max-width', 'none');
        }
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
