const pageUuid = window.location.pathname.match(/[\w-]+$/)[0];


// (_) General functions
function faIcon(iconName) {
	return `<i class=\"fas fa-${iconName}\" aria-hidden=\"true\"></i>`;
}

function addButton(html, clickCallback) {
	return $("<button></button>").html(html).on("click", event => {
		// Prevent page refreshing
		event.preventDefault();
		if (clickCallback) clickCallback(event);
	}).addClass("custom-button");
}
function addCheckField(type, html, name, value, id) {
	let input = $(`<input type="${type}" name="${name}" value="${value}" id=${id}>`).addClass("custom-input").hide();
	let field = $(`<label for="${id}">${html}</label>`).addClass("custom-field");
	return $([input[0], field[0]]);
}

function addTextInput(type, placeholder, name) {
	return $(`<input type="${type}" placeholder="${placeholder}" name="${name}">`);
}

// https://stackoverflow.com/a/19033868
function swap(a, b) {
	var temp = $('<span>').hide();
	a.before(temp);
	b.before(a);
	temp.replaceWith(b);
};

// Jesus... 
// Inspiratorium most likely messed up with their uuid1 code when converting them all
// (or they decided to make their own new quirky format (or I might be mising something))
// Either way, they swapped it like this:
//  aaaabbbb-cccc-dddd-xxxx-xxxxxxxxxxxx -> ddddcccc-aaaa-bbbb-xxxx-xxxxxxxxxxxx
// Meaning that to go back it's:
//  aaaabbbb-cccc-dddd-xxxx-xxxxxxxxxxxx -> ccccdddd-bbbb-aaaa-xxxx-xxxxxxxxxxxx
// Although this doesn't matter on articles that are created after the change, since they started just using uuid4 instead
function correctInspirUuid(uuid) {
	let chunks = uuid.match(/\w{4}/g);
	return `${chunks[2]}${chunks[3]}-${chunks[1]}-${chunks[0]}-${chunks[4]}-${chunks[5]}${chunks[6]}${chunks[7]}`;
}

// https://stackoverflow.com/a/26915856
function getUuid1Date(uuid) {
	uuid = correctInspirUuid(uuid); // special case

	let splitUuid = uuid.split("-");
	let time = parseInt(`${splitUuid[2].slice(1)}${splitUuid[1]}${splitUuid[0]}`, 16);
	var timeMillis = Math.floor((time - 122192928000000000) / 10000);
	return new Date(timeMillis);
};

function correctTimezone(date) {
	date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
	return date;
}


// (R) Saving
const autoSaveInterval = 20 * 1000;
const maxFailedAttempts = 3;

let lastTitle = $("input#title").val();

let doNotSave = false;
let waitSavingPromise;
async function saveArticle(useBeacon, silentSuccess) {
	if (waitSavingPromise) await waitSavingPromise;

	let formData = new FormData($("#magazines-articles-form")[0]);

	// This is weird... 
	// So if the case of any letters in the title are changed, 
	// the article won't save due to "an article with this name already existing"
	let title = formData.get("title");
	if ( 
		lastTitle && title != lastTitle &&
		title.toLowerCase() == lastTitle.toLowerCase()
	) {
		formData.set("title", lastTitle);
	}
	lastTitle = title;

	formData.set("title", formData.get("title").replaceAll("/", "⧸"));
	formData.set("journalistName", $("label[for=with-author]").text());

	if (useBeacon) {
		navigator.sendBeacon(window.location.href, formData);
		return;
	}

	let res;
	try {
		res = await fetch(window.location.href, {
			method: "POST",
			body: formData
		});
	} catch (reqError) {
		$.notify(`Kunne ikke gemme pga. følgende fejl: "${reqError.message}"\nGem evt. dine ændringer midlertidigt et andet sted og prøv at genstarte siden :/`, "error");
		return false;
	}

	if (res.url.includes("/login")) {
		window.location = res.url;
		return false;
	}

	let body = await res.text();
	let errorMsg = $(body).find(".alert-danger").text().trim();
	if (errorMsg) {
		$.notify(`Kunne ikke gemme pga. følgende fejl: "${errorMsg}"\nIntet kan gemmes indtil denne fejl er fikset (sorry)`);
		return false;
	} else if (body == "Duplicate name") {
		$.notify("Der findes allerede en artikel med dette navn.\nIntet kan gemmes indtil navnet er ændret (sorry)");
		return false;
	} else if (res.status >= 400) {
		$.notify("Artiklen kunne ikke gemmes pga. en ukendt fejl :/\nGem evt. dine ændringer midlertidigt et andet sted og prøv at genstarte siden :/", "error");
		return false;
	} else {
		if (!silentSuccess) $.notify("Artikel gemt!", "success");
		return true;
	}
}

