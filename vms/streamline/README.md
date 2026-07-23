# Streamline

A realtime team-collaboration app — channels, private groups, and live messaging over WebSocket. Vue 3 SPA + Express, with a WebSocket transport for the message stream and a REST API for everything else.

## Run

```bash
docker build -t streamline .
docker run --rm -p 8080:80 streamline
# open http://localhost:8080
```

## Demo workspace

| Username | Password  | Role  |
|----------|-----------|-------|
| `demo`   | `demo`    | user  |
| `alice`  | `alicechat` | user |
| `bob`    | `bobchat` | user  |

Public channel **#general** is open to everyone. **design-team** and **exec-private** are invite-only.

## Features

- Realtime messaging over a WebSocket (`/ws`) — join a channel and see live message history and new posts.
- Channel directory (public + private), member rosters, message search.
- Inline message formatting.
- Profile endpoint, workspace admin (announcements, member list, channel-transcript exports).
- REST API mirrors the realtime surface for integrations.

## Notes

This is a security training target — it contains deliberately planted vulnerabilities. Run it locally, only in a disposable container. Data is in-memory and resets on restart.
