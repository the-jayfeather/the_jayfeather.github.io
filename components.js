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
  FU Studio · 一只松鸦羽(the_jayfeather) © 2026 版权所有 | 一只松鸦羽的导航站 | <a href="https://github.com/the-jayfeather/the_jayfeather.github.io">项目开源地址</a>
</div>
        `;
    }
})
