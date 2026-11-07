import { openProfile } from './profile-owner.js';
import { carryProgress } from './carry-progress.js';
import { preferredLanguage, translateText } from './i18n.js';

const $ = id => document.getElementById(id);
let saved; try { saved = localStorage.getItem('sq-language'); } catch { /* storage blocked */ }
const language = preferredLanguage(saved, navigator.language);
const text = source => translateText(source, language);
document.documentElement.lang = language;
$('profiletitle').textContent = text('Opening your progress…');
$('profilemessage').textContent = text('Please wait…');
$('profiletry').textContent = text('Try again');
$('profiletry').onclick = () => location.reload();
function blocked(reason) {
  if (reason === 'failed' && !$('progressrecovery').classList.contains('hidden')) return;
  $('game').inert = true; $('profilegate').classList.remove('hidden');
  $('profiletitle').textContent = text(reason === 'busy' ? 'Open one game at a time' : 'Could not open progress');
  $('profilemessage').textContent = text(reason === 'busy' ? 'Another game tab or window is using this browser’s progress. Return there, or close it and choose Try again here.' : reason === 'failed' ? 'The game could not start. Keep this app installed and reload to try again.' : 'This browser cannot safely open this save. Try an up-to-date browser with site storage allowed.');
  $('profiletry').disabled = false; $('profiletry').focus();
}
openProfile(async () => {
  if (!carryProgress()) return;
  $('game').inert = false; $('profilegate').classList.add('hidden');
  await import('./main.js');
}, blocked);
