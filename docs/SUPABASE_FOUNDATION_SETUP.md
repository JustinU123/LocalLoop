# LocalLoop Supabase Foundation Setup

This guide explains how to apply the first LocalLoop database migration for **profiles** and **businesses**.

This foundation does **not** connect Photo Post publishing yet, and it does **not** replace the app’s current AsyncStorage verification flow.

---

## 1. Open the Supabase dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Sign in to your Supabase account.
3. Open the LocalLoop project that matches the app’s `.env` values:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Use the same project the mobile app already uses for authentication.

---

## 2. Open the SQL Editor

1. In the left sidebar, click **SQL Editor**.
2. Click **New query**.

---

## 3. Paste and run the migration

1. Open this file in the repo:

   `supabase/migrations/20260718_create_profiles_and_businesses.sql`

2. Copy the **entire** SQL script.
3. Paste it into the Supabase SQL Editor.
4. Review the script once more.
5. Click **Run**.

Expected result:

- The query completes without errors.
- You should see a success message in the SQL Editor.

This migration is designed to be safe for a fresh setup. It does **not** delete auth users or existing auth data.

---

## 4. Confirm the `profiles` table exists

1. In the left sidebar, open **Table Editor**.
2. Look for **`profiles`** under the `public` schema.
3. Confirm these columns exist:
   - `id`
   - `display_name`
   - `account_type`
   - `created_at`
   - `updated_at`

You can also run:

```sql
select * from public.profiles limit 5;
```

---

## 5. Confirm the `businesses` table exists

1. In **Table Editor**, look for **`businesses`**.
2. Confirm key columns exist:
   - `id`
   - `owner_user_id`
   - `name`
   - `verification_status`
   - `verified_at`
   - `created_at`
   - `updated_at`

You can also run:

```sql
select * from public.businesses limit 5;
```

---

## 6. Confirm RLS is enabled

1. Open **Table Editor**.
2. Select **`profiles`**.
3. Confirm **RLS** is enabled for the table.
4. Repeat for **`businesses`**.

You can also run:

```sql
select relname, relrowsecurity
from pg_class
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where nspname = 'public'
  and relname in ('profiles', 'businesses');
```

Both tables should show row security enabled.

Expected policies:

### `profiles`

- `Profiles: select own row`
- `Profiles: update own row`

There is intentionally **no client INSERT policy** on `profiles`. Profiles are created by the auth signup trigger.

### `businesses`

- `Businesses: select own row`
- `Businesses: insert own row`
- `Businesses: update own row`

There is intentionally **no public read policy** yet.

---

## 7. Test profile creation with a new account

The app has **not** been changed to read from Supabase profiles yet, but the database should still create profile rows automatically.

1. In the app, sign up with a **brand-new test email address**.
2. Return to Supabase **Table Editor → profiles**.
3. Confirm a new row exists where:
   - `id` matches the new auth user id
   - `account_type` defaults to `explorer` unless signup metadata included `business`
   - `display_name` was copied from metadata or email when available

Optional SQL check:

```sql
select p.*
from public.profiles p
join auth.users u on u.id = p.id
order by p.created_at desc
limit 10;
```

---

## 8. Why verification approval cannot be done by a normal app user

LocalLoop must not allow business owners to approve themselves.

This migration protects verification in two ways:

1. **RLS policies** let owners create and edit only their own business row.
2. **Database trigger** `enforce_business_verification_rules()` blocks normal authenticated users from:
   - setting `verification_status` to `verified`
   - setting `verification_status` to `rejected`
   - changing `verified_at`

Trusted admin/server processes using the **service role** or Supabase SQL Editor can still approve businesses later.

That means a modified mobile app cannot simply flip a user to verified unless it also bypasses database security, which the anon/authenticated client cannot do safely.

---

## 9. AsyncStorage verification has not been migrated yet

The app still stores these locally on device:

- verification status
- business application form data

Those AsyncStorage values still drive:

- Business Dashboard access in the app
- the current create flows
- dev-only verification shortcuts in development builds

This migration creates the backend foundation only. A later app update will sync AsyncStorage data into `public.businesses` and read verification from Supabase.

Until that migration work happens, the app and database may temporarily disagree about verification state.

---

## 10. Photo Post publishing is not connected yet

This migration does **not** create:

- post tables
- media tables
- storage buckets
- consumer feed queries

Photo Post creation in the app still uses local draft state and mock consumer data continues to power Explore, Saved, Map, and Promotions.

The helper function `public.is_verified_business_owner(uuid)` was added so future Post and Storage policies can reuse one trusted check.

---

## What to do next

After this migration succeeds, the next manual backend step is:

1. Create a test business row for a signed-in user using the SQL Editor or a future admin tool.
2. Approve that business using a **service-role/admin process**, not the mobile app.
3. Only after that, implement the app-side sync from AsyncStorage → Supabase and later add Photo Post tables/storage.

Do **not** put the Supabase service-role key in the Expo app.
