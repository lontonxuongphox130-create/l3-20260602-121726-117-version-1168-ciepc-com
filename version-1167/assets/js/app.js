(function () {
  var mobileButton = document.querySelector('[data-mobile-menu-button]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (mobileButton && mobileNav) {
    mobileButton.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  var slider = document.querySelector('[data-hero-slider]');

  if (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
    var index = 0;

    var showSlide = function (nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    };

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        showSlide(dotIndex);
      });
    });

    window.setInterval(function () {
      showSlide(index + 1);
    }, 5200);
  }

  var normalise = function (value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '');
  };

  var searchInputs = Array.prototype.slice.call(document.querySelectorAll('[data-search-input]'));
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter-button]'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-filter-grid] .movie-card'));

  var applyFilters = function () {
    var term = normalise(searchInputs.length ? searchInputs[0].value : '');
    var activeButton = document.querySelector('[data-filter-button].is-active');
    var active = normalise(activeButton ? activeButton.getAttribute('data-filter-button') : 'all');

    cards.forEach(function (card) {
      var haystack = normalise(card.getAttribute('data-search-text'));
      var matchedTerm = !term || haystack.indexOf(term) !== -1;
      var matchedFilter = active === 'all' || haystack.indexOf(active) !== -1;
      card.classList.toggle('hidden-by-filter', !(matchedTerm && matchedFilter));
    });
  };

  if (searchInputs.length && cards.length) {
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q');

    if (query) {
      searchInputs.forEach(function (input) {
        input.value = query;
      });
    }

    searchInputs.forEach(function (input) {
      input.addEventListener('input', applyFilters);
    });

    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        filterButtons.forEach(function (item) {
          item.classList.remove('is-active');
        });

        button.classList.add('is-active');
        applyFilters();
      });
    });

    applyFilters();
  }

  var setupPlayer = function (player) {
    var source = player.getAttribute('data-src');
    var video = player.querySelector('video');
    var cover = player.querySelector('[data-player-cover]');
    var started = false;
    var hls = null;

    if (!source || !video || !cover) {
      return;
    }

    var start = function () {
      if (started) {
        video.play().catch(function () {});
        return;
      }

      started = true;
      cover.classList.add('is-hidden');
      video.setAttribute('controls', 'controls');

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.play().catch(function () {});
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        hls.attachMedia(video);
        hls.on(window.Hls.Events.MEDIA_ATTACHED, function () {
          hls.loadSource(source);
        });
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {});
        });
        return;
      }

      video.src = source;
      video.play().catch(function () {});
    };

    cover.addEventListener('click', start);
    video.addEventListener('click', function () {
      if (!started) {
        start();
      }
    });
  };

  Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(setupPlayer);
})();
