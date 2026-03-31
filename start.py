from __future__ import annotations

import json
import os
import re
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
API_DIR = ROOT / "apps" / "api"
WEB_DIR = ROOT / "apps" / "web"
ENV_FILE = ROOT / ".env"
ENV_EXAMPLE_FILE = ROOT / ".env.example"
DOCKER_COMPOSE_FILE = ROOT / "infra" / "docker" / "docker-compose.yml"
SECRET_FILE = ROOT / "秘钥.txt"

DEFAULT_API_PORT = 8000
DEFAULT_WEB_PORT = 3000

DEFAULT_ENV = {
    "NEXT_PUBLIC_API_BASE_URL": f"http://localhost:{DEFAULT_API_PORT}",
    "DATABASE_URL": "sqlite:///./xingdianping.db",
    "REDIS_URL": "redis://localhost:6379/0",
    "AI_PROVIDER": "stub",
    "AI_API_KEY": "",
    "AI_MODEL": "",
    "AI_OPENAI_BASE_URL": "",
    "AI_ANTHROPIC_BASE_URL": "",
}

KNOWN_LOCAL_MYSQL_URLS = {
    "mysql+pymysql://xingdianping:xingdianping@localhost:3306/xingdianping",
    "mysql+pymysql://xingdianping:xingdianping@127.0.0.1:3306/xingdianping",
    "mysql+pymysql://xingdianping:xingdianping@mysql:3306/xingdianping",
}

DEV_PORT_CANDIDATES = tuple(range(3000, 3006)) + tuple(range(8000, 8006))


def write_console_line(message: str, *, stream: object = sys.stdout) -> None:
    target = stream
    line = f"{message}\n"
    try:
        target.write(line)
    except UnicodeEncodeError:
        encoding = getattr(target, "encoding", None) or "utf-8"
        data = line.encode(encoding, errors="replace")
        buffer = getattr(target, "buffer", None)
        if buffer is not None:
            buffer.write(data)
        else:
            fallback = data.decode(encoding, errors="replace")
            target.write(fallback)
    target.flush()


def info(message: str) -> None:
    write_console_line(f"[start] {message}")


def warn(message: str) -> None:
    write_console_line(f"[start][warn] {message}")


def fail(message: str) -> None:
    write_console_line(f"[start][error] {message}", stream=sys.stderr)
    raise SystemExit(1)


def load_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def write_env_file(path: Path, values: dict[str, str]) -> None:
    content = "\n".join(f"{key}={value}" for key, value in values.items()) + "\n"
    path.write_text(content, encoding="utf-8")


def load_secret_file(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}

    text = path.read_text(encoding="utf-8", errors="replace")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    secret_values: dict[str, str] = {}

    if lines:
        first_line = lines[0]
        if "http" not in first_line and "=" not in first_line:
            if ":" in first_line or "：" in first_line:
                first_line = re.split(r"[:：]", first_line, maxsplit=1)[-1].strip()
            secret_values["AI_MODEL"] = first_line

    urls = re.findall(r"https?://[^\s]+", text)
    for url in urls:
        lowered = url.lower()
        if "openai" in lowered or lowered.endswith("/v3"):
            secret_values["AI_OPENAI_BASE_URL"] = url
        elif "anthropic" in lowered or "coding" in lowered:
            secret_values.setdefault("AI_ANTHROPIC_BASE_URL", url)

    api_key_match = re.search(r"([A-Za-z0-9]{8,}(?:-[A-Za-z0-9]{4,}){2,})", text)
    if api_key_match:
        secret_values["AI_API_KEY"] = api_key_match.group(1)
        secret_values["AI_PROVIDER"] = "custom"

    return secret_values


