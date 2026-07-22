(function () {
    if (!/overview\.php$/i.test(window.location.pathname)) return;

    function ensureStyle() {
        if (document.getElementById('overviewForcePlantInfoStyle')) return;
        const style = document.createElement('style');
        style.id = 'overviewForcePlantInfoStyle';
        style.textContent = `
            .forced-overview-info-row {
                display: grid !important;
                grid-template-columns: minmax(0, 1fr) 260px !important;
                gap: 18px !important;
                align-items: stretch !important;
                width: 100% !important;
                margin: 0 0 22px !important;
            }
            .forced-overview-info-row > .bg-white {
                margin: 0 !important;
                height: 100% !important;
            }
            .forced-overview-info-row .forced-plant-info-card {
                width: 260px !important;
                max-width: 260px !important;
                min-height: 100% !important;
                padding: 14px !important;
                border-radius: 10px !important;
                justify-self: end !important;
            }
            .forced-plant-info-card h3 {
                margin-bottom: 10px !important;
            }
            .forced-plant-info-card .space-y-2 {
                display: grid !important;
                gap: 7px !important;
            }
            .forced-plant-info-card .flex.justify-between {
                display: grid !important;
                grid-template-columns: 86px minmax(0, 1fr) !important;
                gap: 8px !important;
                align-items: center !important;
                padding-bottom: 6px !important;
            }
            .forced-plant-info-card .flex.justify-between span:last-child {
                text-align: right !important;
                overflow-wrap: anywhere !important;
            }
            .forced-overview-inverter-row {
                display: block !important;
                margin-bottom: 16px !important;
            }
            .forced-overview-inverter-row > .bg-white {
                width: 100% !important;
            }
            @media (max-width: 1100px) {
                .forced-overview-info-row {
                    grid-template-columns: 1fr !important;
                }
                .forced-overview-info-row .forced-plant-info-card {
                    width: 100% !important;
                    max-width: none !important;
                    justify-self: stretch !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function findPlantInfoCard() {
        const headings = Array.from(document.querySelectorAll('h3'));
        const h = headings.find(el => (el.textContent || '').trim().toLowerCase() === 'plant information');
        return h ? h.closest('.bg-white') : null;
    }

    function findPlantOverviewCard() {
        const marker = document.getElementById('vcb_time') || document.getElementById('vcb_power') || document.getElementById('vcb_total');
        return marker ? marker.closest('.bg-white') : null;
    }

    function fixPosition() {
        ensureStyle();
        const overviewCard = findPlantOverviewCard();
        const plantInfoCard = findPlantInfoCard();
        const content = document.querySelector('main .p-4.sm\\:p-6, main > div');
        if (!overviewCard || !plantInfoCard || !content || overviewCard === plantInfoCard) return;

        let row = document.getElementById('forcedOverviewInfoRow');
        if (!row) {
            row = document.createElement('div');
            row.id = 'forcedOverviewInfoRow';
            row.className = 'forced-overview-info-row';
            content.insertBefore(row, overviewCard);
        }

        if (overviewCard.parentElement !== row) row.appendChild(overviewCard);
        if (plantInfoCard.parentElement !== row) row.appendChild(plantInfoCard);

        plantInfoCard.classList.add('forced-plant-info-card');
        overviewCard.classList.add('forced-plant-overview-card');

        const inverterGrid = document.getElementById('inverterGrid');
        const inverterRow = inverterGrid ? inverterGrid.closest('.grid.grid-cols-12') : null;
        const inverterPanel = inverterGrid ? inverterGrid.closest('.bg-white') : null;
        if (inverterRow) inverterRow.classList.add('forced-overview-inverter-row');
        if (inverterPanel) {
            inverterPanel.classList.remove('lg:col-span-9');
            inverterPanel.classList.add('col-span-12');
        }
    }

    function start() {
        fixPosition();
        let count = 0;
        const timer = setInterval(() => {
            fixPosition();
            count += 1;
            if (count > 60) clearInterval(timer);
        }, 250);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
