let url_ = new URL(location);
let category = url_.searchParams.get("type") || "new";


$(() => {
	$("#filterList button.active").off();
});


const remapCategoryIds = {
	"new": "nyt",
	"faq": "sjovt",
	"academy": "lærerigt",
	"meeting": "mødesteder",
	"calendar": "kalender"
};

$("#filterList button").each((_, btn) => {
	
});


const categoryChanges = {
	"new": {name: "nyt", icon: "newspaper"},
	"faq": {name: "sjovt", icon: "face-laugh", title: "Alt det sjove"},
	"academy": {name: "lærerigt", title: "Lærerige emner"},
	"hack": {title: "Tips & tricks"}, // delete later
	"meeting": {name: "mødesteder"},
	"calendar": {name: "kalender"}
};

let activeCategoryName = $("#filterList button.active").data("value");
let activeCategoryChanges = categoryChanges[activeCategoryName];
if (activeCategoryChanges && activeCategoryChanges.title) {
	$(".headline-content h1").text(activeCategoryChanges.title);
}

$("#filterList button").each((_, btn) => {
	let btnCategory = $(btn).data("value");
	let changes = categoryChanges[btnCategory];
	if (!changes) return;

	if (changes.name) $(btn).data("value", changes.name);
	if (changes.icon) {
		$(btn).find("i").removeClass().addClass("fas").addClass(`fa-${changes.icon}`);
	}
});


$(() => {
	$("#filterList button").each((_, btn) => {
		$(btn).off().on("click", e => {
			e.preventDefault();
		
			let ctg = $(btn).data("value");
			if (ctg == "nyt") {
				url_.searchParams.delete("type");
			} else {
				url_.searchParams.set("type", ctg);
			}
			location = url_;
		});
	});
});


// Disabled because it breaks when actually clicking the tags
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


if (category != "new") {
	$(".article-anchor").each((_, a) => {
		$(a).attr("href", $(a).attr("href") + "?backToCategory=" + category);
	});
}