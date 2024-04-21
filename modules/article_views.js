const crypto = require("crypto");

const hashResetInterval = 24 * 60 * 60 * 1000; // daily
let accessHashes = [];

exports.onReady = ((database) => {
	if (!database.isConnected()) return;

	setInterval(() => {
		accessHashes = [];
	}, hashResetInterval);
});


exports.hooks = [];


const frontPageRegex = /^https?:\/\/(?:www)?.htg\-?nyt.dk\/(?:\?|$)/;

exports.hooks.push(["GET /artikel/*", async (database, req, $, articleId) => {
  if (process.env.LOCAL || !database.isConnected()) return;

	let referer = req.headers["referer"];
	if (!referer || !referer.match(frontPageRegex)) return;

	let identifier = ([req.ip, articleId, req.headers["user-agent"] || ""]).join();
	let accessHash = crypto.createHash('md5').update(identifier).digest('hex');
	if (!accessHashes.includes(accessHash)) {
		accessHashes.push(accessHash);
		try {
			/*await database.query(
				`INSERT IGNORE INTO articles VALUES ("${articleId}", 0, NULL, NULL, NULL);`
			);*/
			await database.query(
				`UPDATE articles SET views = views + 1 WHERE id = "${articleId}";`
			);
		} catch (err) {
			console.error("Error when registering view:", err);
		}
	}
}]);


function getArticleId(article) {
	return article.find(".article-anchor").attr("href").match(/\/artikel\/([\w_]+)/)[1];
}

exports.hooks.push(["GET /", async (database, req, $) => {
	if (req.query["type"] == "aktiviteter" || !database.isConnected()) return;
	
	let articleIds = $(".article-listing").toArray().map(article => getArticleId($(article)));
	let articleIdsStr = articleIds.map(id => `"${id}"`).join(", ");
	let articleEntries = (await database.query(
		`SELECT id, views FROM articles WHERE id IN (${articleIdsStr});`
	)).results;

	$(".article-listing").each((_, article) => {
		let articleId = getArticleId($(article));
		let articleEntry = articleEntries.filter(e => e.id == articleId)[0];
		let views = articleEntry ? articleEntry.views : 0;

		let subheadline = $(article).find("h5:first").next();
		subheadline.after(
			`<p class="article-views">${views} visning${views == 1 ? "" : "er"}</p>`
		);
	});
}]);
