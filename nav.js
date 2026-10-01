/* Scroll control: project pages, back and home always open at the top;
   "Om meg" / "Portefølje" open at the start of their section. */
(function () {
  var KEY = 'afs-scroll-target';
  var onIndex = !!document.getElementById('portefolje');

  // Inside the MacBook Air frame on the start page.
  var inMockup = false;
  try { inMockup = !!(window.frameElement && window.frameElement.hasAttribute('data-mockup')); } catch (e) {}
  if (inMockup) document.documentElement.classList.add('in-mockup');

  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}

  function readTarget() {
    var t = null;
    try { t = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); } catch (e) {}
    var h = (location.hash || '').slice(1);
    return h || t;
  }
  function saveTarget(id) {
    try { id ? sessionStorage.setItem(KEY, id) : sessionStorage.removeItem(KEY); } catch (e) {}
  }
  // Jump without animation. Works in every browser (some reject behavior:'instant').
  function jump(y) {
    var h = document.documentElement, prev = h.style.scrollBehavior;
    h.style.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    h.scrollTop = y; if (document.body) document.body.scrollTop = y;
    h.style.scrollBehavior = prev;
  }
  function yOf(id) {
    var el = id ? document.getElementById(id) : null;
    return el ? el.getBoundingClientRect().top + window.pageYOffset : 0;
  }
  function scrollToId(id, smooth) {
    var y = yOf(id);
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (smooth && !reduce) {
      try { window.scrollTo({ top: y, left: 0, behavior: 'smooth' }); return; } catch (e) {}
    }
    jump(y);
  }

  var stored = readTarget();
  var target = onIndex ? stored : null;

  // Land at the top (or the chosen section) and hold that position while the page
  // finishes loading, until the visitor scrolls themselves.
  var userMoved = false;
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (t) {
    window.addEventListener(t, function () { userMoved = true; }, { passive: true, once: true });
  });
  function land() { if (!userMoved) jump(yOf(target)); }
  land();
  document.addEventListener('DOMContentLoaded', land);
  window.addEventListener('load', function () { land(); setTimeout(land, 60); setTimeout(land, 300); });
  window.addEventListener('pageshow', function () { userMoved = false; land(); });

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var href = a.getAttribute('href');
    if (/^https?:/.test(href) && inMockup) {
      // Links from inside the MacBook frame are blocked by the viewer's sandbox,
      // so hand them to the start page, where the viewer opens them in a new tab.
      try {
        var pd = window.parent.document, ext = pd.createElement('a');
        ext.href = href; ext.target = '_blank'; ext.rel = 'noopener';
        pd.body.appendChild(ext); ext.click(); ext.remove();
        e.preventDefault();
      } catch (err) {}
      return;
    }
    if (/^(https?:|mailto:|tel:)/.test(href) || href === '#') return;
    var m = href.match(/^(?:hjem\.html)?#([A-Za-z0-9_-]+)$/);
    if (m) {
      if (onIndex) { e.preventDefault(); scrollToId(m[1], true); }
      else saveTarget(m[1]);
      return;
    }
    if (onIndex && href === 'hjem.html') { e.preventDefault(); scrollToId(null, true); return; }
    saveTarget(null);
  });
})();