// I'm not sure if this breaks anything :( - it's to prevent saving twice on pc (once for each event)
let alreadySavedOnClose = false;
$(window).on("beforeunload pagehide", (e) => {
	if (!doNotSave && !alreadySavedOnClose) {
		alreadySavedOnClose = true;
		saveArticle(true);
	}
});

let failedAttempts = 0;
$(() => {
	setInterval(async () => {
		if (doNotSave) return;

		let success = await saveArticle(false, true)
		if (success) {
			failedAttempts = 0;
		} else {
			failedAttempts++;
		}
		if (failedAttempts >= maxFailedAttempts) {
			location.reload();
		}
	}, autoSaveInterval);

	// This is to set the publication date immediately after creating a new article
	if ($("#form-inputs .form-data").length == 0) saveArticle(false, true);
});

$(document).on("keydown", e => {
	if (e.ctrlKey && e.key == "s") {
		e.preventDefault();
		saveArticle();
	}
});


// (O) Nav menu
let skolebladNav = $(".sidebar .nav-item:first");
skolebladNav.html(skolebladNav.html().replace("htg-nyt", "forside"));
skolebladNav.find(".nav-link").attr("href", "/");

let backNav = skolebladNav.clone().insertBefore(skolebladNav);
backNav.html(backNav.html().replace("forside", "Gem og luk"));
backNav.find("i").removeClass("fa-newspaper").addClass("fa-circle-left");
backNav.find(".nav-link").attr("href", "/redaktør");

let logoutNav = $(".sidebar .nav-item:last .nav-link").html(
	"<i class=\"fas fa-right-from-bracket\" aria-hidden=\"true\"></i>Log ud"
);


// (O) Editor general
$(".alert, .content-buttons").remove();

$("#title").val($("#title").val().replaceAll("⧸", "/"));
$("#title").on("keyup change clear", () => {
	$("title").text(`Rediger "${$("#title").val() || "[Unavngivet]"}"`);
}).trigger("change");

// Prevent page refreshing
$("#magazines-articles-form").on("click", event => {
	event.stopPropagation();
});


// SECTION - Top section
let leftTopDiv = $("#hideable-menu > div:eq(0)");
let middleTopDiv = $("#hideable-menu > div:eq(1)");
let actionButtonsDiv = $("<div></div>").addClass("action-buttons").appendTo("#hideable-menu");

$("#hideable-menu > div").removeAttr("style").css("width", i => 
	(["40%", "18rem", "12rem"])[i]
);
$("#hideable-menu").show();


// (Y) Categories
$(".form-data:has(#static-filters)").remove();
$("#date-input").before(
	$(`<div class="form-data"><h5>Placering</h5></div>`).append(
		`<div id="static-filters" class="check-toolbar"></div>`
	)
);

for (let ctg of categories) {
	let ctgRadio = addCheckField("radio",
		ctg.nav, "type", ctg.uuid, ctg.name
	);

	// I have to do it after load for some reason
	$(() => {
		let label = ctgRadio.eq(1);
		label.html(`${faIcon(ctg.icon)}&nbsp;&nbsp;${label.html()}`)
	});

	if (ctg.uuid == CATEGORY_UUID) ctgRadio.prop("checked", true);
	$(ctgRadio).appendTo("#static-filters");
}

