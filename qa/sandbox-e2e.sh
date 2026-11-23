#!/usr/bin/env bash
set -euo pipefail
# This administrator-pinned runner never intercepts an API or starts a Next.js preview server.
[[ ${AI_TEAM_E2E_EXPECTED_HEAD:-} =~ ^[0-9a-f]{40,64}$ ]] || { echo 'E2E_EXPECTED_HEAD_INVALID'; exit 10; }
echo 'c2db6bbc22855f6e30b52c855a803bcd06195b7f1abb8f24461465bed09bcf8a  qa/source-fingerprint.py' | sha256sum -c - >/dev/null
echo '12ba36617e3fe4209e180e61c7b48b17e33e114db24b82abf2812a6f8e70733d  qa/sandbox-check.cjs' | sha256sum -c - >/dev/null
state="${AI_TEAM_SANDBOX_HOME:?}/dynamic-api"
run="${AI_TEAM_OPERATION_ID:?}"
[[ $run =~ ^[0-9a-f]{32}$ ]] || exit 11
output="$state/e2e-runs/$run"
mkdir -p "$output"
expected=$(python3 qa/source-fingerprint.py)
port=$(tr -cd '0-9' < "$state/http-port")
base="http://127.0.0.1:$port/dynamic-api"
curl --fail --silent --show-error "$base/_ai-team/source.json" -o "$output/deployed-source.json"
python3 - "$output/deployed-source.json" "$expected" <<'PY'
import json,sys
actual=json.load(open(sys.argv[1]));expected=json.loads(sys.argv[2])
if actual != expected: raise SystemExit('E2E_DEPLOYED_SOURCE_MISMATCH')
print('E2E_DEPLOYED_SOURCE_MATCH '+expected['buildHash'])
PY
mapfile -t apps < <(docker ps --filter label=com.docker.compose.project=dynamic-api-sandbox --filter label=com.docker.compose.service=dynamic-api-app --format '{{.ID}}')
(( ${#apps[@]} == 1 )) || { echo 'E2E_DEPLOYMENT_NOT_UNIQUE'; exit 12; }
image=$(docker inspect --format '{{.Image}}' "${apps[0]}")
# Keep the browser toolchain project-local; do not replace the system Node.
node_home="$state/e2e-tools/node-v22.20.0-linux-x64"
if [[ ! -x "$node_home/bin/node" ]]; then
  mkdir -p "$state/e2e-tools"
  download=$(mktemp -d)
  curl --fail --silent --show-error --location https://nodejs.org/dist/v22.20.0/SHASUMS256.txt -o "$download/SHASUMS256.txt"
  curl --fail --silent --show-error --location https://nodejs.org/dist/v22.20.0/node-v22.20.0-linux-x64.tar.xz -o "$download/node-v22.20.0-linux-x64.tar.xz"
  (cd "$download" && grep ' node-v22.20.0-linux-x64.tar.xz$' SHASUMS256.txt | sha256sum -c -)
  tar -xJf "$download/node-v22.20.0-linux-x64.tar.xz" -C "$state/e2e-tools"
  rm -rf -- "$download"
fi
export PATH="$node_home/bin:$PATH"
version=$(python3 -c 'import json;d=json.load(open("nextjs-dynamic-api-manager/package-lock.json"));print(d["packages"]["node_modules/@playwright/test"]["version"])')
tools="$state/e2e-tools/$version"
if [[ ! -f "$tools/node_modules/@playwright/test/package.json" ]]; then
  mkdir -p "$tools"
  npm install --prefix "$tools" --no-audit --no-fund --save-exact "@playwright/test@$version"
fi
export PLAYWRIGHT_BROWSERS_PATH="$state/e2e-tools/browsers"
node "$tools/node_modules/playwright/cli.js" install --with-deps --only-shell chromium > "$output/browser-install.log" 2>&1
export AI_TEAM_E2E_PLAYWRIGHT="$tools/node_modules/@playwright/test"
export AI_TEAM_E2E_OUTPUT="$output"
export AI_TEAM_E2E_BASE="$base" AI_TEAM_E2E_MODE=main
node qa/sandbox-check.cjs

# Exact 3/4/0 datasets use the deployed immutable image with a disposable PostgreSQL instance.
# The original application's database, networks, volumes and service registrations are never changed.
name="dynamic-api-e2e-${run:0:12}"
work="/home/aiteam-docker/.cache/$name"
install -d -m 755 -o aiteam-docker -g aiteam-docker "$work"
cleanup() {
  status=$?
  trap - EXIT
  if (( status != 0 )); then docker logs "$name-app" > "$output/fixture-app.log" 2>&1 || true; fi
  docker rm -f "$name-app" "$name-pg" >/dev/null 2>&1 || true
  docker network rm "$name" >/dev/null 2>&1 || true
  rm -rf -- "$work"
  exit "$status"
}
trap cleanup EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
python3 - "$work" "$name-pg" <<'PY'
from pathlib import Path
import os,secrets,sys
p=Path(sys.argv[1]);password=secrets.token_hex(24)
(p/'postgres.env').write_text('POSTGRES_USER=aiteam_e2e\nPOSTGRES_DB=aiteam_e2e\nPOSTGRES_PASSWORD='+password+'\n')
(p/'data-source.properties').write_text('\n'.join(['dynamic.primary=webservice','dynamic.entity-scan=com.dynamicapi','dynamic.is-encrypt=false',
'dynamic.data-source-map[webservice].name=webservice','dynamic.data-source-map[webservice].url=jdbc:postgresql://'+sys.argv[2]+':5432/aiteam_e2e',
'dynamic.data-source-map[webservice].username=aiteam_e2e','dynamic.data-source-map[webservice].pa55word='+password,
'dynamic.data-source-map[webservice].driverClassName=org.postgresql.Driver','app.database.dialect=org.hibernate.dialect.PostgreSQLDialect',
'app.database.flyway-locations=classpath:db.postgresql'])+'\n')
PY
chown aiteam-docker:aiteam-docker "$work/"*
chmod 600 "$work/"*
pg=$(docker ps --filter label=com.docker.compose.service=postgres --format '{{.ID}}' | head -1)
test -n "$pg"
pg_image=$(docker inspect --format '{{.Image}}' "$pg")
docker network create "$name" >/dev/null
docker run -d --name "$name-pg" --network "$name" --memory 256m --env-file "$work/postgres.env" "$pg_image" >/dev/null
ready=false
for _ in $(seq 1 60); do if docker exec "$name-pg" pg_isready -U aiteam_e2e -d aiteam_e2e >/dev/null 2>&1; then ready=true; break; fi; sleep 1; done
[[ $ready == true ]] || { echo 'E2E_FIXTURE_POSTGRES_NOT_READY'; exit 13; }
mapfile -t app_command < <(docker inspect --format '{{json .Config.Cmd}}' "${apps[0]}" | python3 -c 'import json,sys;print("\n".join(x for x in json.load(sys.stdin) or [] if not x.startswith(("--dynamic.data-source-map","--dynamic.primary","--app.database.","--spring.datasource","--spring.flyway"))))')
docker run -d --name "$name-app" --network "$name" --memory 768m -e JAVA_TOOL_OPTIONS=-Xmx512m \
  -p 127.0.0.1::8080 --tmpfs /data:rw,mode=1777 \
  -v "$work/data-source.properties:/app/exploded/BOOT-INF/classes/data-source.properties:ro" "$image" "${app_command[@]}" > /dev/null
fixture_port=$(docker inspect --format '{{(index (index .NetworkSettings.Ports "8080/tcp") 0).HostPort}}' "$name-app")
fixture="http://127.0.0.1:$fixture_port/dynamic-api"
ready=false
for _ in $(seq 1 120); do if curl --fail --silent "$fixture/api/getControllers" > "$output/fixture-ready.json"; then ready=true; break; fi; sleep 1; done
[[ $ready == true ]] || { echo 'E2E_FIXTURE_APP_NOT_READY'; exit 14; }
curl --fail --silent "$fixture/_ai-team/source.json" -o "$output/fixture-source.json"
cmp "$output/deployed-source.json" "$output/fixture-source.json"
docker exec -i "$name-pg" psql -U aiteam_e2e -d aiteam_e2e -v ON_ERROR_STOP=1 > "$output/fixture-seed.log" <<'SQL'
INSERT INTO jar_file(id,name,status) VALUES ('qa-jar','qa-fixture.jar','A');
INSERT INTO endpoint(id,publish_uri,bean_name,jar_file_id,class_path,is_active,ignore_cdata)
SELECT 'qa-ep-id-'||n,'qa-ep-'||n,'qaBean'||n,'qa-jar','qa.fixture.Endpoint'||n,false,false FROM generate_series(1,3) n;
INSERT INTO controller(id,publish_uri,jar_file_id,class_path,is_active)
SELECT 'qa-rf-id-'||n,'qa-rf-'||n,'qa-jar','qa.fixture.Controller'||n,false FROM generate_series(1,4) n;
SQL
export AI_TEAM_E2E_BASE="$fixture" AI_TEAM_E2E_MODE=fixtures
node qa/sandbox-check.cjs
docker exec "$name-pg" psql -U aiteam_e2e -d aiteam_e2e -v ON_ERROR_STOP=1 -c 'DELETE FROM controller' > "$output/fixture-zero.log"
export AI_TEAM_E2E_MODE=zero
node qa/sandbox-check.cjs
count=$(python3 - "$output" <<'PY'
import json,sys
from pathlib import Path
p=Path(sys.argv[1]);print(sum(json.load(open(p/(name+'.json')))['passed'] for name in ['main','fixtures','zero']))
PY
)
echo "E2E_ARTIFACTS $output"
echo "AI_TEAM_SANDBOX_E2E_PASS $AI_TEAM_E2E_EXPECTED_HEAD $count"
