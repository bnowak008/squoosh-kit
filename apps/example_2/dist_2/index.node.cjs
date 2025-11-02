var O={};J(O,{encode:()=>K,decode:()=>L,createAvifEncoder:()=>M,createAvifDecoder:()=>N});module.exports=H(O);var v=null;async function K(q,j,y){if(!v)v=z("worker");return v.encode(q,j,y)}async function L(q,j){if(!v)v=z("worker");return v.decode(q,j)}function M(q="worker"){let j=z(q);return Object.assign((y,E,G)=>{return j.encode(y,E,G)},{terminate:async()=>{await j.terminate()}})}function N(q="worker"){let j=z(q);return Object.assign((y,E)=>{return j.decode(y,E)},{terminate:async()=>{await j.terminate()}})}

//# debugId=0B0E5372B91D897064756E2164756E21
