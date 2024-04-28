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
const activitesCtgUuid = "436a5cb2-f97d-11ed-801f-7963935a19ec";

function formatDate(date) {
	return {
		date: date.toLocaleString("da-DK", {day: "numeric", month: "long", year: "numeric", timeZone: "UTC"}),
		time: date.toLocaleString("da-DK", {timeStyle: "short", timeZone: "UTC"})
	};
}

exports.hooks.push(["GET /artikel/*", async (database, req, $, articleId) => {
	let articleData = (await database.execute(
		`SELECT date, startDate, endDate, category FROM articles WHERE id = ?;`,
		[articleId]
	))[0];
	if (!articleData) return;

	let publicationDateString = formatDate(articleData.date).date;
	$(".authorDisName p").append(`<br><span class="date">${publicationDateString}</span>`);

	if (articleData.category == activitesCtgUuid) {
		let activityDateStr;
		let startDateFormatted = formatDate(articleData.startDate);
		let endDateFormatted = formatDate(articleData.endDate);
		if (startDateFormatted.date == endDateFormatted.date) {
			activityDateStr = `${startDateFormatted.date}, kl. ${startDateFormatted.time} - ${endDateFormatted.time}`;
		} else {
			activityDateStr = `${startDateFormatted.date} - ${endDateFormatted.date}`;
		}
		$("#subheadline").text(activityDateStr);
	}
}]);