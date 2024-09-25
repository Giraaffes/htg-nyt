const Module = require("../modules.js").Module;
const mdl = module.exports = new Module();


const activitesCtgUuid = "11edf97d-436a-5cb2-801f-7963935a19ec";

mdl.hook("GET", "/", async (database, req, $) => {
	let paramsStr = (req.url.match(/(?<=\?).+/) || [""])[0];
	let params = new URLSearchParams(paramsStr);
	if (params.has("type")) return;

	let articleTemplate = $('.article-listing:first').prop('outerHTML');
	$(".article-listing").remove();
	
	let articles = await database.query(
		`SELECT * FROM articles WHERE isPublic = true;`
	);
	articles = articles.filter(a => a.category != activitesCtgUuid);
	articles = articles.sort((a1, a2) => a1.date - a2.date).slice(-10);

	for (let a of articles) {
		let el = $(articleTemplate);
		el.find(".article-anchor").attr("href", `/artikel/${a.id}`);
		el.find(".article-headline").text(a.title); // subheadline is done in articles module
		el.find(".grey-box").remove();

		$("#dynamic-filters").after(el);
	}
});