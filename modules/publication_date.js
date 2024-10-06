const { Module } = require("../modules.js");
const mdl = module.exports = new Module();


// (R) Reorder front page
function getArticleId(article) {
	return article.find(".article-anchor").attr("href").match(/\/artikel\/([\w_]+)/)[1];
}

mdl.hook("GET", "/", async (database, req, $) => {
	if (!req.query["type"] || req.query["type"] == "aktiviteter") return;

	let articleElements = $(".article-listing").toArray();
	let articlesData = await database.query(
		`SELECT id, date FROM articles WHERE id IN ?;`,
		[articleElements.map(a => getArticleId($(a)))]
	);

	articleElements = articleElements.sort((a1, a2) => {
		let d1 = articlesData.find(a => a.id == getArticleId($(a1))).date;
		let d2 = articlesData.find(a => a.id == getArticleId($(a2))).date;
		return d2 > d1 ? 1 : -1;
	});
	
	for (let articleEl of articleElements) {
		$(articleEl).appendTo(".col-sm-12");
	}
});


// (O) Display dates on article
const activitesCtgUuid = "11edf97d-436a-5cb2-801f-7963935a19ec";

mdl.hook("GET", "/artikel/:articleId", async (database, req, $) => {
	let articleData = (await database.execute(
		`SELECT date, category FROM articles WHERE id = ?;`,
		[req.params.articleId]
	))[0];
	if (!articleData) return;

	let dateStr = articleData.date.toLocaleString("da-DK", 
		{day: "numeric", month: "long", year: "numeric", timeZone: "UTC"}
	);
	if ($(".authorContainer").length == 1) {
		$(".authorDisName p").append(`<br><span class="date">${dateStr}</span>`)
	} else if (articleData.category != activitesCtgUuid) {
		$(".post-headline").after(`
			<div class="authorContainer">
				<div class="authorDisName no-pic">
					<p><span class="date">Udgivet d. ${dateStr}</span></p>
				</div>
			</div>
		`);
	}
});