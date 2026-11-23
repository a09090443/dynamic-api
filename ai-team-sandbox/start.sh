#!/usr/bin/env bash
set -euo pipefail

source_fingerprint="$(python3 qa/source-fingerprint.py)"
repo_name="dynamic-api"
project_name="dynamic-api-sandbox"
service_name="dynamic-api-app"
state_dir="${AI_TEAM_SANDBOX_HOME:?}/${repo_name}"
port_file="${state_dir}/http-port"
deployment_file="${state_dir}/restful-deployment.json"
credential_file="${state_dir}/postgres.env"
runtime_config_dir="/home/aiteam-docker/.config/${project_name}"
runtime_data_source="${runtime_config_dir}/data-source.properties"
postgres_provider_project="ai-team-bestpartner"
postgres_provider_service="postgres"
gradle_version="8.7"
gradle_home="${state_dir}/tools/gradle-${gradle_version}"

mkdir -p "${state_dir}"
test -s "${credential_file}"
chmod 600 "${credential_file}"
set -a
# The credential file is generated and retained only on the sandbox target.
# shellcheck disable=SC1090
source "${credential_file}"
set +a
install -d -m 700 -o aiteam-docker -g aiteam-docker "${runtime_config_dir}"

test -s "${port_file}"
service_port="$(tr -cd '0-9' < "${port_file}")"
[[ "${service_port}" =~ ^[0-9]+$ ]] || { echo "INVALID_STATE: saved HTTP port is not numeric" >&2; exit 10; }

