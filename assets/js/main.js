/* =====================================================================
   Логика сайта. Без сторонних библиотек.
   Безопасность: весь динамический контент создаётся через
   createElement/textContent (без innerHTML) — защита от XSS.
   ===================================================================== */
(function () {
  "use strict";

  // Защита от встраивания сайта в чужие фреймы (кликджекинг)
  if (window.top !== window.self) {
    try { window.top.location = window.self.location.href; } catch (e) { document.documentElement.textContent = ""; }
    return;
  }

  document.documentElement.classList.add("js");
  var D = window.SITE_DATA || { STYLES: {}, PROJECTS: [] };

  /* ---------- Утилиты ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var SAFE_IMG = /^assets\/img\/[a-z0-9\-_\/]+\.(jpe?g|png|webp|avif)$/i;
  function safeSrc(src) { return SAFE_IMG.test(src) ? src : "assets/img/hero.jpg"; }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function styleName(key) { return D.STYLES[key] ? D.STYLES[key].name : ""; }

  /* ---------- Шапка и меню ---------- */
  var header = $(".header"), burger = $(".burger"), nav = $("#nav");
  var MENU_CLOSE_MS = 300;   /* совпадает с длительностью закрытия меню в CSS */
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  }
  burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setMenu(false); setFab(false); } });
  /* Клик по затемнению под меню тоже его закрывает */
  document.addEventListener("click", function (e) {
    if (!document.body.classList.contains("menu-open")) return;
    if (e.target.closest(".nav") || e.target.closest(".burger")) return;
    setMenu(false);
  });

  /* ---------- Плавная прокрутка по внутренним ссылкам ----------
     Собственная анимация вместо встроенной CSS-плавности: все переходы
     (логотип, пункты меню, кнопки) идут одинаково — с одной длительностью
     и кривой ускорения. */
  var HEADER_OFFSET = 88;   /* совпадает с scroll-padding-top в style.css */
  var scrollState = null;

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function stopScrollAnim() {
    if (!scrollState) return;
    cancelAnimationFrame(scrollState.raf);
    clearInterval(scrollState.timer);
    scrollState.root.style.scrollBehavior = scrollState.prev;
    scrollState = null;
  }

  /* Прокрутка к цели с плавной анимацией.
     target — либо координата, либо функция, возвращающая актуальную
     координату: цель пересчитывается каждый кадр, поэтому сдвиг раскладки
     (content-visibility, догрузка картинок) не сбивает посадку на секцию. */
  function animateScrollTo(target, onDone) {
    stopScrollAnim();
    var root = document.documentElement;
    var prev = root.style.scrollBehavior;
    /* Отключаем CSS-сглаживание: пока идёт наша анимация, каждый вызов
       scrollTo иначе запускал бы ещё одну плавную прокрутку. Заодно это
       прерывает нативную прокрутку, если она шла. */
    root.style.scrollBehavior = "auto";
    function targetY() {
      var y = typeof target === "function" ? target() : target;
      var maxY = Math.max(0, root.scrollHeight - window.innerHeight);
      return Math.min(Math.max(y, 0), maxY);
    }
    var startY = window.pageYOffset || root.scrollTop;
    var endY = targetY();
    window.scrollTo(0, startY);   /* фиксируем текущую точку, отменяя нативную прокрутку */
    if (reducedMotion() || Math.abs(endY - startY) < 2) {
      window.scrollTo(0, endY);
      root.style.scrollBehavior = prev;
      updateToTop();
      if (onDone) onDone();
      return;
    }
    var duration = Math.min(1100, Math.max(420, Math.abs(endY - startY) * 0.35));
    var startTime = null;
    var state = { raf: 0, timer: 0, root: root, prev: prev };
    scrollState = state;
    /* Кадры берём из requestAnimationFrame, но страхуемся таймером:
       в фоновой вкладке браузер кадры приостанавливает, и без страховки
       переход просто не начался бы.
       Время везде берём из performance.now(): у requestAnimationFrame
       таймстемп — тоже performance.now(), а Date.now() отсчитывает от
       эпохи и смешивать их нельзя.
       Таймер один на всю анимацию, а не на каждый кадр: новый setTimeout
       в каждом шаге накапливал бы вызовы и ломал расчёт прогресса. */
    function schedule() {
      state.raf = requestAnimationFrame(step);
      if (!state.timer) {
        state.timer = setInterval(function () {
          if (scrollState !== state) { clearInterval(state.timer); state.timer = 0; return; }
          step(performance.now());
        }, 40);
      }
    }
    function step(ts) {
      if (scrollState !== state) return;
      if (startTime === null) startTime = ts;
      var p = Math.min(1, (ts - startTime) / duration);
      var eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      var dest = targetY();
      window.scrollTo(0, Math.round(startY + (dest - startY) * eased));
      updateToTop();   /* состояние кнопки «Наверх» — по ходу анимации */
      if (p < 1) { schedule(); }
      else {
        cancelAnimationFrame(state.raf);
        clearInterval(state.timer);
        state.timer = 0;
        scrollState = null;
        root.style.scrollBehavior = prev;
        updateToTop();
        if (onDone) onDone();
      }
    }
    schedule();
  }

  /* Прокрутка к секции с отступом под закреплённую шапку. Позиция берётся
     из секции в каждом кадре, поэтому присадочная точка всегда актуальна. */
  function scrollToSection(el, offset, onDone) {
    if (!el) return;
    var off = offset;
    if (off === undefined) {
      var m = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      off = Math.max(HEADER_OFFSET, m);
    }
    animateScrollTo(function () {
      return el.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop) - off;
    }, onDone);
  }

  /* Клик по любой внутренней ссылке: логотип, пункты меню, кнопки. */
  $$('a[href^="#"]').forEach(function (a) {
    if (a.classList.contains("skip")) return;   /* «Перейти к содержанию» — без анимации */
    a.addEventListener("click", function (e) {
      var hash = a.getAttribute("href");
      if (!hash || hash === "#") return;
      var id = hash.slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      function go() {
        if (id === "top") {
          /* Якорь #top не срабатывает: заголовок закреплён (position: fixed),
             и браузер не меняет позицию прокрутки. Поэтому прокручиваем сами. */
          animateScrollTo(0);
          if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
        } else {
          scrollToSection(target);
          if (history.replaceState) {
            var same = location.hash === hash;
            history[same ? "replaceState" : "pushState"](null, "", same ? location.pathname + location.search : hash);
          }
        }
      }
      /* Пункт открытого мобильного меню: сначала плавно закрываем меню,
         и только после этого переходим к разделу. */
      if (nav.contains(a) && nav.classList.contains("is-open")) {
        setMenu(false);
        setTimeout(go, MENU_CLOSE_MS);
      } else {
        go();
      }
    });
  });

  /* Пользователь перехватывает прокрутку — останавливаем анимацию. */
  ["wheel", "touchstart"].forEach(function (ev) {
    window.addEventListener(ev, stopScrollAnim, { passive: true });
  });

  /* ---------- Кнопка «Наверх» ----------
     Показывается, когда страница прокручена вниз, и поднимает её наверх
     той же анимацией, что и логотип в шапке. */
  var toTop = $(".to-top");
  function updateToTop() {
    if (toTop) toTop.classList.toggle("is-visible", window.scrollY > 400);
  }
  if (toTop) {
    toTop.addEventListener("click", function () {
      animateScrollTo(0);
      if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
    });
    window.addEventListener("scroll", updateToTop, { passive: true });
    updateToTop();
  }

  var year = $("#year"); if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Появление блоков ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    $$(".reveal").forEach(function (n) { io.observe(n); });
  } else { $$(".reveal").forEach(function (n) { n.classList.add("is-in"); }); }

  /* ---------- Видео в блоке «Обо мне» ----------
     Запускаем только когда блок виден, чтобы не тянуть 5,8 МБ при открытии
     страницы. При prefers-reduced-motion остаётся постер elena.jpg. */
  var aboutVideo = $(".about__video");
  if (aboutVideo) {
    if (reducedMotion()) {
      aboutVideo.pause();
    } else if ("IntersectionObserver" in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            var p = aboutVideo.play();
            if (p && p.catch) p.catch(function () {});
          } else {
            aboutVideo.pause();
          }
        });
      }, { threshold: 0.25 });
      vio.observe(aboutVideo);
    } else {
      var p = aboutVideo.play();
      if (p && p.catch) p.catch(function () {});
    }
  }

  /* ---------- Видео в блоке «Процесс» ----------
     Не даём двум роликам играть одновременно и останавливаем видео,
     когда оно уходит с экрана: звук не должен играть из другого блока. */
  var processVideos = $$("#process video");
  if (processVideos.length) {
    processVideos.forEach(function (v) {
      v.addEventListener("play", function () {
        processVideos.forEach(function (other) {
          if (other !== v && !other.paused) other.pause();
        });
      });
    });
    if ("IntersectionObserver" in window) {
      var pvio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting && !en.target.paused) en.target.pause();
        });
      }, { threshold: 0.2 });
      processVideos.forEach(function (v) { pvio.observe(v); });
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) processVideos.forEach(function (v) { if (!v.paused) v.pause(); });
    });
  }

  /* ---------- Портфолио ---------- */
  var grid = $("#grid"), filters = $("#filters"), current = "all";
  function renderFilters() {
    var styles = Object.keys(D.STYLES);
    /* Пока стилей нет, панель фильтра не показываем: пустой портфолио
       остаётся чистой заготовкой под новые проекты. */
    if (!styles.length) { filters.hidden = true; return; }
    filters.hidden = false;
    var keys = ["all"].concat(styles);
    keys.forEach(function (k) {
      filters.appendChild(el("button", {
        class: "chip", type: "button", "aria-pressed": String(k === current), "data-style": k,
        text: k === "all" ? "Все проекты" : styleName(k),
        onclick: function () { setFilter(k); }
      }));
    });
  }
  function setFilter(k) {
    current = k;
    $$(".chip", filters).forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-style") === k)); });
    renderGrid();
  }
  function renderGrid() {
    clear(grid);
    /* Портфолио ещё не заполнено: не показываем заглушку «скоро появятся»,
       пока нет ни стилей, ни проектов. */
    if (!Object.keys(D.STYLES).length && !D.PROJECTS.length) return;
    var list = D.PROJECTS.filter(function (p) { return current === "all" || p.style === current; });
    if (!list.length) { grid.appendChild(el("p", { class: "empty", text: "Проекты в этом стиле скоро появятся. Хотите стать первым? Напишите мне!" })); return; }
    list.forEach(function (p) {
      var meta = [p.area, styleName(p.style)].filter(function (s) { return s && s !== "—"; }).join(" · ");
      grid.appendChild(el("button", { class: "card", type: "button", "aria-label": "Открыть проект «" + p.title + "»", onclick: function () { openProject(p); } }, [
        el("div", { class: "card__img" }, [
          el("img", { src: safeSrc(p.images[0]), alt: p.title, loading: "lazy", width: "600", height: "750" }),
          el("span", { class: "card__tag", text: p.kind })
        ]),
        el("div", { class: "card__body" }, [
          el("span", { class: "card__title", text: p.title }),
          el("span", { class: "card__meta", text: meta })
        ])
      ]));
    });
  }
  if (grid && filters) { renderFilters(); renderGrid(); }

  /* ---------- Модальное окно проекта ---------- */
  var modal = $("#modal"), mImg = $("#modal-img"), mThumbs = $("#modal-thumbs"), mMain = $(".modal__main"), gal = [], gi = 0, lastFocus = null;
  function showImg(i, dir) {
    gi = (i + gal.length) % gal.length;
    mImg.classList.remove("is-next", "is-prev");
    mImg.src = safeSrc(gal[gi]);
    if (dir && !reducedMotion()) {
      void mImg.offsetWidth;   /* перезапуск анимации при быстром листании */
      mImg.classList.add(dir > 0 ? "is-next" : "is-prev");
    }
    $$("button", mThumbs).forEach(function (b, j) { b.setAttribute("aria-current", String(j === gi)); });
  }
  function openProject(p) {
    lastFocus = document.activeElement;
    gal = p.images.slice();
    $("#modal-kind").textContent = p.kind;
    $("#modal-title").textContent = p.title;
    $("#modal-area").textContent = p.area;
    $("#modal-term").textContent = p.term;
    $("#modal-style").textContent = styleName(p.style);
    $("#modal-city").textContent = p.city;
    $("#modal-task").textContent = p.task;
    $("#modal-solution").textContent = p.solution;
    mImg.alt = p.title;
    clear(mThumbs);
    gal.forEach(function (src, i) {
      mThumbs.appendChild(el("button", { type: "button", "aria-label": "Фото " + (i + 1), onclick: function () { showImg(i, i === gi ? 0 : (i > gi ? 1 : -1)); } }, [el("img", { src: safeSrc(src), alt: "" })]));
    });
    $$(".modal__nav").forEach(function (b) { b.hidden = gal.length < 2; });
    mThumbs.hidden = gal.length < 2;
    showImg(0);
    if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
  }
  function closeModal() { if (modal.open) { modal.close ? modal.close() : modal.removeAttribute("open"); } }
  if (modal) {
    modal.addEventListener("close", function () { if (lastFocus) lastFocus.focus(); });
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    $$("[data-close]", modal).forEach(function (b) { b.addEventListener("click", closeModal); });
    $$("[data-step]", modal).forEach(function (b) { b.addEventListener("click", function () { var step = Number(b.getAttribute("data-step")); showImg(gi + step, step); }); });
    modal.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" && gal.length > 1) showImg(gi + 1, 1);
      if (e.key === "ArrowLeft" && gal.length > 1) showImg(gi - 1, -1);
    });

    /* Свайп по фото на телефоне: вертикаль отдаём прокрутке модалки,
       горизонтальный жест листает галерею. */
    var swipeX = null, swipeY = null;
    if (mMain) {
      mMain.addEventListener("touchstart", function (e) {
        if (e.touches.length !== 1) { swipeX = null; return; }
        swipeX = e.touches[0].clientX;
        swipeY = e.touches[0].clientY;
      }, { passive: true });
      mMain.addEventListener("touchcancel", function () { swipeX = null; }, { passive: true });
      mMain.addEventListener("touchend", function (e) {
        if (swipeX == null || gal.length < 2) { swipeX = null; return; }
        var t = e.changedTouches[0];
        var dx = t.clientX - swipeX;
        var dy = t.clientY - swipeY;
        swipeX = null;
        if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        showImg(gi + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      }, { passive: true });
    }
  }

  /* ---------- До / после ---------- */
  var cmp = $("#compare-box"), range = $("#compare-range");
  if (cmp && range) {
    var upd = function () { cmp.style.setProperty("--pos", Math.min(100, Math.max(0, Number(range.value))) + "%"); };
    range.addEventListener("input", upd); upd();
  }

  /* ---------- Слайдер отзывов ---------- */
  var track = $("#reviews-track");
  $$("[data-slide]").forEach(function (b) {
    b.addEventListener("click", function () {
      var card = track.firstElementChild; if (!card) return;
      var step = card.getBoundingClientRect().width + 24;
      track.scrollBy({ left: step * Number(b.getAttribute("data-slide")), behavior: "smooth" });
    });
  });

  /* ---------- Отзывы: «Показать ещё» ----------
     CSS обрезает текст до 10 строк только при включённом JS. Кнопку
     добавляем, если строк больше; измеряем при подходе блока к экрану,
     потому что у секции content-visibility. */
  var reviewsSection = $("#reviews");
  var reviewCards = reviewsSection ? $$(".review", reviewsSection) : [];
  function fitReviews() {
    if (!reviewsSection || !track) return;
    var clamp = parseInt(getComputedStyle(reviewsSection).getPropertyValue("--review-clamp"), 10) || 288;
    /* Сбрасываем общую высоту, чтобы измерить карточки по содержимому */
    track.style.setProperty("--review-h", "0px");
    reviewCards.forEach(function (card, i) {
      var text = card.querySelector("p");
      if (!text || card.classList.contains("is-open") || !text.clientHeight) return;
      var btn = card.querySelector(".review__more");
      var long = text.scrollHeight > clamp + 8;
      if (long && !btn) {
        if (!text.id) text.id = "review-text-" + (i + 1);
        card.classList.add("has-more");
        var more = el("button", {
          "class": "review__more",
          type: "button",
          "aria-expanded": "false",
          "aria-controls": text.id,
          text: "Показать ещё"
        });
        more.addEventListener("click", function () {
          var open = !card.classList.contains("is-open");
          card.classList.toggle("is-open", open);
          more.setAttribute("aria-expanded", String(open));
          more.textContent = open ? "Свернуть" : "Показать ещё";
          if (!open) fitReviews();
        });
        text.parentNode.insertBefore(more, text.nextSibling);
      } else if (!long && btn) {
        card.classList.remove("has-more");
        card.classList.remove("is-open");
        btn.parentNode.removeChild(btn);
      }
    });
    /* Все свёрнутые карточки — одной высоты по самой высокой из них */
    var max = 0;
    reviewCards.forEach(function (card) {
      if (card.classList.contains("is-open")) return;
      if (card.offsetHeight > max) max = card.offsetHeight;
    });
    if (max) track.style.setProperty("--review-h", max + "px");
  }
  if (reviewsSection) {
    if ("IntersectionObserver" in window) {
      var rio = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { fitReviews(); rio.disconnect(); }
      }, { rootMargin: "300px" });
      rio.observe(reviewsSection);
    } else {
      fitReviews();
    }
    var fitTimer;
    window.addEventListener("resize", function () {
      clearTimeout(fitTimer);
      fitTimer = setTimeout(fitReviews, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitReviews);
  }

  /* ---------- Частые вопросы: плавное раскрытие ----------
     Нативный <details> открывается мгновенно, поэтому высоту ответа
     анимируем сами: оборачиваем содержимое и переводим высоту с 0 на
     фактическую. Работает во всех браузерах, в отличие от ::details-content.
     Смена значения идёт через setTimeout, а не через кадры: в фоновой
     вкладке кадров не бывает, и ответ просто не открылся бы. */
  $$("#faq details").forEach(function (d) {
    var summary = d.querySelector("summary");
    var body = d.querySelector("p");
    if (!summary || !body) return;
    var wrap = document.createElement("div");
    wrap.className = "faq__body";
    d.insertBefore(wrap, body);
    wrap.appendChild(body);
    var animating = false;
    summary.addEventListener("click", function (e) {
      e.preventDefault();
      if (animating) return;
      var open = !d.open;
      if (reducedMotion()) {           /* без анимации — просто переключаем */
        d.open = open;
        return;
      }
      animating = true;
      if (open) {
        d.open = true;
        wrap.style.height = "0px";
        wrap.style.opacity = "0";
        setTimeout(function () {
          var h = body.offsetHeight;
          wrap.style.transition = "height .3s ease, opacity .25s ease";
          wrap.style.height = h + "px";
          wrap.style.opacity = "1";
          setTimeout(function () {
            wrap.style.transition = ""; wrap.style.height = ""; wrap.style.opacity = "";
            animating = false;
          }, 320);
        }, 20);
      } else {
        d.classList.add("is-closing");
        var h = body.offsetHeight;
        wrap.style.height = h + "px";
        setTimeout(function () {
          wrap.style.transition = "height .25s ease, opacity .2s ease";
          wrap.style.height = "0px";
          wrap.style.opacity = "0";
          setTimeout(function () {
            d.open = false;
            d.classList.remove("is-closing");
            wrap.style.transition = ""; wrap.style.height = ""; wrap.style.opacity = "";
            animating = false;
          }, 270);
        }, 20);
      }
    });
  });

  /* ---------- Копирование телефона ---------- */
  function copyText(v, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(v).then(function () { done(true); }, function () { done(false); });
    } else {
      done(false);
    }
  }
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      copyText(b.getAttribute("data-copy"), function (ok) {
        if (!ok) return;
        b.textContent = "Скопировано";
        setTimeout(function () { b.textContent = "Скопировать"; }, 2000);
      });
    });
  });
  /* Строка Макса: копируем номер и открываем max.ru в новой вкладке */
  var maxRow = $("#max-copy");
  if (maxRow) {
    var maxVal = maxRow.querySelector(".val");
    var maxValText = maxVal ? maxVal.textContent : "";
    var maxTimer;
    maxRow.addEventListener("click", function () {
      copyText(maxRow.getAttribute("data-copy-phone"), function (ok) {
        if (!ok || !maxVal) return;
        clearTimeout(maxTimer);
        maxVal.textContent = "Номер скопирован";
        maxTimer = setTimeout(function () { maxVal.textContent = maxValText; }, 2000);
      });
    });
  }

  /* ---------- Плавающая кнопка ---------- */
  var fabBtn = $(".fab__btn"), fabMenu = $("#fab-menu"), fab = $(".fab");
  function setFab(open) {
    if (!fabBtn) return;
    fabBtn.setAttribute("aria-expanded", String(open));
    fab.classList.toggle("is-open", open);
    /* Пока меню закрыто, оно не должно попадать в фокус с клавиатуры */
    fabMenu.setAttribute("aria-hidden", String(!open));
    var links = fabMenu.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) links[i].tabIndex = open ? 0 : -1;
  }
  if (fabBtn) {
    fabBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setFab(!fab.classList.contains("is-open"));
    });
    document.addEventListener("click", function (e) { if (!e.target.closest(".fab")) setFab(false); });
    setFab(false);
    // Прячем кнопку, когда видны контакты — чтобы не перекрывала кнопки
    if ("IntersectionObserver" in window) {
      var seen = new Set();
      var fio = new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) seen.add(x.target); else seen.delete(x.target); });
        var hide = seen.size > 0;
        fab.classList.toggle("is-hidden", hide);
        if (hide) setFab(false);
        /* Кнопка «Наверх» стоит по центру экрана — там же прячем её,
           чтобы не закрывать контакты. */
        if (toTop) toTop.classList.toggle("is-hidden", hide);
      }, { threshold: 0.15 });
      ["#contacts"].forEach(function (s) { var n = $(s); if (n) fio.observe(n); });
    }
  }
})();
