let url = new URL(location);
if (url.searchParams.has("backTo")) {
	url.searchParams.delete("backTo");
	location.replace(url);
}

$("input[name=\"query\"]").attr("placeholder", "E-MAIL");
$("input[type=\"submit\"]").val("LOG IND"); 