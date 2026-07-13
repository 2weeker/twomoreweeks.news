// Search results page: reads ?q, fuzzy-matches index.json with Fuse.js, and
// renders matching articles as masonry cards with the query term highlighted.
(function () {
    var grid = document.querySelector('[data-search-page]');
    if (!grid || typeof Fuse === 'undefined') return;

    var summary = document.getElementById('search-summary');
    var q = (new URLSearchParams(window.location.search).get('q') || '').trim();

    // Mirror the query into any visible search inputs.
    var inputs = document.querySelectorAll('.masthead-search-input, .search-page-input');
    inputs.forEach(function (i) { i.value = q; });

    if (!q) {
        summary.textContent = 'Type a query above to search articles.';
        return;
    }

    var terms = q.split(/\s+/).filter(function (t) { return t.length >= 2; });
    summary.textContent = 'Searching…';

    fetch(indexURL())
        .then(function (r) { return r.json(); })
        .then(function (data) {
            var fuse = new Fuse(data, {
                keys: [
                    { name: 'title', weight: 0.6 },
                    { name: 'tags', weight: 0.3 },
                    { name: 'excerpt', weight: 0.2 }
                ],
                threshold: 0.4,
                ignoreLocation: true,
                minMatchCharLength: 2
            });
            render(fuse.search(q).map(function (m) { return m.item; }));
        })
        .catch(function () { summary.textContent = 'Could not load the search index.'; });

    // Resolve /index.json relative to the site root (respects baseURL subpaths).
    function indexURL() {
        var base = document.querySelector('base');
        var root = base ? base.getAttribute('href') : '/';
        return root.replace(/\/?$/, '/') + 'index.json';
    }

    // --- Rendering --------------------------------------------------------
    function render(results) {
        grid.querySelectorAll('.card, .search-empty-page').forEach(function (el) { el.remove(); });

        var n = results.length;
        summary.innerHTML = '';
        summary.appendChild(document.createTextNode('Results for '));
        var strong = document.createElement('strong');
        strong.textContent = '“' + q + '”';
        summary.appendChild(strong);
        summary.appendChild(document.createTextNode(' — ' + n + ' ' + (n === 1 ? 'result' : 'results')));

        if (!n) {
            var empty = document.createElement('div');
            empty.className = 'search-empty-page';
            empty.textContent = 'No stories match “' + q + '”.';
            grid.appendChild(empty);
            return;
        }
        results.forEach(function (item) { grid.appendChild(card(item)); });
    }

    function card(item) {
        var art = document.createElement('article');
        var cls = 'card card--' + (item.color || 'default');
        if (item.image) cls += ' card--image';
        art.className = cls;

        if (item.image) {
            var img = document.createElement('img');
            img.className = 'card-img';
            img.src = item.image;
            img.alt = item.title;
            img.loading = 'lazy';
            art.appendChild(img);
        }

        var top = document.createElement('div');
        top.className = 'card-top';
        var tag = document.createElement('div');
        tag.className = 'card-tag';
        tag.textContent = item.section;
        top.appendChild(tag);
        art.appendChild(top);

        var h = document.createElement('h2');
        h.className = 'card-headline';
        var a = document.createElement('a');
        a.href = item.url;
        a.innerHTML = highlight(item.title);
        h.appendChild(a);
        art.appendChild(h);

        if (item.excerpt) {
            var p = document.createElement('p');
            p.className = 'card-body';
            p.innerHTML = highlight(item.excerpt);
            art.appendChild(p);
        }

        var meta = document.createElement('div');
        meta.className = 'card-meta';
        if (item.author) {
            var au = document.createElement('span');
            au.className = 'author';
            au.textContent = 'By ' + item.author;
            meta.appendChild(au);
            var sep = document.createElement('span');
            sep.className = 'divider';
            sep.textContent = '·';
            meta.appendChild(sep);
        }
        var date = document.createElement('span');
        date.className = 'card-date';
        date.textContent = item.date;
        meta.appendChild(date);
        art.appendChild(meta);

        return art;
    }

    // --- Highlight helpers ------------------------------------------------
    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function escapeRegex(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Escape the source text, then wrap query-term matches in <mark>.
    function highlight(text) {
        var esc = escapeHtml(text);
        if (!terms.length) return esc;
        var re = new RegExp('(' + terms.map(escapeRegex).join('|') + ')', 'gi');
        return esc.replace(re, '<mark>$1</mark>');
    }
}());
