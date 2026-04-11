/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");

  collection.createRule = "@request.auth.id != \"\" && @request.auth.collectionId = \"_superusers\"";

  return app.save(collection);
}, () => {
  // No-op rollback: PocketBase ships the auth collection by default.
});
