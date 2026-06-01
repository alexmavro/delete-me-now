/**
 * Shared helpers for the registry adapters. One slugify, one place.
 */

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Excel-saved CSVs (the natural curator workflow for these hand-lists)
// ship with a leading UTF-8 BOM (﻿). Without stripping, the first
// header column becomes `﻿name` instead of `name`, every row's
// name lookup returns undefined, and the import silently drops the
// entire file with a "skipped 600 no-name" log nobody reads. Strip
// once at file ingest; every adapter routes through this.
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export interface ExternalBroker {
  id: string;
  name: string;
  slug: string;
  url?: string;
  email?: string;
  postalAddress?: string;
  source: 'ca-broker-registry' | 'vt-broker-registry' | 'eu-brokers' | 'prc-brokers';
  headquarterCountry: string;
  externalId?: string;
}
