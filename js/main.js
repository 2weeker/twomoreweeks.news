// ── THE DAILY DISPATCH — main.js ──────────────────

// On bfcache restore, suppress hover until the user actually moves the mouse.
// This prevents cards from appearing "stuck" when the cursor is over them on restore.
window.addEventListener('pageshow', () => {
    document.body.classList.add('no-hover');
    if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
    }
    window.addEventListener('mousemove', () => {
        document.body.classList.remove('no-hover');
    }, { once: true });
});

// Pause marquee on tab blur / resume on focus
// (prevents visual drift when tab is hidden)
document.addEventListener('visibilitychange', () => {
    const copies = document.querySelectorAll('.marquee-content');
    copies.forEach((copy) => {
        copy.style.animationPlayState = document.hidden ? 'paused' : 'running';
    });
});

// Staggered fade-in on load
const cards = document.querySelectorAll('.card');
cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform += ' translateY(10px)';
    setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease, box-shadow 0.2s, transform 0.2s';
        card.style.opacity = '1';
        card.style.transform = card.style.transform.replace(' translateY(10px)', '');
    }, 60 + i * 45);
});

// Live clock in masthead date (and mirror into mobile sidebar)
const dateEl = document.querySelector('.masthead-date');
const sidebarDateEl = document.querySelector('.sidebar-date');
if (dateEl) {
    const updateDate = () => {
        const now = new Date();
        const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formatted = now.toLocaleDateString('en-US', opts);
        dateEl.textContent = formatted;
        if (sidebarDateEl) sidebarDateEl.textContent = formatted;
    };
    updateDate();
    setInterval(updateDate, 60000);
}

// Mobile sidebar toggle
const sidebar = document.getElementById('mobile-sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarClose = document.getElementById('sidebar-close');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');

const openSidebar = () => {
    sidebar.classList.add('is-open');
    sidebarBackdrop.classList.add('is-open');
    sidebar.setAttribute('aria-hidden', 'false');
    sidebarToggle.setAttribute('aria-expanded', 'true');
};

const closeSidebar = () => {
    sidebar.classList.remove('is-open');
    sidebarBackdrop.classList.remove('is-open');
    sidebar.setAttribute('aria-hidden', 'true');
    sidebarToggle.setAttribute('aria-expanded', 'false');
};

if (sidebarToggle)   sidebarToggle.addEventListener('click', openSidebar);
if (sidebarClose)    sidebarClose.addEventListener('click', closeSidebar);
if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
});

// Float animation: plays once per session per article on first visit
(function () {
    var dataEl = document.getElementById('reaction-float-data');
    if (!dataEl) return;

    var slug = dataEl.dataset.slug;
    var storageKey = 'float-seen-' + slug;
    if (sessionStorage.getItem(storageKey)) return;

    var raw = dataEl.dataset.reactions;
    var reactions;
    try { reactions = JSON.parse(raw); } catch (e) { return; }
    if (!reactions || reactions.length === 0) return;

    // Build weighted floater list (max 40 total, proportional to count)
    var total = reactions.reduce(function (s, r) { return s + r.count; }, 0);
    var maxFloaters = 40;
    var floaters = [];
    reactions.forEach(function (r) {
        var n = Math.max(1, Math.round((r.count / total) * maxFloaters));
        for (var i = 0; i < n && floaters.length < maxFloaters; i++) {
            floaters.push(r.src);
        }
    });

    // Shuffle
    for (var i = floaters.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = floaters[i]; floaters[i] = floaters[j]; floaters[j] = tmp;
    }

    var overlay = document.createElement('div');
    overlay.className = 'float-overlay';
    document.body.appendChild(overlay);

    floaters.forEach(function (src) {
        var img = document.createElement('img');
        img.src = src;
        img.className = 'float-emoji';
        img.style.left = (5 + Math.random() * 90) + '%';
        var duration = (2.5 + Math.random() * 1.5).toFixed(2);
        var delay = (Math.random() * 1.5).toFixed(2);
        img.style.animationDuration = duration + 's';
        img.style.animationDelay = delay + 's';
        overlay.appendChild(img);
    });

    sessionStorage.setItem(storageKey, '1');
    setTimeout(function () { overlay.remove(); }, 6000);
}());

// Daily "Quote of the Day": one quote per calendar day, based on the visitor's
// LOCAL date, shown in the left sidebar. Falls back to the server-rendered
// pick if JS is disabled or the dataset is missing.
(function () {
    var el = document.getElementById('qotd');
    if (!el) return;
    var raw = el.dataset.json;
    if (!raw) return;
    var quotes;
    try { quotes = JSON.parse(raw); } catch (e) { return; }
    if (!quotes || quotes.length === 0) return;

    var now = new Date();
    var dayIndex = Math.floor((now.getFullYear() * 1000 + now.getMonth() * 50 + now.getDate()));
    var q = quotes[((dayIndex % quotes.length) + quotes.length) % quotes.length];

    var t = el.querySelector('.qotd-text');
    var a = el.querySelector('.qotd-attr');
    var c = el.querySelector('.qotd-cat');
    if (t) t.innerHTML = q.text;
    if (a) a.innerHTML = q.attr;
    if (c) { c.textContent = q.catLabel; c.className = 'qotd-cat qotd-cat--' + q.cat; }
}());

// Copy-link button: copies the article URL to the clipboard with feedback.
(function () {
    var btn = document.querySelector('.copy-link');
    if (!btn) return;

    var label = btn.querySelector('.copy-link-label');
    var defaultText = label ? label.textContent : '';
    var resetTimer;

    function feedback(text) {
        btn.classList.add('is-copied');
        if (label) label.textContent = text;
        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () {
            btn.classList.remove('is-copied');
            if (label) label.textContent = defaultText;
        }, 2000);
    }

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
        document.body.removeChild(ta);
    }

    btn.addEventListener('click', function () {
        var url = btn.dataset.url || window.location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(
                function () { feedback('Copied!'); },
                function () { fallbackCopy(url); feedback('Copied!'); }
            );
        } else {
            fallbackCopy(url);
            feedback('Copied!');
        }
    });
}());
