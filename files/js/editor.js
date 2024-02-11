let isChefredaktør = ($("button:contains('GLOBAL')").length > 0);
if (!isChefredaktør) throw Error("Ignorer denne fejl :)");

const skolebladUuid = "9e106940-5c97-11ee-b9bf-d56e49dc725a";
let dataTable; // Is intialized later


// Util functions
// https://stackoverflow.com/a/26915856
function getUuid1Date(uuid) {
	let splitUuid = uuid.split("-");
	let time = parseInt(`${splitUuid[2].slice(1)}${splitUuid[1]}${splitUuid[0]}`, 16);
	var timeMillis = Math.floor((time - 122192928000000000) / 10000);
	return new Date(timeMillis);
};

function padNum(num, length) {
	return num.toString().padStart(2, '0');
}

function capitalize(str) {
	return str.slice(0, 1).toUpperCase() + str.slice(1);
}

function formatDate(date) {
	//let weekday = date.toLocaleString("da-DK", {weekday: "long"});
	// `${weekday} d. ...`
	return capitalize(`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} kl ${date.getHours()}:${padNum(date.getMinutes(), 2)}`);
}


// Nav menu
let skolebladNav = $(".sidebar .nav-item:first");
skolebladNav.html(skolebladNav.html().replace("htg-nyt", "læs htg-nyt"));
skolebladNav.find(".nav-link").attr("href", "/");

let mainMenuNav = skolebladNav.clone().insertBefore(skolebladNav);
mainMenuNav.html(mainMenuNav.html().replace("læs htg-nyt", "Hovedmenu"));
mainMenuNav.find("i").removeClass("fa-newspaper").addClass("fa-house");
mainMenuNav.find(".nav-link").attr("href", "/hovedmenu");

let logoutNav = $(".sidebar .nav-item:last .nav-link").prepend(
	"<i class=\"fas fa-right-from-bracket\" aria-hidden=\"true\"></i>"
);


// Overview general
$("title").text("Redaktør | HTG-NYT");
$("h3").text("Skolebladet 'HTG-NYT'");
$(".alert, br, .filter-toolbar").remove();

let newArticleButton = $(".admin-section-title .btn");
newArticleButton.text("+ Ny artikel");


// Update order button
let updateOrderButton = newArticleButton.clone().insertAfter(newArticleButton);
updateOrderButton.attr("id", "update-order").text("Opdater rækkefølge (dette kan tage lang tid)");
updateOrderButton.removeAttr("href").on("click", () => {
	$.notify("Opdaterer...", "warn");

	let rows = $("#table tbody tr").toArray();
	rows.sort((a, b) => {
			let aTime = dataTable.cell(a, 2).data();
			let bTime = dataTable.cell(b, 2).data();
			return aTime - bTime;
	});

	(async () => {
			for (let row of rows) {
					let articleName = $(row).find("td:eq(0)").text().trim();
					let articleUuid = $(row).attr("data-article-uuid");
					let currentVisibilityButton = $(row).find("td:eq(4) button.current");

					let formData = new FormData();
					formData.append("uuid", articleUuid);
					formData.append("action", (["active", "inactive"])[currentVisibilityButton.index()]);
					await fetch(`/admin/articles/change-status/${skolebladUuid}`, {
							method: "POST",
							body: formData,
					});
					await new Promise((res, rej) => { setTimeout(res, 750); });
					$.notify(`Artiklen "${articleName}" opdateret!`, "success");
			}
	})();
});

$("<p id=\"sort-info\"><- Hvad? Hold musen over mig</p>").insertAfter(updateOrderButton).attr("title",
	"Normalt står artikler inde på skolebladet i rækkefølge efter hvornår de sidst blev ændret.\nTryk for at sortere alle artikler efter deres oprettelsesdato (som det burde være).\nRækkefølgen bliver dog gal igen så snart en ældre artikel ændres :/"
);


// Immediate table changes (new columns w/ dates and buttons)
function addVisibilityButtons(row) {
	let visButton = $("<button></button>").addClass("btn vis-button");
	let wrapper = $("<div></div>").addClass("vis-buttons-wrapper");
	wrapper.appendTo($(row).find("td:eq(4)")).append(
		visButton.clone().text("Offentlig"),
		visButton.clone().text("Ikke offentlig"),
		//visibilityButton.clone().text("Deaktiveret") // No different
	);

	let articleName = $(row).find("td:eq(0)").text().trim();
	let articleUuid = $(row).attr("data-article-uuid");
	wrapper.children().each((i, btn) => {
		$(btn).on("click", () => {
			if ($(btn).hasClass("current")) return;

			let formData = new FormData();
			formData.append("uuid", articleUuid);
			formData.append("action", (["active", "inactive"])[i]);
			fetch(`/admin/articles/change-status/${skolebladUuid}`, {
				method: "POST",
				body: formData,
			}).then(res => {
				if (res.ok) {
					$.notify(`Artiklen "${articleName}" blev sat til '${$(btn).text().trim()}'`, "success");
					$(row).find("td:eq(4) button.current").removeClass("current");
					$(btn).addClass("current");
					$(row).removeClass("public private").addClass((["public", "private"])[i]);
				} else {
					$.notify("Kunne ikke ændre på artiklens synlighed", "error");
				}
			});
		});
	});
}

function addReadArticleButton(row) {
	let articlePath = $(row).find("td:eq(0)").text().trim().toLowerCase().replaceAll(" ", "_");
	let articleUrl = `/artikel/${encodeURIComponent(articlePath)}`;

	let readArticleButton = $(`<a href="${articleUrl}" target="_blank">Læs artikel</a>`).addClass("btn btn-info read-button");
	readArticleButton.appendTo($(row).find("td:eq(5) .action-buttons-wrapper"));

	readArticleButton.on("click", event => {
		if (!$(row).is(".public")) event.preventDefault();
	});
}

