export const CONFIG = Object.freeze({WIDTH:720,HEIGHT:650,GRAVITY:650,RESTITUTION:0.69,DRAG:0.07,BALL_RADIUS:7,PIN_RADIUS:9,STEP:1/120,MAX_BALLS:40,MAX_AGE:24,SLOT_Y:565,LEFT:36,RIGHT:684,INITIAL_COINS:300,MIN_BET:1,MAX_SHOTS:30,AIM_MIN:8,AIM_MAX:92,LAUNCH_SPEED:20,PIN_KICK_MIN:70,PIN_KICK_MAX:170,PIN_FALL_FACTOR:.4,PIN_MIN_FALL:25});
export const MULTIPLIERS=[0,0,1,2,0.5,2,1,0,0];
const widths=[59,59,40,140,52,140,40,59,59];
let edge=CONFIG.LEFT;
export const SLOTS=widths.map((width,i)=>{const slot={left:edge,right:edge+width,width,multiplier:MULTIPLIERS[i]};edge+=width;return Object.freeze(slot);});
export const BETS=[20,40,60,100];
export class Pin{constructor(x,y){this.x=x;this.y=y;this.r=CONFIG.PIN_RADIUS;this.glow=0;}}
export class Ball{constructor(x,bet){this.x=x;this.y=57;this.vx=0;this.vy=CONFIG.LAUNCH_SPEED;this.r=CONFIG.BALL_RADIUS;this.bet=bet;this.payouts=[...MULTIPLIERS];this.age=0;this.lastPin=-1;this.trail=[];this.dead=false;}}
export class PhysicsSystem{
 constructor(random=Math.random){this.random=random;this.pins=[];for(let row=0;row<10;row++){for(let col=0;col<(row%2?10:11);col++){this.pins.push(new Pin(40+col*64+(row%2?32:0),135+row*42));}}}
 update(ball,dt,onHit=()=>{}){const c=CONFIG;ball.age+=dt;ball.vy+=c.GRAVITY*dt;ball.vx*=Math.exp(-c.DRAG*dt);ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
 for(let i=0;i<this.pins.length;i++){const p=this.pins[i],dx=ball.x-p.x,dy=ball.y-p.y;if(Math.abs(dx)>20||Math.abs(dy)>20)continue;const d=Math.hypot(dx,dy),min=ball.r+p.r;if(d<min){const nx=d?dx/d:0,ny=d?dy/d:-1;ball.x=p.x+nx*(min+.02);ball.y=p.y+ny*(min+.02);const dot=ball.vx*nx+ball.vy*ny;if(dot<0){
 if(ball.lastPin!==i){ball.lastPin=i;ball.vx=(this.random()<.5?-1:1)*(c.PIN_KICK_MIN+this.random()*(c.PIN_KICK_MAX-c.PIN_KICK_MIN));ball.vy=Math.max(c.PIN_MIN_FALL,Math.abs(ball.vy)*c.PIN_FALL_FACTOR);}
 else{ball.vx-=(1+c.RESTITUTION)*dot*nx;ball.vy-=(1+c.RESTITUTION)*dot*ny;if(ball.vy<c.PIN_MIN_FALL*.5&&Math.abs(ball.vx)<20)ball.vx+=(nx>=0?1:-1)*c.PIN_KICK_MIN;}
 onHit(p,Math.abs(dot));}}}
 if(ball.x<c.LEFT+ball.r){ball.x=c.LEFT+ball.r;ball.vx=Math.abs(ball.vx)*c.RESTITUTION;}if(ball.x>c.RIGHT-ball.r){ball.x=c.RIGHT-ball.r;ball.vx=-Math.abs(ball.vx)*c.RESTITUTION;}
 if(ball.y>=c.SLOT_Y){ball.dead=true;return SLOTS.findIndex(s=>ball.x>=s.left&&ball.x<s.right);}if(ball.age>=c.MAX_AGE||ball.y>c.HEIGHT+50||!Number.isFinite(ball.x+ball.y)){ball.dead=true;return -1;}return null;}
}
export class GameState{
 constructor(){this.target=null;this.coins=CONFIG.INITIAL_COINS;this.shots=0;this.spent=0;this.earned=0;this.jackpots=0;this.history=[];this.status='playing';this.reason='';this.cashoutRequested=false;}
 setTarget(value){if(this.shots>0)return false;if(value!==null&&(!Number.isSafeInteger(value)||value<=CONFIG.INITIAL_COINS||value>1000000))return false;this.target=value;return true;}
 launch(bet){if(this.status!=='playing'||this.cashoutRequested||this.shots>=CONFIG.MAX_SHOTS||(!Number.isSafeInteger(bet)||bet<CONFIG.MIN_BET)||this.coins<bet)return false;this.coins-=bet;this.spent+=bet;this.shots++;return true;}
 reward(ball,slot){if(ball.settled)return null;ball.settled=true;const multiplier=slot<0?0:(ball.payouts||MULTIPLIERS)[slot],amount=ball.bet*multiplier,net=amount-ball.bet;this.coins+=amount;this.earned+=amount;if(multiplier>=2)this.jackpots++;this.history.unshift({multiplier,amount,net,bet:ball.bet});this.history=this.history.slice(0,8);return {amount,net,multiplier};}
 accounting(activeBalls=[]){const pending=activeBalls.filter(b=>!b.settled).reduce((sum,b)=>sum+b.bet,0);const settledCost=this.spent-pending;return {available:this.coins,pending,settledCost,returned:this.earned,net:this.earned-settledCost};}
 settle(active){if(this.status!=='playing'||active>0)return; if(this.target!==null&&this.coins>=this.target){this.status='won';this.reason='target';}else if(this.coins<CONFIG.MIN_BET){this.status='lost';this.reason='bankrupt';}else if(this.cashoutRequested){this.status='ended';this.reason='cashout';}else if(this.shots>=CONFIG.MAX_SHOTS){this.status=this.target===null?'ended':'lost';this.reason='shots';}}
}

export function quickCost(balance,fraction){if(!Number.isFinite(balance)||balance<1||![.1,.5,1].includes(fraction))return 0;return Math.min(Math.floor(balance),Math.max(1,Math.floor(balance*fraction)));}
