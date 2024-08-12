"use strict";(self.webpackChunkvur_docs=self.webpackChunkvur_docs||[]).push([[590],{2210:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>d,contentTitle:()=>o,default:()=>h,frontMatter:()=>t,metadata:()=>l,toc:()=>c});var s=i(4848),r=i(8453);const t={sidebar_position:5},o="Exit codes",l={id:"exit-codes",title:"Exit codes",description:"v8r always exits with code 0 when:",source:"@site/docs/exit-codes.md",sourceDirName:".",slug:"/exit-codes",permalink:"/v8r/exit-codes",draft:!1,unlisted:!1,editUrl:"https://github.com/chris48s/v8r/tree/main/docs/docs/exit-codes.md",tags:[],version:"current",sidebarPosition:5,frontMatter:{sidebar_position:5},sidebar:"docSidebar",previous:{title:"Configuring a Proxy",permalink:"/v8r/proxy"},next:{title:"Versioning",permalink:"/v8r/semver"}},d={},c=[];function a(e){const n={code:"code",h1:"h1",header:"header",li:"li",p:"p",strong:"strong",ul:"ul",...(0,r.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.header,{children:(0,s.jsx)(n.h1,{id:"exit-codes",children:"Exit codes"})}),"\n",(0,s.jsxs)(n.p,{children:["v8r always exits with code ",(0,s.jsx)(n.code,{children:"0"})," when:"]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["The input glob pattern(s) matched one or more files, all input files were validated against a schema, and all input files were ",(0,s.jsx)(n.strong,{children:"valid"})]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"v8r"})," was called with ",(0,s.jsx)(n.code,{children:"--help"})," or ",(0,s.jsx)(n.code,{children:"--version"})," flags"]}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["By default v8r exits with code ",(0,s.jsx)(n.code,{children:"1"})," when an error was encountered trying to validate one or more input files. For example:"]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"No suitable schema could be found"}),"\n",(0,s.jsx)(n.li,{children:"An error was encountered during an HTTP request"}),"\n",(0,s.jsx)(n.li,{children:"An input file was not JSON or yaml"}),"\n",(0,s.jsx)(n.li,{children:"etc"}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["This behaviour can be modified using the ",(0,s.jsx)(n.code,{children:"--ignore-errors"})," flag. When invoked with ",(0,s.jsx)(n.code,{children:"--ignore-errors"})," v8r will exit with code ",(0,s.jsx)(n.code,{children:"0"})," even if one of these errors was encountered while attempting validation. A non-zero exit code will only be issued if validation could be completed successfully and the file was invalid."]}),"\n",(0,s.jsxs)(n.p,{children:["v8r always exits with code ",(0,s.jsx)(n.code,{children:"97"})," when:"]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"There was an error loading a config file"}),"\n",(0,s.jsx)(n.li,{children:"A config file was loaded but failed validation"}),"\n",(0,s.jsx)(n.li,{children:"There was an error loading a plugin"}),"\n",(0,s.jsx)(n.li,{children:"A plugin file was loaded but failed validation"}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["v8r always exits with code ",(0,s.jsx)(n.code,{children:"98"})," when:"]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"An input glob pattern was invalid"}),"\n",(0,s.jsx)(n.li,{children:"An input glob pattern was valid but did not match any files"}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["v8r always exits with code ",(0,s.jsx)(n.code,{children:"99"})," when:"]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["The input glob pattern matched one or more files, one or more input files were validated against a schema and the input file was ",(0,s.jsx)(n.strong,{children:"invalid"})]}),"\n"]})]})}function h(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(a,{...e})}):a(e)}},8453:(e,n,i)=>{i.d(n,{R:()=>o,x:()=>l});var s=i(6540);const r={},t=s.createContext(r);function o(e){const n=s.useContext(t);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:o(e.components),s.createElement(t.Provider,{value:n},e.children)}}}]);