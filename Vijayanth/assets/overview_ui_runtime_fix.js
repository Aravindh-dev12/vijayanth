(function () {
    if (!/overview\.php$/i.test(window.location.pathname)) return;

    let scheduled = false;

    function numberFromText(text) {
        const match = String(text || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
        return match ? Number(match[0]) : null;
    }

    function isRealInverterCard(card) {
        const label = card.querySelector('p:first-of-type')?.textContent || '';
        return /\binv(?:erter)?\s*0*\d+\b/i.test(label.trim());
    }

    function normalizePower(card) {
        const powerLine = card.querySelector('p:nth-of-type(2)');
        if (!powerLine) return;
        let value = numberFromText(powerLine.textContent);
        if (!Number.isFinite(value)) return;
        if (Math.abs(value) > 10000) value /= 1000;
        const decimals = Math.abs(value) >= 1000 ? 0 : 1;
        const expected = value.toFixed(decimals);
        const unitInline = powerLine.querySelector('.overview-power-unit');
        if (!unitInline || powerLine.children.length !== 2 || powerLine.querySelector('.overview-power-value')?.textContent !== expected) {
            powerLine.innerHTML = `<span class="overview-power-value">${expected}</span><span class="overview-power-unit">kW</span>`;
        }
    }

    function fixInverterGrid() {
        const grid = document.getElementById('inverterGrid');
        if (!grid) return;
        const cards = Array.from(grid.children).filter(card => !card.classList.contains('col-span-full'));
        cards.forEach(card => {
            if (!isRealInverterCard(card)) {
                card.remove();
                return;
            }
            card.classList.add('overview-inverter-card');
            normalizePower(card);
        });
        const validCount = Array.from(grid.children).filter(card => !card.classList.contains('col-span-full') && isRealInverterCard(card)).length;
        const count = document.getElementById('overviewInvCount');
        if (count && count.textContent !== String(validCount)) count.textContent = String(validCount);
    }

    function findOverviewTable(content) {
        return Array.from(content.children).find(el => {
            if (el.classList?.contains('overview-table-info-row')) return false;
            const title = el.querySelector('div.bg-emerald-700, .plant-table-heading');
            return !!title && /plant overview/i.test(title.textContent || '');
        }) || Array.from(document.querySelectorAll('div.bg-emerald-700, .plant-table-heading')).map(title => title.closest('.bg-white')).find(Boolean);
    }

    function positionPlantInformation() {
        const heading = Array.from(document.querySelectorAll('h3')).find(el =>
            (el.textContent || '').trim().toLowerCase() === 'plant information'
        );
        const plantCard = heading?.closest('.bg-white');
        if (!plantCard) return;

        const originalRow = plantCard.parentElement;
        const inverterPanel = originalRow ? Array.from(originalRow.children).find(el => el !== plantCard) : null;
        const content = document.querySelector('main > div.p-4, main > div.sm\:p-6') || originalRow?.parentElement;
        if (!content) return;

        plantCard.classList.add('overview-plant-info-card');
        if (inverterPanel) inverterPanel.classList.add('overview-inverter-panel');
        if (originalRow) originalRow.classList.add('overview-inverter-row');

        const overviewTable = findOverviewTable(content);
        if (!overviewTable) {
            if (!plantCard.dataset.positioned) content.insertBefore(plantCard, content.firstElementChild || null);
            plantCard.dataset.positioned = 'overview-side-card';
            return;
        }

        let sideRow = document.querySelector('.overview-table-info-row');
        if (!sideRow) {
            sideRow = document.createElement('div');
            sideRow.className = 'overview-table-info-row';
            content.insertBefore(sideRow, overviewTable);
        }

        if (overviewTable.parentElement !== sideRow) sideRow.appendChild(overviewTable);
        if (plantCard.parentElement !== sideRow) sideRow.appendChild(plantCard);
        plantCard.dataset.positioned = 'overview-side-card';
    }

    function apply() {
        scheduled = false;
        fixInverterGrid();
        positionPlantInformation();
    }

    function schedule() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(apply);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
    else apply();

    const startObserver = () => {
        const main = document.querySelector('main');
        if (!main) {
            setTimeout(startObserver, 250);
            return;
        }
        new MutationObserver(schedule).observe(main, { childList: true, subtree: true, characterData: true });
        schedule();
    };

    startObserver();
    setTimeout(apply, 500);
    setTimeout(apply, 1500);
    setTimeout(apply, 3000);
})();