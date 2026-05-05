# Health Circle Scripts

This directory contains utility scripts for database maintenance, data importing, and verification.

## Available Scripts

### 1. Dictionary Seeding

Seeds the `dict_user_activity_types` table with mandatory action codes.

```bash
npm run seed:dictionaries
```

### 2. GeoJSON Import (`import-geojson.ts`)

Imports administrative boundaries (Hromadas) from a GeoJSON file into the `hdx_hromadas` table.

- **Source**: `apps/core-api/assets/ukr_admin3.geojson`
- **Table**: `hdx_hromadas`
- **Requirements**: PostGIS extension must be enabled.

```bash
npx ts-node -r tsconfig-paths/register src/scripts/import-geojson.ts
```

### 3. Alerts Regions Seeding (`seed-alerts.ts`)

Seeds the `alerts_regions` table from a CSV file.

- **Source**: `apps/core-api/assets/alerts_regions.csv`
- **Table**: `alerts_regions`

```bash
npx ts-node -r tsconfig-paths/register src/scripts/seed-alerts.ts
```

### 4. Hromada Verification (`verify-hromadas-by-raion.ts`)

A utility script to verify the consistency of hromada data.

```bash
npx ts-node -r tsconfig-paths/register src/scripts/verify-hromadas-by-raion.ts
```

## Data Assets

- `assets/ukr_admin3.geojson`: Source for HDX Hromadas spatial data.
- `assets/alerts_regions.csv`: Baseline list of regions for the alerts system.
- `assets/alerts_regions_mapping.csv`: Mapping between Alerts.in.ua region UIDs and HDX P-codes.

## How to Re-run Mapping

If you need to update the `hdx_pcode` mapping for alerts regions:

1. Ensure `hdx_hromadas` table is populated using `import-geojson.ts`.
2. The mapping is now also automated via migrations using `assets/alerts_regions_mapping.csv`.
3. For manual updates, use the `seed-alerts.ts` script logic or the corresponding migration.
