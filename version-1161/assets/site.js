(function () {
    var menuButton = document.querySelector('[data-menu-button]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    if (menuButton && mobileNav) {
        menuButton.addEventListener('click', function () {
            var open = mobileNav.classList.toggle('is-open');
            menuButton.setAttribute('aria-expanded', String(open));
        });
    }

    document.querySelectorAll('img').forEach(function (image) {
        image.addEventListener('error', function () {
            image.classList.add('image-missing');
            image.removeAttribute('src');
        }, { once: true });
    });

    var backTop = document.querySelector('[data-back-top]');
    if (backTop) {
        var syncBackTop = function () {
            if (window.scrollY > 360) {
                backTop.classList.add('is-visible');
            } else {
                backTop.classList.remove('is-visible');
            }
        };
        window.addEventListener('scroll', syncBackTop, { passive: true });
        backTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        syncBackTop();
    }

    var hero = document.querySelector('[data-hero]');
    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var backgrounds = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-bg]'));
        var thumbs = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-thumb]'));
        var active = 0;
        var timer = null;

        var setSlide = function (index) {
            if (!slides.length) {
                return;
            }
            active = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === active);
            });
            backgrounds.forEach(function (background, backgroundIndex) {
                background.classList.toggle('is-active', backgroundIndex === active);
            });
            thumbs.forEach(function (thumb, thumbIndex) {
                thumb.classList.toggle('is-active', thumbIndex === active);
            });
        };

        var restart = function () {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                setSlide(active + 1);
            }, 5200);
        };

        var prev = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');

        if (prev) {
            prev.addEventListener('click', function () {
                setSlide(active - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                setSlide(active + 1);
                restart();
            });
        }

        thumbs.forEach(function (thumb) {
            thumb.addEventListener('click', function () {
                setSlide(Number(thumb.getAttribute('data-hero-thumb') || 0));
                restart();
            });
        });

        setSlide(0);
        restart();
    }

    document.querySelectorAll('[data-filter-scope]').forEach(function (scope) {
        var search = scope.querySelector('[data-filter-search]');
        var region = scope.querySelector('[data-filter-region]');
        var year = scope.querySelector('[data-filter-year]');
        var type = scope.querySelector('[data-filter-type]');
        var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));

        var normalize = function (value) {
            return String(value || '').trim().toLowerCase();
        };

        var apply = function () {
            var keyword = normalize(search && search.value);
            var regionValue = normalize(region && region.value);
            var yearValue = normalize(year && year.value);
            var typeValue = normalize(type && type.value);

            cards.forEach(function (card) {
                var haystack = normalize([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-genre'),
                    card.getAttribute('data-category'),
                    card.textContent
                ].join(' '));

                var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                var matchesRegion = !regionValue || normalize(card.getAttribute('data-region')).indexOf(regionValue) !== -1 || haystack.indexOf(regionValue) !== -1;
                var matchesYear = !yearValue || normalize(card.getAttribute('data-year')) === yearValue;
                var matchesType = !typeValue || normalize(card.getAttribute('data-type')).indexOf(typeValue) !== -1;

                card.hidden = !(matchesKeyword && matchesRegion && matchesYear && matchesType);
            });
        };

        [search, region, year, type].forEach(function (control) {
            if (control) {
                control.addEventListener('input', apply);
                control.addEventListener('change', apply);
            }
        });

        var params = new URLSearchParams(window.location.search);
        var query = params.get('q');
        if (query && search) {
            search.value = query;
        }
        apply();
    });

    document.querySelectorAll('[data-player]').forEach(function (player) {
        var video = player.querySelector('video[data-src]');
        var button = player.querySelector('[data-player-action="play"]');
        var hlsInstance = null;

        if (!video) {
            return;
        }

        var startPlayback = function () {
            var source = video.getAttribute('data-src');
            if (!source) {
                return;
            }

            player.classList.add('is-loading');

            if (window.Hls && window.Hls.isSupported()) {
                if (!hlsInstance) {
                    hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        video.play().catch(function () {});
                    });
                    hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal) {
                            hlsInstance.destroy();
                            hlsInstance = null;
                            video.src = source;
                            video.play().catch(function () {});
                        }
                    });
                } else {
                    video.play().catch(function () {});
                }
            } else {
                if (!video.src) {
                    video.src = source;
                }
                video.play().catch(function () {});
            }
        };

        if (button) {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                startPlayback();
            });
        }

        player.addEventListener('click', function (event) {
            if (event.target.closest('button') || event.target.closest('video') || event.target.closest('a')) {
                return;
            }
            startPlayback();
        });

        video.addEventListener('play', function () {
            player.classList.add('is-playing');
            player.classList.remove('is-loading');
        });

        video.addEventListener('pause', function () {
            if (!video.ended) {
                player.classList.remove('is-playing');
            }
        });
    });
})();
