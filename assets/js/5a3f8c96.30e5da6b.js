"use strict";(self.webpackChunkv8r_docs=self.webpackChunkv8r_docs||[]).push([[628],{9106:(n,e,i)=>{i.r(e),i.d(e,{assets:()=>u,contentTitle:()=>o,default:()=>p,frontMatter:()=>l,metadata:()=>s,toc:()=>c});const s=JSON.parse('{"id":"plugins/using-plugins","title":"Using Plugins","description":"It is possible to extend the functionality of v8r by installing plugins.","source":"@site/docs/plugins/using-plugins.md","sourceDirName":"plugins","slug":"/plugins/using-plugins","permalink":"/v8r/plugins/using-plugins","draft":false,"unlisted":false,"editUrl":"https://github.com/chris48s/v8r/tree/main/docs/docs/plugins/using-plugins.md","tags":[],"version":"current","sidebarPosition":1,"frontMatter":{"sidebar_position":1},"sidebar":"docSidebar","previous":{"title":"Plugins","permalink":"/v8r/category/plugins"},"next":{"title":"Writing Plugins","permalink":"/v8r/plugins/writing-plugins"}}');var t=i(4848),r=i(8453);const l={sidebar_position:1},o="Using Plugins",u={},c=[];function a(n){const e={a:"a",code:"code",h1:"h1",header:"header",p:"p",pre:"pre",...(0,r.R)(),...n.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(e.header,{children:(0,t.jsx)(e.h1,{id:"using-plugins",children:"Using Plugins"})}),"\n",(0,t.jsx)(e.p,{children:"It is possible to extend the functionality of v8r by installing plugins."}),"\n",(0,t.jsxs)(e.p,{children:["Plugins can be packages installed from a registry like ",(0,t.jsx)(e.a,{href:"https://www.npmjs.com/",children:"npm"})," or ",(0,t.jsx)(e.a,{href:"https://jsr.io/",children:"jsr"})," or local files in your repo."]}),"\n",(0,t.jsxs)(e.p,{children:["Plugins must be specified in a ",(0,t.jsx)(e.a,{href:"/v8r/configuration",children:"config file"}),". They can't be loaded using command line arguments."]}),"\n",(0,t.jsx)(e.pre,{children:(0,t.jsx)(e.code,{className:"language-yaml",metastring:'title=".v8rrc.yml"',children:'plugins:\n    # Plugins installed from NPM (or JSR) must be prefixed by "package:"\n    - "package:v8r-plugin-emoji-output"\n    # Plugins in the project dir must be prefixed by "file:"\n    - "file:./subdir/my-local-plugin.mjs"\n'})}),"\n",(0,t.jsx)(e.p,{children:"Plugins are invoked one at a time in the order they are specified in your config file."})]})}function p(n={}){const{wrapper:e}={...(0,r.R)(),...n.components};return e?(0,t.jsx)(e,{...n,children:(0,t.jsx)(a,{...n})}):a(n)}},8453:(n,e,i)=>{i.d(e,{R:()=>l,x:()=>o});var s=i(6540);const t={},r=s.createContext(t);function l(n){const e=s.useContext(r);return s.useMemo((function(){return"function"==typeof n?n(e):{...e,...n}}),[e,n])}function o(n){let e;return e=n.disableParentContext?"function"==typeof n.components?n.components(t):n.components||t:l(n.components),s.createElement(r.Provider,{value:e},n.children)}}}]);