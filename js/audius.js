// Audius background music player
// Searches for mario/nintendo/SNES/NES tracks and plays them randomly
(function() {
    var AUDIUS_API = 'https://api.audius.co/v1';
    var APP_NAME = 'mario-audius-game';

    var playlist = [];
    var currentIndex = 0;
    var audioEl = null;
    var paused = false;

    var QUERIES = ['mario nintendo', 'SNES mario', 'NES mario', 'super mario', 'mario game'];
    var queryIndex = 0;
    var allTracks = [];

    function shuffleArray(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return arr;
    }

    function getStreamUrl(trackId) {
        return AUDIUS_API + '/tracks/' + trackId + '/stream?app_name=' + APP_NAME;
    }

    function playNext() {
        if (playlist.length === 0) return;
        if (currentIndex >= playlist.length) {
            // Re-shuffle and loop
            shuffleArray(playlist);
            currentIndex = 0;
        }
        var track = playlist[currentIndex++];
        console.log('[Audius] Now playing:', track.title, 'by', track.user && track.user.name);
        updateNowPlaying(track);

        if (!audioEl) {
            audioEl = new Audio();
            audioEl.volume = 0.5;
        }
        audioEl.src = getStreamUrl(track.id);
        audioEl.onended = function() { playNext(); };
        audioEl.onerror = function() {
            console.warn('[Audius] Stream error, skipping:', track.title);
            playNext();
        };
        audioEl.play().catch(function(e) {
            console.warn('[Audius] Playback blocked, will retry on interaction:', e.message);
            // Auto-start on first user interaction
            var resume = function() {
                audioEl.play().catch(function(){});
                document.removeEventListener('keydown', resume);
                document.removeEventListener('click', resume);
            };
            document.addEventListener('keydown', resume, { once: true });
            document.addEventListener('click', resume, { once: true });
        });
    }

    function updateNowPlaying(track) {
        var el = document.getElementById('now-playing');
        if (!el) return;
        var label = '\u266B ' + track.title + ' \u2014 ' + (track.user && track.user.name || 'Unknown');
        if (track.permalink) {
            el.innerHTML = '<a href="https://audius.co' + track.permalink + '" target="_blank" rel="noopener">' + label + '</a>';
        } else {
            el.textContent = label;
        }
    }

    function fetchTracks(query, callback) {
        var url = AUDIUS_API + '/tracks/search?query=' + encodeURIComponent(query) +
            '&limit=50&app_name=' + APP_NAME;
        fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(json) {
                var tracks = (json && json.data) ? json.data : [];
                // Filter to streamable tracks with audio
                tracks = tracks.filter(function(t) {
                    return t.is_streamable !== false && t.id;
                });
                callback(null, tracks);
            })
            .catch(function(e) { callback(e, []); });
    }

    function loadAllTracks() {
        var pending = QUERIES.length;
        QUERIES.forEach(function(q) {
            fetchTracks(q, function(err, tracks) {
                if (!err && tracks.length) {
                    // Deduplicate by id
                    tracks.forEach(function(t) {
                        if (!allTracks.find(function(x) { return x.id === t.id; })) {
                            allTracks.push(t);
                        }
                    });
                }
                pending--;
                if (pending === 0) {
                    if (allTracks.length === 0) {
                        console.warn('[Audius] No tracks found, falling back to additional search');
                        fetchTracks('video game music', function(err2, tracks2) {
                            playlist = shuffleArray(tracks2.length ? tracks2 : []);
                            if (playlist.length) playNext();
                        });
                    } else {
                        playlist = shuffleArray(allTracks);
                        playNext();
                    }
                }
            });
        });
    }

    function pause() {
        paused = true;
        if (audioEl) audioEl.pause();
    }

    function resume() {
        paused = false;
        if (audioEl) audioEl.play().catch(function(){});
    }

    function setVolume(v) {
        if (audioEl) audioEl.volume = Math.max(0, Math.min(1, v));
    }

    // Public API — mirrors the original music object interface
    window.AudiusMusic = {
        init: loadAllTracks,
        pause: pause,
        resume: resume,
        setVolume: setVolume,
        // Stub pause/play for compatibility with game code that calls music.overworld.pause() etc.
        overworld: {
            pause: pause,
            play: resume,
            get currentTime() { return audioEl ? audioEl.currentTime : 0; },
            set currentTime(v) { if (audioEl) audioEl.currentTime = v; }
        },
        underground: {
            pause: function() {},
            play: function() {},
            get currentTime() { return 0; },
            set currentTime(v) {}
        }
    };
})();