let notPublicCtg = addCheckField("radio",
	"Ikke offentlig", "type", "11edf97d-3547-84a2-a06d-19a686eff9ad", "none"
);
notPublicCtg.appendTo("#static-filters");
if ($("#static-filters").find("> :checked").length != 1) {
	//console.log("doin it");
	notPublicCtg.prop("checked", true);
}

// Also must be done after ready for some reason
$(() => {
	$("#static-filters input").on("change", async e => {
		let label = $(e.target).next();
		
		// Calendar fix
		if ($(label).attr("for") == "aktiviteter") {
			$("#date-input").show();
		} else {
			$("#date-input").hide();
		}

		let success = await saveArticle(false, true);
		if (success) {
			if ($(label).attr("for") == "none") {
				$.notify(`Artiklen er ikke længere offentlig`, "success");
			} else {
				$.notify(`Artikel udgivet under "${$(label).text().trim()}"`, "success");
			}
		}
	});
});


// (Y) Tags
$(".form-data:has(#dynamic-filters)").remove();
$("#date-input").after(
	$(`<div class="form-data"><h5>Tags (vælg maks. 2)</h5></div>`).append(
		`<div id="dynamic-filters" class="check-toolbar"></div>`
	)
);

let tagsSorted = tags.sort((a, b) => a.name > b.name ? 1 : -1);
for (let tag of tagsSorted) {
	let tagId = "tag_" + tag.name.toLowerCase().replaceAll(/\s+/g, "_");
	let tagCheckbox = addCheckField("checkbox",
		tag.name, "tags[]", tag.uuid, tagId
	);

	// Have to figure out some way to do this (future me: what do you mean...?)
	if (ACTIVE_TAGS.includes(tag.uuid)) tagCheckbox.prop("checked", true);
	tagCheckbox.appendTo("#dynamic-filters");
}
$("<div></div>").css({"flex": "auto"}).appendTo("#dynamic-filters");

// Prevent page refreshing
$(() => {
	$("#dynamic-filters input").off();
})


// (G) Visibility buttons
//let isArticleVisible;

//let visibilityDiv = $("<div></div>").addClass("form-data");
//visibilityDiv.appendTo(middleTopDiv).append("<h5>Synlighed</h5>");

//let visibilitySelectDiv = $("<div></div>").addClass("custom-select-div check-toolbar");
//visibilitySelectDiv.appendTo(visibilityDiv);

//addCheckField("radio", "Offentlig", "status", "active", "offentlig").appendTo(visibilitySelectDiv);
//addCheckField("radio", "Ikke offentlig", "status", "inactive", "ikke-offentlig").appendTo(visibilitySelectDiv);

//visibilitySelectDiv.find("input").eq(IS_PUBLIC ? 0 : 1).prop("checked", true);
//if (IS_PUBLIC) $("#magazines-articles-form").addClass("public");;

// This is a better way of handling an event for multiple elements - I will do this in the future
//visibilitySelectDiv.find("input").on("change", async e => {
//	let input = $(e.currentTarget);
//	if (input.attr("value") == "active") {
//		$("#magazines-articles-form").addClass("public");
//	} else {
//		$("#magazines-articles-form").removeClass("public");
//	}

//	let success = await saveArticle(false, true);
//	if (success) {
//		$.notify(`Artikel sat til "${input.next().text()}"`, "success");
//	}
//});


// (G) Author buttons
let authorDiv = $("<div></div>").addClass("form-data");
authorDiv.appendTo(middleTopDiv).append("<h5>Skribent</h5>");

let authorSelectDiv = $("<div></div>").addClass("custom-select-div check-toolbar");
authorSelectDiv.appendTo(authorDiv);

