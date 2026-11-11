import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
test('changing a spatially selected setting retains the replacement selection for the next move and press',()=>{
 const nav=source.slice(source.indexOf('const NAV_SCREENS'),source.indexOf('function navBack()'));
 const a=source.indexOf("  for (const b of $('setlist').querySelectorAll('button')) b.onclick = () => {"),b=source.indexOf('\n}\nconst openSettings',a),wire=source.slice(a,b);
 assert(a>=0&&b>a);
 let active=null,current,presses=0;
 const make=(id,y,dataset={})=>{
  const classes=new Set();return{id,dataset,tabIndex:0,offsetParent:{},value:50,classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v)},focus(){active=this;},scrollIntoView(){},closest(){return null;},matches(){return false;},getBoundingClientRect(){return{left:0,top:y,width:100,height:44};},click(){this.onclick?.();}};
 };
 const display=make('display',0),music=make('music',200);music.onclick=()=>presses++;
 const panel={id:'settings',classList:{contains:()=>false},contains:e=>[display,current,music].includes(e),querySelectorAll:()=>[display,current,music]};
 const hidden={classList:{contains:()=>true}};
 const $=id=>id==='settings'?panel:id==='setlist'?{querySelectorAll:()=>[current],querySelector:()=>current}:hidden;
 const rebuild=()=>{current=make('sound-on',150,{id:'sound',v:'true'});};rebuild();
 const app=Function('$','document','buildSettings','audio','renderer',`const MENU_SCREENS=['settings'],mode='title',walletModalOpen=()=>false,screenLayout={},save=()=>{};${nav};${wire};return{focus:()=>navFocus($('setlist').querySelector()),selected:()=>navEl,move:navMove,press:navPress};`)($,{get activeElement(){return active;}},rebuild,{setMuted(){}},{getSettings:()=>({})});
 app.focus();const original=current;original.click();assert.notEqual(current,original);assert.equal(active,current);assert.equal(app.selected(),current,'spatial selection must follow the rebuilt control');
 app.move('down');assert.equal(active,music,'next move must continue from the selected row');assert.equal(app.press(),true);assert.equal(presses,1);
});

test('collapsed settings content cannot steal controller focus from a visible control',()=>{
 const nav=source.slice(source.indexOf('const NAV_SCREENS'),source.indexOf('function navBack()'));
 let active=null;
 const make=(name,x,closedContent=false)=>({
  name,tabIndex:0,offsetParent:{},classList:{add(){},remove(){},contains:()=>false},
  closest:selector=>selector!=='.hidden'&&closedContent?{}:null,
  focus(){active=this;},scrollIntoView(){},matches:()=>false,
  getBoundingClientRect:()=>({left:x,top:0,width:60,height:44}),
 });
 const on=make('Sound on',0),hiddenOff=make('Bloom off in collapsed Display',65,true),off=make('Sound off',65),summary=make('Display summary',-80);
 const items=[summary,hiddenOff,on,off],panel={id:'settings',classList:{contains:()=>false},querySelectorAll:()=>items,contains:e=>items.includes(e)};
 const app=Function('$',`const MENU_SCREENS=['settings'],mode='title',walletModalOpen=()=>false;${nav};return{focus:navFocus,move:navMove};`)(()=>panel);
 app.focus(on);app.move('right');assert.equal(active,off,'closed descendants can retain layout rectangles but must not be selectable');
 app.focus(summary);app.move('right');assert.equal(active,on,'the closed section summary remains a visible navigation control');
});

test('controller confirm ignores a selected control that closes or disables before activation',()=>{
 const nav=source.slice(source.indexOf('const NAV_SCREENS'),source.indexOf('function navBack()'));
 let activations=0;
 const control={
  tabIndex:0,offsetParent:{},disabled:false,closed:false,classList:{add(){},remove(){}},
  closest:selector=>selector.startsWith('details')&&control.closed?{}:null,
  focus(){},scrollIntoView(){},click(){activations++;},
 };
 const panel={id:'settings',classList:{contains:()=>false},querySelectorAll:()=>[control],contains:e=>e===control};
 const app=Function('$',`const MENU_SCREENS=['settings'],mode='title',walletModalOpen=()=>false;${nav};return{focus:navFocus,press:navPress};`)(()=>panel);
 app.focus(control);
 assert.equal(app.press(),true);
 control.closed=true;
 assert.equal(app.press(),false);
 control.closed=false;control.disabled=true;
 assert.equal(app.press(),false);
 assert.equal(activations,1);
});
