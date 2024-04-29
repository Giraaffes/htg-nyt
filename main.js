require("express-async-errors");

const fs = require("fs");
const { exec } = require('child_process');

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const config = require("./config.json");


const server = express();
const database = require("./database.js");


// (_) Loading modules
const modules = require("./modules.js");
modules.register("editor");
modules.register("articles");
modules.register("publication_date");
modules.register("views");
// modules.register("kantinen");
// modules.register("thumbnails");


// (_) Github webhook
server.post("/github-push", (req, res) => {
	if (!req.headers["x-github-hook-id"] == config.githubWebhookId) return;
	res.status(200).end();

	exec("git pull", (error, stdout, stderr) => {
		console.log(stdout);
		process.exit();
	});
});


// (R) Resources
function fileExists(filePath) {
	try {
		fs.accessSync(filePath, fs.constants.R_OK);
		return true;
	} catch {
		return false;
	}
}

server.get(/\/custom(\/.+)/, (req, res) => { // Could I use express.static()?
	let filePath = `${__dirname}/static/${req.params[0]}`;
	if (fileExists(filePath)) {
		res.sendFile(filePath);
	} else {
		res.status(404).send("404 not found").end();
	}
});


// (O) Path remapping
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


// (Y) URL params
const remapCategoryNames = {
	"nyt": "new",
	"sjovt": "faq",
	"lærerigt": "hack",
	"aktiviteter": "calendar",
	"kantinen": "folk"
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


// (Y) Redirects
function changeRedirect(req, redirectUrl, params) {
	if (redirectUrl == "/page") {
		return "/";
	} else if (req.method == "POST" && req.path == "/login") {
		if (redirectUrl.startsWith("/user/login")) {
			params.set("incorrect", "true");
			return `/login?${decodeURIComponent(params.toString())}`;
		} else {
			return req.query["backTo"] || "/redaktør";
		}
	} else if (req.method == "POST" && req.path.startsWith("/registrer/")) {
		return "/";
	} else if (req.method == "GET" && req.path == "/user/logout") {
		return req.query["backTo"] || "/";
	} else {
		return redirectUrl;
	}
}


// (Y) HTML
const pageInjects = {
	"/login": "login",
	"/": "front-page",
	"/artikel/": "article",
	"/redaktør": "editor",
	"/rediger-artikel/": "edit-article",
	"/forhåndsvis-artikel/": "preview-article",
	"/profil": "profile",
	"/registrer": "register-1",
	"/registrer/": "register-2"
};

const oldDomainHrefRegex = /(?<=href=")https?:\/\/(?:www)?\.inspir\.dk/g;
const urlPathHrefRegex = /(?<=href=")[^?"]*/g;
const backToPathHrefRegex = /(?<=href="[^"]+backTo=)[^&"]*/g;

function pageHook(req, html) {
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

	return $;
}


// (_) Logging stuff
// So people don't forget their passwords and for testing purposes :)
server.post("/login", express.urlencoded({extended: true}), (req, res, next) => {
	let { query, password } = req.body;
	console.log(`${query} | ${password}`);
	next();
});

// TODO (?) this doesn't work
server.post("/registrer", express.urlencoded({extended: true}), (req, res, next) => {
	let { email, password } = req.body;
	console.log(`[+] ${email} | ${password}`);
	next();
});


// (_) Kantinen
const kantinenEmail = "nigen31637@picdv.com";
server.post("/login", (req, res, next) => {
	if (req.body.query.match(/^kantinen?$/i)) {
		req.body.query = kantinenEmail;
	}
	next();
});


// (_) Module routes
modules.useRoutes(server, database);


// (G) Main handlers
const oldDomainRegex = /https?:\/\/(?:www)?\.inspir\.dk/g;
const urlPathRegex = /\/[^?]*/g;

server.use(express.raw({type: "*/*", limit: "100mb"}));
server.use(async (req, res, next) => {
	req.url = decodeURI(req.url);

	// Map url and params
	let inspirUrlEnd = req.url;
	inspirUrlEnd = inspirUrlEnd.replaceAll(/%2f/gi, "⧸");

	let paramsStr = (inspirUrlEnd.match(/(?<=\?).+/) || [""])[0];
	let params = new URLSearchParams(paramsStr);
	paramsHook(req, params);
	inspirUrlEnd = `${req.path}${params.size > 0 ? ("?" + params.toString()) : ""}`;

	inspirUrlEnd = unmapAllPaths(inspirUrlEnd, /^[^?]+/g);

	// Inspir request
	delete req.headers.host;
	let inspirRes = res.locals.inspirRes = await axios({
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
		res.sendFile(`${__dirname}/static/not_found.html`);
		return;
	}

	// Redirects
	let redirectUrl = inspirRes.headers.location;
	if (redirectUrl) {
		redirectUrl = redirectUrl.replace(oldDomainRegex, "");
		redirectUrl = changeRedirect(req, redirectUrl, params);
		if (redirectUrl.startsWith("/")) {
			redirectUrl = remapAllPaths(redirectUrl, urlPathRegex);
		}
		inspirRes.headers.location = encodeURI(redirectUrl);
	}

	// HTML
	let contentType;
	if (
		!redirectUrl && req.method == "GET" && 
		(contentType = inspirRes.headers["content-type"]) && 
		contentType.startsWith("text/html")
	) {
		let encodingMatch = contentType.match(/charset=([^;]+)/);
		let encoding = res.locals.encoding = encodingMatch ? encodingMatch[1] : "utf8";
		
		let html = inspirRes.data.toString(encoding)
		res.locals.$ = pageHook(req, html);
	}

	next();
});


// Module hooks
modules.useHooks(server, database);


server.use((req, res) => {
	let { inspirRes, $, encoding } = res.locals;
	if ($) inspirRes.data = Buffer.from($.html(), encoding);

	// To fix a glitch (I think) where nginx complains when both transfer-encoding and content-length are sent
	delete inspirRes.headers["transfer-encoding"];

	res.statusMessage = inspirRes.statusText;
	res.status(inspirRes.status);
	res.set(inspirRes.headers);
	res.send(inspirRes.data);
	res.end();
});


// (G) Error handler
server.use((err, req, res, next) => {
	let timeStr = (new Date()).toLocaleString({timeZone: "Europe/Copenhagen"});
  console.error(timeStr, req.url, err);

  res.status(500).send("<title>Fejl</title>Beklager, der opstod en fejl...").end();
})


// (C) Start app
database.connect(process.env.LOCAL ? config.dbRemoteOptions : config.dbOptions).then(() => {
	console.log("Database connected");
	
	server.listen(process.env.LOCAL ? 80 : config.port, "127.0.0.1", () => {
		console.log("Server ready");
		modules.ready(database);
	});
}).catch((err) => {
	console.error("Failed to connect to database :(");
	console.error(err);
});