require("express-async-errors");

const fs = require("fs");

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


// It might be unnecessary that script and style are enabled seperately
const pageInjects = {
	"/login": {
		name: "login",
		script: true, style: true
	},
	"/hovedmenu": {
		name: "homepage",
		script: true, style: true
	},
	"/": {
		name: "frontpage",
		script: true, style: true
	},
	"/artikel/": {
		name: "article",
		script: true, style: true
	},
	"/editor/": {
		name: "editor",
		script: true, style: true
	},
	"/edit-article/": {
		name: "edit-article",
		script: true
	}
};

const oldDomainHrefRegex = /(?<=href=")https:\/\/(?:www)?\.inspir\.dk/g;
const urlPathHrefRegex = /(?<=href=")[^?"]*/g;
const backToPathHrefRegex = /(?<=href="[^"]+backTo=)[^&"]*/g;

function pageHook(path, html) {
	let newHtml = html;

	newHtml = newHtml.replaceAll(oldDomainHrefRegex, "");
	newHtml = remapAllPaths(newHtml, urlPathHrefRegex);
	newHtml = remapAllPaths(newHtml, backToPathHrefRegex);

	let inject = pageInjects[path];
	if (!inject) {
		let subpathInjectKey = Object.keys(pageInjects).find(k => 
			k != "/" && k.endsWith("/") && path.startsWith(k)
		);
		if (subpathInjectKey) inject = pageInjects[subpathInjectKey];
	}

	if (inject) {
		if (inject.script) {
			// Editor page needs script injected just before last script
			if (path.startsWith("/editor/")) {
				newHtml = newHtml.replace(/(?=<script>\s+initDataTable\(\);)/, 
					"<script src=\"/custom/editor_extra.js\"></script>"
				);
			}

			newHtml = newHtml.replace("</body>", 
				`<script src="/custom/${inject.name}.js"></script></body>`
			);
		}
		// Takes a bit to load when it's in body instead of head
		if (inject.style) {
			newHtml = newHtml.replace("</body>", 
				`<link rel="stylesheet" href="/custom/${inject.name}.css"></body>`
			);
		}
	}

	// Style is last in body now - remove some !important tags
	newHtml = newHtml.replace("</body>", 
		`<link rel="stylesheet" href="/custom/general.css"></body>`
	).replace("</body>", 
		`<script src="/custom/general.js"></script></body>`
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
	console.log(req);
	console.log(req.headers);
	res.status(200).end();
});


function fileExists(filePath) {
	try {
		fs.accessSync(filePath, fs.constants.R_OK);
		return true;
	} catch {
		return false;
	}
}

server.get("/custom/:file", (req, res) => {
	let filePath = `${__dirname}/files/${req.params.file}`;
	if (fileExists(filePath)) {
		res.sendFile(filePath);
	} else {
		res.status(404).send("404 not found").end();
	}
});


const oldDomainRegex = /https:\/\/(?:www)?\.inspir\.dk/g;
const urlPathRegex = /\/[^?]*/g;

server.use(bodyParser.raw({ type: "*/*" }));
server.use(async (req, res) => {
	// Hardcoded - whatever
	if (req.path == "/" && !req.url.match(/type=\w+/)) {
		res.redirect("/?type=new");
		return;
	}

	let originalPath = req.path; // Since this value is changed automatically below
	req.url = unmapAllPaths(req.url, /^[^?]+/g);

	// Not sure if this is necessary
	delete req.headers.host;

	let inspirRes = await axios({
		method: req.method,
		url: `https://www.inspir.dk${req.url}`,
		headers: req.headers,
		params: req.query,
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
		// Hardcoded - whatever
		if (req.path == "/user/logout") {
			redirectUrl = "/?type=new";
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


server.listen(8000, "127.0.0.1", () => {
	console.log("Ready");
});