function addEditButton(row) {
	let editLink = $(row).data("edit-link");
	let editAnchor = $(`<a href="${editLink}">Rediger</a>`).addClass("btn btn-info edit-button");
	editAnchor.appendTo($(row).find("td:eq(5) .action-buttons-wrapper"))
}

function addDeleteButton(row) {
	let deleteButton = $("<button>Slet</button>").addClass("btn delete-button");
	deleteButton.appendTo($(row).find("td:eq(5) .action-buttons-wrapper"));

	let articleName = $(row).find("td:eq(0)").text().trim();
	let articleUuid = $(row).data("article-uuid");
	deleteButton.on("click", event => {
			if (!window.confirm(`Er du sikker på, at du vil slette artiklen "${articleName}" permanent?`)) return;

			let formData = new FormData();
			formData.append("uuid", articleUuid);
			fetch(`/admin/articles/delete-article/${skolebladUuid}`, {
					method: "POST",
					body: formData,
			}).then(res => res.json()).then(data => {
					if (data.status == "success") {
							$(event.target).closest("tr").remove();
							$.notify(`Artiklen "${articleName}" blev slettet`, "success");
					} else {
							$.notify("Kunne ikke slette artikel", "error");
					}
			});
	});
}

$("#table thead tr:eq(0) th:eq(-1)").text("Handlinger").before("<th>Oprettelsesdato</th><th>Kategori</th><th>Synlighed</th>");
$("#table thead tr:eq(1) th:eq(-1)").before("<th></th><th></th><th></th>");
$("#table tbody tr").each((i, row) => {
	let articleUuid = $(row).find("td:eq(-1) button:eq(0)").data("article");
	$(row).attr("data-article-uuid", articleUuid);
	$(row).find("td:eq(-1)").before(`<td></td><td>...</td><td></td>`);

	let creationDateTime = getUuid1Date(articleUuid).getTime();
	$(row).find("td:eq(2)").text(creationDateTime);

	addVisibilityButtons(row);

	let actionButtonsDiv = $("<div></div>").addClass("action-buttons-wrapper")
	$(row).find("td:eq(5)").append(actionButtonsDiv);
	$(row).find("td:eq(5) button").remove();

	addReadArticleButton(row);

	let editLinkNode = $(row).find(".edit-a");
	let editLink = editLinkNode.attr("href")
	$(row).attr("data-edit-link", editLink);
	addEditButton(row);

	addDeleteButton(row);
});


// Initialize DataTable
// 'categoryChanges' variable from general.js
// indentation nightmare
dataTable = $("#table").DataTable({
	language: {
		"zeroRecords": "Ingen resultater fundet for denne søgning"
	},
	ordering: true,
	order: [[2, 'desc']],
	paging: false,
	searching: true,
	columnDefs: [
		{
			target: 1, render: (data, type, row) => {
				if (data == "-") {
					// This character will most likely always be sorted last
					return type == "sort" ? "末" : (type == "filter" ? "" : data);
				} else {
					return data;
				}
			}
		}, {
				target: 2, render: (data, type, row) => {
					return type == "display" || type == "filter" ? formatDate(new Date(parseInt(data, 10))) : data;
				}, orderSequence: ["desc", "asc"]
		}, {
			target: 3, render: (data, type, row) => {
				let ctgChanges = Object.values(categoryChanges).find(e => e.oldTitle == data);
				if (data == "-" || !ctgChanges) {
					return type == "sort" ? "末" : (type == "filter" ? "" : "-");
				} else if (type == "display") {
					return `<i class="fas fa-${ctgChanges.icon}" aria-hidden="true"></i>&nbsp;&nbsp;${ctgChanges.nav}`;
				} else if (type == "sort" || type == "filter") {
					return ctgChanges.nav;
				} else {
					return data;
				}
			}
		}, {
				targets: [4, 5], orderable: false
		}, {
				targets: [0, 1, 2, 3], width: "17%"
		}
	]
});

$("#table tfoot, #table caption, #table_filter, #table_info").remove();


// Search fields
let searchFields = $("<tr></tr>").appendTo("#table thead");
for (let i = 0; i < 4; i++) {
	let column = dataTable.column(i);
	let columnTitle = $(column.header()).text().toLowerCase();
	let input = $(`<input type="text" placeholder="Søg efter ${columnTitle}"></input>`);
	input.on("keyup change clear", () => {
		console.log(column, column.search, column.search(), input.val());
		if (column.search() != input.val()) {
			column.search(input.val()).draw();
		}
	});
	$(`<th class="tableSearch"></th>`).append(input).appendTo(searchFields);
}
searchFields.append("<th></th><th></th>");


// Table changes which need requests
$("#table tbody tr").each((i, e) => {
	let editLink = $(e).data("edit-link")
	if (!editLink) return;

	fetch(editLink).then(res => res.text()).then(html => {
			let filtersElement = html.match(/<div id="static-filters".+?<\/div>/s)[0];
			let category = $(filtersElement).find("input:checked").next("label").text();
			dataTable.cell($(e).find("td:eq(3)")).data(`${category || "-"}`);

			let formHtml = html.match(/<form[^\n]+id="magazines-articles-form".+?<\/form>/s)[0];
			let status = $(formHtml).serialize().match(/status=(\w+)/)[1];
			let visButtonIndex = (status == "active") ? 0 : 1;
			$(e).find("td:eq(4) button").eq(visButtonIndex).addClass("current");
			$(e).addClass(status == "active" ? "public" : "private");
	});
});