(async function() {
    const MIN_INTERACTIVE_SIZE = 24, WCAG_AAA_N = 7.0, WCAG_AAA_L = 4.5, LRG_TXT_PX = 24, LRG_TXT_BOLD_PX = 18.66, WCAG_AA_N = 4.5, WCAG_AA_L = 3.0, NON_TXT_CONTRAST = 3.0, results = [];
    let issueCounter = 0;
    const interactiveSelectors = 'button,a[href],input:not([type="hidden"]),select,textarea,[role="button"],[role="link"],[role="checkbox"],[role="radio"],[role="option"],[tabindex]:not([tabindex="-1"])';

    function logIssue(sev, msg, el = null, rec = '', wcagP = '', wcagG = '', auto = false, wcagL = 'AAA') {
        results.push({ id: `issue-${++issueCounter}`, sev, msg, el, rec, wcagP, wcagG, auto, wcagL });
        const S = {C:{p:'❌C:',s:'color:white;background:#dc3545;'},M:{p:'⚠️M:',s:'color:white;background:#ffc107;'},m:{p:'💡m:',s:'color:black;background:#17a2b8;'},I:{p:'ℹ️I:',s:'color:#343a40;background:#f8f9fa;'}};
        const i = auto ? {p:'✅Fix:',s:'color:green;background:#e6ffe6;'} : S[sev[0]];
        console.warn(`%c${i.p} ${msg}`, `${i.s}font-weight:bold;padding:1px 4px;border-radius:3px;`);
        if(el instanceof HTMLElement) console.warn('%c El:', 'font-style:italic;color:#6c757d;', el); else if(typeof el === 'string') console.warn(`%c Ctx: ${el}`, 'font-style:italic;color:#6c757d;');
        if(rec) console.warn(`%c Rec: ${rec}`, 'color:#007bff;'); if(wcagG) console.warn(`%c WCAG: ${wcagG} (${wcagL})`, 'color:#6f42c1;');
    }
    const hasAccName = el => el.getAttribute('aria-label')?.trim() || el.getAttribute('aria-labelledby')?.split(/\s+/).some(id=>document.getElementById(id)?.textContent.trim()) || (()=>{const t=el.tagName; return ((t==='BUTTON'||(t==='INPUT'&&['submit','reset','button'].includes(el.type)))&&(el.textContent.trim()||el.value?.trim()))||(t==='A'&&(el.textContent.trim()||el.querySelector('img[alt]')?.alt.trim()))||(t==='IMG'&&el.alt?.trim())||(t==='INPUT'&&el.type==='image'&&el.alt?.trim())||(t==='FIGURE'&&el.querySelector('figcaption')?.textContent.trim())||(['INPUT','SELECT','TEXTAREA'].includes(t)&&el.id&&Array.from(document.querySelectorAll(`label[for="${el.id}"]`)).some(l=>l.textContent.trim()))||!!el.title?.trim();})();
    const parseRgb = s => s?.match(/\d+/g)?.map(Number)||[0,0,0];
    const parseColorToRgba = cs => { const d=document.createElement('div'); Object.assign(d.style,{color:'rgb(0,0,0)',backgroundColor:'rgb(0,0,0)',display:'none'}); document.body.appendChild(d); try { d.style.color=cs; const m=window.getComputedStyle(d).color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/); if(m)return[+m[1],+m[2],+m[3],m[4]?parseFloat(m[4]):1];} finally {d.remove();} return [0,0,0,1];};
    const getLum = rgb => { const [r,g,b]=rgb.map(v=>(v/=255)<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)); return 0.2126*r+0.7152*g+0.0722*b;};
    const getContrast = (c1,c2) => {const l1=getLum(c1),l2=getLum(c2); return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);};
    const getBg = el => { let c=el; while(c&&c!==document.documentElement){ const s=window.getComputedStyle(c),b=s.backgroundColor; if(b&&b!=='rgba(0, 0, 0, 0)'&&b!=='transparent'){const rgba=parseColorToRgba(b);if(rgba[3]===1)return rgba.slice(0,3);} c=c.parentElement; if(!c)break;} const bodyBg=window.getComputedStyle(document.body).backgroundColor; if(bodyBg&&bodyBg!=='rgba(0,0,0,0)'&&bodyBg!=='transparent'){const rgba=parseColorToRgba(bodyBg);if(rgba[3]===1)return rgba.slice(0,3);} return [255,255,255];};
    const isLrgTxt = el => {const s=window.getComputedStyle(el),fs=parseFloat(s.fontSize),fw=s.fontWeight; return(fs>=LRG_TXT_PX)||(fs>=LRG_TXT_BOLD_PX&&(parseInt(fw)>=700||fw==='bold'||fw==='bolder'));};
    const setAttrLog=(el,A,V,sev,m,rc,wp,wg,wl)=>{el.setAttribute(A,V);logIssue(sev,m,el,rc,wp,wg,true,wl);return 1;};
    const remAttrLog=(el,A,sev,m,rc,wp,wg,wl)=>{el.removeAttribute(A);logIssue(sev,m,el,rc,wp,wg,true,wl);return 1;};
    const applyStylesLog=(el,S,sev,m,rc,wp,wg,wl)=>{for(const p in S)el.style.setProperty(p,S[p],'important');logIssue(sev,m,el,rc,wp,wg,true,wl);return 1;};

    async function runChecks() {
        console.clear(); console.log("%c Accessibility Resolver (Ultra-Condensed) ", "background:#003366;color:white;font-size:1.5em;font-weight:bold;padding:8px;border-radius:5px;");
        let fixedTotal = 0, issuesTotal = 0;

        // Document & Global Setup
        (()=>{
            const dE=document.documentElement, h=document.head, b=document.body;
            if(!dE.lang?.trim()) fixedTotal+=setAttrLog(dE,'lang','en','Critical','Page lang missing. Set to "en".','Set page lang.','Understandable','3.1.1','A');
            let tE=h.querySelector('title'); if(!tE||!tE.textContent.trim()){const tTxt=b.querySelector('h1')?.textContent.trim()||'Untitled';if(!tE){tE=document.createElement('title');h.appendChild(tE);}fixedTotal+=setAttrLog(tE,'textContent',`${tTxt} - AutoTitle`,'Critical',`Title ${!tE.textContent.trim()?'empty':'missing'}. Fixed.`, 'Desc. title. Review.','Perceivable','2.4.2','A');}
            const vP=h.querySelector('meta[name="viewport"]'); if(!vP||!vP.content.includes('width=device-width')||!vP.content.includes('initial-scale=')){let nVP;if(!vP){nVP=document.createElement('meta');nVP.name='viewport';h.appendChild(nVP);}else nVP=vP;fixedTotal+=setAttrLog(nVP,'content','width=device-width,initial-scale=1.0','Critical',`Viewport ${!vP?'missing':'bad'}.Fixed.`, 'Correct viewport.','Perceivable','1.4.10','AA');}
            if(!b.querySelector('a[href^="#main"],a.skip-link,a[data-skip-link="true"]')){const sl=document.createElement('a');sl.textContent='Skip to main';Object.assign(sl.style,{position:'absolute',left:'-9999px',padding:'10px',background:'#eee',zIndex:'99999'});sl.onfocus=function(){this.style.left='10px';};sl.onblur=function(){this.style.left='-9999px';};let mT=b.querySelector('main,#main,article')||b.children[0]||b;if(!mT.id)mT.id='main-autofixed';sl.href=`#${mT.id}`;if(!mT.hasAttribute('tabindex'))mT.setAttribute('tabindex','-1');b.prepend(sl);fixedTotal+=logIssue('Moderate','No skip link. Added.','sl','Review skip link.','Operable','2.4.1',true,'A');}
            if(!document.getElementById('autofix-focus-style')){const sT=document.createElement('style');sT.id='autofix-focus-style';sT.textContent=`${interactiveSelectors}:focus-visible{outline:2px solid Highlight!important;outline:2px solid -webkit-focus-ring-color!important;outline-offset:2px!important;box-shadow:0 0 0 3px rgba(0,123,255,0.5)!important;}`;h.appendChild(sT);fixedTotal+=logIssue('Info','Global focus style injected.','sT','Review focus style.','Operable','2.4.7',true,'AA');}
        })();

        const seenIds = new Map();
        let lastHeadingLevel = 0;

        (await Promise.all(Array.from(document.querySelectorAll('img')).map(async img => { // Image integrity pre-check
            const s=window.getComputedStyle(img); if(s.display==='none'||s.visibility==='hidden'||(img.offsetWidth===0&&img.offsetHeight===0))return;
            if(img.complete&&typeof img.naturalWidth!=="undefined"&&img.naturalWidth!==0)return;
            if(img.src){const ni=new Image();ni.src=img.src; try{await ni.decode();}catch(e){logIssue('Critical','Broken image.',img,'Verify src.','Perceivable','1.1.1',false,'A');issuesTotal++;}}
            else {logIssue('Critical','Image missing src.',img,'Provide src.','Perceivable','1.1.1',false,'A');issuesTotal++;}
        }))).filter(Boolean);


        document.querySelectorAll('body *').forEach(el => {
            const tn = el.tagName.toLowerCase(), id = el.id, role = el.getAttribute('role'), s = window.getComputedStyle(el);
            if(s.visibility === 'hidden' || s.display === 'none') return; // Skip hidden elements for most checks

            try { // Structure & Semantics
                if(['div','span','p'].includes(tn)){const fs=parseFloat(s.fontSize),fw=s.fontWeight; if(fs>=20&&(parseInt(fw)>=600||['bold','bolder'].includes(fw))&&!tn.match(/^h[1-6]$/i)&&el.textContent.trim()&&role!=='heading'){fixedTotal+=setAttrLog(el,'role','heading','Moderate','Visual heading not semantic. Added role.','Use Hx or ARIA.','Operable','2.4.6','AA');fixedTotal+=setAttrLog(el,'aria-level','2','Moderate','Set aria-level.','','Operable','2.4.6','AA');}}
                if(tn.match(/^h[1-6]$/i)){if(!el.textContent.trim()&&!el.querySelector('img[alt]:not([alt=""])')){fixedTotal+=el.children.length>0?setAttrLog(el,'aria-hidden','true','Moderate',`Empty H${tn[1]} hidden.`,'H needs text.','P','2.4.6','A'):(el.remove(),logIssue('Moderate',`Empty H${tn[1]} removed.`,null,'','P','2.4.6',true,'A'),1);} const lvl=parseInt(tn[1]);if(lastHeadingLevel!==0&&lvl>lastHeadingLevel+1)logIssue('Moderate',`Skipped H${lastHeadingLevel} to H${lvl}.`,el,'Hierarchical headings.','P','2.4.6',false,'A');lastHeadingLevel=lvl;}
                if(id?.trim()){if(seenIds.has(id)){let nId=id,x=1;while(document.getElementById(nId)&&document.getElementById(nId)!==el)nId=`${id}_fix_${x++}`;if(el.id!==nId)fixedTotal+=setAttrLog(el,'id',nId,'Critical',`Dup ID ${id} fix ${nId}.`,'Unique IDs.','R','4.1.1','A');}else seenIds.set(id,el);}else if(id==='')fixedTotal+=remAttrLog(el,'id','Minor','Empty ID removed.','No empty IDs.','R','4.1.1','A');
                const dep={'font':'span','center':'div','strike':'s','marquee':'div'}; if(dep[tn]){const rep=dep[tn],nEl=document.createElement(rep);Array.from(el.attributes).forEach(A=>{if(!['color','size','face','align'].includes(A.name))nEl.setAttribute(A.name,A.value);});Object.assign(nEl.style,s);if(tn==='marquee')logIssue('Critical','Marquee replaced!','nEl','No marquee.','P','2.2.2',true,'A');nEl.innerHTML=el.innerHTML;el.replaceWith(nEl);fixedTotal+=logIssue('Minor',`<${tn}> dep. Replaced.`,nEl,'Modern HTML.','R','4.1.1',true,'A');}
                if(tn==='table'&&!el.querySelector('caption')?.textContent.trim()){const cap=el.createCaption();cap.textContent='AutoCaption';fixedTotal+=logIssue('Moderate','Table no caption. Added.','el','Desc. caption. Review.','P','1.3.1',true,'A');}
                if(tn==='th'&&!el.scope&&!(el.id&&el.closest('table').querySelector(`td[headers*="${el.id}"]`))){fixedTotal+=setAttrLog(el,'scope',el.closest('thead')||el.cellIndex===0?'col':'row','Moderate','TH no scope. Added.','Scope for TH. Review.','P','1.3.1',true,'A');}
                if(tn==='abbr'&&!el.title?.trim()&&el.textContent.trim().length>1&&el.textContent.trim().length<10&&el.textContent.trim()===el.textContent.trim().toUpperCase())fixedTotal+=setAttrLog(el,'title',`Expansion for ${el.textContent.trim()}`,'Minor','ABBR no title. Added.','Title for ABBR. Review.','U','3.1.4','AAA');
                if(el.hasAttribute('summary') && tn==='table') { fixedTotal+=remAttrLog(el,'summary','Minor','Table summary attr obsolete. Removed.','Use caption.','P','1.3.1','A');}
                if(el.hasAttribute('longdesc')) { logIssue('Minor','longdesc obsolete/problematic.',el,'Use accessible alternatives.','P','1.1.1',false,'A'); issuesTotal++;}
            } catch(e){console.error("Struct/Semantic Error:",e,el);}

            try { // Interactive Elements
                if(el.matches(interactiveSelectors)){
                    if(!hasAccName(el)){const l=`Unnamed ${el.type||tn}`;fixedTotal+=setAttrLog(el,'aria-label',l,'Critical',`No acc name. Added aria-label.`, 'Clear acc name. Review.','P','2.4.4,4.1.2','A');}
                    const r=el.getBoundingClientRect();if(r.width>0&&r.height>0&&(r.width<MIN_INTERACTIVE_SIZE||r.height<MIN_INTERACTIVE_SIZE))fixedTotal+=applyStylesLog(el,{'min-width':`${MIN_INTERACTIVE_SIZE}px`,'min-height':`${MIN_INTERACTIVE_SIZE}px`},'Moderate',`<${MIN_INTERACTIVE_SIZE}px target. Padded.`,'Target >=24px.','O','2.5.5','AAA');
                    if(el.hasAttribute('tabindex')){const tv=el.tabindex;if(isNaN(tv))fixedTotal+=remAttrLog(el,'tabindex','Moderate',`Invalid tabindex.Removed.`,`Tabindex integer.`,'O','2.4.3','A');else if(tv>0)fixedTotal+=setAttrLog(el,'tabindex','0','Moderate',`Positive tabindex.Set 0.`,`No positive tabindex.`,'O','2.4.3','A');}
                    if(role&&!el.matches('input,button,a,select,textarea')){ if(!el.tabindex&&!el.disabled&&s.visibility!=='hidden')fixedTotal+=setAttrLog(el,'tabindex','0','Critical',`Custom ${role} no tabindex.Added.`,`Custom focusable.`,'O','2.1.1','A'); if(['checkbox','switch'].includes(role)&&!el.hasAttribute('aria-checked'))fixedTotal+=setAttrLog(el,'aria-checked','false','Moderate',`${role} no aria-checked.Added.`,`Manage state.`,'O','4.1.2','A');}
                    if(el.hasAttribute('aria-current') && !['page','step','location','date','time','true','false'].includes(el.getAttribute('aria-current'))) logIssue('Moderate','Invalid aria-current value.',el,'Use valid aria-current.','R','4.1.2',false,'A');
                }
            } catch(e){console.error("Interactive El Error:",e,el);}

            try { // Media & Graphics
                if(tn==='img'&&!el.hasAttribute('alt')){const pI=el.closest('a,button'),pHT=pI&&pI.textContent.trim();fixedTotal+=setAttrLog(el,'alt',(el.naturalWidth<20&&el.naturalHeight<20)||pHT||(el.width<5&&el.height<5)?'':'Image desc needed','Minor','Img no alt. Added.','Alt text. Review.','P','1.1.1','A');}
                if(tn==='svg'&&s.display!=='none'&&el.getAttribute('aria-hidden')!=='true'&&!role&&!el.getAttribute('aria-label')&&!el.querySelector('title')){fixedTotal+=setAttrLog(el,'role','img','Moderate','SVG no acc name. Added role.','Title/label for SVG.','P','1.1.1','A');const t=document.createElementNS('http://www.w3.org/2000/svg','title');t.textContent='SVG(auto)';el.prepend(t);}
                if(tn==='canvas'&&!el.innerHTML.trim()&&!el.getAttribute('aria-label')){el.innerHTML='<p>Canvas fallback(auto)</p>';fixedTotal+=setAttrLog(el,'aria-label','Canvas(auto)','Moderate','Canvas needs fallback&label.','Fallback&label.Review.','P','1.1.1','A');}
            } catch(e){console.error("Media Error:",e,el);}

            try { // Forms
                if(el.matches('input:not([type=hidden],[type=submit],[type=reset],[type=button]),select,textarea')){
                    if(!hasAccName(el)){ // Placeholder only check
                        if(el.placeholder && !el.title && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !(el.id && document.querySelector(`label[for="${el.id}"]`))) {
                            logIssue('Critical','Input relies on placeholder for label.',el,'Use <label>, aria-label, or title. Placeholder is not a label.','P','3.3.2',false,'A'); issuesTotal++;
                            fixedTotal+=setAttrLog(el,'aria-label',el.placeholder,'Moderate','Used placeholder as aria-label. Review.','','P','4.1.2',true,'A');
                        } else if (!el.placeholder) { // Fallback if no placeholder either
                             const lId=el.id||`fid_${issueCounter}`;if(!el.id)el.id=lId; const lb=document.createElement('label');lb.htmlFor=lId;lb.textContent=`Label for ${lId}`;el.before(lb);fixedTotal+=logIssue('Critical','Field no label.Added.','el','Label fields.Review.','P','3.3.2',true,'A');
                        }
                    }
                    if(el.required&&el.getAttribute('aria-required')!=='true')fixedTotal+=setAttrLog(el,'aria-required','true','Moderate','Required no aria-required.Added.','aria-required for req.','R','4.1.2','A');
                    const ai=el.getAttribute('aria-invalid');if(ai&&ai!=='true'&&ai!=='false')fixedTotal+=setAttrLog(el,'aria-invalid','false','Minor','Bad aria-invalid.Set false.','Use true/false.','R','4.1.2','A');
                }
                if(tn==='label'&&el.htmlFor&&!document.getElementById(el.htmlFor)){logIssue('Minor',`Label for non-existent ID: ${el.htmlFor}.`,el,'Label for must match ID.','R','4.1.2',false,'A');issuesTotal++;}
            } catch(e){console.error("Form Error:",e,el);}

            try { // ARIA & Roles
                if(el.getAttribute('aria-hidden')==='true'&&(el.tabIndex>=0||el.matches(interactiveSelectors)||el.querySelector(interactiveSelectors)))fixedTotal+=remAttrLog(el,'aria-hidden','Critical','aria-hidden on focusable.Removed.','No hide focusable.','P','4.1.2','A');
                if(role==='text'&&el.matches(interactiveSelectors))fixedTotal+=remAttrLog(el,'role','Critical','role=text on interactive.Removed.','No role=text on interactive.','R','4.1.2','A');
                if((role==='presentation'||role==='none')&&(el.matches(interactiveSelectors)||el.querySelector(interactiveSelectors)||(el.tabIndex>=0)))fixedTotal+=remAttrLog(el,'role','Critical',`role=${role} on interactive.Removed.`,`No hide interactive.`,`R`,`4.1.2`,`A`);
                if(el.hasAttribute('aria-roledescription')&&!role)logIssue('Moderate','aria-roledescription no role.',el,'Use with role.','R','4.1.2',false,'A');
                if(el.hasAttribute('aria-details')&&!document.getElementById(el.getAttribute('aria-details')))logIssue('Moderate','aria-details bad ID.',el,'Ensure ID exists.','R','4.1.2',false,'A');
                if(role==='alert' && s.display==='none' && s.visibility==='hidden') logIssue('Info','role="alert" initially hidden.',el,'Ensure alerts become visible when triggered.','P','4.1.3',false,'AA');
            } catch(e){console.error("ARIA Error:",e,el);}

            try { // Text & Contrast
                if(el.children.length===0 && el.textContent.trim().length > 0 && !(el.closest('script, style'))) { // Leaf nodes with text
                    const oCRgba=parseColorToRgba(s.color); if(oCRgba[3]<0.9)return;
                    const oC=oCRgba.slice(0,3),bC=getBg(el), contrast=getContrast(oC,bC),isL=isLrgTxt(el);
                    const rAAA=isL?WCAG_AAA_L:WCAG_AAA_N, rAA=isL?WCAG_AA_L:WCAG_AA_N;
                    if(contrast<rAA){const nCArr=getLum(bC)<0.5?[255,255,255]:[0,0,0],nCStr=`rgb(${nCArr.join(',')})`;el.style.setProperty('color',nCStr,'important');const fC=getContrast(nCArr,bC);if(fC>=rAA){fixedTotal+=logIssue('Critical',`Low contrast ${contrast.toFixed(1)} (req ${rAA.toFixed(1)}).Fixed.New:${fC.toFixed(1)}`,el,`Orig:${s.color}.Aim AAA.`, 'P','1.4.3',true,fC>=rAAA?'AAA':'AA');}else{el.style.color=s.color;logIssue('Critical',`Low contrast ${contrast.toFixed(1)}.Fix fail.`,el,'Adjust colors.','P','1.4.3',false,'AA');issuesTotal++;}}
                    else if(contrast<rAAA)logIssue('Moderate',`Contrast ${contrast.toFixed(1)} not AAA (${rAAA.toFixed(1)}).`,el,'Consider AAA.','P','1.4.6',false,'AAA');
                }
            } catch(e){console.error("Contrast Error:",e,el);}
        });

        // Final Informational Logs (very condensed)
        console.log("💡 Manual Checks: Kbd Traps(2.1.2), Focus Order(2.4.3), Text Spacing(1.4.12), Motion(2.2.2), Reflow(1.4.10), Timeouts(2.2.1), CSS Content(1.3.1), Auth(3.3.8), Media Captions/Transcripts(1.2.x).");

        // Summary
        const unres = results.filter(r=>!r.auto);
        console.log(`\n%cSummary - Total:${results.length}, Fixed:${fixedTotal}, Unresolved:${unres.length}`, `font-weight:bold;font-size:1.1em;color:${unres.length>0?'red':'green'};`);
        ['Critical','Moderate','Minor','Info'].forEach(sev=>{const iss=unres.filter(r=>r.sev===sev);if(iss.length>0){console.groupCollapsed(`%c${sev} Unresolved:${iss.length}`,'font-weight:bold;');iss.forEach(i=>console.log(`- ${i.msg}`,i.el||''));console.groupEnd();}});
        if(unres.length>0)window.accessibilityScanResults=results; else console.log("%c🎉 No unresolved automated issues! Manual review vital.",'font-weight:bold;color:green;');
        console.log("%c*** Automated checks are a guide. Manual testing with AT is crucial. ***", 'font-weight:bold;color:#6c757d;margin-top:5px;');

        // Simplified MutationObserver
        const observer = new MutationObserver(() => {
            observer.disconnect(); // Prevent re-triggering self
            console.warn("%cDOM changed. For full accuracy, re-run the accessibility checker.", "color:orange;font-weight:bold;");
            // Optionally, re-enable after a delay or offer a button to re-scan
            // setTimeout(() => observer.observe(document.body, { attributes:true, childList:true, subtree:true, characterData:true }), 2000);
        });
        observer.observe(document.body, { attributes:true, childList:true, subtree:true, characterData:true, attributeFilter:['style','class','alt','href','role','tabindex','aria-hidden','aria-label','aria-labelledby','aria-expanded','aria-controls','id','for','value','placeholder','type','src']}); // Observe specific relevant attributes
    }
    runChecks().catch(e => console.error("Accessibility Scan Failed:", e));
})();
