(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    if (menuButton) {
      menuButton.addEventListener('click', function () {
        document.body.classList.toggle('nav-open');
      });
    }

    var carousel = document.querySelector('[data-hero-carousel]');
    if (carousel) {
      var slides = Array.prototype.slice.call(carousel.querySelectorAll('.hero-slide'));
      var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dots] button'));
      var current = 0;

      function showSlide(index) {
        if (!slides.length) {
          return;
        }
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle('active', slideIndex === current);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle('active', dotIndex === current);
        });
      }

      dots.forEach(function (dot, dotIndex) {
        dot.addEventListener('click', function () {
          showSlide(dotIndex);
        });
      });

      window.setInterval(function () {
        showSlide(current + 1);
      }, 5600);
    }

    var searchInputs = Array.prototype.slice.call(document.querySelectorAll('[data-card-search]'));
    searchInputs.forEach(function (input) {
      input.addEventListener('input', function () {
        var value = input.value.trim().toLowerCase();
        var scope = input.closest('main') || document;
        var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-title]'));
        cards.forEach(function (card) {
          var haystack = [
            card.getAttribute('data-title'),
            card.getAttribute('data-year'),
            card.getAttribute('data-region'),
            card.getAttribute('data-genre'),
            card.textContent
          ].join(' ').toLowerCase();
          card.classList.toggle('is-hidden', value && haystack.indexOf(value) === -1);
        });
      });
    });
  });
})();

function initPlayer(streamUrl) {
  var video = document.getElementById('moviePlayer');
  var button = document.querySelector('[data-play-button]');
  if (!video || !streamUrl) {
    return;
  }

  var started = false;

  function attachVideo() {
    if (started) {
      return;
    }
    started = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        maxBufferLength: 30,
        enableWorker: true
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
    } else {
      video.src = streamUrl;
    }
  }

  function playVideo() {
    attachVideo();
    if (button) {
      button.classList.add('hidden');
    }
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {});
    }
  }

  if (button) {
    button.addEventListener('click', playVideo);
  }

  video.addEventListener('click', function () {
    if (video.paused) {
      playVideo();
    }
  });

  video.addEventListener('play', function () {
    if (button) {
      button.classList.add('hidden');
    }
  });
}
