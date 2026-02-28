/// <reference path="../pb_data/types.d.ts" />
// This is a placeholder hook to verify PocketBase version requirement
// Check package.json for pocketbase ^0.25.0
onRecordCreate((e) => {
  e.next();
}, "users");