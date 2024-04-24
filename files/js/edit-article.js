const pageUuid = window.location.pathname.match(/[\w-]+$/)[0];


// Saving
const autoSaveInterval = 20 * 1000; //1 * 60 * 1000;
const maxFailedAttempts = 1; //3;

let doNotSave = false;
async function saveArticle(keepAlive, silent) {
	let formData = new FormData($("#magazines-articles-form")[0]);
	formData.set("title", formData.get("title").replaceAll("/", "⧸"));

	let res = await fetch(window.location.href, {
			method: "POST",
			body: formData,
			keepalive: keepAlive
	});
	let success = !res.url.includes("/login"); // Suppose the check here could be better, but how could there possibly be any problems?

	if (!silent) {
			if (success) {
					$.notify("Artikel gemt!", "success");
			} else {
					$.notify("Artiklen kunne ikke gemmes :/\nGem eventuelt dine ændringer midlertidigt et andet sted", "error");
			}
	}
	return success;
}

$(window).on("beforeunload", () => {
	if (doNotSave) return;

	saveArticle(true);
	const time = Date.now();
	while ((Date.now() - time) < 50) {}
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
});

$(document).on("keydown", e => {
	if (e.ctrlKey && e.key == "s") {
		e.preventDefault();
		saveArticle();
	}
});


// General functions
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


// Nav menu
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


// Editor general
$(".alert, .content-buttons").remove();

$("#title").val($("#title").val().replaceAll("⧸", "/"));
$("#title").on("keyup change clear", () => {
	$("title").text(`Rediger "${$("#title").val() || "[Unavngivet]"}"`);
}).trigger("change");

// Prevent page refreshing
$("#magazines-articles-form").on("click", event => {
	event.stopPropagation();
});


// Top section setup
let leftTopDiv = $("#hideable-menu > div:eq(0)");
let middleTopDiv = $("#hideable-menu > div:eq(1)");
let actionButtonsDiv = $("<div></div>").addClass("action-buttons").appendTo("#hideable-menu");

$("#hideable-menu > div").removeAttr("style").css("width", i => 
	(["40%", "18rem", "12rem"])[i]
);
$("#hideable-menu").show();


// Categories
$(".form-data:has(#static-filters)").remove();
$("#date-input").before(
	$(`<div class="form-data"><h5>Kategori</h5></div>`).append(
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

	// Have to figure out some way to do this
	if (ctg.uuid == CATEGORY_UUID) ctgRadio.prop("checked", true);
	$(ctgRadio).appendTo("#static-filters");
}

// Also must be done after ready for some reason
$(() => {
	$("#static-filters input").on("change", async e => {
		let label = $(e.target).next();
		
		// Calendar fix
		if ($(label).attr("for") == "aktiviteter") {
			console.log("shown");
			$("#date-input").show();
		} else {
			$("#date-input").hide();
		}

		let success = await saveArticle(false, true);
		if (success) {
			$.notify(`Kategori ændret til "${$(label).text().trim()}"`, "success");
		} else {
			$.notify("Artiklens kategori kunne ikke ændres", "error");
		}
	});
});


// Tags
$(".form-data:has(#dynamic-filters)").remove();
$("#date-input").after(
	$(`<div class="form-data"><h5>Tags (vælg maks. 2)</h5></div>`).append(
		`<div id="dynamic-filters" class="check-toolbar"></div>`
	)
);

for (let tag of tags) {
	let tagId = "tag_" + tag.name.toLowerCase();
	let tagCheckbox = addCheckField("checkbox",
		tag.name, "tags[]", tag.uuid, tagId
	);

	// Have to figure out some way to do this
	if (ACTIVE_TAGS.includes(tag.uuid)) tagCheckbox.prop("checked", true);
	tagCheckbox.appendTo("#dynamic-filters");
}
$("<div></div>").css({"flex": "auto"}).appendTo("#dynamic-filters");

// Prevent page refreshing
$(() => {
	$("#dynamic-filters input").off();
})


// Visibility buttons
let isArticleVisible;

let visibilityDiv = $("<div></div>").addClass("form-data");
visibilityDiv.appendTo(middleTopDiv).append("<h5>Synlighed</h5>");

let visibilitySelectDiv = $("<div></div>").addClass("custom-select-div check-toolbar");
visibilitySelectDiv.appendTo(visibilityDiv);

addCheckField("radio", "Offentlig", "status", "active", "offentlig").appendTo(visibilitySelectDiv);
addCheckField("radio", "Ikke offentlig", "status", "inactive", "ikke-offentlig").appendTo(visibilitySelectDiv);

visibilitySelectDiv.find("input").eq(IS_PUBLIC ? 0 : 1).prop("checked", true);
if (IS_PUBLIC) $("#magazines-articles-form").addClass("public");;

// This is a better way of handling an event for multiple elements - I will do this in the future
visibilitySelectDiv.find("input").on("change", async e => {
	let input = $(e.currentTarget);
	if (input.attr("value") == "active") {
		$("#magazines-articles-form").addClass("public");
	} else {
		$("#magazines-articles-form").removeClass("public");
	}

	let success = await saveArticle(false, true);
	if (success) {
		$.notify(`Artikel sat til "${input.next().text()}"`, "success");
	} else {
		$.notify("Artiklens synlighed kunne ikke ændres", "error");
	}
});


// Author buttons
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
	} else {
		$.notify("Artiklens skribent kunne ikke ændres", "error");
	}
});


