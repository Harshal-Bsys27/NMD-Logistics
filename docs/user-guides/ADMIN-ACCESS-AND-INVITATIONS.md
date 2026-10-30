# NMD Logistics Admin Access and Invitations

This guide explains who can invite users, how to bootstrap the first application administrator, and what invited staff do to get access.

## Application roles

| Role | Access |
|---|---|
| **Admin** | Logistics operations and staff access/invitation management |
| **Supervisor** | Logistics operations; cannot invite users or manage roles |
| **Delivery personnel** | Assigned work and allowed delivery-progress updates |

Roles are assigned by the server. An invitee cannot choose their own role. Public account creation should remain disabled in the hosted Supabase project.

## Bootstrap the first administrator

The first admin is provisioned manually, once, in the Supabase project used by the app. It is not created automatically. The account must already exist under Supabase **Authentication → Users**.

1. Confirm the project reference in the Supabase dashboard matches the project URL in the app's `.env.local`.
2. Confirm the exact sign-in email is listed under **Authentication → Users**.
3. In that same project's **SQL Editor**, run the query below, replacing the example address with the exact email listed in Auth:

```sql
INSERT INTO public.users (id, email, full_name, role, status)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'admin',
  'active'
FROM auth.users
WHERE lower(btrim(email)) = lower(btrim('admin@example.com'))
ON CONFLICT (id) DO UPDATE
SET role = 'admin', status = 'active';
```

This creates or promotes only the matching app profile. Do not promote other accounts unless they should have administrator privileges.

### Verify the result

Run this using the same exact email:

```sql
SELECT
  auth_user.email,
  app_user.role,
  app_user.status,
  app_user.id IS NOT NULL AS app_profile_exists
FROM auth.users AS auth_user
LEFT JOIN public.users AS app_user ON app_user.id = auth_user.id
WHERE lower(btrim(auth_user.email)) = lower(btrim('admin@example.com'));
```

The expected result is `role = admin`, `status = active`, and `app_profile_exists = true`.

### If SQL Editor says “Success. No rows returned”

That message means the SQL statement ran; it does **not** prove an account matched. `INSERT ... SELECT` can insert zero rows when the `WHERE` condition matches no Auth user.

- If the verification query returns a row with `app_profile_exists = false`, the Auth account exists but has no `public.users` profile. Check the email exactly, then rerun the insert query.
- If the verification query returns no rows, the email does not match an Auth user in that project. List the accounts and copy the exact email:

  ```sql
  SELECT email, created_at
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 50;
  ```

- If the Auth account is listed but matching still fails, recheck whitespace, the exact email spelling, and that SQL Editor and the app are using the same Supabase project.
- After successful verification, sign out of the application and sign back in to refresh the profile in the current session.

## Send an invitation

Sign in as an active application admin. The dashboard has an **Invite team member** action, and the sidebar has **Invites & staff**. Both open the same admin-only invitation form.

1. Select **Supervisor** or **Delivery personnel**.
2. Enter the person's name and email.
3. For delivery personnel, also enter their phone number, employee ID, vehicle type, and vehicle number. License number is optional.
4. Send the invite. If email delivery is not configured, the request will fail; configure it using [Email delivery](./EMAIL-DELIVERY.md).

The server creates the Auth invitation, assigns its role, and creates the application profile in an inactive state. Drivers also receive a delivery-personnel record for their employee and vehicle details.

## What the invited person does

1. Open the invitation email and click its link.
2. Verify the email address, then set a password on the invitation acceptance page.
3. Sign in with the invited email and the password they just created.
4. They will see only the features allowed for their assigned role.

The admin does not create, receive, or need to know the invitee's password. If the person does not see the invite, ask them to check spam and verify the SMTP provider's delivery logs.

## Access and invitation troubleshooting

- **No Invites & staff link:** check the signed-in profile role in the navbar. Only `admin` sees this section. The admin role is stored in `public.users`, not merely in Supabase's organization team.
- **Sidebar and navbar show different roles:** both should reflect the app profile. Refresh after signing out and in; report a mismatch rather than changing client-side role checks.
- **Invite API returns 401:** the request is not authenticated.
- **Invite API returns 403:** the signed-in app profile is not an active admin.
- **Email not received:** inspect SMTP settings, provider logs, Supabase Auth logs, and the **Invite user** template. See [Email delivery](./EMAIL-DELIVERY.md).
- **Invite link opens localhost for a remote user:** invites sent from a local app point to that local origin. Deploy the app, set its origin, and allow its callback URL in Supabase before inviting someone on another device.
