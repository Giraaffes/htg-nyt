$("input[name=\"query\"]").attr("placeholder", "E-MAIL");
$("input[type=\"submit\"]").val("LOG IND");

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