"use strict";(self.webpackChunkv8r_docs=self.webpackChunkv8r_docs||[]).push([[120],{542:(e,s,n)=>{n.r(s),n.d(s,{assets:()=>c,contentTitle:()=>l,default:()=>h,frontMatter:()=>i,metadata:()=>a,toc:()=>r});const a=JSON.parse('{"id":"usage-examples","title":"Usage Examples","description":"Validating files","source":"@site/docs/usage-examples.md","sourceDirName":".","slug":"/usage-examples","permalink":"/v8r/usage-examples","draft":false,"unlisted":false,"editUrl":"https://github.com/chris48s/v8r/tree/main/docs/docs/usage-examples.md","tags":[],"version":"current","sidebarPosition":2,"frontMatter":{"sidebar_position":2},"sidebar":"docSidebar","previous":{"title":"Introduction","permalink":"/v8r/"},"next":{"title":"Configuration","permalink":"/v8r/configuration"}}');var t=n(4848),o=n(8453);const i={sidebar_position:2},l="Usage Examples",c={},r=[{value:"Validating files",id:"validating-files",level:2},{value:"Manually specifying a schema",id:"manually-specifying-a-schema",level:2},{value:"Using a custom catlog",id:"using-a-custom-catlog",level:2},{value:"Files Containing Multiple Documents",id:"files-containing-multiple-documents",level:2}];function d(e){const s={a:"a",code:"code",h1:"h1",h2:"h2",header:"header",li:"li",p:"p",pre:"pre",ul:"ul",...(0,o.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(s.header,{children:(0,t.jsx)(s.h1,{id:"usage-examples",children:"Usage Examples"})}),"\n",(0,t.jsx)(s.h2,{id:"validating-files",children:"Validating files"}),"\n",(0,t.jsx)(s.p,{children:"v8r can validate JSON, YAML or TOML files. You can pass filenames or glob patterns:"}),"\n",(0,t.jsx)(s.pre,{children:(0,t.jsx)(s.code,{className:"language-bash",children:"# single filename\n$ v8r package.json\n\n# multiple files\n$ v8r file1.json file2.json\n\n# glob patterns\n$ v8r 'dir/*.yml' 'dir/*.yaml'\n"})}),"\n",(0,t.jsxs)(s.p,{children:[(0,t.jsx)(s.a,{href:"https://www.digitalocean.com/community/tools/glob",children:"DigitalOcean's Glob Tool"})," can be used to help construct glob patterns"]}),"\n",(0,t.jsx)(s.h2,{id:"manually-specifying-a-schema",children:"Manually specifying a schema"}),"\n",(0,t.jsxs)(s.p,{children:["By default, v8r queries ",(0,t.jsx)(s.a,{href:"https://www.schemastore.org/",children:"Schema Store"})," to detect a suitable schema based on the filename."]}),"\n",(0,t.jsx)(s.pre,{children:(0,t.jsx)(s.code,{className:"language-bash",children:"# if v8r can't auto-detect a schema for your file..\n$ v8r feature.geojson\n\u2139 Processing ./feature.geojson\n\u2716 Could not find a schema to validate feature.geojson\n\n# ..you can specify one using the --schema flag\n$ v8r feature.geojson --schema https://json.schemastore.org/geojson\n\u2139 Processing ./feature.geojson\n\u2139 Validating feature.geojson against schema from https://json.schemastore.org/geojson ...\n\u2714 feature.geojson is valid\n"})}),"\n",(0,t.jsx)(s.h2,{id:"using-a-custom-catlog",children:"Using a custom catlog"}),"\n",(0,t.jsxs)(s.p,{children:["Using the ",(0,t.jsx)(s.code,{children:"--schema"})," flag will validate all files matched by the glob pattern against that schema. You can also define a custom ",(0,t.jsx)(s.a,{href:"https://json.schemastore.org/schema-catalog.json",children:"schema catalog"}),". v8r will search any custom catalogs before falling back to ",(0,t.jsx)(s.a,{href:"https://www.schemastore.org/",children:"Schema Store"}),"."]}),"\n",(0,t.jsx)(s.pre,{children:(0,t.jsx)(s.code,{className:"language-js",metastring:'title="my-catalog.json"',children:'{ "$schema": "https://json.schemastore.org/schema-catalog.json",\n  "version": 1,\n  "schemas": [ { "name": "geojson",\n                 "description": "geojson",\n                 "url": "https://json.schemastore.org/geojson.json",\n                 "fileMatch": ["*.geojson"] } ] }\n'})}),"\n",(0,t.jsx)(s.pre,{children:(0,t.jsx)(s.code,{children:"$ v8r feature.geojson -c my-catalog.json\n\u2139 Processing ./feature.geojson\n\u2139 Found schema in my-catalog.json ...\n\u2139 Validating feature.geojson against schema from https://json.schemastore.org/geojson ...\n\u2714 feature.geojson is valid\n"})}),"\n",(0,t.jsx)(s.p,{children:"This can be used to specify different custom schemas for multiple file patterns."}),"\n",(0,t.jsx)(s.h2,{id:"files-containing-multiple-documents",children:"Files Containing Multiple Documents"}),"\n",(0,t.jsxs)(s.p,{children:["A single YAML file can contain ",(0,t.jsx)(s.a,{href:"https://www.yaml.info/learn/document.html",children:"multiple documents"}),". v8r is able to parse and validate these files. In this situation:"]}),"\n",(0,t.jsxs)(s.ul,{children:["\n",(0,t.jsx)(s.li,{children:"All documents within the file are assumed to conform to the same schema. It is not possible to validate documents within the same file against different schemas"}),"\n",(0,t.jsxs)(s.li,{children:["Documents within the file are referred to as ",(0,t.jsx)(s.code,{children:"multi-doc.yml[0]"}),", ",(0,t.jsx)(s.code,{children:"multi-doc.yml[1]"}),", etc"]}),"\n"]}),"\n",(0,t.jsx)(s.pre,{children:(0,t.jsx)(s.code,{children:"$ v8r catalog-info.yaml\n\u2139 Processing ./catalog-info.yaml\n\u2139 Found schema in https://www.schemastore.org/api/json/catalog.json ...\n\u2139 Validating ./catalog-info.yaml against schema from https://json.schemastore.org/catalog-info.json ...\n\u2714 ./catalog-info.yaml[0] is valid\n\n\u2714 ./catalog-info.yaml[1] is valid\n"})})]})}function h(e={}){const{wrapper:s}={...(0,o.R)(),...e.components};return s?(0,t.jsx)(s,{...e,children:(0,t.jsx)(d,{...e})}):d(e)}},8453:(e,s,n)=>{n.d(s,{R:()=>i,x:()=>l});var a=n(6540);const t={},o=a.createContext(t);function i(e){const s=a.useContext(o);return a.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function l(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:i(e.components),a.createElement(o.Provider,{value:s},e.children)}}}]);