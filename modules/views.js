const { Module } = require("../modules.js");
const mdl = module.exports = new Module();


// (R) Hash resetting
const hashResetInterval = 24 * 60 * 60 * 1000; // Daily
let accessHashes = [];

mdl.onReady(() => {
	setInterval(() => {
		accessHashes = [];
	}, hashResetInterval);
});


// (O) Update views on click
const crypto = require("crypto");
const frontPageRegex = /^https?:\/\/(?:www)?.htg\-?nyt.dk\/(?:\?|$)/;

mdl.hook("GET", "/artikel/:articleId", async (database, req, $) => {
  if (process.env.LOCAL) return;

	let referer = req.headers["referer"];
	if (!referer || !referer.match(frontPageRegex)) return;

	let identifier = ([req.ip, req.params.articleId, req.headers["user-agent"] || ""]).join();
	let accessHash = crypto.createHash('md5').update(identifier).digest('hex');
	if (!accessHashes.includes(accessHash)) {
		accessHashes.push(accessHash);
		await database.execute(
			`UPDATE articles SET views = views + 1 WHERE id = ?;`,
			[req.params.articleId]
		);
	}
});


// (Y) Display views on front page
function getArticleId(article) {
	return article.find(".article-anchor").attr("href").match(/\/artikel\/([\w_]+)/)[1];
}

mdl.hook("GET", "/", async (database, req, $) => {
	if (req.query["type"] == "aktiviteter" || req.query["type"] == "kantinen") return;
	
	let articleElements = $(".article-listing").toArray();
	let articlesData = await database.query(
		`SELECT id, views FROM articles WHERE id IN ?;`,
		[articleElements.map(a => getArticleId($(a)))]
	);

	$(".article-listing").each((_, article) => {
		let articleId = getArticleId($(article));
		let articleData = articlesData.find(e => e.id == articleId);
		let views = articleData ? articleData.views : 0;

		let subheadline = $(article).find("h5:first").next();
		subheadline.after(
			`<p class="article-views">${views} visning${views == 1 ? "" : "er"}</p>`
		);
	});
});
