"use strict";const t=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];var s;!function(t){t.getOffset=(t,s,e)=>{const i=s-t;return 0==i?.5:(e-t)/i},t.normalizeVector=t=>{const s=Math.sqrt(t[0]*t[0]+t[1]*t[1]+t[2]*t[2]);if(0==s)return t;const e=1/s;return[t[0]*e,t[1]*e,t[2]*e]}}(s||(s={}));class e{constructor(t,s,e){this._chunkSize=t,this._limit=s,this._sampleCallback=e,this._stepSize=1/this._chunkSize}getNormal(t,e,i){const r=.1*this._stepSize;return s.normalizeVector([this._sampleCallback(t-r,e,i)-this._sampleCallback(t+r,e,i),this._sampleCallback(t,e-r,i)-this._sampleCallback(t,e+r,i),this._sampleCallback(t,e,i-r)-this._sampleCallback(t,e,i+r)])}getNormal2(t,s,e){const i=s[0]-t[0],r=s[1]-t[1],h=s[2]-t[2],_=e[0]-t[0],o=e[1]-t[1],a=e[2]-t[2];return[r*a-h*o,h*_-i*a,i*o-r*_]}}const i=[[0,1],[1,2],[2,0],[0,3],[1,3],[2,3]],r=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]],h=[0,13,19,30,38,43,53,56,56,53,43,38,30,19,13,0],_=[[-1,-1,-1,-1,-1,-1,-1],[0,3,2,-1,-1,-1,-1],[0,1,4,-1,-1,-1,-1],[1,4,2,2,4,3,-1],[1,2,5,-1,-1,-1,-1],[0,3,5,0,5,1,-1],[0,2,5,0,5,4,-1],[5,4,3,-1,-1,-1,-1],[3,4,5,-1,-1,-1,-1],[4,5,0,5,2,0,-1],[1,5,0,5,3,0,-1],[5,2,1,-1,-1,-1,-1],[3,4,2,2,4,1,-1],[4,1,0,-1,-1,-1,-1],[2,3,0,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1,-1]];const o=-2147483648;const a=new class{constructor(){this._seed=1}random(){0==this._seed&&(this._seed=123459876);const t=this._seed/127773|0;let s=16807*(this._seed%127773|0)-2836*t|0;return s<0&&(s+=2147483647),this._seed=s,s%(o+1)/-o}setSeed(t){this._seed=0|t}},n=new class{constructor(t){this._octaves=1,this._frequency=1,this._amplitude=.5,this._octaves=t.octaves||1,this._frequency=t.frequency||1,this._amplitude=t.amplitude||.5;const s=t.randomCallback||(()=>Math.random());this._grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];const e=256;this._p=new Uint8Array(e);for(let t=0;t<e;++t)this._p[t]=0|Math.floor(s()*e);this._perm=new Uint8Array(512);for(let t=0;t<512;++t)this._perm[t]=0|this._p[255&t]}noise(t,s,e){let i=0,r=this._amplitude,h=t*this._frequency,_=s*this._frequency,o=e*this._frequency;for(let t=0;t<this._octaves;++t)i+=this._noise(h,_,o)*r,h*=2,_*=2,o*=2,r*=.5;return i}_dot(t,s,e,i){return t[0]*s+t[1]*e+t[2]*i}_mix(t,s,e){return(1-e)*t+e*s}_fade(t){return t*t*t*(t*(6*t-15)+10)}_noise(t,s,e){let i=0|Math.floor(t),r=0|Math.floor(s),h=0|Math.floor(e);t-=i,s-=r,e-=h,i=255&i|0,r=255&r|0,h=255&h|0;const _=this._perm[i+this._perm[r+this._perm[h]]]%12|0,o=this._perm[i+this._perm[r+this._perm[h+1]]]%12|0,a=this._perm[i+this._perm[r+1+this._perm[h]]]%12|0,n=this._perm[i+this._perm[r+1+this._perm[h+1]]]%12|0,l=this._perm[i+1+this._perm[r+this._perm[h]]]%12|0,c=this._perm[i+1+this._perm[r+this._perm[h+1]]]%12|0,m=this._perm[i+1+this._perm[r+1+this._perm[h]]]%12|0,d=this._perm[i+1+this._perm[r+1+this._perm[h+1]]]%12|0,p=this._dot(this._grad3[_],t,s,e),f=this._dot(this._grad3[l],t-1,s,e),u=this._dot(this._grad3[a],t,s-1,e),g=this._dot(this._grad3[m],t-1,s-1,e),k=this._dot(this._grad3[o],t,s,e-1),b=this._dot(this._grad3[c],t-1,s,e-1),x=this._dot(this._grad3[n],t,s-1,e-1),z=this._dot(this._grad3[d],t-1,s-1,e-1),S=this._fade(t),C=this._fade(s),y=this._fade(e),E=this._mix(p,f,S),V=this._mix(k,b,S),q=this._mix(u,g,S),P=this._mix(x,z,S),v=this._mix(E,q,C),w=this._mix(V,P,C);return this._mix(v,w,y)}}({randomCallback:()=>a.random(),octaves:1,frequency:1,amplitude:.5}),l=new class extends e{constructor(){super(...arguments),this._asEdgeVertex=[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],this._asEdgeNorm=[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],this._asCubePosition=[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]]}generate(t,s){if(!s)throw new Error("no geometry callback supplied");this._onVertexCallback=s;for(let s=0;s<=this._chunkSize;++s)for(let e=0;e<=this._chunkSize;++e)for(let i=0;i<=this._chunkSize;++i)this._marchTetrahedron(t[0]+s,t[1]+e,t[2]+i)}_marchTetrahedron(s,e,i){const h=s*this._stepSize,_=e*this._stepSize,o=i*this._stepSize;for(let s=0;s<8;++s){const e=this._asCubePosition[s],i=t[s];e[0]=h+i[0]*this._stepSize,e[1]=_+i[1]*this._stepSize,e[2]=o+i[2]*this._stepSize}const a=[0,0,0,0,0,0,0,0];for(let t=0;t<8;t++){const s=this._asCubePosition[t];a[t]=this._sampleCallback(s[0],s[1],s[2])}const n=[[0,0,0],[0,0,0],[0,0,0],[0,0,0]],l=[0,0,0,0];for(let t=0;t<6;t++){for(let s=0;s<4;s++){const e=r[t][s],i=n[s],h=this._asCubePosition[e];i[0]=h[0],i[1]=h[1],i[2]=h[2],l[s]=a[e]}this._marchTetrahedronSingle(n,l)}}_marchTetrahedronSingle(t,e){let r=0;for(let t=0;t<4;t++)e[t]<=this._limit&&(r|=1<<t);const o=h[r];if(0!=o){for(let r=0;r<6;r++)if(o&1<<r){const h=i[r][0],_=i[r][1],o=s.getOffset(e[h],e[_],this._limit),a=1-o,n=this._asEdgeVertex[r],l=t[h],c=t[_];n[0]=a*l[0]+o*c[0],n[1]=a*l[1]+o*c[1],n[2]=a*l[2]+o*c[2],this._asEdgeNorm[r]=this.getNormal(n[0],n[1],n[2])}for(let t=0;t<2&&!(_[r][3*t]<0);t++)for(let s=0;s<3;s++){const e=_[r][3*t+s],i=[this._asEdgeVertex[e][0]*this._chunkSize,this._asEdgeVertex[e][1]*this._chunkSize,this._asEdgeVertex[e][2]*this._chunkSize],h=this._asEdgeNorm[e];this._onVertexCallback&&this._onVertexCallback(i,h)}}}}(15,0,((t,s,e)=>n.noise(t,s,e))),c=self;c.addEventListener("message",(t=>{const{indexPosition:s,realPosition:e,float32buffer:i}=t.data;let r=0;l.generate(e,((t,s)=>{r+12>2e5||(i[r++]=t[0],i[r++]=t[1],i[r++]=t[2],i[r++]=s[0],i[r++]=s[1],i[r++]=s[2])})),c.postMessage({indexPosition:s,realPosition:e,float32buffer:i,sizeUsed:r},[i.buffer])}),!1);
