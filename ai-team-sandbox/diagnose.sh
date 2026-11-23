#!/usr/bin/env bash
set -euo pipefail

repo_name="dynamic-api"
project_name="dynamic-api-sandbox"
state_dir="${AI_TEAM_SANDBOX_HOME:?}/${repo_name}"

if [[ -s "${state_dir}/http-port" ]]; then
  service_port="$(tr -cd '0-9' < "${state_dir}/http-port")"
else
  echo "saved_port=missing"
  exit 10
fi
echo "saved_port=${service_port}"

echo "target_addresses:"
ip -brief address show scope global || true
echo "port_listener:"
ss -H -ltnp "sport = :${service_port}" || true

echo "filesystem_usage:"
df -h / /home/aiteam-docker 2>/dev/null || df -h / || true
echo "docker_space_usage:"
docker system df || true
echo "running_postgres_inventory:"
mapfile -t running_postgres_containers < <(
  docker ps --format '{{.ID}} {{.Image}}' \
    | awk 'tolower($2) ~ /postgres/ {print $1}'
)
if (( ${#running_postgres_containers[@]} == 0 )); then
  echo "postgres_container=none"
else
  for postgres_id in "${running_postgres_containers[@]}"; do
    docker inspect --format 'postgres_container={{.Name}} image={{.Config.Image}} running={{.State.Running}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}} compose_project={{index .Config.Labels "com.docker.compose.project"}} compose_service={{index .Config.Labels "com.docker.compose.service"}} published={{json .NetworkSettings.Ports}} networks={{range $name, $_ := .NetworkSettings.Networks}}{{$name}} {{end}}' "${postgres_id}" \
      | sed 's#postgres_container=/#postgres_container=#' || true
  done
fi
echo "postgres_listeners:"
ss -H -ltnp | awk '$4 ~ /:5432$/ {print}' || true
echo "project_images:"
docker images --filter 'reference=dynamic-api-sandbox*' --format 'repository={{.Repository}} tag={{.Tag}} id={{.ID}} created={{.CreatedSince}} size={{.Size}}' || true

docker ps -a --filter "label=com.docker.compose.project=${project_name}" --format 'container={{.Names}} status={{.Status}} ports={{.Ports}}' || true
mapfile -t app_containers < <(docker ps -a --filter "label=com.docker.compose.project=${project_name}" --filter "label=com.docker.compose.service=dynamic-api-app" --format '{{.ID}}')
if (( ${#app_containers[@]} == 1 )); then
  container_id="${app_containers[0]}"
  diagnose_tmp="$(mktemp -d)"
  trap 'rm -rf "${diagnose_tmp}"' EXIT
  for host in 127.0.0.1 192.168.56.20; do
    status="$(curl --silent --show-error --max-time 5 --output /dev/null --write-out '%{http_code}' "http://${host}:${service_port}/dynamic-api/" || true)"
    echo "homepage_probe host=${host} status=${status}"
  done
  for path in api/getControllers ws/getEndpoints api/getOpenApi; do
    probe_file="${diagnose_tmp}/$(tr '/' '-' <<<"${path}").out"
    status="$(curl --silent --show-error --max-time 8 --output "${probe_file}" --write-out '%{http_code}' "http://127.0.0.1:${service_port}/dynamic-api/${path}" || true)"
    echo "api_probe path=${path} status=${status} body=$(tr '\r\n' '  ' < "${probe_file}" | head -c 240)"
  done
  echo "container_network:"
  docker inspect --format 'running={{.State.Running}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}} published={{json .NetworkSettings.Ports}}' "${container_id}" || true
  echo "container_image:"
  docker inspect --format 'image={{.Config.Image}} image_id={{.Image}} created={{.Created}}' "${container_id}" || true
  echo "container_runtime_contract:"
  docker inspect --format 'entrypoint={{json .Config.Entrypoint}} healthcheck={{json .Config.Healthcheck}} restart={{json .HostConfig.RestartPolicy}}' "${container_id}" || true
  echo "container_command_option_names:"
  docker inspect --format '{{json .Config.Cmd}}' "${container_id}" \
    | python3 -c 'import json,sys; args=json.load(sys.stdin) or []; print("\n".join((arg.split("=",1)[0] if arg.startswith("--") else "<non-option>") for arg in args))' || true
  echo "compose_metadata:"
  docker inspect --format 'working_dir={{index .Config.Labels "com.docker.compose.project.working_dir"}} config_files={{index .Config.Labels "com.docker.compose.project.config_files"}}' "${container_id}" || true
  if docker cp "${container_id}:/app/app.jar" "${diagnose_tmp}/app.jar" >/dev/null 2>&1; then
    if unzip -l "${diagnose_tmp}/app.jar" | grep -Fq 'BOOT-INF/classes/com/dynamicapi/controller/OpenApiController.class'; then
      echo "openapi_controller_class=present"
    else
      echo "openapi_controller_class=missing"
    fi
  else
    echo "openapi_controller_class=unavailable"
  fi
  echo "named_volume_mounts:"
  docker inspect --format '{{range .Mounts}}{{if eq .Type "volume"}}name={{.Name}} destination={{.Destination}}{{println}}{{end}}{{end}}' "${container_id}" || true
  echo "recent_manager_failures:"
  docker logs --since 30m "${container_id}" 2>&1 \
    | grep -E -i 'error|exception|status 500|completed 500|failed' \
    | tail -n 80 || true
  echo "recent_startup_summary:"
  docker logs --tail 600 "${container_id}" 2>&1 \
    | grep -E 'APPLICATION FAILED|Caused by:|Started Dynamic|Ambiguous mapping|ERROR .*Dynamic|Exception encountered during context initialization' \
    | tail -n 80 || true
  echo "version_summary:"
  docker inspect --format 'image={{.Config.Image}} image_id={{.Image}} created={{.Created}}' "${container_id}" || true
  if [[ -s "${diagnose_tmp}/app.jar" ]] && unzip -l "${diagnose_tmp}/app.jar" | grep -Fq 'BOOT-INF/classes/com/dynamicapi/controller/OpenApiController.class'; then
    echo "openapi_controller_class=present"
  else
    echo "openapi_controller_class=missing_or_unavailable"
  fi
fi
if command -v ufw >/dev/null 2>&1; then
  ufw status verbose || true
fi

# Keep resource evidence at the end because the fixed executor preserves the
# final output lines in its receipt.
echo "resource_summary:"
df -h / /home/aiteam-docker 2>/dev/null || df -h / || true
docker system df || true
docker images --filter 'reference=dynamic-api-sandbox*' --format 'project_image repository={{.Repository}} tag={{.Tag}} id={{.ID}} created={{.CreatedSince}} size={{.Size}}' || true
echo "host_cache_usage:"
du -x -d 2 -h /var/cache /var/lib/apt/lists /root/.cache 2>/dev/null | sort -h | tail -n 12 || true
echo "rootless_docker_usage:"
du -x -d 3 -h /home/aiteam-docker/.local/share/docker 2>/dev/null | sort -h | tail -n 12 || true

# The fixed executor retains the final output lines in its receipt.  Repeat a
# concise application diagnosis here so a failed start can be classified
# without exposing the container environment or sandbox credentials.
if (( ${#app_containers[@]} == 1 )); then
  echo "final_application_state:"
  docker inspect --format 'running={{.State.Running}} exit_code={{.State.ExitCode}} error={{json .State.Error}} image={{.Config.Image}} image_id={{.Image}}' "${container_id}" || true
  echo "final_environment_keys:"
  docker inspect --format '{{json .Config.Env}}' "${container_id}" \
    | python3 -c 'import json,sys; print(",".join(sorted(x.split("=",1)[0] for x in json.load(sys.stdin))))' || true
  echo "final_command_option_names:"
  docker inspect --format '{{json .Config.Cmd}}' "${container_id}" \
    | python3 -c 'import json,sys; args=json.load(sys.stdin) or []; print(",".join((arg.split("=",1)[0] if arg.startswith("--") else "<non-option>") for arg in args))' || true
  echo "final_startup_failures:"
  docker logs "${container_id}" 2>&1 \
    | grep -E 'APPLICATION FAILED|Caused by:|Flyway|Migration|SQL State|ERROR|Exception encountered during context initialization' \
    | tail -n 5 || true
  echo "final_database_selection:"
  docker logs "${container_id}" 2>&1 \
    | grep -iE 'Database:|HikariPool|jdbc:(sqlite|postgresql)|database platform' \
    | tail -n 3 || true
fi
echo "final_resource_state:"
df -h /home/aiteam-docker 2>/dev/null || df -h / || true
df -B1 --output=size,used,avail,pcent,target /home/aiteam-docker 2>/dev/null || true
docker images --filter 'reference=dynamic-api-sandbox*' --format 'repository={{.Repository}} tag={{.Tag}} id={{.ID}} size={{.Size}}' || true
echo "final_project_state_usage:"
du -x -d 3 -h "${state_dir}" 2>/dev/null | sort -h | tail -n 12 || true
echo "final_project_image_usage:"
docker system df --verbose 2>/dev/null \
  | awk 'BEGIN {show=0} /^Images space usage:/ {show=1} /^Containers space usage:/ {show=0} show && /dynamic-api-sandbox/ {print}' || true
if (( ${#app_containers[@]} == 1 )); then
  echo "final_preserved_jar_inventory:"
  docker exec "${container_id}" sh -c 'find /data/jars -maxdepth 2 -type f -name "*.jar" -printf "%s %p\n" 2>/dev/null | sort -n' || true
  echo "final_sqlite_migrations:"
  sqlite_copy="$(mktemp)"
  if docker cp "${container_id}:/data/sqlite/webservice.db" "${sqlite_copy}" >/dev/null 2>&1; then
    python3 - "${sqlite_copy}" <<'PY' || true
import sqlite3,sys
database=sqlite3.connect(f"file:{sys.argv[1]}?mode=ro",uri=True)
for row in database.execute("SELECT installed_rank, version, description, script, checksum, success FROM flyway_schema_history ORDER BY installed_rank"):
    print("|".join("" if value is None else str(value) for value in row))
database.close()
PY
  else
    echo "sqlite_history=unavailable"
  fi
  rm -f "${sqlite_copy}"
fi
mapfile -t postgres_containers < <(docker ps --filter 'label=com.docker.compose.project=ai-team-bestpartner' --filter 'label=com.docker.compose.service=postgres' --format '{{.ID}}')
credential_file="${state_dir}/postgres.env"
if (( ${#postgres_containers[@]} == 1 )) && [[ -s "${credential_file}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${credential_file}"
  set +a
  echo "final_postgres_migrations:"
  printf '%s\n' "${POSTGRES_PASSWORD}" | docker exec -i "${postgres_containers[0]}" sh -c 'IFS= read -r PGPASSWORD; export PGPASSWORD; psql -h 127.0.0.1 -U dynamic_api -d dynamic_api -Atq -c "SELECT installed_rank, version, description, script, checksum, success FROM flyway_schema_history ORDER BY installed_rank"' || true
fi
echo "final_running_postgres_inventory:"
if (( ${#running_postgres_containers[@]} == 0 )); then
  echo "postgres_container=none"
else
  for postgres_id in "${running_postgres_containers[@]}"; do
    docker inspect --format 'postgres_container={{.Name}} image={{.Config.Image}} running={{.State.Running}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}} compose_project={{index .Config.Labels "com.docker.compose.project"}} compose_service={{index .Config.Labels "com.docker.compose.service"}} published={{json .NetworkSettings.Ports}} networks={{range $name, $_ := .NetworkSettings.Networks}}{{$name}} {{end}}' "${postgres_id}" \
      | sed 's#postgres_container=/#postgres_container=#' || true
  done
fi
if (( ${#app_containers[@]} == 1 )); then
  echo "final_current_command_option_names:"
  docker inspect --format '{{json .Config.Cmd}}' "${container_id}" \
    | python3 -c 'import json,sys; args=json.load(sys.stdin) or []; print(",".join((arg.split("=",1)[0] if arg.startswith("--") else "<non-option>") for arg in args))' || true
  echo "final_postgresql_startup_evidence:"
  final_log="${diagnose_tmp}/final-container.log"
  docker logs "${container_id}" > "${final_log}" 2>&1 || true
  grep -iE 'org\.postgresql\.Driver|classpath:db\.postgresql|Database: jdbc:postgresql' "${final_log}" \
    | tail -n 3 || true
  if grep -Fq 'org.postgresql.Driver' "${final_log}"; then
    echo "final_postgresql_driver_log_marker=present"
  else
    echo "final_postgresql_driver_log_marker=absent"
  fi
  if grep -Fq 'classpath:db.postgresql' "${final_log}"; then
    echo "final_postgresql_flyway_location_log_marker=present"
  else
    echo "final_postgresql_flyway_location_log_marker=absent"
  fi
  if grep -qi 'jdbc:sqlite' "${final_log}"; then
    echo "final_sqlite_startup_marker=present"
  else
    echo "final_sqlite_startup_marker=absent"
  fi
  echo "final_port_binding:"
  docker inspect --format 'published={{json .NetworkSettings.Ports}}' "${container_id}" || true
  for final_probe_host in 127.0.0.1 192.168.56.20; do
    final_probe_status="$(curl --silent --show-error --max-time 5 --output /dev/null --write-out '%{http_code}' "http://${final_probe_host}:${service_port}/dynamic-api/" || true)"
    echo "final_homepage_probe host=${final_probe_host} status=${final_probe_status}"
  done
fi