mapfile -t containers < <(docker ps -a --filter "label=com.docker.compose.project=${project_name}" --filter "label=com.docker.compose.service=${service_name}" --format '{{.ID}}')
(( ${#containers[@]} == 1 )) || { echo "MANAGER_CONTAINER_NOT_UNIQUE: found ${#containers[@]}" >&2; exit 11; }
container_id="${containers[0]}"
if ss -H -ltn "sport = :${service_port}" | grep -q .; then
  [[ "$(docker ps --filter "publish=${service_port}" --format '{{.ID}}' | head -n 1)" == "${container_id}" ]] || { echo "PORT_IN_USE: ${service_port}" >&2; exit 12; }
fi
mapfile -t volumes < <(docker inspect --format '{{range .Mounts}}{{if eq .Type "volume"}}{{println .Name}}{{end}}{{end}}' "${container_id}")
(( ${#volumes[@]} >= 1 )) || { echo "DATA_VOLUME_MISSING" >&2; exit 13; }
mapfile -t postgres_provider_containers < <(docker ps \
  --filter "label=com.docker.compose.project=${postgres_provider_project}" \
  --filter "label=com.docker.compose.service=${postgres_provider_service}" \
  --format '{{.ID}}')
(( ${#postgres_provider_containers[@]} == 1 )) || { echo "POSTGRES_PROVIDER_NOT_UNIQUE: found ${#postgres_provider_containers[@]}" >&2; exit 24; }
postgres_provider_id="${postgres_provider_containers[0]}"
postgres_provider_health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "${postgres_provider_id}")"
[[ "${postgres_provider_health}" == healthy ]] || { echo "POSTGRES_PROVIDER_UNHEALTHY: ${postgres_provider_health}" >&2; exit 25; }
postgres_provider_name="$(docker inspect --format '{{.Name}}' "${postgres_provider_id}" | sed 's#^/##')"
mapfile -t postgres_provider_networks < <(docker inspect --format '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' "${postgres_provider_id}")
(( ${#postgres_provider_networks[@]} >= 1 )) || { echo "POSTGRES_PROVIDER_NETWORK_MISSING" >&2; exit 26; }
postgres_provider_network="${postgres_provider_networks[0]}"
umask 077
printf '%s\n' \
  'dynamic.primary=webservice' \
  'dynamic.entity-scan=com.dynamicapi' \
  'dynamic.is-encrypt=false' \
  'dynamic.data-source-map[webservice].name=webservice' \
  "dynamic.data-source-map[webservice].url=jdbc:postgresql://${postgres_provider_name}:5432/${POSTGRES_DB}" \
  "dynamic.data-source-map[webservice].username=${POSTGRES_USER}" \
  "dynamic.data-source-map[webservice].pa55word=${POSTGRES_PASSWORD}" \
  'dynamic.data-source-map[webservice].driverClassName=org.postgresql.Driver' \
  'app.database.dialect=org.hibernate.dialect.PostgreSQLDialect' \
  'app.database.flyway-locations=classpath:db.postgresql' \
  > "${runtime_data_source}"
chown aiteam-docker:aiteam-docker "${runtime_data_source}"
chmod 600 "${runtime_data_source}"

tmp="$(mktemp -d)"
trap 'rm -rf "${tmp}"' EXIT
old_image_id="$(docker inspect --format '{{.Image}}' "${container_id}")"
image_ref="dynamic-api-sandbox:preview-${AI_TEAM_OPERATION_ID:?}"
rollback_ref="dynamic-api-sandbox:rollback-preview"
docker tag "${old_image_id}" "${rollback_ref}"
reuse_candidate=false
candidate_image_id=""

# A restored container can retain a Compose label that points into an expired
# delivery directory.  Persist an equivalent definition under this project's
# sandbox state, using the live container contract without printing its env.
docker inspect "${container_id}" > "${tmp}/container-inspect.json"
compose_workdir="${state_dir}"
rollback_compose_file="${tmp}/rollback-compose.json"
compose_file="${state_dir}/compose.json"
python3 - "${tmp}/container-inspect.json" "${rollback_compose_file}" "${compose_file}" "${service_name}" "${image_ref}" "${rollback_ref}" "${service_port}" "${postgres_provider_name}" "${postgres_provider_network}" "${runtime_data_source}" <<'PY'
import copy,json,os,sys,tempfile

source=json.load(open(sys.argv[1],encoding="utf-8"))[0]
rollback_path,compose_path=sys.argv[2],sys.argv[3]
service_name,image_ref,rollback_ref,port=sys.argv[4],sys.argv[5],sys.argv[6],sys.argv[7]
database,user,password=os.environ["POSTGRES_DB"],os.environ["POSTGRES_USER"],os.environ["POSTGRES_PASSWORD"]
postgres_host,postgres_network=sys.argv[8],sys.argv[9]
runtime_data_source=sys.argv[10]
config=source["Config"]
host=source["HostConfig"]
environment=[item for item in (config.get("Env") or []) if item.split("=",1)[0] != "SPRING_APPLICATION_JSON"]
original_command=config.get("Cmd") or []
spring_config={
    "dynamic":{
        "data-source-map":{
            "webservice":{
                "name":"webservice",
                "url":f"jdbc:postgresql://{postgres_host}:5432/{database}",
                "username":user,
                "pa55word":password,
                "driverClassName":"org.postgresql.Driver",
            },
        },
    },
    "app":{
        "database":{
            "dialect":"org.hibernate.dialect.PostgreSQLDialect",
            "flyway-locations":"classpath:db.postgresql",
        },
    },
}
service={
    "image": image_ref,
    "command": original_command,
    "environment": environment,
    "ports": [f"{port}:8080"],
    "volumes": [],
}
restart=(host.get("RestartPolicy") or {}).get("Name")
if restart and restart != "no":
    service["restart"]=restart
health=config.get("Healthcheck")
if health and health.get("Test"):
    converted={"test":health["Test"]}
    for docker_key,compose_key in (("Interval","interval"),("Timeout","timeout"),("StartPeriod","start_period")):
        value=health.get(docker_key)
        if value: converted[compose_key]=f"{value / 1_000_000_000:g}s"
    if health.get("Retries") is not None: converted["retries"]=health["Retries"]
    service["healthcheck"]=converted
volumes={}
for index,mount in enumerate(source.get("Mounts") or []):
    if mount.get("Type") != "volume":
        continue
    key=f"preserved_{index}"
    volumes[key]={"external":True,"name":mount["Name"]}
    service["volumes"].append({"type":"volume","source":key,"target":mount["Destination"]})
if not volumes:
    raise SystemExit("DATA_VOLUME_MISSING")
rollback_service=copy.deepcopy(service)
rollback_service["image"]=rollback_ref
rollback_document={"services":{service_name:rollback_service},"volumes":volumes}
with open(rollback_path,"w",encoding="utf-8") as output:
    json.dump(rollback_document,output,separators=(",",":"))

# The previous SQLite deployment pins its datasource in command-line
# arguments.  Spring gives those arguments higher precedence than deployment
# configuration, so omit database-related options only from the PostgreSQL
# candidate.  The rollback document above intentionally retains the original
# command unchanged.
database_option_prefixes=(
    "--dynamic.data-source-map",
    "--dynamic.primary",
    "--app.database.",
    "--spring.datasource",
    "--spring.flyway",
)
service["command"]=[
    argument for argument in original_command
    if not any(argument.startswith(prefix) for prefix in database_option_prefixes)
]

# The database starter combines duplicate map entries from property sources
# instead of replacing the classpath values.  Overlay its source file itself;
# the target-generated file is owned by the rootless Docker account and never
# enters the repository or operation output.
service["volumes"].append({
    "type":"bind",
    "source":runtime_data_source,
    "target":"/app/exploded/BOOT-INF/classes/data-source.properties",
    "read_only":True,
})
service["environment"]=environment
service["networks"]=["default","postgres_provider"]
document={
    "services":{service_name:service},
    "volumes":volumes,
    "networks":{"postgres_provider":{"external":True,"name":postgres_network}},
}
fd,path=tempfile.mkstemp(dir=os.path.dirname(compose_path),prefix="compose.",suffix=".tmp")
with os.fdopen(fd,"w",encoding="utf-8") as output:
    json.dump(document,output,separators=(",",":"))
os.replace(path,compose_path)
PY
compose_args=(--project-name "${project_name}" --file "${compose_file}")
rollback_compose_args=(--project-name "${project_name}" --file "${rollback_compose_file}")

rollback_required=false
rollback_app() {
  local status=$?
  trap - EXIT TERM INT
  if [[ "${rollback_required}" == true ]]; then
    mapfile -t rollback_containers < <(docker ps --filter "label=com.docker.compose.project=${project_name}" --filter "label=com.docker.compose.service=${service_name}" --filter "ancestor=${rollback_ref}" --format '{{.ID}}')
    if (( ${#rollback_containers[@]} == 1 )); then
      echo "ROLLBACK: preserved running image ${rollback_ref} after start failure" >&2
    else
      echo "ROLLBACK: restoring image ${rollback_ref} after start failure" >&2
      docker compose --project-directory "${compose_workdir}" "${rollback_compose_args[@]}" up --detach --no-deps --no-build --force-recreate "${service_name}" || true
    fi
  fi
  rm -rf "${tmp}"
  exit "${status}"
}
trap rollback_app EXIT
trap 'exit 143' TERM
trap 'exit 130' INT

# A failed candidate and the abandoned project-local PostgreSQL container can
# Leave containers, volumes, PostgreSQL roles and tables untouched during compilation.
base_url="http://127.0.0.1:${service_port}/dynamic-api"
api() {
  local label="$1" output="$2" status
  shift 2
  status="$(curl --silent --show-error --output "${output}" --write-out '%{http_code}' "$@")"
  [[ "${status}" == 200 ]] || { echo "${label}_HTTP_ERROR: status=${status} body=$(<"${output}")" >&2; exit 20; }
  python3 - "${output}" "${label}" <<'PY'
import json,sys
d=json.load(open(sys.argv[1],encoding="utf-8"))
if d.get("code") != 200:
    raise SystemExit(f"{sys.argv[2]}_API_ERROR: code={d.get('code')} message={d.get('message')}")
PY
}

if [[ "${reuse_candidate}" != true ]]; then
if ! command -v java >/dev/null 2>&1 || ! java -version 2>&1 | head -n 1 | grep -Eq 'version "17[.]'; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq openjdk-17-jdk-headless
fi
if ! command -v mvn >/dev/null 2>&1; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq maven
fi
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs npm
fi
if ! command -v curl >/dev/null 2>&1 || ! command -v unzip >/dev/null 2>&1; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq curl unzip
fi
if [[ ! -x "${gradle_home}/bin/gradle" ]]; then
  mkdir -p "${state_dir}/tools"
  curl --fail --location --retry 3 --output "${tmp}/gradle.zip" "https://services.gradle.org/distributions/gradle-${gradle_version}-bin.zip"
  unzip -q "${tmp}/gradle.zip" -d "${state_dir}/tools"
fi

# Build the static management UI with the target's Linux Node.js, because the
# repository Gradle task references the bundled Windows npm.cmd.  The copy is
# only a build artifact in this delivered source tree.
test -s nextjs-dynamic-api-manager/package-lock.json
(cd nextjs-dynamic-api-manager && npm ci --no-audit --no-fund && NODE_ENV=production npm run build)
test -s nextjs-dynamic-api-manager/out/index.html
rm -rf backend/src/main/resources/static
mkdir -p backend/src/main/resources/static
cp -a nextjs-dynamic-api-manager/out/. backend/src/main/resources/static/
# Match the product's copyNextjsBuild contract for exported page directories.
for page in nextjs-dynamic-api-manager/out/*/index.html; do
  [[ -f "${page}" ]] || continue
  name="${page%/index.html}"
  name="${name##*/}"
  cp -p -- "${page}" "backend/src/main/resources/static/${name}.html"
done
mkdir -p backend/src/main/resources/static/_ai-team
printf '%s\n' "$source_fingerprint" > backend/src/main/resources/static/_ai-team/source.json
test -s backend/src/main/resources/static/wsdl.html

# The delivered source tree is an operation-scoped copy.  Once the static
# assets are copied, its frontend dependencies and export are disposable and
# would otherwise compete with rootless Docker for the small sandbox disk.
rm -rf nextjs-dynamic-api-manager/node_modules nextjs-dynamic-api-manager/out


# Build the manager from this delivered source.  Run the resulting archive as
# an exploded classpath so the existing JDBC library receives ordinary file:
# resources rather than Spring Boot's nested: URLs for SQL files.
"${gradle_home}/bin/gradle" --no-daemon -p backend clean bootJar \
  -x installNextjs -x buildNextjs -x cleanStatic -x copyNextjsBuild -x buildFrontend
test -s backend/build/libs/backend-0.0.1-SNAPSHOT.jar
candidate_image_id="$(docker image inspect --format '{{.Id}}' "${image_ref}" 2>/dev/null || true)"
if [[ -n "${candidate_image_id}" && "${candidate_image_id}" != "${old_image_id}" ]]; then
  # Reclaim only this project's unused failed candidate.  Never prune shared
  # builder state, other project images, or any named data volume.
  docker image rm "${image_ref}" >/dev/null
fi
mkdir -p "${tmp}/image/exploded"
unzip -oq backend/build/libs/backend-0.0.1-SNAPSHOT.jar -d "${tmp}/image/exploded"
cat > "${tmp}/image/Dockerfile" <<'DOCKERFILE'
FROM dynamic-api-sandbox:rollback-preview
WORKDIR /app
RUN mkdir -p /data/sqlite /data/jars /data/logs /data/wsdl
COPY exploded/ /app/exploded/
EXPOSE 8080
ENTRYPOINT ["java","-cp","/app/exploded/BOOT-INF/classes:/app/exploded/BOOT-INF/lib/*","com.dynamicapi.Application"]
DOCKERFILE
docker build --tag "${image_ref}" "${tmp}/image"
fi
api controllers_before "${tmp}/controllers-before.json" "${base_url}/api/getControllers"
rollback_required=true
docker compose --project-directory "${compose_workdir}" "${compose_args[@]}" up --detach --no-deps --no-build --force-recreate "${service_name}"

mapfile -t containers < <(docker ps -a --filter "label=com.docker.compose.project=${project_name}" --filter "label=com.docker.compose.service=${service_name}" --format '{{.ID}}')
(( ${#containers[@]} == 1 )) || { echo "REBUILT_CONTAINER_NOT_UNIQUE: found ${#containers[@]}" >&2; exit 16; }
container_id="${containers[0]}"
mapfile -t rebuilt_volumes < <(docker inspect --format '{{range .Mounts}}{{if eq .Type "volume"}}{{println .Name}}{{end}}{{end}}' "${container_id}")
[[ "$(printf '%s\n' "${volumes[@]}" | sort)" == "$(printf '%s\n' "${rebuilt_volumes[@]}" | sort)" ]] || { echo "NAMED_VOLUMES_CHANGED" >&2; exit 17; }
ready=false
for _ in $(seq 1 90); do
  if curl --silent --fail --output /dev/null "${base_url}/api/getControllers"; then ready=true; break; fi
  [[ "$(docker inspect --format '{{.State.Running}}' "${container_id}" 2>/dev/null || true)" == true ]] || break
  sleep 2
done
if [[ "${ready}" != true ]]; then
  echo "candidate_application_state:" >&2
  docker inspect --format 'running={{.State.Running}} exit_code={{.State.ExitCode}} error={{json .State.Error}}' "${container_id}" >&2 || true
  echo "candidate_startup_failures:" >&2
  docker logs "${container_id}" 2>&1 \
    | grep -iE 'APPLICATION FAILED|Caused by:|Flyway|Migration|SQL State|ERROR|Exception encountered during context initialization|Database:|jdbc:(sqlite|postgresql)' \
    | tail -n 20 >&2 || true
  echo "REBUILT_MANAGER_NOT_READY" >&2
  exit 18
fi

api controllers_after "${tmp}/controllers-after.json" "${base_url}/api/getControllers"
python3 - "${tmp}/controllers-before.json" "${tmp}/controllers-after.json" <<'CHECK'
import json, sys
def state(path):
    rows = json.load(open(path)).get("data") or []
    return sorted(tuple(str(row.get(key)) for key in ("id","publishUri","classPath","isActive","jarFileId")) for row in rows)
before, after = map(state,sys.argv[1:])
if before != after:
    raise SystemExit("CONTROLLER_STATE_CHANGED")
print(f"CONTROLLERS_PRESERVED count={len(after)}")
CHECK
for suffix in /wsdl /wsdl/; do
  status="$(curl --silent --show-error --output "${tmp}/wsdl.html" --write-out '%{http_code}' "${base_url}${suffix}")"
  [[ "${status}" == 200 ]] && grep -q '<html' "${tmp}/wsdl.html" || { echo "WSDL_ROUTE_FAILED: ${suffix} HTTP ${status}" >&2; exit 21; }
  printf 'WSDL_ROUTE_PASS %s HTTP %s\n' "${suffix}" "${status}"
done
rollback_required=false
trap - EXIT TERM INT
rm -rf "${tmp}"
echo "STARTED: source_job=${AI_TEAM_OPERATION_ID:?} database=postgresql volumes_preserved=true"
