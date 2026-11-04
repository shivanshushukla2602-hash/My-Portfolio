/** Shiv&Shu — content-first, dependency-free motion and interaction. */
(() => {
 'use strict';
 const root=document.documentElement;
 const $=(s,scope=document)=>scope.querySelector(s);
 const $$=(s,scope=document)=>[...scope.querySelectorAll(s)];
 const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
 let reduced=motion.matches;
 root.classList.add('js');root.classList.toggle('motion-reduced',reduced);

 // The navigation drawer leaves only its own controls focusable.
 const menu=$('#siteMenu'),menuButton=$('#menuToggle'),main=$('main'),footer=$('.site-footer'),menuBackdrop=$('#menuBackdrop');
 $$('.menu-links>a').forEach((link,i)=>link.style.setProperty('--menu-index',String(i)));
 let menuOpen=false,menuOverflow='';
 function setMenu(open,returnFocus=false){
  if(open===menuOpen)return;
  menuOpen=open;menu.hidden=!open;menuBackdrop.hidden=!open;root.classList.toggle('menu-open',open);
  menu.classList.toggle('is-opening',open);
  menuButton.setAttribute('aria-expanded',String(open));
  menuButton.setAttribute('aria-label',open?'Close menu':'Open menu');
  $('.menu-label',menuButton).textContent=open?'Close':'Menu';
  main.inert=open;footer.inert=open;
  if(open){menuOverflow=root.style.overflow;root.style.overflow='hidden';}
  else{root.style.overflow=menuOverflow;if(returnFocus)menuButton.focus({preventScroll:true});}
 }
 menuButton.addEventListener('click',()=>setMenu(!menuOpen));
 menuBackdrop.addEventListener('click',()=>setMenu(false,true));
 document.addEventListener('keydown',event=>{
  if(!menuOpen)return;
  if(event.key==='Escape'){event.preventDefault();setMenu(false,true);}
  if(event.key==='Tab'){
   const controls=$$('.site-nav a,.site-nav button,#siteMenu a');
   const first=controls[0],last=controls.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
 });
 document.addEventListener('click',event=>{
  const anchor=event.target.closest('a[href^="#"]');
  if(!anchor||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const target=document.getElementById(anchor.hash.slice(1));if(!target)return;
  setMenu(false);
  const disclosure=target.closest('details');if(disclosure)disclosure.open=true;
  if(target.id==='contactForm'){
   event.preventDefault();history.replaceState(null,'','#contactForm');
   target.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
   $('#contactName').focus({preventScroll:true});return;
  }
  if(!target.hasAttribute('tabindex'))target.tabIndex=-1;target.focus({preventScroll:true});
 });
 if('IntersectionObserver' in window){
  const navSections=$$('main>section[id]');
  const navObserver=new IntersectionObserver(()=>{
   const current=navSections.filter(s=>s.getBoundingClientRect().top<innerHeight*.45).at(-1);
   const id=current?.id==='skills'?'stats':current?.id||'hero';
   $$('.menu-links a').forEach(a=>{if(a.hash==='#'+id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  },{rootMargin:'-10% 0px -45% 0px',threshold:[0,.2,.8]});
  navSections.forEach(s=>navObserver.observe(s));
 }

 // Masked lines and short staggered entrances, with readable static fallbacks.
 $('#hero-heading').classList.add('reveal-fade-up');
 $$('.skills-simple,.project-table,.about-facts,.contact-draft').forEach(el=>el.classList.add('reveal-fade-up'));
 $$('.section-label-wrapper').forEach(el=>el.style.setProperty('--reveal-delay','0ms'));
 $$('.project-grid,.toolkit-grid,.stats-grid,.follow-grid').forEach(group=>{
  [...group.children].forEach((item,i)=>item.style.setProperty('--reveal-delay',`${i%2*100}ms`));
 });
 $$('.text-section,.contact-heading,#hero-heading').forEach(heading=>{
  const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT),nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  let index=0;
  nodes.forEach(node=>{
   const fragment=document.createDocumentFragment();
   node.textContent.split(/(\s+)/).forEach(word=>{
    if(!word.trim()){fragment.append(document.createTextNode(word));return;}
    const mask=document.createElement('span'),inner=document.createElement('span');
    mask.className='title-mask';inner.className='title-word';inner.textContent=word;
    inner.style.setProperty('--word-delay',`${index++*55}ms`);mask.append(inner);fragment.append(mask);
   });node.replaceWith(fragment);
  });
 });
 const reveals=$$('.reveal-fade-up');
 function revealViewport(){reveals.forEach(el=>{const box=el.getBoundingClientRect();if(box.top<innerHeight*.96&&box.bottom>0)el.classList.add('is-visible');});}
 window.addEventListener('portfolio:ready',revealViewport);
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(!entry.isIntersecting||root.classList.contains('is-booting'))return;entry.target.classList.add('is-visible');observer.unobserve(entry.target);
  }),{threshold:.06,rootMargin:'0px 0px -5% 0px'});
  reveals.forEach(el=>observer.observe(el));
 }else reveals.forEach(el=>el.classList.add('is-visible'));

 // Shared depth belongs to real content. Touch, reduced motion, and focused controls stay level.
 const depthSurfaces=$$('.about-photo,.stat-item,.hire-invite,.follow-card,.contact-draft');
 depthSurfaces.forEach(surface=>{
  surface.classList.add('depth-surface');surface.parentElement.classList.add('depth-stage');
  surface.addEventListener('pointermove',event=>{
   if(reduced||!fine.matches||surface.contains(document.activeElement))return;
   const bounds=surface.getBoundingClientRect(),nx=(event.clientX-bounds.left)/bounds.width-.5,ny=(event.clientY-bounds.top)/bounds.height-.5;
   surface.style.setProperty('--surface-x',((nx+.5)*100).toFixed(1)+'%');surface.style.setProperty('--surface-y',((ny+.5)*100).toFixed(1)+'%');
   const angle=Math.min(3,Math.hypot(nx,ny)*5);
   surface.style.setProperty('--surface-rotation',`${(-ny).toFixed(3)} ${nx.toFixed(3)} 0 ${angle.toFixed(2)}deg`);
  },{passive:true});
  surface.addEventListener('pointerleave',()=>surface.style.setProperty('--surface-rotation','0deg'));
 });

 // One demand-driven scheduler for progress, hero field and counters.
 const hero=$('#hero'),visual=$('.hero-visual'),canvas=$('#heroField'),ctx=canvas.getContext('2d');
 let raf=0,scrollY=window.scrollY,heroHeight=1,heroWidth=1,travel=1,heroInView=true;
 let pointerX=0,pointerY=0,fieldStart=performance.now(),resizeTimer=0,heroProgress=0,heroMotionTime=0;
 const activeCounters=new Set();
 const counters=$$('[data-count]').map(node=>({node,target:Number(node.dataset.count),start:0,done:false}));
 function requestFrame(){if(!raf&&!document.hidden)raf=requestAnimationFrame(render);}
 function drawField(time){
  if(!ctx)return;
  const phase=reduced?0:Math.min(4800,time-fieldStart)*.00013+clamp(scrollY/heroHeight)*.7;
  ctx.clearRect(0,0,heroWidth,heroHeight);
  ctx.strokeStyle='rgba(238,226,198,.12)';ctx.lineWidth=.65;
  // Discrete signal paths replace the borrowed wave motif.
  for(let i=0;i<5;i++){
   const x=heroWidth*(.57+i*.065),y=heroHeight*(.12+i*.04),reach=heroHeight*(.58+i*.035);
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,reach*.6);ctx.lineTo(x+heroWidth*.035,reach*.6+24);ctx.lineTo(x+heroWidth*.035,reach);ctx.stroke();
  }
  for(let i=0;i<22;i++){
   const fx=(Math.sin(i*32.13)*.5+.5),fy=(Math.cos(i*17.37)*.5+.5);
   const x=fx*heroWidth+Math.sin(phase+i)*4+pointerX*.5,y=fy*heroHeight+Math.cos(phase+i)*4+pointerY*.5;
   ctx.fillStyle=`rgba(238,226,198,${.08+(i%4)*.035})`;ctx.fillRect(x,y,i%4===0?2:1,i%4===0?2:1);
  }
 }
 function render(time){
  raf=0;$('#scrollProgress').style.transform=`scaleX(${clamp(scrollY/travel)})`;
  const runningField=!reduced&&heroInView&&!modal.open&&!root.classList.contains('webgl-motion-ready')&&time-fieldStart<4800;
  let heroMoving=false;
  if(heroInView){
   const heroTarget=reduced?0:clamp(scrollY/(heroHeight*.78));
   const heroDt=Math.min(40,heroMotionTime?time-heroMotionTime:16.67);heroMotionTime=time;
   heroProgress=reduced||Math.abs(heroTarget-heroProgress)<.0004?heroTarget:heroProgress+(heroTarget-heroProgress)*(1-Math.pow(.8,heroDt/16.67));
   heroMoving=Math.abs(heroTarget-heroProgress)>=.0004;
   hero.style.setProperty('--hero-progress',heroProgress.toFixed(4));
   hero.style.setProperty('--hero-tilt-x',reduced?'0deg':`${(-pointerY*1.4).toFixed(2)}deg`);
   hero.style.setProperty('--hero-tilt-y',reduced?'0deg':`${(pointerX*1.7).toFixed(2)}deg`);
   visual.style.setProperty('--hero-x',reduced?'0px':`${pointerX.toFixed(2)}px`);
   visual.style.setProperty('--hero-y',reduced?'0px':`${pointerY.toFixed(2)}px`);
   if(!root.classList.contains('webgl-motion-ready'))drawField(time);
  }
  activeCounters.forEach(item=>{
   if(!item.start)item.start=time;
   const p=reduced?1:clamp((time-item.start)/900);
   item.node.textContent=String(Math.round(item.target*(1-Math.pow(1-p,3))));
   if(p===1){item.done=true;activeCounters.delete(item);}
  });
  const axisMoving=reduced?false:renderAxis(time);
  if(runningField||activeCounters.size||axisMoving||heroMoving)requestFrame();
 }
 if('IntersectionObserver' in window){
  const counterObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(!entry.isIntersecting)return;
   const item=counters.find(c=>c.node===entry.target);if(item&&!item.done)activeCounters.add(item);
   counterObserver.unobserve(entry.target);requestFrame();
  }),{threshold:.5});counters.forEach(c=>counterObserver.observe(c.node));
  const heroObserver=new IntersectionObserver(entries=>{
   heroInView=entries[0].isIntersecting;heroMotionTime=0;root.classList.toggle('motion-paused',!heroInView||document.hidden||modal.open);requestFrame();
  },{threshold:.01});heroObserver.observe(hero);
 }
 function measure(){
  scrollY=window.scrollY;heroHeight=hero.offsetHeight;heroWidth=hero.clientWidth;travel=Math.max(1,root.scrollHeight-innerHeight);
  if(ctx){const ratio=Math.min(1.5,devicePixelRatio||1);canvas.width=Math.round(heroWidth*ratio);canvas.height=Math.round(heroHeight*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);}
  measureAxis();requestFrame();
 }
 window.addEventListener('scroll',()=>{scrollY=window.scrollY;hoverPreview.classList.remove('is-active');requestFrame();},{passive:true});
 window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(measure,90);},{passive:true});
 hero.addEventListener('pointermove',event=>{
  if(reduced||!fine.matches)return;pointerX=(event.clientX/innerWidth-.5)*6;pointerY=(event.clientY/innerHeight-.5)*5;requestFrame();
 },{passive:true});
 hero.addEventListener('pointerleave',()=>{pointerX=pointerY=0;requestFrame();});
 document.addEventListener('visibilitychange',()=>{
  root.classList.toggle('motion-paused',document.hidden||!heroInView||modal.open);
  if(document.hidden){cancelAnimationFrame(raf);raf=0;activeCounters.forEach(c=>{c.node.textContent=String(c.target);c.done=true;});activeCounters.clear();}else requestFrame();
 });

 // Five real projects, rotating around one user-controlled vertical axis.
 const axisRoot=$('#projectAxis'),axisGallery=$('#axisGallery'),axisRing=$('#axisRing');
 const projectPanels=$$('.project-card',axisRoot),axisFaces=[],axisChoices=[];
 const axisStep=360/projectPanels.length;
 const axis={enabled:false,inView:false,rotation:0,target:0,velocity:0,wheeling:false,wheelTimer:0,active:-1,announced:-1,drag:null,lastFrame:0,suppressClickUntil:0,cardWidth:320};
 projectPanels.forEach((panel,index)=>{
  const title=$('h3',panel).textContent.trim();
  const face=document.createElement('div');face.className='axis-face';face.dataset.index=String(index);face.setAttribute('role','group');face.setAttribute('aria-label',`${index+1} of ${projectPanels.length}`);
  const screen=document.createElement('button');screen.type='button';screen.className='axis-screen';screen.tabIndex=-1;
  const image=$('.project-image-wrap img',panel).cloneNode();image.alt='';image.draggable=false;image.loading='eager';image.decoding='async';
  const label=document.createElement('span');label.className='axis-screen-label';
  const number=document.createElement('span');number.textContent=String(index+1).padStart(2,'0');const name=document.createElement('span');name.textContent=title;
  label.append(number,name);screen.append(image,label);face.append(screen);axisRing.append(face);axisFaces.push(face);
  const choice=document.createElement('button');choice.type='button';choice.setAttribute('aria-pressed','false');
  const choiceNumber=document.createElement('span');choiceNumber.textContent=String(index+1).padStart(2,'0');const choiceName=document.createElement('span');choiceName.className='axis-name';choiceName.textContent=title;
  choice.append(choiceNumber,choiceName);choice.addEventListener('click',()=>rotateProject(index));$('#axisSelector').append(choice);axisChoices.push(choice);
  screen.addEventListener('click',()=>{if(performance.now()<axis.suppressClickUntil)return;if(axis.active!==index)rotateProject(index);else focusProject();});
 });
 const wrapIndex=index=>((index%projectPanels.length)+projectPanels.length)%projectPanels.length;
 function focusProject(){const heading=$('h3',projectPanels[Math.max(0,axis.active)]);heading.tabIndex=-1;heading.focus({preventScroll:true});}
 function selectProject(index){
  if(axis.active===index)return;
  const oldFocused=projectPanels.find(panel=>panel.contains(document.activeElement));
  if(oldFocused&&oldFocused!==projectPanels[index])axisGallery.focus({preventScroll:true});
  axis.active=index;
  projectPanels.forEach((panel,i)=>{panel.hidden=i!==index;panel.classList.toggle('is-axis-current',i===index);});
  axisFaces.forEach((face,i)=>{const active=i===index;face.classList.toggle('is-front',active);face.inert=false;face.setAttribute('aria-hidden',String(!active));$('.axis-screen',face).tabIndex=active?0:-1;axisChoices[i].setAttribute('aria-pressed',String(active));});
  $('#axisPosition').textContent=`${String(index+1).padStart(2,'0')} / ${String(projectPanels.length).padStart(2,'0')}`;
 }
 function rotateProject(index){
  if(!axis.enabled)return;
  clearTimeout(axis.wheelTimer);axis.wheeling=false;
  const current=Math.round(-axis.target/axisStep);let difference=wrapIndex(index)-wrapIndex(current);
  if(difference>projectPanels.length/2)difference-=projectPanels.length;
  if(difference<-projectPanels.length/2)difference+=projectPanels.length;
  axis.target=-(current+difference)*axisStep;axisRoot.classList.add('is-rotating');requestFrame();
 }
 function measureAxis(){
  if(!axis.enabled)return;
  axis.cardWidth=Math.min(innerWidth<=900?330:420,axisGallery.clientWidth*(innerWidth <= 767 ? .78 : .68));
  const cardHeight=axis.cardWidth*.625+59;
  const radius=axis.cardWidth/2/Math.tan(Math.PI/projectPanels.length)*1.12;
  axisRing.style.setProperty('--axis-card-width',`${axis.cardWidth}px`);axisRing.style.setProperty('--axis-card-height',`${cardHeight}px`);axisRing.style.setProperty('--axis-radius',`${radius}px`);
  axisFaces.forEach((face,i)=>face.style.transform=`rotateY(${i*axisStep}deg) translateZ(${radius}px)`);
 }
 function paintAxis(){
  axisRing.style.setProperty('--axis-rotation',`${axis.rotation.toFixed(3)}deg`);
  axisFaces.forEach((face,index)=>{
   const angle=Math.abs(((index*axisStep+axis.rotation+180)%360+360)%360-180);
   face.style.opacity=angle>=95?'0':String(.18+.82*Math.pow(Math.max(0,Math.cos(angle*Math.PI/180)),1.25));
   face.style.pointerEvents=angle<88?'auto':'none';
  });
 }
 function renderAxis(time){
  if(!axis.enabled||!axis.inView||modal.open){axis.lastFrame=0;return false;}
  const dt=Math.min(.05,axis.lastFrame?(time-axis.lastFrame)/1000:1/60);axis.lastFrame=time;
  if(!axis.drag){
   // Analytic critically damped spring: preserves momentum without frame-rate-dependent overshoot.
   const omega=axis.wheeling?22:14,offset=axis.rotation-axis.target;
   const decay=Math.exp(-omega*dt),step=(axis.velocity+omega*offset)*dt;
   axis.rotation=axis.target+(offset+step)*decay;axis.velocity=(axis.velocity-omega*step)*decay;
   if(Math.abs(axis.target-axis.rotation)<.015&&Math.abs(axis.velocity)<.15){axis.rotation=axis.target;axis.velocity=0;}
  }
  const moving=!axis.drag&&(Math.abs(axis.target-axis.rotation)>.015||Math.abs(axis.velocity)>.15);
  if(!moving&&!axis.drag&&!axis.wheeling&&Math.abs(axis.rotation)>720){const turns=Math.round(axis.rotation/360)*360;axis.rotation-=turns;axis.target-=turns;}
  axisRoot.classList.toggle('is-rotating',moving||Boolean(axis.drag?.moved)||axis.wheeling);
  paintAxis();selectProject(wrapIndex(Math.round(-axis.rotation/axisStep)));
  axisRing.style.willChange=moving||axis.drag?'transform':'auto';
  if(!moving&&!axis.drag&&!axis.wheeling&&axis.announced!==axis.active){axis.announced=axis.active;$('#axisAnnouncement').textContent=`Project ${axis.active+1} of ${projectPanels.length}: ${$('h3',projectPanels[axis.active]).textContent.trim()}`;}
  return moving;
 }
 function setAxisEnabled(enabled){
  const next=enabled&&projectPanels.length>=3&&'IntersectionObserver' in window&&CSS.supports('transform-style','preserve-3d');
  if(next===axis.enabled)return;
  clearTimeout(axis.wheelTimer);axis.wheeling=false;
  if(axis.drag&&axisGallery.hasPointerCapture(axis.drag.id))axisGallery.releasePointerCapture(axis.drag.id);
  axis.enabled=next;axis.drag=null;axis.velocity=0;axis.lastFrame=0;axisGallery.classList.remove('is-dragging');axisRoot.classList.remove('is-rotating');axisRoot.classList.toggle('axis-ready',next);
  if(next){projectPanels.forEach(panel=>{panel.classList.remove('reveal-fade-up');panel.classList.add('is-visible');});axis.active=-1;selectProject(wrapIndex(Math.round(-axis.rotation/axisStep)));measureAxis();paintAxis();}
  else{
   const returnFocus=axisGallery.contains(document.activeElement)||$('.axis-controls',axisRoot).contains(document.activeElement);
   projectPanels.forEach(panel=>{panel.hidden=false;panel.classList.remove('is-axis-current');});
   if(returnFocus)focusProject();
  }
  requestFrame();
 }
 $('#axisPrev').addEventListener('click',()=>rotateProject(wrapIndex(Math.round(-axis.target/axisStep)-1)));
 $('#axisNext').addEventListener('click',()=>rotateProject(wrapIndex(Math.round(-axis.target/axisStep)+1)));
 axisGallery.addEventListener('keydown',event=>{
  if(!axis.enabled)return;const current=wrapIndex(Math.round(-axis.target/axisStep));
  if(!['ArrowLeft','ArrowRight','Home','End','Enter'].includes(event.key))return;event.preventDefault();
  if(event.key==='Enter')focusProject();else rotateProject(event.key==='Home'?0:event.key==='End'?projectPanels.length-1:wrapIndex(current+(event.key==='ArrowRight'?1:-1)));
 });
 axisGallery.addEventListener('pointerdown',event=>{
  if(!axis.enabled||event.button!==0||event.isPrimary===false||axis.drag)return;
  clearTimeout(axis.wheelTimer);axis.wheeling=false;axis.velocity=0;axis.target=axis.rotation;
  axis.drag={id:event.pointerId,x:event.clientX,y:event.clientY,base:axis.rotation,lastX:event.clientX,lastTime:event.timeStamp,velocity:0,moved:false};
  if(event.pointerType==='mouse')event.preventDefault();
 });
 window.addEventListener('pointermove',event=>{
  const drag=axis.drag;if(!drag||drag.id!==event.pointerId)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.moved){
   if(Math.abs(dy)>Math.abs(dx)*1.2&&Math.abs(dy)>8){axis.drag=null;axis.target=Math.round(axis.rotation/axisStep)*axisStep;requestFrame();return;}
   if(Math.abs(dx)<5)return;
   drag.moved=true;axisGallery.classList.add('is-dragging');axisGallery.focus({preventScroll:true});
   axisGallery.setPointerCapture(event.pointerId);
  }
  const sensitivity=axisStep*1.1/axis.cardWidth;
  const elapsed=Math.max(4,event.timeStamp-drag.lastTime);
  const speed=clamp((event.clientX-drag.lastX)/elapsed*sensitivity*1000,-900,900);
  drag.velocity=drag.velocity*.65+speed*.35;
  drag.lastX=event.clientX;drag.lastTime=event.timeStamp;
  axis.rotation=drag.base+dx*sensitivity;axis.target=axis.rotation;axis.velocity=0;
  requestFrame();
 },{passive:true});
 function finishAxisDrag(event){
  const drag=axis.drag;if(!drag||drag.id!==event.pointerId)return;
  axis.drag=null;axisGallery.classList.remove('is-dragging');
  if(axisGallery.hasPointerCapture(event.pointerId))axisGallery.releasePointerCapture(event.pointerId);
  const cancelled=event.type!=='pointerup';
  if(drag.moved){
   axis.suppressClickUntil=performance.now()+350;
   const speed=!cancelled&&event.timeStamp-drag.lastTime<100?drag.velocity:0;
   const projected=clamp(speed*.16,-axisStep*1.15,axisStep*1.15);
   axis.target=Math.round((axis.rotation+projected)/axisStep)*axisStep;
   axis.velocity=speed;requestFrame();
  }else{axis.target=Math.round(axis.rotation/axisStep)*axisStep;requestFrame();}
 }
 window.addEventListener('pointerup',finishAxisDrag);window.addEventListener('pointercancel',finishAxisDrag);
 axisGallery.addEventListener('lostpointercapture',event=>{if(event.target===axisGallery)finishAxisDrag(event);});
 axisGallery.addEventListener('dragstart',event=>event.preventDefault());
 axisGallery.addEventListener('wheel',event=>{
  if(!axis.enabled||axis.drag||event.ctrlKey)return;
  // Consume horizontal gestures only; vertical wheel and touch scrolling belong to the page.
  if(!event.shiftKey&&Math.abs(event.deltaX)<=Math.abs(event.deltaY))return;
  const raw=event.shiftKey&&Math.abs(event.deltaY)>Math.abs(event.deltaX)?event.deltaY:event.deltaX;
  if(Math.abs(raw)<.1)return;
  event.preventDefault();axis.wheeling=true;
  const unit=event.deltaMode===1?16:event.deltaMode===2?axisGallery.clientWidth:1;
  axis.target-=clamp(raw*unit,-180,180)*axisStep*2/axis.cardWidth;
  axis.velocity=0;requestFrame();clearTimeout(axis.wheelTimer);
  axis.wheelTimer=setTimeout(()=>{axis.wheeling=false;axis.target=Math.round(axis.target/axisStep)*axisStep;requestFrame();},150);
 },{passive:false});
 if('IntersectionObserver' in window){const axisObserver=new IntersectionObserver(entries=>{axis.inView=entries[0].isIntersecting;axis.lastFrame=0;if(axis.inView)requestFrame();},{rootMargin:'80px 0px'});axisObserver.observe(axisGallery);}

 // A source-linked project index with pointer-only screenshot previews.
 const hoverPreview=$('.project-hover-preview'),hoverImage=$('#hoverPreviewImage');
 $$('.project-table tbody tr').forEach(row=>{
  row.addEventListener('pointerenter',()=>{
   if(reduced||!fine.matches)return;hoverImage.src=row.dataset.projectImage;hoverPreview.classList.add('is-active');
  });
  row.addEventListener('pointermove',event=>{
   if(reduced||!fine.matches)return;
   hoverPreview.classList.add('is-active');
   const x=clamp(event.clientX+24,12,innerWidth-312),y=clamp(event.clientY-140,100,innerHeight-200);
   hoverPreview.style.transform=`translate3d(${x}px,${y}px,0)`;
  },{passive:true});
  row.addEventListener('pointerleave',()=>hoverPreview.classList.remove('is-active'));
 });
 fine.addEventListener('change',()=>{pointerX=pointerY=0;hoverPreview.classList.remove('is-active');requestFrame();});

 // The existing light-theme SevaRecover build, inside a native dialog.
 const modal=$('#projectModal'),frame=$('#previewFrame');let modalTrigger=null,modalOverflow='';
 const boundFrames=new WeakSet();
 function closePreview(){
  if(!modal.open)return;modal.close();frame.src='about:blank';root.style.overflow=modalOverflow;
  root.classList.toggle('motion-paused',document.hidden||!heroInView);
  if(modalTrigger?.isConnected)modalTrigger.focus({preventScroll:true});requestFrame();
 }
 $$('[data-preview]').forEach(link=>link.addEventListener('click',event=>{
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||typeof modal.showModal!=='function')return;
  event.preventDefault();setMenu(false);modalTrigger=link;$('#previewTitle').textContent=link.dataset.previewTitle;
  frame.title=link.dataset.previewTitle+' interactive preview';$('#previewExternal').href=link.dataset.preview;
  $$('.preview-devices button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===0)));frame.style.width='100%';
  modalOverflow=root.style.overflow;root.style.overflow='hidden';modal.showModal();root.classList.add('motion-paused');frame.src=link.dataset.preview;$('#closePreview').focus();
 }));
 $('#closePreview').addEventListener('click',closePreview);
 modal.addEventListener('cancel',event=>{event.preventDefault();closePreview();});
 modal.addEventListener('click',event=>{if(event.target!==modal)return;const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closePreview();});
 $$('.preview-devices button').forEach(button=>button.addEventListener('click',()=>{
  $$('.preview-devices button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));frame.style.width=button.dataset.width;
 }));
 function bindFrameEscape(){
  if(!modal.open)return;
  try{const doc=frame.contentDocument;if(!doc||boundFrames.has(doc))return;boundFrames.add(doc);doc.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closePreview();}});}catch{/* Cross-origin frames use the visible close control. */}
 }
 frame.addEventListener('load',bindFrameEscape);
 frame.addEventListener('focus',bindFrameEscape);
 window.addEventListener('blur',bindFrameEscape);

 // Contact actions remain usable without an installed desktop mail handler.
 let draftText='';
 async function copyText(value,button,status,success){
  try{await navigator.clipboard.writeText(value);button.textContent='Copied ✓';status.textContent=success;setTimeout(()=>{button.textContent=button.id==='copyHireEmail'?'Copy email ⧉':'Copy message ⧉';},2200);}
  catch{status.textContent='Select and copy the text below.';const field=document.createElement('textarea');field.className='copy-fallback';field.value=value;field.readOnly=true;field.setAttribute('aria-label','Text to copy');button.after(field);field.focus();field.select();}
 }
 $('#copyHireEmail').addEventListener('click',()=>copyText('shivanshushukla2602@gmail.com',$('#copyHireEmail'),$('#copyEmailStatus'),'Email address copied.'));
 $('#copyDraft').addEventListener('click',()=>copyText(draftText,$('#copyDraft'),$('#formStatus'),'Message copied.'));
 // Preparing a draft never sends a message.

 $('#contactForm').addEventListener('submit',event=>{
  event.preventDefault();const name=$('#contactName'),email=$('#contactEmail'),message=$('#contactMessage');
  name.setCustomValidity(name.value.trim()?'':'Enter your name.');
  message.setCustomValidity(message.value.trim().length>=20?'':'Please write at least 20 characters.');
  if(!event.currentTarget.reportValidity())return;
  const subject='Portfolio enquiry from '+name.value.trim(),body=`Name: ${name.value.trim()}\nEmail: ${email.value.trim()}\n\n${message.value.trim()}`;
  const link=$('#emailDraftLink');link.href=`mailto:shivanshushukla2602@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;$('#gmailDraftLink').href=`https://mail.google.com/mail/?view=cm&fs=1&to=shivanshushukla2602%40gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  draftText=`To: shivanshushukla2602@gmail.com\nSubject: ${subject}\n\n${body}`;
  $('#draftActions').hidden=false;
  $('#formStatus').textContent='Your message is ready. Choose an email option below, or copy it.';
 });
 $$('#contactForm input,#contactForm textarea').forEach(input=>input.addEventListener('input',()=>input.setCustomValidity('')));

 function applyMotion(){
  reduced=motion.matches;root.classList.toggle('motion-reduced',reduced);
  window.dispatchEvent(new CustomEvent('portfolio:motion-change',{detail:{reduced}}));
  if(reduced){reveals.forEach(el=>el.classList.add('is-visible'));counters.forEach(c=>{c.node.textContent=String(c.target);c.done=true;});activeCounters.clear();pointerX=pointerY=0;hoverPreview.classList.remove('is-active');}
  else fieldStart=performance.now();setAxisEnabled(!reduced);requestFrame();
 }
 motion.addEventListener('change',applyMotion);
 // Loading tracks the critical image and fonts, with a short presentation and a hard escape hatch.
 function startPortfolioIntro(){
  const loader=$('#portfolioLoader');
  if(!root.classList.contains('is-booting')){loader.hidden=true;return;}
  const began=performance.now();let done=false,completing=false,completed=0;
  loader.setAttribute('aria-hidden','false');
  const blocked=$$('.site-nav,main,.site-footer,.skip-link');
  blocked.forEach(el=>{if(!el.inert){el.inert=true;el.setAttribute('data-boot-inert','');}});
  function progress(value){loader.style.setProperty('--load-progress',String(value));$('#loaderNumber').textContent=String(Math.round(value*100)).padStart(2,'0');}
  function release(){
   if(done)return;done=true;clearTimeout(window.__portfolioBootGuard);clearTimeout(deadline);
   root.classList.remove('is-booting');loader.hidden=true;loader.setAttribute('aria-hidden','true');
   blocked.forEach(el=>{if(el.hasAttribute('data-boot-inert')){el.inert=false;el.removeAttribute('data-boot-inert');}});
   if(loader.contains(document.activeElement))$('.site-nav .brand-wordmark').focus({preventScroll:true});
   window.dispatchEvent(new Event('portfolio:ready'));measure();
  }
  function finish(skip=false){
   if(done)return;
   if(skip||reduced){release();return;}
   if(completing)return;completing=true;
   progress(1);$('#loaderStatus').textContent='Portfolio ready.';
   const delay=Math.max(0,1050-(performance.now()-began));
   setTimeout(()=>{if(done)return;loader.classList.add('is-leaving');window.dispatchEvent(new Event('portfolio:ready'));setTimeout(release,680);},delay);
  }
  const deadline=setTimeout(()=>finish(true),3000);
  $('#skipLoader').addEventListener('click',()=>finish(true));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!done)release();});
  motion.addEventListener('change',event=>{if(event.matches)release();});
  window.addEventListener('pagehide',release,{once:true});
  const heroImage=$('.hero-portrait');
  const critical=[document.fonts?document.fonts.ready:Promise.resolve(),heroImage?.decode?heroImage.decode():Promise.resolve()];
  critical.forEach(asset=>Promise.resolve(asset).catch(()=>{}).finally(()=>{if(done)return;progress(++completed/critical.length);if(completed===critical.length)finish();}));
 }
 $('#currentYear').textContent=String(new Date().getFullYear());
 root.classList.add('motion-ready');applyMotion();measure();startPortfolioIntro();
 if(document.fonts)document.fonts.ready.then(measure);window.addEventListener('load',measure,{once:true});
})();
