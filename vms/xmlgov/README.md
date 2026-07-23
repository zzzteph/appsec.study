# XmlGov — Records Exchange 🏛️

A legacy **SOAP / XML** enterprise web service — a government "records exchange"
API with authentication, record lookup, document import and internal
administrative operations, plus a browser console and a WSDL. It behaves like a
real legacy SOAP service.

> Deliberately insecure by design. For testing and training. It reproduces the
> classic weaknesses of XML/SOAP services.

## Run

```
docker build -t xmlgov vms/xmlgov && docker run --rm -p 8080:80 xmlgov
# open http://localhost:8080   ·   SOAP endpoint: POST /service   ·   GET /service?wsdl
```

State is rebuilt on every start (live instance restarts every 2 hours).

## What it exercises

XML External Entity (XXE) injection, XPath injection (authentication bypass),
WSDL enumeration, SOAP-action spoofing / broken function-level authorization
(privileged operations callable by anyone), command injection, and IDOR. Read the
WSDL, then think about how each XML input is parsed.

_Everything needed is inside the container — no external services or out-of-band
infrastructure._
