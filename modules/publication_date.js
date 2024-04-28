exports.hooks = [];


// (R) Reorder front page
function getArticleId(article) {
	return article.find(".article-anchor").attr("href").match(/\/artikel\/([\w_]+)/)[1];
}

exports.hooks.push(["GET /", async (database, req, $) => {
	if (req.query["type"] == "aktiviteter") return;

	let articleIds = $(".article-listing").toArray().map(a => getArticleId($(a)));
	let articleIdsStr = articleIds.map(id => `"${id}"`).join(", ");
	let articles = await database.query(
		`SELECT id, date FROM articles WHERE id IN (${articleIdsStr});`
	);

	let articleElements = $(".article-listing").toArray();
	articleElements = articleElements.sort((a1, a2) => {
		let d1 = articles.find(a => a.id == getArticleId($(a1))).date;
		let d2 = articles.find(a => a.id == getArticleId($(a2))).date;
		return d2 > d1 ? 1 : -1;
	});
	for (let articleEl of articleElements) {
		$(articleEl).appendTo(".col-sm-12");
	}
}]);


// (O) Display dates on article
exports.hooks.push(["GET /artikel/*", async (database, req, $, articleId) => {
	let articleData = (await database.execute(
		`SELECT date FROM articles WHERE id = ?;`,
		[articleId]
	))[0];
	if (!articleData) return;

	let dateStr = articleData.date.toLocaleString("da-DK", 
		{day: "numeric", month: "long", year: "numeric", timeZone: "UTC"}
	);
	$(".authorDisName p").append(`<br><span class="date">${dateStr}</span>`);
}]);