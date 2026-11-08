// Credits come from the server; menu changes only queue ordered pause transitions.
export class RankedClock {
  constructor({run,request,now=Date.now}) {
    this.run=run;this.request=request;this.now=now;this.queue=[];this.wanted=null;
    this.snapshot=null;this.readAt=0;this.busy=null;this.uncertain=true;this.syncing=true;
  }
  accept(value) {
    if(!value||value.ok!==true||!Number.isSafeInteger(value.seq)||value.seq<0||!Number.isSafeInteger(value.creditMs)||value.creditMs<0||value.creditMs>604800000||!Number.isSafeInteger(value.frame)||value.frame<0||value.frame>219600||!Number.isSafeInteger(value.serverNow)||value.serverNow<=0||(value.pausedAt!==null&&(!Number.isSafeInteger(value.pausedAt)||value.pausedAt<=0||value.pausedAt>value.serverNow)))throw Error('Invalid ranked clock');
    this.snapshot=value;this.readAt=this.now();this.uncertain=false;
  }
  sync(paused,frame) {
    if(!Number.isSafeInteger(frame)||frame<0||frame>219600)return Promise.resolve();
    if(this.wanted!==paused){this.wanted=paused;this.queue.push({action:paused?'pause':'resume',frame});}
    if(!this.busy)this.busy=this.flush().finally(()=>{this.busy=null;});
    return this.busy;
  }
  async flush() {
    this.syncing=true;
    try {
      if(this.uncertain)this.accept(await this.request({run:this.run,action:'state',seq:0,frame:0}));
      while(this.queue.length) {
        const event=this.queue[0],paused=this.snapshot.pausedAt!==null;
        if((event.action==='pause')===paused){this.queue.shift();continue;}
        // SQL requires advancement after a completed pause. A stale journal or
        // immediate re-pause cannot earn new grace or block subsequent events.
        if(event.action==='pause'&&this.snapshot.seq>0&&event.frame<=this.snapshot.frame){
          this.queue.shift();
          if(!this.queue.length)this.wanted=null; // Retry when the real frame advances.
          continue;
        }
        // A restored journal can precede the last acknowledged frozen frame.
        const frame=event.action==='resume'?this.snapshot.frame:event.frame;
        this.accept(await this.request({run:this.run,...event,frame,seq:this.snapshot.seq+1}));
        this.queue.shift();
      }
      this.syncing=false;
    } catch {this.uncertain=true;}
  }
  creditMs(frame) {
    const s=this.snapshot;if(!s)return 0;
    const idle=s.pausedAt!==null&&frame===s.frame?Math.max(0,s.serverNow+this.now()-this.readAt-s.pausedAt):0;
    return s.creditMs+Math.min(30000,idle);
  }
}
