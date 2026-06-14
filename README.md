List of vulnerable machines for testing and training. Nothing more. Nothing less.

Every machine is automatically restarted **every 2 hours** (on even hours, local time).

> Deliberately insecure by design. For testing and training.

## Machines

| Machine | Vulns | Source | Live |
|---|---|---|---|
| **Boxcutter Store** | Mixed injection, XSS, broken access control, API & GraphQL, business logic, info disclosure | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/boxcutter-store) | [boxcutter.appsec.study](https://boxcutter.appsec.study) |
| **Stalker** | Leaked Git artifacts, hidden admin panel, SQL injection, code execution | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/Stalker) | [stalker.appsec.study](https://stalker.appsec.study) |
| **DVWA** (fork of [DVWA](https://github.com/digininja/DVWA)) | SQL injection (incl. blind), command injection, file inclusion (LFI/RFI), file upload, XSS (reflected/stored/DOM), CSRF, brute force, weak session IDs | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/DVWA) | [dvwa.appsec.study](https://dvwa.appsec.study) |



