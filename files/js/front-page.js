// Is automatically redirected by server but whatever - I'll keep it just in case
let url_ = new URL(location);
let category = url_.searchParams.get("type");
if (!category || category.length == 0) {
	url_.searchParams.set("type", "new");
	location.replace(url_);
}


$(() => {
	$("#filterList button.active").off();
});


const categoryChanges = {
	"new": {icon: "newspaper"},
	"faq": {icon: "face-laugh", title: "Alt det sjove"},
	"academy": {title: "Lærerige emner"},
	"hack": {title: "Tips & tricks"}
};

if (categoryChanges[category] && categoryChanges[category].title) {
	$(".headline-content h1").text(categoryChanges[category].title);
}

$("#filterList button").each((_, btn) => {
	let btnCategory = $(btn).data("value");
	if (categoryChanges[btnCategory] && categoryChanges[btnCategory].icon) {
		$(btn).find("i").removeClass().addClass("fas").addClass(`fa-${categoryChanges[btnCategory].icon}`);
	}
});


// Disabled because it it breaks when actually clicking the tags
/*$("#dynamic-filters button").each((_, tagBtn) => {
	let tagName = $(tagBtn).text().toLowerCase().trim();
	let articleTags = $(".article-listing .grey-box").filter((_, tag) => {
		let articleTagName = $(tag).text().toLowerCase().trim();
		return articleTagName == tagName;
	});
	if (articleTags.length == 0) tagBtn.remove();
});*/

$(".article-anchor").each((_, a) => {
	let globalMatch = $(a).attr("href").match(/_\w{6}$/);
	if (globalMatch) $(a).closest(".article-listing").remove();
});


if (category == "meeting" && $(".grey-box:contains(Miljø)").length == 0) {
	$("#dynamic-filters button:contains(MILJØ)").remove();
}


if ($("#dynamic-filters button").length > 0) {
	$("#dynamic-filters > div:first").contents().appendTo("#dynamic-filters");
	$("#dynamic-filters > div").remove();
	$("#dynamic-filters").prepend("<span id=\"filters-text\">Filtre:</span>");
} else {
	$("#dynamic-filters").remove();

	$(".headline-content").after("<span id=\"no-articles\">Der er ingen artikler her endnu!</span>")
}


$(".article-anchor").each((_, a) => {
	$(a).attr("href", $(a).attr("href") + "?backToCategory=" + category);
});