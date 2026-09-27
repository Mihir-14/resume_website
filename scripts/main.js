(function () {
    'use strict';

    var root = document.documentElement;
    var desktopNav = window.matchMedia('(min-width: 900px)');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* ---------- Theme toggle ---------- */

    var themeToggle = document.getElementById('theme-toggle');
    var systemLight = window.matchMedia('(prefers-color-scheme: light)');

    function currentTheme() {
        return root.dataset.theme || (systemLight.matches ? 'light' : 'dark');
    }

    function syncThemeLabel() {
        var next = currentTheme() === 'dark' ? 'light' : 'dark';
        themeToggle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    }

    themeToggle.addEventListener('click', function () {
        var next = currentTheme() === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
        syncThemeLabel();
    });
    systemLight.addEventListener('change', syncThemeLabel);
    syncThemeLabel();

    /* ---------- Mobile navigation ---------- */

    var nav = document.getElementById('site-nav');
    var navToggle = document.getElementById('nav-toggle');

    function setNavOpen(open) {
        nav.classList.toggle('is-open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.classList.toggle('nav-open', open);
        if (open) nav.querySelector('a').focus();
    }

    function isNavOpen() {
        return navToggle.getAttribute('aria-expanded') === 'true';
    }

    navToggle.addEventListener('click', function () {
        setNavOpen(!isNavOpen());
    });

    nav.addEventListener('click', function (event) {
        if (event.target.closest('a') && isNavOpen()) setNavOpen(false);
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && isNavOpen()) {
            setNavOpen(false);
            navToggle.focus();
        }
    });

    // Close the panel when focus moves outside the header (e.g. tabbing past the last link)
    document.querySelector('.site-header').addEventListener('focusout', function (event) {
        if (isNavOpen() && !event.currentTarget.contains(event.relatedTarget)) setNavOpen(false);
    });

    desktopNav.addEventListener('change', function (event) {
        if (event.matches && isNavOpen()) setNavOpen(false);
    });

    /* ---------- Back to top (logo + footer link) ---------- */

    var brand = document.querySelector('.brand');
    document.addEventListener('click', function (event) {
        if (!event.target.closest('a[href="#top"]')) return;
        event.preventDefault();
        if (isNavOpen()) setNavOpen(false);
        window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
        if (location.hash) history.replaceState(null, '', location.pathname + location.search);
        // Return keyboard focus to the top of the page without interrupting the scroll
        brand.focus({ preventScroll: true });
    });

    /* ---------- Header border once scrolled ---------- */

    var header = document.querySelector('.site-header');
    function onScroll() {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Active navigation link ---------- */

    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav__link'));
    var linkById = {};
    navLinks.forEach(function (link) {
        linkById[link.getAttribute('href').slice(1)] = link;
    });

    function setActive(id) {
        navLinks.forEach(function (link) {
            var active = link === linkById[id];
            link.classList.toggle('is-active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }

    if ('IntersectionObserver' in window) {
        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) setActive(entry.target.id);
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        Object.keys(linkById).forEach(function (id) {
            var section = document.getElementById(id);
            if (section) sectionObserver.observe(section);
        });

        // Above the first section (hero), clear the active state.
        var hero = document.querySelector('.hero');
        new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) setActive(null);
        }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
    }

    /* ---------- Copy email ---------- */

    var copyBtn = document.getElementById('copy-email');
    var copyStatus = document.getElementById('copy-status');
    var copyLabel = copyBtn.querySelector('.copy-label');
    var copyTimer;

    if (navigator.clipboard && window.isSecureContext) {
        copyBtn.hidden = false;
        copyBtn.addEventListener('click', function () {
            clearTimeout(copyTimer);
            navigator.clipboard.writeText(copyBtn.dataset.copy).then(function () {
                copyLabel.textContent = 'Copied';
                copyStatus.classList.remove('is-error');
                copyStatus.textContent = 'Email address copied to clipboard.';
            }, function () {
                copyStatus.classList.add('is-error');
                copyStatus.textContent = 'Couldn’t copy automatically. The address is ' + copyBtn.dataset.copy + '.';
            }).then(function () {
                copyTimer = setTimeout(function () {
                    copyLabel.textContent = 'Copy email';
                    copyStatus.textContent = '';
                }, 4000);
            });
        });
    }

    /* ---------- Scroll reveal ---------- */

    if (!reducedMotion.matches && 'IntersectionObserver' in window) {
        var revealTargets = document.querySelectorAll(
            '.section__header, .about__text, .facts, .timeline__item, .work-card, .skill-card, .edu-card, .contact'
        );
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px' });

        Array.prototype.forEach.call(revealTargets, function (el) {
            // Don't hide anything that's already on screen at load time
            if (el.getBoundingClientRect().top < window.innerHeight) return;
            el.classList.add('reveal');
            revealObserver.observe(el);
        });
    }

    /* ---------- Footer year ---------- */

    document.getElementById('year').textContent = new Date().getFullYear();
})();