// Publication date
let dateDiv = $("<div></div>").addClass("form-data");
dateDiv.appendTo(middleTopDiv).append("<h5>Udgivelsesdato</h5>");

let dateSelect = $(`<input type="datetime-local" name="publicationDate" class="article-input-style">`);
dateSelect.appendTo(dateDiv);

let publicationDate = PUBLICATION_DATE ? new Date(PUBLICATION_DATE) : getUuid1Date(pageUuid);
dateSelect.val(publicationDate.toISOString().slice(0, 16));


// Save, preview and view article buttons
let saveButton = addButton("Gem artikel", saveArticle);
actionButtonsDiv.append(saveButton);	

let previewButton = addButton("Forhåndsvis artikel", () => {
		window.open(`/forhåndsvis-artikel/${pageUuid}`, "_blank");
});
actionButtonsDiv.append(previewButton);

let viewArticleButton = addButton("Læs artikel", () => {
	if (!$("#magazines-articles-form").hasClass("public")) return;

	window.open(`/artikel/${ARTICLE_ID || $("#title").val()}`, "_blank");
}).addClass("read-button");
actionButtonsDiv.append(viewArticleButton);

$("<p></p>").text(
	"(Husk at gemme før du forhåndsviser / læser artiklen, så du kan se dine ændringer)"
).addClass("info-text").appendTo(actionButtonsDiv)


// Fixed save button
let fixedSaveButton = addButton("Gem artikel (ctrl + S)", saveArticle);
fixedSaveButton.appendTo(".main-container").addClass("fixed-save-button");

$(document).on("scroll", () => {
	if (scrollY > 200) {
		fixedSaveButton.css("opacity", "1");
	} else {
		fixedSaveButton.css("opacity", "0");
	}
}).trigger("scroll");


// Delete button
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


// Remove previous top section
$("#retningContainer, #niveauContainer").prependTo("#magazines-articles-form");
$("#withoutAuthor").remove();
$("#fixed-menu div:first input").prependTo("#magazines-articles-form").hide();
$("#fixed-menu").remove();
$("#widgets-container").remove();


// Reorder things a bit
let mainDiv = $("#magazines-articles-form > div:last");
mainDiv.find("> .form-data").slice(2, 4).prependTo(mainDiv);


// Video fix
let video = $("#article-video-preview");
let iframe = video.find("iframe");
if (iframe.length == 1) {
		video.width(500).height(500 / 16 * 9);
		iframe.css("height", "unset");
}

// Thumbnail fix
$("#magazines-articles-form > div:last .form-data:eq(3)").removeAttr("style");
$("#cropPreview").removeAttr("style");	


// Article elements
// https://stackoverflow.com/a/19033868
function swap(a, b) {
	var temp = $('<span>').hide();
	a.before(temp);
	b.before(a);
	temp.replaceWith(b);
};

