// Temporary


const buttonStyles = {
	default: {
			"background-color": "#2a6b37",
			"border": "2px solid #2a6b37",
			"border-radius": "8px",
			"color": "#ffffff",
			"cursor": "default",
			"padding": ".375rem .75rem",
			"font-weight": "normal",
			"transition": "background-color 0.15s ease-in, border-color 0.15s ease-in"
	},
	hover: {
			"background-color": "#3a924c",
			"border-color": "#3a924c",
			"cursor": "pointer"
	},
	click: {
			"background-color": "#41a455",
			"border-color": "#41a455",
	}
}

function addButton(html, clickCallback) {
	let button = $("<button></button>").html(html);
	button.css(buttonStyles.default).on("mouseover", () => {
			button.css(buttonStyles.hover);
	}).on("mousedown", () => {
			button.css(buttonStyles.click);
	}).on("mouseup", () => {
			button.css(buttonStyles.hover);
	}).on("mouseout", () => {
			button.css(buttonStyles.default);
	}).on("click", event => {
			event.preventDefault();
			if (clickCallback) clickCallback(event);
	});
	return button;
}

const checkFieldStyles = {
	default: {
			"background-color": "#ffffff",
			"border": "2px solid #2a6b37",
			"border-radius": "4px",
			"color": "#000000",
			"cursor": "default",
			"padding": ".375rem .75rem",
			"transition": "background-color 0.15s ease-in, color 0.15s ease-in",
			"margin-bottom": "0",
			"font-weight": "normal",
			"text-align": "center",
			"user-select": "none",
			"display": "flex",
			"align-items": "center",
			"justify-content": "center"
	},
	hover: {
			"background-color": "#3a924c",
			"color": "#ffffff",
			"cursor": "pointer"
	},
	click: {
			"background-color": "#41a455"
	},
	selectedDefault: {
			"color": "#ffffff",
			"background-color": "#2a6b37",
			"cursor": "default"
	},
	selectedHover: {
			"background-color": "#1d4926",
			"cursor": "pointer"
	},
	selectedClick: {
			"background-color": "#16371c"
	}
}

function fixCheckField(field, input) {
	let isRadio = input.attr("type") == "radio";

	field.css(checkFieldStyles.default).on("mouseover", () => {
			let selected = field.hasClass("selected");
			if (!(isRadio && selected)) field.css(selected ? checkFieldStyles.selectedHover : checkFieldStyles.hover);
	}).on("mousedown", () => {
			let selected = field.hasClass("selected");
			if (!(isRadio && selected)) field.css(selected ? checkFieldStyles.selectedClick : checkFieldStyles.click);
	}).on("mouseup", () => {
			field.css(field.hasClass("selected") ? (isRadio ? checkFieldStyles.selectedDefault : checkFieldStyles.selectedHover) : checkFieldStyles.hover);
	}).on("mouseout", () => {
			field.css(field.hasClass("selected") ? checkFieldStyles.selectedDefault : checkFieldStyles.default);
	});

	if (input.is(":checked")) field.css(checkFieldStyles.selectedDefault).addClass("selected");
	input.off().on("change", event => {
			if (isRadio) {
					field.siblings("label").css(checkFieldStyles.default).removeClass("selected");
					field.css(checkFieldStyles.selectedDefault).addClass("selected");
			} else if (input.is(":checked")) {
					field.css(checkFieldStyles.selectedHover).addClass("selected");
			} else {
					field.css(checkFieldStyles.hover).removeClass("selected");
			}
	});
}

function addRadioCheckField(text, id, name, value) {
	let input = $(`<input type="radio" name="${name}" value="${value}" id=${id}>`).hide();
	let field = $(`<label for="${id}">${text}</label>`);
	fixCheckField(field, input);
	return $([input[0], field[0]]);
}

const padStartElements = ["Brødtekst", "Mellemrubrik", "Citat"];

