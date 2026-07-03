# Security Specification: FinanceAI Cloud Security

## 1. Data Invariants

1. **Strict Ownership (Identity Invariant)**: A user's financial database document (`/user_databases/{userId}`) can only be read, created, updated, or deleted by the authenticated user whose `uid` exactly matches the document's `{userId}` path parameter.
2. **Authentication Verification (Auth Invariant)**: No unauthenticated (anonymous or guest) requests may read or write database records in Firestore.
3. **Verified Email Constraint (Trust Invariant)**: Write operations require `request.auth.token.email_verified == true` to prevent unverified email spoofing.
4. **Immutable Fields**: The document ID must strictly correspond to the authenticated user ID and cannot be modified or updated to a different user's ID.
5. **No System Overrides**: Only the owner of the document can perform data reads and updates; cross-user administrative access is denied since there are no administrative roles in this application.

---

## 2. The "Dirty Dozen" Threat Payloads

Here are 12 specific malicious payloads and requests designed to breach identity, integrity, and privacy, which our security rules must reject:

1. **Unauthenticated Read**: Attempting to read a user database while not signed in.
2. **Unauthenticated Write**: Attempting to create or update a user database while not signed in.
3. **Cross-User Hijacking (Read)**: User `attacker123` trying to read `/user_databases/victim456`.
4. **Cross-User Hijacking (Write)**: User `attacker123` trying to update `/user_databases/victim456` with malicious parameters.
5. **Spoofed Ownership Payload**: User `victim456` trying to create `/user_databases/victim456` but specifying `profile.userId = "attacker123"` inside the payload to spoof ownership or corrupt logs.
6. **Malicious ID Poisoning**: Trying to create `/user_databases/invalid_@#$_ID` with illegal characters in the user ID path.
7. **Unverified Email Modification**: User attempting to write database records while `email_verified == false` on their Auth token.
8. **Schema Injection (Shadow Fields)**: Attempting to update a user's database with unauthorized shadow fields (e.g., adding `isAdmin: true` or `role: "admin"` directly inside the database document).
9. **Invalid Type Injection (accounts)**: Writing an `accounts` list where elements are string types instead of objects.
10. **Resource Exhaustion Payload**: Writing a payload where the profile or settings fields contain excessively large strings (e.g., setting a name of 1MB size).
11. **Direct Denial of Service (Delete)**: User `attacker123` trying to delete `/user_databases/victim456` to destroy their data.
12. **Blanket Collection Scrape**: Attempting to query or list the entire `/user_databases` collection to harvest profiles and emails without specifying a single document target.

---

## 3. The Test Runner (`firestore.rules.test.ts`)

A mock test suite validating that all "Dirty Dozen" actions fail secure:

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import * as fs from "fs";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "atomic-chess-2kpr3",
    firestore: {
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("FinanceAI Security Rules - The Dirty Dozen", () => {
  it("1. Unauthenticated Read should fail", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    await assertFails(db.doc("user_databases/victim_user").get());
  });

  it("2. Unauthenticated Write should fail", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    await assertFails(db.doc("user_databases/victim_user").set({ profile: { name: "Hack" } }));
  });

  it("3. Cross-User Hijacking (Read) should fail", async () => {
    const context = testEnv.authenticatedContext("attacker123", { email_verified: true });
    const db = context.firestore();
    await assertFails(db.doc("user_databases/victim456").get());
  });

  it("4. Cross-User Hijacking (Write) should fail", async () => {
    const context = testEnv.authenticatedContext("attacker123", { email_verified: true });
    const db = context.firestore();
    await assertFails(db.doc("user_databases/victim456").set({ profile: { userId: "victim456" } }));
  });

  it("5. Spoofed Ownership Payload should fail schema check", async () => {
    const context = testEnv.authenticatedContext("victim456", { email_verified: true });
    const db = context.firestore();
    await assertFails(
      db.doc("user_databases/victim456").set({
        profile: { userId: "attacker123", name: "Spoofed" },
        settings: { currency: "BRL" }
      })
    );
  });

  it("6. Malicious ID Poisoning should fail", async () => {
    const context = testEnv.authenticatedContext("invalid_@#$_ID", { email_verified: true });
    const db = context.firestore();
    await assertFails(db.doc("user_databases/invalid_@#$_ID").set({ profile: { userId: "invalid_@#$_ID" } }));
  });

  it("7. Unverified Email write should fail", async () => {
    const context = testEnv.authenticatedContext("user123", { email_verified: false });
    const db = context.firestore();
    await assertFails(db.doc("user_databases/user123").set({ profile: { userId: "user123" } }));
  });

  it("8. Schema Injection (Shadow Fields) should fail", async () => {
    const context = testEnv.authenticatedContext("user123", { email_verified: true });
    const db = context.firestore();
    await assertFails(
      db.doc("user_databases/user123").set({
        profile: { userId: "user123", name: "User" },
        settings: { currency: "BRL" },
        extra_shadow_field: "malicious"
      })
    );
  });

  it("9. Invalid Type Injection (accounts) should fail validation", async () => {
    const context = testEnv.authenticatedContext("user123", { email_verified: true });
    const db = context.firestore();
    await assertFails(
      db.doc("user_databases/user123").set({
        profile: { userId: "user123", name: "User" },
        settings: { currency: "BRL" },
        accounts: ["should-be-objects-not-strings"]
      })
    );
  });

  it("10. Resource Exhaustion Payload should fail", async () => {
    const context = testEnv.authenticatedContext("user123", { email_verified: true });
    const db = context.firestore();
    const giantName = "A".repeat(1000);
    await assertFails(
      db.doc("user_databases/user123").set({
        profile: { userId: "user123", name: giantName },
        settings: { currency: "BRL" }
      })
    );
  });

  it("11. Direct Denial of Service (Delete) from third-party should fail", async () => {
    const context = testEnv.authenticatedContext("attacker123", { email_verified: true });
    const db = context.firestore();
    await assertFails(db.doc("user_databases/victim456").delete());
  });

  it("12. Blanket Collection Scrape should fail", async () => {
    const context = testEnv.authenticatedContext("user123", { email_verified: true });
    const db = context.firestore();
    await assertFails(db.collection("user_databases").get());
  });
});
```
