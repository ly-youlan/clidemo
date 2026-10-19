# Media.io Plugin landing-page prototype

A Vue 3 + Vite front-end prototype for the Media.io Plugin landing page.

## Run it

```bash
npm install
npm run dev
```

## What was reused from the exported page

- Original product visual assets: model logos, free-creation badge, and workflow demo imagery.
- Original visual language: purple-to-black gradient, condensed italic heading treatment, frosted setup surfaces, and the credit-free promotion.

The exported HTML was **not** used as source code. It is a compiled CMS snapshot that includes legacy Bootstrap/jQuery code, so the prototype rebuilds the UI as Vue state and components instead.

## Connector URL

Copy `.env.example` to `.env` and set `VITE_MEDIA_IO_CONNECTOR_URL` before enabling production ChatGPT/Claude connector calls. It deliberately uses a placeholder to avoid shipping a guessed MCP endpoint.