let authorName = $("#fixed-menu h5:eq(1)").text();
addCheckField("radio", authorName, "withoutAuthor", "false", "with-author").appendTo(authorSelectDiv);
addCheckField("radio", "Anonym", "withoutAuthor", "true", "without-author").appendTo(authorSelectDiv);

let isAnonymous = $("#withoutAuthor").is(":checked");
authorSelectDiv.find("input").eq(isAnonymous ? 1 : 0).prop("checked", true);

authorSelectDiv.find("input").on("change", async e => {
	let success = await saveArticle(false, true);
	if (success) {
		$.notify($(e.target).index() == 0 ? "Artikel ikke længere anonym" : "Artikel sat til anonym", "success");
	}
});


// (G) Publication date	
let dateDiv = $("<div></div>").addClass("form-data");
dateDiv.appendTo(middleTopDiv).append("<h5>Udgivelsesdato</h5>");

let dateSelect = $(`<input type="datetime-local" name="publicationDate" class="article-input-style">`);
dateSelect.appendTo(dateDiv);

let publicationDate = PUBLICATION_DATE ? new Date(PUBLICATION_DATE) : (
	correctTimezone(USES_UUID4 ? new Date() : getUuid1Date(pageUuid))
);
dateSelect.val(publicationDate.toISOString().slice(0, 16));


// (C) Save, preview and view article buttons
let saveButton = addButton("Gem artikel", () => { saveArticle(); });
actionButtonsDiv.append(saveButton);	

//let previewButton = addButton("Forhåndsvis artikel", () => {
//		window.open(`/forhåndsvis-artikel/${pageUuid}`, "_blank");
//});
//actionButtonsDiv.append(previewButton);

let viewArticleButton = addButton("Læs artikel", () => {
	window.open(`/artikel/${ARTICLE_ID || $("#title").val()}`, "_blank");
}).addClass("read-button");
actionButtonsDiv.append(viewArticleButton);

$("<p></p>").text(
	"(Husk at gemme før du læser artiklen igennem, så du kan se dine ændringer)"
).addClass("info-text").appendTo(actionButtonsDiv)


// (C) Fixed save button
let fixedSaveButton = addButton("Gem artikel (ctrl + S)", () => { saveArticle(); });
fixedSaveButton.appendTo(".main-container").addClass("fixed-save-button");
fixedSaveButton.data("xScrollVisible", 200);

$(document).on("scroll", () => {
	if (scrollY > parseInt(fixedSaveButton.data("xScrollVisible"))) {
		fixedSaveButton.css("opacity", "1");
	} else {
		fixedSaveButton.css("opacity", "0");
	}
}).trigger("scroll");


// (C) Delete button
const magazineUuid = $("#magazine-edition-uuid").val();
function deleteArticle() {
	if (!window.confirm(`Er du virkelig sikker på, at du vil slette denne artikel permanent?`)) return;

	let formData = new FormData();
	formData.append("uuid", pageUuid);
	fetch(`/admin/articles/delete-article/${magazineUuid}`, {
		method: "POST",
		body: formData,
	}).then(res => res.json()).then(data => {
		if (data.status == "success") {
			window.location.replace("/redaktør");
		} else {
			$.notify("Kunne ikke slette artikel", "error");
		}
	});
}

let deleteButton = addButton("Slet artikel", deleteArticle);
deleteButton.addClass("delete-button").appendTo(actionButtonsDiv);


// (_) Remove previous top section
$("#retningContainer, #niveauContainer").prependTo("#magazines-articles-form");
$("#withoutAuthor").remove();
$("#fixed-menu div:first input").prependTo("#magazines-articles-form").hide();
$("#status-active").prop("checked", true);
$("#fixed-menu").remove();
$("#widgets-container").remove();


