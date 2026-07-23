# EdgeCam NVR-2000 📷

The admin console for a network video recorder / IP-camera appliance — live view,
recordings, network diagnostics, firmware updates, users and device settings. It
looks and behaves like a real embedded device web UI.

> Deliberately insecure by design. For testing and training. It reproduces the
> classic weaknesses of embedded/IoT device panels.

## Run

```
docker build -t edgecam vms/edgecam && docker run --rm -p 8080:80 edgecam
# open http://localhost:8080   ·   default credentials admin / admin
```

State is rebuilt on every start (live instance restarts every 2 hours).

## What it exercises

Default/hardcoded credentials, unauthenticated info disclosure, header-based auth
bypass ("local requests are trusted"), command injection in diagnostics, firmware
upload leading to code execution, state-changing GET requests (CSRF), log-file
traversal, and IDOR — the embedded-device classics. Read the device info, then the
JavaScript, then the diagnostics tools.

_Everything needed is inside the container — no external services or out-of-band
infrastructure._
