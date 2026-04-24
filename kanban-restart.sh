#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST="${KANBAN_RUNTIME_HOST:-0.0.0.0}"
PORT="${KANBAN_RUNTIME_PORT:-3484}"
PID_FILE="${ROOT_DIR}/.kanban-runtime.pid"
LOG_FILE="${ROOT_DIR}/.kanban-runtime.log"
CMD=(node dist/cli.js --host "${HOST}" --port "${PORT}" --no-open --no-passcode)

usage() {
  cat <<EOF
Usage: $(basename "$0") <start|stop|restart|status>

Env overrides:
  KANBAN_RUNTIME_HOST   default: ${HOST}
  KANBAN_RUNTIME_PORT   default: ${PORT}
EOF
}

pid_is_running() {
  local pid="$1"
  [[ -n "${pid}" ]] || return 1
  kill -0 "${pid}" 2>/dev/null
}

read_pid_file() {
  [[ -f "${PID_FILE}" ]] || return 1
  tr -d '[:space:]' < "${PID_FILE}"
  printf '\n'
}

matching_pids() {
  pgrep -f "node dist/cli\\.js.*--port ${PORT}( |$)" || true
}

listener_pids() {
  ss -ltnp 2>/dev/null \
    | awk -v port=":${PORT}" '$4 ~ port { print $NF }' \
    | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' \
    | sort -u
}

current_pids() {
  {
    read_pid_file || true
    matching_pids
    listener_pids
  } | awk 'NF' | sort -u
}

cleanup_stale_pid_file() {
  local pid
  pid="$(read_pid_file || true)"
  if [[ -n "${pid}" ]] && ! pid_is_running "${pid}"; then
    rm -f "${PID_FILE}"
  fi
}

stop_running() {
  local pids pid
  mapfile -t pids < <(current_pids)
  if [[ "${#pids[@]}" -eq 0 ]]; then
    rm -f "${PID_FILE}"
    echo "Kanban not running."
    return 0
  fi

  echo "Stopping Kanban: ${pids[*]}"
  for pid in "${pids[@]}"; do
    kill "${pid}" 2>/dev/null || true
  done

  local deadline=$((SECONDS + 15))
  while (( SECONDS < deadline )); do
    local alive=0
    for pid in "${pids[@]}"; do
      if pid_is_running "${pid}"; then
        alive=1
        break
      fi
    done
    (( alive == 0 )) && break
    sleep 1
  done

  for pid in "${pids[@]}"; do
    if pid_is_running "${pid}"; then
      echo "Force killing Kanban pid ${pid}"
      kill -9 "${pid}" 2>/dev/null || true
    fi
  done

  rm -f "${PID_FILE}"
}

start_running() {
  cleanup_stale_pid_file

  local pids
  mapfile -t pids < <(current_pids)
  if [[ "${#pids[@]}" -gt 0 ]]; then
    echo "Kanban already running: ${pids[*]}"
    return 0
  fi

  mkdir -p "$(dirname "${LOG_FILE}")"
  touch "${LOG_FILE}"

  echo "Starting Kanban on ${HOST}:${PORT}"
  (
    cd "${ROOT_DIR}"
    setsid env KANBAN_RUNTIME_HOST="${HOST}" KANBAN_RUNTIME_PORT="${PORT}" \
      "${CMD[@]}" >> "${LOG_FILE}" 2>&1 < /dev/null &
    printf '%s\n' "$!" > "${PID_FILE}"
  )

  local pid
  pid="$(read_pid_file || true)"
  if [[ -z "${pid}" ]]; then
    echo "Failed to record Kanban pid."
    return 1
  fi

  local deadline=$((SECONDS + 15))
  while (( SECONDS < deadline )); do
    if pid_is_running "${pid}" && [[ -n "$(listener_pids)" ]]; then
      echo "Kanban started: pid=${pid} log=${LOG_FILE}"
      return 0
    fi
    sleep 1
  done

  echo "Kanban failed to start. Recent log:"
  tail -n 40 "${LOG_FILE}" || true
  return 1
}

status_running() {
  cleanup_stale_pid_file
  local pids
  mapfile -t pids < <(current_pids)
  if [[ "${#pids[@]}" -eq 0 ]]; then
    echo "Kanban status: stopped"
    return 1
  fi
  echo "Kanban status: running (${pids[*]}) on ${HOST}:${PORT}"
  echo "Log: ${LOG_FILE}"
}

main() {
  local action="${1:-restart}"
  case "${action}" in
    start)
      start_running
      ;;
    stop)
      stop_running
      ;;
    restart)
      stop_running
      start_running
      ;;
    status)
      status_running
      ;;
    *)
      usage
      exit 2
      ;;
  esac
}

main "$@"
