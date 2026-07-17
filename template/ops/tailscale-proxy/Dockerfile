FROM tailscale/tailscale:v1.98.8

RUN apk add --no-cache jq socat
COPY start.sh /usr/local/bin/start-railway-tailscale-proxy
RUN chmod 0555 /usr/local/bin/start-railway-tailscale-proxy

ENTRYPOINT ["/usr/local/bin/start-railway-tailscale-proxy"]
