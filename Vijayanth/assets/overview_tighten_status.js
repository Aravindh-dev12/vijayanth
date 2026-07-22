(function () {
    if (!/overview\.php$/i.test(window.location.pathname)) return;

    function important(el, prop, value) {
        if (el) el.style.setProperty(prop, value, 'important');
    }

    function numberFromText(text) {
        const n = parseFloat(String(text || '').replace(/,/g, '').replace(/[^0-9.\-]/g, ''));
        return Number.isFinite(n) ? n : 0;
    }

    function removePlantInfoStatusRow() {
        const badge = document.getElementById('plantStatusBadge');
        const row = badge?.closest('.flex.justify-between') || badge?.parentElement;
        if (row) row.remove();
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
            important(item, 'min-height', '27px');
            important(item, 'height', '27px');
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
