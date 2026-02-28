/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");
  collection.fields.add(new NumberField({ name: "follower_count", min: 0, max: null, noDecimal: true }));
  collection.fields.add(new NumberField({ name: "following_count", min: 0, max: null, noDecimal: true }));
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");
  collection.fields.removeByName("follower_count");
  collection.fields.removeByName("following_count");
  return app.save(collection);
});
