const Module = require("../modules.js").Module;
const mdl = module.exports = new Module();


const categories = {
	aktuelt: "11edfb97-c5d6-bab2-a165-31ad61c0f3b8",
	hygge: "11eeab1d-d0b4-4284-9ea8-dd9b09e4a5f2",
	fagligt: "11edfed6-b580-e5a6-9071-2bb1f6a2097f",
	activities: "11edf97d-436a-5cb2-801f-7963935a19ec"
};

function selectGeneralArticles(articles) {
	let articlesNew10 = articles.filter(
		a => a.category != categories.activities
	).sort((a1, a2) => a2.date - a1.date).slice(0, 10);

	let articlesShuffled = [];
	let shuffleCtgOrder = [...new Set(articlesNew10.map(a => a.category))];
	console.log(shuffleCtgOrder);
	while (articlesShuffled.length < 10) {
		for (let ctg of shuffleCtgOrder) {
			let i = articlesNew10.findIndex(a => a.category == ctg);
			if (i != -1) articlesShuffled.push(...articlesNew10.splice(i, 1));
		}
	}

	return articlesShuffled;
}

mdl.hook("GET", "/", async (database, req, $) => {
	let paramsStr = (req.url.match(/(?<=\?).+/) || [""])[0];
	let params = new URLSearchParams(paramsStr);
	if (params.has("type")) return;

	let articleTemplate = $('.article-listing:first').prop('outerHTML');
	$(".article-listing").remove();
	
	let articles = await database.query(
		`SELECT * FROM articles WHERE isPublic = true;`
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