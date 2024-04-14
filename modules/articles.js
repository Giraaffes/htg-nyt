let database;

exports.onReady = ((database_) => {
	database = database_;
});


exports.router = require("express").Router();

exports.router.get("/rediger-artikel/:uuid", async (req, res, next) => {
	if (!database.isConnected() || !req.headers["sec-fetch-user"]) return;

	console.log(await database.query(`SELECT * FROM articles WHERE uuid = "${req.params.uuid}";`))

	next();
});

exports.router.post("/admin/articles/delete-article/:uuid", (req, res, next) => {
	if (!database.isConnected()) return;
});