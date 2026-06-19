(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  var navToggle = qs('[data-nav-toggle]');
  var navMenu = qs('[data-nav-menu]');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      navMenu.classList.toggle('open');
    });
  }

  var slides = qsa('[data-hero-slide]');
  var dots = qsa('[data-hero-dot]');
  var prev = qs('[data-hero-prev]');
  var next = qs('[data-hero-next]');
  var heroIndex = 0;
  var heroTimer = null;

  function showHero(index) {
    if (!slides.length) {
      return;
    }
    heroIndex = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle('active', i === heroIndex);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === heroIndex);
    });
  }

  function restartHero() {
    if (heroTimer) {
      window.clearInterval(heroTimer);
    }
    if (slides.length > 1) {
      heroTimer = window.setInterval(function () {
        showHero(heroIndex + 1);
      }, 5200);
    }
  }

  if (slides.length) {
    if (prev) {
      prev.addEventListener('click', function () {
        showHero(heroIndex - 1);
        restartHero();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        showHero(heroIndex + 1);
        restartHero();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showHero(Number(dot.getAttribute('data-hero-dot')) || 0);
        restartHero();
      });
    });
    restartHero();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function setupLocalFilter() {
    var input = qs('[data-local-search]');
    var yearFilter = qs('[data-card-filter="year"]');
    var list = qs('[data-card-list]');

    if (!input || !list) {
      return;
    }

    var cards = qsa('.movie-card', list);

    function apply() {
      var keyword = normalize(input.value);
      var year = yearFilter ? yearFilter.value : '';
      cards.forEach(function (card) {
        var text = normalize(card.getAttribute('data-title') + ' ' + card.getAttribute('data-region') + ' ' + card.getAttribute('data-type'));
        var cardYear = card.getAttribute('data-year') || '';
        var matchedKeyword = !keyword || text.indexOf(keyword) !== -1;
        var matchedYear = !year || cardYear.indexOf(year) !== -1;
        card.classList.toggle('hidden-card', !(matchedKeyword && matchedYear));
      });
    }

    input.addEventListener('input', apply);
    if (yearFilter) {
      yearFilter.addEventListener('change', apply);
    }
  }

  setupLocalFilter();

  function cardTemplate(item) {
    return [
      '<article class="movie-card">',
      '<a class="poster" href="' + item.url + '">',
      '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
      '<span class="poster-badge">' + escapeHtml(item.year) + '</span>',
      '</a>',
      '<div class="card-body">',
      '<a class="card-title" href="' + item.url + '">' + escapeHtml(item.title) + '</a>',
      '<p>' + escapeHtml(item.desc) + '</p>',
      '<div class="meta-row"><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.type) + '</span><span>' + escapeHtml(item.genre) + '</span></div>',
      '</div>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setupSearchPage() {
    var results = qs('#search-results');
    var keyword = qs('#site-search');
    var typeFilter = qs('#type-filter');
    var yearFilter = qs('#year-filter');

    if (!results || !keyword || !window.SEARCH_DATA) {
      return;
    }

    function render() {
      var q = normalize(keyword.value);
      var type = typeFilter ? typeFilter.value : '';
      var year = yearFilter ? yearFilter.value : '';
      var list = window.SEARCH_DATA.filter(function (item) {
        var bag = normalize([item.title, item.year, item.type, item.region, item.genre, (item.tags || []).join(' ')].join(' '));
        var matchedKeyword = !q || bag.indexOf(q) !== -1;
        var matchedType = !type || item.type === type;
        var matchedYear = !year || item.year === year;
        return matchedKeyword && matchedType && matchedYear;
      }).slice(0, 120);

      results.innerHTML = list.map(cardTemplate).join('');
    }

    keyword.addEventListener('input', render);
    if (typeFilter) {
      typeFilter.addEventListener('change', render);
    }
    if (yearFilter) {
      yearFilter.addEventListener('change', render);
    }
    render();
  }

  setupSearchPage();

  function setupPlayer() {
    var shell = qs('[data-player]');
    var video = qs('#main-video');
    var trigger = qs('[data-play-trigger]');

    if (!shell || !video) {
      return;
    }

    var src = video.getAttribute('data-src');
    var attached = false;

    function attachSource() {
      if (attached || !src) {
        return;
      }
      attached = true;
      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else {
        video.src = src;
      }
    }

    function playVideo() {
      attachSource();
      var promise = video.play();
      shell.classList.add('playing');
      if (promise && promise.catch) {
        promise.catch(function () {
          shell.classList.remove('playing');
        });
      }
    }

    if (trigger) {
      trigger.addEventListener('click', playVideo);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        playVideo();
      }
    });

    video.addEventListener('play', function () {
      shell.classList.add('playing');
    });

    video.addEventListener('pause', function () {
      shell.classList.remove('playing');
    });
  }

  setupPlayer();
})();
