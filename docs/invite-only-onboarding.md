# Invite-Only Onboarding

Story 001 sets the PocketBase auth collection up for invite-only use.

## What invite-only means here

- the frontend will use email/password login
- public self-registration is disabled at the PocketBase collection-rule level
- admins create accounts manually in the PocketBase dashboard
- invited users can change their own password in the app after signing in

## Manual account creation

1. Sign in to the PocketBase admin dashboard at `https://your-domain/_/`.
2. Open the `users` collection.
3. Click **New record**.
4. Enter the invited user's email address.
5. Set an initial password.
6. Save the record.
7. Share the credentials with the invited user through your normal out-of-band channel.
8. After they sign in once, they can change the password from the in-app account screen.

## Recommended admin checklist

- Create only the accounts you intend to invite.
- Use strong temporary passwords.
- Ask invited users to change their password after first login in the in-app account screen.
- Disable or delete accounts for users you no longer want to invite.

## Password recovery

If an invited user forgets their password, ask an admin to reset it directly in the PocketBase dashboard.

- Open the user's record in the `users` collection.
- Set a new temporary password.
- Share it with the user through your normal out-of-band channel.
- Ask them to change it after they sign in.

## Why this is manual

The project is targeting a small friends-and-family group, so a manual invite flow keeps the rollout simple while avoiding open signup.
