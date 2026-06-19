(function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    function showSlide(index) {
      current = index;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide((current + 1) % slides.length);
      }, 5200);
    }
  }

  function normalize(text) {
    return String(text || '').toLowerCase().trim();
  }

  function applyFilter(root, query, year) {
    var cards = Array.prototype.slice.call(root.querySelectorAll('.movie-card'));
    var empty = root.querySelector('[data-empty-message]');
    var visibleCount = 0;
    var normalizedQuery = normalize(query);

    cards.forEach(function (card) {
      var text = normalize(card.getAttribute('data-search'));
      var cardYear = card.getAttribute('data-year');
      var matchedQuery = !normalizedQuery || text.indexOf(normalizedQuery) !== -1;
      var matchedYear = !year || year === 'all' || cardYear === year;
      var matched = matchedQuery && matchedYear;
      card.style.display = matched ? '' : 'none';
      if (matched) {
        visibleCount += 1;
      }
    });

    if (empty) {
      empty.classList.toggle('is-visible', visibleCount === 0);
    }
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-filter-page]')).forEach(function (root) {
    var input = root.querySelector('[data-filter-input]');
    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-filter-year]'));
    var activeYear = 'all';

    if (input) {
      input.addEventListener('input', function () {
        applyFilter(root, input.value, activeYear);
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        buttons.forEach(function (item) {
          item.classList.remove('active');
        });
        button.classList.add('active');
        activeYear = button.getAttribute('data-filter-year') || 'all';
        applyFilter(root, input ? input.value : '', activeYear);
      });
    });
  });

  var searchPage = document.querySelector('[data-search-page]');

  if (searchPage) {
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    var searchInput = searchPage.querySelector('[data-search-input]');

    if (searchInput) {
      searchInput.value = query;
      searchInput.addEventListener('input', function () {
        applyFilter(searchPage, searchInput.value, 'all');
      });
    }

    applyFilter(searchPage, query, 'all');
  }
})();

window.initPlayer = function (sourceUrl) {
  var video = document.getElementById('movieVideo');
  var overlay = document.getElementById('playerOverlay');
  var playButton = document.getElementById('playToggle');
  var muteButton = document.getElementById('muteToggle');
  var fullButton = document.getElementById('fullToggle');
  var hls = null;
  var loaded = false;

  if (!video || !sourceUrl) {
    return;
  }

  function loadSource() {
    if (loaded) {
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);
      loaded = true;
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = sourceUrl;
      loaded = true;
      return;
    }

    if (playButton) {
      playButton.textContent = '重试';
    }
  }

  function startPlayback() {
    loadSource();
    var playPromise = video.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        if (playButton) {
          playButton.textContent = '播放';
        }
      });
    }
  }

  function togglePlay() {
    if (video.paused) {
      startPlayback();
    } else {
      video.pause();
    }
  }

  if (overlay) {
    overlay.addEventListener('click', togglePlay);
  }

  if (playButton) {
    playButton.addEventListener('click', togglePlay);
  }

  video.addEventListener('click', togglePlay);

  video.addEventListener('play', function () {
    if (overlay) {
      overlay.classList.add('is-hidden');
    }
    if (playButton) {
      playButton.textContent = '暂停';
    }
  });

  video.addEventListener('pause', function () {
    if (overlay) {
      overlay.classList.remove('is-hidden');
    }
    if (playButton) {
      playButton.textContent = '播放';
    }
  });

  if (muteButton) {
    muteButton.addEventListener('click', function () {
      video.muted = !video.muted;
      muteButton.textContent = video.muted ? '取消静音' : '静音';
    });
  }

  if (fullButton) {
    fullButton.addEventListener('click', function () {
      var target = video.parentElement || video;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (target.requestFullscreen) {
        target.requestFullscreen();
      }
    });
  }
};
