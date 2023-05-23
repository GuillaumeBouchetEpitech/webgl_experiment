"use strict";const t=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];var e;!function(t){t.getOffset=(t,e,s)=>{const i=e-t;return 0==i?.5:(s-t)/i},t.normalizeVector=t=>{const e=Math.sqrt(t[0]*t[0]+t[1]*t[1]+t[2]*t[2]);if(0==e)return t;const s=1/e;return[t[0]*s,t[1]*s,t[2]*s]}}(e||(e={}));class s{constructor(t,e,s){this._chunkSize=t,this._threshold=e,this._sampleCallback=s,this._stepSize=1/this._chunkSize}getNormal(t,s,i){const r=.1*this._stepSize;return e.normalizeVector([this._sampleCallback(t-r,s,i)-this._sampleCallback(t+r,s,i),this._sampleCallback(t,s-r,i)-this._sampleCallback(t,s+r,i),this._sampleCallback(t,s,i-r)-this._sampleCallback(t,s,i+r)])}getNormal2(t,e,s){const i=e[0]-t[0],r=e[1]-t[1],h=e[2]-t[2],o=s[0]-t[0],_=s[1]-t[1],a=s[2]-t[2];return[r*a-h*_,h*o-i*a,i*_-r*o]}}const i=[[0,1],[1,2],[2,0],[0,3],[1,3],[2,3]],r=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]],h=[0,13,19,30,38,43,53,56,56,53,43,38,30,19,13,0],o=[[-1,-1,-1,-1,-1,-1,-1],[0,3,2,-1,-1,-1,-1],[0,1,4,-1,-1,-1,-1],[1,4,2,2,4,3,-1],[1,2,5,-1,-1,-1,-1],[0,3,5,0,5,1,-1],[0,2,5,0,5,4,-1],[5,4,3,-1,-1,-1,-1],[3,4,5,-1,-1,-1,-1],[4,5,0,5,2,0,-1],[1,5,0,5,3,0,-1],[5,2,1,-1,-1,-1,-1],[3,4,2,2,4,1,-1],[4,1,0,-1,-1,-1,-1],[2,3,0,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1,-1]];const _=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];const a=-2147483648;const n=new class{constructor(){this._seed=1}random(){0==this._seed&&(this._seed=123459876);const t=this._seed/127773|0;let e=16807*(this._seed%127773|0)-2836*t|0;return e<0&&(e+=2147483647),this._seed=e,e%(a+1)/-a}setSeed(t){this._seed=0|t}},l=new class{constructor(t){this._octaves=1,this._frequency=1,this._amplitude=.5,this._octaves=t.octaves||1,this._frequency=t.frequency||1,this._amplitude=t.amplitude||.5;const e=t.randomCallback||(()=>Math.random()),s=256,i=new Uint8Array(s);for(let t=0;t<s;++t)i[t]=0|Math.floor(e()*s);this._perm=new Uint8Array(512);for(let t=0;t<512;++t)this._perm[t]=0|i[255&t]}noise(t,e,s){let i=0,r=this._amplitude,h=t*this._frequency,o=e*this._frequency,_=s*this._frequency;for(let t=0;t<this._octaves;++t)i+=this._noise(h,o,_)*r,h*=2,o*=2,_*=2,r*=.5;return i}_dot(t,e,s,i){const r=_[t];return r[0]*e+r[1]*s+r[2]*i}_mix(t,e,s){return(1-s)*t+s*e}_fade(t){return t*t*t*(t*(6*t-15)+10)}_noise(t,e,s){let i=0|Math.floor(t),r=0|Math.floor(e),h=0|Math.floor(s);t-=i,e-=r,s-=h,i=255&i|0,r=255&r|0,h=255&h|0;const o=this._perm[i+this._perm[r+this._perm[h]]]%12|0,_=this._perm[i+this._perm[r+this._perm[h+1]]]%12|0,a=this._perm[i+this._perm[r+1+this._perm[h]]]%12|0,n=this._perm[i+this._perm[r+1+this._perm[h+1]]]%12|0,l=this._perm[i+1+this._perm[r+this._perm[h]]]%12|0,c=this._perm[i+1+this._perm[r+this._perm[h+1]]]%12|0,m=this._perm[i+1+this._perm[r+1+this._perm[h]]]%12|0,d=this._perm[i+1+this._perm[r+1+this._perm[h+1]]]%12|0,p=this._dot(o,t,e,s),f=this._dot(l,t-1,e,s),u=this._dot(a,t,e-1,s),k=this._dot(m,t-1,e-1,s),b=this._dot(_,t,e,s-1),g=this._dot(c,t-1,e,s-1),x=this._dot(n,t,e-1,s-1),z=this._dot(d,t-1,e-1,s-1),S=this._fade(t),C=this._fade(e),y=this._fade(s),E=this._mix(p,f,S),V=this._mix(b,g,S),q=this._mix(u,k,S),P=this._mix(x,z,S),v=this._mix(E,q,C),w=this._mix(V,P,C);return this._mix(v,w,y)}}({randomCallback:()=>n.random(),octaves:1,frequency:1,amplitude:.5}),c=new class extends s{constructor(){super(...arguments),this._asEdgeVertex=[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],this._asEdgeNorm=[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],this._asCubePosition=[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]]}generate(t,e){if(!e)throw new Error("no geometry callback supplied");this._onVertexCallback=e;for(let e=0;e<=this._chunkSize;++e)for(let s=0;s<=this._chunkSize;++s)for(let i=0;i<=this._chunkSize;++i)this._marchTetrahedron(t[0]+e,t[1]+s,t[2]+i)}_marchTetrahedron(e,s,i){const h=e*this._stepSize,o=s*this._stepSize,_=i*this._stepSize;for(let e=0;e<8;++e){const s=this._asCubePosition[e],i=t[e];s[0]=h+i[0]*this._stepSize,s[1]=o+i[1]*this._stepSize,s[2]=_+i[2]*this._stepSize}const a=[0,0,0,0,0,0,0,0];for(let t=0;t<8;t++){const e=this._asCubePosition[t];a[t]=this._sampleCallback(e[0],e[1],e[2])}const n=[[0,0,0],[0,0,0],[0,0,0],[0,0,0]],l=[0,0,0,0];for(let t=0;t<6;t++){for(let e=0;e<4;e++){const s=r[t][e],i=n[e],h=this._asCubePosition[s];i[0]=h[0],i[1]=h[1],i[2]=h[2],l[e]=a[s]}this._marchTetrahedronSingle(n,l)}}_marchTetrahedronSingle(t,s){let r=0;for(let t=0;t<4;t++)s[t]<=this._threshold&&(r|=1<<t);const _=h[r];if(0!=_){for(let r=0;r<6;r++)if(_&1<<r){const h=i[r][0],o=i[r][1],_=e.getOffset(s[h],s[o],this._threshold),a=1-_,n=this._asEdgeVertex[r],l=t[h],c=t[o];n[0]=a*l[0]+_*c[0],n[1]=a*l[1]+_*c[1],n[2]=a*l[2]+_*c[2],this._asEdgeNorm[r]=this.getNormal(n[0],n[1],n[2])}for(let t=0;t<2&&!(o[r][3*t]<0);t++)for(let e=0;e<3;e++){const s=o[r][3*t+e],i=[this._asEdgeVertex[s][0]*this._chunkSize,this._asEdgeVertex[s][1]*this._chunkSize,this._asEdgeVertex[s][2]*this._chunkSize],h=this._asEdgeNorm[s];this._onVertexCallback&&this._onVertexCallback(i,h)}}}}(15,0,((t,e,s)=>l.noise(t,e,s))),m=self;m.addEventListener("message",(t=>{const{indexPosition:e,realPosition:s,float32buffer:i}=t.data;let r=0;c.generate(s,((t,e)=>{r+12>2e5||(i[r++]=t[0],i[r++]=t[1],i[r++]=t[2],i[r++]=e[0],i[r++]=e[1],i[r++]=e[2])})),m.postMessage({indexPosition:e,realPosition:s,float32buffer:i,sizeUsed:r},[i.buffer])}),!1);
