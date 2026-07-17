#!/bin/sh
set -eu

: "${TS_AUTHKEY:?Set TS_AUTHKEY to a Tailscale auth key in Railway Variables.}"
: "${TAILSCALE_UPSTREAM:?Set TAILSCALE_UPSTREAM to the Railway private host and port.}"

case "$TAILSCALE_UPSTREAM" in
  *:*) ;;
  *) echo "TAILSCALE_UPSTREAM must look like web.railway.internal:3000." >&2; exit 1 ;;
esac

upstream_host=${TAILSCALE_UPSTREAM%:*}
upstream_port=${TAILSCALE_UPSTREAM##*:}
case "$upstream_host" in
  ""|*[!A-Za-z0-9._-]*) echo "TAILSCALE_UPSTREAM has an invalid host." >&2; exit 1 ;;
esac
case "$upstream_port" in
  ""|*[!0-9]*) echo "TAILSCALE_UPSTREAM has an invalid port." >&2; exit 1 ;;
esac

export TS_STATE_DIR=${TS_STATE_DIR:-/tmp/tailscale}
export TS_USERSPACE=true
export TS_HOSTNAME=${TS_HOSTNAME:-railway-saas}

mkdir -p "$TS_STATE_DIR"
socat "TCP-LISTEN:3000,fork,reuseaddr" "TCP:${upstream_host}:${upstream_port}" &

configure_serve() {
  attempt=0
  while [ "$attempt" -lt 60 ]; do
    if tailscale status --json >/tmp/tailscale-status.json 2>/dev/null; then
      if tailscale serve --bg http://127.0.0.1:3000 >/tmp/tailscale-serve.txt 2>&1; then
        if wget -qO /tmp/upstream-health http://127.0.0.1:3000/health &&
          grep -q '"status":"ok"' /tmp/upstream-health; then
          dns_name=$(jq -er '.Self.DNSName | rtrimstr(".")' /tmp/tailscale-status.json)
          echo "Tailscale proxy ready: https://${dns_name}"
          echo "Public Railway domains are not required for this route."
          return 0
        fi
      fi
    fi
    attempt=$((attempt + 1))
    sleep 1
  done
  echo "Tailscale connected but Serve could not be configured within 60 seconds." >&2
  return 1
}

configure_serve &
exec /usr/local/bin/containerboot
