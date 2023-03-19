# OASIZ MQTT client

Yet another MQTT WebSocket client.

## develop

### process

#### Start dev environment

```sh
docker compose up
```

#### Install dependent package

```sh
docker compose exec app bash -c "cd frontend; npm i"
```

#### Start frontend dev server

```sh
docker compose exec app bash -c "cd frontend; npm run dev -- --host"
```

#### Reset EMQX data

```sh
docker volume rm oasiz-mqtt-client-tmp_emqx_data
```

### dev env info

#### MQTT user

| user    | password | permission         |
| ------- | -------- | ------------------ |
| subuser | password | subscribe only     |
| pubuser | password | publish/subscribe  |


#### EMQX dashboard admin user

| user  | password |
| ----- | -------- |
| admin | public   |


