"""Serve only PhishGuard's static laboratory pages on IPv4 loopback.

HTTP: python scripts/serve-test-pages.py --port 8000
HTTPS: python scripts/serve-test-pages.py --port 8443 --cert CERT.pem --key KEY.pem
Requires Python 3.9+. Certificates must be generated separately, outside the repo.
"""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import ssl
from urllib.parse import unquote, urlsplit


REPO_ROOT = Path(__file__).resolve().parent.parent
PAGES_ROOT = (REPO_ROOT / "test-pages").resolve()


class LaboratoryHandler(SimpleHTTPRequestHandler):
    def allowed_path(self):
        path = unquote(urlsplit(self.path).path)
        if not path.startswith("/test-pages/"):
            return False
        target = (REPO_ROOT / path.lstrip("/")).resolve()
        return target.is_relative_to(PAGES_ROOT) and target.is_file() and target.suffix == ".html"

    def do_GET(self):
        if not self.allowed_path():
            self.send_error(404, "Only laboratory HTML pages are served")
            return
        super().do_GET()

    def do_HEAD(self):
        if not self.allowed_path():
            self.send_error(404, "Only laboratory HTML pages are served")
            return
        super().do_HEAD()

    def do_POST(self):
        self.send_error(405, "Laboratory server does not accept form submissions")

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--cert", type=Path)
    parser.add_argument("--key", type=Path)
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("port must be between 0 and 65535")
    if bool(args.cert) != bool(args.key):
        parser.error("--cert and --key must be supplied together")

    context = None
    if args.cert:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        try:
            context.load_cert_chain(args.cert, args.key)
        except (OSError, ssl.SSLError) as error:
            parser.error(f"cannot load TLS certificate/key: {error}")

    handler = partial(LaboratoryHandler, directory=str(REPO_ROOT))
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        if context:
            server.socket = context.wrap_socket(server.socket, server_side=True)
        scheme = "https" if context else "http"
        print(f"{scheme}://localhost:{server.server_port}/test-pages/safe-login.html", flush=True)
        print("Static laboratory pages only. Stop with Ctrl+C.", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
