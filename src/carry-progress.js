// Saves live in the browser, one store per web address. The game's old addresses hand the save over to
// sankosurvivors.quest (in the #fragment, which never reaches a server), then forward there.
export function carryProgress() {
  var HOME = 'sankosurvivors.quest', OLD = ['sankosurvivors.vyvanse.beer', 'sankoquest.vyvanse.beer'];
  var KEEP = ['sq-coins', 'sq-name', 'sq-gear', 'sq-best', 'sq-bests', 'sq-stats', 'sq-settings', 'sq-skills', 'sq-seen', 'sq-roofs', 'sq-quests', 'sq-muted', 'sq-vol', 'sq-map', 'sq-gearlv', 'sq-cleared', 'sq-bank', 'sq-adv'];
  try {
    if (OLD.indexOf(location.hostname) >= 0) {
      var s = {}, n = 0;
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (KEEP.indexOf(k) >= 0) { s[k] = localStorage.getItem(k); n++; } }
      location.replace('https://' + HOME + '/' + location.search + (n ? '#carry=' + encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(s))))) : ''));
      return false;
    }
    // only a hand-off that really comes from an old address counts: a #carry= link from anywhere else could plant data
    var m = /^#carry=(.+)$/.exec(location.hash), from = '';
    try { from = new URL(document.referrer).hostname; } catch (e) { /* no referrer */ }
    if (m && OLD.indexOf(from) < 0) { history.replaceState(null, '', location.pathname + location.search); m = null; }
    if (m) {
      var d = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1])))));
      var fresh = !localStorage.getItem('sq-coins') && !localStorage.getItem('sq-stats'); // nothing played here yet: take it all
      // progress and settings only (a DMT pass is signed again here), each a value the game itself would have saved
      var ok = function (k, v) { if (typeof v !== 'string' || v.length > 20000) return false; if (k === 'sq-roofs') return v === 'off' || v === 'on'; try { JSON.parse(v); return true; } catch (e) { return false; } };
      for (var key in d) if (Object.prototype.hasOwnProperty.call(d, key) && KEEP.indexOf(key) >= 0 && ok(key, d[key]) && (fresh || localStorage.getItem(key) === null)) localStorage.setItem(key, d[key]);
      history.replaceState(null, '', location.pathname + location.search);
    }
  } catch (e) { /* storage blocked: nothing to carry */ }
  return true;
}
