(function () {
  var navToggle = document.querySelector('[data-nav-toggle]');
  var mainNav = document.querySelector('[data-main-nav]');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      mainNav.classList.toggle('is-open');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
  var activeIndex = 0;

  function activateSlide(index) {
    if (!slides.length) {
      return;
    }

    activeIndex = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('is-active', slideIndex === activeIndex);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === activeIndex);
    });
  }

  dots.forEach(function (dot, dotIndex) {
    dot.addEventListener('click', function () {
      activateSlide(dotIndex);
    });
  });

  if (slides.length > 1) {
    activateSlide(0);
    setInterval(function () {
      activateSlide(activeIndex + 1);
    }, 5200);
  }

  var categoryFilter = document.querySelector('[data-category-filter]');
  if (categoryFilter) {
    setupCategoryFilter(categoryFilter);
  }

  var searchPage = document.querySelector('[data-search-page]');
  if (searchPage) {
    setupSearchPage(searchPage);
  }

  var videoShells = Array.prototype.slice.call(document.querySelectorAll('[data-video-shell]'));
  videoShells.forEach(setupVideoPlayer);

  function setupCategoryFilter(panel) {
    var input = panel.querySelector('[data-filter-title]');
    var year = panel.querySelector('[data-filter-year]');
    var type = panel.querySelector('[data-filter-type]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card'));
    var count = document.querySelector('[data-result-count]');

    function apply() {
      var q = (input && input.value || '').trim().toLowerCase();
      var selectedYear = year && year.value || '';
      var selectedType = type && type.value || '';
      var visible = 0;

      cards.forEach(function (card) {
        var title = (card.getAttribute('data-title') || '').toLowerCase();
        var cardYear = card.getAttribute('data-year') || '';
        var cardType = card.getAttribute('data-type') || '';
        var ok = true;

        if (q && title.indexOf(q) === -1) {
          ok = false;
        }
        if (selectedYear && cardYear !== selectedYear) {
          ok = false;
        }
        if (selectedType && cardType !== selectedType) {
          ok = false;
        }

        card.style.display = ok ? '' : 'none';
        if (ok) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = '当前显示 ' + visible + ' 部影片';
      }
    }

    [input, year, type].forEach(function (el) {
      if (el) {
        el.addEventListener('input', apply);
        el.addEventListener('change', apply);
      }
    });

    apply();
  }

  function setupSearchPage(page) {
    var input = page.querySelector('[data-search-input]');
    var region = page.querySelector('[data-search-region]');
    var type = page.querySelector('[data-search-type]');
    var year = page.querySelector('[data-search-year]');
    var output = page.querySelector('[data-search-results]');
    var count = page.querySelector('[data-search-count]');
    var movies = [];

    fetch('data/movies.json')
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        movies = data;
        fillYearOptions(year, movies);
        render();
      })
      .catch(function () {
        if (output) {
          output.innerHTML = '<p class="result-count">搜索数据暂时无法读取，请从分类页或热播榜继续浏览。</p>';
        }
      });

    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q');
    if (initialQuery && input) {
      input.value = initialQuery;
    }

    [input, region, type, year].forEach(function (el) {
      if (el) {
        el.addEventListener('input', render);
        el.addEventListener('change', render);
      }
    });

    function render() {
      if (!output) {
        return;
      }

      var q = (input && input.value || '').trim().toLowerCase();
      var selectedRegion = region && region.value || '';
      var selectedType = type && type.value || '';
      var selectedYear = year && year.value || '';

      var filtered = movies.filter(function (movie) {
        var text = [movie.title, movie.region, movie.type, movie.genre, movie.tags, movie.one_line].join(' ').toLowerCase();
        if (q && text.indexOf(q) === -1) {
          return false;
        }
        if (selectedRegion && movie.region_norm !== selectedRegion) {
          return false;
        }
        if (selectedType && movie.type_norm !== selectedType) {
          return false;
        }
        if (selectedYear && String(movie.year) !== selectedYear) {
          return false;
        }
        return true;
      }).slice(0, 120);

      if (count) {
        count.textContent = '当前匹配 ' + filtered.length + ' 部影片，最多展示前 120 条结果';
      }

      output.innerHTML = filtered.map(function (movie) {
        return [
          '<article class="movie-card">',
          '  <a href="movies/' + movie.id + '.html" class="movie-poster">',
          '    <img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
          '    <span class="play-chip">在线播放</span>',
          '  </a>',
          '  <div class="movie-card-body">',
          '    <h3><a href="movies/' + movie.id + '.html">' + escapeHtml(movie.title) + '</a></h3>',
          '    <p class="movie-meta">' + escapeHtml(movie.region_norm) + ' · ' + escapeHtml(movie.type_norm) + ' · ' + escapeHtml(movie.year || '年份待定') + '</p>',
          '    <p class="movie-desc">' + escapeHtml(movie.one_line || '') + '</p>',
          '  </div>',
          '</article>'
        ].join('\n');
      }).join('\n');
    }
  }

  function fillYearOptions(select, movies) {
    if (!select) {
      return;
    }

    var existing = Array.prototype.map.call(select.options, function (option) {
      return option.value;
    });
    var years = movies
      .map(function (movie) {
        return movie.year;
      })
      .filter(Boolean)
      .filter(function (value, index, array) {
        return array.indexOf(value) === index;
      })
      .sort(function (a, b) {
        return b - a;
      });

    years.forEach(function (movieYear) {
      if (existing.indexOf(String(movieYear)) === -1) {
        var option = document.createElement('option');
        option.value = String(movieYear);
        option.textContent = String(movieYear);
        select.appendChild(option);
      }
    });
  }

  function setupVideoPlayer(shell) {
    var video = shell.querySelector('video');
    var overlay = shell.querySelector('[data-video-overlay]');
    var message = shell.querySelector('[data-video-message]');
    var src = shell.getAttribute('data-video-src');

    if (!video || !src) {
      return;
    }

    function showMessage(text) {
      if (message) {
        message.textContent = text;
      }
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        showMessage('播放源已就绪，点击画面即可播放。');
      });
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          showMessage('视频加载遇到问题，请刷新页面或稍后重试。');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      showMessage('播放源已就绪，点击画面即可播放。');
    } else {
      showMessage('当前浏览器不支持 HLS 播放，请更换浏览器或开启 HLS 支持。');
    }

    if (overlay) {
      overlay.addEventListener('click', function () {
        var playPromise = video.play();
        if (playPromise && playPromise.then) {
          playPromise.then(function () {
            overlay.classList.add('is-hidden');
          }).catch(function () {
            showMessage('浏览器阻止了自动播放，请再次点击播放器控制条。');
          });
        } else {
          overlay.classList.add('is-hidden');
        }
      });
    }

    video.addEventListener('play', function () {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
    });

    video.addEventListener('pause', function () {
      if (overlay) {
        overlay.classList.remove('is-hidden');
      }
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}());