async function submitForm(keepAlive, silent) {
	let elementToPad = $("#form-inputs .form-data:first").filter((i, e) => padStartElements.includes($(e).find("h5").text()));
	let beforePaddedValue = elementToPad.find("textarea").val()
	elementToPad.find("textarea").val("\n" + beforePaddedValue);

	let formData = new FormData($("#magazines-articles-form")[0]);

	elementToPad.find("textarea").val(beforePaddedValue);

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

function renameDataForm(dataForm) {
	dataForm.find("h5").each((i, e) => {
			let headerText = $(e).text();
			if (renameHeaders[headerText]) $(e).text(renameHeaders[headerText]);

			headerText = $(e).text();
			let renamePlaceholdersEntry = renamePlaceholders[headerText];
			if (renamePlaceholdersEntry) {
					$(e).nextAll().find("input, textarea").add($(e).nextAll("input, textarea")).each((i, e) => {
							if (renamePlaceholdersEntry[i]) $(e).attr("placeholder", renamePlaceholdersEntry[i]);
					});
			}
	});
}

function styleDataForm(dataForm) {
	dataForm.css({
			"padding": "0",
			"margin-bottom": "30px"
	});
	if (dataForm.closest("#hideable-menu").length == 0) dataForm.css("max-width", "60%");
	dataForm.find("> *, #cropImagePreview > *").css({
			"position": "static",
			"margin-bottom": "5px"
	});
	dataForm.find("> h5").css({
			"font-size": "120%",
			"margin-bottom": "12px"
	});

	dataForm.find("textarea, input[type=\"text\"], input[type=\"datetime-local\"]").css({
			"padding": "7px 10px",
			"resize": "none",
			"border": "1px solid #676774",
			"font-size": "15px"
	});

	dataForm.find("#cropImagePreview").css("display", "block");
	dataForm.find("#cropPreview[src!=\"\"]").css({
			"border": "1px solid #c0c0c0",
			"max-width": "300px"
	});
	dataForm.find(".uploadCropImage").css("line-height", "unset");
}

function fixArticleElement(element) {
	element.find("#upArrow, #downArrow, #deleteContent").remove();

	let content = element.children();
	let wrapperDiv = $("<div class=\"wrapper\"></div>").css({
			"display": "flex",
			"gap": "15px"
	}).appendTo(element);
	let contentDiv = $("<div></div>").css({
			"flex": "auto"
	}).appendTo(wrapperDiv);
	content.appendTo(contentDiv);

	let buttonsDiv = $("<div></div>").css({
			"display": "flex",
			"flex-direction": "column",
			"gap": "7px"

	}).prependTo(wrapperDiv);

	let upButton = addButton(faIcon("arrow-up"), () => {
			let prev = element.prevAll(".form-data:first");
			if (prev.length == 1) {
					swap(element, prev);
					upButton.trigger("mouseout");
			}
	});
	let downButton = addButton(faIcon("arrow-down"), () => {
			let next = element.nextAll(".form-data:first");
			if (next.length == 1) {
					swap(element, next);
					downButton.trigger("mouseout");
			}
	});

	let pageUuid = window.location.pathname.match(/[\w-]+$/)[0];
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

	$([upButton[0], downButton[0], deleteButton[0]]).appendTo(buttonsDiv);

	let iFrame = element.find(".some-post");
	if (iFrame.length == 1) {
			iFrame.remove();

			/*let oldInput = element.find(".socialsInput");
			let name = oldInput.attr("name");
			let value = oldInput.val();
			oldInput.remove();

			let linkInput = $(`<input type="text" placeholder="Link, som skal indlejres på siden"">`).appendTo(contentDiv);
			let hiddenInput = $(`<input type="hidden" name="${name}">`).appendTo(contentDiv);
			linkInput.val(oldInput.val().match(/src="(.+)"/)[1]);*/

			let input = element.find(".socialsInput");
			input.on("change", event => {
					event.stopPropagation();
					/*let newVal = `<iframe height="100%" width="100%" src="${linkInput.val()}"></iframe>`;
					hiddenInput.val(newVal);*/
			}); //.trigger("change");
	}

	let header = element.find("h5");
	let headerText = header.text();

	if (header.prevAll().length > 0) {
			header.prependTo(contentDiv);
	}

	element.find("p:contains(\"Spørger\"), p:contains(\"Svarer\")").remove();
	if (headerText == "Svar") {
			let colors = element.find(".content-colors");
			if (colors.length == 1) {
					colors.appendTo(contentDiv);
			} else {
					// Whaaaatever
					let colors = $(`<div class="content-colors article-input-style" style="position: static; margin-bottom: 5px;"><span><label style="background-color: #a0873266" for="answer1000-yellow"></label><input id="answer3-yellow" class="content-color-btn" style="accent-color: #a0873266;" type="checkbox" name="content[answer1000][color]" value="#a0873266"></span><span><label style="background-color: #96555566" for="answer1000-red"></label><input id="answer3-red" class="content-color-btn" style="accent-color: #96555566;" type="checkbox" name="content[answer1000][color]" value="#96555566"></span><span><label style="background-color: #145a7366" for="answer1000-blue"></label><input id="answer3-blue" class="content-color-btn" style="accent-color: #145a7366;" type="checkbox" name="content[answer1000][color]" value="#145a7366"></span><span><label style="background-color: #466e6466" for="answer1000-green"></label><input id="answer3-green" class="content-color-btn" style="accent-color: #466e6466;" type="checkbox" name="content[answer1000][color]" value="#466e6466"></span></div>`);
					colors.find("input").removeAttr("name").each((i, e) => {
							$(e).on("change", () => {
									if ($(e).is(":checked")) {
											colors.find("input").prop("checked", false);
											$(e).prop("checked", true);
									}
							});
					});
					contentDiv.append(colors);
			}
			contentDiv.find(".content-colors").css({
					"margin-bottom": "0",
					"gap": "15px"
			});
	}

	element.find("[name$=\"[uuid]\"]").appendTo(element);
}

function loadNewElement(element) {
	let elementIndex = $("#form-inputs").children(".form-data").index(element) + 1;

	//let inputs = element.find("[name]").filter((i, e) => $(e).attr("name").match(/content\[[\w-]+\]/)); // not sure if .filter is necessary
	let inputs = element.find("input, textarea");
	let elementType = inputs.first().attr("name").match(/content\[([a-z-]+)/)[1];
	let elementName = `${elementType}${elementIndex}`;
	if (elementType == "link" || elementType == "question") {
			inputs.eq(0).attr("name", `content[${elementName}][caption]`);
			inputs.eq(1).attr("name", `content[${elementName}][value]`);
	} else if (elementType == "answer") {
			inputs.eq(0).attr("name", `content[${elementName}][caption]`);
			inputs.eq(1).attr("name", `content[${elementName}][value]`);
			inputs.slice(2, 6).attr("name", `content[${elementName}][color]`);
	} else {
			inputs.first().attr("name", `content[${elementName}][value]`);
	}

	let res = fetch(window.location.href).then(res => res.text()).then(html => {
			let formHtml = html.match(/<form[^\n]+id="magazines-articles-form".+?<\/form>/s)[0];
			let formData = new FormData($(formHtml)[0]);
			let uuidDataName = `content[${elementType}${elementIndex}][uuid]`;
			let uuid = formData.get(uuidDataName);
			element.append(`<input type="hidden" name="${uuidDataName}" value="${uuid}">`);
	});
}

function waitForWindowFocus() {
	return new Promise((res, rej) => {
			$(window).on("focus", () => {
					setTimeout(res, 200);
					$(window).off("focus");
			});
	});
}

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

function addNewElementButtons(removeOnAdd) {
	let div = $("<div></div>").css({
			"display": "flex",
			"justify-content": "flex-start",
			"align-items": "center",
			"gap": "5px",
			"margin": "30px 0"
	});
	$("<span>Tilføj element her:&nbsp;&nbsp;</span>").css("font-weight", "normal").appendTo(div);
	for (let { text, name } of elementTypes) {
			div.append(addButton(text, async () => {
					addMagazineInput(name); // Built-in function
					let insertedElement = $("#form-inputs .form-data:last").removeAttr("id").insertAfter(div);

					if (name == "illustration") {
							insertedElement.hide();

							let fileInput = insertedElement.find("input[type=\"file\"]");
							fileInput.trigger("click");

							await waitForWindowFocus();
							if (fileInput[0].files.length == 0) insertedElement.remove();
							return;
					}

					if (removeOnAdd) div.remove();

					let newElementButtons = addNewElementButtons();
					insertedElement.after(newElementButtons);
					styleDataForm(insertedElement);
					fixArticleElement(insertedElement);
					renameDataForm(insertedElement);
					insertedElement[0].scrollIntoView({ block: "start", inline: "nearest", behavior: "smooth" });

					let elementWasAdded = await submitForm(false, true);
					if (elementWasAdded) {
							loadNewElement(insertedElement);
					} else {
							insertedElement.remove();
							newElementButtons.remove();
							$.notify("Kunne ikke tilføje element", "error");
					}
			}));
	}

	return div;
}

// https://stackoverflow.com/a/19033868
function swap(a, b) {
	var temp = $('<span>').hide();
	a.before(temp);
	b.before(a);
	temp.replaceWith(b);
};

function faIcon(iconName) {
	return `<i class=\"fas fa-${iconName}\" aria-hidden=\"true\"></i>`;
}

const categoryOrder = [
	"Nyt", "Inspir", "FAQ", "Academy", "Hacks", "Folk", "Mødesteder", "Kalender"
];

const categoryIcons = {
	"Inspir": "brain",
	"Nyt": "exclamation",
	"FAQ": "heart",
	"Academy": "graduation-cap",
	"Hacks": "lightbulb",
	"Folk": "user",
	"Mødesteder": "users",
	"Kalender": "calendar-alt"
};

$(() => {
	let isChefredaktør = $("input[name=\"status\"]").length > 0;
	if (!isChefredaktør) return;

	// General
	$("head").append(`<style>
.notifyjs-container { font-size: 24px; padding: 10px; }
.nav-item { transition: background-color 0.15s ease-in; }
.nav-item:hover { background-color: #eeeeee; }
.nav-item:active { background-color: #dddddd; }
.form-data { width: unset !important; }
label .fas { width: 16px; text-align: center; }
</style>`);
	$(".alert").remove();

	$(".page-content").css("padding", "10px 30px");

	$("#title").on("keyup change clear", () => {
			$("title").text(`Rediger "${$("#title").val() || "[Unavngivet]"}"`);
	}).trigger("change");

	$("#magazines-articles-form").on("click", event => { // Helps to stop the page from mysteriously refreshing on button click
			event.stopPropagation();
	});

	// Header and navbar (sort of ugly code)
	$(".header-logo").css("width", "unset");
	$(".header-logo .site-title").css("font-size", "21px");

	$(".sidebar").css({
			"min-height": "calc(100vh - 50px)",
			"width": "180px",
			"transition": "unset"
	});
	let skolebladNav = $(".sidebar .nav-item:first");
	let mainMenuNav = skolebladNav.clone().prependTo(".sidebar .navbar-nav");
	let backNav = skolebladNav.clone().prependTo(".sidebar .navbar-nav");
	skolebladNav.html(skolebladNav.html().replace("htg-nyt", "læs htg-nyt"));
	skolebladNav.find(".nav-link").attr("href", "/?type=new");
	backNav.find("i").removeClass("fa-newspaper").addClass("fa-circle-left");
	backNav.html(backNav.html().replace("htg-nyt", "Gem og luk"));
	backNav.find(".nav-link").attr("href", "/editor");
	mainMenuNav.find("i").removeClass("fa-newspaper").addClass("fa-house");
	mainMenuNav.html(mainMenuNav.html().replace("htg-nyt", "Hovedmenu"));
	mainMenuNav.find(".nav-link").attr("href", "/hovedmenu");
	let logoutNav = $(".sidebar .nav-item:last");
	logoutNav.css({
			"position": "unset",
			"bottom": "unset"
	});
	logoutNav.find(".nav-link").prepend(faIcon("right-from-bracket"));

	// Top
	$("#hideable-menu").css({
			"justify-content": "space-between",
			"gap": "7%"
	}).append("<div></div>");
	$("#hideable-menu > div").removeAttr("style").css("width", i => (["50%", "15rem", "12rem"])[i]);

	// Custom save, preview and viewArticle buttons
	let rightMostDiv = $("#hideable-menu > div:eq(2)");

	let saveButton = addButton("Gem artikel", () => { submitForm() });
	let previewLink = $("#preview-article").parent().attr("href");
	let previewButton = addButton("Forhåndsvis artikel", () => {
			window.open(previewLink, "_blank");
	});
	let viewArticleButton = addButton("Læs artikel (hvis offentlig)", () => {
			let articlePath = $("#title").val().toLowerCase().replaceAll(" ", "_");
			window.open(`/artikel/${encodeURIComponent(articlePath)}`, "_blank");
	})

	rightMostDiv.css({
			"display": "flex",
			"flex-direction": "column",
			"gap": "10px",
			"margin-top": "10px"
	});
	$([saveButton[0], previewButton[0], viewArticleButton[0]]).appendTo(rightMostDiv);

	$("<p>(Husk at gemme før du forhåndsviser / læser artiklen)</p>").css({
			"color": "#555555",
			"text-align": "center"
	}).appendTo(rightMostDiv);

	// Category and tags
	$("#static-filters, #dynamic-filters").css({
			"display": "flex",
			"flex-wrap": "wrap",
			"column-gap": "5px",
			"row-gap": "4px"
	});
	$("#static-filters").css("justify-content", "start");
	$("#dynamic-filters").css("justify-content", "space-between");
	$("<div></div>").css({"flex": "auto"}).appendTo("#dynamic-filters"); // https://stackoverflow.com/a/34816625

	$("#static-filters input").slice(8).remove();
	$("#static-filters label").slice(8).remove();
	$("#static-filters label").toArray().sort((a, b) => {
			return categoryOrder.indexOf($(a).text()) - categoryOrder.indexOf($(b).text());
	}).forEach(e => {
			let icon = categoryIcons[$(e).text()];
			$(e).html(`${faIcon(icon)}&nbsp;&nbsp;${$(e).text()}`);
			$(`#${$(e).attr("for")}`).appendTo("#static-filters");
			$(e).appendTo("#static-filters");
	});

	$(".check-toolbar label").each((i, field) => {
			let input = $(`#${$(field).attr("for")}`);
			fixCheckField($(field), input);
	});

	// Custom visibility and author fields
	let customDiv = $("#hideable-menu > div:eq(1)");
	let visibilityDiv = $("<div class=\"form-data\"></div>").appendTo(customDiv).append("<h5>Synlighed</h5>");
	let visibilityButtonsDiv = $("<div></div>").css({
			"display": "flex",
			"gap": "5px"
	}).appendTo(visibilityDiv)
	addRadioCheckField("Offentlig", "offentlig", "status", "active").css("flex", "auto").appendTo(visibilityButtonsDiv);
	addRadioCheckField("Ikke offentlig", "ikke-offentlig", "status", "inactive").css("flex", "auto").appendTo(visibilityButtonsDiv);

	let articleVisibility = $("#fixed-menu input[name=\"status\"]:checked").attr("value");
	visibilityButtonsDiv.find("label").eq(articleVisibility == "active" ? 0 : 1).trigger("click").trigger("mouseout");

	let authorDiv = $("<div class=\"form-data\"></div>").appendTo(customDiv).append("<h5>Skribent</h5>");
	let authorButtonsDiv = $("<div></div>").css({
			"display": "flex",
			"gap": "5px"
	}).appendTo(authorDiv)
	let authorName = $("#fixed-menu h5:eq(1)").text();
	addRadioCheckField(authorName, "with-author", "withoutAuthor", "false").css("flex", "auto").appendTo(authorButtonsDiv);
	addRadioCheckField("Anonym", "without-author", "withoutAuthor", "true").css("flex", "auto").appendTo(authorButtonsDiv);

	let isAnonymous = $("#withoutAuthor").is(":checked");
	authorButtonsDiv.find("label").eq(isAnonymous ? 1 : 0).trigger("click").trigger("mouseout");

	// General content
	$(".form-data").each((i, e) => {
			styleDataForm($(e));
	});
	$("#form-inputs .form-data").each((i, e) => {
			fixArticleElement($(e));
	});
	$(".form-data").each((i, e) => {
			renameDataForm($(e));
	});

	// Delete the entire top menu
	$("#retningContainer, #niveauContainer").prependTo("#magazines-articles-form");
	$("#withoutAuthor").remove();
	$("#fixed-menu div:first input").prependTo("#magazines-articles-form").hide();
	$("#fixed-menu").remove();

	// Custom add element buttons
	$(".content-buttons").remove();
	let elements = $("#form-inputs .form-data");
	if (elements.length > 0) {
			elements.each((i, e) => {
					$(e).find(".added-content-buttons").remove();
					$(e).after(addNewElementButtons(false));
			});
	} else {
			$("#form-inputs").append(addNewElementButtons(true));
	}

	// Calendar fix
	$("#static-filters label").each((i, e) => {
			$(e).on("click", () => {
					if ($(e).attr("for") == "calendar") {
							$("#date-input").show();
					} else {
							$("#date-input").hide();
					}
			});
	});

	// Video fix
	let video = $("#article-video-preview");
	let iframe = video.find("iframe");
	if (iframe.length == 1) {
			video.width(500).height(500 / 16 * 9);
			iframe.css("height", "unset");
	}

	// Reorder things a bit
	let mainDiv = $("#magazines-articles-form > div:last");
	mainDiv.find("> .form-data").slice(2, 4).prependTo(mainDiv);

	// Dividers
	let divider = $("<hr></hr>").css({
			"height": "1px",
			"background-color": "#dddddd",
			"border": "none",
			"margin": "30px 0",
			"position": "relative",
			"width": "calc(100% + 60px)",
			"left": "-30px"
	});
	$("#dynamic-filters").closest(".form-data").css("margin-bottom", "0");
	divider.clone().prependTo(mainDiv);
	divider.clone().prependTo("#form-inputs");

	// Extra
	$("<p>(Større billeder kan godt tage lidt tid om at registreres i systemet)</p>").css({
			"color": "#555555"
	}).appendTo("#magazines-articles-form > div:last > .form-data:eq(3)");
});

$(window).on("beforeunload", () => {
	submitForm(true);
	const time = Date.now();
	while ((Date.now() - time) < 50) {}
});