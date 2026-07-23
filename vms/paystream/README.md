# Paystream 🧾

An HR & payroll self-service portal — view your payslips, submit expenses, browse
the employee directory, manage your profile, with an HR admin console for
payroll and letters. It looks like an ordinary HRIS, with a large surface of
ordinary, correctly-built features.

> Deliberately insecure by design. For testing and training. The interesting bugs
> are in how it authorizes access to sensitive employee data and payroll actions.

## Run

```
docker build -t paystream vms/paystream && docker run --rm -p 8080:80 paystream
# open http://localhost:8080   ·   demo / demo
```

State is rebuilt from a fixed seed on every start (live instance restarts every
2 hours).

## What it exercises

Object-level authorization on highly sensitive PII (salaries, SSNs, bank
details), a payroll/expense-approval workflow, a privilege-escalation path to the
HR console, plus classic injection, traversal and template issues leading to code
execution. Change the IDs, watch the approval flow, and read the request bodies.

_Everything needed is inside the container — no external services or out-of-band
infrastructure._
