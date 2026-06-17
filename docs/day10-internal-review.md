# Day 10 Internal Review

## Scope Rule

Day 10 is stabilization only. No new product stories are pulled in. Priority order:

1. Bugs from Day 9 internal testing.
2. Carry-over stories already started in Sprint 1 or Sprint 2.
3. UI polish needed for the Sprint 2 demo.

## Bugs And Carry-Over Closed

- Print view was too spread out and produced too many pages. The print CSS now uses compact A4-specific rules, hides navigation/header/buttons, uses fixed-width 8-column order table, and keeps signature/customer blocks tighter for the browser print dialog.
- Resubmit flow was corrected before Day 10 review: `Rejected` quotes are read-only archive records; only `AskedForEdit` quotes can be revised and resubmitted.
- Notification integration from Day 9 has API and service tests, plus frontend 30-second polling for Sprint 2.

## Backend Flow Checked

The core approval flow is covered by `backend/tests/full-approval-flow.integration.test.js`:

1. Sales-submitted quote starts in `Pending`.
2. HOD approval moves it to `Processing`.
3. SC Head approval moves it to `PendingApproval`.
4. GM final approval moves it to `Approved`.
5. Order conversion creates `ORD-<quoteNumber>`.
6. Notification records are triggered for each status change.

The rejected path is also checked:

1. GM hard reject moves a `PendingApproval` quote to `Rejected`.
2. Quote number, items, and history remain available.
3. No Order is created.

## Demo Script

### Full Approval Flow

1. Login as Sales/SC.
2. Create quote with required client details and SKU row.
3. Submit quote to HOD.
4. Switch/login as HOD and approve.
5. Switch/login as SC Head and approve.
6. Switch/login as GM and final approve.
7. Verify quote is `Approved`.
8. Verify order preview/print form is available from the approved quote.

### Rejected Flow

1. Login/switch as GM.
2. Open a quote in `PendingApproval`.
3. Hard reject with mandatory reason.
4. Verify quote remains in the list/archive with status `Rejected`.
5. Verify quote details/history still show the rejection reason.

## Sprint 3 Planning Gate

Sprint 3 must not be planned until all gates are confirmed:

| Gate | Status | Notes |
| --- | --- | --- |
| Pricing formula confirmed with Excel example | Partial | Day 9 Excel example exists, but business confirmation/sign-off is still needed. |
| GM signed off Roles & Permissions | Blocked | Draft roles table exists; formal GM sign-off not recorded yet. |
| Asked-for-edit lifecycle defined | Done | Current rule: direct edit existing `AskedForEdit` quote, resubmit starts from HOD. |
| Multi-SKU decision available | Partial | Multi-SKU data contract exists, but final business decision/pricing impact needs confirmation. |

Because not all gates are done, Sprint 3 should not be planned yet. Candidate Sprint 3 scope remains: real Pricing Engine, Client Details tab hardening, multi-SKU model finalization, and email notifications.
