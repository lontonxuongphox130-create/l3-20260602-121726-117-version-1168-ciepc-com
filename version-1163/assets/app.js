(function () {
  'use strict';

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMenu() {
    var button = qs('.menu-toggle');
    var panel = qs('.mobile-panel');
    if (!button || !panel) {
      return;
    }

    button.addEventListener('click', function () {
      var expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      panel.hidden = expanded;
    });
  }

  function setupSearchForms() {
    qsa('form.site-search').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = qs('input[name="q"]', form);
        var query = input ? input.value.trim() : '';
        var root = form.getAttribute('data-search-root') || '';
        if (query) {
          window.location.href = root + 'search.html?q=' + encodeURIComponent(query);
        } else {
          window.location.href = root + 'search.html';
        }
      });
    });
  }

  function setupHero() {
    var slides = qsa('[data-hero-slide]');
    var dots = qsa('[data-hero-dot]');
    if (!slides.length) {
      return;
    }

    var current = 0;
    var timer;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, idx) {
        slide.classList.toggle('is-active', idx === current);
      });
      dots.forEach(function (dot, idx) {
        dot.classList.toggle('is-active', idx === current);
      });
    }

    function next() {
      show(current + 1);
    }

    function start() {
      stop();
      timer = window.setInterval(next, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    qsa('[data-hero-next]').forEach(function (button) {
      button.addEventListener('click', function () {
        next();
        start();
      });
    });

    qsa('[data-hero-prev]').forEach(function (button) {
      button.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    });

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot') || 0));
        start();
      });
    });

    start();
  }

  function handleMissingImages() {
    qsa('img[data-cover]').forEach(function (img) {
      img.addEventListener('error', function () {
        img.classList.add('is-missing');
      });
    });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = qs('script[src="' + src + '"]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function canPlayNativeHls(video) {
    return video.canPlayType('application/vnd.apple.mpegurl') || video.canPlayType('application/x-mpegURL');
  }

  function startVideo(video, source) {
    if (!video || !source) {
      return Promise.reject(new Error('missing video source'));
    }

    if (window.Hls && window.Hls.isSupported()) {
      if (video.__hlsInstance) {
        video.__hlsInstance.destroy();
      }
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      video.__hlsInstance = hls;
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        video.play().catch(function () {});
      });
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          hls.destroy();
          video.src = source;
        }
      });
      return Promise.resolve();
    }

    if (canPlayNativeHls(video)) {
      video.src = source;
      return video.play().catch(function () {});
    }

    return loadScript('https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js').then(function () {
      if (window.Hls && window.Hls.isSupported()) {
        return startVideo(video, source);
      }
      video.src = source;
      return video.play().catch(function () {});
    });
  }

  function setupPlayers() {
    qsa('[data-play-video]').forEach(function (button) {
      button.addEventListener('click', function () {
        var shell = button.closest('[data-player]');
        var video = shell ? qs('video[data-hls-src]', shell) : null;
        var source = video ? video.getAttribute('data-hls-src') : '';
        if (!shell || !video || !source) {
          return;
        }
        shell.classList.add('is-playing');
        startVideo(video, source).catch(function () {
          shell.classList.remove('is-playing');
        });
      });
    });
  }

  function getQuery() {
    var params = new URLSearchParams(window.location.search);
    return (params.get('q') || '').trim();
  }

  function movieCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return [
      '<article class="movie-card">',
      '  <a class="poster-link" href="' + movie.url + '" aria-label="观看 ' + escapeHtml(movie.title) + '">',
      '    <div class="poster-frame">',
      '      <div class="poster-fallback"><span>' + escapeHtml(movie.title) + '</span></div>',
      '      <img src="' + movie.image + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" data-cover>',
      '      <span class="play-badge" aria-hidden="true">▶</span>',
      '    </div>',
      '    <div class="movie-card-body">',
      '      <h3>' + escapeHtml(movie.title) + '</h3>',
      '      <p>' + escapeHtml(movie.oneLine || movie.summary || '') + '</p>',
      '      <div class="meta-row"><span>' + escapeHtml(movie.type) + '</span><span>' + escapeHtml(movie.year) + '</span></div>',
      '      <div class="tag-row">' + tags + '</div>',
      '    </div>',
      '  </a>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setupLiveSearch() {
    var form = qs('[data-live-search-form]');
    var results = qs('[data-search-results]');
    var count = qs('[data-search-count]');
    var title = qs('[data-search-title]');
    if (!form || !results || !window.MOVIES) {
      return;
    }

    var input = qs('input[name="q"]', form);
    var initialQuery = getQuery();
    if (input) {
      input.value = initialQuery;
    }

    function render(query) {
      var normalized = query.trim().toLowerCase();
      var pool = window.MOVIES || [];
      var matched = normalized
        ? pool.filter(function (movie) {
            return [
              movie.title,
              movie.region,
              movie.type,
              movie.year,
              movie.genre,
              movie.oneLine,
              (movie.tags || []).join(' ')
            ].join(' ').toLowerCase().indexOf(normalized) !== -1;
          })
        : pool.slice(0, 60);

      var sliced = matched.slice(0, 120);
      results.innerHTML = sliced.map(movieCard).join('');
      handleMissingImages();
      if (count) {
        count.textContent = normalized ? '找到 ' + matched.length + ' 部相关影片' : '推荐浏览 60 部影片';
      }
      if (title) {
        title.textContent = normalized ? '“' + query + '”的搜索结果' : '推荐影片';
      }
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      render(input ? input.value : '');
      var query = input ? input.value.trim() : '';
      var url = query ? 'search.html?q=' + encodeURIComponent(query) : 'search.html';
      history.replaceState(null, '', url);
    });

    if (input) {
      input.addEventListener('input', function () {
        render(input.value);
      });
    }

    render(initialQuery);
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupSearchForms();
    setupHero();
    setupPlayers();
    setupLiveSearch();
    handleMissingImages();
  });
})();
