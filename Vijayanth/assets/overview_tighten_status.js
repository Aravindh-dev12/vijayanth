(function () {
    if (!/overview\.php$/i.test(window.location.pathname)) return;

    function important(el, prop, value) {
        if (el) el.style.setProperty(prop, value, 'important');
    }

    function numberFromText(text) {
        const n = parseFloat(String(text || '').replace(/,/g, '').replace(/[^0-9.\-]/g, ''));
        return Number.isFinite(n) ? n : 0;
    }

    function findPlantInfoCard() {
        return document.querySelector('.forced-plant-info-card') ||
            Array.from(document.querySelectorAll('h3')).find(h =>
                (h.textContent || '').trim().toLowerCase() === 'plant information'
            )?.closest('.bg-white') || null;
    }

    function removePlantInfoStatusRow() {
        const badge = document.getElementById('plantStatusBadge');
        const row = badge?.closest('.flex.justify-between') || badge?.parentElement;
        if (row) row.remove();
    }

    function combineNameCapacityRows() {
        const info = findPlantInfoCard();
        if (!info) return;

        const rows = Array.from(info.querySelectorAll('.flex.justify-between'));
        let nameRow = null;
        let capacityRow = null;

        rows.forEach(row => {
            const label = (row.querySelector('span:first-child')?.textContent || '').trim().toLowerCase();
            if (label === 'name') nameRow = row;
            if (label === 'capacity') capacityRow = row;
        });

        if (!nameRow || !capacityRow) return;

        const nameLabel = nameRow.querySelector('span:first-child');
        const nameValue = nameRow.querySelector('span:last-child');
        const capacityValue = capacityRow.querySelector('span:last-child');
        if (!nameLabel || !nameValue || !capacityValue) return;

        if (!nameValue.dataset.originalPlantName) {
            nameValue.dataset.originalPlantName = nameValue.textContent.trim();
        }
        if (!capacityValue.dataset.originalPlantCapacity) {
            capacityValue.dataset.originalPlantCapacity = capacityValue.textContent.trim();
        }

        const plantName = nameValue.dataset.originalPlantName;
        const capacity = capacityValue.dataset.originalPlantCapacity;
        nameLabel.textContent = 'Plant';
        nameValue.textContent = `${plantName} - ${capacity}`;
        capacityRow.remove();
    }

    function updateHeaderStatus() {
        let badge = document.getElementById('overviewHeaderStatusBadge');
        const title = document.getElementById('headerPlantName');
        if (!title) return;

        let wrap = title.closest('.overview-header-status-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'overview-header-status-wrap';
            title.parentNode.insertBefore(wrap, title);
            wrap.appendChild(title);
        }

        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'overviewHeaderStatusBadge';
            wrap.appendChild(badge);
        }

        const power = numberFromText(document.getElementById('vcb_power')?.textContent);
        const updated = (document.getElementById('vcb_time')?.textContent || '').trim();
        const isLive = power > 0 || (updated && !/^[-: ]+$/.test(updated) && updated !== '--:--:--');
        badge.textContent = isLive ? 'Live' : 'Offline';
        badge.classList.toggle('is-live', isLive);
        badge.classList.toggle('is-offline', !isLive);
        badge.classList.toggle('is-standby', !isLive);
    }

    function tightenTopCards() {
        const row = document.getElementById('forcedOverviewInfoRow');
        const overview = row?.querySelector('.forced-plant-overview-card');
        const info = row?.querySelector('.forced-plant-info-card');
        if (!row || !overview || !info) return;

        removePlantInfoStatusRow();
        combineNameCapacityRows();

        important(row, 'align-items', 'start');
        important(row, 'height', 'auto');
        important(row, 'margin-bottom', '16px');

        [overview, info].forEach(card => {
            important(card, 'height', 'auto');
            important(card, 'min-height', '0');
            important(card, 'max-height', 'none');
            important(card, 'align-self', 'start');
            important(card, 'overflow', 'hidden');
        });

        const scroller = overview.querySelector('.overflow-x-auto');
        important(scroller, 'height', 'auto');
        important(scroller, 'min-height', '0');
        important(scroller, 'overflow-y', 'hidden');

        const table = overview.querySelector('table');
        important(table, 'height', 'auto');
        important(table, 'margin', '0');

        overview.querySelectorAll('th, td').forEach(cell => {
            important(cell, 'height', '34px');
            important(cell, 'padding-top', '7px');
            important(cell, 'padding-bottom', '7px');
            important(cell, 'line-height', '1.1');
            important(cell, 'vertical-align', 'middle');
        });

        info.querySelectorAll('.flex.justify-between').forEach(item => {
            important(item, 'min-height', '29px');
            important(item, 'height', '29px');
            important(item, 'padding-top', '4px');
            important(item, 'padding-bottom', '4px');
        });
    }

    function apply() {
        tightenTopCards();
        updateHeaderStatus();
    }

    function start() {
        apply();
        let count = 0;
        const timer = setInterval(() => {
            apply();
            count += 1;
            if (count > 140) clearInterval(timer);
        }, 150);
        setInterval(apply, 2000);
        const main = document.querySelector('main');
        if (main) new MutationObserver(apply).observe(main, { childList: true, subtree: true, characterData: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
