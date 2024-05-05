const { injectVariables } = require('../util.js');
const Module = require("../modules.js").Module;
const mdl = module.exports = new Module();


// (R) Top message
mdl.hook("GET", "/", async (database, req, $) => {
	let { value: announcement } = (await database.query(
		`SELECT value FROM globals WHERE name = "announcement";`
	))[0];

	injectVariables($, {
		ANNOUNCEMENT: announcement
	});
});