// (_) Kantinen
let isKantinen = ($(".site-title").text() == "Kantinen På Htg");
if (isKantinen) {
	$(".site-title").text("Kantinen");

	$("input#kantinen").prop("checked", true);
	leftTopDiv.add(leftTopDiv.children()).hide(); // Children too bcuz of mobile

	authorDiv.find("input:eq(0)").prop("checked", true);
	authorDiv.hide(isKantinen);
};

// !SECTION


// (_) Reorder things a bit
let mainDiv = $("#magazines-articles-form > div:last");
mainDiv.find("> .form-data").slice(2, 4).prependTo(mainDiv);

// (_) Video fix
let video = $("#article-video-preview");
let iframe = video.find("iframe");
if (iframe.length == 1) {
		video.width(500).height(500 / 16 * 9);
		iframe.css("height", "unset");
}

// (_) Thumbnail fix
let thumbnailDiv = $("#magazines-articles-form > div:last .form-data:eq(3)");
thumbnailDiv.removeAttr("style");

let thumbnailImg = thumbnailDiv.find("#cropPreview");
thumbnailImg.removeAttr("style").removeAttr("name");
thumbnailImg.on("error", () => {
	thumbnailImg.remove();
});

// (_) Trim rubrik and underrubrik inputs (it doesn't save anything at all if either of them are over the respective character limits)
let rubrikInput = $("input#title");
rubrikInput.on("input", () => {
	rubrikInput.val(rubrikInput.val().slice(0, 60));
});

let underrubrikInput = $("input#subheadline");
underrubrikInput.on("input", () => {
	underrubrikInput.val(underrubrikInput.val().slice(0, 120));
});


// (B) Renaming
const renameHeaders = {
	"SEKTIONER": "Kategori",
	"Dynamic filters": "Tags (maks. 2)",
	"DATE": "Startdato",
	"END DATE": "Slutdato",
	"ADDRESS": "Adresse",
	"LOCATION": "Lokation",
	"RUBRIK": "Rubrik",
	"MANCHET": "Manchet",
	"VIDEO": "Video",
	"LISTE-ILL": "Billede",
	"SoMe": "Sociale medier",
	"Pic": "Billede",
	"Tekst": "Brødtekst"
}

const renamePlaceholders = {
	"Adresse": ["Adresse"],
	"Lokation": ["Lokation"],
	"Video": ["Link til video"],
	"Brødtekst": ["Brødtekst"],
	"Mellemrubrik": ["Mellemrubrik"],
	"Citat": ["Citat"],
	"Spørgsmål": [null, "Spørgsmålet, der stilles"],
	"Svar": ["Navn/titel på den, der svarer", "Svar på et spørgsmål"],
	"Link": ["Link", "Tekst til link"],
	"Sociale medier": ["Indsæt kopieret kode, som skal indlejres (dette kan man finde som valgmulighed på de fleste sociale medier)"]
}

function renameFormData(formData) {
	formData.find("h5").each((_, header) => {
		let headerText = $(header).text();
		let renameHeaderTo = renameHeaders[headerText];
		if (renameHeaderTo) {
			$(header).text(renameHeaderTo);
			headerText = renameHeaderTo;
		}

		let renamePlaceholdersEntry = renamePlaceholders[headerText];
		if (renamePlaceholdersEntry) {
			let inputs = $(header).siblings().find("input[type=text], textarea");
			inputs = inputs.add($(header).siblings("input[type=text], textarea"));
			inputs.each((i, input) => {
				if (renamePlaceholdersEntry[i]) $(input).attr("placeholder", renamePlaceholdersEntry[i]);
			});
		}
	});
}

$(".form-data").each((_, formData) => {
	renameFormData($(formData));
});

// (B) Crop image translations
$(".modal h5:contains(Crop the image)").text("Beskær billede");
$(".modal button:contains(Cancel)").text("Annuller");


// SECTION - Main section

