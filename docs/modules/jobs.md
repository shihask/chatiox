# Background Jobs (reserved concept)

## Status

Not implemented. No code, no queue, no worker exists yet. This document exists so future Marketing/Automation work starts from the right shape instead of discovering the need for one under load.

## Why this exists

Sending 10,000+ WhatsApp messages, 50,000+ SMS, or 100,000+ emails synchronously inside a single HTTP request is not viable — Edge Functions have execution time limits, and a failure partway through a large send should not require restarting the whole batch.

## Model

```
Campaign / Broadcast
  -> Queue     (durable list of individual send jobs, one per recipient)
  -> Worker    (pulls jobs, calls the channel provider, records delivery status)
  -> Provider  (IChannelProvider.send(), see supabase/functions/api/channels/)
```

A "job" is one recipient + one message. The queue absorbs bursts and retries; the worker is the only thing that ever calls `getProvider(channelType).send(...)` for a bulk send (Contacts' own transactional-style actions, if any, still call the provider directly — jobs are specifically for bulk/campaign sends).

## Candidates for the queue implementation (not decided, not built)

- A Postgres-backed queue table (`campaign_delivery_jobs`) polled by a scheduled Edge Function — simplest to operate on Supabase, no new infrastructure.
- A managed queue (e.g. a hosted Redis/Upstash) if throughput requirements outgrow polling.

Whichever is chosen, the Worker's only dependency is `IChannelProvider` — it never imports a concrete provider (`WhatsAppProvider`, etc.) directly, matching the "providers are plugins" rule everywhere else in this codebase.

## Serves

Primarily Marketing (`campaigns`, `broadcast`) but also anything else that ever needs bulk fan-out (e.g. a future Automation step that messages many contacts at once) — this is why the doc lives flat at `docs/modules/jobs.md` rather than nested under one domain.
