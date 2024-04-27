const { parseFormData, injectVariables } = require('../util.js');

exports.hooks = [];


// (G) Article creation
// https://stackoverflow.com/a/26915856
function getUuid1Date(uuid) {
	let splitUuid = uuid.split("-");
	let time = parseInt(`${splitUuid[2].slice(1)}${splitUuid[1]}${splitUuid[0]}`, 16);
	var timeMillis = Math.floor((time - 122192928000000000) / 10000);
	return new Date(timeMillis);
};

exports.hooks.push(["GET /rediger-artikel/*", async (database, req, $, articleUuid) => {
	if (!req.headers["sec-fetch-user"]) return;

	let id = $("#title").val(); // This should be failproof as long as people don't use inspir.dk
	await database.execute(
		`INSERT IGNORE INTO articles (id, uuid) VALUES (?, ?);`, 
		[id, articleUuid]
	);
}]);


// (Y) Article saving and loading
const activitesCtgUuid = "436a5cb2-f97d-11ed-801f-7963935a19ec";

exports.hooks.push(["POST /rediger-artikel/*", async (database, req, $, articleUuid) => {
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
		`, [date, category, tagsStr, isPublic, startDate, endDate, articleUuid]
	);
}]);

exports.hooks.push(["GET /rediger-artikel/*", async (database, req, $, articleUuid) => {
	let article = (await database.execute(
		`SELECT * FROM articles WHERE uuid = ?;`, 
		[articleUuid]
	))[0] || {};
	
	injectVariables($, {
		ARTICLE_ID: article.id,
		PUBLICATION_DATE: article.date,
		CATEGORY_UUID: article.category,
		ACTIVE_TAGS: (article.tags || "").split(","),
		IS_PUBLIC: (article.isPublic == 1)
	});
}]);

exports.hooks.push(["POST /admin/articles/change-status/*", async (database, req, $) => {
	let { uuid: articleUuid, action } = parseFormData(req);
	let isPublic = action == "active";

	await database.execute(
		`UPDATE articles SET isPublic = ? WHERE uuid = ?;`,
		[isPublic, articleUuid]
	);
}]);

// (O) Update article info on overview
function getArticleId(tr) {
	return tr.find(".generate-link").data("url").match(/[\w_]+$/)[0];
}

exports.hooks.push(["GET /redaktør", async (database, req, $, articleUuid) => {
	let articleIds = $("#table tbody tr").toArray().map(tr => getArticleId($(tr)));
	let articleIdsStr = articleIds.map(id => `"${id}"`).join(",");
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
		let articleDate = articleData.date;
		
		if (articleData) {
			$(tr).find("td:eq(1)").after(`<td>${articleDate.getTime()}</td><td>${articleData.category || ""}</td>`);
		} else {
			$(tr).find("td:eq(1)").after(`<td></td><td></td>`);
		}
		
		if ($(tr).find("td:first a").length == 0) {
			$(tr).find("td:first").contents().wrap(`<a class="edit-a" href="/rediger-artikel/${articleData.uuid}"></a>`);
		}

		if (articleData.isPublic) $(tr).addClass("public");
	});
}]);


// (R) Article removal
exports.hooks.push(["POST /admin/articles/delete-article/*", async (database, req, $) => {
	let { uuid: articleUuid } = parseFormData(req);
	await database.execute(`DELETE FROM articles WHERE uuid = ?;`, [articleUuid]);
}]);