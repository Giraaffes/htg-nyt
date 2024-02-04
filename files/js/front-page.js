// Categories
// categoryChanges from general.js
$("#filterList button").unwrap()
	.filter((_, ctg) => !($(ctg).data("value") in categoryChanges)).remove();

let activeCtgName = $("#filterList button.active").data("value");
let activeCtgChanges = categoryChanges[activeCtgName];
$(".headline-content h1").text(activeCtgChanges.title);

let activeColorName = $("#mediaContainer > div:first").attr("class").slice(0, -6);
$(`.${activeColorName}-color`).removeClass(`${activeColorName}-color`).addClass(`${activeCtgChanges.color}-color`);
$(`#${activeColorName}-headline`).attr("id", `${activeCtgChanges.color}-headline`);

$("#filterList button").each((_, ctg) => {
	let ctgName = $(ctg).data("value");
	let changes = categoryChanges[ctgName];

	$(ctg).data("value", changes.name);
	$(ctg).find("i").removeClass().addClass("fas").addClass(`fa-${changes.icon}`);
	if (!$(ctg).is(".active")) $(ctg).append(`<span>${changes.nav}</span>`);
});
activeCtgName = $("#filterList button.active").data("value");




// Fix category colors
function overlayOnWhite(rgbaStr) {
	let [ r, g, b, a ] = rgbaStr.match(/[\d\.]+/g);
	a = parseFloat(a);

	r = Math.floor(r * a + 255 * (1 - a));
	g = Math.floor(g * a + 255 * (1 - a));
	b = Math.floor(b * a + 255 * (1 - a));

	return `rgb(${r}, ${g}, ${b})`;
}

let bgrColor = $("#mediaContainer > div:first").css("background-color");
$("#filterList button:not(.active)").css("background-color", bgrColor);

let activeColor = $(".headline-content").css("background-color");
activeColor = overlayOnWhite(activeColor);
$(".headline-content, #filterList button.active").css("background-color", activeColor);


// Category buttons
let url_ = new URL(location);
$(() => {
	$("#filterList button").each((_, btn) => {
		$(btn).off();
		if ($(btn).is(".active")) return;

		$(btn).on("click", e => {
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


// Remove global articles and random tagslet url_ = new URL(location);
$(".article-anchor").each((_, a) => {
	let globalMatch = $(a).attr("href").match(/_\w{6}$/);
	if (globalMatch) $(a).closest(".article-listing").remove();
});

/*if (activeCtgName == "meeting" && $(".grey-box:contains(Miljø)").length == 0) {
	$("#dynamic-filters button:contains(MILJØ)").remove();
} else */if (activeCtgName == "sjovt" && $(".grey-box:contains(NZG)").length == 0) {
	$("#dynamic-filters button:contains(NZG)").remove();
} else if (activeCtgName == "lærerigt" && $(".grey-box:contains(Førstegangsvælger)").length == 0) {
	$("#dynamic-filters button:contains(FØRSTEGANGSVÆLGER)").remove();
}


// Tag filters
if ($("#dynamic-filters button").length > 0) {
	$("#dynamic-filters > div:first").contents().appendTo("#dynamic-filters");
	$("#dynamic-filters > div").remove();
	$("#dynamic-filters").prepend("<span id=\"filters-text\">Filtre:</span>");
} else {
	$("#dynamic-filters").remove();
}

// Disabled because it breaks when actually clicking the tags
/*$("#dynamic-filters button").each((_, tagBtn) => {
	let tagName = $(tagBtn).text().toLowerCase().trim();
	let articleTags = $(".article-listing .grey-box").filter((_, tag) => {
		let articleTagName = $(tag).text().toLowerCase().trim();
		return articleTagName == tagName;
	});
	if (articleTags.length == 0) tagBtn.remove();
});*/


// Articles
if (activeCtgName != "nyt") {
	$(".article-anchor").each((_, a) => {
		$(a).attr("href", $(a).attr("href") + "?backToCategory=" + activeCtgName);
	});
}

if ($(".article-listing").length == 0) {
	$(".headline-content").after("<span id=\"no-articles\">Der er ingen artikler her endnu!</span>")
}