# Exercise dataset runbook

The exercise catalog is seeded from a pinned snapshot of
[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset).

## Why this is kept out of the repo

The full dataset is ~128 MB and includes 1,324 GIFs and thumbnail images. The
repo only stores the download/seed scripts and the migration that holds the
metadata schema. Media is mounted into the `assets` container at deploy time and
is **never** committed.

## Pinned snapshot

| Field | Value |
|---|---|
| Repository | `hasaneyldrm/exercises-dataset` |
| Commit | `7455efae41b330c265e7cd4b78dfa848e7ce5ebd` |
| SHA256 tarball | `2e674501f44506d4488c3cd41db903322938fb9f758182e759d558c4048f5d0c` |
| Rows | 1,324 |

## Local development

```bash
# Download the dataset into assets/exercises/
./scripts/download-exercises.sh

# The expected layout after extraction is:
#   assets/exercises/data/exercises.json
#   assets/exercises/images/*.jpg
#   assets/exercises/videos/*.gif
```

The downloaded tarball is cached in `.cache/exercises-dataset/` so re-runs are
fast and idempotent. Both `.cache/` and `assets/exercises/` are gitignored.

## Mirroring on nodo-a

For production and to avoid repeated GitHub downloads, mirror the tarball once
on the host and expose it via `MIRROR_URL`.

### Upload the tarball once

From the local dev machine (after running `download-exercises.sh` once):

```bash
scp .cache/exercises-dataset/exercises-7455efae41b330c265e7cd4b78dfa848e7ce5ebd.tar.gz \
  root@nodo-a:/data/devaai/gymapp/mirror/
```

Or download it directly on nodo-a:

```bash
mkdir -p /data/devaai/gymapp/mirror
curl -fsSL -o /data/devaai/gymapp/mirror/exercises-7455efae41b330c265e7cd4b78dfa848e7ce5ebd.tar.gz \
  https://github.com/hasaneyldrm/exercises-dataset/archive/7455efae41b330c265e7cd4b78dfa848e7ce5ebd.tar.gz
sha256sum /data/devaai/gymapp/mirror/exercises-7455efae41b330c265e7cd4b78dfa848e7ce5ebd.tar.gz
# expect: 2e674501f44506d4488c3cd41db903322938fb9f758182e759d558c4048f5d0c
```

### Serve the mirror

Make the tarball available over HTTPS/HTTP from nodo-a, for example with an nginx
location or an existing internal file server. Set `MIRROR_URL` to that URL
before running the download script:

```bash
export MIRROR_URL="https://mirror.nodo-a.example/exercises-7455efae41b330c265e7cd4b78dfa848e7ce5ebd.tar.gz"
./scripts/download-exercises.sh /data/devaai/gymapp/app/assets/exercises
```

## Seeding the database

After the dataset is extracted to `assets/exercises/`:

```bash
DATABASE_URL="postgres://user:pass@host:5432/gymapp" pnpm db:migrate
DATABASE_URL="postgres://user:pass@host:5432/gymapp" pnpm db:seed
```

The seed is idempotent: running it twice will leave the row count unchanged
because inserts are batched with `ON CONFLICT DO NOTHING` on `external_id`.

## Asset URL layout

The `assets` service bind-mounts `./assets/exercises` at
`/usr/share/nginx/html/exercises` and serves it under `/`. A GIF for exercise
`0001` is therefore available at:

```
https://assets.gymapp.elautomata.com/exercises/videos/0001-2gPfomN.gif
```

Media paths stored in the database are relative (`videos/0001-2gPfomN.gif`); the
API resolves them against `ASSETS_URL` when serving catalog responses.

## License and attribution

The dataset metadata and scripts are MIT-licensed. Images and GIFs are ©
[Gym visual](https://gymvisual.com/) and are used with the attribution included
in the `attribution` field. The catalog UI displays this attribution on every
detail page. Commercial use requires a separate license from Gym visual.
