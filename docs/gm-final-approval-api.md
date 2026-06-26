# GM Final Approval API

## Endpoint

`PATCH /api/quotes/:id/status`

Requires `Authorization: Bearer mock-token-<gm-user-id>` and authenticated role `GM`.

## Final Approve

Request:

```json
{
  "action": "approve",
  "note": "Approved for order conversion."
}
```

Success response:

```json
{
  "status": "OK",
  "message": "Quote approved and order conversion created successfully",
  "data": {
    "quote": {
      "id": "507f1f77bcf86cd799439011",
      "quoteNumber": "#12996",
      "status": "Approved"
    },
    "order": {
      "id": "507f191e810c19729de860ff",
      "orderNumber": "ORD-12996",
      "orderId": "ORD-12996",
      "quoteId": "507f1f77bcf86cd799439011",
      "status": "Draft"
    }
  }
}
```

The quote status update and Order creation run inside one database transaction. If Order creation fails, the transaction fails and the quote approval is not committed.

## Hard Reject

Request:

```json
{
  "action": "reject",
  "note": "Margin is below approval threshold."
}
```

Success response:

```json
{
  "status": "OK",
  "message": "Quote status updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "quoteNumber": "#12996",
    "status": "Rejected"
  }
}
```

Hard Reject never deletes quote data. The quote remains in the archive with approval history and the mandatory rejection reason.
