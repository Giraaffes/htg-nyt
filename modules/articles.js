exports.hooks = [];


// (R) Activites dates and images
const activitesCtgUuid = "436a5cb2-f97d-11ed-801f-7963935a19ec";

function formatDate(date) {
	return {
		date: date.toLocaleString("da-DK", {day: "numeric", month: "long", year: "numeric", timeZone: "UTC"}),
		time: date.toLocaleString("da-DK", {timeStyle: "short", timeZone: "UTC"})
	};
}

exports.hooks.push(["GET /artikel/*", async (database, req, $, articleId) => {
	let articleData = (await database.execute(
		`SELECT uuid, startDate, endDate, category FROM articles WHERE id = ?;`,
		[articleId]
	))[0];
	if (!articleData || articleData.category != activitesCtgUuid) return;

	let activityDateStr;
	let startDateFormatted = formatDate(articleData.startDate);
	let endDateFormatted = formatDate(articleData.endDate);
	if (startDateFormatted.date == endDateFormatted.date) {
		activityDateStr = `${startDateFormatted.date}, kl. ${startDateFormatted.time} - ${endDateFormatted.time}`;
	} else {
		activityDateStr = `${startDateFormatted.date} - ${endDateFormatted.date}`;
	}
	$("#subheadline").text(activityDateStr);

	$(".post-article").prepend(`
	<div class="style-illustration">
		<img src="https://inspir.dk/uploads/magazinesArticles/${articleData.uuid}/${articleData.uuid}.png">
	</div>
	`);
}]);