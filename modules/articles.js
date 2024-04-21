const fecha = require("fecha");
const formDataParser = require('../form_data_parser.js');

exports.hooks = [];


// Article creation
// https://stackoverflow.com/a/26915856
function getUuid1Date(uuid) {
	let splitUuid = uuid.split("-");
	let time = parseInt(`${splitUuid[2].slice(1)}${splitUuid[1]}${splitUuid[0]}`, 16);
	var timeMillis = Math.floor((time - 122192928000000000) / 10000);
	return new Date(timeMillis);
};

exports.hooks.push(["GET /rediger-artikel/*", async (database, req, $, articleUuid) => {
	if (!req.headers["sec-fetch-user"] || !database.isConnected()) return; // Header check will not be needed in the future

	let id = $("#title").val();
	let date = fecha.format(getUuid1Date(articleUuid), "YYYY-MM-DD hh:mm:ss");
	// Hardcoded fix for quotes in article name - should generally be doing this different
	await database.query(
		`INSERT IGNORE INTO articles (id, uuid, date) VALUES ("${id.replaceAll("\"", "\\\"")}", "${articleUuid}", "${date}")`
	);
}]);


// Article updating
exports.hooks.push(["POST /rediger-artikel/*", async (database, req, $, articleUuid) => {
	if (!database.isConnected()) return;

	let { type, tags, status, publicationDate } = formDataParser.parse(req);
	let dateStr = publicationDate && fecha.format(new Date(publicationDate), "YYYY-MM-DD hh:mm:ss");

	await database.query(
		`UPDATE articles SET 
			${publicationDate ? `date = "${dateStr}",` : ""}
			${type ? `category = "${type}",` : ""}
			${status ? `isPublic = ${status == "active"},` : ""} 
			tags = ${tags ? `"${tags.join(",")}"` : "NULL"}
		WHERE uuid = "${articleUuid}";`
	); // I should probably figure out a better way to do this, right? (also anyone could literally inject SQL)
}]);

exports.hooks.push(["GET /rediger-artikel/*", async (database, req, $, articleUuid) => {
	if (!database.isConnected()) return;

	let article = (await database.query(
		`SELECT id, date, category, tags, isPublic FROM articles WHERE uuid = "${articleUuid}";`
	)).results[0] || [];
	
	// Need a better way to do this as well
	$("body").prepend(`<script>
		const ARTICLE_ID = "${article.id || ""}";
		const PUBLICATION_DATE = ${article.date ? article.date.getTime() : "null"};
		const CATEGORY_UUID = "${article.category || ""}";
		const ACTIVE_TAGS = [${article.tags ? article.tags.split(",").map(t => `"${t}"`).join(", ") : ""}];
		const IS_PUBLIC = ${article.isPublic == 1};
	</script>`);
}]);

function getArticleId(tr) {
	return tr.find(".generate-link").data("url").match(/[\w_]+$/)[0];
}
exports.hooks.push(["GET /redaktør", async (database, req, $, articleUuid) => {
	if (!database.isConnected()) return;

	let articleIds = $("#table tbody tr").toArray().map(tr => getArticleId($(tr)));
	let articleIdsStr = articleIds.map(id => `"${id}"`).join(",");
	let articles = (await database.query(
		`SELECT id, uuid, date, category, isPublic FROM articles WHERE id IN (${articleIdsStr});`
	)).results;

	let priorityColumn = ($("#table th:contains(Priority)").length == 1);
	if (priorityColumn) $("#table th:first").remove();

	$("#table th:eq(1)").after("<th>Udgivelsesdato</th><th>Kategori</th>")

	$("#table tbody tr").each((_, tr) => {
		if (priorityColumn) $(tr).find("td:first").remove();

		let articleId = getArticleId($(tr));
		let articleData = articles.find(a => a.id == articleId);
		if (articleData) {
			$(tr).find("td:eq(1)").after(`<td>${articleData.date.getTime()}</td><td>${articleData.category || ""}</td>`);
		} else {
			$(tr).find("td:eq(1)").after(`<td></td><td></td>`);
		}
		
		if ($(tr).find("td:first a").length == 0) {
			$(tr).find("td:first").contents().wrap(`<a class="edit-a" href="/rediger-artikel/${articleData.uuid}"></a>`);
		}

		if (articleData.isPublic) $(tr).addClass("public");
	});
}]);

exports.hooks.push(["POST /admin/articles/change-status/*", async (database, req, $) => {
	if (!database.isConnected()) return;

	let { uuid, action } = formDataParser.parse(req);
	await database.query(`UPDATE articles SET isPublic = ${action == "active"} WHERE uuid = "${uuid}";`);
}]);


// Article removal
exports.hooks.push(["POST /admin/articles/delete-article/*", async (database, req, $) => {
	if (!database.isConnected()) return;

	let formData = formDataParser.parse(req);
	await database.query(`DELETE FROM articles WHERE uuid = "${formData.uuid}";`);
}]);