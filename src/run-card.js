const WIDTH=900,PAD=44,GAP=12;
function lines(ctx,text,width){
 const result=[];let line='';
 for(const word of String(text).split(/\s+/)){
  if(line&&ctx.measureText(line+' '+word).width>width){result.push(line);line='';}
  for(const char of word){if(ctx.measureText(line+char).width>width&&line){result.push(line);line='';}line+=char;}
  line+=' ';
 }
 if(line.trim())result.push(line.trimEnd());return result.length?result:[''];
}
function frame(ctx,img,x,y,w,h){
 ctx.fillStyle='#2f251b';ctx.fillRect(x,y,w,h);
 if(!img){ctx.strokeStyle='#b79a53';ctx.lineWidth=4;ctx.strokeRect(x+2,y+2,w-4,h-4);return;}
 const s=20,e=16,iw=img.width,ih=img.height;
 for(const[dx,dy,sx,sy]of[[x,y,0,0],[x+w-e,y,iw-s,0],[x,y+h-e,0,ih-s],[x+w-e,y+h-e,iw-s,ih-s]])ctx.drawImage(img,sx,sy,s,s,dx,dy,e,e);
 for(let dx=x+e;dx<x+w-e;dx+=e){const n=Math.min(e,x+w-e-dx);ctx.drawImage(img,s,0,s*n/e,s,dx,y,n,e);ctx.drawImage(img,s,ih-s,s*n/e,s,dx,y+h-e,n,e);}
 for(let dy=y+e;dy<y+h-e;dy+=e){const n=Math.min(e,y+h-e-dy);ctx.drawImage(img,0,s,s,s*n/e,x,dy,e,n);ctx.drawImage(img,iw-s,s,s,s*n/e,x+w-e,dy,e,n);}
}
const time=t=>t>=3600?`${Math.floor(t/3600)}:${String(Math.floor(t/60)%60).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`:`${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;

export function drawRunCard(canvas,card,images,translate,site){
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas export is unavailable.');
 const width=WIDTH-PAD*2,plan=[],header=[];let headerY=50;
 for(const[text,font,color]of[['SankoSurvivors',42,'#ffff00'],[card.name+' · '+translate(card.adventurer),25,'#fff0c0'],[translate(card.map)+' · '+translate(card.mode),25,'#ff981f'],[translate(card.outcome),22,'#fff0c0']]){
  ctx.font=`${font}px ${font===42?'RSQuill8,serif':'RSPlain'}`;
  const wrapped=lines(ctx,text,width);header.push({lines:wrapped,font,color,y:headerY});headerY+=wrapped.length*(font+8)+8;
 }
 const summary=[time(card.t),`${translate('Level')}: ${card.level}`,`${translate('Slain')}: ${card.kills.toLocaleString()}`];
 if(Number.isFinite(card.points))summary.push(`${translate('Score')}: ${card.points.toLocaleString()}`);
 const summaryCols=card.points==null?3:2,summaryCell=width/summaryCols;ctx.font='27px RSPlain';
 const summaryRows=summary.map(text=>lines(ctx,text,summaryCell-20)),summaryLineCount=Math.max(...summaryRows.map(row=>row.length)),summaryRowHeight=summaryLineCount*32+10;
 const summaryHeight=Math.ceil(summary.length/summaryCols)*summaryRowHeight,contentY=headerY+summaryHeight+18;
 let height=contentY-3;
 for(const section of card.sections){
  const cols=section.title==='Skills'?3:2,cell=(width-GAP*(cols-1))/cols,font=cols===3?22:25,rows=section.rows.length?section.rows:[{name:'None',details:[]}];
  const entries=rows.map(row=>{ctx.font=`${font}px RSPlain`;const name=lines(ctx,translate(row.name),cell-70);ctx.font='20px RSPlain';const details=lines(ctx,row.details.map(translate).join(' · '),cell-70);return{...row,nameLines:name,detailLines:details,height:Math.max(70,20+name.length*26+details.length*22)};});
  const groups=[];for(let i=0;i<entries.length;i+=cols){const group=entries.slice(i,i+cols);groups.push({rows:group,height:Math.max(...group.map(r=>r.height))});}
  const block=48+groups.reduce((n,g)=>n+g.height+GAP,0);height+=block;plan.push({section,cols,cell,font,groups});
 }
 ctx.font='22px RSPlain';const statCell=width/3,statPlan=[];
 for(let i=0;i<card.stats.length;i+=3){const rows=card.stats.slice(i,i+3).map(stat=>({...stat,lines:lines(ctx,translate(stat.name),statCell-12)}));statPlan.push({rows,height:Math.max(...rows.map(stat=>stat.lines.length))*24+44});}
 height+=statPlan.reduce((n,row)=>n+row.height,0)+104;
 if(height>8000)throw Error('This build is too large for an image card.');
 canvas.width=WIDTH;canvas.height=height;ctx.imageSmoothingEnabled=false;ctx.textBaseline='alphabetic';ctx.fillStyle='#1e1710';ctx.fillRect(0,0,WIDTH,height);frame(ctx,images.get('ui/sq/frame.png'),8,8,WIDTH-16,height-16);
 for(const block of header){ctx.font=`${block.font}px ${block.font===42?'RSQuill8,serif':'RSPlain'}`;ctx.fillStyle=block.color;block.lines.forEach((text,i)=>ctx.fillText(text,PAD,block.y+block.font+i*(block.font+8)));}
 ctx.fillStyle='#1e1710';ctx.fillRect(PAD,headerY,width,summaryHeight);ctx.font='27px RSPlain';ctx.fillStyle='#ffff00';summaryRows.forEach((row,i)=>row.forEach((text,line)=>ctx.fillText(text,PAD+10+(i%summaryCols)*summaryCell,headerY+30+Math.floor(i/summaryCols)*summaryRowHeight+line*32)));
 let y=contentY;
 for(const block of plan){
  ctx.font='28px RSQuill8,serif';ctx.fillStyle='#ff981f';ctx.fillText(translate(block.section.title),PAD,y+28);y+=48;
  for(const group of block.groups){group.rows.forEach((row,col)=>{
   const x=PAD+col*(block.cell+GAP);ctx.fillStyle='#241c14';ctx.fillRect(x,y,block.cell,group.height);ctx.strokeStyle='#5a4632';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,block.cell-1,group.height-1);
   const img=images.get(row.icon);if(img){const scale=Math.min(42/img.width,42/img.height);ctx.drawImage(img,x+12+(42-img.width*scale)/2,y+14+(42-img.height*scale)/2,img.width*scale,img.height*scale);}
   ctx.font=`${block.font}px RSPlain`;ctx.fillStyle='#fff0c0';let ty=y+28;for(const text of row.nameLines){ctx.fillText(text,x+64,ty);ty+=26;}
   ctx.font='20px RSPlain';ctx.fillStyle='#d3ba87';for(const text of row.detailLines){ctx.fillText(text,x+64,ty);ty+=22;}
  });y+=group.height+GAP;}
 }
 for(const group of statPlan){group.rows.forEach((stat,col)=>{const x=PAD+col*statCell;ctx.font='22px RSPlain';ctx.fillStyle='#d3ba87';stat.lines.forEach((text,i)=>ctx.fillText(text,x,y+21+i*24));ctx.font='26px RSPlain';ctx.fillStyle='#ffff00';ctx.fillText(stat.value.toLocaleString()+stat.suffix,x,y+group.height-15);});y+=group.height;}
 y+=38;ctx.fillStyle='#fff0c0';ctx.font='24px RSPlain';ctx.fillText(site,PAD,y);ctx.textAlign='right';ctx.fillStyle='#b9a681';ctx.font='20px RSPlain';ctx.fillText('v'+card.version,WIDTH-PAD,y);ctx.textAlign='left';
 return canvas;
}
