# Invite-Only Onboarding

Story 001 sets the PocketBase auth collection up for invite-only use.

## What invite-only means here

- the frontend will use email/password login
- public self-registration is disabled at the PocketBase collection-rule level
- admins create accounts manually in the PocketBase dashboard

## Manual account creation

1. Sign in to the PocketBase admin dashboard at `https://your-domain/_/`.
2. Open the `users` collection.
3. Click **New record**.
4. Enter the invited user's email address.
5. Set an initial password.
6. Save the record.
7. Share the credentials with the invited user through your normal out-of-band channel.

## Recommended admin checklist

- Create only the accounts you intend to invite.
- Use strong temporary passwords.
- Ask invited users to change their password after first login once the custom account settings flow ships.
- Disable or delete accounts for users you no longer want to invite.

## Password resets during the foundation phase

The custom in-app forgot/reset-password flow is planned for a later story. Until then, an admin can reset a user's password directly from the PocketBase dashboard by editing that user's record.

## Why this is manual

The project is targeting a small friends-and-family group, so a manual invite flow keeps the rollout simple while avoiding open signup.
