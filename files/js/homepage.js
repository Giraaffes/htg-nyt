$("title").text("HTG-NYT");
$(".message-head button, .message-body p:eq(1)").remove();

$("#home-content .row:eq(0) a").attr("href", "/");

if ($("body").css("background-color") == "rgb(70, 110, 100)") {
	$("body").css("background-color", "#f0ece4");
	$("#wrapper").attr("style", $("#wrapper").attr("style") + " background-color: #ffffff !important;");
}

$("#home-content").before("<h1 class=\"header\">Skolebladet HTG-NYT</h1>");