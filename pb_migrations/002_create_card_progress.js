/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    id: "qfc2cardprog001",
    name: "card_progress",
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
        name: "word_id",
        type: "text",
        required: true,
        min: 1,
        max: 32,
        pattern: "",
      },
      {
        name: "interval",
        type: "number",
        required: false,
        min: 0,
        noDecimal: false,
      },
      {
        name: "ease",
        type: "number",
        required: false,
        min: 1,
        max: 4,
        noDecimal: false,
      },
      {
        name: "due_date",
        type: "date",
        required: false,
      },
      {
        name: "review_count",
        type: "number",
        required: false,
        min: 0,
        noDecimal: true,
      },
      {
        name: "hard_count",
        type: "number",
        required: false,
        min: 0,
        noDecimal: true,
      },
      {
        name: "got_count",
        type: "number",
        required: false,
        min: 0,
        noDecimal: true,
      },
      {
        name: "easy_count",
        type: "number",
        required: false,
        min: 0,
        noDecimal: true,
      },
      {
        name: "last_rating",
        type: "select",
        required: false,
        values: ["hard", "got", "easy"],
        maxSelect: 1,
      },
      {
        name: "last_reviewed_at",
        type: "date",
        required: false,
      },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_card_progress_user_word ON card_progress (user, word_id)"
    ],
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("qfc2cardprog001");
  return app.delete(collection);
});
