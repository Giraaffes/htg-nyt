const { injectVariables } = require('../util.js');
const { Module } = require("../modules.js");
const mdl = module.exports = new Module();


// (R) Activites dates and images
const activitesCtgUuid = "436a5cb2-f97d-11ed-801f-7963935a19ec";

function formatDate(date) {
	return {
		date: date.toLocaleString("da-DK", {day: "numeric", month: "long", year: "numeric", timeZone: "UTC"}),
		time: date.toLocaleString("da-DK", {timeStyle: "short", timeZone: "UTC"})
	};
}

mdl.hook("GET", "/artikel/:articleId", async (database, req, $) => {
	let articleData = (await database.execute(
		`SELECT uuid, startDate, endDate, category, thumbnailVersion FROM articles WHERE id = ?;`,
		[req.params.articleId]
	))[0];
	if (!articleData) return;
	
	injectVariables($, {ARTICLE_UUID: articleData.uuid, THUMBNAIL_VERSION: articleData.thumbnailVersion});
	
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
		
		$(".authorContainer").remove();

		$(".post-article").prepend(`
			<div class="style-illustration">
				<img src="https://www.htgnyt.dk/thumbnail/${articleData.uuid}_${articleData.thumbnailVersion}.png">
			</div>
		`);
	}
});