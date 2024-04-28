exports.router = require("express").Router();
exports.hooks = [];


exports.router.get("/:articleUuid/*", () => {

});


exports.hooks.push(["GET /artikel/*", async (database, req, $, articleId) => {

}]);