function addElementButtons(element) {
	element.find(".content-span-container, #upArrow, #downArrow, #deleteContent").remove();

	let buttonsDiv = element.find(".element-buttons");

	let upButton = addButton(faIcon("arrow-up"), () => {
		let prev = element.prevAll(".form-data:first");
		if (prev.length == 1) {
			swap(element, prev);
			upButton.trigger("mouseout");
		}
	}).appendTo(buttonsDiv);
	let downButton = addButton(faIcon("arrow-down"), () => {
		let next = element.nextAll(".form-data:first");
		if (next.length == 1) {
				swap(element, next);
				downButton.trigger("mouseout");
		}
	}).appendTo(buttonsDiv);

	let deleteButton = addButton(faIcon("trash-can"), () => {
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
			let newHeight = Math.max($(textarea).prop('scrollHeight'), initialHeight);
			$(textarea).height(newHeight);

			window.scrollTo({top: initialTop});
		}).trigger("input");
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

	fixTextareas(element);
}

$("#form-inputs .form-data").each((_, element) => {
	fixArticleElement($(element));
});


// Renaming
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
	"Afsluttende link": [null, "Tekst til afsluttende link"],
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
			let inputs = $(header).nextAll().find("input[type=text], textarea");
			inputs = inputs.add($(header).nextAll("input[type=text], textarea"));
			inputs.each((i, input) => {
				if (renamePlaceholdersEntry[i]) $(input).attr("placeholder", renamePlaceholdersEntry[i]);
			});
		}
	});
}

$(".form-data").each((_, formData) => {
	renameFormData($(formData));
});


// Add new article elements
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
				} else {
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
			insertedElement[0].scrollIntoView({ block: "start", inline: "nearest", behavior: "smooth" });

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



// Metadata element
let metadataElement = $(".form-data:has(h5:contains(Sociale medier))").filter((_, e) => 
	$(e).find("textarea").val().includes("supercool-htg-nyt-date") // Have to update all the articles if I want this changed
);
// (If the only element is the hidden date or if there are no elements at all)
if (elements.length == metadataElement.length) {
	addNewElementButtons(true).prependTo("#form-inputs");
}

// https://stackoverflow.com/a/26915856
function getUuid1Date(uuid) {
	let splitUuid = uuid.split("-");
	let time = parseInt(`${splitUuid[2].slice(1)}${splitUuid[1]}${splitUuid[0]}`, 16);
	var timeMillis = Math.floor((time - 122192928000000000) / 10000);
	return new Date(timeMillis);
};

const articleDateNum = getUuid1Date(pageUuid).getTime();
function updateMetadata() {
	let html = `<data value="${articleDateNum}" id="supercool-htg-nyt-date"></data>`;
	if ($("input#calendar").is(":checked")) {
		let startDateNum = new Date($("input#date").val()).getTime();
		html += `<data value="${startDateNum}" id="supercool-htg-nyt-start-date"></data>`;
		let endDateNum = new Date($("input#endDate").val()).getTime();
		html += `<data value="${endDateNum}" id="supercool-htg-nyt-end-date"></data>`;
	}
	metadataElement.find("textarea").val(html);
}
$("#static-filters input, input#date, input#endDate").on("change", updateMetadata);

$(async () => {
	if (metadataElement.length == 0) {
		addMagazineInput("socials");
		metadataElement = $("#form-inputs .form-data:last");
		metadataElement.removeClass("form-data").hide();

		await saveArticle(false, true);
		await loadNewElement(metadataElement);
		reindexElements();
		updateMetadata();
		await saveArticle(false, true);
	} else {
		metadataElement.removeClass("form-data").hide();
		metadataElement.next(".new-element-buttons").remove();
	}
});


// Dividers
let divider = $("<hr></hr>").addClass("custom-divider");
divider.clone().insertAfter("#hideable-menu");
divider.clone().insertBefore("#form-inputs");

$("#dynamic-filters").closest(".form-data").css("margin-bottom", "0");


// Crop image translations
$(".modal h5:contains(Crop the image)").text("Beskær billede");
$(".modal button:contains(Cancel)").text("Annuller");


// Fix (???)
$("div:has(> #form-inputs)").removeAttr("style");