require("express-async-errors");

const fs = require("fs");
const { exec } = require('child_process');

const express = require("express");
const bodyParser = require("body-parser")
const axios = require("axios");

const server = express();


// Order matters
const remapPaths = [
	{from: "user/login", to: "login"},
	{from: "", to: "hovedmenu"},
	{from: "e9a/htg/", to: "artikel/"},
	{from: "e9a/htg", to: ""},
	{from: "admin/articles/overview/", to: "editor/"},
	{from: "admin/articles/overview", to: "editor"},
	{from: "admin/articles/edit/", to: "edit-article/"}
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


const pageInjects = {
	"/login": "login",
	"/hovedmenu": "homepage",
	"/": "front-page",
	"/artikel/": "article",
	"/editor/": "editor",
	"/edit-article/": "edit-article"
};

const oldDomainHrefRegex = /(?<=href=")https:\/\/(?:www)?\.inspir\.dk/g;
const urlPathHrefRegex = /(?<=href=")[^?"]*/g;
const backToPathHrefRegex = /(?<=href="[^"]+backTo=)[^&"]*/g;
const jQueryScriptRegex = /<script[^>]+src="[^"]+code\.jquery\.com.+?<\/script>/s;
const datatablesScriptRegex = /<script[^>]+src="[^"]+cdn\.datatables\.net.+?<\/script>/s;

function insertInString(str, insertStr, pos) {
	return `${str.slice(0, pos)}${insertStr}${str.slice(pos)}`;
}

function pageHook(path, html) {
	let newHtml = html;

	newHtml = newHtml.replaceAll(oldDomainHrefRegex, "");
	newHtml = remapAllPaths(newHtml, urlPathHrefRegex);
	newHtml = remapAllPaths(newHtml, backToPathHrefRegex);

	// It's assumed that there is always a script last in body - else shit will break
	let injectScriptsAfter = /<\/script>(?=\s*<\/body>)/;

	let jQueryScriptMatch = newHtml.match(jQueryScriptRegex);
	if (jQueryScriptMatch) injectScriptsAfter = jQueryScriptMatch[0];

	let datatablesScript = newHtml.match(datatablesScriptRegex);
	if (datatablesScript) {
		newHtml = newHtml
			.replace(datatablesScript[0], "")
			.replace(jQueryScriptMatch[0], `$&${datatablesScript[0]}`);
			injectScriptsAfter	 = datatablesScript[0];
	}

	newHtml = newHtml.replace(/>(?=\s*<\/head>)/, 
		`$&<link rel="stylesheet" href="/custom/css/general.css">`
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

		newHtml = newHtml.replace(injectScriptsAfter, 
			`$&<script src="/custom/js/${injectName}.js"></script>`
		);
		newHtml = newHtml.replace(/>(?=\s*<\/head>)/, 
			`$&<link rel="stylesheet" href="/custom/css/${injectName}.css">`
		);
	}

	newHtml = newHtml.replace(injectScriptsAfter, 
		`$&<script src="/custom/js/general.js"></script>`, 
	);

	return newHtml;
}


const baseDomain = "htg-nyt.dk";

server.use((req, res, next) => {
	if (req.hostname == baseDomain) {
		res.redirect(301, `https://www.${baseDomain}${req.originalUrl}`);
	} else {
		next();
	}
});


server.post("/github-push", (req, res) => {
	if (!req.headers["x-github-hook-id"] == "457630844") return;
	res.status(200).end();

	exec("git pull", (error, stdout, stderr) => {
		console.log(stdout);
		process.exit();
	});
});


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


const remapCategoryIds = {
	"nyt": "new",
	"sjovt": "faq",
	"lærerigt": "academy",
	"mødesteder": "meeting",
	"kalender": "calendar"
};

const oldDomainRegex = /https:\/\/(?:www)?\.inspir\.dk/g;
const urlPathRegex = /\/[^?]*/g;

server.use(bodyParser.raw({ type: "*/*", limit: "100mb" }));
server.use(async (req, res) => {
	if (req.method == "GET") {
		let paramsStr = (req.url.match(/(?<=\?).+/) || [""])[0];
		let params = new URLSearchParams(paramsStr);

		if (req.path == "/") {
			let remapCategoryIdTo = remapCategoryIds[params.get("type")];
			console.log(remapCategoryIdTo);
			if (remapCategoryIdTo) params.set("type", remapCategoryIdTo);
		} 
		
		// Hardcoded
		if (req.path == "/" && (!params.has("type") || !params.get("type").trim())) {
			params.set("type", "new");
		} else if (req.path.startsWith("/editor/") && !params.has("type")) {
			params.set("type", "local");
		}

		if (paramsStr != params.toString()) {
			req.url = req.url.replace(/(?:\?.*)?$/, "?" + params.toString());
		}
	}

	let originalPath = req.path; // Since this value is changed automatically below
	req.url = unmapAllPaths(req.url, /^[^?]+/g);

	// Not sure if this is necessary
	delete req.headers.host;

	let inspirRes = await axios({
		method: req.method,
		url: `https://www.inspir.dk${req.url}`,
		headers: req.headers,
		data: req.body,
		responseType: "arraybuffer",
		responseEncoding: "binary",
		maxRedirects: 0,
		validateStatus: () => true,

		// Fiddler proxy
		/*proxy: {
			protocol: "http",
			host: "127.0.0.1",
			port: 8888
		}*/
	});

	let redirectUrl = inspirRes.headers.location;
	if (redirectUrl) {
		// Hardcoded
		if (req.path == "/user/logout") {
			redirectUrl = "/";
		} else {
			redirectUrl = redirectUrl.replace(oldDomainRegex, "");
			redirectUrl = remapAllPaths(redirectUrl, urlPathRegex);
		}
	}
	inspirRes.headers.location = redirectUrl;

	let contentType = inspirRes.headers["content-type"];
	if (req.method == "GET" && contentType && contentType.startsWith("text/html")) {
		let encodingMatch = contentType.match(/charset=([^;]+)/);
		let encoding = encodingMatch ? encodingMatch[1] : "utf8";
		
		let html = inspirRes.data.toString(encoding)
		let newHtml = pageHook(originalPath, html);
		inspirRes.data = Buffer.from(newHtml, encoding);
	}

	delete inspirRes.headers["transfer-encoding"];

	res.statusMessage = inspirRes.statusText;
	res.status(inspirRes.status);
	res.set(inspirRes.headers);
	res.send(inspirRes.data);
	res.end();
});


server.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("<title>Fejl</title>Beklager, der opstod en fejl...").end();
})


server.listen(process.env.PORT || 8000, "127.0.0.1", () => {
	console.log("Ready");
});