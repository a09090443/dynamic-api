#!/usr/bin/env bash
set -euo pipefail

state_dir="${AI_TEAM_SANDBOX_HOME:?}/dynamic-api"
deployment_file="${state_dir}/restful-deployment.json"
credential_file="${state_dir}/postgres.env"
test -s "${deployment_file}"
test -s "${credential_file}"
set -a
# shellcheck disable=SC1090
source "${credential_file}"
set +a
port="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["port"])' "${deployment_file}")"

mapfile -t containers < <(docker ps --filter 'label=com.docker.compose.project=dynamic-api-sandbox' --filter 'label=com.docker.compose.service=dynamic-api-app' --format '{{.ID}}')
(( ${#containers[@]} == 1 )) || { echo "HEALTH_CONTAINER_NOT_UNIQUE: ${#containers[@]}" >&2; exit 10; }
container_id="${containers[0]}"
health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "${container_id}")"
[[ "${health}" == healthy || "${health}" == none ]] || { echo "HEALTH_CONTAINER_UNHEALTHY: ${health}" >&2; exit 11; }

mapfile -t postgres_containers < <(docker ps --filter 'label=com.docker.compose.project=ai-team-bestpartner' --filter 'label=com.docker.compose.service=postgres' --format '{{.ID}}')
(( ${#postgres_containers[@]} == 1 )) || { echo "HEALTH_POSTGRES_CONTAINER_NOT_UNIQUE: ${#postgres_containers[@]}" >&2; exit 17; }
postgres_id="${postgres_containers[0]}"
postgres_health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "${postgres_id}")"
[[ "${postgres_health}" == healthy ]] || { echo "HEALTH_POSTGRES_UNHEALTHY: ${postgres_health}" >&2; exit 18; }
postgres_image="$(docker inspect --format '{{.Config.Image}}' "${postgres_id}")"
postgres_version="$(printf '%s\n' "${POSTGRES_PASSWORD}" | docker exec -i "${postgres_id}" sh -c 'IFS= read -r PGPASSWORD; export PGPASSWORD; psql -h 127.0.0.1 -U dynamic_api -d dynamic_api -Atq -c "SHOW server_version_num"')"
(( postgres_version >= 140000 )) || { echo "HEALTH_POSTGRES_VERSION_TOO_OLD: ${postgres_version}" >&2; exit 19; }

database_state="$(printf '%s\n' "${POSTGRES_PASSWORD}" | docker exec -i "${postgres_id}" sh -c 'IFS= read -r PGPASSWORD; export PGPASSWORD; psql -h 127.0.0.1 -U dynamic_api -d dynamic_api -Atq -c "SELECT (SELECT count(*) FROM flyway_schema_history WHERE success), (SELECT count(*) FROM information_schema.tables WHERE table_schema='\''public'\'' AND table_name IN ('\''controller'\'','\''jar_file'\'','\''mock_response'\'','\''endpoint'\'')), (SELECT count(*) FROM controller WHERE publish_uri IN ('\''company'\'','\''example'\'','\''inventory'\'','\''b2c'\'') AND is_active), (SELECT count(*) FROM mock_response WHERE publish_uri='\''company'\'' AND method='\''getResponseData'\'' AND service_type='\''RESTFUL'\'' AND is_active)"')"
[[ "${database_state}" == "1|4|4|1" ]] || { echo "HEALTH_POSTGRES_DATA_MISMATCH: ${database_state}" >&2; exit 20; }
docker volume inspect dynamic-api-sandbox-postgres-data >/dev/null || { echo "HEALTH_ABANDONED_POSTGRES_VOLUME_MISSING" >&2; exit 23; }

mapfile -t expected_sqlite_volumes < <(python3 -c 'import json,sys; print("\n".join(json.load(open(sys.argv[1])).get("sqliteVolumes",[])))' "${deployment_file}")
(( ${#expected_sqlite_volumes[@]} >= 1 )) || { echo "HEALTH_SQLITE_VOLUME_RECORD_MISSING" >&2; exit 21; }
for volume in "${expected_sqlite_volumes[@]}"; do
  docker volume inspect "${volume}" >/dev/null || { echo "HEALTH_SQLITE_VOLUME_MISSING: ${volume}" >&2; exit 22; }
done

base="http://127.0.0.1:${port}/dynamic-api"
tmp="$(mktemp -d)"; trap 'rm -rf "${tmp}"' EXIT
api() {
  local label="$1" out="$2" status
  shift 2
  status="$(curl --silent --show-error --output "${out}" --write-out '%{http_code}' "$@")"
  [[ "${status}" == 200 ]] || { echo "${label}_HTTP_ERROR: ${status} body=$(<"${out}")" >&2; exit 12; }
  python3 - "${out}" "${label}" <<'PY'
import json,sys
d=json.load(open(sys.argv[1],encoding="utf-8"))
if d.get("code")!=200: raise SystemExit(f"{sys.argv[2]}_API_ERROR: code={d.get('code')} message={d.get('message')}")
PY
}

homepage="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "${base}/")"
[[ "${homepage}" =~ ^2[0-9][0-9]$ ]] || { echo "HOMEPAGE_HTTP_ERROR: ${homepage}" >&2; exit 13; }
api controllers "${tmp}/controllers.json" "${base}/api/getControllers"
python3 - "${tmp}/controllers.json" "${deployment_file}" <<'PY'
import json,sys
rows=json.load(open(sys.argv[1],encoding="utf-8")).get("data") or []
saved=json.load(open(sys.argv[2],encoding="utf-8"))["controllers"]
for uri,state in saved.items():
 xs=[x for x in rows if x.get("publishUri")==uri]
 if len(xs)!=1 or xs[0].get("id")!=state["serviceId"] or xs[0].get("jarFileId")!=state["jarFileId"] or xs[0].get("classPath")!=state["classPath"] or xs[0].get("isActive") is not True:
  raise SystemExit(f"controller mismatch: {uri} {xs}")
PY
route() {
  local label="$1" expected="$2"; shift 2
  local out="${tmp}/${label}.out" status
  status="$(curl --silent --show-error --output "${out}" --write-out '%{http_code}' "$@")"
  if [[ ! "${status}" =~ ^2[0-9][0-9]$ ]] && ! grep -Fq 'MOCK_RESPONSE_NOT_FOUND' "${out}"; then
    failures+=("${label}_route_status=${status}")
  fi
  printf -v "${expected}" '%s' "${status}"
  printf '%s_body=%q\n' "${label}" "$(tr '\r\n' '  ' < "${out}" | head -c 300)"
}

failures=()
company_condition='{"name":"Acme","address":"Taipei","phone":"0200000000","email":"a@acme.test","website":"https://acme.test","description":"sandbox"}'
company_response='{"name":"Acme","address":"Taipei","phone":"0200000000","email":"a@acme.test","website":"https://acme.test","description":"sandbox"}'
api company_mocks "${tmp}/company-mocks.json" --request POST --header 'Content-Type: application/json' --data '{"publishUri":"company","serviceType":"RESTFUL"}' "${base}/common/getResponseList"
if ! python3 - "${tmp}/company-mocks.json" "${tmp}/company-condition.json" "${company_condition}" "${company_response}" <<'PY'
import json,sys
rows=json.load(open(sys.argv[1],encoding="utf-8")).get("data") or []
xs=[x for x in rows if x.get("method")=="getResponseData"]
if len(xs)!=1 or xs[0].get("condition")!=sys.argv[3] or xs[0].get("responseContent")!=sys.argv[4] or xs[0].get("isActive") is not True:
    raise SystemExit(f"COMPANY_MOCK_STATE_MISMATCH: {xs}")
json.loads(sys.argv[3])
open(sys.argv[2],"w",encoding="utf-8").write(sys.argv[3])
PY
then
  failures+=("company_mock=invalid")
  printf '%s' "${company_condition}" > "${tmp}/company-condition.json"
fi
route company company_status --request POST --header 'Content-Type: application/json' --data-binary "@${tmp}/company-condition.json" "${base}/company/data"
route example example_status "${base}/example/response"
route inventory inventory_status "${base}/inventory/items/__service_check_missing__"
route b2c b2c_status --request POST "${base}/b2c/mtk/SmSend?username=service-check&password=service-check&dstaddr=0900000000"

openapi_status="$(curl --silent --show-error --output "${tmp}/openapi.json" --write-out '%{http_code}' "${base}/api/getOpenApi")"
if [[ "${openapi_status}" == 200 ]]; then
  if ! python3 - "${tmp}/openapi.json" <<'PY'
import json,sys
paths=(json.load(open(sys.argv[1],encoding="utf-8")).get("paths") or {}).keys()
missing=[prefix for prefix in ("/company","/example","/inventory","/b2c") if not any(path==prefix or path.startswith(prefix+"/") for path in paths)]
if missing: raise SystemExit(f"OPENAPI_PATHS_MISSING: {missing}; paths={sorted(paths)}")
PY
  then
    failures+=("openapi_paths=missing")
  fi
else
  failures+=("openapi_status=${openapi_status}")
fi

if (( ${#failures[@]} > 0 )); then
  echo "HEALTH_FAILURES: ${failures[*]} company_route=${company_status} example_route=${example_status} inventory_route=${inventory_status} b2c_route=${b2c_status} openapi=${openapi_status}" >&2
  exit 16
fi

echo "HEALTHY: project=dynamic-api-sandbox port=${port} homepage=${homepage} container_health=${health} database=postgresql postgres_health=${postgres_health} postgres_image=${postgres_image} postgres_version_num=${postgres_version} flyway_migrations=1 schema_tables=4 controllers_in_postgres=4 company_mock_in_postgres=1 sqlite_volumes_preserved=${#expected_sqlite_volumes[@]} abandoned_postgres_volume_preserved=true controllers=company,example,inventory,b2c active=true unique=true openapi=${openapi_status} company_route=${company_status} example_route=${example_status} inventory_route=${inventory_status} b2c_route=${b2c_status}"

for suffix in /wsdl /wsdl/; do
  code="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "${base}${suffix}")"
  [[ "${code}" == 200 ]] || { echo "WSDL_ROUTE_FAILED: ${suffix} HTTP ${code}" >&2; exit 21; }
  printf 'WSDL_ROUTE_PASS %s HTTP %s\n' "${suffix}" "${code}"
done
