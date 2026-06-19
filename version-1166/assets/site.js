import { H as Hls } from './hls-vendor.js';

const ready = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
};

ready(() => {
  setupMobileMenu();
  setupImageFallbacks();
  setupHeroSlider();
  setupFilters();
  setupPlayers();
  applySearchQuery();
});

function setupMobileMenu() {
  const button = document.querySelector('[data-menu-button]');
  const menu = document.querySelector('[data-mobile-menu]');

  if (!button || !menu) {
    return;
  }

  button.addEventListener('click', () => {
    menu.classList.toggle('open');
  });
}

function setupImageFallbacks() {
  document.querySelectorAll('.poster-img').forEach((image) => {
    image.addEventListener('error', () => {
      const frame = image.closest('.poster-frame, .hero-poster, .rank-poster');
      if (frame) {
        frame.classList.add('image-missing');
      }
    }, { once: true });
  });
}

function setupHeroSlider() {
  const slider = document.querySelector('[data-hero-slider]');

  if (!slider) {
    return;
  }

  const slides = Array.from(slider.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(slider.querySelectorAll('[data-hero-dot]'));

  if (slides.length <= 1) {
    return;
  }

  let activeIndex = 0;
  let timer = null;

  const activate = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('active', slideIndex === activeIndex);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === activeIndex);
    });
  };

  const start = () => {
    stop();
    timer = window.setInterval(() => activate(activeIndex + 1), 5200);
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = Number.parseInt(dot.dataset.heroDot || '0', 10);
      activate(index);
      start();
    });
  });

  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);
  start();
}

function setupFilters() {
  const containers = Array.from(document.querySelectorAll('[data-card-container]'));
  const cards = Array.from(document.querySelectorAll('[data-card]'));
  const searchInput = document.querySelector('[data-search-input]');
  const yearFilter = document.querySelector('[data-year-filter]');
  const clearButton = document.querySelector('[data-clear-filter]');
  const counter = document.querySelector('[data-result-count]');

  if (!cards.length || (!searchInput && !yearFilter)) {
    return;
  }

  const apply = () => {
    const query = (searchInput?.value || '').trim().toLowerCase();
    const year = yearFilter?.value || '';
    let visible = 0;

    cards.forEach((card) => {
      const text = (card.dataset.search || card.textContent || '').toLowerCase();
      const cardYear = card.dataset.year || '';
      const queryMatched = !query || text.includes(query);
      const yearMatched = !year || (year === 'older' ? Number(cardYear) < 2020 : cardYear === year);
      const matched = queryMatched && yearMatched;

      card.classList.toggle('is-hidden', !matched);
      if (matched) {
        visible += 1;
      }
    });

    containers.forEach((container) => {
      container.dataset.visibleCount = String(visible);
    });

    if (counter) {
      counter.textContent = `当前显示 ${visible} 部`;
    }
  };

  searchInput?.addEventListener('input', apply);
  yearFilter?.addEventListener('change', apply);
  clearButton?.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
    }
    if (yearFilter) {
      yearFilter.value = '';
    }
    apply();
  });

  apply();
}

function applySearchQuery() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');
  const searchInput = document.querySelector('[data-search-input]');

  if (query && searchInput) {
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function setupPlayers() {
  document.querySelectorAll('[data-player]').forEach((player) => {
    const video = player.querySelector('video');
    const buttons = player.querySelectorAll('[data-player-button]');
    const message = player.querySelector('[data-player-message]');
    const source = player.dataset.videoSource;
    let hls = null;
    let prepared = false;

    if (!video || !source) {
      if (message) {
        message.textContent = '当前影片播放源不可用。';
      }
      return;
    }

    const setMessage = (text) => {
      if (message) {
        message.textContent = text;
      }
    };

    const prepare = () => {
      if (prepared) {
        return Promise.resolve();
      }

      prepared = true;
      setMessage('正在加载播放源...');

      if (Hls && Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(source);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setMessage('播放源已加载，可以观看。');
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (!data || !data.fatal) {
            return;
          }

          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setMessage('网络加载异常，正在重新尝试。');
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            setMessage('媒体解码异常，正在恢复。');
            hls.recoverMediaError();
          } else {
            setMessage('当前浏览器无法继续播放该视频。');
            hls.destroy();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        setMessage('播放源已绑定，可以观看。');
      } else {
        setMessage('当前浏览器不支持 HLS 播放。');
      }

      return Promise.resolve();
    };

    const play = async () => {
      await prepare();
      try {
        await video.play();
        player.classList.add('playing');
        setMessage('正在播放。');
      } catch (error) {
        setMessage('浏览器阻止自动播放，请再次点击播放按钮。');
      }
    };

    buttons.forEach((button) => {
      button.addEventListener('click', play);
    });

    video.addEventListener('play', () => player.classList.add('playing'));
    video.addEventListener('pause', () => player.classList.remove('playing'));
    window.addEventListener('beforeunload', () => {
      if (hls) {
        hls.destroy();
      }
    });
  });
}
