const http = require("node:http");
const { URL } = require("node:url");

const proxyPort = Number(process.env.PROXY_PORT || process.env.PORT || 3000);
const nextOrigin = process.env.NEXT_INTERNAL_ORIGIN || "http://127.0.0.1:3001";
const apiOrigin = process.env.API_INTERNAL_ORIGIN || "http://127.0.0.1:8000";

function mapPath(pathname) {
  if (pathname === "/health" || pathname === "/health/ready") {
    return { origin: apiOrigin, path: pathname };
  }

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return { origin: apiOrigin, path: pathname };
  }

  if (pathname === "/xingdp/api" || pathname.startsWith("/xingdp/api/")) {
    return { origin: apiOrigin, path: pathname.replace(/^\/xingdp/, "") || "/api" };
  }

  if (pathname === "/" || pathname === "") {
    return { origin: nextOrigin, path: "/xingdp/" };
  }

  if (pathname === "/xingdp" || pathname.startsWith("/xingdp/")) {
    return { origin: nextOrigin, path: pathname };
  }

  return { origin: nextOrigin, path: `/xingdp${pathname}` };
}

function forward(req, res) {
  const incoming = new URL(req.url || "/", "http://127.0.0.1");
  const mapped = mapPath(incoming.pathname);
  const target = new URL(mapped.path + incoming.search, mapped.origin);

  const headers = { ...req.headers, host: target.host };
  const upstream = http.request(
    target,
    {
      method: req.method,
      headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );

  upstream.on("error", (error) => {
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Proxy error: ${error.message}`);
  });

  req.pipe(upstream);
}

http.createServer(forward).listen(proxyPort, "0.0.0.0", () => {
  console.log(`xingdp proxy listening on 0.0.0.0:${proxyPort}`);
});
