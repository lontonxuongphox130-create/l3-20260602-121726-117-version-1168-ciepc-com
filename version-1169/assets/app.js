(function () {
  function selectAll(name) {
    return Array.prototype.slice.call(document.querySelectorAll(name));
  }

  function initMenu() {
    var button = document.querySelector("[data-menu-button]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function initHero() {
    var root = document.querySelector("[data-hero-carousel]");
    if (!root) {
      return;
    }
    var slides = selectAll("[data-hero-slide]");
    var dots = selectAll("[data-hero-dot]");
    var index = 0;
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
      });
    });
    if (slides.length > 1) {
      window.setInterval(function () {
        show(index + 1);
      }, 5600);
    }
  }

  function createCard(item) {
    return [
      '<article class="movie-card compact-card">',
      '<a class="poster-link" href="' + item.href + '">',
      '<img src="' + item.cover + '" alt="' + item.title + '" loading="lazy">',
      '</a>',
      '<div class="card-body">',
      '<div class="card-meta"><span>' + item.year + '</span><span>' + item.region + '</span><span>' + item.type + '</span></div>',
      '<h3><a href="' + item.href + '">' + item.title + '</a></h3>',
      '<p>' + item.oneLine + '</p>',
      '<div class="tag-row"><span>' + item.genre + '</span></div>',
      '</div>',
      '</article>'
    ].join("");
  }

  function initSearch() {
    var results = document.getElementById("search-results");
    if (!results || !window.SEARCH_ITEMS) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var q = (params.get("q") || "").trim();
    var input = document.getElementById("search-input");
    var title = document.getElementById("search-title");
    var note = document.getElementById("search-note");
    if (input) {
      input.value = q;
    }
    var items = window.SEARCH_ITEMS;
    if (q) {
      var key = q.toLowerCase();
      items = items.filter(function (item) {
        return item.searchText.indexOf(key) !== -1;
      }).slice(0, 80);
      if (title) {
        title.textContent = '“' + q + '”的搜索结果';
      }
      if (note) {
        note.textContent = items.length ? '找到相关内容，点击卡片进入详情页。' : '暂未找到匹配内容，可尝试更换关键词。';
      }
    } else {
      items = items.slice(0, 40);
      if (note) {
        note.textContent = '展示部分热门内容，可输入关键词继续查找。';
      }
    }
    results.innerHTML = items.map(createCard).join("");
  }

  window.initMoviePlayer = function (source) {
    var video = document.getElementById("video-player");
    var cover = document.getElementById("player-cover");
    var starter = document.getElementById("play-starter");
    var ready = false;
    var hls = null;
    if (!video || !source) {
      return;
    }
    function attach() {
      if (ready) {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls();
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
      ready = true;
    }
    function play() {
      attach();
      if (cover) {
        cover.classList.add("is-hidden");
      }
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {
          if (cover) {
            cover.classList.remove("is-hidden");
          }
        });
      }
    }
    if (cover) {
      cover.addEventListener("click", play);
    }
    if (starter) {
      starter.addEventListener("click", play);
    }
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    initMenu();
    initHero();
    initSearch();
  });
})();
