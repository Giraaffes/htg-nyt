$("input[name=\"query\"]").attr("placeholder", "E-MAIL")
$("input[name=\"password\"]").attr("placeholder", "Password");
$("input[type=\"submit\"]").val("LOG IND");

$(".check-toolbar:contains(Opret dig her), #findMagazine").remove();

$(() => {
	let url_ = new URL(location);
	if (url_.searchParams.has("incorrect")) {
		$.notify("Forkert login", {position: "top center"})

		url_.searchParams.delete("incorrect")
		let newParamsStr = decodeURIComponent(url_.searchParams.toString());
		if (newParamsStr) newParamsStr = "?" + newParamsStr;
		window.history.replaceState(null, null, `/login${newParamsStr}`);
	}
});