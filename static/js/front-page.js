// Categories
$("#filterList button").unwrap().filter(
	(_, btn) => $(btn).data("value") == "folk" || !categories.find(ctg => ctg.oldName == $(btn).data("value"))
).remove();

let activeCtgInfo = categories.find(ctg => 
	ctg.oldName == $("#filterList button.active").data("value")
);
let activeCtgName = activeCtgInfo.name;

$(".headline-content h1").text(activeCtgInfo.title);
$("title").text(`${activeCtgInfo.nav} | HTG-NYT`);

let activeColorName = $("#mediaContainer > div:first").attr("class").slice(0, -6);
$(`.${activeColorName}-color`).removeClass(`${activeColorName}-color`).addClass(`${activeCtgInfo.color}-color`);
$(`#${activeColorName}-headline`).attr("id", `${activeCtgInfo.color}-headline`);

// Navs
function faIcon(iconName) {
	return `<i class=\"fas fa-${iconName}\" aria-hidden=\"true\"></i>`;
}

$("#filterList button").each((_, btn) => {
	let ctg = categories.find(ctg => 
		ctg.oldName == $(btn).data("value")
	);

	$(btn).contents().remove();
	let ctgA = $("<a></a>").appendTo($(btn));
	ctgA.attr("href", ctg.name == "nyt" ? "/" : `/?type=${ctg.name}`);
	ctgA.attr("draggable", "false");

	ctgA.append(faIcon(ctg.icon));
	if (!$(btn).is(".active")) ctgA.append(`<span>${ctg.nav}</span>`);
});

$(() => {
	$("#filterList button").off();
});

// Colors
function overlayOn(colorStr, bgrStr) {
	let [ r1, g1, b1, a ] = colorStr.match(/[\d\.]+/g);
	a = parseFloat(a);

	let [ r2, g2, b2 ] = bgrStr.match(/[\d\.]+/g);

	// Lerp (r, g, b) and white by alpha
	let r = Math.floor(r1 * a + r2 * (1 - a));
	let g = Math.floor(g1 * a + g2 * (1 - a));
	let b = Math.floor(b1 * a + b2 * (1 - a));

	return `rgb(${r}, ${g}, ${b})`;
}

let ctgColor = $("#mediaContainer > div:first").css("background-color");
$("#filterList button:not(.active)").css("background-color", ctgColor);

let opaqueCtgColor = $(".headline-content").css("background-color");
let activeCtgColor = overlayOn(opaqueCtgColor, "rgb(255, 255, 255)");
$(".headline-content, #filterList button.active").css("background-color", activeCtgColor);

let darkenedCtgColor = overlayOn(opaqueCtgColor, "rgb(0, 0, 0)");
$("#dynamic-filters button").css("border-color", darkenedCtgColor);

// Nav dividers
$("#filterList button:not(:last)").each((_, btn) => {
	let div = $("<div></div>").addClass("categories-divider").insertAfter($(btn));
	if ($(btn).is(".active") || $(btn).nextAll("button:first").is(".active")) {
		div.addClass("active").css("background-color", activeCtgColor);
	}
});

// Mezzio fix 21/3/24
$("#region-container").remove();


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
	let tag = tags.find(tag => tag.oldName == name);
	if (tag) {
		$(filterOrTag).text(tag.name);
	} else {
		$(filterOrTag).remove();
	}
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
	let title = $(article).find("h5:first");
	title.text(title.text().replaceAll("⧸", "/"));
	
	let anchor = $(article).find("a:first");
	anchor.attr("href", anchor.attr("href").replaceAll(/%e2%a7%b8/gi, "%2F"));

	$(article).find(".article-views").prepend(faIcon("eye") + " ");
});

$(".folk-article-section .article-text").each((_, toUnwrap) => {
	$(toUnwrap).children().unwrap();
});

// Remove global articles
$(".article-anchor").each((_, a) => {
	let isLocal = $(a).attr("href").startsWith("/artikel/");
	if (!isLocal) $(a).closest(".article-listing").remove();
});

// Remove past activites (broken, fix later)
if (activeCtgName == "aktiviteter") {
	$(".article-author").each((_, dateEl) => {
		let [ d, m, y ] = $(dateEl).text().match(/\d+/g);
		d = parseInt(d); m = parseInt(m) - 1; y = parseInt("20" + y);
		
		let nowDate = new Date(new Date().toDateString());
		let articleDate = new Date(y, m, d);
		if (nowDate > articleDate) {
			$(dateEl).closest(".article-listing").remove();
		}
	});
}


// Activites notice
if (activeCtgName == "aktiviteter") {
	$(".headline-content").append(
		$("<div></div>").append(
			$("<h1></h1>").html(`Bemærk! ${faIcon("hand-pointer")}`).addClass("activities-notice")
		).addClass("custom-tooltip up").attr("data-msg", "Dobbeltjek altid datoer på Lectio eller på htg.dk!")
	);
}


// Top background thing
// TODO fix
let bgrTop = $("<div></div>").addClass("bgr-top").css("background-color", "black");
$("body").prepend(bgrTop);


// Top message
$(".top-box").before(`
<h3 class="top-message">Husk at køb billetter til Galla snarest muligt, hvis du ved du kommer! 🎉<br>Læs programmet for galla og mere <a href="https://www.htgnyt.dk/artikel/htg_b66ee6f">her</a></h3>
`);