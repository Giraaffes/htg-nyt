// Categories
$("#filterList button").unwrap()
	.filter((_, ctg) => !($(ctg).data("value") in categoryChanges)).remove();

let activeCtgName = $("#filterList button.active").data("value");
let activeCtgChanges = categoryChanges[activeCtgName];
activeCtgName = activeCtgChanges.name;

$(".headline-content h1").text(activeCtgChanges.title);
$("title").text(`${activeCtgChanges.nav} | HTG-NYT`);

let activeColorName = $("#mediaContainer > div:first").attr("class").slice(0, -6);
$(`.${activeColorName}-color`).removeClass(`${activeColorName}-color`).addClass(`${activeCtgChanges.color}-color`);
$(`#${activeColorName}-headline`).attr("id", `${activeCtgChanges.color}-headline`);

// Navs
function faIcon(iconName) {
	return `<i class=\"fas fa-${iconName}\" aria-hidden=\"true\"></i>`;
}

$("#filterList button").each((_, ctg) => {
	let ctgName = $(ctg).data("value");
	let changes = categoryChanges[ctgName];

	$(ctg).contents().remove();
	let ctgA = $("<a></a>").appendTo($(ctg));
	ctgA.attr("href", changes.name == "nyt" ? "/" : `/?type=${changes.name}`);
	ctgA.attr("draggable", "false");

	ctgA.append(faIcon(changes.icon));
	if (!$(ctg).is(".active")) ctgA.append(`<span>${changes.nav}</span>`);
});

$(() => {
	$("#filterList button").off();
});

// Colors
function overlayOnWhite(rgbaStr) {
	let [ r, g, b, a ] = rgbaStr.match(/[\d\.]+/g);
	a = parseFloat(a);

	// Lerp r, g, b and white by alpha
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

// Nav dividers
$("#filterList button").each((_, ctg) => {
	let div = $("<div></div>").addClass("categories-divider").insertAfter($(ctg));
	if ($(ctg).is(".active") || $(ctg).nextAll("button:first").is(".active")) {
		div.addClass("active").css("background-color", activeColor);
	}
});


// Tag filters
if ($("#dynamic-filters button").length > 0) {
	$("#dynamic-filters > div:first").contents().appendTo("#dynamic-filters");
	$("#dynamic-filters > div").remove();
	$("#dynamic-filters").prepend("<span id=\"filters-text\">Filtre:</span>");
} else {
	$("#dynamic-filters").remove();
}

// Custom tags
$("#dynamic-filters button, .article-listing .grey-box").each((_, filterOrTag) => {
	let name = $(filterOrTag).text().trim().toLowerCase();
	if (!keepTags.includes(name) && !tagChanges[name]) $(filterOrTag).remove();
	name = tagChanges[name] || name;
	$(filterOrTag).text(name);
});

// Remove (excuse my language but) those random ass tags
$("#dynamic-filters button").each((_, filterBtn) => {
	let tag = $(filterBtn).text().toLowerCase().trim();
	let tagsInArticles = $(".article-listing .grey-box").filter((_, articleTag) => {
		let articleTagName = $(articleTag).text().toLowerCase().trim();
		return articleTagName == tag;
	});
	if (tagsInArticles.length == 0) filterBtn.remove();
});

// Functionality
$(() => {
	$("#dynamic-filters button").off().on("click", e => {
		let filterBtn = $(e.currentTarget);
		if (filterBtn.is(".active")) {
			filterBtn.removeClass("active");
			$(".article-listing").removeClass("hidden");
		} else {
			$("#dynamic-filters button.active").removeClass("active");
			filterBtn.addClass("active");

			let tagName = filterBtn.text().toLowerCase().trim();
			$(".article-listing").addClass("hidden");
			$(".article-listing").filter((_, article) => 
				$(article).find(".grey-box").filter((_, articleTag) => 
					$(articleTag).text().toLowerCase().trim() == tagName
				).length > 0
			).removeClass("hidden");
		}
	});
});

// Sort tags
function sortAlphabetically(elements) {
	elements.toArray().sort((e1, e2) => 
		$(e1).text().trim() > $(e2).text().trim() ? 1 : -1
	).forEach(e => $(e).appendTo($(e).parent()));
}

sortAlphabetically($("#dynamic-filters button"));
$("div:has(> .grey-box)").each((_, tagsDiv) => {
	sortAlphabetically($(tagsDiv).find(".grey-box"));
});

// Articles
if (activeCtgName != "nyt") {
	$(".article-anchor").each((_, a) => {
		$(a).attr("href", $(a).attr("href") + "?backToCategory=" + activeCtgName);
	});
}

if ($(".article-listing").length == 0) {
	$(".headline-content").parent().append("<span id=\"no-articles\">Der er ingen artikler her (endnu?)</span>")
}

if (activeCtgName == "nyt" || activeCtgName == "lærerigt") {
	$(".article-listing").each((_, article) => {
		$(article).find(".article-tags").appendTo($(article).find(".article-container > div:eq(0)"));
	});
}

$(".article-listing").each((_, article) => {
	let title = $(article).find("h5");
	title.text(title.text().replaceAll("⧸", "/"));
	
	let anchor = $(article).find("a");
	anchor.attr("href", anchor.attr("href").replaceAll(/%e2%a7%b8/gi, "%2F"));
});

// Remove global articles
$(".article-anchor").each((_, a) => {
	let isLocal = $(a).attr("href").startsWith("/artikel/");
	if (!isLocal) $(a).closest(".article-listing").remove();
});