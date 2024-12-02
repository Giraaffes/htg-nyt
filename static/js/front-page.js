// SECTION Categories

// (R) General
$(".magazine-image img").attr("src", "/custom/img/banner.png");

let banner = $(".magazine-image");
banner.append(
	$(`<div class="a-container"><a href="/"></a></div>`)
);

$("#filterList button").unwrap().filter(
	(_, btn) => $(btn).data("value") == "folk" || !categories.find(ctg => ctg.oldName == $(btn).data("value"))
).remove();

let params = new URLSearchParams(location.search);
let isGeneralCtg = !categories.some(ctg => ctg.name == params.get("type"));
if (isGeneralCtg) {
	$("body").addClass("general-page");
	$("#filterList button").removeClass("active");
	$("#dynamic-filters button").remove();
}

let activeCtgInfo = isGeneralCtg ? {} : categories.find(ctg => 
	ctg.oldName == $("#filterList button.active").data("value")
);
let activeCtgName = activeCtgInfo.name;

$(".headline-content h1").text(activeCtgInfo.title || "Seneste nyt");
$("title").text(activeCtgInfo.nav ? `${activeCtgInfo.nav} | HTG-NYT` : "HTG-NYT");

let activeColorName = $("#mediaContainer > div:first").attr("class").slice(0, -6);
$(`.${activeColorName}-color`).removeClass(`${activeColorName}-color`).addClass(`${activeCtgInfo.color || "green"}-color`);
$(`#${activeColorName}-headline`).attr("id", `${activeCtgInfo.color || "green"}-headline`);


// (R) CHRISTMAS

//$(".top-box h3").text("🎅 HTG-NYT 🤶");

//$(`.${activeColorName}-color`).removeClass(`${activeColorName}-color`).addClass(`${activeCtgInfo.color || "christmas"}-color`);
//$(`#${activeColorName}-headline`).attr("id", `${activeCtgInfo.color || "christmas"}-headline`);


// (R) Navs
function faIcon(iconName) {
	return `<i class=\"fas fa-${iconName}\" aria-hidden=\"true\"></i>`;
}

$("#filterList button").each((_, btn) => {
	let ctg = categories.find(ctg => 
		ctg.oldName == $(btn).data("value")
	);

	$(btn).contents().remove();
	let ctgA = $("<a></a>").appendTo($(btn));
	ctgA.attr("href", `/?type=${ctg.name}`);
	ctgA.attr("draggable", "false");

	ctgA.append(faIcon(ctg.icon));
	if (!$(btn).is(".active")) ctgA.append(`<span>${ctg.nav}</span>`);
});

$(() => {
	$("#filterList button").off();
});

// (R) Colors
function overlayOn(colorStr, bgrStr) {
	let [ r1, g1, b1, a ] = colorStr.match(/[\d\.]+/g);
	a = parseFloat(a);

	let [ r2, g2, b2 ] = bgrStr.match(/[\d\.]+/g);

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

// (R) Nav dividers
$("#filterList button:not(:last)").each((_, btn) => {
	let div = $("<div></div>").addClass("categories-divider").insertAfter($(btn));
	if ($(btn).is(".active") || $(btn).nextAll("button:first").is(".active")) {
		div.addClass("active").css("background-color", activeCtgColor);
	}
});

// (_) Mezzio fix 21/3/24
$("#region-container").remove();

// !SECTION
// SECTION Tags

// (O) Filter buttons
if ($("#dynamic-filters button").length > 0) {
	$("#dynamic-filters > div:first").contents().appendTo("#dynamic-filters");
	$("#dynamic-filters > div").remove();
	$("#dynamic-filters").prepend("<span id=\"filters-text\">Vælg tags:</span>");
} else {
	$("#dynamic-filters").remove();
}

// (O) Custom tags
$("#dynamic-filters button, .article-listing .grey-box").each((_, filterOrTag) => {
	let name = $(filterOrTag).text().trim().toLowerCase();
	let tag = tags.find(tag => tag.oldName == name);
	if (tag) {
		$(filterOrTag).text(tag.name);
	} else {
		$(filterOrTag).remove();
	}
});

// (O) Remove (excuse my language, but) those random-ass tags
$("#dynamic-filters button").each((_, filterBtn) => {
	let tag = $(filterBtn).text().toLowerCase().trim();
	let tagsInArticles = $(".article-listing .grey-box").filter((_, articleTag) => {
		let articleTagName = $(articleTag).text().toLowerCase().trim();
		return articleTagName == tag;
	});
	if (tagsInArticles.length == 0) filterBtn.remove();
});

// (O) Better functionality
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

// (O) Sort tags alphabetically
function sortAlphabetically(elements) {
	elements.toArray().sort((e1, e2) => 
		$(e1).text().trim() > $(e2).text().trim() ? 1 : -1
	).forEach(e => $(e).appendTo($(e).parent()));
}

sortAlphabetically($("#dynamic-filters button"));
$("div:has(> .grey-box)").each((_, tagsDiv) => {
	sortAlphabetically($(tagsDiv).find(".grey-box"));
});

// !SECTION
// SECTION Articles

// (Y) General fixes
if (activeCtgName == "nyt" || activeCtgName == "fagligt") {
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

if (activeCtgName == "aktiviteter") {
	$(".article-listing .article-tags").css({"bottom": "unset", "top": "4pt", "right": "8pt"});
}

// (Y) Add backTo to href's
if (!isGeneralCtg) {
	$(".article-anchor").each((_, a) => {
		$(a).attr("href", $(a).attr("href") + "?backToCategory=" + activeCtgName);
	});
}

// (Y) No articles found text
if ($(".article-listing").length == 0) {
	$(".headline-content").parent().append("<span id=\"no-articles\">Der er ingen artikler her (endnu?)</span>")
}

// (Y) Remove global articles
$(".article-anchor").each((_, a) => {
	let isLocal = $(a).attr("href").startsWith("/artikel/");
	if (!isLocal) $(a).closest(".article-listing").remove();
});

// (Y) Remove past activites
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

// (Y) Allow HTML in subheadings
$(".article-headline, .folk-article-headline").next("p").each((_, e) => {
	$(e).html($(e).text());
});

// !SECTION


// (G) Activites notice
if (activeCtgName == "aktiviteter") {
	$(".headline-content").append(
		$("<div></div>").append(
			$("<h1></h1>").html(`Bemærk! ${faIcon("hand-pointer")}`).addClass("activities-notice")
		).addClass("custom-tooltip up").attr("data-msg", "Dobbeltjek altid datoer på Lectio eller på htg.dk!")
	);
}

// (G) Announcement
if (ANNOUNCEMENT) {
	$(`<h3 class="announcement"></h3>`).html(ANNOUNCEMENT).insertBefore(".top-box");
}

// (G) Top background
let bgrTop = $("<div></div>").addClass("bgr-top").prependTo("body");
if (ANNOUNCEMENT) {
	bgrTop.css("background-color", "black");
} else {
	bgrTop.addClass(`${activeCtgInfo.color}-color`);
}