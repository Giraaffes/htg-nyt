const Module = require("../modules.js").Module;
const mdl = module.exports = new Module();


// (R) Login
const kantinenEmail = "nigen31637@picdv.com";
mdl.route("POST", "/login", (database, req, res, next) => {
	if (req.body.query.match(/^kantinen?$/i)) {
		req.body.query = kantinenEmail;
	}
	next();
});


// (O) Editor changes
// mdl.hook("GET", "/redaktør", (database, req, $) => {
// 	if (!$(".site-title").text() == "Kantinen På Htg") return;

// 	$(".site-title").text("Kantinen");
// });