# Build Artifacts

This folder stores generated deployment packages for the Orphanage Management System.

## Generated Package Rules

- Includes the PHP application and Node backend source.
- Excludes `node_backend/node_modules` so dependencies can be installed fresh with `npm install`.
- Excludes `node_backend/.env` so local secrets are not bundled.
- Excludes the `artifacts/` folder itself to avoid recursive packaging.

## Rebuild Command

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate-artifact.ps1
```
