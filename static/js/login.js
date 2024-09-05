$("title").text("Log ind | HTG-NYT");

$("input[name=\"query\"]").attr("placeholder", "E-mail eller lignende")
$("input[name=\"password\"]").attr("placeholder", "Password");
$("input[type=\"submit\"]").val("LOG IND");

$(".check-toolbar:contains(OPRET), #findMagazine, .row > div:first").remove();

$(".col-sm-12").prepend(
	`<h5 id="title">HTG-NYT</h5>`,
	`<img id="htg-img" src="/custom/img/banner.png">`
);

let url_ = new URL(location);
if (url_.searchParams.has("incorrect")) {
	$.notify("Forkert login", {position: "top center"})

	url_.searchParams.delete("incorrect")
	let newParamsStr = decodeURIComponent(url_.searchParams.toString());
	if (newParamsStr) newParamsStr = "?" + newParamsStr;
	window.history.replaceState(null, null, `/login${newParamsStr}`);
}