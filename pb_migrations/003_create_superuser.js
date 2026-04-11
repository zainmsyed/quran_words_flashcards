/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const email = ($os.getenv("PB_ADMIN_EMAIL") || "").trim();
  const password = ($os.getenv("PB_ADMIN_PASSWORD") || "").trim();

  if (!email || !password) {
    throw new Error("PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD must be set before PocketBase runs this migration.");
  }

  try {
    app.findAuthRecordByEmail("_superusers", email);
    return;
  } catch (_) {
    // continue with creation
  }

  const superusers = app.findCollectionByNameOrId("_superusers");
  const record = new Record(superusers);
  record.set("email", email);
  record.set("password", password);

  return app.save(record);
}, (app) => {
  const email = ($os.getenv("PB_ADMIN_EMAIL") || "").trim();

  if (!email) {
    return;
  }

  try {
    const record = app.findAuthRecordByEmail("_superusers", email);
    return app.delete(record);
  } catch (_) {
    return;
  }
});
