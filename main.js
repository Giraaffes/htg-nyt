require("express-async-errors");

const fs = require("fs");
const { exec } = require('child_process');

const crypto = require('crypto');
const mySQL = require('mysql2');

const mySQLConn = mySQL.createConnection({
  host: "localhost",
  user: "root",
	password: "",
	database: "htgnyt"
});

const express = require("express");
const bodyParser = require("body-parser")
const axios = require("axios");

const server = express();



// Github webhook
server.post("/github-push", (req, res) => {
	if (!req.headers["x-github-hook-id"] == "457630844") return;
	res.status(200).end();

	exec("git pull", (error, stdout, stderr) => {
		console.log(stdout);
		process.exit();
	});
});


// Custom resources
function fileExists(filePath) {
	try {
		fs.accessSync(filePath, fs.constants.R_OK);
		return true;
	} catch {
		return false;
	}
}

server.get(/\/custom(\/.+)/, (req, res) => {
	let filePath = `${__dirname}/files/${req.params[0]}`;
	if (fileExists(filePath)) {
		res.sendFile(filePath);
	} else {
		res.status(404).send("404 not found").end();
	}
});


// Remapping
// Order matters here
const remapPaths = [
	{from: "user/login", to: "login"},
	{from: "", to: "hovedmenu"},
	{from: "e9a/htg/", to: "artikel/"},
	{from: "e9a/htg", to: ""},
	{from: "admin/articles/overview/9e106940-5c97-11ee-b9bf-d56e49dc725a", to: "redaktør"},
	{from: "admin/articles/overview", to: "redaktør"},
	{from: "admin/articles/edit/", to: "rediger-artikel/"},
	{from: "admin/articles/preview-article/", to: "forhåndsvis-artikel/"},
	{from: "account/details", to: "profil"},
	{from: "councils/list", to: "udvalg"},
	{from: "klassen/arsbog/", to: "person/"}
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


// Article views
const frontPageRegex = /^https?:\/\/(?:www)?.htg\-?nyt.dk$\//;
const hashResetInterval = 24 * 60 * 60 * 1000; // daily

let accessHashes = [];
let connectedToDatabase = false;
mySQLConn.connect((err) => {
	if (err) return;

	connectedToDatabase = true;
	setInterval(() => {
		accessHashes = [];
	}, hashResetInterval);

	console.log("Connected to database");
});

function queryDatabase(query) {
	return new Promise((res, rej) => {
		mySQLConn.query(query, (err, results, fields) => {
			if (err) {
				rej(err);
			} else {
				res({results, fields});
			}
		});
	});
}

server.get("/artikel/:article", async (req, res, next) => {
  if (!connectedToDatabase) return next();

	let referer = req.headers["referer"];
	if (!referer || !referer.match(frontPageRegex)) return next();

	let articleId = req.params["article"];
	let identifier = ([req.ip, articleId, req.headers["user-agent"] || ""]).join();
	let accessHash = crypto.createHash('md5').update(identifier).digest('hex');
	if (!accessHashes.includes(accessHash)) {
		accessHashes.push(accessHash);
		await queryDatabase(
			`INSERT IGNORE INTO articles VALUES ("${articleId}", 0, NULL);`
		);
		await queryDatabase(
			`UPDATE articles SET views = views + 1 WHERE id = "${articleId}";`
		);
	}

	next();
});


// Injects
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
	"/person/": "person"
};

const oldDomainHrefRegex = /(?<=href=")https?:\/\/(?:www)?\.inspir\.dk/g;
const urlPathHrefRegex = /(?<=href=")[^?"]*/g;
const backToPathHrefRegex = /(?<=href="[^"]+backTo=)[^&"]*/g;

const jQueryScriptRegex = /<script[^>]+src="[^"]+code\.jquery\.com.+?<\/script>/s;
const datatablesScriptRegex = /<script[^>]+src="[^"]+cdn\.datatables\.net.+?<\/script>/s;

