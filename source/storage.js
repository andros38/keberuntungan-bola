import {CONFIG as C,GameState,BETS} from './physics.js';
export const STORAGE_KEY='orbit-survival-v2';
export function encodeSession(state,balls,bet,position){return JSON.stringify({version:3,state,balls,bet,position});}
export function decodeSession(raw){
 const d=JSON.parse(raw);if(![2,3].includes(d.version)||!d.state||!Array.isArray(d.balls)||d.balls.length>C.MAX_BALLS)throw Error('Invalid session');
 const s=d.state;if(!['playing','won','lost','ended'].includes(s.status))throw Error('Invalid status');
 for(const key of ['coins','shots','spent','earned','jackpots'])if(!Number.isFinite(s[key])||s[key]<0)throw Error('Invalid economy');
 if(s.shots>C.MAX_SHOTS||s.coins!==C.INITIAL_COINS-s.spent+s.earned||!Array.isArray(s.history))throw Error('Inconsistent session');
 for(const b of d.balls){for(const key of ['x','y','vx','vy','age','bet'])if(!Number.isFinite(b[key]))throw Error('Invalid ball');if((!Number.isSafeInteger(b.bet)||b.bet<1)||b.dead||b.settled)throw Error('Invalid active ball');if(!Number.isInteger(b.lastPin))b.lastPin=-1;if(d.version===2)b.payouts=[0,8,.5,.25,0,.25,.5,8,0];if(!Array.isArray(b.payouts)||b.payouts.length!==9||b.payouts.some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid payouts');}
 if(s.status!=='playing'&&d.balls.length)throw Error('Finished session has active balls');
 return {state:Object.assign(new GameState(),s),balls:d.balls,bet:Number.isSafeInteger(d.bet)&&d.bet>=1?d.bet:20,position:Math.min(C.AIM_MAX,Math.max(C.AIM_MIN,Number(d.position)||50))};
}
