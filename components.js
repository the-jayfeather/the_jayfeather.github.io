document.addEventListener('DOMContentLoaded',function(){
    const headlineContainer = document.querySelector('.headline_show');
    if(headlineContainer){
        headlineContainer.innerHTML = `
<div class="headline">
  <h1 class="title-text">the_jayfeather的导航站</h1>
  <a class="page" href="the_jayfeather的导航站 - 主页.html" target="_self">主页</a>
  <a class="page" href="the_jayfeather的导航站 - 功能实验室.html" target="_self">功能实验室</a>
  <a class="page" href="the_jayfeather的导航站 - 发布页.html" target="_self">发布页</a>
  <a class="page" href="the_jayfeather的导航站 - 关于.html" target="_self">关于</a>
</div>
        `;
    }
    const footerContainer = document.querySelector('.footer_show');
    if(footerContainer){
        footerContainer.innerHTML = `
<div class="footer">
  FU Studio · 一只松鸦羽(the_jayfeather) © 2026 版权所有 | 一只松鸦羽的导航站 | <a href="https://the-jayfeather.github.io/the_jayfeather.github.io/">在线版</a> | <a href="https://github.com/the-jayfeather/the_jayfeather.github.io">项目开源地址</a>
</div>
        `;
    }
    function enableWholeBoxClick(selector){
        const boxList = document.querySelectorAll(selector);
        boxList.forEach(box=>{
            const link = box.querySelector('a');
            if(!link) return;
            const targetHref = link.href;
            const targetMode = link.target || "_self";
            box.style.cursor = "pointer";
            box.addEventListener('click',function(e){
                if(e.target.tagName.toLowerCase() === 'a') return;
                window.open(targetHref, targetMode);
            })
        })
    }
    enableWholeBoxClick('.card');
    enableWholeBoxClick('.long_card');
    enableWholeBoxClick('.long_card_about');
    enableWholeBoxClick('.strip');

    const navBox = document.getElementById('autoH2Nav');
    let btnList = [];
    let h2List = [];
    let topBtn = null;

    if(navBox){
        topBtn = document.createElement('button');
        topBtn.className = "h2-nav-item";
        topBtn.innerText = "搜索";
        navBox.appendChild(topBtn);

        topBtn.addEventListener('click',function(){
            window.scrollTo({
                top:0,
                behavior:"smooth"
            });
        });

        h2List = Array.from(document.querySelectorAll('h2'));
        h2List.forEach((h2,idx)=>{
            const h2Id = "h2_auto_"+idx;
            h2.id = h2Id;
            const btn = document.createElement('button');
            btn.className = "h2-nav-item";
            btn.innerText = h2.textContent.trim();
            btn.dataset.index = idx;
            navBox.appendChild(btn);
            btnList.push(btn);

            btn.addEventListener('click',function(){
                requestAnimationFrame(function(){
                    const rect = h2.getBoundingClientRect();
                    const absoluteTop = rect.top + window.scrollY;
                    const offset = 72;
                    let targetY = absoluteTop - offset;
                    if(targetY < 0) targetY = 0;
                    window.scrollTo({
                        top: targetY,
                        behavior:"smooth"
                    });
                })
            })
        })
    }

    function clearActiveBtn(){
        btnList.forEach(btn=>{
            btn.classList.remove('h2-nav-active');
        })
        if(topBtn) topBtn.classList.remove('h2-nav-active');
    }

    function setActiveIndex(activeIdx){
        clearActiveBtn();
        if(activeIdx === -1){
            if(topBtn) topBtn.classList.add('h2-nav-active');
        }else if(btnList[activeIdx]){
            btnList[activeIdx].classList.add('h2-nav-active');
        }
    }

    function updateActiveOnScroll(){
        const scrollY = window.scrollY;
        const triggerOffset = 120;
        let current = -1;
        for(let i = h2List.length - 1; i >= 0; i--){
            const h2 = h2List[i];
            const rect = h2.getBoundingClientRect();
            const top = rect.top + scrollY;
            if(scrollY >= top - triggerOffset){
                current = i;
                break;
            }
        }
        setActiveIndex(current);
    }

    window.addEventListener('scroll',updateActiveOnScroll);
    updateActiveOnScroll();

    const searchWrap = document.querySelector('.island-search-wrap');
    const triggerY = 60;
    function updateSearchState(){
        if(window.scrollY > triggerY){
            searchWrap.classList.add('sticky-active');
        }else{
            searchWrap.classList.remove('sticky-active');
        }
    }
    window.addEventListener('scroll',updateSearchState);
    updateSearchState();
})
