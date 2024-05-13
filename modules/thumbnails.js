const express = require("express");
const sharp = require("sharp");
const { parseFormData } = require('../util.js');

const Module = require("../modules.js").Module;
const mdl = module.exports = new Module();


// (R) Increment thumbnail versions
let lastThumbnail0;
mdl.hook("POST", "/rediger-artikel/:articleUuid", (database, req) => {
	let { magazinesArticlesImage: thumbnail } = parseFormData(req);

	// Sometimes duplicate thumbnail requests are made
	if (!thumbnail || thumbnail == lastThumbnail0) return; 
	lastThumbnail0 = thumbnail;

	database.execute(
		`UPDATE articles SET thumbnailVersion = thumbnailVersion + 1 WHERE uuid = ?;`, 
		[req.params.articleUuid]
	);
});


// (R) Change thumbnail URLs
function getArticleId(article) {
	return article.find(".article-anchor").attr("href").match(/\/artikel\/([\w_]+)/)[1];
}

mdl.hook("GET", "/", async (database, req, $) => {
	let articleElements = $(".article-listing").toArray();
	let articlesData = await database.query(
		`SELECT id, uuid, thumbnailVersion FROM articles WHERE id IN ?;`,
		[articleElements.map(a => getArticleId($(a)))]
	);

	$(".article-listing").each((_, article) => {
		let articleId = getArticleId($(article));
		let { uuid, thumbnailVersion } = articlesData.find(e => e.id == articleId);
		$(article).find("img:first").attr("src", `/thumbnail/${uuid}_${thumbnailVersion}.png`);
	});
});

mdl.hook("GET", "/rediger-artikel/:articleUuid", async (database, req, $) => {
	let articleData = (await database.execute(
		`SELECT thumbnailVersion FROM articles WHERE uuid = ?;`,
		[req.params.articleUuid]
	))[0];
	if (!articleData) return;

	$("img[name=magazinesArticlesImage]").attr("src", 
		`/thumbnail/${req.params.articleUuid}_${articleData.thumbnailVersion}.png`
	);
});

mdl.route("GET", "/thumbnail/:img.png", (database, req, res) => {
	let [ articleUuid ] = req.params.img.match(/^[^_]+/);
	res.redirect(`https://inspir.dk/uploads/magazinesArticles/${articleUuid}/${articleUuid}.png`);
});


// (O) Resize thumbnails
let lastThumbnail1;
mdl.route("POST", "/rediger-artikel/:articleUuid", express.raw({type: "*/*", limit: "100mb"}), async (database, req, res, next) => {
	let { magazinesArticlesImage: thumbnail } = parseFormData(req);
	if (!thumbnail) return next(); 

	// Sometimes duplicate thumbnail requests are made
	if (thumbnail == lastThumbnail1) return; 
	lastThumbnail1 = thumbnail;

	// https://stackoverflow.com/a/54664318
	let [ _, mimType, imgData64 ] = thumbnail.match(/data:([^;]+).+base64,([^;]+)/);
	let imgData = Buffer.from(imgData64, "base64");

	let img = sharp(imgData);
	img = img.resize(300, 300);

	let resizedImgData = (await img.toBuffer()).toString("base64");
	let resizedThumbnail = `data:${mimType};base64,${resizedImgData}`;

	// lol, idk if this is a bad way to do it
	let bodyStr = req.body.toString("utf-8");
	bodyStr = bodyStr.replace(thumbnail, resizedThumbnail);
	req.body = Buffer.from(bodyStr, "utf-8");

	next();
});