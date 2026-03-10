(function() {
    var pressedKeys = {};

    function setKey(event, status) {
        var code = event.keyCode;
        var key;

        switch(code) {
        case 32:
            key = 'SPACE'; break;
        case 37:
            key = 'LEFT'; break;
        case 38:
            key = 'JUMP'; break;
        case 39:
            key = 'RIGHT'; break;
        case 40:
            key = 'DOWN'; break;
        case 88:
            key = 'JUMP'; break;
        case 90:
            key = 'RUN'; break;
        default:
            key = String.fromCharCode(code);
        }

        pressedKeys[key] = status;
    }

    document.addEventListener('keydown', function(e) {
        setKey(e, true);
    });

    document.addEventListener('keyup', function(e) {
        setKey(e, false);
    });

    window.addEventListener('blur', function() {
        pressedKeys = {};
    });

    window.input = {
        isDown: function(key) {
            return pressedKeys[key.toUpperCase()];
        },
        reset: function() {
          pressedKeys['RUN'] = false;
          pressedKeys['LEFT'] = false;
          pressedKeys['RIGHT'] = false;
          pressedKeys['DOWN'] = false;
          pressedKeys['JUMP'] = false;
        }
    };

    // Mobile touch controls (does not affect keyboard/mouse on desktop)
    // - Short tap anywhere  → jump
    // - Long press left half → move left (held until finger lifts)
    // - Long press right half → move right (held until finger lifts)
    if ('ontouchstart' in window) {
        var LONG_PRESS_MS = 200;
        var touchStates = {};

        document.addEventListener('touchstart', function(e) {
            e.preventDefault();
            for (var i = 0; i < e.changedTouches.length; i++) {
                (function(touch) {
                    var side = touch.clientX < window.innerWidth / 2 ? 'LEFT' : 'RIGHT';
                    var state = { side: side, isLong: false };
                    state.timer = setTimeout(function() {
                        state.isLong = true;
                        pressedKeys[side] = true;
                    }, LONG_PRESS_MS);
                    touchStates[touch.identifier] = state;
                })(e.changedTouches[i]);
            }
        }, { passive: false });

        function endTouch(touch) {
            var state = touchStates[touch.identifier];
            if (!state) return;
            clearTimeout(state.timer);
            if (!state.isLong) {
                pressedKeys['JUMP'] = true;
                setTimeout(function() { pressedKeys['JUMP'] = false; }, 150);
            } else {
                pressedKeys[state.side] = false;
            }
            delete touchStates[touch.identifier];
        }

        document.addEventListener('touchend', function(e) {
            e.preventDefault();
            for (var i = 0; i < e.changedTouches.length; i++) endTouch(e.changedTouches[i]);
        }, { passive: false });

        document.addEventListener('touchcancel', function(e) {
            for (var i = 0; i < e.changedTouches.length; i++) endTouch(e.changedTouches[i]);
        }, { passive: false });
    }
})();
