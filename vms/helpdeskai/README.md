# HelpDeskAI

An AI-powered customer-support desk: chat with an assistant that answers from a knowledge base, look up your orders, and open support tickets it can triage for you. Vue 3 SPA + Express, with a **fully self-contained, offline assistant** (no external model/API calls).

## Run

```bash
docker build -t helpdeskai .
docker run --rm -p 8080:80 helpdeskai
# open http://localhost:8080
```

## Demo account

| Username | Password    | Plan |
|----------|-------------|------|
| `demo`   | `demo`      | Free |
| `alice`  | `alicehelp` | Pro  |
| `bob`    | `bobhelp`   | Pro  |

## Features

- **AI assistant** with a live *agent trace* panel (retrieved documents, tool calls, tool results).
- Knowledge base with search, order history, account area.
- Support tickets with one-click **AI triage**.
- The assistant can use tools on your behalf (look up your orders, search the KB, run support diagnostics).

## About the assistant

The bundled assistant is a deterministic, offline stand-in for an LLM — it runs entirely inside the container so the app is reproducible with no network access. It behaves like a naive, instruction-following model, which makes this a realistic target for practising **LLM application security** (the OWASP LLM Top 10).

## Notes

Security training target with deliberately planted vulnerabilities. Run locally in a disposable container only. Data is in-memory and resets on restart.
