const express = require("express");
const crypto = require("crypto");


const hashResetInterval = 24 * 60 * 60 * 1000; // daily

let database;
let accessHashes = [];

exports.onReady = ((database_) => {
	database = database_;

	if (database.isConnected()) {
		setInterval(() => {
			accessHashes = [];
		}, hashResetInterval);
	}
});


const frontPageRegex = /^https?:\/\/(?:www)?.htg\-?nyt.dk\/(?:\?|$)/;

exports.router = express.Router();

exports.router.get("/artikel/:article", async (req, res, next) => {
  if (!database.isConnected()) return next();

	let referer = req.headers["referer"];
	if (!referer || !referer.match(frontPageRegex)) return next();

	let articleId = req.params["article"];
	let identifier = ([req.ip, articleId, req.headers["user-agent"] || ""]).join();
	let accessHash = crypto.createHash('md5').update(identifier).digest('hex');
	if (!accessHashes.includes(accessHash)) {
		accessHashes.push(accessHash);
		try {
			await database.query(
				`INSERT IGNORE INTO articles VALUES ("${articleId}", 0, NULL);`
			);
			await database.query(
				`UPDATE articles SET views = views + 1 WHERE id = "${articleId}";`
			);
		} catch (err) {
			console.error("Error when registering view:", err);
		}
	}

	next();
});


function getArticleId(article) {
	return $(article).find(".article-anchor").attr("href").match(/\/artikel\/([\w_]+)/)[1];
}

exports.pageHook = (async (req, $) => {
	if (!(
		req.path == "/" && req.query["type"] != "aktiviteter" && database.isConnected()
	)) return;
	
	let articleIds = $(".article-listing").toArray().map(getArticleId);
	let articleIdsStr = articleIds.map(id => `"${id}"`).join(", ");
	let { articleEntries } = await database.query(
		`SELECT id, views FROM articles WHERE id IN (${articleIdsStr});`
	);

	$(".article-listing").each((_, article) => {
		let articleId = getArticleId(article);
		let articleEntry = articleEntries.filter(e => e.id == articleId)[0];
		let views = articleEntry ? articleEntry.views : 0;

		let subheadline = $(article).find("h5:first").next();
		subheadline.after(
			`<p class="article-views">${views} visning${views == 1 ? "" : "er"}</p>`
		);
	});
});