// (M) Fixing article elements
function addElementButtons(element) {
	element.find(".content-span-container, #upArrow, #downArrow, #deleteContent").remove();

	let buttonsDiv = element.find(".element-buttons");

	let upButton = addButton(faIcon("arrow-up"), () => {
		if (addingElement) {
			$.notify("Vent venligst et øjeblik eller genindlæs siden...");
			return;
		}

		let prev = element.prevAll(".form-data:first");
		if (prev.length == 1) {
			swap(element, prev);
			upButton.trigger("mouseout");
		}
	}).appendTo(buttonsDiv);
	let downButton = addButton(faIcon("arrow-down"), () => {
		if (addingElement) {
			$.notify("Vent venligst et øjeblik eller genindlæs siden...");
			return;
		}

		let next = element.nextAll(".form-data:first");
		if (next.length == 1) {
				swap(element, next);
				downButton.trigger("mouseout");
		}
	}).appendTo(buttonsDiv);

	let deleteButton = addButton(faIcon("trash-can"), () => {
		if (addingElement) {
			$.notify("Vent venligst et øjeblik eller genindlæs siden...");
			return;
		}
		
		if (!window.confirm("Vil du virkelig slette dette element permanent?")) return;

		let elementUuid = element.find("input[name*=\"[uuid]\"]").val();
		let formData = new FormData();
		formData.append("uuid", elementUuid);
		fetch(`/admin/articles/remove-article-content/${pageUuid}`, {
			method: "POST",
			body: formData
		}).then(res => {
			if (res.ok) {
				$.notify("Element slettet", "success");

				element.next("div").remove();
				element.remove();
				if ($("#form-inputs .form-data").length == 0) {
					addNewElementButtons(true).prependTo("#form-inputs");
				}

				reindexElements();
			} else {
				$.notify("Element kunne ikke slettes - prøv at genindlæse siden", "error");
			}
		});
	});
	deleteButton.appendTo(buttonsDiv);
}

function fixEmbedElement(element) {
	let iFrame = element.find(".some-post");
	iFrame.remove();

	let input = element.find(".socialsInput");
	input.on("change", event => {
		event.stopPropagation();
	});
}

function fixAnswerElement(element) {
	let contentDiv = $(element).find(".element-content");

	let colorsDiv = element.find(".content-colors");
	if (colorsDiv.length == 1) {
		// Mezzio fix 11/2/24
		colorsDiv.find("input[type=text]").insertBefore(contentDiv.find("textarea"));
		colorsDiv.appendTo(contentDiv);
		return;
	}
	
	colorsDiv = $("<div></div>").addClass("content-colors article-input-style");
	colorsDiv.appendTo(contentDiv);
	$(`<span>
			<label style="background-color: #a0873266"></label>
			<input class="content-color-btn" style="accent-color: #a0873266;" type="checkbox" name="content[answer100][color]" value="#a0873266">
		</span>`).appendTo(colorsDiv);
	$(`<span>
			<label style="background-color: #96555566"></label>
			<input class="content-color-btn" style="accent-color: #96555566;" type="checkbox" name="content[answer100][color]" value="#96555566">
		</span>`).appendTo(colorsDiv);
	$(`<span>
			<label style="background-color: #145a7366"></label>
			<input class="content-color-btn" style="accent-color: #145a7366;" type="checkbox" name="content[answer100][color]" value="#145a7366">
		</span>`).appendTo(colorsDiv);
	$(`<span>
			<label style="background-color: #466e6466"></label>
			<input class="content-color-btn" style="accent-color: #466e6466;" type="checkbox" name="content[answer100][color]" value="#466e6466">
		</span>`).appendTo(colorsDiv);
	
	colorsDiv.find("input").each((_, clr) => {
		$(clr).on("change", () => {
			if ($(clr).is(":checked")) {
				colorsDiv.find("input").prop("checked", false);
				$(clr).prop("checked", true);
			}
		});
	});
}

