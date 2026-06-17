# Day 10 API Support Notes

## Approval APIs

### Update Quote Status

`PATCH /api/quotes/:id/status`

Authenticated roles:

- `HOD` can approve/send back/reject `Pending`.
- `SC_HEAD` can approve/send back/reject `Processing`.
- `GM` can final approve/send back/hard reject `PendingApproval`.

Request:

```json
{
  "action": "approve",
  "note": "Approved."
}
```

Notes:

- `send_back` and `reject` require `note`.
- GM final approve returns `data.quote` and `data.order`.
- Non-GM approvals return `data` as a quote DTO.
- GM hard reject never deletes quote data.

## Notification API

### List Notifications

`GET /api/notifications`

Requires `Authorization: Bearer mock-token-<user-id>`.

Response:

```json
{
  "status": "OK",
  "message": "Notifications fetched successfully",
  "data": [
    {
      "id": "notification-1",
      "quoteNumber": "#12345",
      "message": "Quote #12345 was approved by HOD",
      "targetRoles": ["SC_HEAD"],
      "isRead": false
    }
  ]
}
```

Sprint 2 uses in-app polling every 30 seconds. Email is out of scope.

## Order Print Preview

`GET /api/orders/form/:quoteId`

Returns order/print preview data for the quote. If an Order already exists, it is used. Otherwise, the service builds a preview from the quote snapshot.
