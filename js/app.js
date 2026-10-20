/**
 * 美食之旅 · 应用逻辑
 * 零依赖：hash 路由 + 原生 DOM 渲染，直接双击 index.html 即可运行。
 */
(function () {
  'use strict';

  var DATA = window.FoodieData;
  var CATEGORIES = DATA.CATEGORIES;
  var DISHES = DATA.DISHES;

  var KEY_FAV = 'foodie:favorites';
  var KEY_REVIEWS = 'foodie:reviews';
  var KEY_THEME = 'foodie:theme';
  var KEY_SORT = 'foodie:sort';

  var state = {
    query: '',
    category: 'all',
    sort: safeGet(KEY_SORT, 'rating'),
    favorites: safeGet(KEY_FAV, []),
    reviews: safeGet(KEY_REVIEWS, {}),
    detailStars: 5
  };

  var app = document.getElementById('app');
  var navLinks = document.getElementById('navLinks');
  var navToggle = document.getElementById('navToggle');
  var favBadge = document.getElementById('favBadge');
  var toastStack = document.getElementById('toastStack');

  /* ------------------------------------------------------------------ *
   * 工具函数
   * ------------------------------------------------------------------ */
  function safeGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (err) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* 隐私模式或存储配额不足时静默降级 */
    }
  }

  /** 防 XSS：所有数据进入 innerHTML 前统一转义 */
  function esc(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function spiceLabel(spice) {
    if (!spice) return '🍃 不辣';
    var names = ['', '微辣', '小辣', '中辣', '重辣', '变态辣'];
    return '🌶'.repeat(spice) + ' ' + (names[spice] || '辣');
  }

  function starsText(rating) {
    var full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(Math.max(0, 5 - full));
  }

  function formatDate(ts) {
    var d = new Date(ts);
    var pad = function (n) {
      return n < 10 ? '0' + n : String(n);
    };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function favorited(id) {
    return state.favorites.indexOf(Number(id)) !== -1;
  }

  function toggleFavorite(id) {
    id = Number(id);
    var idx = state.favorites.indexOf(id);
    var dish = DATA.getDish(id);
    var name = dish ? dish.name : '这道菜';

    if (idx === -1) {
      state.favorites.push(id);
      toast('已收藏「' + name + '」', '❤️');
    } else {
      state.favorites.splice(idx, 1);
      toast('已取消收藏「' + name + '」', '🤍');
    }

    safeSet(KEY_FAV, state.favorites);
    syncFavoriteUI();

    // 在收藏页取消收藏时立即移除卡片，避免残留幽灵条目
    if (!favorited(id) && parseRoute().name === 'favorites') {
      render();
    }
  }

  /** 同步所有收藏按钮 / 角标 / 详情页按钮文案 */
  function syncFavoriteUI() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-fav]'), function (btn) {
      var id = Number(btn.getAttribute('data-fav'));
      var on = favorited(id);
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', String(on));

      if (btn.classList.contains('fav-btn')) {
        btn.textContent = on ? '♥' : '♡';
        btn.setAttribute('aria-label', (on ? '取消收藏 ' : '收藏 ') + (btn.getAttribute('data-name') || ''));
      } else if (btn.classList.contains('js-fav-cta')) {
        btn.textContent = on ? '♥ 已收藏' : '♡ 收藏这道菜';
      }
    });

    if (favBadge) {
      var count = state.favorites.length;
      favBadge.textContent = String(count);
      favBadge.hidden = count === 0;
    }
  }

  function toast(message, emoji) {
    if (!toastStack) return;
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span aria-hidden="true">' + (emoji || '✅') + '</span><span>' + esc(message) + '</span>';
    toastStack.appendChild(el);

    setTimeout(function () {
      el.classList.add('is-out');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 320);
    }, 2200);
  }

  /* ------------------------------------------------------------------ *
   * 主题
   * ------------------------------------------------------------------ */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0e0c0b' : '#e2542c');
  }

  function initTheme() {
    var saved = safeGet(KEY_THEME, null);
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
  }

  /* ------------------------------------------------------------------ *
   * 数据筛选 / 排序
   * ------------------------------------------------------------------ */
  function filterDishes(options) {
    options = options || {};
    var list = DISHES.slice();

    if (options.category && options.category !== 'all') {
      list = list.filter(function (d) {
        return d.category === options.category;
      });
    }

    if (options.query) {
      var q = options.query.trim().toLowerCase();
      list = list.filter(function (d) {
        var haystack = [d.name, d.tagline, d.description, d.category, d.servings]
          .concat(d.tags, d.ingredients)
          .join(' ')
          .toLowerCase();
        return haystack.indexOf(q) !== -1;
      });
    }

    var sort = options.sort || state.sort;
    list.sort(function (a, b) {
      switch (sort) {
        case 'time':
          return a.minutes - b.minutes;
        case 'difficulty':
          return DATA.DIFFICULTY_WEIGHT[a.difficulty] - DATA.DIFFICULTY_WEIGHT[b.difficulty] ||
            b.rating - a.rating;
        case 'popular':
          return b.reviews - a.reviews;
        default:
          return b.rating - a.rating || b.reviews - a.reviews;
      }
    });

    return list;
  }

  function categoryCount(id) {
    if (id === 'all') return DISHES.length;
    return DISHES.filter(function (d) {
      return d.category === id;
    }).length;
  }

  /* ------------------------------------------------------------------ *
   * 路由（hash）
   * ------------------------------------------------------------------ */
  function parseRoute() {
    var hash = window.location.hash.replace(/^#/, '');
    var parts = hash.split('/').filter(function (p) {
      return p.length > 0;
    });

    if (parts.length === 0) return { name: 'home' };

    switch (parts[0]) {
      case 'dishes':
        return { name: 'dishes', category: 'all' };
      case 'category':
        return { name: 'dishes', category: decodeURIComponent(parts[1] || 'all') };
      case 'search':
        return { name: 'search', query: decodeURIComponent(parts.slice(1).join('/') || '') };
      case 'dish':
        return { name: 'dish', id: Number(parts[1]) };
      case 'favorites':
        return { name: 'favorites' };
      case 'about':
        return { name: 'about' };
      default:
        return { name: 'notfound' };
    }
  }

  function updateNav(route) {
    var map = {
      home: 'home',
      dishes: 'dishes',
      search: 'dishes',
      dish: 'dishes',
      favorites: 'favorites',
      about: 'about'
    };
    var current = map[route.name] || '';

    Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (link) {
      link.classList.toggle('is-active', link.getAttribute('data-nav') === current);
    });
  }

  function render() {
    var route = parseRoute();
    var html = '';

    switch (route.name) {
      case 'home':
        html = viewHome();
        break;
      case 'dishes':
        state.category = route.category;
        html = viewList(route.category);
        break;
      case 'search':
        state.query = route.query;
        html = viewSearch(route.query);
        break;
      case 'dish':
        html = viewDetail(route.id);
        break;
      case 'favorites':
        html = viewFavorites();
        break;
      case 'about':
        html = viewAbout();
        break;
      default:
        html = viewNotFound();
    }

    app.innerHTML = html;

    updateNav(route);
    syncFavoriteUI();
    initReveal();
    closeMenu();

    if (route.name === 'dish') {
      state.detailStars = 5;
      paintStars(5);
    }

    window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------------ *
   * 通用组件
   * ------------------------------------------------------------------ */
  function dishCard(dish) {
    var on = favorited(dish.id);
    var hot = dish.rating >= 4.8;

    return '' +
      '<article class="dish-card reveal">' +
        '<div class="dish-art" style="background:linear-gradient(135deg,' + dish.gradient[0] + ',' + dish.gradient[1] + ')">' +
          '<span class="dish-emoji" aria-hidden="true">' + dish.emoji + '</span>' +
          '<div class="dish-badges">' +
            '<span class="badge">' + esc(dish.category) + '</span>' +
            (hot ? '<span class="badge">🔥 高分推荐</span>' : '') +
          '</div>' +
          '<button class="fav-btn' + (on ? ' is-on' : '') + '" type="button" data-fav="' + dish.id + '" ' +
            'data-name="' + esc(dish.name) + '" aria-pressed="' + on + '" ' +
            'aria-label="' + (on ? '取消收藏 ' : '收藏 ') + esc(dish.name) + '">' + (on ? '♥' : '♡') + '</button>' +
        '</div>' +
        '<div class="dish-body">' +
          '<div class="dish-meta-top">' +
            '<span class="dish-cat">' + esc(dish.category) + '</span>' +
            '<span>' + esc(dish.servings) + '</span>' +
          '</div>' +
          '<h3 class="dish-title"><a href="#/dish/' + dish.id + '">' + esc(dish.name) + '</a></h3>' +
          '<p class="dish-desc">' + esc(dish.tagline) + '</p>' +
          '<div class="dish-facts">' +
            '<span>⏱ ' + dish.minutes + ' 分钟</span>' +
            '<span>🎯 ' + esc(dish.difficulty) + '</span>' +
            '<span>' + spiceLabel(dish.spice) + '</span>' +
          '</div>' +
          '<div class="dish-foot">' +
            '<span class="rating-line"><span class="star" aria-hidden="true">★</span>' +
              dish.rating.toFixed(1) + ' <small>(' + dish.reviews + ')</small></span>' +
            '<a class="dish-link" href="#/dish/' + dish.id + '">查看做法 <span class="arrow" aria-hidden="true">→</span></a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function dishGrid(list) {
    return '<div class="dish-grid">' + list.map(dishCard).join('') + '</div>';
  }

  function chipRow(activeId) {
    return '<div class="chip-row" role="tablist" aria-label="按分类筛选">' +
      CATEGORIES.map(function (cat) {
        return '<a class="chip' + (cat.id === activeId ? ' is-active' : '') + '" role="tab" ' +
          'aria-selected="' + (cat.id === activeId) + '" ' +
          'href="' + (cat.id === 'all' ? '#/dishes' : '#/category/' + encodeURIComponent(cat.id)) + '">' +
          '<span aria-hidden="true">' + cat.emoji + '</span>' + esc(cat.name) +
          '<span class="count">' + categoryCount(cat.id) + '</span></a>';
      }).join('') +
    '</div>';
  }

  function sortSelect() {
    var options = [
      ['rating', '按评分排序'],
      ['popular', '按人气排序'],
      ['time', '按用时排序'],
      ['difficulty', '按难度排序']
    ];
    return '<label class="visually-hidden" for="sortSelect">排序方式</label>' +
      '<select class="select" id="sortSelect">' +
        options.map(function (opt) {
          return '<option value="' + opt[0] + '"' + (state.sort === opt[0] ? ' selected' : '') + '>' +
            opt[1] + '</option>';
        }).join('') +
      '</select>';
  }

  function emptyState(emoji, title, desc, actionHtml) {
    return '<div class="empty-state reveal">' +
      '<span class="empty-emoji" aria-hidden="true">' + emoji + '</span>' +
      '<h3>' + esc(title) + '</h3>' +
      '<p>' + esc(desc) + '</p>' +
      (actionHtml || '') +
    '</div>';
  }

  /* ------------------------------------------------------------------ *
   * 首页
   * ------------------------------------------------------------------ */
  function viewHome() {
    var featured = DISHES.slice()
      .sort(function (a, b) {
        return b.rating - a.rating || b.reviews - a.reviews;
      })
      .slice(0, 4);

    var avg = (DISHES.reduce(function (sum, d) {
      return sum + d.rating;
    }, 0) / DISHES.length).toFixed(1);

    return '' +
      '<section class="hero">' +
        '<div class="container hero-inner">' +
          '<div>' +
            '<span class="eyebrow"><b>NEW</b> 12 道经典菜谱 · 持续更新</span>' +
            '<h1>把每一餐，<br>做成<span class="grad">值得期待</span>的事</h1>' +
            '<p class="hero-lead">从川渝的麻辣到潮汕的清鲜，每道菜都有清楚的食材清单、分步做法和小贴士——照着做，厨房新手也能端出好味道。</p>' +
            '<form class="hero-search" id="heroSearchForm" role="search">' +
              '<span class="search-icon" aria-hidden="true">🔍</span>' +
              '<label class="visually-hidden" for="heroSearchInput">搜索菜名、食材或菜系</label>' +
              '<input id="heroSearchInput" type="search" placeholder="搜菜名、食材或菜系，比如「虾饺」「番茄」" autocomplete="off">' +
              '<button class="btn btn-primary" type="submit">开始搜索</button>' +
            '</form>' +
            '<div class="hero-stats">' +
              '<div class="hero-stat"><strong>' + DISHES.length + '</strong><span>道精选菜谱</span></div>' +
              '<div class="hero-stat"><strong>' + (CATEGORIES.length - 1) + '</strong><span>个菜系分类</span></div>' +
              '<div class="hero-stat"><strong>' + avg + '</strong><span>平均评分</span></div>' +
              '<div class="hero-stat"><strong>100%</strong><span>离线可用</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="hero-art" aria-hidden="true">' +
            '<div class="hero-plate">🍜</div>' +
            '<div class="hero-chip hero-chip--a">⭐ 4.9<span>抹茶千层蛋糕</span></div>' +
            '<div class="hero-chip hero-chip--b">⏱ 25 分钟<span>陈麻婆豆腐</span></div>' +
            '<div class="hero-chip hero-chip--c">🌶️ 变态辣<span>四川麻辣火锅</span></div>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section">' +
        '<div class="container">' +
          '<div class="section-head">' +
            '<div>' +
              '<span class="section-kicker">Explore</span>' +
              '<h2>按菜系逛逛</h2>' +
              '<p>八大菜系与异国风味，总有一道对今天的胃口</p>' +
            '</div>' +
            '<a class="btn btn-ghost" href="#/dishes">查看全部菜谱 <span aria-hidden="true">→</span></a>' +
          '</div>' +
          '<div class="cat-grid">' +
            CATEGORIES.filter(function (c) {
              return c.id !== 'all';
            }).map(function (cat) {
              return '<a class="cat-tile reveal" href="#/category/' + encodeURIComponent(cat.id) + '">' +
                '<span class="cat-emoji" aria-hidden="true">' + cat.emoji + '</span>' +
                '<span class="cat-name">' + esc(cat.name) + '</span>' +
                '<span class="cat-desc">' + esc(cat.desc) + '</span>' +
                '<span class="cat-count">' + categoryCount(cat.id) + ' 道</span>' +
              '</a>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section">' +
        '<div class="container">' +
          '<div class="section-head">' +
            '<div>' +
              '<span class="section-kicker">This Week</span>' +
              '<h2>本周热门推荐</h2>' +
              '<p>根据评分与收藏热度挑选，做一次就上手</p>' +
            '</div>' +
          '</div>' +
          dishGrid(featured) +
        '</div>' +
      '</section>' +

      '<section class="section">' +
        '<div class="container">' +
          '<div class="cta-band">' +
            '<div>' +
              '<h2>收藏喜欢的菜，下次做得更快</h2>' +
              '<p>收藏与评分都保存在本地浏览器，不需要账号，也不会联网上传。</p>' +
            '</div>' +
            '<a class="btn btn-light" href="#/favorites">打开我的收藏 <span aria-hidden="true">→</span></a>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  /* ------------------------------------------------------------------ *
   * 分类 / 全部菜谱
   * ------------------------------------------------------------------ */
  function viewList(categoryId) {
    var cat = DATA.getCategory(categoryId) || DATA.getCategory('all');
    var list = filterDishes({ category: cat.id });
    var isAll = cat.id === 'all';

    return '' +
      '<div class="container">' +
        '<header class="page-head">' +
          '<nav class="crumbs" aria-label="面包屑">' +
            '<a href="#/">首页</a><span class="sep">/</span>' +
            (isAll ? '<span>全部菜谱</span>' :
              '<a href="#/dishes">全部菜谱</a><span class="sep">/</span><span>' + esc(cat.name) + '</span>') +
          '</nav>' +
          '<h1>' + (isAll ? '全部菜谱' : cat.emoji + ' ' + esc(cat.name)) + '</h1>' +
          '<p>' + esc(cat.desc) + ' · 共 ' + list.length + ' 道</p>' +
        '</header>' +
        chipRow(cat.id) +
        '<div class="toolbar">' +
          '<span class="result-count">找到 <b>' + list.length + '</b> 道菜谱</span>' +
          '<div class="toolbar-right">' + sortSelect() + '</div>' +
        '</div>' +
        (list.length
          ? dishGrid(list)
          : emptyState('🍽️', '这个分类还没有菜谱', '换个分类看看，或者回到全部菜谱浏览。',
              '<a class="btn btn-primary" href="#/dishes">浏览全部菜谱</a>')) +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * 搜索结果
   * ------------------------------------------------------------------ */
  function viewSearch(query) {
    var q = (query || '').trim();
    var list = q ? filterDishes({ query: q }) : [];

    return '' +
      '<div class="container">' +
        '<header class="page-head">' +
          '<nav class="crumbs" aria-label="面包屑">' +
            '<a href="#/">首页</a><span class="sep">/</span><span>搜索结果</span>' +
          '</nav>' +
          '<h1>搜索「' + esc(q) + '」</h1>' +
          '<p>' + (q ? '匹配菜名、食材、菜系与标签 · 共 ' + list.length + ' 条结果' : '请输入关键词后回车') + '</p>' +
        '</header>' +
        '<div class="toolbar">' +
          '<span class="result-count">匹配到 <b>' + list.length + '</b> 道菜谱</span>' +
          '<div class="toolbar-right">' + sortSelect() + '</div>' +
        '</div>' +
        (list.length
          ? dishGrid(list)
          : emptyState('🔍', '没有找到相关菜谱', '试试更短的关键词，比如「辣」「虾」「面」，或从分类中浏览。',
              '<a class="btn btn-primary" href="#/dishes">浏览全部菜谱</a>')) +
      '</div>';
  }

  function viewFavorites() {
    var list = state.favorites
      .map(function (id) {
        return DATA.getDish(id);
      })
      .filter(Boolean);

    return '' +
      '<div class="container">' +
        '<header class="page-head">' +
          '<nav class="crumbs" aria-label="面包屑">' +
            '<a href="#/">首页</a><span class="sep">/</span><span>我的收藏</span>' +
          '</nav>' +
          '<h1>♥ 我的收藏</h1>' +
          '<p>已收藏 ' + list.length + ' 道菜谱 · 数据保存在本机浏览器</p>' +
        '</header>' +
        (list.length
          ? dishGrid(list)
          : emptyState('🤍', '还没有收藏任何菜谱',
              '在菜谱卡片右上角点一下爱心，就能把喜欢的菜收进这里。',
              '<a class="btn btn-primary" href="#/dishes">去挑几道菜</a>')) +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * 关于
   * ------------------------------------------------------------------ */
  function viewAbout() {
    return '' +
      '<div class="container">' +
        '<header class="page-head">' +
          '<nav class="crumbs" aria-label="面包屑">' +
            '<a href="#/">首页</a><span class="sep">/</span><span>关于我们</span>' +
          '</nav>' +
          '<h1>关于美食之旅</h1>' +
          '<p>一个不依赖后端、打开就能用的家常菜谱手册</p>' +
        '</header>' +

        '<section class="panel reveal">' +
          '<h2>我们相信的事</h2>' +
          '<p class="panel-sub">好好吃饭，是最日常也最踏实的幸福。</p>' +
          '<p>美食之旅最初只是一份个人收藏的家常菜清单。写着写着，发现不少菜谱网站广告太多、步骤含糊，' +
          '于是我们把它做成了一个干净的小站——每道菜只保留必要的信息：食材、分量、步骤、时间和小贴士，' +
          '其余的留给你的厨房。</p>' +
        '</section>' +

        '<section class="section">' +
          '<div class="section-head">' +
            '<div>' +
              '<span class="section-kicker">Features</span>' +
              '<h2>已经具备的能力</h2>' +
            '</div>' +
          '</div>' +
          '<div class="dish-grid">' +
            feature('🧭', '分类与筛选', '10 个菜系分类，支持按评分、人气、用时、难度排序。') +
            feature('🔍', '全文搜索', '菜名、描述、食材、标签都能搜到，输入即时出结果。') +
            feature('♥', '本地收藏', '收藏与评分写入 localStorage，刷新不丢，无需注册。') +
            feature('🌗', '明暗主题', '跟随系统偏好，也可手动切换，夜间看菜谱不刺眼。') +
            feature('📱', '响应式布局', '从手机到宽屏都做了断点适配，边做边看刚刚好。') +
            feature('⚡', '零依赖离线', '纯 HTML/CSS/JS，无框架无外链，双击 index.html 即可使用。') +
          '</div>' +
        '</section>' +

        '<section class="panel reveal">' +
          '<h2>技术说明</h2>' +
          '<p class="panel-sub">给想继续折腾的你</p>' +
          '<ul class="ingredient-list">' +
            '<li><span>📄 结构：index.html + css/styles.css + js/data.js + js/app.js</span></li>' +
            '<li><span>🧩 路由：基于 location.hash 的轻量路由（#/dishes、#/dish/1 …）</span></li>' +
            '<li><span>🎨 样式：CSS 自定义属性驱动的设计令牌，明暗两套配色</span></li>' +
            '<li><span>💾 存储：localStorage（foodie:favorites / foodie:reviews / foodie:theme）</span></li>' +
          '</ul>' +
        '</section>' +

        '<section class="section">' +
          '<div class="cta-band">' +
            '<div>' +
              '<h2>开始你的第一道菜</h2>' +
              '<p>从 25 分钟的陈麻婆豆腐开始，比等外卖还快一点。</p>' +
            '</div>' +
            '<a class="btn btn-light" href="#/dish/7">看麻婆豆腐做法 <span aria-hidden="true">→</span></a>' +
          '</div>' +
        '</section>' +
      '</div>';
  }

  function feature(emoji, title, desc) {
    return '<div class="panel reveal">' +
      '<div class="cat-emoji" aria-hidden="true">' + emoji + '</div>' +
      '<h3 class="dish-title">' + esc(title) + '</h3>' +
      '<p class="dish-desc">' + esc(desc) + '</p>' +
    '</div>';
  }

  function viewNotFound() {
    return '<div class="container">' +
      '<div class="section">' +
        emptyState('🍳', '这一页被端走了', '链接可能已经失效，回到首页重新找找看。',
          '<a class="btn btn-primary" href="#/">返回首页</a>') +
      '</div>' +
    '</div>';
  }

  /* ------------------------------------------------------------------ *
   * 详情页
   * ------------------------------------------------------------------ */
  function viewDetail(id) {
    var dish = DATA.getDish(id);

    if (!dish) {
      return '<div class="container"><div class="section">' +
        emptyState('🥢', '没有这道菜', '菜谱编号 ' + esc(id) + ' 不存在，可能已经下架。',
          '<a class="btn btn-primary" href="#/dishes">看看别的菜</a>') +
      '</div></div>';
    }

    var on = favorited(dish.id);

    return '' +
      '<div class="container">' +
        '<nav class="crumbs" aria-label="面包屑">' +
          '<a href="#/">首页</a><span class="sep">/</span>' +
          '<a href="#/category/' + encodeURIComponent(dish.category) + '">' + esc(dish.category) + '</a>' +
          '<span class="sep">/</span><span>' + esc(dish.name) + '</span>' +
        '</nav>' +

        '<header class="detail-hero" style="--g1:' + dish.gradient[0] + ';--g2:' + dish.gradient[1] + '">' +
          '<div class="detail-emoji" aria-hidden="true">' + dish.emoji + '</div>' +
          '<h1>' + esc(dish.name) + '</h1>' +
          '<p class="detail-tagline">' + esc(dish.tagline) + '</p>' +
          '<div class="pill-row">' +
            '<span class="pill">⭐ ' + dish.rating.toFixed(1) + ' · ' + dish.reviews + ' 人做过</span>' +
            '<span class="pill">⏱ ' + dish.minutes + ' 分钟</span>' +
            '<span class="pill">🎯 ' + esc(dish.difficulty) + '</span>' +
            '<span class="pill">🍽 ' + esc(dish.servings) + '</span>' +
            '<span class="pill">' + spiceLabel(dish.spice) + '</span>' +
          '</div>' +
        '</header>' +

        '<div class="detail-layout">' +
          '<div>' +
            '<section class="panel reveal">' +
              '<div class="panel-head">' +
                '<h2>食材清单</h2>' +
                '<span class="dish-cat">' + dish.ingredients.length + ' 项</span>' +
              '</div>' +
              '<p class="panel-sub">勾选已经备好的食材，边买边核对。</p>' +
              '<ul class="ingredient-list">' +
                dish.ingredients.map(function (item, i) {
                  return '<li><input type="checkbox" id="ing-' + i + '"><label for="ing-' + i + '">' +
                    esc(item) + '</label></li>';
                }).join('') +
              '</ul>' +
            '</section>' +

            '<section class="panel reveal">' +
              '<h2>制作步骤</h2>' +
              '<p class="panel-sub">共 ' + dish.steps.length + ' 步，按顺序来不容易乱。</p>' +
              '<ol class="step-list">' +
                dish.steps.map(function (step) {
                  return '<li><span>' + esc(step) + '</span></li>';
                }).join('') +
              '</ol>' +
              '<div class="tip-card"><span aria-hidden="true">💡</span><div><b>小贴士</b><br>' +
                esc(dish.tip) + '</div></div>' +
            '</section>' +
          '</div>' +
          '<aside>' +
            '<section class="panel reveal">' +
              '<h2>菜品信息</h2>' +
              '<ul class="meta-list">' +
                '<li><span class="label">菜系</span><span class="value">' + esc(dish.category) + '</span></li>' +
                '<li><span class="label">难度</span><span class="value">' + esc(dish.difficulty) + '</span></li>' +
                '<li><span class="label">用时</span><span class="value">' + dish.minutes + ' 分钟</span></li>' +
                '<li><span class="label">份量</span><span class="value">' + esc(dish.servings) + '</span></li>' +
                '<li><span class="label">辣度</span><span class="value spice-scale">' + spiceLabel(dish.spice) + '</span></li>' +
                '<li><span class="label">标签</span><span class="value">' + esc(dish.tags.join(' · ')) + '</span></li>' +
              '</ul>' +
              '<button class="btn btn-primary js-fav-cta' + (on ? ' is-on' : '') + '" type="button" ' +
                'data-fav="' + dish.id + '" data-name="' + esc(dish.name) + '" aria-pressed="' + on + '" ' +
                'style="width:100%;margin-top:1rem">' + (on ? '♥ 已收藏' : '♡ 收藏这道菜') + '</button>' +
            '</section>' +
            reviewPanel(dish.id) +
          '</aside>' +
        '</div>' +
        relatedSection(dish) +
      '</div>';
  }

  /** 相关推荐：同菜系优先，不足则按评分补齐 */
  function relatedSection(dish) {
    var related = DISHES.filter(function (d) {
      return d.category === dish.category && d.id !== dish.id;
    });

    if (related.length < 3) {
      var extra = DISHES.filter(function (d) {
        return d.id !== dish.id && related.indexOf(d) === -1;
      }).sort(function (a, b) {
        return b.rating - a.rating;
      });
      related = related.concat(extra);
    }

    related = related.slice(0, 3);

    return '<section class="section">' +
      '<div class="section-head">' +
        '<div>' +
          '<span class="section-kicker">More</span>' +
          '<h2>你可能也喜欢</h2>' +
        '</div>' +
        '<a class="btn btn-ghost" href="#/dishes">全部菜谱 <span aria-hidden="true">→</span></a>' +
      '</div>' +
      dishGrid(related) +
    '</section>';
  }

  function reviewPanel(dishId) {
    var starButtons = [1, 2, 3, 4, 5].map(function (n) {
      return '<button type="button" data-star="' + n + '" aria-label="' + n + ' 星" ' +
        'aria-checked="' + (n === 5) + '" role="radio">★</button>';
    }).join('');

    return '<section class="panel reveal">' +
      '<h2>评价这道菜</h2>' +
      '<p class="panel-sub">评分与评论只保存在你的浏览器里。</p>' +
      '<form id="ratingForm" data-dish="' + dishId + '">' +
        '<div class="field">' +
          '<label>你的评分</label>' +
          '<div class="star-input" id="starInput" role="radiogroup" aria-label="评分">' + starButtons + '</div>' +
        '</div>' +
        '<div class="field">' +
          '<label for="comment">想说的话</label>' +
          '<textarea class="textarea" id="comment" maxlength="120" placeholder="比如：油温再低一点更好操作…"></textarea>' +
        '</div>' +
        '<button class="btn btn-primary" type="submit" style="width:100%">提交评价</button>' +
      '</form>' +
      '<div class="review-list" id="reviewList">' + reviewListHtml(dishId) + '</div>' +
    '</section>';
  }

  /** 渲染某道菜的历史评价 */
  function reviewListHtml(dishId) {
    var list = state.reviews[dishId] || [];
    if (!list.length) return '';

    return list.slice().reverse().map(function (item) {
      return '<div class="review-item">' +
        '<div class="review-head">' +
          '<span class="review-stars">' + '★'.repeat(item.stars) +
            '<span style="opacity:.3">' + '★'.repeat(5 - item.stars) + '</span></span>' +
          '<span>' + esc(formatDate(item.at)) + '</span>' +
        '</div>' +
        '<div>' + (esc(item.comment) || '<span style="color:var(--muted)">（只打了分，没有留言）</span>') + '</div>' +
      '</div>';
    }).join('');
  }


  /* ------------------------------------------------------------------ *
   * 交互：评分星、菜单、搜索
   * ------------------------------------------------------------------ */
  function paintStars(value) {
    Array.prototype.forEach.call(document.querySelectorAll('#starInput button'), function (btn) {
      var n = Number(btn.getAttribute('data-star'));
      btn.classList.toggle('is-on', n <= value);
      btn.setAttribute('aria-checked', String(n === value));
    });
  }

  function closeMenu() {
    if (navLinks) navLinks.classList.remove('is-open');
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', '打开菜单');
      navToggle.textContent = '☰';
    }
  }

  function toggleMenu() {
    if (!navLinks || !navToggle) return;
    var open = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    navToggle.textContent = open ? '✕' : '☰';
  }

  function goSearch(query) {
    var q = (query || '').trim();
    var hash = q ? '#/search/' + encodeURIComponent(q) : '#/dishes';
    if (window.location.hash === hash) {
      render();
    } else {
      window.location.hash = hash;
    }
  }

  function submitReview(form) {
    var dishId = Number(form.getAttribute('data-dish'));
    var commentEl = form.querySelector('#comment');
    var comment = commentEl ? commentEl.value.trim() : '';
    var stars = state.detailStars || 5;

    if (!state.reviews[dishId]) state.reviews[dishId] = [];
    state.reviews[dishId].push({ stars: stars, comment: comment, at: Date.now() });
    safeSet(KEY_REVIEWS, state.reviews);

    form.reset();
    state.detailStars = 5;
    paintStars(5);

    var box = document.getElementById('reviewList');
    if (box) box.innerHTML = reviewListHtml(dishId);

    toast('已提交 ' + stars + ' 星评价，谢谢分享！', '⭐');
  }

  function initReveal() {
    var items = document.querySelectorAll('.reveal');

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    if (!initReveal.observer) {
      initReveal.observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            initReveal.observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    }

    Array.prototype.forEach.call(items, function (el, i) {
      el.style.transitionDelay = Math.min(i % 8, 6) * 40 + 'ms';
      initReveal.observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------ *
   * 事件绑定
   * ------------------------------------------------------------------ */
  function bindEvents() {
    // 收藏 / 评分星：事件委托
    document.addEventListener('click', function (e) {
      var favBtn = e.target.closest ? e.target.closest('[data-fav]') : null;
      if (favBtn) {
        e.preventDefault();
        toggleFavorite(favBtn.getAttribute('data-fav'));
        return;
      }

      var starBtn = e.target.closest ? e.target.closest('[data-star]') : null;
      if (starBtn) {
        state.detailStars = Number(starBtn.getAttribute('data-star'));
        paintStars(state.detailStars);
      }
    });

    // 评价表单 / 首屏搜索表单（统一的 submit 委托）
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (!form) return;

      if (form.id === 'ratingForm') {
        e.preventDefault();
        submitReview(form);
      } else if (form.id === 'heroSearchForm') {
        e.preventDefault();
        var heroInput = document.getElementById('heroSearchInput');
        goSearch(heroInput ? heroInput.value : '');
      }
    });

    // 排序
    document.addEventListener('change', function (e) {
      if (e.target && e.target.id === 'sortSelect') {
        state.sort = e.target.value;
        safeSet(KEY_SORT, state.sort);
        render();
      }
    });

    // 顶部搜索
    var navSearchForm = document.getElementById('navSearchForm');
    if (navSearchForm) {
      navSearchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = document.getElementById('navSearchInput');
        goSearch(input ? input.value : '');
      });
    }

    // 主题切换
    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        safeSet(KEY_THEME, next);
        toast(next === 'dark' ? '已切换到夜间模式' : '已切换到日间模式', next === 'dark' ? '🌙' : '☀️');
      });
    }

    // 移动端菜单
    if (navToggle) navToggle.addEventListener('click', toggleMenu);

    // 路由变化
    window.addEventListener('hashchange', render);

    // 滚动阴影
    window.addEventListener('scroll', function () {
      var header = document.getElementById('siteHeader');
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
    }, { passive: true });

    // 快捷键：/ 或 Ctrl/Cmd + K 聚焦搜索
    document.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName) || '';
      var typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === 'Escape') {
        closeMenu();
        if (typing && e.target.blur) e.target.blur();
        return;
      }

      var isSlash = e.key === '/' && !typing;
      var isCmdK = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey);
      if (!isSlash && !isCmdK) return;

      e.preventDefault();
      var navInput = document.getElementById('navSearchInput');
      var heroInput = document.getElementById('heroSearchInput');
      var target = navInput && navInput.offsetParent !== null ? navInput : heroInput;
      if (target) target.focus();
    });
  }

  /* ------------------------------------------------------------------ *
   * 启动
   * ------------------------------------------------------------------ */
  function init() {
    initTheme();
    bindEvents();

    var year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());

    render();
    syncFavoriteUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }








})();
