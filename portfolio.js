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
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(!entry.isIntersecting)return;entry.target.classList.add('is-visible');observer.unobserve(entry.target);
  }),{threshold:.06,rootMargin:'0px 0px 36px 0px'});
  reveals.forEach(el=>observer.observe(el));
 }else reveals.forEach(el=>el.classList.add('is-visible'));

 // A keyboard-accessible skills directory; all panels remain readable without JS.
 const skillsWorkspace=$('#skillsWorkspace'),skillsNav=$('#skillsNav');
 const skillPanels=$$('.skill-panel',skillsWorkspace),skillTabs=[];
 skillsNav.setAttribute('role','tablist');skillsNav.setAttribute('aria-orientation','vertical');
 function selectSkill(index,moveFocus=false){
  skillPanels.forEach((panel,i)=>{panel.hidden=i!==index;skillTabs[i].setAttribute('aria-selected',String(i===index));skillTabs[i].tabIndex=i===index?0:-1;});
  if(moveFocus){skillTabs[index].focus({preventScroll:true});skillTabs[index].scrollIntoView({block:'nearest',inline:'nearest',behavior:reduced?'instant':'smooth'});}
 }
 skillPanels.forEach((panel,index)=>{
  const button=document.createElement('button');button.type='button';button.id='skill-tab-'+index;button.setAttribute('role','tab');button.setAttribute('aria-controls',panel.id);
  const number=document.createElement('span');number.className='skill-tab-number';number.setAttribute('aria-hidden','true');number.textContent=String(index+1).padStart(2,'0');
  const name=document.createElement('span');name.className='skill-tab-name';name.textContent=panel.dataset.skillName;
  const arrow=document.createElement('span');arrow.className='skill-tab-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';
  button.append(number,name,arrow);skillsNav.append(button);skillTabs.push(button);
  panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.tabIndex=0;
  button.addEventListener('click',()=>selectSkill(index));
  button.addEventListener('keydown',event=>{
   if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();
   const next=event.key==='Home'?0:event.key==='End'?skillTabs.length-1:(index+(['ArrowDown','ArrowRight'].includes(event.key)?1:-1)+skillTabs.length)%skillTabs.length;
   selectSkill(next,true);
  });
 });
 $('.skills-directory',skillsWorkspace).hidden=false;skillsWorkspace.classList.add('is-interactive');selectSkill(0);
 const skillsMobile=matchMedia('(max-width:767px)');
 function orientSkills(){skillsNav.setAttribute('aria-orientation',skillsMobile.matches?'horizontal':'vertical');}
 skillsMobile.addEventListener('change',orientSkills);orientSkills();

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
  const runningField=!reduced&&heroInView&&!modal.open&&time-fieldStart<4800;
  let heroMoving=false;
  if(heroInView){
   const heroTarget=reduced?0:clamp(scrollY/(heroHeight*.78));
   const heroDt=Math.min(40,heroMotionTime?time-heroMotionTime:16.67);heroMotionTime=time;
   heroProgress=reduced||Math.abs(heroTarget-heroProgress)<.0004?heroTarget:heroProgress+(heroTarget-heroProgress)*(1-Math.pow(.8,heroDt/16.67));
   heroMoving=Math.abs(heroTarget-heroProgress)>=.0004;
   hero.style.setProperty('--hero-progress',heroProgress.toFixed(4));
   visual.style.setProperty('--hero-x',reduced?'0px':`${pointerX.toFixed(2)}px`);
   visual.style.setProperty('--hero-y',reduced?'0px':`${pointerY.toFixed(2)}px`);
   drawField(time);
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
 const axis={enabled:false,inView:false,rotation:0,target:0,active:-1,announced:-1,drag:null,lastFrame:0,suppressClickUntil:0,cardWidth:320};
 projectPanels.forEach((panel,index)=>{
  const title=$('h3',panel).textContent.trim();
  const face=document.createElement('div');face.className='axis-face';face.dataset.index=String(index);face.setAttribute('role','group');face.setAttribute('aria-label',`${index+1} of ${projectPanels.length}`);
  const screen=document.createElement('button');screen.type='button';screen.className='axis-screen';screen.tabIndex=-1;
  const image=$('.project-image-wrap img',panel).cloneNode();image.alt='';image.draggable=false;image.loading='lazy';
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
  axisFaces.forEach((face,i)=>{const active=i===index;face.classList.toggle('is-front',active);face.inert=!active;face.setAttribute('aria-hidden',String(!active));$('.axis-screen',face).tabIndex=active?0:-1;axisChoices[i].setAttribute('aria-pressed',String(active));});
  $('#axisPosition').textContent=`${String(index+1).padStart(2,'0')} / ${String(projectPanels.length).padStart(2,'0')}`;
 }
 function rotateProject(index){
  if(!axis.enabled)return;
  const current=Math.round(-axis.target/axisStep);let difference=wrapIndex(index)-wrapIndex(current);
  if(difference>projectPanels.length/2)difference-=projectPanels.length;
  if(difference<-projectPanels.length/2)difference+=projectPanels.length;
  axis.target=-(current+difference)*axisStep;requestFrame();
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
   face.style.opacity=angle>=105?'0':String(.14+.86*Math.pow(Math.max(0,Math.cos(angle*Math.PI/180)),1.4));
  });
 }
 function renderAxis(time){
  if(!axis.enabled||!axis.inView||modal.open)return false;
  const dt=Math.min(40,axis.lastFrame?time-axis.lastFrame:16.67);axis.lastFrame=time;
  const delta=axis.target-axis.rotation;
  axis.rotation=Math.abs(delta)<.025?axis.target:axis.rotation+delta*(1-Math.pow(axis.drag ? .66 : .78,dt/16.67));
  paintAxis();selectProject(wrapIndex(Math.round(-axis.rotation/axisStep)));
  const moving=Math.abs(axis.target-axis.rotation)>.025;
  axisRing.style.willChange=moving?'transform':'auto';
  if(!moving&&!axis.drag&&axis.announced!==axis.active){axis.announced=axis.active;$('#axisAnnouncement').textContent=`Project ${axis.active+1} of ${projectPanels.length}: ${$('h3',projectPanels[axis.active]).textContent.trim()}`;}
  return moving;
 }
 function setAxisEnabled(enabled){
  const next=enabled&&projectPanels.length>=3&&'IntersectionObserver' in window&&CSS.supports('transform-style','preserve-3d');
  if(next===axis.enabled)return;
  axis.enabled=next;axis.drag=null;axis.lastFrame=0;axisRoot.classList.toggle('axis-ready',next);
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
  if(!axis.enabled||event.button!==0||axis.drag)return;
  axis.drag={id:event.pointerId,x:event.clientX,y:event.clientY,base:axis.rotation,lastX:event.clientX,lastTime:event.timeStamp,velocity:0,moved:false,onScreen:Boolean(event.target.closest('.axis-screen'))};
  axisGallery.setPointerCapture(event.pointerId);
 });
 axisGallery.addEventListener('pointermove',event=>{
  const drag=axis.drag;if(!drag||drag.id!==event.pointerId)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.moved&&Math.abs(dy)>Math.abs(dx)*1.2&&Math.abs(dy)>8){axis.drag=null;if(axisGallery.hasPointerCapture(event.pointerId))axisGallery.releasePointerCapture(event.pointerId);return;}
  if(Math.abs(dx)>8)drag.moved=true;if(!drag.moved)return;
  const sensitivity=axisStep*1.25/axis.cardWidth;
  drag.velocity=.6*drag.velocity+.4*(event.clientX-drag.lastX)/Math.max(1,event.timeStamp-drag.lastTime)*sensitivity;
  drag.lastX=event.clientX;drag.lastTime=event.timeStamp;axis.target=drag.base+dx*sensitivity;requestFrame();
 },{passive:true});
 function finishAxisDrag(event){
  const drag=axis.drag;if(!drag||drag.id!==event.pointerId)return;axis.drag=null;
  if(axisGallery.hasPointerCapture(event.pointerId))axisGallery.releasePointerCapture(event.pointerId);
  if(drag.moved){axis.suppressClickUntil=performance.now()+300;const momentum=event.timeStamp-drag.lastTime<100?clamp(drag.velocity*130,-axisStep*.6,axisStep*.6):0;axis.target=Math.round((axis.target+momentum)/axisStep)*axisStep;requestFrame();}
  else if(drag.onScreen&&event.type==='pointerup')focusProject();
 }
 axisGallery.addEventListener('pointerup',finishAxisDrag);axisGallery.addEventListener('pointercancel',finishAxisDrag);
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
   hoverPreview.style.transform=`translate3d(${x}px,${y}px,0) rotate(-2deg)`;
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
  if(reduced){reveals.forEach(el=>el.classList.add('is-visible'));counters.forEach(c=>{c.node.textContent=String(c.target);c.done=true;});activeCounters.clear();pointerX=pointerY=0;hoverPreview.classList.remove('is-active');}
  else fieldStart=performance.now();setAxisEnabled(!reduced);requestFrame();
 }
 motion.addEventListener('change',applyMotion);
 $('#currentYear').textContent=String(new Date().getFullYear());
 root.classList.add('motion-ready');applyMotion();measure();
 if(document.fonts)document.fonts.ready.then(measure);window.addEventListener('load',measure,{once:true});
})();
