const { Module } = require("../modules.js");
const mdl = module.exports = new Module();


const axios = require("axios");

mdl.route("GET", "/pfp/:uuid.png", async (database, req, res) => {
	let imgUrl = `https://inspir.dk/uploads/user/${req.params.uuid}/avatar-${req.params.uuid}.png`;

	// probably a much better way to do this
	let imgCheck = await axios.get(imgUrl, {validateStatus: () => true});
	res.redirect(imgCheck.status == 200 ? imgUrl : "/custom/img/no_pfp.png");
});

mdl.hook("GET", "/artikel/:articleId", async (database, req, $) => {
	let pfp = $(".authorImage img");
	if (pfp.length == 0) {
		$(".authorDisName").removeAttr("style").before(
			`<div class="authorImage"><img src="/custom/img/no_pfp.png"></div>`
		);
		return;
	}

	let pfpUuid = pfp.attr("src").match(/\/user\/([^\/]+)/)[1];
	pfp.attr("src", `/pfp/${pfpUuid}.png`);
});