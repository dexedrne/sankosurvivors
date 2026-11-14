import {wavedashEdition} from '../wavedash/edition.mjs';
const notes=[{version:'1.0.0',date:'14 Nov 2026',title:'SankoSurvivors for iPhone',items:[
  'Survive the native world, choose your adventurer, find weapons and evolve your build.',
  'Play offline with local progress, ordinary pets, quests, achievements and Endless runs.',
  'Gold rewards your collected haul with damage. A steady red edge warns when health is low.',
  'This beta has its own on-device save. Use Move progress to back up or import a progress code.'
]}];
export function iosEdition(){
  const base=wavedashEdition();
  return {...base,name:'sqs-ios-casual',
    transformIndexHtml:{order:'pre',handler:html=>base.transformIndexHtml.handler(html)
      .replace(/<title>[^<]*<\/title>/,'<title>SankoSurvivors</title>')
      .replace('<h2>More</h2>','<h2>More</h2><details class="pausehelp"><summary>Privacy</summary><p>This casual iPhone edition stores progress and preferences on your device. It has no account login, advertising, tracking, analytics or developer-operated cloud save. It does not send gameplay or progress to the developer.</p><p>Move progress creates a code containing your game progress. Copying or sharing it is your choice. Device backups, external links and apps you choose have their own privacy practices. Apple handles TestFlight feedback and diagnostics under its settings and privacy terms.</p><p>Deleting the app removes its local data from that installation. Keep a progress-code backup first. For support or privacy questions, use the creator link below.</p></details>')},
    transform(code,id){
      if(id.endsWith('/src/changelog.js'))return{code:`export const LATEST='1.0.0';export const CHANGELOG=${JSON.stringify(notes)};`,map:null};
      if(id.endsWith('/src/wavedash.js'))return{code:'export const createWavedashLoader=()=>({progress(){},ready(){}});',map:null};
      return base.transform(code,id);
    }
  };
}
