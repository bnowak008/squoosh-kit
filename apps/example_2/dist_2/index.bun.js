// @bun
import{a as z}from"./bridge.bun.js";import"./chunk-q0apy7nk.js";import"./chunk-8y42hv65.js";var v=null;async function J(q,j,y){if(!v)v=z("worker");return v.encode(q,j,y)}async function K(q,j){if(!v)v=z("worker");return v.decode(q,j)}function L(q="worker"){let j=z(q);return Object.assign((y,E,G)=>{return j.encode(y,E,G)},{terminate:async()=>{await j.terminate()}})}function M(q="worker"){let j=z(q);return Object.assign((y,E)=>{return j.decode(y,E)},{terminate:async()=>{await j.terminate()}})}export{J as encode,K as decode,L as createAvifEncoder,M as createAvifDecoder};

//# debugId=8396CCB50663251564756E2164756E21
