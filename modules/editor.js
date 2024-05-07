const { parseFormData, injectVariables } = require('../util.js');
const { Module } = require("../modules.js");
const mdl = module.exports = new Module();


// (G) Article creation
mdl.hook("GET", "/rediger-artikel/:articleUuid", async (database, req, $) => {
	if (!$) return; // TODO sec-fetch-user header is not always passed, find a different way to do this

	console.log("Article created");

	let id = $("#title").val(); // This should be failproof as long as people don't use inspir.dk
	await database.execute(
		`INSERT IGNORE INTO articles (id, uuid) VALUES (?, ?);`, 
		[id, req.params.articleUuid]
	);
});


// (Y) Article saving and loading
const activitesCtgUuid = "436a5cb2-f97d-11ed-801f-7963935a19ec";

mdl.hook("POST", "/rediger-artikel/:articleUuid", async (database, req) => {
	let { 
		publicationDate: date, type: category, tags, status, 
		date: startDate, endDate 
	} = parseFormData(req);

	let isPublic = status && (status == "active");
	let tagsStr = tags && tags.join(",");
	if (category != activitesCtgUuid) { // Is this necessary?
		startDate = endDate = null;
	}

	// TODO if something errors here, then what should be done?
	await database.execute(`
		UPDATE articles SET 
			date = IFNULL(?, date), category = ?, tags = ?, isPublic = IFNULL(?, isPublic),
			startDate = ?, endDate = ?
		WHERE uuid = ?;
		`, [date, category, tagsStr, isPublic, startDate, endDate, req.params.articleUuid]
	);
});

mdl.hook("GET", "/rediger-artikel/:articleUuid", async (database, req, $) => {
	let article = (await database.execute(
		`SELECT * FROM articles WHERE uuid = ?;`, 
		[req.params.articleUuid]
	))[0] || {};
	
	injectVariables($, {
		ARTICLE_ID: article.id,
		PUBLICATION_DATE: article.date,
		CATEGORY_UUID: article.category,
		ACTIVE_TAGS: (article.tags || "").split(","),
		IS_PUBLIC: (article.isPublic == 1)
	});
});

mdl.hook("POST", "/admin/articles/change-status/*", async (database, req, $) => {
	let { uuid: articleUuid, action } = parseFormData(req);
	let isPublic = (action == "active");

	await database.execute(
		`UPDATE articles SET isPublic = ? WHERE uuid = ?;`,
		[isPublic, articleUuid]
	);
});

// (O) Update article info on overview
function getArticleId(tr) {
	return tr.find(".generate-link").data("url").match(/[\w_]+$/)[0];
}

mdl.hook("GET", "/redaktør", async (database, req, $) => {
	// TODO some better way to do this (in other modules as well)
	let articleIds = $("#table tbody tr").toArray().map(tr => getArticleId($(tr)));
	let articleIdsStr = articleIds.length == 0 ? "NULL" : articleIds.map(id => `"${id}"`).join(",");
	let articles = await database.query(
		`SELECT id, uuid, date, category, isPublic FROM articles WHERE id IN (${articleIdsStr});`
	);

	let priorityColumn = ($("#table th:contains(Priority)").length == 1);
	if (priorityColumn) $("#table th:first").remove();

	$("#table th:eq(1)").after("<th>Udgivelsesdato</th><th>Kategori</th>")
	$("#table tbody tr").each((_, tr) => {
		if (priorityColumn) $(tr).find("td:first").remove();

		let articleId = getArticleId($(tr));
		let articleData = articles.find(a => a.id == articleId);
		if (!articleData) { // TODO what to do when no article data
			$(tr).remove();
			return;
		}

		$(tr).find("td:eq(1)").after(`
			<td>${articleData.date ? articleData.date.getTime() : ""}</td>
			<td>${articleData.category || ""}</td>
		`);
		
		if ($(tr).find("td:first a").length == 0) {
			$(tr).find("td:first").contents().wrap(`<a class="edit-a" href="/rediger-artikel/${articleData.uuid}"></a>`);
		}

		if (articleData.isPublic) $(tr).addClass("public");
	});
});


// (R) Article removal
mdl.hook("POST", "/admin/articles/delete-article/*", async (database, req) => {
	let { uuid: articleUuid } = parseFormData(req);
	await database.execute(`DELETE FROM articles WHERE uuid = ?;`, [articleUuid]);
});