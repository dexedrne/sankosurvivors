import test from 'node:test';
import assert from 'node:assert/strict';
import { translateText } from '../src/i18n.js';

const messages = [
  "Finish interrupted run saves",
  "Completed-run rewards now save together. If browser storage interrupts the save, retry before playing or uploading progress.",
  "Save your finished run",
  "This run has not been confirmed saved. Keep this page open, free some browser storage, then retry before playing or saving to your wallet.",
  "Retry saving run",
  "Finish your wallet action before saving this run.",
  "This browser still cannot save the run. Keep this page open, free some storage and try again.",
  "Ranked submission could not be queued on this device. Keep this page open, free some storage and retry.",
  "Run rewards must finish saving before playing.",

  'Tumble', 'Tumble · Space / A', 'Tumble and build choices',
  'A sole healing reward now continues automatically. Evolutions have alternate passive pairings, listed on upgrade cards.',
  'Tumble with Space, controller A or the touch button. It crosses reachable low fences, keeps buildings solid and recharges in five seconds. No added invincibility. Ranked week 0 keeps its original rules and cosmetic jump.',
  'Payment recovery could not be saved on this device. No payment was requested.',
  'Ranked payments are unavailable in this browser. Update your browser and try again.',
  'A payment is in progress in another tab. Finish checking it there first.',
  'The ranked server did not return a usable entry. Your payment is saved. Use Check payment; do not pay again.',
  'Your payment is registered, but the entry could not be saved here. Keep this page open and use Check payment. Do not pay again.',
  'Check your wallet activity. If the payment was sent, paste its Arbitrum transaction hash to recover it. Do not pay again.',
  'Your wallet did not confirm whether it sent the payment. Check wallet activity before trying again.',
  'Your wallet did not return a transaction hash. Check wallet activity before trying again.',
  'Arbitrum transaction hash',
  'Recover this payment',
  'My wallet shows no payment',
  'Only clear this check if your wallet shows that no payment was sent. A sent payment must be recovered instead.',
  'Cloud sign-in cancelled: the save session changed.',
  'That swap allowed a partial fill: stopped for your safety.',
];

for (const [language, cheese] of [['tr', 'Peynir'], ['es', 'Queso'], ['fil', 'Keso']]) {
  test(`${language}: payment recovery and cloud safety messages translate without changing network names`, () => {
    for (const message of messages) {
      const translated = translateText(message, language);
      assert.notEqual(translated, message, message);
      assert.ok(translated.trim(), message);
      if (message.includes('Arbitrum')) assert.ok(translated.includes('Arbitrum'), message);
      assert.equal(translateText(message, 'en'), message);
    }
    assert.equal(translateText('Cheese', language), cheese);
    assert.equal(translateText('+15', language), '+15');
    const signature = "SankoQuest Survivors ranked\n\nSign to enter this week's ranked runs (week 0). Signing is free. Your wallet asks separately before sending the 0.5 DMT entry.\n\nNonce: SQS1.fixture.signature";
    assert.equal(translateText(signature, language), signature);
    for (const value of ['sq-ranked-payment', 'eth_sendTransaction', '0x' + 'ab'.repeat(32)]) assert.equal(translateText(value, language), value);
  });
}

for(const[language,either]of [['tr',' veya '],['es',' o '],['fil',' o ']])test(`${language}: alternative evolution requirements describe either passive`,()=>{
 const message='Upgrade: +range. Evolves with Winged Boots or Amanita.',translated=translateText(message,language);assert.ok(translated.includes(either),translated);assert.ok(!translated.includes(' or '),translated);assert.ok(translated.includes(translateText('Winged Boots',language)),translated);assert.ok(translated.includes(translateText('Amanita',language)),translated);
});