def ensure_env_file() -> dict[str, str]:
    existing = load_env_file(ENV_FILE)
    if not ENV_FILE.exists():
        file_values = load_env_file(ENV_EXAMPLE_FILE)
        merged_values = {**file_values, **DEFAULT_ENV}
        write_env_file(ENV_FILE, merged_values)
        info("Created .env with local development defaults.")
        return merged_values

    merged_values = {**DEFAULT_ENV, **existing}
    if "@mysql:" in existing.get("DATABASE_URL", ""):
        warn("DATABASE_URL points to docker alias `mysql`; the launcher will use `localhost` at runtime.")
    if "redis://redis" in existing.get("REDIS_URL", ""):
        warn("REDIS_URL points to docker alias `redis`; the launcher will use `localhost` at runtime.")
    return merged_values


def print_help() -> None:
    print(
        "Usage: python start.py\n"
        "Starts the active monorepo app stack: Next.js frontend in apps/web and FastAPI in apps/api.",
        flush=True,
    )


def parse_args(argv: list[str]) -> None:
    for argument in argv[1:]:
        if argument in {"-h", "--help"}:
            print_help()
            raise SystemExit(0)
        fail(f"Unknown argument `{argument}`. The archived legacy frontend was removed from the runtime chain.")


def ensure_command(command: str, hint: str) -> None:
    if shutil.which(command):
        return
    fail(f"Missing required command `{command}`. {hint}")


def resolve_command(command: list[str]) -> list[str]:
    resolved = shutil.which(command[0])
    if not resolved:
        return command
    return [resolved, *command[1:]]


def run_step(command: list[str], *, cwd: Path, env: dict[str, str], label: str) -> None:
    info(label)
    subprocess.run(resolve_command(command), cwd=cwd, env=env, check=True)


def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return sock.connect_ex(("127.0.0.1", port)) == 0


def normalize_json_result(payload: str) -> list[dict[str, object]]:
    payload = payload.strip()
    if not payload:
        return []
    data = json.loads(payload)
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if isinstance(data, dict):
        return [data]
    return []


def _workspace_dev_process_matches(process: dict[str, object]) -> bool:
    pid = int(process.get("pid", 0) or 0)
    if pid == os.getpid():
        return False

    command_line = str(process.get("command_line", "") or "").lower()
    if not command_line:
        return False

    workspace_root = str(ROOT).lower()
    next_signature = "node_modules\\next\\dist\\server\\lib\\start-server.js"
    api_signature = "-m uvicorn app.main:app"

    if workspace_root in command_line and next_signature in command_line:
        return True
    if api_signature in command_line:
        return True
    return False


