// Resource loader with sprite recoloring support for purple Mario
(function() {
    var resourceCache = {};
    var loading = [];
    var readyCallbacks = [];

    // Mario's classic NES red -> purple #7f6ad6
    // We detect pixels that are "red" (R dominant) and replace with purple
    function recolorMario(img) {
        var offscreen = document.createElement('canvas');
        offscreen.width = img.width;
        offscreen.height = img.height;
        var octx = offscreen.getContext('2d');
        octx.drawImage(img, 0, 0);

        var imageData = octx.getImageData(0, 0, offscreen.width, offscreen.height);
        var data = imageData.data;

        for (var i = 0; i < data.length; i += 4) {
            var r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
            if (a < 10) continue; // skip transparent

            // Detect NES Mario red: high red, low green and blue
            // Classic values are around R:181 G:49 B:32 (hat/shirt red)
            if (r > 120 && r > g * 1.8 && r > b * 1.8 && g < 100 && b < 100) {
                // Map brightness of original red to purple #7f6ad6
                var brightness = r / 200;
                data[i]   = Math.min(255, Math.round(127 * brightness * 1.2)); // R
                data[i+1] = Math.min(255, Math.round(106 * brightness * 1.2)); // G
                data[i+2] = Math.min(255, Math.round(214 * brightness * 1.2)); // B
            }
        }

        octx.putImageData(imageData, 0, 0);
        return offscreen;
    }

    function load(urlOrArr) {
        if(urlOrArr instanceof Array) {
            urlOrArr.forEach(function(url) { _load(url); });
        } else {
            _load(urlOrArr);
        }
    }

    function _load(url) {
        if(resourceCache[url]) {
            return resourceCache[url];
        }
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            // Recolor player sprites for purple Mario
            if (url.indexOf('player') !== -1) {
                resourceCache[url] = recolorMario(img);
            } else {
                resourceCache[url] = img;
            }
            if(isReady()) {
                readyCallbacks.forEach(function(func) { func(); });
            }
        };
        resourceCache[url] = false;
        img.src = url;
    }

    function get(url) {
        return resourceCache[url];
    }

    function isReady() {
        var ready = true;
        for(var k in resourceCache) {
            if(resourceCache.hasOwnProperty(k) && !resourceCache[k]) {
                ready = false;
            }
        }
        return ready;
    }

    function onReady(func) {
        readyCallbacks.push(func);
    }

    window.resources = {
        load: load,
        get: get,
        onReady: onReady,
        isReady: isReady
    };
})();
