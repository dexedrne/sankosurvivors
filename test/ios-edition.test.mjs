import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {iosEdition} from '../tools/ios/edition.mjs';
const source=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
test('iPhone edition removes paid, wallet and co-op entry points through the established extractor',()=>{
 const p=iosEdition(),main=p.transform(source('src/main.js'),'/src/main.js').code;
 assert.doesNotMatch(main,/fetch\(|rankedApi|payEntry|createCloud|bunCompanions|enterRacers|run-stats|RunStats|statsOutbox|statsSessions/);
 const sim=p.transform(source('src/sim.js'),'/src/sim.js').code;assert.doesNotMatch(sim,/run-stats|noteRunOffers|noteRunChoice/);
 const html=p.transformIndexHtml.handler(source('index.html'));
 for(const id of ['rankedbtn','walletchip','petbuns','racersbtn','coopbtn'])assert(!html.includes('id="'+id+'"'));
 assert(html.includes('id="start"'));assert(html.includes('<title>SankoSurvivors</title>'));
 assert(html.includes('<h2>More</h2><details class="pausehelp"><summary>Privacy</summary>'));
 assert(html.includes('It does not send gameplay or progress to the developer.'));
});
test('iPhone edition has its own honest beta version and no platform SDK requirement',()=>{
 const p=iosEdition(),notes=p.transform(source('src/changelog.js'),'/src/changelog.js').code;
 assert(notes.includes('1.0.0'));assert.doesNotMatch(notes,/DMT|ranked|Wavedash|Grand Theft/);
 const loader=p.transform(source('src/wavedash.js'),'/src/wavedash.js').code;
 assert.doesNotMatch(loader,/globalThis\.Wavedash|fetch|https?:/);assert(loader.includes('createWavedashLoader'));
});
test('native release uses bundled local content with no external navigation allowlist or server override',()=>{
 const c=JSON.parse(source('tools/ios/capacitor.config.json'));
 assert.equal(c.appId,'quest.sankosurvivors.casual');assert.equal(c.webDir,'www');assert.equal(c.server.hostname,'localhost');assert.equal(c.server.url,undefined);assert.equal(c.server.allowNavigation,undefined);
 assert.equal(c.ios.contentInset,'never');assert.equal(c.ios.webContentsDebuggingEnabled,false);assert.deepEqual(c.includePlugins,[]);assert.equal(c.plugins.SystemBars.hidden,true);
});
test('native scene uses a fullscreen game controller, one scene and explicit interruption handling',()=>{
 const scene=source('tools/ios/ios/App/App/SceneDelegate.swift'),plist=source('tools/ios/ios/App/App/Info.plist');
 assert.match(scene,/rootViewController = GameViewController\(\)/);assert.match(scene,/prefersStatusBarHidden: Bool \{ true \}/);assert.match(scene,/sceneWillResignActive/);
 assert.match(plist,/<key>UIApplicationSupportsMultipleScenes<\/key>\s*<false\/>/);assert.match(plist,/<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/);assert.doesNotMatch(plist,/NSAllowsArbitraryLoads/);
 assert.doesNotMatch(scene,/allowFileAccessFromFileURLs|registerSchemeForCustomProtocol|setValue\(/);
});
test('installable OS minimum includes the Web Locks API required to protect local saves',()=>{
 assert.match(source('src/profile-owner.js'),/navigator\.locks\?\.request/);
 const targets=[...source('tools/ios/ios/App/App.xcodeproj/project.pbxproj').matchAll(/IPHONEOS_DEPLOYMENT_TARGET = (\d+)\.(\d+);/g)];
 assert.equal(targets.length,4);
 for(const [,major,minor] of targets)assert(+major>15 || +major===15 && +minor>=4,'iOS15.0–15.3 cannot acquire the profile save lock');
 assert.equal([...source('tools/ios/ios/App/App.xcodeproj/project.pbxproj').matchAll(/TARGETED_DEVICE_FAMILY = "?1"?;/g)].length,2,'first beta is scoped to iPhone');
});
