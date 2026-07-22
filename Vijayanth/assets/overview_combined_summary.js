(function () {
    if (!/overview\.php$/i.test(window.location.pathname)) return;

    function q(id) { return document.getElementById(id); }
    function setImportant(el, prop, value) { if (el) el.style.setProperty(prop, value, 'important'); }

    function plantId() {
        return window.SIGNED_PLANT_ID || window.currentPlant || new URLSearchParams(window.location.search).get('plant') || '';
    }

    function plantConfig() {
        const pid = plantId();
        return (window.SIGNED_PLANT_CONFIG && window.SIGNED_PLANT_CONFIG[pid]) || (window.plantConfig && window.plantConfig[pid]) || {};
    }

    function ensureStyle() {
        let style = q('overviewCombinedSummaryStyle');
        if (!style) {
            style = document.createElement('style');
            style.id = 'overviewCombinedSummaryStyle';
            document.head.appendChild(style);
        }

        style.textContent = `
            #overviewCombinedSummaryCard {
                display: block !important;
                width: 100% !important;
                max-width: none !important;
                min-width: 0 !important;
                align-self: stretch !important;
                margin: 0 0 18px 0 !important;
                background: #ffffff !important;
                border: 1px solid #dbe3ec !important;
                border-radius: 14px !important;
                box-shadow: 0 4px 14px rgba(15, 23, 42, .06) !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
            }
            #overviewCombinedSummaryCard .combined-summary-title {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                gap: 12px !important;
                padding: 12px 16px !important;
                color: #111827 !important;
                font-size: 15px !important;
                font-weight: 900 !important;
                border-bottom: 1px solid #e5edf5 !important;
                background: #ffffff !important;
            }
            #overviewCombinedSummaryCard .combined-summary-scroll {
                width: 100% !important;
                overflow-x: hidden !important;
            }
            #overviewCombinedSummaryCard table {
                width: 100% !important;
                min-width: 0 !important;
                max-width: none !important;
                table-layout: fixed !important;
                border-collapse: separate !important;
                border-spacing: 0 !important;
                font-size: 11px !important;
                text-align: center !important;
            }
            #overviewCombinedSummaryCard th {
                height: 36px !important;
                padding: 7px 5px !important;
                background: var(--plant-header-bg, #93c5fd) !important;
                color: #111827 !important;
                border-right: 1px solid rgba(255, 255, 255, .65) !important;
                font-size: 11px !important;
                font-weight: 900 !important;
                line-height: 1.15 !important;
                white-space: normal !important;
                word-break: normal !important;
            }
            #overviewCombinedSummaryCard th:last-child { border-right: 0 !important; }
            #overviewCombinedSummaryCard td {
                height: 46px !important;
                padding: 7px 6px !important;
                border-right: 1px solid #e5edf5 !important;
                border-top: 1px solid #e5edf5 !important;
                color: #111827 !important;
                font-size: 11px !important;
                font-weight: 800 !important;
                line-height: 1.22 !important;
                vertical-align: middle !important;
                background: #ffffff !important;
                overflow-wrap: anywhere !important;
            }
            #overviewCombinedSummaryCard td:last-child { border-right: 0 !important; }
            #overviewCombinedSummaryCard .plant-name-cell {
                text-align: left !important;
                font-weight: 900 !important;
                white-space: normal !important;
            }
            #overviewCombinedSummaryCard #vcb_time,
            #overviewCombinedSummaryCard #vcb_power,
            #overviewCombinedSummaryCard #vcb_freq,
            #overviewCombinedSummaryCard #vcb_pf,
            #overviewCombinedSummaryCard #vcb_today,
            #overviewCombinedSummaryCard #vcb_total {
                font-size: 11px !important;
                font-weight: 900 !important;
                text-align: center !important;
                vertical-align: middle !important;
                height: 46px !important;
                padding: 7px 6px !important;
                background: #ffffff !important;
            }
            #overviewHeaderStatusBadge {
                display: inline-flex !important;
                align-items: center !important;
                height: 22px !important;
                padding: 0 10px !important;
                border-radius: 999px !important;
                border: 1px solid #d1d5db !important;
                font-size: 10px !important;
                font-weight: 900 !important;
                background: #f8fafc !important;
                color: #64748b !important;
            }
            #overviewHeaderStatusBadge.is-live {
                background: #ecfdf5 !important;
                color: #047857 !important;
                border-color: #a7f3d0 !important;
            }
            #overviewHeaderStatusBadge.is-offline {
                background: #fef2f2 !important;
                color: #b91c1c !important;
                border-color: #fecaca !important;
            }
            #legacyOverviewCard,
            #legacyPlantInfoCard,
            #forcedOverviewInfoRow,
            .overview-table-info-row {
                display: none !important;
            }
            @media (max-width: 1100px) {
                #overviewCombinedSummaryCard .combined-summary-scroll { overflow-x: auto !important; }
                #overviewCombinedSummaryCard table { min-width: 1040px !important; }
            }
            @media (max-width: 640px) {
                #overviewCombinedSummaryCard .combined-summary-title { padding: 10px 12px !important; }
                #overviewCombinedSummaryCard table { min-width: 980px !important; }
            }
        `;
    }

    function findContent() {
        return document.querySelector('main > div.p-4') || document.querySelector('main > div.sm\\:p-6') || document.querySelector('main > div');
    }

    function findLegacyOverview() {
        const existing = q('legacyOverviewCard');
        if (existing) return existing;
        const marker = q('vcb_time') || q('vcb_power') || q('vcb_total');
        const card = marker?.closest('.bg-white');
        if (card && card.id !== 'overviewCombinedSummaryCard') {
            card.id = 'legacyOverviewCard';
            return card;
        }
        return null;
    }

    function findLegacyPlantInfo() {
        const existing = q('legacyPlantInfoCard');
        if (existing) return existing;
        const heading = Array.from(document.querySelectorAll('h3')).find(h => (h.textContent || '').trim().toLowerCase() === 'plant information');
        const card = heading?.closest('.bg-white');
        if (card) {
            card.id = 'legacyPlantInfoCard';
            return card;
        }
        return null;
    }

    function ensureHeaderStatus() {
        const headerName = q('headerPlantName');
        if (!headerName) return;
        let wrap = headerName.closest('.overview-header-status-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'overview-header-status-wrap';
            headerName.parentNode.insertBefore(wrap, headerName);
            wrap.appendChild(headerName);
            setImportant(wrap, 'display', 'inline-flex');
            setImportant(wrap, 'align-items', 'center');
            setImportant(wrap, 'gap', '10px');
        }
        let badge = q('overviewHeaderStatusBadge');
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'overviewHeaderStatusBadge';
            wrap.appendChild(badge);
        }
        const text = (q('vcb_time')?.textContent || '').trim();
        const power = parseFloat((q('vcb_power')?.textContent || '').replace(/,/g, '')) || 0;
        const isLive = power > 0 || (text && text !== '--:--:--' && !/^[-: ]+$/.test(text));
        badge.textContent = isLive ? 'Live' : 'Offline';
        badge.classList.toggle('is-live', isLive);
        badge.classList.toggle('is-offline', !isLive);
    }

    function cell(content, className = '') {
        const td = document.createElement('td');
        if (className) td.className = className;
        if (content instanceof Node) td.appendChild(content);
        else td.innerHTML = content;
        return td;
    }

    function liveCell(id, fallback = '--') {
        let el = q(id);
        if (!el) {
            el = document.createElement('td');
            el.id = id;
            el.textContent = fallback;
        }
        return el;
    }

    function ensureCombinedSummary() {
        ensureStyle();
        const content = findContent();
        if (!content) return;
        setImportant(content, 'width', '100%');
        setImportant(content, 'align-items', 'stretch');

        const cfg = plantConfig();
        const name = cfg.name || q('headerPlantName')?.textContent || 'Plant';
        const capacity = cfg.capacity ? `${cfg.capacity} MW` : '--';
        const service = cfg.service_number || '--';
        const location = cfg.location || '--';

        const legacyOverview = findLegacyOverview();
        const legacyInfo = findLegacyPlantInfo();
        if (legacyInfo) legacyInfo.remove();

        let card = q('overviewCombinedSummaryCard');
        if (!card) {
            card = document.createElement('section');
            card.id = 'overviewCombinedSummaryCard';
            card.innerHTML = `<div class="combined-summary-title"><span>Plant Overview & Information</span></div><div class="combined-summary-scroll"><table><thead><tr></tr></thead><tbody><tr></tr></tbody></table></div>`;
            content.insertBefore(card, content.firstElementChild || null);
        } else if (card.parentElement !== content) {
            content.insertBefore(card, content.firstElementChild || null);
        }

        const headRow = card.querySelector('thead tr');
        const bodyRow = card.querySelector('tbody tr');
        const headers = ['Plant Name', 'Capacity', 'Service Number', 'Location', 'Last Updated Time', 'Active Power', 'Frequency', 'PF', 'Day Energy', 'Life Time Energy'];
        if (headRow.children.length !== headers.length) {
            headRow.innerHTML = headers.map(h => `<th>${h}</th>`).join('');
        }

        const liveCells = {
            time: liveCell('vcb_time', '--:--:--'),
            power: liveCell('vcb_power'),
            freq: liveCell('vcb_freq'),
            pf: liveCell('vcb_pf'),
            today: liveCell('vcb_today'),
            total: liveCell('vcb_total')
        };

        bodyRow.textContent = '';
        bodyRow.appendChild(cell(name, 'plant-name-cell'));
        bodyRow.appendChild(cell(capacity));
        bodyRow.appendChild(cell(service));
        bodyRow.appendChild(cell(location));
        bodyRow.appendChild(liveCells.time);
        bodyRow.appendChild(liveCells.power);
        bodyRow.appendChild(liveCells.freq);
        bodyRow.appendChild(liveCells.pf);
        bodyRow.appendChild(liveCells.today);
        bodyRow.appendChild(liveCells.total);

        if (legacyOverview) setImportant(legacyOverview, 'display', 'none');
        const forcedRow = q('forcedOverviewInfoRow');
        if (forcedRow) setImportant(forcedRow, 'display', 'none');
        ensureHeaderStatus();
    }

    function start() {
        ensureCombinedSummary();
        let count = 0;
        const timer = setInterval(() => {
            ensureCombinedSummary();
            count += 1;
            if (count > 120) clearInterval(timer);
        }, 200);
        setInterval(ensureCombinedSummary, 2000);
        const main = document.querySelector('main');
        if (main) new MutationObserver(ensureCombinedSummary).observe(main, { childList: true, subtree: true, characterData: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
