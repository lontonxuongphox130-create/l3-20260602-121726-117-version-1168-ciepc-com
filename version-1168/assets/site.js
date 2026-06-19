(function () {
  function initNavigation() {
    var button = document.querySelector('[data-nav-toggle]');
    var panel = document.querySelector('[data-nav-panel]');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function initHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    if (!slides.length) {
      return;
    }

    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        stop();
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    show(0);
    start();
  }

  function getQueryValue(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
  }

  function initFilters() {
    var scope = document.querySelector('[data-filter-scope]');
    if (!scope) {
      return;
    }

    var search = scope.querySelector('[data-local-search]');
    var region = scope.querySelector('[data-local-region]');
    var category = scope.querySelector('[data-local-category]');
    var cards = Array.prototype.slice.call(scope.querySelectorAll('.movie-card'));
    var count = scope.querySelector('[data-result-count]');

    if (search && getQueryValue('q')) {
      search.value = getQueryValue('q');
    }

    function applyFilter() {
      var q = search ? search.value.trim().toLowerCase() : '';
      var r = region ? region.value.trim() : '';
      var c = category ? category.value.trim() : '';
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute('data-title') || '',
          card.getAttribute('data-region') || '',
          card.getAttribute('data-year') || '',
          card.getAttribute('data-genre') || '',
          card.getAttribute('data-category') || '',
          card.textContent || ''
        ].join(' ').toLowerCase();

        var matched = true;
        if (q && haystack.indexOf(q) === -1) {
          matched = false;
        }
        if (r && (card.getAttribute('data-region') || '').indexOf(r) === -1) {
          matched = false;
        }
        if (c && (card.getAttribute('data-category') || '') !== c) {
          matched = false;
        }

        card.classList.toggle('is-filter-hidden', !matched);
        if (matched) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = '共 ' + visible + ' 部影片';
      }
    }

    [search, region, category].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });

    applyFilter();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initHero();
    initFilters();
  });
})();
