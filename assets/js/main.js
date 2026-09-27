(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");
  var darkSections = Array.prototype.slice.call(document.querySelectorAll(".hero, .section-ink"));

  /* ---------- header background + on-dark state on scroll ---------- */
  function updateHeader() {
    var scrolled = window.scrollY > 40;
    header.classList.toggle("is-scrolled", scrolled);

    var headerRect = header.getBoundingClientRect();
    var probeY = headerRect.bottom + 1;
    var onDark = false;
    for (var i = 0; i < darkSections.length; i++) {
      var rect = darkSections[i].getBoundingClientRect();
      if (rect.top <= probeY && rect.bottom >= probeY) {
        onDark = true;
        break;
      }
    }
    header.classList.toggle("on-dark", onDark);
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  /* ---------- mobile nav toggle ---------- */
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        header.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  revealEls.forEach(function (el) {
    var group = el.closest("section") || el.parentElement;
    var siblings = Array.prototype.slice.call(group.querySelectorAll(".reveal"));
    var explicitDelay = el.getAttribute("data-delay");
    var order = explicitDelay !== null ? parseInt(explicitDelay, 10) : siblings.indexOf(el);
    el.style.setProperty("--d", Math.min(order, 6));
  });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });

    /* Safety net: a large instant jump (End key, direct #hash load, fast
       programmatic scroll) can land past an element without ever painting
       it inside the viewport, so IntersectionObserver never fires for it.
       Force-reveal anything already at or above the fold on scroll/load. */
    var sweep = function () {
      var vh = window.innerHeight;
      revealEls.forEach(function (el) {
        if (el.classList.contains("is-visible")) return;
        if (el.getBoundingClientRect().top < vh) {
          el.classList.add("is-visible");
          io.unobserve(el);
        }
      });
    };
    var sweepQueued = false;
    var queueSweep = function () {
      if (sweepQueued) return;
      sweepQueued = true;
      requestAnimationFrame(function () { sweepQueued = false; sweep(); });
    };
    window.addEventListener("scroll", queueSweep, { passive: true });
    window.addEventListener("hashchange", queueSweep);
    window.addEventListener("load", queueSweep);
    queueSweep();
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- count-up stats ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll(".stat-value[data-count]"));
  var countersDone = false;

  function runCounters() {
    if (countersDone) return;
    countersDone = true;
    counters.forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var duration = 1100;
      var start = null;

      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  var statStrip = document.querySelector(".stat-strip");
  if (statStrip && "IntersectionObserver" in window) {
    var statIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounters();
            statIo.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    statIo.observe(statStrip);
  } else {
    runCounters();
  }
})();
