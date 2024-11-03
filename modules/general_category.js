const Module = require("../modules.js").Module;
const mdl = module.exports = new Module();


const acitivitesCtgUuid = "11edf97d-436a-5cb2-801f-7963935a19ec";

function selectGeneralArticles(articles) {
	let articlesNew10 = articles.filter(
		a => a.category != acitivitesCtgUuid
	).sort((a1, a2) => a2.date - a1.date).slice(0, 10);

	// I think it's better not to shuffle
	// let articlesShuffled = [];
	// let shuffleCtgOrder = [...new Set(articlesNew10.map(a => a.category))];
	// console.log(shuffleCtgOrder);
	// while (articlesShuffled.length < 10) {
	// 	for (let ctg of shuffleCtgOrder) {
	// 		let i = articlesNew10.findIndex(a => a.category == ctg);
	// 		if (i != -1) articlesShuffled.push(...articlesNew10.splice(i, 1));
	// 	}
	// }

	// return articlesShuffled;

	return articlesNew10;
}

mdl.hook("GET", "/", async (database, req, $) => {
	let paramsStr = (req.url.match(/(?<=\?).+/) || [""])[0];
	let params = new URLSearchParams(paramsStr);
	if (params.has("type")) return;

	let articleTemplate = $('.article-listing:has(.article-image):first').prop('outerHTML');
	$(".article-listing").remove();
	
	let articles = await database.query(
		`SELECT * FROM articles WHERE category != "11edf97d-3547-84a2-a06d-19a686eff9ad";`
	);
	articles = selectGeneralArticles(articles);

	for (let a of articles.reverse()) {
		let el = $(articleTemplate);
		el.find(".article-anchor").attr("href", `/artikel/${a.id}`);
		el.find(".article-headline").text(a.title); // subheadline is done in articles module
		el.find(".grey-box").remove();

		$("#dynamic-filters").after(el);
	}
});