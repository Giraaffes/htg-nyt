const { parseFormData, injectVariables, wait } = require('../util.js');
const { Module } = require("../modules.js");
const mdl = module.exports = new Module();


// (G) Article creation
mdl.hook("GET", "/rediger-artikel/:articleUuid", async (database, req, $) => {
	if (!$) return; // TODO sec-fetch-user header is not always passed, find a different way to do this (...I don't know what this comment means anymore)

	// This should be failproof as long as the article hasn't already been created (on inspir.dk)
	let id = $("#title").val(); 
	await database.execute(
		`INSERT IGNORE INTO articles (id, uuid, title) VALUES (?, ?, ?);`, 
		[id, req.params.articleUuid, id]
	);
});


// (Y) Save and load timings
let saveQueue = {};

mdl.route("POST", "/rediger-artikel/:articleUuid", async (database, req, res, next) => {
	let { articleUuid } = req.params;
	let savePromise = new Promise(res => {
		saveQueue[articleUuid] = {
			callback: res
		};
	});
	saveQueue[articleUuid].promise = savePromise;
	next();
});

mdl.route("GET", "/rediger-artikel/:articleUuid", async (database, req, res, next) => {
	let { articleUuid } = req.params;
	if (saveQueue[articleUuid]) {
		// I don't actually think there is any reason for this?
		await Promise.race([saveQueue[articleUuid].promise, wait(2000)]);
	}
	next();
});


// (Y) Article saving and loading
const activitesCtgUuid = "436a5cb2-f97d-11ed-801f-7963935a19ec";

mdl.hook("POST", "/rediger-artikel/:articleUuid", async (database, req) => {
	let { 
		title, journalistName: author, withoutAuthor, publicationDate: date, type: category, tags, status, 
		date: startDate, endDate 
	} = parseFormData(req);

	title = title ? title : null; // falsy -> null
	author = withoutAuthor == "true" ? null : author;
	let isPublic = (status && status == "active");
	let tagsStr = (tags && tags.join(","));
	if (category != activitesCtgUuid) { // Is this necessary?
		startDate = endDate = null;
	}

	let { articleUuid } = req.params;
	console.log(await database.execute(`
		UPDATE articles SET 
			title = IFNULL(?, title), author = ?, date = IFNULL(?, date), 
			category = ?, tags = ?, isPublic = IFNULL(?, isPublic),
			startDate = ?, endDate = ?
		WHERE uuid = ?;
		`, [title, author, date, category, tagsStr, isPublic, startDate, endDate, articleUuid]
	));
	saveQueue[articleUuid].callback();
	
	console.log("-----\n", ([title, author, date, category, tagsStr, isPublic, startDate, endDate, articleUuid]).join("\n"), "\n-----\n");
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
// function getArticleId(tr) {
// 	return tr.find(".generate-link").data("url").match(/[\w_]+$/)[0];
// }

// mdl.hook("GET", "/redaktør", async (database, req, $) => {
// 	let articleIds = $("#table tbody tr").toArray().map(tr => getArticleId($(tr)));
// 	let articles = await database.query(
// 		`SELECT id, uuid, date, category, isPublic FROM articles WHERE id IN ?;`,
// 		[articleIds]
// 	);

// 	let priorityColumn = ($("#table th:contains(Priority)").length == 1);
// 	if (priorityColumn) $("#table th:first").remove();

// 	$("#table th:eq(1)").after("<th>Udgivelsesdato</th><th>Kategori</th>")
// 	$("#table tbody tr").each((_, tr) => {
// 		if (priorityColumn) $(tr).find("td:first").remove();

// 		let articleId = getArticleId($(tr));
// 		let articleData = articles.find(a => a.id == articleId);
// 		if (!articleData) { // TODO what to do when no article data
// 			$(tr).remove();
// 			return;
// 		}

// 		$(tr).find("td:eq(1)").after(`
// 			<td>${articleData.date ? articleData.date.getTime() : ""}</td>
// 			<td>${articleData.category || ""}</td>
// 		`);
		
// 		if ($(tr).find("td:first a").length == 0) {
// 			$(tr).find("td:first").contents().wrap(`<a class="edit-a" href="/rediger-artikel/${articleData.uuid}"></a>`);
// 		}

// 		if (articleData.isPublic) $(tr).addClass("public");
// 	});
// });


// (O) Display articles in overview
mdl.hook("GET", "/redaktør", async (database, req, $) => {
	$("#table th:contains(Priority)").remove();
	$("#table th:eq(1)").after("<th>Udgivelsesdato</th><th>Kategori</th>");
	$("#table tbody tr").remove();

	let articles = await database.query(
		`SELECT id, uuid, title, author, date, category, isPublic FROM articles;`
	);
	for (let a of articles) {
		$("#table tbody").append($(
		 `<tr class="${a.isPublic ? "public" : ""}">
				<td><a class="edit-a" href="/rediger-artikel/${a.uuid}">${a.title}</a></td>
				<td>${a.author || "-"}</td>
				<td>${a.date ? a.date.getTime() : ""}</td>
				<td>${a.category || ""}</td>
				<td><button class="generate-link" data-url="https://inspir.dk/e9a/htg/${a.id}"></button></td>
			</tr>`) // uhh i need to add authors to database as well...
		);
	}
});


// (R) Article removal
mdl.hook("POST", "/admin/articles/delete-article/*", async (database, req) => {
	let { uuid: articleUuid } = parseFormData(req);
	await database.execute(`DELETE FROM articles WHERE uuid = ?;`, [articleUuid]);
});