let isChefredaktør = ($("input[name=\"status\"]").length > 0);
if (!isChefredaktør) throw Error("Ignorer denne fejl :)");

let pageUuid = window.location.pathname.match(/[\w-]+$/)[0];


// TODO
$("#widgets-container").remove();


// Saving
async function saveArticle(keepAlive, silent) {
	let formData = new FormData($("#magazines-articles-form")[0]);

	let res = await fetch(window.location.href, {
			method: "POST",
			body: formData,
			keepalive: keepAlive
	});
	if (!silent) {
			if (res.ok) {
					$.notify("Artikel gemt!", "success");
			} else {
					$.notify("Artiklen kunne ikke gemmes :/\nGem eventuelt dine ændringer midlertidigt et andet sted", "error");
			}
	}
	return res.ok;
}

$(window).on("beforeunload", () => {
	saveArticle(true);
	const time = Date.now();
	while ((Date.now() - time) < 50) {}
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


// Nav menu
let skolebladNav = $(".sidebar .nav-item:first");
skolebladNav.html(skolebladNav.html().replace("htg-nyt", "læs htg-nyt"));
skolebladNav.find(".nav-link").attr("href", "/");

let backNav = skolebladNav.clone().insertBefore(skolebladNav);
backNav.html(backNav.html().replace("læs htg-nyt", "Gem og luk"));
backNav.find("i").removeClass("fa-newspaper").addClass("fa-circle-left");
backNav.find(".nav-link").attr("href", "/editor");

let mainMenuNav = skolebladNav.clone().insertBefore(skolebladNav);
mainMenuNav.html(mainMenuNav.html().replace("læs htg-nyt", "Hovedmenu"));
mainMenuNav.find("i").removeClass("fa-newspaper").addClass("fa-house");
mainMenuNav.find(".nav-link").attr("href", "/hovedmenu");

let logoutNav = $(".sidebar .nav-item:last .nav-link").prepend(
	"<i class=\"fas fa-right-from-bracket\" aria-hidden=\"true\"></i>"
);


// Editor general
$(".alert").remove();

$("#title").on("keyup change clear", () => {
	$("title").text(`Rediger "${$("#title").val() || "[Unavngivet]"}"`);
}).trigger("change");

// Prevent page refreshing
$("#magazines-articles-form").on("click", event => {
	event.stopPropagation();
});


// Top section setup
let firstDiv = $("#hideable-menu > div:eq(0)");
let middleDiv = $("#hideable-menu > div:eq(1)");
let actionButtonsDiv = $("<div></div>").addClass("action-buttons").appendTo("#hideable-menu");
$("#hideable-menu > div").removeAttr("style").css("width", i => 
	(["50%", "15rem", "12rem"])[i]
);


// Categories and tags
// 'categoryChanges' variable from general.js
let ctgChangeEntries = Object.entries(categoryChanges);
for (let [ name, ctgChange ] of ctgChangeEntries) {
	let input = $(`#static-filters #${name}`);
	let uuid = input.attr("value");

	let newCtgRadio = addCheckField("radio",
		ctgChange.nav, "type", uuid, name
	);

	// wtf????
	$(() => {
		let label = newCtgRadio.eq(1);
		label.html(`${faIcon(ctgChange.icon)}&nbsp;&nbsp;${label.html()}`)
	});

	if (input.is(":checked")) newCtgRadio.prop("checked", true);
	$(newCtgRadio).appendTo("#static-filters");
}
$("#static-filters :not(.custom-input):not(.custom-field)").remove();

$("#dynamic-filters label").each((_, tag) => {
	let input = $(`#${$(tag).attr("for")}`);
	let newTagCheckbox = addCheckField("checkbox",
		$(tag).text(), 
		$(input).attr("name"), $(input).attr("value"), $(input).attr("id")
	);
	if (input.is(":checked")) newTagCheckbox.prop("checked", true);
	$("#dynamic-filters").append(newTagCheckbox);

	$(tag).remove(); input.remove();
});
$("<div></div>").css({"flex": "auto"}).appendTo("#dynamic-filters");

$(() => {
	// Prevent page refreshing
	$("#dynamic-filters input").off();

	// Calendar fix (must be done after ready for some reason)
	$("#static-filters label").each((_, ctg) => {
		$(ctg).on("click", () => {
			if ($(ctg).attr("for") == "calendar") {
				$("#date-input").show();
			} else {
				$("#date-input").hide();
			}
		});
	});
})


// Visibility buttons
let visibilityDiv = $("<div></div>").addClass("form-data");
visibilityDiv.appendTo(middleDiv).append("<h5>Synlighed</h5>");

let visibilitySelectDiv = $("<div></div>").addClass("custom-select-div check-toolbar");
visibilitySelectDiv.appendTo(visibilityDiv);

addCheckField("radio", "Offentlig", "status", "active", "offentlig").appendTo(visibilitySelectDiv);
addCheckField("radio", "Ikke offentlig", "status", "inactive", "ikke-offentlig").appendTo(visibilitySelectDiv);

let articleVisibility = $("#fixed-menu input[name=\"status\"]:checked").attr("value");
visibilitySelectDiv.find("input").eq(articleVisibility == "active" ? 0 : 1).prop("checked", true);


// Author buttons
let authorDiv = $("<div></div>").addClass("form-data");
authorDiv.appendTo(middleDiv).append("<h5>Skribent</h5>");

let authorSelectDiv = $("<div></div>").addClass("custom-select-div check-toolbar");
authorSelectDiv.appendTo(authorDiv);

let authorName = $("#fixed-menu h5:eq(1)").text();
addCheckField("radio", authorName, "withoutAuthor", "false", "with-author").appendTo(authorSelectDiv);
addCheckField("radio", "Anonym", "withoutAuthor", "true", "without-author").appendTo(authorSelectDiv);

let isAnonymous = $("#withoutAuthor").is(":checked");
authorSelectDiv.find("input").eq(isAnonymous ? 1 : 0).prop("checked", true);


// Save, preview and view article buttons
let saveButton = addButton("Gem artikel", saveArticle);
actionButtonsDiv.append(saveButton);	

let previewButton = addButton("Forhåndsvis artikel", () => {
		window.open(`/preview-article/${pageUuid}`, "_blank");
});
actionButtonsDiv.append(previewButton);

let viewArticleButton = addButton("Læs artikel", () => {
	let articlePath = $("#title").val().toLowerCase().replaceAll(" ", "_");
	window.open(`/artikel/${encodeURIComponent(articlePath)}`, "_blank");
})
actionButtonsDiv.append(viewArticleButton);

$("<p></p>").text(
	"(Husk at gemme før du forhåndsviser / læser artiklen)"
).addClass("info-text").appendTo(actionButtonsDiv);


// Remove previous top section
$("#retningContainer, #niveauContainer").prependTo("#magazines-articles-form");
$("#withoutAuthor").remove();
$("#fixed-menu div:first input").prependTo("#magazines-articles-form").hide();
$("#fixed-menu").remove();


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

function waitForWindowFocus() {
	return new Promise((res, rej) => {
			$(window).on("focus", () => {
					setTimeout(res, 200);
					$(window).off("focus");
			});
	});
}

function addElementButtons(element) {
	element.find("#upArrow, #downArrow, #deleteContent").remove();

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
				if ($("#form-inputs").children(".form-data").length == 0) addNewElementButtons(true).appendTo("#form-inputs");
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

	let colors = element.find(".content-colors");
	if (colors.length == 1) {
		colors.appendTo(contentDiv);
		return;
	}
	
	let colorsDiv = $("<div></div>").addClass("content-colors article-input-style");
	colorsDiv.appendTo(contentDiv);
	$(`<span>
			<label style="background-color: #a0873266"></label>
			<input class="content-color-btn" style="accent-color: #a0873266;" type="checkbox" name="content[blabla][color]" value="#a0873266">
		</span>`).appendTo(colorsDiv);
	$(`<span>
			<label style="background-color: #96555566"></label>
			<input class="content-color-btn" style="accent-color: #96555566;" type="checkbox" name="content[blabla][color]" value="#96555566">
		</span>`).appendTo(colorsDiv);
	$(`<span>
			<label style="background-color: #145a7366"></label>
			<input class="content-color-btn" style="accent-color: #145a7366;" type="checkbox" name="content[blabla][color]" value="#145a7366">
		</span>`).appendTo(colorsDiv);
	$(`<span>
			<label style="background-color: #466e6466"></label>
			<input class="content-color-btn" style="accent-color: #466e6466;" type="checkbox" name="content[blabla][color]" value="#466e6466">
		</span>`).appendTo(colorsDiv);
	
	colors.find("input").each((_, clr) => {
		$(clr).on("change", () => {
			if ($(clr).is(":checked")) {
				colors.find("input").prop("checked", false);
				$(clr).prop("checked", true);
			}
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
}

$("#form-inputs .form-data").each((_, element) => {
	fixArticleElement($(element));
});


// Renaming
const renameHeaders = {
	"Static filters": "Kategori",
	"Dynamic filters": "Tags",
	"DATE": "Startdato",
	"END DATE": "Slutdato",
	"ADDRESS": "Adresse",
	"LOCATION": "Lokation",
	"RUBRIK": "Rubrik",
	"MANCHET": "Manchet",
	"VIDEO": "Video",
	"THUMBNAIL": "Billede",
	"SoMe": "Sociale medier"
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
	{ text: "Illustration", name: "illustration" },
	{ text: "Citat", name: "quote" },
	{ text: "Spørgsmål", name: "question" },
	{ text: "Svar", name: "answer" },
	{ text: "Afsluttende link", name: "link" },
	{ text: "Sociale medier", name: "socials" }
];

function loadNewElement(element) {
	let elementIndex = $("#form-inputs").children(".form-data").index(element) + 1;

	let inputs = element.find("input, textarea");
	let elementType = inputs.first().attr("name").match(/content\[([a-z-]+)/)[1];
	let elementName = `${elementType}${elementIndex}`;

	inputs.each((_, input) => {
		$(input).attr("name",
			$(input).attr("name").replace(/(?<=^content\[)[^\]]+/, elementName)
		);
	});

	fetch(window.location.href).then(res => res.text()).then(html => {
		let formHtml = html.match(/<form[^\n]+id="magazines-articles-form".+?<\/form>/s)[0];
		let formData = new FormData($(formHtml)[0]);
		let uuidDataName = `content[${elementType}${elementIndex}][uuid]`;
		let uuid = formData.get(uuidDataName);
		element.append(`<input type="hidden" name="${uuidDataName}" value="${uuid}">`);
	});
}

function addNewElementButtons(removeOnAdd) {
	let wrapper = $("<div></div>").addClass("new-element-buttons");
	$("<span>Tilføj element her:&nbsp;&nbsp;</span>").appendTo(wrapper);

	for (let { text, name } of elementTypes) {
		let button = addButton(text, async () => {
			addMagazineInput(name); // Built-in function
			let insertedElement = $("#form-inputs .form-data:last")
			insertedElement.removeAttr("id").insertAfter(wrapper);

			if (name == "illustration") {
				insertedElement.hide();

				let fileInput = insertedElement.find("input[type=\"file\"]");
				fileInput.trigger("click");

				await waitForWindowFocus();
				if (fileInput[0].files.length == 0) insertedElement.remove();
				return;
			}

			if (removeOnAdd) wrapper.remove();

			// that name lol
			let newNewElementButtons = addNewElementButtons().insertAfter(insertedElement); 
			fixArticleElement(insertedElement);
			renameFormData(insertedElement);
			insertedElement[0].scrollIntoView({ block: "start", inline: "nearest", behavior: "smooth" });

			let elementWasAdded = await saveArticle(false, true);
			if (elementWasAdded) {
					loadNewElement(insertedElement);
			} else {
					insertedElement.remove();
					newNewElementButtons.remove();
					$.notify("Kunne ikke tilføje element", "error");
			}
		});
		wrapper.append(button);
	}
	return wrapper;
}

let elements = $("#form-inputs .form-data");
if (elements.length > 0) {
	elements.each((_, element) => {
		$(element).find(".added-content-buttons").remove();
		$(element).after(addNewElementButtons(false));
	});
} else {
	$("#form-inputs").append(addNewElementButtons(true));
}


// Dividers
let divider = $("<hr></hr>").addClass("custom-divider");
divider.clone().insertAfter("#hideable-menu");
divider.clone().insertBefore("#form-inputs");

$("#dynamic-filters").closest(".form-data").css("margin-bottom", "0");