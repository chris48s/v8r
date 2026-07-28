---
sidebar_position: 5
---

# Configuring a Proxy

It is possible to configure a proxy using node's [standard proxy env vars](https://nodejs.org/learn/http/enterprise-network-configuration#proxy-configuration) e.g:

```bash
export NODE_USE_ENV_PROXY=1
export HTTPS_PROXY=https://myproxy:8888
```

Proxy configuration requires node v22.21.0+ or v24.5.0+.
