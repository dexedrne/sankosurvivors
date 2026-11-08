import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
const root=new URL('../tools/duo-native-probe/',import.meta.url),html=readFileSync(new URL('screen.html',root),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function fixture(canvas=true){
 const rect={width:867,height:669},details={textContent:''},listeners=new Map(),field={getBoundingClientRect:()=>rect,getContext:()=>canvas?{fillRect(){},strokeRect(){}}:null};
 const environment={window:{},document:{getElementById:id=>id==='field'?field:details},innerWidth:867,innerHeight:669,addEventListener:(type,fn)=>listeners.set(type,fn)};
 for(const name of ['fetch','localStorage','sessionStorage','ethereum','location'])Object.defineProperty(environment,name,{get(){throw Error('Offline probe touched '+name);}});
 vm.createContext(environment);vm.runInContext(script,environment);
 return{environment,rect,listeners,field,report:()=>JSON.parse(details.textContent)};
}
test('native probe renders the actual web viewport and reports native bounds separately after resizing',()=>{
 const f=fixture();assert.equal(f.report().native,null);assert.deepEqual(f.report().webCanvas,[867,669]);
 const native={nativeView:[951,669],nativeWindow:[951,669],nativeWebView:[951,669],nativeSafeArea:[0,84,34,0],nativeStatusBarHidden:false,builtWithSDK:'iphoneos27.2'};
 f.environment.window.reportNativeGeometry(native);assert.deepEqual(f.report().native,native);assert.deepEqual(f.report().webViewport,[867,669]);assert.equal(f.report().canvasPainted,true);
 f.rect.width=669;f.rect.height=951;f.environment.innerWidth=669;f.environment.innerHeight=951;f.listeners.get('resize')();assert.deepEqual(f.report().webCanvas,[669,951]);assert.deepEqual([f.field.width,f.field.height],[669,951]);assert.deepEqual(f.report().native,native);
});
test('native probe keeps geometry readable when its canvas is unavailable',()=>{
 const f=fixture(false);assert.equal(f.report().canvasPainted,false);assert.deepEqual(f.report().webViewport,[867,669]);assert.deepEqual(f.report().webCanvas,[867,669]);
});
test('native probe packages a local resource with resizable scenes and no fixed screen sizing or signing team',()=>{
 const project=readFileSync(new URL('DuoScreenProbe.xcodeproj/project.pbxproj',root),'utf8'),swift=readFileSync(new URL('AppDelegate.swift',root),'utf8');
 const ids=[...project.matchAll(/^\s*([A-F0-9]{24}) =/gm)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const id of project.matchAll(/\b([A-F0-9]{24})\b/g))assert(ids.includes(id[1]),'unresolved project reference '+id[1]);
 for(const file of project.matchAll(/path = ([A-Za-z]+\.(?:swift|html|plist));/g))assert(readFileSync(new URL(file[1],root)).length>0);
 assert.match(project,/PBXResourcesBuildPhase[^}]*A10000000000000000000002/);assert.match(project,/fileRef = A20000000000000000000002/);assert.match(project,/productType = "com.apple.product-type.application"/);
 assert.doesNotMatch(project,/DEVELOPMENT_TEAM/);assert.doesNotMatch(swift,/UIScreen\.main|load\(URLRequest|https?:\/\//);assert.match(swift,/UIWindow\(windowScene: scene\)/);assert.match(swift,/prefersStatusBarHidden: Bool \{ true \}/);
 const info=JSON.parse(execFileSync('python3',['-c','import plistlib,json,sys; print(json.dumps(plistlib.load(open(sys.argv[1],"rb"))))',new URL('Info.plist',root).pathname],{encoding:'utf8'}));
 assert.equal(info.UIViewControllerBasedStatusBarAppearance,true);assert.equal(info.UIApplicationSceneManifest.UIApplicationSupportsMultipleScenes,false);assert.deepEqual(info.UISupportedInterfaceOrientations,['UIInterfaceOrientationPortrait','UIInterfaceOrientationLandscapeLeft','UIInterfaceOrientationLandscapeRight']);
 assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+href=|fetch\(|localStorage|sessionStorage|ethereum/);
});
