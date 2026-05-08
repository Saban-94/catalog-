# Security Specification for ח.סבן AI Catalog

## 1. Data Invariants
- Products can only be created or modified by Admins.
- Users can read all products if they are signed in (Internal app).
- AI Logs are write-only for users (they can create them after a query).
- Admins can read all logs.
- Timestamps must be server-generated.
- Stock updates must be valid numbers.

## 2. The "Dirty Dozen" Payloads (Exploits)
1. **Identity Spoofing**: Attempt to create a log with someone else's `userId`.
2. **Price Manipulation**: Authenticated user trying to update a product price.
3. **Ghost Field**: Adding `isVerified: true` to a user-generated log.
4. **ID Poisoning**: Creating a product with a 1MB string as ID.
5. **PII Leak**: Non-admin user trying to list all `ai_logs`.
6. **State Shortcut**: Updating a product stock to a negative value or bypassing validation.
7. **Bypassing Server Timestamp**: Sending a client-side timestamp in `timestamp` field.
8. **Malicious SKU**: Injecting a long script string into the `sku` field of a log.
9. **Orphaned Log**: Creating a log for a SKU that doesn't exist (relational check).
10. **Admin Escalation**: Trying to write into an `admins` collection if it existed.
11. **Bulk Delete**: User trying to delete all products.
12. **Shadow Query**: Querying logs without a `userId` filter as a non-admin.

## 3. Test Runner (Draft)
A `firestore.rules.test.ts` would verify these scenarios by asserting `permission_denied` for the payloads above.
