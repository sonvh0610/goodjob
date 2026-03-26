# Events and Worker Contracts

## Channel Naming
- `goodjob.feed`
- `goodjob.notifications.user.<userId>`
- `goodjob.media.jobs`

## Event Envelope
- `eventId`: unique id
- `eventType`: domain event name
- `occurredAt`: ISO timestamp
- `actorId`: user who triggered the event
- `payload`: event-specific fields

## Worker Lifecycle
1. Job accepted and validated.
2. Media probe and duration check.
3. Processing/transcoding.
4. Store output URL and update DB status.
5. Publish completion event.