// https://stackoverflow.com/a/18262927
function fixTextareas(element) {
	element.find("textarea").each((_, textarea) => {
		let initialHeight = $(textarea).height();
		$(textarea).on("input", () => {
			let initialTop = window.scrollY;

			$(textarea).height(5);
			let newHeight = Math.max($(textarea).prop('scrollHeight') - 10, initialHeight);
			$(textarea).height(newHeight);

			window.scrollTo({top: initialTop});
		});
		$(() => {
			$(textarea).trigger("input");
		});
	});
}

function fixArticleElement(element) {
	let originalContent = element.children();
	let wrapperDiv = $("<div></div>").addClass("element-wrapper");
	wrapperDiv.appendTo(element);
	
	let contentDiv = $("<div></div>").addClass("element-content");
	contentDiv.append(originalContent).appendTo(wrapperDiv);

	let buttonsDiv = $("<div></div>").addClass("element-buttons");
	buttonsDiv.prependTo(wrapperDiv);
	addElementButtons(element);

	let header = element.find("h5");
	if (header.prevAll().length > 0) {
		header.prependTo(contentDiv);
	}

	let headerText = header.text();
	if (headerText == "SoMe") {
		fixEmbedElement(element);
	} else if (headerText == "Svar") {
		fixAnswerElement(element);
	}

	element.find("p:contains(Spørger), p:contains(Svarer)").remove();
	element.find("img").removeAttr("name");

	fixTextareas(element);
}

$("#form-inputs .form-data").each((_, element) => {
	fixArticleElement($(element));
});


// (M) Adding new elements
const elementTypes = [
	{ text: "Brødtekst", name: "body" },
	{ text: "Mellemrubrik", name: "middle-heading" },
	{ text: "Billede", name: "illustration" },
	{ text: "Citat", name: "quote" },
	{ text: "Spørgsmål", name: "question" },
	{ text: "Svar", name: "answer" },
	{ text: "Afsluttende link", name: "link" },
	{ text: "Sociale medier", name: "socials" }
];

function waitForWindowFocus() {
	return new Promise((res, rej) => {
			$(window).on("focus", () => {
					setTimeout(res, 200);
					$(window).off("focus");
			});
	});
}

async function loadNewElement(element) {
	let inputs = element.find("input, textarea");
	inputs.each((_, input) => {
		let name = $(input).attr("name");
		if (name.match(/^content\[[^\]]+\]$/)) {
			$(input).attr("name", name + "[value]");
		}
	});
	
	let elementType = inputs.first().attr("name").match(/content\[([a-z\-]+)/)[1];
	let elementIndex = $("#form-inputs").children(":not(.new-element-buttons)").index(element) + 1;

	let res = await fetch(window.location.href)
	let html = await res.text();
	
	let formHtml = html.match(/<form[^\n]+id="magazines-articles-form".+?<\/form>/s)[0];
	let formData = new FormData($(formHtml)[0]);
	let uuidDataName = `content[${elementType}${elementIndex}][uuid]`;
	let uuid = formData.get(uuidDataName);
	element.append(`<input type="hidden" name="${uuidDataName}" value="${uuid}">`);
}

function reindexElements() {
	$("#form-inputs > :not(.new-element-buttons)").each((i, el) => {
		$(el).find("*[name^='content[']").each((_, input) => {
			let name = $(input).attr("name");
			$(input).attr("name", name.replace(/\d+/, i + 1));
		});
	});
}

function scrollToElement(element) {
	let bottomToElement = element.offset().top - ($(document).scrollTop() + $(window).height());
	if (bottomToElement > -200) {
		element[0].scrollIntoView({ block: "start", inline: "nearest", behavior: "smooth" });
	}
}

