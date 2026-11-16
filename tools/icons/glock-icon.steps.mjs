// QA-kit steps for tools/icons/render-glock-icon.sh: save the drawn icon and a 4x preview next to it.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
export default async (t) => {
  const out = process.env.ICON_OUT;
  const icon = await t.eval('window.__icon'), info = await t.eval('JSON.stringify(window.__iconInfo)');
  if (typeof icon !== 'string' || !icon.startsWith('data:image/png;base64,')) throw Error('no icon was drawn');
  writeFileSync(path.join(out, 'item_SankoCorp_Glock.png'), Buffer.from(icon.slice(22), 'base64'));
  await t.eval(`document.getElementById('out').style.cssText='width:256px;height:256px;image-rendering:pixelated'`);
  await t.shot('preview');
  console.log('icon', info);
};
