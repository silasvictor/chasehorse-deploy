# Backup & Recovery

## Database
- PostgreSQL: use `pg_dump` for logical backups; store encrypted off-site.
- Local JSON fallback (`storage/data.json`): copy file regularly; not production-grade.
- Restore: `pg_restore` / replace `storage/data.json` then restart.

## Document Storage
- Local: back up `storage/uploads` directory.
- S3: enable versioning and lifecycle policies.

## Verification
- Backups are NOT currently automated or verified in this repository.
- Operators must configure scheduled backups and test restores before production.