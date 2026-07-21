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

        // The via feeds can publish active power in watts. Overview displays kW.
        if (Math.abs(value) > 10000) value /= 1000;

        const decimals = Math.abs(value) >= 1000 ? 0 : 1;
        const expected = value.toFixed(decimals);
        const current = numberFromText(powerLine.textContent);
        const unitInline = powerLine.querySelector('.overview-power-unit');

        if (current !== value || !unitInline || powerLine.children.length !== 1) {
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

        const validCount = Array.from(grid.children).filter(card =>
            !card.classList.contains('col-span-full') && isRealInverterCard(card)
        ).length;
        const count = document.getElementById('overviewInvCount');
        if (count && count.textContent !== String(validCount)) count.textContent = String(validCount);
    }

    function fixOverviewColumns() {
        const heading = Array.from(document.querySelectorAll('h3')).find(el =>
            (el.textContent || '').trim().toLowerCase() === 'plant information'
        );
        const plantCard = heading?.closest('.bg-white');
        const row = plantCard?.parentElement;
        if (!plantCard || !row) return;

        row.classList.add('overview-inverter-info-row');
        plantCard.classList.add('overview-plant-info-card');
        const inverterCard = Array.from(row.children).find(el => el !== plantCard);
        inverterCard?.classList.add('overview-inverter-panel');

        plantCard.style.removeProperty('grid-column');
        plantCard.style.removeProperty('max-width');
        plantCard.style.removeProperty('justify-self');
        plantCard.style.removeProperty('align-self');
        inverterCard?.style.removeProperty('grid-column');
    }

    function apply() {
        scheduled = false;
        fixInverterGrid();
        fixOverviewColumns();
    }

    function schedule() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(apply);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply, { once: true });
    } else {
        apply();
    }

    const startObserver = () => {
        const grid = document.getElementById('inverterGrid');
        if (!grid) {
            setTimeout(startObserver, 250);
            return;
        }
        new MutationObserver(schedule).observe(grid, {
            childList: true,
            subtree: true,
            characterData: true
        });
        schedule();
    };

    startObserver();
    setTimeout(apply, 500);
    setTimeout(apply, 1500);
})();
