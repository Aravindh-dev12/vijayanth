(function () {
    if (!/availability\.php$/i.test(window.location.pathname)) return;

    function removeExtraAvailabilityCharts() {
        const gridCanvas = document.getElementById('gridAvailChart');
        const plantCanvas = document.getElementById('plantAvailChart');
        const wrappers = [gridCanvas, plantCanvas]
            .map(el => el ? el.closest('.bg-white.rounded-lg.shadow-sm.border.border-slate-200.p-4.flex.flex-col.h-\[300px\]') : null)
            .filter(Boolean);

        const uniqueWrappers = Array.from(new Set(wrappers));
        if (!uniqueWrappers.length) return;

        const parentGrid = uniqueWrappers[0].parentElement;
        uniqueWrappers.forEach(node => node.remove());

        if (parentGrid && !parentGrid.children.length) {
            parentGrid.remove();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(removeExtraAvailabilityCharts, 100), { once: true });
    } else {
        setTimeout(removeExtraAvailabilityCharts, 100);
    }

    window.addEventListener('load', () => setTimeout(removeExtraAvailabilityCharts, 150), { once: true });
})();