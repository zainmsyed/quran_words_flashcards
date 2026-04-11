/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    id: "qfc2study0001",
    name: "study_state",
    type: "base",
    system: false,
    listRule: "@request.auth.id = user.id",
    viewRule: "@request.auth.id = user.id",
    createRule: "@request.auth.id != \"\" && @request.auth.id = user",
    updateRule: "@request.auth.id = user.id",
    deleteRule: "@request.auth.id = user.id",
    fields: [
      {
        name: "user",
        type: "relation",
        required: true,
        collectionId: "_pb_users_auth_",
        cascadeDelete: true,
        minSelect: 1,
        maxSelect: 1,
      },
      {
        name: "state_json",
        type: "text",
        required: true,
        min: 2,
        max: 32767,
      },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_study_state_user ON study_state (user)"
    ],
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("qfc2study0001");
  return app.delete(collection);
});
