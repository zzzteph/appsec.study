# Shellshock — NetGuard NG-500 (CVE-2014-6271)

A legacy network-appliance web console (Apache + CGI) running a **genuinely vulnerable bash 4.3**, compiled from source. This is a faithful reproduction of **Shellshock / CVE-2014-6271**.

## Run

```bash
docker build -t shellshock .
docker run --rm -p 8080:80 shellshock
# open http://localhost:8080
```

## What's here

- A NetGuard NG-500 appliance dashboard.
- Two CGI endpoints backed by bash: `/cgi-bin/status.cgi` and `/cgi-bin/healthcheck.cgi`.

The vulnerable bash means any HTTP header that becomes a CGI environment variable (`User-Agent`, `Referer`, `Cookie`, …) is parsed by bash on startup — and a specially crafted value executes commands.

## Notes

Security training target reproducing a real, historic n-day. RCE lands as the web-server user (`www-data`). Run locally in a disposable container only. Nothing here is authenticated by design — it models a 2014-era appliance exposed with a vulnerable bash.