let addingElement = false;
function addNewElementButtons(removeOnAdd) {
	let wrapper = $("<div></div>").addClass("new-element-buttons");
	$("<span>Tilføj element her:&nbsp;&nbsp;</span>").appendTo(wrapper);

	for (let { text, name } of elementTypes) {
		let button = addButton(text, async () => {
			if (addingElement) {
				$.notify("Vent venligst et øjeblik eller genindlæs siden...");
				return;
			}

			addMagazineInput(name); // Built-in function
			let insertedElement = $("#form-inputs .form-data:last")
			insertedElement.removeAttr("id").insertAfter(wrapper);

			if (name == "illustration") {
				insertedElement.hide();

				let fileInput = insertedElement.find("input[type=\"file\"]");
				fileInput.trigger("click");

				await waitForWindowFocus();
				if (fileInput[0].files.length == 0) {
					insertedElement.remove();
				} else { // TODO do this for thumbnail too
					$.notify("Når denne kasse lukkes vil siden genindlæses efter få sekunder", {className: "info", autoHide: false});
					doNotSave = true;
				}
				return;
			}

			if (removeOnAdd) wrapper.remove();

			// that name lol
			let newNewElementButtons = addNewElementButtons().insertAfter(insertedElement); 
			fixArticleElement(insertedElement);
			renameFormData(insertedElement);
			setTimeout(scrollToElement.bind(null, insertedElement), 50);

			waitSavingPromise = (async () => {
				addingElement = true;
				doNotSave = true;
				let elementWasAdded = await saveArticle(false, true);
				if (elementWasAdded) {
					await loadNewElement(insertedElement);
					reindexElements();
				} else {
					insertedElement.remove();
					newNewElementButtons.remove();
					$.notify("Kunne ikke tilføje element", "error");
				}
				doNotSave = false;
				addingElement = false;

				waitSavingPromise = null;
			})();
		});
		wrapper.append(button);
	}
	return wrapper;
}

let elements = $("#form-inputs .form-data");
elements.each((_, element) => {
	$(element).find(".added-content-buttons").remove();
	$(element).after(addNewElementButtons(false));
});

if (elements.length == 0) {
	addNewElementButtons(true).appendTo("#form-inputs");
}

// !SECTION


// (_) Dividers
let divider = $("<hr></hr>").addClass("custom-divider");
divider.clone().insertAfter("#hideable-menu");
divider.clone().insertBefore("#form-inputs");

$("#dynamic-filters").closest(".form-data").css("margin-bottom", "0");


// (_) Other thing (idk)
$("div:has(> #form-inputs)").removeAttr("style");


// (P) Mobile fixes
// Ugh I can't be bothered to do this any better..
// https://stackoverflow.com/a/8876069
let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
if (vw <= 500) {
	$(".header-logo").show().css("width", "unset");
	$(".site-logo").remove();
	$(".site-title").css("vertical-align", "middle");

	$(".sidebar").css("width", "180px").css("margin-left", "-180px");
	$(".page-content").css("margin-left", "0");

	setTimeout(() => {
		$(".sidebar, .page-content").css("transition", "margin-left 0.5s ease-in-out");
	}, 100);

	let navOpen = false;
	let navButton = $(faIcon("bars")).css("padding", "15px 20px").prependTo(".site-title");
	navButton.on("click", () => {
		navOpen = !navOpen;
		if (navOpen) {
			$(".sidebar").css("margin-left", "0");
			$(".page-content").css("margin-left", "180px");
			navButton.removeClass("fa-bars").addClass("fa-xmark");
		} else {
			$(".sidebar").css("margin-left", "-180px");
			$(".page-content").css("margin-left", "0");
			navButton.removeClass("fa-xmark").addClass("fa-bars");
		}
	});

	$(".nav-item:first").html($(".nav-item:first").html().replace("Gem og luk", "Luk artikel"));
	$(".fixed-save-button").data("xScrollVisible", 1100).text("Gem artikel");

	$("#hideable-menu").css("flex-direction", "column");
	$("#hideable-menu > div").slice(isKantinen ? 1 : 0, 2).after(`<hr class="custom-divider">`);
	$("#hideable-menu > div > *").unwrap().css("margin-bottom", "15px");

	$("meta[name=viewport]").remove();
	$("head").append(`
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
	`);
}