def list_workspace_dev_processes_on_ports(ports: tuple[int, ...]) -> list[dict[str, object]]:
    if os.name != "nt":
        return []

    port_list = ",".join(str(port) for port in ports)
    powershell_script = rf"""
$ports = @({port_list})
$connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {{ $ports -contains $_.LocalPort }}
if (-not $connections) {{
  return
}}
$result = foreach ($group in ($connections | Group-Object OwningProcess)) {{
  $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $($group.Name)" -ErrorAction SilentlyContinue
  if (-not $proc) {{
    continue
  }}
  [PSCustomObject]@{{
    pid = [int]$group.Name
    name = $proc.Name
    command_line = $proc.CommandLine
    ports = @($group.Group | ForEach-Object {{ $_.LocalPort }} | Sort-Object -Unique)
  }}
}}
$result | ConvertTo-Json -Compress
"""
    result = subprocess.run(
        ["powershell", "-NoProfile", "-Command", powershell_script],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        warn(f"Unable to inspect existing dev listeners: {result.stderr.strip() or result.stdout.strip()}")
        return []

    return [item for item in normalize_json_result(result.stdout) if _workspace_dev_process_matches(item)]


def terminate_workspace_dev_processes() -> None:
    matches = list_workspace_dev_processes_on_ports(DEV_PORT_CANDIDATES)
    if not matches:
        return

    info("Cleaning up stale workspace dev processes on ports 3000-3005 and 8000-8005...")
    for process in matches:
        pid = int(process["pid"])
        name = str(process.get("name", "process"))
        ports = ",".join(str(port) for port in process.get("ports", []))
        info(f"Stopping stale {name} (pid={pid}, ports={ports})")
        try:
            if os.name == "nt":
                subprocess.run(
                    ["taskkill", "/PID", str(pid), "/T", "/F"],
                    cwd=ROOT,
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    check=False,
                )
            else:
                os.kill(pid, signal.SIGTERM)
        except OSError:
            continue

    deadline = time.time() + 8
    while time.time() < deadline:
        active_pids = {int(item["pid"]) for item in list_workspace_dev_processes_on_ports(DEV_PORT_CANDIDATES)}
        if not active_pids:
            return
        time.sleep(0.5)

    warn("Some stale workspace dev processes are still listening after cleanup; fallback ports may still be used.")


def should_fallback_to_sqlite(database_url: str) -> bool:
    if database_url not in KNOWN_LOCAL_MYSQL_URLS:
        return False
    return not is_port_in_use(3306)


def find_available_port(preferred_port: int, name: str, max_attempts: int = 50) -> int:
    port = preferred_port
    attempts = 0
    while attempts < max_attempts:
        if not is_port_in_use(port):
            if port != preferred_port:
                warn(f"{name} preferred port {preferred_port} is busy; switching to {port}.")
            return port
        attempts += 1
        port += 1

    fail(f"Could not find an available port for {name} after checking {preferred_port}-{port - 1}.")


def has_python_packages() -> bool:
    probe = [
        sys.executable,
        "-c",
        "import fastapi, uvicorn, sqlalchemy, redis, pydantic_settings, pymysql",
    ]
    result = subprocess.run(probe, cwd=ROOT, capture_output=True, text=True)
    return result.returncode == 0


def ensure_python_dependencies(env: dict[str, str]) -> None:
    if has_python_packages():
        info("Python dependencies are available.")
        return

    run_step(
        [sys.executable, "-m", "pip", "install", "-e", ".[dev]"],
        cwd=API_DIR,
        env=env,
        label="Installing API dependencies...",
    )


def ensure_node_dependencies(env: dict[str, str]) -> None:
    node_modules_dir = ROOT / "node_modules"
    if node_modules_dir.exists():
        info("Frontend dependencies already exist.")
        return

    run_step(
        ["npm", "install"],
        cwd=ROOT,
        env=env,
        label="Installing frontend dependencies...",
    )


def ensure_infra(env: dict[str, str]) -> None:
    if not shutil.which("docker"):
        warn("Docker is not installed, so MySQL/Redis auto-start is skipped.")
        return

    run_step(
        ["docker", "compose", "-f", str(DOCKER_COMPOSE_FILE), "up", "-d", "mysql", "redis"],
        cwd=ROOT,
        env=env,
        label="Starting MySQL and Redis containers...",
    )


def stream_output(process: subprocess.Popen[str], prefix: str) -> None:
    assert process.stdout is not None
    for line in process.stdout:
        write_console_line(f"[{prefix}] {line.rstrip()}")


def wait_for_http_ready(url: str, *, name: str, timeout_seconds: int = 45) -> None:
    deadline = time.time() + timeout_seconds
    last_error = ""

    while time.time() < deadline:
        try:
            request = Request(url, headers={"User-Agent": "start.py"})
            with urlopen(request, timeout=3) as response:
                if 200 <= response.status < 500:
                    info(f"{name} responded successfully at {url}.")
                    return
        except Exception as exc:
            last_error = str(exc)

        time.sleep(1)

    warn(f"{name} did not become reachable within {timeout_seconds}s at {url}. Last error: {last_error or 'unknown'}")


def terminate_process(process: subprocess.Popen[str], name: str) -> None:
    if process.poll() is not None:
        return

    info(f"Stopping {name}...")
    if os.name == "nt":
        try:
            process.send_signal(signal.CTRL_BREAK_EVENT)
        except Exception:
            process.terminate()
    else:
        process.terminate()

    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        warn(f"{name} did not exit within 10 seconds; killing it.")
        process.kill()
        process.wait(timeout=5)


def spawn_process(
    command: list[str],
    *,
    cwd: Path,
    env: dict[str, str],
    name: str,
) -> tuple[subprocess.Popen[str], threading.Thread]:
    creationflags = 0
    if os.name == "nt":
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP

    process = subprocess.Popen(
        resolve_command(command),
        cwd=cwd,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
        creationflags=creationflags,
    )
    thread = threading.Thread(target=stream_output, args=(process, name), daemon=True)
    thread.start()
    return process, thread


def wait_for_processes(processes: list[tuple[str, subprocess.Popen[str]]]) -> int:
    try:
        while True:
            for name, process in processes:
                code = process.poll()
                if code is not None:
                    warn(f"{name} exited with code {code}.")
                    return code
            time.sleep(1)
    except KeyboardInterrupt:
        info("Ctrl+C received, shutting down child processes.")
        return 0


def build_runtime_env(
    file_env: dict[str, str],
    secret_env: dict[str, str],
    *,
    api_port: int,
    web_port: int,
) -> dict[str, str]:
    env = os.environ.copy()
    env.update(DEFAULT_ENV)
    env.update(file_env)
    env.update(secret_env)
    env["NEXT_PUBLIC_API_BASE_URL"] = f"http://localhost:{api_port}"
    env["FRONTEND_MODE"] = "web"
    env["FRONTEND_PORT"] = str(web_port)
    env.setdefault("PYTHONUTF8", "1")
    env.setdefault("PYTHONIOENCODING", "utf-8")
    if should_fallback_to_sqlite(env["DATABASE_URL"]):
        warn("Local MySQL is unavailable; falling back to SQLite at ./xingdianping.db for development startup.")
        env["DATABASE_URL"] = DEFAULT_ENV["DATABASE_URL"]
    return env


def main() -> None:
    parse_args(sys.argv)

    info("Preparing one-click local startup for the monorepo web app...")
    ensure_command("npm", "Install Node.js first.")
    if not Path(sys.executable).exists():
        fail(f"Python executable was not found: {sys.executable}")
    if not WEB_DIR.exists():
        fail(f"Frontend directory does not exist: {WEB_DIR}")

    file_env = ensure_env_file()
    secret_env = load_secret_file(SECRET_FILE)
    if secret_env.get("AI_API_KEY"):
        info(f"Loaded AI settings from {SECRET_FILE.name}.")
    elif SECRET_FILE.exists():
        warn(f"{SECRET_FILE.name} was found, but no valid AI key was detected.")

    terminate_workspace_dev_processes()

    api_port = find_available_port(DEFAULT_API_PORT, "API")
    web_port = find_available_port(DEFAULT_WEB_PORT, "Web")
    runtime_env = build_runtime_env(
        file_env,
        secret_env,
        api_port=api_port,
        web_port=web_port,
    )

    ensure_python_dependencies(runtime_env)
    ensure_node_dependencies(runtime_env)
    ensure_infra(runtime_env)

    info("Starting API and Next.js development servers...")
    api_process, api_thread = spawn_process(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "app.main:app",
            "--reload",
            "--host",
            "0.0.0.0",
            "--port",
            str(api_port),
        ],
        cwd=API_DIR,
        env=runtime_env,
        name="api",
    )
    web_process, web_thread = spawn_process(
        ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", str(web_port)],
        cwd=WEB_DIR,
        env=runtime_env,
        name="web",
    )

    web_url = f"http://localhost:{web_port}"
    api_url = f"http://localhost:{api_port}"
    info(f"Web: {web_url}")
    info(f"API: {api_url}")

    wait_for_http_ready(f"{api_url}/health", name="API")
    wait_for_http_ready(web_url, name="Web")

    info("Startup complete. This launcher stays in the foreground to keep both dev servers alive.")
    info("Next.js usually logs again only after a browser request or file change, so silence here is normal.")
    info("Press Ctrl+C to stop all child processes started by this launcher.")

    exit_code = wait_for_processes([("api", api_process), ("web", web_process)])

    terminate_process(web_process, "Web")
    terminate_process(api_process, "API")
    api_thread.join(timeout=2)
    web_thread.join(timeout=2)

    if exit_code not in (0, None):
        raise SystemExit(exit_code)


if __name__ == "__main__":
    main()