const articleHrefRegex = /(?<=href="\/artikel\/)[\w_]+/g;
const articleAnchorRegex = /<a\s+class="article-anchor"\s+href="\/artikel\/([\w_]+)".+?>/g;

function lastMatch(str, matchStr) {
	let regex = RegExp(matchStr);
	let match, lastMatch;
	while ((match = regex.exec(str)) != null) {
		lastMatch = match;
	}
	return lastMatch;
}

function inject(str, regex, last, insertStr) {
	let match = last ? lastMatch(str, regex) : str.match(regex);
	let afterMatchIndex = match.index + match[0].length;
	return `${str.slice(0, afterMatchIndex)}${insertStr}${str.slice(afterMatchIndex)}`;
}

async function pageHook(req, path, html) {
	let newHtml = html;

	// Path remapping
	newHtml = newHtml.replaceAll(oldDomainHrefRegex, "");
	newHtml = remapAllPaths(newHtml, urlPathHrefRegex);
	newHtml = remapAllPaths(newHtml, backToPathHrefRegex);

	// Injects
	// It's assumed that there is always a script last in body - else shit will break
	let injectScriptsRegex = /<\/script>(?=\s*<\/body>)/;

	let jQueryScriptMatch = newHtml.match(jQueryScriptRegex);
	if (jQueryScriptMatch) injectScriptsRegex = jQueryScriptRegex;

	let datatablesScript = newHtml.match(datatablesScriptRegex);
	if (datatablesScript) {
		newHtml = newHtml
			.replace(datatablesScript[0], "")
			.replace(jQueryScriptMatch[0], `$&${datatablesScript[0]}`);
		injectScriptsRegex = datatablesScriptRegex;
	}

	newHtml = inject(newHtml, />(?=\s*<\/head>)/g, true,
		`<link rel="stylesheet" href="/custom/css/general.css">`
	);

	let injectName = pageInjects[path];
	if (!injectName) {
		let subpathInjectKey = Object.keys(pageInjects).find(k => 
			k != "/" && k.endsWith("/") && path.startsWith(k)
		);
		if (subpathInjectKey) injectName = pageInjects[subpathInjectKey];
	}
	if (injectName) {
		// Hardcoded for editor page
		newHtml = newHtml.replace(/(?<=<script>\s*)initDataTable\(\);/, "");

		newHtml = inject(newHtml, injectScriptsRegex, false,
			`<script src="/custom/js/${injectName}.js"></script>`
		);
		newHtml = inject(newHtml, />(?=\s*<\/head>)/g, true,
			`<link rel="stylesheet" href="/custom/css/${injectName}.css">`
		);
	}

	newHtml = inject(newHtml, injectScriptsRegex, false,
		`<script src="/custom/js/general.js"></script>`
	);

	// Article views
	if (path == "/" && req.query["type"] != "aktiviteter" && connectedToDatabase) {
		let articleIds = newHtml.match(articleHrefRegex);
		let { results } = await queryDatabase(
			`SELECT id, views FROM articles WHERE id IN (${articleIds.map(e => `"${e}"`).join(", ")});`
		);
		newHtml = newHtml.replaceAll(articleAnchorRegex, (tag, articleId) => {
			let entry = results.filter(e => e.id == articleId)[0];
			let views = entry ? entry.views : 0;
			return `${tag}<p class="article-views">${views} visning${views == 1 ? "" : "er"}</p>`;
		});
	}

	return newHtml;
}


// URL params
const remapCategoryNames = {
	"nyt": "new",
	"sjovt": "faq",
	"fagligt": "hack",
	"mødesteder": "meeting",
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
function redirectHook(req, redirectUrl, params) {
	if (req.method == "POST" && req.path == "/user/login") {
		if (redirectUrl.startsWith("/user/login")) {
			params.set("incorrect", "true");
			return `/user/login?${decodeURIComponent(params.toString())}`;
		} else {
			return req.query["backTo"] || "/";
		}
	} else if (req.method == "GET" && req.path == "/user/logout") {
		return req.query["backTo"] || "/";
	} else {
		return redirectUrl;
	}
}


// Main handler
const oldDomainRegex = /https?:\/\/(?:www)?\.inspir\.dk/g;
const urlPathRegex = /\/[^?]*/g;

server.use(bodyParser.raw({ type: "*/*", limit: "100mb" }));
server.use(async (req, res) => {
	req.url = decodeURI(req.url);
	req.url = req.url.replaceAll(/%2f/gi, "⧸");

	let paramsStr = (req.url.match(/(?<=\?).+/) || [""])[0];
	let params = new URLSearchParams(paramsStr);
	paramsHook(req, params);
	req.url = `${req.path}${params.size > 0 ? ("?" + params.toString()) : ""}`;

	let originalPath = req.path; // Since this value is changed automatically below
	req.url = unmapAllPaths(req.url, /^[^?]+/g);

	delete req.headers.host;
	let inspirRes = await axios({
		method: req.method,
		url: `https://www.inspir.dk${req.url}`,
		headers: req.headers,
		data: req.body,
		responseType: "arraybuffer",
		responseEncoding: "binary",
		maxRedirects: 0,
		validateStatus: () => true
	});

	if (
		inspirRes.status == 404 || inspirRes.status == 500 || 
		(inspirRes.headers.location || "").endsWith("/e9a")
	) {
		res.sendFile(`${__dirname}/files/not_found.html`);
		return;
	}

	let redirectUrl = inspirRes.headers.location;
	if (redirectUrl) {
		redirectUrl = redirectUrl.replace(oldDomainRegex, "");
		redirectUrl = redirectHook(req, redirectUrl, params);
		if (redirectUrl.startsWith("/")) {
			redirectUrl = remapAllPaths(redirectUrl, urlPathRegex);
		}
		inspirRes.headers.location = encodeURI(redirectUrl);
	}

	let contentType = inspirRes.headers["content-type"];
	if (!redirectUrl && req.method == "GET" && contentType && contentType.startsWith("text/html")) {
		let encodingMatch = contentType.match(/charset=([^;]+)/);
		let encoding = encodingMatch ? encodingMatch[1] : "utf8";
		
		let html = inspirRes.data.toString(encoding)
		let newHtml = await pageHook(req, originalPath, html);
		inspirRes.data = Buffer.from(newHtml, encoding);
	}

	// To fix a glitch where nginx complains when both transfer-encoding and content-length are sent
	delete inspirRes.headers["transfer-encoding"];

	res.statusMessage = inspirRes.statusText;
	res.status(inspirRes.status);
	res.set(inspirRes.headers);
	res.send(inspirRes.data);
	res.end();
});


// Error handling
server.use((err, req, res, next) => {
  console.error((new Date()).toLocaleString(), err);
  res.status(500).send("<title>Fejl</title>Beklager, der opstod en fejl...").end();
})


// Server listen
server.listen(process.env.PORT || 8000, "127.0.0.1", () => {
	console.log("Ready");
});