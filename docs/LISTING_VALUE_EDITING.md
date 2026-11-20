# Editing an optional declared value

The local listing editor supports draft and unpublished listings. Choose **Remove
declared value** and then **Save listing changes** to delete a stored value. The
amount field is disabled while removal is selected. Unchecking removal restores
the amount you were editing; cancelling or locking the vault discards the unsaved
removal. An empty amount alone never removes a stored value. An amount of `0`
remains a declared value, with its exact currency.

Saving changes only the local listing. For a listing published before, removal
creates an owner-only history snapshot marked as a material `value` change. Older
snapshots and signed files retain their original values. Republishing a wanted
or giveaway listing produces a new signed projection without the removed value.
Sale listings still require a declared value before publication; supply one before
republishing. An active inventory hold must be released or expire before editing.

## Alpha command contract

The existing `bazaar.listing.edit` command accepts an additive `removeValue`
boolean alongside its existing flat editable fields and `expectedRevision`:

- Omitted `value`, including a programmatic `undefined`, preserves the existing
  value. Omitted or false `removeValue` does not request removal.
- `removeValue: true` removes the optional value. It is not stored as listing data.
- A replacement `value` and `removeValue: true` together are rejected as
  `VALIDATION_FAILED`; the caller must choose one operation.
- A replacement amount remains a decimal minor-unit string. No conversion through
  a JavaScript number occurs, and zero is not treated as absence.

Ownership, optimistic revision checks, publication-state restrictions and active
inventory holds apply to removal exactly as to other local edits. Removal cannot
edit a published listing or bypass publication validation. The listing update,
required history snapshot and events commit together; failure preserves the
previous listing. Public signed schemas and backup record formats are unchanged.

This alpha command is not the broader proposed patch API or published-edit and
buyer-reconfirmation workflow in the canonical listing-editing specification.
