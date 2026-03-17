import json, time, urllib.request, urllib.error

LOG_PATH = "debug-40fcd9.log"


def log(hypothesis_id: str, message: str, data: dict):
    payload = {
        "sessionId": "40fcd9",
        "runId": "pre-fix",
        "hypothesisId": hypothesis_id,
        "location": "tools/ha_local_probe.py",
        "message": message,
        "data": data,
        "timestamp": int(time.time() * 1000),
    }
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def fetch_url(url: str):
    req = urllib.request.Request(
        url,
        method="GET",
        headers={
            "User-Agent": "ha-local-probe/1.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read(4096)
            return {
                "ok": True,
                "status": getattr(resp, "status", None),
                "reason": getattr(resp, "reason", None),
                "headers": dict(resp.headers.items()),
                "body_prefix": body.decode("utf-8", errors="replace"),
            }
    except urllib.error.HTTPError as e:
        try:
            body = e.read(4096)
        except Exception:
            body = b""
        return {
            "ok": False,
            "status": getattr(e, "code", None),
            "reason": getattr(e, "reason", None),
            "headers": dict(getattr(e, "headers", {}).items()) if getattr(e, "headers", None) else {},
            "body_prefix": body.decode("utf-8", errors="replace"),
        }
    except Exception as e:
        return {"ok": False, "error": repr(e)}


def main():
    urls = [
        "http://192.168.1.108:8123/local/led-panel-editor",
        "http://192.168.1.108:8123/local/led-panel-editor/",
        "http://192.168.1.108:8123/local/led-panel-editor/index.html",
        "http://192.168.1.108:8123/local/led-panel-editor/favicon.svg",
        "http://192.168.1.108:8123/local/led-panel-editor/assets/",
    ]

    # Hypothèses testées:
    # H1: le 403 vient d’un blocage “directory listing” (dossier ok mais pas d’index)
    # H2: le chemin /local/led-panel-editor/ n’existe pas côté HA (mauvais dossier www)
    # H3: un reverse proxy / addon renvoie le 403 (headers non-HA, server atypique)
    # H4: HA refuse certains types / chemins (assets/ ou index.html bloqués)

    for url in urls:
        log("H0", "Requesting URL", {"url": url})
        res = fetch_url(url)
        log(
            "H0",
            "Response",
            {
                "url": url,
                **res,
                "headers_subset": {
                    k: v
                    for k, v in (res.get("headers") or {}).items()
                    if k.lower() in {"server", "content-type", "content-length", "location", "cache-control"}
                },
            },
        )


if __name__ == "__main__":
    main()
