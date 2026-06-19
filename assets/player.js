(function () {
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
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

  function setStatus(statusNode, text) {
    if (statusNode) {
      statusNode.textContent = text || '';
    }
  }

  async function ensureHls() {
    if (window.Hls) {
      return window.Hls;
    }
    await loadScript('https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js');
    return window.Hls;
  }

  function setupPlayer(card) {
    var video = card.querySelector('video[data-src]');
    var button = card.querySelector('[data-play]');
    var status = card.querySelector('[data-player-status]');
    var hlsInstance = null;

    if (!video || !button) {
      return;
    }

    button.addEventListener('click', async function () {
      var src = video.getAttribute('data-src');
      if (!src) {
        setStatus(status, '播放源读取失败');
        return;
      }

      button.classList.add('is-hidden');
      setStatus(status, '正在载入播放源...');

      try {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
        } else {
          var Hls = await ensureHls();
          if (Hls && Hls.isSupported()) {
            if (hlsInstance) {
              hlsInstance.destroy();
            }
            hlsInstance = new Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hlsInstance.loadSource(src);
            hlsInstance.attachMedia(video);
          } else {
            video.src = src;
          }
        }

        video.controls = true;
        await video.play();
        setStatus(status, '');
      } catch (error) {
        button.classList.remove('is-hidden');
        setStatus(status, '播放初始化失败，请刷新后重试');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-player]').forEach(setupPlayer);
  });
})();
