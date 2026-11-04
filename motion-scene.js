/** Original WebGL contour field. Native scrolling and all content work independently. */
(() => {
 'use strict';
 const root=document.documentElement,preference=matchMedia('(prefers-reduced-motion: reduce)');
 const canvas=document.createElement('canvas');canvas.className='spatial-field';canvas.setAttribute('aria-hidden','true');canvas.tabIndex=-1;canvas.hidden=true;
 document.body.prepend(canvas);
 let gl=null,program=null,lineBuffer=null,dustBuffer=null,locations=null;
 let raf=0,lastPaint=0,time=0,lastTime=0,width=1,height=1,scrollTarget=0,chapter=0,px=0,py=0,mx=0,my=0,lost=false,started=false,failed=false;
 const compact=matchMedia('(max-width:767px)');
 const vertex=`
 precision mediump float;
 attribute vec3 aPosition;
 attribute float aSeed;
 uniform float uTime,uChapter,uAspect,uMode;
 uniform vec2 uPointer;
 varying float vAlpha;
 varying float vLight;
 void main(){
  vec3 p=aPosition;
  float phase=uTime*.22;
  p.y+=sin(p.x*.52+p.z*.47+phase)*.55+cos(p.x*.25-p.z*.64-phase*.7)*.24;
  p.y+=sin(p.x*.32+uChapter*.8)*.17;
  p.x+=sin(p.z*.48+phase*.45)*.16;
  if(uMode>.5){p.y+=sin(uTime*.35+aSeed*20.)*.24+.15;}
  float yaw=.12+sin(uChapter*.85)*.22+uPointer.x*.025;
  float cy=cos(yaw),sy=sin(yaw);
  p.xz=mat2(cy,-sy,sy,cy)*p.xz;
  float pitch=.62+sin(uChapter*.7)*.09+uPointer.y*.015;
  float cx=cos(pitch),sx=sin(pitch);
  p.yz=mat2(cx,-sx,sx,cx)*p.yz;
  p.z-=12.5;
  float focal=1.8;
  gl_Position=vec4(p.x*focal/uAspect,p.y*focal, -1.0067*p.z-.20067,-p.z);
  gl_Position.y-=gl_Position.w*(.35+sin(uChapter*.65)*.14);
  gl_Position.x+=gl_Position.w*sin(uChapter*.8)*.12;
  float edge=1.-smoothstep(4.4,8.3,abs(aPosition.x));
  float distanceFade=clamp(1.-(-p.z-8.)/16.,.12,1.);
  vLight=.35+.65*pow(.5+.5*sin(aPosition.x*.35-aPosition.z*.5-uTime*.32),5.);
  vAlpha=edge*distanceFade*(uMode>.5?.48:.18);
  gl_PointSize=(uMode>.5?1.6+1.3*aSeed:1.)*min(1.5,800./max(400.,uAspect*600.));
 }
 `;
 const fragment=`
 precision mediump float;
 uniform float uMode;
 varying float vAlpha;
 varying float vLight;
 void main(){
  float alpha=vAlpha;
  if(uMode>.5){float r=length(gl_PointCoord-.5);alpha*=1.-smoothstep(.15,.5,r);}
  vec3 ink=mix(vec3(.48,.46,.40),vec3(.94,.87,.71),vLight);
  gl_FragColor=vec4(ink,alpha);
 }
 `;
 function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);return null;}return shader;}
 let lineCount=0,dustCount=0;
 function build(){
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs)return false;
  program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))return false;
  locations={position:gl.getAttribLocation(program,'aPosition'),seed:gl.getAttribLocation(program,'aSeed')};
  for(const name of ['uTime','uChapter','uAspect','uMode','uPointer'])locations[name]=gl.getUniformLocation(program,name);
  const lines=[],rows=compact.matches?16:23,steps=compact.matches?55:76;
  function vertexAt(x,z,seed){lines.push(x,0,z,seed);}
  for(let r=0;r<rows;r++){
   const z=-4.5+r/(rows-1)*9;
   for(let i=0;i<steps;i++){vertexAt(-8+i/steps*16,z,r/rows);vertexAt(-8+(i+1)/steps*16,z,r/rows);}
  }
  // Sparse crossing contours communicate perspective without filling the page with a grid.
  for(let c=0;c<5;c++)for(let i=0;i<38;i++){
   const x=-6+c*3;vertexAt(x,-4.5+i/38*9,c/5);vertexAt(x,-4.5+(i+1)/38*9,c/5);
  }
  lineCount=lines.length/4;lineBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,lineBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(lines),gl.STATIC_DRAW);
  const dust=[];dustCount=compact.matches?32:64;
  for(let i=0;i<dustCount;i++){const r=Math.sin(i*127.1+13)*43758.5453,s=Math.sin(i*311.7+7)*17582.133;dust.push((r-Math.floor(r)-.5)*15.2,0,(s-Math.floor(s)-.5)*8.6,(i%9)/9);}
  dustBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,dustBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(dust),gl.STATIC_DRAW);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
  return true;
 }
 function measure(){width=innerWidth;height=innerHeight;const dpr=Math.min(compact.matches?1.15:1.35,devicePixelRatio||1,Math.sqrt(2400000/(width*height)));canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);if(gl)gl.viewport(0,0,canvas.width,canvas.height);updateScroll();}
 function updateScroll(){scrollTarget=scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)*6;wake();}
 function attributes(buffer){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(locations.position);gl.vertexAttribPointer(locations.position,3,gl.FLOAT,false,16,0);gl.enableVertexAttribArray(locations.seed);gl.vertexAttribPointer(locations.seed,1,gl.FLOAT,false,16,12);}
 function paint(now){
  raf=0;if(document.hidden||preference.matches||lost||failed)return;
  if(now-lastPaint<32){wake();return;}
  const dt=Math.min(60,lastTime?now-lastTime:33);lastTime=now;lastPaint=now;time+=dt*.001;
  chapter+=(scrollTarget-chapter)*Math.min(1,dt*.006);px+=(mx-px)*.045;py+=(my-py)*.045;
  gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);
  gl.uniform1f(locations.uTime,time);gl.uniform1f(locations.uChapter,chapter);gl.uniform1f(locations.uAspect,width/height);gl.uniform2f(locations.uPointer,px,py);
  gl.uniform1f(locations.uMode,0);attributes(lineBuffer);gl.drawArrays(gl.LINES,0,lineCount);
  gl.uniform1f(locations.uMode,1);attributes(dustBuffer);gl.drawArrays(gl.POINTS,0,dustCount);
  wake();
 }
 function wake(){if(started&&!raf&&!document.hidden&&!preference.matches&&!lost&&!failed)raf=requestAnimationFrame(paint);}
 function start(){
  if(preference.matches||failed)return;
  if(!gl){
   try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:false,stencil:false,powerPreference:'low-power',preserveDrawingBuffer:false});}catch{}
   if(!gl){failed=true;canvas.remove();return;}
   if(!build()){failed=true;canvas.remove();return;}
  }
  started=true;canvas.hidden=false;root.classList.add('webgl-motion-ready');measure();lastTime=0;wake();
 }
 function stop(){cancelAnimationFrame(raf);raf=0;lastTime=0;canvas.hidden=true;root.classList.remove('webgl-motion-ready');}
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;stop();});
 canvas.addEventListener('webglcontextrestored',()=>{lost=false;if(build())start();else{failed=true;stop();}});
 window.addEventListener('scroll',updateScroll,{passive:true});
 let resizeTimer=0;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(measure,100);},{passive:true});
 window.addEventListener('pointermove',event=>{if(preference.matches||event.pointerType==='touch')return;mx=event.clientX/innerWidth-.5;my=event.clientY/innerHeight-.5;},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;lastTime=0;}else wake();});
 function syncMotion(){if(preference.matches)stop();else start();}
 preference.addEventListener('change',syncMotion);
 window.addEventListener('portfolio:motion-change',syncMotion);
 window.addEventListener('pageshow',()=>{if(!preference.matches&&!root.classList.contains('is-booting'))start();});
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;lastTime=0;});
 if(root.classList.contains('is-booting'))window.addEventListener('portfolio:ready',start,{once:true});else start();
})();
