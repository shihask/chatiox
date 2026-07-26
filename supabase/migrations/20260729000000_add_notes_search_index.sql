-- Supports the workspace-wide Notes list's search box (matches contacts' precedent of trigram
-- indexes for ILIKE '%term%' search -- see docs/architecture.md's search section).
create index idx_notes_body_trgm on public.notes using gin (body gin_trgm_ops);
