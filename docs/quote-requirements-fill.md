# Quote Workflow Requirements Fill

## Section 5. Roles & Permissions

| Role | Create | Edit | Approve | View |
| --- | --- | --- | --- | --- |
| Sales | Yes | Own draft / asked-for-edit quotes | No | All quotes |
| HOD | No | No | Pending quotes only | All quotes |
| SC Head | No | No | Processing quotes only | All quotes |
| GM | No | No | PendingApproval quotes only | All quotes |
| Planning | No | No | No | Approved quotes and order preview |

## Section 6. Functional Requirements

| ID | Priority | Acceptance Criteria |
| --- | --- | --- |
| FR-01 | P0 | User can log in with a valid role account and land on the protected workspace. Invalid credentials show an error without exposing internal details. |
| FR-02 | P0 | Sales can create a quote with mandatory client details and at least one SKU row. Quote is saved as Draft or submitted to Pending HOD. |
| FR-03 | P0 | New Quote parameters load from the shared `/quote-parameters/options` source and render the 8 configured dropdowns. |
| FR-04 | P0 | Client Details tab shows editable fields for company name, company address, contact person, phone number, email, billing address, and delivery address. Blank required fields are highlighted in red. |
| FR-05 | P1 | Quote supports multiple item rows in the data contract. Each row stores box style, type, dimension, flute type, board quality, colors, joints, MOQ, quantity, and unit price. |
| FR-06 | P0 | Sales can reopen and edit the same quote when status is Draft or AskedForEdit without creating a duplicate record. |
| FR-07 | P0 | HOD can approve a quote in Pending status. The system moves it to Processing and logs actor, action, note, and timestamp. |
| FR-08 | P0 | HOD can send a quote back from Pending to AskedForEdit. A reason is required and is visible in the history log. |
| FR-09 | P0 | SC Head can approve a quote in Processing status. The system moves it to PendingApproval and logs the transition. |
| FR-10 | P0 | SC Head can send a quote back from Processing to AskedForEdit with a mandatory reason. |
| FR-11 | P0 | GM can approve a quote in PendingApproval status. The system moves it to Approved and shows it in the order-conversion queue. |
| FR-12 | P1 | Quote detail screen shows client snapshot, SKU table, workflow stepper, approval panel, and approval history for the active actor. |
| FR-13 | P1 | Order Form preview renders the AMB Packaging header, mock quote total label, and 8-column details table with 3 walkthrough rows when no live order rows exist. |
| FR-14 | P2 | Dashboard and quote list show queue counts by role using the current quote status values without requiring page refresh after navigation. |
| FR-15 | P2 | Seed data creates a consistent demo dataset across Sales, HOD, SC Head, and GM states so walkthroughs can be repeated reliably. |
| FR-16 | P1 | Approval status changes create in-app Notification records only. Sprint 2 uses frontend polling every 30 seconds; email notifications are explicitly out of scope. |

## Section 8. Pricing Questions

## Day 9 Pricing Model Notes

The Day 9 worked example is stored at `docs/pricing-day9-worked-example.xls`. Paper prices by GSM should be stored in MongoDB collection `paper_prices`, keyed by GSM, flute/layer combination, supplier, currency, and effective date. The default RSC blank area formula is `blank length = 2*(L+W)+glue flap`, `blank width = W+H`, and `blank area sqm = length*width/1,000,000`, with default 5% waste unless workshop data overrides it. Printing cost is `(setup charge + color count * variable color rate * quantity) / quantity`. Default margin is 25%, so selling price is `factory cost / (1 - margin)`.

## Day 10 Stabilization Notes

Day 10 is a no-new-story stabilization day. Full notes are in `docs/day10-internal-review.md` and API support notes are in `docs/day10-api-support-notes.md`. Core backend flow AP-01 -> AP-02 -> AP-03 is covered by `backend/tests/full-approval-flow.integration.test.js`, including final Order creation and GM hard reject persistence. Sprint 3 planning is blocked until formal confirmation is available for pricing formula sign-off, GM Roles & Permissions sign-off, asked-for-edit lifecycle, and Multi-SKU business decision.

## Asked For Edit Business Rule

HOD, SC Head, and GM can all trigger "Asked for edit" by sending a quote back from their active approval queue. Sales then directly edits the existing quote record when its status is `AskedForEdit`; the current implementation does not create a new quote version. Sales can save revisions while keeping the quote in `AskedForEdit`, then resubmit to `Pending` when ready. Rejected quotes are final/read-only in the archive and are not eligible for resubmit; if the commercial deal restarts, Sales should create a new quote. If PM later confirms that a new version is required, the old version should be retained as an immutable quote revision linked to the new active revision, including full client snapshot, SKU rows, totals, and approval history. After Sales finishes editing under the current rule, the quote is resubmitted to `Pending`, so the approval flow restarts from HOD and proceeds again through SC Head and GM.

Implementation impact: the existing code supports direct edit and resubmit of the same quote from `AskedForEdit` to `Pending`. Building true versioning would require a quote revision model or embedded revisions array, API changes for version lookup/comparison, and UI changes to show previous versions. PM confirmation is required before implementing that versioning behavior.

### Base Price

1. Is base price defined per SKU, per board combination, or per finished carton?
2. Does each box style/type pair have its own base rate, or do we start from one base and apply multipliers?
3. Should unit price be stored as a snapshot at submission time or recalculated on every edit/view?
4. Do print treatments such as varnish, lamination, or special finishing need separate price components?

### MOQ

1. Is MOQ only a selectable commercial tier, or can Sales enter an exact customer quantity outside the tier list?
2. When MOQ and quantity differ, which value drives approval and which value drives pricing?
3. Should quantity automatically default from MOQ, or remain manually editable after the default is applied?
4. For multi-SKU quotes, does each SKU keep its own MOQ/quantity independently?

### Tax / Currency

1. Is the working currency always SGD, or should the quote support future currencies?
2. Is tax always GST at a fixed rate, or should rate and applicability be configurable by customer or market?
3. Should displayed totals round per line item, per SKU subtotal, or only at grand total level?
4. Do we need to store currency code and tax rate snapshot on the quote for audit consistency?

## NFR-03 to NFR-06

| ID | Topic | Requirement |
| --- | --- | --- |
| NFR-03 | Security | Status transitions must enforce role-based rules on the backend. Unsupported role/status/action combinations return `403` and are logged with actor context where available. |
| NFR-04 | Performance | Quote list and quote detail API responses should complete within 2 seconds for demo-scale datasets (up to 500 quotes) under normal internal network conditions. |
| NFR-05 | Data Retention | Quotes, client snapshots, and approval history must be retained for at least 24 months unless a later compliance rule overrides it. Seed data may be purged and recreated freely in non-production environments. |
| NFR-06 | Availability | The internal quote workflow should target 99.5% monthly availability during business hours, excluding planned maintenance windows announced in advance. |
