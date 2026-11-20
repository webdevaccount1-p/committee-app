// ===== SETUP =====
let PIN = localStorage.getItem('committee_pin') || '1234';
let autoOn = localStorage.getItem('auto_reminder') !== 'OFF';
let lastReminder = localStorage.getItem('last_reminder') || 'Abhi nahi bheja';
let mubarakOn = localStorage.getItem('mubarak_auto') !== 'OFF';
let lastMubarak = localStorage.getItem('last_mubarak') || 'Abhi nahi bheji';

function getResetCalendar(){
  let labels=['December 2026','January 2027','February 2027','March 2027','April 2027','May 2027','June 2027','July 2027','August 2027','September 2027','October 2027','November 2027'];
  let dates=['2026-12-05','2027-01-05','2027-02-05','2027-03-05','2027-04-05','2027-05-05','2027-06-05','2027-07-05','2027-08-05','2027-09-05','2027-10-05','2027-11-05'];
  let cal={};
  for(let i=0;i<12;i++){
    if(i===0) cal[i]={label:labels[i],member:"Khalid Farooq",draw:1,date:dates[i],status:"Admin - Fixed"};
    else cal[i]={label:labels[i],member:"",draw:0,date:dates[i],status:"Khali - Draw Baaki"};
  }
  return cal;
}
let members = JSON.parse(localStorage.getItem('committee_members')) || [
  {name:"Khalid Farooq",draw:1,status:"Paid",phone:"0300-1234567",cDate:"2026-12-05",drawMonth:"December 2026",hasDrawn:true},
  {name:"Fatima Noor",draw:2,status:"Paid",phone:"",cDate:"",drawMonth:"",hasDrawn:false},
  {name:"Bilal Ahmed",draw:3,status:"Pending",phone:"",cDate:"",drawMonth:"",hasDrawn:false},
  {name:"Ayesha Siddique",draw:4,status:"Paid",phone:"",cDate:"",drawMonth:"",hasDrawn:false},
  {name:"Hassan Raza",draw:5,status:"Pending",phone:"",cDate:"",drawMonth:"",hasDrawn:false},
  {name:"Sana Malik",draw:6,status:"Paid",phone:"",cDate:"",drawMonth:"",hasDrawn:false},
  {name:"Usman Tariq",draw:7,status:"Paid",phone:"",cDate:"",drawMonth:"",hasDrawn:false},
  {name:"Zara Imran",draw:8,status:"Pending",phone:"",cDate:"",drawMonth:"",hasDrawn:false},
  {name:"Omar Farooq",draw:9,status:"Paid",phone:"",cDate:"",drawMonth:"",hasDrawn:false},
  {name:"Hira Qureshi",draw:10,status:"Paid",phone:"",cDate:"",drawMonth:"",hasDrawn:false},
  {name:"Ahmed Raza",draw:11,status:"Paid",phone:"",cDate:"",drawMonth:"",hasDrawn:false},
  {name:"Ali Khan",draw:12,status:"Paid",phone:"",cDate:"",drawMonth:"",hasDrawn:false}
];
if(!localStorage.getItem('calendar_reset_v2')){
  localStorage.setItem('committee_calendar',JSON.stringify(getResetCalendar()));
  localStorage.setItem('committee_members',JSON.stringify(members));
  localStorage.setItem('calendar_reset_v2','yes');
}
let calendar = JSON.parse(localStorage.getItem('committee_calendar')) || getResetCalendar();
let history = JSON.parse(localStorage.getItem('committee_history')) || [];
let proofs = JSON.parse(localStorage.getItem('committee_proofs')) || [];
let monthWinner = members[0];
let monthDate = "2026-12-05";
let loggedMember = null, tempProofImg = "";
let drawBoxes = JSON.parse(localStorage.getItem('draw_boxes')) || null;
if(!drawBoxes){
  drawBoxes=[];
  for(let i=0;i<members.length;i++){
    if(i===0) drawBoxes.push({boxNo:1,member:"Khalid Farooq",month:"December 2026",date:"2026-12-05",status:"disabled",openedBy:"Khalid Farooq"});
    else drawBoxes.push({boxNo:i+1,member:"",month:"",date:"",status:"closed",openedBy:""});
  }
  localStorage.setItem('draw_boxes',JSON.stringify(drawBoxes));
}
function save(){
  localStorage.setItem('committee_members',JSON.stringify(members));
  localStorage.setItem('committee_history',JSON.stringify(history));
  localStorage.setItem('committee_proofs',JSON.stringify(proofs));
  localStorage.setItem('committee_calendar',JSON.stringify(calendar));
  localStorage.setItem('draw_boxes',JSON.stringify(drawBoxes));
  render();
  saveToFirebase();
}
// ===== FIREBASE SYNC =====
async function saveToFirebase(){
  if(!window.db) return;
  try{
    await window.fb.setDoc(window.fb.doc(window.db,"committee","members"),{list:members});
    await window.fb.setDoc(window.fb.doc(window.db,"committee","calendar"),{data:calendar});
    await window.fb.setDoc(window.fb.doc(window.db,"committee","draw"),{boxes:drawBoxes});
    await window.fb.setDoc(window.fb.doc(window.db,"committee","history"),{list:history});
    await window.fb.setDoc(window.fb.doc(window.db,"committee","proofs"),{list:proofs});
  }catch(e){console.log("Firebase save error",e);}
}
function listenToFirebase(){
  if(!window.db) return;
  window.fb.onSnapshot(window.fb.doc(window.db,"committee","members"),(snap)=>{
    if(snap.exists()){
      let d=snap.data();
      if(d.list && JSON.stringify(d.list)!==JSON.stringify(members)){
        members=d.list;
        if(loggedMember){let f=members.find(m=>m.name===loggedMember.name); if(f) loggedMember=f;}
        render();
      }
    }
  });
  window.fb.onSnapshot(window.fb.doc(window.db,"committee","calendar"),(snap)=>{
    if(snap.exists()){let d=snap.data(); if(d.data){calendar=d.data; render();}}
  });
  window.fb.onSnapshot(window.fb.doc(window.db,"committee","draw"),(snap)=>{
    if(snap.exists()){let d=snap.data(); if(d.boxes){drawBoxes=d.boxes; renderDraw(); render();}}
  });
}
setTimeout(()=>{listenToFirebase();},1500);
// ===== NAV =====
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  let el=document.getElementById(id); if(el) el.classList.add('active');
  document.querySelectorAll('.nav span').forEach(s=>s.classList.remove('active'));
  let map={dashboardScreen:'navDashboard',drawScreen:'navDraw',membersScreen:'navMembers',paymentScreen:'navPayment',winnersScreen:'navWinners'};
  if(map[id]) document.getElementById(map[id]).classList.add('active');
  window.scrollTo({top:0}); if(id==='drawScreen') renderDraw();
}
function goToDraw(){document.getElementById('memberView').style.display='none';document.getElementById('adminView').style.display='block';showScreen('drawScreen');}
window.showScreen=showScreen; window.goToDraw=goToDraw;
// ===== AUTH =====
function switchTab(t){document.getElementById('tabAdmin').className=t==='admin'?'active':'';document.getElementById('tabMember').className=t==='member'?'active':'';document.getElementById('adminLogin').style.display=t==='admin'?'block':'none';document.getElementById('memberLogin').style.display=t==='member'?'block':'none';fillMemberLogin();}
function fillMemberLogin(){let s=document.getElementById('loginMemberSelect');s.innerHTML='';members.forEach((m,i)=>{let o=document.createElement('option');o.value=i;o.text=m.name+' - Draw #'+m.draw;s.appendChild(o);});}
function checkAdminPIN(){if(document.getElementById('pinInput').value===PIN){document.getElementById('lockScreen').style.display='none';document.getElementById('adminView').style.display='block';document.getElementById('memberView').style.display='none';}else document.getElementById('pinError').style.display='block';}
function checkMemberPIN(){let idx=document.getElementById('loginMemberSelect').value;let pin=document.getElementById('memberPin').value;let m=members[idx];if(pin===String(m.draw).padStart(4,'0')){loggedMember=m;document.getElementById('lockScreen').style.display='none';document.getElementById('memberView').style.display='block';document.getElementById('adminView').style.display='none';renderMemberView();}else document.getElementById('pinError').style.display='block';}
function logout(){document.getElementById('lockScreen').style.display='flex';document.getElementById('adminView').style.display='none';document.getElementById('memberView').style.display='none';fillMemberLogin();}
function changePIN(){let o=document.getElementById('oldPin').value,n=document.getElementById('newPin').value;if(o!==PIN){alert('Purana PIN ghalat hai');return;}if(n.length!==4){alert('Naya PIN 4 digits ka ho');return;}PIN=n;localStorage.setItem('committee_pin',PIN);alert('PIN change ho gaya!');closeModal('settingsModal');}
window.switchTab=switchTab; window.checkAdminPIN=checkAdminPIN; window.checkMemberPIN=checkMemberPIN; window.logout=logout; window.changePIN=changePIN;
// ===== DRAW =====
function renderDraw(){
  let grid=document.getElementById('drawGrid'); if(!grid) return; grid.innerHTML='';
  let myName=loggedMember?loggedMember.name:"Admin View";
  let iHaveOpened=loggedMember?(loggedMember.hasDrawn && loggedMember.draw!==1):false;
  if(loggedMember && loggedMember.draw===1) document.getElementById('drawMyInfo').innerText='Aap Admin hain - Box #1 December 2026 - Already Fixed hai.';
  else if(loggedMember && iHaveOpened) document.getElementById('drawMyInfo').innerText='✅ Aapne box khol liya! Mila: '+loggedMember.drawMonth+' - '+loggedMember.cDate+'. Baaki disable hain.';
  else if(loggedMember) document.getElementById('drawMyInfo').innerText='👋 '+loggedMember.name+', apni marzi ka koi 1 box click karo.';
  else document.getElementById('drawMyInfo').innerText='Admin view me ho. Member login kar ke Draw kholo.';
  drawBoxes.forEach((box,idx)=>{
    let div=document.createElement('div');let isAdminBox=idx===0,isMyBox=box.openedBy===myName,isTaken=box.status==='opened'&&!isMyBox;
    let disabled=false,label="",cls="";
    if(isAdminBox){cls='locked';label='🔒 Box #1<br>Khalid Farooq<br>December 2026<br>DISABLED';disabled=true;}
    else if(isMyBox){cls='opened';label='🎉 Box #'+box.boxNo+'<br>'+box.openedBy+'<br>⭐ '+box.month+'<br>'+box.date;}
    else if(isTaken){cls='taken';label='📦 Box #'+box.boxNo+'<br>'+box.openedBy+'<br>'+box.month+'<br>TAKEN';disabled=true;}
    else if(iHaveOpened){cls='disabled';label='📦 Box #'+box.boxNo+'<br>DISABLED<br>Aapne 1 box khol liya';disabled=true;}
    else{cls='';label='📦 Box #'+box.boxNo+'<br>Click kar ke Kholo<br>??? Random Month';}
    div.className='drawBox '+cls;div.innerHTML=label;
    if(!disabled && !isAdminBox && !isTaken) div.onclick=function(){openDrawBox(idx)};
    grid.appendChild(div);
  });
  let list=document.getElementById('drawResultsList');list.innerHTML='';
  drawBoxes.forEach(b=>{if(b.status==='opened'||b.status==='disabled') list.innerHTML+='<div class="row"><span>Box #'+b.boxNo+' - '+(b.openedBy||'-')+'</span><b>'+(b.month||'-')+'</b></div>';else list.innerHTML+='<div class="row"><span>Box #'+b.boxNo+' - Khali</span><b>Abhi nahi khola</b></div>';});
  let done=drawBoxes.filter(b=>b.status==='opened'||b.status==='disabled').length;
  document.getElementById('drawStatusText').innerText=done+' / '+drawBoxes.length+' boxes khul chuke hain.';
}
function openDrawBox(idx){
  if(!loggedMember){alert('Pehle Member Login karo!');return;}
  if(loggedMember.draw===1){alert('Admin ka Box #1 already December 2026 hai.');return;}
  if(loggedMember.hasDrawn){alert('Aapne pehle hi 1 box khol liya! Mila tha: '+loggedMember.drawMonth);return;}
  let box=drawBoxes[idx]; if(box.status!=='closed'){alert('Ye box pehle se khula hua hai!');return;}
  let takenMonths=drawBoxes.filter(b=>b.month).map(b=>b.month);let available=[];
  for(let i=1;i<12;i++){let cal=calendar[i];if(cal && cal.member==="" && !takenMonths.includes(cal.label)) available.push(cal);}
  if(!available.length){alert('Koi khali month nahi bacha!');return;}
  let randomCal=available[Math.floor(Math.random()*available.length)];
  let calIdx=Object.keys(calendar).find(k=>calendar[k].label===randomCal.label);
  if(confirm('Box #'+box.boxNo+' kholna hai?\n\nIsme Random Month hoga, wapas nahi hoga. Pakka?')){
    box.status='opened';box.openedBy=loggedMember.name;box.month=randomCal.label;box.date=randomCal.date;
    loggedMember.hasDrawn=true;loggedMember.drawMonth=randomCal.label;loggedMember.cDate=randomCal.date;
    let mi=members.findIndex(m=>m.name===loggedMember.name);if(mi>=0){members[mi].hasDrawn=true;members[mi].drawMonth=randomCal.label;members[mi].cDate=randomCal.date;}
    calendar[calIdx]={label:randomCal.label,member:loggedMember.name,draw:loggedMember.draw,date:randomCal.date,status:"Draw se Mila"};
    save();document.getElementById('drawResult').style.display='block';
    document.getElementById('drawResultTitle').innerText='🎉 Mubarak Ho '+loggedMember.name+'!';
    document.getElementById('drawResultText').innerText='Aapne Box #'+box.boxNo+' khola!\n\nAapko mila: '+randomCal.label+'\nDate: '+randomCal.date;
    renderDraw();render();alert('🎉 MUBARAK HO '+loggedMember.name+'!\n\nAapko mila: '+randomCal.label+'\nDate: '+randomCal.date);
  }
}
function shareDrawResult(){let m=loggedMember||monthWinner;window.open('https://wa.me/?text='+encodeURIComponent('🎲 DRAW RESULT!\n\n'+m.name+' ko mila: '+(m.drawMonth||'December 2026')+'\nDate: '+(m.cDate||'2026-12-05')+'\n\n- Admin Khalid Farooq'));}
function resetCalendarAndDraw(){
  if(!confirm('Calendar + Draw RESET karna hai?\n\nSab khali ho jayenge, sirf December 2026 me Admin rahega. Pakka?'))return;
  calendar=getResetCalendar();drawBoxes=[];
  for(let i=0;i<members.length;i++){if(i===0)drawBoxes.push({boxNo:1,member:"Khalid Farooq",month:"December 2026",date:"2026-12-05",status:"disabled",openedBy:"Khalid Farooq"});else drawBoxes.push({boxNo:i+1,member:"",month:"",date:"",status:"closed",openedBy:""});}
  members.forEach((m,i)=>{if(i===0){m.hasDrawn=true;m.drawMonth="December 2026";m.cDate="2026-12-05";}else{m.hasDrawn=false;m.drawMonth="";m.cDate="";}});
  localStorage.setItem('calendar_reset_v2','yes');save();alert('✅ RESET HO GAYA!');
}
window.renderDraw=renderDraw; window.openDrawBox=openDrawBox; window.shareDrawResult=shareDrawResult; window.resetCalendarAndDraw=resetCalendarAndDraw;
// ===== CALENDAR =====
function renderCalendar(){
  let ac=document.getElementById('adminCalendar');ac.innerHTML='';let mc=document.getElementById('mvCalendar');if(mc)mc.innerHTML='';
  for(let i=0;i<12;i++){let e=calendar[i];let isMine=loggedMember&&e.member===loggedMember.name;let isAdminMonth=i===0;
  let html='<div><b>'+e.label+'</b><br>'+(e.member?('🏆 '+e.member):'⚪ KHALI')+'<br>📅 '+e.date+'<br><small>'+(e.member?e.status:'Draw ke baad fill hoga')+'</small>'+(isAdminMonth?'<br><span style="background:#0A7A3A;color:#fff;padding:2px 6px;border-radius:6px;font-size:11px">ADMIN FIXED</span>':'')+(isMine?'<br><span style="background:#FFC107;padding:2px 6px;border-radius:6px;font-size:11px">⭐ AAPKI COMMITTEE</span>':'')+'</div>';
  let d1=document.createElement('div');d1.className='calItem'+(isAdminMonth?' current':'')+(isMine?' mine':'')+(!e.member?' empty':'');d1.innerHTML=html;ac.appendChild(d1);
  if(mc){let d2=document.createElement('div');d2.className='calItem'+(isAdminMonth?' current':'')+(isMine?' mine':'')+(!e.member?' empty':'');d2.innerHTML=html;mc.appendChild(d2);}}
  if(loggedMember){if(loggedMember.drawMonth)document.getElementById('mvMyMonthText').innerText='⭐ Aapki Committee: '+loggedMember.drawMonth+' - Date: '+loggedMember.cDate;else document.getElementById('mvMyMonthText').innerText='🎲 Aapne abhi Draw nahi khola!';}
}
function shareCalendar(){let txt='📅 COMMITTEE CALENDAR - Dec 2026 se Start\n\n';for(let i=0;i<12;i++){let e=calendar[i];txt+=e.label+': '+(e.member||'KHALLI - Draw Baaki')+' - '+e.date+'\n';}txt+='\nAdmin: Khalid Farooq\nJazzCash: 0300-1234567';window.open('https://wa.me/?text='+encodeURIComponent(txt));}
window.shareCalendar=shareCalendar;
// ===== COUNTDOWN / MUBARAKBAD =====
function getCountdown(t){let target=new Date(t+'T17:00:00');let now=new Date();let diff=target-now;if(diff<=0&&diff>-86400000)return{isToday:true,d:0,h:0,m:0,s:0};if(diff<0)return{isPast:true,d:0,h:0,m:0,s:0};return{isToday:false,isPast:false,d:Math.floor(diff/86400000),h:Math.floor((diff%86400000)/3600000),m:Math.floor((diff%3600000)/60000),s:Math.floor((diff%60000)/1000)};}
function mubarakText(m,amt){return '🎉🎉 MUBARAK HO '+m.name.toUpperCase()+'! 🎉🎉\n\n🌟 AAPKI COMMITTEE HAI! 🌟\n\n🏆 Draw #'+m.draw+'\n💰 Pot: '+amt.toLocaleString()+' PKR\n📅 Date: '+m.cDate+'\n\n- Admin Khalid Farooq';}
function updateCountdowns(){
  if(loggedMember){let m=members.find(x=>x.name===loggedMember.name)||loggedMember;if(!m.cDate){document.getElementById('mvCommitteeDate').innerText='Abhi Draw nahi khola';document.getElementById('mvCountdownMsg').innerText='Pehle Draw Screen par ja kar apna box kholo!';return;}let c=getCountdown(m.cDate);document.getElementById('mvCommitteeDate').innerText='Committee Date: '+new Date(m.cDate+'T17:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})+' - '+m.drawMonth;if(c.isToday){document.getElementById('mvCountdownMsg').innerText='🎉 AAJ AAPKI COMMITTEE HAI!';document.getElementById('mvMubarak').style.display='block';document.getElementById('mvMubarakName').innerText=m.name;document.getElementById('mvMubarakMsg').innerText='Aaj aapki committee hai! Pot: '+(members.length*10000).toLocaleString()+' PKR';}else if(c.isPast){document.getElementById('mvCountdownMsg').innerText='Aapki committee ho chuki hai.';}else{document.getElementById('mvD').innerText=c.d;document.getElementById('mvH').innerText=c.h;document.getElementById('mvM').innerText=c.m;document.getElementById('mvS').innerText=c.s;document.getElementById('mvCountdownMsg').innerText='Aapki committee me '+c.d+' din baaqi hain.';}}
  let ac=getCountdown(monthDate);document.getElementById('adminCommitteeDate').innerText='December 2026 Committee: Khalid Farooq - 5 December 2026';if(ac.isToday)document.getElementById('adminCountdownMsg').innerText='🎉 AAJ ADMIN KI COMMITTEE HAI!';else if(ac.isPast)document.getElementById('adminCountdownMsg').innerText='December committee ho gayi.';else{document.getElementById('adD').innerText=ac.d;document.getElementById('adH').innerText=ac.h;document.getElementById('adM').innerText=ac.m;document.getElementById('adS').innerText=ac.s;document.getElementById('adminCountdownMsg').innerText='Admin ki committee me '+ac.d+' din baaqi hain.';}
}
setInterval(updateCountdowns,1000);
function sendMubarakToCurrent(){window.open('https://wa.me/?text='+encodeURIComponent(mubarakText(members[0],members.length*10000)));}
function toggleMubarak(){mubarakOn=document.getElementById('mubarakAutoCheck').checked;localStorage.setItem('mubarak_auto',mubarakOn?'ON':'OFF');document.getElementById('mubarakStatus').innerText=mubarakOn?'ON ✅':'OFF ❌';}
function shareMyMubarak(){let m=loggedMember;window.open('https://wa.me/?text='+encodeURIComponent('🎉 Alhamdulillah! Meri committee: '+(m.drawMonth||'December 2026')+' - '+m.name));}
function toggleAuto(){autoOn=!autoOn;localStorage.setItem('auto_reminder',autoOn?'ON':'OFF');document.getElementById('autoStatus').innerText=autoOn?'ON ✅':'OFF ❌';}
function sendAutoReminder(m){alert('⏰ AUTO-REMINDER bhej diya!');window.open('https://wa.me/?text='+encodeURIComponent('⏰ MONTHLY AUTO-REMINDER\n\nAapki payment 10,000 PKR pending hai. 5th tak JazzCash 0300-1234567 par bhej dein.\n- Admin Khalid Farooq'));render();}
function showWithdrawal(){document.getElementById('withdrawalCard').style.display='block';alert('✅ Withdrawal Successful! 120,000 PKR Admin ko bhej diya!');}
function shareWithdrawal(){window.open('https://wa.me/?text='+encodeURIComponent('✅ Withdrawal Successful!\n\nAmount: 120,000 PKR\nWinner: Khalid Farooq - December 2026\nTransaction ID: JC-20261207\n- Admin Khalid Farooq'));}
function contactAdmin(){window.open('https://wa.me/?text='+encodeURIComponent('Assalam-o-Alaikum Admin, main '+loggedMember.name+' hoon.'));}
window.sendMubarakToCurrent=sendMubarakToCurrent; window.toggleMubarak=toggleMubarak; window.shareMyMubarak=shareMyMubarak; window.toggleAuto=toggleAuto; window.sendAutoReminder=sendAutoReminder; window.showWithdrawal=showWithdrawal; window.shareWithdrawal=shareWithdrawal; window.contactAdmin=contactAdmin;
// ===== MEMBERS + PAYMENT =====
function renderMemberView(){
  if(!loggedMember) return;let m=members.find(x=>x.name===loggedMember.name)||loggedMember;loggedMember=m;
  document.getElementById('mvMonthName').innerText='🏆 Khalid Farooq - Admin';document.getElementById('mvMonthDetail').innerText='December 2026 - Pot: '+(members.length*10000).toLocaleString()+' PKR - Date: 2026-12-05';
  document.getElementById('mvAvatar').innerText=m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();document.getElementById('mvName').innerText=m.name;document.getElementById('mvDraw').innerText='Draw #'+m.draw+' • Member';document.getElementById('mvPhone').innerText=m.phone||'';
  document.getElementById('mvMyMonthInfo').innerText=m.drawMonth?('⭐ Meri Committee: '+m.drawMonth+' - '+m.cDate):'🎲 Maine abhi Draw nahi khola - Draw Screen par jao!';
  let st=document.getElementById('mvStatus');st.innerText=m.status.toUpperCase();st.style.color=m.status==='Paid'?'#0A7A3A':'#FF8A00';
  document.getElementById('mvAmount').innerText=m.status==='Paid'?'Paid: 10,000 PKR ✅':'Pending: 10,000 PKR - 5th tak bhej dein';
  let myProof=proofs.filter(p=>p.member===m.name).slice(-1)[0];document.getElementById('mvProofStatus').innerText=myProof?('📸 Last Proof: '+myProof.status):'Abhi koi screenshot nahi.';
  let mh=document.getElementById('mvHistory');mh.innerHTML='';let myH=history.filter(h=>h.member===m.name);if(!myH.length)mh.innerHTML='<p>Abhi koi payment history nahi.</p>';myH.forEach(h=>{mh.innerHTML+='<div class="historyItem"><b>🧾 '+h.month+'</b> - '+h.amount.toLocaleString()+' PKR - '+h.method+'<br><small>'+h.date+'</small></div>'});updateCountdowns();renderCalendar();renderDraw();
}
function render(){
  fillMemberLogin();document.getElementById('autoStatus').innerText=autoOn?'ON ✅':'OFF ❌';document.getElementById('lastReminder').innerText=lastReminder;document.getElementById('mubarakStatus').innerText=mubarakOn?'ON ✅':'OFF ❌';document.getElementById('lastMubarak').innerText=lastMubarak;document.getElementById('mubarakAutoCheck').checked=mubarakOn;
  document.getElementById('monthName').innerText='🏆 Khalid Farooq - Admin';document.getElementById('monthDetail').innerText='December 2026 - Pot: '+(members.length*10000).toLocaleString()+' PKR - Date: 2026-12-05';
  let list=document.getElementById('memberList');list.innerHTML='';let paidCount=members.filter(m=>m.status==='Paid').length;let total=members.length*10000;let coll=paidCount*10000;let pct=total?Math.round(coll/total*100):0;
  document.getElementById('barFill').style.width=pct+'%';document.getElementById('collectedTxt').innerText=coll.toLocaleString()+' PKR collected of '+total.toLocaleString()+' PKR';document.getElementById('pctTxt').innerText=pct+'%';document.getElementById('statMembers').innerText=members.length;
  let sel=document.getElementById('payMember');sel.innerHTML='';let sel2=document.getElementById('payMemberModal');sel2.innerHTML='';
  members.forEach((m,i)=>{let initials=m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();let div=document.createElement('div');div.style.cssText='display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #eee';div.innerHTML='<div class="avatar '+(i===0?'gold':'')+'">'+initials+'</div><div style="flex:1"><b>'+m.name+'</b><br><small>Draw #'+m.draw+' • '+(m.drawMonth?('⭐ Committee: '+m.drawMonth):(i===0?'December 2026 - Admin Fixed':'🎲 Draw Baaki'))+'</small></div><span class="pill '+(m.status==='Paid'?'paid':'pending')+'">'+m.status+'</span>';let btnDiv=document.createElement('div');btnDiv.innerHTML='<button class="btn" onclick="whatsapp('+i+')">WhatsApp</button><button class="btn" onclick="markPaid('+i+')">✓ Paid</button>';div.appendChild(btnDiv);list.appendChild(div);let opt=document.createElement('option');opt.value=i;opt.text=m.name+' - Draw #'+m.draw+' ('+m.status+')';sel.appendChild(opt);let opt2=opt.cloneNode(true);sel2.appendChild(opt2);});
  let pl=document.getElementById('proofList');pl.innerHTML='';if(!proofs.filter(p=>p.status==='Pending Review').length)pl.innerHTML='<p>Koi pending proof nahi.</p>';proofs.forEach((p,idx)=>{let d=document.createElement('div');d.className='historyItem';d.innerHTML='<b>'+p.member+'</b> - '+p.amount.toLocaleString()+' PKR - '+p.month+'<br>Status: '+p.status+'<br><button class="btn" onclick="viewProof('+idx+')">📸 Screenshot Dekho</button>';pl.appendChild(d);});
  let hList=document.getElementById('historyList');hList.innerHTML='';if(!history.length)hList.innerHTML='<p>No payment history yet.</p>';history.slice().reverse().forEach((h,idx)=>{let d=document.createElement('div');d.className='historyItem';d.innerHTML='<b>🧾 Receipt #'+(history.length-idx)+'</b><br><b>'+h.member+'</b> - '+h.amount.toLocaleString()+' PKR<br>Month: '+h.month+'<br><small>'+h.date+'</small><br><button class="btn" onclick="showReceipt('+(history.length-1-idx)+')">View Receipt</button>';hList.appendChild(d);});
  renderCalendar();renderDraw();if(loggedMember)renderMemberView();updateCountdowns();
}
function openModal(id){document.getElementById(id).style.display='block'}
function closeModal(id){document.getElementById(id).style.display='none'}
function addMember(){let n=document.getElementById('mName').value.trim(),d=document.getElementById('mDraw').value,p=document.getElementById('mPhone').value,s=document.getElementById('mStatus').value;if(!n||!d){alert('Name aur Draw No zaroori hai');return;}members.push({name:n,draw:parseInt(d),status:s,phone:p,cDate:"",drawMonth:"",hasDrawn:false});drawBoxes.push({boxNo:drawBoxes.length+1,member:"",month:"",date:"",status:"closed",openedBy:""});save();closeModal('memberModal');alert(n+' add ho gaya! Naya Draw Box bhi ban gaya!');}
function markPaid(i){members[i].status='Paid';save();}
function whatsapp(i){let m=members[i];window.open('https://wa.me/?text='+encodeURIComponent('Assalam-o-Alaikum '+m.name+', December Committee 2026 ki payment 10,000 PKR pending hai. JazzCash 0300-1234567 par bhej dein. - Khalid Farooq'))}
function uploadProof(){if(!tempProofImg){alert('Pehle screenshot select karo!');return;}let amt=parseInt(document.getElementById('proofAmountModal').value)||10000;let month=document.getElementById('proofMonth').value;let txn=document.getElementById('proofTxn').value;proofs.push({member:loggedMember.name,draw:loggedMember.draw,amount:amt,month:month,txn:txn,img:tempProofImg,status:"Pending Review",date:new Date().toLocaleString()});save();closeModal('proofModal');tempProofImg='';document.getElementById('proofPreview').style.display='none';alert('✅ Screenshot upload ho gaya!');renderMemberView();}
function approveFromPayment(){if(!tempProofImg){alert('Pehle screenshot select karo!');return;}let idx=document.getElementById('payMember').value;let m=members[idx];let amt=parseInt(document.getElementById('payAmount').value)||10000;let month=document.getElementById('payMonth').value;m.status='Paid';proofs.push({member:m.name,draw:m.draw,amount:amt,month:month,txn:'JC-20261207',img:tempProofImg,status:"Approved ✅",date:new Date().toLocaleString()});history.push({member:m.name,amount:amt,month:month,method:"Screenshot Proof",date:new Date().toLocaleString()});save();alert('✅ Payment Approved!');showScreen('winnersScreen');showWithdrawal();}
function viewProof(idx){let p=proofs[idx];document.getElementById('viewProofBox').innerHTML='<div style="text-align:center"><h3>📸 Payment Proof</h3><p><b>'+p.member+'</b> - Draw #'+p.draw+'<br>Amount: '+p.amount.toLocaleString()+' PKR<br>Month: '+p.month+'<br>Txn: '+(p.txn||'-')+'<br>Status: '+p.status+'</p><img src="'+p.img+'" class="proofImg"><br><button class="green" onclick="approveProof('+idx+')">✅ Approve</button><button class="green" style="background:#ff4444" onclick="rejectProof('+idx+')">❌ Reject</button><button class="green" style="background:#ddd;color:#000" onclick="closeModal(\'viewProofModal\')">Close</button></div>';openModal('viewProofModal');}
function approveProof(idx){let p=proofs[idx];p.status='Approved ✅';let mi=members.findIndex(m=>m.name===p.member);if(mi>=0)members[mi].status='Paid';history.push({member:p.member,amount:p.amount,month:p.month,method:"Screenshot Proof",date:p.date});save();closeModal('viewProofModal');alert(p.member+' ki payment Approved!');}
function rejectProof(idx){proofs[idx].status='Rejected ❌';save();closeModal('viewProofModal');}
function addPayment(){let i=document.getElementById('payMemberModal').value;let amt=parseInt(document.getElementById('payAmountModal').value)||10000;let month=document.getElementById('payMonthModal').value;let method=document.getElementById('payMethodModal').value;members[i].status='Paid';history.push({member:members[i].name,amount:amt,month:month,method:method,date:new Date().toLocaleString()});save();closeModal('payModal');showReceipt(history.length-1);}
function showReceipt(idx){let h=history[idx];document.getElementById('receiptBox').innerHTML='<div style="text-align:center"><h2>🧾 Payment Receipt</h2><p>'+h.month+'</p><hr><p><b>Member:</b> '+h.member+'<br><b>Amount:</b> '+h.amount.toLocaleString()+' PKR<br><b>Method:</b> '+h.method+'<br><b>Date:</b> '+h.date+'<br><b>Status:</b> ✅ PAID</p><button class="green" onclick="closeModal(\'receiptModal\')">Close</button></div>';openModal('receiptModal');}
function clearHistory(){if(confirm('History clear karni hai?')){history=[];save();}}
function resetData(){if(confirm('Sab data reset karna hai?')){localStorage.clear();location.reload();}}
window.openModal=openModal; window.closeModal=closeModal; window.addMember=addMember; window.markPaid=markPaid; window.whatsapp=whatsapp; window.uploadProof=uploadProof; window.approveFromPayment=approveFromPayment; window.viewProof=viewProof; window.approveProof=approveProof; window.rejectProof=rejectProof; window.addPayment=addPayment; window.showReceipt=showReceipt; window.clearHistory=clearHistory; window.resetData=resetData;
document.getElementById('proofFile').addEventListener('change',function(e){let f=e.target.files[0];if(!f)return;document.getElementById('proofFileName').innerText='📄 '+f.name;let r=new FileReader();r.onload=function(ev){tempProofImg=ev.target.result;let img=document.getElementById('proofPreview');img.src=tempProofImg;img.style.display='block';};r.readAsDataURL(f);});
render(); fillMemberLogin();