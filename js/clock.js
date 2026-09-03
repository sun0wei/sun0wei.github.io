/* Electric clock with a non-blocking, single-attempt weather enhancement. */
(function () {
  var box = document.getElementById('hexo_electric_clock');
  if (!box) return;

  if (window.__hexoElectricClockTimer) {
    clearInterval(window.__hexoElectricClockTimer);
  }

  box.innerHTML = '' +
    '<div class="clock-row">' +
      '<span id="card-clock-clockdate" class="card-clock-clockdate"></span>' +
      '<span id="card-clock-weather" class="card-clock-weather"><i id="card-clock-weather-icon" class="qi-unknown-fill"></i> 天气获取中</span>' +
      '<span id="card-clock-humidity" class="card-clock-humidity"></span>' +
    '</div>' +
    '<div class="clock-row"><span id="card-clock-time" class="card-clock-time"></span></div>' +
    '<div class="clock-row">' +
      '<span id="card-clock-windDir" class="card-clock-windDir"><i class="qi-gale"></i></span>' +
      '<span id="card-clock-location" class="card-clock-location">本地时间</span>' +
      '<span id="card-clock-dackorlight" class="card-clock-dackorlight"></span>' +
    '</div>';

  var week = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  function pad(value, length) {
    return ('0000' + value).slice(-length);
  }
  function updateTime() {
    var now = new Date();
    var hour = now.getHours();
    var displayHour = hour > 12 ? hour - 12 : hour;
    var time = document.getElementById('card-clock-time');
    var date = document.getElementById('card-clock-clockdate');
    var ampm = document.getElementById('card-clock-dackorlight');
    if (time) time.textContent = pad(hour, 2) + ':' + pad(now.getMinutes(), 2) + ':' + pad(now.getSeconds(), 2);
    if (date) date.textContent = pad(now.getFullYear(), 4) + '-' + pad(now.getMonth() + 1, 2) + '-' + pad(now.getDate(), 2) + ' ' + week[now.getDay()];
    if (ampm) ampm.textContent = (displayHour || 12) + (hour >= 12 ? ' P M' : ' A M');
  }
  updateTime();
  window.__hexoElectricClockTimer = setInterval(updateTime, 1000);

  var weatherHost = typeof qweather_api_host !== 'undefined' ? qweather_api_host : '';
  var weatherKey = typeof qweather_key !== 'undefined' ? qweather_key : '';
  var ipApiKey = typeof ip_api_key !== 'undefined' ? ip_api_key : '';
  var rectangle = typeof clock_rectangle !== 'undefined' ? clock_rectangle : '';
  var fixedLocation = typeof clock_default_rectangle_enable !== 'undefined' && clock_default_rectangle_enable === 'true';
  var defaultCity = '赣州市';
  var timeoutMs = 4000;

  function fetchJson(url) {
    var controller = window.AbortController ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, timeoutMs) : null;
    return fetch(url, controller ? { signal: controller.signal } : undefined)
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .finally(function () {
        if (timer) clearTimeout(timer);
      });
  }

  function weatherIconColor(icon) {
    var colors = {
      '100': '#fdcc45',
      '101': '#fe6976',
      '102': '#fe7f5b',
      '103': '#fe7f5b',
      '104': '#2152d1',
      '150': '#2152d1',
      '151': '#2152d1',
      '152': '#2152d1',
      '153': '#2152d1',
      '800': '#2152d1',
      '801': '#2152d1',
      '802': '#2152d1',
      '803': '#2152d1',
      '804': '#2152d1',
      '805': '#2152d1',
      '806': '#2152d1',
      '807': '#2152d1',
      '300': '#49b1f5',
      '301': '#49b1f5',
      '305': '#49b1f5',
      '306': '#49b1f5',
      '307': '#49b1f5',
      '308': '#49b1f5',
      '309': '#49b1f5',
      '310': '#49b1f5',
      '311': '#49b1f5',
      '312': '#49b1f5',
      '313': '#49b1f5',
      '314': '#49b1f5',
      '315': '#49b1f5',
      '316': '#49b1f5',
      '317': '#49b1f5',
      '318': '#49b1f5',
      '350': '#49b1f5',
      '351': '#49b1f5',
      '399': '#49b1f5',
      '302': '#fdcc46',
      '303': '#fdcc46',
      '304': '#fdcc46',
      '400': '#a3c2dc',
      '401': '#a3c2dc',
      '402': '#a3c2dc',
      '403': '#a3c2dc',
      '404': '#a3c2dc',
      '405': '#a3c2dc',
      '406': '#a3c2dc',
      '407': '#a3c2dc',
      '408': '#a3c2dc',
      '409': '#a3c2dc',
      '410': '#a3c2dc',
      '456': '#a3c2dc',
      '457': '#a3c2dc',
      '499': '#a3c2dc',
      '500': '#97acba',
      '501': '#97acba',
      '502': '#97acba',
      '503': '#97acba',
      '504': '#97acba',
      '507': '#97acba',
      '508': '#97acba',
      '509': '#97acba',
      '510': '#97acba',
      '511': '#97acba',
      '512': '#97acba',
      '513': '#97acba',
      '514': '#97acba',
      '515': '#97acba',
      '900': 'red',
      '999': 'red',
      '901': '#179fff'
    };
    return colors[String(icon)] || '#000';
  }

  function showWeather(info, city) {
    var weather = document.getElementById('card-clock-weather');
    var weatherIcon = document.getElementById('card-clock-weather-icon');
    var humidity = document.getElementById('card-clock-humidity');
    var location = document.getElementById('card-clock-location');
    var wind = document.getElementById('card-clock-windDir');
    if (!weather || !info || !info.now) return;
    if (weatherIcon) {
      var icon = info.now.icon || '999';
      weatherIcon.className = 'qi-' + icon + '-fill';
      weatherIcon.style.color = weatherIconColor(icon);
    }
    weather.textContent = '';
    if (weatherIcon) weather.appendChild(weatherIcon);
    weather.appendChild(document.createTextNode(' ' + (info.now.text || '天气未知') + ' ' + (info.now.temp || '--') + ' ℃'));
    if (humidity) humidity.textContent = '💧 ' + (info.now.humidity || '--') + '%';
    if (location) location.textContent = city || defaultCity;
    if (wind) {
      var windIcon = wind.querySelector('i');
      wind.textContent = '';
      if (windIcon) wind.appendChild(windIcon);
      wind.appendChild(document.createTextNode(' ' + (info.now.windDir || '')));
    }
  }

  function loadWeather() {
    if (!weatherHost || !weatherKey || !rectangle) return;
    var location = rectangle;
    var city = defaultCity;
    var ipUrl = ipApiKey ? 'https://api.nsmao.net/api/ipip/query?key=' + encodeURIComponent(ipApiKey) : '';
    var locate = fixedLocation || !ipUrl
      ? Promise.resolve()
      : fetchJson(ipUrl).then(function (data) {
          if (data && data.code === 200 && data.data) {
            city = data.data.city || city;
            if (data.data.lng && data.data.lat) location = data.data.lng + ',' + data.data.lat;
          } else {
            throw new Error('IP location response invalid');
          }
        }).catch(function (error) {
          // IP 服务不可用时继续使用配置中的默认坐标获取天气。
          if (window.console && console.warn) console.warn('[electric-clock] IP location unavailable, using default location:', error.message || error);
        });
    locate.then(function () {
      return fetchJson('https://' + weatherHost + '/v7/weather/now?location=' + encodeURIComponent(location) + '&key=' + encodeURIComponent(weatherKey));
    }).then(function (data) {
      if (data && data.code === '200') showWeather(data, city);
      else throw new Error('weather response invalid');
    }).catch(function (error) {
      /* The local clock is already running; network enhancement may fail silently. */
      var weather = document.getElementById('card-clock-weather');
      if (weather) weather.textContent = '天气不可用';
      if (window.console && console.warn) console.warn('[electric-clock] weather unavailable:', error.message || error);
    });
  }

  loadWeather();
})();
