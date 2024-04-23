exports.hooks = [];


function getArticleId(article) {
	return article.find(".article-anchor").attr("href").match(/\/artikel\/([\w_]+)/)[1];
}

exports.hooks.push(["GET /", async (database, req, $) => {
	if (req.query["type"] == "aktiviteter" || !database.isConnected()) return;

	let articleIds = $(".article-listing").toArray().map(a => getArticleId($(a)));
	let articleIdsStr = articleIds.map(id => `"${id}"`).join(", ");
	let articles = (await database.query(
		`SELECT id, date FROM articles WHERE id IN (${articleIdsStr});`
	)).results;

	let articleElements = $(".article-listing").toArray();
	articleElements = articleElements.sort((a1, a2) => {
		let d1 = articles.find(a => a.id == getArticleId($(a1))).date;
		let d2 = articles.find(a => a.id == getArticleId($(a2))).date;
		return d2 > d1 ? 1 : -1;
	});
	for (let articleEl of articleElements) {
		$(articleEl).appendTo(".col-sm-12");
	}
	
	// $(".article-listing").each((_, article) => {
	// 	$(article.append)
	// });
}]);


exports.hooks.push(["GET /artikel/*", async (database, req, $, articleId) => {
	if (!database.isConnected()) return;

	let articleData = (await database.query(
		`SELECT date FROM articles WHERE id = "${articleId}";`
	)).results[0];
	if (!articleData) return;

	let dateStr = articleData.date.toLocaleString("da-DK", {day: "numeric", month: "long", year: "numeric"});
	$(".authorDisName p").append(`<br><span class="date">${dateStr}</span>`);
}]);